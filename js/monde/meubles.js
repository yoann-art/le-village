/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part, toon, fusionner, MAT_UNI } from "./formes.js";
import { MEUBLES, COULEURS, ATELIERS, couleurMeuble } from "../donnees.js";
import { pierreMesh } from "./rochers.js";

const C = {wood:0x8B5A3C, light:0xB07A4A, dark:0x654028, metal:0x6F7884, gold:0xE2B24D, white:0xF4EFE6, blue:0x4E6DB3,
  red:0xA9322A, cream:0xE8C48A, stone:0xAEB0B3, stone2:0x8E9195, soot:0x2A2522, clay:0xC8643C, leaf:0x57B25C, yellow:0xF2C14E};
/* Ce qui brille : les flammes et la lumière des lanternes (les flammes vacillent : lumieres.js) */
export const fireMat = toon({color:0xFF8A3D, emissive:0xFF5A00, emissiveIntensity:.9});
const glowMat = toon({color:0xFFE3A3, emissive:0xFFB347, emissiveIntensity:.8});
/* Le verre des lanternes qui s'allument seules à la nuit tombée (lumieres.js règle leur éclat), et les lucioles du bocal */
export const nuitMat = toon({color:0xFFEFC8, emissive:0xFFC060, emissiveIntensity:.1});
export const lucioleMat = toon({color:0xE8FF9A, emissive:0xC8F060, emissiveIntensity:.9});
/* Une lumière éteinte (gestes.js) : plus de flamme, le verre sans lueur */
const verreEteint = toon({color:0xD8D2C0});
const CUIVRE = 0xC8743C;
/* Le verre de la vitrine : on voit au travers */
const verreMat = toon({color:0xD8EEF8, transparent:true, opacity:.3, depthWrite:false});

/* Couleur « d'origine » de la partie principale de chaque meuble */
const ORIGIN = {chaise:C.wood, fauteuil:C.wood, tableBanquet:C.wood, armoire:C.wood, tabouret:C.wood, pot:C.clay, lanterne:C.dark, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, vitrine:C.wood, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue, statue:C.stone,
  chandelier:0xD8DCE2, chandelle:0xB88A4A, torchere:C.wood, torchereMurale:0xC8743C, feuCamp:C.stone, lanterneMurale:0xC8743C,
  bocalLucioles:C.wood, brasero:0xC8743C, lampadaire:C.dark, lustre:0xB98A4A, etabli:C.wood, atelierDeco:C.light, tableTaille:C.stone2, comptoir:C.red, fourneau:C.stone, enclume:0x4A4F57, trone:C.dark};

/* ---------- Les meubles refaits d'après les images de Yo (chantier de la décoration, étape 3) ----------
   Un seul dessin chacun : leurs morceaux fusionnés, aux couleurs par sommet (MAT_UNI) ; tout le meuble de la couleur de sa
   matière (sa teinte), l'ombre douce peinte (le dessus plus clair, le dessous plus sombre). La forme est faite une fois par
   couleur, puis partagée. */
export const MEUBLES_REFAITS = ["tabouret", "chaise", "fauteuil", "banc", "table", "tableBanquet", "lit", "etagere", "armoire", "tonneau", "vitrine"];
const formes = new Map();
const ombreBois = (y0, y1) => (x, y) => .82 + .26 * Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
function modeleBois(type, hex, morceaux){
  const cle = type + hex;
  if(!formes.has(cle)) formes.set(cle, fusionner(morceaux(hex)));
  const mesh = new THREE.Mesh(formes.get(cle), MAT_UNI); mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
/* Le tabouret (image de Yo, 7 novembre 2026 : « Voici le tabouret ») : une épaisse assise ronde au bord tout arrondi, le dessus
   à peine bombé ; trois gros pieds ronds, un peu plus larges en bas, au bout arrondi, écartés vers l'extérieur ; tout d'un
   seul bois ; plus haut que large, comme l'image. Le dessus de l'assise à .46 (gestes.js s'y assoit) */
const ASSISE = new THREE.LatheGeometry([[0, 0], [.15, 0], [.192, .012], [.214, .045], [.222, .085], [.218, .123], [.2, .152], [.16, .166], [0, .17]]
  .map(([x, y]) => new THREE.Vector2(x, y)), 28);
const PIED = (() => { const p = []; for(let k = 0; k <= 6; k++){ const a = k / 6 * Math.PI / 2; p.push(new THREE.Vector2(.068 * Math.sin(a), -.068 * Math.cos(a))); }   // le bout arrondi
  p.push(new THREE.Vector2(.06, .3), new THREE.Vector2(0, .3)); return new THREE.LatheGeometry(p, 12); })();
function tabouretMorceaux(c){
  const o = ombreBois(0, .46), out = [{geo: ASSISE, m: M4(0, .29, 0), c, ombre: o}];   // l'assise, épaisse, de .29 à .46
  for(let k = 0; k < 3; k++){
    const a = k * Math.PI * 2 / 3 + Math.PI, bas = {x: Math.sin(a) * .2, z: Math.cos(a) * .2}, haut = {x: Math.sin(a) * .1, z: Math.cos(a) * .1};
    const dx = haut.x - bas.x, dz = haut.z - bas.z, L = Math.hypot(dx, .25, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, .25, dz).normalize());
    out.push({geo: PIED, m: new THREE.Matrix4().compose(new THREE.Vector3(bas.x, .066, bas.z), q, new THREE.Vector3(1, L / .3 * .95, 1)), c, ombre: o});
  }
  return out;
}

