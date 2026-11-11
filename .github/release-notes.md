## Ivass AI — PC {PC} · Android {MOB}

Ivass AI : votre assistant d'intelligence artificielle, sur PC, Android et iPhone

Développé par **Messaoud BELGHAZI**.

### ⬇ Télécharger
| Appareil | Fichier |
|---|---|
| 💻 **PC Windows 10 / 11** (64 bits) | **Ivass-AI-Setup-{PC}.exe** ci-dessous |
| 🤖 **Android 7 ou plus récent** | **Ivass-AI-Mobile.apk** ci-dessous |
| 📱 **iPhone** (iOS 16.4+) | ouvrez https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/iphone/ dans **Safari**, puis Partager → « Sur l'écran d'accueil » |

Page de téléchargement avec toutes les explications : https://messaoud89belghazi-bit.github.io/ivass-ai-telechargement/

### 🎬 Clé Luma reconnue : vidéo Ray 2 jusqu’en 4K et image Photon (3.29)
- Une clé **Luma** (`luma-…`) collée dans Ivass était confondue avec une clé de discussion et refusée par Together AI (« HTTP 401 »). Elle est maintenant reconnue comme une **clé de création** : vérifiée directement auprès de Luma, puis chiffrée sur votre PC.
- **🎬 Vidéo Luma Ray 2** : 540p à **4K native**, 5 ou 9 secondes par plan, tous les formats (16:9, 9:16, 1:1…). Le directeur artistique la choisit quand vous demandez de la 4K. Une vidéo à partir d’une image locale passe automatiquement au moteur suivant.
- **🖼 Image Luma Photon**, ajoutée aux moteurs d’images.
- Clé à créer sur https://lumalabs.ai/dream-machine/api/keys (la génération Luma est facturée sur votre compte Luma).

### 🧩 Skills : les compétences au format Agent Skills deviennent des ressources d’Ivass (3.29)
Dans 🔌 Connecteurs, nouvel onglet **🧩 Skills** :
- **Barre de recherche** : skills installées, catalogues de skills (par défaut le dépôt officiel `anthropics/skills`, ajoutez les vôtres) et dépôts publics GitHub.
- **Installer** : adresse GitHub (un dépôt entier ou le dossier d’une skill ; s’il y en a plusieurs, vous choisissez), archive **.zip / .skill**, dossier, ou **SKILL.md collé**. Toute skill au format ouvert *Agent Skills* (SKILL.md avec nom et description, plus scripts, références et ressources) est compatible.
- **Exploration autonome** : à l’installation, Ivass analyse chaque skill : langages, dépendances, outils nécessaires (présents ou non sur votre PC), références, ressources, **points de vigilance** (code téléchargé puis exécuté, suppressions massives, consignes de détournement), licence (les skills non libres sont signalées). L’IA résume ses capacités et une fiche est ajoutée à la bibliothèque.
- **Utilisation par Ivass** : en discussion, Ivass voit toutes vos skills actives et charge automatiquement les instructions complètes de **celles qui servent la demande**. Il peut en utiliser plusieurs à la fois, ou celle que vous nommez. En mode Agent, l’outil **« competence »** lui permet de lire une skill, ses références et ses fichiers. **Rien n’est jamais exécuté à l’installation** : les scripts d’une skill passent par l’Agent et attendent votre approbation, comme toute commande.
- Activer, désactiver, ouvrir le dossier, retirer : depuis chaque carte.

### 🖼 Icône du Bureau et réponses vides corrigées (3.28.2)
- **Icône du Bureau** : après une installation par-dessus une version précédente, le raccourci pouvait afficher une page blanche. Les raccourcis du Bureau et du menu Démarrer sont maintenant recréés avec une icône dédiée (fichier .ico séparé, toujours lisible), puis Windows recharge ses icônes.
- **Réponses vides** : à une question simple (« donne-moi le lien de l’API Luma »), l’IA pouvait répondre par un bloc « action » vide (un appel d’outil qu’elle n’avait pas le droit de faire en discussion). Ivass le détecte et fait répondre l’IA directement, avec les liens officiels du catalogue (Luma, Odoo… sont maintenant reconnus même par leur nom court).

