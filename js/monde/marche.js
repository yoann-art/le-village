/* ================= Le Marché, niveau 1 =================
   D'après l'image de Yo (5 novembre 2026 : « Voici le marché niveau 1 »), au plus près de l'image, avec ses choix :
   « 5*5 », la porte « Comme sur l'image » (à droite), « Les fruits de saison », « Pas de fumée ». La halle de planches et
   de poutres sur son socle de pierres claires ; le grand toit de larges planches clouées, la poutre du faîte et ses gros
   blocs ; à droite, le pignon de devant à colombages et ses liens, la porte de planches dans son cadre, ses pentures, son
   anneau, ses deux marches ; la lanterne pendue à droite de la porte ; à gauche, l'étal ouvert sous l'auvent de toile
   crème à festons, ses poteaux et leurs jambes de force, l'étagère et ses trois cagettes, deux cagettes par terre, le
   tonneau ; du sable et des cailloux. Les cagettes portent les fruits de la saison, comme dans la vraie nature (au lieu
   des oranges de l'image, qui ne poussent pas sous notre climat) : les fraises et les pommes gardées au printemps ; les
   cerises, les fraises, les groseilles et les prunes l'été ; les pommes, les poires, le raisin et les coings l'automne ;
   l'hiver, les pommes et les poires gardées au cellier, les noix et les noisettes. La lanterne brille plus fort la nuit.
   Coordonnées : le milieu du carré de 5 × 5 en (0, 0), le devant de la halle et de l'étal en z = FACADE, la porte en
   x = PORTE_X (B.marche.door). */
import { G, part, toon } from "./formes.js";
import { lanterne } from "./ciel.js";

export const FACADE = 1.1, PORTE_X = .9;
const BOIS = [0xC86E30, 0xD47C3A, 0xBA6428], CLAIR = 0xDC8C4A, FONCE = 0x9C5222, PORTE_C = 0xC27434, FER = 0x4E4E56, CLOU = 0x8A8A94,
  TOILE = [0xF6E8C8, 0xEEDAB2], PIERRE = [0xDCCDBC, 0xD2C2B0, 0xE4D7C8, 0xC9B8A4], SABLE = 0xE2BE7E, SABLE_S = 0xD2AA6A, FEUILLE = [0x5E9E3A, 0x74B048];
