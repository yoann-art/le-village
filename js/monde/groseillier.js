/* ================= Le groseillier (le buisson de baies de l'île) =================
   Étape 2.1, morceau 3 ; ses deux images : Yo, 16 octobre 2026 (Desktop\Hearthwild\images\decor\groseillier.png et
   groseillier-cueilli.png), au plus près : un buisson tout rond d'environ 1 P de haut posé sur un petit tas de terre fait de
   mottes rondes, entouré de petites feuilles ; quatre ou cinq tiges brunes qui partent du pied et s'écartent ; une boule de
   grandes feuilles à cinq lobes ronds, au bord festonné, vert tendre et vert-jaune, les nervures claires ; tout autour, des
   grappes de groseilles rouges, translucides et brillantes, qui pendent au bout de fines tiges vert-jaune, plus grosses en
   haut de la grappe ; cueilli, les mêmes tiges vides, de petits boutons ocre au bout de leurs pédoncules.
   Les saisons (faites par le jeu) : vert tendre au printemps, comme l'image l'été, jaune et orangé en automne, vert givré
   l'hiver (il garde ses feuilles : ses groseilles se cueillent toute l'année, avec l'arrosoir ou la pluie) ; de la neige
   sur le dessus quand il neige. Jeune (planté), plus petit et sans grappes ; une pousse, trois petites feuilles.
   Pour le téléphone : un modèle par (stade, saison, état, nuance, neige), partagé ; au-delà de LOIN P du personnage, un
   modèle léger (moins de feuilles, des grappes de trois baies simples) ; l'ombre au sol vient d'une boule invisible. */
import { fusionner, feuillageMat } from "./formes.js";
import { aleaDe, segment, BOULE, BOULE_BAS, BOSSE, NEIGE_GEO, MAT_BOIS, MAT_OMBRE, mesh, presLoin } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion(), HAUT = V(0, 1, 0), Z = V(0, 0, 1);
const LOIN = 6;
/* les tons des feuilles : [clair, moyen, sombre, très clair] ; trois nuances par saison */
const TONS = {
  printemps: [[0xAAD652, 0x7CBA40, 0x4C8E2C, 0xC6E670], [0xA2D04C, 0x76B43C, 0x488A2A, 0xBEE06A], [0xB2DA58, 0x82C044, 0x52942E, 0xCCEA76]],
  ete:       [[0x9CC23E, 0x5E9A34, 0x3A7424, 0xBCD45C], [0x94BC3A, 0x589430, 0x366E22, 0xB4CE56], [0xA4C844, 0x64A038, 0x3E7A28, 0xC2DA62]],
  automne:   [[0xE2BC3C, 0xD2902E, 0x9A6A22, 0xF0D458], [0xDCB038, 0xC8822A, 0x92621E, 0xEACA50], [0xE8C442, 0xD89A32, 0xA27226, 0xF4DA60]],
  hiver:     [[0x8EB098, 0x6E947A, 0x4E7058, 0xA8C4AE], [0x88AA92, 0x688E74, 0x486A52, 0xA2BEA8], [0x94B69E, 0x749A80, 0x54765E, 0xAECAB4]]
};
const BOIS = 0x8C5A30, BOIS_CLAIR = 0xA46C3A, TIGE = 0xA8A43A, TIGE_VIDE = 0xB8963C, BOUTON = 0x8E6A2E;
const TERRE = [0x9E602E, 0xAE6E38, 0x8C5428, 0xBA7A40], ROUGE = new THREE.Color(0xA80A14), ORANGE = new THREE.Color(0xF2501E);

/* ---------- la feuille ---------- */
/* La feuille du groseillier : large, cinq lobes ronds (trois grands, deux petits près de la queue), le bord festonné,
   échancrée en coeur à la queue ; bombée (le bord retombe) ; les nervures plus claires vont de la queue au bout de chaque
   lobe, le coeur un peu sombre (l'attribut « teinte »). Centrée au milieu, le bout vers +y, à plat dans le plan xy, bombée
   vers +z ; environ 0,8 de large et 0,8 de long */
