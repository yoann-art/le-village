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

/* Distance de la caméra, recalculée quand l'écran change de taille :
   on voit environ 9 P de large autour du personnage. */
export let D = 24;
function resize(){
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const tanH = Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
  D = Math.min(34, Math.max(14, 9 / (2 * tanH)));
  camera.updateProjectionMatrix();
  scene.fog.near = D + 12; scene.fog.far = D + 48;
  const sb = Math.min(20, D * .75), sc = sun.shadow.camera;
  sc.left = -sb; sc.right = sb; sc.top = sb; sc.bottom = -sb; sc.near = 1; sc.far = 70;
  sc.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
