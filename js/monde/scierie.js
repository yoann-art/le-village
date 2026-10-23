/* ================= La Scierie, niveau 1 (et plus bas, le niveau 2) =================
   D'après l'image de Yo (22 octobre 2026 ; étape 2.2), au plus près de l'image, ses défauts corrigés et ce qui manquait
   ajouté (choix de Yo) : une cabane de bois couleur miel sur un carré de 4 × 4 cases, le pignon tourné vers l'avant ;
   des murs de planches posées à l'horizontale entre de gros poteaux d'angle ; un toit de larges planches qui se
   chevauchent en deux rangs, son faîte rond et ses deux blocs ; dans le pignon, des planches debout, une lanterne de fer
   sur sa potence et une petite lucarne ronde (ajoutée) ; la porte de planches, ses pentures de fer et son anneau, sur
   une marche ; une fenêtre à croisillons, et une deuxième sur le côté (ajoutée) ; à droite, un appentis d'aplomb sur
   deux poteaux, des planches debout à l'abri ; devant à gauche, une pile de rondins ; devant à droite, deux tréteaux et
   la grande scie à deux poignées bien posée dessus (sur l'image elle flottait).
   Coordonnées : le milieu du carré en (0, 0), la façade de devant en z = FACADE (B.scierie.front), la porte en x = −0,5. */
import { P, G, part, toon, VENT, fusionner, rassembler } from "./formes.js";
import { VITRE } from "./ciel.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const FACADE = 1.15;
const MIEL = [0xD48E42, 0xE0A253, 0xC98439], CLAIR = 0xEBB86A, FONCE = 0xB27434, POUTRE = 0xC4843E, PORTE_C = 0x9A5A2C,
  ECORCE = 0x7A4A2A, BOUT = 0xE8BE80, CERNE = 0xC99A5E, FER = 0x3A3A42, LAME = 0x9EA2A8, VERRE = 0x2E2A2A;
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
/* une planche (une boîte) tournée : rx, ry, rz en radians */
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => MIEL[((k * 7) % 3 + 3) % 3];

/* le corps : x de X0 à X1, z de Z0 à FACADE, murs de HM de haut */
const X0 = -1.85, X1 = .85, Z0 = -1.55, HM = 2.2, CX = (X0 + X1) / 2, W = X1 - X0, D = FACADE - Z0;
const HR = 1.3, DEB = .28, DEB_AV = .32;                     // la hauteur du toit, ses débords sur les côtés, devant et derrière

/* un mur de planches horizontales, du sol à la hauteur h, le long de x (face en z) ou le long de z (face en x) */
function murPlanches(g, long, h, fixe, sens, e = .1){
  const n = Math.round(h / .28);
  for(let k = 0; k < n; k++){
    const y = (k + .5) * h / n, hh = h / n - .025;
    if(sens === "x") boite(g, ton(k + Math.round(fixe * 3)), long, hh, e, CX, y, fixe);
    else boite(g, ton(k + 1), e, hh, long, fixe, y, (Z0 + FACADE) / 2);
  }
  /* les joints : de fines lignes plus sombres entre les planches */
  for(let k = 1; k < n; k++){
    const y = k * h / n;
    if(sens === "x") boite(g, FONCE, long + .01, .025, e + .012, CX, y, fixe);
    else boite(g, FONCE, e + .012, .025, long + .01, fixe, y, (Z0 + FACADE) / 2);
  }
}

function corps(g){
  /* le soubassement : une grosse poutre au ras du sol tout autour */
  boite(g, POUTRE, W + .16, .2, .16, CX, .1, FACADE);
  boite(g, POUTRE, W + .16, .2, .16, CX, .1, Z0);
  /* les murs (devant un peu en avant de la poutre du bas), derrière, les deux côtés */
  murPlanches(g, W, HM, FACADE - .02, "x");
  murPlanches(g, W, HM, Z0, "x");
  murPlanches(g, D, HM, X0, "z");
  murPlanches(g, D, HM, X1, "z");
  /* les gros poteaux d'angle, et la poutre qui court en haut de la façade */
  for(const x of [X0, X1]) for(const z of [Z0, FACADE]) boite(g, POUTRE, .24, HM + .05, .24, x, (HM + .05) / 2, z);
  boite(g, POUTRE, W + .3, .22, .22, CX, HM - .02, FACADE + .04);
  boite(g, POUTRE, W + .3, .22, .22, CX, HM - .02, Z0 - .04);
  /* un poteau de chaque côté de la porte, et la poutre au-dessus d'elle */
  for(const x of [-1.12, .12]) boite(g, POUTRE, .16, 1.72, .14, x, .86, FACADE + .05);
  boite(g, POUTRE, 1.4, .16, .16, -.5, 1.74, FACADE + .06);
}

/* le pignon de devant : des planches debout, de plus en plus courtes vers les bords */
function pignonPlanches(g, z){
  const n = 9, demi = W / 2;
  for(let k = 0; k < n; k++){
    const x = X0 + (k + .5) * W / n, h = HR * (1 - Math.abs(x - CX) / (demi + DEB)) - .05;
    if(h <= .05) continue;
    boite(g, ton(k + 2), W / n - .03, h, .08, x, HM + .1 + h / 2, z);
  }
}

/* le toit : deux pentes de larges planches qui descendent du faîte, en deux rangs qui se chevauchent */
function toit(g){
  const demi = W / 2 + DEB, a = Math.atan2(HR, demi - DEB), L = Math.hypot(demi, demi * HR / (demi - DEB)), z0 = Z0 - DEB_AV, z1 = FACADE + DEB_AV;
  const n = Math.round((z1 - z0) / .44), large = (z1 - z0) / n, sommet = HM + .12 + HR;
  for(const s of [-1, 1]){
    for(let rang = 0; rang < 2; rang++){
      const l = rang ? L * .55 : L, decal = rang ? large / 2 : 0;
      for(let k = 0; k < n + (rang ? -1 : 0); k++){
        const z = z0 + (k + .5) * large + decal, dl = (((k * 13 + rang * 5) % 7) - 3) * .025;   // des longueurs un peu inégales
        /* le milieu de la planche, le long de la pente, depuis le faîte */
        const t = (l + dl) / 2 + (rang ? .02 : 0), cx = CX + s * Math.cos(a) * t, cy = sommet - Math.sin(a) * t + (rang ? .07 : 0);
        planche(g, ton(k + rang * 2 + (s > 0 ? 1 : 0)), l + dl, .09, large - .04, cx, cy, z, 0, 0, -s * a);
      }
    }
    /* la planche de rive, sur le bord de devant de chaque pente */
    planche(g, POUTRE, L + .05, .12, .14, CX + s * Math.cos(a) * L / 2, sommet - Math.sin(a) * L / 2 + .04, z1 + .02, 0, 0, -s * a);
    planche(g, POUTRE, L + .05, .12, .14, CX + s * Math.cos(a) * L / 2, sommet - Math.sin(a) * L / 2 + .04, z0 - .02, 0, 0, -s * a);
  }
  /* le faîte : un rondin, et ses deux blocs */
  const faite = ajoute(g, part(G.cyl, CLAIR, .2, z1 - z0 + .25, .2, CX, sommet + .07, (z0 + z1) / 2)); faite.rotation.x = Math.PI / 2;
  for(const z of [z1 - .05, z0 + .35]) boite(g, POUTRE, .34, .2, .42, CX, sommet + .16, z);
  g.userData.toit = sommet + .25;
}

