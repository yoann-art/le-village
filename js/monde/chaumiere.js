/* ================= La Chaumière, niveau 1 =================
   D'après l'image de Yo (4 novembre 2026 : « Voici la chaumière de niveau 1 »), au plus près de l'image, avec ses choix :
   « 4*4 », la porte « Comme sur l'image » (à droite), « Une petite fumée douce oui ». La maison de rondins couchés, leurs
   bouts ronds aux coins et leurs cernes, sur son socle de grosses pierres grises ; le toit de chaume épais en rangs
   d'écailles qui descend bas, le gros rondin du faîte serré de trois liens ; à droite, le pignon de planches au-dessus de la
   porte, son rondin au faîte ; la porte de planches dans son cadre, ses deux pentures cloutées, son anneau, ses deux
   marches de pierre ; la lanterne pendue à droite de la porte ; la petite fenêtre allumée à quatre carreaux, son cadre et
   son appui ; la cheminée de pierre grise derrière à gauche, qui fume doucement (au temps du vent : VENT) ; la souche
   devant, ses racines et ses cernes ; du sable, des cailloux, des touffes d'herbe (sans tas de terre). La fenêtre et la
   lanterne brillent plus fort la nuit.
   Coordonnées : le milieu du carré de 4 × 4 en (0, 0), la façade de gauche en z = FACADE, le pignon de la porte un peu en
   avant (FW), la porte en x = PORTE_X (B.chaumiere.door). */
import { G, part, toon, VENT } from "./formes.js";
import { lanterne } from "./ciel.js";

