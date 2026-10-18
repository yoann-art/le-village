/* ================= Le thym =================
   Une touffe de thym des prés de l'île (étape 2.1, morceau 3 ; son image : Yo, 18 octobre 2026), au plus près de l'image :
   un dôme bas, plus large que haut (environ 0,65 P de large, 0,42 P de haut) ; une quinzaine de tiges ligneuses brun-roux
   qui partent du pied, les plus basses presque couchées, celles du milieu dressées, et qui se relèvent vers le bout ; le
   long de chaque tige, des paires de petites feuilles ovales, épaisses et bombées, vert-gris, chaque paire tournée d'un
   quart de tour sur la précédente (comme le vrai thym), le bout plus clair ; un coeur serré de feuilles qui remplit le dôme ;
   au bout des tiges, des têtes de petites fleurs mauves à cinq lobes, au coeur pâle, et leurs boutons rose-violet.
   Les saisons (la vraie nature : le thym garde ses feuilles toute l'année et fleurit de la fin du printemps à l'été) : au
   printemps, vert tendre et des têtes en boutons qui s'ouvrent à peine ; l'été, en fleurs comme sur l'image ; en automne,
   les feuilles plus ternes et quelques têtes sèches brunes ; l'hiver, vert-gris sombre, le bout des tiges violacé, sans
   fleurs, de la neige sur le dessus quand il neige. Cueilli : les tiges coupées court, plus de fleurs ; jeune : sans fleurs.
   Pour le téléphone : un modèle par (saison, état, nuance, neige), partagé, en un seul dessin (et une boule invisible pour
   son ombre) ; un modèle léger quand il est petit à l'écran (presLoin). */
import { fusionner, feuillageMat } from "./formes.js";
import { aleaDe, segment, BOULE_BAS, NEIGE_GEO, MAT_OMBRE, mesh, presLoin } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion(), HAUT = V(0, 1, 0);
const LOIN = 6;
/* les feuilles : [ton 1, ton 2, ombre, bout des tiges] */
const TONS = {
  printemps: [0x7FA25A, 0x93B46C, 0x6A8A4C, 0xAEC874],
  ete:       [0x74905E, 0x8AA472, 0x5E784C, 0x9CB46A],
  automne:   [0x7A8A5C, 0x8C986A, 0x65744E, 0x9AA06A],
  hiver:     [0x5E7258, 0x6E8066, 0x50604C, 0x726A66]
};
const BOIS = [0x8E5234, 0xA0663C, 0x8C9A54], BOIS_HIVER = [0x74462E, 0x82543A, 0x6E6650];
const FLEUR = [0xB98AE0, 0xC79CEC, 0xA97AD6], COEUR = 0xF4ECF6;
const BOUTON = {printemps: [0xA0708E, 0x8E8A64, 0xB47CA6], ete: [0x9A5C92, 0xB06AA8, 0x7E4E7C], automne: [0x8E7454, 0x7A6248, 0x9A8462]};

/* une feuille : un ovale épais, bombé le long de sa nervure, le bout un peu relevé ; longue de 1 vers +y, à plat face à +z ;
   teinte : le pied plus sombre, le bout et la nervure plus clairs, les bords un peu plus sombres */
