/* ================= Les plantes du bord de l'étang =================
   Au bord de l'étang et des mares (l'image de Yo, « Le bord de l'étang », 21 octobre 2026 ; morceau 3 du bord de l'étang),
   au plus près de l'image, trois plantes, un décor seulement (choix de Yo : le nénuphar se cueille au Marais) :
   - les massettes : une touffe de longues feuilles droites en lanières, qui s'ouvrent en éventail et dont le bout retombe,
     et trois tiges qui portent chacune un gros épi brun velouté, arrondi aux deux bouts, et sa pointe jaune ;
   - les petites plantes de la berge : une rosette de larges feuilles pointues, vert-jaune, qui s'ouvrent vers l'extérieur ;
   - les feuilles de nénuphar : de grandes feuilles rondes posées à plat sur l'eau, fendues d'une encoche jusqu'au milieu,
     leurs nervures plus claires qui rayonnent du centre, le bord un peu relevé, et quelques gouttes d'eau.
   Comme dans la vraie nature : la massette sort de nouvelles feuilles au printemps, porte ses épis l'été, jaunit en
   automne ; l'hiver, ses feuilles sèches et ses épis bruns qui s'effilochent en duvet blanc ; les petites plantes
   jaunissent en automne et ne sont plus que quelques feuilles brunies l'hiver ; les feuilles de nénuphar montent au
   printemps (petites), couvrent l'eau l'été, jaunissent en automne et disparaissent l'hiver.
   Pour le téléphone : chaque plante est une forme partagée (par saison et nuance), dessinée en série avec ses voisines
   (ile.js : un seul dessin pour toutes les massettes d'une nuance, etc.) ; les feuilles bougent au vent. */
import { fusionner, feuillageMat, toon } from "./formes.js";
import { aleaDe } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const MAT_BERGE = feuillageMat({}, .15, .45);         // les feuilles et les épis ondulent, le haut plus que le pied
export const MAT_NENUPHAR = toon({vertexColors: true, side: THREE.DoubleSide});

/* une feuille en lanière : longue de 1, la base en (0, 0, 0), qui monte puis se courbe vers +z (plie : l'angle total) ;
   pliée le long de sa nervure ; forme : la largeur le long de la feuille (t de 0 à 1) ; teinte : le pied à l'ombre */