### 🧪 Auto-correction honnête (3.28.1)
- « ✓ Corrigé et fonctionnel » ne s’affiche plus pour un programme qui s’exécute seulement « sans erreur ». Avant de valider une correction, Ivass vérifie qu’elle règle le vrai problème. Il **refuse** la correction si elle fabrique le fichier manquant avec un contenu inventé, avale l’erreur (try/catch ou except vide, SilentlyContinue, 2>$null, exit 0), retire la partie qui échouait, ajoute une simulation ou un « TODO », ou si la sortie se limite à un message comme « Exécution… ». Il essaie alors une autre approche.
- Fichier absent (par ex. « ivass_video_studio.py introuvable ») : Ivass ne l’invente plus. Il le dit clairement, garde votre code d’origine et propose **✍ Demander à Ivass d’écrire ce fichier** en décrivant ce qu’il doit faire.

### 🧠 Écosystème des connecteurs : toutes vos plateformes, une seule intelligence (3.28)
Dans 🔌 Connecteurs, quatre nouveaux onglets :
- **🧠 Centre de commande** : une question (« Montre tous les projets en retard », « Résume l’activité du jour sur toutes mes plateformes »…) ; Ivass interroge **en parallèle** toutes les plateformes reliées et autorisées, lit les éléments utiles, ajoute votre bibliothèque, puis rédige une **analyse croisée sourcée** [C1] : réponse directe, apport de chaque plateforme, liens entre les sources, risques et opportunités, actions conseillées, ce qui manque. Rien n’est modifié sur vos plateformes. Aussi depuis une discussion : `/centre votre question`.
- **🩺 État et droits** : santé de chaque connexion (vérifiée au démarrage puis toutes les 6 h, pannes signalées), reconnecter, désactiver, déconnecter ; **droits par plateforme** (consultable par l’IA, synchronisation, écriture — une écriture désactivée est refusée même en mode Agent) ; **synchronisation incrémentale** vers la bibliothèque (à la demande, chaque heure, toutes les 6 h ou chaque jour : seuls les éléments nouveaux ou modifiés sont relus) ; **journal d’accès** de chaque recherche, lecture et action, exportable en CSV pour un audit.
- **⚡ Automatisations** : Déclencheur (chaque jour à une heure, nouveautés d’une synchronisation, ou manuel) → Analyse par l’IA → Décision → Exécution → Suivi. La note dans la bibliothèque et la notification Windows se font seules ; **toute action sur une plateforme attend votre validation** (file « À valider »). 💡 L’IA peut proposer des automatisations adaptées à vos plateformes.
- **🛠 Créer un connecteur** : collez l’adresse d’une spécification **OpenAPI / Swagger** (ou choisissez le fichier) : Ivass lit l’adresse de l’API, l’authentification et les routes, crée et teste le connecteur, le rend interrogeable par le centre de commande et synchronisable route par route. Lecture seule.
- **Catalogue** : 217 plateformes, avec les ERP (SAP, Odoo, NetSuite, Sage, Dynamics 365, Oracle), PostgreSQL, MySQL, SQL Server, Redis, Elasticsearch, Azure DevOps, Kubernetes, Adobe Commerce, BigCommerce.

### 🌍 Publication du Savoir Ivass réparée (3.27.1)
- Quand le jeton « Savoir » est refusé (expiré, sans droit d’écriture, ou limité à un autre dépôt), Ivass publie automatiquement avec le **jeton du fondateur** (celui de « 🚀 Publier »), sans rien écrire avec le jeton refusé.
- Message précis : jeton expiré, droit « Contents » manquant ou dépôt non autorisé. Nouveau bouton **🔍 Vérifier les jetons** (avec la date d’expiration).

