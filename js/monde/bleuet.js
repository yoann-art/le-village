/* ================= Le bleuet =================
   D'après l'image de Yo (22 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image : la touffe de feuilles de la
   pâquerette (paquerette.js), et des feuilles étroites dressées, quelques-unes découpées ; de longues tiges fines ;
   quatre fleurs bleu vif (ou roses, ou blanches : couleurDe), chacune une couronne de petits entonnoirs qui s'ouvrent
   en dents (deux rangs), au coeur des étamines violettes au bout rose autour d'un coeur violet sombre, la fleur posée
   sur sa coupe verte faite d'écailles ; et trois boutons : de petites coupes d'écailles, le bleu qui pointe au bout.
   Comme dans la vraie nature : une plante annuelle, en fleur au printemps et en été ; en automne, ses têtes sèches
   d'écailles brunies au bout des tiges ; l'hiver, une petite rosette de jeunes feuilles.
   Pour le téléphone : une forme par (saison, état, couleur, nuance), partagée ; un modèle léger au loin ; le vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";
import { MAT_PAQUERETTE, TONS, feuilleGeo, LANIERE, LANIERE_LEGERE, poser, tige, BOULE, TIGE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const cT = new THREE.Color(), VIOLET = 0x3A1E6E, ETAMINE = 0x5A2E9A, BOUT = 0xB27ADC, ECAILLE = 0x8EAE4A, SEC = 0x9A8450;

/* les feuilles étroites et pointues, et quelques-unes découpées */
const etroite = t => Math.sin(Math.PI * Math.min(1, t * 1.03)) ** .5 * Math.min(1, t * 3 + .2);
const ETROITE = feuilleGeo(Array.from({length: 17}, (_, k) => k / 16), .5, .5, etroite, 6, .1);
const decoupee = t => etroite(t) * (.35 + .65 * Math.abs(Math.sin(Math.PI * t * 3.5)) ** .5);
const DECOUPEE = feuilleGeo(Array.from({length: 29}, (_, k) => k / 28), .5, .45, decoupee, 6, .08);

/* un fleuron : un petit entonnoir aplati qui s'élargit vers le bout, terminé par quatre dents (de 0 à 1 le long de +x) */
const FLEURON = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -.07); s.lineTo(.72, -.34);
  [[1, -.3], [.84, -.18], [1, -.08], [.85, .03], [1, .14], [.84, .24], [1, .32]].forEach(([x, y]) => s.lineTo(x, y));
  s.lineTo(.72, .36); s.lineTo(0, .07); s.closePath();
  const g = new THREE.ShapeGeometry(s, 3); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for(let i = 0; i < p.count; i++){ const x = p.getX(i), z = p.getZ(i); p.setY(i, .1 * (z / .36) ** 2 * x); }   // un peu creusé, comme un entonnoir ouvert
  g.computeVertexNormals();
  return g;
})();

/* la coupe d'écailles sous la fleur (ou le bouton) : un ovale, ses écailles en petites taches plus sombres et plus claires */
function coupe(M, centre, q, sx, sy, couleur){
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(centre, q, V(sx, sy, sx)), couleur: (x, y, z) => {
    const a = Math.atan2(z - centre.z, x - centre.x), h = (y - centre.y) / sy;
    const e = Math.sin(a * 6 + h * 5) * Math.sin(h * 9);                   // les écailles en quinconce
    return cT.set(couleur).multiplyScalar(.86 + .2 * (e > .2 ? 1 : 0));
  }});
}
/* une fleur : deux rangs de fleurons, le coeur et ses étamines, sur la coupe d'écailles */
function fleur(M, haut, dir, base, leger, alea, taille = 1){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), R = .072 * taille, b = new THREE.Color(base);
  coupe(M, haut.clone().addScaledVector(dir, -.012 * taille), q, .02 * taille, .024 * taille, ECAILLE);
  [[leger ? 7 : 9, 1.15, .2], [leger ? 0 : 6, .8, .65]].forEach(([n, l, lev], r) => {
    for(let k = 0; k < n; k++){
      const a = (k + r * .5) / n * Math.PI * 2 + alea() * .15;
      const qp = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), lev + (alea() - .5) * .2));
      const s = R * l * (.9 + alea() * .2);
      M.push({geo: FLEURON, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .004 + r * .006), qp, V(s, s, s)),
        couleur: (x, y, z) => cT.copy(b).multiplyScalar(.62 + .45 * Math.min(1, Math.hypot(x - haut.x, y - haut.y, z - haut.z) / (R * 1.1)))});
    }
  });
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .01 * taille), q, V(.016 * taille, .009 * taille, .016 * taille)), c: VIOLET});
  if(!leger) for(let k = 0; k < 14; k++){
    const a = k / 14 * Math.PI * 2 + alea() * .3, ouv = .25 + alea() * .3;
    const d = V(Math.cos(a) * Math.sin(ouv), Math.cos(ouv), Math.sin(a) * Math.sin(ouv)).applyQuaternion(q), l = (.026 + alea() * .01) * taille;
    const pied = haut.clone().addScaledVector(dir, .01 * taille);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(pied, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), V(.0028 * taille, l, .0028 * taille)), c: ETAMINE});
    const e = .0034 * taille;
    M.push({geo: BOULE, m: new THREE.Matrix4().compose(pied.clone().addScaledVector(d, l), q, V(e, e, e)), c: BOUT});
  }
}
/* un bouton : la coupe d'écailles, plus haute, et le bleu qui pointe au bout */
function bouton(M, haut, dir, base){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  coupe(M, haut.clone().addScaledVector(dir, .02), q, .02, .027, ECAILLE);
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .044), q, V(.014, .012, .014)), c: base});
}

