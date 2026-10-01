/* ================= Construire =================
   Menu des bâtiments, pose et déplacement au doigt,
   fiche d'un bâtiment et amélioration.
   Les bâtiments restent alignés sur les cases (pas de 1 P). */
import { $ } from "./outils.js";
import { RES, B, ORDER } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sizeOf, doorTile, roomSide, maxLvl, upCost, canAfford, pay, totalStars, costHTML, missingHTML } from "./regles.js";
import { renderer, scene, ray, aim, groundAt } from "./monde/scene.js";
import { H, idx, inb, map, tileOf, setObj } from "./monde/ile.js";
import { makeBuilding, occ, footprint, placeMesh, setMeshVisible, pickBuilding } from "./monde/batiments.js";
import { player, R, dir4, frontTile } from "./monde/personnage.js";
import { resetJoy } from "./commandes.js";
import { renderHUD, toast, openSheet, closeSheet } from "./interface.js";

/* ----- Pose d'un bâtiment : nouveau (menu Construire) ou déjà posé (appui long) ----- */
export let placing = null;           // type du bâtiment en cours de pose
let moving = null;                   // bâtiment déjà posé qu'on déplace
let ghost = null, ghostOk = false, ghostAt = null;
const gc = new THREE.Vector3();      // centre du fantôme, qui suit le doigt (avant alignement sur les cases)
const focus = new THREE.Vector3();   // point que regarde la caméra pendant la pose
const ghostMat = new THREE.MeshBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.6, depthWrite:false});
const baseMat = new THREE.MeshBasicMaterial({color:0xFFE27A, transparent:true, opacity:.55, depthWrite:false});
/* Le carré de cases du bâtiment commence juste devant le personnage, centré sur lui */
function anchorFor(type){
  const s = sizeOf(type), d = dir4(), [fx, fz] = frontTile(1.3);
  const ax = d.x > 0 ? fx : d.x < 0 ? fx - (s - 1) : Math.round(player.position.x + H - s/2);
  const az = d.z > 0 ? fz : d.z < 0 ? fz - (s - 1) : Math.round(player.position.z + H - s/2);
  return [ax, az];
}
/* Peut-on poser ici ? null si oui ; sinon « occupé » (terrain déjà pris), « perso » (le personnage
   est dessous) ou « porte » (sa porte serait bloquée, ou il bloquerait celle d'un autre bâtiment) */
/* Une case libre pour bâtir : terre ferme, rien dessus (les herbes hautes, elles, s'en vont sous le bâtiment) */
const freeTile = (x, z) => inb(x,z) && map.type[idx(x,z)] !== "water" && (!map.obj[idx(x,z)] || map.obj[idx(x,z)] === "herbe") && !occ.has(idx(x,z));
const clearHerbes = (type, ax, az) => [...footprint(type, ax, az), doorTile(type, ax, az)]
  .forEach(([x,z]) => { if(inb(x,z) && map.obj[idx(x,z)] === "herbe") setObj(idx(x,z), null); });   // rien ne pousse devant la porte
