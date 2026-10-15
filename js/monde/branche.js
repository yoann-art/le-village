/* ================= La branche de chêne au sol =================
   Le morceau de bois qu'on ramasse à la main (étape 2.1, morceau 3 ; son image : Yo, 15 octobre 2026), au plus près de
   l'image : une grosse branche couchée (environ 0,75 P), cassée net à un bout (le bois clair, en échardes), couverte d'une
   écorce en plaques (le bord de chaque plaque plus sombre), un noeud rond sur le côté, trois chicots coupés (le bois clair au
   bout, un cerne), et qui se partage : une fourche continue en s'amincissant jusqu'à un bout coupé, l'autre remonte en un
   rameau fin qui porte deux feuilles de chêne, lobées, nervures claires. Les feuilles suivent la saison comme celles du
   chêne (vertes, puis rousses ; l'hiver, sèches et brunes).
   Pour le téléphone : un modèle par (saison, nuance), partagé ; au-delà de LOIN P du personnage, un modèle léger. */
import { fusionner } from "./formes.js";
import { aleaDe, feuilleGeo, mesh, presLoin, tonsFeuilles, MAT_BOIS, MAT_PLAT } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 6;
const ECORCE = 0xC27E44, ECORCE_C = 0xC88A4E, BOIS_CLAIR = 0xE8C68A, CERNE = 0xC49A5C, NERVURE = 0xD8E070;

/* ---------- un morceau de branche : un tube qui suit une courbe, épais de r0 à r1 ----------
   l'écorce en plaques : des briques irrégulières (chaque rangée décalée, chaque plaque sa longueur et son ton), bombées au
   milieu, le bord creusé et plus sombre (comme les écailles de l'image) */
function tube(points, r0, r1, alea, {long = 22, tour = 12, plaques = true} = {}){
  const courbe = new THREE.CatmullRomCurve3(points), L = courbe.getLength();
  const pos = [], te = [], ind = [], cols = 5;
  /* chaque colonne de plaques : un décalage et des longueurs au hasard */
  const decal = Array.from({length: cols}, () => alea()), pas = Array.from({length: cols}, () => .062 + alea() * .03), tons = Array.from({length: cols * 40}, () => .88 + alea() * .24);
  let N = null;
  for(let i = 0; i <= long; i++){
    const t = i / long, C = courbe.getPointAt(t), T = courbe.getTangentAt(t).normalize();
    if(!N){ N = V(0, 1, 0).sub(T.clone().multiplyScalar(T.y)).normalize(); }
    else N = N.sub(T.clone().multiplyScalar(N.dot(T))).normalize();     // le repère glisse le long de la courbe, sans se tordre
    const Bn = T.clone().cross(N).normalize(), r = r0 + (r1 - r0) * t;
    for(let j = 0; j <= tour; j++){
      const a = j / tour * Math.PI * 2;
      let k = 1, tn = 1;
      if(plaques){
        const u = a / (Math.PI * 2) * cols, c = Math.floor(u) % cols, fu = u - Math.floor(u);
        const v = t * L / pas[c] + decal[c] * 1.7, row = Math.floor(v), fv = v - row;   // chaque colonne ses plaques, de longueur différente
        const bord = Math.min(1, Math.min(fu, 1 - fu) * 4.5) * Math.min(1, Math.min(fv, 1 - fv) * 3.5);   // 0 au joint, 1 au milieu
        k = 1 + .12 * Math.sqrt(bord) - .045; tn = (.6 + .5 * bord) * tons[(c * 40 + (row % 40 + 40) % 40)];
      }
      const dir = N.clone().multiplyScalar(Math.cos(a)).addScaledVector(Bn, Math.sin(a));
      const p = C.clone().addScaledVector(dir, r * k);
      pos.push(p.x, p.y, p.z); te.push(tn);
    }
  }
  for(let i = 0; i < long; i++) for(let j = 0; j < tour; j++){
    const a = i * (tour + 1) + j, b = a + tour + 1;
    ind.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return {geo: g, courbe, r0, r1};
}
/* le bout coupé d'un morceau : un disque de bois clair, un cerne, le bord de l'écorce */
function boutCoupe(M, {courbe, r1}, fin = 1){
  const P = courbe.getPointAt(fin), T = courbe.getTangentAt(fin).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T);
  M.push({geo: new THREE.CylinderGeometry(r1 * .9, r1 * .9, .004, 12), m: new THREE.Matrix4().compose(P.clone().addScaledVector(T, .002), q, V(1, 1, 1)), c: BOIS_CLAIR});
  M.push({geo: new THREE.TorusGeometry(r1 * .5, r1 * .07, 3, 14), m: new THREE.Matrix4().compose(P.clone().addScaledVector(T, .005), q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), V(1, 1, 1)), c: CERNE});
}
/* le bout cassé : le bois clair au fond, et des échardes qui dépassent */
function boutCasse(M, {courbe, r0}, alea){
  const P = courbe.getPointAt(0), T = courbe.getTangentAt(0).normalize().negate();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T);
  M.push({geo: new THREE.CylinderGeometry(r0 * .95, r0 * .95, .01, 12), m: new THREE.Matrix4().compose(P.clone().addScaledVector(T, -.01), q, V(1, 1, 1)), c: 0xC9A05E});
  const ECHARDE = new THREE.CylinderGeometry(.55, 1, 1, 5, 1);
  for(let k = 0; k < 9; k++){
    const a = k / 9 * Math.PI * 2 + alea() * .4, d = r0 * (k === 8 ? 0 : .35 + alea() * .45), l = .035 + alea() * .07;
    const off = V(Math.cos(a) * d, 0, Math.sin(a) * d).applyQuaternion(q);
    const qq = q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((alea() - .5) * .3, alea() * 3, (alea() - .5) * .3)));
    M.push({geo: ECHARDE, m: new THREE.Matrix4().compose(P.clone().add(off).addScaledVector(T, l / 2 - .012), qq, V(r0 * (.32 + alea() * .2), l, r0 * (.2 + alea() * .15))), c: k % 3 ? BOIS_CLAIR : 0xDDB675});
  }
}

