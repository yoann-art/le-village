/* ================= Décorer =================
   Le mode décoration d'une pièce : on pose les meubles du catalogue, on les fait glisser au doigt,
   on les tourne d'un quart de tour, on les range. Hors de ce mode, un appui long sur un meuble le
   soulève : on le glisse du doigt, il se pose quand on lève le doigt.
   Les meubles s'alignent toujours (grille de ½ P, collés aux murs) : plus d'aimant ni de placement
   au centimètre, décidé par Yo le 1er octobre 2026.
   La déco est gardée dans le bâtiment (b.deco), elle le suit s'il est déplacé ou agrandi. */
import { $ } from "./outils.js";
import { RES, B, MEUBLES, MEUBLES_ORDER, COULEURS, COULEURS_ORDER, ATELIERS, FABRIQUE_A, GAMES } from "./donnees.js";
import { owned, addOwned, hasAll } from "./regles.js";
import { save } from "./sauvegarde.js";
import { renderer, ray, aim, groundAt } from "./monde/scene.js";
import { interior, buildRoom, addItemMesh, removeItemMesh, placeItemMesh, refreshItemMesh, raiseItemMesh, pickItem } from "./monde/interieurs.js";
import { footOf, hasPlan } from "./monde/meubles.js";
import { player, R, placePlayer } from "./monde/personnage.js";
import { resetJoy } from "./commandes.js";
import { openSheet, toast, wrap, renderHUD } from "./interface.js";
import { currentPlace, isBusy } from "./lieux.js";

let deco = null;                     // la pièce qu'on décore : {b, room}
let sel = null;                      // le meuble choisi
let lift = null;                     // hors du mode décoration, le meuble soulevé : {place, it, pid, x, y, x0, y0, from, last}
const cur = () => deco || lift.place;          // la pièce où l'on bouge un meuble
const items = () => cur().b.deco.items;

export const decorating = () => !!deco;
export const lifting = () => !!lift;
/* Pendant la décoration ou un meuble soulevé, la caméra regarde le milieu de la pièce et la montre en entier */
const view = {target: new THREE.Vector3(), width: 8};
export const decoView = () => deco || lift ? view : null;

/* ----- Règles de place ----- */
const MAT_W = 1.1, MAT_D = .7;       // le paillasson (la sortie) reste toujours libre
const WHY = {paillasson:"Pas sur le paillasson : c'est la sortie", meuble:"Pas sur un autre meuble", tapis:"Pas sur un autre tapis", personnage:"Le personnage est là"};
/* Deux couches : les tapis au sol, les meubles par-dessus. On ne chevauche que sa propre couche. */
function problem(it){
  const [w, d] = footOf(it), {room} = cur(), flat = !!MEUBLES[it.type].flat;
  if(Math.abs(it.x - room.doorX) < (w + MAT_W)/2 && it.z + d/2 > room.d/2 - MAT_D) return "paillasson";
  for(const o of items()){
    if(o === it || !!MEUBLES[o.type].flat !== flat) continue;
    const [ow, od] = footOf(o);
    if(Math.abs(it.x - o.x) < (w + ow)/2 - .001 && Math.abs(it.z - o.z) < (d + od)/2 - .001) return flat ? "tapis" : "meuble";
  }
  if(flat) return null;
  const p = player.position;
  if(Math.abs(p.x - it.x) < w/2 + R && Math.abs(p.z - it.z) < d/2 + R) return "personnage";
  return null;
}
/* Alignement : le bord du meuble se cale sur la grille de ½ P, et contre le mur s'il en est tout près */
function snap(v, half, lim){
  let lo = Math.round((v - half) * 2) / 2;
  if(lo < -lim + .3) lo = -lim;
  if(lo + 2*half > lim - .3) lo = lim - 2*half;
  return lo + half;
}
/* Pose le meuble au plus près de (x, z), aligné, toujours entre les murs */
function settle(it, x, z){
  const [w, d] = footOf(it), hw = cur().room.w/2, hd = cur().room.d/2;
  const cm = v => Math.round(v * 100) / 100;
  it.x = cm(Math.max(-hw + w/2, Math.min(hw - w/2, snap(x, w/2, hw))));
  it.z = cm(Math.max(-hd + d/2, Math.min(hd - d/2, snap(z, d/2, hd))));
}
/* La place libre la plus proche du milieu de la pièce */
function findSpot(it){
  const hw = deco.room.w/2, hd = deco.room.d/2, spots = [];
  for(let z = -hd; z <= hd; z += .5) for(let x = -hw; x <= hw; x += .5) spots.push([x, z]);
  spots.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
  for(const [x, z] of spots){ settle(it, x, z); if(!problem(it)) return true; }
  return false;
}

