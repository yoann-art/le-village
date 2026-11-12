/* ================= Meubles =================
   Les modèles 3D des meubles, en formes simples (phase 1), et leur place au sol.
   Chaque modèle est centré sur son pied ; son devant regarde vers le bas de l'écran.
   Chaque meuble a une partie principale (m) qui prend la couleur choisie par le joueur. */
import { G, part, toon, fusionner, MAT_UNI, VENT } from "./formes.js";
import { MEUBLES, COULEURS, ATELIERS, couleurMeuble, garniPose, FLEURS, enFleur, saison } from "../donnees.js";
import { pierreMesh } from "./rochers.js";
import { fleurModele, fleurCoupee } from "./fleurs.js";
import { MODELES_POISSONS } from "./poissons3d.js";
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
const ORIGIN = {bouquet:0, vase:C.stone, rideau:0xE8DCC0, chaise:C.wood, fauteuil:C.wood, tableBanquet:C.wood, armoire:C.wood, tabouret:C.wood, pot:C.clay, lanterne:CUIVRE, tonneau:C.light, coffre:C.wood, banc:C.wood,
  etagere:C.wood, vitrine:C.wood, cheminee:C.stone, petitTapis:C.red, table:C.wood, lit:C.blue, grandTapis:C.blue, statue:C.stone,
  chandelier:0xD8DCE2, chandelle:0xC8743C, torchere:C.wood, torchereMurale:0xC8743C, feuCamp:C.stone, lanterneMurale:0xC8743C,
  bocalLucioles:CUIVRE, brasero:0xC8743C, lampadaire:C.dark, lustre:CUIVRE, etabli:C.wood, atelierDeco:C.light, tableTaille:C.stone2, comptoir:C.red, fourneau:C.stone, enclume:0x4A4F57, trone:C.dark};

/* ---------- Les meubles refaits d'après les images de Yo (chantier de la décoration, étape 3) ----------
   Un seul dessin chacun : leurs morceaux fusionnés, aux couleurs par sommet (MAT_UNI) ; tout le meuble de la couleur de sa
   matière (sa teinte), l'ombre douce peinte (le dessus plus clair, le dessous plus sombre). La forme est faite une fois par
   couleur, puis partagée. */
export const MEUBLES_REFAITS = ["tabouret", "chaise", "fauteuil", "banc", "table", "tableBanquet", "lit", "etagere", "armoire", "tonneau", "vitrine", "chandelle", "lanterne", "torchere", "bocalLucioles", "feuCamp", "torchereMurale", "lanterneMurale", "lustre", "chandelier", "cheminee", "petitTapis", "grandTapis", "rideau", "pot", "vase", "statue", "miroir", "bouquet", "herbier", "aquarium", "aquariumMoyen", "grandAquarium", "trophee", "cloture", "muret", "portail", "puitsEau", "fontaine", "panneau", "brasero"];
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
   arche. Le bois prend sa teinte. La glace : un reflet peint (un dégradé clair, des traits de lumière en biais) ; le vrai reflet
   (v2.1.206) retiré à la demande de Yo (« Retire le reflet du miroir, il n'est pas beau ») */
const MI = {cy: .92, rx: .27, ry: .44, z: .02, pied: .42};
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
const MI_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MI_FS = `varying vec2 vUv;
void main(){
  float s = fract((vUv.x + vUv.y) * 1.3);
  float trait = (smoothstep(.0, .03, s) - smoothstep(.1, .14, s)) * .45 + (smoothstep(.25, .27, s) - smoothstep(.31, .33, s)) * .3;
  gl_FragColor = vec4(mix(vec3(.5, .62, .7), vec3(.72, .82, .88), vUv.y) + trait * .7, 1.0);
}`;
const matGlace = new THREE.ShaderMaterial({vertexShader: MI_VS, fragmentShader: MI_FS});
function glaceMiroir(){
  const glace = new THREE.Mesh(MI_GLACE, matGlace);
  glace.scale.set(MI.rx, MI.ry, 1); glace.position.set(0, MI.cy, MI.z); glace.castShadow = false; glace.receiveShadow = false;
  return glace;
}
/* Le bouquet (image de Yo, 10 novembre 2026 : « Voici le bouquet » ; « Couché sur le côté ») : des fleurs de l'île, comme
   l'image : trois coquelicots ouverts (et deux boutons penchés), trois bleuets, trois pâquerettes (un peu plus grandes que
   sur l'île, comme les marguerites de l'image), deux pissenlits ; des feuilles ; les tiges serrées, nouées d'une corde à
   nœud. Fait debout puis couché sur le côté, les fleurs vers le haut ; ses couleurs ne changent pas ; un seul dessin */
const BQT = {lien: .15, haut: .5};
const BQT_TIGE = new THREE.CylinderGeometry(.011, .011, 1, 5).translate(0, .5, 0);
const BQT_PETALE = new THREE.SphereGeometry(1, 6, 4), BQT_COEUR = new THREE.SphereGeometry(1, 8, 6);
const BQT_COUPE = lathe([[0, -.01], [.03, -.005], [.065, .025], [.085, .06], [.08, .075], [.06, .05], [.03, .02], [0, .015]], 14);
const BQT_NOEUD = new THREE.TorusGeometry(.04, .011, 6, 16), BQT_BOUCLE = new THREE.TorusGeometry(.035, .009, 6, 14);
const BQT_FLEURS = [   // [sorte, x, y, z] : la tête de chaque fleur (debout, la face vers +z)
  ["coquelicot", 0, .5, .02], ["coquelicot", -.1, .41, .06], ["coquelicot", .11, .42, .04],
  ["bleuet", -.13, .48, -.02], ["bleuet", .02, .44, .09], ["bleuet", .16, .37, -.03],
  ["paquerette", .07, .48, -.05], ["paquerette", -.06, .36, .1], ["paquerette", .04, .35, .11],
  ["pissenlit", .13, .49, 0], ["pissenlit", -.13, .34, .05], ["bouton", .1, .56, -.04], ["bouton", -.18, .43, -.02]];
const tigeEntre = (a, b) => { const d = b.clone().sub(a), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, d.length(), 1)); };
function bouquetMorceaux(){
  const VERT = 0x7A9A3A, FEUILLE = 0x6E9A40, out = [], o = ombreBois(0, .25), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const face = (x, y, z) => { const n = V(x * 1.4, .35, 1).normalize(); return new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n); };   // la face, tournée vers l'extérieur
  const P = (geo, pos, q, s, c) => out.push({geo, m: new THREE.Matrix4().compose(pos, q, s), c, ombre: o});
  BQT_FLEURS.forEach(([k, x, y, z], j) => {
    const bas = V((j % 5 - 2) * .012, 0, ((j * 3) % 5 - 2) * .01), lien = V(bas.x * .5, BQT.lien, bas.z * .5), tete = V(x, y, z);
    out.push({geo: BQT_TIGE, m: tigeEntre(bas, lien), c: VERT, ombre: o}, {geo: BQT_TIGE, m: tigeEntre(lien, tete), c: VERT, ombre: o});
    const q = face(x, y, z), qr = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2), M = new THREE.Matrix4().compose(tete, q, V(1, 1, 1));
    const ici = (dx, dy, dz) => V(dx, dy, dz).applyMatrix4(M);
    if(k === "coquelicot"){                                                              // une coupe rouge ouverte, son cœur noir
      P(BQT_COUPE, tete, q.clone().multiply(qr), V(.82, .82, .82), 0xD8382A);
      P(BQT_COEUR, ici(0, 0, .024), q, V(.02, .02, .012), 0x3A2420);
    } else if(k === "bleuet"){                                                           // des pétales en étoile, un cœur bleu nuit
      for(let a = 0; a < 10; a++){ const t = a / 10 * Math.PI * 2; P(BQT_PETALE, ici(Math.cos(t) * .035, Math.sin(t) * .035, 0), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), t)), V(.034, .011, .009), 0x3E64D8); }
      P(BQT_COEUR, ici(0, 0, .006), q, V(.018, .018, .012), 0x2A3480);
    } else if(k === "paquerette"){                                                       // des pétales blancs, un cœur jaune
      for(let a = 0; a < 12; a++){ const t = a / 12 * Math.PI * 2; P(BQT_PETALE, ici(Math.cos(t) * .03, Math.sin(t) * .03, 0), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), t)), V(.026, .011, .005), 0xF6F2E6); }
      P(BQT_COEUR, ici(0, 0, .006), q, V(.014, .014, .008), 0xF2C22E);
    } else if(k === "pissenlit"){                                                        // un pompon jaune
      P(BQT_COEUR, tete, q, V(.042, .042, .03), 0xF2C42A);
      for(let a = 0; a < 10; a++){ const t = a / 10 * Math.PI * 2; P(BQT_PETALE, ici(Math.cos(t) * .036, Math.sin(t) * .036, -.004), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), t)), V(.02, .009, .008), 0xF2B820); }
    } else {                                                                             // un bouton penché : rouge dans ses sépales
      P(BQT_COEUR, tete, q, V(.016, .024, .016), 0xC83228);
      P(BQT_COEUR, ici(0, .008, -.004), q, V(.018, .016, .018), VERT);
    }
  });
  for(const [x, y, a] of [[-.1, .26, .8], [.11, .28, -.8], [-.05, .22, .3], [.06, .3, -.4], [0, .27, 0]])   // des feuilles
    P(BQT_PETALE, V(x, y, .02), new THREE.Quaternion().setFromEuler(new THREE.Euler(.3, 0, a)), V(.018, .07, .008), FEUILLE);
  /* la corde : un tour serré, le nœud, deux boucles, deux bouts */
  const CORDE = 0xE0B068;
  P(BQT_NOEUD, V(0, BQT.lien, 0), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2), V(1, 1, 1), CORDE);
  for(const s of [-1, 1]) P(BQT_BOUCLE, V(s * .04, BQT.lien + .005, .045), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, s * .4)), V(1, .7, 1), CORDE);
  for(const s of [-1, 1]) out.push({geo: BQT_TIGE, m: tigeEntre(V(0, BQT.lien, .045), V(s * .03, BQT.lien - .09, .05)), c: CORDE, ombre: o});
  P(BQT_COEUR, V(0, BQT.lien, .047), new THREE.Quaternion(), V(.016, .016, .012), CORDE);
  /* couché sur le côté : la longueur le long de x, les fleurs vers le haut, posé sur ses tiges */
  const C = new THREE.Matrix4().makeTranslation(-.25, .075, 0).multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2)).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
  for(const p of out) p.m = C.clone().multiply(p.m);
  return out;
}
/* La clôture en bois (image de Yo, 11 novembre 2026 : « Voici la clôture en bois » ; « Décoration seulement ») : dehors, un
   morceau par case ; des piquets à tête arrondie, deux traverses devant, une cheville ronde où la traverse croise un piquet ;
   tout de la teinte du bois. Les morceaux voisins se joignent (ile.js : o.voisins, les côtés « e », « n », « o », « s » où il y a
   une clôture) : une ligne droite, un angle, un T, une croix ; seul, il suit o.rot (0 : d'est en ouest, 1 : du nord au sud).
   Le piquet partagé entre deux cases : dessiné par celle de l'ouest ou du nord seulement */
const CL = {h: .62, larg: .16, ep: .07, rails: [.2, .44], bout: .4};
const CL_PIQUET = (() => { const s = new THREE.Shape(), r = CL.larg / 2, h = CL.h - r;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h); s.absarc(0, h, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return new THREE.ExtrudeGeometry(s, {depth: CL.ep - .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2, curveSegments: 8}).translate(0, 0, -(CL.ep - .03) / 2); })();
const CL_RAIL = boiteRonde(1, .1, .055, .025, 2), CL_CHEVILLE = new THREE.SphereGeometry(1, 10, 6);
const DIRS = {e: [1, 0], o: [-1, 0], s: [0, 1], n: [0, -1]}, OPPOSE = {e: "o", o: "e", s: "n", n: "s"}, PERP = {e: "ns", o: "ns", n: "eo", s: "eo"};
/* Les bras d'un morceau de clôture ou de muret : vers ses voisins ; le bout d'une ligne continue tout droit, ou tourne d'un côté
   ou de l'autre (o.tour : 0, 1, 2 ; un appui court, deplacer.js) ; seul, il suit o.rot (0 : d'est en ouest, 1 : du nord au sud) */
