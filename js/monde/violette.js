/* ================= La violette =================
   D'après l'image de Yo (25 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image, plantée dans le sol (règle
   de Yo : jamais de tas de terre sous une fleur) : une touffe de feuilles en coeur, rondes, le bord festonné, leurs
   nervures plus claires, chacune au bout de sa longue queue ; des tiges vert olive qui montent puis se recourbent en
   crochet juste derrière la fleur ; la fleur, tournée vers l'avant : cinq pétales ronds, deux dressés derrière, deux sur
   les côtés, un grand en bas, violets (ou blancs : couleurDe), plus clairs vers le coeur, la gorge blanche rayée de
   fines veines violettes, un coeur orangé ; dans une touffe violette, un tiers des fleurs blanches, comme sur l'image ;
   des boutons qui pendent, serrés dans leurs sépales verts ; à son pied, un peu de mousse vert-jaune et deux petits
   trèfles.
   Comme dans la vraie nature : la violette fleurit au printemps ; elle garde ses feuilles toute l'année (plus grandes et
   plus sombres l'été, quelques-unes jaunies à l'automne, petites et sombres l'hiver, un peu de neige dessus quand il
   neige).
   Pour le téléphone : une forme par (saison, état, couleur, nuance, neige), partagée ; un modèle léger quand elle est
   petite à l'écran ; elle bouge un peu au vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";
import { MAT_PAQUERETTE, TIGE, BOULE, COUPE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const cT = new THREE.Color(), vL = new THREE.Vector3(), BLANC = new THREE.Color(0xFDFCF8), ORANGE = new THREE.Color(0xF29A18),
  VEINE = new THREE.Color(0x4A1E78), GORGE = new THREE.Color(0xFFFBF0);
const FEUILLES = {printemps: [0x4E8E2E, 0x5A9A36, 0x447E28], ete: [0x447E28, 0x3E7424, 0x4E8A2E],
  automne: [0x5E8A30, 0x7A8A34, 0x96903A], hiver: [0x3E6E2E, 0x36642A, 0x467634]};
const QUEUE = 0x8A9A3A, MOUSSE = [0x8CB032, 0x7AA02C, 0xA2C040];

/* une feuille en coeur : le creux à la queue (en 0), la pointe en avant (+z, longue de 1), large de 0,85 ; le bord festonné,
   relevé en coupe ; la nervure du milieu et ses nervures plus claires (l'attribut « teinte ») */
function coeurGeo(n, leger){
  const s = new THREE.Shape();
  for(let k = 0; k <= n; k++){
    /* presque ronde, le creux du coeur à la queue (a = 0), une pointe à peine marquée au bout (a = π), le bord festonné */
    const a = k / n * Math.PI * 2, f = 1 + (leger ? 0 : .014 * Math.sin(a * 18)), d = Math.min(a, Math.PI * 2 - a);
    const x = .44 * Math.sin(a) * f, z = (.46 - .46 * Math.cos(a)) * f + .2 * Math.exp(-((d / .38) ** 2)) + .07 * Math.exp(-(((a - Math.PI) / .45) ** 2)) - .02;
    k ? s.lineTo(x, z) : s.moveTo(x, z);
  }
  const g = new THREE.ShapeGeometry(s, leger ? 2 : 6), p = g.attributes.position, te = [];
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), z = p.getY(i);
    p.setXYZ(i, x, .2 * x * x + .05 * Math.max(0, z - .5) ** 2 * 0 - .03 * z * z, z);        // relevée sur les bords, la pointe un peu baissée
    const ax = Math.abs(x), nerv = ax < .025 ? 1.14 : Math.abs(Math.sin(Math.atan2(ax, z + .1) * 5)) < .12 ? 1.08 : 1;
    te.push(nerv * (.86 + .14 * Math.min(1, Math.hypot(x, z) * 2)));
  }
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.computeVertexNormals();
  return g;
}
const COEUR_F = coeurGeo(64, false), COEUR_F_LEGER = coeurGeo(20, true);
/* un pétale : un disque bombé, de 0 à 1 le long de +x, large de 0,8 */
const PETALE = (() => { const g = new THREE.SphereGeometry(1, 10, 6); g.scale(.5, .07, .4); g.translate(.5, 0, 0); return g; })();
const PETALE_LEGER = (() => { const g = new THREE.SphereGeometry(1, 6, 3); g.scale(.5, .07, .4); g.translate(.5, 0, 0); return g; })();
const BRIN = new THREE.IcosahedronGeometry(1, 1);

