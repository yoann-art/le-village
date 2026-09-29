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
/* Remet le joystick au centre (quand un panneau ou un mini-jeu s'ouvre) */
export function resetJoy(){ jv.x = jv.z = 0; knob.style.transform = ""; }
joy.addEventListener("pointerdown", e => { e.preventDefault(); joyId = e.pointerId; try{ joy.setPointerCapture(e.pointerId); }catch(_){} moveJoy(e); });
joy.addEventListener("pointermove", e => { if(e.pointerId === joyId) moveJoy(e); });
joy.addEventListener("pointerup", endJoy);
joy.addEventListener("pointercancel", endJoy);

export const keys = {};
const KEYMAP = {ArrowUp:"u", KeyW:"u", KeyZ:"u", ArrowDown:"d", KeyS:"d", ArrowLeft:"l", KeyA:"l", KeyQ:"l", ArrowRight:"r", KeyD:"r"};
const gameEl = $("#game"), wrap = $("#sheetWrap");
window.addEventListener("keydown", e => {
  if(KEYMAP[e.code] && gameEl.hidden && wrap.hidden){ keys[KEYMAP[e.code]] = 1; e.preventDefault(); }
});
window.addEventListener("keyup", e => { if(KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; });
window.addEventListener("blur", () => { for(const k in keys) keys[k] = 0; });
