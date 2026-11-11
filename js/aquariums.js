/* ================= Choisir les poissons des aquariums (Yo, 11 novembre 2026) =================
   « Je veux que l'on puisse choisir quel poisson on peut mettre dans les 3 aquariums, car le premier du sac est mis dans
   l'aquarium. Je veux également pouvoir les retirer de l'aquarium comme je veux, en choisissant le poisson que je veux
   retirer » : tout près d'un aquarium (le petit, le moyen, le grand), son bouton ouvre sa fenêtre : les poissons qui y nagent
   (« Retirer » : celui-là revient dans le sac) et les poissons pêchés qu'on a (on touche celui qu'on y met). La fenêtre reste
   ouverte, pour en mettre ou en retirer plusieurs. Le petit aquarium garde son poisson dans it.poisson (et it.robe), les deux
   autres dans it.poissons (« gardon », « koi|kohaku »). */
import { MEUBLES, POISSONS, GARNIS, garniNb } from "./donnees.js";
import { save } from "./sauvegarde.js";
import { owned, addOwned, placeFor } from "./regles.js";
import { refreshItemMesh } from "./monde/interieurs.js";
import { openSheet, wrap, toast, renderHUD } from "./interface.js";
import { syncBarre } from "./barre.js";
import { mettrePoisson } from "./lumieres.js";

/* Les poissons qui nagent dans cet aquarium : leurs clés (« gardon », « koi|kohaku ») */
export const poissonsDe = it => it.poissons ? [...it.poissons] : it.poisson ? [it.poisson + (it.robe ? "|" + it.robe : "")] : [];
const nomDe = k => POISSONS[k] ? POISSONS[k].nom : k;
const le = k => POISSONS[k] && POISSONS[k].une ? "la" : "le";

let ouvert = null;
export function aquariumMenu(it){
  ouvert = it;
  const M = MEUBLES[it.type], nb = garniNb(it.type), dedans = poissonsDe(it), plein = dedans.length >= nb;
  const miens = GARNIS.poisson.filter(k => owned(k) > 0);
  const nage = dedans.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">` + dedans.map((cle, j) => { const k = cle.split("|")[0];
      return `<button class="btn" data-aq-sortir="${j}">↩️ Retirer ${le(k)} ${nomDe(k).toLowerCase()}</button>`; }).join("") + `</div>`
    : `<p class="muted" style="margin:0">Aucun poisson pour l'instant.</p>`;
  const sac = miens.length ? (plein ? `<p class="muted" style="margin:0 0 6px">L'aquarium est plein : retire un poisson pour en mettre un autre.</p>` : "")
      + `<div style="display:flex;flex-wrap:wrap;gap:6px">` + miens.map(k => `<button class="btn${plein ? "" : " primary"}" data-aq-mettre="${k}"${plein ? " disabled" : ""}>🐟 ${nomDe(k)} ×${owned(k)}</button>`).join("") + `</div>`
    : `<p class="muted" style="margin:0">Tu n'as pas de poisson : pêche-en un à l'étang ou en mer, puis reviens.</p>`;
  openSheet(`<div class="sh-head"><h2 class="display">${M.emoji} ${M.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <h3 style="margin:6px 0 4px">Dans l'aquarium (${dedans.length} sur ${nb})</h3>${nage}
    <h3 style="margin:12px 0 4px">Tes poissons</h3>${sac}`);
}
/* Mettre ce poisson-là (la fenêtre ; la vérification) */
export function mettre(it, k){
  if(poissonsDe(it).length >= garniNb(it.type) || owned(k) < 1) return false;
  return mettrePoisson(it, it.type, k, () => refreshItemMesh(it));
}
/* Retirer le j-ième poisson : il revient dans le sac (ou un coffre, le sac plein) */
export function retirer(it, j){
  const cle = poissonsDe(it)[j];
  if(!cle) return false;
  const k = cle.split("|")[0];
  if(placeFor(k) < 1){ toast("🎒 Ton sac et tes coffres sont pleins : fais de la place pour le poisson", 3000); return false; }
  const r = addOwned(k, 1);
  if(it.poissons){ it.poissons.splice(j, 1); if(!it.poissons.length) delete it.poissons; } else { delete it.poisson; delete it.robe; }
  refreshItemMesh(it); syncBarre(); save(); renderHUD();
  const L = le(k);
  toast(`🐟 ${L[0].toUpperCase() + L.slice(1)} ${nomDe(k).toLowerCase()} sort ${MEUBLES[it.type].dans} : ${r.sac ? "dans ton sac" : "dans un coffre (ton sac est plein)"}`, 2800);
  return true;
}
wrap.addEventListener("click", e => {
  const b = e.target.closest("[data-aq-mettre],[data-aq-sortir]");
  if(!b || !ouvert || b.disabled) return;
  const it = ouvert;
  if(b.dataset.aqMettre) mettre(it, b.dataset.aqMettre); else retirer(it, +b.dataset.aqSortir);
  aquariumMenu(it);                                                    // la fenêtre reste ouverte, à jour
});
wrap.addEventListener("click", e => { if(e.target.closest("[data-close]")) ouvert = null; });
