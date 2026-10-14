/* ================= Le chêne de l'île (étape 2.1, morceau 2 : les arbres) =================
   D'après l'image de référence de Yo (Desktop\Hearthwild\images\arbres\chene.png, jeune-chene.png, souche-chene.png) :
   un tronc épais brun miel, un peu torsadé, creusé de sillons, avec un noeud ovale sur le devant, qui s'évase en grosses
   racines au pied et se divise en branches courbes ; au bout, sept boules de feuillage faites de feuilles de chêne aux bords
   ondulés qui se chevauchent comme des écailles, de plusieurs tons mêlés ; une plus petite boule, plus bas, à gauche.
   Décidé avec Yo (14 octobre 2026) :
   - les couleurs des saisons sont faites ici (vert tendre au printemps, vert profond en été, roux, orange et doré en
     automne, chaque chêne sa nuance) ; l'hiver, réaliste : les branches nues et quelques feuilles sèches et brunes qui
     restent accrochées (les chênes les gardent souvent jusqu'au printemps) ; un peu de neige sur les branches quand il neige ;
   - en automne seulement, des feuilles mortes et des glands au pied ;
   - la souche reste après la coupe (la pelle l'enlève : terraformer.js).
   Pour un téléphone modeste : chaque modèle est construit une seule fois (le bois d'un côté, le feuillage de l'autre,
   fusionner dans formes.js) et partagé par tous les chênes de l'île ; le feuillage ondule au vent (feuillageMat).
   Les petits outils d'ici (le tronc, les branches, le feuillage en écailles, la neige, les matières) servent aussi aux
   autres arbres de l'île (pommier.js, étape 2.1, morceau 2c). */
import { toon, fusionner, feuillageMat } from "./formes.js";

/* ---------- petits outils ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HAUT = V(0, 1, 0);
export function aleaDe(graine){                                   // un tirage fixe : le même chêne à chaque fois
  let s = graine >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/* Une branche (ou une racine) de A à B, épaisse de rA en A et rB en B */
/* Une grosse branche courbe, comme sur les images : deux morceaux qui plient vers le haut, un noeud rond à la pliure */
export function brancheCourbe(M, A, B, rA, rB, c){
  const P = A.clone().lerp(B, .5).add(V(0, .12 + A.distanceTo(B) * .08, 0)), rP = (rA + rB) / 2;
  M.push({...segment(A, P, rA, rP), c}, {...segment(P, B, rP, rB), c});
  M.push({geo: BOSSE, m: new THREE.Matrix4().compose(P, new THREE.Quaternion(), V(rP, rP, rP)), c});
}
export function segment(A, B, rA, rB, cotes = 7){
  const d = B.clone().sub(A), L = d.length();
  const geo = new THREE.CylinderGeometry(rB, rA, L, cotes, 1);
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(HAUT, d.normalize()), V(1, 1, 1));
  return {geo, m};
}
/* Le tronc : un cylindre qui s'évase au pied, creusé de sillons qui tournent un peu ; ecailles (le nombre de colonnes) :
   une écorce en plaques qui se chevauchent, comme celle du pin sylvestre (image de Yo), le bord de chaque plaque plus sombre */
