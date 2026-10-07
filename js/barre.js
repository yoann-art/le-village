/* ================= Les cases rapides =================
   Trois cases au-dessus du joystick (demande de Yo) : les outils (et les graines) à portée de main, sans ouvrir le sac.
   Toucher une case prend son outil en main ; la retoucher le lâche. Toucher une case vide, ou appuyer
   longtemps sur une case, ouvre le choix de son outil. Sur ordinateur : touches 1, 2 et 3.
   Demande de Yo (v1.7.6) : ce qu'on met dans une case sort du sac, ça fait de la place (comme la barre du bas
   de Minecraft, en plus du sac). state.barre = [{k, n} ou null, ×3] : un outil, ou une pile de graines, de coffres,
   de rochers ; state.main = la clé de l'objet tenu. Un même objet n'occupe qu'une case. */
import { $ } from "./outils.js";
import { OUTILS, GRAINES, POSABLES, SAC, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount, pileOf, slotsAdd, slotsPlace } from "./regles.js";
import { holdTool } from "./monde/personnage.js";
import { openSheet, closeSheet, toast, wrap } from "./interface.js";

const bar = $("#barre");
/* Ce qui se tient en main : un outil, ou une graine qu'on va planter */
export const utilisable = k => !!(OUTILS[k] || GRAINES[k] || POSABLES[k]);

/* Prend un outil en main (une clé de OUTILS), ou vide la main (null) */
export function hold(k){
  if(k && !sacCount(k)) k = null;
  state.main = k; holdTool(k); renderBarre(); save();
}
export function toggleHold(k){
  if(state.main === k){ hold(null); toast("Mains libres"); }
  else { hold(k); toast(`${objet(k).emoji} ${objet(k).nom} en main`); }
}
/* Après un changement : une case vidée se libère ; la main qui tenait un objet qu'on n'a plus se vide */
export function syncBarre(){
  state.barre = state.barre.map(it => it && it.n > 0 ? it : null);
  if(state.main && !sacCount(state.main)){ state.main = null; holdTool(null); }
  renderBarre();
}
export const dansCase = k => state.barre.findIndex(it => it && it.k === k);
/* Un outil (une graine, un coffre…) arrive dans le sac : s'il n'a pas encore de case, il sort du sac et prend
   la première case vide */
export function barreAuto(k){
  if(!utilisable(k) || dansCase(k) >= 0) return;
  const i = state.barre.indexOf(null), j = state.sac.map(it => it.k).lastIndexOf(k);
  if(i < 0 || j < 0) return;
  state.barre[i] = state.sac.splice(j, 1)[0];
  renderBarre();
}
/* Met en case ce coffre rempli précis (celui qu'on va poser) : si un autre est déjà en case, ils échangent leur place */
export function enCase(it){
  const s = state.sac.indexOf(it);
  if(s < 0) return;
  const c = dansCase(it.k), libre = state.barre.indexOf(null);
  if(c >= 0){ state.sac[s] = state.barre[c]; state.barre[c] = it; }
  else if(libre >= 0){ state.sac.splice(s, 1); state.barre[libre] = it; }
  renderBarre();
}
/* Remet le contenu d'une case dans le sac ; false s'il n'y a pas la place */
export function auSac(it){
  if(it.items || pileOf(it.k) === 1){ if(state.sac.length >= SAC.places) return false; state.sac.push(it); return true; }
  if(slotsPlace(state.sac, SAC.places, it.k) < it.n) return false;
  slotsAdd(state.sac, SAC.places, it.k, it.n);
  return true;
}
/* Met dans la case i l'objet k (pris dans le sac, ou dans une autre case) ; ce qu'il y avait retourne au sac */
export function mettreEnCase(i, k){
  const j = dansCase(k);
  if(j === i) return true;
  if(j >= 0){ [state.barre[i], state.barre[j]] = [state.barre[j], state.barre[i]]; renderBarre(); return true; }
  const s = state.sac.map(it => it.k).lastIndexOf(k);
  if(s < 0) return false;
  const pile = state.sac.splice(s, 1)[0], avant = state.barre[i];
  if(avant && !auSac(avant)){ state.sac.splice(s, 0, pile); toast("Ton sac est plein : range d'abord des affaires dans un coffre", 3000); return false; }
  state.barre[i] = pile;
  renderBarre();
  return true;
}
/* La jauge d'eau d'un arrosoir (vide si ce n'est pas un arrosoir) */
export const jauge = k => OUTILS[k] && OUTILS[k].eau
  ? `<span class="jauge" aria-hidden="true"><i style="width:${Math.round(100 * Math.min(state.eau, OUTILS[k].eau) / OUTILS[k].eau)}%"></i></span>`
  : OUTILS[k] && OUTILS[k].duree && state.torche > 0                 // la torche allumée : ce qui lui reste à brûler
  ? `<span class="jauge feu" aria-hidden="true"><i style="width:${Math.round(100 * state.torche / OUTILS[k].duree)}%"></i></span>` : "";
