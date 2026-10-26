/* ================= Les insectes d'après les images de Yo =================
   Un modèle par insecte, au plus près de son image (25 octobre 2026 : « Voici la piéride blanche »), dans le style jouet :
   un corps rond et duveteux, de grands yeux, des ailes peintes. La tête est vers −z (insectes.js tourne le modèle dans le
   sens de la marche) ; les ailes sont sur des pivots (userData.ailes : {pivot, cote}) qu'insectes.js fait battre.
   Pour le téléphone : le corps d'un seul morceau, les ailes de chaque côté d'un seul morceau (5 dessins par insecte). */
import { fusionner, toon } from "./formes.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BOULE = new THREE.SphereGeometry(1, 12, 9), BOULE_P = new THREE.SphereGeometry(1, 8, 6), POIL = new THREE.IcosahedronGeometry(1, 0);
const TIGE = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1); g.translate(0, .5, 0); return g; })();
const corpsMat = () => toon({vertexColors: true});
const aileMat = map => toon({map, side: THREE.DoubleSide});
const q0 = new THREE.Quaternion();
const boule = (M, c, x, y, z, sx, sy, sz, geo = BOULE) => M.push({geo, m: new THREE.Matrix4().compose(V(x, y, z), q0, V(sx, sy, sz)), c});
function baton(M, c, a, b, r){
  const d = b.clone().sub(a);
  M.push({geo: TIGE, m: new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), V(r, d.length(), r)), c});
}
/* une aile plate (dans le plan xz) d'après son contour (des points [x, z]) vu depuis son attache (0, 0) : un éventail de
   rangs, à peine bombé ; ses coordonnées d'image (uv) suivent la boîte B = [x0, z0, largeur, hauteur], celle où sa
   peinture est dessinée ; cote : 1 à droite, −1 à gauche (l'image est la même des deux côtés) */
