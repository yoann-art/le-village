/* ================= Le sac, les coffres et le carnet =================
   Le bouton « 🎒 Sac » ouvre un panneau à trois onglets :
   - Sac : ce que le personnage porte sur lui, en SAC.places emplacements (state.sac = [{k, n}]).
     Un outil prend un emplacement ; le reste s'empile jusqu'à SAC.pile. Tout ce qu'on récolte arrive ici.
   - Coffres : ce que contiennent tous les coffres de réserve du village, pour s'y retrouver.
   - Carnet (le carnet de collection de la bible) : une page par collection, les poissons (étape 1.6 : chaque
     espèce prise, combien de fois et la plus grosse, state.carnet.poissons), les insectes et les oiseaux (étape 1.7,
     state.carnet.insectes, state.carnet.oiseaux), le gibier (state.carnet.gibier) et les monstres (étape 1.8 :
     chaque espèce vaincue, son signe avant l'attaque, ce qu'elle laisse, state.carnet.monstres) et les pierres (étape
     1.11 : chaque pierre de la mine trouvée, les cristaux des géodes, le Cœur de la mine, state.carnet.pierres) ; ce
     qu'on n'a pas encore pris reste un « ? ».
   Pour ranger ou reprendre, on va à un coffre (voir coffres.js). Toucher un objet du sac le choisit :
   on peut le prendre en main (outil, graine, coffre à poser). Sous le sac, les trois cases rapides : ce qui y est
   est sorti du sac (demande de Yo, v1.7.6) ; on peut l'y remettre. */
import { $ } from "./outils.js";
import { RES, PRODUITS, MEUBLES_ORDER, OUTILS, GRAINES, POSABLES, POISSONS, INSECTES, OU_INSECTE, OISEAUX, OU_OISEAU, GIBIER, OU_GIBIER, MONSTRES, PIERRES, SAC, COFFRE, objet, icone, ouPoisson, lieuxDe } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { coffresCount, pierresTrouvees } from "./regles.js";
import { openSheet, wrap, toast } from "./interface.js";
import { toggleHold, hold, barreAuto, utilisable, jauge, dansCase, auSac, renderBarre, enCase } from "./barre.js";
import { contenu } from "./coffres.js";
import { solidite, reste } from "./usure.js";

const info = objet;
const cap = t => t[0].toUpperCase() + t.slice(1);
let tab = "sac";                      // onglet ouvert : "sac", "coffres" ou "carnet"
let fiche = null;                     // l'espèce choisie dans le carnet
let page = "poissons";                // la page du carnet : "poissons", "insectes" ou "oiseaux"
let pick = null;                      // l'objet choisi : {ou: "sac" ou "case", j}
const choisi = () => pick && (pick.ou === "case" ? state.barre : state.sac)[pick.j];

