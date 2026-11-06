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
function oeil(M, F, {u, a, r, iris, cercle, narine, uNarine = .045, aNarine = .55}){
  for(const s of [-1, 1]){
    const o = F.peau(u, a, s), n = F.normale(u, a, s), q = versN(n);
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.011), q, V(r, .018, r)), c: cercle});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.007), q, V(r * .87, .018, r * .87)), c: iris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.004), q, V(r * .5, .017, r * .5)), c: 0x141010});
    const b = o.clone().addScaledVector(n, .012); b.x -= .006; b.y += .008;
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(b, q, V(r * .17, .003, r * .17)), c: 0xFFFFFF});
    const nar = F.peau(uNarine, aNarine, s); boule(M, narine, nar.x, nar.y, nar.z, .006, .006, .006, BOULE_P);
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

/* ---------- L'écrevisse ----------
   D'après l'image de Yo (5 novembre 2026 : « Voici l'écrevisse »), comme une vraie écrevisse de nos rivières, l'écrevisse
   à pattes rouges (Astacus astacus ; choix de Yo : « A », comme la nature : elle n'est rouge vif qu'une fois cuite) :
   brun-olive foncé dessus, le dessous des pinces et la base des pattes rouge orangé ; la carapace bosselée et son rostre
   pointu, la queue en six anneaux et son éventail ; deux grosses pinces granuleuses et dentelées ; les yeux noirs et
   brillants au bout de petits pédoncules ; deux grandes antennes et deux paires de petites ; quatre paires de pattes fines
   pour marcher. La tête vers −x, comme les poissons. */
const ECREVISSE = {brun: 0x4A3E26, brunClair: 0x6A5834, dessous: 0x96784A, rouge: 0xC4502A, rougeClair: 0xD8703A,
  grain: 0x3A3020, oeil: 0x101010};
const versX = d => new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), d.clone().normalize());
/* un morceau ovale couché le long de a → b (sa largeur l, sa hauteur h) */
function ovale(M, c, a, b, l, h, couleur){
  const d = b.clone().sub(a), m = a.clone().add(b).multiplyScalar(.5), q = versX(V(d.x, d.y, d.z));
  M.push({geo: ROND, m: new THREE.Matrix4().compose(m, q, V(d.length() / 2, h, l)), c, couleur});
}
/* une patte articulée qui passe par les points pts, plus fine au bout */
function articule(M, pts, r0, r1, couleur){
  for(let i = 0; i < pts.length - 1; i++){ const r = r0 + (r1 - r0) * i / (pts.length - 2 || 1);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(pts[i], new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), pts[i + 1].clone().sub(pts[i]).normalize()), V(r, pts[i + 1].distanceTo(pts[i]), r)), c: 0xFFFFFF, couleur});
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(pts[i + 1], q0, V(r * 1.15, r * 1.15, r * 1.15)), c: 0xFFFFFF, couleur}); }
}
let ecrevisseGeo = null;
function ecrevisseFait(){
  if(ecrevisseGeo) return ecrevisseGeo;
  const C = ECREVISSE, M = [];
  /* brun-olive dessus, plus clair sur les flancs, chamois dessous */
  const dos = (y0, h) => (x, y) => { const t = (y - y0) / h; return t > .2 ? melange(C.brunClair, C.brun, (t - .2) / .7) : melange(C.dessous, C.brunClair, (t + .6) / .8); };
  /* la carapace : bombée, bosselée, son sillon, le rostre pointu devant */
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(-.09, .02, 0), q0, V(.18, .1, .1)), c: 0xFFFFFF, couleur: dos(.02, .1),
    ombre: (x, y) => .9 + .14 * Math.max(-1, Math.min(1, (y - .02) / .1))});
  M.push({geo: new THREE.ConeGeometry(1, 1, 6).rotateZ(Math.PI / 2), m: new THREE.Matrix4().compose(V(-.29, .05, 0), q0, V(.06, .016, .02)), c: C.brun});
  for(let k = 0; k < 9; k++){ const a = -1.1 + k / 8 * 2.2;                                                  // le sillon
    boule(M, C.grain, -.045, .02 + Math.sin(a) * .095, Math.cos(a) * .095 * (k % 2 ? 1 : -1), .006, .012, .006, BOULE_P); }
  for(let k = 0; k < 26; k++){ const a = (k * 2.39) % 6.28, u = (k * .37) % 1, x = -.22 + u * .26, r = Math.sqrt(Math.max(0, 1 - Math.pow((x + .09) / .18, 2)));   // les bosses
    boule(M, C.grain, x, .02 + .1 * r * Math.abs(Math.sin(a)) * .98, .1 * r * Math.cos(a) * .98, .008, .006, .008, BOULE_P); }
  /* la queue : six anneaux qui rétrécissent et se recourbent un peu, puis l'éventail (le telson et quatre palettes) */
  let x = .08;
  for(let k = 0; k < 6; k++){ const w = .085 - k * .007, h = .07 - k * .006, y = .02 - k * .006;
    M.push({geo: ROND, m: new THREE.Matrix4().compose(V(x + .03, y, 0), tourne(0, 0, -k * .04), V(.045, h, w)), c: 0xFFFFFF, couleur: dos(y, h)});
    for(const s of [-1, 1]) boule(M, C.brun, x + .03, y - h * .45, s * w * .92, .03, .025, .012);           // le bord des anneaux
    x += .052; }
  const fx = x + .01, fy = -.02;
  for(const [a, l, w] of [[0, .13, .05], [.5, .12, .045], [-.5, .12, .045], [1.0, .11, .04], [-1.0, .11, .04]]){
    const d = V(Math.cos(a * .6), -.35, Math.sin(a * .6));
    ovale(M, 0xFFFFFF, V(fx, fy, 0), V(fx, fy, 0).addScaledVector(d, l), w, .012, (x, y) => melange(C.brunClair, C.brun, .5));
  }
  /* les yeux : noirs et brillants, au bout d'un petit pédoncule */
  for(const s of [-1, 1]){
    const a = V(-.24, .055, s * .03), b = V(-.27, .07, s * .05);
    baton(M, C.brunClair, a, b, .008);
    boule(M, C.oeil, b.x, b.y, b.z, .016, .016, .016);
    boule(M, 0xFFFFFF, b.x - .006, b.y + .008, b.z + s * .008, .004, .004, .004, BOULE_P);
  }
  /* les antennes : deux grandes, qui partent en avant et s'écartent ; deux paires de petites (les antennules) */
  for(const s of [-1, 1]){
    const pts = []; for(let k = 0; k <= 8; k++){ const t = k / 8; pts.push(V(-.27 - t * .5, .04 + Math.sin(t * 2.2) * .12, s * (.04 + t * .2))); }
    articule(M, pts, .006, .003, () => melange(C.brunClair, C.brun, .4));
    for(const e of [.0, .02]){ const q = [V(-.28, .03, s * (.015 + e)), V(-.36, .05, s * (.03 + e)), V(-.42, .07, s * (.04 + e * 2))];
      articule(M, q, .004, .003, () => C.brunClair); }
  }
  /* les pinces : le bras, puis la grosse pince granuleuse, ses deux doigts dentelés un peu ouverts ; brun-olive dessus,
     rouge orangé dessous */
  for(const s of [-1, 1]){
    const rouxDessous = cy => (x, y) => y < cy ? melange(C.rougeClair, C.rouge, (cy - y) / .02) : melange(C.brunClair, C.brun, Math.min(1, (y - cy) / .03));
    articule(M, [V(-.14, -.03, s * .07), V(-.2, -.01, s * .15), V(-.29, .0, s * .17)], .026, .024, rouxDessous(-.015));
    const p0 = V(-.3, .0, s * .17), p1 = V(-.47, .0, s * .15);
    ovale(M, 0xFFFFFF, p0, p1, .06, .05, rouxDessous(-.012));                                              // la paume, grosse et bombée
    for(let k = 0; k < 10; k++){ const t = k / 9, a = k * 1.7;                                             // ses grains
      boule(M, C.grain, p0.x + (p1.x - p0.x) * t * .9, .045 * Math.abs(Math.cos(a)) * Math.sqrt(1 - Math.pow(2 * t - 1, 2) * .8), s * .16 + Math.sin(a) * .045, .008, .006, .008, BOULE_P); }
    for(const [dy, dz, r] of [[.008, s * .018, .03], [-.006, -s * .026, .026]]){                          // les deux doigts, un peu ouverts
      const a = V(-.44, dy, s * .15 + dz), b = V(-.62, dy * 1.5, s * .15 + dz * 2.4);
      ovale(M, 0xFFFFFF, a, b, r, r * .85, rouxDessous(-.01 + dy));
      for(let k = 1; k < 5; k++){ const p = a.clone().lerp(b, k / 5); boule(M, C.dessous, p.x, p.y, p.z - Math.sign(dz) * r * .7, .005, .005, .005, BOULE_P); }   // les dents
    }
  }
  /* quatre paires de pattes pour marcher : la base rouge orangé, puis brun-olive, posées un peu en dessous */
  for(const s of [-1, 1]) for(let k = 0; k < 4; k++){
    const bx = -.11 + k * .05, pts = [V(bx, -.04, s * .06), V(bx + .01 * (k - 1.5), .02, s * .14), V(bx + .02 * (k - 1.5), -.04, s * .2), V(bx + .03 * (k - 1.5), -.1, s * .23)];
    articule(M, pts, .014, .009, (x, y) => y > -.02 ? C.rouge : melange(C.brunClair, C.brun, .3));
  }
  return ecrevisseGeo = fusionner(M);
}
export const ecrevisseModele = () => modeleDe(ecrevisseFait());

