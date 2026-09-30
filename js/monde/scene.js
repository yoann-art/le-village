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

const SKY = 0xA9E3EC;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 30, 55);
export const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a9a6a, .62));
export const sun = new THREE.DirectionalLight(0xfff3dc, .82);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

/* Distance de la caméra au personnage */
export let D = 0;
let tanH = .17;
function resize(){
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  tanH = Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
}
window.addEventListener("resize", resize);
resize();
/* Distance pour voir environ `width` P de large autour du personnage
   (sur un écran en largeur, on garde un minimum pour ne pas voir de trop près) */
export const distanceFor = width => Math.min(34, Math.max(width * 1.75, width / (2 * tanH)));
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
