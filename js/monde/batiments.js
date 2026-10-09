/* ================= Bâtiments =================
   Les modèles 3D des 7 bâtiments (un par niveau, v1.10.4), et leur place sur l'île.
   Mesures de la bible : un étage fait 2 P, une porte 1,5 P.
   Chaque bâtiment tient dans son carré de cases (3 × 3 ou 4 × 4 P) ;
   sa façade avec la porte est tournée vers le bas de l'écran. */
import { P, G, part, roof } from "./formes.js";
import { scene } from "./scene.js";
import { H, idx } from "./ile.js";
import { B } from "../donnees.js";
import { state } from "../sauvegarde.js";
import { sizeOf, maxLvl } from "../regles.js";
import { VITRE, lanterne } from "./ciel.js";

const MUR = 2 * P, PORTE = 1.5 * P;
const C = {wall:0xF2E2C2, wood:0x8B5A3C, dark:0x654028, straw:0xDDB256, red:0xC8553D, white:0xF4EFE6, blue:0x4E6DB3, stone:0xAEB0B3, stone2:0x8E9195, gold:0xE2B24D, lit:0xF6D27A,
  miel:0xD9A55B, brut:0xA88B62, tuile:0xD9753F, ardoise:0x5E6E86, claire:0xD8D2C4, cuivre:0xC87533, cuir:0x8A5232, fer:0x4A4A50, lame:0xC8CCD2, fumee:0xE4E2DE, toile:0xF2E8D2,
  terre:0xB5653A, eau:0x6FB8D8, vert:0x6A9A4A};
const FLEURS = [0xE85A5A, 0xF2C14E, 0xF4F0E8, 0x9A7BD8];
const emberMat = new THREE.MeshLambertMaterial({color:0xFF7A2E, emissive:0xFF5A00, emissiveIntensity:.7});
/* Les lanternes des bâtiments et de la mine : une seule matière, qui brille plus fort la nuit (ciel.js) */
const LANTERNE = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});
lanterne(null, 0, 0, LANTERNE);

/* La façade est à 0,2 P du bord du carré de cases ; la place de la porte
   sur la façade est dans les données (B[type].door) */
const frontOf = type => sizeOf(type) / 2 - .2;

function door(g, x, z){
  g.add(part(G.box, C.dark, 1.14*P, PORTE + .07, .05, x, (PORTE + .07)/2, z + .01));
  g.add(part(G.box, C.wood, P, PORTE, .06, x, PORTE/2, z + .03));
  g.add(part(G.dode, C.gold, .09,.09,.09, x + .32, PORTE/2, z + .08));
}

/* ----- Petites pièces communes (y = le bas de la pièce) ----- */
const ajoute = (g, m) => { g.add(m); return m; };
const bloc = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y + h/2, z));
const poteau = (g, hex, x, z, h, y = 0, e = .12) => bloc(g, hex, e, h, e, x, y, z);
/* toit à deux pentes (faîte de gauche à droite) ; toit de chaume arrondi ; toit de planches en pente simple, plus bas devant */
const RANGS = {[C.tuile]: 0xB85E30, [C.red]: 0xA8422E, [C.ardoise]: 0x4A5870};
function pignon(g, hex, w, h, d, y, x = 0, z = 0){
  const m = ajoute(g, part(G.gable, hex, w, h, d, x, y, z));
  if(RANGS[hex] && w > 1){                                            // des rangs de tuiles (ou d'ardoises) sur la pente de devant
    const a = Math.atan2(h, d / 2), L = Math.hypot(h, d / 2), ny = d / 2 / L, nz = h / L;
    for(let k = 1; k < 5; k++){
      const f = k / 5, r = part(G.box, RANGS[hex], w - .04, .03, .05, x, y + h * f + .02 * ny, z + d / 2 * (1 - f) + .02 * nz);
      r.rotation.x = a; r.castShadow = false; g.add(r);
    }
  }
  return m;
}
const CHAUME = 0xB98E4C;
function chaume(g, w, h, d, y, x = 0, z = 0){
  const m = ajoute(g, part(G.vault, CHAUME, w, h, d, x, y, z));
  for(const [a, e] of [[0, h * .28], [.55, .07], [1.0, .07], [1.3, .07]]){            // le faîte, puis des rangs de paille, plus foncés
    ajoute(g, part(G.cyl, 0x9A7438, e, w + .02, e, x, y + h * Math.cos(a) - (a ? 0 : .03), z + d / 2 * Math.sin(a))).rotation.z = Math.PI / 2;
  }
  return m;
}
/* un toit de planches en pente simple, posé sur un mur de hauteur haut, plus bas devant */
function appentis(g, hex, w, d, haut, x = 0, z = 0){
  const a = .22, y = haut + d / 2 * Math.sin(a) + .06;
  const m = ajoute(g, part(G.box, hex, w, .12, d, x, y, z)); m.rotation.x = a;
  for(let k = 1; k * .45 < w - .1; k++){ const l = part(G.box, 0x4E3220, .03, .03, d, x - w / 2 + k * .45, y + .07, z); l.rotation.x = a; l.castShadow = false; g.add(l); }
  return m;
}
/* Une fenêtre : sa vitre s'allume la nuit (VITRE, ciel.js ; bible : « la nuit […] avec les fenêtres allumées ») ;
   avec des croisillons, des volets, plus petite */
