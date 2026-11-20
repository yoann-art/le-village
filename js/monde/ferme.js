/* ================= La Ferme, niveau 1 =================
   D'après l'image de Yo (20 novembre 2026 : « Voici la ferme »), au plus près de l'image : la maison de planches debout couleur
   miel, ses poteaux d'angle et ses poutres, sur un socle de pierres grises ; le pignon de devant, ses planches, sa poutre et ses
   contrefiches en V ; le grand toit de chaume en rangs d'écailles, son gros rondin de faîte serré de deux liens, son bout rond et
   ses cernes devant ; la cheminée de pierre derrière à droite ; la porte de planches au haut arrondi dans son cadre en arc, ses
   deux pentures de fer, son anneau, son seuil ; la lanterne pendue sous le pignon ; deux fenêtres allumées à quatre carreaux
   dans leur cadre épais (devant à gauche, sur le côté droit) ; la botte de foin ronde cerclée devant à gauche ; la barrière
   basse de chaque côté, ses poteaux ronds et ses deux lisses ; des touffes d'herbe (sans tas de terre). La nuit, les fenêtres
   et la lanterne brillent plus fort.
   Coordonnées : le milieu du carré de 5 × 5 en (0, 0), la façade en z = FACADE, la porte au milieu (B.ferme.door = 0).
   Les niveaux 2 et 3 gardent cette allure en attendant leurs images. */
import { G, part, toon } from "./formes.js";
import { lanterne } from "./ciel.js";

