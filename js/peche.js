/* ================= La pêche (étape 1.6) =================
   La canne en main (ou dans le sac, mains libres), face à la mer ou à l'étang : « 🎣 Lancer » (voir recolte.js).
   Le bouchon part au bout du fil et flotte. On attend (PECHE.attente) : il frémit parfois pour rien, puis il
   plonge : le téléphone vibre et le bouton devient « ❗ Ferrer ! » pendant PECHE.fenetre seconde.
   - À temps : un poisson du lieu, de l'heure et de la saison du téléphone (POISSONS, selon sa rareté) va dans
     le sac ; le personnage le montre au-dessus de sa tête. Le carnet garde chaque espèce prise, combien, et
     le plus gros (state.carnet.poissons = {k: {n, max}}).
   - Trop tôt ou trop tard : il s'échappe (décidé par Yo) ; on relance aussitôt, rien n'est perdu.
   Bouger, lâcher la canne ou ouvrir un panneau remonte la ligne. Sac plein : on ne pêche pas. */
import { scene } from "./monde/scene.js";
import { G, part } from "./monde/formes.js";
import { POISSONS, HEURES, PECHE, OUTILS, SAC } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace } from "./regles.js";
import { map, idx, inb, tileOf, lieuEau } from "./monde/ile.js";
import { player, pencheMain, dir4 } from "./monde/personnage.js";
import { jv, keys } from "./commandes.js";
import { toast } from "./interface.js";

/* ----- Quels poissons mordent ici et maintenant (vraie horloge du téléphone, hémisphère nord) ----- */
const SAISON = ["hiver", "hiver", "printemps", "printemps", "printemps", "ete", "ete", "ete", "automne", "automne", "automne", "hiver"];
export const saisonDe = d => SAISON[d.getMonth()];
export function presents(lieu, d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60;
  return Object.keys(POISSONS).filter(k => { const p = POISSONS[k];
    return p.lieu === lieu && p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b); });
}
/* Le poisson qui mord : d'abord une rareté (PECHE.poids, parmi celles présentes), puis une espèce ; sa taille
   penche vers les petites (les gros sont plus rares) */
function tirer(lieu){
  const par = {};
  presents(lieu).forEach(k => { const r = POISSONS[k].rarete; (par[r] = par[r] || []).push(k); });
  const rangs = Object.keys(par);
  let x = Math.random() * rangs.reduce((n, r) => n + PECHE.poids[r], 0);
  const r = rangs.find(r => (x -= PECHE.poids[r]) < 0) || rangs[0];
  const k = par[r][Math.floor(Math.random() * par[r].length)], [a, b] = POISSONS[k].taille;
  return {k, cm: Math.round(a + (b - a) * Math.random() ** 1.6)};
}
const leNom = (k, maj) => { const p = POISSONS[k], s = p.rarete === "legendaire" ? `la ${p.nom}` : `${p.une ? "une" : "un"} ${p.nom.toLowerCase()}`;
  return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Le bouchon, le fil, les ronds dans l'eau, le poisson montré ----- */
const EAU = -.2;                                          // le niveau de l'eau (voir monde/ile.js)
const bouchon = new THREE.Group();
bouchon.add(part(G.head, 0xF4EFE6, .5, .5, .5, 0, 0, 0));
bouchon.add(part(G.hair, 0xE4574C, .52, .52, .52, 0, 0, 0));
bouchon.add(part(G.cyl, 0x1C2230, .025, .12, .025, 0, .17, 0));
bouchon.visible = false; scene.add(bouchon);
const NF = 14;
const fil = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length: NF}, () => new THREE.Vector3())),
  new THREE.LineBasicMaterial({color: 0xF4EFE6}));
fil.frustumCulled = false; fil.visible = false; scene.add(fil);
const rondMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false});
const rond = new THREE.Mesh(new THREE.RingGeometry(.1, .15, 24), rondMat);
rond.rotation.x = -Math.PI/2; rond.visible = false; scene.add(rond);
let rondT = 9;
function remous(x, z){ rond.position.set(x, EAU + .03, z); rondT = 0; rond.visible = true; }
/* Le modèle d'un poisson, de côté (style jouet) ; plus gros selon sa taille */
export function poissonMesh(k, cm){
  const p = POISSONS[k], g = new THREE.Group();
  const lx = p.forme === "long" ? 1.6 : 1.25, ly = lx * ({long: .25, fin: .4, rond: .72}[p.forme] || .52), demi = .24 * lx;
  const m = p.rarete === "legendaire" ? new THREE.MeshLambertMaterial({color: p.couleur, emissive: 0x6B4A00}) : p.couleur;
  g.add(part(G.head, m, lx, ly, .55, 0, 0, 0));                                       // le corps
  const queue = part(G.cone, m, .9 * ly, .26, .14, demi + .1, 0, 0); queue.rotation.z = Math.PI/2; g.add(queue);
  const dos = part(G.cone, m, .3, .14, .06, -.02, .24 * ly * .9, 0); g.add(dos);      // la nageoire du dos
  for(const z of [-.12, .12]) g.add(part(G.eye, 0x1C2230, 1.3, 1.3, 1.3, -demi * .62, .24 * ly * .25, z));
  g.scale.setScalar(.65 + Math.min(1.4, cm / 100) * .55);
  return g;
}

