/* ================= La météo (étape 1.10, morceau 3) =================
   Découpage validé par Yo : beau temps, nuages, pluie, orage rare, neige en hiver ; le temps change toutes les
   quelques heures et dépend de la date : le même pour tous au même moment (il se tire de l'heure universelle, par
   tranches de 3 heures, sans hasard du téléphone) ; pluie environ un quart du temps. La saison (donc la neige) suit
   l'hémisphère du joueur. Dehors et dans la Forêt profonde : la pluie tombe, la neige flotte, le ciel se couvre,
   l'orage fait des éclairs ; rien dans les maisons, la mine ni la grotte. */
import { saisonDu } from "../donnees.js";

export const PERIODE = 3 * 3600e3;
export const METEO = {
  beau:   {nom: "Beau temps", emoji: "☀️", nuit: "🌙", couvert: 0},
  nuages: {nom: "Nuageux", emoji: "⛅", nuit: "☁️", couvert: .3},
  pluie:  {nom: "Pluie", emoji: "🌧️", couvert: .55, pluie: 1},
  orage:  {nom: "Orage", emoji: "⛈️", couvert: .78, pluie: 1.4},
  neige:  {nom: "Neige", emoji: "🌨️", couvert: .38, neige: 1}
};
/* Un nombre entre 0 et 1 pour chaque tranche de 3 heures, le même sur tous les téléphones */
function hache(n){
  let x = Math.imul(n ^ 0x5BD1E995, 0x9E3779B1); x ^= x >>> 15;
  x = Math.imul(x, 0x85EBCA77); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE3D); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
/* Le temps qu'il fait à un instant (en millisecondes) : beau 46 %, nuages 26 %, pluie 24 %, orage 4 % ;
   l'hiver, la neige prend la place de presque toute la pluie et de l'orage */
export function meteoA(t){
  const r = hache(Math.floor(t / PERIODE)), hiver = saisonDu(new Date(t)) === "hiver";
  if(r < .46) return "beau";
  if(r < .72) return "nuages";
  if(hiver) return r < .9 || r >= .96 ? "neige" : "pluie";
  return r < .96 ? "pluie" : "orage";
}
let forcee = null;
export const forcerMeteo = m => { forcee = m; };             // pour la vérification et les essais (null : la vraie)
export const meteo = () => forcee || meteoA(Date.now());
export const mouille = (m = meteo()) => m === "pluie" || m === "orage";
/* La pluie arrose (étape 1.10, morceau 4) : le premier moment de pluie (ou d'orage) depuis t0, jusqu'à maintenant (même
   jeu fermé), ou null */
export function pluieDepuis(t0){
  const now = Date.now(), k1 = Math.floor(now / PERIODE);
  for(let k = Math.max(Math.floor(t0 / PERIODE), k1 - 3000); k <= k1; k++){
    if(mouille(k === k1 ? meteo() : meteoA(k * PERIODE))) return Math.max(t0, k * PERIODE);
  }
  return null;
}
/* La neige au sol (étape 1.10, morceau 4) : elle blanchit l'herbe pendant qu'il neige, et encore 3 heures après ;
   la pluie la fait fondre. 0 : pas de neige ; 1 : tout blanc (ile.js) */
let neigeSol = -1;                                           // -1 : pas encore calculée (au démarrage, elle est déjà là)
export const neigeAuSol = () => Math.max(0, neigeSol);
function neigeCible(){
  const m = meteo();
  if(m === "neige") return 1;
  if(mouille(m) || saisonDu(new Date()) !== "hiver") return 0;
  return meteoA(Date.now() - PERIODE) === "neige" ? 1 : 0;
}
/* Les prochaines tranches : [{debut, fin, m}], la première est celle de maintenant */
export function previsions(n){
  const k0 = Math.floor(Date.now() / PERIODE), out = [];
  for(let k = 0; k < n; k++){ const d = (k0 + k) * PERIODE; out.push({debut: d, fin: d + PERIODE, m: k === 0 ? meteo() : meteoA(d)}); }
  return out;
}

