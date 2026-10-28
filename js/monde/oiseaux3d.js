/* ================= Les oiseaux d'après les images de Yo =================
   Un modèle par oiseau, au plus près de son image et comme un vrai (Yo, 28 octobre 2026 : « Oui comme des vrais »), dans
   le style jouet : un corps rond et doux, de grands yeux brillants. La tête est vers −z, les pieds à y = 0 (oiseaux.js
   tourne le modèle et le pose) ; les ailes sont sur des pivots (userData.ailes : {pivot, cote}) qu'oiseaux.js fait battre,
   la tête sur un pivot (userData.tete) qui regarde autour. Pour le téléphone : le corps, la tête et chaque aile d'un seul
   morceau (4 dessins par oiseau). */
import { fusionner, toon } from "./formes.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ROND = new THREE.SphereGeometry(1, 14, 10), BOULE_P = new THREE.SphereGeometry(1, 6, 4), PLUME = new THREE.IcosahedronGeometry(1, 0);
const TIGE = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1); g.translate(0, .5, 0); return g; })();
const CONE = (() => { const g = new THREE.ConeGeometry(1, 1, 10, 1); g.translate(0, .5, 0); g.rotateX(-Math.PI / 2); return g; })();   // la pointe vers −z
const q0 = new THREE.Quaternion();
const corpsMat = () => toon({vertexColors: true});
const boule = (M, c, x, y, z, sx, sy, sz, geo = ROND) => M.push({geo, m: new THREE.Matrix4().compose(V(x, y, z), q0, V(sx, sy, sz)), c});
/* une boule tournée (rx, ry, rz : ses angles) : les plumes posées en biais */
const bouleT = (M, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, geo = ROND) =>
  M.push({geo, m: new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz)), c});
function baton(M, c, a, b, r){
  const d = b.clone().sub(a);
  M.push({geo: TIGE, m: new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), V(r, d.length(), r)), c});
}
function pilule(M, c, a, b, r){ baton(M, c, a, b, r); boule(M, c, a.x, a.y, a.z, r, r, r, BOULE_P); boule(M, c, b.x, b.y, b.z, r, r, r, BOULE_P); }
/* une patte d'oiseau : le tarse, trois doigts devant, un derrière, de petites griffes sombres */
function patte(M, s, c, griffe){
  const h = V(s * .042, .085, .0), p = V(s * .046, .012, -.004);
  pilule(M, c, h, p, .0085);
  for(const [a, l] of [[-.45, .042], [0, .048], [.45, .042], [Math.PI, .032]]){
    const d = V(Math.sin(a) * s, 0, -Math.cos(a)), b = p.clone().addScaledVector(d, l).setY(.006);
    baton(M, c, p, b, .0062);
    boule(M, griffe, b.x + d.x * .004, .005, b.z + d.z * .004, .0055, .0045, .008, BOULE_P);
  }
}

/* ---------- Le moineau domestique ----------
   D'après l'image de Yo (28 octobre 2026 : « Voici le moineau. », une image proche du moineau friquet), comme un vrai
   moineau domestique (Yo : « Le domestique, mâles et femelles au hasard », « Oui le bec et les pattes comme un vrai ») :
   rond comme l'image, de grands yeux brillants ; le mâle à calotte grise, une bande marron de l'oeil à la nuque, les joues
   gris clair, la bavette noire, le dos marron rayé de noir, une barre blanche sur l'aile, le ventre gris ; le bec noir au
   printemps et en été, couleur de corne le reste de l'année ; la femelle toute brune, un trait clair derrière l'oeil, le dos
   rayé de brun et de chamois, le ventre chamois, le bec couleur de corne ; les pattes rose-brun, quatre doigts. */
