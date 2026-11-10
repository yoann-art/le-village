/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part, toon, fusionner, MAT_UNI } from "./formes.js";
import { MEUBLES, COULEURS, ATELIERS, couleurMeuble, garniPose, FLEURS, enFleur, saison } from "../donnees.js";
import { pierreMesh } from "./rochers.js";
import { fleurModele, fleurCoupee } from "./fleurs.js";
import { paqueretteModele } from "./paquerette.js";
import { pissenlitModele } from "./pissenlit.js";
import { coquelicotModele } from "./coquelicot.js";
import { bleuetModele } from "./bleuet.js";
import { perceNeigeModele } from "./perceNeige.js";
import { violetteModele } from "./violette.js";
import { muguetModele } from "./muguet.js";

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
const ORIGIN = {vase:C.stone, rideau:0xE8DCC0, chaise:C.wood, fauteuil:C.wood, tableBanquet:C.wood, armoire:C.wood, tabouret:C.wood, pot:C.clay, lanterne:CUIVRE, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, vitrine:C.wood, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue, statue:C.stone,
  chandelier:0xD8DCE2, chandelle:0xC8743C, torchere:C.wood, torchereMurale:0xC8743C, feuCamp:C.stone, lanterneMurale:0xC8743C,
  bocalLucioles:CUIVRE, brasero:0xC8743C, lampadaire:C.dark, lustre:CUIVRE, etabli:C.wood, atelierDeco:C.light, tableTaille:C.stone2, comptoir:C.red, fourneau:C.stone, enclume:0x4A4F57, trone:C.dark};

/* ---------- Les meubles refaits d'après les images de Yo (chantier de la décoration, étape 3) ----------
   Un seul dessin chacun : leurs morceaux fusionnés, aux couleurs par sommet (MAT_UNI) ; tout le meuble de la couleur de sa
   matière (sa teinte), l'ombre douce peinte (le dessus plus clair, le dessous plus sombre). La forme est faite une fois par
   couleur, puis partagée. */
export const MEUBLES_REFAITS = ["tabouret", "chaise", "fauteuil", "banc", "table", "tableBanquet", "lit", "etagere", "armoire", "tonneau", "vitrine", "chandelle", "lanterne", "torchere", "bocalLucioles", "feuCamp", "torchereMurale", "lanterneMurale", "lustre", "chandelier", "cheminee", "petitTapis", "grandTapis", "rideau", "pot", "vase", "statue", "miroir"];
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

/* Les coffres de réserve (image de Yo, 8 novembre 2026 : « Voici le coffre » ; « Il faudrait faire un autre coffre sans cuivre
   apparent et celui-ci pour un autre design ») : une caisse de planches verticales, son cadre arrondi (le bas, les coins),
   quatre petits pieds ronds ; un gros rebord, puis un couvercle bombé de planches couchées, ses bouts en demi-lune cerclés ;
   deux larges bandes par-dessus. Le coffre simple (le début de partie, sans cuivre) : les bandes de bois sombre, des chevilles,
   un loquet de bois. Le coffre cerclé de cuivre (o.style = "cuivre") : les bandes, les rivets et la serrure en écusson de
   cuivre, comme l'image. 1,4 × 0,8 au sol, 1,05 de haut ; le devant vers +z */
const CF_ECHELLE = .65;
const CF = {L: 1.3, D: .74, bas: .1, haut: .62, R: .37, cy: .68, bx: .42, cuivre: 0xB0602A, trou: 0x2A1A10};
const CF_PIED = baton(.075, CF.bas + .04, true, false, 8);
const CF_PLANCHE = boiteRonde(CF.L / 7, CF.haut - CF.bas, CF.D, .02, 1);
const CF_BAS = boiteRonde(CF.L + .06, .08, CF.D + .06, .035, 1);
const CF_COIN = boiteRonde(.09, CF.haut - CF.bas, .09, .035, 1);
const CF_REBORD = boiteRonde(CF.L + .1, .1, CF.D + .1, .045, 2);
const CF_LATTE = (k, n) => { const a = Math.PI * k / n, b = Math.PI / n - .03;    // une planche du couvercle : une part du demi-cylindre
  return new THREE.CylinderGeometry(CF.R, CF.R, CF.L - .04, 3, 1, false, a + .015, b).rotateZ(Math.PI / 2); };
const CF_LATTES = [0, 1, 2, 3, 4].map(k => CF_LATTE(k, 5));
const CF_DESSOUS = new THREE.CylinderGeometry(CF.R - .012, CF.R - .012, CF.L - .05, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);   // sous les planches : les joints se voient sombres
const CF_BOUT = new THREE.TorusGeometry(CF.R - .02, .04, 6, 14, Math.PI).rotateY(Math.PI / 2);
const CF_BANDE_HAUT = new THREE.CylinderGeometry(CF.R + .022, CF.R + .022, .13, 16, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
const CF_BANDE = boiteRonde(.13, CF.haut - CF.bas, .03, .012, 1);
const CF_RIVET = new THREE.SphereGeometry(.026, 8, 6);
const CF_LOQUET = boiteRonde(.16, .17, .05, .025, 1);
const CF_ECUSSON = (() => { const g = boiteRonde(.22, .22, .045, .02, 1, [1, 2, 1]), P = g.attributes.position;   // la serrure : le bas en pointe
  for(let i = 0; i < P.count; i++){ const y = P.getY(i); if(y < 0) P.setX(i, P.getX(i) * (1 + y / .11 * .55)); }
  g.computeVertexNormals(); return g; })();
const CF_PATTE = boiteRonde(.14, .14, .04, .02, 1);
const CF_TROU = new THREE.SphereGeometry(.034, 6, 4);
function coffreMorceaux(cuivre){ return c => {
  const o = ombreBois(0, 1), out = [], ys = CF.cy, zF = CF.D / 2;
  const sombre = (x, y) => o(x, y) * .62, metal = cuivre ? CF.cuivre : c, om = cuivre ? o : sombre;
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: CF_PIED, m: M4(sx * .55, 0, sz * .27), c, ombre: o});
  for(let k = 0; k < 7; k++) out.push({geo: CF_PLANCHE, m: M4((k - 3) * CF.L / 7, (CF.bas + CF.haut) / 2, 0), c, ombre: o});   // la caisse : sept planches
  out.push({geo: CF_BAS, m: M4(0, CF.bas + .04, 0), c, ombre: o});
  for(const sx of [-1, 1]) for(const sz of [-1, 1]) out.push({geo: CF_COIN, m: M4(sx * (CF.L / 2 - .02), (CF.bas + CF.haut) / 2, sz * (zF - .02)), c, ombre: o});
  out.push({geo: CF_REBORD, m: M4(0, CF.haut + .03, 0), c, ombre: o});
  out.push({geo: CF_DESSOUS, m: M4(0, ys, 0, 0, 0, 0, 1, 1, 1), c, ombre: sombre});
  for(const g of CF_LATTES) out.push({geo: g, m: M4(0, ys, 0, 0, 0, 0, 1, 1, 1), c, ombre: o});                  // le couvercle bombé
  for(const sx of [-1, 1]) out.push({geo: CF_BOUT, m: M4(sx * (CF.L / 2 - .03), ys, 0, 0, 0, 0, 1, 1, 1), c, ombre: o});
  for(const sx of [-1, 1]){
    const x = sx * CF.bx;
    out.push({geo: CF_BANDE_HAUT, m: M4(x, ys, 0, 0, 0, 0, 1, 1, 1), c: metal, ombre: om});
    for(const sz of [-1, 1]) out.push({geo: CF_BANDE, m: M4(x, (CF.bas + CF.haut) / 2, sz * (zF + .01)), c: metal, ombre: om});
    for(const y of [.22, .48]) out.push({geo: CF_RIVET, m: M4(x, y, zF + .03, 0, 0, 0, 1, 1, cuivre ? 1 : .6), c: metal, ombre: om});   // rivets (ou chevilles)
    for(const a of [.35, 1.05]) out.push({geo: CF_RIVET, m: M4(x, ys + Math.sin(a) * (CF.R + .03), Math.cos(a) * (CF.R + .03), 0, 0, 0, 1, 1, cuivre ? 1 : .6), c: metal, ombre: om});
  }
  if(cuivre){                                                                                                    // la serrure en écusson
    out.push({geo: CF_ECUSSON, m: M4(0, CF.haut - .06, zF + .03), c: metal, ombre: o}, {geo: CF_PATTE, m: M4(0, CF.haut + .1, zF + .07, -.3), c: metal, ombre: o});
    for(const sx of [-1, 1]) out.push({geo: CF_RIVET, m: M4(sx * .1, CF.haut - .02, zF + .06), c: metal, ombre: o});
    out.push({geo: CF_TROU, m: M4(0, CF.haut - .04, zF + .058, 0, 0, 0, 1, 1, .4), c: CF.trou}, {geo: CF_TROU, m: M4(0, CF.haut - .085, zF + .058, 0, 0, 0, .55, 1.6, .4), c: CF.trou});
  } else out.push({geo: CF_LOQUET, m: M4(0, CF.haut + .02, zF + .06), c, ombre: sombre});                      // le loquet de bois
  return out;
}; }

/* Le bougeoir et sa chandelle (image de Yo, 8 novembre 2026 : « Voici la chandelle » ; le bougeoir vide, on y pose la
   chandelle) : une coupelle ronde au bord relevé, un godet au milieu, une anse ronde ; le cuivre (sa couleur, celle du métal).
   La chandelle de suif : crème, la cire coulée par-dessus le bord et deux coulures sur le côté, sa mèche ; la flamme en goutte
   (fireMat : elle vacille, s'éteint par gestes.js). Le bougeoir et sa chandelle font un dessin, la flamme un autre */
const BG = {cire: 0xF3E6C4, meche: 0x3A2A1C, bas: .115, haut: .33};
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const BG_COUPELLE = lathe([[0, 0], [.15, 0], [.172, .008], [.184, .032], [.188, .058], [.178, .066], [.166, .046], [.15, .03], [0, .03]], 22);
const BG_GODET = lathe([[0, .025], [.092, .025], [.086, .05], [.08, .08], [.084, .1], [.096, .108], [.094, .12], [.082, .118], [.078, .09], [0, .088]], 16);   // creux en haut : la chandelle s'y plante
const BG_ANSE = new THREE.TorusGeometry(.07, .019, 6, 16);
const CH_CORPS = baton(.078, BG.haut - BG.bas, false, false, 14);
const CH_BORD = new THREE.TorusGeometry(.068, .016, 5, 14).rotateX(Math.PI / 2);    // la cire coulée sur le bord
const CH_COULURE = baton(.016, .1, true, true, 6);
const CH_MECHE = baton(.009, .04, false, true, 5);
const CH_FLAMME = lathe([[0, 0], [.026, .008], [.042, .03], [.046, .055], [.038, .085], [.022, .115], [.008, .14], [0, .15]], 14);
function chandelleMorceaux(y0){ const o = ombreBois(y0, y0 + .3); return [
  {geo: CH_CORPS, m: M4(0, y0, 0), c: BG.cire, ombre: o}, {geo: CH_BORD, m: M4(0, y0 + BG.haut - BG.bas - .006, 0), c: BG.cire, ombre: o},
  {geo: CH_COULURE, m: M4(.074, y0 + .15, .02), c: BG.cire, ombre: o}, {geo: CH_COULURE, m: M4(-.035, y0 + .17, .07, 0, 0, 0, 1, .6, 1), c: BG.cire, ombre: o},
  {geo: CH_MECHE, m: M4(0, y0 + BG.haut - BG.bas, 0), c: BG.meche}]; }
function bougeoirMorceaux(garni){ return c => {
  const o = ombreBois(0, .2), out = [{geo: BG_COUPELLE, m: M4(0, 0, 0), c, ombre: o}, {geo: BG_GODET, m: M4(0, 0, 0), c, ombre: o},
    {geo: BG_ANSE, m: M4(.225, .1, 0), c, ombre: o}];
  if(garni) out.push(...chandelleMorceaux(BG.bas));
  return out;
}; }
/* La lanterne sur pied (image de Yo, 8 novembre 2026 : « Voici la lanterne sur pied », vide « pour que cela soit réaliste ») :
   un socle rond à deux marches, un poteau aux anneaux, une boule en haut ; une crosse enroulée d'où pend la lanterne : un
   bouton dessous, une coupe, six vitres cintrées entre des montants à rivets, un bord rond, un dôme et son anneau. Tout en
   cuivre. Vide : le verre clair, on voit au travers ; on y pose une chandelle de suif (comme dans le bougeoir), qui ne s'y use
   jamais : sa flamme (fireMat) derrière le verre qui s'allume (verreLanterne). Le poteau un peu à gauche du milieu, la lanterne
   à droite : le tout tient sur sa case. Un dessin pour le cuivre (et la chandelle), un pour le verre, un pour la flamme */
