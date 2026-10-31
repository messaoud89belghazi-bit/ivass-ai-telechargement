/*
 * ⭐ Offres d'Ivass AI — un seul fichier pour le PC, le téléphone et le serveur.
 *
 *  - Gratuit : 5 clés API.         Pro (4,99 €/mois) : 20 clés + outils Pro.
 *  - Expert (9,99 €/mois) : 25 clés + outils Pro et Expert.
 *  - Au-delà des clés comprises, tout le monde paie le même palier de clés API :
 *      6-10, 11-15, 16-20, 21-25, 26-30, puis un prix fixe au-delà de 30 (illimité).
 *  - Parrainage : +1 clé par filleul validé (jusqu'à +5) ; 3 filleuls = 1 mois Pro offert ; 10 = 1 mois Expert.
 *
 * Les prix sont ici et nulle part ailleurs (le script outils/paypal-offres.mjs crée les offres PayPal à partir d'eux).
 * La licence est signée par le serveur (ECDSA P-256) : l'application vérifie la signature avec la clé publique.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassLicence = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEVISE = 'EUR';
  const OFFRES = {
    gratuit: { id: 'gratuit', nom: 'Gratuit', prix: 0, cles: 5, rang: 0, icone: '🌱' },
    pro: { id: 'pro', nom: 'Pro', prix: 4.99, cles: 20, rang: 1, icone: '⭐' },
    expert: { id: 'expert', nom: 'Expert', prix: 9.99, cles: 25, rang: 2, icone: '💎' },
  };
  // Paliers de clés API (prix par mois, en plus de l'offre). « max » = nombre de clés autorisées.
  const PALIERS = [
    { id: 'p10', min: 6, max: 10, prix: 1.99 },
    { id: 'p15', min: 11, max: 15, prix: 3.49 },
    { id: 'p20', min: 16, max: 20, prix: 4.99 },
    { id: 'p25', min: 21, max: 25, prix: 6.99 },
    { id: 'p30', min: 26, max: 30, prix: 8.99 },
    { id: 'illimite', min: 31, max: Infinity, prix: 14.99 },
  ];
  const PARRAINAGE = { clesParFilleul: 1, clesMax: 5, moisPro: 3, moisExpert: 10, joursUtilisation: 3 };
  const GRACE_JOURS = 7; // après la date de fin payée : hors ligne, retard PayPal…
  const TRANSITION_JOURS = 14; // utilisateurs existants au-delà de la limite : 14 jours avant la mise en pause
  const APPAREILS_MAX = 3;
  const JOUR = 864e5;

  // Fonctions de l'application PC réservées aux offres payantes.
  const FONCTIONS = {
    agent: { niveau: 'pro', nom: 'Mode Agent', icone: '🤖' },
    research: { niveau: 'pro', nom: 'Recherche autonome', icone: '🔎' },
    explorer: { niveau: 'pro', nom: 'Explorateur', icone: '🛰' },
    atelier: { niveau: 'pro', nom: 'Atelier d’assistants', icone: '🧪' },
    studio: { niveau: 'pro', nom: 'Studio images', icone: '🎨' },
    compare: { niveau: 'pro', nom: 'Mode comparaison', icone: '⚖️' },
    connectPlus: { niveau: 'pro', nom: 'Rattacher sans limite', icone: '🔗' },
    livrables: { niveau: 'pro', nom: 'Fichiers Word, PDF, Excel, PowerPoint', icone: '📦' },
    academie: { niveau: 'pro', nom: 'Académie complète (niveaux 2 à 6)', icone: '🎓' },
    architecte: { niveau: 'pro', nom: 'Mode Architecte', icone: '📐' },
    missions: { niveau: 'pro', nom: 'Missions autonomes', icone: '🎯' },
    council: { niveau: 'expert', nom: 'Conseil multi-agents', icone: '🏛' },
    deep: { niveau: 'expert', nom: 'Réflexion profonde', icone: '🧠' },
    videoIA: { niveau: 'expert', nom: 'Studio vidéo IA', icone: '🎬' },
    studio3d: { niveau: 'expert', nom: 'Studio 3D', icone: '🧊' },
    upscale: { niveau: 'expert', nom: 'Images 4K / 8K', icone: '✨' },
    business: { niveau: 'expert', nom: 'Smart Audit et Smart CEO', icone: '🏢' },
    mcp: { niveau: 'expert', nom: 'Serveurs MCP', icone: '🧩' },
    projects: { niveau: 'expert', nom: 'Projets et publication GitHub', icone: '📁' },
    devops: { niveau: 'expert', nom: 'Pipeline CI/CD', icone: '⚙️' },
    modelfile: { niveau: 'expert', nom: 'Modelfile Ollama', icone: '🦙' },
    kits: { niveau: 'expert', nom: 'Kits de démarrage', icone: '🧰' },
  };
  const RATTACHER_GRATUIT = 3; // sources rattachées avec l'offre gratuite

  const rang = (o) => (OFFRES[o] || OFFRES.gratuit).rang;
  const arrondi = (x) => Math.round(x * 100) / 100;
  const euros = (x, locale) => (x === 0 ? '0 €' : new Intl.NumberFormat(locale || 'fr-FR', { style: 'currency', currency: DEVISE }).format(x));

  /** Palier nécessaire pour n clés avec une offre (null si l'offre suffit). */
  function palierPour(n, offre = 'gratuit') {
    const base = (OFFRES[offre] || OFFRES.gratuit).cles;
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
  /** Toutes les formules à créer chez PayPal (13). */
  function formules() {
    const out = [];
    for (const o of ['gratuit', 'pro', 'expert']) {
      if (o !== 'gratuit') out.push({ cle: planCle(o, null), offre: o, palier: null, prix: tarif(o, null) });
      for (const p of PALIERS) if (valide(o, p.id)) out.push({ cle: planCle(o, p.id), offre: o, palier: p.id, prix: tarif(o, p.id) });
    }
    return out;
  }
  /** Formule la moins chère pour n clés et au moins l'offre voulue (évite par ex. Pro + 21-25 plus cher qu'Expert). */
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
   * Ce que donne une licence à une date : offre en cours, nombre de clés, fonctions.
   * lic = contenu signé (voir serveur) ; null = gratuit.
   */
  function droits(lic, now = Date.now()) {
    const l = lic || {};
    if (l.createur) return { offre: 'expert', cles: Infinity, palier: 'illimite', createur: true, jusqua: Infinity, bonus: 0, source: 'createur' };
    let offre = 'gratuit', palier = null, jusqua = 0, source = 'gratuit';
    const payeOk = l.offre && l.offre !== 'gratuit' && l.jusqua && now <= l.jusqua + GRACE_JOURS * JOUR;
    const palierOk = l.palier && l.jusqua && now <= l.jusqua + GRACE_JOURS * JOUR;
    if (payeOk) { offre = l.offre; jusqua = l.jusqua; source = 'abonnement'; }
    if (palierOk) { palier = l.palier; jusqua = Math.max(jusqua, l.jusqua); if (source === 'gratuit') source = 'abonnement'; }
    // mois offerts par le parrainage (ne remplacent pas une offre supérieure)
    if (l.expertJusqua && now <= l.expertJusqua && rang('expert') > rang(offre)) { offre = 'expert'; jusqua = l.expertJusqua; source = 'parrainage'; }
    if (l.proJusqua && now <= l.proJusqua && rang('pro') > rang(offre)) { offre = 'pro'; jusqua = l.proJusqua; source = 'parrainage'; }
    const bonus = Math.min(PARRAINAGE.clesMax, Math.max(0, Number(l.bonus) || 0));
    const base = OFFRES[offre].cles;
    const p = palier ? palierParId(palier) : null;
    const cles = (p && p.max > base ? p.max : base) + bonus;
    return { offre, cles, palier, jusqua, bonus, source, createur: false };
  }
  const peut = (fonction, d) => {
    const f = FONCTIONS[fonction];
    if (!f) return true;
    return rang((d || {}).offre) >= rang(f.niveau);
  };
  const niveauDe = (fonction) => (FONCTIONS[fonction] ? FONCTIONS[fonction].niveau : 'gratuit');

  /**
   * Clés actives : les « max » premières par ordre de priorité ; les autres restent enregistrées mais en pause.
   * cles = [{ id, priorite, ordre }] ; renvoie un Set des id actifs.
   */
  function clesActives(cles, max) {
    if (!Number.isFinite(max)) return new Set(cles.map((k) => k.id));
    const tri = [...cles].sort((a, b) => (a.priorite ?? 5) - (b.priorite ?? 5) || (a.ordre ?? 0) - (b.ordre ?? 0));
    return new Set(tri.slice(0, Math.max(0, max)).map((k) => k.id));
  }

  /** Récompenses du parrainage pour n filleuls validés. */
  function recompenses(n) {
    return {
      cles: Math.min(PARRAINAGE.clesMax, n * PARRAINAGE.clesParFilleul),
      pro: n >= PARRAINAGE.moisPro,
      expert: n >= PARRAINAGE.moisExpert,
      prochain: n < PARRAINAGE.clesMax ? { filleuls: n + 1, gain: '+1 clé API' }
        : n < PARRAINAGE.moisPro ? { filleuls: PARRAINAGE.moisPro, gain: '1 mois Pro' }
          : n < PARRAINAGE.moisExpert ? { filleuls: PARRAINAGE.moisExpert, gain: '1 mois Expert' } : null,
    };
  }

  // ---------- Signature (ECDSA P-256 / SHA-256, WebCrypto : navigateur, Node 18+, Cloudflare) ----------
  const CHAMPS = ['v', 'compte', 'offre', 'palier', 'jusqua', 'bonus', 'proJusqua', 'expertJusqua', 'createur', 'appareil', 'emis'];
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

  // Codes : licence (secret, 20 caractères) et parrainage (public, court). Sans 0/O/1/I pour la lecture.
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const aleatoire = (n) => { const r = new Uint8Array(n); (typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto : require('crypto').webcrypto).getRandomValues(r); return [...r].map((x) => ALPHA[x % ALPHA.length]).join(''); };
  const codeLicence = () => 'IVL-' + [0, 1, 2, 3].map(() => aleatoire(5)).join('-');
  const codeParrain = () => 'IVA-' + aleatoire(6);
  const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const estCodeLicence = (s) => /^IVL[A-Z2-9]{20}$/.test(normCode(s));
  const estCodeParrain = (s) => /^IVA[A-Z2-9]{6}$/.test(normCode(s));
  const formatLicence = (s) => { const n = normCode(s).slice(3); return 'IVL-' + n.match(/.{1,5}/g).join('-'); };
  const formatParrain = (s) => 'IVA-' + normCode(s).slice(3);

  return {
    DEVISE, OFFRES, PALIERS, PARRAINAGE, FONCTIONS, RATTACHER_GRATUIT, GRACE_JOURS, TRANSITION_JOURS, APPAREILS_MAX,
    palierPour, palierParId, valide, planCle, tarif, formules, moinsCher, droits, peut, niveauDe, clesActives, recompenses,
    signer, verifier, nouvellesCles, canon, euros, rang,
    codeLicence, codeParrain, normCode, estCodeLicence, estCodeParrain, formatLicence, formatParrain,
  };
});
