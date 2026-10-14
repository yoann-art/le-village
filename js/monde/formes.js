/* ================= Formes 3D de base =================
   Matières et formes partagées par tous les modèles du décor.
   C'est ici qu'on changera le rendu de tous les modèles d'un coup. */

/* P : la hauteur du personnage, l'unité de mesure de la bible.
   Une case du sol mesure 1 P de côté. */
export const P = 1;

/* L'ombrage « jouet » de la bible, le même pour tous les modèles (étape 2.1, morceau 1 ; comme la Scierie d'essai,
   essais/scierie-essai.html) : la lumière directe en trois aplats (MeshToonMaterial et un dégradé de trois marches)
   au lieu d'un dégradé continu. Toute matière du décor passe par toon() ; seules l'eau, la vase et les peaux
   luisantes gardent leur reflet (Phong) */
export const DEGRADE = (() => {
  const t = new THREE.DataTexture(new Uint8Array([105, 172, 255]), 3, 1, THREE.LuminanceFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
export const toon = (o = {}) => new THREE.MeshToonMaterial({gradientMap: DEGRADE, ...o});
const MAT = {};
export const mat = hex => MAT[hex] || (MAT[hex] = toon({color: hex}));
export const G = {
  box: new THREE.BoxGeometry(1,1,1),
  cyl: new THREE.CylinderGeometry(.5,.5,1,10),
  cone4: new THREE.ConeGeometry(.5,1,4),
  cone: new THREE.ConeGeometry(.5,1,10),
  dode: new THREE.DodecahedronGeometry(.5,0),
  octa: new THREE.OctahedronGeometry(.5,0),
  trunk: new THREE.CylinderGeometry(.09,.13,.55,6),
  leaf: new THREE.IcosahedronGeometry(.46,0),
  leaf2: new THREE.IcosahedronGeometry(.3,0),
  head: new THREE.SphereGeometry(.24,16,12),
  hair: new THREE.SphereGeometry(.255,16,8,0,Math.PI*2,0,Math.PI*.5),
  eye: new THREE.SphereGeometry(.03,8,6),
  /* un toit à deux pentes : le faîte va de gauche à droite (x), la base est à y = 0, le haut à y = 1 */
  gable: (() => {
    const s = new THREE.Shape(); s.moveTo(-.5, 0); s.lineTo(.5, 0); s.lineTo(0, 1); s.closePath();
    return new THREE.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}).translate(0, 0, -.5).rotateY(Math.PI / 2);
  })(),
  /* un toit arrondi (chaume) : un demi-cylindre couché de gauche à droite, base à y = 0, haut à y = 1 */
  vault: new THREE.CylinderGeometry(.5, .5, 1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 2, 1),
  tore: new THREE.TorusGeometry(.5, .06, 6, 18)
};
export function part(geo, material, sx, sy, sz, x, y, z){
  const m = new THREE.Mesh(geo, typeof material === "number" ? mat(material) : material);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export const roof = (hex, w, h, y, x=0, z=0) => { const m = part(G.cone4, hex, w*1.55, h, w*1.55, x, y + h/2, z); m.rotation.y = Math.PI/4; return m; };

/* Fusionner plusieurs formes en une seule (étape 2.1, les arbres : un modèle détaillé reste léger pour le téléphone,
   un seul objet à dessiner au lieu de dizaines). morceaux : [{geo, m (Matrix4), c (couleur), normale?}] ; chaque
   morceau garde sa couleur (couleurs aux sommets, vertexColors) ; normale(x, y, z) remplace les normales (le feuillage
   d'un arbre s'éclaire comme une boule, pas feuille par feuille) */
const cTmp = new THREE.Color();
export function fusionner(morceaux){
  const prets = morceaux.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); return [g, p]; });
  const total = prets.reduce((n, [g]) => n + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for(const [g, p] of prets){
    const P = g.attributes.position, Nn = g.attributes.normal;
    cTmp.set(p.c);
    for(let i = 0; i < P.count; i++, o++){
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
      const v = p.normale ? p.normale(x, y, z) : null;
      nor[o * 3] = v ? v.x : Nn.getX(i); nor[o * 3 + 1] = v ? v.y : Nn.getY(i); nor[o * 3 + 2] = v ? v.z : Nn.getZ(i);
      col[o * 3] = cTmp.r; col[o * 3 + 1] = cTmp.g; col[o * 3 + 2] = cTmp.b;
    }
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  r.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  r.setAttribute("color", new THREE.BufferAttribute(col, 3));
  r.computeBoundingSphere();
  return r;
}

/* Le vent dans le feuillage (étape 2.1) : VENT.temps avance, VENT.force suit la météo (main.js) ; feuillageMat()
   fait onduler ce qui est haut dans l'arbre (plus c'est haut, plus ça bouge), chaque arbre à son rythme */
export const VENT = {temps: {value: 0}, force: {value: .03}};
/* le feuillage a des ombres plus claires que le reste (le dessous d'un arbre reste coloré, comme sur l'image de Yo) */
const DEGRADE_FEUILLES = (() => {
  const t = new THREE.DataTexture(new Uint8Array([165, 210, 255]), 3, 1, THREE.LuminanceFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
export function feuillageMat(o = {}){
  const m = toon({vertexColors: true, side: THREE.DoubleSide, gradientMap: DEGRADE_FEUILLES, ...o});
  m.onBeforeCompile = sh => {
    sh.uniforms.ventTemps = VENT.temps; sh.uniforms.ventForce = VENT.force;
    sh.vertexShader = "uniform float ventTemps;\nuniform float ventForce;\n" + sh.vertexShader.replace("#include <begin_vertex>",
      `#include <begin_vertex>
      float hVent = max(0.0, position.y - 0.9);
      vec4 piedVent = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float phVent = piedVent.x * 0.37 + piedVent.z * 0.29;
      transformed.x += sin(ventTemps * 1.6 + phVent + position.y * 0.8) * ventForce * hVent;
      transformed.z += cos(ventTemps * 1.25 + phVent * 1.3 + position.x) * ventForce * 0.6 * hVent;
      transformed.y += sin(ventTemps * 2.3 + phVent + position.z * 2.0) * ventForce * 0.25 * hVent;`);
  };
  m.customProgramCacheKey = () => "feuillage-vent";
  return m;
}