### 🎨 Ivass crée vos images et vos vidéos dans la discussion (3.27)
- Écrivez simplement « **génère une image** d’un phare au coucher du soleil, style aquarelle », « **crée une vidéo** TikTok de 30 secondes en 4K… », « fais un **logo** avec le texte “IVASS” » — ou joignez une photo et écrivez « **anime cette image** ». L’image ou la vidéo apparaît **dans la conversation**, avec 💾 Enregistrer, ↗ Ouvrir, 🔁 Nouvelle version, 🎬 En faire une vidéo, 🔍 Refaire en 4K.
- **Directeur artistique** : Ivass comprend la demande en français (format 16:9, vertical 9:16, carré, affiche ; qualité HD, Full HD, 4K, 8K ; durée ; nombre d’images ; style ; cadrage ; mouvement de caméra ; lumière ; ambiance ; dialogue et son ; texte exact à écrire ; « sans personnes »…), puis écrit un prompt professionnel en anglais, adapté à chaque moteur. Le prompt utilisé est visible sous le résultat.
- **Sans aucune clé** : un générateur d’images gratuit (Pollinations.ai) prend le relais — désactivable.
- **Vidéos** : nouveau moteur **Google Gemini Omni Flash** (720p, 1080p et **4K** agrandis par Google, son et dialogues). Les modèles « Veo 3.1 Preview », **arrêtés par Google le 22 octobre 2026**, sont remplacés automatiquement (Omni Flash, Veo 3). Une vidéo plus longue qu’un moteur ne le permet est découpée en plans cohérents puis assemblée. Si un moteur refuse (quota, clé, modèle arrêté), Ivass passe au suivant tout seul.
- **Aucun moteur vidéo relié** : Ivass compose un **diaporama animé** à partir d’images IA (mouvement de caméra lent, fondus) et le dit clairement.
- **4K honnête** : quand un moteur ne produit pas la 4K, Ivass l’annonce et agrandit (Real-ESRGAN si installé, sinon FFmpeg).

### 🔌 Nouvel outil « Connecteurs » dans la barre de menu
- **Se connecter avec Google** : un clic ouvre la page officielle de Google ; vous créez la clé, vous la copiez, Ivass la **reconnaît toute seule**, la vérifie, la range chiffrée et l’efface du presse-papiers. Même chose pour OpenAI, Claude, Hugging Face, OpenRouter, Groq, Mistral, DeepSeek, Grok, Perplexity (connexion Google, Microsoft, GitHub ou e-mail).
- **Mes plateformes IA** : ChatGPT, Gemini, Copilot, Claude, Perplexity, Le Chat, DeepSeek, Grok, Midjourney, Leonardo, Ideogram, Firefly, Canva, Runway, Kling, Pika, Luma, Hailuo, CapCut, Suno, ElevenLabs… **plusieurs comptes par plateforme**, chacun dans sa fenêtre isolée (connexion par e-mail) ou dans votre **profil Chrome / Edge** (connexion Google). Ivass n’enregistre aucun mot de passe et n’agit jamais à votre place dans ces pages.
- **Images et vidéos** : générateurs disponibles, moteur préféré, création automatique dans la discussion.

### 📥 Bibliothèque : beaucoup plus de formats
- Importez maintenant des **PDF, Word, Excel, PowerPoint, OpenDocument**, du **code** (.py, .js, .ts, .java, .cs, .php, .sql, .go, .rs…), CSV, HTML, YAML… Les longs documents sont découpés en parties pour de meilleures réponses.

