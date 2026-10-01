/* ================= Le sac et les coffres =================
   Le bouton « 🎒 Sac » ouvre un panneau à deux onglets :
   - Sac : ce que le personnage porte sur lui, en SAC.places emplacements (state.sac = [{k, n}]).
     Un outil prend un emplacement ; le reste s'empile jusqu'à SAC.pile. Tout ce qu'on récolte arrive ici.
   - Coffres : ce que contiennent tous les coffres de réserve du village, pour s'y retrouver.
   Pour ranger ou reprendre, on va à un coffre (voir coffres.js). Toucher un objet du sac le choisit :
   on peut le prendre en main (outil, graine, coffre à poser). */
import { $ } from "./outils.js";
import { RES, PRODUITS, MEUBLES_ORDER, OUTILS, GRAINES, POSABLES, SAC, COFFRE, objet } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { coffresCount } from "./regles.js";
import { openSheet, wrap } from "./interface.js";
import { toggleHold, barreAuto, utilisable, jauge } from "./barre.js";

const info = objet;
const cap = t => t[0].toUpperCase() + t.slice(1);
let tab = "sac";                      // onglet ouvert : "sac" ou "coffres"
let pick = null;                      // l'emplacement du sac choisi

function sacHTML(){
  const items = state.sac;
  const slots = Array.from({length: SAC.places}, (_, i) => {
    const it = items[i];
    if(!it) return `<div class="slot empty" aria-label="Emplacement vide"></div>`;
    const m = info(it.k);
    return `<button class="slot${pick === i ? " on" : ""}" data-slot="${i}" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${m.emoji}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}${jauge(it.k)}</button>`;
  }).join("");
  const it = typeof pick === "number" && items[pick];
  const detail = it ? `<div class="pick"><span class="pe" aria-hidden="true">${info(it.k).emoji}</span>
      <div class="pt"><b>${it.n > 1 ? it.n + " × " : ""}${info(it.k).nom}</b>${OUTILS[it.k] && OUTILS[it.k].eau ? `<p>💧 Eau : ${state.eau} sur ${OUTILS[it.k].eau}</p>` : ""}${info(it.k).usage ? `<p>${info(it.k).usage}</p>` : ""}<p>Pour le ranger, ouvre un coffre de réserve.</p></div>
      ${utilisable(it.k) ? `<div class="pa"><button class="btn primary" data-sac-main>${state.main === it.k ? "Lâcher" : "Prendre en main"}</button></div>` : ""}</div>`
    : `<p class="muted" style="margin:6px 0 0;font-size:14px">${items.length ? "Touche un objet pour le choisir." : "Ce que tu récoltes et fabriques arrive ici."}</p>`;
  return `<p class="muted" style="margin:0 0 8px">Ce que tu portes sur toi : ${items.length} emplacement${items.length > 1 ? "s" : ""} pris sur ${SAC.places}.
    Ce que tu récoltes et fabriques arrive ici ; quand il est plein, range tes affaires dans un coffre de réserve.</p>
    <div class="sac-grid">${slots}</div>${detail}`;
}

function tiles(keys){
  const have = keys.filter(k => coffresCount(k) > 0);
  if(!have.length) return `<p class="muted" style="margin:2px 0 8px">Aucun.</p>`;
  return `<div class="res-grid">${have.map(k => { const m = info(k);
    return `<div class="tile"><div class="te" aria-hidden="true">${m.emoji}</div><div class="tn">${coffresCount(k)}</div><div class="tl">${cap(m.nom)}</div></div>`; }).join("")}</div>`;
}
function coffresHTML(){
  const n = state.coffres.length;
  if(!n) return `<p class="hint-box">Tu n'as pas encore de coffre de réserve. Fabrique-le à l'établi de la Scierie (5 planches), prends-le en main et pose-le au village : tu pourras y ranger ce que tu veux. Fabriques-en plusieurs pour trier.</p>`;
  return `<p class="muted" style="margin:0 0 8px">Ce que contiennent tes ${n} coffre${n > 1 ? "s" : ""} de réserve (${COFFRE.places} emplacements chacun). Pour ranger ou reprendre, va ouvrir un coffre.</p>
    <h3 style="margin:8px 0 4px">Ressources</h3>${tiles(Object.keys(RES).filter(k => k !== "or"))}
    <h3 style="margin:8px 0 4px">Produits</h3>${tiles(Object.keys(PRODUITS))}
    <h3 style="margin:8px 0 4px">Outils</h3>${tiles([...Object.keys(OUTILS), ...Object.keys(POSABLES)])}
    <h3 style="margin:8px 0 4px">Graines</h3>${tiles(Object.keys(GRAINES))}
    <h3 style="margin:8px 0 4px">Meubles</h3>${tiles(MEUBLES_ORDER)}`;
}

function render(){
  openSheet(`<div class="sh-head"><h2 class="display">${tab === "sac" ? "🎒 Sac" : "🗃️ Coffres"}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="sh-tabs" role="tablist">
      <button class="sh-tab" role="tab" data-sac-tab="sac" aria-selected="${tab === "sac"}">🎒 Sac</button>
      <button class="sh-tab" role="tab" data-sac-tab="coffres" aria-selected="${tab === "coffres"}">🗃️ Coffres</button>
    </div>` + (tab === "sac" ? sacHTML() : coffresHTML()));
}
$("#btn-sac").addEventListener("click", () => { pick = null; render(); });
wrap.addEventListener("click", e => {
  const t = e.target.closest("[data-sac-tab]"), slot = e.target.closest("[data-slot]");
  if(t){ if(t.dataset.sacTab !== tab){ tab = t.dataset.sacTab; pick = null; render(); } return; }
  if(slot){ const i = +slot.dataset.slot; pick = pick === i ? null : i; render(); return; }
  if(e.target.closest("[data-sac-main]") && typeof pick === "number" && state.sac[pick]){
    const k = state.sac[pick].k;
    barreAuto(k); toggleHold(k); render();
  }
});
