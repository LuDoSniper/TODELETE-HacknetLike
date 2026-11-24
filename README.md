# Game 3 — Installation sans spoiler

Node.js 22+ recommandé. `npm install`, `npm run setup`, `npm run dev`, puis http://localhost:5173. `npm run dev:watch` surveille uniquement le serveur pour les développeurs.

La messagerie est intégrée au poste de travail. Tu peux aussi utiliser `chat`, `talk iris "ton message"`, `chat open` et `tutorial off`. Iris et Mara répondent grâce à un modèle de langage local Ollama. Les messages d'histoire et les conseils d'initiation restent écrits à la main. Le gameplay reste au terminal. `help` et `man shell` donnent les commandes.

Déplace les nœuds de la topologie à la souris : les positions sont conservées localement par sauvegarde. `map full` agrandit la carte, `map reset` la recentre et `map layout` restaure la disposition. `sound` active l'ambiance. `reset --confirm` recommence.

Les sauvegardes game-3 existantes sont conservées. `npm test` vérifie le moteur ; `npm run build` puis `npm start` pour la version compilée. Tout le réseau, les services et les incidents sont simulés.

## Bureau personnalisable

Chaque panneau peut être détaché (↗), déplacé par son titre, redimensionné par son coin inférieur droit et réancré (↙). Les flèches ↑/↓ changent l'ordre des panneaux ancrés. Le menu **Bureau** permet de régler le côté, la largeur, les thèmes, les couleurs et le fond d'écran local. Les préférences sont sauvegardées dans le navigateur, indépendamment de la partie. Le terminal, la carte et les conversations restent montés pendant les changements de disposition. Commandes : `workspace`, `theme`, `theme graphite`, `popup map`, `popup chat`, `popup terminal`, `popup resources`. `map full` détache/réancre la carte.

## Personnages IA locaux

1. Installer Ollama pour Windows : https://ollama.com/download/windows
2. Dans PowerShell : `ollama pull qwen2.5:7b` (environ 4,7 Go). Ollama doit être lancé.
3. Démarrer le jeu normalement : `npm run dev`. Aucune clé API, aucun service cloud requis.

Le modèle par défaut est `qwen2.5:7b`. Pour une machine plus modeste, télécharger `ollama pull qwen2.5:3b` puis définir `$env:MESH_NPC_MODEL = "qwen2.5:3b"` avant `npm run dev`. Le modèle plus petit peut être moins cohérent. Le client HTTP est limité à `127.0.0.1:11434` ; ne pas exposer Ollama au réseau. Utiliser exclusivement un modèle installé localement et désactiver les fonctions cloud d'Ollama si elles sont activées. Le jeu ne télécharge aucun modèle automatiquement.

Le moteur fournit seulement la personnalité du contact, des faits déjà confirmés et une courte portion de sa propre conversation. Les solutions, fichiers, jetons et états techniques internes ne sont pas transmis. Une génération et une vérification structurée sont effectuées avant affichage ; les requêtes hors rôle évidentes sont traitées sans modèle. Le modèle ne dispose d'aucun outil ni accès au moteur. Les barrières réduisent fortement les détournements mais ne garantissent pas un jeu de rôle infaillible. Si Ollama est arrêté ou indisponible, les personnages répondent par un message de liaison dégradée ; le reste du jeu fonctionne normalement. La première réponse peut être lente pendant le chargement du modèle.

`npm test` inclut des tests avec un serveur Ollama simulé ; les tests ne nécessitent pas de télécharger le modèle. Ils ne remplacent pas des essais adversariaux avec un véritable modèle.
