/* ================= La poule, le coq et le poussin =================
   D'après les images de Yo (20 novembre 2026 : « Voici la poule, le coq et le poussin »), comme des vrais (règle de Yo) :
   - la poule : ronde et dodue, rousse, le plastron plus clair en écailles de plumes, les ailes serrées, la petite queue en éventail
     relevée, la crête rouge à trois lobes, les barbillons rouges (plus petits que ceux du coq, comme une vraie poule), le bec jaune,
     les grands yeux bruns, les pattes jaunes à quatre doigts (trois devant, un derrière) et leurs ongles clairs ;
   - le coq : plus grand, plus droit, le corps rouge-roux, le camail doré (les plumes du cou), la grande crête dentelée, les grands
     barbillons, la longue queue vert sombre en faucilles recourbées, les pattes plus longues ;
   - le poussin : une boule de duvet jaune pâle, la tête ronde et sa petite houppe, les grands yeux, le petit bec orange, les
     moignons d'ailes, les pattes orange.
   Quatre morceaux par bête (le corps, la tête, deux pattes), chacun d'un seul dessin (fusionner, MAT_UNI), pour les gestes
   (elevage.js) : marcher, picorer, gratter le sol, tourner la tête. Le devant regarde +z ; le sol en y = 0.
   Les formes sont faites une fois par sorte, puis partagées entre toutes les bêtes. */
import { fusionner, MAT_UNI } from "./formes.js";

const BOULE = new THREE.SphereGeometry(1, 10, 7), PETITE = new THREE.SphereGeometry(1, 6, 4), CONE = new THREE.ConeGeometry(1, 1, 8),
  TIGE = new THREE.CylinderGeometry(1, 1, 1, 6), DOIGT = new THREE.CylinderGeometry(.7, 1, 1, 5), FAUX = new THREE.TorusGeometry(1, .1, 4, 10, 2.1);
const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
const doux = (y0, h) => (x, y) => .8 + .32 * Math.max(0, Math.min(1, (y - y0) / h));        // l'ombre douce peinte : plus clair en haut

/* Les sortes : leurs couleurs et leurs mesures (en P ; la poule fait environ 0,42 P de haut) */
const SORTES = {
  poule:   {dessous: 0x9A4418, plumes: [0xBC5A20, 0xC4642A, 0xB2521C], plastron: [0xD27434, 0xCB6C2E, 0xD87C3A], aile: [0xA84C1C, 0xB4561E, 0xC0602A, 0x9E4818, 0xAC5220],
            queue: [0xA84E1C, 0x9A4618, 0xB4581E], crete: 0xD8302A, bec: 0xF2B436, bec2: 0xE0A02C, patte: 0xF2B03A, patte2: 0xE09A2E, ongle: 0xF2E2C6,
            hanche: .15, r: [.17, .17, .2], cou: [0, .27, .03]},
  coq:     {dessous: 0x82261A, plumes: [0xA8341A, 0xB43C1C, 0x9E301A], plastron: [0xC4461E, 0xD0521F, 0xB83E1C], camail: [0xF2AC34, 0xF6BE48, 0xE89A2A],
            aile: [0xA8341A, 0xD86A26, 0xC85A22, 0xA8341A, 0xB83E1C], queue: [0x1E5A42, 0x2E7452, 0x174A36, 0x3A8460], crete: 0xD8302A, bec: 0xF2B436, bec2: 0xE0A02C,
            patte: 0xF2B03A, patte2: 0xE09A2E, ongle: 0xF2E2C6, hanche: .22, r: [.16, .19, .17], cou: [0, .37, .03]},
  poussin: {corps: 0xF6D45A, clair: 0xFBE48A, sombre: 0xE8C048, bec: 0xF39A2E, patte: 0xF39A2E, ongle: 0xF6C070, hanche: .035, r: [.088, .085, .088],
            tete: .062, cou: [0, .11, .025], houppe: true}
};
export const sorteDe = (esp, sexe, petit) => petit ? "poussin" : sexe === "m" ? "coq" : "poule";
export const HANCHE = k => SORTES[k].hanche;
export const COU = k => SORTES[k].cou;

