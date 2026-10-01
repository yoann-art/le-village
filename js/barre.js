/* ================= Les cases rapides =================
   Trois cases au-dessus du joystick (demande de Yo) : les outils (et les graines) à portée de main, sans ouvrir le sac.
   Toucher une case prend son outil en main ; la retoucher le lâche. Toucher une case vide, ou appuyer
   longtemps sur une case, ouvre le choix de son outil. Sur ordinateur : touches 1, 2 et 3.
   state.barre = [clé d'outil ou null, ×3] ; state.main = l'outil tenu. Une case ne garde qu'un outil du sac. */
import { $ } from "./outils.js";
import { OUTILS, GRAINES, POSABLES, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount } from "./regles.js";
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
/* Après un changement du sac : une case, ou la main, qui garde un outil sorti du sac se vide */
export function syncBarre(){
  state.barre = state.barre.map(k => k && sacCount(k) ? k : null);
  if(state.main && !sacCount(state.main)){ state.main = null; holdTool(null); }
  renderBarre();
}
/* Un outil arrive dans le sac : il prend la première case vide */
export function barreAuto(k){
  if(!utilisable(k) || state.barre.includes(k)) return;
  const i = state.barre.indexOf(null);
  if(i >= 0){ state.barre[i] = k; renderBarre(); }
}
/* La jauge d'eau d'un arrosoir (vide si ce n'est pas un arrosoir) */
export const jauge = k => OUTILS[k] && OUTILS[k].eau
  ? `<span class="jauge" aria-hidden="true"><i style="width:${Math.round(100 * Math.min(state.eau, OUTILS[k].eau) / OUTILS[k].eau)}%"></i></span>` : "";
export function renderBarre(){
  bar.innerHTML = state.barre.map((k, i) => k
    ? `<button class="case${state.main === k ? " on" : ""}" data-case="${i}" aria-label="${objet(k).nom}${state.main === k ? ", en main" : ""}${OUTILS[k] && OUTILS[k].eau ? `, eau ${state.eau} sur ${OUTILS[k].eau}` : ""}">${objet(k).emoji}${GRAINES[k] || POSABLES[k] ? `<span class="cn">${sacCount(k)}</span>` : ""}${jauge(k)}</button>`
    : `<button class="case vide" data-case="${i}" aria-label="Case vide : choisir un outil">+</button>`).join("");
}

/* ----- Choisir l'outil d'une case : parmi les outils du sac ----- */
let chooseFor = 0;
function chooser(i){
  chooseFor = i;
  const tools = [...new Set(state.sac.map(it => it.k).filter(utilisable))];
  openSheet(`<div class="sh-head"><h2 class="display">Case ${i + 1}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Choisis l'outil de cette case. Touche ensuite la case pour le prendre en main, et encore une fois pour le lâcher.</p>` +
    (tools.length ? tools.map(k => `<div class="brow"><div class="be" aria-hidden="true">${objet(k).emoji}</div>
        <div class="bt"><span class="bn">${objet(k).nom}</span><p>${objet(k).usage}</p></div>
        <button class="btn primary" data-case-mettre="${k}" ${state.barre[i] === k ? "disabled" : ""}>${state.barre[i] === k ? "Déjà ici" : "Choisir"}</button></div>`).join("")
      : `<p class="hint-box">Ton sac n'a pas d'outil. Fabrique-les à l'établi de la Scierie : ils arrivent dans ton sac.</p>`) +
    (state.barre[i] ? `<button class="btn ghost" data-case-vider style="margin-top:10px">Vider la case</button>` : ""));
}
wrap.addEventListener("click", e => {
  const m = e.target.closest("[data-case-mettre]");
  if(m){
    const k = m.dataset.caseMettre, j = state.barre.indexOf(k);
    if(j >= 0) state.barre[j] = null;            // un outil n'occupe qu'une case
    state.barre[chooseFor] = k;
    closeSheet(); renderBarre(); save();
  }
  else if(e.target.closest("[data-case-vider]")){
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
  const i = +c.dataset.case, k = state.barre[i];
  if(k) toggleHold(k); else chooser(i);
});
/* Sur ordinateur : 1, 2 et 3 */
window.addEventListener("keydown", e => {
  const i = ["1", "2", "3"].indexOf(e.key);
  if(i < 0 || !wrap.hidden || $("#joy").hidden || !state.barre[i]) return;
  toggleHold(state.barre[i]);
});

/* Au démarrage : les cases et l'outil tenu, tels que la partie les a gardés. La toute première fois,
   les outils déjà dans le sac (fabriqués avant les cases rapides) remplissent les cases. */
if(!state.barreVue){ for(const it of state.sac) barreAuto(it.k); state.barreVue = true; save(); }
syncBarre();
if(state.main) holdTool(state.main);
