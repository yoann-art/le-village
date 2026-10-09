/* ================= Rochers =================
   Le modèle d'un rocher, sur l'île comme à la mine : gris et arrondi (style jouet) ;
   le rocher à veines de cuivre porte des éclats orangés. r (0 à 1) fait varier la teinte et la taille.
   Étape 1.11, morceau 2 : les roches des salles de la mine (charbon, étain, granit, quartz, améthyste, argent, marbre,
   grenat, géode), chacune reconnaissable de loin : sa couleur, ses éclats ou ses cristaux. */
import { G, part } from "./formes.js";

const CUIVRE = 0xD9822B;
const ECLATS = [[.3,.3,.18],[-.22,.4,.25],[.05,.52,-.2],[-.3,.22,-.15],[.18,.18,.34]];
const POINTES = [[0, .55, 0, 0, 1], [.24, .42, .12, .5, .75], [-.2, .44, -.1, -.45, .7], [.06, .4, -.26, .2, .6]];
const glow = {};
const brille = (c, e, f = .55) => glow[c] || (glow[c] = new THREE.MeshLambertMaterial({color: c, emissive: e, emissiveIntensity: f}));
/* sorte → {base (la roche), eclats (des éclats de cette couleur), pointes (des cristaux), bloc (taillé), boule} */
const SORTES = {
  rockCuivre:   {eclats: CUIVRE},
  rockCharbon:  {base: 0x55555C, eclats: 0x1E1E22},
  rockEtain:    {eclats: 0xDCE0E6},
  rockGranit:   {bloc: 0xB4A49A, points: 0x5E544E},
  rockQuartz:   {pointes: 0xF2F6FA},
  rockAmethyste:{pointes: () => brille(0xA868E0, 0x6A2AB0, .45)},
  rockArgent:   {eclats: () => brille(0xF2F6FA, 0x9AA6B8, .35)},
  rockMarbre:   {bloc: 0xF2F0EA, points: 0x9A9690},
  rockGrenat:   {pointes: () => brille(0xB8203E, 0x6A0A1E, .45)},
  rockGeode:    {boule: 0x8A7A6A, coeur: () => brille(0xB48CE8, 0x7A4AC8, .7)}
};
export function rockMesh(type, r){
  const g = new THREE.Group(), s = SORTES[type] || {}, mat = c => typeof c === "function" ? c() : c;
  if(s.bloc){                                        // une grosse roche arrondie, de sa couleur, piquetée ou veinée
    g.add(part(G.dode, s.bloc, 1, .78, .95, 0, .3, 0));
    [[.32, .38, .3], [-.25, .25, .36], [.08, .62, .12], [-.36, .48, -.12], [.44, .22, -.05], [-.05, .4, .42], [.2, .55, -.3]]
      .forEach(([x, y, z], k) => { const p = part(G.box, s.points, k % 2 ? .16 : .09, .05, .05, x, y, z); p.rotation.set(k * .7, k * 1.3, k * .5); g.add(p); });
  } else if(s.boule){                                // une géode : une boule de roche fendue, des cristaux dans la fente
    g.add(part(G.dode, s.boule, .75, .7, .75, 0, .33, 0));
    g.add(part(G.box, 0x2E2438, .5, .1, .06, 0, .42, .34));
    [[-.12, 0], [0, .06], [.12, 0]].forEach(([x, dy]) => g.add(part(G.cone4, mat(s.coeur), .08, .16, .05, x, .44 + dy, .37)));
  } else {
    g.add(part(G.dode, s.base || (r < .5 ? 0x9EA3A8 : 0x8F959B), .9,.7,.9, 0,.25,0));
    if(s.eclats) ECLATS.forEach(([x, y, z]) => g.add(part(G.dode, mat(s.eclats), .24, .17, .24, x, y, z)));
    if(s.pointes) POINTES.forEach(([x, y, z, rz, k]) => { const c = part(G.cone4, mat(s.pointes), .22 * k, .6 * k, .22 * k, x, y + .1 * k, z); c.rotation.z = rz; g.add(c); });
  }
  g.scale.setScalar(.8 + r*.4);
  return g;
}
