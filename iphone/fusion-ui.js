/**
 * Ivass AI — 🪄 Fusion : écran commun au PC (Studio) et au téléphone (fichier identique des deux côtés).
 * Le sujet (personne, animal, objet) est détouré puis posé dans la photo d'un lieu, à la bonne taille,
 * avec ses ombres, ses couleurs et son grain accordés à la scène. Le détourage local reste sur l'appareil ; avec un détourage IA,
 * seule la photo du sujet part, vers la plateforme choisie, avec votre propre clé.
 * FusionUI.html() → balisage ; FusionUI.monter(racine, hote) ; hote = { toast, enregistrer(b64png, nom),
 *   detourerIA?(b64, mime, via) → { b64, mime, via } | { aucun: true }, listeIA?() → [{ id, name, available }], derniereImage?() → { b64, mime } }
 * Développé par Messaoud BELGHAZI.
 */
(function () {
  'use strict';
  const F = () => window.FusionCore;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_SUJET = 1400; // côté le plus long pour le détourage local (rapidité sur téléphone)
  const MAX_SCENE = 4096;

  function html() {
    return `<div class="fu">
  <div class="fu-cote">
    <div class="fu-carte"><div class="fu-t">1 · Le sujet <span class="fu-aide">personne, animal, objet, logo, produit</span></div>
      <div class="fu-ligne">
        <label class="fu-btn">📂 Photo du sujet<input type="file" accept="image/*" data-fu="fSujet" hidden></label>
        <label class="fu-btn">📷 Photographier<input type="file" accept="image/*" capture="environment" data-fu="fSujetCam" hidden></label>
        <button class="fu-btn hidden" type="button" data-fu="depuisGalerie">🖼 Dernière image</button>
      </div>
      <div class="fu-ligne"><select data-fu="via" title="Qui détoure le sujet"></select><button class="fu-btn fu-prim" type="button" data-fu="detourer" disabled>🪄 Détourer</button></div>
      <label class="fu-curseur" title="Détourage local : jusqu’où une couleur est considérée comme le fond">Tolérance du fond <input type="range" min="6" max="110" value="34" data-fu="tolerance"></label>
      <div class="fu-apercu-sujet"><canvas data-fu="cvSujet" width="10" height="10"></canvas><div class="fu-vide" data-fu="videSujet">Choisissez une photo du sujet.</div></div>
      <div class="fu-ligne fu-outils">
        <button class="fu-btn" type="button" data-fu="gomme" aria-pressed="false" title="Effacer ce qui reste du fond">🧽 Gomme</button>
        <button class="fu-btn" type="button" data-fu="restaurer" aria-pressed="false" title="Rendre une partie effacée par erreur">🖌 Restaurer</button>
        <label class="fu-curseur fu-petit">Pinceau <input type="range" min="4" max="80" value="22" data-fu="pinceau"></label>
      </div>
    </div>
    <div class="fu-carte"><div class="fu-t">2 · Le lieu</div>
      <div class="fu-ligne">
        <label class="fu-btn">📂 Photo du lieu<input type="file" accept="image/*" data-fu="fScene" hidden></label>
        <label class="fu-btn">📷 Photographier le lieu<input type="file" accept="image/*" capture="environment" data-fu="fSceneCam" hidden></label>
      </div>
      <div class="fu-info" data-fu="infoScene"></div>
    </div>
    <div class="fu-carte"><div class="fu-t">3 · Taille, lumière, réalisme</div>
      <label class="fu-case"><input type="checkbox" data-fu="auto" checked> Taille automatique selon la perspective</label>
      <div class="fu-ligne fu-nombres">
        <label>Taille réelle du sujet <input type="number" min="0.05" max="50" step="0.05" value="1.75" data-fu="hReelle"> m</label>
        <label>Hauteur de l’appareil photo <input type="number" min="0.2" max="20" step="0.05" value="1.6" data-fu="hCamera"> m</label>
      </div>
      <label class="fu-curseur">Couleurs accordées au lieu <input type="range" min="0" max="100" value="40" data-fu="harmonie"></label>
      <label class="fu-curseur">Ombres <input type="range" min="0" max="100" value="60" data-fu="ombre"></label>
      <label class="fu-curseur">Grain de l’appareil <input type="range" min="0" max="100" value="50" data-fu="grain"></label>
      <label class="fu-curseur">Netteté accordée (profondeur) <input type="range" min="0" max="100" value="40" data-fu="flou"></label>
      <div class="fu-ligne">
        <label class="fu-case"><input type="checkbox" data-fu="miroir"> Miroir</label>
        <label class="fu-case"><input type="checkbox" data-fu="horizon" checked> Montrer l’horizon</label>
      </div>
    </div>
    <div class="fu-ligne">
      <button class="fu-btn fu-prim" type="button" data-fu="exporter" disabled>⤓ Enregistrer le montage (PNG)</button>
    </div>
    <p class="fu-aide">Utilisez des photos de personnes qui sont d’accord pour figurer dans le montage.</p>
  </div>
  <div class="fu-scene">
    <canvas data-fu="cvScene" width="1280" height="720"></canvas>
    <div class="fu-vide fu-vide-scene" data-fu="videScene">Ajoutez la photo du lieu : le sujet s’y posera à la bonne taille.</div>
    <p class="fu-aide">Glissez le sujet pour le placer. Molette ou pincement : agrandir / réduire. Glissez la ligne orange : l’horizon (hauteur des yeux du photographe).</p>
  </div>
</div>`;
  }

  // ------------------------------------------------------------------ outils d'image
  const lireFichier = (f) => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ko(new Error('Lecture impossible.')); r.readAsDataURL(f); });
  const chargerImage = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('Image illisible (formats : JPG, PNG, WEBP, AVIF, GIF, BMP).')); i.src = src; });
  const toile = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  function reduire(img, max) {
    const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const c = toile((img.naturalWidth || img.width) * k, (img.naturalHeight || img.height) * k);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const donnees = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height);
  function versToile(img) { const c = toile(img.width, img.height); c.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0); return c; }

  // ------------------------------------------------------------------ montage
  function monter(racine, hote = {}) {
    const $ = (k) => racine.querySelector(`[data-fu="${k}"]`);
    const toast = hote.toast || ((m) => console.log(m));
    const E = {
      source: null, // ImageData du sujet (réduit)
      masque: null, fonds: null, // détourage (alpha)
      sujet: null, sujetStats: null, // sujet détouré recadré (ImageData) et ses statistiques
      sujetFinal: null, // toile : sujet harmonisé
      scene: null, sceneStats: null, // toile du lieu
      x: 0, piedY: 0, horizonY: 0, h: 100, cadre: null,
      outil: null,
    };
    const cvS = $('cvScene'), ctx = cvS.getContext('2d');
    const cvJ = $('cvSujet'), ctxJ = cvJ.getContext('2d');

    // choix du détourage
    (async () => {
      const opts = [{ id: 'local', name: 'Ivass (sur l’appareil) — fond uni ou simple' }];
      let liste = [];
      try { liste = hote.listeIA ? await hote.listeIA() : []; } catch (_) { liste = []; }
      const dispo = liste.filter((x) => x.available);
      if (dispo.length) opts.unshift({ id: 'auto', name: `IA : ${dispo.map((x) => x.name).join(', ')} (le meilleur disponible)` });
      for (const x of liste) opts.push({ id: x.id, name: `${x.name}${x.available ? '' : ' — clé à ajouter (⚙ Paramètres › Ajout rapide)'}`, off: !x.available });
      $('via').innerHTML = opts.map((o) => `<option value="${esc(o.id)}"${o.off ? ' disabled' : ''}>${esc(o.name)}</option>`).join('');
      if (hote.derniereImage) $('depuisGalerie').classList.remove('hidden');
    })();

    // ---------------------------------------------------------------- sujet
    async function nouveauSujet(src) {
      const im = await chargerImage(src);
      E.source = donnees(reduire(im, MAX_SUJET)); E.masque = null; E.sujet = null; E.sujetFinal = null;
      $('detourer').disabled = false; $('videSujet').classList.add('hidden');
      afficherSujet(E.source);
      await detourer();
    }
    function afficherSujet(img) {
      cvJ.width = img.width; cvJ.height = img.height;
      ctxJ.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
    }
    async function detourer() {
      if (!E.source) return;
      const via = $('via').value || 'local';
      const btn = $('detourer'); btn.disabled = true; const t0 = btn.textContent; btn.textContent = '⏳ Détourage…';
      try {
        if (via !== 'local' && hote.detourerIA) try {
          const c = toile(E.source.width, E.source.height); c.getContext('2d').putImageData(E.source, 0, 0);
          const b64 = c.toDataURL('image/png').split(',')[1];
          const r = await hote.detourerIA(b64, 'image/png', via);
          if (r && r.b64) {
            const im = await chargerImage(`data:${r.mime || 'image/png'};base64,${r.b64}`);
            const d = donnees(reduire(im, MAX_SUJET));
            // le résultat de l'IA peut être d'une autre taille : le masque est repris à la taille du sujet
            const cm = toile(E.source.width, E.source.height); cm.getContext('2d').drawImage(versToile(d), 0, 0, cm.width, cm.height);
            const dm = donnees(cm);
            E.masque = new Uint8ClampedArray(E.source.width * E.source.height);
            for (let p = 0; p < E.masque.length; p++) E.masque[p] = dm.data[p * 4 + 3];
            E.fonds = null;
            toast(`Détouré par ${r.via || 'l’IA'}.`);
          } else {
            toast('Aucune clé de détourage IA : détourage local.');
          }
        } catch (e) { E.masque = null; toast('Détourage IA indisponible (' + (e && e.message ? e.message : e) + ') : détourage local.'); }
        if (!E.masque) {
          const r = F().detourer(E.source, { tolerance: +$('tolerance').value });
          E.masque = r.alpha; E.fonds = r.fonds;
          if (r.partSujet > 0.97) toast('Le fond n’a pas été reconnu (photo chargée) : utilisez la gomme, ou un détourage IA.');
          else if (r.partSujet < 0.02) toast('Presque tout a été retiré : baissez la tolérance.');
        }
        appliquerMasque();
      } catch (e) {
        toast('Détourage : ' + (e && e.message ? e.message : e));
      } finally { btn.disabled = false; btn.textContent = t0; }
    }
    function appliquerMasque() {
      const det = F().appliquerMasque(E.source, E.masque, E.fonds);
      afficherSujet(det);
      const cd = F().cadre(det);
      if (!cd) { E.sujet = null; toast('Le sujet est vide : baissez la tolérance ou restaurez avec le pinceau.'); dessiner(); return; }
      const c = versToile(det), r = toile(cd.w, cd.h);
      r.getContext('2d').drawImage(c, cd.x, cd.y, cd.w, cd.h, 0, 0, cd.w, cd.h);
      E.sujet = donnees(r); E.sujetStats = F().analyser(E.sujet);
      preparerSujet(true);
    }
    let tPrep = null;
    function preparerSujet(replacer) {
      if (!E.sujet) return;
      let img = F().harmoniser(E.sujet, E.sujetStats, E.sceneStats, (+$('harmonie').value) / 100);
      if (E.sceneStats && E.sujetStats) {
        const ecart = Math.max(0, E.sceneStats.grain - E.sujetStats.grain);
        img = F().ajouterGrain(img, ecart * ((+$('grain').value) / 50), 11);
      }
      E.sujetFinal = versToile(img);
      if (replacer || !E.h) placer(); else dessiner();
    }
    const preparerPlusTard = () => { clearTimeout(tPrep); tPrep = setTimeout(() => preparerSujet(false), 60); };

    // ---------------------------------------------------------------- lieu
    async function nouveauLieu(src) {
      const im = await chargerImage(src);
      E.scene = reduire(im, MAX_SCENE);
      E.sceneStats = F().analyser(donnees(reduire(E.scene, 600)));
      cvS.width = E.scene.width; cvS.height = E.scene.height;
      $('videScene').classList.add('hidden');
      const L = E.sceneStats ? E.sceneStats.lumiere : null;
      $('infoScene').textContent = E.sceneStats ? `Lumière : ${L.cote === 'face' ? 'de face ou diffuse' : 'venant de la ' + L.cote} · contraste ${Math.round(E.sceneStats.contraste)} · ${E.scene.width}×${E.scene.height}` : '';
      E.horizonY = cvS.height * 0.45;
      preparerSujet(true);
      dessiner();
    }

    // ---------------------------------------------------------------- placement
    function hauteurAuto() { return F().hauteurPerspective({ piedY: E.piedY, horizonY: E.horizonY, hauteurReelle: +$('hReelle').value || 1.75, hauteurCamera: +$('hCamera').value || 1.6 }); }
    function placer() {
      if (!E.scene || !E.sujetFinal) return dessiner();
      const p = F().placementInitial(cvS.width, cvS.height, E.sujetFinal.width, E.sujetFinal.height, { horizonY: E.horizonY, hauteurReelle: +$('hReelle').value, hauteurCamera: +$('hCamera').value });
      E.x = p.x; E.piedY = p.piedY; E.h = $('auto').checked ? p.h : Math.min(cvS.height * 0.6, p.h);
      dessiner();
    }
    function flouAuto() {
      if (!E.sceneStats || !E.sujetStats) return 0;
      const net = Math.max(0, E.sujetStats.grain - E.sceneStats.grain) / 6; // sujet plus net que le lieu → léger flou
      return Math.min(2.5, net * ((+$('flou').value) / 50) * (cvS.width / 1600));
    }
    function dessiner() {
      $('exporter').disabled = !(E.scene && E.sujetFinal);
      if (!E.scene) { ctx.clearRect(0, 0, cvS.width, cvS.height); return; }
      if (E.sujetFinal && $('auto').checked) E.h = hauteurAuto();
      E.cadre = F().composer(ctx, { scene: E.scene, sujet: E.sujetFinal, x: E.x, piedY: E.piedY, h: E.h, miroir: $('miroir').checked, ombre: (+$('ombre').value) / 100, sceneStats: E.sceneStats, flou: flouAuto(), horizonY: E.horizonY, montrerHorizon: $('horizon').checked && !E.exportEnCours });
    }

    // glisser / molette / pincement sur la scène
    const versScene = (ev) => { const r = cvS.getBoundingClientRect(); return { x: ((ev.clientX - r.left) * cvS.width) / r.width, y: ((ev.clientY - r.top) * cvS.height) / r.height, k: cvS.width / r.width }; };
    const pointeurs = new Map(); let prise = null, pince = null;
    cvS.addEventListener('pointerdown', (ev) => {
      if (!E.scene) return;
      const p = versScene(ev); pointeurs.set(ev.pointerId, p); cvS.setPointerCapture(ev.pointerId);
      if (pointeurs.size === 2) { const [a, b] = [...pointeurs.values()]; pince = { d: Math.hypot(a.x - b.x, a.y - b.y), h: E.h, hr: +$('hReelle').value }; prise = null; return; }
      if ($('horizon').checked && Math.abs(p.y - E.horizonY) < 10 * p.k) prise = { type: 'horizon' };
      else if (E.cadre && p.x >= E.cadre.x0 && p.x <= E.cadre.x0 + E.cadre.w && p.y >= E.cadre.y0 && p.y <= E.cadre.y0 + E.cadre.h) prise = { type: 'sujet', dx: E.x - p.x, dy: E.piedY - p.y };
      else if (E.sujetFinal) { prise = { type: 'sujet', dx: 0, dy: 0 }; E.x = p.x; E.piedY = Math.max(E.horizonY + 4, p.y); dessiner(); }
    });
    cvS.addEventListener('pointermove', (ev) => {
      if (!pointeurs.has(ev.pointerId)) return;
      const p = versScene(ev); pointeurs.set(ev.pointerId, p);
      if (pince && pointeurs.size === 2) {
        const [a, b] = [...pointeurs.values()]; const f = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pince.d);
        if ($('auto').checked) $('hReelle').value = (pince.hr * f).toFixed(2); else E.h = pince.h * f;
        dessiner(); return;
      }
      if (!prise) return;
      if (prise.type === 'horizon') E.horizonY = Math.max(0, Math.min(cvS.height - 10, p.y));
      else { E.x = p.x + prise.dx; E.piedY = Math.max(E.horizonY + 4, p.y + prise.dy); }
      dessiner();
    });
    const lacher = (ev) => { pointeurs.delete(ev.pointerId); if (pointeurs.size < 2) pince = null; if (!pointeurs.size) prise = null; };
    cvS.addEventListener('pointerup', lacher); cvS.addEventListener('pointercancel', lacher);
    cvS.addEventListener('wheel', (ev) => {
      if (!E.sujetFinal) return; ev.preventDefault();
      const f = ev.deltaY < 0 ? 1.05 : 1 / 1.05;
      if ($('auto').checked) $('hReelle').value = Math.max(0.05, (+$('hReelle').value || 1.75) * f).toFixed(2); else E.h *= f;
      dessiner();
    }, { passive: false });

    // gomme / restaurer sur l'aperçu du sujet
    const basculerOutil = (o) => {
      E.outil = E.outil === o ? null : o;
      $('gomme').setAttribute('aria-pressed', String(E.outil === 'gomme')); $('restaurer').setAttribute('aria-pressed', String(E.outil === 'restaurer'));
      cvJ.style.cursor = E.outil ? 'crosshair' : '';
    };
    let peint = false, tPeint = null;
    const peindre = (ev) => {
      if (!E.outil || !E.masque) return;
      const r = cvJ.getBoundingClientRect(); const x = ((ev.clientX - r.left) * cvJ.width) / r.width, y = ((ev.clientY - r.top) * cvJ.height) / r.height;
      const rad = ((+$('pinceau').value) * cvJ.width) / Math.max(1, r.width) / 2, W = cvJ.width, H = cvJ.height, v = E.outil === 'gomme' ? 0 : 255;
      for (let yy = Math.max(0, Math.floor(y - rad)); yy < Math.min(H, y + rad); yy++) for (let xx = Math.max(0, Math.floor(x - rad)); xx < Math.min(W, x + rad); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= rad * rad) E.masque[yy * W + xx] = v;
      afficherSujet(F().appliquerMasque(E.source, E.masque, E.fonds));
      clearTimeout(tPeint); tPeint = setTimeout(appliquerMasque, 250);
    };
    cvJ.addEventListener('pointerdown', (ev) => { if (!E.outil) return; peint = true; cvJ.setPointerCapture(ev.pointerId); peindre(ev); });
    cvJ.addEventListener('pointermove', (ev) => { if (peint) peindre(ev); });
    cvJ.addEventListener('pointerup', () => { peint = false; });

    // ---------------------------------------------------------------- événements
    const surFichier = (k, fn) => { $(k).onchange = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; try { await fn(await lireFichier(f)); } catch (e) { toast(e.message || String(e)); } }; };
    surFichier('fSujet', nouveauSujet); surFichier('fSujetCam', nouveauSujet);
    surFichier('fScene', nouveauLieu); surFichier('fSceneCam', nouveauLieu);
    $('depuisGalerie').onclick = async () => { const d = hote.derniereImage && hote.derniereImage(); if (!d) return toast('La galerie est vide.'); try { await nouveauSujet(`data:${d.mime || 'image/png'};base64,${d.b64}`); } catch (e) { toast(e.message); } };
    $('detourer').onclick = () => { E.masque = null; detourer(); };
    $('tolerance').onchange = () => { if (E.source && ($('via').value || 'local') === 'local') { E.masque = null; detourer(); } };
    $('gomme').onclick = () => basculerOutil('gomme');
    $('restaurer').onclick = () => basculerOutil('restaurer');
    ['harmonie', 'grain'].forEach((k) => { $(k).oninput = preparerPlusTard; });
    ['ombre', 'flou', 'miroir', 'horizon', 'auto', 'hReelle', 'hCamera'].forEach((k) => { $(k).oninput = dessiner; $(k).onchange = dessiner; });
    $('exporter').onclick = async () => {
      E.exportEnCours = true; dessiner();
      const b64 = cvS.toDataURL('image/png').split(',')[1];
      E.exportEnCours = false; dessiner();
      try { await hote.enregistrer(b64, 'fusion-ivass-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png'); } catch (e) { toast('Enregistrement : ' + (e.message || e)); }
    };
    dessiner();
    return { etat: E, nouveauSujet, nouveauLieu, dessiner };
  }

  window.FusionUI = { html, monter };
})();
