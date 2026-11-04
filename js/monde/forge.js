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
for(const m of [LUEUR, VITRE, BRAISE]) lanterne(null, 0, 0, m);
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
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

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
  for(let r = 0; r < 6; r++){ const y = (r + .5) * .3; rang(g, A0 + .12, X0 - .1, [], y, .3, AZ0, "x", 1, BLOC_L); }   // le mur du fond
  boite(g, PIERRE_S, X0 - A0 - .2, 1.9, .14, (A0 + X0) / 2, .95, AZ0 - .05);
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
  ajoute(g, part(G.box, BRAISE, fw - .45, .28, .04, fx, .92, AZ0 + .24));                           // le fond qui rougeoie
  ajoute(g, part(G.head, BRAISE, 2.0, .6, 1.4, fx, .64, fz - .05));                             // le tas de braises, qui rougeoie
  for(let k = 0; k < 6; k++){ const s = .08 + hasard() * .06;                                    // quelques charbons dessus
    const c = ajoute(g, part(CAILLOU, 0x2E2A28, s * 1.3, s, s * 1.2, fx - .28 + hasard() * .56, .78 + s * .2, fz - .2 + hasard() * .3)); c.rotation.set(hasard() * 3, hasard() * 3, 0); }
  /* la hotte de fer, et son conduit qui monte sous le toit */
  const hotte = ajoute(g, part(G.cone4, FER, fw * 1.25, .42, fd * 1.35, fx, 1.48, fz - .05)); hotte.rotation.y = Math.PI / 4;
  boite(g, 0x5A5A62, fw * .9, .08, fd * .95, fx, 1.27, fz - .05);
  boite(g, FER, .24, .3, .24, fx, 1.74, fz - .12);
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
