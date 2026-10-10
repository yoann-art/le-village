/* ================= Construire =================
   Menu des bâtiments, pose et déplacement au doigt,
   fiche d'un bâtiment et amélioration.
   Les bâtiments restent alignés sur les cases (pas de 1 P). Une marque orange sur le fantôme montre la case devant
   la porte, qui doit rester libre. Tourner les bâtiments (v1.9.3) : retiré à la demande de Yo le 9 octobre 2026 (la
   vue reste la même, ça ne sert à rien) ; un bâtiment tourné pendant l'essai reprend sa porte en bas (voir plus bas). */
import { $ } from "./outils.js";
import { RES, B, ORDER, ATELIERS, FABRIQUE_A, COFFRE, traversable } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sizeOf, doorTile, roomSide, maxLvl, upCost, canAfford, pay, totalStars, costHTML, missingHTML, addOwned, slotsAdd, slotsPlace } from "./regles.js";
import { renderer, scene, ray, aim, groundAt } from "./monde/scene.js";
import { H, N, idx, inb, map, tileOf, setObj, setEtat } from "./monde/ile.js";
import { makeBuilding, occ, footprint, placeMesh, removeMesh, setMeshVisible, pickBuilding } from "./monde/batiments.js";
import { entrees } from "./monde/ponton.js";
import { player, R, dir4, frontTile } from "./monde/personnage.js";
import { resetJoy } from "./commandes.js";
import { renderHUD, toast, openSheet, closeSheet } from "./interface.js";
import { ligneEntree } from "./entreeMine.js";

/* ----- Pose d'un bâtiment : nouveau (menu Construire) ou déjà posé (appui long) ----- */
export let placing = null;           // type du bâtiment en cours de pose
let moving = null;                   // bâtiment déjà posé qu'on déplace
let ghost = null, ghostOk = false, ghostAt = null;
const gc = new THREE.Vector3();      // centre du fantôme, qui suit le doigt (avant alignement sur les cases)
const focus = new THREE.Vector3();   // point que regarde la caméra pendant la pose
const ghostMat = new THREE.MeshBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.6, depthWrite:false});
const porteMat = new THREE.MeshBasicMaterial({color:0xF0A040, transparent:true, opacity:.75, depthWrite:false});
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
const freeTile = (x, z) => inb(x,z) && map.type[idx(x,z)] !== "water" && traversable(map.obj[idx(x,z)]) && !occ.has(idx(x,z)) && !entrees.has(idx(x,z));   // le passage vers le ponton ou le pont reste libre
const clearHerbes = (type, ax, az, r) => [...footprint(type, ax, az), doorTile(type, ax, az, r)]
  .forEach(([x,z]) => { if(inb(x,z) && map.obj[idx(x,z)] && traversable(map.obj[idx(x,z)])) setObj(idx(x,z), null); });   // rien ne pousse devant la porte
function placeProblem(type, ax, az){
  const cells = footprint(type, ax, az);
  if(!cells.every(([x,z]) => freeTile(x, z))) return "occupé";
  const mine = new Set(cells.map(([x,z]) => idx(x,z))), p = player.position;
  if([[-R,-R],[R,-R],[-R,R],[R,R]].some(([dx,dz]) => mine.has(idx(tileOf(p.x + dx), tileOf(p.z + dz))))) return "perso";
  const [dx, dz] = doorTile(type, ax, az);
  if(!freeTile(dx, dz)) return "porte";
  if(state.buildings.some(b => { if(b === moving) return false; const [x,z] = doorTile(b.type, b.x, b.z, b.rot); return inb(x,z) && mine.has(idx(x,z)); })) return "porte";
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
  /* la case devant la porte, qui restera libre */
  const marque = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), porteMat);
  marque.rotation.x = -Math.PI/2; marque.position.set(Math.floor(s/2 + (B[type].door || 0)) + .5 - s/2, .03, s/2 + .5);
  ghost.add(marque);
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
  if(!b || B[b.type].fixe || placing || !outside()) return;           // la mine ne se déplace pas
  try{ if(navigator.vibrate) navigator.vibrate(30); }catch(_){}
  soulever(b);
  startDrag(pid);
}
/* Soulever un bâtiment posé pour le déplacer (aussi pour la vérification automatique) */
export function soulever(b){
  footprint(b.type, b.x, b.z).forEach(([x,z]) => occ.delete(idx(x,z)));
  setMeshVisible(b.id, false);
  startPlacing(b.type, b);
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
    b.x = ax; b.z = az; delete b.rot;                // déplacé, un bâtiment tourné pendant l'essai reprend sa porte en bas
    clearHerbes(b.type, ax, az);
    footprint(b.type, ax, az).forEach(([x,z]) => occ.set(idx(x,z), b.id));
    placeMesh(b);
    stopPlacing(); save();
    toast(`${B[b.type].emoji} ${B[b.type].nom} : nouvelle place`);
    return;
  }
  const type = placing, d = B[type];
  if(dejaBati(type)){ toast(`${d.emoji} ${d.nom} : déjà sur ton île, améliore-${MASC.has(type) ? "le" : "la"} depuis sa fiche`); stopPlacing(); return; }
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

