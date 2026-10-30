/* ================= Le héros =================
   Le personnage du joueur, d'après les images de Yo (30 octobre 2026, images/personnage/ : la fille et le garçon de face et
   de profil, la planche des visages, celle des coiffures) : trois têtes de haut, une grosse tête ronde aux joues roses, de
   grands yeux bruns, la même tunique de lin vert serrée par une ceinture de cuir, des chausses et des bottes souples.
   « Jouet + ombres peintes » : chaque morceau garde sa couleur (couleurs aux sommets), l'ombre douce est peinte dans les
   couleurs (le dessous des mèches, le bas de la tunique), les joues sont peintes sur la tête.
   fabriqueHeros(o) rend {corps, bras: [droit, gauche], jambes: [droite, gauche], main: [droite, gauche]} : corps, le tronc, la
   tête et les cheveux (un seul dessin) ; chaque bras et chaque jambe à part (ils bougent en marchant), leur pivot à l'épaule et
   à la hanche ; main, la place de chaque main au bout de son bras. Le modèle fait 1,12 de haut (personnage.js le ramène à 1 P),
   il regarde vers +z ; le côté droit du personnage est vers -x.
   o : {sexe: "fille" | "garcon"} (les réglages de la personnalisation viendront ensuite) */
import { fusionner, MAT_UNI } from "./formes.js";

export const COULEURS_HEROS = {
  peau: 0xD2A68A, joues: 0xCC7E72, levres: 0x9A5048, nez: 0xCF9A82, oreille: 0xC48A7E, pli: 0xC08C74, encolure: 0xC0957E,
  cheveux: 0x6E442C, sourcils: 0x5E3820, yeux: 0x3A2010,
  tunique: 0x82844A, couture: 0x6A6C38, revers: 0x8C8C52, lacet: 0x5A3420,
  ceinture: 0x573625, boucle: 0xB48F47, chausses: 0x9C744E, bottes: 0x6E452E, revBotte: 0x7A4E34, bordBotte: 0x684128, semelle: 0x4A2E1C
};
const C = COULEURS_HEROS;

/* Des formes de départ, partagées */
const BOULE = new THREE.SphereGeometry(1, 12, 9);
const MOYENNE = new THREE.SphereGeometry(1, 10, 7);
const PETITE = new THREE.SphereGeometry(1, 7, 5);
const cyl = (h, rh, rb, n = 14) => new THREE.CylinderGeometry(rh, rb, h, n);
const arc = (r, e, a) => new THREE.TorusGeometry(r, e, 4, 12, a);

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = (x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));