/* ----- Ce qu'on voit : le meuble choisi est posé sur une plaque jaune (rouge si la place ne va pas) ----- */
const plateMat = new THREE.MeshBasicMaterial({color:0xFFE27A, transparent:true, opacity:.5, depthWrite:false});
const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plateMat);
plate.rotation.x = -Math.PI/2; plate.visible = false;
interior.add(plate);
function hint(text, bad = false){
  const h = $("#place-hint");
  h.hidden = false;
  if(h.textContent !== text) h.textContent = text;
  h.classList.toggle("bad", bad);
}
/* La plaque sous le meuble : jaune, ou rouge si sa place ne va pas (renvoie ce qui ne va pas) */
function showPlate(it){
  plate.visible = !!it;
  if(!it) return null;
  const [w, d] = footOf(it), pb = problem(it);
  plate.scale.set(w + .1, d + .1, 1);
  plate.position.set(it.x, MEUBLES[it.type].flat ? .05 : .03, it.z);
  plateMat.color.setHex(pb ? 0xE4776C : 0xFFE27A);
  return pb;
}
function showSel(){
  $("#deco-sel").hidden = !sel;
  $("#deco-store").hidden = !!(sel && MEUBLES[sel.type].plan);       // un plan de travail ne se range pas
  const pb = showPlate(sel);
  if(!sel){ hint("Touche « Meubles », ou un meuble pour le modifier"); return; }
  hint(pb ? WHY[pb] : `${MEUBLES[sel.type].emoji} ${MEUBLES[sel.type].nom} : glisse-le du doigt`, !!pb);
}

/* ----- Entrer et sortir du mode décoration ----- */
export function startDeco(){
  const place = currentPlace();
  if(!place || deco) return;
  deco = place;
  if(!deco.b.deco) deco.b.deco = {items: [], next: 1};
  const {room} = deco;
  placePlayer(room.doorX, room.d/2 - .3, 0, -1);      // le personnage attend sur le paillasson
  view.target.set(0, 0, 0); view.width = room.w + 1;
  resetJoy();
  $("#actions").hidden = true; $("#joy").hidden = true; $("#deco-bar").hidden = false;
  sel = null; showSel();
}
export function finishDeco(){
  if(!deco) return;
  drag = null; sel = null; plate.visible = false;
  deco = null;
  $("#deco-bar").hidden = true;
  $("#place-hint").hidden = true; $("#place-hint").classList.remove("bad");
  $("#actions").hidden = false; $("#joy").hidden = false;
  save();
}

/* ----- Catalogue, tourner, ranger ----- */
/* Un meuble de métier ne se pose que dans ses bâtiments ; les autres, partout */
const allowedIn = (type, bType) => !MEUBLES[type].where || MEUBLES[type].where.includes(bType);
const GAB = {petit:["Petits meubles", "environ 1 P² au sol"], moyen:["Meubles moyens", "environ 2 P² au sol"], grand:["Grands meubles", "environ 4 P² au sol"]};
/* Un meuble qui a une recette se fabrique : on pose ce qu'on a en réserve. Sans recette (pas encore
   d'atelier pour lui), il reste gratuit. */
const craftable = type => !!FABRIQUE_A[type];
/* Le plan de travail du bâtiment (établi de la Scierie…) : il se construit avec des ressources
   (demande de Yo, pas gratuit), puis se pose où l'on veut, comme un meuble. Un seul par bâtiment. */
