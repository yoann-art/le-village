/* ================= Le voyage en barque et le Marais brumeux (étape 1.13, morceau 3) =================
   Bible : « Trajet : une courte scène animée, qu'on peut passer. Retour : on rentre au village quand on veut. »
   Grand Carnet : le Marais brumeux, « des arbres qui ont les pieds dans l'eau » (cyprès des marais, aulne…).
   - makeTrajet : un long chenal d'eau sombre dans la brume, bordé de roseaux et de cyprès ; la barque le remonte
     vers le nord (voyage.js la fait avancer).
   - makeMarais : l'arrivée, un îlot moussu au milieu de l'eau, son embarcadère où la barque est amarrée, un poteau
     « Marais brumeux », des cyprès dans la brume. Le reste du Marais (ses îlots, ses passerelles, ses arbres, ses
     plantes, sa vie) viendra aux morceaux 4 et 5.
   Les deux lieux se construisent dans la scène des intérieurs (interieurs.js, buildRoom), comme la forêt. */
import { G, part, mat } from "./formes.js";
import { barqueModele } from "./ponton.js";

const EAU = -.2;
const EAU_MAT = new THREE.MeshLambertMaterial({color: 0x3E5E52});
const BRUME_MAT = new THREE.MeshLambertMaterial({color: 0xE4ECE6, transparent: true, opacity: .18, depthWrite: false});
function eau(g, w, d){
  const e = new THREE.Mesh(new THREE.PlaneGeometry(w, d), EAU_MAT);
  e.rotation.x = -Math.PI / 2; e.position.y = EAU; e.receiveShadow = true; g.add(e);
}
/* Un cyprès des marais : tronc roux évasé, ses racines qui sortent de l'eau, une haute couronne sombre */
function cypres(g, x, z, s){
  const c = new THREE.Group();
  c.add(part(G.cone, 0x8A5A3C, .9, 1.2, .9, 0, .4, 0));                         // le pied évasé
  c.add(part(G.cyl, 0x8A5A3C, .32, 2.6, .32, 0, 1.8, 0));                       // le tronc
  for(let k = 0; k < 4; k++){ const a = k * 1.7 + s; c.add(part(G.cone, 0x7A4E34, .16, .4, .16, Math.cos(a) * .8, 0, Math.sin(a) * .8)); }   // les racines
  c.add(part(G.cone, 0x3E5A44, 1.8, 2.4, 1.8, 0, 3.2, 0));                      // la couronne
  c.add(part(G.cone, 0x47664C, 1.3, 1.8, 1.3, 0, 4.1, 0));
  c.position.set(x, EAU, z); c.scale.setScalar(.8 + (s % 1) * .5); c.rotation.y = s;
  g.add(c);
}
/* Une touffe de roseaux, avec ses massettes brunes */
function roseaux(g, x, z, s){
  for(let k = 0; k < 5; k++){
    const a = k * 1.3 + s, r = .12 + (k % 2) * .08, h = .7 + (k % 3) * .2;
    const t = part(G.cyl, k % 2 ? 0x8AA05A : 0x7A9450, .04, h, .04, x + Math.cos(a) * r, EAU + h / 2, z + Math.sin(a) * r);
    t.rotation.set(Math.sin(a) * .15, 0, Math.cos(a) * .15); g.add(t);
    if(k % 2 === 0) g.add(part(G.cyl, 0x6A4630, .08, .2, .08, t.position.x, EAU + h - .05, t.position.z));
  }
}
/* Des nappes de brume qui flottent sur l'eau */
function brume(g, x, z, s){
  const b = new THREE.Mesh(G.head, BRUME_MAT); b.scale.set(7 * s, .8, 5 * s); b.position.set(x, .1, z); b.renderOrder = 3; g.add(b);
}

/* ----- Le trajet : un chenal de 12 cases sur 60, la barque part du sud (z = 24) vers le nord ----- */
export function makeTrajet(){
  const g = new THREE.Group(), W = 14, D = 64;
  eau(g, 80, 120);
  for(let z = -30; z <= 30; z += 2.5){
    for(const c of [-1, 1]){
      const r = Math.sin(z * 1.7) * .5 + .5;
      roseaux(g, c * (3 + r * 1.5), z + r, z * .3);
      if(Math.abs(z * 10) % 3 < 1.2) cypres(g, c * (6 + r * 2), z + 1, z + c);
    }
    if(Math.abs(z) % 10 < 2.5) brume(g, Math.sin(z) * 3, z, 1);
  }
  return {group: g, w: W, d: D, walk: () => true, depart: {x: 0, z: 24, fx: 0, fz: -1},
    light: 0xE8F0E4, power: .6, ground: 0x3A4A40, sky: 0xC8D8CC, hemi: .85, fond: 0xB4C6BA, brume: [17, 34]};
}

