/* ================= Le pin sylvestre de l'île (étape 2.1, morceau 2c : les arbres de l'île) =================
   D'après les images de Yo (Desktop\Hearthwild\images\arbres\pin-sylvestre.png, jeune-pin-sylvestre.png,
   souche-pin-sylvestre.png) : un grand tronc roux, un peu tordu, à l'écorce en plaques qui se chevauchent, d'énormes
   racines comme des pattes ; des branches qui partent à l'horizontale et portent chacune un plateau de feuillage vert
   sombre, aplati, en étages de plus en plus petits vers le haut. Le jeune pin, fin et droit, trois étages. Sa souche, large,
   en plaques d'écorce, le dessus clair aux cernes fendus, un noeud sur le côté et une goutte de résine dorée.
   Grand Carnet : « Bois, résine pour les torches » ; « Toujours vert » ; décidé avec Yo pour tous les arbres : l'hiver
   réaliste (le pin reste vert, un peu de neige sur ses plateaux quand il neige) ; en automne seulement, des aiguilles et
   des pommes de pin au pied. Il pousse près des plages (ile.js).
   Mêmes petits outils que le chêne et le pommier (chene.js), au plus près des images (règle de Yo, 14 octobre 2026). */
import { fusionner } from "./formes.js";
import { aleaDe, segment, brancheCourbe, patte, tronc, feuilleGeo, GLAND, BOSSE, NEIGE_GEO, feuillageDe, ombreDe, feuillesEtOmbre, MAT_BOIS, MAT_FEUILLES, MAT_PLAT, mesh, TONS_ESPECES } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion();
const BOIS = 0xC5602C, BOIS_SOMBRE = 0x9C4420, POMME_PIN = 0x8A5A2E, RESINE = 0xF4AC2E;
/* Une aiguille de pin (au pied, à la pousse) : une feuille étroite et pointue ; une foliole des rosaces du feuillage
   (image de Yo : de petites feuilles allongées au bout arrondi, en étoiles) */
const AIGUILLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .7)), .8) * .2, 4, .5);
const FOLIOLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .65) * .4, 3, .45);
/* Toujours vert : à peine plus clair au printemps (les pousses neuves), quelques aiguilles jaunies en automne, plus sombre l'hiver */
const TONS = {
  printemps: [[0x4E8C36, 0x3C7A2C, 0x68A444, 0x82B850], [0x4A8834, 0x38762A, 0x62A042, 0x7CB44C], [0x52903A, 0x40802E, 0x6CA848, 0x86BC54]],
  ete:       [[0x467E30, 0x376C28, 0x5C963C, 0x74A848], [0x427A2E, 0x346826, 0x58923A, 0x70A444], [0x4A8232, 0x3A702A, 0x60983E, 0x78AC4A]],
  automne:   [[0x447A30, 0x356A28, 0x58903A, 0x9AA046], [0x40762E, 0x326626, 0x548C38, 0x96984A], [0x487E32, 0x386E2A, 0x5C943C, 0xA0A448]],
  hiver:     [[0x3E7030, 0x2F6028, 0x52863A, 0x6A9446], [0x3A6C2E, 0x2C5C26, 0x4E8238, 0x669044], [0x42742F, 0x326428, 0x568A3C, 0x6E9848]]
};
TONS_ESPECES.pin = TONS;

