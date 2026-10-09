/* ================= Dehors et dedans =================
   On entre dans un bâtiment en marchant dans sa porte,
   on en sort en repassant par la porte (le paillasson).
   Un court fondu au noir cache le changement de lieu.
   La grotte (étape 1.8) est un lieu dans un lieu : on y entre depuis la Forêt profonde (les racines du vieux chêne),
   on descend ses paliers par le trou du fond, et on en sort vers la forêt (le tunnel du premier palier, la corde
   des suivants) ; jamais directement au village (bible : « on sort par les paliers »). */
import { $ } from "./outils.js";
import { B, ATELIERS } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { sizeOf, porteDe, SENS, mineOuverte } from "./regles.js";
import { scene, halfViewWidth } from "./monde/scene.js";
import { H } from "./monde/ile.js";
import { interior, buildRoom } from "./monde/interieurs.js";
import { meubleAt, hasPlan } from "./monde/meubles.js";
import { ENTREE_GROTTE } from "./monde/foret.js";
import { PALIERS } from "./monde/grotte.js";
import { player, R, dir4, placePlayer, setWalkable, islandWalkable, degager } from "./monde/personnage.js";
import { placing } from "./construire.js";
import { toast } from "./interface.js";

let inside = null;        // {b, room} quand on est dans un bâtiment ; dans la grotte : {b: {type: "grotte", palier}, room, foret}
let busy = false;         // pendant le fondu
let jump = false;         // la caméra doit sauter d'un coup au nouveau lieu
const fondu = $("#fondu");

export const isInside = () => !!inside;
/* La pièce où l'on est : {b : le bâtiment, room : {w, d, doorX}}, ou null dehors */
export const currentPlace = () => inside;
export const isBusy = () => busy;
export const currentScene = () => inside ? interior : scene;

/* Porte d'un bâtiment posé : le milieu de la porte, au bord de son carré de cases, et le sens où elle regarde (n) ;
   tourné (étape 1.9), la porte tourne avec lui autour du milieu du carré */
export function doorOf(b){
  const s = sizeOf(b.type), d = B[b.type].door || 0, r = (b.rot || 0) & 3;
  const cx = b.x - H + s/2, cz = b.z - H + s/2;
  return {x: cx + [d, s/2, -d, -s/2][r], z: cz + [s/2, -d, -s/2, d][r], n: SENS[r]};
}
/* Où l'on se retrouve en sortant : juste devant la porte, entièrement sur la case
   devant la porte (toujours libre), pour ne jamais toucher un arbre voisin ; n : le sens où l'on regarde */
