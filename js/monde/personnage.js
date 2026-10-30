/* ================= Personnage =================
   Le modèle du personnage, sa marche et les obstacles. */
import { P, G, part, toon } from "./formes.js";
import { scene } from "./scene.js";
import { map, idx, inb, tileOf } from "./ile.js";
import { occ } from "./batiments.js";
import { state } from "../sauvegarde.js";
import { traversable } from "../donnees.js";
import { jv, keys, view } from "../commandes.js";
import { makeOutil } from "./outils3d.js";
import { passageCases } from "./ponton.js";
import { fabriqueHeros } from "./heros.js";

export const player = new THREE.Group();
const body = new THREE.Group();
player.add(body);
/* Le héros, la fille ou le garçon (heros.js, d'après les images de Yo, 30 octobre 2026) : le corps, les bras et les jambes,
   qui se balancent en marchant ; habiller() le refait (la personnalisation) */
let heros = null, legL, legR, armL, armR;
export function habiller(o){
  if(heros) body.remove(heros.corps, ...heros.bras, ...heros.jambes);
  heros = fabriqueHeros(o);
  [armR, armL] = heros.bras; [legR, legL] = heros.jambes;
  body.add(heros.corps, ...heros.bras, ...heros.jambes);
}
habiller((state.perso) || {});
/* La main droite, qui ne sert qu'avec un outil : elle suit le bout du bras droit (placerMains) ; l'outil penche un peu vers
   l'avant (étape 1.4) */
const hand = new THREE.Group();
hand.position.set(-.27, .4, .08);
hand.rotation.x = .35;
hand.visible = false;
body.add(hand);
let held = null, heldK = null;
/* Met un outil dans la main du personnage (une clé de OUTILS), ou la vide (null) */
export function holdTool(k){
  if(held){ hand.remove(held); held = null; }
  if(k){ held = makeOutil(k); hand.add(held); }
  heldK = k || null;
  hand.visible = !!k;
}
/* Pour les mains à la première personne (mains.js) : ce que tient la main droite, son angle (les gestes), et la gauche */
export const outilTenu = () => heldK;
export const angleMain = () => hand.rotation.x;
export const mainGauche = () => torche.visible ? "torche" : lanterneG.visible ? "lanterne" : null;
/* La torche, dans la main gauche (étape 1.8) : allumée dans la grotte, sa flamme vacille (t : le temps) */
const torche = new THREE.Group();
torche.position.set(.27, .4, .1);
torche.add(part(G.cyl, 0x7A4E2A, .05, .42, .05, 0, .16, .04));
const flamme = part(G.head, toon({color: 0xFFB347, emissive: 0xFF8A1E, emissiveIntensity: 1}), .5, .8, .5, 0, .42, .04);
const coeur = part(G.head, toon({color: 0xFFF2B0, emissive: 0xFFE070, emissiveIntensity: 1}), .25, .45, .25, 0, .4, .04);
flamme.castShadow = coeur.castShadow = false;
torche.add(flamme, coeur);
torche.visible = false;
body.add(torche);
/* La lanterne à main (demande de Yo, 11 octobre 2026), à la place de la torche : elle pend sous la main gauche */
const lanterneG = new THREE.Group();
lanterneG.position.set(.27, .4, .1);
lanterneG.add(part(G.cyl, 0xC8743C, .025, .16, .025, 0, -.08, .04));                      // l'anse
lanterneG.add(part(G.cone4, 0xC8743C, .2, .08, .2, 0, -.16, .04));                         // le chapeau
const verreL = part(G.box, toon({color: 0xFFF2C0, emissive: 0xFFC860, emissiveIntensity: 1}), .14, .17, .14, 0, -.28, .04);
verreL.castShadow = false; lanterneG.add(verreL);
lanterneG.add(part(G.box, 0xC8743C, .17, .03, .17, 0, -.38, .04));                        // le fond
lanterneG.visible = false;
body.add(lanterneG);
export function tenirTorche(oui, t = 0, lanterne = false){
  torche.visible = !!oui && !lanterne; lanterneG.visible = !!oui && lanterne;
  if(oui && !lanterne){ const f = 1 + Math.sin(t * 17) * .12 + Math.sin(t * 9.3) * .08; flamme.scale.set(.5 * f, .8 * (2 - f), .5 * f); }
}
/* Penche la main (et l'outil) vers l'avant : rx en radians ; sans rien, la position normale (la pêche s'en sert) */
export function pencheMain(rx){ hand.rotation.x = rx === undefined ? .35 : rx; }
/* Les bras : ils se balancent en marchant (b : le balancement) ; un outil en main, le bras droit se lève devant et suit le geste
   (l'angle de la main) ; la torche ou la lanterne, le bras gauche se lève un peu ; la main (l'outil, la torche) est au bout */
