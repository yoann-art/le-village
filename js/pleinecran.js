/* ================= Le plein écran (demande de Yo, 13 octobre 2026) =================
   « Je voudrais que le jeu soit en plein écran, qui occupe tout l'espace de l'écran du téléphone, que cela soit en portrait
   ou paysage. » Deux façons :
   - dans Chrome : le navigateur n'accepte le plein écran qu'après un vrai toucher ; au premier toucher dans le jeu, il
     passe en plein écran (sans la barre d'adresse ni la barre d'état) ; si on en sort (le geste retour), le toucher suivant
     y revient ; le bouton en haut à droite (#btn-plein) en sort ou y revient, et le choix est gardé sur le téléphone ;
   - installé comme une application (le menu de Chrome, « Ajouter à l'écran d'accueil » : manifest.webmanifest, son
     icône dans icones/) : ouvert depuis son icône, il est toujours en plein écran ; le bouton se cache.
   Le jeu occupe aussi l'encoche de l'appareil photo et le bas de l'écran ; les boutons restent à l'écart des bords
   (les marges de sécurité, --st, --sb, --sl, --sr dans style.css). */
const doc = document.documentElement, btn = document.getElementById("btn-plein");
const CLE = "le-village-plein-ecran";
const possible = !!(doc.requestFullscreen || doc.webkitRequestFullscreen);
const enApplication = () => matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
const enPleinEcran = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
let voulu = true;
try{ voulu = localStorage.getItem(CLE) !== "non"; }catch(_){}
function entrer(){
  const f = doc.requestFullscreen || doc.webkitRequestFullscreen;
  if(!f || enPleinEcran()) return;
  try{ const p = f.call(doc, {navigationUI: "hide"}); if(p && p.catch) p.catch(() => {}); }catch(_){}
}
function sortir(){
  const f = document.exitFullscreen || document.webkitExitFullscreen;
  if(!f || !enPleinEcran()) return;
  try{ const p = f.call(document); if(p && p.catch) p.catch(() => {}); }catch(_){}
}
function garder(){ try{ localStorage.setItem(CLE, voulu ? "oui" : "non"); }catch(_){} }
function majBouton(){
  if(!btn) return;
  btn.hidden = !possible || enApplication();
  const dedans = enPleinEcran();
  btn.setAttribute("aria-label", dedans ? "Quitter le plein écran" : "Plein écran");
  btn.classList.toggle("dedans", dedans);
}
/* Un vrai toucher dans le jeu (pas un bouton du plein écran lui-même) : on y passe, si on le veut */
window.addEventListener("pointerdown", e => {
  if(!e.isTrusted || !voulu || !possible || enApplication() || enPleinEcran() || (btn && btn.contains(e.target))) return;
  entrer();
}, {capture: true});
if(btn) btn.addEventListener("click", e => {
  e.stopPropagation();
  if(enPleinEcran()){ voulu = false; sortir(); }
  else { voulu = true; entrer(); }
  garder();
});
document.addEventListener("fullscreenchange", majBouton);
document.addEventListener("webkitfullscreenchange", majBouton);
majBouton();
