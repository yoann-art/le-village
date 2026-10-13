/* ================= L'entrée de la mine (étape 1.11, morceau 1) =================
   Demande de Yo (9 octobre 2026) : sur l'île, pour accéder à la mine, il faut construire son entrée. Choix de Yo : on
   déblaie d'abord l'éboulement à la pioche (ENTREE_MINE.coups, chaque coup rend des pierres), puis on pose les étais
   (planches, pierres, torches), devant la mine ou depuis le menu Construire. Une partie neuve trouve l'entrée éboulée :
   state.entreeMine = « eboulee », puis « deblayee », puis rien (ouverte) ; state.deblai = les coups déjà donnés.
   Les parties commencées avant gardent leur mine ouverte. Tant qu'elle n'est pas ouverte, on n'y entre pas (lieux.js). */
import { ENTREE_MINE, OUTILS, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { hasAll, owned, pay, costHTML, missingHTML, mineOuverte, sacAdd, sacPlace, porte } from "./regles.js";
import { placeMesh } from "./monde/batiments.js";
import { doorOf } from "./lieux.js";
import { player, dir4 } from "./monde/personnage.js";
import { syncBarre, tenu, outilPour, prendreAction } from "./barre.js";
import { toast, renderHUD, closeSheet, wrap } from "./interface.js";
import { user } from "./usure.js";

const mine = () => state.buildings.find(b => b.type === "mine");
const nomDe = (k, n) => (n > 1 && objet(k).pluriel || objet(k).nom).toLowerCase();
const liste = c => Object.entries(c).map(([k, n]) => `${n} ${nomDe(k, n)}`).join(", ");
const reste = () => ENTREE_MINE.coups - (state.deblai || 0);
/* Un coup de pioche dans l'éboulement : un rocher de moins, et des pierres */
export function deblayer(){
  const k = tenu("pioche");                          // la pioche en main (demande de Yo : seulement ce qu'on tient)
  if(!k) return;
  state.deblai = (state.deblai || 0) + 1;
  const n = ENTREE_MINE.pierres, place = sacPlace("pierre") >= n;
  if(place) sacAdd("pierre", n);
  const fini = reste() <= 0;
  if(fini){ state.entreeMine = "deblayee"; delete state.deblai; }
  placeMesh(mine()); syncBarre(); renderHUD(); save();
  const pierres = place ? ` +${n} pierre${n > 1 ? "s" : ""}.` : " Ton sac est plein : les pierres restent là.";
  toast(fini ? `⛏️ L'éboulement est dégagé !${pierres} Pose maintenant les étais : ${liste(ENTREE_MINE.cost)}.`
    : `⛏️ Un rocher de moins (encore ${reste()}).${pierres}`, fini ? 4600 : 2000);
  user(k);
}
/* Poser les étais : l'entrée est construite, la mine est ouverte */
export function poserEtais(){
  if(state.entreeMine !== "deblayee") return;
  const c = ENTREE_MINE.cost;
  if(!hasAll(c)){
    const manque = Object.entries(c).filter(([k, n]) => owned(k) < n).map(([k, n]) => `${n - owned(k)} ${nomDe(k, n - owned(k))}`).join(", ");
    toast(`🏗️ Pour poser les étais, il te manque ${manque}. Les planches et les torches se font à l'établi de la Scierie.`, 4200);
    return;
  }
  pay(c); delete state.entreeMine;
  placeMesh(mine()); syncBarre(); renderHUD(); save();
  toast("⛰️ L'entrée de la mine est construite ! Entre, pioche en main, pour miner la pierre et le cuivre.", 4400);
}

/* Le bouton d'action, quand on est juste devant l'entrée et qu'on la regarde (recolte.js) */
export function entreeAction(){
  if(mineOuverte()) return null;
  const b = mine();
  if(!b) return null;
  const d = doorOf(b), n = d.n, p = player.position, f = dir4();
  if(f.x !== -n.x || f.z !== -n.z) return null;
  const cote = n.x === 0 ? Math.abs(p.x - d.x) : Math.abs(p.z - d.z), devant = (p.x - d.x) * n.x + (p.z - d.z) * n.z;
  if(cote > .8 || devant < 0 || devant > 1.6) return null;
  /* le bouton dit ce qu'on regarde (demande de Yo, 13 octobre 2026) ; sans pioche en main, toucher ne fait rien */
  if(state.entreeMine !== "eboulee") return {label: "🏗️ Poser les étais de la mine", nom: "🕳️ Entrée de la mine", run: poserEtais};
  if(tenu("pioche")) return {label: `⛏️ Déblayer l'éboulement (${reste()})`, nom: "🪨 Éboulement", run: deblayer};
  return {label: "⛏️ Il te faut une pioche pour déblayer l'éboulement", nom: "🪨 Éboulement", run: () => {}};
}

/* Sa ligne dans le menu Construire, juste après la Scierie (construire.js) */
export function ligneEntree(){
  if(mineOuverte()) return "";
  const c = ENTREE_MINE.cost, eboulee = state.entreeMine === "eboulee", ok = !eboulee && hasAll(c);
  return `<div class="brow"><div class="be" aria-hidden="true">⛰️</div>
    <div class="bt"><span class="bn">Entrée de la mine</span><p>${eboulee
      ? `Elle est éboulée : va devant la mine, au nord de la place du village, et déblaie l'éboulement à la pioche (encore ${reste()} coup${reste() > 1 ? "s" : ""}). Ensuite, pose les étais.`
      : "L'éboulement est dégagé : pose les étais pour ouvrir la mine, sa pierre et son cuivre."}</p>
      <div>${costHTML(c)}</div>${!eboulee && !ok ? `<p class="manque">${missingHTML(c)}</p>` : ""}</div>
    <button class="btn primary" data-mine ${ok ? "" : "disabled"}>${eboulee ? "Déblaie d'abord" : "Construire"}</button></div>`;
}
wrap.addEventListener("click", e => { if(e.target.closest("[data-mine]")){ closeSheet(); poserEtais(); } });