export function tronc(rHaut, rBas, h, sillons = 7, creux = .07, ecailles = 0, evase = .55){
  const g = new THREE.CylinderGeometry(rHaut, rBas, h, ecailles ? 24 : 14, ecailles ? Math.max(8, Math.round(h * 5)) : 8);
  const p = g.attributes.position, teinte = new Float32Array(p.count);
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (y + h / 2) / h, a = Math.atan2(z, x);
    const sil = Math.sin(a * sillons + t * 2.4);
    let k = (1 + creux * sil) * (1 + evase * Math.pow(1 - t, 3)), plaque = 1;
    if(ecailles){
      const u = (a / (Math.PI * 2) + .5) * ecailles, v = t * h * 3.2 + (Math.floor(u) % 2) * .5, fu = u - Math.floor(u), fv = v - Math.floor(v);
      const bord = Math.min(1, Math.min(fu, 1 - fu) * 5) * Math.min(1, fv * 5);   // 0 au bord d'une plaque, 1 au milieu
      plaque = .7 + .3 * bord; k *= 1 + .035 * bord;
    }
    p.setXYZ(i, x * k, y + h / 2, z * k);
    teinte[i] = (.78 + .22 * (sil + 1) / 2) * (.84 + .16 * Math.min(1, t * 3)) * plaque;   // les sillons plus sombres, le pied aussi
  }
  g.setAttribute("teinte", new THREE.BufferAttribute(teinte, 1));
  g.computeVertexNormals();
  return g;
}
/* Une feuille en relief (étape 2.1, plus proche des images de Yo) : une bande de la queue à la pointe, trois points par
   rang (le bord gauche, la nervure, le bord droit), pliée le long de la nervure (les deux moitiés attrapent la lumière
   chacune à sa façon) ; la nervure et la queue un peu plus sombres, la pointe plus claire (l'attribut « teinte »).
   largeur(t) : sa demi-largeur, de la queue (t = 0) à la pointe (t = 1) ; longue de 1, centrée au milieu */
export function feuilleGeo(largeur, rangs = 8, pli = .38){
  const pos = [], te = [], ind = [];
  for(let k = 0; k <= rangs; k++){
    const t = k / rangs, w = Math.max(.012, largeur(t)), clair = .8 + .26 * t;
    pos.push(-w, t - .5, w * pli, 0, t - .5, 0, w, t - .5, w * pli);
    te.push(clair, clair * .82, clair);
  }
  for(let k = 0; k < rangs; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
/* Une feuille de chêne : aux lobes ronds (une onde le long du bord), en relief */
const FEUILLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .85)), .7) * .42 * (.74 + .26 * Math.cos(t * Math.PI * 7)), 7);
export const BOULE = new THREE.IcosahedronGeometry(1, 1);
export const GLAND = new THREE.SphereGeometry(1, 8, 6);
/* Pour le téléphone (étape 2.1) : des formes plus simples là où on ne les voit presque pas (les boules qui ne font que de
   l'ombre ; les bosses du bois) */
export const BOULE_BAS = new THREE.IcosahedronGeometry(1, 0);
export const BOSSE = new THREE.SphereGeometry(1, 6, 4);
const CUPULE = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
export const NEIGE_GEO = new THREE.SphereGeometry(1, 8, 5);

/* ---------- les couleurs ---------- */
const BOIS = 0xA8683A, BOIS_SOMBRE = 0x8A5430, NOEUD = 0x6E4226, MOUSSE = 0x7FA83A;
/* Les tons du feuillage, selon la saison ; trois nuances (variante) pour que les chênes ne soient pas tous pareils */
const TONS = {
  printemps: [[0x9ED45C, 0x86C64E, 0xB6E06C, 0x6FB044], [0x94CC56, 0x7CBC48, 0xACD866, 0x68A840], [0xA6D862, 0x8ECC52, 0xBEE474, 0x76B44A]],
  ete:       [[0x5DA43E, 0x4C9234, 0x74B448, 0x8DC052], [0x569C3A, 0x468C32, 0x6CAC44, 0x84B84C], [0x64AA42, 0x52983A, 0x7CBA4C, 0x96C658]],
  automne:   [[0xF08A2C, 0xD9552E, 0xF7B238, 0xC8442A], [0xE8702C, 0xC9472A, 0xF0942E, 0xF2B03A], [0xF4A632, 0xE07A2A, 0xF8C44A, 0xD9552E]]
};
const SECHES = [0x9C6B3C, 0x8A5A30, 0xB07A44];               // les feuilles sèches de l'hiver
/* Les tons des autres arbres de l'île (pommier.js les inscrit ici) ; espece : la clé de l'arbre (map.obj) */
export const TONS_ESPECES = {};
export const tonsFeuilles = (saison, variante = 0, espece) => {
  const T = TONS_ESPECES[espece] || TONS;
  return saison === "hiver" ? (T === TONS ? SECHES : T.automne[variante % 3]) : T[saison][variante % 3];
};

