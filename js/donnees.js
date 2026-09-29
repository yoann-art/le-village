/* ================= Données du jeu =================
   Les chiffres qu'on règle : ressources, bâtiments, mini-jeux. */
export const RES = {
  bois:   {emoji:"🪵", nom:"bois"},
  pierre: {emoji:"🪨", nom:"pierre"},
  or:     {emoji:"🪙", nom:"or"}
};
/* size : côté du carré de cases (en P) ; door : décalage de la porte sur la façade (en P, − vers la gauche) */
export const B = {
  chaumiere:{nom:"Chaumière", emoji:"🛖", cost:{bois:8, pierre:3}, stars:1, size:3, door:0, desc:"Loge des villageois. Rapporte des étoiles."},
  scierie:  {nom:"Scierie", emoji:"🪚", cost:{bois:10, or:4}, stars:1, size:3, door:-.45, bonus:{res:"bois", pct:25}, desc:"+25 % de bois au Bûcheron, par niveau."},
  carriere: {nom:"Carrière", emoji:"⛏️", cost:{bois:12, or:5}, stars:1, size:3, door:-.45, bonus:{res:"pierre", pct:25}, desc:"+25 % de pierre à la Carrière, par niveau."},
  marche:   {nom:"Marché", emoji:"⚖️", cost:{bois:12, pierre:10}, stars:2, size:4, door:0, bonus:{res:"or", pct:25}, desc:"+25 % d'or aux Runes, par niveau."},
  taverne:  {nom:"Taverne", emoji:"🍺", cost:{bois:18, pierre:12, or:10}, stars:3, size:4, door:0, all:10, desc:"+10 % sur toutes les récoltes, par niveau."},
  forge:    {nom:"Forge", emoji:"⚒️", cost:{pierre:22, or:8}, stars:3, size:3, door:-.4, desc:"Le forgeron équipe le village. Beaucoup d'étoiles."},
  chateau:  {nom:"Château", emoji:"🏰", cost:{bois:45, pierre:60, or:40}, stars:10, unique:true, size:4, door:0, desc:"Le cœur du village. Il couronne ta partie."}
};
export const ORDER = ["chaumiere","scierie","carriere","marche","taverne","forge","chateau"];
export const GAMES = {
  bucheron:{nom:"Le Bûcheron", cat:"Adresse", color:"sinople", emoji:"🪓", res:"bois", gain:"du bois",
    rules:"Frappe quand le curseur passe dans la zone verte. Au centre doré, c'est un coup parfait. 8 coups."},
  carriere:{nom:"La Carrière", cat:"Réflexes", color:"gueules", emoji:"⛏️", res:"pierre", gain:"de la pierre",
    rules:"Touche les pierres avant qu'elles disparaissent. Une gemme vaut 3. Les chauves-souris te volent 2 pierres. 20 secondes."},
  runes:{nom:"Les Runes", cat:"Mémoire", color:"azur", emoji:"🔮", res:"or", gain:"de l'or",
    rules:"Regarde la suite de runes, puis reproduis-la. Elle s'allonge à chaque manche. Chaque manche réussie rapporte 2 pièces."}
};
