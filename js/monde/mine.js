/* ================= La mine =================
   Demande de Yo : on entre dans la mine. Dehors, une colline rocheuse avec une ouverture étayée de bois :
   un « bâtiment » fixe (B.mine), posé une fois sur l'île, au nord de la place du village. Dedans, une grotte
   paisible aux parois arrondies : un tunnel d'entrée étayé, puis une grande salle autour d'un pilier de roche,
   éclairée de lanternes, avec des rails et un wagonnet. Ses rochers se renouvellent chaque jour, avec l'horloge du
   téléphone. Pioche en main : on les mine ; mains libres : on prend un rocher (pierre, cuivre) pour le reposer sur
   son île (voir recolte.js).
   Étape 1.11, morceau 2 (demande de Yo : creuser des galeries vers de nouvelles salles, 3 par mine pour l'instant ;
   chaque galerie demande une pioche plus solide) : à gauche de la grande salle, une paroi marquée d'une croix à la
   craie cache la galerie de la salle de l'étain (pioche en cuivre) ; au fond de la salle de l'étain, celle de la
   géode (pioche en bronze). Une galerie se creuse par tronçons (GALERIES dans donnees.js), gardés dans la partie :
   state.galeries = {2: {seg, coups}, 3: …}. Chaque salle a ses rochers du jour (MINE.salles) :
   state.mine = {v: 2, jour, rocks: {case: sorte}} ; une case = 1 P, comptée dans le plan ci-dessous.
   Morceau 4 : le Cœur de la mine dort dans le pilier de la géode (une lueur faible) ; il bat quand on a trouvé toutes
   les pierres des trois salles (coeurEveille), et se dégage à la pioche en bronze, une seule fois (recolte.js). */
import { G, part } from "./formes.js";
import { state, save } from "../sauvegarde.js";
import { MINE, GALERIES } from "../donnees.js";
import { doorTile, sizeOf, coeurEveille } from "../regles.js";
import { map, idx, inb, N, setObj } from "./ile.js";
import { occ, footprint, placeMesh } from "./batiments.js";
import { rockMesh, pierreMesh } from "./rochers.js";

/* Le plan de la mine, vu de dessus (« . » : sol, « # » : roche) : la grande salle en bas à droite (son entrée en bas),
   la salle de l'étain à gauche, la géode en haut à gauche ; les galeries (GAL) sont de la roche tant qu'on ne les a
   pas creusées */