const LP = {x0: -.12, lx: .17, bas: 1.1, haut: 1.33, r: .145, s: .55, k: 1.15, pivot: 1.55};   // la lanterne grandie de .15 (l'image), depuis son anneau
const LP_K = new THREE.Matrix4().makeTranslation(LP.lx, LP.pivot, 0).multiply(new THREE.Matrix4().makeScale(LP.k, LP.k, LP.k)).multiply(new THREE.Matrix4().makeTranslation(-LP.lx, -LP.pivot, 0));   // le poteau, la lanterne, ses vitres, la chandelle (à .55)
const LP_SOCLE = lathe([[0, 0], [.19, 0], [.205, .015], [.205, .05], [.19, .065], [.15, .07], [.125, .08], [.125, .13], [.11, .145], [.06, .15], [0, .15]], 22);
const LP_BAS = lathe([[0, .14], [.058, .14], [.052, .3], [.044, .5], [0, .5]], 12);          // le bas du poteau, plus large
const LP_POTEAU = baton(.04, 1.08, false, false, 12);
const LP_ANNEAU = lathe([[0, -.025], [.05, -.025], [.062, -.012], [.062, .012], [.05, .025], [0, .025]], 14);
const LP_BOULE = new THREE.SphereGeometry(.055, 12, 8);
const LP_CROSSE = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[.03, 1.42], [.05, 1.53], [.1, 1.62], [.19, 1.68], [.29, 1.685], [.36, 1.64],
  [.375, 1.575], [.34, 1.54], [.3, 1.55], [.29, 1.585]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 36, .024, 8, false);
const LP_BOUT = new THREE.SphereGeometry(.03, 8, 6);
const LP_BOUTON = new THREE.SphereGeometry(.034, 10, 6);
const LP_COUPE = lathe([[0, .975], [.05, .985], [.1, 1.02], [.13, 1.06], [0, 1.06]], 12);
const LP_BANDE = new THREE.CylinderGeometry(.172, .172, .04, 6);                            // les bandes du bas et du haut (six pans)
const LP_MONTANT = baton(.017, LP.haut - LP.bas, false, false, 6);
const LP_ARC = new THREE.TorusGeometry(.055, .012, 4, 8, Math.PI);                          // le haut cintré de chaque vitre
const LP_RIVET = new THREE.SphereGeometry(.016, 6, 4);
const LP_BORD = lathe([[0, 1.355], [.17, 1.355], [.2, 1.365], [.205, 1.38], [.19, 1.39], [0, 1.39]], 18);
const LP_DOME = lathe([[0, 1.385], [.18, 1.385], [.16, 1.42], [.12, 1.45], [.075, 1.465], [.07, 1.49], [0, 1.495]], 18);
const LP_ANNEAU_HAUT = new THREE.TorusGeometry(.03, .009, 5, 10);
const LP_VERRE = new THREE.CylinderGeometry(LP.r, LP.r, LP.haut - LP.bas, 6, 1, true).translate(0, (LP.bas + LP.haut) / 2, 0);
const verreLanterne = toon({color: 0xFFD27A, emissive: 0xFFA640, emissiveIntensity: 1, transparent: true, opacity: .85, depthWrite: false});
function lanterneMorceaux(garni){ return c => {
  const o = ombreBois(0, 1.7), X = LP.x0, L = LP.lx, out = [
    {geo: LP_SOCLE, m: M4(X, 0, 0), c, ombre: o}, {geo: LP_BAS, m: M4(X, 0, 0), c, ombre: o}, {geo: LP_POTEAU, m: M4(X, .5, 0), c, ombre: o},
    {geo: LP_BOULE, m: M4(X, 1.64, 0), c, ombre: o}, {geo: LP_CROSSE, m: M4(X, 0, 0), c, ombre: o}, {geo: LP_BOUT, m: M4(X + .29, 1.585, 0), c, ombre: o},
    ...lanternePendue(c, o, garni)];                                                             // la lanterne, à part : grandie
  for(const y of [.5, 1.39, 1.58]) out.push({geo: LP_ANNEAU, m: M4(X, y, 0), c, ombre: o});         // les anneaux du poteau
  return out;
}; }
function lanternePendue(c, o, garni, K = LP_K){
  const L = LP.lx, out = [
    {geo: LP_BOUTON, m: M4(L, .97, 0), c, ombre: o}, {geo: LP_COUPE, m: M4(L, 0, 0), c, ombre: o},
    {geo: LP_BORD, m: M4(L, 0, 0), c, ombre: o}, {geo: LP_DOME, m: M4(L, 0, 0), c, ombre: o}, {geo: LP_ANNEAU_HAUT, m: M4(L, 1.525, 0), c, ombre: o}];
  for(const y of [LP.bas - .01, LP.haut + .01]) out.push({geo: LP_BANDE, m: M4(L, y, 0), c, ombre: o});
  for(let k = 0; k < 6; k++){
    const a = k * Math.PI / 3, ca = a + Math.PI / 6, r = .158;
    out.push({geo: LP_MONTANT, m: M4(L + Math.sin(a) * r, LP.bas, Math.cos(a) * r), c, ombre: o});                // les montants, aux coins
    for(const y of [LP.bas - .01, LP.haut + .01]) out.push({geo: LP_RIVET, m: M4(L + Math.sin(a) * .175, y, Math.cos(a) * .175), c, ombre: o});
    out.push({geo: LP_ARC, m: M4(L + Math.sin(ca) * .132, LP.haut - .06, Math.cos(ca) * .132, 0, ca, 0), c, ombre: o});   // le haut cintré de la vitre
  }
  if(garni){ const S = new THREE.Matrix4().makeTranslation(L, LP.bas, 0).multiply(new THREE.Matrix4().makeScale(LP.s, LP.s, LP.s));
    for(const p of chandelleMorceaux(0)) out.push({...p, m: S.clone().multiply(p.m)}); }
  return out.map(p => ({...p, m: K.clone().multiply(p.m)}));
}
/* La torchère sur pied (image de Yo, 9 novembre 2026 : « Voici la torchère sur pied », « la torchère doit être vide ») : un
   pied en croix de quatre patins arrondis, un rivet de cuivre au bout de chacun ; un moyeu, un poteau à deux anneaux, un col ;
   une coupe ronde de bois, un bandeau de cuivre à rivets autour du bord ; le bois prend sa teinte, le cuivre reste. Vide quand
   on la pose ; la torche qu'on y pose (o.torche) : un bâton, la corde enroulée en haut (les fibres de sa recette), une flamme à
   trois langues (fireMat, un seul dessin). Le bord de la coupe à TC.bord */
const TC = {bord: 1.2, fond: 1.06, corde: 0xE3CC96, baton: 0x9A6438};
const TC_PATIN = boiteRonde(.13, .12, .24, .05, 3);
const TC_RIVET = new THREE.SphereGeometry(.022, 8, 5);
const TC_MOYEU = lathe([[0, 0], [.088, 0], [.09, .1], [.08, .13], [.05, .15], [0, .15]], 14);
const TC_POTEAU = baton(.05, .82, false, false, 12);
const TC_ANNEAU = lathe([[0, -.035], [.062, -.035], [.074, -.02], [.076, 0], [.074, .02], [.062, .035], [0, .035]], 14);
const TC_COUPE = lathe([[0, .9], [.07, .9], [.085, .93], [.09, .965], [.11, .975], [.15, 1.01], [.178, 1.06], [.19, 1.13], [.192, TC.bord - .01],
  [.185, TC.bord], [.168, TC.bord], [.162, 1.13], [.14, 1.08], [.1, TC.fond], [0, TC.fond]], 22);
const TC_BANDEAU = lathe([[.188, 1.115], [.205, 1.12], [.21, 1.15], [.205, 1.18], [.188, 1.185]], 22);
const TC_BATON = baton(.05, .34, true, true, 10);
const TC_CORDE = new THREE.TorusGeometry(.058, .017, 5, 14).rotateX(Math.PI / 2);
const TC_LANGUE = lathe([[0, 0], [.06, .012], [.1, .05], [.115, .1], [.105, .16], [.075, .22], [.04, .27], [.012, .31], [0, .32]], 14);
const TC_FLAMME = fusionner([{geo: TC_LANGUE, m: M4(0, 0, 0), c: 0}, {geo: TC_LANGUE, m: M4(-.085, .05, .01, 0, 0, .5, .45, .55, .45), c: 0},
  {geo: TC_LANGUE, m: M4(.085, .06, -.01, 0, 0, -.45, .4, .5, .4), c: 0}]);
function torchereMorceaux(torche){ return c => {
  const o = ombreBois(0, 1.2), out = [{geo: TC_MOYEU, m: M4(0, 0, 0), c, ombre: o}, {geo: TC_POTEAU, m: M4(0, .12, 0), c, ombre: o},
    {geo: TC_COUPE, m: M4(0, 0, 0), c, ombre: o}, {geo: TC_BANDEAU, m: M4(0, 0, 0), c: CUIVRE, ombre: o}];
  for(const y of [.33, .82]) out.push({geo: TC_ANNEAU, m: M4(0, y, 0), c, ombre: o});
  for(let k = 0; k < 4; k++){ const a = Math.PI / 4 + k * Math.PI / 2, s = Math.sin(a), co = Math.cos(a);
    out.push({geo: TC_PATIN, m: M4(s * .15, .06, co * .15, 0, a, 0), c, ombre: o});                       // le pied en croix
    out.push({geo: TC_RIVET, m: M4(s * .272, .065, co * .272), c: CUIVRE, ombre: o}); }
  for(let k = 0; k < 8; k++){ const a = k * Math.PI / 4; out.push({geo: TC_RIVET, m: M4(Math.sin(a) * .208, 1.15, Math.cos(a) * .208), c: CUIVRE, ombre: o}); }
  if(torche){ out.push({geo: TC_BATON, m: M4(0, TC.fond - .02, 0), c: TC.baton, ombre: o});
    for(const y of [1.225, 1.252, 1.279]) out.push({geo: TC_CORDE, m: M4(0, y, 0), c: TC.corde, ombre: o}); }
  return out;
}; }
/* Le bocal à lucioles (image de Yo, 9 novembre 2026 : « Il faudrait qu'il soit vide également. Et la corde devant le bocal
   gêne ») : un pot de verre aux épaules arrondies, le fond épais ; un couvercle de cuivre à deux étages et son bouton ; deux
   anneaux de cuivre sur les côtés, la corde torsadée qui retombe derrière le verre. Vide quand on le pose ; on y met trois
   lucioles (o.lucioles) : sept petites bêtes (comme l'image ; trois lucioles qui volent dans tous les sens), le corps sombre,
   les ailes pâles, le bout du ventre qui brille (lucioleMat : il palpite, lumieres.js). Le cuivre, le corps et les ailes font
   un dessin, le verre un autre, les ventres qui brillent un troisième */
const BJ = {r: .15, haut: .36, corde: 0xE3CC96, corps: 0x3A2E22, aile: 0xF7F5E6};
const BJ_VERRE = lathe([[0, .001], [.12, .001], [.145, .012], [.153, .04], [.153, .3], [.146, .335], [.13, .355], [.128, .37]], 22);
const BJ_FOND = lathe([[0, .002], [.13, .002], [.135, .022], [0, .026]], 18);
const BJ_VITRE = fusionner([{geo: BJ_VERRE, m: M4(0, 0, 0), c: 0}, {geo: BJ_FOND, m: M4(0, 0, 0), c: 0}]);   // le verre, un seul dessin
const BJ_COL = lathe([[0, .355], [.14, .355], [.152, .365], [.152, .395], [.14, .405], [0, .405]], 22);
const BJ_COUVERCLE = lathe([[0, .4], [.162, .4], [.174, .41], [.178, .432], [.176, .452], [.164, .466], [.13, .474], [.07, .478], [.05, .488], [.044, .5], [0, .5]], 22);
const BJ_BOUTON = lathe([[0, .495], [.026, .495], [.044, .508], [.05, .528], [.044, .548], [.026, .558], [0, .56]], 14);
const BJ_ANNEAU = new THREE.TorusGeometry(.03, .011, 6, 12);
const BJ_CORDE = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.172, .355, 0], [-.172, .29, -.07], [-.12, .22, -.155], [0, .19, -.19],
  [.12, .22, -.155], [.172, .29, -.07], [.172, .355, 0]].map(([x, y, z]) => new THREE.Vector3(x, y, z))), 24, .016, 6, false);
