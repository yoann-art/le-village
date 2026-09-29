/* ================= Mini-jeu : les Runes =================
   Regarder la suite de runes, puis la reproduire. */
import { $, onPress } from "../outils.js";

export function startRunes(stage, done){
  const R = [{e:"🔥", c:"var(--gueules)"}, {e:"💧", c:"var(--azur)"}, {e:"🌿", c:"var(--sinople)"}, {e:"⭐", c:"var(--or)"}];
  stage.innerHTML = `<p class="round display" id="rd">Manche 1</p><p class="status" id="st" aria-live="polite"></p>
    <div class="runes">${R.map((r,i) => `<button class="rune" data-i="${i}" style="--c:${r.c}" aria-label="Rune ${i+1}" disabled>${r.e}</button>`).join("")}</div>`;
  const btns = [...stage.querySelectorAll(".rune")], rd = $("#rd",stage), st = $("#st",stage), T = [];
  let seq = [], idx = 0, round = 0, won = 0, accept = false, over = false;
  const later = (f, ms) => T.push(setTimeout(f, ms));
  function lit(i, ms){ btns[i].classList.add("lit"); later(() => btns[i].classList.remove("lit"), ms); }
  function setInput(on){ accept = on; btns.forEach(b => b.disabled = !on); }
  function nextRound(){
    round++; idx = 0;
    seq.push(Math.floor(Math.random() * 4));
    rd.textContent = `Manche ${round}`;
    st.textContent = "Regarde bien…";
    setInput(false);
    const gap = Math.max(360, 700 - round * 30);
    seq.forEach((k, j) => later(() => lit(k, gap * .62), 600 + j * gap));
    later(() => { st.textContent = "À toi"; setInput(true); }, 600 + seq.length * gap);
  }
  function press(k){
    if(!accept || over) return;
    lit(k, 180);
    if(k !== seq[idx]){
      over = true; setInput(false);
      st.textContent = `Raté ! ${won} manche${won > 1 ? "s" : ""} réussie${won > 1 ? "s" : ""}`;
      later(() => done(won * 2), 1000);
      return;
    }
    idx++;
    if(idx === seq.length){
      won = round; setInput(false);
      if(round >= 12){ over = true; st.textContent = "Mémoire parfaite !"; later(() => done(won * 2 + 6), 1000); return; }
      st.textContent = "Bien joué";
      later(nextRound, 800);
    }
  }
  btns.forEach(b => onPress(b, () => press(+b.dataset.i)));
  later(nextRound, 300);
  return () => T.forEach(clearTimeout);
}
