/* ================= Le groseillier (le buisson de baies de l'île) =================
   Étape 2.1, morceau 3 ; ses deux images : Yo, 16 octobre 2026 (Desktop\Hearthwild\images\decor\groseillier.png et
   groseillier-cueilli.png), au plus près : un buisson presque rond d'environ 1 P de haut posé sur un petit tas de terre fait
   de mottes rondes, couvert de petites feuilles ; cinq tiges brunes qui partent du pied en V et se divisent en branches et
   en rameaux ; une boule de grandes feuilles à cinq lobes ronds, au bord festonné, vert-jaune et vert franc ; partout, sur
   le dessus aussi, des grappes de groseilles rouges, translucides et brillantes, plus grosses en haut de la grappe ; cueilli,
   les mêmes tiges vides, de petits boutons ocre au bout de leurs pédoncules.
   Au plus près de la réalité (demande de Yo, même jour : « est-ce qu'il y a des groseilles en automne et en hiver ? » : non) :
   au printemps, il fleurit (de petites grappes de fleurs en clochettes vert-jaune, teintées de rose) ; l'été, ses
   groseilles ; en automne, ses feuilles jaunissent et rougissent, quelques-unes tombent au pied, plus de grappes ; l'hiver,
   il est nu (ses tiges, ses branches, ses rameaux), un peu de neige dessus quand il neige. Jeune (planté), plus petit, sans
   fleurs ni grappes ; une pousse, trois petites feuilles (l'hiver, une petite tige).
   Pour un téléphone milieu de gamme (Yo, même jour) : un modèle par (saison, état, nuance, neige), partagé ; au-delà de
   LOIN P du personnage, un modèle léger ; l'ombre au sol vient d'une boule invisible. */
import { fusionner, feuillageMat } from "./formes.js";
import { aleaDe, segment, BOULE, BOULE_BAS, BOSSE, NEIGE_GEO, MAT_BOIS, MAT_OMBRE, mesh, presLoin } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Q = new THREE.Quaternion(), HAUT = V(0, 1, 0), Z = V(0, 0, 1);
const LOIN = 7;
/* les tons des feuilles : [clair, moyen, sombre, très clair] ; trois nuances par saison */
const TONS = {
  printemps: [[0xAAD652, 0x7CBA40, 0x4C8E2C, 0xC6E670], [0xA2D04C, 0x76B43C, 0x488A2A, 0xBEE06A], [0xB2DA58, 0x82C044, 0x52942E, 0xCCEA76]],
  ete:       [[0x9CC23E, 0x5E9A34, 0x3A7424, 0xBCD45C], [0x94BC3A, 0x589430, 0x366E22, 0xB4CE56], [0xA4C844, 0x64A038, 0x3E7A28, 0xC2DA62]],
  automne:   [[0xE8B83A, 0xD87A2C, 0xA8461E, 0xF2D25A], [0xE2AC34, 0xCC6A28, 0x9A3E1C, 0xEECA50], [0xEEC244, 0xE08A32, 0xB45022, 0xF6DA62]]
};
const BOIS = 0x8C5A30, BOIS_CLAIR = 0xA46C3A, BOIS_GRIS = 0x76604E, TIGE = 0xA8A43A, TIGE_VIDE = 0xB8963C, BOUTON = 0x8E6A2E;
const TERRE = [0x9E602E, 0xAE6E38, 0x8C5428, 0xBA7A40], ROUGE = new THREE.Color(0xA80A14), ORANGE = new THREE.Color(0xF2501E);
const FLEUR = [0xE4EA8C, 0xF0E2A4, 0xF0CCB0];             // les clochettes : vert-jaune, crème, teintées de rose

/* ---------- la feuille ---------- */
/* La feuille du groseillier : large, cinq lobes ronds (trois grands, deux petits près de la queue), le bord festonné,
   échancrée en coeur à la queue ; bombée, le bout des lobes un peu relevé ; les nervures plus claires vont de la queue au
   bout de chaque lobe, la queue à l'ombre, le bout des lobes dans la lumière (l'attribut « teinte »). Centrée au milieu, le
   bout vers +y, à plat dans le plan xy, bombée vers +z ; environ 0,8 de large et 0,8 de long */
