/* ================= Le compteur de performance (demande de Yo, 16 octobre 2026) =================
   Pour trouver ce qui fait saccader le jeu sur son téléphone. Il s'allume (et s'éteint) en touchant le numéro de version,
   en bas de l'écran ; le choix est gardé sur le téléphone (clé le-village-perf).
   Ce qu'il mesure, à chaque image :
   - le temps entre deux images (ce que voit le joueur) : 16,7 ms = 60 images par seconde, l'idéal ; au-delà de 50 ms,
     l'image a attendu trop longtemps : c'est une saccade ;
   - le travail du jeu sur cette image (son code : la marche, les bêtes, la récolte… et l'envoi du dessin) ; si le temps
     entre deux images est bien plus long que ce travail, c'est le téléphone qui peine à dessiner ;
   - ce qu'il a fallu dessiner : les triangles (chaque objet 3D en est fait) et les dessins (chaque fois que le jeu demande
     au téléphone de dessiner un objet ou un groupe d'objets ; chacun coûte, même petit).
   « 📋 Rapport » montre tout cela en texte, avec l'endroit, la vue, la saison, l'écran et la puce graphique du téléphone :
   le copier et le coller dans la conversation avec Claude. */
import { renderer } from "./monde/scene.js";
import { VERSION } from "./version.js";
import { $ } from "./outils.js";
import { toast, openSheet, closeSheet, wrap } from "./interface.js";
import { player } from "./monde/personnage.js";
import { isInside, currentPlace } from "./lieux.js";
import { vuePremiere } from "./vue.js";
import { saison } from "./donnees.js";
import { meteo } from "./monde/meteo.js";

const CLE = "le-village-perf", SACCADE = 50, GARDE = 10000;   // une saccade : plus de 50 ms ; on garde les 10 dernières secondes
let actif = false;
try { actif = localStorage.getItem(CLE) === "1"; } catch(e){}
renderer.info.autoReset = false;                          // le jeu dessine parfois deux fois par image (les mains) : on compte tout
const images = [];                                         // [heure, durée depuis l'image d'avant, travail du jeu] en ms
let avant = 0, debut = 0, dernier = 0, tri = 0, dessins = 0;

/* au début de chaque image (main.js) */
export function debutImage(now){
  renderer.info.reset();
  debut = performance.now();
  if(avant) images.push([now, now - avant, 0]);
  avant = now;
  while(images.length && now - images[0][0] > GARDE) images.shift();
}
/* à la fin de chaque image, après le dessin */
export function finImage(){
  const fin = performance.now();
  if(images.length) images[images.length - 1][2] = fin - debut;
  tri = renderer.info.render.triangles; dessins = renderer.info.render.calls;
  if(actif && fin - dernier > 500){ dernier = fin; afficher(); }
}

/* les chiffres des dernières secondes */
export function mesures(sur = GARDE){
  const t0 = performance.now() - sur, L = images.filter(i => i[0] >= t0);
  const n = L.length, somme = L.reduce((s, i) => s + i[1], 0), travail = L.reduce((s, i) => s + i[2], 0);
  const pire = L.reduce((m, i) => Math.max(m, i[1]), 0), saccades = L.filter(i => i[1] > SACCADE).length;
  /* la pire seconde : le moins d'images en une seconde */
  let pireSeconde = Infinity;
  for(let s = 0; s < sur / 1000; s++){ const k = L.filter(i => i[0] >= t0 + s * 1000 && i[0] < t0 + (s + 1) * 1000).length; if(k) pireSeconde = Math.min(pireSeconde, k); }
  return {ips: n ? Math.round(1000 * n / Math.max(1, somme)) : 0, ms: n ? somme / n : 0, travail: n ? travail / n : 0, pire, saccades,
    pireSeconde: pireSeconde === Infinity ? 0 : pireSeconde, triangles: tri, dessins};
}

