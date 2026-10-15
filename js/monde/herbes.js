/* ================= Les herbes hautes =================
   Une touffe d'herbes hautes de l'île (étape 2.1, morceau 3 ; son image : Yo, 15 octobre 2026), au plus près de l'image :
   une touffe serrée, plus large que haute (environ 0,8 P de large, 0,6 P de haut), faite d'une quarantaine de longs brins
   souples, larges, creusés d'un pli au milieu, qui montent puis retombent vers l'extérieur, leur pointe arrondie ; ceux
   du coeur plus hauts et plus droits, ceux du bord plus courts et plus penchés ; jaune-vert, la pointe plus claire, le
   pied à l'ombre. Elles suivent la saison et le vent ; cueillies, elles sont rases (des brins courts et droits, coupés
   net) ; jeunes (plantées), plus petites.
   Pour le téléphone : un modèle par (saison, état, nuance), partagé ; au-delà de LOIN P du personnage, un modèle léger. */
import { fusionner, feuillageMat } from "./formes.js";
import { aleaDe, mesh, presLoin } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 6;
const TONS = {
  printemps: [0x86C84A, 0x72B640, 0x9CD85C],
  ete:       [0x98BE30, 0x80A428, 0xB2CE40],
  automne:   [0xC6A84A, 0xAE9040, 0xD4BA5A],
  hiver:     [0xA8B89E, 0x98AA90, 0xB4C2AA]
};
const MAT = feuillageMat({}, 0, 2.6);                       // les brins ondulent au vent, la pointe plus que le pied

/* un brin : une longue bande pliée en son milieu (le pli se voit, plus sombre), qui monte puis se courbe vers l'extérieur
   comme une crosse (sa pointe arrondie finit par regarder vers le bas : plie, en radians, l'angle total de la courbe) ;
   long de 1, la base en (0, 0, 0), l'extérieur vers +z ; teinte : le pied à l'ombre, la pointe claire */
function lameGeo(T, large, plie){
  const pos = [], te = [], ind = [];
  let y = 0, z = 0, sPrec = 0;
  T.forEach(t => {
    /* le long du brin, l'angle grandit de plus en plus vite (droit au pied, courbé vers le bout) */
    const phi = plie * Math.pow(t, 1.8), ds = t - sPrec; sPrec = t;
    y += Math.cos(phi) * ds; z += Math.sin(phi) * ds;
    const w = large * (t < .7 ? .8 + .2 * Math.min(1, t * 3) : Math.sqrt(Math.max(0, 1 - ((t - .7) / .3) ** 2)));
    const ny = -Math.sin(phi), nz = Math.cos(phi), clair = .66 + .5 * t;   // le côté du pli, qui suit la courbe
    pos.push(-w, y + ny * w * .5, z + nz * w * .5, 0, y, z, w, y + ny * w * .5, z + nz * w * .5);
    te.push(clair, clair * .82, clair);
  });
  for(let k = 0; k < T.length - 1; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const RANGS = [0, .2, .38, .54, .67, .78, .87, .94, 1], RANGS_LEGERS = [0, .4, .72, 1];
const LAME = [lameGeo(RANGS, .085, .9), lameGeo(RANGS, .095, 1.5), lameGeo(RANGS, .1, 2.1)];   // du coeur au bord : de plus en plus courbés
const LAME_LEGERE = [lameGeo(RANGS_LEGERS, .1, 1.0), lameGeo(RANGS_LEGERS, .105, 1.6), lameGeo(RANGS_LEGERS, .11, 2.2)];
/* un brin coupé : court, droit, coupé net (une fois cueillies) */
const COUPE = lameGeo([0, .5, 1], .09, .15);

/* la touffe : un coeur de brins hauts et droits, puis des rangs de plus en plus courts et penchés vers l'extérieur */
function touffe(tons, alea, n, lame, etat){
  const M = [];
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, b = k * 2.39996 + alea() * .5, vers = V(Math.cos(b), 0, Math.sin(b));
    let h, pente;
    if(etat === "rase"){ h = .12 + alea() * .1; pente = alea() * .25; }
    else { h = .86 - .4 * t + alea() * .14; pente = .02 + .3 * t + alea() * .1; }   // t : du coeur (haut, droit) au bord (court, penché) ; chaque brin monte puis retombe
    const pied = V(Math.cos(b) * .2 * Math.sqrt(t), 0, Math.sin(b) * .2 * Math.sqrt(t));
    const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(vers, Math.sin(pente)).normalize();
    const X = V(0, 1, 0).cross(vers).normalize().applyAxisAngle(Y, (alea() - .5) * .5), Z = X.clone().cross(Y).normalize();
    const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(h * (.85 + alea() * .3)), Y.multiplyScalar(h), Z.multiplyScalar(h)).setPosition(pied);
    const ton = alea();
    M.push({geo: etat === "rase" ? COUPE : lame[Math.min(2, Math.floor(t * 3 + alea() * .6))], m, c: tons[t < .3 ? (ton < .5 ? 2 : 0) : ton < .55 ? 0 : ton < .85 ? 1 : 2]});
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, variante){
  const cle = [saison, etat, variante].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const tons = TONS[saison] || TONS.ete;
  const r = {pres: touffe(tons, aleaDe(331 + variante * 71), etat === "rase" ? 22 : 46, LAME, etat),
    loin: touffe(tons, aleaDe(331 + variante * 71), etat === "rase" ? 8 : 15, LAME_LEGERE, etat)};
  CACHE.set(cle, r);
  return r;
}
/* Une touffe d'herbes hautes : saison ; etat : "haute", "rase" (cueillie) ou "jeune" (plantée, pas encore grande) ;
   r : son tirage (nuance, taille) */
export function herbesModele(saison, etat = "haute", r = 0){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat === "rase" ? "rase" : "haute", variante), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT, false), mesh(G.loin, MAT, false), LOIN));
  g.scale.setScalar((etat === "jeune" ? .55 : 1) * (.9 + r * .25));
  g.userData.herbes = {saison, etat};
  return g;
}
