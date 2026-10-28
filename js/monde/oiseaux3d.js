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
/* un petit oiseau rond : le corps, la tête sur son pivot au cou, les deux ailes sur leurs pivots aux épaules */
function assembler(G, male){
  const g = new THREE.Group(), mat = corpsMat();
  g.add(new THREE.Mesh(G.corps, mat));
  const tete = new THREE.Group(); tete.position.set(0, .3, -.06); tete.add(new THREE.Mesh(G.tete, mat)); g.add(tete);
  const vol = [], plies = [];                                                                         // ce qu'on ne voit qu'en vol (le blanc des ailes de la pie, les grandes ailes de la mouette)
  g.userData.ailes = [[G.droite, 1, G.volD], [G.gauche, -1, G.volG]].map(([geo, cote, v]) => { const pivot = new THREE.Group();
    const repli = new THREE.Mesh(geo, mat); pivot.position.set(cote * .092, .26, 0); pivot.add(repli);
    if(v){ const m = new THREE.Mesh(v, mat); m.visible = false; pivot.add(m); vol.push(m); }
    if(G.grandesAiles) plies.push(repli);
    g.add(pivot); return {pivot, cote}; });
  if(vol.length) g.userData.vol = vol;
  if(plies.length){ g.userData.plies = plies; g.userData.grandesAiles = true; }                        // en vol : les ailes repliées cachées, les grandes ailes ouvertes
  if(G.ver){ const v = new THREE.Mesh(G.ver, mat); v.visible = false; tete.add(v); g.userData.ver = v; }   // le ver au bout du bec (le merle)
  if(G.queue){ const q = new THREE.Group(); q.position.set(0, .2, .15); q.add(new THREE.Mesh(G.queue, mat)); g.add(q); g.userData.queue = q; }   // la queue sur son pivot (le rouge-gorge la relève)
  g.userData.tete = tete; g.userData.male = male;
  return g;
}
export function moineauModele(opt = {}){
  const male = opt.male ?? Math.random() < .5, becNoir = male && (opt.saison === "printemps" || opt.saison === "ete");
  return assembler(moineauGeos(male, becNoir), male);
}

/* ---------- La mésange charbonnière ----------
   D'après l'image de Yo (28 octobre 2026 : « La mésange charbonnière »), comme une vraie (Yo : « Comme une vraie, avec la
   tache de la nuque et la queue bordée de blanc », « Mâles et femelles au hasard, oui ») : ronde comme l'image ; la tête
   noire aux reflets bleus, les grandes joues blanches, la petite tache blanche de la nuque ; le ventre jaune et sa bande
   noire, large et qui s'élargit entre les pattes chez le mâle, fine et qui s'arrête avant le bas du ventre chez la femelle
   (au hasard) ; le dos vert olive ; les ailes gris-bleu à barre blanche ; la queue gris-bleu bordée de blanc ; le bec noir,
   les pattes gris-bleu. */
