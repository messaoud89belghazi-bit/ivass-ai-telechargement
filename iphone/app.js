/* Ivass AI Mobile — interface. Développé par Messaoud BELGHAZI. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const N = window.Native;

  // ---------------- Données ----------------
  const DEF = { providers: [], mode: 'normal', useLib: true, instructions: '', theme: 'light', bg: 'degrade', size: 'normal', cgu: 0, sync: { server: '', auto: true, last: 0 } };
  const S = {
    settings: Object.assign({}, DEF, N.read('settings.json') || {}),
    convs: N.read('convs.json') || { list: [], deleted: {} },
    lib: N.read('library.json') || { list: [], deleted: {} },
    cur: null, busy: null, config: {},
  };
  S.settings.sync = Object.assign({}, DEF.sync, S.settings.sync || {});
  const saveSettings = () => N.write('settings.json', S.settings);
  const saveConvs = () => N.write('convs.json', S.convs);
  const saveLib = () => N.write('library.json', S.lib);
  const getKey = (id) => N.secretGet('key:' + id) || '';
  const core = window.IvassCore({ http: N.http, Platforms: window.Platforms, getKey });
  const LV = window.IvassLivrables;
  const lvCtx = { providers: () => S.settings.providers, getKey, save: () => saveConvs(), redraw: () => renderChat(true) };
  if (LV) LV.init(lvCtx);
  const mdMsg = (m, streaming, redraw) => { const h = md(m.content); if (!LV) return h; try { return LV.decorate(h, m, streaming, redraw || lvCtx.redraw); } catch (_) { return h; } };
  const contrib = window.IvassContrib.Contrib({
    load: () => N.read('contrib.json'), save: (st) => N.write('contrib.json', st),
    dist: () => ({ serverUrl: S.config.contribServer || '', publicKey: S.config.contribKey || '' }),
    http: N.http, version: N.version(),
  });
  let flushT = null;
  const flushSoon = (ms = 60000) => { clearTimeout(flushT); flushT = setTimeout(() => contrib.flush().catch(() => {}), ms); };

  // ---------------- 🎨 Apparence : thèmes, arrière-plans, taille du texte ----------------
  const THEMES = {"dark": {"nom": "Onyx", "ton": "dark", "bg": "#08090b", "panel": "#14161b", "accent": "#d9dde4", "text": "#eceef2"}, "ardoise": {"nom": "Ardoise", "ton": "dark", "bg": "#262a31", "panel": "#323741", "accent": "#e6e9ee", "text": "#f3f4f6"}, "ocean": {"nom": "Océan", "ton": "dark", "bg": "#0d1b2a", "panel": "#152b45", "accent": "#a8d8ff", "text": "#eaf2fb"}, "foret": {"nom": "Forêt", "ton": "dark", "bg": "#0f1d17", "panel": "#182e24", "accent": "#a9e6c5", "text": "#eaf5ef"}, "light": {"nom": "Clair", "ton": "light", "bg": "#f4f5f7", "panel": "#ffffff", "accent": "#2a2e36", "text": "#15171c"}, "perle": {"nom": "Perle", "ton": "light", "bg": "#f6f1e9", "panel": "#fffdf8", "accent": "#7d5f2a", "text": "#2b241a"}, "ciel": {"nom": "Ciel", "ton": "light", "bg": "#edf4fb", "panel": "#ffffff", "accent": "#1d5c94", "text": "#0f2133"}, "lavande": {"nom": "Lavande", "ton": "light", "bg": "#f3f0fa", "panel": "#ffffff", "accent": "#5640aa", "text": "#221b33"}, "corail": {"nom": "Corail", "ton": "light", "bg": "#fdf2ee", "panel": "#ffffff", "accent": "#ad4430", "text": "#2e1b16"}};
  const BGS = { uni: 'Uni', degrade: 'Dégradé', aurore: 'Aurore', points: 'Points', lignes: 'Lignes', embleme: 'Emblème' };
  const SIZES = { petit: 'A−', normal: 'A', grand: 'A+', 'tres-grand': 'A++' };
  const darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyLook() {
    const st = S.settings;
    let id = st.theme || 'light';
    if (id === 'auto') id = darkMQ && darkMQ.matches ? 'dark' : 'light';
    if (!THEMES[id]) id = 'dark';
    const h = document.documentElement;
    h.dataset.theme = id; h.dataset.tone = THEMES[id].ton; h.dataset.bg = st.bg || 'degrade'; h.dataset.size = st.size || 'normal';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = THEMES[id].bg;
    try { N.setBars && N.setBars(THEMES[id].bg, THEMES[id].ton === 'light'); } catch (_) { /* aperçu */ }
  }
  if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', () => { if (S.settings.theme === 'auto') applyLook(); });
  function lookHTML() {
    const cur = S.settings.theme || 'light';
    const sw = (id, nom, t) => `<button class="swatch ${cur === id ? 'on' : ''}" data-look="${id}"><span class="dot" style="background:${t.bg}"><b style="background:${t.text}"></b><i style="background:${t.accent}"></i></span>${esc(nom)}</button>`;
    return `<div class="swatches">${sw('auto', 'Auto', { bg: 'linear-gradient(135deg,#f4f5f7 50%,#08090b 50%)', text: '#888', accent: '#888' })}${Object.entries(THEMES).map(([id, t]) => sw(id, t.nom, t)).join('')}</div>
      <p class="help" style="margin:12px 0 6px">Arrière-plan</p>
      <div class="bgs">${Object.entries(BGS).map(([id, n]) => `<button class="btn sm ${(S.settings.bg || 'degrade') === id ? 'on' : ''}" data-bgk="${id}">${n}</button>`).join('')}</div>
      <p class="help" style="margin:12px 0 6px">Taille du texte</p>
      <div class="bgs">${Object.entries(SIZES).map(([id, n]) => `<button class="btn sm ${(S.settings.size || 'normal') === id ? 'on' : ''}" data-size="${id}">${n}</button>`).join('')}</div>`;
  }
  function bindLook(root, redraw) {
    root.querySelectorAll('[data-look]').forEach((b) => { b.onclick = () => { S.settings.theme = b.dataset.look; saveSettings(); applyLook(); redraw(); }; });
    root.querySelectorAll('[data-bgk]').forEach((b) => { b.onclick = () => { S.settings.bg = b.dataset.bgk; saveSettings(); applyLook(); redraw(); }; });
    root.querySelectorAll('button[data-size]').forEach((b) => { b.onclick = () => { S.settings.size = b.dataset.size; saveSettings(); applyLook(); redraw(); }; });
  }
  applyLook();

  // ---------------- Utilitaires d'interface ----------------
  function sheet(html, onMount) {
    $('#sheetIn').innerHTML = html;
    $('#sheet').classList.remove('hidden');
    onMount && onMount($('#sheetIn'));
  }
  const closeSheet = () => $('#sheet').classList.add('hidden');
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  function confirmBox(text, okLabel = 'Confirmer', danger = false) {
    return new Promise((res) => {
      sheet(`<h3>${esc(text)}</h3><div class="sheet-actions"><button class="btn" data-a="no">Annuler</button><button class="btn ${danger ? 'danger' : 'primary'}" data-a="ok">${esc(okLabel)}</button></div>`, (r) => {
        r.onclick = (e) => { const a = e.target.dataset.a; if (!a) return; closeSheet(); res(a === 'ok'); };
      });
    });
  }
  const md = (t) => window.renderMarkdown(t || '', { noRun: true });

  // Liens externes → navigateur ; boutons « Copier » des blocs de code
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a) {
      const h = a.getAttribute('href');
      if (/^https:\/\//.test(h)) { e.preventDefault(); N.openUrl(h); }
      else if (h === '#') e.preventDefault();
      return;
    }
    const cc = e.target.closest('.copy-code');
    if (cc) { N.copy(cc.closest('.code').querySelector('code').textContent); cc.textContent = 'Copié ✓'; setTimeout(() => { cc.textContent = 'Copier'; }, 1400); }
  });

  // ---------------- Accueil / CGU ----------------
  const CGU_VERSION = 1;
  async function showLegal() {
    const get = async (f) => { try { return await (await fetch('legal/' + f)).text(); } catch (_) { return ''; } };
    openPanel('Conditions et confidentialité', `<div class="card bubble">${md(await get('CGU.md'))}</div><div class="card bubble">${md(await get('MOBILE.md'))}</div><div class="card bubble">${md(await get('CONFIDENTIALITE.md'))}</div>`);
  }
  if (S.settings.cgu < CGU_VERSION) {
    $('#welcome').classList.remove('hidden');
    $('#cguOk').onchange = (e) => { $('#startBtn').disabled = !e.target.checked; };
    $('#cguLink').onclick = (e) => { e.preventDefault(); showLegal(); };
    $('#startBtn').onclick = () => {
      S.settings.cgu = CGU_VERSION; saveSettings();
      $('#welcome').classList.add('hidden'); $('#app').classList.remove('hidden');
      askContrib(() => { if (!S.settings.providers.length) openSettings(true); });
    };
  } else { $('#app').classList.remove('hidden'); if (!contrib.asked()) setTimeout(() => askContrib(), 1200); else if (!S.settings.lookAsked) setTimeout(() => askLook(), 900); }

  // ---------------- 🤝 Programme d'amélioration (facultatif) ----------------
  function contribChecks(prefix) {
    const ch = contrib.choices();
    return Object.entries(contrib.CATEGORIES).map(([k, c]) => `<label class="check" style="margin:8px 0"><input type="checkbox" data-${prefix}="${k}" ${ch[k] ? 'checked' : ''}><span><b>${esc(c.label)}</b><br><span class="muted" style="font-size:13.5px">${esc(c.desc)}</span></span></label>`).join('');
  }
  const readChecks = (root, prefix) => Object.fromEntries($$(`[data-${prefix}]`, root).map((i) => [i.dataset[prefix], i.checked]));
  function askLook(after) {
    S.settings.lookAsked = 1; saveSettings();
    const draw = () => { $('#sheetIn').querySelector('#lookSheet').innerHTML = lookHTML(); bindLook($('#lookSheet'), draw); };
    sheet(`<h3>🎨 Nouveau : choisissez votre style</h3><p class="help">Des thèmes clairs et colorés, et des arrière-plans au choix. Vous pourrez changer à tout moment dans ⚙️ Réglages → Apparence.</p><div id="lookSheet"></div>
      <div class="sheet-actions"><button class="btn primary" id="lookOk">C’est parfait</button></div>`, (r) => { draw(); $('#lookOk', r).onclick = () => { closeSheet(); after && after(); }; });
  }
  function askContrib(after) {
    sheet(`<h3>🤝 Aidez à améliorer Ivass AI</h3>
      <p class="help">Ivass AI apprend de ses utilisateurs. Si vous le souhaitez, ce téléphone peut envoyer à son créateur, <b>de façon anonyme et chiffrée</b>, de quoi rendre Ivass plus juste. C’est <b>facultatif</b> : l’application marche exactement pareil sans.</p>
      ${contribChecks('ct')}
      <p class="help">Avant tout envoi, tout est nettoyé sur le téléphone : clés, e-mails, numéros, IBAN, cartes. Les paquets sont chiffrés pour le seul créateur d’Ivass AI. Vous pouvez changer d’avis et tout faire effacer à tout moment dans ⚙️ Réglages.</p>
      <div class="sheet-actions"><button class="btn" id="ctNo">Non merci</button><button class="btn primary" id="ctYes">Valider mes choix</button></div>`, (r) => {
      const next = () => { closeSheet(); if (!S.settings.lookAsked) setTimeout(() => askLook(after), 250); else after && after(); };
      $('#ctYes', r).onclick = () => { contrib.setConsent(readChecks(r, 'ct')); if (contrib.anyOn()) N.toast('Merci ! 🤝'); next(); };
      $('#ctNo', r).onclick = () => { contrib.setConsent({}); next(); };
    });
  }

  // ---------------- Discussions ----------------
  const conv = (id) => S.convs.list.find((c) => c.id === id);
  function newConv() { S.cur = null; renderChat(); closeDrawer(); $('#input').focus(); }
  function openConv(id) { S.cur = id; renderChat(); closeDrawer(); }

  function renderChat(keepScroll) {
    const c = conv(S.cur);
    const box = $('#messages');
    if (keepScroll === true && S.busy) return; // une réponse s'affiche : on redessinera à la fin
    const top = box.scrollTop;
    box.innerHTML = '';
    $('#convTitle').textContent = c ? c.title : 'Nouvelle discussion';
    $('#convSub').textContent = activeLabel();
    $('#empty').classList.toggle('hidden', !!(c && c.messages.length));
    if (c) c.messages.forEach((m, i) => { const el = msgEl(m, i, c); el.classList.add('still'); box.appendChild(el); });
    box.scrollTop = keepScroll === true ? top : box.scrollHeight;
    renderConvList();
  }
  function activeLabel() {
    if (S.settings.mode === 'pc') return '🖥️ Mon PC — Ivass AI répond depuis votre ordinateur';
    const p = [...S.settings.providers].filter((x) => x.enabled !== false).sort((a, b) => (a.priority || 5) - (b.priority || 5))[0];
    return p ? `${p.name} · ${p.model}` : 'Aucune IA — ajoutez une clé dans Réglages';
  }
  function msgEl(m, i, c) {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');
    if (m.role === 'user') d.innerHTML = `<div class="bubble">${esc(m.content)}</div>`;
    else {
      d.innerHTML = `<div class="who"><img src="icon.png" alt="">Ivass AI</div>` +
        (m.notice ? `<div class="notice">${esc(m.notice)}</div>` : '') +
        `<div class="bubble">${m.setup ? setupHTML() : m.error ? `<div class="err">${esc(m.error)}</div>` : mdMsg(m, false)}</div>` +
        `<div class="meta"><span>${esc(m.model || '')}</span>${m.content && !m.setup ? `<button data-act="up" style="${m.vote === 1 ? 'opacity:1;color:var(--ok)' : ''}">👍</button><button data-act="down" style="${m.vote === -1 ? 'opacity:1;color:var(--danger)' : ''}">👎</button>` : ''}<button data-act="copy">📋</button><button data-act="share">↗</button><button data-act="save" title="Garder dans la bibliothèque">📚</button>` +
        (c && i === c.messages.length - 1 ? `<button data-act="regen" title="Régénérer">↻</button>` : '') + `</div>`;
      if (LV && m.liv) LV.warm(m);
      if (LV) d.querySelector('.bubble').addEventListener('click', (e) => { if (e.target.closest('[data-lv]')) LV.onClick(e, m, lvCtx); });
      if (m.setup) d.querySelector('.bubble').onclick = (e) => {
        const a = e.target.dataset.go; if (!a) return;
        if (a === 'settings') openSettings(true);
        if (a === 'sync') openSync();
        if (a === 'pc') { S.settings.mode = 'pc'; saveSettings(); paintModes(); regenerate(); }
      };
      d.querySelector('.meta').onclick = (e) => {
        const act = e.target.dataset.act; if (!act) return;
        if (act === 'up' || act === 'down') {
          const v = act === 'up' ? 1 : -1;
          m.vote = m.vote === v ? 0 : v; saveConvs(); renderChat();
          if (m.vote && contrib.record('avis', { vote: m.vote, provider: m.provider, model: m.model, mode: m.mode, ref: c.id + ':' + i })) flushSoon();
          if (m.vote === -1) N.toast('Noté. Touchez ↻ pour une autre réponse.');
        }
        if (act === 'copy') { N.copy(m.content); N.toast('Copié'); }
        if (act === 'share') N.share(m.content);
        if (act === 'save') editEntry({ title: core.titleOf(c.messages[i - 1] ? c.messages[i - 1].content : c.title), text: m.content, kind: 'note' });
        if (act === 'regen') regenerate();
      };
    }
    return d;
  }

  function renderConvList() {
    const q = $('#convSearch').value.trim().toLowerCase();
    const list = [...S.convs.list].sort((a, b) => b.updated - a.updated)
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => String(m.content).toLowerCase().includes(q)));
    const day = 864e5, now = Date.now();
    const group = (t) => (now - t < day ? 'Aujourd’hui' : now - t < 7 * day ? 'Cette semaine' : now - t < 30 * day ? 'Ce mois-ci' : 'Plus ancien');
    let html = '', g = '';
    for (const c of list) {
      const gg = group(c.updated);
      if (gg !== g) { html += `<div class="conv-group">${gg}</div>`; g = gg; }
      html += `<button class="conv ${c.id === S.cur ? 'on' : ''}" data-id="${esc(c.id)}"><span>${esc(c.title)}</span>${c.from === 'pc' ? '<small>💻</small>' : ''}</button>`;
    }
    $('#convList').innerHTML = html || '<p class="muted" style="padding:10px">Aucune discussion pour l’instant.</p>';
  }
  $('#convSearch').oninput = renderConvList;
  let pressT = null;
  $('#convList').addEventListener('click', (e) => { const b = e.target.closest('.conv'); if (b && !b.dataset.long) openConv(b.dataset.id); if (b) delete b.dataset.long; });
  $('#convList').addEventListener('contextmenu', (e) => { e.preventDefault(); const b = e.target.closest('.conv'); if (b) convMenu(b.dataset.id); });
  $('#convList').addEventListener('touchstart', (e) => { const b = e.target.closest('.conv'); if (!b) return; pressT = setTimeout(() => { b.dataset.long = '1'; convMenu(b.dataset.id); }, 550); }, { passive: true });
  ['touchend', 'touchmove'].forEach((ev) => $('#convList').addEventListener(ev, () => clearTimeout(pressT), { passive: true }));

  function convMenu(id) {
    const c = conv(id); if (!c) return;
    sheet(`<h3>${esc(c.title)}</h3><div class="sheet-list"><button data-a="ren">✏️ Renommer</button><button data-a="share">↗ Partager le texte</button><button data-a="del" class="ko">🗑️ Supprimer</button></div>`, (r) => {
      r.onclick = async (e) => {
        const a = e.target.dataset.a; if (!a) return;
        if (a === 'ren') {
          sheet(`<h3>Renommer</h3><input class="field" id="renF" value="${esc(c.title)}"><div class="sheet-actions"><button class="btn primary" id="renOk">OK</button></div>`, (r2) => {
            $('#renF', r2).focus();
            $('#renOk', r2).onclick = () => { c.title = $('#renF', r2).value.trim() || c.title; c.updated = Date.now(); saveConvs(); closeSheet(); renderChat(); autoSync(); };
          });
        }
        if (a === 'share') { closeSheet(); N.share(c.messages.map((m) => (m.role === 'user' ? '👤 ' : '🤖 ') + m.content).join('\n\n')); }
        if (a === 'del') { closeSheet(); if (await confirmBox('Supprimer cette discussion ?', 'Supprimer', true)) deleteConv(id); }
      };
    });
  }
  function deleteConv(id) {
    S.convs.list = S.convs.list.filter((c) => c.id !== id);
    S.convs.deleted['c:' + id] = Date.now();
    if (S.cur === id) S.cur = null;
    saveConvs(); renderChat(); autoSync();
  }

  // ---------------- Envoi ----------------
  const input = $('#input');
  const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 700) { e.preventDefault(); send(); } });
  $('#sendBtn').onclick = () => (S.busy ? S.busy.abort() : send());

  $$('#modes .mode[data-mode]').forEach((b) => { b.onclick = () => { S.settings.mode = b.dataset.mode; saveSettings(); paintModes(); if (!S.busy) $('#convSub').textContent = activeLabel(); }; });
  $('#libToggle').onclick = () => { S.settings.useLib = !S.settings.useLib; saveSettings(); paintModes(); };
  function paintModes() {
    $$('#modes .mode[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === S.settings.mode));
    $('#libToggle').classList.toggle('on', !!S.settings.useLib);
  }
  paintModes();

  const CHIPS = ['Crée-moi un CV en Word', 'Fais un tableau de budget Excel', 'Crée un logo pour mon entreprise', 'Rédige un e-mail professionnel', 'Explique-moi un sujet simplement', 'Fais un plan pour mon projet'];
  $('#chips').innerHTML = CHIPS.map((c) => `<button class="chip">${esc(c)}</button>`).join('');
  $('#chips').onclick = (e) => { if (e.target.classList.contains('chip')) { input.value = e.target.textContent + ' : '; grow(); input.focus(); } };

  async function send(textArg) {
    const text = (textArg != null ? textArg : input.value).trim();
    if (!text || S.busy) return;
    let c = conv(S.cur);
    if (!c) { c = { id: uid(), title: core.titleOf(text), created: Date.now(), updated: Date.now(), messages: [] }; S.convs.list.push(c); S.cur = c.id; }
    if (textArg == null) { input.value = ''; grow(); }
    c.messages.push({ role: 'user', content: text, ts: Date.now() });
    c.updated = Date.now(); saveConvs();
    renderChat();
    await answer(c);
  }
  function regenerate() {
    const c = conv(S.cur); if (!c || S.busy) return;
    if (c.messages.length && c.messages[c.messages.length - 1].role === 'assistant') c.messages.pop();
    renderChat(); answer(c);
  }

  function setupHTML() {
    const linked = !!(syncCode() && syncServer());
    return `<div class="card" style="margin:4px 0"><h3>👋 Il me faut une IA pour répondre</h3>
      <p class="help">Choisissez une des solutions (une seule suffit) :</p>
      <div style="display:grid;gap:8px">
        <button class="btn primary" data-go="settings">🔑 Ajouter une clé (Gemini ou Groq : gratuites)</button>
        <button class="btn" data-go="sync">📲 Recevoir les clés de mon PC</button>
        ${linked ? '<button class="btn" data-go="pc">🖥️ Faire répondre mon PC</button>' : ''}
      </div>
      <p class="help" style="margin-top:10px">Clé gratuite en 1 minute : ouvrez <a href="https://aistudio.google.com/app/apikey">aistudio.google.com</a> → « Create API key », copiez-la, puis collez-la dans 🔑 Réglages.</p></div>`;
  }
  async function answer(c) {
    const hasAI = S.settings.providers.some((p) => p.enabled !== false && p.model);
    if (!hasAI && S.settings.mode !== 'pc') {
      if (syncCode() && syncServer()) { S.settings.mode = 'pc'; saveSettings(); paintModes(); }
      else {
        c.messages.push({ role: 'assistant', content: '', setup: true, ts: Date.now() });
        c.updated = Date.now(); saveConvs(); renderChat();
        return;
      }
    }
    const box = $('#messages');
    const m = { role: 'assistant', content: '', ts: Date.now() };
    const el = document.createElement('div');
    el.className = 'msg ai';
    el.innerHTML = `<div class="who"><img src="icon.png" alt="">Ivass AI</div><div class="notice hidden"></div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
    box.appendChild(el); box.scrollTop = box.scrollHeight;
    const bubble = el.querySelector('.bubble'), notice = el.querySelector('.notice');
    const ctrl = new AbortController();
    const failures = [];
    S.busy = ctrl;
    $('#sendBtn').classList.add('stop'); $('#sendBtn').textContent = '■';

    let pending = false;
    const paint = () => {
      if (pending) return; pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
        bubble.innerHTML = mdMsg(m, true, () => {});
        if (atBottom) box.scrollTop = box.scrollHeight;
      });
    };
    const last = c.messages[c.messages.length - 1].content;
    let ctx = '';
    if (S.settings.useLib && S.lib.list.length) ctx = window.IvassLib.contextFor(S.lib.list, last).text;
    const mode = S.settings.mode;
    const opts = {
      providers: S.settings.providers,
      messages: c.messages.filter((x) => !x.setup).slice(-30).map((x) => ({ role: x.role, content: x.content })).filter((x) => x.content),
      system: core.systemPrompt({ extra: S.settings.instructions, context: ctx, mode }) + (LV ? '\n\n' + LV.RULES : ''),
      signal: ctrl.signal,
      onText: (t) => { m.content += t; paint(); },
      onStatus: (s) => {
        $('#convSub').textContent = `${s.provider} · ${s.model}`;
        if (s.failed) { failures.push({ provider: s.provider, model: s.model, message: s.failed });
          notice.classList.remove('hidden'); notice.textContent = `⚠ ${s.provider} indisponible — bascule automatique…`; }
      },
      onPhase: (p) => { $('#phase').classList.toggle('hidden', !p); $('#phase').textContent = p ? (mode === 'pc' ? '' : '🧠 ') + p : ''; },
    };
    try {
      let r = null;
      if (!navigator.onLine) throw Object.assign(new Error('Pas de connexion Internet.'), { offline: true });
      if (mode === 'pc') {
        try { r = await askPC(c, opts); } catch (e) {
          if (!e.pcOff || !S.settings.providers.length) throw e;
          notice.classList.remove('hidden'); notice.textContent = '🖥️ ' + e.message + ' → réponse par les IA du téléphone.';
          m.notice = '🖥️ PC indisponible → IA du téléphone';
        }
      }
      if (!r) r = mode === 'deep' ? await core.deep(opts) : await core.chat(opts);
      m.content = r.text; m.model = r.model; m.provider = r.provider;
      if (r.switches.length) m.notice = (m.notice ? m.notice + ' · ' : '') + `Bascule : ${r.switches.join(' → ')} → ${r.provider}`;
      if (r.incomplete) m.notice = (m.notice ? m.notice + ' · ' : '') + 'réponse incomplète';
    } catch (e) {
      const offline = e.offline || !navigator.onLine || /Réseau :|Unable to resolve|failed to connect|timeout|UnknownHost|Failed to fetch/i.test(e.message);
      if (m.content) m.notice = 'Interrompu : ' + e.message.split('\n')[0];
      else if (offline && !ctrl.signal.aborted) { m.content = offlineAnswer(last); m.notice = '📴 Hors connexion — réponse tirée de votre bibliothèque (sans IA)'; m.model = 'bibliothèque'; }
      else m.error = e.message;
    } finally {
      S.busy = null;
      $('#sendBtn').classList.remove('stop'); $('#sendBtn').textContent = '➤';
      $('#phase').classList.add('hidden');
    }
    m.mode = mode;
    c.messages.push(m);
    c.updated = Date.now(); saveConvs();
    renderChat();
    autoSync();
    if (LV && m.content && !m.error && !ctrl.signal.aborted) LV.afterFinish(m, lvCtx).catch(() => {});
    try {
      let rec = false;
      if (m.content && !m.error && m.model !== 'bibliothèque') rec = contrib.record('travaux', { question: last, answer: m.content, provider: m.provider, model: m.model, mode, ms: Date.now() - m.ts, ref: c.id }) || rec;
      for (const f of failures) rec = contrib.record('erreurs', { kind: 'bascule', message: f.message, provider: f.provider, model: f.model }) || rec;
      if (m.error) rec = contrib.record('erreurs', { kind: 'echec', message: m.error }) || rec;
      if (rec) flushSoon();
    } catch (_) { /* jamais bloquant */ }
  }

  // ---------------- Hors connexion : la bibliothèque répond ----------------
  function offlineAnswer(q) {
    const hits = S.lib.list.length ? window.IvassLib.search(S.lib.list, q, 3) : [];
    if (!hits.length) return '📴 **Pas de connexion Internet** et rien dans votre bibliothèque sur ce sujet.\n\nVotre question est gardée dans la discussion : touchez ↻ dès que le réseau revient.';
    return '📴 **Pas de connexion Internet.** Voici ce que dit votre bibliothèque :\n\n' +
      hits.map((h) => `### ${h.title}\n${h.text.length > 1200 ? h.text.slice(0, 1200) + '…' : h.text}`).join('\n\n') +
      '\n\n*Touchez ↻ quand le réseau revient pour une vraie réponse de l’IA.*';
  }

  // ---------------- 🖥️ Demander à Ivass AI sur le PC (boîte aux lettres chiffrée) ----------------
  const sleep = (ms, signal) => new Promise((res) => { const t = setTimeout(res, ms); if (signal) signal.addEventListener('abort', () => { clearTimeout(t); res(); }, { once: true }); });
  function mailbox() {
    if (!syncServer() || !syncCode()) throw Object.assign(new Error('Reliez d’abord le téléphone au PC (☰ → 📱 Synchronisation PC).'), { pcOff: true });
    return window.IvassSync.mailbox({ server: syncServer(), code: syncCode(), http: N.http });
  }
  async function pcPresence() {
    try { const p = await mailbox().read('r:presence'); return p && p.value; } catch (_) { return null; }
  }
  async function askPC(c, o) {
    const mb = mailbox();
    o.onPhase('Connexion à votre PC…');
    const pres = await pcPresence();
    if (!pres || Date.now() - pres.at > 3 * 60000) throw Object.assign(new Error('Ivass AI n’est pas ouvert sur le PC (ou la réponse au téléphone y est désactivée)'), { pcOff: true });
    const id = uid();
    await mb.write('q:' + id, { id, at: Date.now(), messages: o.messages, instructions: S.settings.instructions || '', useLib: !!S.settings.useLib });
    $('#convSub').textContent = '🖥️ ' + (pres.name || 'PC') + ' · ' + (pres.ai || 'IA du PC');
    const t0 = Date.now();
    while (Date.now() - t0 < 6 * 60000) {
      o.onPhase(`🖥️ Votre PC réfléchit… ${Math.round((Date.now() - t0) / 1000)} s`);
      await sleep(2500, o.signal);
      if (o.signal.aborted) { mb.remove('q:' + id).catch(() => {}); throw new Error('Arrêté.'); }
      let r = null; try { r = await mb.read('r:' + id); } catch (_) { /* réseau instable : on réessaie */ }
      if (r) {
        mb.remove('r:' + id).catch(() => {});
        o.onPhase('');
        if (r.value.error) throw new Error('PC : ' + r.value.error);
        o.onText(r.value.text);
        return { text: r.value.text, provider: '🖥️ PC · ' + (r.value.provider || ''), model: '🖥️ ' + (r.value.model || 'PC'), switches: [] };
      }
    }
    mb.remove('q:' + id).catch(() => {});
    throw Object.assign(new Error('Le PC n’a pas répondu à temps'), { pcOff: true });
  }
  /** Clés partagées par le PC (k:cles) : remplacent les clés « du PC » déjà importées ; celles ajoutées ici restent. */
  async function syncPcKeys(manual) {
    const r = await mailbox().read('k:cles');
    if (!r || !r.value) { if (manual) N.toast('Le PC ne partage pas encore ses clés (⚙ → 📱 Téléphone sur le PC).'); return 0; }
    const v = r.value;
    if (v.hash && v.hash === S.settings.pcKeysHash) { if (manual) N.toast('Les clés du PC sont déjà à jour ✓'); return 0; }
    const old = S.settings.providers.filter((p) => p.fromPC);
    old.forEach((p) => N.secretSet('key:' + p.id, ''));
    S.settings.providers = S.settings.providers.filter((p) => !p.fromPC);
    let added = 0;
    if (!v.revoked) for (const k of v.keys || []) {
      if (!k.key || !k.model || !['anthropic', 'gemini', 'openai'].includes(k.type) || !/^https:\/\//.test(k.baseUrl || '')) continue;
      const p = { id: 'pc-' + (k.platform || 'ia') + '-' + uid(), platform: k.platform || 'custom', name: k.name + ' 🖥️', type: k.type, baseUrl: k.baseUrl, model: k.model, models: (k.models || [k.model]).slice(0, 40), priority: k.priority ?? 5, enabled: true, fromPC: true };
      if (N.secretSet('key:' + p.id, k.key)) { S.settings.providers.push(p); added++; }
    }
    S.settings.pcKeysHash = v.hash || '';
    saveSettings();
    if (S.settings.mode === 'pc' && added && !S.busy) { /* garde le mode choisi */ }
    N.toast(v.revoked ? '🖥️ Le PC a retiré ses clés de ce téléphone' : `🖥️ ${added} clé(s) API du PC prêtes à l’emploi`);
    if (!S.busy) $('#convSub').textContent = activeLabel();
    return added;
  }
  async function receiveKeys() {
    const mb = mailbox();
    const r = await mb.read('k:transfert');
    if (!r) return N.toast('Aucune clé en attente. Sur le PC : ⚙️ → 📱 Téléphone → « Envoyer mes clés au téléphone ».');
    await mb.remove('k:transfert').catch(() => {});
    if (!r.value || !(r.value.expires > Date.now())) return N.toast('Envoi expiré : recommencez depuis le PC.');
    const P = S.settings.providers;
    let added = 0, skipped = 0;
    for (const k of r.value.keys || []) {
      if (!k.key || !['anthropic', 'gemini', 'openai'].includes(k.type) || !/^https:\/\//.test(k.baseUrl || '')) { skipped++; continue; }
      if (P.some((p) => p.baseUrl === k.baseUrl && getKey(p.id) === k.key)) { skipped++; continue; }
      const p = { id: (k.platform || 'pc') + '-' + uid(), platform: k.platform || 'custom', name: k.name, type: k.type, baseUrl: k.baseUrl, model: k.model, models: (k.models || [k.model]).slice(0, 40), priority: k.priority || 5, enabled: true };
      if (!p.model) { skipped++; continue; }
      if (N.secretSet('key:' + p.id, k.key)) { P.push(p); added++; }
    }
    saveSettings();
    N.toast(`📲 ${added} clé(s) importée(s)` + (skipped ? ` · ${skipped} ignorée(s) (déjà là ou IA locale du PC)` : ''));
    renderChat();
  }

  // ---------------- Tiroir ----------------
  const openDrawer = () => { $('#drawer').classList.add('open'); $('#scrim').classList.remove('hidden'); renderConvList(); };
  const closeDrawer = () => { $('#drawer').classList.remove('open'); $('#scrim').classList.add('hidden'); };
  $('#menuBtn').onclick = openDrawer;
  $('#scrim').onclick = closeDrawer;
  $('#newBtn').onclick = newConv;
  $$('.drawer-nav button').forEach((b) => { b.onclick = () => { closeDrawer(); ({ library: openLibrary, settings: () => openSettings(), sync: openSync, share: openShare })[b.dataset.open](); }; });

  // ---------------- Panneaux ----------------
  let panelRefresh = null;
  function openPanel(title, html, mount) {
    $('#panelTitle').textContent = title;
    $('#panelBody').innerHTML = html;
    $('#panel').classList.remove('hidden');
    mount && mount($('#panelBody'));
  }
  const closePanel = () => { $('#panel').classList.add('hidden'); panelRefresh = null; renderChat(); };
  $('#panelBack').onclick = closePanel;

  // ----- Réglages -----
  function openSettings(first) {
    const P = S.settings.providers;
    const provHtml = [...P].sort((a, b) => (a.priority || 5) - (b.priority || 5)).map((p) => `
      <div class="prov" data-id="${esc(p.id)}">
        <label class="switch"><input type="checkbox" data-a="on" ${p.enabled !== false ? 'checked' : ''}><span></span></label>
        <div class="nm"><b>${esc(p.name)}</b><small>${p.fromPC ? 'clé partagée par votre PC · ' : ''}${esc(p.baseUrl)}</small>
          <select data-a="model">${(p.models || [p.model]).map((m) => `<option ${m === p.model ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></div>
        <button class="btn sm" data-a="up" title="Priorité">↑</button><button class="btn sm danger" data-a="del">✕</button>
      </div>`).join('');
    openPanel('Réglages', `
      ${first ? '<div class="card"><h3>👋 Bienvenue !</h3><p class="help">Pour commencer, collez une clé API. Ivass AI reconnaît la plateforme toute seule. Des clés <b>gratuites</b> existent : Google Gemini (aistudio.google.com), Groq (console.groq.com), OpenRouter (modèles « :free »), Mistral, Cerebras.</p></div>' : ''}
      <div class="card"><h3>🔑 Ajouter une clé API</h3>
        <p class="help">Claude, Gemini, ChatGPT, Groq, Mistral, OpenRouter, DeepSeek, xAI, Perplexity, Hugging Face, Cerebras… Les clés restent chiffrées sur ce téléphone et ne sont jamais synchronisées (vous pouvez aussi les recevoir du PC : ☰ → 📱 Synchronisation PC).</p>
        <div class="row"><input class="field" id="keyF" placeholder="Collez votre clé ici" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn primary" id="keyAdd">Ajouter</button></div>
        <div id="keyMsg" class="help"></div>
        <div class="row" style="margin-top:6px">${[['Gemini (gratuit)', 'https://aistudio.google.com/app/apikey'], ['Groq (gratuit)', 'https://console.groq.com/keys'], ['OpenRouter', 'https://openrouter.ai/keys'], ['Claude', 'https://console.anthropic.com/settings/keys']].map(([n, u]) => `<a class="tag" href="${u}">${n} ↗</a>`).join('')}</div>
      </div>
      <div class="card"><h3>🤖 Mes IA <span class="muted" style="font-weight:400;font-size:13px">— la première active répond ; les autres prennent le relais en cas de panne</span></h3>
        ${provHtml || '<p class="help">Aucune pour l’instant.</p>'}
        <details style="margin-top:10px"><summary class="muted">➕ Fournisseur personnalisé (compatible OpenAI)</summary>
          <div style="display:grid;gap:8px;margin-top:10px"><input class="field" id="cuName" placeholder="Nom (ex. Mon serveur)"><input class="field" id="cuUrl" placeholder="https://…/v1"><input class="field" id="cuKey" placeholder="Clé (facultatif)"><input class="field" id="cuModel" placeholder="Modèle (ex. llama-3.3-70b)"><button class="btn" id="cuAdd">Ajouter</button></div>
        </details>
      </div>
      <div class="card"><h3>🧭 Mes consignes</h3><p class="help">Ce que l’IA doit toujours savoir ou respecter (ton, métier, format…).</p>
        <textarea class="field" id="instrF" placeholder="Ex. : Je suis technicien chauffagiste. Réponds court, avec des étapes numérotées.">${esc(S.settings.instructions)}</textarea></div>
      <div class="card"><h3>🤝 Améliorer Ivass AI <span class="muted" style="font-weight:400;font-size:13px">— facultatif</span></h3>
        <p class="help">Envois anonymes, nettoyés et chiffrés pour le seul créateur d’Ivass AI.</p>
        ${contribChecks('cs')}
        <p class="help" id="ctState"></p>
        <div class="row"><button class="btn sm danger" id="ctForget">Effacer mes envois</button></div></div>
      <div class="card"><h3>💬 Vos retours</h3><p class="help">Une idée, un problème ? Votre message part directement au créateur d’Ivass AI, nettoyé et chiffré (même si les envois automatiques sont désactivés).</p>
        <div class="row"><button class="btn sm" data-fb="idee">💡 Proposer une idée</button><button class="btn sm" data-fb="bug">🐞 Signaler un problème</button></div></div>
      <div class="card"><h3>🎨 Apparence</h3><div id="lookBox"></div></div>
      <div class="card"><h3>💾 Mes données</h3><div class="row"><button class="btn sm" id="exportBtn">Exporter (JSON)</button><button class="btn sm danger" id="wipeLocal">Tout effacer sur ce téléphone</button></div></div>
      <div class="card"><h3>ℹ️ À propos</h3><p class="help">Ivass AI Mobile ${esc(N.version())} — développé par Messaoud BELGHAZI.</p><div class="row"><button class="btn sm" id="updCheck">✨ Rechercher une mise à jour</button><button class="btn sm" id="legalBtn">Conditions et confidentialité</button></div></div>`, (r) => {
      $('#keyAdd', r).onclick = async () => {
        const raw = $('#keyF', r).value; const msg = $('#keyMsg', r);
        msg.className = 'help'; msg.textContent = 'Vérification de la clé…'; $('#keyAdd', r).disabled = true;
        try {
          const { provider, key } = await core.addKey(raw, P);
          if (!N.secretSet('key:' + provider.id, key)) throw new Error('Impossible d’enregistrer la clé.');
          P.push(provider); saveSettings();
          N.toast(`${provider.name} ajouté ✓`); openSettings();
        } catch (e) { msg.className = 'help ko'; msg.textContent = e.message; $('#keyAdd', r).disabled = false; }
      };
      $('#cuAdd', r).onclick = () => {
        const url = $('#cuUrl', r).value.trim().replace(/\/+$/, ''), model = $('#cuModel', r).value.trim();
        if (!/^https:\/\//.test(url) || !model) return N.toast('Adresse https et modèle obligatoires');
        const p = { id: 'custom-' + uid(), platform: 'custom', name: $('#cuName', r).value.trim() || 'Personnalisé', type: 'openai', baseUrl: url, model, models: [model], priority: 6, enabled: true };
        const k = $('#cuKey', r).value.trim(); if (k) N.secretSet('key:' + p.id, k);
        P.push(p); saveSettings(); openSettings();
      };
      $$('.prov', r).forEach((row) => {
        const p = P.find((x) => x.id === row.dataset.id);
        row.onchange = (e) => {
          if (e.target.dataset.a === 'on') p.enabled = e.target.checked;
          if (e.target.dataset.a === 'model') p.model = e.target.value;
          saveSettings();
        };
        row.onclick = async (e) => {
          const a = e.target.dataset.a;
          if (a === 'up') { const min = Math.min(...P.map((x) => x.priority || 5)); p.priority = min - 1; saveSettings(); openSettings(); }
          if (a === 'del' && await confirmBox(`Retirer ${p.name} ?`, 'Retirer', true)) { N.secretSet('key:' + p.id, ''); S.settings.providers = P.filter((x) => x !== p); saveSettings(); openSettings(); }
        };
      });
      $('#instrF', r).onchange = (e) => { S.settings.instructions = e.target.value.slice(0, 4000); saveSettings(); };
      const drawLook = () => { $('#lookBox', r).innerHTML = lookHTML(); bindLook($('#lookBox', r), drawLook); };
      drawLook();
      $('#exportBtn', r).onclick = () => N.share(JSON.stringify({ format: 'ivass-mobile-export-1', conversations: S.convs.list, bibliotheque: S.lib.list }, null, 1));
      $('#wipeLocal', r).onclick = async () => {
        if (!await confirmBox('Effacer toutes les discussions et la bibliothèque de ce téléphone ?', 'Tout effacer', true)) return;
        const t = Date.now();
        S.convs.list.forEach((c) => { S.convs.deleted['c:' + c.id] = t; }); S.lib.list.forEach((x) => { S.lib.deleted['l:' + x.id] = t; });
        S.convs.list = []; S.lib.list = []; S.cur = null; saveConvs(); saveLib(); N.toast('Effacé'); openSettings();
      };
      $('#legalBtn', r).onclick = showLegal;
      $('#updCheck', r).onclick = async () => { const v = await checkUpdate(true); if (v) { closePanel(); showUpdate(); } };
      const ctState = () => { const st = contrib.state(); $('#ctState', r).textContent = !contrib.anyOn() ? 'Désactivé.' : `${st.sent || 0} élément(s) envoyé(s) · ${st.queue.length} en attente${st.lastError ? ' · ' + st.lastError : ''}${S.config.contribServer ? '' : ' · serveur pas encore configuré (les envois attendent)'}`; };
      ctState();
      $$('[data-cs]', r).forEach((i) => { i.onchange = () => { contrib.setConsent(readChecks(r, 'cs')); ctState(); }; });
      $$('[data-fb]', r).forEach((b) => { b.onclick = () => feedback(b.dataset.fb); });
      $('#ctForget', r).onclick = async () => {
        if (!await confirmBox('Effacer du serveur tout ce que ce téléphone a envoyé, et arrêter les envois ?', 'Effacer', true)) return;
        try { const x = await contrib.forget(); N.toast(`Effacé (${x.deleted} paquet(s))`); openSettings(); } catch (e) { N.toast(e.message); }
      };
    });
  }

  // ----- Bibliothèque -----
  function openLibrary() {
    const draw = (r) => {
      const q = $('#libQ', r).value.trim();
      let items;
      if (q) { const hits = window.IvassLib.search(S.lib.list, q, 30); const ids = [...new Set(hits.map((h) => h.id))]; items = ids.map((id) => S.lib.list.find((x) => x.id === id)).filter(Boolean); }
      else items = [...S.lib.list].sort((a, b) => b.updated - a.updated);
      $('#libList', r).innerHTML = items.map((x) => `<div class="lib-item" data-id="${esc(x.id)}"><b>${esc(x.title)}</b><span class="tag">${esc(window.IvassLib.KINDS[x.kind] || x.kind)}</span>${x.from === 'pc' ? '<span class="tag">💻 PC</span>' : ''}<p>${esc(String(x.text).slice(0, 220))}</p></div>`).join('') ||
        '<p class="help">Rien ici pour l’instant. Ajoutez des notes, méthodes ou compétences : l’IA s’en servira comme mémoire quand « 📚 Mémoire » est activé. Les fiches créées sur le PC arrivent avec la synchronisation.</p>';
    };
    openPanel('Bibliothèque', `<div class="row" style="margin-bottom:12px"><input class="field search" id="libQ" type="search" placeholder="Rechercher…"><button class="btn primary" id="libNew">＋ Fiche</button></div><div class="card" id="libList"></div>`, (r) => {
      $('#libQ', r).oninput = () => draw(r);
      $('#libNew', r).onclick = () => editEntry({ kind: 'note' });
      $('#libList', r).onclick = (e) => { const it = e.target.closest('.lib-item'); if (it) editEntry(S.lib.list.find((x) => x.id === it.dataset.id)); };
      draw(r);
      panelRefresh = () => draw(r);
    });
  }
  function editEntry(x) {
    const isNew = !x.id;
    sheet(`<h3>${isNew ? 'Nouvelle fiche' : 'Fiche'}</h3>
      <div style="display:grid;gap:8px"><input class="field" id="enT" placeholder="Titre" value="${esc(x.title || '')}">
      <select class="field" id="enK">${Object.entries(window.IvassLib.KINDS).map(([k, v]) => `<option value="${k}" ${k === (x.kind || 'note') ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <textarea class="field" id="enX" style="min-height:200px" placeholder="Contenu">${esc(x.text || '')}</textarea></div>
      <div class="sheet-actions">${isNew ? '' : '<button class="btn danger" id="enDel">Supprimer</button>'}<button class="btn primary" id="enOk">Enregistrer</button></div>`, (r) => {
      $('#enOk', r).onclick = () => {
        const title = $('#enT', r).value.trim(), text = $('#enX', r).value.trim();
        if (!title || !text) return N.toast('Titre et contenu obligatoires');
        if (isNew) { x = { id: uid(), created: Date.now() }; S.lib.list.push(x); }
        Object.assign(x, { title, text, kind: $('#enK', r).value, updated: Date.now() });
        saveLib(); closeSheet(); N.toast('Fiche enregistrée'); panelRefresh && panelRefresh(); autoSync();
      };
      if (!isNew) $('#enDel', r).onclick = async () => {
        if (!await confirmBox('Supprimer cette fiche ?', 'Supprimer', true)) return;
        S.lib.list = S.lib.list.filter((y) => y.id !== x.id); S.lib.deleted['l:' + x.id] = Date.now(); saveLib(); panelRefresh && panelRefresh(); autoSync();
      };
    });
  }

  // ---------------- Synchronisation avec le PC ----------------
  const syncServer = () => S.settings.sync.server || S.config.syncServer || '';
  const syncCode = () => N.secretGet('sync-code') || '';
  function localItems() {
    const items = new Map();
    for (const c of S.convs.list) items.set('c:' + c.id, { updated: c.updated, value: { id: c.id, title: c.title, created: c.created, updated: c.updated, messages: c.messages.map((m) => ({ role: m.role, content: m.content || '', ts: m.ts, model: m.model, provider: m.provider })) , from: c.from || 'mobile' } });
    for (const x of S.lib.list) items.set('l:' + x.id, { updated: x.updated, value: { id: x.id, title: x.title, text: x.text, kind: x.kind, tags: x.tags || [], created: x.created, updated: x.updated, from: x.from || 'mobile' } });
    return { items, deleted: { ...S.convs.deleted, ...S.lib.deleted } };
  }
  function applyRemote(name, value, updated) {
    const id = name.slice(2);
    const store = name[0] === 'c' ? S.convs : S.lib;
    store.list = store.list.filter((x) => x.id !== id);
    if (value) { value.updated = updated; store.list.push(value); delete store.deleted[name]; }
    else { store.deleted[name] = updated; if (S.cur === id) S.cur = null; }
  }
  let syncing = null;
  async function syncNow(manual) {
    if (syncing) return syncing;
    const server = syncServer(), code = syncCode();
    if (!server || !code) { if (manual) N.toast('Choisissez d’abord un code de synchronisation'); return null; }
    $('#syncBadge').classList.remove('hidden');
    syncing = (async () => {
      try {
        const r = await window.IvassSync.run({ server, code, http: N.http, local: localItems(), apply: applyRemote, onStep: (t) => { const el = $('#syncStep'); if (el) el.textContent = t; } });
        S.settings.sync.last = Date.now(); S.settings.sync.error = '';
        saveSettings();
        if (r.pulled || r.removed) { saveConvs(); saveLib(); renderChat(); panelRefresh && panelRefresh(); }
        if (manual) N.toast(`Synchronisé ✓  ↓${r.pulled + r.removed}  ↑${r.pushed}`);
        try { await syncPcKeys(false); } catch (_) { /* pas grave : on réessaiera */ }
        return r;
      } catch (e) {
        S.settings.sync.error = e.message; saveSettings();
        if (manual) N.toast(e.message);
        return null;
      } finally { syncing = null; $('#syncBadge').classList.add('hidden'); panelRefresh && panelRefresh(); }
    })();
    return syncing;
  }
  let syncTimer = null;
  function autoSync() { if (!S.settings.sync.auto || !syncCode()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(false), 2500); }

  function openSync() {
    const draw = (r) => {
      const code = syncCode(), sy = S.settings.sync;
      $('#syBody', r).innerHTML = `
        <div class="card"><h3>📱↔💻 Relier ce téléphone à Ivass AI sur PC</h3>
          <p class="help">Vos discussions et votre bibliothèque passent d’un appareil à l’autre, <b>chiffrées avant l’envoi</b>. Le serveur ne peut rien lire. Vos clés API ne partent jamais d’elles-mêmes, et le téléphone ne peut lancer aucune commande sur le PC.</p>
          <ol class="help" style="padding-left:18px"><li>Ici, touchez « Créer un code » (ou entrez celui du PC).</li><li>Sur le PC : Ivass AI → ⚙️ → 📱 Téléphone / Synchronisation → entrez le même code.</li><li>Synchronisez : c’est tout.</li></ol></div>
        <div class="card"><h3>🔐 Code de synchronisation</h3>
          ${code ? `<div class="code-box" id="codeBox">${esc(code)}</div><p class="help">Gardez-le précieusement : sans lui, les données synchronisées sont illisibles. Ne le partagez avec personne.</p>
            <div class="row"><button class="btn sm" id="cpCode">📋 Copier</button><button class="btn sm danger" id="forget">Oublier ce code</button></div>`
          : `<div class="row"><button class="btn primary" id="genCode">✨ Créer un code</button></div><p class="help" style="margin-top:10px">… ou entrez le code affiché sur le PC :</p>
            <div class="row"><input class="field" id="codeF" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocapitalize="characters" autocomplete="off" spellcheck="false"><button class="btn" id="useCode">Utiliser</button></div>`}
        </div>
        <div class="card"><h3>🔄 Synchronisation</h3>
          <div class="row"><button class="btn primary" id="syGo" ${code && syncServer() ? '' : 'disabled'}>Synchroniser maintenant</button>
          <label class="row" style="gap:8px"><span class="switch"><input type="checkbox" id="syAuto" ${sy.auto ? 'checked' : ''}><span></span></span> Automatique</label></div>
          <p class="help" id="syncStep"></p>
          <p class="help">${sy.last ? 'Dernière synchro : ' + new Date(sy.last).toLocaleString('fr-FR') : 'Jamais synchronisé.'} ${sy.error ? `<br><span class="ko">⚠ ${esc(sy.error)}</span>` : ''}</p></div>
        ${code && syncServer() ? `<div class="card"><h3>🖥️ Mon PC</h3><p class="help" id="pcState">Recherche du PC…</p>
          <div class="row"><button class="btn sm" id="getKeys">📲 Utiliser les clés API du PC</button></div>
          <p class="help">Choisissez le mode « 🖥️ Mon PC » sous la zone de saisie pour faire répondre Ivass AI sur votre PC (ses IA, y compris Ollama gratuit, et toute sa bibliothèque), même loin de chez vous. Le PC doit rester allumé avec Ivass AI ouvert. Seules des questions et des réponses circulent, chiffrées : aucune commande n’est exécutée.</p></div>` : ''}
        <div class="card"><h3>🌐 Serveur</h3><p class="help">Serveur Ivass gratuit (Cloudflare). Vous pouvez mettre le vôtre.</p>
          <input class="field" id="srvF" placeholder="https://ivass-ai-sync.….workers.dev" value="${esc(syncServer())}">
          ${code ? '<div class="row" style="margin-top:10px"><button class="btn sm danger" id="wipeSrv">Effacer mes données du serveur</button></div>' : ''}</div>`;
      const on = (id, f) => { const el = $('#' + id, r); if (el) el.onclick = f; };
      on('getKeys', async () => { try { const n = await syncPcKeys(false); if (!n) await receiveKeys(); draw(r); } catch (e) { N.toast(e.message); } });
      if ($('#pcState', r)) pcPresence().then((p) => {
        const el = $('#pcState', r); if (!el) return;
        const age = p ? Math.round((Date.now() - p.at) / 1000) : null;
        el.innerHTML = p && age < 180 ? `<span class="ok">● En ligne</span> — ${esc(p.name || 'PC')} · ${esc(p.ai || '')} (vu il y a ${age} s)` : `<span class="ko">● Hors ligne</span> — ouvrez Ivass AI sur le PC${p ? ' (vu le ' + new Date(p.at).toLocaleString('fr-FR') + ')' : ''}.`;
      });
      on('genCode', () => { N.secretSet('sync-code', window.IvassSync.newCode()); draw(r); });
      on('useCode', async () => {
        const c = window.IvassSync.normCode($('#codeF', r).value);
        try { await window.IvassSync.open(c); } catch (e) { return N.toast(e.message); }
        N.secretSet('sync-code', c); draw(r); syncNow(true);
      });
      on('cpCode', () => { N.copy(code); N.toast('Code copié'); });
      on('forget', async () => { if (await confirmBox('Oublier ce code sur ce téléphone ? (les données du serveur restent)', 'Oublier', true)) { N.secretSet('sync-code', ''); draw(r); } });
      on('syGo', () => syncNow(true));
      on('wipeSrv', async () => {
        if (!await confirmBox('Effacer définitivement vos données synchronisées du serveur ? (vos appareils les gardent)', 'Effacer', true)) return;
        try { await window.IvassSync.wipe({ server: syncServer(), code, http: N.http }); N.toast('Données du serveur effacées'); } catch (e) { N.toast(e.message); }
      });
      $('#syAuto', r).onchange = (e) => { S.settings.sync.auto = e.target.checked; saveSettings(); };
      $('#srvF', r).onchange = (e) => {
        const v = e.target.value.trim().replace(/\/+$/, '');
        if (v && !/^https:\/\//.test(v)) return N.toast('L’adresse doit commencer par https://');
        S.settings.sync.server = v === S.config.syncServer ? '' : v; saveSettings(); draw(r);
      };
    };
    openPanel('Synchronisation PC', '<div id="syBody"></div>', (r) => { draw(r); panelRefresh = () => draw(r); });
  }

  // ---------------- 💬 Centre de retours ----------------
  function feedback(type) {
    const bug = type === 'bug';
    sheet(`<h3>${bug ? '🐞 Signaler un problème' : '💡 Proposer une idée'}</h3>
      <textarea class="field" id="fbT" placeholder="${bug ? 'Que s’est-il passé ? Qu’attendiez-vous ? (étapes pour reproduire si possible)' : 'Votre idée pour améliorer Ivass AI…'}"></textarea>
      <p class="help">Version ${esc(N.version())} · ${esc(N.platform)}. Ne mettez pas d’informations personnelles (mots de passe, clés…) : elles seraient de toute façon masquées.</p>
      <div class="sheet-actions"><button class="btn" id="fbNo">Annuler</button><button class="btn primary" id="fbOk">Envoyer</button></div>`, (r) => {
      $('#fbT', r).focus();
      $('#fbNo', r).onclick = closeSheet;
      $('#fbOk', r).onclick = () => {
        const t = $('#fbT', r).value.trim(); if (t.length < 3) return N.toast('Écrivez quelques mots');
        contrib.ensureId();
        contrib.record('suggestion', { type: bug ? 'bug' : 'idee', text: (bug ? `[${N.platform} ${N.version()}] ` : '') + t });
        closeSheet(); N.toast('Merci, message envoyé 🙏'); contrib.flush({ force: true }).catch(() => {});
      };
    });
  }

  // ---------------- 📤 Partager Ivass AI ----------------
  const PAGE = () => S.config.pageUrl || 'https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/';
  const shareText = () => `Découvrez IVASS AI, un assistant intelligent nouvelle génération : il répond à vos questions avec les meilleures IA (Claude, Gemini, ChatGPT…), organise vos idées et garde votre mémoire personnelle, sur téléphone et sur PC. Gratuit.\n\nTéléchargement : ${PAGE()}`;
  function openShare() {
    const t = shareText(), u = PAGE(), e = encodeURIComponent;
    const via = (k) => {
      if (k === 'copy') { N.copy(u); N.toast('Lien copié ✓'); return; }
      if (k === 'other') { N.share(t); return; }
      if (k === 'qr') { $('#qrBox').classList.toggle('hidden'); return; }
      if (N.isAndroid && N.sendTo(k, t, 'Découvrez IVASS AI')) return;
      const web = { whatsapp: 'https://wa.me/?text=' + e(t), telegram: 'https://t.me/share/url?url=' + e(u) + '&text=' + e(t.replace(/\n\nTéléchargement : .*$/, '')), messenger: null, sms: 'sms:?body=' + e(t), email: 'mailto:?subject=' + e('Découvrez IVASS AI') + '&body=' + e(t) }[k];
      if (web) window.open(web, '_blank', 'noopener'); else N.share(t);
    };
    const B = [['whatsapp', '🟢', 'WhatsApp'], ['telegram', '✈️', 'Telegram'], ['messenger', '💬', 'Messenger'], ['sms', '✉️', 'SMS'], ['email', '📧', 'E-mail'], ['qr', '▦', 'QR code'], ['copy', '🔗', 'Copier le lien'], ['other', '↗', 'Autres applis']];
    sheet(`<h3>📤 Partager Ivass AI</h3><p class="help">Faites découvrir Ivass AI à vos proches : chaque personne qui l’installe aide Ivass à grandir.</p>
      <div class="share-grid">${B.map(([k, i, n]) => `<button class="share-tile" data-via="${k}"><span>${i}</span>${n}</button>`).join('')}</div>
      <div id="qrBox" class="hidden" style="text-align:center;margin-top:14px"><div style="display:inline-block;background:#fff;padding:12px;border-radius:16px"><img src="qr.png" alt="QR code" style="width:200px;display:block"></div><p class="help">Faites scanner ce code avec un autre téléphone.</p></div>
      <p class="help" style="margin-top:12px;word-break:break-all">${esc(u)}</p>`, (r) => { r.querySelectorAll('[data-via]').forEach((b) => { b.onclick = () => via(b.dataset.via); }); });
  }

  // ---------------- ✨ Mises à jour automatiques ----------------
  const vnum = (v) => String(v || '0').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const newer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  let update = null;
  async function checkUpdate(manual) {
    // Version iPhone / web : pas d'APK, la page se met à jour toute seule (service worker, voir pwa.js).
    if (N.isWeb) { if (manual) { if (window.IvassPWA) window.IvassPWA.checkNow(); N.toast(`Version ${N.version()} : Ivass AI se met à jour tout seul à chaque ouverture ✓`); } return null; }
    if (!S.config.updateUrl) return null;
    try {
      const r = await N.http({ url: S.config.updateUrl + '?t=' + Date.now(), timeout: 15000 });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const v = JSON.parse(r.body);
      const mine = N.version();
      if (v.version && /^https:\/\//.test(v.apk || '') && (newer(v.version, mine) || mine === 'aperçu' && manual)) {
        update = v;
        const skipped = (N.read('update.json') || {});
        if (manual || skipped.version !== v.version || Date.now() - (skipped.at || 0) > 24 * 3600e3) showUpdate();
        return v;
      }
      if (manual) N.toast(`Ivass AI est à jour ✓ (version ${mine})`);
    } catch (e) { if (manual) N.toast('Vérification impossible : ' + e.message); }
    return null;
  }
  function showUpdate() {
    const v = update; if (!v) return;
    const bar = $('#updateBar');
    bar.innerHTML = `<img src="emblem.png" alt="" style="width:34px;flex:none"><div class="grow"><b>Nouvelle version ${esc(v.version)} disponible</b><small>${esc(v.notes || 'Améliorations et corrections.')}</small><div class="progress hidden"><i></i></div></div>
      <button class="btn sm primary" id="updGo">Installer</button><button class="btn sm" id="updLater" aria-label="Plus tard">✕</button>`;
    bar.classList.remove('hidden');
    $('#updLater').onclick = () => { N.write('update.json', { version: v.version, at: Date.now() }); bar.classList.add('hidden'); };
    $('#updGo').onclick = () => {
      $('#updGo').disabled = true; $('#updGo').textContent = '…';
      bar.querySelector('.progress').classList.remove('hidden');
      N.installUpdate(v.apk);
    };
  }
  window.__upd = (e) => {
    const bar = $('#updateBar'); const go = $('#updGo'); const pr = bar.querySelector('.progress i');
    if (e.pct != null && pr) { pr.style.width = e.pct + '%'; if (go) go.textContent = e.pct + ' %'; }
    if (e.permission && go) { go.disabled = false; go.textContent = 'Installer'; N.toast('Activez « Autoriser cette source », revenez, puis touchez Installer.'); }
    if (e.done && go) { go.textContent = '✓'; N.toast('Touchez « Mettre à jour » dans la fenêtre d’Android'); setTimeout(() => { go.disabled = false; go.textContent = 'Installer'; }, 8000); }
    if (e.error && go) { go.disabled = false; go.textContent = 'Réessayer'; N.toast('Téléchargement impossible : ' + e.error); }
  };

  // ---------------- Android : partage entrant et bouton Retour ----------------
  window.ivassShared = (text) => {
    if (!$('#welcome').classList.contains('hidden')) return;
    closePanel(); closeSheet(); closeDrawer(); newConv();
    input.value = String(text || '').slice(0, 20000); grow(); input.focus();
  };
  window.ivassBack = () => {
    if (!$('#sheet').classList.contains('hidden')) { closeSheet(); return true; }
    if (!$('#panel').classList.contains('hidden')) { closePanel(); return true; }
    if ($('#drawer').classList.contains('open')) { closeDrawer(); return true; }
    if (S.busy) { S.busy.abort(); return true; }
    return false;
  };

  // ---------------- Démarrage ----------------
  /** Réglages publics publiés sur la page de téléchargement : seulement des ADRESSES (jamais de clé de chiffrement). */
  async function remoteConfig() {
    const apply = (rc) => {
      if (!rc) return;
      if (!S.config.contribServer && /^https:\/\//.test(rc.contribServer || '')) S.config.contribServer = rc.contribServer.replace(/\/+$/, '');
      if (!S.config.syncServer && /^https:\/\//.test(rc.syncServer || '')) S.config.syncServer = rc.syncServer.replace(/\/+$/, '');
    };
    apply(N.read('remote-config.json'));
    if (!S.config.remoteConfig) return;
    try {
      const r = await N.http({ url: S.config.remoteConfig + '?t=' + Math.floor(Date.now() / 3600e3), timeout: 15000 });
      if (r.ok) { const rc = JSON.parse(r.body); const keep = { contribServer: rc.contribServer || '', syncServer: rc.syncServer || '' }; N.write('remote-config.json', keep); apply(keep); }
    } catch (_) { /* hors ligne : on garde la dernière version connue */ }
  }
  fetch('config.json').then((r) => r.json()).then((c) => { S.config = c || {}; }).catch(() => {})
    .then(remoteConfig)
    .finally(() => { if (S.settings.sync.auto) syncNow(false); flushSoon(15000); setTimeout(() => checkUpdate(false), 4000); });
  setInterval(() => checkUpdate(false), 6 * 3600e3);
  setInterval(() => contrib.flush().catch(() => {}), 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.settings.sync.auto) syncNow(false); });
  renderChat();
})();
