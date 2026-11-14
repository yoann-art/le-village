/* ================= La Taverne, niveau 1 =================
   D'après l'image de Yo (4 novembre 2026 : « Voici la Taverne de niveau 1 »), au plus près de l'image, avec ses choix :
   « 5*5 », « Mets la porte à droite comme l'image », « Une petite fumée douce oui ». La maison de planches et de poutres
   sur son socle de pierres ; le grand toit de chaume doré en rangs d'écailles, son faîte roulé, ses blocs de bois liés de
   corde ; à droite, le pignon de devant à colombages au-dessus de la porte en arc, ses pentures de fer, son anneau, ses
   marches de pierre ; la lanterne à côté de la porte ; la fenêtre allumée à croisillons, ses volets ouverts et son appui ;
   la cheminée de pierre derrière à gauche, qui fume doucement (au temps du vent : VENT) ; l'enseigne pendue à sa potence
   par deux chaînes, le poulet rôti et le fromage ; devant, le banc et le tonneau ; du sable, des cailloux, des touffes
   d'herbe (sans tas de terre). La fenêtre et la lanterne brillent plus fort la nuit.
   Coordonnées : le milieu du carré de 5 × 5 en (0, 0), la façade de gauche en z = FACADE, le pignon de la porte un peu en
   avant (FW), la porte en x = PORTE_X (B.taverne.door). */
import { G, part, toon, VENT } from "./formes.js";
import { lanterne } from "./ciel.js";

export const FACADE = 1.12, PORTE_X = .9;
const BOIS = [0xC4692E, 0xD07836, 0xB65E28], CLAIR = 0xDB8A48, FONCE = 0x93491F, PORTE_C = 0xB86530, FER = 0x4A4A52, CLOU = 0x6A6A72,
  PAILLE = [0xF2B23A, 0xF6C04C, 0xEAA530], PAILLE_S = 0xD48F24, CORDE = 0x9A5A2A,
  PIERRE = [0xD8C6B4, 0xCDBBA8, 0xE2D3C3, 0xC4B19E], PIERRE_S = 0xA8957F, SABLE = 0xE2BE7E, SABLE_S = 0xD2AA6A, HERBE = [0x7DB54A, 0x8FC458];