/* les yeux : le blanc, l'iris brun, la pupille, le reflet, regardant de côté et un peu devant */
function yeux(out, s, x, y, z, r){
  for(const sx of [1, -1]){
    const a = sx * .72, nx = Math.sin(a), nz = Math.cos(a);
    out.push({geo: PETITE, m: M(sx * x, y, z, 0, a, 0, r, r, r * .55), c: 0xFBF6EC, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .42, y, z + nz * r * .42, 0, a, 0, r * .72, r * .72, r * .3), c: 0x6A3A1A, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .55, y, z + nz * r * .55, 0, a, 0, r * .42, r * .42, r * .25), c: 0x1A1210, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .66 - sx * r * .12, y + r * .25, z + nz * r * .66, 0, a, 0, r * .16, r * .16, r * .1), c: 0xFFFFFF, ombre: () => 1});
  }
}
/* le corps (son origine à la hanche) */
function corps(k){
  const s = SORTES[k], out = [], [rx, ry, rz] = s.r, cy = ry * .82, om = doux(-ry * .2, ry * 1.8);
  /* le plastron plus clair, peint sur le devant du corps */
  out.push({geo: BOULE, m: M(0, cy, -.01, 0, 0, 0, rx, ry, rz), c: s.corps, ombre: om,
    couleur: (x, y, z) => (z + .01) / rz > .42 && Math.abs(x) / rx < .82 && (y - cy) / ry < .55 ? s.clair : s.corps});
  for(const sx of [1, -1]){                                                                         // les ailes, serrées
    out.push({geo: BOULE, m: M(sx * rx * .88, cy + ry * .04, -rz * .24, -.15, sx * .12, 0, rx * .28, ry * .6, rz * .62), c: s.sombre, ombre: om});
    if(k !== "poussin") for(let f = 0; f < 3; f++) out.push({geo: PETITE, m: M(sx * rx * .96, cy - ry * .28 + f * ry * .07, -rz * .5 - f * rz * .12, -.6, 0, 0, rx * .14, ry * .12, rz * .3), c: s.queue, ombre: om});
  }
  if(k === "poule") for(let f = 0; f < 5; f++){                                                    // la petite queue en éventail, relevée
    const a = (f - 2) * .32;
    out.push({geo: BOULE, m: M(Math.sin(a) * .04, cy + ry * .55, -rz * .9, -.75, a * .6, a, .03, .11, .055), c: f % 2 ? s.queue : s.sombre, ombre: om});
  }
  if(k === "coq"){
    out.push({geo: BOULE, m: M(0, cy + ry * .62, rz * .38, -.3, 0, 0, rx * .82, ry * .55, rz * .55), c: s.camail, ombre: om});   // le camail doré
    for(let i = -2; i <= 2; i++) out.push({geo: PETITE, m: M(i * rx * .2, cy + ry * .3, rz * .62, -.3, 0, 0, rx * .16, ry * .26, rz * .08), c: s.camail, ombre: om});
    for(let f = 0; f < 6; f++){                                                                     // la longue queue en faucilles
      const a = (f - 2.5) * .12, R = .2 + f * .015;
      out.push({geo: FAUX, m: M(a * .5, cy + ry * .2, -rz * .7, 0, Math.PI / 2 + a, -.2 + f * .1, R, R * 1.15, .45), c: f % 2 ? s.queue : s.queue2, ombre: () => .95});
    }
  }
  if(k === "poussin") out.push({geo: BOULE, m: M(0, cy + ry * .1, -rz * .85, -.5, 0, 0, rx * .4, ry * .3, rz * .25), c: s.clair, ombre: om});   // le petit croupion
  return fusionner(out);
}
/* la tête (son origine au cou) */
function tete(k){
  const s = SORTES[k], out = [], r = s.tete, y = r * 1.05, z = r * .35, om = doux(0, r * 2.2);
  out.push({geo: BOULE, m: M(0, y, z, 0, 0, 0, r, r * 1.02, r), c: k === "coq" ? s.camail : s.corps, ombre: om});
  out.push({geo: BOULE, m: M(0, y - r * .55, z - r * .2, 0, 0, 0, r * .8, r * .7, r * .8), c: k === "coq" ? s.camail : s.corps, ombre: om});   // le cou
  out.push({geo: CONE, m: M(0, y - r * .05, z + r * 1.05, Math.PI / 2, 0, 0, r * .32, r * .62, r * .26), c: s.bec, ombre: () => 1});   // le bec
  out.push({geo: CONE, m: M(0, y - r * .18, z + r * .98, Math.PI / 2 + .5, 0, 0, r * .22, r * .4, r * .16), c: s.bec, ombre: () => .9});
  yeux(out, s, r * .58, y + r * .22, z + r * .6, r * .36);
  if(s.crete3) for(let i = 0; i < 3; i++)                                                          // la crête à trois lobes
    out.push({geo: BOULE, m: M(0, y + r * (.95 + (i === 1 ? .22 : .08)), z + r * (.45 - i * .42), -.2 + i * .25, 0, 0, r * .16, r * .32, r * .26), c: s.crete, ombre: om});
  if(s.crete5) for(let i = 0; i < 5; i++)                                                          // la grande crête dentelée
    out.push({geo: BOULE, m: M(0, y + r * (1.05 + .3 * Math.sin(i / 4 * Math.PI)), z + r * (.75 - i * .42), -.35 + i * .22, 0, 0, r * .17, r * .5, r * .26), c: s.crete, ombre: om});
  if(s.crete){                                                                                     // les barbillons
    const b = k === "coq" ? 1.35 : .85;
    for(const sx of [1, -1]) out.push({geo: BOULE, m: M(sx * r * .14, y - r * (.6 + .2 * b), z + r * .9, .15, 0, 0, r * .17 * b, r * .32 * b, r * .14 * b), c: s.crete, ombre: om});
  }
  if(s.houppe) for(let i = -1; i <= 1; i++)                                                        // la petite houppe du poussin
    out.push({geo: BOULE, m: M(i * r * .14, y + r * 1.05, z - r * .05, -.3, 0, i * .45, r * .14, r * .34, r * .14), c: s.clair, ombre: om});
  return fusionner(out);
}
/* une patte (son origine à la hanche) : le tarse, trois doigts devant, un derrière, leurs ongles */
function patte(k){
  const s = SORTES[k], out = [], h = s.hanche, e = k === "coq" ? .022 : k === "poussin" ? .012 : .019, l = k === "poussin" ? .035 : .06;
  out.push({geo: TIGE, m: M(0, -h / 2, 0, 0, 0, 0, e, h, e), c: s.patte, ombre: () => .95});
  if(k !== "poussin") out.push({geo: BOULE, m: M(0, .01, 0, 0, 0, 0, e * 1.6, e * 1.8, e * 1.6), c: s.sombre, ombre: () => .9});   // la cuisse
  for(const a of [-.45, 0, .45, Math.PI]){
    const L = a === Math.PI ? l * .5 : l, dx = Math.sin(a) * L / 2, dz = Math.cos(a) * L / 2;
    out.push({geo: DOIGT, m: M(dx, -h + e * .5, dz, Math.PI / 2, a, 0, e * .75, L, e * .6), c: s.patte, ombre: () => .95});
    out.push({geo: CONE, m: M(dx * 2.05, -h + e * .45, dz * 2.05, Math.PI / 2, a, 0, e * .5, e * 1.4, e * .4), c: s.ongle, ombre: () => 1});
  }
  return fusionner(out);
}
/* ===== La poule et le coq refaits au plus près des images de Yo (20 novembre 2026 : « Au plus près de l'image. Même si cela dépasse
   le nombre de triangles. Tant pis ») : une seule silhouette en goutte (la tête se fond dans le corps), des plumes en écailles qui
   se recouvrent partout (chacune plus claire au milieu, son bord plus sombre), les grandes ailes de plumes superposées, la queue
   en éventail de la poule, le camail doré et les faucilles vertes du coq, les yeux à reflets et sourcils, le bec crochu, les
   pattes épaisses à écailles. ===== */
