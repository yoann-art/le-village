/* ================= Le pissenlit =================
   D'après l'image de Yo (21 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image : la même touffe ronde de
   feuilles épaisses que la pâquerette (paquerette.js), et trois grandes feuilles dressées, dentées en dents de scie
   tournées vers le pied ; une fleur jaune vif en pompon, faite de rangs de fines ligules (les plus longues dehors, plus
   courtes et plus orangées vers le coeur), sur sa collerette de bractées vertes ; sa boule de graines blanche, l'aigrette :
   de fins rayons qui partent d'un coeur brun, chacun avec sa petite houppe blanche au bout ; et un bouton fermé, vert,
   la pointe jaune.
   Comme dans la vraie nature : il fleurit au printemps, puis de nouveau en automne, ses fleurs et ses aigrettes
   ensemble ; le reste de l'année, sa rosette de feuilles dentées reste (plus sombre l'hiver, un peu de neige dessus).
   Pour le téléphone : une forme par (saison, état, nuance), partagée ; un modèle léger au loin ; il bouge un peu au vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";
import { MAT_PAQUERETTE, TONS, feuilleGeo, RANGS, LANIERE, LANIERE_LEGERE, poser, tige, BOULE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const JAUNE = new THREE.Color(0xF8C818), ORANGE = new THREE.Color(0xF09A10), cT = new THREE.Color();

/* une grande feuille dentée : large au milieu, des dents qui pointent vers le pied (une dent de scie tous les 1/6) */
const dentee = t => {
  const base = Math.sin(Math.PI * Math.min(1, t * 1.02)) ** .7 * Math.min(1, t * 3 + .15);
  const d = (t * 5) % 1;                                   // des lobes arrondis, chacun pointé vers le pied
  return base * (t < .86 ? .55 + .45 * Math.sin(Math.PI * Math.pow(1 - d, .7)) ** .6 : 1);
};
const DENTEE = feuilleGeo(Array.from({length: 41}, (_, k) => k / 40), .5, .5, dentee, 6, .08);

/* une ligule : une fine lanière plate, de 0 à 1 le long de +x */
const LIGULE = (() => { const g = new THREE.SphereGeometry(1, 6, 3); g.scale(.5, .1, .14); g.translate(.5, 0, 0); return g; })();
const BRACTEE = (() => { const g = new THREE.SphereGeometry(1, 5, 3); g.scale(.5, .16, .2); g.translate(.5, 0, 0); return g; })();
const HOUPPE = new THREE.IcosahedronGeometry(1, 0);
const COEUR = new THREE.SphereGeometry(1, 10, 6);

/* la collerette de bractées vertes sous une tête, rabattues vers le bas */
function bractees(M, haut, q, vert, n, R){
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2, qb = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -.75));
    M.push({geo: BRACTEE, m: new THREE.Matrix4().compose(haut, qb, V(R, R, R)), c: vert});
  }
}
/* la fleur : des rangs de ligules, de plus en plus courtes et dressées vers le coeur */
function fleur(M, haut, dir, vert, leger, alea){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), R = .1;
  const rangs = leger ? [[12, 1, .08], [8, .6, .5]] : [[24, 1, -.05], [20, .86, .22], [16, .7, .5], [12, .54, .8], [9, .38, 1.1], [6, .24, 1.35]];
  rangs.forEach(([n, l, lev], r) => {
    for(let k = 0; k < n; k++){
      const a = (k + r * .5) / n * Math.PI * 2 + alea() * .08;
      const qp = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), lev + alea() * .1));
      const lk = R * l * (.92 + alea() * .16);
      M.push({geo: LIGULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .006 + r * .005), qp, V(lk, lk, lk)), c: cT.copy(JAUNE).lerp(ORANGE, r / (rangs.length - 1) * .7).getHex()});
    }
  });
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .02), q, V(.016, .01, .016)), c: ORANGE.getHex()});
  bractees(M, haut.clone().addScaledVector(dir, -.004), q, vert, leger ? 6 : 12, .032);
}
/* l'aigrette : de fins rayons depuis un coeur brun, chacun sa houppe blanche */
function aigrette(M, haut, dir, vert, leger, alea){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), R = .095, centre = haut.clone().addScaledVector(dir, .02);
  M.push({geo: COEUR, m: new THREE.Matrix4().compose(centre, q, V(.026, .026, .026)), c: 0xA67A48});
  const n = leger ? 26 : 90;
  for(let k = 0; k < n; k++){
    /* des directions réparties sur la sphère (spirale), sauf tout en bas, où est la tige */
    const y = 1 - (k + .5) / n * 1.75, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = k * 2.39996;
    const d = V(Math.cos(a) * rr, y, Math.sin(a) * rr).applyQuaternion(q).normalize();
    const bout = centre.clone().addScaledVector(d, R * (.95 + alea() * .08));
    if(!leger) M.push({geo: tigeGeo, m: new THREE.Matrix4().compose(centre, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), V(.0018, R, .0018)), c: 0xEDE2C8});
    const h = .013 + alea() * .004;
    M.push({geo: HOUPPE, m: new THREE.Matrix4().compose(bout, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d), V(h, h * .35, h)), c: alea() < .8 ? 0xFBF8F0 : 0xF0EADC});
  }
  bractees(M, haut, q, vert, leger ? 5 : 10, .028);
}
const tigeGeo = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 4, 1); g.translate(0, .5, 0); return g; })();
/* le bouton fermé : vert, la pointe jaune, ses bractées */
function bouton(M, haut, dir, vert){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .025), q, V(.024, .034, .024)),
    couleur: (x, y, z) => cT.set(vert).lerp(JAUNE, Math.min(1, Math.max(0, (y - haut.y - .045) / .014)))});
  bractees(M, haut, q, vert, 7, .026);
}

