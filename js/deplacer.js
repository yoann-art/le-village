/* ================= Déplacer une lumière dehors (demande de Yo, 12 octobre 2026) =================
   Comme les meubles dans les pièces : sur l'île, un appui long (½ s) sur une lumière posée (torchère, chandelle,
   lanterne, brasero, feu de camp, lampadaire, bocal à lucioles) la soulève ; elle suit le doigt case par case (la case
   en jaune si elle peut s'y poser, en rouge sinon : mêmes règles que pour la poser, poseProblem) et se pose quand on
   lève le doigt (mauvaise place : elle revient). Une lumière accrochée à une façade (torchère ou lanterne murale)
   glisse le long de la façade de devant de son bâtiment, jamais devant la porte. Le personnage attend pendant ce temps. */
import { $ } from "./outils.js";
import { MEUBLES, teintesDe, departDe, objet } from "./donnees.js";
import { owned, addOwned } from "./regles.js";
import { openSheet, closeSheet } from "./interface.js";
import { teintesHTML } from "./decorer.js";
import { reprendreLumiere, decrocher } from "./recolte.js";
import { state, save } from "./sauvegarde.js";
import { sizeOf } from "./regles.js";
import { renderer, ray, aim, groundAt, scene } from "./monde/scene.js";
import { map, idx, inb, N, tileOf, centerOf, setObj, setEtat, objMesh, voisinsCloture } from "./monde/ile.js";
import { placeMesh, lumieresFacades, colPorte, placeFacade } from "./monde/batiments.js";
import { poseProblem } from "./coffres.js";
import { resetJoy } from "./commandes.js";
import { wrap, toast } from "./interface.js";
import { currentPlace, isBusy } from "./lieux.js";
import { premiereActive } from "./vue.js";
import { jouer } from "./sons.js";

const canvas = renderer.domElement;
let press = null;          // appui en cours sur une lumière : {cible, pid, x, y, sx, sy, timer}
let lift = null;           // la lumière soulevée : {i, type, dest} sur une case, ou {b, f, col} sur une façade ; et mesh, pid, x, y, ok
let modif = null;          // l'objet choisi, comme dans les pièces (Yo, 13 novembre 2026) : {i} sur une case, ou {b, f} sur une façade
export const deplaceEnCours = () => !!lift || !!modif;
export const modifDehors = () => modif;
const lumiereEn = i => { const o = map.obj[i]; return o && MEUBLES[o] && MEUBLES[o].dehors ? o : null; };
/* Ce que touche le doigt : une lumière posée ({i}) ou accrochée à une façade ({b, f, mesh}), ou null */
export function lumiereSousDoigt(r){
  let best = null, dist = Infinity;
  for(let i = 0; i < map.obj.length; i++){
    if(!lumiereEn(i)) continue;
    const m = objMesh(i), h = m && r.intersectObject(m, true)[0];
    if(h && h.distance < dist){ dist = h.distance; best = {i}; }
  }
  for(const {b, f, mesh} of lumieresFacades()){
    const h = r.intersectObject(mesh, true)[0];
    if(h && h.distance < dist){ dist = h.distance; best = {b, f, mesh}; }
  }
  return best;
}

/* La case visée, en jaune ou en rouge */
const fond = new THREE.MeshBasicMaterial({color: 0xFFE27A, transparent: true, opacity: .6, depthWrite: false});
const marque = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), fond);
marque.rotation.x = -Math.PI / 2; marque.visible = false; scene.add(marque);
const hit = new THREE.Vector3();
function hint(text, bad){
  const h = $("#place-hint");
  h.hidden = false; h.textContent = text; h.classList.toggle("bad", !!bad);
}
const nomDe = type => { const m = MEUBLES[type]; return `${m.emoji} ${m.nom}`; };
const laLe = type => MEUBLES[type].une ? "la" : "le";

