/* ================= Les cases rapides =================
   Trois cases au-dessus du joystick (demande de Yo) : les outils (et les graines) à portée de main, sans ouvrir le sac.
   Toucher une case prend son outil en main ; la retoucher le lâche. Toucher une case vide, ou appuyer
   longtemps sur une case, ouvre le choix de son outil. Sur ordinateur : touches 1, 2 et 3.
   Demande de Yo (v1.7.6) : ce qu'on met dans une case sort du sac, ça fait de la place (comme la barre du bas
   de Minecraft, en plus du sac). state.barre = [{k, n} ou null, ×3] : un outil, ou une pile de graines, de coffres,
   de rochers ; state.main = la clé de l'objet tenu. Un même objet n'occupe qu'une case.
   Demande de Yo (11 octobre 2026, « cela vaut pour tous les outils ») : on ne se sert que de ce qu'on tient en main, et
   on ne tient en main que ce qui est dans une case rapide (avant, le jeu prenait l'outil dans le sac tout seul). Si
   l'outil est dans une case, le bouton d'action le dit et le toucher le prend en main (`prendreAction`) ; s'il est
   seulement dans le sac, il ne sert pas. La torche est à part : dans une case, elle se tient dans la main gauche,
   en même temps que l'outil ou l'arme (torche.js) ; l'arc se tient à deux mains (DEUX_MAINS). */
import { $ } from "./outils.js";
import { OUTILS, GRAINES, POSABLES, CHEMIN_DE, SAC, objet, icone, poseDehors } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount, pileOf, slotsAdd, slotsPlace, placesSac } from "./regles.js";
import { holdTool } from "./monde/personnage.js";
import { openSheet, closeSheet, toast, wrap } from "./interface.js";

const bar = $("#barre");
/* Ce qui se tient en main : un outil, une graine qu'on va planter, ce qu'on pose ; et la matière d'un chemin
   (planches, blocs, gravier : étape 1.9), qu'on prend en main soi-même */
export const enCaseAuto = k => !!(OUTILS[k] || GRAINES[k] || POSABLES[k]);
export const utilisable = k => enCaseAuto(k) || !!CHEMIN_DE[k] || poseDehors(k);   // une lumière à poser dehors se prend en main aussi

/* Ce qui se tient à deux mains : la torche ne peut pas être tenue avec (torche.js la pose au sol) */
export const DEUX_MAINS = new Set(["arc"]);
export const deuxMains = () => !!(state.main && OUTILS[state.main] && DEUX_MAINS.has(OUTILS[state.main].famille));
/* Prend un objet en main (il doit être dans une case rapide : pris dans le sac, il y va d'abord), ou vide la main (null) ;
   false s'il n'y a pas de case libre. La torche, elle, se tient dans la main gauche toute seule */
export function hold(k){
  if(k && OUTILS[k] && OUTILS[k].famille === "torche"){ toast("🔥 La torche se tient dans la main gauche : dans une case rapide, elle s'allume toute seule dans le noir", 3600); return false; }
  if(k && dansCase(k) < 0){
    if(sacCount(k)) barreAuto(k);
    if(dansCase(k) < 0){ if(sacCount(k)) toast("🎒 Tes 3 cases rapides sont pleines : libère-en une pour prendre cet objet en main", 3400); return false; }
  }
  state.main = k; holdTool(k); renderBarre(); save();
  return true;
}
export function toggleHold(k){
  if(state.main === k){ hold(null); toast("Mains libres"); }
  else if(hold(k)) toast(`${objet(k).emoji} ${objet(k).nom} en main`);
}
/* ----- L'outil qu'on tient (demande de Yo : seulement celui-là sert) ----- */
/* L'outil d'une famille qu'on tient en main, assez solide (force), sinon null */
export const tenu = (famille, force = 0) => { const k = state.main; return k && OUTILS[k] && OUTILS[k].famille === famille && (OUTILS[k].force || 0) >= force ? k : null; };
const meilleur = (liste, famille, force) => liste.filter(it => it && OUTILS[it.k] && OUTILS[it.k].famille === famille && (OUTILS[it.k].force || 0) >= force)
  .map(it => it.k).sort((a, b) => OUTILS[b].force - OUTILS[a].force)[0] || null;
