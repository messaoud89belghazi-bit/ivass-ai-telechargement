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
const saisir = (t, v = '') => (typeof askText === 'function' ? askText(t, v) : Promise.resolve(window.prompt(t, v))); // prompt() n'existe pas dans Electron

  const F = () => window.FusionCore;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX_SUJET = 1400; // côté le plus long pour le détourage local (rapidité sur téléphone)
  const MAX_SCENE = 4096;

  function html() {
    return `<div class="fu">
  <div class="fu-cote">
    <div class="fu-carte"><div class="fu-t">1 · Le sujet <span class="fu-aide">personne, animal, objet, logo, produit — un calque par sujet</span></div>
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
    <div class="fu-carte"><div class="fu-t">3 · Calques <span class="fu-aide">le plus haut de la liste est devant</span></div>
      <div class="fu-calques" data-fu="calques"></div>
      <div class="fu-ligne">
        <label class="fu-btn" title="Ajouter un autre sujet (nouveau calque)">＋ Calque<input type="file" accept="image/*" data-fu="fCalque" hidden></label>
        <button class="fu-btn" type="button" data-fu="dupliquer" title="Dupliquer le calque (Ctrl+D)">⧉</button>
        <button class="fu-btn" type="button" data-fu="avant" title="Mettre devant">⬆</button>
        <button class="fu-btn" type="button" data-fu="arriere" title="Mettre derrière">⬇</button>
        <button class="fu-btn" type="button" data-fu="supprimerCalque" title="Supprimer le calque (Suppr)">🗑</button>
      </div>
    </div>
    <div class="fu-carte"><div class="fu-t">4 · Position et transformation <span class="fu-aide">flèches : 1 px · Maj + flèches : 10 px</span></div>
      <div class="fu-grille">
        <label>X <input type="number" step="1" data-fu="iX"></label>
        <label>Y (pieds) <input type="number" step="1" data-fu="iY"></label>
        <label>Hauteur <input type="number" step="1" min="4" data-fu="iH"></label>
        <label>Rotation ° <input type="number" step="1" min="-180" max="180" data-fu="iRot"></label>
      </div>
      <label class="fu-curseur" title="Perspective SIMULÉE : l’image reste plate, elle pivote autour de son axe vertical">Pivot gauche / droite (perspective simulée) <input type="range" min="-60" max="60" value="0" data-fu="iInclY"></label>
      <label class="fu-curseur" title="Perspective SIMULÉE : bascule vers l’avant ou l’arrière">Bascule avant / arrière (perspective simulée) <input type="range" min="-60" max="60" value="0" data-fu="iInclX"></label>
      <label class="fu-curseur">Opacité <input type="range" min="0" max="100" value="100" data-fu="iOpacite"></label>
      <div class="fu-ligne">
        <select data-fu="iMode" title="Mode de fusion du calque">
          <option value="source-over">Normal</option><option value="multiply">Produit</option><option value="screen">Superposition claire</option><option value="overlay">Incrustation</option>
          <option value="soft-light">Lumière douce</option><option value="hard-light">Lumière crue</option><option value="darken">Assombrir</option><option value="lighten">Éclaircir</option>
          <option value="color-dodge">Densité couleur −</option><option value="color-burn">Densité couleur +</option><option value="luminosity">Luminosité</option>
        </select>
        <label class="fu-case"><input type="checkbox" data-fu="miroir"> Miroir ↔</label>
        <label class="fu-case"><input type="checkbox" data-fu="miroirV"> Miroir ↕</label>
      </div>
      <div class="fu-ligne">
        <button class="fu-btn" type="button" data-fu="annuler" title="Annuler (Ctrl+Z)" disabled>↶ Annuler</button>
        <button class="fu-btn" type="button" data-fu="retablir" title="Rétablir (Ctrl+Y)" disabled>↷ Rétablir</button>
        <button class="fu-btn" type="button" data-fu="replacer" title="Replacer le calque au sol, au centre">⟲ Replacer</button>
      </div>
    </div>
    <div class="fu-carte"><div class="fu-t">5 · Taille, lumière, réalisme</div>
      <label class="fu-case"><input type="checkbox" data-fu="auto" checked> Taille automatique selon la perspective (sous l’horizon)</label>
      <div class="fu-ligne fu-nombres">
        <label>Taille réelle du sujet <input type="number" min="0.05" max="50" step="0.05" value="1.75" data-fu="hReelle"> m</label>
        <label>Hauteur de l’appareil photo <input type="number" min="0.2" max="20" step="0.05" value="1.6" data-fu="hCamera"> m</label>
      </div>
      <label class="fu-curseur">Couleurs accordées au lieu <input type="range" min="0" max="100" value="40" data-fu="harmonie"></label>
      <label class="fu-curseur">Ombres <input type="range" min="0" max="100" value="60" data-fu="ombre"></label>
      <label class="fu-curseur">Grain de l’appareil <input type="range" min="0" max="100" value="50" data-fu="grain"></label>
      <label class="fu-curseur">Netteté accordée (profondeur) <input type="range" min="0" max="100" value="40" data-fu="flou"></label>
      <div class="fu-ligne"><label class="fu-case"><input type="checkbox" data-fu="horizon" checked> Montrer l’horizon</label></div>
    </div>
    <div class="fu-carte"><div class="fu-t">6 · Enregistrer et envoyer</div>
      <div class="fu-ligne">
        <button class="fu-btn fu-prim" type="button" data-fu="exporter" disabled>⤓ Image PNG</button>
        <label class="fu-case" title="Sans la photo du lieu : seulement les sujets, sur fond transparent"><input type="checkbox" data-fu="transparent"> Fond transparent</label>
      </div>
      <div class="fu-ligne">
        <button class="fu-btn" type="button" data-fu="sauverProjet" title="Composition modifiable (calques, réglages, images)">💾 Projet</button>
        <label class="fu-btn" title="Rouvrir une composition .ivfusion">📂 Ouvrir un projet<input type="file" accept=".ivfusion,application/json" data-fu="fProjet" hidden></label>
        <button class="fu-btn hidden" type="button" data-fu="versRetouche">✨ Vers Retouche</button>
        <button class="fu-btn hidden" type="button" data-fu="versMontage">🎬 Vers Montage</button>
      </div>
    </div>
    <p class="fu-aide">Utilisez des photos de personnes qui sont d’accord pour figurer dans le montage.</p>
  </div>
  <div class="fu-scene">
    <div class="fu-scene-colle">
      <canvas data-fu="cvScene" width="1280" height="720" tabindex="0" aria-label="Composition : glissez un calque pour le placer"></canvas>
      <div class="fu-vide fu-vide-scene" data-fu="videScene">Ajoutez la photo du lieu : le sujet s’y posera à la bonne taille.</div>
      <p class="fu-aide">Glissez un calque dans toutes les directions. Molette : agrandir / réduire · Alt + molette : tourner · ligne orange : l’horizon (hauteur des yeux du photographe). L’aperçu reste visible pendant que vous réglez à gauche.</p>
    </div>
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

  // ------------------------------------------------------------------ montage (3.39 : calques)
  function monter(racine, hote = {}) {
    const $ = (k) => racine.querySelector(`[data-fu="${k}"]`);
    const toast = hote.toast || ((m) => console.log(m));
    let nId = 0;
    const nouveauCalque = (nom) => ({
      id: 'c' + (++nId), nom: nom || 'Sujet ' + nId, source: null, masque: null, fonds: null, sujet: null, sujetStats: null, sujetFinal: null,
      x: 0, piedY: 0, h: 100, rotation: 0, inclX: 0, inclY: 0, miroir: false, miroirV: false, opacite: 1, mode: 'source-over',
      visible: true, verrou: false, auto: true, hReelle: 1.75, place: false,
    });
    const E = { calques: [], actif: -1, scene: null, sceneStats: null, horizonY: 0, cadres: [], outil: null, exportEnCours: false };
    const cvS = $('cvScene'), ctx = cvS.getContext('2d');
    const cvJ = $('cvSujet'), ctxJ = cvJ.getContext('2d');
    const actif = () => E.calques[E.actif] || null;
    if (hote.envoyerVers) { $('versRetouche').classList.remove('hidden'); $('versMontage').classList.remove('hidden'); }

    // ---------------------------------------------------------------- annuler / rétablir (réglages des calques, sans les pixels)
    const CHAMPS = ['x', 'piedY', 'h', 'rotation', 'inclX', 'inclY', 'miroir', 'miroirV', 'opacite', 'mode', 'visible', 'verrou', 'auto', 'hReelle'];
    const photo = () => JSON.stringify({ ordre: E.calques.map((c) => c.id), actif: E.actif, horizonY: E.horizonY, c: E.calques.map((c) => Object.fromEntries(CHAMPS.map((k) => [k, c[k]]))) });
    const histo = { pile: [], pos: -1, retirees: new Map() };
    function memoriser() {
      const p = photo();
      if (histo.pile[histo.pos] === p) return;
      histo.pile = histo.pile.slice(0, histo.pos + 1); histo.pile.push(p);
      if (histo.pile.length > 150) histo.pile.shift();
      histo.pos = histo.pile.length - 1; boutonsHisto();
    }
    function restaurer(p) {
      const o = JSON.parse(p);
      const tous = new Map([...E.calques, ...histo.retirees.values()].map((c) => [c.id, c]));
      E.calques = o.ordre.map((id) => tous.get(id)).filter(Boolean);
      for (const c of E.calques) histo.retirees.delete(c.id);
      for (const [id, c] of tous) if (!o.ordre.includes(id)) histo.retirees.set(id, c);
      E.calques.forEach((c, i) => Object.assign(c, o.c[i]));
      E.actif = Math.min(o.actif, E.calques.length - 1); E.horizonY = o.horizonY;
      majListe(); majInspecteur(); dessiner(); boutonsHisto();
    }
    const annuler = () => { if (histo.pos > 0) { histo.pos--; restaurer(histo.pile[histo.pos]); } };
    const retablir = () => { if (histo.pos < histo.pile.length - 1) { histo.pos++; restaurer(histo.pile[histo.pos]); } };
    function boutonsHisto() { $('annuler').disabled = histo.pos <= 0; $('retablir').disabled = histo.pos >= histo.pile.length - 1; }
    let tMem = null; const memoriserPlusTard = () => { clearTimeout(tMem); tMem = setTimeout(memoriser, 350); };

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

    // ---------------------------------------------------------------- sujet (calque actif)
    async function nouveauSujet(src, nom, nouveau) {
      const im = await chargerImage(src);
      let c = actif();
      if (!c || nouveau) { c = nouveauCalque(nom); E.calques.push(c); E.actif = E.calques.length - 1; }
      else if (nom) c.nom = nom;
      c.source = donnees(reduire(im, MAX_SUJET)); c.masque = null; c.sujet = null; c.sujetFinal = null; c.place = false;
      $('detourer').disabled = false; $('videSujet').classList.add('hidden');
      afficherSujet(c.source); majListe();
      await detourer();
    }
    function afficherSujet(img) {
      if (!img) { ctxJ.clearRect(0, 0, cvJ.width, cvJ.height); $('videSujet').classList.remove('hidden'); return; }
      $('videSujet').classList.add('hidden');
      cvJ.width = img.width; cvJ.height = img.height;
      ctxJ.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
    }
    async function detourer() {
      const c = actif(); if (!c || !c.source) return;
      const via = $('via').value || 'local';
      const btn = $('detourer'); btn.disabled = true; const t0 = btn.textContent; btn.textContent = '⏳ Détourage…';
      try {
        if (via !== 'local' && hote.detourerIA) try {
          const tc = toile(c.source.width, c.source.height); tc.getContext('2d').putImageData(c.source, 0, 0);
          const b64 = tc.toDataURL('image/png').split(',')[1];
          const r = await hote.detourerIA(b64, 'image/png', via);
          if (r && r.b64) {
            const im = await chargerImage(`data:${r.mime || 'image/png'};base64,${r.b64}`);
            const d = donnees(reduire(im, MAX_SUJET));
            const cm = toile(c.source.width, c.source.height); cm.getContext('2d').drawImage(versToile(d), 0, 0, cm.width, cm.height);
            const dm = donnees(cm);
            c.masque = new Uint8ClampedArray(c.source.width * c.source.height);
            for (let p = 0; p < c.masque.length; p++) c.masque[p] = dm.data[p * 4 + 3];
            c.fonds = null;
            toast(`Détouré par ${r.via || 'l’IA'}.`);
          } else toast('Aucune clé de détourage IA : détourage local.');
        } catch (e) { c.masque = null; toast('Détourage IA indisponible (' + (e && e.message ? e.message : e) + ') : détourage local.'); }
        if (!c.masque) {
          const r = F().detourer(c.source, { tolerance: +$('tolerance').value });
          c.masque = r.alpha; c.fonds = r.fonds;
          if (r.partSujet > 0.97) toast('Le fond n’a pas été reconnu (photo chargée) : utilisez la gomme, ou un détourage IA.');
          else if (r.partSujet < 0.02) toast('Presque tout a été retiré : baissez la tolérance.');
        }
        appliquerMasque();
      } catch (e) {
        toast('Détourage : ' + (e && e.message ? e.message : e));
      } finally { btn.disabled = false; btn.textContent = t0; }
    }
    function appliquerMasque() {
      const c = actif(); if (!c) return;
      const det = F().appliquerMasque(c.source, c.masque, c.fonds);
      afficherSujet(det);
      const cd = F().cadre(det);
      if (!cd) { c.sujet = null; toast('Le sujet est vide : baissez la tolérance ou restaurez avec le pinceau.'); dessiner(); return; }
      const tc = versToile(det), r = toile(cd.w, cd.h);
      r.getContext('2d').drawImage(tc, cd.x, cd.y, cd.w, cd.h, 0, 0, cd.w, cd.h);
      c.sujet = donnees(r); c.sujetStats = F().analyser(c.sujet);
      preparerSujet(c);
    }
    function preparerSujet(c) {
      if (!c || !c.sujet) return;
      let img = F().harmoniser(c.sujet, c.sujetStats, E.sceneStats, (+$('harmonie').value) / 100);
      if (E.sceneStats && c.sujetStats) {
        const ecart = Math.max(0, E.sceneStats.grain - c.sujetStats.grain);
        img = F().ajouterGrain(img, ecart * ((+$('grain').value) / 50), 11);
      }
      c.sujetFinal = versToile(img);
      if (!c.place) placer(c); else dessiner();
      majListe();
    }
    let tPrep = null;
    const preparerTousPlusTard = () => { clearTimeout(tPrep); tPrep = setTimeout(() => E.calques.forEach((c) => preparerSujet(c)), 60); };

    // ---------------------------------------------------------------- lieu
    async function nouveauLieu(src) {
      const im = await chargerImage(src);
      E.scene = reduire(im, MAX_SCENE);
      E.sceneStats = F().analyser(donnees(reduire(E.scene, 600)));
      const ancienW = cvS.width, ancienH = cvS.height, avaitScene = E.lieuCharge;
      cvS.width = E.scene.width; cvS.height = E.scene.height;
      $('videScene').classList.add('hidden');
      const L = E.sceneStats ? E.sceneStats.lumiere : null;
      $('infoScene').textContent = E.sceneStats ? `Lumière : ${L.cote === 'face' ? 'de face ou diffuse' : 'venant de la ' + L.cote} · contraste ${Math.round(E.sceneStats.contraste)} · ${E.scene.width}×${E.scene.height}` : '';
      E.horizonY = cvS.height * 0.45;
      // changement de lieu : les calques déjà placés gardent leur place relative
      if (avaitScene) for (const c of E.calques) { c.x *= cvS.width / ancienW; c.piedY *= cvS.height / ancienH; c.h *= cvS.height / ancienH; }
      E.lieuCharge = true;
      E.calques.forEach((c) => preparerSujet(c));
      dessiner(); memoriser();
    }

    // ---------------------------------------------------------------- placement
    const hCamera = () => +$('hCamera').value || 1.6;
    function placer(c) {
      if (!E.scene || !c || !c.sujetFinal) return dessiner();
      const p = F().placementInitial(cvS.width, cvS.height, c.sujetFinal.width, c.sujetFinal.height, { horizonY: E.horizonY, hauteurReelle: c.hReelle, hauteurCamera: hCamera() });
      const decal = E.calques.filter((x) => x !== c && x.place).length;
      c.x = Math.min(cvS.width * 0.85, p.x + decal * cvS.width * 0.12); c.piedY = p.piedY; c.h = c.auto ? p.h : Math.min(cvS.height * 0.6, p.h);
      c.place = true;
      dessiner(); majInspecteur(); memoriser();
    }
    function flouAuto(c) {
      if (!E.sceneStats || !c.sujetStats) return 0;
      const net = Math.max(0, c.sujetStats.grain - E.sceneStats.grain) / 6;
      return Math.min(2.5, net * ((+$('flou').value) / 50) * (cvS.width / 1600));
    }
    function dessiner() {
      const pret = E.calques.some((c) => c.sujetFinal);
      $('exporter').disabled = !(pret && (E.scene || $('transparent').checked));
      if (!E.scene && !$('transparent').checked) { ctx.clearRect(0, 0, cvS.width, cvS.height); return; }
      for (const c of E.calques) { c.h = F().hauteurCalque(c, E.horizonY, hCamera()); c.ombre = (+$('ombre').value) / 100; c.flou = flouAuto(c); }
      E.cadres = F().composerCalques(ctx, {
        scene: E.scene, calques: E.calques, sceneStats: E.sceneStats, horizonY: E.horizonY,
        montrerHorizon: $('horizon').checked && !E.exportEnCours, transparent: $('transparent').checked && E.exportEnCours,
        selection: E.exportEnCours ? null : E.actif,
      });
    }

    // ---------------------------------------------------------------- liste des calques & inspecteur
    function majListe() {
      const l = $('calques');
      if (!E.calques.length) { l.innerHTML = '<div class="fu-aide">Aucun calque : ajoutez la photo d’un sujet.</div>'; return; }
      // affichage : le calque de devant en haut
      l.innerHTML = E.calques.map((c, i) => ({ c, i })).reverse().map(({ c, i }) => `<div class="fu-calque${i === E.actif ? ' actif' : ''}" data-i="${i}">
        <button type="button" class="fu-mini" data-act="voir" title="${c.visible ? 'Masquer' : 'Afficher'}">${c.visible ? '👁' : '◌'}</button>
        <button type="button" class="fu-mini" data-act="verrou" title="${c.verrou ? 'Déverrouiller' : 'Verrouiller (plus de déplacement)'}">${c.verrou ? '🔒' : '🔓'}</button>
        <span class="fu-calque-nom" title="${esc(c.nom)}">${esc(c.nom)}${c.sujetFinal ? '' : ' <i>(détourage…)</i>'}</span></div>`).join('');
    }
    function majInspecteur() {
      const c = actif(), dis = !c;
      ['iX', 'iY', 'iH', 'iRot', 'iInclX', 'iInclY', 'iOpacite', 'iMode', 'miroir', 'miroirV', 'replacer', 'dupliquer', 'avant', 'arriere', 'supprimerCalque'].forEach((k) => ($(k).disabled = dis));
      if (!c) return;
      $('iX').value = Math.round(c.x); $('iY').value = Math.round(c.piedY); $('iH').value = Math.round(c.h); $('iRot').value = Math.round(c.rotation);
      $('iInclX').value = c.inclX; $('iInclY').value = c.inclY; $('iOpacite').value = Math.round(c.opacite * 100); $('iMode').value = c.mode;
      $('miroir').checked = c.miroir; $('miroirV').checked = c.miroirV; $('auto').checked = c.auto; $('hReelle').value = c.hReelle;
      $('iH').disabled = c.auto && c.piedY > E.horizonY + 4; $('iH').title = $('iH').disabled ? 'Taille calculée par la perspective : décochez « Taille automatique » pour la fixer' : '';
      if (c.source) { if (c.masque) afficherSujet(F().appliquerMasque(c.source, c.masque, c.fonds)); else afficherSujet(c.source); } else afficherSujet(null);
      $('detourer').disabled = !c.source;
    }
    function choisir(i) { E.actif = i; majListe(); majInspecteur(); dessiner(); }
    $('calques').onclick = (ev) => {
      const ligne = ev.target.closest('[data-i]'); if (!ligne) return;
      const i = +ligne.dataset.i, c = E.calques[i], act = ev.target.closest('[data-act]');
      if (act && act.dataset.act === 'voir') { c.visible = !c.visible; memoriser(); }
      if (act && act.dataset.act === 'verrou') { c.verrou = !c.verrou; memoriser(); }
      choisir(i);
    };
    $('calques').ondblclick = async (ev) => {
      const ligne = ev.target.closest('[data-i]'); if (!ligne) return;
      const c = E.calques[+ligne.dataset.i]; const n = await saisir('Nom du calque', c.nom); if (n && n.trim()) { c.nom = n.trim().slice(0, 40); majListe(); }
    };
    const lireNombre = (k, def) => { const v = parseFloat($(k).value); return Number.isFinite(v) ? v : def; };
    function depuisInspecteur() {
      const c = actif(); if (!c) return;
      c.x = lireNombre('iX', c.x); c.piedY = lireNombre('iY', c.piedY);
      if (!$('iH').disabled) c.h = Math.max(4, lireNombre('iH', c.h));
      c.rotation = Math.max(-180, Math.min(180, lireNombre('iRot', 0)));
      c.inclX = +$('iInclX').value; c.inclY = +$('iInclY').value; c.opacite = (+$('iOpacite').value) / 100; c.mode = $('iMode').value;
      c.miroir = $('miroir').checked; c.miroirV = $('miroirV').checked;
      c.auto = $('auto').checked; c.hReelle = Math.max(0.05, lireNombre('hReelle', 1.75));
      dessiner(); memoriserPlusTard();
    }
    ['iX', 'iY', 'iH', 'iRot', 'iInclX', 'iInclY', 'iOpacite', 'iMode', 'miroir', 'miroirV', 'auto', 'hReelle'].forEach((k) => { $(k).oninput = depuisInspecteur; $(k).onchange = depuisInspecteur; });
    function deplacerOrdre(d) {
      const i = E.actif, j = i + d; if (i < 0 || j < 0 || j >= E.calques.length) return;
      [E.calques[i], E.calques[j]] = [E.calques[j], E.calques[i]]; E.actif = j; majListe(); dessiner(); memoriser();
    }
    $('avant').onclick = () => deplacerOrdre(1);
    $('arriere').onclick = () => deplacerOrdre(-1);
    function dupliquer() {
      const c = actif(); if (!c) return;
      const d = { ...nouveauCalque(c.nom + ' (copie)'), ...Object.fromEntries(CHAMPS.map((k) => [k, c[k]])), source: c.source, masque: c.masque && new Uint8ClampedArray(c.masque), fonds: c.fonds, sujet: c.sujet, sujetStats: c.sujetStats, sujetFinal: c.sujetFinal, place: true, verrou: false };
      d.x = Math.min(cvS.width, c.x + cvS.width * 0.06);
      E.calques.splice(E.actif + 1, 0, d); E.actif++; majListe(); majInspecteur(); dessiner(); memoriser();
    }
    $('dupliquer').onclick = dupliquer;
    function supprimerCalque() {
      const c = actif(); if (!c) return;
      histo.retirees.set(c.id, c); E.calques.splice(E.actif, 1); E.actif = Math.min(E.actif, E.calques.length - 1);
      majListe(); majInspecteur(); dessiner(); memoriser(); toast('Calque supprimé (Ctrl+Z pour le récupérer).');
    }
    $('supprimerCalque').onclick = supprimerCalque;
    $('replacer').onclick = () => { const c = actif(); if (c) { c.place = false; c.rotation = 0; c.inclX = 0; c.inclY = 0; placer(c); } };
    $('annuler').onclick = annuler; $('retablir').onclick = retablir;

    // ---------------------------------------------------------------- glisser / molette / pincement / clavier sur la scène
    const versScene = (ev) => F().versImage(ev.clientX, ev.clientY, cvS.getBoundingClientRect(), cvS.width, cvS.height);
    const pointeurs = new Map(); let prise = null, pince = null;
    function calqueSous(p) { for (let i = E.calques.length - 1; i >= 0; i--) { const c = E.calques[i]; if (c.visible !== false && F().toucheCalque(c, p.x, p.y)) return i; } return -1; }
    cvS.addEventListener('pointerdown', (ev) => {
      if (!E.scene) return;
      cvS.focus({ preventScroll: true });
      const p = versScene(ev); pointeurs.set(ev.pointerId, p); cvS.setPointerCapture(ev.pointerId);
      const c0 = actif();
      if (pointeurs.size === 2 && c0) { const [a, b] = [...pointeurs.values()]; pince = { d: Math.hypot(a.x - b.x, a.y - b.y), h: c0.h, hr: c0.hReelle }; prise = null; return; }
      if ($('horizon').checked && Math.abs(p.y - E.horizonY) < 10 * p.k) { prise = { type: 'horizon' }; return; }
      const i = calqueSous(p);
      if (i >= 0) { if (i !== E.actif) choisir(i); const c = actif(); if (!c.verrou) prise = { type: 'calque', dx: c.x - p.x, dy: c.piedY - p.y }; else toast('Calque verrouillé (🔒 dans la liste des calques).'); }
      else if (c0 && c0.sujetFinal && !c0.verrou) { prise = { type: 'calque', dx: 0, dy: 0 }; c0.x = p.x; c0.piedY = p.y; dessiner(); majInspecteur(); }
    });
    cvS.addEventListener('pointermove', (ev) => {
      if (!pointeurs.has(ev.pointerId)) return;
      const p = versScene(ev); pointeurs.set(ev.pointerId, p);
      const c = actif();
      if (pince && pointeurs.size === 2 && c) {
        const [a, b] = [...pointeurs.values()]; const f = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pince.d);
        if (c.auto && c.piedY > E.horizonY + 4) c.hReelle = +(pince.hr * f).toFixed(2); else c.h = pince.h * f;
        dessiner(); majInspecteur(); return;
      }
      if (!prise) return;
      if (prise.type === 'horizon') E.horizonY = Math.max(0, Math.min(cvS.height - 10, p.y));
      else if (c) { c.x = p.x + prise.dx; c.piedY = p.y + prise.dy; } // libre dans les deux sens (et en diagonale)
      dessiner(); majInspecteur();
    });
    const lacher = (ev) => { pointeurs.delete(ev.pointerId); if (pointeurs.size < 2) pince = null; if (!pointeurs.size) { if (prise) memoriser(); prise = null; } };
    cvS.addEventListener('pointerup', lacher); cvS.addEventListener('pointercancel', lacher);
    cvS.addEventListener('wheel', (ev) => {
      const c = actif(); if (!c || !c.sujetFinal || c.verrou) return; ev.preventDefault();
      if (ev.altKey) c.rotation = Math.max(-180, Math.min(180, c.rotation + (ev.deltaY < 0 ? 2 : -2)));
      else {
        const f = ev.deltaY < 0 ? 1.05 : 1 / 1.05;
        if (c.auto && c.piedY > E.horizonY + 4) c.hReelle = +Math.max(0.05, c.hReelle * f).toFixed(2); else c.h = Math.max(4, c.h * f);
      }
      dessiner(); majInspecteur(); memoriserPlusTard();
    }, { passive: false });
    cvS.addEventListener('keydown', (ev) => {
      const c = actif(); const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); return ev.shiftKey ? retablir() : annuler(); }
      if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); return retablir(); }
      if (!c) return;
      if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); return dupliquer(); }
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); return supprimerCalque(); }
      const pas = ev.shiftKey ? 10 : 1, d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] }[ev.key];
      if (d && !c.verrou) { ev.preventDefault(); c.x += d[0]; c.piedY += d[1]; dessiner(); majInspecteur(); memoriserPlusTard(); }
    });

    // gomme / restaurer sur l'aperçu du sujet (calque actif)
    const basculerOutil = (o) => {
      E.outil = E.outil === o ? null : o;
      $('gomme').setAttribute('aria-pressed', String(E.outil === 'gomme')); $('restaurer').setAttribute('aria-pressed', String(E.outil === 'restaurer'));
      cvJ.style.cursor = E.outil ? 'crosshair' : '';
    };
    let peint = false, tPeint = null;
    const peindre = (ev) => {
      const c = actif(); if (!E.outil || !c || !c.masque) return;
      const r = cvJ.getBoundingClientRect(); const pt = F().versImage(ev.clientX, ev.clientY, r, cvJ.width, cvJ.height);
      const rad = ((+$('pinceau').value) * pt.k) / 2, W = cvJ.width, H = cvJ.height, v = E.outil === 'gomme' ? 0 : 255;
      for (let yy = Math.max(0, Math.floor(pt.y - rad)); yy < Math.min(H, pt.y + rad); yy++) for (let xx = Math.max(0, Math.floor(pt.x - rad)); xx < Math.min(W, pt.x + rad); xx++) if ((xx - pt.x) ** 2 + (yy - pt.y) ** 2 <= rad * rad) c.masque[yy * W + xx] = v;
      afficherSujet(F().appliquerMasque(c.source, c.masque, c.fonds));
      clearTimeout(tPeint); tPeint = setTimeout(appliquerMasque, 250);
    };
    cvJ.addEventListener('pointerdown', (ev) => { if (!E.outil) return; peint = true; cvJ.setPointerCapture(ev.pointerId); peindre(ev); });
    cvJ.addEventListener('pointermove', (ev) => { if (peint) peindre(ev); });
    cvJ.addEventListener('pointerup', () => { peint = false; });

    // ---------------------------------------------------------------- projet (.ivfusion) : composition modifiable
    const enPNG = (img) => { if (!img) return null; const t = img instanceof ImageData ? versToile(img) : img; return t.toDataURL('image/png'); };
    function projet() {
      return {
        format: 'ivass-fusion', version: 1, cree: new Date().toISOString(), horizonY: E.horizonY,
        reglages: Object.fromEntries(['harmonie', 'ombre', 'grain', 'flou', 'hCamera', 'tolerance'].map((k) => [k, +$(k).value])),
        scene: E.scene ? E.scene.toDataURL('image/jpeg', 0.92) : null,
        calques: E.calques.map((c) => ({ nom: c.nom, ...Object.fromEntries(CHAMPS.map((k) => [k, c[k]])), source: enPNG(c.source), masque: c.masque ? enPNG(new ImageData(Uint8ClampedArray.from({ length: c.masque.length * 4 }, (_, j) => (j % 4 === 3 ? 255 : c.masque[j >> 2])), c.source.width, c.source.height)) : null })),
      };
    }
    async function ouvrirProjet(o) {
      if (!o || o.format !== 'ivass-fusion') throw new Error('Ce fichier n’est pas un projet Fusion d’Ivass.');
      for (const [k, v] of Object.entries(o.reglages || {})) if ($(k)) $(k).value = v;
      E.calques = []; E.actif = -1; histo.pile = []; histo.pos = -1; histo.retirees.clear();
      if (o.scene) { E.lieuCharge = false; await nouveauLieu(o.scene); }
      for (const k of o.calques || []) {
        if (!k.source) continue;
        const c = nouveauCalque(k.nom); E.calques.push(c); E.actif = E.calques.length - 1;
        c.source = donnees(reduire(await chargerImage(k.source), MAX_SUJET));
        if (k.masque) {
          const im = await chargerImage(k.masque); const t = toile(c.source.width, c.source.height); t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
          const d = donnees(t); c.masque = new Uint8ClampedArray(c.source.width * c.source.height); for (let p = 0; p < c.masque.length; p++) c.masque[p] = d.data[p * 4];
        } else { const r = F().detourer(c.source, { tolerance: +$('tolerance').value }); c.masque = r.alpha; c.fonds = r.fonds; }
        Object.assign(c, Object.fromEntries(CHAMPS.map((x) => [x, k[x]]).filter(([, v]) => v !== undefined)));
        c.place = true;
        appliquerMasque();
      }
      if (o.horizonY != null) E.horizonY = o.horizonY;
      majListe(); majInspecteur(); dessiner(); memoriser();
      toast(`Projet ouvert : ${E.calques.length} calque(s).`);
    }
    function telecharger(nom, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }

    // ---------------------------------------------------------------- événements
    const surFichier = (k, fn) => { $(k).onchange = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; try { await fn(await lireFichier(f), f.name.replace(/\.\w+$/, '')); } catch (e) { toast(e.message || String(e)); } }; };
    surFichier('fSujet', (src, nom) => nouveauSujet(src, nom, false)); surFichier('fSujetCam', (src) => nouveauSujet(src, null, false));
    surFichier('fCalque', (src, nom) => nouveauSujet(src, nom, true));
    surFichier('fScene', nouveauLieu); surFichier('fSceneCam', nouveauLieu);
    $('fProjet').onchange = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; try { await ouvrirProjet(JSON.parse(await f.text())); } catch (e) { toast('Projet : ' + (e.message || e)); } };
    $('sauverProjet').onclick = () => {
      if (!E.calques.length && !E.scene) return toast('Rien à enregistrer pour l’instant.');
      const nom = 'fusion-ivass-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.ivfusion';
      if (hote.enregistrerProjet) hote.enregistrerProjet(JSON.stringify(projet()), nom).catch((e) => toast('Projet : ' + (e.message || e)));
      else telecharger(nom, new Blob([JSON.stringify(projet())], { type: 'application/json' }));
    };
    $('depuisGalerie').onclick = async () => { const d = hote.derniereImage && hote.derniereImage(); if (!d) return toast('La galerie est vide.'); try { await nouveauSujet(`data:${d.mime || 'image/png'};base64,${d.b64}`, d.nom || null, !!actif()); } catch (e) { toast(e.message); } };
    $('detourer').onclick = () => { const c = actif(); if (c) { c.masque = null; detourer(); } };
    $('tolerance').onchange = () => { const c = actif(); if (c && c.source && ($('via').value || 'local') === 'local') { c.masque = null; detourer(); } };
    $('gomme').onclick = () => basculerOutil('gomme');
    $('restaurer').onclick = () => basculerOutil('restaurer');
    ['harmonie', 'grain'].forEach((k) => { $(k).oninput = preparerTousPlusTard; });
    ['ombre', 'flou', 'horizon', 'hCamera', 'transparent'].forEach((k) => { $(k).oninput = dessiner; $(k).onchange = dessiner; });
    function imageFinale() {
      E.exportEnCours = true; dessiner();
      const b64 = cvS.toDataURL('image/png').split(',')[1];
      E.exportEnCours = false; dessiner();
      return b64;
    }
    const nomExport = () => 'fusion-ivass-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + ($('transparent').checked ? '-transparent' : '') + '.png';
    $('exporter').onclick = async () => { try { await hote.enregistrer(imageFinale(), nomExport()); } catch (e) { toast('Enregistrement : ' + (e.message || e)); } };
    $('versRetouche').onclick = () => { if (!E.calques.some((c) => c.sujetFinal)) return toast('Composez d’abord une image.'); hote.envoyerVers('retouche', imageFinale(), nomExport()); };
    $('versMontage').onclick = () => { if (!E.calques.some((c) => c.sujetFinal)) return toast('Composez d’abord une image.'); hote.envoyerVers('montage', imageFinale(), nomExport()); };
    majListe(); majInspecteur(); dessiner(); memoriser();
    const etat = { get calques() { return E.calques; }, get actif() { return E.actif; }, get horizonY() { return E.horizonY; } };
    return { etat, E, nouveauSujet, nouveauLieu, dessiner, annuler, retablir, projet, ouvrirProjet, choisir };
  }

  window.FusionUI = { html, monter };
})();