function lanierGeo(T, large, plie, forme){
  const pos = [], te = [], ind = [];
  let y = 0, z = 0, sPrec = 0;
  T.forEach(t => {
    const phi = plie * Math.pow(t, 1.6), ds = t - sPrec; sPrec = t;
    y += Math.cos(phi) * ds; z += Math.sin(phi) * ds;
    const w = large * forme(t), ny = -Math.sin(phi), nz = Math.cos(phi), clair = .7 + .45 * t;
    pos.push(-w, y + ny * w * .45, z + nz * w * .45, 0, y, z, w, y + ny * w * .45, z + nz * w * .45);
    te.push(clair, clair * .84, clair);
  });
  for(let k = 0; k < T.length - 1; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const RANGS = [0, .12, .25, .38, .5, .62, .73, .83, .91, .97, 1];
const pointe = t => t < .75 ? .75 + .25 * Math.min(1, t * 4) : Math.max(0, (1 - t) / .25) ** .7;     // une lanière qui finit en pointe
const lanceole = t => Math.sin(Math.PI * Math.min(1, t * 1.05)) ** .8 * (t < .15 ? .5 + t * 3.3 : 1);   // large au milieu, pointue au bout
const LANIERE = [lanierGeo(RANGS, .05, .35, pointe), lanierGeo(RANGS, .055, .8, pointe), lanierGeo(RANGS, .055, 1.4, pointe)];
const SECHE = lanierGeo(RANGS, .05, 2.4, pointe);                                     // l'hiver : une feuille sèche cassée, qui pend
const LARGE = [lanierGeo(RANGS, .14, .9, lanceole), lanierGeo(RANGS, .16, 1.5, lanceole)];

/* un épi de massette : un cylindre velouté arrondi aux deux bouts (un tour), autour de l'axe y, de 0 à 1 */
const EPI = new THREE.LatheGeometry([[0, 0], [.42, .02], [.78, .07], [.95, .15], [1, .3], [1, .7], [.95, .85], [.78, .93], [.42, .98], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
const TIGE = new THREE.CylinderGeometry(.5, .6, 1, 6, 1); TIGE.translate(0, .5, 0);
const POINTE = new THREE.CylinderGeometry(.25, .5, 1, 6, 1); POINTE.translate(0, .5, 0);
const DUVET = new THREE.IcosahedronGeometry(1, 1);

const TONS = {
  printemps: {f: [0x8FCB45, 0x7DBB3A, 0xA6D85A], epi: null},
  ete:       {f: [0x7DBB34, 0x6AA82C, 0x96C83F], epi: 0x8A4A22, pointe: 0xE8C43A},
  automne:   {f: [0xB5A443, 0xA08A3A, 0xC9B256], epi: 0x6E3A1C, pointe: null},
  hiver:     {f: [0xB49A6A, 0xA0875A, 0xC4AE80], epi: 0x5E3418, pointe: null, duvet: true}
};
const PETITES = {
  printemps: [0x9AD24A, 0x84C23E, 0xB0DE60], ete: [0x8CC43A, 0x7AB432, 0xA6D24C],
  automne: [0xC8B848, 0xD8A23E, 0xB89A3A], hiver: [0x9C8A5C, 0x8A7A50, 0xA89466]
};

/* une feuille posée : sa base (pied), sa direction (b : l'angle autour de la touffe), sa pente, sa longueur, son tour */
function poser(M, geo, pied, b, pente, long, larg, c, tour = 0){
  const vers = V(Math.cos(b), 0, Math.sin(b));
  const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(vers, Math.sin(pente)).normalize();
  const X = V(0, 1, 0).cross(vers).normalize().applyAxisAngle(Y, tour), Z = X.clone().cross(Y).normalize();
  M.push({geo, m: new THREE.Matrix4().makeBasis(X.multiplyScalar(long * larg), Y.multiplyScalar(long), Z.multiplyScalar(long)).setPosition(pied), c});
}

/* La touffe de massettes (environ 1,5 P de haut, l'épi le plus haut) */
function massettes(saison, variante){
  const T = TONS[saison] || TONS.ete, alea = aleaDe(8101 + variante * 37), M = [];
  const nf = saison === "printemps" ? 12 : 16, grand = saison === "printemps" ? .75 : 1;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4;
    const pied = V(Math.cos(b) * .09 * Math.sqrt(t), 0, Math.sin(b) * .09 * Math.sqrt(t));
    const casse = saison === "hiver" && alea() < .4;
    poser(M, casse ? SECHE : LANIERE[Math.min(2, Math.floor(t * 3 + alea() * .5))], pied, b, .04 + .32 * t + alea() * .08,
      (1.25 - .55 * t + alea() * .2) * grand * (casse ? .7 : 1), 1, T.f[Math.floor(alea() * 3)], (alea() - .5) * .6);
  }
  if(T.epi){
    /* trois tiges, chacune son épi ; l'été, sa pointe jaune ; l'hiver, l'épi s'effiloche en duvet blanc */
    [[.02, .01, 1.62, .06], [-.11, .05, 1.36, -.12], [.1, -.06, 1.18, .1]].forEach(([x, z, h, pen], k) => {
      const haut = h * (.95 + alea() * .1), q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0).applyAxisAngle(V(0, 1, 0), k * 2.1), pen);
      const dir = V(0, 1, 0).applyQuaternion(q), bas = V(x, 0, z);
      M.push({geo: TIGE, m: new THREE.Matrix4().compose(bas, q, V(.022, haut, .022)), c: 0x7F9A3A, ombre: () => 1});
      const debut = bas.clone().addScaledVector(dir, haut - .36);
      M.push({geo: EPI, m: new THREE.Matrix4().compose(debut, q, V(.065, .32, .065)), couleur: (px, py, pz) => {
        const g = Math.sin(px * 90) * Math.sin(py * 70) * Math.sin(pz * 90);
        return new THREE.Color(T.epi).multiplyScalar(1 + g * .06 + (py - debut.y) * .4);
      }});
      if(T.pointe) M.push({geo: POINTE, m: new THREE.Matrix4().compose(debut.clone().addScaledVector(dir, .31), q, V(.014, .08, .014)), c: T.pointe});
      else M.push({geo: TIGE, m: new THREE.Matrix4().compose(debut.clone().addScaledVector(dir, .31), q, V(.008, .07, .008)), c: 0x8A7A50});
      if(T.duvet) for(let d = 0; d < 7; d++){
        const p = debut.clone().addScaledVector(dir, .05 + alea() * .25).add(V((alea() - .5) * .12, 0, (alea() - .5) * .12)), r = .03 + alea() * .03;
        M.push({geo: DUVET, m: new THREE.Matrix4().compose(p, new THREE.Quaternion(), V(r, r * .8, r)), c: 0xF1EBDC});
      }
    });
  }
  return fusionner(M);
}

/* Une petite plante de la berge (environ 0,4 P de haut) : une rosette de larges feuilles pointues */
function petite(saison, variante){
  const T = PETITES[saison] || PETITES.ete, alea = aleaDe(8311 + variante * 53), M = [];
  const n = saison === "hiver" ? 4 : 8, h = saison === "hiver" ? .22 : saison === "printemps" ? .32 : .4;
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, b = k * 2.39996 + alea() * .5;
    poser(M, LARGE[t < .5 ? 0 : 1], V(Math.cos(b) * .03, 0, Math.sin(b) * .03), b, .25 + .6 * t + alea() * .15,
      h * (1.05 - .3 * t + alea() * .15), 1, T[Math.floor(alea() * 3)], (alea() - .5) * .4);
  }
  return fusionner(M);
}

