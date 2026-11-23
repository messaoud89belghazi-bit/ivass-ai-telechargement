/**
 * Ivass AI — 🪄 Fusion (3.36 PC · 1.10 mobile) : moteur commun au PC et au téléphone (fichier identique des deux côtés).
 * Insérer une personne ou un objet dans la photo d'un lieu :
 *   1. détourage local (fond uni ou peu chargé) — un détourage par IA (Photoroom, BiRefNet, Ideogram) peut le remplacer ;
 *   2. analyse de la scène : couleurs, lumière (sens et force), contraste, grain ;
 *   3. placement : taille déduite de la perspective (ligne d'horizon = hauteur des yeux du photographe) ;
 *   4. réalisme : harmonisation des couleurs, ombre portée orientée, ombre de contact, grain et flou assortis.
 * Les fonctions de calcul travaillent sur des images { data, width, height } (RGBA) : elles sont testées sans navigateur.
 * Développé par Messaoud BELGHAZI.
 */
(function (racine) {
  'use strict';
  const borne = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // ------------------------------------------------------------------ couleur(s) du fond
  /** Couleurs dominantes du bord de l'image (k-moyennes, 3 groupes) → [{ c: [r,g,b], poids }] triés par poids. */
  function couleursBord(img) {
    const { data, width: W, height: H } = img;
    const pts = [];
    const pas = Math.max(1, Math.round((W + H) / 600));
    const prendre = (x, y) => { const i = (y * W + x) * 4; if (data[i + 3] > 16) pts.push([data[i], data[i + 1], data[i + 2]]); };
    for (let x = 0; x < W; x += pas) { prendre(x, 0); prendre(x, H - 1); }
    for (let y = 0; y < H; y += pas) { prendre(0, y); prendre(W - 1, y); }
    if (!pts.length) return [];
    let centres = [pts[0], pts[Math.floor(pts.length / 3)], pts[Math.floor((2 * pts.length) / 3)]].map((c) => c.slice());
    let groupes = [];
    for (let it = 0; it < 8; it++) {
      groupes = centres.map(() => []);
      for (const p of pts) {
        let m = 0, dm = Infinity;
        centres.forEach((c, k) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < dm) { dm = d; m = k; } });
        groupes[m].push(p);
      }
      centres = groupes.map((g, k) => (g.length ? [0, 1, 2].map((j) => g.reduce((s, p) => s + p[j], 0) / g.length) : centres[k]));
    }
    return centres.map((c, k) => ({ c, poids: groupes[k].length / pts.length })).filter((x) => x.poids > 0).sort((a, b) => b.poids - a.poids);
  }

  /** Distance perceptive approchée entre deux couleurs (pondération « redmean »). */
  function distance(r, g, b, c) {
    const rm = (r + c[0]) / 2, dr = r - c[0], dg = g - c[1], db = b - c[2];
    return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) / 3;
  }

  // ------------------------------------------------------------------ détourage local
  /**
   * Détoure un sujet posé sur un fond uni ou peu chargé : le fond est « rempli » depuis les bords de l'image
   * tant que la couleur reste proche d'une couleur de bord ; les îlots isolés sont retirés ; le contour est adouci.
   * o = { tolerance (5–120, défaut 34), douceur (0–4 px, défaut 1), ilotMin (part de l'image, défaut 0,002) }
   * → { alpha: Uint8ClampedArray(W×H), fonds: [[r,g,b]…], partSujet }
   */
  function detourer(img, o = {}) {
    const { data, width: W, height: H } = img;
    const N = W * H;
    const tol = borne(+o.tolerance || 34, 5, 120);
    const fonds = couleursBord(img).filter((x) => x.poids >= 0.12).map((x) => x.c);
    const alpha = new Uint8ClampedArray(N).fill(255);
    if (!fonds.length) return { alpha, fonds, partSujet: 1 };
    const dist = new Float32Array(N);
    for (let p = 0, i = 0; p < N; p++, i += 4) {
      let d = Infinity;
      for (const c of fonds) { const v = distance(data[i], data[i + 1], data[i + 2], c); if (v < d) d = v; }
      dist[p] = data[i + 3] < 16 ? 0 : d;
    }
    // remplissage depuis les bords
    const fond = new Uint8Array(N);
    const file = new Int32Array(N); let tete = 0, queue = 0;
    const pousser = (p) => { if (!fond[p] && dist[p] < tol) { fond[p] = 1; file[queue++] = p; } };
    for (let x = 0; x < W; x++) { pousser(x); pousser((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { pousser(y * W); pousser(y * W + W - 1); }
    while (tete < queue) {
      const p = file[tete++], x = p % W, y = (p - x) / W;
      if (x > 0) pousser(p - 1); if (x < W - 1) pousser(p + 1);
      if (y > 0) pousser(p - W); if (y < H - 1) pousser(p + W);
    }
    // îlots du sujet trop petits (poussières, reflets du fond) → fond ; trous du fond enfermés et proches du fond → fond
    const ilotMin = Math.max(4, Math.round(N * (o.ilotMin != null ? o.ilotMin : 0.002)));
    const vu = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (vu[s]) continue;
      const estFond = fond[s];
      let n = 0; tete = 0; queue = 0; file[queue++] = s; vu[s] = 1;
      while (tete < queue) {
        const p = file[tete++], x = p % W, y = (p - x) / W; n++;
        const voisins = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
        for (const v of voisins) if (v >= 0 && !vu[v] && fond[v] === estFond) { vu[v] = 1; file[queue++] = v; }
      }
      // (les trous intérieurs ne sont pas vidés automatiquement : un vêtement de la couleur du fond ne doit jamais être troué ; la gomme le fait)
      if (!estFond && n < ilotMin) for (let k = 0; k < queue; k++) fond[file[k]] = 1;
    }
    let nSujet = 0;
    for (let p = 0; p < N; p++) { alpha[p] = fond[p] ? 0 : 255; if (!fond[p]) nSujet++; }
    // contour : transparence partielle selon la ressemblance avec le fond (cheveux, poils sur fond uni)
    const bande = tol * 0.55;
    for (let p = 0; p < N; p++) {
      if (fond[p]) continue;
      const x = p % W, y = (p - x) / W;
      const bord = (x > 0 && fond[p - 1]) || (x < W - 1 && fond[p + 1]) || (y > 0 && fond[p - W]) || (y < H - 1 && fond[p + W]);
      if (bord) alpha[p] = Math.round(255 * borne((dist[p] - tol) / bande + 0.5, 0.15, 1));
    }
    const douceur = borne(o.douceur != null ? +o.douceur : 1, 0, 4) | 0;
    const lisse = douceur ? flouAlpha(alpha, W, H, douceur) : alpha;
    // l'intérieur du sujet reste opaque : seul le contour est adouci
    for (let p = 0; p < N; p++) if (alpha[p] === 255 && lisse[p] < 255) lisse[p] = Math.max(lisse[p], 200);
    return { alpha: lisse, fonds, partSujet: nSujet / N };
  }

  /** Flou d'un masque (boîte séparable, rayon r). */
  function flouAlpha(a, W, H, r) {
    const t = new Float32Array(W * H), out = new Uint8ClampedArray(W * H);
    for (let y = 0; y < H; y++) {
      let s = 0; const o = y * W;
      for (let x = -r; x <= r; x++) s += a[o + borne(x, 0, W - 1)];
      for (let x = 0; x < W; x++) { t[o + x] = s / (2 * r + 1); s += a[o + borne(x + r + 1, 0, W - 1)] - a[o + borne(x - r, 0, W - 1)]; }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += t[borne(y, 0, H - 1) * W + x];
      for (let y = 0; y < H; y++) { out[y * W + x] = Math.round(s / (2 * r + 1)); s += t[borne(y + r + 1, 0, H - 1) * W + x] - t[borne(y - r, 0, H - 1) * W + x]; }
    }
    return out;
  }

  /** Applique un masque à l'image (copie) et retire la teinte du fond sur les contours semi-transparents. */
  function appliquerMasque(img, alpha, fonds) {
    const out = new Uint8ClampedArray(img.data);
    const bg = fonds && fonds[0];
    for (let p = 0, i = 0; p < alpha.length; p++, i += 4) {
      const a = alpha[p] / 255;
      if (bg && a > 0.05 && a < 0.98) for (let j = 0; j < 3; j++) out[i + j] = borne((img.data[i + j] - (1 - a) * bg[j]) / a, 0, 255);
      out[i + 3] = Math.round(Math.min(img.data[i + 3], alpha[p]));
    }
    return { data: out, width: img.width, height: img.height };
  }

  /** Rectangle utile (pixels non transparents) → { x, y, w, h } ou null. */
  function cadre(img, seuil = 12) {
    const { data, width: W, height: H } = img;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > seuil) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  // ------------------------------------------------------------------ analyse de scène
  /**
   * Statistiques d'une image (ou de la partie opaque d'un sujet) :
   * moyenne et écart-type par canal, luminance, température (rouge − bleu), contraste, grain,
   * et sens de la lumière (comparaison gauche/droite et haut/bas de la luminance).
   */
  function analyser(img) {
    const { data, width: W, height: H } = img;
    const pas = Math.max(1, Math.floor(Math.sqrt((W * H) / 90000)));
    const s = [0, 0, 0], s2 = [0, 0, 0];
    let n = 0, gauche = 0, droite = 0, haut = 0, bas = 0, nG = 0, nD = 0, nH = 0, nB = 0, grain = 0, nGr = 0, lumS = 0, lumS2 = 0;
    for (let y = 0; y < H; y += pas) for (let x = 0; x < W; x += pas) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2], L = lum(r, g, b);
      s[0] += r; s[1] += g; s[2] += b; s2[0] += r * r; s2[1] += g * g; s2[2] += b * b; n++; lumS += L; lumS2 += L * L;
      if (x < W / 3) { gauche += L; nG++; } else if (x > (2 * W) / 3) { droite += L; nD++; }
      if (y < H / 3) { haut += L; nH++; } else if (y > (2 * H) / 3) { bas += L; nB++; }
      if (x + 1 < W && y + 1 < H) {
        const j = i + 4, k = i + W * 4;
        if (data[j + 3] > 127 && data[k + 3] > 127) { grain += Math.abs(2 * L - lum(data[j], data[j + 1], data[j + 2]) - lum(data[k], data[k + 1], data[k + 2])); nGr++; }
      }
    }
    if (!n) return null;
    const moy = s.map((v) => v / n);
    const ecart = s2.map((v, j) => Math.sqrt(Math.max(1, v / n - moy[j] * moy[j])));
    const lumMoy = lumS / n;
    const dx = nG && nD ? (droite / nD - gauche / nG) / 255 : 0;
    const dy = nH && nB ? (bas / nB - haut / nH) / 255 : 0;
    return {
      moy, ecart, lum: lumMoy, contraste: Math.sqrt(Math.max(0, lumS2 / n - lumMoy * lumMoy)),
      temperature: moy[0] - moy[2], grain: nGr ? grain / nGr : 0,
      lumiere: { dx, dy, cote: Math.abs(dx) < 0.03 ? 'face' : dx > 0 ? 'droite' : 'gauche' },
    };
  }

  // ------------------------------------------------------------------ placement et perspective
  /**
   * Hauteur à l'écran d'un sujet posé au sol : règle de la ligne d'horizon.
   * L'horizon est à la hauteur des yeux du photographe ; un sujet de hauteur réelle Hr dont les pieds sont à piedY
   * mesure (piedY − horizonY) × Hr / hauteurCamera pixels.
   */
  function hauteurPerspective({ piedY, horizonY, hauteurReelle = 1.75, hauteurCamera = 1.6 }) {
    return Math.max(4, (piedY - horizonY) * (hauteurReelle / Math.max(0.2, hauteurCamera)));
  }
  /** Placement de départ : horizon aux 45 % de la hauteur, pieds aux 88 %, sujet centré. */
  function placementInitial(W, H, sujetW, sujetH, o = {}) {
    const horizonY = o.horizonY != null ? o.horizonY : H * 0.45;
    const piedY = H * 0.88;
    const h = hauteurPerspective({ piedY, horizonY, hauteurReelle: o.hauteurReelle, hauteurCamera: o.hauteurCamera });
    return { x: W / 2, piedY, horizonY, h, w: (h * sujetW) / Math.max(1, sujetH) };
  }

  // ------------------------------------------------------------------ réalisme
  /**
   * Harmonise les couleurs du sujet avec la scène (transfert moyenne / écart-type par canal, dosé par « force » 0–1).
   * Le rapport des écarts est borné pour ne jamais « délaver » une peau ou un vêtement.
   */
  function harmoniser(img, sujet, scene, force = 0.5) {
    const out = new Uint8ClampedArray(img.data);
    if (!sujet || !scene || force <= 0) return { data: out, width: img.width, height: img.height };
    const k = borne(force, 0, 1);
    const ratio = [0, 1, 2].map((j) => borne(scene.ecart[j] / sujet.ecart[j], 0.7, 1.4));
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] === 0) continue;
      for (let j = 0; j < 3; j++) {
        const v = img.data[i + j];
        const cible = (v - sujet.moy[j]) * ratio[j] + (sujet.moy[j] + (scene.moy[j] - sujet.moy[j]) * 0.6);
        out[i + j] = borne(v + (cible - v) * k, 0, 255);
      }
    }
    return { data: out, width: img.width, height: img.height };
  }

  /** Ajoute un grain comparable à celui de la scène sur la partie opaque du sujet (aléa reproductible). */
  function ajouterGrain(img, niveau, graine = 7) {
    const out = new Uint8ClampedArray(img.data);
    if (!(niveau > 0.2)) return { data: out, width: img.width, height: img.height };
    let x = graine >>> 0 || 7;
    const alea = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) / 4294967296) - 0.5; };
    const ampl = borne(niveau * 0.6, 0, 18);
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] < 8) continue;
      const d = (alea() + alea()) * ampl;
      out[i] = borne(out[i] + d, 0, 255); out[i + 1] = borne(out[i + 1] + d, 0, 255); out[i + 2] = borne(out[i + 2] + d, 0, 255);
    }
    return { data: out, width: img.width, height: img.height };
  }

  /** Paramètres de l'ombre portée d'après la lumière de la scène : l'ombre part du côté opposé à la lumière. */
  function parametresOmbre(scene, force = 0.6) {
    const L = (scene && scene.lumiere) || { dx: 0, dy: 0 };
    const contraste = scene ? scene.contraste : 50;
    return {
      inclinaison: borne(-L.dx * 3.2, -1.4, 1.4), // décalage horizontal du haut de l'ombre (× hauteur écrasée)
      ecrasement: borne(0.22 + Math.abs(L.dx) * 0.6, 0.18, 0.5),
      opacite: borne((0.2 + contraste / 140) * force, 0, 0.75),
      flou: borne(2 + (1 - Math.min(1, contraste / 80)) * 8, 2, 12), // lumière douce (peu de contraste) → ombre plus floue
      contact: borne(0.35 + force * 0.35, 0, 0.8),
    };
  }

  // ------------------------------------------------------------------ composition (navigateur : canvas 2D)
  /**
   * Dessine le montage. ctx : contexte 2D de la taille de la scène.
   * o = { scene (image/canvas), sujet (canvas détouré et harmonisé), x (centre), piedY, h, miroir, ombre (0–1),
   *       sceneStats, flou (px), horizonY, montrerHorizon }
   */
  function composer(ctx, o) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save(); ctx.clearRect(0, 0, W, H);
    ctx.drawImage(o.scene, 0, 0, W, H);
    const sj = o.sujet; if (!sj) { ctx.restore(); return; }
    const h = o.h, w = (h * sj.width) / sj.height, x0 = o.x - w / 2, y0 = o.piedY - h;
    if (o.ombre > 0) {
      const pm = parametresOmbre(o.sceneStats, o.ombre);
      const sil = document.createElement('canvas'); sil.width = sj.width; sil.height = sj.height;
      const c2 = sil.getContext('2d'); c2.drawImage(sj, 0, 0); c2.globalCompositeOperation = 'source-in'; c2.fillStyle = '#000'; c2.fillRect(0, 0, sil.width, sil.height);
      // ombre portée : silhouette écrasée sur le sol, inclinée à l'opposé de la lumière
      ctx.save();
      ctx.globalAlpha = pm.opacite; ctx.filter = `blur(${(pm.flou * h) / 400}px)`;
      // (x, y) → (x + c·y + e, d·y + f) : la silhouette (y de −h à 0) devient une bande au sol de hauteur d·h,
      // dont le haut est décalé de −c·h = inclinaison·h (vers le côté opposé à la lumière : l'ombre s'allonge sur le sol, à côté du sujet)
      ctx.translate(o.x, o.piedY); ctx.transform(1, 0, -pm.inclinaison, pm.ecrasement, 0, 0);
      if (o.miroir) ctx.scale(-1, 1);
      ctx.drawImage(sil, -w / 2, -h, w, h);
      ctx.restore();
      // ombre de contact sous les pieds
      ctx.save();
      const rx = w * 0.42, ry = Math.max(2, h * 0.025);
      const gr = ctx.createRadialGradient(o.x, o.piedY, 0, o.x, o.piedY, rx);
      gr.addColorStop(0, `rgba(0,0,0,${pm.contact})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.translate(o.x, o.piedY); ctx.scale(1, ry / rx); ctx.translate(-o.x, -o.piedY);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(o.x, o.piedY, rx, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.save();
    if (o.flou > 0.05) ctx.filter = `blur(${o.flou}px)`;
    if (o.miroir) { ctx.translate(o.x * 2, 0); ctx.scale(-1, 1); }
    ctx.drawImage(sj, x0, y0, w, h);
    ctx.restore();
    if (o.montrerHorizon && o.horizonY != null) {
      ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = Math.max(1, W / 900); ctx.strokeStyle = 'rgba(255,170,60,.9)';
      ctx.beginPath(); ctx.moveTo(0, o.horizonY); ctx.lineTo(W, o.horizonY); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    return { x0, y0, w, h };
  }

  // ------------------------------------------------------------------ 3.39 : calques, coordonnées, perspective simulée
  /**
   * Zone réellement occupée par l'image dans un <canvas> affiché avec « object-fit: contain » :
   * l'élément peut être plus large (ou plus haut) que l'image dessinée → sans ce calcul, la souris tombe à côté.
   * rect = getBoundingClientRect() ; cw, ch = taille interne du canvas. Rend { left, top, width, height, k } (k = pixels image par pixel écran).
   */
  function zoneAffichee(rect, cw, ch) {
    const k = Math.min(rect.width / Math.max(1, cw), rect.height / Math.max(1, ch));
    const width = cw * k, height = ch * k;
    return { left: rect.left + (rect.width - width) / 2, top: rect.top + (rect.height - height) / 2, width, height, k: 1 / Math.max(1e-9, k) };
  }
  /** Coordonnées écran → coordonnées de l'image (justes à tout zoom, toute taille de fenêtre et tout défilement). */
  function versImage(clientX, clientY, rect, cw, ch) {
    const z = zoneAffichee(rect, cw, ch);
    return { x: (clientX - z.left) * z.k, y: (clientY - z.top) * z.k, k: z.k };
  }
  /**
   * Hauteur d'un calque : selon la perspective tant que les pieds sont sous l'horizon ; au-dessus (sujet en hauteur,
   * en l'air, sur un balcon…) la règle ne s'applique plus → la hauteur actuelle est gardée. Le placement reste libre.
   */
  function hauteurCalque(c, horizonY, hauteurCamera) {
    if (!c.auto || c.piedY <= horizonY + 4) return c.h;
    return hauteurPerspective({ piedY: c.piedY, horizonY, hauteurReelle: c.hReelle || 1.75, hauteurCamera });
  }
  const MODES = ['source-over', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'darken', 'lighten', 'color-dodge', 'color-burn', 'luminosity'];
  /**
   * Matrice d'un calque plat : position (x, piedY), hauteur h, rotation (degrés, autour du pied), miroirs, et perspective
   * SIMULÉE (inclY : pivote autour de l'axe vertical → la largeur se réduit et un côté fuit ; inclX : bascule avant/arrière).
   * Ce n'est pas de la vraie 3D : l'image reste plate. Rend { a, b, c, d, e, f } pour ctx.setTransform ou ctx.transform.
   */
  function matriceCalque(c) {
    const rad = ((c.rotation || 0) * Math.PI) / 180;
    const ry = (Math.max(-75, Math.min(75, c.inclY || 0)) * Math.PI) / 180, rx = (Math.max(-75, Math.min(75, c.inclX || 0)) * Math.PI) / 180;
    const sx = (c.miroir ? -1 : 1) * Math.cos(ry), sy = (c.miroirV ? -1 : 1) * Math.cos(rx);
    const kx = Math.sin(ry) * 0.25, ky = Math.sin(rx) * 0.25; // cisaillement léger : un bord paraît plus proche
    const cos = Math.cos(rad), sin = Math.sin(rad);
    // M = T(x, piedY) · R(rot) · [sx, ky; kx, sy]
    const a0 = sx, b0 = kx, c0 = ky, d0 = sy;
    return { a: cos * a0 - sin * b0, b: sin * a0 + cos * b0, c: cos * c0 - sin * d0, d: sin * c0 + cos * d0, e: c.x, f: c.piedY };
  }
  /** Le point (px, py) de l'image est-il sur le calque ? (test inverse de la matrice, rectangle −w/2..w/2 × −h..0) */
  function toucheCalque(c, px, py) {
    if (!c || !c.sujetFinal) return false;
    const m = matriceCalque(c), det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return false;
    const dx = px - m.e, dy = py - m.f;
    const u = (m.d * dx - m.c * dy) / det, v = (-m.b * dx + m.a * dy) / det;
    const w = (c.h * c.sujetFinal.width) / c.sujetFinal.height;
    return u >= -w / 2 && u <= w / 2 && v >= -c.h && v <= 0;
  }
  /**
   * Composition à plusieurs calques (ordre = ordre du tableau, le dernier est devant).
   * o = { scene, calques: [{ sujetFinal, x, piedY, h, rotation, miroir, miroirV, inclX, inclY, opacite, mode, ombre, flou, visible }],
   *       sceneStats, horizonY, montrerHorizon, transparent, selection }
   */
  function composerCalques(ctx, o) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    if (o.scene && !o.transparent) ctx.drawImage(o.scene, 0, 0, W, H);
    const cadres = [];
    for (const c of o.calques || []) {
      if (!c.sujetFinal || c.visible === false) { cadres.push(null); continue; }
      const sj = c.sujetFinal, h = c.h, w = (h * sj.width) / sj.height;
      if (c.ombre > 0 && !o.transparent) {
        const pm = parametresOmbre(o.sceneStats, c.ombre);
        const sil = document.createElement('canvas'); sil.width = sj.width; sil.height = sj.height;
        const c2 = sil.getContext('2d'); c2.drawImage(sj, 0, 0); c2.globalCompositeOperation = 'source-in'; c2.fillStyle = '#000'; c2.fillRect(0, 0, sil.width, sil.height);
        ctx.save(); ctx.globalAlpha = pm.opacite * (c.opacite == null ? 1 : c.opacite); ctx.filter = `blur(${(pm.flou * h) / 400}px)`;
        ctx.translate(c.x, c.piedY); ctx.transform(1, 0, -pm.inclinaison, pm.ecrasement, 0, 0);
        if (c.miroir) ctx.scale(-1, 1);
        ctx.drawImage(sil, -w / 2, -h, w, h); ctx.restore();
        ctx.save();
        const rx = w * 0.42, ry = Math.max(2, h * 0.025);
        const gr = ctx.createRadialGradient(c.x, c.piedY, 0, c.x, c.piedY, rx);
        gr.addColorStop(0, `rgba(0,0,0,${pm.contact * (c.opacite == null ? 1 : c.opacite)})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.translate(c.x, c.piedY); ctx.scale(1, ry / rx); ctx.translate(-c.x, -c.piedY);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.piedY, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const m = matriceCalque(c);
      ctx.save();
      ctx.globalAlpha = c.opacite == null ? 1 : Math.max(0, Math.min(1, c.opacite));
      ctx.globalCompositeOperation = MODES.includes(c.mode) ? c.mode : 'source-over';
      if (c.flou > 0.05) ctx.filter = `blur(${c.flou}px)`;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      ctx.drawImage(sj, -w / 2, -h, w, h);
      ctx.restore();
      // boîte englobante (pour la sélection)
      const coins = [[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w / 2, 0]].map(([u, v]) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f]);
      const xs = coins.map((p) => p[0]), ys = coins.map((p) => p[1]);
      cadres.push({ x0: Math.min(...xs), y0: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), coins });
    }
    if (o.selection != null && cadres[o.selection]) {
      const cd = cadres[o.selection];
      ctx.save(); ctx.lineWidth = Math.max(1.5, W / 700); ctx.strokeStyle = 'rgba(80,160,255,.95)'; ctx.setLineDash([8, 6]);
      ctx.beginPath(); cd.coins.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    if (o.montrerHorizon && o.horizonY != null && !o.transparent) {
      ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = Math.max(1, W / 900); ctx.strokeStyle = 'rgba(255,170,60,.9)';
      ctx.beginPath(); ctx.moveTo(0, o.horizonY); ctx.lineTo(W, o.horizonY); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    return cadres;
  }

  const API = { couleursBord, distance, detourer, flouAlpha, appliquerMasque, cadre, analyser, hauteurPerspective, placementInitial, harmoniser, ajouterGrain, parametresOmbre, composer, zoneAffichee, versImage, hauteurCalque, matriceCalque, toucheCalque, composerCalques, MODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (racine) racine.FusionCore = API;
})(typeof window !== 'undefined' ? window : null);
