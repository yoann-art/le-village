/* ================= L'île =================
   Carte en cases, terrain, mer, arbres, rochers, herbes hautes et buissons de baies. */
import { scene } from "./scene.js";
import { mat, G, part, toon } from "./formes.js";
import { state } from "../sauvegarde.js";
import { doorTile, sizeOf } from "../regles.js";
import { GRAINES, RECOLTE, FLEURS, FLEUR_RARETE, MEUBLES, enFleur, saison, POUSSE_HIVER, vitessePousse, tempsDePousse } from "../donnees.js";
import { pluieDepuis, neigeAuSol } from "./meteo.js";
import { fleurModele } from "./fleurs.js";
import { makeMeuble } from "./meubles.js";
import { rockMesh } from "./rochers.js";
import { ESSENCES, FRUITS, arbreModele, fruitsDeSaison } from "./essences.js";
import { cheneModele, soucheModele } from "./chene.js";
import { pommierModele, souchePommier } from "./pommier.js";
import { pinModele, souchePin } from "./pin.js";
import { bouleauModele, soucheBouleau } from "./bouleau.js";
import { pierreChamps } from "./pierre.js";
import { herbesModele } from "./herbes.js";
import { groseillierModele } from "./groseillier.js";

/* Carte de l'île : N × N cases, une case = 1 P (agrandie de 40 à 56 avec Yo le 1er octobre 2026, puis à 96 le 14 octobre
   2026 : « une île plus ou moins équivalente à celle d'Animal Crossing » ; environ 70 cases de terre d'un bord à l'autre,
   une vingtaine de secondes pour la traverser). La case (x, z) de l'île 56 × 56 est la case (x + 20, z + 20) de celle-ci,
   au même endroit du monde (centerOf) : le village n'a pas bougé (sauvegarde.js fait passer les parties d'avant) */
export const N = 96, H = N / 2;
export const idx = (x,z) => z * N + x;
export const inb = (x,z) => x >= 0 && z >= 0 && x < N && z < N;
export const tileOf = w => Math.floor(w + H);
export const centerOf = t => t - H + .5;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* La nature de l'île, tirée de sa graine (state.seed) : la côte, les plages, l'étang et deux mares, les petits bois de
   chênes, les arbres seuls, les rochers. (Ne rien changer à l'ordre des tirages : cela redistribuerait toute la nature
   des parties commencées ; pour faire de la place, on retire après coup, comme la place du village.) */