/* ----- Ce qui se voit : la pluie (des traits), la neige (des flocons), autour de ce que regarde la caméra ----- */
const L = 24, HAUT = 13, NP = 800, NN = 600;
const alea = (a, b) => a + Math.random() * (b - a);
const gp = new THREE.BufferGeometry(), pp = new Float32Array(NP * 6);
for(let k = 0; k < NP; k++){ const x = alea(-L/2, L/2), y = alea(0, HAUT), z = alea(-L/2, L/2); pp.set([x, y, z, x + .07, y - .62, z], k * 6); }
gp.setAttribute("position", new THREE.BufferAttribute(pp, 3));
const pluie = new THREE.LineSegments(gp, new THREE.LineBasicMaterial({color: 0xD2E2F0, transparent: true, opacity: .75, depthWrite: false}));
const gn = new THREE.BufferGeometry(), pn = new Float32Array(NN * 3), phase = new Float32Array(NN);
for(let k = 0; k < NN; k++){ pn.set([alea(-L/2, L/2), alea(0, HAUT), alea(-L/2, L/2)], k * 3); phase[k] = Math.random() * 6.28; }
gn.setAttribute("position", new THREE.BufferAttribute(pn, 3));
const neige = new THREE.Points(gn, new THREE.PointsMaterial({color: 0xFFFFFF, size: .22, transparent: true, opacity: .95, depthWrite: false}));
const groupe = new THREE.Group();
groupe.add(pluie, neige);
for(const o of [pluie, neige]){ o.frustumCulled = false; o.renderOrder = 2; }

let couv = 0, force = 0, flocons = 0, eclair = 0, prochain = 8, ici = null;
export const couvertIci = () => couv;                       // 0 : ciel dégagé ; 1 : très couvert (ciel.js)
export const eclairIci = () => eclair;                      // un éclair : 1, puis s'éteint (ciel.js)
/* À chaque image (main.js) ; ou : la scène où il fait ce temps (l'île ou la forêt), ou null (dedans, sous terre) */
export function updateMeteo(dt, ou, cx, cz){
  const info = METEO[meteo()];
  const v = Math.min(1, dt * .5);                           // le temps change en douceur
  couv += ((ou ? info.couvert : 0) - couv) * v;
  force += ((ou && info.pluie || 0) - force) * v;
  flocons += ((ou && info.neige || 0) - flocons) * v;
  const nc = neigeCible();                                  // la neige au sol, même quand on est dedans
  neigeSol = neigeSol < 0 ? nc : neigeSol + (nc - neigeSol) * Math.min(1, dt * .12);
  if(ici !== ou){ if(groupe.parent) groupe.parent.remove(groupe); if(ou) ou.add(groupe); ici = ou; }
  if(!ou) return;
  groupe.position.set(cx, 0, cz);
  /* la pluie : des traits qui tombent vite et retombent en haut */
  const np = Math.round(Math.min(1, force / 1.4) * NP);
  pluie.visible = np > 0; gp.setDrawRange(0, np * 2);
  for(let k = 0; k < np; k++){
    const j = k * 6;
    let y = pp[j + 1] - dt * 15;
    if(y < 0){ y += HAUT; pp[j] = alea(-L/2, L/2); pp[j + 2] = alea(-L/2, L/2); }
    pp[j + 1] = y; pp[j + 3] = pp[j] + .07; pp[j + 4] = y - .62; pp[j + 5] = pp[j + 2];
  }
  if(np) gp.attributes.position.needsUpdate = true;
  /* la neige : des flocons qui descendent doucement en se balançant */
  const nn = Math.round(Math.min(1, flocons) * NN);
  neige.visible = nn > 0; gn.setDrawRange(0, nn);
  for(let k = 0; k < nn; k++){
    const j = k * 3;
    phase[k] += dt * 1.3;
    let y = pn[j + 1] - dt * 1.1;
    if(y < 0){ y += HAUT; pn[j] = alea(-L/2, L/2); pn[j + 2] = alea(-L/2, L/2); }
    pn[j + 1] = y; pn[j] += Math.sin(phase[k]) * dt * .35;
  }
  if(nn) gn.attributes.position.needsUpdate = true;
  /* l'orage : un éclair de temps en temps */
  eclair = Math.max(0, eclair - dt * 4);
  if(meteo() === "orage" && (prochain -= dt) < 0){ eclair = 1; prochain = alea(6, 16); }
}
