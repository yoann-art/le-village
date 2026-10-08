/* ================= Les chemins de l'île (étape 1.9, morceau 2) =================
   Grand Carnet : « Chemins : gravier, pavés ou planches, se tracent librement sur l'île ». Chaque case de chemin
   est une dalle plate posée sur l'herbe ou le sable, dessinée d'après sa sorte (terre, gravier, pavés, planches :
   un petit dessin peint, le même pour toutes les cases d'une sorte, pour qu'elles se raccordent). Toutes les cases
   d'une sorte sont dessinées en série (InstancedMesh), pour un téléphone modeste. state.chemins = {case: sorte} ;
   un chemin sous un bâtiment reste gardé, mais caché. Les tracer, les enlever : terraformer.js. */
import { scene } from "./scene.js";
import { state } from "../sauvegarde.js";
import { N, centerOf, map } from "./ile.js";
import { occ } from "./batiments.js";

/* Les dessins, à la main sur un petit carré (64 × 64) */
function dessin(f){
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"); f(x);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 2;
  return t;
}
const hasard = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(12345);
const rond = (x, cx, cy, r, couleur) => { x.fillStyle = couleur; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.fill(); };
const DESSINS = {
  terre: x => {                                        // de la terre battue, quelques mottes et cailloux
    x.fillStyle = "#A87C52"; x.fillRect(0, 0, 64, 64);
    for(let k = 0; k < 26; k++) rond(x, hasard() * 64, hasard() * 64, 1.5 + hasard() * 3, hasard() < .5 ? "#94683F" : "#B98D62");
  },
  gravier: x => {                                      // des petits cailloux clairs et gris
    x.fillStyle = "#CDC3AE"; x.fillRect(0, 0, 64, 64);
    for(let k = 0; k < 90; k++) rond(x, hasard() * 64, hasard() * 64, .8 + hasard() * 1.8, ["#A99F8C", "#E4DCCB", "#8E8678", "#F2EDE2"][k % 4]);
  },
  paves: x => {                                        // quatre pavés arrondis, joints de mortier
    x.fillStyle = "#857E75"; x.fillRect(0, 0, 64, 64);
    [[2, 2], [34, 2], [2, 34], [34, 34]].forEach(([px, py], k) => {
      x.fillStyle = ["#BDB6AA", "#B1AA9E", "#ABA498", "#C3BCB0"][k];
      x.beginPath(); x.roundRect ? x.roundRect(px, py, 28, 28, 6) : x.rect(px, py, 28, 28); x.fill();
      x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(px + 5, py + 4, 16, 4);
    });
  },
  planches: x => {                                     // trois planches, leurs joints et leurs clous
    ["#C29462", "#B4864F", "#CB9E6B"].forEach((c, k) => { x.fillStyle = c; x.fillRect(0, k * 21 + 1, 64, 20); });
    x.fillStyle = "#6B4A2F"; for(const y of [0, 21, 42, 63]) x.fillRect(0, y, 64, 1.5);
    for(const y of [10, 31, 52]) for(const px of [5, 59]) rond(x, px, y, 1.4, "#5A3A22");
  }
};
const GEO = new THREE.PlaneGeometry(1, 1); GEO.rotateX(-Math.PI / 2);
const series = {};
for(const [s, f] of Object.entries(DESSINS)){
  const m = new THREE.InstancedMesh(GEO, new THREE.MeshLambertMaterial({map: dessin(f)}), N * N);
  m.count = 0; m.receiveShadow = true;
  scene.add(m); series[s] = m;
}
const m4 = new THREE.Matrix4();
/* Redessine tous les chemins (après un changement, ou quand un bâtiment bouge) ; la terre et le gravier tournent
   d'un quart de tour d'une case à l'autre, pour ne pas voir le même dessin partout */
export function dessinerChemins(){
  const n = {};
  for(const s in series) n[s] = 0;
  for(const [i, s] of Object.entries(state.chemins)){
    const j = +i, m = series[s];
    if(!m || occ.has(j) || map.type[j] === "water") continue;
    m4.makeRotationY((s === "terre" || s === "gravier") ? (j * 7 % 4) * Math.PI / 2 : 0);
    m4.setPosition(centerOf(j % N), .012, centerOf(Math.floor(j / N)));
    m.setMatrixAt(n[s]++, m4);
  }
  for(const s in series){ series[s].count = n[s]; series[s].instanceMatrix.needsUpdate = true; }
}
dessinerChemins();