/* ce qui luit, plus fort la nuit (ciel.js) : la lanterne */
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
lanterne(null, 0, 0, LUEUR);

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
/* une pierre (ou une planche épaisse) aux arêtes adoucies : une boîte aux coins ronds */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(10, 8, .3), BLOC_L = arrondi(8, 6, .25), CAILLOU = new THREE.IcosahedronGeometry(.5, 0),
  FRUIT = new THREE.SphereGeometry(.5, 8, 6), BAIE = new THREE.SphereGeometry(.5, 6, 4), FESTON = new THREE.CylinderGeometry(.5, .5, 1, 12, 1, false, Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0, geo = BLOC) => { const m = ajoute(g, part(geo, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 17;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

/* la halle : X0 à X1 de gauche à droite, Z0 (l'arrière) à FACADE ; à droite (XW à X1) la pièce fermée et sa porte, à
   gauche l'étal ouvert (son fond en ZE). Le grand toit : faîte de gauche à droite en (ZR, HR), il descend jusqu'à HE au
   bout de son avancée ; le toit du pignon : faîte d'avant en arrière en (CXW, HRW), ses pentes à 45° */
const X0 = -2.2, X1 = 1.9, XW = -.1, Z0 = -1.65, ZE = -.25, SOCLE = .3;
const ZR = (Z0 + FACADE) / 2, HR = 3.05, AV = .2, RUN = (FACADE - Z0) / 2 + AV, HE = 1.95, PENTE = (HR - HE) / RUN, HM = HR - PENTE * (FACADE - ZR);
const CXW = (XW + X1) / 2, HRW = 2.98, RUNW = (X1 - XW) / 2 + .22, HMW = HRW - (X1 - XW) / 2;
const CX = (X0 + X1) / 2;

/* des planches debout de a à b sur un mur, de bas jusqu'au haut donné par haut(u), sauf les trous [u0, u1, y0, y1] */
function planches(g, a, b, fixe, le, haut, bas = SOCLE, trous = []){
  const n = Math.max(1, Math.round((b - a) / .22)), l = (b - a) / n;
  for(let k = 0; k < n; k++){
    const u = a + (k + .5) * l, h1 = haut(u);
    let morceaux = [[bas, h1]];
    for(const [u0, u1, y0, y1] of trous) if(u > u0 && u < u1) morceaux = morceaux.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of morceaux) if(q - p > .03){
      if(le === "x") boite(g, ton(k), l - .02, q - p, .07, u, (p + q) / 2, fixe);
      else boite(g, ton(k), .07, q - p, l - .02, fixe, (p + q) / 2, u);
    }
  }
}
/* le socle : de grosses pierres claires de a à b */
function socle(g, a, b, fixe, le, devant){
  let u = a;
  while(u < b - .03){
    const l = Math.min(b - u, .38 + hasard() * .28), ll = b - u - l < .2 ? b - u : l, c = u + ll / 2;
    if(le === "x") bloc(g, pierre(), ll - .04, SOCLE - .02, .32, c, SOCLE / 2, fixe + devant * .05, (hasard() - .5) * .04, BLOC_L);
    else bloc(g, pierre(), .32, SOCLE - .02, ll - .04, fixe + devant * .05, SOCLE / 2, c, (hasard() - .5) * .04, BLOC_L);
    u += ll;
  }
}
const ARC = {w: .74, h: 1.42};
function halle(g){
  /* le coeur, qui comble tout derrière les planches, et les combles sous les toits */
  boite(g, FONCE, X1 - XW - .1, HMW - .1, FACADE - Z0 - .1, CXW, HMW / 2, ZR);
  boite(g, FONCE, XW - X0, HM - .1, ZE - Z0, (X0 + XW) / 2, HM / 2, (Z0 + ZE) / 2);
  ajoute(g, part(G.gable, FONCE, X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, CX, HM - .02, ZR));
  ajoute(g, part(G.gable, FONCE, FACADE + .38, HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FACADE - .42) / 2)).rotation.y = Math.PI / 2;
  /* le socle de pierres claires, sous la pièce et sous le fond de l'étal ; deux grosses pierres de part et d'autre de la porte */
  socle(g, XW, X1, FACADE, "x", 1); socle(g, Z0, FACADE, X1, "z", 1); socle(g, Z0, FACADE, X0, "z", -1);
  for(const [x, w] of [[XW + .2, .5], [X1 - .05, .46]]) bloc(g, pierre(), w, .62, .46, x, .31, FACADE + .08);
  bloc(g, PIERRE[2], .4, .36, .4, X1 - .05, .8, FACADE + .06);
  /* la façade de la pièce : les planches, les poteaux, la sablière, la lisse, le lien à gauche de la porte */
  const zF = FACADE + .02;
  planches(g, XW, X1, zF, "x", () => HMW, SOCLE, [[PORTE_X - ARC.w / 2 - .08, PORTE_X + ARC.w / 2 + .08, 0, ARC.h + .3]]);
  for(const x of [XW + .08, X1 - .08]) boite(g, FONCE, .2, HMW - .2, .14, x, (HMW + .2) / 2 + .05, zF + .06);
  boite(g, BOIS[1], X1 - XW + .14, .18, .16, CXW, HMW, zF + .08);
  { const x0 = XW + .2, x1 = PORTE_X - ARC.w / 2 - .14, h = .7; planche(g, FONCE, .12, Math.hypot(x1 - x0, h), .08, (x0 + x1) / 2, HMW - .1 - h / 2, zF + .06, 0, 0, -Math.atan2(x1 - x0, h)); }
  /* le pignon de devant : les planches, le poinçon, les liens qui descendent du poinçon */
  for(let k = 0, n = Math.round((X1 - XW) / .22); k < n; k++){ const l = (X1 - XW) / n, x = XW + (k + .5) * l, h1 = HRW - .12 - Math.abs(x - CXW);
    if(h1 > HMW) boite(g, ton(k + 1), l - .02, h1 - HMW + .05, .07, x, (h1 + HMW) / 2, zF); }
  boite(g, FONCE, .18, HRW - HMW - .15, .12, CXW, (HRW + HMW) / 2 - .05, zF + .06);
  for(const s of [-1, 1]){ const w = .62, h = .5;
    planche(g, FONCE, .13, Math.hypot(w, h), .08, CXW + s * w / 2, HMW + .1 + h / 2, zF + .06, 0, 0, s * Math.atan2(w, h)); }
  /* les côtés : des planches jusqu'aux toits */
  const toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08;
  planches(g, Z0, FACADE, X1 + .02, "z", z => z > -.3 ? HMW - .04 : toitZ(z));
  planches(g, Z0, ZE, X0 - .02, "z", toitZ);
  for(const z of [Z0 + .06, FACADE - .06]) boite(g, FONCE, .14, HMW - SOCLE, .16, X1 + .05, (HMW + SOCLE) / 2, z);
  /* le fond de l'étal : des planches couchées */
  for(let y = SOCLE + .1; y < HM - .05; y += .21) boite(g, ton(Math.round(y * 10)), XW - X0, .19, .07, (X0 + XW) / 2, y, ZE + .04);
}
/* les toits de larges planches qui descendent du faîte, quelques clous ronds ; les faîtes et leurs gros blocs cloués */
function versant(g, x, y, z, rot, a, u0, u1, L, larg){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o);
  const n = Math.max(2, Math.round((u1 - u0) / larg)), l = (u1 - u0) / n;
  for(let k = 0; k < n; k++){
    const u = u0 + (k + .5) * l, dl = (k % 2) * .06;
    bloc(i, ton(k), l - .03, .14, L + dl, u, .07 + (k % 2) * .02, L / 2 + dl / 2, (hasard() - .5) * .02, BLOC_L);
    if(k % 2 === 0) ajoute(i, part(G.cyl, CLOU, .1, .03, .1, u, .16, L * (.3 + hasard() * .4)));
  }
}
function toits(g){
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05;
  versant(g, 0, HR, ZR, 0, a, X0 - .22, XW + .3, L, .48);                       // devant, au-dessus de l'étal
  versant(g, 0, HR, ZR, Math.PI, a, -(X1 + .3), -(X0 - .22), L, .55);         // derrière, sur toute la largeur
  const LW = RUNW * Math.SQRT2 + .05, zA = -.95, zB = FACADE + .2;
  versant(g, CXW, HRW, 0, Math.PI / 2, Math.PI / 4, -zB, -zA, LW, .42);        // le pignon, à droite
  versant(g, CXW, HRW, 0, -Math.PI / 2, Math.PI / 4, zA, zB, LW, .42);         // et à gauche
  /* la poutre du faîte et ses blocs, le faîte du pignon et son bloc de devant */
  bloc(g, BOIS[1], X1 - X0 + .5, .22, .26, CX + .05, HR + .14, ZR, 0, BLOC_L);
  for(const x of [X0 - .14, X1 + .2]){ bloc(g, CLAIR, .36, .32, .4, x, HR + .16, ZR);
    ajoute(g, part(G.cyl, CLOU, .12, .03, .12, x, HR + .33, ZR)); }
  bloc(g, BOIS[1], .26, .22, zB - zA, CXW, HRW + .12, (zA + zB) / 2, 0, BLOC_L);
  bloc(g, CLAIR, .4, .34, .36, CXW, HRW + .12, zB + .04);
  ajoute(g, part(G.cyl, CLOU, .12, .03, .12, CXW, HRW + .3, zB + .04));
  for(const s of [-1, 1]) bloc(g, CLAIR, .34, .26, .3, CXW + s * (RUNW - .05), HRW - RUNW + .08, zB + .02);   // les bouts des rives
  g.userData.toit = HR + .35;
}
/* la porte de planches dans son cadre épais, ses deux pentures fléchées, l'anneau ; les deux marches de pierre */
function porte(g){
  const z = FACADE + .03, w = ARC.w, h = ARC.h, y0 = SOCLE - .04;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0xB4682C, w / 4 - .015, h, .06, PORTE_X - w / 2 + (k + .5) * w / 4, y0 + h / 2, z);
  for(const s of [-1, 1]) boite(g, BOIS[0], .15, h + .16, .16, PORTE_X + s * (w / 2 + .075), y0 + (h + .16) / 2, z + .05);
  boite(g, CLAIR, w + .5, .16, .2, PORTE_X, y0 + h + .14, z + .07);
  for(const y of [y0 + .3, y0 + h - .3]){ boite(g, FER, w * .82, .1, .03, PORTE_X + .03, y, z + .05);
    const bout = ajoute(g, part(G.cone4, FER, .16, .16, .03, PORTE_X + .03 + w * .41 + .06, y, z + .05)); bout.rotation.z = -Math.PI / 2;
    for(const x of [-.2, 0, .2]) ajoute(g, part(G.head, CLOU, .14, .14, .1, PORTE_X + x, y, z + .07));
    boite(g, FER, .1, .16, .05, PORTE_X - w / 2 + .03, y, z + .06); }
  ajoute(g, part(G.tore, FER, .22, .22, .3, PORTE_X + .2, y0 + .7, z + .07));
  ajoute(g, part(G.cyl, FER, .09, .04, .09, PORTE_X + .2, y0 + .81, z + .05)).rotation.x = Math.PI / 2;
  bloc(g, PIERRE[0], 1.15, .16, .44, PORTE_X, .08, FACADE + .42); bloc(g, PIERRE[2], .98, .15, .28, PORTE_X, .22, FACADE + .22);
}
/* à droite de la porte : la potence de fer et la lanterne qui pend, qui brille la nuit */
function lanterneMarche(g){
  const x = 1.62, y = 1.5, z = FACADE + .1;
  boite(g, FER, .08, .2, .05, x - .12, y + .44, z);
  boite(g, FER, .24, .05, .05, x, y + .4, z + .02);
  boite(g, FER, .025, .12, .025, x + .09, y + .3, z + .05);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x + .09, y + .18, z + .05)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x + .09, y, z + .05));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + .09 + dx, y, z + .05 + dz);
  boite(g, FER, .2, .04, .2, x + .09, y - .13, z + .05);
}
/* les fruits de la saison, comme dans la vraie nature : cinq cagettes, trois sur l'étagère, deux par terre */
const SAISON_FRUITS = {
  printemps: ["fraise", "pomme", "fraise", "pomme", "noix"],
  ete: ["cerise", "fraise", "groseille", "prune", "cerise"],
  automne: ["pomme", "poire", "raisin", "coing", "pomme"],
  hiver: ["pomme", "poire", "noix", "pomme", "noisette"]
};
const ROUGE = 0xD6342A, ROUGE_S = 0x9A2420;
/* un fruit posé en (x, y, z) (y : le bas du fruit) ; feuille : une petite feuille à côté de la queue */
function fruit(g, sorte, x, y, z, feuille){
  const queue = (h, dy) => boite(g, 0x6A4424, .02, h, .02, x, y + dy, z);
  if(sorte === "pomme"){ ajoute(g, part(FRUIT, hasard() < .3 ? 0xE85A2C : ROUGE, .17, .15, .17, x, y + .075, z)); queue(.06, .16);
    if(feuille) ajoute(g, part(BAIE, FEUILLE[0], .09, .025, .05, x + .04, y + .17, z)).rotation.z = .4; }
  else if(sorte === "poire"){ ajoute(g, part(FRUIT, 0xE8C43A, .15, .14, .15, x, y + .07, z));
    ajoute(g, part(FRUIT, 0xE8C43A, .1, .14, .1, x, y + .16, z)); queue(.06, .25); }
  else if(sorte === "coing"){ ajoute(g, part(FRUIT, 0xE6C640, .18, .16, .18, x, y + .08, z)); ajoute(g, part(BAIE, 0x8A6A3A, .04, .03, .04, x, y + .165, z)); }
  else if(sorte === "prune"){ ajoute(g, part(FRUIT, 0x5C3A78, .11, .12, .1, x, y + .06, z)); }
  else if(sorte === "noix"){ ajoute(g, part(BAIE, 0xB28C5C, .1, .09, .1, x, y + .045, z)); }
  else if(sorte === "noisette"){ ajoute(g, part(BAIE, 0xA8723A, .07, .07, .07, x, y + .035, z)); }
  else if(sorte === "fraise"){ const f = ajoute(g, part(G.cone, 0xE02A2A, .08, .1, .08, x, y + .05, z)); f.rotation.x = Math.PI; ajoute(g, part(BAIE, FEUILLE[1], .07, .02, .07, x, y + .1, z)); }
  else if(sorte === "cerise"){ for(const dx of [-.03, .03]) ajoute(g, part(BAIE, 0xA8142A, .065, .065, .065, x + dx, y + .03, z)); queue(.08, .1); }
  else if(sorte === "groseille"){ for(let k = 0; k < 4; k++) ajoute(g, part(BAIE, 0xE8203A, .04, .04, .04, x + (k - 1.5) * .03, y + .02 + (k % 2) * .02, z + (k % 2) * .02)); }
  else if(sorte === "raisin"){ for(let r = 0; r < 3; r++) for(let k = 0; k <= 2 - r; k++)
      ajoute(g, part(BAIE, r % 2 ? 0x6A3A8A : 0x7A4498, .06, .06, .06, x + (k - (2 - r) / 2) * .055, y + .03 + r * .025, z + r * .035 - .03));
    if(feuille) ajoute(g, part(BAIE, FEUILLE[0], .1, .025, .07, x + .05, y + .1, z + .03)).rotation.z = .3; }
}
const PAS = {pomme: .16, poire: .15, coing: .17, prune: .11, noix: .1, noisette: .08, fraise: .09, cerise: .11, groseille: .14, raisin: .18};
const FOND = {pomme: ROUGE_S, poire: 0xB89428, coing: 0xB89A2A, prune: 0x3E2858, noix: 0x8A6A44, noisette: 0x7E5428, fraise: 0xA8201E, cerise: 0x7A1020, groseille: 0xA81828, raisin: 0x4A2A68};
/* une cagette de planches (deux lattes de chaque côté), son fond de fruits, ses fruits dessus */
function cagette(g, sorte, x, y, z, w = .56, d = .38, h = .24, ry = 0){
  const c = new THREE.Group(); c.position.set(x, y, z); c.rotation.y = ry; g.add(c);
  boite(c, BOIS[2], w - .04, .03, d - .04, 0, .02, 0);
  for(const yy of [.06, .17]){
    for(const s of [-1, 1]){ boite(c, BOIS[(s + 3) % 3], w, .08, .03, 0, yy, s * (d / 2 - .015)); boite(c, BOIS[1], .03, .08, d - .04, s * (w / 2 - .015), yy, 0); }
  }
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) boite(c, FONCE, .04, h, .04, sx * (w / 2 - .02), h / 2, sz * (d / 2 - .02));
  boite(c, FOND[sorte], w - .08, h - .06, d - .08, 0, (h - .06) / 2 + .02, 0);
  const p = PAS[sorte], nx = Math.max(1, Math.floor((w - .08) / p)), nz = Math.max(1, Math.floor((d - .08) / p));
  for(let i = 0; i < nx; i++) for(let k = 0; k < nz; k++)
    fruit(c, sorte, (i - (nx - 1) / 2) * p + (hasard() - .5) * .02, h - .07, (k - (nz - 1) / 2) * p + (hasard() - .5) * .02, i === 0 && k === 0);
}
/* l'étal : les poteaux et leurs jambes de force, la traverse, l'auvent de toile à festons, l'étagère et ses cagettes,
   les cagettes par terre, le tonneau */
