/* ================= Le coquelicot =================
   D'après l'image de Yo (22 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image : la touffe de feuilles de la
   pâquerette (paquerette.js) et des feuilles dressées, profondément découpées en lobes, vert franc ; de longues tiges qui
   se courbent ; quatre grandes fleurs en coupe, chacune de quatre larges pétales froissés, rouge vif (ou orangés, ou
   blancs : couleurDe), plus sombres vers le coeur ; au coeur, une couronne d'étamines noires autour d'une petite capsule
   vert olive ; et trois boutons ovales, verts et velus, qui penchent la tête au bout de leur tige en crosse, le rouge des
   pétales qui pointe.
   Comme dans la vraie nature : le coquelicot fleurit du printemps à l'été ; en automne, il ne reste que ses capsules
   sèches au bout des tiges ; c'est une plante annuelle : l'hiver, seulement une petite rosette de jeunes feuilles (les
   graines tombées germent en automne).
   Pour le téléphone : une forme par (saison, état, couleur, nuance), partagée ; un modèle léger au loin ; le vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";
import { MAT_PAQUERETTE, TONS, feuilleGeo, LANIERE, LANIERE_LEGERE, poser, tige, BOULE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const cT = new THREE.Color(), NOIR = 0x1E1A20, OLIVE = 0x8E9A4E, BOUTON = 0x9CB64C;

/* une feuille découpée en lobes profonds, comme une plume */
const decoupee = t => Math.sin(Math.PI * Math.min(1, t * 1.05)) ** .6 * Math.min(1, t * 2.5 + .2) * (.22 + .78 * Math.abs(Math.sin(Math.PI * t * 4.5)) ** .45);
const DECOUPEE = feuilleGeo(Array.from({length: 37}, (_, k) => k / 36), .5, .55, decoupee, 6, .07);

/* un pétale : large, arrondi, un peu creusé, de 0 à 1 le long de +x */
const PETALE = (() => {
  const g = new THREE.SphereGeometry(1, 10, 6); g.scale(.5, .08, .66); g.translate(.5, 0, 0);
  const p = g.attributes.position;
  for(let i = 0; i < p.count; i++){                         // creusé en cuillère et froissé au bord
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, p.getY(i) + .1 * (z / .66) ** 2 + .025 * Math.sin(z * 30 + x * 9) * (x / 1));
  }
  g.computeVertexNormals();
  return g;
})();
const PETALE_LEGER = (() => { const g = new THREE.SphereGeometry(1, 6, 4); g.scale(.5, .08, .56); g.translate(.5, 0, 0); return g; })();
const ETAMINE = new THREE.SphereGeometry(1, 4, 3);

/* une tige courbe : une suite de segments le long d'une courbe de Bézier (pied, contrôle, haut) */
function tigeCourbe(M, p0, p1, p2, vert, n = 6){
  let prec = p0;
  for(let k = 1; k <= n; k++){
    const t = k / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    const p = V(a * p0.x + b * p1.x + c * p2.x, a * p0.y + b * p1.y + c * p2.y, a * p0.z + b * p1.z + c * p2.z);
    tige(M, prec, p, vert); prec = p;
  }
}
/* une fleur ouverte : quatre pétales en coupe (deux dehors, deux dedans), le coeur noir et sa capsule */
function fleur(M, haut, dir, base, leger, alea, taille = 1){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), R = .082 * taille, b = new THREE.Color(base);
  const sombre = b.clone().multiplyScalar(.62);
  [[0, .3, 1], [Math.PI, .3, 1], [Math.PI / 2, .62, .92], [-Math.PI / 2, .62, .92]].forEach(([a, lev, l]) => {
    const qp = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a + (alea() - .5) * .3)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), lev + (alea() - .5) * .15));
    const r = R * l;
    M.push({geo: leger ? PETALE_LEGER : PETALE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .004), qp, V(r, r, r)), couleur: (x, y, z) => {
      const d = Math.hypot(x - haut.x, y - haut.y, z - haut.z) / R;
      return cT.copy(sombre).lerp(b, Math.min(1, d * 2.2)).multiplyScalar(1 + Math.max(0, d - .7) * .12);
    }});
  });
  /* le coeur : la capsule vert olive, et autour sa couronne d'étamines noires */
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .02 * taille), q, V(.016 * taille, .013 * taille, .016 * taille)), c: OLIVE});
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .031 * taille), q, V(.011 * taille, .003 * taille, .011 * taille)), c: 0x5E6634});
  if(!leger) for(let k = 0; k < 30; k++){
    const a = k / 30 * Math.PI * 2 + alea() * .2, rr = (.021 + alea() * .009) * taille;
    const p = haut.clone().addScaledVector(dir, (.014 + alea() * .006) * taille).add(V(Math.cos(a) * rr, 0, Math.sin(a) * rr).applyQuaternion(q));
    const e = .0068 * taille;
    M.push({geo: ETAMINE, m: new THREE.Matrix4().compose(p, q, V(e, e * 1.3, e)), c: NOIR});
  }
}
/* un bouton : un ovale vert velu, le rouge des pétales qui pointe, la tête penchée (dir vers le bas) */
function bouton(M, haut, dir, base){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .024), q, V(.02, .03, .02)),
    couleur: (x, y, z) => cT.set(BOUTON).multiplyScalar(.9 + .2 * Math.abs(Math.sin(x * 400 + z * 300)))});   // le duvet, en petites taches claires
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .03).add(V(.012, 0, .012).applyQuaternion(q)), q, V(.008, .022, .008)), c: base});
}
/* une capsule sèche (l'automne) : brune, sa petite couronne plate */
function capsule(M, haut, dir){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .018), q, V(.017, .022, .017)), c: 0x9A7A44});
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .038), q, V(.013, .004, .013)), c: 0x6E5430});
}