/* Un hasard qui donne toujours le même tirage (les mèches ne bougent pas d'une partie à l'autre) */
function hasard(graine){
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- La tête ---------- */
/* Une boule aux bonnes joues (les images de Yo) : le front haut et rond, le visage le plus large au niveau des joues, puis
   arrondi jusqu'à un petit menton ; T(lx, ly) : le point de sa surface vu de face (lx, ly entre -1 et 1), et sa normale ;
   c'est là qu'on pose les yeux, le nez, la bouche */
const TETE = {c: V(0, .885, 0), r: V(.172, .155, .165)};
const bomber = (x, y, z) => {
  const j = y < 0 ? Math.sin(Math.pow(Math.min(1, -y), .9) * Math.PI * .8) : 0, devant = Math.min(1, Math.max(0, (z + .2) / .8));
  return [x * (1 + .15 * j * devant), y, z * (1 + .1 * j * (z > 0 ? 1 : 0))];      // les joues, devant ; la nuque reste ronde
};
function surTete(lx, ly){
  const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)), [x, y, z] = bomber(lx, ly, lz);
  const p = V(TETE.c.x + x * TETE.r.x, TETE.c.y + y * TETE.r.y, TETE.c.z + z * TETE.r.z);
  const n = V(lx / TETE.r.x, ly / TETE.r.y, lz / TETE.r.z).normalize();
  return {p, n};
}
const AVANT = V(0, 0, 1);
/* Un morceau posé à plat sur la tête, en (lx, ly), avancé de a le long de la normale, tourné de rz dans son plan */
function surVisage(lx, ly, a, sx, sy, sz, rz = 0){
  const {p, n} = surTete(lx, ly);
  const q = new THREE.Quaternion().setFromUnitVectors(AVANT, n).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)));
  return new THREE.Matrix4().compose(p.addScaledVector(n, a), q, V(sx, sy, sz));
}
/* Un trait qui suit le visage (un sourcil) : passe par les points (lx, ly), avancé de a */
const surFace = (pts, a) => pts.map(([lx, ly]) => { const {p, n} = surTete(lx, ly); return p.addScaledVector(n, a); });
function tete(sexe){
  const g = new THREE.SphereGeometry(1, 32, 24), P = g.attributes.position;
  for(let i = 0; i < P.count; i++){ const [x, y, z] = bomber(P.getX(i), P.getY(i), P.getZ(i)); P.setXYZ(i, x, y, z); }
  g.computeVertexNormals();
  const peau = new THREE.Color(C.peau), rose = new THREE.Color(C.joues), t = new THREE.Color();
  const J = [surTete(-.55, -.45).p, surTete(.55, -.45).p];
  const m = [{geo: g, m: M(TETE.c.x, TETE.c.y, TETE.c.z, TETE.r.x, TETE.r.y, TETE.r.z), c: C.peau,
    normale: (x, y, z, n0) => n0.clone().add(V(0, .7, .4)).normalize(),
    /* les joues roses, peintes, qui s'effacent doucement */
    couleur: (x, y, z) => {
      let k = 0; for(const j of J){ const d = Math.hypot(x - j.x, (y - j.y) * 1.25, z - j.z); k = Math.max(k, 1 - d / .065); }
      k = Math.min(1, Math.max(0, k)); t.copy(peau).lerp(rose, k * k * (3 - 2 * k) * .8);
      return t.getHex();
    }}];
  /* les oreilles, grandes et rondes, un peu décollées : le pavillon, son creux plus rose, le bord qui s'enroule */
  for(const s of [-1, 1]){
    m.push({geo: MOYENNE, m: M(s * .19, .862, -.018, .022, .05, .04, 0, s * .55, s * -.12), c: C.peau});
    m.push({geo: MOYENNE, m: M(s * .202, .858, -.008, .009, .033, .024, 0, s * .55, s * -.12), c: C.oreille});
    m.push({geo: MOYENNE, m: M(s * .192, .838, .008, .012, .012, .01), c: C.peau});                     // le petit rebord devant le creux
  }
  /* le nez, un petit bouton rond, un peu plus rose, qui ne dépasse presque pas (d'en haut, il ne pend pas comme un bec) */
  m.push({geo: MOYENNE, m: surVisage(0, -.38, .004, .026, .021, .014), c: C.nez});
  /* la bouche : un sourire fin aux coins relevés, la lèvre du bas à peine marquée */
  m.push({geo: arc(.042, .0048, 1.55), m: surVisage(0, -.58, .001, 1, .95, .6, -Math.PI / 2 - .775), c: C.levres});
  /* les yeux : le blanc, l'iris brun plus clair en bas, la pupille, deux reflets, l'épais trait de la paupière, le pli de la
     paupière au-dessus ; les sourcils, épais au milieu, effilés vers l'extérieur */
  const brun = new THREE.Color(C.yeux), clair = new THREE.Color(0x7A4A28), ti = new THREE.Color();
  for(const s of [-1, 1]){
    const ex = s * .44, ey = -.2;
    m.push({geo: MOYENNE, m: surVisage(ex, ey, -.005, .04, .046, .016), c: 0xFFFCF6});
    const iris = surVisage(ex - s * .022, ey - .02, .003, .031, .037, .011), yI = new THREE.Vector3().setFromMatrixPosition(iris).y;
    m.push({geo: MOYENNE, m: iris, c: C.yeux, couleur: (x, y) => ti.copy(brun).lerp(clair, Math.min(1, Math.max(0, (yI - y) / .04 + .1))).getHex()});
    m.push({geo: MOYENNE, m: surVisage(ex - s * .022, ey - .02, .008, .018, .022, .008), c: 0x140A04});
    m.push({geo: PETITE, m: surVisage(ex - s * .022 + .08, ey + .1, .013, .013, .013, .004), c: 0xFFFFFF});
    m.push({geo: PETITE, m: surVisage(ex - s * .022 - .06, ey - .15, .012, .006, .006, .003), c: 0xFFFFFF});
    m.push({geo: arc(.043, .0075, 2.1), m: surVisage(ex, ey - .025, .007, 1, 1.05, .5, Math.PI / 2 - 1.05), c: 0x24130A});
    m.push({geo: arc(.05, .0028, 1.5), m: surVisage(ex, ey + .02, .002, 1, 1.05, .4, Math.PI / 2 - .75), c: C.pli});
    if(sexe === "fille") for(const [dx, dy, a] of [[.17, .15, .55], [.2, .07, .25]])               // ses cils, au coin de l'œil
      m.push({geo: MOYENNE, m: surVisage(ex + s * dx, ey + dy, .007, .015, .005, .004, s * a), c: 0x24130A});
    m.push({geo: meche(surFace([[s * .2, .2], [s * .38, .29], [s * .55, .29], [s * .7, .2]], .003), .017, TETE.c, .4, 6, 8), m: new THREE.Matrix4(), c: C.sourcils});
  }
  return m;
}

