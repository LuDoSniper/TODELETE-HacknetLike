# Game 3 — Installation sans spoiler

Node.js 22+ recommandé. `npm install`, `npm run setup`, `npm run dev`, puis http://localhost:5173. `npm run dev:watch` surveille uniquement le serveur pour les développeurs.

La messagerie est intégrée au poste de travail. Tu peux aussi utiliser `chat`, `talk iris "ton message"`, `chat open` et `tutorial off`. Iris et Mara répondent grâce à un modèle de langage local Ollama. Les messages d'histoire et les conseils d'initiation restent écrits à la main. Le gameplay reste au terminal. `help` et `man shell` donnent les commandes.

Déplace les nœuds de la topologie à la souris : les positions sont conservées localement par sauvegarde. `map full` agrandit la carte, `map reset` la recentre et `map layout` restaure la disposition. `sound` active l'ambiance. `reset --confirm` recommence.

Les sauvegardes game-3 existantes sont conservées. `npm test` vérifie le moteur ; `npm run build` puis `npm start` pour la version compilée. Tout le réseau, les services et les incidents sont simulés.

## Bureau personnalisable

Chaque panneau peut être détaché (↗), déplacé par son titre, redimensionné par son coin inférieur droit et réancré (↙). Les flèches ↑/↓ changent l'ordre des panneaux ancrés. Le menu **Bureau** permet de régler le côté, la largeur, les thèmes, les couleurs et le fond d'écran local. Les préférences sont sauvegardées dans le navigateur, indépendamment de la partie. Le terminal, la carte et les conversations restent montés pendant les changements de disposition. Commandes : `workspace`, `theme`, `theme graphite`, `popup map`, `popup chat`, `popup terminal`, `popup resources`. `map full` détache/réancre la carte.

## Personnages IA locaux

1. Installer Ollama pour Windows : https://ollama.com/download/windows
2. Dans PowerShell : `ollama pull qwen2.5:7b` (environ 4,7 Go). Ollama doit être installé et accessible dans le PATH ; le lanceur du jeu démarre sa propre instance.
3. Démarrer le jeu normalement : `npm run dev`. Aucune clé API, aucun service cloud requis.

Le modèle par défaut est `qwen2.5:7b`. Pour une machine plus modeste, télécharger `ollama pull qwen2.5:3b` puis définir `$env:MESH_NPC_MODEL = "qwen2.5:3b"` avant `npm run dev`. Le modèle plus petit peut être moins cohérent. Le lanceur utilise une instance privée sur `127.0.0.1:11435`. Le serveur lancé manuellement sans le lanceur utilise `127.0.0.1:11434`. Ne pas exposer Ollama au réseau. Utiliser exclusivement un modèle installé localement et désactiver les fonctions cloud d'Ollama si elles sont activées. Le jeu ne télécharge aucun modèle automatiquement.

Le moteur de dialogue conserve une relation privée par contact (confiance, respect, affinité, agacement, événements marquants), persistante dans la sauvegarde mais absente de l'état affiché. Le modèle reçoit uniquement les faits de l'enquête accessibles au contact, son intention, la partie autorisée de son lore et son historique récent. Une réponse peut être un message, une clarification, un refus humain ou un silence. Un deuxième appel local vérifie la réponse et son effet relationnel. Les petits échanges anodins sont possibles ; les demandes ne sont plus filtrées uniquement par mots-clés. Les documents du contact sont prédéfinis et leur partage est limité à une liste d'actions autorisées. Le modèle n'a aucun accès aux fichiers, au terminal ou aux secrets du moteur. Aucun filtre sémantique ne garantit un jeu de rôle parfait. Si Ollama est indisponible, l'interface signale un problème de transmission sans inventer une réponse du personnage. La fenêtre de contexte est de 8192 tokens ; le premier chargement et les deux appels peuvent prendre du temps.

`npm test` inclut des tests avec un serveur Ollama simulé ; les tests ne nécessitent pas de télécharger le modèle. Ils ne remplacent pas des essais adversariaux avec un véritable modèle.

## Accès, documentation et fermeture d'Ollama

Un hôte découvert n'accorde plus de shell. Les quelques comptes invités publics restent accessibles ; les autres exigent une autorisation spécifique à leurs services. `probe <hôte>` indique notamment l'état et l'authentification du shell. `svc <hôte> <port> help` affiche le protocole, `svc <hôte> <port> docs` les documents publics. `man <commande>` contient des pages structurées, sans solution de mission. Les anciens accès invités devenus privés sont révoqués à l'ouverture d'une sauvegarde ; le coffre et la progression restent intacts.

Sous Windows, quitter l'application Ollama de la zone de notification et désactiver son démarrage automatique si on ne l'utilise que pour Mesh. Après le téléchargement initial du modèle, `npm run dev` ou `npm start` lance le serveur Ollama privé et le ferme lors de l'arrêt normal du jeu avec Ctrl+C. Le modèle est déchargé après 45 secondes d'inactivité. Une autre instance Ollama n'est jamais arrêtée volontairement par Mesh. Fermer brutalement le processus ou éteindre le PC ne garantit pas l'exécution du nettoyage. Si nécessaire, `ollama stop qwen2.5:7b` décharge le modèle d'une instance standard ; pour l'instance privée, utiliser `$env:OLLAMA_HOST = "127.0.0.1:11435"` avant la commande. Le jeu fonctionne sans Ollama, mais les conversations sont limitées.


Les anciennes sauvegardes conservent les messages et la progression. La relation démarre avec les valeurs initiales lors de la migration ; aucun score historique n'est inventé. Les conseils automatiques de prise en main viennent désormais du système MESH, pas d'Iris. Les relances spontanées sont rares et déclenchées par l'activité en jeu, pas par un processus de fond.
