/* ================= Mini-jeu : la Carrière =================
   Toucher les pierres avant qu'elles disparaissent. */
import { $, onPress } from "../outils.js";

export function startCarriere(stage, done){
  stage.innerHTML = `<div class="qhead display"><span id="qs">🪨 0</span><span id="qt">20 s</span></div>
    <div class="timer" aria-hidden="true"><i id="bar"></i></div>
    <div class="holes">${'<button class="hole" aria-label="Trou de la carrière"><span class="em"></span></button>'.repeat(9)}</div>`;
  const KIND = {rock:{e:"🪨", v:1}, gem:{e:"💎", v:3}, bat:{e:"🦇", v:-2}};
  const holes = [...stage.querySelectorAll(".hole")].map(el => ({el, kind:null, until:0}));
  const qs = $("#qs",stage), qt = $("#qt",stage), bar = $("#bar",stage);
  const DUR = 20000, t0 = performance.now();
  let next = t0 + 400, score = 0, raf = 0, over = false, endT = 0;
  function show(h, k, now, life){ h.kind = k; h.until = now + life; $(".em", h.el).textContent = KIND[k].e; h.el.classList.add("up"); }
  function hide(h){ h.kind = null; h.el.classList.remove("up"); }
  function floatText(el, txt, color){
    const s = document.createElement("span");
    s.className = "float"; s.textContent = txt; s.style.color = color;
    el.appendChild(s); setTimeout(() => s.remove(), 700);
  }
  function frame(now){
    const el = now - t0, prog = Math.min(1, el / DUR);
    bar.style.width = ((1 - prog) * 100) + "%";
    qt.textContent = Math.max(0, Math.ceil((DUR - el) / 1000)) + " s";
    for(const h of holes) if(h.kind && now > h.until) hide(h);
    if(el >= DUR){
      over = true; holes.forEach(hide);
      endT = setTimeout(() => done(score), 600);
      return;
    }
    if(now >= next){
      const free = holes.filter(h => !h.kind);
      if(free.length){
        const h = free[Math.floor(Math.random() * free.length)], r = Math.random();
        show(h, r < .1 ? "gem" : r < .28 ? "bat" : "rock", now, 1050 - 400 * prog);
      }
      next = now + (720 - 300 * prog) * (.7 + Math.random() * .6);
    }
    raf = requestAnimationFrame(frame);
  }
  holes.forEach(h => onPress(h.el, () => {
    if(over || !h.kind) return;
    const v = KIND[h.kind].v;
    score = Math.max(0, score + v);
    qs.textContent = "🪨 " + score;
    floatText(h.el, (v > 0 ? "+" : "") + v, v > 0 ? "var(--or)" : "var(--gueules)");
    hide(h);
  }));
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); clearTimeout(endT); };
}
