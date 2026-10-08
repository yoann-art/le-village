/* ================= Le combat (étape 1.8, morceau 2) =================
   Bible : « Combat en temps réel : […] trois boutons pour attaquer, esquiver par une roulade et utiliser un objet
   rapide (potion, plat, bombe). Visée automatique sur le monstre le plus proche. » Choix de Yo (étape 1.3) : les
   boutons à gauche, le joystick à droite. Seulement dans la grotte (le village est un refuge) :
   - la vie : COMBAT.vie cœurs en haut de l'écran ; ils reviennent tous en sortant de la grotte ;
   - ⚔️ Attaquer : l'épée (celle qu'on tient, sinon la plus forte du sac) se met en main ; le personnage se tourne
     vers le monstre le plus proche (jusqu'à COMBAT.vise), fait un pas vers lui, et le touche à moins de
     COMBAT.portee : autant de dégâts que la force de l'épée (bois 1, cuivre 2) ;
   - 🤸 Roulade : une culbute dans le sens du joystick (sinon droit devant) ; pendant la roulade, rien ne touche ;
   - 🍢 Soin, l'objet rapide : un poisson grillé rend COMBAT.soin cœurs ;
   - une morsure enlève des cœurs ; ensuite, un court répit (le personnage clignote) ;
   - à 0 cœur : en attendant le morceau 4 (le réveil au village, la moitié du butin perdue), on se retrouve dans la
     forêt, devant la grotte, sans rien perdre.
   Sur ordinateur : Espace pour attaquer, E pour rouler, F pour manger. Les monstres : monstres.js. */
import { $ } from "./outils.js";
import { COMBAT, OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { porte, sacCount, sacTake } from "./regles.js";
import { player, placePlayer, regard, elan, enRoulade, clignoter, pencheMain } from "./monde/personnage.js";
import { currentPlace, isBusy, quitterGrotte } from "./lieux.js";
import { barreAuto, hold, syncBarre } from "./barre.js";
import { toast, wrap } from "./interface.js";
import { updateMonstres, plusProche, frapper } from "./monstres.js";

const coeurs = $("#coeurs"), boutons = $("#combat"), bRoul = $("#btn-roulade"), bObj = $("#btn-objet"), nObj = $("#objet-n");
const aie = $("#aie"), but = $("#goal");
let dans = false, vie = COMBAT.vie, vaincu = false, repit = 0, attente = 0, roule = 0, coup = 0, conseil = false;
const COUP = .22;                                       // la durée du geste de l'épée
const pret = () => dans && !vaincu && !isBusy() && wrap.hidden;
const vibre = ms => { try{ const u = navigator.userActivation; if(navigator.vibrate && (!u || u.hasBeenActive)) navigator.vibrate(ms); }catch(_){} };
const rejoue = (el, cl) => { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); };

/* ----- Les cœurs ----- */
function afficher(touche){
  coeurs.innerHTML = [...Array(COMBAT.vie)].map((_, i) => `<i${i < vie ? "" : ' class="vide"'}>❤️</i>`).join("");
  coeurs.setAttribute("aria-label", `Ta vie : ${vie} cœur${vie > 1 ? "s" : ""} sur ${COMBAT.vie}`);
  if(touche){ rejoue(coeurs, "secoue"); rejoue(aie, "on"); }
}

/* ----- ⚔️ Attaquer ----- */
function epee(){
  const k = state.main;
  if(k && OUTILS[k] && OUTILS[k].famille === "arme") return k;
  return porte().map(it => it.k).filter(k => OUTILS[k] && OUTILS[k].famille === "arme").sort((a, b) => OUTILS[b].force - OUTILS[a].force)[0] || null;
}
function attaquer(){
  if(!pret() || attente > 0 || enRoulade()) return;
  const k = epee();
  if(!k){ toast("🗡️ Il te faut une épée : l'épée en bois se fabrique à l'établi de la Scierie (4 planches). En attendant, roule (🤸) pour éviter les coups", 4600); return; }
  if(state.main !== k){ barreAuto(k); hold(k); }
  attente = COMBAT.coup; coup = COUP;
  const c = plusProche(COMBAT.vise);
  if(!c) return;                                        // personne : un coup dans le vide
  const p = player.position, ux = (c.m.x - p.x) / (c.d || 1), uz = (c.m.z - p.z) / (c.d || 1);
  placePlayer(p.x, p.z, ux, uz);                        // la visée automatique : face au monstre
  const pas = Math.min(COMBAT.pas, Math.max(0, c.d - .9));
  if(pas > .05) elan(ux * pas / .12, uz * pas / .12, .12, false);
  if(c.d - pas <= COMBAT.portee){ frapper(c.m, OUTILS[k].force, ux, uz); vibre(25); }
}

