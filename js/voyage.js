/* ================= Le voyage en barque (étape 1.13, morceau 3) =================
   Bible : une destination s'ouvre avec sa carte (au fond de la grotte précédente) et son transport (construit sur l'île) ;
   « Trajet : une courte scène animée, qu'on peut passer. Retour : on rentre au village quand on veut. »
   Au bout du ponton, la fiche de la Libellule (barque.js) : avec la carte du Marais (state.cartes.marais),
   « Partir » ; le trajet (TRAJET secondes : la barque glisse dans la brume, « Passer ⏭ » le saute), puis le Marais
   brumeux (monde/marais.js). Sur l'embarcadère du Marais, « 🛶 Rentrer au village » : le trajet du retour, et l'on se
   retrouve au bout du ponton, la barque amarrée. Rouvrir le jeu pendant un voyage : on est au bout du ponton. */
import { state } from "./sauvegarde.js";
import { BARQUE } from "./donnees.js";
import { centerOf } from "./monde/ile.js";
import { interior } from "./monde/interieurs.js";
import { barqueModele } from "./monde/ponton.js";
import { surEmbarcadere, DEPART } from "./monde/marais.js";
import { player } from "./monde/personnage.js";
import { allerA, retourIle, currentPlace, isBusy } from "./lieux.js";
import { resetJoy } from "./commandes.js";
import { toast } from "./interface.js";

const TRAJET = 7;                                       // la durée de la scène, en secondes
let voyage = null;                                      // {vers: "marais" | "ile", t}
let bateau = null;
export const voyageEnCours = () => !!voyage;
/* Le bout du ponton, où l'on se retrouve sur l'île */
const bout = () => { const P = state.ponton; return {x: centerOf(P.x), z: centerOf(P.z + P.n - 1)}; };

/* ----- Le bouton « Passer », et le texte du trajet ----- */
const passer = document.createElement("button");
passer.className = "btn primary"; passer.textContent = "Passer ⏭"; passer.hidden = true;
Object.assign(passer.style, {position: "absolute", left: "50%", bottom: "40px", transform: "translateX(-50%)", zIndex: 4});
document.getElementById("app") ? document.getElementById("app").appendChild(passer) : document.body.appendChild(passer);
passer.addEventListener("click", () => { if(voyage) voyage.t = TRAJET; });
const hint = text => { const h = document.getElementById("place-hint"); h.hidden = !text; if(text) h.textContent = text; h.classList.remove("bad"); };

function demarrer(vers){
  voyage = {vers, t: 0, parti: false};
  allerA({type: "trajet", vers}, {x: 0, z: 24, fx: 0, fz: -1}, bout(), () => {
    bateau = barqueModele(false); interior.add(bateau);
    voyage.parti = true;
    resetJoy();
    document.getElementById("actions").hidden = true; document.getElementById("joy").hidden = true;
    passer.hidden = false;
    hint(vers === "marais" ? "🌫️ En route vers le Marais brumeux…" : "🏡 Retour au village…");
  });
}
/* Partir vers le Marais (la fiche de la Libellule, barque.js) */
export function partirMarais(){
  if(voyage || isBusy() || !(state.cartes && state.cartes.marais) || !state.ponton) return;
  demarrer("marais");
}
function rentrer(){ if(!voyage && !isBusy()) demarrer("ile"); }
function arriver(){
  const vers = voyage.vers;
  voyage = null;
  if(bateau){ interior.remove(bateau); bateau = null; }
  passer.hidden = true; hint(null);
  document.getElementById("actions").hidden = false; document.getElementById("joy").hidden = false;
  if(vers === "marais") allerA({type: "marais"}, DEPART, bout(), () =>
    setTimeout(() => toast("🌫️ Le Marais brumeux… Des îlots perdus dans la brume, reliés par des passerelles : cyprès, aulnes, et des plantes à potions au bord de l'eau. Pour rentrer, reviens à la barque, sur l'embarcadère.", 6400), 400));
  else { const b = bout(); retourIle(b.x, b.z, -1, 0, () => setTimeout(() => toast("🏡 De retour au village : la Libellule est amarrée au bout du ponton", 3200), 400)); }
}

/* À chaque image (main.js) : la barque avance dans la brume ; au bout du trajet, on arrive */
let t = 0;
export function updateVoyage(dt){
  t += dt;
  if(!voyage || !voyage.parti || isBusy()) return;
  voyage.t += dt;
  const u = Math.min(1, voyage.t / TRAJET);
  player.position.set(Math.sin(u * 5) * .7, -.11, 24 - 48 * u);
  player.rotation.y = Math.PI - Math.cos(u * 5) * .25;
  if(bateau){
    bateau.position.set(player.position.x, .02 + Math.sin(t * 1.6) * .015, player.position.z);
    bateau.rotation.y = player.rotation.y;
    for(const [k, r] of (bateau.userData.rames || []).entries()) r.rotation.y = Math.sin(t * 7) * .55 * (k ? 1 : -1);
  }
  if(u >= 1) arriver();
}
/* Le bouton d'action (recolte.js) : sur l'embarcadère du Marais, rentrer au village */
export function voyageAction(){
  const p = currentPlace();
  if(voyage || !p || p.b.type !== "marais" || !surEmbarcadere(player.position.x, player.position.z)) return null;
  return {label: "🛶 Rentrer au village", nom: `🛶 ${BARQUE.nom[0].toUpperCase() + BARQUE.nom.slice(1)}`, run: rentrer};   // la barque amarrée (demande de Yo : son nom)
}
/* Pour la vérification automatique : passer la scène */
export const passerTrajet = () => { if(voyage) voyage.t = TRAJET; };
