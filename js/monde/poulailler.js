/* ================= Le poulailler =================
   D'après l'image de Yo (20 novembre 2026 : « Voici le poulailler ») : la cabane de planches couleur miel, surélevée sur ses
   quatre pilotis ; son toit de chaume en rangs d'écailles, le rondin du faîte et ses trois liens de corde, son bout carré ; le
   pignon de gauche, sa poutre et ses contrefiches en V ; la petite porte au haut arrondi, ses deux pentures et son anneau ; deux
   nichoirs garnis de paille, sous leur auvent de planches ; la rampe à barreaux qui descend jusqu'au sol ; l'enclos à pans
   coupés devant, ses piquets ronds cloutés, ses deux lisses et son grillage à mailles en nid d'abeille ; le portillon à
   barreaux, ses pentures et son loquet. On n'y entre pas (B.poulailler.sansPiece) : les poules s'y promènent (elevage.js).
   Coordonnées : le milieu du carré de 4 × 4 en (0, 0), le portillon devant (B.poulailler.door = -0,5). */
import { G, part, toon } from "./formes.js";

const BOIS = [0xD48A3E, 0xDE9848, 0xC97C34], CLAIR = 0xE9AD62, FONCE = 0xA8642A, POUTRE = 0xC4752F, PORTE_C = 0xB8612E, FER = 0x5A545C,
  PAILLE = [0xF2B83E, 0xF6C650, 0xEBAA34], PAILLE_S = 0xD8962C, CORDE = 0xA05A28, PIQUET = [0xD7843A, 0xE0923F], CLOU = 0x8A8690;
