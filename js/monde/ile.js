/* ================= L'île =================
   Carte en cases, terrain, mer, arbres, rochers, herbes hautes et buissons de baies. */
import { scene } from "./scene.js";
import { mat, G, part } from "./formes.js";
import { state } from "../sauvegarde.js";
import { doorTile, sizeOf } from "../regles.js";
import { GRAINES, RECOLTE } from "../donnees.js";
import { makeMeuble } from "./meubles.js";
import { rockMesh } from "./rochers.js";
import { ESSENCES, FRUITS, arbreModele, fruitsDeSaison } from "./essences.js";

/* Carte de l'île : N × N cases, une case = 1 P (agrandie de 40 à 56 avec Yo le 1er octobre 2026) */
export const N = 56, H = N / 2;
export const idx = (x,z) => z * N + x;
export const inb = (x,z) => x >= 0 && z >= 0 && x < N && z < N;
export const tileOf = w => Math.floor(w + H);
export const centerOf = t => t - H + .5;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function genMap(seed){
  const rnd = mulberry32(seed), G = 5, g1 = [], g2 = [];
  for(let i = 0; i < (G+1)*(G+1); i++){ g1.push(rnd()); g2.push(rnd()); }
  const sm = t => t*t*(3-2*t);
  function noise(g, x, z){
    const fx = x/(N-1)*G, fz = z/(N-1)*G;
    const ix = Math.min(G-1, Math.floor(fx)), iz = Math.min(G-1, Math.floor(fz));
    const tx = sm(fx-ix), tz = sm(fz-iz), w = G+1;
    const a = g[iz*w+ix], b = g[iz*w+ix+1], c = g[(iz+1)*w+ix], d = g[(iz+1)*w+ix+1];
    return (a*(1-tx) + b*tx)*(1-tz) + (c*(1-tx) + d*tx)*tz;
  }
  const type = new Array(N*N), obj = new Array(N*N).fill(null), c = (N-1)/2;
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const d = Math.hypot((x-c)/(N/2), (z-c)/(N/2));
    const h = 1 - d*1.2 + (noise(g1,x,z) - .5)*.6;
    let t = h < .1 ? "water" : h < .24 ? "sand" : "grass";
    if(Math.hypot(x-c, z-c) < 4) t = "grass";
    if(Math.hypot(x-(c+8), z-(c-7)) < 2.3 && t === "grass") t = "water";
    type[idx(x,z)] = t;
  }
  /* Un arbre ne pousse pas collé à un autre : son feuillage fait 2 P de large */
  const treeNear = (x,z) => [[-1,0],[-1,-1],[0,-1],[1,-1]].some(([dx,dz]) => inb(x+dx, z+dz) && obj[idx(x+dx, z+dz)] === "tree");
  /* (Ne pas changer le 5 ci-dessous : cela redistribuerait tous les arbres de l'île.
     Pour faire de la place, on retire des arbres après coup, voir la place du village.) */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x,z);
    if(Math.hypot(x-c, z-c) < 5) continue;
    const r = rnd();
    if(type[i] === "grass"){
      if((noise(g2,x,z) > .6 && r < .5) || r < .035){ if(!treeNear(x,z)) obj[i] = "tree"; }
      else if(r < .06) obj[i] = "rock";
    } else if(type[i] === "sand" && r < .03) obj[i] = "rock";
  }
  /* La place du village : ni arbre ni rocher à moins de 9 cases du centre */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++) if(Math.hypot(x-c, z-c) < 9) obj[idx(x,z)] = null;
  return {type, obj};
}
export const map = genMap(state.seed);
/* L'eau d'une case (étape 1.6, la pêche) : l'étang, au nord-est de la place du village, ou la mer */
export const lieuEau = i => { const c = (N-1)/2; return Math.hypot(i % N - (c+8), Math.floor(i / N) - (c-7)) < 3.3 ? "etang" : "mer"; };
/* Herbes hautes et buissons de baies (étape 1.5) : posés après coup, avec leur propre tirage, pour ne pas
   déplacer les arbres et les rochers des parties déjà commencées ; jamais sous un bâtiment déjà posé */
{
  const rnd = mulberry32(state.seed * 7 + 3), c = (N-1)/2, sous = new Set();
  state.buildings.forEach(b => { const s = sizeOf(b.type); for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) sous.add(idx(b.x + dx, b.z + dz)); });
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z), r = rnd();
    if(map.type[i] !== "grass" || map.obj[i] || sous.has(i) || Math.hypot(x-c, z-c) < 9) continue;
    if(r < .065) map.obj[i] = "herbe";               // une trentaine de touffes et une dizaine de buissons
    else if(r < .085) map.obj[i] = "buisson";
  }
}
/* Le thym (étape 1.6, Grand Carnet : « Thym et sauge », herbes aromatiques des prés de l'île) : des touffes
   basses aux fleurs mauves, posées après coup avec leur propre tirage ; on les traverse comme les herbes hautes */
{
  const rnd = mulberry32(state.seed * 11 + 5), c = (N-1)/2, sous = new Set();
  state.buildings.forEach(b => { const s = sizeOf(b.type); for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) sous.add(idx(b.x + dx, b.z + dz)); });
  const P = state.ponton, entree = P ? idx(P.x, P.z - 1) : -1, F = state.pontForet, entreeF = F ? idx(F.x, F.z + 1) : -1;
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z), r = rnd();
    if(map.type[i] !== "grass" || map.obj[i] || sous.has(i) || i === entree || i === entreeF || Math.hypot(x-c, z-c) < 9) continue;
    if(r < .04) map.obj[i] = "thym";
  }
}
/* Rien ne pousse devant la porte d'un bâtiment déjà posé */
state.buildings.forEach(b => {
  const [x, z] = doorTile(b.type, b.x, b.z);
  if(inb(x, z)) map.obj[idx(x, z)] = null;
});
/* Ce que le joueur a changé sur l'île (étape 1.5) : state.ile = {case: {o, plante?, coupe?, vide?, arrose?}} ;
   o = "tree", "rock", "herbe", "buisson" ou null (enlevé) ; plante = l'heure où il a été planté (il pousse avec
   l'horloge du téléphone) ; coupe = herbes cueillies à cette heure ; vide = buisson sans baies, arrose = arrosé à cette heure */
