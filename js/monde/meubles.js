/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part, toon } from "./formes.js";
import { MEUBLES, COULEURS, ATELIERS } from "../donnees.js";
import { pierreMesh } from "./rochers.js";

const C = {wood:0x8B5A3C, light:0xB07A4A, dark:0x654028, metal:0x6F7884, gold:0xE2B24D, white:0xF4EFE6, blue:0x4E6DB3,
  red:0xA9322A, cream:0xE8C48A, stone:0xAEB0B3, stone2:0x8E9195, soot:0x2A2522, clay:0xC8643C, leaf:0x57B25C, yellow:0xF2C14E};
/* Ce qui brille : les flammes et la lumière des lanternes (les flammes vacillent : lumieres.js) */
export const fireMat = toon({color:0xFF8A3D, emissive:0xFF5A00, emissiveIntensity:.9});
const glowMat = toon({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});
/* Le verre des lanternes qui s'allument seules à la nuit tombée (lumieres.js règle leur éclat), et les lucioles du bocal */
export const nuitMat = toon({color:0xFFEFC8, emissive:0xFFC060, emissiveIntensity:.1});
export const lucioleMat = toon({color:0xE8FF9A, emissive:0xC8F060, emissiveIntensity:.9});
const CUIVRE = 0xC8743C;
/* Le verre de la vitrine : on voit au travers */
const verreMat = toon({color:0xD8EEF8, transparent:true, opacity:.3, depthWrite:false});

