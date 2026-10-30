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
import { seriesIci } from "./monde/series.js";

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
const TRI = new Float32Array(MAX), DES = new Int16Array(MAX);                                // ce qui a été dessiné, image par image

/* Le temps de la carte graphique (mission de Yo, 30 octobre 2026 : distinguer le travail du processeur de celui de la carte
   graphique). renderer.render() ne mesure que l'envoi des ordres de dessin ; la carte graphique dessine ensuite, à son
   rythme. Si le navigateur le permet (l'extension EXT_disjoint_timer_query_webgl2), la carte graphique chronomètre
   elle-même tout le dessin d'une image ; le résultat arrive une ou deux images plus tard. Sinon, le rapport le dit.
   Seulement quand le compteur est allumé ou qu'une session de mesure tourne (sinon rien n'est demandé à la carte) */
const gl = renderer.getContext();
let extGpu = null;
try { extGpu = renderer.capabilities.isWebGL2 ? gl.getExtension("EXT_disjoint_timer_query_webgl2") : null; } catch(e){}
const GPU = new Float32Array(MAX).fill(-1);               // -1 : pas mesuré
const NQ = 8, requetes = [], qImage = new Int16Array(NQ);
let qDebut = 0, qN = 0, qCourante = -1, gpuMesures = 0, gpuPerdues = 0;
if(extGpu) for(let i = 0; i < NQ; i++) requetes.push(gl.createQuery());
function gpuDebut(){
  if(!extGpu || qN >= NQ) return;
  qCourante = (qDebut + qN) % NQ;
  gl.beginQuery(extGpu.TIME_ELAPSED_EXT, requetes[qCourante]);
}
function gpuFin(){
  if(qCourante >= 0){ gl.endQuery(extGpu.TIME_ELAPSED_EXT); qImage[qCourante] = tete; qN++; qCourante = -1; }
  while(qN > 0){                                         // les résultats arrivés (dans l'ordre)
    const q = requetes[qDebut];
    if(!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
    const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6, j = qImage[qDebut];
    if(gl.getParameter(extGpu.GPU_DISJOINT_EXT)) gpuPerdues++;   // la mesure a été coupée (le téléphone a changé de cadence) : écartée
    else { GPU[j] = ms; gpuMesures++; if(S && T[j] >= S.debut) S.gpu(ms); }
    qDebut = (qDebut + 1) % NQ; qN--;
  }
}

/* La mémoire du navigateur (Chrome, aussi sur Android : performance.memory) : relevée 4 fois par seconde. Quand elle
   baisse, le navigateur a fait le ménage ; ce qui a été pris entre deux ménages, c'est ce que le jeu jette. Le navigateur
   arrondit ces chiffres (sans réglage spécial) : s'ils ne bougent presque pas, le rapport le dit */
const memOk = !!(performance.memory && performance.memory.usedJSHeapSize);
const NM = 80, M_T = new Float64Array(NM), M_PRIS = new Float64Array(NM), M_MEN = new Int32Array(NM), M_UTIL = new Float64Array(NM);
let mTete = -1, mN = 0, memAvant = 0, memT = 0, pris = 0, menages = 0, changements = 0;
function releverMemoire(now){
  if(!memOk || now - memT < 250) return;
  memT = now;
  const u = performance.memory.usedJSHeapSize;
  if(memAvant){ if(u > memAvant) pris += u - memAvant; else if(u < memAvant - 5e5) menages++; if(u !== memAvant) changements++; }
  memAvant = u;
  mTete = (mTete + 1) % NM; if(mN < NM) mN++;
  M_T[mTete] = now; M_PRIS[mTete] = pris; M_MEN[mTete] = menages; M_UTIL[mTete] = u;
}
function memoireDepuis(t0){                                // ce qui a été pris, les ménages, depuis l'heure t0
  if(mN < 2) return null;
  let k = mTete;
  for(let i = 1; i < mN; i++){ const j = (mTete - i + NM) % NM; if(M_T[j] < t0) break; k = j; }
  const s = (M_T[mTete] - M_T[k]) / 1000;
  return s > 1 ? {moParSeconde: (pris - M_PRIS[k]) / 1e6 / s, menages: menages - M_MEN[k], utilise: M_UTIL[mTete] / 1e6, secondes: s} : null;
}

/* Les temps entre images en histogramme, au dixième de milliseconde (de 0 à 250 ms, au-delà dans la dernière case) : pour
   la médiane, les P95, P99 et P99,9 d'une longue session, sans rien garder image par image */
const PAS = .1, NH = 2500;
const caseDe = ms => Math.min(NH, Math.floor(ms / PAS));
function quantile(h, total, p){
  const but = Math.ceil(p * total);
  let c = 0;
  for(let i = 0; i <= NH; i++){ c += h[i]; if(c >= but) return i === NH ? Infinity : (i + .5) * PAS; }
  return 0;
}
const SEUILS = [16.7, 22.2, 33.3, 50];

/* La session de mesure (mission de Yo, 30 octobre 2026) : 2 ou 5 minutes de jeu (les pauses ne comptent pas), tout est
   cumulé au fil des images dans des tableaux pris une fois au départ ; à la fin, le rapport de la session s'ouvre */
let S = null, derniere = null;
function nouvelleSession(ms){
  const nMin = Math.ceil(ms / 60000);
  const s = {
    duree: ms, debut: performance.now(), joue: 0, images: 0, lieu: lieu(),
    hist: new Uint32Array(NH + 1), minutes: new Uint32Array(nMin * (NH + 1)), minImages: new Uint32Array(nMin), minJoue: new Float64Array(nMin),
    seuils: new Uint32Array(SEUILS.length), pire: 0, seconde: 0, kSeconde: 0, pireSeconde: Infinity,
    trav: 0, travHist: new Uint32Array(NH + 1), travPire: 0,
    gpuN: 0, gpuSomme: 0, gpuHist: new Uint32Array(NH + 1), gpuPire: 0,
    sec: new Float64Array(NS), secPire: new Float32Array(NS), tri: 0, dessins: 0, prog: 0, geo: 0,
    mem: memOk ? {pris, menages, changements} : null,
    gpu(ms){ this.gpuN++; this.gpuSomme += ms; this.gpuHist[caseDe(ms)]++; if(ms > this.gpuPire) this.gpuPire = ms; }
  };
  return s;
}
/* une image de plus dans la session (à la fin de l'image) */
function compterSession(j){
  const dt = DT[j];
  if(!dt) return;
  const s = S, c = caseDe(dt), m = Math.min(s.minImages.length - 1, Math.floor(s.joue / 60000));
  s.joue += dt; s.images++;
  s.hist[c]++; s.minutes[m * (NH + 1) + c]++; s.minImages[m]++; s.minJoue[m] += dt;
  for(let k = 0; k < SEUILS.length; k++) if(dt > SEUILS[k]) s.seuils[k]++;
  if(dt > s.pire) s.pire = dt;
  const sec = Math.floor(s.joue / 1000);                  // la pire seconde de jeu : le moins d'images en une seconde
  if(sec !== s.seconde){ if(s.kSeconde && s.seconde > 0) s.pireSeconde = Math.min(s.pireSeconde, s.kSeconde); s.seconde = sec; s.kSeconde = 0; }
  s.kSeconde++;
  s.trav += TRAV[j]; s.travHist[caseDe(TRAV[j])]++; if(TRAV[j] > s.travPire) s.travPire = TRAV[j];
  for(let k = 0; k < noms.length; k++){ const v = SEC[j * NS + k]; s.sec[k] += v; if(v > s.secPire[k]) s.secPire[k] = v; }
  s.tri += TRI[j]; s.dessins += DES[j]; s.prog += PROG[j]; s.geo += GEO[j];
  if(s.joue >= s.duree) finirSession();
}
export function lancerSession(ms = 120000){
  S = nouvelleSession(ms);
  toast(`⏱️ Mesure de ${Math.round(ms / 60000)} min lancée : joue normalement (marche, tourne la caméra, entre dans la forêt…). Le rapport s'ouvrira tout seul.`, 4200);
  if(actif) afficher();
}
export function finirSession(montrer = true){
  if(!S) return;
  S.fin = performance.now(); S.lieuFin = lieu();
  derniere = S; S = null;
  if(actif) afficher();
  if(montrer) montrerTexte("⏱️ Session de mesure", rapportSession());
}
export const sessionEnCours = () => !!S;

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
  GPU[tete] = -1;
  avant = now;
  if(actif || S) gpuDebut();
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
  if(tete >= 0){ TRI[tete] = tri; DES[tete] = dessins; }
  if(extGpu) gpuFin();
  releverMemoire(fin);
  if(S && tete >= 0) compterSession(tete);
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
/* la régularité des dernières secondes : médiane et P95 à P99,9 des temps entre images, les images au-delà de chaque seuil,
   et le temps de la carte graphique s'il est mesuré */
const TRIEE = new Float32Array(MAX);
export function regularite(sur = GARDE){
  const L = places(sur), nb = L.length;
  for(let k = 0; k < nb; k++) TRIEE[k] = DT[L[k]];
  const v = TRIEE.subarray(0, nb).sort(), q = p => nb ? v[Math.min(nb - 1, Math.ceil(p * nb) - 1)] : 0;
  const seuils = SEUILS.map(s => L.filter(j => DT[j] > s).length);
  let gN = 0, gS = 0, gP = 0;
  for(const j of L) if(GPU[j] >= 0){ gN++; gS += GPU[j]; gP = Math.max(gP, GPU[j]); }
  return {images: nb, p50: q(.5), p95: q(.95), p99: q(.99), p999: q(.999), seuils, gpu: gN ? {moyenne: gS / gN, pire: gP, images: gN} : null};
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
    return {t: T[j], dt: DT[j], travail: TRAV[j], gpu: GPU[j], programmes: PROG[j], formes: GEO[j], s};
  });
}

