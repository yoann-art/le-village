/* ================= L'élevage =================
   Yo, 20 novembre 2026 : « Je veux pouvoir déjà les élever ». Premier envoi : les poules. On bâtit la Ferme, puis le poulailler
   qu'on pose contre elle (choix de Yo : un petit bâtiment à part) ; au comptoir du Marché, on achète une poule ou un coq ; il
   s'installe au poulailler et s'y promène, comme un vrai : il marche, picore, gratte le sol, tourne la tête ; la nuit, les
   poules rentrent dans la cabane. Un animal ne meurt jamais et ne s'enfuit pas (le Grand Carnet : le refuge).
   state.animaux = [{id, esp, sexe ("f" ou "m"), ne (l'heure de sa naissance), abri (l'id du bâtiment), nom, gen}].
   À venir (envois suivants, accord de Yo) : nourrir, les œufs, le bonheur, la fiche de l'animal ; la couvaison, les poussins
   qui grandissent, les générations. */
import { B, ELEVAGE, ABRIS, INSECTES, saison, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { scene } from "./monde/scene.js";
import { H } from "./monde/ile.js";
import { sizeOf, owned, addOwned, placeFor } from "./regles.js";
import { wrap, openSheet, toast, renderHUD } from "./interface.js";
import { toon } from "./monde/formes.js";
import { nuitIci } from "./monde/ciel.js";
import { player } from "./monde/personnage.js";
import { ENCLOS, NICHOIRS } from "./monde/poulailler.js";
import * as POULES from "./monde/poules3d.js";
import * as VACHES from "./monde/vaches3d.js";
import { PRE } from "./monde/etable.js";
/* chaque espèce : ses modèles, son enclos (le pré de l'étable : choix de Yo « A »), la marge au bord (une vache est longue) */
const ESPECES = {poule: {mod: POULES, zone: ENCLOS, bord: .22}, vache: {mod: VACHES, zone: PRE, bord: .62}};
const esp = a => ESPECES[a.esp] || ESPECES.poule;
const sorteDe = (e, sexe, petit) => (ESPECES[e] || ESPECES.poule).mod.sorteDe(e, sexe, petit);

if(!Array.isArray(state.animaux)) state.animaux = [];
/* L'âge adulte (le petit grandit en temps réel jusque-là : envoi 3) */
export const ADULTE = 3 * 24 * 3600 * 1000;
export const estPetit = a => Date.now() - a.ne < ADULTE;
export const nomEspece = a => { const e = ELEVAGE[a.esp]; return estPetit(a) ? e.petit : a.sexe === "m" ? e.male : e.femelle; };
export const emojiAnimal = a => { const e = ELEVAGE[a.esp]; return estPetit(a) ? e.emojiPetit : a.sexe === "m" ? e.emojiMale : e.emoji; };
export const animauxDe = b => state.animaux.filter(a => a.abri === b.id);
export const placesLibres = b => ABRIS[b.type] ? ABRIS[b.type].places - animauxDe(b).length : 0;
/* L'abri où loger un animal de cette espèce (le premier qui a de la place), ou null */
export const abriPour = esp => state.buildings.find(b => b.type === ELEVAGE[esp].abri && placesLibres(b) > 0) || null;
export const aUnAbri = esp => state.buildings.some(b => b.type === ELEVAGE[esp].abri);
/* Les noms, au hasard parmi ceux qui ne sont pas déjà pris */
const NOMS = {poule: {f: ["Rousse", "Cocotte", "Noisette", "Paprika", "Caramel", "Brioche", "Praline", "Cannelle", "Pâquerette", "Mirabelle", "Biscotte", "Muscade"],
  m: ["Gaston", "Hector", "Fernand", "Barnabé", "Anatole", "Léon", "Firmin", "Achille"]},
  vache: {f: ["Marguerite", "Blanchette", "Clochette", "Roussette", "Violette", "Câlinette", "Pâquerette", "Mirabelle", "Framboise", "Bergamote"],
    m: ["Hercule", "Ferdinand", "Bastien", "Gaspard", "Augustin", "Balthazar", "Célestin", "Norbert"]}};
const NOMS_PETITS = ["Plume", "Pipou", "Duvet", "Brindille", "Pépite", "Miette", "Bouton", "Noisette", "Grelot", "Flocon", "Papillote", "Câline"];   // un poussin : un nom qui va aux deux
function nomAuHasard(esp, sexe, petit){
  const pris = new Set(state.animaux.map(a => a.nom)), l = petit ? NOMS_PETITS : (NOMS[esp] && NOMS[esp][sexe]) || ["Petit"];
  const libres = l.filter(n => !pris.has(n));
  return libres.length ? libres[Math.floor(Math.random() * libres.length)] : l[Math.floor(Math.random() * l.length)] + " " + (state.animaux.length + 1);
}
/* Acheter un animal adulte (le comptoir du Marché) : il s'installe dans son abri ; null s'il n'y a pas de place */
export function installer(esp, sexe){
  const b = abriPour(esp);
  if(!b) return null;
  const a = {id: state.nextAnimal = (state.nextAnimal || 0) + 1, esp, sexe, ne: Date.now() - ADULTE, abri: b.id, nom: nomAuHasard(esp, sexe), gen: 0};
  state.animaux.push(a); save();
  return a;
}
/* ----- Les bêtes dans leur enclos ----- */
const groupe = new THREE.Group(); groupe.name = "élevage"; scene.add(groupe);
const enclos = new Map();                       // b.id → {g}
const betes = new Map();                        // a.id → {m (modeleAnimal), x, z, dir, act, t, T, vers, sorte}
const auHasard = a => { const {zone: {x0, x1, z0, z1}, bord} = esp(a); return {x: x0 + bord + Math.random() * (x1 - x0 - 2 * bord), z: z0 + bord + Math.random() * (z1 - z0 - 2 * bord)}; };
function nouvelleBete(a, g){
  const k = sorteDe(a.esp, a.sexe, estPetit(a)), m = esp(a).mod.modeleAnimal(k), p = auHasard(a);
  const v = {a, m, k, x: p.x, z: p.z, dir: Math.random() * Math.PI * 2, act: "repos", t: 0, T: 1 + Math.random() * 2, vers: null, pas: Math.random() * 6};
  m.g.position.set(v.x, 0, v.z); g.add(m.g);
  return v;
}
/* Ce que fait une bête ensuite : marcher (le plus souvent), picorer, gratter le sol, se reposer en tournant la tête */
const dansEnclos = (p, a) => { const {zone: {x0, x1, z0, z1}, bord} = esp(a); return {x: Math.max(x0 + bord, Math.min(x1 - bord, p.x)), z: Math.max(z0 + bord, Math.min(z1 - bord, p.z))}; };
function choisir(v, e){
  if(v.a.esp === "vache") return choisirVache(v);
  const r = Math.random();
  v.t = 0;
  const mere = v.a.suit && betes.get(v.a.suit);                                         // le poussin suit sa mère partout, comme un vrai
  if(estPetit(v.a) && mere && r < .75){
    v.act = "marche"; v.vers = dansEnclos({x: mere.x + (Math.random() - .5) * .35, z: mere.z + (Math.random() - .5) * .35}, v.a); v.T = 3; v.puisPicore = Math.random() < .5; return; }
  if(e && e.grain && Date.now() < e.grain.fin && r < .8){                              // du grain par terre : on y court, on picore
    const p = e.grain.pts[Math.floor(Math.random() * e.grain.pts.length)];
    v.act = "marche"; v.vers = {x: p.x, z: p.z}; v.T = 5; v.puisPicore = true; return; }
  if(v.puisPicore){ v.puisPicore = false; v.act = "picore"; v.T = 1.5 + Math.random() * 1.5; return; }
  if(r < .42){ v.act = "marche"; v.vers = auHasard(v.a); v.T = 6; }
  else if(r < .72){ v.act = "picore"; v.T = 1.6 + Math.random() * 2; }
  else if(r < .88){ v.act = "gratte"; v.T = 1.2 + Math.random(); }
  else { v.act = "repos"; v.T = 1.5 + Math.random() * 2.5; }
}
const lisse = x => x * x * (3 - 2 * x);
function bouger(v, dt, e){
  if(v.a.esp === "vache") return bougerVache(v, dt);
  const {corps, tete, pattes} = v.m, petit = v.k === "poussin", vit = petit ? .42 : .38;
  v.t += dt;
  if(v.a.couve){                                                                         // la couveuse, assise sur son nid, ne bouge plus
    v.x = NID.x; v.z = NID.z; v.dir = -.6;
    v.m.g.position.set(v.x, 0, v.z); v.m.g.rotation.y = v.dir;
    corps.rotation.x = 0; corps.position.y = pattes[0].position.y * .2; pattes[0].visible = pattes[1].visible = false;
    tete.rotation.x = 0; tete.rotation.y = Math.sin(v.t * .7) * .5;
    return;
  }
  if(!pattes[0].visible) pattes[0].visible = pattes[1].visible = true;
  let jambe = 0, penche = 0, tet = 0, tour = 0, gratte = 0;
  if(v.act === "marche"){
    const dx = v.vers.x - v.x, dz = v.vers.z - v.z, d = Math.hypot(dx, dz);
    if(d < .06 || v.t > v.T) choisir(v, e);
    else {
      const but = Math.atan2(dx, dz); let da = but - v.dir; da = Math.atan2(Math.sin(da), Math.cos(da));
      v.dir += da * Math.min(1, dt * 6);
      const s = Math.min(d, vit * dt * (Math.abs(da) < 1 ? 1 : .3));
      v.x += Math.sin(v.dir) * s; v.z += Math.cos(v.dir) * s;
      v.pas += dt * (petit ? 16 : 11);
      jambe = Math.sin(v.pas) * .55;
      tet = Math.max(0, Math.sin(v.pas)) * .25;                                       // la tête qui va et vient, comme une vraie poule
    }
  } else if(v.act === "picore"){
    const u = v.t * 3.2, k = Math.max(0, Math.sin(u * Math.PI)) ** 2;
    penche = .45; tet = .2 + .9 * k;
    if(v.t > v.T) choisir(v, e);
  } else if(v.act === "gratte"){
    gratte = Math.sin(v.t * 9); penche = .15;
    if(v.t > v.T){ choisir(v, e); if(v.act === "marche") { v.act = "picore"; v.T = 1.2; } }   // gratter, puis picorer ce qu'on a trouvé
  } else {
    tour = Math.sin(v.t * 1.3) * .7 * lisse(Math.min(1, v.t));
    if(v.t > v.T) choisir(v, e);
  }
  v.m.g.position.set(v.x, 0, v.z); v.m.g.rotation.y = v.dir;
  corps.rotation.x = penche; corps.position.y = pattes[0].position.y + (jambe ? Math.abs(Math.cos(v.pas)) * .008 : 0);
  tete.rotation.x = tet; tete.rotation.y = tour;
  pattes[0].rotation.x = jambe + (gratte > 0 ? -gratte * .7 : 0);
  pattes[1].rotation.x = -jambe + (gratte < 0 ? gratte * .7 : 0);
}

/* ----- Les vaches dans le pré (Yo, 20 novembre 2026 : « La vache ») : comme des vraies, elles broutent le plus souvent, marchent
   lentement, se couchent pour ruminer, chassent les mouches de la queue ; le veau suit sa mère ----- */
function choisirVache(v){
  const r = Math.random(), mere = v.a.suit && betes.get(v.a.suit);
  v.t = 0;
  if(estPetit(v.a) && mere && !mere.couchee && r < .7){
    v.act = "marche"; v.vers = dansEnclos({x: mere.x + (Math.random() - .5) * .8, z: mere.z + (Math.random() - .5) * .8}, v.a); v.T = 6; return; }
  if(r < .3){ v.act = "marche"; v.vers = auHasard(v.a); v.T = 10; }
  else if(r < .72){ v.act = "broute"; v.T = 5 + Math.random() * 7; }
  else if(r < .86){ v.act = "couchee"; v.T = 10 + Math.random() * 14; }
  else { v.act = "repos"; v.T = 3 + Math.random() * 4; }
}
function bougerVache(v, dt){
  const {corps, tete, queue, pattes} = v.m, petit = v.k === "veau", h = VACHES.HANCHE(v.k), vit = petit ? .5 : .32;
  v.t += dt;
  let pas = 0, baisse = 0, tour = 0, machoire = 0, bas = 0;
  if(v.act === "marche"){
    const dx = v.vers.x - v.x, dz = v.vers.z - v.z, d = Math.hypot(dx, dz);
    if(d < .08 || v.t > v.T) choisirVache(v);
    else {
      const but = Math.atan2(dx, dz); let da = but - v.dir; da = Math.atan2(Math.sin(da), Math.cos(da));
      v.dir += da * Math.min(1, dt * 2.5);
      const s = Math.min(d, vit * dt * (Math.abs(da) < .8 ? 1 : .25));
      v.x += Math.sin(v.dir) * s; v.z += Math.cos(v.dir) * s;
      v.pas += dt * (petit ? 9 : 6);
      pas = Math.sin(v.pas) * .38; baisse = .12;
    }
  } else if(v.act === "broute"){                                  // la tête dans l'herbe, elle arrache et mâche ; un pas de temps en temps
    baisse = 1.05 * lisse(Math.min(1, v.t * 1.5)); machoire = Math.sin(v.t * 9) * .05; tour = Math.sin(v.t * .6) * .15;
    if(v.t > v.T) choisirVache(v);
  } else if(v.act === "couchee"){                                 // couchée, les pattes repliées : elle rumine
    const k = lisse(Math.min(1, v.t / 1.2, Math.max(0, (v.T - v.t) / 1.2)));
    bas = k; machoire = Math.sin(v.t * 5) * .04; tour = Math.sin(v.t * .4) * .5 * k;
    if(v.t > v.T) choisirVache(v);
  } else {
    tour = Math.sin(v.t * .9) * .6 * lisse(Math.min(1, v.t));
    if(v.t > v.T) choisirVache(v);
  }
  v.couchee = bas > .5;
  if(!bas) for(const w of betes.values()) if(w !== v && w.parent === v.parent && w.a.esp === "vache"){   // chacune sa place : elles ne se marchent pas dessus
    const dx = v.x - w.x, dz = v.z - w.z, d = Math.hypot(dx, dz), min = (petit || w.k === "veau" ? .75 : 1.05);
    if(d < min && d > 1e-4){ const p = dansEnclos({x: v.x + dx / d * (min - d) * Math.min(1, dt * 3), z: v.z + dz / d * (min - d) * Math.min(1, dt * 3)}, v.a); v.x = p.x; v.z = p.z; }
  }
  v.m.g.position.set(v.x, 0, v.z); v.m.g.rotation.y = v.dir;
  corps.position.y = h * (1 - .62 * bas) + (pas ? Math.abs(Math.cos(v.pas)) * .01 : 0);
  corps.rotation.x = .04 * baisse;
  tete.rotation.x = baisse + machoire; tete.rotation.y = tour;
  queue.rotation.z = Math.sin(v.t * (v.act === "broute" ? 2.2 : 1.3)) * .28; queue.rotation.x = .1 + Math.max(0, Math.sin(v.t * 3.1)) * .15;   // la queue chasse les mouches
  const vis = bas < .5;
  pattes.forEach((p, i) => { p.visible = vis; p.rotation.x = (i === 0 || i === 3 ? pas : -pas); });
}

/* ----- Deuxième envoi (Yo, 20 novembre 2026 : « Oui je veux bien », la nourriture « C ») : nourrir, les œufs, le bonheur, la fiche -----
   Chaque bête : coeurs (0 à 5), jour (le dernier jour compté), nourri, caresse, gate (le jour de son insecte), ponte (l'heure où
   son œuf tombera dans le nichoir), pondus. L'abri : oeufs = ["oeuf" | "belOeuf"], dans les nichoirs, à ramasser.
   Comme le Grand Carnet : un animal négligé produit moins (une poule sans cœur ne pond pas), il ne meurt jamais. */
export const jourDe = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / 864e5);
const NOURRITURES = ["grain", "baie", "pomme"];                 // le grain d'abord, puis les groseilles et les pommes (les vraies poules en mangent)
const PONTE = 2 * 60 * 1000, NICHOIR_MAX = 8, NID = {x: 1.15, z: .3}, COUVAISON = 24 * 3600 * 1000;   // l'éclosion : un jour (le Grand Carnet, commun)                   // l'œuf tombe deux minutes après le repas
const estPondeuse = a => a.sexe === "f" && !estPetit(a);
/* Les jours passés depuis la dernière fois : un jour sans repas, un cœur de moins */
export function bilan(a){
  const j = jourDe();
  if(a.coeurs === undefined) a.coeurs = 2;
  if(a.jour === undefined) a.jour = j;
  for(let d = a.jour; d < j; d++) if(a.nourri !== d) a.coeurs = Math.max(0, a.coeurs - 1);
  a.jour = j;
}
export const coeursDe = a => { bilan(a); return a.coeurs; };
const coeursHTML = a => { const n = Math.round(coeursDe(a)); return "❤️".repeat(n) + "🤍".repeat(5 - n); };
const pondAujourdhui = () => !(saison() === "hiver" && jourDe() % 2);   // l'hiver, les vraies poules pondent moins : un jour sur deux
/* Nourrir toutes les bêtes de l'abri qui n'ont pas encore mangé aujourd'hui ; rend {nourris, manque} */
export function nourrir(b){
  const j = jourDe(), faim = animauxDe(b).filter(a => (bilan(a), a.nourri !== j));
  let nourris = 0;
  for(const a of faim){
    const k = NOURRITURES.find(k => owned(k) > 0);
    if(!k) break;
    addOwned(k, -1); a.nourri = j; a.coeurs = Math.min(5, a.coeurs + 1); nourris++;
    if(estPondeuse(a) && !a.couve && a.coeurs >= 1 && pondAujourdhui() && a.pondJour !== j){ a.ponte = Date.now() + PONTE + Math.random() * 60000; a.pondJour = j; }
  }
  if(nourris){ const e = enclos.get(b.id); if(e) jeterGrain(e); save(); }
  return {nourris, manque: faim.length - nourris};
}
export function caresser(a){ bilan(a); const j = jourDe(); if(a.caresse === j) return false; a.caresse = j; a.coeurs = Math.min(5, a.coeurs + .5); save(); return true; }
/* Offrir un insecte attrapé (les vraies poules adorent) : un cœur de plus, une fois par jour */
export function offrirInsecte(a){
  bilan(a); const j = jourDe();
  if(a.gate === j) return null;
  const k = Object.keys(INSECTES).find(k => INSECTES[k].rarete !== "legendaire" && owned(k) > 0);
  if(!k) return null;
  addOwned(k, -1); a.gate = j; a.coeurs = Math.min(5, a.coeurs + 1); save();
  return k;
}
/* Ramasser les œufs des nichoirs : dans le sac (ou un coffre) ; rend combien */
export function ramasser(b){
  const o = b.oeufs || [];
  let n = 0;
  while(o.length && placeFor(sorteOeuf(o[0])) > 0){ addOwned(sorteOeuf(o.shift()), 1); n++; }
  if(n) save();
  return n;
}
/* Un œuf tombe dans le nichoir à l'heure dite ; une poule heureuse pond parfois un bel œuf */
function pontes(b){
  const t = Date.now();
  for(const a of animauxDe(b)) if(a.ponte && t >= a.ponte){
    delete a.ponte;
    const o = b.oeufs || (b.oeufs = []);
    const coq = animauxDe(b).find(c => c.sexe === "m" && !estPetit(c) && coeursDe(c) >= 3);
    const k = Math.random() < Math.max(0, (a.coeurs - 2.5) / 5) ? "belOeuf" : "oeuf";
    if(o.length < NICHOIR_MAX) o.push(coq && a.coeurs >= 3 && Math.random() < .6 ? `${k}:f:${coq.id}:${a.id}` : k);   // fécondé : un coq et une poule heureux
    a.pondus = (a.pondus || 0) + 1; save();
  }
  /* l'éclosion : les poussins sortent de l'œuf ; chacun son nom, sa génération (le parent le plus avancé, plus un), ses parents */
  for(const a of animauxDe(b)) if(a.couve && t >= a.couve.fin){
    let nes = 0;
    for(const [p, m] of a.couve.oeufs){
      if(placesLibres(b) < 1) break;
      const pere = state.animaux.find(x => x.id === p), mere = state.animaux.find(x => x.id === m), sexe = Math.random() < .5 ? "m" : "f";
      state.animaux.push({id: state.nextAnimal = (state.nextAnimal || 0) + 1, esp: a.esp, sexe, ne: t, abri: b.id, nom: nomAuHasard(a.esp, sexe, true),
        gen: Math.max(pere ? pere.gen : 0, mere ? mere.gen : 0) + 1, pere: p, mere: m, suit: a.id, coeurs: 3});
      nes++;
    }
    delete a.couve; save();
    if(nes) toast(`🐣 ${nes} poussin${nes > 1 ? "s sont nés" : " est né"} au ${B[b.type].nom.toLowerCase()} : ${a.nom} les a couvés`, 3600);
  }
}
const sorteOeuf = o => o.split(":")[0];
export const oeufsFeconds = b => (b.oeufs || []).filter(o => o.includes(":f:"));
/* Mettre à couver : la poule la plus heureuse (au moins 3 cœurs, pas déjà couveuse) prend jusqu'à 4 œufs fécondés, autant qu'il y
   a de places pour les petits ; rend la couveuse, ou null */