const WHERE = {};                       // ressource → mini-jeu qui la donne (bois : le Bûcheron…)
for(const g of Object.values(GAMES)) WHERE[g.res] = g.nom;
function planHTML(b){
  const a = ATELIERS[b.type];
  if(!a) return "";
  const m = MEUBLES[a.meuble], built = hasPlan(b), ok = !built && hasAll(a.cost);
  const chips = Object.entries(a.cost).map(([k, v]) => `<span class="chip ${owned(k) >= v ? "" : "short"}">${RES[k].emoji} ${owned(k)}/${v}</span>`).join("");
  const missing = Object.entries(a.cost).filter(([k, v]) => owned(k) < v).map(([k]) => k);
  return `<h3 style="margin:10px 0 2px">Plan de travail</h3>
    <div class="brow"><div class="be" aria-hidden="true">${m.emoji}</div>
      <div class="bt"><span class="bn">${m.nom}</span>
        <p>${built ? "Déjà construit : touche-le dans la pièce pour le déplacer." : `Pour fabriquer ${a.fait}. Un seul par bâtiment.`}</p>
        ${built ? "" : `<div>${chips}</div>`}
        ${built || ok ? "" : `<p>${missing.map(k => `${RES[k].emoji} Le ${RES[k].nom} s'obtient avec « ${WHERE[k] || "les mini-jeux"} », dans Mini-jeux.`).join(" ")}</p>`}</div>
      <button class="btn primary" data-meuble="${a.meuble}" ${ok ? "" : "disabled"}>${built ? "Construit" : "Construire"}</button></div>`;
}
$("#deco-cat").addEventListener("click", () => {
  const here = deco.b.type;
  openSheet(`<div class="sh-head"><h2 class="display">Meubles</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Ta réserve de meubles. Choisis-en un : il apparaît au milieu de la pièce.</p>` + planHTML(deco.b) +
    Object.keys(GAB).map(g => `<h3 style="margin:14px 0 2px">${GAB[g][0]} <span class="muted" style="font-weight:400;font-size:14px">(${GAB[g][1]})</span></h3>` +
      MEUBLES_ORDER.filter(t => MEUBLES[t].gabarit === g).map(t => {
        const m = MEUBLES[t], n = owned(t), here_ok = allowedIn(t, here), ok = here_ok && (!craftable(t) || n > 0);
        const where = m.where ? `Seulement dans : ${m.where.map(b => B[b].nom).join(", ")}` : "Partout";
        const stock = !craftable(t) ? "Gratuit pour l'instant"
          : n > 0 ? `${n} en réserve` : `À fabriquer : ${ATELIERS[FABRIQUE_A[t]].nom} (${B[FABRIQUE_A[t]].nom})`;
        return `<div class="brow"><div class="be" aria-hidden="true">${m.emoji}</div>
          <div class="bt"><span class="bn">${m.nom}${craftable(t) && n > 0 ? ` × ${n}` : ""}</span><p>${stock}. ${m.flat ? "À plat, on marche dessus. " : ""}${where}</p></div>
          <button class="btn primary" data-meuble="${t}" ${ok ? "" : "disabled"}>Poser</button></div>`;
      }).join("")).join(""));
});
/* Choisi dans le catalogue (voir main.js) : le meuble apparaît à la place libre la plus proche du milieu */
export function addMeuble(type){
  if(!deco) return;
  const plan = MEUBLES[type].plan, a = ATELIERS[deco.b.type];
  if(plan){ if(!a || a.meuble !== type || hasPlan(deco.b) || !hasAll(a.cost)) return; }   // plan de travail : construit et payé
  else if(!allowedIn(type, deco.b.type) || (craftable(type) && owned(type) < 1)) return;
  const it = {id: deco.b.deco.next++, type, x: 0, z: 0, rot: 0};
  if(!findSpot(it)){ toast(`Plus de place pour ${plan ? a.le : "ce meuble"} dans la pièce`); return; }
  if(plan){
    for(const [k, v] of Object.entries(a.cost)) addOwned(k, -v);
    renderHUD();
    toast(`${a.emoji} ${a.le[0].toUpperCase() + a.le.slice(1)} est construit : fais-le glisser où tu veux`, 3200);
  }
  else if(craftable(type)) addOwned(type, -1);                         // pris dans la réserve
  items().push(it); addItemMesh(it);
  sel = it; showSel(); save();
}
$("#deco-rot").addEventListener("click", () => {
  if(!sel) return;
  const before = {x: sel.x, z: sel.z, rot: sel.rot};
  sel.rot = (sel.rot + 1) % 4;
  settle(sel, sel.x, sel.z);
  if(problem(sel)){ Object.assign(sel, before); showSel(); hint("Pas la place de le tourner ici", true); return; }
  placeItemMesh(sel); showSel(); save();
});
$("#deco-store").addEventListener("click", () => {
  if(!sel || MEUBLES[sel.type].plan) return;                          // le plan de travail reste dans son bâtiment
  const list = items();
  list.splice(list.indexOf(sel), 1);
  removeItemMesh(sel.id);
  if(craftable(sel.type)) addOwned(sel.type, 1);                      // rendu à la réserve
  toast(`${MEUBLES[sel.type].emoji} Rangé dans ta réserve`);
  sel = null; showSel(); save();
});
/* ----- Couleurs : du meuble choisi, ou des murs et du sol de la pièce (palette gratuite) ----- */
const hexCss = n => "#" + n.toString(16).padStart(6, "0");
function swatches(target, current){
  const one = (key, label, style, text) => `<div class="sw-item"><button class="swatch${(current || "") === key ? " on" : ""}" ${style}
    data-couleur="${key}" data-cible="${target}" aria-label="${label}">${text}</button>${label}</div>`;
  return `<div class="swatches">${one("", "D'origine", "", "↺")}` +
    COULEURS_ORDER.map(k => one(k, COULEURS[k].nom, `style="--sw:${hexCss(COULEURS[k].hex)}"`, "")).join("") + `</div>`;
}
$("#deco-color").addEventListener("click", () => {
  if(!sel) return;
  const m = MEUBLES[sel.type];
  openSheet(`<div class="sh-head"><h2 class="display">🎨 ${m.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Touche une couleur : le meuble change tout de suite.</p>${swatches("item", sel.color)}`);
});
$("#deco-room").addEventListener("click", () => {
  const d = deco.b.deco;
  openSheet(`<div class="sh-head"><h2 class="display">🎨 La pièce</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">« D'origine » garde l'ambiance du bâtiment.</p>
    <h3 style="margin:10px 0 0">Murs</h3>${swatches("wall", d.wall)}
    <h3 style="margin:4px 0 0">Sol</h3>${swatches("floor", d.floor)}`);
});
wrap.addEventListener("click", e => {
  const btn = e.target.closest("[data-couleur]");
  if(!btn || !deco) return;
  const key = btn.dataset.couleur || undefined, target = btn.dataset.cible, d = deco.b.deco;
  if(target === "item"){ if(!sel) return; sel.color = key; refreshItemMesh(sel); }
  else { d[target] = key; buildRoom(deco.b); }                        // murs ou sol : on refait la pièce
  btn.closest(".swatches").querySelectorAll(".swatch").forEach(s => s.classList.toggle("on", s === btn));
  showSel(); save();
});

