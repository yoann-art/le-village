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
const ECHELLE_FOURMI = 1.8, ROND = new THREE.SphereGeometry(1, 14, 10), BOUT = new THREE.SphereGeometry(1, 6, 4);
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
  g.userData.pas = {avance: .009, leve: .007, foulee: .07};   // le balancement, la hauteur du pas (mesures du modèle) ; la foulée (en P)
  g.userData.ailes = [];
  return g;
}

/* Les modèles faits d'après une image : la clé de l'insecte, sa fabrique ; l'échelle (le reste suit insectes.js) */
export const MODELES_INSECTES = {pieride: {fabrique: pierideModele, echelle: 1.9}, fourmi: {fabrique: fourmiModele, echelle: ECHELLE_FOURMI}};
