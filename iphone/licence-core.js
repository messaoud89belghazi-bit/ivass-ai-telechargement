/*
 * ⭐ Versions d'Ivass AI — un seul fichier pour le PC, le téléphone et le serveur.
 *
 *  Free 0 € (5 clés) · Basic 2,99 € (10) · Plus 4,99 € (15) · Pro 9,99 € (25) · Enterprise 19,99 € (40) · Ultimate 29,99 € (illimité)
 *  - Au-delà des clés comprises, tout le monde paie le même palier de clés API : 6-10, 11-15, 16-20, 21-25, 26-30, plus de 30.
 *  - Matrice des permissions : FONCTIONS (fonction → version minimale) ; AVANTAGES (services non techniques par version).
 *  - Une licence couvre 1 PC + 1 téléphone (APPAREILS) ; un nouvel appareil du même type demande un transfert.
 *  - Parrainage : codes IVASS-XXXXX-XXXX (avec caractère de contrôle), récompenses progressives (PALIERS_PARRAINAGE).
 *
 * Les prix sont ici et nulle part ailleurs (outils/activer-paiements.js crée les offres PayPal à partir d'eux).
 * La licence est signée par le serveur (ECDSA P-256) : l'application vérifie la signature avec la clé publique.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassLicence = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEVISE = 'EUR';
  const O = (id, nom, prix, cles, rang, icone) => ({ id, nom, prix, cles, rang, icone });
  const OFFRES = {
    gratuit: O('gratuit', 'Free', 0, 5, 0, '🌱'),
    basic: O('basic', 'Basic', 2.99, 10, 1, '🔹'),
    plus: O('plus', 'Plus', 4.99, 15, 2, '⭐'),
    pro: O('pro', 'Pro', 9.99, 25, 3, '💎'),
    enterprise: O('enterprise', 'Enterprise', 19.99, 40, 4, '🏢'),
    ultimate: O('ultimate', 'Ultimate', 29.99, Infinity, 5, '👑'),
  };
  const ORDRE = ['gratuit', 'basic', 'plus', 'pro', 'enterprise', 'ultimate'];
  const ANCIENNES = { expert: 'ultimate' }; // licences émises avant la 3.20
  const offreId = (o) => (OFFRES[o] ? o : ANCIENNES[o] || 'gratuit');

  // Paliers de clés API (prix par mois, en plus de l'offre). « max » = nombre de clés autorisées.
  const PALIERS = [
    { id: 'p10', min: 6, max: 10, prix: 1.99 },
    { id: 'p15', min: 11, max: 15, prix: 3.49 },
    { id: 'p20', min: 16, max: 20, prix: 4.99 },
    { id: 'p25', min: 21, max: 25, prix: 6.99 },
    { id: 'p30', min: 26, max: 30, prix: 8.99 },
    { id: 'illimite', min: 31, max: Infinity, prix: 14.99 },
  ];
  const GRACE_JOURS = 7; // après la date de fin payée : hors ligne, retard PayPal…
  const TRANSITION_JOURS = 14; // utilisateurs existants au-delà de la limite : 14 jours avant la mise en pause
  const APPAREILS = { pc: 1, mobile: 1 }; // une licence = 1 PC principal + 1 téléphone principal
  const APPAREILS_MAX = APPAREILS.pc + APPAREILS.mobile;
  const TRANSFERT = { delaiJours: 30, maxParAn: 6 }; // 1 transfert gratuit par type d'appareil tous les 30 jours
  const JOUR = 864e5;

  // ---------- Matrice des permissions : fonction → version minimale ----------
  const F = (niveau, nom, icone) => ({ niveau, nom, icone });
  const FONCTIONS = {
    synchro: F('basic', 'Synchronisation PC et téléphone', '📱'),
    studio: F('basic', 'Studio images', '🎨'),
    livrables: F('basic', 'Fichiers Word, PDF, Excel, PowerPoint', '📦'),
    agent: F('plus', 'Mode Agent', '🤖'),
    research: F('plus', 'Recherche autonome', '🔎'),
    explorer: F('plus', 'Explorateur', '🛰'),
    compare: F('plus', 'Mode comparaison', '⚖️'),
    academie: F('plus', 'Académie complète (niveaux 2 à 6)', '🎓'),
    atelier: F('plus', 'Atelier d’assistants', '🧪'),
    connectPlus: F('plus', 'Rattacher sans limite', '🔗'),
    council: F('pro', 'Conseil multi-agents', '🏛'),
    deep: F('pro', 'Réflexion profonde', '🧠'),
    architecte: F('pro', 'Mode Architecte', '📐'),
    missions: F('pro', 'Missions autonomes', '🎯'),
    kits: F('pro', 'Kits de démarrage', '🧰'),
    mcp: F('pro', 'Serveurs MCP', '🧩'),
    projects: F('pro', 'Projets et publication GitHub', '📁'),
    modelfile: F('pro', 'Modelfile Ollama', '🦙'),
    business: F('enterprise', 'Smart Audit et Smart CEO', '🏢'),
    devops: F('enterprise', 'Pipeline CI/CD', '⚙️'),
    videoIA: F('enterprise', 'Studio vidéo IA', '🎬'),
    studio3d: F('enterprise', 'Studio 3D', '🧊'),
    upscale: F('enterprise', 'Images 4K / 8K', '✨'),
    anticipe: F('ultimate', 'Accès anticipé aux nouveautés', '🚀'),
  };
  // Services non techniques (affichés, pas de verrou dans le code)
  const AVANTAGES = {
    gratuit: ['Sans compte', 'Académie niveaux 0 et 1', 'Docs officielles', '11 langues'],
    basic: ['Compte Ivass (e-mail)', '1 PC + 1 téléphone'],
    plus: [],
    pro: [],
    enterprise: ['Facture avec TVA sur demande', 'Support prioritaire'],
    ultimate: ['Clés API illimitées'],
  };
  const RATTACHER_GRATUIT = 3; // sources rattachées sans « Rattacher sans limite »

  // ---------- Parrainage ----------
  const PARRAINAGE = { joursUtilisation: 3, delaiDeclarationJours: 30, codeValiditeJours: 365, clesMax: 5, validationsParJour: 3 };
  // Récompenses progressives, débloquées une fois chacune (n = filleuls validés)
  const R = (n, type, gain, extra) => ({ n, type, gain, ...extra });
  const PALIERS_PARRAINAGE = [
    R(1, 'cles', '+1 clé API', { cles: 1 }),
    R(2, 'cles', '+1 clé API', { cles: 1 }),
    R(3, 'offre', '15 jours Plus', { offre: 'plus', jours: 15, cles: 1 }),
    R(4, 'cles', '+1 clé API', { cles: 1 }),
    R(5, 'fonction', 'Mode Architecte pendant 30 jours', { fonction: 'architecte', jours: 30, cles: 1, badge: 'bronze' }),
    R(10, 'offre', '1 mois Pro', { offre: 'pro', jours: 30, badge: 'argent' }),
    R(15, 'fonction', 'Studio vidéo IA pendant 30 jours', { fonction: 'videoIA', jours: 30 }),
    R(25, 'offre', '1 mois Ultimate', { offre: 'ultimate', jours: 30, badge: 'or' }),
    R(50, 'offre', '3 mois Ultimate', { offre: 'ultimate', jours: 90, badge: 'ambassadeur' }),
  ];
  const BADGES = { bronze: '🥉 Bronze', argent: '🥈 Argent', or: '🥇 Or', ambassadeur: '🏆 Ambassadeur' };

  const rang = (o) => OFFRES[offreId(o)].rang;
  const arrondi = (x) => Math.round(x * 100) / 100;
  const euros = (x, locale) => new Intl.NumberFormat(locale || 'fr-FR', { style: 'currency', currency: DEVISE }).format(x);

  /** Palier nécessaire pour n clés avec une offre (null si l'offre suffit). */
  function palierPour(n, offre = 'gratuit') {
    const base = OFFRES[offreId(offre)].cles;
    if (n <= base) return null;
    return PALIERS.find((p) => p.max >= n && p.max > base) || PALIERS[PALIERS.length - 1];
  }
  const palierParId = (id) => PALIERS.find((p) => p.id === id) || null;

  /** Combinaison vendable ? (le palier doit apporter plus de clés que l'offre seule) */
  function valide(offre, palier) {
    if (!OFFRES[offre]) return false;
    if (!palier) return offre !== 'gratuit';
    const p = palierParId(palier);
    return !!p && p.max > OFFRES[offre].cles;
  }
  const planCle = (offre, palier) => (palier ? `${offre}+${palier}` : offre);
  function tarif(offre, palier) {
    if (!valide(offre, palier)) return null;
    const p = palier ? palierParId(palier) : null;
    return arrondi(OFFRES[offre].prix + (p ? p.prix : 0));
  }
  /** Toutes les formules à créer chez PayPal. */
  function formules() {
    const out = [];
    for (const o of ORDRE) {
      if (o !== 'gratuit') out.push({ cle: planCle(o, null), offre: o, palier: null, prix: tarif(o, null) });
      for (const p of PALIERS) if (valide(o, p.id)) out.push({ cle: planCle(o, p.id), offre: o, palier: p.id, prix: tarif(o, p.id) });
    }
    return out;
  }
  /** Formule la moins chère pour n clés et au moins la version voulue. */
  function moinsCher(n, offreMin = 'gratuit') {
    let best = null;
    for (const f of [{ cle: 'gratuit', offre: 'gratuit', palier: null, prix: 0 }, ...formules()]) {
      if (rang(f.offre) < rang(offreMin)) continue;
      const max = f.palier ? palierParId(f.palier).max : OFFRES[f.offre].cles;
      if (max < n) continue;
      if (!best || f.prix < best.prix || (f.prix === best.prix && rang(f.offre) > rang(best.offre))) best = f;
    }
    return best;
  }

  /**
   * Ce que donne une licence à une date : version en cours, nombre de clés, fonctions offertes.
   * lic = contenu signé (voir serveur) ; null = Free.
   *   offerts  = [{ o: offre, j: date de fin }]   (jours offerts par le parrainage ou le créateur)
   *   fonctions = [{ f: fonction, j: date de fin }] (fonctions temporaires)
   */
  function droits(lic, now = Date.now()) {
    const l = lic || {};
    if (l.createur) return { offre: 'ultimate', cles: Infinity, palier: 'illimite', createur: true, jusqua: Infinity, bonus: 0, source: 'createur', extra: [], compte: !!l.compte };
    let offre = 'gratuit', palier = null, jusqua = 0, source = 'gratuit';
    const o = offreId(l.offre);
    if (o !== 'gratuit' && l.jusqua && now <= l.jusqua + GRACE_JOURS * JOUR) { offre = o; jusqua = l.jusqua; source = 'abonnement'; }
    if (l.palier && l.jusqua && now <= l.jusqua + GRACE_JOURS * JOUR) { palier = l.palier; jusqua = Math.max(jusqua, l.jusqua); if (source === 'gratuit') source = 'abonnement'; }
    const offerts = [...(Array.isArray(l.offerts) ? l.offerts : [])];
    if (l.proJusqua) offerts.push({ o: 'plus', j: l.proJusqua }); // licences 3.18-3.19
    if (l.expertJusqua) offerts.push({ o: 'ultimate', j: l.expertJusqua });
    for (const x of offerts) {
      const xo = offreId(x && x.o);
      if (x && now <= Number(x.j) && rang(xo) > rang(offre)) { offre = xo; jusqua = Number(x.j); source = 'parrainage'; }
    }
    const extra = (Array.isArray(l.fonctions) ? l.fonctions : []).filter((x) => x && FONCTIONS[x.f] && now <= Number(x.j)).map((x) => ({ f: x.f, j: Number(x.j) }));
    const bonus = Math.min(PARRAINAGE.clesMax, Math.max(0, Number(l.bonus) || 0));
    const base = OFFRES[offre].cles;
    const p = palier ? palierParId(palier) : null;
    const cles = (p && p.max > base ? p.max : base) + bonus;
    return { offre, cles, palier, jusqua, bonus, source, createur: false, extra, compte: !!l.compte };
  }
  /** La fonction est-elle permise avec ces droits ? (version suffisante, ou fonction offerte temporairement) */
  const peut = (fonction, d) => {
    const f = FONCTIONS[fonction];
    if (!f) return true;
    const x = d || {};
    if (Array.isArray(x.extra) && x.extra.some((e) => e.f === fonction)) return true;
    return rang(x.offre) >= rang(f.niveau);
  };
  const niveauDe = (fonction) => (FONCTIONS[fonction] ? FONCTIONS[fonction].niveau : 'gratuit');
  /** Matrice : pour chaque version, les fonctions qu'elle ajoute par rapport à la précédente. */
  const matrice = () => ORDRE.map((o) => ({ offre: o, ajoute: Object.keys(FONCTIONS).filter((f) => FONCTIONS[f].niveau === o), avantages: AVANTAGES[o] || [] }));

  /**
   * Clés actives : les « max » premières par ordre de priorité ; les autres restent enregistrées mais en pause.
   * cles = [{ id, priorite, ordre }] ; renvoie un Set des id actifs.
   */
  function clesActives(cles, max) {
    if (!Number.isFinite(max)) return new Set(cles.map((k) => k.id));
    const tri = [...cles].sort((a, b) => (a.priorite ?? 5) - (b.priorite ?? 5) || (a.ordre ?? 0) - (b.ordre ?? 0));
    return new Set(tri.slice(0, Math.max(0, max)).map((k) => k.id));
  }

  /** Récompenses débloquées pour n filleuls validés, et la prochaine. */
  function recompenses(n) {
    const gagnes = PALIERS_PARRAINAGE.filter((r) => r.n <= n);
    const cles = Math.min(PARRAINAGE.clesMax, gagnes.reduce((a, r) => a + (r.cles || 0), 0));
    const badge = [...gagnes].reverse().find((r) => r.badge);
    const prochain = PALIERS_PARRAINAGE.find((r) => r.n > n) || null;
    return { cles, gagnes: gagnes.map((r) => r.n), badge: badge ? badge.badge : null, prochain: prochain ? { filleuls: prochain.n, gain: prochain.gain } : null };
  }
  /** Nouveaux paliers franchis en passant de « avant » à « apres » filleuls validés. */
  const paliersFranchis = (avant, apres) => PALIERS_PARRAINAGE.filter((r) => r.n > avant && r.n <= apres);

  // ---------- Signature (ECDSA P-256 / SHA-256, WebCrypto : navigateur, Node 18+, Cloudflare) ----------
  const CHAMPS = ['v', 'compte', 'offre', 'palier', 'jusqua', 'bonus', 'proJusqua', 'expertJusqua', 'offerts', 'fonctions', 'createur', 'appareil', 'type', 'emis'];
  const canon = (l) => JSON.stringify(CHAMPS.map((k) => [k, l[k] === undefined ? null : l[k]]));
  const subtle = () => (typeof crypto !== 'undefined' && crypto.subtle) || (typeof require === 'function' ? require('crypto').webcrypto.subtle : null);
  const b64 = { to: (buf) => { const b = new Uint8Array(buf); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s); }, from: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) };
  const ALGO = { name: 'ECDSA', namedCurve: 'P-256' }, SIGN = { name: 'ECDSA', hash: 'SHA-256' };

  async function signer(contenu, clePriveePkcs8B64) {
    const key = await subtle().importKey('pkcs8', b64.from(clePriveePkcs8B64), ALGO, false, ['sign']);
    const sig = await subtle().sign(SIGN, key, new TextEncoder().encode(canon(contenu)));
    return { ...contenu, sig: b64.to(sig) };
  }
  /** Vérifie une licence signée ; renvoie le contenu ou null (signature fausse, autre appareil, illisible). */
  async function verifier(lic, clePubliqueSpkiB64, appareil) {
    try {
      if (!lic || !lic.sig || !clePubliqueSpkiB64) return null;
      const key = await subtle().importKey('spki', b64.from(clePubliqueSpkiB64), ALGO, false, ['verify']);
      const ok = await subtle().verify(SIGN, key, b64.from(lic.sig), new TextEncoder().encode(canon(lic)));
      if (!ok) return null;
      if (appareil && lic.appareil && lic.appareil !== appareil) return null;
      const { sig, ...contenu } = lic;
      return contenu;
    } catch (_) { return null; }
  }
  async function nouvellesCles() {
    const k = await subtle().generateKey(ALGO, true, ['sign', 'verify']);
    return { privee: b64.to(await subtle().exportKey('pkcs8', k.privateKey)), publique: b64.to(await subtle().exportKey('spki', k.publicKey)) };
  }

  // ---------- Codes ----------
  // Sans 0/O/1/I pour la lecture. Licence (secret, ancien système), session d'appareil (secret), parrainage (public).
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd = () => (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto : require('crypto').webcrypto);
  const aleatoire = (n) => { const r = new Uint8Array(n); rnd().getRandomValues(r); return [...r].map((x) => ALPHA[x % ALPHA.length]).join(''); };
  const codeLicence = () => 'IVL-' + [0, 1, 2, 3].map(() => aleatoire(5)).join('-');
  const codeSession = () => 'IVS-' + [0, 1, 2, 3, 4, 5].map(() => aleatoire(5)).join('-');
  /** Caractère de contrôle : détecte une faute de frappe ou une lettre échangée. */
  const controle = (s) => { let t = 0; [...s].forEach((c, i) => { t += (ALPHA.indexOf(c) + 1) * (i + 3); }); return ALPHA[t % ALPHA.length]; };
  const codeParrain = () => { const a = aleatoire(5), b = aleatoire(3); return `IVASS-${a}-${b}${controle(a + b)}`; };
  const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const estCodeLicence = (s) => /^IVL[A-Z2-9]{20}$/.test(normCode(s));
  const estCodeSession = (s) => /^IVS[A-Z2-9]{30}$/.test(normCode(s));
  const estAncienParrain = (s) => /^IVA[A-Z2-9]{6}$/.test(normCode(s));
  const estCodeParrain = (s) => {
    const n = normCode(s);
    if (estAncienParrain(n)) return true;
    const m = /^IVASS([A-HJ-NP-Z2-9]{5})([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9])$/.exec(n);
    return !!m && controle(m[1] + m[2]) === m[3];
  };
  const formatLicence = (s) => { const n = normCode(s).slice(3); return 'IVL-' + n.match(/.{1,5}/g).join('-'); };
  const formatSession = (s) => { const n = normCode(s).slice(3); return 'IVS-' + n.match(/.{1,5}/g).join('-'); };
  const formatParrain = (s) => { const n = normCode(s); if (estAncienParrain(n)) return 'IVA-' + n.slice(3); return `IVASS-${n.slice(5, 10)}-${n.slice(10)}`; };
  const emailValide = (e) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i.test(String(e || '').trim()) && String(e).length <= 254;
  const normEmail = (e) => String(e || '').trim().toLowerCase();
  const masquerEmail = (e) => { const [u, d] = normEmail(e).split('@'); return u && d ? `${u[0]}${'•'.repeat(Math.min(6, Math.max(2, u.length - 1)))}@${d}` : ''; };

  return {
    DEVISE, OFFRES, ORDRE, PALIERS, PARRAINAGE, PALIERS_PARRAINAGE, BADGES, FONCTIONS, AVANTAGES, RATTACHER_GRATUIT, GRACE_JOURS, TRANSITION_JOURS,
    APPAREILS, APPAREILS_MAX, TRANSFERT,
    offreId, palierPour, palierParId, valide, planCle, tarif, formules, moinsCher, droits, peut, niveauDe, matrice, clesActives, recompenses, paliersFranchis,
    signer, verifier, nouvellesCles, canon, euros, rang,
    codeLicence, codeSession, codeParrain, controle, normCode, estCodeLicence, estCodeSession, estCodeParrain, formatLicence, formatSession, formatParrain,
    emailValide, normEmail, masquerEmail,
  };
});
