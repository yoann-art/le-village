/* ================= La vitrine (étape 1.11, morceau 4) =================
   Grand Carnet (meubles et décoration) : « Vitrine : bois et verre, gabarit moyen ; expose une pièce de collection chez
   soi ». Elle se fabrique à l'atelier de décoration de la Chaumière (planches et verre) et se pose dans n'importe quelle
   pièce, comme un meuble. Tout près d'elle, un bouton (#btn-vitrine) ouvre sa fiche : on y expose une pierre de la mine
   qu'on a sur soi ou dans un coffre (PIERRES, et le Cœur de la mine) ; elle quitte le sac et se voit sous le verre ;
   « Reprendre » la rend. La pierre exposée est gardée dans le meuble : b.deco.items = [{type: "vitrine", pierre: k, …}].
   Aussi : la page « 💎 Pierres » du carnet (sac.js) est remplie, pour une partie commencée avant, avec ce qu'on a. */
import { $ } from "./outils.js";
import { PIERRES, MEUBLES, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, placeFor } from "./regles.js";
import { footOf } from "./monde/meubles.js";
import { refreshItemMesh } from "./monde/interieurs.js";
import { player } from "./monde/personnage.js";
import { currentPlace } from "./lieux.js";
import { syncBarre } from "./barre.js";
import { openSheet, toast, wrap, renderHUD } from "./interface.js";

/* Une partie commencée avant la page « Pierres » : ce qu'on possède déjà de la mine s'y inscrit */
if(!state.carnet.pierres){
  state.carnet.pierres = {};
  for(const k of Object.keys(PIERRES)){ const n = owned(k); if(n > 0) state.carnet.pierres[k] = {n}; }
  save();
}

const EXPOSABLES = [...Object.keys(PIERRES), "coeurMine"];
const btn = $("#btn-vitrine");
let proche = null, ouverte = null;            // la vitrine tout près ; celle dont la fiche est ouverte
const nom = k => objet(k).nom;
const de = k => /^[aeiouyéèêœh]/i.test(nom(k)) ? `l'${nom(k).toLowerCase()}` : `${objet(k).une ? "la" : "le"} ${nom(k).toLowerCase()}`;

/* Le bouton, quand on est tout près d'une vitrine (dans une pièce, hors décoration) */
export function updateVitrine(active){
  const place = active && currentPlace(), p = player.position;
  proche = null;
  if(place && place.b.deco) proche = place.b.deco.items.find(it => {
    if(!MEUBLES[it.type] || !MEUBLES[it.type].vitrine) return false;
    const [w, d] = footOf(it);
    return Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
  }) || null;
  const txt = proche ? (proche.pierre ? `💎 Vitrine : ${nom(proche.pierre).toLowerCase()}` : "💎 Exposer une pierre") : "";
  if(proche && btn.textContent !== txt) btn.textContent = txt;
  if(btn.hidden === !!proche) btn.hidden = !proche;
}

function render(){
  const it = ouverte, k = it.pierre, choix = EXPOSABLES.filter(p => owned(p) > 0);
  const dedans = k
    ? `<div class="pick"><span class="pe" aria-hidden="true">${icone(k)}</span><div class="pt"><b>${nom(k)}</b><p>${objet(k).usage || ""}</p></div>
        <div class="pa"><button class="btn ghost" data-vitrine-reprendre>Reprendre</button></div></div>`
    : `<p class="hint-box">La vitrine est vide. Touche une de tes pierres ci-dessous pour l'exposer.</p>`;
  openSheet(`<div class="sh-head"><h2 class="display">💎 Vitrine</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 8px">Expose une pierre de la mine : elle quitte ton sac (ou ton coffre) et se voit sous le verre.${k ? " Choisis-en une autre pour l'échanger." : ""}</p>
    ${dedans}
    <h3 style="margin:10px 0 4px">Tes pierres</h3>` +
    (choix.length ? `<div class="res-grid">${choix.map(p => `<button class="tile" data-vitrine="${p}" aria-label="Exposer : ${nom(p)}"><div class="te" aria-hidden="true">${icone(p)}</div><div class="tn">${owned(p)}</div><div class="tl">${nom(p)}</div></button>`).join("")}</div>`
      : `<p class="hint-box">Tu n'as aucune pierre de la mine sur toi ni dans tes coffres. Mine du charbon, de l'étain, du quartz… ou ouvre une géode à la table de taille de la Carrière.</p>`));
}
export function openVitrine(it){ ouverte = it; render(); }
btn.addEventListener("click", () => { if(proche) openVitrine(proche); });

/* Exposer une pierre (celle d'avant revient dans le sac, ou dans un coffre) ; la reprendre */
function exposer(k){
  const it = ouverte, avant = it.pierre;
  if(owned(k) < 1 || avant === k) return;
  if(avant && placeFor(avant) < 1){ toast("Ton sac et tes coffres sont pleins : fais de la place pour reprendre la pierre de la vitrine", 3200); return; }
  addOwned(k, -1);
  if(avant) addOwned(avant, 1);
  it.pierre = k;
  refreshItemMesh(it); syncBarre(); renderHUD(); save();
  toast(`💎 ${nom(k)} dans la vitrine${avant ? ` (${de(avant)} revient dans ton sac)` : ""}`, 2600);
}
function reprendre(){
  const it = ouverte, k = it.pierre;
  if(!k) return;
  if(placeFor(k) < 1){ toast("Ton sac et tes coffres sont pleins : fais de la place", 3000); return; }
  const r = addOwned(k, 1);
  delete it.pierre;
  refreshItemMesh(it); renderHUD(); save();
  toast(`💎 ${nom(k)} : ${r.sac ? "dans ton sac" : "dans un coffre (ton sac est plein)"}`, 2400);
}
wrap.addEventListener("click", e => {
  if(!ouverte) return;
  if(wrap.hidden){ ouverte = null; return; }
  const v = e.target.closest("[data-vitrine]");
  if(v){ exposer(v.dataset.vitrine); render(); }
  else if(e.target.closest("[data-vitrine-reprendre]")){ reprendre(); render(); }
  else if(e.target.closest("[data-close]")) ouverte = null;
});
