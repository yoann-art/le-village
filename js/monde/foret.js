/* ================= La Forêt profonde (étape 1.7, morceau 3) =================
   Bible : la première zone sauvage, où l'on va à pied (gibier, champignons, loups) ; « des zones sauvages aux
   ressources illimitées ». Grand Carnet : « les vieux bois : plus sombres, plus hauts, et le bois dur qui fait les
   premières armes ». Dehors, au bout du pont du nord de l'île (ponton.js), l'orée : un « bâtiment » fixe B.foret,
   posé une fois ici. Dedans (la scène des intérieurs, comme la mine) : une forêt de W × D cases, la même pour
   tout le monde (tirage fixe) : un sentier du sud (l'entrée) au cœur de la forêt au nord, où se dresse le Grand
   Chêne millénaire ; des clairières ; un ruisseau qu'un petit pont enjambe ; partout ailleurs, le sous-bois serré.
   Ses arbres (d'après le carnet, modèles dans essences.js) : charme, frêne, sureau (communs), if, houx (peu communs),
   chêne séculaire (rare). On les coupe à la hache (voir recolte.js) : chacun donne son bois (carnet) et parfois sa
   graine ; ils repoussent sur place, en temps réel (RECOLTE : 1 jour, 3 jours, 1 semaine) : state.foret.coupes =
   {case: heure de la coupe}. Le houx et le sureau n'ont pas de bois (carnet) : on cueille leurs baies ou leurs
   fleurs (state.foret.cueillis), qui reviennent. Paisible pour l'instant : les loups et la grotte
   viendront à l'étape 1.8, le gibier au morceau 4.
   Les arbres sont dessinés « en série » (un modèle répété par sorte d'arbre), pour un téléphone modeste ; un arbre
   qu'on coupe devient un modèle à lui, le temps de trembler et de tomber. */
import { G, part, mat } from "./formes.js";
import { state, save } from "../sauvegarde.js";
import { RECOLTE } from "../donnees.js";
import { map, idx, inb, setObj } from "./ile.js";
import { occ, footprint, placeMesh } from "./batiments.js";
import { pontForet } from "./ponton.js";
import { rockMesh } from "./rochers.js";
import { essences, TAILLE, arbreModele, FRUITS, fruitsDeSaison } from "./essences.js";

export const W = 36, D = 36;
const cx = x => x - W/2 + .5, cz = z => z - D/2 + .5;
export const ftile = (wx, wz) => { const x = Math.floor(wx + W/2), z = Math.floor(wz + D/2); return x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1; };
export const fcx = i => cx(i % W), fcz = i => cz(Math.floor(i / W));