/* ---------- Le brochet ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le brochet »), comme un vrai brochet (Esox lucius ; choix de Yo : « A »,
   comme la nature) : le corps long et rond, vert-olive, semé de taches jaune pâle en forme de haricot, rangées en lignes ; le
   ventre crème ; le long museau plat en bec de canard, la mâchoire du bas un peu plus longue, la bouche entrouverte et ses
   grands crocs en bas (le bord de la mâchoire du haut presque lisse) ; l'œil jaune doré, haut sur la tête. La nageoire du
   dos tout au fond, juste au-dessus de l'anale ; elles et la queue fourchue olive-jaune à rouge orangé, marbrées de taches
   sombres ; les pectorales et les ventrales orange-jaune pâle, sans taches. */
/* une courbe douce qui passe par des points [u, valeur] (pour dessiner le profil du corps) */
function courbe(pts){
  return u => {
    let i = 0; while(i < pts.length - 2 && u > pts[i + 1][0]) i++;
    const [u0, v0] = pts[i], [u1, v1] = pts[i + 1], t = Math.max(0, Math.min(1, (u - u0) / (u1 - u0))), du = u1 - u0;
    const pente = k => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); };
    const m0 = pente(i) * du, m1 = pente(i + 1) * du, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * m1;
  };
}
const BROCHET_F = corps(-.58, .36,
  courbe([[0, .013], [.05, .023], [.12, .034], [.21, .05], [.32, .062], [.45, .072], [.6, .076], [.75, .07], [.88, .056], [1, .038]]),
  courbe([[0, .006], [.05, .01], [.12, .015], [.21, .032], [.32, .056], [.45, .068], [.6, .072], [.75, .064], [.88, .05], [1, .034]]),
  courbe([[0, .018], [.05, .028], [.12, .034], [.21, .042], [.32, .054], [.45, .06], [.6, .06], [.75, .052], [.88, .04], [1, .024]]));