export function brasDe(o){
  const v = (o && o.voisins) || "";
  if(v.length > 1) return v;
  if(v.length === 1){ const t = (o && o.tour) || 0; return v + (t ? PERP[v][t - 1] : OPPOSE[v]); }
  return o && o.rot ? "ns" : "eo";
}
function clotureMorceaux(bras, voisins){ return c => {
  const o = ombreBois(0, CL.h), out = [], zr = CL.ep / 2 + .03;
  const piquet = (x, z, tourne) => out.push({geo: CL_PIQUET, m: M4(x, 0, z, 0, tourne ? Math.PI / 2 : 0, 0), c, ombre: o});
  const axeX = bras.includes("e") || bras.includes("o");
  piquet(0, 0, !axeX);                                                // le piquet du milieu
  for(const d of bras){
    const [dx, dz] = DIRS[d], lie = voisins.includes(d), fin = lie ? .5 : CL.bout;
    if(!lie || d === "o" || d === "n") piquet(dx * fin, dz * fin, !dx);   // le piquet du bout (le partagé : une seule fois)
    const l = lie ? .5 : CL.bout + .1, cx = dx * l / 2, cz = dz * l / 2;   // la traverse dépasse un peu le dernier piquet
    for(const y of CL.rails){
      out.push({geo: CL_RAIL, m: M4(cx + (dz ? zr : 0), y, cz + (dx ? zr : 0), 0, dx ? 0 : Math.PI / 2, 0, l + .02, 1, 1), c, ombre: o});
      for(const t of [0, fin]) if(t === 0 || !lie || d === "o" || d === "n")   // les chevilles : devant chaque piquet
        out.push({geo: CL_CHEVILLE, m: M4(dx * t + (dz ? zr + .03 : 0), y, dz * t + (dx ? zr + .03 : 0), 0, 0, 0, .026, .026, .014 + (dx ? 0 : .012)), c, ombre: o});
    }
  }
  return out;
}; }
/* Le puits (image de Yo, 11 novembre 2026 : « Voici le puits » ; « Retire la mousse ») : la margelle ronde de pierres bombées en
   quatre rangs décalés, couronnée de pierres plates ; l'eau sombre au fond ; deux montants de bois, leur linteau, leurs jambes de
   force ; le toit à deux pans de bardeaux arrondis, sa poutre de faîte ; le treuil, sa corde enroulée, la manivelle de cuivre à
   poignée de bois ; le seau de bois cerclé de cuivre. Une case ; 1,55 de haut. Il remplit l'arrosoir (Grand Carnet) : o.tire, le
   moment où l'on tire de l'eau : la manivelle tourne, le seau descend et remonte (PU.temps) */
const PU = {r: .395, ep: .14, rang: .15, n: 11, haut: .62, axe: .98, poteau: .4, faite: 1.52, egout: 1.2, bord: .55, bois: 0xC8955A, corde: 0xE3CC96, temps: 1300};
PU.pente = Math.atan2(PU.faite - PU.egout, PU.bord); PU.long = Math.hypot(PU.faite - PU.egout, PU.bord);
const PU_PIERRE = boiteRonde(1, 1, 1, .36, 1), PU_CARRE = boiteRonde(1, 1, 1, .12, 1), PU_TUILE = boiteRonde(1, 1, 1, .3, 1);
const PU_EAU = new THREE.CylinderGeometry(1, 1, 1, 20), PU_TIGE = new THREE.CylinderGeometry(1, 1, 1, 10), PU_BOULE = new THREE.SphereGeometry(1, 8, 6);
const PU_ANNEAU = new THREE.TorusGeometry(1, .38, 6, 14), PU_ANSE = new THREE.TorusGeometry(1, .09, 5, 12, Math.PI);
const PU_SEAU = lathe([[0, 0], [.072, 0], [.078, .004], [.094, .12], [.086, .12], [.07, .012], [0, .012]], 14);
function puitsMorceaux(c){
  const o = ombreBois(0, PU.faite), out = [], w = PU.bois, al = aleaMuret(4242), teinte = () => new THREE.Color(c).multiplyScalar(.88 + al() * .16).getHex();
  for(let r = 0; r < 4; r++) for(let k = 0; k < PU.n; k++){                         // la margelle : quatre rangs de pierres bombées, décalés
    const a = (k + (r % 2) * .5) / PU.n * Math.PI * 2, lg = 2 * Math.PI * PU.r / PU.n + .02;
    out.push({geo: PU_PIERRE, m: M4(Math.sin(a) * PU.r, r * PU.rang + PU.rang / 2, Math.cos(a) * PU.r, 0, a + (al() - .5) * .06, 0, lg * (.92 + al() * .12), PU.rang * (.95 + al() * .1), PU.ep), c: teinte(), ombre: o});
  }
  for(let k = 0; k < 10; k++){ const a = (k + .25) / 10 * Math.PI * 2;                // les pierres plates du dessus
    out.push({geo: PU_PIERRE, m: M4(Math.sin(a) * PU.r, PU.haut - .045, Math.cos(a) * PU.r, 0, a, 0, 2 * Math.PI * PU.r / 10 + .015, .09, PU.ep + .04), c: teinte(), ombre: o}); }
  out.push({geo: PU_EAU, m: M4(0, .32, 0, 0, 0, 0, PU.r - .04, .02, PU.r - .04), c: 0x24343C, ombre: o});   // l'eau sombre, au fond
  for(const s of [-1, 1]){
    const x = s * PU.poteau;
    out.push({geo: PU_CARRE, m: M4(x, (PU.haut + PU.egout + .06) / 2, 0, 0, 0, 0, .11, PU.egout + .06 - PU.haut, .11), c: w, ombre: o});   // le montant
    for(const d of [-1, 1]){ const bx = x + s * d * .1;                                // les jambes de force, dedans et dehors
      out.push({geo: PU_CARRE, m: M4(bx, PU.egout - .07, 0, 0, 0, s * d * Math.PI / 4, .05, .2, .07), c: w, ombre: o}); }
    out.push({geo: PU_CARRE, m: M4(x + s * .062, PU.axe, 0, 0, 0, 0, .015, .16, .1), c: CUIVRE, ombre: o});   // la plaque du palier
    for(const y of [PU.axe - .05, PU.axe + .05]) out.push({geo: PU_BOULE, m: M4(x + s * .07, y, 0, 0, 0, 0, .012, .012, .012), c: CUIVRE, ombre: o});
  }
  out.push({geo: PU_CARRE, m: M4(0, PU.egout + .03, 0, 0, 0, 0, 1.1, .08, .09), c: w, ombre: o});        // le linteau
  for(const sz of [-1, 1]){                                                          // les deux pans : une planche, deux rangs de bardeaux
    const dir = new THREE.Vector3(0, -Math.sin(PU.pente), sz * Math.cos(PU.pente)), nor = new THREE.Vector3(0, Math.cos(PU.pente), sz * Math.sin(PU.pente));
    const pos = s => new THREE.Vector3(0, PU.faite, 0).addScaledVector(dir, s);
    const p0 = pos(PU.long / 2).addScaledVector(nor, -.02);
    out.push({geo: PU_CARRE, m: M4(p0.x, p0.y, p0.z, sz * PU.pente, 0, 0, 1.18, .03, PU.long), c: new THREE.Color(w).multiplyScalar(.8).getHex(), ombre: o});
    const RANGS = [[.2, [-2, -1, 0, 1, 2].map(k => [k * .235, .225])],                // le rang du haut : cinq bardeaux
      [.5, [[-.53, .11], ...[-1.5, -.5, .5, 1.5].map(k => [k * .235, .225]), [.53, .11]]]];   // celui du bas, décalé : quatre, et un demi à chaque bout (Yo : « il manque 2 planches »)
    for(const [s, tuiles] of RANGS) for(const [x, lg] of tuiles){ const p = pos(s).addScaledVector(nor, .025 + s * .02);
      out.push({geo: PU_TUILE, m: M4(x, p.y, p.z, sz * PU.pente, 0, (al() - .5) * .05, lg, .04, .36), c: new THREE.Color(w).multiplyScalar(.95 + al() * .1).getHex(), ombre: o}); }
  }
  out.push({geo: PU_CARRE, m: M4(0, PU.faite + .04, 0, 0, 0, 0, 1.26, .1, .12), c: w, ombre: o});      // la poutre de faîte, ses bouts
  for(const s of [-1, 1]) out.push({geo: PU_CARRE, m: M4(s * .6, PU.faite + .05, 0, 0, 0, 0, .14, .15, .17), c: w, ombre: o});
  return out;
}
/* le treuil, tourné autour de son axe (x) : l'arbre, la corde enroulée, la manivelle */
function treuilMorceaux(c){
  const o = ombreBois(-.15, .1), out = [];
  out.push({geo: PU_TIGE, m: M4(0, 0, 0, 0, 0, Math.PI / 2, .04, .84, .04), c: PU.bois, ombre: o});
  for(let k = 0; k < 5; k++) out.push({geo: PU_ANNEAU, m: M4(-.08 + k * .04, 0, 0, 0, Math.PI / 2, 0, .058, .058, .058), c: PU.corde, ombre: o});
  out.push({geo: PU_TIGE, m: M4(.47, 0, 0, 0, 0, Math.PI / 2, .055, .02, .055), c: CUIVRE, ombre: o},   // la rondelle
    {geo: PU_TIGE, m: M4(.5, -.06, 0, 0, 0, 0, .016, .14, .016), c: CUIVRE, ombre: o},                   // le bras de la manivelle
    {geo: PU_TIGE, m: M4(.47, 0, 0, 0, 0, Math.PI / 2, .016, .07, .016), c: CUIVRE, ombre: o},
    {geo: PU_TIGE, m: M4(.57, -.13, 0, 0, 0, Math.PI / 2, .028, .13, .028), c: PU.bois, ombre: o});     // la poignée de bois
  return out;
}
function seauMorceaux(c){                                                           // le seau, le haut de son anse à l'origine
  const o = ombreBois(-.22, 0), out = [], y0 = -.21;
  out.push({geo: PU_SEAU, m: M4(0, y0, 0), c: PU.bois, ombre: o});
  for(const [y, r] of [[.022, .08], [.1, .091]]) out.push({geo: PU_ANNEAU, m: M4(0, y0 + y, 0, Math.PI / 2, 0, 0, r, r, .03), c: CUIVRE, ombre: o});
  out.push({geo: PU_ANSE, m: M4(0, y0 + .12, 0, 0, 0, 0, .092, .09, .092), c: CUIVRE, ombre: o});
  for(const s of [-1, 1]) out.push({geo: PU_BOULE, m: M4(s * .092, y0 + .11, 0, 0, 0, 0, .014, .014, .014), c: CUIVRE, ombre: o});
  return out;
}
const PU_CORDE = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, -.5, 0);    // la corde qui pend, son haut à l'origine
/* Le brasero (image de Yo, 12 novembre 2026 : « Voici le brasero ») : une vasque ronde de cuivre, son rebord épais, une bande
   cloutée de rivets ronds ; trois pieds en volute, enroulés en bas, un bouton en haut ; tout en cuivre (sa teinte de métal). Vide ;
   le charbon qu'on y met, un morceau à la fois (o.feu, comme les bûches du feu de camp) : des blocs sombres sur un lit de braises,
   les flammes au-dessus (fireMat) */
