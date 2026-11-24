# Second jeu — installation sans spoiler

Version indépendante, branche game-2. Node.js 22+ recommandé.

```sh
npm install
npm run setup
npm run dev
```

Ouvrir http://localhost:5173. Tout le gameplay se contrôle au terminal. Tapez `help`, `man shell` et `mail` pour commencer. Le clavier et les raccourcis sont documentés dans le jeu. La commande `sound` active l'ambiance. `reset` propose de recommencer.

Les sauvegardes sont indépendantes du premier jeu. Le réseau, les commandes et les services sont entièrement fictifs : aucune opération sur le système réel.

Tests : `npm test`. Production : `npm run build`, puis `npm start` (http://localhost:3000).