const BROCHET = {dos: 0x3E4A1A, flanc: 0x6E7A2A, flancOr: 0x9C9A3A, ventre: 0xE6DCAA, tete: 0x5A6424, joue: 0xC8BC72,
  opercule: 0x56601E, tache: 0xE0D278, iris: 0xE0B42A, cercle: 0xB08A1E, levre: 0xD8CC90, bouche: 0xC08A74, dent: 0xF4EEDA,
  nag: 0x94883A, nagBout: 0xD0602A, marbre: 0x5A4220, pale: 0xE09A3E, paleBout: 0xEEBC62};
/* une tache sur la peau ou sur une nageoire : une petite coupole plate */
const TACHE = new THREE.SphereGeometry(1, 8, 2, 0, Math.PI * 2, 0, Math.PI / 2);
const MARBRE = new THREE.CircleGeometry(1, 6);
let brochetGeo = null;
function brochetFait(){
  if(brochetGeo) return brochetGeo;
  const C = BROCHET, F = BROCHET_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  let graine = 7; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  /* le corps : olive foncé au dos, vert-olive aux flancs, doré plus bas, crème au ventre ; la tête lisse, la joue claire */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .35 ? melange(C.flanc, C.dos, (h - .35) / .55) : h > -.3 ? melange(C.flancOr, C.flanc, (h + .3) / .65) : melange(C.flancOr, C.ventre, (-.3 - h) / .4);
    if(u < .32) c = melange(c, h > .05 ? C.tete : C.joue, Math.min(1, (.32 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .33, u1: .97, nu: 15, na: 8, taille: .026});
  /* les taches jaune pâle en haricot, rangées en lignes un peu de travers, du dos au bas du flanc ; plus petites sur la tête */
  for(const s of [-1, 1]){ graine = 7;
    for(const a0 of [-.4, -.1, .2, .5, .8]){
      let u = .34 + hasard() * .03;
      while(u < .95){
        const a = a0 + (hasard() - .5) * .16 + (u - .6) * .1, l = .014 + hasard() * .012;
        const p = F.peau(u, a, s), n = F.normale(u, a, s), t = Math.min(1, Math.min(F.haut(u), F.bas(u)) / .06);
        M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.001), versN(n), V(l * t + .003, .0048, .0055 * t + .0015)), c: C.tache});
        u += (l * 2 + .026 + hasard() * .03) / .94;
      }
    }
    for(let k = 0; k < 7; k++){ const u = .2 + hasard() * .1, a = .1 + hasard() * .6, p = F.peau(u, a, s), n = F.normale(u, a, s);
      M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.001), versN(n), V(.006, .004, .004)), c: C.tache}); }
  }
  opercule(M, F, C.opercule, .31, .045);
  oeil(M, F, {u: .21, a: .5, r: .024, iris: C.iris, cercle: C.cercle, narine: 0x2E3412, uNarine: .14, aNarine: .7});
  /* la mâchoire du bas : longue, plate, un peu plus longue que celle du haut, la bouche entrouverte ; le dedans rose pâle ;
     les grands crocs en bas, plus grands vers l'avant ; le bord de la mâchoire du haut presque lisse */
  const ja = V(X0 - .008, -.03, 0), jb = V(X0 + .21, -.034, 0);
  ovale(M, 0xFFFFFF, ja, jb, .031, .016, (x, y) => y > -.028 ? C.levre : melange(C.joue, C.ventre, .5));
  ovale(M, C.bouche, V(X0 + .01, -.014, 0), V(X0 + .17, -.022, 0), .022, .01);
  for(const s of [-1, 1]) for(let k = 0; k < 7; k++){
    const t = .1 + k * .085, f = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))), p = ja.clone().lerp(jb, t);
    const haut = (k % 2 ? .009 : .015) * (1.2 - t * .6);
    M.push({geo: new THREE.ConeGeometry(1, 1, 4), m: new THREE.Matrix4().compose(V(p.x, p.y + .016 * f * .8 + haut * .4, s * .03 * f * .78), q0, V(.0035, haut, .0035)), c: C.dent});
  }
  /* les nageoires marbrées : olive-jaune, rouge orangé au bord, semées de taches sombres des deux côtés */
  const marbrer = (b0, b1, bord, n) => {
    for(let k = 0; k < n; k++){ const t = .08 + hasard() * .84, e = .15 + hasard() * .7, p = b0.clone().lerp(b1, t).lerp(bord(t), e), r = .005 + hasard() * .004;
      for(const s of [-1, 1]) M.push({geo: MARBRE, m: new THREE.Matrix4().compose(V(p.x, p.y, s * (.006 * (1 - e * .7) + .0012)), s > 0 ? q0 : tourne(0, Math.PI, 0), V(r * 1.4, r, 1)), c: C.marbre}); }
  };
  const nagCouleur = d => (x, y) => melange(C.nag, C.nagBout, d(x, y));
  /* la nageoire du dos : tout au fond, ronde, penchée vers l'arrière */
  const d0 = .12, d1 = .26, y0 = HAUT(uDe(d0)) - .01, y1 = HAUT(uDe(d1)) - .008;
  const bordD = t => { const a = Math.PI * (.04 + t * .9); return V((d0 + d1) / 2 + .07 - Math.cos(a) * .1, (y0 + y1) / 2 + Math.sin(a) * .12 * (1 - t * .2), 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 14), new THREE.Matrix4(), nagCouleur((x, y) => (y - y0) / .1));
  marbrer(V(d0, y0, 0), V(d1, y1, 0), bordD, 9);
  /* l'anale : juste en dessous, ronde aussi */
  const a0 = .14, a1 = .27, ay0 = -BAS(uDe(a0)) + .01, ay1 = -BAS(uDe(a1)) + .008;
  const bordA = t => { const a = Math.PI * (.04 + t * .9); return V((a0 + a1) / 2 + .06 - Math.cos(a) * .09, (ay0 + ay1) / 2 - Math.sin(a) * .1 * (1 - t * .2), 0); };
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), bordA, 12), new THREE.Matrix4(), nagCouleur((x, y) => (ay0 - y) / .09));
  marbrer(V(a0, ay0, 0), V(a1, ay1, 0), bordA, 7);
  /* la queue fourchue, aux lobes arrondis */
  const qx = X1 - .015, bordQ = t => {
    const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .3, fourche = .07 + .1 * Math.sin(Math.PI / 2 * Math.pow(lobe, .7)) - .05 * Math.pow(lobe, 5);
    return V(qx + fourche + .03, y * (.8 + .2 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .04, 0), V(qx, -.04, 0), bordQ, 22), new THREE.Matrix4(), nagCouleur(x => (x - qx) / .22));
  marbrer(V(qx, .04, 0), V(qx, -.04, 0), bordQ, 11);
  /* les ventrales : orange-jaune pâle, au milieu du ventre */
  const peX = -.02;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .016, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.04, 0, 0), V(.03, 0, 0), t => { const a = Math.PI * (.1 + t * .8); return V(.02 - Math.cos(a) * .06, -Math.sin(a) * .1, 0); }, 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.pale, C.paleBout, (pY - y) / .09));
  }
  /* les pectorales : orange-jaune pâle, basses, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.35, -.7, s);
    const g = nageoireGeo(V(0, .016, 0), V(0, -.016, 0), t => V(.13 - Math.abs(t - .35) * .08, -.06 + t * .045, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .008), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.pale, C.paleBout, (x - p.x) / .12));
  }
  return brochetGeo = fusionner(M);
}
export const brochetModele = () => modeleDe(brochetFait());

/* ---------- L'anguille ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici l'anguille »), comme une vraie anguille d'Europe (Anguilla anguilla, au
   stade « anguille jaune » de nos étangs ; choix de Yo : « A », comme la nature) : le long corps en serpent qui ondule, brun
   olive foncé au dos, jaune doré aux flancs et au ventre ; la peau lisse et brillante, sans taches (ses écailles minuscules
   sont cachées dessous) ; la petite tête pointue, la mâchoire du bas un peu plus longue, les narines en petits tubes au bout
   du museau, le petit œil doré ; une petite pectorale ronde ; une seule longue nageoire, de la couleur du corps au bord
   doré, qui part du milieu du dos, fait le tour de la queue et revient dessous. */