/* le grillage : des mailles en nid d'abeille dessinées une fois, le reste transparent */
const GRILLAGE = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"); x.strokeStyle = "#B8B4B0"; x.lineWidth = 3;
  const r = 10, w = r * Math.sqrt(3);
  for(let row = -1; row < 5; row++) for(let col = -1; col < 5; col++){
    const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * r * 1.5; x.beginPath();
    for(let k = 0; k <= 6; k++){ const a = Math.PI / 3 * k + Math.PI / 6; x[k ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return toon({map: t, transparent: false, alphaTest: .5, side: THREE.DoubleSide});
})();

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(8, 6, .28), ROND = new THREE.CylinderGeometry(.5, .5, 1, 10), ECAILLE = new THREE.SphereGeometry(.5, 8, 5),
  ARC = new THREE.TorusGeometry(1, .16, 6, 12, Math.PI), DEMI = new THREE.CylinderGeometry(.5, .5, 1, 12, 1, false, -Math.PI / 2, Math.PI),
  BRIN = new THREE.ConeGeometry(.5, 1, 4);
const bloc = (g, hex, sx, sy, sz, x, y, z) => ajoute(g, part(BLOC, hex, sx, sy, sz, x, y, z));
let alea = 41;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;

/* la cabane : de X0 à X1, de Z0 à ZF (sa façade), son plancher à Y0, ses murs jusqu'à YM, le faîte de gauche à droite en YR */
const X0 = -1.15, X1 = 1.15, Z0 = -1.7, ZF = -.35, Y0 = .6, YM = 1.55, YR = 2.3, AV = .3, ZC = (Z0 + ZF) / 2;
const PENTE = (YR - YM) / ((ZF - Z0) / 2 + AV);
/* l'enclos : ses piquets, de la cabane jusqu'au devant, pans coupés ; le portillon entre PX0 et PX1 */
export const ENCLOS = {x0: -1.7, x1: 1.7, z0: -1.55, z1: 1.7};
const PX0 = -.95, PX1 = -.08;

function cabane(g){
  for(const [x, z] of [[X0 + .12, Z0 + .12], [X1 - .12, Z0 + .12], [X0 + .12, ZF - .12], [X1 - .12, ZF - .12]]) boite(g, POUTRE, .2, Y0, .2, x, Y0 / 2, z);   // les pilotis
  boite(g, FONCE, X1 - X0, .12, ZF - Z0, 0, Y0 + .06, ZC);                                                  // le plancher
  boite(g, FONCE, X1 - X0 - .1, YM - Y0 - .05, ZF - Z0 - .1, 0, (YM + Y0) / 2, ZC);                          // le cœur
  const n = 10, l = (X1 - X0) / n, trous = [[-.32, .32, Y0, Y0 + .8], [-.98, -.42, Y0 + .1, Y0 + .62], [.42, .98, Y0 + .1, Y0 + .62]];
  for(let k = 0; k < n; k++){                                                                               // la façade de planches
    const x = X0 + (k + .5) * l; let m = [[Y0 + .05, YM]];
    for(const [u0, u1, y0, y1] of trous) if(x > u0 && x < u1) m = m.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of m) if(q - p > .04) boite(g, ton(k), l - .02, q - p, .07, x, (p + q) / 2, ZF + .02);
  }
  for(const [x, s] of [[X0, -1], [X1, 1]]){                                                                // les côtés, planches couchées
    for(let k = 0; k < 4; k++) boite(g, ton(k + 2), .07, (YM - Y0) / 4 - .02, ZF - Z0, x + s * .02, Y0 + (k + .5) * (YM - Y0) / 4, ZC); }
  for(const [x, z] of [[X0, ZF], [X1, ZF], [X0, Z0], [X1, Z0]]) boite(g, POUTRE, .16, YM - Y0 + .05, .16, x, (YM + Y0) / 2, z);
  boite(g, POUTRE, X1 - X0 + .2, .14, .14, 0, YM, ZF + .05);
  /* les pignons, gauche et droite : leurs planches, la poutre, les contrefiches en V */
  for(const [x, s] of [[X0, -1], [X1, 1]]){
    const m = 6, ll = (ZF - Z0) / m;
    for(let k = 0; k < m; k++){ const z = Z0 + (k + .5) * ll, h = YR - .08 - PENTE * Math.abs(z - ZC) - YM; if(h > .04) boite(g, ton(k), .07, h, ll - .02, x + s * .02, YM + h / 2, z); }
    boite(g, POUTRE, .12, .12, ZF - Z0 + .1, x + s * .07, YM + .14, ZC);
    for(const t of [-1, 1]){ const z0 = ZC + t * .06, y0 = YR - .3, z1 = ZC + t * .5, y1 = YM + .2, L = Math.hypot(z1 - z0, y1 - y0);
      planche(g, CLAIR, .08, L, .1, x + s * .08, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(z1 - z0, y0 - y1) * -1, 0, 0); }
  }
  /* la porte au haut arrondi, ses pentures, son anneau */
  const w = .58, h = .78, y0 = Y0 + .04, r = w / 2, z = ZF + .05;
  for(let k = 0; k < 3; k++) boite(g, k % 2 ? PORTE_C : 0xA9562A, w / 3 - .015, h - r, .05, -w / 2 + (k + .5) * w / 3, y0 + (h - r) / 2, z);
  ajoute(g, part(DEMI, PORTE_C, w, .05, w, 0, y0 + h - r, z)).rotation.x = -Math.PI / 2;
  ajoute(g, part(ARC, POUTRE, r + .06, r + .06, .8, 0, y0 + h - r, z + .03));
  for(const s of [-1, 1]) boite(g, POUTRE, .12, h - r, .12, s * (w / 2 + .06), y0 + (h - r) / 2, z + .03);
  for(const y of [y0 + .16, y0 + h - r - .06]) boite(g, FER, .2, .06, .03, -w / 2 + .12, y, z + .04);
  ajoute(g, part(G.tore, FER, .12, .12, .3, .16, y0 + .32, z + .05));
  /* les deux nichoirs : leur caisse, la paille, leur auvent de planches */
  for(const x of [-.7, .7]){
    boite(g, FONCE, .54, .5, .3, x, Y0 + .36, ZF - .08);
    for(const [ww, hh, dx, dy] of [[.66, .1, 0, -.27], [.1, .5, -.29, 0], [.1, .5, .29, 0]]) boite(g, POUTRE, ww, hh, .14, x + dx, Y0 + .36 + dy, ZF + .07);
    bloc(g, PAILLE[1], .48, .16, .26, x, Y0 + .2, ZF - .02);
    for(let k = 0; k < 9; k++){ const a = k / 9 * Math.PI * 2, b = ajoute(g, part(BRIN, PAILLE[k % 3], .05, .16, .05, x + Math.cos(a) * .16, Y0 + .28, ZF + .02 + Math.sin(a) * .06));
      b.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
    for(let k = 0; k < 4; k++) planche(g, ton(k), .15, .04, .34, x - .21 + k * .14, Y0 + .7, ZF + .14, .35, 0, 0);   // l'auvent
  }
}
/* une pente de chaume posée, ses rangs de bottes et leurs écailles (comme la Ferme) */
function pente(g, a, b, L, rangs, pas){
  const h = L / rangs, w = b - a;
  for(let k = 0; k < rangs; k++){
    const z = (k + .5) * h, y = .05 + (rangs - k) * .07;
    bloc(g, PAILLE_S, w, .08, h + .06, (a + b) / 2, y - .08, z);
    bloc(g, PAILLE[k % 3], w + .04, .16, h * .62, (a + b) / 2, y, z - h * .2);
    const n = Math.max(2, Math.round(w / pas)), l = w / n;
    for(let i = 0; i < n; i++){ const e = ajoute(g, part(ECAILLE, PAILLE[(i + k) % 3], l * 1.14, .16, h * .64, a + (i + .5 + (k % 2) * .5) * l - (k % 2 && i === n - 1 ? l / 2 : 0), y - .01, z + h * .2));
      e.rotation.y = (hasard() - .5) * .12; }
  }
}
function poser(g, x, y, z, rot, a){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o); return i;
}
function toit(g){
  const a = Math.atan(PENTE), L = ((ZF - Z0) / 2 + AV) / Math.cos(a) + .05, xa = X0 - .3, xb = X1 + .3;
  pente(poser(g, 0, YR, ZC, 0, a), xa, xb, L, 3, .24);                                      // devant
  pente(poser(g, 0, YR, ZC, Math.PI, a), -xb, -xa, L, 3, .3);                               // derrière
  const f = ajoute(g, part(ROND, BOIS[1], .26, xb - xa + .2, .26, 0, YR + .14, ZC)); f.rotation.z = Math.PI / 2;
  for(const x of [-.75, 0, .75]) ajoute(g, part(G.tore, CORDE, .3, .3, 1.4, x, YR + .14, ZC)).rotation.y = Math.PI / 2;
  for(const x of [xa - .1, xb + .1]) bloc(g, BOIS[2], .22, .34, .34, x, YR + .14, ZC);   // les bouts carrés
  g.userData.toit = YR + .3;
}
/* la rampe à barreaux, de la porte jusqu'au sol, devant */
function rampe(g){
  const z0 = ZF + .05, y0 = Y0 + .02, z1 = .85, L = Math.hypot(z1 - z0, y0), a = Math.atan2(y0, z1 - z0);
  for(const x of [-.24, .24]) planche(g, POUTRE, .08, .08, L, x, y0 / 2, (z0 + z1) / 2, a, 0, 0);
  planche(g, CLAIR, .5, .04, L, 0, y0 / 2 + .02, (z0 + z1) / 2, a, 0, 0);
  for(let k = 1; k < 6; k++){ const t = k / 6; boite(g, BOIS[k % 3], .5, .05, .06, 0, y0 * (1 - t) + .06, z0 + (z1 - z0) * t); }
}
/* l'enclos : les piquets ronds cloutés, les deux lisses, le grillage ; le portillon à barreaux */
function enclos(g){
  const { x0, x1, z1 } = ENCLOS, c = .5, zb = ZF - .45;
  const pts = [[X0 - .05, zb], [x0, zb], [x0, z1 - c], [x0 + c, z1], [PX0, z1]];
  const pts2 = [[PX1, z1], [x1 - c, z1], [x1, z1 - c], [x1, zb], [X1 + .05, zb]];
  for(const p of [pts, pts2]) for(let k = 0; k < p.length; k++){
    const [x, z] = p[k];
    ajoute(g, part(ROND, PIQUET[k % 2], .18, .72, .18, x, .36, z));
    ajoute(g, part(G.head, CLAIR, .17, .08, .17, x, .72, z));
    for(const y of [.2, .56]) ajoute(g, part(G.head, CLOU, .06, .06, .04, x + .0, y, z + .09));
    if(!k) continue;
    const [px, pz] = p[k - 1], L = Math.hypot(x - px, z - pz), an = Math.atan2(x - px, z - pz);
    for(const y of [.12, .62]) planche(g, PIQUET[(k + 1) % 2], .07, .09, L - .12, (x + px) / 2, y, (z + pz) / 2, 0, an, 0);
    const gr = ajoute(g, new THREE.Mesh(new THREE.PlaneGeometry(L - .16, .42), GRILLAGE));
    gr.position.set((x + px) / 2, .37, (z + pz) / 2); gr.rotation.y = an + Math.PI / 2; gr.castShadow = false; gr.receiveShadow = true;
    const uv = gr.geometry.attributes.uv; for(let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (L - .16) * 3, uv.getY(i) * .42 * 3);
  }
  /* le portillon : son cadre, ses barreaux, le haut arrondi, ses pentures, son loquet */
  const w = PX1 - PX0 - .1, cx = (PX0 + PX1) / 2, z = z1;
  for(const y of [.12, .52]) boite(g, CLAIR, w, .07, .06, cx, y, z);
  for(let k = 0; k < 4; k++) boite(g, PIQUET[k % 2], .07, .48, .05, cx - w / 2 + .1 + k * (w - .2) / 3, .32, z);
  ajoute(g, part(ARC, CLAIR, w / 2, .12, .4, cx, .52, z));
  for(const y of [.18, .46]) boite(g, FER, .14, .05, .03, PX0 + .08, y, z + .04);
  boite(g, FER, .05, .1, .04, PX1 - .1, .34, z + .04);
}
export function poulaillerModele(g){
  alea = 41;
  cabane(g);
  toit(g);
  rampe(g);
  enclos(g);
}
