/* ================= Les essences d'arbres (étape 1.7) =================
   Les arbres de la Forêt profonde, d'après le Grand Carnet (charme, frêne, sureau, if, houx, chêne séculaire) :
   leur modèle en formes simples, partagé par la forêt (dessinés en série : foret.js) et par l'île (un arbre
   planté avec sa graine : ile.js). Leurs fruits (baies du houx, fleurs ou baies du sureau) suivent la saison du
   téléphone et se cachent une fois cueillis. */
import { G, part } from "./formes.js";

export const ESSENCES = ["charme", "frene", "sureau", "if", "houx", "chene"];
/* Les vrais arbres : jamais collés l'un à l'autre (le houx et le sureau sont des arbustes) */
export const ARBRES = new Set(["tree", "charme", "frene", "if", "chene"]);
export const estArbre = o => ARBRES.has(o) || ESSENCES.includes(o);
/* Les morceaux du modèle qui sont des fruits ou des fleurs (cachés une fois cueillis, ou hors saison) */
export const FRUITS = {houx: [1, 2], sureau: [2]};
export const saison = () => ["hiver", "hiver", "printemps", "printemps", "printemps", "ete", "ete", "ete", "automne", "automne", "automne", "hiver"][new Date().getMonth()];
/* Le houx a ses baies en automne et en hiver (carnet : « baies en hiver ») ; le sureau ses fleurs au printemps et
   en été, ses baies noires en automne (carnet), rien en hiver */
export const fruitsDeSaison = sp => sp === "houx" ? ["automne", "hiver"].includes(saison()) : sp === "sureau" ? saison() !== "hiver" : false;
/* Ce qu'on y cueille en ce moment (une clé de PRODUITS), ou null */
export const cueilletteDe = sp => !fruitsDeSaison(sp) ? null : sp === "houx" ? "baiesHoux" : sp === "sureau" ? (saison() === "automne" ? "baiesSureau" : "fleursSureau") : null;

/* Les morceaux de chaque essence : [forme, couleur, échelle, position] ; couleurs selon la saison */
export function essences(){
  const automne = saison() === "automne", fleurs = ["printemps", "ete"].includes(saison());
  return {
    charme: [[G.cyl, 0x8A7E70, [.32, 2.6, .32], [0, 1.3, 0]], [G.leaf, automne ? 0xD8AA48 : 0x4A9A4C, [2.3, 2.1, 2.3], [0, 2.9, 0]], [G.leaf2, automne ? 0xE8C060 : 0x5AAA56, [2.2, 2, 2.2], [.1, 3.75, .05]]],
    frene:  [[G.cyl, 0x9A8A70, [.28, 2.8, .28], [0, 1.4, 0]], [G.leaf, automne ? 0xA0B458 : 0x5EAA58, [2, 1.9, 2], [0, 3.1, 0]], [G.leaf2, 0x6FBA64, [1.8, 1.7, 1.8], [-.1, 3.85, .1]]],
    if:     [[G.cyl, 0x9A5A34, [.3, 1.2, .3], [0, .6, 0]], [G.cone, 0x2E6A40, [1.9, 3, 1.9], [0, 2.4, 0]], [G.cone, 0x367A48, [1.3, 1.8, 1.3], [0, 3.6, 0]]],
    houx:   [[G.leaf, 0x3A7A44, [1.5, 1.35, 1.5], [0, .7, 0]], [G.head, 0xD8342A, [.4, .4, .4], [.35, 1.05, .3]], [G.head, 0xD8342A, [.35, .35, .35], [-.3, .95, .35]]],
    sureau: [[G.cyl, 0x9A8A70, [.2, 1, .2], [0, .5, 0]], [G.leaf, 0x6AA05A, [1.6, 1.4, 1.6], [0, 1.4, 0]], [G.head, fleurs ? 0xF8F4E8 : 0x3A2A40, [.55, .45, .55], [.3, 1.9, .2]]],
    chene:  [[G.cyl, 0x6A5440, [.75, 2.4, .75], [0, 1.2, 0]], [G.leaf, automne ? 0xA8884A : 0x3E8044, [3.4, 2.7, 3.4], [0, 3.2, 0]], [G.leaf2, 0x4A904A, [2.5, 2.1, 2.5], [.6, 4.2, -.3]]]
  };
}
export const TAILLE = sp => sp === "chene" ? 1.35 : sp === "houx" || sp === "sureau" ? .95 : 1.1;
/* Un arbre à lui (celui qu'on coupe dans la forêt, ou un arbre planté sur l'île) ; r (0 à 1) fait varier sa taille */
export function arbreModele(sp, r, avecFruits = true){
  const g = new THREE.Group(), fruits = FRUITS[sp] || [];
  essences()[sp].forEach(([geo, col, s, p], k) => { if(avecFruits || !fruits.includes(k)) g.add(part(geo, col, ...s, ...p)); });
  g.scale.setScalar(TAILLE(sp) * (.88 + r * .24));
  return g;
}