const MESANGE = {};
function mesangeGeos(male){
  if(MESANGE[male]) return MESANGE[male];
  const noir = 0x1C222C, blanc = 0xF4F2EA, jaune = 0xF2D23A, olive = 0x7E8C3A, bleu = 0x5A6A82, patteC = 0x6A7484, griffe = 0x3A3E46;
  const M = [];
  boule(M, jaune, 0, .19, .01, .155, .155, .17);
  boule(M, jaune, 0, .205, -.05, .138, .135, .12);
  boule(M, olive, 0, .24, .065, .128, .11, .135);                                                      // le dos vert olive
  /* la bande noire, du cou au bas du ventre : une boule étroite qui ne dépasse que devant (chez le mâle, une deuxième
     l'élargit entre les pattes) */
  if(male){ boule(M, noir, 0, .19, -.012, .034, .152, .175); boule(M, noir, 0, .11, -.006, .046, .085, .158); }
  else boule(M, noir, 0, .235, -.012, .019, .125, .172);
  /* la queue gris-bleu, bordée de blanc */
  bouleT(M, bleu, 0, .205, .205, .042, .011, .095, -.3);
  for(const s of [-1, 1]) bouleT(M, blanc, s * .036, .204, .215, .008, .01, .08, -.3, s * .08, 0, BOULE_P);
  for(const s of [-1, 1]) patte(M, s, patteC, griffe);
  /* la tête noire, sur son pivot au cou (0, .3, −.06) */
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  t(noir, 0, .36, -.07, .13, .125, .127);
  t(0x2C3A52, -.03, .43, -.1, .05, .025, .05, BOULE_P);                                               // un reflet bleu sur le noir
  t(blanc, 0, .38, .054, .03, .03, .014, BOULE_P);                                                    // la tache blanche de la nuque
  for(const s of [-1, 1]){
    t(blanc, s * .036, .334, -.092, .1, .088, .102);                                                 // la grande joue blanche
    t(0x1A1210, s * .05, .378, -.176, .025, .027, .02);                                               // un grand oeil brillant
    t(0xFFFFFF, s * .056, .388, -.193, .0065, .0075, .004, BOULE_P);                                 // son reflet
  }
  t(noir, 0, .292, -.158, .058, .042, .03);                                                             // la gorge noire, jusqu'à la bande
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.188 - z0), q0, V(.021, .019, .045)), c: 0x26282C});   // le bec noir, fin
  /* une aile repliée : l'épaule vert olive, le gris-bleu, la barre blanche, le bout sombre */
  const aile = s => { const A = [];
    bouleT(A, bleu, s * .03, -.04, .06, .035, .085, .15, -.25, 0, s * .15);
    bouleT(A, olive, s * .04, -.008, -.005, .022, .036, .06, -.25, 0, s * .15);
    bouleT(A, blanc, s * .062, -.03, .04, .005, .01, .05, -.25, 0, s * .15, BOULE_P);                    // la barre blanche
    bouleT(A, 0x3A4456, s * .035, -.075, .18, .026, .022, .055, -.3, 0, s * .12, BOULE_P);                 // le bout des grandes plumes
    return fusionner(A); };
  return MESANGE[male] = {corps: fusionner(M), tete: fusionner(T), droite: aile(1), gauche: aile(-1)};
}
export function mesangeModele(opt = {}){
  const male = opt.male ?? Math.random() < .5;
  return assembler(mesangeGeos(male), male);
}

/* ---------- Le rouge-gorge ----------
   D'après l'image de Yo (28 octobre 2026 : « Voici le rouge-gorge »), comme un vrai (Yo : « Comme un vrai », « Les
   courbettes et les coups de queue, d'accord ») : rond comme l'image ; la face et la poitrine orange, bordées de gris-bleu
   sur les côtés de la tête et du cou ; le dos, les ailes et la queue brun olive ; le ventre blanc, les flancs chamois ; le
   bec fin et sombre ; les pattes fines, brun-rose. Mâle et femelle sont pareils. La queue est sur son pivot (userData.queue) :
   il fait de petites courbettes en la relevant d'un coup. */
let ROUGE = null;
function rougeGorgeGeos(){
  if(ROUGE) return ROUGE;
  const brun = 0x7E6A4A, orange = 0xE8682A, gris = 0x98A2AE, blanc = 0xF2EEE6, chamois = 0xD8C6A8, patteC = 0xA87A62, griffe = 0x4A3A30;
  const M = [];
  boule(M, blanc, 0, .19, .01, .155, .155, .17);                                                      // le ventre blanc
  boule(M, chamois, 0, .2, .03, .158, .13, .15);                                                      // les flancs chamois
  boule(M, gris, 0, .262, .012, .1418, .088, .12);                                                       // la bordure gris-bleu
  boule(M, orange, 0, .24, -.045, .14, .115, .135);                                                   // la poitrine orange
  boule(M, brun, 0, .245, .07, .133, .112, .14);                                                      // le dos brun olive
  for(const s of [-1, 1]) patte(M, s, patteC, griffe);
  const Q = []; bouleT(Q, brun, 0, 0, .06, .042, .011, .085, -.3); bouleT(Q, 0x6A5638, 0, -.004, .11, .036, .008, .04, -.3, 0, 0, BOULE_P);   // la queue, sur son pivot
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  t(brun, 0, .365, -.065, .13, .125, .127);                                                           // la tête brune
  t(gris, 0, .345, -.072, .1315, .1, .118);                                                           // le gris-bleu, en bordure sur les côtés
  t(orange, 0, .352, -.082, .128, .118, .122);                                                        // la face orange, jusqu'au-dessus des yeux
  for(const s of [-1, 1]){
    t(0x1A1210, s * .05, .378, -.182, .025, .027, .02);                                               // un grand oeil brillant
    t(0xFFFFFF, s * .056, .388, -.199, .0065, .0075, .004, BOULE_P);                                 // son reflet
  }
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .352 - y0, -.2 - z0), q0, V(.018, .016, .045)), c: 0x3A2E26});   // le bec fin, sombre
  const aile = s => { const A = [];
    bouleT(A, brun, s * .03, -.04, .06, .035, .085, .15, -.25, 0, s * .15);
    for(let k = 0; k < 3; k++) bouleT(A, 0xB8A07A, s * .058, -.03 - k * .016, .03 + k * .045, .005, .02, .035, -.25, 0, s * .15, BOULE_P);   // le bord clair des plumes
    bouleT(A, 0x5E4C32, s * .035, -.075, .18, .026, .022, .055, -.3, 0, s * .12, BOULE_P);
    return fusionner(A); };
  return ROUGE = {corps: fusionner(M), tete: fusionner(T), queue: fusionner(Q), droite: aile(1), gauche: aile(-1)};
}
export const rougeGorgeModele = () => assembler(rougeGorgeGeos(), undefined);

