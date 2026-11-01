/* ⭐ Versions Ivass AI sur le téléphone : Free, Basic, Plus, Pro, Enterprise, Ultimate ; compte (e-mail + code) ;
   1 PC + 1 téléphone (transfert) ; limite de clés API ; parrainage IVASS- ; abonnement PayPal.
   Mêmes règles que le PC (licence-core.js). Application iPhone (App Store) : pas d'achat dans l'application ;
   la version achetée ailleurs s'applique en se connectant avec la même adresse e-mail. */
(function () {
  'use strict';
  const L = window.IvassLicence;
  const JOUR = 864e5, VERIF_MS = 6 * 3600e3;
  const BADGE = { bronze: '🥉', argent: '🥈', or: '🥇', ambassadeur: '🏆' };

  window.IvassOffres = function ({ N, getSettings, saveSettings, server, publicKey, toast, T = (s, ...a) => { let i = 0; return String(s).replace(/\{\}/g, () => (a[i] === undefined ? '' : a[i++])); } }) {
    const st = () => { const s = getSettings(); if (!s.licence) s.licence = {}; return s.licence; };
    const save = (patch) => { const s = getSettings(); s.licence = { ...(s.licence || {}), ...patch }; saveSettings(); return s.licence; };
    const appareil = () => { let a = st().appareil; if (!a) { a = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => '0123456789abcdef'[Math.random() * 16 | 0])); save({ appareil: a }); } return a; };
    const nomAppareil = () => String(N.platform || 'Téléphone').replace(' (app)', '');
    /** Jeton de session (IVS-…) ou ancien code licence (IVL-…), gardé dans le coffre du téléphone. */
    const code = () => N.secretGet('licence-code') || '';
    const srv = () => String(server() || '').replace(/\/+$/, '');
    const achatPossible = () => !N.isIOSApp; // App Store : achats numériques uniquement par Apple
    let verified = null, email = '', codeEnvoye = false;

    async function api(method, p, body, auth = true) {
      if (!/^https:\/\//.test(srv())) throw new Error(T('Serveur Ivass non configuré.'));
      const headers = { 'content-type': 'application/json', 'x-ivass-appareil': appareil(), 'x-ivass-type': 'mobile', 'x-ivass-nom': nomAppareil() };
      if (auth) headers.authorization = 'Bearer ' + code();
      const r = await N.http({ url: srv() + p, method, headers, body: body ? JSON.stringify(body) : undefined, timeout: 20000 });
      let j = {}; try { j = JSON.parse(r.body || '{}'); } catch (_) { /* vide */ }
      if (!r.ok) { const e = new Error(j.erreur || `Serveur : HTTP ${r.status}`); e.status = r.status; e.code = j.code; e.data = j; throw e; }
      return j;
    }
    async function init() { if (st().lic) verified = await L.verifier(st().lic, publicKey(), appareil()); }
    const actif = () => !!(st().actif && publicKey());
    function droits() {
      if (!actif()) return { offre: 'ultimate', cles: Infinity, libre: true, palier: null, jusqua: 0, bonus: 0, source: 'libre', extra: [], compte: false };
      return L.droits(verified);
    }
    const local = () => { N.secretSet('licence-code', ''); verified = null; return { lic: null, compte: null, conflit: null }; };
    async function refresh(force) {
      const s = st();
      if (!force && s.checkedAt && Date.now() - s.checkedAt < VERIF_MS) return;
      let patch = { checkedAt: Date.now(), erreur: '' };
      try { const o = await api('GET', '/v1/offres', null, false); patch.actif = !!(o.actif || s.actif); patch.test = !!o.test; patch.comptesOuverts = !!o.comptes; } catch (_) { /* hors ligne */ }
      if (code()) {
        try {
          const j = await api('GET', '/v1/licence' + (force ? '?frais=1' : ''));
          const v = await L.verifier(j.licence, publicKey(), appareil());
          if (v) { patch.lic = j.licence; verified = v; }
          patch.compte = j.compte; patch.conflit = null;
        } catch (e) {
          if (e.status === 401) patch = { ...patch, ...local(), erreur: e.message };
          else if (e.code === 'TRANSFERT') { patch.conflit = { type: e.data.type, actuel: e.data.actuel, transfert: e.data.transfert }; patch.lic = null; verified = null; }
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
      const cles = p ? (Number.isFinite(p.max) ? `${p.max} ` + T('clés') : T('clés illimitées')) : '';
      return `Ivass ${L.OFFRES[f.offre].nom}${cles ? ' + ' + cles : ''}`;
    }
    function verifierAjout(apres, avant) {
      const d = droits();
      if (!Number.isFinite(d.cles) || apres <= d.cles || apres <= avant) return;
      const m = L.moinsCher(apres, d.offre);
      throw new Error(T('🔒 Limite de {} clés API atteinte avec Ivass {}.', d.cles, L.OFFRES[d.offre].nom) +
        (m && achatPossible() ? ' ' + T('La formule la moins chère pour {} clés : {} à {}/mois.', apres, nomFormule(m), L.euros(m.prix, window.ivassLocale)) : '') +
        ' ' + T('⭐ Versions pour en ajouter, ou 🎁 parrainez un proche (+1 clé par filleul).'));
    }
    async function activite() {
      const s = st(), j = new Date().toISOString().slice(0, 10);
      const p = s.compte && s.compte.parrainage;
      if (!code() || !(p && p.parraine) || s.dernierJour === j) return;
      try { await api('POST', '/v1/activite', {}); save({ dernierJour: j }); } catch (_) { /* demain */ }
    }
    async function envoyerCode(e) {
      if (!L.emailValide(e)) throw new Error(T('Adresse e-mail invalide.'));
      await api('POST', '/v1/auth/code', { email: L.normEmail(e) }, false);
      email = L.normEmail(e); codeEnvoye = true;
    }
    async function verifierCode(otp, parrain) {
      const j = await api('POST', '/v1/auth/verifier', { email, code: String(otp || '').replace(/\D/g, ''), appareil: appareil(), type: 'mobile', nom: nomAppareil(), parrain: parrain && L.estCodeParrain(parrain) ? L.formatParrain(parrain) : undefined }, false);
      N.secretSet('licence-code', j.session); codeEnvoye = false;
      await refresh(true);
      return j;
    }
    async function activer(c) {
      if (!L.estCodeLicence(c)) throw new Error(T('Code licence invalide (format IVL-XXXXX-XXXXX-XXXXX-XXXXX).'));
      const avant = code();
      N.secretSet('licence-code', L.formatLicence(c));
      try { await api('GET', '/v1/licence?frais=1'); } catch (e) { if (e.code !== 'TRANSFERT') { N.secretSet('licence-code', avant); throw e; } }
      await refresh(true);
    }
    async function deconnexion() {
      if (code()) { try { await api('POST', '/v1/auth/deconnexion', {}); } catch (_) { /* hors ligne */ } }
      save(local());
    }
    async function transferer() { await api('POST', '/v1/appareil/transferer', {}); save({ conflit: null }); await refresh(true); }
    async function retirer(type) { await api('POST', '/v1/appareil/retirer', { type }); await refresh(true); }
    async function supprimer() { await api('POST', '/v1/compte/supprimer', {}); save(local()); await refresh(true); }
    async function parrain(c) {
      if (!L.estCodeParrain(c)) throw new Error(T('Code de parrainage invalide (format IVASS-XXXXX-XXXX).'));
      if (!code()) throw new Error(T('Connectez-vous d’abord avec votre adresse e-mail : le code de parrainage sera ajouté à l’inscription.'));
      await api('POST', '/v1/parrain', { code: L.formatParrain(c) });
      await refresh(true);
    }
    async function nouveauCode() { await api('POST', '/v1/parrain/code', {}); await refresh(true); }
    async function acheter(offre, palier) {
      if (!achatPossible()) throw new Error(T('Achat indisponible dans cette application.'));
      if (!code()) throw new Error(T('Créez votre compte Ivass (adresse e-mail) avant de choisir une version.'));
      const j = await api('POST', '/v1/achat', { offre, palier: palier || null, locale: /^[a-z]{2}-[A-Z]{2}$/.test(navigator.language) ? navigator.language : 'fr-FR' });
      N.openUrl(j.url);
      // après le paiement : vérification au retour dans l'application
      const debut = Date.now(), avant = JSON.stringify(droits());
      const t = setInterval(async () => {
        if (Date.now() - debut > 20 * 60e3) return clearInterval(t);
        await refresh(true).catch(() => {});
        if (JSON.stringify(droits()) !== avant) { clearInterval(t); toast(T('🎉 Merci ! Votre version est active.')); }
      }, 15000);
    }
    async function resilier() { await api('POST', '/v1/resilier', {}); await refresh(true); }

    // ---------- écran ----------
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const eur = (x) => L.euros(x, window.ivassLocale);
    const date = (t) => new Date(t).toLocaleDateString(window.ivassLocale || 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rang = (o) => L.ORDRE.indexOf(o);
    function html(nCles) {
      const s = st(), d = droits(), c = s.compte, buy = achatPossible(), conn = !!code();
      let h = '';
      if (!actif()) h += `<div class="card"><p class="help">${T('🎉 Ivass AI est encore entièrement gratuit et illimité. Les versions ci-dessous s’appliqueront à l’ouverture des paiements.')}</p></div>`;
      if (s.test) h += `<div class="card"><p class="help">${T('🧪 Mode test : paiements fictifs (PayPal Sandbox).')}</p></div>`;
      if (s.erreur) h += `<div class="card"><p class="help err">⚠ ${esc(s.erreur)}</p></div>`;
      if (s.conflit) {
        const t = s.conflit.transfert || {};
        h += `<div class="card"><h3>🔐 ${T('Licence déjà utilisée sur un autre téléphone')}</h3><p class="help">${T('Téléphone principal actuel : {}. Un compte fonctionne sur 1 PC principal et 1 téléphone principal ; ce téléphone reste en Ivass Free tant que vous n’avez pas choisi.', esc((s.conflit.actuel && s.conflit.actuel.nom) || '?'))}</p>
          ${t.possible ? `<button class="btn primary" id="ofTransfer">🔁 ${T('Transférer la licence sur ce téléphone')}</button>` : `<p class="help err">${T('Prochain transfert possible le {}.', date(t.possibleLe))}</p>`}
          <button class="btn sm" id="ofLicSup">➕ ${T('Licence supplémentaire (autre compte)')}</button></div>`;
      }
      const o = L.OFFRES[d.offre] || L.OFFRES.ultimate;
      const nom = d.libre ? '🌱 Free' : `${o.icone} ${o.nom}`;
      const max = Number.isFinite(d.cles) ? d.cles : null;
      h += `<div class="card"><h3>${T('Votre version')} : Ivass ${esc(nom)}</h3>`;
      if (d.jusqua && !d.libre && d.source !== 'gratuit') h += `<p class="help">${d.source === 'parrainage' ? T('🎁 Offert par le parrainage') : T('Abonnement')} — ${T('jusqu’au {}', date(d.jusqua))}</p>`;
      for (const x of d.extra || []) { const fx = L.FONCTIONS[x.f]; if (fx) h += `<p class="help">🎁 ${fx.icone} ${T(fx.nom)} — ${T('jusqu’au {}', date(x.j))}</p>`; }
      h += `<p>🔑 ${T('Clés API enregistrées')} : <b>${nCles}</b> / ${max == null ? '∞' : max}</p>`;
      if (max != null && nCles > max && !enTransition()) h += `<p class="help err">⏸ ${T('{} clé(s) en pause : Ivass utilise les {} plus prioritaires.', nCles - max, max)}</p>`;
      if (enTransition()) h += `<p class="help">${T('Toutes vos clés restent actives jusqu’au {}.', date(s.transitionJusqua))}</p>`;
      if (d.bonus) h += `<p class="help">${T('dont +{} offerte(s) par le parrainage', d.bonus)}</p>`;
      h += '</div>';

      // compte
      h += `<div class="card"><h3>👤 ${T('Compte Ivass')}</h3>`;
      if (!conn) {
        h += `<p class="help">${T('Ivass Free fonctionne sans compte. Pour Basic et plus, la synchronisation PC + téléphone et le parrainage, connectez-vous avec votre adresse e-mail : vous recevez un code à 6 chiffres, sans mot de passe.')}</p>
          <input class="field" type="email" id="ofEmail" placeholder="vous@exemple.fr" value="${esc(email)}" autocomplete="email" autocapitalize="off" spellcheck="false"><button class="btn sm" id="ofSendCode">${codeEnvoye ? T('Renvoyer le code') : T('Recevoir un code')}</button>`;
        if (codeEnvoye) h += `<input class="field" id="ofOtp" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"><input class="field" id="ofParrainSignup" placeholder="${esc(T('Code de parrainage (facultatif)'))}" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn primary" id="ofVerify">${T('Se connecter')}</button><p class="help">${T('Code envoyé : valable 10 minutes. Vérifiez aussi les courriers indésirables.')}</p>`;
        h += `<details><summary class="help">${T('Vous avez un ancien code licence (IVL-…) ?')}</summary><input class="field" id="ofCodeIn" placeholder="IVL-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="ofActivate">${T('Activer')}</button></details>`;
      } else {
        h += `<p>${c && c.email ? '📧 <b>' + esc(c.email) + '</b>' : T('Compte relié par un ancien code licence')}</p>`;
        for (const t of ['pc', 'mobile']) {
          const a = ((c && c.appareils) || []).find((x) => x.type === t);
          h += `<p class="help">${t === 'pc' ? '💻 ' + T('PC principal') : '📱 ' + T('Téléphone principal')} : ${a ? esc(a.nom || '?') + (a.ceci ? ' (' + T('cet appareil') + ')' : '') : T('libre')}${a && !a.ceci ? ` <button class="btn sm" data-remove="${t}">${T('Retirer')}</button>` : ''}</p>`;
        }
        h += `<div class="row"><button class="btn sm" id="ofLogout">${T('Se déconnecter')}</button><button class="btn sm danger" id="ofDelete">${T('Supprimer mon compte')}</button></div>`;
      }
      h += '</div>';

      // versions
      L.ORDRE.forEach((id, i) => {
        const of = L.OFFRES[id], cur = !d.libre && d.offre === id;
        const m = L.matrice().find((x) => x.offre === id);
        const palier = id !== 'ultimate' && Number.isFinite(of.cles) && nCles > of.cles ? L.palierPour(nCles, id) : null;
        const prix = L.tarif(id, palier ? palier.id : null) ?? of.prix;
        const list = [...(i ? [T('Tout {}', L.OFFRES[L.ORDRE[i - 1]].nom)] : []), ...m.avantages.map((x) => T(x)), ...m.ajoute.map((f) => `${L.FONCTIONS[f].icone} ${T(L.FONCTIONS[f].nom)}`)];
        h += `<div class="card offre-m ${cur ? 'cur' : ''}"><h3>${of.icone} Ivass ${of.nom}${buy ? ` — ${eur(of.prix)}${id === 'gratuit' ? '' : ' ' + T('/ mois')}` : ''}</h3>
          <p class="help">🔑 ${Number.isFinite(of.cles) ? T('{} clés API comprises', of.cles) : T('Clés API illimitées')}</p><p class="help">${list.map(esc).join(' · ')}</p>
          ${cur ? `<p class="help">✓ ${T('Votre version')}</p>` : id !== 'gratuit' && buy ? `<button class="btn" data-buy="${id}" data-palier="${palier ? palier.id : ''}">${T('Choisir {} — {}/mois', of.nom, eur(prix))}</button>` : ''}</div>`;
      });
      if (!buy) h += `<div class="card"><p class="help">${T('Sur iPhone, choisissez votre version sur le PC ou sur la page de téléchargement, puis connectez-vous ici avec la même adresse e-mail.')}</p></div>`;
      if (buy) {
        h += `<div class="card"><h3>🔑 ${T('Plus de clés API')}</h3><p class="help">${T('Au-delà des clés comprises dans votre version, le même palier pour tous, par mois :')} ${L.PALIERS.map((p) => `${Number.isFinite(p.max) ? p.min + '-' + p.max : T('plus de {}', p.min - 1)} : ${eur(p.prix)}`).join(' · ')}.</p>
          <div class="row"><input class="field" type="number" id="ofN" min="1" max="200" value="${Math.max(nCles + 1, 6)}" style="max-width:110px"><span id="ofQuote" class="help"></span></div>
          <button class="btn" id="ofBuyN">${T('Payer avec PayPal')}</button></div>`;
      }

      // parrainage
      h += `<div class="card"><h3>🎁 ${T('Parrainage')}</h3><p class="help">${T('Un proche s’inscrit avec votre code et utilise Ivass AI {} jours : vous montez dans les récompenses.', L.PARRAINAGE.joursUtilisation)}</p>`;
      const p = (c && c.parrainage) || null;
      if (p) {
        h += `<p>${T('Votre code :')} <code>${esc(p.code)}</code></p><div class="row"><button class="btn sm" id="ofInvite">📤 ${T('Inviter un proche')}</button><button class="btn sm" id="ofNewParrain">🔄 ${T('Nouveau code')}</button></div>
          <p class="help">${T('Valable jusqu’au {}', date(p.expire))} · ${T('{} utilisation(s)', p.utilisations)} · ${T('{} filleul(s) validé(s)', p.filleuls)}${p.enAttente ? ' · ' + T('{} en attente', p.enAttente) : ''}${p.badge ? ' · ' + (BADGE[p.badge] || '') : ''}</p>
          ${p.prochain ? `<p class="help">${T('Prochaine récompense à {} filleul(s) : {}', p.prochain.filleuls, esc(T(p.prochain.gain)))}</p>` : ''}`;
        if (!p.parraine) h += `<p class="help">${T('Quelqu’un vous a invité ?')}</p><div class="row"><input class="field" id="ofParrainIn" placeholder="IVASS-XXXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="ofParrainOk">${T('Valider')}</button></div>`;
        if ((p.historique || []).length) h += `<details><summary class="help">🏅 ${T('Historique des récompenses')}</summary>${p.historique.map((x) => `<p class="help">${esc(date(x.quand))} · ${esc(T(x.gain))}</p>`).join('')}</details>`;
      } else h += `<p class="help">${T('Connectez-vous par e-mail pour obtenir votre code de parrainage.')}</p>`;
      h += `<details><summary class="help">🪜 ${T('Récompenses progressives')}</summary>${L.PALIERS_PARRAINAGE.map((x) => `<p class="help">${p && p.filleuls >= x.n ? '✅' : '▫️'} <b>${x.n}</b> : ${esc(T(x.gain))}${x.badge ? ' ' + (BADGE[x.badge] || '') : ''}</p>`).join('')}</details></div>`;

      if (c && c.abonnement && buy) {
        h += `<div class="card"><h3>💳 ${T('Abonnement PayPal')}</h3><p class="help">${esc(c.abonnement)}${c.jusqua ? ' · ' + T('payé jusqu’au {}', date(c.jusqua)) : ''}</p>${c.abonnement === 'ACTIVE' ? `<button class="btn sm" id="ofCancel">${T('Résilier l’abonnement')}</button>` : ''}</div>`;
      }
      if (buy) h += `<p class="help">💳 ${T('Paiement sécurisé par PayPal : Ivass AI ne voit jamais votre carte. Abonnement mensuel résiliable à tout moment ; la version reste active jusqu’à la fin du mois payé.')}</p>`;
      return h;
    }
    function mount(r, nCles, redraw) {
      const on = (id, fn) => { const el = r.querySelector('#' + id); if (el) el.onclick = async () => { try { await fn(); } catch (e) { toast(e.message); } }; };
      r.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = async () => { try { if (!actif()) return toast(T('Les paiements ne sont pas encore ouverts : tout reste gratuit pour l’instant.')); await acheter(b.dataset.buy, b.dataset.palier || null); toast(T('Payez dans la page PayPal qui vient de s’ouvrir : votre version s’active ici toute seule.')); } catch (e) { toast(e.message); } }; });
      r.querySelectorAll('[data-remove]').forEach((b) => { b.onclick = async () => { if (!confirm(T('Retirer cet appareil ? Il repassera en Ivass Free et devra se reconnecter.'))) return; try { await retirer(b.dataset.remove); redraw(); } catch (e) { toast(e.message); } }; });
      const n = r.querySelector('#ofN'), q = r.querySelector('#ofQuote');
      let best = null;
      const quote = () => { const d = droits(); best = L.moinsCher(Math.max(1, Number(n.value) || 1), d.libre ? 'gratuit' : d.offre); q.textContent = !best ? '' : best.cle === 'gratuit' ? '✓ ' + T('Compris dans Ivass Free') : T('→ {} : {}/mois', nomFormule(best), eur(best.prix)); };
      if (n) { n.oninput = quote; quote(); }
      on('ofBuyN', async () => { if (!actif()) return toast(T('Les paiements ne sont pas encore ouverts : tout reste gratuit pour l’instant.')); if (best && best.cle !== 'gratuit') await acheter(best.offre, best.palier); });
      on('ofSendCode', async () => { await envoyerCode(r.querySelector('#ofEmail').value); toast(T('Code envoyé à {} ✓', L.masquerEmail(email))); redraw(); });
      on('ofVerify', async () => { const j = await verifierCode(r.querySelector('#ofOtp').value, r.querySelector('#ofParrainSignup').value.trim()); toast(j.nouveau ? T('🎉 Compte créé ✓') : T('Connecté ✓')); if (j.avertissement) toast('🎁 ' + j.avertissement); redraw(); });
      on('ofActivate', async () => { await activer(r.querySelector('#ofCodeIn').value); toast(T('Code licence activé ✓')); redraw(); });
      on('ofLogout', async () => { await deconnexion(); redraw(); });
      on('ofDelete', async () => { if (!confirm(T('Supprimer définitivement votre compte Ivass ? L’abonnement PayPal est arrêté, vos appareils, votre parrainage et votre historique sont effacés. Vos discussions et vos clés API restent sur vos appareils.'))) return; await supprimer(); toast(T('Compte supprimé.')); redraw(); });
      on('ofTransfer', async () => { if (!confirm(T('Faire de cet appareil votre appareil principal ? L’autre appareil perdra la licence (1 transfert tous les 30 jours).'))) return; await transferer(); toast(T('Licence transférée ✓')); redraw(); });
      on('ofLicSup', async () => { await deconnexion(); toast(T('Connectez-vous avec une autre adresse e-mail pour une licence supplémentaire.')); redraw(); });
      on('ofParrainOk', async () => { await parrain(r.querySelector('#ofParrainIn').value); toast(T('Merci ! Votre parrain sera récompensé après quelques jours d’utilisation.')); redraw(); });
      on('ofInvite', () => N.share(T('Je t’invite sur Ivass AI, l’assistant IA pour PC, Android et iPhone : {}', 'https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/') + '\n' + T('À l’inscription (⭐ Versions › 👤 Compte), entre mon code de parrainage {}.', st().compte.parrainage.code)));
      on('ofNewParrain', async () => { if (!confirm(T('Créer un nouveau code ? L’ancien ne fonctionnera plus (1 nouveau code tous les 30 jours).'))) return; await nouveauCode(); redraw(); });
      on('ofCancel', async () => { await resilier(); toast(T('Abonnement résilié.')); redraw(); });
    }
    return { init, refresh, droits, actif, pourChat, verifierAjout, noterTransition, enTransition, activite, html, mount, keyed, activer, parrain, acheter, achatPossible, envoyerCode, verifierCode, deconnexion, transferer, nouveauCode };
  };
})();