for(const [i, c] of Object.entries(state.ile)) map.obj[+i] = c.o;

/* Terrain : dalle d'herbe ou de sable sur un socle de terre */
{
  const land = [];
  map.type.forEach((t,i) => { if(t !== "water") land.push(i); });
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.24,1), new THREE.MeshLambertMaterial({color:0xffffff}), land.length);
  const dirt = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.8,1), mat(0xA8774C), land.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  land.forEach((i,k) => {
    const x = i % N, z = Math.floor(i / N), wx = centerOf(x), wz = centerOf(z), alt = (x+z) % 2;
    m4.makeTranslation(wx, -.12, wz); slabs.setMatrixAt(k, m4);
    m4.makeTranslation(wx, -.64, wz); dirt.setMatrixAt(k, m4);
    col.setHex(map.type[i] === "sand" ? (alt ? 0xEBD793 : 0xF1E0A3) : (alt ? 0x74C063 : 0x7DC96B));
    slabs.setColorAt(k, col);
  });
  slabs.instanceColor.needsUpdate = true;
  slabs.receiveShadow = true; dirt.receiveShadow = true;
  scene.add(slabs, dirt);
}
export const water = new THREE.Mesh(new THREE.PlaneGeometry(N+90, N+90),
  new THREE.MeshPhongMaterial({color:0x58C3D8, transparent:true, opacity:.8, shininess:90, specular:0x99DDEE}));
water.rotation.x = -Math.PI/2; water.position.y = -.2; water.receiveShadow = true;
const seabed = new THREE.Mesh(new THREE.PlaneGeometry(N+90, N+90), mat(0x2F93AE));
seabed.rotation.x = -Math.PI/2; seabed.position.y = -1.05;
scene.add(water, seabed);