/* un ruban de nageoire : de sa base (base(t)) à son bord (bord(t)), t de 0 à 1 ; ses rayons fins, comme nageoireGeo */
function rubanGeo(base, bord, n, ep = .004){
  const pos = [], tei = [], idx = [];
  for(const f of [1, -1]){
    const o = pos.length / 3;
    for(let i = 0; i <= n; i++){
      const t = i / n, b = base(t), e = bord(t), rayon = i % 2 === 0;
      for(const k of [0, .5, 1]){ const p = b.clone().lerp(e, k); pos.push(p.x, p.y, f * ep * (1 - k * .7)); tei.push(rayon ? .95 : 1.03); }
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
const ANGUILLE_F = corps(-.6, .56,
  courbe([[0, .008], [.03, .019], [.08, .03], [.14, .038], [.3, .046], [.5, .047], [.7, .04], [.85, .028], [1, .006]]),
  courbe([[0, .008], [.03, .016], [.08, .027], [.14, .037], [.3, .048], [.5, .049], [.7, .041], [.85, .028], [1, .006]]),
  courbe([[0, .01], [.03, .018], [.08, .027], [.14, .034], [.3, .038], [.5, .035], [.7, .025], [.85, .014], [1, .003]]));
const ANGUILLE = {dos: 0x46351A, dosClair: 0x6E5626, flanc: 0xB8902E, ventre: 0xE2C462, levre: 0xB89A48, bouche: 0x4A3818,
  iris: 0xD0A42C, cercle: 0x6A5220, nag: 0x6A5424, nagBout: 0xB8923A, pecto: 0x9A8238, pectoBout: 0xC0A04A};
let anguilleGeo = null;
function anguilleFait(){
  if(anguilleGeo) return anguilleGeo;
  const C = ANGUILLE, F = ANGUILLE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas;
  const xDe = u => X0 + (X1 - X0) * u;
  /* le corps, lisse et brillant : brun olive foncé au dos, jaune doré aux flancs et au ventre, sans taches */
  const couleurCorps = (x, y) => { const h = F.h(x, y);
    return h > .3 ? melange(C.dosClair, C.dos, (h - .3) / .4) : h > -.15 ? melange(C.flanc, C.dosClair, (h + .15) / .45) : melange(C.flanc, C.ventre, (-.15 - h) / .6); };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, F.large, 96, 26), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .05))});
  oeil(M, F, {u: .065, a: .5, r: .012, iris: C.iris, cercle: C.cercle, narine: C.dos, uNarine: .018, aNarine: .4});
  /* les narines en petits tubes, au bout du museau */
  for(const s of [-1, 1]){ const a = F.peau(.012, .35, s), b = a.clone().add(V(-.006, .006, s * .003)); baton(M, C.dosClair, a, b, .0025); }
  /* la bouche : la mâchoire du bas un peu plus longue, la fente jusque sous l'œil */
  boule(M, C.levre, X0 + .03, -.006, 0, .04, .007, .012);
  boule(M, C.levre, X0 + .026, -.013, 0, .044, .007, .013);
  boule(M, C.bouche, X0 + .035, -.0095, 0, .034, .0025, .0125, BOULE_P);
  /* la fente des ouïes, petite, devant la pectorale */
  for(const s of [-1, 1]) for(let k = 0; k < 5; k++){ const p = F.peau(.125, -.35 + k * .1, s), n = F.normale(.125, -.35 + k * .1, s);
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.001), versN(n), V(.0025, .003, .006)), c: C.dosClair}); }
  /* la petite pectorale ronde */
  for(const s of [-1, 1]){
    const p = F.peau(.14, -.2, s);
    const g = nageoireGeo(V(0, .01, 0), V(0, -.01, 0), t => { const a = Math.PI * (t - .5) * .95; return V(.008 + Math.cos(a) * .045, Math.sin(-a) * .03 - .006, 0); }, 10, .004);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .006), tourne(s * .1, s * -.4, 0), V(1, 1, 1)), x => melange(C.pecto, C.pectoBout, (x - p.x) / .05));
  }
  /* la longue nageoire : elle part du milieu du dos, fait le tour de la queue et revient dessous ; de la couleur du corps,
     le bord doré */
  const rubans = [[.36, 1], [.46, -1]];
  for(const [u0, sens] of rubans){
    const base = t => { const u = u0 + (1 - u0) * t, f = Math.max(0, (t - .8) / .2);   // au bout, les deux rubans se chevauchent un peu
      return V(xDe(u), sens * ((sens > 0 ? HAUT(u) : BAS(u)) - .004 - .005 * f * f), 0); };
    const hauteur = t => .03 * Math.min(1, t / .12) + .01 * t;
    /* au bout, le bord s'arrondit jusqu'à la pointe de la queue : les deux rubans s'y rejoignent */
    const tc = .8, bc = base(tc), xc = bc.x, ry = Math.abs(bc.y) + hauteur(tc), rx = X1 + .05 - xc;
    const bord = t => { if(t <= tc) return base(t).add(V(0, sens * hauteur(t), 0));
      const a = (t - tc) / (1 - tc) * Math.PI / 2; return V(xc + rx * Math.sin(a), sens * ry * Math.cos(a), 0); };
    nageoire(M, rubanGeo(base, bord, 90), new THREE.Matrix4(), (x, y) => melange(C.nag, C.nagBout, (Math.abs(y) - (sens > 0 ? HAUT(uDe(x)) : BAS(uDe(x))) + .004) / .03));
  }
  /* le tout ondule, comme sur l'image : droit à la tête, des vagues de plus en plus amples vers la queue */
  const g = fusionner(M), P = g.attributes.position, N = g.attributes.normal, k = Math.PI * 2 / .5;
  const A = x => .065 * Math.max(0, Math.min(1, (x + .4) / .5));
  const w = x => A(x) * Math.sin(k * (x + .2)), dw = x => (w(x + .001) - w(x - .001)) / .002;
  for(let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), d = dw(x), L = Math.sqrt(1 + d * d);
    P.setXY(i, x - y * d / L, w(x) + y / L);
    const nx = N.getX(i), ny = N.getY(i), c = 1 / L, s = d / L;      // la normale tourne avec la courbe
    N.setXY(i, nx * c - ny * s, nx * s + ny * c);
  }
  g.computeBoundingSphere();
  return anguilleGeo = g;
}
export const anguilleModele = () => modeleDe(anguilleFait());