const PLUME = (() => {                                              // une plume en écaille : plus claire au milieu, son bord plus sombre
  const g = new THREE.SphereGeometry(1, 7, 5), p = g.attributes.position, t = [];
  for(let i = 0; i < p.count; i++){ const d = Math.min(1, Math.hypot(p.getX(i), p.getY(i))); t.push(1.05 - .17 * d * d + (p.getY(i) > .3 ? .03 : 0)); }
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(t, 1)); return g; })();
const LONGUE = (() => {                                             // une longue plume pointue (le camail, les rémiges) : sa tige plus claire
  const g = new THREE.SphereGeometry(1, 8, 6), p = g.attributes.position, t = [];
  for(let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i); p.setX(i, x * (1 - .55 * Math.max(0, -y))); t.push(1.06 - .32 * Math.abs(x) + (Math.abs(x) < .15 ? .06 : 0)); }
  g.computeVertexNormals(); g.setAttribute("teinte", new THREE.Float32BufferAttribute(t, 1)); return g; })();
const FAUCILLE = (() => {                                           // une faucille du coq, large et plate, plus claire au milieu, plus fine au bout
  const g = new THREE.TorusGeometry(1, .13, 6, 18, 2.5), p = g.attributes.position, t = [];
  for(let i = 0; i < p.count; i++){ const z = p.getZ(i), r = Math.hypot(p.getX(i), p.getY(i)), a = Math.atan2(p.getY(i), p.getX(i));
    p.setXYZ(i, p.getX(i), p.getY(i), z * (1 - .75 * Math.max(0, (a - 1.6) / .9)));
    t.push(1.06 - .9 * Math.abs(r - 1)); }
  g.computeVertexNormals(); g.setAttribute("teinte", new THREE.Float32BufferAttribute(t, 1)); return g; })();