/* ---------- la forme : d'après les images ---------- */
/* Les boules de feuillage du chêne adulte [x, y, z, rayon] (en P ; le chêne fait environ 3,4 P) */
/* (plus écartées depuis l'essai « plus proche des images » : chaque boule se détache, on voit les branches entre elles) */
const BOULES = [[.05, 3.15, -.1, .58], [-.66, 2.88, .05, .52], [.62, 2.9, -.3, .52], [-.9, 2.25, .3, .55], [.88, 2.28, .2, .55],
  [.08, 2.4, .7, .5], [-.2, 2.55, -.72, .5], [-.95, 1.6, .5, .34]];
const BOULES_JEUNE = [[0, 1.5, 0, .44], [-.44, 1.08, .06, .33], [.44, 1.12, -.06, .33]];
const FORME = {
  adulte: {tronc: [.24, .37, 1.5], noeud: [.85, .31], racines: [5, .7, .15], boules: BOULES, depart: [[0, 1.3], [0, 1.4], [0, 1.45], [0, 1.2], [0, 1.25], [0, 1.35], [0, 1.35], [-.1, 1.0]]},
  jeune:  {tronc: [.08, .13, 1.05], noeud: [.5, .11], racines: [4, .32, .06], boules: BOULES_JEUNE, depart: [[0, 1.0], [0, .78], [0, .82]]}
};

/* Le bois : le tronc, ses racines, son noeud, ses branches (l'hiver, en plus, les rameaux nus au bout) */
function boisDe(f, hiver, alea){
  const [rh, rb, h] = f.tronc, M = [];
  M.push({geo: tronc(rh, rb, h), m: new THREE.Matrix4(), c: BOIS});
  const [nr, lr, er] = f.racines;
  for(let k = 0; k < nr; k++){
    const a = k / nr * Math.PI * 2 + alea() * .5;
    const A = V(Math.cos(a) * rb * .55, rb * .7, Math.sin(a) * rb * .55), B = V(Math.cos(a) * lr * (1 + alea() * .25), .02, Math.sin(a) * lr * (1 + alea() * .25));
    M.push({...segment(A, B, er, er * .3), c: k % 2 ? BOIS : BOIS_SOMBRE});
  }
  /* le noeud ovale, sur le devant */
  const [yn, rn] = f.noeud;
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(V(0, yn, rn * .92), new THREE.Quaternion(), V(rn * .32, rn * .5, rn * .14)), c: NOEUD});
  M.push({geo: GLAND, m: new THREE.Matrix4().compose(V(0, yn, rn * .97), new THREE.Quaternion(), V(rn * .16, rn * .28, rn * .08)), c: 0x4A2C18});
  /* les branches, du haut du tronc vers chaque boule */
  f.boules.forEach(([x, y, z, r], k) => {
    const [dx, dy] = f.depart[k], A = V(dx, dy, 0), B = V(x * .82, y - r * .35, z * .82);
    brancheCourbe(M, A, B, rh * (k === f.boules.length - 1 && f === FORME.adulte ? .5 : .82), rh * .38, BOIS);
    if(hiver) for(let j = 0; j < 3; j++){                   // l'hiver, trois rameaux nus au bout de chaque branche
      const a = alea() * Math.PI * 2, C = V(B.x + Math.cos(a) * r * .75, B.y + r * (.35 + alea() * .5), B.z + Math.sin(a) * r * .75);
      M.push({...segment(B, C, rh * .2, rh * .07, 5), c: BOIS});
    }
  });
  return fusionner(M);
}
/* Le feuillage : chaque boule, une forme ronde sombre couverte de feuilles serrées de plusieurs tons (plus proche des
   images de Yo : des boules pleines) ; la lumière l'éclaire comme une boule (normales qui partent du centre, un peu mêlées
   à celles de chaque feuille) ; l'ombre douce est peinte : le creux de la boule et son dessous plus sombres, le bout des
   feuilles et le dessus plus clairs, les boules du bas un peu à l'ombre de celles du haut */