const bout = new THREE.Vector3();
function placerMains(b){
  armR.rotation.x = hand.visible ? -.55 - (hand.rotation.x - .35) * .55 : b;
  armL.rotation.x = torche.visible || lanterneG.visible ? -.65 : -b;
  for(const [bras, m] of [[armR, hand], [armL, torche], [armL, lanterneG]]){
    if(!m.visible) continue;
    bras.updateMatrix(); m.position.copy(bout.set(0, -heros.longBras, .01).applyMatrix4(bras.matrix));
  }
}
player.scale.setScalar(P / 1.12);   // le modèle fait 1,12 de haut : le personnage mesure 1 P
scene.add(player);

/* Où peut-on marcher ? Dehors, sur l'île et sur le ponton ; dedans, dans la pièce (voir lieux.js) */
export const R = .26;
export function islandWalkable(wx, wz){
  const x = tileOf(wx), z = tileOf(wz);
  if(!inb(x,z)) return false;
  const i = idx(x,z);
  return (map.type[i] !== "water" || passageCases.has(i)) && traversable(map.obj[i]) && !occ.has(i);   // on traverse les herbes hautes, le thym et les fleurs
}
let walkable = islandWalkable;
export function setWalkable(fn){ walkable = fn; }
const free = (wx, wz) => walkable(wx-R, wz-R) && walkable(wx+R, wz-R) && walkable(wx-R, wz+R) && walkable(wx+R, wz+R);
export const libre = free;
/* Ne jamais rester coincé (bugs de Yo, 6 octobre 2026 : un arbre planté contre le personnage, une partie rouverte
   dans un bâtiment) : s'il se retrouve dans un obstacle, il glisse jusqu'à la place libre la plus proche */
export function degager(){
  const p = player.position;
  if(free(p.x, p.z)) return false;
  for(let r = .1; r <= 8; r += .1){
    const n = Math.max(8, Math.round(r * 12));
    for(let k = 0; k < n; k++){
      const a = k / n * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if(free(x, z)){ p.x = x; p.z = z; return true; }
    }
  }
  return false;
}
player.position.set(state.player.x, 0, state.player.z);
degager();
const facing = {x:0, z:1};

/* La vue à la première personne (demande de Yo, 13 octobre 2026 ; vue.js) : le corps est caché (la caméra est à la place
   de ses yeux), le doigt tourne son regard (tournerVue) ; le joystick avance et recule, et tourne la vue en poussant à gauche
   ou à droite (Yo, v1.13.21 : « c'est dur et pas ergonomique de regarder autour de soi et de se déplacer avec le joystick » ;
   son choix : « Joystick qui tourne ») */
let fps = false;
export function modeFPS(oui){ fps = !!oui; player.visible = !fps; }
export function tournerVue(da){
  const a = Math.atan2(facing.x, facing.z) + da;
  facing.x = Math.sin(a); facing.z = Math.cos(a);
}
/* Où va le personnage : le sens de la marche si l'on pousse le joystick, sinon là où il regarde (la roulade s'en sert) */
const sens = {x: 0, z: 1};
let pousse = false;
export const sensMarche = () => pousse ? {x: sens.x, z: sens.z} : {x: facing.x, z: facing.z};

