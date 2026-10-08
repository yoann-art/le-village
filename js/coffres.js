/* ================= Les coffres de réserve =================
   Demande de Yo : la récolte va dans le sac, et c'est le joueur qui la range dans un coffre de réserve posé
   au village. Un coffre se fabrique à l'établi (« Coffre de réserve »), se pose devant soi sur une case libre
   (en main : « Poser le coffre »), et s'ouvre en s'en approchant (« Ouvrir le coffre »). On peut en avoir
   plusieurs pour trier. Tout s'y range, même les outils et les graines.
   Demande de Yo (v1.7.7) : toucher un objet le choisit et montre sa fiche, sans le déplacer ; on choisit ensuite
   d'en ranger (ou d'en prendre) tout ou un seul, comme le petit menu d'Animal Crossing. « Compléter les piles »
   (l'idée de Stardew Valley) range seulement ce que le coffre a déjà : pratique pour trier avec plusieurs coffres.
   Demande de Yo (v1.7.8) : « Déplacer le coffre », même plein. Il arrive en main avec tout ce qu'il contient
   (« coffre rempli », POSABLES.coffrePlein = {k, n: 1, id, items}), se repose ailleurs (il garde son nom), ou se
   range dans le sac ou dans un autre coffre.
   Demande de Yo (v1.7.9) : un coffre se pose aussi dans la pièce de n'importe quel bâtiment, devant soi, comme un
   meuble (b.deco.items : {type: "coffre", reserve: id du coffre}) ; « Ouvrir le coffre » quand on est tout près
   (#btn-coffre) ; il se déplace dans la pièce par un appui long, comme les meubles. Pas dans la mine ni la forêt.
   state.coffres = [{id, i (la case de l'île) ou b (l'id du bâtiment), items: [{k, n}]}] ; sur l'île, la case
   porte o = "coffre" et l'id. */
