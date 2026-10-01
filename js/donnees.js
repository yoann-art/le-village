/* ================= Données du jeu =================
   Les chiffres qu'on règle : ressources, bâtiments, meubles, plans de travail, outils, récolte. */
export const RES = {
  bois:   {emoji:"🪵", nom:"bois", pluriel:"bois", le:"Le bois", ou:"en coupant des arbres avec une hache"},
  pierre: {emoji:"🪨", nom:"pierre", pluriel:"pierres", le:"La pierre", ou:"en minant des rochers avec une pioche"},
  or:     {emoji:"🪙", nom:"or", pluriel:"or", le:"L'or", ou:"en vendant ton surplus au comptoir du Marché"}
};
/* size : côté du carré de cases dehors (en P) ; door : décalage de la porte sur la façade (en P, − vers la gauche) ;
   taille : taille de la pièce intérieure selon la bible (petite, moyenne, grande) */
export const B = {
  chaumiere:{nom:"Chaumière", emoji:"🛖", cost:{bois:8, pierre:3}, stars:1, size:3, door:0, taille:"moyenne", desc:"Loge des villageois. Rapporte des étoiles."},
  scierie:  {nom:"Scierie", emoji:"🪚", cost:{bois:10, or:4}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"bois", pct:25}, desc:"+25 % de bois en coupant les arbres, par niveau."},
  carriere: {nom:"Carrière", emoji:"⛏️", cost:{bois:12, or:5}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"pierre", pct:25}, desc:"+25 % de pierre en minant les rochers, par niveau."},
  marche:   {nom:"Marché", emoji:"⚖️", cost:{bois:12, pierre:10}, stars:2, size:4, door:0, taille:"grande", bonus:{res:"or", pct:25}, desc:"+25 % d'or aux ventes du comptoir, par niveau."},
  taverne:  {nom:"Taverne", emoji:"🍺", cost:{bois:18, pierre:12, or:10}, stars:3, size:4, door:0, taille:"grande", all:10, desc:"+10 % sur toutes les récoltes, par niveau."},
  forge:    {nom:"Forge", emoji:"⚒️", cost:{pierre:22, or:8}, stars:3, size:3, door:-.4, taille:"moyenne", desc:"Le forgeron équipe le village. Beaucoup d'étoiles."},
  chateau:  {nom:"Château", emoji:"🏰", cost:{bois:45, pierre:60, or:40}, stars:10, unique:true, size:4, door:0, taille:"grande", desc:"Le cœur du village. Il couronne ta partie."}
};
export const ORDER = ["chaumiere","scierie","carriere","marche","taverne","forge","chateau"];
/* Meubles du catalogue : gabarit de la bible (petit ≈ 1 P², moyen ≈ 2 P², grand ≈ 4 P²),
   taille au sol w × d en P (w de gauche à droite, d de l'arrière à l'avant),
   flat : posé à plat comme un tapis (on marche dessus, on pose des meubles dessus),
   where : les seuls bâtiments où il se pose (meuble de métier) ; sans where, il se pose partout */
