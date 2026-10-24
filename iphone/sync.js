/**
 * Synchronisation chiffrée Ivass AI (même fichier sur le téléphone et dans Ivass AI desktop)
 * ----------------------------------------------------------------------------------------
 * - Un « code de synchronisation » (choisi ou généré, 16 caractères minimum) relie vos appareils.
 * - Clé de chiffrement : PBKDF2-SHA256 (150 000 tours) à partir du code → AES-256-GCM.
 * - Le serveur ne reçoit que : l'empreinte de l'espace, une preuve d'accès, des noms d'éléments, des dates
 *   et des données chiffrées illisibles. Les clés API ne sont JAMAIS synchronisées.
 * - Chaque discussion (c:…) et chaque fiche (l:…) est un élément séparé ; le plus récent gagne ;
 *   une suppression laisse une « pierre tombale » pour être appliquée sur les autres appareils.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || require('crypto').webcrypto.subtle;
  const getRandom = (n) => { const a = new Uint8Array(n); (globalThis.crypto || require('crypto').webcrypto).getRandomValues(a); return a; };
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const sha = async (s) => hex(await subtle().digest('SHA-256', enc.encode(s)));

  /** Code lisible à recopier sur l'autre appareil, ex. « K7QM-2XRP-9TDA-HV4C-WN8B ». */
  function newCode() {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const r = getRandom(20);
    return [...r].map((x) => A[x % A.length]).join('').match(/.{5}/g).join('-');
  }
  const normCode = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');

  /** Prépare l'espace : identifiant, preuve d'accès, clé AES. */
  async function open(code) {
    code = normCode(code);
    if (code.replace(/-/g, '').length < 16) throw new Error('Code de synchronisation trop court (16 caractères minimum).');
    const space = (await sha('ivass-space:' + code)).slice(0, 40);
    const proof = await sha('ivass-write:' + code);
    const base = await subtle().importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('ivass-sync-v1:' + space), iterations: 150000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { space, proof, key };
  }
  async function seal(sp, obj) {
    const iv = getRandom(12);
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, sp.key, enc.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
    return b64(out);
  }
  async function unseal(sp, data) {
    const raw = unb64(data);
    const pt = await subtle().decrypt({ name: 'AES-GCM', iv: raw.subarray(0, 12) }, sp.key, raw.subarray(12));
    return JSON.parse(dec.decode(pt));
  }

  /**
   * Synchronise. opts = {
   *   server, code, http(o) → {status, ok, body},
   *   local: { items: Map(name → { updated, value }) , deleted: { name: ts } },
   *   apply(name, value|null, updated)  ← écrit localement (null = supprimé),
   *   onStep(text)
   * } → { pulled, pushed, removed }
   */
  async function run(opts) {
    const sp = await open(opts.code);
    const base = String(opts.server || '').replace(/\/+$/, '');
    if (!/^https:\/\//.test(base) && !/^http:\/\/127\.0\.0\.1/.test(base)) throw new Error('Adresse du serveur de synchronisation invalide.');
    const H = { 'content-type': 'application/json', 'x-ivass-proof': sp.proof };
    const call = async (path, method = 'GET', body) => {
      const r = await opts.http({ url: base + '/v1/espace/' + sp.space + path, method, headers: H, body: body == null ? undefined : JSON.stringify(body) });
      if (r.status === 403) throw new Error('Code de synchronisation incorrect pour cet espace.');
      if (!r.ok) throw new Error('Serveur de synchronisation : HTTP ' + r.status);
      return JSON.parse(r.body || '{}');
    };
    const step = opts.onStep || (() => {});
    step('Comparaison avec le serveur…');
    const remote = new Map(((await call('')).items || []).filter((x) => /^[cl]:/.test(x.name)).map((x) => [x.name, x.updated]));
    const local = new Map();
    for (const [name, it] of opts.local.items) local.set(name, it.updated || 0);
    for (const [name, ts] of Object.entries(opts.local.deleted || {})) if ((local.get(name) || 0) < ts) local.set(name, ts);

    const toPull = [...remote].filter(([n, u]) => u > (local.get(n) || 0)).map(([n]) => n);
    const toPush = [...local].filter(([n, u]) => u > (remote.get(n) || 0)).map(([n]) => n);
    let pulled = 0, pushed = 0, removed = 0;
    for (let i = 0; i < toPull.length; i += 50) {
      step(`Réception ${Math.min(i + 50, toPull.length)}/${toPull.length}…`);
      for (const it of (await call('/lire', 'POST', { names: toPull.slice(i, i + 50) })).items || []) {
        let v;
        try { v = await unseal(sp, it.data); } catch (_) { continue; } // illisible : autre code ou donnée abîmée
        if (v && v.deleted) { opts.apply(it.name, null, it.updated); removed++; } else { opts.apply(it.name, v, it.updated); pulled++; }
      }
    }
    for (let i = 0; i < toPush.length; i++) {
      const n = toPush[i];
      if (i % 10 === 0) step(`Envoi ${i + 1}/${toPush.length}…`);
      const it = opts.local.items.get(n);
      const value = it ? it.value : { deleted: true };
      const updated = it ? it.updated : opts.local.deleted[n];
      const data = await seal(sp, value);
      if (data.length > 900 * 1024) continue; // trop gros pour être synchronisé (très longue discussion)
      await call('/element/' + encodeURIComponent(n), 'PUT', { updated, data });
      pushed++;
    }
    step('');
    return { pulled, pushed, removed };
  }
  /**
   * Boîte aux lettres chiffrée entre le téléphone et le PC (questions q:, réponses r:, clés k:).
   * Ne transporte que des DONNÉES : jamais de commande à exécuter.
   */
  function mailbox({ server, code, http }) {
    const base = String(server || '').replace(/\/+$/, '');
    if (!/^https:\/\//.test(base) && !/^http:\/\/127\.0\.0\.1/.test(base)) throw new Error('Adresse du serveur de synchronisation invalide.');
    let spP = null;
    const sp = () => (spP = spP || open(code));
    const call = async (path, method = 'GET', body) => {
      const s = await sp();
      const r = await http({ url: base + '/v1/espace/' + s.space + path, method, headers: { 'content-type': 'application/json', 'x-ivass-proof': s.proof }, body: body == null ? undefined : JSON.stringify(body), timeout: 30000 });
      if (r.status === 403) throw new Error('Code de synchronisation incorrect pour cet espace.');
      if (!r.ok) throw new Error('Serveur de synchronisation : HTTP ' + r.status);
      return JSON.parse(r.body || '{}');
    };
    return {
      async list(prefix) { return ((await call('?prefixe=' + encodeURIComponent(prefix))).items || []).filter((x) => x.name.startsWith(prefix)); },
      async read(name) {
        const it = ((await call('/lire', 'POST', { names: [name] })).items || [])[0];
        if (!it) return null;
        try { return { updated: it.updated, value: await unseal(await sp(), it.data) }; } catch (_) { return null; }
      },
      async write(name, value) { await call('/element/' + encodeURIComponent(name), 'PUT', { updated: Date.now(), data: await seal(await sp(), value) }); },
      async remove(name) { await call('/element/' + encodeURIComponent(name), 'DELETE'); },
    };
  }
  /** Efface toutes les données de cet espace sur le serveur. */
  async function wipe({ server, code, http }) {
    const sp = await open(code);
    const r = await http({ url: String(server).replace(/\/+$/, '') + '/v1/espace/' + sp.space, method: 'DELETE', headers: { 'x-ivass-proof': sp.proof } });
    if (!r.ok) throw new Error('Effacement impossible : HTTP ' + r.status);
    return true;
  }
  return { newCode, open, seal, unseal, run, wipe, normCode, mailbox };
});