function aileGeo(contour, cote, B, rangs = 10){
  const pos = [], uv = [], ind = [], n = contour.length;
  for(let r = 0; r <= rangs; r++){
    const t = r / rangs;
    for(let k = 0; k < n; k++){
      const [cx, cz] = contour[k], x = cx * t, z = cz * t, d = Math.hypot(x, z);
      pos.push(x * cote, .012 * Math.sin(Math.min(1, d / .2) * Math.PI), z);
      uv.push((x - B[0]) / B[2], (z - B[1]) / B[3]);
    }
  }
  for(let r = 0; r < rangs; r++) for(let k = 0; k < n; k++){
    const a = r * n + k, b = r * n + (k + 1) % n, c = a + n, d = b + n;
    ind.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  if(cote < 0) ind.reverse();                                                 // le même dessus des deux côtés
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
/* la peinture d'une aile : une petite image où l'on dessine dans les mesures de l'aile (boîte B) */
function peinture(B, dessin, S = 256){
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const c = cv.getContext("2d");
  c.setTransform(S / B[2], 0, 0, -S / B[3], -B[0] * S / B[2], S + B[1] * S / B[3]);
  dessin(c);
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
  return t;
}
/* une courbe douce passant par des points (contour d'aile) */
const lisse = (pts, n = 6) => new THREE.SplineCurve([...pts, pts[0]].map(([x, z]) => new THREE.Vector2(x, z))).getPoints(pts.length * n).map(v => [v.x, v.y]);
const trace = (c, pts) => { c.beginPath(); pts.forEach(([x, z], k) => k ? c.lineTo(x, z) : c.moveTo(x, z)); c.closePath(); };

/* ---------- La piéride blanche ----------
   D'après l'image de Yo : un corps gris clair tout duveteux, une tête ronde aux grands yeux sombres et brillants, deux
   antennes noires terminées par une massue crème ; l'abdomen gris en anneaux ; six fines pattes brun sombre ; les ailes
   crème, jaunies vers le corps, leurs nervures en creux à peine plus sombres ; les ailes de devant, au bout noir au
   bord duveteux et à deux taches noires rondes ; celles de derrière toutes crème. */
const AVANT = lisse([[.0, -.005], [.05, -.1], [.13, -.22], [.2, -.25], [.235, -.17], [.215, -.06], [.16, .01], [.07, .03]]);
const ARRIERE = lisse([[.0, .005], [.09, -.01], [.17, .04], [.19, .11], [.15, .17], [.08, .17], [.02, .08]]);
const BA = [-.01, -.27, .26, .32], BR = [-.01, -.03, .22, .22];
function fond(c, contour){
  trace(c, contour); c.fillStyle = "#F8F3E4"; c.fill();
  const g = c.createRadialGradient(0, 0, 0, 0, 0, .14);                        // jaunies vers le corps
  g.addColorStop(0, "rgba(236,224,168,.95)"); g.addColorStop(1, "rgba(236,224,168,0)");
  c.fillStyle = g; c.fill();
  c.save(); trace(c, contour); c.clip();                                      // les nervures, depuis le corps
  c.lineCap = "round";
  for(let k = 2; k < contour.length; k += Math.round(contour.length / 9)){
    const [x, z] = contour[k];
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(x * .5 + z * .08, z * .5 - x * .08, x * .97, z * .97);
    c.strokeStyle = "rgba(205,192,150,.55)"; c.lineWidth = .0035; c.stroke();
    c.strokeStyle = "rgba(255,255,248,.6)"; c.lineWidth = .0015; c.translate(.002, .002); c.stroke(); c.translate(-.002, -.002);
  }
  c.restore();
  c.save(); trace(c, contour); c.strokeStyle = "rgba(225,212,170,.9)"; c.lineWidth = .006; c.stroke(); c.restore();   // le bord, un peu plus soutenu
}
/* une tache sombre au bord duveteux */
function tache(c, x, z, r){
  const g = c.createRadialGradient(x, z, r * .72, x, z, r * 1.08);
  g.addColorStop(0, "rgba(52,45,42,1)"); g.addColorStop(1, "rgba(52,45,42,0)");
  c.fillStyle = g; c.beginPath(); c.arc(x, z, r * 1.15, 0, Math.PI * 2); c.fill();
}
let TEX_PIERIDE = null;
function texPieride(){
  if(TEX_PIERIDE) return TEX_PIERIDE;
  const avant = peinture(BA, c => {
    fond(c, AVANT);
    c.save(); trace(c, AVANT); c.clip();
    /* le bout noir : tout ce qui est au-delà d'une ligne courbe, du bord d'attaque au bord extérieur, au bord flou */
    c.filter = "blur(1.5px)";
    c.beginPath(); c.moveTo(.13, -.3); c.quadraticCurveTo(.14, -.215, .165, -.2);
    c.quadraticCurveTo(.2, -.18, .25, -.145); c.lineTo(.3, -.145); c.lineTo(.3, -.3); c.closePath();
    c.fillStyle = "#3A3330"; c.fill();
    c.filter = "none"; c.restore();
    tache(c, .118, -.085, .021);                                              // les deux taches rondes
    tache(c, .132, -.03, .016);
  });
  const arriere = peinture(BR, c => fond(c, ARRIERE));
  return TEX_PIERIDE = {avant, arriere};
}
function pierideAiles(cote){
  const avant = aileGeo(AVANT, cote, BA), arriere = aileGeo(ARRIERE, cote, BR);
  arriere.translate(0, -.004, 0);
  return [avant, arriere];
}
let PIERIDE = null;
function pierideGeos(){
  if(PIERIDE) return PIERIDE;
  const M = [], gris = 0xC9C2B4, poil = [0xD8D2C6, 0xBEB7A9, 0xE2DDD2], brun = 0x3A3028;
  boule(M, gris, 0, 0, 0, .042, .04, .05);                                      // le thorax
  for(let k = 0; k < 14; k++){                                                  // son duvet
    const a = k * 2.39996, h = (k / 14) * 2 - 1, r = Math.sqrt(1 - h * h);
    boule(M, poil[k % 3], Math.cos(a) * r * .036, h * .034 + .004, Math.sin(a) * r * .044, .014, .012, .014, POIL);
  }
  for(let k = 0; k < 6; k++) boule(M, k % 2 ? 0x9A9488 : 0x8A8478, 0, -.004 - k * .002, .05 + k * .022, .03 - k * .0035, .028 - k * .0035, .016);   // l'abdomen en anneaux
  boule(M, 0xE6E0D2, 0, .006, -.062, .034, .032, .032);                         // la tête, duveteuse
  for(const s of [-1, 1]){
    boule(M, 0x2A2220, s * .024, .012, -.07, .016, .02, .018);                   // un grand oeil sombre
    boule(M, 0xFFFFFF, s * .027, .022, -.082, .004, .004, .004, BOULE_P);        // son reflet
    const a = V(s * .01, .03, -.085), b = V(s * .05, .1, -.16);                  // l'antenne et sa massue crème
    baton(M, 0x2A2220, a, b, .0028);
    boule(M, 0x2A2220, b.x, b.y, b.z, .008, .008, .008, BOULE_P);
    boule(M, 0xF2E6C8, b.x + s * .002, b.y + .004, b.z - .006, .007, .01, .007, BOULE_P);
    for(let k = 0; k < 3; k++){                                                   // trois pattes, en deux morceaux
      const z = -.03 + k * .03, h = V(s * .02, -.025, z), g = V(s * .045, -.045, z - .008 + k * .008), p = V(s * .05, -.075, z - .012 + k * .014);
      baton(M, brun, h, g, .004); baton(M, brun, g, p, .0035);
    }
  }
  PIERIDE = {corps: fusionner(M), droite: pierideAiles(1), gauche: pierideAiles(-1)};
  return PIERIDE;
}
export function pierideModele(){
  const G = pierideGeos(), g = new THREE.Group(), ailes = [];
  g.add(new THREE.Mesh(G.corps, corpsMat()));
  for(const [geos, cote] of [[G.droite, 1], [G.gauche, -1]]){
    const pivot = new THREE.Group(), T = texPieride();
    pivot.add(new THREE.Mesh(geos[0], aileMat(T.avant)), new THREE.Mesh(geos[1], aileMat(T.arriere)));
    pivot.position.set(cote * .03, .018, -.01); g.add(pivot);
    ailes.push({pivot, cote});
  }
  g.userData.ailes = ailes;
  return g;
}

/* ---------- La fourmi noire des jardins ----------
   D'après l'image de Yo (26 octobre 2026 : « Voici la fourmi »), mais noire comme la vraie fourmi des jardins (décision de
   Yo) : une grosse tête ronde aux grands yeux brillants et aux mandibules en crochet, deux antennes coudées à massue ;
   le thorax rond, le petit nœud, le gros abdomen penché vers l'arrière, en anneaux plus sombres ; six pattes en
   pilules (cuisse, jambe, tarse) aux pieds ronds. Pas d'ailes : userData.ailes reste vide. Les pieds sont au sol
   (insectes.js la pose 0,03 P au-dessus).
   Elle marche comme une vraie fourmi (accord de Yo, 26 octobre 2026) : ses pattes vont en deux trépieds qui se relaient
   (devant et derrière d'un côté, le milieu de l'autre) ; chaque trépied est d'un seul morceau (userData.pattes :
   {mesh, phase, nb}), qu'insectes.js balance d'avant en arrière en le soulevant quand il avance (userData.pas). */
const ECHELLE_FOURMI = .96, ROND = new THREE.SphereGeometry(1, 14, 10), BOUT = new THREE.SphereGeometry(1, 6, 4);
/* une pilule : un bâton aux deux bouts arrondis */
function pilule(M, c, a, b, r){ baton(M, c, a, b, r); boule(M, c, a.x, a.y, a.z, r, r, r, BOUT); boule(M, c, b.x, b.y, b.z, r, r, r, BOUT); }
/* une boule allongée le long d'une direction (le pied, la massue de l'antenne) */
function ovale(M, c, p, dir, long, larg, haut, opt){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir.clone().normalize());
  M.push(Object.assign({geo: opt && opt.geo || BOULE_P, m: new THREE.Matrix4().compose(p, q, V(larg, haut, long)), c}, opt));
}
let FOURMI = null;
function fourmiGeos(){
  if(FOURMI) return FOURMI;
  const M = [], T = [[], []], noir = 0x48403B, tete = 0x4E4540, sombre = 0x2C2724, patte = 0x433B37, pied = 0x2E2926;
  const dessous = (x, y, z) => .78 + .22 * Math.min(1, Math.max(0, (y - .036) / .07));   // l'ombre peinte, sous le ventre
  /* l'abdomen, penché vers l'arrière, et ses anneaux plus sombres */
  const axe = V(0, -.26, 1).normalize(), centre = V(0, .064, .07);
  const anneaux = (x, y, z) => { const t = (z - centre.z) * axe.z + (y - centre.y) * axe.y;
    return [[-.05, -.034], [-.014, .002], [.022, .036]].some(([a, b]) => t > a && t < b) ? sombre : noir; };
  ovale(M, noir, centre, axe, .068, .047, .046, {couleur: anneaux, ombre: dessous, geo: ROND});
  boule(M, sombre, 0, .049, .124, .016, .015, .012);                               // le bout de l'abdomen
  M[M.length - 1].ombre = dessous;
  boule(M, noir, 0, .072, .011, .007, .01, .007);                                   // le nœud
  boule(M, noir, 0, .072, 0, .015, .015, .016);                                     // le thorax : derrière
  boule(M, noir, 0, .081, -.021, .022, .025, .028, ROND);                           // devant, rond
  M[M.length - 1].ombre = dessous;
  boule(M, noir, 0, .088, -.05, .011, .011, .011, BOULE_P);                         // le cou
  boule(M, tete, 0, .099, -.091, .034, .033, .039, ROND);                           // la tête
  M[M.length - 1].ombre = dessous;
  for(const s of [-1, 1]){
    boule(M, 0x0E0B0A, s * .026, .09, -.101, .007, .013, .0095);                    // un grand oeil brillant
    boule(M, 0xFFFFFF, s * .031, .098, -.104, .0028, .0034, .0028, BOULE_P);         // son reflet
    const m1 = V(s * .013, .081, -.124), m2 = V(s * .011, .071, -.136), m3 = V(s * .005, .064, -.131);   // la mandibule en crochet
    pilule(M, sombre, m1, m2, .0062); pilule(M, sombre, m2, m3, .0042);
    const a = V(s * .012, .122, -.096), c = V(s * .04, .17, -.12), b = V(s * .075, .152, -.168);   // l'antenne coudée
    pilule(M, noir, a, c, .0046);
    pilule(M, noir, c, b, .0042);
    ovale(M, noir, b.clone().add(c.clone().sub(b).setLength(.006)), b.clone().sub(c), .015, .0085, .0085);   // sa massue
    /* les pattes : attache, genou, cheville, pied ; le trépied : devant et derrière d'un côté, le milieu de l'autre */
    for(const [k, [h, g, p, f]] of [
      [V(s * .012, .064, -.032), V(s * .042, .066, -.07), V(s * .058, .018, -.098), V(s * .063, .005, -.106)],   // devant
      [V(s * .016, .06, -.015), V(s * .056, .058, -.014), V(s * .078, .016, -.006), V(s * .084, .005, -.003)], // milieu
      [V(s * .014, .061, .002), V(s * .05, .062, .044), V(s * .07, .016, .088), V(s * .074, .005, .095)]         // derrière
    ].entries()){
      const P = T[(k + (s > 0 ? 1 : 0)) % 2];
      pilule(P, patte, h, g, .0082);                                                // la cuisse
      const t = g.clone().lerp(p, .62);
      pilule(P, patte, g, t, .0068);                                                // la jambe
      pilule(P, patte, t, p, .0058);                                                // le tarse
      ovale(P, pied, f, f.clone().sub(p).setY(0), .015, .0095, .0058);              // le pied rond
      P.nb = (P.nb || 0) + 1;
    }
  }
  const [corps, ...trepieds] = [M, ...T].map(m => { const g = fusionner(m); g.translate(0, -.03 / ECHELLE_FOURMI, 0); return g; });
  return FOURMI = {corps, trepieds, nb: T.map(t => t.nb)};
}
export function fourmiModele(){
  const G = fourmiGeos(), g = new THREE.Group(), mat = corpsMat();
  g.add(new THREE.Mesh(G.corps, mat));
  g.userData.pattes = G.trepieds.map((geo, k) => { const mesh = new THREE.Mesh(geo, mat); g.add(mesh); return {mesh, phase: k * Math.PI, nb: G.nb[k]}; });
  g.userData.pas = {avance: .009, leve: .007, foulee: .037};   // le balancement, la hauteur du pas (mesures du modèle) ; la foulée (en P)
  g.userData.ailes = [];
  return g;
}

/* ---------- La coccinelle à sept points ----------
   D'après l'image de Yo (26 octobre 2026 : « La coccinelle »), mais comme une vraie (décisions de Yo : « 7 comme une
   vraie », « les antennes comme une vraie », « Pour chaque insectes tu dois faire comme un vrai ») : deux élytres rouges
   bombés, fendus au milieu, sept points noirs (trois sur chacun, un à cheval sur la fente derrière le corselet) ; le
   corselet noir aux deux taches crème ; la tête noire aux grands yeux brillants ; des antennes courtes et noires à
   petite massue ; six pattes noires en deux trépieds qui marchent (comme la fourmi). Pour s'envoler (accord de Yo), elle
   lève ses élytres (userData.elytres : {pivot, cote}) et déplie ses fines ailes cachées dessous, qui battent
   (userData.ailes, invisibles au repos). Les pieds sont à son point de pose (la fleur, l'écorce). */
const ECHELLE_COCCINELLE = 1.36;
const ROUGE = [222, 58, 40], POINT = [36, 29, 27];
/* les sept points, en directions sur la demi-boule (avant vers −z) et leur rayon (en angle) */
const POINTS_COCCI = [[0, .8, -.6, .17]];
for(const s of [-1, 1]) POINTS_COCCI.push([s * .6, .55, -.58, .15], [s * .62, .72, .1, .22], [s * .42, .5, .75, .17]);
/* la peinture d'un élytre, pixel par pixel : chaque pixel retrouve son point de la demi-boule (comme SphereGeometry) */
function texElytre(cote, W = 128, H = 64){
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), im = c.createImageData(W, H);
  const n = POINTS_COCCI.map(([x, y, z, r]) => [V(x, y, z).normalize(), r]);
  for(let py = 0; py < H; py++) for(let px = 0; px < W; px++){
    const phi = (cote > 0 ? Math.PI / 2 : Math.PI * 1.5) + (px + .5) / W * Math.PI, th = (py + .5) / H * Math.PI / 2;
    const d = V(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th));
    let k = 0;
    for(const [m, r] of n) k = Math.max(k, Math.min(1, Math.max(0, (r - Math.acos(Math.min(1, d.dot(m)))) / .025)));
    const fente = Math.abs(d.x) < .025 ? .55 : 1;                               // la fente entre les élytres, plus sombre
    const o = (py * W + px) * 4;
    for(let j = 0; j < 3; j++) im.data[o + j] = (ROUGE[j] + (POINT[j] - ROUGE[j]) * k) * (k > .5 ? 1 : fente);
    im.data[o + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
  return t;
}
/* une patte en trois pilules et son pied rond, rangée dans son trépied P */
function patteEn(P, h, g, p, f, r, cPatte, cPied){
  pilule(P, cPatte, h, g, r);
  const t = g.clone().lerp(p, .62);
  pilule(P, cPatte, g, t, r * .83);
  pilule(P, cPatte, t, p, r * .7);
  ovale(P, cPied, f, f.clone().sub(p).setY(0), r * 1.8, r * 1.15, r * .7);
  P.nb = (P.nb || 0) + 1;
}
/* les fines ailes de vol : brun clair transparent, nervurées */
const AILE_COCCI = lisse([[0, 0], [.06, -.018], [.13, -.008], [.175, .03], [.145, .062], [.07, .05], [.02, .022]]);
const BC = [-.01, -.03, .2, .1];
let COCCI = null;
function coccinelleGeos(){
  if(COCCI) return COCCI;
  const M = [], T = [[], []], noir = 0x2B2523, creme = 0xEFE2C2, oeil = 0x161010;
  const dessous = (x, y, z) => .8 + .2 * Math.min(1, Math.max(0, (y - .02) / .06));
  boule(M, 0x231E1C, 0, .036, .03, .068, .024, .078);                              // le ventre, sous les élytres
  boule(M, noir, 0, .064, -.05, .058, .038, .03, ROND);                             // le corselet
  M[M.length - 1].ombre = dessous;
  boule(M, noir, 0, .055, -.077, .034, .031, .028, ROND);                           // la tête
  M[M.length - 1].ombre = dessous;
  for(const s of [-1, 1]){
    boule(M, creme, s * .037, .07, -.06, .022, .024, .015);                          // la tache crème du corselet
    boule(M, oeil, s * .026, .058, -.091, .016, .02, .016);                          // un grand oeil brillant
    boule(M, 0xFFFFFF, s * .033, .069, -.101, .0036, .0044, .0036, BOULE_P);         // son reflet
    const a = V(s * .013, .074, -.096), b = V(s * .025, .086, -.113);                // l'antenne courte, à petite massue
    pilule(M, noir, a, b, .0026);
    ovale(M, noir, b.clone().add(b.clone().sub(a).setLength(.003)), b.clone().sub(a), .007, .0042, .0042);
    for(const [k, [h, g, p, f]] of [
      [V(s * .025, .03, -.04), V(s * .062, .034, -.062), V(s * .066, .008, -.084), V(s * .069, .005, -.092)],   // devant
      [V(s * .03, .028, 0), V(s * .078, .032, .002), V(s * .088, .008, .004), V(s * .092, .005, .006)],          // milieu
      [V(s * .03, .028, .035), V(s * .07, .032, .052), V(s * .08, .008, .068), V(s * .084, .005, .075)]        // derrière
    ].entries()) patteEn(T[(k + (s > 0 ? 1 : 0)) % 2], h, g, p, f, .0098, noir, 0x1E1A18);
  }
  const [corps, ...trepieds] = [M, ...T].map(fusionner);                           // les pieds sont à y = 0
  /* les élytres : une demi-boule de chaque côté, autour du pivot de la charnière (devant, en haut de la fente) */
  const elytre = cote => { const g = new THREE.SphereGeometry(1, 18, 9, cote > 0 ? Math.PI / 2 : Math.PI * 1.5, Math.PI, 0, Math.PI / 2);
    g.scale(.086, .118, .094); g.translate(cote * .0008, .031 - .12, .03 + .045); return g; };
  COCCI = {corps, trepieds, nb: T.map(t => t.nb), elytres: [elytre(1), elytre(-1)], tex: [texElytre(1), texElytre(-1)],
    ailes: [aileGeo(AILE_COCCI, 1, BC), aileGeo(AILE_COCCI, -1, BC)],
    aileTex: peinture(BC, c => {
      trace(c, AILE_COCCI); c.fillStyle = "rgba(226,206,168,.5)"; c.fill();
      c.save(); trace(c, AILE_COCCI); c.clip(); c.lineCap = "round";
      for(let k = 3; k < AILE_COCCI.length; k += 7){ const [x, z] = AILE_COCCI[k];
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(x * .5, z * .3, x * .95, z * .95);
        c.strokeStyle = "rgba(120,88,60,.55)"; c.lineWidth = .003; c.stroke(); }
      c.restore();
      c.save(); trace(c, AILE_COCCI); c.strokeStyle = "rgba(120,88,60,.6)"; c.lineWidth = .003; c.stroke(); c.restore();
    })};
  return COCCI;
}
export function coccinelleModele(){
  const G = coccinelleGeos(), g = new THREE.Group(), mat = corpsMat();
  g.add(new THREE.Mesh(G.corps, mat));
  g.userData.pattes = G.trepieds.map((geo, k) => { const mesh = new THREE.Mesh(geo, mat); g.add(mesh); return {mesh, phase: k * Math.PI, nb: G.nb[k]}; });
  g.userData.pas = {avance: .007, leve: .006, foulee: .044};
  g.userData.elytres = [1, -1].map((cote, k) => { const pivot = new THREE.Group();
    pivot.add(new THREE.Mesh(G.elytres[k], toon({map: G.tex[k], side: THREE.DoubleSide})));
    pivot.position.set(0, .12, -.045); g.add(pivot); return {pivot, cote}; });
  g.userData.ailes = [1, -1].map((cote, k) => { const pivot = new THREE.Group();
    pivot.add(new THREE.Mesh(G.ailes[k], aileMat(G.aileTex)));
    pivot.position.set(cote * .012, .1, -.03); pivot.rotation.y = -cote * .2; pivot.visible = false;   // tournées vers l'arrière
    g.add(pivot); return {pivot, cote}; });
  return g;
}

/* ---------- L'abeille à miel ----------
   D'après l'image de Yo (26 octobre 2026 : « Voici l'abeille »), mais comme une vraie abeille à miel (Yo : « Une vraie
   abeille à miel », « pas de pelotes de pollen », « elle se pose ») : plus fine que l'image (qui ressemble à un bourdon),
   la tête sombre aux grands yeux, des antennes coudées et sombres ; le thorax brun au duvet doré ; l'abdomen doré,
   allongé, à bandes brun foncé, plus sombre vers le bout, un petit dard ; six pattes brun sombre, celles de derrière
   élargies (là où une vraie range son pollen) ; deux paires d'ailes transparentes, nervurées, qui battent en vol et se
   replient à plat sur le dos quand elle se pose (userData.replie : l'angle, qu'insectes.js applique). Les pieds sont à
   son point de pose (la fleur). */
const ECHELLE_ABEILLE = 2.2, HA = .06;                                         // HA : les pieds à y = 0
const ABDO = new THREE.SphereGeometry(1, 14, 24).rotateX(Math.PI / 2);         // ses pôles le long du corps : des bandes nettes
const AILE_AV = lisse([[0, 0], [.05, -.013], [.11, -.009], [.142, .012], [.122, .035], [.06, .03], [.015, .012]]);
const AILE_AR = lisse([[0, .004], [.05, .01], [.086, .028], [.077, .047], [.036, .04], [.01, .02]]);
const BAV = [-.01, -.02, .16, .065], BAR = [-.01, -.005, .105, .06];
function aileAbeille(B, contour, cellules){
  return peinture(B, c => {
    trace(c, contour); c.fillStyle = "rgba(232,226,214,.3)"; c.fill();
    c.save(); trace(c, contour); c.clip(); c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "rgba(150,108,58,.42)"; c.lineWidth = .0016;
    for(const l of cellules){ c.beginPath(); l.forEach(([x, z], k) => k ? c.lineTo(x, z) : c.moveTo(x, z)); c.stroke(); }
    c.restore();
    c.save(); trace(c, contour); c.strokeStyle = "rgba(160,118,64,.7)"; c.lineWidth = .003; c.stroke(); c.restore();
  });
}
let ABEILLE = null;
function abeilleGeos(){
  if(ABEILLE) return ABEILLE;
  const M = [], tete = 0x33261C, brun = 0x5A3E24, dore = 0xD9A13A, fonce = 0x3E2A1A, clair = 0xEBC57A, patte = 0x2C1F16, oeil = 0x140E0B;
  const P = (x, y, z) => V(x, y + HA, z);
  const dessous = (x, y, z) => .8 + .2 * Math.min(1, Math.max(0, (y - HA + .03) / .06));
  /* l'abdomen, un peu penché, ses bandes : doré devant, bordé de brun foncé et d'une frange de poils clairs, sombre au bout */
  const axe = V(0, -.18, 1).normalize(), centre = P(0, -.006, .045), L = .058;
  const bandes = (x, y, z) => { const t = ((z - centre.z) * axe.z + (y - centre.y) * axe.y) / L;
    return t < -.5 ? dore : t < -.38 ? fonce : t < -.32 ? clair : t < -.08 ? dore : t < .06 ? fonce : t < .12 ? clair : t < .3 ? 0xC08A30
      : t < .46 ? fonce : t < .52 ? 0xB48A4A : fonce; };
  ovale(M, dore, centre, axe, L, .031, .029, {geo: ABDO, couleur: bandes, ombre: dessous});
  boule(M, fonce, 0, -.013 + HA, .104, .004, .004, .006, BOULE_P);                    // le dard
  boule(M, brun, 0, HA, -.03, .029, .029, .031, ROND);                                // le thorax
  M[M.length - 1].ombre = dessous;
  for(let k = 0; k < 26; k++){                                                    // son duvet doré
    const a = k * 2.39996, h = (k / 26) * 1.6 - .6, r = Math.sqrt(1 - h * h);
    boule(M, k % 3 ? 0x9C7440 : 0x7E5A32, Math.cos(a) * r * .027, h * .027 + HA + .002, -.03 + Math.sin(a) * r * .029, .0065, .005, .0065, POIL);
  }
  boule(M, tete, 0, -.002 + HA, -.072, .026, .027, .02, ROND);                       // la tête, sombre
  M[M.length - 1].ombre = dessous;
  boule(M, 0x8A6A44, 0, -.008 + HA, -.088, .012, .01, .006);                          // le front velu
  for(const s of [-1, 1]){
    boule(M, oeil, s * .02, .001 + HA, -.075, .011, .019, .014);                     // un grand oeil sur le côté
    boule(M, 0xFFFFFF, s * .027, .01 + HA, -.081, .003, .0036, .003, BOULE_P);        // son reflet
    const a = P(s * .007, .012, -.088), c = P(s * .011, .038, -.1), b = P(s * .03, .046, -.13);   // l'antenne coudée
    pilule(M, tete, a, c, .0026);
    pilule(M, tete, c, b, .0023);
    for(const [h, g, p, f, ar] of [
      [P(s * .012, -.02, -.042), P(s * .035, -.028, -.06), P(s * .045, -.056, -.072), P(s * .047, -.058, -.078), false],   // devant
      [P(s * .016, -.022, -.028), P(s * .05, -.028, -.025), P(s * .066, -.056, -.022), P(s * .068, -.058, -.018), false],  // milieu
      [P(s * .015, -.022, -.016), P(s * .05, -.026, .02), P(s * .064, -.056, .05), P(s * .067, -.058, .057), true]         // derrière
    ]){
      patteEn(M, h, g, p, f, .0045, patte, patte);
      if(ar) ovale(M, patte, g.clone().lerp(p, .45), p.clone().sub(g), .016, .0035, .008);   // la patte de derrière, élargie
    }
  }
  const nerv = {av: [[[0, 0], [.13, .005]], [[.02, .002], [.06, .028], [.1, .026], [.13, .012]], [[.06, .006], [.07, .028]], [[.09, .004], [.1, .026]], [[.04, -.008], [.11, -.004]]],
                ar: [[[0, .004], [.075, .035]], [[.03, .012], [.035, .038]], [[.05, .02], [.065, .044]]]};
  return ABEILLE = {corps: fusionner(M), av: aileAbeille(BAV, AILE_AV, nerv.av), ar: aileAbeille(BAR, AILE_AR, nerv.ar),
    ailes: [1, -1].map(cote => { const ar = aileGeo(AILE_AR, cote, BAR, 3); ar.translate(0, -.003, .012); return [aileGeo(AILE_AV, cote, BAV, 3), ar]; })};   // des ailes plates : 3 rangs suffisent
}
export function abeilleModele(){
  const G = abeilleGeos(), g = new THREE.Group();
  g.add(new THREE.Mesh(G.corps, corpsMat()));
  g.userData.ailes = [1, -1].map((cote, k) => { const pivot = new THREE.Group();
    pivot.add(new THREE.Mesh(G.ailes[k][0], aileMat(G.av)), new THREE.Mesh(G.ailes[k][1], aileMat(G.ar)));
    pivot.position.set(cote * .012, .028 + HA, -.035); g.add(pivot); return {pivot, cote}; });
  g.userData.replie = 1.38;                                                      // posée, les ailes à plat sur le dos
  return g;
}

/* ---------- La grande sauterelle verte ----------
   D'après l'image de Yo (26 octobre 2026 : « Voici la sauterelle »), comme une vraie (Yo : « Les antennes comme une
   vraie », « Mélange mâle et femelle. Aléatoire dans le jeu mais aucune conséquence sur le carnet », « Oui les pattes
   arrière qui se détendent ») : tout le corps vert, le dessous jaune pâle, une fine bande brune sur le dessus du corselet
   et le long de la fente des ailes ; les ailes vertes en toit, plus longues que le corps ; des antennes en fil, plus
   longues que tout le corps ; les pattes de devant et du milieu fines ; les grandes pattes arrière, cuisses épaisses et
   jambes épineuses, dont la jambe se détend quand elle saute (userData.detente : {pivot, angle}, au genou). La femelle
   porte au bout du corps son long sabre de ponte ; le mâle non (au hasard, à chaque sauterelle). Les pieds sont au sol. */
const ECHELLE_SAUTERELLE = 1.9;
let SAUTERELLE = null;
function sauterelleGeos(){
  if(SAUTERELLE) return SAUTERELLE;
  const vert = 0x76AE3E, fonce = 0x5E9432, pale = 0xD9D98A, brun = 0x9A8448, pied = 0x7A7A34, M = [];
  const dessous = (x, y, z) => .8 + .2 * Math.min(1, Math.max(0, (y - .03) / .06));
  const dos = (c, h) => (x, y, z) => Math.abs(x) < .008 && y > h ? brun : c;                 // la bande brune du dos
  boule(M, vert, 0, .072, -.088, .024, .03, .024, ROND);                                    // la tête, haute
  M[M.length - 1].ombre = dessous;
  boule(M, 0xB8C95A, 0, .052, -.1, .012, .01, .008);                                         // la bouche, plus claire
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(0, .076, -.055), q0, V(.025, .026, .033)), c: vert, couleur: dos(vert, .096), ombre: dessous});   // le corselet en selle
  const ventre = V(0, .056, .03);                                                            // le corps : vert, le dessous pâle
  M.push({geo: ABDO, m: new THREE.Matrix4().compose(ventre, q0, V(.021, .024, .066)), c: vert,
    couleur: (x, y, z) => y < ventre.y - .006 ? pale : vert, ombre: dessous});
  for(const s of [-1, 1]){
    boule(M, 0x2E2014, s * .019, .083, -.093, .01, .013, .01);                             // un oeil
    boule(M, 0xFFFFFF, s * .024, .09, -.1, .0028, .0034, .0028, BOULE_P);                   // son reflet
    /* l'aile verte, en toit sur le dos, plus longue que le corps */
    M.push({geo: ROND, m: new THREE.Matrix4().compose(V(s * .011, .077, .05), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.08, 0, -s * .62)), V(.004, .02, .09)),
      c: fonce, couleur: (x, y, z) => Math.abs(x) < .009 && y > .084 ? brun : fonce});
    /* l'antenne en fil, plus longue que tout le corps : une courbe en petits bâtons */
    let a = V(s * .006, .094, -.099);
    for(let k = 1; k <= 9; k++){ const t = k / 9, b = V(s * (.006 + .085 * t), .094 + .3 * t - .13 * t * t, -.099 - .17 * t + .02 * t * t);
      baton(M, 0x6E9A36, a, b, .0014 - .0005 * t); a = b; }
    /* les pattes de devant et du milieu, fines */
    patteEn(M, V(s * .01, .05, -.06), V(s * .03, .062, -.078), V(s * .044, .006, -.092), V(s * .046, .004, -.098), .0034, vert, pied);
    patteEn(M, V(s * .012, .048, -.032), V(s * .04, .058, -.032), V(s * .054, .006, -.024), V(s * .056, .004, -.018), .0034, vert, pied);
    /* la cuisse arrière, épaisse, vers le haut et l'arrière */
    const hanche = V(s * .017, .054, .004), genou = V(s * .032, .128, .082);
    ovale(M, vert, hanche.clone().lerp(genou, .45), genou.clone().sub(hanche), .056, .012, .018, {geo: ROND, couleur: (x, y, z) => y < hanche.y + (genou.y - hanche.y) * ((z - hanche.z) / (genou.z - hanche.z)) - .006 ? pale : vert});
  }
  const corps = fusionner(M);
  /* la jambe arrière, épineuse, autour du genou (le pivot) : pliée vers le sol au repos */
  const jambe = cote => { const J = [], g = V(0, 0, 0), ch = V(cote * .006, -.122, .036), pd = V(cote * .008, -.124, .046);
    pilule(J, vert, g, ch, .0038); ovale(J, pied, pd, pd.clone().sub(ch).setY(0), .009, .005, .0035);
    for(let k = 1; k <= 5; k++){ const m = g.clone().lerp(ch, k / 6.5); baton(J, 0xC9B860, m.clone().add(V(0, 0, .002)), m.clone().add(V(cote * .002, .004, .008)), .0012); }   // les épines
    return fusionner(J); };
  /* le sabre de ponte de la femelle, long et droit, à peine courbé */
  const S = []; baton(S, 0x8C8C3E, V(0, .05, .088), V(0, .046, .13), .0028); baton(S, 0x8C8C3E, V(0, .046, .13), V(0, .05, .168), .0022);
  return SAUTERELLE = {corps, jambes: [jambe(1), jambe(-1)], sabre: fusionner(S)};
}
export function sauterelleModele(){
  const G = sauterelleGeos(), g = new THREE.Group(), mat = corpsMat();
  g.add(new THREE.Mesh(G.corps, mat));
  if(Math.random() < .5) g.add(new THREE.Mesh(G.sabre, mat));                              // une femelle
  g.userData.detente = [1, -1].map((cote, k) => { const pivot = new THREE.Group();
    pivot.add(new THREE.Mesh(G.jambes[k], mat)); pivot.position.set(cote * .032, .128, .082); g.add(pivot); return {pivot, angle: 1.7}; });
  g.userData.ailes = [];
  return g;
}

