/* ================= Le sac, les coffres et le carnet =================
   Le bouton « 🎒 Sac » ouvre un panneau à trois onglets :
   - Sac : ce que le personnage porte sur lui, en SAC.places emplacements (state.sac = [{k, n}]).
     Un outil prend un emplacement ; le reste s'empile jusqu'à SAC.pile. Tout ce qu'on récolte arrive ici.
   - Coffres : ce que contiennent tous les coffres de réserve du village, pour s'y retrouver.
   - Carnet (le carnet de collection de la bible) : une page par collection, les poissons (étape 1.6 : chaque
     espèce prise, combien de fois et la plus grosse, state.carnet.poissons) et les insectes (étape 1.7,
     state.carnet.insectes) ; ce qu'on n'a pas encore pris reste un « ? ».
   Pour ranger ou reprendre, on va à un coffre (voir coffres.js). Toucher un objet du sac le choisit :
   on peut le prendre en main (outil, graine, coffre à poser). */
import { $ } from "./outils.js";
import { RES, PRODUITS, MEUBLES_ORDER, OUTILS, GRAINES, POSABLES, POISSONS, INSECTES, OU_INSECTE, SAC, COFFRE, objet, icone, ouPoisson } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { coffresCount } from "./regles.js";
import { openSheet, wrap } from "./interface.js";
import { toggleHold, barreAuto, utilisable, jauge } from "./barre.js";

const info = objet;
const cap = t => t[0].toUpperCase() + t.slice(1);
let tab = "sac";                      // onglet ouvert : "sac", "coffres" ou "carnet"
let fiche = null;                     // l'espèce choisie dans le carnet
let page = "poissons";                // la page du carnet : "poissons" ou "insectes"
let pick = null;                      // l'emplacement du sac choisi

