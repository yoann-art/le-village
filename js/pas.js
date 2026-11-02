/* ================= Les pas =================
   Les sons, étape 2b (choix de Yo, 2 novembre 2026, sur la page d'écoute) : à chaque pas (personnage.js, quandPas), le son
   du sol sous les pieds. Les sols :
   - sur l'île : l'herbe (la neige quand elle blanchit l'herbe, l'hiver), le sable, les chemins (terre, gravier, planches ;
     pavés, granit et marbre : la pierre), le ponton et le pont (le bois) ;
   - dans une pièce : la terre battue du départ, le parquet (le bois), le dallage (la pierre), case par case ;
   - la mine et la grotte : la pierre ; la forêt : la mousse (l'herbe ; les feuilles mortes en automne, la neige l'hiver),
     ses sentiers (la terre), ses ponts (le bois) ; le Marais : la vase (la boue), ses passerelles et l'embarcadère (le bois) ;
   - en barque, pendant un trajet : pas de pas. */
import { saison } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { quandPas, player } from "./monde/personnage.js";
import { map, idx, inb, tileOf } from "./monde/ile.js";
import { passageCases } from "./monde/ponton.js";
import { foret, ftile } from "./monde/foret.js";
import { marais, mtile } from "./monde/marais.js";
import { solDe } from "./monde/interieurs.js";
import { neigeAuSol } from "./monde/meteo.js";
import { currentPlace } from "./lieux.js";
import { enBarque } from "./barque.js";
import { jouer } from "./sons.js";

const CHEMIN = {terre: "Terre", gravier: "Gravier", planches: "Bois", paves: "Pierre", granit: "Pierre", marbre: "Pierre"};
const MOTIF = {terre: "Terre", lames: "Bois", dalles: "Pierre"};
const herbe = () => neigeAuSol() > .3 ? "Neige" : "Herbe";

/* Le sol sous les pieds (null : pas de pas) ; exporté pour la vérification */
export function solSousLesPieds(){
  if(enBarque()) return null;
  const p = player.position, place = currentPlace();
  if(!place){
    const x = tileOf(p.x), z = tileOf(p.z);
    if(!inb(x, z)) return null;
    const i = idx(x, z);
    if(passageCases.has(i)) return "Bois";
    if(state.chemins[i]) return CHEMIN[state.chemins[i]] || "Terre";
    return map.type[i] === "sand" ? "Sable" : map.type[i] === "grass" ? herbe() : null;
  }
  const {b, room} = place;
  if(b.type === "trajet") return null;
  if(b.type === "mine" || b.type === "grotte") return "Pierre";
  if(b.type === "foret"){
    const t = foret.type[ftile(p.x, p.z)];
    return t === "sentier" ? "Terre" : t === "pont" ? "Bois" : neigeAuSol() > .3 ? "Neige" : saison() === "automne" ? "Feuilles" : "Herbe";
  }
  if(b.type === "marais"){
    const t = marais.type[mtile(p.x, p.z)];
    return t === "passerelle" || t === "embarcadere" ? "Bois" : "Eau";
  }
  const x = Math.floor(p.x + room.w / 2), z = Math.floor(p.z + room.d / 2);   // une pièce : sa case
  return MOTIF[solDe(b.deco, x, z).motif] || "Terre";
}

/* Un pas : le son du sol, à peine plus fort quand on marche vite ; un pas de fond (il ne fait taire ni un clic ni un message) */
quandPas(mag => { const s = solSousLesPieds(); if(s) jouer("pas" + s, {vol: .75 + .25 * mag, fond: true}); });
