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
  ajoute(g, part(G.gable, FONCE, FACADE - .02 - ZR, HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FACADE - .02 + ZR) / 2)).rotation.y = Math.PI / 2;   // jusqu'au grand faîte, pas au-delà
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
function versant(g, x, y, z, rot, a, u0, u1, L, larg, longueur = null){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o);
  const n = Math.max(2, Math.round((u1 - u0) / larg)), l = (u1 - u0) / n;
  for(let k = 0; k < n; k++){
    const u = u0 + (k + .5) * l, dl = (k % 2) * .06, L0 = L;
    if(longueur) L = Math.min(L0, longueur(u));                                  // une planche plus courte : elle s'arrête contre un autre toit
    bloc(i, ton(k), l - .03, .14, L + dl, u, .07 + (k % 2) * .02, L / 2 + dl / 2, (hasard() - .5) * .02, BLOC_L);
    if(longueur){ if(k % 2 === 0) ajoute(i, part(G.cyl, CLOU, .1, .03, .1, u, .16, L * .4)); L = L0; continue; }
    if(k % 2 === 0) ajoute(i, part(G.cyl, CLOU, .1, .03, .1, u, .16, L * (.3 + hasard() * .4)));
  }
}
function toits(g){
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05;
  versant(g, 0, HR, ZR, 0, a, X0 - .22, XW + .3, L, .48);                       // devant, au-dessus de l'étal
  /* et derrière le pignon : chaque planche s'arrête où elle rencontre le toit du pignon (la noue) ; avant, on voyait le dessous
     sombre des combles (Yo, 13 novembre 2026) */
  versant(g, 0, HR, ZR, 0, a, XW + .3, X1 + .3, L, .48, u => (HR - HRW + Math.abs(u - CXW) + .12) / PENTE / Math.cos(a));
  versant(g, 0, HR, ZR, Math.PI, a, -(X1 + .3), -(X0 - .22), L, .55);         // derrière, sur toute la largeur
  /* le toit du pignon s'arrête au grand faîte (Yo, 13 novembre 2026 : avant, il passait derrière et ressortait à travers le toit) */
  const LW = RUNW * Math.SQRT2 + .05, zA = ZR - .05, zB = FACADE + .2;
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

/* ================= Le Marché, niveau 2 =================
   D'après l'image de Yo (14 novembre 2026 : « Voici le marché de niveau 2 » ; « Au milieu comme l'image ») : la même place
   (5 × 5), la porte au milieu (B.marche.doorNiveau). La grande halle de bois : ses gros poteaux sur des socles de pierres
   claires, leurs liens en arc, le grand toit de tuiles orange arrondies, son faîte et ses gros blocs ; au milieu, le pavillon
   de l'entrée, son toit en pignon qui avance, ses colombages et sa fenêtre allumée en arc, la grande porte à deux battants en
   arc, leurs pentures et leurs deux anneaux, les marches de pierre, une lanterne de chaque côté. À gauche, l'étal des fruits
   sous son auvent rayé rouge et crème à festons : l'étagère et ses cagettes (les fruits de la saison, comme au niveau 1 et
   comme la vraie nature), la nappe crème, deux tonneaux, deux caisses. À droite, l'étal des étoffes sous son auvent rayé : la
   balance dorée, les étoffes pliées, celles pendues à leur barre, la nappe violette à franges dorées, un tonneau, une caisse.
   La plaque de sable. Les lanternes et la fenêtre brillent plus fort la nuit. Fait le tour : l'arrière et les côtés fermés de
   planches, rien d'ouvert (Yo, 14 novembre 2026). */
const M2 = {X0: -2.25, X1: 2.25, Z0: -1.55, ZE: -.25, HR: 3.1, AV: .38, PX: .82, FW: FACADE + .16, HRW: 3.2};
M2.ZR = (M2.Z0 + FACADE) / 2; M2.RUN = (FACADE - M2.Z0) / 2 + M2.AV; M2.PENTE = (M2.HR - 2.0) / M2.RUN; M2.HM = M2.HR - M2.PENTE * (FACADE - M2.ZR);
M2.RUNW = M2.PX + .28; M2.HMW = M2.HRW - M2.PX;
const TUILE2 = [0xE07834, 0xEA8640, 0xD86C2C, 0xF0904A], TUILE2_F = 0xC0602A, RAYE = [0xD8452E, 0xF6E8C8], VIOLET = 0x8A4AA8, OR2 = 0xE3A92C;
const VITRE2 = toon({color: 0xFFD060, emissive: 0xFFA630, emissiveIntensity: .7});
lanterne(null, 0, 0, VITRE2);
const ARC2 = new THREE.TorusGeometry(1, .12, 6, 16, Math.PI), DEMI2 = new THREE.CylinderGeometry(.5, .5, 1, 16, 1, false, -Math.PI / 2, Math.PI);
/* une pente posée : faîte en (x, y, z), qui descend vers rot (0 : vers l'avant), inclinée de a ; le repère : x le long du faîte,
   z qui descend la pente, y vers le dehors */
function poser2(g, x, y, z, rot, a){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o); return i;
}
/* des tuiles orange arrondies en rangs qui se chevauchent, en quinconce, sur un fond de leur couleur ; sauf(u, z) : pas là */
function tuiles2(g, a, b, L, sauf = () => false){
  const rangs = Math.max(3, Math.round(L / .36)), h = L / rangs, w = .42;
  boite(g, TUILE2_F, b - a, .06, L, (a + b) / 2, .02, L / 2);
  for(let k = 0; k < rangs; k++){
    const z = (k + .6) * h, y = .07 + (rangs - k) * .012, dec = k % 2 ? w / 2 : 0;
    for(let i = -1; ; i++){ let u0 = a + i * w + dec, u1 = u0 + w; if(u0 >= b) break; u0 = Math.max(u0, a); u1 = Math.min(u1, b); if(u1 - u0 < .06) continue;
      if(sauf((u0 + u1) / 2, z)) continue;
      const t = ajoute(g, part(BLOC_L, TUILE2[(k * 3 + i * 5 + 8) % 4], u1 - u0 - .02, .1, h * 1.45, (u0 + u1) / 2, y, z)); t.rotation.x = -.08; }
  }
}
/* un lien en arc entre un poteau et la poutre (des petits morceaux sur un quart de cercle) */
function lienArc(g, x, y, z, s, r = .42){
  for(let k = 0; k < 5; k++){ const a0 = k / 5 * Math.PI / 2, a1 = (k + 1) / 5 * Math.PI / 2, am = (a0 + a1) / 2;
    planche(g, BOIS[0], .1, r * Math.PI / 2 / 5 + .02, .12, x + s * (r - Math.cos(am) * r), y - r + Math.sin(am) * r, z, 0, 0, s * (Math.PI / 2 - am)); }
}
/* la halle : le cœur fermé derrière les étals, les planches de l'arrière et des côtés, les poteaux et leurs socles, la poutre */
function halle2(g){
  const {X0, X1, Z0, ZE, HM, ZR, PENTE, HR} = M2;
  boite(g, FONCE, X1 - X0 - .1, HM - .1, ZE - Z0, 0, HM / 2, (Z0 + ZE) / 2);                       // le cœur, derrière
  ajoute(g, part(G.gable, FONCE, X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, 0, HM - .02, ZR));        // les combles
  const toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08;
  planches(g, X0, X1, Z0 - .02, "x", () => HM);                                                     // l'arrière
  for(const x of [X0 - .02, X1 + .02]) planches(g, Z0, FACADE, x, "z", z => z < ZE + .05 ? toitZ(z) : HM - .05, SOCLE, [[ZE + .1, FACADE - .1, .95, HM - .15]]);   // les côtés, ouverts en haut sur l'étal
  for(const x of [X0 + .02, X1 - .02]) for(const z of [Z0 + .06, FACADE]) bloc(g, pierre(), .34, .34, .34, x, .17, z);
  for(const x of [X0 + .02, X1 - .02]) boite(g, BOIS[0], .2, HM - .34, .2, x, .34 + (HM - .34) / 2, FACADE);   // les poteaux des coins
  for(const z of [FACADE + .02]) boite(g, BOIS[1], X1 - X0 + .3, .2, .2, 0, HM - .05, z);         // la poutre de devant
  for(const s of [-1, 1]) lienArc(g, s > 0 ? X1 - .12 : X0 + .12, HM - .15, FACADE + .02, s > 0 ? -1 : 1);
  /* le fond des étals : des planches couchées ; leur plancher */
  for(let y = SOCLE; y < HM - .1; y += .21) boite(g, ton(Math.round(y * 10)), X1 - X0 - .1, .19, .07, 0, y + .09, ZE + .04);
  boite(g, BOIS[2], X1 - X0 - .2, .06, FACADE - ZE, 0, .03, (ZE + FACADE) / 2);
}
/* le pavillon de l'entrée : ses murs de planches et ses colombages, les piliers de pierre, la porte, le pignon et sa fenêtre */
function pavillon(g){
  const {PX, FW, HMW, HRW, ZE} = M2, z = FW + .02;
  boite(g, FONCE, PX * 2 - .1, HMW - .1, FW - ZE, 0, HMW / 2, (FW + ZE) / 2);                       // le cœur
  ajoute(g, part(G.gable, FONCE, FW - M2.ZR + .1, HRW - HMW, PX * 2 - .1, 0, HMW - .02, (FW + M2.ZR) / 2)).rotation.y = Math.PI / 2;
  for(const x of [-PX + .02, PX - .02]) planches(g, ZE, FW, x, "z", () => HMW - .05);
  /* les piliers de pierres claires jointives de part et d'autre de la porte, les poteaux au-dessus */
  for(const s of [-1, 1]){ const x = s * (PX - .14);
    for(let r = 0; r < 4; r++) bloc(g, pierre(), .32, .24, .3, x, .12 + r * .25, z + .02, 0, BLOC_L);
    boite(g, BOIS[0], .22, HMW - 1.0, .2, x, 1.0 + (HMW - 1.0) / 2, z + .03);
    lienArc(g, x - s * .1, HMW - .12, z + .06, -s, .32); }
  boite(g, BOIS[1], PX * 2 + .14, .2, .2, 0, HMW - .02, z + .05);                                   // la sablière
  boite(g, BOIS[1], PX * 2 - .2, .14, .14, 0, 1.98, z + .05);                                       // la poutre au-dessus de la porte
  /* la grande porte à deux battants, en arc, dans son cadre arrondi ; les pentures, les deux anneaux ; les marches */
  const w = .92, r = w / 2, y0 = SOCLE - .02, hd = 1.18;
  for(let k = 0; k < 6; k++){ const x = -w / 2 + (k + .5) * w / 6, haut = hd + Math.sqrt(Math.max(0, (r - .02) ** 2 - x * x));
    boite(g, k % 2 ? PORTE_C : 0xB4682C, w / 6 - .014, haut, .06, x, y0 + haut / 2, z); }
  boite(g, FONCE, .03, hd + r, .07, 0, y0 + (hd + r) / 2, z + .02);                                // la fente entre les battants
  const arc = ajoute(g, part(ARC2, BOIS[0], r + .07, r + .07, .9, 0, y0 + hd, z + .04));
  for(const s of [-1, 1]) boite(g, BOIS[0], .13, hd, .16, s * (r + .07), y0 + hd / 2, z + .04);
  for(const y of [y0 + .32, y0 + hd - .1]) for(const s of [-1, 1]){ boite(g, FER, w / 2 - .08, .09, .03, s * w / 4, y, z + .05);
    for(const dx of [.08, .2, .32]) ajoute(g, part(G.head, CLOU, .12, .12, .08, s * dx, y, z + .07)); }
  for(const s of [-1, 1]){ ajoute(g, part(G.tore, FER, .2, .2, .3, s * .12, y0 + .72, z + .07)); ajoute(g, part(G.cyl, FER, .08, .04, .08, s * .12, y0 + .82, z + .05)).rotation.x = Math.PI / 2; }
  bloc(g, PIERRE[0], 1.25, .16, .46, 0, .08, FW + .44); bloc(g, PIERRE[2], 1.05, .15, .3, 0, .22, FW + .22);
  /* le pignon : les planches, le poinçon, les liens en V, la fenêtre allumée en arc */
  const zp = z;
  for(let k = 0, n = Math.round(PX * 2 / .2); k < n; k++){ const l = PX * 2 / n, x = -PX + (k + .5) * l, h1 = HRW - .12 - Math.abs(x);
    if(h1 > HMW) boite(g, k % 2 ? TOILE[0] : TOILE[1], l - .01, h1 - HMW + .05, .06, x, (h1 + HMW) / 2, zp); }
  boite(g, BOIS[1], .14, HRW - HMW - .15, .1, 0, (HRW + HMW) / 2 - .05, zp + .05);
  for(const s of [-1, 1]){ const L = Math.hypot(.36, .4); planche(g, BOIS[1], .1, L, .08, s * .2, HMW + .3, zp + .05, 0, 0, -s * Math.atan2(.36, .4)); }
  const fy = HMW + .26;
  for(const s of [-1, 1]){ ajoute(g, part(G.box, VITRE2, .2, .26, .03, s * .14, fy, zp + .02)); ajoute(g, part(DEMI2, VITRE2, .2, .03, .2, s * .14, fy + .13, zp + .02)).rotation.x = Math.PI / 2; }
  for(const s of [-1, 1]) planche(g, BOIS[0], RUNW2() * Math.SQRT2, .18, .14, s * RUNW2() / 2, HRW - RUNW2() / 2 - .04, zp + .12, 0, 0, -s * Math.PI / 4);   // les rives
}
const RUNW2 = () => M2.RUNW;
/* les toits : le grand toit devant et derrière, sa noue derrière le pignon ; le toit du pignon ; les faîtes et leurs blocs */
function toits2(g){
  const {X0, X1, HR, ZR, PENTE, RUN, RUNW, HRW, FW} = M2, a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05;
  tuiles2(poser2(g, 0, HR + .02, ZR, 0, a), X0 - .32, X1 + .32, L, (u, z) => HR - Math.sin(a) * z < HRW - Math.abs(u) + .06 && Math.abs(u) < RUNW);
  tuiles2(poser2(g, 0, HR + .02, ZR, Math.PI, a), -(X1 + .32), -(X0 - .32), L);
  const LW = RUNW * Math.SQRT2 + .05, zA = ZR, zB = FW + .32;
  tuiles2(poser2(g, 0, HRW + .02, 0, Math.PI / 2, Math.PI / 4), -zB, -zA, LW);
  tuiles2(poser2(g, 0, HRW + .02, 0, -Math.PI / 2, Math.PI / 4), zA, zB, LW);
  /* le bout des grands toits, sur les côtés : un triangle de planches, ses rives */
  for(const [x, s] of [[X0 - .03, -1], [X1 + .03, 1]]){
    const sh = new THREE.Shape(), b = M2.HM - .06, h = HR - .06; sh.moveTo(M2.Z0 - .02, b); sh.lineTo(ZR, h); sh.lineTo(FACADE + .02, b); sh.closePath();
    ajoute(g, part(new THREE.ExtrudeGeometry(sh, {depth: .06, bevelEnabled: false}).rotateY(-Math.PI / 2), BOIS[1], 1, 1, 1, x + (s > 0 ? .06 : 0), 0, 0));
    for(const c of [-1, 1]) planche(g, BOIS[0], .1, .17, L + .04, x + s * .06, HR - .04 - Math.sin(a) * L / 2, ZR + c * Math.cos(a) * L / 2, c * a, 0, 0); }
  /* les faîtes : une poutre de tuiles rondes, de gros blocs cloutés aux bouts et au bout du pignon */
  const fa = ajoute(g, part(G.cyl, TUILE2[2], .3, X1 - X0 + .7, .3, 0, HR + .16, ZR)); fa.rotation.z = Math.PI / 2;
  const fb = ajoute(g, part(G.cyl, TUILE2[2], .3, zB - zA, .3, 0, HRW + .16, (zA + zB) / 2)); fb.rotation.x = Math.PI / 2;
  for(const [x, y, z] of [[X0 - .3, HR + .2, ZR], [X1 + .3, HR + .2, ZR], [0, HRW + .2, zB + .02]]){
    bloc(g, CLAIR, .38, .34, .38, x, y, z); ajoute(g, part(G.cyl, CLOU, .1, .03, .1, x, y + .18, z)); }
  g.userData.toit = HRW + .45;
}
/* une lanterne de fer sur sa potence, contre le pavillon */
function lanterne2(g, x, y, z, s){
  boite(g, FER, .06, .18, .05, x, y + .44, z);
  boite(g, FER, .05, .05, .26, x, y + .38, z + .12);
  boite(g, FER, .025, .12, .025, x, y + .29, z + .24);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .18, z + .24)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .24));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .24 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .24);
}
/* un auvent rayé rouge et crème, de u0 à u1, qui descend vers l'avant ; ses festons */
function auvent(g, u0, u1){
  const yH = 1.95, yB = 1.62, dz = .7, a = Math.atan2(yH - yB, dz), L = Math.hypot(yH - yB, dz), n = Math.round((u1 - u0) / .24), l = (u1 - u0) / n, zP = FACADE + .04;
  for(let k = 0; k < n; k++){ const x = u0 + (k + .5) * l;
    planche(g, RAYE[k % 2], l + .004, .04, L, x, (yH + yB) / 2, zP + dz / 2, a, 0, 0);
    ajoute(g, part(FESTON, RAYE[k % 2], l * .98, l * .5, .04, x, yB - .01, zP + dz + .01)); }
  boite(g, BOIS[2], u1 - u0 + .08, .08, .08, (u0 + u1) / 2, yB + .01, zP + dz + .02);               // la baguette du bord
  for(const x of [u0 + .05, u1 - .05]) planche(g, FER, .03, .55, .03, x, yB + .18, zP + dz * .6, -.9, 0, 0);   // les tirants
}
/* un tonneau de douelles cerclé de fer ; une caisse de planches à croisillon */
function tonneau2(g, x, z, r = .24, h = .5){
  for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2; planche(g, ton(k), .13, h, .05, x + Math.sin(an) * r, h / 2 + .02, z + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .05, .04, r * 2 - .05, x, h - .04, z));
  for(const y of [.1, h - .1]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, x, y, z)); c.rotation.x = Math.PI / 2; }
}
function caisse(g, x, z, c = .42, ry = 0){
  const o = new THREE.Group(); o.position.set(x, 0, z); o.rotation.y = ry; g.add(o);
  boite(o, BOIS[1], c, c, c, 0, c / 2, 0);
  for(const s of [-1, 1]){ boite(o, BOIS[0], c + .02, .06, .03, 0, c / 2 + s * (c / 2 - .05), c / 2 + .01); boite(o, BOIS[0], .06, c, .03, s * (c / 2 - .03), c / 2, c / 2 + .01); }
  planche(o, BOIS[0], .06, c * 1.25, .03, 0, c / 2, c / 2 + .015, 0, 0, Math.PI / 4);
}
/* l'étal des fruits, à gauche : l'étagère, ses cagettes (la saison), la nappe crème, les tonneaux, les caisses */
function etalFruits(g, saison){
  const {X0, PX} = M2, xa = X0 + .15, xb = -PX - .12, cx = (xa + xb) / 2;
  auvent(g, X0 - .1, -PX + .02);
  const fr = SAISON_FRUITS[saison] || SAISON_FRUITS.automne, ye = .7, ze = .55, de = .55;
  boite(g, BOIS[1], xb - xa, .08, de, cx, ye, ze);                                                  // le plateau
  for(const x of [xa + .06, xb - .06]) for(const dz of [-de / 2 + .05, de / 2 - .05]) boite(g, FONCE, .08, ye, .08, x, ye / 2, ze + dz);
  for(const s of [-1, 1]) boite(g, TOILE[0], (xb - xa) / 2 - .02, .38, .03, cx + s * (xb - xa) / 4, ye - .2, ze + de / 2 + .03);   // la nappe crème qui pend
  [-1.7, -1.17].forEach((x, k) => cagette(g, fr[k], x, ye + .04, ze - .04, .48, .38, .22, (k - .5) * .06));
  cagette(g, fr[2], -1.3, ye + .3, ze - .2, .46, .34, .22, .05);                                    // une cagette au-dessus, sur la seconde étagère
  boite(g, BOIS[1], xb - xa, .06, .38, cx, ye + .28, ze - .2); for(const x of [xa + .06, xb - .06]) boite(g, FONCE, .06, .3, .06, x, ye + .14, ze - .35);
  tonneau2(g, -2.05, 1.58); tonneau2(g, -1.5, 1.72, .22, .44);
  caisse(g, -.95, 1.7, .36, .1); caisse(g, -1.05, 1.98, .3, -.2);
}
/* l'étal des étoffes, à droite : le comptoir, la balance dorée, les étoffes pliées et pendues, la nappe violette, le tonneau, la caisse */
function etalEtoffes(g){
  const {X1, PX} = M2, xa = PX + .12, xb = X1 - .15, cx = (xa + xb) / 2, ye = .72, ze = .55, de = .55;
  auvent(g, PX - .02, X1 + .1);
  boite(g, BOIS[1], xb - xa, .08, de, cx, ye, ze);
  for(let y = .1; y < ye - .05; y += .2) boite(g, ton(Math.round(y * 10) + 2), xb - xa, .18, .05, cx, y + .08, ze + de / 2 - .03);
  for(const x of [xa + .05, xb - .05]) boite(g, FONCE, .08, ye, .08, x, ye / 2, ze - de / 2 + .05);
  /* la nappe violette et ses franges dorées, qui pend devant */
  boite(g, VIOLET, .6, .02, de + .02, cx + .2, ye + .05, ze); boite(g, VIOLET, .6, .32, .02, cx + .2, ye - .12, ze + de / 2 + .02);
  boite(g, OR2, .6, .04, .025, cx + .2, ye - .27, ze + de / 2 + .025);
  for(let k = 0; k < 6; k++) boite(g, OR2, .02, .07, .02, cx - .07 + k * .1, ye - .32, ze + de / 2 + .025);
  /* la balance dorée : son pied, sa colonne, le fléau, deux plateaux et leurs fils */
  const bx = xa + .22, by = ye + .04;
  ajoute(g, part(G.cyl, OR2, .16, .04, .16, bx, by + .02, ze)); boite(g, OR2, .03, .42, .03, bx, by + .23, ze);
  boite(g, OR2, .46, .025, .025, bx, by + .43, ze); ajoute(g, part(G.head, OR2, .05, .05, .05, bx, by + .45, ze));
  for(const s of [-1, 1]){ const px = bx + s * .21;
    for(const dz of [-.04, .04]) planche(g, 0x9A7A30, .008, .24, .008, px, by + .31, ze + dz, 0, 0, 0);
    ajoute(g, part(G.cyl, OR2, .16, .025, .16, px, by + .19, ze)); }
  /* les étoffes pliées, en piles */
  const PLI = [[0xC8342A, 0xF4E4C6, 0x3E5AA8], [0x3E5AA8, 0xE8B848]];
  PLI.forEach((p, j) => p.forEach((hex, k) => bloc(g, hex, .34, .07, .26, cx + .22 + j * .02, ye + .08 + k * .072 + j * .23 * 0, ze - .12 + j * .2 * 0 - (j ? .0 : 0) + (j ? .02 : 0), (k - 1) * .04, BLOC_L)));
  /* la barre et les étoffes qui pendent, contre le fond */
  boite(g, BOIS[0], xb - xa - .1, .05, .05, cx, 1.55, M2.ZE + .12);
  for(const [dx, hex] of [[-.3, 0xC8342A], [-.05, 0x3E5AA8], [.22, 0xE8B848]]) boite(g, hex, .2, .5, .02, cx + dx, 1.3, M2.ZE + .14);
  tonneau2(g, 1.4, 1.62); caisse(g, 2.05, 1.66, .38, -.15);
}
/* le sol : la plaque de sable, des cailloux, deux dalles de part et d'autre des marches */
function sol2(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  for(let k = 0; k < 14; k++){
    const x = -2.3 + hasard() * 4.6, z = 2.05 + hasard() * .4;
    if(Math.abs(x) < .75) continue;
    const c = .05 + hasard() * .05, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
}
export function marcheNiveau2(g, opt = {}){
  alea = 19;
  sol2(g);
  halle2(g);
  pavillon(g);
  toits2(g);
  for(const s of [-1, 1]) lanterne2(g, s * (M2.PX - .02), 1.42, M2.FW + .06, s);
  etalFruits(g, opt.saison || "automne");
  etalEtoffes(g);
}
export const FACADE2 = M2.FW;