/* Les bâtiments tournés pendant l'essai de la v1.9.3 reprennent leur porte en bas, si la case devant elle est libre
   (sinon, la prochaine fois qu'on les déplace) */
if(state.buildings.some(b => b.rot)){
  for(const b of state.buildings) if(b.rot){
    const [x, z] = doorTile(b.type, b.x, b.z);
    if(freeTile(x, z)){ delete b.rot; clearHerbes(b.type, b.x, b.z); placeMesh(b); }
  }
  save();
}

/* Un seul bâtiment de chaque sorte (demande de Yo, v1.10.2) : ensuite, on l'améliore depuis sa fiche, jusqu'au
   niveau 3. Avant, on pouvait en bâtir plusieurs, et leurs bonus s'additionnaient. */
const dejaBati = t => state.buildings.some(v => v.type === t);
const MASC = new Set(["marche", "chateau"]);      // pour accorder : « déjà bâti », « déjà bâtie »
/* Les doubles d'une partie déjà commencée sont démontés une fois (choix de Yo, v1.10.2). On garde le plus haut niveau
   (à égalité, celui qui a le plus de meubles, puis le plus ancien). Tout ce que les autres ont coûté revient dans le
   sac et les coffres : la construction et les améliorations, le plan de travail, les meubles, ce qu'ils fabriquaient
   (fini : l'objet ; pas fini : ses ingrédients). Ce qui ne rentre pas attend dans un coffre posé sur la place du
   village, comme les coffres qui étaient posés dans leur pièce. */
