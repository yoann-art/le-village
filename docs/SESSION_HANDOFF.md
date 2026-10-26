# Passation de séance (26 octobre 2026, fin de journée)

## Où on en est

- Version en ligne : **v2.1.59** (commit `165e3ac`), envoyée sur GitHub avec l'accord de Yo le 26 octobre 2026
  (run de vérification `40277249010`, noté dans `.claude/verif-suivi.txt`).
- Dernière tâche : **la fourmi d'après l'image de Yo**, deuxième des 23 insectes de l'île. Son image était rousse ;
  Claude a signalé que la fourmi du jeu (« Elle marche en file indienne ») est la fourmi noire des jardins ; Yo :
  « Garde la fourmi noire des jardins (même forme que mon image, mais noire) » (v2.1.58). Puis, à sa demande, elle
  marche en deux trépieds qui se relaient (v2.1.59). Yo n'a validé ni la fourmi ni la piéride sur son téléphone.
- Comparaison et animation : `C:\Users\Artefact\Desktop\Hearthwild\images\insectes\fourmi-comparaison.png` et
  `fourmi-marche.gif`.

## Les derniers fichiers modifiés

- Jeu (enregistré, envoyé) : `js/monde/insectes3d.js` (`fourmiModele` : le corps et deux trépieds, `userData.pattes`,
  `userData.pas`), `js/insectes.js` (dans `vivre` : les pattes qui marchent, `b.foule`, `b.marche`),
  `tests/verif-page.js` (la fourmi : six pattes, deux trépieds qui marchent), `js/version.js` (2.1.59).
- Hors du dépôt : `outils-claude\insecte.mjs` accepte maintenant `OUT`, `ADRESSE` (un autre port) et `VUES` (les caméras,
  en JSON).

## À faire en premier dans la nouvelle séance

1. `git status` : le dossier doit être propre (rien en cours).
2. Le port 8000 : le 26 octobre, deux anciens `serveur.py` d'anciennes séances le gardaient et montraient l'ancien jeu ;
   Claude n'a pas eu le droit de les arrêter et a travaillé sur une copie servie au port 8002 (configuration temporaire,
   retirée ensuite de `launch.json`). Yo redémarre l'ordinateur : vérifier que le port 8000 montre bien ce dossier.
3. Lire le résultat de la dernière vérification de GitHub (`https://api.github.com/repos/yoann-art/le-village/actions/runs`)
   et les notes ouvertes du carnet de bugs (`/issues?state=open`, seulement celles de `yoann-art`).
4. Attendre Yo : son avis sur la piéride et la fourmi, puis l'image de l'insecte suivant (« Voici le … »).

## Pour refaire un insecte (la méthode qui a marché)

1. Ranger l'image de Yo : `C:\Users\Artefact\Desktop\Hearthwild\images\insectes\<nom>.png` (l'application garde une
   copie de ses images dans le dossier `images` de la séance).
2. Dans `js/monde/insectes3d.js` : un corps fusionné (`fusionner`, `boule`, `baton`), tête vers −z ; ailes plates
   `aileGeo(contour, cote, boîte)` peintes par `peinture(boîte, dessin)` (CanvasTexture), deux maillages par côté sur un
   pivot ; `userData.ailes = [{pivot, cote}]` ; l'ajouter à `MODELES_INSECTES` avec son `echelle`. Un insecte sans
   ailes doit quand même avoir `userData.ailes = []` : `insectes.js` les parcourt à chaque image sans test.
3. Rendu : `outils-claude/insecte.mjs` (changer son dossier de sortie), comparer à l'image, recommencer jusqu'à ce que
   ce soit au plus près ; une photo dans le jeu (aperçu « jeu », `lacherInsecte(k, x, z, y)` depuis la page, heure
   forcée à midi avec `forcerHeure(13)` de `js/monde/ciel.js`) ; assembler la comparaison.
4. Un contrôle dans `tests/verif-page.js` (étape « Attraper un insecte »), version dans `js/version.js`, une ligne dans
   `docs/DEVELOPMENT_HISTORY.md` ; `NAVIGATEUR=msedge node tests/verif.mjs` jusqu'à « Tout va bien » ; commit ;
   envoyer la comparaison à Yo ; demander « Oui, envoie » ; après l'envoi, surveiller GitHub et noter le run.

## Points qui demandent l'accord de Yo

- L'ordre des chantiers après les insectes (voir [NEXT_STEPS.md](NEXT_STEPS.md)).
- *(proposition de Claude)* la piéride posée les ailes refermées.
- *(proposition de Claude, pas encore faite à Yo)* les pattes qui marchent pour les autres insectes qui marchent.

## Fichiers à lire selon la tâche

- Toujours : `CLAUDE.md`, ce fichier, [CURRENT_STATE.md](CURRENT_STATE.md).
- Un modèle d'après image : `js/monde/formes.js`, le modèle le plus proche déjà fait (`insectes3d.js`, une fleur, `scierie.js`).
- Un système de jeu : [ARCHITECTURE.md](ARCHITECTURE.md), puis chercher son nom dans [DEVELOPMENT_HISTORY.md](DEVELOPMENT_HISTORY.md).
- Rendu, performance, sauvegarde : [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md).
- Game design, contenu, règles complètes de Yo : [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
