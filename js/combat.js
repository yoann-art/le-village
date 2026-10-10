/* ================= Le combat (étape 1.8, morceaux 2 à 4) =================
   Bible : « Combat en temps réel : […] trois boutons pour attaquer, esquiver par une roulade et utiliser un objet
   rapide (potion, plat, bombe). Visée automatique sur le monstre le plus proche. » Choix de Yo (étape 1.3) : les
   boutons à gauche, le joystick à droite. Dans la grotte (le village est un refuge), et dans la Forêt profonde
   tant qu'un sanglier blessé à l'arc charge (morceau 3) :
   - la vie : COMBAT.vie cœurs en haut de l'écran ; ils reviennent tous en sortant de la grotte (dans la forêt :
     quand le sanglier est vaincu ou parti) ;
   - ⚔️ Attaquer : l'épée (celle qu'on tient, sinon la plus forte du sac) se met en main ; le personnage se tourne
     vers le monstre le plus proche (jusqu'à COMBAT.vise), fait un pas vers lui, et le touche à moins de
     COMBAT.portee : autant de dégâts que la force de l'épée (bois 1, cuivre 2) ;
   - 🤸 Roulade : une culbute dans le sens du joystick (sinon droit devant) ; pendant la roulade, rien ne touche ;
   - 🍢 Soin, l'objet rapide : un poisson grillé rend COMBAT.soin cœurs ;
   - une morsure enlève des cœurs ; ensuite, un court répit (le personnage clignote) ;
   - à 0 cœur, vaincu (morceau 4 ; bible : « réveil au village et perte de la moitié du butin ramassé depuis la
     dernière sortie. Ce qui a été remonté à la surface, l'équipement, l'or et les collections ne se perdent
     jamais ») : on se réveille au village (dans son lit, à la Chaumière, s'il y en a un : reveilVillage, dans
     lieux.js). Le butin de la grotte : ce qu'on porte (sac et cases rapides) en plus de ce qu'on avait en y entrant
     (entree), sans les outils ni les armes ; la moitié de chaque sorte est perdue (pour un nombre impair, la
     dernière à pile ou face). Vaincu dans la forêt (le sanglier) : à la surface, rien n'est perdu. Un panneau dit
     où l'on se réveille, ce qui est perdu et ce qu'on garde.
   Sur ordinateur : Espace pour attaquer, E pour rouler, F pour manger. Les monstres : monstres.js. */
