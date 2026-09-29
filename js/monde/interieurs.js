/* ================= Intérieurs =================
   La pièce d'un bâtiment, dans sa propre scène 3D : un sol en carreaux de 1 P,
   trois murs de 2 P (le mur de devant est retiré pour voir dedans)
   et un paillasson devant la porte, au bord de la pièce : c'est la sortie.
   Taille selon la bible (moyenne 6 × 6 P, grande 8 × 8 P, +1 P par niveau),
   couleurs et lumière selon l'ambiance de chaque bâtiment.
   La pièce est construite au moment où l'on entre ; elle est vide (meubles : étape 1.2). */
import { P, G, part } from "./formes.js";
import { roomSide } from "../regles.js";

export const interior = new THREE.Scene();
interior.background = new THREE.Color(0x1E1813);
const hemi = new THREE.HemisphereLight(0xFFF1DC, 0x6B4A2F, .7);
interior.add(hemi);
const lamp = new THREE.DirectionalLight(0xFFE2B8, .6);
lamp.position.set(-3, 9, 5);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.bias = -0.0008;
Object.assign(lamp.shadow.camera, {left:-8, right:8, top:8, bottom:-8, near:1, far:30});
lamp.shadow.camera.updateProjectionMatrix();
interior.add(lamp, lamp.target);

/* Ambiances, d'après le tableau des intérieurs de la bible :
   sol (deux tons), murs, poutres, bande décorative éventuelle, lumière */
const AMBIANCE = {
  chaumiere:{floor:[0xC8955A, 0xBF8A50], wall:0xF2E2C2, beam:0x654028, light:0xFFE2B8, power:.65},            // foyer chaleureux, poutres basses
  scierie:  {floor:[0xE8D3A2, 0xDEC690], wall:0xD9A55B, beam:0x9B6433, light:0xFFF1D6, power:.7},             // sciure au sol, bois couleur miel
  carriere: {floor:[0xB9B1A3, 0xAEA698], wall:0x8C95A0, beam:0x6F7884, light:0xFFE0A8, power:.55},            // pierre brute, poussière, lanternes
  marche:   {floor:[0xD9825B, 0xCC7550], wall:0xF4E3C1, beam:0x8B5A3C, band:0xC8553D, light:0xFFF4E0, power:.75}, // étals colorés, animé
  taverne:  {floor:[0x8A5A3B, 0x7E5234], wall:0xE8C48A, beam:0x5A3A22, light:0xFFB870, power:.75},            // chaude, feu de bois
  forge:    {floor:[0x5E5A57, 0x55514E], wall:0x6F6A66, beam:0x3E2E24, light:0xFF9A5A, power:.8, ground:0x5A2A1A}, // braises rougeoyantes, fumée
  chateau:  {floor:[0xB8B4AC, 0xAAA69E], wall:0xA7A9AD, beam:0x8E9195, banner:0xA9322A, light:0xFFF4E0, power:.6} // solennel, bannières, pierre
};

const MUR = 2 * P, EP = .2;                    // hauteur et épaisseur des murs
const SILL = 0x654028, MAT = 0xA9322A, GOLD = 0xE2B24D;

/* Sol : un carreau par case (jusqu'à 12 × 12 P) */
const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(P, .2, P), new THREE.MeshLambertMaterial({color:0xffffff}), 144);
floor.receiveShadow = true;
interior.add(floor);

let room = null;
export function buildRoom(b){
  if(room) interior.remove(room);
  room = new THREE.Group();
  const a = AMBIANCE[b.type], w = roomSide(b.type, b.lvl), d = w;

  hemi.groundColor.setHex(a.ground || 0x6B4A2F);
  lamp.color.setHex(a.light); lamp.intensity = a.power;

  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  for(let z = 0; z < d; z++) for(let x = 0; x < w; x++, k++){
    m4.makeTranslation(x - w/2 + .5, -.1, z - d/2 + .5); floor.setMatrixAt(k, m4);
    floor.setColorAt(k, col.setHex(a.floor[(x + z) % 2]));
  }
  floor.count = k;
  floor.instanceMatrix.needsUpdate = true; floor.instanceColor.needsUpdate = true;

  room.add(part(G.box, a.wall, w + 2*EP, MUR, EP, 0, MUR/2, -d/2 - EP/2));            // fond
  room.add(part(G.box, a.wall, EP, MUR, d + EP, -w/2 - EP/2, MUR/2, -EP/2));          // gauche
  room.add(part(G.box, a.wall, EP, MUR, d + EP, w/2 + EP/2, MUR/2, -EP/2));           // droite
  room.add(part(G.box, a.beam, w + 2*EP + .04, .14, EP + .04, 0, MUR, -d/2 - EP/2));
  room.add(part(G.box, a.beam, EP + .04, .14, d + EP + .04, -w/2 - EP/2, MUR, -EP/2));
  room.add(part(G.box, a.beam, EP + .04, .14, d + EP + .04, w/2 + EP/2, MUR, -EP/2));
  if(a.band){                                                                          // bande colorée le long des murs
    room.add(part(G.box, a.band, w, .16, .03, 0, .9, -d/2 + .015));
    room.add(part(G.box, a.band, .03, .16, d, -w/2 + .015, .9, 0));
    room.add(part(G.box, a.band, .03, .16, d, w/2 - .015, .9, 0));
  }
  if(a.banner){                                                                        // bannières sur le mur du fond
    for(const x of [-w/4, w/4]){
      room.add(part(G.box, a.banner, .6, 1.2, .04, x, 1.15, -d/2 + .02));
      room.add(part(G.box, GOLD, .7, .06, .05, x, 1.77, -d/2 + .03));
    }
  }
  room.add(part(G.box, SILL, w + 2*EP, .24, .12, 0, -.08, d/2 + .06));                  // bord du sol, devant
  room.add(part(G.box, MAT, P, .03, .6, 0, .015, d/2 - .3));                            // paillasson de la sortie
  interior.add(room);
  lamp.target.position.set(0, 0, 0);
  return {w, d, doorX: 0};
}
