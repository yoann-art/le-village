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
import { MEUBLES, LUMIERE, LUMIERE_MAIN, GARNIS, garniDe, garniNb, garniPose, garniPlein, unAUn, objet, BUCHE, resteFeu, FLEURS, POISSONS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, sacCount } from "./regles.js";
import { scene } from "./monde/scene.js";
import { map, N, centerOf, setEtat, objMesh } from "./monde/ile.js";
import { lumieresDedans, refreshItemMesh } from "./monde/interieurs.js";
import { fireMat, nuitMat, lucioleMat, footOf, nagerAquariums } from "./monde/meubles.js";
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
const eclaire = (type, o) => { const L = LUMIERE[type]; return L && (!L.torche || (o && o.torche)) && (!L.bougie || (o && o.bougie)) && (!L.buche || resteFeu(o) > 0) && (MEUBLES[type].support !== "lucioles" || (o && o.lucioles)) && !(o && o.eteint) ? (MEUBLES[type].support === "bougie" && unAUn(type) ? selonChandelles(type, o, L) : L) : null; };   // la cheminée : tant que ses bûches brûlent   // éteinte (gestes.js) : rien ; le bougeoir, avec sa chandelle
/* Le chandelier, le lustre : la lumière grandit avec chaque chandelle posée (Yo, 9 novembre 2026) ; sa force suit le nombre
   de chandelles, sa portée un peu moins (une seule chandelle éclaire encore autour d'elle) */
const partielles = new Map();
function selonChandelles(type, o, L){
  const nb = garniNb(type), c = garniPose(type, o);
  if(c >= nb) return L;
  const cle = type + c;
  if(!partielles.has(cle)){ const f = c / nb; partielles.set(cle, {...L, force: L.force * f, portee: L.portee * (.55 + .45 * f)}); }
  return partielles.get(cle);
}
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
    out.push({x: it.x + fx * a, y: L.y + (it.y || 0), z: it.z + fz * a, L});   // sur une table : plus haut
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
  bruler(place, dt);
  nagerAquariums(t);                                                // les poissons des aquariums (meubles.js)
}
/* Pour la vérification : combien de vraies lumières sont allumées ici */
export const lumieresActives = () => actives;

/* ----- Poser une torche sur une torchère, une chandelle dans un bougeoir ----- */
/* Ce qu'on a de quoi poser sur ce support (une torche ; une chandelle de suif, plus tard une bougie de cire) : sa clé, ou null */
export const garniDispo = type => MEUBLES[type].support === "fleur" && FLEURS[state.main] && owned(state.main) > 0 ? state.main   // le pot : la fleur tenue en main d'abord
  : MEUBLES[type].support === "poisson" && POISSONS[state.main] && owned(state.main) > 0 ? state.main   // l'aquarium : le poisson tenu en main d'abord
  : (GARNIS[MEUBLES[type].support] || []).find(k => owned(k) >= (unAUn(type) ? 1 : garniNb(type))) || null;   // le chandelier, le lustre : une à la fois
/* Le bouton : « 🔥 Poser une torche sur la torchère », « 🕯️ Poser une chandelle dans le bougeoir » (ou dans la lanterne) */
export const poserLabel = type => MEUBLES[type].support === "poisson" ? (k => `🐟 Mettre ${k ? `${POISSONS[k].une ? "une" : "un"} ${POISSONS[k].nom.toLowerCase()}` : "un poisson"} ${MEUBLES[type].dans}`)(garniDispo(type))
  : MEUBLES[type].support === "fleur" ? (k => `🌸 ${MEUBLES[type].nb > 1 ? "Mettre" : "Planter"} ${k ? `${FLEURS[k].une ? "une" : "un"} ${FLEURS[k].nom.toLowerCase()}` : "une fleur"} ${MEUBLES[type].dans}`)(garniDispo(type))
  : MEUBLES[type].support === "buche" ? `🪵 Mettre une bûche ${MEUBLES[type].dans}` : MEUBLES[type].support === "lucioles" ? "✨ Mettre 3 lucioles dans le bocal" : MEUBLES[type].support === "bougie" ? `🕯️ Poser une chandelle ${MEUBLES[type].dans}` : "🔥 Poser une torche sur la torchère";
