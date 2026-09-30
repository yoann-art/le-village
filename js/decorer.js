/* ================= Décorer =================
   Le mode décoration d'une pièce : on pose les meubles du catalogue, on les fait glisser au doigt
   (au centimètre, ou alignés par l'aimant), on les tourne d'un quart de tour, on les range.
   Catalogue gratuit et illimité pour l'instant (fabrication : étape 1.3, inventaire : étape 1.4).
   La déco est gardée dans le bâtiment (b.deco), elle le suit s'il est déplacé ou agrandi. */
import { $ } from "./outils.js";
import { B, MEUBLES, MEUBLES_ORDER, COULEURS, COULEURS_ORDER } from "./donnees.js";
import { save } from "./sauvegarde.js";
import { renderer, ray, aim, groundAt } from "./monde/scene.js";
import { interior, buildRoom, addItemMesh, removeItemMesh, placeItemMesh, refreshItemMesh, pickItem } from "./monde/interieurs.js";
import { footOf } from "./monde/meubles.js";
import { player, R, placePlayer } from "./monde/personnage.js";
import { resetJoy } from "./commandes.js";
import { openSheet, toast, wrap } from "./interface.js";
import { currentPlace } from "./lieux.js";

let deco = null;                     // la pièce qu'on décore : {b, room}
let sel = null;                      // le meuble choisi
const items = () => deco.b.deco.items;

/* Aimant : aligne sur une grille de ½ P et colle aux murs. Allumé par défaut, gardé sur l'appareil */
const MAG_KEY = "le-village-aimant";
let magnet = true;
try{ const v = localStorage.getItem(MAG_KEY); if(v !== null) magnet = v === "1"; }catch(_){}

export const decorating = () => !!deco;
/* Pendant la décoration, la caméra regarde le milieu de la pièce et la montre en entier */
const view = {target: new THREE.Vector3(), width: 8};
export const decoView = () => deco ? view : null;