function genMap(seed){
  const rnd = mulberry32(seed), sm = t => t*t*(3-2*t);
  const grille = G => { const g = []; for(let i = 0; i < (G+1)*(G+1); i++) g.push(rnd()); return {G, g}; };
  function noise({G, g}, x, z){                      // un relief doux, de 0 à 1 (G : le nombre de bosses d'un bord à l'autre)
    const fx = x/(N-1)*G, fz = z/(N-1)*G;
    const ix = Math.min(G-1, Math.floor(fx)), iz = Math.min(G-1, Math.floor(fz));
    const tx = sm(fx-ix), tz = sm(fz-iz), w = G+1;
    const a = g[iz*w+ix], b = g[iz*w+ix+1], c = g[(iz+1)*w+ix], d = g[(iz+1)*w+ix+1];
    return (a*(1-tx) + b*tx)*(1-tz) + (c*(1-tx) + d*tx)*tz;
  }
  const cote = grille(6), detail = grille(16), bois = grille(13);
  const type = new Array(N*N), obj = new Array(N*N).fill(null), c = (N-1)/2;
  /* deux mares d'eau douce, loin de la place du village (choisies par Claude : l'île agrandie n'avait que son étang) */
  const mares = [0, 1].map(k => { const a = rnd() * 6.28 + k * Math.PI, d = 21 + rnd() * 5; return {x: c + Math.cos(a) * d, z: c + Math.sin(a) * d, r: 2.2 + rnd() * .8}; });
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const d = Math.hypot((x-c)/(N/2), (z-c)/(N/2));
    const bord = .76 + (noise(cote, x, z) - .5) * .26 + (noise(detail, x, z) - .5) * .07;   // où la terre finit
    let t = d > bord ? "water" : d > bord - .07 ? "sand" : "grass";
    if(Math.hypot(x-c, z-c) < 4) t = "grass";
    if(Math.hypot(x-(c+8), z-(c-7)) < 2.3 && t === "grass") t = "water";                  // l'étang
    for(const m of mares) if(Math.hypot(x - m.x, z - m.z) < m.r * (.85 + noise(detail, x, z) * .3) && t === "grass") t = "water";
    type[idx(x,z)] = t;
  }
  /* Un arbre ne pousse pas collé à un autre : son feuillage fait 2 P de large */
  const treeNear = (x,z) => [[-1,0],[-1,-1],[0,-1],[1,-1]].some(([dx,dz]) => inb(x+dx, z+dz) && ["tree", "pommier", "pin", "bouleau"].includes(obj[idx(x+dx, z+dz)]));
  /* le bouleau aime l'eau douce : un arbre à moins de 5 cases de l'étang ou d'une mare est un bouleau */
  const eauDoucePres = (x, z) => Math.hypot(x - (c+8), z - (c-7)) < 2.3 + 5 || mares.some(m => Math.hypot(x - m.x, z - m.z) < m.r + 5);
  /* le pin sylvestre aime le sable : un arbre à moins de 3 cases d'une plage est un pin */
  const sablePres = (x, z) => { for(let dz = -3; dz <= 3; dz++) for(let dx = -3; dx <= 3; dx++) if(inb(x+dx, z+dz) && type[idx(x+dx, z+dz)] === "sand") return true; return false; };
  /* Les essences de l'île (étape 2.1, morceau 2c ; décidé avec Yo le 14 octobre 2026 : le chêne, le pommier, le pin
     sylvestre, le bouleau) : un arbre seul dans un pré est parfois un pommier sauvage (un tirage à lui, selon la case, pour
     ne rien déplacer) ; les petits bois sont des chênes */
  const hache = i => (Math.imul(i + 7919, 2654435761) >>> 0) % 1000 / 1000;
  /* Moins de chênes qu'avant (demande de Yo, 14 octobre 2026), regroupés en petits bois, avec des prés libres entre eux
     pour bâtir et planter ; quelques arbres seuls ; des rochers dans les prés et sur les plages */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x,z);
    if(Math.hypot(x-c, z-c) < 5) continue;
    const r = rnd();
    if(type[i] === "grass"){
      const enBois = noise(bois, x, z) > .7;
      if((enBois && r < .5) || r < .006){ if(!treeNear(x,z)) obj[i] = !enBois && hache(i) < .3 ? "pommier" : sablePres(x, z) ? "pin" : eauDoucePres(x, z) ? "bouleau" : "tree"; }
      else if(r < .026) obj[i] = "rock";
    } else if(type[i] === "sand" && r < .02) obj[i] = "rock";
  }
  /* La place du village : ni arbre ni rocher à moins de 9 cases du centre */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++) if(Math.hypot(x-c, z-c) < 9) obj[idx(x,z)] = null;
  return {type, obj};
}
export const map = genMap(state.seed);
/* Le village du joueur (ses bâtiments et leur porte, l'entrée de la mine, ses chemins, ce qu'il a planté ou posé) : la
   nature ne le recouvre jamais. Sur la grande île, ce qui était au bord de l'ancienne côte reste sur la terre ferme
   (sauvegarde.js : agrandirIle) ; rien de sauvage n'y pousse */
const garde = new Set();
{
  const ajoute = (x, z) => { if(inb(x, z)) garde.add(idx(x, z)); };
  for(const b of state.buildings){
    if(b.type === "foret") continue;                // l'orée est sur l'eau, au bout du pont
    const s = sizeOf(b.type);
    for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) ajoute(b.x + dx, b.z + dz);
    const [px, pz] = doorTile(b.type, b.x, b.z, b.rot); ajoute(px, pz);
    if(b.type === "mine") for(let dx = -1; dx <= 3; dx++) for(const dz of [s, s + 1]) ajoute(b.x + dx, b.z + dz);   // deux rangées devant
  }
  for(const i of Object.keys(state.chemins)) garde.add(+i);
  for(const [i, c] of Object.entries(state.ile)) if(c.o) garde.add(+i);
  for(const i of garde){ map.obj[i] = null; if(map.type[i] === "water" && state.terrain[i] === undefined) map.type[i] = "grass"; }
}
/* Terraformer (étape 1.9) : l'île telle que la nature l'a faite (ORIGINE), puis les cases que le joueur a creusées
   ou comblées (state.terrain = {case: "water" | "grass"}), appliquées avant tout le reste */
