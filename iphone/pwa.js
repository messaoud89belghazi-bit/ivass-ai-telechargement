/* Version iPhone / web d'Ivass AI : installation sur l'écran d'accueil, fonctionnement hors ligne, mises à jour.
 * Ne fait rien dans l'application Android (window.IvassNative existe alors). */
(function () {
  'use strict';
  if (window.IvassNative || window.__iosBoot) return; // applications Android et iPhone : rien à faire ici
  const N = window.Native || {};
  const LS = { get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* plein */ } } };
  let reg = null;

  // ---------- Bandeau en bas de l'écran ----------
  function banner(id, html, onReady) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('div'); el.id = id; el.className = 'pwa-banner'; document.body.appendChild(el); }
    el.innerHTML = html; el.classList.remove('hidden');
    onReady && onReady(el);
    return el;
  }

  // ---------- Mises à jour (service worker) ----------
  function offerReload(worker) {
    banner('pwaUpdate', `<img src="emblem.png" alt=""><div class="grow"><b>Nouvelle version d’Ivass AI prête</b><small>Vos discussions sont conservées.</small></div>
      <button class="btn sm primary" id="pwaReload">Mettre à jour</button><button class="btn sm" id="pwaLater" aria-label="Plus tard">✕</button>`, (el) => {
      el.querySelector('#pwaReload').onclick = () => { el.querySelector('#pwaReload').disabled = true; worker.postMessage('activer'); };
      el.querySelector('#pwaLater').onclick = () => el.classList.add('hidden');
    });
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
    // Recharger seulement quand une NOUVELLE version prend la main (pas au tout premier lancement).
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloading) return; reloading = true; location.reload(); });
    navigator.serviceWorker.register('sw.js').then((r) => {
      reg = r;
      const watch = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerReload(w); });
      if (r.waiting && navigator.serviceWorker.controller) offerReload(r.waiting);
      watch(r.installing);
      r.addEventListener('updatefound', () => watch(r.installing));
      // Vérifie aussi quand on revient dans l'application (l'iPhone la garde souvent ouverte en arrière-plan).
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') r.update().catch(() => {}); });
    }).catch(() => { /* navigation privée ou non pris en charge : l'application marche quand même, sans hors-ligne */ });
  }

  // Demande à Safari de ne pas effacer les données d'Ivass AI quand le téléphone manque de place.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ---------- Aide à l'installation sur iPhone ----------
  const SHARE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-label="Partager" style="vertical-align:-3px"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  function installHint(force) {
    if (!N.isIOS || N.standalone) return;
    const last = +(LS.get('pwa:hint') || 0);
    if (!force && Date.now() - last < 3 * 24 * 3600e3) return;
    banner('pwaInstall', `<img src="icones/apple-touch-icon.png" alt="" class="app-ico"><div class="grow"><b>Installer Ivass AI sur votre iPhone</b>
      <small>Dans Safari, touchez ${SHARE_ICON} <b>Partager</b>, puis <b>« Sur l’écran d’accueil »</b> et <b>Ajouter</b>. Vos données seront mieux protégées et l’app s’ouvrira en plein écran.</small></div>
      <button class="btn sm" id="pwaHintNo" aria-label="Fermer">✕</button>`, (el) => {
      el.querySelector('#pwaHintNo').onclick = () => { LS.set('pwa:hint', String(Date.now())); el.classList.add('hidden'); };
    });
  }
  setTimeout(() => installHint(false), 2500);

  window.IvassPWA = {
    checkNow: () => { if (reg) reg.update().catch(() => {}); },
    installHint: () => installHint(true),
  };
})();
