/* 🔗 Rattachements sur le téléphone : même catalogue que le PC (integrations-core.js), recherche avancée,
   documentation, authentification, lien de création de clé. Sur le téléphone, une IA s'ajoute directement ;
   les connecteurs, serveurs MCP et API REST se relient sur le PC (le téléphone n'exécute rien sur le PC).
   Développé par Messaoud BELGHAZI. */
(function () {
  'use strict';
  window.IvassRattachementsMobile = function ({ N, T, esc, core, providers, saveSettings, limiteCles, ask }) {
    const I = window.IvassIntegrations;
    const G = { q: '', cat: '', page: 20, decouvertes: [] };
    const MODES = { ia: '🤖 IA', connecteur: '🔗', mcp: '🧩 MCP', api: '🔌 API' };
    function liste() {
      const res = [...G.decouvertes, ...I.chercher(G.q, { cat: G.cat })];
      if (!res.length) return `<p class="help">${T('Aucune plateforme trouvée dans le catalogue.')}</p><button class="btn sm primary" id="rtDisc">🧭 ${T('Découvrir « {} » avec votre IA', esc(G.q))}</button>`;
      return res.slice(0, G.page).map((x) => {
        const c = I.CATEGORIES.find((k) => k.id === x.cat) || {};
        return `<div class="card rt-item" data-rt="${esc(x.id)}"><h3>${c.icone || '🔗'} ${esc(x.nom)}</h3>
          <p class="help">${esc(T(c.nom || ''))} · 🔐 ${esc(T(I.AUTH[x.auth]))}${x.gratuit ? ' · ' + T('gratuit possible') : ''} · ${Object.keys(MODES).filter((k) => x[k]).map((k) => MODES[k]).join(' ')}</p>
          <div class="row">${x.ia ? `<button class="btn sm primary" data-rt-a="ia">🤖 ${T('Ajouter comme IA')}</button>` : ''}${x.docs ? `<button class="btn sm" data-rt-url="${esc(x.docs)}">📘 ${T('Doc API')}</button>` : ''}${x.cle ? `<button class="btn sm" data-rt-url="${esc(x.cle)}">🔑 ${T('Créer une clé')}</button>` : ''}</div>
          ${!x.ia && (x.connecteur || x.mcp || x.api) ? `<p class="help">💻 ${T('Se relie sur le PC : Ivass AI › 🔗 Rattachements.')}</p>` : ''}</div>`;
      }).join('') + (res.length > G.page ? `<button class="btn sm" id="rtMore">${T('Afficher plus')} (${res.length - G.page})</button>` : '');
    }
    function html() {
      return `<div class="card"><p class="help">${T('Plus de 200 plateformes : IA, SaaS, cloud, API publiques, outils développeurs, automatisation. Ivass indique la documentation, l’authentification et le lien de création de clé.')}</p>
        <input class="field" id="rtQ" type="search" placeholder="${esc(T('Ex. Stripe, envoyer des SMS, météo…'))}" value="${esc(G.q)}" autocomplete="off" spellcheck="false">
        <select class="field" id="rtCat"><option value="">${T('Toutes les catégories')} (${I.CATALOGUE.length})</option>${I.categories().map((c) => `<option value="${c.id}" ${G.cat === c.id ? 'selected' : ''}>${c.icone} ${esc(T(c.nom))} (${c.n})</option>`).join('')}</select></div>
        <div id="rtList">${liste()}</div>`;
    }
    async function ajouterIA(x) {
      const key = (prompt(T('Collez la clé API de {} :', x.nom)) || '').trim();
      if (!key) return;
      limiteCles(); // ⭐
      const P = providers();
      let provider;
      if (typeof x.ia === 'string') ({ provider } = await core.addKey(key, P));
      else {
        provider = { id: 'custom-' + Math.random().toString(36).slice(2, 9), platform: 'custom', name: x.nom, type: 'openai', baseUrl: x.ia.base, priority: 5, enabled: true };
        const models = await core.listModels(provider, key);
        if (!models.length) throw new Error(T('aucun modèle de discussion disponible avec cette clé'));
        provider.models = models.slice(0, 40); provider.model = models[0];
      }
      if (!N.secretSet('key:' + provider.id, key)) throw new Error(T('Impossible d’enregistrer la clé.'));
      P.push(provider); saveSettings();
      N.toast(T('{} ajouté ✓', provider.name));
    }
    async function decouvrir(redraw) {
      if (!ask) return;
      N.toast(T('Recherche de la documentation officielle…'));
      const x = I.lireDecouverte(await ask(I.promptDecouverte(G.q), 'Tu es un expert des API publiques. Tu réponds en JSON strict.'));
      G.decouvertes = [x, ...G.decouvertes.filter((y) => y.id !== x.id)].slice(0, 5);
      N.toast(T('🧭 Liens proposés par votre IA : vérifiez-les avant de coller une clé.'));
      redraw();
    }
    function mount(r, redraw) {
      const relister = () => { const l = r.querySelector('#rtList'); if (l) l.innerHTML = liste(); };
      let t = null;
      r.querySelector('#rtQ').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { G.q = e.target.value; G.page = 20; relister(); }, 150); };
      r.querySelector('#rtCat').onchange = (e) => { G.cat = e.target.value; G.page = 20; relister(); };
      r.onclick = async (e) => {
        const u = e.target.closest('[data-rt-url]'); if (u) return N.openUrl(u.dataset.rtUrl);
        if (e.target.closest('#rtMore')) { G.page += 20; return relister(); }
        try {
          if (e.target.closest('#rtDisc')) return await decouvrir(redraw);
          const a = e.target.closest('[data-rt-a="ia"]');
          if (a) { const id = a.closest('[data-rt]').dataset.rt; await ajouterIA(I.PAR_ID[id] || G.decouvertes.find((x) => x.id === id)); }
        } catch (err) { N.toast(err.message); }
      };
    }
    return { html, mount };
  };
})();