export const ORIGINE = map.type.slice();
for(const [i, t] of Object.entries(state.terrain)) map.type[+i] = t;
/* L'eau d'une case (étape 1.6, la pêche) : la mer, l'eau qui touche le bord de la carte ; sinon de l'eau douce (l'étang,
   les mares, l'eau qu'on a creusée : leurs poissons, leurs libellules, leurs hérons y viennent) */
const MER = new Uint8Array(N*N);
{
  const file = [];
  for(let k = 0; k < N; k++) for(const [x, z] of [[k, 0], [k, N-1], [0, k], [N-1, k]]){ const i = idx(x, z); if(ORIGINE[i] === "water" && !MER[i]){ MER[i] = 1; file.push(i); } }
  while(file.length){
    const i = file.pop(), x = i % N, z = (i - x) / N;
    for(const [a, b] of [[x+1, z], [x-1, z], [x, z+1], [x, z-1]]){ const j = idx(a, b); if(inb(a, b) && !MER[j] && ORIGINE[j] === "water"){ MER[j] = 1; file.push(j); } }
  }
}
export const lieuEau = i => MER[i] ? "mer" : "etang";
/* De l'eau qu'on peut combler : l'eau douce (l'étang, l'eau creusée), jamais la mer */
export const comblable = i => map.type[i] === "water" && lieuEau(i) === "etang";
/* Herbes hautes et buissons de baies (étape 1.5) : posés après coup, avec leur propre tirage, pour ne pas
   déplacer les arbres et les rochers des parties déjà commencées ; jamais sous un bâtiment déjà posé */
{
  const rnd = mulberry32(state.seed * 7 + 3), c = (N-1)/2, sous = new Set();
  state.buildings.forEach(b => { const s = sizeOf(b.type); for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) sous.add(idx(b.x + dx, b.z + dz)); });
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z), r = rnd();
    if(map.type[i] !== "grass" || map.obj[i] || sous.has(i) || garde.has(i) || Math.hypot(x-c, z-c) < 9) continue;
    if(r < .045) map.obj[i] = "herbe";               // de quoi cueillir partout, sans encombrer (moins denses depuis l'île agrandie)
    else if(r < .06) map.obj[i] = "buisson";
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
    if(map.type[i] !== "grass" || map.obj[i] || sous.has(i) || garde.has(i) || i === entree || i === entreeF || Math.hypot(x-c, z-c) < 9) continue;
    if(r < .028) map.obj[i] = "thym";
  }
}
/* Les fleurs des prés (étape 1.9, morceau 4 ; Grand Carnet : « Les fleurs de tous les jours, et les grandes classiques
   du jardin ») : des touffes sauvages, posées après coup avec leur propre tirage (comme le thym, pour ne rien déplacer),
   hors de la place du village, jamais sur un chemin ni devant le ponton ; les communes trois fois plus souvent.
   Chacune fleurit à sa saison ; le reste de l'année, ce sont des feuilles */
{
  const rnd = mulberry32(state.seed * 13 + 7), c = (N-1)/2, sous = new Set();
  state.buildings.forEach(b => { const s = sizeOf(b.type); for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) sous.add(idx(b.x + dx, b.z + dz)); });
  const P = state.ponton, entree = P ? idx(P.x, P.z - 1) : -1, F = state.pontForet, entreeF = F ? idx(F.x, F.z + 1) : -1;
  const sortes = Object.keys(FLEURS).flatMap(k => Array(FLEURS[k].rarete === "commun" ? 3 : 1).fill(k));
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z), r = rnd(), r2 = rnd();
    if(map.type[i] !== "grass" || map.obj[i] || sous.has(i) || garde.has(i) || i === entree || i === entreeF || state.chemins[i] || Math.hypot(x-c, z-c) < 9) continue;
    if(r < .055) map.obj[i] = sortes[Math.floor(r2 * sortes.length)];
  }
}
/* Rien ne pousse devant la porte d'un bâtiment déjà posé */
state.buildings.forEach(b => {
  const [x, z] = doorTile(b.type, b.x, b.z, b.rot);
  if(inb(x, z)) map.obj[idx(x, z)] = null;
});
/* Ce que le joueur a changé sur l'île (étape 1.5) : state.ile = {case: {o, plante?, coupe?, vide?, arrose?}} ;
   o = "tree", "rock", "herbe", "buisson" ou null (enlevé) ; plante = l'heure où il a été planté (il pousse avec
   l'horloge du téléphone) ; coupe = herbes cueillies à cette heure ; vide = buisson sans baies, arrose = arrosé à cette heure */
