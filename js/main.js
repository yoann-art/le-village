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
import { updateCombat } from "./combat.js";
import { updateChemins } from "./terraformer.js";
import { lampeSur, nuitForet } from "./monde/interieurs.js";
import { updateCiel, nuitIci } from "./monde/ciel.js";
import { updateRecolte } from "./recolte.js";
import "./sac.js";
import "./barre.js";
import "./saisons.js";

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

/* Une erreur dans un morceau du jeu ne doit jamais tout figer (bug de Yo, 9 octobre 2026 : le jeu bloqué après avoir
   replanté une fleur) : chaque morceau de la boucle est gardé à part (garde), la boucle repart toujours ; l'erreur est
   écrite dans la console (la vérification automatique la voit) et montrée une fois à l'écran, pour la décrire à Claude */
const vues = new Set();
function signaler(nom, e){
  console.error(`[${nom}]`, e);
  const cle = nom + ":" + (e && e.message);
  if(vues.has(cle)) return;
  vues.add(cle);
  toast(`⚠️ Erreur du jeu (${nom}) : ${e && e.message}. Dis-le à Claude, avec ce que tu faisais.`, 9000);
}
function garde(nom, f){ try{ return f(); }catch(e){ signaler(nom, e); } }
window.addEventListener("error", e => signaler("page", e.error || {message: e.message}));
window.addEventListener("unhandledrejection", e => signaler("page", e.reason || {message: "promesse"}));
/* Le téléphone peut retirer l'affichage 3D au jeu (contexte WebGL perdu, par exemple quand la mémoire manque) : l'image
   se fige pour de bon, même si le jeu tourne derrière. On garde la partie et on recharge la page (v1.9.7) */
renderer.domElement.addEventListener("webglcontextlost", e => {
  e.preventDefault();
  console.error("[affichage] contexte WebGL perdu");
  save();
  toast("⚠️ L'affichage s'est arrêté : le jeu redémarre, ta partie est gardée.", 4000);
  setTimeout(() => location.reload(), 1500);
});

let last = performance.now();
function tick(now){
  requestAnimationFrame(tick);                              // en premier : la boucle repart, quoi qu'il arrive
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const pushing = garde("marche", () => wrap.hidden && !isBusy() && !placing && !decorating() && !lifting() && updatePlayer(dt));   // pendant une pose, la déco ou un meuble soulevé, le personnage attend
  if(pushing) dirty = true;
  garde("portes", () => checkDoors(pushing));
  garde("caméra", () => camera_(now, dt));
  garde("plan de travail", () => updatePlan(isInside() && !decorating() && !lifting() && !isBusy()));   // bouton du plan de travail, quand on est tout près
  garde("coffre", () => updateCoffrePiece(isInside() && !decorating() && !lifting() && !isBusy() && wrap.hidden));   // un coffre dans la pièce : l'ouvrir, ou le poser
  garde("récolte", () => updateRecolte(dt, (!isInside() || ["mine", "foret", "grotte"].includes(currentPlace().b.type)) && wrap.hidden && !isBusy() && !placing));   // couper, planter, miner : le bouton d'action
  garde("torche", () => updateTorche(dt));                  // dans la grotte : la torche éclaire et s'use
  garde("combat", () => updateCombat(dt, wrap.hidden && !isBusy()));   // dans la grotte : les cœurs, les coups, les monstres
  garde("chemins", () => updateChemins(!isInside() && wrap.hidden && !isBusy() && !placing && !decorating()));   // sur l'île : tracer les chemins en marchant
  garde("dessin", () => renderer.render(currentScene(), camera));
  if(dirty && now - lastSave > 2000) garde("sauvegarde", () => {
    const p = islandPos();
    state.player = {x:+p.x.toFixed(2), z:+p.z.toFixed(2)};
    save(); lastSave = now; dirty = false;
  });
}
/* La caméra, le soleil, la mer, et ce qu'on bâtit dehors */
function camera_(now, dt){
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
  updateCiel(camT.x, camT.z);                              // le jour et la nuit (étape 1.10) : le ciel, le soleil, les vitres
  if(foret && currentPlace().b.type === "foret") nuitForet(nuitIci());
  if(!isInside()){
    water.position.y = -.2 + Math.sin(now * .0012) * .02;
    updateInteraction(dt);
  }
}

/* ================= Démarrage ================= */
$("#version").textContent = "v" + VERSION;
renderHUD();
requestAnimationFrame(tick);
setTimeout(() => {
  if(migrationMsg) toast(migrationMsg, 4200);
  else if(!state.buildings.some(b => !B[b.type].fixe)) toast("Ramasse les morceaux de bois et les cailloux au sol, cueille des herbes hautes : de quoi bâtir ta Scierie (Construire).", 5200);
}, 700);