/* Pose le personnage à un endroit, tourné dans une direction (entrée et sortie des bâtiments) */
export function placePlayer(x, z, fx, fz){
  player.position.set(x, 0, z);
  facing.x = fx; facing.z = fz;
  player.rotation.y = Math.atan2(fx, fz);
}

/* L'allure du personnage : de 0 (immobile) à 1 (il court) ; « à pas de loup » sous ALLURE_DOUCE (étape 1.7 :
   les insectes et les oiseaux ne fuient pas si on s'approche doucement, joystick poussé à moitié) */
let allureNow = 0;
export const ALLURE_DOUCE = .55;
export const allure = () => allureNow;
/* Déplacement : renvoie true si le joueur pousse le joystick (même contre un mur) */
const SPEED = 3.4;
/* À la première personne : le joystick poussé à fond sur le côté tourne la vue de TOURNE radians par seconde (un tour en
   un peu plus de 3 s) ; un petit écart (MORT) ne compte pas, pour avancer tout droit sans dériver ; reculer, moins vite */
const TOURNE = 2, MORT = .15, RECUL = .7;
const doux = v => { const a = Math.abs(v); return a < MORT ? 0 : Math.sign(v) * Math.min(1, (a - MORT) / (1 - MORT)); };
let walkT = 0;
/* La direction où regarde le personnage (vecteur de longueur 1 ; la pêche vise avec) */
export const regard = () => ({x: facing.x, z: facing.z});
export function dir4(){ return Math.abs(facing.x) > Math.abs(facing.z) ? {x:Math.sign(facing.x), z:0} : {x:0, z:Math.sign(facing.z) || 1}; }
/* Viser ce qu'on regarde (morceau B3 de la première personne, demande de Yo, 13 octobre 2026) : main.js donne, à chaque
   image à la première personne, la visée {sol} (sol : la distance du point du sol qu'on regarde, si l'on regarde le sol
   tout près ; sinon null), et null vu de dessus */
let visee = null;
export function viser(v){ visee = v; }
/* Le point à dist P devant le personnage, là où l'on cherche ce qu'il y a à faire (recolte.js, terraformer.js…) : vu de
   dessus, dans l'une des 4 directions ; à la première personne, exactement dans la direction du regard, et, si l'on
   regarde le sol tout près, le point du sol regardé */
export function devant(dist){
  const p = player.position;
  if(visee){
    const s = visee.sol != null && dist > 0 ? visee.sol : dist;
    return {x: p.x + facing.x * s, z: p.z + facing.z * s};
  }
  const d = dir4();
  return {x: p.x + d.x * dist, z: p.z + d.z * dist};
}
export function frontTile(dist){
  const q = devant(dist);
  return [tileOf(q.x), tileOf(q.z)];
}
/* Un élan (étape 1.8) : la roulade (roule : il fait la culbute), ou le recul quand un monstre le blesse ; vx, vz en P/s,
   pendant T secondes ; le joystick n'agit pas pendant ce temps */