function fenetre(g, x, y, z, {croix = false, volets = null, petite = false, cadre = C.dark} = {}){
  const w = petite ? .36 : .5;
  g.add(part(G.box, cadre, w, w, .04, x, y, z + .01));
  const v = part(G.box, VITRE, w - .12, w - .12, .05, x, y, z + .03); v.castShadow = false; g.add(v);
  if(croix){ g.add(part(G.box, cadre, .04, w - .12, .06, x, y, z + .04)); g.add(part(G.box, cadre, w - .12, .04, .06, x, y, z + .04)); }
  if(volets) for(const s of [-1, 1]) g.add(part(G.box, volets, .18, w, .04, x + s * (w/2 + .1), y, z + .02));
}
/* Une petite fente de tir (le fort) */
const fente = (g, x, y, z) => bloc(g, 0x2A2420, .1, .45, .04, x, y, z + .01);
/* De la fumée qui sort d'une cheminée */
function fumee(g, x, y, z){
  for(const [dx, dy, r] of [[0, 0, .2], [.1, .3, .16], [-.04, .56, .12]]){ const m = part(G.leaf, C.fumee, r * 2, r * 2, r * 2, x + dx, y + dy, z); m.castShadow = false; g.add(m); }
}
const cheminee = (g, hex, x, z, y0, h, e = .42) => { bloc(g, hex, e, h, e, x, y0, z); bloc(g, C.stone2, e + .08, .08, e + .08, x, y0 + h, z); fumee(g, x, y0 + h + .25, z); };
/* Une bûche couchée : le long de z (de l'arrière vers l'avant), ou de x (travers) */
function buche(g, x, y, z, l = 1, r = .13, travers = false){ const m = part(G.cyl, C.dark, r * 2, l, r * 2, x, y, z); if(travers) m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; return ajoute(g, m); }
function tonneau(g, x, z, y = 0, s = 1){
  g.add(part(G.cyl, C.miel, .4 * s, .55 * s, .4 * s, x, y + .275 * s, z));
  for(const h of [.14, .41]) g.add(part(G.cyl, C.fer, .42 * s, .04, .42 * s, x, y + h * s, z));
}
const caisse = (g, x, z, y = 0, s = .4) => bloc(g, C.wood, s, s, s, x, y, z);
/* des fruits (rouges, jaunes, verts) en petit tas */
function fruits(g, x, y, z){ [[0, 0, C.red], [.11, .02, 0xF2C14E], [-.1, .04, 0x8AC04E], [.02, .1, C.red]].forEach(([dx, dz, c], k) => g.add(part(G.leaf2, c, .26, .26, .26, x + dx, y + .07 + (k > 2 ? .08 : 0), z + dz))); }
/* Un pot ou une jardinière de fleurs */
function pot(g, x, z, y = 0){ g.add(part(G.cyl, C.terre, .24, .2, .24, x, y + .1, z)); g.add(part(G.leaf2, C.vert, .36, .26, .36, x, y + .26, z)); FLEURS.slice(0, 3).forEach((c, k) => g.add(part(G.leaf2, c, .1, .1, .1, x - .08 + k * .08, y + .36, z + .04))); }
function jardiniere(g, x, y, z, w = .55){ bloc(g, C.wood, w, .12, .14, x, y, z); for(let k = 0; k < 4; k++) g.add(part(G.leaf2, FLEURS[k], .12, .12, .12, x - w/2 + .1 + k * (w - .2) / 3, y + .16, z)); }
/* La lanterne accrochée au mur */
function lampe(g, x, y, z){ bloc(g, C.dark, .06, .06, .18, x, y + .2, z + .07); bloc(g, LANTERNE, .16, .2, .16, x, y, z + .16); }
const banniere = (g, hex, x, y, z, w = .36, h = .6) => { bloc(g, hex, w, h, .03, x, y, z); bloc(g, C.gold, w + .08, .05, .05, x, y + h, z); };
/* Des créneaux sur le haut d'un mur (devant, sur les côtés) */
function creneaux(g, hex, w, d, y, x = 0, z = 0){
  const n = Math.round(w / .5), m = Math.round(d / .5);
  for(let k = 0; k < n; k++) bloc(g, hex, .24, .24, .2, x - w/2 + .12 + k * (w - .24) / (n - 1), y, z + d/2 - .1);
  for(let k = 1; k < m; k++) for(const s of [-1, 1]) bloc(g, hex, .2, .24, .24, x + s * (w/2 - .1), y, z + d/2 - .12 - k * (d - .24) / (m - 1));
}
function tour(g, x, z, h, r, toit = C.blue, dore = false){
  g.add(part(G.cyl, C.stone, r * 2, h, r * 2, x, h / 2, z));
  g.add(part(G.cone, toit, r * 2.6, r * 2.2, r * 2.6, x, h + r * 1.1, z));
  if(dore) g.add(part(G.leaf2, C.gold, .2, .2, .2, x, h + r * 2.2 + .05, z));
}
/* Une roue à eau, avec la goulotte qui lui amène l'eau ; tournée de biais pour qu'on la voie bien de la caméra */
function roue(g, x, y, z, r){
  const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = -.8;
  const t = part(G.tore, C.dark, r * 2, r * 2, r * 2, 0, 0, 0); t.rotation.y = Math.PI / 2; w.add(t);
  for(let k = 0; k < 8; k++){ const a = k * Math.PI / 4, p = part(G.box, C.wood, .3, .26, .05, 0, Math.sin(a) * r, Math.cos(a) * r); p.rotation.x = Math.PI / 2 - a; w.add(p); }
  for(let k = 0; k < 4; k++){ const s = part(G.box, C.dark, .05, r * 2, .05, 0, 0, 0); s.rotation.x = k * Math.PI / 4; w.add(s); }
  const moyeu = part(G.cyl, C.dark, .18, .4, .18, 0, 0, 0); moyeu.rotation.z = Math.PI / 2; w.add(moyeu);
  w.add(part(G.box, C.miel, .3, .14, r * 1.4, 0, r + .13, -r * .7));              // la goulotte
  w.add(part(G.box, C.eau, .2, .04, r * 1.4, 0, r + .22, -r * .7));
  g.add(w);
}
/* Une petite grue de bois : un mât, un bras vers la gauche (−x), et ce qu'elle soulève au bout de sa corde */
function grue(g, x, z, h, bras, charge){
  poteau(g, C.dark, x, z, h, 0, .14);
  bloc(g, C.dark, bras, .1, .1, x - bras / 2, h - .2, z);
  const jambe = part(G.box, C.dark, .07, bras * .9, .07, x - bras * .3, h - .2 - bras * .3, z); jambe.rotation.z = -Math.PI / 4; g.add(jambe);
  bloc(g, 0xE8DCC0, .025, .55, .025, x - bras + .05, h - .8, z);                     // la corde
  charge(x - bras + .05, h - .8, z);
}
function enclume(g, x, y, z){
  bloc(g, C.fer, .14, .14, .12, x, y, z); bloc(g, C.fer, .4, .13, .18, x, y + .14, z);
  const c = part(G.cone, C.fer, .14, .2, .14, x + .27, y + .2, z); c.rotation.z = -Math.PI / 2; g.add(c);
}