for(const [i, c] of Object.entries(state.ile)) map.obj[+i] = c.o;

/* Les saisons (étape 1.10, morceau 2 ; bible : « vert tendre au printemps, doré en été, roux en automne, blanc en
   hiver ») : la couleur de l'herbe, des herbes hautes, des buissons et du feuillage des arbres de l'île. L'hiver, tout
   pâlit et les arbres se givrent ; la neige qui blanchit tout viendra avec la météo. */
const SAISONS = {
  printemps:{herbe: [0x82D26A, 0x8BD872], hautes: [0x78C850, 0x66BA48, 0x86D25C], buisson: [0x48A452, 0x5AB862],
    arbre: [[0x52B456, 0x5CBC58], 0x74C868], pousse: 0x7CCC6C},
  ete:      {herbe: [0x88BE56, 0x90C45E], hautes: [0x9CC24E, 0x8CB446, 0xACCC58], buisson: [0x3E8F48, 0x4FA556],
    arbre: [[0x3E9D50, 0x479F46], 0x57B25C], pousse: 0x6CC46A},
  automne:  {herbe: [0x86A052, 0x8EA85A], hautes: [0xC2A24C, 0xB08E42, 0xCCAE56], buisson: [0x9A7A3A, 0xAE8A42],
    arbre: [[0xD9822B, 0xC8553D, 0xD8AA48], [0xE8A040, 0xD8704A, 0xE8C060]], pousse: 0xC89A48},
  hiver:    {herbe: [0xA6BEB2, 0xAEC6BA], hautes: [0xA8B89E, 0x98AA90, 0xB4C2AA], buisson: [0x5E806A, 0x6E9078],
    arbre: [[0x5E8A72, 0x648F76], 0x7AA08A], pousse: 0x86A890}
};
const enSaison = () => SAISONS[saison()];
/* Terrain : dalle d'herbe ou de sable sur un socle de terre ; une place par case de l'île (une case d'eau a sa
   place vide), pour pouvoir creuser et combler (étape 1.9) */
const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.24,1), toon({color:0xffffff}), N*N);
slabs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N*N*3), 3);   // toutes les places dès le départ (slabs.count change)
/* le socle de terre ne se voit qu'au bord de l'eau (ailleurs, les dalles le cachent) : seulement là, pour le téléphone
   (l'île agrandie : 9 216 cases) ; refaireSocle le repose quand on creuse ou comble */
const dirt = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.8,1), mat(0xA8774C), N*N);
function refaireSocle(){
  let n = 0;
  for(let i = 0; i < N*N; i++){
    if(map.type[i] === "water") continue;
    const x = i % N, z = (i - x) / N;
    if(![[x+1, z], [x-1, z], [x, z+1], [x, z-1]].some(([a, b]) => !inb(a, b) || map.type[idx(a, b)] === "water")) continue;
    m4.makeTranslation(centerOf(x), -.64, centerOf(z)); dirt.setMatrixAt(n++, m4);
  }
  dirt.count = n; dirt.instanceMatrix.needsUpdate = true;
}
const m4 = new THREE.Matrix4(), col = new THREE.Color(), RIEN = new THREE.Matrix4().makeScale(0, 0, 0);
/* La neige au sol (étape 1.10, morceau 4) blanchit l'herbe : peinteNeige, de 0 à 1, la neige des dalles peintes */
const NEIGE = [new THREE.Color(0xEEF3F6), new THREE.Color(0xF6F9FB)], entamees = new Set();
let peinteNeige = 0;
/* entame : une case qu'on a commencé à creuser (de la terre retournée, un peu plus bas) ; sans le dire, elle le reste */
/* une dalle par case de terre seulement (l'île agrandie : la mer n'a pas de dalle à dessiner) : place[i], sa place dans la
   série ; une case comblée en reçoit une à la fin */