/* Couleur « d'origine » de la partie principale de chaque meuble */
const ORIGIN = {chaise:C.wood, tabouret:C.wood, pot:C.clay, lanterne:C.dark, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, vitrine:C.light, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue, statue:C.stone,
  chandelier:0xD8DCE2, chandelle:0xB88A4A, torchere:C.wood, torchereMurale:0xC8743C, feuCamp:C.stone, lanterneMurale:0xC8743C,
  bocalLucioles:C.wood, brasero:0xC8743C, lampadaire:C.dark, lustre:0xB98A4A, etabli:C.wood, atelierDeco:C.light, tableTaille:C.stone2, comptoir:C.red, fourneau:C.stone, enclume:0x4A4F57, trone:C.dark};

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
  /* Les lumières (demande de Yo, 11 octobre 2026 ; LUMIERE dans donnees.js) */
  chandelle(g, m){                                                                   // une chandelle de suif sur son bougeoir
    g.add(part(G.cyl, m, .34, .04, .34, 0, .02, 0));                                  // la coupelle
    g.add(part(G.cyl, m, .16, .06, .16, 0, .07, 0));                                  // le godet
    const anse = part(G.tore, m, .2, .2, .3, .2, .06, 0); anse.rotation.y = Math.PI / 2; g.add(anse);   // l'anse
    g.add(part(G.cyl, 0xF1E6C8, .12, .26, .12, 0, .23, 0));                           // la chandelle, couleur crème
    g.add(part(G.cone, fireMat, .08, .13, .08, 0, .42, 0));                           // la flamme
  },
  /* La torchère sur pied : un socle de pierre, un poteau de bois, une coupelle de fer ; la torche posée dessus brûle
     toujours (o.torche) */
  torchere(g, m, o){
    g.add(part(G.cyl, C.stone2, .38, .1, .38, 0, .05, 0));                            // le socle
    g.add(part(G.cyl, m, .09, 1.0, .09, 0, .6, 0));                                   // le poteau
    g.add(part(G.cyl, C.metal, .26, .08, .26, 0, 1.12, 0));                           // la coupelle
    for(const [x, z] of [[.11, 0], [-.11, 0], [0, .11], [0, -.11]]) g.add(part(G.box, C.metal, .03, .14, .03, x, 1.2, z));   // ses griffes
    if(o && o.torche) torcheSur(g, 0, 1.16, 0);
  },
  /* La torchère murale (en cuivre, contre un mur de la pièce) : une plaque, un bras, une coupelle */
  torchereMurale(g, m, o){
    g.add(part(G.box, m, .24, .42, .04, 0, 1.2, -.23));                               // la plaque, sur le mur
    g.add(part(G.box, m, .05, .05, .26, 0, 1.08, -.1));                                // le bras
    g.add(part(G.cyl, m, .22, .08, .22, 0, 1.12, .04));                                // la coupelle
    if(o && o.torche) torcheSur(g, 0, 1.15, .04);
  },
  /* Le feu de camp (dehors seulement) : un cercle de pierres, des bûches croisées, les flammes */
  feuCamp(g, m){
    for(let k = 0; k < 9; k++){ const a = k * Math.PI * 2 / 9; g.add(part(G.dode, m, .22, .17, .22, Math.sin(a) * .38, .07, Math.cos(a) * .38)); }
    g.add(part(G.cyl, 0x3A2A22, .52, .03, .52, 0, .015, 0));                           // les cendres
    for(const r of [0, Math.PI / 3, -Math.PI / 3]){
      const b = part(G.cyl, 0x7A4E2E, .1, .62, .1, 0, .12, 0); b.rotation.order = "YXZ"; b.rotation.set(Math.PI / 2 - .25, r, 0); g.add(b);
    }
    g.add(part(G.cone, fireMat, .28, .5, .28, 0, .36, 0));                             // les flammes
    g.add(part(G.cone, fireMat, .18, .34, .18, .1, .28, .06));
    g.add(part(G.cone, fireMat, .16, .3, .16, -.09, .27, -.05));
  },
  /* La lanterne murale (cuivre, verre, une chandelle) : au mur d'une pièce ou sur une façade ; elle s'allume seule à la
     nuit tombée (nuitMat) */
  lanterneMurale(g, m){
    g.add(part(G.box, m, .2, .36, .04, 0, 1.25, -.23));                               // la plaque, sur le mur
    g.add(part(G.box, m, .04, .04, .3, 0, 1.56, -.1));                                 // le bras
    g.add(part(G.cyl, m, .02, .08, .02, 0, 1.52, .05));                                // le crochet
    const v = part(G.box, nuitMat, .18, .24, .18, 0, 1.32, .05); v.castShadow = false; g.add(v);   // le verre
    for(const [x, z] of [[-.1, -.05], [.1, -.05], [-.1, .15], [.1, .15]]) g.add(part(G.box, m, .025, .26, .025, x, 1.32, z));   // les montants
    g.add(part(G.cone4, m, .28, .12, .28, 0, 1.5, .05));                               // le chapeau
    g.add(part(G.box, m, .22, .03, .22, 0, 1.19, .05));                                // le fond
  },
  /* Le bocal à lucioles (Grand Carnet : « une lumière douce et vivante ») : trois lucioles qui palpitent */
  bocalLucioles(g, m){
    const v = part(G.cyl, verreMat, .32, .4, .32, 0, .21, 0); v.castShadow = false; v.receiveShadow = false; g.add(v);
    g.add(part(G.cyl, m, .34, .06, .34, 0, .44, 0));                                   // le couvercle de bois
    g.add(part(G.cyl, 0xD8CBA8, .2, .05, .2, 0, .49, 0));                              // le tissu noué
    for(const [x, y, z] of [[.05, .14, .05], [-.06, .26, -.03], [.04, .32, -.06]]){
      const l = part(G.head, lucioleMat, .14, .14, .14, x, y, z); l.castShadow = false; g.add(l);
    }
  },
  /* Le brasero (dehors) : une vasque de cuivre sur trois pieds, ses braises et ses flammes */
  brasero(g, m){
    for(let k = 0; k < 3; k++){ const a = k * Math.PI * 2 / 3; g.add(part(G.cyl, m, .06, .7, .06, Math.sin(a) * .22, .35, Math.cos(a) * .22)); }
    g.add(part(G.cyl, m, .62, .18, .62, 0, .76, 0));                                   // la vasque
    g.add(part(G.cyl, 0x2A1E18, .54, .04, .54, 0, .86, 0));                            // les braises
    g.add(part(G.cone, fireMat, .3, .42, .3, 0, 1.06, 0));                             // les flammes
    g.add(part(G.cone, fireMat, .18, .3, .18, .1, 1.0, .05));
    g.add(part(G.cone, fireMat, .16, .26, .16, -.09, .98, -.06));
  },
  /* Le lampadaire (dehors, le long des chemins : cuivre, verre, planches) : il s'allume seul à la nuit tombée */
  lampadaire(g, m){
    g.add(part(G.cyl, C.stone2, .36, .12, .36, 0, .06, 0));                            // le socle
    g.add(part(G.cyl, m, .1, 1.8, .1, 0, 1.02, 0));                                    // le poteau
    g.add(part(G.box, CUIVRE, .3, .04, .3, 0, 1.92, 0));                               // le plateau
    const v = part(G.box, nuitMat, .22, .28, .22, 0, 2.08, 0); v.castShadow = false; g.add(v);   // le verre
    for(const x of [-.12, .12]) for(const z of [-.12, .12]) g.add(part(G.box, CUIVRE, .025, .3, .025, x, 2.08, z));
    g.add(part(G.cone4, CUIVRE, .38, .18, .38, 0, 2.31, 0));                           // le chapeau
    g.add(part(G.head, CUIVRE, .2, .2, .2, 0, 2.42, 0));
  },
  /* Le lustre (bronze et six chandelles, au plafond des grandes pièces : « éclaire toute la pièce ») */
  lustre(g, m){
    const r = part(G.tore, m, 1, 1, 1.5, 0, 1.74, 0); r.rotation.x = Math.PI / 2; g.add(r);   // la couronne
    g.add(part(G.box, m, 1.0, .03, .03, 0, 1.74, 0)); g.add(part(G.box, m, .03, .03, 1.0, 0, 1.74, 0));   // ses rayons
    g.add(part(G.cyl, m, .04, .7, .04, 0, 2.08, 0));                                   // la chaîne
    for(let k = 0; k < 6; k++){
      const a = k * Math.PI / 3, x = Math.sin(a) * .5, z = Math.cos(a) * .5;
      g.add(part(G.cyl, m, .1, .04, .1, x, 1.78, z));                                  // les coupelles
      g.add(part(G.cyl, 0xF1E6C8, .07, .18, .07, x, 1.89, z));                         // les chandelles
      const f = part(G.cone, fireMat, .06, .1, .06, x, 2.03, z); f.castShadow = false; g.add(f);
    }
  },
  /* La vitrine (étape 1.11, morceau 4 ; Grand Carnet : bois et verre) : un meuble bas, une cage de verre (le dessus
     aussi : la caméra regarde d'en haut), et la pierre exposée sur un coussin de velours */
  vitrine(g, m, o){
    const pierre = o && o.pierre;
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
/* Les petites lumières se touchent mal du doigt (la torchère murale est petite et haut sur le mur) : une boîte
   invisible autour d'elles agrandit ce qu'on peut toucher (demande de Yo, 12 octobre 2026) : [largeur, hauteur,
   profondeur, hauteur de son milieu] */
const PRISE = {chandelle:[.6, .7, .6, .3], bocalLucioles:[.6, .7, .6, .3], lanterne:[.6, 1.7, .6, .8], torchere:[.6, 1.9, .6, .9],
  torchereMurale:[.7, 1, .6, 1.35], lanterneMurale:[.7, 1, .6, 1.3], brasero:[.8, 1.3, .8, .6], lampadaire:[.6, 2.5, .6, 1.2], feuCamp:[1, .7, 1, .3]};
const INVISIBLE = new THREE.MeshBasicMaterial({visible: false}), BOITE = new THREE.BoxGeometry(1, 1, 1);
/* Une torche posée (sur une torchère) : le bâton, sa tête de fibres, sa flamme (y + .5) */
function torcheSur(g, x, y, z){
  g.add(part(G.cyl, 0x8A5A32, .06, .34, .06, x, y + .13, z));
  g.add(part(G.cyl, 0x3A2A1C, .1, .12, .1, x, y + .32, z));
  const f = part(G.cone, fireMat, .15, .28, .15, x, y + .5, z); f.castShadow = false; g.add(f);
}
/* Le modèle d'un meuble, avec la couleur choisie (une clé de COULEURS), ou sa couleur d'origine ; o : le meuble posé
   (la pierre qu'expose une vitrine, la torche posée sur une torchère) */
export function makeMeuble(type, color, o){
  const g = new THREE.Group();
  BUILD[type](g, COULEURS[color] ? COULEURS[color].hex : ORIGIN[type], o);
  if(PRISE[type]){ const [w, h, d, y] = PRISE[type], p = new THREE.Mesh(BOITE, INVISIBLE); p.scale.set(w, h, d); p.position.y = y; g.add(p); }
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
/* Un meuble (pas un tapis, ni ce qui est accroché au mur ou pend du plafond) couvre-t-il ce point de la pièce ? */
export function meubleAt(items, x, z){
  return items.some(it => {
    const m = MEUBLES[it.type];
    if(m.flat || m.mur || m.plafond) return false;
    const [w, d] = footOf(it);
    return Math.abs(x - it.x) < w/2 && Math.abs(z - it.z) < d/2;
  });
}