const BJ_TETE = new THREE.SphereGeometry(.012, 6, 4);
const BJ_THORAX = new THREE.SphereGeometry(.015, 6, 4);
const BJ_AILE = new THREE.SphereGeometry(.02, 6, 3);
const BJ_VENTRE = new THREE.SphereGeometry(.02, 8, 5);
/* les lucioles dans le bocal : [x, y, z, cap (rad), pente (rad)] */
const BJ_LUCIOLES = [[.045, .28, .04, .6, .3], [-.055, .23, .03, 2.6, -.2], [.05, .16, .035, -2.2, .25], [-.05, .1, -.035, 1.2, .1], [.015, .07, .055, -.8, -.2], [-.01, .3, -.055, 3.4, .35], [-.02, .18, .06, 4.4, 0]];   // loin du verre, ailes comprises
const BJ_TAILLE = new THREE.Vector3(1.5, 1.5, 1.5);   // plus grandes que nature, comme l'image
const BJ_LUEURS = fusionner(BJ_LUCIOLES.map(([x, y, z, a, p]) => ({geo: BJ_VENTRE, m: new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(p, a, 0, "YXZ")), BJ_TAILLE).multiply(M4(0, -.004, -.034, 0, 0, 0, 1, 1, 1.5)), c: 0})));
function bocalMorceaux(lucioles){ return c => {
  const o = ombreBois(0, .55), out = [{geo: BJ_COL, m: M4(0, 0, 0), c, ombre: o}, {geo: BJ_COUVERCLE, m: M4(0, 0, 0), c, ombre: o},
    {geo: BJ_BOUTON, m: M4(0, 0, 0), c, ombre: o}, {geo: BJ_CORDE, m: M4(0, 0, 0), c: BJ.corde, ombre: o}];
  for(const sx of [-1, 1]) out.push({geo: BJ_ANNEAU, m: M4(sx * .172, .37, 0, 0, Math.PI / 2, 0), c, ombre: o});
  if(lucioles) for(const [x, y, z, a, p] of BJ_LUCIOLES){
    const B = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(p, a, 0, "YXZ")), BJ_TAILLE);
    out.push({geo: BJ_TETE, m: B.clone().multiply(M4(0, .004, .03)), c: BJ.corps}, {geo: BJ_THORAX, m: B.clone().multiply(M4(0, 0, .01, 0, 0, 0, 1, .9, 1.1)), c: BJ.corps});
    for(const sx of [-1, 1]) out.push({geo: BJ_AILE, m: B.clone().multiply(M4(sx * .026, .016, -.004, 0, sx * .5, sx * .35, 1, .18, .55)), c: BJ.aile});
  }
  return out;
}; }
const verreBocal = toon({color: 0xE4F2E0, transparent: true, opacity: .32, depthWrite: false});
const verreBocalPlein = toon({color: 0xE6F2A0, emissive: 0x9CC83C, emissiveIntensity: .35, transparent: true, opacity: .42, depthWrite: false});   // la lueur des lucioles dans le verre
/* Le feu de camp (image de Yo, 9 novembre 2026 : « Voici le feu de camp. Retire le poisson ») : un cercle de grosses pierres
   rondes, un rang devant, un rang plus haut derrière ; trois bûches croisées, leurs bouts aux cernes clairs ; deux piquets
   fourchus, la corde enroulée ; la broche vide posée entre leurs fourches. Les pierres prennent leur teinte. Les flammes à
   plusieurs langues et la petite qui s'envole, les braises dessous : un seul dessin (fireMat, il vacille, s'éteint par
   gestes.js) ; tout le reste un autre */
const FC = {buche: 0x9A5A30, cerne: 0xE0A868, piquet: 0xB5703A, corde: 0xE3CC96, broche: .6};
const FC_PIERRE = new THREE.SphereGeometry(.1, 8, 6);
const FC_BUCHE = baton(.075, .5, false, false, 10);
const FC_CERNE = new THREE.CylinderGeometry(.066, .066, .012, 10);
const FC_PIQUET = baton(.045, .5, false, true, 8);
const FC_BRANCHE = baton(.04, .2, false, true, 8);
const FC_CORDE = new THREE.TorusGeometry(.055, .016, 5, 12).rotateX(Math.PI / 2);
const FC_BROCHE = baton(.022, 1.02, true, true, 8);
/* les pierres : [angle, rayon, hauteur, taille] ; devant, un rang bas ; derrière, un rang plus haut, comme l'image */
const FC_PIERRES = [];
for(let k = 0; k < 13; k++){ const a = k / 13 * Math.PI * 2 + .1; FC_PIERRES.push([a, .4, .07, 1.05 + (k % 3) * .12]); }
for(let k = 0; k < 7; k++){ const a = Math.PI * .62 + k / 6 * Math.PI * .76; FC_PIERRES.push([a, .3, .14, .95 + (k % 2) * .15]); }
const FC_FLAMMES = (() => { const L = lathe([[0, 0], [.06, .012], [.1, .05], [.115, .1], [.105, .16], [.075, .22], [.04, .27], [.012, .31], [0, .32]], 12);
  return fusionner([[0, .08, -.03, 0, 0, 1.15, 1.2], [-.1, .07, .0, 0, .3, .8, .85], [.1, .07, -.04, 0, -.3, .8, .95], [0, .07, -.1, -.15, 0, .9, 1],
    [.13, .45, -.02, 0, -.2, .3, .35]].map(([x, y, z, rx, rz, s, h]) => ({geo: L, m: M4(x, y, z, rx, 0, rz, s, h, s), c: 0}))
    .concat([{geo: new THREE.CylinderGeometry(.16, .18, .03, 12), m: M4(0, .02, 0), c: 0}])); })();
function feuMorceaux(n){ return c => {                                                                         // n : les bûches qui restent
  const o = ombreBois(0, .7), out = [];
  for(const [a, r, y, s] of FC_PIERRES) out.push({geo: FC_PIERRE, m: M4(Math.sin(a) * r, y, Math.cos(a) * r, 0, a * 3, 0, s * 1.05, s * .78, s * .92), c, ombre: o});
  for(const [x, z, ry, rz] of [[0, .04, .5, .22], [.02, -.06, -.7, -.2], [-.04, 0, 2.2, .18]].slice(0, n)){     // les bûches croisées, celles qu'on y a mises
    const B = M4(x, .12, z, 0, ry, Math.PI / 2 + rz);
    out.push({geo: FC_BUCHE, m: B.clone().multiply(M4(0, -.25, 0)), c: FC.buche, ombre: o});
    for(const e of [-.252, .252]) out.push({geo: FC_CERNE, m: B.clone().multiply(M4(0, e, 0)), c: FC.cerne, ombre: o});
  }
  for(const sx of [-1, 1]){                                                                                         // les piquets fourchus
    const x = sx * .44;
    out.push({geo: FC_PIQUET, m: M4(x, 0, -.02, 0, 0, -sx * .05), c: FC.piquet, ombre: o});
    for(const b of [-1, 1]) out.push({geo: FC_BRANCHE, m: M4(x - sx * .025, FC.broche - .16, -.02, 0, 0, b * .38), c: FC.piquet, ombre: o});
    for(const y of [.3, .335]) out.push({geo: FC_CORDE, m: M4(x - sx * .012, y, -.02), c: FC.corde, ombre: o});
  }
  out.push({geo: FC_BROCHE, m: M4(-.51, FC.broche, -.02, 0, 0, -Math.PI / 2), c: FC.piquet, ombre: o});            // la broche, vide
  return out;
}; }
/* La torchère murale (image de Yo, 9 novembre 2026 : « Retire la source de lumière ») : tout en cuivre (sa teinte de métal) ;
   une plaque au mur aux bords en courbes, deux rivets ; une rosace d'où part un bras en S ; une bague, une coupe (lisse : ses
   cannelures dépassaient) au bandeau à rivets. Vide quand on l'accroche ; la torche qu'on y pose (o.torche) : celle de la torchère sur pied, un peu plus
   petite. Le mur est à z −.25 */
const TM = {k: .85, fond: 1.2};
const TM_PLAQUE = boiteRonde(.2, .44, .04, .018, 2);
const TM_LOBE = new THREE.CylinderGeometry(.11, .11, .04, 16).rotateX(Math.PI / 2);
const TM_RIVET = new THREE.SphereGeometry(.02, 8, 5);
const TM_ROSACE = lathe([[0, 0], [.075, 0], [.08, .015], [.07, .035], [.045, .045], [0, .045]], 16).rotateX(Math.PI / 2);
const TM_BRAS = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[1.08, -.2], [1.07, -.1], [1.02, -.05], [.97, -.02], [.95, .04], [.98, .1], [1.05, .12], [1.13, .12]]
  .map(([y, z]) => new THREE.Vector3(0, y, z))), 24, .03, 8, false);
const TM_BAGUE = lathe([[0, 1.11], [.05, 1.11], [.058, 1.125], [.058, 1.145], [.05, 1.16], [0, 1.16]], 14);
const TM_COUPE = lathe([[0, 1.15], [.05, 1.15], [.07, 1.19], [.095, 1.25], [.11, 1.3], [.112, 1.34], [.1, 1.345], [.094, 1.3], [.08, 1.25], [0, TM.fond]], 18);
const TM_BANDEAU = lathe([[.106, 1.285], [.12, 1.29], [.123, 1.31], [.12, 1.33], [.108, 1.335]], 18);
function torchereMuraleMorceaux(torche){ return c => {
  const o = ombreBois(.85, 1.35), z = .12, out = [
    {geo: TM_PLAQUE, m: M4(0, 1.1, -.23), c, ombre: o}, {geo: TM_LOBE, m: M4(0, 1.26, -.23, 0, 0, 0, 1, .7, 1), c, ombre: o},
    {geo: TM_LOBE, m: M4(0, .94, -.23, 0, 0, 0, 1, .7, 1), c, ombre: o}, {geo: TM_ROSACE, m: M4(0, 1.08, -.21), c, ombre: o},
    {geo: TM_BRAS, m: M4(0, 0, 0), c, ombre: o}, {geo: TM_BAGUE, m: M4(0, 0, z), c, ombre: o}, {geo: TM_COUPE, m: M4(0, 0, z), c, ombre: o},
    {geo: TM_BANDEAU, m: M4(0, 0, z), c, ombre: o}];
  for(const y of [1.3, .9]) out.push({geo: TM_RIVET, m: M4(0, y, -.205), c, ombre: o});
  for(let k = 0; k < 6; k++){ const a = k * Math.PI / 3 + Math.PI / 6;
    out.push({geo: TM_RIVET, m: M4(Math.sin(a) * .124, 1.31, z + Math.cos(a) * .124, 0, 0, 0, .8, .8, .8), c, ombre: o}); }
  if(torche){ const S = M4(0, TM.fond + .02, z, 0, 0, 0, TM.k, TM.k, TM.k);
    out.push({geo: TC_BATON, m: S.clone(), c: TC.baton, ombre: o});
    for(const y of [.165, .192, .219]) out.push({geo: TC_CORDE, m: S.clone().multiply(M4(0, y, 0)), c: TC.corde, ombre: o}); }
  return out;
}; }
/* La lanterne murale (image de Yo, 9 novembre 2026 : « Retire la source de lumière pareil que les autres ») : tout en cuivre ;
   une plaque au mur à deux arrondis et six rivets, une rosace, un bras en S qui finit en crosse enroulée ; la lanterne de la
   lanterne sur pied (lanternePendue), aux trois quarts, pend à son anneau. Vide quand on l'accroche ; on y pose une chandelle
   de suif (o.bougie). Le mur est à z −.25 */
