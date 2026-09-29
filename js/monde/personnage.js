/* ================= Personnage =================
   Le modèle du personnage, sa marche et les obstacles. */
import { G, part } from "./formes.js";
import { scene } from "./scene.js";
import { map, idx, inb, tileOf } from "./ile.js";
import { occ } from "./batiments.js";
import { state } from "../sauvegarde.js";
import { jv, keys } from "../commandes.js";

export const player = new THREE.Group();
const body = new THREE.Group();
player.add(body);
body.add(part(G.cyl, 0xE0654F, .46,.4,.4, 0,.44,0));
body.add(part(G.head, 0xF2C9A0, 1,1,1, 0,.86,0));
const hair = part(G.hair, 0x6B4226, 1,1,1, 0,.88,-.02); hair.rotation.x = -.3; body.add(hair);
body.add(part(G.eye, 0x1C2230, 1,1,1, -.08,.87,.22));
body.add(part(G.eye, 0x1C2230, 1,1,1, .08,.87,.22));
const legL = part(G.cyl, 0x3B4A6B, .13,.24,.13, -.09,.12,0);
const legR = part(G.cyl, 0x3B4A6B, .13,.24,.13, .09,.12,0);
body.add(legL, legR);
player.scale.setScalar(.78);
scene.add(player);

const R = .26;
function walkable(wx, wz){
  const x = tileOf(wx), z = tileOf(wz);
  if(!inb(x,z)) return false;
  const i = idx(x,z);
  return map.type[i] !== "water" && !map.obj[i] && !occ.has(i);
}
const free = (wx, wz) => walkable(wx-R, wz-R) && walkable(wx+R, wz-R) && walkable(wx-R, wz+R) && walkable(wx+R, wz+R);
player.position.set(state.player.x, 0, state.player.z);
if(!free(player.position.x, player.position.z)) player.position.set(.5, 0, .5);
const facing = {x:0, z:1};

/* Déplacement : renvoie true si le personnage a bougé */
const SPEED = 3.4;
let walkT = 0;
export function dir4(){ return Math.abs(facing.x) > Math.abs(facing.z) ? {x:Math.sign(facing.x), z:0} : {x:0, z:Math.sign(facing.z) || 1}; }
export function frontTile(dist){
  const d = dir4();
  return [tileOf(player.position.x + d.x*dist), tileOf(player.position.z + d.z*dist)];
}
export function updatePlayer(dt){
  let ix = jv.x, iz = jv.z;
  if(!ix && !iz){
    ix = (keys.r||0) - (keys.l||0); iz = (keys.d||0) - (keys.u||0);
    const l = Math.hypot(ix, iz); if(l){ ix /= l; iz /= l; }
  }
  const mag = Math.min(1, Math.hypot(ix, iz));
  if(mag > 0){
    const sp = SPEED * mag * dt, p = player.position, l = Math.hypot(ix, iz);
    const ux = ix / l, uz = iz / l;
    const nx = p.x + ux * sp, nz = p.z + uz * sp;
    if(free(nx, p.z)) p.x = nx;
    if(free(p.x, nz)) p.z = nz;
    facing.x = ux; facing.z = uz;
    walkT += dt * 11 * mag;
  }
  const target = Math.atan2(facing.x, facing.z);
  let d = target - player.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
  player.rotation.y += d * Math.min(1, dt * 14);
  const sw = mag > 0 ? Math.sin(walkT) : 0;
  body.position.y = mag > 0 ? Math.abs(sw) * .05 : 0;
  legL.rotation.x = sw * .6; legR.rotation.x = -sw * .6;
  return mag > 0;
}
