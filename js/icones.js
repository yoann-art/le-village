/* ================= Les icônes d'après les modèles refaits =================
   Demande de Yo (29 octobre 2026 : « que cela ressemble à l'objet en question » ; « Utilises ce que toi tu as créé et qui
   est dans le jeu validé ») : l'icône d'un objet refait d'après une image de Yo est une petite photo de son modèle du jeu,
   de trois quarts, sur fond transparent. Partout où le jeu montre une icône (icone(k), objet(k).icone : le carnet, le
   sac, les coffres, les étals, les recettes), la photo remplace le dessin. Seulement ce qui est fait d'après ses images
   (PHOTOS) : les insectes, les oiseaux, les fleurs sauvages, ce qu'on ramasse ; le reste garde son icône dessinée.
   Pour le téléphone : les photos se prennent une fois, une à la fois et lentement, quelques secondes après le
   chargement (le jeu reste fluide), puis elles sont gardées sur l'appareil (localStorage) ; on les reprend seulement
   quand VERSION_ICONES change (un modèle refait). */
import { renderer } from "./monde/scene.js";
import { objet } from "./donnees.js";
import { MODELES_INSECTES } from "./monde/insectes3d.js";
import { MODELES_OISEAUX } from "./monde/oiseaux3d.js";
import { MODELES_POISSONS } from "./monde/poissons3d.js";
import { paqueretteModele } from "./monde/paquerette.js";
import { coquelicotModele } from "./monde/coquelicot.js";
import { bleuetModele } from "./monde/bleuet.js";
import { pissenlitModele } from "./monde/pissenlit.js";
import { violetteModele } from "./monde/violette.js";
import { perceNeigeModele } from "./monde/perceNeige.js";
import { muguetModele } from "./monde/muguet.js";
import { brancheModele } from "./monde/branche.js";
import { herbesModele } from "./monde/herbes.js";
import { caillouModele, pierreChamps } from "./monde/pierre.js";
import { thymModele } from "./monde/thym.js";
import { FLEURS } from "./donnees.js";
import { makeMeuble, MEUBLES_REFAITS, chandelleSeule } from "./monde/meubles.js";

const VERSION_ICONES = 6, CLE = "le-village-icones", TAILLE = 96;
/* Ce qu'on photographie : la clé de l'objet, et comment faire son modèle (en été, en fleur, de face : un mâle) */
const PHOTOS = {};
for(const k of Object.keys(MODELES_INSECTES)) PHOTOS[k] = () => MODELES_INSECTES[k].fabrique({saison: "ete"});
for(const k of Object.keys(MODELES_POISSONS)) PHOTOS[k] = () => MODELES_POISSONS[k].fabrique();
for(const k of Object.keys(MODELES_OISEAUX)) PHOTOS[k] = () => MODELES_OISEAUX[k].fabrique({saison: "printemps", male: true});
const coul = k => FLEURS[k].couleurs[0];
Object.assign(PHOTOS, {
  paquerette: () => paqueretteModele("printemps", 2, coul("paquerette")),
  coquelicot: () => coquelicotModele("ete", 2, coul("coquelicot")),
  bleuet: () => bleuetModele("ete", 2, coul("bleuet")),
  pissenlit: () => pissenlitModele("printemps", 2),
  violette: () => violetteModele("printemps", 2, coul("violette")),
  perceNeige: () => perceNeigeModele("hiver", 2),
  muguet: () => muguetModele("printemps", 2),
  bois: () => brancheModele("ete"),                                 // la branche de chêne qu'on ramasse
  pierre: () => caillouModele("ete"),                                // le petit caillou
  fibre: () => herbesModele("ete", "haute"),                         // les herbes hautes qu'on cueille
  thym: () => thymModele("ete", "fleuri"),
  rocher: () => pierreChamps("ete")
});
/* Les meubles refaits d'après les images de Yo (chantier de la décoration) : leur photo, dans leur couleur de départ ; elle
   sert aussi au catalogue de « Décorer » */
for(const k of MEUBLES_REFAITS) PHOTOS[k] = () => makeMeuble(k);
/* Les coffres de réserve (image de Yo, 8 novembre 2026) : le simple, et le coffre cerclé de cuivre */
PHOTOS.chandelleSuif = () => { const g = new THREE.Group(); g.add(chandelleSeule()); return g; };   // la chandelle de suif, à poser dans un bougeoir
Object.assign(PHOTOS, {coffreReserve: () => makeMeuble("coffre"), coffrePlein: () => makeMeuble("coffre"), coffreCuivre: () => makeMeuble("coffre", undefined, {style: "cuivre"})});
const SERRE = new Set(["chandelle", "chandelleSuif"]);   // cadrées sur leur forme, pas sur leur boîte
const DE_FACE = new Set([...MEUBLES_REFAITS, "coffreReserve", "coffrePlein", "coffreCuivre"]);
export const iconesPhoto = () => Object.keys(PHOTOS);