const LW = {k: .75, z: .12, anneau: 1.5};
const LW_K = new THREE.Matrix4().makeTranslation(0, LW.anneau, LW.z).multiply(new THREE.Matrix4().makeScale(LW.k, LW.k, LW.k))
  .multiply(new THREE.Matrix4().makeTranslation(-LP.lx, -LP.pivot, 0));
const LW_BRAS = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[1.25, -.2], [1.3, -.12], [1.42, -.05], [1.53, .02], [1.59, .1], [1.58, .17], [1.53, .2],
  [1.49, .17], [1.5, .13], [1.535, .135]].map(([y, z]) => new THREE.Vector3(0, y, z))), 32, .026, 8, false);
function lanterneMuraleMorceaux(garni){ return c => {
  const o = ombreBois(.9, 1.6), out = [
    {geo: TM_PLAQUE, m: M4(0, 1.25, -.23), c, ombre: o}, {geo: TM_LOBE, m: M4(0, 1.41, -.23, 0, 0, 0, 1, .7, 1), c, ombre: o},
    {geo: TM_LOBE, m: M4(0, 1.09, -.23, 0, 0, 0, 1, .7, 1), c, ombre: o}, {geo: TM_ROSACE, m: M4(0, 1.25, -.21), c, ombre: o},
    {geo: LW_BRAS, m: M4(0, 0, 0), c, ombre: o}, ...lanternePendue(c, o, garni, LW_K)];
  for(const [x, y] of [[-.06, 1.43], [.06, 1.43], [-.07, 1.1], [.07, 1.1], [0, 1.455], [0, 1.045]]) out.push({geo: TM_RIVET, m: M4(x, y, -.205), c, ombre: o});
  return out;
}; }
/* Le lustre (image de Yo, 9 novembre 2026 : « Retire les sources de lumière présentes sur l'image ») : tout en cuivre ; une
   plaque ronde au plafond (le plafond des pièces à 2.07), une boule, un gros anneau d'où descendent trois chaînes à maillons
   (deux devant, une derrière, comme l'image), accrochées à trois anses sur la couronne : un large bandeau rond à dix rivets ;
   cinq coupelles autour, à cheval sur la couronne, une boule pendue sous chacune. Vide quand on l'accroche ; on y pose cinq
   chandelles de suif (o.bougie), qui ne s'y usent jamais. Un dessin pour le cuivre (et les chandelles), un pour les flammes */
const LU = {bas: 1.3, haut: 1.42, ri: .39, re: .45, r: .5, fond: 1.365, n: 5, nouee: 1.865};
const LU_PLAQUE = lathe([[0, 2.0], [.13, 2.0], [.16, 2.012], [.17, 2.035], [.17, 2.07], [0, 2.07]], 24);
const LU_TIGE = lathe([[0, 1.93], [.035, 1.93], [.03, 1.96], [.045, 1.985], [.06, 2.0], [0, 2.0]], 12);
const LU_ANNEAU = new THREE.TorusGeometry(.06, .02, 6, 16);
const LU_COURONNE = lathe([[LU.ri, LU.bas + .01], [LU.ri + .01, LU.bas], [LU.re - .01, LU.bas], [LU.re, LU.bas + .012], [LU.re + .006, (LU.bas + LU.haut) / 2],
  [LU.re, LU.haut - .012], [LU.re - .01, LU.haut], [LU.ri + .01, LU.haut], [LU.ri, LU.haut - .01], [LU.ri, LU.bas + .01]], 48);
const LU_RIVET = new THREE.SphereGeometry(.031, 8, 5);
const LU_COUPE = lathe([[0, 1.33], [.06, 1.33], [.09, 1.345], [.108, 1.375], [.115, 1.41], [.105, 1.418], [.096, 1.39], [.085, LU.fond + .005], [0, LU.fond]], 16);
const LU_GOUTTE = lathe([[0, 1.24], [.02, 1.245], [.038, 1.265], [.042, 1.285], [.032, 1.305], [.022, 1.32], [.03, 1.335], [0, 1.335]], 10);   // la boule sous la coupelle
const LU_ANSE = new THREE.TorusGeometry(.032, .012, 5, 10, Math.PI);
const LU_MAILLON = new THREE.TorusGeometry(.032, .011, 5, 10);
const LU_CHAINES = [Math.PI, Math.PI / 3, -Math.PI / 3];                                   // une derrière, deux devant (entre les coupelles)
function luChaine(p0, p1, c, o, out){                                                     // les maillons, l'un dans l'autre, de travers à chaque fois
  const d = p1.clone().sub(p0), L = d.length(), n = Math.round(L / .08), Y = new THREE.Vector3(0, 1, 0);
  d.normalize(); const q0 = new THREE.Quaternion().setFromUnitVectors(Y, d);
  for(let k = 0; k < n; k++){
    const q = q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, k % 2 ? Math.PI / 2 : 0));
    out.push({geo: LU_MAILLON, m: new THREE.Matrix4().compose(p0.clone().addScaledVector(d, L * (k + .5) / n), q, new THREE.Vector3(1, 1.65, 1)), c, ombre: o});
  }
}
function lustreMorceaux(n){ return c => {                        // n : les chandelles posées (une à la fois)
  const o = ombreBois(1.2, 2.07), out = [{geo: LU_PLAQUE, m: M4(0, 0, 0), c, ombre: o}, {geo: LU_TIGE, m: M4(0, 0, 0), c, ombre: o},
    {geo: LU_ANNEAU, m: M4(0, LU.nouee - .005, 0), c, ombre: o}, {geo: LU_COURONNE, m: M4(0, 0, 0), c, ombre: o}];
  for(const a of LU_CHAINES){ const s = Math.sin(a), co = Math.cos(a), r = (LU.ri + LU.re) / 2;
    out.push({geo: LU_ANSE, m: M4(s * r, LU.haut, co * r, 0, a + Math.PI / 2, 0), c, ombre: o});
    luChaine(new THREE.Vector3(0, LU.nouee - .06, 0), new THREE.Vector3(s * r, LU.haut + .04, co * r), c, o, out); }
  for(let k = 0; k < 10; k++){ const a = (k + .5) * Math.PI / 5; out.push({geo: LU_RIVET, m: M4(Math.sin(a) * (LU.re + .004), (LU.bas + LU.haut) / 2, Math.cos(a) * (LU.re + .004), 0, 0, 0, 1, 1, .7), c, ombre: o}); }
  for(let k = 0; k < LU.n; k++){ const a = k * 2 * Math.PI / LU.n, x = Math.sin(a) * LU.r, z = Math.cos(a) * LU.r;
    out.push({geo: LU_COUPE, m: M4(x, 0, z), c, ombre: o}, {geo: LU_GOUTTE, m: M4(x, 0, z), c, ombre: o});
    if(k < n) for(const p of chandelleMorceaux(LU.fond)) out.push({...p, m: M4(x, 0, z, 0, a, 0).multiply(p.m)}); }
  return out;
}; }
const LU_FLAMMES = [null, ...Array.from({length: LU.n}, (_, n) => fusionner(Array.from({length: n + 1}, (_, k) => { const a = k * 2 * Math.PI / LU.n;
  return {geo: CH_FLAMME, m: M4(Math.sin(a) * LU.r, LU.fond + BG.haut - BG.bas + .02, Math.cos(a) * LU.r, 0, 0, 0, 1.25, 1.25, 1.25), c: 0}; })))];   // selon les chandelles posées
/* Le chandelier d'argent (image de Yo, 9 novembre 2026 : « Retire les sources de lumière. Pareil ») : un pied rond à deux
   marches, un fût tourné (une bague, un vase, deux anneaux, une boule au milieu), deux bras en S à volute, trois coupes, celle
   du milieu plus haute ; tout d'argent (sa teinte). Vide quand on le pose ; on y pose trois chandelles de suif (o.bougie), qui
   ne s'y usent jamais. Un dessin pour l'argent (et les chandelles), un pour les flammes */
const CD = {x: .29, fondM: .67, fondC: .525};
const CD_FUT = lathe([[0, 0], [.225, 0], [.229, .014], [.225, .04], [.205, .05], [.19, .056], [.172, .06], [.162, .078], [.13, .1], [.085, .118], [.062, .128],
  [.068, .138], [.068, .155], [.052, .165], [.046, .19], [.064, .222], [.07, .245], [.062, .268], [.05, .278], [.07, .288], [.07, .305], [.05, .316], [.044, .34],
  [.04, .4], [.04, .54], [.058, .552], [.058, .572], [.047, .583], [.06, .598], [.09, .625], [.114, .66], [.124, .688], [.127, .705], [.114, .711], [.104, .688],
  [.086, CD.fondM + .004], [0, CD.fondM]], 24);
const CD_BOULE = new THREE.SphereGeometry(.064, 16, 10);
const CD_COUPE = lathe([[0, .392], [.034, .392], [.046, .405], [.046, .423], [.035, .432], [.046, .446], [.078, .47], [.103, .505], [.114, .535], [.117, .553],
  [.104, .558], [.094, .536], [.08, CD.fondC + .004], [0, CD.fondC]], 18);
const cdTube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0))), 24, r, 8, false);
const CD_BRAS = cdTube([[.03, .42], [.08, .432], [.12, .405], [.14, .362], [.17, .334], [.22, .338], [.26, .358], [.284, .385], [.29, .405]], .027);
const CD_VOLUTE = cdTube([[.14, .366], [.125, .336], [.106, .334], [.1, .352], [.112, .366], [.126, .36]], .021);
const CD_ORDRE = [[0, CD.fondM], [-CD.x, CD.fondC], [CD.x, CD.fondC]];                     // les chandelles, une à la fois : au milieu, à gauche, à droite
function chandelierMorceaux(n){ return c => {                                               // n : les chandelles posées
  const o = ombreBois(0, .72), out = [{geo: CD_FUT, m: M4(0, 0, 0), c, ombre: o}, {geo: CD_BOULE, m: M4(0, .42, 0), c, ombre: o}];
  for(const s of [-1, 1]){
    const R = M4(0, 0, 0, 0, s > 0 ? 0 : Math.PI, 0);                                       // le bras de gauche : celui de droite retourné
    out.push({geo: CD_BRAS, m: R, c, ombre: o}, {geo: CD_VOLUTE, m: R, c, ombre: o}, {geo: CD_COUPE, m: M4(s * CD.x, 0, 0), c, ombre: o});
  }
  CD_ORDRE.slice(0, n).forEach(([x, y]) => { for(const p of chandelleMorceaux(y)) out.push({...p, m: (x ? M4(x, 0, 0, 0, Math.sign(x), 0) : M4(0, 0, 0)).multiply(p.m)}); });
  return out;
}; }
const CD_FLAMMES = [null, ...[1, 2, 3].map(n => fusionner(CD_ORDRE.slice(0, n).map(([x, y]) =>
  ({geo: CH_FLAMME, m: M4(x, y + BG.haut - BG.bas + .02, 0, 0, 0, 0, 1.25, 1.25, 1.25), c: 0}))))];   // selon les chandelles posées
/* La cheminée (image de Yo, 10 novembre 2026 : « Retire les bûches elles sont ajoutées quand on récupère les ressources ») :
   un mur de grosses pierres arrondies (elles prennent sa teinte ; le mortier entre elles un peu plus sombre) ; l'arche du foyer,
   neuf pierres taillées, la clé en haut ; le fond en petites briques ; un épais manteau de chêne sur deux consoles ; une marche
   de dalles devant ; le chenet de fer. Vide quand on la pose ; on y met trois bûches (o.feu, une à la fois), couchées sur le
   chenet comme l'image ; elles brûlent et s'usent (donnees.js, BUCHE). Un dessin pour la pierre, le bois et le fer (et les
   bûches), un pour le feu */