function etal(g, saison){
  const zP = FACADE - .02, xa = X0 + .1, hT = HM - .1;
  for(const x of [xa, XW + .02]){ boite(g, BOIS[0], .18, hT, .18, x, hT / 2, zP);
    bloc(g, pierre(), .3, .16, .3, x, .08, zP); }
  boite(g, BOIS[1], XW - X0 + .2, .18, .18, (X0 + XW) / 2, hT, zP);                         // la traverse
  for(const [x, s] of [[xa, 1], [XW + .02, -1]]) planche(g, FONCE, .1, .56, .1, x + s * .2, hT - .22, zP, 0, 0, s * .8);   // les jambes de force
  boite(g, BOIS[0], .14, hT - .3, .14, xa, (hT - .3) / 2 + .3, ZE + .1);                      // le poteau du fond
  boite(g, BOIS[1], .14, .14, zP - ZE, xa, hT, (zP + ZE) / 2);
  /* l'auvent : des lés de toile crème qui descendent vers l'avant, leurs festons ronds au bord */
  const yH = hT - .02, yB = hT - .32, dz = .75, a = Math.atan2(yH - yB, dz), L = Math.hypot(yH - yB, dz), u0 = X0 - .05, u1 = XW + .12, n = 6, l = (u1 - u0) / n;
  for(let k = 0; k < n; k++){
    const x = u0 + (k + .5) * l;
    planche(g, TOILE[k % 2], l + .005, .04, L, x, (yH + yB) / 2 + .1, zP + dz / 2, a, 0, 0);
    ajoute(g, part(FESTON, TOILE[k % 2], l * .98, l * .5, .04, x, yB + .1, zP + dz + .01));
  }
  boite(g, BOIS[2], u1 - u0 + .1, .1, .1, (u0 + u1) / 2, yB + .12, zP + dz + .02);            // la baguette du bord
  /* l'étagère sur ses deux montants, son devant de planches, et dessous l'ombre de l'étal */
  const fr = SAISON_FRUITS[saison] || SAISON_FRUITS.automne, ye = .62, ze = .62, de = .56;
  boite(g, BOIS[1], XW - X0 - .2, .08, de, (X0 + XW) / 2, ye, ze);
  boite(g, CLAIR, XW - X0 - .2, .08, .08, (X0 + XW) / 2, ye + .02, ze + de / 2);
  for(let y = SOCLE - .1; y < ye - .05; y += .2) boite(g, ton(Math.round(y * 10) + 1), XW - X0 - .3, .18, .06, (X0 + XW) / 2, y + .09, ze + de / 2 - .04);
  for(const x of [X0 + .3, XW - .25]) boite(g, FONCE, .1, ye, .1, x, ye / 2, ze + de / 2 - .1);
  const xs = [-1.72, -1.13, -.54];
  xs.forEach((x, k) => cagette(g, fr[k], x, ye + .04, ze, .56, .4, .24, (k - 1) * .06));
  cagette(g, fr[3], -1.4, 0, 1.72, .6, .42, .3, .08);
  cagette(g, fr[4], -.66, 0, 1.78, .6, .42, .3, -.06);
  /* le tonneau de douelles cerclé de fer, à gauche */
  const x = -2.1, z = 1.42, r = .25, h = .56;
  for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2;
    planche(g, ton(k), .14, h, .05, x + Math.sin(an) * r, h / 2 + .02, z + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .06, .04, r * 2 - .06, x, h - .04, z));
  for(const y of [.12, .45]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, x, y, z)); c.rotation.x = Math.PI / 2; }
}
/* le sol : la plaque de sable, des cailloux, quelques pierres */
function sol(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 2.4, .052, 1.0, -1.1, .027, 1.75)); s.receiveShadow = true; s.castShadow = false;
  for(let k = 0; k < 16; k++){
    const x = -2.3 + hasard() * 4.6, z = 1.35 + hasard() * 1.05;
    if(Math.abs(x - PORTE_X) < .65 || (x > -2.4 && x < -.3 && z < 2.05)) continue;              // le passage devant la porte, les cagettes et le tonneau
    const c = .05 + hasard() * .06, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
  for(const [x, z, sx, sy, sz] of [[2.2, 1.6, .3, .2, .28], [-2.3, .6, .26, .18, .24], [2.25, -.9, .4, .32, .4]]){
    const r = ajoute(g, part(CAILLOU, pierre(), sx, sy, sz, x, sy * .36, z)); r.rotation.set(0, hasard() * 3, 0); }
}
export function marcheNiveau1(g, opt = {}){
  alea = 17;
  sol(g);
  halle(g);
  toits(g);
  porte(g);
  lanterneMarche(g);
  etal(g, opt.saison || "automne");
}
