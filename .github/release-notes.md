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

### 📚 Nouveau : le Savoir ouvert, une grande base de connaissances libre
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
