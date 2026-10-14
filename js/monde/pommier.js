/* ================= Le pommier de l'île (étape 2.1, morceau 2c : les arbres de l'île) =================
   D'après les images de Yo (Desktop\Hearthwild\images\arbres\pommier.png, jeune-pommier.png, souche-pommier.png) : un
   tronc épais brun rosé, torsadé, deux noeuds creux, de grosses racines ; il se divise en branches courbes qui portent sept
   boules de feuillage vert-jaune, pleines de pommes rouges bien rondes. Le jeune pommier, fin, tenu à un tuteur par une
   corde ; sa souche, large, aux cernes en spirale, un noeud sur le côté, une pomme tombée au pied.
   Grand Carnet : « Pommes ; bois rare si on l'abat » ; « fleurs blanches au printemps, fruits en automne ». Décidé avec Yo
   pour tous les arbres (14 octobre 2026) : les saisons faites par le jeu ; l'hiver réaliste (le pommier perd toutes ses
   feuilles) ; feuilles et fruits au pied en automne seulement ; un peu de neige sur les branches quand il neige.
   Les pommes se cueillent en automne (recolte.js) : cueillies, elles ne se voient plus jusqu'à leur retour (pommes = false).
   Mêmes petits outils que le chêne (chene.js) : chaque modèle construit une fois et partagé. */
import { fusionner } from "./formes.js";
import { aleaDe, segment, brancheCourbe, tronc, feuilleGeo, BOULE, GLAND, NEIGE_GEO, feuillageDe, neigeDe, ombreDe, feuillesEtOmbre, MAT_BOIS, MAT_FEUILLES, MAT_PLAT, mesh, TONS_ESPECES } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion();
const BOIS = 0xA65C36, BOIS_SOMBRE = 0x86462A, CREUX = 0x4A2818, POMMES = [0xE0342A, 0xD42C24, 0xE8502E], QUEUE = 0x6E4022;
/* La feuille du pommier : ovale et pointue, le bord à peine ondulé, en relief (feuilleGeo) */
const FEUILLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .85)), .75) * .4 * (1 + .05 * Math.cos(t * Math.PI * 9)), 5);
/* Les tons du feuillage selon la saison, trois nuances ; vert-jaune comme sur l'image, qui jaunit en automne */
const TONS = {
  printemps: [[0xA6D86A, 0x8ECC58, 0xBEE47E, 0x78B84C], [0x9CD262, 0x86C452, 0xB6DE74, 0x72B048], [0xAEDC70, 0x96CE5E, 0xC6E886, 0x7EBC50]],
  ete:       [[0x8AB042, 0x729C38, 0xA4C24E, 0xBCCC58], [0x82AA3E, 0x6C9634, 0x9CBC4A, 0xB6C854], [0x92B646, 0x7AA23A, 0xACC852, 0xC4D05C]],
  automne:   [[0xB4B840, 0x98A238, 0xD2C24C, 0xE4A23E], [0xA8B23C, 0x8E9A34, 0xC8BC48, 0xDE9A3A], [0xC0BC44, 0xA2A63A, 0xDCC850, 0xE8AA42]]
};
TONS_ESPECES.pommier = TONS;

