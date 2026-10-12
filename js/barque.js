/* ================= La barque (étape 1.13, morceau 2) =================
   Bible : une destination s'ouvre avec sa carte et son transport, construit sur l'île ; le Marais brumeux se rejoint en
   barque. Décidé par Yo : elle se construit au ponton, et sert aussi à pêcher au large (Grand Carnet : « au large,
   depuis la barque » ; le thon). Son nom proposé par le Grand Carnet : « la Libellule ».
   - Le chantier : au bout du ponton, face à la borne d'amarrage (à droite), ou sans canne en main : « 🛶 Construire la
     barque » ouvre sa fiche (BARQUE.cost) ; les travaux durent BARQUE.t en temps réel, même jeu fermé
     (state.barque = {fin}) ; on voit sa carcasse ; finie, elle est amarrée au bout du ponton.
   - À bord : « 🛶 Monter dans la Libellule » ; on rame avec le joystick, seulement en mer (pas sur l'étang, ni sous le
     ponton ou le pont), jusqu'à quelques cases au-delà de l'île ; tout près du ponton, « 🛶 Accoster au ponton ».
     La canne en main, on pêche tout autour de la barque ; au large (BARQUE.large cases de toute terre), les poissons
     du large (le thon, en été ; peche.js).
   - Rouvrir le jeu : on se retrouve au bout du ponton, la barque amarrée. Le voyage vers le Marais : morceau 3. */
import { $ } from "./outils.js";
import { BARQUE, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, hasAll, missingHTML } from "./regles.js";
import { scene } from "./monde/scene.js";
import { map, idx, inb, N, tileOf, centerOf, lieuEau } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { passageCases, amarre, barqueModele } from "./monde/ponton.js";
import { player, placePlayer, setWalkable, islandWalkable, allure, regard } from "./monde/personnage.js";
import { tenu } from "./barre.js";
import { currentPlace } from "./lieux.js";
import { openSheet, closeSheet, toast, wrap, renderHUD } from "./interface.js";

const P = state.ponton;
const Nom = BARQUE.nom[0].toUpperCase() + BARQUE.nom.slice(1);           // « La Libellule »
const duree = s => s < 60 ? `${Math.ceil(s)} s` : `${Math.ceil(s / 60)} min`;
export const barquePrete = () => !!state.barque && Date.now() >= state.barque.fin;
let aBord = false;
export const enBarque = () => aBord;

/* ----- Où l'on rame : la mer (pas l'étang, ni le ponton, le pont ou l'orée de la forêt), jusqu'à MARGE cases au-delà
   de l'île ----- */
const MARGE = 8;
function merLibre(x, z){
  if(!inb(x, z)) return x >= -MARGE && z >= -MARGE && x < N + MARGE && z < N + MARGE;
  const i = idx(x, z);
  return map.type[i] === "water" && !passageCases.has(i) && !occ.has(i) && lieuEau(i) === "mer";
}
const merWalkable = (wx, wz) => merLibre(tileOf(wx), tileOf(wz));
/* Au large : aucune terre (ni ponton, ni pont, ni orée) à moins de BARQUE.large cases */
export function auLarge(wx, wz){
  const x = tileOf(wx), z = tileOf(wz), L = BARQUE.large;
  for(let dz = -L; dz <= L; dz++) for(let dx = -L; dx <= L; dx++){
    const a = x + dx, b = z + dz;
    if(!inb(a, b)) continue;
    const i = idx(a, b);
    if(map.type[i] !== "water" || passageCases.has(i) || occ.has(i)) return false;
  }
  return true;
}

/* ----- Le modèle : la carcasse pendant les travaux, puis la barque, amarrée ou sous le personnage ----- */
let mesh = null, vue = null, t = 0;
function dessiner(){
  const voulu = !state.barque || !P ? null : barquePrete() ? "finie" : "chantier";
  if(voulu !== vue){
    if(mesh) scene.remove(mesh);
    mesh = voulu ? barqueModele(voulu === "chantier") : null;
    if(mesh) scene.add(mesh);
    vue = voulu;
  }
  if(!mesh) return;
  const p = player.position, houle = Math.sin(t * 1.6) * .015;
  if(aBord){ mesh.position.set(p.x, .02 + houle, p.z); mesh.rotation.y = player.rotation.y; }
  else { mesh.position.set(amarre.x, .02 + houle, amarre.z); mesh.rotation.y = 0; }
  mesh.rotation.z = Math.sin(t * 1.1) * .02;
  const a = aBord ? allure() : 0;                       // les rames battent quand on rame
  for(const [k, r] of (mesh.userData.rames || []).entries()) r.rotation.y = a ? Math.sin(t * 7) * .55 * (k ? 1 : -1) : 0;
}