export const FACADE = .72, PORTE_X = .6;
const BOIS = [0xC9762F, 0xD88A42, 0xB5652A], CLAIR = 0xE4A35C, CERNE = 0xC07A3A, FONCE = 0x9A5222, PORTE_C = 0xB86A30, FER = 0x4A4A52, CLOU = 0x6A6A72,
  PAILLE = [0xF0B43C, 0xF5C24E, 0xE8A832], PAILLE_S = 0xD4922A, CORDE = 0xA8642C,
  PIERRE = [0xA9A29B, 0xB5AEA6, 0x9C958E, 0xBEB7AF], SABLE = 0xE2BE7E, SABLE_S = 0xD2AA6A, HERBE = [0x7DB54A, 0x8FC458];
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
const BLOC = arrondi(10, 8, .3), BLOC_L = arrondi(8, 6, .28), CAILLOU = new THREE.IcosahedronGeometry(.5, 0),
  ROND = new THREE.CylinderGeometry(.5, .5, 1, 12), ECAILLE = new THREE.SphereGeometry(.5, 10, 5), DISQUE = new THREE.CylinderGeometry(.5, .5, 1, 14);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0, geo = BLOC) => { const m = ajoute(g, part(geo, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 13;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

/* la maison : X0 à X1 de gauche à droite, Z0 (l'arrière) à FACADE ; à droite (XW à X1) le pignon de la porte avance
   jusqu'à FW. Le grand toit : faîte de gauche à droite en (ZR, HR), il descend jusqu'à HE au bout de son avancée ; le toit
   du pignon : faîte d'avant en arrière en (CXW, HRW), ses pentes à 45° */
const X0 = -1.62, X1 = 1.42, XW = -.18, Z0 = -1.2, FW = FACADE + .2, SOCLE = .32, D = .3;
const ZR = (Z0 + FACADE) / 2, HR = 2.9, AV = .25, RUN = (FACADE - Z0) / 2 + AV, HE = 1.74, PENTE = (HR - HE) / RUN, HM = HR - PENTE * (FACADE - ZR);
const CXW = (XW + X1) / 2, HRW = 2.84, RUNW = (X1 - XW) / 2 + .14, HMW = HRW - (X1 - XW) / 2;
const CX = (X0 + X1) / 2;

/* le socle : de grosses pierres grises de a à b, le long de x (en z) ou de z (en x) */
function socle(g, a, b, fixe, le, devant){
  let u = a;
  while(u < b - .03){
    const l = Math.min(b - u, .4 + hasard() * .3), ll = b - u - l < .22 ? b - u : l, c = u + ll / 2;
    if(le === "x") bloc(g, pierre(), ll - .04, SOCLE - .02, .34, c, SOCLE / 2, fixe + devant * .05, (hasard() - .5) * .04, BLOC_L);
    else bloc(g, pierre(), .34, SOCLE - .02, ll - .04, fixe + devant * .05, SOCLE / 2, c, (hasard() - .5) * .04, BLOC_L);
    u += ll;
  }
}
/* le bout rond d'un rondin, face au dehors : le bois clair et ses cernes */
function bout(g, x, y, z, dir){
  const r = D / 2;
  const m = ajoute(g, part(DISQUE, CLAIR, D * .96, .02, D * .96, x, y, z));
  const c = ajoute(g, part(G.tore, CERNE, r * 1.1, r * 1.1, .4, x, y, z));
  if(dir === "z"){ m.rotation.x = Math.PI / 2; } else { m.rotation.z = Math.PI / 2; c.rotation.y = Math.PI / 2; }
}
/* des rondins couchés de a à b, empilés du socle à haut, sauf les trous [u0, u1, y0, y1] ; les bouts qui dépassent */
function rondins(g, a, b, fixe, le, haut, trous = [], depasse = [.14, .14], decal = 0){
  for(let k = 0; ; k++){
    const y = SOCLE + D / 2 + k * (D - .02) + decal;
    if(y > haut - D * .3) break;
    let morceaux = [[a - depasse[0], b + depasse[1]]];
    for(const [u0, u1, y0, y1] of trous) if(y > y0 && y < y1) morceaux = morceaux.flatMap(([p, q]) => [[p, Math.min(q, u0)], [Math.max(p, u1), q]]);
    for(const [p, q] of morceaux) if(q - p > .05){
      const r = ajoute(g, part(ROND, ton(k), D, q - p, D, le === "x" ? (p + q) / 2 : fixe, y, le === "x" ? fixe : (p + q) / 2));
      if(le === "x") r.rotation.z = Math.PI / 2; else r.rotation.x = Math.PI / 2;
    }
    if(le === "x") for(const [u, s] of [[a - depasse[0], -1], [b + depasse[1], 1]]) if(depasse[s < 0 ? 0 : 1] > .05) bout(g, u + s * .005, y, fixe, "x");
    if(le === "z" && depasse[1] > .05) bout(g, fixe, y, b + depasse[1] + .005, "z");
  }
}
const FEN = {x: -.92, y: 1.1, w: .5, h: .48};
function murs(g){
  /* le coeur, qui comble tout derrière les rondins, et les combles sous les toits */
  boite(g, FONCE, X1 - X0 - .1, HM - .1, FACADE - Z0 - .1, CX, HM / 2, ZR);
  boite(g, FONCE, X1 - XW - .1, HMW - .1, FW - FACADE + .1, CXW, HMW / 2, (FW + FACADE) / 2 - .05);
  ajoute(g, part(G.gable, FONCE, X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, CX, HM - .02, ZR));
  ajoute(g, part(G.gable, FONCE, FW + .3, HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FW - .3) / 2)).rotation.y = Math.PI / 2;
  /* le socle de grosses pierres, devant et sur les côtés */
  socle(g, X0 - .1, XW, FACADE, "x", 1); socle(g, XW, X1 + .1, FW, "x", 1);
  socle(g, Z0, FACADE, X0, "z", -1); socle(g, Z0, FW, X1, "z", 1);
  /* les murs de rondins : devant à gauche (la fenêtre), le côté gauche, devant à droite (la porte), le côté droit, l'arrière */
  const { x: fx, y: fy, w: fw, h: fh } = FEN;
  rondins(g, X0, XW, FACADE, "x", HM, [[fx - fw / 2 - .03, fx + fw / 2 + .03, fy - fh / 2 - .08, fy + fh / 2 + .08]], [.16, .16]);
  rondins(g, Z0, FACADE, X0, "z", HM, [], [0, .17], D / 2);
  rondins(g, XW, X1, FW, "x", HMW, [[PORTE_X - .45, PORTE_X + .45, 0, 1.75]], [.16, .16], D / 2);
  rondins(g, Z0, FW, X1, "z", HMW, [], [0, .17]);
  rondins(g, X0, X1, Z0, "x", HM, [], [0, 0]);
  /* le pignon de gauche, sous le grand toit : des planches debout */
  const toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08, n = 8, l = (FACADE - Z0) / n;
  for(let k = 0; k < n; k++){ const z = Z0 + (k + .5) * l, h = toitZ(z) - HM + .04; if(h > .04) boite(g, ton(k), .07, h, l - .02, X0 - .02, HM + h / 2 - .02, z); }
  /* la fenêtre : la vitre allumée, ses quatre carreaux, son cadre, son linteau et son appui */
  const zF = FACADE + D / 2;
  ajoute(g, part(G.box, VITRE, fw, fh, .04, fx, fy, zF - .1));
  boite(g, FONCE, .05, fh, .05, fx, fy, zF - .07); boite(g, FONCE, fw, .05, .05, fx, fy, zF - .07);
  for(const [w, h, x, y] of [[fw + .14, .08, 0, fh / 2 + .03], [fw + .14, .08, 0, -fh / 2 - .03], [.08, fh + .06, -fw / 2 - .03, 0], [.08, fh + .06, fw / 2 + .03, 0]])
    boite(g, BOIS[0], w, h, .1, fx + x, fy + y, zF - .04);
  boite(g, CLAIR, fw + .34, .09, .12, fx, fy + fh / 2 + .12, zF);                         // le linteau
  boite(g, CLAIR, fw + .34, .09, .18, fx, fy - fh / 2 - .12, zF + .03);                   // l'appui
}
/* le pignon de devant, au-dessus de la porte : les planches, la poutre, le poinçon, les rives épaisses */
function pignon(g){
  const z = FW + .02, n = Math.round((X1 - XW) / .2), l = (X1 - XW) / n;
  for(let k = 0; k < n; k++){ const x = XW + (k + .5) * l, h1 = HRW - .1 - Math.abs(x - CXW);
    if(h1 > HMW) boite(g, ton(k), l - .02, h1 - HMW + .05, .07, x, (h1 + HMW) / 2, z); }
  boite(g, BOIS[1], X1 - XW + .1, .16, .16, CXW, HMW, z + .06);                            // la poutre
  boite(g, BOIS[2], .16, HRW - HMW - .2, .1, CXW, (HRW + HMW) / 2 - .06, z + .05);         // le poinçon
  for(const s of [-1, 1]){                                                                 // les rives, le long du toit
    const L = RUNW * Math.SQRT2;
    planche(g, BOIS[0], L, .18, .14, CXW + s * RUNW / 2, HRW - RUNW / 2 - .04, z + .14, 0, 0, -s * Math.PI / 4);
  }
}
/* une pente de chaume : des rangs de bottes qui se recouvrent, du faîte vers le bas, leurs bouts arrondis en écailles.
   Le repère : l'origine au faîte, x le long du faîte (de a à b), z qui descend la pente (jusqu'à L), y vers le dehors */
function pente(g, a, b, L, rangs, pas){
  const h = L / rangs, w = b - a;
  for(let k = 0; k < rangs; k++){
    const z = (k + .5) * h, y = .06 + (rangs - k) * .08;
    bloc(g, PAILLE_S, w, .1, h + .08, (a + b) / 2, y - .1, z, 0, BLOC_L);                       // le dessous, dans l'ombre
    bloc(g, PAILLE[k % 3], w + .04, .18, h * .62, (a + b) / 2, y, z - h * .2, 0, BLOC_L);         // la botte
    const n = Math.max(2, Math.round(w / pas)), l = w / n;
    for(let i = 0; i < n; i++){                                                                 // ses bouts arrondis, qui pendent
      const e = ajoute(g, part(ECAILLE, PAILLE[(i + k) % 3], l * 1.12, .18, h * .62, a + (i + .5 + (k % 2) * .5) * l - (k % 2 && i === n - 1 ? l / 2 : 0), y - .01, z + h * .2));
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
  pente(poser(g, 0, HR, ZR, 0, a), X0 - .28, XW + .25, L, 4, .26);
  pente(poser(g, 0, HR, ZR, Math.PI, a), -(X1 + .28), -(X0 - .28), L, 4, .42);
  /* le toit du pignon, d'avant en arrière, à droite et à gauche */
  const LW = RUNW * Math.SQRT2 + .05, zA = -.4, zB = FW + .26;
  pente(poser(g, CXW, HRW, 0, Math.PI / 2, Math.PI / 4), -zB, -zA, LW, 4, .26);
  pente(poser(g, CXW, HRW, 0, -Math.PI / 2, Math.PI / 4), zA, zB, LW, 4, .26);
  /* le gros rondin du faîte, ses bouts et ses trois liens ; le rondin du faîte du pignon, son bout devant */
  const R = .34, xa = X0 - .2, xb = X1 + .2;
  const fa = ajoute(g, part(ROND, BOIS[1], R, xb - xa, R, CX, HR + .2, ZR)); fa.rotation.z = Math.PI / 2;
  for(const x of [xa, xb]) bout(g, x + (x < 0 ? -.005 : .005), HR + .2, ZR, "x");
  for(const x of [CX - 1.0, CX, CX + 1.0]){ const c = ajoute(g, part(G.tore, CORDE, R * 1.12, R * 1.12, 1.6, x, HR + .2, ZR)); c.rotation.y = Math.PI / 2; }
  ajoute(g, part(ROND, PAILLE[1], .26, zB - zA, .26, CXW, HRW + .17, (zA + zB) / 2)).rotation.x = Math.PI / 2;
  const fb = ajoute(g, part(ROND, BOIS[1], .28, .3, .28, CXW, HRW - .02, zB - .05)); fb.rotation.x = Math.PI / 2;
  bout(g, CXW, HRW - .02, zB + .105, "z");
  g.userData.toit = HR + .45;
}
/* la cheminée de pierre grise, derrière à gauche, et sa petite fumée douce qui monte et s'efface */
function cheminee(g){
  const x = -1.1, z = -.72, e = .44;
  for(let r = 0; r < 7; r++){ const y = 1.6 + r * .27;
    for(const dx of [-e / 4, e / 4]) bloc(g, pierre(), r % 2 ? e : e / 2 - .02, .25, r % 2 ? e / 2 - .02 : e, x + (r % 2 ? 0 : dx), y + .13, z + (r % 2 ? dx : 0), 0, BLOC_L); }
  bloc(g, PIERRE[1], e + .14, .16, e + .14, x, 3.53, z);
  boite(g, 0x3A3430, e - .2, .05, e - .2, x, 3.62, z);
  const puffs = new THREE.InstancedMesh(G.head, FUMEE, 5), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();
  puffs.castShadow = false; puffs.receiveShadow = false; puffs.frustumCulled = false; puffs.renderOrder = 3;
  const bouge = () => {
    const t = VENT.temps.value;
    for(let k = 0; k < 5; k++){
      const tt = (t * .11 + k / 5) % 1, r = (.45 + tt * 1.2) * Math.min(1, (1 - tt) * 3.5);
      p.set(x + Math.sin(t * .7 + k * 1.3) * .08 + tt * .3, 3.73 + tt * 1.4, z + Math.cos(t * .5 + k) * .06); s.set(r, r * .85, r);
      puffs.setMatrixAt(k, m.compose(p, q, s));
    }
    puffs.instanceMatrix.needsUpdate = true;
  };
  bouge(); puffs.onBeforeRender = bouge; g.add(puffs);
}
/* la porte de planches dans son cadre, ses deux pentures cloutées, l'anneau ; les deux marches de pierre */
function porte(g){
  const z = FW + .02, w = .66, h = 1.42, y0 = SOCLE - .05;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0xAA6028, w / 4 - .015, h, .06, PORTE_X - w / 2 + (k + .5) * w / 4, y0 + h / 2, z);
  for(const s of [-1, 1]) boite(g, BOIS[0], .14, h + .14, .16, PORTE_X + s * (w / 2 + .07), y0 + (h + .14) / 2, z + .04);   // le cadre
  boite(g, CLAIR, w + .46, .14, .2, PORTE_X, y0 + h + .12, z + .06);                         // le linteau
  for(const y of [y0 + .3, y0 + h - .32]){ boite(g, FER, w + .02, .1, .03, PORTE_X, y, z + .05);
    for(const x of [-.24, -.08, .08, .24]) ajoute(g, part(G.head, CLOU, .15, .15, .1, PORTE_X + x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .22, .22, .3, PORTE_X + .14, y0 + .62, z + .07));
  ajoute(g, part(G.cyl, FER, .09, .04, .09, PORTE_X + .14, y0 + .73, z + .05)).rotation.x = Math.PI / 2;
  bloc(g, PIERRE[3], 1.0, .16, .42, PORTE_X, .08, FW + .4); bloc(g, PIERRE[1], .86, .15, .26, PORTE_X, .22, FW + .2);
}
/* à droite de la porte : la potence de fer et la lanterne qui pend, qui brille la nuit */
function lanterneChaumiere(g){
  const x = 1.22, y = 1.35, z = FW + D / 2 + .02;
  boite(g, FER, .08, .18, .05, x - .1, y + .42, z);
  boite(g, FER, .22, .05, .05, x, y + .38, z + .02);
  boite(g, FER, .025, .12, .025, x + .08, y + .28, z + .05);
  const chapeau = ajoute(g, part(G.cone4, FER, .24, .11, .24, x + .08, y + .17, z + .05)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .13, .19, .13, x + .08, y, z + .05));
  for(const [dx, dz] of [[-.07, -.07], [.07, -.07], [-.07, .07], [.07, .07]]) boite(g, FER, .025, .22, .025, x + .08 + dx, y, z + .05 + dz);
  boite(g, FER, .19, .04, .19, x + .08, y - .12, z + .05);
}
/* devant, à gauche : la souche, ses racines, ses cernes sur le dessus */
function souche(g){
  const x = -1.05, z = 1.3, r = .26, h = .42;
  ajoute(g, part(G.cyl, BOIS[0], r * 2, h, r * 2, x, h / 2, z));
  ajoute(g, part(DISQUE, CLAIR, r * 2 - .02, .02, r * 2 - .02, x, h + .005, z));
  for(const f of [.35, .7]) ajoute(g, part(G.tore, CERNE, r * 2 * f, r * 2 * f, .5, x, h + .02, z)).rotation.x = Math.PI / 2;
  for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2 + .4;
    const ra = ajoute(g, part(G.cone, ton(k), .22, .4, .14, x + Math.sin(an) * (r + .06), .09, z + Math.cos(an) * (r + .06)));
    ra.rotation.set(Math.cos(an) * 1.3, 0, -Math.sin(an) * 1.3); }
}
/* le sol : la plaque de sable, des cailloux, des pierres, quelques touffes d'herbe */
function sol(g){
  const m = ajoute(g, part(G.cyl, SABLE, 3.95, .05, 3.8, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 1.4, .052, .8, -.5, .027, 1.45)); s.receiveShadow = true; s.castShadow = false;
  for(let k = 0; k < 14; k++){
    const x = -1.8 + hasard() * 3.6, z = 1.15 + hasard() * .7;
    if(Math.abs(x - PORTE_X) < .6 || Math.hypot(x + 1.05, z - 1.3) < .45) continue;          // le passage devant la porte, la souche
    const c = .05 + hasard() * .05, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
  for(const [x, z, sx, sy, sz] of [[-1.55, 1.15, .32, .22, .3], [-.3, 1.55, .26, .18, .24], [1.6, 1.3, .28, .2, .26]]){
    const r = ajoute(g, part(CAILLOU, pierre(), sx, sy, sz, x, sy * .36, z)); r.rotation.set(0, hasard() * 3, 0); }
  for(const [x, z] of [[-1.82, .95], [1.62, .95], [-.55, 1.62], [1.15, 1.6]]){                  // les touffes d'herbe, à même le sable
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function chaumiereNiveau1(g){
  alea = 13;
  sol(g);
  murs(g);
  pignon(g);
  toits(g);
  cheminee(g);
  porte(g);
  lanterneChaumiere(g);
  souche(g);
}

/* ================= La Chaumière, niveau 2 =================
   D'après l'image de Yo (13 novembre 2026 : « Voici la chaumière niveau 2 »), au plus près de l'image : la même place (4 × 4),
   la porte à droite au même endroit. La maison à colombages, le torchis crème entre les poutres, sur son socle de grosses
   pierres grises jointives ; le grand toit de chaume épais en rangs d'écailles, son faîte de chaume roulé ; la cheminée de
   pierre grise derrière à gauche, sa petite fumée ; à droite, le pignon de la porte, ses rives de bois, sa fenêtre d'étage au
   haut arrondi et sa jardinière ; en bas, la fenêtre au haut arrondi, ses volets ouverts et sa jardinière ; la porte de
   planches en arc dans son cadre de bois arrondi, ses deux pentures cloutées, son anneau, ses deux marches ; la lanterne à
   droite ; devant, trois pots de terre cuite (la lavande, les pâquerettes, les géraniums rouges), des dalles, des cailloux,
   des touffes d'herbe (sans tas de terre). Pas de souche : elle n'est pas sur l'image. Les fleurs suivent la saison, comme la
   vraie nature (batiments.js refait la Chaumière niveau 2 quand elle change) : la lavande fleurit l'été (son feuillage gris
   reste l'hiver), les pâquerettes et les géraniums du printemps à l'automne ; l'hiver, les pots de fleurs annuelles sont nus.
   La nuit, les fenêtres et la lanterne brillent plus fort. */
const CREME2 = 0xF4E4C6, POUTRE2 = 0xB4602A, TERRE_CUITE = [0xC8683A, 0xD47844], LAVANDE = [0x8A6AC8, 0x9C7CD6], FEUILLE2 = [0x4E8A3A, 0x5E9A44];
const ARC_FEN = new THREE.TorusGeometry(1, .16, 6, 14, Math.PI), DEMI_DISQUE = new THREE.CylinderGeometry(.5, .5, 1, 14, 1, false, -Math.PI / 2, Math.PI);
const PETIT = new THREE.IcosahedronGeometry(.5, 1);                                        // les fleurs et les feuilles, simples (assez à cette taille)
const POT = new THREE.SphereGeometry(.5, 12, 8, 0, Math.PI * 2, Math.PI * .18, Math.PI * .82);
/* le torchis : des panneaux crème d'un seul tenant, sauf les trous [u0, u1, y0, y1] (la porte, les fenêtres) */
function torchis2(g, a, b, fixe, le, haut, bas = SOCLE, trous = []){
  const n = Math.max(1, Math.round((b - a) / .12)), l = (b - a) / n;
  for(let k = 0; k < n; k++){ const u = a + (k + .5) * l, h1 = haut(u);
    let morceaux = [[bas, h1]];
    for(const [u0, u1, y0, y1] of trous) if(u > u0 && u < u1) morceaux = morceaux.flatMap(([p, q]) => [[p, Math.min(q, y0)], [Math.max(p, y1), q]]);
    for(const [p, q] of morceaux) if(q - p > .02){
      if(le === "x") boite(g, CREME2, l + .002, q - p, .08, u, (p + q) / 2, fixe);
      else boite(g, CREME2, .08, q - p, l + .002, fixe, (p + q) / 2, u); } }
}
function poutre2(g, x1, y1, x2, y2, z, e = .13){
  const L = Math.hypot(x2 - x1, y2 - y1); planche(g, POUTRE2, e, L, .09, (x1 + x2) / 2, (y1 + y2) / 2, z, 0, 0, -Math.atan2(x2 - x1, y2 - y1));
}
/* la jardinière sous une fenêtre : sa caisse, la terre, des feuilles ; des géraniums rouges du printemps à l'automne (en
   automne, déjà plus rares), rien l'hiver */
function jardiniere2(g, x, y, z, w, saison){
  boite(g, BOIS[2], w, .15, .17, x, y, z + .1);
  boite(g, 0x5A3E28, w - .06, .03, .12, x, y + .07, z + .1);
  if(saison === "hiver") return;
  const n = Math.round(w / .1);
  for(let k = 0; k < n; k++) ajoute(g, part(PETIT, FEUILLE2[k % 2], .13, .09, .1, x - w / 2 + (k + .5) * w / n, y + .11, z + .09 + (k % 2) * .03));
  const fl = saison === "automne" ? 2 : n - 1;
  for(let k = 0; k < fl; k++) ajoute(g, part(PETIT, k % 2 ? 0xE8505A : 0xD8342A, .08, .07, .08, x - w / 2 + (k + 1) * w / (fl + 1), y + .17 + (k % 2) * .03, z + .12));
}
/* une fenêtre au haut arrondi : la vitre allumée, ses croisillons, son cadre de bois et son arc ; les volets ; sa jardinière */
function fenetreArc(g, fx, fy, fw, fh, z, saison, volets){
  ajoute(g, part(G.box, VITRE, fw, fh, .04, fx, fy, z - .01));
  ajoute(g, part(DEMI_DISQUE, VITRE, fw, .04, fw, fx, fy + fh / 2, z - .01)).rotation.x = Math.PI / 2;
  boite(g, FONCE, .04, fh + fw / 2 - .02, .04, fx, fy + fw / 4, z + .02); boite(g, FONCE, fw, .04, .04, fx, fy + .02, z + .02);
  for(const s of [-1, 1]) boite(g, BOIS[0], .08, fh + .04, .1, fx + s * (fw / 2 + .04), fy, z + .03);
  const arc = ajoute(g, part(ARC_FEN, BOIS[0], fw / 2 + .04, fw / 2 + .04, .5, fx, fy + fh / 2, z + .03)); arc.scale.set(fw / 2 + .04, fw / 2 + .04, .5);
  if(volets) for(const s of [-1, 1]){ const vx = fx + s * (fw / 2 + .17);
    boite(g, FONCE, .24, fh + .06, .05, vx, fy, z + .05);
    for(const dx of [-.055, .055]) boite(g, BOIS[1], .09, fh, .05, vx + dx, fy, z + .08);
    for(const y of [fy - .14, fy + .14]) boite(g, BOIS[2], .22, .05, .03, vx, y, z + .11); }
  jardiniere2(g, fx, fy - fh / 2 - .13, z, fw + .2, saison);
}
function murs2(g, saison){
  boite(g, CREME2, X1 - X0 - .1, HM - .1, FACADE - Z0 - .1, CX, HM / 2, ZR);
  boite(g, CREME2, X1 - XW - .1, HMW - .1, FW - FACADE + .1, CXW, HMW / 2, (FW + FACADE) / 2 - .05);
  ajoute(g, part(G.gable, CREME2, X1 - X0 - .1, HR - HM, FACADE - Z0 - .1, CX, HM - .02, ZR));
  ajoute(g, part(G.gable, CREME2, FW + .3, HRW - HMW, X1 - XW - .1, CXW, HMW - .02, (FW - .3) / 2)).rotation.y = Math.PI / 2;
  /* le socle de grosses pierres grises, jointives ; les grosses pierres des coins */
  socle(g, X0 - .1, XW, FACADE, "x", 1); socle(g, XW, X1 + .1, FW, "x", 1); socle(g, Z0, FACADE, X0, "z", -1); socle(g, Z0, FW, X1, "z", 1); socle(g, X0, X1, Z0, "x", -1);
  for(const [x, z] of [[X0 - .05, FACADE], [X1 + .05, FW]]) bloc(g, pierre(), .42, .46, .42, x, .23, z + .05);
  /* la façade de gauche : le torchis, les poteaux, la sablière, la lisse, un lien ; la fenêtre au haut arrondi */
  const zF = FACADE + .04, fx = -.92, fy = 1.02;
  torchis2(g, X0, XW, zF, "x", () => HM, SOCLE, [[fx - .25, fx + .25, fy - .22, fy + .44]]);
  for(const x of [X0 + .07, XW - .02]) boite(g, POUTRE2, .16, HM - SOCLE, .1, x, (HM + SOCLE) / 2, zF + .05);
  boite(g, POUTRE2, XW - X0 + .1, .15, .12, (X0 + XW) / 2, HM - .07, zF + .05);
  boite(g, POUTRE2, XW - X0 + .1, .12, .1, (X0 + XW) / 2, SOCLE + .06, zF + .05);
  poutre2(g, X0 + .14, HM - .25, X0 + .45, HM - .1, zF + .05); poutre2(g, XW - .1, HM - .25, XW - .4, HM - .1, zF + .05);
  fenetreArc(g, fx, fy, .42, .42, zF, saison, true);
  /* les côtés et l'arrière : le torchis jusqu'aux toits, des poteaux ; le pignon de gauche, sous le grand toit */
  const toitZ = z => HR - PENTE * Math.abs(z - ZR) - .08;
  torchis2(g, Z0, FACADE, X0 - .02, "z", toitZ);
  torchis2(g, Z0, FW, X1 + .02, "z", z => z > -.3 ? HMW - .04 : toitZ(z));
  torchis2(g, X0, X1, Z0 - .02, "x", () => HM);
  for(const [x, z] of [[X0 - .06, Z0 + .07], [X0 - .06, FACADE - .06], [X1 + .06, Z0 + .07], [X1 + .06, FW - .06]]) boite(g, POUTRE2, .1, HM - SOCLE, .15, x, (HM + SOCLE) / 2, z);
  for(const x of [X0 - .07, X1 + .07]) boite(g, POUTRE2, .1, .13, FACADE - Z0, x, HM - .07, ZR);
}
/* le pignon de la porte : le torchis, la poutre de l'étage, les liens autour de la fenêtre d'étage, les rives épaisses */
function pignon2(g, saison){
  const z = FW + .03;
  torchis2(g, XW, X1, z, "x", x => HRW - .1 - Math.abs(x - CXW), SOCLE, [[PORTE_X - .42, PORTE_X + .42, 0, SOCLE + 1.52], [CXW - .16, CXW + .16, HMW + .2, HMW + .58]]);
  for(const x of [XW + .07, X1 - .07]) boite(g, POUTRE2, .16, HMW - SOCLE, .1, x, (HMW + SOCLE) / 2, z + .05);
  boite(g, POUTRE2, X1 - XW + .12, .16, .14, CXW, HMW - .02, z + .06);                          // la poutre de l'étage
  boite(g, POUTRE2, X1 - XW + .1, .12, .1, CXW, SOCLE + .06, z + .05);
  boite(g, POUTRE2, X1 - XW - .2, .1, .1, CXW, 1.68, z + .05);                                   // la poutre au-dessus de la porte
  for(const s of [-1, 1]) poutre2(g, CXW + s * .32, HMW + .06, CXW + s * .58, HMW + .3, z + .06);   // les liens, sous la fenêtre d'étage
  fenetreArc(g, CXW, HMW + .32, .28, .22, z + .02, saison, false);
  for(const s of [-1, 1]) planche(g, BOIS[0], RUNW * Math.SQRT2, .2, .14, CXW + s * RUNW / 2, HRW - RUNW / 2 - .04, z + .14, 0, 0, -s * Math.PI / 4);   // les rives
  ajoute(g, part(G.cyl, BOIS[1], .22, .16, .22, CXW, HRW - .04, z + .14)).rotation.x = Math.PI / 2;   // leur rencontre, arrondie
}
/* le chaume : comme au niveau 1, et le faîte de chaume roulé (pas de rondin, comme l'image) */
function toits2(g){
  const a = Math.atan(PENTE), L = RUN / Math.cos(a) + .05;
  pente(poser(g, 0, HR, ZR, 0, a), X0 - .3, XW + .25, L, 4, .26);
  pente(poser(g, 0, HR, ZR, Math.PI, a), -(X1 + .3), -(X0 - .3), L, 4, .42);
  const LW = RUNW * Math.SQRT2 + .05, zA = -.4, zB = FW + .26;
  pente(poser(g, CXW, HRW, 0, Math.PI / 2, Math.PI / 4), -zB, -zA, LW, 4, .26);
  pente(poser(g, CXW, HRW, 0, -Math.PI / 2, Math.PI / 4), zA, zB, LW, 4, .26);
  const fa = ajoute(g, part(ROND, PAILLE[1], .36, X1 - X0 + .6, .4, CX, HR + .2, ZR)); fa.rotation.z = Math.PI / 2;
  for(const x of [X0 - .3, X1 + .3]) ajoute(g, part(ECAILLE, PAILLE[0], .38, .4, .42, x, HR + .2, ZR));
  ajoute(g, part(ROND, PAILLE[1], .3, zB - zA, .32, CXW, HRW + .17, (zA + zB) / 2)).rotation.x = Math.PI / 2;
  ajoute(g, part(ECAILLE, PAILLE[0], .32, .34, .3, CXW, HRW + .17, zB));
  g.userData.toit = HR + .45;
}
/* la porte de planches en arc, son cadre de bois arrondi, ses deux pentures cloutées, l'anneau ; les deux marches */
function porte2(g){
  const z = FW + .03, w = .66, y0 = SOCLE - .05, hd = 1.15, r = w / 2;
  for(let k = 0; k < 4; k++){ const x = PORTE_X - w / 2 + (k + .5) * w / 4, dx = x - PORTE_X, haut = hd + Math.sqrt(Math.max(0, (r - .02) ** 2 - dx * dx));
    boite(g, k % 2 ? PORTE_C : 0xAA6028, w / 4 - .015, haut, .06, x, y0 + haut / 2, z); }
  for(const s of [-1, 1]) boite(g, BOIS[0], .15, hd + .02, .16, PORTE_X + s * (r + .08), y0 + hd / 2, z + .04);   // le cadre
  const arc = ajoute(g, part(ARC_FEN, BOIS[0], 1, 1, .5, PORTE_X, y0 + hd, z + .04)); arc.scale.set(r + .08, r + .08, .9);
  for(const y of [y0 + .3, y0 + hd - .12]){ boite(g, FER, w + .02, .1, .03, PORTE_X, y, z + .05);
    for(const x of [-.24, -.08, .08, .24]) ajoute(g, part(G.head, CLOU, .14, .14, .1, PORTE_X + x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .22, .22, .3, PORTE_X + .14, y0 + .62, z + .07));
  ajoute(g, part(G.cyl, FER, .09, .04, .09, PORTE_X + .14, y0 + .73, z + .05)).rotation.x = Math.PI / 2;
  bloc(g, PIERRE[3], 1.0, .16, .42, PORTE_X, .08, FW + .4); bloc(g, PIERRE[1], .86, .15, .26, PORTE_X, .22, FW + .2);
}
/* un pot de terre cuite, son bord roulé, sa terre */
function pot(g, x, z, r, h, hex){
  ajoute(g, part(POT, hex, r * 2, h * 1.25, r * 2, x, h * .5, z));
  ajoute(g, part(G.tore, hex, r * 1.55, r * 1.55, .7, x, h * .93, z)).rotation.x = Math.PI / 2;
  ajoute(g, part(G.cyl, 0x5A3E28, r * 1.4, .03, r * 1.4, x, h * .9, z));
}
/* devant : trois pots de fleurs, comme la vraie nature (la saison) */
function pots(g, saison){
  const fleurit = {lavande: saison === "ete", paquerette: saison !== "hiver", geranium: saison !== "hiver"};
  /* la lavande : un buisson de tiges grises, ses épis violets l'été */
  { const x = -.5, z = 1.2, h = .36; pot(g, x, z, .18, h, TERRE_CUITE[0]);
    for(let k = 0; k < 9; k++){ const an = k / 9 * Math.PI * 2, rr = k ? .07 : 0, lean = k ? .25 : 0, tx = x + Math.sin(an) * rr, tz = z + Math.cos(an) * rr, hh = .32 + (k % 3) * .04;
      const t = planche(g, 0x8AA07A, .025, hh, .025, tx + Math.sin(an) * lean * hh / 2, h + hh / 2, tz + Math.cos(an) * lean * hh / 2, Math.cos(an) * lean, 0, -Math.sin(an) * lean);
      if(fleurit.lavande) for(let j = 0; j < 4; j++) ajoute(g, part(PETIT, LAVANDE[j % 2], .05, .06, .05, tx + Math.sin(an) * lean * (hh - .04 * j), h + hh - .03 - j * .04, tz + Math.cos(an) * lean * (hh - .04 * j)));
    } }
  /* les pâquerettes : une touffe de feuilles, des fleurs blanches au cœur jaune */
  { const x = -.08, z = 1.32, h = .26; pot(g, x, z, .15, h, TERRE_CUITE[1]);
    if(saison !== "hiver") for(let k = 0; k < 7; k++) ajoute(g, part(PETIT, FEUILLE2[k % 2], .1, .06, .1, x + Math.sin(k * .9) * .08, h + .03, z + Math.cos(k * .9) * .08));
    if(fleurit.paquerette) for(const [dx, dz, dy] of [[0, 0, .14], [.07, .04, .1], [-.07, .03, .11], [.03, -.07, .12], [-.04, -.05, .09]]){
      for(let p = 0; p < 6; p++){ const an = p / 6 * Math.PI * 2; ajoute(g, part(PETIT, 0xF6F2E6, .035, .015, .035, x + dx + Math.sin(an) * .025, h + dy, z + dz + Math.cos(an) * .025)); }
      ajoute(g, part(PETIT, 0xF2C22E, .025, .02, .025, x + dx, h + dy + .008, z + dz)); } }
  /* les géraniums rouges : des feuilles rondes, des bouquets de fleurs rouges */
  { const x = 1.36, z = 1.18, h = .34; pot(g, x, z, .19, h, TERRE_CUITE[0]);
    if(saison !== "hiver") for(let k = 0; k < 8; k++) ajoute(g, part(PETIT, FEUILLE2[k % 2], .14, .08, .14, x + Math.sin(k * .8) * .11, h + .05 + (k % 2) * .03, z + Math.cos(k * .8) * .11));
    if(fleurit.geranium) for(const [dx, dz, dy] of [[0, 0, .2], [.09, .05, .15], [-.09, .04, .16], [.03, -.09, .17]])
      for(let p = 0; p < 5; p++){ const an = p / 5 * Math.PI * 2; ajoute(g, part(PETIT, p % 2 ? 0xE8505A : 0xD8342A, .05, .045, .05, x + dx + Math.sin(an) * .03, h + dy, z + dz + Math.cos(an) * .03)); } }
}
/* le sol : la plaque de sable, des dalles devant la porte, des cailloux, des touffes d'herbe */
function sol2(g){
  const m = ajoute(g, part(G.cyl, SABLE, 3.95, .05, 3.8, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  for(const [x, z, w, d, ry] of [[.6, 1.78, .5, .3, .05], [1.05, 1.9, .36, .26, -.2], [-1.3, 1.25, .36, .26, .3], [-1.0, 1.55, .3, .22, -.1]])
    bloc(g, PIERRE[Math.floor(hasard() * 4)], w, .06, d, x, .045, z, ry, BLOC_L);
  for(let k = 0; k < 12; k++){
    const x = -1.8 + hasard() * 3.6, z = 1.45 + hasard() * .45;
    if(Math.abs(x - PORTE_X) < .6 || Math.abs(x + .3) < .45 || Math.abs(x - 1.36) < .25) continue;
    const c = .05 + hasard() * .05, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.4, c * .7, c * 1.2, x, c * .3, z)); p.rotation.set(0, hasard() * 3, 0);
  }
  for(const [x, z] of [[-1.82, .95], [1.7, .95], [-.85, 1.4], [1.7, 1.55]]){
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function chaumiereNiveau2(g, opt = {}){
  alea = 17;
  const saison = opt.saison || "printemps";
  sol2(g);
  murs2(g, saison);
  pignon2(g, saison);
  toits2(g);
  cheminee(g);
  porte2(g);
  lanterneChaumiere(g);
  pots(g, saison);
}
