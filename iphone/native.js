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
      const spec = { url: o.url, method: o.method || 'GET', headers: o.headers || {}, stream: !!o.stream, timeout: o.timeout || 180000 };
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
    if (o.stream && r.ok && r.body) {
      const rd = r.body.getReader(); const d = new TextDecoder();
      for (;;) { const { done, value } = await rd.read(); if (done) break; o.onChunk && o.onChunk(d.decode(value, { stream: true })); }
      return { status: r.status, ok: true, headers, body: '' };
    }
    return { status: r.status, ok: r.ok, headers, body: await r.text() };
  }
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
    installUpdate: (url) => { if (N && N.installUpdate) N.installUpdate(url); else window.open(url, '_blank', 'noopener'); },
  };
})();
