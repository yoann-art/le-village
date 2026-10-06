/* ================= Données du jeu =================
   Les chiffres qu'on règle : ressources, bâtiments, meubles, plans de travail, outils, récolte. */
export const RES = {
  bois:   {emoji:"🪵", nom:"bois", pluriel:"bois", aide:"Le bois : ramasse les morceaux de bois au sol, puis coupe des arbres avec une hache."},
  pierre: {emoji:"🪨", nom:"pierre", pluriel:"pierres", aide:"La pierre : ramasse les petits cailloux au sol, puis mine des rochers avec une pioche."},
  or:     {emoji:"🪙", nom:"or", pluriel:"or", aide:"L'or : vends ton surplus au comptoir du Marché."}
};
/* size : côté du carré de cases dehors (en P) ; door : décalage de la porte sur la façade (en P, − vers la gauche) ;
   taille : taille de la pièce intérieure selon la bible (petite, moyenne, grande).
   cost : une suite logique (décidée avec Yo le 1er octobre 2026) : d'abord ce qu'on ramasse à la main (bois,
   pierre, fibres), puis ce que fabriquent les plans de travail des bâtiments d'avant (planches, blocs, or),
   puis le cuivre de la mine. Dans l'ordre de ORDER. Chiffres à régler en jouant. */
export const B = {
  chaumiere:{nom:"Chaumière", emoji:"🛖", cost:{bois:20, pierre:10, fibre:12}, stars:1, size:3, door:0, taille:"moyenne", desc:"Loge des villageois. Rapporte des étoiles."},
  scierie:  {nom:"Scierie", emoji:"🪚", cost:{bois:12, pierre:6, fibre:4}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"bois", pct:25}, desc:"+25 % de bois en coupant les arbres, par niveau."},
  carriere: {nom:"Carrière", emoji:"⛏️", cost:{planche:15, pierre:20}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"pierre", pct:25}, desc:"+25 % de pierre en minant les rochers, par niveau."},
  marche:   {nom:"Marché", emoji:"⚖️", cost:{planche:25, bloc:15, fibre:10}, stars:2, size:4, door:0, taille:"grande", bonus:{res:"or", pct:25}, desc:"+25 % d'or aux ventes du comptoir, par niveau."},
  taverne:  {nom:"Taverne", emoji:"🍺", cost:{planche:30, bloc:25, or:20}, stars:3, size:4, door:0, taille:"grande", all:10, desc:"+10 % sur toutes les récoltes, par niveau."},
  forge:    {nom:"Forge", emoji:"⚒️", cost:{bloc:30, cuivre:15, or:20}, stars:3, size:3, door:-.4, taille:"moyenne", desc:"Le forgeron équipe le village. Beaucoup d'étoiles."},
  chateau:  {nom:"Château", emoji:"🏰", cost:{bloc:60, planche:40, cuivre:30, or:80}, stars:10, unique:true, size:4, door:0, taille:"grande", desc:"Le cœur du village. Il couronne ta partie."},
  /* La mine (étape 1.5, demande de Yo : on y entre) : posée une fois sur l'île, ni construite, ni déplacée, ni améliorée */
  mine:     {nom:"Mine", emoji:"⛰️", cost:{}, stars:0, size:3, door:0, taille:"mine", fixe:true, desc:"L'entrée de la mine. Dedans, des rochers de pierre et de cuivre, qui reviennent chaque jour."},
  /* L'orée de la Forêt profonde (étape 1.7), au bout du pont du nord de l'île : on y entre à pied (voir monde/foret.js) */
  foret:    {nom:"Forêt profonde", emoji:"🌲", cost:{}, stars:0, size:3, door:0, taille:"foret", fixe:true, desc:"L'orée de la Forêt profonde, la première zone sauvage. Dedans, de grands arbres qui repoussent, des clairières, un ruisseau ; le gibier arrive bientôt."}
};
export const ORDER = ["scierie","chaumiere","carriere","marche","taverne","forge","chateau"];
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
  rocher:      {nom:"Rocher", pluriel:"rochers", emoji:"🪨", pose:"rock", seul:true,
    usage:"Un rocher rapporté de la mine : prends-le en main, puis touche « Poser le rocher » devant une case libre de ton île."},
  rocherCuivre:{nom:"Rocher à veines de cuivre", pluriel:"rochers à veines de cuivre", emoji:"🟤", pose:"rockCuivre", seul:true,
    usage:"Un rocher à veines de cuivre rapporté de la mine : pose-le sur ton île, puis mine-le pour son cuivre."},
  coffreReserve:{nom:"Coffre de réserve", pluriel:"coffres de réserve", emoji:"🗃️", pose:"coffre",
    usage:"Prends-le en main, puis touche « Poser le coffre » devant une case libre du village. On y range ce qu'on veut."}
};

/* Outils (étape 1.4) : rangés dans le sac, ils ne s'usent pas. Prévus en familles avec une force
   (demande de Yo : des outils et des armes de plus en plus puissants au fil de la partie) ;
   les versions en cuivre viendront à l'enclume, après l'étape 1.5. usage : à quoi il servira. */
export const OUTILS = {
  hachePierre: {nom:"Hache en pierre", pluriel:"haches en pierre", emoji:"🪓", famille:"hache", force:1, usage:"Servira à couper les arbres."},
  piochePierre:{nom:"Pioche en pierre", pluriel:"pioches en pierre", emoji:"⛏️", famille:"pioche", force:1, usage:"Servira à casser les rochers."},
  canneBois:   {nom:"Canne à pêche", pluriel:"cannes à pêche", emoji:"🎣", famille:"canne", force:1, usage:"Face à la mer ou à l'étang : « Lancer », puis « Ferrer ! » dès que le bouchon plonge."},
  /* Le filet (étape 1.7, Grand Carnet : « Établi, avec du lin » ; des fibres en attendant le lin) */
  filet:       {nom:"Filet", pluriel:"filets", emoji:"🥅", famille:"filet", force:1, usage:"Pour attraper les insectes et les oiseaux : approche à pas de loup, en poussant le joystick doucement, puis « Attraper » ou « Lancer le filet »."},
  epeeBois:    {nom:"Épée en bois", pluriel:"épées en bois", emoji:"🗡️", famille:"arme", force:1, usage:"Servira à te défendre dans la grotte."},
  /* eau : nombre d'arrosages quand il est plein (demande de Yo : on le remplit au bord de l'eau, une jauge montre ce qu'il reste) */
  /* Outils en cuivre (enclume de la Forge) : plus forts, ils donnent un de plus à chaque coup ; tete : couleur du fer */
  hacheCuivre: {nom:"Hache en cuivre", pluriel:"haches en cuivre", emoji:"🪓", famille:"hache", force:2, tete:0xC8743C, usage:"Coupe les arbres : un bois de plus à chaque coup."},
  piocheCuivre:{nom:"Pioche en cuivre", pluriel:"pioches en cuivre", emoji:"⛏️", famille:"pioche", force:2, tete:0xC8743C, usage:"Casse les rochers : une pierre de plus à chaque coup."},
  epeeCuivre:  {nom:"Épée en cuivre", pluriel:"épées en cuivre", emoji:"🗡️", famille:"arme", force:2, tete:0xC8743C, usage:"Servira à te défendre dans la grotte, plus fort que l'épée en bois."},
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
    usage:"Prends-la en main, puis touche « Planter » devant une case d'herbe libre : un buisson de baies y poussera."},
  /* Le thym (étape 1.6, Grand Carnet : « Thym et sauge ») ; la durée de pousse est à régler en jouant */
  /* Les graines des arbres de la Forêt profonde (étape 1.7, Grand Carnet : « abattre un arbre peut donner sa graine,
     à replanter sur l'île ») ; sur l'île, l'arbre pousse en temps réel (pousse en secondes, à régler en jouant) */
  graineCharme:{nom:"Graine de charme", pluriel:"graines de charme", emoji:"🌰", plante:"charme", pousse:7200, sachet:0x4A9A4C,
    usage:"Prends-la en main, puis « Planter » devant une case d'herbe libre : un charme y poussera (jamais collé à un autre arbre)."},
  graineFrene: {nom:"Graine de frêne", pluriel:"graines de frêne", emoji:"🌰", plante:"frene", pousse:7200, sachet:0x6FBA64,
    usage:"Prends-la en main, puis « Planter » devant une case d'herbe libre : un frêne y poussera (jamais collé à un autre arbre)."},
  graineSureau:{nom:"Graine de sureau", pluriel:"graines de sureau", emoji:"🌰", plante:"sureau", pousse:7200, sachet:0x3A2A40,
    usage:"Prends-la en main, puis « Planter » devant une case d'herbe libre : un sureau y poussera."},
  graineIf:    {nom:"Graine d'if", pluriel:"graines d'if", emoji:"🌰", plante:"if", pousse:21600, sachet:0x2E6A40,
    usage:"Prends-la en main, puis « Planter » devant une case d'herbe libre : un if y poussera (jamais collé à un autre arbre)."},
  graineHoux:  {nom:"Graine de houx", pluriel:"graines de houx", emoji:"🌰", plante:"houx", pousse:21600, sachet:0xD8342A,
    usage:"Prends-la en main, puis « Planter » devant une case d'herbe libre : un houx y poussera."},
  graineChene: {nom:"Gland de chêne séculaire", pluriel:"glands de chêne séculaire", emoji:"🌰", plante:"chene", pousse:86400, sachet:0x6A5440,
    usage:"Prends-le en main, puis « Planter » devant une case d'herbe libre : un chêne séculaire y poussera, en un jour (jamais collé à un autre arbre)."},
  graineThym:{nom:"Graine de thym", pluriel:"graines de thym", emoji:"🌱", plante:"thym", pousse:3600,
    icone:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10Q6 21 12 21Q18 21 18 10Z" fill="#EFE6D2" stroke="#8A6B4A" stroke-width="1.2"/><rect x="7" y="7.5" width="10" height="3" rx="1.5" fill="#8A6B4A"/><circle cx="12" cy="15" r="2.6" fill="#B79AD6"/></svg>',
    usage:"Prends-la en main, puis touche « Planter » devant une case d'herbe libre : du thym y poussera."}
};
/* Récolter sur l'île. Couper : l'outil qu'il faut (sa famille), le nombre de coups pour abattre, ce que
   donne chaque coup avec un outil de force 1 (+1 par force en plus) et la graine du dernier coup.
   Cueillir (à la main) : ce que ça donne (cueille, n) ; herbes : repousse en secondes, ou arrachées à la
   2e cueillette de suite (une graine, plus de repousse) ; buisson : vide après la cueillette, les baies
   reviennent « retour » secondes après l'arrosage (décidé par Yo). Les bonus des bâtiments s'ajoutent. */
