/* ================= Outils en 3D =================
   Le modèle de l'outil tenu en main, en formes simples (phase 1), un par famille d'outils,
   et le sachet d'une graine qu'on va planter.
   Il est construit le manche vers le bas, l'origine dans la main ; le devant regarde +z. */
import { G, part } from "./formes.js";
import { OUTILS, GRAINES, POSABLES, CHEMIN_DE } from "../donnees.js";
import { makeMeuble } from "./meubles.js";
import { rockMesh } from "./rochers.js";

const C = {wood:0xB07A4A, dark:0x654028, stone:0x9EA3A8, metal:0x6F7884, cream:0xF4EFE6, red:0xC8643C};

const BUILD = {
  hache(g, o){
    g.add(part(G.cyl, C.wood, .05, .52, .05, 0, .12, 0));                             // manche
    g.add(part(G.box, o.tete || C.stone, .05, .14, .16, 0, .32, .08));                 // fer de la hache (pierre, cuivre…)
    g.add(part(G.cyl, C.dark, .07, .05, .07, 0, .36, 0));                              // ligature
  },
  pioche(g, o){
    g.add(part(G.cyl, C.wood, .05, .52, .05, 0, .12, 0));
    const head = part(G.cyl, o.tete || C.stone, .07, .38, .07, 0, .36, 0);                      // tête à deux pointes arrondies
    head.rotation.x = Math.PI/2; g.add(head);
  },
  canne(g){
    const rod = part(G.cyl, C.wood, .035, .9, .035, 0, .38, 0);                       // gaule
    g.add(rod);
    g.add(part(G.cyl, C.dark, .09, .05, .09, 0, .02, .04));                            // moulinet
    g.add(part(G.cyl, C.cream, .008, .3, .008, 0, .7, .03));                           // fil
    const bout = new THREE.Object3D(); bout.name = "bout"; bout.position.set(0, .84, 0); g.add(bout);   // le bout de la gaule : le fil de la pêche en part
  },
  filet(g){
    g.add(part(G.cyl, C.wood, .04, .7, .04, 0, .28, 0));                              // manche
    const cercle = new THREE.Mesh(new THREE.TorusGeometry(.13, .015, 6, 16), new THREE.MeshLambertMaterial({color: C.dark}));
    cercle.position.set(0, .7, 0); cercle.rotation.y = Math.PI/2; g.add(cercle);       // le cercle
    const poche = part(G.cone, 0xF4EFE6, .26, .22, .26, 0, .7, .1);                   // la poche du filet
    poche.rotation.x = -Math.PI/2; poche.material = new THREE.MeshLambertMaterial({color: 0xF4EFE6, transparent: true, opacity: .7}); g.add(poche);
  },
  arrosoir(g){
    g.add(part(G.cyl, C.wood, .28, .26, .28, 0, .02, .1));                            // le seau, tenu par son anse
    g.add(part(G.cyl, C.dark, .3, .03, .3, 0, .15, .1));                              // cerclage
    const bec = part(G.cyl, C.wood, .05, .3, .05, 0, .1, .32);                       // bec verseur
    bec.rotation.x = 1.1; g.add(bec);
    const anse = part(G.cyl, C.dark, .03, .3, .03, 0, .24, .1);                       // anse
    anse.rotation.x = Math.PI/2; g.add(anse);
  },
  pelle(g, o){                                                                       // le manche, et la lame arrondie au bout
    g.add(part(G.cyl, C.wood, .045, .62, .045, 0, .2, 0));
    g.add(part(G.box, C.dark, .14, .04, .04, 0, -.1, 0));                              // la poignée
    g.add(part(G.head, o.tete || C.wood, .62, .9, .18, 0, .6, .02));                   // la lame (bois, cuivre…)
  },
  torche(g){                                                                         // la torche éteinte : un bâton, une tête de résine
    g.add(part(G.cyl, C.wood, .05, .5, .05, 0, .16, 0));
    g.add(part(G.cyl, C.dark, .09, .14, .09, 0, .44, 0));
  },
  arc(g){                                                                            // l'arc en if, tenu debout, et sa corde
    const bois = new THREE.Mesh(new THREE.TorusGeometry(.34, .025, 6, 18, Math.PI * .8), new THREE.MeshLambertMaterial({color: 0xC8743C}));
    bois.rotation.z = Math.PI * .6; bois.rotation.y = Math.PI/2; bois.position.set(0, .3, -.2); g.add(bois);
    g.add(part(G.cyl, C.cream, .008, .64, .008, 0, .3, .02));                           // la corde
    g.add(part(G.cyl, C.dark, .05, .1, .05, 0, .3, -.13));                              // la poignée
  },
  arme(g, o){
    g.add(part(G.cyl, C.dark, .045, .14, .045, 0, 0, 0));                              // poignée
    g.add(part(G.box, C.dark, .06, .04, .2, 0, .08, 0));                               // garde
    g.add(part(G.box, o.tete || C.wood, .04, .44, .09, 0, .32, 0));                    // lame (bois, cuivre…)
    g.add(part(G.head, o.tete || C.wood, .2, .2, .38, 0, .54, 0));                     // bout arrondi
  }
};
function graine(g){
  g.add(part(G.head, C.cream, .6, .7, .6, 0, .08, 0));                                // sachet de toile
  g.add(part(G.cyl, C.dark, .12, .04, .12, 0, .24, 0));                              // lien
  g.add(part(G.head, 0x7A4E2A, .28, .3, .28, 0, .3, .02));                           // la graine qui dépasse
}
/* La matière d'un chemin, tenue en main (étape 1.9) : une planche, un bloc, un petit tas de gravier */
function matiere(g, k){
  if(k === "planche") g.add(part(G.box, 0xC29462, .09, .05, .46, 0, .1, .12));
  else if(k === "bloc") g.add(part(G.box, 0x9EA3A8, .2, .15, .2, 0, .08, .05));
  else {
    g.add(part(G.head, 0xD8CDB4, .7, .5, .7, 0, .06, .05));
    for(const [x, z] of [[-.05, .02], [.05, .08], [0, -.04]]) g.add(part(G.dode, 0x8E8678, .05, .04, .05, x, .12, z));
  }
}
/* Le modèle d'un outil (une clé de OUTILS) ou d'une graine (une clé de GRAINES) */
export function makeOutil(k){
  const g = new THREE.Group();
  if(GRAINES[k]) graine(g);
  else if(POSABLES[k]){                             // un coffre ou un rocher à poser
    const c = POSABLES[k].pose === "coffre" ? makeMeuble("coffre") : rockMesh(POSABLES[k].pose, .5);
    c.scale.multiplyScalar(POSABLES[k].pose === "coffre" ? .22 : .4); c.position.y = .05; g.add(c); return g;
  }
  else if(CHEMIN_DE[k]) matiere(g, k);
  else BUILD[OUTILS[k].famille](g, OUTILS[k]);
  g.scale.set(1.6, 1.25, 1.6);          // plus épais que nature, pour bien le voir sur un téléphone (style jouet)
  return g;
}