const SALLE1 = [
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
const SALLE2 = [
  "#####....#####",
  "###........###",
  "##..........##",
  "#.............",
  "#.............",
  "#............#",
  "#....##......#",
  "#....##......#",
  "#............#",
  "##..........##",
  "###........###"];
const SALLE3 = [
  "####......####",
  "##..........##",
  "#............#",
  "#...##.......#",
  "#...##.......#",
  "#............#",
  "#............#",
  "##..........##",
  "###........###",
  "#####....#####"];
export const W = 34, D = 30;
const PLAN = Array.from({length: D}, () => Array(W).fill("#"));
const dessiner = (lignes, x0, z0) => lignes.forEach((l, z) => [...l].forEach((c, x) => { if(c === ".") PLAN[z0 + z][x0 + x] = "."; }));
dessiner(SALLE1, 18, 15); dessiner(SALLE2, 1, 16); dessiner(SALLE3, 1, 2);
/* Les galeries : des tronçons de 2 cases, depuis la salle d'où l'on creuse */
const GAL = {
  2: [18, 17, 16, 15].map(x => [[x, 19], [x, 20]]),
  3: [15, 14, 13, 12].map(z => [[7, z], [8, z]])
};
/* La salle de chaque case (1, 2 ou 3), pour y semer ses rochers */
const salleDe = (x, z) => x >= 18 && z >= 15 ? 1 : z >= 16 ? 2 : 3;
const galerie = g => state.galeries && state.galeries[g] || {seg: 0, coups: 0};
export const galerieOuverte = g => galerie(g).seg >= GALERIES[g].segments;
const creusee = (x, z) => Object.keys(GAL).some(g => GAL[g].some((seg, s) => s < galerie(+g).seg && seg.some(([a, b]) => a === x && b === z)));
const floorAt = (x, z) => x >= 0 && z >= 0 && x < W && z < D && (PLAN[z][x] === "." || creusee(x, z));
const cx = x => x - W/2 + .5, cz = z => z - D/2 + .5;
export const mineTile = (wx, wz) => { const x = Math.floor(wx + W/2), z = Math.floor(wz + D/2); return x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1; };
/* La grande salle d'avant était seule : ses repères gardent leurs mesures, décalés de (9, 7,5) */
const OX = 9, OZ = 7.5, T1 = (x, z) => (z + 15) * W + (x + 18);
/* Ce qui occupe une case en plus des rochers : le wagonnet et les caisses */
const WAGON = T1(4, 9), CAISSES = [T1(3, 10), T1(12, 10)];
const blocked = new Set([WAGON, ...CAISSES]);
/* Les rails : au milieu de la grande salle, du tunnel jusqu'au pilier (on n'y pose pas de rocher) */
const RAILS = t => { const x = t % W, z = Math.floor(t / W); return (x === 25 || x === 26) && z >= 23; };

/* ----- Les rochers du jour, salle par salle ----- */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function rand(seed){ let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function renew(){
  if(state.mine && state.mine.v === 2 && state.mine.jour === today()) return;
  const rnd = rand([...today()].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7));
  const rocks = {};
  for(const [s, salle] of Object.entries(MINE.salles)){
    const spots = [];
    for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
      const t = z * W + x;
      if(PLAN[z][x] === "." && salleDe(x, z) === +s && !blocked.has(t) && !RAILS(t) && !(+s === 1 && z > 25)) spots.push(t);
    }
    for(let i = spots.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
    const sortes = [];
    for(const [o, n, p] of salle.sortes) for(let k = 0; k < n; k++) if(p === undefined || rnd() < p) sortes.push(o);
    spots.slice(0, salle.n).forEach((t, k) => { rocks[t] = sortes[k] || salle.reste; });
  }
  state.mine = {v: 2, jour: today(), rocks};
  save();
}

/* ----- La mine (construite au moment où l'on entre, dans la scène des intérieurs) ----- */
const rockMeshes = new Map();
let group = null, roche = null;
const tint = (t, a, b) => (t * 7919 % 13) / 13 < .5 ? a : b;
const g = m => group.add(m);
/* Le sol, les parois et l'entrée des galeries : refaits quand une galerie avance */
function poserRoche(){
  if(roche) group.remove(roche);
  roche = new THREE.Group(); group.add(roche);
  const tiles = [];
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++) if(floorAt(x, z)) tiles.push([x, z]);
  const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .2, 1), new THREE.MeshLambertMaterial({color:0xffffff}), tiles.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const SOLS = {1: [0x7E6550, 0x866B54], 2: [0x6E6A68, 0x76716E], 3: [0x6A6070, 0x726878]};   // la salle de l'étain est grise, la géode violacée
  tiles.forEach(([x, z], k) => { m4.makeTranslation(cx(x), -.1, cz(z)); floor.setMatrixAt(k, m4); floor.setColorAt(k, col.setHex(SOLS[salleDe(x, z)][(x + z) % 2])); });
  floor.instanceColor.needsUpdate = true; floor.receiveShadow = true;
  roche.add(floor);
  /* le prochain tronçon de chaque galerie : une roche plus claire, fissurée, marquée d'une croix à la craie */
  const prochain = new Set();
  for(const g2 of Object.keys(GAL)){
    const s = galerie(+g2).seg, seg = GAL[g2][s];
    if(!seg || !seg.some(([x, z]) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => floorAt(x + dx, z + dz)))) continue;
    seg.forEach(([x, z]) => prochain.add(z * W + x));
    const [a, b] = seg, mx = (cx(a[0]) + cx(b[0])) / 2, mz = (cz(a[1]) + cz(b[1])) / 2, large = a[0] !== b[0];
    roche.add(part(G.dode, +g2 === 2 ? 0xA89A88 : 0x8A7A92, large ? 2.2 : 1.3, 2.1, large ? 1.3 : 2.2, mx, .9, mz));
    for(const [dx, dy, r] of [[-.25, 1.2, .5], [.2, .8, -.6], [.05, 1.5, .3]]){                  // des fissures
      const f = part(G.box, 0x3A3028, .05, .55, .05, mx + (large ? dx : 0), dy, mz + (large ? 0 : dx)); f.rotation.z = r; roche.add(f);
    }
    const croix = new THREE.Group();                                                            // la croix à la craie, du côté d'où l'on creuse
    for(const r of [.75, -.75]){ const c = part(G.box, 0xF6F2E8, .12, .85, .03, 0, 0, 0); c.rotation.z = r; c.castShadow = false; croix.add(c); }
    croix.position.set(mx + (+g2 === 2 ? .67 : 0), 1.05, mz + (+g2 === 2 ? 0 : .67));
    if(+g2 === 2) croix.rotation.y = Math.PI / 2;
    roche.add(croix);
    if(+g2 === 2){                                   // de côté, la croix se voit mal : un panneau de mineur, tourné vers nous, la répète
      const px = mx + 1.05, pz = mz - .55;
      roche.add(part(G.box, 0x4A3826, .08, 1.0, .08, px, .5, pz));
      roche.add(part(G.box, 0xC8955A, .62, .46, .05, px, .95, pz + .05));
      for(const r of [.7, -.7]){ const c = part(G.box, 0xF6F2E8, .07, .42, .02, px, .95, pz + .085); c.rotation.z = r; c.castShadow = false; roche.add(c); }
    }
  }
  /* Les parois : des blocs de roche arrondis tout autour du sol ; ceux de devant restent bas pour voir dedans */
  const NEAR = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  const PAROIS = {1: [0x6E655C, 0x7A7066], 2: [0x6A6C70, 0x76787C], 3: [0x625A6C, 0x6E6678]};
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    if(floorAt(x, z) || prochain.has(z * W + x) || !NEAR.some(([dx, dz]) => floorAt(x + dx, z + dz))) continue;
    const devant = floorAt(x, z - 1) || floorAt(x - 1, z - 1) && floorAt(x + 1, z - 1), r = (x * 9301 + z * 49297) % 233 / 233;
    const h = PILIER.has(z * W + x) ? .8 : devant ? .55 : 1.7 + r * .9, [c1, c2] = PAROIS[salleDe(x, z)];   // le pilier de la géode : une roche basse, où dort le Cœur
    roche.add(part(G.dode, tint(x * 31 + z, c1, c2), 1.45, h, 1.45, cx(x) + (r - .5) * .2, h * .42, cz(z) + (r - .5) * .2));
  }
}
export function makeMine(){
  renew();
  group = new THREE.Group(); rockMeshes.clear(); roche = null;
  poserRoche();
  /* La grande salle : ses repères d'avant, décalés */
  const s1 = new THREE.Group(); s1.position.set(OX, 0, OZ); group.add(s1);
  const h = m => s1.add(m);
  h(part(G.dode, 0x6A6158, 2.3, 3, 2.3, 0, 1.3, 0));                                    // le pilier du milieu
  for(const z of [4.9, 6.9]){                                                           // le tunnel d'entrée, étayé de bois
    for(const x of [-1.85, 1.85]) h(part(G.box, 0x6B4A2F, .2, 2, .2, x, 1, z));
    if(z < 6) h(part(G.box, 0x6B4A2F, 3.9, .2, .22, 0, 2, z));   // pas de poutre au-dessus de l'entrée : elle cacherait le personnage
  }
  const glow = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.9});
  const lanterne = (p, x, z) => { p.add(part(G.box, 0x4A3826, .08, .5, .08, x, 1.25, z)); const l = part(G.box, glow, .22, .26, .22, x, .95, z); l.castShadow = false; p.add(l); };
  for(const [x, z] of [[-6.9, -2.5], [6.9, -2.5], [-6.9, 1.5], [6.9, 1.5], [-3.5, -6.2], [3.5, -6.2], [-1.6, 4.6], [1.6, 4.6]]) lanterne(s1, x, z);
  for(const x of [-.35, .35]) h(part(G.box, 0x6F7884, .06, .05, 6.2, x, .03, 4.3));      // les rails, et le wagonnet
  for(let z = 1.4; z < 7.4; z += .55) h(part(G.box, 0x6B4A2F, 1, .04, .14, 0, .02, z));
  const wx = cx(WAGON % W), wz = cz(Math.floor(WAGON / W));
  g(part(G.box, 0x7A5A3C, .8, .45, .6, wx, .38, wz));
  for(const [dx, dz] of [[-.28,-.24],[.28,-.24],[-.28,.24],[.28,.24]]) { const w = part(G.cyl, 0x3B3B3B, .2, .06, .2, wx + dx, .12, wz + dz); w.rotation.z = Math.PI/2; g(w); }
  [[.12, .68, 0], [-.15, .66, .1]].forEach(([dx, y, dz]) => g(part(G.dode, 0x9EA3A8, .3, .22, .3, wx + dx, y, wz + dz)));   // des pierres dans le wagonnet
  for(const t of CAISSES) g(part(G.box, 0x9B6B43, .7, .6, .7, cx(t % W), .3, cz(Math.floor(t / W))));
  h(part(G.box, 0x8A5A3B, 2, .03, .6, 0, .015, 7.2));                                   // la sortie : des planches au bout du tunnel
  /* La salle de l'étain et la géode : leurs lanternes ; dans la géode, des cristaux qui luisent sur les parois */
  for(const [x, z] of [[cx(2), cz(19)], [cx(13), cz(24)], [cx(4), cz(26)], [cx(10), cz(17)]]) lanterne(group, x, z);
  const cristal = new THREE.MeshLambertMaterial({color:0xB48CE8, emissive:0x7A4AC8, emissiveIntensity:.8});
  for(const [x, z] of [[2, 3], [13, 3], [1, 7], [14, 8], [3, 10], [12, 10], [7, 1]]){             // au pied des parois
    const ax = cx(x) + Math.sign(cx(7.5) - cx(x)) * .55, az = cz(z) + Math.sign(cz(6.5) - cz(z)) * .55, r = (x * 7 + z) % 5 / 10 - .2;
    for(const [dx, s] of [[0, 1], [.22, .7], [-.2, .6]]){ const c = part(G.cone4, cristal, .22 * s, .7 * s, .22 * s, ax + dx, .35 * s, az); c.rotation.z = r + dx; c.castShadow = false; g(c); }
  }
  for(const [x, z] of [[cx(3), cz(5)], [cx(11), cz(6)]]) lanterne(group, x, z);
  majCoeur();
  /* Les rochers du jour */
  for(const t of Object.keys(state.mine.rocks)) addRock(+t);
  return {group, w: W, d: D, doorX: OX, light: 0xFFC98A, power: .55, ground: 0x2E241B, walk};
}
function addRock(t){
  const m = rockMesh(state.mine.rocks[t], (t * 9301 + 49297) % 233280 / 233280);
  m.position.set(cx(t % W), 0, cz(Math.floor(t / W)));
  m.rotation.y = t * 2.4;
  group.add(m); rockMeshes.set(t, m);
}
/* Où le personnage peut marcher : le sol (et les galeries creusées), sans les rochers, le wagonnet ni les caisses */
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