function touffe(saison, etat, base, variante, leger, neige){
  const tons = TONS[saison] || TONS.printemps, alea = aleaDe(9711 + variante * 43), M = [];
  const rosette = etat === 0 || saison === "hiver";
  const nf = rosette ? 8 : leger ? 18 : 40, taille = rosette ? .5 : 1;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4;
    const pied = V(Math.cos(b) * .08 * Math.sqrt(t), 0, Math.sin(b) * .08 * Math.sqrt(t));
    poser(M, (leger ? LANIERE_LEGERE : LANIERE)[Math.min(2, Math.floor(t * 3 + alea() * .5))], pied, b, .02 + .5 * t + alea() * .1,
      (.19 - .07 * t + alea() * .03) * taille, .045 * taille, tons[t < .3 ? 2 : alea() < .6 ? 0 : 1]);
  }
  /* les feuilles étroites dressées entre les tiges, quelques-unes découpées */
  const nd = rosette ? 3 : leger ? 4 : 10;
  for(let k = 0; k < nd; k++){
    const b = k * 2.39996 + .5 + alea() * .4;
    poser(M, k % 3 === 0 ? DECOUPEE : ETROITE, V(Math.cos(b) * .025, 0, Math.sin(b) * .025), b, (rosette ? .9 : .2) + alea() * .25, rosette ? .1 : .23 + alea() * .07, rosette ? .05 : .085, tons[alea() < .5 ? 1 : 0]);
  }
  if(neige && !leger) for(const [x, z, r] of [[0, 0, .05], [-.05, .04, .03]])
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, .07, z), new THREE.Quaternion(), V(r, r * .35, r)), c: 0xF4F8FA});
  const vert = tons[1];
  if(etat === 2 && !rosette){
    /* quatre fleurs, tournées vers le haut et vers l'avant */
    [[.0, -.03, .42, 0, 1.1], [-.15, .0, .33, -.5, 1], [.16, .01, .31, .5, 1], [.05, .1, .25, .1, .9]].forEach(([x, z, h, pen, ta]) => {
      const haut = V(x * 1.3, h, z * 1.3 + .02), dir = V(x * 2.2 + pen * .3, 1, 1 + z).normalize();
      tige(M, V(x * .25, 0, z * .25), haut, vert);
      fleur(M, haut, dir, base, leger, alea, ta);
    });
    /* trois boutons */
    if(!leger) [[-.2, -.02, .24], [.1, -.06, .37], [-.04, .05, .28]].forEach(([x, z, h]) => {
      const haut = V(x, h, z);
      tige(M, V(x * .25, 0, z * .25), haut, vert);
      bouton(M, haut, V(x * 2, 1, .4).normalize(), base);
    });
  } else if(saison === "automne" && etat > 0 && !rosette){
    /* l'automne : les têtes sèches d'écailles brunies */
    [[0, -.02, .4], [-.13, .02, .31], [.14, 0, .3]].forEach(([x, z, h]) => {
      const haut = V(x * 1.3, h, z * 1.3);
      tige(M, V(x * .25, 0, z * .25), haut, 0x8E8A4A);
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(x * 2, 1, .3).normalize());
      coupe(M, haut.clone().add(V(0, .015, 0)), q, .019, .024, SEC);
    });
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, couleur, variante, neige){
  const base = couleur === undefined ? 0x3A6FD8 : couleur, cle = [saison, etat, base, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, base, variante, false, neige), loin: touffe(saison, etat, base, variante, true, neige)});
  return CACHE.get(cle);
}
/* Le bleuet : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; couleur : celle de ses fleurons ; r : son
   tirage (nuance, taille, sens) ; neige : il neige (un peu de neige sur sa rosette, l'hiver) */
export function bleuetModele(saison, etat, couleur, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, couleur, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;
  g.scale.setScalar(.95 + r * .2);
  g.userData.bleuet = {saison, etat};
  return g;
}