/* ----- Le plan de la forêt (tirage fixe, le même pour tous) ----- */
function rand(seed){ let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CLAIRIERES = [[17.5, 31, 4.5], [7.5, 24, 3.6], [28, 24.5, 4], [17.5, 6, 4.2], [28.5, 8.5, 3.2], [7, 9.5, 3.2]];
const COEUR = [17, 4];                                   // le Grand Chêne millénaire : 2 × 2 cases
export const foret = {type: new Array(W * D).fill("mousse"), obj: new Array(W * D).fill(null), r: new Array(W * D).fill(0)};
export const sources = new Set();                        // les cases d'eau de la source
{
  const rnd = rand(1789), T = foret.type, O = foret.obj, at = (x, z) => z * W + x;
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++) foret.r[at(x, z)] = rnd();
  for(const [x0, z0, r] of CLAIRIERES) for(let z = 0; z < D; z++) for(let x = 0; x < W; x++) if(Math.hypot(x + .5 - x0, z + .5 - z0) < r) T[at(x, z)] = "herbe";
  const sentier = (x, z) => { if(x >= 0 && z >= 0 && x < W && z < D && T[at(x, z)] !== "eau") T[at(x, z)] = "sentier"; };
  for(let z = 5; z < D; z++){ sentier(17, z); sentier(18, z); }                     // le grand sentier, de l'entrée au cœur
  for(let x = 7; x <= 18; x++){ sentier(x, 23); sentier(x, 24); }                   // vers les clairières de l'ouest et de l'est
  for(let x = 17; x <= 28; x++){ sentier(x, 24); sentier(x, 25); }
  for(let x = 17; x <= 28; x++){ sentier(x, 7); sentier(x, 8); }                    // du cœur vers le nord-est et le nord-ouest
  for(let x = 7; x <= 18; x++){ sentier(x, 9); sentier(x, 10); }
  /* le ruisseau, d'ouest en est, et le petit pont du sentier */
  for(let x = 0; x < W; x++){
    const z = 16 + Math.round(Math.sin(x * .33) * 2);
    for(const dz of Math.sin(x * .6 + 1) > -.2 ? [0, 1] : [0]) T[at(x, z + dz)] = x === 17 || x === 18 ? "pont" : "eau";
  }
  /* les arbres : serrés dans le sous-bois, quelques buissons dans les clairières ; un bord tout boisé */
  const essence = r => r < .38 ? "charme" : r < .66 ? "frene" : r < .76 ? "sureau" : r < .88 ? "if" : r < .96 ? "houx" : "chene";
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    const i = at(x, z), t = T[i], r = rnd(), bord = x < 2 || x > W - 3 || z < 2 || z > D - 3;
    if(t === "eau" || t === "pont" || t === "sentier") continue;
    if(bord && t !== "herbe") O[i] = essence(rnd() * .88);
    else if(t === "mousse"){ if(r < .44) O[i] = essence(rnd()); else if(r < .48) O[i] = "rock"; }
    else if(t === "herbe" && r < .05) O[i] = rnd() < .5 ? "sureau" : "houx";
    else if(t === "herbe" && r < .08) O[i] = "rock";
  }
  for(const [x, z] of [[0, 0], [1, 0], [0, 1], [1, 1]]) O[at(COEUR[0] + x, COEUR[1] + z)] = "bloc";
  O[at(COEUR[0], COEUR[1])] = "grandChene";
  /* la source, au cœur de la forêt, dans la clairière du Grand Chêne, au bord du grand sentier (morceau 4, carnet :
     la Truite d'argent) ; posée après les arbres, pour ne rien changer au reste du tirage */
  for(const [x, z] of [[15, 5], [16, 5], [15, 6], [16, 6]]){ T[at(x, z)] = "eau"; O[at(x, z)] = null; sources.add(at(x, z)); }
}
/* Le centre d'un arbre de la forêt (légèrement décalé, comme son modèle) et sa taille */
export function arbreEn(i){
  const sp = foret.obj[i], r = foret.r[i];
  return {sp, x: fcx(i) + (r - .5) * .3, z: fcz(i) + (r - .5) * .3, s: TAILLE(sp) * (.88 + r * .24)};
}

/* ----- Ce qui est sur une case, avec les coupes et la repousse ----- */
const coupes = () => (state.foret = state.foret || {coupes: {}}).coupes;
export function foretObj(i){
  const o = foret.obj[i];
  if(!o) return null;
  const c = coupes()[i];
  if(c === undefined) return o;
  const rep = o === "rock" ? 86400 : RECOLTE[o] && RECOLTE[o].repousse;   // les rochers de la forêt reviennent le lendemain
  if(rep && Date.now() - c >= rep * 1000){ delete coupes()[i]; return o; }
  return null;
}

/* ----- Les modèles des arbres, en série ----- */
/* ----- Les fruits du houx et du sureau : cueillis, ils reviennent (RECOLTE.retour, en secondes) ----- */
const cueillis = () => (state.foret = state.foret || {coupes: {}}).cueillis || (state.foret.cueillis = {});
export function foretFruitsLeft(i){
  const c = cueillis()[i], sp = foret.obj[i];
  if(c === undefined) return 0;
  const reste = RECOLTE[sp].retour - (Date.now() - c) / 1000;
  if(reste <= 0){ delete cueillis()[i]; return 0; }
  return reste;
}
export function cueillirForet(i){ cueillis()[i] = Date.now(); montrerArbre(i, true); save(); }