function soulever(){
  const p = press; press = null;
  if(!p || lift || currentPlace() || isBusy() || !wrap.hidden || $("#joy").hidden) return;
  try{ if(navigator.vibrate) navigator.vibrate(30); }catch(_){}
  const c = p.cible;
  lift = c.b ? {b: c.b, f: c.f, mesh: c.mesh, type: c.f.type, col: c.f.col} : {i: c.i, type: map.obj[c.i], dest: c.i, mesh: objMesh(c.i)};
  Object.assign(lift, {pid: p.pid, x: p.x, y: p.y, ok: true});
  choisir(c.b ? {b: c.b, f: c.f} : {i: c.i});
  suivre();
}
/* ----- Un objet choisi dehors, comme dans les pièces (Yo, 13 novembre 2026 : « On clique dessus et on peut faire une rotation
   ou changer de couleur ») : un appui long le choisit, la barre Tourner, Couleur, Ranger, ✅ Poser apparaît ; le doigt peut le
   faire glisser de case en case (ou le long de sa façade) ; « Ranger » le remet dans le sac, avec ce qui est posé dessus ----- */
export function choisir(c){
  modif = c; jouer("meuble");
  resetJoy();
  $("#actions").hidden = true; $("#joy").hidden = true; $("#dehors-bar").hidden = false;
  montrerChoix();
}
const typeChoisi = () => modif && (modif.b ? modif.f.type : map.obj[modif.i]);
function montrerChoix(){
  if(!modif || lift) return;
  const t = typeChoisi();
  if(!t){ finir(); return; }
  $("#dehors-rot").hidden = !!modif.b;                                 // une lumière de façade ne se tourne pas
  $("#dehors-color").hidden = !teintesDe(t).length;
  if(modif.b){ const s = sizeOf(modif.b.type); marque.position.set(centerOf(modif.b.x + modif.f.col), .03, centerOf(modif.b.z + s)); }
  else marque.position.set(centerOf(modif.i % N), .03, centerOf(Math.floor(modif.i / N)));
  fond.color.setHex(0xFFE27A); marque.visible = true;
  hint(`${nomDe(t)} : glisse-${laLe(t)} du doigt, ou choisis ci-dessous`);
}
export function finir(){
  modif = null; marque.visible = false;
  $("#dehors-bar").hidden = true; $("#place-hint").hidden = true; $("#place-hint").classList.remove("bad");
  $("#actions").hidden = false; $("#joy").hidden = false;
  if(document.getElementById("dehors-teintes")) closeSheet();
}
export function tournerChoix(){
  if(!modif || modif.b) return;
  const i = modif.i, t = map.obj[i], e = state.ile[i] || {};
  if(["cloture", "muret", "portail", "panneau"].includes(t)) tourner(i);
  else { setEtat(i, {rot: ((e.rot || 0) + 1) % 4 || undefined}); jouer("meuble"); save(); }
}
export function rangerChoix(){
  if(!modif) return;
  const c = modif;
  if(c.b) decrocher({b: c.b, f: c.f}); else reprendreLumiere({i: c.i, o: map.obj[c.i]});
  if(c.b ? !(c.b.facade || []).includes(c.f) : !map.obj[c.i]) finir();   // le sac plein : il reste là (recolte.js le dit)
}
/* Teindre l'objet choisi : comme les meubles, une de la ressource de la teinte (rien si c'est déjà la sienne) */
export function teindreChoix(k){
  if(!modif) return "";
  const t = typeChoisi(), e = modif.b ? modif.f : (state.ile[modif.i] || {}), te = teintesDe(t).find(x => x.k === k);
  if(!te) return "Cette couleur ne va pas à cet objet";
  if(k === (e.color || (departDe(t) || {}).k)) return "";
  if(owned(k) < 1){ const o = objet(k); return `Il te faut 1 ${(o.nom || k).toLowerCase()} pour cette couleur${o.aide ? ". " + o.aide : ""}`; }
  addOwned(k, -1);
  if(modif.b){ modif.f.color = k; placeMesh(modif.b); } else setEtat(modif.i, {color: k});
  jouer("peindre"); save();
  return "";
}
const choixHTML = () => { const e = modif.b ? modif.f : (state.ile[modif.i] || {}); return teintesHTML({type: typeChoisi(), color: e.color}); };
$("#dehors-rot").addEventListener("click", tournerChoix);
$("#dehors-store").addEventListener("click", rangerChoix);
$("#dehors-ok").addEventListener("click", finir);
$("#dehors-color").addEventListener("click", () => {
  if(!modif) return;
  const m = MEUBLES[typeChoisi()];
  openSheet(`<div class="sh-head"><h2 class="display">🎨 ${m.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Chaque couleur vient d'une ressource : en changer en coûte une.</p><div id="dehors-teintes">${choixHTML()}</div>`);
});
wrap.addEventListener("click", e => {
  const te = e.target.closest("[data-teinte]"), box = document.getElementById("dehors-teintes");
  if(!te || !modif || !box) return;
  const msg = teindreChoix(te.dataset.teinte);
  if(msg) toast(`🎨 ${msg}`, 3200);
  box.innerHTML = choixHTML();
});
/* La lumière suit le doigt : sur une case libre de l'île, ou le long de la façade de son bâtiment */
function suivre(){
  if(!lift || !groundAt(lift.x, lift.y, hit)) return;
  if(lift.b){
    const b = lift.b, s = sizeOf(b.type), col = Math.max(0, Math.min(s - 1, tileOf(hit.x) - b.x));
    lift.col = col;
    lift.ok = col === lift.f.col || col !== colPorte(b.type, b.lvl) && !(b.facade || []).some(v => v !== lift.f && v.col === col);
    lift.mesh.position.x = placeFacade(b.type, col, b.lvl).x;
    marque.position.set(centerOf(b.x + col), .03, centerOf(b.z + s));
    hint(lift.ok ? `${nomDe(lift.type)} : glisse-${laLe(lift.type)} le long de la façade, puis lève le doigt`
      : col === colPorte(b.type, b.lvl) ? "Pas devant la porte" : "Il y a déjà une lumière ici", !lift.ok);
  } else {
    const tx = tileOf(hit.x), tz = tileOf(hit.z);
    if(!inb(tx, tz)) return;
    const dest = idx(tx, tz), why = dest === lift.i ? null : poseProblem(dest);
    lift.dest = dest; lift.ok = !why;
    lift.mesh.position.set(centerOf(tx), .15, centerOf(tz));
    marque.position.set(centerOf(tx), .03, centerOf(tz));
    hint(why || `${nomDe(lift.type)} : glisse ton doigt, puis lève-le pour ${laLe(lift.type)} poser`, !!why);
  }
  fond.color.setHex(lift.ok ? 0xFFE27A : 0xE4776C);
  marque.visible = true;
}
/* Le doigt se lève : la lumière se pose là (sa torche la suit), ou revient à sa place */
function lacher(){
  const L = lift; lift = null;
  if(L.b){
    if(L.ok) L.f.col = L.col;
    placeMesh(L.b);                                   // refait le bâtiment et sa façade (à la nouvelle place, ou à l'ancienne)
  } else if(L.ok && L.dest !== L.i){
    const etat = state.ile[L.i] || {};
    setObj(L.i, null); setObj(L.dest, L.type);
    if(etat.torche || etat.bougie || etat.lucioles || etat.feu || etat.reste || etat.eteint || etat.rot || etat.tour || etat.ouvert || etat.texte || etat.color) setEtat(L.dest, {texte: etat.texte, torche: etat.torche, bougie: etat.bougie, chandelles: etat.chandelles, lucioles: etat.lucioles, feu: etat.feu, reste: etat.reste, eteint: etat.eteint, rot: etat.rot, tour: etat.tour, ouvert: etat.ouvert, color: etat.color});   // sa couleur aussi
    if(modif && !modif.b) modif.i = L.dest;   // la clôture, le muret gardent leur sens   // ses bûches qui brûlent aussi   // sa torche, sa chandelle, ses lucioles la suivent
  } else L.mesh.position.set(centerOf(L.i % N), 0, centerOf(Math.floor(L.i / N)));   // elle revient à sa place
  jouer("meuble"); save();
  if(modif) montrerChoix(); else { marque.visible = false; $("#place-hint").hidden = true; $("#actions").hidden = false; $("#joy").hidden = false; }
}

