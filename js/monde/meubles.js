/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran. */
import { G, part } from "./formes.js";
import { MEUBLES } from "../donnees.js";

const C = {wood:0x8B5A3C, light:0xB07A4A, dark:0x654028, metal:0x6F7884, gold:0xE2B24D, white:0xF4EFE6, blue:0x4E6DB3};

const BUILD = {
  chaise(g){
    g.add(part(G.box, C.wood, .6, .1, .6, 0, .3, 0));                                 // assise
    for(const [x,z] of [[-.24,-.24],[.24,-.24],[-.24,.24],[.24,.24]]) g.add(part(G.cyl, C.dark, .07, .3, .07, x, .15, z));
    g.add(part(G.box, C.wood, .6, .5, .08, 0, .6, -.26));                              // dossier
  },
  coffre(g){
    g.add(part(G.box, C.wood, 1.2, .5, .7, 0, .25, 0));                                // caisse
    const lid = part(G.cyl, C.light, .7, 1.2, .7, 0, .5, 0);                           // couvercle bombé
    lid.rotation.z = Math.PI/2; g.add(lid);
    for(const x of [-.4, .4]){                                                         // cerclages : autour de la caisse et du couvercle
      g.add(part(G.box, C.metal, .07, .5, .74, x, .25, 0));
      const ring = part(G.cyl, C.metal, .74, .07, .74, x, .5, 0);
      ring.rotation.z = Math.PI/2; g.add(ring);
    }
    g.add(part(G.box, C.gold, .16, .16, .05, 0, .46, .37));                            // serrure
  },
  lit(g){
    g.add(part(G.box, C.wood, 1.4, .3, 2.2, 0, .15, 0));                               // cadre
    g.add(part(G.box, C.blue, 1.3, .14, 1.6, 0, .37, .25));                            // couverture
    g.add(part(G.box, C.white, 1.3, .15, .35, 0, .375, -.72));                         // drap replié
    g.add(part(G.box, C.white, .9, .12, .3, 0, .44, -.85));                            // oreiller
    g.add(part(G.box, C.dark, 1.4, .8, .12, 0, .4, -1.04));                            // tête de lit
    g.add(part(G.box, C.dark, 1.4, .45, .1, 0, .225, 1.05));                           // pied de lit
  }
};
export function makeMeuble(type){
  const g = new THREE.Group();
  BUILD[type](g);
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
