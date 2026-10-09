/* ================= La station météo (étape 1.10, morceau 3 ; demande de Yo, 9 octobre 2026) =================
   « Une station météo avec la date et l'heure qui s'affiche en jeu » : en haut à droite, un petit badge toujours
   visible (le temps qu'il fait, l'heure, la date) ; en le touchant, la fiche de la station : la date et l'heure en
   entier, la saison et l'hémisphère, la lune, le temps de maintenant et les prévisions des heures qui viennent (le temps
   dépend de la date : on peut le prévoir), et ce que ce temps change sur l'île. */
import { $ } from "./outils.js";
import { saison } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { meteo, METEO, previsions } from "./monde/meteo.js";
import { nuitIci } from "./monde/ciel.js";
import { ageLune } from "./peche.js";
import { NOM_SAISON } from "./saisons.js";
import { openSheet, wrap } from "./interface.js";

const badge = $("#meteo");
const deux = n => String(n).padStart(2, "0");
const heureDe = d => `${d.getHours()} h ${deux(d.getMinutes())}`;
const heureRonde = t => { const d = new Date(t); return d.getMinutes() ? heureDe(d) : d.getHours() === 0 ? "minuit" : `${d.getHours()} h`; };
const emojiDe = m => (nuitIci() > .5 && METEO[m].nuit) || METEO[m].emoji;
const EMOJI_SAISON = {printemps: "🌸", ete: "☀️", automne: "🍂", hiver: "❄️"};

/* La lune, en mots (son âge en jours depuis la nouvelle lune) */
function lune(d){
  const a = ageLune(d);
  return a < 1.8 || a > 27.7 ? "🌑 Nouvelle lune" : a < 5.5 ? "🌒 Premier croissant" : a < 9.2 ? "🌓 Premier quartier"
    : a < 13.3 ? "🌔 Lune gibbeuse" : a < 16.3 ? "🌕 Pleine lune" : a < 20.3 ? "🌖 Lune gibbeuse" : a < 24 ? "🌗 Dernier quartier" : "🌘 Dernier croissant";
}
/* Ce que le temps de maintenant change sur l'île */
const EFFET = {
  beau: "Par beau temps, la carpe koï se montre à l'étang au printemps, et les papillons volettent.",
  nuages: "Un temps calme : tout le monde est de sortie.",
  pluie: "La pluie arrose les buissons : leurs baies reviennent. L'anguille sort de l'étang la nuit, et les papillons se cachent.",
  orage: "L'orage arrose les buissons. Une nuit d'orage, le Vieux Silure rôde dans l'étang… Les papillons se cachent.",
  neige: "La neige blanchit l'herbe, et les papillons se cachent."
};

function majBadge(){
  const d = new Date(), m = meteo();
  const texte = `<b>${emojiDe(m)} ${heureDe(d)}</b><small>${d.toLocaleDateString("fr-FR", {weekday: "short", day: "numeric", month: "short"})}</small>`;
  if(badge.innerHTML !== texte) badge.innerHTML = texte;
  badge.setAttribute("aria-label", `Station météo : ${METEO[m].nom}, ${heureDe(d)}`);
  const h = document.getElementById("st-heure");             // la fiche ouverte : l'heure avance
  if(h && !wrap.hidden) h.textContent = heureDe(d);
}
function ouvrir(){
  const d = new Date(), p = previsions(5), s = saison(), maintenant = p[0];
  const jour = d.toLocaleDateString("fr-FR", {weekday: "long", day: "numeric", month: "long", year: "numeric"});
  openSheet(`<div class="sh-head"><h2 class="display">🌦️ Station météo</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="station">
      <p class="st-jour">${jour[0].toUpperCase() + jour.slice(1)}</p>
      <p class="st-heure" id="st-heure">${heureDe(d)}</p>
      <p>${EMOJI_SAISON[s]} ${NOM_SAISON[s][0].toUpperCase() + NOM_SAISON[s].slice(1)}, hémisphère ${state.hemisphere || "nord"} · ${lune(d)}</p>
      <div class="st-maintenant"><span class="st-gros">${emojiDe(maintenant.m)}</span><div><b>${METEO[maintenant.m].nom}</b><br>jusqu'à ${heureRonde(maintenant.fin)}</div></div>
      <p class="muted" style="margin:6px 0">${EFFET[maintenant.m]}${s === "hiver" ? " ❄️ L'hiver, ce que tu plantes pousse deux fois moins vite." : ""}</p>
      <h3>Prévisions</h3>
      <ul class="st-prev">${p.slice(1).map(x => `<li><span>${heureRonde(x.debut)} – ${heureRonde(x.fin)}</span><span>${METEO[x.m].emoji} ${METEO[x.m].nom}</span></li>`).join("")}</ul>
      <p class="muted" style="margin:8px 0 0">Le temps change toutes les 3 heures. C'est le même pour tout le monde au même moment.</p>
    </div>`);
}
badge.addEventListener("click", ouvrir);
majBadge();
setInterval(majBadge, 1000);