/* ----- Les galeries (étape 1.11, morceau 2) ----- */
/* La galerie qu'on a devant soi (une case de son prochain tronçon, touchant le sol), ou null */
export function galerieEn(t){
  if(t < 0) return null;
  const x = t % W, z = Math.floor(t / W);
  for(const g2 of Object.keys(GAL)){
    const s = galerie(+g2).seg, seg = GAL[g2][s];
    if(seg && seg.some(([a, b]) => a === x && b === z)) return +g2;
  }
  return null;
}
/* Il reste combien de coups pour l'ouvrir en entier */
export const coupsRestants = g2 => { const c = GALERIES[g2], e = galerie(g2); return (c.segments - e.seg) * c.coups - e.coups; };
/* Un coup de pioche dans la galerie : renvoie « troncon » (un tronçon de plus), « ouverte » (la galerie est finie) ou « coup » */
export function creuser(g2){
  if(!state.galeries) state.galeries = {};
  const e = state.galeries[g2] = {...galerie(g2)}, c = GALERIES[g2];
  e.coups++;
  let r = "coup";
  if(e.coups >= c.coups){ e.seg++; e.coups = 0; r = e.seg >= c.segments ? "ouverte" : "troncon"; if(group) poserRoche(); }
  save();
  return r;
}
/* Où se tenir pour creuser une galerie, et dans quel sens regarder (pour la vérification) */
export function devantGalerie(g2){
  const [[x, z]] = GAL[g2][galerie(g2).seg] || GAL[g2][0];
  return g2 === 2 ? {x: cx(x) + 1, z: cz(z) + .5, fx: -1, fz: 0} : {x: cx(x) + .5, z: cz(z) + 1, fx: 0, fz: -1};
}
/* La salle où se trouve une case (1, 2 ou 3) */
export const salleEn = t => salleDe(t % W, Math.floor(t / W));

