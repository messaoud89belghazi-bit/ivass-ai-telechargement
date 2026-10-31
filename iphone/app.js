/* Ivass AI Mobile — interface. Développé par Messaoud BELGHAZI. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const N = window.Native;

  // ---------------- Données ----------------
  const DEF = { providers: [], mode: 'normal', useLib: true, answerLength: 'equilibre', encyclo: true, savoir: true, showRoute: false, instructions: '', theme: 'light', bg: 'degrade', size: 'normal', cgu: 0, sync: { server: '', auto: true, last: 0 } };
  const S = {
    settings: Object.assign({}, DEF, N.read('settings.json') || {}),
    convs: N.read('convs.json') || { list: [], deleted: {} },
    lib: N.read('library.json') || { list: [], deleted: {} },
    savoir: N.read('savoir.json') || { hash: '', at: '', fetched: 0, entries: [] },
    monde: N.read('monde.json') || { hash: '', at: '', fetched: 0, entries: [] },
    attach: [], sent: new Map(),
    cur: null, busy: null, config: {},
  };
  S.settings.sync = Object.assign({}, DEF.sync, S.settings.sync || {});

  // ---------------- 🌐 Langue de l'interface (50 langues ; 11 traduites en entier, les autres par votre IA) ----------------
  const I18 = window.IvassI18n;
  function loadDict(code) {
    const l = I18.info(code), base = l.full ? code : 'en';
    const dicts = () => window.IvassI18nDicts || {};
    const ready = base === 'fr' || dicts()[base] ? Promise.resolve() : new Promise((res) => { const sc = document.createElement('script'); sc.src = 'i18n/' + base + '.js'; sc.onload = sc.onerror = () => res(); document.head.appendChild(sc); });
    return ready.then(() => Object.assign({}, dicts()[base] || {}, (!l.full && N.read('i18n-' + code + '.json')) || {}));
  }
  const LANG = I18.setup({
    load: loadDict,
    // jamais traduits : vos messages, les réponses des IA, vos fiches (seule l'interface change de langue)
    skip: ['.msg .bubble.no-i18n', '.msg.user .bubble', '.msg.user .files', '.lib-item b'],
    unskip: ['.code-btns', '.tbl-tools', '.lvr-card', '.lvr-wait', '.lvr-err'],
    save: (c) => { S.settings.lang = c; saveSettings(); try { localStorage.setItem('ivass-lang', c); } catch (_) { /* aperçu */ } },
    onChange: (c) => { window.ivassLocale = c === 'ar' ? 'ar-u-nu-latn' : c; },
  });
  const T = LANG.t;
  window.ivassT = T; // toasts natifs (Android) traduits aussi
  LANG.use(S.settings.lang || window.ivassBootLang || I18.detect(navigator.languages || [navigator.language]));
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
    openPanel('Conditions et confidentialité', `${LANG.lang === 'fr' ? '' : '<p class="help">Version officielle en français.</p>'}<div class="card bubble no-i18n">${md(await get('CGU.md'))}</div><div class="card bubble no-i18n">${md(await get('MOBILE.md'))}</div><div class="card bubble no-i18n">${md(await get('CONFIDENTIALITE.md'))}</div>`);
  }
  if (S.settings.cgu < CGU_VERSION) {
    $('#welcome').classList.remove('hidden');
    const wl = $('#welLang');
    if (wl) { wl.innerHTML = langOptions(); wl.onchange = () => LANG.use(wl.value, true); }
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
    if (S.settings.mode === 'solo') return '🌱 Ivass seul — sans IA externe';
    const p = [...S.settings.providers].filter((x) => x.enabled !== false).sort((a, b) => (a.priority || 5) - (b.priority || 5))[0];
    if (!p) return 'Aucune IA — ajoutez une clé dans Réglages';
    return S.settings.showRoute ? `${p.name} · ${p.model}` : '✨ Prêt à répondre';
  }
  function msgEl(m, i, c) {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.role === 'user' ? 'user' : 'ai');
    if (m.role === 'user') d.innerHTML = (m.thumbs && m.thumbs.length ? `<div class="thumbs">${m.thumbs.map((t) => `<img src="${esc(t)}" alt="">`).join('')}</div>` : '') +
      (m.files && m.files.length ? `<div class="files">${m.files.map((f) => `<span>${f.kind === 'video' ? '🎬' : '📄'} ${esc(f.name)}</span>`).join('')}</div>` : '') +
      `<div class="bubble" dir="auto">${esc(m.display != null ? m.display : m.content)}</div>`;
    else {
      d.innerHTML = `<div class="who"><img src="icon.png" alt="">Ivass AI</div>` +
        (m.notice ? `<div class="notice">${esc(m.notice)}</div>` : '') +
        `<div class="bubble${m.setup || m.error ? '' : ' no-i18n'}"${m.setup || m.error ? '' : ' dir="auto"'}>${m.setup ? setupHTML() : m.error ? `<div class="err">${esc(m.error)}</div>` : mdMsg(m, false)}</div>` +
        sourcesHTML(m) + (m.content || m.error ? backstageHTML(m) : '') +
        `<div class="meta">${S.settings.showRoute && m.model ? `<span>${esc(m.model)}</span>` : ''}${m.content && !m.setup ? `<button data-act="up" style="${m.vote === 1 ? 'opacity:1;color:var(--ok)' : ''}">👍</button><button data-act="down" style="${m.vote === -1 ? 'opacity:1;color:var(--danger)' : ''}">👎</button>` : ''}<button data-act="copy">📋</button><button data-act="share">↗</button><button data-act="save" title="Garder dans la bibliothèque">📚</button>` +
        (m.content || m.error ? `<button data-act="bs" title="Coulisses : quelle IA a répondu, bascules, sources">ⓘ</button>` : '') +
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
        if (act === 'bs') { d.classList.toggle('show-bs'); e.target.classList.toggle('on'); }
      };
    }
    return d;
  }

  /** ⓘ Coulisses : quelle IA a répondu, combien de temps, les bascules… caché tant qu'on ne le demande pas. */
  function backstageHTML(m) {
    const rows = [];
    const row = (k, v) => rows.push(`<div class="bs-row"><span>${k}</span><b>${v}</b></div>`);
    if (m.provider || m.model) row('Réponse par', esc([m.provider, m.model].filter(Boolean).join(' · ')));
    if (m.ms) row('Durée', `${(m.ms / 1000).toLocaleString(window.ivassLocale || 'fr-FR', { maximumFractionDigits: 1 })} s`);
    if (m.libHits) row('Bibliothèque', `${m.libHits} passage(s)`);
    if (m.enc && m.enc.length) row('Encyclopédies', esc([...new Set(m.enc.map((r) => `${r.icon || '🌍'} ${r.name}`))].join(' · ')));
    for (const x of m.switches || []) row('Bascule', esc(x));
    if (!rows.length) rows.push('<div class="bs-row"><span>Réponse directe, sans bascule.</span></div>');
    return `<div class="backstage">${rows.join('')}</div>`;
  }
  function sourcesHTML(m) {
    const enc = (m.enc || []).filter((r) => /^https:\/\//.test(r.url || ''));
    return enc.length ? `<div class="enc-src">${enc.slice(0, 6).map((r, i) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">[E${i + 1}] ${r.icon || '🌍'} ${esc(r.name)}</a>`).join('')}</div>` : '';
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
    let text = (textArg != null ? textArg : input.value).trim();
    const att = textArg != null ? [] : S.attach.filter((a) => !a.busy && !a.error);
    if (S.attach.some((a) => a.busy)) return N.toast('Lecture des fichiers en cours…');
    if ((!text && !att.length) || S.busy) return;
    if (!text) text = att.some((a) => a.kind === 'image') ? 'Que vois-tu sur cette image ?' : att.some((a) => a.kind === 'video') ? 'Que se passe-t-il dans cette vidéo ?' : 'Résume ce document.';
    let c = conv(S.cur);
    if (!c) { c = { id: uid(), title: core.titleOf(text), created: Date.now(), updated: Date.now(), messages: [] }; S.convs.list.push(c); S.cur = c.id; }
    if (textArg == null) { input.value = ''; grow(); S.attach = []; drawAttach(); }
    // le texte des documents part avec le message ; images et vidéo restent en mémoire pour l'IA (vignettes dans la discussion)
    const docs = att.filter((a) => a.kind === 'doc');
    const content = text + docs.map((a) => `\n\n--- Fichier joint : ${a.name} ---\n\`\`\`\n${a.text}\n\`\`\``).join('');
    const um = { role: 'user', content, display: text, ts: Date.now() };
    if (att.length) {
      um.thumbs = att.filter((a) => a.kind === 'image').map((a) => a.thumb);
      um.files = att.filter((a) => a.kind !== 'image').map((a) => ({ name: a.name, kind: a.kind }));
      const vid = att.find((a) => a.kind === 'video');
      S.sent.set(c.id, { images: att.filter((a) => a.kind === 'image').map((a) => ({ mime: a.mime, data: a.data })), video: vid ? { mime: vid.mime, data: vid.data } : null });
    } else S.sent.delete(c.id);
    c.messages.push(um);
    c.updated = Date.now(); saveConvs();
    renderChat();
    await answer(c);
  }
  function drawAttach() {
    const bar = $('#attachBar');
    bar.classList.toggle('hidden', !S.attach.length);
    bar.innerHTML = S.attach.map((a, i) => `<div class="chip${a.busy ? ' busy' : ''}" title="${esc(a.error || a.name)}">${a.thumb ? `<img src="${esc(a.thumb)}" alt="">` : `<span class="ic">${a.busy ? '⏳' : a.error ? '⚠️' : a.kind === 'video' ? '🎬' : '📄'}</span>`}<span class="nm">${esc(a.error ? a.error : a.name)}</span><button class="x" data-rm="${i}" aria-label="Retirer">✕</button></div>`).join('');
  }
  $('#attachBtn').onclick = () => $('#fileInput').click();
  $('#attachBar').onclick = (e) => { const b = e.target.closest('[data-rm]'); if (b) { S.attach.splice(+b.dataset.rm, 1); drawAttach(); } };
  $('#fileInput').onchange = async (e) => {
    const files = [...e.target.files].slice(0, 8); e.target.value = '';
    for (const f of files) {
      const a = { name: f.name, kind: /^image\//.test(f.type) ? 'image' : /^video\//.test(f.type) ? 'video' : 'doc', busy: true };
      if (a.kind === 'video' && S.attach.some((x) => x.kind === 'video')) { N.toast('Une seule vidéo par message'); continue; }
      S.attach.push(a); drawAttach();
      try { Object.assign(a, await window.IvassFichiers.read(f), { busy: false }); }
      catch (err) { a.busy = false; a.error = err.message; N.toast(err.message); }
      drawAttach();
    }
    S.attach = S.attach.filter((x) => !x.error);
    drawAttach();
    input.focus();
  };

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
    if (!hasAI && S.settings.mode !== 'pc' && S.settings.mode !== 'solo') {
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
    el.innerHTML = `<div class="who"><img src="icon.png" alt="">Ivass AI</div><div class="notice hidden"></div><div class="bubble no-i18n" dir="auto"><span class="typing"><i></i><i></i><i></i></span></div>`;
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
    let ctx = '', libTop = 0;
    if (S.settings.useLib && (S.lib.list.length || S.savoir.entries.length || S.monde.entries.length)) {
      const lc = window.IvassLib.contextForMany(knowledge(), last);
      ctx = lc.text; libTop = lc.top; m.libHits = lc.hits.length;
    }
    const mode = S.settings.mode;
    // 🌍 Encyclopédies libres quand la bibliothèque ne connaît pas (encore) le sujet
    const EN = window.IvassEncyclo;
    let encDocs = [];
    if (EN && mode !== 'pc' && (S.settings.encyclo !== false || mode === 'solo') && navigator.onLine && EN.worth(last)) {
      const volatileQ = EN.pick(last).some((id) => EN.SOURCES[id] && EN.SOURCES[id].volatile);
      if (!ctx || libTop < 3 || volatileQ) {
        try {
          $('#phase').classList.remove('hidden'); $('#phase').textContent = '🌍 Recherche dans les encyclopédies libres…';
          const r = await EN.lookup(last, { get: encGet, getText: encGetText, timeoutMs: 4500, limit: 4 });
          if (r.docs.length) {
            ctx = (ctx ? ctx + '\n\n' : '') + EN.contextText(r.docs);
            m.enc = r.docs.map((d) => ({ title: d.title, url: d.url, name: d.name, icon: d.icon })); encDocs = r.docs;
            learnFromEncyclo(r.docs);
          }
        } catch (_) { /* sans encyclopédie */ }
        $('#phase').classList.add('hidden');
      }
    }
    m.switches = [];
    const att = S.sent.get(c.id) || null;
    // 🌱 Ivass seul : réponse composée par Ivass lui-même, sans IA externe
    if (mode === 'solo') {
      m.content = soloAnswer(last, encDocs); m.model = 'Ivass (autonome)'; m.provider = 'Ivass';
      el.remove(); S.busy = null; $('#sendBtn').classList.remove('stop'); $('#sendBtn').textContent = '➤';
      m.mode = mode; m.ms = Date.now() - m.ts; if (!m.switches.length) delete m.switches;
      c.messages.push(m); c.updated = Date.now(); saveConvs(); renderChat(); autoSync();
      return;
    }
    const opts = {
      // une vidéo jointe : Gemini (la seule à savoir la regarder) passe en premier
      providers: att && att.video ? [...S.settings.providers].sort((a, b) => (b.type === 'gemini') - (a.type === 'gemini') || (a.priority || 5) - (b.priority || 5)).map((p, i) => ({ ...p, priority: i })) : S.settings.providers,
      attach: att,
      onModelFix: (p) => { const real = S.settings.providers.find((x) => x.id === p.id); if (real) { real.model = p.model; saveSettings(); } },
      messages: trimHistory(c.messages.filter((x) => !x.setup).map((x) => ({ role: x.role, content: x.content })).filter((x) => x.content)),
      system: core.systemPrompt({ extra: S.settings.instructions, context: ctx, mode, langRule: window.IvassI18n.answerRule(LANG.lang) }) + (LENGTH[S.settings.answerLength || 'equilibre'] ? '\n\n' + LENGTH[S.settings.answerLength || 'equilibre'] : '') + (LV ? '\n\n' + LV.RULES : ''),
      signal: ctrl.signal,
      onText: (t) => { m.content += t; paint(); },
      onStatus: (s) => {
        if (S.settings.showRoute) $('#convSub').textContent = `${s.provider} · ${s.model}`;
        // les pannes et bascules ne s'affichent plus dans la réponse : elles vont dans ⓘ Coulisses
        if (s.failed) { failures.push({ provider: s.provider, model: s.model, message: s.failed }); m.switches.push(`${s.provider} indisponible (${String(s.failed).split('\n')[0].slice(0, 120)})`); }
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
      if (r.switches.length) m.switches.push(`${r.switches.join(' → ')} → ${r.provider}`);
      if (r.incomplete) m.notice = (m.notice ? m.notice + ' · ' : '') + 'réponse incomplète';
    } catch (e) {
      const offline = e.offline || !navigator.onLine || /Réseau :|Unable to resolve|failed to connect|timeout|UnknownHost|Failed to fetch/i.test(e.message);
      if (m.content) m.notice = 'Interrompu : ' + e.message.split('\n')[0];
      else if (offline && !ctrl.signal.aborted) { m.content = offlineAnswer(last); m.notice = '📴 Hors connexion — réponse tirée de votre bibliothèque (sans IA)'; m.model = 'bibliothèque'; }
      else if (!ctrl.signal.aborted && /Tous les fournisseurs|Aucun fournisseur/.test(e.message)) {
        // aucune IA n'a pu répondre : Ivass répond tout seul avec ce qu'il sait, le détail est dans ⓘ Coulisses
        m.content = soloAnswer(last, encDocs); m.model = 'Ivass (autonome)'; m.provider = 'Ivass';
        m.notice = '🌱 Aucune IA disponible : Ivass répond avec ses propres connaissances';
        for (const x of String(e.message).split('\n• ').slice(1)) m.switches.push(x);
      } else m.error = e.message;
    } finally {
      S.busy = null;
      $('#sendBtn').classList.remove('stop'); $('#sendBtn').textContent = '➤';
      $('#phase').classList.add('hidden');
    }
    m.mode = mode; m.ms = Date.now() - m.ts;
    if (!m.switches.length) delete m.switches;
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

  // ---------------- Longueur des réponses, historique borné, encyclopédies, Savoir Ivass ----------------
  const LENGTH = {
    court: 'LONGUEUR : réponds en 3 à 6 phrases au plus (ou une courte liste), sans introduction ni conclusion. Développe seulement si on te le demande.',
    equilibre: 'LONGUEUR : va droit au but. Donne d’abord la réponse en une ou deux phrases, puis seulement les détails utiles. Pas de préambule, pas de reformulation de la question, pas de récapitulatif final.',
    detaille: '',
  };
  /** L'IA reçoit les derniers échanges (60 000 caractères au plus) au lieu de toute la discussion : plus rapide, moins de tokens. */
  function trimHistory(h, maxChars = 60000) {
    const out = []; let total = 0;
    for (let i = h.length - 1; i >= 0; i--) {
      total += String(h[i].content || '').length;
      if (total > maxChars && out.length >= 2) break;
      out.unshift(h[i]);
    }
    while (out.length && out[0].role !== 'user') out.shift();
    return out;
  }
  const encUA = { 'Api-User-Agent': 'IvassAI-Mobile (assistant personnel ; https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/)' };
  const encCache = new Map();
  async function encFetch(url) {
    const hit = encCache.get(url);
    if (hit && Date.now() - hit.at < 5 * 60e3) return hit.body;
    const r = await N.http({ url, headers: encUA, timeout: 8000 });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    encCache.set(url, { at: Date.now(), body: r.body });
    if (encCache.size > 150) encCache.delete(encCache.keys().next().value);
    return r.body;
  }
  const encGet = async (u) => JSON.parse(await encFetch(u));
  const encGetText = (u) => encFetch(u);
  /** Ivass apprend : chaque source utile devient une fiche de la bibliothèque (jamais la météo ni les taux). */
  function learnFromEncyclo(docs) {
    let added = 0;
    for (const d of docs) {
      const en = window.IvassEncyclo.toEntry(d);
      if (!en || S.lib.list.some((x) => x.title === en.title && (x.tags || []).includes('encyclopedie'))) continue;
      S.lib.list.push({ id: uid(), title: en.title, text: en.content, kind: 'knowledge', tags: en.tags, created: Date.now(), updated: Date.now() });
      added++;
    }
    if (added) saveLib();
  }
  /** Toutes les connaissances d'Ivass sur ce téléphone : votre bibliothèque, le Savoir Ivass, l'encyclopédie apprise dans le cloud. */
  function knowledge() {
    return [S.lib.list, S.settings.savoir !== false ? S.savoir.entries : [], S.settings.monde !== false ? S.monde.entries : []];
  }

  /**
   * 🌱 Ivass seul : Ivass compose LUI-MÊME la réponse, sans IA externe, à partir de ce qu'il sait (bibliothèque,
   * Savoir Ivass, encyclopédie apprise) et des encyclopédies consultées : les phrases les plus proches de la question,
   * regroupées par source et citées. Il ne raisonne pas comme un grand modèle : il retrouve et assemble.
   */
  function soloAnswer(q, encDocs = []) {
    const L = window.IvassLib;
    const qt = new Set(L.tokens(q));
    // titre qui correspond à la question → les premières phrases de la fiche comptent même sans mot commun
    const best = (text, n, title) => {
      const flat = String(text || '').replace(/\s+/g, ' ').trim();
      const onTitle = L.tokens(title || '').some((t) => qt.has(t));
      if (onTitle && flat.length <= 400) return flat.length >= 8 ? [flat] : [];
      const sents = flat.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«"(])/).filter((x) => x.length > 15 && x.length < 600);
      const scored = sents.map((x, i) => ({ x, i, s: L.tokens(x).filter((t) => qt.has(t)).length + (i === 0 ? 0.5 : 0) + (onTitle && i < 2 ? 0.6 : 0) })).filter((o) => o.s > 0.5);
      return scored.sort((a, b) => b.s - a.s).slice(0, n).sort((a, b) => a.i - b.i).map((o) => o.x);
    };
    const parts = [], refs = [];
    for (const h of L.contextForMany(knowledge(), q, 12000).hits.slice(0, 4)) {
      const lines = best(h.text, 3, h.title);
      if (!lines.length) continue;
      refs.push(`[${refs.length + 1}] ${h.title} ${T(h.kind === 'savoir' ? '(🌍 Savoir Ivass)' : h.kind === 'monde' ? '(📖 encyclopédie apprise)' : '(📚 bibliothèque)')}`);
      parts.push(`**${h.title}** — ${lines.join(' ')} [${refs.length}]`);
    }
    encDocs.slice(0, 3).forEach((d, i) => {
      const lines = best(d.text, 3, d.title);
      if (lines.length) parts.push(`**${d.title}** — ${lines.join(' ')} [E${i + 1}]`);
    });
    if (!parts.length) return T('🌱 Je ne trouve encore rien sur ce sujet dans mes connaissances.') + '\n\n' + T('Pour que j’apprenne : activez les 🌍 encyclopédies libres (⚙️ Réglages → Réponses), ajoutez une fiche dans 📚 Bibliothèque, ou ajoutez une IA (même sans clé).');
    return `🌱 **${T('Réponse d’Ivass, avec ses propres connaissances')}** ${T('(sans IA externe)')}\n\n${parts.join('\n\n')}` +
      (refs.length ? `\n\n> ${T('Sources :')} ${refs.join(' · ')}` : '') + (encDocs.length ? `${refs.length ? ' · ' : `\n\n> ${T('Sources :')} `}${encDocs.slice(0, 3).map((d, i) => `[E${i + 1}] ${d.name}`).join(' · ')}` : '');
  }

  /** Paquet de connaissances publié sur la page (format « ivass-savoir ») : savoir/ (créateur) ou monde/ (apprentissage dans le cloud). */
  async function receivePack(folder, file, kind, force) {
    const cur = S[kind];
    if (!force && Date.now() - (cur.fetched || 0) < 12 * 3600e3) return cur;
    const base = S.config.pageUrl.replace(/\/*$/, '/') + folder + '/';
    const get = async (u) => { const r = await N.http({ url: u, timeout: 20000 }); if (r.status === 404) return null; if (!r.ok) throw new Error('HTTP ' + r.status); return JSON.parse(r.body); };
    const index = await get(base + 'index.json?t=' + Date.now());
    cur.fetched = Date.now();
    if (!index || index.format !== 'ivass-savoir' || !Array.isArray(index.parts) || (index.hash === cur.hash && !force)) { N.write(file, cur); return cur; }
    const entries = [];
    for (const p of index.parts.slice(0, 200)) {
      const part = await get(base + encodeURIComponent(p.file) + '?h=' + p.hash);
      for (const e of (part && part.entries) || []) {
        if (!e || !/^(sv|mo)-[0-9a-f]{16}$/.test(e.id || '')) continue;
        entries.push({ id: e.id, title: String(e.title || '').slice(0, 200), text: String(e.content || '').slice(0, 60000), kind, tags: (e.tags || []).slice(0, 10).map(String), url: /^https:\/\//.test(e.url || '') ? e.url : '', updated: e.at || 0 });
      }
    }
    S[kind] = { hash: index.hash, at: index.at || '', fetched: Date.now(), entries };
    N.write(file, S[kind]);
    return S[kind];
  }

  /** 🌍 Savoir Ivass : le savoir publié par le créateur (nettoyé, sans vie privée), relu au plus toutes les 12 h. */
  async function receiveSavoir(force) {
    if (S.settings.savoir === false || !S.config.pageUrl) return;
    if (!force && Date.now() - (S.savoir.fetched || 0) < 12 * 3600e3) return;
    const base = S.config.pageUrl.replace(/\/*$/, '/') + 'savoir/';
    const get = async (u) => { const r = await N.http({ url: u, timeout: 20000 }); if (r.status === 404) return null; if (!r.ok) throw new Error('HTTP ' + r.status); return JSON.parse(r.body); };
    const index = await get(base + 'index.json?t=' + Date.now());
    S.savoir.fetched = Date.now();
    if (!index || index.format !== 'ivass-savoir' || !Array.isArray(index.parts)) { N.write('savoir.json', S.savoir); return; }
    if (index.hash === S.savoir.hash && !force) { N.write('savoir.json', S.savoir); return; }
    const entries = [];
    for (const p of index.parts.slice(0, 200)) {
      const part = await get(base + encodeURIComponent(p.file) + '?h=' + p.hash);
      for (const e of (part && part.entries) || []) {
        if (!e || !/^sv-[0-9a-f]{16}$/.test(e.id || '')) continue;
        entries.push({ id: e.id, title: String(e.title || '').slice(0, 200), text: String(e.content || '').slice(0, 60000), kind: 'savoir', tags: (e.tags || []).slice(0, 10).map(String), updated: e.at || 0 });
      }
    }
    S.savoir = { hash: index.hash, at: index.at || '', fetched: Date.now(), entries };
    N.write('savoir.json', S.savoir);
  }

  // ---------------- Hors connexion : la bibliothèque répond ----------------
  function offlineAnswer(q) {
    const hits = window.IvassLib.contextForMany([S.lib.list, S.settings.savoir !== false ? S.savoir.entries : []], q, 4000).hits.slice(0, 3);
    if (!hits.length) return `📴 **${T('Pas de connexion Internet')}** ${T('et rien dans votre bibliothèque sur ce sujet.')}\n\n${T('Votre question est gardée dans la discussion : touchez ↻ dès que le réseau revient.')}`;
    return `📴 **${T('Pas de connexion Internet.')}** ${T('Voici ce que dit votre bibliothèque :')}\n\n` +
      hits.map((h) => `### ${h.title}\n${h.text.length > 1200 ? h.text.slice(0, 1200) + '…' : h.text}`).join('\n\n') +
      `\n\n*${T('Touchez ↻ quand le réseau revient pour une vraie réponse de l’IA.')}*`;
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
  $$('.drawer-nav button').forEach((b) => { b.onclick = () => { closeDrawer(); ({ library: openLibrary, settings: () => openSettings(), sync: openSync, share: openShare, news: openNews })[b.dataset.open](); }; });

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
  // ---------------- 🌐 Langue ----------------
  function langOptions() { return I18.LANGS.map((l) => `<option value="${l.code}" ${l.code === LANG.lang ? 'selected' : ''}>${esc(l.name)}${l.code === 'fr' || l.name === l.en ? '' : ' — ' + esc(l.en)}${l.full ? '' : ' · IA'}</option>`).join(''); }
  const langHTML = () => `<div class="card"><h3 data-noi18n>🌐 Langue · Language · اللغة · 语言</h3>
    <select class="field" id="langSel" data-noi18n>${langOptions()}</select>
    <p class="help" id="langMsg"></p>
    <div class="row hidden" id="langAiRow"><button class="btn sm" id="langAi">🤖 Traduire l’interface avec mon IA</button></div>
    <p class="help">Ivass comprend toutes les langues : écrivez dans la vôtre, il répond dans la même langue.</p></div>`;
  let catalog = null;
  const loadCatalog = () => catalog ? Promise.resolve(catalog) : new Promise((res) => {
    if (window.IvassI18nCatalog) return res((catalog = window.IvassI18nCatalog));
    const sc = document.createElement('script'); sc.src = 'i18n/catalogue.js';
    sc.onload = sc.onerror = () => res((catalog = window.IvassI18nCatalog || []));
    document.head.appendChild(sc);
  });
  let langJob = null;
  /** Langue sans traduction livrée : votre IA traduit les textes de l'interface (jamais vos messages), gardés sur le téléphone. */
  async function aiTranslateUI(code, msg) {
    if (langJob) return;
    const usable = S.settings.providers.filter((p) => p.enabled !== false && p.model);
    if (!usable.length) { msg.textContent = T('Ajoutez d’abord une IA (même sans clé) pour traduire l’interface.'); return; }
    const keys = await loadCatalog();
    const have = N.read('i18n-' + code + '.json') || {};
    langJob = new AbortController();
    msg.textContent = T('Traduction de l’interface : {} / {} textes…', Object.keys(have).length, keys.length);
    try {
      await I18.translateMissing({
        lang: code, keys, have, signal: langJob.signal,
        ask: async (prompt) => (await core.chat({ providers: S.settings.providers, messages: [{ role: 'user', content: prompt }], system: 'You are a professional software localizer. Output only JSON.', maxTokens: 8000 })).text,
        onPart: (part) => {
          Object.assign(have, part); N.write('i18n-' + code + '.json', have);
          msg.textContent = T('Traduction de l’interface : {} / {} textes…', Object.keys(have).length, keys.length);
        },
      });
      if (LANG.lang === code) await LANG.use(code);
      msg.textContent = T('Interface traduite : {} / {} textes. Touchez à nouveau pour compléter.', Object.keys(have).length, keys.length);
    } catch (e) { msg.textContent = e.message; }
    langJob = null;
  }
  function mountLang(r) {
    const sel = $('#langSel', r), msg = $('#langMsg', r);
    if (!sel) return;
    const paint = () => {
      const l = I18.info(LANG.lang);
      const ai = N.read('i18n-' + l.code + '.json') || {};
      $('#langAiRow', r).classList.toggle('hidden', !!l.full);
      msg.textContent = l.full ? '' : T('{} textes traduits par votre IA ; le reste s’affiche en anglais. Seuls les textes de l’interface sont envoyés à l’IA.', Object.keys(ai).length);
    };
    sel.onchange = async () => {
      await LANG.use(sel.value, true); paint();
      if (!I18.info(sel.value).full && !Object.keys(N.read('i18n-' + sel.value + '.json') || {}).length) aiTranslateUI(sel.value, msg);
    };
    $('#langAi', r).onclick = () => aiTranslateUI(LANG.lang, msg);
    paint();
  }

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
      ${langHTML()}
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
      <div class="card"><h3>🆓 IA sans clé <span class="muted" style="font-weight:400;font-size:13px">— gratuites, limitées, en secours</span></h3>
        <p class="help">Services publics utilisables sans compte. Ce que vous écrivez part chez eux : évitez les informations personnelles. Ils servent surtout quand vos autres IA sont épuisées.</p>
        ${(window.Platforms.KEYLESS || []).map((k) => `<label class="check"><input type="checkbox" data-keyless="${esc(k.id)}" ${P.some((p) => p.platform === k.id) ? 'checked' : ''}><span><b>${esc(k.name.replace(' (sans clé)', ''))}</b> — ${esc(k.limit)}</span></label>`).join('')}
      </div>
      <div class="card"><h3>🎁 IA gratuites avec une clé</h3>
        <p class="help">Créez un compte gratuit, copiez la clé, collez-la plus haut : Ivass reconnaît la plateforme toute seule. Vous pouvez ajouter autant de clés que vous voulez ; Ivass passe de l’une à l’autre quand une limite est atteinte.</p>
        <div class="row" style="flex-wrap:wrap;gap:6px">${window.Platforms.PLATFORMS.filter((x) => x.keyUrl && /^(gemini|groq|openrouter|mistral|cerebras|nvidia|cohere|huggingface|zai|ollamacloud)$/.test(x.id)).map((x) => `<a class="btn sm" href="${esc(x.keyUrl)}" target="_blank" rel="noopener">${esc(x.name.replace(/ \(.*\)/, ''))}</a>`).join('')}</div>
        <details style="margin-top:8px"><summary class="muted">Clé Ollama Cloud (non reconnue automatiquement)</summary>
          <div class="row" style="margin-top:8px"><input class="field" id="olKey" placeholder="Clé Ollama Cloud" autocomplete="off"><button class="btn sm" id="olAdd">Ajouter</button></div></details>
      </div>
      <div class="card"><h3>⚡ Réponses</h3>
        <label class="help" for="lenF">Longueur des réponses</label>
        <select class="field" id="lenF"><option value="court">Courtes — l’essentiel en quelques phrases</option><option value="equilibre">Équilibrées — droit au but (conseillé)</option><option value="detaille">Détaillées — explications complètes</option></select>
        <label class="check" style="margin-top:8px"><input type="checkbox" id="encF"><span>🌍 Consulter les encyclopédies libres (Wikipédia, Wiktionnaire, OpenAlex…) quand la bibliothèque ne connaît pas le sujet, et apprendre ce qui est trouvé</span></label>
        <label class="check"><input type="checkbox" id="svF"><span>🌍 Utiliser le Savoir Ivass, partagé par le créateur d’Ivass AI (${S.savoir.entries.length} fiche(s) reçue(s))</span></label>
        <label class="check"><input type="checkbox" id="mondeF"><span>📖 Utiliser l’encyclopédie qu’Ivass apprend chaque jour dans le cloud, même quand vos appareils sont éteints (${S.monde.entries.length} article(s) reçu(s))</span></label>
        <label class="check"><input type="checkbox" id="routeF"><span>Afficher le nom de l’IA utilisée (sinon : bouton ⓘ sous chaque réponse)</span></label>
      </div>
      <div class="card"><h3>🧭 Mes consignes</h3><p class="help">Ce que l’IA doit toujours savoir ou respecter (ton, métier, format…).</p>
        <textarea class="field" id="instrF" placeholder="Ex. : Je suis technicien chauffagiste. Réponds court, avec des étapes numérotées.">${esc(S.settings.instructions)}</textarea></div>
      <div class="card"><h3>🤝 Améliorer Ivass AI <span class="muted" style="font-weight:400;font-size:13px">— facultatif</span></h3>
        <p class="help">Envois anonymes, nettoyés et chiffrés pour le seul créateur d’Ivass AI.</p>
        ${contribChecks('cs')}
        <p class="help" id="ctState"></p>
        <div class="row"><button class="btn sm danger" id="ctForget">Effacer mes envois</button></div></div>
      <div class="card"><h3>📰 Lettre d’information <span class="muted" style="font-weight:400;font-size:13px">— facultatif</span></h3><p class="help">Recevez par e-mail les nouveautés et conseils d’Ivass AI. Votre adresse part chiffrée, lisible uniquement par le créateur d’Ivass AI, pour cet usage seulement : jamais vendue ni partagée.</p>
        <div id="nlState" class="help"></div>
        <input class="field" id="nlPrenom" placeholder="Prénom (facultatif)"><input class="field" id="nlEmail" type="email" placeholder="vous@exemple.fr" style="margin-top:6px">
        <label class="check" style="margin:8px 0"><input type="checkbox" id="nlOk"><span>J’accepte de recevoir la lettre d’information d’Ivass AI. Je peux me désinscrire à tout moment.</span></label>
        <div class="row"><button class="btn sm primary" id="nlOn">📰 M’inscrire</button><button class="btn sm hidden" id="nlOff">Me désinscrire</button></div></div>
      <div class="card"><h3>💬 Vos retours</h3><p class="help">Une idée, un problème ? Votre message part directement au créateur d’Ivass AI, nettoyé et chiffré (même si les envois automatiques sont désactivés).</p>
        <div class="row"><button class="btn sm" data-fb="idee">💡 Proposer une idée</button><button class="btn sm" data-fb="bug">🐞 Signaler un problème</button></div></div>
      <div class="card"><h3>🎨 Apparence</h3><div id="lookBox"></div></div>
      <div class="card"><h3>💾 Mes données</h3><div class="row"><button class="btn sm" id="exportBtn">Exporter (JSON)</button><button class="btn sm danger" id="wipeLocal">Tout effacer sur ce téléphone</button></div></div>
      <div class="card"><h3>ℹ️ À propos</h3><p class="help">Ivass AI Mobile ${esc(N.version())} — développé par Messaoud BELGHAZI.</p><div class="row"><button class="btn sm" id="updCheck">✨ Rechercher une mise à jour</button><button class="btn sm" id="legalBtn">Conditions et confidentialité</button></div></div>`, (r) => {
      mountLang(r);
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
      $('#lenF', r).value = S.settings.answerLength || 'equilibre';
      $('#encF', r).checked = S.settings.encyclo !== false;
      $('#svF', r).checked = S.settings.savoir !== false;
      $('#routeF', r).checked = !!S.settings.showRoute;
      $('#mondeF', r).checked = S.settings.monde !== false;
      $('#mondeF', r).onchange = (e) => { S.settings.monde = e.target.checked; saveSettings(); if (e.target.checked) receivePack('monde', 'monde.json', 'monde', true).then((x) => N.toast(`📖 ${x.entries.length} article(s) reçu(s)`)).catch(() => N.toast('Encyclopédie pas encore disponible')); };
      $$('[data-keyless]', r).forEach((cb) => { cb.onchange = () => {
        const k = window.Platforms.KEYLESS.find((x) => x.id === cb.dataset.keyless);
        if (cb.checked) { if (!S.settings.providers.some((p) => p.platform === k.id)) S.settings.providers.push({ id: k.id + '-' + uid().slice(-5), platform: k.id, name: k.name, type: k.type, baseUrl: k.baseUrl, model: k.models[0], models: k.models, priority: k.priority, enabled: true, noKey: true }); }
        else S.settings.providers = S.settings.providers.filter((p) => p.platform !== k.id);
        saveSettings(); openSettings();
      }; });
      $('#olAdd', r).onclick = () => {
        const key = $('#olKey', r).value.trim(); if (key.length < 10) return N.toast('Collez la clé Ollama Cloud');
        const pl = window.Platforms.PLATFORMS.find((x) => x.id === 'ollamacloud');
        const p = { id: 'ollamacloud-' + uid().slice(-5), platform: 'ollamacloud', name: pl.name, type: 'openai', baseUrl: pl.baseUrl, model: 'gpt-oss:20b', models: ['gpt-oss:20b', 'gpt-oss:120b'], priority: 5, enabled: true };
        N.secretSet('key:' + p.id, key); S.settings.providers.push(p); saveSettings(); N.toast('Ollama Cloud ajouté ✓'); openSettings();
      };
      $('#lenF', r).onchange = (e) => { S.settings.answerLength = e.target.value; saveSettings(); };
      $('#encF', r).onchange = (e) => { S.settings.encyclo = e.target.checked; saveSettings(); };
      $('#svF', r).onchange = (e) => { S.settings.savoir = e.target.checked; saveSettings(); if (e.target.checked) receiveSavoir(true).then(() => N.toast(`🌍 Savoir Ivass : ${S.savoir.entries.length} fiche(s)`)).catch(() => {}); };
      $('#routeF', r).onchange = (e) => { S.settings.showRoute = e.target.checked; saveSettings(); renderChat(); };
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
      const nlPaint = () => { const n = contrib.state().newsletter || {}; $('#nlState', r).innerHTML = n.on ? `✓ Inscrit(e) avec <b>${esc(n.email)}</b>` : 'Non inscrit(e).'; $('#nlOff', r).classList.toggle('hidden', !n.on); $('#nlOn', r).textContent = n.on ? '✎ Changer d’adresse' : '📰 M’inscrire'; if (n.on) { $('#nlEmail', r).value = n.email; $('#nlPrenom', r).value = n.prenom || ''; } };
      nlPaint();
      $('#nlOn', r).onclick = async () => {
        if (!$('#nlOk', r).checked) return N.toast('Cochez la case d’accord pour vous inscrire.');
        try { contrib.newsletter({ email: $('#nlEmail', r).value, prenom: $('#nlPrenom', r).value, on: true }); const f = await contrib.flush({ force: true }); N.toast(f.sent ? '📰 Inscription envoyée, merci !' : '📰 Inscription enregistrée : elle partira dès que possible.'); } catch (e) { N.toast(e.message); }
        nlPaint();
      };
      $('#nlOff', r).onclick = async () => { contrib.newsletter({ on: false }); await contrib.flush({ force: true }); N.toast('Désinscription envoyée.'); $('#nlOk', r).checked = false; $('#nlEmail', r).value = ''; nlPaint(); };
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
          <p class="help">${sy.last ? 'Dernière synchro : ' + new Date(sy.last).toLocaleString(window.ivassLocale || 'fr-FR') : 'Jamais synchronisé.'} ${sy.error ? `<br><span class="ko">⚠ ${esc(sy.error)}</span>` : ''}</p></div>
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
        el.innerHTML = p && age < 180 ? `<span class="ok">● En ligne</span> — ${esc(p.name || 'PC')} · ${esc(p.ai || '')} (vu il y a ${age} s)` : `<span class="ko">● Hors ligne</span> — ouvrez Ivass AI sur le PC${p ? ' (vu le ' + new Date(p.at).toLocaleString(window.ivassLocale || 'fr-FR') + ')' : ''}.`;
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

  // ---------------- 📣 Nouveautés publiées par le créateur ----------------
  let news = [];
  async function fetchNews() {
    const got = [];
    const take = async (url) => { try { const r = await N.http({ url, timeout: 12000 }); if (r.ok) { const j = JSON.parse(r.body); got.push(...(j.nouveautes || j.items || [])); } } catch (_) { /* hors ligne */ } };
    const page = (S.config.pageUrl || 'https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/').replace(/\/?$/, '/');
    await Promise.all([S.config.contribServer ? take(S.config.contribServer.replace(/\/+$/, '') + '/v1/nouveautes') : null, take(page + 'nouveautes.json?t=' + Date.now())]);
    const seen = new Set();
    const list = got.filter((x) => x && x.titre && x.texte).map((x) => ({ titre: String(x.titre).slice(0, 140), texte: String(x.texte).slice(0, 2000), lien: /^https:\/\//.test(x.lien || '') ? x.lien : '', version: String(x.version || ''), quand: Number(x.quand) || Date.parse(x.date) || 0 }))
      .filter((x) => { const k = x.titre + '|' + new Date(x.quand).toISOString().slice(0, 10); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.quand - a.quand).slice(0, 30);
    if (list.length) { news = list; N.write('nouveautes.json', list); } else news = N.read('nouveautes.json') || [];
    const unread = news.filter((x) => x.quand > (S.settings.newsSeen || 0)).length;
    const b = $('#newsBadge'); if (b) { b.textContent = unread; b.classList.toggle('hidden', !unread); }
    return news;
  }
  async function openNews() {
    await fetchNews();
    const seen = S.settings.newsSeen || 0;
    openPanel('📣 Nouveautés', news.length ? news.map((x) => `<div class="card"><h3>${esc(x.titre)}${x.quand > seen ? ' <span class="tag">nouveau</span>' : ''}</h3><p class="help">${new Date(x.quand).toLocaleDateString(window.ivassLocale || 'fr-FR')}${x.version ? ' · version ' + esc(x.version) : ''}</p><p style="white-space:pre-wrap">${esc(x.texte)}</p>${x.lien ? `<a href="${esc(x.lien)}">En savoir plus ↗</a>` : ''}</div>`).join('') : '<p class="muted">Pas encore de nouveautés (ou pas de connexion).</p>');
    S.settings.newsSeen = Date.now(); saveSettings();
    const b = $('#newsBadge'); if (b) b.classList.add('hidden');
  }
  setTimeout(() => fetchNews().catch(() => {}), 5000);

  // ---------------- ✨ Mises à jour automatiques ----------------
  const vnum = (v) => String(v || '0').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const newer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  let update = null;
  async function checkUpdate(manual) {
    // Version iPhone / web : pas d'APK, la page se met à jour toute seule (service worker, voir pwa.js).
    if (N.isWeb) { if (manual) { if (window.IvassPWA) window.IvassPWA.checkNow(); N.toast(`Version ${N.version()} : Ivass AI se met à jour tout seul à chaque ouverture ✓`); } return null; }
    // Application iPhone : les mises à jour arrivent par l'App Store / TestFlight.
    if (N.isIOSApp) { if (manual) N.toast(`Version ${N.version()} : les mises à jour arrivent par l’App Store ✓`); return null; }
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
    .finally(() => { if (S.settings.sync.auto) syncNow(false); flushSoon(15000); setTimeout(() => checkUpdate(false), 4000); setTimeout(() => receiveSavoir(false).catch(() => {}), 8000); setTimeout(() => { if (S.settings.monde !== false && S.config.pageUrl) receivePack('monde', 'monde.json', 'monde', false).catch(() => {}); }, 12000); });
  setInterval(() => checkUpdate(false), 6 * 3600e3);
  setInterval(() => contrib.flush().catch(() => {}), 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.settings.sync.auto) syncNow(false); });
  renderChat();
})();