/* ---------- la forme : d'après les images ---------- */
const FORME = {
  adulte: {tronc: [.24, .38, 1.3], racines: [6, .78, .15],
    boules: [[0, 2.95, -.08, .56], [-.92, 2.6, .02, .5], [-1.0, 1.95, .4, .46], [.95, 2.55, -.16, .5], [1.0, 1.92, .38, .47], [.3, 2.1, .74, .46], [-.15, 2.3, -.78, .48]],
    depart: [[0, 1.22], [-.08, 1.15], [-.1, 1.05], [.08, 1.15], [.1, 1.05], [0, 1.1], [0, 1.15]],
    creux: [[.55, .3, .3], [.95, -.2, .24]], pommes: 4},
  jeune:  {tronc: [.06, .1, 1.1], racines: [4, .26, .045],
    boules: [[0, 1.52, 0, .42], [-.46, 1.1, .04, .3], [.46, 1.06, -.04, .3]],
    depart: [[0, 1.05], [0, .8], [0, .78]], creux: [], pommes: 0, tuteur: true}
};
/* Le bois : le tronc, ses racines, ses deux noeuds creux, ses branches ; l'hiver, les rameaux nus ; le jeune, son tuteur */
function boisDe(f, hiver, alea){
  const [rh, rb, h] = f.tronc, M = [];
  M.push({geo: tronc(rh, rb, h, 9, .1), m: new THREE.Matrix4(), c: BOIS});
  const [nr, lr, er] = f.racines;
  for(let k = 0; k < nr; k++){
    const a = k / nr * Math.PI * 2 + alea() * .5;
    M.push({...segment(V(Math.cos(a) * rb * .55, rb * .7, Math.sin(a) * rb * .55), V(Math.cos(a) * lr * (1 + alea() * .25), .02, Math.sin(a) * lr * (1 + alea() * .25)), er, er * .3), c: k % 2 ? BOIS : BOIS_SOMBRE});
  }
  for(const [y, ang, rn] of f.creux){                        // un noeud creux : un bourrelet, et le trou sombre au milieu
    const r = rh + (rb - rh) * Math.max(0, 1 - y / h) * .8, P = V(Math.sin(ang) * r * .93, y, Math.cos(ang) * r * .93);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(Math.sin(ang), 0, Math.cos(ang)));
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, q, V(rn * .5, rn * .7, rn * .22)), c: BOIS_SOMBRE});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P.clone().add(V(Math.sin(ang), 0, Math.cos(ang)).multiplyScalar(rn * .08)), q, V(rn * .3, rn * .45, rn * .16)), c: CREUX});
  }
  f.boules.forEach(([x, y, z, r], k) => {
    const [dx, dy] = f.depart[k], A = V(dx, dy, 0), B = V(x * .82, y - r * .35, z * .82);
    brancheCourbe(M, A, B, rh * .8, rh * .36, BOIS);
    if(hiver) for(let j = 0; j < 3; j++){
      const a = alea() * Math.PI * 2, C = V(B.x + Math.cos(a) * r * .75, B.y + r * (.3 + alea() * .5), B.z + Math.sin(a) * r * .75);
      M.push({...segment(B, C, rh * .2, rh * .07, 5), c: BOIS});
    }
  });
  if(f.tuteur){                                              // le tuteur et sa corde (image du jeune pommier)
    M.push({geo: new THREE.CylinderGeometry(.045, .05, 1, 7), m: new THREE.Matrix4().makeTranslation(-.13, .5, .03), c: 0xB4783E});
    M.push({geo: new THREE.SphereGeometry(.045, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), m: new THREE.Matrix4().makeTranslation(-.13, 1, .03), c: 0xC08A50});
    for(const y of [.58, .64]) M.push({geo: new THREE.TorusGeometry(.1, .016, 5, 14), m: new THREE.Matrix4().compose(V(-.065, y, .015), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1.15, .8, 1)), c: 0xD8B47A});
  }
  return fusionner(M);
}
/* Une pomme : ronde, sa queue ; elle pend au bord de la boule, surtout sur les côtés et le bas ; le dessous plus sombre et
   un petit reflet blanc, pour qu'elle brille comme sur l'image de Yo */