/* ----- La forêt dans la scène des intérieurs (construite en entrant) ----- */
let group = null, series = null;                          // series : {essence: [{mesh, local}], ...} ; index de chaque arbre
const indexDe = new Map(), seuls = new Map(), rochers = new Map();
const m4 = new THREE.Matrix4(), mt = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
function matriceArbre(i, local){
  const sp = foret.obj[i], r = foret.r[i], s = TAILLE(sp) * (.88 + r * .24);
  q.setFromAxisAngle(up, r * 6.28);
  m4.compose(new THREE.Vector3(fcx(i) + (r - .5) * .3, 0, fcz(i) + (r - .5) * .3), q, new THREE.Vector3(s, s, s));
  return m4.multiply(local);
}
function montrerArbre(i, oui){
  const sp = foret.obj[i], at = indexDe.get(i);
  if(at === undefined) return;
  const sansFruits = FRUITS[sp] && (!fruitsDeSaison(sp) || foretFruitsLeft(i) > 0);
  series[sp].forEach((p, k) => {
    const voir = oui && !(sansFruits && FRUITS[sp].includes(k));
    p.mesh.setMatrixAt(at, voir ? matriceArbre(i, p.local.clone()) : ZERO); p.mesh.instanceMatrix.needsUpdate = true;
  });
}
export function makeForet(){
  group = new THREE.Group(); indexDe.clear(); seuls.clear(); rochers.clear();
  /* le sol : mousse sombre, herbe des clairières, sentier de terre, planches du petit pont */
  const sols = [];
  for(let i = 0; i < W * D; i++) if(foret.type[i] !== "eau") sols.push(i);
  const sol = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .2, 1), new THREE.MeshLambertMaterial({color: 0xffffff}), sols.length), col = new THREE.Color();
  const COUL = {mousse: [0x5A9248, 0x62984E], herbe: [0x7DBA5C, 0x85C062], sentier: [0xA88A5E, 0xB09264], pont: [0xB88A5A, 0xA97A4F]};
  sols.forEach((i, k) => { const x = i % W, z = Math.floor(i / W); m4.makeTranslation(cx(x), -.1, cz(z)); sol.setMatrixAt(k, m4); sol.setColorAt(k, col.setHex(COUL[foret.type[i]][(x + z) % 2])); });
  sol.instanceColor.needsUpdate = true; sol.receiveShadow = true; group.add(sol);
  /* l'eau du ruisseau, sous le sol */
  const eau = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshPhongMaterial({color: 0x4FA8B8, shininess: 80}));
  eau.rotation.x = -Math.PI/2; eau.position.y = -.18; group.add(eau);
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0x2F6E7A)); lit.rotation.x = -Math.PI/2; lit.position.y = -.6; group.add(lit);
  for(const z of [15.5, 18.5].map(v => cz(v))) for(const x of [cx(17) - .55, cx(18) + .55]) group.add(part(G.cyl, 0x6B4A2F, .1, .6, .1, x, .2, z));   // les poteaux du petit pont
  /* les arbres, en série : une instance par arbre et par morceau (tronc, feuillage…) */
  const parEssence = {};
  const E = essences();
  foret.obj.forEach((o, i) => { if(E[o]) (parEssence[o] = parEssence[o] || []).push(i); });
  series = {};
  for(const [sp, cases] of Object.entries(parEssence)){
    series[sp] = E[sp].map(([geo, coul, s, p]) => {
      const mesh = new THREE.InstancedMesh(geo, mat(coul), cases.length);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const local = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(...s));
      group.add(mesh);
      return {mesh, local};
    });
    cases.forEach((i, k) => indexDe.set(i, k));
    cases.forEach(i => montrerArbre(i, !!foretObj(i)));
  }
  /* les rochers, chacun à lui */
  foret.obj.forEach((o, i) => { if(o === "rock") ajouterRocher(i); });
  /* le Grand Chêne millénaire, au cœur de la forêt : immense, doré par endroits ; il ne s'abat pas */
  const gc = new THREE.Group(), x0 = cx(COEUR[0]) + .5, z0 = cz(COEUR[1]) + .5;
  gc.add(part(G.cyl, 0x4A3A2A, 1.5, 4, 1.5, 0, 2, 0));
  for(const [x, z, a] of [[-.9, .4, .6], [.8, .5, -.5], [0, -.9, 0]]){ const rac = part(G.cyl, 0x4A3A2A, .45, 1.4, .45, x, .3, z); rac.rotation.z = a; group.add(rac); rac.position.x += x0; rac.position.z += z0; }
  gc.add(part(G.leaf, 0x2A5E30, 5.5, 4.2, 5.5, 0, 5.2, 0));
  gc.add(part(G.leaf, 0x33703A, 4.2, 3.4, 4.2, 1.2, 6.4, -.6));
  gc.add(part(G.leaf2, 0x3A7A3A, 4, 3.2, 4, -1.3, 6.2, .8));
  const or = new THREE.MeshLambertMaterial({color: 0xF2C14E, emissive: 0x8A6A10, emissiveIntensity: .6});
  for(const [x, y, z] of [[1.6, 4.6, 1.2], [-1.8, 5.2, -.4], [.3, 7.2, .9], [-.6, 4.2, 1.8]]) gc.add(part(G.head, or, .5, .6, .5, x, y, z));
  gc.position.set(x0, 0, z0); group.add(gc);
  /* la source : des galets tout autour */
  for(let k = 0; k < 14; k++){
    const a = k / 14 * 6.28, x = cx(15) + .5 + Math.cos(a) * 1.45, z = cz(5) + .5 + Math.sin(a) * 1.45;
    if(foret.type[ftile(x, z)] !== "sentier") group.add(part(G.head, k % 2 ? 0xB8B4AC : 0x9A968E, .45, .25, .4, x, .02, z));
  }
  /* la sortie : des planches au bout du sentier, au sud */
  group.add(part(G.box, 0x8A5A3B, 2, .03, .6, 0, .015, D/2 - .3));
  /* clair et doux (demande de Yo : la forêt était trop sombre, et on n'a pas encore de torche) */
  return {group, w: W, d: D, doorX: 0, light: 0xFFF6E0, power: .95, ground: 0x6A8A5A, sky: 0xF0FAE8, hemi: .85, fond: 0x9CC4A8, brume: [24, 52], walk};
}
function ajouterRocher(i){
  if(!foretObj(i)) return;
  const m = rockMesh("rock", foret.r[i]);
  m.position.set(fcx(i), 0, fcz(i)); m.rotation.y = i * 2.4;
  group.add(m); rochers.set(i, m);
}
/* Où l'on marche : le sol, le petit pont ; pas l'eau, ni les arbres ni les rochers (ceux qui sont coupés, si).
   Aussi pour le gibier (chasse.js) */