/* ce qui luit, plus fort la nuit (ciel.js) : la lanterne, la fenêtre */
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
const VITRE = toon({color: 0xFFD060, emissive: 0xFFA630, emissiveIntensity: .7});
for(const m of [LUEUR, VITRE]) lanterne(null, 0, 0, m);
const FUMEE = toon({color: 0xF2F0EC, transparent: true, opacity: .42, depthWrite: false});

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
/* une pierre (ou une botte de chaume) aux arêtes adoucies : une boîte aux coins ronds */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(10, 8, .28), BLOC_L = arrondi(8, 6, .28), CAILLOU = new THREE.IcosahedronGeometry(.5, 0), ROND = new THREE.CylinderGeometry(.5, .5, 1, 14),
  ECAILLE = new THREE.SphereGeometry(.5, 10, 5), OCTO = new THREE.CylinderGeometry(.5, .5, 1, 8).rotateY(Math.PI / 8).rotateX(Math.PI / 2),
  COIN = new THREE.CylinderGeometry(.5, .5, 1, 3).rotateX(Math.PI / 2);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0, geo = BLOC) => { const m = ajoute(g, part(geo, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 11;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

/* la maison : X0 à X1 de gauche à droite, Z0 (l'arrière) à FACADE ; à droite (XW à X1) le pignon de la porte avance
   jusqu'à FW. Le grand toit : faîte de gauche à droite en (ZR, HR), il descend jusqu'à HE au bout de son avancée ; le toit
   du pignon : faîte d'avant en arrière en (CXW, HRW), ses pentes à 45° */
const X0 = -2.05, X1 = 1.8, XW = .05, Z0 = -1.55, FW = FACADE + .14, SOCLE = .34;
const ZR = (Z0 + FACADE) / 2, HR = 3.15, AV = .32, RUN = (FACADE - Z0) / 2 + AV, HE = 1.95, PENTE = (HR - HE) / RUN, HM = HR - PENTE * (FACADE - ZR);
const CXW = (XW + X1) / 2, HRW = 3.1, RUNW = (X1 - XW) / 2 + .18, HEW = HRW - RUNW, HMW = HRW - (X1 - XW) / 2;
const CX = (X0 + X1) / 2;

/* le socle : un rang de pierres de a à b le long de x (en z) ou de z (en x), de grosses pierres aux coins */
function socle(g, a, b, fixe, le, devant){
  let u = a;
  while(u < b - .03){
    const l = Math.min(b - u, .34 + hasard() * .28), ll = b - u - l < .2 ? b - u : l, c = u + ll / 2;
    if(le === "x") bloc(g, pierre(), ll - .03, SOCLE - .02, .28, c, SOCLE / 2, fixe + devant * .04, (hasard() - .5) * .03, BLOC_L);
    else bloc(g, pierre(), .28, SOCLE - .02, ll - .03, fixe + devant * .04, SOCLE / 2, c, (hasard() - .5) * .03, BLOC_L);
    u += ll;
  }
}
/* des planches debout de a à b sur un mur, du socle jusqu'au haut donné par haut(u), sauf les trous [u0, u1, y0, y1] */
function planches(g, a, b, fixe, le, haut, trous = []){
  const n = Math.max(1, Math.round((b - a) / .2)), l = (b - a) / n;
  for(let k = 0; k < n; k++){
    const u = a + (k + .5) * l, h1 = haut(u);
    let morceaux = [[SOCLE, h1]];
    for(const [u0, u1, y0, y1] of trous) if(u > u0 && u < u1) morceaux = morceaux.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of morceaux) if(q - p > .03){
      if(le === "x") boite(g, ton(k), l - .02, q - p, .07, u, (p + q) / 2, fixe);
      else boite(g, ton(k), .07, q - p, l - .02, fixe, (p + q) / 2, u);
    }
  }
}
const FEN = {x: -.85, y: 1.15, w: .64, h: .6}, ARC = {y: 1.15, r: .44};
function murs(g){
  /* le coeur, qui comble tout derrière les planches, et les combles sous les toits */
  boite(g, FONCE, X1 - X0 - .1, HM - .1, FACADE - Z0 - .1, CX, HM / 2, ZR);
  boite(g, FONCE, X1 - XW - .1, HMW - .1, FW - FACADE + .1, CXW, HMW / 2, (FW + FACADE) / 2 - .05);
  ajoute(g, part(G.gable, FONCE, X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, CX, HM - .02, ZR));
  ajoute(g, part(G.gable, FONCE, FW - (-.3), HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FW - .3) / 2)).rotation.y = Math.PI / 2;
  /* le socle de pierre, devant et sur les côtés ; les grosses pierres des coins */
  socle(g, X0, XW, FACADE, "x", 1); socle(g, XW, X1, FW, "x", 1);
  socle(g, Z0, FACADE, X0, "z", -1); socle(g, Z0, FW, X1, "z", 1);
  for(const [x, z] of [[X0, FACADE], [X1, FW], [XW + .08, FW]]) bloc(g, pierre(), .4, .5, .4, x, .25, z + .04);
  /* la façade de gauche : les planches, la fenêtre, les poutres (les poteaux, la sablière, la lisse, la croix de saint André) */
  const zF = FACADE + .02;
  planches(g, X0, XW, zF, "x", () => HM, [[FEN.x - FEN.w / 2, FEN.x + FEN.w / 2, FEN.y - FEN.h / 2, FEN.y + FEN.h / 2]]);
  for(const x of [X0 + .06, -1.42, XW]) boite(g, FONCE, .16, HM - SOCLE, .1, x, (HM + SOCLE) / 2, zF + .05);
  boite(g, FONCE, XW - X0 + .1, .14, .12, (X0 + XW) / 2, HM - .07, zF + .05);
  boite(g, FONCE, XW - X0 + .1, .12, .1, (X0 + XW) / 2, SOCLE + .06, zF + .05);
  { const w = -1.42 - X0 - .1, h = HM - SOCLE - .14; planche(g, FONCE, .12, Math.hypot(w, h) - .1, .08, (X0 + .06 - 1.42) / 2, (HM + SOCLE) / 2, zF + .05, 0, 0, -Math.atan2(w, h)); }
  /* le côté gauche : les planches jusqu'au toit, le pignon, un poteau et sa jambe de force */
  const xG = X0 - .02, toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08;
  planches(g, Z0, FACADE, xG, "z", toitZ);
  boite(g, FONCE, .1, HM - SOCLE, .16, xG - .04, (HM + SOCLE) / 2, Z0 + .06);
  boite(g, FONCE, .12, .14, FACADE - Z0, xG - .05, HM - .07, ZR);
  { const w = FACADE - Z0 - .4, h = HM - SOCLE - .2; planche(g, FONCE, .08, Math.hypot(w, h) * .55, .12, xG - .05, SOCLE + h * .35, Z0 + w * .3, Math.atan2(w, h), 0, 0); }
  /* le côté droit : les planches jusqu'aux toits */
  const xD = X1 + .02;
  planches(g, Z0, FW, xD, "z", z => z > -.3 ? HMW - .04 : toitZ(z));
  for(const z of [Z0 + .06, FW - .06]) boite(g, FONCE, .1, HMW - SOCLE, .16, xD + .04, (HMW + SOCLE) / 2, z);
  /* la fenêtre : la vitre allumée, ses croisillons en losanges, son cadre, son appui, ses volets ouverts */
  const { x: fx, y: fy, w: fw, h: fh } = FEN;
  ajoute(g, part(G.box, VITRE, fw, fh, .04, fx, fy, zF - .02));
  for(const s of [-1, 1]) for(let c = -fw; c <= fw + .01; c += .19){       // les lattes : x ∓ y = c, coupées au cadre
    const pts = [];
    for(const X of [-fw / 2, fw / 2]){ const Y = s * (X - c + fw / 2 - .1); if(Math.abs(Y) <= fh / 2) pts.push([X, Y]); }
    for(const Y of [-fh / 2, fh / 2]){ const X = s * Y + c - fw / 2 + .1; if(Math.abs(X) <= fw / 2) pts.push([X, Y]); }
    if(pts.length < 2) continue;
    const [[a1, b1], [a2, b2]] = pts, L = Math.hypot(a2 - a1, b2 - b1);
    if(L > .06) planche(g, FONCE, L, .035, .04, fx + (a1 + a2) / 2, fy + (b1 + b2) / 2, zF + .01, 0, 0, s * Math.PI / 4);
  }
  for(const [w, h, x, y] of [[fw + .16, .09, 0, fh / 2 + .04], [fw + .16, .08, 0, -fh / 2 - .04], [.08, fh, -fw / 2 - .04, 0], [.08, fh, fw / 2 + .04, 0]])
    boite(g, FONCE, w, h, .08, fx + x, fy + y, zF + .03);
  boite(g, CLAIR, fw + .3, .08, .2, fx, fy - fh / 2 - .12, zF + .1);                      // l'appui
  boite(g, BOIS[2], fw + .1, .14, .08, fx, fy - fh / 2 - .24, zF + .06);                   // sa planche de dessous
  for(const s of [-1, 1]){                                                                 // les volets ouverts, et leurs pentures
    const vx = fx + s * (fw / 2 + .22);
    boite(g, FONCE, .34, fh + .1, .05, vx, fy, zF + .06);
    for(const dx of [-.075, .075]) boite(g, CLAIR, .13, fh, .06, vx + dx, fy, zF + .09);
    for(const y of [fy - .18, fy + .18]){ boite(g, FER, .22, .045, .02, vx - s * .04, y, zF + .125);
      ajoute(g, part(G.head, CLOU, .12, .12, .08, vx - s * .12, y, zF + .13)); }
  }
}
/* le pignon de devant, au-dessus de la porte : les planches, les colombages (la poutre, le poinçon, les liens en V) */
function pignon(g){
  const z = FW + .02;
  planches(g, XW, X1, z, "x", x => HRW - .12 - Math.abs(x - CXW), [[PORTE_X - ARC.r - .1, PORTE_X + ARC.r + .1, 0, ARC.y + ARC.r + .1]]);
  for(const x of [XW + .06, X1 - .06]) boite(g, FONCE, .16, HMW - SOCLE + .1, .1, x, (HMW + SOCLE) / 2, z + .05);
  boite(g, FONCE, X1 - XW + .12, .16, .14, CXW, 1.75, z + .06);                            // la poutre sur la porte
  boite(g, FONCE, X1 - XW + .1, .12, .1, CXW, SOCLE + .06, z + .05);
  boite(g, FONCE, .16, HRW - 1.9, .1, CXW, (HRW + 1.6) / 2 - .05, z + .06);                // le poinçon
  for(const s of [-1, 1]){                                                                 // les liens en V
    const w = .46, h = .62;
    planche(g, FONCE, .11, Math.hypot(w, h), .07, CXW + s * (w / 2 + .06), 1.83 + h / 2, z + .06, 0, 0, -s * Math.atan2(w, h));
  }
  for(const s of [-1, 1]){                                                                 // les rives, le long du toit
    const L = RUNW * Math.SQRT2;
    planche(g, BOIS[0], L, .14, .12, CXW + s * RUNW / 2, HRW - RUNW / 2 - .03, z + .12, 0, 0, -s * Math.PI / 4);
  }
}
/* une pente de chaume : des rangs de bottes qui se recouvrent, du faîte vers le bas, leurs bouts arrondis en écailles.
   Le repère : l'origine au faîte, x le long du faîte (de a à b), z qui descend la pente (jusqu'à L), y vers le dehors */
function pente(g, a, b, L, rangs, pas){
  const h = L / rangs, w = b - a;
  for(let k = 0; k < rangs; k++){
    const z = (k + .5) * h, y = .06 + (rangs - k) * .07;
    bloc(g, PAILLE_S, w, .1, h + .08, (a + b) / 2, y - .1, z, 0, BLOC_L);                       // le dessous, dans l'ombre
    bloc(g, PAILLE[k % 3], w + .04, .16, h * .62, (a + b) / 2, y, z - h * .2, 0, BLOC_L);         // la botte
    const n = Math.max(2, Math.round(w / pas)), l = w / n;
    for(let i = 0; i < n; i++){                                                                 // ses bouts arrondis, qui pendent
      const e = ajoute(g, part(ECAILLE, PAILLE[(i + k) % 3], l * 1.12, .16, h * .62, a + (i + .5 + (k % 2) * .5) * l - (k % 2 && i === n - 1 ? l / 2 : 0), y - .01, z + h * .2));
      e.rotation.y = (hasard() - .5) * .12;
    }
  }
}
/* une pente posée : faîte en (x, y, z), qui descend vers rot (0 : vers l'avant), inclinée de a */
function poser(g, x, y, z, rot, a){
  const o = new THREE.Group(), i = new THREE.Group();
  o.position.set(x, y, z); o.rotation.y = rot; i.rotation.x = a; o.add(i); g.add(o); return i;
}
function toits(g){
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05;
  /* le grand toit : devant à gauche du pignon, derrière sur toute la largeur */
  pente(poser(g, 0, HR, ZR, 0, a), X0 - .3, XW + .25, L, 4, .28);
  pente(poser(g, 0, HR, ZR, Math.PI, a), -(X1 + .25), -(X0 - .3), L, 4, .45);
  /* le toit du pignon, d'avant en arrière, à droite et à gauche */
  const LW = RUNW * Math.SQRT2 + .05, zA = -.35, zB = FW + .3;
  pente(poser(g, CXW, HRW, 0, Math.PI / 2, Math.PI / 4), -zB, -zA, LW, 4, .28);
  pente(poser(g, CXW, HRW, 0, -Math.PI / 2, Math.PI / 4), zA, zB, LW, 4, .28);
  /* les faîtes : un boudin de chaume, des blocs de bois au bout, liés de corde */
  const fa = ajoute(g, part(ROND, PAILLE[1], .26, X1 - X0 + .55, .3, CX, HR + .18, ZR)); fa.rotation.z = Math.PI / 2;
  const fb = ajoute(g, part(ROND, PAILLE[1], .26, zB - zA, .3, CXW, HRW + .17, (zA + zB) / 2)); fb.rotation.x = Math.PI / 2;
  for(const x of [X0 - .25, X1 + .2]){ bloc(g, CLAIR, .34, .3, .36, x, HR + .2, ZR);
    for(const dz of [-.12, .12]){ const c = ajoute(g, part(G.tore, CORDE, .36, .36, 1.4, x + (x < 0 ? .22 : -.22), HR + .2, ZR + dz)); c.rotation.y = Math.PI / 2; } }
  bloc(g, CLAIR, .34, .32, .34, CXW, HRW + .18, zB + .02);
  for(const z of [zB - .25, -.05]){ ajoute(g, part(G.tore, CORDE, .38, .38, 1.4, CXW, HRW + .18, z)); }
  g.userData.toit = HR + .4;
}
/* la cheminée de pierre, derrière à gauche, et sa petite fumée douce qui monte et s'efface */
function cheminee(g){
  const x = -1.45, z = -.95, e = .48;
  for(let r = 0; r < 8; r++){ const y = 1.55 + r * .29;
    for(const dx of [-e / 4, e / 4]) bloc(g, pierre(), r % 2 ? e : e / 2 - .02, .27, r % 2 ? e / 2 - .02 : e, x + (r % 2 ? 0 : dx), y + .14, z + (r % 2 ? dx : 0), 0, BLOC_L); }
  bloc(g, PIERRE[2], e + .12, .14, e + .12, x, 3.92, z);
  boite(g, 0x3A3430, e - .2, .05, e - .2, x, 4.0, z);
  const puffs = new THREE.InstancedMesh(G.head, FUMEE, 5), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();
  puffs.castShadow = false; puffs.receiveShadow = false; puffs.frustumCulled = false; puffs.renderOrder = 3;
  const bouge = () => {
    const t = VENT.temps.value;
    for(let k = 0; k < 5; k++){
      const tt = (t * .11 + k / 5) % 1, r = (.5 + tt * 1.3) * Math.min(1, (1 - tt) * 3.5);
      p.set(x + Math.sin(t * .7 + k * 1.3) * .08 + tt * .35, 4.1 + tt * 1.4, z + Math.cos(t * .5 + k) * .06); s.set(r, r * .85, r);
      puffs.setMatrixAt(k, m.compose(p, q, s));
    }
    puffs.instanceMatrix.needsUpdate = true;
  };
  bouge(); puffs.onBeforeRender = bouge; g.add(puffs);
}
/* la porte en arc dans son cadre de bois, ses planches, ses deux longues pentures, l'anneau ; les marches de pierre */
function porte(g){
  const z = FW + .03, w = 2 * ARC.r - .04;
  for(let k = 0; k < 5; k++){ const x = PORTE_X - w / 2 + (k + .5) * w / 5, dx = x - PORTE_X, haut = ARC.y + Math.sqrt(Math.max(0, (ARC.r - .02) ** 2 - dx * dx)) - .03;
    boite(g, k % 2 ? PORTE_C : 0xAA5C2A, w / 5 - .015, haut - .02, .06, x, haut / 2 + .01, z); }
  for(const s of [-1, 1]) boite(g, FONCE, .13, ARC.y + .02, .12, PORTE_X + s * (ARC.r + .05), ARC.y / 2, z + .04);   // le cadre
  for(let k = 0; k <= 12; k++){ const an = Math.PI * k / 12, r = ARC.r + .06;
    planche(g, FONCE, .16, .16, .12, PORTE_X + Math.cos(an) * r, ARC.y + Math.sin(an) * r, z + .04, 0, 0, an - Math.PI / 2); }
  for(const y of [.4, 1.05]){ boite(g, FER, w * .72, .08, .03, PORTE_X + .06, y, z + .05);
    const bout = ajoute(g, part(G.cone4, FER, .14, .14, .03, PORTE_X + .06 + w * .36 + .05, y, z + .05)); bout.rotation.z = -Math.PI / 2;
    for(const x of [-.14, .06, .24]) ajoute(g, part(G.head, CLOU, .16, .16, .1, PORTE_X + x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .22, .22, .3, PORTE_X + .02, .74, z + .07));
  ajoute(g, part(G.cyl, FER, .09, .04, .09, PORTE_X + .02, .85, z + .05)).rotation.x = Math.PI / 2;
  bloc(g, PIERRE[0], 1.25, .17, .48, PORTE_X, .085, FW + .42); bloc(g, PIERRE[2], 1.05, .15, .3, PORTE_X + .02, .24, FW + .22);
}
/* à gauche de la porte : la potence de fer et la lanterne qui pend, qui brille la nuit */
function lanterneTaverne(g){
  const x = .3, y = 1.22, z = FW + .05;
  boite(g, FER, .05, .16, .05, x, y + .42, z);
  boite(g, FER, .05, .05, .32, x, y + .36, z + .14);
  boite(g, FER, .025, .12, .025, x, y + .27, z + .28);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .17, z + .28)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .28));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .28 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .28);
}
/* l'enseigne : la potence qui sort du pignon, sa jambe de force, deux chaînes, le panneau rouge bordé de bois,
   le poulet rôti et le fromage peints en relief */