const BR = {fond: .2, bord: .5, r: .33, bande: .42, pied: .72};
const BR_VASQUE = lathe([[0, BR.fond], [.06, BR.fond], [.14, BR.fond + .03], [.22, BR.fond + .08], [.28, BR.fond + .15], [BR.r, BR.bord - .05], [BR.r + .005, BR.bord],
  [BR.r - .03, BR.bord + .005], [BR.r - .035, BR.bord - .02], [.25, BR.fond + .14], [.17, BR.fond + .08], [0, BR.fond + .06]], 24);
const BR_LEVRE = new THREE.TorusGeometry(BR.r - .012, .028, 8, 28).rotateX(Math.PI / 2), BR_BANDE = new THREE.CylinderGeometry(BR.r - .02, BR.r - .045, .06, 28, 1, true);
const BR_PIED = (() => { const P = [[.19, .44], [.26, .42], [.28, .36], [.25, .27], [.21, .17], [.21, .08], [.25, .035], [.31, .03], [.335, .065], [.315, .1], [.28, .085], [.285, .06]]
  .map(([r, y]) => new THREE.Vector3(0, y * BR.pied, r * 1.05));   // trapus, comme l'image
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 40, .04, 8, false); })();
const BR_CHARBON = new THREE.DodecahedronGeometry(1, 0);
const BR_BRAISES = new THREE.CylinderGeometry(.23, .17, .05, 16);
/* les blocs de charbon : [x, z, taille], par morceau mis (un, deux, trois) */
const BR_BLOCS = [[[0, 0, .085], [.1, .06, .07], [-.09, .05, .07], [.02, -.1, .065]], [[.15, -.07, .065], [-.15, -.06, .07], [-.04, .14, .06]], [[.06, .02, .07], [-.05, -.04, .065], [.12, .15, .055]]];
function braseroMorceaux(n){ return c => {
  const o = ombreBois(0, BR.bord), out = [];
  out.push({geo: BR_VASQUE, m: M4(0, 0, 0), c, ombre: o}, {geo: BR_LEVRE, m: M4(0, BR.bord, 0), c, ombre: o},
    {geo: BR_BANDE, m: M4(0, BR.bande, 0, 0, 0, 0, 1.035, 1, 1.035), c: new THREE.Color(c).multiplyScalar(1.06).getHex(), ombre: o});
  for(let k = 0; k < 9; k++){ const a = (k + .5) / 9 * Math.PI * 2;                     // les rivets de la bande
    out.push({geo: PU_BOULE, m: M4(Math.sin(a) * (BR.r - .005), BR.bande, Math.cos(a) * (BR.r - .005), 0, 0, 0, .022, .022, .022), c, ombre: o}); }
  for(let k = 0; k < 3; k++){ const a = k / 3 * Math.PI * 2 + Math.PI / 3;              // les pieds en volute, et leur bouton
    out.push({geo: BR_PIED, m: M4(0, 0, 0, 0, a, 0), c, ombre: o},
      {geo: PU_BOULE, m: M4(Math.sin(a) * .29, .395 * BR.pied, Math.cos(a) * .29, 0, 0, 0, .04, .04, .04), c, ombre: o}); }
  if(n){ out.push({geo: BR_BRAISES, m: M4(0, BR.bord - .1, 0), c: 0xC8461C, ombre: () => 1.25});   // le lit de braises
    for(const [x, z, s] of BR_BLOCS.slice(0, n).flat()) out.push({geo: BR_CHARBON, m: M4(x, BR.bord - .07 + s * .45, z, s * 9, s * 13, s * 7, s, s * .8, s), c: 0x4A3A36, ombre: (px, py) => py < BR.bord - .06 ? 1.5 : .9}); }
  return out;
}; }
/* Le panneau (image de Yo, 11 novembre 2026 : « Voici le panneau en bois » ; « On peut y écrire un mot ») : un poteau carré au
   bout arrondi, deux planches assemblées aux bords arrondis, quatre clous de cuivre ; tout du même bois. Le mot (o.texte, panneaux.js)
   peint en brun sur le devant (le poteau est derrière) ; le panneau regarde vers +z, tourné de o.rot quarts de tour */
const PA = {haut: 1.06, cy: .78, l: .74, h: .34, ep: .07, poteau: .17};
const PA_PLANCHE = boiteRonde(1, 1, 1, .11, 2), PA_POTEAU = boiteRonde(1, 1, 1, .12, 2);
const PA_TEXTE = new THREE.PlaneGeometry(PA.l - .14, PA.h - .08);
function panneauMorceaux(c){
  const o = ombreBois(0, PA.haut), out = [];
  out.push({geo: PA_POTEAU, m: M4(0, PA.haut / 2, -(PA.ep + PA.poteau) / 2 + .01, 0, 0, 0, PA.poteau, PA.haut, PA.poteau), c, ombre: o});
  for(const [y, h] of [[PA.cy + PA.h / 4 + .004, PA.h / 2 + .01], [PA.cy - PA.h / 4 - .004, PA.h / 2 - .005]])   // les deux planches
    out.push({geo: PA_PLANCHE, m: M4(0, y, 0, 0, 0, (y > PA.cy ? .006 : -.004), PA.l, h, PA.ep), c, ombre: o});
  for(const [x, y] of [[-.3, PA.cy + .07], [.3, PA.cy + .1], [-.3, PA.cy - .1], [.3, PA.cy - .07]])
    out.push({geo: PU_BOULE, m: M4(x, y, PA.ep / 2 + .002, 0, 0, 0, .022, .022, .012), c: CUIVRE, ombre: o});
  return out;
}
const MOTS_PEINTS = new Map();
/* le mot peint : une petite image faite une fois par mot (la police du jeu, si elle est déjà chargée) */
function motPeint(texte){
  const police = document.fonts && document.fonts.check("40px 'Pirata One'") ? "'Pirata One'" : "Georgia, serif", cle = texte + "|" + police;
  if(!MOTS_PEINTS.has(cle)){
    const c = document.createElement("canvas"); c.width = 512; c.height = 128;
    const x = c.getContext("2d"); let t = 92;
    x.font = `${t}px ${police}`; while(x.measureText(texte).width > 480 && t > 30){ t -= 4; x.font = `${t}px ${police}`; }
    x.fillStyle = "#4A2A16"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(texte, 256, 68);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 2;
    MOTS_PEINTS.set(cle, new THREE.MeshLambertMaterial({map: tex, transparent: true, depthWrite: false}));
  }
  return MOTS_PEINTS.get(cle);
}
/* La fontaine (image de Yo, 11 novembre 2026 : « Voici la fontaine » ; Grand Carnet : « Coule sans fin, on l'entend de loin ») :
   le grand bassin rond, deux rangs de pierres bombées ; la vasque du milieu et la petite vasque du haut sur leurs pieds de pierre,
   leurs rebords de pierres ; la boule au sommet. L'eau : les trois bassins qui ondulent, quatre filets qui tombent d'une vasque à
   l'autre (le mouvement descend), l'écume qui bouillonne où ils tombent ; tout suit VENT.temps (main.js), rien à recalculer en
   jouant. Une case, un peu plus haute que le personnage */
