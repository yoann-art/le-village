/* ================= L'île =================
   Carte en cases, terrain, mer, arbres, rochers, herbes hautes et buissons de baies. */
import { scene, sun } from "./scene.js";
import { mat, G, part, toon, VENT } from "./formes.js";
import { state } from "../sauvegarde.js";
import { doorTile, sizeOf } from "../regles.js";
import { GRAINES, RECOLTE, FLEURS, FLEUR_RARETE, MEUBLES, PIERRES_ILE, FLORE_ILE, GALETS_ILE, enFleur, saison, POUSSE_HIVER, vitessePousse, tempsDePousse } from "../donnees.js";
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
import { galetsModele } from "./galets.js";
import { thymModele } from "./thym.js";
import { preparerSerie, oublierSerie, debutSeries, effacerSeries, ajouterEnSerie, finSeries } from "./series.js";

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
  /* 30 pierres des champs, pas plus (décidé avec Yo le 18 octobre 2026 : environ 70 pierres suffisent avant la mine, qui
     en redonne chaque jour ; il y en avait 72, trois fois trop) : on garde les 30 premières selon un tirage par case, pour
     ne rien déplacer d'autre */
  const pierres = [];
  obj.forEach((o, i) => { if(o === "rock") pierres.push(i); });
  pierres.sort((a, b) => hache(a * 31 + 5) - hache(b * 31 + 5)).slice(PIERRES_ILE).forEach(i => obj[i] = null);
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
/* La flore sauvage de l'île : herbes hautes, groseilliers, thym, fleurs des prés (décidé avec Yo le 18 octobre 2026 : moins
   nombreuse et placée comme dans la vraie nature). Posée après coup, avec son propre tirage (pour ne pas déplacer les
   arbres et les pierres), hors de la place du village, jamais sous un bâtiment, sur un chemin, devant le ponton ou le pont.
   En taches d'une même sorte, de plus en plus serrées vers leur milieu, les taches loin les unes des autres :
   - les herbes hautes (60) au bord de l'eau douce et en lisière des bois ;
   - les groseilliers (18) en lisière des bois, à mi-ombre, seuls ou par deux ;
   - le thym (24) au sec et au soleil : près du sable et des pierres, loin des arbres ;
   - les fleurs (74) : 7 de chaque commune en deux taches, 3 de chaque peu commune en une ; en plein pré, sauf la
     violette, le muguet et le perce-neige, qui aiment la lisière et l'ombre des bois ;
   - et les galets de plage (20), un décor sur le sable */
{
  const c = (N-1)/2, sous = new Set();
  state.buildings.forEach(b => { const s = sizeOf(b.type); for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) sous.add(idx(b.x + dx, b.z + dz)); });
  const P = state.ponton, entree = P ? idx(P.x, P.z - 1) : -1, F = state.pontForet, entreeF = F ? idx(F.x, F.z + 1) : -1;
  let terrain = "grass";                            // le sable pour les galets
  const libre = i => { const x = i % N, z = (i - x) / N; return map.type[i] === terrain && !map.obj[i] && !sous.has(i) && !garde.has(i)
    && i !== entree && i !== entreeF && !state.chemins[i] && Math.hypot(x-c, z-c) >= 9; };
  /* ce qu'il y a autour d'une case : des arbres, du sable, des pierres, de l'eau douce */
  const ARBRE = new Set(["tree", "pommier", "pin", "bouleau"]);
  const autour = (i, r, test) => { const x = i % N, z = (i - x) / N; let n = 0;
    for(let dz = -r; dz <= r; dz++) for(let dx = -r; dx <= r; dx++) if(inb(x+dx, z+dz) && test(idx(x+dx, z+dz))) n++; return n; };
  const arbres = i => autour(i, 2, j => ARBRE.has(map.obj[j]));
  const lisiere = i => { const n = arbres(i); return n >= 1 && n <= 5; };
  const humide = i => autour(i, 4, j => ORIGINE[j] === "water" && !MER[j]) > 0;
  const sec = i => autour(i, 3, j => map.type[j] === "sand" || map.obj[j] === "rock") > 0 && arbres(i) === 0;
  const pre = i => autour(i, 3, j => ARBRE.has(map.obj[j])) === 0;
  const centres = [];
  /* des taches de la sorte o (n plantes, taches de min à max) ; poids(i) : combien la case lui plaît */
  function taches(rnd, o, n, min, max, poids){
    const cand = [];
    for(let i = 0; i < N*N; i++) if(libre(i)){ const w = poids(i); if(w > 0) cand.push([Math.pow(rnd(), 1 / w), i]); }
    cand.sort((a, b) => b[0] - a[0]);
    let pose = 0;
    for(const ecart of [9, 6, 3, 0]) for(const [, i] of cand){
      if(pose >= n) return;
      const x = i % N, z = (i - x) / N;
      if(!libre(i) || centres.some(([a, b]) => Math.hypot(a - x, b - z) < ecart)) continue;
      centres.push([x, z]);
      const voulu = Math.min(n - pose, min + Math.floor(rnd() * (max - min + 1)));
      /* le milieu, puis les cases autour, les plus proches d'abord, une sur deux environ */
      const places = [[0, 0]];
      for(let dz = -2; dz <= 2; dz++) for(let dx = -2; dx <= 2; dx++) if(dx || dz) places.push([dx, dz]);
      places.sort((p, q) => Math.hypot(...p) - Math.hypot(...q) + (rnd() - .5));
      let k = 0;
      for(const [dx, dz] of places){
        if(k >= voulu) break;
        const j = idx(x + dx, z + dz);
        if(inb(x + dx, z + dz) && libre(j) && (k === 0 || rnd() < .7)){ map.obj[j] = o; k++; }
      }
      pose += k;
    }
  }
  const FLORE = FLORE_ILE;
  taches(mulberry32(state.seed * 7 + 3), "herbe", FLORE.herbe, 3, 6, i => humide(i) ? 5 : lisiere(i) ? 3 : .3);
  taches(mulberry32(state.seed * 7 + 4), "buisson", FLORE.buisson, 1, 2, i => lisiere(i) ? 5 : .1);
  taches(mulberry32(state.seed * 11 + 5), "thym", FLORE.thym, 4, 6, i => sec(i) ? 5 : pre(i) ? .3 : 0);
  const rnd = mulberry32(state.seed * 13 + 7), OMBRE = ["violette", "muguet", "perceNeige"];
  for(const k of Object.keys(FLEURS)){
    const commun = FLEURS[k].rarete === "commun", poids = OMBRE.includes(k) ? (i => lisiere(i) ? 5 : .1) : (i => pre(i) ? 4 : .4);
    if(commun){ taches(rnd, k, 4, 3, 4, poids); taches(rnd, k, FLORE.fleurCommune - 4, 3, 3, poids); }
    else taches(rnd, k, FLORE.fleurPeuCommune, 3, 3, poids);
  }
  /* les galets de plage (décidé par Yo le 20 octobre 2026 : un décor) : sur le sable, surtout au bord de l'eau, là où la
     mer les dépose, et près des pierres */
  terrain = "sand";
  taches(mulberry32(state.seed * 17 + 9), "galets", GALETS_ILE, 1, 1, i => (autour(i, 1, j => ORIGINE[j] === "water") ? 5 : 1) + (autour(i, 2, j => map.obj[j] === "rock") ? 3 : 0));
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
/* Le sol de l'île, d'un seul tenant (étape 2.1, morceau 4a ; Yo, 20 octobre 2026 : « refaire tout le sable et le rendre plus
   naturel » ; son choix : tout le sol) : avant, une dalle carrée par case, en damier de deux couleurs, sur un socle de terre
   au bord de l'eau ; maintenant une seule surface, faite de petits carrés de ⅓ de case (S sommets par case) :
   - sa hauteur suit la terre (la part de terre autour d'un point, d'après les cases voisines) : le milieu d'une case de
     terre est à 0 (là où l'on marche et où tout est posé), puis le sol descend en pente douce sous l'eau ; la côte n'est
     plus en escalier, ses coins s'arrondissent ;
   - sa couleur : l'herbe de la saison et le sable se mêlent sur ½ case, l'herbe varie doucement d'un endroit à l'autre
     (plus de damier), le fond se fonce sous l'eau, la neige la blanchit, une case qu'on commence à creuser est de la terre ;
   - découpée en carrés de CH × CH cases (chacun écarté du dessin hors du champ de la caméra) ; seulement la terre et
     l'eau tout près (le fond de la mer, au-delà, reste plat) ; refaite autour d'une case qu'on creuse ou comble. */
