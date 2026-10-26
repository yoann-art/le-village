# Hearthwild : l'architecture technique

À lire avant de toucher à un système. Le code fait foi ; chaque fichier commence par un commentaire qui dit son rôle.

## La pile

- three.js **r128**, chargé depuis cdnjs comme variable globale `THREE` (`index.html`, ligne `<script src=…three.min.js>`).
- Modules JavaScript natifs (`import`/`export`), **sans compilation ni npm** pour le jeu. `node_modules/` ne sert qu'à
  Playwright pour la vérification (ignoré par git).
- Page unique `index.html`, style `css/style.css`, polices Google (Alegreya Sans, Pirata One).
- Application installable : `manifest.webmanifest`, `sw.js` (service worker qui redemande tout au serveur), `icones/`.
- Serveur local obligatoire : configuration « jeu » de `.claude/launch.json` → `python .claude/serveur.py`, port 8000, sans cache.
- Hébergement : GitHub Pages, dépôt public `yoann-art/le-village`, branche `main`, racine.

## Le démarrage et la boucle (`js/main.js`)

1. Imports dans un ordre qui compte : `miseajour.js` d'abord (recharge si une nouvelle version est en ligne), puis
   `verification.js`, `pleinecran.js`, puis le décor dans l'ordre où il est posé (scène, île, bâtiments, personnage…).
2. `sauvegarde.js` lit la partie dans `localStorage` (clé `le-village-v2-ile`, format `v: 4`) et fait les migrations
   (île agrandie `agrandirIle`, bâtiments agrandis, doubles démontés…).
3. `preparer` (scene.js) dessine toute la scène une fois dans une image de 4 × 4 pixels : formes envoyées et shaders
   compilés avant la première marche.