const MOINEAU = {};
function moineauGeos(male, becNoir){
  const cle = `${male}${becNoir}`;
  if(MOINEAU[cle]) return MOINEAU[cle];
  const C = male ? {dos: 0x8A5230, raie: 0x2A2018, ventre: 0xB8B6B0, poitrine: 0xC8C4BC, calotte: 0x80848A, nuque: 0x8A4A26, joue: 0xDCDAD4, queue: 0x5A4232}
                 : {dos: 0x8E7254, raie: 0x4A3626, ventre: 0xD2C4A8, poitrine: 0xD8CCB2, calotte: 0x8A7058, nuque: 0x7A6048, joue: 0xC8B89A, queue: 0x6A5440};
  const bec = becNoir ? 0x22201E : 0xB89A6A, patteC = 0xB8897A, griffe = 0x4A3A34;
  /* le corps : rond, le ventre clair devant, le dos rayé derrière */
  const M = [];
  boule(M, C.ventre, 0, .19, .01, .155, .155, .17);
  boule(M, C.poitrine, 0, .205, -.05, .138, .135, .12);
  boule(M, C.dos, 0, .235, .06, .13, .115, .14);
  for(let k = 0; k < 6; k++){ const x = (k % 3 - 1) * .042, j = Math.floor(k / 3), z = .04 + j * .055;   // les raies noires du dos
    bouleT(M, C.raie, x, .345 - j * .03, z, .011, .008, .032, -.5 - j * .3, x * 4, 0, BOULE_P); }
  bouleT(M, C.queue, 0, .2, .2, .045, .012, .085, -.35);                                              // la queue courte, sombre
  for(const s of [-1, 1]) patte(M, s, patteC, griffe);
  /* la tête, sur son pivot au cou (0, .3, −.06) */
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  const tT = (c, x, y, z, sx, sy, sz, rx) => bouleT(T, c, x, y - y0, z - z0, sx, sy, sz, rx);
  t(C.poitrine, 0, .36, -.07, .13, .125, .127);
  if(male) tT(C.nuque, 0, .356, -.045, .1315, .118, .124, .1);                                       // le marron, de l'oeil à la nuque
  tT(C.calotte, 0, .372, -.06, .133, .124, .131, .45);                                                // la calotte (grise chez le mâle), du bec à la nuque
  for(const s of [-1, 1]){
    t(C.joue, s * .062, .342, -.152, .034, .032, .03);                                                // la joue
    if(!male) t(0xE0D2B4, s * .088, .398, -.06, .024, .015, .062);                                         // le trait clair derrière l'oeil
    t(0x1A1210, s * .05, .378, -.176, .025, .027, .02);                                               // un grand oeil brillant
    t(0xFFFFFF, s * .056, .388, -.193, .0065, .0075, .004, BOULE_P);                                 // son reflet
  }
  if(male){ t(0x24201E, 0, .3, -.16, .055, .05, .03); t(0x24201E, 0, .352, -.186, .03, .016, .012); }   // la bavette noire, le tour du bec
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.188 - z0), q0, V(.024, .021, .05)), c: bec});   // le bec court et fort
  /* une aile repliée contre le flanc, sur son pivot à l'épaule : brune rayée, la barre blanche (pâle chez la femelle) */
  const aile = s => { const A = [];
    bouleT(A, C.dos, s * .03, -.04, .06, .035, .085, .15, -.25, 0, s * .15);
    for(let k = 0; k < 3; k++) bouleT(A, C.raie, s * .058, -.045 - k * .012, .06 + k * .04, .006, .022, .04, -.25, 0, s * .15, BOULE_P);
    bouleT(A, male ? 0xF2EEE6 : 0xE2D6C0, s * .062, -.012, .0, .005, .009, .04, -.25, 0, s * .15, BOULE_P);   // la barre blanche
    bouleT(A, C.queue, s * .035, -.075, .18, .026, .022, .055, -.3, 0, s * .12, BOULE_P);                 // le bout des grandes plumes
    return fusionner(A); };
  return MOINEAU[cle] = {corps: fusionner(M), tete: fusionner(T), droite: aile(1), gauche: aile(-1)};
}
export function moineauModele(opt = {}){
  const male = opt.male ?? Math.random() < .5, becNoir = male && (opt.saison === "printemps" || opt.saison === "ete");
  const G = moineauGeos(male, becNoir), g = new THREE.Group(), mat = corpsMat();
  g.add(new THREE.Mesh(G.corps, mat));
  const tete = new THREE.Group(); tete.position.set(0, .3, -.06); tete.add(new THREE.Mesh(G.tete, mat)); g.add(tete);
  g.userData.ailes = [[G.droite, 1], [G.gauche, -1]].map(([geo, cote]) => { const pivot = new THREE.Group();
    pivot.position.set(cote * .092, .26, 0); pivot.add(new THREE.Mesh(geo, mat)); g.add(pivot); return {pivot, cote}; });
  g.userData.tete = tete; g.userData.male = male;
  return g;
}

/* Les modèles faits d'après une image : la clé de l'oiseau, sa fabrique ; l'échelle (avec sa taille, oiseaux.js). Leur
   taille suit l'ordre de la nature : le moineau petit, le merle et la pie plus grands, le héron et la cigogne bien plus. */
export const MODELES_OISEAUX = {moineau: {fabrique: moineauModele, echelle: 1}};
