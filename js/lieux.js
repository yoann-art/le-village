/* ================= Dehors et dedans =================
   On entre dans un bâtiment en marchant dans sa porte,
   on en sort en repassant par la porte (le paillasson).
   Un court fondu au noir cache le changement de lieu. */
import { $ } from "./outils.js";
import { B } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { sizeOf, doorTile } from "./regles.js";
import { scene } from "./monde/scene.js";
import { H } from "./monde/ile.js";
import { interior, buildRoom } from "./monde/interieurs.js";
import { player, R, dir4, placePlayer, setWalkable, islandWalkable } from "./monde/personnage.js";
import { placing } from "./construire.js";

let inside = null;        // {b, room} quand on est dans un bâtiment
let busy = false;         // pendant le fondu
let jump = false;         // la caméra doit sauter d'un coup au nouveau lieu
const fondu = $("#fondu");

export const isInside = () => !!inside;
export const isBusy = () => busy;
export const currentScene = () => inside ? interior : scene;

/* Porte d'un bâtiment posé : milieu de la porte (x) et bord avant de son carré de cases (z) */
function doorOf(b){
  const s = sizeOf(b.type);
  return {x: b.x - H + s/2 + B[b.type].door, z: b.z - H + s};
}
/* Où l'on se retrouve en sortant : juste devant la porte, entièrement sur la case
   devant la porte (toujours libre), pour ne jamais toucher un arbre voisin */
function outsideSpot(b){
  const d = doorOf(b), left = doorTile(b.type, b.x, b.z)[0] - H;
  return {x: Math.max(left + R + .02, Math.min(left + 1 - R - .02, d.x)), z: d.z + R + .25};
}

function fade(change){
  busy = true;
  fondu.classList.add("on");
  setTimeout(() => {
    change();
    jump = true;
    fondu.classList.remove("on");
    setTimeout(() => { busy = false; }, 250);
  }, 260);
}
function enter(b){
  fade(() => {
    const room = buildRoom(b);
    inside = {b, room};
    interior.add(player);
    setWalkable((x, z) => Math.abs(x) < room.w/2 && Math.abs(z) < room.d/2);
    placePlayer(room.doorX, room.d/2 - R - .3, 0, -1);
    $("#btn-build").hidden = true;
    $("#btn-ctx").hidden = true;
  });
}
function exit(){
  const b = inside.b;
  fade(() => {
    inside = null;
    scene.add(player);
    setWalkable(islandWalkable);
    const p = outsideSpot(b);
    placePlayer(p.x, p.z, 0, 1);
    $("#btn-build").hidden = false;
  });
}

/* À chaque image : le personnage pousse-t-il contre une porte ? */
export function checkDoors(pushing){
  if(busy || !pushing || placing) return;
  const p = player.position, d = dir4();
  if(inside){
    const {room} = inside;
    if(d.z === 1 && Math.abs(p.x - room.doorX) < .45 && p.z > room.d/2 - R - .08) exit();
    return;
  }
  if(d.z !== -1) return;
  for(const b of state.buildings){
    const door = doorOf(b);
    if(Math.abs(p.x - door.x) < .45 && p.z > door.z && p.z - door.z < R + .08){ enter(b); return; }
  }
}

/* Position à sauvegarder sur l'île : dedans, on garde la place devant la porte,
   pour reprendre dehors si le jeu est rouvert */
export function islandPos(){ return inside ? outsideSpot(inside.b) : {x: player.position.x, z: player.position.z}; }

/* Point que regarde la caméra : dedans, elle suit le personnage sans sortir de la pièce */
const target = new THREE.Vector3();
export function cameraTarget(){
  if(!inside) return player.position;
  const {w, d} = inside.room, p = player.position;
  const mx = Math.max(0, w/2 - 3.5), mz = Math.max(0, d/2 - 3);
  return target.set(Math.max(-mx, Math.min(mx, p.x)), 0, Math.max(-mz, Math.min(mz, p.z)));
}
/* Vrai une seule fois juste après un changement de lieu */
export function takeJump(){ const j = jump; jump = false; return j; }
