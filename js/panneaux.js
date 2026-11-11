/* ================= Le mot du panneau (Yo, 11 novembre 2026 : « On peut y écrire un mot ») =================
   Devant un panneau posé dehors, le bouton des gestes (gestes.js) ouvre cette fenêtre : on y tape un mot court (18 lettres au
   plus), « Peindre » le peint sur le devant du panneau (meubles.js, motPeint ; state.ile[i].texte, sauvegardé),
   « Effacer » rend le panneau nu. Le mot s'affiche aussi sur le bouton d'action quand on s'approche (recolte.js, nomCible). */
import { state, save } from "./sauvegarde.js";
import { map, setEtat } from "./monde/ile.js";
import { openSheet, closeSheet, wrap, toast } from "./interface.js";
import { jouer } from "./sons.js";

export const MOT_MAX = 18;
let ici = -1;                                           // la case du panneau dont la fenêtre est ouverte
const echapper = t => t.replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
export function ecrireMenu(i){
  if(map.obj[i] !== "panneau") return;
  ici = i;
  const t = (state.ile[i] || {}).texte || "";
  openSheet(`<div class="sh-head"><h2 class="display">🪧 Le panneau</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 8px">Le mot peint sur le devant du panneau (${MOT_MAX} lettres au plus).</p>
    <input id="mot-panneau" type="text" maxlength="${MOT_MAX}" value="${echapper(t)}" autocomplete="off" placeholder="Le jardin, Chez moi…"
      style="width:100%;box-sizing:border-box;font:inherit;font-size:20px;padding:10px 12px;border-radius:12px;border:2px solid #c9b48a;background:#fffaf0;color:#3a2614">
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" data-mot="peindre">🖌️ Peindre</button>${t ? '<button class="btn" data-mot="effacer">🧽 Effacer</button>' : ""}</div>`);
  const champ = document.getElementById("mot-panneau");
  if(champ){ champ.addEventListener("keydown", e => { e.stopPropagation(); if(e.key === "Enter") document.querySelector('[data-mot="peindre"]').click(); });
    champ.addEventListener("keyup", e => e.stopPropagation()); setTimeout(() => champ.focus(), 260); }
}
/* Peindre le mot sur le panneau de la case i (la fenêtre ; la vérification) : un mot vide l'efface */
export function ecrire(i, texte){
  if(map.obj[i] !== "panneau") return false;
  const t = (texte || "").replace(/\s+/g, " ").trim().slice(0, MOT_MAX);
  setEtat(i, {texte: t || undefined}); save(); jouer("peindre");
  return true;
}
wrap.addEventListener("click", e => {
  const b = e.target.closest("[data-mot]");
  if(!b || ici < 0) return;
  const champ = document.getElementById("mot-panneau"), mot = b.dataset.mot === "effacer" ? "" : (champ ? champ.value : "");
  if(ecrire(ici, mot)) toast(mot.trim() ? `🪧 « ${mot.trim().slice(0, MOT_MAX)} » peint sur le panneau` : "🪧 Le panneau est effacé", 2200);
  ici = -1; closeSheet();
});