/* la porte : ses planches, ses deux pentures de fer, son anneau, sa marche ; la lanterne et la lucarne du pignon */
function porte(g){
  const z = FACADE + .1;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0x8E5226, .24, 1.5, .06, -.5 - .36 + k * .24, .78, z);
  for(const y of [.4, 1.2]){ boite(g, FER, .9, .09, .03, -.52, y, z + .05); for(const x of [-.88, -.16]) boite(g, 0x5A5A62, .05, .05, .03, x, y, z + .07); }
  const anneau = ajoute(g, part(G.tore || G.cyl, FER, .14, .14, .04, -.2, .78, z + .07));
  if(!G.tore) anneau.scale.set(.12, .03, .12), anneau.rotation.x = Math.PI / 2;
  boite(g, POUTRE, 1.3, .14, .5, -.5, .07, FACADE + .3);                                  // la marche
  /* la lanterne sur sa potence, au-dessus de la porte */
  boite(g, FER, .06, .06, .32, -.5, HM + .55, FACADE + .2);
  boite(g, FER, .05, .14, .05, -.5, HM + .46, FACADE + .34);
  boite(g, FER, .24, .05, .24, -.5, HM + .38, FACADE + .34);
  ajoute(g, part(G.box, LUEUR, .17, .22, .17, -.5, HM + .23, FACADE + .34));
  for(const [dx, dz] of [[-.09, -.09], [.09, -.09], [-.09, .09], [.09, .09]]) boite(g, FER, .03, .24, .03, -.5 + dx, HM + .23, FACADE + .34 + dz);
  boite(g, FER, .22, .04, .22, -.5, HM + .1, FACADE + .34);
  /* la lucarne ronde, plus haut dans le pignon (ajoutée) */
  const cadre = ajoute(g, part(G.cyl, POUTRE, .36, .06, .36, CX, HM + .95, FACADE + .1)); cadre.rotation.x = Math.PI / 2;
  const vitre = ajoute(g, part(G.cyl, VITRE, .26, .07, .26, CX, HM + .95, FACADE + .11)); vitre.rotation.x = Math.PI / 2; vitre.castShadow = false;
}
/* une fenêtre à croisillons, son cadre épais et son appui */
function fenetre(g, x, y, z, face = "z"){
  const f = (w, h, d, dx, dy, dz, c) => face === "z" ? boite(g, c, w, h, d, x + dx, y + dy, z + dz) : boite(g, c, d, h, w, x + dz, y + dy, z + dx);
  const s = face === "z" ? 1 : -1;
  f(.66, .62, .06, 0, 0, s * .02, POUTRE);
  const v = f(.48, .44, .06, 0, 0, s * .04, VITRE); v.castShadow = false;
  f(.04, .44, .07, 0, 0, s * .06, POUTRE); f(.48, .04, .07, 0, 0, s * .06, POUTRE);
  f(.8, .08, .16, 0, -.36, s * .07, POUTRE);                                              // l'appui
  f(.76, .1, .08, 0, .36, s * .05, POUTRE);                                               // le linteau
}

/* l'appentis de droite : deux poteaux d'aplomb, une jambe de force, un toit de planches en pente, des planches debout */
function appentis(g){
  const xa = X1 + .1, xb = 1.88, za = Z0 + .35, zb = FACADE - .05, haut = 1.62, bas = 1.25;
  for(const z of [za, zb]){ boite(g, POUTRE, .16, bas, .16, xb, bas / 2, z); planche(g, POUTRE, .1, .7, .1, xb - .22, bas - .28, z, 0, 0, -.75); }
  boite(g, POUTRE, .14, .14, zb - za + .3, xb, bas, (za + zb) / 2);
  const a = Math.atan2(haut - bas, xb - xa), L = Math.hypot(haut - bas, xb - xa) + .35, n = 6;
  for(let k = 0; k < n; k++){
    const z = za - .2 + (k + .5) * (zb - za + .45) / n;
    planche(g, ton(k + 1), L, .08, (zb - za + .45) / n - .03, (xa + xb) / 2 + .1, (haut + bas) / 2 + .06, z, 0, 0, -a);
  }
  /* des planches debout, appuyées contre le mur du corps */
  [[.98, .02, 1.25, .2], [1.1, -.25, 1.4, .26], [1.22, .15, 1.15, .22], [1.05, .45, 1.3, .18], [1.3, -.5, 1.2, .2]].forEach(([x, z, h, l], k) =>
    planche(g, k % 2 ? CLAIR : ton(k), l, h, .07, x, h / 2, z, 0, Math.PI / 2, .12 + k * .03));
}
/* la pile de rondins, devant à gauche : chaque rondin son écorce, son bout clair et ses cernes */
function rondins(g){
  const rangs = [[[-2.0, .19], [-1.63, .19], [-1.28, .19]], [[-1.82, .5], [-1.46, .5]], [[-1.64, .8]]];   // à gauche de la porte (demande de Yo, v2.1.47)
  rangs.flat().forEach(([x, y], k) => {
    const z = 1.45 - (k % 2) * .05, l = .62 + (k % 3) * .04;
    const r = ajoute(g, part(G.cyl, ECORCE, .36, l, .36, x, y, z)); r.rotation.x = Math.PI / 2;
    const b = ajoute(g, part(G.cyl, BOUT, .32, .03, .32, x, y, z + l / 2 + .005)); b.rotation.x = Math.PI / 2;
    for(const rr of [.2, .1]){ const c = ajoute(g, part(G.cyl, CERNE, rr, .032, rr, x, y, z + l / 2 + .012)); c.rotation.x = Math.PI / 2; }
  });
}
/* les deux tréteaux et la grande scie posée dessus */
function treteaux(g){
  const zs = 1.68;
  const dx = .25;                                         // un peu plus à droite (demande de Yo, v2.1.47)
  for(const x of [.35 + dx, 1.55 + dx]){
    boite(g, POUTRE, .16, .14, .5, x, .74, zs);                                                   // la traverse du dessus
    for(const s of [-1, 1]) for(const t of [-1, 1]) planche(g, CLAIR, .11, .78, .11, x + s * .1, .36, zs + t * .15, t * .18, 0, -s * .2);
    boite(g, POUTRE, .32, .06, .06, x, .3, zs + .17); boite(g, POUTRE, .32, .06, .06, x, .3, zs - .17);
  }
  /* la scie : sa lame d'acier et ses dents, posée à plat sur les deux traverses, ses deux poignées debout */
  const y = .84;
  boite(g, LAME, 1.5, .03, .26, .95 + dx, y, zs);
  for(let k = 0; k < 18; k++) planche(g, LAME, .06, .028, .06, .25 + dx + k * .082, y, zs + .14, 0, Math.PI / 4, 0);
  for(const x of [.15 + dx, 1.75 + dx]){ boite(g, POUTRE, .08, .3, .1, x, y + .12, zs); boite(g, FER, .1, .04, .14, x, y + .01, zs); }
}

