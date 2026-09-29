/* ================= Construire =================
   Menu des bâtiments, placement devant le personnage,
   fiche d'un bâtiment et amélioration. */
import { $ } from "./outils.js";
import { RES, B, ORDER } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sizeOf, doorTile, roomSide, maxLvl, upCost, canAfford, pay, totalStars, costHTML } from "./regles.js";
import { scene } from "./monde/scene.js";
import { H, idx, inb, map } from "./monde/ile.js";
import { makeBuilding, occ, footprint, placeMesh } from "./monde/batiments.js";
import { player, dir4, frontTile } from "./monde/personnage.js";
import { renderHUD, toast, openSheet, closeSheet } from "./interface.js";

/* Placement */
export let placing = null;
let ghost = null, ghostOk = false, ghostAt = null;
const ghostMat = new THREE.MeshBasicMaterial({color:0xFFFFFF, transparent:true, opacity:.6, depthWrite:false});
const baseMat = new THREE.MeshBasicMaterial({color:0xFFE27A, transparent:true, opacity:.55, depthWrite:false});
/* Le carré de cases du bâtiment commence juste devant le personnage, centré sur lui */
function anchorFor(type){
  const s = sizeOf(type), d = dir4(), [fx, fz] = frontTile(1.3);
  const ax = d.x > 0 ? fx : d.x < 0 ? fx - (s - 1) : Math.round(player.position.x + H - s/2);
  const az = d.z > 0 ? fz : d.z < 0 ? fz - (s - 1) : Math.round(player.position.z + H - s/2);
  return [ax, az];
}
/* Peut-on poser ici ? null si oui ; sinon « occupé » (terrain déjà pris)
   ou « porte » (sa porte serait bloquée, ou il bloquerait celle d'un autre bâtiment) */
const freeTile = (x, z) => inb(x,z) && map.type[idx(x,z)] !== "water" && !map.obj[idx(x,z)] && !occ.has(idx(x,z));
function placeProblem(type, ax, az){
  const cells = footprint(type, ax, az);
  if(!cells.every(([x,z]) => freeTile(x, z))) return "occupé";
  const [dx, dz] = doorTile(type, ax, az);
  if(!freeTile(dx, dz)) return "porte";
  const mine = new Set(cells.map(([x,z]) => idx(x,z)));
  if(state.buildings.some(b => { const [x,z] = doorTile(b.type, b.x, b.z); return inb(x,z) && mine.has(idx(x,z)); })) return "porte";
  return null;
}
export function startPlacing(type){
  placing = type;
  ghost = makeBuilding(type, 1);
  ghost.traverse(o => { if(o.isMesh){ o.material = ghostMat; o.castShadow = false; o.receiveShadow = false; } });
  const s = sizeOf(type);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(s, s), baseMat);
  base.rotation.x = -Math.PI/2; base.position.y = .02;
  ghost.add(base);
  scene.add(ghost);
  $("#actions").hidden = true; $("#place-actions").hidden = false; $("#place-hint").hidden = false;
}
export function stopPlacing(){
  if(ghost) scene.remove(ghost);
  placing = null; ghost = null;
  $("#actions").hidden = false; $("#place-actions").hidden = true; $("#place-hint").hidden = true;
}
/* À chaque image : fantôme du bâtiment à poser, ou bouton du bâtiment devant soi */
export function updateInteraction(){
  if(placing){
    const [ax, az] = anchorFor(placing), s = sizeOf(placing);
    const problem = placeProblem(placing, ax, az);
    ghostOk = !problem; ghostAt = [ax, az];
    ghost.position.set(ax - H + s/2, 0, az - H + s/2);
    ghostMat.color.setHex(ghostOk ? 0xFFFFFF : 0xE4776C); baseMat.color.setHex(ghostOk ? 0xFFE27A : 0xE4776C);
    const hint = $("#place-hint"), btn = $("#btn-place");
    const txt = ghostOk ? `${B[placing].emoji} ${B[placing].nom} : place libre`
      : problem === "porte" ? `${B[placing].emoji} Une porte serait bloquée, décale-toi`
      : `${B[placing].emoji} Terrain occupé, avance ailleurs`;
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
  const type = placing, d = B[type];
  if(!canAfford(d.cost)){ toast("Ressources insuffisantes"); stopPlacing(); return; }
  const [ax, az] = ghostAt;
  pay(d.cost);
  const b = {id:state.nextId++, type, lvl:1, x:ax, z:az};
  state.buildings.push(b);
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
    <p class="muted" style="margin:0 0 6px">Tu choisis, puis tu te places : le bâtiment se pose devant toi.</p>` +
    ORDER.map(t => {
      const b = B[t], built = b.unique && state.buildings.some(v => v.type === t), ok = !built && canAfford(b.cost);
      return `<div class="brow"><div class="be" aria-hidden="true">${b.emoji}</div>
        <div class="bt"><span class="bn">${b.nom}</span><span class="st">★ ${b.stars}</span><p>${b.desc}</p><div>${costHTML(b.cost)}</div></div>
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
    up = `<div class="upbox"><div><p>Passer au niveau ${b.lvl + 1} : pièce de ${next} × ${next} P</p><div>${costHTML(c)}</div></div>
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