/* ----- Les 7 bâtiments, à chaque niveau (demande de Yo, v1.10.4) -----
   D'après les prompts de la page des prompts : niveau 1 modeste (bois brut, chaume ou planches), niveau 2 solide (base
   de pierre, tuiles, les outils du métier), niveau 3 prospère (pierre taillée, un étage, bannières, détails dorés).
   Même place au sol à chaque niveau : le bâtiment grandit en hauteur et en richesse. Façade à frontOf (1,3 P pour un
   bâtiment de 3 × 3, 1,8 P pour 4 × 4), porte posée ensuite par makeBuilding. g.userData.toit : où se posent les
   oiseaux (sur le faîte). */
const BUILD = {
  scierie(g, n){                                     // porte à −0,45
    if(n === 1){
      bloc(g, C.brut, 2.2, 1.8, 2.2, -.35, 0, .2);
      for(const x of [-1.25, .68]) bloc(g, C.dark, .07, 1.8, .05, x, 0, 1.31);
      appentis(g, C.dark, 2.5, 2.6, 1.8, -.35, .2);
      fenetre(g, .4, 1.1, 1.3, {petite: true});
      for(const z of [.75, 1.3]){                                                        // deux tréteaux, la grande scie
        for(const x of [1.0, 1.26]) poteau(g, C.dark, x, z, .5, 0, .06);
        bloc(g, C.dark, .4, .06, .08, 1.13, .5, z);
      }
      buche(g, 1.13, .68, 1.02, .9, .13);
      bloc(g, C.lame, .03, .2, .55, 1.13, .82, 1.02); bloc(g, C.wood, .06, .12, .16, 1.13, .92, 1.38);
      buche(g, 1.12, .12, .25, .5, .12, true); buche(g, 1.12, .12, .02, .5, .12, true); buche(g, 1.12, .34, .14, .5, .12, true);
      g.userData.toit = 2.1;
    } else if(n === 2){
      bloc(g, C.miel, 2.2, MUR, 2.4, -.35, 0, .1);
      for(const x of [-1.4, .7]) poteau(g, C.dark, x, 1.28, MUR);
      bloc(g, C.dark, 2.24, .1, .06, -.35, 1.88, 1.31);
      pignon(g, C.tuile, 2.4, 1.1, 2.8, MUR, -.35, .1);
      fenetre(g, .38, 1.15, 1.3, {croix: true});
      roue(g, 1.06, .62, .45, .55);
      bloc(g, C.miel, .5, .48, .3, 1.2, 0, 1.32);                                       // l'établi et sa scie ronde
      ajoute(g, part(G.cyl, C.lame, .42, .03, .42, 1.2, .62, 1.32)).rotation.z = Math.PI / 2;
      buche(g, -1.25, .1, 1.42, .4, .1, true); buche(g, -1.25, .1, 1.22, .4, .1, true); buche(g, -1.25, .28, 1.32, .4, .1, true);
      g.userData.toit = 3.05;
    } else {
      bloc(g, C.claire, 2.3, 1.0, 2.5, -.35, 0, .05);
      bloc(g, C.miel, 2.2, 1.9, 2.4, -.35, 1.0, .1);
      bloc(g, C.dark, 2.34, .1, .08, -.35, .95, 1.31); bloc(g, C.dark, 2.24, .1, .06, -.35, 2.8, 1.31);
      for(const x of [-1.4, .7]) poteau(g, C.dark, x, 1.28, 1.9, 1.0);
      pignon(g, C.tuile, 2.4, 1.2, 2.8, 2.9, -.35, .1);
      bloc(g, C.miel, .56, .5, .5, -.35, 2.95, .98); pignon(g, C.tuile, .74, .32, .66, 3.45, -.35, .98);   // la lucarne
      fenetre(g, -.35, 3.2, 1.23, {petite: true});
      fenetre(g, -1.0, 2.2, 1.3, {croix: true}); fenetre(g, .3, 2.2, 1.3, {croix: true}); fenetre(g, .4, 1.15, 1.3, {croix: true});
      bloc(g, C.miel, .8, .3, .04, -.45, 1.66, 1.33); bloc(g, C.lame, .56, .1, .03, -.45, 1.76, 1.36);   // l'enseigne : une scie
      bloc(g, C.dark, .12, .14, .04, -.8, 1.74, 1.36);
      roue(g, 1.08, .8, .3, .68);
      grue(g, 1.3, 1.42, 2.6, .7, (x, y, z) => buche(g, x, y - .1, z, .55, .12, true));
      g.userData.toit = 4.05;
    }
  },
  carriere(g, n){                                    // porte à −0,45
    if(n === 1){
      bloc(g, C.brut, 2.0, 1.7, 1.9, -.45, 0, .35);
      for(const x of [-1.3, .4]) bloc(g, C.dark, .07, 1.7, .05, x, 0, 1.31);
      appentis(g, C.dark, 2.3, 2.3, 1.7, -.45, .35);
      g.add(part(G.dode, C.stone, .6, .5, .6, 1.0, .22, -.6)); g.add(part(G.dode, C.stone2, .45, .38, .45, 1.15, .18, .05)); g.add(part(G.dode, C.stone, .34, .3, .34, .95, .55, -.5));
      ajoute(g, part(G.cyl, C.wood, .06, .9, .06, .72, .45, .95)).rotation.z = .25;        // la pioche contre le mur, le seau
      bloc(g, C.fer, .36, .06, .07, .62, .82, .95);
      g.add(part(G.cyl, C.stone2, .26, .26, .26, 1.0, .13, 1.12));
      g.userData.toit = 2.0;
    } else if(n === 2){
      bloc(g, C.miel, 2.0, MUR, 2.0, -.45, 0, .3);
      for(const x of [-1.42, .52]) poteau(g, C.dark, x, 1.28, MUR);
      pignon(g, C.ardoise, 2.3, 1.0, 2.4, MUR, -.45, .3);
      for(const [x, y, z] of [[1.05, 0, 1.0], [1.05, .4, 1.0], [1.05, 0, .55]]) bloc(g, C.claire, .4, .38, .4, x, y, z);   // des blocs taillés
      g.add(part(G.dode, C.stone, .9, .75, .9, 1.0, .32, -.75)); g.add(part(G.dode, C.stone2, .7, .55, .7, .25, .25, -1.15));
      for(const [x, y, z] of [[.68, .45, -.5], [1.22, .58, -.55], [.95, .7, -.45]]) g.add(part(G.dode, C.cuivre, .17, .13, .17, x, y, z));   // les veines de cuivre
      lampe(g, .35, 1.5, 1.3);
      g.userData.toit = 2.95;
    } else {
      bloc(g, C.claire, 2.1, 1.1, 2.1, -.45, 0, .25);
      bloc(g, C.miel, 2.0, 1.3, 2.0, -.45, 1.1, .3);
      bloc(g, C.dark, 2.14, .1, .08, -.45, 1.05, 1.31);
      pignon(g, C.ardoise, 2.3, 1.1, 2.4, 2.4, -.45, .3);
      fenetre(g, -1.0, 1.95, 1.3, {croix: true}); fenetre(g, .25, 1.95, 1.3, {croix: true});
      lampe(g, -1.22, 1.3, 1.3); lampe(g, .32, 1.3, 1.3);
      for(const x of [.92, 1.28]) bloc(g, C.fer, .05, .05, 1.7, x, 0, .55);              // les rails et le wagonnet
      for(const z of [-.15, .35, .85, 1.3]) bloc(g, C.dark, .52, .03, .1, 1.1, 0, z);
      bloc(g, C.dark, .42, .28, .55, 1.1, .1, .75);
      for(const z of [.55, .95]) ajoute(g, part(G.cyl, C.fer, .14, .46, .14, 1.1, .1, z)).rotation.z = Math.PI / 2;
      g.add(part(G.dode, C.stone, .3, .22, .3, 1.05, .42, .68)); g.add(part(G.dode, C.cuivre, .18, .14, .18, 1.18, .44, .86));
      grue(g, 1.25, -.85, 2.3, .55, (x, y, z) => bloc(g, C.claire, .34, .34, .34, x, y - .45, z));
      for(const x of [.75, 1.15]) bloc(g, C.claire, .36, .36, .36, x, 0, -1.3);          // des blocs bien alignés
      g.userData.toit = 3.45;
    }
  },
  forge(g, n){                                       // porte à −0,4
    if(n === 1){
      bloc(g, C.stone2, 2.0, 1.7, 1.9, -.4, 0, .35);
      for(const [x, y] of [[-1.2, .45], [.35, 1.2], [-1.15, 1.35], [.4, .4]]) g.add(part(G.dode, C.stone, .3, .22, .1, x, y, 1.31));
      appentis(g, C.dark, 2.3, 2.3, 1.7, -.4, .35);
      cheminee(g, C.stone, -1.0, -.25, 1.5, .9, .36);
      for(const z of [.5, 1.3]) poteau(g, C.dark, 1.38, z, 1.35, 0, .08);                 // l'auvent sur le foyer
      appentis(g, C.dark, .95, 1.05, 1.35, 1.05, .9);
      bloc(g, C.stone, .55, .3, .55, 1.02, 0, .9); bloc(g, emberMat, .4, .06, .4, 1.02, .3, .9);
      g.add(part(G.cyl, C.wood, .3, .38, .3, 1.05, .19, -.45));                          // l'enclume sur sa souche
      enclume(g, 1.0, .38, -.45);
      g.userData.toit = 1.95;
    } else if(n === 2){
      bloc(g, C.stone, 2.3, MUR, 2.4, -.15, 0, .1);
      for(const x of [-1.3, 1.0]) g.add(part(G.cyl, C.stone, .3, MUR, .3, x, MUR / 2, 1.2));   // les angles arrondis
      pignon(g, C.ardoise, 2.35, 1.0, 2.8, MUR, -.15, .1);
      cheminee(g, C.stone2, .55, -.45, 1.7, 1.9, .5);
      bloc(g, emberMat, .6, .45, .05, .6, .5, 1.31);
      g.add(part(G.cyl, C.wood, .3, .38, .3, 1.27, .19, .95)); enclume(g, 1.22, .38, .95);
      g.add(part(G.cyl, C.wood, .42, .3, .42, 1.27, .15, .3)); g.add(part(G.cyl, C.eau, .34, .02, .34, 1.27, .3, .3));   // le baquet d'eau
      g.userData.toit = 2.95;
    } else {
      bloc(g, C.stone, 2.5, 2.4, 2.5, -.2, 0, .05);
      for(const x of [-1.45, 1.05]) g.add(part(G.cyl, C.claire, .36, 2.4, .36, x, 1.2, 1.25));
      bloc(g, C.claire, 2.56, .14, .1, -.2, 2.3, 1.31);
      pignon(g, C.ardoise, 2.65, 1.1, 2.9, 2.4, -.2, .05);
      cheminee(g, C.stone2, -1.0, -.5, 2.4, 1.7, .44); cheminee(g, C.stone2, .6, -.5, 2.4, 1.7, .44);
      bloc(g, emberMat, .7, .6, .05, .62, .35, 1.31);
      fenetre(g, -1.05, 1.9, 1.3, {croix: true}); fenetre(g, .62, 1.9, 1.3, {croix: true});
      bloc(g, C.fer, .74, .4, .04, -.4, 1.78, 1.33);                                    // l'enseigne en fer forgé : une enclume
      bloc(g, C.claire, .42, .08, .02, -.4, 1.94, 1.36); bloc(g, C.claire, .12, .1, .02, -.4, 1.84, 1.36); bloc(g, C.claire, .3, .06, .02, -.4, 1.8, 1.36);
      bloc(g, C.cuir, .36, .24, .6, 1.27, .4, -.45);                                    // le gros soufflet de cuir
      ajoute(g, part(G.cone, C.fer, .12, .3, .12, 1.27, .52, .0)).rotation.x = Math.PI / 2;
      bloc(g, C.dark, .06, .06, .5, 1.27, .64, -.9);
      for(const z of [.4, 1.3]) poteau(g, C.dark, 1.3, z, 1.15, 0, .08);                  // le râtelier : épées et bouclier
      bloc(g, C.dark, .08, .08, 1.0, 1.3, 1.1, .85);
      for(const z of [.6, .82, 1.04]){ bloc(g, C.lame, .04, .8, .07, 1.3, .2, z); bloc(g, C.gold, .05, .04, .2, 1.3, .95, z); }
      ajoute(g, part(G.cyl, C.red, .42, .05, .42, 1.3, .55, 1.42)).rotation.x = Math.PI / 2;
      g.add(part(G.leaf2, C.gold, .12, .12, .12, 1.3, .55, 1.46));
      g.userData.toit = 3.45;
    }
  },
  chaumiere(g, n){                                   // porte au milieu
    if(n === 1){
      bloc(g, C.miel, 2.3, 1.7, 2.3, 0, 0, .15);
      for(const y of [.3, .7, 1.1, 1.5]) for(const x of [-.86, .86]){                       // les rondins, de part et d'autre de la porte
        ajoute(g, part(G.cyl, 0xB8843F, .12, .56, .12, x, y, 1.31)).rotation.z = Math.PI / 2;
      }
      g.add(roof(CHAUME, 2.3, 1.0, 1.7, 0, .15));
      fenetre(g, .8, 1.05, 1.3, {petite: true});
      g.add(part(G.cyl, C.wood, .36, .34, .36, 1.32, .17, .95)); g.add(part(G.cyl, 0xE8C890, .3, .02, .3, 1.32, .35, .95));   // la souche
      g.userData.toit = 2.55;
    } else if(n === 2){
      bloc(g, C.wall, 2.6, MUR, 2.6, 0, 0, 0);
      for(const x of [-1.27, 1.27]) poteau(g, C.miel, x, 1.28, MUR);
      bloc(g, C.miel, 2.64, .1, .06, 0, 1.9, 1.31);
      chaume(g, 3.0, 1.5, 3.0, 1.95);
      cheminee(g, C.stone2, .8, -.6, 2.4, 1.2, .4);
      fenetre(g, -.85, 1.2, 1.3, {croix: true}); fenetre(g, .85, 1.2, 1.3, {croix: true});
      pot(g, -1.05, 1.42); pot(g, 1.05, 1.42);
      g.userData.toit = 3.35;
    } else {
      bloc(g, C.claire, 2.6, 1.3, 2.6, 0, 0, 0);
      bloc(g, C.wall, 2.7, 1.5, 2.6, 0, 1.3, 0);
      bloc(g, C.miel, 2.74, .1, .08, 0, 1.28, 1.31); bloc(g, C.miel, 2.74, .1, .06, 0, 2.72, 1.31);
      for(const x of [-1.32, -.42, .42, 1.32]) poteau(g, C.miel, x, 1.3, 1.5, 1.3, .1);
      chaume(g, 3.1, 1.4, 3.0, 2.75);
      bloc(g, C.wall, .72, .55, .5, 0, 2.95, 1.0); pignon(g, CHAUME, .92, .42, .72, 3.48, 0, 1.0);   // la lucarne
      fenetre(g, 0, 3.2, 1.25, {petite: true, croix: true});
      cheminee(g, C.stone2, 1.0, -.7, 2.75, 1.85, .5);
      for(const x of [-.85, .85]) fenetre(g, x, .75, 1.3, {croix: true, volets: C.red});
      for(const x of [-.86, .86]){ fenetre(g, x, 2.1, 1.3, {croix: true, volets: C.red}); jardiniere(g, x, 1.72, 1.38); }
      bloc(g, C.miel, .6, .07, .2, .95, .3, 1.4);                                       // un petit banc
      for(const x of [.72, 1.18]) bloc(g, C.dark, .06, .3, .16, x, 0, 1.4);
      g.userData.toit = 4.1;
    }
  },
  marche(g, n){                                      // porte au milieu
    if(n === 1){
      bloc(g, C.brut, 2.6, 1.8, 2.4, 0, 0, .6);
      for(const x of [-1.15, 1.15]) bloc(g, C.dark, .07, 1.8, .05, x, 0, 1.81);
      appentis(g, C.dark, 2.9, 2.8, 1.8, 0, .6);
      fenetre(g, .85, 1.1, 1.8, {petite: true});
      bloc(g, C.brut, .5, .5, 1.0, 1.66, 0, .9);                                        // l'étal sous sa toile
      for(const z of [.42, 1.38]) poteau(g, C.dark, 1.88, z, 1.3, 0, .07);
      ajoute(g, part(G.box, C.toile, .7, .05, 1.15, 1.68, 1.32, .9)).rotation.z = -.25;
      fruits(g, 1.62, .5, .7); fruits(g, 1.66, .5, 1.12);
      caisse(g, -1.62, 1.25, 0, .42); caisse(g, -1.66, .7, 0, .38); caisse(g, -1.62, 1.25, .42, .34);
      fruits(g, -1.62, .76, 1.25);
      g.userData.toit = 2.15;
    } else if(n === 2){
      bloc(g, C.wall, 2.8, MUR, 2.6, 0, 0, .5);
      for(const x of [-1.38, 1.38]) poteau(g, C.miel, x, 1.78, MUR);
      pignon(g, C.tuile, 3.1, 1.2, 3.0, MUR, 0, .5);
      for(let k = 0; k < 6; k++) g.add(part(G.box, k % 2 ? C.white : C.red, 2.8/6, .06, .55, -1.4 + 2.8/12 + k * 2.8/6, 1.85, 2.03));
      fenetre(g, -.9, 1.15, 1.8, {croix: true}); fenetre(g, .9, 1.15, 1.8, {croix: true});
      for(const s of [-1, 1]){                                                            // un étal de chaque côté
        bloc(g, C.miel, .46, .55, 1.0, s * 1.68, 0, .8);
        for(let k = 0; k < 4; k++) ajoute(g, part(G.box, k % 2 ? C.white : C.red, .5, .05, .28, s * 1.68, 1.25, .38 + k * .28)).rotation.z = s * .3;
        for(const z of [.35, 1.25]) poteau(g, C.dark, s * 1.9, z, 1.3, 0, .06);
      }
      fruits(g, -1.68, .55, .6); fruits(g, -1.68, .55, 1.0);
      bloc(g, 0x6A8AC8, .3, .1, .36, 1.68, .55, .6); bloc(g, 0xC8553D, .3, .1, .36, 1.68, .65, .62); bloc(g, 0xE8C860, .3, .1, .36, 1.68, .55, 1.05);   // des étoffes pliées
      tonneau(g, -1.7, 1.62); caisse(g, 1.68, 1.62, 0, .36);
      g.userData.toit = 3.15;
    } else {
      bloc(g, C.claire, 3.0, 1.1, 2.8, 0, 0, .4);
      bloc(g, C.miel, 3.0, 1.3, 2.8, 0, 1.1, .4);
      bloc(g, C.dark, 3.04, .1, .08, 0, 1.05, 1.81);
      pignon(g, C.tuile, 3.3, 1.3, 3.2, 2.4, 0, .4);
      bloc(g, C.miel, .5, .6, .5, 0, 3.5, .4); g.add(roof(C.tuile, .5, .5, 4.1, 0, .4));    // le clocheton et son horloge
      g.add(part(G.leaf2, C.gold, .14, .14, .14, 0, 4.66, .4));
      ajoute(g, part(G.cyl, C.white, .36, .03, .36, 0, 3.8, .66)).rotation.x = Math.PI / 2;
      bloc(g, C.dark, .03, .14, .02, 0, 3.8, .68); bloc(g, C.dark, .1, .03, .02, .04, 3.8, .68);
      fenetre(g, -.9, 2.0, 1.8, {croix: true}); fenetre(g, .9, 2.0, 1.8, {croix: true});
      for(let k = 0; k < 6; k++) g.add(part(G.box, k % 2 ? C.white : C.red, 3.0/6, .06, .55, -1.5 + 3.0/12 + k * 3.0/6, 1.7, 2.03));
      for(let k = 0; k < 7; k++){                                                         // les fanions
        const f = part(G.cone4, [C.red, C.gold, C.blue][k % 3], .22, .26, .06, -1.35 + k * .45, 2.25, 1.86); f.rotation.x = Math.PI; g.add(f);
      }
      bloc(g, C.dark, 2.9, .02, .02, 0, 2.37, 1.86);
      for(const s of [-1, 1]){
        bloc(g, C.miel, .44, .55, 1.0, s * 1.75, 0, .6);
        for(let k = 0; k < 4; k++) ajoute(g, part(G.box, k % 2 ? C.white : C.red, .48, .05, .28, s * 1.75, 1.25, .18 + k * .28)).rotation.z = s * .3;
        for(const z of [.15, 1.05]) poteau(g, C.dark, s * 1.95, z, 1.3, 0, .06);
      }
      fruits(g, -1.75, .55, .4); fruits(g, -1.75, .55, .8); bloc(g, 0x6A8AC8, .3, .1, .36, 1.75, .55, .4); bloc(g, 0xE8C860, .3, .1, .36, 1.75, .55, .82);
      poteau(g, C.gold, 1.75, 1.6, 1.0, 0, .07);                                        // la grande balance dorée
      bloc(g, C.gold, .6, .05, .05, 1.75, 1.0, 1.6);
      for(const s of [-1, 1]) g.add(part(G.cyl, C.gold, .24, .03, .24, 1.75 + s * .27, .78, 1.6));
      tonneau(g, -1.75, 1.6);
      g.userData.toit = 3.65;
    }
  },
  taverne(g, n){                                     // porte au milieu
    if(n === 1){
      bloc(g, C.miel, 3.0, 1.9, 2.8, 0, 0, .4);
      g.add(roof(CHAUME, 3.0, 1.2, 1.9, 0, .4));
      fenetre(g, .95, 1.1, 1.8, {croix: true});
      bloc(g, C.wood, .5, .34, .04, -.98, 1.0, 1.83);                                    // l'enseigne : une chope peinte
      bloc(g, C.white, .13, .16, .02, -1.0, 1.09, 1.86); bloc(g, C.white, .04, .08, .02, -.91, 1.13, 1.86);
      bloc(g, C.wood, .22, .07, .7, -1.75, .3, 1.2);                                      // un banc et un tonneau
      for(const z of [.95, 1.45]) bloc(g, C.dark, .16, .3, .06, -1.75, 0, z);
      tonneau(g, 1.75, 1.45);
      g.userData.toit = 2.95;
    } else if(n === 2){
      bloc(g, C.wall, 3.3, MUR, 3.2, 0, 0, .2);
      for(const x of [-1.63, -.85, .85, 1.63]) poteau(g, C.miel, x, 1.79, MUR, 0, .1);
      bloc(g, C.miel, 3.34, .1, .06, 0, 1.0, 1.81); bloc(g, C.miel, 3.34, .1, .06, 0, 1.92, 1.81);
      pignon(g, C.red, 3.6, 1.5, 3.6, MUR, 0, .2);
      cheminee(g, C.stone2, 1.0, -.6, 1.9, 1.8, .45);
      fenetre(g, -1.25, 1.42, 1.8, {croix: true}); fenetre(g, 1.25, 1.42, 1.8, {croix: true});
      bloc(g, C.wood, .3, .38, .04, -.79, .95, 1.83); bloc(g, C.gold, .12, .16, .02, -.8, 1.06, 1.86); bloc(g, C.gold, .04, .08, .02, -.72, 1.1, 1.86);   // l'enseigne
      tonneau(g, -1.83, 1.55); tonneau(g, 1.83, 1.55); tonneau(g, 1.83, 1.1);
      g.userData.toit = 3.45;
    } else {
      bloc(g, C.claire, 3.4, 1.4, 3.0, 0, 0, .3);
      bloc(g, C.wall, 3.5, 1.6, 3.0, 0, 1.4, .3);
      for(const x of [-1.72, -.6, .6, 1.72]) poteau(g, C.miel, x, 1.8, 1.6, 1.4, .1);
      bloc(g, C.miel, 3.54, .1, .08, 0, 1.38, 1.81); bloc(g, C.miel, 3.54, .1, .06, 0, 2.92, 1.81);
      pignon(g, C.red, 3.8, 1.5, 3.4, 3.0, 0, .3);
      cheminee(g, C.stone2, -1.1, -.6, 3.0, 1.7, .42); cheminee(g, C.stone2, 1.1, -.6, 3.0, 1.7, .42);
      fenetre(g, -1.15, .8, 1.8, {croix: true}); fenetre(g, 1.15, .8, 1.8, {croix: true});
      for(const x of [-1.2, 0, 1.2]) fenetre(g, x, 2.3, 1.8, {croix: true});
      bloc(g, C.miel, 1.3, .08, .34, 0, 1.75, 1.97);                                      // le balcon fleuri
      for(const x of [-.6, -.2, .2, .6]) bloc(g, C.dark, .05, .3, .05, x, 1.83, 2.1);
      bloc(g, C.dark, 1.3, .05, .06, 0, 2.12, 2.1);
      pot(g, -.42, 1.98, 1.83); pot(g, .42, 1.98, 1.83);
      bloc(g, C.gold, .9, .35, .04, 0, 3.25, 2.03);                                       // la grande enseigne dorée, sur le pignon
      g.add(part(G.cyl, C.gold, .26, .3, .26, 0, 3.86, 2.08)); g.add(part(G.cyl, C.white, .24, .06, .24, 0, 4.04, 2.08));
      g.add(part(G.tore, C.gold, .26, .26, .26, .17, 3.86, 2.08));
      g.add(part(G.cyl, C.miel, .32, .04, .32, -1.86, .5, 1.1)); poteau(g, C.dark, -1.86, 1.1, .5, 0, .06);   // la terrasse
      tonneau(g, 1.86, 1.55, 0, .9); tonneau(g, 1.86, 1.05, 0, .9);
      g.userData.toit = 4.45;
    }
  },
  chateau(g, n){                                     // porte au milieu
    if(n === 1){
      bloc(g, C.stone, 3.2, 1.8, 2.8, 0, 0, .4);
      creneaux(g, C.stone, 3.2, 2.8, 1.8, 0, .4);
      bloc(g, C.stone2, 2.8, .03, 2.4, 0, 1.8, .4);                                      // le chemin de ronde
      tour(g, -1.3, -.7, 3.0, .55);
      banniere(g, C.red, -1.3, 1.9, -.13);
      fente(g, -1.0, 1.0, 1.8); fente(g, 1.0, 1.0, 1.8);
      g.userData.toit = 1.95;
    } else if(n === 2){
      bloc(g, C.stone, 2.8, 2.4, 2.8, 0, 0, .4);
      bloc(g, C.stone2, 2.95, .18, 2.95, 0, 2.36, .4);
      for(const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tour(g, sx * 1.45, .4 + sz * 1.3, 3.2, .45);
      banniere(g, C.red, -.95, 1.6, 1.82, .34, .5); banniere(g, C.red, .95, 1.6, 1.82, .34, .5);
      poteau(g, C.dark, 0, .4, 1.2, 2.5, .06); bloc(g, C.red, .6, .36, .03, .3, 3.3, .4);
      g.userData.toit = 2.6;
    } else {
      bloc(g, C.stone, 3.0, 2.4, 2.6, 0, 0, .5);
      creneaux(g, C.stone, 3.0, 2.6, 2.4, 0, .5);
      bloc(g, C.stone2, 2.6, .03, 2.2, 0, 2.4, .5);
      bloc(g, C.stone, 1.6, 2.0, 1.6, 0, 2.4, .1);                                         // le donjon
      creneaux(g, C.stone, 1.6, 1.6, 4.4, 0, .1);
      g.add(roof(C.blue, 1.2, 1.0, 4.4, 0, .1)); g.add(part(G.leaf2, C.gold, .22, .22, .22, 0, 5.45, .1));
      fenetre(g, -.4, 3.4, .9, {cadre: C.gold}); fenetre(g, .4, 3.4, .9, {cadre: C.gold});
      for(const [x, z] of [[-1.5, -.65], [1.5, -.65], [-1.5, 1.45], [1.5, 1.45]]) tour(g, x, z, 3.3, .48, C.blue, true);
      banniere(g, C.red, -1.5, 1.8, 1.95, .32, .55); banniere(g, C.red, 1.5, 1.8, 1.95, .32, .55);
      banniere(g, C.red, -.5, 2.5, .91, .3, .45); banniere(g, C.red, .5, 2.5, .91, .3, .45);
      fenetre(g, -.8, 1.45, 1.8, {croix: true, cadre: C.gold}); fenetre(g, .8, 1.45, 1.8, {croix: true, cadre: C.gold});   // les vitraux
      for(const [x, c] of [[-.8, C.red], [.8, C.blue]]) bloc(g, c, .38, .08, .02, x, 1.74, 1.84);
      bloc(g, C.wood, 1.1, .06, .55, 0, 0, 2.07);                                          // le petit pont-levis
      for(const x of [-.45, .45]) ajoute(g, part(G.box, C.fer, .03, 1.75, .03, x, .85, 2.06)).rotation.x = -.3;
      g.userData.toit = 2.55;
    }
  }
};
/* L'entrée de la mine (étape 1.5) : une colline de roche arrondie, une ouverture étayée de bois,
   des rails qui en sortent et une lanterne ; pas de porte, on entre dans le noir */
BUILD.mine = g => {
  const f = frontOf("mine");
  g.add(part(G.dode, 0x8E8578, 3.3, 2.3, 3, 0, .75, -.15));                         // la colline
  g.add(part(G.dode, 0x7A7268, 1.6, 1.3, 1.5, -.9, 1.5, -.5));
  g.add(part(G.dode, 0x9A9184, 1.2, 1, 1.2, 1, 1.35, -.3));
  g.add(part(G.leaf, 0x5E9F4E, 1.1, .45, 1, -.5, 2.05, -.4));                        // de la mousse sur le dessus
  g.add(part(G.leaf2, 0x6CB35A, 1, .5, 1, .8, 1.85, -.1));
  g.add(part(G.box, 0x1A1410, 1.3, 1.45, .5, 0, .72, f - .2));                       // l'ouverture, dans le noir
  g.add(part(G.cyl, 0x1A1410, 1.3, .5, 1.3, 0, 1.45, f - .2));
  for(const x of [-.75, .75]) g.add(part(G.box, C.dark, .18, 1.75, .2, x, .87, f));   // l'étai de bois
  g.add(part(G.box, C.dark, 1.75, .2, .24, 0, 1.75, f));
  for(const x of [-.3, .3]) g.add(part(G.box, 0x6F7884, .06, .05, 1.1, x, .03, f + .2));   // les rails qui sortent
  g.add(part(G.cyl, C.dark, .06, 1.3, .06, 1.15, .65, f + .15));                      // la lanterne
  g.add(part(G.box, LANTERNE, .2, .24, .2, 1.15, 1.2, f + .15));
};
/* L'orée de la Forêt profonde (étape 1.7), au bout du pont : un bout de terre moussue sur l'eau, de grands arbres
   sombres et une arche de bois ; on passe dessous pour entrer dans la forêt */
BUILD.foret = g => {
  const f = frontOf("foret");
  g.add(part(G.box, 0x3E6B34, 3, .3, 3, 0, -.13, 0));                               // la terre moussue
  for(const [x, z, s] of [[-1.05, -.6, 1.15], [1.05, -.5, 1.05], [0, -1.15, 1.3], [-1.2, .55, .8], [1.2, .6, .85]]){
    g.add(part(G.trunk, 0x5A4632, 2.4 * s, 2.8 * s, 2.4 * s, x, .75 * s, z));
    g.add(part(G.leaf, 0x2E6A34, 2.3 * s, 2.3 * s, 2.3 * s, x, 2.2 * s, z));
    g.add(part(G.leaf2, 0x3A7A3A, 2.2 * s, 2 * s, 2.2 * s, x + .1, 2.9 * s, z));
  }
  for(const x of [-.62, .62]) g.add(part(G.cyl, 0x6B4A2F, .18, 1.9, .18, x, .95, f - .05));   // l'arche
  g.add(part(G.box, 0x6B4A2F, 1.6, .2, .24, 0, 1.95, f - .05));
  g.add(part(G.box, 0xE8D9B8, .9, .3, .04, 0, 1.62, f + .08));                          // l'écriteau
  g.add(part(G.leaf2, 0x4E8A44, 1, .5, .5, -.6, 2.05, f - .05));                       // du lierre sur l'arche
  g.add(part(G.leaf2, 0x4E8A44, .8, .45, .45, .55, 2.1, f - .05));
};
export function makeBuilding(type, lvl){
  const g = new THREE.Group();
  BUILD[type](g, Math.min(maxLvl(type), Math.max(1, lvl || 1)));
  if(!B[type].fixe) door(g, B[type].door, frontOf(type));
  return g;
}

/* Bâtiments posés sur l'île : leur modèle, et les cases qu'ils occupent */
const bMeshes = new Map();
export const occ = new Map();
export function footprint(type, x, z){
  const s = sizeOf(type), t = [];
  for(let dz = 0; dz < s; dz++) for(let dx = 0; dx < s; dx++) t.push([x+dx, z+dz]);
  return t;
}
export function placeMesh(b){
  if(bMeshes.has(b.id)) scene.remove(bMeshes.get(b.id));
  const s = sizeOf(b.type), g = makeBuilding(b.type, b.lvl);
  g.position.set(b.x - H + s/2, 0, b.z - H + s/2);
  g.rotation.y = (b.rot || 0) * Math.PI / 2;          // tourné (étape 1.9) : la porte regarde vers b.rot
  scene.add(g); bMeshes.set(b.id, g);
}
/* Retire le modèle d'un bâtiment démonté */
export function removeMesh(id){ if(bMeshes.has(id)){ scene.remove(bMeshes.get(id)); bMeshes.delete(id); } }
/* Où se posent les oiseaux sur le toit d'un bâtiment (la hauteur de son faîte, selon son niveau) */
export const toitDe = b => { const g = bMeshes.get(b.id); return g && g.userData.toit || MUR + 1.05; };
/* Montre ou cache le modèle d'un bâtiment posé (caché pendant qu'on le déplace) */
export function setMeshVisible(id, v){ const g = bMeshes.get(id); if(g) g.visible = v; }
/* Le bâtiment touché par un rayon (celui du doigt), ou null */
export function pickBuilding(ray){
  let best = null, dist = Infinity;
  for(const [id, g] of bMeshes){
    const h = ray.intersectObject(g, true)[0];
    if(h && h.distance < dist){ dist = h.distance; best = id; }
  }
  return best;
}
state.buildings.forEach(b => {
  placeMesh(b);
  footprint(b.type, b.x, b.z).forEach(([x,z]) => occ.set(idx(x,z), b.id));
});
