/* ================= L'usure des outils (demande de Yo, 10 octobre 2026) =================
   Grand Carnet : « Durabilité : chaque outil s'use » ; « plus il y a d'étoiles, plus l'outil dure longtemps ».
   Décidé par Yo : un outil usé se casse et disparaît, on en refabrique un (le carnet le disait émoussé, à réparer) ;
   un meilleur matériau dure plus longtemps (OUTILS[…].solidite : le nombre d'usages, chiffres divisés par deux à la
   demande de Yo) ; chaque coup donne une seule ressource, quel que soit l'outil. La torche garde sa règle (torche.js).
   Ce qui use un outil : un coup de hache, de pioche ou de pelle, un arrosage, un poisson pris, une bête prise au
   filet ou au bocal, un tir à l'arc, un coup d'épée qui touche. Une prise ratée n'use rien.
   Comme la torche : state.usure = {outil: usages déjà faits} compte pour le premier de cette sorte qu'on porte ;
   cassé, il quitte le sac (ou sa case rapide) et le suivant de la même sorte, s'il y en a un, repart à neuf. */
import { OUTILS, ATELIERS, FABRIQUE_A, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount, sacTake } from "./regles.js";
import { syncBarre, renderBarre } from "./barre.js";
import { toast } from "./interface.js";

if(!state.usure) state.usure = {};
export const solidite = k => OUTILS[k] && OUTILS[k].solidite || 0;
/* Ce qu'il reste d'usages à l'outil de cette sorte qu'on porte */
export const reste = k => Math.max(0, solidite(k) - (state.usure[k] || 0));
/* On prévient une fois, quand il en reste peu : 5 (4 pour la canne et le filet, 2 pour le bocal) */
const alerte = k => Math.min(5, Math.max(2, Math.round(solidite(k) / 4)));
const un = k => objet(k).une ? "une" : "un";
const ta = k => objet(k).une && !/^[aeiouéèêh]/i.test(objet(k).nom) ? "Ta" : "Ton";   // « ton épée », « ta hache »
/* Où le refabriquer : « à l'établi de la Scierie », « à l'enclume de la Forge » */
const DU = {scierie: "de la Scierie", chaumiere: "de la Chaumière", carriere: "de la Carrière", marche: "du Marché", taverne: "de la Taverne", forge: "de la Forge", chateau: "du Château"};
const ou = k => { const b = FABRIQUE_A[k], a = b && ATELIERS[b]; return a ? ` ${a.le.startsWith("le ") ? "au " + a.le.slice(3) : "à " + a.le} ${DU[b] || ""}` : ""; };
/* Un usage de l'outil k ; renvoie true s'il vient de se casser */
export function user(k, n = 1){
  if(!solidite(k) || !sacCount(k)) return false;
  const u = state.usure[k] = (state.usure[k] || 0) + n;
  if(u < solidite(k)){
    if(reste(k) === alerte(k)) setTimeout(() => toast(`⚠️ ${ta(k)} ${objet(k).nom.toLowerCase()} est presque usé${objet(k).une ? "e" : ""} : encore ${reste(k)} usages. Pense à en fabriquer ${un(k)} autre${ou(k)}`, 3800), 1300);
    renderBarre(); save();
    return false;
  }
  sacTake(k, 1); delete state.usure[k];
  syncBarre(); save();
  const encore = sacCount(k);
  setTimeout(() => toast(`💥 ${ta(k)} ${objet(k).nom.toLowerCase()} s'est cassé${objet(k).une ? "e" : ""} !${encore ? ` Tu prends ${objet(k).une ? "la" : "le"} suivant${objet(k).une ? "e" : ""}.` : ` Fabriques-en ${un(k)} autre${ou(k)}.`}`, 4200), 900);
  return true;
}
