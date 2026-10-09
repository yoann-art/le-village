/* ================= Les saisons et l'hémisphère (étape 1.10, morceau 2) =================
   Bible : « jour, nuit, météo et saisons suivent le vrai calendrier du téléphone » ; « le joueur choisit l'hémisphère
   nord ou sud au début de la partie ». La question est posée une seule fois (nord proposé d'abord), dès qu'aucun autre
   panneau n'est ouvert ; tant qu'il n'a pas répondu, c'est le nord. Au sud, les saisons sont inversées : tout ce qui
   suit les saisons (couleurs de l'île, fleurs, poissons, insectes, oiseaux, gibier, baies) suit ce choix
   (saisonDu dans donnees.js). */
import { reglerHemisphere, saison } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { rafraichirSaison } from "./monde/ile.js";
import { openSheet, closeSheet, toast, wrap } from "./interface.js";

export const NOM_SAISON = {printemps: "le printemps", ete: "l'été", automne: "l'automne", hiver: "l'hiver"};
const EMOJI = {printemps: "🌸", ete: "☀️", automne: "🍂", hiver: "❄️"};

export function choisirHemisphere(h){
  state.hemisphere = h; save();
  reglerHemisphere(h); rafraichirSaison();
}
function demander(){
  openSheet(`<div class="crown"><div class="intro-emoji">🌍</div><h2 class="display">Où vis-tu ?</h2>
    <p>Les saisons de ton île suivent le vrai calendrier. Au sud de la Terre, elles sont inversées : l'été tombe en janvier.</p>
    <button class="btn primary" data-hemi="nord" style="width:100%;margin:6px 0">Hémisphère nord<br><small>Europe, Amérique du Nord, Asie, Afrique du Nord</small></button>
    <button class="btn" data-hemi="sud" style="width:100%;margin:6px 0">Hémisphère sud<br><small>Australie, Amérique du Sud, Afrique du Sud</small></button>
    <p class="muted" style="margin:6px 0 0">On ne te le demandera plus.</p></div>`);
}
wrap.addEventListener("click", e => {
  const b = e.target.closest("[data-hemi]");
  if(!b) return;
  choisirHemisphere(b.dataset.hemi); closeSheet();
  const s = saison();
  toast(`${EMOJI[s]} Hémisphère ${b.dataset.hemi} : c'est ${NOM_SAISON[s]} sur ton île`, 3600);
});
/* La question attend qu'aucun autre panneau ne soit ouvert (le démontage des doubles, le couronnement…) */
if(!state.hemisphere){
  const t = setInterval(() => {
    if(state.hemisphere){ clearInterval(t); return; }
    if(!wrap.hidden) return;
    clearInterval(t); demander();
  }, 1500);
}
