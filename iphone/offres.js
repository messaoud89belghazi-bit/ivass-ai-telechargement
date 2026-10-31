/* ⭐ Offres Ivass AI sur le téléphone : limite de clés API, code licence, parrainage, abonnement PayPal.
   Mêmes règles que le PC (licence-core.js). Les outils Pro/Expert ne concernent que l'application PC.
   Application iPhone (App Store) : pas d'achat dans l'application ; l'offre achetée ailleurs s'applique avec le code licence. */
(function () {
  'use strict';
  const L = window.IvassLicence;
  const JOUR = 864e5, VERIF_MS = 6 * 3600e3;

  window.IvassOffres = function ({ N, getSettings, saveSettings, server, publicKey, toast, T = (s, ...a) => { let i = 0; return String(s).replace(/\{\}/g, () => (a[i] === undefined ? '' : a[i++])); } }) {
    const st = () => { const s = getSettings(); if (!s.licence) s.licence = {}; return s.licence; };
    const save = (patch) => { const s = getSettings(); s.licence = { ...(s.licence || {}), ...patch }; saveSettings(); return s.licence; };
    const appareil = () => { let a = st().appareil; if (!a) { a = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => '0123456789abcdef'[Math.random() * 16 | 0])); save({ appareil: a }); } return a; };
    const code = () => N.secretGet('licence-code') || '';
    const srv = () => String(server() || '').replace(/\/+$/, '');
    const achatPossible = () => !N.isIOSApp; // App Store : achats numériques uniquement par Apple
    let verified = null;

    async function api(method, p, body, auth = true) {
      if (!/^https:\/\//.test(srv())) throw new Error(T('Serveur Ivass non configuré.'));
      const headers = { 'content-type': 'application/json' };
      if (auth) { headers.authorization = 'Bearer ' + code(); headers['x-ivass-appareil'] = appareil(); }
      const r = await N.http({ url: srv() + p, method, headers, body: body ? JSON.stringify(body) : undefined, timeout: 20000 });
      let j = {}; try { j = JSON.parse(r.body || '{}'); } catch (_) { /* vide */ }
      if (!r.ok) { const e = new Error(j.erreur || `Serveur : HTTP ${r.status}`); e.status = r.status; e.code = j.code; throw e; }
      return j;
    }
    async function init() { if (st().lic) verified = await L.verifier(st().lic, publicKey(), appareil()); }
    const actif = () => !!(st().actif && publicKey());
    function droits() {
      if (!actif()) return { offre: 'expert', cles: Infinity, libre: true, palier: null, jusqua: 0, bonus: 0, source: 'libre' };
      return L.droits(verified);
    }
    async function refresh(force) {
      const s = st();
      if (!force && s.checkedAt && Date.now() - s.checkedAt < VERIF_MS) return;
      const patch = { checkedAt: Date.now() };
      try { const o = await api('GET', '/v1/offres', null, false); patch.actif = !!(o.actif || s.actif); patch.test = !!o.test; } catch (_) { /* hors ligne */ }
      if (code()) {
        try {
          const j = await api('GET', '/v1/licence' + (force ? '?frais=1' : ''));
          const v = await L.verifier(j.licence, publicKey(), appareil());
          if (v) { patch.lic = j.licence; verified = v; }
          patch.compte = j.compte; patch.erreur = '';
        } catch (e) {
          if (e.status === 401) { N.secretSet('licence-code', ''); patch.lic = null; patch.compte = null; verified = null; }
          if (e.code === 'APPAREILS') patch.erreur = e.message;
        }
      }
      save(patch);
    }
    // clés du téléphone : une par fournisseur (les IA sans clé et locales ne comptent pas)
    const keyed = (providers, getKey) => providers.filter((p) => getKey(p.id));
    function enTransition() { const s = st(); return !!(s.transitionJusqua && Date.now() < s.transitionJusqua); }
    function noterTransition(n) {
      const s = st(), d = droits();
      if (!actif() || s.transitionVue) return;
      save({ transitionVue: true, ...(Number.isFinite(d.cles) && n > d.cles ? { transitionJusqua: Date.now() + L.TRANSITION_JOURS * JOUR } : {}) });
    }
    /** Fournisseurs utilisés par l'IA : au-delà de la limite, les clés les moins prioritaires sont en pause. */
    function pourChat(providers, getKey) {
      const d = droits();
      if (!Number.isFinite(d.cles) || enTransition()) return providers;
      const k = keyed(providers, getKey);
      if (k.length <= d.cles) return providers;
      const actives = L.clesActives(k.map((p, i) => ({ id: p.id, priorite: p.priority ?? 5, ordre: i })), d.cles);
      return providers.filter((p) => !getKey(p.id) || actives.has(p.id));
    }
    function nomFormule(f) {
      const p = f.palier ? L.palierParId(f.palier) : null;
      const cles = p ? (Number.isFinite(p.max) ? `${p.max} ` + T('clés') : T('clés illimitées')) : `${L.OFFRES[f.offre].cles} ` + T('clés');
      return f.offre === 'gratuit' ? `${T('Gratuit')} + ${cles}` : `${T(L.OFFRES[f.offre].nom)}${p ? ' + ' + cles : ''}`;
    }
    function verifierAjout(apres, avant) {
      const d = droits();
      if (!Number.isFinite(d.cles) || apres <= d.cles || apres <= avant) return;
      const m = L.moinsCher(apres, d.offre);
      throw new Error(T('🔒 Limite de {} clés API atteinte avec l’offre {}.', d.cles, T(L.OFFRES[d.offre].nom)) +
        (m && achatPossible() ? ' ' + T('La formule la moins chère pour {} clés : {} à {}/mois.', apres, nomFormule(m), L.euros(m.prix, window.ivassLocale)) : '') +
        ' ' + T('⭐ Offres pour en ajouter, ou 🎁 parrainez un proche (+1 clé par filleul).'));
    }
    async function activite() {
      const s = st(), j = new Date().toISOString().slice(0, 10);
      if (!code() || !(s.compte && s.compte.parraine) || s.dernierJour === j) return;
      try { await api('POST', '/v1/activite', {}); save({ dernierJour: j }); } catch (_) { /* demain */ }
    }
    async function creerCompte(parrain) {
      if (code()) return null;
      const j = await api('POST', '/v1/compte', { appareil: appareil(), parrain: parrain || undefined }, false);
      N.secretSet('licence-code', j.code);
      await refresh(true);
      return j.avertissement || null;
    }
    async function activer(c) {
      if (!L.estCodeLicence(c)) throw new Error(T('Code licence invalide (format IVL-XXXXX-XXXXX-XXXXX-XXXXX).'));
      const avant = code();
      N.secretSet('licence-code', L.formatLicence(c));
      try { await api('GET', '/v1/licence?frais=1'); } catch (e) { N.secretSet('licence-code', avant); throw e; }
      await refresh(true);
    }
    async function oublier() {
      if (code()) { try { await api('POST', '/v1/appareil/retirer', { appareil: appareil() }); } catch (_) { /* hors ligne */ } }
      N.secretSet('licence-code', ''); save({ lic: null, compte: null }); verified = null;
    }
    async function parrain(c) {
      if (!L.estCodeParrain(c)) throw new Error(T('Code de parrainage invalide (format IVA-XXXXXX).'));
      if (!code()) { const w = await creerCompte(L.formatParrain(c)); if (w) throw new Error(w); return; }
      await api('POST', '/v1/parrain', { code: L.formatParrain(c) });
      await refresh(true);
    }
    async function acheter(offre, palier) {
      if (!achatPossible()) throw new Error(T('Achat indisponible dans cette application.'));
      if (!code()) await creerCompte();
      const j = await api('POST', '/v1/achat', { offre, palier: palier || null, locale: /^[a-z]{2}-[A-Z]{2}$/.test(navigator.language) ? navigator.language : 'fr-FR' });
      N.openUrl(j.url);
      // après le paiement : vérification au retour dans l'application
      const debut = Date.now(), avant = JSON.stringify(droits());
      const t = setInterval(async () => {
        if (Date.now() - debut > 20 * 60e3) return clearInterval(t);
        await refresh(true).catch(() => {});
        if (JSON.stringify(droits()) !== avant) { clearInterval(t); toast(T('🎉 Merci ! Votre offre est active.')); }
      }, 15000);
    }
    async function resilier() { await api('POST', '/v1/resilier', {}); await refresh(true); }

    // ---------- écran ----------
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const eur = (x) => L.euros(x, window.ivassLocale);
    const date = (t) => new Date(t).toLocaleDateString(window.ivassLocale || 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    function html(nCles) {
      const s = st(), d = droits(), c = s.compte, buy = achatPossible();
      let h = '';
      if (!actif()) h += `<div class="card"><p class="help">${T('🎉 Ivass AI est encore entièrement gratuit et illimité. Les offres ci-dessous s’appliqueront à l’ouverture des paiements.')}</p></div>`;
      if (s.test) h += `<div class="card"><p class="help">${T('🧪 Mode test : paiements fictifs (PayPal Sandbox).')}</p></div>`;
      if (s.erreur) h += `<div class="card"><p class="help err">⚠ ${esc(s.erreur)}</p></div>`;
      const nom = d.libre ? '🌱 ' + T('Gratuit') : `${L.OFFRES[d.offre].icone} ${T(L.OFFRES[d.offre].nom)}`;
      const max = Number.isFinite(d.cles) ? d.cles : null;
      h += `<div class="card"><h3>${T('Votre offre')} : ${esc(nom)}</h3>`;
      if (d.jusqua && !d.libre && d.source !== 'gratuit') h += `<p class="help">${d.source === 'parrainage' ? T('🎁 Offert par le parrainage') : T('Abonnement')} — ${T('jusqu’au {}', date(d.jusqua))}</p>`;
      h += `<p>🔑 ${T('Clés API enregistrées')} : <b>${nCles}</b> / ${max == null ? '∞' : max}</p>`;
      if (max != null && nCles > max && !enTransition()) h += `<p class="help err">⏸ ${T('{} clé(s) en pause : Ivass utilise les {} plus prioritaires.', nCles - max, max)}</p>`;
      if (enTransition()) h += `<p class="help">${T('Toutes vos clés restent actives jusqu’au {}.', date(s.transitionJusqua))}</p>`;
      if (d.bonus) h += `<p class="help">${T('dont +{} offerte(s) par le parrainage', d.bonus)}</p>`;
      h += '</div>';
      for (const id of ['gratuit', 'pro', 'expert']) {
        const o = L.OFFRES[id], cur = !d.libre && d.offre === id;
        const palier = nCles > o.cles ? L.palierPour(nCles, id) : null;
        const prix = L.tarif(id, palier ? palier.id : null) ?? 0;
        h += `<div class="card offre-m ${cur ? 'cur' : ''}"><h3>${o.icone} ${T(o.nom)}${buy ? ` — ${id === 'gratuit' ? eur(0) : eur(o.prix) + ' ' + T('/ mois')}` : ''}</h3>
          <p class="help">🔑 ${T('{} clés API comprises', o.cles)}${id === 'gratuit' ? '' : ' · ' + T('outils {} sur Ivass AI pour PC', o.nom)}</p>
          ${cur ? `<p class="help">✓ ${T('Votre offre')}</p>` : id !== 'gratuit' && buy ? `<button class="btn" data-buy="${id}" data-palier="${palier ? palier.id : ''}">${T('Choisir {} — {}/mois', o.nom, eur(prix))}</button>` : ''}</div>`;
      }
      if (buy) {
        h += `<div class="card"><h3>🔑 ${T('Plus de clés API')}</h3><p class="help">${T('Au-delà des clés comprises dans votre offre, chacun paie le même palier par mois :')} ${L.PALIERS.map((p) => `${Number.isFinite(p.max) ? p.min + '-' + p.max : T('plus de {}', p.min - 1)} : ${eur(p.prix)}`).join(' · ')}.</p>
          <div class="row"><input class="field" type="number" id="ofN" min="1" max="200" value="${Math.max(nCles + 1, 6)}" style="max-width:110px"><span id="ofQuote" class="help"></span></div>
          <button class="btn" id="ofBuyN">${T('Payer avec PayPal')}</button></div>`;
      }
      h += `<div class="card"><h3>🎟 ${T('Code licence')}</h3>`;
      h += code() ? `<p class="help">${T('Ce code porte votre offre : entrez-le sur votre PC ou un autre appareil ({} au maximum). Gardez-le pour vous.', L.APPAREILS_MAX)}</p><p><code id="ofCode">${esc(code().slice(0, 9))}…${esc(code().slice(-5))}</code></p><div class="row"><button class="btn sm" id="ofShow">👁 ${T('Afficher et copier')}</button><button class="btn sm" id="ofForget">${T('Retirer cet appareil')}</button></div>`
        : `<p class="help">${T('Déjà abonné sur un autre appareil ? Entrez votre code licence.')}</p><input class="field" id="ofCodeIn" placeholder="IVL-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="ofActivate">${T('Activer')}</button>`;
      h += '</div>';
      const P = L.PARRAINAGE;
      h += `<div class="card"><h3>🎁 ${T('Parrainage')}</h3><p class="help">${T('Chaque proche qui installe Ivass AI avec votre code et l’utilise {} jours vous rapporte +1 clé API (jusqu’à +{}). {} filleuls : 1 mois Pro offert. {} filleuls : 1 mois Expert offert.', P.joursUtilisation, P.clesMax, P.moisPro, P.moisExpert)}</p>`;
      if (c) {
        const r = c.recompenses;
        h += `<p>${T('Votre code :')} <code>${esc(c.parrain)}</code></p><button class="btn sm" id="ofInvite">📤 ${T('Inviter un proche')}</button>
          <p class="help">${T('{} filleul(s) validé(s)', c.filleuls)} · 🔑 +${r.cles} ${r.pro ? '· ⭐ ✓' : ''} ${r.expert ? '· 💎 ✓' : ''}</p>`;
      } else h += `<button class="btn sm" id="ofGetParrain">🎁 ${T('Obtenir mon code de parrainage')}</button>`;
      if (!(c && c.parraine)) h += `<p class="help">${T('Quelqu’un vous a invité ?')}</p><div class="row"><input class="field" id="ofParrainIn" placeholder="IVA-XXXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="ofParrainOk">${T('Valider')}</button></div>`;
      h += '</div>';
      if (c && c.abonnement && buy) {
        h += `<div class="card"><h3>💳 ${T('Abonnement PayPal')}</h3><p class="help">${esc(c.abonnement)}${c.jusqua ? ' · ' + T('payé jusqu’au {}', date(c.jusqua)) : ''}</p>${c.abonnement === 'ACTIVE' ? `<button class="btn sm" id="ofCancel">${T('Résilier l’abonnement')}</button>` : ''}</div>`;
      }
      if (buy) h += `<p class="help">💳 ${T('Paiement sécurisé par PayPal : Ivass AI ne voit jamais votre carte. Abonnement mensuel résiliable à tout moment ; l’offre reste active jusqu’à la fin du mois payé.')}</p>`;
      return h;
    }
    function mount(r, nCles, redraw) {
      const on = (id, fn) => { const el = r.querySelector('#' + id); if (el) el.onclick = async () => { try { await fn(); } catch (e) { toast(e.message); } }; };
      r.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = async () => { try { if (!actif()) return toast(T('Les paiements ne sont pas encore ouverts : tout reste gratuit pour l’instant.')); await acheter(b.dataset.buy, b.dataset.palier || null); toast(T('Payez dans la page PayPal qui vient de s’ouvrir : votre offre s’active ici toute seule.')); } catch (e) { toast(e.message); } }; });
      const n = r.querySelector('#ofN'), q = r.querySelector('#ofQuote');
      let best = null;
      const quote = () => { const d = droits(); best = L.moinsCher(Math.max(1, Number(n.value) || 1), d.libre ? 'gratuit' : d.offre); q.textContent = !best ? '' : best.cle === 'gratuit' ? '✓ ' + T('Compris dans l’offre Gratuit') : T('→ {} : {}/mois', nomFormule(best), eur(best.prix)); };
      if (n) { n.oninput = quote; quote(); }
      on('ofBuyN', async () => { if (!actif()) return toast(T('Les paiements ne sont pas encore ouverts : tout reste gratuit pour l’instant.')); if (best && best.cle !== 'gratuit') await acheter(best.offre, best.palier); });
      on('ofShow', () => { r.querySelector('#ofCode').textContent = code(); N.copy(code()); toast(T('Code licence copié ✓ — ne le partagez avec personne')); });
      on('ofForget', async () => { await oublier(); redraw(); });
      on('ofActivate', async () => { await activer(r.querySelector('#ofCodeIn').value); toast(T('Code licence activé ✓')); redraw(); });
      on('ofGetParrain', async () => { await creerCompte(); redraw(); });
      on('ofParrainOk', async () => { await parrain(r.querySelector('#ofParrainIn').value); toast(T('Merci ! Votre parrain sera récompensé après quelques jours d’utilisation.')); redraw(); });
      on('ofInvite', () => N.share(T('Je t’invite sur Ivass AI, l’assistant IA gratuit pour PC, Android et iPhone : {}', 'https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/') + '\n' + T('Au premier lancement, ouvre ⭐ Offres › 🎁 Parrainage et entre mon code {}.', st().compte.parrain)));
      on('ofCancel', async () => { await resilier(); toast(T('Abonnement résilié.')); redraw(); });
    }
    return { init, refresh, droits, actif, pourChat, verifierAjout, noterTransition, enTransition, activite, html, mount, keyed, creerCompte, activer, parrain, acheter, achatPossible };
  };
})();
