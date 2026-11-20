/* ================= L'élevage =================
   Yo, 20 novembre 2026 : « Je veux pouvoir déjà les élever ». Premier envoi : les poules. On bâtit la Ferme, puis le poulailler
   qu'on pose contre elle (choix de Yo : un petit bâtiment à part) ; au comptoir du Marché, on achète une poule ou un coq ; il
   s'installe au poulailler et s'y promène, comme un vrai : il marche, picore, gratte le sol, tourne la tête ; la nuit, les
   poules rentrent dans la cabane. Un animal ne meurt jamais et ne s'enfuit pas (le Grand Carnet : le refuge).
   state.animaux = [{id, esp, sexe ("f" ou "m"), ne (l'heure de sa naissance), abri (l'id du bâtiment), nom, gen}].
   À venir (envois suivants, accord de Yo) : nourrir, les œufs, le bonheur, la fiche de l'animal ; la couvaison, les poussins
   qui grandissent, les générations. */
import { B, ELEVAGE, ABRIS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { scene } from "./monde/scene.js";
import { H } from "./monde/ile.js";
import { sizeOf } from "./regles.js";
import { nuitIci } from "./monde/ciel.js";
import { player } from "./monde/personnage.js";
import { ENCLOS } from "./monde/poulailler.js";
import { modeleAnimal, sorteDe, COU } from "./monde/poules3d.js";

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
  m: ["Gaston", "Hector", "Fernand", "Barnabé", "Anatole", "Léon", "Firmin", "Achille"]}};
function nomAuHasard(esp, sexe){
  const pris = new Set(state.animaux.map(a => a.nom)), l = (NOMS[esp] && NOMS[esp][sexe]) || ["Petit"];
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
/* Ce qu'on voit dans la fiche du poulailler (construire.js) */
export function ficheAbri(b){
  const l = animauxDe(b), max = ABRIS[b.type] ? ABRIS[b.type].places : 0;
  const lignes = l.map(a => `<div class="brow"><div class="be" aria-hidden="true">${emojiAnimal(a)}</div>
    <div class="bt"><span class="bn">${a.nom}</span><p>${nomEspece(a)} ${a.sexe === "m" ? "♂" : "♀"} · génération ${a.gen}</p></div></div>`).join("");
  return `<p style="margin:4px 0">${l.length} sur ${max} places.</p>` + (lignes ||
    `<p class="muted">Pas encore de poules. Achète des poules et des coqs au comptoir du Marché : ils viennent s'installer ici.</p>`);
}

/* ----- Les bêtes dans leur enclos ----- */
const groupe = new THREE.Group(); groupe.name = "élevage"; scene.add(groupe);
const enclos = new Map();                       // b.id → {g}
const betes = new Map();                        // a.id → {m (modeleAnimal), x, z, dir, act, t, T, vers, sorte}
const { x0, x1, z0, z1 } = ENCLOS, BORD = .22;
const auHasard = () => ({x: x0 + BORD + Math.random() * (x1 - x0 - 2 * BORD), z: z0 + BORD + Math.random() * (z1 - z0 - 2 * BORD)});
function nouvelleBete(a, g){
  const k = sorteDe(a.esp, a.sexe, estPetit(a)), m = modeleAnimal(k), p = auHasard();
  const v = {m, k, x: p.x, z: p.z, dir: Math.random() * Math.PI * 2, act: "repos", t: 0, T: 1 + Math.random() * 2, vers: null, pas: Math.random() * 6};
  m.g.position.set(v.x, 0, v.z); g.add(m.g);
  return v;
}
/* Ce que fait une bête ensuite : marcher (le plus souvent), picorer, gratter le sol, se reposer en tournant la tête */
function choisir(v){
  const r = Math.random();
  v.t = 0;
  if(r < .42){ v.act = "marche"; v.vers = auHasard(); v.T = 6; }
  else if(r < .72){ v.act = "picore"; v.T = 1.6 + Math.random() * 2; }
  else if(r < .88){ v.act = "gratte"; v.T = 1.2 + Math.random(); }
  else { v.act = "repos"; v.T = 1.5 + Math.random() * 2.5; }
}
const lisse = x => x * x * (3 - 2 * x);
function bouger(v, dt){
  const {corps, tete, pattes} = v.m, petit = v.k === "poussin", vit = petit ? .28 : .38;
  v.t += dt;
  let jambe = 0, penche = 0, tet = 0, tour = 0, gratte = 0;
  if(v.act === "marche"){
    const dx = v.vers.x - v.x, dz = v.vers.z - v.z, d = Math.hypot(dx, dz);
    if(d < .06 || v.t > v.T) choisir(v);
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
    if(v.t > v.T) choisir(v);
  } else if(v.act === "gratte"){
    gratte = Math.sin(v.t * 9); penche = .15;
    if(v.t > v.T){ choisir(v); if(v.act === "marche") { v.act = "picore"; v.T = 1.2; } }   // gratter, puis picorer ce qu'on a trouvé
  } else {
    tour = Math.sin(v.t * 1.3) * .7 * lisse(Math.min(1, v.t));
    if(v.t > v.T) choisir(v);
  }
  v.m.g.position.set(v.x, 0, v.z); v.m.g.rotation.y = v.dir;
  corps.rotation.x = penche; corps.position.y = pattes[0].position.y + (jambe ? Math.abs(Math.cos(v.pas)) * .008 : 0);
  tete.rotation.x = tet; tete.rotation.y = tour;
  pattes[0].rotation.x = jambe + (gratte > 0 ? -gratte * .7 : 0);
  pattes[1].rotation.x = -jambe + (gratte < 0 ? gratte * .7 : 0);
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
    const pres = Math.hypot(player.position.x - e.g.position.x, player.position.z - e.g.position.z) < 26;
    for(const a of animauxDe(b)){
      let v = betes.get(a.id);
      if(!v || v.parent !== e.g){ if(v) v.parent.remove(v.m.g); v = nouvelleBete(a, e.g); v.parent = e.g; betes.set(a.id, v); }
      if(pres && !nuit) bouger(v, dt);
    }
  }
  for(const [id, e] of enclos) if(!vus.has(id)){ groupe.remove(e.g); enclos.delete(id); }
  for(const [id, v] of betes) if(!state.animaux.some(a => a.id === id) || !vus.has(state.animaux.find(a => a.id === id).abri)){ v.parent.remove(v.m.g); betes.delete(id); }
}
/* Pour la vérification */
export const betesVisibles = () => [...betes.values()].filter(v => v.parent.visible && groupe.visible).length;
