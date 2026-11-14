/* ================= La remise à neuf de la décoration (Yo, 10 novembre 2026) =================
   « Je veux que tu me retires tous les objets de ma partie en cours. Je veux tout replacer à neuf. Garde uniquement les plans
   de travail et les coffres vides » ; « tout leur contenu » : une seule fois, au chargement d'une partie déjà commencée (elle
   a des bâtiments ; une partie neuve est seulement marquée) : les objets de décoration posés dans les pièces, sur l'île et sur
   les façades sont retirés, avec ce qui était posé dedans (chandelles, bûches, fleurs, poissons…) ; ceux du sac et des cases
   rapides aussi ; les plans de travail et les coffres restent, les coffres vidés de tout leur contenu ; les sols et les murs
   posés restent. Le bouton 🎁 (performance.js) repart de zéro : il redonne un exemplaire de chaque objet, une seule fois. */
import { MEUBLES, garniDe, garniRendu } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { map, setObj } from "./monde/ile.js";
import { addOwned, roomSide, ancienRoomSide, agrandirPiece, maxLvl } from "./regles.js";
import { B } from "./donnees.js";
import { placeMesh, porteLibre } from "./monde/batiments.js";

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

/* Le lustre et le lampadaire retirés de la partie (Yo, 12 novembre 2026 : « Retire le lustre du jeu car le rendu visuel dans le
   jeu n'est pas beau comme on ne voit pas le plafond dans les pièces » ; « Retire également le lampadaire de la partie en cours » ;
   « Retire sans rien me rendre ») : gardés pour une mise à jour ou un événement (plusTard, donnees.js). Une fois : ceux des
   pièces, de l'île, du sac, des cases rapides et des coffres sont retirés, sans rendre leur prix ; les chandelles posées dans un
   lustre reviennent (dans le sac, sinon un coffre). Rend ce qui a été retiré (pour la vérification) */
export const RETIRES = ["lustre", "lampadaire"];
export function retirerLustreLampadaire(){
  let n = 0, chandelles = 0;
  const part = k => RETIRES.includes(k);
  for(const b of state.buildings) if(b.deco && b.deco.items){
    for(const it of b.deco.items) if(part(it.type)){ n++; const g = garniDe(it.type, it); if(g){ const c = garniRendu(it.type, it); addOwned(g, c); chandelles += c; } }
    b.deco.items = b.deco.items.filter(it => !part(it.type));
  }
  for(let i = 0; i < map.obj.length; i++) if(part(map.obj[i])){ setObj(i, null); n++; }
  const vider = l => l.forEach((it, j) => { if(it && part(it.k)){ n += it.n || 1; l[j] = null; } });
  vider(state.barre);
  for(const co of state.coffres) co.items = co.items.filter(it => { if(it && part(it.k)){ n += it.n || 1; return false; } return true; });
  state.sac = state.sac.filter(it => { if(it && part(it.k)){ n += it.n || 1; return false; } return true; });
  if(part(state.main)) state.main = null;
  return {n, chandelles};
}
if(!state.sansLustre){
  if(state.buildings.length) retirerLustreLampadaire();
  state.sansLustre = 1; save();
}
/* Les pièces plus grandes (v2.1.243, Yo, 13 novembre 2026) : une fois, les bâtiments déjà améliorés passent de l'ancienne taille
   (une case par niveau) à la nouvelle (deux cases), ce qui est accroché aux murs suit son mur */
if(!state.piecesAgrandies){
  for(const b of state.buildings) if(!B[b.type].fixe && b.lvl > 1) agrandirPiece(b, ancienRoomSide(b.type, b.lvl), roomSide(b.type, b.lvl));
  state.piecesAgrandies = 1; save();
}
/* Les bâtiments de niveau 2 refaits d'après les images de Yo (13 novembre 2026 : « je veux que tu me les mettes directement au
   niveau 2 dans le jeu sans que j'aie à récupérer les ressources ») : une fois par bâtiment, celui de la partie passe au niveau 2,
   sans rien payer, comme une amélioration (ses meubles, son plan de travail, ce qu'il fabrique restent) */
export const NIVEAU2_FAITS = ["scierie", "carriere", "forge", "taverne", "chaumiere", "marche", "chateau"];
export function monterAuNiveau2(){
  const faits = state.niveau2 || (state.niveau2 = {}), montes = [];
  for(const t of NIVEAU2_FAITS){
    if(faits[t]) continue;
    for(const b of state.buildings) if(b.type === t && (b.lvl || 1) < 2 && maxLvl(t) >= 2){
      { const l0 = b.lvl || 1; agrandirPiece(b, roomSide(t, l0), roomSide(t, 2)); b.lvl = 2; porteLibre(b, l0); placeMesh(b); montes.push(b); }
    }
    faits[t] = 1;
  }
  save();
  return montes;
}
monterAuNiveau2();
