/* ================= Sauvegarde =================
   La partie est gardée dans le navigateur du téléphone.
   Format 4 (1er octobre 2026, décidé avec Yo) : une île plus grande et une partie qui commence sans rien ;
   les parties plus anciennes repartent de zéro (le jeu le dit une fois). */
const SAVE_KEY = "le-village-v2-ile", OLD_KEY = "le-village-proto-v1";
/* Une partie neuve : sac vide, bourse vide ; on ramasse ce qu'on trouve au sol pour commencer */
function fresh(){
  return {v:4, seed:7, res:{or:0}, sac:[], coffres:[], barre:[null, null, null], main:null, eau:0, ile:{},
    buildings:[], nextId:1, player:{x:.5, z:.5}, crowned:false, carnet:{poissons:{}}};
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
  /* Le carnet de collection (étape 1.6) : les parties commencées avant n'en ont pas encore */
  if(!state.carnet) state.carnet = {poissons:{}};
}