export function couver(b){
  const f = oeufsFeconds(b), n = Math.min(4, f.length, placesLibres(b));
  if(!n || animauxDe(b).some(a => a.couve)) return null;
  const poule = animauxDe(b).filter(a => estPondeuse(a) && coeursDe(a) >= 3).sort((p, q) => q.coeurs - p.coeurs)[0];
  if(!poule) return null;
  const pris = f.slice(0, n);
  for(const o of pris) b.oeufs.splice(b.oeufs.indexOf(o), 1);
  poule.couve = {fin: Date.now() + COUVAISON, oeufs: pris.map(o => { const [, , p, m] = o.split(":"); return [+p, +m]; })};
  save();
  return poule;
}
export function renommer(a, nom){ nom = String(nom || "").trim().slice(0, 18); if(nom){ a.nom = nom; save(); } return a.nom; }
const nomDe = id => { const x = state.animaux.find(v => v.id === id); return x ? x.nom : null; };
const parentsHTML = a => { if(!a.pere && !a.mere) return ""; const p = nomDe(a.pere), m = nomDe(a.mere), f = !estPetit(a) && a.sexe === "f";
  return `<p class="muted" style="margin:0">${estPetit(a) ? "Petit" : f ? "Fille" : "Fils"} de ${[p, m].filter(Boolean).join(" et ") || "parents partis"}.</p>`; };
