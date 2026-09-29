# Hearthwild : instructions pour Claude Code

## Le projet

Hearthwild (nom de travail : « Le Village ») est un jeu mobile Android pour adultes. On bâtit son île en paix, puis on part chercher l'aventure et le danger au-dehors. Univers médiéval-fantastique, vue façon Animal Crossing, joystick virtuel.

Yo, l'auteur du jeu, n'est pas développeur. Il travaille en français, pas à pas, et valide chaque étape en jouant sur son téléphone.

## Les documents de référence

- `bible.pdf` : le plan de production complet, exporté depuis le document de suivi. La partie « Phase 0 » est la bible du jeu, validée par Yo : toutes les règles du monde y sont. En cas de doute, la bible fait foi. Ne jamais contredire une décision de la bible sans en parler d'abord à Yo. Elle reste sur le PC : le dépôt GitHub est public, les PDF n'y sont pas envoyés.
- Le jeu : `index.html` à la racine, `css/style.css` et le code découpé dans `js/` (voir « Organisation du code »). Il contient l'île en 3D, le joystick, le placement de 7 bâtiments à 3 niveaux et 3 mini-jeux (Bûcheron, Carrière, Runes).
- `essais/scierie-essai.html` : l'essai validé de la Scierie, construite en code à partir de formes simples. C'est la référence de style pour tout le décor : formes arrondies, palette de la bible, ombrage toon commun à tous les modèles.

## Organisation du code

- three.js r128, chargé depuis cdnjs comme variable globale `THREE`. Pas d'outil de compilation : modules JavaScript natifs (`import`/`export`), lus tels quels par le navigateur.
- Conséquence : le jeu ne s'ouvre pas par double-clic sur `index.html`, il faut un serveur. En local : configuration « jeu » de `.claude/launch.json` (http://localhost:8000).
- `js/main.js` relie tout et fait tourner la boucle. L'ordre de ses `import` compte : `verification.js` d'abord, puis le décor dans l'ordre où il est posé.
- `js/donnees.js` : les chiffres réglables (ressources, bâtiments, mini-jeux). `js/regles.js` : coûts, niveaux, bonus. `js/sauvegarde.js` : partie gardée dans le navigateur (clé `le-village-v2-ile`).
- `js/monde/` : la 3D. `formes.js` est la boîte à outils commune (matières, formes) : c'est là que viendra l'ombrage toon de la Scierie pour tous les modèles.
- `js/minijeux/` : un fichier par mini-jeu, plus `minijeux.js` (menu, écran, récompense).

## Tester sur téléphone

- En ligne : https://yoann-art.github.io/le-village/ (GitHub Pages, dépôt public `yoann-art/le-village`, branche `main`, dossier racine). Mise à jour environ une minute après chaque envoi.
- L'envoi sur GitHub (`git push`) est lancé par Yo lui-même : lui donner la commande à exécuter.
- Numéro de version affiché en bas de l'écran, réglé dans `js/version.js`. Il suit l'étape du plan (1.0, 1.1, 1.2…) ; une correction ajoute un chiffre (1.1.1). Le changer avant chaque envoi, pour que Yo voie tout de suite si son téléphone montre la dernière version (GitHub peut garder l'ancienne en mémoire une dizaine de minutes).

## Où on en est

Phase 1 : « tout jouable en formes simples ». On suit les étapes 1.1 à 1.12 du plan, dans l'ordre, environ une par séance. Porte de sortie : la boucle de jeu est amusante, testée par de vrais joueurs sur téléphone.

Étape 1.0 (passer sur Claude Code) terminée le 29 septembre 2026. Prochaine étape : 1.1, entrer dans un bâtiment.

## Règles de travail

- Parler à Yo en français, simplement, sans jargon. À la fin de chaque séance, dire ce qui a changé et comment le tester.
- Avant d'écrire le code d'une étape, proposer un découpage et attendre l'accord de Yo.
- Le prototype a été découpé en plusieurs fichiers le 29 septembre 2026, validé par Yo sur téléphone (l'ancien fichier unique reste dans l'historique git). La technologie web actuelle (three.js) reste en place ; le choix entre le web et Godot se fera à l'étape 2.6.
- Utiliser git : un commit clair à chaque avancée qui fonctionne, pour pouvoir revenir en arrière.
- Le jeu doit tourner dans le navigateur d'un téléphone Android modeste. Proposer à Yo la façon la plus simple de l'ouvrir sur son téléphone, et la lui expliquer pas à pas.
- En phase 1, pas de modèles finaux : des formes simples suffisent.

## Règles de la bible à ne jamais oublier

- Style jouet : rond et doux pour le refuge, pointu et anguleux pour le danger. Même ombrage toon pour tous les modèles.
- Tout se mesure en P, la hauteur du personnage (trois têtes de haut). Une porte fait 1,5 P, un étage 2 P.
- Placement des objets libre, au centimètre, avec un aimantage facultatif.
- Aucune jauge d'énergie, aucune limite qui bloque une longue session. Le temps réel rythme la journée sans jamais bloquer.
- Le village est un refuge : le danger reste dehors, dans les zones sauvages et les grottes.
- Les mini-jeux sont le geste d'une activité : courts, jamais bloquants (rater donne une qualité moindre, jamais rien) et automatisables une fois maîtrisés.
