/** Bibliothèque personnelle : fiches (notes, méthodes, compétences…) et recherche BM25 sans dépendance. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const STOP = new Set('le la les un une des de du d l et ou en au aux a à ce ces cet cette est sont pour par sur dans avec sans que qui quoi dont il elle ils elles on nous vous je tu me te se ne pas plus mon ma mes ton ta tes son sa ses leur leurs y the of and to in is for on with'.split(' '));
  const WEIGHT = { savoir: 1.2, competence: 1.5, knowledge: 1.3, methode: 1.25, video: 1.15, code: 1.1, project: 1, task: 1, note: 1, transcript: 0.6 };
  const KINDS = { savoir: '🌍 Savoir Ivass', note: '📝 Note', methode: '🧭 Méthode', competence: '🎓 Compétence', knowledge: '💡 Fiche apprise', video: '🎬 Vidéo', code: '💻 Code', project: '📁 Projet', task: '✅ Tâche', transcript: '📜 Transcription' };

  const tokens = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));

  /** Découpe en passages d'environ 900 caractères pour une recherche fine. */
  function chunks(e) {
    const text = String(e.text || '');
    const parts = [];
    const paras = text.split(/\n\s*\n/);
    let cur = '';
    for (const p of paras) {
      if ((cur + '\n\n' + p).length > 900 && cur) { parts.push(cur); cur = p; } else cur = cur ? cur + '\n\n' + p : p;
    }
    if (cur) parts.push(cur);
    return (parts.length ? parts : ['']).map((t, i) => ({ id: e.id, i, title: e.title || '', kind: e.kind || 'note', text: t }));
  }

  // Passages découpés et tokenisés, gardés tant que la liste ne change pas (empreinte : taille + dates de mise à jour)
  const CACHE = new WeakMap();
  function docsOf(entries) {
    let sig = entries.length;
    for (const e of entries) sig = (sig * 31 + (e.updated || 0) + String(e.text || '').length) % 2147483647;
    const hit = CACHE.get(entries);
    if (hit && hit.sig === sig) return hit.docs;
    const docs = [];
    for (const e of entries) for (const c of chunks(e)) docs.push({ ...c, toks: tokens(c.title + ' ' + c.title + ' ' + (e.tags || []).join(' ') + ' ' + c.text) });
    CACHE.set(entries, { sig, docs });
    return docs;
  }

  /** entries → résultats [{ id, title, kind, text, score }] */
  function search(entries, query, limit = 6) {
    const q = [...new Set(tokens(query))];
    if (!q.length) return [];
    const docs = docsOf(entries);
    if (!docs.length) return [];
    const N = docs.length;
    const avg = docs.reduce((s, d) => s + d.toks.length, 0) / N || 1;
    const df = new Map(q.map((t) => [t, docs.filter((d) => d.toks.includes(t)).length]));
    const k1 = 1.4, b = 0.75;
    const scored = docs.map((d) => {
      const tf = new Map(); for (const t of d.toks) if (df.has(t)) tf.set(t, (tf.get(t) || 0) + 1);
      let s = 0;
      for (const t of q) {
        const f = tf.get(t) || 0; if (!f) continue;
        const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.toks.length / avg));
      }
      return { id: d.id, i: d.i, title: d.title, kind: d.kind, text: d.text, score: s * (WEIGHT[d.kind] || 1) };
    }).filter((d) => d.score > 0).sort((a, b2) => b2.score - a.score);
    const seen = new Map(); const out = [];
    for (const d of scored) { const n = seen.get(d.id) || 0; if (n >= 2) continue; seen.set(d.id, n + 1); out.push(d); if (out.length >= limit) break; }
    return out;
  }

  /** Contexte à joindre à la question (taille bornée). */
  function contextFor(entries, query, maxChars = 6000) {
    const hits = search(entries, query, 8);
    let out = '', n = 0;
    for (const h of hits) {
      const block = `[${++n}] ${h.title} (${KINDS[h.kind] || h.kind})\n${h.text}\n\n`;
      if (out.length + block.length > maxChars) break;
      out += block;
    }
    return { text: out.trim(), hits: hits.slice(0, n) };
  }
  /** Plusieurs bibliothèques (la vôtre + le Savoir Ivass) : chacune garde son cache, les meilleurs passages sont fusionnés. */
  function contextForMany(lists, query, maxChars = 6000) {
    const hits = lists.filter((l) => l && l.length).flatMap((l) => search(l, query, 8)).sort((a, b) => b.score - a.score).slice(0, 8);
    let out = '', n = 0;
    for (const h of hits) {
      const block = `[${++n}] ${h.title} (${KINDS[h.kind] || h.kind})\n${h.text}\n\n`;
      if (out.length + block.length > maxChars) break;
      out += block;
    }
    return { text: out.trim(), hits: hits.slice(0, n), top: hits.length ? hits[0].score : 0 };
  }
  return { search, contextFor, contextForMany, tokens, KINDS };
});
