/* Ivass AI Mobile — 📦 Livrables : Ivass crée les vrais fichiers (Word, PDF, Excel, PowerPoint, CSV…), les images et les vidéos.
   Android : fichiers dans Téléchargements › Ivass AI, ouverts et partagés par les applications du téléphone.
   iPhone : fichiers gardés dans Ivass AI, « Enregistrer » ouvre le menu de partage (→ Fichiers, AirDrop, WhatsApp…).
   Développé par Messaoud BELGHAZI. */
(function () {
  'use strict';
  const C = window.LivrablesCore;
  const N = window.Native;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- bibliothèques chargées seulement quand il le faut (≈ 0,5 à 2 Mo chacune) ---------- */
  const VENDOR = { docx: ['vendor/docx.min.js'], exceljs: ['vendor/exceljs.min.js'], pptxgenjs: ['vendor/pptxgen.bundle.js'], pdfmake: ['vendor/pdfmake.min.js', 'vendor/vfs_fonts.js'] };
  const GLOBAL = { docx: () => window.docx, exceljs: () => window.ExcelJS, pptxgenjs: () => window.PptxGenJS, pdfmake: () => window.pdfMake };
  const loaded = new Map();
  const loadScript = (src) => {
    if (!loaded.has(src)) loaded.set(src, new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { loaded.delete(src); rej(new Error('Composant introuvable : ' + src + ' (vérifiez la connexion puis réessayez).')); }; document.head.appendChild(s); }));
    return loaded.get(src);
  };
  async function lib(n) {
    if (!VENDOR[n]) throw new Error('Format indisponible.');
    for (const src of VENDOR[n]) await loadScript(src);
    const g = GLOBAL[n](); if (!g) throw new Error('Composant « ' + n + ' » non chargé.');
    return g;
  }

  /* ---------- consignes données à l'IA ---------- */
  const RULES = `RÉSULTAT FINAL D'ABORD — détermine ce que veut vraiment l'utilisateur : une explication, du code, un fichier/document, une image, une vidéo ou une tâche.
- Explication ou conseil → réponds directement.
- Code, script, API, site ou application demandés EXPLICITEMENT → code complet.
- Document, fichier ou tableau (rapport, CV, lettre, contrat, devis, facture, compte rendu, présentation, budget, planning, liste, PDF, Word, Excel, PowerPoint, CSV, JSON…) → NI code NI méthode : rédige le contenu FINAL complet dans un bloc
\`\`\`livrable:nom-du-fichier.ext
contenu
\`\`\`
Ivass crée le vrai fichier sur le téléphone. Contenu selon l'extension : .docx et .pdf → Markdown (titres #, listes, tableaux |…|, **gras**) ; .pptx → une diapositive par section séparée par --- (titre « # », puces, « Notes : … ») ; .xlsx → tableaux Markdown (« ## Nom de la feuille » avant chaque tableau ; montants « 12,50 € », pourcentages « 45% », formules « =SUM(B2:B9) ») ; .csv, .json, .txt, .html, .ics, .vcf → contenu brut.
Format non précisé : document → .docx ; tableau, budget → .xlsx ; présentation → .pptx. Nom court sans espaces. Contenu réel et complet, jamais un modèle « à compléter ». Une phrase avant le bloc, 1 à 3 lignes après.
- Image, logo, affiche, illustration, fond d'écran, avatar → ni code ni « prompt à copier ailleurs » : une ligne puis un bloc \`\`\`ivass-image contenant une description visuelle détaillée en anglais (sujet, style, couleurs, composition, texte éventuel entre guillemets). Ivass crée l'image.
- Vidéo, publicité, intro, clip, TikTok → une ligne puis un bloc \`\`\`ivass-video avec une description détaillée en anglais (scène, caméra, ambiance, 8 secondes). Ivass propose de la tourner.
- N'écris jamais « voici un script pour générer… » ni « utilisez ce prompt sur un autre service » quand le résultat est demandé : CRÉE-LE.
- Méthode : comprends l'intention réelle, décompose, traite toutes les tâches demandées, tiens compte de toute la discussion, vérifie chiffres et totaux avant de livrer. Adapte ton niveau à l'utilisateur.`;

  /* ---------- règles de contenu (mêmes que sur PC) ---------- */
  const W = (alt) => { try { return new RegExp(`(?<![\\p{L}\\d])(?:${alt})(?![\\p{L}\\d])`, 'iu'); } catch (_) { return new RegExp(`(?:^|[^\\p{L}\\d])(?:${alt})(?![\\p{L}\\d])`, 'iu'); } }; // anciens iPhone : pas de « lookbehind »
  const SEXUAL = W(String.raw`porn\w*|pornograph\w*|nsfw|hentai|xxx|sexe?\s+explicite|explicit\s+sex\w*|sexually\s+explicit|sex\s+scene|scène\s+de\s+sexe|nudes?|nudit[ée]s?|naked|nue?s?\s+int[ée]grale?s?|d[ée]shabill\w*|strip-?tease|[ée]rotique\w*|erotic\w*|orgasm\w*|fellation|p[ée]n[ée]tration|lingerie\s+sexy|topless|seins?\s+nus?`);
  const MINOR = W(String.raw`enfants?|mineure?s?|minors?|child(ren)?|kids?|b[ée]b[ée]s?|babies|toddlers?|ados?|adolescente?s?|teens?|teenagers?|coll[ée]gien\w*|lyc[ée]en\w*|[ée]coli[eè]re?s?|schoolgirls?|schoolboys?|fillettes?|gar[çc]onnets?|loli\w*|shota\w*|underage|(1[0-7]|[1-9])\s*(ans|years?\s*old|yo)`);
  const NAKED = W(String.raw`nue?s?|torse\s+nu`);
  const INNOCENT_NU = /(pieds?|t[êe]te|mains?|bras|jambes?)\s+nue?s?|[àa]\s+l['’]?\s*[œo]e?il\s+nu|nu-pieds|nu-t[êe]te/giu;
  function guard(text) {
    const t = String(text || '');
    if ((MINOR.test(t) && NAKED.test(t.replace(INNOCENT_NU, ' '))) || (SEXUAL.test(t) && MINOR.test(t))) throw new Error('Demande refusée : contenu impliquant des mineurs.');
    if (SEXUAL.test(t)) throw new Error('Ivass ne génère pas de contenu sexuel ou de nudité (conditions d’utilisation).');
  }

  /* ---------- 🎨 images : Hugging Face (crédits gratuits), Google Gemini, OpenAI ---------- */
  function keysOf(ctx) {
    const out = { huggingface: null, gemini: null, openai: null };
    for (const p of ctx.providers()) {
      if (p.enabled === false) continue;
      const k = ctx.getKey(p.id); if (!k) continue;
      const u = String(p.baseUrl || '');
      if (!out.huggingface && /huggingface\.co/.test(u)) out.huggingface = { key: k };
      else if (!out.gemini && (p.type === 'gemini' || /generativelanguage\.googleapis\.com/.test(u))) out.gemini = { key: k, base: /^https:\/\//.test(u) ? u.replace(/\/+$/, '').replace(/\/v1(beta)?$/, '') : 'https://generativelanguage.googleapis.com' };
      else if (!out.openai && /api\.openai\.com/.test(u)) out.openai = { key: k };
    }
    return out;
  }
  const json = (r, who) => {
    if (!r.ok) {
      let m = r.body; try { const j = JSON.parse(r.body); m = (j.error && (j.error.message || j.error)) || j.message || r.body; } catch (_) { /* texte brut */ }
      throw Object.assign(new Error(`${who} : HTTP ${r.status} — ${String(m).slice(0, 220)}`), { status: r.status });
    }
    try { return JSON.parse(r.body); } catch (_) { throw new Error(who + ' : réponse illisible.'); }
  };
  async function hfImage(key, prompt) {
    const auth = { Authorization: 'Bearer ' + key };
    const models = ['black-forest-labs/FLUX.1-schnell', 'Qwen/Qwen-Image', 'stabilityai/stable-diffusion-xl-base-1.0'];
    let last = null;
    for (const model of models) {
      let mapping = {};
      try { const r = await N.http({ url: `https://huggingface.co/api/models/${model}?expand[]=inferenceProviderMapping`, headers: auth, timeout: 20000 }); if (r.ok) { const m = JSON.parse(r.body).inferenceProviderMapping || {}; mapping = Array.isArray(m) ? Object.fromEntries(m.map((x) => [x.provider, x])) : m; } } catch (_) { /* on tente quand même */ }
      let order = ['hf-inference', 'fal-ai', 'together', 'nebius'].filter((p) => mapping[p] && mapping[p].status !== 'error');
      if (!order.length) order = ['hf-inference'];
      for (const p of order) {
        const id = (mapping[p] && mapping[p].providerId) || model;
        let r;
        if (p === 'hf-inference') {
          r = await N.http({ url: `https://router.huggingface.co/hf-inference/models/${model}`, method: 'POST', binary: true, headers: { ...auth, 'Content-Type': 'application/json', Accept: 'image/png' }, body: JSON.stringify({ inputs: prompt, parameters: { width: 1024, height: 1024 } }) });
          if (r.ok && /^image\//.test(r.headers['content-type'] || '')) return { b64: r.body, mime: r.headers['content-type'].split(';')[0] };
        } else if (p === 'fal-ai') {
          r = await N.http({ url: `https://router.huggingface.co/fal-ai/${id}`, method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, image_size: { width: 1024, height: 1024 }, num_images: 1, sync_mode: true }) });
          if (r.ok) { const j = JSON.parse(r.body); const u = j.images && j.images[0] && (j.images[0].url || j.images[0]); if (u) return fromUrl(u); }
        } else {
          r = await N.http({ url: `https://router.huggingface.co/${p}/v1/images/generations`, method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: id, prompt, width: 1024, height: 1024, n: 1, response_format: p === 'nebius' ? 'b64_json' : 'base64' }) });
          if (r.ok) { const d = (JSON.parse(r.body).data || [])[0]; if (d && (d.b64_json || d.url)) return d.b64_json ? { b64: d.b64_json, mime: 'image/png' } : fromUrl(d.url); }
        }
        const st = r.ok ? 0 : r.status;
        last = new Error('Hugging Face : ' + (st === 401 ? 'jeton refusé (recréez-le sur huggingface.co/settings/tokens)' : st === 403 ? 'jeton sans la permission « Inference Providers »' : st === 402 ? 'crédits gratuits du mois épuisés' : st === 429 ? 'trop de demandes, réessayez dans une minute' : `HTTP ${st}`));
        if ([401, 402, 403].includes(st)) throw last;
      }
    }
    throw last || new Error('Hugging Face : aucun modèle d’image disponible.');
  }
  async function fromUrl(u) {
    if (/^data:/.test(u)) { const m = u.match(/^data:([^;]+);base64,(.*)$/); return { b64: m[2], mime: m[1] }; }
    const r = await N.http({ url: u, binary: true });
    if (!r.ok) throw new Error('Image introuvable (HTTP ' + r.status + ').');
    return { b64: r.body, mime: (r.headers['content-type'] || 'image/png').split(';')[0] };
  }
  async function geminiImage(g, prompt) {
    const r = await N.http({ url: `${g.base}/v1beta/models/gemini-2.5-flash-image:generateContent`, method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': g.key }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt + '\n\nFormat d’image : 1:1.' }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }) });
    if (!r.ok && /limit:\s*0|free_tier/i.test(r.body)) throw new Error('Gemini : la création d’images n’est pas incluse dans l’offre gratuite de Google (activez la facturation sur aistudio.google.com).');
    const j = json(r, 'Gemini');
    const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    for (const p of parts) { const d = p.inlineData || p.inline_data; if (d && d.data) return { b64: d.data, mime: d.mimeType || d.mime_type || 'image/png' }; }
    throw new Error('Gemini n’a renvoyé aucune image (demande refusée ?).');
  }
  async function openaiImage(o, prompt) {
    const j = json(await N.http({ url: 'https://api.openai.com/v1/images/generations', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + o.key }, body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1024' }) }), 'OpenAI');
    const d = (j.data || [])[0]; if (!d || !d.b64_json) throw new Error('OpenAI n’a renvoyé aucune image.');
    return { b64: d.b64_json, mime: 'image/png' };
  }
  async function makeImage(prompt, ctx) {
    guard(prompt);
    const K = keysOf(ctx);
    const tries = [['Hugging Face', K.huggingface && (() => hfImage(K.huggingface.key, prompt))], ['Gemini', K.gemini && (() => geminiImage(K.gemini, prompt))], ['OpenAI', K.openai && (() => openaiImage(K.openai, prompt))]].filter((x) => x[1]);
    if (!tries.length) throw new Error('Pour créer des images ici, ajoutez une clé Hugging Face (gratuite, hf_…) ou Google Gemini dans ⚙️ Réglages.');
    const errs = [];
    for (const [who, run] of tries) {
      try { const im = await run(); return Object.assign(im, { provider: who }); } catch (e) { errs.push(e.message); if (/refusée|conditions/i.test(e.message)) break; }
    }
    throw new Error(errs.join(' · '));
  }

  /* ---------- 🎥 vidéo : Google Veo (clé Gemini avec facturation) ---------- */
  const VEO_MODELS = ['veo-3.1-fast-generate-preview', 'veo-3.0-fast-generate-001', 'veo-3.1-generate-preview'];
  async function makeVideo(prompt, ctx, onPhase, signal) {
    guard(prompt);
    const g = keysOf(ctx).gemini;
    if (!g) throw new Error('Pour tourner la vidéo sur le téléphone, ajoutez une clé Google Gemini (Veo est payant chez Google). Sinon : Ivass AI sur PC › 🎨 Studio › Vidéo IA.');
    let op = null, model = null, lastErr = null;
    for (const m of VEO_MODELS) {
      onPhase('Envoi de la demande à Veo…');
      const r = await N.http({ url: `${g.base}/v1beta/models/${m}:predictLongRunning`, method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': g.key }, body: JSON.stringify({ instances: [{ prompt: prompt.slice(0, 2000) }], parameters: { aspectRatio: /9:16|tiktok|vertical|reel|short/i.test(prompt) ? '9:16' : '16:9', personGeneration: 'allow_adult' } }) });
      if (r.status === 404) { lastErr = new Error('Veo : modèle ' + m + ' indisponible'); continue; }
      if (!r.ok && /limit:\s*0|free_tier|billing/i.test(r.body)) throw new Error('Veo n’est pas inclus dans l’offre gratuite de Google : activez la facturation sur aistudio.google.com (ou utilisez Ivass AI sur PC › Vidéo IA avec ComfyUI, gratuit).');
      op = json(r, 'Veo'); model = m; break;
    }
    if (!op) throw lastErr || new Error('Veo indisponible.');
    if (!op.name) throw new Error('Veo n’a pas renvoyé d’opération.');
    const t0 = Date.now();
    let done = null;
    while (!done) {
      if (signal && signal.aborted) throw new Error('Arrêté.');
      if (Date.now() - t0 > 12 * 60000) throw new Error('Veo met trop de temps : réessayez plus tard.');
      onPhase(`Tournage en cours (${model}) — ${Math.round((Date.now() - t0) / 1000)} s…`);
      await new Promise((res) => setTimeout(res, 8000));
      const q = json(await N.http({ url: `${g.base}/v1beta/${op.name}`, headers: { 'x-goog-api-key': g.key }, signal }), 'Veo');
      if (q.error) throw new Error('Veo : ' + (q.error.message || JSON.stringify(q.error)));
      if (q.done) done = q;
    }
    const gv = (done.response && done.response.generateVideoResponse) || {};
    const s = (gv.generatedSamples || [])[0];
    if (!s || !s.video || !s.video.uri) { const why = (gv.raiMediaFilteredReasons || []).join(' '); throw new Error(why ? 'Veo a refusé cette vidéo (règles de Google) : ' + why : 'Veo n’a pas renvoyé de vidéo.'); }
    onPhase('Téléchargement de la vidéo…');
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const f = await N.files.download(s.video.uri, { 'x-goog-api-key': g.key }, `video-ivass-${stamp}.mp4`, 'video/mp4');
    return { name: f.name, where: f.where, size: f.size, mime: 'video/mp4', kind: 'Vidéo MP4', provider: 'Google Veo' };
  }

  /* ---------- fabrication et enregistrement ---------- */
  async function makeFile(it) {
    const f = await C.build({ name: it.name, content: it.content, lib });
    const s = await N.files.save(f.name, f.bytes, f.mime);
    return { name: s.name, where: s.where, size: s.size || f.bytes.length, mime: f.mime, kind: f.kind };
  }
  const extOf = (n) => (String(n).match(/\.([a-z0-9]+)$/i) || [])[1] || 'md';
  const ICON = { docx: '📝', pdf: '📕', xlsx: '📊', pptx: '📽', csv: '📋', tsv: '📋', json: '🧩', md: '📄', txt: '📄', html: '🌐', htm: '🌐', svg: '🖼', ics: '📅', vcf: '👤', mp4: '🎥' };
  const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round((b || 0) / 1024)) + ' Ko');
  const busy = new WeakMap(); // message → { k: phase }
  const pics = new Map(); // nom → data URL (jamais enregistré dans la discussion)
  const vids = new Map(); // nom → adresse blob (iPhone)

  function picOf(info, redraw) {
    if (pics.has(info.name)) return pics.get(info.name);
    pics.set(info.name, null);
    N.files.get(info.name, info.mime).then((r) => { pics.set(info.name, r ? `data:${r.mime};base64,${r.b64}` : ''); redraw(); }).catch(() => pics.set(info.name, ''));
    return null;
  }

  function card(icon, title, state, btns, extra) {
    return `<div class="lvr-card"><div class="lvr-ico">${icon}</div><div class="lvr-main"><b>${title}</b>${state ? `<span class="lvr-st">${state}</span>` : ''}${btns ? `<div class="lvr-btns">${btns}</div>` : ''}${extra || ''}</div></div>`;
  }
  const B = (k, a, label, primary) => `<button class="lvr-b${primary ? ' on' : ''}" data-lv="${a}" data-k="${k}">${label}</button>`;
  const saveLabel = N.isAndroid ? '↗ Partager' : '⬇ Enregistrer';
  const whereTxt = (i) => (N.isAndroid ? `Enregistré dans ${esc(i.where || 'Téléchargements › Ivass AI')}` : 'Prêt : « Enregistrer » le met dans Fichiers');

  function decorate(html, m, streaming, redraw) {
    const items = C.extract(m.content);
    if (!items.length) return html;
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const nodes = [...tpl.content.querySelectorAll('.code')].filter((n) => /^(livrable|ivass-image|ivass-video)$/.test(n.dataset.lang || ''));
    const ph = busy.get(m) || {};
    nodes.forEach((n, k) => {
      const it = items[k]; if (!it) return;
      const info = (m.liv || [])[k];
      let h;
      if (streaming || !it.closed) h = card(it.type === 'file' ? ICON[extOf(it.name)] || '📄' : it.type === 'image' ? '🎨' : '🎥', esc(it.type === 'file' ? it.name : it.type === 'image' ? 'Image' : 'Vidéo'), '<span class="lvr-wait">✍️ Rédaction…</span>');
      else if (it.type === 'file') {
        const icon = ICON[extOf(it.name)] || '📄';
        const pre = `<pre class="lvr-src hidden">${esc(it.content)}</pre>`;
        if (ph[k]) h = card(icon, esc(it.name), `<span class="lvr-wait">${esc(ph[k])}</span>`);
        else if (!info) h = card(icon, esc(it.name), '', B(k, 'make', '📦 Créer le fichier', true) + B(k, 'view', 'Voir le contenu'), pre);
        else if (info.error) h = card(icon, esc(it.name), `<span class="lvr-err">⚠ ${esc(info.error)}</span>`, B(k, 'make', 'Réessayer', true) + B(k, 'view', 'Voir le contenu'), pre);
        else h = card(icon, esc(info.name), `${esc(info.kind || 'Fichier')} · ${size(info.size)}<br>${whereTxt(info)}`, B(k, 'open', 'Ouvrir', true) + B(k, 'save', saveLabel) + B(k, 'view', 'Voir le contenu'), pre);
      } else if (it.type === 'image') {
        if (ph[k]) h = card('🎨', 'Création de l’image…', `<span class="lvr-wait">${esc(ph[k])}</span>`);
        else if (!info) h = card('🎨', 'Image', esc(it.prompt.slice(0, 160)), B(k, 'img', '🎨 Créer l’image', true));
        else if (info.error) h = card('🎨', 'Image non créée', `<span class="lvr-err">⚠ ${esc(info.error)}</span>`, B(k, 'img', 'Réessayer', true));
        else {
          const src = picOf(info, redraw);
          h = `<div class="lvr-img">${src ? `<img src="${src}" alt="Image créée par Ivass AI">` : src === '' ? '<div class="lvr-st">Image supprimée du téléphone.</div>' : '<div class="lvr-wait">Chargement…</div>'}<div class="lvr-btns">${B(k, 'open', 'Ouvrir', true)}${B(k, 'save', saveLabel)}${B(k, 'img', '↻ Une autre')}<span class="lvr-st">${esc(info.provider || '')}</span></div></div>`;
        }
      } else {
        if (ph[k]) h = card('🎥', 'Tournage de la vidéo…', `<span class="lvr-wait">${esc(ph[k])}</span>`, B(k, 'stop', 'Arrêter'));
        else if (info && !info.error) {
          const v = !N.isAndroid && vids.get(info.name);
          if (!N.isAndroid && !vids.has(info.name)) { vids.set(info.name, ''); N.files.get(info.name, 'video/mp4').then((r) => { if (r) { vids.set(info.name, URL.createObjectURL(new Blob([N.bytesOf(r.b64)], { type: 'video/mp4' }))); redraw(); } }).catch(() => {}); }
          h = card('🎥', esc(info.name), `Vidéo MP4 · ${size(info.size)}<br>${whereTxt(info)}`, B(k, 'open', '▶ Ouvrir', true) + B(k, 'save', saveLabel), v ? `<video class="lvr-video" src="${v}" controls playsinline></video>` : '');
        } else {
          const hasGemini = !!keysOf(ctxRef).gemini;
          h = card('🎥', 'Vidéo prête à tourner', (info && info.error ? `<span class="lvr-err">⚠ ${esc(info.error)}</span><br>` : '') + esc(it.prompt.slice(0, 200)) + (hasGemini ? '<br><span class="lvr-st">Google Veo · 8 s · service payant de Google (1 à 3 min)</span>' : '<br><span class="lvr-st">Pour la tourner ici : clé Google Gemini avec facturation (Veo). Ou sur PC : 🎨 Studio › Vidéo IA.</span>'),
            (hasGemini ? B(k, 'video', '🎬 Tourner la vidéo', true) : '') + B(k, 'copy', '📋 Copier la description'));
        }
      }
      const div = document.createElement('div'); div.innerHTML = h;
      n.replaceWith(div.firstElementChild);
    });
    return tpl.innerHTML;
  }

  let ctxRef = { providers: () => [], getKey: () => '' };
  async function run(m, k, ctx, fn) {
    const ph = busy.get(m) || {}; busy.set(m, ph);
    m.liv = m.liv || [];
    ph[k] = '⚙️ Création…'; ctx.redraw();
    try { m.liv[k] = await fn((p) => { ph[k] = p; ctx.redraw(); }); }
    catch (e) { m.liv[k] = { error: String(e && e.message || e).slice(0, 400) }; }
    delete ph[k];
    ctx.save(); ctx.redraw();
    return m.liv[k];
  }
  const doFile = (m, k, it, ctx) => run(m, k, ctx, async (phase) => { if (/\.(docx|xlsx|pptx|pdf)$/.test(it.name)) phase('⚙️ Préparation du ' + (C.KINDS[extOf(it.name)] || 'fichier').toLowerCase() + '…'); return makeFile(it); });
  const doImage = (m, k, it, ctx) => run(m, k, ctx, async (phase) => {
    phase('Le générateur dessine (10 à 40 s)…');
    const im = await makeImage(it.prompt, ctx);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const f = await N.files.save(`image-ivass-${stamp}.${/jpe?g/.test(im.mime) ? 'jpg' : /webp/.test(im.mime) ? 'webp' : 'png'}`, N.bytesOf(im.b64), im.mime);
    pics.set(f.name, `data:${im.mime};base64,${im.b64}`);
    return { name: f.name, where: f.where, size: f.size, mime: im.mime, kind: 'Image', provider: im.provider };
  });
  const ctrls = new Map();
  const doVideo = (m, k, it, ctx) => run(m, k, ctx, async (phase) => {
    const ac = new AbortController(); ctrls.set(m, ac);
    try { return await makeVideo(it.prompt, ctx, phase, ac.signal); } finally { ctrls.delete(m); }
  });

  /** Après une réponse : crée tout de suite les fichiers et les images demandés. */
  async function afterFinish(m, ctx) {
    ctxRef = ctx;
    if (!m || m.error || !m.content) return;
    const items = C.extract(m.content);
    if (!items.length) return;
    m.liv = m.liv || [];
    const jobs = items.map((it, k) => (m.liv[k] || !it.closed ? null : it.type === 'file' ? doFile(m, k, it, ctx) : it.type === 'image' ? doImage(m, k, it, ctx) : null)).filter(Boolean);
    if (!jobs.length) return;
    const res = await Promise.all(jobs);
    const ok = res.filter((x) => x && !x.error && x.kind !== 'Image').length;
    if (ok) N.toast(N.isAndroid ? `📦 ${ok} fichier${ok > 1 ? 's' : ''} dans Téléchargements › Ivass AI` : `📦 ${ok} fichier${ok > 1 ? 's' : ''} prêt${ok > 1 ? 's' : ''}`);
  }

  async function onClick(e, m, ctx) {
    ctxRef = ctx;
    const b = e.target.closest('[data-lv]'); if (!b) return false;
    e.stopPropagation();
    const k = +b.dataset.k; const it = C.extract(m.content)[k]; if (!it) return true;
    const info = (m.liv || [])[k];
    const a = b.dataset.lv;
    try {
      if (a === 'view') { const pre = b.closest('.lvr-main').querySelector('.lvr-src'); pre.classList.toggle('hidden'); b.textContent = pre.classList.contains('hidden') ? 'Voir le contenu' : 'Masquer'; }
      else if (a === 'make') await doFile(m, k, it, ctx);
      else if (a === 'img') await doImage(m, k, it, ctx);
      else if (a === 'video') await doVideo(m, k, it, ctx);
      else if (a === 'stop') { const c = ctrls.get(m); if (c) c.abort(); }
      else if (a === 'copy') { N.copy(it.prompt); N.toast('Description copiée'); }
      else if (a === 'open' || a === 'save') {
        if (!info || info.error) return true;
        if (!(await N.files.exists(info.name))) {
          if (it.type !== 'file') { N.toast('Ce fichier n’est plus sur le téléphone.'); return true; }
          await doFile(m, k, it, ctx); // recréé à partir du contenu de la discussion
        }
        const cur = m.liv[k];
        if (a === 'open') { if (!(await N.files.open(cur.name, cur.mime))) N.toast('Ouverture impossible : utilisez « ' + saveLabel.replace(/^\S+\s/, '') + ' ».'); }
        else await N.files.share(cur.name, cur.mime);
      }
    } catch (x) { N.toast(String(x && x.message || x)); }
    return true;
  }
  /** iPhone : prépare les fichiers en mémoire pour que « Enregistrer » ouvre le partage sans attendre. */
  function warm(m) { for (const i of m.liv || []) if (i && i.name && !i.error) N.files.warm(i.name); }

  function init(ctx) { ctxRef = ctx; }
  window.IvassLivrables = { init, RULES, decorate, afterFinish, onClick, warm, makeImage, makeVideo, guard, lib };
})();