function touffe(saison, etat, variante, leger, neige){
  const tons = TONS[saison] || TONS.printemps, alea = aleaDe(9311 + variante * 37), M = [];
  const nf = etat === 0 ? 6 : leger ? 18 : 44, taille = etat === 0 ? .55 : 1;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4;
    const pied = V(Math.cos(b) * .08 * Math.sqrt(t), 0, Math.sin(b) * .08 * Math.sqrt(t));
    poser(M, (leger ? LANIERE_LEGERE : LANIERE)[Math.min(2, Math.floor(t * 3 + alea() * .5))], pied, b, .02 + .5 * t + alea() * .1,
      (.2 - .08 * t + alea() * .03) * taille, .045 * taille, tons[t < .3 ? 2 : alea() < .6 ? 0 : 1]);
  }
  /* trois grandes feuilles dentées, dressées */
  if(etat > 0) for(let k = 0; k < (leger ? 2 : 3); k++){
    const b = k * 2.2 + .6 + alea() * .4;
    poser(M, DENTEE, V(Math.cos(b) * .02, 0, Math.sin(b) * .02), b, .35 + alea() * .2, .29 + alea() * .04, .17, tons[1]);
  }
  if(neige && etat > 0 && !leger) for(const [x, z, r] of [[0, 0, .09], [-.1, .05, .06], [.09, .07, .06]])
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, .17 - Math.hypot(x, z) * .5, z), new THREE.Quaternion(), V(r, r * .35, r)), c: 0xF4F8FA});
  if(etat === 2){
    const vert = tons[1];
    /* la fleur jaune à gauche, l'aigrette à droite, plus haute ; le bouton à droite, plus bas */
    const hf = V(-.08, .29, .03), df = V(-.25, 1, .5).normalize();
    tige(M, V(-.02, 0, 0), hf, vert); fleur(M, hf, df, vert, leger, alea);
    const ha = V(.07, .36, -.03), da = V(.2, 1, .35).normalize();
    tige(M, V(.02, 0, -.01), ha, vert); aigrette(M, ha, da, vert, leger, alea);
    if(!leger){ const hb = V(.13, .19, .05), db = V(.45, 1, .3).normalize(); tige(M, V(.03, 0, .01), hb, vert); bouton(M, hb, db, vert); }
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, variante, neige){
  const cle = [saison, etat, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, variante, false, neige), loin: touffe(saison, etat, variante, true, neige)});
  return CACHE.get(cle);
}
/* Le pissenlit : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur (sa fleur, son aigrette, son bouton) ;
   r : son tirage (nuance, taille, sens) ; neige : il neige (un peu de neige sur sa rosette, l'hiver) */
export function pissenlitModele(saison, etat, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;                // un peu tourné, mais les fleurs regardent toujours vers l'avant
  g.scale.setScalar(.95 + r * .2);
  g.userData.pissenlit = {saison, etat};
  return g;
}