let elanEnCours = null;
export function elan(vx, vz, T, roule){ elanEnCours = {vx, vz, t: 0, T, roule}; }
export const enRoulade = () => !!(elanEnCours && elanEnCours.roule);
/* Après une blessure, il clignote pendant t secondes */
let clign = 0;
export function clignoter(t){ clign = t; }
function bouger(dt){
  const e = elanEnCours, p = player.position;
  e.t += dt;
  const nx = p.x + e.vx * dt, nz = p.z + e.vz * dt;
  if(free(nx, p.z)) p.x = nx;
  if(free(p.x, nz)) p.z = nz;
  const u = Math.min(1, e.t / e.T), a = e.roule ? u * Math.PI * 2 : 0;
  /* la culbute tourne autour du milieu du corps (à .45 du sol), et le soulève un peu */
  body.rotation.x = a;
  body.position.set(0, e.roule ? .45 - .45 * Math.cos(a) + Math.sin(u * Math.PI) * .25 : 0, e.roule ? -.45 * Math.sin(a) : 0);
  legL.rotation.x = legR.rotation.x = e.roule ? -.9 : 0;
  placerMains(0); if(e.roule) armL.rotation.x = armR.rotation.x = -1.3;
  if(e.t >= e.T){ elanEnCours = null; body.rotation.x = 0; body.position.set(0, 0, 0); }
}
/* Ralenti un moment (étape 1.13, morceau 6 : la sangsue géante s'accroche) */
let lent = 0;
export function ralentir(t){ lent = Math.max(lent, t); }
export function updatePlayer(dt){
  if(lent > 0) lent = Math.max(0, lent - dt);
  degager();                                          // coincé (un arbre planté, un bâtiment, un meuble posé dessus) : il se dégage
  if(clign > 0){ clign -= dt; body.visible = clign <= 0 || Math.floor(clign * 12) % 2 === 0; }
  else if(!body.visible) body.visible = true;
  if(elanEnCours){ bouger(dt); allureNow = 0; return false; }
  let ix = jv.x, iz = jv.z;
  if(!ix && !iz){
    ix = (keys.r||0) - (keys.l||0); iz = (keys.d||0) - (keys.u||0);
    const l = Math.hypot(ix, iz); if(l){ ix /= l * (keys.lent ? 2.5 : 1); iz /= l * (keys.lent ? 2.5 : 1); }   // Maj : à pas de loup
  }
  const pousseJoy = Math.hypot(ix, iz) > 0;
  let mag = Math.min(1, Math.hypot(ix, iz));
  pousse = pousseJoy;
  if(fps && pousseJoy){                                 // première personne : le haut avance, le bas recule, les côtés tournent
    const fx = facing.x, fz = facing.z, l = Math.hypot(ix, iz);
    sens.x = (fx * -iz - fz * ix) / l; sens.z = (fz * -iz + fx * ix) / l;   // le sens poussé, par rapport au regard (la roulade)
    const t = doux(ix), av = doux(-iz);
    if(t) tournerVue(-Math.sign(t) * Math.pow(Math.abs(t), 1.4) * TOURNE * dt);
    mag = Math.abs(av);
    if(mag > 0){
      const sp = SPEED * mag * dt * (lent > 0 ? .55 : 1) * (av < 0 ? RECUL : 1), p = player.position, s = Math.sign(av);
      const nx = p.x + facing.x * s * sp, nz = p.z + facing.z * s * sp;
      if(free(nx, p.z)) p.x = nx;
      if(free(p.x, nz)) p.z = nz;
      walkT += dt * 11 * mag;
    }
  } else if(mag > 0){
    const sp = SPEED * mag * dt * (lent > 0 ? .55 : 1), p = player.position, l = Math.hypot(ix, iz);
    const c = Math.cos(view.lacetIci), s = Math.sin(view.lacetIci);            // le joystick suit la caméra : le haut, vers le fond de l'écran
    const ux = (ix * c + iz * s) / l, uz = (iz * c - ix * s) / l;
    const nx = p.x + ux * sp, nz = p.z + uz * sp;
    if(free(nx, p.z)) p.x = nx;
    if(free(p.x, nz)) p.z = nz;
    sens.x = ux; sens.z = uz;
    facing.x = ux; facing.z = uz;
    walkT += dt * 11 * mag;
  }
  allureNow = mag;                                      // tourner sur place ne fait pas fuir les bêtes
  const target = Math.atan2(facing.x, facing.z);
  let d = target - player.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
  player.rotation.y += d * Math.min(1, dt * 14);
  const sw = mag > 0 ? Math.sin(walkT) : 0;
  body.position.y = mag > 0 ? Math.abs(sw) * .05 : 0;
  legL.rotation.x = sw * .6; legR.rotation.x = -sw * .6;
  placerMains(sw * .45);
  return pousseJoy;
}