function feuilleGeo(T){
  const pos = [], te = [], ind = [];
  T.forEach(t => {
    const w = .36 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), .55), bombe = .09 * Math.sin(Math.PI * t), leve = .08 * t * t, c = .82 + .32 * t;
    pos.push(-w, t, leve, 0, t, leve + bombe, w, t, leve);
    te.push(c * .9, c * 1.08, c * .9);
  });
  for(let k = 0; k < T.length - 1; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const FEUILLE = feuilleGeo([0, .18, .45, .75, 1]), FEUILLE_LEGERE = feuilleGeo([0, .4, 1]);
/* une fleur : cinq lobes ronds autour d'un coeur, un peu en coupe ; rayon 1, face à +z */
const FLEUR_GEO = (() => {
  const n = 20, pos = [0, 0, 0], te = [1.12], ind = [];
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2, r = .5 + .5 * Math.pow(Math.abs(Math.cos(a * 2.5)), .6);
    pos.push(Math.cos(a) * .3, Math.sin(a) * .3, .04, Math.cos(a) * r, Math.sin(a) * r, .16 * r);
    te.push(1.08, 1);
  }
  for(let k = 0; k < n; k++){ const a = 1 + k * 2, b = 1 + (k + 1) % n * 2; ind.push(0, a, b, a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
})();
const BOUTON_GEO = new THREE.SphereGeometry(1, 5, 3), BOUTON_LEGER = new THREE.SphereGeometry(1, 4, 2);

/* l'ombre peinte : le pied et le creux du dôme à l'ombre, le dessus et le bord clairs */
const ombre = (x, y, z) => .6 + .26 * Math.min(1, y / .34) + .14 * Math.min(1, Math.hypot(x, z) / .3);
/* les feuilles s'éclairent un peu comme un dôme (leur normale mêlée à celle du dôme) */
const radiale = (x, y, z, n0) => V(x, (y + .05) * 1.1, z).normalize().multiplyScalar(.45).add(n0.clone().multiplyScalar(.55)).normalize();

/* une feuille en P, son bout vers D, sa face vers N (remise d'équerre), de taille s */
function feuille(M, P, D, N, s, c, leger){
  const Y = D.clone().normalize(), Z = N.clone().sub(Y.clone().multiplyScalar(N.dot(Y))).normalize(), X = Y.clone().cross(Z).normalize();
  M.push({geo: leger ? FEUILLE_LEGERE : FEUILLE, m: new THREE.Matrix4().makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(P), c, normale: radiale, ombre});
}
/* une tige : une courbe de A à C qui part vers l'extérieur et se relève vers le bout */
const point = (A, B, C, t) => A.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(B, 2 * t * (1 - t)).addScaledVector(C, t * t);
const tangente = (A, B, C, t) => B.clone().sub(A).multiplyScalar(2 * (1 - t)).addScaledVector(C.clone().sub(B), 2 * t).normalize();
function tige(M, A, B, C, e, leger, bois){
  const n = leger ? 3 : 5;
  for(let k = 0; k < n; k++){
    const t0 = k / n, t1 = (k + 1) / n;
    M.push({...segment(point(A, B, C, t0), point(A, B, C, t1), e * (1 - .65 * t0), e * (1 - .65 * t1), leger ? 3 : 5), c: bois[t0 < .45 ? 0 : t0 < .75 ? 1 : 2], ombre});
  }
}
/* les paires de feuilles le long d'une tige, chacune tournée d'un quart de tour ; plus petites et dressées vers le bout */
function feuillesDeTige(M, A, B, C, L, tons, alea, leger, tour){
  const pas = leger ? .07 : .028, n = Math.max(2, Math.floor(L * .78 / pas));
  for(let k = 0; k <= n; k++){
    const t = .22 + .76 * k / n, P = point(A, B, C, t), T = tangente(A, B, C, t);
    const U = T.clone().cross(HAUT); if(U.lengthSq() < 1e-4) U.set(1, 0, 0); U.normalize();
    const W = U.clone().cross(T).normalize(), phi = tour + k * Math.PI / 2 + (alea() - .5) * .3;
    const S = U.clone().multiplyScalar(Math.cos(phi)).addScaledVector(W, Math.sin(phi));
    const bout = t > .88, s = (bout ? .04 : .066 - .02 * t) * (.9 + alea() * .2);
    for(const sg of [1, -1]){
      const D = T.clone().multiplyScalar(bout ? .85 : .45).addScaledVector(S, sg * (bout ? .5 : .9)).normalize();
      const N = T.clone().addScaledVector(HAUT, .5);
      feuille(M, P, D, N, s, bout ? tons[3] : tons[alea() < .5 ? 0 : 1], leger);
    }
  }
  /* le bourgeon du bout : deux petites feuilles serrées */
  const T = tangente(A, B, C, 1), U = T.clone().cross(HAUT).normalize();
  if(U.lengthSq() > .5) for(const sg of [1, -1]) feuille(M, C, T.clone().addScaledVector(U, sg * .3).normalize(), T.clone().addScaledVector(HAUT, .3), .03, tons[3], leger);
}
/* le dôme : RX de large, RY de haut ; ras (cueilli), plus bas */
const domeDe = ras => ras ? {RX: .24, RY: .12} : {RX: .3, RY: .3};
/* le coeur du dôme : une couche de feuilles à l'ombre dedans, puis les feuilles du dessus,
   couchées sur le dôme, le bout soulevé, qui se chevauchent */
function coeur(M, tons, alea, leger, ras){
  const {RX, RY} = domeDe(ras);
  const couches = leger ? [[.92, 44]] : ras ? [[.72, 40], [.95, 80]] : [[.7, 60], [.9, 110], [1.02, 70]];
  for(const [d0, n] of couches) for(let k = 0; k < n; k++){
    const a = k * 2.39996 + alea() * .4, yy = .04 + .96 * Math.pow((k + .5) / n, .9), rr = Math.sqrt(1 - yy * yy);
    const nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr), d = d0 + (alea() - .5) * .1;
    const P = V(nrm.x * RX * d, nrm.y * RY * d, nrm.z * RX * d);
    const tg = V(-Math.sin(a), 0, Math.cos(a)).applyAxisAngle(nrm, alea() * Math.PI * 2), lev = .25 + alea() * .45;
    const D = tg.clone().multiplyScalar(Math.cos(lev)).addScaledVector(nrm, Math.sin(lev));
    const N = nrm.clone().multiplyScalar(Math.cos(lev)).addScaledVector(tg, -Math.sin(lev));
    feuille(M, P, D, N, (.058 + alea() * .02) * (leger ? 1.25 : 1), tons[d0 < .8 ? 2 : k % 6 === 0 ? 3 : k % 2 ? 0 : 1], leger);
  }
  /* le pied : un anneau de feuilles presque couchées sur le sol, tournées vers l'extérieur */
  const np = leger ? 10 : 28;
  for(let k = 0; k < np; k++){
    const a = k / np * Math.PI * 2 + alea() * .3, h = V(Math.cos(a), 0, Math.sin(a)), d = RX * (.6 + alea() * .3);
    feuille(M, V(h.x * d, .015 + alea() * .02, h.z * d), h.clone().add(V(0, .25 + alea() * .2, 0)), V(0, 1, 0), .06 + alea() * .015, tons[k % 2], leger);
  }
}
/* une tête de fleurs au bout d'une tige : ses boutons et ses fleurs ouvertes, tournés vers le haut et l'extérieur */
function tete(M, C, T, alea, saison, leger){
  const ouvertes = saison === "ete" ? 4 + Math.floor(alea() * 3) : saison === "printemps" ? (alea() < .4 ? 1 : 0) : 0;
  const boutons = BOUTON[saison], H = C.clone().addScaledVector(T, .012), nb = leger ? 2 : 8;
  if(leger && ouvertes){ M.push({geo: BOUTON_LEGER, m: new THREE.Matrix4().compose(H.clone().addScaledVector(T, .01), Q, V(.045, .04, .045)), c: FLEUR[0]}); return ouvertes; }
  const dir = () => { const v = V(alea() - .5, alea() - .5, alea() - .5).normalize(); if(v.dot(T) < .15) v.addScaledVector(T, .15 - v.dot(T) + .2).normalize(); return v; };
  for(let k = 0; k < nb; k++){
    const v = dir(), P = H.clone().addScaledVector(v, .02), q = new THREE.Quaternion().setFromUnitVectors(HAUT, v);
    M.push({geo: leger ? BOUTON_LEGER : BOUTON_GEO, m: new THREE.Matrix4().compose(P, q, V(.011, .016, .011)), c: boutons[k % 3]});
  }
  if(!leger) for(let k = 0; k < ouvertes; k++){
    const v = dir(), P = H.clone().addScaledVector(v, .026), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), v);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), alea() * 6.3));
    M.push({geo: FLEUR_GEO, m: new THREE.Matrix4().compose(P, q, V(.023, .023, .023)), c: FLEUR[k % 3]});
    M.push({geo: BOUTON_LEGER, m: new THREE.Matrix4().compose(P.clone().addScaledVector(v, .003), Q, V(.005, .005, .005)), c: COEUR});
  }
  return ouvertes;
}
/* la neige : de petits coussins sur le dessus du dôme */
function neigeDe(M, alea, ras){
  const {RX, RY} = domeDe(ras);
  for(let k = 0; k < 16; k++){
    const a = k * 2.39996 + alea() * .5, yy = .5 + alea() * .45, rr = Math.sqrt(1 - yy * yy);
    const nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr), q = new THREE.Quaternion().setFromUnitVectors(HAUT, nrm.clone().add(HAUT).normalize());
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(nrm.x * RX * .98, nrm.y * RY * 1.0, nrm.z * RX * .98), q, V(.03 + alea() * .015, .01, .026 + alea() * .012)), c: 0xF4F8FA});
  }
}

