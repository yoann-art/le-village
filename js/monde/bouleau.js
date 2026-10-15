/* ================= Le bouleau de l'île (étape 2.1, morceau 2c : les arbres de l'île) =================
   D'après les images de Yo (Desktop\Hearthwild\images\arbres\bouleau.png, jeune-bouleau.png, souche-bouleau.png) : un
   tronc blanc crème marqué de taches sombres allongées, qui s'évase en racines aux bouts sombres, un noeud rond près du
   pied ; il monte jusqu'à la cime et donne des branches blanches de chaque côté, chacune portant une boule de feuilles
   dorées (en automne) qui retombent en jupe. Le jeune bouleau, fin, trois boules. Sa souche : l'écorce blanche qui pèle en
   bandes, des taches sombres, le dessus clair aux cernes et ses fentes, un noeud en spirale, des racines aux bouts sombres.
   Grand Carnet : « Bois, écorce blanche pour les parchemins » ; « feuilles d'or en automne » ; décidé avec Yo pour tous les
   arbres : l'hiver réaliste (le bouleau perd toutes ses feuilles), un peu de neige quand il neige, des feuilles au pied en
   automne seulement. Il pousse au bord de l'eau douce (ile.js). Mêmes petits outils que les autres arbres (chene.js), au
   plus près des images (règle de Yo, 14 octobre 2026). */
import { fusionner } from "./formes.js";
import { aleaDe, segment, brancheCourbe, patte, tronc, feuilleGeo, GLAND, BOSSE, NEIGE_GEO, feuillageDe, neigeDe, ombreDe, feuillesEtOmbre, MAT_BOIS, MAT_FEUILLES, MAT_PLAT, mesh, TONS_ESPECES } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion();
const BLANC = 0xEFE6D2, BLANC_OMBRE = 0xD8CCB4, TACHE = 0x4A3C34;
/* La feuille du bouleau : large, ovale, pointue au bout (comme sur les images), en relief */
const FEUILLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .72)), .6) * .42 * (1 + .04 * Math.cos(t * Math.PI * 11)), 5);
/* Vert tendre au printemps, vert franc l'été, or en automne (Grand Carnet) ; trois nuances */
const TONS = {
  printemps: [[0xB0DE6E, 0x98D05C, 0xC4E886, 0x86C04E], [0xA8DA68, 0x90CA56, 0xBEE480, 0x80BA48], [0xB8E276, 0xA0D462, 0xCCEC8E, 0x8EC654]],
  ete:       [[0x8CC24E, 0x74AE40, 0xA4D05E, 0x5E9A36], [0x86BE4A, 0x6EA83C, 0x9ECC5A, 0x5A9634], [0x92C652, 0x7AB244, 0xAAD462, 0x64A03A]],
  automne:   [[0xF8BC24, 0xF0A41A, 0xFCD040, 0xE88A18], [0xF6B21E, 0xEC9A16, 0xFAC838, 0xE28014], [0xFAC42E, 0xF2AC20, 0xFDD650, 0xEA921C]]
};
TONS_ESPECES.bouleau = TONS;

