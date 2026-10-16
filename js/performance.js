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
   Le profilage (mission de Yo, 16 octobre 2026 : les saccades en marchant dans le village) : le temps de chaque morceau de
   la boucle (temps(), appelé par garde dans main.js : la marche, la caméra, le champ, le dessin…), et dans chaque image ce
   que la carte graphique a reçu pour la première fois : de nouveaux programmes de dessin (les « shaders », compilés la
   première fois qu'une matière est dessinée) et de nouvelles formes (envoyées à la carte graphique la première fois
   qu'elles se voient). Tout est rangé dans des tableaux fixes (aucune mémoire prise à chaque image, pour ne pas
   provoquer lui-même le ménage de la mémoire du navigateur).
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
/* le dessin des ombres du soleil, chronométré à part (il fait partie du « dessin ») */
const ombresRender = renderer.shadowMap.render;
renderer.shadowMap.render = function(lumieres, sc, cam){ const t0 = performance.now(); ombresRender.call(this, lumieres, sc, cam); temps("dessin des ombres", performance.now() - t0); };

/* ---------- le relevé : un anneau de MAX images, dans des tableaux fixes ---------- */
const MAX = 1200, NS = 32;                                 // 20 s à 60 images/s ; 32 morceaux de boucle au plus
const T = new Float64Array(MAX), DT = new Float32Array(MAX), TRAV = new Float32Array(MAX);   // heure, depuis l'image d'avant, travail du jeu
const PROG = new Int16Array(MAX), GEO = new Int16Array(MAX);                                  // nouveaux programmes, nouvelles formes
const SEC = new Float32Array(MAX * NS);                    // le temps de chaque morceau, image par image
const noms = [], colonne = new Map();
let n = 0, tete = -1, avant = 0, debut = 0, dernier = 0, tri = 0, dessins = 0, progAvant = 0, geoAvant = 0;

/* la préparation de la carte graphique au chargement (scene.js, preparer) : sa durée, pour le rapport */
let preparation = 0;
export function noterPreparation(ms){ preparation = ms; progAvant = renderer.info.programs.length; geoAvant = renderer.info.memory.geometries; }
export const dureePreparation = () => preparation;
/* Le jeu mis de côté (une autre application, l'écran éteint : le navigateur n'envoie plus d'images) : cette pause n'est pas
   une saccade, elle n'est pas comptée (rapport de Yo du 16 octobre 2026 : 214 secondes passées hors du jeu comptées comme
   une seule image, « 2 images par seconde ») ; on note quand le jeu a été repris, le rapport le dit */
let reprise = 0, dehors = false, debutPause = 0, sauter = 0;
const pauses = [];                                        // [début, fin] des dernières pauses : leurs secondes ne comptent pas
export function mettreDeCote(oui){
  if(oui === dehors) return;
  dehors = oui;
  avant = 0;                                              // l'image qui enjambe le départ ou le retour n'est pas comptée non plus
  if(oui) debutPause = performance.now();
  else { reprise = performance.now(); pauses.push([debutPause, reprise]); if(pauses.length > 8) pauses.shift(); sauter = 2; }   // la 1re image au retour peut porter une heure d'avant la pause : les 2 premières ne comptent pas
}
/* caché (une autre application, l'écran éteint), ou une autre fenêtre au premier plan (le navigateur ralentit alors le jeu à
   une image par seconde sans le cacher) */