function placeProblem(type, ax, az){
  const cells = footprint(type, ax, az);
  if(!cells.every(([x,z]) => freeTile(x, z))) return "occupé";
  const mine = new Set(cells.map(([x,z]) => idx(x,z))), p = player.position;
  if([[-R,-R],[R,-R],[-R,R],[R,R]].some(([dx,dz]) => mine.has(idx(tileOf(p.x + dx), tileOf(p.z + dz))))) return "perso";
  const [dx, dz] = doorTile(type, ax, az);
  if(!freeTile(dx, dz)) return "porte";
  if(state.buildings.some(b => { if(b === moving) return false; const [x,z] = doorTile(b.type, b.x, b.z); return inb(x,z) && mine.has(idx(x,z)); })) return "porte";
  return null;
}
export function startPlacing(type, b = null){
  placing = type; moving = b;
  ghost = makeBuilding(type, b ? b.lvl : 1);
  ghost.traverse(o => { if(o.isMesh){ o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; } });
  const s = sizeOf(type);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(s, s), baseMat);
  base.rotation.x = -Math.PI/2; base.position.y = .02;
  ghost.add(base);
  scene.add(ghost);
  const [ax, az] = b ? [b.x, b.z] : anchorFor(type);
  gc.set(ax - H + s/2, 0, az - H + s/2);
  focus.copy(player.position);
  resetJoy();
  $("#actions").hidden = true; $("#place-actions").hidden = false; $("#place-hint").hidden = false; $("#joy").hidden = true;
}
export function stopPlacing(){
  if(ghost) scene.remove(ghost);
  if(moving){                        // annulé : le bâtiment reprend sa place
    footprint(moving.type, moving.x, moving.z).forEach(([x,z]) => occ.set(idx(x,z), moving.id));
    setMeshVisible(moving.id, true);
  }
  placing = null; moving = null; ghost = null; drag = null;
  $("#actions").hidden = false; $("#place-actions").hidden = true; $("#place-hint").hidden = true; $("#joy").hidden = false;
}
/* Pendant la pose, la caméra regarde ce point (il avance quand le doigt approche du bord de l'écran) */
export const placementFocus = () => placing ? focus : null;

/* ----- Le doigt sur l'île ----- */
const canvas = renderer.domElement, touches = new Map(), hit = new THREE.Vector3();
let drag = null;                     // doigt qui fait glisser le fantôme : {id, p0, g0}
let press = null;                    // appui long en cours sur un bâtiment posé : {id, pid, sx, sy, timer}
const outside = () => player.parent === scene;   // dedans, le personnage est dans la scène de la pièce
function startDrag(pid){
  const t = touches.get(pid);
  if(t && groundAt(t.x, t.y, hit)) drag = {id: pid, p0: hit.clone(), g0: gc.clone()};
}
function cancelPress(){ if(press){ clearTimeout(press.timer); press = null; } }
function liftBuilding(){
  const b = state.buildings.find(v => v.id === press.id), pid = press.pid;
  press = null;
  if(!b || placing || !outside()) return;
  try{ if(navigator.vibrate) navigator.vibrate(30); }catch(_){}
  footprint(b.type, b.x, b.z).forEach(([x,z]) => occ.delete(idx(x,z)));
  setMeshVisible(b.id, false);
  startPlacing(b.type, b);
  startDrag(pid);
}
canvas.addEventListener("pointerdown", e => {
  touches.set(e.pointerId, {x: e.clientX, y: e.clientY});
  try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
  if(touches.size > 1){ cancelPress(); drag = null; return; }       // deux doigts : c'est un zoom
  if(!outside()) return;
  if(placing){ startDrag(e.pointerId); return; }
  aim(e.clientX, e.clientY);
  const id = pickBuilding(ray);
  if(id !== null) press = {id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, timer: setTimeout(liftBuilding, 500)};
});
canvas.addEventListener("pointermove", e => {
  const t = touches.get(e.pointerId);
  if(!t) return;
  t.x = e.clientX; t.y = e.clientY;
  if(press && e.pointerId === press.pid && Math.hypot(t.x - press.sx, t.y - press.sy) > 12) cancelPress();
});
function fingerUp(e){
  touches.delete(e.pointerId);
  if(press && e.pointerId === press.pid) cancelPress();
  if(drag && e.pointerId === drag.id) drag = null;
}
canvas.addEventListener("pointerup", fingerUp);
canvas.addEventListener("pointercancel", fingerUp);
/* Sur ordinateur : les flèches déplacent le fantôme d'une case */
const NUDGE = {ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0]};
window.addEventListener("keydown", e => { if(placing && NUDGE[e.code]){ gc.x += NUDGE[e.code][0]; gc.z += NUDGE[e.code][1]; } });