/* ---------- à l'écran ---------- */
const boite = document.createElement("div");
boite.className = "perf"; boite.id = "perf"; boite.hidden = true;
document.body.appendChild(boite);
const fmt = n => Math.round(n).toLocaleString("fr-FR");
boite.innerHTML = `<div class="perf-chiffres"></div><button class="perf-b" data-rapport>📋 Rapport</button>`;   // le bouton reste en place (seuls les chiffres changent)
const chiffres = boite.querySelector(".perf-chiffres");
function afficher(){
  const m = mesures(3000), sac = mesures().saccades, c = m.ips >= 50 ? "bon" : m.ips >= 30 ? "moyen" : "mauvais";   // les 3 dernières secondes ; les saccades, sur 10 s
  chiffres.innerHTML = `<div class="perf-l ${c}">🎞️ ${m.ips} images/s · ${m.ms.toFixed(0)} ms</div>`
    + `<div class="perf-l">🧠 jeu ${m.travail.toFixed(0)} ms · pire ${m.pire.toFixed(0)} ms</div>`
    + `<div class="perf-l">🔺 ${fmt(m.triangles)} · ✏️ ${m.dessins} dessins</div>`
    + (sac ? `<div class="perf-l mauvais">⚠️ ${sac} saccade${sac > 1 ? "s" : ""} en 10 s</div>` : "");
}
boite.addEventListener("click", e => { if(e.target.closest("[data-rapport]")) montrerRapport(); });
export function allumerCompteur(oui){
  actif = oui;
  try { localStorage.setItem(CLE, oui ? "1" : "0"); } catch(e){}
  boite.hidden = !oui;
  if(oui) afficher();
}
export const compteurAllume = () => actif;
const version = $("#version");
version.classList.add("touchable");
version.addEventListener("click", () => { allumerCompteur(!actif); toast(actif ? "🎞️ Compteur de performance allumé (touche la version pour l'éteindre)" : "Compteur de performance éteint", 2600); });
if(actif) boite.hidden = false;

/* ---------- le rapport ---------- */
function puce(){
  try {
    const gl = renderer.getContext(), x = gl.getExtension("WEBGL_debug_renderer_info");
    return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch(e){ return "inconnue"; }
}
const LIEUX = {mine: "la mine", foret: "la Forêt profonde", grotte: "la grotte", marais: "le Marais brumeux", trajet: "le voyage en barque"};
export function rapportPerf(){
  const m = mesures(), d = new Date(), p = player.position, pr = renderer.getPixelRatio(), mem = renderer.info.memory;
  const lieu = !isInside() ? "l'île" : LIEUX[currentPlace().b.type] || "dans un bâtiment";
  return [
    `📋 Rapport de performance · Hearthwild v${VERSION} · ${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}`,
    `Lieu : ${lieu} (x ${p.x.toFixed(0)}, z ${p.z.toFixed(0)}), vue ${vuePremiere() ? "à la première personne" : "de dessus"} ; ${saison()}, ${meteo()}`,
    `Images par seconde : ${m.ips} en moyenne sur 10 s (la pire seconde : ${m.pireSeconde})`,
    `Une image : ${m.ms.toFixed(1)} ms en moyenne, la pire ${m.pire.toFixed(0)} ms ; saccades (plus de ${SACCADE} ms) : ${m.saccades} en 10 s`,
    `Travail du jeu par image : ${m.travail.toFixed(1)} ms (le reste, c'est le téléphone qui dessine)`,
    `Dessiné : ${fmt(m.triangles)} triangles, ${m.dessins} dessins ; en mémoire : ${mem.geometries} formes, ${mem.textures} images`,
    `Écran : ${innerWidth} × ${innerHeight} points, finesse × ${pr} (${fmt(innerWidth * pr)} × ${fmt(innerHeight * pr)} pixels dessinés)`,
    `Téléphone : ${puce()} · ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 120)}`
  ].join("\n");
}
function montrerRapport(){
  const texte = rapportPerf();
  openSheet(`<div class="sh-head"><h2 class="display">📋 Rapport de performance</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted">Copie ce texte et colle-le dans ta conversation avec Claude, en disant ce que tu faisais quand ça a saccadé.</p>
    <pre class="perf-rapport">${texte.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
    <button class="btn" data-copier>📋 Copier</button>`);
  const b = wrap.querySelector("[data-copier]");
  b.addEventListener("click", () => {
    const fait = () => { toast("📋 Rapport copié : colle-le dans ta conversation avec Claude", 3000); closeSheet(); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fait, () => toast("Appuie longtemps sur le texte pour le copier", 3000));
    else toast("Appuie longtemps sur le texte pour le copier", 3000);
  });
}
