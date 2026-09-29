/* ================= Petits outils utiles partout ================= */
export const $ = (s, r=document) => r.querySelector(s);

/* Message plein écran quand le jeu ne peut pas démarrer */
export function fatal(msg){ const f = $("#fatal"); f.hidden = false; $("p", f).textContent = msg; }

/* Réagit dès que le doigt touche le bouton (et au clavier) */
export function onPress(el, fn){
  el.addEventListener("pointerdown", e => { e.preventDefault(); fn(); });
  el.addEventListener("click", e => { if(e.detail === 0) fn(); });
}