export function scierieNiveau1(g){
  corps(g);
  pignonPlanches(g, FACADE + .02);
  pignonPlanches(g, Z0 - .02);
  toit(g);
  porte(g);
  fenetre(g, .45, 1.2, FACADE + .06);
  fenetre(g, X0 - .06, 1.25, -.2, "x");                       // la deuxième fenêtre, sur le côté gauche (ajoutée)
  appentis(g);
  rondins(g);
  treteaux(g);
}

/* ================= La Scierie, niveau 2 =================
   D'après l'image de Yo (23 octobre 2026 ; étape 2.2), au plus près de l'image : la même cabane, plus solide, ses murs
   de planches debout entre de gros poteaux et deux poutres qui courent sur la façade ; un toit de tuiles rondes orangées
   en rangs qui se chevauchent, son faîte en rondin, une cheminée de pierres au chapeau de bois ; dans le pignon, une
   petite fenêtre à quatre carreaux ; la porte de planches, ses pentures de fer et son anneau, sur une marche ; à droite
   de la porte, une lanterne sur sa potence et une petite fenêtre ; à gauche, un appentis couvert de tuiles sur ses
   poteaux et ses jambes de force, des piles de planches à l'abri, et contre lui la roue à eau : sa goulotte de bois
   amène l'eau par derrière, l'eau tombe sur la roue, descend d'aube en aube et retombe dans un bassin de pierres, d'où
   elle déborde par devant (Yo : « Améliore l'eau qui coule dans la roue. Je veux que cela soit parfait ») ; devant à
   gauche, la table à scie circulaire et une pile de rondins ; à droite, des rondins rangés contre le mur et une pile
   de planches. Corrigé : tout tient dans le carré de 4 × 4 (sur l'image, l'appentis et la roue débordaient loin), la
   porte reste en x = −0,5. Ce qui bouge : la roue tourne, l'eau coule, bouillonne et éclabousse, au temps du vent (VENT). */

const N2 = {X0: -1.2, X1: 1.2, Z0: -1.5, HM: 2.2, HR: 1.45, DEB: .22, DEB_AV: .3};
const MUR2 = [0xD98A3E, 0xE39A4A, 0xCC7E36], POTEAU2 = 0xC07A36, JOINT2 = 0x9C5E28,
  TUILES = [0xEC7A30, 0xF08436, 0xE5722C, 0xEE7E33], SOUS_TUILE = 0xA9471C, PIERRES = [0xB8B2A6, 0xA8A196, 0xC6C0B3, 0x9C968B];
const ton2 = k => MUR2[((k * 7) % 3 + 3) % 3];

/* une forme faite de plusieurs : fusionner rend une forme simple (positions, normales), que part() pose comme une autre */
const forme = M => { const g = fusionner(M.map(([geo, m]) => ({geo, m, c: 0xffffff}))); g.deleteAttribute("color"); return g; };
const mat4 = (x, y, z, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(sx, sy, sz));
/* un pavé de pierre arrondi (un superellipsoïde : une boîte aux coins ronds) */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const PAVE = arrondi(10, 8, .35);
/* une tuile : une plaque aux bords arrondis (longue de 1 le long de x, épaisse de 1 en y, large de 1 en z) */
const TUILE = arrondi(8, 6, .3);
/* poser une forme selon une pente : d, la direction du bas de la pente ; n, le dessus */
function surPente(m, d, n){ const w = d.clone().cross(n); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, n, w)); return m; }
const tuile = (g, hex, p, d, n, l, e, w) => surPente(ajoute(g, part(TUILE, hex, l, e, w, p.x, p.y, p.z)), d, n);
const pave = (g, hex, sx, sy, sz, x, y, z) => ajoute(g, part(PAVE, hex, sx, sy, sz, x, y, z));