/* Une boîte aux arêtes et aux coins tout arrondis (rayon r), centrée sur l'origine */
function boiteRonde(w, h, d, r, m = 4, f = [1, 1, 1]){   // m : les sommets dans l'arrondi ; f : les parts du plat (pour le cintrer)
  const n = f.map(x => x + m), g = new THREE.BoxGeometry(2, 2, 2, 2 * n[0], 2 * n[1], 2 * n[2]), P = g.attributes.position, N = g.attributes.normal;
  const v = new THREE.Vector3(), c = new THREE.Vector3(), demi = [w / 2, h / 2, d / 2];
  const cale = (t, k) => { const a = Math.round(Math.abs(t) * n[k]), p = demi[k] - r;
    return Math.sign(t) * (a <= f[k] ? p * a / f[k] : p + r * (a - f[k]) / m); };
  for(let i = 0; i < P.count; i++){
    v.set(cale(P.getX(i), 0), cale(P.getY(i), 1), cale(P.getZ(i), 2));
    c.set(Math.max(r - demi[0], Math.min(demi[0] - r, v.x)), Math.max(r - demi[1], Math.min(demi[1] - r, v.y)), Math.max(r - demi[2], Math.min(demi[2] - r, v.z)));
    v.sub(c).normalize(); N.setXYZ(i, v.x, v.y, v.z); P.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r);
  }
  return g;
}
/* Un bâton rond : le bout du bas arrondi (bas), le haut arrondi (haut) ou plat, hauteur h, rayon r */
function baton(r, h, bas, haut, seg = 12){
  const p = [], k = 4;
  if(bas) for(let j = 0; j <= k; j++){ const a = j / k * Math.PI / 2; p.push(new THREE.Vector2(r * Math.sin(a), r - r * Math.cos(a))); }
  else p.push(new THREE.Vector2(0, 0), new THREE.Vector2(r, 0));
  if(haut) for(let j = 0; j <= k; j++){ const a = j / k * Math.PI / 2; p.push(new THREE.Vector2(r * Math.cos(a), h - r + r * Math.sin(a))); }
  else p.push(new THREE.Vector2(r, h), new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(p, seg);
}
/* La chaise (image de Yo, 7 novembre 2026 : « Voici la chaise ») : une assise carrée épaisse aux bords tout arrondis ; quatre gros
   pieds ronds au bout arrondi, un peu écartés ; deux montants ronds au bout arrondi, posés sur l'arrière de l'assise et un peu
   penchés en arrière ; trois barreaux plats et arrondis entre eux, cintrés (le milieu un peu plus haut et en arrière). Tout d'un
   seul bois. Le dessus de l'assise à .46, comme le tabouret (gestes.js s'y assoit) ; le devant regarde vers +z */
const CH = {haut: .46, ep: .155, larg: .6, prof: .58};
const CH_ASSISE = boiteRonde(CH.larg, CH.ep, CH.prof, .075, 3);
const CH_PIED = baton(.072, .36, true, false, 10);
const CH_MONTANT = baton(.078, .56, false, true, 10);
const CH_BARREAU = (() => { const g = boiteRonde(.42, .1, .07, .032, 2, [4, 1, 1]), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const u = P.getX(i) / .21, b = 1 - u * u; P.setY(i, P.getY(i) + .022 * b); P.setZ(i, P.getZ(i) - .03 * b); }
  g.computeVertexNormals(); return g; })();
function chaiseMorceaux(c){
  const o = ombreBois(0, 1), out = [{geo: CH_ASSISE, m: M4(0, CH.haut - CH.ep / 2, 0), c, ombre: o}];
  const yBas = CH.haut - CH.ep + .02;                                  // les pieds entrent un peu dans l'assise
  for(const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
    const bas = new THREE.Vector3(sx * .26, 0, sz * .25), haut = new THREE.Vector3(sx * .2, yBas, sz * .19), dir = haut.clone().sub(bas);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    out.push({geo: CH_PIED, m: new THREE.Matrix4().compose(bas, q, new THREE.Vector3(1, dir.length() / .36, 1)), c, ombre: o});
  }
  const pente = .09, z0 = -CH.prof / 2 + .085, y0 = CH.haut - .03;   // les montants : sur l'arrière de l'assise, penchés en arrière
  for(const sx of [-1, 1]) out.push({geo: CH_MONTANT, m: M4(sx * .215, y0, z0, -pente), c, ombre: o});
  for(const y of [.16, .29, .42]) out.push({geo: CH_BARREAU, m: M4(0, y0 + y, z0 - Math.sin(pente) * y, -pente), c, ombre: o});
  return out;
}

/* Le fauteuil (image de Yo, 7 novembre 2026 : « Voici le fauteuil ») : deux gros coussins dodus de lin écru (l'assise et le dos),
   bombés ; tout autour un bois rond et doux : deux montants arrière plus hauts que le dossier, un peu plus épais en haut,
   penchés en arrière, reliés par un haut de dossier cintré ; deux gros accoudoirs ronds qui dépassent devant, sur deux
   montants avant ; une ceinture de bois sous l'assise ; les pieds courts et ronds sont le bas des montants. Le bois prend la
   couleur (sa teinte) ; les coussins restent en lin écru. Le dessus de l'assise à .52 (gestes.js s'y assoit) ; le devant vers +z */
