/* ================= Les poissons d'après les images de Yo =================
   Un modèle par poisson, au plus près de son image et comme un vrai (Yo, 5 novembre 2026 : « On peut passer au poisson […]
   J'aimerais que l'on fonctionne comme pour les insectes » ; pour les nageoires du gardon : « comme la nature »), dans le
   style jouet : un corps lisse et doux, des écailles en léger relief, rangée par rangée, un grand œil brillant.
   La tête est vers −x, le dos vers +y, les flancs vers ±z (comme les anciens poissons de peche.js, que la prise montrée
   tourne et fait gigoter) ; le modèle mesure environ 1,1 de long avant que peche.js le mette à la taille du poisson pris.
   Pour le téléphone : un seul morceau par poisson (un dessin), la matière jouet aux couleurs par sommet de tous les modèles
   (rien de nouveau à compiler) ; la forme est faite une fois et gardée. */
import { fusionner, toon } from "./formes.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const q0 = new THREE.Quaternion();
const ROND = new THREE.SphereGeometry(1, 12, 8), BOULE_P = new THREE.SphereGeometry(1, 8, 5);
/* une écaille : une petite coupole, plus claire au milieu, plus sombre au bord (le liseré des écailles de l'image) */
const ECAILLE = (() => {
  const g = new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position, t = [];
  for(let i = 0; i < p.count; i++) t.push(.74 + .3 * Math.sqrt(p.getY(i)));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(t, 1));
  return g;
})();
/* une grande écaille (la carpe) : plus ronde au bord */
const ECAILLE_GRANDE = (() => {
  const g = new THREE.SphereGeometry(1, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position, t = [];
  for(let i = 0; i < p.count; i++) t.push(.74 + .3 * Math.sqrt(p.getY(i)));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(t, 1));
  return g;
})();
const boule = (M, c, x, y, z, sx, sy, sz, geo = ROND, q = q0) => M.push({geo, m: new THREE.Matrix4().compose(V(x, y, z), q, V(sx, sy, sz)), c});
const tourne = (rx, ry, rz) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
const TIGE = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 5, 1); g.translate(0, .5, 0); return g; })();
function baton(M, c, a, b, r){ const d = b.clone().sub(a);
  M.push({geo: TIGE, m: new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), V(r, d.length(), r)), c}); }
const melange = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));

/* Le corps : une forme fuselée de la bouche (u = 0) au pédoncule de la queue (u = 1), son dos, son ventre et sa largeur
   donnés par haut(u), bas(u) et large(u) ; ronde au museau */
