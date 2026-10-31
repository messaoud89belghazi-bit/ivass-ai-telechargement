/* Ivass AI — 🧑‍💻 Ivass Dev : parcours de formation, Mode Architecte, docs officielles, missions.
   Fichier partagé PC (main + écran) et téléphone : mêmes niveaux, mêmes prompts, mêmes règles.
   Développé par Messaoud BELGHAZI. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassDev = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------------ 🎓 Académie : 7 niveaux
  const L = (id, titre, resume, doc) => ({ id, titre, resume, doc });
  const NIVEAUX = [
    { id: 'n0', icone: '🧱', titre: 'Fondations', duree: '6 semaines', offre: 'gratuit',
      objectif: 'Maîtriser les outils de tous les jours : terminal, Git, GitHub, le web et l’algorithmique.',
      projet: 'Votre portfolio en HTML/CSS, versionné avec Git et publié sur GitHub Pages.',
      lecons: [
        L('n0-poste', 'Poste de développeur', 'VS Code, extensions utiles, WSL 2 et terminal', 'https://code.visualstudio.com/docs'),
        L('n0-linux', 'Ligne de commande Linux', 'Naviguer, chercher, droits, variables d’environnement, SSH', 'https://ubuntu.com/tutorials/command-line-for-beginners'),
        L('n0-git', 'Git et GitHub', 'Commits, branches, fusion, conflits, pull requests', 'https://git-scm.com/doc'),
        L('n0-web', 'Comment marche le web', 'HTTP, DNS, HTTPS, JSON, cookies', 'https://developer.mozilla.org/fr/docs/Web/HTTP'),
        L('n0-algo', 'Algorithmique', 'Conditions, boucles, fonctions, récursivité, complexité', 'https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide'),
        L('n0-donnees', 'Structures de données', 'Tableaux, piles, files, tables de hachage, arbres, graphes', 'https://exercism.org/tracks/javascript'),
      ] },
    { id: 'n1', icone: '🎨', titre: 'Web frontend', duree: '3 mois', offre: 'gratuit',
      objectif: 'Construire une interface web moderne, rapide, accessible et typée.',
      projet: 'Tableau de bord « Mes Interventions » en Next.js et Tailwind, déployé sur Vercel.',
      lecons: [
        L('n1-html', 'HTML sémantique', 'Structure, formulaires, attributs d’accessibilité', 'https://developer.mozilla.org/fr/docs/Web/HTML'),
        L('n1-css', 'CSS moderne', 'Flexbox, Grid, variables, responsive, thèmes clair et sombre', 'https://developer.mozilla.org/fr/docs/Web/CSS'),
        L('n1-js', 'JavaScript moderne', 'Modules, async/await, fetch, DOM, événements', 'https://developer.mozilla.org/fr/docs/Web/JavaScript'),
        L('n1-ts', 'TypeScript', 'Types, interfaces, unions, génériques, mode strict', 'https://www.typescriptlang.org/docs/'),
        L('n1-react', 'React', 'Composants, props, état, effets, formulaires', 'https://react.dev/learn'),
        L('n1-next', 'Next.js', 'App Router, rendu serveur, routes API, SEO', 'https://nextjs.org/docs'),
        L('n1-tailwind', 'Tailwind CSS', 'Classes utilitaires, composants, design tokens', 'https://tailwindcss.com/docs'),
        L('n1-qualite', 'Accessibilité et performance', 'Contraste, clavier, Core Web Vitals, Lighthouse', 'https://web.dev/learn'),
        L('n1-tests', 'Tests du frontend', 'Vitest, Testing Library, Playwright', 'https://playwright.dev/docs/intro'),
      ] },
    { id: 'n2', icone: '🗄', titre: 'Backend et bases de données', duree: '3 mois', offre: 'pro',
      objectif: 'Concevoir une API fiable et sécurisée, et une base de données bien modélisée.',
      projet: 'API de « Mes Interventions » en NestJS et PostgreSQL, avec tests et documentation OpenAPI.',
      lecons: [
        L('n2-node', 'Node.js', 'Boucle d’événements, modules, npm, fichiers, flux', 'https://nodejs.org/docs/latest/api/'),
        L('n2-express', 'Express', 'Routes, middlewares, erreurs, validation', 'https://expressjs.com/'),
        L('n2-rest', 'Concevoir une API REST', 'Ressources, verbes, codes de statut, pagination, OpenAPI', 'https://learn.microsoft.com/fr-fr/azure/architecture/best-practices/api-design'),
        L('n2-sql', 'SQL et PostgreSQL', 'Tables, clés, jointures, index, transactions', 'https://www.postgresql.org/docs/'),
        L('n2-nest', 'NestJS', 'Modules, contrôleurs, services, injection de dépendances', 'https://docs.nestjs.com/'),
        L('n2-fastapi', 'Python et FastAPI', 'Typage, Pydantic, routes asynchrones, Swagger', 'https://fastapi.tiangolo.com/'),
        L('n2-auth', 'Authentification', 'Sessions, JWT, OAuth 2, Argon2, double authentification', 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'),
        L('n2-redis', 'Redis', 'Cache, limitation de débit, files de tâches', 'https://redis.io/docs/latest/'),
        L('n2-baas', 'MongoDB, Supabase et Firebase', 'Documents, services prêts à l’emploi et leurs limites', 'https://supabase.com/docs'),
      ] },
    { id: 'n3', icone: '📱', titre: 'Desktop et mobile', duree: '3 mois', offre: 'pro',
      objectif: 'Choisir la bonne technologie selon l’appareil et livrer une application installée et mise à jour.',
      projet: 'Vision Shield AI en Tauri, puis l’application Flutter de « Mes Interventions » hors ligne.',
      lecons: [
        L('n3-electron', 'Electron', 'Processus, preload, IPC sécurisé, mises à jour', 'https://www.electronjs.org/docs/latest'),
        L('n3-tauri', 'Tauri', 'Rust et web, permissions, installateur léger', 'https://tauri.app/'),
        L('n3-wpf', '.NET et WPF', 'C#, XAML, MVVM, logiciel Windows métier', 'https://learn.microsoft.com/fr-fr/dotnet/desktop/wpf/'),
        L('n3-flutter', 'Flutter', 'Widgets, état, navigation, Android et iPhone', 'https://docs.flutter.dev/'),
        L('n3-rn', 'React Native et Expo', 'Composants natifs, navigation, Expo', 'https://reactnative.dev/docs/getting-started'),
        L('n3-kotlin', 'Kotlin et Android', 'Jetpack Compose, cycle de vie, permissions', 'https://developer.android.com/kotlin'),
        L('n3-swift', 'Swift et SwiftUI', 'Vues, état, iPhone natif', 'https://developer.apple.com/tutorials/swiftui'),
        L('n3-publier', 'Signer et publier', 'Signature de code, magasins, mises à jour automatiques', 'https://developer.android.com/studio/publish'),
      ] },
    { id: 'n4', icone: '🚀', titre: 'DevOps et cloud', duree: '2 mois', offre: 'pro',
      objectif: 'Tester, construire et déployer automatiquement, et surveiller la production.',
      projet: 'L’API du niveau 2 conteneurisée, déployée derrière Nginx, avec CI/CD, sauvegardes et alertes.',
      lecons: [
        L('n4-docker', 'Docker', 'Images, conteneurs, Dockerfile, docker compose', 'https://docs.docker.com/get-started/'),
        L('n4-ci', 'CI/CD avec GitHub Actions', 'Jobs, matrices, cache, secrets, environnements', 'https://docs.github.com/fr/actions'),
        L('n4-serveur', 'Serveur Linux et Nginx', 'systemd, pare-feu, reverse proxy, HTTPS', 'https://nginx.org/en/docs/'),
        L('n4-cloud', 'Hébergement cloud', 'Vercel, Railway, Render, Cloudflare', 'https://developers.cloudflare.com/'),
        L('n4-k8s', 'Kubernetes', 'Pods, déploiements, services, autoscaling', 'https://kubernetes.io/docs/home/'),
        L('n4-obs', 'Observabilité', 'Journaux, métriques, traces, alertes, Sentry', 'https://opentelemetry.io/docs/'),
        L('n4-iac', 'Infrastructure as Code', 'Terraform, environnements reproductibles, sauvegardes', 'https://developer.hashicorp.com/terraform/docs'),
      ] },
    { id: 'n5', icone: '🤖', titre: 'IA et agents', duree: '3 mois', offre: 'pro',
      objectif: 'Construire des fonctions IA fiables et mesurer leur qualité.',
      projet: 'Assistant RAG sur vos fiches techniques fibre, avec citations, Ollama hors ligne et 50 questions d’évaluation.',
      lecons: [
        L('n5-llm', 'Comprendre les LLM', 'Jetons, contexte, température, coût, hallucinations', 'https://docs.claude.com/'),
        L('n5-prompts', 'Ingénierie des prompts', 'Rôle, contexte, exemples, format imposé', 'https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview'),
        L('n5-api', 'APIs Claude, Gemini et OpenAI', 'Streaming, sortie JSON, appels d’outils', 'https://ai.google.dev/gemini-api/docs'),
        L('n5-ollama', 'Modèles locaux avec Ollama', 'Choix du modèle, quantification, Modelfile', 'https://docs.ollama.com/'),
        L('n5-rag', 'Embeddings et RAG', 'Découpage, vecteurs, recherche hybride, citations', 'https://docs.llamaindex.ai/'),
        L('n5-agents', 'Agents et MCP', 'Boucle d’action, outils, mémoire, validation humaine', 'https://modelcontextprotocol.io/'),
        L('n5-frameworks', 'LangChain et LlamaIndex', 'Chaînes, index, quand s’en passer', 'https://docs.langchain.com/'),
        L('n5-eval', 'Évaluer une IA', 'Jeux de questions, notation, régressions', 'https://docs.claude.com/'),
        L('n5-pytorch', 'PyTorch', 'Tenseurs, réseaux, entraînement, LoRA', 'https://pytorch.org/tutorials/'),
      ] },
    { id: 'n6', icone: '🏛', titre: 'Architecture, SaaS et produit', duree: '3 mois', offre: 'pro',
      objectif: 'Concevoir, vendre et faire durer un produit : le niveau d’un CTO.',
      projet: 'Ivass Services en SaaS multi-clients : NestJS, PostgreSQL, abonnements, rôles et audit.',
      lecons: [
        L('n6-principes', 'Principes d’architecture', 'SOLID, couplage faible, architecture hexagonale, ADR', 'https://learn.microsoft.com/fr-fr/azure/architecture/guide/'),
        L('n6-ddd', 'Domain-Driven Design', 'Contextes bornés, monolithe modulaire, événements', 'https://learn.microsoft.com/fr-fr/azure/architecture/microservices/model/domain-analysis'),
        L('n6-saas', 'SaaS multi-clients', 'tenant_id, Row Level Security, rôles, audit', 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html'),
        L('n6-paiements', 'Abonnements et paiements', 'Stripe, Paddle, LemonSqueezy, webhooks, TVA', 'https://docs.stripe.com/billing'),
        L('n6-owasp', 'Sécurité OWASP', 'Les 10 risques majeurs et leurs parades', 'https://owasp.org/www-project-top-ten/'),
        L('n6-ux', 'UX/UI avec Figma', 'Wireframes, maquettes, design system', 'https://help.figma.com/'),
        L('n6-produit', 'Méthode produit et lancement', 'Problème, MVP, métriques, onboarding, SEO', 'https://www.atlassian.com/agile/product-management'),
      ] },
  ];
  const LECONS = {};
  for (const n of NIVEAUX) for (const l of n.lecons) LECONS[l.id] = { ...l, niveau: n.id };

  /** Progression : { [leconId]: { lu, quiz (meilleur score sur 5), exo, at } } */
  const leconFaite = (p) => !!(p && p.lu && (p.quiz || 0) >= 4);
  function progression(prog = {}) {
    const niveaux = NIVEAUX.map((n) => {
      const faites = n.lecons.filter((l) => leconFaite(prog[l.id])).length;
      return { id: n.id, faites, total: n.lecons.length, pct: Math.round((100 * faites) / n.lecons.length) };
    });
    const faites = niveaux.reduce((a, n) => a + n.faites, 0), total = niveaux.reduce((a, n) => a + n.total, 0);
    const courant = (niveaux.find((n) => n.pct < 100) || niveaux[niveaux.length - 1]).id;
    const suivante = (() => { for (const n of NIVEAUX) for (const l of n.lecons) if (!leconFaite(prog[l.id])) return l.id; return null; })();
    return { niveaux, faites, total, pct: Math.round((100 * faites) / total), courant, suivante };
  }

  const LANGUE = (lang) => (lang && lang !== 'fr' ? `\n\nIMPORTANT : rédige toute ta réponse dans la langue dont le code est « ${lang} » (les noms de technologies, le code et les commandes restent tels quels).` : '');

  function promptLecon(id, lang) {
    const l = LECONS[id]; if (!l) throw new Error('Leçon inconnue.');
    const n = NIVEAUX.find((x) => x.id === l.niveau);
    return `Tu es mon mentor technique (CTO, architecte logiciel et formateur). Donne-moi la leçon « ${l.titre} » (${l.resume}) du niveau « ${n.titre} » de ma formation de développeur professionnel.

Structure la leçon ainsi, en Markdown :
## Les bases — expliquées simplement, avec une analogie concrète
## Concepts avancés
## Exemple commenté — un exemple de code ou de commandes réaliste, commenté ligne par ligne
## Bonnes pratiques
## Erreurs fréquentes — et comment les éviter
## Exercice pratique — un exercice à faire seul, avec les critères de réussite (ne donne PAS la solution)
## Pour aller plus loin — un mini-projet réel et la documentation officielle : ${l.doc}

Sois précis et professionnel, ne simplifie pas à l’excès. Termine en me proposant de me poser des questions ou de m’envoyer mon code pour une relecture.${LANGUE(lang)}`;
  }
  function promptQuiz(id, lang, n = 5) {
    const l = LECONS[id]; if (!l) throw new Error('Leçon inconnue.');
    return `Crée un quiz de ${n} questions à choix multiples sur « ${l.titre} » (${l.resume}), niveau professionnel : des questions qui vérifient la compréhension et la pratique, pas le par cœur.
Réponds UNIQUEMENT avec un tableau JSON, sans texte autour :
[{"q": "question", "choix": ["A", "B", "C", "D"], "bonne": 0, "explication": "pourquoi c'est la bonne réponse"}]
"bonne" est l'indice (0 à 3) de la bonne réponse ; varie sa position d'une question à l'autre.${LANGUE(lang)}`;
  }
  /** Lit le quiz renvoyé par l'IA (tolère le texte autour et les blocs ```json). */
  function lireQuiz(text) {
    const s = String(text || ''); const a = s.indexOf('['), b = s.lastIndexOf(']');
    if (a < 0 || b <= a) throw new Error('L’IA n’a pas renvoyé de quiz lisible. Réessayez.');
    let arr; try { arr = JSON.parse(s.slice(a, b + 1)); } catch (_) { throw new Error('L’IA n’a pas renvoyé de quiz lisible. Réessayez.'); }
    const out = (Array.isArray(arr) ? arr : []).filter((x) => x && typeof x.q === 'string' && Array.isArray(x.choix) && x.choix.length >= 2 && Number.isInteger(Number(x.bonne)) && Number(x.bonne) >= 0 && Number(x.bonne) < x.choix.length)
      .map((x) => ({ q: String(x.q).slice(0, 500), choix: x.choix.slice(0, 6).map((c) => String(c).slice(0, 300)), bonne: Number(x.bonne), explication: String(x.explication || '').slice(0, 800) }));
    if (!out.length) throw new Error('L’IA n’a pas renvoyé de quiz lisible. Réessayez.');
    return out.slice(0, 10);
  }
  function promptRelecture(code, id, lang) {
    const l = id && LECONS[id];
    return `Tu es mon mentor (développeur senior). Relis mon code${l ? ` (exercice de la leçon « ${l.titre} »)` : ''} comme dans une vraie revue de code, sans le réécrire entièrement :
1. Ce qui est bien fait.
2. Les bugs et les risques (sécurité, performance, cas limites), avec la ligne concernée.
3. Les améliorations, par ordre d'importance, chacune avec un court extrait corrigé.
4. Une question pour vérifier que j'ai compris.
5. Une note sur 10 et ce qu'il faut pour atteindre 10.

\`\`\`
${String(code || '').slice(0, 40000)}
\`\`\`${LANGUE(lang)}`;
  }

  // ------------------------------------------------------------------ 🏛 Mode Architecte : dossier en 13 sections
  const S = (id, titre, role, consigne) => ({ id, titre, role, consigne });
  const SECTIONS = [
    S('analyse', 'Analyse', 'Expert produit', 'Problème à résoudre, utilisateurs cibles et leurs besoins, concurrents et différenciation, périmètre du MVP (dans / hors périmètre), modèle économique, indicateurs de succès.'),
    S('architecture', 'Architecture', 'Architecte logiciel', 'Composants et leurs responsabilités, flux de données, choix monolithe modulaire ou services (justifié), schéma en texte (ASCII ou Mermaid), 3 décisions clés au format ADR (contexte, décision, conséquences).'),
    S('arborescence', 'Arborescence', 'Développeur senior', 'Arborescence complète du dépôt (bloc de code), rôle de chaque dossier, conventions de nommage, organisation des tests.'),
    S('technologies', 'Technologies', 'CTO', 'Tableau : couche, technologie, version majeure, raison du choix, alternative écartée. Langages, cadres, base, hébergement, outils.'),
    S('base', 'Base de données', 'Expert base de données', 'Schéma entités-relations (Mermaid erDiagram), tables avec colonnes et types, clés, index, règles d’accès, stratégie de migration et de sauvegarde. Le SQL de création des tables principales.'),
    S('api', 'API', 'Développeur backend', 'Tableau des routes : méthode, chemin, rôle, authentification, corps, réponses. Format des erreurs, pagination, versionnage, extrait OpenAPI pour 2 routes.'),
    S('securite', 'Sécurité', 'Expert sécurité', 'Modèle de menaces, authentification et droits (RBAC), chiffrement, gestion des secrets, protections OWASP Top 10 concernées, RGPD (données, durée, droits).'),
    S('interface', 'Interface utilisateur', 'Expert UX/UI', 'Parcours principaux pas à pas, liste des écrans avec leur contenu, wireframes en texte, design system (couleurs, typographie, composants), accessibilité.'),
    S('deploiement', 'Déploiement', 'Expert DevOps', 'Environnements, pipeline CI/CD (étapes), hébergement et coût mensuel estimé, sauvegardes, surveillance et alertes, retour arrière. Un exemple de workflow GitHub Actions.'),
    S('evolutions', 'Évolutions futures', 'CTO', 'Version 2 et suivantes, montée en charge (10×, 100×), fonctions mises de côté, dette technique à surveiller.'),
    S('check-dev', 'Checklist développement', 'Développeur senior', 'Liste de tâches à cocher (- [ ]), dans l’ordre de réalisation, groupées par étape, chacune avec son critère de fin.'),
    S('check-secu', 'Checklist sécurité', 'Expert sécurité', 'Liste à cocher (- [ ]) des contrôles de sécurité à passer avant l’ouverture au public.'),
    S('check-prod', 'Checklist production', 'Expert DevOps', 'Liste à cocher (- [ ]) pour la mise en production : sauvegardes, alertes, légal, support, plan de retour arrière.'),
  ];
  const MAX_CONTEXTE = 9000;
  function promptSection(idee, sectionId, faites = [], lang) {
    const s = SECTIONS.find((x) => x.id === sectionId); if (!s) throw new Error('Section inconnue.');
    const i = SECTIONS.indexOf(s) + 1;
    let ctx = faites.map((f) => `### ${f.titre}\n${f.texte}`).join('\n\n');
    if (ctx.length > MAX_CONTEXTE) ctx = '…' + ctx.slice(-MAX_CONTEXTE);
    return { system: `Tu es ${s.role} dans une équipe composée d’un CTO, d’un architecte logiciel, d’un développeur senior, d’un expert IA, d’un expert sécurité, d’un expert UX/UI et d’un expert DevOps. Vous rédigez ensemble le dossier de conception professionnel d’un projet. Réponds uniquement avec le contenu demandé, en Markdown, précis et concret, sans phrase d’introduction ni de conclusion.${LANGUE(lang)}`,
      prompt: `PROJET : ${String(idee).slice(0, 6000)}\n\n${ctx ? `SECTIONS DÉJÀ RÉDIGÉES (reste cohérent avec elles) :\n${ctx}\n\n` : ''}Rédige la section ${i}/13 « ${s.titre} ».\nContenu attendu : ${s.consigne}\nCommence directement par le contenu (pas de titre « ${s.titre} », il est ajouté automatiquement).` };
  }
  function dossierMarkdown(titre, idee, faites) {
    return `# ${titre}\n\n> ${String(idee).replace(/\n+/g, ' ').slice(0, 600)}\n\n` + faites.map((f, i) => `## ${i + 1}. ${f.titre}\n\n${String(f.texte).trim()}`).join('\n\n') + '\n';
  }

  // ------------------------------------------------------------------ 📚 Documentations officielles
  const D = (id, nom, url, domaine, mots) => ({ id, nom, url, domaine, mots });
  const DOCS = [
    D('mdn', 'MDN Web Docs', 'https://developer.mozilla.org/fr/', 'Web', 'html css javascript js dom fetch http web navigateur api'),
    D('ts', 'TypeScript', 'https://www.typescriptlang.org/docs/', 'Web', 'typescript ts type interface'),
    D('react', 'React', 'https://react.dev/learn', 'Web', 'react composant hook usestate useeffect jsx'),
    D('next', 'Next.js', 'https://nextjs.org/docs', 'Web', 'next nextjs app router server component'),
    D('vue', 'Vue.js', 'https://vuejs.org/guide/introduction.html', 'Web', 'vue vuejs'),
    D('tailwind', 'Tailwind CSS', 'https://tailwindcss.com/docs', 'Web', 'tailwind css classe'),
    D('node', 'Node.js', 'https://nodejs.org/docs/latest/api/', 'Backend', 'node nodejs npm module stream'),
    D('express', 'Express', 'https://expressjs.com/', 'Backend', 'express middleware route'),
    D('nest', 'NestJS', 'https://docs.nestjs.com/', 'Backend', 'nest nestjs module controller provider'),
    D('python', 'Python', 'https://docs.python.org/fr/3/', 'Backend', 'python pip venv'),
    D('fastapi', 'FastAPI', 'https://fastapi.tiangolo.com/', 'Backend', 'fastapi pydantic uvicorn'),
    D('postgres', 'PostgreSQL', 'https://www.postgresql.org/docs/', 'Données', 'postgresql postgres sql index jointure transaction'),
    D('redis', 'Redis', 'https://redis.io/docs/latest/', 'Données', 'redis cache file'),
    D('mongo', 'MongoDB', 'https://www.mongodb.com/docs/', 'Données', 'mongodb mongo document'),
    D('supabase', 'Supabase', 'https://supabase.com/docs', 'Données', 'supabase auth storage'),
    D('firebase', 'Firebase', 'https://firebase.google.com/docs', 'Données', 'firebase firestore'),
    D('electron', 'Electron', 'https://www.electronjs.org/docs/latest', 'Desktop', 'electron ipc preload bureau desktop'),
    D('tauri', 'Tauri', 'https://tauri.app/', 'Desktop', 'tauri rust'),
    D('dotnet', '.NET et WPF', 'https://learn.microsoft.com/fr-fr/dotnet/', 'Desktop', 'dotnet net csharp c# wpf xaml'),
    D('flutter', 'Flutter', 'https://docs.flutter.dev/', 'Mobile', 'flutter dart widget'),
    D('rn', 'React Native', 'https://reactnative.dev/docs/getting-started', 'Mobile', 'native expo reactnative'),
    D('android', 'Android et Kotlin', 'https://developer.android.com/kotlin', 'Mobile', 'android kotlin compose'),
    D('apple', 'Apple Developer', 'https://developer.apple.com/documentation/', 'Mobile', 'swift swiftui ios iphone'),
    D('docker', 'Docker', 'https://docs.docker.com/', 'DevOps', 'docker dockerfile compose conteneur image'),
    D('k8s', 'Kubernetes', 'https://kubernetes.io/docs/home/', 'DevOps', 'kubernetes k8s pod helm'),
    D('actions', 'GitHub Actions', 'https://docs.github.com/fr/actions', 'DevOps', 'github actions ci cd workflow pipeline'),
    D('nginx', 'Nginx', 'https://nginx.org/en/docs/', 'DevOps', 'nginx proxy https serveur'),
    D('cloudflare', 'Cloudflare', 'https://developers.cloudflare.com/', 'DevOps', 'cloudflare worker d1 r2 dns'),
    D('vercel', 'Vercel', 'https://vercel.com/docs', 'DevOps', 'vercel déploiement deploy'),
    D('claude', 'Claude', 'https://docs.claude.com/', 'IA', 'claude anthropic prompt'),
    D('gemini', 'Gemini', 'https://ai.google.dev/gemini-api/docs', 'IA', 'gemini google ia'),
    D('openai', 'OpenAI', 'https://platform.openai.com/docs', 'IA', 'openai gpt chatgpt'),
    D('ollama', 'Ollama', 'https://docs.ollama.com/', 'IA', 'ollama local modelfile llama'),
    D('langchain', 'LangChain', 'https://docs.langchain.com/', 'IA', 'langchain chaîne agent'),
    D('llamaindex', 'LlamaIndex', 'https://docs.llamaindex.ai/', 'IA', 'llamaindex rag index embeddings'),
    D('pytorch', 'PyTorch', 'https://pytorch.org/docs/stable/', 'IA', 'pytorch torch tenseur entraînement'),
    D('mcp', 'Model Context Protocol', 'https://modelcontextprotocol.io/', 'IA', 'mcp model context protocol outil'),
    D('stripe', 'Stripe', 'https://docs.stripe.com/', 'SaaS', 'stripe paiement abonnement'),
    D('paddle', 'Paddle', 'https://developer.paddle.com/', 'SaaS', 'paddle paiement tva'),
    D('owasp', 'OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'SaaS', 'owasp sécurité injection xss csrf'),
    D('figma', 'Figma', 'https://help.figma.com/', 'SaaS', 'figma maquette design ux ui'),
  ];
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const VIDES = new Set(['et', 'de', 'la', 'le', 'les', 'des', 'du', 'en', 'js', 'un', 'une', 'avec']);
  /** Documentations les plus utiles pour une question (mots-clés). */
  function docsPour(question, max = 4) {
    const tok = (t) => norm(t).replace(/[^a-z0-9#+]+/g, ' ');
    const q = ' ' + tok(question) + ' ';
    const sc = DOCS.map((d) => ({ d, s: [...new Set(tok(d.mots + ' ' + d.nom).split(/\s+/))].filter((m) => m.length > 1 && !VIDES.has(m) && q.includes(' ' + m + ' ')).length }));
    return sc.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, max).map((x) => x.d);
  }
  function promptDocs(question, lang) {
    const docs = docsPour(question);
    return `Réponds à ma question technique en t’appuyant sur la documentation officielle, comme un développeur senior.
Règles : cite tes sources avec leur adresse (uniquement des documentations officielles${docs.length ? ', en priorité : ' + docs.map((d) => `${d.nom} ${d.url}`).join(' ; ') : ''}), donne un exemple de code minimal qui fonctionne, signale ce qui dépend de la version, et dis clairement si tu n’es pas sûr.

QUESTION : ${String(question).slice(0, 4000)}${LANGUE(lang)}`;
  }
  const CONTEXT7 = { nom: 'Context7', url: 'https://mcp.context7.com/mcp', site: 'https://context7.com' };

  // ------------------------------------------------------------------ 🤖 Espace autonome : missions
  const M = (id, icone, titre, desc, projet, consigne) => ({ id, icone, titre, desc, projet, consigne });
  const MISSIONS = [
    M('construire', '🏗', 'Construire une application', 'À partir d’une idée ou d’un kit : code, tests et README.', false, 'Construis cette application de bout en bout : propose d’abord un plan court, crée les fichiers, écris les tests, exécute-les et corrige jusqu’à ce qu’ils passent, puis écris le README (installation, lancement, tests).'),
    M('bugs', '🐞', 'Corriger les bugs', 'Lit le projet, lance les tests, trouve et corrige les erreurs.', true, 'Liste les fichiers du projet, lis les principaux, lance les tests ou le programme, identifie les bugs, corrige-les un par un et vérifie chaque correction.'),
    M('tests', '🧪', 'Écrire les tests', 'Ajoute des tests automatiques et les fait passer.', true, 'Identifie la logique importante du projet, écris des tests automatiques (outil de test adapté au langage), exécute-les et corrige les tests ou le code jusqu’à ce que tout passe.'),
    M('documenter', '📝', 'Documenter le projet', 'README, guide d’installation, commentaires utiles.', true, 'Lis le projet et rédige une documentation professionnelle : README (présentation, installation, lancement, tests, déploiement, structure), et commentaires là où le code est difficile.'),
    M('securite', '🛡', 'Audit de sécurité', 'Contrôle OWASP, secrets, dépendances ; corrections proposées.', true, 'Fais un audit de sécurité du projet selon l’OWASP Top 10 : secrets dans le code, injections, contrôle d’accès, dépendances vulnérables, configuration. Classe les problèmes par gravité et corrige ceux qui sont sûrs à corriger.'),
    M('ameliorer', '⚡', 'Améliorer et optimiser', 'Performances, lisibilité, découpage en modules.', true, 'Analyse le projet et améliore-le sans changer son comportement : performances, lisibilité, découpage en modules, gestion des erreurs. Vérifie avec les tests après chaque changement.'),
    M('libre', '🎯', 'Mission libre', 'Décrivez ce que votre IA doit accomplir.', false, 'Accomplis cette mission de bout en bout.'),
  ];
  const REGLES_MISSION = 'Règles de la mission : travaille en autonomie, étape par étape ; commence par un plan court ; explique chaque action en une phrase ; Ivass me demandera mon accord avant toute commande, exécution de code ou écriture dans un projet existant ; termine par un rapport : ce qui a été fait, fichiers modifiés, tests, et ce qu’il reste à faire.';
  function promptMission(id, o = {}) {
    const m = MISSIONS.find((x) => x.id === id); if (!m) throw new Error('Mission inconnue.');
    return `🎯 MISSION « ${m.titre} »\n\n${m.consigne}${o.projet ? `\n\nProjet : le dossier du projet est « ${o.projet} » (tes outils de fichiers y travaillent directement).` : ''}${o.details ? `\n\nDétails : ${String(o.details).slice(0, 6000)}` : ''}\n\n${REGLES_MISSION}${LANGUE(o.lang)}`;
  }
  /** Mission sans outils (téléphone) : plan en étapes, puis chaque étape, puis le rapport. */
  function promptPlanTexte(objectif, lang) {
    return `Tu travailles en autonomie sur cette mission : « ${String(objectif).slice(0, 4000)} ».
Découpe-la en 3 à 6 étapes concrètes, qui produisent chacune un résultat écrit (analyse, code, texte, tableau…).
Réponds UNIQUEMENT avec un tableau JSON : ["étape 1", "étape 2", …]${LANGUE(lang)}`;
  }
  function lirePlan(text) {
    const s = String(text || ''); const a = s.indexOf('['), b = s.lastIndexOf(']');
    let arr = null; if (a >= 0 && b > a) { try { arr = JSON.parse(s.slice(a, b + 1)); } catch (_) { arr = null; } }
    if (!Array.isArray(arr)) arr = s.split('\n').map((x) => x.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter((x) => x.length > 3);
    return arr.map((x) => String(typeof x === 'string' ? x : (x && (x.etape || x.titre)) || '').slice(0, 300)).filter(Boolean).slice(0, 6);
  }
  function promptEtape(objectif, plan, i, faits, lang) {
    let ctx = faits.map((f, k) => `### Étape ${k + 1} : ${plan[k]}\n${f}`).join('\n\n');
    if (ctx.length > MAX_CONTEXTE) ctx = '…' + ctx.slice(-MAX_CONTEXTE);
    return `MISSION : ${String(objectif).slice(0, 3000)}\nPLAN : ${plan.map((p, k) => `${k + 1}. ${p}`).join(' ')}\n\n${ctx ? `TRAVAIL DÉJÀ FAIT :\n${ctx}\n\n` : ''}Réalise maintenant l’étape ${i + 1} : « ${plan[i]} ». Produis le résultat complet de cette étape (pas un résumé), en Markdown.${LANGUE(lang)}`;
  }
  function promptRapport(objectif, plan, faits, lang) {
    let ctx = faits.map((f, k) => `### ${plan[k]}\n${f}`).join('\n\n');
    if (ctx.length > MAX_CONTEXTE * 2) ctx = ctx.slice(0, MAX_CONTEXTE * 2) + '…';
    return `MISSION : ${String(objectif).slice(0, 3000)}\n\nRÉSULTATS DES ÉTAPES :\n${ctx}\n\nRédige le livrable final de la mission, complet et directement utilisable, puis une courte section « Prochaines étapes ».${LANGUE(lang)}`;
  }

  // ------------------------------------------------------------------ 🗜 ZIP (sans compression) pour les kits sur le téléphone
  let CRC = null;
  const crc32 = (u8) => {
    if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0;
  };
  /** files : [{ path, content (texte) }] → Uint8Array d'une archive .zip */
  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let off = 0;
    const d = new Date(); const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1); const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(String(f.path).replace(/^\/+/, '')), data = enc.encode(String(f.content)), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      parts.push(new Uint8Array(h.buffer), name, data); central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const csize = central.reduce((a, p) => a + p.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    const all = [...parts, ...central, new Uint8Array(e.buffer)]; const out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
    let p = 0; for (const x of all) { out.set(x, p); p += x.length; }
    return out;
  }

  return { NIVEAUX, LECONS, leconFaite, progression, promptLecon, promptQuiz, lireQuiz, promptRelecture,
    SECTIONS, promptSection, dossierMarkdown, DOCS, docsPour, promptDocs, CONTEXT7,
    MISSIONS, REGLES_MISSION, promptMission, promptPlanTexte, lirePlan, promptEtape, promptRapport, zip, crc32 };
});
