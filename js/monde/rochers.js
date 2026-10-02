/* ================= Rochers =================
   Le modèle d'un rocher, sur l'île comme à la mine : gris et arrondi (style jouet) ;
   le rocher à veines de cuivre porte des éclats orangés. r (0 à 1) fait varier la teinte et la taille. */
import { G, part } from "./formes.js";

const CUIVRE = 0xD9822B;
export function rockMesh(type, r){
  const g = new THREE.Group();
  g.add(part(G.dode, r < .5 ? 0x9EA3A8 : 0x8F959B, .9,.7,.9, 0,.25,0));
  if(type === "rockCuivre"){
    [[.3,.3,.18],[-.22,.4,.25],[.05,.52,-.2],[-.3,.22,-.15],[.18,.18,.34]].forEach(([x, y, z]) =>
      g.add(part(G.dode, CUIVRE, .24, .17, .24, x, y, z)));
  }
  g.scale.setScalar(.8 + r*.4);
  return g;
}
