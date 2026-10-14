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
   fusionner dans formes.js) et partagé par tous les chênes de l'île ; le feuillage ondule au vent (feuillageMat). */
import { toon, fusionner, feuillageMat } from "./formes.js";

/* ---------- petits outils ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HAUT = V(0, 1, 0);
function aleaDe(graine){                                   // un tirage fixe : le même chêne à chaque fois
  let s = graine >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/* Une branche (ou une racine) de A à B, épaisse de rA en A et rB en B */
function segment(A, B, rA, rB, cotes = 7){
  const d = B.clone().sub(A), L = d.length();
  const geo = new THREE.CylinderGeometry(rB, rA, L, cotes, 1);
  const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(HAUT, d.normalize()), V(1, 1, 1));
  return {geo, m};
}
/* Le tronc : un cylindre qui s'évase au pied, creusé de sillons qui tournent un peu */
function tronc(rHaut, rBas, h, sillons = 7){
  const g = new THREE.CylinderGeometry(rHaut, rBas, h, 14, 8);
  const p = g.attributes.position;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (y + h / 2) / h, a = Math.atan2(z, x);
    const k = (1 + .07 * Math.sin(a * sillons + t * 2.4)) * (1 + .55 * Math.pow(1 - t, 3));
    p.setXYZ(i, x * k, y + h / 2, z * k);
  }
  g.computeVertexNormals();
  return g;
}
/* Une feuille de chêne : un contour aux lobes ronds (une onde le long du bord), longue de 1 (de la queue à la pointe),
   centrée au milieu */
const FEUILLE = (() => {
  const pts = [], n = 12;
  for(let k = 0; k <= n; k++){
    const t = k / n, e = Math.sin(Math.PI * Math.pow(t, .8)) * .3;
    pts.push([Math.max(.012, e * (.72 + .28 * Math.cos(t * Math.PI * 7))), t]);
  }
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  pts.forEach(([w, t]) => s.lineTo(w, t));
  for(let k = pts.length - 1; k >= 0; k--) s.lineTo(-pts[k][0], pts[k][1]);
  return new THREE.ShapeGeometry(s).translate(0, -.5, 0);
})();
const BOULE = new THREE.IcosahedronGeometry(1, 1);
const GLAND = new THREE.SphereGeometry(1, 8, 6);
const CUPULE = new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const NEIGE_GEO = new THREE.SphereGeometry(1, 8, 5);

/* ---------- les couleurs ---------- */
const BOIS = 0xA8683A, BOIS_SOMBRE = 0x8A5430, NOEUD = 0x6E4226, MOUSSE = 0x7FA83A;
/* Les tons du feuillage, selon la saison ; trois nuances (variante) pour que les chênes ne soient pas tous pareils */
const TONS = {
  printemps: [[0x9ED45C, 0x86C64E, 0xB6E06C, 0x6FB044], [0x94CC56, 0x7CBC48, 0xACD866, 0x68A840], [0xA6D862, 0x8ECC52, 0xBEE474, 0x76B44A]],
  ete:       [[0x5DA43E, 0x4C9234, 0x74B448, 0x8DC052], [0x569C3A, 0x468C32, 0x6CAC44, 0x84B84C], [0x64AA42, 0x52983A, 0x7CBA4C, 0x96C658]],
  automne:   [[0xF08A2C, 0xD9552E, 0xF7B238, 0xC8442A], [0xE8702C, 0xC9472A, 0xF0942E, 0xF2B03A], [0xF4A632, 0xE07A2A, 0xF8C44A, 0xD9552E]]
};
const SECHES = [0x9C6B3C, 0x8A5A30, 0xB07A44];               // les feuilles sèches de l'hiver
export const tonsFeuilles = (saison, variante = 0) => saison === "hiver" ? SECHES : TONS[saison][variante % 3];

/* ---------- la forme : d'après les images ---------- */
/* Les boules de feuillage du chêne adulte [x, y, z, rayon] (en P ; le chêne fait environ 3,4 P) */
const BOULES = [[.05, 3.0, -.08, .62], [-.55, 2.72, .12, .55], [.5, 2.78, -.32, .55], [-.78, 2.22, .28, .6], [.72, 2.3, .22, .58],
  [.05, 2.42, .58, .55], [-.18, 2.5, -.58, .55], [-.88, 1.72, .48, .36]];
