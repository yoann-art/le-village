/* ================= Commandes =================
   Joystick à l'écran, et clavier pour jouer sur ordinateur. */
import { $ } from "./outils.js";

const joy = $("#joy"), knob = $("#knob"), JR = 48;
export const jv = {x:0, z:0};
let joyId = null;
function moveJoy(e){
  const r = joy.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
  const d = Math.hypot(dx, dy);
  if(d > JR){ dx *= JR/d; dy *= JR/d; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  if(d < JR * .15){ jv.x = jv.z = 0; } else { jv.x = dx / JR; jv.z = dy / JR; }
}
function endJoy(e){
  if(e.pointerId !== joyId) return;
  joyId = null; jv.x = jv.z = 0; knob.style.transform = "";
}
/* Remet le joystick au centre (quand un panneau s'ouvre) */
export function resetJoy(){ jv.x = jv.z = 0; knob.style.transform = ""; }
joy.addEventListener("pointerdown", e => { e.preventDefault(); joyId = e.pointerId; try{ joy.setPointerCapture(e.pointerId); }catch(_){} moveJoy(e); });
joy.addEventListener("pointermove", e => { if(e.pointerId === joyId) moveJoy(e); });
joy.addEventListener("pointerup", endJoy);
joy.addEventListener("pointercancel", endJoy);

export const keys = {};
const KEYMAP = {ArrowUp:"u", KeyW:"u", KeyZ:"u", ArrowDown:"d", KeyS:"d", ArrowLeft:"l", KeyA:"l", KeyQ:"l", ArrowRight:"r", KeyD:"r"};
const wrap = $("#sheetWrap");
window.addEventListener("keydown", e => {
  if(!wrap.hidden) return;
  if(KEYMAP[e.code]){ keys[KEYMAP[e.code]] = 1; e.preventDefault(); }
  else if(e.key === "+" || e.code === "NumpadAdd"){ setZoom(view.zoom / 1.15); saveZoom(); }
  else if(e.key === "-" || e.code === "NumpadSubtract"){ setZoom(view.zoom * 1.15); saveZoom(); }
});
window.addEventListener("keyup", e => { if(KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; });
window.addEventListener("blur", () => { for(const k in keys) keys[k] = 0; });

/* Zoom : pincer l'écran à deux doigts sur le téléphone ; molette ou touches + et − sur ordinateur.
   view.zoom multiplie la distance de la caméra : plus petit = plus près. Gardé sur l'appareil. */
const ZMIN = .6, ZMAX = 1.6, ZKEY = "le-village-zoom";
export const view = {zoom: 1};
try{ const z = parseFloat(localStorage.getItem(ZKEY)); if(z >= ZMIN && z <= ZMAX) view.zoom = z; }catch(_){}
function setZoom(z){ view.zoom = Math.max(ZMIN, Math.min(ZMAX, z)); }
function saveZoom(){ try{ localStorage.setItem(ZKEY, String(view.zoom)); }catch(_){} }
const app = $("#app"), fingers = new Map();
let pinchDist = 0;
const onScene = e => e.target.tagName === "CANVAS";
app.addEventListener("pointerdown", e => { if(onScene(e)){ fingers.set(e.pointerId, {x:e.clientX, y:e.clientY}); pinchDist = 0; } });
app.addEventListener("pointermove", e => {
  const f = fingers.get(e.pointerId);
  if(!f) return;
  f.x = e.clientX; f.y = e.clientY;
  if(fingers.size !== 2) return;
  const [a, b] = [...fingers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
  if(pinchDist && d) setZoom(view.zoom * pinchDist / d);
  pinchDist = d;
});
function endFinger(e){
  if(!fingers.delete(e.pointerId)) return;
  pinchDist = 0; saveZoom();
}
app.addEventListener("pointerup", endFinger);
app.addEventListener("pointercancel", endFinger);
app.addEventListener("wheel", e => {
  if(!onScene(e)) return;
  e.preventDefault();
  setZoom(view.zoom * (1 + e.deltaY * .001)); saveZoom();
}, {passive:false});
