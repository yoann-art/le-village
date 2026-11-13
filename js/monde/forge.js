/* ================= La Forge, niveau 1 =================
   D'après l'image de Yo (4 novembre 2026 : « On va faire tous les bâtiments de niveau 1. Voici la forge »), au plus près
   de l'image, avec ses choix : « Oui 5*5 », la porte « Comme l'image » (à droite, le foyer à gauche), « Une petite fumée
   douce ». La maison de pierres claires, sa porte de planches en arc sous ses claveaux, ses pentures et son anneau, ses
   marches de pierre ; la petite fenêtre allumée ; le pignon de devant à colombages et ses croix de bois ; le toit de
   larges planches clouées, la poutre de faîte et ses blocs ; la cheminée de pierre qui fume doucement (la fumée monte et
   s'efface, au temps du vent : VENT) ; la lanterne sur sa potence. À gauche, l'appentis sur ses poteaux : le foyer de
   pierre et ses braises (elles rougeoient plus fort la nuit, comme la fenêtre et la lanterne), sa hotte de fer, les
   pinces accrochées au mur. Devant : l'enclume sur sa bûche cerclée de fer, le tonneau et ses lingots, la meule sur son
   chevalet et sa manivelle ; des dalles, des cailloux, des rochers aux coins, quelques touffes d'herbe (sans tas de
   terre), sur une plaque de sable.
   Coordonnées : le milieu du carré de 5 × 5 en (0, 0), la façade de la maison en z = FACADE, la porte en x = PORTE_X
   (B.forge.door). */
import { G, part, toon, VENT } from "./formes.js";
import { lanterne } from "./ciel.js";

export const FACADE = 1.1, PORTE_X = .9;
const BOIS = [0xB8642E, 0xC6713A, 0xA9582A], CLAIR = 0xD58A4E, FONCE = 0x8A4422, PORTE_C = 0xA65A2C, FER = 0x4A4A52, CLOU = 0x6A6A72,
  PIERRE = [0xD9CCB6, 0xCFC1AA, 0xE2D6C2, 0xC6B8A0], PIERRE_S = 0xA4967E, SABLE = 0xDDBE84, SABLE_S = 0xCDAA72, HERBE = [0x7DB54A, 0x8FC458];
