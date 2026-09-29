/* ================= Point de départ du jeu =================
   Relie tous les morceaux, fait tourner la boucle de jeu et lance la partie.
   L'ordre des lignes « import » compte : la vérification d'abord,
   puis le décor dans l'ordre où il est posé (lumières, île, bâtiments, personnage). */
import "./verification.js";
import { renderer, scene, camera, sun, D } from "./monde/scene.js";
import { water } from "./monde/ile.js";
import "./monde/batiments.js";
import { player, updatePlayer } from "./monde/personnage.js";
import { state, save, migrated, eraseSave } from "./sauvegarde.js";
import { renderHUD, toast, wrap, closeSheet } from "./interface.js";
import { placing, startPlacing, stopPlacing, updateInteraction, upgradeDetail } from "./construire.js";
import { gameEl, openGame, closeGame } from "./minijeux/minijeux.js";

/* Touche Échap : ferme ce qui est ouvert */
window.addEventListener("keydown", e => {
  if(e.key === "Escape"){ if(!gameEl.hidden) closeGame(); else if(!wrap.hidden) closeSheet(); else if(placing) stopPlacing(); }
});

/* Boutons des panneaux du bas */
wrap.addEventListener("click", e => {
  if(e.target.closest("[data-close]")){ closeSheet(); return; }
  const pick = e.target.closest("[data-pick]");
  if(pick){ closeSheet(); startPlacing(pick.dataset.pick); return; }
  const gm = e.target.closest("[data-game]");
  if(gm){ closeSheet(); setTimeout(() => openGame(gm.dataset.game), 150); return; }
  if(e.target.closest("[data-up]")){ upgradeDetail(); return; }
  if(e.target.closest("[data-reset]")){
    if(confirm("Effacer ton île et repartir de zéro ?")){
      eraseSave();
      location.reload();
    }
  }
});

/* ================= Boucle de jeu ================= */
let lastSave = 0, dirty = false;
const OFF = new THREE.Vector3(0, .78, .63).normalize(), camT = new THREE.Vector3();
camT.copy(player.position);

let last = performance.now();
function tick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if(gameEl.hidden){
    if(wrap.hidden && updatePlayer(dt)) dirty = true;
    camT.lerp(player.position, 1 - Math.pow(.0005, dt));
    camera.position.copy(camT).addScaledVector(OFF, D);
    camera.lookAt(camT.x, .4, camT.z);
    sun.position.set(camT.x + 6, 16, camT.z + 5);
    sun.target.position.copy(camT);
    water.position.y = -.2 + Math.sin(now * .0012) * .02;
    updateInteraction();
    renderer.render(scene, camera);
    if(dirty && now - lastSave > 2000){
      state.player = {x:+player.position.x.toFixed(2), z:+player.position.z.toFixed(2)};
      save(); lastSave = now; dirty = false;
    }
  }
  requestAnimationFrame(tick);
}

/* ================= Démarrage ================= */
renderHUD();
requestAnimationFrame(tick);
setTimeout(() => {
  if(migrated) toast("Tes ressources du prototype sont récupérées, et tes anciens bâtiments remboursés.", 4200);
  else if(!state.buildings.length) toast("Déplace-toi avec le joystick. Touche Construire pour bâtir devant toi.", 4200);
}, 700);
