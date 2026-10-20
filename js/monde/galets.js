/* ================= Les galets de plage =================
   Un petit groupe de galets sur le sable (étape 2.1, morceau 3 ; son image : Yo, 20 octobre 2026), au plus près de l'image :
   un petit monticule de sable doré (celui de la plage de l'île, pour ne pas faire tache) au bord irrégulier, grenu (des grains plus clairs, d'autres plus sombres) ; posés dessus,
   un gros galet gris derrière, un galet beige devant à gauche, un petit galet gris à droite, lisses et arrondis comme des
   oeufs aplatis, la pierre piquetée de petits points, traversée de fines veines claires qui courent en courbes ; autour,
   de tout petits cailloux ronds gris, beiges et ocre à demi enfoncés dans le sable.
   Décidé par Yo (20 octobre 2026) : un décor seulement, on marche au travers, on ne les ramasse pas ; une vingtaine de
   groupes sur les plages, surtout au bord de l'eau et près des pierres (ile.js). Ils ne changent pas avec les saisons ;
   quand il neige, un peu de neige sur le dessus des galets.
   Pour le téléphone : un modèle par (nuance, neige), partagé ; un modèle léger quand il est petit à l'écran (presLoin). */
import { fusionner } from "./formes.js";
import { aleaDe, NEIGE_GEO, MAT_BOIS, mesh, presLoin } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion();
const LOIN = 6;
const SABLE = new THREE.Color(0xE9CB7C), SABLE_CLAIR = new THREE.Color(0xF7E6AE), SABLE_SOMBRE = new THREE.Color(0xC9A458);   // le sable de la plage de l'île, un peu plus doré
/* les trois galets : [centre x, z, demi-longueur, demi-hauteur, demi-largeur, tour, couleur, couleur des veines] */
const GALETS = [
  [.03, -.07, .27, .18, .19, .25, 0x8F8F97, 0xE2D9C8],
  [-.15, .11, .21, .135, .15, -.35, 0xD9B98F, 0xF4E6CE],
  [.21, .1, .15, .11, .125, .15, 0x9194A0, 0xDCD6CA]
];
const SABLE_R = .4;                                     // le monticule fait environ 0,8 P de large

/* un petit hasard fixe selon un point (les grains, les points de la pierre) */
const bruit = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const cT = new THREE.Color();

