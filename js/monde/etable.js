/* ================= L'étable =================
   D'après l'image de Yo (20 novembre 2026 : « Étable, vache, taureau, veau ») : la grange de planches couleur miel, ses poteaux
   et ses poutres, son soubassement de pierres claires ; le toit de chaume en rangs d'écailles, le boudin du faîte et ses liens
   de corde, ses bouts carrés ; au milieu de la pente de devant, la lucarne à foin et son petit pignon de bois ; la grande porte
   à deux battants sous son arc, les croix de bois, les pentures de fer et les deux anneaux ; deux fenêtres à quatre carreaux
   et leur appui ; le râtelier à foin sur ses pieds en X, à gauche ; l'abreuvoir cerclé de fer, à droite ; le pré devant,
   fermé par une barrière à pans coupés, ses poteaux carrés aux bouts arrondis et cloutés, ses trois lisses.
   On n'y entre pas (B.etable.sansPiece) : les vaches se promènent dans le pré (elevage.js).
   Coordonnées : le milieu du carré de 6 × 6 en (0, 0), le pré devant. */
import { G, part } from "./formes.js";

const BOIS = [0xD4823A, 0xDE9244, 0xC87632], CLAIR = 0xE9A65C, FONCE = 0xA35E28, POUTRE = 0xC06C2C, PORTE = [0xC97A36, 0xD58840], FER = 0x5E5860,
  PAILLE = [0xF4B436, 0xF8C44A, 0xEDA82E], PAILLE_S = 0xD8922A, CORDE = 0xB06428, PIERRE = [0xE6D6BC, 0xD8C6A8, 0xEEDFC6], VITRE = 0xFBE9BC,
  PIQUET = [0xE08A3C, 0xEA9846], CLOU = 0x8A8690, EAU = 0x6EB4E0;

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
  ARC = new THREE.TorusGeometry(1, .1, 6, 14, Math.PI), BRIN = new THREE.ConeGeometry(.5, 1, 4), DOME = new THREE.SphereGeometry(.5, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  LANGUE = arrondi(10, 6, .85), CLOU_G = new THREE.SphereGeometry(.5, 6, 4);
const bloc = (g, hex, sx, sy, sz, x, y, z) => ajoute(g, part(BLOC, hex, sx, sy, sz, x, y, z));
let alea = 23;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;

/* la grange : de X0 à X1, de Z0 à ZF (sa façade), ses murs jusqu'à YM, le faîte de gauche à droite en YR */
const X0 = -2.15, X1 = 2.15, Z0 = -2.8, ZF = -1.1, YM = 2, YR = 3.35, AV = .4, ZC = (Z0 + ZF) / 2;
const PENTE = (YR - YM) / ((ZF - Z0) / 2 + AV);
/* la porte : sa largeur, le haut de ses battants, le haut de son arc ; la lucarne au-dessus */
const PW = 1.3, PH = 1.22, LW = .95, LY = YM + .72;
/* le pré : où vont les bêtes (elevage.js) ; la barrière autour */
export const PRE = {x0: -2.68, x1: 2.68, z0: -.3, z1: 2.78};
const BX = 2.82, BZ = 2.88, COUPE = .75;

function grange(g){
  /* le soubassement de pierres claires, sous les planches */
  for(let k = 0; k < 18; k++){ const x = X0 + .12 + k * (X1 - X0 - .24) / 17;
    bloc(g, PIERRE[k % 3], .3 + hasard() * .06, .22, .2, x, .1, ZF + .03); }
  for(const x of [X0, X1]) for(let k = 0; k < 7; k++) bloc(g, PIERRE[k % 3], .2, .22, .28, x, .1, Z0 + .15 + k * (ZF - Z0 - .3) / 6);
  boite(g, FONCE, X1 - X0 - .1, YM - .1, ZF - Z0 - .1, 0, YM / 2 + .05, ZC);                                // le cœur
  /* la façade de planches debout, la porte et les fenêtres laissées vides */
  const n = 22, l = (X1 - X0) / n, trous = [[-PW / 2 - .1, PW / 2 + .1, 0, PH + PW / 2 + .1], [-1.78, -1.22, .7, 1.22], [1.22, 1.78, .7, 1.22]];
  for(let k = 0; k < n; k++){
    const x = X0 + (k + .5) * l; let m = [[.18, YM]];
    for(const [u0, u1, y0, y1] of trous) if(x > u0 && x < u1) m = m.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of m) if(q - p > .04) boite(g, ton(k), l - .02, q - p, .07, x, (p + q) / 2, ZF + .02);
  }
  for(const [x, s] of [[X0, -1], [X1, 1]]){                                                                // les côtés, planches debout
    const m = 10, ll = (ZF - Z0) / m;
    for(let k = 0; k < m; k++) boite(g, ton(k + 1), .07, YM - .18, ll - .02, x + s * .02, (YM + .18) / 2, Z0 + (k + .5) * ll);
  }
  /* les poteaux, les poutres ; les contrefiches en V de chaque côté de la lucarne */
  for(const [x, z] of [[X0, ZF], [X1, ZF], [X0, Z0], [X1, Z0]]) boite(g, POUTRE, .2, YM, .2, x, YM / 2, z);
  for(const x of [-PW / 2 - .55, PW / 2 + .55]) boite(g, POUTRE, .16, YM - .2, .12, x, YM / 2 + .1, ZF + .06);
  boite(g, POUTRE, X1 - X0 + .24, .16, .16, 0, YM, ZF + .06);
  boite(g, POUTRE, X1 - X0 + .1, .14, .12, 0, PH + .06, ZF + .07);
  for(const s of [-1, 1]) for(const t of [-1, 1]){
    const xa = s * (PW / 2 + .55) + t * .42, x0 = s * (PW / 2 + .55), y0 = PH + .14, y1 = YM - .06, L = Math.hypot(xa - x0, y1 - y0);
    planche(g, CLAIR, .08, L, .06, (xa + x0) / 2, (y0 + y1) / 2, ZF + .08, 0, 0, Math.atan2(xa - x0, y1 - y0) * -1); }
  /* les pignons de gauche et de droite : leurs planches, la poutre, une contrefiche */
  for(const [x, s] of [[X0, -1], [X1, 1]]){
    const m = 8, ll = (ZF - Z0) / m;
    for(let k = 0; k < m; k++){ const z = Z0 + (k + .5) * ll, h = YR - .1 - PENTE * Math.abs(z - ZC) - YM; if(h > .04) boite(g, ton(k), .07, h, ll - .02, x + s * .02, YM + h / 2, z); }
    boite(g, POUTRE, .12, .14, ZF - Z0 + .1, x + s * .07, YM + .02, ZC);
    for(const t of [-1, 1]){ const z0 = ZC + t * .08, y0 = YR - .35, z1 = ZC + t * .62, y1 = YM + .14, L = Math.hypot(z1 - z0, y1 - y0);
      planche(g, CLAIR, .08, L, .1, x + s * .08, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(z1 - z0, y0 - y1) * -1, 0, 0); }
  }
  porte(g);
  for(const x of [-1.5, 1.5]) fenetre(g, x);
}
/* la grande porte à deux battants : les planches, les traverses, les croix, l'arc, les pentures, les anneaux */
function porte(g){
  const z = ZF + .05, w = PW / 2 - .02;
  for(const s of [-1, 1]){
    const cx = s * (w / 2 + .01);
    for(let k = 0; k < 4; k++) boite(g, PORTE[k % 2], w / 4 - .012, PH, .05, cx - w / 2 + (k + .5) * w / 4, PH / 2 + .02, z);
    for(const y of [.14, PH - .1]) boite(g, CLAIR, w - .02, .1, .04, cx, y, z + .04);
    for(const t of [-1, 1]){ const L = Math.hypot(w - .1, PH - .34); planche(g, CLAIR, .09, L, .04, cx, PH / 2 + .02, z + .045, 0, 0, t * Math.atan2(w - .1, PH - .34)); }
    for(const y of [.32, PH - .3]) boite(g, FER, .26, .07, .03, s * (PW / 2 - .14), y, z + .07);
    ajoute(g, part(G.tore, FER, .16, .16, .4, s * .1, .66, z + .08));
  }
  /* le haut arrondi : un demi-disque de planches sous l'arc de bois */
  const r = PW / 2;
  for(let k = 0; k < 6; k++){ const x = -r + (k + .5) * PW / 6, h = Math.sqrt(Math.max(0, r * r - x * x)) - .02; if(h > .03) boite(g, PORTE[k % 2], PW / 6 - .012, h, .05, x, PH + h / 2 + .02, z); }
  boite(g, CLAIR, PW, .08, .04, 0, PH + .04, z + .04);
  ajoute(g, part(ARC, POUTRE, r + .09, r + .09, 1.4, 0, PH + .02, z + .04));
  for(const s of [-1, 1]) boite(g, POUTRE, .16, PH, .16, s * (r + .08), PH / 2, z + .04);
}
/* une fenêtre à quatre carreaux, son cadre et son appui */
function fenetre(g, x){
  const y = .96, z = ZF + .04;
  boite(g, VITRE, .5, .48, .04, x, y, z - .01);
  boite(g, POUTRE, .07, .5, .05, x, y, z + .02); boite(g, POUTRE, .5, .07, .05, x, y, z + .02);
  for(const s of [-1, 1]){ boite(g, POUTRE, .09, .6, .08, x + s * .28, y, z + .03); boite(g, POUTRE, .62, .09, .08, x, y + s * .28, z + .03); }
  boite(g, CLAIR, .72, .08, .2, x, y - .38, z + .1);
  boite(g, POUTRE, .66, .12, .06, x, y - .46, z + .06);
}
/* une pente de chaume, de la distance s0 à s1 du faîte, de x = a à b : ses rangs de bottes et leurs écailles */
function pente(g, a, b, s0, s1, rangs, pas){
  const h = (s1 - s0) / rangs, w = b - a;
  bloc(g, PAILLE_S, w, .12, s1 - s0 + .04, (a + b) / 2, -.02, (s0 + s1) / 2);
  for(let k = 0; k < rangs; k++){
    const z = s0 + (k + .5) * h, y = .05 + (rangs - k) * .06;
    const n = Math.max(2, Math.round(w / pas)), l = w / n, dec = k % 2 ? .5 : 0;
    for(let i = -1; i < n; i++){
      const x = a + (i + .5 + dec) * l;
      if(x < a + l * .3 || x > b - l * .3) continue;
      const e = ajoute(g, part(LANGUE, PAILLE[(i + k + 3) % 3], l * 1.18, .2, h * 1.3, x, y, z + h * .12));   // une langue de chaume, ronde et longue
      e.rotation.set(-.12, (hasard() - .5) * .1, (hasard() - .5) * .06); }
  }
}
function poser(g, x, y, z, rot, a){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o); return i;
}
function toit(g){
  const a = Math.atan(PENTE), L = ((ZF - Z0) / 2 + AV) / Math.cos(a) + .05, xa = X0 - .35, xb = X1 + .35;
  /* devant : la pente coupée par la lucarne (le haut sur toute la largeur, le bas de part et d'autre) */
  const s1 = (YR - LY) / Math.sin(a) + .05, devant = poser(g, 0, YR, ZC, 0, a);
  pente(devant, xa, xb, 0, s1, 2, .36);
  pente(devant, xa, -LW / 2 - .02, s1, L, 3, .36);
  pente(devant, LW / 2 + .02, xb, s1, L, 3, .36);
  pente(poser(g, 0, YR, ZC, Math.PI, a), -xb, -xa, 0, L, 4, .5);                            // derrière
  const f = ajoute(g, part(ROND, PAILLE[1], .36, xb - xa + .1, .36, 0, YR + .16, ZC)); f.rotation.z = Math.PI / 2;   // le boudin du faîte
  for(const x of [-1.7, -.6, .6, 1.7]) ajoute(g, part(G.tore, CORDE, .4, .4, 1.6, x, YR + .16, ZC)).rotation.y = Math.PI / 2;
  for(const x of [xa - .08, xb + .08]){ bloc(g, BOIS[2], .3, .42, .42, x, YR + .16, ZC); bloc(g, CLAIR, .24, .14, .3, x, YR + .4, ZC); }   // les bouts carrés
  lucarne(g, a);
  g.userData.toit = YR + .35;
}
/* la lucarne à foin : sa façade de planches, son ouverture et le foin, son petit pignon de bois */
function lucarne(g, a){
  const z = ZF + .02, y0 = YM - .02, y1 = LY, prof = (YR - LY) / Math.tan(a) + AV * .4;
  for(const s of [-1, 1]){ boite(g, ton(s + 2), .08, y1 - y0, prof, s * LW / 2, (y0 + y1) / 2, z - prof / 2 + .05); }
  boite(g, FONCE, LW - .06, .55, .1, 0, y0 + .32, z - .14);
  bloc(g, PAILLE[1], .62, .26, .3, 0, y0 + .2, z - .04);
  for(let k = 0; k < 11; k++){ const t = k / 10 - .5, b = ajoute(g, part(BRIN, PAILLE[k % 3], .07, .24, .07, t * .55, y0 + .3, z + .06));
    b.rotation.set(.5, 0, -t * 1.6); }
  boite(g, POUTRE, LW + .1, .1, .12, 0, y0 + .02, z + .06);                       // l'appui
  for(const s of [-1, 1]) boite(g, POUTRE, .12, y1 - y0 + .1, .12, s * (LW / 2 + .02), (y0 + y1) / 2, z + .06);
  /* le petit pignon : deux planches en ^, posées sur la lucarne et qui rejoignent le toit */
  const h = .42, w = LW / 2 + .2, L = Math.hypot(w, h) + .06, an = Math.atan2(h, w);
  for(const s of [-1, 1]){
    planche(g, ton(s + 4), L, .07, prof + .2, s * w / 2, y1 + h / 2 + .06, z - prof / 2 + .08, 0, 0, -s * an);   // le petit toit de planches
    planche(g, BOIS[1], L, .14, .1, s * w / 2, y1 + h / 2 + .02, z + .1, 0, 0, -s * an);                         // la planche de rive
  }
  for(let k = 0; k < 4; k++){ const w = LW * (1 - (k + .5) / 4) * .9; boite(g, ton(k), w, h / 4 - .01, .05, 0, y1 + (k + .5) * h / 4, z + .02); }   // les planches du pignon
}
/* le râtelier à foin, sur ses pieds en X */
function ratelier(g, x, z){
  for(const s of [-1, 1]) for(const t of [-1, 1]) planche(g, POUTRE, .09, .82, .09, x + s * .36, .38, z + t * .1, t * .42, 0, 0);
  boite(g, CLAIR, .12, .1, .5, x - .36, .74, z); boite(g, CLAIR, .12, .1, .5, x + .36, .74, z);
  for(const [y, d] of [[.62, .5], [.9, .62]]) for(const t of [-1, 1]) boite(g, BOIS[(y > .7) + 1], .82, .1, .06, x, y, z + t * d / 2);
  boite(g, FONCE, .74, .06, .4, x, .58, z);
  bloc(g, PAILLE[1], .74, .26, .48, x, .86, z);
  for(let k = 0; k < 14; k++){ const a = k / 14 * Math.PI * 2, b = ajoute(g, part(BRIN, PAILLE[k % 3], .08, .22, .08, x + Math.cos(a) * .3, .98, z + Math.sin(a) * .18));
    b.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
  boite(g, BOIS[1], .14, .55, .1, x - .5, .82, z - .2);                      // le montant contre le mur
  planche(g, CLAIR, .1, .1, .62, x - .45, 1.08, z - .05, -.4, 0, 0);
}
/* l'abreuvoir de planches, cerclé de fer, plein d'eau */
function abreuvoir(g, x, z){
  const w = .82, d = .5, h = .44;
  for(const s of [-1, 1]){ boite(g, BOIS[s + 1], w, h, .08, x, h / 2 + .1, z + s * d / 2); boite(g, BOIS[2 - s], .08, h, d, x + s * w / 2, h / 2 + .1, z); }
  for(const s of [-1, 1]) for(const t of [-1, 1]) boite(g, POUTRE, .12, .14, .12, x + s * (w / 2 - .1), .07, z + t * (d / 2 - .06));
  for(const y of [.2, .46]) for(const s of [-1, 1]){ boite(g, FER, w + .04, .06, .02, x, y, z + s * (d / 2 + .05)); boite(g, FER, .02, .06, d + .04, x + s * (w / 2 + .05), y, z); }
  for(const s of [-1, 1]) for(const t of [-1, 1]) ajoute(g, part(CLOU_G, CLOU, .06, .06, .04, x + s * (w / 2 + .06), .33, z + t * (d / 2 + .06)));
  boite(g, FONCE, w - .1, .04, d - .1, x, .2, z);
  boite(g, EAU, w - .1, .03, d - .1, x, .48, z);
}
/* la barrière du pré : poteaux carrés au bout arrondi et cloutés, trois lisses, pans coupés devant */
function barriere(g){
  const zb = ZF + .05;
  const pts = [[X0 - .1, zb], [-BX, zb], [-BX, .4], [-BX, BZ - COUPE], [-BX + COUPE, BZ], [-1.2, BZ], [0, BZ], [1.2, BZ], [BX - COUPE, BZ], [BX, BZ - COUPE], [BX, .4], [BX, zb], [X1 + .1, zb]];
  for(let k = 0; k < pts.length; k++){
    const [x, z] = pts[k];
    bloc(g, PIQUET[k % 2], .24, .8, .24, x, .4, z);
    ajoute(g, part(DOME, CLAIR, .26, .14, .26, x, .79, z));
    for(const y of [.24, .56]) ajoute(g, part(CLOU_G, CLOU, .09, .09, .05, x + (Math.abs(x) > 2.7 && z < BZ - COUPE ? Math.sign(x) * .12 : 0), y, z + (z > BZ - COUPE ? .12 : 0)));
    if(!k) continue;
    const [px, pz] = pts[k - 1], L = Math.hypot(x - px, z - pz), an = Math.atan2(x - px, z - pz);
    for(const [y, t] of [[.16, 0], [.42, 1], [.66, 0]]) planche(g, PIQUET[(k + t) % 2], .08, .12, L - .14, (x + px) / 2, y, (z + pz) / 2, 0, an, 0);
  }
}
export function etableModele(g){
  alea = 23;
  grange(g);
  toit(g);
  ratelier(g, -1.4, ZF + .5);
  abreuvoir(g, 1.4, ZF + .42);
  barriere(g);
}