export function feuillageDe(f, tons, alea, nbFeuilles = 11, feuille = FEUILLE, taille = .6, exposant = 1.6){
  const M = [], ys = f.boules.map(b => b[1]), yBas = Math.min(...ys), yHaut = Math.max(...ys);
  for(const [x, y, z, r, fy = 1] of f.boules){                // fy : une boule aplatie (les plateaux du pin sylvestre)
    const C = V(x, y, z), haut = yHaut > yBas ? (y - yBas) / (yHaut - yBas) : 1;
    const radiale = (px, py, pz, n0) => { const v = V(px - x, (py - y) / fy, pz - z).normalize(); return n0 ? v.multiplyScalar(.7).add(n0.clone().multiplyScalar(.3)).normalize() : v; };
    const ombre = (px, py, pz) => {
      const d = Math.hypot(px - x, (py - y) * 1.15 / fy, pz - z) / r, dessus = (py - y) / (r * fy);
      return Math.min(1.2, Math.max(.42, .52 + .42 * Math.min(1, Math.max(0, (d - .5) / .55)) + .3 * dessus)) * (.86 + .14 * haut);
    };
    M.push({geo: BOULE, m: new THREE.Matrix4().compose(C, new THREE.Quaternion(), V(r * .84, r * .74 * fy, r * .84)), c: new THREE.Color(tons[0]).multiplyScalar(.84).getHex(), normale: radiale, ombre});
    const n = Math.max(8, Math.round(nbFeuilles * (r / .6) ** exposant));   // exposant : les petites boules gardent assez de feuilles (pin)
    for(let k = 0; k < n; k++){
      /* des points répartis sur la boule (spirale de Fibonacci), surtout sur le dessus et les côtés */
      const t = (k + .5) / n, yy = 1 - t * 1.88, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = k * 2.39996 + alea() * .4;
      const nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr).normalize();
      const P = C.clone().add(V(nrm.x * r * .92, nrm.y * r * .82 * fy, nrm.z * r * .92));
      /* la feuille pointe vers le bas, couchée sur la boule comme une écaille */
      let tip = V(0, -1, 0).sub(nrm.clone().multiplyScalar(-nrm.y));
      if(tip.lengthSq() < .05) tip = V(Math.cos(a + 1.3), 0, Math.sin(a + 1.3));
      tip.normalize().applyAxisAngle(nrm, (alea() - .5) * .9);
      const X = new THREE.Vector3().crossVectors(tip, nrm).normalize();
      /* la pointe se soulève un peu de la boule, comme une écaille */
      /* en bas de la boule, elles se soulèvent plus et retombent en jupe (comme sur les images) */
      const lev = .08 + alea() * .12 + .34 * Math.max(0, .25 - yy), Y = tip.clone().multiplyScalar(Math.cos(lev)).add(nrm.clone().multiplyScalar(Math.sin(lev))), Z = new THREE.Vector3().crossVectors(X, Y);
      const s = r * (taille + alea() * taille / 3);
      const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s * .82), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(P);
      const t3 = alea();                                    // surtout le ton principal et le clair, un peu de sombre, rarement l'autre
      M.push({geo: feuille, m, c: tons[t3 < .45 ? 0 : t3 < .75 ? 2 : t3 < .92 ? 1 : 3], normale: radiale, ombre});
    }
  }
  return fusionner(M);
}
/* L'hiver, les feuilles sèches restées accrochées au bout des rameaux (le chêne en garde quelques-unes) */
function sechesDe(f, alea){
  const M = [];
  f.boules.forEach(([x, y, z, r]) => {
    for(let k = 0; k < 2; k++){
      const a = alea() * Math.PI * 2, P = V(x * .82 + Math.cos(a) * r * .6, y + r * (.1 + alea() * .5), z * .82 + Math.sin(a) * r * .6);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(alea() * 3, alea() * 6, alea() * 3));
      M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(P, q, V(r * .32, r * .4, r * .4)), c: SECHES[k % 3]});
    }
  });
  return fusionner(M);
}
/* Un peu de neige sur le dessus des branches et des racines */
export function neigeDe(f, alea){
  const M = [];
  f.boules.forEach(([x, y, z, r], k) => {
    const [dx, dy] = f.depart[k];
    const P = V((dx + x * .82) / 2, (dy + y - r * .35) / 2 + f.tronc[0] * .5, z * .41);
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(P, new THREE.Quaternion(), V(r * .32, .05, r * .2)), c: 0xF4F8FA});
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x * .82, y - r * .3, z * .82), new THREE.Quaternion(), V(r * .26, .05, r * .26)), c: 0xF4F8FA});
  });
  const [nr, lr] = f.racines;
  for(let k = 0; k < nr; k++){
    const a = k / nr * Math.PI * 2 + alea() * .5;
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(Math.cos(a) * lr * .55, .12, Math.sin(a) * lr * .55), new THREE.Quaternion(), V(lr * .22, .04, lr * .14)), c: 0xF4F8FA});
  }
  return fusionner(M);
}
/* En automne, au pied : des feuilles mortes couchées et des glands */
function piedAutomne(tons, alea, rayon){
  const M = [];
  for(let k = 0; k < 9; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.45 + alea() * .9);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, alea() * 6));
    M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .03, Math.sin(a) * d), q, V(.16, .2, .2)), c: tons[k % 4]});
  }
  for(let k = 0; k < 4; k++){
    const a = alea() * Math.PI * 2, d = rayon * (.5 + alea() * .7), P = V(Math.cos(a) * d, .045, Math.sin(a) * d);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 * (alea() < .5 ? 1 : 0), alea() * 6, 0));
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(P, q, V(.045, .06, .045)), c: 0xB0703A});
    M.push({geo: CUPULE, m: new THREE.Matrix4().compose(P.clone().add(V(0, .03, 0).applyQuaternion(q)), q, V(.05, .035, .05)), c: 0x6E4A2A});
  }
  return fusionner(M);
}