$("#deco-done").addEventListener("click", finishDeco);
$("#btn-deco").addEventListener("click", startDeco);

/* ----- Le doigt : en décoration, toucher un meuble le choisit, le faire glisser le déplace ;
   hors décoration, un appui long (½ s) sur un meuble le soulève (demande de Yo) ----- */
const canvas = renderer.domElement, touches = new Set(), hit = new THREE.Vector3();
let drag = null;                     // {pid, ox, oz, last} : écart doigt-meuble et dernière place valable
let press = null;                    // appui long en cours sur un meuble : {id, pid, x, y, sx, sy, timer}
function endDrag(){
  if(!drag) return;
  if(problem(sel)){ sel.x = drag.last.x; sel.z = drag.last.z; placeItemMesh(sel); }   // place refusée : il revient
  drag = null; showSel(); save();
}
function cancelPress(){ if(press){ clearTimeout(press.timer); press = null; } }
function startLift(){
  const {id, pid, x, y} = press, place = currentPlace();
  press = null;
  const it = place && !deco && !isBusy() && wrap.hidden ? place.b.deco.items.find(v => v.id === id) : null;
  if(!it) return;
  try{ if(navigator.vibrate) navigator.vibrate(30); }catch(_){}
  lift = {place, it, pid, x, y, x0: x, y0: y, from: {x: it.x, z: it.z}, last: {x: it.x, z: it.z}};
  view.target.set(0, 0, 0); view.width = place.room.w + 1;
  resetJoy();
  $("#actions").hidden = true; $("#joy").hidden = true;
  raiseItemMesh(it.id, .15);
  showLift();
}
function showLift(){
  const m = MEUBLES[lift.it.type], pb = showPlate(lift.it);
  hint(pb ? WHY[pb] : `${m.emoji} ${m.nom} : glisse ton doigt, puis lève-le pour poser`, !!pb);
}
/* À chaque image et à chaque mouvement : le meuble soulevé bouge autant que le doigt depuis l'appui
   (mesuré avec la caméra du moment, qui recule pour montrer la pièce : doigt immobile, meuble immobile) */