function outsideSpot(b){
  const d = doorOf(b), [tx, tz] = porteDe(b), n = d.n, cale = (v, a) => Math.max(a + R + .02, Math.min(a + 1 - R - .02, v));
  return n.x === 0 ? {x: cale(d.x, tx - H), z: d.z + n.z * (R + .25), n} : {x: d.x + n.x * (R + .25), z: cale(d.z, tz - H), n};
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
/* Le personnage dans la pièce d'un bâtiment, sur le paillasson */
function installer(b){
  const room = buildRoom(b);
  inside = {b, room};
  interior.add(player);
  /* Dans la pièce : entre les murs, en contournant les meubles (la mine a sa propre règle) */
  setWalkable(room.walk || ((x, z) => Math.abs(x) < room.w/2 && Math.abs(z) < room.d/2 && !meubleAt((b.deco && b.deco.items) || [], x, z)));
  placePlayer(room.doorX, room.d/2 - R - .3, 0, -1);
  $("#btn-build").hidden = true;
  $("#btn-ctx").hidden = true;
  $("#btn-deco").hidden = !!B[b.type].fixe;          // on ne décore pas la mine
  return room;
}
function enter(b){
  fade(() => {
    installer(b);
    /* Pas encore de plan de travail : on dit comment le construire */
    const a = ATELIERS[b.type];
    if(b.type === "foret") setTimeout(() => toast("🌲 La Forêt profonde : de vieux arbres, des clairières, un ruisseau. Hache en main, coupe ses arbres (l'if donne un bois souple pour les arcs) : ils repoussent avec le temps. Au cœur, le Grand Chêne millénaire.", 5600), 400);
    if(b.type === "mine") setTimeout(() => toast("⛰️ La mine : pioche en main, mine les rochers (pierre, cuivre, charbon) ; ils reviennent chaque jour. À gauche, la paroi marquée d'une croix cache une galerie : creuse-la avec une pioche en cuivre.", 5600), 400);
    if(a && !hasPlan(b)) setTimeout(() => toast(`${a.emoji} Pas encore ${a.le.startsWith("l'") ? "d'" + a.le.slice(2) : "de " + a.le.slice(3)} ici : construis-${a.fem ? "la" : "le"} dans « 🪑 Décorer », puis « Meubles »`, 4200), 400);
  });
}
/* La grotte : y entrer (depuis la forêt), ou descendre au palier suivant */
const MOTS = ["", "🕳️ La grotte, sous les racines : il y fait noir. Une torche (établi de la Scierie) éclaire autour de toi. Au fond, un trou descend plus bas ; plus on descend, plus il y a de butin.",
  "🕳️ Deuxième palier : plus sombre, plus riche. La corde, près de l'échelle, remonte à la forêt.",
  "🕳️ Le fond de la grotte : le dernier palier. La corde, près de l'échelle, remonte à la forêt."];
export function entrerGrotte(palier){
  const foret = inside && (inside.foret || inside.b);
  fade(() => {
    const b = {type: "grotte", palier}, room = buildRoom(b);
    inside = {b, room, foret};
    setWalkable(room.walk);
    if(room.depart) placePlayer(room.depart.x, room.depart.z, 0, 1);
    else placePlayer(room.doorX, room.d/2 - R - .3, 0, -1);
    $("#btn-deco").hidden = true;
    setTimeout(() => toast(MOTS[palier], 5000), 400);
  });
}
/* Sortir de la grotte : on se retrouve dans la forêt, devant les racines du vieux chêne */
function sortirGrotte(){
  const b = inside.foret;
  fade(() => {
    const room = buildRoom(b);
    inside = {b, room};
    setWalkable(room.walk);
    placePlayer(ENTREE_GROTTE.x, ENTREE_GROTTE.z + 1.2, 0, 1);
    $("#btn-deco").hidden = true;
  });
}
/* Vaincu (étape 1.8, morceau 4 ; bible : « réveil au village ») : dans son lit, à la Chaumière, s'il y en a un ;
   sinon devant la porte de sa Chaumière ; sinon sur la place du village. Puis apres(où), pendant le fondu */
export function reveilVillage(apres){
  if(busy) return false;
  const avecLit = b => b.type === "chaumiere" && b.deco && (b.deco.items || []).some(it => it.type === "lit");
  const ch = state.buildings.find(avecLit), porte = state.buildings.find(b => b.type === "chaumiere");
  fade(() => {
    let ou;
    if(ch){                                            // à côté du lit : posé dessus, il glisse jusqu'à la place libre la plus proche
      installer(ch);
      const lit = ch.deco.items.find(it => it.type === "lit");
      placePlayer(lit.x, lit.z, 0, 1); degager();
      ou = "lit";
    } else {
      inside = null;
      scene.add(player);
      setWalkable(islandWalkable);
      const p = porte ? outsideSpot(porte) : {x: .5, z: .5, n: {x: 0, z: 1}};
      placePlayer(p.x, p.z, p.n.x, p.n.z); degager();
      $("#btn-build").hidden = false;
      $("#btn-deco").hidden = true;
      ou = porte ? "porte" : "place";
    }
    if(apres) apres(ou);
  });
  return true;
}
function exit(){
  const b = inside.b;
  fade(() => {
    inside = null;
    scene.add(player);
    setWalkable(islandWalkable);
    const p = outsideSpot(b);
    placePlayer(p.x, p.z, p.n.x, p.n.z);
    $("#btn-build").hidden = false;
    $("#btn-deco").hidden = true;
  });
}

/* À chaque image : le personnage pousse-t-il contre une porte ? */
export function checkDoors(pushing){
  if(busy || !pushing || placing) return;
  const p = player.position, d = dir4();
  if(inside){
    const {room, b} = inside;
    if(b.type === "grotte"){                         // le trou qui descend, la corde qui remonte, le tunnel du premier palier
      for(const q of room.passages) if(Math.hypot(p.x - q.x, p.z - q.z) < .45){
        if(q.vers === "bas" && b.palier < PALIERS) entrerGrotte(b.palier + 1); else sortirGrotte();
        return;
      }
      if(room.doorX !== null && d.z === 1 && Math.abs(p.x - room.doorX) < .45 && p.z > room.d/2 - R - .08) sortirGrotte();
      return;
    }
    /* dans la forêt : les racines du vieux chêne, en marchant vers le haut dans l'ouverture */
    if(b.type === "foret" && d.z === -1 && Math.abs(p.x - ENTREE_GROTTE.x) < .6 && p.z < ENTREE_GROTTE.z + R + .12 && p.z > ENTREE_GROTTE.z - .6){ entrerGrotte(1); return; }
    if(d.z === 1 && Math.abs(p.x - room.doorX) < .45 && p.z > room.d/2 - R - .08) exit();
    return;
  }
  /* dehors : on entre en marchant vers la porte, juste devant elle (quel que soit le côté où elle regarde) */
  for(const b of state.buildings){
    if(b.type === "mine" && !mineOuverte()) continue;          // l'entrée de la mine pas encore construite (étape 1.11)
    const door = doorOf(b), n = door.n;
    if(d.x !== -n.x || d.z !== -n.z) continue;
    const cote = n.x === 0 ? Math.abs(p.x - door.x) : Math.abs(p.z - door.z), devant = (p.x - door.x) * n.x + (p.z - door.z) * n.z;
    if(cote < .45 && devant > 0 && devant < R + .08){ enter(b); return; }
  }
}

/* Position à sauvegarder sur l'île : dedans, on garde la place devant la porte,
   pour reprendre dehors si le jeu est rouvert */
export function islandPos(){ return inside ? outsideSpot(inside.foret || inside.b) : {x: player.position.x, z: player.position.z}; }

/* Point que regarde la caméra : dedans, elle suit le personnage sans trop sortir de la pièce
   (si la pièce tient dans l'écran, elle reste au milieu) */
const target = new THREE.Vector3();
export function cameraTarget(){
  if(!inside) return player.position;
  const {w, d} = inside.room, p = player.position;
  const mx = Math.max(0, w/2 + .3 - halfViewWidth()), mz = Math.max(0, d/2 - 1.5);
  return target.set(Math.max(-mx, Math.min(mx, p.x)), 0, Math.max(-mz, Math.min(mz, p.z)));
}
/* Vrai une seule fois juste après un changement de lieu */
export function takeJump(){ const j = jump; jump = false; return j; }
