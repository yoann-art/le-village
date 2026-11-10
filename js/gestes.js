/* ================= Les gestes avec les objets (chantier de la décoration, étape 2 ; Yo, 7 novembre 2026) =================
   Yo : « Même si c'est des objets de décoration j'aimerais que le personnage puisse interagir avec (exemple un lit, le
   personnage peut s'allonger, une chaise s'asseoir,...) ». Tout près d'un objet, le bouton #btn-geste :
   - s'asseoir sur le tabouret, la chaise, le banc (deux places) ; s'allonger dans le lit ; un mouvement du joystick relève
     le personnage (personnage.js : poser, seLever) ; le bouton dit alors « Se lever » ;
   - allumer ou éteindre une lumière (la chandelle, les lanternes, la torchère et sa torche, le lustre, le chandelier, le feu
     de camp, le brasero, le lampadaire, la cheminée), dedans comme dehors ; éteinte, elle le reste (o.eteint, sauvegardé) ;
   - toucher le bocal à lucioles : elles brillent plus fort un instant.
   Dans une pièce : les meubles posés ; dehors : les lumières posées sur les cases tout autour, et celles accrochées aux façades. */
import { $ } from "./outils.js";
import { MEUBLES, LUMIERE, resteFeu, figerFeu, tableDeLaChaise, TIREE } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { player, poser, seLever, posture, poseObjet, regard } from "./monde/personnage.js";
import { footOf } from "./monde/meubles.js";
import { refreshItemMesh, placeItemMesh } from "./monde/interieurs.js";
import { map, N, idx, inb, tileOf, centerOf, setEtat } from "./monde/ile.js";
import { currentPlace } from "./lieux.js";
import { placeMesh, lumieresFacades } from "./monde/batiments.js";
import { eclatLucioles } from "./lumieres.js";
import { toast } from "./interface.js";
import { jouer } from "./sons.js";

/* Ce qu'on peut faire avec chaque objet : s'asseoir (la hauteur du siège), s'allonger, l'allumer et l'éteindre, le toucher */
const SIEGES = {tabouret: .46, chaise: .46, fauteuil: .52, banc: .4};   // la hauteur du dessus de chaque siège (meubles.js)
const LIT = {lit: .5};   // le dessus de la couverture (meubles.js)
const ALLUMABLES = new Set([...Object.keys(LUMIERE).filter(k => k !== "bocalLucioles"), "cheminee"]);
const leNom = m => `${m.une ? "la" : "le"} ${m.nom.toLowerCase()}`;
const nomLumiere = (it, m) => it.type === "chandelle" ? "la chandelle" : leNom(m);   // le bougeoir : on éteint sa chandelle
const geste = it => it.type === "rideau" ? "rideau" : SIEGES[it.type] ? "assis" : LIT[it.type] ? "allonge" : it.type === "bocalLucioles" ? (it.lucioles ? "toucher" : null)
  : ALLUMABLES.has(it.type) && (!LUMIERE[it.type] || ((!LUMIERE[it.type].torche || it.torche) && (!LUMIERE[it.type].bougie || it.bougie) && (!LUMIERE[it.type].buche || resteFeu(it) > 0))) ? "lumiere" : null;   // la cheminée, avec ses bûches   // une torchère : seulement avec sa torche ; un bougeoir, avec sa chandelle

/* Du repère d'un meuble posé (rot : ses quarts de tour, comme interieurs.js) vers la pièce */
const versPiece = (it, lx, lz) => { const a = -(it.rot || 0) * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
  return {x: it.x + lx * c + lz * s, z: it.z - lx * s + lz * c}; };
const versMeuble = (it, x, z) => { const a = -(it.rot || 0) * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), dx = x - it.x, dz = z - it.z;
  return {x: dx * c - dz * s, z: dx * s + dz * c}; };

/* S'asseoir : sur la chaise ou le fauteuil, face au devant (le dossier derrière) ; sur le banc, à la place la plus proche, du côté où l'on est ;
   sur le tabouret, tourné comme on était */
