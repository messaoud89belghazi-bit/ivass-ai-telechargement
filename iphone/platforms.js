/* Copie de Ivass AI desktop src/platforms.js (ne pas modifier ici : recopier depuis le desktop). */
(function(){ var module = { exports: {} };
'use strict';
/**
 * Catalogue des plateformes IA connues par Ivass AI.
 *  - reconnaissance d'une clé API à son préfixe (et sondage quand le préfixe est ambigu) ;
 *  - choix automatique du meilleur modèle disponible ;
 *  - serveurs d'IA locaux à rechercher sur ce PC ;
 *  - fusion des fournisseurs en double.
 */

const PLATFORMS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', type: 'anthropic', baseUrl: 'https://api.anthropic.com', key: /^sk-ant-/, priority: 1,
    prefer: [/claude-opus-\d/, /claude-sonnet-\d/, /claude-.*sonnet/, /claude-haiku/, /claude/], keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openrouter', name: 'OpenRouter', type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', key: /^sk-or-/, priority: 4,
    prefer: [/:free$/, /claude/, /gpt/, /gemini/], keyUrl: 'https://openrouter.ai/keys' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', type: 'openai', baseUrl: 'https://api.openai.com/v1', key: /^sk-(proj|svcacct|admin)-|^sk-[A-Za-z0-9]{40,}$/, priority: 2,
    prefer: [/^gpt-5(\.\d)?$/, /^gpt-5/, /^gpt-4\.1$/, /^gpt-4o$/, /^o\d/, /^gpt-4/], keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', type: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', key: /^AIza[0-9A-Za-z_-]{30,}$/, priority: 2,
    // Flash d'abord : une clé gratuite n'a souvent AUCUN quota pour les modèles « Pro » (erreur « limit: 0 »)
    prefer: [/^gemini-\d+(\.\d+)?-flash$/, /^gemini-flash-latest$/, /^gemini-\d+(\.\d+)?-flash-lite$/, /^gemini-.*flash(?!.*(lite|thinking))/, /^gemini-\d+(\.\d+)?-pro$/, /^gemini-.*-pro/, /^gemini/],
    free: 'Gratuit avec un compte Google (limites par minute et par jour)', keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq', name: 'Groq (ultra-rapide)', type: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: /^gsk_/, priority: 3,
    prefer: [/llama-3\.3-70b/, /qwen.*coder/, /deepseek-r1/, /llama.*70b/, /gpt-oss/, /llama/], keyUrl: 'https://console.groq.com/keys' },
  { id: 'xai', name: 'xAI (Grok)', type: 'openai', baseUrl: 'https://api.x.ai/v1', key: /^xai-/, priority: 3,
    prefer: [/grok-\d+-code/, /^grok-\d+$/, /grok/], keyUrl: 'https://console.x.ai' },
  { id: 'perplexity', name: 'Perplexity (recherche web)', type: 'openai', baseUrl: 'https://api.perplexity.ai', key: /^pplx-/, priority: 4,
    models: ['sonar-pro', 'sonar', 'sonar-reasoning-pro'], prefer: [/sonar-pro/, /sonar/], keyUrl: 'https://www.perplexity.ai/settings/api' },
  { id: 'huggingface', name: 'Hugging Face', type: 'openai', baseUrl: 'https://router.huggingface.co/v1', key: /^hf_/, priority: 5,
    prefer: [/Qwen.*Coder/i, /Llama-3\.3-70B/i, /DeepSeek/i], keyUrl: 'https://huggingface.co/settings/tokens' },
  { id: 'nvidia', name: 'NVIDIA NIM', type: 'openai', baseUrl: 'https://integrate.api.nvidia.com/v1', key: /^nvapi-/, priority: 5,
    prefer: [/qwen.*coder/i, /llama-3\.3-70b/i, /deepseek/i], keyUrl: 'https://build.nvidia.com' },
  { id: 'cerebras', name: 'Cerebras', type: 'openai', baseUrl: 'https://api.cerebras.ai/v1', key: /^csk-/, priority: 4,
    prefer: [/qwen.*coder/, /llama-3\.3-70b/, /gpt-oss/, /llama/], keyUrl: 'https://cloud.cerebras.ai' },
  { id: 'fireworks', name: 'Fireworks AI', type: 'openai', baseUrl: 'https://api.fireworks.ai/inference/v1', key: /^fw_/, priority: 5,
    prefer: [/qwen.*coder/, /deepseek/, /llama/], keyUrl: 'https://fireworks.ai/account/api-keys' },
  // Préfixes ambigus ou absents : identifiés par sondage (on essaie de lister les modèles)
  { id: 'deepseek', name: 'DeepSeek', type: 'openai', baseUrl: 'https://api.deepseek.com/v1', probe: /^sk-[a-f0-9]{32}$/, priority: 4,
    prefer: [/deepseek-chat/, /deepseek-reasoner/], keyUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'mistral', name: 'Mistral AI', type: 'openai', baseUrl: 'https://api.mistral.ai/v1', probe: /^[A-Za-z0-9]{32}$/, priority: 4,
    prefer: [/codestral-latest/, /mistral-large-latest/, /mistral-medium/, /mistral-small-latest/], keyUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'together', name: 'Together AI', type: 'openai', baseUrl: 'https://api.together.xyz/v1', probe: /^(tgp_v1_)?[A-Za-z0-9_-]{40,80}$/, priority: 5,
    prefer: [/Qwen.*Coder/i, /Llama-3\.3-70B/i, /DeepSeek-V3/i], keyUrl: 'https://api.together.ai/settings/api-keys' },
  { id: 'cohere', name: 'Cohere', type: 'openai', baseUrl: 'https://api.cohere.ai/compatibility/v1', probe: /^[A-Za-z0-9]{40}$/, priority: 5,
    prefer: [/command-a/, /command-r-plus/, /command/], keyUrl: 'https://dashboard.cohere.com/api-keys' },
  // Gratuites avec un compte (clé à coller)
  { id: 'zai', name: 'Z.AI (GLM)', type: 'openai', baseUrl: 'https://api.z.ai/api/paas/v4', probe: /^[0-9a-f]{32}\.[A-Za-z0-9]{16}$/, priority: 5,
    models: ['glm-4.5-flash'], prefer: [/flash/, /glm/], free: 'GLM-4.5-Flash gratuit', keyUrl: 'https://z.ai/manage-apikey/apikey-list' },
  { id: 'ollamacloud', name: 'Ollama Cloud', type: 'openai', baseUrl: 'https://ollama.com/v1', priority: 5, manual: true,
    prefer: [/gpt-oss/, /qwen/, /deepseek/], free: 'Crédits gratuits chaque mois', keyUrl: 'https://ollama.com/settings/keys' },
];