/* ----- La ligne en cours ----- */
let ligne = null;          // {phase: "vol" | "attente" | "touche" | "montre", t, T, de, a, lieu, reste, frem, fremi, poisson}
export const enPeche = () => !!ligne;
const canneEnMain = () => state.main && OUTILS[state.main] && OUTILS[state.main].famille === "canne";
const bouge = () => jv.x || jv.z || keys.u || keys.d || keys.l || keys.r;
/* Le téléphone vibre (seulement après un vrai toucher de l'écran : sinon le navigateur proteste) */
const vibre = ms => { try{ const u = navigator.userActivation; if(navigator.vibrate && (!u || u.hasBeenActive)) navigator.vibrate(ms); }catch(_){} };
const bout = new THREE.Vector3();
function boutDeCanne(){
  const o = player.getObjectByName("bout");
  if(o) o.getWorldPosition(bout); else bout.set(player.position.x, .9, player.position.z);
  return bout;
}
/* Le sac a-t-il la place pour un poisson ? (un emplacement libre, ou une pile de poissons pas pleine) */
const sacOk = () => state.sac.length < SAC.places || state.sac.some(it => POISSONS[it.k] && it.n < SAC.pile);

/* Lancer, face à l'eau (t : la case d'eau visée par recolte.js) */
export function lancer(t){
  if(ligne) return;
  if(!sacOk()){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve avant de pêcher", 3400); return; }
  /* Où tombe le bouchon : dans l'eau, droit devant, entre le bord et 2,2 P */
  const d = dir4(), p = player.position;
  let s0 = null, s1 = null;
  for(let s = .5; s <= 3.01; s += .1){
    const tx = tileOf(p.x + d.x * s), tz = tileOf(p.z + d.z * s);
    if(!inb(tx, tz) || map.type[idx(tx, tz)] === "water"){ if(s0 === null) s0 = s; s1 = s; }
    else if(s0 !== null) break;
  }
  if(s0 === null) return;
  const s = Math.max(s0 + .15, Math.min(2.2, s1 - .15));
  const reste = PECHE.attente[0] + Math.random() * (PECHE.attente[1] - PECHE.attente[0]);
  /* De 0 à 3 frémissements pour rien, avant la vraie touche */
  const frem = [];
  for(let n = Math.floor(Math.random() * 4); n > 0; n--){ const f = .8 + Math.random() * (reste - 1.6); if(f > .8 && frem.every(g => Math.abs(g - f) > .7)) frem.push(f); }
  ligne = {phase: "vol", t: 0, T: 0, de: boutDeCanne().clone(), a: new THREE.Vector3(p.x + d.x * s, EAU, p.z + d.z * s),
    lieu: lieuEau(t.i), reste, frem: frem.sort((a, b) => a - b), fremi: -9};
  bouchon.position.copy(ligne.de); bouchon.visible = true; fil.visible = true;
}
/* Remonter la ligne (un message si besoin) */
function remonter(msg){
  if(ligne && ligne.poisson) scene.remove(ligne.poisson);
  ligne = null;
  bouchon.visible = false; fil.visible = false;
  pencheMain();
  if(msg) toast(msg, 2200);
}
function ferrer(){
  const {k, cm} = tirer(ligne.lieu);
  if(sacPlace(k) < 1){ remonter(`🎒 Ton sac est plein : tu relâches ${leNom(k)}`); return; }
  sacAdd(k, 1);
  const c = state.carnet.poissons, e = c[k] || (c[k] = {n: 0, max: 0});
  const nouveau = !e.n, record = e.n > 0 && cm > e.max;
  e.n++; e.max = Math.max(e.max, cm);
  save();
  vibre(60);
  /* Le personnage montre le poisson au-dessus de sa tête */
  ligne.phase = "montre"; ligne.t = 0;
  ligne.poisson = poissonMesh(k, cm); scene.add(ligne.poisson);
  bouchon.visible = false; fil.visible = false;
  remous(ligne.a.x, ligne.a.z);
  const nom = `${leNom(k, true)} de ${cm} cm !`;
  toast(POISSONS[k].rarete === "legendaire" ? `✨ ${nom} Un poisson légendaire, dans ton sac`
    : nouveau ? `🐟 ${nom} Nouveau poisson pour ton carnet, dans ton sac`
    : record ? `🐟 ${nom} C'est ton record, dans ton sac`
    : `🐟 ${nom} Dans ton sac`, 3200);
}

/* Le bouton d'action pendant la pêche (recolte.js l'affiche) ; alerte : le bouton « Ferrer » se fait voir */
const rien = () => {};
export function pecheAction(){
  if(!ligne) return null;
  if(ligne.phase === "vol") return {label: "🎣 …", run: rien};
  if(ligne.phase === "attente") return {label: "🎣 Remonter la ligne", run: () => { if(ligne && ligne.phase === "attente")
    remonter(ligne.T - ligne.fremi < .6 ? "🐟 Trop tôt : le poisson s'est méfié. Attends qu'il tire vraiment !" : "🎣 Ligne remontée"); }};
  if(ligne.phase === "touche") return {label: "❗ Ferrer !", run: () => { if(ligne && ligne.phase === "touche") ferrer(); }, alerte: true};
  return null;
}

/* À chaque image : le vol du bouchon, l'attente, la touche, le poisson montré */
const tmp = new THREE.Vector3(), creux = new THREE.Vector3();
export function updatePeche(dt, actif){
  if(rondT < .7){ rondT += dt; const f = rondT / .7; rond.scale.setScalar(1 + f * 3); rondMat.opacity = .8 * (1 - f); if(f >= 1) rond.visible = false; }
  if(!ligne) return;
  if(!actif || bouge() || !canneEnMain()){ remonter(); return; }
  ligne.t += dt; ligne.T += dt;
  const L = ligne;
  if(L.phase === "vol"){
    const u = Math.min(1, L.t / .45);
    pencheMain(u < .3 ? .35 - 1.1 * u / .3 : -.75 + 1.7 * (u - .3) / .7);           // la canne part en arrière, puis en avant
    bouchon.position.lerpVectors(L.de, L.a, u); bouchon.position.y += Math.sin(u * Math.PI) * .9;
    if(u >= 1){ L.phase = "attente"; L.t = 0; remous(L.a.x, L.a.z); }
  } else if(L.phase === "attente"){
    let y = EAU + .02 + Math.sin(L.T * 2.6) * .012;
    if(L.frem.length && L.t >= L.frem[0]){ L.frem.shift(); L.fremi = L.T; vibre(25); }
    const df = L.T - L.fremi;
    if(df < .35) y -= Math.sin(df / .35 * Math.PI) * .05;                              // il frémit : un petit plongeon
    bouchon.position.set(L.a.x, y, L.a.z);
    if(L.t >= L.reste){ L.phase = "touche"; L.t = 0; vibre(300); remous(L.a.x, L.a.z); }
  } else if(L.phase === "touche"){
    bouchon.position.set(L.a.x + Math.sin(L.T * 40) * .03, EAU - .12, L.a.z);            // il plonge et tire
    if(L.t >= PECHE.fenetre){ remonter("🐟 Trop tard : le poisson s'est échappé. Relance !"); return; }
  } else if(L.phase === "montre"){
    const u = Math.min(1, L.t / .25);
    pencheMain(.35 - .9 * (1 - u));
    L.poisson.position.set(player.position.x, .7 + .75 * u, player.position.z + .05);
    L.poisson.rotation.z = Math.sin(L.t * 9) * .18 * Math.max(0, 1 - L.t / 1.4);
    if(L.t >= 1.9) remonter();
    return;
  }
  /* Le fil, du bout de la canne au bouchon, qui pend un peu (tendu pendant la touche) */
  const A = boutDeCanne(), B = bouchon.position, pend = L.phase === "touche" ? .02 : L.phase === "vol" ? .05 : .22;
  const pos = fil.geometry.attributes.position;
  for(let n = 0; n < NF; n++){
    const f = n / (NF - 1);
    tmp.lerpVectors(A, B, f); creux.set(0, -pend * 4 * f * (1 - f), 0); tmp.add(creux);
    pos.setXYZ(n, tmp.x, tmp.y, tmp.z);
  }
  pos.needsUpdate = true;
}
