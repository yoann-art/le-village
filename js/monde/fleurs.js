/* ================= Les fleurs en 3D (étape 1.9, morceau 4) =================
   Une touffe de feuilles et trois tiges (une seule, grande, pour le tournesol), en formes simples et rondes (style
   jouet). Selon son état : une pousse, des feuilles (jeune, pas sa saison, ou cueillie qui refleurit), ou en fleur,
   à sa couleur. Le dessin de la fleur selon sa forme (FLEURS dans donnees.js) : etoile (pétales en disque et coeur),
   coupe (tulipe, coquelicot), boule (rose, pissenlit), epi (lavande), clochette (muguet, perce-neige). */
import { G, part } from "./formes.js";
import { FLEURS } from "../donnees.js";

const VERT = 0x5E9E4A, FEUILLE = 0x5A9A48;
function tete(g, f, c, x, y, z){
  const s = f.taille > 1 ? 2.2 : 1;
  if(f.forme === "etoile"){
    const disque = part(G.cyl, c, .3 * s, .025, .3 * s, x, y, z); disque.rotation.x = -.35; g.add(disque);
    g.add(part(G.head, f.coeur || 0xF2C94C, .45 * s, .28 * s, .45 * s, x, y + .02, z - .01));
  } else if(f.forme === "coupe"){
    const coupe = part(G.cone, c, .2, .2, .2, x, y + .08, z); coupe.rotation.x = Math.PI; g.add(coupe);
    if(f.coeur) g.add(part(G.head, f.coeur, .25, .15, .25, x, y + .17, z));
  } else if(f.forme === "boule") g.add(part(G.head, c, .55, .5, .55, x, y + .05, z));
  else if(f.forme === "epi") for(let k = 0; k < 4; k++) g.add(part(G.head, c, .26, .32, .26, x, y - .03 + k * .07, z));
  else {                                                                      // des clochettes qui pendent
    g.add(part(G.cyl, VERT, .02, .12, .02, x + .05, y + .02, z));
    for(const [dx, dy] of [[.08, -.04], [.12, -.11], [.05, -.16]]) g.add(part(G.head, c, .22, .26, .22, x + dx, y + dy, z));
  }
}
/* etat : 0 une pousse, 1 des feuilles, 2 en fleur */
export function fleurModele(k, couleur, etat){
  const f = FLEURS[k], g = new THREE.Group(), h = f.taille;
  if(etat === 0){ g.add(part(G.leaf2, VERT, .45, .35, .45, 0, .06, 0)); return g; }
  g.add(part(G.leaf2, FEUILLE, .85, .4, .85, 0, .08, 0));
  const tiges = h > 1 ? [[0, 0, 1]] : [[0, 0, 1], [.15, .1, .8], [-.13, .12, .85]];
  for(const [x, z, m] of tiges){
    const hh = h * m;
    g.add(part(G.cyl, VERT, h > 1 ? .07 : .03, hh, h > 1 ? .07 : .03, x, hh / 2, z));
    if(etat === 2) tete(g, f, couleur, x, hh, z);
  }
  return g;
}