function enseigne(g){
  const y = 1.85, z = FW - .12, xa = X1 + .02, xb = 2.42;
  boite(g, BOIS[1], xb - xa + .1, .14, .14, (xa + xb) / 2 + .05, y, z);
  planche(g, FONCE, .08, .5, .08, xa + .17, y - .2, z, 0, 0, .75);
  for(const x of [xa + .12, xb - .06]) boite(g, FER, .06, .17, .17, x, y, z);
  const cx = (xa + xb) / 2 + .1, py = y - .58;
  for(const dx of [-.15, .15]) for(let k = 0; k < 2; k++){ const c = ajoute(g, part(G.tore, FER, .07, .1, .5, cx + dx, y - .12 - k * .085, z)); c.rotation.y = k * Math.PI / 2; }
  ajoute(g, part(OCTO, BOIS[1], .7, .6, .06, cx, py, z));                                    // le cadre de bois
  ajoute(g, part(OCTO, 0x8E3226, .58, .48, .07, cx, py, z));                                  // le panneau
  const zf = z + .045;
  ajoute(g, part(G.head, 0xD2742C, .62, .46, .25, cx - .08, py + .02, zf)).rotation.z = .5;   // le poulet
  ajoute(g, part(G.head, 0xE89048, .34, .22, .18, cx - .1, py + .05, zf + .02)).rotation.z = .5;
  boite(g, 0xF4ECDC, .14, .03, .03, cx + .04, py + .1, zf).rotation.z = .5;                 // l'os
  for(const dy of [-.02, .02]) ajoute(g, part(G.head, 0xF4ECDC, .12, .12, .1, cx + .1, py + .13 + dy, zf));
  const fr = ajoute(g, part(COIN, 0xF4C840, .22, .2, .07, cx + .1, py - .08, zf + .01)); fr.rotation.z = -Math.PI / 2;   // le fromage
  for(const [dx, dy] of [[.08, -.08], [.13, -.04], [.1, -.12]]) ajoute(g, part(G.cyl, 0xD9A828, .035, .02, .035, cx + dx, py + dy, zf + .045)).rotation.x = Math.PI / 2;
}
/* devant, à gauche : le banc de planches */
function banc(g){
  const x = -1.25, z = 1.72;
  boite(g, BOIS[1], 1.15, .08, .34, x, .5, z);
  boite(g, CLAIR, 1.15, .02, .3, x, .545, z);
  for(const dx of [-.42, .42]){ boite(g, BOIS[2], .09, .46, .28, x + dx, .23, z); boite(g, FONCE, .1, .06, .32, x + dx, .1, z); }
  boite(g, BOIS[0], .78, .06, .06, x, .22, z);
}
/* le tonneau de douelles cerclé de fer, contre le mur */
function tonneau(g){
  const x = -.22, z = 1.5, r = .27, h = .62;
  for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2;
    planche(g, ton(k), .15, h, .05, x + Math.sin(an) * r, h / 2 + .02, z + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .06, .04, r * 2 - .06, x, h - .04, z));
  for(const y of [.12, .5]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, x, y, z)); c.rotation.x = Math.PI / 2; }
}
/* le sol : la plaque de sable, des cailloux, des rochers aux coins, quelques touffes d'herbe */
function sol(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 2.0, .052, 1.2, -.9, .027, 1.8)); s.receiveShadow = true; s.castShadow = false;
  for(let k = 0; k < 18; k++){
    const x = -2.3 + hasard() * 4.6, z = 1.4 + hasard() * 1.05;
    if(Math.abs(x - PORTE_X) < .75 || (x > -1.9 && x < .1 && z < 2.0)) continue;               // le passage devant la porte, le banc et le tonneau
    const c = .05 + hasard() * .06, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
  for(const [x, z, sx, sy, sz] of [[-2.25, 1.0, .4, .3, .4], [2.25, 1.0, .36, .26, .34], [2.2, -1.6, .45, .4, .5]]){
    const r = ajoute(g, part(CAILLOU, pierre(), sx, sy, sz, x, sy * .36, z)); r.rotation.set(0, hasard() * 3, 0); }
  for(const [x, z] of [[-2.25, 1.55], [2.05, 1.7], [.0, 2.15], [2.3, .2]]){                     // les touffes d'herbe, à même le sable
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function taverneNiveau1(g){
  alea = 11;
  sol(g);
  murs(g);
  pignon(g);
  toits(g);
  cheminee(g);
  porte(g);
  lanterneTaverne(g);
  enseigne(g);
  banc(g);
  tonneau(g);
}

/* ================= La Taverne, niveau 2 =================
   D'après l'image de Yo (13 novembre 2026 : « Voici la Taverne de niveau 2 »), au plus près de l'image : la même place (5 × 5),
   la porte à droite au même endroit. La maison à colombages : les poutres de bois et le torchis crème entre elles, sur un socle
   de pierres claires jointives ; le grand toit de tuiles rouges arrondies en rangs qui se chevauchent, sa lucarne à la fenêtre
   ronde allumée, le faîte de tuiles rondes ; la cheminée de pierres claires, derrière à gauche, sa petite fumée ; à droite, le
   pignon de devant, plus haut, à colombages, sa fenêtre d'étage aux volets ouverts et sa jardinière ; en bas, la grande fenêtre
   aux croisillons en losanges, ses volets et sa jardinière, une petite fenêtre à gauche ; la porte de planches en arc sous un
   arc de pierres claires, ses pentures et son anneau, ses marches ; une lanterne de chaque côté de la porte ; l'enseigne pendue
   à sa potence par deux chaînes (le poulet rôti, le pain, la fumée du plat) ; devant, le banc, le tonneau couché sur son
   chevalet, le tonneau debout, des dalles et des cailloux sur le sable, des touffes d'herbe (sans tas de terre). Les fleurs des
   jardinières suivent la saison, comme la vraie nature (batiments.js les refait quand elle change). La nuit, les fenêtres et
   les lanternes brillent plus fort. */
const CREME = [0xF4E4C6, 0xF0DDBC], TUILE = [0xD8582E, 0xE0633A, 0xCC4E28, 0xE46E44], TUILE_F = 0xB84826, POUTRE = 0xA4521F;
const FLEURS_TAV = {printemps: [0xE04A3A, 0xF2C94C, 0xF4F0E0], ete: [0xD8342A, 0xE8505A, 0xC82A2A], automne: [], hiver: []};
/* le torchis : des panneaux crème de a à b sur un mur, du socle jusqu'au haut donné par haut(u), d'un seul tenant */
function torchis(g, a, b, fixe, le, haut, bas = SOCLE){
  const n = Math.max(1, Math.round((b - a) / .25)), l = (b - a) / n;
  for(let k = 0; k < n; k++){ const u = a + (k + .5) * l, h1 = haut(u); if(h1 - bas < .03) continue;
    if(le === "x") boite(g, CREME[0], l + .002, h1 - bas, .07, u, (h1 + bas) / 2, fixe);
    else boite(g, CREME[0], .07, h1 - bas, l + .002, fixe, (h1 + bas) / 2, u); }
}
/* une poutre posée entre deux points d'un mur (en x, y), devant la façade z */
function poutre(g, x1, y1, x2, y2, z, e = .13){
  const L = Math.hypot(x2 - x1, y2 - y1); planche(g, POUTRE, e, L, .09, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, -Math.atan2(x2 - x1, y2 - y1));
}
/* une fenêtre à croisillons en losanges, son cadre, ses volets ouverts ; jardin : sa jardinière (la saison) */
function fenetre2(g, fx, fy, fw, fh, z, jardin, volets = true){
  ajoute(g, part(G.box, VITRE, fw, fh, .04, fx, fy, z - .01));
  for(const s of [-1, 1]) for(let c = -fw; c <= fw + .01; c += .17){
    const pts = [];
    for(const X of [-fw / 2, fw / 2]){ const Y = s * (X - c + fw / 2 - .08); if(Math.abs(Y) <= fh / 2) pts.push([X, Y]); }
    for(const Y of [-fh / 2, fh / 2]){ const X = s * Y + c - fw / 2 + .08; if(Math.abs(X) <= fw / 2) pts.push([X, Y]); }
    if(pts.length < 2) continue;
    const [[a1, b1], [a2, b2]] = pts, L = Math.hypot(a2 - a1, b2 - b1);
    if(L > .05) planche(g, FONCE, L, .03, .04, fx + (a1 + a2) / 2, fy + (b1 + b2) / 2, z + .02, 0, 0, s * Math.PI / 4);
  }
  for(const [w, h, x, y] of [[fw + .16, .09, 0, fh / 2 + .04], [fw + .16, .08, 0, -fh / 2 - .04], [.08, fh, -fw / 2 - .04, 0], [.08, fh, fw / 2 + .04, 0]])
    boite(g, BOIS[0], w, h, .09, fx + x, fy + y, z + .04);
  boite(g, BOIS[1], fw + .26, .09, .14, fx, fy + fh / 2 + .13, z + .06);                       // le petit linteau
  if(volets) for(const s of [-1, 1]){ const vx = fx + s * (fw / 2 + .18);
    boite(g, FONCE, .26, fh + .08, .05, vx, fy, z + .05);
    for(const dx of [-.06, .06]) boite(g, CLAIR, .1, fh, .05, vx + dx, fy, z + .08);
    for(const y of [fy - .16, fy + .16]) boite(g, FER, .18, .04, .02, vx - s * .03, y, z + .11); }
  if(jardin !== undefined) jardiniereTav(g, fx, fy - fh / 2 - .17, z + .02, fw + .1, jardin);
  else boite(g, CLAIR, fw + .22, .08, .16, fx, fy - fh / 2 - .1, z + .07);                      // un simple appui
}
/* la jardinière sous la fenêtre : sa caisse, la terre, des feuilles et des fleurs comme la vraie nature (la saison) :
   au printemps des fleurs de toutes les couleurs, l'été des géraniums rouges, l'automne le feuillage seul, l'hiver la terre nue */
function jardiniereTav(g, x, y, z, w, saison){
  boite(g, BOIS[2], w, .15, .17, x, y, z + .1);                                                 // la caisse
  boite(g, 0x5A3E28, w - .06, .03, .12, x, y + .07, z + .1);                                    // la terre
  if(saison === "hiver") return;
  const n = Math.round(w / .1), feuilles = saison === "automne" ? [0x6E7A3A, 0x8A7A3A] : [0x4E8A3A, 0x5E9A44], fl = FLEURS_TAV[saison] || [];
  for(let k = 0; k < n; k++) ajoute(g, part(G.head, feuilles[k % 2], .13, .09, .1, x - w / 2 + (k + .5) * w / n, y + .11, z + .09 + (k % 2) * .03));
  for(let k = 0; k < (fl.length ? n - 1 : 0); k++) ajoute(g, part(G.head, fl[k % fl.length], .075, .065, .075, x - w / 2 + (k + 1) * w / n, y + .17 + (k % 2) * .03, z + .11 + (k % 3 - 1) * .03));
}
/* le mur de derrière : ses colombages (avant, un aplat crème, Yo, 14 novembre 2026 : faire le tour) */
function dos(g, PO){
  const z = Z0 - .08, xs = [X0 + .07, (2 * X0 + X1) / 3, (X0 + 2 * X1) / 3, X1 - .07];
  for(const x of xs) boite(g, PO, .15, HM - SOCLE, .1, x, (HM + SOCLE) / 2, z);
  boite(g, PO, X1 - X0 + .1, .14, .12, (X0 + X1) / 2, HM - .07, z); boite(g, PO, X1 - X0 + .1, .12, .1, (X0 + X1) / 2, SOCLE + .06, z);
  for(let k = 0; k < 3; k++){ const x0 = xs[k] + .08, x1 = xs[k + 1] - .08, h = HM - SOCLE - .26, L = Math.hypot(x1 - x0, h);
    planche(g, PO, .11, L, .08, (x0 + x1) / 2, (HM + SOCLE) / 2, z, 0, 0, (k % 2 ? 1 : -1) * Math.atan2(x1 - x0, h)); }
}

/* le bout du grand toit, sur un côté : un triangle lisse de torchis (avant, des panneaux en escalier : « on dirait qu'il n'est pas
   fini », Yo, 14 novembre 2026), ses planches de rive le long du toit, des colombages sur le grand mur ; demi : seulement la moitié
   de derrière (devant, c'est le toit du pignon) */
function boutToit(g, x, dehors, demi, CR, PO){
  const s = new THREE.Shape(), b = HM - .08, h = HR - .08;
  s.moveTo(Z0, b); s.lineTo(ZR, h); if(demi) s.lineTo(ZR, b); else s.lineTo(FACADE, b); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: .08, bevelEnabled: false}).rotateY(-Math.PI / 2);
  ajoute(g, part(geo, CR, 1, 1, 1, x + dehors * .02 + (dehors > 0 ? .08 : 0), 0, 0));
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .04;
  for(const c of demi ? [-1] : [-1, 1]) planche(g, BOIS[0], .1, .17, L, x + dehors * .1, HR - .04 - Math.sin(a) * L / 2, ZR + c * Math.cos(a) * L / 2, c * a, 0, 0);
  boite(g, PO, .1, b - SOCLE, .14, x + dehors * .06, (b + SOCLE) / 2, ZR);                          // le poteau du milieu
  boite(g, PO, .1, .12, FACADE - Z0, x + dehors * .06, b - .02, ZR);                                // la sablière, sous le pignon
  for(const c of [-1, 1]){ const z0 = ZR + c * .08, z1 = ZR + c * (FACADE - Z0) * .36, y0 = b - .12, y1 = b - .62;   // les liens, de part et d'autre
    planche(g, PO, .09, Math.hypot(z1 - z0, y1 - y0), .12, x + dehors * .06, (y0 + y1) / 2, (z0 + z1) / 2, -c * Math.atan2(Math.abs(z1 - z0), y0 - y1), 0, 0); }
}

