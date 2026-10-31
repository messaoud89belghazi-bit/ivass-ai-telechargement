/* Ivass AI — 🧑‍💻 Ivass Dev sur le téléphone : Académie, Mode Architecte, docs officielles, kits (ZIP), missions autonomes.
   Mêmes niveaux, prompts et kits que le PC (dev-core.js, dev-kits.js). Sur le téléphone, une mission travaille
   en texte (plan, étapes, rapport) : aucune commande, aucun accès au PC. Développé par Messaoud BELGHAZI. */
'use strict';
(function () {
  window.IvassDevMobile = function ({ N, T, esc, md, ask, getSettings, saveSettings, providers, peut, garde, lancer, ajouterConv, langue, LV, toast }) {
    const D = window.IvassDev, K = window.IvassKits;
    const O = { tab: 'academie', ouvert: null, archi: null, mission: 'construire', details: '', ia: '', run: null, kit: null };
    const st = () => getSettings().dev || { prog: {} };
    const prog = () => st().prog || {};
    const save = (patch) => { const s = getSettings(); s.dev = { prog: {}, ...(s.dev || {}), ...patch }; saveSettings(); };
    const majProg = (id, patch) => {
      const p = { ...prog() }, cur = p[id] || {};
      const n = { ...cur, at: Date.now() };
      if (patch.lu) n.lu = true; if (patch.exo) n.exo = true;
      if (Number.isFinite(patch.quiz)) n.quiz = Math.max(cur.quiz || 0, patch.quiz);
      p[id] = n; save({ prog: p });
    };
    const lock = (f) => (peut(f) ? '' : ' 🔒');
    const libre = (n) => n.offre === 'gratuit' || peut('academie');
    const L = () => langue();
    let redrawRef = () => {};

    // ---------------------------------------------------------------- rendu
    function tabs() {
      const t = [['academie', '🎓 ' + T('Académie')], ['architecte', '📐 ' + T('Architecte')], ['docs', '📚 ' + T('Docs')], ['kits', '🧰 ' + T('Kits')], ['missions', '🎯 ' + T('Missions')]];
      return `<div class="dv-tabs">${t.map(([id, l]) => `<button class="chip ${O.tab === id ? 'on' : ''}" data-dt="${id}">${esc(l)}</button>`).join('')}</div>`;
    }
    function academie() {
      const g = D.progression(prog()), p = prog();
      const suiv = g.suivante && D.LECONS[g.suivante];
      let h = `<div class="card"><h3>🎓 ${T('Votre parcours de développeur professionnel')}</h3><p class="help">${T('7 niveaux, du terminal à l’architecture SaaS. Chaque leçon est expliquée par votre IA, avec un exercice ; le quiz valide la leçon (4 bonnes réponses sur 5).')}</p>
        <div class="dv-bar"><i style="width:${g.pct}%"></i></div><p class="help">${T('{} / {} leçons validées', g.faites, g.total)} · ${g.pct} %</p>
        ${suiv ? `<button class="btn primary" data-lecon="${suiv.id}">📖 ${T('Continuer')} : ${esc(T(suiv.titre))}</button>` : `<p><b>🏆 ${T('Parcours terminé')}</b></p>`}</div>`;
      for (const n of D.NIVEAUX) {
        const pn = g.niveaux.find((x) => x.id === n.id), open = O.ouvert === n.id || (!O.ouvert && g.courant === n.id);
        h += `<div class="card dv-niv"><button class="dv-niv-h" data-niv="${n.id}"><span>${n.icone}</span><b>${esc(T(n.titre))}${libre(n) ? '' : lock('academie')}</b><span class="help">${pn.faites}/${pn.total}</span><span>${open ? '▾' : '▸'}</span></button>`;
        if (open) {
          h += `<p class="help"><b>${T('Objectif :')}</b> ${esc(T(n.objectif))}</p><p class="help"><b>${T('Projet de fin de niveau :')}</b> ${esc(T(n.projet))}</p>`;
          for (const l of n.lecons) {
            const s = p[l.id] || {}, ok = D.leconFaite(s);
            h += `<div class="dv-lecon ${ok ? 'ok' : ''}"><div><b>${ok ? '✅' : s.lu ? '📖' : '○'} ${esc(T(l.titre))}</b><div class="help">${esc(T(l.resume))}${s.quiz ? ' · quiz ' + s.quiz + '/5' : ''}</div></div>
              <div class="row"><button class="btn sm primary" data-lecon="${l.id}">📖 ${T('Leçon')}</button><button class="btn sm" data-quiz="${l.id}">📝 ${T('Quiz')}</button><button class="btn sm" data-relire="${l.id}">👨‍🏫 ${T('Relecture')}</button><button class="btn sm" data-url="${esc(l.doc)}">🔗</button></div></div>`;
          }
        }
        h += '</div>';
      }
      return h;
    }
    function architecte() {
      const a = O.archi;
      let h = `<div class="card"><h3>📐 ${T('Mode Architecte')}${lock('architecte')}</h3><p class="help">${T('Décrivez votre idée : une équipe virtuelle (CTO, architecte, développeur senior, experts sécurité, UX/UI et DevOps) rédige le dossier de conception complet en 13 sections, avec votre IA.')}</p>
        <input class="field" id="dvTitre" placeholder="${esc(T('Nom du projet (ex. Ivass Services)'))}" value="${esc(a ? a.titre : '')}">
        <textarea class="field" id="dvIdee" rows="5" placeholder="${esc(T('Votre idée : à quoi sert le produit, pour qui, les fonctions principales, vos contraintes (budget, délais, technologies)…'))}">${esc(a ? a.idee : '')}</textarea>
        ${a && a.enCours ? `<button class="btn" id="dvStop">⏹ ${T('Arrêter')}</button>` : `<button class="btn primary" id="dvGo">📐 ${T('Rédiger le dossier')}</button>`}</div>`;
      if (a) {
        h += `<div class="card"><div class="dv-steps">${D.SECTIONS.map((s, i) => `<span class="dv-step ${a.faites[i] ? 'ok' : a.enCours && i === a.faites.length ? 'cur' : ''}">${a.faites[i] ? '✓' : i + 1} ${esc(T(s.titre))}</span>`).join('')}</div>${a.erreur ? `<p class="help err">${esc(a.erreur)}</p>` : ''}
          ${a.faites.length === D.SECTIONS.length ? `<div class="row"><button class="btn sm" data-export="docx">📄 Word</button><button class="btn sm" data-export="pdf">📕 PDF</button><button class="btn sm" id="dvChat">💬 ${T('En discuter')}</button><button class="btn sm" id="dvMission">🎯 ${T('Confier la réalisation')}</button></div>` : ''}
          <div class="dv-md">${md(D.dossierMarkdown(a.titre, a.idee, a.faites))}</div></div>`;
      }
      return h;
    }
    function docs() {
      const dom = [...new Set(D.DOCS.map((d) => d.domaine))];
      return `<div class="card"><h3>📚 ${T('Question technique, réponse sourcée')}</h3><p class="help">${T('Votre IA répond en s’appuyant sur la documentation officielle (MDN, react.dev, FastAPI, Docker…), avec un exemple et les adresses des sources.')}</p>
        <textarea class="field" id="dqQ" rows="3" placeholder="${esc(T('ex. Comment protéger une route Next.js avec une session ? / Différence entre useEffect et useLayoutEffect ?'))}"></textarea><p class="help" id="dqDocs"></p><button class="btn primary" id="dqGo">📚 ${T('Demander')}</button></div>
        <div class="card"><p class="help">🧩 ${T('Context7 (documentation à jour de milliers de bibliothèques, serveur MCP) se branche sur Ivass AI pour PC : Ivass Dev › Docs officielles.')}</p></div>
        ${dom.map((d) => `<div class="card"><h3>${esc(T(d))}</h3><div class="dv-docs">${D.DOCS.filter((x) => x.domaine === d).map((x) => `<button class="chip" data-url="${esc(x.url)}">${esc(x.nom)} ↗</button>`).join('')}</div></div>`).join('')}`;
    }
    function kits() {
      let h = `<div class="card"><h3>🧰 ${T('Kits de démarrage')}${lock('kits')}</h3><p class="help">${T('Des projets professionnels prêts à lancer, avec tests, intégration continue (GitHub Actions) et README. Sur le téléphone, le kit est enregistré en fichier .zip : ouvrez-le sur votre PC ou envoyez-le sur GitHub.')}</p></div>`;
      if (O.kit) h += `<div class="card"><h3>✅ ${T('Projet créé')}</h3><p class="help">${esc(O.kit.name)} · ${esc(O.kit.where)}</p><p class="help"><b>${T('Pour le lancer :')}</b></p><pre class="dv-cmd">${esc(O.kit.lancer.join('\n'))}</pre></div>`;
      return h + K.KITS.map((k) => `<div class="card"><h3>${k.icone} ${esc(T(k.nom))}</h3><p class="help">${esc(k.stack)}</p><p class="help">${esc(T(k.desc))}</p><div class="row"><input class="field" data-kn="${k.id}" placeholder="${esc(T('Nom du projet'))}"><button class="btn sm" data-kit="${k.id}">${T('Créer')}</button></div></div>`).join('');
    }
    function missions() {
      const m = D.MISSIONS.find((x) => x.id === O.mission) || D.MISSIONS[0];
      const ps = providers();
      const r = O.run;
      let h = `<div class="card"><h3>🤖 ${T('Votre IA travaille en autonomie')}${lock('missions')}</h3><p class="help">${T('Sur le téléphone, la mission avance seule par écrit : elle planifie, réalise chaque étape (analyse, code, textes, tableaux) puis vous remet un livrable. Aucune commande n’est lancée et rien n’est envoyé à votre PC. Pour agir sur les fichiers d’un projet, utilisez les missions d’Ivass AI pour PC.')}</p>
        <label class="help">${T('IA de la mission')}</label><select class="field" id="mnIA"><option value="">⚡ ${T('Auto (la meilleure IA disponible, repli automatique)')}</option>${ps.map((p) => `<option value="${esc(p.id)}" ${O.ia === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
        <div class="dv-missions">${D.MISSIONS.filter((x) => !x.projet).concat(D.MISSIONS.filter((x) => x.projet)).map((x) => `<button class="chip ${x.id === m.id ? 'on' : ''}" data-mission="${x.id}">${x.icone} ${esc(T(x.titre))}</button>`).join('')}</div>
        <div class="card"><h3>${m.icone} ${esc(T(m.titre))}</h3><p class="help">${esc(T(m.desc))}</p>
        <textarea class="field" id="mnDetails" rows="5" placeholder="${esc(m.projet ? T('Collez le code ou décrivez le projet concerné…') : T('Décrivez précisément le résultat attendu…'))}">${esc(O.details)}</textarea>
        ${r && r.enCours ? `<button class="btn" id="mnStop">⏹ ${T('Arrêter')}</button>` : `<button class="btn primary" id="mnGo">🚀 ${T('Lancer la mission')}</button>`}</div>`;
      if (r) {
        h += `<div class="card"><h3>${r.enCours ? '⏳' : r.erreur ? '⚠️' : '✅'} ${esc(r.titre)}</h3>${r.plan.length ? `<ol class="dv-plan">${r.plan.map((p, i) => `<li class="${i < r.faits.length ? 'ok' : r.enCours && i === r.faits.length ? 'cur' : ''}">${i < r.faits.length ? '✓ ' : ''}${esc(p)}</li>`).join('')}</ol>` : `<p class="help">${T('Votre IA prépare le plan…')}</p>`}
          ${r.erreur ? `<p class="help err">${esc(r.erreur)}</p>` : ''}${r.fini ? `<p class="help">${T('Le livrable est dans une nouvelle discussion.')}</p><button class="btn sm" id="mnVoir">💬 ${T('Ouvrir le livrable')}</button>` : ''}</div>`;
      }
      return h;
    }
    function html() { return tabs() + { academie, architecte, docs, kits, missions }[O.tab](); }

    // ---------------------------------------------------------------- actions
    function lecon(id) {
      const l = D.LECONS[id], n = D.NIVEAUX.find((x) => x.id === l.niveau);
      if (!libre(n) && !garde('academie')) return;
      majProg(id, { lu: true });
      lancer(D.promptLecon(id, L()), '🎓 ' + T('Leçon') + ' : ' + T(l.titre));
    }
    async function quiz(id, r) {
      const l = D.LECONS[id], n = D.NIVEAUX.find((x) => x.id === l.niveau);
      if (!libre(n) && !garde('academie')) return;
      r.innerHTML = `<div class="card"><h3>📝 ${esc(T(l.titre))}</h3><p class="help">${T('Votre IA prépare 5 questions…')}</p></div>`;
      let qs;
      try { qs = D.lireQuiz(await ask(D.promptQuiz(id, L()), 'Tu es un formateur technique. Tu réponds uniquement en JSON valide.', 2500)); } catch (e) { toast(e.message); return redrawRef(); }
      r.innerHTML = `<div class="card"><h3>📝 ${esc(T(l.titre))}</h3>${qs.map((q, i) => `<div class="dv-q" data-i="${i}"><b>${i + 1}. ${esc(q.q)}</b>${q.choix.map((c, j) => `<label class="dv-choix"><input type="radio" name="q${i}" value="${j}"> ${esc(c)}</label>`).join('')}<p class="help dv-expl hidden"></p></div>`).join('')}
        <div class="row"><button class="btn primary" id="qOk">${T('Valider mes réponses')}</button><button class="btn" id="qBack">${T('Retour')}</button></div></div>`;
      r.querySelector('#qBack').onclick = () => redrawRef();
      r.querySelector('#qOk').onclick = (ev) => {
        let bon = 0;
        qs.forEach((q, i) => {
          const c = r.querySelector(`input[name=q${i}]:checked`), ok = c && Number(c.value) === q.bonne; if (ok) bon++;
          const d = r.querySelector(`.dv-q[data-i="${i}"]`); d.classList.add(ok ? 'bon' : 'faux');
          const ex = d.querySelector('.dv-expl'); ex.classList.remove('hidden'); ex.textContent = (ok ? '✅ ' : '❌ ' + T('Bonne réponse : {}', q.choix[q.bonne]) + ' — ') + q.explication;
        });
        const sur5 = Math.round((bon / qs.length) * 5);
        majProg(id, { quiz: sur5, lu: true });
        ev.target.replaceWith(Object.assign(document.createElement('b'), { textContent: T('Score : {} / {}', bon, qs.length) + ' ' + (sur5 >= 4 ? T('— leçon validée ✅') : T('— relisez la leçon et réessayez')) }));
      };
    }
    function relire(id, r) {
      const l = D.LECONS[id];
      r.innerHTML = `<div class="card"><h3>👨‍🏫 ${T('Relecture de code')} : ${esc(T(l.titre))}</h3><p class="help">${T('Collez votre code : votre IA le relit comme un développeur senior (bugs, sécurité, améliorations, note sur 10), sans le réécrire à votre place.')}</p>
        <textarea class="field dv-code" id="rvCode" rows="12" spellcheck="false" placeholder="// code"></textarea><div class="row"><button class="btn primary" id="rvGo">👨‍🏫 ${T('Relire mon code')}</button><button class="btn" id="rvBack">${T('Retour')}</button></div></div>`;
      r.querySelector('#rvBack').onclick = () => redrawRef();
      r.querySelector('#rvGo').onclick = () => {
        const code = r.querySelector('#rvCode').value.trim(); if (!code) return toast(T('Collez votre code.'));
        majProg(id, { exo: true });
        lancer(D.promptRelecture(code, id, L()), '👨‍🏫 ' + T('Relecture de mon code') + ' — ' + T(l.titre));
      };
    }
    async function rediger(r) {
      if (!garde('architecte')) return;
      const titre = r.querySelector('#dvTitre').value.trim() || T('Mon projet'), idee = r.querySelector('#dvIdee').value.trim();
      if (idee.length < 15) return toast(T('Décrivez votre idée en quelques phrases.'));
      const a = O.archi = { titre, idee, faites: [], enCours: true, erreur: '', ctrl: new AbortController() };
      redrawRef();
      for (const s of D.SECTIONS) {
        if (!a.enCours) break;
        try { const p = D.promptSection(idee, s.id, a.faites, L()); const t = await ask(p.prompt, p.system, 3500, a.ctrl.signal); if (!a.enCours) break; a.faites.push({ titre: T(s.titre), texte: t.trim() }); }
        catch (e) { if (a.enCours) a.erreur = e.message; break; }
        redrawRef();
      }
      a.enCours = false;
      if (a.faites.length === D.SECTIONS.length) ajouterConv('📐 ' + titre, '📐 ' + T('Dossier de conception') + ' : ' + titre, D.dossierMarkdown(titre, idee, a.faites), false);
      redrawRef();
    }
    async function exporter(fmt) {
      const a = O.archi;
      try {
        const f = await window.LivrablesCore.build({ name: `${T('Dossier de conception')} - ${a.titre}.${fmt}`, content: D.dossierMarkdown(a.titre, a.idee, a.faites), lib: LV.lib });
        const s = await N.files.save(f.name, f.bytes, f.mime);
        toast(`📦 ${s.name} · ${s.where}`);
      } catch (e) { toast(e.message); }
    }
    async function kit(id, r) {
      if (!garde('kits')) return;
      const k = K.KITS.find((x) => x.id === id), nom = (r.querySelector(`[data-kn="${id}"]`).value || '').trim() || T(k.nom);
      try {
        const bytes = D.zip(K.fichiers(id, nom).map((f) => ({ path: K.slug(nom) + '/' + f.path, content: f.content })));
        const s = await N.files.save(K.slug(nom) + '.zip', bytes, 'application/zip');
        O.kit = { name: s.name, where: s.where, lancer: k.lancer };
        toast('🧰 ' + T('Projet créé')); redrawRef();
      } catch (e) { toast(e.message); }
    }
    async function mission(r) {
      if (!garde('missions')) return;
      const m = D.MISSIONS.find((x) => x.id === O.mission);
      const details = r.querySelector('#mnDetails').value.trim();
      if (details.length < 10) return toast(T('Décrivez la mission en quelques phrases.'));
      const objectif = `${m.titre} — ${m.consigne}\n\n${details}`;
      const run = O.run = { titre: T(m.titre), plan: [], faits: [], enCours: true, erreur: '', fini: false, ctrl: new AbortController() };
      redrawRef();
      const go = (prompt, max) => ask(prompt, `Tu es un ingénieur senior qui travaille en autonomie sur une mission. ${D.REGLES_MISSION.replace(/Ivass me demandera[^;]*;/, '')}`, max, run.ctrl.signal, O.ia);
      try {
        run.plan = D.lirePlan(await go(D.promptPlanTexte(objectif, L()), 800));
        if (!run.plan.length) throw new Error(T('L’IA n’a pas proposé de plan. Réessayez.'));
        redrawRef();
        for (let i = 0; i < run.plan.length && run.enCours; i++) { run.faits.push((await go(D.promptEtape(objectif, run.plan, i, run.faits, L()), 3000)).trim()); redrawRef(); }
        if (run.enCours) {
          const rapport = (await go(D.promptRapport(objectif, run.plan, run.faits, L()), 4000)).trim();
          const detail = run.plan.map((p, i) => `### ${i + 1}. ${p}\n\n${run.faits[i]}`).join('\n\n');
          run.convId = ajouterConv('🎯 ' + T(m.titre), `🎯 ${T('Mission')} « ${T(m.titre)} »\n${details.slice(0, 300)}`, `${rapport}\n\n---\n\n## ${T('Détail des étapes')}\n\n${detail}`, true);
          run.fini = true;
        }
      } catch (e) { if (run.enCours) run.erreur = e.message; }
      run.enCours = false; redrawRef();
    }

    function mount(r, redraw) {
      redrawRef = redraw;
      const q = r.querySelector('#dqQ');
      if (q) q.oninput = () => { const ds = D.docsPour(q.value); r.querySelector('#dqDocs').textContent = ds.length ? '📚 ' + ds.map((d) => d.nom).join(' · ') : ''; };
      r.onchange = (e) => { if (e.target.id === 'mnIA') O.ia = e.target.value; };
      r.oninput = (e) => { if (e.target.id === 'mnDetails') O.details = e.target.value; };
      r.onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const d = b.dataset;
        if (d.dt) { O.tab = d.dt; return redraw(); }
        if (d.url) return N.openUrl(d.url);
        if (d.niv) { O.ouvert = O.ouvert === d.niv ? '__' : d.niv; return redraw(); }
        if (d.lecon) return lecon(d.lecon);
        if (d.quiz) return quiz(d.quiz, r);
        if (d.relire) return relire(d.relire, r);
        if (b.id === 'dvGo') return rediger(r);
        if (b.id === 'dvStop') { O.archi.enCours = false; O.archi.ctrl.abort(); return redraw(); }
        if (d.export) return exporter(d.export);
        if (b.id === 'dvChat') return lancer(`Voici le dossier de conception de mon projet. Analyse-le comme un CTO : forces, faiblesses, risques, et ce que tu changerais en priorité.${L() !== 'fr' ? ` Réponds dans la langue « ${L()} ».` : ''}\n\n${D.dossierMarkdown(O.archi.titre, O.archi.idee, O.archi.faites).slice(0, 60000)}`, '📐 ' + T('Dossier de conception') + ' : ' + O.archi.titre);
        if (b.id === 'dvMission') { O.mission = 'construire'; O.details = T('Réalise le MVP décrit dans ce dossier de conception (commence par la checklist développement) :') + '\n\n' + D.dossierMarkdown(O.archi.titre, O.archi.idee, O.archi.faites).slice(0, 20000); O.tab = 'missions'; return redraw(); }
        if (b.id === 'dqGo') { const t = r.querySelector('#dqQ').value.trim(); if (t.length < 5) return toast(T('Posez votre question.')); return lancer(D.promptDocs(t, L()), '📚 ' + t); }
        if (d.kit) return kit(d.kit, r);
        if (d.mission) { O.mission = d.mission; return redraw(); }
        if (b.id === 'mnGo') return mission(r);
        if (b.id === 'mnStop') { O.run.enCours = false; O.run.ctrl.abort(); return redraw(); }
        if (b.id === 'mnVoir') return ajouterConv.ouvrir(O.run.convId);
        return undefined;
      };
    }
    return { html, mount, etat: O };
  };
})();
