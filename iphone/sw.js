/* Service worker de la version iPhone / web d'Ivass AI.
 * - Garde une copie de l'application pour l'ouvrir sans réseau.
 * - « Réseau d'abord » pour les fichiers de l'application : chaque ouverture en ligne récupère la dernière version.
 * - Ne touche jamais aux appels vers les IA ni au serveur de synchronisation (autres adresses).
 * VERSION est réécrit à chaque publication (outils/web.mjs) : c'est ce qui déclenche la mise à jour sur les iPhone.
 */
'use strict';
const VERSION = '1.6.27-mvvrxgqj';
const CACHE = 'ivass-ai-' + VERSION;
const SHELL = [
  './', 'index.html', 'app.css', 'web-version.js', 'pwa.js', 'native.js', 'i18n.js', 'i18n-boot.js', 'platforms.js', 'markdown.js', 'lib.js', 'encyclo.js', 'fichiers.js', 'sync.js',
  'nacl-fast.min.js', 'contrib.js', 'core.js', 'livrables-core.js', 'livrables-ui.js', 'app.js', 'config.json', 'manifest.webmanifest',
  'emblem.png', 'wordmark.png', 'icon.png', 'qr.png', 'icones/apple-touch-icon.png', 'icones/icone-192.png',
  'fonts/cinzel-latin-400-normal.woff2', 'fonts/cinzel-latin-600-normal.woff2',
  'legal/CGU.md', 'legal/CONFIDENTIALITE.md', 'legal/MOBILE.md',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('ivass-ai-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (e) => { if (e.data === 'activer') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // IA, synchronisation, mises à jour : directement sur le réseau
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (_) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await cache.match('index.html'); if (home) return home; }
      return new Response('Hors ligne', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
  })());
});