/* ---------- les matières, partagées ---------- */
export const MAT_BOIS = toon({vertexColors: true});
export const MAT_FEUILLES = feuillageMat();
export const MAT_PLAT = toon({vertexColors: true, side: THREE.DoubleSide});
/* Pour le téléphone : l'ombre d'un feuillage au sol vient de boules invisibles (une par boule de feuilles), pas de chacune
   des feuilles ; ces boules ne se dessinent pas, elles ne font que de l'ombre (et assombrissent le dessous des boules) */
export const MAT_OMBRE = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false});
export function ombreDe(f){
  return fusionner(f.boules.map(([x, y, z, r, fy = 1]) => ({geo: BOULE_BAS, m: new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(r * .8, r * .66 * fy, r * .8)), c: 0})));
}
/* Le feuillage de près, et de loin (au-delà de LOIN P de la caméra : à la première personne, les arbres du fond), avec trois
   fois moins de feuilles : le téléphone dessine beaucoup moins, l'oeil ne voit pas la différence dans la brume */
/* La distance se compte depuis le personnage (vu de dessus, la caméra est loin au-dessus de lui : recul, main.js) */
const LOIN = 24, pCam = new THREE.Vector3(), pArbre = new THREE.Vector3();
let recul = 0;
export const reglerRecul = d => { recul = d; };
function choisirDetail(camera){
  const L = this.levels;
  pCam.setFromMatrixPosition(camera.matrixWorld); pArbre.setFromMatrixPosition(this.matrixWorld);
  const loin = pCam.distanceTo(pArbre) - recul > LOIN;
  L[0].object.visible = !loin; L[1].object.visible = loin;
}
export function feuillesEtOmbre(g, geoFeuilles, geoOmbre, mat, geoLeger){
  if(geoLeger){
    const lod = new THREE.LOD();
    lod.addLevel(mesh(geoFeuilles, mat, false), 0); lod.addLevel(mesh(geoLeger, mat, false), LOIN);
    lod.update = choisirDetail;
    g.add(lod);
  } else g.add(mesh(geoFeuilles, mat, false));
  const o = mesh(geoOmbre, MAT_OMBRE); o.receiveShadow = false; g.add(o);
}

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(stade, saison, variante, neige){
  const cle = [stade, saison, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const f = stade === 2 ? FORME.adulte : FORME.jeune, hiver = saison === "hiver", alea = aleaDe(17 + variante * 101 + stade * 7);
  const r = {
    bois: boisDe(f, hiver, alea),
    feuillage: hiver ? null : feuillageDe(f, tonsFeuilles(saison, variante), alea, stade === 2 ? 60 : 42),
    leger: hiver ? null : feuillageDe(f, tonsFeuilles(saison, variante), alea, stade === 2 ? 20 : 14),
    ombre: hiver ? null : ombreDe(f),
    seches: hiver ? sechesDe(f, alea) : null,
    neige: hiver && neige ? neigeDe(f, alea) : null,
    pied: saison === "automne" ? piedAutomne(TONS.automne[variante % 3], alea, stade === 2 ? 1.05 : .6) : null
  };
  CACHE.set(cle, r);
  return r;
}
export const mesh = (geo, m, ombre = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = ombre; o.receiveShadow = true; return o; };
/* Le chêne : stade 0 (une pousse), 1 (jeune chêne), 2 (adulte) ; r : son tirage (nuance, taille) ; neige : il neige */
export function cheneModele(stade, saison, r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.chene = {stade, saison, feuillage: saison !== "hiver"};
  if(stade === 0) return pousse(g, saison);
  const G = geos(stade, saison, variante, neige);
  g.add(mesh(G.bois, MAT_BOIS));
  if(G.feuillage) feuillesEtOmbre(g, G.feuillage, G.ombre, MAT_FEUILLES, G.leger);
  if(G.seches) g.add(mesh(G.seches, MAT_PLAT, false));
  if(G.neige) g.add(mesh(G.neige, MAT_BOIS, false));
  if(G.pied){ g.add(mesh(G.pied, MAT_PLAT, false)); g.userData.chene.pied = true; }
  return g;
}
/* La pousse : une tige fine et trois petites feuilles (l'hiver, une seule, sèche) */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const tons = tonsFeuilles(saison === "hiver" ? "hiver" : saison === "automne" ? "automne" : "printemps", 0), M = [];
    M.push({...segment(V(0, 0, 0), V(.02, .36, 0), .03, .016, 5), c: BOIS});
    const n = saison === "hiver" ? 1 : 3;
    for(let k = 0; k < n; k++){
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.6, k * 2.1, 0));
      M.push({geo: FEUILLE, m: new THREE.Matrix4().compose(V(0, .3 + k * .03, 0).add(V(.06, .06, 0).applyQuaternion(q)), q, V(.13, .17, .17)), c: tons[k % 3]});
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT_PLAT));
  return g;
}