function caseLibre(){            // la case libre la plus proche du milieu de la place du village
  const c = (N - 1) / 2, portes = new Set(state.buildings.map(b => { const [x, z] = doorTile(b.type, b.x, b.z, b.rot); return idx(x, z); }));
  let best = -1, dist = Infinity;
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x, z), d = Math.hypot(x - c, z - c);
    if(d >= dist || !freeTile(x, z) || map.obj[i] || portes.has(i) || (state.sol && state.sol[i])
      || (x === tileOf(player.position.x) && z === tileOf(player.position.z))) continue;
    best = i; dist = d;
  }
  return best;
}
function demonterDoubles(){
  const rang = b => [b.lvl, ((b.deco && b.deco.items) || []).length, -b.id];
  const mieux = (a, b) => { const x = rang(a), y = rang(b); for(let i = 0; i < 3; i++) if(x[i] !== y[i]) return x[i] > y[i]; return false; };
  const garde = new Map();
  for(const b of state.buildings) if(!B[b.type].fixe && (!garde.has(b.type) || mieux(b, garde.get(b.type)))) garde.set(b.type, b);
  const partis = state.buildings.filter(b => !B[b.type].fixe && garde.get(b.type) !== b);
  if(!partis.length) return;
  const rendu = {}, plus = (k, n) => { if(n > 0) rendu[k] = (rendu[k] || 0) + n; }, ajoute = c => Object.entries(c).forEach(([k, v]) => plus(k, v));
  const aPoser = [], now = Date.now();
  for(const b of partis){
    const a = ATELIERS[b.type];
    ajoute(B[b.type].cost);
    for(let l = 1; l < b.lvl; l++) ajoute(upCost(b.type, l));
    for(const it of (b.deco && b.deco.items) || []){
      if(it.reserve){ const co = state.coffres.find(c => c.id === it.reserve); if(co) aPoser.push(co); }
      else if(a && it.type === a.meuble) ajoute(a.cost);
      else if(FABRIQUE_A[it.type]) plus(it.type, 1);
      if(it.pierre) plus(it.pierre, 1);                                  // la pierre exposée dans une vitrine (étape 1.11)
    }
    for(const j of (b.atelier && b.atelier.queue) || []){
      if(j.end && j.end <= now && !j.hasard) plus(j.out, j.n || 1);      // une géode pas encore ouverte : on la rend
      else ajoute(j.in || {});
    }
    footprint(b.type, b.x, b.z).forEach(([x, z]) => occ.delete(idx(x, z)));
    removeMesh(b.id);
    state.buildings.splice(state.buildings.indexOf(b), 1);
  }
  /* dans le sac et les coffres ; le reste dans de nouveaux coffres */
  const nouveaux = [];
  let id = Math.max(state.coffreId || 0, ...state.coffres.map(c => c.id));
  for(const [k, n] of Object.entries(rendu)){
    let left = addOwned(k, n).reste || 0;
    while(left > 0){
      let co = nouveaux[nouveaux.length - 1];
      if(!co || !slotsPlace(co.items, COFFRE.places, k)){ co = {id: ++id, items: []}; nouveaux.push(co); state.coffres.push(co); }
      left -= slotsAdd(co.items, COFFRE.places, k, left);
    }
  }
  state.coffreId = id;
  for(const co of [...aPoser, ...nouveaux]){
    const i = caseLibre();
    if(i < 0) break;                     // l'île pleine : il reste rangé (sans place), on ne perd rien
    delete co.b; co.i = i;
    setObj(i, "coffre"); setEtat(i, {id: co.id});
  }
  state.coffres.sort((a, b) => a.id - b.id);
  save();
  const n = {};
  partis.forEach(b => { n[b.type] = (n[b.type] || 0) + 1; });
  const liste = Object.entries(n).map(([t, k]) => `${B[t].emoji} ${B[t].nom}${k > 1 ? ` × ${k}` : ""}`).join(", ");
  setTimeout(() => openSheet(`<div class="crown"><div class="intro-emoji">🔨</div><h2 class="display">Un seul bâtiment de chaque sorte</h2>
    <p>Désormais, on bâtit chaque bâtiment une seule fois, puis on l'améliore depuis sa fiche, jusqu'au niveau 3.</p>
    <p>Démonté${partis.length > 1 ? "s" : ""}, car en double : ${liste}. Tu as gardé le plus avancé de chaque sorte.</p>
    <p>Tout ce qu'${partis.length > 1 ? "ils avaient" : "il avait"} coûté, ${partis.length > 1 ? "leurs" : "ses"} meubles et ce qu'${partis.length > 1 ? "ils" : "il"} fabriquai${partis.length > 1 ? "ent" : "t"} sont dans ton sac et tes coffres.</p>
    ${aPoser.length ? `<p>🗃️ Le coffre qui était dans ${partis.length > 1 ? "leur" : "sa"} pièce est maintenant sur la place du village.</p>` : ""}
    ${nouveaux.length ? `<p>🗃️ Ce qui ne rentrait pas t'attend dans un coffre, sur la place du village.</p>` : ""}
    <button class="btn primary" data-close>D'accord</button></div>`), 900);
}
demonterDoubles();

/* Menu « Construire » */
$("#btn-build").addEventListener("click", () => {
  openSheet(`<div class="sh-head"><h2 class="display">Que veux-tu bâtir ?</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Tu choisis : le bâtiment apparaît devant toi, fais-le glisser du doigt. Un seul de chaque sorte : ensuite, améliore-le depuis sa fiche (niveaux 2 et 3). Pour déplacer un bâtiment déjà posé, garde le doigt appuyé dessus.</p>` +
    ORDER.map((t, k) => (k === 1 ? ligneEntree() : "") + (() => {
      const b = B[t], built = dejaBati(t), ok = !built && canAfford(b.cost);
      return `<div class="brow"><div class="be" aria-hidden="true">${b.emoji}</div>
        <div class="bt"><span class="bn">${b.nom}</span><span class="st">★ ${b.stars}</span><p>${b.desc}</p><div>${costHTML(b.cost)}</div>
          ${built || ok ? "" : `<p class="manque">${missingHTML(b.cost)}</p>`}</div>
        <button class="btn primary" data-pick="${t}" ${ok ? "" : "disabled"}>${built ? `Déjà bâti${MASC.has(t) ? "" : "e"}` : "Choisir"}</button></div>`;
    })()).join(""));
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
  if(d.fixe){                                          // la mine : rien à améliorer
    openSheet(`<div class="sh-head"><h2 class="display">${d.emoji} ${d.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
      <p class="muted" style="margin:4px 0">${d.desc} Entre en marchant dans l'ouverture.</p>`);
    return;
  }
  let effect = "Rapporte des étoiles au village.";
  if(d.bonus) effect = `Bonus actuel : +${d.bonus.pct * b.lvl} % de ${RES[d.bonus.res].nom}.`;
  if(d.all) effect = `Bonus actuel : +${d.all * b.lvl} % sur toutes les récoltes.`;
  let up = `<p class="muted" style="margin-top:12px">Niveau maximum atteint.</p>`;
  if(b.lvl < max){
    const c = upCost(b.type, b.lvl);
    const next = roomSide(b.type, b.lvl + 1);
    up = `<div class="upbox"><div><p>Passer au niveau ${b.lvl + 1} : nouvelle allure, pièce de ${next} × ${next} P</p><div>${costHTML(c)}</div>${canAfford(c) ? "" : `<p class="manque">${missingHTML(c)}</p>`}</div>
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
