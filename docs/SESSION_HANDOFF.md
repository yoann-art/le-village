# Passation de séance (16 novembre 2026)

## Où on en est

- Version en ligne : **v2.1.253** (commit `aee8564`, puis l'historique `daf2902`), envoyée avec l'accord de Yo ; vérification
  de GitHub **verte** (run `43812987814`, « Tout va bien : 98 gestes réussis », noté dans `.claude/verif-suivi.txt`).
- La séance du 11 au 16 novembre 2026 (v2.1.218 à v2.1.253) a fini **tous les objets de l'île** (décoration, objets du
  dehors, plans de travail des 7 bâtiments) et **les 7 bâtiments de niveau 2**, puis a commencé **les outils**.
- Chaque étape a son entrée dans `DEVELOPMENT_HISTORY.md` (chercher la version, par exemple « v2.1.246 »).

## La suite : le chantier des outils (mémoire `chantier-outils`)

1. **La hache en pierre** d'après l'image de Yo, déjà reçue : `C:\Users\Artefact\Desktop\Hearthwild\images\outils\hache-pierre.png`
   (manche de bois orange courbe au bout arrondi, lame de pierre à facettes aux deux pointes en crochet, deux bandes de cuir
   croisées et trois tours de cuir). Le dernier message de Claude avant la passation proposait de la faire tout de suite ou
   d'attendre les autres images : **demander à Yo**.
2. Les autres outils : Yo génère leurs images avec les prompts de l'onglet **Outils** de `prompts.html` (34 prompts `outm-…`,
   en tête de l'onglet : hache, pioche, pelle, arrosoir, canne, filet, bocal, épée, flèches, en pierre ou bois, cuivre,
   bronze ; le fer et l'obsidienne plus tard). Une forme propre à chaque matière, la même d'une matière à l'autre.
3. Les modèles d'outils : `js/monde/outils3d.js` (`BUILD[famille](g, o, w)`) ; **le manche se colore avec `w`**, l'essence
   choisie en fabriquant (v2.1.253 : `aUnManche`, `teinteManche`, `state.manches`, `choisirManche` dans `ateliers.js`).
   Les flèches n'ont pas encore la couleur de leur bois (à faire avec leur modèle). Chaque outil : la comparaison avec
   l'image de Yo, une photo dans la main du personnage (de dos), ses triangles (toujours à l'écran).
4. Ensuite, si Yo le veut : **les bâtiments de niveau 3** (la Scierie 3 existe ; les six autres attendent leurs images).

## Les règles de Yo apprises dans cette séance (toutes en mémoire)

- **Repérer les détails seul** (mémoire `reperer-les-details-seul`) : avant de montrer un modèle, le comparer à l'image de Yo
  et passer la liste de contrôle (rien en morceaux, rien qui flotte ou traverse, tout droit, aucun trou, récipient plein,
  le personnage se pose dessus, comme dans la vraie vie) ; dire les écarts qui restent. Yo l'a demandé après avoir dû
  signaler beaucoup de défauts.
- **Les bâtiments : la planche à 8 angles** avant de les montrer : `node C:\Users\Artefact\Desktop\Hearthwild\outils-claude\tour8.mjs <type> <niveau>`
  (variable `D` : la distance de la caméra, 13 pour le Château) ; la regarder **de près, toit par toit** (le trou de la
  Taverne ne se voyait pas en petit) ; l'envoyer à Yo avec la comparaison. Deux toits qui se croisent : l'aile a son propre
  toit d'un bout à l'autre et son pignon, le grand toit s'arrête dessous (pas de tuiles ôtées en escalier).
- **Pas de trous entre les pierres** : pierres jointives, peu arrondies, rangs du bord au bord, le cœur de leur couleur.
- **Chaque bâtiment refait passe une fois au niveau suivant dans la partie de Yo** sans rien payer : `NIVEAU2_FAITS` dans
  `js/remise.js` (les 7 y sont). Pour le niveau 3, faire de même (une liste `NIVEAU3_FAITS`, la même façon).
- Les pièces grandissent de **2 cases par niveau** (moyenne 6, 8, 10 ; grande 8, 10, 12 ; `roomSide`, `agrandirPiece`).
- La place de la porte peut changer avec le niveau (`B[type].doorNiveau`, `porteX`, `doorTile(…, lvl)`) : le Marché 2 a la
  porte au milieu. Le Château 1 et 2 ont une cour (`COURS` dans `regles.js`) : on entre par la tour (1) ou le donjon (2).
- Les objets du dehors se modifient comme dans les pièces (appui long, barre Tourner, Couleur, Ranger, Poser : `deplacer.js`).
- Quand un modèle de meuble change, l'ajouter à `REPRISES` dans `js/icones.js` pour que son icône soit reprise.

## À faire en premier dans la nouvelle séance

1. `git status` : le dossier doit être propre. `git log --oneline -3` doit montrer `daf2902` (ou plus récent).
2. Lancer le jeu avec `preview_start` « jeu » (il s'arrête parfois : `ERR_CONNECTION_REFUSED`, le relancer).
3. Lire la dernière vérification de GitHub et le carnet de bugs (seulement les notes de `yoann-art`).
4. Demander à Yo : la hache en pierre maintenant, ou attendre ses images des autres outils.

## Les outils de Claude (dans `C:\Users\Artefact\Desktop\Hearthwild\outils-claude\`)

- `tour8.mjs` (la planche à 8 angles d'un bâtiment), `batiment.mjs`, `meuble.mjs`, `planche.mjs`, `jeu_batiment.mjs` : voir
  leur LISEZMOI. Les photos vont dans `outils-claude\photos\`. Pour un outil, en écrire un sur le même modèle avec
  `makeOutil(clé)` (`js/monde/outils3d.js`), et une photo dans la main du personnage.
- Ne jamais lancer de photo pendant `tests/verif.mjs` : le serveur local sature.

## Points qui demandent l'accord de Yo

- Le Journal de production (doc Claude) : ses lignes sont à jour jusqu'à la v2.1.253.
- Une session ⏱️ 2 min est due vers la v2.1.246 et plus (la dernière : v2.1.241, 72 images/s, 5,4 % au-delà de 22,2 ms ;
  mémoire `telephone-de-yo`).
- Dans la Boîte à idées : le lustre, le lampadaire, le bassin d'ornement et la mangeoire (pour une mise à jour ou un
  événement) ; un trophée de cerf sculpté, un renard assis en statue.

## Fichiers à lire selon la tâche

- Toujours : `CLAUDE.md`, ce fichier, [CURRENT_STATE.md](CURRENT_STATE.md).
- Un outil : `js/monde/outils3d.js`, `js/donnees.js` (`OUTILS`), `js/ateliers.js` (la fabrication), `js/monde/mains.js`.
- Un bâtiment : son fichier dans `js/monde/` (`forge.js`, `taverne.js`…), `batiments.js` (`NOUVEAUX`).
- Un système de jeu : [ARCHITECTURE.md](ARCHITECTURE.md), puis chercher son nom dans [DEVELOPMENT_HISTORY.md](DEVELOPMENT_HISTORY.md).
- Rendu, performance, sauvegarde : [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md).
- Game design, contenu, règles complètes de Yo : [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