/* La souche (image de Yo) : large et basse, ses racines, le dessus clair aux cernes, des touffes de mousse ;
   un peu de neige dessus quand il neige */
const SOUCHES = new Map();
export function soucheModele(neige = false){
  const cle = neige ? 1 : 0;
  if(!SOUCHES.has(cle)){
    const alea = aleaDe(4711), M = [];
    M.push({geo: tronc(.34, .4, .36, 9), m: new THREE.Matrix4(), c: BOIS});
    M.push({geo: new THREE.CylinderGeometry(.31, .31, .03, 18), m: new THREE.Matrix4().makeTranslation(0, .365, 0), c: 0xE6B878});   // le dessus, clair
    [.24, .16, .08].forEach((rr, k) => M.push({geo: new THREE.TorusGeometry(rr, .012, 4, 22), m: new THREE.Matrix4().compose(V(0, .382, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)), c: k % 2 ? 0xCC9258 : 0xD49E62}));   // les cernes
    for(let k = 0; k < 5; k++){
      const a = k / 5 * Math.PI * 2 + alea() * .5;
      M.push({...segment(V(Math.cos(a) * .25, .16, Math.sin(a) * .25), V(Math.cos(a) * .62, .02, Math.sin(a) * .62), .12, .04), c: k % 2 ? BOIS : BOIS_SOMBRE});
    }
    for(let k = 0; k < 4; k++){                               // la mousse au pied
      const a = alea() * Math.PI * 2;
      M.push({geo: BOULE, m: new THREE.Matrix4().compose(V(Math.cos(a) * .42, .06, Math.sin(a) * .42), new THREE.Quaternion(), V(.1 + alea() * .05, .07, .1 + alea() * .05)), c: MOUSSE});
    }
    M.push({geo: GLAND, m: new THREE.Matrix4().compose(V(.18, .2, .37), new THREE.Quaternion(), V(.04, .06, .02)), c: NOEUD});   // un petit noeud
    if(neige) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(0, .39, 0), new THREE.Quaternion(), V(.3, .045, .3)), c: 0xF4F8FA});
    SOUCHES.set(cle, fusionner(M));
  }
  const g = new THREE.Group();
  g.add(mesh(SOUCHES.get(cle), MAT_BOIS));
  g.userData.souche = true;
  return g;
}

