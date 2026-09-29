/* ================= Mini-jeu : le Bûcheron =================
   Frapper quand le curseur passe dans la zone verte. */
import { $, onPress } from "../outils.js";

export function startBucheron(stage, done){
  stage.innerHTML = `<div class="tree" id="tree" aria-hidden="true">🌲</div>
    <div class="meter" aria-hidden="true"><div class="zone" id="zone"><div class="perfect"></div></div><div class="cursor" id="cursor"></div></div>
    <p class="feedback display" id="fb" aria-live="polite">&nbsp;</p>
    <p class="count" id="cnt"></p>
    <button class="btn primary big" id="hit">Frapper</button>`;
  const zone = $("#zone",stage), cur = $("#cursor",stage), fb = $("#fb",stage), cnt = $("#cnt",stage), tree = $("#tree",stage);
  const SW = 8, T = [];
  let swing = 0, total = 0, dur = 1.15, zw = .24, zx = .4, p = 0, dir = 1, last = performance.now(), raf = 0, lock = false, over = false;
  function newZone(){ zx = .05 + Math.random() * (.9 - zw); zone.style.left = zx*100 + "%"; zone.style.width = zw*100 + "%"; }
  function upd(){ cnt.textContent = over ? `Total : ${total} bois` : `Coup ${swing + 1} sur ${SW}, ${total} bois`; }
  function frame(now){
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += dir * dt / dur;
    if(p > 1){ p = 2 - p; dir = -1; }
    if(p < 0){ p = -p; dir = 1; }
    cur.style.left = (p * 100) + "%";
    raf = requestAnimationFrame(frame);
  }
  function hit(){
    if(lock || over) return;
    const c = zx + zw/2, inside = p >= zx && p <= zx + zw, perfect = Math.abs(p - c) <= zw * .17;
    const pts = perfect ? 4 : inside ? 2 : 0;
    total += pts;
    fb.textContent = perfect ? "Parfait ! +4" : inside ? "Bien ! +2" : "Raté";
    fb.style.color = perfect ? "var(--or)" : inside ? "var(--sinople)" : "var(--gueules)";
    if(pts){ tree.classList.remove("shake"); void tree.offsetWidth; tree.classList.add("shake"); }
    swing++;
    if(swing >= SW){ over = true; upd(); T.push(setTimeout(() => done(total), 800)); return; }
    dur = Math.max(.5, dur - .075); zw = Math.max(.11, zw - .016);
    lock = true;
    T.push(setTimeout(() => { lock = false; newZone(); }, 220));
    upd();
  }
  onPress($("#hit",stage), hit);
  newZone(); upd();
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); T.forEach(clearTimeout); };
}