const place = new Int32Array(N*N).fill(-1);
let nDalles = 0;
function poserCase(i, entame = entamees.has(i)){
  const x = i % N, z = Math.floor(i / N), wx = centerOf(x), wz = centerOf(z), alt = (x+z) % 2;
  if(map.type[i] === "water"){ if(place[i] >= 0) slabs.setMatrixAt(place[i], RIEN); return; }
  if(place[i] < 0){ place[i] = nDalles++; slabs.count = nDalles; }
  m4.makeTranslation(wx, entame ? -.2 : -.12, wz); slabs.setMatrixAt(place[i], m4);
  col.setHex(entame ? 0x9A6B45 : map.type[i] === "sand" ? (alt ? 0xEBD793 : 0xF1E0A3) : enSaison().herbe[alt]);
  if(!entame && peinteNeige > 0 && map.type[i] !== "water") col.lerp(NEIGE[alt], peinteNeige * (map.type[i] === "sand" ? .6 : 1));   // le sable, un peu moins
  slabs.setColorAt(place[i], col);
}
/* La couleur de la dalle d'une case [r, g, b] (pour la vérification : l'herbe selon la saison, la neige) */
export const couleurSol = i => place[i] >= 0 ? [...slabs.instanceColor.array.slice(place[i] * 3, place[i] * 3 + 3)] : null;
for(let i = 0; i < N*N; i++) poserCase(i);
slabs.instanceColor.needsUpdate = true;
slabs.receiveShadow = true; dirt.receiveShadow = true;
refaireSocle();
scene.add(slabs, dirt);
const terrainChange = () => { slabs.instanceMatrix.needsUpdate = dirt.instanceMatrix.needsUpdate = slabs.instanceColor.needsUpdate = true; };
/* Creuser, combler (étape 1.9) : la case devient de l'eau (« water ») ou de la terre (son herbe ou son sable d'origine,
   de l'herbe pour l'étang comblé) ; gardé dans la partie. Rien n'y repousse tout seul ensuite */
export function setTerrain(i, t){
  map.type[i] = t; entamees.delete(i);
  if(t === ORIGINE[i]) delete state.terrain[i]; else state.terrain[i] = t;
  if(!state.ile[i]) state.ile[i] = {o: null};
  poserCase(i); refaireSocle(); terrainChange();
}
export const terreDe = i => ORIGINE[i] === "water" ? "grass" : ORIGINE[i];
/* Une case qu'on commence à creuser, ou qu'on laisse (entame = false) */
export function entamer(i, entame){ if(entame) entamees.add(i); else entamees.delete(i); poserCase(i, entame); terrainChange(); }
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
  const ms = POUSSE[c.o] * 1000, now = Date.now();
  if(now - c.plante >= ms / POUSSE_HIVER) return 1;          // assez vieux : adulte, même s'il n'a poussé qu'en hiver
  return Math.min(1, tempsDePousse(c.plante, now) / ms);     // en hiver, il pousse deux fois moins vite (étape 1.10)
}
/* Temps restant avant l'âge adulte, en secondes (à la vitesse de la saison de maintenant) */
export const growthLeft = i => { const c = state.ile[i]; return c && c.plante ? Math.max(0, POUSSE[c.o] * (1 - growth(i)) / vitessePousse()) : 0; };
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
  const a = c.arrose || pluieDepuis(c.vide);          // la pluie arrose aussi (étape 1.10, morceau 4), même jeu fermé
  if(!a) return -1;
  return Math.max(0, RECOLTE.buisson.retour - (Date.now() - a) / 1000);
}
/* Les fleurs (étape 1.9) : cueillie, elle refleurit sur place (FLEUR_RARETE.refleurit) ; temps restant en secondes */
export function fleurLeft(i){
  const c = state.ile[i], f = FLEURS[map.obj[i]];
  return f && c && c.cueilli ? Math.max(0, FLEUR_RARETE[f.rarete].refleurit - (Date.now() - c.cueilli) / 1000) : 0;
}
/* En fleur : adulte, à sa saison, et pas cueillie depuis peu */
export const fleurie = i => !!FLEURS[map.obj[i]] && growth(i) >= 1 && enFleur(FLEURS[map.obj[i]]) && !(fleurLeft(i) > 0);
/* Sa couleur : tirée parmi celles de la fleur, la même tant qu'elle est là (les sauvages selon leur case, les plantées
   selon l'heure où on les a plantées) */