### 👆 Plus de fenêtre Windows Hello au démarrage (3.26.1)
- La fenêtre « Sécurité Windows — Déverrouiller votre compte Ivass AI » ne s'ouvre **plus toute seule** à chaque lancement.
- Si la protection biométrique est activée, les réglages sensibles du compte restent protégés : le code PIN n'est demandé **que si vous cliquez sur « 👆 Déverrouiller »** dans ⭐ Versions › 👤 Compte.
- Pour ne plus jamais la voir : ⭐ Versions › 👤 Compte › 👆 Déverrouiller (une dernière fois) › 🔐 Sécurité › 👆 Biométrie → désactivé.

### 🎼 Ivass se sert enfin de tout ce que vous avez rattaché et installé
- **Plateformes rattachées consultées toutes seules selon le sujet**, sans avoir à les nommer : une erreur de code → Stack Overflow, npm & PyPI, GitHub ; une question scientifique ou d'IA → arXiv, OpenAlex ; un modèle ou un jeu de données → Hugging Face ; des statistiques → data.gouv.fr ; une définition, une personne, un lieu → Wikipédia ; vos sites web et dossiers rattachés pour les questions techniques. La meilleure réponse est **lue** (pas seulement le titre), nettoyée des consignes cachées et **citée [R1]**.
- La **🔎 Recherche approfondie** interroge aussi toutes ces plateformes, en plus du web, du Savoir ouvert et de la bibliothèque.
- **Vos outils installés** (Python, Node.js, Git, Docker, Go, Rust, .NET, Java…) sont connus d'Ivass : il propose du code et des commandes qui tournent sur **votre** PC, avec vos versions, et signale un outil absent (PHP…) avec sa commande d'installation.
- **Catalogue des 201 intégrations** : une plateforme citée (Airtable, Asana, Stripe…) → Ivass donne sa vraie méthode d'authentification, sa documentation officielle et la façon de la relier, au lieu d'inventer.
- Ivass connaît vos **rattachements** (Notion, Todoist, serveurs MCP…) et propose le mode 🤖 Agent pour agir dedans.
- Réglable : ⚙️ Paramètres › Réglages › 📚 Connaissances.


- Ivass ne doit plus jamais livrer un code qui **fait semblant** : un script qui affiche « diagnostic terminé, 0 problème » sans rien vérifier, une « simulation », un résultat écrit en dur, des modules ou des paramètres jamais utilisés.
- **Contrôle automatique de chaque code livré** : analyse du code (actions réelles derrière chaque message, imports et paramètres inutilisés, fonctions vides qui annoncent un succès) et **vérification de la syntaxe sans exécuter le programme** (Python et JavaScript).
- Un défaut trouvé déclenche **toujours** une correction, même si le contrôle qualité est désactivé : Ivass explique en clair ce qui n'allait pas, puis donne le **code corrigé complet** qui fait vraiment ce qu'il annonce, ou demande l'information qui lui manque (fichier à ouvrir, commande, message d'erreur).
- Le contrôle qualité voit maintenant **la discussion récente** : il vérifie que la réponse traite le vrai problème (par exemple le fichier qui pose souci), pas un sujet voisin.


- **L'historique des discussions passe en premier** : il garde toujours au moins un tiers de la hauteur, même sur un petit écran.
- « ＋ Nouvelle discussion » tout en haut ; le menu des outils en grille d'icônes compacte (nom au survol), ou en liste par groupes (bouton ▤), qui ne déborde plus.
- ⭐ Versions rejoint la rangée du bas ; les filtres tiennent sur une ligne ; 🧰 Outils & API n'a plus la même icône que la console.

 et contrôle qualité IVASS-QA
