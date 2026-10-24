/* Enveloppe du pont Android (IvassNative) en promesses. Sans Android (version iPhone / web), repli sur fetch + localStorage. */
(function () {
  'use strict';
  const N = window.IvassNative;
  const pending = new Map();
  let seq = 0;
  window.__nat = {
    chunk(id, t) { const p = pending.get(id); if (p && p.onChunk) p.onChunk(t); },
    done(id, status, headers, body) { const p = pending.get(id); if (!p) return; pending.delete(id); p.resolve({ status, ok: status >= 200 && status < 300, headers: headers || {}, body: body || '' }); },
    fail(id, msg) { const p = pending.get(id); if (!p) return; pending.delete(id); p.reject(new Error(p.aborted ? 'Arrêté.' : 'Réseau : ' + msg)); },
  };

  /** o = { url, method, headers, body, stream, timeout, onChunk, signal } → { status, ok, headers, body } */
  function http(o) {
    if (!N) return httpFetch(o);
    const id = 'r' + (++seq) + '_' + Date.now();
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, onChunk: o.onChunk };
      pending.set(id, entry);
      if (o.signal) o.signal.addEventListener('abort', () => { entry.aborted = true; N.abort(id); window.__nat.fail(id, 'abort'); }, { once: true });
      const spec = { url: o.url, method: o.method || 'GET', headers: o.headers || {}, stream: !!o.stream, binary: !!o.binary, timeout: o.timeout || 180000 };
      if (o.body instanceof Uint8Array) { let b = ''; for (let i = 0; i < o.body.length; i += 0x8000) b += String.fromCharCode(...o.body.subarray(i, i + 0x8000)); spec.bodyB64 = btoa(b); }
      else if (o.body != null) spec.body = o.body;
      N.http(id, JSON.stringify(spec));
    });
  }
  async function httpFetch(o) {
    const reqHeaders = Object.assign({}, o.headers || {});
    // Version web (iPhone) : Claude n'accepte l'appel direct depuis une page qu'avec cet en-tête.
    if (/^https:\/\/api\.anthropic\.com\//.test(o.url)) reqHeaders['anthropic-dangerous-direct-browser-access'] = 'true';
    let r;
    try { r = await fetch(o.url, { method: o.method || 'GET', headers: reqHeaders, body: o.body, signal: o.signal, cache: 'no-store' }); }
    catch (e) {
      if (o.signal && o.signal.aborted) throw new Error('Arrêté.');
      if (!navigator.onLine) throw new Error('Réseau : pas de connexion');
      throw new Error(new URL(o.url).host + ' n’accepte pas les appels depuis la version iPhone (ou ne répond pas). Essayez Claude, Gemini, Groq, OpenRouter ou le mode 🖥️ Mon PC.');
    }
    const headers = {}; r.headers.forEach((v, k) => { headers[k] = v; });
    if (o.binary && r.ok) return { status: r.status, ok: true, headers, body: b64of(new Uint8Array(await r.arrayBuffer())) };
    if (o.stream && r.ok && r.body) {
      const rd = r.body.getReader(); const d = new TextDecoder();
      for (;;) { const { done, value } = await rd.read(); if (done) break; o.onChunk && o.onChunk(d.decode(value, { stream: true })); }
      return { status: r.status, ok: true, headers, body: '' };
    }
    return { status: r.status, ok: r.ok, headers, body: await r.text() };
  }
  function b64of(u8) { let b = ''; for (let i = 0; i < u8.length; i += 0x8000) b += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(b); }
  function bytesOf(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

  /* ---------- 📦 Fichiers créés par Ivass ----------
     Android : copie privée + Téléchargements › Ivass AI, ouverture et partage par les applications du téléphone.
     iPhone / web : fichiers gardés dans le navigateur (IndexedDB), « Enregistrer » passe par le menu de partage (→ Fichiers). */
  const mem = new Map(); // nom → Blob (pour partager tout de suite, dans le geste de l'utilisateur)
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => { const r = indexedDB.open('ivass-livrables', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    return dbp;
  }
  async function idb(mode, fn) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('f', mode); const q = fn(tx.objectStore('f')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); }
  async function webGet(name) {
    if (mem.has(name)) return mem.get(name);
    try { const b = await idb('readonly', (st) => st.get(name)); if (b) mem.set(name, b); return b || null; } catch (_) { return null; }
  }
  async function webUnique(name) {
    const dot = name.lastIndexOf('.'); const base = name.slice(0, dot), ext = name.slice(dot);
    let n = name;
    for (let i = 2; i < 999; i++) { let ex = mem.has(n); if (!ex) { try { ex = !!(await idb('readonly', (st) => st.getKey(n))); } catch (_) { ex = false; } } if (!ex) return n; n = `${base} (${i})${ext}`; }
    return n;
  }
  function webDownload(blob, name) {
    const u = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = u; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  }
  const files = {
    /** bytes : Uint8Array → { name, where, size } */
    async save(name, bytes, mime) {
      if (N && N.fileSave) { const r = JSON.parse(N.fileSave(name, b64of(bytes), mime || 'application/octet-stream')); if (r.error) throw new Error(r.error); return r; }
      const n = await webUnique(name); const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
      mem.set(n, blob);
      try { await idb('readwrite', (st) => st.put(blob, n)); } catch (_) { /* gardé en mémoire pour cette session */ }
      return { name: n, where: 'Ivass AI', size: bytes.length };
    },
    /** Télécharge une adresse https directement en fichier (vidéos). */
    download(url, headers, name, mime) {
      if (N && N.fileDownload) {
        const id = 'd' + (++seq) + '_' + Date.now();
        return new Promise((resolve, reject) => { pending.set(id, { resolve: (r) => resolve(JSON.parse(r.body)), reject }); N.fileDownload(id, JSON.stringify({ url, headers: headers || {} }), name, mime || 'application/octet-stream'); });
      }
      return httpFetch({ url, headers, binary: true, timeout: 600000 }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return files.save(name, bytesOf(r.body), mime); });
    },
    /** { mime, b64 } ou null (pour réafficher une image). */
    async get(name, mime) {
      if (N && N.fileReadB64) { const b = N.fileReadB64(name); return b ? { mime, b64: b } : null; }
      const blob = await webGet(name); if (!blob) return null;
      return { mime: blob.type || mime, b64: b64of(new Uint8Array(await blob.arrayBuffer())) };
    },
    async exists(name) { if (N && N.fileExists) return N.fileExists(name); return !!(await webGet(name)); },
    /** Charge à l'avance (iPhone) pour que « Enregistrer » ouvre le menu de partage tout de suite. */
    warm(name) { if (!N) webGet(name); },
    async open(name, mime) {
      if (N && N.fileOpen) return N.fileOpen(name, mime);
      const blob = await webGet(name); if (!blob) return false;
      const u = URL.createObjectURL(blob);
      if (!window.open(u, '_blank')) webDownload(blob, name);
      setTimeout(() => URL.revokeObjectURL(u), 120000);
      return true;
    },
    async share(name, mime) {
      if (N && N.fileShare) return N.fileShare(name, mime);
      const blob = mem.get(name) || await webGet(name); if (!blob) return false;
      const f = new File([blob], name, { type: blob.type || mime });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f], title: name }); return true; } catch (e) { if (e && e.name === 'AbortError') return true; }
      }
      webDownload(blob, name);
      return true;
    },
  };
  let fullWarned = 0;
  const LS = {
    get: (k) => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } },
    set: (k, v) => {
      try { localStorage.setItem(k, v); return true; } catch (_) {
        if (Date.now() - fullWarned > 60000) { fullWarned = Date.now(); toastWeb('Stockage du téléphone plein pour Ivass AI : supprimez de vieilles discussions.'); }
        return false;
      }
    },
  };

  /* Petits messages en bas de l'écran (version web ; Android a les siens). */
  let toastT = null;
  function toastWeb(m) {
    let el = document.getElementById('webToast');
    if (!el) { el = document.createElement('div'); el.id = 'webToast'; el.className = 'web-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = String(m || ''); el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200);
  }
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  window.Native = {
    isAndroid: !!N,
    isWeb: !N,
    isIOS: !N && isIOS,
    standalone,
    platform: N ? 'Android' : isIOS ? 'iPhone' : 'Web',
    http,
    secretGet: (name) => (N ? N.secretGet(name) : LS.get('secret:' + name)),
    secretSet: (name, value) => (N ? N.secretSet(name, value) : LS.set('secret:' + name, value)),
    read(name) { const t = N ? N.fileRead(name) : LS.get('file:' + name); try { return t ? JSON.parse(t) : null; } catch (_) { return null; } },
    write(name, obj) { const t = JSON.stringify(obj); return N ? N.fileWrite(name, t) : LS.set('file:' + name, t); },
    share: (t) => (N ? N.share(t) : navigator.share ? navigator.share({ text: t }).catch(() => {}) : navigator.clipboard.writeText(t)),
    copy: (t) => (N ? N.copy(t) : navigator.clipboard && navigator.clipboard.writeText(t)),
    openUrl: (u) => { if (!/^https:\/\//.test(u)) return; N ? N.openUrl(u) : window.open(u, '_blank', 'noopener'); },
    toast: (m) => (N ? N.toast(m) : toastWeb(m)),
    version: () => (N ? N.appVersion() : (window.IVASS_WEB_VERSION || 'aperçu')),
    setBars: (color, light) => {
      if (N && N.setBars) { N.setBars(String(color), !!light); return; }
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', String(color));
    },
    sendTo: (target, text, subject) => (N && N.sendTo ? N.sendTo(target, text, subject || '') : false),
    files,
    b64of, bytesOf,
    installUpdate: (url) => { if (N && N.installUpdate) N.installUpdate(url); else window.open(url, '_blank', 'noopener'); },
  };
})();