export function walk(x, z){
  const i = ftile(x, z);
  if(i < 0) return false;
  const t = foret.type[i];
  return t !== "eau" && (!foret.obj[i] || foret.obj[i] !== "bloc" && foret.obj[i] !== "grandChene" && !foretObj(i));
}
/* Pour recolte.js : ce qu'il y a sur une case, son modèle (pour trembler et tomber), le couper */
export function foretMesh(i){
  if(rochers.has(i)) return rochers.get(i);
  if(seuls.has(i)) return seuls.get(i);
  const sp = foretObj(i);
  if(!sp || !series || !series[sp]) return null;
  const r = foret.r[i], g = arbreModele(sp, r, FRUITS[sp] ? fruitsDeSaison(sp) && !foretFruitsLeft(i) : true);
  g.position.set(fcx(i) + (r - .5) * .3, 0, fcz(i) + (r - .5) * .3); g.rotation.y = r * 6.28;
  group.add(g); seuls.set(i, g);
  montrerArbre(i, false);
  return g;
}
export function setForetObj(i, o){
  if(o) return;                                          // on ne pose rien dans la forêt
  coupes()[i] = Date.now();
  if(seuls.has(i)){ group.remove(seuls.get(i)); seuls.delete(i); }
  if(rochers.has(i)){ group.remove(rochers.get(i)); rochers.delete(i); }
  montrerArbre(i, false);
  save();
}
/* Ce qui a repoussé pendant qu'on est dans la forêt réapparaît */
setInterval(() => {
  if(!group || !group.parent) return;
  for(const k of Object.keys(coupes())){
    const i = +k;
    if(foretObj(i)){ if(foret.obj[i] === "rock") ajouterRocher(i); else montrerArbre(i, true); }
  }
  for(const k of Object.keys(cueillis())) if(!foretFruitsLeft(+k) && !seuls.has(+k)) montrerArbre(+k, !!foretObj(+k));
}, 15000);

/* ----- L'orée sur l'île, posée une fois au bout du pont du nord ----- */
if(pontForet && !state.buildings.some(b => b.type === "foret")){
  const fin = pontForet.z - pontForet.n + 1;
  const b = {id: state.nextId++, type: "foret", lvl: 1, x: pontForet.x - 1, z: fin - 3};
  for(const [a, c] of footprint("foret", b.x, b.z)) if(inb(a, c) && map.obj[idx(a, c)]) setObj(idx(a, c), null);
  state.buildings.push(b);
  footprint("foret", b.x, b.z).forEach(([a, c]) => occ.set(idx(a, c), b.id));
  placeMesh(b); save();
}