- Ivass travaille comme une **équipe complète d'experts** (CTO, architecte, développeur senior, cybersécurité, juriste, business, UX, cloud…) : il analyse les besoins explicites et cachés, les contraintes, les risques et les opportunités avant de répondre.
- **Projets, logiciels, stratégies** : réponse en rubriques (Analyse, Diagnostic, Solution, Architecture, Plan d'exécution, Risques, Optimisations, Évolutions futures, Guide utilisateur, Étapes suivantes) ; pour une idée, quatre niveaux **MVP · Startup · Enterprise · Mondiale** ; la documentation utile (cahier des charges, guides, feuille de route…) est proposée.
- **Question simple → réponse simple et juste** : pas de remplissage.
- **🛡 IVASS-QA** : une seconde IA **relit vraiment** chaque réponse de projet, de code ou de stratégie (bugs, sécurité, RGPD, faisabilité, business) et ajoute en dessous ce qu'elle a vérifié, les problèmes trouvés **avec leurs corrections**, les hypothèses et le niveau de confiance.
- Réglables dans ⚙️ Paramètres › Réglages › 💬 Réponses et intelligence (Automatique, Toujours complet ou Désactivé).


- **🔎 Recherche approfondie** (nouveau bouton, ou écrivez « fais une recherche sur… ») : Ivass prépare plusieurs recherches, lit des pages web, le Savoir ouvert et votre bibliothèque, rédige une réponse **sourcée [W1] [S1]**, puis **vérifie les faits** avant de vous l'afficher.
- **Plus de hors-sujet** : une fiche de la bibliothèque n'est jointe à la question que si elle en parle vraiment.
- **Réponses instantanées plus prudentes** : seulement pour la même question (ou une réponse que vous avez notée 👍), jamais quand une version ou un nombre change.
- **Fini les boucles** : un passage qui se répète est coupé, retiré de l'écran et la réponse reprend sans répéter. Quand vous écrivez « ça ne marche toujours pas », Ivass cherche la cause et **change d'approche** au lieu de redonner la même solution. L'Agent ne refait plus trois fois la même action.

### ⚙️ Paramètres réorganisés et 📍 localisation
- Les réglages sont rangés par **rubriques** (Apparence, Réponses et intelligence, Connaissances, Recherche web, Localisation, Fonctionnement, Instructions), avec une **recherche** pour trouver un réglage.
- **📍 Localisation** (désactivée par défaut) : votre ville choisie, détectée automatiquement (approximative) ou précise via Windows. Ivass s'en sert pour la météo sans préciser la ville, l'heure locale et « près de chez moi ». Seules la ville et l'heure locale sont données à l'IA.

### 🛡 Sécurité
- Moteur Electron mis à jour (version 44, maintenue) et exécutable verrouillé (fusibles : impossible de le détourner en Node.js ou d'y injecter du code au démarrage).
- Seule la fenêtre d'Ivass AI peut appeler le cœur de l'application ; les liens ne s'ouvrent que s'ils sont web ou e-mail ; la fenêtre principale ne peut plus être redirigée vers une autre page locale.
- Dépendance vulnérable corrigée (0 faille connue).

, une grande base de connaissances libre
- Ivass AI dispose d'une **base centrale de savoir libre** (objectif : plus de 5 Go de texte) : **Wikipédia** en français et en anglais, les **documentations officielles** de 57 langages et outils (JavaScript, Python, Node, React, SQL, Docker…), des **livres du domaine public** et des **jeux ouverts de questions-réponses**. Chaque document garde son **lien et sa licence**.
- Chaque PC en garde une **copie partielle** (vous choisissez les collections et la place maximale : 0,5 à 50 Go). Ivass y cherche **hors ligne et sans clé d'API**, puis cite ses sources **[S1], [S2]…** dans la réponse.
- 📚 Bibliothèque › **Savoir ouvert** : mise à jour de la copie (chaque paquet est vérifié par empreinte SHA-256), recherche directe, activation ou désactivation.
- Rien de personnel n'est envoyé : la copie est seulement téléchargée.

 que celui des grandes plateformes d'IA
- **Adresse e-mail vérifiée** par un code à 6 chiffres, puis **mot de passe** (10 caractères minimum, jauge de robustesse, mots de passe courants refusés). Le mot de passe n'est **jamais envoyé** : il est étiré sur votre appareil (PBKDF2-SHA-256, 600 000 tours) et seul le résultat part au serveur.
- **Double authentification (2FA)** : code à 6 chiffres de votre application d'authentification (Google Authenticator, Microsoft Authenticator, 2FAS…), QR code sur PC, lien direct sur téléphone, **10 codes de secours**.
- **Appareils de confiance** : un nouvel appareil est confirmé par un code envoyé par e-mail ; vous voyez et retirez vos appareils de confiance, et déconnectez tous les autres appareils en un clic.
- **Mot de passe oublié** : code par e-mail (+ code 2FA si elle est activée) ; tous les appareils sont déconnectés par sécurité.
- 👆 **Biométrie** quand l'appareil le permet : **Windows Hello** (visage, empreinte), **Touch ID** sur Mac, **empreinte / visage** sur Android, **Face ID / Touch ID** sur iPhone — déverrouille le compte au démarrage et confirme les actions sensibles. Votre empreinte et votre visage restent dans l'appareil.
- Protection contre la recherche d'adresses inscrites, limites de tentatives, alertes par e-mail.

### 🖥 Interface mesurée au pixel
- Plus aucun nom coupé dans le menu (« Recherche a… », « Bibli… », « Rattach… ») : les noms passent à la ligne, les compteurs sont des pastilles, le menu a de la place pour les futurs outils et la barre latérale s'élargit à la souris.
- **Adaptation automatique à l'écran** : taille de l'écran, densité de pixels et type de pointeur détectés ; zoom choisi tout seul (petit portable, Full HD, QHD, 4K, tablette Windows) ou réglé dans ⚙ Paramètres › Général › Taille de l'interface.
- Audit d'affichage sur 10 écrans (1024 × 640 à 4K) et plusieurs langues : textes, boutons, onglets, menus et fenêtres vérifiés en pixels ; l'interrupteur qui sortait de son rail est corrigé.

### 🤖 Agent : plus jamais bloqué sur une commande
- Un **serveur** lancé par l'agent (`node backend/src/main.js`, `npm start`, `nest start`, `uvicorn`, `python manage.py runserver`…) ne se termine jamais tout seul : Ivass vérifie qu'il **démarre**, puis l'arrête et continue la mission en vous donnant la commande pour le lancer vous-même.
- **Délai dépassé** ou bouton **■ Arrêter** : toute la chaîne de processus est arrêtée (sous Windows, `cmd.exe` **et** le programme lancé), et l'agent reprend la main.

### 🧭 Menu plus compact
- Les outils prennent moins de place ; la barre du bas (⭐ Versions, ⚙ Paramètres, 📣, 📤) et vos discussions restent **toujours visibles**, même sur un petit écran.
- Chaque groupe du menu (Travailler, Créer, Développer, Connaissances, Protéger) se **replie d'un clic** ; Ivass s'en souvient.
- Les compteurs sont abrégés (19 626 → 19,6k).

### ⚖️ Mentions légales complétées
- Éditeur et vendeur : **IVASS SERVICES**, SARL, SIRET 940 702 780 00013, 61 rue de Lyon, 75012 Paris — contact : **ivass.contact@gmail.com** (CGU, CGV, politique de confidentialité, page de téléchargement).

### 📧 Comptes : e-mails de vérification et de mot de passe oublié
- Envoi par **Brevo** (sans domaine : expéditeur ivass.contact@gmail.com, 300 e-mails/jour gratuits) ou **Resend** (avec votre domaine) — au choix dans `activer-comptes.bat`.
- Tant que les comptes ne sont pas ouverts sur le serveur, plus de formulaire inutilisable : un message clair à la place.
- Paiements pas encore ouverts : « Bientôt disponible » au lieu de boutons d'achat actifs.
- Menu : les pastilles (20k, 15…) ne recouvrent plus les noms ; si un nom ne tient pas (police Windows, langue), le menu passe sur une colonne.