/**
 * IA utilisables SANS clé (services publics, limites strictes par adresse IP). Désactivées par défaut :
 * l'utilisateur les active lui-même (ce qu'il écrit part chez ces services). Elles servent surtout de secours.
 */
const KEYLESS = [
  { id: 'pollinations', name: 'Pollinations (sans clé)', type: 'openai', baseUrl: 'https://text.pollinations.ai/v1', models: ['openai'], priority: 8, noKey: true,
    limit: '1 demande à la fois, 30 s entre deux', site: 'https://pollinations.ai' },
  { id: 'llm7', name: 'LLM7.io (sans clé)', type: 'openai', baseUrl: 'https://api.llm7.io/v1', models: ['gpt-4o-mini', 'mistral-small-3.1-24b', 'qwen2.5-coder-32b'], priority: 8, noKey: true,
    limit: 'quelques dizaines de demandes par minute', site: 'https://llm7.io' },
  { id: 'ovh', name: 'OVHcloud AI Endpoints (sans clé)', type: 'openai', baseUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', models: ['gpt-oss-120b'], priority: 9, noKey: true,
    limit: '2 demandes par minute', site: 'https://www.ovhcloud.com/fr/public-cloud/ai-endpoints/' },
];

/** Serveurs d'IA qui tournent sur ce PC, recherchés automatiquement. */
const LOCAL_SERVERS = [
  { id: 'ollama', name: 'Ollama (local, gratuit)', type: 'ollama', baseUrl: 'http://127.0.0.1:11434', probe: '/api/tags' },
  { id: 'lmstudio', name: 'LM Studio (local)', type: 'openai', baseUrl: 'http://127.0.0.1:1234/v1', probe: '/models' },
  { id: 'jan', name: 'Jan (local)', type: 'openai', baseUrl: 'http://127.0.0.1:1337/v1', probe: '/models' },
  { id: 'llamacpp', name: 'llama.cpp / LocalAI (local, port 8080)', type: 'openai', baseUrl: 'http://127.0.0.1:8080/v1', probe: '/models' },
  { id: 'vllm', name: 'vLLM (local, port 8000)', type: 'openai', baseUrl: 'http://127.0.0.1:8000/v1', probe: '/models' },
  { id: 'kobold', name: 'KoboldCpp (local)', type: 'openai', baseUrl: 'http://127.0.0.1:5001/v1', probe: '/models' },
  { id: 'textgen', name: 'text-generation-webui (local)', type: 'openai', baseUrl: 'http://127.0.0.1:5000/v1', probe: '/models' },
  { id: 'gpt4all', name: 'GPT4All (local)', type: 'openai', baseUrl: 'http://127.0.0.1:4891/v1', probe: '/models' },
];

const NOT_CHAT = /embed|embedding|whisper|tts|speech|audio|transcri|moderation|dall-?e|image|imagen|veo|rerank|guard|vision-only|search-preview|realtime|computer-use|aqa|bison|gecko|learnlm|native-audio|live/i;

