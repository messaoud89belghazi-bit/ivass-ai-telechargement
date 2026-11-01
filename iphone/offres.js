/* ⭐ Versions Ivass AI sur le téléphone : Free, Basic, Plus, Pro, Enterprise, Ultimate ; compte sécurisé (e-mail vérifié,
   mot de passe étiré sur le téléphone, 2FA, appareils de confiance, empreinte / visage / Face ID) ;
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
    let verified = null, verrouille = false, initFait = false;
    // 🔐 parcours du compte : connexion | inscription | oubli ; étapes « 2fa » / « appareil » après le mot de passe
    const A = { mode: 'connexion', email: '', codeEnvoye: false, etape: null, defi: null, emailMasque: '' };
    let sec = null, prep2fa = null, secours = null, bio = null;
    const confiance = () => N.secretGet('licence-confiance') || '';
    const emailLocal = () => N.secretGet('licence-email') || '';

    async function api(method, p, body, auth = true) {
      if (!/^https:\/\//.test(srv())) throw new Error(T('Serveur Ivass non configuré.'));
      const headers = { 'content-type': 'application/json', 'x-ivass-appareil': appareil(), 'x-ivass-type': 'mobile', 'x-ivass-nom': nomAppareil() };
      if (auth) headers.authorization = 'Bearer ' + code();
      const r = await N.http({ url: srv() + p, method, headers, body: body ? JSON.stringify(body) : undefined, timeout: 20000 });
      let j = {}; try { j = JSON.parse(r.body || '{}'); } catch (_) { /* vide */ }
      if (!r.ok) { const e = new Error(j.erreur || `Serveur : HTTP ${r.status}`); e.status = r.status; e.code = j.code; e.data = j; throw e; }
      return j;
    }
    async function init() {
      if (st().lic) verified = await L.verifier(st().lic, publicKey(), appareil());
      if (!initFait) { initFait = true; verrouille = !!(st().biometrie && code()); } // 👆 verrou à chaque ouverture de l'application
    }
    /** Actions sensibles : déverrouillage par empreinte / visage si l'utilisateur l'a activé. */
    async function garde(raison) {
      if (!st().biometrie) return;
      if (!verrouille && !raison) return;
      const ok = await N.biometrie(raison || T('Déverrouiller votre compte Ivass'));
      if (!ok) throw new Error(T('Vérification biométrique refusée ou annulée.'));
      verrouille = false;
    }
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
    // ---------- 🔐 compte : le mot de passe n'est jamais envoyé ; seule sa clé étirée (PBKDF2, 600 000 tours) part ----------
    function robuste(mdp, e) { const r = L.evaluerMotDePasse(mdp, e); if (!r.ok) throw new Error(T('Mot de passe trop faible : {}.', r.raisons.map((x) => T(x)).join(', '))); }
    async function envoyerCode(e, but = 'inscription') {
      if (!L.emailValide(e)) throw new Error(T('Adresse e-mail invalide.'));
      await api('POST', '/v1/auth/code', { email: L.normEmail(e), but: but === 'oubli' ? 'oubli' : 'inscription' }, false);
      A.email = L.normEmail(e); A.codeEnvoye = true;
    }
    async function session(j, e) {
      N.secretSet('licence-code', j.session); N.secretSet('licence-email', L.normEmail(e));
      if (j.confiance) N.secretSet('licence-confiance', j.confiance);
      Object.assign(A, { codeEnvoye: false, etape: null, defi: null }); verrouille = false; sec = null;
      await refresh(true);
      return j;
    }
    async function inscription({ email: e, code: c, motDePasse, parrain: pr }) {
      e = L.normEmail(e); robuste(motDePasse, e);
      const sel = L.nouveauSel();
      const j = await api('POST', '/v1/auth/inscription', { email: e, code: String(c || '').replace(/\D/g, ''), sel, cle: await L.deriverCle(motDePasse, sel), appareil: appareil(), type: 'mobile', nom: nomAppareil(), parrain: pr && L.estCodeParrain(pr) ? L.formatParrain(pr) : undefined }, false);
      return session(j, e);
    }
    async function connexion({ email: e, motDePasse }) {
      e = L.normEmail(e);
      if (!L.emailValide(e)) throw new Error(T('Adresse e-mail invalide.'));
      const pre = await api('POST', '/v1/auth/prelogin', { email: e }, false);
      const j = await api('POST', '/v1/auth/connexion', { email: e, cle: await L.deriverCle(motDePasse, pre.sel, pre.iterations), appareil: appareil(), type: 'mobile', nom: nomAppareil(), confiance: confiance() || undefined }, false);
      if (j.session) return session(j, e);
      Object.assign(A, { email: e, etape: j.etape, defi: j.defi, emailMasque: j.email || '' });
      return j;
    }
    async function validerEtape(c, retenir = true) {
      if (!A.defi) throw new Error(T('Reconnectez-vous.'));
      const j = await api('POST', '/v1/auth/defi', { defi: A.defi, code: String(c || '').trim(), email: A.email, retenir }, false);
      if (j.session) return session(j, A.email);
      Object.assign(A, { etape: j.etape, defi: j.defi, emailMasque: j.email || A.emailMasque });
      return j;
    }
    async function reinitialiser({ email: e, code: c, motDePasse, code2fa }) {
      e = L.normEmail(e); robuste(motDePasse, e);
      const sel = L.nouveauSel();
      await api('POST', '/v1/auth/reinitialiser', { email: e, code: String(c || '').replace(/\D/g, ''), sel, cle: await L.deriverCle(motDePasse, sel), code2fa: code2fa || undefined }, false);
      N.secretSet('licence-confiance', '');
      return connexion({ email: e, motDePasse });
    }
    async function securite() { await garde(); sec = await api('GET', '/v1/securite'); return sec; }
    async function cleActuelle(mdp) { const x = await api('GET', '/v1/securite'); if (!x.sel) throw new Error(T('Ce compte n’a pas encore de mot de passe.')); return L.deriverCle(mdp, x.sel); }
    async function changerMotDePasse(ancien, nouveau) {
      await garde(T('Changer le mot de passe'));
      robuste(nouveau, emailLocal());
      const sel = L.nouveauSel();
      await api('POST', '/v1/securite/mot-de-passe', { ancienne: await cleActuelle(ancien), sel, cle: await L.deriverCle(nouveau, sel), email: emailLocal() || undefined });
    }
    async function preparer2fa(mdp) {
      await garde(T('Activer la double authentification'));
      const j = await api('POST', '/v1/securite/2fa/preparer', { cle: await cleActuelle(mdp) });
      prep2fa = { secret: j.secret, uri: L.uriTotp(j.secret, emailLocal() || 'compte') };
      return prep2fa;
    }
    async function activer2fa(c) { const j = await api('POST', '/v1/securite/2fa/activer', { code: String(c || '').trim() }); prep2fa = null; secours = j.secours; sec = null; return j; }
    async function desactiver2fa(mdp, c) { await garde(T('Désactiver la double authentification')); await api('POST', '/v1/securite/2fa/desactiver', { cle: await cleActuelle(mdp), code: String(c || '').trim(), email: emailLocal() || undefined }); sec = null; }
    async function regenererSecours(c) { await garde(T('Nouveaux codes de secours')); const j = await api('POST', '/v1/securite/secours', { code: String(c || '').trim() }); secours = j.secours; return j; }
    async function retirerConfiance(ref) { await garde(T('Retirer un appareil de confiance')); await api('POST', '/v1/securite/confiance/retirer', { ref: String(ref || '') }); sec = null; }
    async function fermerSessions() { await garde(T('Déconnecter les autres appareils')); await api('POST', '/v1/securite/sessions/fermer', {}); sec = null; }
    async function biometrieActiver(on) {
      if (on) {
        const d = await N.biometrieDispo();
        if (!d.ok) throw new Error(T('Biométrie indisponible : {}', T(d.raison || '')));
        if (!(await N.biometrie(T('Activer le déverrouillage par {}', d.methode), true))) throw new Error(T('Vérification biométrique refusée ou annulée.'));
      } else await garde(T('Désactiver le déverrouillage biométrique'));
      save({ biometrie: !!on }); verrouille = false;
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
      sec = null; prep2fa = null; secours = null;
      save(local()); // le jeton d'appareil de confiance reste : pas de code e-mail à la prochaine connexion ici
    }
    async function transferer() { await garde(T('Transférer la licence')); await api('POST', '/v1/appareil/transferer', {}); save({ conflit: null }); await refresh(true); }
    async function retirer(type) { await garde(T('Retirer un appareil')); await api('POST', '/v1/appareil/retirer', { type }); await refresh(true); }
    async function supprimer() { await garde(T('Supprimer le compte')); await api('POST', '/v1/compte/supprimer', {}); save(local()); await refresh(true); }
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
    // ---------- 🔐 formulaires du compte ----------
    const champMdp = (id, ph, ac) => `<div class="mdp-champ"><input class="field" type="password" id="${id}" placeholder="${esc(ph)}" autocomplete="${ac}" autocapitalize="off" spellcheck="false"><button class="btn sm" type="button" data-voir="${id}" aria-label="${esc(T('Afficher le mot de passe'))}">👁</button></div>`;
    function formAuth(s) {
      if (!s.comptesOuverts) return `<p class="help">${T('Les comptes Ivass ne sont pas encore ouverts sur le serveur.')} ${T('Ivass Free reste entièrement utilisable en attendant.')}</p>`;
      if (A.etape === '2fa') return `<p class="help">🔐 ${T('Double authentification : entrez le code à 6 chiffres de votre application d’authentification, ou un code de secours.')}</p>
        <input class="field" id="ofCode2fa" inputmode="numeric" autocomplete="one-time-code" placeholder="123456 / XXXX-XXXX" autocapitalize="characters"><button class="btn primary" id="ofEtape">${T('Valider')}</button><button class="btn sm" id="ofAnnuler">${T('Annuler')}</button>`;
      if (A.etape === 'appareil') return `<p class="help">📱 ${T('Nouvel appareil : un code de confirmation vient d’être envoyé à {}.', esc(A.emailMasque || L.masquerEmail(A.email)))}</p>
        <input class="field" id="ofCodeApp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456"><label class="help"><input type="checkbox" id="ofRetenir" checked> ${T('Faire confiance à ce téléphone (plus de code e-mail ici)')}</label>
        <button class="btn primary" id="ofEtape">${T('Confirmer')}</button><button class="btn sm" id="ofAnnuler">${T('Annuler')}</button>`;
      const onglets = [['connexion', T('Se connecter')], ['inscription', T('Créer un compte')], ['oubli', T('Mot de passe oublié')]];
      let h = `<p class="help">${T('Ivass Free fonctionne sans compte. Pour Basic et plus, la synchronisation PC + téléphone et le parrainage, créez un compte : adresse e-mail vérifiée, mot de passe, double authentification en option.')}</p>
        <div class="row auth-onglets">${onglets.map(([m, n]) => `<button class="btn sm${A.mode === m ? ' primary' : ''}" data-auth="${m}">${n}</button>`).join('')}</div>
        <input class="field" type="email" id="ofEmail" placeholder="vous@exemple.fr" value="${esc(A.email)}" autocomplete="email" autocapitalize="off" spellcheck="false">`;
      if (A.mode === 'connexion') {
        h += champMdp('ofMdp', T('Mot de passe'), 'current-password') + `<button class="btn primary" id="ofLogin">${T('Se connecter')}</button>`;
      } else {
        h += `<button class="btn sm" id="ofSendCode">${A.codeEnvoye ? T('Renvoyer le code') : T('Recevoir un code')}</button>`;
        if (A.codeEnvoye) {
          h += `<p class="help">${T('Code envoyé : valable 10 minutes. Vérifiez aussi les courriers indésirables.')}</p><input class="field" id="ofOtp" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code">`
            + champMdp('ofMdp', A.mode === 'oubli' ? T('Nouveau mot de passe') : T('Mot de passe'), 'new-password') + champMdp('ofMdp2', T('Confirmer le mot de passe'), 'new-password')
            + `<div class="jauge" id="ofJauge"><i></i></div><p class="help" id="ofJaugeTxt">${T('10 caractères minimum ; mélangez lettres, chiffres et symboles, ou utilisez une phrase de 16 caractères et plus.')}</p>`;
          if (A.mode === 'inscription') h += `<input class="field" id="ofParrainSignup" placeholder="${esc(T('Code de parrainage (facultatif)'))}" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn primary" id="ofSignup">${T('Créer mon compte')}</button>`;
          else h += `<input class="field" id="ofCode2faReset" inputmode="numeric" placeholder="${esc(T('Code 2FA ou de secours (si activée)'))}" autocomplete="one-time-code"><button class="btn primary" id="ofReset">${T('Changer le mot de passe')}</button><p class="help">${T('Par sécurité, tous vos appareils seront déconnectés.')}</p>`;
        }
      }
      h += `<details><summary class="help">${T('Vous avez un ancien code licence (IVL-…) ?')}</summary><input class="field" id="ofCodeIn" placeholder="IVL-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" id="ofActivate">${T('Activer')}</button></details>`;
      return h;
    }
    function securiteCarte() {
      let h = `<div class="card"><h3>🛡 ${T('Sécurité du compte')}</h3>`;
      if (!sec) { setTimeout(() => securite().then(() => redessiner && redessiner()).catch((e) => { sec = { erreur: e.message }; if (redessiner) redessiner(); }), 0); return h + `<p class="help">${T('Chargement…')}</p></div>`; }
      if (sec.erreur) return h + `<p class="help err">⚠ ${esc(sec.erreur)}</p></div>`;
      // mot de passe
      h += `<details><summary>🔑 ${T('Mot de passe')}${sec.motDePasse && sec.motDePasse.maj ? ' · ' + T('changé le {}', date(sec.motDePasse.maj)) : ''}</summary>${champMdp('ofMdpAnc', T('Mot de passe actuel'), 'current-password')}${champMdp('ofMdpNv', T('Nouveau mot de passe'), 'new-password')}<button class="btn sm" id="ofMdpChange">${T('Changer le mot de passe')}</button></details>`;
      // 2FA
      h += `<details ${prep2fa || secours ? 'open' : ''}><summary>🔐 ${T('Double authentification')} : ${sec.deuxFA ? '✅ ' + T('activée') : T('désactivée')}</summary>`;
      if (secours) h += `<p class="help">${T('Codes de secours : gardez-les en lieu sûr. Chacun ne sert qu’une fois, si vous perdez votre téléphone.')}</p><pre class="secours">${secours.map(esc).join('\n')}</pre><button class="btn sm" id="ofSecCopy">📋 ${T('Copier')}</button><button class="btn sm" id="ofSecOk">${T('Je les ai gardés')}</button>`;
      else if (prep2fa) h += `<p class="help">${T('1. Ouvrez votre application d’authentification (Google Authenticator, Microsoft Authenticator, 2FAS…) ou ajoutez la clé à la main.')}</p><button class="btn sm" id="ofOtpOpen">📲 ${T('Ajouter à mon application d’authentification')}</button><p class="help">${T('Clé')} : <code>${esc(prep2fa.secret.replace(/(.{4})/g, '$1 ').trim())}</code> <button class="btn sm" id="ofOtpCopy">📋</button></p><p class="help">${T('2. Entrez le code à 6 chiffres affiché :')}</p><input class="field" id="ofOtpAct" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"><button class="btn primary" id="ofOtpOn">${T('Activer')}</button>`;
      else if (!sec.deuxFA) h += `<p class="help">${T('Recommandé : en plus du mot de passe, un code à 6 chiffres de votre application d’authentification est demandé sur un nouvel appareil.')}</p>${champMdp('ofMdp2fa', T('Mot de passe actuel'), 'current-password')}<button class="btn sm" id="ofOtpPrep">${T('Activer la double authentification')}</button>`;
      else h += `<p class="help">${T('{} code(s) de secours restant(s).', sec.secoursRestants || 0)}</p><input class="field" id="ofCodeSec" inputmode="numeric" placeholder="${esc(T('Code 2FA actuel'))}" autocomplete="one-time-code"><button class="btn sm" id="ofSecNew">${T('Nouveaux codes de secours')}</button>${champMdp('ofMdpOff', T('Mot de passe actuel'), 'current-password')}<button class="btn sm danger" id="ofOtpOff">${T('Désactiver')}</button>`;
      h += '</details>';
      // biométrie
      h += `<details><summary>👆 ${T('Empreinte / visage')} : ${st().biometrie ? '✅ ' + T('activé') : T('désactivé')}</summary><p class="help">${T('Déverrouille votre compte à l’ouverture de l’application et confirme les actions sensibles (transfert, suppression, sécurité). Votre empreinte et votre visage restent dans le téléphone : Ivass ne les voit jamais.')}</p>`;
      if (bio === null) { bio = 'chargement'; N.biometrieDispo().then((d) => { bio = d; if (redessiner) redessiner(); }).catch(() => { bio = { ok: false }; }); }
      h += bio && bio.ok ? `<button class="btn sm" id="ofBio" data-on="${st().biometrie ? '0' : '1'}">${st().biometrie ? T('Désactiver') : T('Activer') + ' ' + esc(bio.methode)}</button>` : `<p class="help">${bio && bio.raison ? T('Indisponible : {}', T(bio.raison)) : T('Vérification…')}</p>`;
      h += '</details>';
      // appareils de confiance et sessions
      h += `<details><summary>📱 ${T('Appareils de confiance')} (${(sec.confiance || []).length})</summary>${(sec.confiance || []).map((x) => `<p class="help">${x.type === 'pc' ? '💻' : '📱'} <b>${esc(x.nom || '?')}</b>${x.ceci ? ' (' + T('cet appareil') + ')' : ''} · ${T('ajouté le {}', date(x.ajoute))}${x.ceci ? '' : ` <button class="btn sm" data-confiance="${esc(x.ref)}">${T('Retirer')}</button>`}</p>`).join('') || `<p class="help">${T('Aucun.')}</p>`}
        <p class="help">${T('{} session(s) ouverte(s).', sec.sessions || 0)}</p><button class="btn sm" id="ofSessions">${T('Déconnecter les autres appareils')}</button></details>`;
      return h + '</div>';
    }
    let redessiner = null;
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
      if (!conn) h += formAuth(s);
      else {
        if (verrouille) h += `<p class="help">🔒 ${T('Compte verrouillé : déverrouillez-le avec votre empreinte ou votre visage.')}</p><button class="btn primary" id="ofUnlock">👆 ${T('Déverrouiller')}</button>`;
        h += `<p>${c && c.email ? '📧 <b>' + esc(c.email) + '</b>' : T('Compte relié par un ancien code licence')}</p>`;
        for (const t of ['pc', 'mobile']) {
          const a = ((c && c.appareils) || []).find((x) => x.type === t);
          h += `<p class="help">${t === 'pc' ? '💻 ' + T('PC principal') : '📱 ' + T('Téléphone principal')} : ${a ? esc(a.nom || '?') + (a.ceci ? ' (' + T('cet appareil') + ')' : '') : T('libre')}${a && !a.ceci ? ` <button class="btn sm" data-remove="${t}">${T('Retirer')}</button>` : ''}</p>`;
        }
        h += `<div class="row"><button class="btn sm" id="ofLogout">${T('Se déconnecter')}</button><button class="btn sm danger" id="ofDelete">${T('Supprimer mon compte')}</button></div>`;
      }
      h += '</div>';
      if (conn && !verrouille) h += securiteCarte();

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
      redessiner = redraw;
      const v = (id) => { const el = r.querySelector('#' + id); return el ? el.value : ''; };
      const emailEl = r.querySelector('#ofEmail'); if (emailEl) emailEl.oninput = () => { A.email = emailEl.value; };
      r.querySelectorAll('[data-auth]').forEach((b) => { b.onclick = () => { A.mode = b.dataset.auth; A.codeEnvoye = false; redraw(); }; });
      r.querySelectorAll('[data-voir]').forEach((b) => { b.onclick = () => { const i = r.querySelector('#' + b.dataset.voir); i.type = i.type === 'password' ? 'text' : 'password'; }; });
      const mdp = r.querySelector('#ofMdp'), jauge = r.querySelector('#ofJauge');
      if (mdp && jauge) mdp.oninput = () => { const e = L.evaluerMotDePasse(mdp.value, A.email); jauge.dataset.n = String(Math.min(4, e.score)); r.querySelector('#ofJaugeTxt').textContent = e.ok ? '✓ ' + T('Mot de passe solide') : e.raisons.map((x) => T(x)).join(' · '); };
      const deuxMdp = () => { if (v('ofMdp') !== v('ofMdp2')) throw new Error(T('Les deux mots de passe sont différents.')); return v('ofMdp'); };
      const apres = (j) => { if (j.etape) toast(j.etape === '2fa' ? T('Code de double authentification demandé') : T('Code de confirmation envoyé par e-mail')); else { toast(j.nouveau ? T('🎉 Compte créé ✓') : T('Connecté ✓')); if (j.avertissement) toast('🎁 ' + j.avertissement); } redraw(); };
      on('ofSendCode', async () => { await envoyerCode(v('ofEmail'), A.mode); toast(T('Code envoyé à {} ✓', L.masquerEmail(A.email))); redraw(); });
      on('ofLogin', async () => apres(await connexion({ email: v('ofEmail'), motDePasse: v('ofMdp') })));
      on('ofSignup', async () => apres(await inscription({ email: v('ofEmail'), code: v('ofOtp'), motDePasse: deuxMdp(), parrain: v('ofParrainSignup').trim() })));
      on('ofReset', async () => apres(await reinitialiser({ email: v('ofEmail'), code: v('ofOtp'), motDePasse: deuxMdp(), code2fa: v('ofCode2faReset').trim() })));
      on('ofEtape', async () => { const ch = r.querySelector('#ofRetenir'); apres(await validerEtape(v('ofCode2fa') || v('ofCodeApp'), ch ? ch.checked : true)); });
      on('ofAnnuler', () => { Object.assign(A, { etape: null, defi: null }); redraw(); });
      on('ofUnlock', async () => { await garde(); toast(T('Compte déverrouillé ✓')); redraw(); });
      on('ofMdpChange', async () => { await changerMotDePasse(v('ofMdpAnc'), v('ofMdpNv')); toast(T('Mot de passe changé ✓')); sec = null; redraw(); });
      on('ofOtpPrep', async () => { await preparer2fa(v('ofMdp2fa')); redraw(); });
      on('ofOtpOpen', () => N.openOtp(prep2fa.uri));
      on('ofOtpCopy', () => { N.copy(prep2fa.secret); toast(T('Clé copiée ✓')); });
      on('ofOtpOn', async () => { await activer2fa(v('ofOtpAct')); toast(T('Double authentification activée ✓')); redraw(); });
      on('ofOtpOff', async () => { await desactiver2fa(v('ofMdpOff'), v('ofCodeSec')); toast(T('Double authentification désactivée')); redraw(); });
      on('ofSecNew', async () => { await regenererSecours(v('ofCodeSec')); redraw(); });
      on('ofSecCopy', () => { N.copy(secours.join('\n')); toast(T('Codes copiés ✓')); });
      on('ofSecOk', () => { secours = null; sec = null; redraw(); });
      on('ofBio', async () => { const b = r.querySelector('#ofBio'); await biometrieActiver(b.dataset.on === '1'); toast(b.dataset.on === '1' ? T('Déverrouillage biométrique activé ✓') : T('Déverrouillage biométrique désactivé')); redraw(); });
      on('ofSessions', async () => { if (!confirm(T('Déconnecter tous les autres appareils ?'))) return; await fermerSessions(); toast(T('Autres appareils déconnectés ✓')); redraw(); });
      r.querySelectorAll('[data-confiance]').forEach((b) => { b.onclick = async () => { try { await retirerConfiance(b.dataset.confiance); redraw(); } catch (e) { toast(e.message); } }; });
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
    return { init, refresh, droits, actif, pourChat, verifierAjout, noterTransition, enTransition, activite, html, mount, keyed, activer, parrain, acheter, achatPossible, envoyerCode, inscription, connexion, validerEtape, reinitialiser, securite, changerMotDePasse, preparer2fa, activer2fa, desactiver2fa, regenererSecours, retirerConfiance, fermerSessions, biometrieActiver, garde, deconnexion, transferer, nouveauCode, get verrouille() { return verrouille; }, get attente() { return A.etape; } };
  };
})();