canvas.addEventListener("pointerdown", e => {
  if(press){ clearTimeout(press.timer); press = null; return; }   // un deuxième doigt : c'est un zoom
  if(modif && !lift){                                                 // l'objet choisi : le doigt posé dessus le fait glisser tout de suite
    const c = lumiereSousDoigt(aim(e.clientX, e.clientY));
    if(c && (modif.b ? c.f === modif.f : c.i === modif.i)){
      lift = modif.b ? {b: modif.b, f: modif.f, mesh: c.mesh, type: modif.f.type, col: modif.f.col} : {i: modif.i, type: map.obj[modif.i], dest: modif.i, mesh: objMesh(modif.i)};
      Object.assign(lift, {pid: e.pointerId, x: e.clientX, y: e.clientY, ok: true}); suivre();
    }
    return;
  }
  if(lift || currentPlace() || isBusy() || !wrap.hidden || $("#joy").hidden || premiereActive()) return;   // première personne : le doigt fait regarder (vue.js)
  const cible = lumiereSousDoigt(aim(e.clientX, e.clientY));
  if(cible) press = {cible, pid: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, timer: setTimeout(soulever, 500)};
});
canvas.addEventListener("pointermove", e => {
  if(press && e.pointerId === press.pid){
    press.x = e.clientX; press.y = e.clientY;
    if(Math.hypot(press.x - press.sx, press.y - press.sy) > 12){ clearTimeout(press.timer); press = null; }   // le doigt a bougé : pas d'appui long
  }
  if(lift && e.pointerId === lift.pid){ lift.x = e.clientX; lift.y = e.clientY; suivre(); }
});
/* Un appui court sur une clôture ou un muret le tourne (Yo, 11 novembre 2026) : seul, d'un quart de tour ; au bout d'une ligne,
   tout droit, puis d'un côté, puis de l'autre ; joint des deux côtés, il suit ses voisins */
