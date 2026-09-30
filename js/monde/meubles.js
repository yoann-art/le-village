/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part } from "./formes.js";
import { MEUBLES, COULEURS } from "../donnees.js";

const C = {wood:0x8B5A3C, light:0xB07A4A, dark:0x654028, metal:0x6F7884, gold:0xE2B24D, white:0xF4EFE6, blue:0x4E6DB3,
  red:0xA9322A, cream:0xE8C48A, stone:0xAEB0B3, stone2:0x8E9195, soot:0x2A2522, clay:0xC8643C, leaf:0x57B25C, yellow:0xF2C14E};
/* Ce qui brille : les flammes et la lumière des lanternes */
const fireMat = new THREE.MeshLambertMaterial({color:0xFF8A3D, emissive:0xFF5A00, emissiveIntensity:.9});
const glowMat = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});

/* Couleur « d'origine » de la partie principale de chaque meuble */
const ORIGIN = {chaise:C.wood, tabouret:C.wood, pot:C.clay, lanterne:C.dark, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue};

const BUILD = {
  chaise(g, m){
    g.add(part(G.box, m, .6, .1, .6, 0, .3, 0));                                      // assise
    for(const [x,z] of [[-.24,-.24],[.24,-.24],[-.24,.24],[.24,.24]]) g.add(part(G.cyl, C.dark, .07, .3, .07, x, .15, z));
    g.add(part(G.box, m, .6, .5, .08, 0, .6, -.26));                                  // dossier
  },
  tabouret(g, m){
    g.add(part(G.cyl, m, .44, .08, .44, 0, .32, 0));                                  // assise ronde
    for(let k = 0; k < 3; k++){ const a = k * Math.PI * 2 / 3; g.add(part(G.cyl, C.dark, .06, .3, .06, Math.sin(a) * .14, .15, Math.cos(a) * .14)); }
  },
  pot(g, m){
    g.add(part(G.cyl, m, .4, .3, .4, 0, .15, 0));                                     // pot
    g.add(part(G.cyl, m, .46, .06, .46, 0, .3, 0));                                   // rebord
    g.add(part(G.leaf, C.leaf, .5, .45, .5, 0, .5, 0));                                // feuillage
    for(const [x,y,z,c] of [[-.1,.66,.08,C.red],[.12,.62,.05,C.yellow],[0,.6,-.12,C.white]]) g.add(part(G.head, c, .28, .28, .28, x, y, z));   // fleurs
  },
  lanterne(g, m){
    g.add(part(G.box, m, .4, .08, .4, 0, .04, 0));                                    // socle
    g.add(part(G.cyl, m, .08, 1.1, .08, 0, .6, 0));                                   // poteau
    g.add(part(G.box, glowMat, .22, .28, .22, 0, 1.28, 0));                            // lanterne allumée
    g.add(part(G.cone4, m, .36, .16, .36, 0, 1.5, 0));                                // chapeau
  },
  tonneau(g, m){
    g.add(part(G.cyl, m, .64, .7, .64, 0, .35, 0));                                   // douelles
    for(const y of [.15, .55]) g.add(part(G.cyl, C.metal, .67, .05, .67, 0, y, 0));   // cerclages
    g.add(part(G.cyl, C.dark, .6, .02, .6, 0, .705, 0));                               // couvercle
  },
  coffre(g, m){
    g.add(part(G.box, m, 1.2, .5, .7, 0, .25, 0));                                    // caisse
    const lid = part(G.cyl, m, .7, 1.2, .7, 0, .5, 0);                                // couvercle bombé
    lid.rotation.z = Math.PI/2; g.add(lid);
    for(const x of [-.4, .4]){                                                         // cerclages : autour de la caisse et du couvercle
      g.add(part(G.box, C.metal, .07, .5, .74, x, .25, 0));
      const ring = part(G.cyl, C.metal, .74, .07, .74, x, .5, 0);
      ring.rotation.z = Math.PI/2; g.add(ring);
    }
    g.add(part(G.box, C.gold, .16, .16, .05, 0, .46, .37));                            // serrure
  },
  banc(g, m){
    g.add(part(G.box, m, 1.5, .1, .45, 0, .35, 0));                                   // planche
    for(const x of [-.62, .62]) g.add(part(G.box, C.dark, .1, .35, .4, x, .175, 0));   // pieds
  },
  etagere(g, m){
    for(const x of [-.66, .66]) g.add(part(G.box, C.dark, .08, 1.6, .45, x, .8, 0));  // montants
    g.add(part(G.box, m, 1.4, 1.6, .04, 0, .8, -.2));                                 // fond
    for(const y of [.05, .55, 1.05, 1.55]) g.add(part(G.box, m, 1.3, .06, .45, 0, y, 0));   // planches
    [[C.red,-.45],[C.blue,-.35],[C.cream,-.26],[C.leaf,-.17]].forEach(([c,x]) => g.add(part(G.box, c, .08, .36, .3, x, .76, 0)));   // livres
    g.add(part(G.cyl, C.clay, .22, .3, .22, .35, 1.23, 0));                             // cruche
    g.add(part(G.box, C.gold, .3, .16, .22, -.25, .16, 0));                            // coffret
  },
  cheminee(g, m){
    g.add(part(G.box, m, 1.6, 1.4, .7, 0, .7, -.05));                                 // maçonnerie
    g.add(part(G.box, C.soot, .9, .65, .1, 0, .38, .3));                               // foyer
    g.add(part(G.box, fireMat, .6, .25, .06, 0, .2, .33));                             // flammes
    g.add(part(G.box, C.wood, 1.8, .12, .8, 0, 1.1, 0));                               // tablette
    g.add(part(G.box, C.stone2, 1.0, .6, .5, 0, 1.7, -.1));                            // hotte
  },
  petitTapis(g, m){
    g.add(part(G.box, m, 1.6, .02, 1.1, 0, .012, 0));                                 // bordure
    g.add(part(G.box, C.cream, 1.3, .025, .8, 0, .014, 0));
  },
  table(g, m){
    g.add(part(G.box, m, 2, .1, 1.4, 0, .45, 0));                                     // plateau à ½ P
    for(const [x,z] of [[-.85,-.55],[.85,-.55],[-.85,.55],[.85,.55]]) g.add(part(G.cyl, C.dark, .12, .4, .12, x, .2, z));
  },
  lit(g, m){
    g.add(part(G.box, C.wood, 1.4, .3, 2.2, 0, .15, 0));                               // cadre
    g.add(part(G.box, m, 1.3, .14, 1.6, 0, .37, .25));                                // couverture
    g.add(part(G.box, C.white, 1.3, .15, .35, 0, .375, -.72));                         // drap replié
    g.add(part(G.box, C.white, .9, .12, .3, 0, .44, -.85));                            // oreiller
    g.add(part(G.box, C.dark, 1.4, .8, .12, 0, .4, -1.04));                            // tête de lit
    g.add(part(G.box, C.dark, 1.4, .45, .1, 0, .225, 1.05));                           // pied de lit
  },
  grandTapis(g, m){
    g.add(part(G.box, m, 2.4, .02, 1.8, 0, .012, 0));                                 // bordure
    g.add(part(G.box, C.cream, 2, .025, 1.4, 0, .014, 0));
    g.add(part(G.box, C.gold, 1, .028, .6, 0, .016, 0));
  }
};
/* Le modèle d'un meuble, avec la couleur choisie (une clé de COULEURS), ou sa couleur d'origine */
export function makeMeuble(type, color){
  const g = new THREE.Group();
  BUILD[type](g, COULEURS[color] ? COULEURS[color].hex : ORIGIN[type]);
  return g;
}

/* Taille au sol d'un meuble posé (largeur, profondeur), selon qu'il est tourné ou non */
export const footOf = it => { const m = MEUBLES[it.type]; return it.rot % 2 ? [m.d, m.w] : [m.w, m.d]; };
/* Un meuble (pas un tapis) couvre-t-il ce point de la pièce ? */
export function meubleAt(items, x, z){
  return items.some(it => {
    if(MEUBLES[it.type].flat) return false;
    const [w, d] = footOf(it);
    return Math.abs(x - it.x) < w/2 && Math.abs(z - it.z) < d/2;
  });
}