export const RECOLTE = {
  tree:   {nom:"l'arbre", outil:"hache", coups:3, res:"bois", parCoup:2, graine:"graineArbre"},
  /* Les rochers de l'île ne reviennent jamais (décidé par Yo) : ensuite, la pierre se trouve à la mine */
  rock:   {nom:"le rocher", outil:"pioche", coups:3, res:"pierre", parCoup:2, prendre:"rocher"},
  rockCuivre:{nom:"le rocher à veines de cuivre", outil:"pioche", coups:3, res:"cuivre", parCoup:2, prendre:"rocherCuivre"},
  herbe:  {nom:"les herbes hautes", cueille:"fibre", n:2, repousse:900, graine:"graineHerbe"},
  buisson:{nom:"le buisson", outil:"hache", coups:2, parCoup:0, graine:"graineBuisson", cueille:"baie", n:3, retour:3600},
  /* Le thym (Grand Carnet, plante sauvage commune) : la cueillette donne toujours sa récolte, et sa graine
     3 fois sur 4 (chance) ; il repousse sur place en 12 h (repousse) ; à régler en jouant */
  thym:   {nom:"le thym", cueille:"thym", n:2, repousse:43200, graine:"graineThym", chance:.75},
  /* Les arbres de la Forêt profonde (étape 1.7, d'après le Grand Carnet) : on les coupe à la hache ; chacun donne son
     bois (res) et sa graine selon sa rareté (chance : commun 3 fois sur 4, peu commun 1 fois sur 2, rare 1 fois sur 5) ;
     dans la forêt, ils repoussent sur place (repousse en secondes : 1 jour, 3 jours, 1 semaine) ; sur l'île, ils
     tombent et disparaissent. Le houx et le sureau n'ont pas de bois : on cueille leurs baies ou leurs fleurs (n),
     qui reviennent (retour, en secondes). Le Grand Chêne millénaire, lui, ne s'abat pas. */
  charme: {nom:"le charme", outil:"hache", coups:3, res:"boisCharme", parCoup:2, graine:"graineCharme", chance:.75, repousse:86400},
  frene:  {nom:"le frêne", outil:"hache", coups:3, res:"boisFrene", parCoup:2, graine:"graineFrene", chance:.75, repousse:86400},
  sureau: {nom:"le sureau", outil:"hache", coups:2, parCoup:0, graine:"graineSureau", chance:.75, repousse:86400, n:3, retour:43200},
  if:     {nom:"l'if", outil:"hache", coups:3, res:"boisIf", parCoup:1, graine:"graineIf", chance:.5, repousse:259200},
  houx:   {nom:"le houx", outil:"hache", coups:2, parCoup:0, graine:"graineHoux", chance:.5, repousse:259200, n:2, retour:43200},
  chene:  {nom:"le chêne séculaire", outil:"hache", coups:5, res:"boisChene", parCoup:3, graine:"graineChene", chance:.2, repousse:604800}
};

/* Ce qu'on trouve au sol et qu'on ramasse à la main (demande de Yo) : une partie commence sans rien ; de quoi
   bâtir la Scierie, son établi, puis la première hache et la première pioche, sans attendre. Ce que donne chacun (n, avant
   les bonus des bâtiments), combien il y en a au plus sur l'île (max), où ils apparaissent (pres : à côté
   d'un arbre), et toutes les combien de secondes il en revient un de chaque (retour). */
export const SOL = {
  branche:{nom:"Morceau de bois", emoji:"🪵", res:"bois", n:2, max:12, sols:["grass"], pres:"tree"},
  caillou:{nom:"Petit caillou", emoji:"🪨", res:"pierre", n:1, max:12, sols:["grass", "sand"]}
};
export const SOL_RETOUR = 600;
/* La mine : combien de rochers chaque jour, dont combien à veines de cuivre (à régler en jouant) */
export const MINE = {rochers:10, cuivre:3};

/* La pêche (étape 1.6) : les poissons de l'île d'après le Grand Carnet (pages « Les poissons », décision de Yo
   le 5 octobre 2026), plus la truite, le congre et la Vieille Carpe d'or gardés par Yo, et quatre poissons du
   ponton choisis par Claude (merlan, mulet, orphie, encornet ; demande de Yo : la mer n'est jamais vide).
   Chacun : son lieu (« etang » ou « mer »), d'où on le pêche (depuis : « ponton », ou « barque » au large,
   plus tard), ses saisons, ses heures (HEURES), sa météo s'il en a une (« beau », « pluie », « orage » : en
   attendant la météo de l'étape 1.10, il fait toujours beau), sa rareté, sa particularité (note, du carnet),
   sa taille (cm), son prix en or au comptoir (étape 1.6, morceau 2), sa couleur et sa forme (son dessin).
   Un légendaire ne se prend qu'une fois dans tout le jeu (carnet). À toute heure et en toute saison, il reste
   un poisson commun à l'étang (la perche) et en mer depuis la plage (maquereau, rouget, merlan…).
   une : féminin (« une perche »). Vraie horloge du téléphone, hémisphère nord en attendant l'étape 1.10. */
