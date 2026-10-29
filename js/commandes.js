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
  if(e.key === "Shift") keys.lent = 1;                // Maj : marcher à pas de loup, sur ordinateur
  if(!wrap.hidden) return;
  if(KEYMAP[e.code]){ keys[KEYMAP[e.code]] = 1; e.preventDefault(); }
  else if(e.key === "+" || e.code === "NumpadAdd"){ setZoom(view.zoom / 1.15); saveZoom(); }
  else if(e.key === "-" || e.code === "NumpadSubtract"){ setZoom(view.zoom * 1.15); saveZoom(); }
});
window.addEventListener("keyup", e => { if(KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; if(e.key === "Shift") keys.lent = 0; });
window.addEventListener("blur", () => { for(const k in keys) keys[k] = 0; });

/* Zoom : pincer l'écran à deux doigts sur le téléphone ; molette ou touches + et − sur ordinateur.
   view.zoom multiplie la distance de la caméra : plus petit = plus près. Gardé sur l'appareil. */
const ZMIN = .6, ZMAX = 1.6, ZKEY = "le-village-zoom";
/* La caméra qui tourne tout autour du personnage (demande de Yo, 29 octobre 2026 : « tourner la caméra à 360 degrés
   pour jouer ainsi on verra mieux la faune et flore ») : glisser un doigt sur l'écran, de gauche à droite ; view.lacet
   (en radians, 0 : vers le nord comme avant) est gardé sur l'appareil ; main.js dit où il s'applique (view.peutTourner :
   dehors, dans la forêt et le Marais, ni en construisant ni en décorant) et l'angle de cette image (view.lacetIci), que
   personnage.js lit pour que le joystick suive la caméra */
const LKEY = "le-village-lacet";
export const view = {zoom: 1, lacet: 0, lacetIci: 0, elan: 0, doigt: false, peutTourner: () => false};   // elan : la vitesse (rad/s) quand le doigt se lève ; doigt : un doigt fait tourner
try{ const z = parseFloat(localStorage.getItem(ZKEY)); if(z >= ZMIN && z <= ZMAX) view.zoom = z; }catch(_){}
try{ const l = parseFloat(localStorage.getItem(LKEY)); if(isFinite(l)) view.lacet = l; }catch(_){}
export function setLacet(l){ view.lacet = Math.atan2(Math.sin(l), Math.cos(l)); try{ localStorage.setItem(LKEY, String(view.lacet)); }catch(_){} }
function setZoom(z){ view.zoom = Math.max(ZMIN, Math.min(ZMAX, z)); }
function saveZoom(){ try{ localStorage.setItem(ZKEY, String(view.zoom)); }catch(_){} }
const app = $("#app"), fingers = new Map();
let pinchDist = 0;
const onScene = e => e.target.tagName === "CANVAS";
app.addEventListener("pointerdown", e => { if(onScene(e)){ fingers.set(e.pointerId, {x:e.clientX, y:e.clientY, x0:e.clientX, t:e.timeStamp, tourne:false}); pinchDist = 0; view.elan = 0; } });
app.addEventListener("pointermove", e => {
  const f = fingers.get(e.pointerId);
  if(!f) return;
  const dx = e.clientX - f.x;
  f.x = e.clientX; f.y = e.clientY;
  if(fingers.size === 1 && view.peutTourner()){              // un seul doigt qui glisse : la caméra tourne (un balayage de l'écran : un demi-tour)
    if(!f.tourne && Math.abs(e.clientX - f.x0) > 10) f.tourne = view.doigt = true;   // un simple toucher, un appui long, ne tournent pas
    if(f.tourne){                                               // un balayage de toute la largeur de l'écran : un tour complet (Yo : « longue »)
      const dl = -dx * 2 * Math.PI / Math.max(320, innerWidth), dts = Math.max(.008, (e.timeStamp - f.t) / 1000);
      view.lacet += dl;
      f.v = (f.v || 0) * .6 + dl / dts * .4;                    // sa vitesse, adoucie, pour l'élan au lâcher
    }
    f.t = e.timeStamp;
    return;
  }
  if(fingers.size !== 2) return;
  const [a, b] = [...fingers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
  if(pinchDist && d) setZoom(view.zoom * pinchDist / d);
  pinchDist = d;
});
function endFinger(e){
  const f = fingers.get(e.pointerId);
  if(!fingers.delete(e.pointerId)) return;
  pinchDist = 0; saveZoom();
  if(f.tourne){ view.doigt = false; view.elan = e.timeStamp - f.t < 80 ? Math.max(-9, Math.min(9, f.v || 0)) : 0; setLacet(view.lacet); }   // lâché en glissant : elle continue un peu sur sa lancée
}
app.addEventListener("pointerup", endFinger);
app.addEventListener("pointercancel", endFinger);
app.addEventListener("wheel", e => {
  if(!onScene(e)) return;
  e.preventDefault();
  setZoom(view.zoom * (1 + e.deltaY * .001)); saveZoom();
}, {passive:false});
