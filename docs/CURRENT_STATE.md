# Hearthwild : l'état actuel (29 octobre 2026, v2.1.97)

## Ce qui marche (vérifié)

- Toute la phase 1 (étapes 1.1 à 1.13, sauf 1.12 reportée) : jouable et validée par Yo sur son téléphone.
- Étape 2.1 (le décor de l'île) : faite d'après les images de Yo (arbres de l'île, pierre, caillou, branche, herbes,
  groseillier, thym, galets, sol, plage, mer, étang, berge, 7 fleurs sauvages) ; restent les sons de la nature.
- Étape 2.2 (la Scierie dehors) : niveaux 1 et 2 faits (v2.1.46 à v2.1.50).
- Les pièces : toutes en terre battue et torchis clair au départ ; sols (case par case) et murs (mur par mur) fabriqués
  avec les bois de l'île et la pierre, posés dans « Décorer » (v2.1.102). Les icônes en photo des modèles refaits (v2.1.101).
- La caméra tourne à 360° autour du personnage (glisser un doigt ; la boussole la remet au nord), dehors, dans la
  forêt et le Marais (v2.1.99).
- Les 21 insectes et les 12 oiseaux de l'île refaits d'après les images de Yo, comme des vrais (v2.1.57 à v2.1.97 ;
  le détail plus bas).
- **Essais réellement faits pour la v2.1.97 (29 octobre 2026)** : la vérification complète sur le PC
  (`NAVIGATEUR=msedge node tests/verif.mjs`) : « Tout va bien » ; une photo de la cigogne dans le jeu (aperçu « jeu »).
  La v2.1.97 a été envoyée sur GitHub (commit `d754a08`) : vérification de GitHub **verte** (run `40844309073`,
  noté dans `.claude/verif-suivi.txt`). Les insectes et les oiseaux ne sont pas encore validés par Yo sur son téléphone.
- Carnet de bugs : aucune note ouverte sur GitHub au 29 octobre 2026.

## En partie fait

- Les insectes de l'île : 21 (v2.1.63 : le cloporte et l'épeire, qui ne sont pas des insectes, en réserve pour une future mise à jour, décision de Yo). D'après images : 21 sur 21, tous faits (le Grand Paon de nuit, mâles et femelles, sans trompe, qui tourne autour des lanternes et se pose ailes à plat sur les troncs, v2.1.82 ; la mante religieuse qui tourne la tête et menace, v2.1.81 ; la cigale grise sur l'écorce, qui chante, v2.1.80 ; la phalène d'hiver, le mâle qui flotte, la femelle sans ailes sur les troncs, v2.1.79 ; le sphinx du liseron, qui boit en sur-place, v2.1.78 ; le citron, mâles et femelles, toujours ailes fermées, v2.1.77 ; le vulcain, v2.1.76 ; le machaon, qui frémit des ailes posé, v2.1.75 ; le paon-du-jour, posé ailes fermées, qui montre ses yeux, v2.1.74 ; la luciole d'Italie qui vole et clignote, v2.1.73 ; la punaise verte plate, qui brunit avec la saison, v2.1.72 ; le hanneton qui compte ses sous avant de s'envoler, v2.1.71 ; le grillon champêtre qui marche et chante, v2.1.70 ; les insectes fuient les oiseaux, v2.1.69 ; le perce-oreille, mâles et femelles, qui menace, v2.1.68 ; le bourdon terrestre qui butine, v2.1.67 ; avec l'abeille à miel qui se pose pour butiner, v2.1.64, la grande sauterelle verte, mâles et femelles, v2.1.65, et l'anax empereur qui se perche sur les massettes, v2.1.66), tous faits comme des vrais (décision de Yo) : la piéride ; la fourmi, noire
  comme la fourmi des jardins, qui marche en deux trépieds ; la coccinelle à sept points, qui lève ses élytres pour
  s'envoler (v2.1.60, envoyée ; la vérification de GitHub a 15 minutes depuis la v2.1.61) ; leur taille dans l'ordre de la nature (v2.1.62 : fourmi 0,25 P, coccinelle 0,3 P, piéride 0,4 P). Les 7 de la forêt et les 4 du Marais gardent leur forme simple
  (`modele` dans `js/insectes.js`). Proposition de Claude, non codée : la piéride
  posée sur une fleur, les ailes refermées.