/* Une chaise rangée sous sa table (Yo, 10 novembre 2026 : « quand le joueur veut s'asseoir elles se décalent automatiquement ») :
   elle recule d'abord (it.tiree : sa place rangée), et se range quand on se lève */
function tirer(it){
  const place = currentPlace(), items = place && place.b.deco ? place.b.deco.items : [];
  if(it.type !== "chaise" || it.tiree || !tableDeLaChaise(it, items)) return;
  const f = versPiece(it, 0, 1);
  it.tiree = {x: it.x, z: it.z};
  it.x = Math.round((it.x - (f.x - it.x) * TIREE) * 100) / 100; it.z = Math.round((it.z - (f.z - it.z) * TIREE) * 100) / 100;
  placeItemMesh(it);
}
function ranger(items){
  for(const it of items) if(it.tiree){ it.x = it.tiree.x; it.z = it.tiree.z; delete it.tiree; placeItemMesh(it); save(); }
}
function asseoir(it){
  tirer(it);
  const p = player.position, h = SIEGES[it.type];
  if(it.type === "chaise" || it.type === "fauteuil"){ const q = versPiece(it, 0, it.type === "fauteuil" ? .06 : .1), f = versPiece(it, 0, 1); poser({type: "assis", it, x: q.x, y: h, z: q.z, fx: f.x - it.x, fz: f.z - it.z}); return; }
  if(it.type === "banc"){
    const l = versMeuble(it, p.x, p.z), cote = l.z >= 0 ? 1 : -1, q = versPiece(it, l.x >= 0 ? .38 : -.38, cote * .08), f = versPiece(it, 0, cote);
    poser({type: "assis", it, x: q.x, y: h, z: q.z, fx: f.x - it.x, fz: f.z - it.z}); return;
  }
  const r = regard(); poser({type: "assis", it, x: it.x, y: h, z: it.z, fx: r.x, fz: r.z});
}
/* S'allonger dans le lit : la tête sur l'oreiller (au fond du lit), les pieds vers le pied du lit */
function allonger(it){
  const q = versPiece(it, 0, .15), f = versPiece(it, 0, 1);
  poser({type: "allonge", it, x: q.x, y: LIT[it.type], z: q.z, fx: f.x - it.x, fz: f.z - it.z});
}
/* Allumer ou éteindre : le meuble de la pièce (it), ou la case de l'île (i) */
function basculer(c, m){
  let eteint;
  if(c.i !== undefined){ const o = state.ile[c.i] || {}; eteint = !o.eteint;
    if(MEUBLES[map.obj[c.i]] && MEUBLES[map.obj[c.i]].support === "buche"){ const f = {...o}; figerFeu(f, eteint); setEtat(c.i, {eteint: eteint || undefined, feu: f.feu, reste: f.reste}); }   // le feu de camp : ses bûches s'arrêtent de brûler
    else setEtat(c.i, {eteint: eteint || undefined}); }   // setEtat refait la case
  else { const it = c.it; eteint = !it.eteint; if(MEUBLES[it.type].support === "buche") figerFeu(it, eteint);   // la cheminée : ses bûches s'arrêtent de brûler
    if(eteint) it.eteint = true; else delete it.eteint; c.refaire(); }
  save(); jouer(eteint ? "meuble" : "peindre");
  toast(eteint ? `🌙 ${m.nom} éteint${m.une ? "e" : ""}` : `🔥 ${m.nom} allumé${m.une ? "e" : ""}`, 1600);
}