const CM = {fond: -.4, face: .1, ox: .36, oy: .55, rA: .36, rB: .53, man: 1.12, haut: 1.5, fer: 0x4A3C34, brique: 0xA4664C, cendre: 0x3A302A};
const CM_BUCHE = baton(.072, .48, false, false, 10), CM_CERNE = new THREE.CylinderGeometry(.064, .064, .012, 10);
const CM_POTEAU = baton(.026, .18, false, true, 8), CM_BARRE = baton(.017, .48, true, true, 8), CM_TRAVERSE = baton(.015, .26, true, true, 6);
const CM_BRIQUE = new THREE.BoxGeometry(.165, .1, .05);
/* le mortier autour de l'arche : du haut des piliers au haut du foyer, moins le demi-cercle de l'ouverture */
const CM_TYMPAN = (() => { const f = new THREE.Shape(); f.moveTo(-.37, .55); f.lineTo(-.36, .55); f.absarc(0, .55, .36, Math.PI, 0, true);
  f.lineTo(.37, .55); f.lineTo(.37, .92); f.lineTo(-.37, .92); f.lineTo(-.37, .55);
  return new THREE.ExtrudeGeometry(f, {depth: .46, bevelEnabled: false, curveSegments: 12}).translate(0, 0, -.38); })();
const cmPierre = (w, h, d) => boiteRonde(w, h, d, Math.min(.065, w / 2.6, h / 2.6), 2);   // bien arrondies, comme l'image
/* les pierres du mur : [x0, x1, y0, y1] ; le pilier de droite (celui de gauche en miroir), au-dessus du manteau tout le rang */
const CM_PILIER = [[.37, .67, 0, .19], [.37, .54, .2, .37], [.55, .68, .2, .37], [.37, .67, .38, .55], [.54, .68, .56, .8], [.47, .68, .81, 1.06]];
const CM_HAUT = [[-.68, -.42, 1.19, 1.34], [-.41, -.12, 1.19, 1.34], [-.11, .18, 1.19, 1.34], [.19, .45, 1.19, 1.34], [.46, .68, 1.19, 1.34],
  [-.68, -.5, 1.35, 1.5], [-.49, -.2, 1.35, 1.5], [-.19, .1, 1.35, 1.5], [.11, .4, 1.35, 1.5], [.41, .68, 1.35, 1.5]];
const CM_GEO = new Map();                                                                  // une forme par taille de pierre
const cmGeo = (w, h, d) => { const k = `${w.toFixed(3)},${h.toFixed(3)},${d}`; if(!CM_GEO.has(k)) CM_GEO.set(k, cmPierre(w, h, d)); return CM_GEO.get(k); };
/* les trois bûches, dans l'ordre où on les pose : [x, y, z, tour, pente, longueur] ; la 3e en travers sur les deux autres */
const CM_BUCHES = [[.02, .125, -.13, .08, 0, 1], [-.06, .125, .02, -.12, 0, .85], [.02, .255, -.05, .55, .1, .9]];
function chemineeMorceaux(n){ return c => {
  const o = ombreBois(0, CM.haut), sombre = new THREE.Color(c).multiplyScalar(.68).getHex(), out = [];
  const bloc = (w, h, d, x, y, z, cc) => out.push({geo: new THREE.BoxGeometry(w, h, d), m: M4(x, y, z), c: cc, ombre: o});
  const D = CM.face - CM.fond, zc = (CM.face + CM.fond) / 2;
  /* le cœur du mur (le mortier), un peu en retrait des pierres */
  for(const s of [-1, 1]) bloc(.3, CM.man, D - .04, s * .52, CM.man / 2, zc - .02, sombre);
  bloc(1.32, CM.haut - .96, D - .04, 0, (CM.haut - .06 + .9) / 2, zc - .02, sombre);   // son dessus sous celui des pierres
  out.push({geo: CM_TYMPAN, m: M4(0, 0, 0), c: sombre, ombre: o});
  /* le foyer : le fond de briques, les côtés, la cendre */
  bloc(.74, .92, .1, 0, .46, -.31, new THREE.Color(CM.brique).multiplyScalar(.55).getHex());
  for(let r = 0; r < 8; r++){ const y = .06 + r * .112;
    for(let k = -3; k <= 3; k++){ const x = k * .18 + (r % 2 ? .09 : 0);
      if(Math.abs(x) > .3 || (y > CM.oy && Math.hypot(x, y - CM.oy) > CM.rA - .07)) continue;
      out.push({geo: CM_BRIQUE, m: M4(x, y, -.25), c: CM.brique, ombre: o}); } }
  for(const s of [-1, 1]) bloc(.02, CM.oy, D - .1, s * (CM.ox - .005), CM.oy / 2, zc - .05, new THREE.Color(CM.brique).multiplyScalar(.75).getHex());
  bloc(.72, .03, .5, 0, .015, -.05, CM.cendre);
  /* les pierres du mur : les deux piliers, le haut au-dessus du manteau */
  for(const s of [-1, 1]) for(const [x0, x1, y0, y1] of CM_PILIER)
    out.push({geo: cmGeo(x1 - x0 - .012, y1 - y0 - .012, D), m: M4(s * (x0 + x1) / 2, (y0 + y1) / 2, zc), c, ombre: o});
  for(const [x0, x1, y0, y1] of CM_HAUT) out.push({geo: cmGeo(x1 - x0 - .012, y1 - y0 - .012, D), m: M4((x0 + x1) / 2, (y0 + y1) / 2, zc), c, ombre: o});
  /* l'arche : neuf pierres taillées en rayons, la clé un peu plus grande */
  for(let k = 0; k < 9; k++){ const a = k * Math.PI / 8, cle = k === 4 ? 1.12 : 1, r = (CM.rA + CM.rB) / 2;
    out.push({geo: cmGeo(.15 * cle, (CM.rB - CM.rA) * cle, D + .02), m: M4(Math.cos(a) * r, CM.oy + Math.sin(a) * r, zc + .01, 0, 0, a - Math.PI / 2), c, ombre: o}); }
  /* la marche de dalles devant */
  for(let k = 0; k < 5; k++) out.push({geo: cmGeo(.28, .13, .3), m: M4((k - 2) * .295, .065, .25), c, ombre: o});
  /* le manteau de chêne et ses deux consoles */
  out.push({geo: boiteRonde(1.6, .16, .4, .05, 3), m: M4(0, CM.man + .07, .04), c: C.wood, ombre: o});
  for(const s of [-1, 1]){
    out.push({geo: boiteRonde(.14, .2, .18, .045, 2), m: M4(s * .55, CM.man - .09, .17), c: C.wood, ombre: o});
    out.push({geo: boiteRonde(.14, .12, .12, .045, 2), m: M4(s * .55, CM.man - .22, .14), c: C.wood, ombre: o});
  }
  /* le chenet de fer : deux poteaux devant, une barre entre eux, la base posée au sol */
  for(const s of [-1, 1]){
    out.push({geo: CM_POTEAU, m: M4(s * .22, .02, .09), c: CM.fer, ombre: o});
    out.push({geo: CM_TRAVERSE, m: M4(s * .22, .045, -.17, Math.PI / 2, 0, 0), c: CM.fer, ombre: o});
  }
  out.push({geo: CM_BARRE, m: M4(-.24, .13, .09, 0, 0, -Math.PI / 2), c: CM.fer, ombre: o});
  out.push({geo: CM_BARRE, m: M4(-.24, .045, .09, 0, 0, -Math.PI / 2), c: CM.fer, ombre: o});
  out.push({geo: CM_BARRE, m: M4(-.24, .045, -.17, 0, 0, -Math.PI / 2), c: CM.fer, ombre: o});
  /* les bûches posées */
  for(const [x, y, z, ry, rz, l] of CM_BUCHES.slice(0, n)){
    const B = M4(x, y, z, 0, ry, Math.PI / 2 + rz);
    out.push({geo: CM_BUCHE, m: B.clone().multiply(M4(0, -.24 * l, 0, 0, 0, 0, 1, l, 1)), c: FC.buche, ombre: o});
    for(const e of [-.242 * l, .242 * l]) out.push({geo: CM_CERNE, m: B.clone().multiply(M4(0, e, 0)), c: FC.cerne, ombre: o});
  }
  return out;
}; }
/* Le petit tapis (image de Yo, 10 novembre 2026 : « Voici le petit tapis ») : un tapis de fibres tressées ; le milieu en
   damier, des brins plats qui passent l'un sur l'autre (une petite bosse arrondie par case, couchée tantôt en long, tantôt en
   large) ; tout autour, un gros boudin roulé comme une corde, à anneaux, aux coins arrondis, plus foncé. Tout prend la teinte du
   tissu (le bord plus sombre). Presque plat : on marche dessus */
const PT = {w: .8, d: .55, r: .1, pas: .072, k: .78};
const PT_BOSSE = new THREE.SphereGeometry(1, 6, 2, 0, Math.PI * 2, 0, Math.PI / 2);   // un brin (le dessus d'une demi-boule allongée)
const PT_ANNEAU = new THREE.SphereGeometry(1, 8, 4);
function petitTapisMorceaux(c){
  const o = ombreBois(0, .09), bord = new THREE.Color(c).multiplyScalar(PT.k).getHex(), fond = new THREE.Color(c).multiplyScalar(.7).getHex();
  const out = [{geo: new THREE.BoxGeometry(2 * PT.w - .14, .012, 2 * PT.d - .14), m: M4(0, .006, 0), c: fond, ombre: o}];
  /* le damier tressé */
  const nx = Math.floor((2 * PT.w - .2) / PT.pas), nz = Math.floor((2 * PT.d - .2) / PT.pas);
  for(let a = 0; a < nx; a++) for(let b = 0; b < nz; b++){
    const x = (a - (nx - 1) / 2) * PT.pas, z = (b - (nz - 1) / 2) * PT.pas, long = (a + b) % 2;
    for(const e of [-.0175, .0175]){ const [ex, ez] = long ? [0, e] : [e, 0];             // deux brins côte à côte par case
      out.push({geo: PT_BOSSE, m: M4(x + ex, .012, z + ez, 0, long ? Math.PI / 2 : 0, 0, .021, .018, .04), c, ombre: o}); }
  }
  boudin(out, PT.w - .045, PT.d - .045, PT.r, bord, o);
  return out;
}
/* Le boudin du bord d'un tapis : des anneaux serrés le long d'un rectangle aux coins arrondis (demi-largeur W, demi-profondeur D,
   coins de rayon R) */
function boudin(out, W, D, R, bord, o){
  const L = [2 * (W - R), 2 * (D - R)], tour = 2 * (L[0] + L[1]) + 2 * Math.PI * R, n = Math.round(tour / .048);
  const point = t => {                                                                   // la place et la direction sur le tour (t de 0 à tour)
    const segs = [[L[0], -W + R, D, 1, 0, W - R, D - R, 0], [L[1], W, D - R, 0, -1, W - R, -D + R, Math.PI / 2],
      [L[0], W - R, -D, -1, 0, -W + R, -D + R, Math.PI], [L[1], -W, -D + R, 0, 1, -W + R, D - R, 1.5 * Math.PI]];   // un côté, puis le coin qui le suit
    for(const [l, x0, z0, dx, dz, cx, cz, a0] of segs){
      if(t <= l) return [x0 + dx * t, z0 + dz * t, Math.atan2(dx, dz)];
      t -= l; const q = Math.PI / 2 * R;
      if(t <= q){ const a = a0 + t / R; return [cx + Math.sin(a) * R, cz + Math.cos(a) * R, Math.atan2(Math.cos(a), -Math.sin(a))]; }
      t -= q;
    }
    return [-W + R, D, Math.PI / 2];
  };
  for(let k = 0; k < n; k++){ const [x, z, a] = point(k * tour / n);
    out.push({geo: PT_ANNEAU, m: M4(x, .036, z, 0, a, 0, .05, .036, .032), c: bord, ombre: o}); }
}
/* Le grand tapis (image de Yo, 10 novembre 2026 : « Voici le grand tapis ») : tout en petits nœuds ronds, comme une mosaïque ;
   un boudin clair tout autour ; une large bande foncée aux losanges clairs (de grands losanges creux aux coins et au milieu
   des côtés, de petits pleins entre eux) ; le milieu clair traversé d'un treillis de losanges plus foncé. Trois tons de la
   teinte du tissu ; les nœuds sur une grille (GT.pas), les motifs comptés en nœuds */