/* o : le support (le meuble de la pièce, ou la case de l'île) ; type : sa sorte ; refaire : refait son modèle (patch : ce qui change) */
export function poserGarni(o, type, refaire){
  const s = MEUBLES[type].support, bougie = s === "bougie", un = unAUn(type), nb = garniNb(type), n = un ? 1 : nb;
  if(un && garniPlein(type, o)) return false;                          // le chandelier, le lustre : déjà toutes ses chandelles
  const deja = un ? garniPose(type, o) : 0;
  const k = un && o.bougie ? (owned(o.bougie) >= 1 ? o.bougie : null) : garniDispo(type);   // la suite : la même sorte de chandelle
  if(s === "buche") return poserBuche(o, type, k, deja, nb, refaire);
  if(s === "fleur") return planter(o, type, k, refaire);
  if(s === "poisson") return mettrePoisson(o, type, k, refaire);
  if(!k && s === "lucioles"){ toast("✨ Il te faut 3 lucioles : elles s'attrapent au bocal, les nuits d'été, dans les herbes hautes", 3600); return false; }
  if(!k){ toast(bougie ? "🕯️ Il te faut une chandelle : elle se fabrique" + ` à l'atelier de décoration de la Chaumière (1 suif, 1 fibre${un ? " pour 2" : ""})`
    : "🔥 Il te faut une torche : elle se fabrique à l'établi de la Scierie (1 bois, 2 fibres)", 3600); return false; }
  addOwned(k, -n);
  if(k === "torche" && !sacCount("torche")) state.torche = 0;          // plus de torche sur soi : celle qui brûlait est sur la torchère
  const patch = s === "lucioles" ? {lucioles: n} : un ? {bougie: k, chandelles: deja + 1} : bougie ? {bougie: k} : {torche: true};
  Object.assign(o, patch); refaire(patch);
  syncBarre(); save(); renderHUD();
  toast(s === "lucioles" ? "✨ Trois lucioles dans le bocal : elles y brilleront toujours"
    : un ? (deja + 1 >= nb ? `🕯️ Les ${nb} chandelles sont posées ${MEUBLES[type].dans} : elles ne s'y useront jamais` : `🕯️ Chandelle posée ${MEUBLES[type].dans} (${deja + 1} sur ${nb}) : elle ne s'y usera jamais`)
    : bougie ? `🕯️ ${objet(k).nom} posée ${MEUBLES[type].dans} : elle ne s'y usera jamais` : "🔥 Ta torche est posée sur la torchère : elle ne s'éteindra plus jamais", 3400);
  return true;
}
export const poserTorche = (o, refaire) => poserGarni(o, "torchere", refaire);
/* Une bûche dans la cheminée (1 bois du sac) : elle s'ajoute au feu (allumé s'il était éteint), et brûle BUCHE secondes */
function poserBuche(o, type, k, deja, nb, refaire){
  if(!k){ toast("🪵 Il te faut du bois : ramasse les branches au sol, ou coupe un arbre avec ta hache", 3600); return false; }
  addOwned(k, -1);
  const patch = {feu: Date.now() + (resteFeu(o) + BUCHE) * 1000, reste: undefined, eteint: undefined};
  for(const [c, v] of Object.entries(patch)) if(v === undefined) delete o[c]; else o[c] = v;
  refaire(patch); vus.set(o, garniPose(type, o));
  syncBarre(); save(); renderHUD();
  const min = Math.round(BUCHE / 60);
  toast(deja + 1 >= nb ? `🪵 Les ${nb} bûches sont ${MEUBLES[type].dans} : de quoi brûler ${nb * min} minutes` : `🪵 Bûche posée ${MEUBLES[type].dans} (${deja + 1} sur ${nb}) : elle brûle ${min} minutes`, 3400);
  return true;
}
/* Une fleur sauvage plantée dans le pot (Yo, 10 novembre 2026) : la fleur cueillie y reprend racine ; elle fleurit en sa
   vraie saison (FLEURS[...].saisons), sinon ses feuilles */
function planter(o, type, k, refaire){
  if(!k){ toast("🌸 Il te faut une fleur sauvage : cueille-en une sur l'île (pâquerette, coquelicot, bleuet…)", 3600); return false; }
  addOwned(k, -1);
  const f = FLEURS[k], nb = garniNb(type);
  if(nb > 1){                                                       // le vase : un bouquet, une fleur coupée après l'autre
    o.fleurs = [...(o.fleurs || []), k]; refaire({fleurs: o.fleurs});
    syncBarre(); save(); renderHUD();
    toast(`🌸 ${f.nom} ${f.une ? "mise" : "mis"} ${MEUBLES[type].dans} (${o.fleurs.length} sur ${nb})${o.fleurs.length >= nb ? (type === "herbier" ? " : l'herbier est complet, ses fleurs y resteront séchées" : " : le bouquet est fait") : ""}`, 3000);
    return true;
  }
  o.fleur = k; refaire({fleur: k});
  syncBarre(); save(); renderHUD();
  const quand = f.saisons.map(s => ({printemps: "au printemps", ete: "en été", automne: "en automne", hiver: "en hiver"})[s]);
  toast(`🌸 ${f.nom} ${f.une ? "plantée" : "planté"} ${MEUBLES[type].dans} : ${f.une ? "elle" : "il"} fleurit ${quand.length > 1 ? quand.slice(0, -1).join(", ") + " et " + quand.at(-1) : quand[0]}`, 3600);
  return true;
}
/* Un poisson pêché dans l'aquarium (Yo, 10 novembre 2026) : il quitte le sac et y nage ; une koï prend la robe d'une koï du
   carnet ; rangé, l'aquarium le rend */
