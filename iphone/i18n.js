/**
 * 🌐 Ivass AI multilingue : traduit l'interface (PC, Android, iPhone, web) sans toucher au code des écrans.
 *
 * Principe : chaque texte affiché est écrit en français dans le code ; ce module le remplace à l'écran par sa
 * traduction (dictionnaire i18n/<langue>.json, clé = texte français). Les textes qui contiennent des valeurs
 * (« 12 fiches ») sont reconnus grâce aux modèles « {} fiches ». Le contenu de l'utilisateur (discussions,
 * réponses, bibliothèque, champs de saisie, code) n'est jamais modifié ni envoyé : seuls les textes du catalogue
 * de l'interface sont traduits.
 *
 * Langues livrées avec une traduction complète, plus d'autres langues traduites à la demande par l'IA de
 * l'utilisateur (uniquement les textes de l'interface, gardés ensuite sur l'appareil).
 * Fonctionne dans le navigateur (window.IvassI18n) et sous Node pour le PC (processus principal) et les tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // full : traduction complète livrée ; les autres : traduites par l'IA à la demande (textes de l'interface seulement)
  const LANGS = [
    { code: 'fr', name: 'Français', en: 'French', full: true },
    { code: 'en', name: 'English', en: 'English', full: true },
    { code: 'ar', name: 'العربية', en: 'Arabic', full: true, rtl: true },
    { code: 'es', name: 'Español', en: 'Spanish', full: true },
    { code: 'de', name: 'Deutsch', en: 'German', full: true },
    { code: 'it', name: 'Italiano', en: 'Italian', full: true },
    { code: 'pt', name: 'Português', en: 'Portuguese', full: true },
    { code: 'ru', name: 'Русский', en: 'Russian', full: true },
    { code: 'tr', name: 'Türkçe', en: 'Turkish', full: true },
    { code: 'ja', name: '日本語', en: 'Japanese', full: true },
    { code: 'zh', name: '中文（简体）', en: 'Chinese (Simplified)', full: true },
    { code: 'nl', name: 'Nederlands', en: 'Dutch' },
    { code: 'pl', name: 'Polski', en: 'Polish' },
    { code: 'uk', name: 'Українська', en: 'Ukrainian' },
    { code: 'ro', name: 'Română', en: 'Romanian' },
    { code: 'el', name: 'Ελληνικά', en: 'Greek' },
    { code: 'cs', name: 'Čeština', en: 'Czech' },
    { code: 'hu', name: 'Magyar', en: 'Hungarian' },
    { code: 'sv', name: 'Svenska', en: 'Swedish' },
    { code: 'da', name: 'Dansk', en: 'Danish' },
    { code: 'nb', name: 'Norsk', en: 'Norwegian (Bokmål)' },
    { code: 'fi', name: 'Suomi', en: 'Finnish' },
    { code: 'ko', name: '한국어', en: 'Korean' },
    { code: 'zh-TW', name: '中文（繁體）', en: 'Chinese (Traditional)' },
    { code: 'hi', name: 'हिन्दी', en: 'Hindi' },
    { code: 'bn', name: 'বাংলা', en: 'Bengali' },
    { code: 'ur', name: 'اردو', en: 'Urdu', rtl: true },
    { code: 'fa', name: 'فارسی', en: 'Persian', rtl: true },
    { code: 'he', name: 'עברית', en: 'Hebrew', rtl: true },
    { code: 'id', name: 'Bahasa Indonesia', en: 'Indonesian' },
    { code: 'ms', name: 'Bahasa Melayu', en: 'Malay' },
    { code: 'vi', name: 'Tiếng Việt', en: 'Vietnamese' },
    { code: 'th', name: 'ไทย', en: 'Thai' },
    { code: 'fil', name: 'Filipino', en: 'Filipino' },
    { code: 'sw', name: 'Kiswahili', en: 'Swahili' },
    { code: 'ca', name: 'Català', en: 'Catalan' },
    { code: 'bg', name: 'Български', en: 'Bulgarian' },
    { code: 'sr', name: 'Srpski', en: 'Serbian (Latin)' },
    { code: 'hr', name: 'Hrvatski', en: 'Croatian' },
    { code: 'sk', name: 'Slovenčina', en: 'Slovak' },
    { code: 'az', name: 'Azərbaycanca', en: 'Azerbaijani' },
    { code: 'kk', name: 'Қазақша', en: 'Kazakh' },
    { code: 'uz', name: 'Oʻzbekcha', en: 'Uzbek' },
    { code: 'am', name: 'አማርኛ', en: 'Amharic' },
    { code: 'ha', name: 'Hausa', en: 'Hausa' },
    { code: 'wo', name: 'Wolof', en: 'Wolof' },
  ];
  const byCode = Object.fromEntries(LANGS.map((l) => [l.code, l]));
  const info = (code) => byCode[code] || byCode.fr;

  /** Langue de l'appareil, si Ivass la connaît (« ar-MA » → « ar », « zh-Hant » → « zh-TW »). */
  function detect(list) {
    for (let raw of [].concat(list || []).filter(Boolean)) {
      raw = String(raw);
      if (/^zh[-_](tw|hk|mo|hant)/i.test(raw)) return 'zh-TW';
      const c = raw.toLowerCase().split(/[-_]/)[0];
      const code = c === 'no' || c === 'nn' ? 'nb' : c === 'tl' ? 'fil' : c;
      if (byCode[code]) return code;
    }
    return 'fr';
  }

  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /** Dictionnaire compilé : textes exacts + modèles « {} ». */
  const apo = (s) => s.replace(/[’‘]/g, "'"); // « Aujourd’hui » = « Aujourd'hui »
  function compile(dict) {
    const exact = new Map(), patterns = [];
    for (let [fr, tr] of Object.entries(dict || {})) {
      fr = apo(fr);
      if (typeof tr !== 'string' || !tr) continue;
      if (fr.includes('{}')) {
        const chunks = fr.split('{}');
        if (!chunks.some((c) => /\p{L}/u.test(c))) continue;
        const re = new RegExp('^' + chunks.map(esc).join('([\\s\\S]+?)') + '$');
        const longest = chunks.reduce((a, b) => (b.length > a.length ? b : a), '');
        patterns.push({ re, tr, longest, weight: chunks.join('').length });
      } else exact.set(fr, tr);
    }
    // valeur facultative en fin de phrase (« …l’origine{}. », « …l’apprend. {} ») : la phrase seule est aussi connue
    for (let [fr, tr] of Object.entries(dict || {})) {
      fr = apo(fr);
      if (typeof tr !== 'string' || (fr.match(/\{\}/g) || []).length !== 1 || (tr.match(/\{\d*\}/g) || []).length !== 1) continue;
      if (!/\{\}$|\{\}[.…,:;!?)]+$/.test(fr) || !/\{\d*\}$|\{\d*\}[.…,:;!?)。．！？）]+$/.test(tr)) continue;
      const k = norm(fr.replace('{}', '')), v = norm(tr.replace(/\{\d*\}/, ''));
      if (k && v && !exact.has(k)) exact.set(k, v);
    }
    patterns.sort((a, b) => b.weight - a.weight);
    return { exact, patterns };
  }
  function fill(tr, vals) {
    let i = 0;
    return tr.replace(/\{(\d*)\}/g, (_, n) => { const v = n ? vals[+n - 1] : vals[i++]; return v === undefined ? '' : v; });
  }
  /** Traduit un texte (déjà sans espaces superflus) ; renvoie null si inconnu. */
  function lookup(c, s) {
    if (!c || !s) return null;
    s = apo(s);
    const hit = c.exact.get(s);
    if (hit !== undefined) return hit;
    for (const p of c.patterns) {
      if (p.longest && !s.includes(p.longest)) continue;
      const m = p.re.exec(s);
      if (m) return fill(p.tr, m.slice(1).map((v) => lookup(c, v) || v));
    }
    // emoji ou symbole devant le texte (« 📖 Wikipédia », « ○ Lecture de l’écran ») : traduire le reste
    const e = /^((?:[\p{Extended_Pictographic}\u2190-\u21ff\u2600-\u27bf\u25a0-\u25ff\u2b00-\u2bff\u2190-\u21ff✓✗★☆]|\ufe0f|\u200d)+\s*)(\S.*)$/u.exec(s);
    if (e) { const r = lookup(c, e[2]); if (r != null) return e[1] + r; }
    // séparateur collé au texte (« — 2 demandes par minute », « Modèle : ») : traduire le reste
    const a = /^([—–·•|:,-]+\s*)(\S.*)$/.exec(s);
    if (a) { const r = lookup(c, a[2]); if (r != null) return a[1] + r; }
    const z = /^(.*\S)(\s*[—–·•|:,-]+)$/.exec(s);
    if (z) { const r = lookup(c, z[1]); if (r != null) return r + z[2].replace(/^\s+:$/, ':'); } // « Modèle : » → « Model: »
    return null;
  }

  // ---------------- Navigateur : traduction de l'écran ----------------
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'data-tip'];
  const DEFAULT_SKIP = 'script,style,textarea,pre,code,[contenteditable=""],[contenteditable="true"],.no-i18n,[data-noi18n]';

  function createDom(opts = {}) {
    const doc = opts.document || (typeof document !== 'undefined' ? document : null);
    const skipSel = [DEFAULT_SKIP].concat(opts.skip || []).join(',');
    let lang = 'fr', dict = null, observer = null;
    const origText = new WeakMap(), setText = new WeakMap(), origAttr = new WeakMap();
    const missing = new Set();
    const catalog = opts.catalog || null;

    // zones jamais traduites (contenu de l'utilisateur, réponses des IA)… sauf leurs boutons d'interface (unskip)
    const unSel = (opts.unskip || []).join(',');
    const skipped = (el) => {
      if (!el || !el.closest) return true;
      const s = el.closest(skipSel);
      if (!s) return false;
      if (!unSel) return true;
      const on = el.closest(unSel);
      return !(on && s.contains(on));
    };
    // champ de saisie : son contenu appartient à l'utilisateur, mais son placeholder/title est de l'interface
    const field = (el) => el && el.tagName === 'TEXTAREA' && !skipped(el.parentElement);
    const reopen = (el) => { if (unSel && el.querySelectorAll) for (const x of el.querySelectorAll(unSel)) if (!skipped(x)) walk(x); };
    const tr = (s) => {
      const k = norm(s);
      if (!k || lang === 'fr') return null;
      const out = lookup(dict, k);
      if (out == null && catalog && catalog.has(k)) missing.add(k);
      return out;
    };
    function doText(node) {
      const cur = node.data;
      if (setText.get(node) === cur) return; // c'est nous qui l'avons écrit
      origText.set(node, cur);
      if (lang === 'fr') return;
      const t = tr(cur);
      if (t == null) return;
      const lead = cur.match(/^\s*/)[0], trail = cur.match(/\s*$/)[0];
      const v = lead + t + trail;
      setText.set(node, v);
      if (v !== cur) node.data = v;
    }
    function doAttrs(el) {
      for (const a of ATTRS) {
        if (!el.hasAttribute || !el.hasAttribute(a)) continue;
        const cur = el.getAttribute(a);
        let o = origAttr.get(el); if (!o) origAttr.set(el, (o = {}));
        if (o['>' + a] === cur) continue; // notre propre traduction
        o[a] = cur;
        const t = lang === 'fr' ? null : tr(cur);
        if (t != null && t !== cur) { o['>' + a] = t; el.setAttribute(a, t); }
      }
      if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type) && el.value) {
        let o = origAttr.get(el); if (!o) origAttr.set(el, (o = {}));
        if (o['>value'] !== el.value) { o.value = el.value; const t = tr(el.value); if (t != null) { o['>value'] = t; el.value = t; } }
      }
    }
    function walk(root) {
      if (!root) return;
      if (root.nodeType === 3) { if (!skipped(root.parentElement)) doText(root); return; }
      if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
      if (root.nodeType === 1 && skipped(root)) { if (field(root)) doAttrs(root); reopen(root); return; }
      if (root.nodeType === 1) doAttrs(root);
      const closed = [];
      const tw = doc.createTreeWalker(root, 5 /* éléments + textes */, {
        acceptNode: (n) => { if (n.nodeType === 1 && n.matches(skipSel)) { if (field(n)) doAttrs(n); closed.push(n); return 2; /* rejeter le sous-arbre */ } return 1; },
      });
      let n;
      while ((n = tw.nextNode())) { if (n.nodeType === 3) { if (/\S/.test(n.data)) doText(n); } else doAttrs(n); }
      for (const c of closed) reopen(c);
    }
    function restore(root) {
      const tw = doc.createTreeWalker(root, 5);
      let n;
      while ((n = tw.nextNode())) {
        // retour au français d'origine, puis oubli de la traduction précédente : la nouvelle langue la remplacera
        if (n.nodeType === 3) { const o = origText.get(n); if (o !== undefined && n.data === setText.get(n)) { setText.delete(n); n.data = o; } }
        else { const o = origAttr.get(n); if (o) for (const a of ATTRS.concat('value')) if (o[a] !== undefined && (a === 'value' ? n.value : n.getAttribute(a)) === o['>' + a]) { if (a === 'value') n.value = o[a]; else n.setAttribute(a, o[a]); delete o['>' + a]; } }
      }
    }
    function observe() {
      if (observer || !doc.body || typeof MutationObserver === 'undefined') return;
      observer = new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === 'childList') { for (const n of m.addedNodes) if (n.nodeType === 3 ? !skipped(n.parentElement) : true) walk(n); }
          else if (m.type === 'characterData') { if (!skipped(m.target.parentElement)) doText(m.target); }
          else if (m.type === 'attributes' && (!skipped(m.target) || field(m.target))) doAttrs(m.target);
        }
      });
      observer.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat('value') });
    }
    function apply(code, dictionary) {
      const prev = lang;
      lang = code || 'fr'; dict = lang === 'fr' ? null : compile(dictionary);
      const l = info(lang);
      doc.documentElement.lang = lang;
      doc.documentElement.dir = l.rtl ? 'rtl' : 'ltr';
      doc.documentElement.classList.toggle('rtl', !!l.rtl);
      if (prev !== 'fr') restore(doc.body);
      if (!doc.__ivassTitle) doc.__ivassTitle = doc.title;
      doc.title = lang === 'fr' ? doc.__ivassTitle : (tr(doc.__ivassTitle) || doc.__ivassTitle);
      walk(doc.body);
      observe();
    }
    return {
      apply,
      walk,
      t: (s, ...vals) => { const base = vals.length ? fill(String(s), vals) : String(s); if (lang === 'fr') return base; return tr(base) ?? base; },
      get lang() { return lang; },
      get missing() { return missing; },
    };
  }

  /**
   * Langue affichée par Ivass (PC, Android, iPhone) : charge le dictionnaire, traduit l'écran, garde le choix.
   * o = { load(code) → Promise<objet dictionnaire>, save(code), skip, unskip, catalog: Set, onChange }
   */
  function setup(o) {
    const dom = createDom({ skip: o.skip, unskip: o.unskip, catalog: o.catalog });
    const nat = typeof window !== 'undefined' ? { alert: window.alert, confirm: window.confirm, prompt: window.prompt } : null;
    if (nat) { // les boîtes de dialogue du navigateur aussi
      window.alert = (m) => nat.alert.call(window, dom.t(m));
      window.confirm = (m) => nat.confirm.call(window, dom.t(m));
      window.prompt = (m, d) => nat.prompt.call(window, dom.t(m), d);
    }
    async function use(code, persist) {
      code = byCode[code] ? code : 'fr';
      let d = {};
      if (code !== 'fr') { try { d = (await o.load(code)) || {}; } catch (_) { d = {}; } }
      dom.apply(code, d);
      if (persist && o.save) o.save(code);
      if (o.onChange) o.onChange(code);
      return code;
    }
    return { use, t: dom.t, dom, get lang() { return dom.lang; } };
  }

  /**
   * Traduction par l'IA des textes de l'interface manquants (langues sans traduction livrée).
   * Seuls les textes du catalogue partent vers l'IA ; jamais le contenu de l'utilisateur.
   * ask(prompt) → Promise<texte> ; renvoie { done, total } et appelle onPart(dictPartiel) au fur et à mesure.
   */
  async function translateMissing({ lang, keys, have = {}, ask, onPart, batch = 60, signal }) {
    const l = info(lang);
    const todo = keys.filter((k) => !have[k]);
    const out = {};
    let done = 0;
    for (let i = 0; i < todo.length; i += batch) {
      if (signal && signal.aborted) break;
      const part = todo.slice(i, i + batch);
      const prompt = `Translate these user-interface strings of the app "Ivass AI" from French to ${l.en} (${l.name}).\n` +
        'Rules: keep emojis, punctuation style, «{}» placeholders (same count, same order), product names (Ivass AI, Gemini, Groq, Ollama, GitHub…), file extensions and keyboard keys unchanged. Short and natural, as in a real app.\n' +
        'Answer ONLY with a JSON array of strings, same length and order as the input.\n\n' + JSON.stringify(part);
      try {
        const txt = await ask(prompt);
        const arr = JSON.parse(String(txt).slice(String(txt).indexOf('['), String(txt).lastIndexOf(']') + 1));
        if (Array.isArray(arr) && arr.length === part.length) {
          const got = {};
          part.forEach((k, j) => { const v = arr[j]; if (typeof v === 'string' && v.trim() && (k.match(/\{\}/g) || []).length === (v.match(/\{\d*\}/g) || []).length) got[k] = v.trim(); });
          Object.assign(out, got); done += Object.keys(got).length;
          if (onPart) onPart(got);
        }
      } catch (_) { /* lot suivant */ }
    }
    return { done, total: todo.length, dict: out };
  }

  /** Consigne de langue pour l'IA : répondre dans la langue de l'utilisateur (n'importe laquelle). */
  function answerRule(code) {
    const l = info(code);
    return code === 'fr'
      ? 'LANGUE : réponds dans la langue de l’utilisateur (français par défaut). Si la question est écrite dans une autre langue, réponds dans cette langue.'
      : `LANGUAGE: always answer in the user's language. The app is set to ${l.en} (${l.name}): answer in ${l.en} by default; if the user writes in another language, answer in that language. Keep code, commands and names unchanged.`;
  }

  return { LANGS, info, detect, compile, lookup, fill, norm, createDom, setup, translateMissing, answerRule };
});
