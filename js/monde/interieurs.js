/* ================= Intérieurs =================
   La pièce d'un bâtiment, dans sa propre scène 3D : un sol en carreaux de 1 P,
   trois murs de 2 P (le mur de devant est retiré pour voir dedans)
   et un paillasson devant la porte, au bord de la pièce : c'est la sortie.
   La pièce est construite au moment où l'on entre. */
import { P, G, part } from "./formes.js";
import { sizeOf } from "../regles.js";

export const interior = new THREE.Scene();
interior.background = new THREE.Color(0x1E1813);
interior.add(new THREE.HemisphereLight(0xFFF1DC, 0x6B4A2F, .7));
const lamp = new THREE.DirectionalLight(0xFFE2B8, .6);
lamp.position.set(-3, 9, 5);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.bias = -0.0008;
Object.assign(lamp.shadow.camera, {left:-8, right:8, top:8, bottom:-8, near:1, far:30});
lamp.shadow.camera.updateProjectionMatrix();
interior.add(lamp, lamp.target);

const MUR = 2 * P, EP = .2;                    // hauteur et épaisseur des murs
const C = {wall:0xF2E2C2, beam:0x8B5A3C, sill:0x654028, mat:0xA9322A, floor1:0xC8955A, floor2:0xBF8A50};

/* Sol : un carreau par case, deux tons de bois (jusqu'à 12 × 12 P) */
const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(P, .2, P), new THREE.MeshLambertMaterial({color:0xffffff}), 144);
floor.receiveShadow = true;
interior.add(floor);

let room = null;
export function buildRoom(b){
  if(room) interior.remove(room);
  room = new THREE.Group();
  const w = sizeOf(b.type) * 2, d = w;         // pièce moyenne 6 × 6 P, grande 8 × 8 P

  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  for(let z = 0; z < d; z++) for(let x = 0; x < w; x++, k++){
    m4.makeTranslation(x - w/2 + .5, -.1, z - d/2 + .5); floor.setMatrixAt(k, m4);
    floor.setColorAt(k, col.setHex((x + z) % 2 ? C.floor1 : C.floor2));
  }
  floor.count = k;
  floor.instanceMatrix.needsUpdate = true; floor.instanceColor.needsUpdate = true;

  room.add(part(G.box, C.wall, w + 2*EP, MUR, EP, 0, MUR/2, -d/2 - EP/2));            // fond
  room.add(part(G.box, C.wall, EP, MUR, d + EP, -w/2 - EP/2, MUR/2, -EP/2));          // gauche
  room.add(part(G.box, C.wall, EP, MUR, d + EP, w/2 + EP/2, MUR/2, -EP/2));           // droite
  room.add(part(G.box, C.beam, w + 2*EP + .04, .14, EP + .04, 0, MUR, -d/2 - EP/2));
  room.add(part(G.box, C.beam, EP + .04, .14, d + EP + .04, -w/2 - EP/2, MUR, -EP/2));
  room.add(part(G.box, C.beam, EP + .04, .14, d + EP + .04, w/2 + EP/2, MUR, -EP/2));
  room.add(part(G.box, C.sill, w + 2*EP, .24, .12, 0, -.08, d/2 + .06));               // bord du sol, devant
  room.add(part(G.box, C.mat, P, .03, .6, 0, .015, d/2 - .3));                          // paillasson de la sortie
  interior.add(room);
  lamp.target.position.set(0, 0, 0);
  return {w, d, doorX: 0};
}