/* Où est l'outil d'une famille (assez solide) : {ou: "main" | "case" | "sac" | null, k, i (sa case)} */
export function outilPour(famille, force = 0){
  const m = tenu(famille, force); if(m) return {ou: "main", k: m};
  const c = meilleur(state.barre, famille, force); if(c) return {ou: "case", k: c, i: dansCase(c)};
  const s = meilleur(state.sac, famille, force); if(s) return {ou: "sac", k: s};
  return {ou: null};
}
const voyelle = k => /^[aeiouéèê]/i.test(objet(k).nom);   // « ton épée », mais « ta hache » (h aspiré)
const ton = k => objet(k).une && !voyelle(k) ? "ta" : "ton";
/* Le bouton d'action quand l'outil n'est pas en main : dans une case, « 🪓 Prendre ta hache en pierre (case 2) » (le toucher
   la prend en main) ; dans le sac, il faut d'abord la mettre dans une case (le toucher ouvre le choix d'une case) ; null sinon */
export function prendreAction(o){
  if(!o || !o.k || o.ou === "main") return null;
  const m = objet(o.k), nom = m.nom.toLowerCase();
  if(o.ou === "case") return {label: `${m.emoji} Prendre ${ton(o.k)} ${nom} (case ${o.i + 1})`, run: () => toggleHold(o.k)};
  return {label: `${m.emoji} ${ton(o.k)[0].toUpperCase() + ton(o.k).slice(1)} ${nom} est dans le sac : mets-${m.une ? "la" : "le"} dans une case`,
    run: () => { const i = state.barre.indexOf(null); chooser(i >= 0 ? i : 0); }};
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
  if(it.items || pileOf(it.k) === 1){ if(state.sac.length >= placesSac()) return false; state.sac.push(it); return true; }
  if(slotsPlace(state.sac, placesSac(), it.k) < it.n) return false;
  slotsAdd(state.sac, placesSac(), it.k, it.n);
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
/* La jauge de solidité d'un outil entamé (usure.js : state.usure) : verte, puis rouge quand il est presque usé */
const solide = k => { const s = OUTILS[k] && OUTILS[k].solidite, u = state.usure && state.usure[k];
  if(!s || !u) return "";
  const f = Math.max(0, 1 - u / s);
  return `<span class="jauge usure${f <= .2 ? " bas" : ""}" aria-hidden="true"><i style="width:${Math.round(100 * f)}%"></i></span>`; };
/* La jauge d'eau d'un arrosoir (vide si ce n'est pas un arrosoir), et celle de la solidité */
export const jauge = k => solide(k) + (OUTILS[k] && OUTILS[k].eau
  ? `<span class="jauge" aria-hidden="true"><i style="width:${Math.round(100 * Math.min(state.eau, OUTILS[k].eau) / OUTILS[k].eau)}%"></i></span>`
  : OUTILS[k] && OUTILS[k].duree && state.torche > 0                 // la torche allumée : ce qui lui reste à brûler
  ? `<span class="jauge feu" aria-hidden="true"><i style="width:${Math.round(100 * state.torche / OUTILS[k].duree)}%"></i></span>` : "");
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

/* Au démarrage : les cases et l'outil tenu, tels que la partie les a gardés ; ce qu'on tenait sans qu'il soit dans une case
   (avant la règle des mains) y va, s'il y a de la place, sinon la main se vide */
syncBarre();
if(state.main && (OUTILS[state.main] && OUTILS[state.main].famille === "torche" || dansCase(state.main) < 0 && (barreAuto(state.main), dansCase(state.main) < 0))) state.main = null;
if(state.main) holdTool(state.main);