const cleanKey = (k) => String(k || '').trim().replace(/^["'`]|["'`]$/g, '').replace(/^Bearer\s+/i, '');

/** Plateformes possibles pour une clé : [sûre] ou [candidates à sonder]. */
function detectKey(raw) {
  const key = cleanKey(raw);
  if (!key) return { key, sure: null, candidates: [] };
  const sure = PLATFORMS.find((p) => p.key && p.key.test(key));
  if (sure) return { key, sure, candidates: [sure] };
  const candidates = PLATFORMS.filter((p) => p.probe && p.probe.test(key));
  // « sk- » générique : OpenAI d'abord, puis DeepSeek
  if (/^sk-/.test(key)) {
    const o = PLATFORMS.find((p) => p.id === 'openai');
    if (!candidates.includes(o)) candidates.unshift(o);
  }
  return { key, sure: null, candidates };
}

/** Taille approximative d'un modèle local d'après son nom (en milliards de paramètres). */
function sizeOf(name) {
  const m = String(name).match(/(\d+(?:\.\d+)?)\s*b\b/i);
  if (m) return +m[1];
  if (/mini|tiny|small/i.test(name)) return 3;
  return 7;
}

/** Classe les modèles d'une liste : les meilleurs pour discuter et coder d'abord. */
function rankModels(list, platformOrId) {
  const pl = typeof platformOrId === 'string' ? PLATFORMS.find((p) => p.id === platformOrId) : platformOrId;
  const prefer = (pl && pl.prefer) || [/coder/, /instruct/];
  const chat = [...new Set(list)].filter((m) => m && !NOT_CHAT.test(m));
  const score = (m) => {
    const i = prefer.findIndex((re) => re.test(m));
    let s = i < 0 ? 100 : i * 10;
    if (/preview|exp|experimental|beta|\d{4}-\d{2}-\d{2}|-\d{3,4}$/.test(m)) s += 3; // versions datées ou d'essai : un peu après
    if (/latest$/.test(m)) s -= 1;
    return s;
  };
  return chat.sort((a, b) => score(a) - score(b) || a.localeCompare(b));
}

/** Classe des modèles locaux : codeurs d'abord, puis du plus fort au plus léger (en restant raisonnable). */
function rankLocal(list, maxB = 16) {
  return [...list].filter((m) => !NOT_CHAT.test(m)).sort((a, b) => {
    const ca = /coder|code/i.test(a) ? 0 : 1, cb = /coder|code/i.test(b) ? 0 : 1;
    const sa = sizeOf(a), sb = sizeOf(b);
    const fa = sa <= maxB ? 0 : 1, fb = sb <= maxB ? 0 : 1;
    return fa - fb || ca - cb || sb - sa || a.localeCompare(b);
  });
}

const normUrl = (u) => String(u || '').trim().toLowerCase().replace(/\/+$/, '').replace('://localhost', '://127.0.0.1').replace(/\/v1$/, '');

/** Plateforme correspondant à un fournisseur déjà configuré (d'après son URL). */
function platformOf(p) {
  const u = normUrl(p.baseUrl);
  return PLATFORMS.find((x) => normUrl(x.baseUrl) === u) || null;
}

/**
 * Fusionne les fournisseurs en double (même type + même URL) : clés, modèles et réglages réunis.
 * decKey sert à comparer les clés chiffrées. Renvoie { providers, merged }.
 */
function mergeDuplicates(providers, decKey = (x) => x) {
  const out = [];
  let merged = 0;
  for (const p of providers) {
    const same = out.find((q) => q.type === p.type && normUrl(q.baseUrl) === normUrl(p.baseUrl) && !q.localIvass && !p.localIvass);
    if (!same) { out.push(p); continue; }
    merged++;
    const keys = [...(same.apiKeys || (same.apiKey ? [same.apiKey] : []))];
    const known = new Set(keys.map(decKey).filter(Boolean));
    for (const k of p.apiKeys || (p.apiKey ? [p.apiKey] : [])) {
      const d = decKey(k);
      if (d && !known.has(d)) { keys.push(k); known.add(d); }
    }
    same.apiKeys = keys; delete same.apiKey;
    same.models = [...new Set([...(same.models || []), ...(p.models || [])])];
    same.priority = Math.min(same.priority ?? 5, p.priority ?? 5);
    same.enabled = same.enabled !== false || p.enabled !== false;
    if (!same.fallbackModel && p.fallbackModel) same.fallbackModel = p.fallbackModel;
  }
  return { providers: out, merged };
}

module.exports = { KEYLESS, PLATFORMS, LOCAL_SERVERS, detectKey, rankModels, rankLocal, sizeOf, platformOf, mergeDuplicates, normUrl, cleanKey, NOT_CHAT };
; window.Platforms = module.exports; })();