const quand = t => { const m = Math.max(0, Math.round((t - Date.now()) / 60000)); return m < 60 ? `dans ${m} min` : `dans ${Math.round(m / 60)} h`; };
const age = a => { const d = Math.floor((Date.now() - a.ne) / 864e5); return estPetit(a) ? `${d} jour${d > 1 ? "s" : ""}` : "adulte"; };
/* La fiche d'une bête */
export function ficheAnimal(a){
  bilan(a);
  const j = jourDe(), b = state.buildings.find(v => v.id === a.abri), ins = Object.keys(INSECTES).some(k => INSECTES[k].rarete !== "legendaire" && owned(k) > 0);
  return `<div class="sh-head"><h2 class="display">${emojiAnimal(a)} ${a.nom}</h2><button class="btn ghost" data-elevage="abri" data-id="${a.abri}">Retour</button></div>
    <p style="margin:4px 0">${nomEspece(a)} ${estPetit(a) ? `(${ELEVAGE[a.esp].male.toLowerCase()} ou ${ELEVAGE[a.esp].femelle.toLowerCase()} ? on le saura en grandissant)` : a.sexe === "m" ? "♂" : "♀"} · génération ${a.gen} · ${age(a)}</p>
    ${parentsHTML(a)}${a.couve ? `<p style="margin:4px 0">🪺 Elle couve ${a.couve.oeufs.length} œuf${a.couve.oeufs.length > 1 ? "s" : ""} : éclosion ${quand(a.couve.fin)}.</p>` : ""}
    ${a.esp === "vache" ? "" : `<p style="margin:4px 0;font-size:1.2em" aria-label="${Math.round(a.coeurs)} cœurs sur 5">${coeursHTML(a)}</p>
    <p class="muted" style="margin:0">${a.nourri === j ? "Nourri" + (a.sexe === "f" ? "e" : "") + " aujourd'hui." : "Pas encore nourri" + (a.sexe === "f" ? "e" : "") + " aujourd'hui."}${a.sexe === "f" ? ` ${a.pondus || 0} œuf${(a.pondus || 0) > 1 ? "s" : ""} pondu${(a.pondus || 0) > 1 ? "s" : ""}.` : ""}</p>`}
    <div class="brow"><div class="bt"><label class="muted" for="nom-animal">Son nom</label> <input id="nom-animal" maxlength="18" value="${a.nom.replace(/"/g, "&quot;")}" style="font:inherit;width:9em"></div>
      <button class="btn" data-elevage="renommer" data-id="${a.id}">Renommer</button></div>
    <div class="brow"><div class="bt"><span class="bn">Caresser</span><p>Un demi-cœur, une fois par jour</p></div>
      <button class="btn primary" data-elevage="caresser" data-id="${a.id}" ${a.caresse === j ? "disabled" : ""}>${a.caresse === j ? "Déjà caressé" + (a.sexe === "f" ? "e" : "") : "Caresser"}</button></div>
    ${a.esp === "vache" ? `<p class="muted" style="margin:4px 0">La nourrir et son lait arrivent au prochain envoi.</p>` : `<div class="brow"><div class="bt"><span class="bn">Offrir un insecte</span><p>Un cœur de plus, une fois par jour (les poules adorent)</p></div>
      <button class="btn primary" data-elevage="insecte" data-id="${a.id}" ${a.gate === j || !ins ? "disabled" : ""}>${a.gate === j ? "Déjà offert" : ins ? "Offrir" : "Pas d'insecte"}</button></div>`}`;
}
/* La fiche de l'abri (construire.js : le bouton du bâtiment devant soi) */
export function ficheAbri(b){
  const l = animauxDe(b), max = ABRIS[b.type] ? ABRIS[b.type].places : 0, j = jourDe();
  l.forEach(bilan);
  const faim = l.filter(a => a.nourri !== j).length, oeufs = (b.oeufs || []).length;
  const nour = NOURRITURES.reduce((n, k) => n + owned(k), 0);
  const lignes = l.map(a => `<div class="brow"><div class="be" aria-hidden="true">${emojiAnimal(a)}</div>
    <div class="bt"><span class="bn">${a.nom}</span><p>${nomEspece(a)} ${a.sexe === "m" ? "♂" : "♀"} · ${coeursHTML(a)}${a.nourri === j ? " · nourri" + (a.sexe === "f" ? "e" : "") : ""}</p></div>
    <button class="btn" data-elevage="voir" data-id="${a.id}">Voir</button></div>`).join("");
  if(b.type === "etable") return `<p style="margin:4px 0">${l.length} sur ${max} places.</p>` + (lignes.replace(/ · [❤️🤍]+/gu, "").replace(/ · nourrie?/g, "") ||
    `<p class="muted">Pas encore de vaches. Achète des vaches et des taureaux au comptoir du Marché : ils viennent s'installer dans le pré.</p>`);
  return `<p style="margin:4px 0">${l.length} sur ${max} places.</p>` + (l.length ? `
    <div class="brow"><div class="be" aria-hidden="true">🌾</div><div class="bt"><span class="bn">Nourrir</span>
      <p>${faim ? `${faim} à nourrir · ` : "Toutes ont mangé aujourd'hui · "}tu as ${owned("grain")} grain, ${owned("baie")} groseille${owned("baie") > 1 ? "s" : ""}, ${owned("pomme")} pomme${owned("pomme") > 1 ? "s" : ""}</p></div>
      <button class="btn primary" data-elevage="nourrir" data-id="${b.id}" ${faim && nour ? "" : "disabled"}>Nourrir</button></div>
    ${couveuseHTML(b)}
    <div class="brow"><div class="be" aria-hidden="true">🥚</div><div class="bt"><span class="bn">Les nichoirs</span><p>${oeufs ? `${oeufs} œuf${oeufs > 1 ? "s" : ""} à ramasser` : "Pas d'œuf pour l'instant"}</p></div>
      <button class="btn primary" data-elevage="ramasser" data-id="${b.id}" ${oeufs ? "" : "disabled"}>Ramasser</button></div>` : "") + (lignes ||
    `<p class="muted">Pas encore de poules. Achète des poules et des coqs au comptoir du Marché : ils viennent s'installer ici.</p>`);
}
/* La couvaison, dans la fiche du poulailler : la couveuse et l'éclosion, ou les œufs fécondés à mettre à couver */
function couveuseHTML(b){
  const c = animauxDe(b).find(a => a.couve);
  if(c) return `<div class="brow"><div class="be" aria-hidden="true">🪺</div><div class="bt"><span class="bn">${c.nom} couve</span><p>${c.couve.oeufs.length} œuf${c.couve.oeufs.length > 1 ? "s" : ""} · éclosion ${quand(c.couve.fin)}</p></div></div>`;
  const f = oeufsFeconds(b).length;
  if(!f) return animauxDe(b).some(a => a.sexe === "m" && !estPetit(a)) ? "" : `<p class="muted" style="margin:4px 0">Sans coq, les œufs ne donnent pas de poussins.</p>`;
  const ok = placesLibres(b) > 0 && animauxDe(b).some(a => estPondeuse(a) && coeursDe(a) >= 3);
  return `<div class="brow"><div class="be" aria-hidden="true">🪺</div><div class="bt"><span class="bn">Mettre à couver</span>
    <p>${f} œuf${f > 1 ? "s" : ""} fécondé${f > 1 ? "s" : ""} · ${ok ? "une poule heureuse les couvera un jour" : placesLibres(b) < 1 ? "plus de place pour des petits" : "il faut une poule à 3 cœurs"}</p></div>
    <button class="btn primary" data-elevage="couver" data-id="${b.id}" ${ok ? "" : "disabled"}>Couver</button></div>`;
}
const ouvrirAbri = b => openSheet(`<div class="sh-head"><h2 class="display">${B[b.type].emoji} ${B[b.type].nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
  <p class="muted" style="margin:4px 0">${B[b.type].stars} ★ pour ton village.</p>${ficheAbri(b)}`);
