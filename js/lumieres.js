/* ================= Les lumières (demande de Yo, 11 octobre 2026) =================
   Dans les bâtiments, une pénombre (interieurs.js) ; dehors, la nuit. Les meubles qui éclairent (LUMIERE dans
   donnees.js : la chandelle, la lanterne sur pied, le chandelier, les torchères, le feu de camp) éclairent vraiment
   autour d'eux, d'une lumière chaude qui vacille pour les flammes. Pour que le jeu reste fluide sur un téléphone, seules
   les plus proches du personnage ont une vraie lumière (4 dans une pièce, 3 dehors) ; les autres brillent seulement.
   Dehors, elles éclairent surtout la nuit, entourées d'un halo chaud.
   Les torchères (sur pied ou murale) : on y pose une torche, qui ne s'éteint plus jamais (seulement sur son île) ;
   dans une pièce, tout près, le bouton « 🔥 Poser une torche » (#btn-torchere) ; dehors, le bouton d'action (recolte.js).
   Rangée en décoration ou reprise dehors, la torchère rend aussi sa torche.
   Morceau 4 : la lanterne murale et le lampadaire s'allument seuls à la nuit tombée (nuit : leur verre, nuitMat, et leur
   lumière suivent la nuit, dedans comme dehors) ; les lucioles du bocal palpitent ; les lumières accrochées aux façades
   des bâtiments (batiments.js) éclairent l'île comme celles posées sur les cases ; les papillons de nuit viennent
   tourner autour de toutes ces lumières (lumieresIle, insectes.js). */
import { $ } from "./outils.js";
import { MEUBLES, LUMIERE, LUMIERE_MAIN, GARNIS, garniDe, garniNb, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, sacCount } from "./regles.js";
import { scene } from "./monde/scene.js";
import { map, N, centerOf, setEtat, objMesh } from "./monde/ile.js";
import { lumieresDedans, refreshItemMesh } from "./monde/interieurs.js";
import { fireMat, nuitMat, lucioleMat, footOf } from "./monde/meubles.js";
import { lumieresFacades } from "./monde/batiments.js";
import { nuitIci, HALO } from "./monde/ciel.js";
import { player } from "./monde/personnage.js";
import { currentPlace } from "./lieux.js";
import { syncBarre } from "./barre.js";
import { toast, renderHUD } from "./interface.js";

/* Dehors : trois vraies lumières, données aux plus proches */
const lumieresDehors = Array.from({length: 3}, () => new THREE.PointLight(0xFFB070, 0, 6, 1.5));
scene.add(...lumieresDehors);
/* Ce meuble éclaire-t-il ? (une torchère, seulement avec sa torche) : sa lumière, ou null */
const eclaire = (type, o) => { const L = LUMIERE[type]; return L && (!L.torche || (o && o.torche)) && (!L.bougie || (o && o.bougie)) && (MEUBLES[type].support !== "lucioles" || (o && o.lucioles)) && !(o && o.eteint) ? L : null; };   // éteinte (gestes.js) : rien ; le bougeoir, avec sa chandelle
/* Toucher le bocal à lucioles (gestes.js) : elles brillent plus fort un instant */
let eclat = 0;
export function eclatLucioles(){ eclat = 1.6; }

/* Les lumières posées sur l'île (et accrochées aux façades), relevées une fois par seconde, chacune avec son halo (la nuit) */
let ile = [], releve = 0;
export const lumieresIle = () => ile;
const halos = new Map();
const haloMat = new THREE.SpriteMaterial({map: HALO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0});
function releverIle(){
  ile = [];
  for(let i = 0; i < map.obj.length; i++){
    const o = map.obj[i], L = o && LUMIERE[o] && eclaire(o, state.ile[i]);
    if(L) ile.push({x: centerOf(i % N), y: L.y, z: centerOf(Math.floor(i / N)), L, i: "c" + i});
  }
  for(const {x, z, f} of lumieresFacades()){
    const L = eclaire(f.type, f);
    if(L) ile.push({x, y: L.y, z: z + (L.avance || 0), L, i: `f${x},${z}`});
  }
  const vus = new Set(ile.map(s => s.i));
  for(const [i, h] of halos) if(!vus.has(i)){ scene.remove(h); halos.delete(i); }
  for(const s of ile) if(!halos.has(s.i)){
    const h = new THREE.Sprite(haloMat), t = s.L.portee * .32;
    h.scale.set(t, t, 1); h.position.set(s.x, s.y, s.z); scene.add(h); halos.set(s.i, h);
  }
}
/* Les lumières des meubles de la pièce (une torchère murale éclaire un peu devant elle, loin du mur) */
const AVANT = [[0, 1], [-1, 0], [0, -1], [1, 0]];    // le devant d'un meuble selon ses quarts de tour
function sourcesDedans(b){
  const out = [];
  for(const it of (b.deco && b.deco.items) || []){
    const L = eclaire(it.type, it);
    if(!L) continue;
    const [fx, fz] = AVANT[(it.rot || 0) % 4], a = L.avance || 0;
    out.push({x: it.x + fx * a, y: L.y, z: it.z + fz * a, L});
  }
  return out;
}
/* Les vraies lumières vont aux sources qui éclairent le plus autour du personnage (Yo, 8 novembre 2026) : pas seulement les
   plus proches, mais celles dont la lumière arrive le plus près de lui (sa distance, moins la moitié de sa portée : un grand
   feu un peu plus loin passe avant une chandelle toute proche) ; la lumière tenue en main d'abord (sourceEnMain) ;
   facteur : leur force (dehors, plus forte la nuit) ; celles qui s'allument seules à la nuit tombée suivent la nuit
   (éteintes le jour, elles laissent leur place) */