/* une tige qui monte de pied à haut, puis se recourbe en crochet (le bout tourné vers dirFin) : des petits bouts de tige */
function tigeCrochet(M, pied, haut, dirFin, vert, n){
  const pts = [];
  const ctrl = haut.clone().add(V(0, .05, 0));
  for(let k = 0; k <= n; k++){
    const t = k / n, a = pied.clone().lerp(ctrl, t), b = ctrl.clone().lerp(haut.clone().addScaledVector(dirFin, .03), t);
    pts.push(a.lerp(b, t));
  }
  for(let k = 0; k < n; k++){
    const d = pts[k + 1].clone().sub(pts[k]);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(pts[k], new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), V(.0042, d.length() * 1.05, .0042)), c: vert});
  }
  return pts[n];
}
/* une fleur ouverte en ctr, tournée vers dir : cinq pétales ; base : sa couleur (violette ou blanche) */
function fleur(M, ctr, dir, base, leger, alea, s = 1){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir), blanche = base.getHex() === 0xF4F0E8;
  const coul = blanche ? BLANC : base, R = .052 * s;
  /* angle autour de la fleur (0 = vers le haut), longueur, et si c'est le pétale du bas (la gorge et ses veines) */
  const P = [[-.55, 1.05, 0], [.55, 1.05, 0], [-1.72, .95, 1], [1.72, .95, 1], [Math.PI, 1.12, 2]];
  P.forEach(([a, l, sorte], k) => {
    const dirP = V(Math.sin(a), Math.cos(a), 0);
    const qp = q.clone().multiply(new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), dirP)).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2));
    const m = new THREE.Matrix4().compose(ctr.clone().addScaledVector(dir, (k < 2 ? -.004 : .002) * s), qp, V(R * l, R * l, R * l)), inv = m.clone().invert();
    M.push({geo: leger ? PETALE_LEGER : PETALE, m, couleur: (x, y, z) => {
      vL.set(x, y, z).applyMatrix4(inv);
      const t = vL.x, w = vL.z;                                     // t de 0 (coeur) à 1 (bout) ; w en travers
      cT.copy(coul).lerp(blanche ? cT.set(0xFDFCF8) : BLANC, sorte ? Math.max(0, .55 - t) * 1.4 : Math.max(0, .35 - t) * 1.2);
      if(sorte && t < .5 && !leger){                                // la gorge blanche et ses fines veines violettes
        cT.lerp(GORGE, Math.max(0, .5 - t) * 1.6);
        if(Math.abs(Math.sin(w * (sorte === 2 ? 34 : 26))) < .22 && t > .08) cT.lerp(VEINE, (.5 - t) * 1.5);
      }
      if(blanche && t > .3 && sorte === 0) cT.lerp(new THREE.Color(0xE6DDF2), (t - .3) * .5);    // le dos des pétales blancs à peine mauve
      return cT;
    }});
  });
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(ctr.clone().addScaledVector(dir, .006 * s), q, V(.011 * s, .011 * s, .009 * s)), c: ORANGE.getHex()});
}
/* un bouton qui pend : une goutte serrée dans ses sépales verts */
function bouton(M, haut, base){
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().add(V(0, -.03, 0)), new THREE.Quaternion(), V(.019, .034, .019)),
    couleur: (x, y, z) => cT.copy(base.getHex() === 0xF4F0E8 ? new THREE.Color(0xE8DCF0) : base).lerp(VEINE, Math.max(0, (haut.y - .04 - y) / .03) * .3)});
  M.push({geo: COUPE, m: new THREE.Matrix4().compose(haut.clone().add(V(0, -.008, 0)), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI), V(.022, .02, .022)), c: 0x7E9A3A});
}
function touffe(saison, etat, base, variante, leger, neige){
  const tons = FEUILLES[saison] || FEUILLES.printemps, alea = aleaDe(9931 + variante * 53), M = [];
  /* la mousse et les deux petits trèfles, à son pied */
  for(let k = 0; k < (leger ? 4 : 11); k++){
    const a = k * 2.39996 + alea() * .3, r = .06 + .1 * Math.sqrt((k + .5) / 11), c = V(Math.cos(a) * r, 0, Math.sin(a) * r);
    for(let j = 0; j < (leger ? 2 : 6); j++){
      const e = .006 + alea() * .005;
      M.push({geo: BRIN, m: new THREE.Matrix4().compose(c.clone().add(V((alea() - .5) * .05, alea() * .008, (alea() - .5) * .05)), new THREE.Quaternion(), V(e, e * 1.6, e)), c: MOUSSE[(k + j) % 3]});
    }
  }
  if(!leger && saison !== "hiver") [[.1, .13], [-.12, .1]].forEach(([x, z]) => {
    const pied = V(x, 0, z), haut = V(x, .035, z);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(pied, new THREE.Quaternion(), V(.003, .035, .003)), c: 0x6A9A34});
    for(let k = 0; k < 3; k++){
      const a = k / 3 * Math.PI * 2, d = V(Math.cos(a), 0, Math.sin(a));
      M.push({geo: COEUR_F_LEGER, m: new THREE.Matrix4().compose(haut, new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), d), V(.022, .022, .022)), c: 0x5E9A34});
    }
  });
  /* les feuilles en coeur, au bout de leur queue : de plus en plus couchées vers l'extérieur */
  const grand = saison === "ete" ? 1.15 : saison === "hiver" ? .8 : 1, taille = etat === 0 ? .5 : 1;
  const nf = etat === 0 ? 4 : leger ? 10 : 26;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4, vers = V(Math.cos(b), 0, Math.sin(b));
    const r = (.05 + .12 * t) * taille * grand, h = (.21 - .15 * t + alea() * .03) * taille * grand, L = (.13 + .035 * alea()) * taille * grand;
    const attache = V(vers.x * r, h, vers.z * r), pied = V(vers.x * .02, 0, vers.z * .02);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(pied, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), attache.clone().sub(pied).normalize()), V(.005, attache.distanceTo(pied), .005)), c: QUEUE});
    /* le limbe : vers l'extérieur et vers le haut (les feuilles du coeur plus dressées), sa face tournée vers le ciel */
    const e = (1.15 - .95 * t + (alea() - .5) * .2), dirL = vers.clone().multiplyScalar(Math.cos(e)).add(V(0, Math.sin(e), 0));
    const Yn = vers.clone().multiplyScalar(-Math.sin(e)).add(V(0, Math.cos(e), 0)), Xn = Yn.clone().cross(dirL);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Xn, Yn, dirL)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), (alea() - .5) * .3));
    const jaunie = saison === "automne" && alea() < .15;
    M.push({geo: leger ? COEUR_F_LEGER : COEUR_F, m: new THREE.Matrix4().compose(attache, q, V(L, L, L)), c: jaunie ? 0xB8A040 : tons[alea() < .5 ? 0 : alea() < .5 ? 1 : 2]});
  }
  if(neige && !leger) for(const [x, z, r] of [[0, .05, .05], [-.09, -.02, .04], [.08, -.05, .04]])
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, .13, z), new THREE.Quaternion(), V(r, r * .35, r)), c: 0xF4F8FA});
  if(etat === 2){
    /* les fleurs : tournées vers l'avant, au bout de leur crochet ; dans une touffe violette, un tiers blanches */
    const violette = base.getHex() !== 0xF4F0E8, blanc = new THREE.Color(0xF4F0E8);
    [[0, .03, .3, 1.1], [-.12, .02, .25, 1], [.12, .05, .26, 1], [-.05, .1, .22, .95], [.07, -.04, .33, 1], [-.15, -.03, .3, .95], [.15, -.02, .2, .9]]
      .slice(0, leger ? 4 : 7).forEach(([x, z, h, s], k) => {
        const ctr = V(x * 1.2, h, z + .08), dir = V(x * 1.5, .6, 1).normalize();
        tigeCrochet(M, V(x * .25, 0, z * .25), ctr.clone().addScaledVector(dir, -.035), dir, QUEUE, leger ? 3 : 7);
        fleur(M, ctr, dir, violette && (k === 1 || k === 4) ? blanc : base, leger, alea, s * 1.25);
      });
    if(!leger) [[-.18, .08, .2], [.17, .1, .22], [.02, -.08, .26], [-.08, -.1, .2]].forEach(([x, z, h]) => {
      const haut = V(x, h, z), dirFin = V(x * 3, -1, z * 3).normalize();
      tigeCrochet(M, V(x * .25, 0, z * .25), haut, dirFin, QUEUE, 6);
      bouton(M, haut, base);
    });
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, couleur, variante, neige){
  const base = couleur === undefined ? 0x7A3AB8 : couleur, cle = [saison, etat, base, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, new THREE.Color(base), variante, false, neige), loin: touffe(saison, etat, new THREE.Color(base), variante, true, neige)});
  return CACHE.get(cle);
}
/* La violette : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; couleur : violette ou blanche (couleurDe) ;
   r : son tirage (nuance, taille, sens) ; neige : il neige (un peu de neige sur ses feuilles, l'hiver) */
export function violetteModele(saison, etat, couleur, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, couleur, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;
  g.scale.setScalar(.95 + r * .2);
  g.userData.violette = {saison, etat};
  return g;
}
