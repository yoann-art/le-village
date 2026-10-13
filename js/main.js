/* ================= Point de départ du jeu =================
   Relie tous les morceaux, fait tourner la boucle de jeu et lance la partie.
   L'ordre des lignes « import » compte : la mise à jour en tout premier (même si la 3D
   ne charge pas), puis la vérification, puis le décor dans l'ordre où il est posé
   (lumières, île, bâtiments, personnage). */
import "./miseajour.js";
import "./verification.js";
import "./pleinecran.js";                                 // le plein écran (demande de Yo, 13 octobre 2026)
import { $ } from "./outils.js";
import { VERSION } from "./version.js";
import { B } from "./donnees.js";
import { renderer, camera, sun, D, distanceFor, setDistance, setFov, FOV_DESSUS } from "./monde/scene.js";
import { water } from "./monde/ile.js";
import "./monde/batiments.js";
import { player, updatePlayer, regard } from "./monde/personnage.js";
import "./coffres.js";
import { view } from "./commandes.js";
import { state, save, migrationMsg, eraseSave } from "./sauvegarde.js";
import { renderHUD, toast, wrap, closeSheet } from "./interface.js";
import { placing, startPlacing, stopPlacing, updateInteraction, upgradeDetail, placementFocus } from "./construire.js";
import { isInside, isBusy, currentScene, checkDoors, cameraTarget, takeJump, islandPos, currentPlace } from "./lieux.js";
import { decorating, lifting, decoView, updateLift, addMeuble, finishDeco } from "./decorer.js";
import { updatePlan } from "./ateliers.js";
import { updateCoffrePiece } from "./coffres.js";
import { updateVitrine } from "./vitrine.js";
import { updateTorche } from "./torche.js";
import { updateCombat } from "./combat.js";
import { updateChemins } from "./terraformer.js";
import { lampeSur, nuitForet, penombre, ajusterBrume, murDevant } from "./monde/interieurs.js";
import { updateLumieres } from "./lumieres.js";
import { updateBarque, posBarque } from "./barque.js";
import { deplaceEnCours } from "./deplacer.js";
import { updateVoyage, voyageEnCours } from "./voyage.js";
import { updateMarais } from "./monde/marais.js";
import { lueurLanternes } from "./monde/essences.js";
import { updateCiel, nuitIci } from "./monde/ciel.js";
import { updateMeteo, couvertIci } from "./monde/meteo.js";
import { updateRecolte } from "./recolte.js";
import { vuePremiere, activerVue, tangageVue, horizon, premiereActive } from "./vue.js";
import { updateMains, dessinerMains, mainsInactives } from "./monde/mains.js";
import { enBarque } from "./barque.js";
import "./sac.js";
import "./barre.js";
import "./saisons.js";
import "./station.js";

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
/* La vue à la première personne (vue.js) : les yeux du personnage (il mesure 1 P), un angle de vue plus large ; on
   repasse tout seul en vue de dessus pour décorer, bâtir, déplacer une lumière, pendant la scène du voyage et en barque */