export function tourner(i){
  const t = map.obj[i], v = voisinsCloture(i, t), e = state.ile[i] || {};
  if(t === "panneau"){ setEtat(i, {rot: ((e.rot || 0) + 1) % 4 || undefined}); jouer("meuble"); save(); return; }   // le panneau : un quart de tour
  if(t === "portail"){                                                 // le portail : un quart de tour ; entre ses voisins, il s'ouvre de l'autre côté
    setEtat(i, {rot: ((e.rot || 0) + (v ? 2 : 1)) % 4 || undefined}); jouer("meuble"); save(); return;
  }
  if(v.length > 1){ toast(`${nomDe(t)} : ce morceau suit ses voisins`); return; }
  if(v.length === 1) setEtat(i, {tour: ((e.tour || 0) + 1) % 3 || undefined});
  else setEtat(i, {rot: e.rot ? undefined : 1});
  jouer("meuble"); save();
}
function leve(e){
  if(press && e.pointerId === press.pid){
    clearTimeout(press.timer);
    const c = press.cible; press = null;
    if(c.i !== undefined && ["cloture", "muret", "portail", "panneau"].includes(map.obj[c.i])) tourner(c.i);
  }
  if(lift && e.pointerId === lift.pid) lacher();
}
canvas.addEventListener("pointerup", leve);
canvas.addEventListener("pointercancel", leve);
