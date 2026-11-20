/* ================= La vache, le taureau et le veau =================
   D'après les images de Yo (20 novembre 2026 : « Étable, vache, taureau, veau » ; « Retire la cloche autour de la vache »),
   comme des vrais (règle de Yo) :
   - la vache : ronde et douce, la robe crème à grandes taches brunes en nuages, la tête aux joues brunes et au chanfrein crème,
     le grand mufle rose et ses naseaux, les grands yeux bruns, les sourcils bruns, les oreilles brunes au-dedans rose, les
     petites cornes crème, la houppe crème entre les cornes, la queue et son toupet brun, les sabots fendus brun sombre ; sans
     cloche ni collier (Yo) ; la mamelle rose sous le ventre, comme une vraie vache (l'image, de face, ne la montre pas) ;
   - le taureau : plus grand et massif, le poitrail large aux poils en écailles, les épaules rondes, la houppe brune frisée, les
     grandes cornes qui partent de côté puis remontent, les sourcils froncés, l'anneau doré au mufle ;
   - le veau : tout rond sur de longues pattes fines, la grosse tête, les grandes oreilles, pas encore de cornes, la houppe crème.
   Sept morceaux par bête (le corps, la tête, la queue, quatre pattes), chacun d'un seul dessin, pour les gestes (elevage.js) :
   marcher (les pattes en diagonale), brouter (la tête baissée), ruminer couchée, remuer la queue, tourner la tête.
   Le devant regarde +z ; le sol en y = 0. Les formes sont faites une fois par sorte, puis partagées. */
import { fusionner, MAT_UNI } from "./formes.js";

const BOULE = new THREE.SphereGeometry(1, 24, 16), TETE = new THREE.SphereGeometry(1, 20, 14), PETITE = new THREE.SphereGeometry(1, 8, 6),
  MINI = new THREE.SphereGeometry(1, 6, 4), MOY = new THREE.SphereGeometry(1, 12, 8), CONE = new THREE.ConeGeometry(1, 1, 10), TIGE = new THREE.CylinderGeometry(1, 1, 1, 12),
  JAMBE = new THREE.CylinderGeometry(1, .72, 1, 12, 3), ANNEAU = new THREE.TorusGeometry(1, .22, 6, 16);
const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
const doux = (y0, h) => (x, y) => .88 + .2 * Math.max(0, Math.min(1, (y - y0) / h));        // l'ombre douce peinte : plus clair en haut
const plein = () => 1;

/* Les sortes : couleurs et mesures (P). jambe : la hauteur de la hanche ; corps : le centre et les rayons du ventre ;
   cou : où la tête s'attache ; e : la taille de la bête (la vache, environ 1,1 P au haut de la tête) */
const SORTES = {
  vache:   {creme: 0xF5E6CC, brun: 0xB8703E, brun2: 0x9E5A30, mufle: 0xF2A48E, narine: 0xA8504A, oreille: 0xEE9C88, corne: 0xF0DCB4, corne2: 0xDDBE8E,
            houppe: 0xFAEEDA, sabot: 0x6C4128, iris: 0x6A3818, e: .86,
            jambe: .34, jr: .12, corps: [0, .22, 0, .42, .38, .62], cou: [0, .42, .5], tete: [0, .12, .18, .31, .3, .27], cornes: "petites", mamelle: true,
            taches: [[75, 25, 30], [115, -8, 26], [155, 18, 26], [-72, 30, 26], [-118, -2, 32], [-158, 28, 22], [30, -28, 15], [-35, -32, 14], [180, 55, 18], [95, 62, 16], [-40, 55, 18]]},
  taureau: {creme: 0xF3E0C2, brun: 0xA9562E, brun2: 0x8E4524, mufle: 0xEFA08A, narine: 0x9C4A40, oreille: 0xE8907C, corne: 0xF0DAB0, corne2: 0xDCBA88,
            houppe: 0x9A4A26, sabot: 0x5E3820, iris: 0x5E3416, anneau: 0xE8B83C, e: .95,
            jambe: .36, jr: .14, corps: [0, .26, -.02, .46, .42, .64], cou: [0, .44, .5], tete: [0, .1, .18, .3, .3, .27], cornes: "grandes", poitrail: true, fronce: true,
            taches: [[62, 30, 30], [105, 0, 30], [150, 22, 28], [-62, 32, 28], [-108, -5, 30], [-152, 25, 24], [130, -30, 18], [-130, -28, 18], [0, 60, 14], [178, 50, 20], [38, 12, 16], [-40, 8, 15]]},
  veau:    {creme: 0xF5E2C6, brun: 0xB65A2E, brun2: 0x9C4A24, mufle: 0xF0A088, narine: 0xA84E48, oreille: 0xEE9682, houppe: 0xF8EAD2, sabot: 0x6C4128, iris: 0x6A3818, e: 1,
            jambe: .36, jr: .074, corps: [0, .16, 0, .25, .25, .38], cou: [0, .3, .32], tete: [0, .12, .12, .23, .23, .21], cornes: null, grandesOreilles: true,
            taches: [[70, 20, 30], [120, 0, 28], [160, 25, 24], [-70, 28, 28], [-125, 5, 30], [-160, 20, 24], [25, -20, 16], [-30, 40, 18], [100, 60, 16]]}
};
export const sorteDe = (esp, sexe, petit) => petit ? "veau" : sexe === "m" ? "taureau" : "vache";
export const HANCHE = k => SORTES[k].jambe;
export const COU = k => SORTES[k].cou;