/* ---------- les feuilles qui volent (un coup de hache, la chute de l'arbre) ---------- */
const volent = [];
const MATS_FEUILLE = new Map();
const matFeuille = c => MATS_FEUILLE.get(c) || (MATS_FEUILLE.set(c, toon({color: c, side: THREE.DoubleSide})), MATS_FEUILLE.get(c));
/* n feuilles qui tombent du feuillage (entre bas et haut, autour de x, z), aux couleurs tons, dans la scène sc */
export function lacherFeuilles(sc, x, z, n, tons, bas = 1.8, haut = 3.2, large = 1){
  for(let k = 0; k < n; k++){
    const m = new THREE.Mesh(FEUILLE, matFeuille(tons[k % tons.length]));
    const a = Math.random() * Math.PI * 2, d = Math.random() * large;
    m.position.set(x + Math.cos(a) * d, bas + Math.random() * (haut - bas), z + Math.sin(a) * d);
    m.scale.setScalar(.16 + Math.random() * .06);
    m.rotation.set(Math.random() * 3, Math.random() * 6, Math.random() * 3);
    sc.add(m);
    volent.push({m, sc, vx: (Math.random() - .5) * .9, vz: (Math.random() - .5) * .9, vy: -(.45 + Math.random() * .35), ph: Math.random() * 6, t: 0, posee: 0});
  }
}
export function updateFeuilles(dt){
  for(let k = volent.length - 1; k >= 0; k--){
    const f = volent[k], m = f.m;
    f.t += dt;
    if(!f.posee){
      m.position.x += (f.vx + Math.sin(f.t * 3 + f.ph) * .5) * dt;
      m.position.z += (f.vz + Math.cos(f.t * 2.4 + f.ph) * .35) * dt;
      m.position.y += f.vy * dt;
      m.rotation.x += dt * 2.2; m.rotation.z += dt * 1.6;
      if(m.position.y <= .03){ m.position.y = .03; m.rotation.set(-Math.PI / 2, 0, f.ph); f.posee = f.t; }
    }
    if(f.t > 9 || f.posee && f.t - f.posee > 3){ f.sc.remove(m); volent.splice(k, 1); }
  }
}
export const feuillesQuiVolent = () => volent.length;
