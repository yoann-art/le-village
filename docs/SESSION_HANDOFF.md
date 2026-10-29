# Passation de séance (29 octobre 2026)

## Où on en est

- Version en ligne : **v2.1.97** (commit `d754a08`), envoyée sur GitHub avec l'accord de Yo le 29 octobre 2026
  (run de vérification `40844309073`, vert, noté dans `.claude/verif-suivi.txt`). Carnet de bugs : aucune note ouverte.
- **Les 21 insectes de l'île sont refaits d'après les images de Yo** (v2.1.57 à v2.1.82, le dernier : le Grand Paon de
  nuit). Le cloporte et l'épeire sont en réserve (`reserve` dans `INSECTES`), décision de Yo.
- **Les 12 oiseaux de l'île sont refaits d'après ses images** (v2.1.84 à v2.1.97, le dernier : la cigogne), après leurs
  règles (v2.1.83) : 4 à la fois au printemps et en été, 3 en automne et en hiver ; seuls les communs tant que le carnet
  compte moins de 3 oiseaux ; les moineaux volent seuls (v2.1.86, Yo est revenu sur les groupes).
- Les 7 insectes et les 5 oiseaux de la Forêt profonde, les 4 insectes et les 4 oiseaux du Marais gardent leur forme simple.
- Yo n'a pas encore dit avoir tout validé sur son téléphone.
- Comparaisons : `C:\Users\Artefact\Desktop\Hearthwild\images\insectes\` et `…\images\oiseaux\` (`<nom>-comparaison.png`).

## Les derniers fichiers modifiés

- `js/monde/oiseaux3d.js` (nouveau, comme `insectes3d.js`) : `MODELES_OISEAUX`, `assembler` (les petits oiseaux ronds :
  corps, tête sur un pivot au cou, ailes, et selon l'oiseau la queue, le bas du bec, la gorge, le ver, le poisson, les
  grandes ailes de vol), `echassier` (le héron et la cigogne : cou et pattes sur leurs pivots).
- `js/oiseaux.js` : `modele` prend d'abord `MODELES_OISEAUX` ; `OISEAUX_SAISON`, `oiseauxAPondre` ; les comportements
  dans `vivre`, réglés par des données dans `OISEAUX` (`js/donnees.js`) : `acrobate`, `ondule` (mésange), `courbette`
  (rouge-gorge), `ecoute` (merle), `marche` (pie, mouette), `plane` (mouette, cigogne), `chasse` (hirondelle ;
  « lente » : la chouette), `peche`, `lent` (héron), `tourneTete` (chouette), `queueHaute` (rossignol), `plonge`
  (martin-pêcheur), `claque`, `couTendu` (cigogne) ; les états en plus de « pose »/« vol »/« part » : « plane »,
  « chasse », « plonge ».
- `js/monde/insectes3d.js`, `js/insectes.js` : les 21 insectes et leurs comportements (voir DEVELOPMENT_HISTORY).
- `tests/verif-page.js` : un geste par insecte et par oiseau (étapes « Attraper un insecte au filet » et « Attraper un
  oiseau au filet »). Un geste qui dépend du hasard (un oiseau qui repart chasser) doit l'empêcher le temps du contrôle :
  la v2.1.95 a échoué sur GitHub pour ça.

## À faire en premier dans la nouvelle séance

1. `git status` : le dossier doit être propre.
2. Lancer le jeu avec `preview_start` « jeu » ; s'il est arrêté pendant une vérification (`ERR_CONNECTION_REFUSED`),
   le relancer et refaire la vérification (c'est arrivé deux fois le 28 et le 29 octobre).
3. Lire la dernière vérification de GitHub et le carnet de bugs (seulement les notes de `yoann-art`).
4. Attendre Yo : son avis sur son téléphone, puis la suite. Yo veut faire **tout ce qui se trouve sur son île en premier**
   (28 octobre 2026) ; sur l'île, restent par exemple les poissons d'après images, les sons de la nature, le niveau 3 de
   la Scierie, les bâtiments d'après images (voir [CURRENT_STATE.md](CURRENT_STATE.md)). Lui proposer, ne pas choisir.

## Pour refaire un animal (la méthode qui a marché)

1. Ranger l'image de Yo dans `images\<thème>\<nom>.png`. La comparer au vrai animal et lister les écarts : Yo veut
   **comme un vrai** (mémoire `insectes-comme-des-vrais`), mâles et femelles au hasard quand ils diffèrent.
2. Proposer un découpage (le modèle, ce qu'il fait, les vérifications) et des questions ; attendre son accord.
3. Le modèle : rendu avec `outils-claude\insecte.mjs` pour un insecte ; pour un oiseau, le script de la séance
   `oiseau.mjs` (dans le dossier temporaire, à recréer au besoin : il charge `MODELES_OISEAUX[clé].fabrique` et rend deux
   vues ; `HASARD` < 0,5 donne un mâle, `SAISON`, `VUES`, `OUVERT`). Retoucher jusqu'à ce que ce soit au plus près ;
   une photo dans le jeu (`lacherOiseau(k, x, z, y)` ou `lacherInsecte`) ; la comparaison avec PIL, envoyée à Yo.
4. Un geste dans `tests/verif-page.js`, la version dans `js/version.js`, une ligne dans `DEVELOPMENT_HISTORY.md` et
   `CURRENT_STATE.md` ; `NAVIGATEUR=msedge node tests/verif.mjs` jusqu'à « Tout va bien » ; demander « Oui, envoie » ;
   `git push origin HEAD:main` ; surveiller GitHub, noter le run, mettre à jour le Journal du plan de production ; renvoyer
   à Yo la liste (✅ faits, restants).

## Points qui demandent l'accord de Yo

- La suite sur l'île (voir plus haut).
- La note du carnet du moineau dit encore « s'envole en groupe » (les moineaux volent seuls depuis la v2.1.86) ; celle
  du rouge-gorge « Il suit le jardinier », que Yo n'a pas voulu dans le jeu.
- Dans la Boîte à idées : le vulcain sur les pommes tombées, le nid de la cigogne sur les toits.
- Un petit défaut signalé : la bande turquoise du martin-pêcheur dépasse un peu derrière la tête, vue de côté.

## Fichiers à lire selon la tâche

- Toujours : `CLAUDE.md`, ce fichier, [CURRENT_STATE.md](CURRENT_STATE.md).
- Un modèle d'après image : `js/monde/formes.js`, le modèle le plus proche déjà fait (`insectes3d.js`, `oiseaux3d.js`,
  une fleur, `scierie.js`).
- Un système de jeu : [ARCHITECTURE.md](ARCHITECTURE.md), puis chercher son nom dans [DEVELOPMENT_HISTORY.md](DEVELOPMENT_HISTORY.md).
- Rendu, performance, sauvegarde : [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md).
- Game design, contenu, règles complètes de Yo : [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