/* ---------- la feuille de chêne : lobée (une onde le long du bord), large ; ses nervures claires ---------- */
const FEUILLE = feuilleGeo(t => Math.pow(Math.sin(Math.PI * Math.pow(t, .82)), .6) * .5 * (.82 + .18 * Math.cos(t * Math.PI * 10 - .8)), 32, .1);   // cinq lobes ronds de chaque côté
const NERVURE_GEO = (() => {                                 // une fine bande, de la queue à la pointe, posée sur la feuille
  const g = new THREE.PlaneGeometry(.022, .9, 1, 1);
  g.translate(0, -.05, 0); g.rotateY(0);
  return g;
})();
function feuille(M, base, dir, face, taille, ton){            // face : de quel côté la feuille regarde
  const Y = dir.clone().normalize(), Z = face.clone().sub(Y.clone().multiplyScalar(face.dot(Y))).normalize(), X = Y.clone().cross(Z).normalize();
  const m = new THREE.Matrix4().makeBasis(X.clone().multiplyScalar(taille), Y.clone().multiplyScalar(taille), Z.clone().multiplyScalar(taille)).setPosition(base.clone().addScaledVector(Y, taille * .5));
  M.push({geo: FEUILLE, m, c: ton});
  /* la nervure du milieu, et trois paires de nervures de côté, un peu au-dessus de la feuille */
  const dessus = Z.clone().multiplyScalar(.004);
  M.push({geo: NERVURE_GEO, m: new THREE.Matrix4().makeBasis(X.clone().multiplyScalar(taille), Y.clone().multiplyScalar(taille), Z.clone().multiplyScalar(taille)).setPosition(base.clone().addScaledVector(Y, taille * .5).add(dessus)), c: NERVURE});
  for(const [t, s] of [[.3, 1], [.3, -1], [.52, 1], [.52, -1], [.72, 1], [.72, -1]]){
    const D = Y.clone().multiplyScalar(.55).addScaledVector(X, s).normalize(), P = base.clone().addScaledVector(Y, taille * t).addScaledVector(D, taille * .12).add(dessus).addScaledVector(Z, taille * .02);
    const Xs = Z.clone().cross(D).normalize();
    M.push({geo: NERVURE_GEO, m: new THREE.Matrix4().makeBasis(Xs.multiplyScalar(taille * .6), D.clone().multiplyScalar(taille * .27), Z.clone().multiplyScalar(taille)).setPosition(P), c: NERVURE});
  }
}