/* des murs de planches debout, avec leurs joints ; le long de x (face en z) ou le long de z (face en x) */
function murDebout(g, a, b, h, fixe, sens, e = .1){
  const n = Math.max(2, Math.round((b - a) / .27)), l = (b - a) / n;
  for(let k = 0; k < n; k++){
    const c = a + (k + .5) * l;
    if(sens === "x") boite(g, ton2(k), l - .025, h, e, c, h / 2, fixe); else boite(g, ton2(k + 1), e, h, l - .025, fixe, h / 2, c);
    if(k){ const j = a + k * l; if(sens === "x") boite(g, JOINT2, .025, h, e - .02, j, h / 2, fixe); else boite(g, JOINT2, e - .02, h, .025, fixe, h / 2, j); }
  }
}
function corps2(g){
  const {X0, X1, Z0, HM} = N2, CX2 = (X0 + X1) / 2, W2 = X1 - X0;
  boite(g, POTEAU2, W2 + .16, .2, .16, CX2, .1, FACADE); boite(g, POTEAU2, W2 + .16, .2, .16, CX2, .1, Z0);
  murDebout(g, X0, X1, HM, FACADE - .02, "x"); murDebout(g, X0, X1, HM, Z0, "x");
  murDebout(g, Z0, FACADE, HM, X0, "z"); murDebout(g, Z0, FACADE, HM, X1, "z");
  for(const x of [X0, X1]) for(const z of [Z0, FACADE]) boite(g, POTEAU2, .26, HM + .05, .26, x, (HM + .05) / 2, z);
  /* la poutre du haut (le pied du pignon), qui dépasse sur les côtés, et celle du milieu, au-dessus de la porte */
  for(const z of [FACADE + .06, Z0 - .06]){ boite(g, POTEAU2, W2 + .5, .24, .24, CX2, HM, z); boite(g, POTEAU2, W2 + .2, .18, .18, CX2, 1.66, z); }
  for(const x of [X0 - .06, X1 + .06]) boite(g, POTEAU2, .2, .18, FACADE - Z0 + .2, x, 1.66, (Z0 + FACADE) / 2);
}
/* le pignon de planches debout et, devant, sa petite fenêtre à quatre carreaux */
function pignon2(g, z, avant){
  const {X0, X1, HM, HR, DEB} = N2, CX2 = (X0 + X1) / 2, demi = (X1 - X0) / 2, n = 10, l = (X1 - X0) / n;
  for(let k = 0; k < n; k++){
    const x = X0 + (k + .5) * l, h = HR * (1 - Math.abs(x - CX2) / (demi + DEB)) - .02;
    if(h > .05) boite(g, ton2(k + 2), l - .025, h, .08, x, HM + .1 + h / 2, z);
  }
  if(!avant) return;
  const y = HM + .62, zz = z + .05;
  boite(g, POTEAU2, .52, .5, .06, CX2, y, zz);
  boite(g, VITRE, .38, .36, .05, CX2, y, zz + .02).castShadow = false;
  boite(g, POTEAU2, .04, .36, .06, CX2, y, zz + .04); boite(g, POTEAU2, .38, .04, .06, CX2, y, zz + .04);
  boite(g, POTEAU2, .62, .07, .14, CX2, y - .27, zz + .04); boite(g, POTEAU2, .6, .08, .08, CX2, y + .27, zz + .02);
}
/* le toit de tuiles : sur chaque pente, des rangs de tuiles qui se chevauchent (en quinconce), posés sur un fond plus
   sombre ; les planches de rive ; le faîte en rondin, son bout clair et ses cernes */
function toit2(g){
  const {X0, X1, Z0, HM, HR, DEB, DEB_AV} = N2, CX2 = (X0 + X1) / 2, demi = (X1 - X0) / 2 + DEB;
  const a = Math.atan2(HR, demi - DEB), L = demi / Math.cos(a), z0 = Z0 - DEB_AV, z1 = FACADE + DEB_AV, sommet = HM + .12 + HR;
  const rangs = Math.round(L / .25), nz = Math.round((z1 - z0) / .29), wz = (z1 - z0) / nz;
  for(const s of [-1, 1]){
    const d = V(s * Math.cos(a), -Math.sin(a), 0), n = V(s * Math.sin(a), Math.cos(a), 0), dt = d.clone().addScaledVector(n, -.09).normalize();
    planche(g, SOUS_TUILE, L, .06, z1 - z0, CX2 + s * Math.cos(a) * L / 2, sommet - Math.sin(a) * L / 2 - .02, (z0 + z1) / 2, 0, 0, -s * a);
    for(let r = 0; r < rangs; r++){
      const t = (r + .62) * L / rangs, quinc = r % 2 ? wz / 2 : 0;
      for(let k = 0; k < nz + (r % 2 ? -1 : 0); k++){
        const p = V(CX2, sommet, z0 + (k + .5) * wz + quinc).addScaledVector(d, t).addScaledVector(n, .07 + r * .004);
        tuile(g, TUILES[(r * 31 + k * 17 + (s > 0 ? 7 : 0)) % 4], p, dt, n, L / rangs * 1.25, .1, wz - .03);
      }
    }
    for(const z of [z1 + .03, z0 - .03]) planche(g, POTEAU2, L + .06, .14, .1, CX2 + s * Math.cos(a) * L / 2, sommet - Math.sin(a) * L / 2 + .07, z, 0, 0, -s * a);
  }
  const faite = ajoute(g, part(G.cyl, CLAIR, .26, z1 - z0 + .3, .26, CX2, sommet + .12, (z0 + z1) / 2)); faite.rotation.x = Math.PI / 2;
  for(const [rr, c, dz] of [[.22, BOUT, 0], [.13, CERNE, .006], [.05, BOUT, .012]]){ const b = ajoute(g, part(G.cyl, c, rr, .02, rr, CX2, sommet + .12, z1 + .16 + dz)); b.rotation.x = Math.PI / 2; }
  g.userData.toit = sommet + .3;
  return {a, sommet, CX2};
}
/* la cheminée de pierres, sur la pente de gauche, vers l'arrière, et son chapeau de bois */
function cheminee2(g, {a, sommet, CX2}){
  const x = CX2 - .62, z = N2.Z0 + .45, base = sommet - .62 * Math.tan(a) - .25, haut = sommet + .42;
  boite(g, 0x8E887E, .38, haut - base, .38, x, (base + haut) / 2, z);
  const assises = 4, ha = (haut - base - .1) / assises;
  for(let k = 0; k < assises; k++){
    const y = haut - .05 - (k + .5) * ha, dec = k % 2 ? .06 : -.06;
    [[-.1 + dec, .2, .2, .1], [.11 + dec, .2, .19, .1], [-.1 - dec, -.2, .2, .1], [.11 - dec, -.2, .19, .1],
      [-.2, -.09 + dec, .1, .2], [-.2, .11 + dec, .1, .19], [.2, -.09 - dec, .1, .2], [.2, .11 - dec, .1, .19]].forEach(([dx, dz, sx, sz], j) =>
      pave(g, PIERRES[(k * 3 + j) % 4], sx, ha - .02, sz, x + dx, y, z + dz));
  }
  boite(g, POTEAU2, .58, .1, .58, x, haut + .03, z);
  boite(g, CLAIR, .46, .16, .46, x, haut + .16, z);
}
/* la porte : ses planches, ses pentures de fer (à droite) et son anneau (à gauche), son cadre, sa marche */
function porte2(g){
  const z = FACADE + .1;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0x8E5226, .235, 1.48, .06, -.5 - .355 + k * .235, .79, z);
  for(const y of [.42, 1.18]){
    boite(g, FER, .62, .085, .03, -.32, y, z + .05);
    const bout = ajoute(g, part(G.cyl, FER, .13, .03, .13, -.62, y, z + .05)); bout.rotation.x = Math.PI / 2;
    for(const x of [-.5, -.2, -.05]){ const c = ajoute(g, part(G.cyl, 0x5A5A62, .04, .03, .04, x, y, z + .07)); c.rotation.x = Math.PI / 2; }
  }
  const plaque = ajoute(g, part(G.cyl, FER, .07, .03, .07, -.8, .9, z + .05)); plaque.rotation.x = Math.PI / 2;
  ajoute(g, part(G.tore, FER, .17, .17, .25, -.8, .8, z + .07));
  for(const x of [-1.11, .11]) boite(g, POTEAU2, .16, 1.62, .14, x, .81, FACADE + .06);
  boite(g, POTEAU2, 1.42, .17, .17, -.5, 1.62, FACADE + .08);
  boite(g, POTEAU2, 1.3, .12, .42, -.5, .06, FACADE + .27);                                 // la marche
  boite(g, CLAIR, 1.2, .03, .36, -.5, .125, FACADE + .27);
}
/* la lanterne sur sa potence et la petite fenêtre, à droite de la porte */
function lanterne2(g){
  const x = .6, y = 1.42, z = FACADE + .02;
  boite(g, FER, .06, .2, .04, x, y + .32, z + .03);
  boite(g, FER, .05, .05, .3, x, y + .38, z + .17);
  boite(g, FER, .03, .1, .03, x, y + .3, z + .3);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .22, z + .3)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y + .06, z + .3));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .22, .025, x + dx, y + .06, z + .3 + dz);
  boite(g, FER, .2, .04, .2, x, y - .06, z + .3);
  const yf = .9;
  boite(g, POTEAU2, .44, .5, .06, x, yf, z + .03);
  boite(g, VITRE, .32, .38, .05, x, yf, z + .05).castShadow = false;
  boite(g, POTEAU2, .035, .38, .06, x, yf, z + .07); boite(g, POTEAU2, .32, .035, .06, x, yf, z + .07);
  boite(g, POTEAU2, .52, .07, .14, x, yf - .27, z + .07);
}
/* l'appentis de gauche : le toit de tuiles qui descend vers l'avant, ses poteaux et ses jambes de force ; dedans, des
   piles de planches (le bout des planches vers l'avant) */
