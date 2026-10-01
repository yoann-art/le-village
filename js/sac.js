/* ================= Le sac et la réserve =================
   Le bouton « 🎒 Sac » ouvre un panneau à deux onglets :
   - Sac : ce que le personnage porte sur lui, en SAC.places emplacements (state.sac = [{k, n}]).
     Un outil prend un emplacement ; le reste s'empile jusqu'à SAC.pile.
   - Réserve : tout ce que garde le village (ressources, produits, outils, meubles), sans limite.
   Sur l'île, la récolte va directement dans la réserve ; le sac compte pour les sorties (grotte, voyages).
   Toucher un objet le choisit : on peut le ranger dans la réserve, ou mettre un outil dans le sac. */
import { $ } from "./outils.js";
import { RES, PRODUITS, MEUBLES, MEUBLES_ORDER, OUTILS, SAC } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, sacAdd } from "./regles.js";
import { openSheet, toast, wrap } from "./interface.js";
import { toggleHold, syncBarre, barreAuto } from "./barre.js";

const info = k => RES[k] || PRODUITS[k] || OUTILS[k] || MEUBLES[k];
const cap = t => t[0].toUpperCase() + t.slice(1);
let tab = "sac";                      // onglet ouvert : "sac" ou "reserve"
let pick = null;                      // l'objet choisi : un emplacement du sac (nombre) ou une clé de la réserve

function sacHTML(){
  const items = state.sac;
  const slots = Array.from({length: SAC.places}, (_, i) => {
    const it = items[i];
    if(!it) return `<div class="slot empty" aria-label="Emplacement vide"></div>`;
    const m = info(it.k);
    return `<button class="slot${pick === i ? " on" : ""}" data-slot="${i}" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${m.emoji}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}</button>`;
  }).join("");
  const it = typeof pick === "number" && items[pick];
  const detail = it ? `<div class="pick"><span class="pe" aria-hidden="true">${info(it.k).emoji}</span>
      <div class="pt"><b>${it.n > 1 ? it.n + " × " : ""}${info(it.k).nom}</b>${OUTILS[it.k] ? `<p>${OUTILS[it.k].usage}</p>` : ""}</div>
      <div class="pa">${OUTILS[it.k] ? `<button class="btn primary" data-sac-main>${state.main === it.k ? "Lâcher" : "Prendre en main"}</button>` : ""}
      <button class="btn ghost" data-sac-ranger>Ranger dans la réserve</button></div></div>`
    : `<p class="muted" style="margin:6px 0 0;font-size:14px">${items.length ? "Touche un objet pour le choisir." : "Fabrique tes outils à l'établi de la Scierie : ils arrivent ici."}</p>`;
  return `<p class="muted" style="margin:0 0 8px">Ce que tu portes sur toi : ${items.length} emplacement${items.length > 1 ? "s" : ""} pris sur ${SAC.places}.
    Sur l'île, ce que tu récoltes va directement dans la réserve ; le sac servira pour les sorties (grotte, voyages).</p>
    <div class="sac-grid">${slots}</div>${detail}`;
}

function tiles(keys){
  const have = keys.filter(k => owned(k) > 0);
  if(!have.length) return `<p class="muted" style="margin:2px 0 8px">Aucun pour l'instant.</p>`;
  return `<div class="res-grid">${have.map(k => { const m = info(k);
    const inner = `<div class="te" aria-hidden="true">${m.emoji}</div><div class="tn">${owned(k)}</div><div class="tl">${cap(m.nom)}</div>`;
    return OUTILS[k] ? `<button class="tile${pick === k ? " on" : ""}" data-res-pick="${k}">${inner}</button>` : `<div class="tile">${inner}</div>`; }).join("")}</div>`;
}
function reserveHTML(){
  const k = typeof pick === "string" && owned(pick) > 0 ? pick : null;
  const detail = k ? `<div class="pick"><span class="pe" aria-hidden="true">${OUTILS[k].emoji}</span>
      <div class="pt"><b>${OUTILS[k].nom}</b><p>${OUTILS[k].usage}</p></div>
      <button class="btn primary" data-sac-mettre ${state.sac.length < SAC.places ? "" : "disabled"}>${state.sac.length < SAC.places ? "Mettre dans le sac" : "Sac plein"}</button></div>` : "";
  return `<p class="muted" style="margin:0 0 8px">Tout ce que garde ton village, sans limite. C'est là que vont tes récoltes et ce que tu fabriques.</p>
    <h3 style="margin:8px 0 4px">Ressources</h3>${tiles(Object.keys(RES))}
    <h3 style="margin:8px 0 4px">Produits</h3>${tiles(Object.keys(PRODUITS))}
    <h3 style="margin:8px 0 4px">Outils</h3>${tiles(Object.keys(OUTILS))}${detail}
    <h3 style="margin:8px 0 4px">Meubles</h3>${tiles(MEUBLES_ORDER)}`;
}

function render(){
  openSheet(`<div class="sh-head"><h2 class="display">${tab === "sac" ? "🎒 Sac" : "🏠 Réserve"}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="sh-tabs" role="tablist">
      <button class="sh-tab" role="tab" data-sac-tab="sac" aria-selected="${tab === "sac"}">🎒 Sac</button>
      <button class="sh-tab" role="tab" data-sac-tab="reserve" aria-selected="${tab === "reserve"}">🏠 Réserve</button>
    </div>` + (tab === "sac" ? sacHTML() : reserveHTML()));
}
$("#btn-sac").addEventListener("click", () => { pick = null; render(); });
wrap.addEventListener("click", e => {
  const t = e.target.closest("[data-sac-tab]"), slot = e.target.closest("[data-slot]"), res = e.target.closest("[data-res-pick]");
  if(t){ if(t.dataset.sacTab !== tab){ tab = t.dataset.sacTab; pick = null; render(); } return; }
  if(slot){ const i = +slot.dataset.slot; pick = pick === i ? null : i; render(); return; }
  if(res){ const k = res.dataset.resPick; pick = pick === k ? null : k; render(); return; }
  if(e.target.closest("[data-sac-main]") && typeof pick === "number" && state.sac[pick]){
    const k = state.sac[pick].k;
    barreAuto(k); toggleHold(k); render(); return;
  }
  if(e.target.closest("[data-sac-ranger]") && typeof pick === "number" && state.sac[pick]){
    const [it] = state.sac.splice(pick, 1);
    addOwned(it.k, it.n); syncBarre(); save();
    toast(`${info(it.k).emoji} Rangé dans ta réserve`);
    pick = null; render(); return;
  }
  if(e.target.closest("[data-sac-mettre]") && typeof pick === "string" && owned(pick) > 0){
    if(sacAdd(pick, 1)){ addOwned(pick, -1); barreAuto(pick); save(); toast(`${info(pick).emoji} Dans ton sac`); }
    pick = null; render();
  }
});