/* ---------- La carpe koï ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici la koï »), comme une vraie koï (Nishikigoi, une carpe d'ornement ; choix
   de Yo : « A », comme la nature) : le corps de carpe, haut et plein, aux grandes écailles ; les longues nageoires qui
   flottent de la koï « papillon » (comme sur l'image) ; l'œil sombre au fin cercle doré ; deux paires de courts
   barbillons (une petite sur la lèvre du haut, une plus longue au coin de la bouche).
   Dix variétés (Yo : « J'aimerais que la koï est une dizaine de couleurs aléatoire dans le jeu » ; les dix et leur rareté
   validées par Yo : KOI_VARIETES dans donnees.js) : chacune ses vraies couleurs, ses taches et ses nageoires. */
const r4 = u => Math.sqrt(Math.min(1, u / .05 + .14));
const KOI_F = corps(-.46, .34,
  u => (.045 * u + .17 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .6)))) * r4(u) + .018,
  u => (.042 * u + .14 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .68)))) * r4(u) + .018,
  u => (.022 * u + .078 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r4(u) + .013);
const BLANC = 0xF6ECDA, ROUGE = 0xEA5416, NOIR = 0x221E1E;
/* une tache (en u le long du corps, h du ventre −1 au dos 1 ; ru, rh : ses rayons), au bord un peu ondulé, comme les vraies */
const tache = (u, h, ru, rh) => ({u, h, ru, rh});
const dans = (t, u, h, s) => { const du = (u - t.u + s * .008) / t.ru, dh = (h - t.h) / t.rh;
  return du * du + dh * dh + .18 * Math.sin(u * 47 + h * 9 + t.u * 20) + .1 * Math.sin(h * 23 - u * 11) < 1; };
