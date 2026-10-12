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
import { MEUBLES, LUMIERE } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, sacCount } from "./regles.js";
import { scene } from "./monde/scene.js";
import { map, N, centerOf } from "./monde/ile.js";
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
const eclaire = (type, o) => { const L = LUMIERE[type]; return L && (!L.torche || (o && o.torche)) ? L : null; };

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
/* Les plus proches du personnage reçoivent les vraies lumières ; facteur : leur force (dehors, plus forte la nuit) ;
   celles qui s'allument seules à la nuit tombée suivent la nuit (éteintes le jour, elles laissent leur place) */
let t = 0;
function allumer(pool, liste, facteur){
  const p = player.position, n = nuitIci();
  const list = liste.filter(s => !s.L.nuit || n > .05);
  list.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  pool.forEach((l, k) => {
    const s = list[k];
    if(!s){ if(l.intensity) l.intensity = 0; return; }
    const g = s.x * 7.1 + s.z * 3.3;                 // chaque flamme vacille à sa façon
    const v = s.L.flamme ? 1 + Math.sin(t * 11 + g) * .07 + Math.sin(t * 17.3 + g * 2) * .05
      : s.L.lucioles ? .75 + Math.sin(t * 2.2 + g) * .25 : 1;
    l.color.setHex(s.L.couleur); l.distance = s.L.portee; l.position.set(s.x, s.y, s.z);
    l.intensity = s.L.force * (s.L.nuit ? n : facteur) * v;
  });
  return Math.min(list.length, pool.length);
}
const DEDANS_SANS = ["mine", "foret", "grotte", "marais", "trajet"];       // des lieux sans meubles : rien à éclairer ici
let actives = 0;
/* À chaque image (main.js) ; actif : le personnage est libre (pour le bouton de la torchère) */
export function updateLumieres(dt, actif){
  t += dt;
  fireMat.emissiveIntensity = .85 + Math.sin(t * 9) * .12 + Math.sin(t * 14.7) * .06;   // les flammes vacillent
  lucioleMat.emissiveIntensity = .55 + Math.sin(t * 2.2) * .4;                         // les lucioles palpitent
  const place = currentPlace(), n = nuitIci();
  nuitMat.emissiveIntensity = .06 + .94 * n;                                           // le verre des lanternes de nuit
  if(!place){
    if((releve -= dt) <= 0){ releve = 1; releverIle(); }
    actives = allumer(lumieresDehors, ile, .3 + .7 * n);
    haloMat.opacity = n * .75;
    for(const h of halos.values()) h.visible = n > .02;
  } else if(!DEDANS_SANS.includes(place.b.type)) actives = allumer(lumieresDedans, sourcesDedans(place.b), 1);
  else actives = 0;
  bouton(actif && place && !DEDANS_SANS.includes(place.b.type) ? place : null);
}
/* Pour la vérification : combien de vraies lumières sont allumées ici */
export const lumieresActives = () => actives;

/* ----- Poser une torche sur une torchère ----- */
/* o : la torchère (le meuble de la pièce, ou la case de l'île) ; refaire : refait son modèle */
export function poserTorche(o, refaire){
  if(owned("torche") < 1){ toast("🔥 Il te faut une torche : elle se fabrique à l'établi de la Scierie (1 bois, 2 fibres)", 3600); return false; }
  addOwned("torche", -1);
  if(!sacCount("torche")) state.torche = 0;          // plus de torche sur soi : celle qui brûlait est sur la torchère
  o.torche = true; refaire();
  syncBarre(); save(); renderHUD();
  toast("🔥 Ta torche est posée sur la torchère : elle ne s'éteindra plus jamais", 3400);
  return true;
}
/* Dans une pièce, tout près d'une torchère sans torche : le bouton */
const btn = $("#btn-torchere");
let proche = null;
function bouton(place){
  const p = player.position;
  proche = place && place.b.deco ? place.b.deco.items.find(it => {
    if(!MEUBLES[it.type] || !MEUBLES[it.type].support || it.torche) return false;
    const [w, d] = footOf(it);
    return Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
  }) || null : null;
  if(proche){ const txt = owned("torche") ? "🔥 Poser une torche" : "🔥 Torchère : il lui faut une torche"; if(btn.textContent !== txt) btn.textContent = txt; }
  if(btn.hidden === !!proche) btn.hidden = !proche;
}
btn.addEventListener("click", () => { const it = proche; if(it) poserTorche(it, () => refreshItemMesh(it)); });
