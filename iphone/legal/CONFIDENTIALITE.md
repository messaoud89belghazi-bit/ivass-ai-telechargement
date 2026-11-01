# Politique de confidentialité d'Ivass AI

*Version 3 — en vigueur au 1er novembre 2026*

## 1. Qui est responsable ?

Le responsable du traitement est **IVASS SERVICES** (SARL, SIRET 940 702 780 00013, 61 rue de Lyon, 75012 Paris), éditeur d'Ivass AI, représentée par **Messaoud BELGHAZI**. Contact : **ivass.contact@gmail.com**.

## 2. Le principe : tout reste sur votre ordinateur

Ivass AI fonctionne **hors ligne**. Vos discussions, votre bibliothèque, vos projets, vos fichiers, vos clés API (chiffrées) et vos réglages sont enregistrés uniquement sur votre ordinateur, dans le dossier `%APPDATA%\Ivass AI`.

Ivass ne se connecte à Internet que pour :
- **les IA que vous avez choisies** : vos questions partent directement de votre ordinateur vers ces services, avec vos clés, et l'éditeur n'y a pas accès ;
- **les recherches web** que vous lancez ;
- **la vérification des mises à jour** sur GitHub : GitHub voit alors votre adresse IP, comme pour toute visite d'un site ;
- **le programme d'amélioration**, seulement si vous l'avez accepté (voir ci-dessous) ;
- **la vérification des versions** (Free, Basic, Plus, Pro, Enterprise, Ultimate) et, si vous les utilisez, le **compte Ivass**, la **licence** et le **parrainage** (voir la section « Compte Ivass, versions payantes et parrainage »).

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

## 3 bis. Compte Ivass, versions payantes et parrainage

**Sans compte, rien n'est envoyé.** Ivass Free fonctionne sans compte : Ivass AI demande seulement au serveur si les versions payantes sont ouvertes et quels sont leurs prix ; cette demande ne contient aucune donnée vous concernant.

**Adresse e-mail vérifiée.** Quand **vous** créez votre compte, votre adresse e-mail est envoyée au serveur, qui vous adresse un code à 6 chiffres par le service d'envoi **Resend** (Resend, Inc., États-Unis, sous-traitant, encadré par les clauses contractuelles types de la Commission européenne). Le serveur **ne garde pas votre adresse en clair** : il conserve son **empreinte** (HMAC-SHA-256 avec une clé secrète), qui sert à retrouver votre compte, et une **forme masquée** (ex. m•••••@gmail.com) affichée dans ⭐ Versions. Les codes reçus ne sont conservés que sous forme d'empreinte, 10 minutes au plus. Resend envoie aussi les **codes de confirmation d'un nouvel appareil** et les **alertes de sécurité** (nouvel appareil, mot de passe changé, double authentification activée ou désactivée).

**Mot de passe (depuis la version 3.21).** Votre mot de passe **n'est jamais envoyé ni enregistré** : il est transformé sur votre appareil (PBKDF2-SHA-256, 600 000 tours, avec un sel aléatoire propre à votre compte) et seul ce résultat part au serveur, qui le transforme encore (HMAC avec une clé secrète) avant de le garder. Personne, pas même l'éditeur, ne peut retrouver votre mot de passe à partir de ces données. Pour empêcher de deviner quelles adresses sont inscrites, le serveur répond de la même façon pour une adresse inconnue.

**Double authentification (facultative).** Si vous l'activez, le serveur garde la **clé secrète** de votre application d'authentification **chiffrée** (AES-GCM), le dernier code utilisé (pour qu'il ne serve pas deux fois) et l'**empreinte** de vos 10 codes de secours.

**Appareils de confiance.** Un appareil confirmé reçoit un jeton aléatoire gardé chiffré sur l'appareil ; le serveur n'en garde que l'**empreinte**, avec le nom de l'appareil (ex. « PC Windows », « Android ») et les dates d'ajout et de dernière utilisation. Vous les voyez et les retirez dans ⭐ Versions › 👤 Compte › 🛡 Sécurité. Les appareils de confiance inutilisés depuis 1 an sont effacés.

**Biométrie.** Le déverrouillage par Windows Hello, Touch ID, empreinte, visage ou Face ID est vérifié **par le système de votre appareil** : Ivass AI reçoit seulement « vérifié » ou « refusé ». Aucune donnée biométrique n'est lue, conservée ni envoyée.

**Ce que le serveur enregistre pour votre compte**, sans votre nom :
- un identifiant aléatoire de compte, l'empreinte et la forme masquée de votre e-mail ;
- l'**empreinte** du jeton de session de chacun de vos appareils — le jeton lui-même reste sur l'appareil, chiffré ; une session inutilisée pendant 90 jours est fermée ;
- le **sel** et l'empreinte de votre mot de passe étiré, la clé chiffrée de la double authentification et les empreintes de vos codes de secours, les empreintes des jetons de vos appareils de confiance ;
- vos **appareils principaux** (1 PC, 1 téléphone) : un identifiant aléatoire, le nom choisi par Ivass (ex. « PC Windows », « Android ») et la date de dernière vérification ;
- l'**historique des activations** (connexions, appareils ajoutés, transferts, refus d'un appareil supplémentaire, changements d'abonnement), conservé 1 an ;
- votre code de parrainage (IVASS-…) avec ses dates et son nombre d'utilisations, le lien avec votre parrain, vos filleuls validés et l'historique de vos récompenses ;
- si vous avez un parrain : les **dates** (jour seulement) où vous avez utilisé Ivass AI, pour valider le parrainage ; aucun contenu, aucune question ;
- si vous avez souscrit : l'identifiant de votre abonnement PayPal, la formule, son état et sa date de fin ;
- pour prévenir la fraude : une **empreinte de votre adresse IP** lors de l'inscription et de la déclaration d'un parrain (effacée au bout de **90 jours**), des compteurs d'essais (effacés au bout de 3 jours) et, en cas d'anomalie (jeton de session copié, licence demandée par plusieurs appareils, parrainages en rafale), un signalement que seul l'éditeur consulte.

Les comptes créés avant le 1er novembre 2026 avec un code licence (IVL-…) restent sans adresse e-mail tant que vous n'en reliez pas une.

**Décisions automatisées.** Aucune décision produisant des effets juridiques n'est prise uniquement par un traitement automatisé : un parrainage jugé suspect est mis en attente et **vérifié par l'éditeur** ; un appareil supplémentaire n'est pas bloqué mais vous propose un transfert ou une licence supplémentaire.

**Supprimer votre compte.** ⭐ Versions › 👤 Compte › « Supprimer mon compte » arrête l'abonnement PayPal et efface immédiatement l'identité, les appareils, les sessions, le parrainage, l'historique et le journal de votre compte (sous réserve des données comptables ci-dessous).

**Paiement.** Il est traité par **PayPal**, responsable de ses propres traitements (politique de confidentialité de PayPal). L'éditeur reçoit de PayPal l'état de l'abonnement et les montants ; il ne reçoit jamais vos coordonnées bancaires.

**Pourquoi.** Exécuter le contrat (compte, version, licence, parrainage : article 6.1.b du RGPD), prévenir le partage de licence et la fraude au parrainage (intérêt légitime : article 6.1.f) et tenir la comptabilité (obligation légale : article 6.1.c).

**Durée.** Les données du compte sont conservées tant que le compte sert, puis supprimées **3 ans** après la dernière utilisation, ou plus tôt sur demande. Les données comptables (montant, date, identifiant de transaction) sont conservées **10 ans**, comme l'exige la loi. Le serveur est hébergé par Cloudflare (voir « Hébergement et durée »).

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
