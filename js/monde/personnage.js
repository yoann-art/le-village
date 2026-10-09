/* ================= Personnage =================
   Le modèle du personnage, sa marche et les obstacles. */
import { P, G, part } from "./formes.js";
import { scene } from "./scene.js";
import { map, idx, inb, tileOf } from "./ile.js";
import { occ } from "./batiments.js";
import { state } from "../sauvegarde.js";
import { traversable } from "../donnees.js";
import { jv, keys } from "../commandes.js";
import { makeOutil } from "./outils3d.js";
import { passageCases } from "./ponton.js";

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
/* La torche, dans la main gauche (étape 1.8) : allumée dans la grotte, sa flamme vacille (t : le temps) */
const torche = new THREE.Group();
torche.position.set(.27, .4, .1);
torche.add(part(G.head, 0xF2C9A0, .38, .38, .38, 0, 0, 0));
torche.add(part(G.cyl, 0x7A4E2A, .05, .42, .05, 0, .16, .04));
const flamme = part(G.head, new THREE.MeshLambertMaterial({color: 0xFFB347, emissive: 0xFF8A1E, emissiveIntensity: 1}), .5, .8, .5, 0, .42, .04);
const coeur = part(G.head, new THREE.MeshLambertMaterial({color: 0xFFF2B0, emissive: 0xFFE070, emissiveIntensity: 1}), .25, .45, .25, 0, .4, .04);
flamme.castShadow = coeur.castShadow = false;
torche.add(flamme, coeur);
torche.visible = false;
body.add(torche);
export function tenirTorche(oui, t = 0){
  torche.visible = !!oui;
  if(oui){ const f = 1 + Math.sin(t * 17) * .12 + Math.sin(t * 9.3) * .08; flamme.scale.set(.5 * f, .8 * (2 - f), .5 * f); }
}
/* Penche la main (et l'outil) vers l'avant : rx en radians ; sans rien, la position normale (la pêche s'en sert) */
export function pencheMain(rx){ hand.rotation.x = rx === undefined ? .35 : rx; }
player.scale.setScalar(P / 1.12);   // le modèle fait 1,12 de haut : le personnage mesure 1 P
scene.add(player);

/* Où peut-on marcher ? Dehors, sur l'île et sur le ponton ; dedans, dans la pièce (voir lieux.js) */
export const R = .26;
export function islandWalkable(wx, wz){
  const x = tileOf(wx), z = tileOf(wz);
  if(!inb(x,z)) return false;
  const i = idx(x,z);
  return (map.type[i] !== "water" || passageCases.has(i)) && traversable(map.obj[i]) && !occ.has(i);   // on traverse les herbes hautes, le thym et les fleurs
}
let walkable = islandWalkable;
export function setWalkable(fn){ walkable = fn; }
const free = (wx, wz) => walkable(wx-R, wz-R) && walkable(wx+R, wz-R) && walkable(wx-R, wz+R) && walkable(wx+R, wz+R);
export const libre = free;
/* Ne jamais rester coincé (bugs de Yo, 6 octobre 2026 : un arbre planté contre le personnage, une partie rouverte
   dans un bâtiment) : s'il se retrouve dans un obstacle, il glisse jusqu'à la place libre la plus proche */
export function degager(){
  const p = player.position;
  if(free(p.x, p.z)) return false;
  for(let r = .1; r <= 8; r += .1){
    const n = Math.max(8, Math.round(r * 12));
    for(let k = 0; k < n; k++){
      const a = k / n * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if(free(x, z)){ p.x = x; p.z = z; return true; }
    }
  }
  return false;
}
player.position.set(state.player.x, 0, state.player.z);
degager();
const facing = {x:0, z:1};

/* Pose le personnage à un endroit, tourné dans une direction (entrée et sortie des bâtiments) */
export function placePlayer(x, z, fx, fz){
  player.position.set(x, 0, z);
  facing.x = fx; facing.z = fz;
  player.rotation.y = Math.atan2(fx, fz);
}

/* L'allure du personnage : de 0 (immobile) à 1 (il court) ; « à pas de loup » sous ALLURE_DOUCE (étape 1.7 :
   les insectes et les oiseaux ne fuient pas si on s'approche doucement, joystick poussé à moitié) */
let allureNow = 0;
export const ALLURE_DOUCE = .55;
export const allure = () => allureNow;
/* Déplacement : renvoie true si le joueur pousse le joystick (même contre un mur) */
const SPEED = 3.4;
let walkT = 0;
/* La direction où regarde le personnage (vecteur de longueur 1 ; la pêche vise avec) */
export const regard = () => ({x: facing.x, z: facing.z});
export function dir4(){ return Math.abs(facing.x) > Math.abs(facing.z) ? {x:Math.sign(facing.x), z:0} : {x:0, z:Math.sign(facing.z) || 1}; }
export function frontTile(dist){
  const d = dir4();
  return [tileOf(player.position.x + d.x*dist), tileOf(player.position.z + d.z*dist)];
}
/* Un élan (étape 1.8) : la roulade (roule : il fait la culbute), ou le recul quand un monstre le blesse ; vx, vz en P/s,
   pendant T secondes ; le joystick n'agit pas pendant ce temps */
let elanEnCours = null;
export function elan(vx, vz, T, roule){ elanEnCours = {vx, vz, t: 0, T, roule}; }
export const enRoulade = () => !!(elanEnCours && elanEnCours.roule);
/* Après une blessure, il clignote pendant t secondes */
let clign = 0;
export function clignoter(t){ clign = t; }
function bouger(dt){
  const e = elanEnCours, p = player.position;
  e.t += dt;
  const nx = p.x + e.vx * dt, nz = p.z + e.vz * dt;
  if(free(nx, p.z)) p.x = nx;
  if(free(p.x, nz)) p.z = nz;
  const u = Math.min(1, e.t / e.T), a = e.roule ? u * Math.PI * 2 : 0;
  /* la culbute tourne autour du milieu du corps (à .45 du sol), et le soulève un peu */
  body.rotation.x = a;
  body.position.set(0, e.roule ? .45 - .45 * Math.cos(a) + Math.sin(u * Math.PI) * .25 : 0, e.roule ? -.45 * Math.sin(a) : 0);
  legL.rotation.x = legR.rotation.x = e.roule ? -.9 : 0;
  if(e.t >= e.T){ elanEnCours = null; body.rotation.x = 0; body.position.set(0, 0, 0); }
}
export function updatePlayer(dt){
  degager();                                          // coincé (un arbre planté, un bâtiment, un meuble posé dessus) : il se dégage
  if(clign > 0){ clign -= dt; body.visible = clign <= 0 || Math.floor(clign * 12) % 2 === 0; }
  else if(!body.visible) body.visible = true;
  if(elanEnCours){ bouger(dt); allureNow = 0; return false; }
  let ix = jv.x, iz = jv.z;
  if(!ix && !iz){
    ix = (keys.r||0) - (keys.l||0); iz = (keys.d||0) - (keys.u||0);
    const l = Math.hypot(ix, iz); if(l){ ix /= l * (keys.lent ? 2.5 : 1); iz /= l * (keys.lent ? 2.5 : 1); }   // Maj : à pas de loup
  }
  const mag = Math.min(1, Math.hypot(ix, iz));
  allureNow = mag;
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