const LIN = 0xE8DCC0;
/* Un coussin : une boîte ronde dont une face est bombée (axe 1 : le dessus, axe 2 : le devant) */
function coussin(w, h, d, r, bombe, axe){
  const g = boiteRonde(w, h, d, r, 3, axe === 1 ? [3, 1, 3] : [3, 3, 1]), P = g.attributes.position, demi = [w / 2, h / 2, d / 2];
  const [a, b] = axe === 1 ? [0, 2] : [0, 1];
  for(let i = 0; i < P.count; i++){
    const v = [P.getX(i), P.getY(i), P.getZ(i)];
    if(v[axe] <= 0) continue;
    const u = v[a] / demi[a], t = v[b] / demi[b], k = Math.max(0, 1 - u * u) * Math.max(0, 1 - t * t) * (v[axe] / demi[axe]);
    v[axe] += bombe * k; P.setXYZ(i, v[0], v[1], v[2]);
  }
  g.computeVertexNormals(); return g;
}
/* Un montant rond, un peu plus épais en haut (r0 en bas, r1 en haut), les deux bouts arrondis */
function fuseau(r0, r1, h, seg = 10){
  const p = [];
  for(let j = 0; j <= 3; j++){ const a = j / 3 * Math.PI / 2; p.push(new THREE.Vector2(r0 * Math.sin(a), r0 - r0 * Math.cos(a))); }
  for(let j = 0; j <= 4; j++){ const a = j / 4 * Math.PI / 2; p.push(new THREE.Vector2(r1 * Math.cos(a), h - r1 + r1 * Math.sin(a))); }
  return new THREE.LatheGeometry(p, seg);
}
const FT = {x: .45, zAv: .29, zAr: -.31, haut: .52, pente: .07};
const FT_ARRIERE = fuseau(.092, .112, 1.04);
const FT_AVANT = baton(.098, .62, true, false, 10);
const FT_ACCOUDOIR = baton(.106, .84, true, true, 12);
const FT_FACE = boiteRonde(.86, .15, .12, .045, 2);                      // la ceinture : devant et derrière
const FT_COTE = boiteRonde(.12, .15, .58, .045, 2);                      // la ceinture : les côtés
const FT_HAUT = (() => { const g = boiteRonde(.8, .16, .1, .045, 2, [4, 1, 1]), P = g.attributes.position;   // le haut du dossier, cintré
  for(let i = 0; i < P.count; i++){ const u = P.getX(i) / .4, b = 1 - u * u; P.setY(i, P.getY(i) + .055 * b); }
  g.computeVertexNormals(); return g; })();
const FT_ASSISE = coussin(.8, .22, .68, .08, .04, 1);
const FT_DOS = coussin(.72, .52, .2, .08, .05, 2);
function fauteuilMorceaux(c){
  const o = ombreBois(0, 1.1), ol = ombreBois(.1, 1.1), out = [];
  for(const sx of [-1, 1]){
    out.push({geo: FT_ARRIERE, m: M4(sx * FT.x, 0, FT.zAr, -FT.pente), c, ombre: o});             // les montants arrière (et leurs pieds)
    out.push({geo: FT_AVANT, m: M4(sx * FT.x, 0, FT.zAv), c, ombre: o});                         // les montants avant (et leurs pieds)
    out.push({geo: FT_ACCOUDOIR, m: M4(sx * (FT.x + .01), .66, FT.zAr - .07, Math.PI / 2, 0, 0, .95, 1, .95), c, ombre: o});   // les accoudoirs, qui dépassent devant
    out.push({geo: FT_COTE, m: M4(sx * FT.x, .27, (FT.zAv + FT.zAr) / 2), c, ombre: o});         // la ceinture, sur les côtés
  }
  out.push({geo: FT_FACE, m: M4(0, .27, FT.zAv), c, ombre: o}, {geo: FT_FACE, m: M4(0, .27, FT.zAr), c, ombre: o});
  out.push({geo: FT_HAUT, m: M4(0, .95, FT.zAr - .95 * FT.pente - .01, -FT.pente), c, ombre: o});   // le haut du dossier
  out.push({geo: FT_ASSISE, m: M4(0, FT.haut - .22 / 2 - .04, .05), c: LIN, ombre: ol});        // le coussin de l'assise, bombé
  out.push({geo: FT_DOS, m: M4(0, .78, -.21, -.15), c: LIN, ombre: ol});                         // le coussin du dos, penché
  return out;
}

/* Le banc (image de Yo, 7 novembre 2026 : « Voici le banc ») : une épaisse planche aux bouts tout arrondis vue de dessus (une
   pilule), le bord tout rond ; deux gros pieds pleins, plus larges en bas, aux arêtes arrondies, un peu rentrés sous la
   planche. Tout d'un seul bois. Le dessus à .4, comme avant (gestes.js : deux places, de chaque côté) */
const BC = {long: 1.4, prof: .5, ep: .17, R: .21};
/* Une galette : vue de dessus un rectangle aux coins arrondis (rayon R), le bord tout rond (rayon r), épaisse de h ; lisse,
   sans couture (le tour suit le bord, le dessus et le dessous en éventail) */