const BOULES_JEUNE = [[0, 1.5, 0, .44], [-.44, 1.08, .06, .33], [.44, 1.12, -.06, .33]];
const FORME = {
  adulte: {tronc: [.2, .32, 1.45], noeud: [.85, .27], racines: [5, .62, .13], boules: BOULES, depart: [[0, 1.2], [0, 1.35], [0, 1.4], [0, 1.15], [0, 1.25], [0, 1.3], [0, 1.3], [-.1, 1.0]]},
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
    M.push({...segment(A, B, rh * (k === f.boules.length - 1 && f === FORME.adulte ? .45 : .7), rh * .32), c: BOIS});
    if(hiver) for(let j = 0; j < 3; j++){                   // l'hiver, trois rameaux nus au bout de chaque branche
      const a = alea() * Math.PI * 2, C = V(B.x + Math.cos(a) * r * .75, B.y + r * (.35 + alea() * .5), B.z + Math.sin(a) * r * .75);
      M.push({...segment(B, C, rh * .2, rh * .07, 5), c: BOIS});
    }
  });
  return fusionner(M);
}
/* Le feuillage : chaque boule, une forme ronde sombre couverte de feuilles de plusieurs tons ; la lumière l'éclaire comme une
   boule (normales qui partent du centre de la boule) */
function feuillageDe(f, tons, alea, nbFeuilles = 11){
  const M = [];
  for(const [x, y, z, r] of f.boules){
    const C = V(x, y, z), radiale = (px, py, pz) => V(px - x, py - y, pz - z).normalize();
    M.push({geo: BOULE, m: new THREE.Matrix4().compose(C, new THREE.Quaternion(), V(r * .84, r * .74, r * .84)), c: new THREE.Color(tons[0]).multiplyScalar(.9).getHex(), normale: radiale});
    const n = Math.max(6, Math.round(nbFeuilles * (r / .6) ** 1.6));
    for(let k = 0; k < n; k++){
      /* des points répartis sur la boule (spirale de Fibonacci), surtout sur le dessus et les côtés */
      const t = (k + .5) / n, yy = 1 - t * 1.55, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = k * 2.39996 + alea() * .4;
      const nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr).normalize();
      const P = C.clone().add(V(nrm.x * r * .88, nrm.y * r * .78, nrm.z * r * .88));
      /* la feuille pointe vers le bas, couchée sur la boule comme une écaille */
      let tip = V(0, -1, 0).sub(nrm.clone().multiplyScalar(-nrm.y));
      if(tip.lengthSq() < .05) tip = V(Math.cos(a + 1.3), 0, Math.sin(a + 1.3));
      tip.normalize().applyAxisAngle(nrm, (alea() - .5) * .9);
      const X = new THREE.Vector3().crossVectors(tip, nrm).normalize();
      /* la pointe se soulève un peu de la boule, comme une écaille */
      const lev = .3 + alea() * .2, Y = tip.clone().multiplyScalar(Math.cos(lev)).add(nrm.clone().multiplyScalar(Math.sin(lev))), Z = new THREE.Vector3().crossVectors(X, Y);
      const s = r * (.72 + alea() * .24);
      const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s * .82), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(P);
      const t3 = alea();                                    // surtout le ton principal et le clair, un peu de sombre, rarement l'autre
      M.push({geo: FEUILLE, m, c: tons[t3 < .45 ? 0 : t3 < .75 ? 2 : t3 < .92 ? 1 : 3], normale: radiale});
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
function neigeDe(f, alea){
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
const MAT_BOIS = toon({vertexColors: true});
const MAT_FEUILLES = feuillageMat();
const MAT_PLAT = toon({vertexColors: true, side: THREE.DoubleSide});

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(stade, saison, variante, neige){
  const cle = [stade, saison, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const f = stade === 2 ? FORME.adulte : FORME.jeune, hiver = saison === "hiver", alea = aleaDe(17 + variante * 101 + stade * 7);
  const r = {
    bois: boisDe(f, hiver, alea),
    feuillage: hiver ? null : feuillageDe(f, tonsFeuilles(saison, variante), alea, stade === 2 ? 17 : 13),
    seches: hiver ? sechesDe(f, alea) : null,
    neige: hiver && neige ? neigeDe(f, alea) : null,
    pied: saison === "automne" ? piedAutomne(TONS.automne[variante % 3], alea, stade === 2 ? 1.05 : .6) : null
  };
  CACHE.set(cle, r);
  return r;
}
const mesh = (geo, m, ombre = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = ombre; o.receiveShadow = true; return o; };
/* Le chêne : stade 0 (une pousse), 1 (jeune chêne), 2 (adulte) ; r : son tirage (nuance, taille) ; neige : il neige */
export function cheneModele(stade, saison, r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.chene = {stade, saison, feuillage: saison !== "hiver"};
  if(stade === 0) return pousse(g, saison);
  const G = geos(stade, saison, variante, neige);
  g.add(mesh(G.bois, MAT_BOIS));
  if(G.feuillage) g.add(mesh(G.feuillage, MAT_FEUILLES));
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