document.addEventListener("visibilitychange", () => mettreDeCote(document.hidden));
window.addEventListener("blur", () => mettreDeCote(true));
window.addEventListener("focus", () => mettreDeCote(document.hidden));
/* au début de chaque image (main.js) */
export function debutImage(now){
  renderer.info.reset();
  debut = performance.now();
  tete = (tete + 1) % MAX; if(n < MAX) n++;
  T[tete] = now; DT[tete] = avant && !dehors && !sauter ? now - avant : 0; TRAV[tete] = 0; PROG[tete] = GEO[tete] = 0;   // pendant une pause : pas compté
  if(sauter && !dehors) sauter--;
  SEC.fill(0, tete * NS, tete * NS + NS);
  avant = now;
}
/* le temps d'un morceau de la boucle (garde, main.js) */
export function temps(nom, ms){
  if(tete < 0) return;
  let c = colonne.get(nom);
  if(c === undefined){ if(noms.length >= NS) return; c = noms.length; noms.push(nom); colonne.set(nom, c); }
  SEC[tete * NS + c] += ms;
}
/* à la fin de chaque image, après le dessin */
export function finImage(){
  const fin = performance.now();
  if(tete >= 0){
    TRAV[tete] = fin - debut;
    const p = renderer.info.programs ? renderer.info.programs.length : 0, g = renderer.info.memory.geometries;
    PROG[tete] = Math.max(0, p - progAvant); GEO[tete] = Math.max(0, g - geoAvant);
    progAvant = p; geoAvant = g;
  }
  tri = renderer.info.render.triangles; dessins = renderer.info.render.calls;
  if(actif && fin - dernier > 500){ dernier = fin; afficher(); }
}
/* les images des `sur` dernières millisecondes, de la plus ancienne à la plus récente (leurs places dans l'anneau) */
function places(sur){
  const t0 = performance.now() - sur, out = [];
  for(let k = n - 1; k >= 0; k--){ const j = (tete - k + MAX) % MAX; if(T[j] >= t0 && DT[j] > 0) out.push(j); }
  return out;
}

/* les chiffres des dernières secondes */
export function mesures(sur = GARDE){
  const L = places(sur), t0 = performance.now() - sur;
  let somme = 0, travail = 0, pire = 0, saccades = 0, prog = 0, geo = 0, pireTravail = 0;
  for(const j of L){ somme += DT[j]; travail += TRAV[j]; pire = Math.max(pire, DT[j]); pireTravail = Math.max(pireTravail, TRAV[j]); if(DT[j] > SACCADE) saccades++; prog += PROG[j]; geo += GEO[j]; }
  /* la pire seconde : le moins d'images en une seconde */
  let pireSeconde = Infinity;
  for(let s = 0; s < sur / 1000; s++){
    const a = t0 + s * 1000, b = a + 1000;
    if(pauses.some(([x, y]) => x < b + 100 && y > a - 100) || dehors && debutPause < b) continue;   // une seconde coupée par une pause
    let k = 0; for(const j of L) if(T[j] >= a && T[j] < b) k++;
    if(k) pireSeconde = Math.min(pireSeconde, k);
  }
  const nb = L.length;
  return {ips: nb ? Math.round(1000 * nb / Math.max(1, somme)) : 0, ms: nb ? somme / nb : 0, travail: nb ? travail / nb : 0, pire, pireTravail, saccades,
    pireSeconde: pireSeconde === Infinity ? 0 : pireSeconde, triangles: tri, dessins, programmes: prog, formes: geo};
}
/* le détail du travail : chaque morceau de la boucle, sa moyenne et son pire, du plus lourd au plus léger */
export function detail(sur = GARDE){
  const L = places(sur);
  return noms.map((nom, c) => {
    let s = 0, m = 0;
    for(const j of L){ const v = SEC[j * NS + c]; s += v; if(v > m) m = v; }
    return {nom, moyenne: L.length ? s / L.length : 0, pire: m};
  }).sort((a, b) => b.moyenne - a.moyenne);
}
/* les pics : les images où le jeu a travaillé plus de `seuil` ms, avec le morceau le plus lourd et ce que la carte
   graphique a reçu pour la première fois */
export function pics(sur = GARDE, seuil = 33){
  return places(sur).filter(j => TRAV[j] > seuil).map(j => {
    let c = 0; for(let k = 1; k < noms.length; k++) if(SEC[j * NS + k] > SEC[j * NS + c]) c = k;
    return {travail: TRAV[j], morceau: noms[c], ms: SEC[j * NS + c], programmes: PROG[j], formes: GEO[j]};
  });
}
/* les saccades des `sur` dernières millisecondes : il y a combien de secondes, leur durée, le travail du jeu sur l'image
   d'avant (celle qui s'est fait attendre), et si c'était juste au retour dans le jeu (moins de 2 s après une reprise) */