function galette(L, D, h, R, r, nc = 7, nr = 4){
  const ax = L / 2 - R, az = D / 2 - R, tour = [];                      // le tour : centre du coin + (R − r) vers la normale
  for(const [sx, sz, a0] of [[1, 1, 0], [-1, 1, Math.PI / 2], [-1, -1, Math.PI], [1, -1, Math.PI * 1.5]])
    for(let k = 0; k <= nc; k++){ const a = a0 + k / nc * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a);
      tour.push([sx * ax + (R - r) * nx, sz * az + (R - r) * nz, nx, nz]); }
  const prof = [];                                                     // le bord : du dessous au dessus, [écart, y, normale en écart, normale en y]
  for(let k = 0; k <= nr; k++){ const a = k / nr * Math.PI / 2; prof.push([r * Math.sin(a), -h / 2 + r - r * Math.cos(a), Math.sin(a), -Math.cos(a)]); }
  for(let k = 1; k <= nr; k++){ const a = k / nr * Math.PI / 2; prof.push([r * Math.cos(a), h / 2 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  const pos = [], nor = [], idx = [], T = tour.length, Pn = prof.length;
  for(const [o, y, no, ny] of prof) for(const [x, z, nx, nz] of tour){ pos.push(x + nx * o, y, z + nz * o); nor.push(nx * no, ny, nz * no); }
  for(let j = 0; j < Pn - 1; j++) for(let i = 0; i < T; i++){ const i2 = (i + 1) % T, a = j * T + i, b = j * T + i2, c = (j + 1) * T + i, d = (j + 1) * T + i2;
    idx.push(a, c, b, b, c, d); }
  for(const [y, ny, rang] of [[-h / 2, -1, 0], [h / 2, 1, Pn - 1]]){     // le dessous et le dessus, en éventail
    const c0 = pos.length / 3; pos.push(0, y, 0); nor.push(0, ny, 0);
    const d0 = pos.length / 3; for(const [x, z] of tour){ pos.push(x, y, z); nor.push(0, ny, 0); }
    for(let i = 0; i < T; i++){ const i2 = (i + 1) % T; if(ny > 0) idx.push(c0, d0 + i2, d0 + i); else idx.push(c0, d0 + i, d0 + i2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
const BC_PLANCHE = galette(BC.long, BC.prof, BC.ep, BC.R, .08);
const BC_PIED = (() => { const h = .3, g = boiteRonde(.22, h, .42, .06, 2, [1, 2, 1]), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const t = .5 - P.getY(i) / h; P.setX(i, P.getX(i) * (.82 + .5 * t)); P.setZ(i, P.getZ(i) * (.96 + .1 * t)); }   // plus large en bas
  g.computeVertexNormals(); return g; })();
function bancMorceaux(c){
  const o = ombreBois(0, .4), out = [{geo: BC_PLANCHE, m: M4(0, .4 - BC.ep / 2, 0), c, ombre: o}];
  for(const sx of [-1, 1]) out.push({geo: BC_PIED, m: M4(sx * .44, .14, 0), c, ombre: o});
  return out;
}

/* La table (image de Yo, 7 novembre 2026 : « Voici la table ») : un épais plateau aux coins arrondis et au bord tout rond (une
   galette) ; dessous, une ceinture de quatre traverses arrondies, un peu en retrait ; quatre gros pieds ronds au bout arrondi,
   droits, sous les coins. Tout d'un seul bois. Le plateau monté de ½ P à ¾ P, la bonne hauteur à côté d'une chaise (choix de
   Yo : « Plus haute, même place au sol ») ; sa taille au sol ne change pas (2 × 1,4) */
const TB = {long: 1.96, prof: 1.3, ep: .17, haut: .75, px: .76, pz: .44};
const TB_PLATEAU = galette(TB.long, TB.prof, TB.ep, .2, .08);
const TB_PIED = baton(.13, TB.haut - TB.ep + .03, true, false, 12);
const TB_LONG = boiteRonde(2 * TB.px, .13, .09, .04, 2);
const TB_COURT = boiteRonde(.09, .13, 2 * TB.pz, .04, 2);
function tableMorceaux(c){
  const o = ombreBois(0, TB.haut), y = TB.haut - TB.ep, out = [{geo: TB_PLATEAU, m: M4(0, TB.haut - TB.ep / 2, 0), c, ombre: o}];
  for(const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) out.push({geo: TB_PIED, m: M4(sx * TB.px, 0, sz * TB.pz), c, ombre: o});
  for(const s of [-1, 1]) out.push({geo: TB_LONG, m: M4(0, y - .05, s * TB.pz), c, ombre: o}, {geo: TB_COURT, m: M4(s * TB.px, y - .05, 0), c, ombre: o});
  return out;
}

/* La grande table de banquet (image de Yo, 7 novembre 2026 : « Voici la grande table de banquet » ; « Adapte la taille par
   rapport à la table ordinaire ») : un très long plateau épais aux coins arrondis et au bord tout rond (une galette) ; six
   pieds tournés, renflés au milieu, avec leurs anneaux et une boule en bas. Tout d'un seul bois. À la hauteur de la table
   (¾ P), plus longue et un peu moins large qu'elle (3,2 × 1,1) */
const BQ = {long: 3.16, prof: 1.06, ep: .17, haut: .75, px: 1.36, pz: .36};
const BQ_PLATEAU = galette(BQ.long, BQ.prof, BQ.ep, .16, .08, 6, 4);
const BQ_PIED = (() => { const h = BQ.haut - BQ.ep + .03, p = [[0, 0], [.06, .004], [.09, .03], [.1, .065], [.09, .1], [.075, .12], [.088, .14], [.075, .16],
    [.068, .19], [.09, .25], [.105, .32], [.1, .38], [.08, .43], [.066, .47], [.08, .5], [.085, .52], [.07, .54], [.075, .57], [.08, h], [0, h]];   // le profil tourné
  const lisse = new THREE.SplineCurve(p.slice(1, -1).map(([r, y]) => new THREE.Vector2(r * 1.15, y))).getPoints(22);   // un profil lisse, sans cassure
  return new THREE.LatheGeometry([new THREE.Vector2(0, 0), ...lisse, new THREE.Vector2(0, h)], 20); })();
function tableBanquetMorceaux(c){
  const o = ombreBois(0, BQ.haut), out = [{geo: BQ_PLATEAU, m: M4(0, BQ.haut - BQ.ep / 2, 0), c, ombre: o}];
  /* les pieds tournés : la lumière comme sur un pied droit (la normale presque à plat), pour que l'ombre du renflement ne
     dessine pas une spirale ; le renflement se lit par son contour */
  const droite = (x, y, z, n) => Math.abs(n.y) > .97 ? n : n.set(n.x, n.y * .25, n.z).normalize();
  for(const x of [-BQ.px, 0, BQ.px]) for(const sz of [-1, 1]) out.push({geo: BQ_PIED, m: M4(x, 0, sz * BQ.pz), c, ombre: o, normale: droite});
  return out;
}

/* Le lit (image de Yo, 7 novembre 2026 : « Voici le lit ») : un cadre de chêne tout rond (le bois de départ des meubles) :
   quatre gros montants ronds au bout arrondi, plus hauts à la tête ; une tête de lit cintrée entre eux ; des traverses
   arrondies autour du matelas. Un matelas au drap blanc, un oreiller dodu penché contre la tête, la couverture (la couleur du
   lit : lin écru au départ, puis les teintures) et le drap blanc replié dessus. La couverture à .5 (gestes.js s'y allonge) ;
   la tête vers −z, le pied vers +z, la taille au sol comme avant (1,4 × 2,2) */
const LT = {x: .58, zT: -1, zP: 1, bois: 0xC8955A, blanc: 0xFBFAF7};
const LT_TETE_MONTANT = baton(.15, 1.18, true, true, 12);
const LT_PIED_MONTANT = baton(.15, .8, true, true, 12);
const LT_TETE = (() => { const g = boiteRonde(1.1, .62, .13, .055, 2, [4, 2, 1]), P = g.attributes.position;   // la tête de lit, cintrée en haut
  for(let i = 0; i < P.count; i++){ if(P.getY(i) <= 0) continue; const u = P.getX(i) / .55, k = P.getY(i) / .31; P.setY(i, P.getY(i) + .13 * (1 - u * u) * k); }
  g.computeVertexNormals(); return g; })();
const LT_COTE = boiteRonde(.12, .2, 1.9, .05, 2);
const LT_TRAVERSE = boiteRonde(1.1, .2, .12, .05, 2);
const LT_MATELAS = boiteRonde(1.06, .17, 1.84, .06, 3);
const LT_COUVERTURE = coussin(1.14, .2, 1.3, .05, .02, 1);           // elle retombe sur les côtés du matelas
const LT_DRAP = coussin(1.15, .21, .3, .055, .015, 1);
const LT_OREILLER = coussin(.84, .2, .5, .08, .07, 1);
function litMorceaux(c){
  const o = ombreBois(0, 1.2), ol = ombreBois(.2, 1), b = LT.bois, out = [];
  for(const sx of [-1, 1]){
    out.push({geo: LT_TETE_MONTANT, m: M4(sx * LT.x, 0, LT.zT), c: b, ombre: o}, {geo: LT_PIED_MONTANT, m: M4(sx * LT.x, 0, LT.zP), c: b, ombre: o});
    out.push({geo: LT_COTE, m: M4(sx * LT.x, .3, 0), c: b, ombre: o});
  }
  out.push({geo: LT_TETE, m: M4(0, .68, LT.zT), c: b, ombre: o}, {geo: LT_TRAVERSE, m: M4(0, .3, LT.zP), c: b, ombre: o}, {geo: LT_TRAVERSE, m: M4(0, .3, LT.zT), c: b, ombre: o});
  out.push({geo: LT_MATELAS, m: M4(0, .37, 0), c: LT.blanc, ombre: ol});                              // le matelas et son drap
  out.push({geo: LT_OREILLER, m: M4(0, .62, -.8, -.75), c: LT.blanc, ombre: ol});                      // l'oreiller, penché contre la tête
  out.push({geo: LT_COUVERTURE, m: M4(0, .4, .3), c, ombre: ol});                                      // la couverture : la couleur du lit
  out.push({geo: LT_DRAP, m: M4(0, .425, -.43), c: LT.blanc, ombre: ol});                                // le drap replié par-dessus
  return out;
}


/* L'étagère (image de Yo, 8 novembre 2026 : « Voici l'étagère ») : deux gros côtés épais au haut tout arrondi, une encoche en
   bas qui fait deux petits pieds ; une traverse cintrée en haut, entre eux ; un fond de planches verticales ; quatre tablettes
   épaisses au bord arrondi. Tout d'un seul bois, vide comme l'image (poser des choses dessus : plus tard). La place au sol
   comme avant (1,4 × 0,5), un peu plus haute (1,8) ; le devant vers +z */
const ET = {x: .6, haut: 1.8, prof: .46, pied: .14};
const ET_COTE = (() => { const H = ET.haut, r = .105, g = boiteRonde(.22, H, ET.prof, r, 3, [1, 1, 3]), P = g.attributes.position;
  for(let i = 0; i < P.count; i++) if(P.getY(i) < -H / 2 + r + .001 && Math.abs(P.getZ(i)) < .09) P.setY(i, P.getY(i) + ET.pied);   // l'encoche : deux petits pieds
  g.computeVertexNormals(); return g; })();
const ET_ARC = (() => { const g = boiteRonde(1.04, .24, .16, .05, 2, [4, 1, 1]), P = g.attributes.position;   // la traverse, cintrée
  for(let i = 0; i < P.count; i++){ const u = P.getX(i) / .52; P.setY(i, P.getY(i) + .11 * (1 - u * u)); }
  g.computeVertexNormals(); return g; })();
const ET_PLANCHE = boiteRonde(.255, 1.46, .05, .02, 1);           // son haut caché dans la traverse
const ET_TABLETTE = boiteRonde(1.04, .1, .4, .045, 2);
function etagereMorceaux(c){
  const o = ombreBois(0, ET.haut), out = [];
  for(const sx of [-1, 1]){
    out.push({geo: ET_COTE, m: M4(sx * ET.x, ET.haut / 2, 0), c, ombre: o});
  }
  out.push({geo: ET_ARC, m: M4(0, 1.54, -.12), c, ombre: o});
  for(let k = 0; k < 4; k++) out.push({geo: ET_PLANCHE, m: M4((k - 1.5) * .255, .14 + .73, -.19), c, ombre: o});   // le fond
  for(const y of [.22, .58, .94, 1.3]) out.push({geo: ET_TABLETTE, m: M4(0, y, .03), c, ombre: o});
  return out;
}

/* L'armoire (image de Yo, 8 novembre 2026 : « Voici l'armoire ») : un objet nouveau. Un gros caisson aux bords arrondis sur un
   socle épais et quatre petits pieds ronds ; en haut, une corniche épaisse au grand chapeau cintré, ses rebords dépassant sur
   les côtés ; deux portes au haut cintré (la courbe du chapeau), chacune avec son panneau en relief ; deux boutons ronds de
   cuivre (leur couleur ne change pas avec le bois). 1,3 × 0,7 au sol, 2,1 de haut ; le devant vers +z */
const AR = {larg: 1.16, prof: .58, bas: .32, haut: 1.82, cuivre: 0xB0602A};
const arcAR = x => { const a = Math.abs(x), t = Math.min(1, Math.max(0, (.66 - a) / .2)), d = Math.max(0, 1 - (x / .66) ** 2);
  return .26 * d * t * t * (3 - 2 * t); };          // le chapeau : un dôme rond au milieu, une courbe douce vers les rebords plats
function cintrer(g, x0, haut){   // monte le haut d'une forme suivant le chapeau (x0 : sa place en x)
  const P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const y = P.getY(i), k = haut ? Math.max(0, y / haut) : 1; P.setY(i, y + arcAR(P.getX(i) + x0) * k); }
  g.computeVertexNormals(); return g;
}
const AR_PIED = baton(.11, .22, true, false, 10);
const AR_SOCLE = boiteRonde(1.32, .16, .68, .07, 2);
const AR_CORPS = cintrer(boiteRonde(AR.larg, AR.haut - AR.bas, AR.prof, .06, 2, [6, 2, 1]), 0, (AR.haut - AR.bas) / 2);
const AR_CHAPEAU = cintrer(boiteRonde(1.36, .22, .7, .09, 2, [10, 1, 1]), 0, 0);
const AR_PORTE = [-1, 1].map(s => cintrer(boiteRonde(.44, 1.36, .06, .03, 2, [2, 3, 1]), s * .23, .68));
const AR_PANNEAU = [-1, 1].map(s => cintrer(boiteRonde(.3, 1.1, .05, .025, 1, [2, 3, 1]), s * .23, .55));
const AR_BOUTON = new THREE.SphereGeometry(.058, 10, 8);
function armoireMorceaux(c){
  const o = ombreBois(0, 2.1), out = [], zP = AR.prof / 2 - .02 + .03;
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: AR_PIED, m: M4(sx * .5, 0, sz * .22), c, ombre: o});
  out.push({geo: AR_SOCLE, m: M4(0, .24, 0), c, ombre: o});
  out.push({geo: AR_CORPS, m: M4(0, (AR.bas + AR.haut) / 2, -.02), c, ombre: o});
  out.push({geo: AR_CHAPEAU, m: M4(0, AR.haut + .07, -.01), c, ombre: o});
  [-1, 1].forEach((s, i) => {
    out.push({geo: AR_PORTE[i], m: M4(s * .23, 1.04, zP), c, ombre: o});
    out.push({geo: AR_PANNEAU[i], m: M4(s * .23, 1.06, zP + .045), c, ombre: o});
    out.push({geo: AR_BOUTON, m: M4(s * .085, 1.02, zP + .07), c: AR.cuivre, ombre: o});
  });
  return out;
}

/* Le tonneau (image de Yo, 8 novembre 2026 : « Voici le tonneau ») : bombé, plus large au milieu ; douze douelles, le joint
   entre elles un petit creux peint plus sombre ; en haut, un gros rebord rond et un couvercle de trois planches ; deux larges
   cerclages de cuivre et leurs rivets ronds (leur couleur ne change pas avec le bois). 0,7 × 0,7 au sol, .84 de haut */
const TN = {H: .84, bas: .285, ventre: .35, n: 12, cuivre: 0xB0602A};
const rayonTN = y => TN.bas + (TN.ventre - TN.bas) * Math.sin(Math.PI * Math.min(1, Math.max(0, y / TN.H)));
const jointTN = (x, z) => { const t = (Math.atan2(z, x) / (2 * Math.PI) * TN.n % 1 + 1) % 1; return Math.max(0, 1 - Math.min(t, 1 - t) / .045); };   // 1 sur un joint
const TN_CORPS = (() => { const p = []; for(let k = 0; k <= 14; k++){ const y = (TN.H - .06) * k / 14; p.push(new THREE.Vector2(rayonTN(y), y)); }
  const g = new THREE.LatheGeometry(p, 48), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const x = P.getX(i), z = P.getZ(i), f = 1 - .01 * jointTN(x, z); P.setX(i, x * f); P.setZ(i, z * f); }
  g.computeVertexNormals(); return g; })();
const TN_REBORD = (() => { const p = [], R = rayonTN(TN.H - .05), r = .045; for(let k = 0; k <= 10; k++){ const a = -Math.PI / 2 + k / 10 * Math.PI;
    p.push(new THREE.Vector2(R - .01 + r * Math.cos(a), TN.H - r + r * Math.sin(a))); }
  p.unshift(new THREE.Vector2(R - .03, TN.H - 2 * .045)); p.push(new THREE.Vector2(R - .06, TN.H), new THREE.Vector2(R - .06, TN.H - .05));   // le bord intérieur
  return new THREE.LatheGeometry(p, 40); })();
const TN_COUVERCLE = new THREE.CylinderGeometry(.24, .24, .03, 32);
const TN_RAINURE = new THREE.BoxGeometry(.44, .008, .012);
const TN_CERCLE = y0 => { const p = [], h = .12; for(let k = 0; k <= 6; k++){ const y = y0 - h / 2 + h * k / 6, b = k === 0 || k === 6 ? .008 : .022; p.push(new THREE.Vector2(rayonTN(y) + b, y)); }
  return new THREE.LatheGeometry(p, 48); };
const TN_HAUTS = [.2, .6], TN_CERCLES = TN_HAUTS.map(TN_CERCLE);
const TN_RIVET = new THREE.SphereGeometry(.024, 8, 6);
function tonneauMorceaux(c){
  const o = ombreBois(0, TN.H), joint = (x, y, z) => o(x, y) * (1 - .3 * jointTN(x, z)), out = [];
  out.push({geo: TN_CORPS, m: M4(0, 0, 0), c, ombre: joint, normale: (x, y, z, n) => { const r = Math.hypot(x, z) || 1; return n.set(x / r, n.y * .3, z / r).normalize(); }});   // la lumière comme sur un fût droit : pas d'ombre en biais ni de couture
  out.push({geo: TN_REBORD, m: M4(0, 0, 0), c, ombre: o});
  out.push({geo: TN_COUVERCLE, m: M4(0, TN.H - .04, 0), c, ombre: () => .98});
  for(const z of [-.09, .09]) out.push({geo: TN_RAINURE, m: M4(0, TN.H - .025, z, 0, .35), c, ombre: () => .7});   // les trois planches du couvercle
  TN_HAUTS.forEach((y, i) => {
    out.push({geo: TN_CERCLES[i], m: M4(0, 0, 0), c: TN.cuivre, ombre: o});
    for(let k = 0; k < 10; k++){ const a = (k + .5) / 10 * 2 * Math.PI, r = rayonTN(y) + .024;
      out.push({geo: TN_RIVET, m: M4(Math.cos(a) * r, y, Math.sin(a) * r), c: TN.cuivre, ombre: o}); }
  });
  return out;
}

/* La vitrine (image de Yo, 8 novembre 2026 : « Voici la vitrine mais il faut retirer l'améthyste car au début de partie il n'y a
   rien dedans » ; « Les boutons sont en bois ») : en bas, un buffet arrondi sur quatre petits pieds ronds et un socle épais,
   deux portes à panneau et deux boutons de bois ; un plateau épais ; en haut, une cage de verre entre quatre montants, sous un
   cadre cintré, le verre du dessus bombé ; dedans, un coussin de lin à cordelette et à glands, où se pose la pierre exposée
   (vitrine.js). 1,2 × 0,7 au sol, 1,85 de haut ; le devant vers +z. Le bois, le coussin et les boutons font un dessin ; le verre
   (transparent) un autre */
const VT = {plateau: .92, cage: 1.58, x: .52, z: .27, cord: 0xD4BC8C};
const arcVT = x => .17 * Math.max(0, 1 - (x / .6) ** 2);
const VT_PIED = baton(.09, .16, true, false, 8);
const VT_SOCLE = boiteRonde(1.2, .12, .66, .055, 2);
const VT_BUFFET = boiteRonde(1.06, .54, .56, .045, 1);
const VT_PORTE = boiteRonde(.42, .46, .05, .025, 1);
const VT_PANNEAU = boiteRonde(.3, .34, .04, .02, 1);
const VT_BOUTON = new THREE.SphereGeometry(.048, 10, 8);
const VT_PLATEAU = boiteRonde(1.2, .12, .68, .055, 2);
const VT_MONTANT = boiteRonde(.1, VT.cage - VT.plateau, .1, .035, 1);
const VT_ARC = (() => { const g = boiteRonde(1.16, .12, .12, .05, 2, [5, 1, 1]), P = g.attributes.position;
  for(let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + arcVT(P.getX(i)));
  g.computeVertexNormals(); return g; })();
const VT_COTE = boiteRonde(.12, .12, .66, .05, 1);
const VT_COUSSIN = coussin(.5, .15, .36, .06, .05, 1);
const VT_CORDE = boiteRonde(.53, .036, .39, .018, 1);
const VT_GLAND = baton(.024, .07, true, true, 6);
function vitrineMorceaux(c){
  const o = ombreBois(0, 1.85), out = [], zP = .28;
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: VT_PIED, m: M4(sx * .45, 0, sz * .2), c, ombre: o});
  out.push({geo: VT_SOCLE, m: M4(0, .2, 0), c, ombre: o}, {geo: VT_BUFFET, m: M4(0, .53, -.02), c, ombre: o});
  for(const s of [-1, 1]){
    out.push({geo: VT_PORTE, m: M4(s * .22, .53, zP), c, ombre: o}, {geo: VT_PANNEAU, m: M4(s * .22, .53, zP + .035), c, ombre: o});
    out.push({geo: VT_BOUTON, m: M4(s * .065, .52, zP + .06), c, ombre: (x, y) => o(x, y) * .82});   // les boutons de bois, un peu plus sombres
  }
  out.push({geo: VT_PLATEAU, m: M4(0, VT.plateau - .06, 0), c, ombre: o});
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: VT_MONTANT, m: M4(sx * VT.x, (VT.plateau + VT.cage) / 2, sz * VT.z), c, ombre: o});
  for(const sz of [-1, 1]) out.push({geo: VT_ARC, m: M4(0, VT.cage + .04, sz * VT.z), c, ombre: o});
  for(const sx of [-1, 1]) out.push({geo: VT_COTE, m: M4(sx * .54, VT.cage + .04, 0), c, ombre: o});
  const oc = ombreBois(VT.plateau, VT.plateau + .2);
  out.push({geo: VT_COUSSIN, m: M4(0, VT.plateau + .075, 0), c: LIN, ombre: oc}, {geo: VT_CORDE, m: M4(0, VT.plateau + .06, 0), c: VT.cord, ombre: oc});
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: VT_GLAND, m: M4(sx * .27, VT.plateau, sz * .2), c: VT.cord, ombre: oc});
  return out;
}
/* Le verre : quatre parois (devant et derrière cintrés en haut) et le dessus bombé, en une forme */
let vtVerre = null;
function verreVitrine(){
  if(vtVerre) return vtVerre;
  const haut = VT.cage + .04, h = haut - VT.plateau, morceaux = [];
  const face = new THREE.PlaneGeometry(1.0, h, 12, 1), P = face.attributes.position;
  for(let i = 0; i < P.count; i++) if(P.getY(i) > 0) P.setY(i, P.getY(i) + arcVT(P.getX(i)));
  morceaux.push({geo: face, m: M4(0, VT.plateau + h / 2, VT.z), c: 0xFFFFFF}, {geo: face, m: M4(0, VT.plateau + h / 2, -VT.z, 0, Math.PI), c: 0xFFFFFF});
  const cote = new THREE.PlaneGeometry(2 * VT.z, h);
  for(const s of [-1, 1]) morceaux.push({geo: cote, m: M4(s * VT.x, VT.plateau + h / 2, 0, 0, s * Math.PI / 2), c: 0xFFFFFF});
  const toit = new THREE.PlaneGeometry(1.04, 2 * VT.z, 12, 1), T = toit.attributes.position;
  toit.rotateX(-Math.PI / 2);
  for(let i = 0; i < T.count; i++) T.setY(i, arcVT(T.getX(i)));
  toit.computeVertexNormals();
  morceaux.push({geo: toit, m: M4(0, haut + .04, 0), c: 0xFFFFFF});
  return vtVerre = fusionner(morceaux);
}