/* À chaque image : fantôme du bâtiment à poser, ou bouton du bâtiment devant soi */
const EDGE = 56, SCROLL = 6;          // bord de l'écran (en pixels) et vitesse de défilement (P par seconde)
export function updateInteraction(dt){
  if(placing){
    const t = drag && touches.get(drag.id);
    if(t){
      if(groundAt(t.x, t.y, hit)) gc.set(drag.g0.x + hit.x - drag.p0.x, 0, drag.g0.z + hit.z - drag.p0.z);
      const r = canvas.getBoundingClientRect();
      const ex = t.x < r.left + EDGE ? -1 : t.x > r.right - EDGE ? 1 : 0;
      const ez = t.y < r.top + EDGE ? -1 : t.y > r.bottom - EDGE ? 1 : 0;
      focus.x = Math.max(-H, Math.min(H, focus.x + ex * SCROLL * dt));
      focus.z = Math.max(-H, Math.min(H, focus.z + ez * SCROLL * dt));
    }
    const s = sizeOf(placing);
    gc.x = Math.max(-H + s/2, Math.min(H - s/2, gc.x)); gc.z = Math.max(-H + s/2, Math.min(H - s/2, gc.z));
    const ax = Math.round(gc.x + H - s/2), az = Math.round(gc.z + H - s/2);
    const problem = placeProblem(placing, ax, az);
    ghostOk = !problem; ghostAt = [ax, az];
    ghost.position.set(ax - H + s/2, 0, az - H + s/2);
    ghostMat.color.setHex(ghostOk ? 0xFFFFFF : 0xE4776C); baseMat.color.setHex(ghostOk ? 0xFFE27A : 0xE4776C);
    const hint = $("#place-hint"), btn = $("#btn-place");
    const txt = ghostOk ? `${B[placing].emoji} ${B[placing].nom} : place libre`
      : problem === "porte" ? `${B[placing].emoji} Une porte serait bloquée, décale-le`
      : problem === "perso" ? `${B[placing].emoji} Tu es dessous, décale-le`
      : `${B[placing].emoji} Terrain occupé, décale-le`;
    if(hint.textContent !== txt){ hint.textContent = txt; hint.classList.toggle("bad", !ghostOk); }
    btn.disabled = !ghostOk;
    return;
  }
  let id = null;
  for(const dist of [.8, 1.3]){
    const [x,z] = frontTile(dist);
    if(inb(x,z) && occ.has(idx(x,z))){ id = occ.get(idx(x,z)); break; }
  }
  const ctx = $("#btn-ctx");
  if(id === null){ if(!ctx.hidden) ctx.hidden = true; ctx.dataset.id = ""; return; }
  if(ctx.dataset.id !== String(id) || ctx.hidden){
    const b = state.buildings.find(v => v.id === id);
    ctx.textContent = `${B[b.type].emoji} ${B[b.type].nom}`;
    ctx.dataset.id = String(id); ctx.hidden = false;
  }
}
$("#btn-cancel").addEventListener("click", stopPlacing);
$("#btn-place").addEventListener("click", () => {
  if(!placing || !ghostOk) return;
  const [ax, az] = ghostAt;
  if(moving){                        // bâtiment déplacé : gratuit, il garde tout (niveau, intérieur)
    const b = moving;
    moving = null;
    b.x = ax; b.z = az;
    clearHerbes(b.type, ax, az);
    footprint(b.type, ax, az).forEach(([x,z]) => occ.set(idx(x,z), b.id));
    placeMesh(b);
    stopPlacing(); save();
    toast(`${B[b.type].emoji} ${B[b.type].nom} : nouvelle place`);
    return;
  }
  const type = placing, d = B[type];
  if(!canAfford(d.cost)){ toast("Ressources insuffisantes"); stopPlacing(); return; }
  pay(d.cost);
  const b = {id:state.nextId++, type, lvl:1, x:ax, z:az};
  state.buildings.push(b);
  clearHerbes(type, ax, az);
  footprint(type, ax, az).forEach(([x,z]) => occ.set(idx(x,z), b.id));
  placeMesh(b);
  stopPlacing(); save(); renderHUD();
  toast(`${d.nom} construit`);
  if(type === "chateau" && !state.crowned){
    state.crowned = true; save(); renderHUD();
    setTimeout(() => openSheet(`<div class="crown"><div class="intro-emoji">🏰</div><h2 class="display">Ton village est couronné</h2>
      <p>${totalStars()} ★ au compteur. Continue d'améliorer tes bâtiments pour gagner encore des étoiles.</p>
      <button class="btn primary" data-close>Admirer mon île</button></div>`), 600);
  }
});