const OEIL = .8;
let lacet = null;                                          // où regarde la caméra (suit le regard du personnage, en douceur)
function premierePossible(){
  return vuePremiere() && !decoView() && !decorating() && !lifting() && !placing && !deplaceEnCours() && !voyageEnCours()
    && !enBarque() && !(isInside() && currentPlace().b.type === "trajet");
}
/* L'angle de vue, de haut en bas : 85° en portrait (l'écran est étroit), 55° en paysage (plus large, choix de Yo) */
const fovPremiere = () => Math.max(55, Math.min(85, 2 * Math.atan(Math.tan(40 * Math.PI / 180) / camera.aspect) * 180 / Math.PI));

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
  const pushing = garde("marche", () => wrap.hidden && !isBusy() && !placing && !decorating() && !lifting() && !deplaceEnCours() && !voyageEnCours() && updatePlayer(dt));   // pendant une pose, la déco ou un meuble soulevé, le personnage attend
  if(pushing) dirty = true;
  garde("portes", () => checkDoors(pushing));
  garde("caméra", () => camera_(now, dt, pushing));
  garde("plan de travail", () => updatePlan(isInside() && !decorating() && !lifting() && !isBusy()));   // bouton du plan de travail, quand on est tout près
  garde("coffre", () => updateCoffrePiece(isInside() && !decorating() && !lifting() && !isBusy() && wrap.hidden));   // un coffre dans la pièce : l'ouvrir, ou le poser
  garde("vitrine", () => updateVitrine(isInside() && !decorating() && !lifting() && !isBusy() && wrap.hidden));   // une vitrine tout près : exposer une pierre (étape 1.11)
  garde("barque", () => updateBarque(dt));                  // la barque du ponton : ses travaux, à bord (étape 1.13)
  garde("voyage", () => updateVoyage(dt));                  // le trajet en barque vers le Marais, et le retour
  garde("marais", () => updateMarais(dt));                  // au Marais : ses plantes suivent la nuit et la saison, les feux-follets dansent
  garde("lumières", () => updateLumieres(dt, isInside() && !decorating() && !lifting() && !isBusy() && wrap.hidden));   // les lumières posées, la torche sur la torchère
  garde("récolte", () => updateRecolte(dt, (!isInside() || ["mine", "foret", "grotte", "marais"].includes(currentPlace().b.type)) && wrap.hidden && !isBusy() && !placing));   // couper, planter, miner : le bouton d'action
  garde("torche", () => updateTorche(dt));                  // dans la grotte : la torche éclaire et s'use
  garde("combat", () => updateCombat(dt, wrap.hidden && !isBusy()));   // dans la grotte : les cœurs, les coups, les monstres
  garde("chemins", () => updateChemins(!isInside() && wrap.hidden && !isBusy() && !placing && !decorating()));   // sur l'île : tracer les chemins en marchant
  garde("dessin", () => renderer.render(currentScene(), camera));
  if(premiereActive()) garde("mains", () => { updateMains(dt, isInside()); dessinerMains(); });   // à la première personne : les mains, par-dessus
  else mainsInactives();
  if(dirty && now - lastSave > 2000) garde("sauvegarde", () => {
    const p = posBarque() || islandPos();                  // en barque : on se retrouvera au bout du ponton
    state.player = {x:+p.x.toFixed(2), z:+p.z.toFixed(2)};
    save(); lastSave = now; dirty = false;
  });
}
/* La caméra, le soleil, la mer, et ce qu'on bâtit dehors */
function camera_(now, dt, marche){
  const dv = decoView();
  const foret = isInside() && ["foret", "grotte", "marais", "trajet"].includes(currentPlace().b.type);   // la forêt et la grotte se voient comme dehors, en grand
  const fps = premierePossible();
  activerVue(fps);
  murDevant(fps);                                          // dans une pièce : le mur de devant et le plafond, aux yeux seulement
  if(fps){
    setFov(fovPremiere());
    setDistance(12);                                       // le brouillard et l'ombre du soleil autour de soi
    ajusterBrume(4.5);
    horizon(dt, marche);                                   // en marchant, les yeux reviennent à l'horizon
    const saut = takeJump(), p = player.position, r = regard(), but = Math.atan2(r.x, r.z);
    camT.set(p.x, 0, p.z);
    if(saut || lacet === null) lacet = but;
    else { let d = but - lacet; d = Math.atan2(Math.sin(d), Math.cos(d)); lacet += d * Math.min(1, dt * 22); }
    const t = tangageVue(), c = Math.cos(t);
    camera.position.set(p.x, OEIL, p.z);
    camera.lookAt(p.x + Math.sin(lacet) * c, OEIL + Math.sin(t), p.z + Math.cos(lacet) * c);
  } else {
  lacet = null;
  setFov(FOV_DESSUS);
  setDistance(distanceFor(dv ? dv.width : isInside() && !foret ? VIEW_IN : VIEW_OUT) * view.zoom);
  ajusterBrume(D);                                         // la brume de la grotte du Marais suit la caméra (étape 1.13)
  const target = dv ? dv.target : (!isInside() && placementFocus()) || cameraTarget();
  if(takeJump()) camT.copy(target);
  else camT.lerp(target, 1 - Math.pow(.0005, dt));
  camera.position.copy(camT).addScaledVector(OFF, D);
  camera.lookAt(camT.x, .4, camT.z);
  }
  updateLift();                                            // le meuble soulevé reste sous le doigt pendant que la caméra recule
  if(foret || isInside() && currentPlace().b.type === "mine") lampeSur(camT.x, camT.z);   // la lumière suit, dans les grands lieux
  const sousLeCiel = !isInside() || ["foret", "marais"].includes(currentPlace().b.type);
  garde("météo", () => updateMeteo(dt, sousLeCiel ? currentScene() : null, camT.x, camT.z));   // la pluie, la neige, les éclairs (étape 1.10)
  updateCiel(camT.x, camT.z);                              // le jour et la nuit (étape 1.10) : le ciel, le soleil, les vitres
  if(foret && ["foret", "marais"].includes(currentPlace().b.type)) nuitForet(Math.max(nuitIci(), couvertIci() * .6));   // la forêt et le Marais s'assombrissent aussi sous la pluie
  lueurLanternes(nuitIci());                               // les fruits des arbres-lanternes s'allument la nuit (étape 1.13)
  if(isInside()) penombre(nuitIci());                      // la pénombre des bâtiments, plus sombre la nuit (demande de Yo)
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
  else if(!state.buildings.some(b => !B[b.type].fixe)) toast("Ramasse les branches de chêne et les cailloux au sol, cueille des herbes hautes : de quoi bâtir ta Scierie (Construire).", 5200);
}, 700);