export const MEUBLES = {
  chaise:   {nom:"Chaise", emoji:"🪑", gabarit:"petit", w:.7, d:.7},
  tabouret: {nom:"Tabouret", emoji:"🪵", gabarit:"petit", w:.5, d:.5},
  pot:      {nom:"Pot de fleurs", emoji:"🪴", gabarit:"petit", w:.5, d:.5},
  lanterne: {nom:"Lanterne sur pied", emoji:"🏮", gabarit:"petit", w:.5, d:.5},
  tonneau:  {nom:"Tonneau", emoji:"🛢️", gabarit:"petit", w:.7, d:.7},
  statue:   {nom:"Petite statue", emoji:"🗿", gabarit:"petit", w:.6, d:.6},
  coffre:   {nom:"Coffre", emoji:"📦", gabarit:"moyen", w:1.4, d:.8},
  banc:     {nom:"Banc", emoji:"🛋️", gabarit:"moyen", w:1.6, d:.6},
  etagere:  {nom:"Étagère", emoji:"📚", gabarit:"moyen", w:1.4, d:.5},
  cheminee: {nom:"Cheminée", emoji:"🔥", gabarit:"moyen", w:1.6, d:.8, where:["chaumiere","taverne","chateau"]},
  petitTapis:{nom:"Petit tapis", emoji:"🧶", gabarit:"moyen", w:1.6, d:1.1, flat:true},
  table:    {nom:"Table", emoji:"🍽️", gabarit:"grand", w:2, d:1.4},
  lit:      {nom:"Lit", emoji:"🛏️", gabarit:"grand", w:1.4, d:2.2, where:["chaumiere"]},
  grandTapis:{nom:"Grand tapis", emoji:"🧶", gabarit:"grand", w:2.4, d:1.8, flat:true},
  /* Plans de travail (plan:true) : un par bâtiment, construit avec des ressources (ATELIERS, cost)
     depuis le haut du catalogue, posé où l'on veut dans sa pièce, jamais rangé */
  etabli:   {nom:"Établi", emoji:"🪚", gabarit:"moyen", w:1.6, d:.8, plan:true},
  atelierDeco:{nom:"Atelier de décoration", emoji:"🧵", gabarit:"moyen", w:1.6, d:.8, plan:true},
  tableTaille:{nom:"Table de taille", emoji:"⛏️", gabarit:"moyen", w:1.6, d:.9, plan:true},
  comptoir: {nom:"Comptoir", emoji:"⚖️", gabarit:"grand", w:2.2, d:.9, plan:true},
  fourneau: {nom:"Fourneau", emoji:"🍲", gabarit:"moyen", w:1.4, d:.8, plan:true},
  enclume:  {nom:"Enclume", emoji:"⚒️", gabarit:"petit", w:.9, d:.7, plan:true},
  trone:    {nom:"Trône", emoji:"👑", gabarit:"moyen", w:1.2, d:1, plan:true}
};

/* Le sac à dos (étape 1.4) : nombre d'emplacements au départ (agrandissable plus tard),
   combien d'objets pareils s'empilent dans un emplacement (un outil prend un emplacement à lui seul),
   et le nombre de cases rapides au-dessus du joystick (demande de Yo : changer d'outil sans ouvrir le sac) */
export const SAC = {places:12, pile:30, cases:3};
/* Un coffre de réserve (demande de Yo) : posé au village, on y range ce qu'on veut ; on peut en fabriquer
   plusieurs pour trier. places : ses emplacements (piles comme dans le sac) */
export const COFFRE = {places:20};
/* Ce qui se pose sur l'île depuis le sac (en main, « Poser ») : pose = ce qui apparaît sur la case */
export const POSABLES = {
  coffreReserve:{nom:"Coffre de réserve", pluriel:"coffres de réserve", emoji:"🗃️", pose:"coffre",
    usage:"Prends-le en main, puis touche « Poser le coffre » devant une case libre du village. On y range ce qu'on veut."}
};

/* Outils (étape 1.4) : rangés dans le sac, ils ne s'usent pas. Prévus en familles avec une force
   (demande de Yo : des outils et des armes de plus en plus puissants au fil de la partie) ;
   les versions en cuivre viendront à l'enclume, après l'étape 1.5. usage : à quoi il servira. */