/* Arbres (3 à 4 P de haut), rochers (½ à 1 P), herbes hautes et buissons, un modèle par case */
const POUSSE = {};                                   // ce qui pousse → temps pour devenir adulte (s)
for(const g of Object.values(GRAINES)) POUSSE[g.plante] = g.pousse;
/* Où en est ce qui a été planté : de 0 (graine plantée) à 1 (adulte) ; ce qui était là au départ est adulte */
export function growth(i){
  const c = state.ile[i];
  if(!c || !c.plante || !POUSSE[c.o]) return 1;
  return Math.min(1, (Date.now() - c.plante) / (POUSSE[c.o] * 1000));
}
/* Temps restant avant l'âge adulte, en secondes */
export const growthLeft = i => { const c = state.ile[i]; return c && c.plante ? Math.max(0, POUSSE[c.o] * (1 - growth(i))) : 0; };
/* Étape de pousse : 0 pousse, 1 jeune plant, 2 adulte */
const stageOf = i => { const g = growth(i); return g < .5 ? 0 : g < 1 ? 1 : 2; };
/* Herbes cueillies une fois : rases, elles repoussent ; temps restant en secondes (0 = hautes) */
export function herbeLeft(i){
  const c = state.ile[i];
  return c && c.coupe ? Math.max(0, RECOLTE.herbe.repousse - (Date.now() - c.coupe) / 1000) : 0;
}
/* Thym cueilli : il repousse sur place ; temps restant en secondes (0 = prêt à cueillir) */
/* Le houx et le sureau plantés sur l'île (étape 1.7) : leurs baies ou leurs fleurs cueillies reviennent
   (RECOLTE.retour) ; temps restant en secondes (0 = prêtes, si c'est leur saison) */
export function fruitsLeft(i){
  const c = state.ile[i], o = map.obj[i];
  return c && c.cueilli && FRUITS[o] ? Math.max(0, RECOLTE[o].retour - (Date.now() - c.cueilli) / 1000) : 0;
}
export function thymLeft(i){
  const c = state.ile[i];
  return c && c.coupe && map.obj[i] === "thym" ? Math.max(0, RECOLTE.thym.repousse - (Date.now() - c.coupe) / 1000) : 0;
}
/* Buisson : plein de baies, sauf s'il a été cueilli et que ses baies ne sont pas revenues (arrosé depuis assez longtemps) */
export function baiesLeft(i){                         // -1 : vide, pas arrosé ; 0 : plein ; sinon secondes avant le retour
  const c = state.ile[i];
  if(!c || !c.vide) return 0;
  if(!c.arrose) return -1;
  return Math.max(0, RECOLTE.buisson.retour - (Date.now() - c.arrose) / 1000);
}
/* Ce que montre le modèle d'une case : quand cela change (pousse, repousse, baies), on le refait */
const lookOf = i => map.obj[i] + stageOf(i) + (map.obj[i] === "herbe" ? (herbeLeft(i) > 0 ? "r" : "h") : "") + (map.obj[i] === "buisson" ? (baiesLeft(i) ? "v" : "p") : "") + (map.obj[i] === "thym" ? (thymLeft(i) > 0 ? "r" : "h") : "") + (FRUITS[map.obj[i]] ? (fruitsLeft(i) > 0 || !fruitsDeSaison(map.obj[i]) ? "n" : "f") : "");