/* les dix variétés : la couleur du corps (fond, puis les taches de chaque couleur) et des nageoires (base → bout) */
const KOI = {
  kohaku: {fond: BLANC, taches: [[ROUGE, [tache(.11, .85, .1, .8), tache(.37, .7, .14, 1), tache(.61, .75, .085, .85), tache(.84, .8, .055, .6)]]],
    nag: [0xF07A2A, BLANC], pecto: [0xF08A3A, BLANC]},
  tancho: {fond: BLANC, taches: [], rond: 0xE23A1A,                          // le rond rouge : une pastille posée sur la tête (koiFait)
    nag: [BLANC, 0xFAF4E8], pecto: [BLANC, 0xFAF4E8]},
  sanke: {fond: BLANC, taches: [[ROUGE, [tache(.12, .9, .09, .7), tache(.42, .75, .12, .9), tache(.7, .8, .08, .75)]],
      [NOIR, [tache(.3, .85, .03, .25), tache(.52, .55, .028, .2), tache(.6, .95, .035, .3), tache(.78, .45, .025, .2), tache(.88, .9, .03, .3), tache(.47, .98, .025, .15)]]],
    nag: [0xE8E0D0, BLANC], pecto: [0x3A3434, BLANC]},
  showa: {fond: NOIR, taches: [[BLANC, [tache(.1, -.4, .1, .7), tache(.32, -.55, .16, .55), tache(.6, -.35, .1, .7), tache(.86, .1, .06, .6), tache(.5, .5, .04, .25)]],
      [ROUGE, [tache(.13, .8, .07, .5), tache(.4, .7, .1, .55), tache(.7, .65, .07, .5)]]],
    nag: [NOIR, 0xE8DCC8], pecto: [NOIR, 0xF0E4D0]},
  shiroUtsuri: {fond: NOIR, taches: [[BLANC, [tache(.1, -.3, .1, .8), tache(.36, .15, .12, .9), tache(.38, -.8, .3, .4), tache(.68, -.05, .09, .75), tache(.9, .5, .05, .5)]]],
    nag: [NOIR, 0xE8E2D8], pecto: [NOIR, 0xF2ECE2]},
  asagi: {fond: 0xC8D8E2, dos: 0x5E7E98, rouge: 0xD8602A, nag: [0xD8602A, 0xD8E2EA], pecto: [0xD8602A, 0xE2EAF0]},
  ogon: {fond: 0xEEB436, dos: 0xD8961E, ventre: 0xF6D46A, nag: [0xE8A42A, 0xF4D070], pecto: [0xE8A42A, 0xF4D070]},
  platinum: {fond: 0xDCE2E8, dos: 0xA8B2BC, ventre: 0xF2F4F6, nag: [0xC4CCD4, 0xEEF0F2], pecto: [0xC4CCD4, 0xEEF0F2]},
  chagoi: {fond: 0x9A7040, dos: 0x6E4C26, ventre: 0xC09A62, nag: [0x7A5630, 0xA88454], pecto: [0x7A5630, 0xA88454]},
  kigoi: {fond: 0xF2D23E, dos: 0xE0B820, ventre: 0xF8E688, nag: [0xEAC836, 0xF8E68A], pecto: [0xEAC836, 0xF8E68A]}
};
/* une pastille ronde collée à la peau (le rond rouge de la Tancho : la peau de la tête est trop peu détaillée pour le
   peindre rond) : centrée en (uc, ac), ses rayons ru le long du corps et ra autour */
function pastille(M, F, uc, ac, ru, ra, c, nr = 4, nt = 20){
  const pos = [], nor = [], idx = [], o = F.peau(uc, ac, 1), n0 = F.normale(uc, ac, 1);
  pos.push(...o.addScaledVector(n0, .0016).toArray()); nor.push(...n0.toArray());
  for(let i = 1; i <= nr; i++) for(let j = 0; j < nt; j++){
    const r = i / nr, t = j / nt * Math.PI * 2, u = uc + r * ru * Math.cos(t), a = ac + r * ra * Math.sin(t), n = F.normale(u, a, 1);
    pos.push(...F.peau(u, a, 1).addScaledVector(n, .0016).toArray()); nor.push(...n.toArray());
  }
  for(let j = 0; j < nt; j++) idx.push(0, 1 + j, 1 + (j + 1) % nt);
  for(let i = 1; i < nr; i++) for(let j = 0; j < nt; j++){
    const a = 1 + (i - 1) * nt + j, b = 1 + (i - 1) * nt + (j + 1) % nt, c2 = a + nt, d = b + nt;
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  const dehors = g.index.array.slice(0, 3), A = V(...pos.slice(dehors[0] * 3, dehors[0] * 3 + 3)), B = V(...pos.slice(dehors[1] * 3, dehors[1] * 3 + 3)), C2 = V(...pos.slice(dehors[2] * 3, dehors[2] * 3 + 3));
  if(B.sub(A).cross(C2.sub(A)).dot(n0) < 0){ const ix = g.index.array; for(let k = 0; k < ix.length; k += 3){ const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } }   // tournée vers le dehors
  M.push({geo: g, m: new THREE.Matrix4(), c});
}
const koiGeos = {};
function koiFait(v){
  if(koiGeos[v]) return koiGeos[v];
  const K = KOI[v], F = KOI_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* la couleur du corps : le fond (plus sombre au dos, plus clair au ventre pour les unies), puis les taches */
  const couleurCorps = (x, y, z) => {
    const u = uDe(x), h = F.h(x, y), s = z >= 0 ? 1 : -1;
    if(v === "asagi"){                                            // dos bleu-gris en filet (le bord des écailles), joues et ventre rouge orangé
      let c = h > .1 ? melange(K.fond, K.dos, (h - .1) / .4) : new THREE.Color(K.fond);
      if(h < -.45 || u < .27 && h < .05) c = melange(c, K.rouge, Math.min(1, h < -.45 ? (-.45 - h) / .15 : (.05 - h) / .15));
      return c; }
    if(K.dos) return h > 0 ? melange(K.fond, K.dos, h * 1.2) : melange(K.fond, K.ventre, -h * 1.3);
    let c = new THREE.Color(K.fond);
    for(const [coul, liste] of K.taches) if(liste.some(t => dans(t, u, h, s))) c = new THREE.Color(coul);
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, nu: 11, na: 9, taille: .043, relief: .0028, geo: ECAILLE_GRANDE});
  const tete = (x, y, z) => couleurCorps(x, y, z);
  opercule(M, F, 0xFFFFFF, .26, .05);
  for(let i = M.length - 36; i < M.length; i++){ const m = M[i]; m.couleur = (x, y, z) => couleurCorps(x, y, z).multiplyScalar(.9); }   // l'opercule : la couleur de la tête, un peu plus sombre
  oeil(M, F, {u: .13, a: .36, r: .034, iris: 0x2A2016, cercle: 0xC8A040, narine: 0x5A4A3A});
  if(K.rond) pastille(M, F, .16, Math.PI / 2, .075, .62, K.rond);
  /* les lèvres épaisses, de la couleur de la tête ; les deux paires de courts barbillons */
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X0 + .012, -.004, 0), q0, V(.028, .017, .04)), c: 0xFFFFFF, couleur: tete});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X0 + .01, -.03, 0), q0, V(.026, .015, .038)), c: 0xFFFFFF, couleur: tete});
  boule(M, 0x6A4A3A, X0 - .006, -.017, 0, .011, .006, .03, BOULE_P);
  const barb = new THREE.Color(K.fond).multiplyScalar(.92).getHex();          // les barbillons, de la couleur du fond
  for(const s of [-1, 1]){
    const a = V(X0 + .03, -.03, s * .03), b = V(X0 + .014, -.068, s * .036);
    baton(M, barb, a, b, .0055); boule(M, barb, b.x, b.y, b.z, .006, .006, .006, BOULE_P);
    const c = V(X0 + .006, -.006, s * .022), d = V(X0 - .002, -.026, s * .025);
    baton(M, barb, c, d, .0045); boule(M, barb, d.x, d.y, d.z, .005, .005, .005, BOULE_P);
  }
  const fin = ([a, b]) => d => melange(a, b, Math.pow(Math.max(0, d), .7));
  const nag = fin(K.nag), pecto = fin(K.pecto);
  /* la longue nageoire du dos, qui flotte vers l'arrière, le bord en festons */
  const d0 = -.12, d1 = .22, y0 = HAUT(uDe(d0)) - .014, y1 = HAUT(uDe(d1)) - .012;
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t);
      return V(b.x + .08 + t * .1, b.y + .15 - .02 * t - .022 * Math.abs(Math.sin(t * Math.PI * 3.5)) - .07 * Math.pow(t, 5), 0); }, 26),
    new THREE.Matrix4(), (x, y) => nag((y - y0) / .17));
  /* la grande queue qui flotte, à peine fourchue, aux lobes arrondis */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .05, 0), V(qx, -.05, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .62, long = .17 + .11 * Math.sin(Math.PI / 2 * Math.pow(lobe, .8)) - .09 * Math.pow(lobe, 4);
      return V(qx + long, y * (.8 + .2 * lobe), 0); }, 26),
    new THREE.Matrix4(), x => nag((x - qx) / .32));
  /* l'anale */
  const anX = .2, anY = -BAS(uDe(anX)) + .012;
  nageoire(M, nageoireGeo(V(anX - .06, anY, 0), V(anX + .06, anY + .02, 0), t => { const a = Math.PI * (.1 + t * .8);
      return V(anX + .03 - Math.cos(a) * .09, anY - Math.sin(a) * .13, 0); }, 12),
    new THREE.Matrix4(), (x, y) => nag((anY - y) / .13));
  /* les ventrales : grandes et rondes */
  const peX = -.04;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => { const a = Math.PI * (.1 + t * .8); return V(.04 - Math.cos(a) * .09, -Math.sin(a) * .15, 0); }, 12);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => pecto((pY - y) / .15));
  }
  /* les pectorales : grandes et rondes, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.33, -.55, s);
    const g = nageoireGeo(V(0, .024, 0), V(0, -.024, 0), t => { const a = Math.PI * (t - .5) * .95; return V(.03 + Math.cos(a) * .15, Math.sin(-a) * .08 - .03, 0); }, 12);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => pecto((x - p.x) / .17));
  }
  return koiGeos[v] = fusionner(M);
}
export const KOI_COULEURS = Object.keys(KOI);
export const koiModele = (v = "kohaku") => modeleDe(koiFait(KOI[v] ? v : "kohaku"));

/* ---------- La Vieille Carpe d'or ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici la carpe d'or »), le poisson légendaire de l'étang, très ancien (choix
   de Yo : « B », comme son image : la vieille sage de l'étang) : un corps de carpe tout en or, de grandes écailles qui
   brillent ; de longues nageoires qui flottent, au bord ondulé, orange doré à la base, crème au bout ; une longue moustache
   bouclée (deux paires de longs barbillons) et des sourcils blancs broussailleux sur une paupière lourde ; l'œil brun
   orangé ; les lèvres épaisses. Elle luit doucement, comme les légendaires du jeu (une lueur dorée : la même matière jouet,
   rien de nouveau à compiler). */