/* ----- 🤸 Roulade ----- */
function rouler(){
  if(!pret() || roule > 0 || enRoulade()) return;
  const R = COMBAT.roulade, d = regard(), p = player.position;
  placePlayer(p.x, p.z, d.x, d.z);
  elan(d.x * R.dist / R.duree, d.z * R.dist / R.duree, R.duree, true);
  roule = R.duree + R.attente;
}

/* ----- 🍢 Soin : le poisson grillé ----- */
function manger(){
  if(!pret()) return;
  if(!sacCount("poissonGrille")){ toast("🍢 Pas de poisson grillé sur toi : il se cuisine au fourneau de la Taverne (un poisson et un brin de thym)", 4200); return; }
  if(vie >= COMBAT.vie){ toast("❤️ Tu as déjà toute ta vie : garde ton poisson grillé pour plus tard", 2400); return; }
  sacTake("poissonGrille", 1); syncBarre();
  const avant = vie;
  vie = Math.min(COMBAT.vie, vie + COMBAT.soin);
  afficher(); save();
  toast(`🍢 Miam ! +${vie - avant} cœur${vie - avant > 1 ? "s" : ""}`, 1600);
}

/* ----- Blessé par un monstre (monstres.js) : false si le coup est esquivé ----- */
function blesser(n, m){
  if(vaincu || repit > 0 || enRoulade()) return false;
  vie = Math.max(0, vie - n); repit = COMBAT.repit;
  clignoter(COMBAT.repit);
  const p = player.position, d = Math.hypot(p.x - m.x, p.z - m.z) || 1;
  elan((p.x - m.x) / d * 4, (p.z - m.z) / d * 4, .14, false);   // le choc le repousse un peu
  afficher(true); vibre(160);
  if(vie <= 0) defaite();
  else if(vie <= 2 && !conseil && sacCount("poissonGrille")){ conseil = true; toast("🍢 Plus beaucoup de cœurs : mange un poisson grillé (bouton 🍢 Soin)", 3600); }
  return true;
}
/* À 0 cœur (en attendant le morceau 4) : réveil dans la forêt, devant la grotte, sans rien perdre */
function defaite(){
  vaincu = true;
  toast("💫 Tu t'effondres… et tu te réveilles dans la forêt, devant la grotte, toute ta vie revenue. Cette fois, rien n'est perdu.", 5200);
  const sortir = () => { if(!dans) return; if(isBusy()) setTimeout(sortir, 300); else quitterGrotte(); };
  setTimeout(sortir, 800);
}

/* ----- Les boutons : au toucher (pointerdown, plus vif qu'un clic) ; le clavier passe par le clic ----- */
function bouton(id, f){
  const b = $(id);
  let doigt = false;
  b.addEventListener("pointerdown", e => { e.preventDefault(); doigt = true; f(); });
  b.addEventListener("click", () => { if(doigt){ doigt = false; return; } f(); });
}
bouton("#btn-attaque", attaquer);
bouton("#btn-roulade", rouler);
bouton("#btn-objet", manger);
window.addEventListener("keydown", e => {
  if(!dans || !wrap.hidden || e.repeat) return;
  if(e.code === "Space"){ e.preventDefault(); attaquer(); }
  else if(e.code === "KeyE") rouler();
  else if(e.code === "KeyF") manger();
});

/* ----- À chaque image (main.js) ; actif : le jeu n'attend pas (pas de panneau ouvert, pas de fondu) ----- */
export function updateCombat(dt, actif){
  const p = currentPlace(), ici = !!p && p.b.type === "grotte";
  if(ici !== dans){                                     // on entre dans la grotte, ou on en sort : toute la vie
    dans = ici; vie = COMBAT.vie; vaincu = false; repit = attente = roule = 0; conseil = false;
    coeurs.hidden = boutons.hidden = !ici;
    if(but) but.hidden = ici;                           // les cœurs prennent la place de l'objectif du Château
    if(ici) afficher();
    if(coup){ coup = 0; pencheMain(); }
  }
  updateMonstres(dt, ici, actif && !vaincu, blesser);
  if(!ici) return;
  repit = Math.max(0, repit - dt); attente = Math.max(0, attente - dt); roule = Math.max(0, roule - dt);
  bRoul.classList.toggle("attend", roule > 0);
  if(coup > 0){ coup = Math.max(0, coup - dt); pencheMain(coup ? -.5 + (1 - coup / COUP) * 2 : undefined); }   // l'épée s'abat
  const n = sacCount("poissonGrille");
  if(nObj.textContent !== String(n)) nObj.textContent = n;
  bObj.classList.toggle("vide", !n);
}

/* ----- Pour la vérification automatique ----- */
export const vieCombat = () => vie;
export const combat = {attaquer, rouler, manger, blesser};