const BUILD = {
  fauteuil(g, m){ g.add(modeleBois("fauteuil", m, fauteuilMorceaux)); },
  chaise(g, m){ g.add(modeleBois("chaise", m, chaiseMorceaux)); },
  tabouret(g, m){ g.add(modeleBois("tabouret", m, tabouretMorceaux)); },
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
  /* La vitrine (étape 1.11 ; refaite d'après l'image de Yo, v2.1.180) : la pierre exposée se pose sur le coussin */
  vitrine(g, m, o){
    g.add(modeleBois("vitrine", m, vitrineMorceaux));
    const v = new THREE.Mesh(verreVitrine(), verreMat); v.castShadow = v.receiveShadow = false; v.renderOrder = 1; g.add(v);
    const pierre = o && o.pierre;
    if(pierre){ const p = pierreMesh(pierre); p.scale.setScalar(1.35); p.position.y = VT.plateau + .14; g.add(p); }
  },
  tonneau(g, m){ g.add(modeleBois("tonneau", m, tonneauMorceaux)); },
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
  banc(g, m){ g.add(modeleBois("banc", m, bancMorceaux)); },
  etagere(g, m){ g.add(modeleBois("etagere", m, etagereMorceaux)); },
  armoire(g, m){ g.add(modeleBois("armoire", m, armoireMorceaux)); },
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
  table(g, m){ g.add(modeleBois("table", m, tableMorceaux)); },
  tableBanquet(g, m){ g.add(modeleBois("tableBanquet", m, tableBanquetMorceaux)); },
  lit(g, m){ g.add(modeleBois("lit", m, litMorceaux)); },
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
  const hex = couleurMeuble(type, color);                            // sa teinte, l'ancienne couleur, ou celle de départ (donnees.js)
  BUILD[type](g, hex !== null ? hex : ORIGIN[type], o);
  if(o && o.eteint) g.traverse(c => { if(c.material === fireMat) c.visible = false; else if(c.material === glowMat || c.material === nuitMat) c.material = verreEteint; });
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