/* ----- Règles de place ----- */
const MAT_W = 1.1, MAT_D = .7;       // le paillasson (la sortie) reste toujours libre
const WHY = {paillasson:"Pas sur le paillasson : c'est la sortie", meuble:"Pas sur un autre meuble", tapis:"Pas sur un autre tapis", personnage:"Le personnage est là"};
/* Deux couches : les tapis au sol, les meubles par-dessus. On ne chevauche que sa propre couche. */
function problem(it){
  const [w, d] = footOf(it), {room} = deco, flat = !!MEUBLES[it.type].flat;
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
/* Aimant : le bord du meuble se cale sur la grille de ½ P, et contre le mur s'il en est tout près */
function snap(v, half, lim){
  let lo = Math.round((v - half) * 2) / 2;
  if(lo < -lim + .3) lo = -lim;
  if(lo + 2*half > lim - .3) lo = lim - 2*half;
  return lo + half;
}
/* Pose le meuble au plus près de (x, z) : toujours entre les murs ; aligné si l'aimant est allumé,
   sinon au centimètre */
function settle(it, x, z){
  const [w, d] = footOf(it), hw = deco.room.w/2, hd = deco.room.d/2;
  if(magnet){ x = snap(x, w/2, hw); z = snap(z, d/2, hd); }
  const cm = v => Math.round(v * 100) / 100;
  it.x = cm(Math.max(-hw + w/2, Math.min(hw - w/2, x)));
  it.z = cm(Math.max(-hd + d/2, Math.min(hd - d/2, z)));
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
function showSel(){
  $("#deco-sel").hidden = !sel;
  plate.visible = !!sel;
  if(!sel){ hint("Touche « Meubles », ou un meuble pour le modifier"); return; }
  const [w, d] = footOf(sel), pb = problem(sel);
  plate.scale.set(w + .1, d + .1, 1);
  plate.position.set(sel.x, MEUBLES[sel.type].flat ? .05 : .03, sel.z);
  plateMat.color.setHex(pb ? 0xE4776C : 0xFFE27A);
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
  setMagnetButton();
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

/* ----- Catalogue, tourner, ranger, aimant ----- */
/* Un meuble de métier ne se pose que dans ses bâtiments ; les autres, partout */
const allowedIn = (type, bType) => !MEUBLES[type].where || MEUBLES[type].where.includes(bType);
const GAB = {petit:["Petits meubles", "environ 1 P² au sol"], moyen:["Meubles moyens", "environ 2 P² au sol"], grand:["Grands meubles", "environ 4 P² au sol"]};
$("#deco-cat").addEventListener("click", () => {
  const here = deco.b.type;
  openSheet(`<div class="sh-head"><h2 class="display">Meubles</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Gratuits pour l'instant. Choisis-en un : il apparaît au milieu de la pièce.</p>` +
    Object.keys(GAB).map(g => `<h3 style="margin:14px 0 2px">${GAB[g][0]} <span class="muted" style="font-weight:400;font-size:14px">(${GAB[g][1]})</span></h3>` +
      MEUBLES_ORDER.filter(t => MEUBLES[t].gabarit === g).map(t => {
        const m = MEUBLES[t], ok = allowedIn(t, here);
        const where = m.where ? `Seulement dans : ${m.where.map(b => B[b].nom).join(", ")}` : "Partout";
        return `<div class="brow"><div class="be" aria-hidden="true">${m.emoji}</div>
          <div class="bt"><span class="bn">${m.nom}</span><p>${m.flat ? "À plat, on marche dessus. " : ""}${where}</p></div>
          <button class="btn primary" data-meuble="${t}" ${ok ? "" : "disabled"}>Poser</button></div>`;
      }).join("")).join(""));
});
/* Choisi dans le catalogue (voir main.js) : le meuble apparaît à la place libre la plus proche du milieu */
export function addMeuble(type){
  if(!deco || !allowedIn(type, deco.b.type)) return;
  const it = {id: deco.b.deco.next++, type, x: 0, z: 0, rot: 0};
  if(!findSpot(it)){ toast("Plus de place pour ce meuble dans la pièce"); return; }
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
  if(!sel) return;
  const list = items();
  list.splice(list.indexOf(sel), 1);
  removeItemMesh(sel.id);
  toast(`${MEUBLES[sel.type].emoji} Meuble rangé`);
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

function setMagnetButton(){ $("#deco-magnet").setAttribute("aria-pressed", String(magnet)); }
$("#deco-magnet").addEventListener("click", () => {
  magnet = !magnet;
  try{ localStorage.setItem(MAG_KEY, magnet ? "1" : "0"); }catch(_){}
  setMagnetButton();
  toast(magnet ? "Aimant allumé : les meubles s'alignent" : "Aimant éteint : placement libre");
});
$("#deco-done").addEventListener("click", finishDeco);
$("#btn-deco").addEventListener("click", startDeco);

/* ----- Le doigt : toucher un meuble le choisit, le faire glisser le déplace ----- */
const canvas = renderer.domElement, touches = new Set(), hit = new THREE.Vector3();
let drag = null;                     // {pid, ox, oz, last} : écart doigt-meuble et dernière place valable
function endDrag(){
  if(!drag) return;
  if(problem(sel)){ sel.x = drag.last.x; sel.z = drag.last.z; placeItemMesh(sel); }   // place refusée : il revient
  drag = null; showSel(); save();
}
canvas.addEventListener("pointerdown", e => {
  if(!deco) return;
  touches.add(e.pointerId);
  if(touches.size > 1){ endDrag(); return; }                        // deux doigts : c'est un zoom
  const id = pickItem(aim(e.clientX, e.clientY));
  const it = id !== null ? items().find(v => v.id === id) : null;
  sel = it || null;
  if(it && groundAt(e.clientX, e.clientY, hit)) drag = {pid: e.pointerId, ox: it.x - hit.x, oz: it.z - hit.z, last: {x: it.x, z: it.z}};
  showSel();
});
canvas.addEventListener("pointermove", e => {
  if(!deco || !drag || e.pointerId !== drag.pid || !groundAt(e.clientX, e.clientY, hit)) return;
  settle(sel, hit.x + drag.ox, hit.z + drag.oz);
  if(!problem(sel)) drag.last = {x: sel.x, z: sel.z};
  placeItemMesh(sel); showSel();
});
function fingerUp(e){
  touches.delete(e.pointerId);
  if(drag && e.pointerId === drag.pid) endDrag();
}
canvas.addEventListener("pointerup", fingerUp);
canvas.addEventListener("pointercancel", fingerUp);

/* Sur ordinateur : flèches pour déplacer le meuble choisi, R pour le tourner, Suppr pour le ranger */
const STEP = {ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0]};
window.addEventListener("keydown", e => {
  if(!deco || !sel || !$("#sheetWrap").hidden) return;
  if(STEP[e.code]){
    const s = magnet ? .5 : .1, before = {x: sel.x, z: sel.z};
    settle(sel, sel.x + STEP[e.code][0] * s, sel.z + STEP[e.code][1] * s);
    if(problem(sel)) Object.assign(sel, before);
    placeItemMesh(sel); showSel(); save();
    e.preventDefault();
  }
  else if(e.key === "r" || e.key === "R") $("#deco-rot").click();
  else if(e.key === "Delete" || e.key === "Backspace") $("#deco-store").click();
});
