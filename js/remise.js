/* ================= La remise à neuf de la décoration (Yo, 10 novembre 2026) =================
   « Je veux que tu me retires tous les objets de ma partie en cours. Je veux tout replacer à neuf. Garde uniquement les plans
   de travail et les coffres vides » ; « tout leur contenu » : une seule fois, au chargement d'une partie déjà commencée (elle
   a des bâtiments ; une partie neuve est seulement marquée) : les objets de décoration posés dans les pièces, sur l'île et sur
   les façades sont retirés, avec ce qui était posé dedans (chandelles, bûches, fleurs, poissons…) ; ceux du sac et des cases
   rapides aussi ; les plans de travail et les coffres restent, les coffres vidés de tout leur contenu ; les sols et les murs
   posés restent. Le bouton 🎁 (performance.js) repart de zéro : il redonne un exemplaire de chaque objet, une seule fois. */
import { MEUBLES } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { map, setObj } from "./monde/ile.js";

const garder = it => MEUBLES[it.type] && (MEUBLES[it.type].plan || it.type === "coffre" || it.reserve);
const decoration = k => !!MEUBLES[k] && !MEUBLES[k].plan && k !== "coffre";
/* Pour la vérification : la même remise, sur la partie d'essai ; rend ce qui a été retiré */
export function remiseANeuf(){
  let pieces = 0, ile = 0, facades = 0, rangés = 0;
  const refaites = [];
  for(const b of state.buildings){
    if(b.deco && b.deco.items){ const n = b.deco.items.length; b.deco.items = b.deco.items.filter(garder); pieces += n - b.deco.items.length; }
    if(b.facade && b.facade.length){ facades += b.facade.length; b.facade = []; refaites.push(b); }
  }
  for(let i = 0; i < map.obj.length; i++) if(decoration(map.obj[i])){ setObj(i, null); ile++; }
  for(const co of state.coffres) co.items = [];
  const vider = l => l.forEach((it, j) => { if(it && decoration(it.k)){ rangés += it.n || 1; l[j] = null; } });
  vider(state.barre);
  const avant = state.sac.length; state.sac = state.sac.filter(it => !decoration(it.k)); rangés += avant - state.sac.length;
  if(decoration(state.main)) state.main = null;                       // l'objet tenu en main n'existe plus
  state.cadeaux = {};
  if(refaites.length) import("./monde/batiments.js").then(m => refaites.forEach(m.placeMesh));   // les façades refaites
  return {pieces, ile, facades, rangés};
}
if(!state.remiseNeuve){
  if(state.buildings.length) remiseANeuf();
  state.remiseNeuve = 1; save();
}