const XL = -1.95;
function appentis2(g){
  const {X0, Z0} = N2, za = Z0 + .15, zb = -.45, hautA = 1.82, basA = 1.42;
  boite(g, POTEAU2, .16, basA, .16, XL + .15, basA / 2, zb - .04);
  boite(g, POTEAU2, X0 - XL + .1, .16, .16, (XL + X0) / 2, basA - .02, zb - .04);
  planche(g, POTEAU2, .1, .5, .1, X0 - .26, basA - .26, zb - .04, 0, 0, .78);
  planche(g, POTEAU2, .1, .5, .1, XL + .35, basA - .26, zb - .04, 0, 0, -.78);
  boite(g, POTEAU2, .16, hautA, .16, XL + .1, hautA / 2, za);
  boite(g, POTEAU2, .14, .14, zb - za, XL + .1, basA + .02, (za + zb) / 2);
  /* le toit : un fond sombre et des rangs de tuiles, en travers, du haut (derrière) vers le bas (devant) */
  const pente = Math.atan2(hautA - basA, zb - za), Lp = Math.hypot(hautA - basA, zb - za) + .3;
  const d = V(0, -Math.sin(pente), Math.cos(pente)), n = V(0, Math.cos(pente), Math.sin(pente)), dt = d.clone().addScaledVector(n, -.09).normalize();
  const xa = XL - .08, xb = X0 - .1, cx = (xa + xb) / 2, haut0 = V(0, hautA + .2, za - .15);
  const centre = haut0.clone().addScaledVector(d, Lp / 2).addScaledVector(n, -.03);
  planche(g, SOUS_TUILE, xb - xa, .06, Lp, cx, centre.y, centre.z, pente, 0, 0);
  const rangs = Math.round(Lp / .25), nx = 3, wx = (xb - xa) / nx;
  for(let r = 0; r < rangs; r++){
    const t = (r + .62) * Lp / rangs, quinc = r % 2 ? wx / 2 : 0;
    for(let k = 0; k < nx + (r % 2 ? -1 : 0); k++){
      const p = haut0.clone().setX(xa + (k + .5) * wx + quinc).addScaledVector(d, t).addScaledVector(n, .02 + r * .004);
      tuile(g, TUILES[(r * 13 + k * 5) % 4], p, dt, n, Lp / rangs * 1.25, .1, wx - .03);
    }
  }
  planche(g, POTEAU2, .1, .14, Lp, xa - .02, centre.y + .06, centre.z, pente, 0, 0);          // la planche de rive du côté
  /* les piles de planches à l'abri */
  [[-1.45, -.95, 5]].forEach(([x, z, n], p) => {
    for(let k = 0; k < n; k++) for(let j = 0; j < 2; j++)
      boite(g, (k + j + p) % 2 ? CLAIR : ton2(k + p), .17, .08, .62 - (k % 2) * .05, x + (j - .5) * .19, .05 + k * .09, z + (k % 3) * .02);
  });
  [[-1.88, -1.15, 1.1], [-1.86, -.85, .95]].forEach(([x, z, h], k) => planche(g, k ? CLAIR : ton2(k), .07, h, .2, x, h / 2, z, .12, 0, -.18));
}
/* la table à scie circulaire : son plateau, ses pieds écartés, sa lame ronde et ses dents */
function tableScie(g){
  const x = -1.6, z = 1.45, y = .58;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? CLAIR : ton2(k), .62, .08, .095, x, y, z - .15 + k * .1);
  boite(g, POTEAU2, .66, .08, .44, x, y - .06, z);
  for(const s of [-1, 1]) for(const t of [-1, 1]) planche(g, POTEAU2, .09, .58, .09, x + s * .24, y / 2 - .04, z + t * .15, t * .1, 0, -s * .12);
  boite(g, POTEAU2, .5, .06, .06, x, .2, z + .15); boite(g, POTEAU2, .5, .06, .06, x, .2, z - .15);
  boite(g, FONCE, .03, .02, .3, x + .04, y + .045, z);
  const r = .2, lame = ajoute(g, part(G.cyl, LAME, r * 2, .015, r * 2, x + .04, y + .05, z)); lame.rotation.z = Math.PI / 2;
  const moyeu = ajoute(g, part(G.cyl, 0x6E7278, .07, .03, .07, x + .04, y + .05, z)); moyeu.rotation.z = Math.PI / 2;
  for(let k = 0; k < 20; k++){
    const ang = k / 20 * Math.PI * 2, yy = y + .05 + Math.cos(ang) * r;
    if(yy > y + .06) planche(g, LAME, .016, .045, .045, x + .04, yy, z + Math.sin(ang) * r, ang + .4, 0, 0);
  }
}
/* un rondin couché le long de z : son écorce, son bout clair et ses cernes */
function rondin(g, x, y, z, r, l){
  const m = ajoute(g, part(G.cyl, ECORCE, r * 2, l, r * 2, x, y, z)); m.rotation.x = Math.PI / 2;
  for(const [rr, c, dz] of [[r * 1.86, BOUT, .005], [r * 1.1, CERNE, .012], [r * .45, BOUT, .018]]){
    const b = ajoute(g, part(G.cyl, c, rr, .03, rr, x, y, z + l / 2 + dz)); b.rotation.x = Math.PI / 2;
  }
}
function rondins2(g){
  const r = .14;
  [[-1.97, 0], [-1.69, 0], [-1.41, 0], [-1.83, 1], [-1.55, 1], [-1.69, 2]].forEach(([x, k], i) => rondin(g, x, r + k * r * 1.72, 1.8 - (i % 2) * .04, r, .42 + (i % 3) * .04));
  /* à droite, rangés contre le mur entre deux poteaux */
  for(let c = 0; c < 2; c++) for(let k = 0; k < 3; k++) rondin(g, 1.48 + c * .3, .15 + k * .27, .55 - (k + c) % 2 * .04, .14, .9);
  for(const x of [1.36, 1.95]) boite(g, POTEAU2, .08, .85, .1, x, .425, 1.02);
  /* devant à droite, la pile de planches croisées */
  for(let k = 0; k < 4; k++) for(let j = 0; j < 3; j++){
    const travers = k % 2;
    boite(g, (k + j) % 2 ? CLAIR : ton2(j + k), travers ? .58 : .17, .08, travers ? .17 : .58, .83 + (travers ? 0 : (j - 1) * .19), .05 + k * .09, 1.62 + (travers ? (j - 1) * .19 : 0));
  }
}