const GT = {w: 1.2, d: .9, pas: .07, nx: 15, nz: 11, cx: 10, cz: 6};                // nœuds de −nx à nx ; le milieu jusqu'à cx, cz
const GT_NOEUD = new THREE.SphereGeometry(1, 8, 2, 0, Math.PI * 2, 0, Math.PI / 2);
function grandTapisMorceaux(c){
  const o = ombreBois(0, .09), teinte = k => new THREE.Color(c).multiplyScalar(k).getHex();
  const chaud = (r, g, b) => new THREE.Color(c).multiply(new THREE.Color(r, g, b)).getHex();   // plus foncé et plus chaud (le fauve de l'image), pas gris
  const clair = c, moyen = chaud(.92, .8, .62), fonce = chaud(.88, .74, .54);
  const out = [{geo: new THREE.BoxGeometry(2 * GT.w - .14, .012, 2 * GT.d - .14), m: M4(0, .006, 0), c: chaud(.8, .66, .48), ombre: o}];
  const bc = [GT.cx + 3, GT.cz + 3];                                                  // le milieu de la bande, en nœuds
  const motif = (a, b) => {                                                           // un nœud de la bande : clair s'il fait partie d'un losange
    for(const [mx, mz, grand] of [[bc[0], bc[1], 1], [0, bc[1], 1], [bc[0], 0, 1], [7, bc[1], 0], [bc[0], 4, 0]]){
      const d = Math.abs(Math.abs(a) - mx) + Math.abs(Math.abs(b) - mz);
      if(grand ? d === 2 || d === 0 : d <= 1) return true;
    }
    return false;
  };
  for(let a = -GT.nx; a <= GT.nx; a++) for(let b = -GT.nz; b <= GT.nz; b++){
    const milieu = Math.abs(a) <= GT.cx && Math.abs(b) <= GT.cz, m = ((a + b) % 6 + 6) % 6 === 3 || ((a - b) % 6 + 6) % 6 === 3;
    const col = milieu ? (m ? moyen : clair) : motif(a, b) ? clair : fonce;
    out.push({geo: GT_NOEUD, m: M4(a * GT.pas, .012, b * GT.pas, 0, (a * 7 + b * 3) % 6, 0, .04, .023, .04), c: col, ombre: o});
  }
  boudin(out, GT.w - .045, GT.d - .045, .12, teinte(.95), o);
  return out;
}
/* Le rideau (image de Yo, 10 novembre 2026 : « Voici le rideau. Il faut pouvoir le fermer et l'ouvrir ») : une tringle de
   chêne à boules, sur deux petites pattes au mur ; deux pans de toile à grands plis, accrochés par des anneaux ; ouverts, chacun
   retenu sur le côté par une embrasse de corde tressée et son pompon ; fermés (o.ferme), ils tombent droit et cachent la
   fenêtre, les embrasses pendues au mur. Seulement devant une fenêtre (décorer.js) ; le mur à z −.25, la fenêtre à y 1 → 1,7 */
const RD = {haut: 1.79, bas: .9, tringle: 1.83, z: -.06, pince: .58};
const RD_TRINGLE = new THREE.CylinderGeometry(.027, .027, 1.36, 10).rotateZ(Math.PI / 2);
const RD_BOULE = new THREE.SphereGeometry(.06, 12, 8), RD_PATTE = new THREE.CylinderGeometry(.012, .012, .18, 6).rotateX(Math.PI / 2);
const RD_ANNEAU = new THREE.TorusGeometry(.039, .011, 5, 12).rotateY(Math.PI / 2);
const RD_EMBRASSE = new THREE.TorusGeometry(.075, .026, 6, 16).rotateX(Math.PI / 2);
const RD_CORDON = new THREE.CylinderGeometry(.01, .01, .1, 5);
const RD_POMPON = lathe([[0, .1], [.022, .098], [.026, .085], [.016, .07], [.03, .04], [.04, .005], [.03, 0], [0, 0]], 10);
/* un pan (s : −1 à gauche, 1 à droite) : une toile en grille, plissée ; ouvert, large en haut, pincé à l'embrasse, évasé en bas */
function rideauPan(ferme, s){
  const g = new THREE.PlaneGeometry(1, 1, 16, 14), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){
    const u = P.getX(i) + .5, v = .5 - P.getY(i), y = RD.haut - v * (RD.haut - RD.bas);
    let larg, centre, amp;
    if(ferme){ larg = .66; centre = s * .33; amp = .028 + .01 * v; }
    else {
      const k = v < RD.pince ? v / RD.pince : (v - RD.pince) / (1 - RD.pince);
      larg = v < RD.pince ? .5 + (.17 - .5) * Math.sin(k * Math.PI / 2) : .17 + (.38 - .17) * Math.pow(k, .8);
      centre = s * (v < RD.pince ? .4 + (.5 - .4) * k : .5 - .02 * k);
      amp = .026 + .024 * Math.max(0, 1 - Math.abs(v - RD.pince) / .5);   // les plis serrés à l'embrasse
    }
    const plis = ferme ? 6 : 4;
    P.setXYZ(i, centre + (u - .5) * larg, y, RD.z + amp * Math.sin(u * Math.PI * 2 * plis) + (ferme ? 0 : .012 * Math.sin(u * Math.PI)));
  }
  g.computeVertexNormals();
  return g;
}
const RD_PANS = {ouvert: [rideauPan(false, -1), rideauPan(false, 1)], ferme: [rideauPan(true, -1), rideauPan(true, 1)]};
function rideauMorceaux(ferme){ return c => {
  const o = ombreBois(.85, 1.9), corde = new THREE.Color(c).multiply(new THREE.Color(.96, .84, .62)).getHex(), out = [];
  out.push({geo: RD_TRINGLE, m: M4(0, RD.tringle, RD.z), c: C.wood, ombre: o});
  for(const s of [-1, 1]){
    out.push({geo: RD_BOULE, m: M4(s * .7, RD.tringle, RD.z), c: C.wood, ombre: o}, {geo: RD_PATTE, m: M4(s * .6, RD.tringle, RD.z - .09), c: C.wood, ombre: o});
    out.push({geo: RD_PANS[ferme ? "ferme" : "ouvert"][s > 0 ? 1 : 0], m: M4(0, 0, 0), c, ombre: o});
    const anneaux = ferme ? [.05, .25, .45, .63] : [.18, .4, .62];
    for(const x of anneaux) out.push({geo: RD_ANNEAU, m: M4(s * x, RD.tringle, RD.z), c: C.wood, ombre: o});
    const yp = RD.haut - RD.pince * (RD.haut - RD.bas);
    if(!ferme){                                                        // l'embrasse autour du pan pincé, son cordon et son pompon devant
      out.push({geo: RD_EMBRASSE, m: M4(s * .5, yp, RD.z + .01, 0, 0, 0, 1.2, 1.3, .75), c: corde, ombre: o});
      out.push({geo: RD_CORDON, m: M4(s * .5, yp - .07, RD.z + .07), c: corde, ombre: o}, {geo: RD_POMPON, m: M4(s * .5, yp - .23, RD.z + .07), c: corde, ombre: o});
    } else {                                                           // fermés : les embrasses pendues au mur, de chaque côté
      out.push({geo: RD_EMBRASSE, m: M4(s * .74, yp, -.2, Math.PI / 2, 0, 0, .7, .5, .85), c: corde, ombre: o});
      out.push({geo: RD_CORDON, m: M4(s * .74, yp - .1, -.19), c: corde, ombre: o}, {geo: RD_POMPON, m: M4(s * .74, yp - .25, -.19), c: corde, ombre: o});
    }
  }
  return out;
}; }
/* Le pot de fleurs (image de Yo, 10 novembre 2026 : « Voici le pot de fleurs ») : un pot rond, un peu évasé, de grosses
   pierres arrondies maçonnées (deux rangs, décalés), un large rebord épais ; dedans, la terre brune et ses petites mottes.
   La pierre prend sa teinte ; la terre reste brune. On y plante une fleur sauvage (o.fleur, lumieres.js) : le modèle de la
   fleur sur l'île, qui fleurit en sa vraie saison (sinon ses feuilles) ; jamais de tas de terre sous elle, la terre reste à plat */
const PO = {bas: .2, haut: .24, h: .3, rebord: .29, dedans: .2, terre: .34, n: 7};
const PO_COEUR = lathe([[0, 0], [PO.bas - .015, 0], [PO.haut - .015, PO.h], [0, PO.h]], 18);
const PO_REBORD = lathe([[PO.dedans, .27], [PO.rebord - .02, .27], [PO.rebord - .003, .282], [PO.rebord + .004, .31], [PO.rebord, .345], [PO.rebord - .02, .366],
  [PO.rebord - .05, .372], [PO.dedans + .03, .372], [PO.dedans + .008, .365], [PO.dedans, .35], [PO.dedans - .004, .3]], 28);   // le rebord, de l'extérieur vers l'intérieur
const PO_TERRE = new THREE.CylinderGeometry(PO.dedans + .002, PO.dedans + .002, .02, 20);
const PO_MOTTE = new THREE.SphereGeometry(1, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2);
const PO_PIERRE = boiteRonde(.15, .13, .07, .035, 1);
const PO_PIERRE2 = boiteRonde(.12, .12, .07, .035, 1);
function potMorceaux(c){
  const o = ombreBois(0, PO.terre + .06), sombre = new THREE.Color(c).multiplyScalar(.7).getHex(), out = [];
  out.push({geo: PO_COEUR, m: M4(0, 0, 0), c: sombre, ombre: o}, {geo: PO_REBORD, m: M4(0, 0, 0), c, ombre: o});
  const pente = Math.atan2(PO.haut - PO.bas, PO.h);
  for(let r = 0; r < 2; r++) for(let k = 0; k < PO.n; k++){                           // deux rangs de pierres, décalés
    const a = (k + (r ? .5 : 0)) / PO.n * Math.PI * 2, y = r ? .2 : .075, rr = PO.bas + (PO.haut - PO.bas) * y / PO.h + .012;
    out.push({geo: (k + r) % 3 ? PO_PIERRE : PO_PIERRE2, m: M4(Math.sin(a) * rr, y, Math.cos(a) * rr, -pente, a, 0, 1, r ? .9 : 1.05, 1), c, ombre: o});
  }
  out.push({geo: PO_TERRE, m: M4(0, PO.terre, 0), c: 0x7A3A22, ombre: o});         // la terre, à plat
  for(const [x, z, s] of [[.06, .04, .022], [-.08, .02, .018], [.01, -.09, .02], [-.03, .09, .016], [.1, -.05, .014], [-.1, -.07, .017]])
    out.push({geo: PO_MOTTE, m: M4(x, PO.terre + .01, z, 0, 0, 0, s, s * .7, s), c: 0x6E3420, ombre: o});
  return out;
}
/* La fleur plantée : celle de l'île, à sa couleur, en fleur dans sa saison */
function fleurDuPot(k){
  const f = FLEURS[k], c = f.couleurs[0], e = enFleur(f) ? 2 : 1, s = saison();
  return k === "paquerette" ? paqueretteModele(s, e, c) : k === "pissenlit" ? pissenlitModele(s, e) : k === "coquelicot" ? coquelicotModele(s, e, c)
    : k === "bleuet" ? bleuetModele(s, e, c) : k === "perceNeige" ? perceNeigeModele(s, e) : k === "violette" ? violetteModele(s, e, c) : k === "muguet" ? muguetModele(s, e) : fleurModele(k, c, e);
}
/* Le vase (image de Yo, 10 novembre 2026 : « Voici le vase ») : ventru, couvert de pierres arrondies comme une mosaïque, un col
   étroit, un rebord épais et rond. La pierre prend sa teinte (le mortier un peu plus sombre). Au sol ou sur une table (décorer.js) ;
   on y met un bouquet de trois fleurs coupées, une à la fois (o.fleurs) */