/* ce qui luit, plus fort la nuit (ciel.js) : la lanterne, la fenêtre, les braises */
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
const VITRE = toon({color: 0xFFC060, emissive: 0xFF9A30, emissiveIntensity: .7});
const BRAISE = toon({color: 0xFF8A2A, emissive: 0xFF5A10, emissiveIntensity: .9});
const FLAMME = toon({color: 0xFFD04A, emissive: 0xFFA020, emissiveIntensity: .9});   // les petites flammes au-dessus des braises (Yo, 13 novembre 2026)
for(const m of [LUEUR, VITRE, BRAISE, FLAMME]) lanterne(null, 0, 0, m);
const LANGUE = new THREE.ConeGeometry(.5, 1, 7);
const FUMEE = toon({color: 0xF2F0EC, transparent: true, opacity: .42, depthWrite: false});

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
/* une pierre taillée aux arêtes adoucies (une boîte aux coins ronds) ; une plus simple pour ce qui se voit moins */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(10, 8, .28), BLOC_L = arrondi(8, 6, .28), CAILLOU = new THREE.IcosahedronGeometry(.5, 0), ROND = new THREE.CylinderGeometry(.5, .5, 1, 18);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0, geo = BLOC) => { const m = ajoute(g, part(geo, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 7;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
let PAL = PIERRE;                                                                    // la palette des pierres (claires au niveau 1, grises au niveau 2)
const pierre = () => PAL[Math.floor(hasard() * 4)];

/* la maison : X0 à X1 de gauche à droite, Z0 (l'arrière) à FACADE ; les murs de pierre jusqu'à HM, le pignon de HR */
const X0 = -.45, X1 = 2.2, Z0 = -1.7, HM = 1.7, HR = 1.05, CX = (X0 + X1) / 2, RANG = HM / 5;
const ARC = {x: PORTE_X, y: 1.0, r: .44};
/* un rang de pierres entre a et b, sauf les trous [de, à] */
function rang(g, a, b, trous, y, h, fixe, le, devant, geo){
  const morceaux = [];
  let deb = a;
  for(const [t0, t1] of trous.filter(t => t[1] > a && t[0] < b).sort((p, q) => p[0] - q[0])){ if(t0 > deb) morceaux.push([deb, t0]); deb = Math.max(deb, t1); }
  if(deb < b) morceaux.push([deb, b]);
  for(const [u0, u1] of morceaux){
    let u = u0;
    while(u < u1 - .03){
      const l = Math.min(u1 - u, .38 + hasard() * .26), reste = u1 - u - l, ll = reste < .2 ? u1 - u : l, c = u + ll / 2;
      if(le === "x") bloc(g, pierre(), ll - .03, h - .03, .26, c, y, fixe + devant * .02, (hasard() - .5) * .02, geo);
      else bloc(g, pierre(), .26, h - .03, ll - .03, fixe + devant * .02, y, c, (hasard() - .5) * .02, geo);
      u += ll;
    }
  }
}
function murs(g){
  for(let r = 0; r < 5; r++){
    const y0 = r * RANG, y = y0 + RANG / 2, trous = [];
    if(y0 < ARC.y) trous.push([PORTE_X - ARC.r, PORTE_X + ARC.r]);                              // la porte
    else { const dy = y - ARC.y, w = ARC.r + .22 > dy ? Math.sqrt(Math.max(0, (ARC.r + .22) ** 2 - dy * dy)) : 0; if(w) trous.push([PORTE_X - w, PORTE_X + w]); }   // l'arc et ses claveaux
    if(y0 + RANG > .78 && y0 < 1.28) trous.push([-.2, .22]);                                   // la fenêtre
    rang(g, X0 + .1, X1 - .1, trous, y, RANG, FACADE, "x", 1, BLOC);
    rang(g, Z0 + .1, FACADE - .1, [], y, RANG, X1, "z", 1, BLOC_L);                              // le côté droit
    rang(g, Z0 + .1, FACADE - .1, [], y, RANG, X0, "z", -1, BLOC_L);                             // le côté gauche, sous l'appentis
  }
  boite(g, PIERRE_S, X1 - X0 - .2, HM, Z0 - FACADE + 3, CX, HM / 2, (Z0 + FACADE) / 2);         // le coeur, qui comble les joints
  for(const x of [X0, X1]) for(let r = 0; r < 5; r++) bloc(g, pierre(), .3, RANG - .02, .3, x, (r + .5) * RANG, FACADE, 0);   // les coins
  /* les claveaux de l'arc, autour du haut de la porte */
  for(let k = 0; k <= 6; k++){ const a = Math.PI * k / 6, r = ARC.r + .1, m = bloc(g, PIERRE[k % 4], .2, .28, .28, ARC.x + Math.cos(a) * r, ARC.y + Math.sin(a) * r, FACADE + .03);
    m.rotation.z = a - Math.PI / 2; }
  /* la fenêtre : son cadre de bois, ses croisillons, sa vitre allumée, son appui */
  const fx = .01, fy = 1.03;
  ajoute(g, part(G.box, VITRE, .36, .4, .04, fx, fy, FACADE - .04));
  for(const [w, h, x, y] of [[.44, .06, 0, .22], [.44, .06, 0, -.22], [.06, .44, -.2, 0], [.06, .44, .2, 0], [.04, .4, 0, 0], [.4, .04, 0, 0]]) boite(g, FONCE, w, h, .07, fx + x, fy + y, FACADE + .01);
  boite(g, BOIS[1], .56, .07, .16, fx, fy - .27, FACADE + .06);
}
/* le pignon de devant à colombages : la sablière, le poinçon, les croix de bois, les planches ; le pignon de derrière */
function pignons(g){
  const W = X1 - X0;
  for(const [z, devant] of [[FACADE + .02, true], [Z0, false]]){
    boite(g, FONCE, W + .2, .16, .16, CX, HM + .08, z + (devant ? .04 : 0));
    const n = Math.round(W / .24), l = W / n;
    for(let k = 0; k < n; k++){ const x = X0 + (k + .5) * l, h = HR * (1 - Math.abs(x - CX) / (W / 2 + .05)) - .03;
      if(h > .04) boite(g, ton(k), l - .02, h, .08, x, HM + .16 + h / 2, z); }
    if(!devant) continue;
    boite(g, FONCE, .14, HR - .05, .1, CX, HM + .16 + (HR - .05) / 2, z + .06);                  // le poinçon
    for(const s of [-1, 1]){                                                                    // les croix, de chaque côté
      const cx = CX + s * W * .26, h = HR * .5, L = Math.hypot(W * .24, h);
      for(const d of [-1, 1]) planche(g, FONCE, .1, L, .06, cx, HM + .16 + h / 2 + .03, z + .07, 0, 0, d * Math.atan2(W * .24, h));
    }
  }
}
/* le toit : sur chaque pente, de larges planches cloutées qui descendent du faîte, la poutre de faîte et ses blocs */
function toit(g){
  const W = X1 - X0, a = Math.atan2(HR, W / 2), demi = W / 2 + .2, L = demi / Math.cos(a), z0 = Z0 - .25, z1 = FACADE + .35, sommet = HM + .16 + HR + .04;
  for(const s of [-1, 1]){
    const np = 7, wp = (z1 - z0) / np;
    for(let k = 0; k < np; k++){
      const z = z0 + (k + .5) * wp, decal = (k % 2) * .04;
      planche(g, ton(k + (s > 0 ? 1 : 0)), L + decal, .1, wp - .03, CX + s * Math.cos(a) * (L / 2), sommet - Math.sin(a) * (L / 2) + .02, z, 0, 0, -s * a);
      if(k % 2 === 0) ajoute(g, part(G.head, CLOU, .07, .04, .07, CX + s * Math.cos(a) * L * .55, sommet - Math.sin(a) * L * .55 + .09, z));
    }
  }
  boite(g, FONCE, .24, .22, z1 - z0 + .12, CX, sommet + .07, (z0 + z1) / 2);                       // la poutre de faîte
  for(const z of [z0 - .04, z1 + .04]){ boite(g, CLAIR, .32, .3, .2, CX, sommet + .06, z);         // ses deux blocs, cloutés
    ajoute(g, part(G.head, CLOU, .1, .1, .05, CX, sommet + .08, z + (z > 0 ? .1 : -.1))); }
  g.userData.toit = sommet + .25;
}
/* la cheminée de pierre, derrière à droite, et sa petite fumée douce qui monte et s'efface */
function cheminee(g){
  const x = 1.62, z = -1.05, e = .5;
  for(let r = 0; r < 5; r++){ const y = 1.75 + r * .3;
    for(const [dx, dz, w, d] of [[-e / 4, 0, e / 2 - .02, e], [e / 4, 0, e / 2 - .02, e]]) bloc(g, pierre(), r % 2 ? d : w, .28, r % 2 ? w : d, x + (r % 2 ? 0 : dx), y + .15, z + (r % 2 ? dx : 0), 0, BLOC_L); }
  bloc(g, PIERRE[2], e + .1, .12, e + .1, x, 3.32, z);
  boite(g, 0x3A3430, e - .2, .05, e - .2, x, 3.39, z);
  const puffs = new THREE.InstancedMesh(G.head, FUMEE, 5), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();
  puffs.castShadow = false; puffs.receiveShadow = false; puffs.frustumCulled = false; puffs.renderOrder = 3;
  const bouge = () => {
    const t = VENT.temps.value;
    for(let k = 0; k < 5; k++){
      const tt = (t * .11 + k / 5) % 1, r = (.5 + tt * 1.3) * Math.min(1, (1 - tt) * 3.5);
      p.set(x + Math.sin(t * .7 + k * 1.3) * .08 + tt * .35, 3.48 + tt * 1.5, z + Math.cos(t * .5 + k) * .06); s.set(r, r * .85, r);
      puffs.setMatrixAt(k, m.compose(p, q, s));
    }
    puffs.instanceMatrix.needsUpdate = true;
  };
  bouge(); puffs.onBeforeRender = bouge; g.add(puffs);
}
/* la porte : cinq planches debout, son haut en arc, deux pentures de fer et leurs clous, l'anneau ; les marches de pierre */
function porte(g){
  const z = FACADE + .02, w = 2 * ARC.r - .04;
  for(let k = 0; k < 5; k++){ const x = PORTE_X - w / 2 + (k + .5) * w / 5, dx = x - PORTE_X, haut = ARC.y + Math.sqrt(Math.max(0, (ARC.r - .02) ** 2 - dx * dx)) - .03;
    boite(g, k % 2 ? PORTE_C : 0x9A522A, w / 5 - .015, haut - .04, .06, x, (haut + .04) / 2, z); }
  for(const y of [.35, 1.12]){ boite(g, FER, w * .8, .08, .03, PORTE_X - .04, y, z + .05);
    for(const x of [-.3, -.08, .14]) ajoute(g, part(G.head, CLOU, .045, .045, .03, PORTE_X + x, y, z + .07));
    planche(g, FER, .1, .14, .03, PORTE_X + w * .4, y, z + .05, 0, 0, Math.PI / 4); }
  ajoute(g, part(G.tore, FER, .2, .2, .3, PORTE_X + .28, .72, z + .07));
  ajoute(g, part(G.cyl, FER, .08, .03, .08, PORTE_X + .28, .81, z + .05)).rotation.x = Math.PI / 2;
  bloc(g, PIERRE[2], 1.2, .16, .44, PORTE_X, .08, FACADE + .36); bloc(g, PIERRE[0], 1.05, .14, .3, PORTE_X + .04, .2, FACADE + .2);
}
/* à droite de la porte : la potence de bois et la lanterne de fer qui pend, qui brille la nuit */
function lanterneForge(g){
  const x = 1.9, y = 1.28, z = FACADE + .05;
  boite(g, FONCE, .1, .1, .4, x, y + .38, z + .17);
  planche(g, FONCE, .06, .32, .06, x, y + .23, z + .07, .7, 0, 0);
  boite(g, FER, .03, .12, .03, x, y + .27, z + .33);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .17, z + .33)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .33));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .33 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .33);
}
/* l'appentis, à gauche : son mur de pierre au fond, ses poteaux et leurs jambes de force, son toit de planches qui descend
   vers la gauche ; dessous, le foyer et ses braises, sa hotte de fer, les pinces au mur */