let t = 0, enMain = null;
/* La torche ou la lanterne tenue en main (torche.js) : {x, z, lanterne}, ou null ; ailleurs que dans la grotte et le Marais */
export function sourceEnMain(x, z, lanterne){ enMain = x === null ? null : {x, y: LUMIERE_MAIN[lanterne ? "lanterne" : "torche"].y, z, L: LUMIERE_MAIN[lanterne ? "lanterne" : "torche"], main: true}; }
const ecart = (s, p) => Math.hypot(s.x - p.x, s.z - p.z) - s.L.portee * .5;
function allumer(pool, liste, facteur){
  const p = player.position, n = nuitIci();
  const list = liste.filter(s => !s.L.nuit || n > .05);
  list.sort((a, b) => ecart(a, p) - ecart(b, p));
  if(enMain) list.unshift(enMain);
  pool.forEach((l, k) => {
    const s = list[k];
    if(!s){ if(l.intensity) l.intensity = 0; return; }
    const g = s.x * 7.1 + s.z * 3.3;                 // chaque flamme vacille à sa façon
    const v = s.L.flamme ? 1 + Math.sin(t * 11 + g) * .07 + Math.sin(t * 17.3 + g * 2) * .05
      : s.L.lucioles ? .75 + Math.sin(t * 2.2 + g) * .25 + eclat * .8 : 1;
    l.color.setHex(s.L.couleur); l.distance = s.L.portee; l.position.set(s.x, s.y, s.z);
    l.intensity = s.L.force * (s.L.nuit ? n : s.main ? 1 : facteur) * v;
  });
  return Math.min(list.length, pool.length);
}
const DEDANS_SANS = ["mine", "foret", "grotte", "marais", "trajet"];       // des lieux sans meubles : rien à éclairer ici
let actives = 0;
/* À chaque image (main.js) ; actif : le personnage est libre (pour le bouton de la torchère) */
export function updateLumieres(dt, actif){
  t += dt;
  fireMat.emissiveIntensity = .85 + Math.sin(t * 9) * .12 + Math.sin(t * 14.7) * .06;   // les flammes vacillent
  if(eclat > 0) eclat = Math.max(0, eclat - dt);
  lucioleMat.emissiveIntensity = .55 + Math.sin(t * 2.2) * .4 + eclat * .9;             // les lucioles palpitent (plus fort quand on touche le bocal)
  const place = currentPlace(), n = nuitIci();
  nuitMat.emissiveIntensity = .06 + .94 * n;                                           // le verre des lanternes de nuit
  if(!place){
    if((releve -= dt) <= 0){ releve = 1; releverIle(); }
    actives = allumer(lumieresDehors, ile, .3 + .7 * n);
    haloMat.opacity = n * .75;
    for(const h of halos.values()) h.visible = n > .02;
  } else if(!DEDANS_SANS.includes(place.b.type)) actives = allumer(lumieresDedans, sourcesDedans(place.b), 1);
  else if(["mine", "foret", "trajet"].includes(place.b.type)) actives = allumer(lumieresDehors, [], 1);   // seulement la torche en main
  else actives = 0;
  bouton(actif && place && !DEDANS_SANS.includes(place.b.type) ? place : null);
}
/* Pour la vérification : combien de vraies lumières sont allumées ici */
export const lumieresActives = () => actives;

