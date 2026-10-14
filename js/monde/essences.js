/* ================= Les essences d'arbres (étape 1.7) =================
   Les arbres de la Forêt profonde, d'après le Grand Carnet (charme, frêne, sureau, if, houx, chêne séculaire) :
   leur modèle en formes simples, partagé par la forêt (dessinés en série : foret.js) et par l'île (un arbre
   planté avec sa graine : ile.js). Leurs fruits (baies du houx, fleurs ou baies du sureau) suivent la saison du
   téléphone et se cachent une fois cueillis.
   Les arbres du Marais brumeux (étape 1.13, morceau 4 ; Grand Carnet : « des arbres qui ont les pieds dans l'eau, et les
   premiers qui ne sont plus tout à fait réels ») : le cyprès des marais (roux en automne, ses racines qui sortent de
   l'eau), l'aulne (ses petits cônes noirs en hiver), le saule des brumes (feuilles argentées, toujours voilé de brume :
   on y recueille l'eau de brume, au bocal) et l'arbre-lanterne (ses fruits s'allument la nuit : LUEUR_LANTERNE). */
import { G, part, toon } from "./formes.js";
import { saison } from "../donnees.js";
export { saison };

export const ESSENCES = ["charme", "frene", "sureau", "if", "houx", "chene", "cypres", "aulne", "sauleBrumes", "arbreLanterne", "pommier"];   // le pommier de l'île : son modèle à lui (pommier.js)
/* Les vrais arbres : jamais collés l'un à l'autre (le houx et le sureau sont des arbustes) */
export const ARBRES = new Set(["tree", "charme", "frene", "if", "chene", "cypres", "aulne", "sauleBrumes", "arbreLanterne", "pommier"]);
export const estArbre = o => ARBRES.has(o) || ESSENCES.includes(o);
/* Les morceaux du modèle qui sont des fruits ou des fleurs (cachés une fois cueillis, ou hors saison) ; le saule des
   brumes n'en a pas (son eau de brume se recueille, rien ne se voit), mais il se cueille comme eux */
export const FRUITS = {houx: [1, 2], sureau: [2], sauleBrumes: [], arbreLanterne: [3, 4, 5, 6], pommier: []};
/* Le houx a ses baies en automne et en hiver (carnet : « baies en hiver ») ; le sureau ses fleurs au printemps et
   en été, ses baies noires en automne (carnet), rien en hiver ; le saule des brumes et l'arbre-lanterne, toute l'année */
export const fruitsDeSaison = sp => sp === "houx" ? ["automne", "hiver"].includes(saison()) : sp === "sureau" ? saison() !== "hiver" : sp === "pommier" ? saison() === "automne" : sp === "sauleBrumes" || sp === "arbreLanterne";
/* Ce qu'on y cueille en ce moment (une clé de PRODUITS), ou null */
export const cueilletteDe = sp => !fruitsDeSaison(sp) ? null : sp === "houx" ? "baiesHoux" : sp === "sureau" ? (saison() === "automne" ? "baiesSureau" : "fleursSureau")
  : sp === "sauleBrumes" ? "eauBrume" : sp === "arbreLanterne" ? "fruitLanterne" : sp === "pommier" ? "pomme" : null;
/* Les fruits de l'arbre-lanterne s'allument la nuit (carnet) : n, 0 le jour, 1 la nuit (main.js, à chaque image) */
export const LUEUR_LANTERNE = toon({color: 0xF8E08A, emissive: 0xF0A030, emissiveIntensity: .2});
export function lueurLanternes(n){ LUEUR_LANTERNE.emissiveIntensity = .2 + n * 1.1; }
/* Le voile de brume du saule des brumes : il ne fait pas d'ombre (arbreModele, marais.js) */
export const VOILE = toon({color: 0xE8F0EC, transparent: true, opacity: .22, depthWrite: false});

