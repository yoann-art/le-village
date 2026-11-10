/* ================= La petite statue (image de Yo, 10 novembre 2026) =================
   « Voici la petite statue qui doit prendre la forme de l'animal ou insecte capturé » ; « Oui, les oiseaux et animaux
   d'élevage » : posée, c'est un socle et un bloc de pierre brute ; tout près, « 🗿 Sculpter » ouvre la liste des bêtes du
   carnet (les insectes attrapés, les oiseaux, les poissons pêchés, le gibier chassé ; les animaux d'élevage quand ils
   existeront) ; la bête choisie (it.bete, « insecte:pieride ») prend sa forme en pierre, d'après son vrai modèle (meubles.js
   la peint en pierre et la met à la taille d'une statuette). Rien n'est pris dans le sac. */
import { INSECTES, OISEAUX, POISSONS, GIBIER } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { MODELES_INSECTES } from "./monde/insectes3d.js";
import { MODELES_OISEAUX } from "./monde/oiseaux3d.js";
import { MODELES_POISSONS } from "./monde/poissons3d.js";
import { modeleGibier } from "./chasse.js";
import { formeStatue } from "./monde/meubles.js";
import { refreshItemMesh } from "./monde/interieurs.js";
import { openSheet, closeSheet, wrap, toast } from "./interface.js";
import { jouer } from "./sons.js";

/* Les familles : où le carnet les garde, leurs noms, leur modèle */
const FAMILLES = {
  insecte: {carnet: "insectes", noms: INSECTES, titre: "🦋 Les insectes", modele: k => MODELES_INSECTES[k] && MODELES_INSECTES[k].fabrique({saison: "ete"})},
  oiseau:  {carnet: "oiseaux", noms: OISEAUX, titre: "🐦 Les oiseaux", modele: k => MODELES_OISEAUX[k] && MODELES_OISEAUX[k].fabrique()},
  poisson: {carnet: "poissons", noms: POISSONS, titre: "🐟 Les poissons", modele: k => MODELES_POISSONS[k] && MODELES_POISSONS[k].fabrique(MODELES_POISSONS[k].couleurs ? MODELES_POISSONS[k].couleurs[0] : undefined)},
  gibier:  {carnet: "gibier", noms: GIBIER, titre: "🦊 Le gibier", modele: k => GIBIER[k] ? modeleGibier(k) : null},
};
formeStatue(cle => { const [f, k] = cle.split(":"); return FAMILLES[f] ? FAMILLES[f].modele(k) : null; });

/* Les bêtes qu'on peut sculpter : celles du carnet, qui ont un modèle */
export function betesSculptables(){
  const out = [];
  for(const [f, F] of Object.entries(FAMILLES)){
    const c = (state.carnet && state.carnet[F.carnet]) || {};
    for(const k of Object.keys(c)) if(c[k] && c[k].n > 0 && F.noms[k] && (f !== "insecte" || MODELES_INSECTES[k]) && (f !== "oiseau" || MODELES_OISEAUX[k]) && (f !== "poisson" || MODELES_POISSONS[k])) out.push({cle: `${f}:${k}`, f, nom: F.noms[k].nom});
  }
  return out;
}
let statue = null, refaire = null;
export function sculpterMenu(it, refaireFn){
  statue = it; refaire = refaireFn || (() => refreshItemMesh(it));
  const l = betesSculptables();
  if(!l.length){ toast("🗿 Capture d'abord une bête (un insecte au filet, un poisson, un oiseau, du gibier) : elle s'inscrit au carnet, et tu pourras la sculpter", 4200); return; }
  const groupes = Object.entries(FAMILLES).map(([f, F]) => { const b = l.filter(v => v.f === f); return b.length ? `<h3 style="margin:10px 0 4px">${F.titre}</h3><div style="display:flex;flex-wrap:wrap;gap:6px">`
    + b.map(v => `<button class="btn${it.bete === v.cle ? " primary" : ""}" data-statue="${v.cle}">${v.nom}</button>`).join("") + `</div>` : ""; }).join("");
  openSheet(`<div class="sh-head"><h2 class="display">🗿 Sculpter la statue</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">Les bêtes de ton carnet : la statue prend la forme de celle que tu choisis.</p>${groupes}`);
}
/* Sculpter la statue en cette bête (le menu ; la vérification) */
export function sculpter(it, cle, refaireFn){
  it.bete = cle; (refaireFn || (() => refreshItemMesh(it)))(); save(); jouer("meuble");
}
wrap.addEventListener("click", e => {
  const b = e.target.closest("[data-statue]");
  if(!b || !statue) return;
  sculpter(statue, b.dataset.statue, refaire); closeSheet();
  const [f, k] = b.dataset.statue.split(":");
  toast(`🗿 La statue prend la forme ${FAMILLES[f].noms[k].une ? "de la" : "du"} ${FAMILLES[f].noms[k].nom.toLowerCase()}`, 2600);
  statue = null;
});
