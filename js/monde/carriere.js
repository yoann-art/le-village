/* ================= La Carrière, niveau 1 =================
   D'après l'image de Yo (29 octobre 2026 : « Voici la carrière de niveau 1 », faite avec le prompt refait à ciel ouvert :
   Yo, d'une entrée de galerie, « ce troue fait défaut au jeu car il y aura la mine »), au plus près de l'image, avec ses
   choix : « La taille en 5 × 5 », la porte à droite comme sur l'image (« d'accord »), « La lanterne s'allume la nuit ».
   Une carrière à ciel ouvert : derrière et à gauche, un grand front de roche claire taillé en marches, ses faces droites et
   ses traits de découpe, des coins de bois enfoncés dans deux fentes, des éclats au pied ; devant à gauche, des blocs
   taillés empilés sur leurs cales de bois ; à droite, la cabane de planches, son toit à deux pentes en larges planches
   cloutées, sa porte de planches aux pentures de fer et à l'anneau, ses deux marches de pierre ; contre son mur, la pioche
   et le seau cerclé de fer ; à droite de la porte, la lanterne de fer sur sa potence ; le tout sur une plaque de sable.
   Coordonnées : le milieu du carré de 5 × 5 en (0, 0), la façade de la cabane en z = FACADE, la porte en x = PORTE_X
   (B.carriere.door). Aucun trou ni tunnel : la mine reste à part. */
import { G, part, toon } from "./formes.js";
import { lanterne } from "./ciel.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const FACADE = 1.7, PORTE_X = 1.3;
const BOIS = [0xD9963E, 0xE3A24A, 0xCC8A36], CLAIR = 0xEDB866, FONCE = 0xA86A2C, PORTE_C = 0xB0702E, FER = 0x4A4A52, CLOU = 0x5A5A62,
  ROCHE = [0xBDB2A0, 0xB3A895, 0xC6BCAB, 0xA99E8C], ROCHE_S = 0x8E8474, SABLE = 0xDDBE84, SABLE_S = 0xCDAA72;
