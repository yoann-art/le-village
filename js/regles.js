/* ================= Règles =================
   Coûts, niveaux, bonus et étoiles. */
import { RES, B } from "./donnees.js";
import { state } from "./sauvegarde.js";

export const sizeOf = t => B[t].size || 1;
export const maxLvl = t => B[t].unique ? 1 : 3;
export function upCost(t, lvl){
  const c = {};
  for(const [r,v] of Object.entries(B[t].cost)) c[r] = Math.ceil(v * 1.5 * lvl);
  return c;
}
export const canAfford = c => Object.entries(c).every(([r,v]) => state.res[r] >= v);
export function pay(c){ for(const [r,v] of Object.entries(c)) state.res[r] -= v; }
export const totalStars = () => state.buildings.reduce((s,b) => s + B[b.type].stars * b.lvl, 0);
export function mult(r){
  let m = 1;
  for(const b of state.buildings){
    const d = B[b.type];
    if(d.bonus && d.bonus.res === r) m += d.bonus.pct * b.lvl / 100;
    if(d.all) m += d.all * b.lvl / 100;
  }
  return m;
}
export const pct = r => Math.round((mult(r) - 1) * 100);
export const costHTML = c => Object.entries(c).map(([r,v]) =>
  `<span class="chip ${state.res[r] >= v ? "" : "short"}">${RES[r].emoji} ${v}</span>`).join("");