function corpsGeo(x0, x1, haut, bas, large, nu = 40, nt = 24){
  const pos = [], idx = [];
  for(let i = 0; i <= nu; i++){
    const u = i / nu, x = x0 + (x1 - x0) * u;
    for(let j = 0; j <= nt; j++){
      const a = j / nt * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
      pos.push(x, s > 0 ? haut(u) * s : bas(u) * s, large(u) * c);
    }
  }
  for(let i = 0; i < nu; i++) for(let j = 0; j < nt; j++){
    const a = i * (nt + 1) + j, b = a + nt + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
/* Une nageoire : un éventail mince de rayons, de sa base (de b0 à b1) à son bord (bord(t), t de 0 à 1) ; les rayons
   plus sombres, la membrane plus claire entre eux (comme sur l'image). Deux faces, dans le plan z = 0 (on la tourne ensuite) */
function nageoireGeo(b0, b1, bord, n = 14, ep = .006){
  const pos = [], tei = [], idx = [];
  for(const f of [1, -1]){
    const o = pos.length / 3;
    for(let i = 0; i <= n; i++){
      const t = i / n, b = b0.clone().lerp(b1, t), e = bord(t), rayon = i % 2 === 0;
      for(const k of [0, .5, 1]){ const p = b.clone().lerp(e, k); pos.push(p.x, p.y, f * ep * (1 - k * .7)); tei.push(rayon ? .86 : 1.06); }
    }
    for(let i = 0; i < n; i++) for(let k = 0; k < 2; k++){
      const a = o + i * 3 + k, b = a + 3;
      if(f > 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(tei, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* Un corps de poisson : du bout du museau (x0) au pédoncule de la queue (x1), son dos, son ventre et sa largeur (haut, bas,
   large, selon u de 0 à 1) ; rend ce qu'il faut pour poser dessus les écailles, l'œil, l'opercule et les nageoires */
function corps(x0, x1, haut, bas, large){
  const uDe = x => Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  /* un point de la peau (u : le long du corps ; a : l'angle autour, 0 sur le flanc, π/2 sur le dos ; s : le côté ±1) */
  const peau = (u, a, s) => { const sn = Math.sin(a), y = sn > 0 ? haut(u) * sn : bas(u) * sn;
    return V(x0 + (x1 - x0) * u, y, s * large(u) * Math.cos(a)); };
  const normale = (u, a, s) => {
    const d = .01, p = peau(u, a, s), pu = peau(Math.min(1, u + d), a, s).sub(peau(Math.max(0, u - d), a, s)), pa = peau(u, a + d, s).sub(peau(u, a - d, s));
    const n = pu.cross(pa).normalize();
    if(n.dot(V(0, p.y, p.z)) < 0) n.negate();
    return n; };
  /* h : la hauteur relative d'un point (1 au dos, −1 au ventre) */
  const h = (x, y) => { const u = uDe(x); return y >= 0 ? y / haut(u) : y / bas(u); };
  return {x0, x1, haut, bas, large, uDe, peau, normale, h, geo: () => corpsGeo(x0, x1, haut, bas, large)};
}
const versN = n => new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
/* la peau et ses écailles : des rangées en quinconce de u0 à u1, du ventre au dos ; couleur(x, y) : celle du corps */
function peauEtEcailles(M, F, couleur, {u0 = .33, u1 = .97, nu = 13, na = 11, taille = .033, relief = .0034, geo = ECAILLE} = {}){
  M.push({geo: F.geo(), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .15))});          // l'ombre douce peinte : le dessous plus sombre
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(F.x1, 0, 0), q0, V(.03, F.haut(1) * .9, F.large(1) * .9)), c: 0xFFFFFF, couleur});   // le bout du pédoncule
  for(const s of [-1, 1]) for(let i = 0; i < nu; i++) for(let j = 0; j < na; j++){
    const u = u0 + (i + (j % 2) * .5) / nu * (u1 - u0 + .01), a = -1.2 + j / (na - 1) * 2.65;
    if(u > u1) continue;
    const p = F.peau(u, a, s), n = F.normale(u, a, s), t = Math.min(F.haut(u), F.bas(u)) / .16, y = p.y;
    const e = taille * Math.max(.45, Math.min(1.1, t));
    M.push({geo, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.0008), versN(n), V(e * 1.1, relief, e * .95)), c: 0xFFFFFF, couleur});   // la couleur du corps à chaque sommet : les bandes passent sur les écailles
  }
}
/* l'opercule : l'arc qui ferme les ouïes, vers u0 */
function opercule(M, F, c, u0 = .26, ampleur = .045){
  for(const s of [-1, 1]) for(let k = 0; k < 18; k++){
    const a = -1.0 + k / 17 * 2.05, u = u0 + ampleur * Math.cos(a * .9), p = F.peau(u, a, s), n = F.normale(u, a, s);
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.002), versN(n), V(.009, .005, .016)), c});
  }
}
/* l'œil (à u, a ; r : son rayon) : l'iris cerclé, la prunelle noire, le reflet ; la narine */
function oeil(M, F, {u, a, r, iris, cercle, narine}){
  for(const s of [-1, 1]){
    const o = F.peau(u, a, s), n = F.normale(u, a, s), q = versN(n);
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.011), q, V(r, .018, r)), c: cercle});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.007), q, V(r * .87, .018, r * .87)), c: iris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.004), q, V(r * .5, .017, r * .5)), c: 0x141010});
    const b = o.clone().addScaledVector(n, .012); b.x -= .006; b.y += .008;
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(b, q, V(r * .17, .003, r * .17)), c: 0xFFFFFF});
    const nar = F.peau(.045, .55, s); boule(M, narine, nar.x, nar.y, nar.z, .006, .006, .006, BOULE_P);
  }
}
const nageoire = (M, geo, m, couleur) => M.push({geo, m, c: 0xFFFFFF, couleur});
function modeleDe(geo){
  const g = new THREE.Group(), m = new THREE.Mesh(geo, toon({vertexColors: true}));
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/* ---------- Le gardon ----------
   D'après l'image de Yo (5 novembre 2026 : « Je t'envoie le gardon »), comme un vrai gardon (Rutilus rutilus) : le corps
   argenté, assez haut et un peu aplati sur les côtés, le dos un peu doré (vert-olive chez le vrai, doré sur l'image), le
   ventre blanc nacré ; de grandes écailles bien rangées ; l'œil rouge, cerclé d'or (vrai : c'est sa marque) ; la petite
   bouche au bout du museau, l'opercule bien dessiné. Les nageoires comme la nature (choix de Yo) : celles du ventre et celle
   de dessous rouge orangé, les pectorales orange pâle, la nageoire du dos et la queue fourchue gris-brun teintées de rouge. */
const r0 = u => Math.sqrt(Math.min(1, u / .05 + .12));   // le museau arrondi
const GARDON_F = corps(-.45, .33,
  u => (.045 * u + .14 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .62)))) * r0(u) + .014,
  u => (.042 * u + .13 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .7)))) * r0(u) + .014,
  u => (.018 * u + .068 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r0(u) + .01);
