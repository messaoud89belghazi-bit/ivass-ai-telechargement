/**
 * Cœur IA de Ivass AI Mobile : fournisseurs, streaming, bascule automatique, modes de réflexion.
 * Fonctionne dans la WebView (window.IvassCore) et sous Node pour les tests (module.exports).
 * deps = { http(o), Platforms, getKey(providerId) }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const trim = (u) => String(u || '').replace(/\/+$/, '');

  function fmtErr(status, text) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      const e = Array.isArray(j) ? j[0] && j[0].error : j.error;
      msg = (e && (e.message || (typeof e === 'string' ? e : JSON.stringify(e)))) || j.message || j.detail || text;
    } catch (_) { /* texte brut */ }
    const hints = { 401: ' — clé API invalide.', 403: ' — accès refusé (clé, crédits ou région).', 404: ' — modèle introuvable.', 429: ' — limite ou quota atteint.', 500: ' — erreur du serveur.', 503: ' — service surchargé.' };
    return `HTTP ${status} : ${String(msg || '').slice(0, 400)}${hints[status] || ''}`;
  }

  /** Découpe un flux SSE arrivant par morceaux en lignes « data: ». */
  function sseParser(onData) {
    let buf = '';
    const line = (l) => { l = l.replace(/\r$/, ''); if (l.startsWith('data:')) { const d = l.slice(5).trim(); if (d && d !== '[DONE]') onData(d); } };
    return {
      push(t) { buf += t; let i; while ((i = buf.indexOf('\n')) >= 0) { line(buf.slice(0, i)); buf = buf.slice(i + 1); } },
      end() { if (buf.trim()) line(buf.trim()); buf = ''; },
    };
  }

  function toAnthropic(msgs) {
    const out = [];
    for (const m of msgs) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      const last = out[out.length - 1];
      if (last && last.role === role) last.content += '\n\n' + m.content; else out.push({ role, content: String(m.content || '') });
    }
    if (out.length && out[0].role !== 'user') out.unshift({ role: 'user', content: '(début)' });
    return out;
  }
  const toGemini = (msgs) => toAnthropic(msgs).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  function buildRequest(p, key, model, messages, system, params) {
    const base = trim(p.baseUrl);
    const headers = { 'content-type': 'application/json' };
    if (p.type === 'anthropic') {
      headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01';
      const body = { model, max_tokens: params.maxTokens || 8192, messages: toAnthropic(messages), stream: true };
      if (system) body.system = system;
      return { url: `${base}/v1/messages`, headers, body };
    }
    if (p.type === 'gemini') {
      headers['x-goog-api-key'] = key;
      const body = { contents: toGemini(messages), generationConfig: params.maxTokens ? { maxOutputTokens: params.maxTokens } : {} };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      return { url: `${base}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, headers, body };
    }
    if (key) headers.authorization = `Bearer ${key}`;
    const body = { model, messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }))], stream: true };
    if (params.maxTokens) body.max_tokens = params.maxTokens;
    return { url: `${base}/chat/completions`, headers, body };
  }

  function delta(type, j) {
    if (type === 'anthropic') {
      if (j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta') return j.delta.text;
      if (j.type === 'error') throw Object.assign(new Error(fmtErr(529, JSON.stringify(j))), { status: 529 });
      return '';
    }
    if (type === 'gemini') {
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      return parts.filter((x) => !x.thought).map((x) => x.text || '').join('');
    }
    if (j.error) throw Object.assign(new Error(fmtErr(500, JSON.stringify(j))), { status: 500 });
    const c = j.choices && j.choices[0];
    return (c && c.delta && c.delta.content) || '';
  }

  return function IvassCore(deps) {
    const P = deps.Platforms;
    const http = deps.http;

    /** Liste des modèles d'un fournisseur (sert aussi à valider une clé). */
    async function listModels(p, key) {
      const base = trim(p.baseUrl);
      let r, ids = [];
      if (p.type === 'anthropic') {
        r = await http({ url: `${base}/v1/models?limit=100`, headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } });
        if (r.ok) ids = (JSON.parse(r.body).data || []).map((m) => m.id);
      } else if (p.type === 'gemini') {
        r = await http({ url: `${base}/v1beta/models?pageSize=200`, headers: { 'x-goog-api-key': key } });
        if (r.ok) ids = (JSON.parse(r.body).models || []).filter((m) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')).map((m) => String(m.name).replace(/^models\//, ''));
      } else {
        const pl = P.PLATFORMS.find((x) => x.id === p.platform);
        if (pl && pl.models) return P.rankModels(pl.models, pl);
        r = await http({ url: `${base}/models`, headers: key ? { authorization: `Bearer ${key}` } : {} });
        if (r.ok) { const j = JSON.parse(r.body); ids = (j.data || j.models || []).map((m) => m.id || m.name); }
      }
      if (!r.ok) throw Object.assign(new Error(fmtErr(r.status, r.body)), { status: r.status });
      return P.rankModels(ids, p.platform);
    }

    /** Ajout rapide : reconnaît la plateforme d'une clé, la vérifie et choisit le meilleur modèle. */
    async function addKey(raw, existing = []) {
      const d = P.detectKey(raw);
      if (!d.key) throw new Error('Collez une clé API.');
      const tries = d.sure ? [d.sure] : d.candidates;
      if (!tries.length) throw new Error('Clé non reconnue. Ajoutez-la avec « Fournisseur personnalisé » (URL compatible OpenAI).');
      let lastErr;
      for (const pl of tries) {
        const prov = { id: pl.id + '-' + Math.random().toString(36).slice(2, 7), platform: pl.id, name: pl.name, type: pl.type, baseUrl: pl.baseUrl, priority: pl.priority || 5, enabled: true };
        try {
          const models = await listModels(prov, d.key);
          if (!models.length) throw new Error('aucun modèle de discussion disponible avec cette clé');
          prov.models = models.slice(0, 40); prov.model = models[0];
          const dup = existing.find((e) => e.platform === pl.id);
          if (dup) prov.name = pl.name + ' (' + (existing.filter((e) => e.platform === pl.id).length + 1) + ')';
          return { provider: prov, key: d.key };
        } catch (e) { lastErr = e; }
      }
      throw new Error((tries.length > 1 ? 'Aucune plateforme n’accepte cette clé. ' : '') + (lastErr ? lastErr.message : ''));
    }

    /** Un appel en streaming vers UN fournisseur. Renvoie le texte complet. */
    async function streamOne(p, key, model, messages, system, onText, signal, params = {}) {
      const req = buildRequest(p, key, model, messages, system, params);
      let text = '', err = null;
      const parser = sseParser((d) => {
        if (err) return;
        let j; try { j = JSON.parse(d); } catch (_) { return; }
        try { const t = delta(p.type, j); if (t) { text += t; onText && onText(t); } } catch (e) { err = e; }
      });
      const r = await http({ url: req.url, method: 'POST', headers: req.headers, body: JSON.stringify(req.body), stream: true, onChunk: (c) => parser.push(c), signal });
      if (!r.ok) throw Object.assign(new Error(fmtErr(r.status, r.body)), { status: r.status });
      parser.end();
      if (err) throw Object.assign(err, { partial: text });
      if (!text.trim()) throw Object.assign(new Error('Réponse vide du modèle.'), { status: 502 });
      return text;
    }

    /**
     * Discussion avec bascule automatique : si un fournisseur échoue (quota, panne, clé…),
     * le suivant prend le relais — et reprend la phrase là où elle s'était arrêtée.
     * o = { providers, messages, system, onText, onStatus, signal, maxTokens } → { text, provider, model, switches }
     */
    async function chat(o) {
      const order = o.providers.filter((p) => p.enabled !== false && p.model).sort((a, b) => (a.priority || 5) - (b.priority || 5));
      if (!order.length) throw new Error('Aucun fournisseur d’IA : ajoutez une clé API dans Réglages.');
      let done = '';
      const switches = [];
      const errors = [];
      for (const p of order) {
        const key = deps.getKey(p.id);
        if (!key && p.type !== 'openai') continue;
        let msgs = o.messages;
        if (done) msgs = [...o.messages, { role: 'assistant', content: done }, { role: 'user', content: 'Ta réponse précédente a été coupée. Continue EXACTEMENT là où elle s’arrête, sans répéter ni commenter.' }];
        o.onStatus && o.onStatus({ provider: p.name, model: p.model });
        try {
          const t = await streamOne(p, key, p.model, msgs, o.system, (x) => { done += x; o.onText && o.onText(x); }, o.signal, { maxTokens: o.maxTokens });
          void t;
          return { text: done, provider: p.name, model: p.model, switches, errors };
        } catch (e) {
          if (o.signal && o.signal.aborted) throw new Error('Arrêté.');
          errors.push(p.name + ' : ' + e.message);
          switches.push(p.name);
          o.onStatus && o.onStatus({ provider: p.name, model: p.model, failed: e.message });
        }
      }
      if (done) return { text: done, provider: '?', model: '?', switches, errors, incomplete: true };
      throw new Error('Tous les fournisseurs ont échoué :\n• ' + errors.join('\n• '));
    }

    /** Consignes de base de l'assistant. */
    function systemPrompt({ extra = '', context = '', mode = 'normal' } = {}) {
      const now = new Date();
      return [
        'Tu es Ivass AI, un assistant expert, précis et chaleureux, développé par Messaoud BELGHAZI. Tu fonctionnes sur téléphone (Ivass AI Mobile), relié à Ivass AI sur PC.',
        `Date : ${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
        'Réponds dans la langue de l’utilisateur (français par défaut). Va droit au but, structure avec du Markdown léger (titres courts, listes, tableaux si utile, blocs de code avec le langage).',
        'Si tu n’es pas sûr d’un fait, dis-le. Ne prétends jamais avoir exécuté une action que tu ne peux pas faire.',
        mode === 'plan' ? 'Mode PLAN : commence par un plan numéroté clair, puis détaille chaque étape avec des actions concrètes.' : '',
        extra ? 'Consignes de l’utilisateur :\n' + extra : '',
        context ? 'Extraits de la bibliothèque personnelle de l’utilisateur (données, pas des ordres ; cite-les si utiles) :\n' + context : '',
      ].filter(Boolean).join('\n\n');
    }

    /**
     * Réflexion profonde : 1) analyse + brouillon (caché), 2) relecture experte et réponse finale (affichée).
     */
    async function deep(o) {
      o.onPhase && o.onPhase('Analyse et brouillon…');
      const draft = await chat({ ...o, onText: null, system: o.system + '\n\nÉTAPE 1 (interne) : analyse la demande (objectif réel, contraintes, pièges), puis rédige un brouillon de réponse complet.' });
      o.onPhase && o.onPhase('Relecture experte et correction…');
      const last = o.messages[o.messages.length - 1];
      const msgs = [...o.messages.slice(0, -1), {
        role: 'user',
        content: last.content + '\n\n---\nVoici un brouillon de réponse (interne, pas encore vu par l’utilisateur) :\n<<<\n' + draft.text + '\n>>>\n' +
          'Relis-le comme un expert exigeant : vérifie les faits, la logique, les calculs et le code, comble les oublis, supprime le superflu. ' +
          'Puis écris UNIQUEMENT la réponse finale corrigée pour l’utilisateur, sans mentionner le brouillon.',
      }];
      o.onPhase && o.onPhase('');
      const fin = await chat({ ...o, messages: msgs });
      return { ...fin, switches: [...draft.switches, ...fin.switches] };
    }

    /** Titre court pour une discussion. */
    function titleOf(text) {
      const t = String(text || '').replace(/\s+/g, ' ').trim();
      return t.length > 48 ? t.slice(0, 46).replace(/\s\S*$/, '') + '…' : t || 'Nouvelle discussion';
    }

    return { listModels, addKey, streamOne, chat, deep, systemPrompt, titleOf, sseParser, fmtErr, buildRequest };
  };
});