const LOBES = [[0, 1, .6], [1.22, .9, .54], [-1.22, .9, .54], [2.3, .64, .44], [-2.3, .64, .44]];   // [angle depuis le bout, longueur, largeur]
function bord(a){
  let r = .48;
  for(const [c, l, w] of LOBES){ const d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); r = Math.max(r, .48 + (l - .48) * Math.exp(-((d / w) ** 2))); }
  const coeur = Math.exp(-(((Math.PI - Math.abs(a)) / .3) ** 2));       // l'échancrure, à la queue
  return r * (1 - .55 * coeur) * (1 + .06 * Math.cos(a * 18));         // le bord festonné
}
function feuilleGeo(n, anneaux){
  const pos = [0, -.04, .065], te = [.84], ind = [];
  anneaux.forEach((rr, j) => {
    for(let k = 0; k < n; k++){
      const a = -Math.PI + (k + .5) / n * 2 * Math.PI, b = bord(a) * rr * .5;
      const nerv = LOBES.some(([c]) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < Math.PI / n * 1.1);
      const y = Math.cos(a) * b - .04, clair = .9 + .2 * (y + .3);           // la queue à l'ombre, le bout des lobes dans la lumière
      pos.push(Math.sin(a) * b, y, .065 * (1 - rr * rr) - .02 * rr);
      te.push((rr < 1 ? (nerv ? 1.06 : .95) : (nerv ? 1.04 : 1.0)) * clair);
    }
  });
  for(let k = 0; k < n; k++){ const a = 1 + k, b = 1 + (k + 1) % n; ind.push(0, b, a); }
  for(let j = 1; j < anneaux.length; j++) for(let k = 0; k < n; k++){
    const a = 1 + (j - 1) * n + k, b = 1 + (j - 1) * n + (k + 1) % n, c = a + n, d = b + n;
    ind.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  if(g.attributes.normal.getZ(0) < 0){                    // tournée vers +z
    for(let i = 0; i < ind.length; i += 3){ const t = ind[i + 1]; ind[i + 1] = ind[i + 2]; ind[i + 2] = t; }
    g.setIndex(ind); g.computeVertexNormals();
  }
  return g;
}
const FEUILLE = feuilleGeo(22, [.5, 1]), FEUILLE_PIED = feuilleGeo(14, [1]), FEUILLE_LEGERE = feuilleGeo(10, [1]);

/* ---------- la forme ---------- */
const C = V(0, .64, 0), RX = .47, RY = .45;                  // la boule de feuilles (le buisson fait environ 1,06 P de haut)
const DISQUE6 = new THREE.CircleGeometry(1, 6);
const BAIE = new THREE.SphereGeometry(1, 5, 4), BAIE_LEGERE = new THREE.SphereGeometry(1, 5, 3), BOUTON_GEO = new THREE.SphereGeometry(1, 4, 2);
const REFLET = V(-.35, .62, .7).normalize();
/* la lumière peinte sur la boule : le creux et le dessous plus sombres, le dessus et le bord plus clairs */
const radiale = (x, y, z, n0) => { const v = V(x - C.x, (y - C.y) * RX / RY, z - C.z).normalize(); return n0 ? v.multiplyScalar(.55).add(n0.clone().multiplyScalar(.45)).normalize() : v; };
const ombre = (x, y, z) => {
  const d = Math.hypot((x - C.x) / RX, (y - C.y) / RY, (z - C.z) / RX), dessus = (y - C.y) / RY;
  return Math.min(1.14, Math.max(.42, .5 + .46 * Math.min(1, Math.max(0, (d - .6) / .45)) + .2 * dessus));
};
const surBoule = (nrm, k = 1) => V(C.x + nrm.x * RX * k, C.y + nrm.y * RY * k, C.z + nrm.z * RX * k);
const normaleBoule = nrm => V(nrm.x / RX, nrm.y / RY, nrm.z / RX).normalize();

/* le pied : le petit tas de terre en mottes rondes, ses petites feuilles ; les tiges brunes qui s'écartent, et dans la
   boule, leurs branches */
function boisDe(alea, leger){
  const M = [];
  M.push({geo: BOSSE, m: new THREE.Matrix4().compose(V(0, 0, 0), Q, V(.33, .075, .33)), c: TERRE[0], ombre: (x, y) => .9 + y * 2});
  const nm = leger ? 6 : 16;
  for(let k = 0; k < nm; k++){
    const a = k / nm * Math.PI * 2 + alea() * .3, d = .26 + alea() * .08, s = .05 + alea() * .025;
    M.push({geo: BOSSE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .018, Math.sin(a) * d), Q, V(s * 1.2, s * .7, s)), c: TERRE[k % 4], ombre: (x, y) => .82 + y * 4});
  }
  for(let k = 0; k < 5; k++){
    const a = k / 5 * Math.PI * 2 + alea() * .5, e = .032 + alea() * .01;
    const A = V(Math.cos(a) * .04, .03, Math.sin(a) * .04), B = V(Math.cos(a) * .12, .19, Math.sin(a) * .12), T = V(Math.cos(a + .2) * .25, .4 + alea() * .06, Math.sin(a + .2) * .25);
    M.push({...segment(A, B, e, e * .85, leger ? 5 : 7), c: k % 2 ? BOIS : BOIS_CLAIR}, {...segment(B, T, e * .85, e * .55, leger ? 5 : 7), c: k % 2 ? BOIS : BOIS_CLAIR});
    M.push({geo: BOSSE, m: new THREE.Matrix4().compose(B, Q, V(e * .85, e * .85, e * .85)), c: k % 2 ? BOIS : BOIS_CLAIR});
    if(!leger){                                           // dans la boule, la branche continue vers le haut
      const H = surBoule(V(Math.cos(a + .3) * .7, .55, Math.sin(a + .3) * .7).normalize(), .78);
      M.push({...segment(T, H, e * .55, e * .25, 5), c: BOIS});
    }
  }
  return fusionner(M);
}
/* les petites feuilles du pied, couchées sur la terre et relevées vers l'extérieur */
function piedFeuilles(M, tons, alea, leger){
  const n = leger ? 8 : 26;
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2 + alea() * .4, d = .1 + alea() * .16, h = V(Math.cos(a), 0, Math.sin(a));
    const P = V(h.x * d, .085 + alea() * .03, h.z * d), Nf = h.clone().multiplyScalar(-.75).add(V(0, 1, 0)).normalize();
    feuilleSur(M, P, Nf, h, .17 + alea() * .06, tons[k % 3 === 0 ? 0 : k % 3 === 1 ? 1 : 2], leger, 0, false);
  }
}
/* une feuille posée en P, tournée vers Nf, le bout vers T (projeté sur son plan), de taille s */
function feuilleSur(M, P, Nf, T0, s, c, leger, tourne = 0, boule = true, lev = 0, roule = 0){
  const T = T0.clone().sub(Nf.clone().multiplyScalar(T0.dot(Nf)));
  if(T.lengthSq() < 1e-4) T.set(1, 0, 0);
  T.normalize().applyAxisAngle(Nf, tourne || 0);
  if(lev){ const t2 = T.clone(); T.multiplyScalar(Math.cos(lev)).add(Nf.clone().multiplyScalar(Math.sin(lev))); Nf = Nf.clone().multiplyScalar(Math.cos(lev)).sub(t2.multiplyScalar(Math.sin(lev))); }   // le bout se soulève de la boule
  if(roule) Nf = Nf.clone().applyAxisAngle(T, roule);    // et penche sur un côté : chaque feuille attrape la lumière à sa façon
  const X = new THREE.Vector3().crossVectors(T, Nf).normalize();
  const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s), T.multiplyScalar(s), Nf.clone().multiplyScalar(s)).setPosition(P);
  M.push(boule ? {geo: leger ? FEUILLE_LEGERE : FEUILLE, m, c, normale: radiale, ombre} : {geo: leger ? FEUILLE_LEGERE : FEUILLE_PIED, m, c, ombre: (x, y) => .78 + y * 1.5});
}
/* la boule de feuilles : un coeur sombre, une couche de feuilles dedans, puis les grandes feuilles de dessus, qui se
   chevauchent ; celles du haut regardent le ciel, celles des côtés pointent vers l'extérieur et retombent un peu */