const LOBES = [[0, 1, .6], [1.22, .9, .54], [-1.22, .9, .54], [2.3, .64, .44], [-2.3, .64, .44]];   // [angle depuis le bout, longueur, largeur]
const lobe = a => Math.max(...LOBES.map(([c, l, w]) => { const d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); return Math.exp(-((d / w) ** 2)); }));
function bord(a){
  let r = .48;
  for(const [c, l, w] of LOBES){ const d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); r = Math.max(r, .48 + (l - .48) * Math.exp(-((d / w) ** 2))); }
  const coeur = Math.exp(-(((Math.PI - Math.abs(a)) / .3) ** 2));       // l'échancrure, à la queue
  return r * (1 - .55 * coeur) * (1 + .06 * Math.cos(a * 18));         // le bord festonné
}
function feuilleGeo(n, anneaux){
  const pos = [0, -.04, .07], te = [.8], ind = [];
  anneaux.forEach(rr => {
    for(let k = 0; k < n; k++){
      const a = -Math.PI + (k + .5) / n * 2 * Math.PI, b = bord(a) * rr * .5;
      const nerv = LOBES.some(([c]) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < Math.PI / n * 1.1);
      const y = Math.cos(a) * b - .04, clair = .86 + .3 * (y + .3);           // la queue à l'ombre, le bout des lobes dans la lumière
      pos.push(Math.sin(a) * b, y, .07 * (1 - rr * rr) - .025 * rr + .035 * rr * rr * lobe(a));   // bombée, le bout des lobes relevé
      te.push((rr < 1 ? (nerv ? 1.08 : .94) : (nerv ? 1.05 : 1.0)) * clair);
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
const FEUILLE = feuilleGeo(24, [.5, 1]), FEUILLE_PIED = feuilleGeo(14, [1]), FEUILLE_LEGERE = feuilleGeo(10, [1]);

/* ---------- la forme ---------- */
const C = V(0, .64, 0), RX = .47, RY = .45;                  // la boule de feuilles (le buisson fait environ 1,1 P de haut)
const DISQUE6 = new THREE.CircleGeometry(1, 6);
const BAIE = new THREE.SphereGeometry(1, 6, 5), BAIE_LEGERE = new THREE.SphereGeometry(1, 5, 3), BOUTON_GEO = new THREE.SphereGeometry(1, 4, 2);
const CLOCHE = new THREE.ConeGeometry(1, 1.4, 6, 1, true), CLOCHE_LEGERE = new THREE.ConeGeometry(1, 1.4, 4, 1, true);
const REFLET = V(-.35, .62, .7).normalize();
/* la lumière peinte sur la boule : le creux et le dessous plus sombres, le dessus et le bord plus clairs */
const radiale = (x, y, z, n0) => { const v = V(x - C.x, (y - C.y) * RX / RY, z - C.z).normalize(); return n0 ? v.multiplyScalar(.55).add(n0.clone().multiplyScalar(.45)).normalize() : v; };
const ombre = (x, y, z) => {
  const d = Math.hypot((x - C.x) / RX, (y - C.y) / RY, (z - C.z) / RX), dessus = (y - C.y) / RY;
  return Math.min(1.14, Math.max(.42, .5 + .46 * Math.min(1, Math.max(0, (d - .6) / .45)) + .2 * dessus));
};
/* un point ramené dans la boule (k : jusqu'où), pour que les rameaux ne sortent pas des feuilles */
const dedans = (P, k) => { const d = Math.hypot((P.x - C.x) / RX, (P.y - C.y) / RY, (P.z - C.z) / RX); if(d > k){ P.x = C.x + (P.x - C.x) * k / d; P.y = C.y + (P.y - C.y) * k / d; P.z = C.z + (P.z - C.z) * k / d; } return P; };
const surBoule = (nrm, k = 1) => V(C.x + nrm.x * RX * k, C.y + nrm.y * RY * k, C.z + nrm.z * RX * k);
const normaleBoule = nrm => V(nrm.x / RX, nrm.y / RY, nrm.z / RX).normalize();

/* Le squelette : cinq tiges qui partent du pied en V, chacune se divise en trois branches qui montent vers le bord de la
   boule, et chaque branche en deux ou trois rameaux. Caché dans les feuilles à la belle saison, il est tout le buisson
   l'hiver. Un même tirage pour toutes les saisons d'une nuance */
function squelette(alea){
  const S = [], bouts = [];
  for(let k = 0; k < 5; k++){
    const a = k / 5 * Math.PI * 2 + alea() * .5, e = .032 + alea() * .01;
    const A = V(Math.cos(a) * .04, .03, Math.sin(a) * .04), B = V(Math.cos(a) * .12, .19, Math.sin(a) * .12), T = V(Math.cos(a + .2) * .25, .4 + alea() * .06, Math.sin(a + .2) * .25);
    S.push([A, B, e, e * .85, 0], [B, T, e * .85, e * .55, 0]);
    for(let j = 0; j < 3; j++){
      const az = a + .2 + (j - 1) * .7 + (alea() - .5) * .3, yy = .05 + j % 2 * .35 + alea() * .4, rr = Math.sqrt(1 - yy * yy);
      const E = surBoule(V(Math.cos(az) * rr, yy, Math.sin(az) * rr), .72 + alea() * .1);
      S.push([T, E, e * .5, e * .3, 1]);
      const nr = 3 + (alea() < .5 ? 1 : 0);
      for(let m = 0; m < nr; m++){
        const az2 = az + (alea() - .5) * 1.2, yy2 = Math.min(.97, yy + .05 + alea() * .5), rr2 = Math.sqrt(1 - yy2 * yy2);
        const F = surBoule(V(Math.cos(az2) * rr2, yy2, Math.sin(az2) * rr2), .88 + alea() * .08);
        const M2 = E.clone().lerp(F, .5).add(V(0, .03, 0));        // le rameau se courbe un peu vers le haut
        S.push([E, M2, e * .27, e * .2, 2], [M2, F, e * .2, e * .1, 2]);
        bouts.push(F);
        const az3 = az2 + (alea() - .5) * 1.4, G2 = dedans(M2.clone().add(V(Math.cos(az3) * .1, .1 + alea() * .06, Math.sin(az3) * .1)), .9);
        S.push([M2, G2, e * .14, e * .07, 2]);                     // un petit rameau sur le rameau
        bouts.push(G2);
      }
    }
  }
  return {S, bouts};
}
/* le pied (le tas de terre et ses mottes) et le bois (le squelette) ; l'hiver, le bois grisé et nu */
function boisDe(sq, alea, leger, hiver){
  const M = [];
  M.push({geo: BOSSE, m: new THREE.Matrix4().compose(V(0, 0, 0), Q, V(.33, .075, .33)), c: TERRE[0], ombre: (x, y) => .9 + y * 2});
  const nm = leger ? 6 : 16;
  for(let k = 0; k < nm; k++){
    const a = k / nm * Math.PI * 2 + alea() * .3, d = .26 + alea() * .08, s = .05 + alea() * .025;
    M.push({geo: BOSSE, m: new THREE.Matrix4().compose(V(Math.cos(a) * d, .018, Math.sin(a) * d), Q, V(s * 1.2, s * .7, s)), c: TERRE[k % 4], ombre: (x, y) => .82 + y * 4});
  }
  sq.S.forEach(([A, B, ra, rb, niveau], k) => {
    if(leger && niveau === 2 && !hiver) return;
    const c = hiver ? (niveau === 0 && k % 2 ? 0x6E5A48 : BOIS_GRIS) : niveau === 0 ? (k % 2 ? BOIS : BOIS_CLAIR) : BOIS;
    M.push({...segment(A, B, ra, rb, niveau === 0 ? (leger ? 5 : 7) : niveau === 1 ? 5 : 4), c});
    if(niveau < 2 && !leger) M.push({geo: BOSSE, m: new THREE.Matrix4().compose(B, Q, V(rb, rb, rb)), c});
  });
  return fusionner(M);
}
/* les petites feuilles du pied, couchées sur la terre et relevées vers l'extérieur ; en automne, des feuilles tombées */
function piedFeuilles(M, tons, alea, leger, automne){
  const n = leger ? 8 : 26;
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2 + alea() * .4, d = .1 + alea() * .16, h = V(Math.cos(a), 0, Math.sin(a));
    const P = V(h.x * d, .085 + alea() * .03, h.z * d), Nf = h.clone().multiplyScalar(-.75).add(V(0, 1, 0)).normalize();
    feuilleSur(M, P, Nf, h, .17 + alea() * .06, tons[k % 3 === 0 ? 0 : k % 3 === 1 ? 1 : 2], leger, 0, false);
  }
  if(automne) for(let k = 0; k < (leger ? 4 : 12); k++){
    const a = alea() * Math.PI * 2, d = .3 + alea() * .32, h = V(Math.cos(a), 0, Math.sin(a));
    feuilleSur(M, V(h.x * d, d < .36 ? .07 : .02, h.z * d), V((alea() - .5) * .3, 1, (alea() - .5) * .3).normalize(), V(Math.cos(a * 3), 0, Math.sin(a * 3)), .2 + alea() * .05, tons[k % 4], leger, 0, false);
  }
}
/* une feuille posée en P, tournée vers Nf, le bout vers T0 (projeté sur son plan), de taille s ; lev : le bout se soulève ;
   roule : elle penche sur un côté */
function feuilleSur(M, P, Nf, T0, s, c, leger, tourne = 0, boule = true, lev = 0, roule = 0){
  const T = T0.clone().sub(Nf.clone().multiplyScalar(T0.dot(Nf)));
  if(T.lengthSq() < 1e-4) T.set(1, 0, 0);
  T.normalize().applyAxisAngle(Nf, tourne || 0);
  if(lev){ const t2 = T.clone(); T.multiplyScalar(Math.cos(lev)).add(Nf.clone().multiplyScalar(Math.sin(lev))); Nf = Nf.clone().multiplyScalar(Math.cos(lev)).sub(t2.multiplyScalar(Math.sin(lev))); }
  if(roule) Nf = Nf.clone().applyAxisAngle(T, roule);
  const X = new THREE.Vector3().crossVectors(T, Nf).normalize();
  const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s), T.multiplyScalar(s), Nf.clone().multiplyScalar(s)).setPosition(P);
  M.push(boule ? {geo: leger ? FEUILLE_LEGERE : FEUILLE, m, c, normale: radiale, ombre} : {geo: leger ? FEUILLE_LEGERE : FEUILLE_PIED, m, c, ombre: (x, y) => .78 + y * 1.5});
}
/* la boule de feuilles : un coeur sombre, une couche de feuilles dedans, puis les feuilles de dessus, qui se chevauchent,
   chacune à sa profondeur (celles du fond plus sombres), le bout soulevé et penchée sur un côté ; une boule irrégulière */
function feuillageDe(tons, alea, nb, leger, automne){
  const M = [];
  M.push({geo: leger ? BOULE_BAS : BOULE, m: new THREE.Matrix4().compose(C.clone().add(V(0, -.02, 0)), Q, V(RX * .9, RY * .88, RX * .9)), c: new THREE.Color(tons[1]).multiplyScalar(.7).getHex(), normale: radiale, ombre});
  const couches = leger ? [[nb, 1]] : [[Math.round(nb * .28), .86], [nb, 1]];
  for(const [n, k0] of couches) for(let k = 0; k < n; k++){
    const t = (k + .5) / n, yy = 1 - t * 1.66, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = k * 2.39996 + alea() * .5;
    const nrm = V(Math.cos(a + k0 * 1.7) * rr, yy, Math.sin(a + k0 * 1.7) * rr), ne = normaleBoule(nrm);
    const bosses = 1 + .09 * Math.sin(a * 3 + 1) * Math.cos(yy * 4.5) + .05 * Math.sin(a * 5 + yy * 7);
    const prof = k0 < 1 ? k0 : .88 + alea() * .2;
    const P = surBoule(nrm, prof * bosses);
    const Nf = ne.clone().add(V(0, .22, 0)).normalize();
    const h = rr > .15 ? V(nrm.x, 0, nrm.z).normalize() : V(Math.cos(a), 0, Math.sin(a));
    const T0 = yy > .75 ? V(Math.cos(a * 7), 0, Math.sin(a * 7)) : h.clone().multiplyScalar(.4).add(HAUT);
    const p = alea();
    const c = automne ? tons[p < .3 ? 0 : p < .55 ? 1 : p < .75 ? 3 : 2]                   // jaunes, orangées, quelques rouges
      : k0 < 1 ? tons[2] : yy > .35 ? tons[p < .4 ? 0 : p < .65 ? 3 : 1] : tons[p < .4 ? 1 : p < .65 ? 0 : p < .85 ? 2 : 3];
    const taille = ((k0 < 1 ? .26 : .27) + alea() * .07 + (leger ? .07 : 0)) * (1 - .25 * Math.max(0, yy - .55) / .45);
    feuilleSur(M, P, Nf, T0, taille, c, leger, (alea() - .5) * 1.7, true,
      k0 < 1 ? 0 : yy > .7 ? alea() * .12 : -.12 + alea() * .5, k0 < 1 ? 0 : (alea() - .5) * (yy > .7 ? .4 : 1.0));
  }
  return M;
}
/* un point de grappe poussé hors de la boule de feuilles (à sa hauteur), pour que la grappe pende devant les feuilles */
function dehors(P, marge){
  const dy = (P.y - C.y) / RY, rh = RX * Math.sqrt(Math.max(0, 1 - dy * dy)) * (dy > .45 ? 1.1 : 1.04) + marge + (dy > .45 ? .025 : 0), d = Math.hypot(P.x - C.x, P.z - C.z);
  if(d < rh && d > 1e-4){ P.x = C.x + (P.x - C.x) * rh / d; P.z = C.z + (P.z - C.z) * rh / d; }
  return P;
}
/* une grappe : la fine tige qui sort de la boule et retombe, puis les groseilles (larges en haut, fines au bout), ou,
   cueillie, les pédoncules vides et leurs petits boutons ocre, ou, au printemps, les clochettes des fleurs */
function grappe(M, A, h, alea, quoi, leger){
  const fleurs = quoi === "fleurs", vide = quoi === "vide";
  const L = (fleurs ? .12 : .14) + alea() * .06, nb = leger ? 3 : fleurs ? 7 + Math.floor(alea() * 3) : 9 + Math.floor(alea() * 4);   // une grappe courte et serrée
  const r0 = fleurs ? .021 : .032 + alea() * .005;
  const S1 = A.clone().add(h.clone().multiplyScalar(.08)).add(V(0, -.015, 0));
  const fin = S1.clone().add(h.clone().multiplyScalar(.035)).add(V(0, -L, 0));
  const tige = t => dehors(S1.clone().lerp(fin, t).add(h.clone().multiplyScalar(.02 * Math.sin(t * Math.PI))), .015);
  const cTige = vide ? TIGE_VIDE : fleurs ? 0x9CC048 : TIGE;
  if(!leger || vide){
    M.push({...segment(A, S1, .006, .005, 4), c: cTige});
    M.push({...segment(S1, tige(.55), .005, .004, 4), c: cTige}, {...segment(tige(.55), tige(1), .004, .003, 4), c: cTige});
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
    if(fleurs){                                           // une clochette qui pend, l'ouverture vers le bas
      const E = B.clone().add(dir.multiplyScalar(.022)).add(V(0, -.012, 0));
      M.push({geo: leger ? CLOCHE_LEGERE : CLOCHE, m: new THREE.Matrix4().compose(E, Q, V(s, s, s)), c: FLEUR[(j + Math.floor(alea() * 3)) % 3]});
      continue;
    }
    const P = dehors(j === nb - 1 ? tige(1).add(V(0, -s * .8, 0)) : B.clone().add(dir.multiplyScalar(s * (1.7 - 1.05 * t))), s * .8);
    baie(M, P, s, leger);
  }
}
/* une groseille : ronde, rouge sombre en haut, orangée en bas (la lumière la traverse), un reflet blanc (image de Yo) */
const cBaie = new THREE.Color();
function baie(M, P, s, leger){
  M.push({geo: leger ? BAIE_LEGERE : BAIE, m: new THREE.Matrix4().compose(P, Q, V(s, s * .96, s)), c: 0xC81018,
    couleur: (x, y, z) => { const f = Math.min(1, Math.max(0, .42 - .55 * (y - P.y) / s + .25 * (z - P.z) / s + .12 * (x - P.x) / s)); return cBaie.copy(ROUGE).lerp(ORANGE, f * f); }});
  if(leger) return;
  M.push({geo: DISQUE6, m: new THREE.Matrix4().compose(P.clone().add(REFLET.clone().multiplyScalar(s * .97)), new THREE.Quaternion().setFromUnitVectors(Z, REFLET), V(s * .34, s * .24, 1)), c: 0xFFF4F0});
}
/* les grappes, réparties partout sur la boule, le dessus compris (image de Yo ; Yo : « pas assez de groseilles, surtout
   sur le dessus ») */
function grappesDe(M, alea, quoi, leger, n){
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, yy = .94 - t * 1.5, rr = Math.sqrt(1 - yy * yy), a = k * 2.39996 + 1.1 + alea() * .4;
    const h = V(Math.cos(a), 0, Math.sin(a));
    grappe(M, surBoule(V(Math.cos(a) * rr, yy, Math.sin(a) * rr), .98), h, alea, quoi, leger);
  }
}
/* la neige : de petits coussins entre les feuilles du dessus ; l'hiver (nu), sur les branches et au bout des rameaux */
function neigeDe(alea, sq, nu){
  const M = [];
  if(nu){
    sq.S.forEach(([A, B, ra, rb, niveau]) => {
      if(niveau === 0) return;
      const P = A.clone().lerp(B, .55);
      M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(P.add(V(0, ra * .9, 0)), Q, V(ra * 1.6 + .012, .012, ra * 1.6 + .012)), c: 0xF4F8FA});
    });
    for(const F of sq.bouts) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(F.clone().add(V(0, .006, 0)), Q, V(.014, .011, .014)), c: 0xF4F8FA});
    return fusionner(M);
  }
  for(let k = 0; k < 16; k++){
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
/* saison : celle du jeu ; etat : « plein » (ses groseilles), « cueilli » (les grappes vides), « jeune » (planté, sans
   fleurs ni grappes) ; l'état ne compte que l'été */
function geos(saison, etat, variante, neige){
  const nu = saison === "hiver", automne = saison === "automne", jeune = etat === "jeune";
  const quoi = jeune || automne || nu ? null : saison === "printemps" ? "fleurs" : etat === "cueilli" ? "vide" : "baies";
  const cle = [saison, quoi, jeune ? 1 : 0, variante, neige && nu ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const tons = nu ? null : TONS[saison][variante], germe = 4111 + variante * 97;
  const sq = squelette(aleaDe(germe + 5));
  const fait = leger => {
    if(nu) return null;
    const alea = aleaDe(germe), M = feuillageDe(tons, alea, jeune ? 70 : leger ? 30 : 110, leger, automne);
    piedFeuilles(M, tons, alea, leger, automne);
    if(quoi) grappesDe(M, alea, quoi, leger, quoi === "fleurs" ? 30 : 34);
    return fusionner(M);
  };
  const r = {quoi, nu, bois: boisDe(sq, aleaDe(germe), false, nu), boisLeger: boisDe(sq, aleaDe(germe), true, nu), pres: fait(false), loin: fait(true),
    ombre: nu ? null : fusionner([{geo: BOULE_BAS, m: new THREE.Matrix4().compose(C, Q, V(RX * .9, RY * .9, RX * .9)), c: 0}]),
    neige: neige && nu ? neigeDe(aleaDe(77 + variante), sq, true) : null};
  CACHE.set(cle, r);
  return r;
}
/* Le groseillier : stade 0 (une pousse), 1 (jeune), 2 (adulte) ; saison ; etat : « plein » ou « cueilli » (l'été) ;
   r : son tirage (nuance, taille) ; neige : il neige */
export function groseillierModele(stade, saison, etat = "plein", r = 0, neige = false){
  const g = new THREE.Group(), variante = Math.floor(r * 3) % 3;
  if(stade === 0){ g.userData.groseillier = {stade, saison, etat: "pousse", grappes: 0, fleurs: 0}; return pousse(g, saison); }
  const G = geos(saison, stade === 2 ? etat : "jeune", variante, neige);
  g.userData.groseillier = {stade, saison, etat: G.quoi === "baies" ? "plein" : G.quoi === "vide" ? "cueilli" : G.quoi || (G.nu ? "nu" : stade === 2 ? "feuilles" : "jeune"),
    grappes: G.quoi === "baies" ? 34 : 0, fleurs: G.quoi === "fleurs" ? 30 : 0, nu: G.nu, neige: !!G.neige};
  g.add(presLoin(mesh(G.bois, MAT_BOIS), mesh(G.boisLeger, MAT_BOIS), LOIN));
  if(G.pres) g.add(presLoin(mesh(G.pres, MAT, false), mesh(G.loin, MAT, false), LOIN));
  if(G.ombre){ const o = mesh(G.ombre, MAT_OMBRE); o.receiveShadow = false; g.add(o); }
  if(G.neige) g.add(mesh(G.neige, MAT_BOIS, false));
  g.scale.setScalar((stade === 1 ? .62 : 1) * (.94 + r * .14));
  return g;
}
/* la pousse : une tige et trois petites feuilles (l'hiver, la tige seule) */
const POUSSES = new Map();
function pousse(g, saison){
  if(!POUSSES.has(saison)){
    const M = [];
    M.push({...segment(V(0, 0, 0), V(.01, .22, 0), .016, .01, 5), c: BOIS_CLAIR});
    if(saison !== "hiver"){
      const tons = TONS[saison][0];
      for(let k = 0; k < 3; k++){
        const a = k * 2.1, h = V(Math.cos(a), 0, Math.sin(a));
        feuilleSur(M, V(h.x * .05, .2 + k * .02, h.z * .05), h.clone().multiplyScalar(.5).add(V(0, 1, 0)).normalize(), h, .13, tons[k % 2], false, 0, false);
      }
    }
    POUSSES.set(saison, fusionner(M));
  }
  g.add(mesh(POUSSES.get(saison), MAT, false));
  return g;
}