/* ---------- la forme : d'après les images ---------- */
/* les plateaux [x, y, z, rayon, aplatissement] (le pin fait environ 4,3 P) */
const FORME = {
  adulte: {tronc: [.2, .44, 3.5], racines: [5, .82, .24],
    boules: [[.05, 4.0, 0, .5, .75], [-.5, 3.54, .26, .6, .5], [.58, 3.48, -.12, .62, .5], [.05, 3.42, -.7, .56, .5], [-1.16, 2.82, .26, .78, .46],
      [1.16, 2.72, -.05, .76, .46], [.3, 2.88, .84, .62, .46], [-1.46, 2.0, .4, .82, .44], [1.24, 1.92, .1, .74, .46], [-.2, 2.38, -1.0, .62, .46]]},
  jeune:  {tronc: [.06, .12, 1.7], racines: [4, .32, .07], moignon: .55,
    boules: [[0, 1.78, 0, .36, 1.3], [-.36, 1.38, .05, .38, .72], [.38, 1.34, -.05, .38, .72], [-.44, .96, .1, .38, .66], [.46, .92, -.05, .36, .66]]}
};
/* Le bois : le tronc en plaques, ses racines en pattes, ses branches à l'horizontale qui se divisent sous chaque plateau */
function boisDe(f, alea){
  const [rh, rb, h] = f.tronc, M = [];
  M.push({geo: tronc(rh, rb, h, 6, .04, 8), m: new THREE.Matrix4(), c: BOIS});
  M.push({geo: BOSSE, m: new THREE.Matrix4().compose(V(0, rb * .45, 0), Q, V(rb * 1.25, rb * .75, rb * 1.25)), c: BOIS});   // le pied, large
  const [nr, lr, er] = f.racines;
  for(let k = 0; k < nr; k++) patte(M, k / nr * Math.PI * 2 + alea() * .4, rb, lr * (.85 + alea() * .3), er, k % 2 ? BOIS : BOIS_SOMBRE, BOIS_SOMBRE);
  for(const [x, y, z, r, fy] of f.boules){
    const ya = y - (f === FORME.adulte ? .6 : .25), rt = rh + (rb - rh) * Math.max(0, 1 - ya / h);
    if(Math.hypot(x, z) < .15){ M.push({...segment(V(0, h - .05, 0), V(x, y - r * fy * .3, z), rh * .8, rh * .5), c: BOIS}); continue; }   // la cime
    const dir = V(x, 0, z).normalize(), A = dir.clone().multiplyScalar(rt * .4).add(V(0, ya, 0)), B = V(x * .78, y - r * fy * .5, z * .78);
    brancheCourbe(M, A, B, rt * .55, rt * .26, BOIS);
    for(const s of [-1, 1]){                                 // la branche se divise sous le plateau
      const C = B.clone().add(V(-dir.z * s * r * .45, r * fy * .2, dir.x * s * r * .45)).add(dir.clone().multiplyScalar(r * .25));
      M.push({...segment(B, C, rt * .16, rt * .08, 5), c: BOIS});
    }
  }
  if(f.moignon) M.push({...segment(V(0, f.moignon, 0), V(.12, f.moignon + .05, .05), rh * .55, rh * .5, 6), c: BOIS});   // un moignon de branche
  return fusionner(M);
}
/* Chaque plateau, un petit nuage bosselé comme sur l'image de Yo : une bosse au milieu, plus haute, et trois autour */
function nuages(f){
  const out = [];
  f.boules.forEach(([x, y, z, r, fy], k) => {
    out.push([x, y + r * fy * .18, z, r * .74, fy * 1.15]);
    for(let j = 0; j < 3; j++){ const a = k * 1.7 + j * 2.09; out.push([x + Math.cos(a) * r * .5, y - r * fy * .08, z + Math.sin(a) * r * .5, r * .62, fy * 1.1]); }
  });
  return {...f, boules: out};
}
/* Un peu de neige sur chaque plateau, quand il neige */
function neigeDe(f){
  return fusionner(f.boules.map(([x, y, z, r, fy]) => ({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, y + r * fy * .66, z), Q, V(r * .72, .05 + .08 * fy, r * .72)), c: 0xF4F8FA})));
}
/* En automne, au pied : des aiguilles tombées et des pommes de pin */
function pommePin(M, P, s, a){
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, a, 0)), V(s * .6, s, s * .6)), c: POMME_PIN});
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(P.clone().add(V(0, s * .2, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, a, 0)), V(s * .5, s * .8, s * .3)), c: 0x6E4422});
}
function piedAutomne(alea, rayon, n){
  const M = [];
  for(let k = 0; k < 12; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.4 + alea() * .9);
    M.push({geo: AIGUILLE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .03, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, alea() * 6)), V(.14, .2, .2)), c: k % 3 ? 0xB08048 : 0x9A6A3A});
  }
  for(let k = 0; k < n; k++){ const a = alea() * Math.PI * 2, d = rayon * (.5 + alea() * .5); pommePin(M, V(Math.cos(a) * d, .05, Math.sin(a) * d), .09, alea() * 6); }
  return fusionner(M);
}

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(stade, saison, variante, neige){
  const cle = [stade, saison, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const f = stade === 2 ? FORME.adulte : FORME.jeune, alea = aleaDe(131 + variante * 71 + stade * 13), tons = TONS[saison][variante];
  const r = {
    bois: boisDe(f, alea),
    feuillage: feuillageDe(nuages(f), tons, alea, stade === 2 ? 18 : 24, FOLIOLE, .56, .6),
    leger: feuillageDe(f, tons, alea, stade === 2 ? 28 : 20, FOLIOLE, .55),
    ombre: ombreDe(f),
    neige: saison === "hiver" && neige ? neigeDe(f) : null,
    pied: saison === "automne" ? piedAutomne(alea, stade === 2 ? 1.1 : .5, stade === 2 ? 3 : 1) : null
  };
  CACHE.set(cle, r);
  return r;
}
/* Le pin sylvestre : stade 0 (une pousse), 1 (jeune pin), 2 (adulte) ; r : son tirage ; neige : il neige */
export function pinModele(stade, saison, r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.pin = {stade, saison, feuillage: true, neige: false};
  if(stade === 0) return pousse(g, saison);
  const G = geos(stade, saison, variante, neige);
  g.add(mesh(G.bois, MAT_BOIS));
  feuillesEtOmbre(g, G.feuillage, G.ombre, MAT_FEUILLES, G.leger);
  if(G.neige){ g.add(mesh(G.neige, MAT_BOIS, false)); g.userData.pin.neige = true; }
  if(G.pied){ g.add(mesh(G.pied, MAT_PLAT, false)); g.userData.pin.pied = true; }
  return g;
}
/* La pousse : une tige et une touffe d'aiguilles */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const M = [];
    M.push({...segment(V(0, 0, 0), V(0, .34, 0), .025, .014, 5), c: BOIS});
    for(let k = 0; k < 6; k++){
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.5 - (k % 2) * .3, k * 1.05, 0));
      M.push({geo: AIGUILLE, m: new THREE.Matrix4().compose(V(0, .32, 0).add(V(0, .06, 0).applyQuaternion(q)), q, V(.1, .16, .16)), c: TONS[saison][0][k % 3]});
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT_PLAT));
  return g;
}
/* La souche (image de Yo) : large, en plaques d'écorce, ses racines en pattes, le dessus clair aux cernes fendus, un noeud
   sur le côté, une goutte de résine dorée qui coule ; en automne, une pomme de pin au pied ; de la neige quand il neige */