/* ----- Le Marais : l'îlot d'arrivée (cases centrées sur des nombres entiers) et son embarcadère ----- */
const ILOT = [
  "..####...",
  ".######..",
  "########.",
  ".#######.",
  "..#####..",
  "...###...",
  "....#...."
];
const sol = new Set();                                  // les cases de terre de l'îlot : "x,z"
ILOT.forEach((l, j) => [...l].forEach((c, i) => { if(c === "#") sol.add(`${i - 4},${j - 4}`); }));
export const EMBARCADERE = [[0, 3], [0, 4], [0, 5]];   // les planches, vers le sud (vers le village)
const passe = new Set(EMBARCADERE.map(([x, z]) => `${x},${z}`));
export const surEmbarcadere = (x, z) => passe.has(`${Math.round(x)},${Math.round(z)}`);
const marche = (x, z) => { const k = `${Math.round(x)},${Math.round(z)}`; return sol.has(k) || passe.has(k); };
/* Un poteau, et son écriteau peint */
function ecriteau(g, x, z, texte){
  g.add(part(G.cyl, 0x6B4A2F, .12, 1.5, .12, x, .75, z));
  const c = document.createElement("canvas"); c.width = 320; c.height = 110;
  const k = c.getContext("2d");
  k.fillStyle = "#C8976A"; k.fillRect(0, 0, 320, 110); k.strokeStyle = "#6B4A2F"; k.lineWidth = 10; k.strokeRect(5, 5, 310, 100);
  let taille = 44;
  do { k.font = `bold ${taille}px Georgia, serif`; taille -= 2; } while(k.measureText(texte).width > 284 && taille > 16);   // le texte tient dans la planche
  k.fillStyle = "#2A1C10"; k.textAlign = "center"; k.textBaseline = "middle"; k.fillText(texte, 160, 58);
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(1.8, .62, .06), [mat(0x8A5A3C), mat(0x8A5A3C), mat(0x8A5A3C), mat(0x8A5A3C),
    new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(c)}), mat(0x8A5A3C)]);
  panneau.position.set(x, 1.3, z + .06); panneau.rotation.x = -.5; panneau.castShadow = true; g.add(panneau);   // penché vers la caméra
}
export function makeMarais(){
  const g = new THREE.Group(), W = 26, D = 26;
  eau(g, 90, 90);
  /* l'îlot : de la terre moussue, deux tons, sur un socle de tourbe */
  for(const k of sol){
    const [x, z] = k.split(",").map(Number);
    g.add(part(G.box, (x + z) & 1 ? 0x5E7A4A : 0x56724A, 1, .24, 1, x, -.12, z));
    g.add(part(G.box, 0x4A3A2A, 1, .6, 1, x, -.54, z));
  }
  /* l'embarcadère : des planches sur des pieux, et la barque amarrée à sa droite */
  for(const [x, z] of EMBARCADERE){
    for(let k = 0; k < 4; k++) g.add(part(G.box, k % 2 ? 0xB8875A : 0xA97A4F, .96, .08, .22, x, -.04, z - .375 + k * .25));
    for(const dx of [-.46, .46]) g.add(part(G.cyl, 0x6B4A2F, .14, 1.1, .14, x + dx, -.5, z + .4));
  }
  const barque = barqueModele(false); barque.position.set(1.02, .02, 4.5); g.add(barque);
  ecriteau(g, -1, 1, "Marais brumeux");
  /* au bord de l'îlot, des roseaux ; dans l'eau, les cyprès des marais ; et la brume */
  for(const k of sol){
    const [x, z] = k.split(",").map(Number);
    if([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !sol.has(`${x + dx},${z + dz}`) && !passe.has(`${x + dx},${z + dz}`)) && (x * 7 + z * 3) % 3 === 0)
      roseaux(g, x + Math.sign(x || 1) * .55, z + Math.sign(z || 1) * .3, x + z);
  }
  [[-7, -6], [6, -7], [-9, 1], [8, 0], [-5, 7], [7, 7], [-2, -10], [3, -11], [11, -4], [-11, -5]].forEach(([x, z], k) => cypres(g, x, z, k * 1.9 + .3));
  [[-6, -2], [6, 3], [0, -9], [-8, 6]].forEach(([x, z]) => brume(g, x, z, .8));
  return {group: g, w: W, d: D, walk: marche, depart: {x: 0, z: 4.6, fx: 0, fz: -1},
    light: 0xE8F0E4, power: .65, ground: 0x3A4A40, sky: 0xC8D8CC, hemi: .9, fond: 0xB4C6BA, brume: [17, 36]};
}
