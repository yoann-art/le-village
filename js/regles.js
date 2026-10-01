/* ================= Règles =================
   Coûts, niveaux, bonus et étoiles. */
import { RES, B, OUTILS, SAC } from "./donnees.js";
import { state } from "./sauvegarde.js";

export const sizeOf = t => B[t].size || 1;
/* La case juste devant la porte d'un bâtiment posé en (x, z) : elle doit rester libre */
export const doorTile = (t, x, z) => [x + Math.floor(sizeOf(t)/2 + (B[t].door || 0)), z + sizeOf(t)];
/* Côté de la pièce intérieure, en P : elle grandit de 1 P à chaque niveau */
const ROOM = {petite:4, moyenne:6, grande:8};
export const roomSide = (t, lvl) => ROOM[B[t].taille] + (lvl - 1);

/* Ce qu'on possède : les ressources (bois, pierre, or) et la réserve (planches, meubles…) */
export const owned = k => k in state.res ? state.res[k] : (state.stock[k] || 0);
export function addOwned(k, n){
  if(k in state.res) state.res[k] += n;
  else state.stock[k] = (state.stock[k] || 0) + n;
}
export const hasAll = need => Object.entries(need).every(([k, v]) => owned(k) >= v);
/* Le sac (state.sac = [{k, n}], au plus SAC.places emplacements) : un outil prend un emplacement
   à lui seul, le reste s'empile jusqu'à SAC.pile. sacAdd renvoie combien sont entrés dans le sac. */
export const sacPile = k => OUTILS[k] ? 1 : SAC.pile;
export const sacCount = k => state.sac.reduce((c, it) => c + (it.k === k ? it.n : 0), 0);
/* Retire n objets k du sac (en commençant par la dernière pile) ; renvoie combien ont été retirés */
export function sacTake(k, n){
  let left = n;
  for(let i = state.sac.length - 1; i >= 0 && left > 0; i--){
    const it = state.sac[i];
    if(it.k !== k) continue;
    const m = Math.min(it.n, left); it.n -= m; left -= m;
    if(!it.n) state.sac.splice(i, 1);
  }
  return n - left;
}
export function sacAdd(k, n){
  const pile = sacPile(k);
  let left = n;
  for(const it of state.sac) if(it.k === k && it.n < pile && left > 0){ const m = Math.min(pile - it.n, left); it.n += m; left -= m; }
  while(left > 0 && state.sac.length < SAC.places){ const m = Math.min(pile, left); state.sac.push({k, n: m}); left -= m; }
  return n - left;
}
/* File d'attente d'un plan de travail : 3 places au niveau 1, une de plus par niveau */
export const queueSlots = lvl => 2 + lvl;
export const maxLvl = t => B[t].unique ? 1 : 3;
export function upCost(t, lvl){
  const c = {};
  for(const [r,v] of Object.entries(B[t].cost)) c[r] = Math.ceil(v * 1.5 * lvl);
  return c;
}
export const canAfford = c => Object.entries(c).every(([r,v]) => state.res[r] >= v);
export function pay(c){ for(const [r,v] of Object.entries(c)) state.res[r] -= v; }
export const totalStars = () => state.buildings.reduce((s,b) => s + B[b.type].stars * b.lvl, 0);
/* Ce que rapporte une récolte ou une vente avec les bonus des bâtiments : la part décimale devient
   une chance d'en avoir un de plus (2 × 1,25 = 2,5 : 2 ou 3, moitié-moitié) */
export function gain(base, r){
  const g = base * mult(r);
  return Math.floor(g) + (Math.random() < g % 1 ? 1 : 0);
}
export function mult(r){
  let m = 1;
  for(const b of state.buildings){
    const d = B[b.type];
    if(d.bonus && d.bonus.res === r) m += d.bonus.pct * b.lvl / 100;
    if(d.all) m += d.all * b.lvl / 100;
  }
  return m;
}
export const costHTML = c => Object.entries(c).map(([r,v]) =>
  `<span class="chip ${state.res[r] >= v ? "" : "short"}">${RES[r].emoji} ${v}</span>`).join("");