function feuillageDe(tons, alea, nb, leger){
  const M = [];
  M.push({geo: leger ? BOULE_BAS : BOULE, m: new THREE.Matrix4().compose(C.clone().add(V(0, -.02, 0)), Q, V(RX * .9, RY * .88, RX * .9)), c: new THREE.Color(tons[1]).multiplyScalar(.7).getHex(), normale: radiale, ombre});
  const couches = leger ? [[nb, 1]] : [[Math.round(nb * .3), .86], [nb, 1]];   // une couche dedans (le creux), puis la grande couche
  for(const [n, k0] of couches) for(let k = 0; k < n; k++){
    const t = (k + .5) / n, yy = 1 - t * 1.66, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = k * 2.39996 + alea() * .5;
    const nrm = V(Math.cos(a + k0 * 1.7) * rr, yy, Math.sin(a + k0 * 1.7) * rr), ne = normaleBoule(nrm);
    const bosses = 1 + .09 * Math.sin(a * 3 + 1) * Math.cos(yy * 4.5) + .05 * Math.sin(a * 5 + yy * 7);   // une boule irrégulière, pas une haie taillée
    const prof = k0 < 1 ? k0 : .88 + alea() * .2;            // chaque feuille à sa profondeur : celles du fond plus sombres
    const P = surBoule(nrm, prof * bosses);
    const Nf = ne.clone().add(V(0, .22, 0)).normalize();                // couchée sur la boule, comme une écaille
    const h = rr > .15 ? V(nrm.x, 0, nrm.z).normalize() : V(Math.cos(a), 0, Math.sin(a));
    const T0 = yy > .75 ? V(Math.cos(a * 7), 0, Math.sin(a * 7)) : h.clone().multiplyScalar(.4).add(HAUT);   // le bout vers le haut ; dessus, dans tous les sens
    const p = alea(), c = k0 < 1 ? tons[2] : yy > .35 ? tons[p < .4 ? 0 : p < .65 ? 3 : 1] : tons[p < .4 ? 1 : p < .65 ? 0 : p < .85 ? 2 : 3];
    const taille = ((k0 < 1 ? .3 : .32) + alea() * .09 + (leger ? .06 : 0)) * (1 - .25 * Math.max(0, yy - .55) / .45);   // grandes, un peu plus petites sur le dessus
    feuilleSur(M, P, Nf, T0, taille, c, leger, (alea() - .5) * 1.7, true, k0 < 1 ? 0 : yy > .7 ? alea() * .12 : -.12 + alea() * .5, k0 < 1 ? 0 : (alea() - .5) * (yy > .7 ? .4 : 1.0));   // sur le dessus, elles restent couchées
  }
  return M;
}
/* un point de grappe poussé hors de la boule de feuilles (à sa hauteur), pour que la grappe pende devant les feuilles */
function dehors(P, marge){
  const dy = (P.y - C.y) / RY, rh = RX * Math.sqrt(Math.max(0, 1 - dy * dy)) * 1.04 + marge, d = Math.hypot(P.x - C.x, P.z - C.z);
  if(d < rh && d > 1e-4){ P.x = C.x + (P.x - C.x) * rh / d; P.z = C.z + (P.z - C.z) * rh / d; }
  return P;
}
/* une grappe : la fine tige qui sort de la boule et retombe, puis les groseilles (ou, cueillie, les pédoncules vides et
   leurs petits boutons ocre), plus grosses en haut de la grappe */