/* Menu « Construire » */
$("#btn-build").addEventListener("click", () => {
  openSheet(`<div class="sh-head"><h2 class="display">Que veux-tu bâtir ?</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Tu choisis : le bâtiment apparaît devant toi, fais-le glisser du doigt. Pour déplacer un bâtiment déjà posé, garde le doigt appuyé dessus.</p>` +
    ORDER.map(t => {
      const b = B[t], built = b.unique && state.buildings.some(v => v.type === t), ok = !built && canAfford(b.cost);
      return `<div class="brow"><div class="be" aria-hidden="true">${b.emoji}</div>
        <div class="bt"><span class="bn">${b.nom}</span><span class="st">★ ${b.stars}</span><p>${b.desc}</p><div>${costHTML(b.cost)}</div>
          ${built || ok ? "" : `<p class="manque">${missingHTML(b.cost)}</p>`}</div>
        <button class="btn primary" data-pick="${t}" ${ok ? "" : "disabled"}>${built ? "Déjà bâti" : "Choisir"}</button></div>`;
    }).join(""));
});

/* Fiche du bâtiment devant soi */
$("#btn-ctx").addEventListener("click", () => {
  const id = +$("#btn-ctx").dataset.id;
  const b = state.buildings.find(v => v.id === id);
  if(b) openDetail(b);
});
let detailId = null;
function openDetail(b){
  detailId = b.id;
  const d = B[b.type], max = maxLvl(b.type);
  let effect = "Rapporte des étoiles au village.";
  if(d.bonus) effect = `Bonus actuel : +${d.bonus.pct * b.lvl} % de ${RES[d.bonus.res].nom}.`;
  if(d.all) effect = `Bonus actuel : +${d.all * b.lvl} % sur toutes les récoltes.`;
  let up = `<p class="muted" style="margin-top:12px">Niveau maximum atteint.</p>`;
  if(b.lvl < max){
    const c = upCost(b.type, b.lvl);
    const next = roomSide(b.type, b.lvl + 1);
    up = `<div class="upbox"><div><p>Passer au niveau ${b.lvl + 1} : pièce de ${next} × ${next} P</p><div>${costHTML(c)}</div>${canAfford(c) ? "" : `<p class="manque">${missingHTML(c)}</p>`}</div>
      <button class="btn primary" data-up ${canAfford(c) ? "" : "disabled"}>Améliorer</button></div>`;
  }
  openSheet(`<div class="sh-head"><h2 class="display">${d.emoji} ${d.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p style="margin:4px 0">Niveau ${b.lvl} sur ${max}, ${d.stars * b.lvl} ★ pour ton village.</p>
    <p class="muted" style="margin:0">${effect}</p>
    <p class="muted" style="margin:0">Intérieur : pièce de ${roomSide(b.type, b.lvl)} × ${roomSide(b.type, b.lvl)} P.</p>${up}`);
}
/* Bouton « Améliorer » de la fiche */
export function upgradeDetail(){
  const b = state.buildings.find(v => v.id === detailId);
  if(!b || b.lvl >= maxLvl(b.type)) return;
  const c = upCost(b.type, b.lvl);
  if(!canAfford(c)) return;
  pay(c); b.lvl++; placeMesh(b); save(); renderHUD(); closeSheet();
  toast(`${B[b.type].nom} amélioré au niveau ${b.lvl}`);
}