- Les oiseaux de l'île (12) : les règles d'abord (v2.1.83 : 4 à la fois au printemps et en été, 3 en automne et en hiver ;
  seuls les communs tant que le carnet compte moins de 3 oiseaux ; v2.1.86 : les moineaux volent seuls, plus de
  groupes) ; puis les modèles un par un d'après les images de Yo, comme des vrais : 12 sur 12, tous faits (la cigogne, qui claque du bec et plane le cou tendu, v2.1.97 ; le martin-pêcheur, qui plonge et ressort avec un poisson, v2.1.95 ; le rossignol, qui chante tête levée, v2.1.94 ; la chouette effraie, la tête qui tourne et la chasse lente, v2.1.93 ; le héron cendré, qui pêche un petit poisson, v2.1.92 ; l'hirondelle, qui chasse en boucles, v2.1.91 ; la mouette rieuse, capuchon l'été, qui plane, v2.1.90 ; la pie à la longue queue, qui marche à grands pas, v2.1.89 ; le merle, qui court, écoute et tire un ver, v2.1.88 ; le rouge-gorge, qui fait des courbettes, v2.1.87 ; la mésange charbonnière, la tête en bas et le vol ondulé, v2.1.85 ; le moineau
  domestique, mâles et femelles, v2.1.84).
- La Scierie : le niveau 3 fait d'après l'image de Yo (v2.1.104), sur un terrain de 5 × 5 (v2.1.103) ; « la Scierie qui vit » (fumée, scie qui bouge quand l'établi travaille, fenêtres la nuit,
  neige sur le toit) restent ; la roue à eau du niveau 2 tourne déjà.
- La Carrière : le niveau 1 fait d'après la nouvelle image de Yo (v2.1.106), à ciel ouvert, sur un terrain de 5 × 5 ; les niveaux 2 et 3
  attendent leurs images (prompts prêts dans `prompts.html`).
- Les bâtiments agrandis : les 5 autres gardent l'ancien modèle agrandi (`ANCIEN` dans `batiments.js`) en attendant leurs images.
- Les fleurs de jardin (rose, tulipe, lavande, tournesol, capucine, cosmos) : en graines à l'étal du Marché, avec leur
  forme simple ; leurs modèles viendront avec leurs lieux.
- Les galets de l'étang et la marguerite : la marguerite est en réserve (`reserve` dans `FLEURS`).

## Pas commencé

- Les sons de la nature (étape 2.1, morceau 5) et la musique (Yo génère les morceaux avec Suno ; doc
  https://claude.ai/artifact/LWFge8j2WxeRZEdrv88mCe, fichiers attendus dans `C:\Users\Artefact\Desktop\Hearthwild\musiques\`).
- L'étape 2.3 (la Scierie dedans), 2.4 à 2.7.
- Les arbres de la forêt et du Marais d'après images (morceau 2d), la forêt et le Marais refaits.
- Les poissons de l'île d'après images ; ponton, pont, orée, entrée de la mine, chemins, coffre, lumières.
- Destinations suivantes (le Récif…), élevage, potions, champignons, fêtes.

## Limites et points à surveiller

- L'optimisation de la fluidité (mission de Yo, 30 octobre 2026 ; point de retour `avant-optimisation-v2.1.106`) : audit fait, étape 1
  faite (v2.1.107 : le compteur amélioré, ⏱️ 2 min / 5 min, quantiles, carte graphique, mémoire) ; étape 2 faite (v2.1.108 :
  chaque sommet gardé une seule fois ; le fond de la mer essayé et abandonné, sans gain ; mesuré par Yo : 11,9 % d'images en
  retard au lieu de 20,9 %) ; étape 4 faite (v2.1.109 : les bêtes préparées au chargement, les programmes d'un lieu compilés
  sous le noir du fondu) ; restent, chacune avec l'accord de Yo : 3. la place des objets immobiles calculée une fois,
  5. moins d'objets jetés en mémoire (détail : DEVELOPMENT_HISTORY.md, v2.1.107 à v2.1.109).
- La fluidité sur le téléphone de Yo (Adreno 810) : mesurée bonne en v2.1.18 ; depuis, beaucoup de modèles détaillés
  (groseillier plein l'été environ 36 000 triangles, fleurs 10 000 à 21 000, Scierie niveau 2 environ 30 000) : le
  compteur de performance (toucher le numéro de version) le dira.
- Le premier dessin d'un insecte ou d'un oiseau qui apparaît coûte environ 6 ms (matières clonées pour s'estomper).
- Dans les endroits très boisés, le dessin (ombres comprises) reste le plus lourd.
- Deux doublons signalés à Yo, sans y toucher : l'épeire des jardins et l'araignée tisserande ; l'Entrepôt de la bible
  ferait le travail des coffres.
- Le lit de la Chaumière demande la Scierie au niveau 3 : les niveaux requis des recettes seront revus (Boîte à idées).
- `CLAUDE.md` et ces documents sont enregistrés et envoyés (commit `01d7f70`, 26 octobre 2026).