const VS = {col: .3, h: .36};
const VS_PROFIL = [[0, 0], [.085, 0], [.12, .03], [.145, .08], [.152, .14], [.14, .2], [.11, .25], [.075, .285], [.06, .3]];
const VS_COEUR = lathe([...VS_PROFIL, [0, .3]], 20);
const VS_COL = lathe([[.05, .26], [.06, .3], [.062, .318], [.074, .322], [.082, .336], [.08, .352], [.068, .36], [.052, .356], [.046, .34], [.045, .3]], 20);
const VS_PIERRE = boiteRonde(.105, .088, .04, .026, 1), VS_PIERRE2 = boiteRonde(.085, .08, .04, .026, 1);
const VS_RANGS = [[.04, .108, 6], [.11, .148, 8], [.185, .145, 8], [.248, .108, 6]];   // [hauteur, rayon, nombre de pierres]
function vaseMorceaux(c){
  const o = ombreBois(0, VS.h), sombre = new THREE.Color(c).multiplyScalar(.7).getHex(), out = [{geo: VS_COEUR, m: M4(0, 0, 0), c: sombre, ombre: o}, {geo: VS_COL, m: M4(0, 0, 0), c, ombre: o}];
  VS_RANGS.forEach(([y, r, n], k) => {
    const pente = k === 0 ? .5 : k === 3 ? -.55 : k === 1 ? .1 : -.15;            // les pierres suivent le ventre du vase
    for(let j = 0; j < n; j++){ const a = (j + (k % 2 ? .5 : 0)) / n * Math.PI * 2;
      out.push({geo: (j + k) % 3 ? VS_PIERRE : VS_PIERRE2, m: M4(Math.sin(a) * r, y, Math.cos(a) * r, -pente, a, 0, 1, 1, 1), c, ombre: o}); }
  });
  return out;
}
/* Les fleurs du bouquet : penchées hors du col, tournées chacune de son côté */
const VS_BOUQUET = [[0, -.12, .55], [2.2, .32, .48], [4.3, .3, .5]];
/* La petite statue (image de Yo, 10 novembre 2026 : « la petite statue qui doit prendre la forme de l'animal ou insecte
   capturé ») : un socle rond, épais, au bord arrondi ; dessus, un bloc de pierre brute, ou la bête sculptée (o.bete, statues.js) :
   son vrai modèle (insecte, oiseau, poisson, gibier), tout en pierre (la teinte de la statue, un peu plus claire ou plus
   sombre selon ses couleurs, pour garder ses formes), à la taille d'une statuette, en un seul dessin */