import { B, COFFRE, SAC, OUTILS, POSABLES, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { slotsAdd, slotsPlace, sacAdd, sacPlace, sacTake, sacPut, sacTakeObj, doorTile } from "./regles.js";
import { map, inb, N, tileOf, setObj, setEtat } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { entrees } from "./monde/ponton.js";
import { player, regard } from "./monde/personnage.js";
import { footOf } from "./monde/meubles.js";
import { addItemMesh, removeItemMesh } from "./monde/interieurs.js";
import { currentPlace } from "./lieux.js";
import { placerDans } from "./decorer.js";
import { openSheet, closeSheet, toast, wrap, renderHUD } from "./interface.js";
import { syncBarre, barreAuto, utilisable, enCaseAuto, jauge, enCase, hold } from "./barre.js";

const coffreOf = id => state.coffres.find(c => c.id === id);
const nomCoffre = co => `Coffre ${state.coffres.indexOf(co) + 1}`;
const nomDe = (k, n) => (n > 1 && objet(k).pluriel || objet(k).nom).toLowerCase();
/* Ce que contient un coffre rempli, en une ligne */
export function contenu(it){
  const n = {};
  for(const c of it.items) n[c.k] = (n[c.k] || 0) + c.n;
  return Object.entries(n).map(([k, v]) => `${v} ${nomDe(k, v)}`).join(", ");
}

/* Une case où poser un coffre : terre ferme, rien dessus, pas un bâtiment ni la case d'une porte, pas sous le personnage */
export function poseProblem(i){
  const x = i % N, z = Math.floor(i / N);
  if(!inb(x, z) || map.type[i] === "water") return "Pas dans l'eau";
  if(map.obj[i] || occ.has(i)) return "Cette case est occupée";
  if(state.sol && state.sol[i]) return "Ramasse d'abord ce qui est par terre";
  if(state.buildings.some(b => { const [dx, dz] = doorTile(b.type, b.x, b.z, b.rot); return dx === x && dz === z; })) return "La case devant une porte reste libre";
  if(entrees.has(i)) return "Le passage vers le ponton ou le pont reste libre";
  if(tileOf(player.position.x) === x && tileOf(player.position.z) === z) return "Recule d'un pas pour le poser devant toi";
  return null;
}
/* Un coffre posé (ou : {i} sur l'île, {b} dans un bâtiment) ; un coffre rempli garde ce qu'il contient, et son
   nom (son numéro) si personne ne l'a pris */
function newCoffre(ou, plein){
  let id = plein && plein.id;
  if(!id || state.coffres.some(c => c.id === id)){ state.coffreId = (state.coffreId || 0) + 1; id = state.coffreId; }
  const co = {id, ...ou, items: plein ? plein.items : []};
  state.coffres.push(co);
  state.coffres.sort((a, b) => a.id - b.id);
  return co;
}
/* Le coffre tenu en main quitte la main : {plein} (le coffre rempli, ou null pour un coffre vide), ou null */
function sortirDeLaMain(){
  const plein = state.main === "coffrePlein" ? sacTakeObj(state.main) : null;
  if(!plein && !sacTake(state.main, 1)) return null;
  return {plein};
}
const pose = (co, plein) => toast(plein ? `🗃️ ${nomCoffre(co)} posé, avec tout ce qu'il contient`
  : `🗃️ ${nomCoffre(co)} posé : approche-toi et touche « Ouvrir le coffre » pour y ranger tes affaires`, 3600);
/* Poser le coffre tenu en main sur la case de l'île devant soi */
export function poserCoffre(i){
  const why = poseProblem(i);
  if(why){ toast(why); return; }
  const m = sortirDeLaMain();
  if(!m) return;
  const co = newCoffre({i}, m.plein);
  setObj(i, "coffre"); setEtat(i, {id: co.id});
  syncBarre(); save(); pose(co, m.plein);
}
/* Poser le coffre tenu en main dans la pièce d'un bâtiment, juste devant soi, aligné comme un meuble */
export function poserDansPiece(place){
  const b = place.b;
  if(!b.deco) b.deco = {items: [], next: 1};
  const d = regard(), p = player.position, it = {id: 0, type: "coffre", x: 0, z: 0, rot: 0};
  if(!placerDans(place, it, p.x + d.x * 1.1, p.z + d.z * 1.1)){ toast("Pas de place ici : va vers un coin libre de la pièce", 2600); return; }
  const m = sortirDeLaMain();
  if(!m) return;
  const co = newCoffre({b: b.id}, m.plein);
  it.id = b.deco.next++; it.reserve = co.id;
  b.deco.items.push(it); addItemMesh(it);
  syncBarre(); save(); pose(co, m.plein);
}
/* Enlève un coffre de là où il est posé (l'île, ou la pièce d'un bâtiment) */
function enlever(co){
  if(co.i !== undefined) setObj(co.i, null);
  else {
    const b = state.buildings.find(v => v.id === co.b), l = b && b.deco ? b.deco.items : [], j = l.findIndex(it => it.reserve === co.id);
    if(j >= 0){ const [it] = l.splice(j, 1); if(currentPlace() && currentPlace().b === b) removeItemMesh(it.id); }
  }
  state.coffres.splice(state.coffres.indexOf(co), 1);
}

/* ----- Dans la pièce d'un bâtiment : « Ouvrir le coffre » tout près d'un coffre, « Poser le coffre » s'il est en main ----- */
const btnPiece = document.querySelector("#btn-coffre");
let actPiece = null;
export function updateCoffrePiece(active){
  const place = active && currentPlace();
  actPiece = null;
  if(place && B[place.b.type] && !B[place.b.type].fixe){
    const p = player.position, proche = ((place.b.deco && place.b.deco.items) || []).find(it => {
      if(!it.reserve) return false;
      const [w, d] = footOf(it);
      return Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
    });
    if(proche) actPiece = {label: "🗃️ Ouvrir le coffre", run: () => openCoffre(proche.reserve)};
    else if(state.main && POSABLES[state.main] && POSABLES[state.main].pose === "coffre") actPiece = {label: "🗃️ Poser le coffre", run: () => poserDansPiece(place)};
  }
  if(actPiece && btnPiece.textContent !== actPiece.label) btnPiece.textContent = actPiece.label;
  if(btnPiece.hidden === !!actPiece) btnPiece.hidden = !actPiece;
}
btnPiece.addEventListener("click", () => { if(actPiece) actPiece.run(); });

/* ----- L'écran d'un coffre : toucher un objet le choisit (sa fiche), puis on choisit de le déplacer ----- */
let open = null;                                     // le coffre ouvert
let sel = null;                                      // l'objet choisi : {ou: "coffre", "sac" ou "case", it : son emplacement}
const LISTE = {coffre: () => open.items, sac: () => state.sac, case: () => state.barre};
const grille = (ou, cap) => Array.from({length: cap}, (_, j) => {
  const it = LISTE[ou]()[j];
  if(!it) return `<div class="slot empty" aria-label="${ou === "case" ? "Case rapide vide" : "Emplacement vide"}"></div>`;
  const on = sel && sel.it === it;
  return `<button class="slot${on ? " on" : ""}" data-co="${ou}:${j}" aria-label="${it.n} ${objet(it.k).nom}${on ? ", choisi" : ""}"><span aria-hidden="true">${icone(it.k)}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}${jauge(it.k)}</button>`;
}).join("");
/* La fiche de l'objet choisi, et les boutons pour le déplacer */
function ficheHTML(){
  if(!sel) return `<p class="muted" style="margin:0;font-size:14px">Touche un objet pour voir sa fiche, puis choisis de le ranger ou de le prendre.</p>`;
  const it = sel.it, m = objet(it.k), prendre = sel.ou === "coffre";
  const ou = prendre ? "Dans le coffre" : sel.ou === "case" ? `Dans ta case rapide ${state.barre.indexOf(it) + 1}` : "Dans ton sac";
  const place = it.items ? (prendre ? state.sac.length < SAC.places || state.barre.includes(null) : open.items.length < COFFRE.places) ? 1 : 0
    : Math.min(it.n, prendre ? sacPlace(it.k) : slotsPlace(open.items, COFFRE.places, it.k));
  /* Demande de Yo (v1.7.9) : le bouton dit où va l'objet, « Ranger 1 sac » ou « Ranger tout coffre » */
  const vers = prendre ? "sac" : "coffre";
  const boutons = !place ? `<button class="btn" disabled>${prendre ? "Ton sac est plein" : "Le coffre est plein"}</button>`
    : it.n === 1 ? `<button class="btn primary" data-co-bouge="1">Ranger 1 ${vers}</button>`
    : `<button class="btn primary" data-co-bouge="${place}">Ranger ${place < it.n ? place : "tout"} ${vers} (${place})</button>
       <button class="btn ghost" data-co-bouge="1">Ranger 1 ${vers}</button>`;
  return `<div class="cf-top"><span class="pe" aria-hidden="true">${icone(it.k)}</span>
      <div><b>${it.n > 1 ? it.n + " × " : ""}${m.nom}</b><p>${ou}${m.prix ? ` · au comptoir : ${m.prix} or` : ""}</p></div></div>
    ${it.items ? `<p class="cf-txt">Contient : ${contenu(it)}</p>` : ""}${OUTILS[it.k] && OUTILS[it.k].eau ? `<p class="cf-txt">💧 Eau : ${state.eau} sur ${OUTILS[it.k].eau}</p>` : ""}${m.usage || m.aide ? `<p class="cf-txt">${m.usage || m.aide}</p>` : ""}
    <div class="co-btns">${boutons}</div>`;
}
function render(){
  const co = open;
  if(sel && LISTE[sel.ou]().indexOf(sel.it) < 0) sel = null;      // l'objet choisi n'est plus là
  openSheet(`<div class="sh-head"><h2 class="display">🗃️ ${nomCoffre(co)}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <h3 style="margin:4px 0 6px">Dans le coffre (${co.items.length} sur ${COFFRE.places})</h3>
    <div class="sac-grid co">${grille("coffre", COFFRE.places)}</div>
    <div class="co-btns">
      <button class="btn primary" data-co-tout ${state.sac.length ? "" : "disabled"}>Tout ranger</button>
      <button class="btn ghost" data-co-piles ${state.sac.some(it => co.items.some(c => c.k === it.k)) ? "" : "disabled"}>Compléter les piles</button>
    </div>
    <p class="muted" style="margin:4px 0 0;font-size:13px">« Tout ranger » : tout ton sac (tes cases rapides restent). « Compléter les piles » : seulement ce que ce coffre a déjà.</p>
    <h3 style="margin:12px 0 6px">Ton sac (${state.sac.length} sur ${SAC.places})</h3>
    <div class="sac-grid co">${grille("sac", SAC.places)}</div>
    <h3 style="margin:8px 0 6px">Tes cases rapides</h3>
    <div class="sac-grid co">${grille("case", SAC.cases)}</div>
    <button class="btn ghost" data-co-deplacer style="margin-top:10px;width:100%">🗃️ Déplacer le coffre${co.items.length ? ", avec ce qu'il contient" : ""}</button>
    <div class="co-fiche">${ficheHTML()}</div>`);
}
export function openCoffre(id){ open = coffreOf(id); sel = null; if(open) render(); }

/* Retire n objets d'un emplacement (du sac, d'une case rapide ou du coffre) */
function oter(ou, it, n){
  if(n < it.n){ it.n -= n; return; }
  const l = LISTE[ou](), j = l.indexOf(it);
  if(ou === "case") l[j] = null; else l.splice(j, 1);
}
/* Range dans le coffre n objets d'un emplacement du sac ou d'une case (autant qu'il y a de place) */
function ranger(ou, it, n){
  if(it.items){                                      // un coffre rempli : tout entier, dans un emplacement à lui
    if(open.items.length >= COFFRE.places) return 0;
    open.items.push(it); oter(ou, it, 1);
    return 1;
  }
  const m = slotsAdd(open.items, COFFRE.places, it.k, Math.min(n, it.n));
  if(m) oter(ou, it, m);
  return m;
}
/* Prend n objets d'un emplacement du coffre : sur soi (un outil prend une case rapide libre) */
function prendre(it, n){
  if(it.items){ if(!sacPut(it)) return 0; oter("coffre", it, 1); barreAuto(it.k); return 1; }
  const m = sacAdd(it.k, Math.min(n, it.n));
  if(m){ oter("coffre", it, m); if(enCaseAuto(it.k)) barreAuto(it.k); }
  return m;
}
/* Range tout le sac, ou seulement ce que le coffre a déjà (« Compléter les piles ») */
function rangerSac(seulementPiles){
  let n = 0, plein = false;
  for(const it of [...state.sac].reverse()){
    if(seulementPiles && (it.items || !open.items.some(c => c.k === it.k))) continue;
    const a = it.n, m = ranger("sac", it, a);
    n += m; if(m < a) plein = true;
  }
  return {n, plein};
}

wrap.addEventListener("click", e => {
  if(!open || wrap.hidden) return;
  const s = e.target.closest("[data-co]"), b = e.target.closest("[data-co-bouge]");
  if(s){
    const [ou, j] = s.dataset.co.split(":"), it = LISTE[ou]()[+j];
    sel = it && !(sel && sel.it === it) ? {ou, it} : null;        // retoucher l'objet choisi le lâche
    render();
    return;
  }
  if(b && sel){
    const k = sel.it.k, m = sel.ou === "coffre" ? prendre(sel.it, +b.dataset.coBouge) : ranger(sel.ou, sel.it, +b.dataset.coBouge);
    if(!m) toast(sel.ou === "coffre" ? "Ton sac est plein" : "Ce coffre est plein : fabrique-en un autre à l'établi");
    else toast(`${objet(k).emoji || "📦"} ${sel.ou === "coffre" ? "Dans ton sac" : "Rangé dans le coffre"} : ${m} ${nomDe(k, m)}`, 1400);
  } else if(e.target.closest("[data-co-tout]") || e.target.closest("[data-co-piles]")){
    const piles = !!e.target.closest("[data-co-piles]"), {n, plein} = rangerSac(piles);
    toast(plein ? "Le coffre est plein : il en reste dans ton sac" : n ? (piles ? "Piles complétées" : "Tout est rangé") : "Rien à ranger", 1800);
  } else if(e.target.closest("[data-co-deplacer]")){
    /* Déplacer le coffre : vide, il redevient un coffre de réserve ; plein, un coffre rempli qui garde tout */
    const co = open, plein = co.items.length ? {k: "coffrePlein", n: 1, id: co.id, items: co.items} : null, k = plein ? plein.k : "coffreReserve";
    if(plein ? !sacPut(plein) : !sacAdd(k, 1)){ toast("Ton sac et tes cases rapides sont pleins : fais de la place pour emporter le coffre", 3200); return; }
    const nom = nomCoffre(co);
    enlever(co);
    if(plein) enCase(plein); else barreAuto(k);
    hold(k); renderHUD();
    open = null; sel = null; closeSheet();
    toast(plein ? `🗃️ ${nom} en main, avec tout ce qu'il contient : pose-le où tu veux (« Poser le coffre »), ou range-le dans un autre coffre`
      : `🗃️ ${nom} en main : pose-le où tu veux (« Poser le coffre »)`, 4200);
    return;
  } else return;
  syncBarre(); save(); renderHUD(); render();
});
