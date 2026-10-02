/* ================= La mine =================
   Demande de Yo : on entre dans la mine. Dehors, une colline rocheuse avec une ouverture étayée de bois :
   un « bâtiment » fixe (B.mine), posé une fois sur l'île, au nord de la place du village. Dedans, une grotte
   paisible aux parois arrondies : un tunnel d'entrée étayé, puis une grande salle autour d'un pilier de roche,
   éclairée de lanternes, avec des rails et un wagonnet. Ses rochers (pierre, veines de cuivre) se renouvellent
   chaque jour, avec l'horloge du téléphone. Pioche en main : on les mine ; mains libres : on prend un rocher
   pour le reposer sur son île (voir recolte.js). Minerais et cristaux rares : la grotte dangereuse (étape 1.8).
   state.mine = {jour, rocks: {case: "rock" | "rockCuivre"}} ; une case = 1 P, comptée dans le plan ci-dessous. */
import { G, part } from "./formes.js";
import { state, save } from "../sauvegarde.js";
import { MINE } from "../donnees.js";
import { doorTile, sizeOf } from "../regles.js";
import { map, idx, inb, N, setObj } from "./ile.js";
import { occ, footprint, placeMesh } from "./batiments.js";
import { rockMesh } from "./rochers.js";

/* Le plan de la grotte, vu de dessus (« . » : sol, « # » : roche) ; l'entrée est en bas, au milieu */
const PLAN = [
  "################",
  "#####......#####",
  "###..........###",
  "##............##",
  "#..............#",
  "#..............#",
  "#......##......#",
  "#......##......#",
  "#..............#",
  "#..............#",
  "##............##",
  "####........####",
  "######....######",
  "######....######",
  "######....######"];
const W = PLAN[0].length, D = PLAN.length;
const floorAt = (x, z) => x >= 0 && z >= 0 && x < W && z < D && PLAN[z][x] === ".";
const cx = x => x - W/2 + .5, cz = z => z - D/2 + .5;
export const mineTile = (wx, wz) => { const x = Math.floor(wx + W/2), z = Math.floor(wz + D/2); return x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1; };
/* Ce qui occupe une case en plus des rochers : le wagonnet et les caisses */
const WAGON = 9 * W + 4, CAISSES = [10 * W + 3, 10 * W + 12];
const blocked = new Set([WAGON, ...CAISSES]);
/* Les rails : au milieu, du tunnel jusqu'au pilier (on n'y pose pas de rocher) */
const RAILS = t => { const x = t % W, z = Math.floor(t / W); return (x === 7 || x === 8) && z >= 8; };