function grille(list, places, ou){
  return Array.from({length: places}, (_, i) => {
    const it = list[i];
    if(!it) return `<div class="slot empty" aria-label="${ou === "case" ? "Case rapide vide" : "Emplacement vide"}"></div>`;
    const m = info(it.k), on = pick && pick.ou === ou && pick.j === i;
    return `<button class="slot${on ? " on" : ""}" data-slot="${ou}:${i}" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${icone(it.k)}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}${jauge(it.k)}</button>`;
  }).join("");
}
function sacHTML(){
  const items = state.sac, it = choisi(), enUneCase = pick && pick.ou === "case";
  const detail = it ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(it.k)}</span>
      <div class="pt"><b>${it.n > 1 ? it.n + " × " : ""}${info(it.k).nom}</b>${enUneCase ? `<p>Dans la case rapide ${pick.j + 1}</p>` : ""}${it.items ? `<p>Contient : ${contenu(it)}</p>` : ""}${OUTILS[it.k] && OUTILS[it.k].eau ? `<p>💧 Eau : ${state.eau} sur ${OUTILS[it.k].eau}</p>` : ""}${solidite(it.k) ? `<p>🔧 Solidité : encore ${reste(it.k)} usages sur ${solidite(it.k)}${it.n > 1 ? " (le premier)" : ""}</p>` : ""}${info(it.k).usage ? `<p>${info(it.k).usage}</p>` : ""}</div>
      ${utilisable(it.k) ? `<div class="pa"><button class="btn primary" data-sac-main>${state.main === it.k ? "Lâcher" : "Prendre en main"}</button>${enUneCase ? `<button class="btn ghost" data-sac-remettre>Remettre dans le sac</button>` : ""}</div>` : ""}</div>`
    : `<p class="muted" style="margin:6px 0 0;font-size:14px">${items.length || state.barre.some(Boolean) ? "Touche un objet pour le choisir." : "Ce que tu récoltes et fabriques arrive ici."}</p>`;
  return `<p class="muted" style="margin:0 0 8px">Ce que tu portes sur toi : ${items.length} emplacement${items.length > 1 ? "s" : ""} pris sur ${SAC.places}.
    Ce que tu récoltes et fabriques arrive ici ; quand il est plein, range tes affaires dans un coffre de réserve.</p>
    <div class="sac-grid">${grille(items, SAC.places, "sac")}</div>
    <h3 style="margin:10px 0 4px">Cases rapides</h3>
    <p class="muted" style="margin:0 0 6px;font-size:14px">En plus du sac : ce que tu y mets sort du sac.</p>
    <div class="sac-grid">${grille(state.barre, SAC.cases, "case")}</div>${detail}`;
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
    <h3 style="margin:8px 0 4px">Oiseaux</h3>${tiles(Object.keys(OISEAUX))}
    <h3 style="margin:8px 0 4px">Meubles</h3>${tiles(MEUBLES_ORDER)}`;
}