/* Les morceaux de chaque essence : [forme, couleur, échelle, position] ; couleurs selon la saison */
export function essences(){
  const automne = saison() === "automne", fleurs = ["printemps", "ete"].includes(saison());
  return {
    charme: [[G.cyl, 0x8A7E70, [.32, 2.6, .32], [0, 1.3, 0]], [G.leaf, automne ? 0xD8AA48 : 0x4A9A4C, [2.3, 2.1, 2.3], [0, 2.9, 0]], [G.leaf2, automne ? 0xE8C060 : 0x5AAA56, [2.2, 2, 2.2], [.1, 3.75, .05]]],
    frene:  [[G.cyl, 0x9A8A70, [.28, 2.8, .28], [0, 1.4, 0]], [G.leaf, automne ? 0xA0B458 : 0x5EAA58, [2, 1.9, 2], [0, 3.1, 0]], [G.leaf2, 0x6FBA64, [1.8, 1.7, 1.8], [-.1, 3.85, .1]]],
    if:     [[G.cyl, 0x9A5A34, [.3, 1.2, .3], [0, .6, 0]], [G.cone, 0x2E6A40, [1.9, 3, 1.9], [0, 2.4, 0]], [G.cone, 0x367A48, [1.3, 1.8, 1.3], [0, 3.6, 0]]],
    houx:   [[G.leaf, 0x3A7A44, [1.5, 1.35, 1.5], [0, .7, 0]], [G.head, 0xD8342A, [.4, .4, .4], [.35, 1.05, .3]], [G.head, 0xD8342A, [.35, .35, .35], [-.3, .95, .35]]],
    sureau: [[G.cyl, 0x9A8A70, [.2, 1, .2], [0, .5, 0]], [G.leaf, 0x6AA05A, [1.6, 1.4, 1.6], [0, 1.4, 0]], [G.head, fleurs ? 0xF8F4E8 : 0x3A2A40, [.55, .45, .55], [.3, 1.9, .2]]],
    chene:  [[G.cyl, 0x6A5440, [.75, 2.4, .75], [0, 1.2, 0]], [G.leaf, automne ? 0xA8884A : 0x3E8044, [3.4, 2.7, 3.4], [0, 3.2, 0]], [G.leaf2, 0x4A904A, [2.5, 2.1, 2.5], [.6, 4.2, -.3]]],
    /* le Marais brumeux : le cyprès (pied évasé, racines qui sortent de l'eau, haute couronne sombre, rousse en automne) */
    cypres: [[G.cone, 0x8A5A3C, [.95, 1.1, .95], [0, .3, 0]], [G.cyl, 0x8A5A3C, [.3, 2.4, .3], [0, 1.5, 0]], [G.cone, automne ? 0xB8683A : 0x3E5A44, [1.7, 2.3, 1.7], [0, 3, 0]],
             [G.cone, automne ? 0xC87A44 : 0x47664C, [1.25, 1.7, 1.25], [0, 3.9, 0]], [G.cone, 0x7A4E34, [.16, .45, .16], [.72, .02, .22]], [G.cone, 0x7A4E34, [.14, .38, .14], [-.5, 0, .6]]],
    /* l'aulne : écorce sombre, feuillage rond ; en hiver, ses petits cônes noirs */
    aulne:  [[G.cyl, 0x5E5048, [.27, 2.3, .27], [0, 1.15, 0]], [G.leaf, automne ? 0x7A8A3E : 0x4E8A48, [2.1, 2.4, 2.1], [0, 3, 0]], [G.leaf2, automne ? 0x8A9440 : 0x5A9850, [2.2, 2.4, 2.2], [.15, 3.85, -.1]],
             ...(saison() === "hiver" ? [[.75, 2.4, .3], [-.55, 2.6, .55], [.2, 2.3, -.8]].map(p => [G.cone, 0x2A2420, [.13, .22, .13], p]) : [])],
    /* le saule des brumes : un dôme argenté, ses longues branches qui pendent, et toujours son voile de brume */
    sauleBrumes: [[G.cyl, 0x8A8478, [.32, 1.8, .32], [0, .9, 0]], [G.head, 0xB4C8C0, [5.6, 3.2, 5.6], [0, 2.3, 0]], [G.head, VOILE, [7.4, 3.6, 7.4], [0, 1.5, 0]],
             ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => { const l = 1.1 + (k % 3) * .25; return [G.box, k % 2 ? 0x9DB8AE : 0xB4C8C0, [.08, l, .08], [Math.cos(k * .7) * 1.15, 2 - l / 2, Math.sin(k * .7) * 1.15]]; })],
    /* l'arbre-lanterne : tronc tordu, feuillage bleu-vert, ses fruits ronds qui luisent (plus fort la nuit) */
    arbreLanterne: [[G.cyl, 0x5A4A50, [.3, 2, .3], [0, 1, 0]], [G.leaf, 0x2E5E58, [2.5, 2, 2.5], [0, 2.8, 0]], [G.leaf2, 0x386A62, [2.4, 1.9, 2.4], [.2, 3.55, -.1]],
             ...[[.8, 2.15, .35], [-.65, 2.1, .6], [.1, 2.05, -.85], [-.7, 2.4, -.4]].map(p => [G.head, LUEUR_LANTERNE, [.8, .95, .8], p])]
  };
}
export const TAILLE = sp => sp === "chene" ? 1.35 : sp === "houx" || sp === "sureau" ? .95 : sp === "cypres" ? 1.15 : sp === "arbreLanterne" ? 1 : 1.1;
/* Un arbre à lui (celui qu'on coupe dans la forêt, ou un arbre planté sur l'île) ; r (0 à 1) fait varier sa taille */
export function arbreModele(sp, r, avecFruits = true){
  const g = new THREE.Group(), fruits = FRUITS[sp] || [];
  essences()[sp].forEach(([geo, col, s, p], k) => { if(avecFruits || !fruits.includes(k)){ const m = part(geo, col, ...s, ...p); if(col === VOILE) m.castShadow = false; g.add(m); } });
  g.scale.setScalar(TAILLE(sp) * (.88 + r * .24));
  return g;
}