const TOUTE = ["printemps", "ete", "automne", "hiver"];
export const POISSONS = {
  /* L'étang */
  gardon:  {nom:"Gardon", pluriel:"gardons", lieu:"etang", rarete:"commun", saisons:TOUTE, heures:"jour", taille:[10, 30], prix:1, couleur:0xB8C4CC, note:"Le premier poisson qu'on attrape"},
  perche:  {nom:"Perche", pluriel:"perches", une:true, lieu:"etang", rarete:"commun", saisons:TOUTE, heures:"toujours", taille:[15, 40], prix:1, couleur:0x8DA35A, note:"Rayée, des épines sur le dos"},
  tanche:  {nom:"Tanche", pluriel:"tanches", une:true, lieu:"etang", rarete:"commun", saisons:["ete"], heures:"soir", taille:[20, 50], prix:1, couleur:0x9A9A3C, note:"Vert doré, elle aime la vase"},
  carpe:   {nom:"Carpe", pluriel:"carpes", une:true, lieu:"etang", rarete:"commun", saisons:["printemps", "ete", "automne"], heures:"toujours", taille:[30, 80], prix:1, couleur:0xB08A4A, forme:"rond", note:"Grosse et patiente, elle tire fort"},
  ecrevisse:{nom:"Écrevisse", pluriel:"écrevisses", une:true, lieu:"etang", rarete:"commun", saisons:["ete"], heures:"nuit", taille:[8, 15], prix:1, couleur:0xB5523B, forme:"crustace", note:"Elle pince quand on la décroche"},
  truite:  {nom:"Truite", pluriel:"truites", une:true, lieu:"etang", rarete:"peuCommun", saisons:["automne", "hiver", "printemps"], heures:"matinSoir", taille:[25, 60], prix:3, couleur:0x9C8F86, note:"Tachetée, elle remonte le courant"},
  brochet: {nom:"Brochet", pluriel:"brochets", lieu:"etang", rarete:"peuCommun", saisons:["automne", "hiver"], heures:"aube", taille:[50, 110], prix:3, couleur:0x6E7E4A, forme:"fin", note:"Des dents pointues, il chasse les petits poissons"},
  anguille:{nom:"Anguille", pluriel:"anguilles", une:true, lieu:"etang", rarete:"peuCommun", saisons:TOUTE, heures:"nuit", meteo:"pluie", taille:[40, 100], prix:3, couleur:0x5B5642, forme:"long", note:"Elle glisse et se tortille"},
  koi:     {nom:"Carpe koï", pluriel:"carpes koï", une:true, lieu:"etang", rarete:"rare", saisons:["printemps"], heures:"jour", meteo:"beau", taille:[30, 70], prix:8, couleur:0xF08A3C, forme:"rond", note:"Orange et blanche, splendide en bassin"},
  carpeOr: {nom:"Vieille Carpe d'or", pluriel:"Vieilles Carpes d'or", une:true, lieu:"etang", rarete:"legendaire", saisons:TOUTE, heures:"aube", taille:[90, 130], prix:30, couleur:0xF2C14E, forme:"rond", note:"Une carpe très ancienne, aux écailles d'or"},
  silure:  {nom:"Vieux Silure", pluriel:"Vieux Silures", lieu:"etang", rarete:"legendaire", saisons:TOUTE, heures:"nuit", meteo:"orage", taille:[180, 250], prix:30, couleur:0x4A4A3E, note:"Le plus vieux poisson de l'île, long comme une barque"},
  /* La mer, depuis la plage */
  maquereau:{nom:"Maquereau", pluriel:"maquereaux", lieu:"mer", rarete:"commun", saisons:["printemps", "ete"], heures:"toujours", taille:[25, 45], prix:1, couleur:0x4F7FA0, forme:"fin", note:"Rayé de bleu, très rapide"},
  rouget:  {nom:"Rouget", pluriel:"rougets", lieu:"mer", rarete:"commun", saisons:["ete"], heures:"toujours", taille:[15, 35], prix:1, couleur:0xD9604A, note:"Rouge, avec des moustaches"},
  merlan:  {nom:"Merlan", pluriel:"merlans", lieu:"mer", rarete:"commun", saisons:["automne", "hiver"], heures:"toujours", taille:[20, 40], prix:1, couleur:0xC2C8CF, forme:"fin", note:"Argenté, il aime les eaux froides"},
  bar:     {nom:"Bar", pluriel:"bars", lieu:"mer", rarete:"peuCommun", saisons:TOUTE, heures:"aube", taille:[35, 80], prix:3, couleur:0xA9B2B8, note:"Argenté et combatif"},
  dorade:  {nom:"Dorade", pluriel:"dorades", une:true, lieu:"mer", rarete:"peuCommun", saisons:["ete"], heures:"toujours", taille:[25, 50], prix:3, couleur:0xC9B98A, forme:"rond", note:"Un trait doré entre les yeux"},
  sole:    {nom:"Sole", pluriel:"soles", une:true, lieu:"mer", rarete:"peuCommun", saisons:TOUTE, heures:"nuit", taille:[25, 50], prix:3, couleur:0xA08B6A, forme:"rond", note:"Plate, cachée dans le sable"},
  congre:  {nom:"Congre", pluriel:"congres", lieu:"mer", rarete:"rare", saisons:TOUTE, heures:"nuit", taille:[80, 180], prix:8, couleur:0x5A5A5E, forme:"long", note:"Long et puissant, il sort la nuit"},
  /* La mer, depuis le ponton */
  sardine: {nom:"Sardine", pluriel:"sardines", une:true, lieu:"mer", depuis:"ponton", rarete:"commun", saisons:["ete"], heures:"toujours", taille:[12, 22], prix:1, couleur:0x9FB8D0, forme:"fin", note:"Elle nage en bancs argentés"},
  mulet:   {nom:"Mulet", pluriel:"mulets", lieu:"mer", depuis:"ponton", rarete:"commun", saisons:TOUTE, heures:"jour", taille:[30, 60], prix:1, couleur:0x8E9AA3, note:"Il tourne autour des pontons"},
  orphie:  {nom:"Orphie", pluriel:"orphies", une:true, lieu:"mer", depuis:"ponton", rarete:"peuCommun", saisons:["printemps"], heures:"jour", taille:[40, 80], prix:3, couleur:0x5FA39B, forme:"long", note:"Un long bec pointu, et des arêtes vertes"},
  encornet:{nom:"Encornet", pluriel:"encornets", lieu:"mer", depuis:"ponton", rarete:"peuCommun", saisons:["automne", "hiver"], heures:"nuit", taille:[15, 40], prix:3, couleur:0xE8C2B4, forme:"calmar", note:"Il sort la nuit, attiré par la lumière"},
  /* La mer, au large en barque (quand la barque arrivera) */
  thon:    {nom:"Thon", pluriel:"thons", lieu:"mer", depuis:"barque", rarete:"rare", saisons:["ete"], heures:"toujours", taille:[100, 200], prix:8, couleur:0x2E4A6E, forme:"rond", note:"Énorme : il faut tenir longtemps"}
};
/* Les moments de la journée, en heures du téléphone : [de, à[ */
export const HEURES = {
  toujours:{nom:"à toute heure", h:[[0, 24]]},
  jour:{nom:"le jour (7 h – 19 h)", h:[[7, 19]]},
  soir:{nom:"le soir (18 h – 21 h)", h:[[18, 21]]},
  nuit:{nom:"la nuit (21 h – 5 h)", h:[[21, 24], [0, 5]]},
  aube:{nom:"à l'aube (5 h – 8 h)", h:[[5, 8]]},
  matin:{nom:"le matin (5 h – 11 h)", h:[[5, 11]]},
  apresMidi:{nom:"l'après-midi (13 h – 18 h)", h:[[13, 18]]},
  matinSoir:{nom:"le matin et le soir (5 h – 9 h, 17 h – 21 h)", h:[[5, 9], [17, 21]]}
};
export const SAISONS = {printemps:"printemps", ete:"été", automne:"automne", hiver:"hiver"};
export const RARETES = {commun:"commun", peuCommun:"peu commun", rare:"rare", legendaire:"légendaire"};
export const METEOS = {beau:"par beau temps", pluie:"sous la pluie", orage:"une nuit d'orage"};
/* Le geste : le temps entre l'arrivée du poisson au bouchon et la touche (morsure, de… à…, en secondes), le temps
   pour ferrer (fenetre), et la chance de chaque rareté parmi les poissons présents (poids).
   Les ombres (étape 1.6, morceau 3) : au plus max autour du personnage (dont etang à l'étang), dans un rayon de
   rayon cases, près des bords ; chacune reste vie secondes (de… à…) ; un poisson à moins de attire P du bouchon
   vient voir. À régler en jouant. */
