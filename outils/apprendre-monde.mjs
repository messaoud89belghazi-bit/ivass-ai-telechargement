/**
 * 📖 Apprentissage quotidien d'Ivass AI, dans le cloud (GitHub Actions) : il tourne même quand vos PC et
 * téléphones sont éteints. Chaque jour, Ivass lit sur Wikipédia (CC BY-SA 4.0) :
 *   - l'article du jour, les articles les plus lus de la veille, l'actualité et les éphémérides ;
 *   - un sujet approfondi, choisi à tour de rôle parmi les 16 domaines du savoir de base ;
 * et chaque semaine il rafraîchit le savoir de base des 16 domaines.
 * Résultat publié dans monde/ (même format que le Savoir Ivass) : un fichier par jour, gardé 30 jours,
 * et un fichier par domaine. Les applications ne téléchargent que les fichiers qui ont changé.
 * Usage : node outils/apprendre-monde.mjs [dossier=monde] [date=AAAA-MM-JJ]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require(path.resolve('iphone/encyclo.js'));
const OUT = process.argv[2] || 'monde';
const day = process.argv[3] || new Date(Date.now() - 864e5).toISOString().slice(0, 10); // la veille (UTC)
const KEEP_DAYS = 30;
const UA = 'IvassAI-Apprentissage/1.0 (assistant personnel ; https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/)';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
const get = async (u) => {
  if (calls++) await sleep(300); // poli avec les serveurs de Wikimédia
  const r = await (globalThis.__fetch || fetch)(u, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`);
  return r.json();
};
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; };
const entry = (title, text, url, tags) => ({
  id: 'mo-' + sha(url).slice(0, 16), type: 'knowledge', title: String(title).slice(0, 200),
  content: `${cut(text, 1500)}\n\nSource : Wikipédia — ${url} — licence CC BY-SA 4.0`,
  tags: ['encyclopedie', 'wikipedia', ...tags].slice(0, 10), url, at: Date.now(),
});
const fromSummary = (p, tag) => {
  const url = p && p.content_urls && p.content_urls.desktop && p.content_urls.desktop.page;
  const text = [p && p.description, p && p.extract].filter(Boolean).join('. ');
  if (!url || !/^https:\/\/fr\.wikipedia\.org\//.test(url) || String(text).length < 80) return null;
  return entry((p.titles && p.titles.normalized) || p.title, text, url, [tag]);
};

function write(file, entries) {
  const body = JSON.stringify({ format: 'ivass-savoir-part', version: 1, entries });
  fs.writeFileSync(path.join(OUT, file), body);
  return { file, hash: sha(body).slice(0, 32), count: entries.length };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const log = { day, started: new Date().toISOString(), errors: [] };

  // 1. Le jour : article du jour, plus lus, actualité, éphémérides
  const [y, m, d] = day.split('-');
  const daily = new Map();
  const add = (e) => { if (e && !daily.has(e.id)) daily.set(e.id, e); };
  try {
    const j = await get(`https://fr.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`);
    add(fromSummary(j.tfa, 'article-du-jour'));
    for (const a of ((j.mostread && j.mostread.articles) || []).slice(0, 30)) add(fromSummary(a, 'plus-lus'));
    for (const n of (j.news || []).slice(0, 6)) for (const l of (n.links || []).slice(0, 2)) add(fromSummary(l, 'actualite'));
    for (const o of (j.onthisday || []).slice(0, 8)) for (const p of (o.pages || []).slice(0, 1)) add(fromSummary(p, 'ephemeride'));
  } catch (e) { log.errors.push('flux du jour : ' + e.message); }

  // 2. Un sujet approfondi chaque jour, à tour de rôle dans les 16 domaines
  const topics = Object.values(E.DOMAINS).flatMap((x) => x.titles);
  const dayNo = Math.floor(Date.parse(day) / 864e5);
  const topic = topics[dayNo % topics.length];
  try {
    for (const x of (await E.deepen(topic, { get, n: 15 })).slice(0, 15)) if (x.url) add(entry(x.title, x.content.replace(/\n\nSource :[\s\S]*$/, ''), x.url, ['approfondi', 'sujet:' + topic.toLowerCase().slice(0, 40)]));
  } catch (e) { log.errors.push('sujet approfondi : ' + e.message); }
  log.topic = topic;
  if (daily.size) write(`jour-${day}.json`, [...daily.values()]);
  log.daily = daily.size;

  // 3. Le savoir de base : un fichier par domaine, rafraîchi chaque dimanche (ou s'il manque)
  const sunday = new Date(day + 'T12:00:00Z').getUTCDay() === 0;
  for (const [id] of Object.entries(E.DOMAINS)) {
    const f = path.join(OUT, `base-${id}.json`);
    if (fs.existsSync(f) && !sunday) continue;
    try {
      const list = (await E.starterPack({ get, domains: [id] })).filter((x) => x.url).map((x) => entry(x.title, x.content.replace(/\n\nSource :[\s\S]*$/, ''), x.url, ['savoir-de-base', id]));
      if (list.length) write(`base-${id}.json`, list);
    } catch (e) { log.errors.push(`domaine ${id} : ${e.message}`); }
  }

  // 4. Ménage (30 jours) et index : les applications ne téléchargent que les fichiers dont l'empreinte a changé
  const limit = new Date(Date.parse(day) - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
  for (const f of fs.readdirSync(OUT)) { const mm = f.match(/^jour-(\d{4}-\d{2}-\d{2})\.json$/); if (mm && mm[1] < limit) fs.rmSync(path.join(OUT, f)); }
  const files = fs.readdirSync(OUT).filter((f) => /^(base-[a-z]+|jour-\d{4}-\d{2}-\d{2})\.json$/.test(f)).sort();
  const parts = files.map((f) => {
    const body = fs.readFileSync(path.join(OUT, f), 'utf8');
    return { file: f, hash: sha(body).slice(0, 32), count: (JSON.parse(body).entries || []).length };
  });
  const count = parts.reduce((n, p) => n + p.count, 0);
  const index = {
    format: 'ivass-savoir', version: 1, at: new Date().toISOString(), app: 'apprentissage-quotidien', count,
    hash: sha(parts.map((p) => p.hash).join('|')).slice(0, 32), parts,
    licence: 'Textes issus de Wikipédia, licence CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/deed.fr) ; source et lien conservés dans chaque fiche.',
  };
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  log.count = count; log.parts = parts.length; log.calls = calls; log.ended = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'journal.json'), JSON.stringify(log, null, 1));
  console.log(`📖 ${day} : ${log.daily} nouvelles fiches (sujet : ${topic}), ${count} au total dans ${parts.length} fichiers, ${calls} appels, ${log.errors.length} erreur(s).`);
  for (const e of log.errors) console.log('  ⚠ ' + e);
}
main().catch((e) => { console.error(e); process.exit(1); });
