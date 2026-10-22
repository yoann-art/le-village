/* ================= La Scierie, niveau 1 =================
   D'après l'image de Yo (22 octobre 2026 ; étape 2.2), au plus près de l'image, ses défauts corrigés et ce qui manquait
   ajouté (choix de Yo) : une cabane de bois couleur miel sur un carré de 4 × 4 cases, le pignon tourné vers l'avant ;
   des murs de planches posées à l'horizontale entre de gros poteaux d'angle ; un toit de larges planches qui se
   chevauchent en deux rangs, son faîte rond et ses deux blocs ; dans le pignon, des planches debout, une lanterne de fer
   sur sa potence et une petite lucarne ronde (ajoutée) ; la porte de planches, ses pentures de fer et son anneau, sur
   une marche ; une fenêtre à croisillons, et une deuxième sur le côté (ajoutée) ; à droite, un appentis d'aplomb sur
   deux poteaux, des planches debout à l'abri ; devant à gauche, une pile de rondins ; devant à droite, deux tréteaux et
   la grande scie à deux poignées bien posée dessus (sur l'image elle flottait).
   Coordonnées : le milieu du carré en (0, 0), la façade de devant en z = FACADE (B.scierie.front), la porte en x = −0,5. */
import { P, G, part, toon } from "./formes.js";
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
