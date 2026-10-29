/* ================= Sauvegarde =================
   La partie est gardée dans le navigateur du téléphone.
   Format 4 (1er octobre 2026, décidé avec Yo) : une île plus grande et une partie qui commence sans rien ;
   les parties plus anciennes repartent de zéro (le jeu le dit une fois). */
import { OUTILS, POSABLES, MEUBLES, SAC, reglerHemisphere } from "./donnees.js";
const SAVE_KEY = "le-village-v2-ile", OLD_KEY = "le-village-proto-v1";
/* Une partie neuve : sac vide, bourse vide ; on ramasse ce qu'on trouve au sol pour commencer */
function fresh(){
  return {v:4, seed:7, res:{or:0}, sac:[], coffres:[], barre:[null, null, null], main:null, eau:0, ile:{},
    buildings:[], nextId:1, player:{x:.5, z:.5}, crowned:false, carnet:{poissons:{}, insectes:{}, oiseaux:{}, gibier:{}, monstres:{}}, terrain:{}, chemins:{},
    entreeMine:"eboulee",                                    // l'entrée de la mine à déblayer puis construire (étape 1.11)
    ileN: ILE};                                              // la taille de l'île (étape 2.1 : la grande île)
}
/* L'île agrandie (étape 2.1, 14 octobre 2026 ; Yo : « une île plus ou moins équivalente à celle d'Animal Crossing »,
   et pour sa partie : « La garder ») : la case (x, z) de l'île de `ancien` cases de côté devient la case (x + d, z + d)
   de la grande île, au même endroit du monde. On garde le village : les bâtiments, les chemins, ce qu'on a planté ou
   posé (rochers rapportés, coffres, lumières), l'eau creusée ou comblée. La nature autour est nouvelle : ce qu'on avait
   coupé, cueilli ou miné dans la nature est oublié, le bois et les cailloux au sol reviennent avec le jour suivant. Le
   ponton, le pont de la forêt et son orée se reposent au bord de la nouvelle côte (ponton.js, foret.js) */
export const ILE = 96;
export function agrandirIle(s, ancien = 56){
  const d = (ILE - ancien) / 2, cle = i => (Math.floor(+i / ancien) + d) * ILE + (+i % ancien) + d;
  const decale = o => { const r = {}; for(const [i, v] of Object.entries(o || {})) r[cle(i)] = v; return r; };
  const pose = o => o === "coffre" || Object.values(POSABLES).some(p => p.pose === o) || !!(MEUBLES[o] && MEUBLES[o].dehors);
  const ile = {};
  for(const [i, c] of Object.entries(s.ile || {})) if(c.plante || pose(c.o) || (s.terrain && s.terrain[i] !== undefined)) ile[cle(i)] = c;
  s.ile = ile; s.terrain = decale(s.terrain); s.chemins = decale(s.chemins);
  if(s.sol){ s.sol = {}; s.solJour = "avant"; }
  for(const co of s.coffres || []) if(co.i !== undefined) co.i = cle(co.i);
  s.buildings = (s.buildings || []).filter(b => b.type !== "foret");
  for(const b of s.buildings){ b.x += d; b.z += d; }
  delete s.ponton; delete s.pontForet;
  s.ileN = ILE;
  return s;
}
function read(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(e){ return null; } }
export function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
export function eraseSave(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_KEY); }catch(_){} }

export let state, migrationMsg = null;
{
  const s = read(SAVE_KEY);
  if(s && s.v === 4 && s.res && Array.isArray(s.buildings)) state = s;
  else {
    state = fresh();
    if(s || read(OLD_KEY)){
      migrationMsg = "Nouvelle île, plus grande : ta partie repart de zéro. Ramasse les morceaux de bois et les cailloux, cueille des herbes hautes, puis bâtis ta Scierie.";
      try{ localStorage.removeItem(OLD_KEY); }catch(_){}
    }
    save();
  }
  if(state.ileN !== ILE){                                    // une partie commencée sur la petite île (56 × 56)
    agrandirIle(state, state.ileN || 56);
    migrationMsg = "🏝️ Ton île s'est agrandie ! Ton village est resté à sa place ; tout autour, une nature nouvelle à explorer. Le ponton et le pont de la Forêt profonde sont au bord de la nouvelle côte.";
    save();
  }
  /* Le carnet de collection (étape 1.6) : les parties commencées avant n'en ont pas encore */
  if(!state.carnet) state.carnet = {poissons:{}};
  if(!state.carnet.insectes) state.carnet.insectes = {};     // étape 1.7
  if(!state.carnet.oiseaux) state.carnet.oiseaux = {};
  if(!state.carnet.gibier) state.carnet.gibier = {};        // étape 1.7, morceau 5
  if(!state.carnet.monstres) state.carnet.monstres = {};    // étape 1.8, morceau 3
  if(!state.terrain) state.terrain = {};                    // étape 1.9 : les cases creusées ou comblées
  if(!state.chemins) state.chemins = {};                    // étape 1.9, morceau 2 : les chemins {case: sorte}
  if(!state.sacNiveau) state.sacNiveau = 0;
  /* Les pièces repartent en terre battue et torchis clair (Yo, 29 octobre 2026 : « Les parties en cours repartent en terre
     battue et torchis (les meubles restent en place) ») : les couleurs de l'ancienne palette s'en vont */
  for(const b of state.buildings) if(b.deco){ delete b.deco.wall; delete b.deco.floor; }                 // demande de Yo (11 octobre 2026) : le sac qui s'agrandit (SACS)
  reglerHemisphere(state.hemisphere);
  /* Un buisson vide garde l'heure où il a été cueilli (étape 1.10, morceau 4 : la pluie qui tombe ensuite l'arrose) */
  for(const c of Object.values(state.ile)) if(c.vide === true) c.vide = Date.now();                       // étape 1.10 : « nord » ou « sud », demandé une fois (saisons.js)
  /* Les cases rapides (demande de Yo, v1.7.6) : elles gardaient le nom d'un objet du sac ; elles gardent
     maintenant l'objet lui-même, sorti du sac (un outil, ou une pile de graines…) */
  state.barre = state.barre.map(k => {
    if(typeof k !== "string") return k;
    const pile = OUTILS[k] ? OUTILS[k].pile || 1 : POSABLES[k] && POSABLES[k].seul ? 1 : SAC.pile;
    let n = 0;
    for(let j = state.sac.length - 1; j >= 0 && n < pile; j--){
      const it = state.sac[j];
      if(it.k !== k) continue;
      const m = Math.min(it.n, pile - n); it.n -= m; n += m;
      if(!it.n) state.sac.splice(j, 1);
    }
    return n ? {k, n} : null;
  });
}