/* les taches brunes, en nuages : chaque tache, un rond et trois petits ronds autour (au hasard, toujours les mêmes) */
function nuages(s){
  let a = 7;
  const h = () => (a = (a * 16807) % 2147483647) / 2147483647, dir = (az, el) => { const A = az * Math.PI / 180, E = el * Math.PI / 180; return new THREE.Vector3(Math.cos(E) * Math.sin(A), Math.sin(E), Math.cos(E) * Math.cos(A)); };
  const l = [];
  for(const [az, el, r] of s.taches){
    const R = r * .78;
    l.push([dir(az, el), R * Math.PI / 180]);
    for(let k = 0; k < 4; k++){ const t = (k + h() * .6) / 4 * Math.PI * 2; l.push([dir(az + Math.cos(t) * R * .72, el + Math.sin(t) * R * .72), R * (.45 + h() * .15) * Math.PI / 180]); }
  }
  return l;
}
const v0 = new THREE.Vector3();
const tache = (l, cx, cy, cz, rx, ry, rz) => (x, y, z) => { v0.set((x - cx) / rx, (y - cy) / ry, (z - cz) / rz).normalize(); return l.some(([d, r]) => v0.angleTo(d) < r); };

/* une tache nette : les triangles d'une boule fine qui touchent la tache, posés juste sur la robe (des bords nets,
   comme sur l'image ; la couleur par sommet, elle, les aurait floutés) */
const FINE = new THREE.SphereGeometry(1, 72, 44);
function decoupe(garde, bord){
  const p = FINE.attributes.position, I = FINE.index, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), pris = [];
  for(let i = 0; i < I.count; i += 3){
    a.fromBufferAttribute(p, I.getX(i)); b.fromBufferAttribute(p, I.getX(i + 1)); c.fromBufferAttribute(p, I.getX(i + 2));
    if(garde(a.normalize()) || garde(b.normalize()) || garde(c.normalize())) pris.push(I.getX(i), I.getX(i + 1), I.getX(i + 2));   // un sommet dans la tache suffit : les autres glissent jusqu'au bord
  }
  const vus = new Map(), pos = [], nor = [], N = FINE.attributes.normal;
  const idx = pris.map(j => { if(!vus.has(j)){ vus.set(j, vus.size); a.fromBufferAttribute(p, j); if(bord) bord(a); pos.push(a.x, a.y, a.z); nor.push(a.x, a.y, a.z); } return vus.get(j); });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