const GOUTTE = (() => {                                             // un barbillon en goutte, rond en bas
  const g = new THREE.SphereGeometry(1, 10, 8), p = g.attributes.position;
  for(let i = 0; i < p.count; i++){ const y = p.getY(i), k = y > 0 ? 1 - .55 * y : 1; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  g.computeVertexNormals(); return g; })();
const ARC_SOURCIL = new THREE.TorusGeometry(1, .16, 4, 10, Math.PI * .7), ANNEAU = new THREE.TorusGeometry(1, .22, 4, 10);
/* la silhouette : un tour (r, y) de bas en haut, allongé d'avant en arrière (zs), décalé (dz) ; rayonSil(y) pour poser les plumes */
const SIL = {
  poule: {pts: [[0, -.055], [.09, -.05], [.14, -.02], [.168, .04], [.172, .1], [.162, .16], [.138, .215], [.112, .26], [.094, .29], [.08, .31], [0, .325]], zs: 1.18, dz: -.012},
  coq:   {pts: [[0, -.08], [.09, -.072], [.138, -.025], [.158, .06], [.162, .14], [.152, .22], [.13, .28], [.106, .33], [.09, .375], [.077, .41], [0, .425]], zs: 1.08, dz: 0}
};
const rayonSil = (k, y) => { const p = SIL[k].pts; for(let i = 1; i < p.length; i++) if(y <= p[i][1]) return p[i - 1][0] + (p[i][0] - p[i - 1][0]) * (y - p[i - 1][1]) / (p[i][1] - p[i - 1][1]); return 0; };
const penteSil = (k, y) => (rayonSil(k, y + .01) - rayonSil(k, y - .01)) / .02;
/* une plume posée sur la silhouette, à l'angle a autour du corps, à la hauteur y ; elle pointe vers le bas et se soulève un peu */
function plumeSur(out, k, a, y, w, h, c, geo = PLUME, lift = .28, dehors = .006){
  const S = SIL[k], r = rayonSil(k, y) + dehors, x = Math.sin(a) * r, z = Math.cos(a) * r * S.zs + S.dz;
  const ry = Math.atan2(Math.sin(a), Math.cos(a) / S.zs);
  out.push({geo, m: M(x, y, z, Math.atan(penteSil(k, y)) - lift, ry, 0, w, h, w * .2), c, ombre: () => 1});
}
const doux2 = (y0, h) => (x, y) => .82 + .28 * Math.max(0, Math.min(1, (y - y0) / h));
function corpsGrand(k){
  const s = SORTES[k], S = SIL[k], out = [], coq = k === "coq", om = doux2(-.06, .36);
  const tour = new THREE.LatheGeometry(S.pts.map(([r, y]) => new THREE.Vector2(r, y)), 22);
  out.push({geo: tour, m: M(0, 0, S.dz, 0, 0, 0, 1, 1, S.zs), c: s.dessous, ombre: om});
  /* les plumes en écailles, rang après rang, du haut vers le bas ; le plastron plus clair devant ; le camail doré du coq en haut */
  const haut = coq ? .38 : .3;
  for(let j = 0, y = haut; y > -.04; j++, y -= coq ? .04 : .042){
    const r = rayonSil(k, y), n = Math.max(6, Math.round(2 * Math.PI * r * (S.zs + 1) / 2 / (coq ? .05 : .056)));
    for(let i = 0; i < n; i++){
      const a = (i + (j % 2) * .5) / n * Math.PI * 2, devant = Math.cos(a), cote = Math.abs(Math.sin(a));
      if(cote > .82 && y > .02 && y < .2) continue;                                          // sous les ailes
      const camail = coq && y > .24, plastron = devant > .45 && y < (coq ? .24 : .22) && y > -.02;
      const c = camail ? s.camail[(i + j) % s.camail.length] : plastron ? s.plastron[(i + j) % s.plastron.length] : s.plumes[(i * 3 + j) % s.plumes.length];
      if(camail) plumeSur(out, k, a, y - .015, .028, .07, c, LONGUE, .14, .01);
      else plumeSur(out, k, a, y, coq ? .042 : .048, coq ? .04 : .045, c);
    }
  }
  /* les ailes : les couvertures en écailles en haut, puis deux rangs de longues plumes qui descendent vers l'arrière */
  for(const sx of [1, -1]){
    const r = rayonSil(k, .11) + .012, x = sx * r * .98;
    out.push({geo: BOULE, m: M(x - sx * .025, .11, -.03, -.1, 0, 0, .04, .085, .12), c: s.aile[1], ombre: om});
    for(let i = 0; i < 5; i++) for(let row = 0; row < 3; row++)
      out.push({geo: PLUME, m: M(x + sx * (.006 + row * .004), .175 - row * .036, .06 - i * .04 - row * .02, 0, sx * Math.PI / 2, -sx * .25, .036, .036, .008), c: s.aile[1 + (i + row) % 2], ombre: () => 1});
    for(let row = 0; row < 2; row++) for(let i = 0; i < 5; i++){
      const z = .02 - i * .04 - row * .02, y = .08 - row * .03 - i * .003;
      out.push({geo: LONGUE, m: M(x + sx * (.014 + row * .006), y, z, 0, sx * Math.PI / 2, -sx * (.35 + i * .07), .032, .058, .008), c: s.aile[3 + (i + row) % 2], ombre: () => 1});
    }
  }
  if(!coq){                                                         // la queue de la poule : un éventail de grandes plumes rondes, dressé
    for(const sx of [-1, 1]) for(let f = 0; f < 5; f++){ const a = -.15 - f * .28;            // deux éventails serrés, côte à côte
      out.push({geo: PLUME, m: M(sx * .018, .17 + Math.cos(a) * .06, -.17 * S.zs + Math.sin(a) * .06, a, Math.PI / 2, 0, .06, .13, .018), c: s.queue[(f + (sx > 0 ? 1 : 0)) % 3], ombre: () => 1}); }
  } else {                                                          // la queue du coq : les grandes faucilles vertes qui montent en arc et retombent
    const by = .22, bz = -.15;
    for(let f = 0; f < 14; f++){
      const t = f / 13, R = .2 + .16 * Math.sin(t * Math.PI) + (f % 3) * .018, sp = (t - .5) * .6;
      out.push({geo: FAUCILLE, m: M(sp * .12, by - .02 + t * .03, bz - R, 0, Math.PI / 2 + sp * .5, .55 + t * .45, R, R * 1.12, .42 + (f % 2) * .1),
        c: s.queue[f % s.queue.length], ombre: () => 1});
    }
    for(let f = 0; f < 6; f++){ const a = (f - 2.5) * .25;                                 // les petites couvertures de la queue, vertes
      out.push({geo: LONGUE, m: M(Math.sin(a) * .05, .2, -.15, -1.0, 0, a, .04, .11, .01), c: s.queue[(f + 1) % s.queue.length], ombre: () => 1}); }
  }
  return fusionner(out);
}
function teteGrande(k){
  const s = SORTES[k], out = [], coq = k === "coq", r = coq ? .088 : .1, y = r * .62, z = coq ? .04 : .03, om = doux2(-.02, r * 2);
  const peau = coq ? s.camail[0] : s.plumes[0];
  out.push({geo: BOULE, m: M(0, y, z, 0, 0, 0, r, r * 1.04, r * 1.02), c: peau, ombre: om});
  out.push({geo: BOULE, m: M(0, y - r * .7, z - r * .25, 0, 0, 0, r * .92, r * .7, r * .95), c: peau, ombre: om});   // le cou, qui se fond dans le corps
  for(let i = 0; i < 10; i++){ const a = (i / 10) * Math.PI * 2;                                     // de petites plumes autour du cou
    out.push({geo: PLUME, m: M(Math.sin(a) * r * .88, y - r * .55, z + Math.cos(a) * r * .88, -.2, a, 0, r * .3, r * .3, r * .06), c: coq ? s.camail[i % 2] : s.plumes[i % 2], ombre: () => 1}); }
  /* le bec court et crochu : la mandibule du haut, celle du bas */
  out.push({geo: CONE, m: M(0, y - r * .02, z + r * 1.08, Math.PI / 2 + .25, 0, 0, r * .33, r * .55, r * .3), c: s.bec, ombre: () => 1.02});
  out.push({geo: CONE, m: M(0, y - r * .2, z + r * .98, Math.PI / 2 + .55, 0, 0, r * .24, r * .38, r * .2), c: s.bec2, ombre: () => .95});
  /* les yeux : le blanc, l'iris brun et son cercle sombre, la pupille, deux reflets ; la paupière ; le sourcil */
  for(const sx of [1, -1]){
    const a = sx * (coq ? .68 : .62), nx = Math.sin(a), nz = Math.cos(a), er = r * (coq ? .3 : .34), ex = sx * r * .6, ey = y + r * .18, ez = z + r * .66;
    const at = d => [ex + nx * d, ey, ez + nz * d];
    out.push({geo: PETITE, m: M(ex, ey, ez, 0, a, 0, er, er * 1.05, er * .55), c: 0xFBF6EC, ombre: () => 1});
    out.push({geo: PETITE, m: M(...at(er * .42), 0, a, 0, er * .8, er * .82, er * .25), c: 0x3A2010, ombre: () => 1});
    out.push({geo: PETITE, m: M(...at(er * .48), 0, a, 0, er * .66, er * .68, er * .22), c: 0x8A4E22, ombre: () => 1});
    out.push({geo: PETITE, m: M(...at(er * .56), 0, a, 0, er * .36, er * .38, er * .18), c: 0x140C08, ombre: () => 1});
    const [hx, , hz] = at(er * .62);
    out.push({geo: PETITE, m: M(hx - sx * er * .16, ey + er * .2, hz, 0, a, 0, er * .16, er * .16, er * .08), c: 0xFFFFFF, ombre: () => 1});
    out.push({geo: PETITE, m: M(hx + sx * er * .12, ey - er * .22, hz, 0, a, 0, er * .07, er * .07, er * .05), c: 0xFFFFFF, ombre: () => 1});
    out.push({geo: PETITE, m: M(ex - nx * er * .05, ey + er * .55, ez - nz * er * .05, -.25, a, coq ? -sx * .3 : 0, er * 1.08, er * .55, er * .62), c: coq ? 0xD86A2A : peau, ombre: om});   // la paupière (le coq : plus basse vers le bec, l'air fier)
    const [bx, , bz] = at(er * .25);
  }
  /* la crête : trois gros lobes ronds (la poule), six pointes rondes en arc (le coq) */
  const nb = coq ? 6 : 3;
  for(let i = 0; i < nb; i++){
    const t = i / (nb - 1), hh = coq ? .55 + .5 * Math.sin(t * Math.PI) : (i === 1 ? .85 : .65);
    out.push({geo: BOULE, m: M(0, y + r * (.82 + hh * .6), z + r * (coq ? .62 - t * 1.25 : .4 - i * .5), (t - .5) * (coq ? .9 : .7), 0, 0, r * (coq ? .25 : .26), r * hh * (coq ? .6 : .72), r * (coq ? .26 : .34)), c: s.crete, ombre: om});
  }
  out.push({geo: BOULE, m: M(0, y + r * .85, z + r * (coq ? 0 : -.05), 0, 0, 0, r * .18, r * .2, r * (coq ? .75 : .6)), c: s.crete, ombre: om});   // le pied de la crête
  /* les barbillons, en gouttes ; le coq a aussi la face rouge autour de l'œil, comme un vrai */
  const b = coq ? 1.25 : 1;
  for(const sx of [1, -1]) out.push({geo: GOUTTE, m: M(sx * r * .17, y - r * (.62 + .25 * b), z + r * .84, .25, 0, sx * .12, r * .2 * b, r * .36 * b, r * .16 * b), c: s.crete, ombre: om});
  return fusionner(out);
}
function patteGrande(k){
  const s = SORTES[k], out = [], h = s.hanche, e = k === "coq" ? .028 : .025, l = k === "coq" ? .085 : .075;
  out.push({geo: TIGE, m: M(0, -h / 2, 0, 0, 0, 0, e, h, e), c: s.patte, ombre: () => .96});
  for(let i = 1; i < 4; i++) out.push({geo: ANNEAU, m: M(0, -h * (.25 + i * .17), 0, Math.PI / 2, 0, 0, e * .98, e * .98, e * .35), c: s.patte2, ombre: () => 1});   // ses écailles
  out.push({geo: BOULE, m: M(0, .012, 0, 0, 0, 0, e * 1.9, e * 2.2, e * 1.9), c: s.dessous, ombre: () => .9});   // la cuisse
  for(const a of [-.5, 0, .5, Math.PI]){
    const L = a === Math.PI ? l * .45 : l, dx = Math.sin(a) * L / 2, dz = Math.cos(a) * L / 2;
    out.push({geo: DOIGT, m: M(dx, -h + e * .55, dz, Math.PI / 2, a, 0, e * .85, L, e * .7), c: s.patte, ombre: () => .96});
    for(const f of [.35, .7]) out.push({geo: ANNEAU, m: M(dx * 2 * f, -h + e * .55, dz * 2 * f, 0, a, 0, e * .65, e * .55, e * .5), c: s.patte2, ombre: () => 1});
    out.push({geo: CONE, m: M(dx * 2.1, -h + e * .5, dz * 2.1, Math.PI / 2, a, 0, e * .62, e * 1.6, e * .5), c: s.ongle, ombre: () => 1});
  }
  return fusionner(out);
}
const FORMES = {};
const formes = k => FORMES[k] || (FORMES[k] = k === "poussin" ? {corps: corps(k), tete: tete(k), patte: patte(k)} : {corps: corpsGrand(k), tete: teteGrande(k), patte: patteGrande(k)});
/* Une bête : {g, corps, tete, pattes} ; g.userData.sorte */
export function modeleAnimal(k){
  const f = formes(k), s = SORTES[k], g = new THREE.Group();
  const c = new THREE.Mesh(f.corps, MAT_UNI); c.position.y = s.hanche; g.add(c);
  const t = new THREE.Mesh(f.tete, MAT_UNI); t.position.set(...s.cou); c.add(t);
  const pattes = [1, -1].map(sx => { const p = new THREE.Mesh(f.patte, MAT_UNI); p.position.set(sx * s.r[0] * .35, s.hanche, 0); g.add(p); return p; });
  for(const m of [c, t, ...pattes]){ m.castShadow = k !== "poussin"; m.receiveShadow = false; }
  g.userData.sorte = k;
  return {g, corps: c, tete: t, pattes};
}
/* Pour préparer au chargement (main.js) : une bête de chaque sorte */
export function echantillonsFerme(){
  const g = new THREE.Group();
  for(const k of Object.keys(SORTES)) g.add(modeleAnimal(k).g);
  return g;
}
/* Pour la vérification et les mesures : triangles et dessins d'une sorte */
export function poidsAnimal(k){
  const f = formes(k), t = geo => geo.index.count / 3;
  return {triangles: t(f.corps) + t(f.tete) + 2 * t(f.patte), dessins: 4};
}