/* ---------- à l'écran ---------- */
const boite = document.createElement("div");
boite.className = "perf"; boite.id = "perf"; boite.hidden = true;
document.body.appendChild(boite);
const fmt = n => Math.round(n).toLocaleString("fr-FR");
boite.innerHTML = `<div class="perf-chiffres"></div><button class="perf-b" data-rapport>📋 Rapport</button>`
  + ` <button class="perf-b" data-session="120000">⏱️ 2 min</button> <button class="perf-b" data-session="300000">⏱️ 5 min</button>`;   // les boutons restent en place (seuls les chiffres changent)
const chiffres = boite.querySelector(".perf-chiffres");
const minSec = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
function afficher(){
  const m = mesures(3000), sac = mesures().saccades, c = m.ips >= 50 ? "bon" : m.ips >= 30 ? "moyen" : "mauvais";   // les 3 dernières secondes ; les saccades, sur 10 s
  const g = extGpu ? regularite(3000).gpu : null;
  chiffres.innerHTML = `<div class="perf-l ${c}">🎞️ ${m.ips} images/s · ${m.ms.toFixed(0)} ms</div>`
    + `<div class="perf-l">🧠 jeu ${m.travail.toFixed(0)} ms · pire ${m.pire.toFixed(0)} ms</div>`
    + (g ? `<div class="perf-l">🎨 carte graphique ${g.moyenne.toFixed(1)} ms</div>` : "")
    + `<div class="perf-l">🔺 ${fmt(m.triangles)} · ✏️ ${m.dessins} dessins</div>`
    + (sac ? `<div class="perf-l mauvais">⚠️ ${sac} saccade${sac > 1 ? "s" : ""} en 10 s</div>` : "")
    + (S ? `<div class="perf-l">⏱️ mesure ${minSec(S.joue)} / ${minSec(S.duree)} (touche ⏱️ pour finir)</div>` : "");
}
boite.addEventListener("click", e => {
  if(e.target.closest("[data-rapport]")) montrerRapport();
  const b = e.target.closest("[data-session]");
  if(b){ if(S) finirSession(); else lancerSession(+b.dataset.session); }
});
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
function lieu(){
  const p = player.position;
  return `${!isInside() ? "l'île" : LIEUX[currentPlace().b.type] || "dans un bâtiment"} (x ${p.x.toFixed(0)}, z ${p.z.toFixed(0)}), vue ${vuePremiere() ? "à la première personne" : "de dessus"}`;
}
const ms1 = v => v === Infinity ? "plus de 250" : v.toFixed(1).replace(".", ",");
const pct = (k, tot) => tot ? ` (${(100 * k / tot).toFixed(1).replace(".", ",")} %)` : "";
const PAS_DE_GPU = "pas mesurable sur ce navigateur (il ne propose pas le chronomètre de la carte graphique, EXT_disjoint_timer_query_webgl2)";
const ARRONDI = "le navigateur arrondit ses chiffres : ce qui est jeté et les ménages ne se mesurent pas finement ici";
function ligneMemoire(m){
  if(!memOk) return "Mémoire : pas mesurable sur ce navigateur";
  if(!m) return "Mémoire : pas encore assez de relevés";
  return `Mémoire JavaScript : ${m.utilise.toFixed(0)} Mo utilisés` + (changements > 20
    ? ` ; environ ${m.moParSeconde.toFixed(1).replace(".", ",")} Mo jetés par seconde, ${m.menages} ménage${m.menages > 1 ? "s" : ""} de la mémoire en ${m.secondes.toFixed(0)} s`
    : ` (${ARRONDI})`);
}
const pied = () => {
  const pr = renderer.getPixelRatio();
  return [`Écran : ${innerWidth} × ${innerHeight} points, finesse × ${pr} (${fmt(innerWidth * pr)} × ${fmt(innerHeight * pr)} pixels dessinés)`,
    `Téléphone : ${puce()} · ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 120)}`];
};
const virgule = v => String(v).replace(".", ",");
export function rapportPerf(){
  const m = mesures(), d = new Date(), mem = renderer.info.memory, R = regularite();
  const lourds = detail().filter(s => s.pire >= .5).slice(0, 6).map(s => `${s.nom} ${s.moyenne.toFixed(1)} (pire ${s.pire.toFixed(0)})`).join(", ");
  const P = pics(), avecProg = P.filter(x => x.programmes).length, avecFormes = P.filter(x => x.formes).length;
  const pire = P.reduce((a, x) => !a || x.travail > a.travail ? x : a, null);
  return [
    `📋 Rapport de performance · Hearthwild v${VERSION} · ${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}`,
    `Lieu : ${lieu()} ; ${saison()}, ${meteo()}`,
    `Images par seconde : ${m.ips} en moyenne sur 10 s (la pire seconde : ${m.pireSeconde})`,
    `Une image : ${m.ms.toFixed(1)} ms en moyenne, la pire ${m.pire.toFixed(0)} ms ; saccades (plus de ${SACCADE} ms) : ${m.saccades} en 10 s`,
    `Temps entre images (10 s) : médiane ${ms1(R.p50)} ms, P95 ${ms1(R.p95)}, P99 ${ms1(R.p99)}, P99,9 ${ms1(R.p999)} ; au-delà de ${SEUILS.map((s, k) => `${virgule(s)} ms : ${R.seuils[k]}`).join(", ")} (sur ${R.images} images)`,
    `Travail du jeu par image (processeur) : ${m.travail.toFixed(1)} ms, le pire ${m.pireTravail.toFixed(0)} ms`,
    `Carte graphique par image : ${!extGpu ? PAS_DE_GPU : R.gpu ? `${R.gpu.moyenne.toFixed(1)} ms en moyenne, la pire ${R.gpu.pire.toFixed(0)} ms (${R.gpu.images} images mesurées)` : "pas encore de mesure"}`,
    `Détail du travail en ms (moyenne, pire ; « dessin » : la préparation et l'envoi du dessin par le processeur) : ${lourds || "rien de lourd"}`,
    ...(() => { const X = saccades().slice(-6); return X.length ? [`Les saccades : ` + X.map(x => `il y a ${x.il.toFixed(1)} s, ${x.ms.toFixed(0)} ms (jeu ${x.travail.toFixed(0)} ms${x.retour ? ", au retour dans le jeu" : ""})`).join(" ; ")] : []; })(),
    ...(reprise && performance.now() - reprise < GARDE ? [`Le jeu a été mis de côté (une autre application, l'écran éteint) puis repris il y a ${((performance.now() - reprise) / 1000).toFixed(1)} s : la pause n'est pas comptée`] : []),
    `Pics de travail (plus de 33 ms) : ${P.length} en 10 s` + (P.length ? ` ; ${avecProg} avec de nouveaux shaders, ${avecFormes} avec de nouvelles formes ; le pire : ${pire.travail.toFixed(0)} ms (${pire.morceau} ${pire.ms.toFixed(0)} ms)` : ""),
    `Nouveaux en 10 s : ${m.programmes} shaders, ${m.formes} formes envoyées à la carte graphique (tout préparé au chargement en ${fmt(preparation)} ms)`,
    `Dessiné : ${fmt(m.triangles)} triangles, ${m.dessins} dessins ; en mémoire : ${mem.geometries} formes, ${mem.textures} images, ${renderer.info.programs ? renderer.info.programs.length : "?"} shaders`,
    ligneMemoire(memoireDepuis(performance.now() - GARDE)),
    (() => { const s = seriesIci(); return `Petites choses lointaines en série (à la première personne) : ${s.instances} objets en ${s.series} dessins`; })(),
    ...pied()
  ].join("\n");
}
/* le rapport d'une session de mesure (celle en cours, ou la dernière) */
export function rapportSession(){
  const s = S || derniere;
  if(!s || !s.images) return "Pas encore de session de mesure : allume le compteur (touche le numéro de version), puis ⏱️ 2 min ou ⏱️ 5 min.";
  const d = new Date(), nb = s.images, q = p => quantile(s.hist, nb, p), qt = p => quantile(s.travHist, nb, p), qg = p => quantile(s.gpuHist, s.gpuN, p);
  const lourds = noms.map((nom, k) => ({nom, moy: s.sec[k] / nb, pire: s.secPire[k]})).filter(x => x.pire >= .5).sort((a, b) => b.moy - a.moy).slice(0, 8)
    .map(x => `${x.nom} ${x.moy.toFixed(2)} (pire ${x.pire.toFixed(0)})`).join(", ");
  const minutes = [];
  for(let k = 0; k < s.minImages.length; k++){
    const n = s.minImages[k]; if(!n) continue;
    const h = s.minutes.subarray(k * (NH + 1), (k + 1) * (NH + 1));
    minutes.push(`${k + 1}${k ? "e" : "re"} : ${Math.round(1000 * n / s.minJoue[k])} i/s, P95 ${ms1(quantile(h, n, .95))} ms, P99 ${ms1(quantile(h, n, .99))} ms`);
  }
  let mem = "Mémoire : pas mesurable sur ce navigateur";
  if(s.mem){
    const sec = ((s.fin || performance.now()) - s.debut) / 1000, men = menages - s.mem.menages;
    mem = `Mémoire JavaScript : ${(memAvant / 1e6).toFixed(0)} Mo utilisés à la fin` + (changements - s.mem.changements < 20 ? ` (${ARRONDI})`
      : ` ; environ ${virgule(((pris - s.mem.pris) / 1e6 / sec).toFixed(1))} Mo jetés par seconde, ${men} ménage${men > 1 ? "s" : ""} de la mémoire (${(men * 60 / sec).toFixed(0)} par minute)`);
  }
  return [
    `⏱️ Session de mesure · Hearthwild v${VERSION} · ${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}${S ? " (en cours)" : ""}`,
    `Durée : ${minSec(s.joue)} de jeu, ${fmt(nb)} images (les pauses ne comptent pas) ; ${saison()}, ${meteo()}`,
    `Départ : ${s.lieu} ; arrivée : ${s.lieuFin || lieu()}`,
    `Images par seconde : ${Math.round(1000 * nb / s.joue)} en moyenne ; la pire seconde : ${s.pireSeconde === Infinity ? "?" : s.pireSeconde}`,
    `Temps entre images : médiane ${ms1(q(.5))} ms, P95 ${ms1(q(.95))}, P99 ${ms1(q(.99))}, P99,9 ${ms1(q(.999))}, la pire ${s.pire.toFixed(0)} ms`,
    `Images au-delà de ${SEUILS.map((v, k) => `${virgule(v)} ms : ${s.seuils[k]}${pct(s.seuils[k], nb)}`).join(" ; ")}`,
    `Travail du jeu par image (processeur) : ${(s.trav / nb).toFixed(1)} ms en moyenne, P95 ${ms1(qt(.95))}, P99 ${ms1(qt(.99))}, le pire ${s.travPire.toFixed(0)} ms`,
    `Carte graphique par image : ${!extGpu ? PAS_DE_GPU : s.gpuN ? `${(s.gpuSomme / s.gpuN).toFixed(1)} ms en moyenne, P95 ${ms1(qg(.95))}, P99 ${ms1(qg(.99))}, la pire ${s.gpuPire.toFixed(0)} ms (${fmt(s.gpuN)} images mesurées)` : "aucune mesure arrivée"}`,
    `Détail du travail en ms (moyenne, pire ; « dessin » : la préparation et l'envoi du dessin par le processeur) : ${lourds || "rien de lourd"}`,
    `Dessiné en moyenne : ${fmt(s.tri / nb)} triangles, ${Math.round(s.dessins / nb)} dessins par image`,
    `Nouveaux pendant la session : ${s.prog} shaders, ${s.geo} formes envoyées à la carte graphique`,
    mem,
    `Minute par minute : ${minutes.join(" ; ")}`,
    ...pied()
  ].join("\n");
}
function montrerTexte(titre, texte){
  openSheet(`<div class="sh-head"><h2 class="display">${titre}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted">Copie ce texte et colle-le dans ta conversation avec Claude, en disant ce que tu faisais.</p>
    <pre class="perf-rapport">${texte.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
    <button class="btn" data-copier>📋 Copier</button>`);
  const b = wrap.querySelector("[data-copier]");
  b.addEventListener("click", () => {
    const fait = () => { toast("📋 Rapport copié : colle-le dans ta conversation avec Claude", 3000); closeSheet(); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fait, () => toast("Appuie longtemps sur le texte pour le copier", 3000));
    else toast("Appuie longtemps sur le texte pour le copier", 3000);
  });
}
function montrerRapport(){ montrerTexte("📋 Rapport de performance", rapportPerf()); }
