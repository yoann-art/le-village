/* ================= Sauvegarde =================
   La partie est gardée dans le navigateur du téléphone. */
import { RES, B, ATELIERS } from "./donnees.js";

const SAVE_KEY = "le-village-v2-ile", OLD_KEY = "le-village-proto-v1";
function fresh(){ return {v:3, seed:7, res:{bois:15, pierre:8, or:6}, stock:{}, sac:[], buildings:[], nextId:1, player:{x:.5, z:.5}, crowned:false, peauNeuve:true}; }
function read(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(e){ return null; } }
function load(){
  const s = read(SAVE_KEY);
  return s && s.v === 3 && s.res && Array.isArray(s.buildings) ? s : null;
}
/* Tout ce que le joueur a payé pour un bâtiment : construction et améliorations
   (même calcul que upCost dans regles.js) */
function refund(res, type, lvl){
  for(const [r,v] of Object.entries(B[type].cost)){
    res[r] += v;
    for(let l = 1; l < lvl; l++) res[r] += Math.ceil(v * 1.5 * l);
  }
}
/* Partie d'une ancienne version : on garde les ressources, on rembourse les bâtiments */
function migrate(){
  try{
    const o = read(SAVE_KEY);
    if(o && o.v === 2 && o.res && Array.isArray(o.buildings)){
      const s = fresh();
      for(const r of Object.keys(RES)) s.res[r] = (o.res[r] || 0);
      o.buildings.forEach(b => { if(b && B[b.type]) refund(s.res, b.type, b.lvl); });
      return {s, msg: o.buildings.length ? "L'île a grandi et tout est à la bonne taille : tes bâtiments sont remboursés, repose-les où tu veux." : null};
    }
  }catch(e){}
  try{
    const o = read(OLD_KEY);
    if(!o || !o.res) return null;
    const s = fresh();
    for(const r of Object.keys(RES)) s.res[r] = (o.res[r] || 0);
    (o.grid || []).forEach(c => {
      if(!c || !B[c.type]) return;
      for(const [r,v] of Object.entries(B[c.type].cost)) s.res[r] += v * c.lvl;
    });
    return {s, msg:"Tes ressources du prototype sont récupérées, et tes anciens bâtiments remboursés."};
  }catch(e){ return null; }
}
export function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
export function eraseSave(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_KEY); }catch(_){} }

export let state, migrationMsg = null;
{
  const saved = load();
  if(saved) state = saved;
  else { const m = migrate(); if(m){ state = m.s; migrationMsg = m.msg; save(); } else state = fresh(); }
  if(!state.stock) state.stock = {};               // réserve (étape 1.3) : absente des parties plus anciennes
  if(!state.sac) state.sac = [];                   // sac à dos (étape 1.4)
  /* Peau neuve (demande de Yo, 1er octobre 2026), une seule fois : tous les meubles posés sont retirés.
     Les bâtiments, les couleurs des pièces, la réserve et les fabrications en cours restent ;
     un plan de travail retiré est remboursé. */
  if(!state.peauNeuve){
    let n = 0, plans = 0;
    for(const b of state.buildings){
      const items = b.deco && b.deco.items;
      if(!items || !items.length) continue;
      for(const it of items){
        const a = ATELIERS[b.type];
        if(a && it.type === a.meuble){ plans++; for(const [r, v] of Object.entries(a.cost)) state.res[r] += v; }
        n++;
      }
      b.deco.items = [];
    }
    state.peauNeuve = true;
    if(n) migrationMsg = `Peau neuve : tous les meubles posés ont été retirés${plans ? " (plans de travail remboursés)" : ""}. Tes bâtiments sont toujours là.`;
    save();
  }
}
