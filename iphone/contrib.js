/**
 * 🤝 Programme d'amélioration d'Ivass AI — version téléphone (FACULTATIF, avec accord explicite).
 * Même format que Ivass AI pour PC : paquets IVX1 (X25519 + HKDF-SHA256 + AES-256-GCM, gzip),
 * scellés pour la clé publique du propriétaire : seul lui peut les relire, le serveur ne voit rien.
 * Tout est nettoyé sur le téléphone avant l'envoi (clés, e-mails, téléphones, IBAN, cartes…).
 * Les clés API, la synchronisation et les discussions marquées 🔒 ne sont jamais envoyées.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./nacl-fast.min.js'));
  else root.IvassContrib = factory(root.nacl);
})(typeof self !== 'undefined' ? self : this, function (nacl) {
  'use strict';
  const CATEGORIES = {
    avis: { icon: '👍', label: 'Notes 👍 / 👎', desc: 'Votre note sur chaque réponse et l’IA qui l’a écrite (aucun texte).' },
    travaux: { icon: '💬', label: 'Conversations nettoyées', desc: 'Vos questions et les réponses d’Ivass, nettoyées sur le téléphone avant tout envoi.' },
    erreurs: { icon: '🐞', label: 'Erreurs', desc: 'Les pannes des IA (quota, clé refusée…) pour améliorer la bascule automatique. Aucun texte de discussion.' },
  };
  const LIMITS = { question: 8000, answer: 12000, text: 4000 };
  const MAX_QUEUE = 2 * 1024 * 1024, MAX_PACKET = 200 * 1024;
  const SECRETS = [
    /sk-ant-[A-Za-z0-9_-]{20,}/g, /sk-(?!ant-|or-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/g, /sk-or-[A-Za-z0-9_-]{20,}/g, /AIza[0-9A-Za-z_-]{35}/g,
    /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|github_pat_[A-Za-z0-9_]{50,}/g, /\bAKIA[0-9A-Z]{16}\b/g, /\b[sr]k_live_[0-9a-zA-Z]{20,}\b/g,
    /\bxox[baprs]-[0-9A-Za-z-]{10,}/g, /\bgsk_[A-Za-z0-9]{20,}/g, /\bhf_[A-Za-z0-9]{20,}/g, /\bxai-[A-Za-z0-9]{20,}/g, /\bnvapi-[A-Za-z0-9_-]{20,}/g,
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]*?(?:-----END[^-]*-----|$)/g,
    /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    /\b(password|passwd|pwd|mot_?de_?passe|secret|api_?key|token)\b\s*[:=]\s*["'][^"'\s]{6,}["']/gi,
    /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/]+:[^@\s]{3,}@/g,
    /\b[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}\b/g, // code de synchronisation Ivass
  ];
  function luhn(d) { let s = 0; for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; } return s % 10 === 0; }
  function scrub(input, max = LIMITS.text) {
    let t = String(input == null ? '' : input);
    for (const re of SECRETS) t = t.replace(re, '[secret]');
    t = t
      .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{16,}/g, '$1 [secret]')
      .replace(/([?&](?:key|api_?key|token|access_token|auth|sig|signature|password|pwd|code|session)=)[^&\s"']+/gi, '$1[secret]')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-mail]')
      .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g, '[IBAN]')
      .replace(/\b[12][ ]?\d{2}[ ]?(?:0[1-9]|1[0-2]|[2-9]\d)[ ]?(?:\d{2}|2[AB])[ ]?\d{3}[ ]?\d{3}[ ]?\d{2}\b/g, '[n° sécurité sociale]')
      .replace(/\b\d(?:[ -]?\d){12,18}\b/g, (m) => { const d = m.replace(/\D/g, ''); return d.length !== 14 && /^[2-6]/.test(d) && luhn(d) ? '[carte]' : m; })
      .replace(/(?:\+33[ .-]?|\b0)[1-9](?:[ .-]?\d{2}){4}\b/g, '[téléphone]')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, (m) => (/^(127\.|0\.)/.test(m) ? m : '[IP]'));
    return t.length > max ? t.slice(0, max) + ' […]' : t;
  }
  function clean(cat, d) {
    d = d || {};
    const meta = { ref: String(d.ref || '').replace(/[^\w:-]/g, '').slice(0, 60), provider: String(d.provider || '').slice(0, 40), model: String(d.model || '').slice(0, 80) };
    if (cat === 'avis') return d.vote === 1 || d.vote === -1 ? { ...meta, vote: d.vote, mode: String(d.mode || '').slice(0, 30) } : null;
    if (cat === 'travaux') return d.question && d.answer ? { ...meta, question: scrub(d.question, LIMITS.question), answer: scrub(d.answer, LIMITS.answer), mode: String(d.mode || '').slice(0, 30), ms: Number(d.ms) || 0 } : null;
    if (cat === 'erreurs') return { type: 'ia', kind: String(d.kind || '').slice(0, 60), message: scrub(d.message, 1500), os: 'android', ...meta };
    if (cat === 'suggestion') return d.text ? { type: ['idee', 'bug', 'autre'].includes(d.type) ? d.type : 'autre', text: scrub(d.text, 6000) } : null;
    return null;
  }

  // ---------- IVX1 (identique à src/ivx.js du PC) ----------
  const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || require('crypto').webcrypto.subtle;
  const rnd = (n) => { const a = new Uint8Array(n); (globalThis.crypto || require('crypto').webcrypto).getRandomValues(a); return a; };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
  async function gzip(u8) {
    const cs = new CompressionStream('gzip');
    const out = new Response(new Blob([u8]).stream().pipeThrough(cs));
    return new Uint8Array(await out.arrayBuffer());
  }
  async function seal(obj, publicKeyB64) {
    let recipient; try { recipient = unb64(publicKeyB64 || ''); } catch (_) { recipient = new Uint8Array(0); }
    if (recipient.length !== 32) throw new Error('Clé publique de contribution absente ou invalide.');
    const eph = nacl.box.keyPair();
    const shared = nacl.scalarMult(eph.secretKey, recipient);
    const keyId = new Uint8Array(await subtle().digest('SHA-256', recipient)).subarray(0, 8);
    const ikm = await subtle().importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    const key = await subtle().deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: cat(eph.publicKey, recipient), info: new TextEncoder().encode('Ivass IVX1 contribution') }, ikm, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const head = cat(new TextEncoder().encode('IVX1'), new Uint8Array([1]), keyId, eph.publicKey);
    const iv = rnd(12);
    const enc = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: head, tagLength: 128 }, key, await gzip(new TextEncoder().encode(JSON.stringify(obj)))));
    const body = enc.subarray(0, enc.length - 16), tag = enc.subarray(enc.length - 16);
    return cat(head, iv, tag, body);
  }
  const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
  const sha256hex = async (s) => hex(new Uint8Array(await subtle().digest('SHA-256', new TextEncoder().encode(s))));
  const uuid = () => { const b = rnd(16); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80; const h = hex(b); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; };

  /**
   * o = { load() → state|null, save(state), dist() → { serverUrl, publicKey }, http(o) → {status, ok, body}, version, now? }
   * state = { consent: { version, at, choices }, installId, deleteToken, queue: [], sent, lastSent, lastError, failures, lastTry }
   */
  function Contrib(o) {
    const now = o.now || Date.now;
    let st = Object.assign({ consent: null, queue: [], sent: 0, failures: 0 }, o.load() || {});
    const save = () => o.save(st);
    const api = {
      CATEGORIES,
      state: () => st,
      asked: () => !!st.consent,
      choices: () => (st.consent && st.consent.choices) || {},
      anyOn: () => Object.values(api.choices()).some(Boolean),
      setConsent(choices) {
        const c = {}; for (const k of Object.keys(CATEGORIES)) c[k] = !!(choices && choices[k]);
        st.consent = { version: 1, at: now(), choices: c };
        if (Object.values(c).some(Boolean) && !st.installId) { st.installId = uuid(); st.deleteToken = hex(rnd(32)); }
        st.queue = st.queue.filter((i) => c[i.cat] || i.cat === 'suggestion');
        save(); return st.consent;
      },
      ensureId() { if (!st.installId) { st.installId = uuid(); st.deleteToken = hex(rnd(32)); save(); } },
      record(category, data) {
        if (category !== 'suggestion' && !api.choices()[category]) return false;
        const item = { cat: category, ts: now(), v: o.version, data: clean(category, data) };
        if (!item.data) return false;
        st.queue.push(item);
        let size = JSON.stringify(st.queue).length;
        while (size > MAX_QUEUE && st.queue.length) { st.queue.shift(); size = JSON.stringify(st.queue).length; }
        save(); return true;
      },
      async flush({ force = false } = {}) {
        const d = o.dist() || {};
        if (!d.serverUrl || !d.publicKey) return { skipped: 'server' };
        if (!st.installId || !st.queue.length) return { sent: 0 };
        const wait = Math.min(60, 2 ** Math.max(0, st.failures - 1)) * 60e3;
        if (!force && st.failures && now() - (st.lastTry || 0) < wait) return { skipped: 'backoff' };
        st.lastTry = now();
        let sent = 0;
        try {
          while (st.queue.length) {
            const pack = []; let size = 0;
            for (const it of st.queue) { const s = JSON.stringify(it).length; if (pack.length && size + s > MAX_PACKET) break; pack.push(it); size += s; }
            const body = await seal({ installId: st.installId, app: 'mobile-' + o.version, os: 'android', at: now(), items: pack }, d.publicKey);
            const r = await o.http({
              url: d.serverUrl.replace(/\/+$/, '') + '/v1/paquet', method: 'POST', body, binary: true,
              headers: { 'content-type': 'application/octet-stream', 'x-ivass-install': st.installId, 'x-ivass-version': 'mobile-' + o.version, 'x-ivass-proof': await sha256hex(st.deleteToken), 'x-ivass-kinds': [...new Set(pack.map((i) => i.cat))].join(',') },
            });
            if (!r.ok) throw new Error('serveur : HTTP ' + r.status);
            st.queue.splice(0, pack.length);
            sent += pack.length; st.sent += pack.length;
          }
          st.lastSent = now(); st.lastError = ''; st.failures = 0;
          return { sent };
        } catch (e) {
          st.failures++; st.lastError = /Réseau|network|fetch|timeout/i.test(e.message) ? 'hors ligne : nouvel essai plus tard' : e.message.slice(0, 200);
          return { sent, error: st.lastError };
        } finally { save(); }
      },
      /** Droit à l'effacement (RGPD) : tout ce qui vient de ce téléphone est supprimé du serveur. */
      async forget() {
        const d = o.dist() || {};
        let deleted = 0;
        if (st.installId && d.serverUrl) {
          const r = await o.http({ url: d.serverUrl.replace(/\/+$/, '') + '/v1/oubli', method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ installId: st.installId, token: st.deleteToken }) });
          if (!r.ok) throw new Error('Effacement impossible : HTTP ' + r.status);
          try { deleted = JSON.parse(r.body).deleted || 0; } catch (_) { /* rien */ }
        }
        st = { consent: { version: 1, at: now(), choices: { avis: false, travaux: false, erreurs: false } }, queue: [], sent: 0, failures: 0 };
        save(); return { deleted };
      },
    };
    return api;
  }
  return { CATEGORIES, scrub, clean, seal, Contrib };
});