export const PECHE = {morsure:[1.5, 5], fenetre:1, poids:{commun:60, peuCommun:28, rare:10, legendaire:1},
  ombres:{max:5, etang:2, rayon:8, vie:[45, 100], attire:2.5}};
/* Où et quand on le trouve, en toutes lettres (le sac, le carnet) */
const EN = {printemps:"au printemps", ete:"en été", automne:"en automne", hiver:"en hiver"};
export const quandPoisson = p => [p.saisons.length === 4 ? "toute l'année" : p.saisons.map(s => EN[s]).join(", ").replace(/, ([^,]*)$/, " et $1"),
  p.meteo === "orage" ? "" : HEURES[p.heures].nom, p.meteo ? METEOS[p.meteo] : ""].filter(Boolean).join(", ");
export const ouPoisson = p => (p.lieu === "mer" ? "en mer" : "à l'étang") + (p.depuis === "ponton" ? ", depuis le ponton" : p.depuis === "barque" ? ", au large en barque" : "");
/* Le dessin d'un poisson, pour le sac, les coffres et le carnet (à la place d'un emoji, pour les reconnaître) ;
   l'écrevisse et l'encornet gardent leur emoji */
const hex = c => "#" + c.toString(16).padStart(6, "0");
for(const p of Object.values(POISSONS)){
  const r = RARETES[p.rarete];
  p.usage = `${p.note}. ${r[0].toUpperCase() + r.slice(1)}, ${ouPoisson(p)} : ${quandPoisson(p)}. De ${p.taille[0]} à ${p.taille[1]} cm.` +
    (p.rarete === "legendaire" ? " Une seule prise dans tout le jeu." : "");
  p.emoji = p.forme === "crustace" ? "🦞" : p.forme === "calmar" ? "🦑" : "🐟";
  if(p.forme === "crustace" || p.forme === "calmar") continue;
  const ry = {long:3, fin:4.4, rond:7}[p.forme] || 5.6, rx = p.forme === "long" ? 13 : 11, a = Math.max(3, ry * .9), c = hex(p.couleur);
  p.icone = `<svg class="ico-poisson${p.rarete === "legendaire" ? " legende" : ""}" viewBox="0 0 32 20" aria-hidden="true">` +
    `<polygon points="${2 * rx - 1},10 31,${10 - a} 31,${10 + a}" fill="${c}" stroke="#1C2230" stroke-opacity=".35"/>` +
    `<ellipse cx="${rx + 1}" cy="10" rx="${rx}" ry="${ry}" fill="${c}" stroke="#1C2230" stroke-opacity=".35"/>` +
    `<circle cx="5.5" cy="${10 - ry * .3}" r="1.5" fill="#1C2230"/></svg>`;
}

/* Les insectes de l'île (étape 1.7, morceau 1), d'après le Grand Carnet (page « Insectes », île revue avec Yo le
   5 octobre 2026 : des petites bêtes toute l'année, certaines seulement à leur saison). On les attrape au filet,
   en s'approchant à pas de loup. Chacun : où le trouver (ou : fleurs, herbes, arbres, sol, pierres, etang,
   lanternes ; le premier compte pour le carnet), ses saisons, ses heures (HEURES), sa rareté, son comportement
   (note, du carnet), son prix en or au comptoir, sa forme et ses couleurs (son dessin et son modèle).
   bocal : il se prend au bocal (carnet), pas au filet. Sur l'île, aucun insecte n'est dangereux (carnet). */
