/* ================= Ce qu'on trouve au sol =================
   Des morceaux de bois (à côté des arbres) et des petits cailloux, qu'on ramasse à la main (demande de Yo) :
   de quoi fabriquer sa première hache et sa première pioche. Il en revient un de chaque toutes les
   SOL_RETOUR secondes, avec l'horloge du téléphone, jusqu'au maximum. On marche dessus.
   state.sol = {case: "branche" | "caillou"} ; state.solT = l'heure du dernier retour. */
import { scene } from "./scene.js";
import { G, part } from "./formes.js";
import { map, idx, inb, N, centerOf } from "./ile.js";
import { occ } from "./batiments.js";
import { state, save } from "../sauvegarde.js";
import { doorTile } from "../regles.js";
import { SOL, SOL_RETOUR } from "../donnees.js";

const meshes = new Map();
function build(i){
  const k = state.sol[i], r = Math.random(), g = new THREE.Group();
  if(k === "branche"){
    const b = part(G.cyl, 0x8A5A3B, .1, .62, .1, 0, .06, 0); b.rotation.z = Math.PI/2; g.add(b);   // le morceau de bois couché
    const t = part(G.cyl, 0x8A5A3B, .06, .24, .06, .12, .1, .08); t.rotation.set(Math.PI/2, 0, .7); g.add(t);   // une petite branche
    g.add(part(G.leaf2, 0x57B25C, .3, .3, .3, -.24, .1, -.02));                       // une feuille
  } else {
    g.add(part(G.dode, 0x9EA3A8, .44, .3, .42, 0, .1, 0));
    g.add(part(G.dode, 0x8F959B, .26, .2, .26, .22, .07, .14));
  }
  g.rotation.y = r * 6.28;
  g.position.set(centerOf(i % N), 0, centerOf(Math.floor(i / N)));
  scene.add(g); meshes.set(i, g);
}
function remove(i){
  const g = meshes.get(i);
  if(g){ scene.remove(g); meshes.delete(i); }
  delete state.sol[i];
}

/* Une case où il peut apparaître : la bonne sorte de sol, rien dessus, pas un bâtiment ni la case d'une porte */
const NEAR = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
function spot(k){
  const d = SOL[k], doors = new Set(state.buildings.map(b => { const [x, z] = doorTile(b.type, b.x, b.z); return idx(x, z); }));
  const ok = [];
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z);
    if(!d.sols.includes(map.type[i]) || map.obj[i] || occ.has(i) || doors.has(i) || state.sol[i]) continue;
    if(d.pres && !NEAR.some(([dx, dz]) => inb(x + dx, z + dz) && map.obj[idx(x + dx, z + dz)] === d.pres)) continue;
    ok.push(i);
  }
  return ok.length ? ok[Math.floor(Math.random() * ok.length)] : null;
}
const count = k => Object.values(state.sol).filter(v => v === k).length;
function spawn(k){
  if(count(k) >= SOL[k].max) return;
  const i = spot(k);
  if(i === null) return;
  state.sol[i] = k; build(i);
}

/* Ce qui est revenu depuis la dernière fois (aussi jeu fermé) ; un objet recouvert par un bâtiment disparaît */
function update(){
  for(const i of Object.keys(state.sol)) if(occ.has(+i) || map.obj[+i]) remove(+i);
  const now = Date.now();
  if(Object.keys(SOL).every(t => count(t) >= SOL[t].max)){ state.solT = now; return; }   // tout est là : le compte repart d'ici
  const n = Math.floor((now - state.solT) / (SOL_RETOUR * 1000));
  if(n <= 0) return;
  for(let k = 0; k < n; k++) for(const t of Object.keys(SOL)) spawn(t);
  state.solT += n * SOL_RETOUR * 1000;
  save();
}

/* Ce qui est au sol sur une case (ou undefined) ; ramasser l'enlève */
export const solAt = i => state.sol[i];
export function pickUp(i){
  const k = state.sol[i];
  if(!k) return null;
  remove(i); save();
  return k;
}

/* Au démarrage : la toute première fois, l'île reçoit tout ce qu'il faut ; sinon, ce qui est revenu */
if(!state.sol){
  state.sol = {}; state.solT = Date.now();
  for(const t of Object.keys(SOL)) for(let k = 0; k < SOL[t].max; k++) spawn(t);
  save();
} else {
  for(const i of Object.keys(state.sol)) build(+i);
  update();
}
setInterval(update, 30000);