4. `tick` (requestAnimationFrame) relance d'abord l'image suivante, puis appelle chaque système dans `garde(nom, f)` :
   une erreur est écrite dans la console et montrée une fois à l'écran, **elle ne fige jamais le jeu** ; chaque morceau
   est chronométré pour le compteur de performance. Ordre : marche → portes → caméra (+ météo, ciel, lumière du lieu) →
   plans de travail, coffre, vitrine → barque, voyage, Marais → lumières → récolte (bouton d'action, bêtes, pêche…) →
   torche → combat → chemins → vent → champ de la caméra (`montrerChamp`) → dessin → mains (première personne) →
   compteur → sauvegarde toutes les 2 s si quelque chose a changé.
5. Si le téléphone retire le contexte WebGL (`webglcontextlost`), la partie est gardée et la page se recharge.

## Les modules

**Fondations** : `version.js` (le numéro, lu par la mise à jour : garder la ligne `export const VERSION = "…";`),
`miseajour.js`, `verification.js` (au démarrage), `outils.js` (petits outils), `donnees.js` (**tous les chiffres et
contenus** : bâtiments `B`, ressources, `PRODUITS`, `OUTILS`, `ATELIERS`, `RECOLTE`, `GRAINES`, `FLEURS`, `POISSONS`,
`INSECTES`, `OISEAUX`, `GIBIER`, `MONSTRES`, saisons `saisonDu`…), `regles.js` (coûts, niveaux, bonus, ce qu'on possède :
`owned`, `sacAdd`, `sacTake`, `hasAll`…), `sauvegarde.js` (`state`, `save`).

**Interface et commandes** : `interface.js` (HUD, panneaux, messages), `commandes.js` (joystick, clavier, zoom `view`),
`barre.js` (cases rapides, main droite), `sac.js` (sac, coffres, carnet), `station.js` (météo à l'écran),
`saisons.js` (hémisphère), `pleinecran.js`, `vue.js` (première personne), `performance.js` (compteur).

**Lieux** : `lieux.js` (entrer, sortir, fondu, `currentScene`, `checkDoors`, `allerA`, `retourIle`) ;
`monde/scene.js` (renderer, caméra, scène de l'île, soleil, `preparer`, programmes gardés) ;
`monde/interieurs.js` (la scène des intérieurs : pièces, mine, forêt, grotte, Marais, via `buildRoom`).

**Le monde 3D** (`js/monde/`) : `formes.js` (boîte à outils commune : `toon`, `DEGRADE`, `fusionner`, `rassembler`,
`formeUnie`, `feuillageMat`, `VENT`) ; `ile.js` (la carte `map`, `genMap`, le sol d'un seul tenant, l'eau, `setObj`,
`montrerChamp`) ; `series.js` (petites choses lointaines en `InstancedMesh`) ; `ciel.js`, `meteo.js` ;
les arbres `chene.js` (outils partagés : `tronc`, `feuillageDe`, `presLoin`, `petitALEcran`…), `pommier.js`, `pin.js`,
`bouleau.js`, `essences.js` (forêt et Marais) ; le décor `pierre.js`, `branche.js`, `herbes.js`, `groseillier.js`,
`thym.js`, `galets.js`, `berge.js`, `sol.js`, `semis.js` ; les fleurs `fleurs.js` (formes simples) et un fichier par
fleur refaite (`paquerette.js`, `pissenlit.js`, `coquelicot.js`, `bleuet.js`, `perceNeige.js`, `violette.js`,
`muguet.js`) ; `batiments.js` (`BUILD`, `placeMesh`, `NOUVEAUX`) et `scierie.js` (niveaux 1 et 2) ; `meubles.js`,
`chemins.js`, `ponton.js`, `mine.js`, `rochers.js`, `foret.js`, `grotte.js`, `marais.js` ; `personnage.js`
(`player`, `updatePlayer`, `devant`, `frontTile`, `degager`), `outils3d.js`, `mains.js` ; `insectes3d.js`
(`MODELES_INSECTES`, les insectes refaits d'après les images).

**Gameplay** : `construire.js`, `decorer.js`, `deplacer.js`, `ateliers.js`, `coffres.js`, `vitrine.js`, `lumieres.js`,
`recolte.js` (le bouton d'action `#btn-act` : `target`, `actionOf`, `nomCible`), `terraformer.js`, `usure.js`,
`torche.js`, `peche.js`, `insectes.js`, `oiseaux.js`, `chasse.js`, `combat.js`, `monstres.js`, `entreeMine.js`,
`barque.js`, `voyage.js`.

## Les flux de données

- **Un seul état** : `state` (sauvegarde.js), écrit dans `localStorage`. Ce que le joueur a changé sur l'île est dans
  `state.ile = {case: {o, …}}`, `state.terrain`, `state.chemins`, `state.sol` ; la nature sauvage est **retirée de la
  graine** `state.seed` à chaque chargement (`genMap`) : changer `genMap` change la nature des parties en cours.
- **Le contenu** vient de `donnees.js` ; les modèles le lisent, les règles le comptent.
- **Le temps** : tout suit la vraie horloge (`heure()`, `saison()`, `meteo()`), avec des fonctions `forcer…` pour les essais.
- **Un objet de l'île** : `map.obj[i]` → un modèle par case (`ile.js`, `setObj`), refait quand son aspect change
  (saison, neige, état) ; les modèles sont **partagés** par clé (stade, saison, nuance, neige).
- **Un insecte, un oiseau, un poisson** : créés autour du personnage, dans la scène du lieu (`sceneIci`), puis retirés.

## Le rendu et la performance

- Matières : `toon()` partout (MeshToonMaterial et un dégradé de trois marches) ; l'eau en Phong avec `onBeforeCompile`.
- Un modèle = une forme aux couleurs par sommet (`fusionner`) partagée ; le vent est fait dans le shader (`feuillageMat`).
- Seul ce qui est dans le champ de la caméra est dessiné (`montrerChamp`, carrés de 8 × 8 cases), jusqu'au bout du
  brouillard ; modèles légers au loin (`presLoin`, `petitALEcran` : moins de 24 pixels à l'écran) ; à la première
  personne, les petites choses lointaines en série.
- Les programmes de dessin sont gardés toute la partie ; la police est préparée au chargement.
- Le détail des causes et des mesures : [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md).

## Les essais

- `tests/verif-page.js` : une suite de gestes joués dans la page (partie neuve obligatoire) ; `tests/verif.mjs` : la lance
  dans un navigateur sans écran (Playwright), puis rouvre en paysage ; écrit les annotations de GitHub et `capture.png`.
- `.github/workflows/verification.yml` : à chaque envoi sur `main` (Chromium, Playwright 1.47.2, Node 22).
- Sur le PC : serveur « jeu » lancé, `NAVIGATEUR=msedge node tests/verif.mjs` (environ 8 minutes ; le Chromium de
  Playwright ne démarre pas sur ce PC, Edge oui).

## Annexe : le texte complet (déplacé de l'ancien CLAUDE.md, le 26 octobre 2026)

Note : écrit au fil des séances. « `git push` est bloqué pour Claude » et « l'envoi est lancé par Yo » sont dépassés : depuis, Claude envoie lui-même après le « Oui, envoie » de Yo (voir CLAUDE.md).

### Organisation du code

- three.js r128, chargé depuis cdnjs comme variable globale `THREE`. Pas d'outil de compilation : modules JavaScript natifs (`import`/`export`), lus tels quels par le navigateur.
- Conséquence : le jeu ne s'ouvre pas par double-clic sur `index.html`, il faut un serveur. En local : configuration « jeu » de `.claude/launch.json` (http://localhost:8000), qui lance `.claude/serveur.py` (serveur sans mémoire cache, pour toujours voir la dernière version).
- Mesures : 1 case du sol = 1 P = 1 unité 3D (`P` dans `js/monde/formes.js`). L'île fait 96 × 96 cases (40, puis 56 avec Yo le 1er octobre 2026, puis 96 le 14 octobre 2026 : voir « L'île agrandie » à l'étape 2.1 ; `N` dans `ile.js`). Bâtiments : un seul de chaque sorte, qu'on améliore jusqu'au niveau 3, le Château aussi (demande de Yo, v1.10.2 : `dejaBati` dans `construire.js`) ; 3 × 3 P (Chaumière, Scierie, Carrière, Forge) ou 4 × 4 P (Marché, Taverne, Château), murs de 2 P, porte de 1,5 P sur la façade tournée vers le bas de l'écran (décalage de la porte : `door` dans `donnees.js`). La case devant la porte (`doorTile` dans `regles.js`) reste toujours libre : on ne peut pas poser un bâtiment qui la bloquerait ou qui bloquerait celle d'un autre, et rien n'y pousse. Arbres 3 à 4 P, jamais collés ; rochers ½ à 1 P. Place du village : ni arbre ni rocher à moins de 9 cases du centre (retirés après coup dans `genMap`, pour ne pas redistribuer le reste de l'île).
- Décoration : `js/decorer.js` (mode décoration, catalogue, doigt, alignement `snap`/`settle`, appui long sur un meuble hors décoration `lift`/`updateLift`, règles de place), `js/monde/meubles.js` (modèles des meubles, `footOf`, `meubleAt`), `MEUBLES` dans `donnees.js` (gabarit, taille au sol w × d, `flat` pour les tapis). La déco d'une pièce est dans le bâtiment : `b.deco = {items:[{id, type, x, z, rot, color?}], next, wall?, floor?}`, positions en P depuis le milieu de la pièce, rot en quarts de tour, couleurs = clés de `COULEURS` (`donnees.js`, palette gratuite ; absente = d'origine). Chaque meuble a une partie principale qui prend la couleur (`ORIGIN` dans `meubles.js`). Les meubles s'alignent toujours (grille de ½ P, collés aux murs) : plus d'aimant. Ce que touche le doigt : `aim` et `groundAt` dans `scene.js`.
- Plans de travail : `js/ateliers.js` (bouton quand on est tout près, fiche, file d'attente en temps réel `b.atelier.queue = [{out, n, in, t, start, end}]` enchaînée par `chain`, livraison dans la réserve par `livrer` chaque seconde et au démarrage). `ATELIERS`, `PRODUITS` et `FABRIQUE_A` dans `donnees.js` ; le plan de travail est un meuble `plan:true`, construit avec des ressources (`cost` dans `ATELIERS`) depuis le haut du catalogue de décoration (`planHTML` et `addMeuble` dans `decorer.js`) ; `hasPlan` (`monde/meubles.js`) dit s'il est construit. Ce qu'on possède (demande de Yo, v1.5.5) : l'or dans la bourse (`state.res.or`) ; tout le reste dans le sac (`state.sac`), les 3 cases rapides (`state.barre = [{k, n} ou null]`, en plus du sac, v1.7.6) et les coffres de réserve (`state.coffres = [{id, i, items}]`, `js/coffres.js`), y compris ce que contiennent les coffres remplis (`{k: "coffrePlein", n: 1, id, items}`, v1.7.8). Les fonctions `sacCount`, `sacAdd`, `sacTake`, `sacPlace` comptent le sac et les cases rapides ensemble (`porte()`). On fabrique et on construit avec le sac et les coffres ensemble (`owned`, `addOwned` qui renvoie `{sac, coffre, reste, bourse}`, `hasAll`, `placeFor`, et les emplacements `slotsAdd`, `slotsTake`, `slotsPlace` dans `regles.js`). Ce qui sort d'un plan de travail va dans le sac, sinon dans un coffre ; s'il n'y a de place nulle part, c'est prêt mais ça attend au plan de travail. Il n'y a plus de « réserve » à part (`state.stock` vidé une fois dans un coffre : `state.coffresPrets`).
- Dehors et dedans : `js/lieux.js` (entrer en marchant dans la porte, sortir par le paillasson, fondu au noir, caméra, position sauvegardée devant la porte) et `js/monde/interieurs.js` (la pièce, dans sa propre scène 3D). Le personnage passe d'une scène à l'autre ; sa règle de marche change avec `setWalkable`.
- `js/main.js` relie tout et fait tourner la boucle. Depuis la v1.9.7 (bug de Yo : le jeu figé après avoir replanté une fleur, pas reproduit sur le PC), chaque morceau de la boucle est gardé à part (`garde`) et la boucle repart en premier : une erreur ne fige plus jamais le jeu ; elle est écrite dans la console (la vérification la voit) et montrée une fois à l'écran (« ⚠️ Erreur du jeu (…) : … Dis-le à Claude »), aussi pour les erreurs des boutons (`signaler`). Et si le téléphone retire l'affichage 3D au jeu (`webglcontextlost` : l'image se fige pour de bon), la partie est gardée et la page se recharge toute seule. La vraie cause du bug, trouvée grâce à la capture de Yo (v1.9.8) : le long message du bouton d'action (« Jeune tulipe : elle sera grande dans 2 h 37, et fleurira au printemps ») faisait déborder le bouton sur le joystick, et le doigt touchait le bouton au lieu du joystick. Désormais, un bouton de la colonne de gauche ne dépasse jamais `100vw - 182px` (un long texte passe sur deux lignes, `.actions .act` dans `style.css`), le joystick est au-dessus (z-index 3), les messages des fleurs sont courts, et les durées gardent leurs espaces insécables (« 2 h 59 » sur une ligne). La vérification essaie un bouton au long texte à côté du joystick. L'ordre de ses `import` compte : `miseajour.js` en tout premier, puis `verification.js`, puis le décor dans l'ordre où il est posé.
- Toujours la dernière version : `sw.js` (service worker à la racine) redemande chaque fichier du site au serveur (`cache: "no-cache"`) ; `js/miseajour.js` l'enregistre et, quand on revient sur le jeu resté ouvert, recharge la page si le numéro de `js/version.js` en ligne a changé (une seule fois par version). Garder la ligne `export const VERSION = "…";` telle quelle : elle est lue par ce contrôle.
- `js/donnees.js` : les chiffres réglables (ressources, bâtiments, objets, recettes, récolte). `js/regles.js` : coûts, niveaux, bonus, ce qu'on possède. `js/sauvegarde.js` : partie gardée dans le navigateur (clé `le-village-v2-ile`, format v4 ; une partie plus ancienne repart de zéro, avec un message ; plus aucune reprise d'ancienne partie).
- `js/monde/` : la 3D. `formes.js` est la boîte à outils commune (matières, formes) : c'est là que viendra l'ombrage toon de la Scierie pour tous les modèles.
- Récolte sur l'île : `js/recolte.js` (bouton d'action `#btn-act` selon ce qui est devant : `actionOf` ; arbre « Couper », coups, chute, graine ; herbes « Cueillir » puis « Arracher » ; buisson « Cueillir les baies », « Arroser », hache en main « Couper le buisson » ; une graine en main : « Planter » ; par terre : « Ramasser »). Herbes hautes (`herbe`, on les traverse, un bâtiment posé dessus les enlève) et buissons (`buisson`) ajoutés après la création de la carte avec leur propre tirage (`ile.js`), pour ne pas déplacer arbres et rochers ; leur état dans `state.ile` (`coupe`, `vide`, `arrose`, via `setEtat`) ; modèles refaits quand leur aspect change (`lookOf`). Au sol : `js/monde/sol.js` (morceaux de bois près des arbres, petits cailloux ; `state.sol = {case: sorte}`, `state.solT` ; décidé avec Yo le 12 octobre 2026 : le premier jour de la partie (`state.solDebut`, la date), 24 morceaux de bois et 12 cailloux (`SOL[…].debut`), il en revient un de chaque toutes les `SOL_RETOUR` secondes ; ensuite, une fois par jour quand la date change (`state.solJour`), 3 à 6 de chaque (`SOL_JOUR`), 12 au plus au sol (`SOL[…].max`) ; une partie commencée avant a passé son premier jour ; 1 bois par morceau ; `SOL` dans `donnees.js`). Ce que le joueur a changé sur l'île : `state.ile = {case: {o, plante?}}`, appliqué sur la carte au chargement (`js/monde/ile.js` : un modèle par case, `setObj`, `growth`, étapes de pousse vérifiées toutes les 10 s). `GRAINES`, `RECOLTE` et `objet(k)` dans `donnees.js` ; `gain` (bonus des bâtiments, part décimale = chance), `sacTake` dans `regles.js`.

### Vérification automatique et carnet de bugs (mis en place avec Yo le 2 octobre 2026, gratuit)

- À chaque envoi sur `main`, GitHub lance `.github/workflows/verification.yml` : un navigateur sans écran (Playwright) ouvre le jeu à la taille d'un téléphone et joue les gestes de base de `tests/verif-page.js` (partie neuve, ramasser, marcher, les saisons, la météo et la station, ce que le temps change, sac, bâtir la Scierie, pas de deuxième Scierie, y entrer, établi, l'améliorer (son allure change), planches, couper un arbre (une ressource par coup), l'usure (un outil s'use, puis se casse), la hache selon l'essence (le frêne demande une hache en cuivre, le chêne séculaire une hache en bronze), le Gardien d'écorce (au fond du troisième palier, ses racines évitées d'une roulade, la carte du Marais), les mains (l'épée restée dans le sac ne frappe pas ; l'arc pose la torche au sol, vainc un loup et rend sa flèche ; la torche se reprend), la barque (la construire au bout du ponton, ramer au large, y pêcher le thon en moulinant, accoster), le voyage (vers le Marais brumeux avec sa carte, la scène qu'on passe, le retour au bout du ponton), le Marais brumeux (ses passerelles, couper un cyprès, l'eau de brume au bocal, une rose des brumes, le chou-lune la nuit, la torche qui s'allume quand il y fait sombre), la vie du Marais (une araignée d'eau et un canard colvert au filet, un poisson-chat, un ragondin à l'arc), la grotte du Marais (le Puits aux Brumes, une poche de gaz, un crapaud-poison, l'Hydre des brumes et ses têtes qui repoussent, la carte du Récif), le sac qui s'agrandit (la toile, le sac de cuir), le bois et les cailloux au sol (24 morceaux de bois au départ, puis 3 à 6 de chaque par jour), les lumières (le suif et la chandelle, la pénombre, une torche sur la torchère, le feu de camp dehors, une lanterne murale sur une façade qui s'allume seule la nuit, la lanterne à main dans la grotte), les outils en cuivre et en bronze (un filet qui attrape de plus loin, un arrosoir qui arrose plusieurs buissons, le fil de la canne en bois qui casse sur un légendaire), les flèches à pointe de métal (plus sûres, la même flèche revient), mine, pêcher depuis la plage et depuis le ponton, cueillir le thym, le carnet de pêche, les ingrédients du poisson grillé, vendre au comptoir et l'étal de graines du Marché, les pierres (ouvrir une géode, la page du carnet, la vitrine, le Cœur de la mine), attraper un insecte et un oiseau au filet, une luciole au bocal, aller dans la Forêt profonde et y couper un arbre, la grotte, le combat contre un loup et une chauve-souris, le sanglier de la forêt, creuser et combler à la pelle, tracer un chemin en marchant et l'enlever, cueillir une fleur, la déterrer et replanter sa graine, le jour et la nuit, la vue à la première personne (la caméra aux yeux, le doigt qui tourne la tête, avancer là où l'on regarde, le joystick qui tourne la vue, viser ce qu'on regarde avec le point au centre, les mains qui tiennent la hache et la torche, décorer en vue de dessus), le bouton d'action qui dit le nom de ce qu'on vise (« 🌳 Chêne », rien sans hache en main), la pierre des champs (« 🪨 Pierre des champs », sa mousse, l'herbe de son pied selon la saison, pas d'herbe sur le sable), le petit caillou (son modèle, son herbe), la branche de chêne au sol (son modèle, ses feuilles de la saison), les herbes hautes (une touffe de la saison, cueillie puis rase), le groseillier (ses grappes, son nom, cueillir des groseilles, puis ses grappes vides), ce qu'il y a sur l'île au départ (les nombres choisis avec Yo, les 8 fleurs sauvages en taches, pas les fleurs de jardin, les galets de plage sur le sable), la nature qui se ressème (le thym qui revient sans dépasser son nombre de départ, une fleur arrosée qui sème une voisine), le thym (en fleurs l'été, cueilli il quitte sa place, en boutons au printemps, sans fleurs l'hiver), l'ombrage jouet (tous les modèles en aplats), le chêne aux quatre saisons et sa souche, le pommier (ses saisons, ses pommes, son bois, sa souche), le pin sylvestre (près des plages, toujours vert, son bois, sa souche), le bouleau (au bord de l'eau douce, nu en hiver, son bois, sa souche), le sol d'un seul tenant (les cases de terre à plat, l'eau dessous, plus de damier, la plage mouillée, l'écume du rivage, la berge de l'étang, ses galets et ses plantes), l'île agrandie (96 × 96, le ponton et le pont dans la mer, une partie d'avant gardée), le compteur de performance (il s'allume en touchant la version, son rapport), la fluidité (le tri de la caméra par carrés donne le même résultat qu'avant, le thym et les fleurs d'un seul morceau, les programmes de dessin gardés, les boules d'ombre hors de l'image, la carte graphique préparée), les petits objets visibles dès qu'ils sont à l'écran (en avançant vers un groupe de fleurs, d'herbes et de pierres, vu de dessus, dézoomé et aux yeux ; les lointains en série aux yeux), ne jamais rester coincé) ; toute erreur du jeu fait une croix rouge (`tests/verif.mjs`, capture d'écran gardée). Ajouter un geste à `verif-page.js` à chaque nouvelle fonction importante. Elle refuse de tourner sur une partie déjà commencée. Essai local : sur une partie neuve, dans la console, `(await import("/tests/verif-page.js")).verifier()` ; mais l'aperçu caché met le jeu en pause, alors que sur GitHub il tourne pendant l'essai : pour refaire exactement la vérification de GitHub, serveur « jeu » lancé, `NAVIGATEUR=msedge node tests/verif.mjs` (Playwright installé dans `node_modules`, ignoré par git ; son propre Chromium ne démarre pas sur ce PC, Edge oui). La vérification met les insectes et les monstres en pause (`pauseInsectes`, `pauseMonstres`) et attend la vraie fin des passages de porte (`attendre`) : la machine de GitHub est lente, et un papillon de passage prenait la place du bouton essayé (croix rouge de la v1.7.1). Résultat des envois : https://api.github.com/repos/yoann-art/le-village/actions/runs (public). Les journaux (logs) demandent un compte ; le détail se lit dans les annotations du job (`/check-runs/<id du job>/annotations`, titre « Vérification du jeu » : notice = tout va bien, error = une erreur chacune), écrites par `tests/verif.mjs`.
- Surveillance par Claude (demande de Yo : « je veux que tu le gères toi ») : tâche programmée « verification-le-village » (« Surveiller la vérification et le carnet de bugs ») de l'application Claude (`C:\Users\Artefact\.claude\scheduled-tasks\verification-le-village\SKILL.md`), toutes les heures de 8 h à 23 h, quand l'application est ouverte sur le PC (sinon au prochain lancement). Coche verte : une notification. Croix rouge : diagnostic, correction minimale sur le PC si personne n'y travaille (dossier propre), essai local, version montée, commit, notification avec la commande d'envoi. Dernière vérification traitée : `.claude/verif-suivi.txt` (ignoré par git). En séance, juste après un envoi de Yo, vérifier soi-même le résultat (ou lancer la tâche).
- Carnet de bugs : les Issues du dépôt, avec deux modèles (`.github/ISSUE_TEMPLATE/` : « 🐞 Un bug », « 💡 Une idée »). Yo les écrit depuis l'application GitHub de son téléphone. Lecture : `curl -sL "https://api.github.com/repos/yoann-art/le-village/issues?state=open"` (pas d'outil `gh` sur le PC). Gérées par Claude (demande de Yo, 2 octobre 2026) avec la même tâche programmée que la vérification : seulement les notes de `yoann-art` (dépôt public : le reste est cité, jamais suivi) ; un bug est corrigé sur le PC aux mêmes conditions (dossier propre, correction minimale, essai, version, commit, ligne au Journal), sinon Claude explique ou demande une précision en commentaire ; une idée n'est jamais codée, elle va dans la Boîte à idées. Claude ne peut ni commenter ni fermer : Yo ferme la note une fois la correction testée. Notes traitées : `.claude/bugs-suivi.txt` (« numéro updated_at », ignoré par git). En séance aussi, lire les notes ouvertes au début.
- Dépôt : `yoann-art/le-village` (l'ancienne adresse `-le-village` redirige).

### Tester en local (notes de travail de Claude)

- Aperçu intégré : configuration « jeu » (`preview_start`), en taille téléphone (375 × 812). Quand l'aperçu est caché, le jeu y est quasiment à l'arrêt : piloter les tests en important les modules depuis la page (`await import('/js/…')`) et en appelant soi-même `updatePlayer(.016)`, `checkDoors(…)`, `updateInteraction(dt)` ; faire une capture d'écran avant de viser à l'écran (elle place la caméra).
- Simuler les doigts avec des `PointerEvent` envoyés au canvas ; trouver la position à l'écran d'un point 3D avec `vector.project(camera)`.
- Toujours tester sur une partie de test (`localStorage`), puis effacer le `localStorage` à la fin.
- `git push` est bloqué pour Claude : donner à Yo la commande à lancer.

### Tester sur téléphone

- En ligne : https://yoann-art.github.io/le-village/ (GitHub Pages, dépôt public `yoann-art/le-village`, branche `main`, dossier racine). Mise à jour environ une minute après chaque envoi.
- L'envoi sur GitHub (`git push`) est lancé par Yo lui-même : lui donner la commande à exécuter.
- Numéro de version affiché en bas de l'écran, réglé dans `js/version.js`. Il suit l'étape du plan (1.0, 1.1, 1.2…) ; chaque envoi en cours d'étape ou correction ajoute un chiffre (1.1.1, 1.1.2…). Le changer avant chaque envoi : c'est lui qui déclenche le rechargement automatique sur le téléphone de Yo.