/* ---------- la forme : d'après les images ---------- */
const FORME = {
  adulte: {tronc: [.09, .27, 3.5], racines: [5, .6, .15], taches: 26, noeud: [.42, .9, .12],
    boules: [[.12, 3.66, -.05, .58, .78], [-1.0, 3.1, .08, .54, .78], [1.04, 2.8, -.12, .53, .78], [-1.28, 2.18, .32, .58, .76], [1.18, 1.98, .26, .5, .78], [-.22, 2.6, -.86, .48, .8], [.34, 2.42, .86, .42, .8]],
    depart: [[3.2, .8], [2.5, .7], [2.2, .7], [1.6, .75], [1.45, .75], [2.0, .6], [1.9, .6]]},
  jeune:  {tronc: [.05, .1, 1.55], racines: [3, .26, .055], taches: 8, noeud: null,
    boules: [[0, 1.6, 0, .42, .85], [-.48, 1.05, .05, .33, .8], [.48, .95, -.05, .31, .8]],
    depart: [[1.4, .6], [.75, .6], [.68, .6]]}
};
/* Une tache sombre de l'écorce : allongée en travers du tronc, posée contre lui */
function tache(M, r, y, a, l, h){
  const P = V(Math.cos(a) * r, y, Math.sin(a) * r), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(Math.cos(a), 0, Math.sin(a)));
  M.push({geo: BOSSE, m: new THREE.Matrix4().compose(P, q, V(l, h, .025)), c: TACHE});
}
/* Le bois : le tronc blanc et ses taches, son noeud, ses racines, ses branches (l'hiver, des rameaux fins en plus) */
function boisDe(f, hiver, alea){
  const [rh, rb, h] = f.tronc, M = [];
  M.push({geo: tronc(rh, rb, h, 5, .04, 0, .7, f === FORME.adulte ? .1 : .04), m: new THREE.Matrix4(), c: BLANC});
  const rAt = y => (rh + (rb - rh) * Math.max(0, 1 - y / h)) * (1 + .7 * Math.pow(Math.max(0, 1 - y / h), 3));
  for(let k = 0; k < f.taches; k++){                         // des taches sombres, de bas en haut
    const y = .12 + (h - .2) * (k + alea() * .6) / f.taches, a = alea() * Math.PI * 2;
    tache(M, rAt(y) * .98, y, a, (.07 + alea() * .08) * (f === FORME.adulte ? 1.4 : .8), (.025 + alea() * .025) * (y < 1 ? 1.4 : 1));
  }
  for(let k = 0; k < f.racines[0]; k++) patte(M, k / f.racines[0] * Math.PI * 2 + .3 + alea() * .4, rb, f.racines[1] * (.85 + alea() * .3), f.racines[2], k % 2 ? BLANC : BLANC_OMBRE, TACHE);
  if(f.noeud){                                               // le noeud rond près du pied (image)
    const [y, a, rn] = f.noeud, R = rAt(y), P = V(Math.cos(a) * R, y, Math.sin(a) * R), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(Math.cos(a), 0, Math.sin(a)));
    M.push({geo: new THREE.TorusGeometry(rn * .65, rn * .3, 6, 14), m: new THREE.Matrix4().compose(P, q, V(1, 1, 1)), c: TACHE});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, q, V(rn * .45, rn * .45, rn * .2)), c: 0x6E5A4C});
  }
  f.boules.forEach(([x, y, z, r], k) => {
    const [ya, lien] = f.depart[k];
    if(Math.hypot(x, z) < .15){ M.push({...segment(V(0, h - .05, 0), V(x, y - r * .3, z), rh * .9, rh * .5), c: BLANC}); }
    else {
      const dir = V(x, 0, z).normalize(), A = dir.clone().multiplyScalar(rAt(ya) * .4).add(V(0, ya, 0)), B = V(x * .8, y - r * .4, z * .8);
      brancheCourbe(M, A, B, rAt(ya) * lien * .55, rAt(ya) * .18, BLANC);
      tache(M, rAt(ya) * .5 * lien, ya + .08, Math.atan2(z, x), .06, .03);   // une tache à la fourche
      if(hiver) for(let j = 0; j < 4; j++){                  // l'hiver, des rameaux fins qui retombent un peu
        const a = alea() * Math.PI * 2, C = V(B.x + Math.cos(a) * r * .8, B.y + r * (.1 + alea() * .5), B.z + Math.sin(a) * r * .8);
        M.push({...segment(B, C, rh * .2, rh * .06, 4), c: 0x8A6A58});
      }
    }
  });
  return fusionner(M);
}
/* En automne, au pied : des feuilles dorées tombées */
function piedAutomne(tons, alea, rayon){
  const M = [];
  for(let k = 0; k < 10; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.4 + alea() * .9);
    M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .03, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, alea() * 6)), V(.14, .18, .18)), c: tons[k % 4]});
  }
  return fusionner(M);
}

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(stade, saison, variante, neige){
  const cle = [stade, saison, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const f = stade === 2 ? FORME.adulte : FORME.jeune, hiver = saison === "hiver", alea = aleaDe(271 + variante * 53 + stade * 17);
  const r = {
    bois: boisDe(f, hiver, alea),
    feuillage: hiver ? null : feuillageDe(f, TONS[saison][variante], alea, stade === 2 ? 96 : 76, FEUILLE, .48, stade === 2 ? 1.6 : .6, new THREE.Color(TONS[saison][variante][3]).multiplyScalar(.75).getHex()),
    leger: hiver ? null : feuillageDe(f, TONS[saison][variante], alea, stade === 2 ? 20 : 16, FEUILLE, .62),
    ombre: hiver ? null : ombreDe(f),
    neige: hiver && neige ? neigeDe({...f, tronc: [f.tronc[0], f.tronc[1], f.tronc[2]], racines: f.racines, depart: f.depart.map(([ya]) => [0, ya])}, alea) : null,
    pied: saison === "automne" ? piedAutomne(TONS.automne[variante], alea, stade === 2 ? 1.0 : .5) : null
  };
  CACHE.set(cle, r);
  return r;
}
/* Le bouleau : stade 0 (une pousse), 1 (jeune bouleau), 2 (adulte) ; r : son tirage ; neige : il neige */
export function bouleauModele(stade, saison, r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.bouleau = {stade, saison, feuillage: saison !== "hiver"};
  if(stade === 0) return pousse(g, saison);
  const G = geos(stade, saison, variante, neige);
  g.add(mesh(G.bois, MAT_BOIS));
  if(G.feuillage) feuillesEtOmbre(g, G.feuillage, G.ombre, MAT_FEUILLES, G.leger);
  if(G.neige) g.add(mesh(G.neige, MAT_BOIS, false));
  if(G.pied){ g.add(mesh(G.pied, MAT_PLAT, false)); g.userData.bouleau.pied = true; }
  return g;
}
/* La pousse : une tige blanche et trois petites feuilles (l'hiver, nue) */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const M = [];
    M.push({...segment(V(0, 0, 0), V(.02, .36, 0), .022, .012, 5), c: BLANC});
    if(saison !== "hiver") for(let k = 0; k < 3; k++){
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.6, k * 2.1, 0));
      M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(0, .3 + k * .03, 0).add(V(.06, .06, 0).applyQuaternion(q)), q, V(.12, .15, .15)), c: TONS[saison][0][k % 3]});
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT_PLAT));
  return g;
}
/* La souche (image de Yo) : l'écorce blanche qui pèle en bandes, des taches sombres, le dessus clair aux cernes, son bord
   roux et ses fentes, un noeud en spirale, des racines aux bouts sombres ; de la neige dessus quand il neige */
