/* ================= Outils en 3D =================
   Le modèle de l'outil tenu en main, en formes simples (phase 1), un par famille d'outils,
   et le sachet d'une graine qu'on va planter.
   Il est construit le manche vers le bas, l'origine dans la main ; le devant regarde +z. */
import { G, part } from "./formes.js";
import { OUTILS, GRAINES } from "../donnees.js";

const C = {wood:0xB07A4A, dark:0x654028, stone:0x9EA3A8, metal:0x6F7884, cream:0xF4EFE6, red:0xC8643C};

const BUILD = {
  hache(g){
    g.add(part(G.cyl, C.wood, .05, .52, .05, 0, .12, 0));                             // manche
    g.add(part(G.box, C.stone, .05, .14, .16, 0, .32, .08));                           // fer de la hache
    g.add(part(G.cyl, C.dark, .07, .05, .07, 0, .36, 0));                              // ligature
  },
  pioche(g){
    g.add(part(G.cyl, C.wood, .05, .52, .05, 0, .12, 0));
    const head = part(G.cyl, C.stone, .07, .38, .07, 0, .36, 0);                      // tête à deux pointes arrondies
    head.rotation.x = Math.PI/2; g.add(head);
  },
  canne(g){
    const rod = part(G.cyl, C.wood, .035, .9, .035, 0, .38, 0);                       // gaule
    g.add(rod);
    g.add(part(G.cyl, C.dark, .09, .05, .09, 0, .02, .04));                            // moulinet
    g.add(part(G.cyl, C.cream, .008, .3, .008, 0, .7, .03));                           // fil
  },
  arrosoir(g){
    g.add(part(G.cyl, C.wood, .28, .26, .28, 0, .02, .1));                            // le seau, tenu par son anse
    g.add(part(G.cyl, C.dark, .3, .03, .3, 0, .15, .1));                              // cerclage
    const bec = part(G.cyl, C.wood, .05, .3, .05, 0, .1, .32);                       // bec verseur
    bec.rotation.x = 1.1; g.add(bec);
    const anse = part(G.cyl, C.dark, .03, .3, .03, 0, .24, .1);                       // anse
    anse.rotation.x = Math.PI/2; g.add(anse);
  },
  arme(g){
    g.add(part(G.cyl, C.dark, .045, .14, .045, 0, 0, 0));                              // poignée
    g.add(part(G.box, C.dark, .06, .04, .2, 0, .08, 0));                               // garde
    g.add(part(G.box, C.wood, .04, .44, .09, 0, .32, 0));                              // lame en bois
    g.add(part(G.head, C.wood, .2, .2, .38, 0, .54, 0));                               // bout arrondi
  }
};
function graine(g){
  g.add(part(G.head, C.cream, .6, .7, .6, 0, .08, 0));                                // sachet de toile
  g.add(part(G.cyl, C.dark, .12, .04, .12, 0, .24, 0));                              // lien
  g.add(part(G.head, 0x7A4E2A, .28, .3, .28, 0, .3, .02));                           // la graine qui dépasse
}
/* Le modèle d'un outil (une clé de OUTILS) ou d'une graine (une clé de GRAINES) */
export function makeOutil(k){
  const g = new THREE.Group();
  if(GRAINES[k]) graine(g); else BUILD[OUTILS[k].famille](g);
  g.scale.set(1.6, 1.25, 1.6);          // plus épais que nature, pour bien le voir sur un téléphone (style jouet)
  return g;
}