export { ouvrirAbri };
wrap.addEventListener("click", e => {
  const t = e.target.closest("[data-elevage]");
  if(!t) return;
  const id = +t.dataset.id, quoi = t.dataset.elevage, b = state.buildings.find(v => v.id === id), a = state.animaux.find(v => v.id === id);
  if(quoi === "abri" && b) ouvrirAbri(b);
  else if(quoi === "voir" && a) openSheet(ficheAnimal(a));
  else if(quoi === "nourrir" && b){
    const r = nourrir(b);
    toast(r.nourris ? `🌾 Tu nourris ${r.nourris} bête${r.nourris > 1 ? "s" : ""}${r.manque ? ` ; il manque de quoi en nourrir ${r.manque}` : ""}` : "🌾 Il te faut du grain (comptoir du Marché), des groseilles ou des pommes", 2800);
    renderHUD(); ouvrirAbri(b);
  }
  else if(quoi === "couver" && b){ const c = couver(b); toast(c ? `🪺 ${c.nom} s'installe sur le nid : éclosion dans un jour` : "🪺 Pas de poule heureuse ou plus de place", 2800); ouvrirAbri(b); }
  else if(quoi === "ramasser" && b){ const n = ramasser(b); toast(n ? `🥚 Tu ramasses ${n} œuf${n > 1 ? "s" : ""}` : "🎒 Fais de la place dans ton sac ou un coffre", 2400); renderHUD(); ouvrirAbri(b); }
  else if(quoi === "caresser" && a){ if(caresser(a)) toast(`${emojiAnimal(a)} ${a.nom} se laisse caresser`, 2000); openSheet(ficheAnimal(a)); }
  else if(quoi === "insecte" && a){ const k = offrirInsecte(a); if(k) toast(`${emojiAnimal(a)} ${a.nom} se régale : ${objet(k).nom.toLowerCase()}`, 2400); renderHUD(); openSheet(ficheAnimal(a)); }
  else if(quoi === "renommer" && a){ const v = document.getElementById("nom-animal"); renommer(a, v && v.value); openSheet(ficheAnimal(a)); }
});
/* Le grain jeté dans l'enclos : des grains au sol, devant, pendant une minute ; les poules accourent */
const GRAIN_GEO = new THREE.SphereGeometry(.018, 4, 3), GRAIN_MAT = toon({color: 0xE8C060});
function jeterGrain(e){
  if(e.grain){ e.g.remove(e.grain.mesh); }
  const n = 36, mesh = new THREE.InstancedMesh(GRAIN_GEO, GRAIN_MAT, n), m = new THREE.Matrix4(), pts = [];
  for(let i = 0; i < n; i++){ const p = {x: -.4 + (Math.random() - .5) * 2.2, z: .7 + (Math.random() - .5) * 1.2}; pts.push(p); mesh.setMatrixAt(i, m.makeTranslation(p.x, .012, p.z)); }
  mesh.castShadow = mesh.receiveShadow = false; e.g.add(mesh);
  e.grain = {mesh, pts, fin: Date.now() + 60000};
}
/* Le nid de paille de la couveuse, dans l'enclos */
function nidModele(){
  const g = new THREE.Group(), m = toon({color: 0xE8B84A});
  for(let k = 0; k < 14; k++){ const a = k / 14 * Math.PI * 2, b = new THREE.Mesh(GRAIN_GEO, m);
    b.scale.set(3.4, 1.6, 8); b.position.set(Math.cos(a) * .16, .03, Math.sin(a) * .16); b.rotation.y = -a; g.add(b); }
  const fond = new THREE.Mesh(new THREE.CylinderGeometry(.16, .18, .03, 10), toon({color: 0xD8A23C})); fond.position.y = .015; g.add(fond);
  return g;
}
/* Les œufs dans les nichoirs : bruns (les poules rousses), le bel œuf plus gros et plus foncé */
const OEUF_GEO = (() => { const g = new THREE.SphereGeometry(.035, 8, 6), p = g.attributes.position; for(let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (p.getY(i) > 0 ? 1.4 : 1.15)); g.computeVertexNormals(); return g; })();
const OEUF_MAT = {oeuf: toon({color: 0xD9A878}), belOeuf: toon({color: 0xC08050})};
function montrerOeufs(e, b){
  const o = b.oeufs || [], cle = o.join();
  if(e.vusOeufs === cle) return;
  e.vusOeufs = cle;
  if(e.oeufs) e.g.remove(e.oeufs);
  e.oeufs = new THREE.Group(); e.g.add(e.oeufs);
  o.forEach((k, i) => { const n = NICHOIRS[i % 2], r = Math.floor(i / 2), m = new THREE.Mesh(OEUF_GEO, OEUF_MAT[sorteOeuf(k)]);
    m.position.set(n.x + (r % 2 ? .09 : -.09) * (r ? 1 : 0) + (r > 1 ? (r - 2) * .05 : 0), n.y, n.z - .02 + (r > 1 ? .05 : 0)); m.rotation.z = (i % 3 - 1) * .5;
    if(sorteOeuf(k) === "belOeuf") m.scale.setScalar(1.25); e.oeufs.add(m); });
}