const A0 = -2.4, AZ0 = -.05, AZ1 = 1.25;
function appentis(g){
  /* le mur du fond, jusque sous le toit seulement (avant, il le traversait) */
  for(let r = 0; r < 4; r++){ const y = (r + .5) * .3; rang(g, A0 + .12, X0 - .1, [], y, .3, AZ0, "x", 1, BLOC_L); }
  boite(g, PIERRE_S, X0 - A0 - .2, 1.3, .14, (A0 + X0) / 2, .65, AZ0 - .05);
  const hHaut = 1.85, hBas = 1.4, a = Math.atan2(hHaut - hBas, X0 - A0), L = (X0 - A0 + .04) / Math.cos(a);
  for(const z of [AZ0 + .1, AZ1 - .12]){ boite(g, FONCE, .16, hBas, .16, A0 + .08, hBas / 2, z);   // les poteaux
    planche(g, FONCE, .08, .55, .08, A0 + .3, hBas - .25, z, 0, 0, -.8); }                       // leurs jambes de force
  boite(g, FONCE, .14, .16, AZ1 - AZ0 + .1, A0 + .08, hBas, (AZ0 + AZ1) / 2);                     // la panne
  const np = 4, wp = (AZ1 - AZ0 + .3) / np;
  for(let k = 0; k < np; k++){ const z = AZ0 - .05 + (k + .5) * wp;
    planche(g, ton(k + 2), L + (k % 2) * .04, .1, wp - .03, (A0 + X0) / 2 + .02, (hHaut + hBas) / 2 + .1, z, 0, 0, a);
    if(k % 2) ajoute(g, part(G.head, CLOU, .07, .04, .07, (A0 + X0) / 2 - .4, (hHaut + hBas) / 2 + .1 + Math.tan(a) * .35 + .07, z)); }
  /* le foyer : son socle de pierre, l'ouverture du cendrier, la cuve aux braises, ses joues et son fond qui rougeoie */
  const fx = -1.42, fz = .38, fw = 1.15, fd = .7;
  for(let r = 0; r < 2; r++) for(const [dx, w] of [[-.4, .36], [0, .4], [.4, .36]]){
    if(r === 0 && dx === 0) continue;
    bloc(g, pierre(), w - .03, .3, fd, fx + dx, .15 + r * .32, fz, 0, BLOC_L); }
  boite(g, 0x3A3430, .36, .26, .05, fx, .15, fz + fd / 2 - .04);                                 // le cendrier, dans l'ombre
  for(const dx of [-fw / 2 + .1, fw / 2 - .1]) bloc(g, pierre(), .2, .5, fd, fx + dx, .9, fz, 0, BLOC_L);   // les joues
  bloc(g, PIERRE[1], fw, .44, .2, fx, .86, AZ0 + .12, 0, BLOC_L);                                 // le fond
  /* le feu, comme l'image : un lit de cendres, des braises qui rougeoient en petits morceaux, des charbons noirs, et de petites
     flammes qui dansent au-dessus (au temps du vent) */
  boite(g, 0x3A3430, fw - .36, .06, fd - .16, fx, .78, fz - .02);                                 // le lit de cendres, dans la cuve
  boite(g, 0x4A3A32, fw - .45, .28, .04, fx, .92, AZ0 + .24);                                     // le fond, noirci par le feu
  for(let k = 0; k < 16; k++){ const s = .06 + hasard() * .05, noir = k % 4 === 3;              // les braises et les charbons
    const c = ajoute(g, part(CAILLOU, noir ? 0x2E2A28 : BRAISE, s * 1.3, s, s * 1.2, fx - .3 + hasard() * .6, .82 + s * .3, fz - .24 + hasard() * .38)); c.rotation.set(hasard() * 3, hasard() * 3, 0); }
  { const L = [[-.14, -.05, .32], [.05, .02, .42], [.2, -.1, .28], [-.02, -.16, .24]], fl = new THREE.InstancedMesh(LANGUE, FLAMME, L.length);   // à part : elles bougent
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    fl.castShadow = false; fl.receiveShadow = false;
    const danse = () => { const t = VENT.temps.value;
      L.forEach(([dx, dz, h], k) => { const hk = h * (1 + Math.sin(t * 7 + k * 1.7) * .18); fl.setMatrixAt(k, m.compose(p.set(fx + dx, .86 + hk / 2, fz + dz), q, sc.set(.1, hk, .1))); });
      fl.instanceMatrix.needsUpdate = true; };
    danse(); fl.onBeforeRender = danse; g.add(fl); }
  /* la hotte de fer, et son conduit qui monte sous le toit */
  const hotte = ajoute(g, part(G.cone4, FER, fw * 1.25, .42, fd * 1.35, fx, 1.48, fz - .05)); hotte.rotation.y = Math.PI / 4;
  boite(g, 0x5A5A62, fw * .9, .08, fd * .95, fx, 1.27, fz - .05);
  boite(g, FER, .2, .72, .2, fx, 1.92, fz - .12);                                                // le conduit, qui sort du toit
  boite(g, FER, .28, .06, .28, fx, 2.28, fz - .12);
  /* les pinces, accrochées au mur du fond, à droite du foyer */
  boite(g, FER, .36, .04, .04, -.68, 1.42, AZ0 + .12);
  for(const dx of [-.08, .08]){ const x = -.68 + dx;
    for(const s of [-1, 1]) planche(g, FER, .03, .46, .03, x + s * .025, 1.18, AZ0 + .14, 0, 0, s * .06);
    ajoute(g, part(G.tore, FER, .07, .07, .4, x, 1.4, AZ0 + .14)); }
}
/* devant : l'enclume sur sa bûche cerclée de fer */
function enclume(g){
  const x = -.72, z = 1.78;
  ajoute(g, part(G.cyl, BOIS[2], .66, .5, .66, x, .25, z));
  for(let k = 0; k < 10; k++){ const an = k / 10 * Math.PI * 2;                                   // les fentes de la bûche
    boite(g, FONCE, .03, .46, .02, x + Math.sin(an) * .33, .25, z + Math.cos(an) * .33).rotation.y = an; }
  const bague = ajoute(g, part(G.tore, FER, .72, .72, 1.2, x, .07, z)); bague.rotation.x = Math.PI / 2;
  for(let k = 0; k < 6; k++){ const an = k / 6 * Math.PI * 2 + .3; ajoute(g, part(G.head, CLOU, .06, .06, .06, x + Math.sin(an) * .37, .08, z + Math.cos(an) * .37)); }
  boite(g, 0x5A5A62, .32, .08, .28, x, .54, z);                                                    // le pied
  boite(g, FER, .2, .14, .18, x, .65, z);                                                          // la taille
  boite(g, 0x5E5E66, .5, .16, .26, x + .04, .8, z);                                                // la table
  const bec = ajoute(g, part(G.cone, 0x5E5E66, .2, .34, .2, x - .37, .82, z)); bec.rotation.z = Math.PI / 2; bec.scale.set(.2, .34, .14);
}
/* le tonneau de douelles cerclé de fer, son couvercle, deux lingots dessus */
function tonneau(g){
  const x = .08, z = 1.82, r = .25, h = .56;
  for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2;
    planche(g, ton(k), .14, h, .05, x + Math.sin(an) * r, h / 2 + .02, z + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .04, .04, r * 2 - .04, x, h - .02, z));
  for(const y of [.1, .46]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, x, y, z)); c.rotation.x = Math.PI / 2; }
  for(const s of [-1, 1]) ajoute(g, part(G.tore, FER, .14, .14, .5, x + s * (r + .02), .38, z)).rotation.y = Math.PI / 2;
  boite(g, 0x6E6E76, .22, .07, .12, x - .02, h + .05, z - .04);
  boite(g, 0x7A7A82, .2, .07, .11, x + .02, h + .12, z - .02).rotation.y = .3;
}
/* la meule à aiguiser : son chevalet de bois, la pierre ronde, l'axe et la manivelle de fer */
function meule(g){
  const x = -1.85, z = 1.85, y = .62;
  for(const dx of [-.22, .22]) for(const dz of [-.18, .18]) planche(g, FONCE, .07, .58, .07, x + dx, .29, z + dz, dz * .4, 0, -dx * .4);
  for(const dz of [-.18, .18]) boite(g, BOIS[1], .58, .07, .07, x, .52, z + dz);
  for(const dx of [-.22, .22]) boite(g, BOIS[0], .07, .07, .44, x + dx, .3, z);
  ajoute(g, part(ROND, 0xC9BBA6, .62, .12, .62, x, y + .1, z)).rotation.x = Math.PI / 2;      // la pierre, face à l'avant
  ajoute(g, part(G.cyl, FER, .1, .16, .1, x, y + .1, z)).rotation.x = Math.PI / 2;
  const axe = ajoute(g, part(G.cyl, FER, .04, .5, .04, x, y + .1, z + .1)); axe.rotation.x = Math.PI / 2;
  boite(g, FER, .04, .24, .04, x, y, z + .34);                                                    // la manivelle
  boite(g, FER, .04, .04, .14, x, y - .1, z + .4);
}
/* le sol : la plaque de sable, des dalles, des cailloux, des rochers aux coins, quelques touffes d'herbe */
function sol(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 2.2, .052, 1.6, -1.4, .027, .9)); s.receiveShadow = true; s.castShadow = false;
  for(const [x, z, w, d, ry] of [[-1.3, 2.25, .5, .34, .1], [-.75, 2.35, .4, .3, -.2], [-1.85, 1.1, .44, .32, .2], [-.55, .95, .46, .3, 0], [.45, 2.25, .36, .26, .3], [1.5, 2.2, .44, .3, -.1]])
    bloc(g, PIERRE[Math.floor(hasard() * 4)], w, .06, d, x, .04, z, ry, BLOC_L);
  for(let k = 0; k < 22; k++){
    const x = -2.3 + hasard() * 4.6, z = 1.3 + hasard() * 1.15;
    if(Math.abs(x - PORTE_X) < .7) continue;                                                       // le passage devant la porte reste libre
    const c = .05 + hasard() * .07, p = ajoute(g, part(CAILLOU, PIERRE[k % 4], c * 1.3, c, c * 1.2, x, c * .4, z)); p.rotation.set(hasard() * 3, hasard() * 3, 0);
  }
  for(const [x, z, sx, sy, sz] of [[-2.2, -.35, .55, .7, .6], [2.22, .7, .45, .55, .55], [2.2, -.6, .5, .75, .6], [2.25, 1.55, .35, .3, .35]]){
    const r = ajoute(g, part(CAILLOU, PIERRE[Math.floor(hasard() * 4)], sx, sy, sz, x, sy * .38, z)); r.rotation.set(hasard(), hasard() * 3, 0); }
  for(const [x, z] of [[-2.38, .25], [2.32, 2.0], [.5, 2.4]]){                                       // les touffes d'herbe, à même le sable
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function forgeNiveau1(g){
  alea = 7;
  sol(g);
  murs(g);
  pignons(g);
  toit(g);
  cheminee(g);
  porte(g);
  lanterneForge(g);
  appentis(g);
  enclume(g);
  tonneau(g);
  meule(g);
}

/* ================= La Forge, niveau 2 =================
   D'après l'image de Yo (13 novembre 2026 : « Voici la forge niveau 2 » ; « le marteau a 2 embouts en métal, j'en veux qu'un
   seul »), au plus près de l'image : la même place (5 × 5), la porte au même endroit. La maison de grosses pierres grises
   jointives, ses poteaux de bois aux coins ; la porte de planches en arc sous ses claveaux clairs, ses deux pentures cloutées,
   son anneau, ses deux marches ; la fenêtre allumée à croisillons en losanges ; la lanterne sur sa potence ; le toit de
   grosses ardoises gris-bleu qui descend devant et derrière, ses pignons de planches sur les côtés, la poutre de faîte ronde
   cerclée de fer et ses deux bouts de rondin. À gauche, l'appentis : son toit d'ardoises qui descend vers la gauche, sa
   poutre et son poteau, la jambe de force ; dessous, le grand foyer de pierre en arc, ses braises et ses flammes (elles
   rougeoient plus fort la nuit) ; au-dessus, la haute cheminée de pierres grises et sa petite fumée douce. Devant : l'enclume
   sur sa souche, le marteau (une seule tête de fer, en haut) appuyé contre elle, le seau cerclé de fer plein d'eau ; la
   plaque de sable, des cailloux, des touffes d'herbe (sans tas de terre). Pas de meule ni de lingots : ils ne sont pas sur
   l'image. Toutes les pierres se touchent, leur cœur de leur couleur (Yo : pas de trous entre les pierres). */
const GRIS = [0x9C9AA0, 0x8E8C94, 0xA8A6AC, 0x96949A], GRIS_C = 0x8A888E, CLAVEAU = [0xC9BBA6, 0xD4C6B0, 0xBFB09A],
  ARDOISE = [0x5C6072, 0x666A7C, 0x545868, 0x6E7284], ARDOISE_F = 0x4C5060, EAU = 0x5FB2D2;
const H2 = {HM: 1.75, HR: .95};
/* un rang de pierres grises, comme rang() mais de la palette grise */
function rangGris(g, a, b, trous, y, h, fixe, le, devant, geo = BLOC_L){
  const avant = PAL; PAL = GRIS; rang(g, a, b, trous, y, h, fixe, le, devant, geo); PAL = avant;
}
const gris = () => GRIS[Math.floor(hasard() * 4)];
/* une petite fumée douce, au-dessus de (x, y, z) */
function fumee(g, x, y, z){
  const puffs = new THREE.InstancedMesh(G.head, FUMEE, 5), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion();
  puffs.castShadow = false; puffs.receiveShadow = false; puffs.frustumCulled = false; puffs.renderOrder = 3;
  const bouge = () => {
    const t = VENT.temps.value;
    for(let k = 0; k < 5; k++){
      const tt = (t * .11 + k / 5) % 1, r = (.5 + tt * 1.3) * Math.min(1, (1 - tt) * 3.5);
      p.set(x + Math.sin(t * .7 + k * 1.3) * .08 + tt * .35, y + tt * 1.5, z + Math.cos(t * .5 + k) * .06); s.set(r, r * .85, r);
      puffs.setMatrixAt(k, m.compose(p, q, s));
    }
    puffs.instanceMatrix.needsUpdate = true;
  };
  bouge(); puffs.onBeforeRender = bouge; g.add(puffs);
}
/* la maison : ses murs de pierres grises, la porte et la fenêtre, les poteaux aux coins */
function murs2(g){
  const {HM} = H2, n = 6, h = HM / n;
  for(let r = 0; r < n; r++){
    const y0 = r * h, y = y0 + h / 2, trous = [];
    if(y0 < ARC.y) trous.push([PORTE_X - ARC.r, PORTE_X + ARC.r]);
    else { const dy = y - ARC.y, w = ARC.r + .22 > dy ? Math.sqrt(Math.max(0, (ARC.r + .22) ** 2 - dy * dy)) : 0; if(w) trous.push([PORTE_X - w, PORTE_X + w]); }
    if(y0 + h > .78 && y0 < 1.34) trous.push([-.24, .3]);                                       // la fenêtre
    rangGris(g, X0 + .12, X1 - .12, trous, y, h, FACADE, "x", 1, BLOC);
    rangGris(g, X0 + .12, X1 - .12, [], y, h, Z0, "x", -1);                                    // le mur de derrière
    rangGris(g, Z0 + .1, FACADE - .1, [], y, h, X1, "z", 1);                                   // le côté droit
    rangGris(g, Z0 + .1, FACADE - .1, [], y, h, X0, "z", -1);                                  // le côté gauche
  }
  boite(g, GRIS_C, X1 - X0 - .1, HM, FACADE - Z0 - .1, CX, HM / 2, (Z0 + FACADE) / 2);          // le cœur, de la couleur des pierres
  /* les claveaux clairs de l'arc, autour du haut de la porte, et ses montants */
  for(let k = 0; k <= 8; k++){ const a = Math.PI * k / 8, r = ARC.r + .1, m = bloc(g, CLAVEAU[k % 3], .21, .22, .3, ARC.x + Math.cos(a) * r, ARC.y + Math.sin(a) * r, FACADE + .04);
    m.rotation.z = a - Math.PI / 2; }
  for(const s of [-1, 1]) for(let k = 0; k < 3; k++) bloc(g, CLAVEAU[(k + 1) % 3], .2, .31, .3, PORTE_X + s * (ARC.r + .1), .17 + k * .32, FACADE + .04);
  /* les poteaux de bois aux coins de la façade, sur leur pierre ; la sablière en haut */
  for(const x of [X0 + .02, X1 - .02]){ bloc(g, gris(), .34, .5, .34, x, .25, FACADE + .02); boite(g, FONCE, .22, HM - .5, .22, x, .5 + (HM - .5) / 2, FACADE + .06); }
  for(const z of [FACADE + .06, Z0 - .02]) boite(g, FONCE, X1 - X0 + .3, .2, .2, CX, HM + .02, z);
  for(const x of [X0 - .02, X1 + .02]) boite(g, FONCE, .2, .2, FACADE - Z0 + .2, x, HM + .02, (Z0 + FACADE) / 2);
  /* la fenêtre : son cadre de bois épais, sa vitre allumée, ses croisillons en losanges, son appui */
  const fx = .03, fy = 1.06, s = .2;
  ajoute(g, part(G.box, VITRE, .4, .44, .04, fx, fy, FACADE - .03));
  for(const c of [-.13, 0, .13]) for(const d of [-1, 1]){ const L = Math.SQRT2 * (2 * s - Math.abs(c)) * .9;
    if(L > .05) planche(g, FONCE, .03, L, .03, fx + c / 2, fy - d * c / 2, FACADE - .005, 0, 0, d * Math.PI / 4); }
  for(const [w, hh, x, y] of [[.56, .08, 0, .26], [.56, .08, 0, -.26], [.08, .6, -.25, 0], [.08, .6, .25, 0]]) boite(g, BOIS[0], w, hh, .1, fx + x, fy + y, FACADE + .03);
  boite(g, BOIS[1], .66, .08, .18, fx, fy - .32, FACADE + .07);
}
/* les pignons de planches, sur les côtés, sous le toit */
function pignons2(g){
  const {HM, HR} = H2, D = (FACADE - Z0) / 2, ZC = (Z0 + FACADE) / 2, n = Math.round((FACADE - Z0) / .24), l = (FACADE - Z0) / n;
  for(const x of [X0 - .01, X1 + .01]) for(let k = 0; k < n; k++){ const z = Z0 + (k + .5) * l, hh = HR * (1 - Math.abs(z - ZC) / (D + .05)) - .03;
    if(hh > .04) boite(g, ton(k), .08, hh, l - .02, x, HM + .12 + hh / 2, z); }
}
/* des ardoises en rangs qui se chevauchent sur un pan : du haut (h0) vers le bas, d et n dans le plan de coupe ; u le long du
   pan (de u0 à u1), dans la direction e ; sauf(p) : ne pas en poser là (la cheminée) */
function ardoises(g, haut, d, n, e, u0, u1, L, sauf = () => false, larg = .62){
  const rangs = Math.max(2, Math.round(L / .4)),   /* de grosses ardoises, peu nombreuses, comme l'image */ lr = L / rangs, rot = new THREE.Matrix4().makeBasis(e, n, d), q = new THREE.Quaternion().setFromRotationMatrix(rot);
  for(let r = 0; r < rangs; r++){
    const t = (r + .55) * lr, dec = r % 2 ? larg / 2 : 0;
    for(let k = -1; ; k++){
      let a = u0 + k * larg + dec, b = a + larg; if(a >= u1) break;
      a = Math.max(a, u0); b = Math.min(b, u1); if(b - a < .06) continue;
      const p = haut.clone().addScaledVector(d, t).addScaledVector(n, .05 + r * .004).addScaledVector(e, (a + b) / 2);
      if(sauf(p)) continue;
      const m = ajoute(g, part(BLOC_L, ARDOISE[(r * 7 + k * 3 + 8) % 4], b - a - .03, .09, lr * 1.35, p.x, p.y, p.z)); m.quaternion.copy(q);
      m.rotateX(.06);                                                                        // le bas de chaque ardoise un peu relevé
    }
  }
}
/* le grand toit d'ardoises, qui descend devant et derrière ; la poutre de faîte ronde, ses bagues de fer, ses bouts de rondin */
function toit2(g){
  const {HM, HR} = H2, D = (FACADE - Z0) / 2, ZC = (Z0 + FACADE) / 2, a = Math.atan2(HR, D), L = (D + .32) / Math.cos(a), sommet = HM + .12 + HR;
  const xa = X0 - .3, xb = X1 + .3, V = (x, y, z) => new THREE.Vector3(x, y, z);
  for(const s of [-1, 1]){
    const d = V(0, -Math.sin(a), s * Math.cos(a)), n = V(0, Math.cos(a), s * Math.sin(a)), haut = V(0, sommet, ZC);
    const c = haut.clone().addScaledVector(d, L / 2).addScaledVector(n, -.02);
    planche(g, ARDOISE_F, xb - xa, .06, L, CX, c.y, c.z, s * a, 0, 0);                          // le fond, presque de la couleur des ardoises
    ardoises(g, haut, d, n, V(1, 0, 0), xa, xb, L);
    for(const x of [xa - .02, xb + .02]) planche(g, BOIS[0], .1, .16, L + .04, x, c.y + .07, c.z, s * a, 0, 0);   // les planches de rive
  }
  const r = ajoute(g, part(G.cyl, BOIS[1], .3, xb - xa + .24, .3, CX, sommet + .1, ZC)); r.rotation.z = Math.PI / 2;
  for(const x of [xa - .12, xb + .12]){ const b = ajoute(g, part(G.cyl, CLAIR, .32, .06, .32, x, sommet + .1, ZC)); b.rotation.z = Math.PI / 2;
    const c = ajoute(g, part(G.cyl, BOIS[2], .16, .065, .16, x, sommet + .1, ZC)); c.rotation.z = Math.PI / 2; }
  for(const x of [X0 + .25, X1 - .25]){ const b = ajoute(g, part(G.cyl, FER, .33, .1, .33, x, sommet + .1, ZC)); b.rotation.z = Math.PI / 2;
    ajoute(g, part(G.head, CLOU, .06, .06, .06, x, sommet + .27, ZC)); }
  g.userData.toit = sommet + .3;
}
/* l'appentis à gauche : son toit d'ardoises qui descend vers la gauche, ses poteaux, sa poutre de devant, la jambe de force ;
   dessous, le grand foyer de pierre en arc ; au-dessus, la haute cheminée qui fume */
const L2 = {A0: -2.35, Z0: -.75, Z1: 1.42, haut: 2.0, bas: 1.45, HX0: -2.1, HZ: 1.0, HH: 1.45, ox: -1.33, ow: .42, seuil: .42, nais: .85, cx: -1.4, cz: .05};
function appentis2(g){
  const {A0, haut, bas} = L2, b = Math.atan2(haut - bas, X0 - A0), Lr = (X0 - A0 + .22) / Math.cos(b), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const d = V(-Math.cos(b), -Math.sin(b), 0), n = V(-Math.sin(b), Math.cos(b), 0), h0 = V(X0, haut + .1, 0);
  const c = h0.clone().addScaledVector(d, Lr / 2).addScaledVector(n, -.02), zc = (L2.Z0 + L2.Z1) / 2;
  planche(g, ARDOISE_F, Lr, .06, L2.Z1 - L2.Z0, c.x, c.y, zc, 0, 0, b);
  const ch = .5;                                                                                // la demi-largeur de la cheminée, à sa base
  ardoises(g, h0, d, n, V(0, 0, 1), L2.Z0, L2.Z1, Lr, p => Math.abs(p.x - L2.cx) < ch + .15 && Math.abs(p.z - L2.cz) < ch + .15, .56);
  for(const z of [L2.Z0 - .02, L2.Z1 + .02]) planche(g, BOIS[0], Lr + .04, .16, .1, c.x, c.y + .07, z, 0, 0, b);   // les planches de rive
  /* les poteaux, la poutre de devant (sous le toit), la panne au bout, les jambes de force */
  for(const z of [L2.Z0 + .14, L2.Z1 - .14]){ bloc(g, gris(), .3, .22, .3, A0 + .14, .11, z); boite(g, FONCE, .2, bas - .2, .2, A0 + .14, .2 + (bas - .2) / 2, z); }
  boite(g, FONCE, .18, .2, L2.Z1 - L2.Z0, A0 + .14, bas + .02, zc);
  const yb = (x) => bas + (x - A0) * Math.tan(b) - .14;
  planche(g, BOIS[1], (X0 - A0) / Math.cos(b), .22, .2, (A0 + X0) / 2, yb((A0 + X0) / 2), L2.Z1 - .14, 0, 0, b);   // la poutre de devant
  ajoute(g, part(G.head, CLOU, .1, .1, .06, A0 + .45, yb(A0 + .45), L2.Z1 - .02));
  planche(g, FONCE, .12, .7, .12, A0 + .38, bas - .3, L2.Z1 - .14, 0, 0, -.75);                  // la jambe de force
  /* le grand foyer : un massif de pierres grises, son ouverture en arc, ses claveaux */
  const {HX0, HZ, HH, ox, ow, seuil, nais} = L2, HX1 = X0 - .13, zb = L2.Z0 + .1, R = ow + .17;
  boite(g, GRIS_C, HX1 - HX0, HH, HZ - .4 - zb, (HX0 + HX1) / 2, HH / 2, (zb + HZ - .4) / 2);     // le cœur, derrière le feu
  for(const [x0, x1] of [[HX0, ox - ow], [ox + ow, HX1]]) boite(g, GRIS_C, x1 - x0, HH, HZ - .06 - zb, (x0 + x1) / 2, HH / 2, (zb + HZ - .06) / 2);
  boite(g, GRIS_C, ow * 2, seuil, HZ - .06 - zb, ox, seuil / 2, (zb + HZ - .06) / 2);              // sous le seuil
  boite(g, GRIS_C, ow * 2, HH - nais - ow, HZ - .06 - zb, ox, nais + ow + (HH - nais - ow) / 2, (zb + HZ - .06) / 2);   // au-dessus de l'arc
  const rangs = [[0, seuil], [seuil, .7], [.7, .98], [.98, 1.22], [1.22, HH]];
  for(const [y0, y1] of rangs){ const y = (y0 + y1) / 2, trous = [];
    if(y0 >= seuil - .01){ if(y < nais) trous.push([ox - ow, ox + ow]); else { const dy = y - nais, w = R > dy ? Math.sqrt(R * R - dy * dy) : 0; if(w) trous.push([ox - w, ox + w]); } }
    rangGris(g, HX0, HX1, trous, y, y1 - y0, HZ, "x", 1, BLOC);
    rangGris(g, zb, HZ - .12, [], y, y1 - y0, HX0, "z", -1); }
  for(let k = 0; k <= 8; k++){ const a = Math.PI * k / 8, r = ow + .09, m = bloc(g, gris(), .2, .2, .3, ox + Math.cos(a) * r, nais + Math.sin(a) * r, HZ + .03);
    m.rotation.z = a - Math.PI / 2; }
  bloc(g, GRIS[2], ow * 2 + .1, .1, .32, ox, seuil - .03, HZ + .05);                              // le seuil
  /* dedans : les joues sombres, le fond qui rougeoie, le lit de cendres, les braises, les flammes qui dansent */
  const zf = HZ - .4;
  for(const s of [-1, 1]) boite(g, 0x3A2A22, .04, nais - seuil + ow * .7, .36, ox + s * (ow - .02), (seuil + nais + ow * .7) / 2, zf + .18);
  boite(g, 0x3A2620, ow * 2 - .04, nais - seuil + ow * .8, .04, ox, (seuil + nais + ow * .8) / 2, zf + .01);   // le fond, noirci (pas un aplat de couleur)
  ajoute(g, part(G.box, BRAISE, ow * 2 - .1, .16, .04, ox, seuil + .1, zf + .03));                 // sa lueur, en bas, derrière les braises
  boite(g, 0x3A3430, ow * 2 - .06, .05, .36, ox, seuil + .03, zf + .2);
  for(let k = 0; k < 18; k++){ const s = .06 + hasard() * .05, noir = k % 4 === 3;
    const cc = ajoute(g, part(CAILLOU, noir ? 0x2E2A28 : BRAISE, s * 1.3, s, s * 1.2, ox - .3 + hasard() * .6, seuil + .06 + s * .3, zf + .06 + hasard() * .26)); cc.rotation.set(hasard() * 3, hasard() * 3, 0); }
  { const F = [[-.24, .14, .26], [-.12, .22, .38], [-.02, .1, .46], [.1, .2, .4], [.22, .12, .3], [.06, .26, .24], [-.18, .26, .2]], fl = new THREE.InstancedMesh(LANGUE, FLAMME, F.length);
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), y0 = seuil + .08;
    fl.castShadow = false; fl.receiveShadow = false;
    const danse = () => { const t = VENT.temps.value;
      F.forEach(([dx, dz, h], k) => { const hk = h * (1 + Math.sin(t * 7 + k * 1.7) * .18); fl.setMatrixAt(k, m.compose(p.set(ox + dx, y0 + hk / 2, zf + dz), q, sc.set(.13, hk, .13))); });
      fl.instanceMatrix.needsUpdate = true; };
    danse(); fl.onBeforeRender = danse; g.add(fl); }
  /* la haute cheminée de pierres grises, plus large en bas, au-dessus du foyer ; sa petite fumée douce */
  const {cx, cz} = L2;
  for(const [y0, y1, e] of [[HH, 2.45, .96], [2.45, 3.35, .66]]){   /* plus large en bas, comme l'image */
    boite(g, GRIS_C, e - .06, y1 - y0, e - .06, cx, (y0 + y1) / 2, cz);
    for(let y = y0, r = 0; y < y1 - .05; y += .3, r++){ const hh = Math.min(.3, y1 - y), yy = y + hh / 2;
      for(const s of [-1, 1]){ bloc(g, gris(), r % 2 ? e : e / 2 - .01, hh - .02, .22, cx + (r % 2 ? 0 : s * e / 4), yy, cz + s * (e / 2 - .09), 0, BLOC_L);
        bloc(g, gris(), .22, hh - .02, r % 2 ? e / 2 - .01 : e - .2, cx + s * (e / 2 - .09), yy, cz + (r % 2 ? s * e / 4 : 0), 0, BLOC_L); } } }
  bloc(g, GRIS[2], .98, .12, .98, cx, 2.48, cz);                                                   // le ressaut
  bloc(g, GRIS[2], .74, .14, .74, cx, 3.4, cz);
  boite(g, 0x2E2A28, .4, .06, .4, cx, 3.45, cz);
  fumee(g, cx, 3.55, cz);
}
/* devant : l'enclume sur sa souche, le marteau appuyé (une seule tête de fer, en haut), le seau cerclé de fer plein d'eau */
function enclume2(g){
  const x = -.78, z = 1.78;
  ajoute(g, part(G.cyl, BOIS[2], .6, .48, .6, x, .24, z));                                        // la souche
  ajoute(g, part(G.cone, BOIS[2], .78, .16, .78, x, .08, z));                                       // son pied, plus large
  ajoute(g, part(G.cyl, CLAIR, .54, .02, .54, x, .485, z));                                         // le bois clair de la coupe
  ajoute(g, part(G.tore, BOIS[0], .34, .34, .3, x, .497, z)).rotation.x = Math.PI / 2;              // un cerne
  for(let k = 0; k < 9; k++){ const an = k / 9 * Math.PI * 2; boite(g, FONCE, .03, .42, .02, x + Math.sin(an) * .3, .23, z + Math.cos(an) * .3).rotation.y = an; }
  boite(g, 0x55545C, .34, .08, .26, x, .53, z); boite(g, FER, .2, .14, .16, x, .64, z);
  boite(g, 0x5E5E66, .52, .16, .25, x + .05, .79, z);
  const bec = ajoute(g, part(G.cone, 0x5E5E66, 1, 1, 1, x - .37, .82, z)); bec.rotation.z = Math.PI / 2; bec.scale.set(.2, .34, .14);
  /* le marteau : le manche posé au sol, appuyé contre la souche ; la tête de fer, en haut, seule */
  const pied = [x + .45, .03, z + .22], tete = [x + .3, .56, z + .22], dx = tete[0] - pied[0], dy = tete[1] - pied[1], L = Math.hypot(dx, dy), th = Math.atan2(-dx, dy);
  planche(g, BOIS[1], .05, L, .05, (pied[0] + tete[0]) / 2, (pied[1] + tete[1]) / 2, pied[2], 0, 0, th);
  planche(g, 0x5A5A62, .11, .11, .26, tete[0] - Math.sin(-th) * .03, tete[1] + .03, tete[2], 0, 0, th);
  /* le seau : ses douelles, son fond, ses deux cercles de fer, plein d'eau */
  const sx = -.02, sz = 1.84, r = .26, h = .4;
  for(let k = 0; k < 12; k++){ const an = k / 12 * Math.PI * 2; planche(g, ton(k), .14, h, .05, sx + Math.sin(an) * r, h / 2 + .02, sz + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2, .04, r * 2, sx, .04, sz));
  for(const y of [.1, .33]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, sx, y, sz)); c.rotation.x = Math.PI / 2; }
  ajoute(g, part(G.cyl, EAU, r * 2 - .05, .03, r * 2 - .05, sx, h - .05, sz)).castShadow = false;
}
/* le sol : la plaque de sable, des cailloux, deux rochers aux coins de derrière, quelques touffes d'herbe */
function sol2(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  for(let k = 0; k < 22; k++){
    const x = -2.3 + hasard() * 4.6, z = 1.45 + hasard() * 1.0;
    if(Math.abs(x - PORTE_X) < .75 || Math.abs(x + .78) < .45 || Math.abs(x + .02) < .35) continue;   // le passage, l'enclume, le seau
    const c = .05 + hasard() * .07, p = ajoute(g, part(CAILLOU, GRIS[k % 4], c * 1.3, c, c * 1.2, x, c * .4, z)); p.rotation.set(hasard() * 3, hasard() * 3, 0);
  }
  for(const [x, z, sx, sy, sz] of [[2.25, -1.2, .45, .55, .5], [2.28, 1.5, .34, .3, .34], [-2.3, 1.95, .3, .26, .3]]){
    const r = ajoute(g, part(CAILLOU, GRIS[Math.floor(hasard() * 4)], sx, sy, sz, x, sy * .38, z)); r.rotation.set(hasard(), hasard() * 3, 0); }
  for(const [x, z] of [[-2.15, 1.7], [2.3, 2.0], [-.3, 2.3], [1.8, 1.9]]){
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function forgeNiveau2(g){
  alea = 11; PAL = PIERRE;
  sol2(g);
  murs2(g);
  pignons2(g);
  toit2(g);
  porte(g);
  lanterneForge(g);
  appentis2(g);
  enclume2(g);
}