import { $ } from "./outils.js";
import { COMBAT, OUTILS, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { porte, sacCount, sacTake } from "./regles.js";
import { player, placePlayer, regard, elan, enRoulade, clignoter, pencheMain } from "./monde/personnage.js";
import { currentPlace, isBusy, reveilVillage } from "./lieux.js";
import { barreAuto, hold, syncBarre } from "./barre.js";
import { toast, wrap, openSheet } from "./interface.js";
import { updateMonstres, plusProche, frapper, monstresIci, oublierMonstres } from "./monstres.js";
import { user } from "./usure.js";

const coeurs = $("#coeurs"), boutons = $("#combat"), bRoul = $("#btn-roulade"), bObj = $("#btn-objet"), nObj = $("#objet-n");
const aie = $("#aie"), but = $("#goal");
let dans = false, vie = COMBAT.vie, vaincu = false, repit = 0, attente = 0, roule = 0, coup = 0, conseil = false;
let entree = null;                                      // ce qu'on portait en entrant dans la grotte : {sorte: combien}
let dansOu = null;                                      // où l'on se bat : "grotte" ou "foret"
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
  if(c.d - pas <= COMBAT.portee){ frapper(c.m, OUTILS[k].force, ux, uz); vibre(25); user(k); }   // un coup qui touche use l'épée (usure.js)
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
/* ----- Vaincu (morceau 4) : la moitié du butin de la grotte perdue, puis le réveil au village ----- */
/* Ce qu'on porte, sans les outils ni les armes (l'équipement ne se perd jamais) ni les coffres remplis */
function butin(){
  const c = {};
  for(const it of porte()) if(!it.items && !OUTILS[it.k]) c[it.k] = (c[it.k] || 0) + it.n;
  return c;
}
function defaite(){
  vaincu = true;
  const grotte = currentPlace().b.type === "grotte", perdu = [], garde = [];
  if(grotte && entree){
    for(const [k, n] of Object.entries(butin())){
      const gagne = n - (entree[k] || 0);
      if(gagne <= 0) continue;
      const q = Math.floor(gagne / 2) + (gagne % 2 && Math.random() < .5 ? 1 : 0);
      if(q){ sacTake(k, q); perdu.push([k, q]); }
      if(gagne > q) garde.push([k, gagne - q]);
    }
    syncBarre(); save();
  }
  toast("💫 Tu t'effondres…", 1600);
  const sortir = () => {
    if(!dans) return;
    if(isBusy()){ setTimeout(sortir, 300); return; }
    reveilVillage(ou => { oublierMonstres(); setTimeout(() => bilan(ou, grotte, perdu, garde), 500); });
  };
  setTimeout(sortir, 900);
}
/* Le panneau du réveil : où l'on est, ce qui est perdu, ce qu'on garde */
const REVEIL = {lit: "dans ton lit, à la Chaumière", porte: "devant ta Chaumière", place: "sur la place du village"};
function bilan(ou, grotte, perdu, garde){
  const tuiles = (l, signe) => `<div class="res-grid">${l.map(([k, n]) =>
    `<div class="tile"><div class="te" aria-hidden="true">${icone(k)}</div><div class="tl">${objet(k).nom[0].toUpperCase() + objet(k).nom.slice(1)}</div><div class="tn">${signe} ${n}</div></div>`).join("")}</div>`;
  const quoi = !grotte ? `<p>Rien n'est perdu : dans la forêt, tu étais à la surface.</p>`
    : !perdu.length && !garde.length ? `<p>Tu n'avais encore rien ramassé dans la grotte : rien n'est perdu.</p>`
    : (perdu.length ? `<h3 style="margin:8px 0 4px">Perdu : la moitié de ton butin de la grotte</h3>${tuiles(perdu, "−")}` : `<p>Tu as eu de la chance : rien n'est perdu.</p>`) +
      (garde.length ? `<h3 style="margin:8px 0 4px">Ce que tu gardes</h3>${tuiles(garde, "+")}` : "");
  openSheet(`<div class="sh-head"><h2 class="display">💫 Vaincu…</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p style="margin:0 0 6px">Tu te réveilles ${REVEIL[ou]}, toute ta vie revenue.</p>${quoi}
    <p class="muted" style="font-size:14px;margin:6px 0 12px">Ce que tu as déjà rapporté à la surface, ton équipement, ton or et tes collections ne se perdent jamais.</p>
    <button class="btn primary" data-close style="width:100%">Se relever</button>`);
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
  const p = currentPlace(), ou = p && (p.b.type === "grotte" || p.b.type === "foret") ? p.b.type : null;
  updateMonstres(dt, ou, actif && !vaincu, blesser);
  const ici = ou === "grotte" || ou === "foret" && monstresIci().length > 0;
  if(ici !== dans || ici && ou !== dansOu){            // on entre dans la grotte, ou on en sort (dans la forêt : le sanglier arrive, ou s'en va) : toute la vie
    dans = ici; dansOu = ici ? ou : null; vie = COMBAT.vie; vaincu = false; repit = attente = roule = 0; conseil = false;
    entree = ici && ou === "grotte" ? butin() : null;  // le butin de la grotte se compte depuis l'entrée ; sorti, il est à l'abri
    coeurs.hidden = boutons.hidden = !ici;
    if(but) but.hidden = ici;                           // les cœurs prennent la place de l'objectif du Château
    if(ici) afficher();
    if(coup){ coup = 0; pencheMain(); }
  }
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