/* la lanterne : elle brille plus fort la nuit (ciel.js) */
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
lanterne(null, 0, 0, LUEUR);

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
const ton = k => BOIS[((k * 7) % 3 + 3) % 3];
/* un bloc de pierre aux arêtes adoucies (une boîte aux coins ronds) */
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(10, 8, .28), CAILLOU = new THREE.IcosahedronGeometry(.5, 0);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0) => { const m = ajoute(g, part(BLOC, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 11;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;

/* le sable : une plaque claire aux bords doux, un peu plus sombre au pied de la roche */
function sable(g){
  const m = ajoute(g, part(G.cyl, SABLE, 4.9, .05, 4.7, 0, .025, .05)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 3.2, .052, 1.8, -.6, .027, -.4)); s.receiveShadow = true; s.castShadow = false;
}
/* le front de roche, taillé en marches : chaque marche, des rangs de gros blocs aux faces droites ; les traits de découpe
   entre eux (des joints plus sombres) ; deux coins de bois enfoncés dans les fentes ; des éclats au pied de chaque marche */
function roche(g){
  /* [z du devant de la marche, sa profondeur, sa hauteur, de x0 à x1] : du fond (la plus haute) vers l'avant */
  const MARCHES = [[-1.55, .9, 2.15, -2.2, 1.9], [-.7, .85, 1.5, -2.45, -.15], [.1, .8, .82, -2.4, -.55]];
  MARCHES.forEach(([zf, prof, haut, x0, x1], m) => {
    const rangs = Math.max(1, Math.round(haut / .72)), hr = haut / rangs;
    for(let r = 0; r < rangs; r++){
      let x = x0;
      while(x < x1 - .1){
        const l = Math.min(x1 - x, .62 + hasard() * .4), c = x + l / 2, hex = ROCHE[Math.floor(hasard() * 4)];
        const bord = Math.min(c - x0, x1 - c) < .5, dh = r === rangs - 1 ? (hasard() - .5) * .3 - (bord ? .35 : 0) : 0;   // le dessus irrégulier, plus bas sur les bords
        const hh = hr - .04 + dh, y = r * hr + hh / 2 + .02;
        bloc(g, hex, l - .04, hh, prof - hasard() * .08, c, y, zf - prof / 2 - hasard() * .04, (hasard() - .5) * .05);
        x += l;
      }
    }
    boite(g, ROCHE_S, x1 - x0 - .3, haut - .3, prof - .14, (x0 + x1) / 2, (haut - .3) / 2, zf - prof / 2);   // le coeur, qui comble les joints
    /* au pied de la marche, des éclats */
    for(let k = 0; k < 7; k++){ const s = .07 + hasard() * .09;
      const p = ajoute(g, part(CAILLOU, ROCHE[k % 4], s * 1.3, s, s * 1.2, x0 + .2 + hasard() * (x1 - x0 - .4), m === 0 ? haut * 0 + 1.55 + s * .4 : s * .4, zf + .08 + hasard() * .2));
      p.rotation.set(hasard() * 3, hasard() * 3, 0);
      if(m === 0) p.position.y = MARCHES[1][2] + s * .4;                    // sur la marche du milieu
      if(m === 1) p.position.y = MARCHES[2][2] + s * .4;                    // sur la marche de devant
    }
  });
  /* les coins de bois enfoncés dans deux fentes, sur les marches du fond et du milieu */
  for(const [x, y, z] of [[-.45, 1.9, -1.53], [-.45, 1.55, -1.53], [-.95, 1.15, -.68], [-.95, .8, -.68]]){
    boite(g, FONCE, .1, .22, .1, x, y, z); boite(g, CLAIR, .14, .06, .12, x, y + .1, z + .01);
  }
  boite(g, ROCHE_S, .05, .9, .03, -.45, 1.6, -1.53);                                        // la fente du fond
  boite(g, ROCHE_S, .05, .75, .03, -.95, .95, -.68);                                        // la fente du milieu
}
/* devant à gauche, les blocs taillés empilés sur leurs cales de bois, et un bloc seul devant */
function blocs(g){
  for(const z of [1.05, 1.6]) boite(g, FONCE, 1.25, .08, .12, -1.6, .09, z);
  bloc(g, ROCHE[2], .58, .45, .5, -1.9, .36, 1.32); bloc(g, ROCHE[0], .58, .45, .5, -1.3, .36, 1.32);
  bloc(g, ROCHE[1], .58, .42, .5, -1.62, .8, 1.3);
  bloc(g, ROCHE[3], .62, .34, .36, -1.75, .2, 2.12, .1);
  for(let k = 0; k < 16; k++){ const s = .06 + hasard() * .08;
    const p = ajoute(g, part(CAILLOU, ROCHE[k % 4], s * 1.3, s, s * 1.2, -1.1 + hasard() * 1.4, s * .4, 1.75 + hasard() * .7)); p.rotation.set(hasard() * 3, hasard() * 3, 0); }
}
/* la cabane : murs de planches debout entre des poteaux d'angle, le pignon de planches, le toit à deux pentes en larges
   planches cloutées et ses traverses, le faîte et ses deux blocs ; la porte et ses marches */
const CX = 1.12, X0 = -.05, X1 = 2.3, Z0 = -.05, HM = 1.45, HR = .9;
function cabane(g){
  const W = X1 - X0, D = FACADE - Z0, n = Math.round(W / .26), l = W / n;
  for(let k = 0; k < n; k++){                                                          // la façade et l'arrière
    const x = X0 + (k + .5) * l;
    if(Math.abs(x - PORTE_X) > .44) boite(g, ton(k), l - .025, HM, .1, x, HM / 2, FACADE);
    else boite(g, ton(k), l - .025, HM - 1.3, .1, x, 1.3 + (HM - 1.3) / 2, FACADE);
    boite(g, ton(k + 1), l - .025, HM, .1, x, HM / 2, Z0);
  }
  const nz = Math.round(D / .26), lz = D / nz;
  for(let k = 0; k < nz; k++) for(const x of [X0, X1]) boite(g, ton(k + 2), .1, HM, lz - .025, x, HM / 2, Z0 + (k + .5) * lz);   // les côtés
  for(const x of [X0, X1]) for(const z of [Z0, FACADE]) boite(g, FONCE, .18, HM + .04, .18, x, (HM + .04) / 2, z);              // les poteaux d'angle
  boite(g, FONCE, W + .2, .14, .16, CX, HM - .04, FACADE + .03);                          // la poutre du haut
  boite(g, FONCE, W + .1, .12, .14, CX, .76, FACADE + .03);                               // la traverse du milieu
  /* le pignon : des planches debout, de plus en plus courtes */
  for(let k = 0; k < n; k++){ const x = X0 + (k + .5) * l, h = HR * (1 - Math.abs(x - CX) / (W / 2 + .12)) - .02;
    if(h > .04) for(const z of [FACADE, Z0]) boite(g, ton(k + 1), l - .025, h, .08, x, HM + h / 2, z); }
  /* le toit : sur chaque pente, cinq larges planches cloutées qui descendent du faîte, deux traverses, les clous */
  const demi = W / 2 + .22, a = Math.atan2(HR, W / 2), L = demi / Math.cos(a), z0 = Z0 - .25, z1 = FACADE + .3, sommet = HM + HR + .06;
  for(const s of [-1, 1]){
    const np = 5, wp = (z1 - z0) / np;
    for(let k = 0; k < np; k++){
      const z = z0 + (k + .5) * wp, decal = (k % 2) * .05;
      planche(g, ton(k + (s > 0 ? 1 : 0)), L + decal, .08, wp - .03, CX + s * Math.cos(a) * (L / 2), sommet - Math.sin(a) * (L / 2) + .02, z, 0, 0, -s * a);
      for(const t of [.22, .78]) ajoute(g, part(G.head, CLOU, .07, .04, .07, CX + s * Math.cos(a) * L * t, sommet - Math.sin(a) * L * t + .08, z));
    }
    for(const t of [.3, .75]) planche(g, FONCE, .14, .07, z1 - z0 + .06, CX + s * Math.cos(a) * L * t, sommet - Math.sin(a) * L * t + .09, (z0 + z1) / 2, 0, 0, -s * a);
  }
  boite(g, FONCE, .22, .2, z1 - z0 + .1, CX, sommet + .06, (z0 + z1) / 2);                   // le faîte
  for(const z of [z0 - .02, z1 + .02]) boite(g, CLAIR, .3, .26, .16, CX, sommet + .04, z);   // ses deux blocs
  for(const z of [z0 - .1, z1 + .1]) ajoute(g, part(G.head, CLOU, .08, .08, .04, CX, sommet + .06, z));
  g.userData.toit = sommet + .2;
}
/* la porte : quatre planches, deux pentures de fer et leurs clous, l'anneau, son cadre ; deux marches de pierre */
function porte(g){
  const z = FACADE + .08, w = .8, h = 1.25;
  for(let k = 0; k < 4; k++) boite(g, k % 2 ? PORTE_C : 0xA0642A, w / 4 - .015, h, .06, PORTE_X - w / 2 + (k + .5) * w / 4, h / 2 + .05, z);
  for(const y of [.35, 1.05]){ boite(g, FER, w * .72, .08, .03, PORTE_X - .02, y, z + .05);
    for(const x of [-.3, -.05, .2]) ajoute(g, part(G.head, CLOU, .045, .045, .03, PORTE_X + x, y, z + .07)); }
  ajoute(g, part(G.tore, FER, .18, .18, .26, PORTE_X + .24, .72, z + .07));
  ajoute(g, part(G.cyl, FER, .07, .03, .07, PORTE_X + .24, .8, z + .05)).rotation.x = Math.PI / 2;
  for(const s of [-1, 1]) boite(g, FONCE, .1, h + .1, .1, PORTE_X + s * (w / 2 + .05), (h + .1) / 2, FACADE + .06);
  boite(g, FONCE, w + .3, .12, .14, PORTE_X, h + .12, FACADE + .07);
  bloc(g, ROCHE[2], 1.05, .14, .42, PORTE_X, .07, FACADE + .33); bloc(g, ROCHE[0], .9, .12, .3, PORTE_X + .05, .17, FACADE + .2);
}
/* contre le mur, à gauche de la porte : la pioche appuyée et le seau de bois cerclé de fer */
function outils(g){
  const xp = .32, zp = FACADE + .12;
  planche(g, 0xB06A2A, .07, 1.05, .07, xp, .52, zp, -.05, 0, -.28);                         // le manche, penché contre le mur
  const tete = new THREE.Group(); tete.position.set(xp + .15, 1.02, zp + .02); tete.rotation.z = -.28; g.add(tete);
  for(const s of [-1, 1]) planche(tete, FER, .32, .07, .06, s * .16, -.02 - .03, 0, 0, 0, s * .32);
  boite(tete, FER, .1, .12, .08, 0, 0, 0);
  const xs = .78, zs = FACADE + .26, r = .2, hs = .36;
  for(let k = 0; k < 10; k++){ const an = k / 10 * Math.PI * 2;                               // les douelles
    planche(g, ton(k), .13, hs, .04, xs + Math.sin(an) * r, hs / 2 + .03, zs + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, 0x9A5A26, r * 2, .04, r * 2, xs, .06, zs));
  for(const y of [.1, .3]){ const c = ajoute(g, part(G.tore, FER, r * 2.1, r * 2.1, .5, xs, y, zs)); c.rotation.x = Math.PI / 2; }
  const anse = ajoute(g, part(G.tore, FER, .4, .4, .3, xs, hs, zs)); anse.rotation.y = Math.PI / 2; anse.scale.set(.4, .4, .3);
}
/* à droite de la porte : la potence de bois et la lanterne de fer qui pend, qui brille la nuit */
function lanterneCabane(g){
  const x = 1.98, y = 1.1, z = FACADE + .05;
  boite(g, FONCE, .1, .1, .36, x, y + .36, z + .15);
  planche(g, FONCE, .06, .3, .06, x, y + .22, z + .06, .7, 0, 0);
  boite(g, FER, .03, .12, .03, x, y + .26, z + .3);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .16, z + .3)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .3));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .3 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .3);
}
export function carriereNiveau1(g){
  alea = 11;
  sable(g);
  roche(g);
  blocs(g);
  cabane(g);
  porte(g);
  outils(g);
  lanterneCabane(g);
}
