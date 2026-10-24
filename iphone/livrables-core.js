/**
 * 📦 Livrables — cœur commun à Ivass AI PC (Node/Electron) et Ivass AI Mobile (Android, iPhone).
 * L'IA écrit un bloc  ```livrable:nom.ext  … ```  et ce module fabrique le fichier :
 *   .docx (Word) · .pdf · .xlsx (Excel) · .pptx (PowerPoint) · .csv · .json · .md · .txt · .html · .svg …
 * Aucune dépendance au disque : build() renvoie les octets ; les bibliothèques (docx, exceljs, pptxgenjs, pdfmake)
 * sont fournies par l'appelant (require sur PC, chargement à la demande sur téléphone).
 * Fichier partagé : src/livrables-core.js (PC) = www/livrables-core.js (mobile).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LivrablesCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KINDS = {
    docx: 'Document Word', pdf: 'Document PDF', xlsx: 'Classeur Excel', pptx: 'Présentation PowerPoint',
    csv: 'Tableau CSV', tsv: 'Tableau TSV', json: 'Données JSON', md: 'Texte Markdown', txt: 'Texte', html: 'Page web', htm: 'Page web',
    svg: 'Image vectorielle', xml: 'Données XML', sql: 'Base de données SQL', ics: 'Événement de calendrier', vcf: 'Contact', yaml: 'Données YAML', yml: 'Données YAML',
  };
  const EXTS = new Set(Object.keys(KINDS));

  /** Nom de fichier sûr (jamais de dossier), extension connue (sinon .md). */
  function safeName(n) {
    let s = String(n || '').trim().replace(/\\/g, '/').split('/').pop().replace(/[<>:"|?*\x00-\x1f]/g, '_').replace(/\s+/g, '-').replace(/^\.+/, '');
    if (!s) s = 'document.md';
    let ext = (s.match(/\.([a-z0-9]+)$/i) || [])[1];
    if (!ext || !EXTS.has(ext.toLowerCase())) { s += '.md'; ext = 'md'; }
    s = s.slice(0, s.length - ext.length) + ext.toLowerCase();
    return s.length > 120 ? s.slice(0, 110 - ext.length) + '.' + ext.toLowerCase() : s;
  }
  // ------------------------------------------------------------------ Markdown → blocs
  function parseBlocks(md) {
    const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let para = [];
    const flush = () => { if (para.length) { out.push({ t: 'p', text: para.join(' ').trim() }); para = []; } };
    const isSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
    const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      let m;
      if (/^\s*```/.test(l)) {
        flush();
        const lang = l.trim().slice(3).trim(); const buf = [];
        for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) buf.push(lines[i]);
        out.push({ t: 'code', lang, text: buf.join('\n') });
      } else if ((m = l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/))) { flush(); out.push({ t: 'h', level: m[1].length, text: m[2] }); }
      else if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && isSep(lines[i + 1])) {
        flush();
        const head = cells(l); const rows = [];
        for (i += 2; i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]); i++) rows.push(cells(lines[i]));
        i--;
        out.push({ t: 'table', head, rows });
      } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { flush(); out.push({ t: 'hr' }); }
      else if ((m = l.match(/^(\s*)([-*+•]|\d+[.)])\s+(.*)$/))) {
        flush();
        out.push({ t: 'li', ordered: /\d/.test(m[2]), level: Math.min(4, Math.floor(m[1].replace(/\t/g, '  ').length / 2)), text: m[3] });
      } else if ((m = l.match(/^\s*>\s?(.*)$/))) { flush(); out.push({ t: 'quote', text: m[1] }); }
      else if (!l.trim()) flush();
      else para.push(l.trim());
    }
    flush();
    return out;
  }
  /** Texte enrichi : **gras**, *italique*, `code`, [lien](url) → morceaux. */
  function runs(text) {
    const out = [];
    const re = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
    let last = 0, m;
    const s = String(text || '');
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ text: s.slice(last, m.index) });
      if (m[2] != null) out.push({ text: m[2], bold: true });
      else if (m[4] != null) out.push({ text: m[4], italics: true });
      else if (m[5] != null) out.push({ text: m[5], code: true });
      else if (m[6] != null) out.push({ text: `${m[6]} (${m[7]})` });
      last = re.lastIndex;
    }
    if (last < s.length) out.push({ text: s.slice(last) });
    return out.length ? out : [{ text: '' }];
  }
  const plain = (t) => runs(t).map((r) => r.text).join('');

  // ------------------------------------------------------------------ Word (.docx)
  async function toDocx(md, title, D) {
    const blocks = parseBlocks(md);
    const children = [];
    const tr = (t, extra = {}) => runs(t).map((r) => new D.TextRun({ text: r.text, bold: r.bold || extra.bold, italics: r.italics || extra.italics, font: r.code ? 'Consolas' : undefined, color: extra.color }));
    let listInst = 0, inList = false;
    const H = [D.HeadingLevel.HEADING_1, D.HeadingLevel.HEADING_2, D.HeadingLevel.HEADING_3, D.HeadingLevel.HEADING_4, D.HeadingLevel.HEADING_5, D.HeadingLevel.HEADING_6];
    let firstH1 = true;
    for (const b of blocks) {
      if (b.t !== 'li') { if (inList) listInst++; inList = false; }
      if (b.t === 'h') {
        if (b.level === 1 && firstH1) { children.push(new D.Paragraph({ heading: D.HeadingLevel.TITLE, children: tr(b.text) })); firstH1 = false; } else children.push(new D.Paragraph({ heading: H[b.level - 1], children: tr(b.text) }));
      } else if (b.t === 'p') children.push(new D.Paragraph({ children: tr(b.text), spacing: { after: 120 } }));
      else if (b.t === 'li') {
        inList = true;
        children.push(new D.Paragraph({ children: tr(b.text), numbering: { reference: b.ordered ? 'num' : 'puce', level: b.level, instance: b.ordered ? listInst : 0 } }));
      } else if (b.t === 'quote') children.push(new D.Paragraph({ children: tr(b.text, { italics: true, color: '555B66' }), indent: { left: 540 }, border: { left: { style: D.BorderStyle.SINGLE, size: 12, color: '9198A5', space: 8 } } }));
      else if (b.t === 'hr') children.push(new D.Paragraph({ children: [], border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'C9CED6', space: 1 } } }));
      else if (b.t === 'code') for (const line of b.text.split('\n')) children.push(new D.Paragraph({ children: [new D.TextRun({ text: line || ' ', font: 'Consolas', size: 19 })], shading: { type: D.ShadingType.CLEAR, fill: 'F2F3F5', color: 'auto' }, spacing: { after: 0 } }));
      else if (b.t === 'table') {
        const ncol = Math.max(b.head.length, ...b.rows.map((r) => r.length));
        const row = (cs, head) => new D.TableRow({ tableHeader: head, children: Array.from({ length: ncol }, (_, k) => new D.TableCell({
          children: [new D.Paragraph({ children: tr(cs[k] || '', head ? { bold: true, color: 'FFFFFF' } : {}) })],
          shading: head ? { type: D.ShadingType.CLEAR, fill: '1D2026', color: 'auto' } : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
        })) });
        children.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: [row(b.head, true), ...b.rows.map((r) => row(r, false))] }));
        children.push(new D.Paragraph({ children: [] }));
      }
    }
    if (!children.length) children.push(new D.Paragraph({ children: [new D.TextRun(' ')] }));
    const lvl = (fmt, texts) => texts.map((text, level) => ({ level, format: fmt, text, alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } } }));
    const doc = new D.Document({
      creator: 'Ivass AI', title: title || 'Document', description: 'Créé avec Ivass AI',
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      numbering: { config: [
        { reference: 'puce', levels: lvl(D.LevelFormat.BULLET, ['•', '◦', '▪', '•', '◦']) },
        { reference: 'num', levels: lvl(D.LevelFormat.DECIMAL, ['%1.', '%2.', '%3.', '%4.', '%5.']) },
      ] },
      sections: [{
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ children: ['Page ', D.PageNumber.CURRENT, ' / ', D.PageNumber.TOTAL_PAGES], size: 18, color: '7A808C' })] })] }) },
        children,
      }],
    });
    return new Uint8Array(await D.Packer.toArrayBuffer(doc));
  }

  // ------------------------------------------------------------------ Excel (.xlsx)
  function sheetsFrom(content) {
    const s = String(content || '').trim();
    // 1) JSON : { feuilles: [{ nom, colonnes, lignes }] } ou tableau d'objets
    if (/^[[{]/.test(s)) {
      try {
        const j = JSON.parse(s);
        const list = Array.isArray(j) ? [{ nom: 'Feuille1', objets: j }] : (j.feuilles || j.sheets || [j]);
        return list.map((f, i) => {
          if (f.objets || (Array.isArray(f.lignes || f.rows) && (f.lignes || f.rows).length && !Array.isArray((f.lignes || f.rows)[0]) && typeof (f.lignes || f.rows)[0] === 'object')) {
            const objs = f.objets || f.lignes || f.rows;
            const cols = [...new Set(objs.flatMap((o) => Object.keys(o || {})))];
            return { name: f.nom || f.name || `Feuille${i + 1}`, head: cols, rows: objs.map((o) => cols.map((c) => o[c])) };
          }
          return { name: f.nom || f.name || `Feuille${i + 1}`, head: f.colonnes || f.columns || [], rows: f.lignes || f.rows || [] };
        });
      } catch (_) { /* pas du JSON : on continue */ }
    }
    // 2) Tableaux Markdown (titre « ## Nom » avant un tableau = nom de la feuille)
    const blocks = parseBlocks(s);
    const tables = [];
    let lastTitle = '';
    for (const b of blocks) { if (b.t === 'h') lastTitle = plain(b.text); if (b.t === 'table') { tables.push({ name: lastTitle || `Feuille${tables.length + 1}`, head: b.head.map(plain), rows: b.rows.map((r) => r.map(plain)) }); lastTitle = ''; } }
    if (tables.length) return tables;
    // 3) CSV / TSV
    const lines = s.split(/\r?\n/).filter((l) => l.trim());
    const first = lines[0] || '';
    const sep = (first.match(/\t/g) || []).length ? '\t' : (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
    const parseLine = (l) => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
    const rows = lines.map(parseLine);
    return [{ name: 'Feuille1', head: rows[0] || [], rows: rows.slice(1) }];
  }
  function cellValue(v) {
    if (v == null) return { v: null };
    if (typeof v === 'number' || typeof v === 'boolean') return { v };
    const s = String(v).trim();
    if (/^=/.test(s)) return { v: { formula: s.slice(1) } };
    let m;
    if ((m = s.match(/^(-?\d{1,3}(?:[   ]\d{3})*|-?\d+)([.,]\d+)?\s*(€|EUR|\$|DA|DZD)$/i))) return { v: Number((m[1] + (m[2] || '')).replace(/[   ]/g, '').replace(',', '.')), fmt: /\$/.test(m[3]) ? '#,##0.00 [$$-409]' : /DA|DZD/i.test(m[3]) ? '#,##0.00 "DA"' : '#,##0.00 €' };
    if ((m = s.match(/^(-?\d+(?:[.,]\d+)?)\s*%$/))) return { v: Number(m[1].replace(',', '.')) / 100, fmt: '0%' };
    if (/^-?(?:0|[1-9]\d{0,14})(?:[.,]\d+)?$/.test(s)) return { v: Number(s.replace(',', '.')) };
    if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) return { v: new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])), fmt: 'dd/mm/yyyy' };
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return { v: new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])), fmt: 'dd/mm/yyyy' };
    return { v: s };
  }
  async function toXlsx(content, ExcelJS) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Ivass AI'; wb.created = new Date();
    const used = new Set();
    for (const sh of sheetsFrom(content)) {
      let name = String(sh.name || 'Feuille').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Feuille';
      for (let i = 2; used.has(name.toLowerCase()); i++) name = name.slice(0, 28) + ' ' + i;
      used.add(name.toLowerCase());
      const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: sh.head.length ? 1 : 0 }] });
      const ncol = Math.max(sh.head.length, ...sh.rows.map((r) => r.length), 1);
      if (sh.head.length) {
        const hr = ws.addRow(sh.head.map(plain));
        hr.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2026' } }; c.alignment = { vertical: 'middle' }; });
        hr.height = 20;
      }
      for (const r of sh.rows) {
        const vals = Array.from({ length: ncol }, (_, k) => cellValue(r[k]));
        const row = ws.addRow(vals.map((x) => x.v));
        vals.forEach((x, k) => { if (x.fmt) row.getCell(k + 1).numFmt = x.fmt; });
      }
      for (let k = 1; k <= ncol; k++) {
        let w = 8;
        ws.getColumn(k).eachCell({ includeEmpty: false }, (c) => { const t = c.value && c.value.formula ? 12 : String(c.value instanceof Date ? '00/00/0000' : c.value == null ? '' : c.value).length; w = Math.max(w, Math.min(60, t + 2)); });
        ws.getColumn(k).width = w;
      }
      if (sh.head.length && sh.rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ncol } };
    }
    if (!wb.worksheets.length) wb.addWorksheet('Feuille1');
    const buf = await wb.xlsx.writeBuffer();
    return new Uint8Array(buf.buffer ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf);
  }

  // ------------------------------------------------------------------ PowerPoint (.pptx)
  function slidesFrom(md) {
    const blocks = parseBlocks(md);
    const hasHr = blocks.some((b) => b.t === 'hr');
    const slides = [];
    let cur = null;
    const start = () => { cur = { title: '', subtitle: '', items: [], table: null, notes: '' }; slides.push(cur); };
    for (const b of blocks) {
      if (b.t === 'hr') { start(); continue; }
      if (b.t === 'h' && (!hasHr ? b.level <= 2 : !cur || !cur.title)) { if (!hasHr || !cur) start(); cur.title = plain(b.text); continue; }
      if (!cur) start();
      if (b.t === 'h') cur.items.push({ text: plain(b.text), level: 0, bold: true });
      else if (b.t === 'li') cur.items.push({ text: b.text, level: b.level });
      else if (b.t === 'p') { const m = b.text.match(/^\**notes?\s*:\**\s*(.*)$/i); if (m) cur.notes += m[1] + '\n'; else if (!cur.items.length && !cur.subtitle && b.text.length < 140) cur.subtitle = b.text; else cur.items.push({ text: b.text, level: 0 }); }
      else if (b.t === 'quote') { const m = b.text.match(/^\**notes?\s*:\**\s*(.*)$/i); if (m) cur.notes += m[1] + '\n'; else cur.items.push({ text: '« ' + b.text + ' »', level: 0 }); }
      else if (b.t === 'table' && !cur.table) cur.table = b;
      else if (b.t === 'code') cur.items.push({ text: b.text, level: 0, code: true });
    }
    return slides.filter((s) => s.title || s.items.length || s.table);
  }
  async function toPptx(md, title, PptxGenJS) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13,33 × 7,5 pouces
    pptx.author = 'Ivass AI'; pptx.title = title || 'Présentation';
    const slides = slidesFrom(md);
    if (!slides.length) slides.push({ title: title || 'Présentation', subtitle: '', items: [], table: null, notes: '' });
    // pptxgenjs prend la mise en forme d'un paragraphe sur son dernier morceau : une puce = un seul morceau de texte
    const textRuns = (t, size, color, bullet, level) => { const rs = runs(t); const allBold = rs.every((r) => r.bold || !r.text.trim()); return [{ text: rs.map((r) => r.text).join(''), options: { bold: allBold, fontFace: rs.length === 1 && rs[0].code ? 'Consolas' : 'Calibri', fontSize: size, color, ...(bullet ? { bullet: { indent: 18 }, indentLevel: level } : {}) } }]; };
    slides.forEach((s, idx) => {
      const sl = pptx.addSlide();
      const isTitle = idx === 0 && !s.items.length && !s.table;
      if (isTitle) {
        sl.background = { color: '14161B' };
        sl.addShape(pptx.ShapeType.rect, { x: 0, y: 4.55, w: 13.33, h: 0.04, fill: { color: 'C9CED6' }, line: { color: 'C9CED6' } });
        sl.addText(s.title || title || 'Présentation', { x: 0.8, y: 2.0, w: 11.7, h: 1.6, fontFace: 'Calibri', fontSize: 40, bold: true, color: 'FFFFFF', align: 'left', valign: 'bottom' });
        if (s.subtitle) sl.addText(plain(s.subtitle), { x: 0.8, y: 3.7, w: 11.7, h: 0.8, fontSize: 20, color: 'C9CED6', align: 'left' });
      } else {
        sl.background = { color: 'FFFFFF' };
        sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: '1D2026' }, line: { color: '1D2026' } });
        sl.addText(s.title || '', { x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 30, bold: true, color: '15171C', valign: 'middle' });
        sl.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.25, w: 1.4, h: 0.05, fill: { color: '9198A5' }, line: { color: '9198A5' } });
        let y = 1.5;
        if (s.subtitle) { sl.addText(plain(s.subtitle), { x: 0.6, y, w: 12.1, h: 0.6, fontSize: 18, italic: true, color: '5F6673' }); y += 0.7; }
        if (s.items.length) {
          const h = s.table ? 2.2 : 7.0 - y;
          const paras = [];
          s.items.forEach((it) => { paras.push(...textRuns(it.text, it.code ? 14 : it.level ? 16 : 20, it.level ? '3A3F48' : '15171C', true, it.level + 1).map((r, i, arr) => (i === arr.length - 1 ? { ...r, options: { ...r.options, breakLine: true } } : r))); });
          sl.addText(paras, { x: 0.7, y, w: 11.9, h, valign: 'top', paraSpaceAfter: 6 });
          y += h + 0.1;
        }
        if (s.table) {
          const head = s.table.head.map((c) => ({ text: plain(c), options: { bold: true, color: 'FFFFFF', fill: { color: '1D2026' } } }));
          const rows = s.table.rows.slice(0, 14).map((r) => s.table.head.map((_, k) => ({ text: plain(r[k] || '') })));
          sl.addTable([head, ...rows], { x: 0.6, y, w: 12.1, fontSize: 14, color: '15171C', border: { type: 'solid', color: 'DCDFE5', pt: 1 }, autoPage: false });
        }
        sl.addText(String(idx + 1), { x: 12.3, y: 7.0, w: 0.6, h: 0.35, fontSize: 11, color: '9198A5', align: 'right' });
      }
      if (s.notes.trim()) sl.addNotes(s.notes.trim());
    });
    return new Uint8Array(await pptx.write({ outputType: 'uint8array' }));
  }

  // ------------------------------------------------------------------ PDF (via HTML)
  const PRINT_CSS = `body{font:11pt/1.55 "Segoe UI",Calibri,Arial,sans-serif;color:#15171c;margin:0}h1{font-size:22pt;margin:0 0 10pt;border-bottom:2px solid #1d2026;padding-bottom:6pt}h2{font-size:15pt;margin:16pt 0 6pt;color:#1d2026}h3{font-size:12.5pt;margin:12pt 0 4pt}table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:10pt}th{background:#1d2026;color:#fff;text-align:left}th,td{border:1px solid #c9ced6;padding:5pt 7pt}tr:nth-child(even) td{background:#f5f6f8}blockquote{border-left:3px solid #9198a5;margin:8pt 0;padding:2pt 10pt;color:#4a4f59}code{font-family:Consolas,monospace;background:#f2f3f5;padding:0 3pt;border-radius:3pt}pre{background:#f2f3f5;padding:8pt;border-radius:5pt;white-space:pre-wrap}.code-h,.copy-code,.run-code{display:none}hr{border:0;border-top:1px solid #c9ced6;margin:12pt 0}a{color:#1d5c94}`;
  function markdownToHtml(md, title, renderMarkdown) {
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title || 'Document')}</title><style>${PRINT_CSS}</style></head><body>${renderMarkdown(md, { noRun: true })}</body></html>`;
  }

  // ------------------------------------------------------------------ PDF sans navigateur (téléphone) : pdfmake
  function pdfDefinition(md, title) {
    const blocks = parseBlocks(md);
    const content = [];
    const rich = (t, extra) => runs(t).map((r) => Object.assign({ text: r.text }, r.bold ? { bold: true } : {}, r.italics ? { italics: true } : {}, r.code ? { background: '#f2f3f5' } : {}, extra || {}));
    let list = null;
    const endList = () => { if (list) { content.push(list.node); list = null; } };
    let firstH1 = true;
    for (const b of blocks) {
      if (b.t !== 'li') endList();
      if (b.t === 'h') {
        const big = b.level === 1 && firstH1; if (b.level === 1) firstH1 = false;
        content.push({ text: rich(b.text), style: big ? 'title' : 'h' + Math.min(b.level, 3) });
        if (big) content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#1d2026' }], margin: [0, 0, 0, 10] });
      } else if (b.t === 'p') content.push({ text: rich(b.text), margin: [0, 0, 0, 7] });
      else if (b.t === 'li') {
        if (!list || list.ordered !== b.ordered) { endList(); list = { ordered: b.ordered, node: b.ordered ? { ol: [], margin: [0, 0, 0, 7] } : { ul: [], margin: [0, 0, 0, 7] } }; }
        (list.node.ol || list.node.ul).push({ text: rich(b.text), margin: [b.level * 14, 0, 0, 2] });
      } else if (b.t === 'quote') content.push({ table: { widths: ['*'], body: [[{ text: rich(b.text, { italics: true, color: '#4a4f59' }), border: [true, false, false, false] }]] }, layout: { vLineColor: () => '#9198a5', vLineWidth: () => 2.5, paddingLeft: () => 9 }, margin: [0, 2, 0, 8] });
      else if (b.t === 'hr') content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: '#c9ced6' }], margin: [0, 6, 0, 10] });
      else if (b.t === 'code') content.push({ table: { widths: ['*'], body: [[{ text: b.text, fontSize: 9, preserveLeadingSpaces: true }]] }, layout: { fillColor: () => '#f2f3f5', hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingTop: () => 6, paddingBottom: () => 6 }, margin: [0, 0, 0, 8] });
      else if (b.t === 'table') {
        const ncol = Math.max(b.head.length, ...b.rows.map((r) => r.length));
        const fill = (cs, head) => Array.from({ length: ncol }, (_, k) => ({ text: rich(cs[k] || ''), bold: head, color: head ? '#ffffff' : '#15171c', fillColor: head ? '#1d2026' : null }));
        content.push({ table: { headerRows: 1, widths: Array(ncol).fill('*'), body: [fill(b.head, true), ...b.rows.map((r) => fill(r, false))] }, layout: { hLineColor: () => '#c9ced6', vLineColor: () => '#c9ced6', fillColor: (i) => (i > 0 && i % 2 === 0 ? '#f5f6f8' : null), paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 }, fontSize: 9.5, margin: [0, 2, 0, 10] });
      }
    }
    endList();
    if (!content.length) content.push({ text: ' ' });
    return {
      info: { title: title || 'Document', creator: 'Ivass AI', producer: 'Ivass AI' },
      pageSize: 'A4', pageMargins: [40, 46, 40, 52],
      defaultStyle: { font: 'Roboto', fontSize: 10.5, lineHeight: 1.25, color: '#15171c' },
      styles: { title: { fontSize: 21, bold: true, margin: [0, 0, 0, 6] }, h1: { fontSize: 17, bold: true, margin: [0, 12, 0, 6] }, h2: { fontSize: 14, bold: true, color: '#1d2026', margin: [0, 12, 0, 5] }, h3: { fontSize: 12, bold: true, margin: [0, 9, 0, 4] } },
      footer: (cur, total) => ({ text: `Page ${cur} / ${total}`, alignment: 'center', fontSize: 8, color: '#7a808c', margin: [0, 18, 0, 0] }),
      content,
    };
  }
  function toPdfMake(md, title, pdfMake) {
    return new Promise((resolve, reject) => {
      try { pdfMake.createPdf(pdfDefinition(md, title)).getBuffer((b) => resolve(new Uint8Array(b))); } catch (e) { reject(e); }
    });
  }

  const MIMES = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', pdf: 'application/pdf', csv: 'text/csv', tsv: 'text/tab-separated-values',
    json: 'application/json', md: 'text/markdown', txt: 'text/plain', html: 'text/html', htm: 'text/html', svg: 'image/svg+xml', xml: 'application/xml',
    sql: 'application/sql', ics: 'text/calendar', vcf: 'text/vcard', yaml: 'application/yaml', yml: 'application/yaml',
  };
  const NEEDS = { docx: 'docx', xlsx: 'exceljs', pptx: 'pptxgenjs' };

  /**
   * Fabrique le fichier en mémoire.
   * o = { name, content, lib(nom) → module (async), pdf(html) → octets (facultatif), renderMarkdown(md) → html (facultatif) }
   * → { name, ext, kind, mime, bytes: Uint8Array }
   */
  async function build(o) {
    const name = safeName(o.name);
    const ext = name.split('.').pop();
    const title = name.slice(0, -(ext.length + 1)).replace(/[-_]+/g, ' ');
    const content = String(o.content == null ? '' : o.content).replace(/\r\n?/g, '\n');
    if (content.length > 2000000) throw new Error('Contenu trop long pour un fichier (2 Mo maximum).');
    const lib = async (n) => { if (!o.lib) throw new Error('Format indisponible ici.'); return o.lib(n); };
    const text = (t) => new TextEncoder().encode(t);
    let bytes;
    if (ext === 'docx') bytes = await toDocx(content, title, await lib('docx'));
    else if (ext === 'xlsx') bytes = await toXlsx(content, await lib('exceljs'));
    else if (ext === 'pptx') bytes = await toPptx(content, title, await lib('pptxgenjs'));
    else if (ext === 'pdf') {
      if (o.pdf && o.renderMarkdown) bytes = new Uint8Array(await o.pdf(markdownToHtml(content, title, o.renderMarkdown)));
      else bytes = await toPdfMake(content, title, await lib('pdfmake'));
    } else if (ext === 'json') { let t; try { t = JSON.stringify(JSON.parse(content), null, 2) + '\n'; } catch (_) { t = content; } bytes = text(t); }
    else if (ext === 'csv' || ext === 'tsv') bytes = text((content.startsWith('\uFEFF') ? '' : '\uFEFF') + content.trim() + '\n'); // BOM : Excel lit bien les accents
    else if ((ext === 'html' || ext === 'htm') && !/<html|<!doctype/i.test(content) && o.renderMarkdown) bytes = text(markdownToHtml(content, title, o.renderMarkdown));
    else bytes = text(content.endsWith('\n') ? content : content + '\n');
    return { name, ext, kind: KINDS[ext] || 'Fichier', mime: MIMES[ext] || 'application/octet-stream', bytes };
  }

  /** Blocs livrables / images / vidéos présents dans une réponse (closed = bloc terminé). */
  function extract(md) {
    const out = [];
    const re = /```[ \t]*(livrable:([^\n`]+)|ivass-image|ivass-video)[ \t]*\n([\s\S]*?)(```|$)/g;
    let m;
    const s = String(md || '');
    while ((m = re.exec(s))) {
      const closed = !!m[4];
      if (m[2]) out.push({ type: 'file', name: safeName(m[2].trim()), content: m[3].replace(/\n$/, ''), closed });
      else out.push({ type: m[1] === 'ivass-image' ? 'image' : 'video', prompt: m[3].trim(), closed });
      if (!closed) break;
    }
    return out;
  }

  return { build, extract, safeName, parseBlocks, runs, plain, sheetsFrom, cellValue, slidesFrom, markdownToHtml, pdfDefinition, toDocx, toXlsx, toPptx, toPdfMake, KINDS, MIMES, NEEDS, PRINT_CSS };
});