const S = 3, R = 1.6, CH = 16, NV = N * S + 1, ou = (gx, gz) => gz * NV + gx;
/* La plage (étape 2.1, morceau 4b) : le grain du sable et les rides que la mer laisse sur le sable mouillé, dessinés au pixel
   (les couleurs des sommets, à ⅓ de case, ne peuvent pas les montrer) : deux nombres par sommet, sa part de sable (« sable »,
   le grain) et combien il est mouillé (« mouille », les rides) ; le grain vient d'une petite image de bruit (GRAIN, répétée
   sur le sol), les rides d'ondes qui serpentent */
const GRAIN_IMG = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), d = x.createImageData(128, 128);
  let g = 7;
  const alea = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
  for(let k = 0; k < 128 * 128; k++){
    const r = alea(), v = r > .965 ? 70 : r > .93 ? 205 : 118 + alea() * 34;   // quelques grains sombres, d'autres clairs
    d.data[k * 4] = d.data[k * 4 + 1] = d.data[k * 4 + 2] = v; d.data[k * 4 + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
})();
const SOL_MAT = toon({vertexColors: true});
SOL_MAT.onBeforeCompile = sh => {
  sh.uniforms.grainSol = {value: GRAIN_IMG};
  sh.vertexShader = "attribute float sable;\nattribute float mouille;\nattribute float berge;\nvarying float vSable;\nvarying float vMouille;\nvarying float vBerge;\nvarying float vSolY;\nvarying vec2 vSolXZ;\n" +
    sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vSable = sable; vMouille = mouille; vBerge = berge; vSolY = position.y; vSolXZ = position.xz;");
  sh.fragmentShader = `uniform sampler2D grainSol;
varying float vSable;
varying float vMouille;
varying float vBerge;
varying float vSolY;
varying vec2 vSolXZ;
float hSol(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruitSol(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hSol(i), hSol(i + vec2(1.0, 0.0)), f.x), mix(hSol(i + vec2(0.0, 1.0)), hSol(i + vec2(1.0, 1.0)), f.x), f.y); }
/* des cellules rondes : la distance au centre de la plus proche (x), l'écart avec la suivante (y : le joint), son tirage (z) */
vec2 cotSol;
vec3 cellSol(vec2 uv){
  vec2 i = floor(uv), f = fract(uv); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for(int y = -1; y <= 1; y++) for(int x = -1; x <= 1; x++){
    vec2 o = vec2(float(x), float(y)), r = o + 0.2 + 0.6 * vec2(hSol(i + o), hSol(i + o + 31.7)) - f;
    float d = dot(r, r);
    if(d < d1){ d2 = d1; d1 = d; id = hSol(i + o + 7.3); cotSol = -r; } else if(d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), id);
}
` + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
  if(vBerge > 0.02){
    if(vSolY > -0.2){
      /* la berge : des mottes de terre rondes, claires au milieu, sombres aux joints, et de la mousse sur certaines */
      float nB = bruitSol(vSolXZ * 4.0), n2B = bruitSol(vSolXZ * 1.3);
      float motte = (nB - 0.5) * 0.22 + (texture2D(grainSol, vSolXZ * 1.1).r - 0.53) * 0.25;
      float mousse = smoothstep(0.5, 0.6, n2B * 0.8 + nB * 0.25 + (1.0 - vBerge) * 0.35) * (1.0 - smoothstep(0.75, 0.88, dot(diffuseColor.rgb, vec3(0.333))));
      vec3 cTerre = diffuseColor.rgb * (1.0 + motte);
      vec3 cMousse = mix(vec3(0.44, 0.6, 0.15), vec3(0.6, 0.73, 0.21), nB) * (1.0 + motte * 0.5);
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(cTerre, cMousse, mousse * 0.85), smoothstep(0.1, 0.6, vBerge));
    } else {
      /* le fond de l'eau douce : des cailloux ronds, bruns et gris, entre eux la vase */
      vec3 cC = cellSol(vSolXZ * 2.6 + 11.0);
      float caillou = 1.0 - smoothstep(0.34, 0.4, cC.x);
      vec3 teinte = mix(vec3(1.05, 0.98, 0.85), vec3(0.9, 0.92, 0.88), cC.z) * (1.0 + (1.0 - smoothstep(0.0, 0.35, cC.x)) * 0.18);
      diffuseColor.rgb *= mix(vec3(0.62, 0.6, 0.5), teinte * (0.92 + dot(cotSol, vec2(-0.6, -0.8)) * 0.5), caillou);
    }
  }
  float grainS = texture2D(grainSol, vSolXZ * 0.8).r - 0.53 + (texture2D(grainSol, vSolXZ * 0.27 + 0.3).r - 0.53) * 0.6;
  diffuseColor.rgb *= 1.0 + grainS * 0.85 * vSable;
  float rideS = sin(vSolXZ.x * 6.3 + vSolXZ.y * 2.4 + sin(vSolXZ.y * 1.7 + vSolXZ.x * 0.6) * 2.2 + sin(vSolXZ.x * 0.9) * 1.4);
  diffuseColor.rgb *= 1.0 - smoothstep(0.55, 0.95, rideS) * 0.13 * vMouille + smoothstep(-0.2, -0.75, rideS) * 0.05 * vMouille;`);
};
SOL_MAT.customProgramCacheKey = () => "sol-plage";
const HAUT = new Float32Array(NV * NV), COUL = new Float32Array(NV * NV * 3), SAB = new Float32Array(NV * NV), ENT = new Float32Array(NV * NV), MOU = new Float32Array(NV * NV), BER = new Float32Array(NV * NV), MERV = new Uint8Array(NV * NV);
/* L'eau (étape 2.1, morceau 4c) lit le sol sous elle dans cette petite image, un point par sommet du sol : sa profondeur
   (rouge), si c'est la mer (vert ; l'étang et les mares n'ont pas d'écume), la terre floutée (bleu : la largeur de l'eau
   claire et de l'écume) et la profondeur floutée (alpha : la forme ronde de l'étang) */
const FOND_EAU = new Uint8Array(NV * NV * 4);
const FOND_TEX = new THREE.DataTexture(FOND_EAU, NV, NV, THREE.RGBAFormat);
FOND_TEX.magFilter = FOND_TEX.minFilter = THREE.LinearFilter; FOND_TEX.wrapS = FOND_TEX.wrapT = THREE.ClampToEdgeWrapping;
const PRES_A = new Float32Array(NV * NV), PRES_B = new Float32Array(NV * NV);
/* flou d'une ligne ou d'une colonne (boîte de rayon r), de a vers b */
function flouBoite(a, b, r, pasL, pasC){
  for(let l = 0; l < NV; l++){
    let somme = 0;
    for(let c = -r; c <= r; c++) somme += a[l * pasL + Math.max(0, Math.min(NV - 1, c)) * pasC];
    for(let c = 0; c < NV; c++){
      b[l * pasL + c * pasC] = somme / (2 * r + 1);
      somme += a[l * pasL + Math.min(NV - 1, c + r + 1) * pasC] - a[l * pasL + Math.max(0, c - r) * pasC];
    }
  }
}
function majFondEau(){
  for(let q = 0; q < NV * NV; q++) PRES_A[q] = Math.min(1, Math.max(0, -.2 - HAUT[q]));
  for(let k = 0; k < 2; k++){ flouBoite(PRES_A, PRES_B, 4, NV, 1); flouBoite(PRES_B, PRES_A, 4, 1, NV); }
  for(let q = 0; q < NV * NV; q++) FOND_EAU[q * 4 + 3] = Math.round(PRES_A[q] * 255);
  for(let q = 0; q < NV * NV; q++) PRES_A[q] = HAUT[q] > -.2 ? 1 : 0;
  for(let k = 0; k < 2; k++){ flouBoite(PRES_A, PRES_B, 6, NV, 1); flouBoite(PRES_B, PRES_A, 6, 1, NV); }
  for(let q = 0; q < NV * NV; q++){
    FOND_EAU[q * 4] = Math.round(Math.min(1, Math.max(0, -.2 - HAUT[q])) * 255);
    FOND_EAU[q * 4 + 1] = MERV[q] * 255; FOND_EAU[q * 4 + 2] = Math.round(PRES_A[q] * 255);
  }
  FOND_TEX.needsUpdate = true;
}   // gardés : la neige et la saison ne repeignent que la couleur
const col = new THREE.Color();
/* La neige au sol (étape 1.10, morceau 4) blanchit l'herbe : peinteNeige, de 0 à 1, la neige peinte sur le sol */
const NEIGE = new THREE.Color(0xF2F6F9), entamees = new Set();
let peinteNeige = 0;
const SABLE = new THREE.Color(0xEFDC9C), SABLE_ALT = new THREE.Color(0xE9D38E), TERRE = new THREE.Color(0x9A6B45), FOND = new THREE.Color(0x3E9DB4);
const cH = new THREE.Color(), cH2 = new THREE.Color();
/* un petit relief de couleur, doux (l'herbe qui varie d'un endroit à l'autre) */
const doux = (x, z) => .5 + .25 * Math.sin(x * .37 + z * .11) * Math.cos(z * .29 - x * .07) + .25 * Math.sin(x * .13 - z * .41 + 1.7);
/* la hauteur selon la part de terre : 1 → 0 (le milieu d'une case), ½ → juste au-dessus de l'eau, ¼ → dessous, 0 → le fond */
const PENTE = [[0, -1.0], [.22, -.44], [.4, -.2], [.55, -.06], [.7, 0]];
/* la plage (morceau 4b) : au bord de la mer, le sable descend plus doucement, en haut-fond (l'eau claire du bord) */
const PENTE_PLAGE = [[0, -.82], [.22, -.3], [.4, -.17], [.55, -.06], [.7, 0]];
function hauteurDe(f, table = PENTE){
  for(let k = 1; k < table.length; k++) if(f <= table[k][0]){ const [a, ha] = table[k - 1], [b, hb] = table[k], t = (f - a) / (b - a); return ha + (hb - ha) * t * t * (3 - 2 * t); }
  return 0;
}
/* un point du sol (u, v en cases) : les cases à moins de R de lui, pondérées par la distance (plus R est grand, plus la côte
   s'arrondit) ; rend sa hauteur, et sa couleur dans cH */
function echantillon(u, v){
  let w = 0, terre = 0, sable = 0, wt = 0, ent = 0, mer = 0, douce = 0;
  for(let z = Math.floor(v - R - .5); z <= Math.floor(v + R - .5); z++) for(let x = Math.floor(u - R - .5); x <= Math.floor(u + R - .5); x++){
    const d = Math.hypot(x + .5 - u, z + .5 - v); if(d >= R) continue;
    const k = (1 - d / R) ** 2;
    w += k;
    if(!inb(x, z)) continue;
    const i = idx(x, z), t = map.type[i];
    if(t !== "water"){ terre += k; wt += k; if(t === "sand") sable += k; if(entamees.has(i)) ent += k; }
    else if(MER[i]) mer += k; else douce += k;
  }
  const f = w ? terre / w : 0, ici = idx(Math.max(0, Math.min(N - 1, Math.floor(u))), Math.max(0, Math.min(N - 1, Math.floor(v))));
  const sb = wt ? sable / wt : (lieuEau(ici) === "mer" ? 1 : .3), e = wt ? ent / wt : 0;
  /* le sable et l'herbe : leur limite un peu plus nette que la côte (la part de sable passe de ⅓ à ⅔) */
  const sn = sb <= 0 || sb >= 1 ? sb : sb + (doux(u * 2.3 + 7, v * 2.1) - .5) * .4 + (doux(v * 6.1, u * 5.3) - .5) * .15;   // une limite irrégulière, comme dans la nature
  const s = sn <= .2 ? 0 : sn >= .8 ? 1 : ((sn - .2) / .6) ** 2 * (3 - 2 * (sn - .2) / .6);
  /* la plage : le bord de la mer, côté sable */
  const plage = mer > 0 ? Math.min(1, s * 1.4) : 0;
  let h = plage > 0 ? hauteurDe(f) * (1 - plage) + hauteurDe(f, PENTE_PLAGE) * plage : hauteurDe(f);
  if(e > 0) h -= .08 * e;
  /* le milieu d'une case d'eau reste bien sous l'eau (une mare creusée à la pelle, d'une seule case, se voit) */
  if(map.type[ici] === "water" && u >= 0 && v >= 0 && u < N && v < N){
    const dc = Math.max(Math.abs(u - Math.floor(u) - .5), Math.abs(v - Math.floor(v) - .5)) / .5;
    h = Math.min(h, -.6 + (h + .6) * dc);
  }
  /* l'eau douce a son propre fond de cailloux, en cuvette (pas le fond plat de la mer, qu'on ne dessine pas) */
  if(mer === 0 && douce > 0) h = Math.max(h, -.45 - .2 * Math.min(1, douce / w * 1.6));
  /* le sable mouillé : la bande que la mer vient lécher, juste au-dessus de l'eau, et ce qui est dessous */
  const m = plage > 0 ? plage * Math.min(1, Math.max(0, (-.015 - h) / .1)) : 0;
  /* la berge de l'étang et des mares (l'image de Yo, « Le bord de l'étang ») : une bande de terre brune en mottes rondes,
     moussue, au bord de l'eau douce ; sous l'eau, le fond de cailloux */
  const b = douce > 0 && w ? Math.min(1, Math.max(0, (douce / w - .1) / .12)) : 0;
  dernier.s = s; dernier.e = e; dernier.m = m; dernier.b = b; dernier.mer = mer > 0 || (!wt && lieuEau(ici) === "mer") ? 1 : 0;
  peindre(u, v, h, s, e, m, b);
  return h;
}
const dernier = {s: 0, e: 0, m: 0, b: 0, mer: 0};
const BERGE = new THREE.Color(0x94612F), FOND_DOUX = new THREE.Color(0x8E8A55);
const MOUILLE = new THREE.Color(0xC9AE6E);
/* la couleur d'un point : l'herbe de la saison, qui varie doucement, et le sable, mêlés ; le fond sous l'eau ; dans cH */
function peindre(u, v, h, s, e, m = 0, b = 0){
  const wx = u - H, wz = v - H, herbe = enSaison().herbe;
  cH.setHex(herbe[0]).lerp(cH2.setHex(herbe[1]), doux(wx, wz));
  col.copy(SABLE).lerp(SABLE_ALT, doux(wz * 1.7, wx * 1.3));
  cH.lerp(col, s);
  if(b > 0) cH.lerp(BERGE, b * b * (3 - 2 * b));            // la berge de terre brune
  if(peinteNeige > 0) cH.lerp(NEIGE, peinteNeige * (1 - s * .4));   // le sable, un peu moins
  if(e > 0) cH.lerp(TERRE, e);
  if(m > 0) cH.lerp(MOUILLE, m * .75);                     // le sable mouillé, plus sombre et plus chaud
  if(h < -.2) cH.lerp(b > 0 ? FOND_DOUX : FOND, Math.min(1, (-.2 - h) / .6) * (b > 0 ? .55 : .8));   // l'eau douce : un fond de cailloux brun-vert
}
function sommet(gx, gz){
  const q = ou(gx, gz);
  HAUT[q] = echantillon(gx / S, gz / S); SAB[q] = dernier.s; ENT[q] = dernier.e; MOU[q] = dernier.m; BER[q] = dernier.b; MERV[q] = dernier.mer;
  COUL[q * 3] = cH.r; COUL[q * 3 + 1] = cH.g; COUL[q * 3 + 2] = cH.b;
}
/* les morceaux du sol : un par carré de CH × CH cases ; seulement les petits carrés au-dessus du fond plat */
const MORCEAUX = [];
function utile(gx, gz){
  for(const [a, b] of [[gx, gz], [gx + 1, gz], [gx, gz + 1], [gx + 1, gz + 1]]) if(HAUT[ou(a, b)] > -.99) return true;
  return false;
}
function construireMorceau(cx, cz){
  const ancien = MORCEAUX[cz * (N / CH) + cx];
  const pos = [], cou = [], sab = [], mou = [], ber = [], ind = [], g0x = cx * CH * S, g0z = cz * CH * S, n = CH * S + 1;
  for(let j = 0; j < n; j++) for(let k = 0; k < n; k++){
    const gx = g0x + k, gz = g0z + j, o = ou(gx, gz);
    pos.push(gx / S - H, HAUT[o], gz / S - H); cou.push(COUL[o * 3], COUL[o * 3 + 1], COUL[o * 3 + 2]);
    sab.push(SAB[o] * (1 - ENT[o])); mou.push(MOU[o]); ber.push(BER[o] * (1 - ENT[o]));
  }
  for(let j = 0; j < n - 1; j++) for(let k = 0; k < n - 1; k++){
    if(!utile(g0x + k, g0z + j)) continue;
    const a = j * n + k, b = a + 1, c = a + n, d = c + 1;
    /* la diagonale suit la pente (sinon la côte fait des dents) */
    if(Math.abs(HAUT[ou(g0x + k, g0z + j)] - HAUT[ou(g0x + k + 1, g0z + j + 1)]) > Math.abs(HAUT[ou(g0x + k + 1, g0z + j)] - HAUT[ou(g0x + k, g0z + j + 1)]))
      ind.push(a, c, b, b, c, d); else ind.push(a, c, d, a, d, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cou, 3));
  g.setAttribute("sable", new THREE.Float32BufferAttribute(sab, 1));
  g.setAttribute("mouille", new THREE.Float32BufferAttribute(mou, 1));
  g.setAttribute("berge", new THREE.Float32BufferAttribute(ber, 1));
  g.setIndex(ind); g.computeVertexNormals(); g.computeBoundingSphere();
  if(ancien){ ancien.geometry.dispose(); ancien.geometry = g; return; }
  const m = new THREE.Mesh(g, SOL_MAT); m.receiveShadow = true;
  MORCEAUX[cz * (N / CH) + cx] = m; scene.add(m);
}
/* refaire le sol entre les cases (x0, z0) et (x1, z1), et un peu autour */
/* La berge de l'étang et des mares (l'image de Yo, « Le bord de l'étang ») : des mottes de terre rondes, à demi dans l'eau,
   tout le long de l'eau douce, certaines coiffées de mousse ; en série (un seul dessin pour toutes, deux avec la mousse) */
const MOTTE_GEO = new THREE.SphereGeometry(1, 14, 9);
const MOTTES = new THREE.InstancedMesh(MOTTE_GEO, toon({color: 0xffffff}), 2400);
const MOUSSES = new THREE.InstancedMesh(MOTTE_GEO, toon({color: 0xffffff}), 2400);
MOTTES.receiveShadow = MOUSSES.receiveShadow = true;
MOTTES.setColorAt(0, new THREE.Color()); MOUSSES.setColorAt(0, new THREE.Color());
MOTTES.count = MOUSSES.count = 0;
scene.add(MOTTES, MOUSSES);
const TERRE_MOTTE = [0x9C6331, 0x8A5527, 0xA9713B, 0x93602F].map(c => new THREE.Color(c));
const MOUSSE_MOTTE = [0x7FA62A, 0x97BA33, 0x6E9524].map(c => new THREE.Color(c));
const mM = new THREE.Matrix4(), qM = new THREE.Quaternion(), vM = new THREE.Vector3(), sM = new THREE.Vector3(), cM = new THREE.Color(), HAUT_Y = new THREE.Vector3(0, 1, 0);
const tirM = q => (Math.imul(q + 7919, 2654435761) >>> 0) % 1000 / 1000;
function majMottes(){
  let n = 0, k = 0;
  /* là où la ligne de l'eau coupe un petit côté du sol (entre deux points, l'un sec, l'autre sous l'eau) */
  for(let gz = 1; gz < NV - 1; gz++) for(let gx = 1; gx < NV - 1; gx++) for(let c = 0; c < 2; c++){
    const q = ou(gx, gz), o = c ? ou(gx, gz + 1) : ou(gx + 1, gz), h = HAUT[q], ho = HAUT[o];
    if((h > -.2) === (ho > -.2) || ho <= -.99 || h <= -.99) continue;
    if(Math.max(BER[q], BER[o]) < .4 || MERV[q] || MERV[o] || ENT[q] > 0 || ENT[o] > 0) continue;   // seulement l'eau douce
    const qq = q * 2 + c;
    if(tirM(qq * 7 + 1) > .95 || n >= 2400) continue;
    const t = (h + .2) / (h - ho), r = .14 + tirM(qq * 3 + 2) * .11;
    const x = (gx + (c ? 0 : t)) / S - H + (tirM(qq * 5 + 3) - .5) * .12, z = (gz + (c ? t : 0)) / S - H + (tirM(qq * 9 + 4) - .5) * .12;
    qM.setFromAxisAngle(HAUT_Y, tirM(qq * 11) * 6.28);
    vM.set(x, -.2 + r * .05, z); sM.set(r * 1.3, r * .8, r);
    MOTTES.setMatrixAt(n, mM.compose(vM, qM, sM));
    cM.copy(TERRE_MOTTE[Math.floor(tirM(qq * 13) * 4)]); if(peinteNeige > 0) cM.lerp(NEIGE, peinteNeige * .85);
    MOTTES.setColorAt(n++, cM);
    /* la mousse sur le dessus de certaines (pas sous la neige) */
    if(tirM(qq * 17 + 5) < .35 && peinteNeige < .4 && k < 2400){
      vM.y += r * .3; sM.set(r * 1.1, r * .64, r * .86);
      MOUSSES.setMatrixAt(k, mM.compose(vM, qM, sM));
      MOUSSES.setColorAt(k++, MOUSSE_MOTTE[Math.floor(tirM(qq * 19) * 3)]);
    }
  }
  MOTTES.count = n; MOUSSES.count = k;
  MOTTES.instanceMatrix.needsUpdate = MOUSSES.instanceMatrix.needsUpdate = true;
  MOTTES.instanceColor.needsUpdate = MOUSSES.instanceColor.needsUpdate = true;
}
function refaireSol(x0 = 0, z0 = 0, x1 = N - 1, z1 = N - 1){
  const ga = Math.max(0, (x0 - 2) * S), gb = Math.min(NV - 1, (x1 + 3) * S), ha = Math.max(0, (z0 - 2) * S), hb = Math.min(NV - 1, (z1 + 3) * S);
  for(let gz = ha; gz <= hb; gz++) for(let gx = ga; gx <= gb; gx++) sommet(gx, gz);
  for(let cz = Math.floor(ha / S / CH); cz <= Math.min(N / CH - 1, Math.floor(hb / S / CH)); cz++)
    for(let cx = Math.floor(ga / S / CH); cx <= Math.min(N / CH - 1, Math.floor(gb / S / CH)); cx++) construireMorceau(cx, cz);
  majFondEau(); majMottes();
}
/* repeindre le sol (une nouvelle saison, la neige) : seulement ses couleurs, sans refaire sa forme */
function repeindreSol(){
  for(let gz = 0; gz < NV; gz++) for(let gx = 0; gx < NV; gx++){
    const q = ou(gx, gz);
    if(HAUT[q] <= -.99) continue;                    // le fond plat, qu'on ne dessine pas
    peindre(gx / S, gz / S, HAUT[q], SAB[q], ENT[q], MOU[q], BER[q]);
    COUL[q * 3] = cH.r; COUL[q * 3 + 1] = cH.g; COUL[q * 3 + 2] = cH.b;
  }
  MORCEAUX.forEach((m, k) => {
    const cx = k % (N / CH), cz = Math.floor(k / (N / CH)), n = CH * S + 1, a = m.geometry.attributes.color.array;
    for(let j = 0; j < n; j++) for(let q = 0; q < n; q++){ const o = ou(cx * CH * S + q, cz * CH * S + j) * 3, d = (j * n + q) * 3; a[d] = COUL[o]; a[d + 1] = COUL[o + 1]; a[d + 2] = COUL[o + 2]; }
    m.geometry.attributes.color.needsUpdate = true;
  });
  majMottes();                                        // la neige sur les mottes de la berge
}
/* La couleur du sol au milieu d'une case [r, g, b] (pour la vérification : l'herbe selon la saison, la neige) */
export const couleurSol = i => { if(map.type[i] === "water") return null; echantillon(i % N + .5, Math.floor(i / N) + .5); return [cH.r, cH.g, cH.b]; };
/* la hauteur du sol au milieu d'une case (pour la vérification) */
export const hauteurSol = i => echantillon(i % N + .5, Math.floor(i / N) + .5);
/* la plage (pour la vérification) : combien de points du sol sont mouillés, et si le sol a son grain et ses rides */
/* pour la vérification : l'eau lit le sol sous elle (FOND_TEX) ; les points du rivage de la mer, où vient l'écume, et ceux de l'eau douce, sans écume */
export const eauIci = () => {
  let rivage = 0, douce = 0;
  for(let q = 0; q < NV * NV; q++){
    if(FOND_EAU[q * 4] === 0) continue;
    if(FOND_EAU[q * 4 + 1]){ if(FOND_EAU[q * 4 + 2] > 80 && FOND_EAU[q * 4 + 2] < 130) rivage++; } else douce++;
  }
  return {fond: !!EAU_MAT.onBeforeCompile && water.material === EAU_MAT, rivage, douce};
};
/* pour la vérification : les mottes de la berge, et qu'aucune n'est au bord de la mer */
export const bergeIci = () => {
  let mer = 0;
  const m = new THREE.Matrix4(), v = new THREE.Vector3();
  for(let k = 0; k < MOTTES.count; k++){
    MOTTES.getMatrixAt(k, m); v.setFromMatrixPosition(m);
    const x = Math.floor(v.x + H), z = Math.floor(v.z + H);
    for(let dz = -1; dz <= 1; dz++) for(let dx = -1; dx <= 1; dx++) if(inb(x + dx, z + dz) && MER[idx(x + dx, z + dz)]){ mer++; dz = dx = 2; }
  }
  return {mottes: MOTTES.count, mousses: MOUSSES.count, mer};
};
export const plageIci = () => ({mouilles: MOU.reduce((n, v) => n + (v > .5 ? 1 : 0), 0), grain: MORCEAUX.some(m => m && m.geometry.attributes.sable && m.geometry.attributes.mouille)});
refaireSol();
/* Creuser, combler (étape 1.9) : la case devient de l'eau (« water ») ou de la terre (son herbe ou son sable d'origine,
   de l'herbe pour l'étang comblé) ; gardé dans la partie. Rien n'y repousse tout seul ensuite */
export function setTerrain(i, t){
  map.type[i] = t; entamees.delete(i);
  if(t === ORIGINE[i]) delete state.terrain[i]; else state.terrain[i] = t;
  if(!state.ile[i]) state.ile[i] = {o: null};
  refaireSol(i % N, Math.floor(i / N), i % N, Math.floor(i / N));
}
export const terreDe = i => ORIGINE[i] === "water" ? "grass" : ORIGINE[i];
/* Une case qu'on commence à creuser, ou qu'on laisse (entame = false) */
export function entamer(i, entame){ if(entame) entamees.add(i); else entamees.delete(i); refaireSol(i % N, Math.floor(i / N), i % N, Math.floor(i / N)); }
/* L'eau de l'île (étape 2.1, morceau 4c ; l'image de Yo, « Le rivage de la mer », 20 octobre 2026) : une eau turquoise,
   transparente au bord (on voit le sable du fond), plus foncée et plus opaque vers le large ; des reflets de lumière en réseau
   qui dansent sur le fond peu profond (les caustiques) ; au bord de la mer, une épaisse frange d'écume blanche, festonnée,
   percée de petites bulles, qui monte et redescend avec les vagues, et de fines lignes d'écume qui arrivent du large ;
   l'étang et les mares restent calmes, sans écume. Elle lit la profondeur dans FOND_TEX (le sol, refait quand on creuse ou
   comble) ; son temps est celui du vent (VENT.temps). */
const EAU_MAT = new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, shininess: 70, specular: 0x6FB8C8});
EAU_MAT.onBeforeCompile = sh => {
  sh.uniforms.fondEau = {value: FOND_TEX}; sh.uniforms.tEau = VENT.temps;
  sh.vertexShader = "varying vec2 vEauXZ;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vEauXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
  sh.fragmentShader = `uniform sampler2D fondEau;