const SOUCHES = new Map();
export function soucheBouleau(neige = false){
  const cle = neige ? 1 : 0;
  if(!SOUCHES.has(cle)){
    const alea = aleaDe(313), M = [], H = .44;
    M.push({geo: tronc(.36, .4, H, 5, .03, 0, .16), m: new THREE.Matrix4(), c: BLANC});
    /* l'écorce qui pèle : de fines bandes en travers, en cinq rangs */
    for(let j = 0; j < 5; j++) for(let c = 0; c < 13; c++){
      const y = .07 + j * .08, R = .4 * (1 + .16 * Math.pow(1 - y / H, 3)) - .04 * (y / H) + .004, a = (c + (j % 2) * .5 + alea() * .3) / 13 * Math.PI * 2;
      const P = V(Math.cos(a) * R, y, Math.sin(a) * R), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(Math.cos(a), 0, Math.sin(a)));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.15, 0, 0)));
      M.push({geo: BOSSE, m: new THREE.Matrix4().compose(P, q, V(.1, .028, .012)), c: (c + j) % 3 ? 0xF4ECDA : BLANC_OMBRE});
    }
    for(let k = 0; k < 10; k++){                              // les grandes taches sombres
      const y = .08 + alea() * .32, a = alea() * Math.PI * 2;
      tache(M, .41 * (1 + .16 * Math.pow(1 - y / H, 3)) - .03 * (y / H) + .006, y, a, .09 + alea() * .07, .035 + alea() * .02);
    }
    M.push({geo: new THREE.CylinderGeometry(.35, .35, .03, 22), m: new THREE.Matrix4().makeTranslation(0, H + .005, 0), c: 0xF4DCC0});   // le dessus, clair
    M.push({geo: new THREE.TorusGeometry(.34, .022, 4, 26), m: new THREE.Matrix4().compose(V(0, H + .015, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)), c: 0xE0A060});   // son bord roux
    [.27, .2, .13, .06].forEach((rr, k) => M.push({geo: new THREE.TorusGeometry(rr, .009, 4, 26), m: new THREE.Matrix4().compose(V(0, H + .022, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)), c: k % 2 ? 0xE6C8A6 : 0xECD4B6}));
    for(const a of [.5, 1.9, 3.3, 4.9])                       // les fentes
      M.push({geo: new THREE.BoxGeometry(.32, .012, .012), m: new THREE.Matrix4().compose(V(Math.cos(a) * .18, H + .025, -Math.sin(a) * .18), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), V(1, 1, 1)), c: 0xC89A70});
    for(let k = 0; k < 5; k++) patte(M, k / 5 * Math.PI * 2 + .4 + alea() * .3, .4, .64, .12, k % 2 ? BLANC : BLANC_OMBRE, TACHE, GLAND);
    /* le noeud en spirale, sur le côté */
    const N = V(.3, .2, .27), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(.74, 0, .67).normalize());
    M.push({geo: new THREE.TorusGeometry(.07, .03, 6, 14), m: new THREE.Matrix4().compose(N, q, V(1, 1, 1)), c: BLANC_OMBRE});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(N, q, V(.05, .05, .03)), c: TACHE});
    if(neige) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(0, H + .03, 0), Q, V(.34, .045, .34)), c: 0xF4F8FA});
    SOUCHES.set(cle, fusionner(M));
  }
  const g = new THREE.Group();
  g.add(mesh(SOUCHES.get(cle), MAT_BOIS));
  g.userData.souche = "bouleau";
  return g;
}