/* ---------- L'anax empereur (la libellule) ----------
   D'après l'image de Yo (26 octobre 2026 : « Voici la libellule »), aux couleurs de l'anax empereur (Yo : « Les couleurs
   de l'anax empereur », « Oui elle se perche sur les massettes ») : d'énormes yeux bleu-vert qui se touchent sur le dessus
   de la tête ; le thorax vert pomme ; le long abdomen bleu ciel, renflé à la base, une ligne noire sur le dessus ; quatre
   ailes transparentes, finement nervurées, une petite tache sombre près du bout (celles de derrière plus larges à la
   base), ouvertes à plat au repos, qui battent en décalé (userData.ailes : {pivot, cote, phase}) ; six pattes sombres
   ramenées sous la tête ; des antennes minuscules. Les pattes sont au point de pose (le bout d'une massette). */
const ECHELLE_LIBELLULE = 1.83, PRISE = .045;                                     // PRISE : là où ses pattes se referment, ramené au point de pose
const AILE_LAV = lisse([[0, -.006], [.06, -.014], [.14, -.012], [.19, -.004], [.188, .011], [.13, .015], [.05, .012], [0, .006]]);
const AILE_LAR = lisse([[0, -.004], [.05, -.007], [.13, -.006], [.18, .002], [.176, .018], [.11, .027], [.04, .033], [0, .012]]);
const BLAV = [-.01, -.02, .21, .04], BLAR = [-.01, -.012, .2, .05];
function aileLibellule(B, contour, tache){
  return peinture(B, c => {
    trace(c, contour); c.fillStyle = "rgba(226,232,226,.26)"; c.fill();
    c.save(); trace(c, contour); c.clip(); c.lineCap = "round";
    c.strokeStyle = "rgba(70,72,64,.28)"; c.lineWidth = .001;
    const xs = contour.map(p => p[0]), zs = contour.map(p => p[1]), z0 = Math.min(...zs), z1 = Math.max(...zs);
    for(let k = 1; k < 5; k++){ const z = z0 + (z1 - z0) * k / 5; c.beginPath(); c.moveTo(0, z * .4); c.quadraticCurveTo(.08, z, .19, z * .7); c.stroke(); }   // les nervures en long
    for(let x = .016; x < Math.max(...xs); x += .019){ c.beginPath(); c.moveTo(x, z0); c.lineTo(x + .003, z1); c.stroke(); }                     // et en travers
    c.fillStyle = "rgba(60,44,30,.9)"; c.fillRect(tache[0], tache[1], .016, .005);                                                          // la tache près du bout
    c.restore();
    c.save(); trace(c, contour); c.strokeStyle = "rgba(70,72,64,.55)"; c.lineWidth = .0018; c.stroke(); c.restore();
  });
}
let LIBELLULE = null;
function libelluleGeos(){
  if(LIBELLULE) return LIBELLULE;
  const M = [], oeil = 0x3FA4B4, vert = 0x7CC24A, bleu = 0x5AB8E6, noir = 0x1E2228, patte = 0x2A2C2E;
  const dessous = (x, y, z) => .82 + .18 * Math.min(1, Math.max(0, (y - .02) / .04));
  /* la tête : deux énormes yeux qui se touchent sur le dessus, la face vert jaune */
  for(const s of [-1, 1]){
    boule(M, oeil, s * .015, .046, -.061, .019, .021, .019, ROND); M[M.length - 1].ombre = dessous;
    boule(M, 0xFFFFFF, s * .024, .06, -.071, .0035, .004, .0035, BOULE_P);            // le reflet
  }
  boule(M, 0xB8D45A, 0, .03, -.076, .013, .012, .008);                                // la face
  for(const s of [-1, 1]) baton(M, noir, V(s * .004, .044, -.079), V(s * .007, .05, -.086), .0009);   // les antennes minuscules
  /* le thorax vert pomme, deux bandes sombres sur les côtés */
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(0, .042, -.024), q0, V(.022, .027, .03)), c: vert, ombre: dessous,
    couleur: (x, y, z) => Math.abs(x) > .016 && (Math.abs(z + .03 + (y - .04) * .5) < .003 || Math.abs(z + .014 + (y - .04) * .5) < .003) ? noir : vert});
  /* le long abdomen bleu, renflé à la base, étranglé, puis fin ; une ligne noire sur le dessus, un trait à chaque anneau */
  for(let k = 0; k < 10; k++){
    const z = .012 + k * .0215, r = k < 2 ? .0115 - k * .001 : k === 2 ? .0072 : .0078 + Math.max(0, k - 6) * .0004, y = .037 - k * .0007;
    boule(M, bleu, 0, y, z, r, r * 1.08, .0175, ROND);                                // des anneaux qui se chevauchent : un tube lisse
    M[M.length - 1].couleur = (px, py, pz) => Math.abs(px) < .0026 && py > y + r * .55 ? noir : Math.abs(pz - z - .0105) < .0012 ? 0x3A86B4 : bleu;
    M[M.length - 1].ombre = dessous;
  }
  for(const s of [-1, 1]) baton(M, noir, V(s * .002, .03, .222), V(s * .004, .03, .236), .0012);   // les petits appendices du bout
  /* six pattes sombres, ramenées vers l'avant sous la tête */
  for(const s of [-1, 1]) for(const [h, g, p] of [
    [V(s * .008, .024, -.036), V(s * .02, .014, -.05), V(s * .022, .0, -.066)],
    [V(s * .01, .022, -.026), V(s * .025, .013, -.032), V(s * .028, .0, -.044)],
    [V(s * .01, .022, -.014), V(s * .028, .013, -.012), V(s * .033, .0, -.02)]]){ pilule(M, patte, h, g, .0022); pilule(M, patte, g, p, .0018); }
  const corps = fusionner(M); corps.translate(0, 0, PRISE);                          // ses pattes agrippent le point de pose
  return LIBELLULE = {corps, av: aileLibellule(BLAV, AILE_LAV, [.158, -.012]), ar: aileLibellule(BLAR, AILE_LAR, [.148, -.005]),
    ailes: [1, -1].map(cote => [aileGeo(AILE_LAV, cote, BLAV, 3), aileGeo(AILE_LAR, cote, BLAR, 3)])};
}
export function libelluleModele(){
  const G = libelluleGeos(), g = new THREE.Group(), ailes = [];
  g.add(new THREE.Mesh(G.corps, corpsMat()));
  [1, -1].forEach((cote, k) => [[G.ailes[k][0], G.av, -.036, .14, 0], [G.ailes[k][1], G.ar, -.016, -.1, 1.6]].forEach(([geo, tex, z, vers, phase]) => {
    const pivot = new THREE.Group(); pivot.add(new THREE.Mesh(geo, aileMat(tex)));
    pivot.position.set(cote * .006, .062, z + PRISE); pivot.rotation.y = cote * vers;           // ouvertes à plat ; devant un peu vers l'avant, derrière vers l'arrière
    g.add(pivot); ailes.push({pivot, cote, phase});
  }));
  g.userData.ailes = ailes;
  return g;
}

/* Les modèles faits d'après une image : la clé de l'insecte, sa fabrique ; l'échelle (le reste suit insectes.js).
   Leur taille suit l'ordre de la nature (décision de Yo, 26 octobre 2026 : « passe les insectes à la taille réduite ») :
   la fourmi environ 0,25 P de long, la coccinelle 0,3 P, la piéride 0,4 P d'envergure. */
export const MODELES_INSECTES = {pieride: {fabrique: pierideModele, echelle: 1.52}, fourmi: {fabrique: fourmiModele, echelle: ECHELLE_FOURMI},
  coccinelle: {fabrique: coccinelleModele, echelle: ECHELLE_COCCINELLE}, abeille: {fabrique: abeilleModele, echelle: ECHELLE_ABEILLE},
  sauterelle: {fabrique: sauterelleModele, echelle: ECHELLE_SAUTERELLE}, libellule: {fabrique: libelluleModele, echelle: ECHELLE_LIBELLULE}};