export const OUTILS = {
  hachePierre: {nom:"Hache en pierre", pluriel:"haches en pierre", emoji:"🪓", famille:"hache", force:1, usage:"Servira à couper les arbres."},
  piochePierre:{nom:"Pioche en pierre", pluriel:"pioches en pierre", emoji:"⛏️", famille:"pioche", force:1, usage:"Servira à casser les rochers."},
  canneBois:   {nom:"Canne à pêche", pluriel:"cannes à pêche", emoji:"🎣", famille:"canne", force:1, usage:"Servira à pêcher."},
  epeeBois:    {nom:"Épée en bois", pluriel:"épées en bois", emoji:"🗡️", famille:"arme", force:1, usage:"Servira à te défendre dans la grotte."},
  /* eau : nombre d'arrosages quand il est plein (demande de Yo : on le remplit au bord de l'eau, une jauge montre ce qu'il reste) */
  arrosoir:    {nom:"Arrosoir", pluriel:"arrosoirs", emoji:"🪣", famille:"arrosoir", force:1, eau:5,
    usage:"Remplis-le au bord de l'eau (mer ou étang), puis arrose les buissons de baies vides pour que les baies reviennent."}
};

/* Graines (étape 1.5) : un arbre abattu, des herbes arrachées, un buisson coupé en donnent une ;
   on la plante où l'on veut sur l'île.
   plante : ce qui pousse ; pousse : temps pour devenir adulte, en secondes, avec l'horloge du téléphone
   (à régler en jouant ; plus tard selon la météo et la saison, étape 1.10) */
export const GRAINES = {
  graineArbre:{nom:"Graine d'arbre", pluriel:"graines d'arbre", emoji:"🌰", plante:"tree", pousse:7200,
    usage:"Prends-la en main, puis touche « Planter » devant une case d'herbe libre."},
  graineHerbe:{nom:"Graine d'herbes", pluriel:"graines d'herbes", emoji:"🌱", plante:"herbe", pousse:1800,
    usage:"Prends-la en main, puis touche « Planter » devant une case d'herbe libre : des herbes hautes y pousseront."},
  graineBuisson:{nom:"Graine de buisson", pluriel:"graines de buisson", emoji:"🌿", plante:"buisson", pousse:3600,
    usage:"Prends-la en main, puis touche « Planter » devant une case d'herbe libre : un buisson de baies y poussera."}
};
/* Récolter sur l'île. Couper : l'outil qu'il faut (sa famille), le nombre de coups pour abattre, ce que
   donne chaque coup avec un outil de force 1 (+1 par force en plus) et la graine du dernier coup.
   Cueillir (à la main) : ce que ça donne (cueille, n) ; herbes : repousse en secondes, ou arrachées à la
   2e cueillette de suite (une graine, plus de repousse) ; buisson : vide après la cueillette, les baies
   reviennent « retour » secondes après l'arrosage (décidé par Yo). Les bonus des bâtiments s'ajoutent. */
export const RECOLTE = {
  tree:   {nom:"l'arbre", outil:"hache", coups:3, res:"bois", parCoup:2, graine:"graineArbre"},
  herbe:  {nom:"les herbes hautes", cueille:"fibre", n:2, repousse:900, graine:"graineHerbe"},
  buisson:{nom:"le buisson", outil:"hache", coups:2, parCoup:0, graine:"graineBuisson", cueille:"baie", n:3, retour:3600}
};

/* Ce qu'on trouve au sol et qu'on ramasse à la main (demande de Yo) : de quoi fabriquer sa première hache
   et sa première pioche, pour qu'une nouvelle partie ne soit jamais bloquée. Ce que donne chacun (n, avant
   les bonus des bâtiments), combien il y en a au plus sur l'île (max), où ils apparaissent (pres : à côté
   d'un arbre), et toutes les combien de secondes il en revient un de chaque (retour). */
export const SOL = {
  branche:{nom:"Morceau de bois", emoji:"🪵", res:"bois", n:2, max:8, sols:["grass"], pres:"tree"},
  caillou:{nom:"Petit caillou", emoji:"🪨", res:"pierre", n:1, max:5, sols:["grass", "sand"]}
};
export const SOL_RETOUR = 900;

