/* ================= Le sac et la réserve =================
   Le bouton « 🎒 Sac » ouvre un panneau à deux onglets :
   - Sac : ce que le personnage porte sur lui, en SAC.places emplacements (state.sac = [{k, n}]).
     Un outil prend un emplacement ; le reste s'empile jusqu'à SAC.pile.
   - Réserve : tout ce que garde le village (ressources, produits, meubles), sans limite.
   Sur l'île, la récolte va directement dans la réserve ; le sac compte pour les sorties (grotte, voyages). */
import { $ } from "./outils.js";
import { RES, PRODUITS, MEUBLES, MEUBLES_ORDER, SAC } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { owned } from "./regles.js";
import { openSheet, wrap } from "./interface.js";

const info = k => RES[k] || PRODUITS[k] || MEUBLES[k];
const cap = t => t[0].toUpperCase() + t.slice(1);
let tab = "sac";                      // onglet ouvert : "sac" ou "reserve"

function sacHTML(){
  const items = state.sac;
  const slots = Array.from({length: SAC.places}, (_, i) => {
    const it = items[i];
    if(!it) return `<div class="slot empty" aria-label="Emplacement vide"></div>`;
    const m = info(it.k);
    return `<div class="slot" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${m.emoji}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}</div>`;
  }).join("");
  return `<p class="muted" style="margin:0 0 8px">Ce que tu portes sur toi : ${items.length} emplacement${items.length > 1 ? "s" : ""} pris sur ${SAC.places}.
    Tes outils y seront rangés. Sur l'île, ce que tu récoltes va directement dans la réserve ; le sac servira pour les sorties (grotte, voyages).</p>
    <div class="sac-grid">${slots}</div>`;
}

function tiles(keys){
  const have = keys.filter(k => owned(k) > 0);
  if(!have.length) return `<p class="muted" style="margin:2px 0 8px">Aucun pour l'instant.</p>`;
  return `<div class="res-grid">${have.map(k => { const m = info(k);
    return `<div class="tile"><div class="te" aria-hidden="true">${m.emoji}</div><div class="tn">${owned(k)}</div><div class="tl">${cap(m.nom)}</div></div>`; }).join("")}</div>`;
}
function reserveHTML(){
  return `<p class="muted" style="margin:0 0 8px">Tout ce que garde ton village, sans limite. C'est là que vont tes récoltes et ce que tu fabriques.</p>
    <h3 style="margin:8px 0 4px">Ressources</h3>${tiles(Object.keys(RES))}
    <h3 style="margin:8px 0 4px">Produits</h3>${tiles(Object.keys(PRODUITS))}
    <h3 style="margin:8px 0 4px">Meubles</h3>${tiles(MEUBLES_ORDER)}`;
}

function render(){
  openSheet(`<div class="sh-head"><h2 class="display">${tab === "sac" ? "🎒 Sac" : "🏠 Réserve"}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="sh-tabs" role="tablist">
      <button class="sh-tab" role="tab" data-sac-tab="sac" aria-selected="${tab === "sac"}">🎒 Sac</button>
      <button class="sh-tab" role="tab" data-sac-tab="reserve" aria-selected="${tab === "reserve"}">🏠 Réserve</button>
    </div>` + (tab === "sac" ? sacHTML() : reserveHTML()));
}
$("#btn-sac").addEventListener("click", render);
wrap.addEventListener("click", e => {
  const t = e.target.closest("[data-sac-tab]");
  if(t && t.dataset.sacTab !== tab){ tab = t.dataset.sacTab; render(); }
});