function sacHTML(){
  const items = state.sac;
  const slots = Array.from({length: SAC.places}, (_, i) => {
    const it = items[i];
    if(!it) return `<div class="slot empty" aria-label="Emplacement vide"></div>`;
    const m = info(it.k);
    return `<button class="slot${pick === i ? " on" : ""}" data-slot="${i}" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${icone(it.k)}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}${jauge(it.k)}</button>`;
  }).join("");
  const it = typeof pick === "number" && items[pick];
  const detail = it ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(it.k)}</span>
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
    return `<div class="tile"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tn">${coffresCount(k)}</div><div class="tl">${cap(m.nom)}</div></div>`; }).join("")}</div>`;
}
function coffresHTML(){
  const n = state.coffres.length;
  if(!n) return `<p class="hint-box">Tu n'as pas encore de coffre de réserve. Fabrique-le à l'établi de la Scierie (5 planches), prends-le en main et pose-le au village : tu pourras y ranger ce que tu veux. Fabriques-en plusieurs pour trier.</p>`;
  return `<p class="muted" style="margin:0 0 8px">Ce que contiennent tes ${n} coffre${n > 1 ? "s" : ""} de réserve (${COFFRE.places} emplacements chacun). Pour ranger ou reprendre, va ouvrir un coffre.</p>
    <h3 style="margin:8px 0 4px">Ressources</h3>${tiles(Object.keys(RES).filter(k => k !== "or"))}
    <h3 style="margin:8px 0 4px">Produits</h3>${tiles(Object.keys(PRODUITS))}
    <h3 style="margin:8px 0 4px">Outils</h3>${tiles([...Object.keys(OUTILS), ...Object.keys(POSABLES)])}
    <h3 style="margin:8px 0 4px">Graines</h3>${tiles(Object.keys(GRAINES))}
    <h3 style="margin:8px 0 4px">Poissons</h3>${tiles(Object.keys(POISSONS))}
    <h3 style="margin:8px 0 4px">Insectes</h3>${tiles(Object.keys(INSECTES))}
    <h3 style="margin:8px 0 4px">Meubles</h3>${tiles(MEUBLES_ORDER)}`;
}

/* ----- Le carnet : les poissons, rangés par endroit ----- */
const ENDROITS = [
  ["À l'étang", p => p.lieu === "etang"],
  ["En mer, depuis la plage", p => p.lieu === "mer" && !p.depuis],
  ["En mer, depuis le ponton", p => p.depuis === "ponton"],
  ["Au large, en barque (bientôt)", p => p.depuis === "barque"]
];
/* Les insectes, rangés par endroit (le premier où on les trouve) */
const COINS = [
  ["Sur les fleurs", p => p.ou[0] === "fleurs"],
  ["Dans l'herbe et au sol", p => p.ou[0] === "herbes" || p.ou[0] === "sol"],
  ["Sur les arbres et sous les pierres", p => p.ou[0] === "arbres" || p.ou[0] === "pierres"],
  ["Au bord de l'étang", p => p.ou[0] === "etang"],
  ["Autour des lanternes, la nuit", p => p.ou[0] === "lanternes"]
];
function insectesHTML(){
  const c = state.carnet.insectes, ks = Object.keys(INSECTES), pris = k => c[k] && c[k].n > 0;
  const tuile = k => { const p = INSECTES[k], on = fiche === k ? " on" : "";
    return pris(k)
      ? `<button class="tile${on}" data-carnet="${k}"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tl">${p.nom}</div></button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Insecte pas encore attrapé"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const f = fiche && INSECTES[fiche];
  const detail = !f ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche une bête pour voir sa fiche.</p>`
    : pris(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(fiche)}</span><div class="pt"><b>${f.nom}</b><p>${f.usage}</p><p>Attrapé${f.une ? "e" : ""} ${c[fiche].n} fois</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore attrapé${f.une ? "e" : ""}</b><p>On la trouve ${f.ou.map(o => OU_INSECTE[o]).join(" ou ")}. À toi de découvrir quand !</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">🦋 Insectes : ${ks.filter(pris).length} sur ${ks.length}. Approche à pas de loup, puis attrape-les au filet.</p>` + detail +
    COINS.map(([titre, test]) => `<h3 style="margin:8px 0 4px">${titre}</h3><div class="res-grid">${ks.filter(k => test(INSECTES[k])).map(tuile).join("")}</div>`).join("");
}
function carnetHTML(){
  const onglets = `<div class="sh-tabs sous" role="tablist">
      <button class="sh-tab" role="tab" data-carnet-page="poissons" aria-selected="${page === "poissons"}">🐟 Poissons</button>
      <button class="sh-tab" role="tab" data-carnet-page="insectes" aria-selected="${page === "insectes"}">🦋 Insectes</button>
    </div>`;
  return onglets + (page === "insectes" ? insectesHTML() : poissonsHTML());
}
function poissonsHTML(){
  const c = state.carnet.poissons, ks = Object.keys(POISSONS), pris = k => c[k] && c[k].n > 0;
  const tuile = k => { const p = POISSONS[k], on = fiche === k ? " on" : "";
    return pris(k)
      ? `<button class="tile${on}${p.rarete === "legendaire" ? " legende" : ""}" data-carnet="${k}"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tl">${p.nom}</div><div class="tn">${c[k].max} cm</div></button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Poisson pas encore pêché"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const f = fiche && POISSONS[fiche];
  const detail = !f ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche un poisson pour voir sa fiche.</p>`
    : pris(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(fiche)}</span><div class="pt"><b>${f.nom}</b><p>${f.usage}</p><p>Pris ${c[fiche].n} fois · ton plus gros : ${c[fiche].max} cm</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore pêché</b><p>On le trouve ${ouPoisson(f)}. À toi de découvrir quand !</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">🎣 Poissons : ${ks.filter(pris).length} sur ${ks.length}. Chaque poisson pris s'inscrit ici, avec ton plus gros.</p>` + detail +
    ENDROITS.map(([titre, test]) => `<h3 style="margin:8px 0 4px">${titre}</h3><div class="res-grid">${ks.filter(k => test(POISSONS[k])).map(tuile).join("")}</div>`).join("");
}

const TITRES = {sac: "🎒 Sac", coffres: "🗃️ Coffres", carnet: "📖 Carnet"};
function render(){
  openSheet(`<div class="sh-head"><h2 class="display">${TITRES[tab]}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="sh-tabs" role="tablist">
      <button class="sh-tab" role="tab" data-sac-tab="sac" aria-selected="${tab === "sac"}">🎒 Sac</button>
      <button class="sh-tab" role="tab" data-sac-tab="coffres" aria-selected="${tab === "coffres"}">🗃️ Coffres</button>
      <button class="sh-tab" role="tab" data-sac-tab="carnet" aria-selected="${tab === "carnet"}">📖 Carnet</button>
    </div>` + (tab === "sac" ? sacHTML() : tab === "coffres" ? coffresHTML() : carnetHTML()));
}
$("#btn-sac").addEventListener("click", () => { pick = null; render(); });
wrap.addEventListener("click", e => {
  const t = e.target.closest("[data-sac-tab]"), slot = e.target.closest("[data-slot]"), fi = e.target.closest("[data-carnet]"), pg = e.target.closest("[data-carnet-page]");
  if(pg){ if(pg.dataset.carnetPage !== page){ page = pg.dataset.carnetPage; fiche = null; render(); } return; }
  if(t){ if(t.dataset.sacTab !== tab){ tab = t.dataset.sacTab; pick = null; fiche = null; render(); } return; }
  if(fi){ fiche = fiche === fi.dataset.carnet ? null : fi.dataset.carnet; render(); return; }
  if(slot){ const i = +slot.dataset.slot; pick = pick === i ? null : i; render(); return; }
  if(e.target.closest("[data-sac-main]") && typeof pick === "number" && state.sac[pick]){
    const k = state.sac[pick].k;
    barreAuto(k); toggleHold(k); render();
  }
});