/* ----- Le Cœur de la mine (étape 1.11, morceau 4) : posé sur le pilier de la géode, une roche basse ----- */
const PILIER = new Set([[5, 5], [6, 5], [5, 6], [6, 6]].map(([x, z]) => z * W + x));
export const coeurEn = t => !state.coeurMine && galerieOuverte(3) && PILIER.has(t);
/* Où se tenir pour le dégager (pour la vérification) */
export const devantCoeur = () => ({x: cx(5.5), z: cz(7) + .15, fx: 0, fz: -1});
let coeur = null;
/* Le Cœur tel qu'il est : endormi, réveillé (il bat, des éclats rouges autour), ou parti */
export function majCoeur(){
  if(!group) return;
  if(coeur){ group.remove(coeur); coeur = null; }
  if(state.coeurMine) return;
  const eveil = coeurEveille(), x = cx(5.5), z = cz(5.5);
  coeur = new THREE.Group();
  const c = pierreMesh("coeurMine", {endormi: !eveil});
  c.scale.setScalar(2.4); c.position.set(x, .68, z + .15);
  coeur.add(c);
  const eclat = eveil ? new THREE.MeshLambertMaterial({color: 0xD8384A, emissive: 0xA01A20, emissiveIntensity: .7}) : 0x6A4048;
  for(const [dx, dz, s, r] of [[-.6, -.1, .9, -.45], [.6, -.05, .75, .5], [-.4, .45, .55, -.25], [.42, .5, .5, .3], [0, -.45, .7, 0]]){
    const e = part(G.cone4, eclat, .18 * s, .5 * s, .18 * s, x + dx, .62 + .22 * s, z + dz); e.rotation.z = r; e.castShadow = false; coeur.add(e);
  }
  group.add(coeur);
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
