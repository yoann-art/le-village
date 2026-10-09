/* ================= Bâtiments =================
   Les modèles 3D des 7 bâtiments, et leur place sur l'île.
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
const C = {wall:0xF2E2C2, wood:0x8B5A3C, dark:0x654028, straw:0xDDB256, red:0xC8553D, white:0xF4EFE6, blue:0x4E6DB3, stone:0xAEB0B3, stone2:0x8E9195, gold:0xE2B24D, lit:0xF6D27A};
const emberMat = new THREE.MeshLambertMaterial({color:0xFF7A2E, emissive:0xFF5A00, emissiveIntensity:.7});

/* La façade est à 0,2 P du bord du carré de cases ; la place de la porte
   sur la façade est dans les données (B[type].door) */
const frontOf = type => sizeOf(type) / 2 - .2;

function door(g, x, z){
  g.add(part(G.box, C.dark, 1.14*P, PORTE + .07, .05, x, (PORTE + .07)/2, z + .01));
  g.add(part(G.box, C.wood, P, PORTE, .06, x, PORTE/2, z + .03));
  g.add(part(G.dode, C.gold, .09,.09,.09, x + .32, PORTE/2, z + .08));
}
/* Une fenêtre : sa vitre s'allume la nuit (VITRE, ciel.js ; bible : « la nuit […] avec les fenêtres allumées ») */
function windowOn(g, color, x, y, z){
  g.add(part(G.box, C.dark, .5,.5,.04, x, y, z + .01));
  const v = part(G.box, VITRE, .38,.38,.05, x, y, z + .03); v.castShadow = false; g.add(v);
}

const BUILD = {
  chaumiere(g){
    g.add(part(G.box, C.wall, 2.6, MUR, 2.6, 0, MUR/2, 0));
    g.add(part(G.box, C.wood, 2.7, .12, 2.7, 0, MUR, 0));
    g.add(roof(C.straw, 2.6, 1.5, MUR + .06));
    windowOn(g, C.blue, -.85, 1.2, 1.3); windowOn(g, C.blue, .85, 1.2, 1.3);
  },
  scierie(g){
    g.add(part(G.box, C.wood, 2.2, MUR, 2.6, -.25, MUR/2, 0));
    g.add(roof(C.dark, 2.3, 1.2, MUR, -.25));
    windowOn(g, C.lit, .45, 1.25, 1.3);
    for(const [x,y] of [[1.03,.14],[1.31,.14],[1.17,.38]]){
      const log = part(G.cyl, C.dark, .28, 1.6, .28, x, y, .2);
      log.rotation.x = Math.PI/2; g.add(log);
    }
  },
  carriere(g){
    g.add(part(G.box, C.wood, 2.0, MUR, 2.0, -.45, MUR/2, .3));
    g.add(roof(C.dark, 2.0, 1.1, MUR, -.45, .3));
    g.add(part(G.dode, C.stone, .9,.75,.9, .95,.3,-.75));
    g.add(part(G.dode, C.stone2, .7,.55,.7, .15,.22,-1.1));
    g.add(part(G.box, C.stone, .45,.42,.45, 1.05,.21,.95));
    g.add(part(G.box, C.stone2, .4,.38,.4, 1.05,.61,.95));
  },
  marche(g){
    g.add(part(G.box, C.wall, 3.4, MUR, 3.0, 0, MUR/2, .3));
    g.add(roof(C.red, 3.4, 1.4, MUR, 0, .3));
    for(let k = 0; k < 6; k++) g.add(part(G.box, k % 2 ? C.white : C.red, 3.4/6, .06, .55, -1.7 + 3.4/12 + k*3.4/6, 1.85, 2.03));
    g.add(part(G.box, C.straw, .4,.4,.4, 1.45,.2,1.95));
    g.add(part(G.dode, C.red, .25,.25,.25, 1.45,.5,1.95));
    g.add(part(G.cyl, C.wood, .45,.6,.45, -1.45,.3,1.95));
  },
  taverne(g){
    g.add(part(G.box, C.wall, 3.6, MUR, 3.2, 0, MUR/2, .2));
    g.add(part(G.box, C.dark, 3.68, .1, 3.28, 0, 1.95, .2));
    g.add(roof(C.red, 3.6, 1.8, MUR, 0, .2));
    windowOn(g, C.lit, -1.15, 1.2, 1.8); windowOn(g, C.lit, 1.15, 1.2, 1.8);
    g.add(part(G.box, C.gold, 1.0, .28, .05, 0, 1.76, 1.84));
    g.add(part(G.box, C.stone2, .45, 1.6, .45, 1.0, MUR + 1.1, -.7));
  },
  forge(g){
    g.add(part(G.box, C.stone, 2.6, MUR, 2.4, 0, MUR/2, .1));
    g.add(roof(C.dark, 2.6, 1.1, MUR, 0, .1));
    g.add(part(G.box, C.stone2, .5, 1.8, .5, .75, MUR + .9, -.45));
    g.add(part(G.box, emberMat, .7, .45, .05, .7, .75, 1.33));
  },
  chateau(g){
    g.add(part(G.box, C.stone, 2.8, 2.4, 2.8, 0, 1.2, .4));
    g.add(part(G.box, C.stone2, 2.95, .18, 2.95, 0, 2.45, .4));
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      const x = sx * 1.45, z = .4 + sz * 1.3;
      g.add(part(G.cyl, C.stone, .9, 3.2, .9, x, 1.6, z));
      g.add(part(G.cone, C.blue, 1.2, 1.0, 1.2, x, 3.7, z));
    }
    g.add(part(G.cyl, C.dark, .06, 1.2, .06, 0, 3.1, .4));
    g.add(part(G.box, C.red, .6, .36, .03, .3, 3.5, .4));
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
  g.add(part(G.box, LANTERNE_MINE, .2, .24, .2, 1.15, 1.2, f + .15));
};
const LANTERNE_MINE = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});
lanterne(null, 0, 0, LANTERNE_MINE);                 // elle brille plus fort la nuit
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
  BUILD[type](g);
  if(!B[type].fixe) door(g, B[type].door, frontOf(type));
  if(maxLvl(type) > 1 && lvl >= 2){
    const e = sizeOf(type) / 2 - .15;
    g.add(part(G.cyl, C.dark, .06, 2.8, .06, -e, 1.4, e));
    g.add(part(G.box, lvl >= 3 ? C.gold : C.white, .5, .32, .03, -e + .27, 2.6, e));
  }
  g.scale.setScalar(1 + .04 * (lvl - 1));
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
