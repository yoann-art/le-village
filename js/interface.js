/* ================= Interface =================
   Compteurs du haut, petits messages, panneau qui monte du bas. */
import { $ } from "./outils.js";
import { RES, B, objet } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { totalStars, owned } from "./regles.js";
import { resetJoy } from "./commandes.js";
import { jouer, sonDuMessage, boutonSon } from "./sons.js";

/* Les pièces et les étoiles qui changent sonnent ici, où l'écran les montre (la première fois, rien : le chargement) */
let orAvant = null, etoilesAvant = null;
export function renderHUD(){
  const or = owned("or"), etoiles = totalStars();
  if(orAvant !== null && or !== orAvant) jouer(or > orAvant ? "pieces" : "payer");
  if(etoilesAvant !== null && etoiles > etoilesAvant) jouer("etoile");
  orAvant = or; etoilesAvant = etoiles;
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
/* son : le son du message (par défaut, d'après ce qu'il dit : sons.js, sonDuMessage) */
export function toast(msg, ms=2400, son){
  const k = son || sonDuMessage(msg);
  jouer(k, {discret: k === "message" || k === "ramasser"});
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms);
}
export const wrap = $("#sheetWrap");
const sheet = $("#sheet");
/* Le panneau se cache un peu après sa fermeture (le temps qu'il descende) ; un panneau rouvert juste après
   annule ce retard, sinon il serait caché aussitôt ouvert */
let hideT = 0;
/* son : le son du panneau qui s'ouvre (le sac, un coffre…) ; un panneau déjà ouvert qui change (un onglet) ne sonne pas */
let sonOuvert = null;                                // le son du panneau ouvert (null : aucun panneau)
const FERME = {sac: "sacFerme"};
export function openSheet(html, son = "ouvrir"){
  if(!sonOuvert){ jouer(son); sonOuvert = son; }
  clearTimeout(hideT);
  sheet.innerHTML = html; wrap.hidden = false;
  resetJoy();
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("open")));
}
export function closeSheet(){
  if(sonOuvert) jouer(FERME[sonOuvert] || "fermer");
  sonOuvert = null;
  wrap.classList.remove("open"); clearTimeout(hideT); hideT = setTimeout(() => { wrap.hidden = true; }, 220); }
boutonSon(html => openSheet(html));                   // le bouton 🔊 : le réglage du son
