/* ================= La vue à la première personne (demande de Yo, 13 octobre 2026 ; morceau B1) =================
   « Je veux aussi qu'il soit possible de passer en mode première personne où l'on voit uniquement les mains du joueur
   et les armes et objets qu'il a en main. » Choix de Yo : glisser le doigt pour regarder, partout où l'on marche.
   - Le bouton 👁️ en haut à droite (#btn-vue) passe d'une vue à l'autre ; le choix est gardé sur le téléphone.
   - En première personne (main.js la règle à chaque image) : la caméra à hauteur des yeux, le corps caché
     (personnage.js : modeFPS) ; le joystick avance, recule, et tourne la vue en poussant sur le côté (personnage.js,
     v1.13.21 : avec deux pouces, c'était dur) ; glisser le doigt sur l'écran tourne la tête (tournerVue) et lève ou baisse
     les yeux (tangage), pour regarder précisément ; en marchant, les yeux reviennent doucement à l'horizon (horizon).
   - On repasse tout seul en vue de dessus pour décorer, bâtir, pendant la scène du voyage et en barque (main.js) ; les
     appuis longs pour soulever un bâtiment, une lumière ou un meuble ne servent pas en première personne (on regarde
     avec le doigt) : premiereActive, lu par construire.js, deplacer.js et decorer.js.
   Les mains (morceau B2) et viser ce qu'on regarde (morceau B3) viendront ensuite. */
import { renderer } from "./monde/scene.js";
import { tournerVue, modeFPS } from "./monde/personnage.js";
import { toast } from "./interface.js";

const CLE = "le-village-vue";
let premiere = false;                                    // le choix du joueur
try{ premiere = localStorage.getItem(CLE) === "premiere"; }catch(_){}
let active = false;                                      // la première personne s'applique en ce moment (main.js)
let tangage = 0;                                         // lever (positif) ou baisser les yeux, en radians
export const vuePremiere = () => premiere;
export const premiereActive = () => active;
export const tangageVue = () => tangage;
export function activerVue(oui){
  if(oui === active) return;
  if(!oui) doigt = null;
  active = oui;
  modeFPS(oui);
}
/* En marchant avec le joystick, les yeux reviennent doucement à l'horizon (pas pendant que le doigt regarde) */
export function horizon(dt, marche){ if(marche && !doigt && tangage) tangage *= Math.exp(-dt * 2.5); }
/* Pour la vérification : lever ou baisser les yeux sans le doigt */
export function pencherVue(t){ tangage = t; }
/* Pour la vérification : choisir la vue sans toucher au bouton */
export function choisirVue(p){ premiere = !!p; tangage = 0; garder(); majBouton(); }

function garder(){ try{ localStorage.setItem(CLE, premiere ? "premiere" : "dessus"); }catch(_){} }
const btn = document.getElementById("btn-vue");
function majBouton(){
  if(!btn) return;
  btn.setAttribute("aria-pressed", String(premiere));
  btn.setAttribute("aria-label", premiere ? "Revenir à la vue de dessus" : "Vue à la première personne");
}
if(btn) btn.addEventListener("click", e => {
  e.stopPropagation();
  choisirVue(!premiere);
  toast(premiere ? "👁️ Vue à la première personne : le joystick avance, recule et tourne (pousse-le à gauche ou à droite) ; glisse le doigt sur l'écran pour regarder précisément. Touche 👁️ pour revenir à la vue de dessus."
    : "🗺️ Vue de dessus", premiere ? 5200 : 1400);
});
majBouton();

/* Glisser le doigt sur l'écran (pas sur le joystick ni sur un bouton) pour regarder autour de soi : un balayage de toute la
   largeur de l'écran fait un demi-tour */
const canvas = renderer.domElement;
let doigt = null;                                        // {id, x, y}
canvas.addEventListener("pointerdown", e => {
  if(!active || doigt) return;
  doigt = {id: e.pointerId, x: e.clientX, y: e.clientY};
});
window.addEventListener("pointermove", e => {
  if(!doigt || e.pointerId !== doigt.id || !active) return;
  const dx = e.clientX - doigt.x, dy = e.clientY - doigt.y;
  doigt.x = e.clientX; doigt.y = e.clientY;
  tournerVue(-dx * Math.PI / Math.max(320, innerWidth) * 1.1);
  tangage = Math.max(-1.1, Math.min(.75, tangage - dy * 1.6 / Math.max(320, innerHeight)));
});
const lever = e => { if(doigt && e.pointerId === doigt.id) doigt = null; };
window.addEventListener("pointerup", lever);
window.addEventListener("pointercancel", lever);