function touffe(saison, etat, base, variante, leger, neige){
  const tons = TONS[saison] || TONS.printemps, alea = aleaDe(9511 + variante * 41), M = [];
  /* l'hiver : une petite rosette seulement ; une pousse aussi */
  const rosette = etat === 0 || saison === "hiver";
  const nf = rosette ? 8 : leger ? 18 : 40, taille = rosette ? .5 : 1;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4;
    const pied = V(Math.cos(b) * .08 * Math.sqrt(t), 0, Math.sin(b) * .08 * Math.sqrt(t));
    poser(M, (leger ? LANIERE_LEGERE : LANIERE)[Math.min(2, Math.floor(t * 3 + alea() * .5))], pied, b, .02 + .5 * t + alea() * .1,
      (.19 - .07 * t + alea() * .03) * taille, .045 * taille, tons[t < .3 ? 2 : alea() < .6 ? 0 : 1]);
  }
  /* les feuilles découpées, dressées entre les tiges */
  const nd = rosette ? 3 : leger ? 4 : 10;
  for(let k = 0; k < nd; k++){
    const b = k * 2.39996 + .3 + alea() * .4;
    poser(M, DECOUPEE, V(Math.cos(b) * .025, 0, Math.sin(b) * .025), b, (rosette ? .9 : .25) + alea() * .25, (rosette ? .1 : .25 + alea() * .06), rosette ? .07 : .17, tons[alea() < .5 ? 1 : 0]);
  }
  if(neige && !leger) for(const [x, z, r] of [[0, 0, .05], [-.05, .04, .03]])
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, .07, z), new THREE.Quaternion(), V(r, r * .35, r)), c: 0xF4F8FA});
  const vert = tons[1];
  if(etat === 2 && !rosette){
    /* quatre fleurs, tournées vers le haut et vers l'avant, sur leurs tiges courbes */
    [[.0, -.02, .43, 0, 1.1], [-.13, .02, .32, -.5, 1], [.14, .0, .33, .5, 1], [.03, .1, .24, .1, .85]].forEach(([x, z, h, pen, ta]) => {
      const haut = V(x * 1.3, h, z * 1.3 + .02), dir = V(x * 2.2 + pen * .3, 1, 1.05 + z).normalize();
      tigeCourbe(M, V(x * .25, 0, z * .25), V(x * .4, h * .55, z * .4), haut, vert);
      fleur(M, haut, dir, base, leger, alea, ta);
    });
    /* trois boutons penchés au bout de leur tige en crosse */
    if(!leger) [[-.08, -.05, .29, -1], [.07, -.06, .36, 1], [.17, .07, .22, 1]].forEach(([x, z, h, s]) => {
      const sommet = V(x * 1.1, h + .03, z), haut = V(x * 1.1 + s * .03, h - .01, z + .01);
      tigeCourbe(M, V(x * .25, 0, z * .25), V(x * 1.05, h * .7, z), sommet, vert, 5);
      tigeCourbe(M, sommet, V(x * 1.1 + s * .025, h + .035, z), haut, vert, 3);
      bouton(M, haut, V(s * .7, -1, .25).normalize(), base);
    });
  } else if(saison === "automne" && etat > 0 && !rosette){
    /* l'automne : les capsules sèches au bout des tiges */
    [[0, -.02, .4], [-.12, .02, .3], [.13, 0, .31]].forEach(([x, z, h]) => {
      const haut = V(x * 1.3, h, z * 1.3);
      tigeCourbe(M, V(x * .25, 0, z * .25), V(x * .4, h * .55, z * .4), haut, 0x8E8A4A);
      capsule(M, haut, V(x * 2, 1, .3).normalize());
    });
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, couleur, variante, neige){
  const base = couleur === undefined ? 0xE03A2E : couleur, cle = [saison, etat, base, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, base, variante, false, neige), loin: touffe(saison, etat, base, variante, true, neige)});
  return CACHE.get(cle);
}
/* Le coquelicot : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; couleur : celle de ses pétales ;
   r : son tirage (nuance, taille, sens) ; neige : il neige (un peu de neige sur sa rosette, l'hiver) */
export function coquelicotModele(saison, etat, couleur, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, couleur, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;
  g.scale.setScalar(.95 + r * .2);
  g.userData.coquelicot = {saison, etat};
  return g;
}