/* ---------- Le merle noir ----------
   D'après l'image de Yo (28 octobre 2026 : « Voici le merle »), comme un vrai (Yo : « Comme un vrai, avec les pattes
   sombres », « Mâles et femelles au hasard », « La course, la tête penchée et le ver », « La queue relevée quand il se
   pose ») : rond comme l'image, la queue plus longue que celle du moineau ; le mâle tout noir, le bec et le tour de l'oeil
   jaune-orange ; la femelle brun sombre, la gorge plus claire et tachetée, le bec brunâtre, sans tour de l'oeil ; les pattes
   brun très sombre. Un ver rose, caché, au bout du bec (userData.ver) : il le tire de la terre. */
const MERLE = {};
function merleGeos(male){
  if(MERLE[male]) return MERLE[male];
  const C = male ? {corps: 0x1E1A1A, dos: 0x161212, ventre: 0x2A2424, aile: 0x221C1C, bec: 0xF2A22E}
                 : {corps: 0x4A3A2E, dos: 0x3E3026, ventre: 0x5E4A3A, aile: 0x46362A, bec: 0x8A6A40};
  const patteC = 0x2A2220, griffe = 0x161210, M = [];
  boule(M, C.ventre, 0, .19, .01, .155, .155, .17);
  boule(M, C.corps, 0, .205, -.05, .138, .135, .12);
  boule(M, C.dos, 0, .24, .065, .13, .112, .14);
  for(const s of [-1, 1]) patte(M, s, patteC, griffe);
  const Q = []; bouleT(Q, C.dos, 0, 0, .08, .045, .012, .12, -.3); bouleT(Q, C.aile, 0, -.006, .15, .04, .009, .05, -.3, 0, 0, BOULE_P);   // la longue queue
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  t(C.corps, 0, .36, -.07, .13, .125, .127);
  if(!male){ t(0x7A6450, 0, .3, -.15, .06, .05, .03);                                                // la gorge claire, tachetée
    for(const [x, y] of [[-.02, .31], [.02, .3], [0, .285], [-.03, .29], [.03, .285]]) t(0x4A3A2E, x, y, -.178, .007, .009, .004, BOULE_P); }
  for(const s of [-1, 1]){
    if(male) t(C.bec, s * .05, .378, -.176, .031, .033, .022);                                        // le tour de l'oeil jaune-orange
    t(0x1A1210, s * .05, .378, -.182, .025, .027, .02);                                               // un grand oeil brillant
    t(0xFFFFFF, s * .056, .388, -.199, .0065, .0075, .004, BOULE_P);                                 // son reflet
  }
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.19 - z0), q0, V(.024, .021, .055)), c: C.bec});   // le bec
  const W = []; for(let k = 0; k < 5; k++){ const a = k / 4; pilule(W, 0xD88A8A, V(Math.sin(a * 6) * .006, .34 - y0 - a * .05, -.24 - z0 + a * .004), V(Math.sin((a + .25) * 6) * .006, .34 - y0 - (a + .25) * .05, -.24 - z0 + (a + .25) * .004), .0045); }
  const aile = s => { const A = [];
    bouleT(A, C.aile, s * .03, -.04, .07, .035, .085, .16, -.25, 0, s * .15);
    bouleT(A, C.dos, s * .035, -.075, .19, .026, .022, .06, -.3, 0, s * .12, BOULE_P);
    return fusionner(A); };
  return MERLE[male] = {corps: fusionner(M), tete: fusionner(T), queue: fusionner(Q), ver: fusionner(W), droite: aile(1), gauche: aile(-1)};
}
export function merleModele(opt = {}){
  const male = opt.male ?? Math.random() < .5;
  return assembler(merleGeos(male), male);
}

