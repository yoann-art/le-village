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
- Conséquence : le jeu ne s'ouvre pas par double-clic sur `index.html`, il faut un serveur. En local : configuration « jeu » de `.claude/launch.json` (http://localhost:8000), qui lance `.claude/serveur.py` (serveur sans mémoire cache, pour toujours voir la dernière version).
- Mesures : 1 case du sol = 1 P = 1 unité 3D (`P` dans `js/monde/formes.js`). L'île fait 40 × 40 cases. Bâtiments : 3 × 3 P (Chaumière, Scierie, Carrière, Forge) ou 4 × 4 P (Marché, Taverne, Château), murs de 2 P, porte de 1,5 P au milieu de la façade tournée vers le bas de l'écran (`DOOR_X` et `frontOf` dans `batiments.js`). Arbres 3 à 4 P, jamais collés ; rochers ½ à 1 P.
- `js/main.js` relie tout et fait tourner la boucle. L'ordre de ses `import` compte : `miseajour.js` en tout premier, puis `verification.js`, puis le décor dans l'ordre où il est posé.
- Toujours la dernière version : `sw.js` (service worker à la racine) redemande chaque fichier du site au serveur (`cache: "no-cache"`) ; `js/miseajour.js` l'enregistre et, quand on revient sur le jeu resté ouvert, recharge la page si le numéro de `js/version.js` en ligne a changé (une seule fois par version). Garder la ligne `export const VERSION = "…";` telle quelle : elle est lue par ce contrôle.
- `js/donnees.js` : les chiffres réglables (ressources, bâtiments, mini-jeux). `js/regles.js` : coûts, niveaux, bonus. `js/sauvegarde.js` : partie gardée dans le navigateur (clé `le-village-v2-ile`, format v3 ; les parties v2 sont reprises avec leurs bâtiments remboursés).
- `js/monde/` : la 3D. `formes.js` est la boîte à outils commune (matières, formes) : c'est là que viendra l'ombrage toon de la Scierie pour tous les modèles.
- `js/minijeux/` : un fichier par mini-jeu, plus `minijeux.js` (menu, écran, récompense).

## Tester sur téléphone

- En ligne : https://yoann-art.github.io/le-village/ (GitHub Pages, dépôt public `yoann-art/le-village`, branche `main`, dossier racine). Mise à jour environ une minute après chaque envoi.
- L'envoi sur GitHub (`git push`) est lancé par Yo lui-même : lui donner la commande à exécuter.
- Numéro de version affiché en bas de l'écran, réglé dans `js/version.js`. Il suit l'étape du plan (1.0, 1.1, 1.2…) ; chaque envoi en cours d'étape ou correction ajoute un chiffre (1.1.1, 1.1.2…). Le changer avant chaque envoi : c'est lui qui déclenche le rechargement automatique sur le téléphone de Yo.

## Où on en est

Phase 1 : « tout jouable en formes simples ». On suit les étapes 1.1 à 1.12 du plan, dans l'ordre, environ une par séance. Porte de sortie : la boucle de jeu est amusante, testée par de vrais joueurs sur téléphone.

Étape 1.0 (passer sur Claude Code) terminée le 29 septembre 2026. En cours : étape 1.1, entrer dans un bâtiment, validée par Yo en trois morceaux :
1. Tout à la bonne taille (v1.1.1) : fait et validé ; caméra rapprochée à 8 P de large à la demande de Yo (v1.1.2).
2. Entrer et sortir : on entre en marchant dans la porte, fondu au noir ; pièce vue de biais, mur de devant retiré, caméra qui suit sans sortir de la pièce ; on sort en repassant la porte ; dedans, pas de bouton Construire ; jeu rouvert à l'intérieur = on reprend dehors devant la porte.
3. Une pièce par bâtiment : moyenne 6 × 6 P, puis 7 × 7 et 8 × 8 aux niveaux 2 et 3 ; grande 8 × 8, 9 × 9, 10 × 10 (Château : 8 × 8, un seul niveau) ; couleurs selon l'ambiance de la bible ; pièces vides (meubles à l'étape 1.2). Tailles à revoir visuellement avec Yo.

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
