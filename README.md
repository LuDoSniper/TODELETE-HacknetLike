# RIFT/OS — game-4

Quatrième prototype indépendant : un poste de travail façon système d'exploitation, avec un réseau et des attaques **entièrement simulés**. Le moteur ne contacte jamais les adresses saisies et ne lance aucune commande du système hôte. Les adresses de documentation, protocoles FRAME/1, RING/2, GRAPH/3 et outils sont fictifs.

## Démarrage

    git switch game-4
    npm install
    npm run setup
    npm run dev

Ouvrir l'adresse Vite affichée (habituellement http://localhost:5173).
En production locale : npm run build puis npm start (http://localhost:3000).
npm test lance les tests du moteur. Les sauvegardes RIFT ont leur propre préfixe et ne modifient pas les parties MESH.

## Jouer

La fenêtre Formation présente un exercice pratique qui se valide selon les actions réellement accomplies. Le terminal propose help, man, tutorial, mission et mail. Les autres applications se lancent depuis le bureau ou le menu RIFT. Les fenêtres sont indépendantes, déplaçables, redimensionnables, minimisables et maximisables. La carte accepte le déplacement des nœuds et des annotations de couleur, conservées par sauvegarde ; l'évolution de l'état automatique annule l'annotation.

Les ports exposent des services, distincts du shell. probe identifie les protocoles, inspect révèle les signatures, request consulte les ressources avec la même convention GET et des droits public/user/root. Les outils LATCH, SPLICE, WEAVE et PRISM proposent des épreuves de logique sur des données virtuelles. Les attaques ont des coûts en RAM et bruit, des modes quiet/burst et des contre-mesures par cible. Les relais augmentent le pool de mémoire. Le bruit monte pendant les opérations si une tâche tourne ; à 100%, elle est interrompue. wait réduit le bruit hors attaque active. Aucun échec ne détruit une preuve originale.

Le laboratoire mène à une enquête jouable, plusieurs chemins réseau, accès utilisateur et élévation root, preuves récupérables, et deux fins de publication. Le moteur et le bureau sont séparés pour faciliter une future architecture OS/VM. Il ne s'agit pas encore d'un OS bootable. Noa transmet les missions par courrier ; l'IA locale de MESH n'est pas intégrée dans cette première version, afin de valider d'abord le gameplay.

## Architecture

- server/rift/world.mjs : réseau fictif, services, ressources et scénario
- server/rift/engine.mjs : moteur pur, commandes, permissions, tâches, tutoriel
- server/rift/server.mjs : API Express, Socket.IO, sauvegardes Prisma/SQLite
- src/rift.jsx, src/rift.css : bureau et applications

Les prototypes antérieurs restent dans leurs branches.