const hit0 = new THREE.Vector3();
export function updateLift(){
  if(!lift || !groundAt(lift.x0, lift.y0, hit0) || !groundAt(lift.x, lift.y, hit)) return;
  const it = lift.it, x = it.x, z = it.z;
  settle(it, lift.from.x + hit.x - hit0.x, lift.from.z + hit.z - hit0.z);
  if(!problem(it)) lift.last = {x: it.x, z: it.z};
  if(it.x !== x || it.z !== z){ placeItemMesh(it); showLift(); }
}
function endLift(){
  const it = lift.it;
  if(problem(it)){ it.x = lift.last.x; it.z = lift.last.z; }     // place refusée : il revient à la dernière bonne place
  raiseItemMesh(it.id, 0); placeItemMesh(it);
  lift = null; plate.visible = false;
  $("#place-hint").hidden = true; $("#place-hint").classList.remove("bad");
  $("#actions").hidden = false; $("#joy").hidden = false;
  save();
}
canvas.addEventListener("pointerdown", e => {
  touches.add(e.pointerId);
  if(touches.size > 1){ cancelPress(); endDrag(); return; }        // deux doigts : c'est un zoom
  if(!deco){
    if(lift || !currentPlace() || isBusy() || !wrap.hidden) return;
    const id = pickItem(aim(e.clientX, e.clientY));
    if(id !== null) press = {id, pid: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, timer: setTimeout(startLift, 500)};
    return;
  }
  const id = pickItem(aim(e.clientX, e.clientY));
  const it = id !== null ? items().find(v => v.id === id) : null;
  sel = it || null;
  if(it && groundAt(e.clientX, e.clientY, hit)) drag = {pid: e.pointerId, ox: it.x - hit.x, oz: it.z - hit.z, last: {x: it.x, z: it.z}};
  showSel();
});
canvas.addEventListener("pointermove", e => {
  if(press && e.pointerId === press.pid){
    press.x = e.clientX; press.y = e.clientY;
    if(Math.hypot(press.x - press.sx, press.y - press.sy) > 12) cancelPress();   // le doigt a bougé : pas d'appui long
  }
  if(lift && e.pointerId === lift.pid){ lift.x = e.clientX; lift.y = e.clientY; updateLift(); }
  if(!deco || !drag || e.pointerId !== drag.pid || !groundAt(e.clientX, e.clientY, hit)) return;
  settle(sel, hit.x + drag.ox, hit.z + drag.oz);
  if(!problem(sel)) drag.last = {x: sel.x, z: sel.z};
  placeItemMesh(sel); showSel();
});
function fingerUp(e){
  touches.delete(e.pointerId);
  if(press && e.pointerId === press.pid) cancelPress();
  if(lift && e.pointerId === lift.pid) endLift();
  if(drag && e.pointerId === drag.pid) endDrag();
}
canvas.addEventListener("pointerup", fingerUp);
canvas.addEventListener("pointercancel", fingerUp);

/* Sur ordinateur : flèches pour déplacer le meuble choisi, R pour le tourner, Suppr pour le ranger */
const STEP = {ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0]};
window.addEventListener("keydown", e => {
  if(!deco || !sel || !$("#sheetWrap").hidden) return;
  if(STEP[e.code]){
    const before = {x: sel.x, z: sel.z};
    settle(sel, sel.x + STEP[e.code][0] * .5, sel.z + STEP[e.code][1] * .5);
    if(problem(sel)) Object.assign(sel, before);
    placeItemMesh(sel); showSel(); save();
    e.preventDefault();
  }
  else if(e.key === "r" || e.key === "R") $("#deco-rot").click();
  else if(e.key === "Delete" || e.key === "Backspace") $("#deco-store").click();
});