/* ---------- La roue à eau et son eau ---------- */
const RO = {x: 0, y: .78, z: 0, R: .7, e: .22};                   // le moyeu (autour duquel le moulin est fait), le rayon, l'épaisseur
const MOULIN = {x: -1.66, z: .3, tourne: -.5};                      // sa place, et combien il est tourné vers l'avant
const NIVEAU = .14;                                                // l'eau du bassin
const LEVRE = {z: RO.z + .1, y: RO.y + RO.R + .19};                // le bout de la goulotte
const OMEGA = .9, RW = RO.R + .07, TH0 = .32, TH1 = 1.42;           // la roue tourne (radians par seconde) ; l'eau la suit de TH0 à TH1, à RW du moyeu

/* L'eau : une matière jouet transparente, dessinée au pixel : des stries d'écume qui filent dans le sens du courant, plus
   claires en haut, les bords qui s'effilochent, l'écume au pied ; sorte : "chute" (une nappe qui tombe), "canal" (la
   goulotte), "bassin" (des ronds qui s'élargissent depuis le pied de la chute, l'écume qui tourne) */
const BRUIT = `
  float hEau(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bEau(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hEau(i), hEau(i + vec2(1, 0)), f.x), mix(hEau(i + vec2(0, 1)), hEau(i + vec2(1, 1)), f.x), f.y); }`;
const CORPS = {
  chute: (fin, arc) => `
    float v = vEau.y, t = eauTemps;
    float a = bEau(vec2(vEau.x * 6.0, v * 2.4 - t * 2.6)), b = bEau(vec2(vEau.x * 14.0 + 3.1, v * 5.0 - t * 3.6));
    float c2 = bEau(vec2(vEau.x * 3.0 + 7.0, v * 1.2 - t * 1.7));
    float stries = smoothstep(.56, .82, a * .55 + b * .45);
    vec3 col = mix(vec3(.10, .45, .84), vec3(.40, .80, 1.0), clamp(.2 + .75 * c2, 0., 1.));
    col += vec3(.1, .12, .1) * smoothstep(.3, .45, vEau.x) * smoothstep(.62, .47, vEau.x);   // le reflet au milieu de la nappe
    col = mix(col, vec3(.96, .99, 1.0), stries * .85);
    float bord = smoothstep(.0, .16 + .12 * b, vEau.x) * smoothstep(1., .84 - .12 * a, vEau.x);
    float al = (.74 + .26 * stries) * bord;
    ${arc ? `/* sur la roue, l'eau s'amasse en écume sur chaque aube, qui descend avec elle */
    float th = ${arc[2].toFixed(3)} + (v - ${arc[0].toFixed(3)}) / ${arc[3].toFixed(3)};
    float ph = fract((th - t * ${OMEGA.toFixed(2)}) * ${(16 / (2 * Math.PI)).toFixed(4)});
    float aube = smoothstep(.0, .05, ph) * smoothstep(.34, .12, ph) * step(${arc[0].toFixed(3)}, v) * step(v, ${arc[1].toFixed(3)});
    col = mix(col, vec3(.97, 1., 1.), aube * (.8 + .2 * b)); al = max(al, aube * .97 * bord);` : ""}
    float pied = smoothstep(${(fin - .3).toFixed(2)}, ${fin.toFixed(2)}, v);
    col = mix(col, vec3(1.), pied * .75); al = max(al, pied * .85 * bord);
    col = mix(col, vec3(.8, .95, 1.), smoothstep(.25, 0., v) * .5);
    vec4 diffuseColor = vec4(col, al * opacity);`,
  canal: () => `
    float v = vEau.y, t = eauTemps;
    float a = bEau(vec2(vEau.x * 5.0, v * 3.0 - t * 1.6)), b = bEau(vec2(vEau.x * 11.0, v * 7.0 - t * 2.3));
    float stries = smoothstep(.6, .85, a * .5 + b * .5);
    vec3 col = mix(vec3(.22, .62, .86), vec3(.62, .9, .98), a);
    col = mix(col, vec3(.95, .99, 1.), stries * .7);
    vec4 diffuseColor = vec4(col, (.8 + .15 * stries) * opacity);`,
  bassin: () => `
    vec2 p = vEau; float t = eauTemps, r = length((p - vec2(.5, .74)) * vec2(.35, 1.5));
    float ronds = sin(r * 46. - t * 5.) * .5 + .5;
    float a = bEau(p * vec2(4., 14.) + vec2(0., -t * .9)), b = bEau(p * vec2(9., 30.) - vec2(t * .4, t * 1.3));
    vec3 col = mix(vec3(.17, .52, .74), vec3(.42, .8, .94), a * .7 + ronds * .3 * smoothstep(.45, .1, r));
    float mousse = smoothstep(.2, .05, r + (b - .5) * .12) + smoothstep(.75, .95, b) * smoothstep(.5, .15, r);
    col = mix(col, vec3(.97, 1., 1.), clamp(mousse, 0., 1.) * .9);
    vec4 diffuseColor = vec4(col, (.86 + .12 * mousse) * opacity);`
};
function eauMat(sorte, fin = 1, arc = null){
  const m = toon({color: 0xffffff, emissive: 0x0E3346, transparent: true, depthWrite: false, side: THREE.DoubleSide});
  m.onBeforeCompile = sh => {
    sh.uniforms.eauTemps = VENT.temps;
    sh.vertexShader = "varying vec2 vEau;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvEau = uv;");
    sh.fragmentShader = "uniform float eauTemps;\nvarying vec2 vEau;\n" + BRUIT + "\n" + sh.fragmentShader.replace("vec4 diffuseColor = vec4( diffuse, opacity );", CORPS[sorte](fin, arc));
  };
  m.customProgramCacheKey = () => "scierie-eau-" + sorte + fin.toFixed(2) + (arc ? "-roue" : "");
  return m;
}
/* un ruban d'eau qui suit un chemin (des points [z, y]) dans le plan x = cx ; largeur(f) selon la part du chemin ;
   ecart : posé un peu en dehors (une deuxième nappe, devant) ; uv : x en travers, y la longueur parcourue */
