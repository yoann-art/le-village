/* ================= Les sons du jeu =================
   Étape 1 des sons (demande de Yo, 31 octobre 2026 : « un son pour chaque chose qui le mérite » ; la liste complète dans
   le document « Les sons du jeu », https://claude.ai/artifact/XXaqvJGFDoojdDXZ3SaQ7S). De vrais enregistrements libres
   de droits (CC0 : Kenney, voir sons/LISEZMOI.txt), choisis par Claude, validés par Yo en jouant.
   - Le moteur (Web Audio) : trois voies, les bruitages, l'ambiance et la musique (plus tard), sous un volume général.
     Le téléphone n'accepte le son qu'après un premier toucher : le moteur se réveille au premier geste ; il se tait
     quand le jeu est caché (autre appli, écran éteint) et reprend au retour.
   - Chaque son est téléchargé et décodé au chargement, une seule fois : en jouant, rien n'est préparé (la règle de la
     fluidité) ; un son est un tampon déjà prêt qu'on relance, avec un peu de hasard dans la hauteur pour qu'il ne
     sonne pas comme une machine.
   - Le réglage (le bouton 🔊 en haut à droite) : trois curseurs et « couper le son », gardés sur le téléphone
     (localStorage, à part de la partie : une partie neuve garde le réglage).
   - L'interface : chaque bouton fait un petit clic, sauf celui qui a son propre son (le sac, le coffre…) ; un message
     sonne selon ce qu'il dit (un gain, un refus, un « c'est prêt »…), voir sonDuMessage. */
import { $ } from "./outils.js";

/* fichier, volume (pour que tous sonnent à peu près aussi fort), voie */
export const SONS = {
  clic:       {f: "interface/clic",       v: .55},
  choisir:    {f: "interface/choisir",    v: .4},
  ouvrir:     {f: "interface/ouvrir",     v: .22},
  fermer:     {f: "interface/fermer",     v: .2},
  sac:        {f: "interface/sac",        v: .7},
  sacFerme:   {f: "interface/sacFerme",   v: .8},
  page:       {f: "interface/page",       v: 1},
  ramasser:   {f: "interface/ramasser",   v: .45},
  message:    {f: "interface/message",    v: .22},
  refus:      {f: "interface/refus",      v: .4},
  pieces:     {f: "interface/pieces",     v: .9},
  payer:      {f: "interface/payer",      v: 1},
  etoile:     {f: "interface/etoile",     v: .35},
  pret:       {f: "interface/pret",       v: .25},
  fini:       {f: "interface/fini",       v: .28},
  nouveau:    {f: "interface/nouveau",    v: .4},
  coffre:     {f: "interface/coffre",     v: .8},
  casse:      {f: "interface/casse",      v: .45},
  porte:      {f: "interface/porte",      v: .55},
  porteFerme: {f: "interface/porteFerme", v: .5}
};

/* ----- Le réglage, gardé sur le téléphone ----- */
const CLE = "hearthwild-sons";
export const reglage = {general: .8, bruitages: 1, ambiance: .8, musique: .8, coupe: false};
try{ Object.assign(reglage, JSON.parse(localStorage.getItem(CLE) || "{}")); }catch(_){}
const garder = () => { try{ localStorage.setItem(CLE, JSON.stringify(reglage)); }catch(_){} };

/* ----- Le moteur ----- */
const Ctx = window.AudioContext || window.webkitAudioContext;
const ctx = Ctx ? new Ctx() : null;
const voies = {};
let general = null;
if(ctx){
  general = ctx.createGain(); general.connect(ctx.destination);
  for(const v of ["bruitages", "ambiance", "musique"]){ voies[v] = ctx.createGain(); voies[v].connect(general); }
}
function appliquer(){
  if(!ctx) return;
  general.gain.value = reglage.coupe ? 0 : reglage.general;
  for(const v in voies) voies[v].gain.value = reglage[v];
}
appliquer();

