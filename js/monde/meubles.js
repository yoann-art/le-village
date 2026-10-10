/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part } from "./formes.js";
import { MEUBLES, COULEURS, ATELIERS } from "../donnees.js";
import { pierreMesh } from "./rochers.js";

const C = {wood:0x8B5A3C, light:0xB07A4A, dark:0x654028, metal:0x6F7884, gold:0xE2B24D, white:0xF4EFE6, blue:0x4E6DB3,
  red:0xA9322A, cream:0xE8C48A, stone:0xAEB0B3, stone2:0x8E9195, soot:0x2A2522, clay:0xC8643C, leaf:0x57B25C, yellow:0xF2C14E};
/* Ce qui brille : les flammes et la lumière des lanternes */
const fireMat = new THREE.MeshLambertMaterial({color:0xFF8A3D, emissive:0xFF5A00, emissiveIntensity:.9});
const glowMat = new THREE.MeshLambertMaterial({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});
/* Le verre de la vitrine : on voit au travers */
const verreMat = new THREE.MeshLambertMaterial({color:0xD8EEF8, transparent:true, opacity:.3, depthWrite:false});

/* Couleur « d'origine » de la partie principale de chaque meuble */
const ORIGIN = {chaise:C.wood, tabouret:C.wood, pot:C.clay, lanterne:C.dark, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, vitrine:C.light, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue, statue:C.stone,
  chandelier:0xD8DCE2, etabli:C.wood, atelierDeco:C.light, tableTaille:C.stone2, comptoir:C.red, fourneau:C.stone, enclume:0x4A4F57, trone:C.dark};

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
  chandelier(g, m){                                                                  // l'argent de la mine (étape 1.11) : trois bougies
    g.add(part(G.cyl, m, .34, .06, .34, 0, .03, 0));                                  // le pied
    g.add(part(G.cyl, m, .06, .7, .06, 0, .4, 0));                                    // la tige
    g.add(part(G.box, m, .6, .05, .06, 0, .72, 0));                                   // les bras
    for(const x of [-.27, 0, .27]){
      g.add(part(G.cyl, m, .12, .05, .12, x, .76, 0));                                // les coupelles
      g.add(part(G.cyl, C.white, .07, .22, .07, x, .89 + (x ? 0 : .06), 0));          // les bougies
      g.add(part(G.cone, fireMat, .06, .1, .06, x, 1.05 + (x ? 0 : .06), 0));         // les flammes
    }
  },
  /* La vitrine (étape 1.11, morceau 4 ; Grand Carnet : bois et verre) : un meuble bas, une cage de verre (le dessus
     aussi : la caméra regarde d'en haut), et la pierre exposée sur un coussin de velours */
  vitrine(g, m, pierre){
    g.add(part(G.box, m, 1.1, .42, .6, 0, .21, 0));                                   // le meuble du bas
    for(const x of [-.27, .27]) g.add(part(G.box, C.dark, .44, .3, .02, x, .22, .305));   // ses deux portes
    g.add(part(G.box, C.dark, 1.16, .05, .66, 0, .445, 0));                            // le plateau
    g.add(part(G.box, C.red, .46, .05, .34, 0, .495, 0));                              // le coussin de velours
    const v = part(G.box, verreMat, 1.02, .42, .56, 0, .68, 0); v.castShadow = false; v.receiveShadow = false; g.add(v);   // la cage de verre
    for(const [x, z] of [[-.51, -.28], [.51, -.28], [-.51, .28], [.51, .28]]) g.add(part(G.box, m, .05, .42, .05, x, .68, z));   // les montants
    for(const z of [-.28, .28]) g.add(part(G.box, m, 1.07, .04, .04, 0, .9, z));      // le cadre du dessus
    for(const x of [-.51, .51]) g.add(part(G.box, m, .04, .04, .6, x, .9, 0));
    if(pierre){ const p = pierreMesh(pierre); p.scale.setScalar(1.35); p.position.y = .52; g.add(p); }
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
  },
  etabli(g, m){
    g.add(part(G.box, m, 1.6, .12, .75, 0, .55, 0));                                  // plateau
    for(const [x,z] of [[-.7,-.28],[.7,-.28],[-.7,.28],[.7,.28]]) g.add(part(G.box, m, .1, .5, .1, x, .25, z));
    g.add(part(G.box, C.dark, 1.4, .05, .6, 0, .15, 0));                               // étagère du bas
    for(const y of [.2, .25, .3]) g.add(part(G.box, C.cream, 1.2, .05, .16, 0, y, -.05 + (y - .25)));   // planches rangées
    g.add(part(G.box, C.dark, .2, .16, .22, -.6, .69, .25));                           // étau
    g.add(part(G.box, C.metal, .5, .02, .14, .2, .62, .12));                           // lame de scie
    g.add(part(G.box, C.light, .14, .06, .1, .52, .64, .12));                          // poignée
    g.add(part(G.box, C.light, .45, .08, .2, -.15, .65, -.18));                        // pièce de bois en cours
  },
  statue(g, m){
    g.add(part(G.box, C.stone2, .5, .24, .5, 0, .12, 0));                             // socle
    g.add(part(G.head, m, 1.2, 1.7, 1.2, 0, .6, 0));                                  // corps arrondi
    g.add(part(G.head, m, .9, .9, .9, 0, 1.1, 0));                                    // tête
  },
  atelierDeco(g, m){
    g.add(part(G.box, m, 1.6, .1, .75, 0, .55, 0));                                   // plateau
    for(const [x,z] of [[-.7,-.28],[.7,-.28],[-.7,.28],[.7,.28]]) g.add(part(G.cyl, C.dark, .09, .5, .09, x, .25, z));
    for(const x of [-.6, .6]) g.add(part(G.box, C.dark, .08, .75, .08, x, .975, -.3));   // petit métier à tisser : montants
    g.add(part(G.box, C.dark, 1.3, .08, .08, 0, 1.33, -.3));                           // traverse
    [C.red, C.yellow, C.blue, C.leaf, C.cream].forEach((c, i) => g.add(part(G.box, c, .06, .6, .03, -.4 + i * .2, 1, -.3)));   // fils tendus
    const roll = part(G.cyl, C.red, .26, .7, .26, -.3, .74, .12);                      // rouleau de tissu
    roll.rotation.z = Math.PI/2; g.add(roll);
    g.add(part(G.box, C.blue, .36, .06, .28, .4, .63, .1));                            // tissus pliés
    g.add(part(G.box, C.cream, .34, .06, .26, .4, .69, .1));
    g.add(part(G.cyl, C.clay, .14, .14, .14, .15, .67, -.12));                          // pot de peinture
  },
  tableTaille(g, m){
    g.add(part(G.box, m, 1.6, .16, .85, 0, .6, 0));                                   // dalle
    for(const x of [-.55, .55]) g.add(part(G.box, m, .32, .52, .7, x, .26, 0));        // pieds en pierre
    g.add(part(G.box, C.stone, .42, .38, .42, -.3, .87, 0));                            // bloc en cours de taille
    g.add(part(G.box, C.metal, .04, .04, .3, .2, .7, .15));                             // ciseau
    const head = part(G.cyl, C.wood, .16, .26, .16, .45, .76, -.05);                   // maillet
    head.rotation.z = Math.PI/2; g.add(head);
    g.add(part(G.box, C.light, .05, .05, .32, .45, .72, .12));
    for(const [x,z] of [[.1,-.25],[-.05,.3],[.62,.28]]) g.add(part(G.dode, C.stone2, .1, .1, .1, x, .72, z));   // éclats
  },
  comptoir(g, m){
    g.add(part(G.box, m, 2.1, .84, .72, 0, .42, 0));                                  // caisse du comptoir
    g.add(part(G.box, C.wood, 2.2, .08, .85, 0, .88, 0));                               // plateau
    for(const x of [-.7, 0, .7]) g.add(part(G.box, C.cream, .5, .5, .02, x, .45, .37)); // panneaux de façade
    g.add(part(G.cyl, C.metal, .05, .5, .05, -.55, 1.17, -.1));                         // balance : pied, fléau, plateaux
    g.add(part(G.box, C.metal, .7, .03, .03, -.55, 1.42, -.1));
    for(const x of [-.85, -.25]){
      g.add(part(G.cyl, C.metal, .01, .22, .01, x, 1.31, -.1));
      g.add(part(G.cyl, C.gold, .26, .03, .26, x, 1.2, -.1));
    }
    g.add(part(G.box, C.wood, .5, .25, .4, .55, 1.045, -.05));                          // cagette de pommes
    for(const [x,z] of [[.45,-.12],[.62,-.1],[.5,.04],[.66,.05]]) g.add(part(G.head, C.red, .45, .45, .45, x, 1.2, z));
    for(let k = 0; k < 3; k++) g.add(part(G.cyl, C.gold, .14, .03, .14, .05, .935 + k * .03, .2));   // pièces empilées
  },
  fourneau(g, m){
    g.add(part(G.box, m, 1.4, .5, .78, 0, .25, 0));                                   // socle de pierre
    g.add(part(G.head, m, 2.2, 2.2, 2.2, -.3, .55, -.02));                             // four en dôme
    g.add(part(G.box, C.soot, .4, .32, .06, -.3, .48, .52));                           // bouche du four, devant le dôme
    g.add(part(G.box, fireMat, .28, .12, .03, -.3, .4, .555));                         // braises
    g.add(part(G.cyl, C.stone2, .22, .5, .22, -.3, 1.25, -.1));                         // petite cheminée
    g.add(part(G.box, C.soot, .55, .06, .62, .38, .53, 0));                             // plaque de cuisson
    g.add(part(G.cyl, C.soot, .38, .3, .38, .38, .71, 0));                              // marmite
    g.add(part(G.cyl, C.metal, .42, .04, .42, .38, .86, 0));
  },
  enclume(g, m){
    g.add(part(G.cyl, C.light, .56, .44, .56, 0, .22, 0));                             // billot
    g.add(part(G.box, m, .36, .06, .24, 0, .47, 0));                                  // pied de l'enclume
    g.add(part(G.box, m, .2, .12, .16, 0, .56, 0));
    g.add(part(G.box, m, .5, .14, .26, -.04, .69, 0));                                // table de frappe
    const horn = part(G.cone, m, .2, .26, .2, .33, .69, 0);                           // bigorne
    horn.rotation.z = -Math.PI/2; g.add(horn);
    const handle = part(G.box, C.light, .05, .42, .05, -.34, .27, .24);               // marteau posé contre le billot
    handle.rotation.z = .35; g.add(handle);
    g.add(part(G.box, C.metal, .1, .16, .1, -.41, .47, .24));
  },
  trone(g, m){
    g.add(part(G.box, C.stone, 1.2, .16, 1, 0, .08, 0));                               // estrade
    g.add(part(G.box, m, .8, .36, .6, 0, .34, .05));                                  // base
    g.add(part(G.box, m, .8, 1.05, .14, 0, 1.0, -.26));                               // haut dossier
    g.add(part(G.head, m, 1.7, .9, .6, 0, 1.52, -.26));                               // dossier arrondi
    g.add(part(G.box, C.red, .66, .1, .5, 0, .57, .08));                               // coussin
    g.add(part(G.box, C.red, .6, .72, .04, 0, 1.0, -.18));                             // dossier rembourré
    for(const x of [-.38, .38]){
      g.add(part(G.box, m, .1, .26, .52, x, .7, .05));                                // accoudoirs
      g.add(part(G.head, C.gold, .45, .45, .45, x, .85, .3));                          // pommeaux dorés
    }
    g.add(part(G.head, C.gold, .6, .6, .6, 0, 1.75, -.26));                            // ornement doré
  }
};
/* Le modèle d'un meuble, avec la couleur choisie (une clé de COULEURS), ou sa couleur d'origine ; pierre : ce qu'expose
   une vitrine */
export function makeMeuble(type, color, pierre){
  const g = new THREE.Group();
  BUILD[type](g, COULEURS[color] ? COULEURS[color].hex : ORIGIN[type], pierre);
  return g;
}

/* Taille au sol d'un meuble posé (largeur, profondeur), selon qu'il est tourné ou non */
export const footOf = it => { const m = MEUBLES[it.type]; return it.rot % 2 ? [m.d, m.w] : [m.w, m.d]; };
/* Le plan de travail d'un bâtiment se construit avec des ressources, puis se pose où l'on veut dans
   sa pièce (mode décoration). A-t-il déjà été construit ? */
export const hasPlan = b => {
  const a = ATELIERS[b.type];
  return !!a && !!b.deco && b.deco.items.some(it => it.type === a.meuble);
};
/* Un meuble (pas un tapis) couvre-t-il ce point de la pièce ? */
export function meubleAt(items, x, z){
  return items.some(it => {
    if(MEUBLES[it.type].flat) return false;
    const [w, d] = footOf(it);
    return Math.abs(x - it.x) < w/2 && Math.abs(z - it.z) < d/2;
  });
}