function ruban(chemin, cx, largeur, ecart = 0){
  const pos = [], nor = [], uv = [], idx = [];
  let long = 0; const longs = [];
  chemin.forEach(([z, y], i) => {
    const [z0, y0] = chemin[Math.max(0, i - 1)], [z1, y1] = chemin[Math.min(chemin.length - 1, i + 1)];
    let tz = z1 - z0, ty = y1 - y0; const lt = Math.hypot(tz, ty) || 1; tz /= lt; ty /= lt;
    let nz = ty, ny = -tz; if(nz * (z - RO.z) + ny * (y - RO.y) < 0){ nz = -nz; ny = -ny; }
    if(i) long += Math.hypot(z - chemin[i - 1][0], y - chemin[i - 1][1]);
    longs.push(long);
    const w = largeur(i / (chemin.length - 1)) / 2, zz = z + nz * ecart, yy = y + ny * ecart;
    pos.push(cx - w, yy, zz, cx + w, yy, zz); nor.push(0, ny, nz, 0, ny, nz); uv.push(0, long, 1, long);
    if(i){ const b = (i - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere();
  return {geo, long, longs};
}
const eauMesh = (g, geo, m, ordre = 2) => { const o = ajoute(g, new THREE.Mesh(geo, m)); o.castShadow = false; o.receiveShadow = false; o.renderOrder = ordre; return o; };

/* le chemin de l'eau : de la lèvre de la goulotte, elle tombe sur le haut de la roue, la suit d'aube en aube sur le
   devant, puis s'en détache et retombe tout droit dans le bassin */
function cheminChute(){
  const pts = [[LEVRE.z, LEVRE.y], [LEVRE.z + .07, LEVRE.y - .03], [LEVRE.z + .12, LEVRE.y - .09]];
  for(let th = TH0; th <= TH1 + 1e-6; th += .1) pts.push([RO.z + RW * Math.sin(th), RO.y + RW * Math.cos(th)]);
  const [zd, yd] = pts[pts.length - 1];
  for(let k = 1; k <= 6; k++){ const f = k / 6; pts.push([zd + .05 * f + .02 * f * f, yd + (NIVEAU - yd) * f]); }
  return pts;
}
function roueEtEau(g){
  /* tout le moulin est fait autour du moyeu (x = 0, z = 0 ; l'axe le long de x, l'eau tombe vers +z), puis posé à sa
     place et tourné vers l'avant (MOULIN) : vue de face par la caméra du jeu, une roue de profil ne se voyait pas */
  const {y, R, e} = RO, moulin = new THREE.Group(), roue = new THREE.Group();
  /* deux jantes faites de seize planches, huit rayons de chaque côté, seize aubes, le moyeu */
  for(const s of [-1, 1]){
    for(let k = 0; k < 16; k++){
      const a = (k + .5) / 16 * Math.PI * 2;
      planche(roue, k % 2 ? POTEAU2 : 0xB06C2E, .07, .1, 2 * Math.PI * (R - .04) / 16 + .025, s * e / 2, Math.cos(a) * (R - .04), Math.sin(a) * (R - .04), a, 0, 0);
    }
    for(let k = 0; k < 8; k++){ const a = (k + s * .25) / 8 * Math.PI * 2; planche(roue, CLAIR, .05, R - .1, .07, s * (e / 2 - .015), Math.cos(a) * (R / 2 - .02), Math.sin(a) * (R / 2 - .02), a, 0, 0); }
  }
  for(let k = 0; k < 16; k++){
    const a = k / 16 * Math.PI * 2;
    planche(roue, k % 2 ? CLAIR : ton2(k), e + .03, .19, .035, 0, Math.cos(a) * (R - .03), Math.sin(a) * (R - .03), a + .22, 0, 0);
  }
  const moyeu = ajoute(roue, part(G.cyl, POUTRE, .26, e + .1, .26, 0, 0, 0)); moyeu.rotation.z = Math.PI / 2;
  for(const s of [-1, 1]){ const c = ajoute(roue, part(G.cyl, FER, .16, .02, .16, s * (e / 2 + .05), 0, 0)); c.rotation.z = Math.PI / 2; }
  rassembler(roue);                                                  // une seule forme, qui tourne (laissée à part du reste du bâtiment)
  roue.position.y = y;
  roue.children.forEach(m => m.onBeforeRender = () => { roue.rotation.x = VENT.temps.value * OMEGA; roue.updateMatrixWorld(true); });
  moulin.add(roue);
  /* l'axe, qui entre dans le mur sur un palier de bois, et le petit pilier de pierres qui le porte */
  const axe = ajoute(moulin, part(G.cyl, FER, .07, .42, .07, .3, y, 0)); axe.rotation.z = Math.PI / 2;
  boite(moulin, POTEAU2, .1, .34, .32, .47, y, 0); boite(moulin, FER, .11, .06, .34, .47, y + .1, 0);
  for(let k = 0; k < 3; k++) [-.12, .1].forEach((dz, j) => pave(moulin, PIERRES[(k + j) % 4], .15, .17, .21, .29, .09 + k * .165, dz + (k % 2) * .05));
  boite(moulin, POTEAU2, .1, y - .5, .1, .29, .5 + (y - .5) / 2, 0);
  /* le bassin : un fond, des pierres tout autour, l'eau dedans ; devant, une encoche par où l'eau déborde */
  const za = -.5, zb = R + .22;
  boite(moulin, 0x5E6A6E, .34, .06, zb - za, 0, .04, (za + zb) / 2);
  for(let k = 0; za + k * .22 < zb; k++){
    const zz = za + .11 + k * .22;
    pave(moulin, PIERRES[k % 4], .13, .26, .21, -.23, .13, zz);
    if(zz > .26) pave(moulin, PIERRES[(k + 2) % 4], .1, .24, .21, .19, .12, zz);
  }
  for(const xx of [-.2, .19]) pave(moulin, PIERRES[1], .13, .22, .16, xx, .11, zb);
  pave(moulin, PIERRES[3], .32, .24, .16, 0, .12, za);
  const bassin = new THREE.PlaneGeometry(.36, zb - za).rotateX(-Math.PI / 2).translate(0, NIVEAU, (za + zb) / 2);
  eauMesh(moulin, bassin, eauMat("bassin"), 1);
  const deb = ruban([[zb - .08, NIVEAU + .005], [zb + .02, NIVEAU - .01], [zb + .07, .07], [zb + .1, .02]], 0, () => .2);
  eauMesh(moulin, deb.geo, eauMat("chute", deb.long));
  /* la goulotte : un caniveau de planches qui arrive par derrière, posé sur deux chevalets ; son bout fermé, derrière */
  const yf = LEVRE.y - .1, zf0 = -.6, zf1 = LEVRE.z, lf = zf1 - zf0, cz = (zf0 + zf1) / 2;
  boite(moulin, POTEAU2, .3, .05, lf, 0, yf - .06, cz);
  for(const s of [-1, 1]) boite(moulin, ton2(s + 1), .05, .16, lf, s * .14, yf + .02, cz);
  boite(moulin, ton2(2), .3, .2, .05, 0, yf + .02, zf0);
  for(const zz of [zf0 + .1]){
    boite(moulin, POTEAU2, .38, .07, .09, 0, yf - .12, zz);
    for(const s of [-1, 1]) planche(moulin, POTEAU2, .07, yf - .12, .08, s * .15, (yf - .12) / 2, zz, 0, 0, s * .05);
  }
  const canal = new THREE.PlaneGeometry(.24, lf).rotateX(-Math.PI / 2).translate(0, yf + .05, cz), uvc = canal.attributes.uv;
  for(let i = 0; i < uvc.count; i++) uvc.setY(i, (1 - uvc.getY(i)) * lf);
  eauMesh(moulin, canal, eauMat("canal"));
  /* la chute : deux nappes, l'une sur l'autre, qui ne filent pas tout à fait pareil ; sur la roue, l'écume des aubes */
  const chemin = cheminChute();
  const n1 = ruban(chemin, 0, f => .22 + .04 * f), n2 = ruban(chemin, 0, f => .15 + .07 * f, .025), nArc = Math.round((TH1 - TH0) / .1);
  eauMesh(moulin, n1.geo, eauMat("chute", n1.long, [n1.longs[3], n1.longs[3 + nArc], TH0, RW]));
  const m2 = eauMat("chute", n2.long); m2.opacity = .75;
  eauMesh(moulin, n2.geo, m2, 3).position.x = .01;
  /* au pied de la chute, l'écume qui bouillonne et des gouttes qui sautent : seize boules dessinées en une fois */
  const pied = chemin[chemin.length - 1][0], MOUSSE = toon({color: 0xFFFFFF, emissive: 0x2A3A40, transparent: true, opacity: .95});
  const bulles = new THREE.InstancedMesh(G.head, MOUSSE, 16), mB = new THREE.Matrix4(), pB = V(0, 0, 0), sB = V(1, 1, 1), qB = new THREE.Quaternion();
  bulles.castShadow = false; bulles.frustumCulled = false; bulles.renderOrder = 4;
  const bouge = () => {
    const t = VENT.temps.value;
    for(let k = 0; k < 16; k++){
      if(k < 7){                                                     // l'écume qui bouillonne, en rond autour du pied
        const a = k / 7 * Math.PI * 2, r = k ? .1 : 0, f = .75 + .25 * Math.sin(t * 7 + k * 1.7) + .1 * Math.sin(t * 13 + k * 3.4), s = (k ? .32 : .45) * f;
        pB.set(Math.cos(a) * r, NIVEAU + .01 * Math.sin(t * 9 + k), pied + Math.sin(a) * r * .8 - .02); sB.set(s, s * .55, s);
      } else {                                                       // les gouttes qui sautent et retombent
        const j = k - 7, tt = ((t * 1.6 + j * .37 + .11) % 1) * .55, y = NIVEAU + .02 + (1.3 + (j % 4) * .25) * tt - 4.9 * tt * tt;
        pB.set((j % 3 - 1) * .55 * tt, y, pied + (.35 + (j % 2) * .3) * tt); sB.setScalar(y > NIVEAU ? .1 * (1 - tt / .55 * .6) : .001);
      }
      bulles.setMatrixAt(k, mB.compose(pB, qB, sB));
    }
    bulles.instanceMatrix.needsUpdate = true;
  };
  bouge(); bulles.onBeforeRender = bouge;
  moulin.add(bulles);
  moulin.position.set(MOULIN.x, 0, MOULIN.z); moulin.rotation.y = MOULIN.tourne;
  g.add(moulin);
}

export function scierieNiveau2(g){
  corps2(g);
  pignon2(g, FACADE + .02, true);
  pignon2(g, N2.Z0 - .02, false);
  cheminee2(g, toit2(g));
  porte2(g);
  lanterne2(g);
  appentis2(g);
  tableScie(g);
  rondins2(g);
  roueEtEau(g);
}
