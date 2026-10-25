# Politique de confidentialité d'Ivass AI

*Version 1 — en vigueur au 19 octobre 2026*

## 1. Qui est responsable ?

Le responsable du traitement des contributions est **Messaoud BELGHAZI**, éditeur d'Ivass AI. Contact : **[ADRESSE E-MAIL DE CONTACT À COMPLÉTER]**.

## 2. Le principe : tout reste sur votre ordinateur

Ivass AI fonctionne **hors ligne**. Vos discussions, votre bibliothèque, vos projets, vos fichiers, vos clés API (chiffrées) et vos réglages sont enregistrés uniquement sur votre ordinateur, dans le dossier `%APPDATA%\Ivass AI`.

Ivass ne se connecte à Internet que pour :
- **les IA que vous avez choisies** : vos questions partent directement de votre ordinateur vers ces services, avec vos clés, et l'éditeur n'y a pas accès ;
- **les recherches web** que vous lancez ;
- **la vérification des mises à jour** sur GitHub : GitHub voit alors votre adresse IP, comme pour toute visite d'un site ;
- **le programme d'amélioration**, seulement si vous l'avez accepté (voir ci-dessous).

## 3. Le programme d'amélioration (facultatif)

### Votre accord

Le programme est **désactivé par défaut**. Vous choisissez librement, catégorie par catégorie, ce que vous partagez, au premier lancement ou plus tard dans ⚙ Paramètres. Refuser ne change rien à l'utilisation d'Ivass AI.

La base légale est votre **consentement** (article 6.1.a du RGPD). Vous pouvez le retirer à tout moment, en un clic.

### Les catégories

| Catégorie | Contenu |
|---|---|
| 👍 Notes | Votre note sur une réponse et le nom de l'IA qui l'a écrite (aucun texte) |
| 💬 Conversations nettoyées | Vos questions et les réponses d'Ivass |
| 🧭 Méthodes, solutions et résultats | Le plan de réflexion, les étapes de l'agent, les essais de correction, la solution trouvée et si elle a réussi |
| 🐞 Erreurs et corrections | Les plantages d'Ivass, les erreurs des IA, les corrections automatiques de code (erreur, cause, code corrigé) |

Vous pouvez aussi envoyer vous-même une idée ou un bug avec le bouton prévu : c'est alors un envoi volontaire, ponctuel.

### Ce qui n'est jamais envoyé

- votre navigation et votre historique web ;
- les fichiers de votre ordinateur ;
- votre bibliothèque ;
- vos clés API ;
- les documents analysés (factures, contrats) ;
- les analyses d'entreprise ;
- les discussions que vous marquez **🔒 Ne pas partager** ;
- votre nom, votre e-mail et l'identifiant de votre ordinateur.

### Nettoyage avant envoi

Avant que quoi que ce soit ne quitte votre ordinateur, Ivass remplace automatiquement les éléments suivants :
- les clés et jetons d'accès, les mots de passe ;
- les adresses e-mail, les numéros de téléphone ;
- les IBAN, les numéros de carte bancaire, les numéros de sécurité sociale ;
- les adresses IP, les noms d'utilisateur présents dans les chemins de fichiers.

Ce nettoyage automatique ne peut pas reconnaître toutes les informations personnelles : un nom propre écrit dans une question, par exemple, peut rester. **N'activez « Conversations » que si vous êtes d'accord**, et utilisez 🔒 pour les discussions privées. Vous pouvez voir et retirer chaque élément en attente avant son départ.

### Chiffrement

Les contributions attendent sur votre ordinateur tant que vous êtes hors ligne. Dès qu'Internet revient, elles sont **chiffrées sur votre ordinateur** (format IVX1 : X25519 + AES-256-GCM) puis envoyées en HTTPS. Seule la clé privée de l'éditeur, qui n'est ni dans le logiciel ni sur le serveur, permet de les relire. Le serveur ne stocke que des paquets illisibles.

### Identifiant

Chaque installation reçoit un identifiant aléatoire, sans lien avec votre identité, pour regrouper les envois et permettre leur effacement. Cet identifiant est renouvelé quand vous demandez l'effacement. Le serveur n'enregistre pas votre adresse IP.

### Pourquoi ces données sont utilisées

- corriger les bugs et améliorer la stabilité ;
- mesurer quelles IA et quelles méthodes donnent les meilleurs résultats ;
- améliorer les instructions et la correction automatique ;
- créer des **packs de connaissances** distribués à tous les utilisateurs dans les mises à jour. Ils sont faits uniquement de réponses notées 👍 ou de solutions qui ont réussi, relues par l'éditeur avant diffusion.

Les données ne sont **jamais vendues** ni utilisées pour de la publicité.

### Hébergement et durée

Le serveur de réception est hébergé par **Cloudflare** (Cloudflare Workers et base D1). Cloudflare peut traiter les données hors de l'Union européenne et adhère au cadre UE–États-Unis de protection des données (Data Privacy Framework). Comme les paquets sont chiffrés, Cloudflare ne peut pas les lire.

Les paquets restent sur le serveur **12 mois au plus**. Ils sont en général effacés dès que l'éditeur les a téléchargés. Leurs versions déchiffrées sont conservées sur l'ordinateur de l'éditeur **24 mois au plus**. Seuls les contenus intégrés à un pack de connaissances, nettoyés et relus, peuvent être gardés plus longtemps.

### Lettre d’information (facultative)

Si vous vous y inscrivez vous-même (Paramètres › 🤝 Contribution, ou Réglages sur téléphone), votre adresse e-mail et, si vous le souhaitez, votre prénom partent **chiffrés** au créateur d’Ivass AI, uniquement pour vous envoyer les nouveautés et conseils d’Ivass AI. Ils ne sont jamais vendus ni partagés. Vous vous désinscrivez en un clic au même endroit ; « Effacer mes données sur le serveur » retire aussi votre inscription. Base légale : votre consentement.

### Nouveautés et packs

Les **📣 Nouveautés** sont lues sur la page publique d’Ivass AI et sur le serveur de contributions, sans rien envoyer de vous. Un **🎁 pack à partager** est un fichier créé sur votre PC à partir de votre bibliothèque (jamais vos discussions ni votre historique), nettoyé avant export ; c’est vous qui choisissez à qui l’envoyer.

## 4. Vos droits

Vous disposez des droits d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité, ainsi que du droit de retirer votre consentement. Dans Ivass AI, rubrique ⚙ Paramètres → Contribution & mises à jour, vous pouvez :
- **voir** ce qui attend d'être envoyé et ce qui a été envoyé ;
- **retirer** un élément, ou **arrêter** une catégorie (ce qui attendait est effacé aussitôt) ;
- **effacer toutes vos données sur le serveur** en un clic.

Vous pouvez aussi écrire à l'éditeur, ou déposer une réclamation auprès de la **CNIL** (www.cnil.fr).

## 5. Mineurs

Le programme d'amélioration est réservé aux personnes de **15 ans ou plus**. En dessous, il faut l'accord d'un parent.

## 6. Modifications

En cas de changement important, la nouvelle politique vous sera présentée au lancement suivant, et votre accord vous sera demandé à nouveau.