const meshes = new Map(), looks = new Map();
function buildObj(i){
  const o = map.obj[i], r = ((i*9301 + 49297) % 233280) / 233280;
  const g = new THREE.Group();
  looks.set(i, lookOf(i));
  if(o === "tree"){
    const st = stageOf(i);
    if(st === 0){                                    // une pousse
      g.add(part(G.trunk, 0x8A5A3B, .6,.5,.6, 0,.14,0));
      g.add(part(G.leaf2, 0x6CC46A, .9,.9,.9, 0,.42,0));
    } else {
      g.add(part(G.trunk, 0x8A5A3B, 2.2,2.4,2.2, 0,.66,0));
      g.add(part(G.leaf, r < .5 ? 0x3E9D50 : 0x479F46, 2,2,2, 0,1.95,0));
      g.add(part(G.leaf2, 0x57B25C, 2,2,2, .1,2.75,.05));
      g.scale.setScalar((.9 + r*.25) * (st === 1 ? .5 : 1));   // jeune plant : moitié de la taille
    }
  } else if(o === "herbe"){                         // des brins hauts et souples ; ras une fois cueillis
    const h = stageOf(i) < 2 ? .45 : herbeLeft(i) > 0 ? .25 : 1;
    [[0,0,0x6FBF4E],[.14,.08,0x5DAE45],[-.13,.1,0x7CCB58],[.06,-.14,0x67B84B],[-.08,-.1,0x5DAE45]].forEach(([x, z, c], k) => {
      const b = part(G.cone, c, .16, .6 * h * (1 + (k % 2) * .25), .16, x, .3 * h * (1 + (k % 2) * .25), z);
      b.rotation.set(z * 1.2, 0, -x * 1.2); g.add(b);
    });
  } else if(o === "buisson"){                       // une touffe ronde, avec ses baies si elle est pleine
    const st = stageOf(i);
    g.add(part(G.leaf, 0x3E8F48, 1.1, .9, 1.1, 0, .38, 0));
    g.add(part(G.leaf2, 0x4FA556, 1.1, 1, 1.1, .18, .62, -.1));
    if(st === 2 && !baiesLeft(i))
      [[.28,.5,.3],[-.3,.42,.26],[.05,.7,.34],[.36,.3,-.1],[-.2,.62,-.22],[-.38,.28,.05]].forEach(([x, y, z]) =>
        g.add(part(G.head, 0x4A5FC1, .32, .32, .32, x, y, z)));
    if(st < 2) g.scale.setScalar(st === 0 ? .4 : .7);
  } else if(ESSENCES.includes(o)){                  // un arbre de la forêt, planté avec sa graine : pousse, jeune plant, adulte
    const st = stageOf(i), m = arbreModele(o, r, st === 2 && (!FRUITS[o] || fruitsDeSaison(o) && !fruitsLeft(i)));
    if(st < 2) m.scale.multiplyScalar(st === 0 ? .3 : .6);
    g.add(m);
  } else if(o === "thym"){                          // une touffe basse vert sombre, fleurie de mauve ; rase une fois cueillie
    const st = stageOf(i), ras = thymLeft(i) > 0, h = ras ? .45 : .85;
    [[0,0,.72],[.2,.1,.52],[-.19,.12,.54],[.06,-.2,.5],[-.14,-.14,.46]].forEach(([x, z, s], k) =>
      g.add(part(G.leaf2, k % 2 ? 0x4F8A45 : 0x5F9C4F, s, s * h, s, x, .3 * s * h * .8, z)));
    if(st === 2 && !ras) [[.12,.36,.06],[-.15,.32,.12],[.02,.4,-.15],[.22,.27,-.08],[-.06,.42,.02],[-.22,.25,-.1],[.1,.3,.2]].forEach(([x, y, z]) =>
      g.add(part(G.head, 0xA77BD8, .24, .24, .24, x, y, z)));
    if(st < 2) g.scale.setScalar(st === 0 ? .45 : .75);
  } else if(o === "coffre"){                        // un coffre de réserve, posé face à la caméra
    const c = makeMeuble("coffre");
    c.scale.setScalar(.75); g.add(c);
  } else g.add(rockMesh(o, r));                      // un rocher, à veines de cuivre ou non
  g.rotation.y = o === "coffre" ? 0 : r * 6.28;
  g.position.set(centerOf(i % N), 0, centerOf(Math.floor(i / N)));
  scene.add(g); meshes.set(i, g);
}
/* Refait le modèle d'une case (après une coupe, une plantation, une pousse) */
function refreshObj(i){
  const old = meshes.get(i);
  if(old){ scene.remove(old); meshes.delete(i); looks.delete(i); }
  if(map.obj[i]) buildObj(i);
}
export const objMesh = i => meshes.get(i);
/* Change ce qu'il y a sur une case et le garde dans la partie (plante : heure de plantation) */
export function setObj(i, o, plante){
  map.obj[i] = o;
  state.ile[i] = plante ? {o, plante} : {o};
  refreshObj(i);
}
/* Change l'état de ce qui est sur une case (herbes cueillies, buisson vide ou arrosé…) ; undefined efface */
export function setEtat(i, patch){
  const c = state.ile[i] || (state.ile[i] = {o: map.obj[i]});
  for(const [k, v] of Object.entries(patch)) if(v === undefined) delete c[k]; else c[k] = v;
  refreshObj(i);
}
map.obj.forEach((o, i) => { if(o) buildObj(i); });
/* Ce qui a été planté grandit, les herbes repoussent, les baies reviennent : on regarde régulièrement */
setInterval(() => {
  for(const i of Object.keys(state.ile)) if(map.obj[+i] && looks.get(+i) !== lookOf(+i)) refreshObj(+i);
}, 10000);
