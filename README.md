# Game 3 — Installation sans spoiler

Node.js 22+ recommandé. `npm install`, `npm run setup`, `npm run dev`, puis http://localhost:5173. `npm run dev:watch` surveille uniquement le serveur pour les développeurs.

La messagerie est intégrée au poste de travail. Tu peux aussi utiliser `chat`, `talk iris "ton message"`, `chat open` et `tutorial off`. Les dialogues sont contextuels et scénarisés, sans modèle de langage externe. Le gameplay reste au terminal. `help` et `man shell` donnent les commandes.

Déplace les nœuds de la topologie à la souris : les positions sont conservées localement par sauvegarde. `map full` agrandit la carte, `map reset` la recentre et `map layout` restaure la disposition. `sound` active l'ambiance. `reset --confirm` recommence.

Les sauvegardes game-3 existantes sont conservées. `npm test` vérifie le moteur ; `npm run build` puis `npm start` pour la version compilée. Tout le réseau, les services et les incidents sont simulés.

## Bureau personnalisable

Chaque panneau peut être détaché (↗), déplacé par son titre, redimensionné par son coin inférieur droit et réancré (↙). Les flèches ↑/↓ changent l'ordre des panneaux ancrés. Le menu **Bureau** permet de régler le côté, la largeur, les thèmes, les couleurs et le fond d'écran local. Les préférences sont sauvegardées dans le navigateur, indépendamment de la partie. Le terminal, la carte et les conversations restent montés pendant les changements de disposition. Commandes : `workspace`, `theme`, `theme graphite`, `popup map`, `popup chat`, `popup terminal`, `popup resources`. `map full` détache/réancre la carte.
