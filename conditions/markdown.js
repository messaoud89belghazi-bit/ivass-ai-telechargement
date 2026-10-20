'use strict';
/* Petit moteur Markdown sans dépendance, sûr (tout le HTML est échappé). */
(function () {
  const RUNNABLE = ['python', 'py', 'javascript', 'js', 'node', 'typescript', 'ts', 'powershell', 'ps1', 'pwsh', 'bash', 'sh', 'shell',
    'batch', 'bat', 'cmd', 'c', 'cpp', 'c++', 'java', 'csharp', 'cs', 'c#', 'go', 'rust', 'rs', 'php', 'html'];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(t) {
    const codes = [];
    t = esc(t).replace(/`([^`\n]+)`/g, (m, c) => { codes.push(`<code>${c}</code>`); return `\u0001${codes.length - 1}\u0001`; });
    t = t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" class="ext">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)\]]+)/g, '$1<a href="$2" class="ext">$2</a>')
      .replace(/\[(\d{1,2})\](?!\()/g, '<sup class="cite" data-n="$1">[$1]</sup>');
    return t.replace(/\u0001(\d+)\u0001/g, (m, i) => codes[+i]);
  }

  const reList = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const reHr = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
  const reTableSep = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  const isPlaceholder = (l) => /^\u0000\d+\u0000$/.test(l.trim());

  function isBlockStart(l, next) {
    return /^#{1,6}\s/.test(l) || reHr.test(l) || /^\s*>/.test(l) || reList.test(l) || isPlaceholder(l) ||
      (l.includes('|') && next != null && reTableSep.test(next));
  }

  function splitRow(r) {
    return r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  }

  function renderBlocks(src, blocks) {
    const lines = src.split('\n');
    let html = '';
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (isPlaceholder(l)) { html += blocks[+l.trim().slice(1, -1)]; i++; continue; }
      const h = l.match(/^(#{1,6})\s+(.*)$/);
      if (h) { html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }
      if (reHr.test(l)) { html += '<hr>'; i++; continue; }
      if (/^\s*>/.test(l)) {
        const q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
        html += `<blockquote>${renderBlocks(q.join('\n'), blocks)}</blockquote>`;
        continue;
      }
      if (l.includes('|') && i + 1 < lines.length && reTableSep.test(lines[i + 1])) {
        const head = splitRow(l);
        i += 2;
        let t = '<div class="table-wrap"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
          t += '<tr>' + splitRow(lines[i]).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
          i++;
        }
        html += t + '</tbody></table></div>';
        continue;
      }
      const lm = l.match(reList);
      if (lm) {
        const ordered = /\d/.test(lm[2]);
        const start = ordered ? parseInt(lm[2], 10) : 1;
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(reList);
          if (m) { items.push({ indent: m[1].length, text: m[3] }); i++; continue; }
          if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; continue; }
          break;
        }
        const tag = ordered ? 'ol' : 'ul';
        html += `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ''}>` +
          items.map((it) => `<li${it.indent >= 2 ? ' class="sub"' : ''}>${inline(it.text.replace(/^\[ \]\s/, '☐ ').replace(/^\[x\]\s/i, '☑ '))}</li>`).join('') +
          `</${tag}>`;
        continue;
      }
      const para = [];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i], lines[i + 1])) para.push(lines[i++]);
      if (!para.length) { para.push(lines[i++]); }
      html += `<p>${para.map(inline).join('<br>')}</p>`;
    }
    return html;
  }

  window.renderMarkdown = function (src, opts = {}) {
    const blocks = [];
    src = String(src || '').replace(/\r\n/g, '\n');
    src = src.replace(/```([^\n`]*)\n?([\s\S]*?)(?:```|$)/g, (m, info, code) => {
      info = (info || '').trim();
      let lang = info, file = '';
      const c = info.match(/^([\w+#-]*):(.+)$/);
      if (c) { lang = c[1]; file = c[2].trim(); }
      lang = (lang.split(/\s/)[0] || '').toLowerCase();
      const runnable = !opts.noRun && (!file || lang === 'html') && RUNNABLE.includes(lang);
      blocks.push(
        `<div class="code" data-lang="${esc(lang)}"><div class="code-h"><span>${file ? '📄 ' + esc(file) : esc(lang || 'texte')}</span><span class="code-btns">` +
        (runnable ? `<button class="run-code" type="button">${lang === 'html' ? '👁 Aperçu' : '▶ Exécuter'}</button>` : '') +
        `<button class="copy-code" type="button">Copier</button></span></div>` +
        `<pre><code>${esc(code.replace(/\n$/, ''))}</code></pre></div>`
      );
      return `\n\u0000${blocks.length - 1}\u0000\n`;
    });
    return renderBlocks(src, blocks);
  };
})();
