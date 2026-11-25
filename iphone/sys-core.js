/* Ivass AI — 🖥 Académie « Systèmes et Technologie » (3.42) : matériel, systèmes d'exploitation, réseaux, sécurité, veille.
   Fichier partagé PC (main + écran) et téléphone : mêmes modules, mêmes règles, mêmes prompts.
   Contient aussi le moteur de CERTIFICATIONS commun aux deux académies (Développeur et Systèmes).
   Développé par Messaoud BELGHAZI. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IvassSys = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const L = (id, titre, resume, doc) => ({ id, titre, resume, doc });
  const LAB = (id, titre, consigne) => ({ id, titre, consigne });

  // ------------------------------------------------------------------ 🎓 10 modules
  const MODULES = [
    { id: 'm1', icone: '💡', titre: 'Fondamentaux de l’informatique', duree: '4 semaines', offre: 'gratuit',
      objectif: 'Comprendre comment un ordinateur fonctionne, du bit jusqu’au programme qui s’exécute.',
      lecons: [
        L('m1-fonctionne', 'Comment marche un ordinateur', 'Modèle de von Neumann, cycle charger-décoder-exécuter, horloge', 'https://fr.wikipedia.org/wiki/Architecture_de_von_Neumann'),
        L('m1-binaire', 'Binaire et logique', 'Bits, octets, hexadécimal, portes logiques, complément à deux', 'https://fr.wikipedia.org/wiki/Syst%C3%A8me_binaire'),
        L('m1-cpu', 'Architecture du processeur', 'Cœurs, threads, pipeline, caches L1/L2/L3, jeux d’instructions', 'https://developer.arm.com/documentation'),
        L('m1-cartemere', 'Structure de la carte mère', 'Socket, chipset, VRM, lignes PCIe, connecteurs, formats', 'https://fr.wikipedia.org/wiki/Carte_m%C3%A8re'),
        L('m1-ram', 'La mémoire vive (RAM)', 'DDR4/DDR5, fréquence, latences, double canal, ECC', 'https://www.jedec.org/'),
        L('m1-stockage', 'Le stockage', 'HDD, SSD SATA, NVMe, système de fichiers, IOPS', 'https://www.snia.org/education'),
        L('m1-es', 'Entrées et sorties', 'Périphériques, interruptions, pilotes, DMA', 'https://learn.microsoft.com/fr-fr/windows-hardware/drivers/'),
        L('m1-bus', 'Bus et communication', 'PCIe, USB, Thunderbolt, SATA, bandes passantes', 'https://www.usb.org/documents'),
      ],
      labs: [LAB('m1-lab-composants', 'Identifier les composants internes', 'Décris-moi pas à pas comment identifier chaque composant de MON PC sans l’ouvrir (Windows : msinfo32, Gestionnaire des tâches, CPU-Z ; Linux : lscpu, lsblk, lspci, dmidecode), puis pose-moi 5 questions sur ce que j’ai trouvé.'),
        LAB('m1-lab-virtuel', 'Construire un ordinateur virtuel', 'Fais-moi assembler un ordinateur virtuel composant par composant : à chaque étape, propose 3 choix, explique l’effet de mon choix sur les performances et la compatibilité, et refuse les assemblages impossibles.')] },
    { id: 'm2', icone: '🔧', titre: 'Ingénierie du matériel', duree: '6 semaines', offre: 'gratuit',
      objectif: 'Choisir, comparer et assembler des composants en connaissant leurs générations et leurs limites.',
      lecons: [
        L('m2-intel', 'Processeurs Intel', 'Core, Core Ultra, Xeon ; cœurs P et E ; générations et sockets', 'https://www.intel.com/content/www/us/en/products/details/processors.html'),
        L('m2-amd', 'Processeurs AMD', 'Ryzen, Threadripper, EPYC ; Zen ; 3D V-Cache ; sockets AM4/AM5', 'https://www.amd.com/en/products/processors/desktops/ryzen.html'),
        L('m2-arm', 'Architecture ARM', 'Cortex, Neoverse, Snapdragon, Apple M ; efficacité énergétique', 'https://developer.arm.com/documentation'),
        L('m2-generations', 'Générations et comparaisons de CPU', 'IPC, fréquence, TDP, finesse de gravure, lire une fiche technique', 'https://ark.intel.com/'),
        L('m2-chipsets', 'Chipsets', 'Rôle, lignes PCIe, overclocking, gammes', 'https://www.intel.com/content/www/us/en/products/details/chipsets.html'),
        L('m2-cartesmeres', 'Cartes mères', 'Formats ATX/mATX/ITX, VRM, M.2, choix selon l’usage', 'https://fr.wikipedia.org/wiki/Carte_m%C3%A8re'),
        L('m2-bios', 'BIOS et UEFI', 'Démarrage, GPT, réglages, mises à jour sûres', 'https://uefi.org/specifications'),
        L('m2-alim', 'Alimentations', 'Puissance, rendement 80 PLUS, ATX 3.x, 12V-2x6, marges', 'https://www.clearesult.com/80plus/'),
        L('m2-thermique', 'Systèmes thermiques et refroidissement', 'TDP, pâte, ventirad, watercooling AIO, flux d’air, throttling', 'https://www.intel.com/content/www/us/en/support/products/processors.html'),
      ],
      labs: [LAB('m2-lab-analyse', 'Analyse de composants', 'Donne-moi la fiche technique de deux processeurs concurrents actuels (indique de quand datent tes informations) et fais-moi comparer : cœurs, fréquences, cache, TDP, plateforme, usage idéal. Corrige mes conclusions.'),
        LAB('m2-lab-goulot', 'Détection de goulot d’étranglement', 'Présente-moi 4 configurations déséquilibrées (jeu, montage vidéo, IA locale, bureautique). Pour chacune, je dois trouver le goulot ; tu corriges et expliques comment le mesurer.')] },
    { id: 'm3', icone: '🎮', titre: 'Cartes graphiques et calcul IA', duree: '5 semaines', offre: 'pro',
      objectif: 'Comprendre les GPU, l’accélération IA et concevoir une station de travail adaptée.',
      lecons: [
        L('m3-nvidia', 'GPU NVIDIA', 'GeForce, RTX, gammes pro et data center ; architectures', 'https://www.nvidia.com/en-us/geforce/graphics-cards/'),
        L('m3-amd', 'GPU AMD', 'Radeon RX, Radeon Pro, Instinct ; RDNA et CDNA ; ROCm', 'https://rocm.docs.amd.com/'),
        L('m3-intel', 'GPU Intel Arc', 'Arc A et B, XeSS, oneAPI', 'https://www.intel.com/content/www/us/en/products/details/discrete-gpus/arc.html'),
        L('m3-cuda', 'CUDA', 'Modèle de programmation, threads, blocs, mémoire GPU', 'https://docs.nvidia.com/cuda/'),
        L('m3-tensor', 'Tensor Cores', 'Calcul matriciel, précisions FP16/BF16/FP8/INT8', 'https://www.nvidia.com/en-us/data-center/tensor-cores/'),
        L('m3-acceleration', 'Accélération IA', 'Inférence vs entraînement, VRAM, quantification, NPU', 'https://onnxruntime.ai/docs/'),
        L('m3-deeplearning', 'Matériel pour le deep learning', 'Multi-GPU, NVLink, bande passante mémoire, alimentation', 'https://mlcommons.org/benchmarks/'),
        L('m3-bench', 'Mesurer les performances GPU', 'Benchmarks, outils, lecture honnête des résultats', 'https://mlcommons.org/benchmarks/'),
        L('m3-station', 'Concevoir une station de travail', 'Budget, VRAM, RAM, stockage, refroidissement, bruit', 'https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/'),
      ],
      labs: [LAB('m3-lab-station', 'Optimiser une station IA', 'Je veux faire tourner des modèles d’IA en local. Pose-moi 4 questions (budget, modèles visés, usage, contraintes), puis propose la station optimale et justifie chaque composant (surtout la VRAM).'),
        LAB('m3-lab-perf', 'Analyse de performances GPU', 'Donne-moi des résultats de benchmark fictifs mais réalistes pour 3 GPU sur 3 tâches (jeu 4K, rendu, inférence LLM). Je dois les interpréter ; corrige mes erreurs de lecture.')] },
    { id: 'm4', icone: '💽', titre: 'Stockage et données', duree: '4 semaines', offre: 'pro',
      objectif: 'Choisir le bon stockage, le protéger et le rendre rapide.',
      lecons: [
        L('m4-hdd', 'Disques durs (HDD)', 'Plateaux, CMR/SMR, vitesse, fiabilité, usage NAS', 'https://www.snia.org/education'),
        L('m4-sata', 'SSD SATA', 'NAND, contrôleur, TBW, limites de l’interface', 'https://www.snia.org/education'),
        L('m4-nvme', 'SSD NVMe', 'Protocole, files d’attente, cache SLC, DRAM, températures', 'https://nvmexpress.org/specifications/'),
        L('m4-pcie', 'Générations PCIe', 'Débits 3.0 à 6.0, lignes, partage, compatibilité', 'https://pcisig.com/specifications'),
        L('m4-raid', 'RAID', 'RAID 0, 1, 5, 6, 10 ; ce que le RAID n’est pas (une sauvegarde)', 'https://www.kernel.org/doc/html/latest/admin-guide/md.html'),
        L('m4-nas', 'Systèmes NAS', 'TrueNAS, Synology, ZFS, partages, sauvegarde 3-2-1', 'https://www.truenas.com/docs/'),
        L('m4-entreprise', 'Stockage d’entreprise', 'SAN, iSCSI, objets S3, tiering, réplication', 'https://www.snia.org/education'),
      ],
      labs: [LAB('m4-lab-plan', 'Planifier un stockage', 'Une petite entreprise de 8 personnes me demande un stockage partagé et une sauvegarde. Fais-moi construire la solution (capacité, RAID, NAS, sauvegarde 3-2-1, budget) et critique mes choix.'),
        LAB('m4-lab-perf', 'Optimiser les performances', 'Explique-moi comment mesurer les performances de mes disques (Windows : winsat disk, CrystalDiskMark ; Linux : fio) et comment interpréter séquentiel, aléatoire 4K, IOPS et latence.')] },
    { id: 'm5', icone: '🪟', titre: 'Maîtrise des systèmes d’exploitation', duree: '8 semaines', offre: 'pro',
      objectif: 'Installer, administrer, optimiser et dépanner Windows, Linux et macOS.',
      lecons: [
        L('m5-win-archi', 'Architecture de Windows', 'Noyau, mode utilisateur, services, registre, pilotes', 'https://learn.microsoft.com/fr-fr/windows-hardware/drivers/kernel/'),
        L('m5-win10', 'Windows 10', 'Fin de support, mises à jour, migration', 'https://learn.microsoft.com/fr-fr/windows/'),
        L('m5-win11', 'Windows 11', 'Exigences (TPM 2.0, Secure Boot), administration, PowerShell', 'https://learn.microsoft.com/fr-fr/windows/'),
        L('m5-winserver', 'Windows Server', 'Rôles, Active Directory, DNS, DHCP, GPO', 'https://learn.microsoft.com/fr-fr/windows-server/'),
        L('m5-ubuntu', 'Ubuntu', 'Installation, apt, systemd, utilisateurs, serveur', 'https://ubuntu.com/server/docs'),
        L('m5-debian', 'Debian', 'Stabilité, dépôts, administration', 'https://www.debian.org/doc/'),
        L('m5-fedora', 'Fedora', 'dnf, SELinux, nouveautés', 'https://docs.fedoraproject.org/'),
        L('m5-rhel', 'CentOS Stream et Rocky Linux', 'Famille Red Hat, entreprise, cycles de vie', 'https://docs.rockylinux.org/'),
        L('m5-macos', 'Architecture de macOS', 'Darwin, APFS, sécurité, administration', 'https://support.apple.com/guide/mac-help/welcome/mac'),
        L('m5-apple', 'Apple Silicon', 'Puces M, mémoire unifiée, Rosetta 2, performances', 'https://developer.apple.com/documentation/apple-silicon'),
      ],
      labs: [LAB('m5-lab-install', 'Installation', 'Guide-moi pour installer Ubuntu dans une machine virtuelle (VirtualBox ou Hyper-V) : téléchargement vérifié, partitionnement, premier démarrage, mises à jour. Vérifie chaque étape avec moi.'),
        LAB('m5-lab-admin', 'Administration', 'Donne-moi 8 tâches d’administration (utilisateurs, droits, services, journaux, planification) à faire sur Windows ET Linux ; je réponds avec mes commandes, tu corriges.'),
        LAB('m5-lab-optim', 'Optimisation', 'Mon PC Windows est lent au démarrage. Mène l’enquête avec moi : quelles mesures faire, dans quel ordre, et comment conclure sans rien casser.'),
        LAB('m5-lab-depannage', 'Dépannage', 'Simule une panne de système d’exploitation (démarrage impossible, service qui plante…). Donne les symptômes, laisse-moi demander des tests, et ne révèle la cause que quand je l’ai trouvée ou que j’abandonne.')] },
    { id: 'm6', icone: '🩺', titre: 'Réparation et diagnostic', duree: '5 semaines', offre: 'pro',
      objectif: 'Diagnostiquer méthodiquement une panne matérielle ou logicielle et réparer sans perdre de données.',
      lecons: [
        L('m6-pannes', 'Pannes matérielles', 'Symptômes, causes probables, composants fragiles', 'https://www.intel.com/content/www/us/en/support/products/processors.html'),
        L('m6-methode', 'Méthode de dépannage', 'Recueillir, isoler, tester une hypothèse à la fois, documenter', 'https://learn.microsoft.com/fr-fr/troubleshoot/windows-client/welcome-windows-client'),
        L('m6-bsod', 'Écrans bleus', 'Codes d’arrêt, minidumps, WinDbg, pilotes fautifs', 'https://learn.microsoft.com/fr-fr/windows-hardware/drivers/debugger/bug-check-code-reference2'),
        L('m6-memoire', 'Pannes de mémoire', 'MemTest86, Diagnostic mémoire Windows, XMP/EXPO instables', 'https://www.memtest86.com/'),
        L('m6-ssd', 'Diagnostic des SSD', 'SMART, usure, firmware, smartctl', 'https://www.smartmontools.org/'),
        L('m6-bios', 'Récupération du BIOS', 'Clear CMOS, BIOS Flashback, double BIOS', 'https://uefi.org/specifications'),
        L('m6-recup', 'Récupération du système', 'WinRE, points de restauration, réinitialisation, live USB', 'https://learn.microsoft.com/fr-fr/windows-hardware/manufacture/desktop/windows-recovery-environment--windows-re--technical-reference'),
      ],
      labs: [LAB('m6-lab-simu', 'Simulations de réparation interactives', 'Joue le rôle d’un PC en panne (choisis au hasard : alimentation, RAM, SSD, carte graphique, pilote, surchauffe). Donne-moi les symptômes comme un client les décrirait. Je pose des questions et demande des tests ; tu réponds de façon réaliste. Ne donne la panne qu’à la fin, puis note ma méthode sur 10.')] },
    { id: 'm7', icone: '🌐', titre: 'Réseaux et infrastructure', duree: '6 semaines', offre: 'pro',
      objectif: 'Concevoir, câbler et dépanner un réseau, du domicile à l’entreprise.',
      lecons: [
        L('m7-bases', 'Bases des réseaux', 'Modèle OSI/TCP-IP, adresses IP, masques, routage, DNS, DHCP', 'https://www.cisco.com/c/en/us/solutions/small-business/resource-center/networking/networking-basics.html'),
        L('m7-ethernet', 'Ethernet', 'Câbles catégories 5e à 8, 1/2,5/10 GbE, PoE, commutateurs', 'https://www.ieee802.org/3/'),
        L('m7-wifi', 'Wi-Fi', 'Wi-Fi 6/6E/7, canaux, maillage, interférences', 'https://www.wi-fi.org/discover-wi-fi'),
        L('m7-fibre', 'Fibre optique', 'FTTH, GPON/XGS-PON, PBO, PTO, mesures optiques', 'https://www.ftthcouncil.eu/'),
        L('m7-vlan', 'VLAN', '802.1Q, segmentation, réseau invités et objets connectés', 'https://www.ieee802.org/1/pages/802.1Q.html'),
        L('m7-vpn', 'VPN', 'WireGuard, IPsec, accès distant, site à site', 'https://www.wireguard.com/'),
        L('m7-entreprise', 'Infrastructure d’entreprise', 'Cœur, distribution, accès ; redondance ; supervision', 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/index.html'),
        L('m7-materiel', 'Matériel réseau', 'Routeurs, commutateurs administrables, pare-feu, points d’accès', 'https://docs.opnsense.org/'),
      ],
      labs: [LAB('m7-lab-conception', 'Conception d’un réseau virtuel', 'Fais-moi concevoir le réseau d’une PME de 25 postes avec Wi-Fi invités, caméras, serveur et télétravail : plan d’adressage, VLAN, matériel, schéma en texte. Critique mon plan comme un ingénieur réseau.')] },
    { id: 'm8', icone: '🛡', titre: 'Sécurité du matériel et des systèmes', duree: '4 semaines', offre: 'pro',
      objectif: 'Protéger un poste et une infrastructure dès le matériel.',
      lecons: [
        L('m8-secureboot', 'Démarrage sécurisé', 'Secure Boot, chaîne de confiance, mesures', 'https://learn.microsoft.com/fr-fr/windows-hardware/design/device-experiences/oem-secure-boot'),
        L('m8-tpm', 'Puces TPM', 'TPM 2.0, fTPM/PTT, attestation, stockage de clés', 'https://trustedcomputinggroup.org/resource/tpm-library-specification/'),
        L('m8-chiffrement', 'Chiffrement matériel et disque', 'BitLocker, LUKS, SED, clés de récupération', 'https://learn.microsoft.com/fr-fr/windows/security/operating-system-security/data-protection/bitlocker/'),
        L('m8-parefeu', 'Pare-feu', 'Filtrage, règles, pare-feu matériels et logiciels', 'https://docs.opnsense.org/'),
        L('m8-endpoint', 'Sécurité des postes', 'Antivirus, EDR, mises à jour, moindre privilège', 'https://learn.microsoft.com/fr-fr/defender-endpoint/'),
        L('m8-hsm', 'Modules HSM', 'Rôle, FIPS 140-3, gestion des clés en entreprise', 'https://csrc.nist.gov/projects/cryptographic-module-validation-program'),
        L('m8-durcissement', 'Durcissement de l’infrastructure', 'Référentiels CIS, comptes, services, journalisation', 'https://www.cisecurity.org/cis-benchmarks'),
      ],
      labs: [LAB('m8-lab-audit', 'Audit de sécurité', 'Guide-moi pour auditer la sécurité de MON propre PC (TPM, Secure Boot, BitLocker, mises à jour, comptes, pare-feu, sauvegardes) avec des commandes en lecture seule ; à la fin, donne une note et un plan d’action priorisé.')] },
    { id: 'm9', icone: '📡', titre: 'Veille technologique', duree: 'continu', offre: 'pro',
      objectif: 'Suivre les nouveautés, comparer les produits et anticiper les tendances.',
      lecons: [
        L('m9-methode', 'Méthode de veille', 'Sources fiables, recoupement, annonces vs tests indépendants', 'https://www.techpowerup.com/'),
        L('m9-feuilles', 'Lire les feuilles de route', 'Roadmaps Intel, AMD, NVIDIA, Apple, Qualcomm ; rumeurs vs annonces', 'https://www.intel.com/content/www/us/en/newsroom/home.html'),
        L('m9-marche', 'Analyse du marché', 'Prix, disponibilité, cycles de sortie, meilleur moment pour acheter', 'https://www.techpowerup.com/'),
        L('m9-futur', 'Technologies émergentes', 'Chiplets, mémoire HBM, photonique, informatique quantique, NPU', 'https://www.ibm.com/quantum'),
      ],
      labs: [LAB('m9-lab-comparatif', 'Comparatif produit', 'Choisis une catégorie (processeurs, GPU, portables, smartphones). Fais-moi construire un comparatif à partir de sources que je dois citer ; vérifie mes chiffres et la date de chaque source.')] },
    { id: 'm10', icone: '🧭', titre: 'Conseiller matériel expert', duree: '4 semaines', offre: 'pro',
      objectif: 'Conseiller comme un pro : analyser, vérifier la compatibilité, estimer, recommander.',
      lecons: [
        L('m10-analyse', 'Analyser une configuration', 'Lire une configuration et repérer ses forces et faiblesses', 'https://www.techpowerup.com/'),
        L('m10-compat', 'Vérifier la compatibilité', 'Socket, mémoire, format, alimentation, dimensions', 'https://pcpartpicker.com/'),
        L('m10-goulots', 'Repérer les goulots', 'CPU, GPU, RAM, stockage selon l’usage et la résolution', 'https://www.techpowerup.com/'),
        L('m10-recommander', 'Recommander une évolution', 'Le meilleur gain pour le budget, ordre des achats', 'https://pcpartpicker.com/'),
        L('m10-postes', 'Portables, stations, machines de jeu, IA', 'Profils d’usage et configurations types', 'https://www.notebookcheck.net/'),
      ],
      labs: [LAB('m10-lab-client', 'Conseil client', 'Joue un client avec un budget et un besoin flous. Je dois poser les bonnes questions puis recommander une machine ; à la fin, évalue mon conseil comme un vendeur expert et un technicien.')] },
  ];
  const LECONS = {}, LABS = {};
  for (const m of MODULES) { for (const l of m.lecons) LECONS[l.id] = { ...l, module: m.id }; for (const x of m.labs) LABS[x.id] = { ...x, module: m.id }; }

  // ------------------------------------------------------------------ 🏆 7 niveaux par l'expérience (XP)
  const XP = { lecon: 10, lab: 15, examen: 60 };
  const NIVEAUX = [
    { n: 1, nom: 'Débutant', icone: '🌱', xp: 0 },
    { n: 2, nom: 'Utilisateur avancé', icone: '⚡', xp: 80 },
    { n: 3, nom: 'Technicien', icone: '🔧', xp: 220 },
    { n: 4, nom: 'Spécialiste systèmes', icone: '🖥', xp: 420 },
    { n: 5, nom: 'Expert matériel', icone: '🔬', xp: 650 },
    { n: 6, nom: 'Ingénieur infrastructure', icone: '🏗', xp: 900 },
    { n: 7, nom: 'Architecte technologique', icone: '🏛', xp: 1150 },
  ];
  const leconFaite = (p) => !!(p && p.lu && (p.quiz || 0) >= 4);
  /** prog = { [leconId]: {lu, quiz, at} , [labId]: {fait, at} }, examens = { [certId]: { meilleur, reussi, at, code } } */
  function progression(prog = {}, examens = {}) {
    const modules = MODULES.map((m) => {
      const faites = m.lecons.filter((l) => leconFaite(prog[l.id])).length, labs = m.labs.filter((x) => prog[x.id] && prog[x.id].fait).length;
      return { id: m.id, faites, total: m.lecons.length, labs, totalLabs: m.labs.length, pct: Math.round((100 * faites) / m.lecons.length) };
    });
    const faites = modules.reduce((a, m) => a + m.faites, 0), total = modules.reduce((a, m) => a + m.total, 0), labs = modules.reduce((a, m) => a + m.labs, 0);
    const certs = Object.values(examens || {}).filter((e) => e && e.reussi && CERTIFS.some((c) => c.famille === 'systemes' && c.id === e.id)).length;
    const xp = faites * XP.lecon + labs * XP.lab + certs * XP.examen;
    let niv = NIVEAUX[0]; for (const x of NIVEAUX) if (xp >= x.xp) niv = x;
    const suiv = NIVEAUX.find((x) => x.xp > xp) || null;
    const suivante = (() => { for (const m of MODULES) for (const l of m.lecons) if (!leconFaite(prog[l.id])) return l.id; return null; })();
    return { modules, faites, total, labs, xp, niveau: niv, prochainNiveau: suiv, pctNiveau: suiv ? Math.round((100 * (xp - niv.xp)) / (suiv.xp - niv.xp)) : 100, pct: Math.round((100 * faites) / total), suivante };
  }

  // ------------------------------------------------------------------ 🗺 parcours personnalisés
  const PARCOURS = [
    { id: 'depannage', nom: '🩺 Dépanneur informatique', pour: 'réparer et entretenir des PC (particuliers, boutique)', ordre: ['m1', 'm2', 'm6', 'm5', 'm4', 'm8', 'm10'] },
    { id: 'admin', nom: '🖥 Administrateur systèmes', pour: 'gérer des serveurs et des parcs Windows / Linux', ordre: ['m1', 'm5', 'm7', 'm8', 'm4', 'm6', 'm2'] },
    { id: 'infra', nom: '🌐 Ingénieur réseaux et infrastructure', pour: 'concevoir réseaux, fibre, Wi-Fi et datacenters', ordre: ['m1', 'm7', 'm8', 'm4', 'm5', 'm2', 'm9'] },
    { id: 'ia', nom: '🧠 Station de travail IA', pour: 'faire tourner l’IA en local et choisir le bon GPU', ordre: ['m1', 'm2', 'm3', 'm4', 'm5', 'm10', 'm9'] },
    { id: 'conseil', nom: '🧭 Conseiller et vendeur expert', pour: 'conseiller l’achat de PC, portables et composants', ordre: ['m1', 'm2', 'm3', 'm10', 'm9', 'm4', 'm6'] },
    { id: 'architecte', nom: '🏛 Architecte technologique', pour: 'le parcours complet, dans l’ordre', ordre: MODULES.map((m) => m.id) },
  ];

  // ------------------------------------------------------------------ 🏅 attestations (communes aux deux académies)
  // Ce sont des ATTESTATIONS DE RÉUSSITE délivrées par Ivass AI, pas des certifications officielles (CompTIA, Cisco, Microsoft…).
  const CERTIFS = [
    { id: 'sys-utilisateur', famille: 'systemes', nom: 'Utilisateur informatique (attestation Ivass)', icone: '🥉', modules: ['m1'], questions: 15 },
    { id: 'sys-technicien', famille: 'systemes', nom: 'Technicien matériel (attestation Ivass)', icone: '🔧', modules: ['m1', 'm2', 'm4', 'm6'], questions: 20 },
    { id: 'sys-admin', famille: 'systemes', nom: 'Administrateur systèmes (attestation Ivass)', icone: '🖥', modules: ['m5', 'm7', 'm8'], questions: 20 },
    { id: 'sys-infra', famille: 'systemes', nom: 'Ingénieur infrastructure (attestation Ivass)', icone: '🏗', modules: ['m4', 'm7', 'm8', 'm3'], questions: 25 },
    { id: 'sys-architecte', famille: 'systemes', nom: 'Architecte technologique (attestation Ivass)', icone: '🏛', modules: MODULES.map((m) => m.id), questions: 30 },
    { id: 'dev-fondations', famille: 'dev', nom: 'Développeur — fondations (attestation Ivass)', icone: '🧱', niveaux: ['n0'], questions: 15 },
    { id: 'dev-frontend', famille: 'dev', nom: 'Développeur web frontend (attestation Ivass)', icone: '🎨', niveaux: ['n0', 'n1'], questions: 20 },
    { id: 'dev-backend', famille: 'dev', nom: 'Développeur backend (attestation Ivass)', icone: '🗄', niveaux: ['n2'], questions: 20 },
    { id: 'dev-fullstack', famille: 'dev', nom: 'Développeur full stack (attestation Ivass)', icone: '🧩', niveaux: ['n1', 'n2', 'n3'], questions: 25 },
    { id: 'dev-architecte', famille: 'dev', nom: 'Architecte logiciel (attestation Ivass)', icone: '🏛', niveaux: ['n4', 'n5', 'n6'], questions: 25 },
  ];
  const SEUIL = 0.8;
  /** Prérequis : les leçons du périmètre doivent être validées à 70 % au moins avant de passer l'examen. */
  function eligibilite(cert, progSys = {}, progDev = {}, devCore) {
    let ids = [];
    if (cert.famille === 'systemes') ids = cert.modules.flatMap((m) => MODULES.find((x) => x.id === m).lecons.map((l) => l.id));
    else if (devCore) ids = cert.niveaux.flatMap((n) => (devCore.NIVEAUX.find((x) => x.id === n) || { lecons: [] }).lecons.map((l) => l.id));
    const prog = cert.famille === 'systemes' ? progSys : progDev;
    const faites = ids.filter((id) => leconFaite(prog[id])).length;
    const pct = ids.length ? Math.round((100 * faites) / ids.length) : 0;
    return { ok: pct >= 70, pct, faites, total: ids.length };
  }
  function sujetsCert(cert, devCore) {
    if (cert.famille === 'systemes') return cert.modules.map((m) => { const x = MODULES.find((y) => y.id === m); return `${x.titre} : ${x.lecons.map((l) => l.titre).join(', ')}`; });
    return cert.niveaux.map((n) => { const x = devCore && devCore.NIVEAUX.find((y) => y.id === n); return x ? `${x.titre} : ${x.lecons.map((l) => l.titre).join(', ')}` : n; });
  }
  function promptExamen(cert, devCore, lang) {
    return `Crée l’examen « ${cert.nom} » : ${cert.questions} questions à choix multiples, niveau professionnel, réparties équitablement sur ces sujets :
${sujetsCert(cert, devCore).map((s) => '- ' + s).join('\n')}
Mélange connaissances, cas pratiques (« un client se plaint de… ») et lecture de fiches techniques. Une seule bonne réponse par question ; varie sa position.
Réponds UNIQUEMENT avec un tableau JSON, sans texte autour :
[{"q": "question", "choix": ["A", "B", "C", "D"], "bonne": 0, "explication": "pourquoi"}]${LANGUE(lang)}`;
  }
  /** Code de vérification : lié au nom, à l'attestation, à la date et au score (empreinte SHA-256 tronquée, calculée par l'appelant). */
  const donneesCode = (nom, certId, date, score) => `ivass|${certId}|${String(nom).trim().toLowerCase()}|${date}|${score}`;
  function certificatHtml({ nom, cert, date, score, total, code }) {
    const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${e(cert.nom)} — ${e(nom)}</title><style>
body{margin:0;background:#f4f1ea;font-family:Georgia,serif;color:#1d1d1f}.p{max-width:900px;margin:30px auto;background:#fff;border:12px double #b08d57;padding:56px 64px;text-align:center}
h1{font-size:15px;letter-spacing:.3em;text-transform:uppercase;color:#7a6034;margin:0}h2{font-size:34px;margin:28px 0 6px}.n{font-size:30px;font-style:italic;margin:26px 0}.m{color:#555;font-size:15px;line-height:1.6}
.i{font-size:56px}.f{display:flex;justify-content:space-between;margin-top:44px;font-size:13px;color:#555;text-align:left}.c{font-family:monospace;font-size:14px;color:#1d1d1f}.a{margin-top:30px;font-size:11.5px;color:#777;border-top:1px solid #ddd;padding-top:12px}
@media print{body{background:#fff}.p{margin:0;border-width:10px}}</style></head><body><div class="p">
<h1>Ivass AI — Académie ${cert.famille === 'dev' ? 'Développeur' : 'Systèmes et Technologie'}</h1><div class="i">${cert.icone}</div>
<div class="m">Attestation de réussite décernée à</div><div class="n">${e(nom)}</div>
<div class="m">pour avoir réussi l’examen</div><h2>${e(cert.nom)}</h2>
<div class="m">Score : <b>${score} / ${total}</b> (${Math.round((100 * score) / total)} %, seuil ${Math.round(SEUIL * 100)} %) · le ${e(date)}</div>
<div class="f"><div>Délivrée par <b>Ivass AI</b><br>Développé par Messaoud BELGHAZI</div><div>Code de vérification<br><span class="c">${e(code)}</span></div></div>
<div class="a">Attestation interne délivrée par l’application Ivass AI après un examen corrigé automatiquement. Ce n’est pas une certification officielle d’un éditeur ou d’un organisme (CompTIA, Cisco, Microsoft, Intel, NVIDIA…).</div>
</div></body></html>`;
  }

  // ------------------------------------------------------------------ 🧩 vérificateur de compatibilité (règles fixes, sans IA)
  const SOCKETS = {
    AM4: { marque: 'AMD', ram: ['DDR4'] }, AM5: { marque: 'AMD', ram: ['DDR5'] }, sTR5: { marque: 'AMD', ram: ['DDR5'] }, SP5: { marque: 'AMD', ram: ['DDR5'] },
    LGA1200: { marque: 'Intel', ram: ['DDR4'] }, LGA1700: { marque: 'Intel', ram: ['DDR4', 'DDR5'] }, LGA1851: { marque: 'Intel', ram: ['DDR5'] }, LGA4677: { marque: 'Intel', ram: ['DDR5'] },
  };
  const FORMATS = { 'E-ATX': 4, ATX: 3, 'Micro-ATX': 2, 'Mini-ITX': 1 };
  /**
   * c = { cpu:{socket,tdp}, carte:{socket,ram,format,slotsRam,ramMax,m2}, ram:{type,barrettes,totalGo}, gpu:{tbp,longueur},
   *       alim:{watts}, boitier:{formatMax,gpuMax,ventiradMax}, ventirad:{hauteur,tdpMax}, ssd:{m2} }
   * Renvoie { ok, erreurs[], alertes[], conseils[], puissance: { estimee, recommandee } }
   */
  function verifierCompat(c = {}) {
    const E = [], A = [], C = [], n = (x) => (x == null || x === '' ? null : Number(x));
    const cpu = c.cpu || {}, mb = c.carte || {}, ram = c.ram || {}, gpu = c.gpu || {}, alim = c.alim || {}, bt = c.boitier || {}, vr = c.ventirad || {}, ssd = c.ssd || {};
    if (cpu.socket && mb.socket && cpu.socket !== mb.socket) E.push(`Le processeur (socket ${cpu.socket}) ne rentre pas sur la carte mère (socket ${mb.socket}).`);
    const sk = SOCKETS[mb.socket || cpu.socket];
    if (ram.type && mb.ram && ram.type !== mb.ram) E.push(`La mémoire ${ram.type} ne fonctionne pas sur une carte mère ${mb.ram} (les encoches sont différentes).`);
    if (ram.type && sk && !sk.ram.includes(ram.type)) E.push(`Le socket ${mb.socket || cpu.socket} n’accepte que la ${sk.ram.join(' ou ')}.`);
    if (mb.socket === 'LGA1700' && !mb.ram) A.push('LGA1700 : les cartes existent en DDR4 OU en DDR5 — vérifiez la version exacte de la carte.');
    if (n(ram.barrettes) && n(mb.slotsRam) && n(ram.barrettes) > n(mb.slotsRam)) E.push(`${ram.barrettes} barrettes pour ${mb.slotsRam} emplacements.`);
    if (n(ram.totalGo) && n(mb.ramMax) && n(ram.totalGo) > n(mb.ramMax)) E.push(`${ram.totalGo} Go dépasse le maximum de la carte mère (${mb.ramMax} Go).`);
    if (n(ram.barrettes) === 1) C.push('Une seule barrette : passez à deux pour le double canal (souvent +10 à 30 % en jeu et avec les GPU intégrés).');
    if (n(ram.barrettes) === 3) A.push('Trois barrettes : le double canal n’est pas équilibré ; préférez 2 ou 4.');
    if (mb.format && bt.formatMax && FORMATS[mb.format] && FORMATS[bt.formatMax] && FORMATS[mb.format] > FORMATS[bt.formatMax]) E.push(`Carte mère ${mb.format} trop grande pour un boîtier ${bt.formatMax}.`);
    if (n(gpu.longueur) && n(bt.gpuMax) && n(gpu.longueur) > n(bt.gpuMax)) E.push(`Carte graphique de ${gpu.longueur} mm pour ${bt.gpuMax} mm de place dans le boîtier.`);
    else if (n(gpu.longueur) && n(bt.gpuMax) && n(bt.gpuMax) - n(gpu.longueur) < 15) A.push('Carte graphique très juste dans le boîtier (moins de 15 mm de marge) : pensez aux câbles d’alimentation.');
    if (n(vr.hauteur) && n(bt.ventiradMax) && n(vr.hauteur) > n(bt.ventiradMax)) E.push(`Ventirad de ${vr.hauteur} mm pour ${bt.ventiradMax} mm de hauteur disponible.`);
    if (n(vr.tdpMax) && n(cpu.tdp) && n(vr.tdpMax) < n(cpu.tdp)) A.push(`Le ventirad (${vr.tdpMax} W) est sous-dimensionné pour un processeur de ${cpu.tdp} W : risque de baisse de fréquence (throttling).`);
    if (n(ssd.m2) && n(mb.m2) != null && n(ssd.m2) > n(mb.m2)) E.push(`${ssd.m2} SSD M.2 pour ${mb.m2} emplacement(s) M.2.`);
    // puissance : CPU + GPU + 75 W pour le reste ; recommandé : +40 % de marge (pics des GPU récents)
    const estimee = (n(cpu.tdp) || 0) + (n(gpu.tbp) || 0) + 75, recommandee = Math.ceil((estimee * 1.4) / 50) * 50;
    if (n(alim.watts) && (n(cpu.tdp) || n(gpu.tbp))) {
      if (n(alim.watts) < estimee) E.push(`Alimentation de ${alim.watts} W pour environ ${estimee} W de consommation : insuffisante.`);
      else if (n(alim.watts) < recommandee) A.push(`Alimentation de ${alim.watts} W un peu juste : ${recommandee} W recommandés pour absorber les pics et vieillir sereinement.`);
    }
    if (n(gpu.tbp) >= 300) C.push('Carte graphique de 300 W ou plus : une alimentation ATX 3.x avec connecteur 12V-2x6 natif est préférable.');
    return { ok: E.length === 0, erreurs: E, alertes: A, conseils: C, puissance: { estimee, recommandee } };
  }

  // ------------------------------------------------------------------ 🩺 analyse de la machine (données réelles du PC → constats)
  const USAGES = { bureautique: '📄 Bureautique', jeu: '🎮 Jeu', montage: '🎬 Montage vidéo / 3D', ia: '🧠 IA en local', dev: '💻 Développement' };
  /** m = { cpu:{modele,coeurs,threads,ghz}, ramGo, gpus:[{nom,vramGo}], disques:[{nom,totalGo,libreGo,type}], os } */
  function analyserMachine(m = {}, usage = 'bureautique') {
    const out = [], ram = Number(m.ramGo) || 0, thr = (m.cpu && Number(m.cpu.threads)) || 0, vram = Math.max(0, ...(m.gpus || []).map((g) => Number(g.vramGo) || 0));
    const besoin = { bureautique: { ram: 8, thr: 4, vram: 0 }, jeu: { ram: 16, thr: 8, vram: 8 }, montage: { ram: 32, thr: 12, vram: 8 }, ia: { ram: 32, thr: 8, vram: 12 }, dev: { ram: 16, thr: 8, vram: 0 } }[usage] || { ram: 8, thr: 4, vram: 0 };
    if (ram && ram < besoin.ram) out.push({ niveau: 'goulot', composant: 'RAM', texte: `${ram} Go de mémoire pour ${besoin.ram} Go conseillés en ${USAGES[usage] || usage} : c’est l’évolution la plus rentable.` });
    else if (ram) out.push({ niveau: 'ok', composant: 'RAM', texte: `${ram} Go de mémoire : suffisant pour cet usage.` });
    if (thr && thr < besoin.thr) out.push({ niveau: 'goulot', composant: 'Processeur', texte: `${thr} threads pour ${besoin.thr} conseillés : le processeur limitera les tâches lourdes.` });
    else if (thr) out.push({ niveau: 'ok', composant: 'Processeur', texte: `${thr} threads : adapté.` });
    if (besoin.vram) {
      if (!vram) out.push({ niveau: 'goulot', composant: 'Carte graphique', texte: `Aucune carte graphique dédiée détectée : il faut au moins ${besoin.vram} Go de VRAM pour cet usage.` });
      else if (vram < besoin.vram) out.push({ niveau: 'goulot', composant: 'Carte graphique', texte: `${vram} Go de VRAM pour ${besoin.vram} Go conseillés${usage === 'ia' ? ' (la VRAM décide de la taille des modèles d’IA utilisables)' : ''}.` });
      else out.push({ niveau: 'ok', composant: 'Carte graphique', texte: `${vram} Go de VRAM : adapté.` });
    }
    for (const d of m.disques || []) {
      const pct = d.totalGo ? Math.round((100 * d.libreGo) / d.totalGo) : null;
      if (pct != null && pct < 10) out.push({ niveau: 'goulot', composant: 'Stockage', texte: `${d.nom} presque plein (${pct} % libre) : Windows ralentit et les mises à jour peuvent échouer.` });
      else if (pct != null && pct < 20) out.push({ niveau: 'alerte', composant: 'Stockage', texte: `${d.nom} : ${pct} % libre, pensez à faire de la place.` });
      if (d.type === 'HDD' && d.systeme) out.push({ niveau: 'goulot', composant: 'Stockage', texte: 'Le système est sur un disque dur mécanique : un SSD rendra le PC beaucoup plus rapide (démarrage, logiciels).' });
    }
    if (/Windows 10/i.test(m.os || '')) out.push({ niveau: 'alerte', composant: 'Système', texte: 'Windows 10 n’est plus mis à jour gratuitement depuis octobre 2025 : prévoyez Windows 11 (TPM 2.0 requis) ou le programme ESU.' });
    const goulots = out.filter((x) => x.niveau === 'goulot');
    return { constats: out, goulots: goulots.length, verdict: goulots.length ? `Priorité : ${goulots[0].composant}` : 'Configuration équilibrée pour cet usage' };
  }
  /** Notes du banc d'essai (référence 1000 = PC de bureau milieu de gamme récent ; échelle indicative). */
  // Référence ≈ PC de bureau milieu de gamme récent (6 cœurs / 12 threads, DDR5, SSD NVMe PCIe 4.0). Unités : Mo/s de SHA-256, Go/s de copie mémoire, Mo/s d'écriture disque.
  const REF_BENCH = { cpu1: 2000, cpuN: 12000, memoire: 15, disqueE: 1500 };
  function notesBench(r) {
    const note = (v, ref) => (v ? Math.round((1000 * v) / ref) : null);
    const n = { cpu1: note(r.cpu1, REF_BENCH.cpu1), cpuN: note(r.cpuN, REF_BENCH.cpuN), memoire: note(r.memoire, REF_BENCH.memoire), disque: note(r.disqueE, REF_BENCH.disqueE) }; // la lecture peut venir du cache de Windows : non notée
    const vals = Object.values(n).filter((x) => x != null);
    n.global = vals.length ? Math.round(Math.exp(vals.reduce((a, x) => a + Math.log(Math.max(1, x)), 0) / vals.length)) : null;
    return n;
  }

  // ------------------------------------------------------------------ 📖 encyclopédie
  const E = (id, terme, cat, def) => ({ id, terme, cat, def });
  const ENCYCLO = [
    E('cpu', 'Processeur (CPU)', 'Processeur', 'Le « cerveau » qui exécute les instructions des programmes. Ses performances dépendent du nombre de cœurs, de la fréquence, de l’IPC (instructions par cycle) et des caches.'),
    E('coeur', 'Cœur et thread', 'Processeur', 'Un cœur est une unité de calcul indépendante. Le SMT (Hyper-Threading chez Intel) permet à un cœur de gérer deux fils d’exécution (threads) pour mieux l’occuper.'),
    E('pe', 'Cœurs P et E', 'Processeur', 'Architecture hybride Intel depuis la 12e génération : cœurs « Performance » pour les tâches lourdes et « Efficient » pour les tâches de fond, répartis par le Thread Director et Windows 11.'),
    E('cache', 'Mémoire cache', 'Processeur', 'Petite mémoire très rapide intégrée au processeur (L1, L2, L3) qui garde les données les plus utilisées. Le 3D V-Cache d’AMD empile du cache L3 supplémentaire, très efficace en jeu.'),
    E('ipc', 'IPC', 'Processeur', 'Instructions exécutées par cycle d’horloge. À fréquence égale, un processeur à meilleur IPC est plus rapide : c’est pourquoi les GHz seuls ne suffisent pas à comparer.'),
    E('tdp', 'TDP / PL1 / PL2', 'Processeur', 'Indication de la chaleur à évacuer (et de la consommation) en charge. Intel distingue la puissance de base (PL1) et la puissance turbo (PL2), souvent bien plus élevée.'),
    E('socket', 'Socket', 'Carte mère', 'Le support du processeur sur la carte mère (AM5, LGA1700, LGA1851…). Le processeur et la carte mère doivent avoir exactement le même socket.'),
    E('chipset', 'Chipset', 'Carte mère', 'Puce de la carte mère qui gère une partie des connexions (USB, SATA, lignes PCIe secondaires) et détermine des fonctions comme l’overclocking.'),
    E('vrm', 'VRM', 'Carte mère', 'Étage d’alimentation qui convertit le 12 V en tension adaptée au processeur. Des VRM faibles chauffent et brident les processeurs gourmands.'),
    E('uefi', 'BIOS / UEFI', 'Carte mère', 'Micrologiciel qui initialise le matériel et lance le système. L’UEFI a remplacé le BIOS : interface moderne, disques GPT, Secure Boot.'),
    E('ram', 'Mémoire vive (RAM)', 'Mémoire', 'Mémoire de travail rapide et temporaire (effacée à l’arrêt). Trop peu de RAM oblige le système à utiliser le disque, ce qui ralentit fortement le PC.'),
    E('ddr5', 'DDR4 / DDR5', 'Mémoire', 'Générations de mémoire incompatibles entre elles (encoches différentes). La DDR5 offre plus de débit ; la carte mère impose l’une ou l’autre.'),
    E('xmp', 'XMP / EXPO', 'Mémoire', 'Profils qui appliquent la fréquence et les latences annoncées par le fabricant de la RAM. Sans activation dans l’UEFI, la mémoire tourne souvent plus lentement.'),
    E('canal', 'Double canal', 'Mémoire', 'Utiliser deux barrettes (ou quatre) dans les bons emplacements double la largeur du bus mémoire : gain net en jeu et pour les GPU intégrés.'),
    E('ecc', 'ECC', 'Mémoire', 'Mémoire qui détecte et corrige les erreurs de bits. Indispensable sur les serveurs et les NAS sérieux.'),
    E('gpu', 'Carte graphique (GPU)', 'Graphique', 'Processeur spécialisé dans les calculs parallèles : affichage 3D, montage, et calcul IA. Sa mémoire (VRAM) est souvent le facteur limitant pour l’IA.'),
    E('vram', 'VRAM', 'Graphique', 'Mémoire de la carte graphique. Pour l’IA locale, elle détermine la taille des modèles chargeables ; pour le jeu, la qualité des textures et la résolution.'),
    E('cuda', 'CUDA', 'Graphique', 'Plateforme de calcul de NVIDIA qui permet d’exécuter des calculs généraux sur ses GPU ; la plupart des outils d’IA s’appuient dessus.'),
    E('tensor', 'Tensor Cores', 'Graphique', 'Unités des GPU NVIDIA dédiées au calcul matriciel (base de l’IA), très rapides en précision réduite (FP16, BF16, FP8, INT8).'),
    E('npu', 'NPU', 'Graphique', 'Unité dédiée à l’IA intégrée aux processeurs récents (Copilot+ PC, Apple Neural Engine) : faible consommation, pour l’inférence légère.'),
    E('ssd', 'SSD', 'Stockage', 'Stockage à mémoire flash, sans pièce mobile : bien plus rapide et résistant aux chocs qu’un disque dur.'),
    E('nvme', 'NVMe', 'Stockage', 'Protocole des SSD branchés en PCIe (souvent au format M.2), plusieurs fois plus rapide que le SATA.'),
    E('pcie', 'PCI Express', 'Bus', 'Bus à haut débit qui relie GPU, SSD NVMe et cartes d’extension. Chaque génération double le débit par ligne ; les générations sont compatibles entre elles.'),
    E('tbw', 'TBW', 'Stockage', 'Quantité totale de données qu’un SSD peut écrire sous garantie : indicateur d’endurance.'),
    E('raid', 'RAID', 'Stockage', 'Regroupement de disques pour la vitesse (RAID 0), la redondance (RAID 1, 5, 6) ou les deux (RAID 10). Le RAID ne remplace jamais une sauvegarde.'),
    E('smart', 'SMART', 'Stockage', 'Auto-diagnostic des disques et SSD (secteurs réalloués, usure, températures) : à surveiller pour anticiper une panne.'),
    E('alim', 'Alimentation (PSU)', 'Alimentation', 'Convertit le courant du secteur pour les composants. Une alimentation de qualité, bien dimensionnée, protège tout le PC.'),
    E('80plus', '80 PLUS', 'Alimentation', 'Certification du rendement d’une alimentation (Bronze, Gold, Platinum, Titanium) : moins de chaleur et de consommation perdues.'),
    E('throttling', 'Throttling', 'Refroidissement', 'Baisse automatique de fréquence quand un composant chauffe trop ou atteint sa limite de puissance : les performances chutent.'),
    E('tpm', 'TPM', 'Sécurité', 'Puce (ou fonction du processeur : fTPM, PTT) qui stocke des clés et mesure le démarrage. TPM 2.0 est requis par Windows 11.'),
    E('secureboot', 'Secure Boot', 'Sécurité', 'Fonction UEFI qui n’autorise au démarrage que des chargeurs signés, contre les rootkits de démarrage.'),
    E('bitlocker', 'BitLocker', 'Sécurité', 'Chiffrement de disque de Windows ; gardez précieusement la clé de récupération (compte Microsoft ou imprimée).'),
    E('vlan', 'VLAN', 'Réseau', 'Réseau virtuel qui sépare logiquement des appareils sur le même équipement (ex. : invités, caméras, bureau).'),
    E('wifi7', 'Wi-Fi 6 / 6E / 7', 'Réseau', 'Générations de Wi-Fi : meilleure gestion de nombreux appareils (6), bande des 6 GHz (6E), canaux de 320 MHz et multi-liens (7).'),
    E('gpon', 'GPON / XGS-PON', 'Réseau', 'Technologies de fibre jusqu’à l’abonné : une fibre partagée par plusieurs clients grâce à des coupleurs passifs ; XGS-PON monte à 10 Gbit/s symétriques.'),
    E('vpn', 'VPN', 'Réseau', 'Tunnel chiffré entre deux points (télétravail, sites distants). WireGuard est moderne et rapide ; IPsec est le standard historique en entreprise.'),
  ];
  const CATEGORIES = [...new Set(ENCYCLO.map((x) => x.cat))];
  const chercherEncyclo = (q) => { const s = String(q || '').toLowerCase().trim(); return !s ? ENCYCLO : ENCYCLO.filter((x) => (x.terme + ' ' + x.def + ' ' + x.cat).toLowerCase().includes(s)); };

  // ------------------------------------------------------------------ 📡 veille
  const VEILLE = [
    { id: 'cpu', nom: '🧠 Processeurs', sujet: 'nouveaux processeurs Intel, AMD, Qualcomm, Apple annoncés ou sortis récemment' },
    { id: 'gpu', nom: '🎮 Cartes graphiques', sujet: 'nouvelles cartes graphiques NVIDIA, AMD, Intel : sorties, prix, tests' },
    { id: 'cm', nom: '🧩 Cartes mères et chipsets', sujet: 'nouvelles cartes mères et chipsets récents' },
    { id: 'portables', nom: '💻 Ordinateurs portables', sujet: 'meilleurs ordinateurs portables récents et nouveautés' },
    { id: 'smartphones', nom: '📱 Smartphones', sujet: 'smartphones récemment sortis et annoncés' },
    { id: 'os', nom: '🪟 Systèmes d’exploitation', sujet: 'nouveautés Windows, Linux, macOS : versions, fins de support, mises à jour importantes' },
    { id: 'ia', nom: '🤖 Matériel pour l’IA', sujet: 'nouveau matériel pour l’IA : GPU data center, NPU, PC IA, accélérateurs' },
    { id: 'futur', nom: '🚀 Technologies émergentes', sujet: 'technologies matérielles émergentes : chiplets, HBM, photonique, quantique' },
  ];

  // ------------------------------------------------------------------ prompts
  const LANGUE = (lang) => (lang && lang !== 'fr' ? `\n\nIMPORTANT : rédige toute ta réponse dans la langue dont le code est « ${lang} » (les noms de produits, de technologies et les commandes restent tels quels).` : '');
  const DATE = '\nPour tout ce qui évolue vite (produits, prix, versions), précise la date de tes informations et invite à vérifier sur le site du fabricant.';
  function promptLecon(id, lang) {
    const l = LECONS[id]; if (!l) throw new Error('Leçon inconnue.');
    const m = MODULES.find((x) => x.id === l.module);
    return `Tu es mon mentor expert en matériel, systèmes et infrastructures (ingénieur, technicien senior et formateur). Donne-moi la leçon « ${l.titre} » (${l.resume}) du module « ${m.titre} » de l’Académie Systèmes et Technologie.

Structure la leçon ainsi, en Markdown :
## Les bases — expliquées simplement, avec une analogie concrète
## Fonctionnement détaillé — niveau professionnel, avec les chiffres qui comptent
## Sur le terrain — comment le vérifier ou le mesurer sur un vrai PC (outils et commandes Windows ET Linux)
## Comparer et choisir — critères, pièges marketing, tableau comparatif si utile
## Pannes et erreurs fréquentes — symptômes et diagnostic
## Exercice pratique — à faire seul, avec critères de réussite (sans la solution)
## Pour aller plus loin — documentation officielle : ${l.doc}

Sois précis et professionnel, ne simplifie pas à l’excès.${DATE} Termine en me proposant de répondre à mes questions.${LANGUE(lang)}`;
  }
  function promptQuiz(id, lang, n = 5) {
    const l = LECONS[id]; if (!l) throw new Error('Leçon inconnue.');
    return `Crée un quiz de ${n} questions à choix multiples sur « ${l.titre} » (${l.resume}), niveau professionnel : compréhension, diagnostic et cas pratiques, pas du par cœur.
Réponds UNIQUEMENT avec un tableau JSON, sans texte autour :
[{"q": "question", "choix": ["A", "B", "C", "D"], "bonne": 0, "explication": "pourquoi c'est la bonne réponse"}]
"bonne" est l'indice de la bonne réponse ; varie sa position d'une question à l'autre.${LANGUE(lang)}`;
  }
  function promptLab(id, lang) {
    const x = LABS[id]; if (!x) throw new Error('Laboratoire inconnu.');
    return `🧪 Laboratoire pratique « ${x.titre} » (Académie Systèmes et Technologie). Tu es mon formateur : mène le laboratoire de façon interactive, une étape à la fois, attends mes réponses, corrige-moi précisément.
Consigne : ${x.consigne}
Règles : ne me fais jamais exécuter de commande qui modifie ou efface quelque chose sans me prévenir clairement ; préfère les commandes en lecture seule. À la fin, résume ce que j’ai appris et note ma réussite sur 10.${DATE}${LANGUE(lang)}`;
  }
  function promptConseil(machine, usage, budget, lang) {
    return `Tu es un conseiller matériel expert et honnête. Voici MON PC, détecté automatiquement :
${JSON.stringify(machine, null, 1).slice(0, 6000)}
Mon usage principal : ${USAGES[usage] || usage}. Mon budget pour l’évoluer : ${budget ? budget + ' €' : 'non précisé'}.
1. Diagnostic : points forts, goulots d’étranglement (justifiés par les chiffres ci-dessus).
2. Évolutions recommandées, par ordre de rentabilité, avec la compatibilité à vérifier (socket, mémoire, alimentation, format).
3. Si changer de PC est plus raisonnable, dis-le et propose une configuration.
4. Ce que je peux améliorer gratuitement (réglages, nettoyage, pilotes, XMP/EXPO, plan d’alimentation).${DATE}${LANGUE(lang)}`;
  }
  function promptConfig(usage, budget, contraintes, lang) {
    return `Tu es un conseiller matériel expert. Compose une configuration complète pour : ${USAGES[usage] || usage}, budget ${budget || '?'} €. Contraintes : ${contraintes || 'aucune'}.
Donne un tableau (composant, modèle conseillé, pourquoi, prix indicatif), puis vérifie la compatibilité (socket, mémoire, format, alimentation, dimensions), propose une variante moins chère et une plus performante, et indique les compromis.${DATE}${LANGUE(lang)}`;
  }
  function promptComparer(a, b, lang) {
    return `Compare de façon impartiale « ${a} » et « ${b} » : tableau des caractéristiques, performances attendues par usage, consommation, plateforme et coût total, points faibles de chacun, puis recommandation selon le profil d’utilisateur.${DATE}${LANGUE(lang)}`;
  }

  return {
    MODULES, LECONS, LABS, NIVEAUX, XP, PARCOURS, CERTIFS, SEUIL, SOCKETS, FORMATS, USAGES, ENCYCLO, CATEGORIES, VEILLE, REF_BENCH,
    leconFaite, progression, eligibilite, sujetsCert, promptExamen, donneesCode, certificatHtml,
    verifierCompat, analyserMachine, notesBench, chercherEncyclo,
    promptLecon, promptQuiz, promptLab, promptConseil, promptConfig, promptComparer,
  };
});