const GARDON = {dos: 0x86826A, dosOr: 0xADA27E, flanc: 0xB6BBBD, ventre: 0xDEDCD6, tete: 0xBCAE8A, joue: 0xDCD4C2,
  opercule: 0xA4946C, iris: 0xC8321C, orIris: 0xE0B040, levre: 0xE6D2AE,
  rouge: 0xD8482A, rougeBout: 0xEC7448, pale: 0xE89A6A, gris: 0x7C5C50, grisRouge: 0x9A5E4C};
let gardonGeo = null;
function gardonFait(){
  if(gardonGeo) return gardonGeo;
  const C = GARDON, F = GARDON_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : le dos doré-olive, les flancs argentés, le ventre blanc nacré ; la tête un peu dorée */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = Math.abs(F.h(x, y)), haut = y >= 0;
    let c = haut ? (h > .55 ? melange(C.dosOr, C.dos, (h - .55) / .45) : melange(C.flanc, C.dosOr, h / .55)) : melange(C.flanc, C.ventre, h * 1.4);
    if(u < .3) c = melange(c, haut ? C.tete : C.joue, (.3 - u) / .12);   // la tête, lisse et dorée
    return c;
  };
  peauEtEcailles(M, F, couleurCorps);
  opercule(M, F, C.opercule);
  oeil(M, F, {u: .13, a: .3, r: .046, iris: C.iris, cercle: C.orIris, narine: 0x6A5A40});
  boule(M, C.levre, X0 + .008, -.012, 0, .02, .016, .03);                         // les lèvres, au bout du museau
  boule(M, 0x8A6E50, X0 - .004, -.016, 0, .008, .004, .022, BOULE_P);             // la fente de la bouche
  /* la nageoire du dos : haute, triangulaire, gris-brun teinté de rouge, plus rouge au bord */
  const dosX = -.02, dosY = HAUT(uDe(dosX)) - .01;
  nageoire(M, nageoireGeo(V(dosX - .1, dosY, 0), V(dosX + .1, dosY - .035, 0), t => V(dosX - .03 + t * .2, dosY + .16 - t * .14, 0).lerp(V(dosX + .12, dosY - .02, 0), t * t * .4)),
    new THREE.Matrix4(), (x, y) => melange(C.gris, C.grisRouge, (y - dosY) / .18));
  /* la queue fourchue : deux lobes, gris-brun teinté de rouge, rouge au bord */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .045, 0), V(qx, -.045, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .5, fourche = .1 + .19 * Math.pow(lobe, .8);
      return V(qx + fourche + .03, y * (.8 + .2 * lobe), 0); }, 22),
    new THREE.Matrix4(), x => melange(C.gris, C.grisRouge, (x - qx) / .3));
  /* la nageoire de dessous (anale) : rouge orangé, le bout plus clair */
  const anX = .16, anY = -BAS(uDe(anX)) + .01;
  nageoire(M, nageoireGeo(V(anX - .07, anY, 0), V(anX + .06, anY + .015, 0), t => V(anX - .03 + t * .14, anY - .13 + t * .1, 0)),
    new THREE.Matrix4(), (x, y) => melange(C.rouge, C.rougeBout, (anY - y) / .12));
  /* les nageoires du ventre (pelviennes) : rouge orangé, de part et d'autre, un peu écartées */
  const peX = -.06;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => V(-.01 + t * .13, -.12 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.rouge, C.rougeBout, (pY - y) / .1));
  }
  /* les pectorales : orange pâle, juste derrière l'opercule, couchées le long du flanc */
  for(const s of [-1, 1]){
    const p = F.peau(.33, -.6, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.17 - Math.abs(t - .35) * .1, -.07 + t * .05, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.rouge, C.pale, (x - p.x) / .15));
  }
  return gardonGeo = fusionner(M);
}
export const gardonModele = () => modeleDe(gardonFait());

