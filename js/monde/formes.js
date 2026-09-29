/* ================= Formes 3D de base =================
   Matières et formes partagées par tous les modèles du décor.
   C'est ici qu'on changera le rendu de tous les modèles d'un coup. */

/* P : la hauteur du personnage, l'unité de mesure de la bible.
   Une case du sol mesure 1 P de côté. */
export const P = 1;

const MAT = {};
export const mat = hex => MAT[hex] || (MAT[hex] = new THREE.MeshLambertMaterial({color:hex}));
export const G = {
  box: new THREE.BoxGeometry(1,1,1),
  cyl: new THREE.CylinderGeometry(.5,.5,1,10),
  cone4: new THREE.ConeGeometry(.5,1,4),
  cone: new THREE.ConeGeometry(.5,1,10),
  dode: new THREE.DodecahedronGeometry(.5,0),
  trunk: new THREE.CylinderGeometry(.09,.13,.55,6),
  leaf: new THREE.IcosahedronGeometry(.46,0),
  leaf2: new THREE.IcosahedronGeometry(.3,0),
  head: new THREE.SphereGeometry(.24,16,12),
  hair: new THREE.SphereGeometry(.255,16,8,0,Math.PI*2,0,Math.PI*.5),
  eye: new THREE.SphereGeometry(.03,8,6)
};
export function part(geo, material, sx, sy, sz, x, y, z){
  const m = new THREE.Mesh(geo, typeof material === "number" ? mat(material) : material);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export const roof = (hex, w, h, y, x=0, z=0) => { const m = part(G.cone4, hex, w*1.55, h, w*1.55, x, y + h/2, z); m.rotation.y = Math.PI/4; return m; };