/* le monticule de sable : des anneaux, son bord irrégulier, un peu bombé au milieu ; la couleur grain par grain */
function monticule(n, anneaux){
  const pos = [], ind = [];
  const bord = a => SABLE_R * (1 + .07 * Math.sin(3 * a + .6) + .045 * Math.sin(7 * a + 1.9) + .02 * Math.sin(13 * a));
  pos.push(0, .084, 0);
  for(let r = 1; r <= anneaux; r++) for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2, t = r / anneaux, R = bord(a) * t;
    pos.push(Math.cos(a) * R, .08 * (1 - t * t) + .004, Math.sin(a) * R * .8);
  }
  for(let k = 0; k < n; k++) ind.push(0, 1 + (k + 1) % n, 1 + k);
  for(let r = 1; r < anneaux; r++) for(let k = 0; k < n; k++){
    const a = 1 + (r - 1) * n + k, b = 1 + (r - 1) * n + (k + 1) % n, c = a + n, d = b + n;
    ind.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const MONT = monticule(72, 12), MONT_LEGER = monticule(14, 3);
const couleurSable = (x, y, z) => {
  const b = bruit(x, y, z);
  cT.copy(SABLE).lerp(b > .8 ? SABLE_CLAIR : SABLE_SOMBRE, b > .8 ? (b - .8) * 3.5 : b < .18 ? (.18 - b) * 3 : 0);
  return cT.multiplyScalar(.9 + .14 * Math.min(1, y / .07));   // le pied du monticule un peu à l'ombre
};

/* une veine : un fin ruban clair posé sur le galet, le long de la courbe où un plan coupe la boule unité (n, d), qui ondule
   (o, p) ; en coordonnées du monde (le galet : centre, q, taille) ; seulement la part au-dessus du sable */
function veineGeo(v, centre, q, taille, w, n = 64){
  const N = v.n, u = V(0, 1, 0).cross(N); if(u.lengthSq() < 1e-4) u.set(1, 0, 0); u.normalize();
  const vv = N.clone().cross(u), r = Math.sqrt(1 - v.d * v.d), pts = [];
  for(let k = 0; k <= n; k++){
    const t = v.t0 + k / n * v.arc, P = N.clone().multiplyScalar(v.d + .16 * Math.sin(t * v.o + v.p) + .025 * Math.sin(t * 4.1 + v.p * 2)).addScaledVector(u, r * Math.cos(t)).addScaledVector(vv, r * Math.sin(t)).normalize();
    pts.push(P);
  }
  const pos = [], nor = [], ind = [];
  pts.forEach((P, k) => {
    const T = pts[Math.min(n, k + 1)].clone().sub(pts[Math.max(0, k - 1)]).normalize(), S = T.clone().cross(P).normalize();
    const e = w * (.35 + .9 * Math.sin(Math.PI * k / n)) * (.8 + .4 * Math.sin(k * .7 + v.p));    // plus fine aux deux bouts
    for(const sg of [-1, 1]){
      const Q2 = P.clone().addScaledVector(S, sg * e).normalize().multiplyScalar(1.01);
      const W = V(Q2.x * taille.x, Q2.y * taille.y, Q2.z * taille.z).applyQuaternion(q).add(centre);
      const Nn = V(Q2.x / taille.x, Q2.y / taille.y, Q2.z / taille.z).applyQuaternion(q).normalize();
      pos.push(W.x, W.y, W.z); nor.push(Nn.x, Nn.y, Nn.z);
    }
  });
  for(let k = 0; k < n; k++){
    const a = k * 2;
    if(pos[a * 3 + 1] < .03 && pos[(a + 2) * 3 + 1] < .03) continue;    // sous le sable
    ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(ind);
  return g;
}
/* un galet : une boule aplatie, la pierre à peine piquetée, ses veines claires, le dessous à l'ombre */
const BOULE = new THREE.SphereGeometry(1, 36, 22), BOULE_LEGERE = new THREE.SphereGeometry(1, 12, 8);
const CAILLOU = new THREE.SphereGeometry(1, 8, 5), GRAIN = new THREE.OctahedronGeometry(1, 0);   // pour le téléphone : peu de faces
const ID = new THREE.Matrix4();
function galet(M, [x, z, lx, ly, lz, tour, c, cv], alea, leger, neige){
  const centre = V(x, ly * .78, z), q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), tour), taille = V(lx, ly, lz);
  const base = new THREE.Color(c), ombre = (px, py) => .74 + .34 * Math.min(1, Math.max(0, (py - .01) / (ly * 1.6)));
  M.push({geo: leger ? BOULE_LEGERE : BOULE, m: new THREE.Matrix4().compose(centre, q, taille),
    couleur: (px, py, pz) => { const b = bruit(px * 3, py * 3, pz * 3); return cT.copy(base).multiplyScalar(b > .96 ? .9 : .97 + b * .05); }, ombre});
  /* deux ou trois veines qui courent en courbes, comme sur l'image */
  const nv = 2 + (alea() < .5 ? 1 : 0);
  for(let k = 0; k < nv; k++){
    /* le plan est presque debout : la veine passe par-dessus le galet, d'un flanc à l'autre (t de 0 à π : du flanc au sommet
       puis à l'autre flanc), là où on la voit */
    const a = k * 1.15 + alea() * .6;
    const v = {n: V(Math.cos(a), (alea() - .5) * 1.1, Math.sin(a)).normalize(), d: (k - (nv - 1) / 2) * .38 + (alea() - .5) * .15,
      o: 1 + Math.floor(alea() * 2), p: alea() * 6, t0: .05, arc: Math.PI - .1};
    if(!leger) M.push({geo: veineGeo(v, centre, q, taille, .036), m: ID, c: new THREE.Color(c).lerp(new THREE.Color(cv), .62).getHex(), ombre});
  }
  if(neige){
    const qn = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), tour);
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, ly * 1.5, z), qn, V(lx * .55, ly * .32, lz * .55)), c: 0xF4F8FA});
  }
}
/* les tout petits cailloux à demi enfoncés dans le sable */
const PETITS = [0xA8A6A6, 0xD4BC94, 0xE09A3C, 0xBDB2A0];
function petits(M, alea){
  for(let k = 0; k < 26; k++){
    const a = alea() * Math.PI * 2, d = .16 + alea() * .22, r = .012 + alea() * .016;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * .8;
    if(d > SABLE_R * .97 || GALETS.some(([gx, gz, lx, , lz]) => Math.hypot((x - gx) / (lx + .03), (z - gz) / (lz + .03)) < 1)) continue;
    M.push({geo: CAILLOU, m: new THREE.Matrix4().compose(V(x, .08 * (1 - (d / SABLE_R) ** 2) + r * .2, z), Q, V(r * 1.15, r * .75, r)), c: PETITS[k % 4],
      ombre: (px, py) => .82 + py * 2});
  }
  /* le grain du sable : de tout petits grains plus clairs ou plus sombres, plus serrés vers le bord */
  for(let k = 0; k < 170; k++){
    const a = alea() * Math.PI * 2, d = SABLE_R * Math.sqrt(.25 + alea() * .75), r = .006 + alea() * .007;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * .8;
    if(GALETS.some(([gx, gz, lx, , lz]) => Math.hypot((x - gx) / lx, (z - gz) / lz) < 1)) continue;
    M.push({geo: GRAIN, m: new THREE.Matrix4().compose(V(x, .08 * (1 - (d / SABLE_R) ** 2) + .002, z), Q, V(r, r * .6, r)), c: alea() < .5 ? 0xFAEDC0 : 0xBE9A50});
  }
}
const CACHE = new Map();
function geos(variante, neige){
  const cle = variante + ":" + (neige ? 1 : 0);
  if(!CACHE.has(cle)){
    const fait = leger => {
      const alea = aleaDe(6007 + variante * 53), M = [{geo: leger ? MONT_LEGER : MONT, m: new THREE.Matrix4(), couleur: couleurSable}];
      for(const g of GALETS) galet(M, g, alea, leger, neige);
      if(!leger) petits(M, alea);
      return fusionner(M);
    };
    CACHE.set(cle, {pres: fait(false), loin: fait(true)});
  }
  return CACHE.get(cle);
}
/* Un groupe de galets : r, son tirage (nuance, taille, sens) ; neige : il neige */
export function galetsModele(r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(variante, neige), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_BOIS), mesh(G.loin, MAT_BOIS), LOIN));
  g.rotation.y = r * Math.PI * 2;
  g.scale.setScalar(.92 + r * .16);
  g.userData.galets = {neige};
  return g;
}