export function couleurDe(i){
  const f = FLEURS[map.obj[i]], c = state.ile[i], h = Math.abs(Math.imul(i + 1, 2654435761) ^ (c && c.plante ? Math.floor(c.plante / 1000) : 0));
  return f.couleurs[h % f.couleurs.length];
}
/* Ce que montre le modèle d'une case : quand cela change (pousse, repousse, baies), on le refait */
/* la neige sur les branches des chênes et sur les souches (étape 2.1) : quand il neige assez */
const neigeBranches = () => neigeAuSol() > .3;
const ENNEIGE = new Set(["tree", "souche", "pommier", "pin", "bouleau", "rock", "buisson"]);
const lookOf = i => map.obj[i] + stageOf(i) + (ENNEIGE.has(map.obj[i]) ? (neigeBranches() ? "N" : "") : "") + (map.obj[i] === "herbe" ? (herbeLeft(i) > 0 ? "r" : "h") : "") + (map.obj[i] === "buisson" ? (baiesLeft(i) ? "v" : "p") : "") + (map.obj[i] === "thym" ? (thymLeft(i) > 0 ? "r" : "h") : "") + (FRUITS[map.obj[i]] ? (fruitsLeft(i) > 0 || !fruitsDeSaison(map.obj[i]) ? "n" : "f") : "") + (FLEURS[map.obj[i]] ? (fleurie(i) ? "F" : "n") : "");