/* ---------- Les cheveux ---------- */
/* Une mèche : un tube rond qui s'effile en pointe le long d'une courbe, aplati contre la tête (o : le centre de la tête) */
function meche(pts, r, o, plat = .55, k = 8, n = 10){
  const c = new THREE.CatmullRomCurve3(pts), pos = [], tei = [], ind = [];
  const T = V(0, 0, 0), D = V(0, 0, 0), S = V(0, 0, 0), p = V(0, 0, 0), D0 = V(0, 0, 0);
  /* le côté plat regarde dehors, comme à la racine de la mèche (une même direction tout du long : la mèche ne se tord pas) */
  const N0 = V(0, 0, 0).subVectors(pts[0], o).normalize();
  /* l'épaisseur : pleine vers le premier tiers, puis effilée jusqu'à la pointe (une mèche de jouet, ronde et pointue) */
  const ep = u => r * (u < .3 ? .7 + .3 * u / .3 : 1 - .85 * Math.pow((u - .3) / .7, 1.5));
  const debut = c.getPoint(0);
  pos.push(debut.x, debut.y, debut.z); tei.push(.8);
  for(let i = 0; i <= n; i++){
    const u = i / n, e = ep(u);
    c.getPoint(u, p); c.getTangent(u, T);
    D.copy(N0).addScaledVector(T, -T.dot(N0));
    if(D.length() < .3) D.copy(D0); else D.normalize();
    D0.copy(D);
    S.crossVectors(T, D).normalize();
    for(let j = 0; j < k; j++){
      const a = j / k * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(p.x + (S.x * ca + D.x * sa * plat) * e, p.y + (S.y * ca + D.y * sa * plat) * e, p.z + (S.z * ca + D.z * sa * plat) * e);
      /* l'ombre peinte de la mèche : la crête (le dessus) plus claire, les bords et le dessous plus sombres, la racine aussi */
      tei.push((.86 + .16 * Math.max(0, sa) - .1 * Math.abs(ca)) * (.9 + .1 * Math.min(1, u / .3)));
    }
  }
  const fin = c.getPoint(1); c.getTangent(1, T);
  pos.push(fin.x + T.x * r * .12, fin.y + T.y * r * .12, fin.z + T.z * r * .12); tei.push(1);
  const bout = pos.length / 3 - 1;
  for(let j = 0; j < k; j++) ind.push(0, 1 + (j + 1) % k, 1 + j);
  for(let i = 0; i < n; i++) for(let j = 0; j < k; j++){
    const a = 1 + i * k + j, b = 1 + i * k + (j + 1) % k;
    ind.push(a, b, b + k, a, b + k, a + k);
  }
  for(let j = 0; j < k; j++) ind.push(1 + n * k + j, 1 + n * k + (j + 1) % k, bout);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(tei, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
/* Le crâne chevelu : S(θ, φ) un point de la calotte (θ : le tour, 0 devant, vers +x ; φ : la hauteur, 0 à l'équateur), k : plus
   ou moins loin du centre */
const CALOTTE = {c: V(0, .9, -.012), r: V(.176, .162, .17)};
const S = (t, f, k = 1) => V(CALOTTE.c.x + CALOTTE.r.x * Math.cos(f) * Math.sin(t) * k, CALOTTE.c.y + CALOTTE.r.y * Math.sin(f) * k,
  CALOTTE.c.z + CALOTTE.r.z * Math.cos(f) * Math.cos(t) * k);
/* l'ombre peinte des cheveux : le dessous plus sombre, le dessus plus clair */
const ombreCheveux = (x, y, z) => .8 + .28 * Math.min(1, Math.max(0, (y - .74) / .32));
/* les cheveux s'éclairent surtout comme une seule boule (le feuillage des arbres fait pareil) : des aplats doux ; chaque mèche
   garde un peu de son relief */
const nB = V(0, 0, 0);
const enBoule = (x, y, z, n0) => nB.set(x - CALOTTE.c.x, (y - CALOTTE.c.y) * .8, z - CALOTTE.c.z).normalize().multiplyScalar(.45).addScaledVector(n0, .55).normalize();
function cheveux(sexe){
  const h = hasard(sexe === "fille" ? 7 : 3), m = [], o = CALOTTE.c;
  const ajoute = (pts, r, plat = .55, centre = o) => m.push({geo: meche(pts, r, centre, plat), m: new THREE.Matrix4(), c: C.cheveux, ombre: ombreCheveux, normale: enBoule});
  /* la frange, à plat sur le front : son côté plat regarde devant (vu de face, elle couvre le front ; tournée vers le haut,
     comme sa racine, elle ne montrait que sa tranche) */
  const FRONT = V(0, .95, -.25);
  /* Une mèche qui suit le crâne : de (t0, f0) à (t1, f1), en s'écartant jusqu'à k1 ; bout : la pointe qui rebique (dt, df, dk) */
  const flot = (t0, f0, t1, f1, k1, r, bout, plat) => {
    const pts = [];
    for(const u of [0, .3, .6, 1]) pts.push(S(t0 + (t1 - t0) * u, f0 + (f1 - f0) * u, .96 + (k1 - .96) * Math.pow(u, .6)));
    if(bout) pts.push(S(t1 + bout[0], f1 + bout[1], k1 + bout[2]));
    ajoute(pts, r, plat);
  };
  /* la calotte : une boule posée sur la tête ; sous la naissance des cheveux (haute sur le front, plus basse sur les tempes et
     la nuque), elle rentre dans la tête et laisse voir le front et le visage */
  const cal = new THREE.SphereGeometry(1, 24, 18), P = cal.attributes.position;
  /* la calotte descend sous la frange (le front ne se voit pas entre les mèches) */
  const f0 = sexe === "fille" ? .94 : .955;
  const naissance = a => a < .3 ? f0 - (f0 - .97) * a / .3 : a < .5 ? .97 - .12 * (a - .3) / .2 : a < .62 ? .85 - .06 * (a - .5) / .12 : .79 - .03 * (a - .62) / .38;
  for(let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.abs(Math.atan2(x, z)) / Math.PI;
    if(o.y + y * CALOTTE.r.y < naissance(a)) P.setXYZ(i, x * .8, y * .8, z * .8);
    else if(z > 0){ const k = 1 + (sexe === "fille" ? .13 : .07) * z; P.setXYZ(i, x * k, y * k, z * k); }      // le dessous de la frange, bombé sur le front
  }
  cal.computeVertexNormals();
  m.push({geo: cal, m: M(o.x, o.y, o.z, CALOTTE.r.x, CALOTTE.r.y, CALOTTE.r.z), c: C.cheveux, ombre: (x, y, z) => ombreCheveux(x, y, z) * .9, normale: enBoule});
  if(sexe === "fille"){
    /* la raie, un peu sur sa droite ; le dessus, lisse, part de la raie vers chaque côté */
    const raie = -.25;
    for(let i = 0; i < 12; i++){
      const t = raie + (i < 6 ? -1 : 1) * (.15 + (i % 6) * .42) + (h() - .5) * .1;
      flot(raie + (t - raie) * .15, 1.4, t, Math.abs(t) < 1.1 ? .95 : .55, 1.1, .08, null, .5);      // devant, elles s'arrêtent où la frange commence
    }
    /* la frange, posée sur la peau du front (comme les sourcils ; posée sur la calotte, elle rentrait dans le front et laissait
       voir la peau entre ses mèches) : des mèches serrées qui se recouvrent et tombent droit jusqu'au-dessus des sourcils, un peu
       écartées de la raie, plus longues sur les côtés, la pointe qui s'arrondit vers le visage */
    const xr = Math.sin(raie);
    for(let i = 0; i < 10; i++){
      const x0 = -.72 + i * .16 + (h() - .5) * .04, cote = x0 > xr ? 1 : -1, bord = Math.min(1, Math.abs(x0) / .72);
      const fin = .34 - bord * bord * .3 + (h() - .5) * .05, dx = cote * .05 + x0 * .08;
      const pts = [[x0 * .9, 1], [x0 + dx * .4, .8], [x0 + dx * .8, (.6 + fin) / 2 + .04], [x0 + dx - x0 * .06, fin]];
      ajoute(surFace(pts, .02), .08 + h() * .01, .45, FRONT);
    }
    /* les longues mèches ondulées : elles suivent le crâne derrière les oreilles, puis tombent jusqu'aux épaules en grosses
       vagues qui s'écartent un peu, et finissent en boucle vers l'extérieur */
    for(let i = 0; i < 22; i++){
      const t = 1.78 + i / 21 * (Math.PI * 2 - 3.56) + (h() - .5) * .1;
      const dx = Math.sin(t), dz = Math.cos(t), R = .185 + h() * .015, ph = h() * Math.PI * 2, A = .026 + h() * .01;
      const bas = .64 + (h() - .5) * .05 - (Math.abs(dz) > .7 ? .03 : 0);
      const pt = (y, r, w, dy = 0) => V(dx * r + dz * w, y + dy, CALOTTE.c.z + dz * r - dx * w);
      const pts = [S(t * .9 + (h() - .5) * .2, 1.2, .95), S(t, .55, 1.08), S(t, .12, 1.12)];
      for(let j = 1; j <= 4; j++){
        const u = j / 4, y = .86 + (bas - .86) * u;
        pts.push(pt(y, R + .02 * Math.sin(u * Math.PI * .8) + A * Math.sin(ph + u * 6), A * .8 * Math.cos(ph + u * 6)));
      }
      pts.push(pt(bas + .025, R + .035, 0, 0));                                             // la boucle du bout, vers l'extérieur
      ajoute(pts, .07 + h() * .015, .6);
    }
  } else {
    /* le garçon : des touffes en bataille, comme de la pâte à modeler, posées partout sur le crâne ; chacune part de sa racine
       et s'éloigne de l'épi (en haut, derrière), tirée vers le bas par son poids ; les pointes se soulèvent */
    const epi = V(0, .62, -.78).normalize(), bas = V(0, -1, 0), n = V(0, 0, 0), d = V(0, 0, 0), q = new THREE.Quaternion();
    /* sous le milieu de la tête, les joues l'élargissent (bomber) : les mèches s'écartent d'autant, sans rentrer dans la peau */
    const surCrane = (v, k) => { const l = v.y < 0 && v.z > .2 ? 1 - .2 * v.y * Math.min(1, (v.z - .2) / .4) : 1;
      return V(o.x + CALOTTE.r.x * v.x * k * l, o.y + CALOTTE.r.y * v.y * k, o.z + CALOTTE.r.z * v.z * k * l); };
    const tangent = (v, a) => v.clone().addScaledVector(a, -a.dot(v));
    /* des racines bien réparties (une spirale sur la boule), seulement au-dessus de la naissance des cheveux, le visage et les
       oreilles dégagés (le front est à la frange) */
    const N = 64, racines = [];
    for(let i = 0; i < N; i++){
      const y = 1 - (i + .5) / N * 1.55, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
      const v = V(Math.sin(a) * rr, y, Math.cos(a) * rr), t = Math.abs(Math.atan2(v.x, v.z)) / Math.PI, yy = o.y + CALOTTE.r.y * v.y;
      if(yy < naissance(t) + (t < .3 ? .035 : t < .5 ? .1 : .01) || (t < .72 && yy < .9)) continue;
      if(!(v.z > .3 && v.y > .55 && Math.abs(v.x) < .6)) racines.push(v);
    }
    for(const v of racines){
      n.copy(v);
      d.copy(tangent(n.clone().sub(epi), n)).normalize();
      d.add(tangent(bas, n).multiplyScalar(.6 + .4 * Math.max(0, -n.z)));
      const t = Math.abs(Math.atan2(n.x, n.z)) / Math.PI;
      const oreille = t > .38 && t < .66 && n.y < .55;                                     // au-dessus de l'oreille : courtes, vers l'arrière
      if(oreille) d.add(tangent(V(0, .3, -1), n).multiplyScalar(2));
      d.normalize().applyQuaternion(q.setFromAxisAngle(n, (h() - .5) * .9));
      const cote = t > .2 && t < .78 && n.y < .62;                                // sur les côtés : plus courtes, elles s'arrêtent au-dessus des oreilles
      const L = (oreille ? .3 : cote ? (n.y < .1 ? .18 : .32) : .55) + h() * .15, kb = cote ? 1.3 + h() * .1 : 1.24 + h() * .12 + (n.y > .6 ? .06 : 0);
      const pts = [0, .35, .7, 1].map(u => surCrane(n.clone().addScaledVector(d, L * u).normalize(), .99 + (kb - .99) * Math.pow(u, 1.2)));
      ajoute(pts, .085 + h() * .025, .62);
    }
    /* la frange, posée sur la peau du front (comme les sourcils) : de grosses mèches qui partent du haut de la tête et se
       recouvrent, balayées vers sa droite (-x) jusqu'au-dessus des sourcils, la plus longue au milieu ; une mèche vers sa gauche */
    for(const [x0, fin, dx] of [[.52, .56, -.1], [.32, .44, -.18], [.12, .27, -.24], [-.08, .4, -.2], [-.28, .5, -.16], [-.48, .6, -.1], [.64, .58, .1]]){
      const pts = [[x0, .95], [x0 + dx * .3, .78], [x0 + dx * .7, .6], [x0 + dx, fin]].map(([lx, ly]) => [lx, ly + (h() - .5) * .03]);
      ajoute(surFace(pts, .022), .07 + h() * .012, .45, FRONT);
    }
  }
  return m;
}

/* ---------- Le tronc : la tunique, la ceinture, le cou ---------- */
/* Les mesures prises sur les images de Yo (30 octobre 2026) : les épaules larges de 0,22, la taille de 0,21, l'ourlet de 0,33
   pour le garçon (0,35 pour la fille, en robe) ; de profil, le corps est plus mince : 0,16 à la poitrine, et l'ourlet, à plat
   devant et derrière, n'a que 0,55 de sa largeur (0,72 pour la robe de la fille, plus ronde) */
const FINESSE = {garcon: .55, fille: .72};
const finesse = (sexe, y) => { const u = Math.min(1, Math.max(0, (y - .28) / .38)); return FINESSE[sexe] + (.78 - FINESSE[sexe]) * u; };
/* la tunique tournée autour de l'axe (un tour de potier), puis aplatie d'avant en arrière ; sous la ceinture, des plis doux
   (le tissu ondule un peu, le creux de chaque pli peint plus sombre) */
function tronc(sexe){
  const f = sexe === "fille";
  const profil = (f ? [[.175, .28], [.172, .3], [.155, .36], [.13, .43], [.112, .49], [.114, .53], [.118, .6], [.106, .655], [.075, .69], [.044, .702]]
    : [[.165, .28], [.162, .3], [.148, .37], [.126, .45], [.112, .5], [.116, .56], [.116, .62], [.104, .66], [.072, .69], [.044, .702]]).map(([r, y]) => new THREE.Vector2(r, y));
  const tun = new THREE.LatheGeometry(profil, 28), P = tun.attributes.position, pli = new Float32Array(P.count);
  for(let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(x, z);
    const fort = Math.min(1, Math.max(0, (.47 - y) / .17)), o = Math.sin(a * (f ? 9 : 7) + .6);
    const k = 1 + (f ? .045 : .03) * o * fort;
    pli[i] = o * fort;
    P.setXYZ(i, x * k, y, z * k * finesse(sexe, y));
  }
  tun.computeVertexNormals();
  tun.setAttribute("teinte", new THREE.BufferAttribute(pli.map(o => .95 + .05 * o), 1));
  const vert = new THREE.Color(C.tunique), t = new THREE.Color(), point = new THREE.Color(C.couture);
  const m = [{geo: tun, m: new THREE.Matrix4(), c: C.tunique,
    /* l'ombre peinte : plus sombre sous la ceinture et vers l'ourlet ; la couture de l'ourlet */
    couleur: (x, y, z) => (Math.abs(y - .298) < .005 ? point : t.copy(vert).multiplyScalar(y < .48 ? .9 + .1 * (y - .28) / .2 : 1)).getHex()}];
  const zDevant = y => { let r = 0; for(let i = 1; i < profil.length; i++) if(y <= profil[i].y){ const a = profil[i - 1], b = profil[i]; r = a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y); break; } return r * finesse(sexe, y); };
  m.push({geo: cyl(.09, .041, .045), m: M(0, .725, 0), c: C.peau});                                 // le cou
  m.push({geo: BOULE, m: M(0, .698, .012, .056, .01, .044), c: C.encolure});                           // l'encolure, ronde
  const zc = zDevant(.668);
  m.push({geo: new THREE.BoxGeometry(.007, .045, .006), m: M(0, .672, zc + .002, 1, 1, 1, -.25), c: C.couture});   // la fente
  for(const s of [-1, 1]) m.push({geo: cyl(.032, .0045, .0045, 5), m: M(0, .668, zc + .006, 1, 1, 1, -.25, 0, s * .8), c: C.lacet});   // le lacet en croix
  m.push({geo: new THREE.BoxGeometry(.006, .042, .004), m: M(0, .3, zDevant(.3) + .004, 1, 1, 1, .35), c: C.couture});   // la fente du bas
  /* la ceinture de cuir, sa boucle de laiton, le bout qui pend sur sa gauche */
  const zb = zDevant(.5) + .006;
  m.push({geo: cyl(.034, .119, .119, 24), m: M(0, .5, 0, 1, 1, zb / .119), c: C.ceinture});
  m.push({geo: new THREE.BoxGeometry(.05, .04, .01), m: M(0, .5, zb + .002), c: C.boucle});
  m.push({geo: new THREE.BoxGeometry(.032, .022, .012), m: M(0, .5, zb + .003), c: C.ceinture});
  m.push({geo: new THREE.BoxGeometry(.006, .028, .014), m: M(.004, .5, zb + .005), c: C.boucle});
  m.push({geo: new THREE.BoxGeometry(.028, .11, .01), m: M(.064, .44, zDevant(.44) + .005, 1, 1, 1, .12, .5, -.06), c: C.ceinture});
  return m;
}

/* ---------- Un bras (pivot à l'épaule, il pend vers le bas, un peu plié au coude) ---------- */
const LONG_BRAS = .23, MM = M;
/* une main ouverte, comme sur les images : la paume, quatre doigts un peu repliés, le pouce devant */
function main(s, y){
  const m = [], K = 1.35, M = (x, yy, z, sx = 1, sy = sx, sz = sx, rx, ry, rz) => MM(x * K, y + (yy - y) * K, z * K, sx * K, sy * K, sz * K, rx, ry, rz);
  m.push({geo: BOULE, m: M(0, y, .002, .028, .032, .017), c: C.peau});                            // la paume
  for(let i = 0; i < 4; i++){
    const x = s * (-.018 + i * .012), l = i === 0 || i === 3 ? .022 : .027;
    m.push({geo: cyl(l, .0065, .0072, 6), m: M(x, y - .03 - l / 2 + .006, .006, 1, 1, 1, .25, 0, 0), c: C.peau});
    m.push({geo: PETITE, m: M(x, y - .028 - l + .004, .011, .0068, .0068, .0068), c: C.peau});
  }
  m.push({geo: cyl(.024, .0075, .008, 6), m: M(-s * .024, y - .01, .014, 1, 1, 1, .5, 0, -s * .5), c: C.peau});   // le pouce
  m.push({geo: PETITE, m: M(-s * .031, y - .02, .02, .0078, .0078, .0078), c: C.peau});
  return m;
}
function bras(sexe, s){
  const m = [];
  if(sexe === "fille"){
    m.push({geo: BOULE, m: M(0, -.02, 0, .05, .05, .05), c: C.tunique});                            // l'épaule, ronde
    /* la manche bouffante jusqu'au poignet, plus sombre en dessous, froncée au poignet */
    m.push({geo: BOULE, m: M(0, -.095, .004, .05, .1, .05), c: C.tunique, ombre: (x, y) => .9 + .1 * Math.min(1, Math.max(0, (y + .16) / .1))});
    m.push({geo: cyl(.024, .033, .035, 12), m: M(0, -.182, .006), c: C.revers});
  } else {
    m.push({geo: BOULE, m: M(0, -.018, 0, .046, .048, .046), c: C.tunique});                        // l'épaule
    m.push({geo: cyl(.15, .043, .052, 14), m: M(0, -.09, .003, 1, 1, 1, .06), c: C.tunique, ombre: (x, y) => .92 + .08 * Math.min(1, Math.max(0, (y + .16) / .12))});
    m.push({geo: cyl(.034, .06, .058, 14), m: M(0, -.172, .008, 1, 1, 1, .06), c: C.revers});      // le revers, retourné
    m.push({geo: arc(.059, .004, Math.PI * 2), m: M(0, -.156, .008, 1, 1, 1, Math.PI / 2 + .06), c: C.couture});   // sa couture
  }
  m.push({geo: cyl(.03, .023, .026, 10), m: M(0, -.19, .01), c: C.peau});                          // le poignet
  m.push(...main(s, -LONG_BRAS + .028));
  return m;
}

/* ---------- Une jambe (pivot à la hanche ; les pieds un peu écartés, comme sur les images) ---------- */
function jambe(s){
  const m = [];
  m.push({geo: cyl(.19, .045, .04, 12), m: M(s * .012, -.09, 0, 1, 1, 1, 0, 0, s * .13), c: C.chausses,
    ombre: (x, y) => .92 + .08 * Math.min(1, Math.max(0, (y + .02) / .04))});                       // la chausse, plus sombre sous la tunique
  const ombreBotte = (x, y) => .86 + .14 * Math.min(1, Math.max(0, (y + .3) / .13));
  m.push({geo: cyl(.12, .056, .053, 14), m: M(s * .026, -.218, .002), c: C.bottes, ombre: ombreBotte});  // la tige de la botte, souple
  m.push({geo: cyl(.042, .068, .059, 14), m: M(s * .026, -.16, .002), c: C.revBotte});                      // le revers, évasé
  m.push({geo: arc(.064, .005, Math.PI * 2), m: M(s * .026, -.139, .002, 1, 1, 1, Math.PI / 2), c: C.bordBotte});   // son bord roulé
  m.push({geo: BOULE, m: M(s * .03, -.262, .035, .06, .042, .098, 0, s * .12, 0), c: C.bottes, ombre: ombreBotte});     // le pied, au bout rond
  m.push({geo: BOULE, m: M(s * .038, -.272, .1, .042, .026, .03, 0, s * .12, 0), c: C.bottes, ombre: ombreBotte});        // le bout, un peu relevé
  m.push({geo: new THREE.BoxGeometry(.112, .014, .19), m: M(s * .03, -.293, .032, 1, 1, 1, 0, s * .12, 0), c: C.semelle});            // la semelle
  m.push({geo: new THREE.BoxGeometry(.08, .02, .05), m: M(s * .026, -.288, -.038), c: C.semelle});             // le talon
  return m;
}

/* Les formes, une fois par sexe (le téléphone les garde) */
const FAIT = {};
function formes(sexe){
  if(FAIT[sexe]) return FAIT[sexe];
  return FAIT[sexe] = {
    corps: fusionner([...tronc(sexe), ...tete(sexe), ...cheveux(sexe)]),
    bras: [-1, 1].map(s => fusionner(bras(sexe, s))),
    jambe: [-1, 1].map(s => fusionner(jambe(s)))
  };
}
export const EPAULE = {x: .112, y: .64}, HANCHE = {x: .058, y: .3}, ECART_BRAS = .4, ECART_JAMBES = 0;
/* il fait de l'ombre, mais n'en reçoit pas : l'ombre des cheveux sur son visage, trop grossière vue de si près, le salissait */
const maille = geo => { const m = new THREE.Mesh(geo, MAT_UNI); m.castShadow = true; m.receiveShadow = false; return m; };
export function fabriqueHeros(o = {}){
  const sexe = o.sexe === "fille" ? "fille" : "garcon", F = formes(sexe);
  const corps = maille(F.corps);
  const bras = [-1, 1].map((s, i) => {
    const b = new THREE.Group(); b.position.set(s * EPAULE.x, EPAULE.y, 0); b.rotation.z = s * ECART_BRAS;
    b.add(maille(F.bras[i])); return b;
  });
  const jambes = [-1, 1].map((s, i) => {
    const j = new THREE.Group(); j.position.set(s * HANCHE.x, HANCHE.y, 0); j.rotation.z = s * ECART_JAMBES; j.add(maille(F.jambe[i])); return j;
  });
  return {corps, bras, jambes, longBras: LONG_BRAS, sexe};
}