export const FACADE = 1.15;
const BOIS = [0xD48A3E, 0xDE9848, 0xC97C34], CLAIR = 0xE9AD62, FONCE = 0xA8642A, POUTRE = 0xC4752F, CERNE = 0xC0763A, PORTE_C = 0xB8612E,
  FER = 0x4A4248, PAILLE = [0xF2B83E, 0xF6C650, 0xEBAA34], PAILLE_S = 0xD8962C, CORDE = 0xA05A28, FOIN = 0xF0BE48, FOIN_S = 0xDCA43A,
  PIERRE = [0xA9A29B, 0xB8B0A6, 0x9C958E, 0xC2BAAF], HERBE = [0x7DB54A, 0x8FC458], BARRIERE = [0xCF7E36, 0xDB8C40];
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
const VITRE = toon({color: 0xFFD868, emissive: 0xFFA630, emissiveIntensity: .7});
for(const m of [LUEUR, VITRE]) lanterne(null, 0, 0, m);

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
/* une boîte aux coins ronds (les pierres, les bottes de chaume) */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(8, 6, .28), ROND = new THREE.CylinderGeometry(.5, .5, 1, 12), ECAILLE = new THREE.SphereGeometry(.5, 10, 5),
  DISQUE = new THREE.CylinderGeometry(.5, .5, 1, 14), ARC = new THREE.TorusGeometry(1, .16, 6, 14, Math.PI), DEMI = new THREE.CylinderGeometry(.5, .5, 1, 14, 1, false, -Math.PI / 2, Math.PI);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0) => { const m = ajoute(g, part(BLOC, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 29;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

/* la maison : de X0 à X1, de Z0 (l'arrière) à FACADE ; les murs jusqu'à HM ; le faîte d'avant en arrière en x = 0, à HR */
const X0 = -1.75, X1 = 1.75, Z0 = -1.85, SOCLE = .3, HM = 2.05, HR = 3.55, AV = .32;
const PENTE = (HR - HM) / (X1 + AV), PORTE_W = .82, PORTE_H = 1.5;

/* le socle : des pierres grises de a à b, le long de x (en z) ou de z (en x) */
function socle(g, a, b, fixe, le, devant){
  let u = a;
  while(u < b - .03){
    const l = Math.min(b - u, .38 + hasard() * .3), ll = b - u - l < .2 ? b - u : l, c = u + ll / 2;
    if(le === "x") bloc(g, pierre(), ll - .04, SOCLE, .3, c, SOCLE / 2, fixe + devant * .04, (hasard() - .5) * .04);
    else bloc(g, pierre(), .3, SOCLE, ll - .04, fixe + devant * .04, SOCLE / 2, c, (hasard() - .5) * .04);
    u += ll;
  }
}
/* des planches debout de a à b (le long de x ou de z), du socle à haut(u), sauf les trous [u0, u1, y0, y1] */
function planches(g, a, b, fixe, le, haut, trous = [], dehors = 1){
  const n = Math.round((b - a) / .24), l = (b - a) / n;
  for(let k = 0; k < n; k++){
    const u = a + (k + .5) * l, h = typeof haut === "function" ? haut(u) : haut;
    let morceaux = [[SOCLE - .02, h]];
    for(const [u0, u1, y0, y1] of trous) if(u > u0 && u < u1) morceaux = morceaux.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of morceaux) if(q - p > .04){
      if(le === "x") boite(g, ton(k), l - .025, q - p, .08, u, (p + q) / 2, fixe + dehors * .02);
      else boite(g, ton(k), .08, q - p, l - .025, fixe + dehors * .02, (p + q) / 2, u);
    }
  }
}
function murs(g){
  /* le cœur, qui comble tout derrière les planches */
  boite(g, FONCE, X1 - X0 - .12, HM - .1, FACADE - Z0 - .12, 0, HM / 2, (FACADE + Z0) / 2);
  socle(g, X0 - .08, X1 + .08, FACADE, "x", 1); socle(g, Z0, FACADE, X0, "z", -1); socle(g, Z0, FACADE, X1, "z", 1);
  const FG = {x: -1.08, y: 1.3, w: .62, h: .58}, FD = {z: -.35, y: 1.3, w: .62, h: .58};
  planches(g, X0, X1, FACADE, "x", HM, [[-PORTE_W / 2 - .12, PORTE_W / 2 + .12, 0, PORTE_H + .5], [FG.x - FG.w / 2 - .1, FG.x + FG.w / 2 + .1, FG.y - FG.h / 2 - .1, FG.y + FG.h / 2 + .1]]);
  planches(g, Z0, FACADE, X1, "z", HM, [[FD.z - FD.w / 2 - .1, FD.z + FD.w / 2 + .1, FD.y - FD.h / 2 - .1, FD.y + FD.h / 2 + .1]]);
  planches(g, Z0, FACADE, X0, "z", HM, [], -1);
  planches(g, X0, X1, Z0, "x", HM, [], -1);
  /* les poteaux d'angle, la sablière (la poutre en haut des murs) et la lisse basse */
  for(const [x, z] of [[X0, FACADE], [X1, FACADE], [X0, Z0], [X1, Z0]]) boite(g, POUTRE, .22, HM - SOCLE + .05, .22, x, (HM + SOCLE) / 2, z);
  boite(g, POUTRE, X1 - X0 + .3, .2, .2, 0, HM - .04, FACADE + .06);
  boite(g, POUTRE, .2, .2, FACADE - Z0 + .2, X1 + .06, HM - .04, (FACADE + Z0) / 2);
  boite(g, POUTRE, .2, .2, FACADE - Z0 + .2, X0 - .06, HM - .04, (FACADE + Z0) / 2);
  boite(g, POUTRE, X1 - X0 + .1, .14, .14, 0, SOCLE + .05, FACADE + .07);
  fenetre(g, FG.x, FG.y, FACADE + .07, FG.w, FG.h, 0);
  fenetre(g, X1 + .07, FD.y, FD.z, FD.w, FD.h, Math.PI / 2);
}
/* une fenêtre allumée : la vitre, ses quatre carreaux, son cadre épais de planches et son appui */
function fenetre(g, x, y, z, w, h, ry){
  const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.y = ry; g.add(f);
  ajoute(f, part(G.box, VITRE, w, h, .04, 0, 0, -.04));
  boite(f, FONCE, .05, h, .05, 0, 0, -.01); boite(f, FONCE, w, .05, .05, 0, 0, -.01);
  for(const [ww, hh, dx, dy] of [[w + .26, .13, 0, h / 2 + .06], [w + .26, .13, 0, -h / 2 - .06], [.13, h + .12, -w / 2 - .06, 0], [.13, h + .12, w / 2 + .06, 0]])
    boite(f, POUTRE, ww, hh, .12, dx, dy, .02);
  boite(f, CLAIR, w + .42, .1, .2, 0, -h / 2 - .16, .06);
}
/* le pignon de devant : les planches debout sous le toit, la poutre, les contrefiches en V, les rives */
function pignon(g){
  const z = FACADE + .04, toit = x => HR - .12 - PENTE * Math.abs(x);
  const n = 14, l = (X1 - X0) / n;
  for(let k = 0; k < n; k++){ const x = X0 + (k + .5) * l, h = toit(x) - HM + .02; if(h > .04) boite(g, ton(k), l - .025, h, .07, x, HM + h / 2 - .02, z); }
  /* l'arrière, en planches aussi */
  for(let k = 0; k < n; k++){ const x = X0 + (k + .5) * l, h = toit(x) - HM + .02; if(h > .04) boite(g, ton(k + 1), l - .025, h, .07, x, HM + h / 2 - .02, Z0 - .04); }
  boite(g, POUTRE, X1 - X0 + .2, .18, .16, 0, HM + .26, z + .08);                          // la poutre
  boite(g, POUTRE, .18, HR - HM - .55, .14, 0, (HR + HM) / 2 + .02, z + .08);               // le poinçon
  for(const s of [-1, 1]){                                                                  // les contrefiches en V
    const x0 = s * .1, y0 = HR - .7, x1 = s * 1.15, y1 = HM + .34, L = Math.hypot(x1 - x0, y1 - y0);
    planche(g, CLAIR, .16, L, .12, (x0 + x1) / 2, (y0 + y1) / 2, z + .1, 0, 0, Math.atan2(x1 - x0, y0 - y1));
  }
  for(const s of [-1, 1]){                                                                  // les rives, le long du toit
    const L = (X1 + AV) / Math.cos(Math.atan(PENTE)) + .1;
    planche(g, POUTRE, L, .2, .14, s * (X1 + AV) / 2, HR - PENTE * (X1 + AV) / 2 - .02, z + .2, 0, 0, -s * Math.atan(PENTE));
  }
}
/* une pente de chaume : des rangs de bottes qui se recouvrent, du faîte vers le bas, leurs bouts arrondis en écailles.
   Le repère : l'origine au faîte, x le long du faîte (de a à b), z qui descend la pente (jusqu'à L), y vers le dehors */
function pente(g, a, b, L, rangs, pas){
  const h = L / rangs, w = b - a;
  for(let k = 0; k < rangs; k++){
    const z = (k + .5) * h, y = .06 + (rangs - k) * .085;
    bloc(g, PAILLE_S, w, .1, h + .08, (a + b) / 2, y - .1, z);                               // le dessous, dans l'ombre
    bloc(g, PAILLE[k % 3], w + .04, .2, h * .62, (a + b) / 2, y, z - h * .2);                 // la botte
    const n = Math.max(2, Math.round(w / pas)), l = w / n;
    for(let i = 0; i < n; i++){                                                              // ses bouts arrondis, qui pendent
      const e = ajoute(g, part(ECAILLE, PAILLE[(i + k) % 3], l * 1.16, .24, h * .7, a + (i + .5 + (k % 2) * .5) * l - (k % 2 && i === n - 1 ? l / 2 : 0), y - .01, z + h * .2));
      e.rotation.y = (hasard() - .5) * .12;
    }
  }
}
/* une pente posée : faîte en (x, y, z), qui descend vers rot, inclinée de a */
function poser(g, x, y, z, rot, a){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o); return i;
}
function toit(g){
  const a = Math.atan(PENTE), L = (X1 + AV) / Math.cos(a) + .05, za = Z0 - .35, zb = FACADE + .4;
  pente(poser(g, 0, HR, 0, Math.PI / 2, a), -zb, -za, L, 4, .42);                             // la pente de droite
  pente(poser(g, 0, HR, 0, -Math.PI / 2, a), za, zb, L, 4, .42);                              // la pente de gauche
  /* le gros rondin du faîte, d'avant en arrière, ses deux liens, son bout rond et ses cernes devant */
  const R = .36, f = ajoute(g, part(ROND, BOIS[1], R, zb - za + .1, R, 0, HR + .2, (za + zb) / 2 + .05)); f.rotation.x = Math.PI / 2;
  for(const z of [zb - 1.1, za + 1.2]){ const c = ajoute(g, part(G.tore, CORDE, R * 1.12, R * 1.12, 1.6, 0, HR + .2, z)); }
  const zf = zb + .1;
  ajoute(g, part(DISQUE, CLAIR, R * .96, .02, R * .96, 0, HR + .2, zf)).rotation.x = Math.PI / 2;
  ajoute(g, part(G.tore, CERNE, R * .55, R * .55, .4, 0, HR + .2, zf + .005));
  g.userData.toit = HR + .45;
}
/* la cheminée de pierre, derrière à droite, qui sort du chaume */
function cheminee(g){
  const x = 1.0, z = -1.05, e = .5;
  for(let r = 0; r < 6; r++){ const y = 2.55 + r * .27;
    for(const dx of [-e / 4, e / 4]) bloc(g, pierre(), r % 2 ? e : e / 2 - .02, .25, r % 2 ? e / 2 - .02 : e, x + (r % 2 ? 0 : dx), y + .13, z + (r % 2 ? dx : 0)); }
  bloc(g, PIERRE[1], e + .16, .18, e + .16, x, 4.25, z);
  boite(g, 0x3A3430, e - .2, .05, e - .2, x, 4.35, z);
}
/* la porte de planches au haut arrondi, son cadre en arc, ses pentures, son anneau, son seuil */
function porte(g){
  const z = FACADE + .05, w = PORTE_W, h = PORTE_H, y0 = SOCLE - .04, r = w / 2;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0xA9562A, w / 4 - .015, h - r, .06, -w / 2 + (k + .5) * w / 4, y0 + (h - r) / 2, z);
  const haut = ajoute(g, part(DEMI, PORTE_C, w, .06, w, 0, y0 + h - r, z)); haut.rotation.x = -Math.PI / 2;   // le haut arrondi
  for(const s of [-1, 1]) boite(g, POUTRE, .16, h - r + .05, .18, s * (w / 2 + .08), y0 + (h - r) / 2, z + .04);   // le cadre
  ajoute(g, part(ARC, POUTRE, r + .07, r + .07, 1.1, 0, y0 + h - r, z + .04));
  for(const y of [y0 + .32, y0 + h - r - .1]){ boite(g, FER, w * .62, .1, .03, -w * .17, y, z + .05);
    for(const x of [-.3, -.12]) ajoute(g, part(G.head, 0x6A6270, .12, .12, .08, x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .2, .2, .3, .2, y0 + .66, z + .07));
  boite(g, CLAIR, w + .5, .08, .3, 0, .04, FACADE + .24);                                   // le seuil
}
/* sous le pignon, au-dessus de la porte : la potence et la lanterne qui brille la nuit */
function lanterneFerme(g){
  const x = 0, y = 2.65, z = FACADE + .2;
  boite(g, FER, .06, .06, .26, x, y + .42, z + .02);
  ajoute(g, part(G.tore, FER, .1, .1, .5, x, y + .32, z + .14));
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .2, z + .14)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y + .02, z + .14));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .22, .025, x + dx, y + .02, z + .14 + dz);
  boite(g, FER, .2, .04, .2, x, y - .1, z + .14);
}
/* la botte de foin ronde, couchée, ses deux sangles, la spirale sur sa face */
function botte(g){
  const x = -1.65, z = 1.75, r = .42, l = .75;
  const c = ajoute(g, part(ROND, FOIN, r * 2, l, r * 2, x, r, z)); c.rotation.z = Math.PI / 2;
  for(const s of [-1, 1]){ const d = ajoute(g, part(DISQUE, FOIN_S, r * 1.9, .02, r * 1.9, x + s * (l / 2 + .005), r, z)); d.rotation.z = Math.PI / 2;
    for(const f of [.3, .6]){ const t = ajoute(g, part(G.tore, 0xC88E2E, r * 2 * f, r * 2 * f, .35, x + s * (l / 2 + .01), r, z)); t.rotation.y = Math.PI / 2; } }
  for(const dx of [-.18, .18]){ const t = ajoute(g, part(G.tore, CORDE, r * 2.04, r * 2.04, .5, x + dx, r, z)); t.rotation.y = Math.PI / 2; }
}
/* la barrière basse : ses poteaux ronds et ses deux lisses, d'un point à l'autre */
function barriere(g, pts){
  for(let k = 0; k < pts.length; k++){
    const [x, z] = pts[k];
    ajoute(g, part(ROND, BARRIERE[k % 2], .2, .7, .2, x, .35, z));
    ajoute(g, part(DISQUE, CLAIR, .18, .02, .18, x, .705, z));
    if(k === 0) continue;
    const [px, pz] = pts[k - 1], L = Math.hypot(x - px, z - pz), a = Math.atan2(x - px, z - pz);
    for(const y of [.28, .54]) planche(g, BARRIERE[(k + 1) % 2], .07, .11, L, (x + px) / 2, y, (z + pz) / 2, 0, a, 0);
  }
}
/* des touffes d'herbe, à même le sol */
function herbes(g){
  for(const [x, z] of [[-2.25, 2.25], [-1.05, 2.2], [-.62, 1.5], [.7, 1.55], [1.5, 2.25], [2.25, 1.0], [-2.3, .6]])
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); }
}
export function fermeNiveau1(g){
  alea = 29;
  murs(g);
  pignon(g);
  toit(g);
  cheminee(g);
  porte(g);
  lanterneFerme(g);
  botte(g);
  barriere(g, [[X0 + .05, FACADE + .1], [-2.3, 1.75], [-2.2, 2.35], [-1.0, 2.35]]);
  barriere(g, [[X1 - .05, FACADE + .1], [2.3, 1.7], [2.25, 2.35], [1.0, 2.35]]);
  barriere(g, [[X1 + .05, -.9], [2.35, -.6], [2.3, 1.7]]);
  herbes(g);
}