export const INSECTES = {
  pieride:  {nom:"Piéride blanche", pluriel:"piérides blanches", une:true, ou:["fleurs"], saisons:["printemps", "ete", "automne"], heures:"jour", rarete:"commun", prix:1, forme:"papillon", couleur:0xF4F2E8, c2:0x3A3A3A, note:"Elle volette de fleur en fleur"},
  abeille:  {nom:"Abeille", pluriel:"abeilles", une:true, ou:["fleurs"], saisons:["printemps", "ete", "automne"], heures:"jour", rarete:"commun", prix:1, forme:"bourdon", couleur:0xE8B73A, c2:0x3A2A1A, taille:.75, note:"Elle butine, puis repart vers sa ruche"},
  bourdon:  {nom:"Bourdon", pluriel:"bourdons", ou:["fleurs"], saisons:["printemps", "ete", "automne"], heures:"jour", rarete:"commun", prix:1, forme:"bourdon", couleur:0x2E2A26, c2:0xF0C83A, note:"Gros et velu, il bourdonne de fleur en fleur"},
  coccinelle:{nom:"Coccinelle", pluriel:"coccinelles", une:true, ou:["fleurs", "arbres"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:1, forme:"coleo", couleur:0xD8392B, c2:0x1C1C1C, note:"Lente, facile à attraper ; l'hiver, blottie sous l'écorce"},
  fourmi:   {nom:"Fourmi", pluriel:"fourmis", une:true, ou:["sol"], saisons:TOUTE, heures:"toujours", rarete:"commun", prix:1, forme:"fourmi", couleur:0x3A2A22, note:"Elle marche en file indienne"},
  cloporte: {nom:"Cloporte", pluriel:"cloportes", ou:["pierres"], saisons:TOUTE, heures:"toujours", rarete:"commun", prix:1, forme:"cloporte", couleur:0x7A7F86, note:"Il se roule en boule quand on le touche"},
  perceOreille:{nom:"Perce-oreille", pluriel:"perce-oreilles", ou:["pierres", "arbres"], saisons:TOUTE, heures:"nuit", rarete:"commun", prix:1, forme:"cloporte", couleur:0x6B3A22, note:"Deux pinces au bout du ventre"},
  sauterelle:{nom:"Sauterelle", pluriel:"sauterelles", une:true, ou:["herbes"], saisons:["ete", "automne"], heures:"jour", rarete:"commun", prix:1, forme:"sauteur", couleur:0x6FB04A, note:"Elle saute quand on approche"},
  grillon:  {nom:"Grillon", pluriel:"grillons", ou:["herbes"], saisons:["ete", "automne"], heures:"soir", rarete:"commun", prix:1, forme:"sauteur", couleur:0x3A2A1A, note:"Il chante, et se tait si on approche"},
  libellule:{nom:"Libellule", pluriel:"libellules", une:true, ou:["etang"], saisons:["printemps", "ete", "automne"], heures:"jour", rarete:"commun", prix:1, forme:"libellule", couleur:0x3E8FD0, note:"Vol rapide ; elle se pose sur les roseaux"},
  hanneton: {nom:"Hanneton", pluriel:"hannetons", ou:["arbres"], saisons:["printemps"], heures:"soir", rarete:"commun", prix:1, forme:"coleo", couleur:0x8A5A2A, note:"Vol maladroit et bourdonnant"},
  punaise:  {nom:"Punaise verte", pluriel:"punaises vertes", une:true, ou:["arbres"], saisons:["automne", "hiver"], heures:"jour", rarete:"commun", prix:1, forme:"coleo", couleur:0x5E8E3A, note:"Elle brunit en automne et cherche un abri pour l'hiver"},
  luciole:  {nom:"Luciole", pluriel:"lucioles", une:true, ou:["herbes"], saisons:["ete"], heures:"nuit", rarete:"peuCommun", prix:3, forme:"coleo", couleur:0x5A5A3A, c2:0xD8F05A, bocal:true, note:"Elle s'allume et s'éteint"},
  paonDuJour:{nom:"Paon-du-jour", pluriel:"paons-du-jour", ou:["fleurs"], saisons:["printemps", "ete", "automne"], heures:"jour", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0xB8402E, c2:0x3E6FD0, note:"Grands yeux dessinés sur les ailes"},
  machaon:  {nom:"Machaon", pluriel:"machaons", ou:["fleurs"], saisons:["printemps", "ete"], heures:"jour", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0xF0D040, c2:0x2A2A2A, taille:1.25, note:"Grand papillon jaune et noir"},
  vulcain:  {nom:"Vulcain", pluriel:"vulcains", ou:["fleurs"], saisons:["ete", "automne"], heures:"jour", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0x2A2626, c2:0xE8732E, note:"Ailes noires barrées d'orange"},
  citron:   {nom:"Citron", pluriel:"citrons", ou:["fleurs"], saisons:["hiver", "printemps"], heures:"jour", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0xF2E35A, c2:0xE8A33A, note:"Le premier papillon de l'année, jaune soufre"},
  sphinx:   {nom:"Sphinx", pluriel:"sphinx", ou:["lanternes"], saisons:["ete"], heures:"nuit", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0x8A7A6A, c2:0xD86A8A, note:"Papillon de nuit attiré par la lumière"},
  phalene:  {nom:"Phalène d'hiver", pluriel:"phalènes d'hiver", une:true, ou:["lanternes"], saisons:["hiver"], heures:"nuit", rarete:"peuCommun", prix:3, forme:"papillon", couleur:0xB8B0A0, c2:0x8A8270, note:"Papillon de nuit qui vole même quand il gèle"},
  cigale:   {nom:"Cigale", pluriel:"cigales", une:true, ou:["arbres"], saisons:["ete"], heures:"apresMidi", rarete:"peuCommun", prix:3, forme:"cigale", couleur:0x6A6A4A, note:"Elle chante fort et se cache dans l'écorce"},
  mante:    {nom:"Mante religieuse", pluriel:"mantes religieuses", une:true, ou:["herbes"], saisons:["ete", "automne"], heures:"jour", rarete:"peuCommun", prix:3, forme:"mante", couleur:0x7FC05A, note:"Immobile, les pattes jointes"},
  epeire:   {nom:"Épeire des jardins", pluriel:"épeires des jardins", une:true, ou:["arbres"], saisons:["ete", "automne"], heures:"matin", rarete:"peuCommun", prix:3, forme:"araignee", couleur:0xB0803A, c2:0xFFFFFF, note:"Une croix blanche sur le dos ; sa toile brille de rosée"},
  grandPaon:{nom:"Grand Paon de nuit", pluriel:"Grands Paons de nuit", ou:["lanternes"], saisons:["printemps"], heures:"nuit", rarete:"rare", prix:8, forme:"papillon", couleur:0x9A8A7A, c2:0x3A2A2A, taille:1.6, note:"Le plus grand papillon d'Europe"}
};
export const OU_INSECTE = {fleurs:"sur les fleurs", herbes:"dans les herbes", arbres:"sur les arbres", sol:"au sol", pierres:"sous les pierres", etang:"au bord de l'étang", lanternes:"autour des lanternes"};
/* Le dessin de chaque insecte (sac, coffres, carnet), selon sa forme, à ses couleurs */
const ins = b => `<svg class="ico-insecte" viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`, AILE = "#DDEFF7", NOIR = "#2A2A2A";
const DESSIN = {
  papillon: (c, d) => ins(`<ellipse cx="7.3" cy="8.5" rx="5" ry="4.6" fill="${c}" stroke="#1C2230" stroke-opacity=".4"/><ellipse cx="16.7" cy="8.5" rx="5" ry="4.6" fill="${c}" stroke="#1C2230" stroke-opacity=".4"/>` +
    `<ellipse cx="8.4" cy="16" rx="3.7" ry="3.3" fill="${c}" stroke="#1C2230" stroke-opacity=".4"/><ellipse cx="15.6" cy="16" rx="3.7" ry="3.3" fill="${c}" stroke="#1C2230" stroke-opacity=".4"/>` +
    `<circle cx="7.3" cy="8.5" r="1.7" fill="${d}"/><circle cx="16.7" cy="8.5" r="1.7" fill="${d}"/><rect x="11.2" y="5" width="1.6" height="15" rx=".8" fill="${NOIR}"/>`),
  coleo: (c, d, glow) => ins(`<circle cx="12" cy="6.3" r="3" fill="${NOIR}"/><ellipse cx="12" cy="14" rx="6.5" ry="7" fill="${c}" stroke="#1C2230" stroke-opacity=".4"/><path d="M12 7.5v13" stroke="#1C2230" stroke-opacity=".5"/>` +
    (glow ? `<ellipse cx="12" cy="18.5" rx="4.2" ry="2.6" fill="${d}"/>` : d ? `<circle cx="9.3" cy="12" r="1.3" fill="${d}"/><circle cx="14.7" cy="12" r="1.3" fill="${d}"/><circle cx="9.8" cy="16.5" r="1.1" fill="${d}"/><circle cx="14.2" cy="16.5" r="1.1" fill="${d}"/>` : "")),
  bourdon: (c, d) => ins(`<ellipse cx="7" cy="8" rx="4" ry="2.6" fill="${AILE}"/><ellipse cx="17" cy="8" rx="4" ry="2.6" fill="${AILE}"/><ellipse cx="12" cy="13.5" rx="5.5" ry="7" fill="${c}"/>` +
    `<path d="M7 11.5h10M6.6 15h10.8M7.6 18.5h8.8" stroke="${d}" stroke-width="2"/>`),
  fourmi: c => ins(`<circle cx="12" cy="5" r="2.5" fill="${c}"/><circle cx="12" cy="10.5" r="2.3" fill="${c}"/><ellipse cx="12" cy="17" rx="3.4" ry="4.2" fill="${c}"/>` +
    `<path d="M9.5 10l-4-2M14.5 10l4-2M9.5 11.5l-4 2M14.5 11.5l4 2M10 13l-3 4M14 13l3 4" stroke="${c}" stroke-width="1.2"/>`),
  sauteur: c => ins(`<ellipse cx="11" cy="12" rx="8" ry="3" fill="${c}"/><circle cx="3.8" cy="11" r="2.2" fill="${c}"/><path d="M13 14l5 5M16 13l5 4M9 14l-2 5" stroke="${c}" stroke-width="1.4"/><path d="M3 9L1 4M4.5 9L5 4" stroke="${NOIR}" stroke-width=".8"/>`),
  libellule: c => ins(`<ellipse cx="7" cy="8" rx="5.5" ry="2" fill="${AILE}" transform="rotate(-15 7 8)"/><ellipse cx="17" cy="8" rx="5.5" ry="2" fill="${AILE}" transform="rotate(15 17 8)"/>` +
    `<ellipse cx="7.5" cy="11.5" rx="5" ry="1.8" fill="${AILE}"/><ellipse cx="16.5" cy="11.5" rx="5" ry="1.8" fill="${AILE}"/><rect x="11" y="6" width="2" height="16" rx="1" fill="${c}"/><circle cx="12" cy="5" r="2" fill="${c}"/>`),
  araignee: (c, d) => ins(`<path d="M12 12L3 6M12 12L2 11M12 12L3 16M12 12L5 21M12 12L21 6M12 12L22 11M12 12L21 16M12 12L19 21" stroke="#3A2A1A" stroke-width="1.2"/>` +
    `<circle cx="12" cy="8.5" r="2.6" fill="${c}"/><circle cx="12" cy="14" r="4.5" fill="${c}"/><path d="M12 11.5v5M10 14h4" stroke="${d}" stroke-width="1.1"/>`),
  cloporte: c => ins(`<ellipse cx="12" cy="12" rx="6" ry="8.5" fill="${c}"/><path d="M6.4 9h11.2M6 12h12M6.4 15h11.2M7.5 18h9" stroke="#1C2230" stroke-opacity=".45"/>`),
  mante: c => ins(`<path d="M12 22V9" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><path d="M12 11l-4-4M8 7l-1 3M12 11l4-4M16 7l1 3M12 15l-5 4M12 15l5 4" stroke="${c}" stroke-width="1.4"/><path d="M10 6.5l2-2.5l2 2.5z" fill="${c}"/>`),
  cigale: c => ins(`<ellipse cx="8" cy="13" rx="4.5" ry="8" fill="${AILE}" transform="rotate(12 8 13)"/><ellipse cx="16" cy="13" rx="4.5" ry="8" fill="${AILE}" transform="rotate(-12 16 13)"/><ellipse cx="12" cy="11" rx="3.6" ry="6" fill="${c}"/><circle cx="12" cy="5" r="2.6" fill="${c}"/>`)
};
const EMOJI_INSECTE = {papillon:"🦋", coleo:"🪲", bourdon:"🐝", fourmi:"🐜", sauteur:"🦗", libellule:"🦋", araignee:"🕷️", cloporte:"🪲", mante:"🦗", cigale:"🪲"};
for(const [k, p] of Object.entries(INSECTES)){
  const r = RARETES[p.rarete];
  p.usage = `${p.note}. ${r[0].toUpperCase() + r.slice(1)}, ${p.ou.map(o => OU_INSECTE[o]).join(" ou ")} : ${quandPoisson(p)}.` + (p.bocal ? " Elle se prend au bocal, pas au filet." : "");
  p.emoji = k === "coccinelle" ? "🐞" : EMOJI_INSECTE[p.forme];
  const c = hex(p.couleur), d = p.c2 !== undefined ? hex(p.c2) : null;
  p.icone = DESSIN[p.forme](c, p.forme === "coleo" ? d : d || NOIR, p.bocal);
}

/* Les oiseaux de l'île (étape 1.7, morceau 2), d'après le Grand Carnet (page « Les oiseaux », l'île) : on
   s'approche doucement d'un oiseau posé, puis on lance le filet ; s'il s'envole, il se repose souvent un peu
   plus loin. Chacun : où le trouver (ou : sol, arbres, buissons, toits, plage, etang ; en attendant la ferme, la
   chouette se pose sur les arbres et les toits ; la cigogne sur les toits, faute de cheminées dehors), ses
   saisons, ses heures, sa rareté, son comportement (note, du carnet), son prix au comptoir, sa forme
   (passereau, echassier, rapace) et ses couleurs (corps, tête, poitrine, bec). Plus tard (carnet) : la mangeoire,
   le nichoir et les chants. */
export const OISEAUX = {
  moineau:  {nom:"Moineau", pluriel:"moineaux", ou:["sol"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0x9A7A5A, tete:0x6B5040, poitrine:0xD8C8B0, bec:0x3A3A3A, note:"Il picore les miettes et s'envole en groupe"},
  mesange:  {nom:"Mésange charbonnière", pluriel:"mésanges charbonnières", une:true, ou:["arbres", "buissons"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0x7FA05A, tete:0x1C1C1C, poitrine:0xF0D84A, bec:0x2A2A2A, note:"Acrobate, souvent la tête en bas"},
  rougeGorge:{nom:"Rouge-gorge", pluriel:"rouges-gorges", ou:["sol", "buissons"], saisons:["automne", "hiver"], heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0x8A6A4A, tete:0x8A6A4A, poitrine:0xE8703A, bec:0x2A2A2A, note:"Il suit le jardinier pour attraper les vers"},
  merle:    {nom:"Merle", pluriel:"merles", ou:["sol"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0x222222, tete:0x222222, poitrine:0x2E2E2E, bec:0xF0A030, taille:1.2, note:"Il chante au crépuscule"},
  pie:      {nom:"Pie", pluriel:"pies", une:true, ou:["arbres", "sol"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0x1E1E1E, tete:0x1E1E1E, poitrine:0xF4F4F4, bec:0x1E1E1E, taille:1.4, queue:1.8, note:"Elle chaparde ce qui brille"},
  mouette:  {nom:"Mouette", pluriel:"mouettes", une:true, ou:["plage"], saisons:TOUTE, heures:"jour", rarete:"commun", prix:2, forme:"passereau", couleur:0xB8C0C8, tete:0xF4F4F4, poitrine:0xF4F4F4, bec:0xE8B83A, taille:1.6, note:"Elle plane au-dessus du ponton"},
  hirondelle:{nom:"Hirondelle", pluriel:"hirondelles", une:true, ou:["toits"], saisons:["printemps", "ete"], heures:"jour", rarete:"peuCommun", prix:4, forme:"passereau", couleur:0x1E2A4A, tete:0x1E2A4A, poitrine:0xF4F0E8, bec:0x1E1E1E, queue:1.5, note:"Elle vole en rase-mottes avant la pluie"},
  heron:    {nom:"Héron cendré", pluriel:"hérons cendrés", ou:["etang"], saisons:TOUTE, heures:"jour", rarete:"peuCommun", prix:4, forme:"echassier", couleur:0xA8B0B8, tete:0xF0F0F0, poitrine:0xE0E4E8, bec:0xE8C84A, note:"Immobile, il guette les poissons"},
  chouette: {nom:"Chouette effraie", pluriel:"chouettes effraies", une:true, ou:["arbres", "toits"], saisons:TOUTE, heures:"nuit", rarete:"peuCommun", prix:4, forme:"rapace", couleur:0xC8A060, tete:0xF4ECDC, poitrine:0xF8F0E0, bec:0xD8C8A8, note:"Son vol est silencieux"},
  rossignol:{nom:"Rossignol", pluriel:"rossignols", ou:["buissons"], saisons:["printemps"], heures:"nuit", rarete:"peuCommun", prix:4, forme:"passereau", couleur:0x8A6A4A, tete:0x8A6A4A, poitrine:0xD8C8B0, bec:0x5A4A3A, note:"Il chante dans le noir"},
  martinPecheur:{nom:"Martin-pêcheur", pluriel:"martins-pêcheurs", ou:["etang"], saisons:["printemps", "ete"], heures:"jour", rarete:"rare", prix:10, forme:"passereau", couleur:0x2E8FD0, tete:0x2E8FD0, poitrine:0xE8782E, bec:0x1E1E1E, note:"Un éclair bleu qui plonge dans l'eau"},
  cigogne:  {nom:"Cigogne", pluriel:"cigognes", une:true, ou:["toits"], saisons:["printemps"], heures:"jour", rarete:"rare", prix:10, forme:"echassier", couleur:0xF4F4F4, tete:0xF4F4F4, poitrine:0xF4F4F4, bec:0xE0503A, ailes:0x1E1E1E, note:"Elle construit son nid sur les toits"}
};
export const OU_OISEAU = {sol:"au sol et dans le jardin", arbres:"dans les arbres", buissons:"dans les haies et les buissons", toits:"sur les toits", plage:"au bord de la mer", etang:"au bord de l'étang"};
/* Le dessin de chaque oiseau, selon sa forme, à ses couleurs */
const DESSIN_OISEAU = {
  passereau: (c, t, p, b) => `<svg class="ico-insecte" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14l6-2 0 4z" fill="${c}"/><ellipse cx="12" cy="13.5" rx="7" ry="5" fill="${c}" stroke="#1C2230" stroke-opacity=".35"/>` +
    `<ellipse cx="14" cy="15.5" rx="4.2" ry="2.8" fill="${p}"/><circle cx="17.5" cy="8.5" r="3.6" fill="${t}" stroke="#1C2230" stroke-opacity=".35"/><path d="M20.8 8l2.7 1-2.7 1z" fill="${b}"/>` +
    `<circle cx="18.6" cy="7.8" r=".9" fill="#1C1C1C"/><path d="M11 18.5v3M14 18.5v3" stroke="#8A6A4A" stroke-width="1"/></svg>`,
  echassier: (c, t, p, b) => `<svg class="ico-insecte" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 15v8M12 15v8" stroke="${b}" stroke-width="1"/><ellipse cx="10" cy="12" rx="6" ry="3.6" fill="${c}" stroke="#1C2230" stroke-opacity=".35"/>` +
    `<path d="M14 11 Q18 9 17 3" stroke="${p}" stroke-width="2.4" fill="none"/><circle cx="17" cy="3.2" r="2.2" fill="${t}"/><path d="M19 3l4.5 1.2-4.5.8z" fill="${b}"/><circle cx="17.6" cy="2.7" r=".7" fill="#1C1C1C"/></svg>`,
  rapace: (c, t, p, b) => `<svg class="ico-insecte" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="15" rx="6.5" ry="7" fill="${c}" stroke="#1C2230" stroke-opacity=".35"/>` +
    `<ellipse cx="12" cy="16" rx="4" ry="5" fill="${p}"/><circle cx="12" cy="8" r="5" fill="${t}" stroke="#1C2230" stroke-opacity=".35"/><circle cx="10" cy="7.6" r="1.1" fill="#1C1C1C"/><circle cx="14" cy="7.6" r="1.1" fill="#1C1C1C"/><path d="M11.3 9.3h1.4l-.7 1.6z" fill="${b}"/></svg>`
};
for(const p of Object.values(OISEAUX)){
  const r = RARETES[p.rarete];
  p.usage = `${p.note}. ${r[0].toUpperCase() + r.slice(1)}, ${p.ou.map(o => OU_OISEAU[o]).join(" ou ")} : ${quandPoisson(p)}.`;
  p.emoji = p.forme === "rapace" ? "🦉" : p.forme === "echassier" ? "🪶" : "🐦";
  p.icone = DESSIN_OISEAU[p.forme](hex(p.couleur), hex(p.tete), hex(p.poitrine), hex(p.bec));
}

/* Produits fabriqués ou récoltés qui ne sont pas des meubles */
export const PRODUITS = {
  planche:{nom:"Planche", pluriel:"planches", emoji:"🟫", aide:"Les planches se fabriquent à l'établi de la Scierie."},
  bloc:   {nom:"Bloc", pluriel:"blocs", emoji:"🧱", aide:"Les blocs se taillent à la table de taille de la Carrière."},
  fibre:  {nom:"Fibre", pluriel:"fibres", emoji:"🌾", aide:"Les fibres se cueillent sur les herbes hautes."},
  baie:   {nom:"Baie", pluriel:"baies", emoji:"🫐", aide:"Les baies se cueillent sur les buissons de baies."},
  cuivre: {nom:"Cuivre", pluriel:"cuivre", emoji:"🟠", aide:"Le cuivre se mine à la mine, sur les rochers à veines orangées."},
  /* Étape 1.6, d'après le Grand Carnet : le thym des prés de l'île, et le poisson grillé (un poisson + du thym, il soigne).
     prix : en or au comptoir */
  /* Les bois de la Forêt profonde (étape 1.7, demande de Yo : chaque essence donne son bois, comme le dit le Grand
     Carnet ; « chaque bois garde sa teinte dans les objets qu'on en fabrique »). bois : sa couleur. prix : en or */
  boisCharme:{nom:"Bois de charme", pluriel:"bois de charme", emoji:"🪵", bois:0xC8C2B8, prix:1, aide:"Le bois de charme se coupe sur les charmes de la Forêt profonde.",
    usage:"Gris perle. Un bois très dur, pour les manches d'outils (carnet). Il se coupe sur les charmes de la Forêt profonde."},
  boisFrene: {nom:"Bois de frêne", pluriel:"bois de frêne", emoji:"🪵", bois:0xE6D2A0, prix:1, aide:"Le bois de frêne se coupe sur les frênes de la Forêt profonde.",
    usage:"Blond clair. Un bois solide et souple, pour les lances (carnet). Il se coupe sur les frênes de la Forêt profonde."},
  boisIf:    {nom:"Bois d'if", pluriel:"bois d'if", emoji:"🪵", bois:0xC8743C, prix:2, aide:"Le bois d'if se coupe sur les ifs de la Forêt profonde (les arbres sombres et pointus).",
    usage:"Orange cuivré. Un bois souple, pour les arcs (carnet). Il se coupe sur les ifs de la Forêt profonde."},
  boisChene: {nom:"Bois de chêne séculaire", pluriel:"bois de chêne séculaire", emoji:"🪵", bois:0x5E4028, prix:3, aide:"Le bois de chêne séculaire se coupe sur les chênes géants de la Forêt profonde.",
    usage:"Brun profond. Un bois dur (carnet), tiré des géants couverts de mousse de la Forêt profonde."},
  /* Le houx et le sureau n'ont pas de bois (carnet) : on cueille leurs baies et leurs fleurs */
  baiesHoux:  {nom:"Baies de houx", pluriel:"baies de houx", emoji:"🔴", prix:1, aide:"Les baies de houx se cueillent en automne et en hiver, sur les houx de la Forêt profonde.",
    usage:"Des baies rouges et des feuilles piquantes (carnet). Elles se cueillent en automne et en hiver."},
  fleursSureau:{nom:"Fleurs de sureau", pluriel:"fleurs de sureau", emoji:"🌼", prix:1, aide:"Les fleurs de sureau se cueillent au printemps et en été, sur les sureaux de la Forêt profonde.",
    usage:"Des fleurs pour les potions (carnet). Elles se cueillent au printemps et en été."},
  baiesSureau:{nom:"Baies de sureau", pluriel:"baies de sureau", emoji:"🫐", prix:1, aide:"Les baies de sureau se cueillent en automne, sur les sureaux de la Forêt profonde.",
    usage:"Des baies noires pour les potions (carnet). Elles se cueillent en automne."},
  thym:   {nom:"Brin de thym", pluriel:"brins de thym", emoji:"🌿", aide:"Le thym se cueille dans les prés de l'île (les touffes basses aux fleurs mauves).",
    icone:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V5M12 15l-5-5M12 12l5-5M12 18l4-3" stroke="#4E6B3A" stroke-width="1.6" fill="none" stroke-linecap="round"/><g fill="#7E9C66"><ellipse cx="8" cy="10.5" rx="2.4" ry="1.3"/><ellipse cx="16" cy="7.5" rx="2.4" ry="1.3"/><ellipse cx="15.5" cy="14.5" rx="2.2" ry="1.2"/><ellipse cx="10" cy="17" rx="2.2" ry="1.2"/></g><g fill="#B79AD6"><circle cx="12" cy="4" r="1.8"/><circle cx="6.5" cy="8.5" r="1.4"/><circle cx="17.5" cy="6" r="1.4"/></g></svg>',
    usage:"Une herbe aromatique des prés de l'île, toute l'année. Pour la cuisine (le poisson grillé) et, plus tard, des potions douces."},
  poissonGrille:{nom:"Poisson grillé", pluriel:"poissons grillés", emoji:"🍢", prix:3, aide:"Le poisson grillé se cuisine au fourneau de la Taverne : un poisson et un brin de thym.",
    icone:'<svg class="ico-poisson" viewBox="0 0 32 20" aria-hidden="true"><polygon points="21,10 31,5 31,15" fill="#B9733A" stroke="#1C2230" stroke-opacity=".35"/><ellipse cx="12" cy="10" rx="11" ry="5.6" fill="#C98A4B" stroke="#1C2230" stroke-opacity=".35"/><path d="M8 5.5v9M12 4.5v11M16 5.5v9" stroke="#5A3418" stroke-width="1.4" stroke-linecap="round"/><circle cx="5.5" cy="8.3" r="1.5" fill="#1C2230"/><g fill="#7E9C66"><ellipse cx="19" cy="4" rx="2" ry="1"/><ellipse cx="21.5" cy="5.5" rx="1.8" ry=".9"/></g></svg>',
    usage:"Il soigne : il servira dans la grotte (étape 1.8). Se cuisine au fourneau de la Taverne (un poisson et un brin de thym) ; se vend 3 or au comptoir."}
};
/* Plans de travail, par bâtiment : le meuble qui le représente dans la pièce, son prix pour le
   construire (cost, demande de Yo : il n'est pas gratuit), son nom avec article (le ; fem : nom féminin),
   à quoi il sert (pour) et ses recettes. vente : le plan de travail vend au lieu de fabriquer (comptoir).
   Recette : ce qu'elle donne (out, n exemplaires), ses ingrédients (in), son temps en secondes (t)
   et le niveau du bâtiment qu'il faut (lvl). Chiffres à régler en jouant. */
export const ATELIERS = {
  scierie:{nom:"Établi", le:"l'établi", emoji:"🪚", meuble:"etabli", cost:{bois:8}, pour:"fabriquer des planches et des meubles en bois", recettes:[
    {out:"planche", n:2, in:{bois:1}, t:5, lvl:1, cat:"Matériaux"},
    /* Outils de départ ; le fil de la canne à pêche est en fibres */
    {out:"hachePierre", in:{planche:3, pierre:2}, t:30, lvl:1, cat:"Outils"},
    {out:"piochePierre", in:{planche:3, pierre:3}, t:30, lvl:1, cat:"Outils"},
    {out:"arrosoir", in:{planche:3, pierre:1}, t:30, lvl:1, cat:"Outils"},
    {out:"canneBois", in:{planche:4, fibre:3}, t:40, lvl:1, cat:"Outils"},
    {out:"filet", in:{planche:2, fibre:4}, t:40, lvl:1, cat:"Outils"},
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
  chaumiere:{nom:"Atelier de décoration", le:"l'atelier de décoration", emoji:"🧵", meuble:"atelierDeco", cost:{planche:6, fibre:4},
    pour:"fabriquer des pots de fleurs, des lanternes et des tapis", recettes:[
    {out:"pot", in:{pierre:2}, t:20, lvl:1},
    {out:"lanterne", in:{planche:2, or:1}, t:30, lvl:1},
    /* Tapis en fibres, comme le prévoit la bible (étape 1.5) */
    {out:"petitTapis", in:{fibre:6}, t:40, lvl:1},
    {out:"grandTapis", in:{fibre:10, or:1}, t:60, lvl:2}
  ]},
  carriere:{nom:"Table de taille", le:"la table de taille", fem:true, emoji:"⛏️", meuble:"tableTaille", cost:{pierre:10, planche:4},
    pour:"tailler des blocs, des statues et des cheminées", recettes:[
    {out:"bloc", n:2, in:{pierre:1}, t:5, lvl:1},
    {out:"statue", in:{bloc:3}, t:40, lvl:1},
    {out:"cheminee", in:{bloc:6, planche:2}, t:90, lvl:2}
  ]},
  marche:{nom:"Comptoir", le:"le comptoir", emoji:"⚖️", meuble:"comptoir", cost:{planche:10, bloc:5}, vente:true,
    pour:"vendre ton surplus contre de l'or", recettes:[
    {out:"or", in:{bois:6}, lvl:1, cat:"Matériaux"},          /* vendu tout de suite (demande de Yo, v1.6.5) */
    {out:"or", in:{pierre:6}, lvl:1, cat:"Matériaux"},
    {out:"or", in:{planche:10}, lvl:1, cat:"Matériaux"},
    {out:"or", in:{bloc:10}, lvl:1, cat:"Matériaux"}
  ]},
  /* Plans de travail en attente : posés, recettes affichées mais verrouillées (lock = la raison),
     en attendant ce qu'il leur faut. note : une phrase de plus en haut de leur fiche. */
  taverne:{nom:"Fourneau", le:"le fourneau", emoji:"🍲", meuble:"fourneau", cost:{bloc:10, planche:5},
    pour:"cuisiner des plats qui donnent des bonus", note:"Pour l'instant, le poisson grillé ; les autres plats se découvriront en essayant des ingrédients.", recettes:[
    /* Le poisson grillé (Grand Carnet : un poisson + du thym) : « poisson » = n'importe lequel, sauf un légendaire (GROUPES) */
    {out:"poissonGrille", in:{poisson:1, thym:1}, t:30, lvl:1},
    {nom:"Ragoût de gibier", emoji:"🍖", lock:"Arrive avec la chasse"},
    {nom:"Tarte aux fruits", emoji:"🥧", lock:"Arrive avec la cueillette"}
  ]},
  forge:{nom:"Enclume", le:"l'enclume", fem:true, emoji:"⚒️", meuble:"enclume", cost:{bloc:10, cuivre:5},
    pour:"forger des outils et des armes en métal", recettes:[
    {out:"piocheCuivre", in:{cuivre:4, planche:2}, t:60, lvl:1},
    {out:"hacheCuivre", in:{cuivre:4, planche:2}, t:60, lvl:1},
    {out:"epeeCuivre", in:{cuivre:5, planche:1}, t:60, lvl:1}
  ]},
  chateau:{nom:"Trône", le:"le trône", emoji:"👑", meuble:"trone", cost:{planche:20, or:10}, titre:"Grands chantiers",
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
/* Les dessins des bois, des graines, des baies et des fleurs de la forêt */
{
  const c = v => "#" + v.toString(16).padStart(6, "0");
  for(const p of Object.values(PRODUITS)) if(p.bois !== undefined)
    p.icone = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="5" fill="${c(p.bois)}" stroke="#1C2230" stroke-opacity=".4"/>` +
      `<ellipse cx="18" cy="12" rx="3" ry="5" fill="#F4E8D0" stroke="#1C2230" stroke-opacity=".3"/><ellipse cx="18" cy="12" rx="1.5" ry="2.6" fill="${c(p.bois)}"/></svg>`;
  for(const g of Object.values(GRAINES)) if(g.sachet !== undefined)
    g.icone = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10Q6 21 12 21Q18 21 18 10Z" fill="#EFE6D2" stroke="#8A6B4A" stroke-width="1.2"/>` +
      `<rect x="7" y="7.5" width="10" height="3" rx="1.5" fill="#8A6B4A"/><circle cx="12" cy="15" r="3" fill="${c(g.sachet)}"/></svg>`;
  const grappe = col => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v6M12 6l5-2" stroke="#4E6B3A" stroke-width="1.5" fill="none"/>` +
    [[9, 12], [15, 12], [12, 16], [7.5, 17], [16.5, 17], [12, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${col}" stroke="#1C2230" stroke-opacity=".35"/>`).join("") + `</svg>`;
  PRODUITS.baiesHoux.icone = grappe("#D8342A");
  PRODUITS.baiesSureau.icone = grappe("#3A2A40");
  PRODUITS.fleursSureau.icone = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">` +
    [[12, 6], [7, 10], [17, 10], [9, 15], [15, 15], [12, 19]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#F8F4E8" stroke="#C8B878"/><circle cx="${x}" cy="${y}" r=".9" fill="#E8C84A"/>`).join("") + `</svg>`;
}
/* Des ingrédients « au choix » : poisson = n'importe quel poisson sauf un légendaire ; on prend d'abord les
   moins précieux (membres, du moins cher au plus cher) */
export const GROUPES = {poisson:{nom:"Poisson", pluriel:"poissons", emoji:"🐟", aide:"Un poisson, n'importe lequel (sauf un légendaire) : pêche à l'étang ou en mer avec une canne à pêche."}};
export const membres = g => g === "poisson" ? Object.keys(POISSONS).filter(k => POISSONS[k].rarete !== "legendaire").sort((a, b) => POISSONS[a].prix - POISSONS[b].prix) : [];
export const objet = k => RES[k] || PRODUITS[k] || OUTILS[k] || GRAINES[k] || POSABLES[k] || POISSONS[k] || INSECTES[k] || OISEAUX[k] || GROUPES[k] || MEUBLES[k];
/* Son image dans le sac, les coffres et le carnet : un dessin pour les poissons, sinon son emoji */
export const icone = k => objet(k).icone || objet(k).emoji;