const meshes = new Map(), looks = new Map();
function buildObj(i){
  const o = map.obj[i], r = ((i*9301 + 49297) % 233280) / 233280;
  const g = new THREE.Group();
  looks.set(i, lookOf(i));
  if(o === "tree"){                                 // le chêne de l'île (étape 2.1 : chene.js, d'après l'image de Yo)
    g.add(cheneModele(stageOf(i), saison(), r, neigeBranches()));
    g.scale.setScalar(.9 + r * .25);
  } else if(o === "souche"){                        // ce qui reste d'un arbre coupé (étape 2.1) : la pelle l'enlève
    const de = (state.ile[i] || {}).de;
    g.add(de === "pommier" ? souchePommier(neigeBranches(), saison() === "automne") : de === "pin" ? souchePin(neigeBranches(), saison() === "automne")
      : de === "bouleau" ? soucheBouleau(neigeBranches()) : soucheModele(neigeBranches()));
  } else if(o === "bouleau"){                       // le bouleau de l'île (étape 2.1, morceau 2c : bouleau.js, d'après les images de Yo)
    g.add(bouleauModele(stageOf(i), saison(), r, neigeBranches()));
    g.scale.setScalar(.92 + r * .2);
  } else if(o === "pin"){                           // le pin sylvestre de l'île (étape 2.1, morceau 2c : pin.js, d'après les images de Yo)
    g.add(pinModele(stageOf(i), saison(), r, neigeBranches()));
    g.scale.setScalar(.92 + r * .2);
  } else if(o === "pommier"){                       // le pommier de l'île (étape 2.1, morceau 2c : pommier.js, d'après les images de Yo)
    g.add(pommierModele(stageOf(i), saison(), r, neigeBranches(), fruitsDeSaison(o) && !fruitsLeft(i)));
    g.scale.setScalar(.92 + r * .2);
  } else if(o === "herbe"){                         // les herbes hautes (étape 2.1, morceau 3 : herbes.js, d'après l'image de Yo) ; rases une fois cueillies
    g.add(herbesModele(saison(), stageOf(i) < 2 ? "jeune" : herbeLeft(i) > 0 ? "rase" : "haute", r));
  } else if(o === "buisson"){                       // le groseillier (étape 2.1, morceau 3 : groseillier.js, d'après les images de Yo) ; cueilli, ses grappes vides
    const st = stageOf(i);
    g.add(groseillierModele(st, saison(), st === 2 && !baiesLeft(i) ? "plein" : "cueilli", r, neigeBranches()));
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
  } else if(FLEURS[o]){                             // une fleur (étape 1.9) : pousse, feuilles, ou en fleur à sa couleur
    const st = stageOf(i);
    g.add(fleurModele(o, couleurDe(i), st < 2 ? (st === 0 ? 0 : 1) : fleurie(i) ? 2 : 1));
  } else if(MEUBLES[o] && MEUBLES[o].dehors){       // une lumière posée dehors (demande de Yo, 11 octobre 2026) : torchère, chandelle, feu de camp…
    g.add(makeMeuble(o, undefined, state.ile[i]));
  } else if(o === "coffre"){                        // un coffre de réserve, posé face à la caméra
    const c = makeMeuble("coffre");
    c.scale.setScalar(.75); g.add(c);
  } else if(o === "rock"){                          // la pierre des champs (étape 2.1, morceau 3 : pierre.js, d'après l'image de Yo)
    g.add(pierreChamps(saison(), r, neigeBranches(), map.type[i] === "sand"));
    g.scale.setScalar(.85 + r * .3);
  } else g.add(rockMesh(o, r));                      // un rocher rapporté de la mine, à veines de cuivre ou non
  g.rotation.y = o === "coffre" || MEUBLES[o] ? 0 : r * 6.28;
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
/* Pour un téléphone modeste (l'île agrandie, étape 2.1 : trois fois plus de nature) : à chaque image, on ne garde à
   dessiner que ce qui est dans le champ de la caméra, avec une marge pour les ombres qui y tombent, et pas plus loin que
   le brouillard (main.js) ; le reste attend, sans rien coûter */
/* les petites choses (herbes, fleurs, thym, buissons, rochers, souches) : seulement jusqu'à PRES P (à la première personne,
   au-delà, elles ne font que quelques points dans la brume) ; les arbres et les lumières, jusqu'au bout du brouillard */
const PRES = 28, GRANDS = o => o === "tree" || ESSENCES.includes(o) || !!(MEUBLES[o] && MEUBLES[o].dehors);
const champ = new THREE.Frustum(), mVue = new THREE.Matrix4(), boule = new THREE.Sphere(new THREE.Vector3(), 6);
export function montrerChamp(camera, loin){
  camera.updateMatrixWorld();
  mVue.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix);
  champ.setFromProjectionMatrix(mVue);
  const cx = camera.position.x, cz = camera.position.z, pres = Math.min(loin, PRES);
  for(const [i, g] of meshes){
    boule.center.set(g.position.x, 1.5, g.position.z);
    g.visible = Math.hypot(g.position.x - cx, g.position.z - cz) < (GRANDS(map.obj[i]) ? loin : pres) && champ.intersectsSphere(boule);
  }
}
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
/* Une nouvelle saison (ou l'hémisphère choisi) : l'herbe et tout ce qui change de couleur sont repeints */
const SAISONNIER = o => o === "tree" || o === "herbe" || o === "buisson" || o === "souche" || o === "rock" || ESSENCES.includes(o);
let peinte = saison();
export function rafraichirSaison(){
  peinte = saison();
  for(let i = 0; i < N*N; i++){ poserCase(i); if(SAISONNIER(map.obj[i])) refreshObj(i); }
  slabs.instanceColor.needsUpdate = true;
}
/* Ce qui a été planté grandit, les herbes repoussent, les baies reviennent : on regarde régulièrement */
/* La neige au sol : on repeint l'herbe quand elle a assez changé (elle tombe et fond en douceur) */
setInterval(() => {
  const s = neigeAuSol();
  if(Math.abs(s - peinteNeige) < .03 && !(s === 0 && peinteNeige > 0)) return;
  peinteNeige = s < .01 ? 0 : s;
  for(let i = 0; i < N*N; i++) if(map.type[i] !== "water") poserCase(i);
  slabs.instanceColor.needsUpdate = true;
}, 250);
let neigeVue = neigeBranches();
setInterval(() => {
  if(saison() !== peinte){ rafraichirSaison(); return; }
  if(neigeBranches() !== neigeVue){                    // il se met à neiger, ou la neige fond : les branches et les souches suivent
    neigeVue = neigeBranches();
    for(let i = 0; i < N*N; i++) if(ENNEIGE.has(map.obj[i])) refreshObj(i);
  }
  for(const i of Object.keys(state.ile)) if(map.obj[+i] && looks.get(+i) !== lookOf(+i)) refreshObj(+i);
}, 10000);
