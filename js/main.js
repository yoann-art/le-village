/* ================= Point de départ du jeu =================
   Relie tous les morceaux, fait tourner la boucle de jeu et lance la partie.
   L'ordre des lignes « import » compte : la mise à jour en tout premier (même si la 3D
   ne charge pas), puis la vérification, puis le décor dans l'ordre où il est posé
   (lumières, île, bâtiments, personnage). */
import "./miseajour.js";
import "./verification.js";
import { $ } from "./outils.js";
import { VERSION } from "./version.js";
import { B } from "./donnees.js";
import { renderer, camera, sun, D, distanceFor, setDistance } from "./monde/scene.js";
import { water } from "./monde/ile.js";
import "./monde/batiments.js";
import { player, updatePlayer } from "./monde/personnage.js";
import "./coffres.js";
import { view } from "./commandes.js";
import { state, save, migrationMsg, eraseSave } from "./sauvegarde.js";
import { renderHUD, toast, wrap, closeSheet } from "./interface.js";
import { placing, startPlacing, stopPlacing, updateInteraction, upgradeDetail, placementFocus } from "./construire.js";
import { isInside, isBusy, currentScene, checkDoors, cameraTarget, takeJump, islandPos, currentPlace } from "./lieux.js";
import { decorating, lifting, decoView, updateLift, addMeuble, finishDeco } from "./decorer.js";
import { updatePlan } from "./ateliers.js";
import { updateCoffrePiece } from "./coffres.js";
import { updateTorche } from "./torche.js";
import { lampeSur } from "./monde/interieurs.js";
import { updateRecolte } from "./recolte.js";
import "./sac.js";
import "./barre.js";

/* Touche Échap : ferme ce qui est ouvert */
window.addEventListener("keydown", e => {
  if(e.key === "Escape"){ if(!wrap.hidden) closeSheet(); else if(decorating()) finishDeco(); else if(placing) stopPlacing(); }
});

/* Boutons des panneaux du bas */
wrap.addEventListener("click", e => {
  if(e.target.closest("[data-close]")){ closeSheet(); return; }
  const pick = e.target.closest("[data-pick]");
  if(pick){ closeSheet(); startPlacing(pick.dataset.pick); return; }
  const mb = e.target.closest("[data-meuble]");
  if(mb){ closeSheet(); addMeuble(mb.dataset.meuble); return; }
  if(e.target.closest("[data-up]")){ upgradeDetail(); return; }
  if(e.target.closest("[data-reset]")){
    if(confirm("Effacer ton île et repartir de zéro ?")){
      eraseSave();
      location.reload();
    }
  }
});

/* ================= Boucle de jeu ================= */
/* Largeur vue autour du personnage, en P, avant zoom : 8 dehors, 6 dedans (plus près) */
const VIEW_OUT = 8, VIEW_IN = 6;
let lastSave = 0, dirty = false;
const OFF = new THREE.Vector3(0, .78, .63).normalize(), camT = new THREE.Vector3();
camT.copy(player.position);

let last = performance.now();
function tick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const pushing = wrap.hidden && !isBusy() && !placing && !decorating() && !lifting() && updatePlayer(dt);   // pendant une pose, la déco ou un meuble soulevé, le personnage attend
  if(pushing) dirty = true;
  checkDoors(pushing);
  const dv = decoView();
  const foret = isInside() && ["foret", "grotte"].includes(currentPlace().b.type);   // la forêt et la grotte se voient comme dehors, en grand
  setDistance(distanceFor(dv ? dv.width : isInside() && !foret ? VIEW_IN : VIEW_OUT) * view.zoom);
  const target = dv ? dv.target : (!isInside() && placementFocus()) || cameraTarget();
  if(takeJump()) camT.copy(target);
  else camT.lerp(target, 1 - Math.pow(.0005, dt));
  camera.position.copy(camT).addScaledVector(OFF, D);
  camera.lookAt(camT.x, .4, camT.z);
  updateLift();                                            // le meuble soulevé reste sous le doigt pendant que la caméra recule
  if(foret) lampeSur(camT.x, camT.z);
  if(!isInside()){
    sun.position.set(camT.x + 6, 16, camT.z + 5);
    sun.target.position.copy(camT);
    water.position.y = -.2 + Math.sin(now * .0012) * .02;
    updateInteraction(dt);
  }
  updatePlan(isInside() && !decorating() && !lifting() && !isBusy());   // bouton du plan de travail, quand on est tout près
  updateCoffrePiece(isInside() && !decorating() && !lifting() && !isBusy() && wrap.hidden);   // un coffre dans la pièce : l'ouvrir, ou le poser
  updateRecolte(dt, (!isInside() || ["mine", "foret", "grotte"].includes(currentPlace().b.type)) && wrap.hidden && !isBusy() && !placing);   // couper, planter, miner : le bouton d'action
  updateTorche(dt);                                        // dans la grotte : la torche éclaire et s'use
  renderer.render(currentScene(), camera);
  if(dirty && now - lastSave > 2000){
    const p = islandPos();
    state.player = {x:+p.x.toFixed(2), z:+p.z.toFixed(2)};
    save(); lastSave = now; dirty = false;
  }
  requestAnimationFrame(tick);
}

/* ================= Démarrage ================= */
$("#version").textContent = "v" + VERSION;
renderHUD();
requestAnimationFrame(tick);
setTimeout(() => {
  if(migrationMsg) toast(migrationMsg, 4200);
  else if(!state.buildings.some(b => !B[b.type].fixe)) toast("Ramasse les morceaux de bois et les cailloux au sol, cueille des herbes hautes : de quoi bâtir ta Scierie (Construire).", 5200);
}, 700);