function pomme(M, P, s, c){
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, Q, V(s, s * .92, s)), c, ombre: (x, y) => .68 + .36 * Math.min(1, Math.max(0, (y - P.y) / s * .5 + .5))});
  M.push({...segment(P.clone().add(V(0, s * .7, 0)), P.clone().add(V(.02, s * 1.35, 0)), s * .13, s * .1, 4), c: QUEUE});
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(P.clone().add(V(-.32 * s, .5 * s, .62 * s)), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.7, -.4, 0)), V(s * .26, s * .18, s * .08)), c: 0xFFF2EC});
}
function pommesDe(f, alea, n){
  const M = [];
  f.boules.forEach(([x, y, z, r], k) => {
    const m = n || (k === f.boules.length - 1 ? 1 : 0);    // le jeune pommier : une seule pomme
    for(let j = 0; j < m; j++){
      const a = alea() * Math.PI * 2, yy = -.45 + alea() * .85, rr = Math.sqrt(1 - yy * yy);
      const P = V(x + Math.cos(a) * rr * r * .9, y + yy * r * .8, z + Math.sin(a) * rr * r * .9);
      pomme(M, P, .13 + alea() * .03, POMMES[(k + j) % 3]);
    }
  });
  return fusionner(M);
}
/* Au printemps, les fleurs blanches (Grand Carnet) : de petites fleurs blanches au coeur rose, sur le dessus et les côtés */
function fleursDe(f, alea, n){
  const M = [];
  for(const [x, y, z, r] of f.boules) for(let k = 0; k < n; k++){
    const a = alea() * Math.PI * 2, yy = -.1 + alea() * 1.05, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr);
    const P = V(x, y, z).add(V(nrm.x * r * .95, nrm.y * r * .85, nrm.z * r * .95)), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), nrm);
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, q, V(.095, .03, .095)), c: k % 3 ? 0xFFF8F6 : 0xFCE6EC});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P.clone().add(nrm.clone().multiplyScalar(.02)), q, V(.025, .015, .025)), c: 0xF0A8BC});
  }
  return fusionner(M);
}
/* En automne, au pied : des feuilles tombées et deux pommes */
function piedAutomne(tons, alea, rayon, avecPommes){
  const M = [];
  for(let k = 0; k < 8; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.45 + alea() * .9);
    M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .03, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, alea() * 6)), V(.14, .18, .18)), c: tons[k % 4]});
  }
  if(avecPommes) for(let k = 0; k < 2; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.55 + alea() * .5);
    pomme(M, V(Math.cos(a) * d, .1, Math.sin(a) * d), .1, POMMES[k]);
  }
  return fusionner(M);
}

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(stade, saison, variante, neige){
  const cle = [stade, saison, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const f = stade === 2 ? FORME.adulte : FORME.jeune, hiver = saison === "hiver", alea = aleaDe(53 + variante * 89 + stade * 11);
  const r = {
    bois: boisDe(f, hiver, alea),
    feuillage: hiver ? null : feuillageDe(f, TONS[saison][variante], alea, stade === 2 ? 60 : 40, FEUILLE),
    leger: hiver ? null : feuillageDe(f, TONS[saison][variante], alea, stade === 2 ? 20 : 14, FEUILLE),
    ombre: hiver ? null : ombreDe(f),
    fleurs: saison === "printemps" ? fleursDe(f, alea, stade === 2 ? 11 : 6) : null,
    pommes: saison === "automne" ? pommesDe(f, alea, f.pommes) : null,
    neige: hiver && neige ? neigeDe(f, alea) : null,
    pied: saison === "automne" ? piedAutomne(TONS.automne[variante], alea, stade === 2 ? 1.05 : .55, stade === 2) : null
  };
  CACHE.set(cle, r);
  return r;
}
/* Le pommier : stade 0 (une pousse), 1 (jeune pommier, à son tuteur), 2 (adulte) ; r : son tirage ; neige : il neige ;
   pommes : ses pommes sont là (en automne, pas encore cueillies) */
export function pommierModele(stade, saison, r = 0, neige = false, pommes = true){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.pommier = {stade, saison, feuillage: saison !== "hiver", fleurs: false, pommes: false, tuteur: stade === 1};
  if(stade === 0) return pousse(g, saison);
  const G = geos(stade, saison, variante, neige);
  g.add(mesh(G.bois, MAT_BOIS));
  if(G.feuillage) feuillesEtOmbre(g, G.feuillage, G.ombre, MAT_FEUILLES, G.leger);
  if(G.fleurs){ g.add(mesh(G.fleurs, MAT_FEUILLES, false)); g.userData.pommier.fleurs = true; }
  if(G.pommes && pommes){ g.add(mesh(G.pommes, MAT_FEUILLES, false)); g.userData.pommier.pommes = true; }
  if(G.neige) g.add(mesh(G.neige, MAT_BOIS, false));
  if(G.pied){ g.add(mesh(G.pied, MAT_PLAT, false)); g.userData.pommier.pied = true; }
  return g;
}
/* La pousse : une tige fine et trois petites feuilles ovales (l'hiver, nue) */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const M = [];
    M.push({...segment(V(0, 0, 0), V(.02, .36, 0), .03, .016, 5), c: BOIS});
    if(saison !== "hiver") for(let k = 0; k < 3; k++){
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.6, k * 2.1, 0));
      M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(0, .3 + k * .03, 0).add(V(.06, .06, 0).applyQuaternion(q)), q, V(.12, .17, .17)), c: TONS[saison][0][k % 3]});
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT_PLAT));
  return g;
}
/* La souche (image de Yo) : large et basse, l'écorce creusée de sillons, le dessus clair aux cernes en spirale, un noeud sur
   le côté, ses racines ; en automne, une pomme tombée au pied ; un peu de neige dessus quand il neige */
const SOUCHES = new Map();
export function souchePommier(neige = false, automne = false){
  const cle = (neige ? 1 : 0) + (automne ? 2 : 0);
  if(!SOUCHES.has(cle)){
    const alea = aleaDe(911), M = [];
    M.push({geo: tronc(.36, .42, .38, 13, .12), m: new THREE.Matrix4(), c: BOIS});
    M.push({geo: new THREE.CylinderGeometry(.33, .33, .03, 20), m: new THREE.Matrix4().makeTranslation(0, .385, 0), c: 0xE8A46C});   // le dessus, clair
    [.26, .19, .12, .05].forEach((rr, k) => M.push({geo: new THREE.TorusGeometry(rr, .012, 4, 24), m: new THREE.Matrix4().compose(V(.01 * k, .402, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)), c: k % 2 ? 0xCC8250 : 0xD8955E}));
    for(let k = 0; k < 5; k++){
      const a = k / 5 * Math.PI * 2 + .3 + alea() * .4;
      M.push({...segment(V(Math.cos(a) * .28, .16, Math.sin(a) * .28), V(Math.cos(a) * .7, .02, Math.sin(a) * .7), .13, .045), c: k % 2 ? BOIS : BOIS_SOMBRE});
    }
    /* le noeud sur le côté : un anneau de bois et son coeur */
    const N = V(-.27, .22, .3), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(-.6, 0, .8).normalize());
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(N, q, V(.09, .1, .05)), c: 0xC07A44});
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(N.clone().add(V(-.02, 0, .03)), q, V(.05, .06, .03)), c: 0xD8955E});
    if(automne){
      pomme(M, V(.48, .1, .34), .1, POMMES[0]);
      M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(.53, .2, .32), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.3, .8, -.9)), V(.09, .12, .12)), c: 0x8AB042});
    }
    if(neige) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(0, .41, 0), Q, V(.32, .045, .32)), c: 0xF4F8FA});
    SOUCHES.set(cle, fusionner(M));
  }
  const g = new THREE.Group();
  g.add(mesh(SOUCHES.get(cle), MAT_PLAT));
  g.userData.souche = "pommier";
  return g;
}