/* ---------- La pie bavarde ----------
   D'après l'image de Yo (28 octobre 2026 : « Voici la pie »), comme une vraie (Yo : « Comme une vraie, avec la longue
   queue », « La marche, les sauts de côté et la queue qui bouge », « Le blanc des ailes en vol : d'accord », pas de
   caillou brillant) : ronde comme l'image ; la tête, la poitrine et le dos noirs, le ventre et les flancs blancs, les
   épaules blanches ; les ailes noires aux reflets bleus, le bout blanc qu'on ne voit qu'en vol (userData.vol) ; la très
   longue queue noire aux reflets verts et violets, sur son pivot ; le bec fort et les pattes noirs. Mâle et femelle sont
   pareils. */
let PIE = null;
function pieGeos(){
  if(PIE) return PIE;
  const noir = 0x18181C, blanc = 0xF2F0EA, bleu = 0x2A3488, vert = 0x2A5A4C, violet = 0x3A2A5A, M = [];
  boule(M, blanc, 0, .19, .01, .155, .155, .17);                                                      // le ventre et les flancs blancs
  boule(M, noir, 0, .275, -.035, .13, .1, .14);                                                       // la poitrine noire, en pointe
  boule(M, noir, 0, .245, .065, .132, .115, .14);                                                     // le dos noir
  for(const s of [-1, 1]) patte(M, s, 0x222226, 0x101012);
  const Q = [];                                                                                      // la très longue queue, de plus en plus étroite
  bouleT(Q, noir, 0, 0, .17, .05, .014, .21);
  bouleT(Q, violet, 0, .004, .15, .034, .012, .14, 0, 0, 0, BOULE_P);                                    // les reflets violets…
  bouleT(Q, vert, 0, .004, .3, .028, .012, .075, 0, 0, 0, BOULE_P);                                      // … et verts, vers le bout
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  t(noir, 0, .36, -.07, .13, .125, .127);
  for(const s of [-1, 1]){
    t(0x2A1E18, s * .05, .378, -.18, .026, .028, .02);                                                // un grand oeil brun sombre
    t(0xFFFFFF, s * .056, .388, -.197, .0065, .0075, .004, BOULE_P);
  }
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.19 - z0), q0, V(.028, .025, .065)), c: 0x202024});   // le bec fort
  const aile = (s, vol) => { const A = [];
    if(vol){ bouleT(A, blanc, s * .02, -.06, .15, .028, .055, .07, -.25, 0, s * .15, BOULE_P); return fusionner(A); }   // le bout blanc, en vol
    bouleT(A, noir, s * .03, -.04, .07, .035, .085, .16, -.25, 0, s * .15);
    bouleT(A, bleu, s * .05, -.055, .08, .018, .05, .09, -.25, 0, s * .15);                                // les reflets bleus
    bouleT(A, blanc, s * .036, -.002, -.01, .03, .045, .065, -.25, 0, s * .15);                             // l'épaule blanche
    return fusionner(A); };
  return PIE = {corps: fusionner(M), tete: fusionner(T), queue: fusionner(Q), droite: aile(1), gauche: aile(-1), volD: aile(1, true), volG: aile(-1, true)};
}
export const pieModele = () => assembler(pieGeos(), undefined);

/* ---------- La mouette rieuse ----------
   D'après l'image de Yo (28 octobre 2026 : « Voici la mouette. »), comme une vraie (Yo : « La mouette rieuse comme une
   vraie », « Le capuchon brun au printemps et en été », « Le vol plané au-dessus du ponton et de la mer ») : ronde comme
   l'image ; blanche, le dos et les ailes gris très clair, le bout des ailes noir à petits miroirs blancs ; le bec rouge
   sombre à la pointe plus foncée, les pattes rouges et palmées ; au printemps et en été, le capuchon brun chocolat ; en
   automne et en hiver, la tête blanche à la petite tache sombre derrière l'oeil. Mâle et femelle sont pareils. En vol,
   les ailes repliées laissent place à de grandes ailes ouvertes (userData.grandesAiles, plies, vol), qui battent
   lentement ou restent immobiles quand elle plane. */