const SOUCHES = new Map();
export function souchePin(neige = false, automne = false){
  const cle = (neige ? 1 : 0) + (automne ? 2 : 0);
  if(!SOUCHES.has(cle)){
    const alea = aleaDe(707), M = [];
    M.push({geo: tronc(.36, .4, .38, 7, .03, 0, .14), m: new THREE.Matrix4(), c: BOIS});
    /* l'écorce en écailles qui se chevauchent (quatre rangs, le bas de chaque écaille un peu décollé) */
    for(let j = 0; j < 4; j++) for(let c = 0; c < 15; c++){
      const y = .06 + j * .1, R = .4 * (1 + .14 * Math.pow(1 - y / .38, 3)) - .04 * (y / .38) + .015, a = (c + (j % 2) * .5) / 15 * Math.PI * 2;
      const P = V(Math.cos(a) * R, y, Math.sin(a) * R), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(Math.cos(a), 0, Math.sin(a)));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.3, 0, 0)));
      M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, q, V(.105, .085, .03)), c: (c + j) % 3 ? BOIS : 0xD06A32, ombre: (x, yy) => .78 + .22 * Math.min(1, Math.max(0, (yy - y + .06) / .1))});
    }
    M.push({geo: new THREE.CylinderGeometry(.35, .35, .03, 22), m: new THREE.Matrix4().makeTranslation(0, .385, 0), c: 0xF2C47E});   // le dessus, clair
    [.29, .23, .17, .11, .05].forEach((rr, k) => M.push({geo: new THREE.TorusGeometry(rr, .01, 4, 26), m: new THREE.Matrix4().compose(V(0, .402, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)), c: k % 2 ? 0xD9A35E : 0xE4B46C}));
    for(const a of [.4, 2.3, 4.2])                           // les fentes du dessus
      M.push({geo: new THREE.BoxGeometry(.3, .012, .014), m: new THREE.Matrix4().compose(V(Math.cos(a) * .17, .405, -Math.sin(a) * .17), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), V(1, 1, 1)), c: 0xB07A40});
    for(let k = 0; k < 6; k++) patte(M, k / 6 * Math.PI * 2 + .2 + alea() * .3, .4, .82, .13, k % 2 ? BOIS : BOIS_SOMBRE, BOIS_SOMBRE, GLAND);
    /* le noeud sur le côté : un anneau de bois et son coeur */
    const N = V(-.33, .2, .26), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(-.78, 0, .62).normalize());
    M.push({geo: new THREE.TorusGeometry(.065, .028, 6, 14), m: new THREE.Matrix4().compose(N, q, V(1, 1, 1)), c: 0xB4602C});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(N, q, V(.05, .05, .025)), c: 0xD88A4A});
    /* la goutte de résine, au bord du dessus, qui coule le long de l'écorce */
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(V(.24, .4, .24), Q, V(.07, .02, .05)), c: RESINE});
    M.push({...segment(V(.29, .39, .29), V(.31, .28, .31), .022, .018, 6), c: RESINE});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(V(.315, .26, .315), Q, V(.034, .045, .034)), c: RESINE});
    if(automne) pommePin(M, V(.5, .05, .42), .09, 1.2);
    if(neige) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(0, .41, 0), Q, V(.34, .045, .34)), c: 0xF4F8FA});
    SOUCHES.set(cle, fusionner(M));
  }
  const g = new THREE.Group();
  g.add(mesh(SOUCHES.get(cle), MAT_BOIS));
  g.userData.souche = "pin";
  return g;
}