const ST = {socle: .1, h: .5, l: .6};   // la bête : au plus .5 de haut, .6 de long (de trois quarts, elle dépasse un peu du socle)
const ST_SOCLE = lathe([[0, 0], [.2, 0], [.225, .012], [.232, .05], [.225, .088], [.205, ST.socle], [0, ST.socle]], 28);
const ST_BLOC = boiteRonde(.26, .3, .22, .06, 2);
let fabriqueBete = null;
export function formeStatue(f){ fabriqueBete = f; }
const STATUES = new Map();
/* Le dos d'une forme fine (une aile) : les triangles retournés, les normales inversées */
function envers(geo){
  const g = geo.index ? geo.clone() : geo.clone();
  if(g.index){ const I = g.index.array.slice(); for(let i = 0; i < I.length; i += 3){ const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(new THREE.BufferAttribute(I, 1)); }
  else { const P = g.attributes.position, N = g.attributes.normal; for(let i = 0; i < P.count; i += 3) for(const A of [P, N]){ const x = A.getX(i + 1), y = A.getY(i + 1), z = A.getZ(i + 1); A.setXYZ(i + 1, A.getX(i + 2), A.getY(i + 2), A.getZ(i + 2)); A.setXYZ(i + 2, x, y, z); } }
  const N = g.attributes.normal; for(let i = 0; i < N.count; i++) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
  return g;
}
function beteEnPierre(cle, c){
  const k = cle + "|" + c;
  if(STATUES.has(k)) return STATUES.get(k);
  let modele = null;
  try{ modele = fabriqueBete && fabriqueBete(cle); }catch(e){ modele = null; }
  if(!modele){ STATUES.set(k, null); return null; }
  modele.updateMatrixWorld(true);
  const morceaux = [], base = new THREE.Color(c), lum = new THREE.Color();
  const parcourir = o => {
    if(o.isLOD){ if(o.levels[0]) parcourir(o.levels[0].object); return; }
    if(o.visible === false) return;
    if(o.isMesh && o.geometry && o.geometry.attributes.position && !(o.material && o.material.visible === false)){
      const mc = o.material && o.material.color ? o.material.color : null, l = mc ? (mc.r * .3 + mc.g * .59 + mc.b * .11) : .7;
      lum.copy(base).multiplyScalar(.82 + .3 * Math.min(1, l));
      let geo = o.geometry;
      if(!geo.attributes.normal){ geo = geo.clone(); geo.computeVertexNormals(); }   // les ailes fines des papillons : leurs normales
      morceaux.push({geo, m: o.matrixWorld.clone(), c: lum.getHex()});
      if(o.material && o.material.side === THREE.DoubleSide) morceaux.push({geo: envers(geo), m: o.matrixWorld.clone(), c: lum.getHex()});   // les ailes : vues des deux côtés
    }
    for(const e of o.children) parcourir(e);
  };
  parcourir(modele);
  if(!morceaux.length){ STATUES.set(k, null); return null; }
  const g = fusionner(morceaux);
  g.computeBoundingBox();
  const b = g.boundingBox, s = Math.min(ST.h / (b.max.y - b.min.y || 1), ST.l / Math.max(b.max.x - b.min.x, b.max.z - b.min.z, .01));
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.translate(0, ST.socle, 0);
  g.computeBoundingSphere();
  STATUES.set(k, g);
  return g;
}
/* Le miroir (image de Yo, 10 novembre 2026 : « Voici le miroir » ; « Vrai reflet devant, à mesurer ») : un miroir ovale sur pied ;
   un épais cadre ovale, deux montants un peu penchés et leurs boutons ronds là où il pivote, une traverse en arc, deux pieds en
   arche. Le bois prend sa teinte. La glace : un vrai reflet (la pièce et le personnage, vus dans la glace) seulement quand le
   personnage est tout près devant (MIROIR.pres) ; sinon, un reflet peint (un dégradé clair, des traits de lumière en biais).
   Le reflet : la scène dessinée une deuxième fois, en petit (256 × 384), depuis une caméra de l'autre côté de la glace */
const MI = {cy: .92, rx: .27, ry: .44, z: .02, pied: .42};
export const MIROIR = {joueur: null, pres: 2.2, actifs: 0};   // le personnage (main.js) ; à moins de pres, la glace reflète
const MI_CADRE = new THREE.TorusGeometry(1, .16, 10, 40);
const MI_GLACE = new THREE.CircleGeometry(1, 40);
const MI_MONTANT = boiteRonde(.1, .82, .12, .04, 2), MI_BOUTON = new THREE.SphereGeometry(.05, 12, 8), MI_RONDELLE = new THREE.CylinderGeometry(.06, .06, .05, 14).rotateZ(Math.PI / 2);
const MI_ARC = new THREE.TorusGeometry(.38, .055, 8, 20, Math.PI);
const MI_PIED = new THREE.TorusGeometry(.1, .045, 8, 12, Math.PI);
function miroirMorceaux(c){
  const o = ombreBois(0, 1.45), out = [];
  out.push({geo: MI_CADRE, m: M4(0, MI.cy, 0, 0, 0, 0, MI.rx + .03, MI.ry + .03, .25), c, ombre: o});        // le cadre ovale
  out.push({geo: MI_GLACE, m: M4(0, MI.cy, -.015, 0, Math.PI, 0, MI.rx + .02, MI.ry + .02, 1), c, ombre: o});   // le dos de bois
  for(const s of [-1, 1]){
    out.push({geo: MI_MONTANT, m: M4(s * .4, .53, 0, 0, 0, s * .06), c, ombre: o});                           // les montants, penchés vers le miroir
    out.push({geo: MI_RONDELLE, m: M4(s * .355, MI.cy, 0), c, ombre: o}, {geo: MI_BOUTON, m: M4(s * .4, MI.cy, 0), c, ombre: o});
    out.push({geo: MI_PIED, m: M4(s * .43, 0, 0, 0, Math.PI / 2, 0, 1, 1.2, 1), c, ombre: o});                 // les pieds en arche
  }
  out.push({geo: MI_ARC, m: M4(0, .1, 0, 0, 0, 0, 1.1, .5, 1.2), c, ombre: o});                               // la traverse en arc
  return out;
}
const MI_VS = `uniform mat4 textureMatrix; varying vec4 vProj; varying vec2 vUv;
void main(){ vUv = uv; vProj = textureMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MI_FS = `uniform sampler2D tDiffuse; uniform float uActif; varying vec4 vProj; varying vec2 vUv;
void main(){
  float s = fract((vUv.x + vUv.y) * 1.3);
  float trait = (smoothstep(.0, .03, s) - smoothstep(.1, .14, s)) * .45 + (smoothstep(.25, .27, s) - smoothstep(.31, .33, s)) * .3;
  vec3 peint = mix(vec3(.5, .62, .7), vec3(.72, .82, .88), vUv.y) + trait * .7;
  vec3 reflet = texture2DProj(tDiffuse, vProj).rgb * .9 + vec3(.03, .05, .07) + trait * .2;
  gl_FragColor = vec4(mix(peint, reflet, uActif), 1.0);
}`;
let enReflet = false;
const RF = {plan: new THREE.Plane(), normale: new THREE.Vector3(), pos: new THREE.Vector3(), cam: new THREE.Vector3(), rot: new THREE.Matrix4(), regard: new THREE.Vector3(),
  vue: new THREE.Vector3(), cible: new THREE.Vector3(), clip: new THREE.Vector4(), q: new THREE.Vector4(), virt: new THREE.PerspectiveCamera()};
function glaceMiroir(){
  const cible = new THREE.WebGLRenderTarget(256, 384, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});
  const mat = new THREE.ShaderMaterial({uniforms: {tDiffuse: {value: cible.texture}, textureMatrix: {value: new THREE.Matrix4()}, uActif: {value: 0}}, vertexShader: MI_VS, fragmentShader: MI_FS});
  const glace = new THREE.Mesh(MI_GLACE, mat);
  glace.scale.set(MI.rx, MI.ry, 1); glace.position.set(0, MI.cy, MI.z); glace.castShadow = false; glace.receiveShadow = false;
  glace.userData.cible = cible;
  glace.onBeforeRender = (renderer, scene, camera) => {
    const u = mat.uniforms;
    glace.getWorldPosition(RF.pos);
    const j = MIROIR.joueur, pres = j && !enReflet && Math.hypot(j.position.x - RF.pos.x, j.position.z - RF.pos.z) < MIROIR.pres;
    RF.rot.extractRotation(glace.matrixWorld); RF.normale.set(0, 0, 1).applyMatrix4(RF.rot);
    RF.cam.setFromMatrixPosition(camera.matrixWorld);
    if(!pres || RF.vue.subVectors(RF.pos, RF.cam).dot(RF.normale) > 0){ u.uActif.value = 0; return; }   // loin, ou vu de dos : le reflet peint
    /* la caméra virtuelle : le reflet de la caméra dans la glace (comme le Reflector de three.js) */
    RF.vue.reflect(RF.normale).negate().add(RF.pos);
    RF.rot.extractRotation(camera.matrixWorld);
    RF.regard.set(0, 0, -1).applyMatrix4(RF.rot).add(RF.cam);
    RF.cible.subVectors(RF.pos, RF.regard).reflect(RF.normale).negate().add(RF.pos);
    const v = RF.virt;
    v.position.copy(RF.vue); v.up.set(0, 1, 0).applyMatrix4(RF.rot).reflect(RF.normale); v.lookAt(RF.cible);
    v.far = camera.far; v.updateMatrixWorld(); v.projectionMatrix.copy(camera.projectionMatrix);
    u.textureMatrix.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(v.projectionMatrix).multiply(v.matrixWorldInverse).multiply(glace.matrixWorld);
    /* coupé au plan de la glace (ce qui est derrière elle n'apparaît pas) */
    RF.plan.setFromNormalAndCoplanarPoint(RF.normale, RF.pos).applyMatrix4(v.matrixWorldInverse);
    RF.clip.set(RF.plan.normal.x, RF.plan.normal.y, RF.plan.normal.z, RF.plan.constant);
    const P = v.projectionMatrix.elements;
    RF.q.x = (Math.sign(RF.clip.x) + P[8]) / P[0]; RF.q.y = (Math.sign(RF.clip.y) + P[9]) / P[5]; RF.q.z = -1; RF.q.w = (1 + P[10]) / P[14];
    RF.clip.multiplyScalar(2 / RF.clip.dot(RF.q));
    P[2] = RF.clip.x; P[6] = RF.clip.y; P[10] = RF.clip.z + 1; P[14] = RF.clip.w;
    /* la scène dessinée dans la glace : sans elle, sans refaire les ombres */
    const avant = renderer.getRenderTarget(), ombres = renderer.shadowMap.autoUpdate, info = renderer.info.render, d0 = info.calls, t0 = info.triangles;
    enReflet = true; glace.visible = false; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(cible); renderer.state.buffers.depth.setMask(true); renderer.clear(); renderer.render(scene, v);
    renderer.setRenderTarget(avant); renderer.shadowMap.autoUpdate = ombres; glace.visible = true; enReflet = false;
    info.calls += d0; info.triangles += t0;                            // le compteur de performance compte aussi le reflet (render() remet ses chiffres à zéro)
    u.uActif.value = 1; MIROIR.actifs++;
  };
  return glace;
}
/* La chandelle seule (son icône) */
export const chandelleSeule = () => modeleBois("chandelleSeule", 0, () => chandelleMorceaux(0));

const BUILD = {
  fauteuil(g, m){ g.add(modeleBois("fauteuil", m, fauteuilMorceaux)); },
  chaise(g, m){ g.add(modeleBois("chaise", m, chaiseMorceaux)); },
  tabouret(g, m){ g.add(modeleBois("tabouret", m, tabouretMorceaux)); },
  pot(g, m, o){                                                                      // vide, sa terre ; ou la fleur qu'on y a plantée (o.fleur)
    g.add(modeleBois("pot", m, potMorceaux));
    if(o && o.fleur && FLEURS[o.fleur]){ const f = fleurDuPot(o.fleur); f.scale.setScalar(.8); f.position.y = PO.terre + .01; g.add(f); }
  },
  lanterne(g, m, o){                                                                 // la lanterne sur pied, et la chandelle qu'on y a posée
    const garni = !!(o && o.bougie);
    g.add(modeleBois(garni ? "lanterneGarnie" : "lanterne", m, lanterneMorceaux(garni)));
    const v = new THREE.Mesh(LP_VERRE, garni ? verreLanterne : verreMat); v.position.x = LP.lx; v.applyMatrix4(LP_K); v.renderOrder = 1; v.castShadow = false; g.add(v);
    if(garni){ const f = new THREE.Mesh(CH_FLAMME, fireMat); f.position.set(LP.lx, LP.bas + (BG.haut - BG.bas + .01) * LP.s, 0); f.scale.setScalar(.62); f.applyMatrix4(LP_K); f.castShadow = false; g.add(f); }
  },
  chandelier(g, m, o){                                                               // l'argent de la mine (étape 1.11) : vide, ou ses chandelles (une à trois)
    const n = garniPose("chandelier", o);
    g.add(modeleBois(n ? "chandelier" + n : "chandelier", m, chandelierMorceaux(n)));
    if(n){ const f = new THREE.Mesh(CD_FLAMMES[n], fireMat); f.castShadow = false; g.add(f); }
  },
  /* Les lumières (demande de Yo, 11 octobre 2026 ; LUMIERE dans donnees.js) */
  chandelle(g, m, o){                                                                // le bougeoir, et la chandelle qu'on y a posée
    const garni = !!(o && o.bougie);
    g.add(modeleBois(garni ? "bougeoirGarni" : "bougeoir", m, bougeoirMorceaux(garni)));
    if(garni){ const f = new THREE.Mesh(CH_FLAMME, fireMat); f.position.y = BG.haut + .02; f.scale.setScalar(1.25); f.castShadow = false; g.add(f); }
  },
  /* La torchère sur pied : un socle de pierre, un poteau de bois, une coupelle de fer ; la torche posée dessus brûle
     toujours (o.torche) */
  torchere(g, m, o){                                                                 // la torchère vide, et la torche qu'on y a posée
    const torche = !!(o && o.torche);
    g.add(modeleBois(torche ? "torchereGarnie" : "torchere", m, torchereMorceaux(torche)));
    if(torche){ const f = new THREE.Mesh(TC_FLAMME, fireMat); f.position.y = 1.25; f.castShadow = false; g.add(f); }
  },
  /* La torchère murale (en cuivre, contre un mur de la pièce) : une plaque, un bras, une coupelle */
  torchereMurale(g, m, o){                                                           // la torchère murale vide, et la torche qu'on y a posée
    const torche = !!(o && o.torche);
    g.add(modeleBois(torche ? "torchereMuraleGarnie" : "torchereMurale", m, torchereMuraleMorceaux(torche)));
    if(torche){ const f = new THREE.Mesh(TC_FLAMME, fireMat); f.position.set(0, TM.fond + .02 + .27 * TM.k, .12); f.scale.setScalar(TM.k); f.castShadow = false; g.add(f); }
  },
  /* Le feu de camp (dehors seulement) : un cercle de pierres, des bûches croisées, les flammes */
  feuCamp(g, m, o){                                                                  // le feu de camp, sa broche vide ; vide, ou ses bûches qui brûlent (une à trois)
    const n = garniPose("feuCamp", o);
    g.add(modeleBois(n ? "feuCamp" + n : "feuCampVide", m, feuMorceaux(n)));
    if(n){ const f = new THREE.Mesh(FC_FLAMMES, fireMat); f.scale.setScalar([0, .8, .9, 1][n]); f.castShadow = false; g.add(f); }
  },
  /* La lanterne murale (cuivre, verre, une chandelle) : au mur d'une pièce ou sur une façade ; elle s'allume seule à la
     nuit tombée (nuitMat) */
  lanterneMurale(g, m, o){                                                           // la lanterne murale, et la chandelle qu'on y a posée
    const garni = !!(o && o.bougie);
    g.add(modeleBois(garni ? "lanterneMuraleGarnie" : "lanterneMurale", m, lanterneMuraleMorceaux(garni)));
    const v = new THREE.Mesh(LP_VERRE, garni ? verreLanterne : verreMat); v.position.x = LP.lx; v.applyMatrix4(LW_K); v.renderOrder = 1; v.castShadow = false; g.add(v);
    if(garni){ const f = new THREE.Mesh(CH_FLAMME, fireMat); f.position.set(LP.lx, LP.bas + (BG.haut - BG.bas + .01) * LP.s, 0); f.scale.setScalar(.62); f.applyMatrix4(LW_K); f.castShadow = false; g.add(f); }
  },
  /* Le bocal à lucioles (Grand Carnet : « une lumière douce et vivante ») : trois lucioles qui palpitent */
  bocalLucioles(g, m, o){                                                            // le bocal, vide ou avec ses lucioles
    const pleines = !!(o && o.lucioles);
    g.add(modeleBois(pleines ? "bocalPlein" : "bocal", m, bocalMorceaux(pleines)));
    const v = new THREE.Mesh(BJ_VITRE, pleines ? verreBocalPlein : verreBocal); v.renderOrder = 1; v.castShadow = false; g.add(v);
    if(pleines){ const l = new THREE.Mesh(BJ_LUEURS, lucioleMat); l.castShadow = false; g.add(l); }
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
  /* Le lustre (au plafond des grandes pièces : « éclaire toute la pièce ») : vide, ou avec ses chandelles (o.bougie, o.chandelles : une à cinq) */
  lustre(g, m, o){
    const n = garniPose("lustre", o);                                               // une à cinq chandelles
    g.add(modeleBois(n ? "lustre" + n : "lustre", m, lustreMorceaux(n)));
    if(n){ const f = new THREE.Mesh(LU_FLAMMES[n], fireMat); f.castShadow = false; g.add(f); }
  },
  /* La vitrine (étape 1.11 ; refaite d'après l'image de Yo, v2.1.180) : la pierre exposée se pose sur le coussin */
  vitrine(g, m, o){
    g.add(modeleBois("vitrine", m, vitrineMorceaux));
    const v = new THREE.Mesh(verreVitrine(), verreMat); v.castShadow = v.receiveShadow = false; v.renderOrder = 1; g.add(v);
    const pierre = o && o.pierre;
    if(pierre){ const p = pierreMesh(pierre); p.scale.setScalar(1.35); p.position.y = VT.plateau + .14; g.add(p); }
  },
  tonneau(g, m){ g.add(modeleBois("tonneau", m, tonneauMorceaux)); },
  /* Yo (8 novembre 2026 : « les coffres sont vraiment trop grands ; il faut qu'ils soient proportionnels aux autres meubles ») :
     le modèle aux deux tiers : .9 × .55 au sol, .68 de haut, à hauteur de genou à côté d'une chaise */
  coffre(g, m, o){ const cu = !!(o && o.style === "cuivre"), c = modeleBois(cu ? "coffreCuivre" : "coffre", m, coffreMorceaux(cu)); c.scale.setScalar(CF_ECHELLE); g.add(c); },

  banc(g, m){ g.add(modeleBois("banc", m, bancMorceaux)); },
  etagere(g, m){ g.add(modeleBois("etagere", m, etagereMorceaux)); },
  armoire(g, m){ g.add(modeleBois("armoire", m, armoireMorceaux)); },
  cheminee(g, m, o){                                                                 // vide, ou ses bûches qui brûlent (une à trois)
    const n = garniPose("cheminee", o);
    g.add(modeleBois(n ? "cheminee" + n : "cheminee", m, chemineeMorceaux(n)));
    if(n){ const f = new THREE.Mesh(FC_FLAMMES, fireMat); f.position.set(0, .07, -.06); f.scale.setScalar([0, .85, .95, 1.05][n]); f.castShadow = false; g.add(f); }
  },
  petitTapis(g, m){ g.add(modeleBois("petitTapis", m, petitTapisMorceaux)); },   // tressé, son bord roulé (image de Yo, 10 novembre 2026)
  table(g, m){ g.add(modeleBois("table", m, tableMorceaux)); },
  tableBanquet(g, m){ g.add(modeleBois("tableBanquet", m, tableBanquetMorceaux)); },
  lit(g, m){ g.add(modeleBois("lit", m, litMorceaux)); },
  vase(g, m, o){                                                                     // vide, ou son bouquet (une à trois fleurs coupées)
    g.add(modeleBois("vase", m, vaseMorceaux));
    (o && o.fleurs || []).slice(0, 3).forEach((k, j) => {
      if(!FLEURS[k]) return;
      const [a, p, h] = VS_BOUQUET[j], f = fleurCoupee(k, FLEURS[k].couleurs[0], h);
      f.position.y = VS.col; f.rotation.set(p, a, 0, "YXZ"); f.scale.setScalar(.55); g.add(f);
    });
  },
  miroir(g, m){ g.add(modeleBois("miroir", m, miroirMorceaux), glaceMiroir()); },   // le cadre et le pied (un dessin), la glace qui reflète
  rideau(g, m, o){ const f = !!(o && o.ferme); g.add(modeleBois(f ? "rideauFerme" : "rideau", m, rideauMorceaux(f))); },   // ouvert ou fermé (gestes.js)
  grandTapis(g, m){ g.add(modeleBois("grandTapis", m, grandTapisMorceaux)); },   // en nœuds, sa bande à losanges (image de Yo, 10 novembre 2026)
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
  statue(g, m, o){                                                                   // le socle ; le bloc brut, ou la bête sculptée (statues.js)
    const bete = o && o.bete ? beteEnPierre(o.bete, m) : null;
    g.add(modeleBois(bete ? "statueSocle" : "statue", m, c => [{geo: ST_SOCLE, m: M4(0, 0, 0), c, ombre: ombreBois(0, .5)}, ...(bete ? [] : [{geo: ST_BLOC, m: M4(0, ST.socle + .15, 0, 0, .3, 0), c, ombre: ombreBois(0, .5)}])]));
    if(bete){ const b = new THREE.Mesh(bete, MAT_UNI); b.rotation.y = (o.bete.startsWith("gibier:") ? Math.PI : 0) + Math.PI / 5; b.castShadow = b.receiveShadow = true; g.add(b); }   // de trois quarts, comme l'image (le gibier a la tête vers −z)
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
const PRISE = {chandelle:[.6, .7, .6, .3], bocalLucioles:[.6, .7, .6, .3], lanterne:[.8, 1.8, .6, .88], torchere:[.6, 1.9, .6, .9],
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
  if(o && o.eteint) g.traverse(c => { if(c.material === fireMat) c.visible = false; else if(c.material === glowMat || c.material === nuitMat) c.material = verreEteint; else if(c.material === verreLanterne) c.material = verreMat; });
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
