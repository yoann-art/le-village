/* ================= Scène 3D =================
   Moteur d'affichage, caméra, lumières, cadrage selon la taille de l'écran. */
import { $, fatal } from "../outils.js";

const app = $("#app");
function createRenderer(){
  try{ return new THREE.WebGLRenderer({antialias:true}); }
  catch(e){ fatal("Ton appareil ne permet pas d'afficher la 3D (WebGL indisponible)."); throw e; }
}
export const renderer = createRenderer();
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.prepend(renderer.domElement);
/* Garder les programmes de dessin (mission de Yo, 16 octobre 2026 : les saccades en marchant). three.js jette le programme
   d'une matière (son « shader », compilé par le téléphone) dès que plus aucune matière ne s'en sert : quand la dernière
   ombre de poisson s'efface, par exemple ; la suivante doit alors le recompiler, et l'image se fige un instant. Chaque
   programme compilé est donc gardé pour toute la partie (ils sont peu nombreux : une quinzaine) */
const programmes = renderer.info.programs, ajouterProgramme = programmes.push;
programmes.push = function(p){ p.usedTimes++; return ajouterProgramme.call(this, p); };

const SKY = 0xA9E3EC;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 30, 55);
export const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
export const hemi = new THREE.HemisphereLight(0xffffff, 0x7a9a6a, .62);   // sa couleur suit l'heure (ciel.js)
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff3dc, .82);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

/* Distance de la caméra au personnage */
export let D = 0;
let tanH = .17, tanCourt = .17;
function resize(){
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  projection();
}
function projection(){
  camera.updateProjectionMatrix();
  tanH = Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
  tanCourt = Math.min(tanH, Math.tan(camera.fov * Math.PI / 360));   // le petit côté de l'écran (la largeur, ou la hauteur en paysage)
}
window.addEventListener("resize", resize);
resize();
/* L'angle de vue (en degrés, de haut en bas) : 40 vu de dessus ; plus large à la première personne (main.js) */
export const FOV_DESSUS = 40;
export function setFov(f){
  if(Math.abs(camera.fov - f) < .01) return;
  camera.fov = f;
  projection();
}
/* Distance pour voir environ `width` P autour du personnage, sur le petit côté de l'écran : en paysage (demande de Yo,
   13 octobre 2026 : « plus large »), le personnage garde la taille qu'il a en portrait, et l'on voit plus loin sur les côtés */
export const distanceFor = width => Math.min(34, width / (2 * tanCourt));
/* Demi-largeur vue autour du personnage, en P */
export const halfViewWidth = () => D * tanH;
/* Place la caméra à la distance d : le brouillard et la zone des ombres suivent */
export function setDistance(d){
  if(Math.abs(d - D) < .01) return;
  D = d;
  scene.fog.near = D + 12; scene.fog.far = D + 48;
  const sb = Math.min(20, D * .75), sc = sun.shadow.camera;
  sc.left = -sb; sc.right = sb; sc.top = sb; sc.bottom = -sb; sc.near = 1; sc.far = 70;
  sc.updateProjectionMatrix();
}
setDistance(distanceFor(8));

/* Préparer la carte graphique au chargement (mission de Yo, 16 octobre 2026 : les saccades en marchant) : la première fois
   qu'une forme est dessinée, le téléphone l'envoie à sa carte graphique ; la première fois qu'une matière l'est, il compile
   son programme. En marchant, cela tombait au moment où un arbre, un buisson ou une pierre entrait dans l'écran. On le fait
   donc une fois pour toutes au chargement (main.js) : un dessin de toute la scène, tout montré (même ce qui est caché, de
   près comme de loin), avec ses ombres, dans une toute petite image qu'on ne voit jamais. Rien ne change à l'écran */
export function preparer(){
  const montres = [], entiers = [], lods = [];
  scene.traverse(o => {
    if(!o.visible){ o.visible = true; montres.push(o); }
    if(o.frustumCulled){ o.frustumCulled = false; entiers.push(o); }
    if(o.isLOD && o.autoUpdate){ o.autoUpdate = false; lods.push(o); }
  });
  const cible = new THREE.WebGLRenderTarget(4, 4);
  renderer.setRenderTarget(cible);
  try { renderer.render(scene, camera); }
  finally {
    renderer.setRenderTarget(null); cible.dispose();
    for(const o of montres) o.visible = false;
    for(const o of entiers) o.frustumCulled = true;
    for(const o of lods) o.autoUpdate = true;
  }
}

/* Ce que touche le doigt : le rayon qui part de la caméra et passe sous le doigt */
export const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function aim(sx, sy){
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((sx - r.left) / r.width * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
  camera.updateMatrixWorld();
  ray.setFromCamera(ndc, camera);
  return ray;
}
/* Le point du sol sous le doigt (dans out), ou null */
export const groundAt = (sx, sy, out) => aim(sx, sy).ray.intersectPlane(groundPlane, out);
