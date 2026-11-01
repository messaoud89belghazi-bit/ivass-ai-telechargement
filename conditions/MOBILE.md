## Complément : application mobile et synchronisation

*Version 3 — en vigueur au 1er novembre 2026*

- **Ivass AI Mobile** applique les mêmes conditions que Ivass AI pour PC. Sur le téléphone, « votre ordinateur » désigne votre téléphone.
- **Clés API.** Elles sont chiffrées par le coffre-fort matériel d'Android (Android Keystore). Elles ne sont jamais synchronisées ni envoyées à l'éditeur. Si **vous** choisissez « Envoyer mes clés au téléphone » sur le PC, elles transitent une seule fois, chiffrées avec votre code, restent 15 minutes au plus sur le serveur et en sont effacées dès réception.
- **Mode « 🖥️ Mon PC ».** Vos questions sont transmises chiffrées à Ivass AI sur votre PC, qui répond avec ses propres IA. Seul du texte circule ; le PC n'exécute aucune commande et ne touche à aucun fichier dans ce mode. Questions et réponses sont effacées du serveur après lecture (24 h au plus).
- **Compte et appareils.** Votre compte Ivass fonctionne sur 1 PC principal et 1 téléphone principal. Le téléphone garde son jeton de session dans le coffre-fort de l'appareil ; le serveur n'en connaît que l'empreinte. Sur l'application iPhone de l'App Store, aucun achat n'a lieu dans l'application : une version achetée ailleurs s'applique en vous connectant avec la même adresse e-mail.
- **Synchronisation (facultative, Ivass Basic et plus).** Si vous l'activez, vos discussions et votre bibliothèque sont chiffrées **sur l'appareil** (AES-256-GCM) avec une clé tirée de votre code de synchronisation. Le serveur ne reçoit que des données illisibles, une empreinte de l'espace et des dates. Sans votre code, personne ne peut lire ces données, pas même l'éditeur. **Si vous perdez le code, les données synchronisées ne peuvent pas être récupérées.**
- **Effacement.** Le bouton « Effacer mes données du serveur » supprime définitivement votre espace sur le serveur.
- **Aucune commande à distance.** L'application ne peut ni lancer de programme ni exécuter de commande sur votre PC. La synchronisation échange uniquement des données.
- **Hébergement.** Le serveur de synchronisation est hébergé sur Cloudflare (offre gratuite). Sa disponibilité n'est pas garantie : vos données restent toujours aussi sur vos appareils.
