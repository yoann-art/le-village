# Hearthwild : l'état actuel (26 octobre 2026, v2.1.57)

## Ce qui marche (vérifié)

- Toute la phase 1 (étapes 1.1 à 1.13, sauf 1.12 reportée) : jouable et validée par Yo sur son téléphone.
- Étape 2.1 (le décor de l'île) : faite d'après les images de Yo (arbres de l'île, pierre, caillou, branche, herbes,
  groseillier, thym, galets, sol, plage, mer, étang, berge, 7 fleurs sauvages) ; restent les sons de la nature.
- Étape 2.2 (la Scierie dehors) : niveaux 1 et 2 faits (v2.1.46 à v2.1.50).
- Les insectes : nouvelles règles (v2.1.55, v2.1.56) ; la piéride blanche refaite d'après son image (v2.1.57).
- **Essais réellement faits pour la v2.1.57 (26 octobre 2026)** : la vérification complète sur le PC
  (`NAVIGATEUR=msedge node tests/verif.mjs`) : « Tout va bien » ; une photo de la piéride dans le jeu (aperçu « jeu »).
  La v2.1.57 a été envoyée sur GitHub (commit `303947d`) : vérification de GitHub **verte** (run `40272323021`,
  noté dans `.claude/verif-suivi.txt`). Pas encore validée par Yo sur son téléphone.
- Carnet de bugs : aucune note ouverte sur GitHub au 26 octobre 2026.

## En partie fait

- Les insectes de l'île : 21 (v2.1.63 : le cloporte et l'épeire, qui ne sont pas des insectes, en réserve pour une future mise à jour, décision de Yo). D'après images : 13 sur 21 (le paon-du-jour, posé ailes fermées, qui montre ses yeux, v2.1.74 ; la luciole d'Italie qui vole et clignote, v2.1.73 ; la punaise verte plate, qui brunit avec la saison, v2.1.72 ; le hanneton qui compte ses sous avant de s'envoler, v2.1.71 ; le grillon champêtre qui marche et chante, v2.1.70 ; les insectes fuient les oiseaux, v2.1.69 ; le perce-oreille, mâles et femelles, qui menace, v2.1.68 ; le bourdon terrestre qui butine, v2.1.67 ; avec l'abeille à miel qui se pose pour butiner, v2.1.64, la grande sauterelle verte, mâles et femelles, v2.1.65, et l'anax empereur qui se perche sur les massettes, v2.1.66), tous faits comme des vrais (décision de Yo) : la piéride ; la fourmi, noire
  comme la fourmi des jardins, qui marche en deux trépieds ; la coccinelle à sept points, qui lève ses élytres pour
  s'envoler (v2.1.60, envoyée ; la vérification de GitHub a 15 minutes depuis la v2.1.61) ; leur taille dans l'ordre de la nature (v2.1.62 : fourmi 0,25 P, coccinelle 0,3 P, piéride 0,4 P). Les 8 autres de l'île gardent leur forme simple
  (`modele` dans `js/insectes.js`) ; les 7 de la forêt et les 4 du Marais aussi. Proposition de Claude, non codée : la piéride
  posée sur une fleur, les ailes refermées.
- La Scierie : le niveau 3 et « la Scierie qui vit » (fumée, scie qui bouge quand l'établi travaille, fenêtres la nuit,
  neige sur le toit) restent ; la roue à eau du niveau 2 tourne déjà.
- Les bâtiments agrandis : les 6 autres gardent l'ancien modèle agrandi (`ANCIEN` dans `batiments.js`) en attendant leurs images.
- Les fleurs de jardin (rose, tulipe, lavande, tournesol, capucine, cosmos) : en graines à l'étal du Marché, avec leur
  forme simple ; leurs modèles viendront avec leurs lieux.
- Les galets de l'étang et la marguerite : la marguerite est en réserve (`reserve` dans `FLEURS`).

## Pas commencé

- Les sons de la nature (étape 2.1, morceau 5) et la musique (Yo génère les morceaux avec Suno ; doc
  https://claude.ai/artifact/LWFge8j2WxeRZEdrv88mCe, fichiers attendus dans `C:\Users\Artefact\Desktop\Hearthwild\musiques\`).
- L'étape 2.3 (la Scierie dedans), 2.4 à 2.7.
- Les arbres de la forêt et du Marais d'après images (morceau 2d), la forêt et le Marais refaits.
- Les oiseaux et poissons de l'île d'après images ; ponton, pont, orée, entrée de la mine, chemins, coffre, lumières.
- Destinations suivantes (le Récif…), élevage, potions, champignons, fêtes.

## Limites et points à surveiller

- La fluidité sur le téléphone de Yo (Adreno 810) : mesurée bonne en v2.1.18 ; depuis, beaucoup de modèles détaillés
  (groseillier plein l'été environ 36 000 triangles, fleurs 10 000 à 21 000, Scierie niveau 2 environ 30 000) : le
  compteur de performance (toucher le numéro de version) le dira.
- Le premier dessin d'un insecte ou d'un oiseau qui apparaît coûte environ 6 ms (matières clonées pour s'estomper).
- Dans les endroits très boisés, le dessin (ombres comprises) reste le plus lourd.
- Deux doublons signalés à Yo, sans y toucher : l'épeire des jardins et l'araignée tisserande ; l'Entrepôt de la bible
  ferait le travail des coffres.
- Le lit de la Chaumière demande la Scierie au niveau 3 : les niveaux requis des recettes seront revus (Boîte à idées).
- `CLAUDE.md` et ces documents sont enregistrés et envoyés (commit `01d7f70`, 26 octobre 2026).