function mettrePoisson(o, type, k, refaire){
  if(!k){ toast("🐟 Il te faut un poisson : pêche-en un à l'étang ou en mer, puis reviens", 3600); return false; }
  addOwned(k, -1);
  const robes = k === "koi" && state.carnet.poissons.koi && state.carnet.poissons.koi.couleurs ? Object.keys(state.carnet.poissons.koi.couleurs) : [];
  const patch = {poisson: k, robe: robes.length ? robes[Math.floor(Math.random() * robes.length)] : undefined};
  for(const [c, v] of Object.entries(patch)) if(v === undefined) delete o[c]; else o[c] = v;
  refaire(patch); syncBarre(); save(); renderHUD();
  const P = POISSONS[k];
  toast(`🐟 ${P.une ? "La" : "Le"} ${P.nom.toLowerCase()} nage ${MEUBLES[type].dans}`, 3000);
  return true;
}
/* Les bûches qui brûlent : dans la pièce, une fois par seconde, la cheminée est refaite quand une bûche a fini (son feu
   s'éteint avec la dernière) */
const vus = new WeakMap();
let veille = 0;
const vusIle = new Map();
function bruler(place, dt){
  if((veille -= dt) > 0) return;
  veille = 1;
  if(!place){                                                       // dehors : les feux de camp de l'île
    for(let i = 0; i < map.obj.length; i++){
      const t = map.obj[i];
      if(!t || !MEUBLES[t] || MEUBLES[t].support !== "buche"){ if(vusIle.has(i)) vusIle.delete(i); continue; }
      const n = garniPose(t, state.ile[i]);
      if(vusIle.has(i) && vusIle.get(i) !== n) setEtat(i, {});      // setEtat refait la case
      vusIle.set(i, n);
    }
    return;
  }
  if(!place.b.deco) return;
  for(const it of place.b.deco.items) if(MEUBLES[it.type] && MEUBLES[it.type].support === "buche"){
    const n = garniPose(it.type, it);
    if(vus.has(it) && vus.get(it) !== n) refreshItemMesh(it);
    vus.set(it, n);
  }
}

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
/* Les chandeliers d'avant (Yo, 9 novembre 2026 : vide, on y pose trois chandelles) : une fois, chaque chandelier posé reçoit
   ses trois chandelles de suif (il reste allumé) ; chaque chandelier du sac, des coffres et en fabrication donne aussi les
   trois chandelles qu'il portait */
if(!state.chandeliers){
  for(const b of state.buildings){
    for(const it of (b.deco && b.deco.items) || []) if(it.type === "chandelier" && !it.bougie) it.bougie = "chandelleSuif";
    for(const j of (b.atelier && b.atelier.queue) || []) if(j.out === "chandelier") addOwned("chandelleSuif", 3);
  }
  const n = owned("chandelier");
  if(n > 0) addOwned("chandelleSuif", 3 * n);
  state.chandeliers = 1; save();
}
/* Les cheminées d'avant (Yo, 10 novembre 2026 : vide, on y pose trois bûches qui brûlent) : une fois, chaque cheminée posée
   reçoit ses trois bûches, et brûle (éteinte, elle les garde pour plus tard) */
if(!state.cheminees){
  for(const b of state.buildings) for(const it of (b.deco && b.deco.items) || []) if(it.type === "cheminee"){
    if(it.eteint) it.reste = 3 * BUCHE; else it.feu = Date.now() + 3 * BUCHE * 1000;
  }
  state.cheminees = 1; save();
}
/* Les feux de camp d'avant (Yo, 10 novembre 2026 : vide, on y met trois bûches qui brûlent) : une fois, chaque feu de camp
   posé sur l'île reçoit ses trois bûches, et brûle */
if(!state.feuxCamp){
  for(let i = 0; i < map.obj.length; i++) if(map.obj[i] === "feuCamp"){
    const c = state.ile[i] || {}, patch = c.eteint ? {reste: 3 * BUCHE} : {feu: Date.now() + 3 * BUCHE * 1000};
    if(objMesh(i)) setEtat(i, patch); else Object.assign(state.ile[i] || (state.ile[i] = {o: "feuCamp"}), patch);
  }
  state.feuxCamp = 1; save();
}
/* Dans une pièce, tout près d'une torchère sans torche : le bouton */
const btn = $("#btn-torchere");
let proche = null;
function bouton(place){
  const p = player.position;
  proche = place && place.b.deco ? place.b.deco.items.find(it => {
    if(!MEUBLES[it.type] || !MEUBLES[it.type].support || garniPlein(it.type, it)) return false;   // le chandelier, le lustre : jusqu'à la dernière chandelle
    const [w, d] = footOf(it);
    return Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
  }) || null : null;
  if(proche){ const m = MEUBLES[proche.type], txt = `${m.emoji} ${m.nom}`; if(btn.textContent !== txt) btn.textContent = txt; }   // son nom (demande de Yo)
  if(btn.hidden === !!proche) btn.hidden = !proche;
}
btn.addEventListener("click", () => { const it = proche; if(it) poserGarni(it, it.type, () => refreshItemMesh(it)); });