/* ----- Le bout du ponton : construire, monter ; à bord : accoster ----- */
const pres = (m = 1.6) => !!amarre && Math.hypot(player.position.x - amarre.x, player.position.z - amarre.z) < m;
const auBout = () => P && tileOf(player.position.x) === P.x && tileOf(player.position.z) >= P.z + P.n - 2 && tileOf(player.position.z) < P.z + P.n;
const info = label => ({label, run: () => toast(label, 3000)});
/* Le bouton d'action (recolte.js, avant les autres) : null s'il n'y a rien à faire avec la barque ici */
export function barqueAction(){
  if(!P || !amarre) return null;
  if(aBord) return pres(1.4) ? {label: "🛶 Accoster au ponton", run: accoster} : null;
  /* au bout du ponton : tourné vers la borne (à droite), ou sans canne en main (sinon, on y pêche) */
  if(!auBout() || (tenu("canne") && regard().x < .5)) return null;
  if(!state.barque) return {label: "🛶 Construire la barque", run: ouvrirChantier};
  if(!barquePrete()) return info(`🛶 ${Nom} : prête dans ${duree((state.barque.fin - Date.now()) / 1000)}`);
  return {label: `🛶 Monter dans ${BARQUE.nom}`, run: monter};
}
function monter(){
  if(!barquePrete() || aBord) return;
  aBord = true;
  setWalkable(merWalkable);
  placePlayer(amarre.x, amarre.z, 0, 1);
  toast(`🛶 Tu montes dans ${BARQUE.nom} : rame avec le joystick. Au large, loin de la côte, on pêche le thon en été. Reviens au bout du ponton pour accoster`, 4800);
}
function accoster(){
  if(!aBord) return;
  aBord = false;
  setWalkable(islandWalkable);
  placePlayer(centerOf(P.x), centerOf(P.z + P.n - 1), -1, 0);
  toast(`🛶 Tu accostes : ${BARQUE.nom} reste amarrée au bout du ponton`, 2600);
}
export const accosterBarque = accoster;               // pour la vérification automatique
/* Où l'on se retrouve en rouvrant le jeu, si on ramait (main.js le garde) : au bout du ponton */
export const posBarque = () => aBord ? {x: centerOf(P.x), z: centerOf(P.z + P.n - 1)} : null;

/* ----- Le chantier : sa fiche, puis les travaux en temps réel ----- */
const chip = (k, need) => `<span class="chip ${owned(k) >= need ? "" : "short"}">${icone(k)} ${owned(k)}/${need}</span>`;
function ouvrirChantier(){
  const ok = hasAll(BARQUE.cost);
  openSheet(`<div class="sh-head"><h2 class="display">🛶 La barque</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">${Nom}, une barque de bois, amarrée au bout du ponton. Elle t'emmène pêcher au large (le thon, en été), et plus tard jusqu'au Marais brumeux, quand tu auras sa carte.</p>
    <div class="brow"><div class="be" aria-hidden="true">🛶</div>
      <div class="bt"><span class="bn">${Nom}</span><p>⏱ ${duree(BARQUE.t)} de travaux, même jeu fermé</p>
        <div>${Object.entries(BARQUE.cost).map(([k, v]) => chip(k, v)).join("")}</div>
        ${ok ? "" : `<p>${missingHTML(BARQUE.cost)}</p>`}</div>
      <button class="btn primary" data-barque ${ok ? "" : "disabled"}>Construire</button></div>`);
}
function construire(){
  if(state.barque || !hasAll(BARQUE.cost)) return;
  for(const [k, v] of Object.entries(BARQUE.cost)) addOwned(k, -v);
  state.barque = {fin: Date.now() + BARQUE.t * 1000};
  save(); renderHUD(); closeSheet();
  toast(`🛶 Les travaux de ${BARQUE.nom} commencent au bout du ponton : elle sera prête dans ${duree(BARQUE.t)}, même jeu fermé`, 4200);
}
wrap.addEventListener("click", e => { if(e.target.closest("[data-barque]")) construire(); });

/* ----- À chaque image (main.js) ----- */
export function updateBarque(dt){
  t += dt;
  if(aBord && currentPlace()) aBord = false;             // (on n'entre nulle part en barque, mais au cas où)
  if(state.barque && barquePrete() && !state.barque.annoncee){
    state.barque.annoncee = true; save();
    toast(`🛶 ${Nom} est prête, amarrée au bout du ponton : monte à bord pour pêcher au large`, 4200);
  }
  dessiner();
  if(aBord) player.position.y = -.11;                   // les pieds au fond de la barque
}
