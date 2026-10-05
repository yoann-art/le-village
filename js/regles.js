/* ================= Règles =================
   Coûts, niveaux, bonus et étoiles. */
import { RES, B, OUTILS, POSABLES, SAC, COFFRE, GROUPES, membres, objet } from "./donnees.js";
import { state } from "./sauvegarde.js";

export const sizeOf = t => B[t].size || 1;
/* La case juste devant la porte d'un bâtiment posé en (x, z) : elle doit rester libre */
export const doorTile = (t, x, z) => [x + Math.floor(sizeOf(t)/2 + (B[t].door || 0)), z + sizeOf(t)];
/* Côté de la pièce intérieure, en P : elle grandit de 1 P à chaque niveau */
const ROOM = {petite:4, moyenne:6, grande:8};
export const roomSide = (t, lvl) => ROOM[B[t].taille] + (lvl - 1);

/* Ce qu'on possède (demande de Yo) : l'or dans la bourse (state.res.or) ; tout le reste dans le sac
   (state.sac) et dans les coffres de réserve posés au village (state.coffres[].items). On fabrique et on
   construit avec le sac et les coffres ensemble ; la récolte va dans le sac, et on range soi-même dans un coffre. */
const BOURSE = "or";
/* Des emplacements (le sac, un coffre) : [{k, n}], au plus cap emplacements ; un outil prend un emplacement
   à lui seul, le reste s'empile jusqu'à SAC.pile */
export const pileOf = k => OUTILS[k] || (POSABLES[k] && POSABLES[k].seul) ? 1 : SAC.pile;   // un outil, un rocher : seul dans son emplacement
export const slotsCount = (list, k) => list.reduce((c, it) => c + (it.k === k ? it.n : 0), 0);
/* Combien de k peuvent encore entrer */
export function slotsPlace(list, cap, k){
  const p = pileOf(k);
  return list.reduce((n, it) => n + (it.k === k ? p - it.n : 0), Math.max(0, cap - list.length) * p);
}
/* Ajoute n objets k ; renvoie combien sont entrés */
export function slotsAdd(list, cap, k, n){
  const p = pileOf(k);
  let left = n;
  for(const it of list) if(it.k === k && it.n < p && left > 0){ const m = Math.min(p - it.n, left); it.n += m; left -= m; }
  while(left > 0 && list.length < cap){ const m = Math.min(p, left); list.push({k, n: m}); left -= m; }
  return n - left;
}
/* Retire n objets k (en commençant par la dernière pile) ; renvoie combien ont été retirés */
export function slotsTake(list, k, n){
  let left = n;
  for(let i = list.length - 1; i >= 0 && left > 0; i--){
    const it = list[i];
    if(it.k !== k) continue;
    const m = Math.min(it.n, left); it.n -= m; left -= m;
    if(!it.n) list.splice(i, 1);
  }
  return n - left;
}
export const sacCount = k => slotsCount(state.sac, k);
export const sacPlace = k => slotsPlace(state.sac, SAC.places, k);
export const sacAdd = (k, n) => slotsAdd(state.sac, SAC.places, k, n);
export const sacTake = (k, n) => slotsTake(state.sac, k, n);
export const coffresCount = k => state.coffres.reduce((c, co) => c + slotsCount(co.items, k), 0);
/* La place pour k dans le sac et tous les coffres */
export const placeFor = k => k === BOURSE ? Infinity : sacPlace(k) + state.coffres.reduce((n, co) => n + slotsPlace(co.items, COFFRE.places, k), 0);
export const owned = k => k === BOURSE ? state.res.or : GROUPES[k] ? membres(k).reduce((n, m) => n + owned(m), 0) : sacCount(k) + coffresCount(k);
/* n > 0 : ajoute dans le sac, puis dans les coffres (renvoie {sac, coffre, reste} : ce qui n'a pas trouvé de place) ;
   n < 0 : retire du sac, puis des coffres */
export function addOwned(k, n){
  if(k === BOURSE){ state.res.or += n; return {sac: 0, coffre: 0, reste: 0, bourse: n}; }
  if(n < 0){
    let left = -n - sacTake(k, -n);
    for(const co of state.coffres){ if(left <= 0) break; left -= slotsTake(co.items, k, left); }
    return {sac: 0, coffre: 0, reste: 0};
  }
  const sac = sacAdd(k, n);
  let left = n - sac, coffre = 0;
  for(const co of state.coffres){ if(left <= 0) break; const m = slotsAdd(co.items, COFFRE.places, k, left); coffre += m; left -= m; }
  return {sac, coffre, reste: left};
}
export const hasAll = need => Object.entries(need).every(([k, v]) => owned(k) >= v);
/* File d'attente d'un plan de travail : 3 places au niveau 1, une de plus par niveau */
export const queueSlots = lvl => 2 + lvl;
export const maxLvl = t => B[t].unique || B[t].fixe ? 1 : 3;
export function upCost(t, lvl){
  const c = {};
  for(const [r,v] of Object.entries(B[t].cost)) c[r] = Math.ceil(v * 1.5 * lvl);
  return c;
}
export const canAfford = hasAll;
export function pay(c){ for(const [r,v] of Object.entries(c)) addOwned(r, -v); }
/* Paie des ingrédients et renvoie ce qui a vraiment été pris : un groupe (« un poisson ») prend d'abord les
   moins précieux de ses membres ; on garde le détail pour rendre exactement les mêmes si on annule */
export function payer(need){
  const pris = {}, note = (k, n) => { pris[k] = (pris[k] || 0) + n; };
  for(const [k, v] of Object.entries(need)){
    if(!GROUPES[k]){ addOwned(k, -v); note(k, v); continue; }
    let reste = v;
    for(const m of membres(k)){
      if(reste <= 0) break;
      const n = Math.min(reste, owned(m));
      if(n > 0){ addOwned(m, -n); note(m, n); reste -= n; }
    }
  }
  return pris;
}
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
  `<span class="chip ${owned(r) >= v ? "" : "short"}">${objet(r).emoji} ${v}</span>`).join("");
/* Ce qui manque pour un prix, avec d'où ça vient (une phrase par matière) */
export const missingHTML = c => Object.entries(c).filter(([r, v]) => owned(r) < v).map(([r]) => objet(r).aide).filter(Boolean).join(" ");