const CARPE_OR_F = corps(-.52, .36,                       // plus longue qu'une carpe, le pédoncule long (comme l'image)
  u => (.035 * u + .14 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r3(u) + .016,
  u => (.035 * u + .115 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .65)))) * r3(u) + .016,
  u => (.02 * u + .074 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r3(u) + .012);
const OR = {dos: 0xAE620A, dosOr: 0xD48A12, flanc: 0xE8A820, ventre: 0xF2C64E, tete: 0xCC8414, joue: 0xE8AE36,
  levre: 0xE2A230, bouche: 0x7A4A10, iris: 0xB8521A, cercle: 0x6A3A0E, paupiere: 0xD08C16, sourcil: 0xF8F0D8,
  barbillon: 0xF0CC66, nag: 0xD8700A, nagBout: 0xF6DC9C};
let carpeOrGeo = null;
function carpeOrFait(){
  if(carpeOrGeo) return carpeOrGeo;
  const C = OR, F = CARPE_OR_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .4 ? melange(C.dosOr, C.dos, (h - .4) / .55) : h > -.2 ? melange(C.flanc, C.dosOr, (h + .2) / .6) : melange(C.flanc, C.ventre, (-.2 - h) / .5);
    if(u < .27) c = melange(c, h > -.2 ? C.tete : C.joue, Math.min(1, (.27 - u) / .1));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .28, nu: 10, na: 8, taille: .048, relief: .0042, geo: ECAILLE_GRANDE});
  opercule(M, F, C.dos, .26, .05);
  oeil(M, F, {u: .14, a: .42, r: .03, iris: C.iris, cercle: C.cercle, narine: C.dos, uNarine: .06, aNarine: .5});
  /* la paupière lourde, et les sourcils blancs broussailleux qui partent vers l'arrière */
  for(const s of [-1, 1]){
    const o = F.peau(.14, .42, s), n = F.normale(.14, .42, s);
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.004).add(V(.002, .016, 0)), versN(n), V(.036, .016, .02)), c: C.paupiere});
    for(let k = 0; k < 8; k++){
      const t = k / 7, b = F.peau(.11 + t * .07, .62 + Math.sin(t * Math.PI) * .06, s), nb = F.normale(.11 + t * .07, .62 + Math.sin(t * Math.PI) * .06, s);
      const bout = b.clone().addScaledVector(nb, .02 + .012 * Math.sin(t * Math.PI)).add(V(.045 + t * .03, .016 + .012 * t, 0));
      ovale(M, C.sourcil, b, bout, .009, .007);
    }
  }
  /* les lèvres épaisses */
  boule(M, C.levre, X0 + .012, -.004, 0, .03, .019, .042);
  boule(M, C.levre, X0 + .01, -.032, 0, .028, .017, .04);
  boule(M, C.bouche, X0 - .007, -.018, 0, .011, .006, .032, BOULE_P);
  /* la longue moustache bouclée : deux paires de longs barbillons qui pendent et finissent en boucle */
  const moustache = (a, chute, avance, boucle, r0, s) => {
    const pts = [];
    for(let i = 0; i <= 10; i++){ const t = i / 10; pts.push(a.clone().add(V(-avance * Math.sin(t * Math.PI * .75), -chute * Math.pow(t, 1.2), s * .01 * t))); }
    const fin = pts[pts.length - 1], c = fin.clone().add(V(boucle, 0, 0));
    for(let i = 1; i <= 8; i++){ const th = Math.PI + i / 8 * Math.PI * 1.3; pts.push(c.clone().add(V(Math.cos(th) * boucle, Math.sin(th) * boucle * .9, 0))); }
    for(let i = 0; i < pts.length - 1; i++) baton(M, C.barbillon, pts[i], pts[i + 1].clone().add(pts[i + 1].clone().sub(pts[i]).multiplyScalar(.15)), r0 * (1 - i / pts.length * .5));
    const b = pts[pts.length - 1]; boule(M, C.barbillon, b.x, b.y, b.z, r0 * .6, r0 * .6, r0 * .6, BOULE_P);
  };
  for(const s of [-1, 1]){
    moustache(V(X0 + .03, -.032, s * .036), .21, .045, .03, .0095, s);                // au coin de la bouche, la plus longue
    moustache(V(X0 + .006, -.008, s * .026), .15, .065, .024, .0075, s);               // sur la lèvre du haut
  }
  const nag = d => melange(C.nag, C.nagBout, Math.pow(Math.max(0, d), .8));
  const onde = (t, n, a) => a * Math.sin(t * Math.PI * n);
  /* la longue nageoire du dos, qui flotte vers l'arrière, le bord ondulé */
  const d0 = -.14, d1 = .24, y0 = HAUT(uDe(d0)) - .014, y1 = HAUT(uDe(d1)) - .012;
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t);
      return V(b.x + .09 + t * .12, b.y + .13 - .02 * t + onde(t, 3, .018) - .06 * Math.pow(t, 5), 0); }, 28),
    new THREE.Matrix4(), (x, y) => nag((y - y0) / .16));
  /* la grande queue qui flotte, les lobes recourbés au bout */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .05, 0), V(qx, -.05, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .6, long = .16 + .14 * Math.sin(Math.PI / 2 * Math.pow(lobe, .8)) - .05 * Math.pow(lobe, 5);
      return V(qx + long + onde(lobe, 2, .012), y * (.8 + .2 * lobe), 0); }, 28),
    new THREE.Matrix4(), x => nag((x - qx) / .3));
  /* l'anale, longue et pendante */
  const anX = .19, anY = -BAS(uDe(anX)) + .012;
  nageoire(M, nageoireGeo(V(anX - .06, anY, 0), V(anX + .06, anY + .02, 0), t => V(anX + .02 + t * .14 + onde(t, 2, .01), anY - .15 + t * .11, 0), 14),
    new THREE.Matrix4(), (x, y) => nag((anY - y) / .15));
  /* les ventrales et les pectorales : longues, qui flottent vers l'arrière */
  const peX = -.05;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => { const a = Math.PI * (.1 + t * .8); return V(.07 - Math.cos(a) * .11 + onde(t, 2, .008), -Math.sin(a) * .16, 0); }, 12);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => nag((pY - y) / .17));
  }
  for(const s of [-1, 1]){
    const p = F.peau(.32, -.55, s);
    const g = nageoireGeo(V(0, .026, 0), V(0, -.026, 0), t => { const a = Math.PI * (t - .5) * .95; return V(.05 + Math.cos(a) * .17 + onde(t, 2, .01), Math.sin(-a) * .09 - .04, 0); }, 12);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => nag((x - p.x) / .2));
  }
  return carpeOrGeo = fusionner(M);
}
/* elle luit doucement, comme les légendaires du jeu : la même matière jouet aux couleurs par sommet, sa lueur en plus */
export const carpeOrModele = () => { const g = modeleDe(carpeOrFait()); g.children[0].material.emissive.setHex(0x2E1E00); return g; };

/* Les poissons refaits d'après les images de Yo (peche.js, icones.js) : fabrique() rend le modèle ; echelle le met à la taille
   des anciens poissons */
export const MODELES_POISSONS = {gardon: {fabrique: gardonModele, echelle: 1}, perche: {fabrique: percheModele, echelle: 1},
  tanche: {fabrique: tancheModele, echelle: 1}, carpe: {fabrique: carpeModele, echelle: 1},
  brochet: {fabrique: brochetModele, echelle: 1},
  anguille: {fabrique: anguilleModele, echelle: 1},
  carpeOr: {fabrique: carpeOrModele, echelle: 1},
  koi: {fabrique: koiModele, echelle: 1, couleurs: KOI_COULEURS},   // fabrique(couleur) : une des dix variétés (Kohaku si rien)
  ecrevisse: {fabrique: ecrevisseModele, echelle: 1.35}};   // l'écrevisse, petite (8 à 15 cm) : un peu plus grande en main, pour bien la voir