/* Les photos déjà prises, gardées sur l'appareil */
let gardees = {};
try{ const g = JSON.parse(localStorage.getItem(CLE) || "{}"); if(g.v === VERSION_ICONES) gardees = g.icones || {}; }catch(_){}
const garder = () => { try{ localStorage.setItem(CLE, JSON.stringify({v: VERSION_ICONES, icones: gardees})); }catch(_){} };
/* Une photo reprise (son modèle a changé de sens ou d'allure) : on la garde sous un autre nom, elle seule est reprise,
   sans reprendre toutes les autres (le téléphone reste fluide) ; l'ancienne est oubliée */
const REPRISES = {chaise: 2, fauteuil: 2, lit: 3, chandelle: 2, chandelleSuif: 2,
  tableTaille: 3, enclume: 2, fourneau: 3, trone: 2, vase: 2, pot: 2, cheminee: 2, puitsEau: 2, fontaine: 2, muret: 2};   // refaits les 12 et 13 novembre 2026 (sans trous, la corne, la dalle, l'oreiller)
const cle = k => REPRISES[k] ? k + "#" + REPRISES[k] : k;
{ const valides = new Set(Object.keys(PHOTOS).map(cle)); for(const n of Object.keys(gardees)) if(!valides.has(n)) delete gardees[n]; }
const html = url => `<img class="ico-photo" src="${url}" alt="" draggable="false">`;
function poser(k, url){ const o = objet(k); if(o) o.icone = html(url); }
for(const k of Object.keys(PHOTOS)) if(gardees[cle(k)]) poser(k, gardees[cle(k)]);

