/* ================= Sauvegarde =================
   La partie est gardée dans le navigateur du téléphone. */
import { RES, B } from "./donnees.js";

const SAVE_KEY = "le-village-v2-ile", OLD_KEY = "le-village-proto-v1";
function fresh(){ return {v:2, seed:7, res:{bois:15, pierre:8, or:6}, buildings:[], nextId:1, player:{x:.5, z:.5}, crowned:false}; }
function load(){
  try{
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if(s && s.v === 2 && s.res && Array.isArray(s.buildings)) return s;
  }catch(e){}
  return null;
}
function migrate(){
  try{
    const o = JSON.parse(localStorage.getItem(OLD_KEY));
    if(!o || !o.res) return null;
    const s = fresh();
    for(const r of Object.keys(RES)) s.res[r] = (o.res[r] || 0);
    (o.grid || []).forEach(c => {
      if(!c || !B[c.type]) return;
      for(const [r,v] of Object.entries(B[c.type].cost)) s.res[r] += v * c.lvl;
    });
    return s;
  }catch(e){ return null; }
}
export function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){} }
export function eraseSave(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_KEY); }catch(_){} }

export let state, migrated = false;
{
  const saved = load();
  if(saved) state = saved;
  else { const m = migrate(); if(m){ state = m; migrated = true; save(); } else state = fresh(); }
}