/* la maison : le socle de pierres, le torchis, les poutres, les fenêtres */
function murs2(g, saison){
  boite(g, CREME[1], X1 - X0 - .1, HM - .1, FACADE - Z0 - .1, CX, HM / 2, ZR);                 // le cœur, sous le torchis
  boite(g, CREME[1], X1 - XW - .1, HMW - .1, FW - FACADE + .1, CXW, HMW / 2, (FW + FACADE) / 2 - .05);
  ajoute(g, part(G.gable, CREME[1], X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, CX, HM - .02, ZR));
  ajoute(g, part(G.gable, CREME[1], FW - (-.3), HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FW - .3) / 2)).rotation.y = Math.PI / 2;
  /* le socle de pierres claires, jointives (Yo : pas de trous entre les pierres) ; les grosses pierres des coins */
  socle(g, X0, XW, FACADE, "x", 1); socle(g, XW, X1, FW, "x", 1); socle(g, Z0, FACADE, X0, "z", -1); socle(g, Z0, FW, X1, "z", 1); socle(g, X0, X1, Z0, "x", -1);
  for(const [x, z] of [[X0, FACADE], [X1, FW], [XW + .08, FW]]) bloc(g, pierre(), .4, .5, .4, x, .25, z + .04);
  /* la façade de gauche : le torchis, les poutres (poteaux, sablière, lisse, les croix), la grande fenêtre et la petite */
  const zF = FACADE + .02;
  torchis(g, X0, XW, zF, "x", () => HM);
  for(const x of [X0 + .06, -1.42, -.3, XW]) boite(g, POUTRE, .15, HM - SOCLE, .1, x, (HM + SOCLE) / 2, zF + .05);
  boite(g, POUTRE, XW - X0 + .1, .15, .12, (X0 + XW) / 2, HM - .07, zF + .05);
  boite(g, POUTRE, XW - X0 + .1, .12, .1, (X0 + XW) / 2, SOCLE + .06, zF + .05);
  boite(g, POUTRE, XW - X0, .1, .1, (X0 + XW) / 2, 1.58, zF + .05);                              // la poutre au-dessus des fenêtres
  poutre(g, -1.42, 1.58, -1.02, HM - .1, zF + .05); poutre(g, -.3, 1.58, -.7, HM - .1, zF + .05);   // les liens, sous la sablière
  poutre(g, -.3, SOCLE + .1, XW - .02, .78, zF + .05);
  fenetre2(g, FEN.x, FEN.y, FEN.w, FEN.h, zF, saison);
  fenetre2(g, -1.74, 1.15, .3, .42, zF, undefined, false);
  /* les côtés : le torchis jusqu'aux toits, des poteaux, une poutre ; derrière, le torchis */
  const toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08;
  torchis(g, Z0, FACADE, X0 - .02, "z", () => HM - .08);
  boutToit(g, X0 - .02, -1, false, CREME[0], POUTRE);
  torchis(g, Z0, FW, X1 + .02, "z", z => z > -.3 ? HMW - .04 : HM - .08);
  boutToit(g, X1 + .02, 1, true, CREME[0], POUTRE);
  dos(g, POUTRE);
  torchis(g, X0, X1, Z0 - .02, "x", () => HM);
  for(const [x, z] of [[X0 - .05, Z0 + .06], [X0 - .05, FACADE - .06], [X1 + .05, Z0 + .06], [X1 + .05, FW - .06]]) boite(g, POUTRE, .1, HM - SOCLE, .15, x, (HM + SOCLE) / 2, z);
  for(const x of [X0 - .06, X1 + .06]) boite(g, POUTRE, .1, .13, FACADE - Z0, x, HM - .07, ZR);
}
/* le pignon de devant : le torchis, les colombages, la fenêtre d'étage et sa jardinière, la porte en arc de pierres */
function pignon2(g, saison){
  const z = FW + .02;
  torchis(g, XW, X1, z, "x", x => HRW - .12 - Math.abs(x - CXW));
  for(const x of [XW + .06, X1 - .06]) boite(g, POUTRE, .15, HMW - SOCLE + .1, .1, x, (HMW + SOCLE) / 2, z + .05);
  boite(g, POUTRE, X1 - XW + .12, .16, .13, CXW, 1.82, z + .06);                              // la poutre de l'étage
  boite(g, POUTRE, X1 - XW + .1, .12, .1, CXW, SOCLE + .06, z + .05);
  boite(g, POUTRE, .14, HRW - 2.0, .1, CXW, (HRW + 1.9) / 2 - .05, z + .06);                   // le poinçon
  for(const s of [-1, 1]) poutre(g, CXW + s * .15, 1.9, CXW + s * .62, HRW - .55 - .47, z + .06);   // les liens en V
  poutre(g, XW + .1, SOCLE + .12, XW + .38, 1.0, z + .05); poutre(g, X1 - .1, SOCLE + .12, X1 - .38, 1.0, z + .05);   // les liens du bas, de part et d'autre de la porte
  fenetre2(g, CXW, 2.3, .44, .4, z, saison);
  for(const s of [-1, 1]) planche(g, BOIS[0], RUNW * Math.SQRT2, .14, .12, CXW + s * RUNW / 2, HRW - RUNW / 2 - .03, z + .12, 0, 0, -s * Math.PI / 4);   // les rives
}
/* des tuiles rouges arrondies sur une pente : des rangs qui se chevauchent, en quinconce, du faîte vers le bas, sur un fond de
   leur couleur. Le repère de poser() : l'origine au faîte, x le long du faîte (de a à b), z qui descend la pente, y vers le dehors */