const FO = {bas: {r: .44, h: .38, eau: .3, n: 13}, mil: {y: .44, r: .3, haut: .62, eau: .585, n: 11}, sup: {y: .72, r: .19, haut: .84, eau: .815, n: 8}};
const FO_PIERRE = boiteRonde(1, 1, 1, .36, 1);
const FO_EAU_VS = `uniform float temps; varying vec2 vUv; varying vec3 vP;
void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const matBassin = new THREE.ShaderMaterial({uniforms: {temps: VENT.temps}, vertexShader: FO_EAU_VS, transparent: true, depthWrite: false, fragmentShader: `uniform float temps; varying vec3 vP;
void main(){
  float a = sin(vP.x * 26.0 + temps * 1.6 + sin(vP.z * 19.0)) * sin(vP.z * 23.0 - temps * 1.3 + sin(vP.x * 17.0));
  float trait = smoothstep(.55, .85, a);
  gl_FragColor = vec4(mix(vec3(.30, .74, .82), vec3(.80, .95, .98), trait * .75), .86);
}`});
const matFilet = new THREE.ShaderMaterial({uniforms: {temps: VENT.temps}, vertexShader: FO_EAU_VS, transparent: true, depthWrite: false, fragmentShader: `uniform float temps; varying vec2 vUv;
void main(){
  float s = fract(vUv.x * 4.0 - temps * 1.8 + sin(vUv.y * 6.283) * .15);
  float trait = smoothstep(.0, .15, s) - smoothstep(.35, .6, s);
  gl_FragColor = vec4(mix(vec3(.55, .86, .94), vec3(.93, .99, 1.0), trait * .8), .72);
}`});
const matEcume = new THREE.MeshBasicMaterial({color: 0xF4FBFC});
/* un rang de pierres en anneau : n pierres, au rayon r, à la hauteur y ; pente : penchées vers l'extérieur */
function anneauPierres(out, al, c, o, n, r, y, h, d, pente = 0, dec = 0){
  const lg = 2 * Math.PI * r / n + .015;
  for(let k = 0; k < n; k++){ const a = (k + dec) / n * Math.PI * 2;
    out.push({geo: FO_PIERRE, m: M4(Math.sin(a) * r, y, Math.cos(a) * r, -pente, a + (al() - .5) * .05, 0, lg * (.93 + al() * .1), h * (.94 + al() * .1), d), c: new THREE.Color(c).multiplyScalar(.88 + al() * .16).getHex(), ombre: o}); }
}
function fontaineMorceaux(c){
  const o = ombreBois(0, 1), out = [], al = aleaMuret(777), sombre = new THREE.Color(c).multiplyScalar(.78).getHex(), {bas, mil, sup} = FO;
  anneauPierres(out, al, c, o, bas.n, bas.r, .095, .19, .1);                      // le grand bassin : deux rangs
  anneauPierres(out, al, c, o, bas.n, bas.r, .285, .19, .11, 0, .5);
  out.push({geo: lathe([[0, .02], [bas.r - .04, .02], [bas.r - .04, .06], [0, .06]], 20), m: M4(0, 0, 0), c: sombre, ombre: o});   // son fond
  out.push({geo: lathe([[0, 0], [.15, 0], [.16, .05], [.12, .1], [.1, .1], [.09, mil.y], [0, mil.y]], 16), m: M4(0, 0, 0), c, ombre: o});   // le pied du milieu
  anneauPierres(out, al, c, o, 7, .13, .07, .1, .07);
  out.push({geo: lathe([[0, mil.y], [.11, mil.y], [.2, mil.y + .05], [mil.r - .03, mil.haut - .06], [0, mil.haut - .06]], 20), m: M4(0, 0, 0), c: sombre, ombre: o});   // la vasque du milieu
  anneauPierres(out, al, c, o, 9, .19, mil.y + .07, .1, .07, .7);
  anneauPierres(out, al, c, o, mil.n, mil.r, mil.haut - .045, .1, .085, 0, .3);
  out.push({geo: lathe([[0, mil.haut - .04], [.075, mil.haut - .04], [.08, mil.haut + .02], [.065, mil.haut + .03], [.06, sup.y], [0, sup.y]], 14), m: M4(0, 0, 0), c, ombre: o});   // le pied du haut
  anneauPierres(out, al, c, o, 6, .085, mil.haut + .01, .06, .05);
  out.push({geo: lathe([[0, sup.y], [.07, sup.y], [.13, sup.y + .04], [sup.r - .02, sup.haut - .04], [0, sup.haut - .04]], 16), m: M4(0, 0, 0), c: sombre, ombre: o});   // la petite vasque
  anneauPierres(out, al, c, o, 7, .12, sup.y + .045, .07, .05, .7, .5);
  anneauPierres(out, al, c, o, sup.n, sup.r, sup.haut - .035, .075, .06, 0);
  out.push({geo: lathe([[0, sup.eau - .02], [.055, sup.eau - .02], [.055, .88], [.07, .89], [.072, .92], [.05, .93], [0, .93]], 14), m: M4(0, 0, 0), c, ombre: o});   // le fût, son anneau
  out.push({geo: PU_BOULE, m: M4(0, .99, 0, 0, 0, 0, .065, .065, .065), c, ombre: o});   // la boule
  return out;
}
const FO_BASSINS = (() => {                                                         // l'eau des trois bassins, ensemble
  const dis = (r, y) => new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2).translate(0, y, 0);
  return mergeGeos([dis(FO.bas.r - .05, FO.bas.eau), dis(FO.mil.r - .04, FO.mil.eau), dis(FO.sup.r - .035, FO.sup.eau)]);
})();
/* les quatre filets : deux de la petite vasque vers celle du milieu, deux de celle du milieu vers le bassin */
const FO_CHUTES = [[FO.sup, FO.mil, .55], [FO.sup, FO.mil, -.55], [FO.mil, {eau: FO.bas.eau, r: FO.bas.r}, .95], [FO.mil, {eau: FO.bas.eau, r: FO.bas.r}, -.95]];
const FO_FILETS = mergeGeos(FO_CHUTES.map(([de, vers, a]) => {
  const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), r0 = de.r + .01, r1 = vers === FO.mil ? FO.mil.r - .07 : FO.bas.r - .1;
  const P = (r, y) => d.clone().multiplyScalar(r).setY(y);
  const courbe = new THREE.CubicBezierCurve3(P(r0 - .03, de.haut - .015), P(r0 + .05, de.haut), P(r1 + .02, (de.haut + vers.eau) / 2), P(r1, vers.eau));
  return new THREE.TubeGeometry(courbe, 14, .034, 6, false).scale(1, 1, 1);
}));
const FO_BULLE = new THREE.SphereGeometry(1, 7, 5);
const FO_ECUME = mergeGeos(FO_CHUTES.flatMap(([de, vers, a], j) => {                  // l'écume, où tombe chaque filet
  const r1 = vers === FO.mil ? FO.mil.r - .07 : FO.bas.r - .1, x = Math.sin(a) * r1, z = Math.cos(a) * r1, out = [];
  for(let k = 0; k < 6; k++){ const b = k / 6 * Math.PI * 2 + j, rr = .02 + (k % 2) * .018, s = .014 + (k % 3) * .006;
    out.push(FO_BULLE.clone().scale(s, s * .8, s).translate(x + Math.cos(b) * rr, vers.eau + .005, z + Math.sin(b) * rr)); }
  return out;
}));
function mergeGeos(geos){                                                           // des formes sans couleur, en une seule
  let n = 0; for(const g of geos) n += (g.index ? g.index.count : g.attributes.position.count);
  const pos = [], uv = [];
  for(const g0 of geos){ const g = g0.index ? g0.toNonIndexed() : g0, P = g.attributes.position, U = g.attributes.uv;
    for(let i = 0; i < P.count; i++){ pos.push(P.getX(i), P.getY(i), P.getZ(i)); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0); } }
  const r = new THREE.BufferGeometry(); r.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); r.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  r.computeVertexNormals(); return r;
}
/* pour la préparation au chargement (main.js) : l'eau de la fontaine, le mot peint d'un panneau, déjà prêts quand on en pose un */
export function echantillonsFontaine(){
  const g = new THREE.Group();
  for(const [geo, mat] of [[FO_BASSINS, matBassin], [FO_FILETS, matFilet], [FO_ECUME, matEcume], [PA_TEXTE, motPeint("Hearthwild")]]){ const m = new THREE.Mesh(geo, mat); m.visible = false; m.scale.setScalar(.001); g.add(m); }
  return g;
}
/* Le portail (image de Yo, 11 novembre 2026 : « Voici le portail. Il faut qu'il puisse s'ouvrir et se fermer ») : deux piliers
   carrés, leur chapeau et leur boule ; deux battants de planches, le haut en arc, leur cadre, deux traverses ; des pentures de cuivre
   cloutées, le verrou de cuivre au milieu. Tout du même bois. Une case de large (les piliers au bord, à .5 du milieu). Les battants
   tournent sur leurs gonds (o.ouvert ; o.bouge : quand, pour les faire pivoter doucement) et s'ouvrent vers l'arrière (-z) ; le sens
   du portail : ses voisins (clôture, muret) ou o.rot (0 à 3, un quart de tour chacun) */
const PL = {gond: .39, bas: .04, cote: .6, haut: .8, pilier: .2, hp: .64, ouvre: Math.PI / 2 * .92, temps: 700};
PL.yc = (PL.haut * PL.haut - PL.cote * PL.cote - PL.gond * PL.gond) / (2 * (PL.haut - PL.cote)); PL.R = PL.haut - PL.yc;
const ptHaut = x => PL.yc + Math.sqrt(Math.max(0, PL.R * PL.R - x * x));          // le haut en arc des deux battants
function ptForme(x0, x1, bas, ep = 0){                                               // de x0 à x1, du bas jusqu'à l'arc (moins ep)
  const s = new THREE.Shape(); s.moveTo(x0, bas); s.lineTo(x1, bas);
  for(let k = 0; k <= 6; k++){ const x = x1 + (x0 - x1) * k / 6; s.lineTo(x, ptHaut(x) - ep); }
  s.lineTo(x0, bas); return s;
}
function ptBande(x0, x1, ep){                                                        // la bande du cadre, sous l'arc
  const s = new THREE.Shape(), n = 6;
  for(let k = 0; k <= n; k++){ const x = x0 + (x1 - x0) * k / n; k ? s.lineTo(x, ptHaut(x)) : s.moveTo(x, ptHaut(x)); }
  for(let k = n; k >= 0; k--){ const x = x0 + (x1 - x0) * k / n; s.lineTo(x, ptHaut(x) - ep); }
  return s;
}
const ptExtrude = (s, d) => new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 1, curveSegments: 4}).translate(0, 0, -d / 2);
const PT_BOULE = new THREE.SphereGeometry(1, 14, 10), PT_CLOU = new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
const PT_CARRE = boiteRonde(1, 1, 1, .09, 2), PT_BOITE = boiteRonde(1, 1, 1, .2, 1), PT_TIGE = new THREE.CylinderGeometry(1, 1, 1, 10), PT_LOSANGE = boiteRonde(1, 1, 1, .15, 1);
const PT_GEO = {};                                                                   // les formes en arc d'un battant (s : -1 à gauche, 1 à droite)
for(const s of [-1, 1]){
  const a = s * .006, b = s * (PL.gond - .005), planches = [], n = 5;
  for(let k = 0; k < n; k++){ const x0 = a + (b - a) * k / n, x1 = a + (b - a) * (k + 1) / n - s * .006; planches.push(ptExtrude(ptForme(Math.min(x0, x1), Math.max(x0, x1), PL.bas), .03)); }
  PT_GEO[s] = {planches, arc: ptExtrude(ptBande(Math.min(a, b), Math.max(a, b), .06), .05)};
}
function piliersMorceaux(c){
  const o = ombreBois(0, PL.hp + .2), out = [];
  for(const s of [-1, 1]){
    const x = s * .5;
    out.push({geo: PT_CARRE, m: M4(x, PL.hp / 2, 0, 0, 0, 0, PL.pilier, PL.hp, PL.pilier), c, ombre: o},
      {geo: PT_CARRE, m: M4(x, PL.hp + .035, 0, 0, 0, 0, PL.pilier + .05, .075, PL.pilier + .05), c, ombre: o},
      {geo: PT_BOULE, m: M4(x, PL.hp + .145, 0, 0, 0, 0, .075, .072, .075), c, ombre: o});
  }
  return out;
}
/* un battant (s : -1 à gauche, 1 à droite), son gond à l'origine */
function battantMorceaux(s){ return c => {
  const o = ombreBois(0, PL.haut), sombre = new THREE.Color(c).multiplyScalar(.86).getHex(), out = [], cu = CUIVRE;
  const X = x => s * x;                                                              // de l'axe du portail vers ce battant
  for(const g of PT_GEO[s].planches) out.push({geo: g, m: M4(0, 0, 0), c: sombre, ombre: o});
  out.push({geo: PT_GEO[s].arc, m: M4(0, 0, .012), c, ombre: o});
  const hBord = ptHaut(X(.36)) - .03 - PL.bas, hMil = ptHaut(X(.035)) - .03 - PL.bas;
  out.push({geo: PT_BOITE, m: M4(X(.36), PL.bas + hBord / 2, .012, 0, 0, 0, .05, hBord, .05), c, ombre: o},   // le montant du gond
    {geo: PT_BOITE, m: M4(X(.036), PL.bas + hMil / 2, .012, 0, 0, 0, .06, hMil, .05), c, ombre: o});        // le montant du milieu
  for(const y of [.17, .51]){
    out.push({geo: PT_BOITE, m: M4(X(.2), y, .016, 0, 0, 0, .27, .07, .045), c, ombre: o});                // la traverse
    out.push({geo: PT_CLOU, m: M4(X(.09), y, .039, Math.PI / 2, 0, 0, .014, .01, .014), c, ombre: o});     // son clou
    out.push({geo: PT_BOITE, m: M4(X(.315), y, .043, 0, 0, 0, .16, .05, .012), c: cu, ombre: o},            // la penture
      {geo: PT_LOSANGE, m: M4(X(.24), y, .043, 0, 0, Math.PI / 4, .045, .045, .012), c: cu, ombre: o},
      {geo: PT_TIGE, m: M4(X(.393), y, .012, 0, 0, 0, .016, .09, .016), c: cu, ombre: o});                 // le gond
    for(const x of [.36, .3, .25]) out.push({geo: PT_CLOU, m: M4(X(x), y, .049, Math.PI / 2, 0, 0, .009, .006, .009), c: cu, ombre: o});
  }
  out.push({geo: PT_BOITE, m: M4(X(.035), .42, .043, 0, 0, 0, .035, .13, .01), c: cu, ombre: o});         // la plaque du verrou
  for(const y of [.375, .465]) out.push({geo: PT_CLOU, m: M4(X(.035), y, .048, Math.PI / 2, 0, 0, .008, .006, .008), c: cu, ombre: o});
  if(s < 0){                                                                         // le verrou : sa tige, son bouton, sur le battant de gauche
    out.push({geo: PT_TIGE, m: M4(.005, .42, .06, 0, 0, Math.PI / 2, .013, .15, .013), c: cu, ombre: o},
      {geo: PT_BOULE, m: M4(-.07, .42, .06, 0, 0, 0, .02, .02, .02), c: cu, ombre: o},
      {geo: PT_BOULE, m: M4(.08, .42, .06, 0, 0, 0, .016, .016, .016), c: cu, ombre: o});
  }
  const t = new THREE.Matrix4().makeTranslation(-s * PL.gond, 0, 0);                // le gond à l'origine
  for(const p of out) p.m = t.clone().multiply(p.m);
  return out;
}; }
const lissePt = t => t * t * (3 - 2 * t);
/* le sens du portail : l'axe de ses voisins, sinon o.rot ; o.rot ≥ 2 : il s'ouvre de l'autre côté */
export function sensPortail(o){
  const v = (o && o.voisins) || "", r = (o && o.rot) || 0, retourne = r >= 2;
  const axeNS = /[eo]/.test(v) ? false : /[ns]/.test(v) ? true : r % 2 === 1;
  return (axeNS ? 1 : 0) + (retourne ? 2 : 0);
}
/* Le muret de pierre (image de Yo, 11 novembre 2026 : « Voici le Muret de pierre ») : de la pierre sèche, deux rangs de pierres
   rondes et bombées de tailles variées, couronnés de grandes pierres plates (deux par case) ; des touffes de mousse jaune-vert sur
   les coins et dans les creux (la vraie mousse des vieux murets). Mi-cuisse (.55), on voit par-dessus. Dehors, un morceau par case,
   joint à ses voisins comme la clôture (o.voisins, mêmes bras) ; le fond plus sombre entre les pierres. La pierre des champs */
const MU = {h: .55, d: .46, cap: .15, rangs: [[0, .23, .44], [.2, .22, .42]]};   // [bas, hauteur, profondeur] des deux rangs
const MU_CAP = boiteRonde(1, 1, 1, .3, 2), MU_PIERRE = boiteRonde(1, 1, 1, .4, 2), MU_FOND = new THREE.BoxGeometry(1, 1, 1);
const MU_MOUSSE = new THREE.SphereGeometry(1, 8, 5), MOUSSE_M = [0xB4C832, 0x98B22A, 0xC4D444];
const aleaMuret = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
/* la mousse : une touffe de petites boules aplaties, autour de (x, y, z) */
function touffe(out, x, y, z, t, al, o){
  const n = 6 + Math.floor(al() * 4);
  for(let k = 0; k < n; k++){ const a = al() * Math.PI * 2, r = t * (.2 + al() * .8), s = t * (.35 + al() * .3);
    out.push({geo: MU_MOUSSE, m: M4(x + Math.cos(a) * r, y + al() * t * .25, z + Math.sin(a) * r * .7, 0, 0, 0, s, s * .7, s), c: MOUSSE_M[k % 3], ombre: o}); }
}
/* un pan droit de u0 à u1 le long de l'axe x (avant/arrière en z), graine : son tirage */
function panMuret(out, c, o, u0, u1, graine, mousse){
  const al = aleaMuret(graine * 7919 + 13), L = u1 - u0, teinte = () => new THREE.Color(c).multiplyScalar(.9 + al() * .14).getHex();
  out.push({geo: MU_FOND, m: M4((u0 + u1) / 2, (MU.h - MU.cap) / 2, 0, 0, 0, 0, L - .06, MU.h - MU.cap, MU.d - .24), c: new THREE.Color(c).multiplyScalar(.5).getHex(), ombre: o});
  for(const [bas, h, d] of MU.rangs){                                // deux rangs de pierres rondes, de largeurs variées
    let u = u0;
    while(u1 - u > .06){
      let w = .13 + al() * .24; if(u1 - u - w < .12) w = u1 - u;
      const hh = h * (.88 + al() * .16);
      out.push({geo: MU_PIERRE, m: M4(u + w / 2, bas + hh / 2, (al() - .5) * .03, 0, (al() - .5) * .08, (al() - .5) * .06, w + .02, hh, d), c: teinte(), ombre: o});
      u += w;
    }
  }
  const n = 1, wc = L / n;                                           // une seule grande pierre plate, en long (Yo, 11 novembre 2026)
  for(let k = 0; k < n; k++)
    out.push({geo: MU_CAP, m: M4(u0 + wc * (k + .5), MU.h - MU.cap / 2, 0, (al() - .5) * .04, (al() - .5) * .05, (al() - .5) * .04, wc - .014, MU.cap, MU.d), c: teinte(), ombre: o});
  if(mousse){                                                        // la mousse : un coin du dessus, un creux, un pied
    const g = al() < .5 ? -1 : 1;
    touffe(out, u0 + L / 2 + g * L * .38, MU.h - .01, -MU.d * .2, .12, al, o);
    touffe(out, u0 + L * (.3 + al() * .4), MU.h - MU.cap, MU.d / 2 - .01, .075, al, o);
    if(al() < .6) touffe(out, u0 + L / 2 - g * L * .4, .1, MU.d * .48, .085, al, o);
  }
}
function muretMorceaux(bras, voisins){ return c => {
  const o = ombreBois(0, MU.h), out = [], fin = d => voisins.includes(d) ? .5 : .46;
  const droit = bras === "eo" || bras === "oe" || bras === "ns" || bras === "sn";
  const tourne = (debut, k) => { for(let j = debut; j < out.length; j++){ const m = out[j].m.clone(); out[j].m = new THREE.Matrix4().makeRotationY(k).multiply(m); } };
  if(droit){
    const ax = bras.includes("e"), d0 = ax ? "o" : "n", d1 = ax ? "e" : "s", n = out.length;
    panMuret(out, c, o, -fin(d0), fin(d1), 1, true);
    if(!ax) tourne(n, -Math.PI / 2);
    return out;
  }
  const n0 = out.length;                                             // le coin : un pilier carré au milieu, puis chaque bras
  panMuret(out, c, o, -MU.d / 2, MU.d / 2, 2, false);
  const ROT = {e: 0, n: Math.PI / 2, o: Math.PI, s: -Math.PI / 2};
  for(const d of bras){ const n = out.length; panMuret(out, c, o, MU.d / 2, fin(d), 3 + "enos".indexOf(d), d === bras[0]); tourne(n, ROT[d]); }
  return out;
}; }
/* Le trophée de gibier (image de Yo, 11 novembre 2026 : « Voici le trophée de gibier. Il faut qu'il fonctionne comme la petite
   statue » ; « Le gibier seulement ») : au mur, un écusson de bois en forme de bouclier (sa teinte), un cadre en relief, une
   plaque de cuivre à deux clous et ses feuilles gravées. Vide quand on l'accroche ; « Sculpter » (statues.js) y met le buste
   d'un gibier du carnet (o.bete, « gibier:cerf ») : son vrai modèle, tourné vers la pièce, la tête et le cou devant l'écusson
   (le corps derrière, caché par l'écusson et le mur), en bois clair sculpté, un dessin. Le mur est à z −.25 */
const TR = {cy: 1.4, z: -.238, bois: 0xE8B878, tete: .26, h: .62, l: .62};
const bouclier = k => { const s = new THREE.Shape(); s.moveTo(-.28 * k, .25 * k); s.lineTo(0, .32 * k); s.lineTo(.28 * k, .25 * k); s.lineTo(.28 * k, -.05 * k);
  s.quadraticCurveTo(.27 * k, -.28 * k, 0, -.42 * k); s.quadraticCurveTo(-.27 * k, -.28 * k, -.28 * k, -.05 * k); s.closePath(); return s; };
const TR_PLANCHE = new THREE.ExtrudeGeometry(bouclier(1), {depth: .035, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, curveSegments: 8});
const TR_CADRE = (() => { const s = bouclier(1), h = new THREE.Path(); h.setFromPoints(bouclier(.84).getPoints(8)); s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, {depth: .016, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2, curveSegments: 8}); })();
const TR_PLAQUE = boiteRonde(.24, .07, .016, .007, 1), TR_FACE = TR.z + .059;            // la face de l'écusson
function tropheeMorceaux(c){
  const o = ombreBois(TR.cy - .45, TR.cy + .35), fond = new THREE.Color(c).multiplyScalar(.86).getHex();   // le fond un peu plus sombre : le cadre ressort
  const out = [{geo: TR_PLANCHE, m: M4(0, TR.cy, TR.z), c: fond, ombre: o}, {geo: TR_CADRE, m: M4(0, TR.cy, TR_FACE - .004), c, ombre: o}];
  const yp = TR.cy - .3;
  out.push({geo: TR_PLAQUE, m: M4(0, yp, TR_FACE + .006), c: CUIVRE, ombre: o});        // la plaque de cuivre
  for(const s of [-1, 1]) out.push({geo: AQ_GALET, m: M4(s * .095, yp, TR_FACE + .015, 0, 0, 0, .011, .011, .007), c: 0xA85E2C, ombre: o});   // ses clous
  const G = (x, y, rz, sx, sy) => out.push({geo: AQ_GALET, m: M4(x, y, TR_FACE + .0145, 0, 0, rz, sx, sy, .002), c: 0x9A5226, ombre: o});   // les feuilles gravées
  G(0, yp - .004, 0, .003, .022);
  for(const s of [-1, 1]){ G(s * .012, yp + .01, -s * .7, .005, .012); for(let j = 0; j < 3; j++) G(s * (.03 + j * .018), yp - .006 + (j % 2) * .006, -s * (1.2 + j * .1), .005, .011); }
  return out;
}
/* Le buste sculpté : la tête du gibier (son vrai modèle : userData.tete, ses bois, ses oreilles, son groin), tournée vers la
   pièce et un peu de côté ; dessous, un poitrail de mèches de poil sculptées, comme l'image ; tout en bois clair, un seul dessin.
   La taille : la tête (son plus gros morceau) large de TR.tete, sans dépasser TR.h de haut ni TR.l de large */
const BUSTES = new Map();
function busteEnBois(cle){
  if(BUSTES.has(cle)) return BUSTES.get(cle);
  let modele = null;
  try{ modele = fabriqueBete && fabriqueBete(cle); }catch(e){ modele = null; }
  const tete = modele && modele.userData && modele.userData.tete;
  if(!tete){ BUSTES.set(cle, null); return null; }
  const pivot = new THREE.Group(); pivot.add(modele); pivot.rotation.y = Math.PI; pivot.updateMatrixWorld(true);   // la tête (vers −z) vers la pièce
  const base = new THREE.Color(TR.bois), lum = new THREE.Color(), morceaux = [], bb = new THREE.Box3(), t = new THREE.Vector3();
  let gros = null, vMax = 0;
  const parcourir = o => {
    if(o.visible === false) return;
    if(o.isMesh && o.geometry && o.geometry.attributes.position && !(o.material && o.material.visible === false)){
      const mc = o.material && o.material.color ? o.material.color : null, l = mc ? (mc.r * .3 + mc.g * .59 + mc.b * .11) : .7;
      lum.copy(base).multiplyScalar(.72 + .4 * Math.min(1, l));
      let geo = o.geometry;
      if(!geo.attributes.normal){ geo = geo.clone(); geo.computeVertexNormals(); }
      const m = {geo, m: o.matrixWorld.clone(), c: lum.getHex()};
      geo.computeBoundingBox(); bb.copy(geo.boundingBox).applyMatrix4(o.matrixWorld); bb.getSize(t);
      if(t.x * t.y * t.z > vMax){ vMax = t.x * t.y * t.z; gros = bb.clone(); }
      morceaux.push(m);
    }
    for(const e of o.children) parcourir(e);
  };
  parcourir(tete);
  if(!morceaux.length){ BUSTES.set(cle, null); return null; }
  const d = new THREE.Box3(), v = new THREE.Vector3();
  for(const m of morceaux){ const P = m.geo.attributes.position; for(let i = 0; i < P.count; i++) d.expandByPoint(v.fromBufferAttribute(P, i).applyMatrix4(m.m)); }
  const s = Math.min(TR.tete / (gros.max.x - gros.min.x || 1), TR.h / (d.max.y - d.min.y || 1), TR.l / (d.max.x - d.min.x || 1));
  const cx = (gros.min.x + gros.max.x) / 2, cz = (gros.min.z + gros.max.z) / 2;
  const T = new THREE.Matrix4().makeTranslation(0, TR.cy - .06, TR_FACE + .04 + TR.tete * .45)   // le bas de la tête, au-dessus du poitrail
    .multiply(new THREE.Matrix4().makeRotationY(-.35)).multiply(new THREE.Matrix4().makeRotationX(-.12)).multiply(new THREE.Matrix4().makeScale(s, s, s))
    .multiply(new THREE.Matrix4().makeTranslation(-cx, -gros.min.y, -cz));
  for(const m of morceaux) m.m.premultiply(T);
  /* le poitrail : des mèches en pointe, rangée après rangée, jusqu'à une pointe au-dessus de la plaque */
  const poil = base.clone().multiplyScalar(.92).getHex();
  [[3, .13, -.01], [3, .16, -.065], [2, .09, -.12], [1, 0, -.165]].forEach(([n, l, y], r) => {
    for(let k = 0; k < n; k++){ const x = n > 1 ? -l / 2 + k * l / (n - 1) : 0;
      morceaux.push({geo: AQ_GALET, m: M4(x, TR.cy + y, TR_FACE + .05 - r * .007, -.25, 0, -x * 1.8, .065, .085, .03), c: (k + r) % 2 ? poil : base.getHex()}); }
  });
  const g = fusionner(morceaux);
  g.computeBoundingSphere();
  BUSTES.set(cle, g);
  return g;
}
/* L'herbier encadré (image de Yo, 10 novembre 2026 : « Voici l'herbier encadré » ; « Vide ») : au mur ; un cadre de bois épais
   aux coins arrondis, un fond de papier crème, une corde tressée à une cheville ronde. Vide quand on l'accroche ; on y pose
   jusqu'à six fleurs cueillies, une à une (o.fleurs), séchées en relief, chacune sa tige, deux feuilles et sa petite étiquette,
   deux rangées de trois. Le cadre prend la teinte de son bois ; les fleurs gardent leurs couleurs. Le mur est à z −.25 */
const HB = {cy: 1.32, l: .62, z: -.21, papier: 0xEEDDB4};
const HB_MONTANT = boiteRonde(.075, HB.l, .06, .03, 2), HB_TRAVERSE = boiteRonde(HB.l, .075, .06, .03, 2);
const HB_BOULE = new THREE.SphereGeometry(1, 7, 5), HB_CORDE = new THREE.CylinderGeometry(.009, .009, 1, 6).translate(0, .5, 0);
const HB_PLACES = [[-.17, .1], [0, .1], [.17, .1], [-.17, -.13], [0, -.13], [.17, -.13]];
function fleurSechee(out, k, x, y, o){
  const f = FLEURS[k];
  if(!f) return;
  const z = HB.z + .04, c = f.couleurs[0], V = (a, b, d) => new THREE.Vector3(a, b, d);
  const B = (px, py, sx, sy, rz, col, pz = z) => out.push({geo: HB_BOULE, m: M4(px, py, pz, 0, 0, rz, sx, sy, .006), c: col, ombre: o});
  out.push({geo: new THREE.BoxGeometry(.006, .1, .006), m: M4(x, y - .02, z), c: 0x6E8A3A, ombre: o});                 // la tige
  for(const s of [-1, 1]) B(x + s * .022, y - .045, .028, .01, s * .6, 0x6E8A3A);                                      // deux feuilles
  out.push({geo: new THREE.BoxGeometry(.08, .022, .004), m: M4(x, y - .085, z - .006), c: 0xE8D2A0, ombre: o});         // l'étiquette
  out.push({geo: new THREE.BoxGeometry(.045, .003, .003), m: M4(x, y - .085, z - .003), c: 0x6A5040, ombre: o});        // son écriture
  const h = y + .04;
  if(f.forme === "coupe") for(let a = 0; a < 4; a++){ const t = a / 4 * Math.PI * 2 + .4; B(x + Math.cos(t) * .022, h + Math.sin(t) * .022, .026, .022, t, c); }
  else if(f.forme === "boule"){ B(x, h, .03, .03, 0, c); for(let a = 0; a < 10; a++){ const t = a / 10 * Math.PI * 2; B(x + Math.cos(t) * .03, h + Math.sin(t) * .03, .014, .006, t, c); } }
  else if(f.forme === "epi") for(let a = 0; a < 5; a++) B(x, h - .02 + a * .014, .012, .01, 0, c);
  else if(f.forme === "clochette"){ for(let a = 0; a < 3; a++) B(x + .018, h + .01 - a * .022, .009, .011, 0, c); }
  else for(let a = 0; a < 11; a++){ const t = a / 11 * Math.PI * 2; B(x + Math.cos(t) * .022, h + Math.sin(t) * .022, .02, .007, t, c); }   // en étoile
  if(f.forme !== "epi" && f.forme !== "clochette") B(x, h, .011, .011, 0, f.coeur || c, z + .003);                       // son cœur (le pissenlit : tout jaune)
}
function herbierMorceaux(fleurs){ return c => {
  const o = ombreBois(HB.cy - .35, HB.cy + .45), out = [], d = HB.l / 2 - .0375;
  for(const s of [-1, 1]) out.push({geo: HB_MONTANT, m: M4(s * d, HB.cy, HB.z), c, ombre: o}, {geo: HB_TRAVERSE, m: M4(0, HB.cy + s * d, HB.z), c, ombre: o});
  out.push({geo: new THREE.BoxGeometry(HB.l - .1, HB.l - .1, .012), m: M4(0, HB.cy, HB.z - .012), c: HB.papier, ombre: o});   // le papier
  /* la corde à la cheville */
  out.push({geo: HB_BOULE, m: M4(0, HB.cy + .44, -.23, 0, 0, 0, .032, .032, .03), c, ombre: o});
  for(const s of [-1, 1]){
    const a = new THREE.Vector3(s * .17, HB.cy + d + .03, HB.z - .01), b = new THREE.Vector3(0, HB.cy + .43, -.21), dv = b.clone().sub(a);
    out.push({geo: HB_CORDE, m: new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize()), new THREE.Vector3(1, dv.length(), 1)), c: 0xD8A868, ombre: o});
    out.push({geo: HB_BOULE, m: M4(s * .17, HB.cy + d + .03, HB.z, 0, 0, 0, .022, .022, .02), c, ombre: o});
  }
  fleurs.slice(0, 6).forEach((k, j) => fleurSechee(out, k, HB_PLACES[j][0], HB.cy + HB_PLACES[j][1], o));
  return out;
}; }
/* Le petit aquarium (image de Yo, 10 novembre 2026 : « Voici le petit aquarium ») : un bocal rond de verre au col épais,
   l'eau bleue, des galets clairs et gris au fond, une plante d'eau ; sur un socle de bois rond à quatre pieds (sa teinte). Sans
   poisson quand on le pose ; on y met un poisson pêché (o.poisson ; la koï, sa robe : o.robe), qui fait le tour du bocal
   (nagerAquariums, à chaque image). Le bois, les galets, la plante : un dessin ; l'eau, le verre, le poisson : un chacun */
const AQ = {socle: .13, cy: .34, r: .22, eau: .45};
const AQ_PROFIL = (r, haut) => { const p = []; for(let a = -1.42; a <= haut + 1e-6; a += (haut + 1.42) / 14) p.push([r * Math.cos(a), AQ.cy + r * .92 * Math.sin(a)]); return p; };
const AQ_VERRE = lathe([[0, AQ.socle + .015], ...AQ_PROFIL(AQ.r, 1.0), [.14, .56], [.165, .57], [.17, .59], [.155, .605], [.135, .595], [.13, .575]], 28);
const AQ_EAU = lathe([[0, AQ.socle + .02], ...AQ_PROFIL(AQ.r - .012, Math.asin((AQ.eau - AQ.cy) / ((AQ.r - .012) * .92))), [0, AQ.eau]], 28);
const AQ_PLATEAU = lathe([[0, .1], [.21, .1], [.225, .108], [.228, .12], [.218, AQ.socle], [0, AQ.socle]], 24);
const AQ_PIED = boiteRonde(.05, .11, .05, .02, 1), AQ_GALET = new THREE.SphereGeometry(1, 7, 5);
/* Yo (10 novembre 2026 : « on voit mal les poissons ; il faut aussi que l'eau soit plus claire ») : l'eau, un voile bleu très
   léger ; le verre plus fin ; les poissons, les plantes et les galets éclairés comme dans un aquarium (leurs couleurs pleines,
   sans l'ombre de la pièce : MAT_AQUA), les poissons dessinés après l'eau et le verre (ils gardent leurs couleurs) */
const matEau = toon({color: 0xB4E2F2, transparent: true, opacity: .18, depthWrite: false});
const matBocal = toon({color: 0xEEF8FC, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide});
const MAT_AQUA = new THREE.MeshBasicMaterial({vertexColors: true});
const MAT_POISSON_AQUA = new THREE.MeshBasicMaterial({vertexColors: true, transparent: true, side: THREE.DoubleSide});
function aquariumMorceaux(c){
  const o = ombreBois(0, .6), out = [{geo: AQ_PLATEAU, m: M4(0, 0, 0), c, ombre: o}];
  for(const [x, z] of [[.13, .13], [-.13, .13], [.13, -.13], [-.13, -.13]]) out.push({geo: AQ_PIED, m: M4(x, .055, z), c, ombre: o});
  return out;
}
const AQ_DECOR = (() => {                                            // les galets et la plante du petit aquarium (éclairés)
  const out = [{geo: new THREE.CylinderGeometry(.12, .07, .04, 16), m: M4(0, AQ.socle + .04, 0), c: 0xE2CDA0}];   // le lit de sable clair
  /* les galets : un lit clair, quelques gris, deux gros */
  for(let k = 0; k < 30; k++){ const a = k * 2.4, y = AQ.socle + .05 + (k % 4) * .008, rmax = AQ.r * .98 * Math.cos(Math.asin(Math.max(-1, (y - AQ.cy) / (AQ.r * .92)))) - .02,
      r = (.15 + (k % 7) / 7 * .85) * rmax, s = k % 9 === 0 ? .026 : .013 + (k % 3) * .004;   // dans le fond rond du bocal
    out.push({geo: AQ_GALET, m: M4(Math.cos(a) * r, y, Math.sin(a) * r, 0, a, 0, s, s * .75, s), c: k % 4 === 0 ? 0x8A8680 : [0xE8D2A8, 0xD8B888, 0xF0E0C0][k % 3]}); }
  /* la plante d'eau : une tige et des feuilles longues */
  const T = (x, y, z, rx, rz, l) => out.push({geo: AQ_GALET, m: M4(x, y, z, rx, 0, rz, .012, l, .006), c: 0x6EAA3A});
  for(const [x, z] of [[-.05, .02], [-.03, -.02]]){ T(x, AQ.socle + .12, z, 0, 0, .08);
    for(let k = 0; k < 4; k++){ const y = AQ.socle + .07 + k * .035, s = k % 2 ? 1 : -1; T(x + s * .025, y, z, 0, s * .9, .03); } }
  return fusionner(out);
})();
/* Un poisson allégé pour les aquariums : les sommets proches fondus en un (une grille de CASES cases sur sa longueur), ses
   formes et ses couleurs gardées, dix fois moins de triangles (ses modèles font 5 000 à 20 000 triangles) ; en cache */
const LEGERS = new Map();
function alleger(geo, cases = 22){
  geo.computeBoundingBox();
  const b = geo.boundingBox, t = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) / cases, P = geo.attributes.position;
  const I = geo.index ? geo.index.array : Array.from({length: P.count}, (_, i) => i), garde = new Map(), vers = new Int32Array(P.count), neuf = [];
  for(let i = 0; i < P.count; i++){
    const cle = `${Math.floor(P.getX(i) / t)},${Math.floor(P.getY(i) / t)},${Math.floor(P.getZ(i) / t)}`;
    if(!garde.has(cle)){ garde.set(cle, neuf.length); neuf.push(i); }
    vers[i] = garde.get(cle);
  }
  const tri = [];
  for(let j = 0; j < I.length; j += 3){ const a = vers[I[j]], c = vers[I[j + 1]], d = vers[I[j + 2]]; if(a !== c && c !== d && a !== d) tri.push(a, c, d); }
  const g = new THREE.BufferGeometry();
  for(const [nom, A] of Object.entries(geo.attributes)){
    const arr = new A.array.constructor(neuf.length * A.itemSize);
    neuf.forEach((i, n) => { for(let k = 0; k < A.itemSize; k++) arr[n * A.itemSize + k] = A.array[i * A.itemSize + k]; });
    g.setAttribute(nom, new THREE.BufferAttribute(arr, A.itemSize, A.normalized));
  }
  g.setIndex(tri); g.computeBoundingSphere();
  return g;
}
function poissonLeger(k, robe){
  const M = MODELES_POISSONS[k];
  if(!M) return null;
  const cle = k + "|" + (robe || "");
  if(!LEGERS.has(cle)){
    const f = M.fabrique(M.couleurs ? (robe || M.couleurs[0]) : undefined), m = [];
    f.updateMatrixWorld(true);
    f.traverse(o => { if(o.isMesh) m.push({geo: alleger(o.geometry.clone().applyMatrix4(o.matrixWorld)), mat: o.material}); });
    LEGERS.set(cle, m);
  }
  const g = new THREE.Group();
  for(const {geo} of LEGERS.get(cle)){ const me = new THREE.Mesh(geo, MAT_POISSON_AQUA); me.castShadow = false; me.renderOrder = 3; g.add(me); }   // éclairé, devant l'eau
  return g;
}
/* Le poisson de l'aquarium : son modèle allégé, petit, qui tourne dans le bocal */
const AQUA = new Set();
function poissonAquarium(k, robe, longueur = .15){
  const f = poissonLeger(k, robe);
  if(!f) return null;
  const b = new THREE.Box3().setFromObject(f), l = Math.max(b.max.x - b.min.x, .01);
  f.scale.multiplyScalar(longueur / l);
  const c = new THREE.Box3().setFromObject(f).getCenter(new THREE.Vector3()); f.position.sub(c);   // son milieu au milieu
  const g = new THREE.Group(); g.add(f); g.userData.t0 = Math.random() * 10; AQUA.add(g);
  g.position.set(.085, AQ.cy - .02, 0); g.rotation.y = Math.PI / 2 + Math.PI;
  return g;
}
export function nagerAquariums(t){
  for(const g of AQUA){
    if(!g.parent || !g.parent.parent){ if(g.userData.vu) AQUA.delete(g); continue; }   // l'aquarium rangé, ou la pièce quittée
    g.userData.vu = true;
    const n = g.userData.bac;
    if(n){                                                          // l'aquarium moyen : d'un bout à l'autre du bac, la tête devant
      const u = (t + g.userData.t0) * n.vite, x = Math.sin(u) * n.l, vx = Math.cos(u);
      g.position.set(x, n.y + Math.sin(t * 1.1 + g.userData.t0) * .03, n.z + Math.sin(u * .7) * .05);
      g.rotation.y = vx > 0 ? Math.PI : 0;
      continue;
    }
    const a = (t + g.userData.t0) * .55, r = .085;
    g.position.set(Math.cos(a) * r, AQ.cy - .02 + Math.sin(t * 1.3 + g.userData.t0) * .015, Math.sin(a) * r);
    g.rotation.y = Math.PI / 2 - a + Math.PI;                       // la tête (vers −x) devant, dans le sens où il nage
  }
}
/* L'aquarium moyen (image de Yo, 10 novembre 2026 : « Voici l'aquarium moyen ») : un meuble bas de bois (deux portes à panneau,
   deux boutons ronds, un plateau à rebord, des pieds découpés ; sa teinte) ; dessus un bac de verre aux arêtes arrondies, l'eau
   bleue, des galets clairs, trois pierres grises, trois sortes de plantes d'eau. Vide quand on le pose ; trois poissons, un à
   la fois (o.poissons), qui vont d'un bout à l'autre du bac */
const AM = {meuble: .55, bas: .63, haut: 1.1, l: 1.1, p: .44, eau: 1.02};
const AM_CAISSON = boiteRonde(1.16, .46, .5, .04, 2), AM_PLATEAU = boiteRonde(1.22, .07, .55, .03, 2), AM_PIED = boiteRonde(.14, .1, .1, .03, 1);
const AM_PORTE = boiteRonde(.5, .34, .04, .015, 1), AM_PANNEAU = boiteRonde(.4, .25, .03, .012, 1), AM_BOUTON = new THREE.SphereGeometry(.03, 10, 8);
const AM_ARETE_X = boiteRonde(AM.l, .025, .025, .012, 1), AM_ARETE_Y = boiteRonde(.025, AM.haut - AM.bas, .025, .012, 1), AM_ARETE_Z = boiteRonde(.025, .025, AM.p, .012, 1);
const AM_VERRE = new THREE.BoxGeometry(AM.l - .01, AM.haut - AM.bas - .01, AM.p - .01), AM_EAU = new THREE.BoxGeometry(AM.l - .04, AM.eau - AM.bas - .02, AM.p - .04);
function aquariumMoyenMorceaux(c){
  const o = ombreBois(0, AM.haut), out = [], Mx = (geo, x, y, z, cc = c, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => out.push({geo, m: M4(x, y, z, rx, ry, rz, sx, sy, sz), c: cc, ombre: o});
  /* le meuble */
  Mx(AM_CAISSON, 0, .32, 0); Mx(AM_PLATEAU, 0, AM.meuble + .035, 0);
  for(const s of [-1, 1]){ Mx(AM_PIED, s * .5, .05, .17); Mx(AM_PIED, s * .5, .05, -.17);
    Mx(AM_PORTE, s * .27, .32, .255); Mx(AM_PANNEAU, s * .27, .32, .275); Mx(AM_BOUTON, s * .06, .32, .29); }
  /* les arêtes du bac */
  const y0 = AM.bas, y1 = AM.haut, hx = AM.l / 2, hz = AM.p / 2;
  for(const y of [y0, y1]) for(const z of [-hz, hz]) Mx(AM_ARETE_X, 0, y, z, 0xE8F2F4);
  for(const y of [y0, y1]) for(const x of [-hx, hx]) Mx(AM_ARETE_Z, x, y, 0, 0xE8F2F4);
  for(const x of [-hx, hx]) for(const z of [-hz, hz]) Mx(AM_ARETE_Y, x, (y0 + y1) / 2, z, 0xE8F2F4);
  return out;
}
const AM_DECOR = (() => {                                            // les galets, les pierres, les plantes de l'aquarium moyen (éclairés)
  const out = [], y0 = AM.bas, Mx = (geo, x, y, z, cc, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => out.push({geo, m: M4(x, y, z, rx, ry, rz, sx, sy, sz), c: cc});
  out.push({geo: new THREE.BoxGeometry(AM.l - .03, .03, AM.p - .03), m: M4(0, y0 + .02, 0), c: 0xE2CDA0});   // le lit de sable clair
  for(let k = 0; k < 60; k++){ const x = ((k * 37) % 100) / 100 * (AM.l - .1) - (AM.l - .1) / 2, z = ((k * 61) % 100) / 100 * (AM.p - .1) - (AM.p - .1) / 2, s = .018 + (k % 3) * .004;
    Mx(AQ_GALET, x, y0 + .03 + (k % 3) * .006, z, [0xE8D2A8, 0xD8B888, 0xF0E0C0][k % 3], 0, k, 0, s, s * .75, s); }
  for(const [x, z, s] of [[-.28, -.04, .09], [-.16, .06, .06], [.3, -.05, .075]]) Mx(AQ_GALET, x, y0 + .04, z, 0x8A8480, 0, x * 9, 0, s, s * .75, s);
  /* les plantes : de longues herbes ondulées, une petite à feuilles rondes, une à grandes feuilles */
  for(let k = 0; k < 5; k++){ const x = -.38 + k * .045, h = .2 + (k % 3) * .06;
    for(let j = 0; j < 4; j++) Mx(AQ_GALET, x + Math.sin(j * 1.6 + k) * .02, y0 + .07 + j * h / 4, -.08, 0x5E9A34, 0, 0, Math.sin(j + k) * .4, .014, h / 7, .006); }
  for(let j = 0; j < 7; j++) Mx(AQ_GALET, .04 + (j % 2 ? .03 : -.03), y0 + .08 + j * .02, -.02, 0x7AB84A, 0, 0, 0, .016, .016, .008);
  for(let j = 0; j < 6; j++){ const s = j % 2 ? 1 : -1; Mx(AQ_GALET, .4 + s * .04, y0 + .1 + j * .035, -.1, 0x6EAA3A, 0, 0, s * .8, .022, .05, .008); }
  return fusionner(out);
})();
/* Le grand aquarium (image de Yo, 11 novembre 2026 : « Voici le grand aquarium ») : un long meuble bas de bois à trois portes
   (un panneau, une feuille sculptée, un bouton rond chacune ; un plateau à rebord, des pieds découpés ; sa teinte) ; dessus un
   long bac de verre aux arêtes arrondies, l'eau claire, un lit de galets clairs, la grosse pierre moussue à gauche et ses
   petites pierres, deux pierres à droite, de longues herbes d'eau de chaque côté, une touffe devant, une petite plante à
   feuilles rondes au milieu. Vide quand on le pose ; cinq poissons, choisis un à un (o.poissons) */
const GA = {meuble: .55, bas: .63, haut: 1.12, l: 1.7, p: .5, eau: 1.04};
const GA_CAISSON = boiteRonde(1.76, .46, .54, .04, 2), GA_PLATEAU = boiteRonde(1.84, .07, .6, .03, 2), GA_PIED = boiteRonde(.18, .12, .12, .035, 1);
const GA_PORTE = boiteRonde(.52, .36, .04, .015, 1), GA_PANNEAU = boiteRonde(.42, .27, .03, .012, 1);
const GA_ARETE_X = boiteRonde(GA.l, .028, .028, .013, 1), GA_ARETE_Y = boiteRonde(.028, GA.haut - GA.bas, .028, .013, 1), GA_ARETE_Z = boiteRonde(.028, .028, GA.p, .013, 1);
const GA_VERRE = new THREE.BoxGeometry(GA.l - .01, GA.haut - GA.bas - .01, GA.p - .01), GA_EAU = new THREE.BoxGeometry(GA.l - .04, GA.eau - GA.bas - .02, GA.p - .04);
function grandAquariumMorceaux(c){
  const o = ombreBois(0, GA.haut), out = [], Mx = (geo, x, y, z, cc = c, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => out.push({geo, m: M4(x, y, z, rx, ry, rz, sx, sy, sz), c: cc, ombre: o});
  /* le meuble : le caisson, le plateau, les pieds, les trois portes (le bouton de chacune comme sur l'image) */
  Mx(GA_CAISSON, 0, .32, 0); Mx(GA_PLATEAU, 0, GA.meuble + .035, 0);
  for(const s of [-1, 1]){ Mx(GA_PIED, s * .8, .06, .2); Mx(GA_PIED, s * .8, .06, -.2); }
  for(const [x, b] of [[-.56, -.34], [0, .2], [.56, .35]]){
    Mx(GA_PORTE, x, .32, .27); Mx(GA_PANNEAU, x, .32, .29); Mx(AM_BOUTON, b, .3, .31, c, 0, 0, 0, 1.2, 1.2, 1.2);
    for(const a of [-.7, 0, .7]) Mx(AQ_GALET, x + Math.sin(a) * .04, .37 + Math.cos(a) * .04, .307, c, 0, 0, -a, .016, .042, .008);   // la feuille sculptée
  }
  /* les arêtes du bac */
  const y0 = GA.bas, y1 = GA.haut, hx = GA.l / 2, hz = GA.p / 2;
  for(const y of [y0, y1]) for(const z of [-hz, hz]) Mx(GA_ARETE_X, 0, y, z, 0xE8F2F4);
  for(const y of [y0, y1]) for(const x of [-hx, hx]) Mx(GA_ARETE_Z, x, y, 0, 0xE8F2F4);
  for(const x of [-hx, hx]) for(const z of [-hz, hz]) Mx(GA_ARETE_Y, x, (y0 + y1) / 2, z, 0xE8F2F4);
  return out;
}
const GA_DECOR = (() => {                                            // les galets, les pierres, les plantes du grand aquarium (éclairés)
  const out = [], y0 = GA.bas, Mx = (geo, x, y, z, cc, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => out.push({geo, m: M4(x, y, z, rx, ry, rz, sx, sy, sz), c: cc});
  out.push({geo: new THREE.BoxGeometry(GA.l - .03, .03, GA.p - .03), m: M4(0, y0 + .02, 0), c: 0xE2CDA0});   // le lit de sable clair
  for(let k = 0; k < 90; k++){ const x = ((k * 37) % 100) / 100 * (GA.l - .1) - (GA.l - .1) / 2, z = ((k * 61) % 100) / 100 * (GA.p - .1) - (GA.p - .1) / 2, s = .02 + (k % 3) * .005;
    Mx(AQ_GALET, x, y0 + .03 + (k % 3) * .006, z, [0xE8D2A8, 0xD8B888, 0xF0E0C0][k % 3], 0, k, 0, s, s * .7, s); }
  /* la grosse pierre moussue, ses petites pierres ; deux pierres à droite */
  Mx(AQ_GALET, -.42, y0 + .1, -.06, 0x7E7872, 0, .3, .1, .2, .14, .13);
  for(const [x, z, s] of [[-.47, .02, .05], [-.36, -.02, .045], [-.4, -.1, .05]]) Mx(AQ_GALET, x, y0 + .2 + s * .3, z, 0x7C9A3C, 0, x * 7, 0, s, s * .35, s);   // la mousse
  for(const [x, z, s] of [[-.22, .04, .09], [-.6, .1, .06], [-.3, .15, .045], [-.12, .12, .035], [.3, .02, .08], [.44, .06, .06]]) Mx(AQ_GALET, x, y0 + .04 + s * .3, z, 0x86807A, 0, x * 9, 0, s * 1.2, s * .8, s);
  /* les longues herbes d'eau, à gauche et à droite */
  const herbe = (x, z, h, k) => { for(let j = 0; j < 8; j++) Mx(AQ_GALET, x + Math.sin(j * .9 + k) * .022, y0 + .05 + j * h / 8, z, k % 2 ? 0x5E9A34 : 0x6EAE3E, 0, 0, Math.cos(j * .9 + k) * .35, .02, h / 9, .006); };   // un ruban qui ondule
  for(let k = 0; k < 6; k++) herbe(-.74 + k * .045, -.14 + (k % 2) * .05, .26 + (k % 3) * .06, k);
  for(let k = 0; k < 7; k++) herbe(.5 + k * .045, -.15 + (k % 2) * .05, .28 + (k % 3) * .07, k + 3);
  /* la touffe devant la grosse pierre, la petite plante à feuilles rondes au milieu */
  for(let j = 0; j < 7; j++){ const a = (j - 3) * .35; Mx(AQ_GALET, -.24 + Math.sin(a) * .04, y0 + .08 + Math.cos(a) * .02, .12, 0x72B444, 0, 0, -a, .018, .06, .007); }
  Mx(AQ_GALET, .06, y0 + .15, -.04, 0x5E9A34, 0, 0, 0, .008, .13, .008);
  for(let j = 0; j < 6; j++){ const s = j % 2 ? 1 : -1, y = y0 + .1 + j * .04, l = .07 - j * .007;
    Mx(AQ_GALET, .06 + s * l / 2, y - .01, -.04, 0x5E9A34, 0, 0, -s * 1.1, .005, l / 2, .005);   // la petite branche
    Mx(AQ_GALET, .06 + s * l, y + .015, -.04, 0x86C452, 0, 0, s * .4, .028, .022, .008); }      // sa feuille ronde
  Mx(AQ_GALET, .06, y0 + .29, -.04, 0x86C452, 0, 0, 0, .022, .026, .008);
  return fusionner(out);
})();
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
  brasero(g, m, o){                                                                  // la vasque, ses pieds ; vide, ou son charbon qui brûle (un à trois)
    const n = garniPose("brasero", o);
    g.add(modeleBois("brasero" + n, m, braseroMorceaux(n)));
    if(n){ const f = new THREE.Mesh(FC_FLAMMES, fireMat); f.position.y = BR.bord - .06; f.scale.setScalar([0, .6, .7, .8][n]); f.castShadow = false; g.add(f); }
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
  aquarium(g, m, o){                                                                 // le bocal, l'eau, et le poisson qu'on y a mis
    g.add(modeleBois("aquarium", m, aquariumMorceaux), new THREE.Mesh(AQ_DECOR, MAT_AQUA));   // le socle ; les galets et la plante, éclairés
    const e = new THREE.Mesh(AQ_EAU, matEau); e.renderOrder = 1; e.castShadow = false; g.add(e);
    const v = new THREE.Mesh(AQ_VERRE, matBocal); v.renderOrder = 2; v.castShadow = false; g.add(v);
    const p = o && o.poisson ? poissonAquarium(o.poisson, o.robe) : null;
    if(p) g.add(p);
  },
  aquariumMoyen(g, m, o){                                                            // le meuble, le bac, l'eau, et ses poissons
    g.add(modeleBois("aquariumMoyen", m, aquariumMoyenMorceaux), new THREE.Mesh(AM_DECOR, MAT_AQUA));   // le meuble ; le fond du bac, éclairé
    const e = new THREE.Mesh(AM_EAU, matEau); e.position.y = (AM.bas + AM.eau) / 2; e.renderOrder = 1; e.castShadow = false; g.add(e);
    const v = new THREE.Mesh(AM_VERRE, matBocal); v.position.y = (AM.bas + AM.haut) / 2; v.renderOrder = 2; v.castShadow = false; g.add(v);
    (o && o.poissons || []).slice(0, 3).forEach((cle, j) => {
      const [k, robe] = cle.split("|"), p = poissonAquarium(k, robe, .2);
      if(p){ p.userData.bac = {l: .38, y: AM.bas + .14 + j * .08, z: (j - 1) * .1, vite: .35 + j * .07}; p.position.set((j - 1) * .3, p.userData.bac.y, (j - 1) * .1); g.add(p); }
    });
  },
  grandAquarium(g, m, o){                                                            // le meuble, le long bac, l'eau, et ses cinq poissons
    g.add(modeleBois("grandAquarium", m, grandAquariumMorceaux), new THREE.Mesh(GA_DECOR, MAT_AQUA));   // le meuble ; le fond du bac, éclairé
    const e = new THREE.Mesh(GA_EAU, matEau); e.position.y = (GA.bas + GA.eau) / 2; e.renderOrder = 1; e.castShadow = false; g.add(e);
    const v = new THREE.Mesh(GA_VERRE, matBocal); v.position.y = (GA.bas + GA.haut) / 2; v.renderOrder = 2; v.castShadow = false; g.add(v);
    (o && o.poissons || []).slice(0, 5).forEach((cle, j) => {
      const [k, robe] = cle.split("|"), p = poissonAquarium(k, robe, .2);
      if(p){ p.userData.bac = {l: .62, y: GA.bas + .16 + (j % 3) * .08 + (j > 2 ? .04 : 0), z: (j - 2) * .07, vite: .28 + j * .05}; p.position.set((j - 2) * .25, p.userData.bac.y, (j - 2) * .07); g.add(p); }
    });
  },
  cloture(g, m, o){                                                                  // ses bras selon ses voisines (ile.js)
    const v = (o && o.voisins) || "", bras = brasDe(o);
    g.add(modeleBois("cloture:" + bras + ":" + v, m, clotureMorceaux(bras, v)));
  },
  panneau(g, m, o){                                                                  // le poteau, les planches ; le mot peint, devant
    g.add(modeleBois("panneau", m, panneauMorceaux));
    if(o && o.texte){ const mat = motPeint(o.texte);
      const t = new THREE.Mesh(PA_TEXTE, mat); t.position.set(0, PA.cy, PA.ep / 2 + .004); t.castShadow = false; t.renderOrder = 1; g.add(t); }
    g.rotation.y = ((o && o.rot) || 0) * Math.PI / 2;
  },
  fontaine(g, m, o){                                                                 // la pierre ; l'eau des bassins, les filets, l'écume
    g.add(modeleBois("fontaine", m, fontaineMorceaux));
    const eau = new THREE.Mesh(FO_BASSINS, matBassin), filets = new THREE.Mesh(FO_FILETS, matFilet), ecume = new THREE.Mesh(FO_ECUME, matEcume);
    eau.renderOrder = 1; filets.renderOrder = 2;
    for(const e of [eau, filets, ecume]){ e.castShadow = false; e.receiveShadow = false; g.add(e); }
    ecume.onBeforeRender = () => { const t = VENT.temps.value; ecume.position.y = .006 * Math.sin(t * 9); ecume.rotation.y = .04 * Math.sin(t * 5); ecume.updateMatrixWorld(true); };   // elle bouillonne
  },
  puitsEau(g, m, o){                                                                 // la margelle, le toit ; le treuil, la corde et le seau
    g.add(modeleBois("puitsEau", m, puitsMorceaux));
    const treuil = modeleBois("puitsTreuil", m, treuilMorceaux); treuil.position.y = PU.axe; g.add(treuil);
    const seau = modeleBois("puitsSeau", m, seauMorceaux), corde = new THREE.Mesh(PU_CORDE, new THREE.MeshLambertMaterial({color: PU.corde}));
    corde.position.y = PU.axe - .055; corde.scale.set(.016, 1, .016); g.add(seau, corde);
    const depuis = (o && o.tire) || 0, haut = .8;                                     // le haut de l'anse, au repos
    const place = () => { const t = Math.min(1, Math.max(0, (Date.now() - depuis) / PU.temps)), bas = .3 * Math.sin(Math.PI * t);
      treuil.rotation.x = t * Math.PI * 4; seau.position.y = haut - bas; corde.scale.y = PU.axe - .055 - seau.position.y; treuil.updateMatrixWorld(true); seau.updateMatrixWorld(true); corde.updateMatrixWorld(true); };
    place();
    if(Date.now() - depuis < PU.temps) seau.onBeforeRender = place;                  // la manivelle tourne, le seau descend et remonte
  },
  portail(g, m, o){                                                                  // les piliers ; les deux battants sur leurs gonds
    g.add(modeleBois("portailPiliers", m, piliersMorceaux));
    const ouvert = !!(o && o.ouvert), depuis = (o && o.bouge) || 0;
    for(const s of [-1, 1]){
      const pivot = new THREE.Group(), b = modeleBois("portail:" + s, m, battantMorceaux(s));
      pivot.position.x = s * PL.gond; pivot.add(b); g.add(pivot);
      const angle = () => { const t = Math.min(1, Math.max(0, (Date.now() - depuis) / PL.temps)), k = lissePt(ouvert ? t : 1 - t); return -s * PL.ouvre * k; };
      pivot.rotation.y = angle();
      if(Date.now() - depuis < PL.temps) b.onBeforeRender = () => { pivot.rotation.y = angle(); pivot.updateMatrixWorld(true); };   // ils pivotent doucement
    }
    g.rotation.y = sensPortail(o) * Math.PI / 2;
  },
  muret(g, m, o){                                                                    // ses bras selon ses voisins (ile.js), comme la clôture
    const v = (o && o.voisins) || "", bras = brasDe(o);
    g.add(modeleBois("muret:" + bras + ":" + v, m, muretMorceaux(bras, v)));
  },
  trophee(g, m, o){                                                                  // l'écusson ; le buste du gibier sculpté (statues.js)
    g.add(modeleBois("trophee", m, tropheeMorceaux));
    const b = o && o.bete ? busteEnBois(o.bete) : null;
    if(b){ const me = new THREE.Mesh(b, MAT_UNI); me.castShadow = me.receiveShadow = true; g.add(me); }
  },
  herbier(g, m, o){ const l = (o && o.fleurs) || []; g.add(modeleBois("herbier" + l.join(","), m, herbierMorceaux(l))); },   // ses fleurs séchées (une forme par herbier)
  bouquet(g){ g.add(modeleBois("bouquet", 0, bouquetMorceaux)); },   // couché, ses couleurs à lui
  miroir(g, m){ g.add(modeleBois("miroir", m, miroirMorceaux), glaceMiroir()); },   // le cadre et le pied (un dessin), la glace peinte
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
  torchereMurale:[.7, 1, .6, 1.35], lanterneMurale:[.7, 1, .6, 1.3], brasero:[.8, .9, .8, .45], lampadaire:[.6, 2.5, .6, 1.2], feuCamp:[1, .7, 1, .3]};
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