/* Les tampons, décodés au chargement ; etat.prets : combien sont prêts (la vérification le lit) */
const tampons = {};
export const etat = {total: Object.keys(SONS).length, prets: 0, erreurs: [], joues: []};
export const charges = !ctx ? Promise.resolve() : Promise.all(Object.entries(SONS).map(([k, s]) =>
  fetch(`sons/${s.f}.ogg`).then(r => { if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(a => new Promise((ok, ko) => ctx.decodeAudioData(a, ok, ko)))
    .then(b => { tampons[k] = b; etat.prets++; })
    .catch(e => { etat.erreurs.push(k); console.warn("son", k, e); })));

/* Le premier geste réveille le son ; caché, le jeu se tait */
let eveille = false;
function reveiller(){
  if(!ctx || document.hidden) return;
  if(ctx.state !== "running") ctx.resume().then(() => { eveille = true; }, () => {});
  else eveille = true;
}
for(const ev of ["pointerdown", "touchend", "keydown"]) window.addEventListener(ev, reveiller, {capture: true, passive: true});
document.addEventListener("visibilitychange", () => {
  if(!ctx) return;
  if(document.hidden) ctx.suspend().catch(() => {}); else if(eveille) ctx.resume().catch(() => {});
});

/* Jouer un son : vol (multiplie son volume), hauteur (1 : la vraie). Le même son relancé dans les 60 ms ne sonne
   qu'une fois (plusieurs messages d'un coup) ; dernier : l'heure du dernier son (le clic des boutons s'efface devant
   le son propre d'un bouton) */
const derniers = {};
let dernier = 0;
export function jouer(k, {vol = 1, hauteur = 1, voie = "bruitages", discret = false} = {}){
  const s = SONS[k], b = tampons[k], maintenant = performance.now();
  if(!s || discret && maintenant - dernier < 80) return;          // un son discret se tait si un autre vient de sonner
  dernier = maintenant;
  etat.joues.push(k); if(etat.joues.length > 12) etat.joues.shift();   // les derniers sons demandés (la vérification les lit)
  if(!ctx || !b || reglage.coupe || ctx.state !== "running") return;
  const t = ctx.currentTime;
  if(derniers[k] && t - derniers[k] < .06) return;
  derniers[k] = t;
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = b;
  src.playbackRate.value = hauteur * (.96 + Math.random() * .08);
  g.gain.value = s.v * vol;
  src.connect(g).connect(voies[voie]);
  src.start();
}

/* Les boutons : un petit clic, joué juste après le geste, sauf si le bouton a déjà fait son propre son ; les cases
   rapides ont le leur (on choisit un outil) */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("button, .btn, [data-close]");
  if(!b || b.disabled) return;
  const t = performance.now();
  setTimeout(() => { if(dernier < t) jouer(b.classList.contains("case") ? "choisir" : "clic"); }, 0);
}, true);

/* Ce que dit un message, pour choisir son son (interface.js, toast) : on lit le message plutôt que de toucher aux
   deux cents endroits qui en envoient un */
export function sonDuMessage(msg){
  const m = String(msg);
  if(/plein|pleins|Plus de place/.test(m)) return "refus";
  if(/Il te faut|il te manque|Il te manque|Pas encore|Plus de flèches|est vide|Aucun |Trop vite|Raté/.test(m)) return "refus";
  if(/s'est cassé|est cassée?\b/.test(m)) return "casse";
  if(/Nouveau|Nouvelle|nouveau trophée|Nouveau trophée/.test(m)) return "nouveau";
  if(/ construit| amélioré au niveau|est prête, amarrée/.test(m)) return "fini";
  if(/c'est prêt|C'est prêt|nouveau sac est prêt/.test(m)) return "pret";
  if(/\+\d/.test(m)) return "ramasser";
  return "message";
}

/* ----- Le réglage : le bouton 🔊 et son panneau ----- */
const CURSEURS = [["general", "Volume général"], ["bruitages", "Bruitages"], ["ambiance", "Ambiance (bientôt)"], ["musique", "Musique (bientôt)"]];
export function htmlReglage(){
  return `<div class="sh-head"><h2 class="display">🔊 Le son</h2><button class="btn ghost" data-close>Fermer</button></div>
    <div class="sons-reglage">
      ${CURSEURS.map(([k, nom]) => `<label class="son-ligne"><span>${nom}</span><input type="range" min="0" max="100" step="5" data-son="${k}" value="${Math.round(reglage[k] * 100)}" aria-label="${nom}"><b>${Math.round(reglage[k] * 100)}</b></label>`).join("")}
      <label class="son-ligne coupe"><input type="checkbox" data-son="coupe"${reglage.coupe ? " checked" : ""}> <span>Couper le son</span></label>
    </div>`;
}
document.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.son;
  if(!k) return;
  if(k === "coupe") reglage.coupe = e.target.checked;
  else { reglage[k] = e.target.value / 100; const b = e.target.parentElement.querySelector("b"); if(b) b.textContent = e.target.value; }
  appliquer(); garder();
  if(k !== "coupe" && k !== "ambiance" && k !== "musique") jouer("clic");   // pour entendre le volume choisi
});
/* Remettre un réglage (la vérification remet celui de Yo après son essai) */
export function reglerSon(r){ Object.assign(reglage, r); appliquer(); garder(); const b = $("#btn-son"); if(b) b.classList.toggle("coupe", reglage.coupe); }
export function boutonSon(ouvrir){
  const b = $("#btn-son");
  if(!b) return;
  const montrer = () => b.classList.toggle("coupe", reglage.coupe);
  montrer();
  b.addEventListener("click", () => ouvrir(htmlReglage()));
  document.addEventListener("change", e => { if(e.target.dataset && e.target.dataset.son === "coupe") montrer(); });
}
