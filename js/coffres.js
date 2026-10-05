/* ================= Les coffres de réserve =================
   Demande de Yo : la récolte va dans le sac, et c'est le joueur qui la range dans un coffre de réserve posé
   au village. Un coffre se fabrique à l'établi (« Coffre de réserve »), se pose devant soi sur une case libre
   (en main : « Poser le coffre »), et s'ouvre en s'en approchant (« Ouvrir le coffre »). On peut en avoir
   plusieurs pour trier. Tout s'y range, même les outils et les graines.
   state.coffres = [{id, i (la case), items: [{k, n}]}] ; sur la carte, la case porte o = "coffre" et l'id. */
import { COFFRE, SAC, OUTILS, GRAINES, POSABLES, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { slotsAdd, slotsTake, sacAdd, sacTake, doorTile } from "./regles.js";
import { map, inb, N, tileOf, setObj, setEtat } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { entreePonton } from "./monde/ponton.js";
import { player } from "./monde/personnage.js";
import { openSheet, closeSheet, toast, wrap, renderHUD } from "./interface.js";
import { syncBarre, barreAuto } from "./barre.js";

const coffreOf = id => state.coffres.find(c => c.id === id);
const nomCoffre = co => `Coffre ${state.coffres.indexOf(co) + 1}`;

/* Une case où poser un coffre : terre ferme, rien dessus, pas un bâtiment ni la case d'une porte, pas sous le personnage */
export function poseProblem(i){
  const x = i % N, z = Math.floor(i / N);
  if(!inb(x, z) || map.type[i] === "water") return "Pas dans l'eau";
  if(map.obj[i] || occ.has(i)) return "Cette case est occupée";
  if(state.sol && state.sol[i]) return "Ramasse d'abord ce qui est par terre";
  if(state.buildings.some(b => { const [dx, dz] = doorTile(b.type, b.x, b.z); return dx === x && dz === z; })) return "La case devant une porte reste libre";
  if(i === entreePonton) return "Le passage vers le ponton reste libre";
  if(tileOf(player.position.x) === x && tileOf(player.position.z) === z) return "Recule d'un pas pour le poser devant toi";
  return null;
}
function newCoffre(i){
  state.coffreId = (state.coffreId || 0) + 1;
  const co = {id: state.coffreId, i, items: []};
  state.coffres.push(co);
  setObj(i, "coffre"); setEtat(i, {id: co.id});
  return co;
}
/* Poser le coffre tenu en main sur la case devant soi */
export function poserCoffre(i){
  const why = poseProblem(i);
  if(why){ toast(why); return; }
  if(!sacTake(state.main, 1)) return;
  const co = newCoffre(i);
  syncBarre(); save();
  toast(`🗃️ ${nomCoffre(co)} posé : approche-toi et touche « Ouvrir le coffre » pour y ranger tes affaires`, 3600);
}

/* ----- L'écran d'un coffre : toucher un objet du sac le range, toucher un objet du coffre le reprend ----- */
let open = null;                                     // le coffre ouvert
const slots = (list, cap, attr) => Array.from({length: cap}, (_, j) => {
  const it = list[j];
  if(!it) return `<div class="slot empty" aria-label="Emplacement vide"></div>`;
  const m = objet(it.k);
  return `<button class="slot" ${attr}="${j}" aria-label="${it.n} ${m.nom}"><span aria-hidden="true">${icone(it.k)}</span>${it.n > 1 ? `<span class="sn">${it.n}</span>` : ""}</button>`;
}).join("");
function render(){
  const co = open;
  openSheet(`<div class="sh-head"><h2 class="display">🗃️ ${nomCoffre(co)}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Touche un objet de ton sac pour le ranger, ou un objet du coffre pour le reprendre.</p>
    <div class="co-head"><h3>Dans le coffre (${co.items.length} sur ${COFFRE.places})</h3>
      <button class="btn primary" data-co-tout ${state.sac.some(it => !state.barre.includes(it.k)) ? "" : "disabled"}>Tout ranger</button></div>
    <div class="sac-grid">${slots(co.items, COFFRE.places, "data-co-out")}</div>
    <h3 style="margin:12px 0 6px">Ton sac (${state.sac.length} sur ${SAC.places})</h3>
    <div class="sac-grid">${slots(state.sac, SAC.places, "data-co-in")}</div>
    <p class="muted" style="margin:6px 0 0;font-size:14px">« Tout ranger » garde dans ton sac ce qui est dans tes cases rapides.</p>
    ${co.items.length ? "" : `<button class="btn ghost" data-co-reprendre style="margin-top:10px">Reprendre le coffre (il est vide)</button>`}`);
}
export function openCoffre(id){ open = coffreOf(id); if(open) render(); }
/* Range une pile du sac dans le coffre (autant qu'il y a de place) */
function ranger(j){
  const it = state.sac[j];
  if(!it) return 0;
  const n = slotsAdd(open.items, COFFRE.places, it.k, it.n);
  if(n) sacTake(it.k, n);
  return n;
}
wrap.addEventListener("click", e => {
  if(!open || wrap.hidden) return;
  const inn = e.target.closest("[data-co-in]"), out = e.target.closest("[data-co-out]");
  if(inn){
    const it = state.sac[+inn.dataset.coIn], k = it && it.k;
    if(!ranger(+inn.dataset.coIn)) toast("Ce coffre est plein : fabrique-en un autre à l'établi");
    else toast(`${objet(k).emoji} Rangé dans le coffre`, 1200);
  } else if(out){
    const it = open.items[+out.dataset.coOut];
    if(!it) return;
    const n = sacAdd(it.k, it.n);
    if(!n){ toast("Ton sac est plein"); return; }
    slotsTake(open.items, it.k, n);
    if(OUTILS[it.k] || GRAINES[it.k] || POSABLES[it.k]) barreAuto(it.k);
    toast(`${objet(it.k).emoji} Dans ton sac`, 1200);
  } else if(e.target.closest("[data-co-tout]")){
    let n = 0, plein = false;
    for(let j = state.sac.length - 1; j >= 0; j--){
      if(state.barre.includes(state.sac[j].k)) continue;
      const it = state.sac[j], m = ranger(j);
      n += m; if(m < it.n) plein = true;
    }
    toast(plein ? "Le coffre est plein : il en reste dans ton sac" : n ? "Tout est rangé" : "Rien à ranger", 1800);
  } else if(e.target.closest("[data-co-reprendre]")){
    if(open.items.length) return;
    if(!sacAdd("coffreReserve", 1)){ toast("Ton sac est plein"); return; }
    setObj(open.i, null);
    state.coffres.splice(state.coffres.indexOf(open), 1);
    barreAuto("coffreReserve"); syncBarre(); save(); renderHUD();
    open = null; closeSheet();
    toast("🗃️ Coffre repris dans ton sac");
    return;
  } else return;
  syncBarre(); save(); renderHUD(); render();
});
