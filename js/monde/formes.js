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
   un seul objet à dessiner au lieu de dizaines). morceaux : [{geo, m (Matrix4), c (couleur), normale?, ombre?}] ; chaque
   morceau garde sa couleur (couleurs aux sommets, vertexColors) ; normale(x, y, z, n0) remplace les normales (le feuillage
   d'un arbre s'éclaire comme une boule, pas feuille par feuille ; n0 : la normale d'origine, pour la mêler) ; ombre(x, y, z)
   assombrit ou éclaire chaque sommet (l'ombre douce peinte, comme sur les images de Yo : le creux d'une boule de feuilles
   plus sombre, le dessus plus clair) ; une forme peut aussi porter sa propre teinte par sommet (l'attribut « teinte » :
   la nervure d'une feuille, les sillons d'une écorce) ; couleur(x, y, z), quand il est là, donne la couleur de chaque sommet
   (une groseille : rouge sombre en haut, orangée en bas, comme si la lumière la traversait) */
/* Chaque sommet n'est gardé qu'une fois (mission de Yo, 30 octobre 2026 : la fluidité) : une forme de départ (une boule, une
   feuille…) partage ses sommets entre ses triangles ; avant, chacun était recopié pour chaque triangle qui le touche (3,9 fois
   en moyenne) et la carte graphique les calculait autant de fois, vent compris. Les triangles se suivent dans le même ordre,
   avec exactement les mêmes sommets : l'image est la même */
const cTmp = new THREE.Color(), n0 = new THREE.Vector3();
export function fusionner(morceaux){
  const prets = morceaux.map(p => { const g = p.geo.clone(); g.applyMatrix4(p.m); return [g, p]; });
  const total = prets.reduce((n, [g]) => n + g.attributes.position.count, 0);
  const nIdx = prets.reduce((n, [g]) => n + (g.index ? g.index.count : g.attributes.position.count), 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  const idx = total > 65535 ? new Uint32Array(nIdx) : new Uint16Array(nIdx);
  let o = 0, k = 0;
  for(const [g, p] of prets){
    const P = g.attributes.position, Nn = g.attributes.normal, T = g.attributes.teinte, I = g.index;
    if(I) for(let j = 0; j < I.count; j++) idx[k++] = o + I.getX(j);
    else for(let j = 0; j < P.count; j++) idx[k++] = o + j;
    cTmp.set(p.c);
    for(let i = 0; i < P.count; i++, o++){
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
      n0.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i));
      const v = p.normale ? p.normale(x, y, z, n0) : n0;
      nor[o * 3] = v.x; nor[o * 3 + 1] = v.y; nor[o * 3 + 2] = v.z;
      if(p.couleur) cTmp.set(p.couleur(x, y, z));
      const k = (T ? T.getX(i) : 1) * (p.ombre ? p.ombre(x, y, z) : 1);
      col[o * 3] = cTmp.r * k; col[o * 3 + 1] = cTmp.g * k; col[o * 3 + 2] = cTmp.b * k;
    }
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  r.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  r.setAttribute("color", new THREE.BufferAttribute(col, 3));
  r.setIndex(new THREE.BufferAttribute(idx, 1));
  r.computeBoundingSphere();
  return r;
}

/* Rassembler les morceaux d'un modèle fait de part() (mission de Yo, 16 octobre 2026 : les saccades) : une touffe de thym,
   une fleur, un bâtiment sont faits de morceaux de couleur unie ; le téléphone les dessinait un par un (et encore une fois
   chacun pour leur ombre). uni(m) : une matière toon de couleur unie, opaque, sans lueur (celle de mat()). formeUnie(g)
   rassemble tous les morceaux de g de cette sorte (où qu'ils soient dans g, leur place comptée depuis g) en une seule forme
   aux couleurs par sommet, à dessiner avec MAT_UNI : la même couleur (la couleur du sommet remplace celle de la matière,
   blanche), le même ombrage jouet, la même ombre ; un seul dessin. garder(o) : un morceau à laisser à part (qui bouge). Rend
   {geo, lots, pris, reste} : geo, les morceaux qui font de l'ombre et en reçoivent (null s'il n'y en a pas) ; lots, une forme
   par façon de faire et recevoir l'ombre ("11", "01"…) ; pris, les maillages rassemblés ; reste, ceux laissés à part (une
   matière qui luit, transparente, ou un morceau retourné en miroir) */
export const MAT_UNI = toon({vertexColors: true});
export const uni = m => !!m && m.isMeshToonMaterial && !m.vertexColors && !m.map && !m.transparent && m.opacity === 1
  && m.side === THREE.FrontSide && m.gradientMap === DEGRADE && m.emissive.getHex() === 0 && m.visible
  && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile;
/* une autre matière opaque sans image (une vitre qui s'allume la nuit, une lanterne) : ses morceaux se rassemblent entre eux,
   avec cette même matière (elle change pour tous à la fois, la nuit) */
const pareille = m => !!m && m.isMaterial && !m.transparent && !m.map && !m.vertexColors && m.visible
  && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile;
const mInv = new THREE.Matrix4();
export function formeUnie(g, garder = () => false){
  g.updateMatrixWorld(true);
  mInv.copy(g.matrixWorld).invert();
  const morceaux = new Map(), pris = [], reste = [];
  g.traverse(o => {
    if(!o.isMesh || o === g) return;
    let vu = true; for(let p = o; p && p !== g; p = p.parent) if(!p.visible) vu = false;
    const m = new THREE.Matrix4().multiplyMatrices(mInv, o.matrixWorld);
    const u = uni(o.material);
    if(vu && !o.isInstancedMesh && (u || pareille(o.material)) && m.determinant() > 0 && !garder(o)){
      const cle = (o.castShadow ? "1" : "0") + (o.receiveShadow ? "1" : "0") + (u ? "" : "|" + o.material.uuid);
      if(!morceaux.has(cle)) morceaux.set(cle, {M: [], mat: u ? MAT_UNI : o.material});
      morceaux.get(cle).M.push({geo: o.geometry, m, c: u ? o.material.color.getHex() : 0xffffff});
      pris.push(o);
    } else reste.push(o);
  });
  const lots = new Map([...morceaux].map(([cle, {M, mat}]) => [cle, {geo: fusionner(M), mat}]));
  return {geo: lots.has("11") ? lots.get("11").geo : null, lots, pris, reste};
}
/* Rassembler sur place : les morceaux unis de g sont remplacés par leurs formes rassemblées (une par façon de faire et
   recevoir l'ombre), ajoutées à g ; le reste ne bouge pas */
export function rassembler(g, garder){
  const {lots, pris} = formeUnie(g, garder);
  for(const o of pris) o.parent.remove(o);
  for(const [cle, {geo, mat}] of lots){
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cle[0] === "1"; m.receiveShadow = cle[1] === "1";
    g.add(m);
  }
  return g;
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
/* seuil : à partir de quelle hauteur ça bouge (le haut d'un arbre) ; gain : combien (les brins d'herbe, bas, bougent fort) */
export function feuillageMat(o = {}, seuil = .9, gain = 1){
  const m = toon({vertexColors: true, side: THREE.DoubleSide, gradientMap: DEGRADE_FEUILLES, ...o});
  m.onBeforeCompile = sh => {
    sh.uniforms.ventTemps = VENT.temps; sh.uniforms.ventForce = VENT.force;
    sh.vertexShader = "uniform float ventTemps;\nuniform float ventForce;\n" + sh.vertexShader.replace("#include <begin_vertex>",
      `#include <begin_vertex>
      float hVent = max(0.0, position.y - ${seuil.toFixed(2)}) * ${gain.toFixed(2)};
      #ifdef USE_INSTANCING
      vec4 piedVent = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #else
      vec4 piedVent = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #endif
      float phVent = piedVent.x * 0.37 + piedVent.z * 0.29;
      transformed.x += sin(ventTemps * 1.6 + phVent + position.y * 0.8) * ventForce * hVent;
      transformed.z += cos(ventTemps * 1.25 + phVent * 1.3 + position.x) * ventForce * 0.6 * hVent;
      transformed.y += sin(ventTemps * 2.3 + phVent + position.z * 2.0) * ventForce * 0.25 * hVent;`);
  };
  m.customProgramCacheKey = () => `feuillage-vent-${seuil}-${gain}`;
  return m;
}