const LUC_ARC = new THREE.TorusGeometry(.2, .035, 6, 12, Math.PI);                       // l'arc de bois de la fenêtre
const LUC_TOIT = new THREE.CylinderGeometry(.42, .42, .9, 12, 1, false, -Math.PI / 2, Math.PI);   // le berceau de la lucarne
function tuiles(g, a, b, L, sauf = () => false, fond = true){
  const rangs = Math.max(3, Math.round(L / .36)), h = L / rangs, w = .4;
  if(fond) bloc(g, TUILE_F, b - a, .06, L, (a + b) / 2, .02, L / 2, 0, G.box);                 // le fond
  for(let k = 0; k < rangs; k++){
    const z = (k + .6) * h, y = .07 + (rangs - k) * .012, dec = k % 2 ? w / 2 : 0;
    for(let i = -1; ; i++){ let u0 = a + i * w + dec, u1 = u0 + w; if(u0 >= b) break; u0 = Math.max(u0, a); u1 = Math.min(u1, b); if(u1 - u0 < .06) continue;
      if(sauf((u0 + u1) / 2, z)) continue;
      const t = ajoute(g, part(BLOC_L, TUILE[(k * 3 + i * 5 + 8) % 4], u1 - u0 - .02, .09, h * 1.45, (u0 + u1) / 2, y, z)); t.rotation.x = -.08; }
  }
}
/* la lucarne du grand toit : ses joues de torchis, sa fenêtre ronde allumée, son petit toit de tuiles en berceau */
function lucarne(g, a, L){
  /* assez bas sur la pente pour que tout reste dans le toit, même vu de derrière (Yo, 14 novembre 2026 : faire le tour) */
  const x = -1.05, t = L * LUC_T, yb = HR - Math.sin(a) * t, zb = ZR + Math.cos(a) * t, w = .6, hh = .5, d = 1.0;
  boite(g, BOIS[1], w, hh, d, x, yb + hh / 2 - .05, zb - d / 2 + .05);                          // la lucarne de bois, comme l'image
  for(const s of [-1, 1]) boite(g, POUTRE, .09, hh, .09, x + s * (w / 2 - .02), yb + hh / 2 - .05, zb + .04);
  const fy = yb + .2;
  ajoute(g, part(G.box, VITRE, .3, .22, .03, x, fy, zb + .06));
  ajoute(g, part(G.cyl, VITRE, .3, .03, .3, x, fy + .11, zb + .06)).rotation.x = Math.PI / 2;   // le haut rond de la vitre
  boite(g, FONCE, .03, .36, .04, x, fy + .05, zb + .08); boite(g, FONCE, .3, .03, .04, x, fy + .02, zb + .08);
  ajoute(g, part(LUC_ARC, BOIS[0], .8, .8, 1, x, fy + .11, zb + .08));                          // le haut de la fenêtre, en arc
  for(const sx of [-1, 1]) boite(g, BOIS[0], .06, .26, .07, x + sx * .17, fy, zb + .08);
  boite(g, BOIS[1], .44, .07, .14, x, fy - .15, zb + .1);
  ajoute(g, part(LUC_TOIT, TUILE[0], .75, 1.2, .75, x, yb + hh - .05, zb - .55)).rotation.x = Math.PI / 2;   // le berceau, derrière sa fenêtre, qui s'enfonce dans le toit
  for(let k = 0; k < 7; k++){ const an = (k + .5) / 7 * Math.PI - Math.PI / 2;
    ajoute(g, part(BLOC_L, TUILE[k % 4], .13, .06, .22, x + Math.sin(an) * .33, yb + hh - .05 + Math.cos(an) * .33, zb + .02)).rotation.z = -an; }
}
const LUC_T = .68;
function toits2(g){
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05, chem = (u, z) => false;
  tuiles(poser(g, 0, HR + .02, ZR, 0, a), X0 - .3, XW + .25, L, (u, z) => Math.abs(u + 1.05) < .38 && z > L * LUC_T - 1.05 && z < L * LUC_T + .02);   // pas sous la lucarne
  tuiles(poser(g, 0, HR + .02, ZR, Math.PI, a), -(X1 + .25), -(X0 - .3), L, (u, z) => Math.abs(-u - (-1.45)) < .38 && Math.abs(ZR - Math.cos(a) * z - (-.95)) < .38);
  const LW = RUNW * Math.SQRT2 + .05, zA = -.35, zB = FW + .3;
  tuiles(poser(g, CXW, HRW + .02, 0, Math.PI / 2, Math.PI / 4), -zB, -zA, LW);
  tuiles(poser(g, CXW, HRW + .02, 0, -Math.PI / 2, Math.PI / 4), zA, zB, LW);
  /* le pan de devant continue derrière le pignon, jusqu'où il passe sous le toit du pignon (la noue) : plus de fond crème entre
     les deux toits */
  tuiles(poser(g, 0, HR + .02, ZR, 0, a), XW + .25, X1 + .16, L, (u, z) => HR - Math.sin(a) * z < HRW - Math.abs(u - CXW) + .06, false);
  lucarne(g, a, L);
  /* les faîtes : de grosses tuiles rondes, l'une après l'autre */
  const faite = (x0, x1, y, z, axe) => { const n = Math.round((x1 - x0) / .32);
    for(let k = 0; k < n; k++){ const u = x0 + (k + .5) * (x1 - x0) / n, f = ajoute(g, part(ROND, TUILE[k % 2 ? 0 : 2], .3, (x1 - x0) / n + .04, .3, axe ? u : CXW, y, axe ? z : u));
      if(axe) f.rotation.z = Math.PI / 2; else f.rotation.x = Math.PI / 2; } };
  faite(X0 - .35, X1 + .3, HR + .16, ZR, true);
  faite(zA, zB + .05, HRW + .16, 0, false);
  g.userData.toit = HR + .35;
}
/* la porte en arc sous ses pierres claires, ses planches, ses pentures, l'anneau ; les marches de pierre */
function porte2(g){
  const z = FW + .03, w = 2 * ARC.r - .04;
  for(let k = 0; k < 5; k++){ const x = PORTE_X - w / 2 + (k + .5) * w / 5, dx = x - PORTE_X, haut = ARC.y + Math.sqrt(Math.max(0, (ARC.r - .02) ** 2 - dx * dx)) - .03;
    boite(g, k % 2 ? PORTE_C : 0xAA5C2A, w / 5 - .015, haut - .02, .06, x, haut / 2 + .01, z); }
  for(let k = 0; k <= 9; k++){ const an = Math.PI * k / 9, r = ARC.r + .11, m = bloc(g, PIERRE[k % 4], .22, .22, .16, PORTE_X + Math.cos(an) * r, ARC.y + Math.sin(an) * r, z + .04);
    m.rotation.z = an - Math.PI / 2; }
  for(const s of [-1, 1]) for(let k = 0; k < 4; k++) bloc(g, PIERRE[(k + 2) % 4], .22, .28, .16, PORTE_X + s * (ARC.r + .11), SOCLE + .14 + k * .3 - .14, z + .04);
  for(const y of [.45, 1.0]){ boite(g, FER, w * .72, .08, .03, PORTE_X + .02, y, z + .05);
    const bout = ajoute(g, part(G.cone4, FER, .14, .14, .03, PORTE_X + .02 + w * .36 + .05, y, z + .05)); bout.rotation.z = -Math.PI / 2;
    for(const x of [-.18, .02, .2]) ajoute(g, part(G.head, CLOU, .14, .14, .1, PORTE_X + x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .22, .22, .3, PORTE_X + .16, .74, z + .07));
  bloc(g, PIERRE[0], 1.25, .17, .48, PORTE_X, .085, FW + .42); bloc(g, PIERRE[2], 1.05, .15, .3, PORTE_X + .02, .24, FW + .22);
}
/* une lanterne de fer sur sa potence, contre la façade, à la hauteur y */
function lanterne2(g, x, y, z){
  boite(g, FER, .05, .16, .05, x, y + .42, z);
  boite(g, FER, .05, .05, .32, x, y + .36, z + .14);
  boite(g, FER, .025, .12, .025, x, y + .27, z + .28);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .17, z + .28)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .28));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .28 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .28);
}
/* l'enseigne : la potence, deux chaînes, le panneau rouge bordé de bois, le poulet rôti, le pain, la fumée du plat */
function enseigne2(g){
  const y = 1.95, z = FW - .12, xa = X1 + .02, xb = 2.42;
  boite(g, BOIS[1], xb - xa + .1, .14, .14, (xa + xb) / 2 + .05, y, z);
  planche(g, FONCE, .08, .5, .08, xa + .17, y - .2, z, 0, 0, .75);
  for(const x of [xa + .12, xb - .06]) boite(g, FER, .06, .17, .17, x, y, z);
  const cx = (xa + xb) / 2 + .1, py = y - .58;
  for(const dx of [-.15, .15]) for(let k = 0; k < 2; k++){ const c = ajoute(g, part(G.tore, FER, .07, .1, .5, cx + dx, y - .12 - k * .085, z)); c.rotation.y = k * Math.PI / 2; }
  ajoute(g, part(OCTO, BOIS[1], .7, .6, .06, cx, py, z));
  ajoute(g, part(OCTO, 0x8E3226, .58, .48, .07, cx, py, z));
  const zf = z + .045;
  ajoute(g, part(G.head, 0xD2742C, .5, .38, .22, cx - .08, py, zf)).rotation.z = .4;          // le poulet
  ajoute(g, part(G.head, 0xE89048, .28, .18, .16, cx - .1, py + .03, zf + .02)).rotation.z = .4;
  boite(g, 0xF4ECDC, .12, .03, .03, cx + .06, py + .07, zf).rotation.z = .4;
  for(const dy of [-.02, .02]) ajoute(g, part(G.head, 0xF4ECDC, .1, .1, .08, cx + .12, py + .1 + dy, zf));
  ajoute(g, part(G.head, 0xE8B060, .3, .14, .14, cx + .08, py - .14, zf + .01)).rotation.z = -.15;   // le pain
  for(const dx of [-.06, .02, .1]) boite(g, 0xC88A3E, .02, .07, .02, cx + .08 + dx, py - .12, zf + .07).rotation.z = .5;
  for(const dx of [-.12, -.04, .04]) for(let k = 0; k < 3; k++) ajoute(g, part(G.head, 0xF4ECDC, .035, .05, .02, cx + dx + Math.sin(k * 1.8) * .02, py + .15 + k * .045, zf));   // la fumée du plat
  g.userData.enseigne = true;
}
/* devant : le banc, le tonneau couché sur son chevalet, le tonneau debout */
function devant2(g){
  { const x = -1.9, z = 1.75;                                                                   // le banc, à gauche
    boite(g, BOIS[1], .82, .09, .32, x, .48, z); boite(g, CLAIR, .82, .02, .28, x, .53, z);
    for(const dx of [-.3, .3]) boite(g, BOIS[2], .09, .44, .26, x + dx, .22, z); }
  { const x = -.92, z = 1.7, r = .3, L = .62, y = .42;                                         // le tonneau couché, son bout vers l'avant
    for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2;
      planche(g, ton(k), .16, .05, L, x + Math.sin(an) * r, y + Math.cos(an) * r, z, 0, 0, -an); }
    const fond = ajoute(g, part(G.cyl, BOIS[0], r * 2 - .04, .04, r * 2 - .04, x, y, z + L / 2 - .02)); fond.rotation.x = Math.PI / 2;
    for(const dz of [-.18, .18]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, x, y, z + dz)); }
    const anneau = ajoute(g, part(G.tore, BOIS[2], r * 1.3, r * 1.3, .5, x, y, z + L / 2 - .01));
    for(const dz of [-.2, .2]){ boite(g, BOIS[1], .7, .1, .1, x, .06, z + dz);                  // le chevalet
      for(const s of [-1, 1]) planche(g, BOIS[1], .08, .34, .08, x + s * .22, .2, z + dz, 0, 0, s * .5); } }
  { const x = -.32, z = 1.52, r = .27, h = .64;                                                // le tonneau debout
    for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2;
      planche(g, ton(k), .15, h, .05, x + Math.sin(an) * r * (1 + .06), h / 2 + .02, z + Math.cos(an) * r * 1.06, 0, an, 0); }
    ajoute(g, part(G.cyl, BOIS[0], r * 2 - .02, .04, r * 2 - .02, x, h - .04, z));
    for(const y of [.12, .52]){ const c = ajoute(g, part(G.tore, FER, r * 2.25, r * 2.25, .6, x, y, z)); c.rotation.x = Math.PI / 2; } }
}
/* le sol : la plaque de sable, des dalles et des cailloux devant, des touffes d'herbe */
function sol2(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  for(const [x, z, w, d, ry] of [[-1.55, 2.3, .44, .3, .1], [-.85, 2.38, .4, .28, -.2], [-.15, 2.3, .38, .28, .25], [.55, 2.42, .42, .3, 0], [1.3, 2.3, .4, .28, -.15], [1.95, 2.2, .36, .26, .2], [-2.2, 2.2, .34, .26, .3]])
    bloc(g, PIERRE[Math.floor(hasard() * 4)], w, .06, d, x, .045, z, ry, BLOC_L);
  for(let k = 0; k < 14; k++){
    const x = -2.3 + hasard() * 4.6, z = 2.0 + hasard() * .5;
    if(Math.abs(x - PORTE_X) < .7) continue;
    const c = .05 + hasard() * .05, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
  for(const [x, z] of [[-2.3, 1.45], [2.1, 1.75], [-1.25, 1.55], [1.6, 1.62]]){
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function taverneNiveau2(g, opt = {}){
  alea = 13;
  const saison = opt.saison || "printemps";
  sol2(g);
  murs2(g, saison);
  pignon2(g, saison);
  toits2(g);
  cheminee(g);
  porte2(g);
  for(const x of [PORTE_X - .72, PORTE_X + .72]) lanterne2(g, x, 1.32, FW + .05);
  enseigne2(g);
  devant2(g);
}