function grappe(M, A, h, alea, vide, leger){
  const L = .21 + alea() * .09, nb = leger ? 3 : 9 + Math.floor(alea() * 4), r0 = .032 + alea() * .004;
  const S1 = A.clone().add(h.clone().multiplyScalar(.08)).add(V(0, -.015, 0));
  const fin = S1.clone().add(h.clone().multiplyScalar(.035)).add(V(0, -L, 0));
  const tige = t => dehors(S1.clone().lerp(fin, t).add(h.clone().multiplyScalar(.02 * Math.sin(t * Math.PI))), .015);
  if(!leger || vide){
    M.push({...segment(A, S1, .006, .005, 4), c: vide ? TIGE_VIDE : TIGE});
    M.push({...segment(S1, tige(.55), .005, .004, 4), c: vide ? TIGE_VIDE : TIGE}, {...segment(tige(.55), fin, .004, .003, 4), c: vide ? TIGE_VIDE : TIGE});
  }
  const cote = new THREE.Vector3().crossVectors(h, HAUT).normalize();
  for(let j = 0; j < nb; j++){
    const t = nb > 1 ? j / (nb - 1) : 0, phi = j * 2.4 + alea() * .5, s = r0 * (1.08 - .38 * t);
    const dir = h.clone().multiplyScalar(Math.cos(phi)).add(cote.clone().multiplyScalar(Math.sin(phi)));
    const B = tige(t * .92 + .04);
    if(vide){                                             // le pédoncule vide et son petit bouton
      const E = B.clone().add(dir.multiplyScalar(.028)).add(V(0, -.014, 0));
      if(!leger) M.push({...segment(B, E, .0035, .003, 3), c: TIGE_VIDE});
      M.push({geo: BOUTON_GEO, m: new THREE.Matrix4().compose(E, Q, V(.0085, .0085, .0085)), c: BOUTON});
      continue;
    }
    const P = dehors(j === nb - 1 ? tige(1).add(V(0, -s * .8, 0)) : B.clone().add(dir.multiplyScalar(s * (1.45 - .9 * t))), s * .8);   // large en haut, fine au bout
    baie(M, P, s, leger);
  }
}
/* une groseille : ronde, rouge sombre en haut, orangée en bas (la lumière la traverse), un reflet blanc (comme sur l'image de Yo) */
const cBaie = new THREE.Color();
function baie(M, P, s, leger){
  M.push({geo: leger ? BAIE_LEGERE : BAIE, m: new THREE.Matrix4().compose(P, Q, V(s, s * .96, s)), c: 0xC81018,
    couleur: (x, y, z) => { const f = Math.min(1, Math.max(0, .42 - .55 * (y - P.y) / s + .25 * (z - P.z) / s + .12 * (x - P.x) / s)); return cBaie.copy(ROUGE).lerp(ORANGE, f * f); }});
  if(leger) return;
  M.push({geo: DISQUE6, m: new THREE.Matrix4().compose(P.clone().add(REFLET.clone().multiplyScalar(s * .97)), new THREE.Quaternion().setFromUnitVectors(Z, REFLET), V(s * .34, s * .24, 1)), c: 0xFFF4F0});
}
function grappesDe(M, alea, vide, leger, n){
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, yy = .66 - t * 1.26, rr = Math.sqrt(1 - yy * yy), a = k * 2.39996 + 1.1 + alea() * .4;
    const h = V(Math.cos(a), 0, Math.sin(a));
    grappe(M, surBoule(V(Math.cos(a) * rr, yy, Math.sin(a) * rr), .98), h, alea, vide, leger);
  }
}
/* la neige : un petit coussin sur les feuilles du dessus */
function neigeDe(alea){
  const M = [];
  for(let k = 0; k < 16; k++){                          // de petits coussins posés entre les feuilles du dessus
    const a = k * 2.39996 + alea() * .4, yy = .55 + alea() * .45, rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const nrm = V(Math.cos(a) * rr, yy, Math.sin(a) * rr), P = surBoule(nrm, .97 + alea() * .05);
    const q = new THREE.Quaternion().setFromUnitVectors(HAUT, normaleBoule(nrm).add(HAUT).normalize());
    M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(P, q, V(.07 + alea() * .04, .03, .06 + alea() * .04)), c: 0xF4F8FA});
  }
  return fusionner(M);
}