/* ---------- La perche ----------
   D'après l'image de Yo (5 novembre 2026 : « Voici la perche »), comme une vraie perche (Perca fluviatilis ; choix de Yo :
   « A », comme la nature) : le corps haut, bossu derrière la tête, vert-olive sur le dos, jaune doré sur les flancs, crème
   au ventre, barré de sept larges bandes sombres ; la grosse bouche aux lèvres épaisses, l'opercule, l'œil rouge-orangé.
   Deux nageoires sur le dos : la première épineuse, gris-jaune, ses épines sombres qui dépassent, et la tache noire à son
   bout (la marque de la vraie perche) ; la seconde, molle, vert-jaune. Les pectorales jaune pâle ; les ventrales, l'anale et
   la queue rouge orangé. */
const r1 = u => Math.sqrt(Math.min(1, u / .05 + .16));
const PERCHE_F = corps(-.47, .36,
  u => (.04 * u + .165 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .58)))) * r1(u) + .02,
  u => (.04 * u + .13 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .7)))) * r1(u) + .02,
  u => (.018 * u + .074 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r1(u) + .012);
const PERCHE = {dos: 0x4E5A26, flanc: 0xA8A436, flancClair: 0xC8B848, ventre: 0xE8DCB0, bande: 0x3A4224, tete: 0x8A8A3A,
  joue: 0xD8CC96, opercule: 0x7A7A34, iris: 0xD8441A, cercle: 0xE8902E, levre: 0xD8C890, bouche: 0x7A5A3A,
  epine: 0x4A4030, voile: 0xA89C5C, voileBout: 0xC4B468, tache: 0x1C1C16, molle: 0xA8AC4C, molleBout: 0xC0BC5A,
  pale: 0xE8D27A, paleBout: 0xF0DE96, rouge: 0xDC5418, rougeBout: 0xF07A28};