export function renderBarre(){
  bar.innerHTML = state.barre.map((it, i) => { const k = it && it.k;
    return k
    ? `<button class="case${state.main === k ? " on" : ""}" data-case="${i}" aria-label="${it.n > 1 ? it.n + " " : ""}${objet(k).nom}${state.main === k ? ", en main" : ""}${OUTILS[k] && OUTILS[k].eau ? `, eau ${state.eau} sur ${OUTILS[k].eau}` : ""}">${icone(k)}${pileOf(k) > 1 ? `<span class="cn">${it.n}</span>` : ""}${jauge(k)}</button>`
    : `<button class="case vide" data-case="${i}" aria-label="Case vide : choisir un outil">+</button>`; }).join("");
}

/* ----- Choisir l'outil d'une case : parmi les outils du sac (ou d'une autre case : on les échange) ----- */
let chooseFor = 0;
function chooser(i){
  chooseFor = i;
  const ici = state.barre[i] && state.barre[i].k;
  const tools = [...new Set([...state.sac, ...state.barre.filter(Boolean)].map(it => it.k).filter(utilisable))];
  openSheet(`<div class="sh-head"><h2 class="display">Case ${i + 1}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Choisis ce que tu mets dans cette case : il sort de ton sac, ça te fait de la place. Touche ensuite la case pour le prendre en main, et encore une fois pour le lâcher.</p>` +
    (tools.length ? tools.map(k => { const j = dansCase(k);
      return `<div class="brow"><div class="be" aria-hidden="true">${icone(k)}</div>
        <div class="bt"><span class="bn">${objet(k).nom}</span><p>${j >= 0 && j !== i ? `Dans la case ${j + 1}. ` : ""}${objet(k).usage}</p></div>
        <button class="btn primary" data-case-mettre="${k}" ${ici === k ? "disabled" : ""}>${ici === k ? "Déjà ici" : j >= 0 ? "Échanger" : "Choisir"}</button></div>`; }).join("")
      : `<p class="hint-box">Ton sac n'a pas d'outil. Fabrique-les à l'établi de la Scierie : ils arrivent dans ton sac.</p>`) +
    (ici ? `<button class="btn ghost" data-case-vider style="margin-top:10px">Remettre dans le sac</button>` : ""));
}
wrap.addEventListener("click", e => {
  const m = e.target.closest("[data-case-mettre]");
  if(m){
    if(mettreEnCase(chooseFor, m.dataset.caseMettre)){ closeSheet(); save(); }
  }
  else if(e.target.closest("[data-case-vider]")){
    const it = state.barre[chooseFor];
    if(it && !auSac(it)){ toast("Ton sac est plein : range d'abord des affaires dans un coffre", 3000); return; }
    state.barre[chooseFor] = null;
    closeSheet(); renderBarre(); save();
  }
});

/* ----- Le doigt sur une case : toucher = prendre ou lâcher ; appui long (½ s) = choisir son outil ----- */
let press = null;
bar.addEventListener("pointerdown", e => {
  const c = e.target.closest("[data-case]");
  if(!c) return;
  const i = +c.dataset.case;
  press = {i, long: false, t: setTimeout(() => { press.long = true; chooser(i); }, 500)};
});
const endPress = () => { if(press) clearTimeout(press.t); };
bar.addEventListener("pointerup", endPress);
bar.addEventListener("pointercancel", endPress);
bar.addEventListener("pointerleave", endPress);
bar.addEventListener("click", e => {
  const c = e.target.closest("[data-case]");
  if(!c) return;
  const long = press && press.long;
  press = null;
  if(long) return;
  const i = +c.dataset.case, it = state.barre[i];
  if(it) toggleHold(it.k); else chooser(i);
});
/* Sur ordinateur : 1, 2 et 3 */
window.addEventListener("keydown", e => {
  const i = ["1", "2", "3"].indexOf(e.key);
  if(i < 0 || !wrap.hidden || $("#joy").hidden || !state.barre[i]) return;
  toggleHold(state.barre[i].k);
});

/* Au démarrage : les cases et l'outil tenu, tels que la partie les a gardés */
syncBarre();
if(state.main) holdTool(state.main);
