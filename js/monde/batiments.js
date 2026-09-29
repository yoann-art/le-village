/* ================= Bâtiments =================
   Les modèles 3D des 7 bâtiments, et leur place sur l'île. */
import { G, part, roof } from "./formes.js";
import { scene } from "./scene.js";
import { H, idx } from "./ile.js";
import { state } from "../sauvegarde.js";
import { sizeOf, maxLvl } from "../regles.js";

const C = {wall:0xF2E2C2, wood:0x8B5A3C, dark:0x654028, straw:0xDDB256, red:0xC8553D, white:0xF4EFE6, blue:0x4E6DB3, stone:0xAEB0B3, stone2:0x8E9195, gold:0xE2B24D};
const emberMat = new THREE.MeshLambertMaterial({color:0xFF7A2E, emissive:0xFF5A00, emissiveIntensity:.7});
const BUILD = {
  chaumiere(g){
    g.add(part(G.box, C.wall, .66,.5,.66, 0,.25,0));
    g.add(roof(C.straw, .66, .5, .5));
    g.add(part(G.box, C.wood, .18,.28,.03, 0,.14,.335));
    g.add(part(G.box, C.blue, .13,.13,.03, .2,.3,.335));
  },
  scierie(g){
    g.add(part(G.box, C.wood, .72,.45,.55, 0,.225,-.08));
    g.add(roof(C.dark, .72, .35, .45, 0, -.08));
    for(let k = 0; k < 3; k++){
      const log = part(G.cyl, C.dark, .12,.55,.12, 0, .06 + (k === 2 ? .1 : 0), .3 + (k === 2 ? 0 : (k ? .06 : -.06)));
      log.rotation.z = Math.PI/2; g.add(log);
    }
  },
  carriere(g){
    g.add(part(G.box, C.wood, .45,.4,.45, -.18,.2,-.12));
    g.add(roof(C.dark, .45, .3, .4, -.18, -.12));
    g.add(part(G.dode, C.stone, .3,.24,.3, .22,.12,.2));
    g.add(part(G.dode, C.stone2, .22,.18,.22, .02,.09,.32));
    g.add(part(G.dode, C.stone, .18,.15,.18, .22,.3,.18));
  },
  marche(g){
    for(const [x,z] of [[-.3,-.22],[.3,-.22],[-.3,.22],[.3,.22]]) g.add(part(G.cyl, C.wood, .05,.6,.05, x,.3,z));
    g.add(part(G.box, C.wood, .66,.07,.46, 0,.3,0));
    for(let k = 0; k < 4; k++) g.add(part(G.box, k % 2 ? C.white : C.red, .2,.05,.56, -.3 + k*.2,.62,0));
    g.add(part(G.box, C.straw, .14,.1,.14, -.15,.39,0));
    g.add(part(G.dode, C.red, .12,.12,.12, .12,.4,.05));
  },
  taverne(g){
    g.add(part(G.box, C.wall, .82,.72,.74, 0,.36,0));
    g.add(part(G.box, C.dark, .84,.06,.76, 0,.4,0));
    g.add(roof(C.red, .82, .5, .72));
    g.add(part(G.box, C.dark, .2,.32,.03, 0,.16,.375));
    g.add(part(G.box, C.gold, .2,.14,.03, .25,.5,.39));
    g.add(part(G.box, C.stone2, .12,.35,.12, .22,1.0,-.15));
  },
  forge(g){
    g.add(part(G.box, C.stone, .78,.5,.68, 0,.25,0));
    g.add(roof(C.dark, .78, .35, .5));
    g.add(part(G.box, C.stone2, .16,.6,.16, .24,.75,-.18));
    g.add(part(G.box, emberMat, .22,.14,.03, 0,.18,.345));
    g.add(part(G.box, C.stone2, .18,.1,.1, .3,.05,.44));
  },
  chateau(g){
    g.add(part(G.box, C.stone, 1.1,1.0,1.1, 0,.5,0));
    g.add(part(G.box, C.stone2, 1.18,.12,1.18, 0,1.06,0));
    for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
      g.add(part(G.cyl, C.stone, .42,1.35,.42, sx*.68,.675,sz*.68));
      g.add(part(G.cone, C.blue, .56,.5,.56, sx*.68,1.6,sz*.68));
    }
    g.add(part(G.box, C.dark, .3,.45,.03, 0,.225,.56));
    g.add(part(G.cyl, C.dark, .03,.5,.03, 0,1.37,0));
    g.add(part(G.box, C.red, .25,.15,.02, .13,1.52,0));
  }
};
export function makeBuilding(type, lvl){
  const g = new THREE.Group();
  BUILD[type](g);
  if(maxLvl(type) > 1 && lvl >= 2){
    g.add(part(G.cyl, C.dark, .03,.9,.03, -.38,.45,.38));
    g.add(part(G.box, lvl >= 3 ? C.gold : C.white, .2,.13,.02, -.28,.82,.38));
  }
  g.scale.setScalar(1 + .07 * (lvl - 1));
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
  scene.add(g); bMeshes.set(b.id, g);
}
state.buildings.forEach(b => {
  placeMesh(b);
  footprint(b.type, b.x, b.z).forEach(([x,z]) => occ.set(idx(x,z), b.id));
});
