/* ================= Rochers =================
   Le modèle d'un rocher, sur l'île comme à la mine : gris et arrondi (style jouet) ;
   le rocher à veines de cuivre porte des éclats orangés. r (0 à 1) fait varier la teinte et la taille.
   Étape 1.11, morceau 2 : les roches des salles de la mine (charbon, étain, granit, quartz, améthyste, argent, marbre,
   grenat, géode), chacune reconnaissable de loin : sa couleur, ses éclats ou ses cristaux.
   Morceau 4 : une pierre seule, petite, posée dans une vitrine (pierreMesh), et le Cœur de la mine, qui bat. */
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

/* ----- Une pierre seule (étape 1.11, morceau 4) : dans une vitrine, environ 0,3 P, posée à y = 0 ----- */
/* pierre → [forme, couleur, lueur (si elle brille)] */
const SEULE = {charbon: ["morceaux", 0x2E2E33], cuivre: ["pepite", CUIVRE], etain: ["pepite", 0xDCE0E6], argent: ["pepite", 0xF2F6FA, 0x9AA6B8],
  granit: ["bloc", 0xB4A49A], marbre: ["bloc", 0xF2F0EA], quartz: ["cristaux", 0xF2F6FA, 0xB8C8D8], quartzRose: ["cristaux", 0xF4B8C8, 0xC85A80],
  amethyste: ["gemme", 0xA868E0, 0x6A2AB0], grenat: ["gemme", 0xB8203E, 0x6A0A1E], citrine: ["gemme", 0xF2C440, 0xB07A10],
  oeilTigre: ["cabochon", 0xB8782A], geode: ["geode", 0x8A7A6A], coeurMine: ["coeur"]};
/* Le Cœur de la mine bat : deux battements rapprochés, puis un repos (endormi : une lueur faible, immobile) */
function coeurMesh(g, endormi){
  const m = new THREE.MeshLambertMaterial({color: endormi ? 0x8A4A4A : 0xE8403A, emissive: 0xFF4A1A, emissiveIntensity: endormi ? .1 : .6});
  const l = part(G.head, m, .45, .45, .45, -.075, .2, 0), d = part(G.head, m, .45, .45, .45, .075, .2, 0);
  const pointe = part(G.cone, m, .32, .22, .2, 0, .1, 0); pointe.rotation.z = Math.PI;
  const h = new THREE.Group(); h.add(l, d, pointe);
  h.rotation.x = -.55; h.position.z = -.06;          // penché vers l'arrière : la caméra, haute, le voit de face
  g.add(h);
  if(!endormi) l.onBeforeRender = () => {
    const t = performance.now() / 1000 % 1.1, bat = x => Math.exp(-(((t - x) / .07) ** 2));
    m.emissiveIntensity = .35 + .9 * (bat(.1) + .6 * bat(.34));
  };
}
export function pierreMesh(k, {endormi = false} = {}){
  const g = new THREE.Group(), [forme, c, e] = SEULE[k] || ["pepite", 0x9EA3A8], m = e ? brille(c, e, .35) : c;
  if(forme === "coeur") coeurMesh(g, endormi);
  else if(forme === "gemme") g.add(part(G.octa, m, .2, .28, .2, 0, .14, 0));
  else if(forme === "cristaux") POINTES.forEach(([x, , z, rz, s]) => { const p = part(G.cone4, m, .1 * s, .3 * s, .1 * s, x * .35, .14 * s, z * .35); p.rotation.z = rz * .8; g.add(p); });
  else if(forme === "bloc") g.add(part(G.dode, m, .3, .2, .26, 0, .1, 0));
  else if(forme === "morceaux") [[0, .06, 0], [.1, .05, .06], [-.09, .05, .05]].forEach(([x, y, z]) => g.add(part(G.dode, m, .13, .1, .13, x, y, z)));
  else if(forme === "cabochon"){                     // une pierre polie, dorée, à bandes
    g.add(part(G.head, m, .55, .3, .45, 0, .05, 0));
    for(const z of [-.05, .03]) g.add(part(G.box, 0xEAC46A, .2, .02, .02, 0, .1, z));
  } else if(forme === "geode"){                      // une moitié de géode, ouverte sur ses cristaux violets
    g.add(part(G.head, m, .7, .55, .7, 0, .06, 0));
    g.add(part(G.cyl, 0x3A2E46, .26, .02, .26, 0, .13, 0));
    [[-.05, 0], [.04, .04], [.02, -.05]].forEach(([x, z]) => g.add(part(G.cone4, brille(0xB48CE8, 0x7A4AC8, .7), .05, .09, .05, x, .17, z)));
  } else {                                          // une pépite : un caillou gris piqué d'éclats de sa couleur
    g.add(part(G.dode, 0x9EA3A8, .24, .18, .24, 0, .09, 0));
    [[.08, .14, .06], [-.07, .15, .04], [.01, .17, -.07]].forEach(([x, y, z]) => g.add(part(G.dode, m, .09, .07, .09, x, y, z)));
  }
  return g;
}