/* ---------- les modèles ---------- */
const MAT = feuillageMat({}, .3, 1.2);                    // la boule et ses grappes bougent au vent, le pied non
const CACHE = new Map();
function geos(saison, etat, variante, neige){
  const cle = [saison, etat, variante, neige ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const tons = (TONS[saison] || TONS.ete)[variante], vide = etat === "cueilli", jeune = etat === "jeune";
  const fait = leger => {
    const alea = aleaDe(4111 + variante * 97), M = feuillageDe(tons, alea, jeune ? 46 : leger ? 26 : 64, leger);
    piedFeuilles(M, tons, alea, leger);
    if(!jeune) grappesDe(M, alea, vide, leger, 18);
    return fusionner(M);
  };
  const r = {bois: boisDe(aleaDe(4111 + variante * 97), false), boisLeger: boisDe(aleaDe(4111 + variante * 97), true),
    pres: fait(false), loin: fait(true), ombre: fusionner([{geo: BOULE_BAS, m: new THREE.Matrix4().compose(C, Q, V(RX * .9, RY * .9, RX * .9)), c: 0}]),
    neige: neige && saison === "hiver" ? neigeDe(aleaDe(77 + variante)) : null};
  CACHE.set(cle, r);
  return r;
}
/* Le groseillier : stade 0 (une pousse), 1 (jeune, sans grappes), 2 (adulte) ; etat : « plein » (ses groseilles) ou
   « cueilli » (les grappes vides) ; r : son tirage (nuance, taille) ; neige : il neige */
export function groseillierModele(stade, saison, etat = "plein", r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  g.userData.groseillier = {stade, saison, etat: stade === 2 ? etat : "jeune", grappes: stade === 2 ? 18 : 0};
  if(stade === 0) return pousse(g, saison);
  const G = geos(saison, stade === 2 ? etat : "jeune", variante, neige);
  g.add(presLoin(mesh(G.bois, MAT_BOIS), mesh(G.boisLeger, MAT_BOIS), LOIN));
  g.add(presLoin(mesh(G.pres, MAT, false), mesh(G.loin, MAT, false), LOIN));
  const o = mesh(G.ombre, MAT_OMBRE); o.receiveShadow = false; g.add(o);
  if(G.neige) g.add(mesh(G.neige, MAT_BOIS, false));
  g.scale.setScalar((stade === 1 ? .62 : 1) * (.94 + r * .14));
  return g;
}
/* la pousse : une tige et trois petites feuilles */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const M = [], tons = (TONS[saison] || TONS.ete)[0];
    M.push({...segment(V(0, 0, 0), V(.01, .22, 0), .016, .01, 5), c: BOIS_CLAIR});
    for(let k = 0; k < 3; k++){
      const a = k * 2.1, h = V(Math.cos(a), 0, Math.sin(a));
      feuilleSur(M, V(h.x * .05, .2 + k * .02, h.z * .05), h.clone().multiplyScalar(.5).add(V(0, 1, 0)).normalize(), h, .13, tons[k % 2], false, 0, false);
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT, false));
  return g;
}