let tick = 0;
/* À chaque image (main.js) : dehors, les bêtes de chaque abri vivent ; seulement près du personnage (au loin, elles attendent) */
export function updateElevage(dt, dehors){
  groupe.visible = dehors;
  if(!dehors) return;
  const nuit = nuitIci() > .7;
  const vus = new Set();
  for(const b of state.buildings){
    if(!ABRIS[b.type]) continue;
    let e = enclos.get(b.id);
    if(!e){ e = {g: new THREE.Group()}; groupe.add(e.g); enclos.set(b.id, e); }
    const s = sizeOf(b.type);
    e.g.position.set(b.x - H + s / 2, 0, b.z - H + s / 2); e.g.rotation.y = (b.rot || 0) * Math.PI / 2;
    e.g.visible = !nuit;                                                              // la nuit, les poules dorment dans la cabane
    vus.add(b.id);
    pontes(b); montrerOeufs(e, b);
    const couve = animauxDe(b).some(a => a.couve);
    if(couve && !e.nid){ e.nid = nidModele(); e.nid.position.set(NID.x, 0, NID.z); e.g.add(e.nid); }
    if(!couve && e.nid){ e.g.remove(e.nid); e.nid = null; }
    if(e.grain && Date.now() > e.grain.fin){ e.g.remove(e.grain.mesh); e.grain = null; }
    const pres = Math.hypot(player.position.x - e.g.position.x, player.position.z - e.g.position.z) < 26;
    for(const a of animauxDe(b)){
      let v = betes.get(a.id);
      if(v && v.k !== sorteDe(a.esp, a.sexe, estPetit(a))){ v.parent.remove(v.m.g); v = null; }   // le poussin devenu grand : coq ou poule
      if(!v || v.parent !== e.g){ if(v) v.parent.remove(v.m.g); v = nouvelleBete(a, e.g); v.parent = e.g; betes.set(a.id, v); }
      if(estPetit(a)) v.m.g.scale.setScalar(.8 + .6 * Math.min(1, (Date.now() - a.ne) / ADULTE));   // il grandit en temps réel
      if(pres && !nuit) bouger(v, dt, e);
    }
  }
  for(const [id, e] of enclos) if(!vus.has(id)){ groupe.remove(e.g); enclos.delete(id); }
  for(const [id, v] of betes) if(!state.animaux.some(a => a.id === id) || !vus.has(state.animaux.find(a => a.id === id).abri)){ v.parent.remove(v.m.g); betes.delete(id); }
}
/* Pour la vérification */
export const betesVisibles = () => [...betes.values()].filter(v => v.parent.visible && groupe.visible).length;