/* Une feuille de nénuphar (environ 0,5 P de large) : un disque fendu d'une encoche, ses nervures, son bord un peu relevé */
function feuilleNenuphar(R, couleur, bord, alea){
  const pos = [], col = [], ind = [], A = 40, Rg = 5, ouvert = .42, c = new THREE.Color(), cb = new THREE.Color(bord), cn = new THREE.Color(couleur).lerp(new THREE.Color(0xF0F8C0), .35);
  pos.push(0, .012, 0); c.set(couleur); col.push(c.r, c.g, c.b);
  for(let r = 1; r <= Rg; r++) for(let a = 0; a <= A; a++){
    const ang = ouvert / 2 + a / A * (Math.PI * 2 - ouvert), t = r / Rg, rr = R * t * (1 + .03 * Math.sin(ang * 5));
    pos.push(Math.cos(ang) * rr, .012 + .02 * t ** 4, Math.sin(ang) * rr);
    /* les nervures claires qui rayonnent, le bord plus sombre ou jauni */
    const nerv = Math.abs(Math.sin(ang * 7)) < .12 && t < .95 ? 1 : 0;
    c.set(couleur).multiplyScalar(.92 + .12 * (1 - t)); if(t > .8) c.lerp(cb, (t - .8) * 3); if(nerv) c.lerp(cn, .7);
    col.push(c.r, c.g, c.b);
  }
  const ligne = A + 1;
  for(let a = 0; a < A; a++) ind.push(0, 1 + a + 1, 1 + a);
  for(let r = 1; r < Rg; r++) for(let a = 0; a < A; a++){
    const p = 1 + (r - 1) * ligne + a, q = p + ligne;
    ind.push(p, p + 1, q + 1, p, q + 1, q);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const GOUTTE = new THREE.SphereGeometry(1, 8, 6);
function nenuphars(saison, variante){
  const alea = aleaDe(8501 + variante * 61), M = [];
  const tons = {printemps: [0x9CCB3E, 0x6E9A2A], ete: [0x8EC23A, 0x5E8A26], automne: [0xC2B040, 0xA8662C]}[saison];
  if(!tons) return null;
  const n = saison === "printemps" ? 2 : 3, taille = saison === "printemps" ? .62 : 1;
  for(let k = 0; k < n; k++){
    const R = (.26 - k * .05) * taille * (.9 + alea() * .2), a = k * 2.3 + alea(), d = k ? .32 + alea() * .12 : 0;
    const feuille = feuilleNenuphar(R, tons[0], tons[1], alea);
    M.push({geo: feuille, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, 0, Math.sin(a) * d), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), alea() * 6.28), V(1, 1, 1)), couleur: null, c: 0xffffff, garder: true});
    /* quelques gouttes d'eau sur la feuille */
    if(saison === "ete") for(let g = 0; g < 2; g++){
      const ga = alea() * 6.28, gd = R * (.3 + alea() * .4), r = .012 + alea() * .01;
      M.push({geo: GOUTTE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d + Math.cos(ga) * gd, .02, Math.sin(a) * d + Math.sin(ga) * gd), new THREE.Quaternion(), V(r, r * .6, r)), c: 0xE8F6F4});
    }
  }
  return fusionnerCouleurs(M);
}
/* comme fusionner, mais la feuille de nénuphar garde ses propres couleurs de sommets */
function fusionnerCouleurs(M){
  const morceaux = M.map(p => {
    if(!p.garder) return p;
    const C = p.geo.attributes.color, I = p.geo.index;
    return {...p, couleur: undefined, geo: p.geo, _c: C, _i: I};
  });
  const g = fusionner(morceaux.map(p => p._c ? {...p, couleur: null} : p));
  /* reprendre les couleurs des feuilles (fusionner les a mises en blanc) */
  let o = 0;
  const col = g.attributes.color;
  for(const p of morceaux){
    const n = p.geo.index ? p.geo.index.count : p.geo.attributes.position.count;
    if(p._c){
      for(let i = 0; i < n; i++){ const v = p._i ? p._i.getX(i) : i; col.setXYZ(o + i, p._c.getX(v), p._c.getY(v), p._c.getZ(v)); }
    }
    o += n;
  }
  col.needsUpdate = true;
  return g;
}

const CACHE = new Map();
const garde = (cle, fait) => { if(!CACHE.has(cle)) CACHE.set(cle, fait()); return CACHE.get(cle); };
export const NUANCES = 3;
/* les formes partagées : la massette, la petite plante, les feuilles de nénuphar (null l'hiver), par saison et nuance */
export const massetteGeo = (saison, v) => garde("m:" + saison + ":" + v, () => massettes(saison, v));
export const petiteGeo = (saison, v) => garde("p:" + saison + ":" + v, () => petite(saison, v));
export const nenupharGeo = (saison, v) => garde("n:" + saison + ":" + v, () => nenuphars(saison, v));