/* ----- Poser une torche sur une torchère, une chandelle dans un bougeoir ----- */
/* Ce qu'on a de quoi poser sur ce support (une torche ; une chandelle de suif, plus tard une bougie de cire) : sa clé, ou null */
export const garniDispo = type => (GARNIS[MEUBLES[type].support] || []).find(k => owned(k) >= garniNb(type)) || null;
/* Le bouton : « 🔥 Poser une torche sur la torchère », « 🕯️ Poser une chandelle dans le bougeoir » (ou dans la lanterne) */
export const poserLabel = type => MEUBLES[type].support === "lucioles" ? "✨ Mettre 3 lucioles dans le bocal" : MEUBLES[type].support === "bougie" ? `🕯️ Poser ${garniNb(type) > 1 ? garniNb(type) + " chandelles" : "une chandelle"} ${MEUBLES[type].dans}` : "🔥 Poser une torche sur la torchère";
/* o : le support (le meuble de la pièce, ou la case de l'île) ; type : sa sorte ; refaire : refait son modèle (patch : ce qui change) */
export function poserGarni(o, type, refaire){
  const s = MEUBLES[type].support, bougie = s === "bougie", n = garniNb(type), k = garniDispo(type);
  if(!k && s === "lucioles"){ toast("✨ Il te faut 3 lucioles : elles s'attrapent au bocal, les nuits d'été, dans les herbes hautes", 3600); return false; }
  if(!k){ toast(bougie ? (n > 1 ? `🕯️ Il te faut ${n} chandelles : elles se fabriquent` : "🕯️ Il te faut une chandelle : elle se fabrique") + ` à l'atelier de décoration de la Chaumière (1 suif, 1 fibre${n > 1 ? " pour 2" : ""})`
    : "🔥 Il te faut une torche : elle se fabrique à l'établi de la Scierie (1 bois, 2 fibres)", 3600); return false; }
  addOwned(k, -n);
  if(k === "torche" && !sacCount("torche")) state.torche = 0;          // plus de torche sur soi : celle qui brûlait est sur la torchère
  const patch = s === "lucioles" ? {lucioles: n} : bougie ? {bougie: k} : {torche: true};
  Object.assign(o, patch); refaire(patch);
  syncBarre(); save(); renderHUD();
  toast(s === "lucioles" ? "✨ Trois lucioles dans le bocal : elles y brilleront toujours" : bougie ? (n > 1 ? `🕯️ ${n} ${objet(k).pluriel || "chandelles"} posées ${MEUBLES[type].dans} : elles ne s'y useront jamais` : `🕯️ ${objet(k).nom} posée ${MEUBLES[type].dans} : elle ne s'y usera jamais`) : "🔥 Ta torche est posée sur la torchère : elle ne s'éteindra plus jamais", 3400);
  return true;
}
export const poserTorche = (o, refaire) => poserGarni(o, "torchere", refaire);

/* Les chandelles d'avant (Yo, 8 novembre 2026 : le bougeoir vide, la chandelle à poser dedans) : une fois, chaque chandelle
   posée devient un bougeoir garni de sa chandelle de suif ; chaque chandelle du sac, des cases et des coffres, un bougeoir et
   une chandelle (rien ne se perd) ; une chandelle en fabrication devient une chandelle de suif (la même recette) */
if(!state.bougeoirs){
  for(const b of state.buildings){
    for(const it of (b.deco && b.deco.items) || []) if(it.type === "chandelle" && !it.bougie) it.bougie = "chandelleSuif";
    for(const j of (b.atelier && b.atelier.queue) || []) if(j.out === "chandelle") j.out = "chandelleSuif";
  }
  for(const [i, c] of Object.entries(state.ile)) if(c && c.o === "chandelle" && !c.bougie){
    if(objMesh(+i)) setEtat(+i, {bougie: "chandelleSuif"}); else c.bougie = "chandelleSuif"; }   // déjà dessinée : refaite
  const n = owned("chandelle");
  if(n > 0) addOwned("chandelleSuif", n);
  state.bougeoirs = 1; save();
}
/* Les lanternes sur pied d'avant (Yo, 8 novembre 2026 : la lanterne vide, on y pose une chandelle) : une fois, chaque lanterne
   posée reçoit sa chandelle de suif (elle reste allumée) ; chaque lanterne du sac, des cases et des coffres donne aussi une
   chandelle (rien ne se perd) */