const dansTache = l => v => l.some(([d, r]) => v.angleTo(d) < r);
/* le bord lissé : un sommet resté hors de la tache glisse jusqu'à son bord (le rond le plus proche), pour un contour rond */
const axe = new THREE.Vector3(), q0 = new THREE.Quaternion();
const auBord = l => v => {
  let best = null, dm = Infinity;
  for(const [d, r] of l){ const e = v.angleTo(d) - r; if(e < dm){ dm = e; best = d; } }
  if(dm > 0){ axe.crossVectors(v, best).normalize(); v.applyQuaternion(q0.setFromAxisAngle(axe, dm)); }
};
function corps(k){
  const s = SORTES[k], out = [], [cx, cy, cz, rx, ry, rz] = s.corps, l = nuages(s), est = tache(l, cx, cy, cz, rx, ry, rz), om = doux(cy - ry, ry * 2);
  const robe = (x, y, z) => s.creme, taches = decoupe(dansTache(l), auBord(l));
  out.push({geo: BOULE, m: M(cx, cy, cz, 0, 0, 0, rx, ry, rz), c: s.creme, ombre: om});
  out.push({geo: taches, m: M(cx, cy, cz, 0, 0, 0, rx * 1.012, ry * 1.012, rz * 1.012), c: s.brun, ombre: om});
  if(s.poitrail){                                                                               // le taureau : les épaules rondes, le poitrail large
    out.push({geo: BOULE, m: M(0, cy + .02, cz + .34, 0, 0, 0, rx * .6, ry * .9, rz * .58), c: s.creme, ombre: om});   // le poitrail crème, les taches restent sur les épaules
    for(let i = 0; i < 26; i++){ const row = Math.floor(i / 5), col = i % 5 - 2 + (row % 2) * .5;     // les poils du poitrail, en écailles
      const x = col * .085, y = cy + .2 - row * .085, z = cz + .3 + rz * .62 * Math.sqrt(Math.max(0, 1 - (x / (rx * .9)) ** 2 - ((y - cy - .04) / (ry * 1.04)) ** 2)) - .01;
      if(Math.abs(x) < .24) out.push({geo: PETITE, m: M(x, y, z, .5, 0, 0, .055, .07, .014), c: 0xF6E4C8, ombre: om}); }
  }
  /* le cou, qui mène à la tête */
  const [nx, ny, nz] = s.cou;
  out.push({geo: BOULE, m: M(nx, ny - .08, nz - .08, -.5, 0, 0, rx * .66, ry * .74, rz * .42), c: s.creme, couleur: robe, ombre: om});
  /* les cuisses et les épaules, sous la robe */
  if(s.mamelle){                                                                                 // la mamelle, rose, et ses quatre trayons
    out.push({geo: PETITE, m: M(0, cy - ry * .82, cz - rz * .42, 0, 0, 0, .13, .1, .14), c: 0xF4B8A6, ombre: plein});
    for(const sx of [1, -1]) for(const sz of [1, -1]) out.push({geo: CONE, m: M(sx * .055, cy - ry * .82 - .1, cz - rz * .42 + sz * .055, Math.PI, 0, 0, .022, .06, .022), c: 0xEFA08E, ombre: plein});
  }
  return fusionner(out);
}
/* les yeux : le blanc, l'iris brun, la pupille, deux reflets ; le sourcil brun au-dessus (froncé chez le taureau) */
function yeux(out, s, hx, hy, hz, rx){
  const r = rx * (s.grandesOreilles ? .3 : .27);
  for(const sx of [1, -1]){
    const a = sx * .42, x = hx + sx * rx * .42, y = hy + rx * .2, z = hz + rx * .78;
    const pres = d => [x + Math.sin(a) * d, y, z + Math.cos(a) * d];
    out.push({geo: PETITE, m: M(x, y, z, 0, a, 0, r * .9, r, r * .5), c: 0xFBF6EC, ombre: plein});
    out.push({geo: PETITE, m: M(...pres(r * .42), 0, a, 0, r * .66, r * .72, r * .2), c: s.iris, ombre: plein});
    out.push({geo: PETITE, m: M(...pres(r * .52), 0, a, 0, r * .4, r * .44, r * .16), c: 0x120A06, ombre: plein});
    const [px, py, pz] = pres(r * .6);
    out.push({geo: MINI, m: M(px - sx * r * .14, py + r * .2, pz, 0, a, 0, r * .16, r * .16, r * .06), c: 0xFFFFFF, ombre: plein});
    out.push({geo: MINI, m: M(px + sx * r * .12, py - r * .22, pz, 0, a, 0, r * .07, r * .07, r * .04), c: 0xFFFFFF, ombre: plein});
    const fr = s.fronce ? .45 : -.12;                                                         // le sourcil : doux, ou froncé vers le mufle
    out.push({geo: PETITE, m: M(x - sx * r * .05, y + r * 1.2, z - r * .1, -.2, a, sx * fr, r * .95, r * .2, r * .3), c: s.brun2, ombre: plein});
  }
}
function tete(k){
  const s = SORTES[k], out = [], [hx, hy, hz, rx, ry, rz] = s.tete, om = doux(hy - ry, ry * 2);
  /* la tête : les joues brunes autour des yeux, le chanfrein crème au milieu, le bas crème */
  out.push({geo: TETE, m: M(hx, hy, hz, 0, 0, 0, rx, ry, rz), c: s.creme, ombre: om});
  out.push({geo: decoupe(v => Math.abs(v.x) > .36 + .12 * Math.max(0, v.y) + .05 * Math.sin(v.y * 9) && v.y > -.4), m: M(hx, hy, hz, 0, 0, 0, rx * 1.012, ry * 1.012, rz * 1.012), c: s.brun, ombre: om});
  out.push({geo: TETE, m: M(hx, hy - ry * .38, hz + rz * .55, 0, 0, 0, rx * .82, ry * .55, rz * .6), c: s.creme, ombre: om});   // les joues, vers le mufle
  /* le grand mufle rose, ses naseaux */
  const mx = hx, my = hy - ry * .45, mz = hz + rz * .92;
  out.push({geo: TETE, m: M(mx, my, mz, 0, 0, 0, rx * .8, ry * .5, rz * .48), c: s.mufle, ombre: doux(my - ry * .5, ry)});
  for(const sx of [1, -1]) out.push({geo: PETITE, m: M(mx + sx * rx * .27, my + ry * .06, mz + rz * .44, .2, sx * .35, 0, rx * .12, ry * .1, rz * .08), c: s.narine, ombre: plein});
  if(s.anneau) out.push({geo: ANNEAU, m: M(mx, my - ry * .2, mz + rz * .5, .25, 0, 0, rx * .26, rx * .26, rx * .3), c: s.anneau, ombre: plein});   // l'anneau doré du taureau
  yeux(out, s, hx, hy, hz, rx);
  /* les oreilles : brunes, rose dedans, un peu tombantes */
  const og = s.grandesOreilles ? 1.35 : 1;
  for(const sx of [1, -1]){
    const ox = hx + sx * rx * 1.08, oy = hy + ry * .3, oz = hz - rz * .1;
    out.push({geo: MOY, m: M(ox, oy, oz, .15, sx * .25, -sx * .32, rx * .58 * og, rx * .2, rx * .36 * og), c: s.brun, ombre: om});
    out.push({geo: MOY, m: M(ox + sx * rx * .03, oy, oz + rx * .07, .15, sx * .25, -sx * .32, rx * .48 * og, rx * .13, rx * .26 * og), c: s.oreille, ombre: plein});
  }
  /* les cornes : petites et relevées (la vache), grandes, de côté puis vers le haut (le taureau) */
  if(s.cornes) for(const sx of [1, -1]){
    const bx = hx + sx * rx * .55, by = hy + ry * .78, bz = hz - rz * .15;
    const morceaux = s.cornes === "grandes" ? [[.09, .075, .18, 1.45], [.075, .062, .12, 1.0], [.062, .046, .1, .45], [.046, .024, .1, -.15]] : [[.07, .055, .1, .8], [.055, .035, .08, .35], [.035, .02, .06, -.05]];
    let x = bx, y = by;
    morceaux.forEach(([r0, r1, L, an], i) => {
      const dx = Math.sin(an) * sx * L, dy = Math.cos(an) * L;
      out.push({geo: new THREE.CylinderGeometry(r1, r0, 1, 12), m: M(x + dx / 2, y + dy / 2, bz, 0, 0, -sx * an, 1, L, 1), c: i === morceaux.length - 1 ? s.corne2 : s.corne, ombre: doux(by, .3)});
      out.push({geo: PETITE, m: M(x + dx, y + dy, bz, 0, 0, 0, r1, r1, r1), c: i === morceaux.length - 1 ? s.corne2 : s.corne, ombre: plein});
      x += dx; y += dy;
    });
  }
  /* la houppe entre les cornes : des mèches qui retombent vers l'avant (frisée et brune chez le taureau) */
  const n = s.cornes === "grandes" ? 11 : 7, frise = s.cornes === "grandes";
  for(let i = 0; i < n; i++){
    const t = (i / (n - 1) - .5), x = hx + t * rx * .8, y = hy + ry * (.9 - Math.abs(t) * .3), z = hz + rz * (.25 + (i % 2) * .12);
    out.push({geo: MOY, m: M(x, y, z, .9 + (i % 3) * .25 - (frise ? .3 : 0), 0, t * 1.2, rx * (frise ? .17 : .2), rx * (frise ? .26 : .42), rx * .13), c: s.houppe, ombre: doux(hy, ry)});
  }
  return fusionner(out);
}
/* une patte : la cuisse, la jambe qui s'affine, la touffe crème au-dessus du sabot, le sabot fendu */
function patte(k){
  const s = SORTES[k], out = [], h = s.jambe, r = s.jr, om = doux(-h, h);
  out.push({geo: JAMBE, m: M(0, -h * .38, 0, 0, 0, 0, r, h * .95, r), c: s.creme, ombre: om});
  out.push({geo: MOY, m: M(0, h * .09, 0, 0, 0, 0, r * 1.02, r * .9, r * 1.02), c: s.creme, ombre: om});   // le haut arrondi, dans le ventre
  for(let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2; out.push({geo: PETITE, m: M(Math.sin(a) * r * .56, -h + r * 1.1, Math.cos(a) * r * .56, 0, a, 0, r * .44, r * .42, r * .36), c: 0xFAF0DE, ombre: plein}); }   // la touffe au-dessus du sabot
  for(const sx of [1, -1]) out.push({geo: PETITE, m: M(sx * r * .36, -h + r * .45, r * .12, 0, 0, 0, r * .52, r * .5, r * .82), c: s.sabot, ombre: doux(-h, r)});
  out.push({geo: TIGE, m: M(0, -h + r * .5, -r * .12, 0, 0, 0, r * .7, r * .8, r * .55), c: s.sabot, ombre: plein});
  return fusionner(out);
}
/* la queue : fine, qui pend, son toupet brun au bout */
function queue(k){
  const s = SORTES[k], out = [], L = s.jambe * 1.3, r = s.jr * .22;
  out.push({geo: TIGE, m: M(0, -L / 2, -.02, .12, 0, 0, r, L, r), c: s.creme, ombre: plein});
  for(let i = 0; i < 5; i++){ const a = i / 5 * Math.PI * 2; out.push({geo: PETITE, m: M(Math.sin(a) * r * 1.4, -L - r * 3, -.08 + Math.cos(a) * r * 1.4, Math.cos(a) * .2, 0, -Math.sin(a) * .2, r * 2.2, r * 5.5, r * 2.2), c: s.brun2, ombre: plein}); }
  return fusionner(out);
}
const FORMES = {};
const formes = k => FORMES[k] || (FORMES[k] = {corps: corps(k), tete: tete(k), patte: patte(k), queue: queue(k)});
/* Une bête : {g, corps, tete, queue, pattes (devant gauche, devant droite, derrière gauche, derrière droite)} */
export function modeleAnimal(k){
  const f = formes(k), s = SORTES[k], g = new THREE.Group(), t = new THREE.Group();
  t.scale.setScalar(s.e); g.add(t);
  const c = new THREE.Mesh(f.corps, MAT_UNI); c.position.y = s.jambe; t.add(c);
  const te = new THREE.Mesh(f.tete, MAT_UNI); te.position.set(...s.cou); c.add(te);
  const [cx, cy, cz, rx, ry, rz] = s.corps;
  const q = new THREE.Mesh(f.queue, MAT_UNI); q.position.set(0, cy + ry * .55, cz - rz * .9); c.add(q);
  const pattes = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => { const p = new THREE.Mesh(f.patte, MAT_UNI); p.position.set(sx * rx * .5, s.jambe, cz + sz * rz * .58); t.add(p); return p; });
  for(const m of [c, te, q, ...pattes]){ m.castShadow = true; m.receiveShadow = false; }
  g.userData.sorte = k;
  return {g, corps: c, tete: te, queue: q, pattes};
}
/* Pour préparer au chargement (main.js) : une bête de chaque sorte */
export function echantillonsEtable(){
  const g = new THREE.Group();
  for(const k of Object.keys(SORTES)) g.add(modeleAnimal(k).g);
  return g;
}
/* Pour la vérification et les mesures : triangles et dessins d'une sorte */
export function poidsAnimal(k){
  const f = formes(k), t = geo => geo.index.count / 3;
  return {triangles: t(f.corps) + t(f.tete) + t(f.queue) + 4 * t(f.patte), dessins: 7};
}
