/* ================= Mini-jeux =================
   Menu des mini-jeux, écran de jeu, récompense à la fin. */
import { $ } from "../outils.js";
import { RES, GAMES } from "../donnees.js";
import { state, save } from "../sauvegarde.js";
import { mult, pct } from "../regles.js";
import { renderHUD, pulse, openSheet } from "../interface.js";
import { resetJoy } from "../commandes.js";
import { startBucheron } from "./bucheron.js";
import { startCarriere } from "./carriere.js";
import { startRunes } from "./runes.js";

const START = {bucheron:startBucheron, carriere:startCarriere, runes:startRunes};

/* Menu « Mini-jeux » */
$("#btn-games").addEventListener("click", () => {
  openSheet(`<div class="sh-head"><h2 class="display">Mini-jeux</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 10px">Chaque mini-jeu rapporte une ressource. Tes bâtiments augmentent les gains.</p>` +
    Object.entries(GAMES).map(([id,g]) => {
      const p = pct(g.res);
      return `<button class="game-row" data-game="${id}" style="--cat:var(--${g.color})">
        <span class="gi" aria-hidden="true">${g.emoji}</span>
        <span class="gt"><span class="tag">${g.cat}</span><span class="gname display">${g.nom}</span>
        <span class="gdesc">Rapporte ${g.gain} ${RES[g.res].emoji}${p ? `, bonus +${p} %` : ""}</span></span></button>`;
    }).join("") +
    `<div class="game-row locked" style="--cat:var(--or)"><span class="gi" aria-hidden="true">⚔️</span>
      <span class="gt"><span class="tag">Épique</span><span class="gname display">La Joute</span>
      <span class="gdesc">Bientôt : un duel qui rapporte des ressources rares.</span></span></div>
    <button class="reset" data-reset>Effacer la partie</button>`);
});

/* Écran de mini-jeu */
export const gameEl = $("#game");
const stage = $("#g-stage");
let current = null, cleanup = null;
export function openGame(id){
  current = id;
  const g = GAMES[id], p = pct(g.res);
  $("#g-title").textContent = g.nom;
  $("#g-sub").textContent = `${g.cat}, rapporte ${g.gain}`;
  stage.innerHTML = `<div class="intro-emoji" aria-hidden="true">${g.emoji}</div><p class="rules">${g.rules}</p>
    ${p ? `<p class="bonus-line">Bonus de ton village : +${p} %</p>` : ""}
    <button class="btn primary big" id="go">Commencer</button>`;
  gameEl.hidden = false;
  resetJoy();
  $("#go").addEventListener("click", () => { cleanup = START[id](stage, finish); });
}
function stopGame(){ if(cleanup){ cleanup(); cleanup = null; } }
export function closeGame(){ stopGame(); gameEl.hidden = true; }
$("#g-quit").addEventListener("click", closeGame);
function finish(raw){
  stopGame();
  const g = GAMES[current], m = mult(g.res), gain = Math.round(raw * m);
  state.res[g.res] += gain; save(); renderHUD();
  stage.innerHTML = `<p class="muted" style="margin:0">${gain ? "Ta récolte" : "Rien cette fois"}</p>
    <p class="gain display">+${gain} ${RES[g.res].emoji}</p>
    <p class="muted" style="margin:0">Score ${raw}${m > 1 ? `, bonus du village +${Math.round((m-1)*100)} %` : ""}</p>
    <div class="stack"><button class="btn primary big" id="back">Retour sur l'île</button>
    <button class="btn ghost" id="again">Rejouer</button></div>`;
  $("#back").addEventListener("click", () => { closeGame(); pulse(g.res); });
  $("#again").addEventListener("click", () => openGame(current));
}