/* ----- Le carnet : les poissons, rangés par endroit ----- */
const ENDROITS = [
  ["À l'étang", p => lieuxDe(p).includes("etang")],
  ["En mer, depuis la plage", p => p.lieu === "mer" && !p.depuis],
  ["En mer, depuis le ponton", p => p.depuis === "ponton"],
  ["Au large, en barque (bientôt)", p => p.depuis === "barque"],
  ["Dans la Forêt profonde, au ruisseau et à la source", p => lieuxDe(p).some(l => l === "ruisseau" || l === "source")]
];
/* Les insectes, rangés par endroit (le premier où on les trouve) */
const COINS = [
  ["Sur les fleurs", p => !p.zone && p.ou[0] === "fleurs"],
  ["Dans l'herbe et au sol", p => !p.zone && (p.ou[0] === "herbes" || p.ou[0] === "sol")],
  ["Sur les arbres et sous les pierres", p => !p.zone && (p.ou[0] === "arbres" || p.ou[0] === "pierres")],
  ["Au bord de l'étang", p => !p.zone && p.ou[0] === "etang"],
  ["Autour des lanternes, la nuit", p => !p.zone && p.ou[0] === "lanternes"],
  ["Dans la Forêt profonde", p => p.zone === "foret"]
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
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore attrapé${f.une ? "e" : ""}</b><p>On la trouve ${f.zone === "foret" ? "dans la Forêt profonde, " : ""}${f.ou.map(o => OU_INSECTE[o]).join(" ou ")}. À toi de découvrir quand !</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">🦋 Insectes : ${ks.filter(pris).length} sur ${ks.length}. Approche à pas de loup, puis attrape-les au filet.</p>` + detail +
    COINS.map(([titre, test]) => `<h3 style="margin:8px 0 4px">${titre}</h3><div class="res-grid">${ks.filter(k => test(INSECTES[k])).map(tuile).join("")}</div>`).join("");
}
/* Les oiseaux, rangés par endroit (le premier où on les trouve) */
const PERCHOIRS = [
  ["Au sol et dans le jardin", p => !p.zone && p.ou[0] === "sol"],
  ["Dans les arbres et les haies", p => !p.zone && (p.ou[0] === "arbres" || p.ou[0] === "buissons")],
  ["Sur les toits", p => !p.zone && p.ou[0] === "toits"],
  ["Au bord de l'eau", p => !p.zone && (p.ou[0] === "plage" || p.ou[0] === "etang")],
  ["Dans la Forêt profonde", p => p.zone === "foret"]
];
function oiseauxHTML(){
  const c = state.carnet.oiseaux, ks = Object.keys(OISEAUX), pris = k => c[k] && c[k].n > 0;
  const tuile = k => { const p = OISEAUX[k], on = fiche === k ? " on" : "";
    return pris(k)
      ? `<button class="tile${on}" data-carnet="${k}"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tl">${p.nom}</div></button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Oiseau pas encore attrapé"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const f = fiche && OISEAUX[fiche];
  const detail = !f ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche un oiseau pour voir sa fiche.</p>`
    : pris(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(fiche)}</span><div class="pt"><b>${f.nom}</b><p>${f.usage}</p><p>Attrapé${f.une ? "e" : ""} ${c[fiche].n} fois</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore attrapé</b><p>On le trouve ${f.zone === "foret" ? "dans la Forêt profonde, " : ""}${f.ou.map(o => OU_OISEAU[o]).join(" ou ")}. À toi de découvrir quand !</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">🐦 Oiseaux : ${ks.filter(pris).length} sur ${ks.length}. Approche à pas de loup d'un oiseau posé, puis lance le filet.</p>` + detail +
    PERCHOIRS.map(([titre, test]) => `<h3 style="margin:8px 0 4px">${titre}</h3><div class="res-grid">${ks.filter(k => test(OISEAUX[k])).map(tuile).join("")}</div>`).join("");
}
function carnetHTML(){
  const onglets = `<div class="sh-tabs sous" role="tablist">
      <button class="sh-tab" role="tab" data-carnet-page="poissons" aria-selected="${page === "poissons"}">🐟 Poissons</button>
      <button class="sh-tab" role="tab" data-carnet-page="insectes" aria-selected="${page === "insectes"}">🦋 Insectes</button>
      <button class="sh-tab" role="tab" data-carnet-page="oiseaux" aria-selected="${page === "oiseaux"}">🐦 Oiseaux</button>
      <button class="sh-tab" role="tab" data-carnet-page="gibier" aria-selected="${page === "gibier"}">🦌 Gibier</button>
      <button class="sh-tab" role="tab" data-carnet-page="monstres" aria-selected="${page === "monstres"}">👹 Monstres</button>
      <button class="sh-tab" role="tab" data-carnet-page="pierres" aria-selected="${page === "pierres"}">💎 Pierres</button>
    </div>`;
  return onglets + (page === "insectes" ? insectesHTML() : page === "oiseaux" ? oiseauxHTML() : page === "gibier" ? gibierHTML()
    : page === "monstres" ? monstresHTML() : page === "pierres" ? pierresHTML() : poissonsHTML());
}
/* Les pierres (étape 1.11, morceau 4 ; Grand Carnet, « Les pierres et minerais ») : chaque pierre trouvée à la mine,
   rangée par salle, les cristaux des géodes, et le légendaire : le Cœur de la mine */
const SALLES = [[1, "⛏️ La grande salle (pioche en pierre)"], [2, "⚪ La salle de l'étain (pioche en cuivre)"],
  [3, "💜 La géode, au fond (pioche en bronze)"], [4, "🥚 Dans les géodes (ouvertes à la table de taille)"]];
const OU_PIERRE = {1: "dans la grande salle de la mine", 2: "dans la salle de l'étain (la galerie se creuse avec une pioche en cuivre)",
  3: "dans la géode, au fond de la mine (la galerie se creuse avec une pioche en bronze)", 4: "dans les géodes : ouvre-les à la table de taille de la Carrière"};
function pierresHTML(){
  const c = state.carnet.pierres || {}, ks = Object.keys(PIERRES), vu = k => c[k] && c[k].n > 0, [n, tot] = pierresTrouvees();
  const tuile = k => { const on = fiche === k ? " on" : "";
    return vu(k)
      ? `<button class="tile${on}${k === "coeurMine" ? " legende" : ""}" data-carnet="${k}"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tl">${objet(k).nom}</div>${k === "coeurMine" ? `<div class="tn">👑</div>` : ""}</button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Pierre pas encore trouvée"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const f = fiche && objet(fiche), e = f && f.une ? "e" : "";
  const detail = !f ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche une pierre pour voir sa fiche.</p>`
    : vu(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(fiche)}</span><div class="pt"><b>${f.nom}</b><p>${f.usage}</p><p>${fiche === "coeurMine" ? "👑 Dégagé du pilier de la géode : il n'y en a pas d'autre" : `Trouvé${e} : ${c[fiche].n}`}</p></div></div>`
    : fiche === "coeurMine" ? `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore trouvé</b><p>Une lueur dort dans le pilier de la géode, au fond de la mine. Elle se réveille quand tu as trouvé toutes les pierres des trois salles (${n} sur ${tot}).</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore trouvé${e}</b><p>On ${f.une ? "la" : "le"} trouve ${OU_PIERRE[PIERRES[fiche]]}.</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">💎 Pierres : ${ks.filter(vu).length} sur ${ks.length}. Chaque pierre que tu trouves à la mine s'inscrit ici ; expose les plus belles dans une vitrine.</p>` + detail +
    SALLES.map(([s, titre]) => `<h3 style="margin:8px 0 4px">${titre}</h3><div class="res-grid">${ks.filter(k => PIERRES[k] === s).map(tuile).join("")}</div>`).join("") +
    `<h3 style="margin:8px 0 4px">👑 Le légendaire</h3><div class="res-grid">${tuile("coeurMine")}</div>`;
}
/* Les monstres (étape 1.8, morceau 3 ; Grand Carnet : « chaque espèce vaincue s'inscrit au carnet ») : leur taille,
   leur comportement, le signe avant l'attaque, ce qu'ils laissent */
function monstresHTML(){
  const c = state.carnet.monstres, ks = Object.keys(MONSTRES), vu = k => c[k] && c[k].n > 0;
  const tuile = k => { const L = MONSTRES[k], on = fiche === k ? " on" : "";
    return vu(k)
      ? `<button class="tile${on}" data-carnet="${k}"><div class="te" aria-hidden="true">${L.emoji}</div><div class="tl">${L.nom}</div><div class="tn">× ${c[k].n}</div></button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Monstre pas encore vaincu"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const L = fiche && MONSTRES[fiche], e = L && L.une ? "e" : "";
  const laisse = L && Object.entries(L.donne).map(([k, n]) => `${n} ${(n > 1 ? objet(k).pluriel : objet(k).nom).toLowerCase()}`).join(", ");
  const detail = !L ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche un monstre pour voir sa fiche.</p>`
    : vu(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${L.emoji}</span><div class="pt"><b>${L.nom}</b><p>${L.comportement}. Taille : ${L.taille}.</p>` +
      `<p>⚠️ Son signe avant l'attaque : ${L.annonce.toLowerCase()}.</p><p>${L.une ? "Elle" : "Il"} laisse : ${laisse}. Vaincu${e} ${c[fiche].n} fois.</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>Pas encore vaincu${e}</b><p>On ${L.une ? "la" : "le"} rencontre dans la grotte de la Forêt profonde, sous les racines du vieux chêne. Observe bien son signe avant l'attaque !</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">👹 Monstres : ${ks.filter(vu).length} sur ${ks.length}. Chaque attaque s'annonce par un signe : on gagne en observant.</p>` + detail +
    `<h3 style="margin:8px 0 4px">🌲 La grotte de la Forêt profonde</h3><div class="res-grid">${ks.map(tuile).join("")}</div>`;
}
/* Le gibier (étape 1.7, morceau 5) : chaque espèce chassée met son trophée au carnet (carnet) ; le Cerf blanc,
   qui ne se chasse pas, s'y inscrit quand il a offert son bois d'argent */
function gibierHTML(){
  const c = state.carnet.gibier, ks = Object.keys(GIBIER).filter(k => k !== "cerfBlanc"), pris = k => c[k] && c[k].n > 0;
  const tuile = k => { const p = GIBIER[k], on = fiche === k ? " on" : "";
    return pris(k)
      ? `<button class="tile${on}${k === "cerfBlanc" ? " legende" : ""}" data-carnet="${k}"><div class="te" aria-hidden="true">${p.emoji}</div><div class="tl">${p.nom}</div><div class="tn">${k === "cerfBlanc" ? "👑" : "🏆"}</div></button>`
      : `<button class="tile inconnu${on}" data-carnet="${k}" aria-label="Pas encore chassé"><div class="te" aria-hidden="true">?</div><div class="tl">???</div></button>`; };
  const f = fiche && GIBIER[fiche];
  const detail = !f ? `<p class="muted" style="margin:0 0 4px;font-size:14px">Touche une bête pour voir sa fiche.</p>`
    : pris(fiche) ? `<div class="pick"><span class="pe" aria-hidden="true">${f.emoji}</span><div class="pt"><b>${f.nom}</b><p>${f.usage}</p><p>${fiche === "cerfBlanc" ? "Suivi jusqu'au bout : son bois d'argent est à toi" : `Chassé${f.une ? "e" : ""} ${c[fiche].n} fois · 🏆 son trophée est au carnet`}</p></div></div>`
    : `<div class="pick"><span class="pe" aria-hidden="true">?</span><div class="pt"><b>${fiche === "cerfBlanc" ? "Pas encore rencontré" : `Pas encore chassé${f.une ? "e" : ""}`}</b><p>On ${f.une ? "la" : "le"} trouve dans la Forêt profonde, ${OU_GIBIER[f.ou]}${fiche === "cerfBlanc" ? ", les nuits de pleine lune" : ""}. ${fiche === "cerfBlanc" ? "Il ne se chasse pas." : "À toi de découvrir quand !"}</p></div></div>`;
  return `<p class="muted" style="margin:0 0 8px">🦌 Gibier : ${ks.filter(pris).length} sur ${ks.length}. Suis les traces, approche à pas de loup et sous le vent, puis tire à l'arc.</p>` + detail +
    `<h3 style="margin:8px 0 4px">Dans la Forêt profonde</h3><div class="res-grid">${ks.map(tuile).join("")}</div>` +
    `<h3 style="margin:8px 0 4px">👑 Le légendaire</h3><div class="res-grid">${tuile("cerfBlanc")}</div>`;
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
  if(slot){ const [ou, j] = slot.dataset.slot.split(":"); pick = pick && pick.ou === ou && pick.j === +j ? null : {ou, j: +j}; render(); return; }
  const it = choisi();
  if(!it) return;
  if(e.target.closest("[data-sac-main]")){
    if(it.items) enCase(it); else barreAuto(it.k);     // pris en main : il sort du sac, dans une case libre
    const c = dansCase(it.k);
    if(c >= 0) pick = {ou: "case", j: c};
    toggleHold(it.k); render();
  } else if(e.target.closest("[data-sac-remettre]") && pick.ou === "case"){
    if(!auSac(it)){ toast("Ton sac est plein : range d'abord des affaires dans un coffre", 3000); return; }
    state.barre[pick.j] = null;
    if(state.main === it.k) hold(null);
    pick = {ou: "sac", j: state.sac.findIndex(s => s.k === it.k)};
    renderBarre(); save(); render();
  }
});