/* L'objet le plus proche, à portée de main : {it, refaire} (dans la pièce) ou {it: l'état de la case, i, refaire} (dehors) */
function prochain(place){
  const p = player.position;
  let best = null, dmin = Infinity;
  if(place){
    for(const it of (place.b.deco && place.b.deco.items) || []){
      if(!MEUBLES[it.type] || !geste(it)) continue;
      const [w, d] = footOf(it), dx = Math.abs(p.x - it.x) - w / 2, dz = Math.abs(p.z - it.z) - d / 2;
      if(dx > .8 || dz > .8) continue;
      const dist = Math.hypot(Math.max(0, dx), Math.max(0, dz));
      if(dist < dmin){ dmin = dist; best = {it, refaire: () => refreshItemMesh(it)}; }
    }
    return best;
  }
  const x0 = tileOf(p.x), z0 = tileOf(p.z);
  for(let b = -1; b <= 1; b++) for(let a = -1; a <= 1; a++){
    const x = x0 + a, z = z0 + b;
    if(!inb(x, z)) continue;
    const i = idx(x, z), o = map.obj[i];
    if(!o || !MEUBLES[o]) continue;
    const it = Object.assign({type: o}, state.ile[i] || {});
    if(!geste(it)) continue;
    const dist = Math.hypot(centerOf(x) - p.x, centerOf(z) - p.z);
    if(dist < dmin && dist < 1.4){ dmin = dist; best = {it, i, refaire: null}; }
  }
  /* les lumières accrochées à la façade de devant d'un bâtiment (la lanterne murale, la torchère murale : Yo, 9 novembre 2026,
     « avec possibilité de l'éteindre ») : on se tient devant elles */
  for(const {x, z, f, b} of lumieresFacades()){
    if(!geste(f)) continue;
    const dist = Math.hypot(x - p.x, z - p.z);
    if(dist < dmin && dist < 1.2){ dmin = dist; best = {it: f, refaire: () => placeMesh(b)}; }
  }
  return best;
}

const btn = $("#btn-geste");
let cible = null, ou = null;                           // ou : où était l'objet sur lequel on s'est assis ou allongé
const DEDANS_SANS = ["mine", "foret", "grotte", "marais", "trajet"];
/* À chaque image (main.js) ; actif : le personnage est libre (ni décoration, ni fenêtre ouverte) */
export function updateGestes(actif){
  const place = currentPlace();
  if(!posture() && place && place.b.deco) ranger(place.b.deco.items);   // levé : la chaise tirée se range sous la table
  if(posture()){                                       // assis ou allongé : le bouton le relève ; l'objet rangé, déplacé ou tourné, il se relève seul
    const it = poseObjet(), items = place && place.b.deco ? place.b.deco.items : [];
    if(!items.includes(it) || !ou || it.x !== ou.x || it.z !== ou.z || (it.rot || 0) !== ou.rot) seLever();
    else if(!actif){ if(!btn.hidden) btn.hidden = true; return; }   // une fenêtre ouverte : on reste assis
    else { cible = {lever: true}; montrer("🧍 Se lever"); return; }
  }
  cible = actif && !(place && DEDANS_SANS.includes(place.b.type)) ? prochain(place) : null;
  if(!cible){ if(!btn.hidden) btn.hidden = true; return; }
  const it = cible.it, m = MEUBLES[it.type], g = geste(it);
  montrer(g === "rideau" ? (it.ferme ? "🪟 Ouvrir le rideau" : "🪟 Fermer le rideau") : g === "assis" ? `🪑 S'asseoir` : g === "allonge" ? `🛏️ S'allonger` : g === "toucher" ? `✨ Toucher ${leNom(m)}`
    : it.eteint ? `🔥 Allumer ${nomLumiere(it, m)}` : `🌙 Éteindre ${nomLumiere(it, m)}`);
}
function montrer(txt){
  if(btn.textContent !== txt) btn.textContent = txt;
  if(btn.hidden) btn.hidden = false;
}
/* Faire le geste de l'objet visé (le bouton ; la vérification) */
export function faireGeste(){
  const c = cible;
  if(!c) return false;
  if(c.lever){ seLever(); return true; }
  const it = c.it, m = MEUBLES[it.type], g = geste(it);
  if(g === "assis" || g === "allonge"){ (g === "assis" ? asseoir : allonger)(it); ou = {x: it.x, z: it.z, rot: it.rot || 0}; jouer("meuble"); }
  else if(g === "toucher"){ eclatLucioles(); jouer("cueillir"); }
  else if(g === "lumiere") basculer(c, m);
  else if(g === "rideau"){ if(it.ferme) delete it.ferme; else it.ferme = true; c.refaire(); save(); jouer("meuble"); }   // fermé, il assombrit la pièce (interieurs.js)
  return true;
}
btn.addEventListener("click", faireGeste);