function pattePalmee(M, s, c, griffe){
  const h = V(s * .042, .085, .0), p = V(s * .046, .012, -.004);
  pilule(M, c, h, p, .0085);
  const bouts = [-.5, 0, .5].map(a => { const d = V(Math.sin(a) * s, 0, -Math.cos(a)), b = p.clone().addScaledVector(d, .045).setY(.006);
    baton(M, c, p, b, .006); boule(M, griffe, b.x + d.x * .004, .005, b.z + d.z * .004, .005, .004, .007, BOULE_P); return b; });
  for(const k of [0, 1]){ const m = p.clone().add(bouts[k]).add(bouts[k + 1]).multiplyScalar(1 / 3);    // la palmure entre les doigts
    bouleT(M, c, m.x, .006, m.z, .018, .003, .02, 0, s * (k ? -.25 : .25), 0, BOULE_P); }
  baton(M, c, p, p.clone().add(V(0, 0, .02)).setY(.008), .005);                                       // le petit doigt arrière
}
const MOUETTE = {};
function mouetteGeos(capuchon){
  if(MOUETTE[capuchon]) return MOUETTE[capuchon];
  const blanc = 0xF4F4F2, gris = 0xB4BCC8, noir = 0x1E1E22, rouge = 0xB02A26, patteC = 0xC8382E, M = [];
  boule(M, blanc, 0, .19, .01, .155, .155, .17);
  boule(M, blanc, 0, .205, -.05, .138, .135, .12);
  boule(M, gris, 0, .25, .07, .128, .1, .135);                                                        // le dos gris clair
  for(const s of [-1, 1]) pattePalmee(M, s, patteC, 0x4A2A24);
  const Q = []; bouleT(Q, blanc, 0, 0, .07, .048, .012, .09);                                       // la queue blanche, courte
  const T = [], y0 = .3, z0 = -.06, t = (c, x, y, z, sx, sy, sz, geo) => boule(T, c, x, y - y0, z - z0, sx, sy, sz, geo);
  t(blanc, 0, .36, -.07, .13, .125, .127);
  if(capuchon) bouleT(T, 0x4A3226, 0, .372 - y0, -.085 - z0, .133, .118, .13, .55);                     // le capuchon brun chocolat (printemps, été)
  for(const s of [-1, 1]){
    if(capuchon) t(0xF4F4F2, s * .05, .372, -.172, .03, .02, .02, BOULE_P);                              // le croissant blanc autour de l'oeil
    else t(0x50505A, s * .12, .38, -.105, .014, .026, .026, BOULE_P);                                          // la petite tache derrière l'oeil (hiver)
    t(0x1A1210, s * .05, .378, -.182, .025, .027, .02);
    t(0xFFFFFF, s * .056, .388, -.199, .0065, .0075, .004, BOULE_P);
  }
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.19 - z0), q0, V(.024, .022, .065)), c: rouge});   // le bec rouge sombre
  T.push({geo: CONE, m: new THREE.Matrix4().compose(V(0, .35 - y0, -.236 - z0), q0, V(.011, .01, .022)), c: 0x5A1A18});   // sa pointe plus foncée
  const aile = s => { const A = [];                                                                   // repliée : grise, le bout noir croisé sur la queue
    bouleT(A, gris, s * .03, -.03, .07, .035, .08, .16, -.25, 0, s * .15);
    bouleT(A, noir, s * .02, -.05, .22, .024, .03, .07, -.3, 0, s * .1, BOULE_P);
    bouleT(A, blanc, s * .03, -.045, .25, .008, .012, .014, -.3, 0, s * .1, BOULE_P);                    // un petit miroir blanc
    return fusionner(A); };
  const grande = s => { const A = [];                                                                 // ouverte, en vol : longue et pointue
    bouleT(A, gris, s * .16, 0, .03, .16, .012, .075, 0, s * -.12, 0);
    bouleT(A, blanc, s * .15, .002, -.035, .15, .008, .012, 0, s * -.12, 0, BOULE_P);                    // le bord avant blanc
    bouleT(A, noir, s * .33, 0, .06, .075, .01, .035, 0, s * -.3, 0, BOULE_P);                          // le bout noir
    bouleT(A, blanc, s * .34, .006, .065, .012, .004, .01, 0, 0, 0, BOULE_P);                           // son miroir blanc
    return fusionner(A); };
  return MOUETTE[capuchon] = {corps: fusionner(M), tete: fusionner(T), queue: fusionner(Q), droite: aile(1), gauche: aile(-1),
    volD: grande(1), volG: grande(-1), grandesAiles: true};
}
export function mouetteModele(opt = {}){
  return assembler(mouetteGeos(opt.saison === "printemps" || opt.saison === "ete"), undefined);
}

/* Les modèles faits d'après une image : la clé de l'oiseau, sa fabrique ; l'échelle (avec sa taille, oiseaux.js). Leur
   taille suit l'ordre de la nature : le moineau petit, le merle et la pie plus grands, le héron et la cigogne bien plus. */
export const MODELES_OISEAUX = {moineau: {fabrique: moineauModele, echelle: 1}, mesange: {fabrique: mesangeModele, echelle: .95},
  rougeGorge: {fabrique: rougeGorgeModele, echelle: .95}, merle: {fabrique: merleModele, echelle: .92},
  pie: {fabrique: pieModele, echelle: .85}, mouette: {fabrique: mouetteModele, echelle: .78}};