/* Produits fabriqués ou récoltés qui ne sont pas des meubles */
export const PRODUITS = {
  planche:{nom:"Planche", pluriel:"planches", emoji:"🟫"},
  bloc:   {nom:"Bloc", pluriel:"blocs", emoji:"🧱"},
  fibre:  {nom:"Fibre", pluriel:"fibres", emoji:"🌾"},
  baie:   {nom:"Baie", pluriel:"baies", emoji:"🫐"}
};
/* Plans de travail, par bâtiment : le meuble qui le représente dans la pièce, son prix pour le
   construire (cost, demande de Yo : il n'est pas gratuit), son nom avec article (le ; fem : nom féminin),
   à quoi il sert (pour) et ses recettes. vente : le plan de travail vend au lieu de fabriquer (comptoir).
   Recette : ce qu'elle donne (out, n exemplaires), ses ingrédients (in), son temps en secondes (t)
   et le niveau du bâtiment qu'il faut (lvl). Chiffres à régler en jouant. */
export const ATELIERS = {
  scierie:{nom:"Établi", le:"l'établi", emoji:"🪚", meuble:"etabli", cost:{bois:10}, pour:"fabriquer des planches et des meubles en bois", recettes:[
    {out:"planche", n:2, in:{bois:1}, t:5, lvl:1, cat:"Matériaux"},
    /* Outils de départ ; le fil de la canne à pêche est en fibres */
    {out:"hachePierre", in:{planche:3, pierre:2}, t:30, lvl:1, cat:"Outils"},
    {out:"piochePierre", in:{planche:3, pierre:3}, t:30, lvl:1, cat:"Outils"},
    {out:"arrosoir", in:{planche:3, pierre:1}, t:30, lvl:1, cat:"Outils"},
    {out:"canneBois", in:{planche:4, fibre:3}, t:40, lvl:1, cat:"Outils"},
    {out:"epeeBois", in:{planche:4}, t:40, lvl:1, cat:"Outils"},
    {out:"coffreReserve", in:{planche:5}, t:20, lvl:1, cat:"Rangement"},
    {out:"tabouret", in:{planche:2}, t:20, lvl:1, cat:"Meubles"},
    {out:"chaise", in:{planche:3}, t:30, lvl:1},
    {out:"banc", in:{planche:4}, t:40, lvl:1},
    {out:"coffre", in:{planche:4, or:1}, t:60, lvl:1},
    {out:"tonneau", in:{planche:5}, t:60, lvl:2},
    {out:"table", in:{planche:6}, t:90, lvl:2},
    {out:"etagere", in:{planche:6}, t:90, lvl:2},
    {out:"lit", in:{planche:8, or:2}, t:120, lvl:3}
  ]},
  chaumiere:{nom:"Atelier de décoration", le:"l'atelier de décoration", emoji:"🧵", meuble:"atelierDeco", cost:{bois:6, or:2},
    pour:"fabriquer des pots de fleurs, des lanternes et des tapis", recettes:[
    {out:"pot", in:{pierre:2}, t:20, lvl:1},
    {out:"lanterne", in:{planche:2, or:1}, t:30, lvl:1},
    /* Tapis en fibres, comme le prévoit la bible (étape 1.5) */
    {out:"petitTapis", in:{fibre:6}, t:40, lvl:1},
    {out:"grandTapis", in:{fibre:10, or:1}, t:60, lvl:2}
  ]},
  carriere:{nom:"Table de taille", le:"la table de taille", fem:true, emoji:"⛏️", meuble:"tableTaille", cost:{bois:4, pierre:8},
    pour:"tailler des blocs, des statues et des cheminées", recettes:[
    {out:"bloc", n:2, in:{pierre:1}, t:5, lvl:1},
    {out:"statue", in:{bloc:3}, t:40, lvl:1},
    {out:"cheminee", in:{bloc:6, planche:2}, t:90, lvl:2}
  ]},
  marche:{nom:"Comptoir", le:"le comptoir", emoji:"⚖️", meuble:"comptoir", cost:{bois:8, pierre:4}, vente:true,
    pour:"vendre ton surplus contre de l'or", recettes:[
    {out:"or", in:{bois:6}, t:10, lvl:1},
    {out:"or", in:{pierre:6}, t:10, lvl:1},
    {out:"or", in:{planche:10}, t:10, lvl:1},
    {out:"or", in:{bloc:10}, t:10, lvl:1}
  ]},
  /* Plans de travail en attente : posés, recettes affichées mais verrouillées (lock = la raison),
     en attendant ce qu'il leur faut. note : une phrase de plus en haut de leur fiche. */
  taverne:{nom:"Fourneau", le:"le fourneau", emoji:"🍲", meuble:"fourneau", cost:{bois:4, pierre:8},
    pour:"cuisiner des plats qui donnent des bonus", note:"Les recettes se découvriront en essayant des ingrédients.", recettes:[
    {nom:"Poisson grillé", emoji:"🐟", lock:"Arrive avec la pêche"},
    {nom:"Ragoût de gibier", emoji:"🍖", lock:"Arrive avec la chasse"},
    {nom:"Tarte aux fruits", emoji:"🥧", lock:"Arrive avec la cueillette"}
  ]},
  forge:{nom:"Enclume", le:"l'enclume", fem:true, emoji:"⚒️", meuble:"enclume", cost:{pierre:6, or:4},
    pour:"forger des outils et des armes en métal", recettes:[
    {nom:"Pioche en cuivre", emoji:"⛏️", lock:"Arrive avec le cuivre de la carrière"},
    {nom:"Hache en cuivre", emoji:"🪓", lock:"Arrive avec le cuivre de la carrière"},
    {nom:"Épée en cuivre", emoji:"🗡️", lock:"Arrive avec le cuivre de la carrière"}
  ]},
  chateau:{nom:"Trône", le:"le trône", emoji:"👑", meuble:"trone", cost:{bois:10, or:10}, titre:"Grands chantiers",
    pour:"lancer les grands chantiers et les quêtes", note:"La salle du trône : c'est d'ici que tu lanceras les grands chantiers.", recettes:[
    {nom:"Navire à voile", emoji:"⛵", lock:"Arrive avec les voyages vers les zones sauvages"},
    {nom:"Gare de wagonnet", emoji:"🚃", lock:"Arrive avec les voyages vers les zones sauvages"},
    {nom:"Aire de montgolfière", emoji:"🎈", lock:"Arrive avec les voyages vers les zones sauvages"},
    {nom:"Aire d'envol", emoji:"🐉", lock:"Arrive avec les voyages vers les zones sauvages"}
  ]}
};
/* Pour chaque objet fabriqué (meuble ou produit) : le bâtiment dont l'atelier le fabrique */
export const FABRIQUE_A = {};
for(const [b, a] of Object.entries(ATELIERS)) for(const r of a.recettes) if(r.out && !RES[r.out]) FABRIQUE_A[r.out] = b;
/* Palette gratuite : couleur d'un meuble, des murs ou du sol d'une pièce.
   (Plus tard : des couleurs à gagner, avec un cadenas — voir la Boîte à idées du plan de production.) */
export const COULEURS = {
  miel:  {nom:"Bois miel", hex:0xC8955A},
  sombre:{nom:"Bois sombre", hex:0x6B4428},
  tuile: {nom:"Rouge tuile", hex:0xC8643C},
  vert:  {nom:"Vert tendre", hex:0x8DBF6A},
  bleu:  {nom:"Bleu ardoise", hex:0x6B86B8},
  creme: {nom:"Crème", hex:0xF2E2C2}
};
export const COULEURS_ORDER = ["miel","sombre","tuile","vert","bleu","creme"];
export const MEUBLES_ORDER = ["chaise","tabouret","pot","lanterne","tonneau","statue","coffre","banc","etagere","cheminee","petitTapis","table","lit","grandTapis"];
/* Tout ce qui peut aller dans le sac ou un coffre : sa fiche (nom, emoji…) */
export const objet = k => RES[k] || PRODUITS[k] || OUTILS[k] || GRAINES[k] || POSABLES[k] || MEUBLES[k];
