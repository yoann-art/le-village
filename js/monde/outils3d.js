/* ================= Outils en 3D =================
   Le modèle de l'outil tenu en main, en formes simples (phase 1), un par famille d'outils,
   et le sachet d'une graine qu'on va planter.
   Il est construit le manche vers le bas, l'origine dans la main ; le devant regarde +z. */
import { G, part, toon, fusionner, MAT_UNI } from "./formes.js";
import { OUTILS, GRAINES, POSABLES, CHEMIN_DE, enMainDehors, aUnManche, teinteManche } from "../donnees.js";
import { state } from "../sauvegarde.js";
import { makeMeuble } from "./meubles.js";
import { rockMesh } from "./rochers.js";

const C = {wood:0xB07A4A, dark:0x654028, stone:0x9EA3A8, metal:0x6F7884, cream:0xF4EFE6, red:0xC8643C};

const BUILD = {
  hache(g, o, w = C.wood){
    g.add(part(G.cyl, w, .05, .52, .05, 0, .12, 0));                             // manche
    g.add(part(G.box, o.tete || C.stone, .05, .14, .16, 0, .32, .08));                 // fer de la hache (pierre, cuivre…)
    g.add(part(G.cyl, C.dark, .07, .05, .07, 0, .36, 0));                              // ligature
  },
  pioche(g, o, w = C.wood){
    g.add(part(G.cyl, w, .05, .52, .05, 0, .12, 0));
    const head = part(G.cyl, o.tete || C.stone, .07, .38, .07, 0, .36, 0);                      // tête à deux pointes arrondies
    head.rotation.x = Math.PI/2; g.add(head);
  },
  canne(g, o, w = C.wood){
    const rod = part(G.cyl, w, .035, .9, .035, 0, .38, 0);                       // gaule
    g.add(rod);
    g.add(part(G.cyl, o.tete || C.dark, .09, .05, .09, 0, .02, .04));                 // moulinet (bois, cuivre, bronze)
    g.add(part(G.cyl, C.cream, .008, .3, .008, 0, .7, .03));                           // fil
    const bout = new THREE.Object3D(); bout.name = "bout"; bout.position.set(0, .84, 0); g.add(bout);   // le bout de la gaule : le fil de la pêche en part
  },
  filet(g, o, w = C.wood){
    g.add(part(G.cyl, w, .04, .7, .04, 0, .28, 0));                              // manche
    const cercle = new THREE.Mesh(new THREE.TorusGeometry(.13 + (o.plusLoin || 0) * .04, .015, 6, 16), toon({color: o.tete || C.dark}));
    cercle.position.set(0, .7, 0); cercle.rotation.y = Math.PI/2; g.add(cercle);       // le cercle
    const poche = part(G.cone, 0xF4EFE6, .26, .22, .26, 0, .7, .1);                   // la poche du filet
    poche.rotation.x = -Math.PI/2; poche.material = toon({color: 0xF4EFE6, transparent: true, opacity: .7}); g.add(poche);
  },
  arrosoir(g, o, w = C.wood){
    g.add(part(G.cyl, o.tete || w, .28, .26, .28, 0, .02, .1));                 // le seau (bois, cuivre, bronze), tenu par son anse
    g.add(part(G.cyl, C.dark, .3, .03, .3, 0, .15, .1));                              // cerclage
    const bec = part(G.cyl, o.tete || w, .05, .3, .05, 0, .1, .32);            // bec verseur
    bec.rotation.x = 1.1; g.add(bec);
    const anse = part(G.cyl, C.dark, .03, .3, .03, 0, .24, .1);                       // anse
    anse.rotation.x = Math.PI/2; g.add(anse);
  },
  pelle(g, o, w = C.wood){                                                                       // le manche, et la lame arrondie au bout
    g.add(part(G.cyl, w, .045, .62, .045, 0, .2, 0));
    g.add(part(G.box, C.dark, .14, .04, .04, 0, -.1, 0));                              // la poignée
    g.add(part(G.head, o.tete || w, .62, .9, .18, 0, .6, .02));                   // la lame (bois, cuivre…)
  },
  bocal(g, o){                                                                       // un bocal de verre, son couvercle de bois
    const v = part(G.cyl, 0xB8DCEE, .26, .3, .26, 0, .05, .08);
    v.material = toon({color: 0xB8DCEE, emissive: 0x4A7A9A, emissiveIntensity: .25, transparent: true, opacity: .8}); g.add(v);
    g.add(part(G.cyl, C.dark, .2, .05, .2, 0, .22, .08));
    if(o.tete) for(const y of [-.06, .14]) g.add(part(G.cyl, o.tete, .28, .03, .28, 0, y, .08));   // cerclé de cuivre ou de bronze
  },
  torche(g){                                                                         // la torche éteinte : un bâton, une tête de résine
    g.add(part(G.cyl, C.wood, .05, .5, .05, 0, .16, 0));
    g.add(part(G.cyl, C.dark, .09, .14, .09, 0, .44, 0));
  },
  arc(g){                                                                            // l'arc en if, tenu debout, et sa corde
    const bois = new THREE.Mesh(new THREE.TorusGeometry(.34, .025, 6, 18, Math.PI * .8), toon({color: 0xC8743C}));
    bois.rotation.z = Math.PI * .6; bois.rotation.y = Math.PI/2; bois.position.set(0, .3, -.2); g.add(bois);
    g.add(part(G.cyl, C.cream, .008, .64, .008, 0, .3, .02));                           // la corde
    g.add(part(G.cyl, C.dark, .05, .1, .05, 0, .3, -.13));                              // la poignée
  },
  arme(g, o, w = C.wood){
    g.add(part(G.cyl, C.dark, .045, .14, .045, 0, 0, 0));                              // poignée
    g.add(part(G.box, C.dark, .06, .04, .2, 0, .08, 0));                               // garde
    g.add(part(G.box, o.tete || w, .04, .44, .09, 0, .32, 0));                    // lame (bois, cuivre…)
    g.add(part(G.head, o.tete || w, .2, .2, .38, 0, .54, 0));                     // bout arrondi
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
  else if(k === "granit" || k === "marbre") g.add(part(G.box, k === "granit" ? 0xB4A49A : 0xF2F0EA, .22, .08, .22, 0, .08, .05));   // une dalle
  else {
    g.add(part(G.head, 0xD8CDB4, .7, .5, .7, 0, .06, .05));
    for(const [x, z] of [[-.05, .02], [.05, .08], [0, -.04]]) g.add(part(G.dode, 0x8E8678, .05, .04, .05, x, .12, z));
  }
}
/* ---------- Les outils refaits d'après les images de Yo (le chantier des outils, 16 novembre 2026) ----------
   Un seul dessin chacun : leurs morceaux fusionnés, aux couleurs par sommet (MAT_UNI), l'ombre douce peinte ; la forme est
   faite une fois par bois du manche, puis partagée. Dessinés à la taille de l'image (le manche mesure 1, la main à 0), puis
   ramenés à la taille du jeu : RF, et le haut redressé contre l'écrasement de makeOutil (1,6 de large, 1,25 de haut). */
const formesOutils = new Map();
const RF = .37;
const M4o = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
function modeleOutil(cle, morceaux){
  if(!formesOutils.has(cle)) formesOutils.set(cle, fusionner(morceaux()));
  const m = new THREE.Mesh(formesOutils.get(cle), MAT_UNI); m.castShadow = m.receiveShadow = true;
  m.scale.set(RF, RF * 1.6 / 1.25, RF);
  return m;
}
const CUIR = 0xB55A2C;
/* Un hasard toujours le même (les facettes de la pierre taillée ne changent pas d'une partie à l'autre) */
const hasard = graine => () => (graine = (graine * 16807) % 2147483647) / 2147483647;
/* Le manche (le même pour les haches, et plus tard les pioches) : rond, plus large au bout du bas arrondi, un peu courbe ;
   le haut coupé net, un peu bombé, plus clair (le bois de bout) */
const MANCHE = (() => {
  const p = [[0, -.33], [.07, -.325], [.11, -.3], [.13, -.26], [.126, -.2], [.108, -.12], [.094, -.04], [.092, .1], [.096, .3],
    [.1, .5], [.102, .64], [.095, .672], [.06, .686], [0, .69]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(p, 12), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const y = P.getY(i); if(y < .2) P.setZ(i, P.getZ(i) - .07 * ((.2 - y) / .53) ** 2); }   // la courbe du bas
  g.computeVertexNormals();
  return g;
})();
/* La tête de la hache en pierre (image de Yo, 16 novembre 2026, à un seul tranchant : « Un seul tranchant ») : devant (+z) la
   lame en croissant, sa pointe du bas en crochet ; derrière (-z) un talon court et arrondi. Chaque côté est une grille tendue
   entre ses quatre bords (le dessus, le dessous, l'axe du manche, le bout) ; chaque sommet un peu en creux au hasard et chaque
   triangle plat : la pierre taillée à facettes. L'épaisseur va selon x. cotes : [derrière, devant], chacun {nu, haut, bas, bout,
   epBord}, ses z comptés depuis l'axe (positifs) */
function tetePierre({cotes, nv = 7, epCentre = .16, creux = .032, graine = 7, lisse = false, tranchant = 0}){
  const bez2 = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1]];
  const bez3 = (a, c, d, b, t) => { const s = 1 - t; return [s ** 3 * a[0] + 3 * s * s * t * c[0] + 3 * s * t * t * d[0] + t ** 3 * b[0],
    s ** 3 * a[1] + 3 * s * s * t * c[1] + 3 * s * t * t * d[1] + t ** 3 * b[1]]; };
  const coons = (c, u, v) => {
    const T = t => bez2(...c.haut, t), B = t => bez2(...c.bas, t), E = t => bez3(...c.bout, t), I = t => [0, B(0)[1] + (T(0)[1] - B(0)[1]) * t];
    const r = [0, 0];
    for(const k of [0, 1]) r[k] = (1 - v) * B(u)[k] + v * T(u)[k] + (1 - u) * I(v)[k] + u * E(v)[k]
      - ((1 - u) * (1 - v) * B(0)[k] + u * (1 - v) * B(1)[k] + (1 - u) * v * T(0)[k] + u * v * T(1)[k]);
    return r; };
  const [D, F] = cotes, n0 = D.nu, cols = D.nu + F.nu + 1, rnd = hasard(graine), pts = [];
  for(let j = 0; j <= nv; j++) for(let i = 0; i < cols; i++){
    const c = i < n0 ? D : F, s = i < n0 ? -1 : 1, v = j / nv, ii = Math.abs(i - n0), u = c.us ? c.us[ii] : ii / c.nu, [z, y] = coons(c, u, v);
    const bord = i === 0 || i === cols - 1 || j === 0 || j === nv;
    const ep = (epCentre + (c.epBord - epCentre) * u ** 1.3) * (bord || i === n0 ? 1 : 1 - creux / epCentre * rnd());
    pts.push([s * z, y, ep, tranchant && s > 0 && u >= tranchant ? 1 : 0]);
  }
  const at = (i, j) => pts[j * cols + i], tri = [], bords = [];
  const face = (a, b, c, sx) => { for(const p of sx > 0 ? [a, c, b] : [a, b, c]){ tri.push(sx * p[2], p[1], p[0]); bords.push(p[3]); } };
  for(const sx of [1, -1]) for(let j = 0; j < nv; j++) for(let i = 0; i < cols - 1; i++){
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    if((i + j) % 2){ face(a, b, c, sx); face(a, c, d, sx); } else { face(a, b, d, sx); face(b, c, d, sx); }
  }
  const tour = [];                                                          // le pourtour : le dessous, le tranchant, le dessus, le talon
  for(let i = 0; i < cols; i++) tour.push(at(i, 0));
  for(let j = 1; j <= nv; j++) tour.push(at(cols - 1, j));
  for(let i = cols - 2; i >= 0; i--) tour.push(at(i, nv));
  for(let j = nv - 1; j > 0; j--) tour.push(at(0, j));
  for(let k = 0; k < tour.length; k++){
    const p = tour[k], q = tour[(k + 1) % tour.length], P1 = [p[2], p[1], p[0]], P2 = [-p[2], p[1], p[0]], Q1 = [q[2], q[1], q[0]], Q2 = [-q[2], q[1], q[0]];
    tri.push(...P1, ...Q2, ...P2, ...P1, ...Q1, ...Q2); bords.push(p[3], q[3], p[3], p[3], q[3], q[3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  g.computeVertexNormals();                                                 // sans sommets partagés : chaque triangle plat, une facette
  if(lisse){                                                                // le métal : lisse, les normales d'un même point mises en commun
    const P = g.attributes.position, N = g.attributes.normal, somme = new Map(), cle = i => P.getX(i).toFixed(4) + "," + P.getY(i).toFixed(4) + "," + P.getZ(i).toFixed(4);
    for(let i = 0; i < P.count; i++){ const k = cle(i), n = somme.get(k) || [0, 0, 0]; n[0] += N.getX(i); n[1] += N.getY(i); n[2] += N.getZ(i); somme.set(k, n); }
    for(let i = 0; i < P.count; i++){ const n = somme.get(cle(i)), l = Math.hypot(...n) || 1; N.setXYZ(i, n[0] / l, n[1] / l, n[2] / l); }
  }
  g.userData.bord = bords;                                                  // 1 : le tranchant (plus clair sur le métal)
  return g;
}
const LAME_HP = tetePierre({cotes: [
  {nu: 2, epBord: .11, haut: [[0, .59], [.07, .6], [.13, .575]], bas: [[0, .35], [.07, .34], [.13, .37]],     // le talon arrondi
    bout: [[.13, .37], [.19, .39], [.19, .555], [.13, .575]]},
  {nu: 5, epBord: .04, haut: [[0, .59], [.16, .565], [.31, .71]], bas: [[0, .35], [.17, .39], [.26, .11]],   // la lame, son crochet
    bout: [[.26, .11], [.44, .19], [.46, .61], [.31, .71]]}
]});
const LIEN = new THREE.TorusGeometry(1, .16, 5, 14), LANIERE = (() => {   // une lanière plate, courbée pour épouser la pierre
  const g = new THREE.CylinderGeometry(.5, .5, 1, 8, 4), P = g.attributes.position;
  for(let i = 0; i < P.count; i++) P.setX(i, P.getX(i) - 3.2 * P.getY(i) ** 2);
  g.computeVertexNormals(); return g; })();
/* La hache en pierre (image de Yo, 16 novembre 2026 : « Voici la hache ») : le manche de bois (son essence, choisie en la
   fabriquant), courbe, le bout du bas arrondi et plus large ; la lame de pierre taillée, à un seul tranchant en croissant (Yo :
   deux, on dirait une arme), la pointe du bas en crochet, un talon arrondi derrière ; deux lanières de cuir croisées en X sur la lame, qui en font le tour, et quatre tours de cuir
   serrés sous la lame. Un seul dessin */
function hachePierre(w){
  const m = modeleOutil("hachePierre" + w, () => {
    const out = [];
    out.push({geo: MANCHE, m: M4o(0, 0, 0), c: w, couleur: (x, y) => y > .675 ? new THREE.Color(w).multiplyScalar(1.18).getHex() : w,
      ombre: (x, y, z) => .86 + .2 * Math.max(0, Math.min(1, (x * .6 + z * .2) / .09 + .5))});
    out.push({geo: LAME_HP, m: M4o(0, 0, 0), c: 0xA6A09A, ombre: (x, y) => .84 + .22 * Math.max(0, Math.min(1, (y - .2) / .5))});
    for(const sx of [1, -1]) for(const a of [.7, -.7])                                          // les deux lanières en X, des deux côtés
      out.push({geo: LANIERE, m: M4o(sx * .17, .45, Math.sign(a) * .03, a * sx, sx > 0 ? 0 : Math.PI, 0, .03, .32, .09), c: CUIR, ombre: (x, y) => .86 + .2 * Math.max(0, Math.min(1, (y - .35) / .25))});
    for(const y of [.31, .265, .22, .175])                                                             // les tours de cuir sous la lame
      out.push({geo: LIEN, m: M4o(0, y, 0, Math.PI / 2, 0, 0, .112, .112, .14), c: CUIR, ombre: (x, y, z) => .9 + .12 * Math.max(0, Math.min(1, x / .1 + .5))});
    return out;
  });
  m.userData.manche = w;                  // le bois du manche (la vérification le lit : ses couleurs sont dans les sommets)
  return m;
}
/* La lame de la hache en cuivre (image de Yo, 17 novembre 2026) : du métal lisse, mince au tranchant ; devant le croissant et son
   long crochet en bas, qui revient vers le manche ; derrière un petit talon arrondi. Le tranchant (les colonnes du bout) plus clair */
const LAME_HC = tetePierre({nv: 8, epCentre: .05, creux: 0, lisse: true, tranchant: .79, cotes: [
  {nu: 2, epBord: .045, haut: [[0, .59], [.08, .59], [.125, .585]], bas: [[0, .445], [.08, .445], [.125, .45]],   // le talon
    bout: [[.125, .45], [.165, .46], [.165, .575], [.125, .585]]},
  {nu: 7, us: [0, .2, .38, .54, .68, .75, .79, 1], epBord: .012, haut: [[0, .605], [.25, .615], [.36, .735]],      // la lame
    bas: [[0, .41], [.215, .425], [.235, .155]], bout: [[.235, .155], [.47, .25], [.53, .6], [.36, .735]]}
]});
const RIVET = new THREE.SphereGeometry(1, 8, 6), COLLIER = new THREE.CylinderGeometry(1, 1, 1, 14, 1);
const BANDE = new THREE.LatheGeometry([[.93, -.5], [1, -.38], [1, .38], [.93, .5]].map(([r, y]) => new THREE.Vector2(r, y)), 14);   // une bande de cuir plate autour du manche
const CUIVRE = 0xD86A2C, CUIVRE_CLAIR = 0xF4A55A, CUIVRE_SOMBRE = 0xC25A22, CUIR_SOMBRE = 0x93482A;
/* La hache en cuivre (image de Yo, 17 novembre 2026 : « Voici la hache en cuivre ») : le même manche que la pierre, son bout
   arrondi dépasse au-dessus d'une douille de cuivre qui serre le haut, deux rivets de chaque côté ; la lame lisse en croissant,
   le tranchant plus clair, un petit talon rond derrière ; sous la douille le cuir enroulé, croisé en X. Un seul dessin */
function hacheCuivre(w){
  const m = modeleOutil("hacheCuivre" + w, () => {
    const out = [], bord = LAME_HC.userData.bord;
    out.push({geo: MANCHE, m: M4o(0, 0, 0), c: w, couleur: (x, y) => y > .675 ? new THREE.Color(w).multiplyScalar(1.18).getHex() : w,
      ombre: (x, y, z) => .86 + .2 * Math.max(0, Math.min(1, (x * .6 + z * .2) / .09 + .5))});
    out.push({geo: LAME_HC, m: M4o(0, 0, 0), c: CUIVRE, couleur: (x, y, z, i) => bord[i] ? CUIVRE_CLAIR : CUIVRE,
      ombre: (x, y) => .82 + .24 * Math.max(0, Math.min(1, (y - .2) / .5))});
    const omb = (x, y, z) => .84 + .22 * Math.max(0, Math.min(1, (y - .4) / .22));
    out.push({geo: COLLIER, m: M4o(0, .51, .01, 0, 0, 0, .125, .2, .1), c: CUIVRE_SOMBRE, ombre: omb});                       // la douille
    for(const y of [.607, .413]) out.push({geo: COLLIER, m: M4o(0, y, .01, 0, 0, 0, .135, .026, .11), c: CUIVRE_SOMBRE, ombre: omb}); // ses bords
    for(const sx of [1, -1]) for(const y of [.56, .47])                                                                     // les rivets
      out.push({geo: RIVET, m: M4o(sx * .122, y, .012, 0, 0, 0, .022, .028, .028), c: CUIVRE_CLAIR, ombre: (x, y2, z) => .85 + .2 * Math.max(0, Math.min(1, (y2 - y) / .028 + .5))});
    const omc = (x, y, z) => .9 + .12 * Math.max(0, Math.min(1, x / .1 + .5));
    out.push({geo: BANDE, m: M4o(0, .27, 0, 0, 0, 0, .1, .2, .1), c: CUIR_SOMBRE, ombre: (x, y, z) => .68 * omc(x, y, z)});        // le cuir dessous
    for(const y of [.345, .195]) out.push({geo: BANDE, m: M4o(0, y, 0, 0, 0, 0, .108, .058, .108), c: CUIR_SOMBRE, ombre: omc});   // le cuir
    for(const t of [.5, -.5])                                                                                               // croisé en X
      out.push({geo: BANDE, m: M4o(0, .27, 0, t, 0, 0, .105, .055, .105 / Math.cos(t)), c: CUIR_SOMBRE, ombre: omc});
    return out;
  });
  m.userData.manche = w;
  return m;
}
/* La lame de la hache en bronze (image de Yo, 17 novembre 2026) : plus grande que la cuivre, le croissant plus creusé, le crochet
   plus long, la bande claire du tranchant plus large */
const LAME_HB = tetePierre({nv: 9, epCentre: .05, creux: 0, lisse: true, tranchant: .76, cotes: [
  {nu: 2, epBord: .045, haut: [[0, .565], [.1, .565], [.15, .56]], bas: [[0, .44], [.1, .44], [.15, .445]],          // le talon
    bout: [[.15, .445], [.185, .455], [.185, .55], [.15, .56]]},
  {nu: 7, us: [0, .2, .36, .5, .62, .71, .76, 1], epBord: .012, haut: [[0, .565], [.23, .565], [.335, .725]],          // la lame
    bas: [[0, .43], [.27, .4], [.16, .115]], bout: [[.16, .115], [.5, .2], [.56, .62], [.335, .725]]}
]});
/* L'épaisseur de la lame en bronze à une distance z du manche (pour poser la branche en relief dessus) */
const epLameHB = z => .05 - .038 * Math.min(1, z / .46) ** 1.3;
/* Le cuir de la poignée, en bas du manche : il suit le manche (son rayon, sa courbe) */
const RAYON_MANCHE = [[-.33, .07], [-.3, .11], [-.26, .13], [-.2, .126], [-.12, .108], [-.04, .094], [.1, .092]];
const rayonManche = y => { for(let k = 1; k < RAYON_MANCHE.length; k++){ const [y0, r0] = RAYON_MANCHE[k - 1], [y1, r1] = RAYON_MANCHE[k];
  if(y <= y1) return r0 + (r1 - r0) * Math.max(0, (y - y0) / (y1 - y0)); } return .092; };
const courbeManche = y => y < .2 ? -.07 * ((.2 - y) / .53) ** 2 : 0;
const POIGNEE = (() => {
  const p = []; for(let y = -.255; y <= .005; y += .026) p.push(new THREE.Vector2(rayonManche(y) + .01, y));
  p.unshift(new THREE.Vector2(rayonManche(-.255) - .01, -.265)); p.push(new THREE.Vector2(rayonManche(.005) - .005, .015));
  const g = new THREE.LatheGeometry(p, 14), P = g.attributes.position;
  for(let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) + courbeManche(P.getY(i)));
  g.computeVertexNormals(); return g; })();
const FEUILLE = new THREE.SphereGeometry(1, 7, 4), TIGE = new THREE.CylinderGeometry(1, 1, 1, 5, 1);
const BRONZE = 0xC47A2C, BRONZE_CLAIR = 0xF0BC5E, BRONZE_SOMBRE = 0xA9682A, BRONZE_ANNEAU = 0xCC8A3A, BRONZE_FEUILLE = 0xDB983E;
/* La hache en bronze (image de Yo, 17 novembre 2026 : « Voici la hache en bronze ») : le même manche, son bout arrondi au-dessus
   d'une douille ronde et lisse, un anneau en relief en haut et en bas, un petit talon rond derrière ; la lame dorée en croissant,
   une branche à cinq feuilles en relief des deux côtés ; le cuir enroulé en spirale en bas du manche, là où on le tient, le bout
   de bois qui dépasse en dessous. Un seul dessin */
function hacheBronze(w){
  const m = modeleOutil("hacheBronze" + w, () => {
    const out = [], bord = LAME_HB.userData.bord;
    out.push({geo: MANCHE, m: M4o(0, 0, 0), c: w, couleur: (x, y) => y > .675 ? new THREE.Color(w).multiplyScalar(1.18).getHex() : w,
      ombre: (x, y, z) => .86 + .2 * Math.max(0, Math.min(1, (x * .6 + z * .2) / .09 + .5))});
    out.push({geo: LAME_HB, m: M4o(0, 0, 0), c: BRONZE, couleur: (x, y, z, i) => bord[i] ? BRONZE_CLAIR : BRONZE,
      ombre: (x, y) => .9 + .16 * Math.max(0, Math.min(1, (y - .15) / .5))});
    const omb = (x, y, z) => .82 + .26 * Math.max(0, Math.min(1, (x * .7 + z * .3) / .2 + .5));
    out.push({geo: COLLIER, m: M4o(0, .487, 0, 0, 0, 0, .112, .2, .112), c: BRONZE_SOMBRE, ombre: omb});                     // la douille
    for(const y of [.585, .39]) out.push({geo: COLLIER, m: M4o(0, y, 0, 0, 0, 0, .128, .038, .128), c: BRONZE_ANNEAU, ombre: omb});  // ses anneaux
    const sz = .095, sy = .21, ts = Math.atan2(sz, sy), z0 = .225, y0 = .35;                                         // la branche
    for(const sx of [1, -1]){
      const sur = z => sx * (epLameHB(z) + .001);
      out.push({geo: TIGE, m: M4o(sur(z0 + sz * .45), y0 + sy * .45, z0 + sz * .45, ts, 0, 0, .009, Math.hypot(sz, sy) * .9, .009), c: BRONZE_FEUILLE, ombre: () => 1});
      for(const [t, da] of [[.3, .85], [.3, -.85], [.62, .8], [.62, -.8], [.98, 0]]){
        const a = ts + da, z = z0 + sz * t + Math.sin(a) * .05, y = y0 + sy * t + Math.cos(a) * .05;
        out.push({geo: FEUILLE, m: M4o(sur(z), y, z, a, 0, 0, .009, .052, .024), c: BRONZE_FEUILLE, ombre: (x, y2) => .92 + .14 * Math.max(0, Math.min(1, (y2 - y) / .04 + .5))});
      }
    }
    const omc = (x, y, z) => .9 + .12 * Math.max(0, Math.min(1, x / .1 + .5));
    out.push({geo: POIGNEE, m: M4o(0, 0, 0), c: CUIR_SOMBRE, ombre: (x, y, z) => .72 * omc(x, y, z)});                       // le cuir dessous
    for(const y of [-.215, -.15, -.085, -.025]){                                                                         // en spirale
      const r = rayonManche(y) + .011, t = .3;
      out.push({geo: BANDE, m: M4o(0, y, courbeManche(y), t, 0, 0, r, .046, r / Math.cos(t)), c: CUIR_SOMBRE, ombre: omc});
    }
    return out;
  });
  m.userData.manche = w;
  return m;
}
/* La tête de la pioche en pierre (image de Yo, 17 novembre 2026) : une pierre taillée en arc, ses deux pointes recourbées vers le
   bas, épaisse au milieu, plus mince vers les pointes ; les facettes comme la hache en pierre */
const BRAS_PP = {nu: 5, epBord: .05, haut: [[0, .63], [.3, .675], [.4, .37]], bas: [[0, .46], [.22, .47], [.34, .29]],
  bout: [[.34, .29], [.4, .27], [.43, .32], [.4, .37]]};
const TETE_PP = tetePierre({nv: 6, epCentre: .11, creux: .025, graine: 11, cotes: [BRAS_PP, BRAS_PP]});
/* La pioche en pierre (image de Yo, 17 novembre 2026 : « Voici la pioche de pierre ») : le manche des haches, son bout arrondi
   au-dessus de la pierre ; la tête en arc à facettes ; deux lanières de cuir croisées en X par-dessus, des deux côtés, et trois
   tours de cuir plats dessous. Un seul dessin */
function piochePierre(w){
  const m = modeleOutil("piochePierre" + w, () => {
    const out = [];
    out.push({geo: MANCHE, m: M4o(0, 0, 0), c: w, couleur: (x, y) => y > .675 ? new THREE.Color(w).multiplyScalar(1.18).getHex() : w,
      ombre: (x, y, z) => .86 + .2 * Math.max(0, Math.min(1, (x * .6 + z * .2) / .09 + .5))});
    out.push({geo: TETE_PP, m: M4o(0, 0, 0), c: 0xB2A69F, ombre: (x, y) => .82 + .24 * Math.max(0, Math.min(1, (y - .35) / .3))});
    for(const sx of [1, -1]) for(const a of [.55, -.55])                                        // les deux lanières en X, des deux côtés
      out.push({geo: LANIERE, m: M4o(sx * .12, .53, 0, a * sx, sx > 0 ? 0 : Math.PI, 0, .028, .2, .075), c: CUIR, ombre: (x, y) => .86 + .2 * Math.max(0, Math.min(1, (y - .45) / .2))});
    for(const y of [.42, .375, .33])                                                                  // les tours de cuir dessous
      out.push({geo: BANDE, m: M4o(0, y, 0, 0, 0, 0, .107, .04, .107), c: CUIR, ombre: (x, y, z) => .88 + .14 * Math.max(0, Math.min(1, x / .1 + .5))});
    return out;
  });
  m.userData.manche = w;
  return m;
}
/* Les outils refaits, pour leur icône (icones.js) : leur modèle, le manche dans le bois donné */
export const OUTILS_REFAITS = {hachePierre, hacheCuivre, hacheBronze, piochePierre};
const MEUBLES_MUR = new Set(["torchereMurale", "lanterneMurale"]);     // en main, on les tient par leur plaque
/* Une flèche en vol (la chasse, et l'arc contre les monstres) : la tige, la pointe de son métal, l'empennage rouge ;
   elle pointe vers +z */
const POINTE = {fleche: 0x8E949C, flecheCuivre: 0xC8743C, flecheBronze: 0xB98A4A};
export function flecheModele(f){
  const g = new THREE.Group();
  const tige = part(G.cyl, 0x8A5A32, .02, .5, .02, 0, 0, 0); tige.rotation.x = Math.PI / 2; g.add(tige);
  const pointe = part(G.cone, POINTE[f] || 0x8E949C, .05, .1, .05, 0, 0, .28); pointe.rotation.x = Math.PI / 2; g.add(pointe);
  for(const r of [0, Math.PI / 2]){ const pl = part(G.box, 0xE4574C, .005, .06, .1, 0, 0, -.22); pl.rotation.z = r; g.add(pl); }
  return g;
}
/* Le modèle d'un outil (une clé de OUTILS) ou d'une graine (une clé de GRAINES) */
export function makeOutil(k){
  const g = new THREE.Group();
  if(GRAINES[k]) graine(g);
  else if(POSABLES[k]){                             // un coffre ou un rocher à poser
    const c = POSABLES[k].pose === "coffre" ? makeMeuble("coffre") : rockMesh(POSABLES[k].pose, .5);
    c.scale.multiplyScalar(POSABLES[k].pose === "coffre" ? .22 : .4); c.position.y = .05; g.add(c); return g;
  }
  else if(enMainDehors(k)){                         // une lumière à poser dehors (torchère, chandelle, feu de camp…) ou à accrocher
    const c = makeMeuble(k); c.scale.multiplyScalar(k === "feuCamp" ? .32 : k === "lampadaire" ? .3 : .42);
    if(MEUBLES_MUR.has(k)) c.position.set(0, -.45, 0); else c.position.y = .05;
    g.add(c); return g;
  }
  else if(CHEMIN_DE[k]) matiere(g, k);
  else if(OUTILS_REFAITS[k]) g.add(OUTILS_REFAITS[k](teinteManche((state.manches || {})[k])));   // refaits d'après les images de Yo
  else BUILD[OUTILS[k].famille](g, OUTILS[k], aUnManche(k) ? teinteManche((state.manches || {})[k]) : C.wood);   // le manche dans l'essence choisie (Yo, 16 novembre 2026)
  g.scale.set(1.6, 1.25, 1.6);          // plus épais que nature, pour bien le voir sur un téléphone (style jouet)
  return g;
}