/* ---------- le modèle ---------- */
const CACHE = new Map();
function geos(saison, variante){
  const cle = saison + ":" + variante;
  if(CACHE.has(cle)) return CACHE.get(cle);
  const alea = aleaDe(2207 + variante * 59), bois = [], boisLeger = [], vert = [];
  const ombre = (x, y) => .78 + .32 * Math.min(1, Math.max(0, y / .14));      // le dessous à l'ombre, contre le sol
  /* le gros morceau, de son bout cassé à la fourche */
  const tronc = tube([V(-.36, .095, .02), V(-.14, .09, -.005), V(.06, .078, .01), V(.22, .066, -.01)], .095, .062, alea, {long: 44, tour: 20});
  /* la fourche du bas, qui continue en s'amincissant jusqu'à un bout coupé */
  const bas = tube([V(.15, .06, -.01), V(.24, .052, .02), V(.32, .043, .065), V(.4, .035, .11)], .048, .03, alea, {long: 18, tour: 14});
  /* le rameau qui remonte vers les feuilles */
  const rameau = tube([V(.15, .07, -.015), V(.22, .09, -.035), V(.28, .13, -.06), V(.33, .18, -.075), V(.36, .22, -.08)], .038, .014, alea, {long: 18, tour: 10});
  /* les chicots : un vers le haut à l'arrière, un vers le devant, couché, un petit au bout du rameau */
  const chicots = [tube([V(-.2, .1, -.01), V(-.19, .15, -.03), V(-.175, .2, -.045)], .032, .027, alea, {long: 6, tour: 10}),
    tube([V(-.17, .06, .05), V(-.11, .04, .13), V(-.05, .03, .2)], .03, .025, alea, {long: 8, tour: 10}),
    tube([V(.335, .17, -.07), V(.33, .2, -.03), V(.325, .22, -.01)], .012, .011, alea, {long: 3, tour: 6, plaques: false})];
  for(const t of [tronc, bas, rameau, ...chicots]) bois.push({geo: t.geo, m: new THREE.Matrix4(), c: ECORCE, ombre});
  boutCasse(bois, tronc, alea);
  boutCoupe(bois, bas);
  chicots.forEach(c => boutCoupe(bois, c));
  /* le noeud rond, sur le côté : un bourrelet d'écorce et son creux */
  const K = V(.02, .07, .07);
  bois.push({geo: new THREE.SphereGeometry(.036, 10, 6), m: new THREE.Matrix4().compose(K.clone().add(V(0, 0, -.018)), new THREE.Quaternion(), V(1, 1, .7)), c: ECORCE, ombre});
  bois.push({geo: new THREE.TorusGeometry(.028, .012, 6, 14), m: new THREE.Matrix4().compose(K, new THREE.Quaternion().setFromEuler(new THREE.Euler(-.15, 0, 0)), V(1, 1, 1)), c: ECORCE_C, ombre});
  bois.push({geo: new THREE.SphereGeometry(.02, 8, 5), m: new THREE.Matrix4().compose(K.clone().add(V(0, 0, -.006)), new THREE.Quaternion(), V(1, 1, .5)), c: 0x8A5428, ombre});
  /* de loin : les mêmes morceaux, sans plaques ni échardes */
  for(const [pts, a, b] of [[[V(-.36, .078, .02), V(.06, .066, .01), V(.22, .056, -.01)], .075, .05], [[V(.2, .056, -.008), V(.39, .036, .1)], .045, .03],
    [[V(.2, .062, -.012), V(.33, .16, -.07), V(.36, .22, -.08)], .03, .014]])
    boisLeger.push({geo: tube(pts, a, b, alea, {long: 5, tour: 7, plaques: false}).geo, m: new THREE.Matrix4(), c: ECORCE, ombre});
  /* les deux feuilles, au bout du rameau : l'une monte, l'autre part sur le côté (l'hiver, sèches et brunes) */
  const tons = saison === "ete" || saison === "printemps" ? [0x96C83E, 0x88BC36, 0xAED24C] : tonsFeuilles(saison, variante % 3);
  bois.push({geo: tube([V(.34, .19, -.075), V(.36, .26, -.11), V(.37, .3, -.14)], .006, .004, alea, {long: 3, tour: 5, plaques: false}).geo, m: new THREE.Matrix4(), c: 0x7A8A2A});
  feuille(vert, V(.37, .29, -.14), V(.08, .92, -.38), V(.2, .35, 1), .3, tons[0]);
  feuille(vert, V(.36, .2, -.08), V(.95, .22, .12), V(-.1, 1, .45), .28, tons[2 % tons.length]);
  const r = {bois: fusionner(bois), boisLeger: fusionner(boisLeger), feuilles: fusionner(vert)};
  CACHE.set(cle, r);
  return r;
}
/* La branche de chêne au sol : saison, r (son tirage : nuance des feuilles) */
export function brancheModele(saison, r = 0){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, variante), g = new THREE.Group();
  const pres = new THREE.Group(), loin = new THREE.Group();
  pres.add(mesh(G.bois, MAT_BOIS)); loin.add(mesh(G.boisLeger, MAT_BOIS));
  g.add(presLoin(pres, loin, LOIN));
  g.add(mesh(G.feuilles, MAT_PLAT, false));
  g.userData.branche = {saison};
  return g;
}