/* la touffe : etat « fleuri » (adulte), « jeune » ou « rase » (cueillie) */
function touffe(saison, etat, variante, neige, leger){
  const alea = aleaDe(5003 + variante * 89), tons = TONS[saison] || TONS.ete, bois = saison === "hiver" ? BOIS_HIVER : BOIS;
  const ras = etat === "rase", fleuri = etat === "fleuri" && BOUTON[saison], M = [];
  let fleurs = 0, tetes = 0;
  coeur(M, tons, alea, leger, ras);
  const n = 17, {RX, RY} = domeDe(ras);
  for(let k = 0; k < n; k++){
    const a = k * 2.39996 + alea() * .5, h = V(Math.cos(a), 0, Math.sin(a));
    const el = .1 + 1.2 * Math.pow(alea(), 1.15), f = 1.08 + alea() * .16;   // l'élévation de son bout ; il sort un peu du dôme
    const A = V(h.x * (.02 + alea() * .03), .01, h.z * (.02 + alea() * .03));
    const C = V(h.x * Math.cos(el) * RX * f, Math.sin(el) * RY * f + .02, h.z * Math.cos(el) * RX * f), L = C.distanceTo(A);
    const B = A.clone().lerp(V(C.x, A.y, C.z), .55).add(V(0, (C.y - A.y) * .2, 0));
    tige(M, A, B, C, .015, leger, bois);
    feuillesDeTige(M, A, B, C, L, tons, alea, leger, alea() * Math.PI);
    if(fleuri && alea() < (saison === "automne" ? .5 : .72)){ fleurs += tete(M, C, tangente(A, B, C, 1), alea, saison, leger); tetes++; }
    /* une tige sur deux a une branche, qui part du milieu vers l'extérieur et le haut */
    if(alea() < .5 && !ras){
      const A2 = point(A, B, C, .5), l2 = L * .42, h2 = h.clone().applyAxisAngle(HAUT, (alea() - .5) * 1.4), e2 = Math.min(1.25, el + .25);
      const C2 = A2.clone().addScaledVector(h2, l2 * Math.cos(e2)).add(V(0, l2 * Math.sin(e2), 0)), B2 = A2.clone().lerp(C2, .5).add(V(0, -.01, 0));
      tige(M, A2, B2, C2, .009, leger, bois);
      feuillesDeTige(M, A2, B2, C2, l2, tons, alea, leger, alea() * Math.PI);
      if(fleuri && alea() < .5){ fleurs += tete(M, C2, tangente(A2, B2, C2, 1), alea, saison, leger); tetes++; }
    }
  }
  if(neige && saison === "hiver") neigeDe(M, aleaDe(91 + variante), ras);
  return {geo: fusionner(M), fleurs, tetes};
}
const MAT = feuillageMat({}, .05, .9);                     // le dessus bouge un peu au vent, le pied non (le thym est raide)
const OMBRE = fusionner([{geo: BOULE_BAS, m: new THREE.Matrix4().compose(V(0, .1, 0), Q, V(.3, .2, .3)), c: 0}]);
const OMBRE_RASE = fusionner([{geo: BOULE_BAS, m: new THREE.Matrix4().compose(V(0, .06, 0), Q, V(.22, .1, .22)), c: 0}]);
const CACHE = new Map();
function geos(saison, etat, variante, neige){
  const cle = [saison, etat, variante, neige && saison === "hiver" ? 1 : 0].join(":");
  if(!CACHE.has(cle)){
    const pres = touffe(saison, etat, variante, neige, false);
    CACHE.set(cle, {pres: pres.geo, loin: touffe(saison, etat, variante, neige, true).geo, fleurs: pres.fleurs, tetes: pres.tetes, neige: neige && saison === "hiver"});
  }
  return CACHE.get(cle);
}
/* Une touffe de thym : saison ; etat : « fleuri » (adulte), « jeune » (plantée, pas encore grande) ou « rase » (cueillie) ;
   r : son tirage (nuance, taille) ; neige : il neige */
export function thymModele(saison, etat = "fleuri", r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, variante, neige), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT, false), mesh(G.loin, MAT, false), LOIN));
  const o = mesh(etat === "rase" ? OMBRE_RASE : OMBRE, MAT_OMBRE); o.receiveShadow = false; g.add(o);
  g.scale.setScalar(.92 + r * .16);
  g.userData.thym = {saison, etat, fleurs: G.fleurs, tetes: G.tetes, neige: G.neige};
  return g;
}
