/* ================= Déplacer une lumière dehors (demande de Yo, 12 octobre 2026) =================
   Comme les meubles dans les pièces : sur l'île, un appui long (½ s) sur une lumière posée (torchère, chandelle,
   lanterne, brasero, feu de camp, lampadaire, bocal à lucioles) la soulève ; elle suit le doigt case par case (la case
   en jaune si elle peut s'y poser, en rouge sinon : mêmes règles que pour la poser, poseProblem) et se pose quand on
   lève le doigt (mauvaise place : elle revient). Une lumière accrochée à une façade (torchère ou lanterne murale)
   glisse le long de la façade de devant de son bâtiment, jamais devant la porte. Le personnage attend pendant ce temps. */
import { $ } from "./outils.js";
import { MEUBLES } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sizeOf } from "./regles.js";
import { renderer, ray, aim, groundAt, scene } from "./monde/scene.js";
import { map, idx, inb, N, tileOf, centerOf, setObj, setEtat, objMesh } from "./monde/ile.js";
import { placeMesh, lumieresFacades, colPorte, placeFacade } from "./monde/batiments.js";
import { poseProblem } from "./coffres.js";
import { resetJoy } from "./commandes.js";
import { wrap } from "./interface.js";
import { currentPlace, isBusy } from "./lieux.js";

const canvas = renderer.domElement;
let press = null;          // appui en cours sur une lumière : {cible, pid, x, y, sx, sy, timer}
let lift = null;           // la lumière soulevée : {i, type, dest} sur une case, ou {b, f, col} sur une façade ; et mesh, pid, x, y, ok
export const deplaceEnCours = () => !!lift;
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
  resetJoy();
  $("#actions").hidden = true; $("#joy").hidden = true;
  suivre();
}
/* La lumière suit le doigt : sur une case libre de l'île, ou le long de la façade de son bâtiment */
function suivre(){
  if(!lift || !groundAt(lift.x, lift.y, hit)) return;
  if(lift.b){
    const b = lift.b, s = sizeOf(b.type), col = Math.max(0, Math.min(s - 1, tileOf(hit.x) - b.x));
    lift.col = col;
    lift.ok = col === lift.f.col || col !== colPorte(b.type) && !(b.facade || []).some(v => v !== lift.f && v.col === col);
    lift.mesh.position.x = placeFacade(b.type, col).x;
    marque.position.set(centerOf(b.x + col), .03, centerOf(b.z + s));
    hint(lift.ok ? `${nomDe(lift.type)} : glisse-${laLe(lift.type)} le long de la façade, puis lève le doigt`
      : col === colPorte(b.type) ? "Pas devant la porte" : "Il y a déjà une lumière ici", !lift.ok);
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
  marque.visible = false;
  $("#place-hint").hidden = true; $("#place-hint").classList.remove("bad");
  $("#actions").hidden = false; $("#joy").hidden = false;
  if(L.b){
    if(L.ok) L.f.col = L.col;
    placeMesh(L.b);                                   // refait le bâtiment et sa façade (à la nouvelle place, ou à l'ancienne)
  } else if(L.ok && L.dest !== L.i){
    const etat = state.ile[L.i] || {};
    setObj(L.i, null); setObj(L.dest, L.type);
    if(etat.torche) setEtat(L.dest, {torche: true});
  } else L.mesh.position.set(centerOf(L.i % N), 0, centerOf(Math.floor(L.i / N)));   // elle revient à sa place
  save();
}

canvas.addEventListener("pointerdown", e => {
  if(press){ clearTimeout(press.timer); press = null; return; }   // un deuxième doigt : c'est un zoom
  if(lift || currentPlace() || isBusy() || !wrap.hidden || $("#joy").hidden) return;
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
function leve(e){
  if(press && e.pointerId === press.pid){ clearTimeout(press.timer); press = null; }
  if(lift && e.pointerId === lift.pid) lacher();
}
canvas.addEventListener("pointerup", leve);
canvas.addEventListener("pointercancel", leve);
