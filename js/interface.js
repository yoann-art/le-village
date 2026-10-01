/* ================= Interface =================
   Compteurs du haut, petits messages, panneau qui monte du bas. */
import { $ } from "./outils.js";
import { RES, B, objet } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { totalStars, owned } from "./regles.js";
import { resetJoy } from "./commandes.js";

export function renderHUD(){
  $("#res").innerHTML = Object.entries(RES).map(([k,r]) =>
    `<div class="rchip" id="r-${k}" aria-label="${owned(k)} ${r.nom}"><span aria-hidden="true">${r.emoji}</span><b>${owned(k)}</b></div>`).join("");
  $("#stars").textContent = "★ " + totalStars();
  const g = $("#goal");
  if(state.crowned){ g.textContent = "Village couronné"; return; }
  g.innerHTML = "Château : " + Object.entries(B.chateau.cost).map(([r,v]) => {
    const have = Math.min(owned(r), v);
    return `<span class="${have >= v ? "ok" : ""}">${objet(r).emoji} ${have}/${v}</span>`;
  }).join(" ");
}
export function pulse(r){ const el = $("#r-" + r); if(!el) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
let toastT = 0;
export function toast(msg, ms=2400){
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms);
}
export const wrap = $("#sheetWrap");
const sheet = $("#sheet");
export function openSheet(html){
  sheet.innerHTML = html; wrap.hidden = false;
  resetJoy();
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("open")));
}
export function closeSheet(){ wrap.classList.remove("open"); setTimeout(() => { wrap.hidden = true; }, 220); }