if(!state.lanternes){
  for(const b of state.buildings) for(const it of (b.deco && b.deco.items) || []) if(it.type === "lanterne" && !it.bougie) it.bougie = "chandelleSuif";
  for(const [i, c] of Object.entries(state.ile)) if(c && c.o === "lanterne" && !c.bougie){
    if(objMesh(+i)) setEtat(+i, {bougie: "chandelleSuif"}); else c.bougie = "chandelleSuif"; }
  const n = owned("lanterne");
  if(n > 0) addOwned("chandelleSuif", n);
  state.lanternes = 1; save();
}
/* Les bocaux à lucioles d'avant (Yo, 9 novembre 2026 : le bocal vide, on y met trois lucioles) : une fois, chaque bocal posé
   garde ses trois lucioles ; chaque bocal du sac, des cases et des coffres rend aussi ses trois lucioles ; un bocal en
   fabrication sortira vide et rend ses trois lucioles : rien ne se perd */
if(!state.bocaux){
  for(const b of state.buildings){
    for(const it of (b.deco && b.deco.items) || []) if(it.type === "bocalLucioles" && !it.lucioles) it.lucioles = 3;
    for(const j of (b.atelier && b.atelier.queue) || []) if(j.out === "bocalLucioles") addOwned("luciole", 3);
  }
  for(const [i, c] of Object.entries(state.ile)) if(c && c.o === "bocalLucioles" && !c.lucioles){
    if(objMesh(+i)) setEtat(+i, {lucioles: 3}); else c.lucioles = 3; }
  const n = owned("bocalLucioles");
  if(n > 0) addOwned("luciole", 3 * n);
  state.bocaux = 1; save();
}
/* Les lanternes murales d'avant (Yo, 9 novembre 2026 : vide, on y pose une chandelle ; allumée tout le temps) : une fois,
   chaque lanterne murale accrochée (pièces, façades) reçoit sa chandelle de suif ; chaque lanterne murale du sac, des cases et
   des coffres, et chacune en fabrication, rend la chandelle de suif de son ancienne recette */
if(!state.lanternesMurales){
  const refaites = [];
  for(const b of state.buildings){
    for(const it of (b.deco && b.deco.items) || []) if(it.type === "lanterneMurale" && !it.bougie) it.bougie = "chandelleSuif";
    for(const f of b.facade || []) if(f.type === "lanterneMurale" && !f.bougie){ f.bougie = "chandelleSuif"; if(!refaites.includes(b)) refaites.push(b); }
    for(const j of (b.atelier && b.atelier.queue) || []) if(j.out === "lanterneMurale") addOwned("chandelleSuif", 1);
  }
  const n = owned("lanterneMurale");
  if(n > 0) addOwned("chandelleSuif", n);
  state.lanternesMurales = 1; save();
  if(refaites.length) import("./monde/batiments.js").then(m => refaites.forEach(m.placeMesh));   // déjà dessinées : refaites
}
/* Les lustres d'avant (Yo, 9 novembre 2026 : le lustre vide, on y pose cinq chandelles) : une fois, chaque lustre accroché
   reçoit ses cinq chandelles de suif (il reste allumé) ; chaque lustre du sac, des cases et des coffres, et chacun en
   fabrication, donne aussi ses cinq chandelles */
if(!state.lustres){
  for(const b of state.buildings){
    for(const it of (b.deco && b.deco.items) || []) if(it.type === "lustre" && !it.bougie) it.bougie = "chandelleSuif";
    for(const j of (b.atelier && b.atelier.queue) || []) if(j.out === "lustre") addOwned("chandelleSuif", 5);
  }
  const n = owned("lustre");
  if(n > 0) addOwned("chandelleSuif", 5 * n);
  state.lustres = 1; save();
}
/* Dans une pièce, tout près d'une torchère sans torche : le bouton */
const btn = $("#btn-torchere");
let proche = null;
function bouton(place){
  const p = player.position;
  proche = place && place.b.deco ? place.b.deco.items.find(it => {
    if(!MEUBLES[it.type] || !MEUBLES[it.type].support || garniDe(it.type, it)) return false;
    const [w, d] = footOf(it);
    return Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
  }) || null : null;
  if(proche){ const m = MEUBLES[proche.type], txt = `${m.emoji} ${m.nom}`; if(btn.textContent !== txt) btn.textContent = txt; }   // son nom (demande de Yo)
  if(btn.hidden === !!proche) btn.hidden = !proche;
}
btn.addEventListener("click", () => { const it = proche; if(it) poserGarni(it, it.type, () => refreshItemMesh(it)); });
