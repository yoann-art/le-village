/* ================= Personnage =================
   Le modèle du personnage, sa marche et les obstacles. */
import { P, G, part } from "./formes.js";
import { scene } from "./scene.js";
import { map, idx, inb, tileOf } from "./ile.js";
import { occ } from "./batiments.js";
import { state } from "../sauvegarde.js";
import { jv, keys } from "../commandes.js";
import { makeOutil } from "./outils3d.js";

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
/* La main droite, qui n'apparaît qu'avec un outil ; l'outil penche un peu vers l'avant (étape 1.4) */
const hand = new THREE.Group();
hand.position.set(-.27, .4, .08);
hand.rotation.x = .35;
hand.add(part(G.head, 0xF2C9A0, .38,.38,.38, 0,0,0));
hand.visible = false;
body.add(hand);
let held = null;
/* Met un outil dans la main du personnage (une clé de OUTILS), ou la vide (null) */
export function holdTool(k){
  if(held){ hand.remove(held); held = null; }
  if(k){ held = makeOutil(k); hand.add(held); }
  hand.visible = !!k;
}
/* Penche la main (et l'outil) vers l'avant : rx en radians ; sans rien, la position normale (la pêche s'en sert) */
export function pencheMain(rx){ hand.rotation.x = rx === undefined ? .35 : rx; }
player.scale.setScalar(P / 1.12);   // le modèle fait 1,12 de haut : le personnage mesure 1 P
scene.add(player);

/* Où peut-on marcher ? Dehors, sur l'île ; dedans, dans la pièce (voir lieux.js) */
export const R = .26;
export function islandWalkable(wx, wz){
  const x = tileOf(wx), z = tileOf(wz);
  if(!inb(x,z)) return false;
  const i = idx(x,z);
  return map.type[i] !== "water" && (!map.obj[i] || map.obj[i] === "herbe") && !occ.has(i);   // on traverse les herbes hautes
}
let walkable = islandWalkable;
export function setWalkable(fn){ walkable = fn; }
const free = (wx, wz) => walkable(wx-R, wz-R) && walkable(wx+R, wz-R) && walkable(wx-R, wz+R) && walkable(wx+R, wz+R);
player.position.set(state.player.x, 0, state.player.z);
if(!free(player.position.x, player.position.z)) player.position.set(.5, 0, .5);
const facing = {x:0, z:1};

/* Pose le personnage à un endroit, tourné dans une direction (entrée et sortie des bâtiments) */
export function placePlayer(x, z, fx, fz){
  player.position.set(x, 0, z);
  facing.x = fx; facing.z = fz;
  player.rotation.y = Math.atan2(fx, fz);
}

/* Déplacement : renvoie true si le joueur pousse le joystick (même contre un mur) */
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