/* ----- Les rochers du jour ----- */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function rand(seed){ let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function renew(){
  if(state.mine && state.mine.jour === today()) return;
  const rnd = rand([...today()].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7));
  const spots = [];
  for(let z = 0; z <= 10; z++) for(let x = 0; x < W; x++){ const t = z * W + x; if(floorAt(x, z) && !blocked.has(t) && !RAILS(t)) spots.push(t); }
  for(let i = spots.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  const rocks = {};
  spots.slice(0, MINE.rochers).forEach((t, k) => { rocks[t] = k < MINE.cuivre ? "rockCuivre" : "rock"; });
  state.mine = {jour: today(), rocks};
  save();
}

/* ----- La grotte (construite au moment où l'on entre, dans la scène des intérieurs) ----- */
const rockMeshes = new Map();
let group = null;
const tint = (t, a, b) => (t * 7919 % 13) / 13 < .5 ? a : b;
export function makeMine(){
  renew();
  group = new THREE.Group(); rockMeshes.clear();
  /* Le sol de terre battue */
  const tiles = [];
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++) if(floorAt(x, z)) tiles.push([x, z]);
  const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .2, 1), new THREE.MeshLambertMaterial({color:0xffffff}), tiles.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  tiles.forEach(([x, z], k) => { m4.makeTranslation(cx(x), -.1, cz(z)); floor.setMatrixAt(k, m4); floor.setColorAt(k, col.setHex((x + z) % 2 ? 0x7E6550 : 0x866B54)); });
  floor.instanceColor.needsUpdate = true; floor.receiveShadow = true;
  group.add(floor);
  /* Les parois : des blocs de roche arrondis tout autour du sol ; ceux de devant restent bas pour voir dedans */
  const NEAR = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    if(floorAt(x, z) || !NEAR.some(([dx, dz]) => floorAt(x + dx, z + dz))) continue;
    const devant = floorAt(x, z - 1) || floorAt(x - 1, z - 1) && floorAt(x + 1, z - 1), r = (x * 9301 + z * 49297) % 233 / 233;
    const h = devant ? .55 : 1.7 + r * .9;
    g(part(G.dode, tint(x * 31 + z, 0x6E655C, 0x7A7066), 1.45, h, 1.45, cx(x) + (r - .5) * .2, h * .42, cz(z) + (r - .5) * .2));
  }
  /* Le pilier du milieu, cerclé d'une poutre */
  g(part(G.dode, 0x6A6158, 2.3, 3, 2.3, 0, 1.3, 0));
  /* Le tunnel d'entrée, étayé de bois */
  for(const z of [4.9, 6.9]){
    for(const x of [-1.85, 1.85]) g(part(G.box, 0x6B4A2F, .2, 2, .2, x, 1, z));
    if(z < 6) g(part(G.box, 0x6B4A2F, 3.9, .2, .22, 0, 2, z));   // pas de poutre au-dessus de l'entrée : elle cacherait le personnage
  }
  /* Des lanternes accrochées aux parois */
  const glow = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.9});
  for(const [x, z] of [[-6.9, -2.5], [6.9, -2.5], [-6.9, 1.5], [6.9, 1.5], [-3.5, -6.2], [3.5, -6.2], [-1.6, 4.6], [1.6, 4.6]]){
    g(part(G.box, 0x4A3826, .08, .5, .08, x, 1.25, z));
    const l = part(G.box, glow, .22, .26, .22, x, .95, z); l.castShadow = false; g(l);
  }
  /* Les rails, du tunnel jusqu'au pilier, et le wagonnet */
  for(const x of [-.35, .35]) g(part(G.box, 0x6F7884, .06, .05, 6.2, x, .03, 4.3));
  for(let z = 1.4; z < 7.4; z += .55) g(part(G.box, 0x6B4A2F, 1, .04, .14, 0, .02, z));
  const wx = cx(WAGON % W), wz = cz(Math.floor(WAGON / W));
  g(part(G.box, 0x7A5A3C, .8, .45, .6, wx, .38, wz));
  for(const [dx, dz] of [[-.28,-.24],[.28,-.24],[-.28,.24],[.28,.24]]) { const w = part(G.cyl, 0x3B3B3B, .2, .06, .2, wx + dx, .12, wz + dz); w.rotation.z = Math.PI/2; g(w); }
  [[.12, .68, 0], [-.15, .66, .1]].forEach(([dx, y, dz]) => g(part(G.dode, 0x9EA3A8, .3, .22, .3, wx + dx, y, wz + dz)));   // des pierres dans le wagonnet
  for(const t of CAISSES) g(part(G.box, 0x9B6B43, .7, .6, .7, cx(t % W), .3, cz(Math.floor(t / W))));
  /* La sortie : des planches au bout du tunnel */
  g(part(G.box, 0x8A5A3B, 2, .03, .6, 0, .015, D/2 - .3));
  /* Les rochers du jour */
  for(const t of Object.keys(state.mine.rocks)) addRock(+t);
  return {group, w: W, d: D, doorX: 0, light: 0xFFC98A, power: .55, ground: 0x2E241B, walk};
}
const g = m => group.add(m);
function addRock(t){
  const m = rockMesh(state.mine.rocks[t], (t * 9301 + 49297) % 233280 / 233280);
  m.position.set(cx(t % W), 0, cz(Math.floor(t / W)));
  m.rotation.y = t * 2.4;
  group.add(m); rockMeshes.set(t, m);
}
/* Où le personnage peut marcher : le sol, sans les rochers, le wagonnet ni les caisses */
function walk(x, z){
  const t = mineTile(x, z);
  return t >= 0 && floorAt(t % W, Math.floor(t / W)) && !blocked.has(t) && !state.mine.rocks[t];
}
export const mineRock = t => state.mine && state.mine.rocks[t];
export const mineRockMesh = t => rockMeshes.get(t);
export function setMineRock(t, o){
  const m = rockMeshes.get(t);
  if(m){ group.remove(m); rockMeshes.delete(t); }
  if(o){ state.mine.rocks[t] = o; addRock(t); } else delete state.mine.rocks[t];
  save();
}

/* ----- L'entrée de la mine sur l'île, posée une fois : la première place libre au nord de la place du village ----- */
if(!state.buildings.some(b => b.type === "mine")){
  const s = sizeOf("mine"), c = N / 2, cible = [c - s/2, c - 15];
  const libre = (x, z) => inb(x, z) && map.type[idx(x, z)] !== "water" && !occ.has(idx(x, z));
  let best = null, bd = Infinity;
  for(let z = 1; z < N - s - 1; z++) for(let x = 1; x < N - s - 1; x++){
    const cells = [...footprint("mine", x, z), doorTile("mine", x, z)];
    if(!cells.every(([a, b]) => libre(a, b))) continue;
    const d = Math.hypot(x - cible[0], z - cible[1]);
    if(d < bd){ bd = d; best = [x, z]; }
  }
  if(best){
    const [x, z] = best;
    /* la place de la mine, et deux rangées devant son entrée, pour bien la voir */
    const devant = [-1, 0, 1, 2, 3].flatMap(dx => [[x + dx, z + s], [x + dx, z + s + 1]]);
    for(const [a, b] of [...footprint("mine", x, z), ...devant]) if(inb(a, b) && map.obj[idx(a, b)]) setObj(idx(a, b), null);
    const b = {id: state.nextId++, type: "mine", lvl: 1, x, z};
    state.buildings.push(b);
    footprint("mine", x, z).forEach(([a, c2]) => occ.set(idx(a, c2), b.id));
    placeMesh(b); save();
  }
}
