/**
 * 📎 Pièces jointes d'Ivass AI Mobile : images, vidéos, PDF, Word, Excel, PowerPoint, OpenDocument, textes et code.
 * Tout est lu SUR LE TÉLÉPHONE : rien ne part ailleurs qu'à l'IA choisie, avec le message.
 *   - images : réduites à 1 600 px (JPEG) pour l'IA + vignette de 240 px gardée dans la discussion ;
 *   - vidéo : envoyée telle quelle à Gemini (15 Mo au plus) ; les autres IA reçoivent une note ;
 *   - documents : texte extrait (tableaux Excel en tableaux Markdown), joint au message.
 */
(function (root) {
  'use strict';
  const MAX_TEXT = 200000;
  const MAX_VIDEO = 15 * 1024 * 1024;
  const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|xml|html?|css|js|mjs|ts|tsx|jsx|py|java|kt|c|cc|cpp|h|cs|go|rs|php|rb|sh|bat|ps1|sql|yaml|yml|ini|log|srt|vtt)$/i;
  const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
  const clean = (t) => String(t || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TEXT);

  const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

  /** Image → { data (base64 JPEG ≤ 1600 px), thumb (dataURL ≤ 240 px) } */
  function image(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const draw = (max, q) => {
          const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * r)); c.height = Math.max(1, Math.round(img.naturalHeight * r));
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          return c.toDataURL('image/jpeg', q);
        };
        const full = draw(1600, 0.85), thumb = draw(240, 0.7);
        URL.revokeObjectURL(url);
        resolve({ mime: 'image/jpeg', data: full.split(',')[1], thumb });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible (format non pris en charge par le téléphone).')); };
      img.src = url;
    });
  }

  // ---------------------------------------------------------------- ZIP (Word, Excel, PowerPoint, OpenDocument)
  async function inflate(data) {
    const ds = new DecompressionStream('deflate-raw');
    const out = new Response(new Blob([data]).stream().pipeThrough(ds));
    return new Uint8Array(await out.arrayBuffer());
  }
  /** Lit le répertoire central d'un ZIP → { nom: async () => texte } */
  async function unzip(buf) {
    const u = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Fichier abîmé (archive illisible).');
    const n = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    const dec = new TextDecoder();
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = dec.decode(u.subarray(p + 46, p + 46 + nl));
      files[name] = async () => {
        const ln = dv.getUint16(off + 26, true), le = dv.getUint16(off + 28, true);
        const raw = u.subarray(off + 30 + ln + le, off + 30 + ln + le + csize);
        return dec.decode(method === 0 ? raw : await inflate(raw));
      };
      p += 46 + nl + el + cl;
    }
    return files;
  }
  const xmlText = (xml) => ent(xml.replace(/<w:tab\/>/g, '\t').replace(/<(w:p|a:p|text:p|text:h)[ >][\s\S]*?<\/\1>/g, (q) => q.replace(/<[^>]+>/g, '') + '\n').replace(/<[^>]+>/g, ''));
  async function docx(z) {
    if (!z['word/document.xml']) throw new Error('Document Word illisible.');
    let xml = await z['word/document.xml']();
    xml = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) => {
      const rows = [...tbl.matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g)].map((r) => [...r[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((c) => xmlText(c[0]).replace(/\s+/g, ' ').trim().replace(/\|/g, '/')));
      if (!rows.length) return '';
      const w = Math.max(...rows.map((r) => r.length));
      const line = (r) => '| ' + Array.from({ length: w }, (_, i) => r[i] || '').join(' | ') + ' |';
      return '<w:p>' + [line(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(line)].join('</w:p><w:p>') + '</w:p>';
    });
    return xmlText(xml);
  }
  async function pptx(z) {
    const slides = Object.keys(z).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => +a.match(/(\d+)\.xml/)[1] - +b.match(/(\d+)\.xml/)[1]);
    const out = [];
    for (const [i, f] of slides.entries()) out.push(`## Diapositive ${i + 1}\n${clean(xmlText(await z[f]()))}`);
    return out.join('\n\n');
  }
  async function xlsx(z) {
    const shared = z['xl/sharedStrings.xml'] ? [...(await z['xl/sharedStrings.xml']()).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => ent(m[1].replace(/<[^>]+>/g, ''))) : [];
    const wb = z['xl/workbook.xml'] ? await z['xl/workbook.xml']() : '';
    const names = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => ent(m[1]));
    const sheets = Object.keys(z).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a, b) => +a.match(/(\d+)\.xml/)[1] - +b.match(/(\d+)\.xml/)[1]).slice(0, 5);
    const col = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
    const out = [];
    for (const [i, f] of sheets.entries()) {
      const xml = await z[f]();
      const rows = [];
      for (const r of [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].slice(0, 200)) {
        const cells = [];
        for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const ref = (c[1].match(/r="([A-Z]+\d+)"/) || [])[1] || '';
          const t = (c[1].match(/t="(\w+)"/) || [])[1];
          const v = ((c[2] || '').match(/<v>([\s\S]*?)<\/v>/) || [])[1];
          const is = ((c[2] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1];
          const val = t === 's' ? shared[+v] || '' : t === 'inlineStr' ? ent(is || '') : v != null ? ent(v) : '';
          cells[ref ? col(ref) : cells.length] = String(val).replace(/\|/g, '/').replace(/\s+/g, ' ');
        }
        if (cells.some((x) => x)) rows.push(cells);
      }
      if (!rows.length) continue;
      const w = Math.max(...rows.map((r) => r.length));
      const line = (r) => '| ' + Array.from({ length: w }, (_, k) => r[k] || '').join(' | ') + ' |';
      out.push(`## Feuille « ${names[i] || 'Feuille ' + (i + 1)} » (${rows.length} lignes)\n` + [line(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(line)].join('\n'));
    }
    return out.join('\n\n');
  }
  async function odt(z) { if (!z['content.xml']) throw new Error('Document OpenDocument illisible.'); return xmlText(await z['content.xml']()); }

  // ---------------------------------------------------------------- PDF (pdf.js, chargé seulement quand il sert)
  let pdfjs = null;
  async function pdf(buf) {
    if (!pdfjs) {
      pdfjs = await import('./vendor/pdfjs/pdf.min.js');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.js', location.href).href;
    }
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
    const pages = [];
    let size = 0;
    for (let i = 1; i <= Math.min(doc.numPages, 300) && size < MAX_TEXT; i++) {
      const c = await (await doc.getPage(i)).getTextContent();
      const t = c.items.map((x) => x.str + (x.hasEOL ? '\n' : ' ')).join('').trim();
      pages.push(`--- page ${i} ---\n${t}`); size += t.length;
    }
    const text = pages.join('\n\n');
    if (!text.replace(/--- page \d+ ---/g, '').trim()) throw new Error('PDF scanné (images) : pas de texte à lire. Prenez plutôt une photo des pages.');
    return text;
  }

  /** Lit un fichier choisi → { name, kind: 'image'|'video'|'doc', mime, size, data?, thumb?, text? } */
  async function read(file) {
    const name = file.name || 'fichier';
    const type = file.type || '';
    if (/^image\//.test(type) || /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(name)) return { name, kind: 'image', size: file.size, ...(await image(file)) };
    if (/^video\//.test(type) || /\.(mp4|mov|webm|3gp|mkv)$/i.test(name)) {
      if (file.size > MAX_VIDEO) throw new Error(`« ${name} » est trop lourde (${(file.size / 1048576).toFixed(0)} Mo) : 15 Mo au plus. Coupez la vidéo ou envoyez une capture.`);
      return { name, kind: 'video', size: file.size, mime: /^video\//.test(type) ? type : 'video/mp4', data: b64(await file.arrayBuffer()) };
    }
    const buf = await file.arrayBuffer();
    let text;
    if (/\.pdf$/i.test(name) || type === 'application/pdf') text = await pdf(buf);
    else if (/\.(docx|xlsx|xlsm|pptx|odt)$/i.test(name)) {
      const z = await unzip(buf);
      text = /\.docx$/i.test(name) ? await docx(z) : /\.pptx$/i.test(name) ? await pptx(z) : /\.odt$/i.test(name) ? await odt(z) : await xlsx(z);
    } else if (TEXT_EXT.test(name) || /^text\//.test(type) || type === 'application/json') text = new TextDecoder().decode(buf);
    else throw new Error(`« ${name} » : format non pris en charge. Images, vidéos, PDF, Word, Excel, PowerPoint, textes et code sont acceptés.`);
    text = clean(text);
    if (!text) throw new Error(`« ${name} » ne contient pas de texte lisible.`);
    return { name, kind: 'doc', size: file.size, text };
  }

  root.IvassFichiers = { read, unzip, MAX_VIDEO };
})(typeof self !== 'undefined' ? self : this);