let percheGeo = null;
function percheFait(){
  if(percheGeo) return percheGeo;
  const C = PERCHE, F = PERCHE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : olive au dos, jaune doré aux flancs, crème au ventre ; les sept bandes sombres, du dos jusque sous le flanc,
     un peu penchées vers l'avant ; la tête lisse */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .35 ? melange(C.flanc, C.dos, (h - .35) / .55) : h > -.25 ? melange(C.flancClair, C.flanc, (h + .25) / .6) : melange(C.flancClair, C.ventre, (-.25 - h) / .45);
    const ph = (u - .33 + .02 * h) / .104;                        // les bandes, de u .34 au pédoncule
    if(ph >= 0 && ph < 6.6){ const f = ph % 1, dans = f < .6 ? 1 : 0;
      const bord = Math.min(1, Math.min(f, Math.abs(.6 - f)) / .04);
      const force = dans * bord * Math.max(0, Math.min(1, (h + .5) / .3));   // la bande s'efface sous le flanc
      c = melange(c, C.bande, force * .9); }
    if(u < .3) c = melange(c, h > -.2 ? C.tete : C.joue, Math.min(1, (.3 - u) / .1));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .32, nu: 14, na: 11, taille: .034});
  opercule(M, F, C.opercule, .27, .05);
  oeil(M, F, {u: .12, a: .45, r: .044, iris: C.iris, cercle: C.cercle, narine: 0x4A4A26});
  /* la grosse bouche : deux lèvres épaisses, la mâchoire du bas un peu en avant */
  boule(M, C.levre, X0 + .016, -.002, 0, .034, .019, .05);
  boule(M, C.levre, X0 + .01, -.034, 0, .036, .019, .052);
  boule(M, C.bouche, X0 - .008, -.017, 0, .012, .007, .034, BOULE_P);
  /* la première nageoire du dos : épineuse, gris-jaune, plus claire au bord ; ses épines sombres qui dépassent ; la tache
     noire à son bout */
  const d0 = -.18, d1 = .1, y0 = HAUT(uDe(d0)) - .012, y1 = HAUT(uDe(d1)) - .012;
  const bordEp = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t); return V(b.x + .055, b.y + .04 + .14 * Math.sin(Math.PI * (t * .85 + .12)), 0); };   // penchée vers l'arrière, plus haute au premier tiers
  const tacheX = d1 - .02;
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordEp, 14), new THREE.Matrix4(),
    (x, y) => x > tacheX && y > y1 + .015 ? C.tache : melange(C.voile, C.voileBout, (y - y0) / .2));
  for(let k = 0; k <= 13; k++){ const t = k / 13, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordEp(t), bout = e.clone().add(e.clone().sub(b).multiplyScalar(.14));
    baton(M, C.epine, b, bout, .0045); }
  /* la seconde nageoire du dos : molle, vert-jaune */
  const m0 = .14, m1 = .3, ym0 = HAUT(uDe(m0)) - .012, ym1 = HAUT(uDe(m1)) - .01;
  nageoire(M, nageoireGeo(V(m0, ym0, 0), V(m1, ym1, 0), t => V(m0 + .02 + t * .2, ym0 + .13 - t * .1, 0).lerp(V(m1 + .05, ym1 + .005, 0), t * t * .5), 12),
    new THREE.Matrix4(), (x, y) => melange(C.molle, C.molleBout, (y - ym0) / .13));
  /* la queue : un peu fourchue, aux lobes arrondis, rouge orangé */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .05, 0), V(qx, -.05, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .44, fourche = .15 + .11 * Math.pow(lobe, .6);
      return V(qx + fourche + .03, y * (.85 + .15 * lobe), 0); }, 22),
    new THREE.Matrix4(), x => melange(C.rouge, C.rougeBout, (x - qx) / .3));
  /* l'anale : rouge orangé */
  const anX = .2, anY = -BAS(uDe(anX)) + .012;
  nageoire(M, nageoireGeo(V(anX - .07, anY, 0), V(anX + .07, anY + .02, 0), t => V(anX - .02 + t * .14, anY - .12 + t * .085, 0)),
    new THREE.Matrix4(), (x, y) => melange(C.rouge, C.rougeBout, (anY - y) / .12));
  /* les ventrales : rouge orangé, sous la poitrine */
  const peX = -.1;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => V(-.01 + t * .13, -.13 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.rouge, C.rougeBout, (pY - y) / .11));
  }
  /* les pectorales : jaune pâle, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.34, -.45, s);
    const g = nageoireGeo(V(0, .022, 0), V(0, -.022, 0), t => V(.18 - Math.abs(t - .35) * .1, -.07 + t * .055, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.pale, C.paleBout, (x - p.x) / .16));
  }
  return percheGeo = fusionner(M);
}
export const percheModele = () => modeleDe(percheFait());

/* ---------- La tanche ----------
   D'après l'image de Yo (5 novembre 2026 : « Voici la tanche »), comme une vraie tanche (Tinca tinca ; choix de Yo : « A »,
   comme la nature) : le corps trapu et épais, le pédoncule large, vert-olive foncé au dos, olive doré aux flancs, jaune
   doré au ventre ; la peau épaisse et lisse, ses écailles minuscules à peine visibles ; l'œil rouge-orangé ; la petite
   bouche aux lèvres épaisses et un seul petit barbillon à chaque coin ; toutes les nageoires bien rondes, vert-olive foncé,
   la queue presque droite, à peine échancrée. */