uniform float tEau;
varying vec2 vEauXZ;
float hEau(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruitEau(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hEau(i), hEau(i + vec2(1.0, 0.0)), f.x), mix(hEau(i + vec2(0.0, 1.0)), hEau(i + vec2(1.0, 1.0)), f.x), f.y); }
/* des bulles rondes, une par cellule (sa place et sa taille tirées), certaines absentes */
float bulle(vec2 uv){
  vec2 i = floor(uv), f = fract(uv);
  float r = 0.12 + 0.2 * hEau(i + 3.7), d = length(f - 0.5 - (vec2(hEau(i), hEau(i + 9.1)) - 0.5) * (0.9 - 2.0 * r));
  return (1.0 - smoothstep(r - 0.04, r, d)) * step(0.55, hEau(i + 5.3));
}
/* les reflets de lumière sur le fond : un réseau de cellules rondes (leurs bords brillent), qui bougent doucement */
float caustique(vec2 uv, float t){
  vec2 i = floor(uv), f = fract(uv); float d1 = 8.0, d2 = 8.0;
  for(int y = -1; y <= 1; y++) for(int x = -1; x <= 1; x++){
    vec2 o = vec2(float(x), float(y)), h = vec2(hEau(i + o), hEau(i + o + 17.3));
    vec2 r = o + 0.5 + 0.38 * sin(t + 6.2831 * h) - f;
    float d = dot(r, r);
    if(d < d1){ d2 = d1; d1 = d; } else if(d < d2) d2 = d;
  }
  /* des cellules rondes : sombres au milieu, claires entre elles, et leurs bords plus brillants */
  return smoothstep(0.22, 0.5, sqrt(d1)) * 0.6 + (1.0 - smoothstep(0.0, 0.12, sqrt(d2) - sqrt(d1))) * 0.55;
}
` + sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", `vec4 fondE = texture2D(fondEau, ((vEauXZ + ${H.toFixed(1)}) * ${S.toFixed(1)} + 0.5) / ${NV.toFixed(1)});
  float profE = fondE.r, merE = fondE.g, presE = fondE.b;
  /* l'eau claire du bord : on voit le sable du fond, jaune-vert, puis turquoise, puis bleu-vert au large */
  float largeE = clamp(smoothstep(0.08, 0.5, 0.5 - presE) * 0.8 + profE * 0.35, 0.0, 1.0);
  largeE = mix(smoothstep(0.04, 0.4, fondE.a) * 0.85, largeE, merE);   // l'étang et les mares : clairs au bord, plus sombres au milieu
  vec3 colE = mix(vec3(0.62, 0.86, 0.62), vec3(0.30, 0.82, 0.80), smoothstep(0.0, 0.4, largeE));
  colE = mix(colE, vec3(0.08, 0.55, 0.68), smoothstep(0.35, 1.0, largeE));
  /* l'étang et les mares (l'image de Yo, « Le bord de l'étang ») : une eau plus verte, jaune-vert au bord, bleu-vert au milieu */
  colE = mix(mix(vec3(0.66, 0.84, 0.5), vec3(0.22, 0.66, 0.66), smoothstep(0.0, 0.85, largeE)), colE, merE);
  float opacE = mix(0.22, 0.92, smoothstep(0.0, 1.0, largeE));
  /* les reflets de lumière sur le fond peu profond */
  float causE = (1.0 - smoothstep(0.3, 0.9, largeE)) * (0.55 + 0.45 * merE);
  if(causE > 0.01) causE *= caustique(vEauXZ * 1.5 + vec2(bruitEau(vEauXZ * 0.9), bruitEau(vEauXZ * 0.9 + 7.0)) * 0.5, tEau * 0.6);   // au large, pas de calcul
  colE += causE * vec3(0.5, 0.55, 0.45); opacE += causE * 0.18;
  /* l'écume du bord de la mer : une épaisse frange qui monte et redescend, son bord festonné, percée de bulles */
  float nE = bruitEau(vEauXZ * 2.3 + vec2(tEau * 0.12, 0.0)), n2E = bruitEau(vEauXZ * 5.1 - vec2(0.0, tEau * 0.1));
  float vagueE = 0.5 + 0.5 * sin(tEau * 0.8 + bruitEau(vEauXZ * 0.3) * 6.0);
  float bordE = 0.38 - vagueE * 0.05 + (nE - 0.5) * 0.06 + (n2E - 0.5) * 0.02 - bulle(vEauXZ * 2.2 + 0.7) * 0.04;   // des festons ronds
  /* une bande, pas plus large (dans une anse, la terre est proche de tous côtés), et toujours collée au sable */
  float ecumeE = max(smoothstep(bordE - 0.012, bordE + 0.004, presE) * (1.0 - smoothstep(bordE + 0.16, bordE + 0.2, presE)),
                     1.0 - smoothstep(0.02 + vagueE * 0.03, 0.05 + vagueE * 0.03, profE)) * merE;
  float bullesE = max(bulle(vEauXZ * 5.0), bulle(vEauXZ * 8.0 + 4.3));
  ecumeE *= 1.0 - bullesE * smoothstep(bordE + 0.01, bordE + 0.04, presE) * 0.85;
  /* quelques bulles détachées devant la frange */
  float goutE = bulle(vEauXZ * 6.0 + 1.7) * (smoothstep(bordE - 0.07, bordE - 0.03, presE) - smoothstep(bordE - 0.02, bordE, presE));
  ecumeE = max(ecumeE, goutE * merE);
  /* de fines lignes d'écume qui arrivent du large vers la plage */
  float phE = fract(tEau * 0.1 + presE * 3.0 + nE * 0.15);
  ecumeE = max(ecumeE, smoothstep(0.955, 1.0, phE) * smoothstep(0.12, 0.3, presE) * (1.0 - smoothstep(bordE - 0.04, bordE, presE)) * merE * (0.45 + 0.4 * nE));
  colE = mix(colE, vec3(1.0, 1.0, 0.98), ecumeE); opacE = mix(opacE, 1.0, ecumeE);
  vec4 diffuseColor = vec4(colE * diffuse, clamp(opacE, 0.0, 1.0));`);
};
EAU_MAT.customProgramCacheKey = () => "eau-ile";
export const water = new THREE.Mesh(new THREE.PlaneGeometry(N+90, N+90), EAU_MAT);
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
  if(Date.now() - c.vide > 100 * 86400000) return 0;    // cueilli un été d'avant : l'été suivant, il est de nouveau plein
  const a = c.arrose || pluieDepuis(c.vide);          // la pluie arrose aussi (étape 1.10, morceau 4), même jeu fermé
  if(!a) return -1;
  return Math.max(0, RECOLTE.buisson.retour - (Date.now() - a) / 1000);
}
/* Les fleurs (étape 1.9) : cueillie, elle quitte sa place depuis le 18 octobre 2026 ; une fleur cueillie avant refleurit sur place (FLEUR_RARETE.refleurit) ; temps restant en secondes */
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
const ENNEIGE = new Set(["tree", "souche", "pommier", "pin", "bouleau", "rock", "buisson", "thym", "galets"]);
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
  } else if(o === "thym"){                          // le thym (étape 2.1, morceau 3 : thym.js, d'après l'image de Yo) ; ras une fois cueilli
    const st = stageOf(i);
    g.add(thymModele(saison(), st < 2 ? "jeune" : thymLeft(i) > 0 ? "rase" : "fleuri", r, neigeBranches()));
    if(st < 2) g.scale.setScalar(st === 0 ? .45 : .75);
  } else if(FLEURS[o]){                             // une fleur (étape 1.9) : pousse, feuilles, ou en fleur à sa couleur
    const st = stageOf(i);
    g.add(fleurModele(o, couleurDe(i), st < 2 ? (st === 0 ? 0 : 1) : fleurie(i) ? 2 : 1));
  } else if(MEUBLES[o] && MEUBLES[o].dehors){       // une lumière posée dehors (demande de Yo, 11 octobre 2026) : torchère, chandelle, feu de camp…
    g.add(makeMeuble(o, undefined, state.ile[i]));
  } else if(o === "coffre"){                        // un coffre de réserve, posé face à la caméra
    const c = makeMeuble("coffre");
    c.scale.setScalar(.75); g.add(c);
  } else if(o === "galets"){                        // les galets de plage (étape 2.1, morceau 3 : galets.js, d'après l'image de Yo)
    g.add(galetsModele(r, neigeBranches()));
  } else if(o === "rock"){                          // la pierre des champs (étape 2.1, morceau 3 : pierre.js, d'après l'image de Yo)
    g.add(pierreChamps(saison(), r, neigeBranches(), map.type[i] === "sand"));
    g.scale.setScalar(.85 + r * .3);
  } else g.add(rockMesh(o, r));                      // un rocher rapporté de la mine, à veines de cuivre ou non
  g.rotation.y = o === "coffre" || MEUBLES[o] ? 0 : r * 6.28;
  g.position.set(centerOf(i % N), 0, centerOf(Math.floor(i / N)));
  g.updateMatrixWorld(true); g.updateMatrixWorld = majSiVisible;   // sa place calculée une fois, puis seulement quand il se voit
  scene.add(g); meshes.set(i, g); ranger(g, i);
  if(EN_SERIE(o)) preparerSerie(g);                  // une petite chose : de loin, dessinée en série (series.js)
}
/* Pour un téléphone milieu de gamme (mission de Yo, 16 octobre 2026 : les saccades en marchant) : three.js recalcule à
   chaque image la place de chaque objet de la scène, même caché (environ 5 500 objets, dont 600 à l'écran : le cinquième
   du temps du dessin). Un objet de l'île caché par montrerChamp ne bouge pas : on saute ce calcul tant qu'il est caché ;
   sa place est calculée à sa création, puis à chaque image dès qu'il se voit (montrerChamp passe avant le dessin) */
const MAJ = THREE.Object3D.prototype.updateMatrixWorld;
function majSiVisible(force){ if(this.visible) MAJ.call(this, force); }
/* Refait le modèle d'une case (après une coupe, une plantation, une pousse) */
function refreshObj(i){
  const old = meshes.get(i);
  if(old){ scene.remove(old); meshes.delete(i); looks.delete(i); sortir(old, i); oublierSerie(old); }
  if(map.obj[i]) buildObj(i);
}
export const objMesh = i => meshes.get(i);
/* Pour un téléphone modeste (l'île agrandie, étape 2.1 : trois fois plus de nature) : à chaque image, on ne garde à
   dessiner que ce qui est dans le champ de la caméra, avec une marge pour les ombres qui y tombent (une boule de 6 P autour
   de chaque objet), et pas plus loin que le brouillard (main.js) ; le reste attend, sans rien coûter */
/* Tout, petites choses comprises (herbes, fleurs, thym, buissons, pierres, souches, coffres), jusqu'au bout du brouillard,
   là où il les cache tout entières (correction de Yo, 16 octobre 2026 : des objets apparaissaient trop tard). Avant, les
   petites choses s'arrêtaient à 28 P de la caméra (v2.1.6, pour un téléphone modeste) : à la première personne, le
   brouillard n'en efface que 10 % à cette distance, elles y font 20 à 30 pixels, et jusqu'à 235 d'entre elles manquaient
   à l'écran puis apparaissaient d'un coup en marchant (popping.mjs, dossier de la séance) */
const champ = new THREE.Frustum(), mVue = new THREE.Matrix4(), boule = new THREE.Sphere(new THREE.Vector3(), 6);
/* La partition de l'île (mission de Yo, 16 octobre 2026 : les saccades en marchant) : l'île est découpée en carrés de
   CARRE × CARRE cases ; chaque objet est rangé dans le carré de sa case. Un carré entier hors du champ, ou plus loin que le
   brouillard, cache d'un coup tout ce qu'il contient (une seule fois, tant qu'il reste dehors) ; ses objets ne sont
   regardés un par un que s'il touche le champ, avec exactement la même règle qu'avant (la boule d'un carré, 6 P plus sa
   demi-diagonale, contient celles de tous ses objets : rien n'apparaît ni ne disparaît plus tôt ou plus tard). Et rien
   n'est pris en mémoire à chaque image (des tableaux, Math.sqrt) : le navigateur a moins de ménage à faire */
const CARRE = 8, NC = N / CARRE, DEMI = CARRE * Math.SQRT1_2;
const carres = Array.from({length: NC * NC}, (_, k) => ({x: (k % NC) * CARRE - H + CARRE / 2, z: Math.floor(k / NC) * CARRE - H + CARRE / 2,
  objets: [], cache: false}));
const carreDe = i => Math.floor((i % N) / CARRE) + Math.floor(Math.floor(i / N) / CARRE) * NC;
const bouleCarre = new THREE.Sphere(new THREE.Vector3(), 6 + DEMI);
function ranger(g, i){ const c = carres[carreDe(i)]; c.objets.push(g); c.cache = false; }
function sortir(g, i){ const c = carres[carreDe(i)], k = c.objets.indexOf(g); if(k >= 0) c.objets.splice(k, 1); }
/* Ce qui est posé au sol hors de la carte (le bois et les cailloux, sol.js) suit la même règle, jusqu'au bout du brouillard
   (au-delà, le brouillard le cache tout entier : rien ne change à l'image), et sa place n'est recalculée que quand il se voit */
const caseDe = g => idx(tileOf(g.position.x), tileOf(g.position.z));
export function dansLeChamp(g){ g.updateMatrixWorld(true); g.updateMatrixWorld = majSiVisible; ranger(g, caseDe(g)); preparerSerie(g); }
export function horsDuChamp(g){ sortir(g, caseDe(g)); oublierSerie(g); }
/* Les petites choses vont en série au loin (series.js) ; pas les arbres (leurs modèles changent de feuillage selon la
   distance), ni les lumières et les coffres posés */
const EN_SERIE = o => !(o === "tree" || ESSENCES.includes(o) || MEUBLES[o] || o === "coffre");
/* serie : à chaque image du jeu à la première personne (main.js), les petites choses lointaines dans le champ sont dessinées
   en série au lieu d'elles-mêmes ; sans serie (vu de dessus, les essais), on ne fait que trier */
export function montrerChamp(camera, loin, serie = false){
  camera.updateMatrixWorld();
  mVue.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix);
  champ.setFromProjectionMatrix(mVue);
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  let soleil = null;
  if(!serie) effacerSeries();
  else {                                              // la zone d'ombre du soleil de cette image (three.js la recalcule de même)
    debutSeries();
    sun.updateMatrixWorld(); sun.target.updateMatrixWorld(); sun.shadow.updateMatrices(sun);
    soleil = sun.shadow.getFrustum();
  }
  for(let k = 0; k < carres.length; k++){
    const c = carres[k], L = c.objets;
    if(!L.length) continue;
    const dx = c.x - cx, dz = c.z - cz;
    bouleCarre.center.set(c.x, 1.5, c.z);
    if(Math.sqrt(dx * dx + dz * dz) - DEMI >= loin || !champ.intersectsSphere(bouleCarre)){
      if(!c.cache){ for(let j = 0; j < L.length; j++) L[j].visible = false; c.cache = true; }
      continue;
    }
    c.cache = false;
    for(let j = 0; j < L.length; j++){
      const g = L[j], ox = g.position.x - cx, oz = g.position.z - cz;
      boule.center.set(g.position.x, 1.5, g.position.z);
      const vu = Math.sqrt(ox * ox + oz * oz) < loin && champ.intersectsSphere(boule);
      /* de loin, en série : la même distance que celle du modèle léger (presLoin, chene.js), depuis la caméra en 3D */
      g.visible = vu && !(serie && ajouterEnSerie(g, Math.sqrt(ox * ox + (g.position.y - cy) ** 2 + oz * oz), camera, champ, soleil));
    }
  }
  if(serie) finSeries();
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
const SAISONNIER = o => o === "tree" || o === "herbe" || o === "buisson" || o === "thym" || o === "souche" || o === "rock" || ESSENCES.includes(o);
let peinte = saison();
export function rafraichirSaison(){
  peinte = saison();
  repeindreSol();
  for(let i = 0; i < N*N; i++) if(SAISONNIER(map.obj[i])) refreshObj(i);
}
/* Ce qui a été planté grandit, les herbes repoussent, les baies reviennent : on regarde régulièrement */
/* La neige au sol : on repeint l'herbe quand elle a assez changé (elle tombe et fond en douceur) */
setInterval(() => {
  const s = neigeAuSol();
  if(Math.abs(s - peinteNeige) < .03 && !(s === 0 && peinteNeige > 0)) return;
  peinteNeige = s < .01 ? 0 : s;
  repeindreSol();
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
