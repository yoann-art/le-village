# Hearthwild : la suite

Ce que Yo a demandé est marqué **(Yo)** ; ce que Claude propose est marqué *(proposition)*. Yo décide de l'ordre.

## En cours (Yo, 25 octobre 2026)

1. **Les insectes de l'île, un par un, d'après les images de Yo** (Yo : « les modèles un par un d'après ses images »,
   onglet « Insectes » de `prompts.html`). Fait : la piéride blanche (v2.1.57). Restent 22 : abeille, bourdon,
   coccinelle, fourmi, cloporte, perce-oreille, sauterelle, grillon, libellule, hanneton, punaise verte, luciole,
   paon-du-jour, machaon, vulcain, citron, sphinx, phalène d'hiver, cigale, mante religieuse, épeire des jardins,
   Grand Paon de nuit (clés dans `INSECTES`, `js/donnees.js`). Yo envoie l'image suivante quand il veut.
   - Façon de faire : un modèle par insecte dans `js/monde/insectes3d.js`, ajouté à `MODELES_INSECTES` ; tête vers −z ;
     ailes sur des pivots dans `userData.ailes` ; peintures en `CanvasTexture` ; comparer avec le script de rendu
     (voir SESSION_HANDOFF) ; une photo dans le jeu ; un contrôle dans `tests/verif-page.js` ; version ; note dans
     `docs/DEVELOPMENT_HISTORY.md` ; vérification complète ; commit ; demander « Oui, envoie ».
   - *(proposition)* la piéride posée sur une fleur, les ailes refermées : à proposer à Yo, pas à coder sans accord.
   - Critère de validation : Yo regarde la comparaison, puis joue sur son téléphone.

## Ensuite (demandés ou prévus par Yo, ordre à confirmer avec lui)

- **Les icônes d'après les modèles refaits** (Yo, 29 octobre 2026 : « que cela ressemble à l'objet en question » ;
  « Utilises ce que toi tu as créé et qui est dans le jeu validé ») : une photo du modèle du jeu, seulement pour ce qui a
  été refait d'après ses images (insectes, oiseaux, fleurs sauvages, ce qu'on ramasse) ; les outils, meubles et le reste
  gardent leur icône actuelle. Les bois, la pomme et les graines : des prompts plus tard, pour qu'ils aient leur image.
  Fait en v2.1.101 (45 icônes).
- **Les intérieurs transformés avec les ressources** (Yo, 29 octobre 2026 : « chaque intérieur soit tous identiques et
  basique au départ et que l'on pourra transformer en fonction des ressources (mur, sol,..) » ; la bible : « Tous les
  intérieurs se décorent librement, murs et sols compris ») ; ses choix : le départ en terre battue et torchis clair pour
  toutes les pièces ; les revêtements fabriqués avec les ressources, posés **mur par mur**, et le sol **case par case** ;
  les parties en cours repartent en terre battue et torchis (les meubles restent en place) ; la palette de couleurs
  gratuite enlevée ; la lumière propre à chaque bâtiment gardée. Le bouton « Décorer » à revoir (Meubles, Sol, Murs).
  Découpage accepté le 29 octobre 2026 (après les icônes).

- **La Scierie niveau 3** d'après son image (étape 2.2, morceau 3), puis **la Scierie qui vit** (morceau 4 : roue à eau
  qui tourne déjà, scie qui bouge quand l'établi travaille, fumée, fenêtres la nuit, neige sur le toit).
- **Les 6 fleurs de jardin** d'après leurs images, chacune avec son lieu (décidé le 21 octobre 2026).
- **Les sons de la nature** (étape 2.1, morceau 5 : bibliothèques CC0, choisis par Claude, validés par Yo en jouant)
  et **la musique** (les morceaux Suno de Yo ; la playlist décrite dans le doc Suno).
- Le reste de l'île (« toute l'île d'abord », 15 octobre 2026) : les 6 autres bâtiments, ponton, pont et orée de la forêt,
  entrée de la mine, chemins, coffre, lumières ; les 12 oiseaux et les poissons de l'île.
- Puis la forêt et le Marais refaits avec leurs arbres (morceau 2d), l'étape 2.3 (la Scierie dedans) et la suite de la phase 2.

## Dépendances et risques

- Chaque modèle d'après image attend **l'image de Yo** (rangée dans `C:\Users\Artefact\Desktop\Hearthwild\images\<thème>\`).
- Fluidité : chaque nouveau modèle détaillé ajoute des triangles ; mesurer (triangles, dessins), prévoir un modèle léger au loin.
- Changer un tirage de `genMap` change la nature des parties en cours : le dire à Yo.
- Les matières des insectes sont clonées pour s'estomper ; une texture partagée reste partagée (c'est voulu).

## Décisions que Yo doit prendre

- L'ordre des chantiers après les insectes (Scierie niveau 3, fleurs de jardin, sons…).
- *(proposition)* La piéride au repos, ailes refermées.
- Plus tard : l'étape 2.6 (web ou Godot) ; les deux essais proposés pour « aussi beau que Genshin » (contour et lumière
  sur les bords ; un modèle Meshy) ; les doublons signalés (épeire / araignée tisserande, Entrepôt / coffres).