const r2 = u => Math.sqrt(Math.min(1, u / .05 + .16));
const TANCHE_F = corps(-.46, .34,
  u => (.05 * u + .165 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .62)))) * r2(u) + .02,
  u => (.048 * u + .14 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .72)))) * r2(u) + .02,
  u => (.035 * u + .07 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r2(u) + .014);
const TANCHE = {dos: 0x3E4A1E, flanc: 0x7E8228, flancOr: 0xA89A30, ventre: 0xD6B444, tete: 0x5E6626, joue: 0xB8A23C,
  opercule: 0x5A6020, iris: 0xD8401A, cercle: 0xE48A2A, levre: 0xB89A3E, bouche: 0x5A4A22, barbillon: 0xA88E3A,
  nag: 0x3E4622, nagBout: 0x56602E};
let tancheGeo = null;
function tancheFait(){
  if(tancheGeo) return tancheGeo;
  const C = TANCHE, F = TANCHE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .3 ? melange(C.flanc, C.dos, (h - .3) / .6) : h > -.3 ? melange(C.flancOr, C.flanc, (h + .3) / .6) : melange(C.flancOr, C.ventre, (-.3 - h) / .5);
    if(u < .28) c = melange(c, h > -.25 ? C.tete : C.joue, Math.min(1, (.28 - u) / .1));
    return c;
  };
  /* la peau épaisse et lisse, comme du velours mouillé : ses écailles minuscules ne se voient pas d'ici (en relief, même
     très fines, elles dessinaient des rayures) */
  peauEtEcailles(M, F, couleurCorps, {nu: 0});
  opercule(M, F, C.opercule, .26, .05);
  oeil(M, F, {u: .12, a: .42, r: .03, iris: C.iris, cercle: C.cercle, narine: 0x3A3A18});
  /* la petite bouche aux lèvres épaisses ; un petit barbillon à chaque coin */
  boule(M, C.levre, X0 + .01, -.008, 0, .024, .015, .034);
  boule(M, C.levre, X0 + .008, -.03, 0, .024, .014, .034);
  boule(M, C.bouche, X0 - .006, -.019, 0, .01, .006, .026, BOULE_P);
  for(const s of [-1, 1]){
    const a = V(X0 + .028, -.03, s * .028), b = V(X0 + .012, -.056, s * .034);
    baton(M, C.barbillon, a, b, .0055); boule(M, C.barbillon, b.x, b.y, b.z, .006, .006, .006, BOULE_P);
  }
  const couleurNag = d => (x, y) => melange(C.nag, C.nagBout, d(x, y));
  /* la nageoire du dos : ronde, en palette */
  const d0 = .0, d1 = .17, y0 = HAUT(uDe(d0)) - .012, y1 = HAUT(uDe(d1)) - .012;
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), t => { const a = Math.PI * (.08 + t * .84);
      return V((d0 + d1) / 2 + .03 - Math.cos(a) * .12, (y0 + y1) / 2 + Math.sin(a) * .15, 0); }, 16),
    new THREE.Matrix4(), couleurNag((x, y) => (y - y0) / .15));
  /* la queue : large, presque droite, à peine échancrée, aux coins arrondis */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .06, 0), V(qx, -.06, 0), t => {
      const y = (.5 - t) * .42, coin = Math.pow(Math.abs(.5 - t) * 2, 4);
      return V(qx + .2 - .03 * (1 - Math.abs(.5 - t) * 2) - .05 * coin, y * (1 - .1 * coin), 0); }, 22),
    new THREE.Matrix4(), couleurNag(x => (x - qx) / .22));
  /* l'anale : ronde */
  const anX = .2, anY = -BAS(uDe(anX)) + .014;
  nageoire(M, nageoireGeo(V(anX - .07, anY, 0), V(anX + .06, anY + .02, 0), t => { const a = Math.PI * (.1 + t * .8);
      return V(anX - .005 - Math.cos(a) * .085, anY - Math.sin(a) * .11, 0); }, 12),
    new THREE.Matrix4(), couleurNag((x, y) => (anY - y) / .11));
  /* les ventrales : grandes et rondes */
  const peX = -.04;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .022, base = s * LARGE(uDe(peX)) * .55;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => { const a = Math.PI * (.1 + t * .8); return V(.0 - Math.cos(a) * .08, -Math.sin(a) * .12, 0).add(V(.03, 0, 0)); }, 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), couleurNag((x, y) => (pY - y) / .12));
  }
  /* les pectorales : rondes, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.33, -.5, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => { const a = Math.PI * (t - .5) * .9; return V(.02 + Math.cos(a) * .1, Math.sin(-a) * .055 - .02, 0); }, 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), couleurNag(x => (x - p.x) / .15));
  }
  return tancheGeo = fusionner(M);
}
export const tancheModele = () => modeleDe(tancheFait());

/* ---------- La carpe ----------
   D'après l'image de Yo (5 novembre 2026 : « Voici la carpe »), comme une vraie carpe commune (Cyprinus carpio ; choix de
   Yo : « A », comme la nature) : le corps haut et puissant, le dos bronze-brun, les flancs dorés, le ventre jaune crème ;
   de grandes écailles bien rangées ; l'œil doré ; les lèvres épaisses et deux barbillons de chaque côté (un long au coin,
   un court sur la lèvre du haut) ; la longue nageoire du dos ; les nageoires brun-gris olive, celles du dessous et le bas
   de la queue teintés de rouge orangé. */