export function saccades(sur = GARDE){
  const t = performance.now();
  return places(sur).filter(j => DT[j] > SACCADE).map(j => {
    const p = (j - 1 + MAX) % MAX;
    return {il: (t - T[j]) / 1000, ms: DT[j], travail: TRAV[p], retour: reprise > 0 && T[j] >= reprise && T[j] - reprise < 2000};
  });
}
/* Pour le banc de mesure (un essai sur le PC) : les images gardées après l'heure `depuis`, en clair */
export function releve(depuis = 0){
  return places(MAX * 100).filter(j => T[j] > depuis).map(j => {
    const s = {}; noms.forEach((nom, c) => { if(SEC[j * NS + c]) s[nom] = +SEC[j * NS + c].toFixed(3); });
    return {t: T[j], dt: DT[j], travail: TRAV[j], programmes: PROG[j], formes: GEO[j], s};
  });
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
  const lourds = detail().filter(s => s.pire >= .5).slice(0, 6).map(s => `${s.nom} ${s.moyenne.toFixed(1)} (pire ${s.pire.toFixed(0)})`).join(", ");
  const P = pics(), avecProg = P.filter(x => x.programmes).length, avecFormes = P.filter(x => x.formes).length;
  const pire = P.reduce((a, x) => !a || x.travail > a.travail ? x : a, null);
  return [
    `📋 Rapport de performance · Hearthwild v${VERSION} · ${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}`,
    `Lieu : ${lieu} (x ${p.x.toFixed(0)}, z ${p.z.toFixed(0)}), vue ${vuePremiere() ? "à la première personne" : "de dessus"} ; ${saison()}, ${meteo()}`,
    `Images par seconde : ${m.ips} en moyenne sur 10 s (la pire seconde : ${m.pireSeconde})`,
    `Une image : ${m.ms.toFixed(1)} ms en moyenne, la pire ${m.pire.toFixed(0)} ms ; saccades (plus de ${SACCADE} ms) : ${m.saccades} en 10 s`,
    `Travail du jeu par image : ${m.travail.toFixed(1)} ms, le pire ${m.pireTravail.toFixed(0)} ms (le reste, c'est le téléphone qui dessine)`,
    `Détail du travail en ms (moyenne, pire) : ${lourds || "rien de lourd"}`,
    ...(() => { const S = saccades().slice(-6); return S.length ? [`Les saccades : ` + S.map(x => `il y a ${x.il.toFixed(1)} s, ${x.ms.toFixed(0)} ms (jeu ${x.travail.toFixed(0)} ms${x.retour ? ", au retour dans le jeu" : ""})`).join(" ; ")] : []; })(),
    ...(reprise && performance.now() - reprise < GARDE ? [`Le jeu a été mis de côté (une autre application, l'écran éteint) puis repris il y a ${((performance.now() - reprise) / 1000).toFixed(1)} s : la pause n'est pas comptée`] : []),
    `Pics de travail (plus de 33 ms) : ${P.length} en 10 s` + (P.length ? ` ; ${avecProg} avec de nouveaux shaders, ${avecFormes} avec de nouvelles formes ; le pire : ${pire.travail.toFixed(0)} ms (${pire.morceau} ${pire.ms.toFixed(0)} ms)` : ""),
    `Nouveaux en 10 s : ${m.programmes} shaders, ${m.formes} formes envoyées à la carte graphique (tout préparé au chargement en ${fmt(preparation)} ms)`,
    `Dessiné : ${fmt(m.triangles)} triangles, ${m.dessins} dessins ; en mémoire : ${mem.geometries} formes, ${mem.textures} images, ${renderer.info.programs ? renderer.info.programs.length : "?"} shaders`,
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
