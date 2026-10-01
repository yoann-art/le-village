/* ================= Données du jeu =================
   Les chiffres qu'on règle : ressources, bâtiments, mini-jeux. */
export const RES = {
  bois:   {emoji:"🪵", nom:"bois", pluriel:"bois", le:"Le bois"},
  pierre: {emoji:"🪨", nom:"pierre", pluriel:"pierres", le:"La pierre"},
  or:     {emoji:"🪙", nom:"or", pluriel:"or", le:"L'or"}
};
/* size : côté du carré de cases dehors (en P) ; door : décalage de la porte sur la façade (en P, − vers la gauche) ;
   taille : taille de la pièce intérieure selon la bible (petite, moyenne, grande) */
export const B = {
  chaumiere:{nom:"Chaumière", emoji:"🛖", cost:{bois:8, pierre:3}, stars:1, size:3, door:0, taille:"moyenne", desc:"Loge des villageois. Rapporte des étoiles."},
  scierie:  {nom:"Scierie", emoji:"🪚", cost:{bois:10, or:4}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"bois", pct:25}, desc:"+25 % de bois au Bûcheron, par niveau."},
  carriere: {nom:"Carrière", emoji:"⛏️", cost:{bois:12, or:5}, stars:1, size:3, door:-.45, taille:"moyenne", bonus:{res:"pierre", pct:25}, desc:"+25 % de pierre à la Carrière, par niveau."},
  marche:   {nom:"Marché", emoji:"⚖️", cost:{bois:12, pierre:10}, stars:2, size:4, door:0, taille:"grande", bonus:{res:"or", pct:25}, desc:"+25 % d'or aux Runes, par niveau."},
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
  comptoir: {nom:"Comptoir", emoji:"⚖️", gabarit:"grand", w:2.2, d:.9, plan:true}
};

/* Produits fabriqués qui ne sont pas des meubles (gardés dans la réserve) */
export const PRODUITS = {
  planche:{nom:"Planche", pluriel:"planches", emoji:"🟫"},
  bloc:   {nom:"Bloc", pluriel:"blocs", emoji:"🧱"}
};
/* Plans de travail, par bâtiment : le meuble qui le représente dans la pièce, son prix pour le
   construire (cost, demande de Yo : il n'est pas gratuit), son nom avec article (le ; fem : nom féminin),
   à quoi il sert (pour) et ses recettes. vente : le plan de travail vend au lieu de fabriquer (comptoir).
   Recette : ce qu'elle donne (out, n exemplaires), ses ingrédients (in), son temps en secondes (t)
   et le niveau du bâtiment qu'il faut (lvl). Chiffres à régler en jouant. */
export const ATELIERS = {
  scierie:{nom:"Établi", le:"l'établi", emoji:"🪚", meuble:"etabli", cost:{bois:10}, pour:"fabriquer des planches et des meubles en bois", recettes:[
    {out:"planche", n:2, in:{bois:1}, t:5, lvl:1},
    {out:"tabouret", in:{planche:2}, t:20, lvl:1},
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
    /* Tapis : ingrédients provisoires (bois et or), remplacés par les fibres à l'étape 1.5 */
    {out:"petitTapis", in:{bois:2, or:1}, t:40, lvl:1},
    {out:"grandTapis", in:{bois:3, or:2}, t:60, lvl:2}
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
  ]}
};
/* Pour chaque objet fabriqué (meuble ou produit) : le bâtiment dont l'atelier le fabrique */
export const FABRIQUE_A = {};
for(const [b, a] of Object.entries(ATELIERS)) for(const r of a.recettes) if(!RES[r.out]) FABRIQUE_A[r.out] = b;
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
export const GAMES = {
  bucheron:{nom:"Le Bûcheron", cat:"Adresse", color:"sinople", emoji:"🪓", res:"bois", gain:"du bois",
    rules:"Frappe quand le curseur passe dans la zone verte. Au centre doré, c'est un coup parfait. 8 coups."},
  carriere:{nom:"La Carrière", cat:"Réflexes", color:"gueules", emoji:"⛏️", res:"pierre", gain:"de la pierre",
    rules:"Touche les pierres avant qu'elles disparaissent. Une gemme vaut 3. Les chauves-souris te volent 2 pierres. 20 secondes."},
  runes:{nom:"Les Runes", cat:"Mémoire", color:"azur", emoji:"🔮", res:"or", gain:"de l'or",
    rules:"Regarde la suite de runes, puis reproduis-la. Elle s'allonge à chaque manche. Chaque manche réussie rapporte 2 pièces."}
};