const r3 = u => Math.sqrt(Math.min(1, u / .05 + .14));
const CARPE_F = corps(-.46, .34,
  u => (.045 * u + .185 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .6)))) * r3(u) + .016,
  u => (.042 * u + .135 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .7)))) * r3(u) + .016,
  u => (.02 * u + .074 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r3(u) + .012);
const CARPE = {dos: 0x664622, dosOr: 0x9A6E2E, flanc: 0xC8962E, ventre: 0xE8C870, tete: 0x86602C, joue: 0xCC9C46,
  opercule: 0x765626, iris: 0xC8962A, cercle: 0x5A3E1A, levre: 0xCC9C4E, bouche: 0x5A3E1E, barbillon: 0xC09048,
  nag: 0x6A5638, nagBout: 0x86704A, rouge: 0xC0602A, rougeBout: 0xD27A38};
let carpeGeo = null;
function carpeFait(){
  if(carpeGeo) return carpeGeo;
  const C = CARPE, F = CARPE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .45 ? melange(C.dosOr, C.dos, (h - .45) / .5) : h > -.15 ? melange(C.flanc, C.dosOr, (h + .15) / .6) : melange(C.flanc, C.ventre, (-.15 - h) / .55);
    if(u < .28) c = melange(c, h > -.2 ? C.tete : C.joue, Math.min(1, (.28 - u) / .1));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .3, nu: 11, na: 9, taille: .043, relief: .0028, geo: ECAILLE_GRANDE});
  opercule(M, F, C.opercule, .26, .05);
  oeil(M, F, {u: .13, a: .38, r: .036, iris: C.iris, cercle: C.cercle, narine: 0x4A3418});
  /* les lèvres épaisses ; deux barbillons de chaque côté : un long au coin de la bouche, un court sur la lèvre du haut */
  boule(M, C.levre, X0 + .012, -.004, 0, .028, .017, .04);
  boule(M, C.levre, X0 + .01, -.03, 0, .026, .015, .038);
  boule(M, C.bouche, X0 - .006, -.017, 0, .011, .006, .03, BOULE_P);
  for(const s of [-1, 1]){
    const a = V(X0 + .03, -.03, s * .03), b = V(X0 + .008, -.08, s * .036);
    baton(M, C.barbillon, a, b, .006); boule(M, C.barbillon, b.x, b.y, b.z, .007, .007, .007, BOULE_P);
    const c = V(X0 + .006, -.006, s * .022), d = V(X0 - .006, -.036, s * .026);
    baton(M, C.barbillon, c, d, .005); boule(M, C.barbillon, d.x, d.y, d.z, .006, .006, .006, BOULE_P);
  }
  const brun = d => (x, y) => melange(C.nag, C.nagBout, d(x, y)), roux = d => (x, y) => melange(C.nag, C.rouge, d(x, y));
  /* la longue nageoire du dos : haute devant, puis longue et basse jusqu'au pédoncule, le bord un peu creusé */
  const d0 = -.1, d1 = .25, y0 = HAUT(uDe(d0)) - .014, y1 = HAUT(uDe(d1)) - .012;
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t);
      const haut = t < .12 ? .07 + t / .12 * .1 : .17 - (t - .12) * .1 - .025 * Math.sin(Math.PI * Math.min(1, (t - .12) / .88));
      return V(b.x + .05, b.y + haut, 0); }, 22),
    new THREE.Matrix4(), brun((x, y) => (y - y0) / .17));
  /* la queue bien fourchue : le haut brun-gris, le bas teinté de rouge orangé */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .05, 0), V(qx, -.05, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .52, fourche = .1 + .18 * Math.pow(lobe, .8);
      return V(qx + fourche + .03, y * (.8 + .2 * lobe), 0); }, 22),
    new THREE.Matrix4(), (x, y) => melange(melange(C.nag, C.nagBout, (x - qx) / .3), C.rouge, Math.min(1, -y / .16) * .8));
  /* l'anale : brun-gris, teintée de rouge orangé */
  const anX = .2, anY = -BAS(uDe(anX)) + .012;
  nageoire(M, nageoireGeo(V(anX - .06, anY, 0), V(anX + .06, anY + .02, 0), t => V(anX - .02 + t * .13, anY - .12 + t * .085, 0)),
    new THREE.Matrix4(), roux((x, y) => (anY - y) / .12));
  /* les ventrales : brun-gris, teintées de rouge orangé */
  const peX = -.04;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => V(-.01 + t * .13, -.13 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), roux((x, y) => (pY - y) / .12));
  }
  /* les pectorales : brun-gris, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.33, -.55, s);
    const g = nageoireGeo(V(0, .022, 0), V(0, -.022, 0), t => V(.18 - Math.abs(t - .35) * .1, -.07 + t * .055, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), brun(x => (x - p.x) / .16));
  }
  return carpeGeo = fusionner(M);
}
export const carpeModele = () => modeleDe(carpeFait());

/* Les poissons refaits d'après les images de Yo (peche.js, icones.js) : fabrique() rend le modèle ; echelle le met à la taille
   des anciens poissons */
export const MODELES_POISSONS = {gardon: {fabrique: gardonModele, echelle: 1}, perche: {fabrique: percheModele, echelle: 1},
  tanche: {fabrique: tancheModele, echelle: 1}, carpe: {fabrique: carpeModele, echelle: 1}};