/* Le studio : une petite scène, une lumière douce de trois quarts, comme dans le jeu */
let studio = null;
function monter(){
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC8B89A, .75));
  const sun = new THREE.DirectionalLight(0xFFF3DC, .65); sun.position.set(-4, 8, -6); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(28, 1, .01, 50);
  const cible = new THREE.WebGLRenderTarget(TAILLE * 2, TAILLE * 2);
  const pix = new Uint8Array(TAILLE * 2 * TAILLE * 2 * 4);
  const toile = document.createElement("canvas"); toile.width = toile.height = TAILLE * 2;
  const petite = document.createElement("canvas"); petite.width = petite.height = TAILLE;
  return studio = {scene, cam, cible, pix, toile, petite};
}
const boite = new THREE.Box3(), morceau = new THREE.Box3(), centre = new THREE.Vector3(), sphere = new THREE.Sphere(), coin = new THREE.Vector3();
const VUE = new THREE.Vector3(-.62, .5, -.9).normalize(), DESSUS = new THREE.Vector3(0, 1, -.42).normalize(), PROFIL = new THREE.Vector3(-1, .25, -.2).normalize(), POISSON = new THREE.Vector3(-.2, .3, 1).normalize();   // un poisson : de côté, la tête à gauche
/* les papillons et la libellule se voient d'en haut, ailes ouvertes ; le citron, de profil, ailes fermées comme toujours */
const D_EN_HAUT = new Set(["pieride", "paonDuJour", "machaon", "vulcain", "sphinx", "phalene", "grandPaon", "libellule"]);
/* La photo d'un modèle : cadré sur sa forme, de trois quarts devant (la tête des bêtes est vers −z) */
export function photographier(k){
  const S = studio || monter(), m = PHOTOS[k] && PHOTOS[k]();
  if(!m) return null;
  const ailes = m.userData.ailes || [], ferme = m.userData.toujoursFerme && m.userData.ferme;
  if(D_EN_HAUT.has(k)) for(const a of ailes) a.pivot.rotation.z = a.cote * .08;
  else if(ferme) for(const a of ailes) a.pivot.rotation.z = a.cote * ferme;
  const vue = MODELES_POISSONS[k] ? POISSON : D_EN_HAUT.has(k) ? DESSUS : ferme ? PROFIL : VUE;
  if(DE_FACE.has(k)) m.rotation.y = Math.PI;        // un meuble se voit par-devant (son devant est vers +z)
  S.scene.add(m);
  m.updateMatrixWorld(true);
  boite.makeEmpty();                                               // seulement ce qui se voit (pas les ailes de vol cachées, ni la boîte invisible qu'on touche)
  m.traverseVisible(o => { if(o.geometry && !(o.material && o.material.visible === false)){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); boite.union(morceau.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  boite.getCenter(centre); boite.getBoundingSphere(sphere);
  const d = sphere.radius / Math.sin(S.cam.fov * Math.PI / 360) * 1.02;
  S.cam.position.copy(centre).addScaledVector(vue, d); S.cam.lookAt(centre);
  S.cam.near = d / 20; S.cam.far = d * 4; S.cam.zoom = 1; S.cam.clearViewOffset(); S.cam.updateProjectionMatrix(); S.cam.updateMatrixWorld();
  /* cadré au plus près : les coins de sa boîte, vus par la caméra, remplissent la photo (un peu de marge) */
  let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
  for(let i = 0; i < 8; i++){ coin.set(i & 1 ? boite.max.x : boite.min.x, i & 2 ? boite.max.y : boite.min.y, i & 4 ? boite.max.z : boite.min.z).project(S.cam);
    x0 = Math.min(x0, coin.x); x1 = Math.max(x1, coin.x); y0 = Math.min(y0, coin.y); y1 = Math.max(y1, coin.y); }
  /* un objet plat et rond (le bougeoir) : les coins de sa boîte dépassent loin de sa forme ; on cadre sur ses vrais points */
  if(SERRE.has(k)){ x0 = y0 = 1; x1 = y1 = -1;
    m.traverseVisible(o => { const pos = o.geometry && !(o.material && o.material.visible === false) && o.geometry.attributes.position;
      if(pos) for(let i = 0; i < pos.count; i++){ coin.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).project(S.cam);
        x0 = Math.min(x0, coin.x); x1 = Math.max(x1, coin.x); y0 = Math.min(y0, coin.y); y1 = Math.max(y1, coin.y); } }); }
  const z = 1.84 / Math.max(x1 - x0, y1 - y0, .05);
  S.cam.zoom = z; S.cam.setViewOffset(1000, 1000, (x0 + x1) / 2 * 500 * z, -(y0 + y1) / 2 * 500 * z, 1000, 1000); S.cam.updateProjectionMatrix();
  const avant = renderer.getRenderTarget(), fond = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha(), ombres = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(S.cible); renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(S.scene, S.cam);
  renderer.readRenderTargetPixels(S.cible, 0, 0, TAILLE * 2, TAILLE * 2, S.pix);
  renderer.setRenderTarget(avant); renderer.setClearColor(fond, alpha); renderer.shadowMap.enabled = ombres;
  S.scene.remove(m);
  /* l'image se lit à l'envers (le bas d'abord) : on la remet à l'endroit, puis on la réduit (des bords plus doux) */
  const c = S.toile.getContext("2d"), img = c.createImageData(TAILLE * 2, TAILLE * 2), L = TAILLE * 2 * 4;
  for(let y = 0; y < TAILLE * 2; y++) img.data.set(S.pix.subarray((TAILLE * 2 - 1 - y) * L, (TAILLE * 2 - y) * L), y * L);
  c.putImageData(img, 0, 0);
  const p = S.petite.getContext("2d"); p.clearRect(0, 0, TAILLE, TAILLE); p.drawImage(S.toile, 0, 0, TAILLE, TAILLE);
  const url = S.petite.toDataURL("image/webp", .85);
  return url.startsWith("data:image/webp") ? url : S.petite.toDataURL("image/png");
}
/* Les photos qui manquent, une à la fois, après le chargement : chacune remplace aussitôt le dessin */
let prises = 0;
export const iconesPrises = () => prises;
export function prendreIcones(delai = 4000, entre = 250){
  const reste = Object.keys(PHOTOS).filter(k => !gardees[cle(k)]);
  if(!reste.length) return;
  const suivante = () => {
    const k = reste.shift();
    if(!k){ garder(); return; }
    try{ const url = photographier(k); if(url){ gardees[cle(k)] = url; poser(k, url); prises++; } }catch(e){ console.warn("icône", k, e); }
    if(prises % 8 === 0) garder();
    setTimeout(suivante, entre);
  };
  setTimeout(suivante, delai);
}
/* Les photos qui manquent après une mise à jour (quelques objets nouveaux), prises tout de suite, pendant le chargement (main.js)
   au lieu de pendant le jeu : chaque photo prépare la forme de l'objet, parfois un programme de dessin, et faisait une saccade en
   jouant (mesuré par Yo, v2.1.234 : 8 programmes, 42 formes ; demande de Yo, 12 novembre 2026). Au plus `max` : une partie toute
   neuve (plus de cent photos) garde le reste pour après, une à la fois (prendreIcones). Rend combien ont été prises */
export function prendreIconesMaintenant(max = 30){
  const reste = Object.keys(PHOTOS).filter(k => !gardees[cle(k)]);
  if(!reste.length || reste.length > max) return 0;
  for(const k of reste){
    try{ const url = photographier(k); if(url){ gardees[cle(k)] = url; poser(k, url); prises++; } }catch(e){ console.warn("icône", k, e); }
  }
  garder();
  return reste.length;
}
/* Pour la vérification : oublier les photos gardées (elles seront reprises) */
export function oublierIcones(){ gardees = {}; try{ localStorage.removeItem(CLE); }catch(_){} }
