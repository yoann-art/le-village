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

/* ---------- Le Vieux Silure ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le silure »), le poisson légendaire de l'étang, « le plus vieux poisson de
   l'île » (choix de Yo : « B », comme son image ; Claude avait signalé ce qui s'écarte d'un vrai silure glane : ses
   nageoires du dos et du dessous, ses barbillons du menton, sa queue, son œil) : l'énorme tête large et plate, la grande
   bouche aux lèvres épaisses ; deux très longs barbillons sur la mâchoire du haut, une rangée de barbillons courts sous le
   menton ; la peau sans écailles, marbrée d'olive sombre et de taches fauves, le ventre crème ; de la mousse verte sur le
   dos, des cicatrices pâles sur le flanc, des verrues sur la tête, un sourcil plissé au-dessus du petit œil orange ; une
   grande nageoire sur le dos et une seconde près de la queue, des nageoires dessous, la queue fourchue aux lobes ronds,
   les nageoires brun-gris au bord fauve. Il luit doucement, comme la Vieille Carpe d'or. */
const SILURE_F = corps(-.56, .36,
  courbe([[0, .045], [.04, .075], [.1, .098], [.2, .118], [.32, .128], [.5, .128], [.7, .112], [.85, .094], [1, .07]]),
  courbe([[0, .045], [.04, .072], [.1, .094], [.2, .114], [.32, .124], [.5, .124], [.7, .108], [.85, .09], [1, .066]]),
  courbe([[0, .07], [.04, .1], [.1, .124], [.2, .134], [.32, .126], [.5, .106], [.7, .08], [.85, .06], [1, .04]]));
const SILURE = {olive: 0x363C22, oliveClair: 0x4E5430, fauve: 0x9A8450, ventre: 0xC8AA70, mousse: 0x6A7426, cicatrice: 0xC8AE7A,
  levre: 0xB08C5A, levreDessous: 0xC8A46A, bouche: 0x3A2618, iris: 0xE07A12, cercle: 0x3A2A12, sourcil: 0xB09460,
  verrue: 0x5E5A34, barbeHaut: 0x7E6444, barbe: 0xD0B070, nag: 0x4A3C2C, nagBout: 0xB8874E};
let silureGeo = null;
function silureFait(){
  if(silureGeo) return silureGeo;
  const C = SILURE, F = SILURE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* la peau marbrée : olive sombre au dos, des taches fauves aux flancs, le ventre crème ; la mousse sur le dos */
  const bruit = (x, y, z) => Math.sin(x * 47 + z * 13) * Math.sin(y * 39 + x * 19) + .5 * Math.sin(x * 83 - y * 61 + z * 29);
  const couleurCorps = (x, y, z) => {
    const u = uDe(x), h = F.h(x, y), n = bruit(x, y, z);
    let c = h > .2 ? melange(C.oliveClair, C.olive, (h - .2) / .6) : h > -.45 ? melange(C.fauve, C.oliveClair, (h + .45) / .65) : melange(C.fauve, C.ventre, (-.45 - h) / .35);
    if(h > -.55 && h < .7 && n > .4) c = melange(c, C.fauve, Math.min(1, (n - .4) / .2) * .8);       // les taches fauves
    if(h > -.3 && n < -.8) c = melange(c, C.olive, .7);                                                  // les taches sombres
    const m = Math.sin(x * 29 + z * 11) + .7 * Math.sin(x * 61 + z * 37 + y * 13);
    if(h > .7 && m > .75 && u > .08 && u < .8) c = melange(c, C.mousse, Math.min(1, (m - .75) / .3) * .85);         // la mousse
    return c;
  };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, LARGE, 84, 36), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .1))});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X1, 0, 0), q0, V(.03, HAUT(1) * .9, LARGE(1) * .9)), c: 0xFFFFFF, couleur: couleurCorps});
  /* les cicatrices pâles sur le flanc */
  for(const s of [-1, 1]) for(const [u0, u1, a0, a1] of [[.36, .46, .55, .7], [.55, .7, .1, .12], [.74, .8, .08, .1]]){
    const a = F.peau(u0, a0, s), b = F.peau(u1, a1, s), n = F.normale((u0 + u1) / 2, (a0 + a1) / 2, s);
    ovale(M, C.cicatrice, a.addScaledVector(n, .001), b.addScaledVector(n, .001), .008, .004);
  }
  /* les verrues de la tête */
  for(const s of [-1, 1]) for(const [u, a, r] of [[.1, .9, .012], [.16, .8, .01], [.07, .7, .008], [.2, .95, .009], [.13, 1.1, .007]]){
    const p = F.peau(u, a, s); boule(M, C.verrue, p.x, p.y, p.z, r, r * .7, r, BOULE_P); }
  opercule(M, F, C.olive, .25, .05);                                              // le bord des ouïes
  /* le petit œil orange et son sourcil plissé */
  oeil(M, F, {u: .13, a: .5, r: .018, iris: C.iris, cercle: C.cercle, narine: C.verrue, uNarine: .05, aNarine: .8});
  for(const s of [-1, 1]) for(let k = 0; k < 4; k++){
    const t = k / 3, a = F.peau(.095 + t * .07, .66 + .03 * Math.sin(t * Math.PI), s), b = a.clone().add(V(.03, .006 - .004 * t, s * .004));
    ovale(M, C.sourcil, a, b, .007 - t * .001, .006);
  }
  /* la grande bouche aux lèvres épaisses, entrouverte */
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X0 + .045, -.006, 0), q0, V(.06, .026, .1)), c: C.levre});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X0 + .04, -.06, 0), q0, V(.058, .026, .096)), c: C.levreDessous});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X0 + .045, -.033, 0), q0, V(.05, .016, .085)), c: C.bouche});
  /* un barbillon : des bâtons fins le long d'une courbe, plus fins au bout */
  const barbillon = (pts, r0, c) => { for(let i = 0; i < pts.length - 1; i++) baton(M, c, pts[i], pts[i + 1].clone().add(pts[i + 1].clone().sub(pts[i]).multiplyScalar(.12)), r0 * (1 - i / pts.length * .6)); };
  for(const s of [-1, 1]){
    /* les deux très longs : l'un se relève par-dessus la tête et retombe devant, l'autre pend et part vers l'arrière */
    const o = V(X0 + .06, -.006, s * .1);
    const p1 = [], p2 = [];
    for(let i = 0; i <= 14; i++){ const t = i / 14;
      p1.push(o.clone().add(V(-.1 * Math.sin(t * Math.PI * .9) + .12 * t * t, .11 * Math.sin(t * Math.PI * .85) - .06 * t * t, s * .04 * t)));
      p2.push(o.clone().add(V(.02 + .5 * t, -.06 - .2 * Math.sin(t * Math.PI * .55) + .02 * t, s * (.03 + .08 * t)))); }
    barbillon(s > 0 ? p1 : p2, .008, C.barbeHaut);
    barbillon(s > 0 ? p2 : p1, .008, C.barbeHaut);
    /* la rangée de barbillons courts sous le menton, qui pendent et se recourbent */
    for(let k = 0; k < 4; k++){
      const z = s * (.02 + k * .026), x = X0 + .035 + k * .035, a = V(x, -.08, z), pts = [];
      const l = .07 + .03 * Math.sin(k * 1.7), avance = .02 + .01 * k;
      for(let i = 0; i <= 6; i++){ const t = i / 6; pts.push(a.clone().add(V(-avance * Math.sin(t * Math.PI * .8), -l * t, s * .01 * t))); }
      barbillon(pts, .0045, C.barbe);
    }
  }
  const nag = d => melange(C.nag, C.nagBout, Math.pow(Math.max(0, d), .9));
  /* la grande nageoire du dos, ronde, et la seconde près de la queue */
  for(const [d0, d1, hh] of [[-.06, .1, .12], [.18, .3, .07]]){
    const y0 = HAUT(uDe(d0)) - .012, y1 = HAUT(uDe(d1)) - .012;
    nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), t => { const a = Math.PI * (.06 + t * .88);
        return V((d0 + d1) / 2 + .05 - Math.cos(a) * (d1 - d0) * .6, (y0 + y1) / 2 + Math.sin(a) * hh * (1 - t * .3), 0); }, 14),
      new THREE.Matrix4(), (x, y) => nag((y - y0) / hh));
  }
  /* les nageoires du dessous : une près du ventre, une longue vers la queue */
  for(const [a0, a1, hh] of [[.06, .14, .07], [.17, .32, .07]]){
    const y0 = -BAS(uDe(a0)) + .012, y1 = -BAS(uDe(a1)) + .012;
    nageoire(M, nageoireGeo(V(a0, y0, 0), V(a1, y1, 0), t => { const a = Math.PI * (.06 + t * .88);
        return V((a0 + a1) / 2 + .04 - Math.cos(a) * (a1 - a0) * .6, (y0 + y1) / 2 - Math.sin(a) * hh * (1 - t * .3), 0); }, 12),
      new THREE.Matrix4(), (x, y) => nag((y0 - y) / hh));
  }
  /* la queue fourchue aux lobes ronds */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .055, 0), V(qx, -.055, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .44, long = .1 + .1 * Math.sin(Math.PI / 2 * Math.pow(lobe, .7)) - .05 * Math.pow(lobe, 5);
      return V(qx + long, y * (.8 + .2 * lobe), 0); }, 24),
    new THREE.Matrix4(), x => nag((x - qx) / .2));
  /* les ventrales, petites */
  const peX = -.02;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.04, 0, 0), V(.02, 0, 0), t => { const a = Math.PI * (.1 + t * .8); return V(.03 - Math.cos(a) * .06, -Math.sin(a) * .08, 0); }, 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => nag((pY - y) / .08));
  }
  /* les grosses pectorales arrondies, basses, derrière la tête */
  for(const s of [-1, 1]){
    const p = F.peau(.3, -.55, s);
    const g = nageoireGeo(V(0, .026, 0), V(0, -.026, 0), t => { const a = Math.PI * (t - .5) * .95; return V(.03 + Math.cos(a) * .14, Math.sin(-a) * .08 - .04, 0); }, 12);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => nag((x - p.x) / .17));
  }
  return silureGeo = fusionner(M);
}
export const silureModele = () => { const g = modeleDe(silureFait()); g.children[0].material.emissive.setHex(0x140E04); return g; };

/* ---------- Le rouget ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le rouget »), comme un vrai rouget de roche (le surmulet, Mullus
   surmuletus ; choix de Yo : « A », comme la nature) : le corps allongé, le front très pentu jusqu'à l'œil, haut placé et
   doré cerclé de rouge ; la petite bouche aux lèvres fines sous le museau ; deux longs barbillons fins et souples, blanc-jaune,
   sous le menton. Le dos rouge, les flancs rouge-rose barrés d'une bande rouge sombre depuis l'œil et de fines lignes jaunes
   de la tête à la queue, le ventre blanc crème ; de grandes écailles. Deux nageoires du dos bien séparées : la première,
   épineuse, pâle et rayée de bandes sombres ; la seconde petite, rose pâle. La queue fourchue rose-rouge ; les autres
   nageoires pâles, rose clair à jaunâtre. */
const ROUGET_F = corps(-.48, .36,
  courbe([[0, .028], [.035, .074], [.09, .114], [.17, .138], [.3, .15], [.45, .146], [.6, .13], [.75, .102], [.88, .074], [1, .052]]),
  courbe([[0, .016], [.05, .04], [.12, .07], [.22, .1], [.35, .116], [.5, .114], [.65, .098], [.8, .074], [.92, .054], [1, .044]]),
  courbe([[0, .02], [.06, .038], [.15, .054], [.3, .064], [.45, .064], [.6, .056], [.75, .045], [.9, .033], [1, .024]]));
const ROUGET = {dos: 0xB0302A, flanc: 0xDE5C50, flancClair: 0xF09A88, ventre: 0xF6E8DA, bande: 0xA02C26, jaune: 0xF2C24A,
  tete: 0xC8443A, joue: 0xF0B4A0, opercule: 0xB83A30, iris: 0xE8A632, cercle: 0xC0361E, levre: 0xF0C8B4, bouche: 0x9A4A3E,
  barbillon: 0xF4E8C6, pale: 0xF4D8C4, raie: 0x9A4630, epine: 0xF0DCC8, rose: 0xF2B6A4, queue: 0xE0605A, queueBout: 0xC8443C,
  jaunatre: 0xF4DEB0};
let rougetGeo = null;
function rougetFait(){
  if(rougetGeo) return rougetGeo;
  const C = ROUGET, F = ROUGET_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : rouge au dos, rouge-rose aux flancs, blanc crème au ventre ; la bande rouge sombre de l'œil à la queue ; les
     fines lignes jaunes dessous ; la tête lisse, la joue rose clair */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .4 ? melange(C.flanc, C.dos, (h - .4) / .5) : h > -.3 ? melange(C.flancClair, C.flanc, (h + .3) / .7) : melange(C.flancClair, C.ventre, (-.3 - h) / .35);
    const ligne = (h0, l, coul, f) => { const d = Math.abs(h - h0 - (u - .5) * .08); if(d < l) c = melange(c, coul, f * Math.min(1, (l - d) / (l * .45))); };
    if(u > .14){ const entre = Math.min(1, (u - .14) / .1);
      ligne(.46, .08, C.bande, .9 * entre);
      for(const h0 of [.22, -.02, -.24]) ligne(h0, .035, C.jaune, .95 * entre * Math.min(1, (1.02 - u) / .15)); }
    if(u < .27) c = melange(c, h > 0 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .3, u1: .97, nu: 12, na: 9, taille: .047, relief: .0045, geo: ECAILLE_GRANDE});
  opercule(M, F, C.opercule, .27, .045);
  oeil(M, F, {u: .15, a: .68, r: .036, iris: C.iris, cercle: C.cercle, narine: 0x8A2A22, uNarine: .07, aNarine: .75});
  /* la petite bouche aux lèvres fines, sous le museau */
  boule(M, C.levre, X0 + .008, -.006, 0, .014, .007, .018);
  boule(M, C.bouche, X0 + .002, -.011, 0, .008, .003, .014, BOULE_P);
  /* les deux longs barbillons fins sous le menton : ils pendent un peu vers l'avant, souples, plus fins au bout */
  for(const s of [-1, 1]){
    const pts = [V(X0 + .04, -.03, s * .012), V(X0 + .032, -.06, s * .016), V(X0 + .022, -.09, s * .019), V(X0 + .018, -.118, s * .02), V(X0 + .024, -.142, s * .02)];
    for(let i = 0; i < pts.length - 1; i++) baton(M, C.barbillon, pts[i], pts[i + 1].clone().add(pts[i + 1].clone().sub(pts[i]).multiplyScalar(.12)), .0042 * (1 - i * .15));
    const b = pts[pts.length - 1]; boule(M, C.barbillon, b.x, b.y, b.z, .0034, .0034, .0034, BOULE_P);
  }
  /* la première nageoire du dos : haute, triangulaire, épineuse ; pâle, rayée de bandes sombres, le bout sombre */
  const d0 = -.13, d1 = .0, y0 = HAUT(uDe(d0)) - .01, y1 = HAUT(uDe(d1)) - .01, hD = .15;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t); return V(b.x + .05 + t * .03, b.y + .02 + hD * Math.pow(Math.sin(Math.PI * Math.min(1, t * .9 + .1)), .8) * (1 - t * .35), 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 14), new THREE.Matrix4(), (x, y) => {
    const f = (y - y0) / hD;
    return (f > .3 && f < .42) || (f > .62 && f < .74) || f > .9 ? C.raie : C.pale; });
  for(let k = 0; k <= 7; k++){ const t = k / 7, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t), bout = e.clone().add(e.clone().sub(b).multiplyScalar(.06));
    baton(M, C.epine, b, bout, .003); }
  /* la seconde nageoire du dos : petite, rose pâle */
  const m0 = .13, m1 = .23, ym0 = HAUT(uDe(m0)) - .008, ym1 = HAUT(uDe(m1)) - .008;
  nageoire(M, nageoireGeo(V(m0, ym0, 0), V(m1, ym1, 0), t => V(m0 + .03 + t * .12, ym0 + .085 - t * .07, 0), 10),
    new THREE.Matrix4(), (x, y) => melange(C.rose, C.pale, (y - ym0) / .09));
  /* la queue fourchue : rose-rouge, plus sombre au bord des lobes */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .04, 0), V(qx, -.04, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .3, fourche = .06 + .13 * Math.pow(lobe, .9);
      return V(qx + fourche + .03, y * (.8 + .2 * lobe), 0); }, 22),
    new THREE.Matrix4(), (x, y) => melange(C.queue, C.queueBout, (x - qx) / .26 + Math.abs(y) * 2));
  /* l'anale : sous la seconde nageoire du dos, pâle */
  const anX = .17, anY = -BAS(uDe(anX)) + .008;
  nageoire(M, nageoireGeo(V(anX - .06, anY, 0), V(anX + .05, anY + .01, 0), t => V(anX - .025 + t * .11, anY - .08 + t * .06, 0), 10),
    new THREE.Matrix4(), (x, y) => melange(C.jaunatre, C.pale, (anY - y) / .08));
  /* les ventrales : sous la poitrine, pâles, jaunâtres */
  const peX = -.2;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .014, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.04, 0, 0), V(.03, 0, 0), t => V(-.005 + t * .1, -.1 + t * .07, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.jaunatre, C.pale, (pY - y) / .09));
  }
  /* les pectorales : rose clair, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.31, -.35, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.15 - Math.abs(t - .35) * .09, -.06 + t * .05, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.rose, C.pale, (x - p.x) / .15));
  }
  return rougetGeo = fusionner(M);
}
export const rougetModele = () => modeleDe(rougetFait());

/* ---------- Le merlan ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le merlan »), comme un vrai merlan (Merlangius merlangus ; choix de Yo :
   « A », comme la nature) : le corps long et fin, la tête pointue ; le dos olive-sable, les flancs argentés, le ventre blanc,
   la ligne latérale fine et dorée ; de petites écailles. L'œil argenté à la prunelle noire ; les lèvres fines, la mâchoire du
   haut un peu plus longue ; pas de barbillon. Sa marque : la petite tache noire à la base de la nageoire de côté. Trois
   nageoires sur le dos, deux dessous (la première longue, sous la première du dos) ; les ventrales sous la gorge, devant les
   pectorales (comme toute la famille de la morue) ; la queue presque droite ; les nageoires pâles, gris-beige, plus foncées
   au bord. */
const MERLAN_F = corps(-.5, .38,
  courbe([[0, .02], [.05, .05], [.14, .086], [.28, .11], [.42, .116], [.58, .106], [.72, .084], [.86, .058], [1, .036]]),
  courbe([[0, .014], [.05, .036], [.14, .066], [.28, .09], [.42, .096], [.58, .086], [.72, .068], [.86, .047], [1, .032]]),
  courbe([[0, .012], [.06, .024], [.15, .038], [.28, .048], [.42, .05], [.58, .046], [.72, .037], [.86, .027], [1, .019]]));
const MERLAN = {dos: 0x76744A, dosClair: 0x9C9A68, flanc: 0xBCC2C4, ventre: 0xF0F2F0, ligne: 0xB4A464, tete: 0x86845A,
  joue: 0xD6D8D4, opercule: 0xA8A88E, iris: 0xB4BAB8, cercle: 0x6E705C, levre: 0xE2DCCC, bouche: 0x8A6A5A, tache: 0x1A1A16,
  nag: 0xD8CEB6, nagBord: 0xA49880};
let merlanGeo = null;
function merlanFait(){
  if(merlanGeo) return merlanGeo;
  const C = MERLAN, F = MERLAN_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : olive-sable au dos, argenté aux flancs, blanc au ventre ; la ligne latérale fine et dorée, qui s'abaisse vers
     la queue ; la tête lisse */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .62 ? melange(C.dosClair, C.dos, (h - .62) / .3) : h > .3 ? melange(C.flanc, C.dosClair, (h - .3) / .32) : melange(C.flanc, C.ventre, (.3 - h) / .9);
    const d = Math.abs(h - (.5 - .22 * Math.max(0, u - .4)));
    if(u > .26 && d < .05) c = melange(c, C.ligne, .8 * (1 - d / .05));
    if(u < .27) c = melange(c, h > .1 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 16, na: 10, taille: .03, relief: .0011});
  opercule(M, F, C.opercule, .26, .05);
  oeil(M, F, {u: .15, a: .42, r: .034, iris: C.iris, cercle: C.cercle, narine: 0x5A5A3A, uNarine: .07, aNarine: .6});
  /* les lèvres fines, la mâchoire du haut un peu plus longue que celle du bas ; la fente de la bouche */
  ovale(M, C.levre, V(X0 - .004, -.001, 0), V(X0 + .08, -.004, 0), .016, .006);
  ovale(M, C.levre, V(X0 + .012, -.013, 0), V(X0 + .08, -.012, 0), .013, .005);
  ovale(M, C.bouche, V(X0 + .002, -.007, 0), V(X0 + .075, -.008, 0), .012, .003);
  const couleurNag = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 2.2));
  /* une nageoire du dos ou de dessous, de xa à xb, de hauteur h (sens : 1 en haut, −1 en bas), penchée vers l'arrière */
  const nag = (xa, xb, h, sens, n = 12) => {
    const ya = sens > 0 ? HAUT(uDe(xa)) - .008 : -BAS(uDe(xa)) + .008, yb = sens > 0 ? HAUT(uDe(xb)) - .008 : -BAS(uDe(xb)) + .008;
    nageoire(M, nageoireGeo(V(xa, ya, 0), V(xb, yb, 0), t => { const b = V(xa, ya, 0).lerp(V(xb, yb, 0), t);
      const f = t < .12 ? .25 + .75 * t / .12 : 1 - .82 * (t - .12) / .88;   // le bord avant raide, le haut pointu, puis droit jusqu'à l'arrière
      return V(b.x + .02 + .05 * f + t * .015, b.y + sens * (.008 + h * f), 0); }, n),
      new THREE.Matrix4(), couleurNag(ya, sens, h));
  };
  /* trois nageoires sur le dos, la première la plus haute */
  nag(-.19, -.05, .14, 1);
  nag(-.02, .14, .11, 1, 14);
  nag(.17, .28, .09, 1);
  /* deux dessous : la première longue, qui commence sous la première du dos ; la seconde en face de la troisième du dos */
  nag(-.1, .13, .085, -1, 16);
  nag(.17, .28, .08, -1);
  /* la queue presque droite, à peine échancrée */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .034, 0), V(qx, -.034, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .38;
      return V(qx + .12 + .05 * lobe, y * (.8 + .2 * lobe), 0); }, 20),
    new THREE.Matrix4(), x => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (x - qx) / .14), 2)));
  /* les ventrales : sous la gorge, devant les pectorales, petites et pointues */
  const peX = -.31;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .01, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.025, 0, 0), V(.02, 0, 0), t => V(.01 + t * .06, -.085 + t * .065, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .1));
  }
  /* les pectorales, derrière l'opercule ; la petite tache noire à leur base (la marque du merlan) */
  for(const s of [-1, 1]){
    const p = F.peau(.3, -.1, s), n = F.normale(.3, -.1, s);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, -.001), versN(n), V(.011, .003, .014)), c: C.tache});
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.19 - Math.abs(t - .3) * .12, -.06 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x + .006, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .2));
  }
  return merlanGeo = fusionner(M);
}
export const merlanModele = () => modeleDe(merlanFait());

/* ---------- Le bar ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le bar »), comme un vrai bar (le loup de mer, Dicentrarchus labrax ;
   choix de Yo : « A », comme la nature) : le corps allongé et puissant, le dos gris-bleu, les flancs argentés, le ventre
   blanc ; des écailles bien visibles, la ligne latérale fine et sombre. La grande bouche aux lèvres fines, la mâchoire du bas
   un peu en avant ; l'œil argenté à jaune pâle ; sa marque : la tache sombre en haut de l'opercule, avec deux petites
   pointes plates au bord. Deux nageoires du dos bien séparées, la première épineuse ; la queue un peu fourchue ; toutes les
   nageoires gris argenté, plus foncées au bout. */
const BAR_F = corps(-.48, .36,
  courbe([[0, .024], [.05, .056], [.14, .1], [.28, .136], [.42, .142], [.58, .124], [.72, .094], [.86, .064], [1, .043]]),
  courbe([[0, .018], [.05, .042], [.14, .08], [.28, .11], [.42, .113], [.58, .098], [.72, .074], [.86, .052], [1, .038]]),
  courbe([[0, .02], [.06, .038], [.15, .056], [.3, .066], [.45, .066], [.6, .057], [.75, .045], [.9, .032], [1, .023]]));
const BAR = {dos: 0x46526A, dosClair: 0x7A8698, flanc: 0xC0C6CE, ventre: 0xF0F0EC, ligne: 0x5A6474, tete: 0x56627A,
  joue: 0xD4D8DA, opercule: 0x8A94A2, tache: 0x2A3038, iris: 0xDCD8B8, cercle: 0x7E848A, levre: 0xC8CCD0, bouche: 0x7A6A6A,
  nag: 0xAEB4BC, nagBout: 0x66707C};
let barGeo = null;
function barFait(){
  if(barGeo) return barGeo;
  const C = BAR, F = BAR_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : gris-bleu au dos, argenté aux flancs, blanc au ventre ; la ligne latérale fine et sombre ; la tête lisse */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .5 ? melange(C.dosClair, C.dos, (h - .5) / .4) : h > .1 ? melange(C.flanc, C.dosClair, (h - .1) / .4) : melange(C.flanc, C.ventre, (.1 - h) / .7);
    const d = Math.abs(h - (.52 - .2 * Math.max(0, u - .45)));
    if(u > .27 && d < .035) c = melange(c, C.ligne, .7 * (1 - d / .035));
    if(u < .27) c = melange(c, h > .2 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 14, na: 11, taille: .038, relief: .0024});
  opercule(M, F, C.opercule, .27, .05);
  /* la tache sombre en haut de l'opercule, et ses deux petites pointes plates au bord */
  for(const s of [-1, 1]){
    const p = F.peau(.27, .5, s), n = F.normale(.27, .5, s);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.001), versN(n), V(.024, .003, .018)), c: C.tache});
    for(const a of [.15, -.1]){ const b = F.peau(.31, a, s), nb = F.normale(.31, a, s);
      ovale(M, C.opercule, b.clone().addScaledVector(nb, .002).add(V(-.02, 0, 0)), b.clone().addScaledVector(nb, .002).add(V(.014, 0, 0)), .003, .005); }
  }
  oeil(M, F, {u: .15, a: .45, r: .032, iris: C.iris, cercle: C.cercle, narine: 0x3A4250, uNarine: .07, aNarine: .6});
  /* la grande bouche aux lèvres fines, la mâchoire du bas un peu en avant */
  ovale(M, C.levre, V(X0 + .004, .002, 0), V(X0 + .1, -.004, 0), .02, .007);
  ovale(M, C.levre, V(X0 - .008, -.016, 0), V(X0 + .1, -.018, 0), .019, .007);
  ovale(M, C.bouche, V(X0, -.007, 0), V(X0 + .095, -.01, 0), .015, .004);
  const nagC = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBout, Math.pow(Math.max(0, (y - y0) * sens / h), 1.8));
  /* la première nageoire du dos : épineuse, ses épines qui dépassent un peu */
  const d0 = -.17, d1 = .01, y0 = HAUT(uDe(d0)) - .01, y1 = HAUT(uDe(d1)) - .01, hD = .16;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t); return V(b.x + .04, b.y + .015 + hD * Math.pow(Math.sin(Math.PI * Math.min(1, .15 + t * .9)), .6) * (1 - t * .35), 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 16), new THREE.Matrix4(), nagC(y0, 1, hD));
  for(let k = 0; k <= 8; k++){ const t = k / 8, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t), bout = e.clone().add(e.clone().sub(b).multiplyScalar(.05));
    baton(M, C.nag, b, bout, .0035); }
  /* la seconde nageoire du dos : molle, le bord droit, penchée vers l'arrière */
  const m0 = .06, m1 = .21, ym0 = HAUT(uDe(m0)) - .01, ym1 = HAUT(uDe(m1)) - .008;
  nageoire(M, nageoireGeo(V(m0, ym0, 0), V(m1, ym1, 0), t => V(m0 + .035 + t * .18, ym0 + .125 - t * .1, 0), 14), new THREE.Matrix4(), nagC(ym0, 1, .1));
  /* l'anale, sous la seconde nageoire du dos */
  const a0 = .1, a1 = .22, ay0 = -BAS(uDe(a0)) + .01, ay1 = -BAS(uDe(a1)) + .008;
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), t => V(a0 + .03 + t * .15, ay0 - .11 + t * .09, 0), 12), new THREE.Matrix4(), nagC(ay0, -1, .11));
  /* la queue un peu fourchue */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .04, 0), V(qx, -.04, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .34, fourche = .07 + .1 * Math.pow(lobe, .9);
      return V(qx + fourche + .03, y * (.82 + .18 * lobe), 0); }, 22),
    new THREE.Matrix4(), (x, y) => melange(C.nag, C.nagBout, Math.pow(Math.max(0, (x - qx) / .2), 1.5)));
  /* les ventrales, sous les pectorales */
  const peX = -.18;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .012, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.035, 0, 0), V(.03, 0, 0), t => V(.0 + t * .11, -.12 + t * .09, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBout, (pY - y) / .12));
  }
  /* les pectorales, derrière l'opercule */
  for(const s of [-1, 1]){
    const p = F.peau(.31, -.3, s);
    const g = nageoireGeo(V(0, .024, 0), V(0, -.024, 0), t => V(.2 - Math.abs(t - .3) * .12, -.07 + t * .09, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBout, (x - p.x) / .2));
  }
  return barGeo = fusionner(M);
}
export const barModele = () => modeleDe(barFait());

/* ---------- La sole ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici la sole »), comme une vraie sole commune (Solea solea ; choix de Yo :
   « A », comme la nature) : le premier poisson plat. Le corps aplati et ovale, couché sur son côté gauche : le côté des yeux
   brun-gris sable, marbré de taches plus sombres et semé de points clairs, la ligne latérale droite ; le dessous blanc. Les
   deux petits yeux du côté droit, l'un au-dessus de l'autre ; la petite bouche en croissant sous le museau arrondi. La longue
   frange de nageoires tout autour, à fins rayons, qui rejoint la queue arrondie ; la petite nageoire de côté et sa tache
   noire au bout (la marque de la sole). Faite tête vers −x comme les autres, puis retournée : la tête vers +x, le côté des
   yeux vers +z (vers nous quand on la montre), comme une vraie sole vue de dessus. */
const SOLE_F = corps(-.46, .3,
  courbe([[0, .03], [.04, .072], [.12, .124], [.25, .162], [.45, .176], [.65, .158], [.8, .118], [.92, .07], [1, .036]]),
  courbe([[0, .02], [.04, .05], [.12, .098], [.25, .144], [.45, .162], [.65, .146], [.8, .108], [.92, .064], [1, .034]]),
  courbe([[0, .018], [.06, .028], [.2, .032], [.5, .03], [.8, .021], [1, .013]]));
const SOLE = {fond: 0x8A7A5C, sombre: 0x5A4C38, clair: 0xB6A684, dessous: 0xF0EAE0, ligne: 0x6E604A, nag: 0x8C7C5E,
  nagBord: 0x5E5240, iris: 0x8A6A3A, cercle: 0x6A5A42, bouche: 0x4A3E30, levre: 0xA89A7C, tache: 0x141210};
let soleGeo = null;
function soleFait(){
  if(soleGeo) return soleGeo;
  const C = SOLE, F = SOLE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le marbré : des taches sombres aux bords doux, des points clairs ; rien sur le dessous blanc */
  const marbre = (x, y) => {
    const n = Math.sin(x * 30 + Math.sin(y * 19) * 1.6) * Math.sin(y * 30 + x * 9) + .35 * Math.sin(x * 52 - y * 41 + 1.3);
    const p = Math.sin(x * 140 + y * 37) * Math.sin(y * 120 - x * 29);
    return {n, p};
  };
  const couleurDessus = (x, y) => {
    const {n, p} = marbre(x, y);
    let c = melange(C.fond, C.sombre, Math.max(0, Math.min(1, (n - .25) / .35)));
    if(p > .82) c = melange(c, C.clair, (p - .82) / .18 * .9);
    if(Math.abs(y) < .005 && uDe(x) > .2) c = melange(c, C.ligne, .6);
    return c;
  };
  const couleurCorps = (x, y, z) => {
    const u = uDe(x), t = z / Math.max(.01, LARGE(u));        // 1 au milieu du côté des yeux, −1 au milieu du dessous
    return t > .15 ? couleurDessus(x, y) : t < -.25 ? new THREE.Color(C.dessous) : melange(C.dessous, couleurDessus(x, y), (t + .25) / .4);
  };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, LARGE, 76, 72), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y, z) => z < 0 ? .95 : .94 + .1 * Math.max(-1, Math.min(1, y / .15))});
  /* les deux petits yeux du côté droit (vers +z), l'un au-dessus de l'autre, sur une petite bosse */
  for(const [u, a] of [[.1, .78], [.075, .38]]){
    const o = F.peau(u, a, 1), n = F.normale(u, a, 1), q = versN(n), r = .019;
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.004), q, V(r * 1.5, .014, r * 1.4)), c: 0xFFFFFF, couleur: couleurDessus});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, .004), q, V(r, .012, r)), c: C.cercle});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, .008), q, V(r * .82, .011, r * .82)), c: C.iris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, .011), q, V(r * .5, .01, r * .5)), c: 0x141010});
    const b = o.clone().addScaledVector(n, .021); b.x -= .004; b.y += .005;
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(b, q, V(r * .2, .003, r * .2)), c: 0xFFFFFF});
  }
  /* la petite bouche en croissant, sous le museau arrondi qui la recouvre */
  const bo = F.peau(.035, -.55, 1);
  ovale(M, C.levre, V(bo.x - .006, bo.y + .008, bo.z * .6), V(bo.x + .03, bo.y - .012, bo.z * .6), .012, .006);
  ovale(M, C.bouche, V(bo.x - .004, bo.y + .006, bo.z * .75), V(bo.x + .026, bo.y - .01, bo.z * .75), .007, .003);
  /* la longue frange de nageoires : au-dessus depuis la tête, en dessous depuis la gorge, jusqu'à la queue qu'elle rejoint */
  const frange = (xa, sens, large) => {
    const bord = x => sens > 0 ? HAUT(uDe(x)) : -BAS(uDe(x));
    const base = t => { const x = xa + (X1 + .02 - xa) * t; return V(x, bord(x) - sens * .006, 0); };
    const larg = t => large * Math.min(1, t / .1 + .25) * (1 - .15 * t);
    const tip = t => { const b = base(t), d = (bord(b.x + .01) - bord(b.x - .01)) / .02, l = larg(t), k = Math.hypot(1, d);
      return V(b.x - sens * d / k * l * .4 + l * .25, b.y + sens * l / k, 0); };
    nageoire(M, rubanGeo(base, tip, 110), new THREE.Matrix4(), (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, (Math.abs(y) - Math.abs(bord(x)) + .004) / (large * .9))), 1.6)));
  };
  frange(X0 + .025, 1, .062);
  frange(X0 + .07, -1, .056);
  /* la queue arrondie, que la frange rejoint */
  const qx = X1 - .01;
  nageoire(M, nageoireGeo(V(qx, .034, 0), V(qx, -.034, 0), t => { const a = Math.PI * (t - .5) * .95; return V(qx + .025 + Math.cos(a) * .085, -Math.sin(a) * .085 + (.5 - t) * .02, 0); }, 22),
    new THREE.Matrix4(), x => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (x - qx) / .11), 1.6)));
  /* la petite nageoire de côté, du côté des yeux, et sa tache noire au bout ; une plus petite dessous */
  const p = F.peau(.24, .05, 1);
  const gP = nageoireGeo(V(0, .016, 0), V(0, -.016, 0), t => V(.1 - Math.abs(t - .4) * .05, -.035 + t * .07, 0), 10);
  nageoire(M, gP, new THREE.Matrix4().compose(V(p.x, p.y, p.z + .004), tourne(0, -.25, 0), V(1, 1, 1)),
    (x, y) => x - p.x > .086 ? C.tache : melange(C.clair, C.nag, (x - p.x) / .07));
  const pd = F.peau(.24, .05, -1);
  nageoire(M, nageoireGeo(V(0, .008, 0), V(0, -.008, 0), t => V(.045, -.015 + t * .03, 0), 6), new THREE.Matrix4().compose(V(pd.x, pd.y, pd.z - .004), tourne(0, .25, 0), V(1, 1, 1)), () => C.dessous);
  /* retournée : la tête vers +x, le côté des yeux toujours vers +z (une sole a les yeux sur son côté droit) */
  const g = fusionner(M), P = g.attributes.position, N = g.attributes.normal, I = g.index;
  for(let i = 0; i < P.count; i++){ P.setX(i, -P.getX(i)); N.setX(i, -N.getX(i)); }
  for(let j = 0; j < I.count; j += 3){ const a = I.getX(j + 1); I.setX(j + 1, I.getX(j + 2)); I.setX(j + 2, a); }
  g.computeBoundingSphere();
  return soleGeo = g;
}
export const soleModele = () => modeleDe(soleFait());

/* ---------- La dorade ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici la dorade »), comme une vraie dorade royale (Sparus aurata ; choix de
   Yo : « A », comme la nature) : le corps haut et ovale, argenté, gris-bleu au dos, de fines lignes grises de la tête à la
   queue ; de grandes écailles ; le front bombé et la bande dorée qui passe d'un œil à l'autre (son nom) ; la tache sombre
   bien nette en haut de l'ouïe, au début de la ligne latérale, bordée d'un peu de rouge ; l'œil sombre cerclé d'argent ; les
   lèvres assez épaisses (elle croque des coquillages). Une seule longue nageoire du dos, épineuse devant ; les nageoires
   gris-bleu ; la queue fourchue au bord noir. */
const DORADE_F = corps(-.44, .34,
  courbe([[0, .032], [.04, .092], [.1, .156], [.2, .196], [.32, .212], [.45, .204], [.6, .174], [.73, .13], [.86, .084], [1, .046]]),
  courbe([[0, .026], [.05, .058], [.14, .112], [.28, .156], [.42, .162], [.58, .14], [.72, .1], [.86, .064], [1, .04]]),
  courbe([[0, .02], [.06, .04], [.15, .058], [.3, .068], [.45, .068], [.6, .058], [.75, .045], [.9, .032], [1, .023]]));
const DORADE = {dos: 0x66748A, dosClair: 0x98A4B4, flanc: 0xC8CED6, ventre: 0xF0F0EA, ligne: 0x8C96A4, tete: 0x8A96A8,
  joue: 0xD6DADE, or: 0xE2AA30, opercule: 0x96A0AE, tache: 0x26262C, rouge: 0xA8443A, iris: 0x3A3028, cercle: 0xC8CCD2,
  levre: 0xC4C6C8, bouche: 0x7A6A66, nag: 0xA2AAB6, nagBout: 0x5C6470, noir: 0x1E2026};
let doradeGeo = null;
function doradeFait(){
  if(doradeGeo) return doradeGeo;
  const C = DORADE, F = DORADE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : gris-bleu au dos, argenté aux flancs, blanc au ventre ; les fines lignes grises ; la tête argentée et la
     bande dorée qui passe sur le front, d'un œil à l'autre */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .5 ? melange(C.dosClair, C.dos, (h - .5) / .4) : h > 0 ? melange(C.flanc, C.dosClair, h / .5) : melange(C.flanc, C.ventre, -h / .7);
    if(u > .28){ const f = ((h + 1) / .17) % 1, d = Math.min(f, 1 - f);
      if(h > -.45 && h < .85 && d < .12) c = melange(c, C.ligne, .55 * (1 - d / .12) * Math.min(1, (u - .28) / .06)); }
    if(u < .27) c = melange(c, h > .3 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    const db = Math.abs(u - .125) / .028;
    if(db < 1 && h > .6) c = melange(c, C.or, Math.min(1, (1 - db) * 2) * Math.min(1, (h - .6) / .1));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 14, na: 12, taille: .032, relief: .0018});
  opercule(M, F, C.opercule, .27, .05);
  /* la tache sombre en haut de l'ouïe, bordée d'un peu de rouge */
  for(const s of [-1, 1]){
    const p = F.peau(.285, .42, s), n = F.normale(.285, .42, s);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, -.0012), versN(n), V(.03, .0032, .026)), c: C.rouge});
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .0004), versN(n), V(.024, .0032, .02)), c: C.tache});
  }
  oeil(M, F, {u: .16, a: .36, r: .034, iris: C.iris, cercle: C.cercle, narine: 0x4A505C, uNarine: .075, aNarine: .58});
  /* les lèvres assez épaisses, la bouche un peu basse */
  boule(M, C.levre, X0 + .014, -.006, 0, .024, .012, .032);
  boule(M, C.levre, X0 + .02, -.028, 0, .024, .012, .03);
  boule(M, C.bouche, X0 + .002, -.017, 0, .01, .005, .022, BOULE_P);
  const nagC = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBout, Math.pow(Math.max(0, (y - y0) * sens / h), 1.6));
  /* la longue nageoire du dos, épineuse devant (les épines dépassent un peu), molle et plus arrondie derrière */
  const d0 = -.16, d1 = .2, y0 = HAUT(uDe(d0)) - .012, y1 = HAUT(uDe(d1)) - .01, hD = .11;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t); return V(b.x + .04 + t * .02, b.y + .01 + hD * Math.pow(Math.sin(Math.PI * Math.min(1, .1 + t * .92)), .45) * (1 - t * .25), 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 24), new THREE.Matrix4(), nagC(y0, 1, hD));
  for(let k = 0; k <= 10; k++){ const t = k / 10 * .55, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t), bout = e.clone().add(e.clone().sub(b).multiplyScalar(.06));
    baton(M, C.nag, b, bout, .003); }
  /* l'anale */
  const a0 = .08, a1 = .22, ay0 = -BAS(uDe(a0)) + .01, ay1 = -BAS(uDe(a1)) + .008;
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), t => V(a0 + .035 + t * .15, ay0 - .09 + t * .075, 0), 12), new THREE.Matrix4(), nagC(ay0, -1, .09));
  /* la queue fourchue, au bord noir */
  const qx = X1 - .015;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .4, fourche = .07 + .13 * Math.pow(lobe, .9);
    return V(qx + fourche + .03, y * (.82 + .18 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .042, 0), V(qx, -.042, 0), bordQ, 24), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .4)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return k > .88 ? C.noir : melange(C.nag, C.nagBout, k * .55); });
  /* les ventrales, sous les pectorales */
  const peX = -.14;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .014, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.035, 0, 0), V(.03, 0, 0), t => V(.0 + t * .1, -.11 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBout, (pY - y) / .12));
  }
  /* les pectorales : longues et pointues, derrière l'ouïe */
  for(const s of [-1, 1]){
    const p = F.peau(.31, -.2, s);
    const g = nageoireGeo(V(0, .022, 0), V(0, -.022, 0), t => V(.21 - Math.abs(t - .2) * .15, .02 - t * .06, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBout, (x - p.x) / .3));
  }
  return doradeGeo = fusionner(M);
}
export const doradeModele = () => modeleDe(doradeFait());

/* ---------- La sardine ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici la sardine »), comme une vraie sardine (Sardina pilchardus ; choix de
   Yo : « A », comme la nature) : le corps fin et allongé, la tête pointue ; le dos bleu-vert, les flancs argentés aux
   reflets dorés, le ventre blanc ; de grandes écailles. Sa marque : une rangée de petites taches sombres en haut du flanc,
   derrière l'ouïe, et l'ouïe striée de fines lignes en éventail. L'œil sombre cerclé d'argent ; la petite bouche aux lèvres
   fines, la mâchoire du bas un peu en avant. Une seule nageoire au milieu du dos ; dessous, les ventrales sous elle et
   l'anale basse vers la queue (pas de nageoire sous la gorge) ; les pectorales basses ; la queue bien fourchue ; les
   nageoires gris clair, presque transparentes, la queue plus sombre au bord. */
const SARDINE_F = corps(-.48, .34,
  courbe([[0, .018], [.05, .046], [.14, .078], [.28, .096], [.42, .1], [.58, .094], [.72, .077], [.86, .053], [1, .033]]),
  courbe([[0, .014], [.05, .038], [.14, .068], [.28, .088], [.42, .092], [.58, .084], [.72, .065], [.86, .045], [1, .03]]),
  courbe([[0, .012], [.06, .024], [.15, .036], [.28, .044], [.42, .045], [.58, .041], [.72, .033], [.86, .024], [1, .017]]));
const SARDINE = {dos: 0x24607A, dosClair: 0x4C8C9C, reflet: 0xBCC2B2, flanc: 0xAAB6C0, ventre: 0xF0F2F0, tete: 0x3E7484,
  joue: 0xD2D8DC, opercule: 0xB4BEC6, strie: 0x76828E, tache: 0x1E2A34, iris: 0x26282C, cercle: 0xC4CAD0, levre: 0xC8CED2,
  bouche: 0x7A6E70, nag: 0xC8CED4, nagBord: 0x8E98A2};
let sardineGeo = null;
function sardineFait(){
  if(sardineGeo) return sardineGeo;
  const C = SARDINE, F = SARDINE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : bleu-vert au dos, un reflet doré pâle entre le dos et le flanc argenté, blanc au ventre */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .55 ? melange(C.dosClair, C.dos, (h - .55) / .3) : h > .25 ? melange(C.flanc, C.dosClair, (h - .25) / .3) : melange(C.flanc, C.ventre, (.25 - h) / .9);
    const r = Math.abs(h - .3);
    if(u > .26 && r < .08) c = melange(c, C.reflet, .35 * (1 - r / .08));
    if(u < .27) c = melange(c, h > .4 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 13, na: 8, taille: .042, relief: .0024, geo: ECAILLE_GRANDE});
  opercule(M, F, C.opercule, .26, .045);
  for(const s of [-1, 1]){
    /* l'ouïe striée : de fines lignes en éventail, du haut de l'ouïe vers le bas et l'arrière */
    for(let k = 0; k < 5; k++){
      const a1 = .45 - k * .26, p0 = F.peau(.205, .25, s), p1 = F.peau(.255, a1, s), n = F.normale(.23, (.25 + a1) / 2, s);
      baton(M, C.strie, p0.addScaledVector(n, .006), p1.addScaledVector(n, .007), .0014);
    }
    /* la rangée de taches sombres en haut du flanc, la première juste derrière l'ouïe, la plus nette */
    for(let k = 0; k < 6; k++){
      const u = .3 + k * .055, a = .62 - k * .01, p = F.peau(u, a, s), n = F.normale(u, a, s), e = k ? .009 - k * .0006 : .012;
      M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .0012), versN(n), V(e, .003, e)), c: C.tache});
    }
  }
  oeil(M, F, {u: .14, a: .38, r: .042, iris: C.iris, cercle: C.cercle, narine: 0x3A4A56, uNarine: .065, aNarine: .62});
  /* la petite bouche aux lèvres fines, la mâchoire du bas un peu en avant */
  ovale(M, C.levre, V(X0 + .006, .002, 0), V(X0 + .06, -.002, 0), .012, .004);
  ovale(M, C.levre, V(X0 - .006, -.01, 0), V(X0 + .06, -.012, 0), .011, .0045);
  ovale(M, C.bouche, V(X0, -.004, 0), V(X0 + .05, -.006, 0), .009, .0025);
  const couleurNag = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 1.8));
  /* la nageoire du dos, au milieu : le bord avant raide, le haut pointu */
  const d0 = -.07, d1 = .06, dy0 = HAUT(uDe(d0)) - .008, dy1 = HAUT(uDe(d1)) - .008, hD = .1;
  nageoire(M, nageoireGeo(V(d0, dy0, 0), V(d1, dy1, 0), t => { const b = V(d0, dy0, 0).lerp(V(d1, dy1, 0), t);
    const f = t < .15 ? .3 + .7 * t / .15 : 1 - .85 * (t - .15) / .85;
    return V(b.x + .03 + .05 * f, b.y + .006 + hD * f, 0); }, 14), new THREE.Matrix4(), couleurNag(dy0, 1, hD));
  /* l'anale, longue et basse, vers la queue */
  const a0 = .13, a1 = .27, ay0 = -BAS(uDe(a0)) + .008, ay1 = -BAS(uDe(a1)) + .007;
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), t => { const b = V(a0, ay0, 0).lerp(V(a1, ay1, 0), t);
    const f = t < .12 ? .4 + .6 * t / .12 : 1 - .6 * (t - .12) / .88;
    return V(b.x + .02 + .02 * f, b.y - .005 - .045 * f, 0); }, 14), new THREE.Matrix4(), couleurNag(ay0, -1, .05));
  /* la queue bien fourchue, plus sombre au bord */
  const qx = X1 - .015;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .27, fourche = .04 + .12 * Math.pow(lobe, .85);
    return V(qx + fourche + .02, y * (.75 + .25 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .03, 0), V(qx, -.03, 0), bordQ, 24), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .27)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, k)), 1.6)); });
  /* les ventrales : au milieu du ventre, sous la nageoire du dos */
  const peX = -.02;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .01, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.025, 0, 0), V(.02, 0, 0), t => V(.03 + t * .05, -.055 + t * .045, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .07));
  }
  /* les pectorales, basses, juste derrière l'ouïe */
  for(const s of [-1, 1]){
    const p = F.peau(.29, -.6, s);
    const g = nageoireGeo(V(0, .016, 0), V(0, -.016, 0), t => V(.13 - Math.abs(t - .25) * .08, .0 - t * .04, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .008), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .16));
  }
  return sardineGeo = fusionner(M);
}
export const sardineModele = () => modeleDe(sardineFait());

/* ---------- Le mulet ----------
   D'après l'image de Yo (6 novembre 2026 : « Voici le mulet »), comme un vrai mulet lippu (Chelon labrosus ; choix de Yo :
   « A », comme la nature) : le corps fuselé et robuste, la tête large et plate sur le dessus, le museau court et arrondi. Le
   dos gris-bleu sombre, les flancs argentés, le ventre blanc ; de grandes écailles et, le long des flancs, de fines lignes
   gris sombre, discrètes, qui suivent les rangées d'écailles (pas de ligne latérale). La petite bouche à la lèvre du haut
   très épaisse (la marque du mulet lippu) ; l'œil sombre cerclé d'argent. Deux nageoires du dos bien séparées : la première
   toute petite, à 4 piquants raides, au milieu du dos ; la seconde, molle, au-dessus de l'anale. Les pectorales hautes sur
   le flanc ; les ventrales loin en arrière, au milieu du ventre ; la queue un peu fourchue ; les nageoires grises, plus
   sombres au bord. */
const MULET_F = corps(-.48, .36,
  courbe([[0, .028], [.05, .058], [.14, .088], [.28, .114], [.42, .122], [.58, .112], [.72, .088], [.86, .062], [1, .042]]),
  courbe([[0, .022], [.05, .048], [.14, .08], [.28, .102], [.42, .108], [.58, .096], [.72, .074], [.86, .052], [1, .036]]),
  courbe([[0, .026], [.06, .05], [.15, .068], [.3, .074], [.45, .07], [.6, .058], [.75, .045], [.9, .032], [1, .023]]));
const MULET = {dos: 0x3C4A58, dosClair: 0x6C7A88, flanc: 0xB6BEC6, ventre: 0xEEF0EE, strie: 0x404A56, tete: 0x485664,
  joue: 0xC6CED4, opercule: 0x9CA6AE, iris: 0x34302A, cercle: 0xC2C6C6, levre: 0xD2D0C8, levreBas: 0xC0C2C0, bouche: 0x6E6264,
  nag: 0x9AA2AA, nagBord: 0x58606A};
let muletGeo = null;
function muletFait(){
  if(muletGeo) return muletGeo;
  const C = MULET, F = MULET_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : gris-bleu sombre au dos, argenté aux flancs, blanc au ventre ; les fines lignes sombres du dos jusqu'au bas
     du flanc, plus pâles vers le ventre ; la tête lisse */
  const LIGNES = [.82, .65, .44, .19, -.08];
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .68 ? melange(C.dosClair, C.dos, (h - .68) / .25) : h > .2 ? melange(C.flanc, C.dosClair, (h - .2) / .48) : melange(C.flanc, C.ventre, (.2 - h) / .8);
    if(u > .3){
      let d = 1, k = 0;
      for(let i = 0; i < LIGNES.length; i++){ const e = Math.abs(h - LIGNES[i]); if(e < d){ d = e; k = i; } }
      const force = (k < 3 ? .95 : .95 - (k - 2) * .3) * Math.min(1, (u - .3) / .06) * Math.min(1, (1 - u) / .1);
      if(d < .09) c = melange(c, C.strie, force * Math.min(1, 1.8 * (1 - d / .09)));
    }
    if(u < .27) c = melange(c, h > .25 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 12, na: 10, taille: .044, relief: .0024, geo: ECAILLE_GRANDE});
  opercule(M, F, C.opercule, .26, .045);
  oeil(M, F, {u: .14, a: .42, r: .03, iris: C.iris, cercle: C.cercle, narine: 0x3A4450, uNarine: .07, aNarine: .7});
  /* la petite bouche : la lèvre du haut très épaisse, la mâchoire du bas un peu en retrait */
  ovale(M, C.levre, V(X0 - .024, -.004, 0), V(X0 + .03, -.008, 0), .03, .013);
  ovale(M, C.levreBas, V(X0 - .012, -.021, 0), V(X0 + .03, -.02, 0), .022, .007);
  ovale(M, C.bouche, V(X0 - .016, -.015, 0), V(X0 + .025, -.015, 0), .02, .0035);
  const couleurNag = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 1.8));
  /* la première nageoire du dos : toute petite, triangulaire, ses 4 piquants raides */
  const d0 = -.1, d1 = -.04, y0 = HAUT(uDe(d0)) - .008, y1 = HAUT(uDe(d1)) - .008, hD = .085;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), f = 1 - t * .85; return V(b.x + .025 * f + .01, b.y + .004 + hD * f, 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 10), new THREE.Matrix4(), couleurNag(y0, 1, hD));
  for(let k = 0; k < 4; k++){ const t = k / 3 * .8, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t);
    baton(M, C.nagBord, b, e.clone().add(e.clone().sub(b).multiplyScalar(.06)), .003); }
  /* la seconde nageoire du dos : molle, au-dessus de l'anale, le bord creusé */
  const m0 = .08, m1 = .16, ym0 = HAUT(uDe(m0)) - .008, ym1 = HAUT(uDe(m1)) - .006;
  nageoire(M, nageoireGeo(V(m0, ym0, 0), V(m1, ym1, 0), t => { const b = V(m0, ym0, 0).lerp(V(m1, ym1, 0), t);
    const f = t < .2 ? .5 + .5 * t / .2 : 1 - .8 * Math.pow((t - .2) / .8, .7);
    return V(b.x + .04 * f + .015, b.y + .004 + .085 * f, 0); }, 12), new THREE.Matrix4(), couleurNag(ym0, 1, .085));
  /* l'anale, sous la seconde nageoire du dos */
  const a0 = .06, a1 = .15, ay0 = -BAS(uDe(a0)) + .008, ay1 = -BAS(uDe(a1)) + .006;
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), t => { const b = V(a0, ay0, 0).lerp(V(a1, ay1, 0), t);
    const f = t < .2 ? .5 + .5 * t / .2 : 1 - .8 * Math.pow((t - .2) / .8, .7);
    return V(b.x + .035 * f + .015, b.y - .004 - .07 * f, 0); }, 12), new THREE.Matrix4(), couleurNag(ay0, -1, .07));
  /* la queue un peu fourchue, plus sombre au bord */
  const qx = X1 - .015;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .3, fourche = .07 + .09 * Math.pow(lobe, .9);
    return V(qx + fourche + .025, y * (.8 + .2 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .035, 0), V(qx, -.035, 0), bordQ, 22), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .3)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, k)), 1.6)); });
  /* les ventrales : loin en arrière, au milieu du ventre, sous la première nageoire du dos */
  const peX = -.15;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .012, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.03, 0, 0), V(.025, 0, 0), t => V(.03 + t * .07, -.075 + t * .06, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .09));
  }
  /* les pectorales, hautes sur le flanc, juste derrière l'ouïe */
  for(const s of [-1, 1]){
    const p = F.peau(.3, .3, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.15 - Math.abs(t - .25) * .09, .01 - t * .05, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .008), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .18));
  }
  return muletGeo = fusionner(M);
}
export const muletModele = () => modeleDe(muletFait());

/* ---------- L'orphie ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici l'orphie »), comme une vraie orphie (Belone belone ; choix de Yo : « A »,
   comme la nature) : le corps très long et fin ; le long bec pointu, la mâchoire du bas un peu plus longue que celle du
   haut, toutes deux garnies de petites dents fines. Le dos bleu-vert, un reflet vert entre le dos et le flanc argenté, le
   ventre blanc ; les écailles minuscules : la peau paraît lisse et brillante ; la ligne latérale basse, près du ventre.
   L'œil argenté, un peu jaune pâle. La nageoire du dos et l'anale en face l'une de l'autre, tout près de la queue, longues
   et basses ; les ventrales au milieu du ventre ; les pectorales petites et hautes ; la queue fourchue ; les nageoires
   gris-vert, presque transparentes. */
const ORPHIE_F = corps(-.4, .5,
  courbe([[0, .012], [.04, .024], [.1, .034], [.2, .04], [.5, .043], [.75, .039], [.88, .028], [1, .016]]),
  courbe([[0, .01], [.04, .02], [.1, .029], [.2, .035], [.5, .038], [.75, .033], [.88, .024], [1, .014]]),
  courbe([[0, .01], [.05, .02], [.12, .026], [.5, .029], [.8, .023], [1, .011]]));
const ORPHIE = {dos: 0x1C4E66, dosVert: 0x3C8A84, reflet: 0x7EB8A8, flanc: 0xC6CED0, ventre: 0xF2F2EE, ligne: 0xA2ACB0,
  tete: 0x24566A, joue: 0xD0D6D6, opercule: 0xAAB6B8, bec: 0x2A5A68, becBas: 0x8E9C9C, bouche: 0x5A4A48, dent: 0xF0EEE6,
  iris: 0xB6BAAE, cercle: 0x8A9696, nag: 0xA6B4AC, nagBord: 0x62786E};
let orphieGeo = null;
function orphieFait(){
  if(orphieGeo) return orphieGeo;
  const C = ORPHIE, F = ORPHIE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps lisse : bleu-vert au dos, le reflet vert, argenté au flanc, blanc au ventre ; la ligne latérale basse */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .55 ? melange(C.dosVert, C.dos, (h - .55) / .3) : h > .15 ? melange(C.flanc, C.dosVert, (h - .15) / .4) : melange(C.flanc, C.ventre, (.15 - h) / .6);
    const r = Math.abs(h - .3);
    if(r < .1) c = melange(c, C.reflet, .4 * (1 - r / .1));
    const d = Math.abs(h + .55);
    if(u > .16 && u < .97 && d < .06) c = melange(c, C.ligne, .6 * (1 - d / .06));
    if(u < .16) c = melange(c, h > .3 ? C.tete : C.joue, Math.min(1, (.16 - u) / .03));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {nu: 0});                 // les écailles minuscules : pas d'écailles en relief
  /* l'ouïe : un arc fin, plus clair, derrière l'œil (l'opercule en relief serait trop épais sur ce corps si fin) */
  for(const s of [-1, 1]) for(let k = 0; k < 10; k++){ const a0 = -.95 + k * .2, a1 = a0 + .2;
    baton(M, C.opercule, F.peau(.15 + .018 * Math.cos(a0), a0, s).addScaledVector(F.normale(.15, a0, s), .0005), F.peau(.15 + .018 * Math.cos(a1), a1, s).addScaledVector(F.normale(.15, a1, s), .0005), .0013); }
  oeil(M, F, {u: .075, a: .3, r: .02, iris: C.iris, cercle: C.cercle, narine: 0x2E4650, uNarine: .03, aNarine: .6});
  /* le long bec : deux mâchoires pointues, celle du bas un peu plus longue ; leurs petites dents */
  const CONE = new THREE.ConeGeometry(1, 1, 6).rotateZ(Math.PI / 2);     // la pointe vers −x
  const xb = X0 + .02, haut = X0 - .2, bas = X0 - .235;
  M.push({geo: CONE, m: new THREE.Matrix4().compose(V((xb + haut) / 2, .004, 0), q0, V(xb - haut, .011, .011)), c: C.bec});
  M.push({geo: CONE, m: new THREE.Matrix4().compose(V((xb + bas) / 2, -.007, 0), q0, V(xb - bas, .009, .01)), c: C.becBas});
  ovale(M, C.bouche, V(X0 - .03, -.0015, 0), V(X0 + .03, -.0025, 0), .009, .003);
  const DENT = new THREE.ConeGeometry(1, 1, 3);
  for(const s of [-1, 1]) for(let k = 0; k < 9; k++){
    const x = X0 - .015 - k * .019, rh = .011 * (x - haut) / (xb - haut), rb = .009 * (x - bas) / (xb - bas);
    if(rh > .002) M.push({geo: DENT, m: new THREE.Matrix4().compose(V(x, .004 - rh * .6, s * rh * .55), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI), V(.0016, .004, .0016)), c: C.dent});
    if(rb > .002) M.push({geo: DENT, m: new THREE.Matrix4().compose(V(x - .009, -.007 + rb * .6, s * rb * .55), q0, V(.0016, .004, .0016)), c: C.dent});
  }
  const couleurNag = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 1.6));
  /* la nageoire du dos, près de la queue : longue et basse, plus haute à l'avant */
  const d0 = .27, d1 = .4, dy0 = HAUT(uDe(d0)) - .006, dy1 = HAUT(uDe(d1)) - .004;
  nageoire(M, nageoireGeo(V(d0, dy0, 0), V(d1, dy1, 0), t => { const b = V(d0, dy0, 0).lerp(V(d1, dy1, 0), t);
    const f = t < .12 ? .5 + .5 * t / .12 : 1 - .65 * (t - .12) / .88;
    return V(b.x + .022 + .018 * f, b.y + .004 + .05 * f, 0); }, 14), new THREE.Matrix4(), couleurNag(dy0, 1, .05));
  /* l'anale, en face, commencée un peu plus tôt */
  const a0 = .24, a1 = .38, ay0 = -BAS(uDe(a0)) + .006, ay1 = -BAS(uDe(a1)) + .004;
  nageoire(M, nageoireGeo(V(a0, ay0, 0), V(a1, ay1, 0), t => { const b = V(a0, ay0, 0).lerp(V(a1, ay1, 0), t);
    const f = t < .12 ? .5 + .5 * t / .12 : 1 - .65 * (t - .12) / .88;
    return V(b.x + .022 + .018 * f, b.y - .004 - .045 * f, 0); }, 14), new THREE.Matrix4(), couleurNag(ay0, -1, .045));
  /* la queue fourchue */
  const qx = X1 - .01;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .2, fourche = .025 + .085 * Math.pow(lobe, .9);
    return V(qx + fourche + .015, y * (.75 + .25 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .016, 0), V(qx, -.016, 0), bordQ, 22), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .2)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, k)), 1.4)); });
  /* les ventrales, au milieu du ventre */
  const peX = .1;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .006, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.018, 0, 0), V(.012, 0, 0), t => V(.02 + t * .035, -.035 + t * .03, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .04));
  }
  /* les pectorales, petites et hautes, juste derrière l'ouïe */
  for(const s of [-1, 1]){
    const p = F.peau(.18, .3, s);
    const g = nageoireGeo(V(0, .01, 0), V(0, -.01, 0), t => V(.07 - Math.abs(t - .25) * .04, .005 - t * .025, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .005), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .08));
  }
  return orphieGeo = fusionner(M);
}
export const orphieModele = () => modeleDe(orphieFait());

/* ---------- Le congre ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici le congre »), comme un vrai congre (Conger conger ; choix de Yo : « A »,
   comme la nature) : le long corps de serpent, puissant, la grosse tête ; la peau lisse sans écailles, gris ardoise presque
   noir au dos, gris pâle au ventre, sans taches ; le long du flanc, la rangée de petits points clairs de la ligne latérale.
   La grande bouche aux lèvres épaisses, la mâchoire du haut un peu plus longue, la fente jusque sous l'œil ; le grand œil
   gris doré. Pas de nageoires au ventre : seulement les pectorales, pointues. La longue nageoire du dos part juste derrière
   les pectorales, celle du dessous du milieu du ventre ; elles font le tour de la queue, qui finit en pointe ; grises,
   bordées d'un liseré noir. Fait comme l'anguille (anguilleFait), plus gros et plus gris. */
const CONGRE_F = corps(-.6, .56,
  courbe([[0, .017], [.03, .036], [.08, .059], [.14, .073], [.3, .081], [.5, .078], [.7, .063], [.85, .042], [1, .008]]),
  courbe([[0, .014], [.03, .031], [.08, .052], [.14, .067], [.3, .078], [.5, .077], [.7, .062], [.85, .041], [1, .008]]),
  courbe([[0, .018], [.03, .034], [.08, .049], [.14, .057], [.3, .06], [.5, .052], [.7, .036], [.85, .021], [1, .004]]));
const CONGRE = {dos: 0x2C3034, dosClair: 0x4C535A, flanc: 0x7A8288, ventre: 0xC4C8CA, levre: 0x8C9298, bouche: 0x3A3436,
  pore: 0xB6BCBC, iris: 0xA49C80, cercle: 0x464C52, nag: 0x6A7076, nagBord: 0x141618, pecto: 0x737B82, pectoBout: 0x4A5258};
let congreGeo = null;
function congreFait(){
  if(congreGeo) return congreGeo;
  const C = CONGRE, F = CONGRE_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas;
  const xDe = u => X0 + (X1 - X0) * u;
  /* le corps, lisse : gris ardoise au dos, gris pâle au ventre, sans taches */
  const couleurCorps = (x, y) => { const h = F.h(x, y);
    return h > .3 ? melange(C.dosClair, C.dos, (h - .3) / .4) : h > -.2 ? melange(C.flanc, C.dosClair, (h + .2) / .5) : melange(C.flanc, C.ventre, (-.2 - h) / .5); };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, F.large, 96, 26), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .06))});
  oeil(M, F, {u: .07, a: .5, r: .022, iris: C.iris, cercle: C.cercle, narine: C.dos, uNarine: .016, aNarine: .45});
  /* les narines en petits tubes, au bout du museau */
  for(const s of [-1, 1]){ const a = F.peau(.012, .4, s), b = a.clone().add(V(-.006, .005, s * .003)); baton(M, C.dosClair, a, b, .0025); }
  /* la grande bouche aux lèvres épaisses : la mâchoire du haut un peu plus longue, la fente jusque sous l'œil */
  boule(M, C.levre, X0 + .036, -.005, 0, .055, .012, .021);
  boule(M, C.levre, X0 + .045, -.022, 0, .05, .011, .02);
  boule(M, C.bouche, X0 + .045, -.0135, 0, .046, .004, .0205, BOULE_P);
  /* la fente des ouïes, devant la pectorale */
  for(const s of [-1, 1]) for(let k = 0; k < 5; k++){ const p = F.peau(.13, -.4 + k * .1, s), n = F.normale(.13, -.4 + k * .1, s);
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.001), versN(n), V(.003, .003, .007)), c: C.dosClair}); }
  /* la ligne latérale : une rangée de petits points clairs le long du flanc */
  for(const s of [-1, 1]) for(let u = .15; u < .96; u += .026){ const a = .08 - .1 * u, p = F.peau(u, a, s), n = F.normale(u, a, s);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, .0008), versN(n), V(.0035, .0012, .0035)), c: C.pore}); }
  /* la pectorale, pointue */
  for(const s of [-1, 1]){
    const p = F.peau(.145, -.1, s);
    const g = nageoireGeo(V(0, .012, 0), V(0, -.012, 0), t => { const a = Math.PI * (t - .5) * .95; return V(.01 + Math.cos(a) * .06 * (1 - .35 * Math.abs(t - .35)), Math.sin(-a) * .026 - .008, 0); }, 10, .004);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .007), tourne(s * .1, s * -.4, 0), V(1, 1, 1)), x => melange(C.pecto, C.pectoBout, (x - p.x) / .06));
  }
  /* la longue nageoire : du dos juste derrière les pectorales, du dessous depuis le milieu du ventre ; elles font le tour de
     la queue et s'y rejoignent ; grises, le liseré noir au bord */
  const rubans = [[.2, 1], [.44, -1]];
  for(const [u0, sens] of rubans){
    const base = t => { const u = u0 + (1 - u0) * t, f = Math.max(0, (t - .8) / .2);
      return V(xDe(u), sens * ((sens > 0 ? HAUT(u) : BAS(u)) - .004 - .005 * f * f), 0); };
    const hauteur = t => .034 * Math.min(1, t / .1) + .01 * t;
    const tc = .82, bc = base(tc), xc = bc.x, ry = Math.abs(bc.y) + hauteur(tc), rx = X1 + .06 - xc;
    const bord = t => { if(t <= tc) return base(t).add(V(0, sens * hauteur(t), 0));
      const a = (t - tc) / (1 - tc) * Math.PI / 2; return V(xc + rx * Math.sin(a), sens * ry * Math.pow(Math.cos(a), 1.4), 0); };
    nageoire(M, rubanGeo(base, bord, 90), new THREE.Matrix4(), (x, y) => {
      const u = uDe(x), k = (Math.abs(y) - (sens > 0 ? HAUT(u) : BAS(u)) + .004) / .03;
      return u > .97 ? melange(C.nag, C.nagBord, Math.max(0, (x - X1) / .05) * 1.4) : melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, k)), 3) * 1.2); });
  }
  /* le tout ondule doucement, comme sur l'image : droit à la tête, des vagues plus amples vers la queue */
  const g = fusionner(M), P = g.attributes.position, N = g.attributes.normal, k = Math.PI * 2 / .62;
  const A = x => .045 * Math.max(0, Math.min(1, (x + .35) / .5));
  const w = x => A(x) * Math.sin(k * (x + .1)), dw = x => (w(x + .001) - w(x - .001)) / .002;
  for(let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), d = dw(x), L = Math.sqrt(1 + d * d);
    P.setXY(i, x - y * d / L, w(x) + y / L);
    const nx = N.getX(i), ny = N.getY(i), c = 1 / L, s = d / L;
    N.setXY(i, nx * c - ny * s, nx * s + ny * c);
  }
  g.computeBoundingSphere();
  return congreGeo = g;
}
export const congreModele = () => modeleDe(congreFait());

/* ---------- L'encornet ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici l'encornet »), comme un vrai encornet (le calmar commun, Loligo
   vulgaris ; choix de Yo : « A », comme la nature) : le long manteau en fuseau qui finit en pointe, son col autour de la
   tête ; les deux longues nageoires en losange qui bordent ses deux tiers arrière ; la peau blanc rosé, un peu translucide,
   semée de petits points rouge-brun (ses chromatophores), plus serrés sur le dos. La tête et ses deux grands yeux sombres
   au reflet argenté ; le siphon dessous. Huit bras courts, presque droits, serrés en pointe vers l'avant, leurs ventouses ;
   et deux tentacules bien plus longs, terminés par une massue couverte de ventouses.
   Fait dans sa position naturelle (le dos vers +y, les nageoires à plat), puis tourné le dos vers +z : en main, il montre
   son dos et ses nageoires étalées, comme l'image. */
const ENCORNET = {peau: 0xF0DDD6, dos: 0xE2B2A6, ventre: 0xF6EEEA, point: 0x9E3A30, nag: 0xE8C2B8, nagBord: 0xF0D4CC,
  bras: 0xEFCDC2, ventouse: 0xF8EEE6, iris: 0x262A34, cercle: 0xB4BEC8, col: 0xE8C4B8};
const rayonManteau = courbe([[0, .064], [.06, .072], [.2, .075], [.4, .066], [.6, .05], [.8, .029], [1, .005]]);
const ENCORNET_F = corps(-.2, .5, rayonManteau, u => rayonManteau(u) * .94, rayonManteau);
const rayonTete = courbe([[0, .03], [.25, .046], [.6, .052], [1, .047]]);
const TETE_E = corps(-.33, -.17, rayonTete, u => rayonTete(u) * .92, u => rayonTete(u) * 1.05);
let encornetGeo = null;
function encornetFait(){
  if(encornetGeo) return encornetGeo;
  const C = ENCORNET, F = ENCORNET_F, M = [];
  /* les petits points rouge-brun : des sommets tirés au hasard (toujours les mêmes), plus serrés sur le dos */
  const hache = (x, y, z) => { const s = Math.sin(Math.floor(x / .011) * 127.1 + Math.floor(y / .011) * 311.7 + Math.floor(z / .011) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const pointe = (c, x, y, z, densite) => hache(x, y, z) < densite ? melange(c, C.point, .55 + .3 * hache(z, x, y)) : c;
  const peau = (x, y, z, r) => { const h = Math.max(-1, Math.min(1, y / Math.max(.01, r)));
    const c = h > 0 ? melange(C.peau, C.dos, h * .8) : melange(C.peau, C.ventre, -h);
    return pointe(c, x, y, z, .03 + .05 * Math.max(0, h)); };
  /* le manteau, lisse, et son col */
  M.push({geo: corpsGeo(F.x0, F.x1, F.haut, F.bas, F.large, 60, 24), m: new THREE.Matrix4(), c: 0xFFFFFF,
    couleur: (x, y, z) => peau(x, y, z, rayonManteau(F.uDe(x))), ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .06))});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(-.196, 0, 0), q0, V(.013, .067, .072)), c: C.col});
  /* ses petits points rouge-brun, de tailles diverses, serrés sur le dos, rares sur le ventre */
  for(let i = 0; i < 150; i++){
    const u = .04 + .9 * hache(i * .37, 1.3, 2.1), dos = hache(2.7, i * .53, .9), a = dos < .75 ? Math.PI / 2 + (hache(i * .11, 4.4, .3) - .5) * 2.6 : -Math.PI / 2 + (hache(.8, i * .29, 5.5) - .5) * 2.6;
    const s = Math.cos(a) >= 0 ? 1 : -1, a2 = Math.asin(Math.sin(a)), p = F.peau(u, a2, s), n = F.normale(u, a2, s), e = .0022 + .0028 * hache(i * .91, .2, 7.7) * (1 - u * .5);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, .0004), versN(n), V(e, .0008, e * (.8 + .4 * hache(i, 3, 3)))), c: C.point});
  }
  /* la tête, ses grands yeux sombres au reflet argenté, le siphon dessous */
  M.push({geo: corpsGeo(TETE_E.x0, TETE_E.x1, TETE_E.haut, TETE_E.bas, TETE_E.large, 30, 20), m: new THREE.Matrix4(), c: 0xFFFFFF,
    couleur: (x, y, z) => peau(x, y, z, .04), ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .04))});
  oeil(M, TETE_E, {u: .5, a: .12, r: .023, iris: C.iris, cercle: C.cercle, narine: C.peau, uNarine: .6, aNarine: .1});
  ovale(M, C.col, V(-.235, -.042, 0), V(-.19, -.05, 0), .013, .01);
  /* les huit bras, courts et presque droits, serrés en pointe vers l'avant ; leurs ventouses en dessous */
  const coulBras = (x, y, z) => pointe(C.bras, x, y, z, .08);
  for(let k = 0; k < 8; k++){
    const a = (k + .5) / 8 * Math.PI * 2, L = .12 + .035 * Math.max(0, -Math.sin(a)) + .015 * Math.abs(Math.cos(a)), pts = [];
    for(let i = 0; i <= 4; i++){ const t = i / 4, rho = .026 * (1 - .6 * t);
      pts.push(V(-.31 - L * t, rho * Math.sin(a) + .006 * Math.sin(a) * t * t, rho * Math.cos(a) * (1 + .3 * t))); }
    articule(M, pts, .012, .0028, coulBras);
    for(let i = 1; i <= 5; i++){ const t = i / 6, p = pts[0].clone().lerp(pts[4], t), n = V(0, -Math.sin(a), -Math.cos(a));
      M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, .007 * (1 - .6 * t)), versN(n), V(.0026, .0012, .0026)), c: C.ventouse}); }
  }
  /* les deux longs tentacules, de chaque côté dessous, et leur massue couverte de ventouses */
  for(const s of [-1, 1]){
    const pts = [];
    for(let i = 0; i <= 5; i++){ const t = i / 5;
      pts.push(V(-.3 - .22 * t, -.014 - .006 * Math.sin(Math.PI * t), s * (.016 + .026 * Math.sin(Math.PI * t * .8)))); }
    articule(M, pts, .006, .0042, coulBras);
    const bout = pts[5], club = bout.clone().add(V(-.028, 0, -s * .004));
    ovale(M, C.bras, bout.clone().add(V(.004, 0, 0)), club.clone().add(V(-.012, 0, 0)), .013, .008, coulBras);
    for(let i = 0; i < 5; i++){ const p = bout.clone().lerp(club, i / 4).add(V(0, -.006, 0));
      M.push({geo: TACHE, m: new THREE.Matrix4().compose(p, versN(V(0, -1, 0)), V(.0026, .0012, .0026)), c: C.ventouse}); }
  }
  /* les deux longues nageoires en losange, à plat, sur les deux tiers arrière du manteau : lisses, sans rayons */
  const n0 = .04, n1 = F.x1 - .005, r0 = rayonManteau(F.uDe(n0)) - .006, r1 = rayonManteau(F.uDe(n1)) - .002;
  const coulNag = (x, y, z) => pointe(melange(C.nag, C.nagBord, (Math.abs(z) - rayonManteau(F.uDe(x))) / .07), x, y, z, .05);
  for(const s of [-1, 1]){
    const contour = [];
    for(let i = 0; i <= 16; i++){ const t = i / 16, bx = n0 + (n1 - n0) * t, br = r0 + (r1 - r0) * t, f = t < .46 ? Math.pow(t / .46, .9) : (1 - t) / .54;
      contour.push([bx + .03 * f, br + .088 * f]); }
    for(let i = 16; i >= 0; i--){ const t = i / 16; contour.push([n0 + (n1 - n0) * t, r0 + (r1 - r0) * t]); }
    for(const face of [1, -1]){                                  // le dessus et le dessous, un peu écartés
      const forme = new THREE.Shape(contour.map(([x, l]) => new THREE.Vector2(x, -face * s * l)));
      const geo = new THREE.ShapeGeometry(forme).rotateX(-face * Math.PI / 2).translate(0, face * .0018, 0);
      M.push({geo, m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: coulNag});
    }
  }
  const g = fusionner(M);
  g.rotateX(Math.PI / 2);                                         // le dos vers +z
  g.computeBoundingSphere();
  return encornetGeo = g;
}
export const encornetModele = () => modeleDe(encornetFait());

/* ---------- Le maquereau ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici le maquereau »), comme un vrai maquereau (Scomber scombrus ; choix de
   Yo : « A », comme la nature) : le corps fuselé, le museau pointu aux lèvres fines ; la peau lisse et satinée (les écailles
   minuscules) ; le dos bleu-vert barré de fines lignes sombres, presque noires, en zigzag ondulé, du dos jusqu'au milieu du
   flanc ; le ventre argenté, sans taches. Le grand œil sombre cerclé d'argent. Deux nageoires du dos bien séparées, la
   première épineuse ; derrière la seconde et l'anale, les cinq petites pinnules en haut et en bas ; les deux petites crêtes
   de chaque côté avant la queue ; la queue bien fourchue ; la petite pectorale haute ; les nageoires grises. */
const MAQUEREAU_F = corps(-.48, .36,
  courbe([[0, .017], [.05, .04], [.14, .069], [.28, .091], [.42, .095], [.58, .083], [.72, .06], [.86, .034], [1, .019]]),
  courbe([[0, .014], [.05, .034], [.14, .062], [.28, .083], [.42, .086], [.58, .076], [.72, .055], [.86, .032], [1, .017]]),
  courbe([[0, .014], [.06, .031], [.15, .045], [.3, .054], [.45, .054], [.6, .047], [.75, .036], [.9, .023], [1, .018]]));
const MAQUEREAU = {dos: 0x1C5E70, dosVert: 0x3A9488, flanc: 0xC4CED6, ventre: 0xF4F4F0, ligne: 0x0E1820, reflet: 0x8EC0B8,
  tete: 0x24606E, joue: 0xD0D8DC, opercule: 0xA8B4BC, levre: 0xC4CCD0, bouche: 0x6E6468, iris: 0x22262C, cercle: 0xC8D0D6,
  nag: 0x8C969E, nagBord: 0x56606A};
let maquereauGeo = null;
function maquereauFait(){
  if(maquereauGeo) return maquereauGeo;
  const C = MAQUEREAU, F = MAQUEREAU_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* la peau lisse : bleu-vert au dos et ses lignes sombres en zigzag, un reflet vert, argentée au flanc, blanche au ventre */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .4 ? melange(C.dosVert, C.dos, (h - .4) / .4) : h > 0 ? melange(C.flanc, C.dosVert, h / .4) : melange(C.flanc, C.ventre, -h / .6);
    const r = Math.abs(h - .15);
    if(r < .1) c = melange(c, C.reflet, .35 * (1 - r / .1));
    if(u > .27 && u < .95 && h > .08){
      const phase = u * 24 - h * 3 + .5 * Math.sin(h * 10), fr = phase - Math.floor(phase), e = .2 + .08 * Math.min(1, (h - .08) / .3);
      const force = Math.min(1, (h - .08) / .14) * Math.min(1, (u - .27) / .04) * Math.min(1, (.95 - u) / .06);
      if(fr < e) c = melange(c, C.ligne, .85 * force * Math.min(1, 3 * Math.min(fr, e - fr) / e + .3));
    }
    if(u < .27) c = melange(c, h > .25 ? C.tete : C.joue, Math.min(1, (.27 - u) / .05));
    return c;
  };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, LARGE, 150, 28), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .15))});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X1, 0, 0), q0, V(.02, HAUT(1) * .9, LARGE(1) * .9)), c: 0xFFFFFF, couleur: couleurCorps});
  /* l'ouïe : un arc fin derrière l'œil (la peau est lisse : pas d'opercule en relief) */
  for(const s of [-1, 1]) for(let k = 0; k < 12; k++){ const a0 = -1 + k * .18, a1 = a0 + .18;
    baton(M, C.opercule, F.peau(.25 + .035 * Math.cos(a0 * .9), a0, s).addScaledVector(F.normale(.25, a0, s), .0006), F.peau(.25 + .035 * Math.cos(a1 * .9), a1, s).addScaledVector(F.normale(.25, a1, s), .0006), .0018); }
  oeil(M, F, {u: .13, a: .42, r: .034, iris: C.iris, cercle: C.cercle, narine: 0x2A4A56, uNarine: .06, aNarine: .6});
  /* le museau pointu, les lèvres fines, la bouche jusque sous l'œil */
  ovale(M, C.levre, V(X0 - .004, .001, 0), V(X0 + .08, -.006, 0), .014, .005);
  ovale(M, C.levre, V(X0 + .002, -.012, 0), V(X0 + .08, -.014, 0), .013, .005);
  ovale(M, C.bouche, V(X0 + .002, -.0055, 0), V(X0 + .075, -.009, 0), .011, .0025);
  const nagC = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 1.6));
  /* la première nageoire du dos : épineuse, triangulaire */
  const d0 = -.13, d1 = -.01, y0 = HAUT(uDe(d0)) - .008, y1 = HAUT(uDe(d1)) - .008, hD = .11;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), f = t < .12 ? .55 + .45 * t / .12 : 1 - .92 * (t - .12) / .88;
    return V(b.x + .02 + .04 * f, b.y + .004 + hD * f, 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 14), new THREE.Matrix4(), nagC(y0, 1, hD));
  for(let k = 0; k <= 9; k++){ const t = k / 9 * .9, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t);
    baton(M, C.nagBord, b, e.clone().add(e.clone().sub(b).multiplyScalar(.05)), .0024); }
  /* la seconde nageoire du dos et l'anale, petites, en face */
  const petite = (x0, x1, sens, h) => { const yA = sens * ((sens > 0 ? HAUT : BAS)(uDe(x0)) - .006), yB = sens * ((sens > 0 ? HAUT : BAS)(uDe(x1)) - .005);
    nageoire(M, nageoireGeo(V(x0, yA, 0), V(x1, yB, 0), t => { const b = V(x0, yA, 0).lerp(V(x1, yB, 0), t), f = t < .2 ? .5 + .5 * t / .2 : 1 - .75 * (t - .2) / .8;
      return V(b.x + .02 + .03 * f, b.y + sens * (.004 + h * f), 0); }, 10), new THREE.Matrix4(), nagC(yA, sens, h)); };
  petite(.07, .13, 1, .055);
  petite(.09, .15, -1, .05);
  /* les cinq pinnules en haut et en bas, jusqu'à la queue */
  for(let k = 0; k < 5; k++){ const x = .165 + k * .03, w = .014;
    for(const sens of [1, -1]){ const yA = sens * ((sens > 0 ? HAUT : BAS)(uDe(x)) - .004), yB = sens * ((sens > 0 ? HAUT : BAS)(uDe(x + w)) - .004);
      nageoire(M, nageoireGeo(V(x, yA, 0), V(x + w, yB, 0), t => V(x + w * t + .014 * (1 - t * .5), yA + (yB - yA) * t + sens * .018 * (1 - t), 0), 4, .004), new THREE.Matrix4(), nagC(yA, sens, .018)); }
  }
  /* les deux petites crêtes de chaque côté, avant la queue */
  for(const s of [-1, 1]) for(const a of [.28, -.28]){ const p0 = F.peau(.9, a, s), p1 = F.peau(.99, a, s);
    ovale(M, C.dos, p0.add(V(0, 0, s * .003)), p1.add(V(0, 0, s * .003)), .004, .0035); }
  /* la queue bien fourchue */
  const qx = X1 - .012;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .32, fourche = .025 + .15 * Math.pow(lobe, .8);
    return V(qx + fourche + .015, y * (.72 + .28 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .022, 0), V(qx, -.022, 0), bordQ, 24), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .32)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return melange(C.nag, C.nagBord, Math.pow(Math.max(0, Math.min(1, k)), 1.5)); });
  /* les ventrales, sous les pectorales */
  const peX = -.17;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .01, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.02, 0, 0), V(.015, 0, 0), t => V(.02 + t * .05, -.055 + t * .045, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .07));
  }
  /* la petite pectorale, haute, juste derrière l'ouïe */
  for(const s of [-1, 1]){
    const p = F.peau(.3, .22, s);
    const g = nageoireGeo(V(0, .014, 0), V(0, -.014, 0), t => V(.1 - Math.abs(t - .25) * .06, .004 - t * .035, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .008), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .12));
  }
  return maquereauGeo = fusionner(M);
}
export const maquereauModele = () => modeleDe(maquereauFait());

/* ---------- Le lieu jaune ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici le lieu jaune »), comme un vrai lieu jaune (Pollachius pollachius ; choix
   de Yo : « A », comme la nature) : le corps allongé de la famille de la morue ; le dos brun olive, les flancs dorés, le
   ventre blanc grisé ; de petites écailles. Sa marque : la ligne latérale sombre, qui fait une courbe au-dessus de la
   nageoire de côté puis file droit vers la queue. Les lèvres fines, la mâchoire du bas qui dépasse nettement ; pas de
   barbillon ; l'œil doré pâle et argenté. Trois nageoires sur le dos, deux dessous (la première longue, qui commence sous
   la première du dos) ; les ventrales sous la gorge ; la queue presque droite ; les nageoires brun olive, plus sombres au
   bord. Fait comme le merlan (merlanFait), son cousin. */
const LIEU_F = corps(-.5, .38,
  courbe([[0, .018], [.05, .044], [.14, .076], [.28, .097], [.42, .102], [.58, .093], [.72, .074], [.86, .051], [1, .032]]),
  courbe([[0, .012], [.05, .032], [.14, .058], [.28, .079], [.42, .084], [.58, .076], [.72, .06], [.86, .041], [1, .028]]),
  courbe([[0, .012], [.06, .024], [.15, .038], [.28, .048], [.42, .05], [.58, .046], [.72, .037], [.86, .027], [1, .019]]));
const LIEU = {dos: 0x54461E, dosClair: 0x8A7430, flanc: 0xC6A646, ventre: 0xECE6D8, ligne: 0x3A3016, tete: 0x6A5A28,
  joue: 0xD8CCA4, opercule: 0xA8945A, iris: 0xC8B272, cercle: 0x8E8668, levre: 0xC8BC98, bouche: 0x7A5E4A,
  nag: 0xA48C54, nagBord: 0x6A5A2E};
let lieuGeo = null;
function lieuFait(){
  if(lieuGeo) return lieuGeo;
  const C = LIEU, F = LIEU_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* le corps : brun olive au dos, doré aux flancs, blanc grisé au ventre ; la ligne latérale sombre, en courbe au-dessus
     de la nageoire de côté puis droite vers la queue ; la tête lisse */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .55 ? melange(C.dosClair, C.dos, (h - .55) / .35) : h > -.05 ? melange(C.flanc, C.dosClair, (h + .05) / .6) : melange(C.flanc, C.ventre, (-.05 - h) / .35);
    if(u < .27) c = melange(c, h > .2 ? C.tete : C.joue, Math.min(1, (.27 - u) / .08));
    return c;
  };
  peauEtEcailles(M, F, couleurCorps, {u0: .29, u1: .97, nu: 16, na: 10, taille: .03, relief: .0011});
  opercule(M, F, C.opercule, .26, .05);
  /* la ligne latérale sombre, posée sur les écailles : en courbe au-dessus de la nageoire de côté, puis droite */
  const hLigne = u => .18 + .38 * Math.exp(-Math.pow((u - .36) / .13, 2)) + .1 * (1 - u);
  for(const s of [-1, 1]) for(let u = .27; u < .965; u += .023){ const u2 = Math.min(.975, u + .023), a1 = Math.asin(hLigne(u)), a2 = Math.asin(hLigne(u2));
    baton(M, C.ligne, F.peau(u, a1, s).addScaledVector(F.normale(u, a1, s), .0035), F.peau(u2, a2, s).addScaledVector(F.normale(u2, a2, s), .0035), .0026); }
  oeil(M, F, {u: .15, a: .42, r: .034, iris: C.iris, cercle: C.cercle, narine: 0x3A3016, uNarine: .07, aNarine: .6});
  /* les lèvres fines, la mâchoire du bas qui dépasse nettement en avant ; la fente de la bouche */
  ovale(M, C.levre, V(X0 + .006, .002, 0), V(X0 + .08, -.003, 0), .015, .005);
  ovale(M, C.levre, V(X0 - .02, -.008, 0), V(X0 + .08, -.014, 0), .015, .0055);
  ovale(M, C.bouche, V(X0 - .008, -.004, 0), V(X0 + .075, -.008, 0), .012, .003);
  const couleurNag = (y0, sens, h) => (x, y) => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (y - y0) * sens / h), 2.2));
  /* une nageoire du dos ou de dessous, de xa à xb, de hauteur h (sens : 1 en haut, −1 en bas), penchée vers l'arrière */
  const nag = (xa, xb, h, sens, n = 12) => {
    const ya = sens > 0 ? HAUT(uDe(xa)) - .008 : -BAS(uDe(xa)) + .008, yb = sens > 0 ? HAUT(uDe(xb)) - .008 : -BAS(uDe(xb)) + .008;
    nageoire(M, nageoireGeo(V(xa, ya, 0), V(xb, yb, 0), t => { const b = V(xa, ya, 0).lerp(V(xb, yb, 0), t);
      const f = t < .12 ? .25 + .75 * t / .12 : 1 - .82 * (t - .12) / .88;   // le bord avant raide, le haut pointu, puis droit jusqu'à l'arrière
      return V(b.x + .02 + .05 * f + t * .015, b.y + sens * (.008 + h * f), 0); }, n),
      new THREE.Matrix4(), couleurNag(ya, sens, h));
  };
  /* trois nageoires sur le dos, la première la plus haute */
  nag(-.19, -.05, .1, 1);
  nag(-.02, .14, .08, 1, 14);
  nag(.17, .28, .065, 1);
  /* deux dessous : la première longue, qui commence sous la première du dos ; la seconde en face de la troisième du dos */
  nag(-.13, .13, .06, -1, 16);
  nag(.17, .28, .06, -1);
  /* la queue presque droite, à peine échancrée */
  const qx = X1 - .015;
  nageoire(M, nageoireGeo(V(qx, .034, 0), V(qx, -.034, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .38;
      return V(qx + .12 + .05 * lobe, y * (.8 + .2 * lobe), 0); }, 20),
    new THREE.Matrix4(), x => melange(C.nag, C.nagBord, Math.pow(Math.max(0, (x - qx) / .14), 2)));
  /* les ventrales : sous la gorge, devant les pectorales, petites et pointues */
  const peX = -.31;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .01, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.025, 0, 0), V(.02, 0, 0), t => V(.01 + t * .06, -.085 + t * .065, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.nag, C.nagBord, (pY - y) / .1));
  }
  /* les pectorales, derrière l'opercule (sans tache : elle est au merlan) */
  for(const s of [-1, 1]){
    const p = F.peau(.3, -.1, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.19 - Math.abs(t - .3) * .12, -.06 + t * .08, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x + .006, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.nag, C.nagBord, (x - p.x) / .2));
  }
  return lieuGeo = fusionner(M);
}
export const lieuJauneModele = () => modeleDe(lieuFait());

/* ---------- Le thon ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici le thon »), comme un vrai thon rouge (Thunnus thynnus ; choix de Yo :
   « A », comme la nature ; son image, aux nageoires toutes jaunes, ressemblait au thon albacore) : le corps énorme, épais et
   fuselé, le pédoncule fin ; la peau lisse et brillante (les écailles minuscules) ; le dos bleu nuit, les flancs et le
   ventre argentés. Le museau pointu, la petite bouche aux lèvres fines ; l'œil sombre cerclé d'argent. La première nageoire
   du dos épineuse, basse, gris-bleu sombre ; la seconde, en faucille, brun-rouge ; l'anale gris argenté ; les pinnules
   jaunes bordées de noir, en haut et en bas jusqu'à la queue ; la grosse crête de chaque côté avant la queue ; la queue en
   croissant de lune, gris foncé ; la nageoire de côté courte et sombre. Fait comme le maquereau (maquereauFait), son
   cousin. */
const THON_F = corps(-.48, .36,
  courbe([[0, .02], [.05, .055], [.14, .1], [.28, .134], [.42, .14], [.58, .122], [.72, .088], [.86, .046], [1, .016]]),
  courbe([[0, .016], [.05, .048], [.14, .09], [.28, .124], [.42, .13], [.58, .11], [.72, .078], [.86, .04], [1, .014]]),
  courbe([[0, .016], [.06, .04], [.15, .064], [.3, .08], [.45, .08], [.6, .068], [.75, .05], [.9, .03], [1, .02]]));
const THON = {dos: 0x16215A, dosClair: 0x30509A, flanc: 0xC4CAD6, ventre: 0xF2F2F4, reflet: 0x92AAD2, tete: 0x1E2C66,
  joue: 0xD0D6DE, opercule: 0xA8B2C2, levre: 0xC4CAD2, bouche: 0x6A6070, iris: 0x22262E, cercle: 0xC8D0DA,
  dorsale: 0x3A4458, dorsaleBord: 0x222838, seconde: 0x7C4A3A, secondeBord: 0x4E2C24, anale: 0xAAB0BA, analeBord: 0x707884,
  pinnule: 0xE6C232, pinnuleBord: 0x1A1A16, queue: 0x3A4256, queueBord: 0x1E2232, pecto: 0x2E3646, pectoBord: 0x1A2030};
let thonGeo = null;
function thonFait(){
  if(thonGeo) return thonGeo;
  const C = THON, F = THON_F, M = [], X0 = F.x0, X1 = F.x1, uDe = F.uDe, HAUT = F.haut, BAS = F.bas, LARGE = F.large;
  /* la peau lisse : bleu nuit au dos, un reflet bleuté, argentée aux flancs, blanche au ventre */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = F.h(x, y);
    let c = h > .45 ? melange(C.dosClair, C.dos, (h - .45) / .35) : h > .1 ? melange(C.flanc, C.dosClair, (h - .1) / .35) : melange(C.flanc, C.ventre, (.1 - h) / .7);
    const r = Math.abs(h - .2);
    if(r < .12) c = melange(c, C.reflet, .3 * (1 - r / .12));
    if(u < .26) c = melange(c, h > .3 ? C.tete : C.joue, Math.min(1, (.26 - u) / .05));
    return c;
  };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, LARGE, 80, 28), m: new THREE.Matrix4(), c: 0xFFFFFF, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .16))});
  M.push({geo: ROND, m: new THREE.Matrix4().compose(V(X1, 0, 0), q0, V(.02, HAUT(1) * .9, LARGE(1) * .9)), c: 0xFFFFFF, couleur: couleurCorps});
  /* l'ouïe : un arc fin derrière l'œil */
  for(const s of [-1, 1]) for(let k = 0; k < 12; k++){ const a0 = -1 + k * .18, a1 = a0 + .18;
    baton(M, C.opercule, F.peau(.24 + .035 * Math.cos(a0 * .9), a0, s).addScaledVector(F.normale(.24, a0, s), .0006), F.peau(.24 + .035 * Math.cos(a1 * .9), a1, s).addScaledVector(F.normale(.24, a1, s), .0006), .002); }
  oeil(M, F, {u: .12, a: .4, r: .03, iris: C.iris, cercle: C.cercle, narine: 0x1E2C66, uNarine: .055, aNarine: .6});
  /* le museau pointu, la petite bouche aux lèvres fines */
  ovale(M, C.levre, V(X0 - .003, .001, 0), V(X0 + .06, -.006, 0), .014, .005);
  ovale(M, C.levre, V(X0 + .002, -.012, 0), V(X0 + .06, -.014, 0), .013, .005);
  ovale(M, C.bouche, V(X0 + .002, -.0055, 0), V(X0 + .055, -.009, 0), .011, .0025);
  const nagC = (y0, sens, h, a, b) => (x, y) => melange(a, b, Math.pow(Math.max(0, (y - y0) * sens / h), 1.4));
  /* la première nageoire du dos : épineuse, basse, gris-bleu sombre */
  const d0 = -.14, d1 = -.02, y0 = HAUT(uDe(d0)) - .008, y1 = HAUT(uDe(d1)) - .008, hD = .075;
  const bordD = t => { const b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), f = t < .1 ? .6 + .4 * t / .1 : 1 - .9 * (t - .1) / .9;
    return V(b.x + .02 + .03 * f, b.y + .004 + hD * f, 0); };
  nageoire(M, nageoireGeo(V(d0, y0, 0), V(d1, y1, 0), bordD, 14), new THREE.Matrix4(), nagC(y0, 1, hD, C.dorsale, C.dorsaleBord));
  for(let k = 0; k <= 10; k++){ const t = k / 10 * .92, b = V(d0, y0, 0).lerp(V(d1, y1, 0), t), e = bordD(t);
    baton(M, C.dorsaleBord, b, e.clone().add(e.clone().sub(b).multiplyScalar(.05)), .0024); }
  /* la seconde nageoire du dos (brun-rouge) et l'anale (gris argenté), en faucille, en face */
  const faucille = (x0, x1, sens, h, a, b) => { const yA = sens * ((sens > 0 ? HAUT : BAS)(uDe(x0)) - .007), yB = sens * ((sens > 0 ? HAUT : BAS)(uDe(x1)) - .006);
    nageoire(M, nageoireGeo(V(x0, yA, 0), V(x1, yB, 0), t => { const p = V(x0, yA, 0).lerp(V(x1, yB, 0), t), f = t < .25 ? .6 + .4 * t / .25 : 1 - .85 * Math.pow((t - .25) / .75, .6);
      return V(p.x + .03 + .07 * f * f, p.y + sens * (.004 + h * f), 0); }, 12), new THREE.Matrix4(), nagC(yA, sens, h, a, b)); };
  faucille(.04, .11, 1, .11, C.seconde, C.secondeBord);
  faucille(.07, .13, -1, .1, C.anale, C.analeBord);
  /* les pinnules jaunes bordées de noir : 8 en haut, 7 en bas, jusqu'à la queue */
  for(const [sens, n, x0] of [[1, 8, .14], [-1, 7, .165]]) for(let k = 0; k < n; k++){
    const x = x0 + k * (.32 - x0) / n, w = .016, yA = sens * ((sens > 0 ? HAUT : BAS)(uDe(x)) - .004), yB = sens * ((sens > 0 ? HAUT : BAS)(uDe(x + w)) - .004);
    nageoire(M, nageoireGeo(V(x, yA, 0), V(x + w, yB, 0), t => V(x + w * t + .016 * (1 - t * .5), yA + (yB - yA) * t + sens * .025 * (1 - t), 0), 4, .004),
      new THREE.Matrix4(), nagC(yA, sens, .025, C.pinnule, C.pinnuleBord));
  }
  /* la grosse crête de chaque côté avant la queue, et les deux petites sur la queue */
  for(const s of [-1, 1]){
    ovale(M, C.dos, F.peau(.87, 0, s).add(V(0, 0, s * .002)), F.peau(1, 0, s).add(V(.02, 0, s * .006)), .009, .006);
    for(const a of [.35, -.35]) ovale(M, C.queue, V(X1 + .005, Math.sin(a) * .014, s * .01), V(X1 + .03, Math.sin(a) * .016, s * .006), .003, .0025);
  }
  /* la queue en croissant de lune, gris foncé */
  const qx = X1 - .008;
  const bordQ = t => { const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .5, fourche = .02 + .19 * Math.pow(lobe, .7);
    return V(qx + fourche + .012, y * (.55 + .45 * lobe), 0); };
  nageoire(M, nageoireGeo(V(qx, .016, 0), V(qx, -.016, 0), bordQ, 26), new THREE.Matrix4(), (x, y) => {
    const t = Math.max(0, Math.min(1, .5 - y / .5)), e = bordQ(t), k = (x - qx) / Math.max(.02, e.x - qx);
    return melange(C.queue, C.queueBord, Math.pow(Math.max(0, Math.min(1, k)), 1.3)); });
  /* les ventrales, petites, sous les pectorales */
  const peX = -.2;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .012, base = s * LARGE(uDe(peX)) * .45;
    const g = nageoireGeo(V(-.02, 0, 0), V(.015, 0, 0), t => V(.02 + t * .045, -.05 + t * .04, 0), 8);
    nageoire(M, g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.3, 0, 0), V(1, 1, 1)), (x, y) => melange(C.anale, C.analeBord, (pY - y) / .06));
  }
  /* la nageoire de côté, courte et sombre */
  for(const s of [-1, 1]){
    const p = F.peau(.29, .1, s);
    const g = nageoireGeo(V(0, .016, 0), V(0, -.016, 0), t => V(.1 - Math.abs(t - .25) * .06, .002 - t * .04, 0), 10);
    nageoire(M, g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .008), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.pecto, C.pectoBord, (x - p.x) / .11));
  }
  return thonGeo = fusionner(M);
}
export const thonModele = () => modeleDe(thonFait());

/* ---------- La raie ----------
   D'après l'image de Yo (7 novembre 2026 : « Voici la raie »), comme une vraie raie bouclée (Raja clavata ; choix de Yo :
   « A », comme la nature) : le corps plat en losange, le museau court et pointu, le bord lisse (de la même peau que le dos) ;
   le dos brun sable semé de taches claires et sombres, le ventre blanc. Sur le dos, la rangée d'épines du milieu jusqu'au
   bout de la queue, et ses « boucles » semées ici et là : de grosses épines sur un bouton rond (son nom). Les deux yeux
   gris-brun sur le dessus, et juste derrière les deux petits trous ronds (les évents) ; les nageoires arrondies de chaque
   côté de la queue ; la queue annelée de clair et de sombre, ses deux petites nageoires près du bout.
   Faite à plat (le dos vers +y), puis tournée le dos vers +z : en main, elle montre son dos, comme l'image. */
const RAIE = {dos: 0x96704C, dosClair: 0xAA845E, ventre: 0xF0E6DA, clair: 0xE6CC9C, sombre: 0x6A4630, epine: 0xF2E2C2,
  bouton: 0xC8A478, iris: 0x7A6A54, cercle: 0x5A4A36, event: 0x2E2018, anneau: 0x7A5434, nag: 0xB08050};
const RAIE_F = corps(-.34, .2,
  courbe([[0, .004], [.15, .016], [.3, .03], [.45, .04], [.65, .038], [.85, .032], [1, .026]]),
  courbe([[0, .003], [.15, .01], [.3, .018], [.45, .024], [.65, .024], [.85, .022], [1, .02]]),
  courbe([[0, .006], [.1, .07], [.25, .175], [.4, .27], [.48, .3], [.56, .29], [.7, .245], [.85, .16], [1, .045]]));
const QUEUE_R = courbe([[0, .03], [.15, .022], [.5, .014], [.85, .009], [1, .004]]);
const RAIE_Q = corps(.16, .62, u => QUEUE_R(u), u => QUEUE_R(u) * .8, u => QUEUE_R(u) * 1.25);
let raieGeo = null;
function raieFait(){
  if(raieGeo) return raieGeo;
  const C = RAIE, F = RAIE_F, Q = RAIE_Q, M = [];
  const hache = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  /* le disque : brun sable dessus, un peu plus clair vers le bord, blanc dessous */
  M.push({geo: corpsGeo(F.x0, F.x1, F.haut, F.bas, F.large, 64, 40), m: new THREE.Matrix4(), c: 0xFFFFFF,
    couleur: (x, y, z) => { if(y < -.002) return C.ventre; const l = F.large(F.uDe(x)); return melange(C.dos, C.dosClair, Math.pow(Math.abs(z) / Math.max(.01, l), 3)); },
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .03))});
  /* un point du dos : u le long du disque, f de −1 à 1 en travers */
  const surDos = (u, f) => { const s = f < 0 ? -1 : 1, a = Math.acos(Math.min(.98, Math.abs(f))); return [F.peau(u, a, s), F.normale(u, a, s)]; };
  /* les taches claires et sombres, de tailles diverses */
  for(let i = 0; i < 130; i++){
    const u = .12 + .85 * hache(i, 1.7), f = (hache(i, 5.3) * 2 - 1) * .9, sombre = hache(i, 9.1) < .45;
    const [p, n] = surDos(u, f), e = sombre ? .007 + .008 * hache(i, 2.2) : .0045 + .004 * hache(i, 3.3);
    M.push({geo: TACHE, m: new THREE.Matrix4().compose(p.addScaledVector(n, .0003), versN(n), V(e, .0006, e)), c: sombre ? C.sombre : C.clair});
  }
  /* la rangée d'épines du milieu, du dos jusqu'au bout de la queue */
  const EPINE = new THREE.ConeGeometry(1, 1, 6).translate(0, .5, 0);
  for(let x = -.17; x < .6; x += .028){
    const sur = x < .17 ? F.haut(F.uDe(x)) : Q.haut(Q.uDe(x)), h = x < .17 ? .02 : .016 * (1 - (x - .17) / .7);
    M.push({geo: EPINE, m: new THREE.Matrix4().compose(V(x, sur - .003, 0), tourne(0, 0, -.35), V(.0055, h, .0055)), c: C.epine});
  }
  /* les « boucles » : de grosses épines sur un bouton rond, semées sur le dos */
  for(let i = 0; i < 16; i++){
    const u = .3 + .62 * hache(i, 12.5), f = (hache(i, 7.7) < .5 ? -1 : 1) * (.15 + .55 * hache(i, 4.4)), [p, n] = surDos(u, f);
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(p.clone(), versN(n), V(.014, .004, .014)), c: C.bouton});
    M.push({geo: EPINE, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .001), versN(n), V(.006, .022, .006)), c: C.epine});
  }
  /* les yeux gris-brun sur le dessus, sur leur bosse, et les évents juste derrière */
  for(const s of [-1, 1]){
    const [p, n] = surDos(.3, s * .17);
    M.push({geo: ROND, m: new THREE.Matrix4().compose(p.clone(), versN(n), V(.024, .012, .019)), c: C.dos});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .008), versN(n), V(.014, .007, .012)), c: C.cercle});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .0105), versN(n), V(.0118, .006, .0098)), c: C.iris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(p.clone().addScaledVector(n, .013), versN(n), V(.0068, .004, .0032)), c: 0x141010});
    const [q, m] = surDos(.36, s * .2);
    M.push({geo: ROND, m: new THREE.Matrix4().compose(q.addScaledVector(m, .0005), versN(m), V(.009, .003, .0075)), c: C.event});
  }
  /* les nageoires arrondies de chaque côté de la queue */
  for(const s of [-1, 1]) M.push({geo: ROND, m: new THREE.Matrix4().compose(V(.2, -.004, s * .055), tourne(0, s * .4, 0), V(.055, .008, .035)), c: C.dos});
  /* la queue, annelée de clair et de sombre */
  M.push({geo: corpsGeo(Q.x0, Q.x1, Q.haut, Q.bas, Q.large, 50, 12), m: new THREE.Matrix4(), c: 0xFFFFFF,
    couleur: (x, y) => { if(y < -.004) return C.ventre; const k = (x - .2) / .045; return k > 0 && k - Math.floor(k) < .4 ? C.anneau : C.dos; }});
  /* ses deux petites nageoires près du bout, sur le dessus */
  for(const x0 of [.5, .555]){
    const y0 = Q.haut(Q.uDe(x0)) - .002, x1 = x0 + .035, y1 = Q.haut(Q.uDe(x1)) - .002;
    nageoire(M, nageoireGeo(V(x0, y0, 0), V(x1, y1, 0), t => { const a = Math.PI * t; return V(x0 + .035 * t + .008 * Math.sin(a), y0 + (y1 - y0) * t + .022 * Math.sin(a), 0); }, 10, .003),
      new THREE.Matrix4(), () => C.nag);
  }
  const g = fusionner(M);
  g.rotateX(Math.PI / 2 - .4);                                    // le dos vers +z, un peu penchée : ses épines se voient de profil
  g.computeBoundingSphere();
  return raieGeo = g;
}
export const raieModele = () => modeleDe(raieFait());

/* Les poissons refaits d'après les images de Yo (peche.js, icones.js) : fabrique() rend le modèle ; echelle le met à la taille
   des anciens poissons */
export const MODELES_POISSONS = {gardon: {fabrique: gardonModele, echelle: 1}, perche: {fabrique: percheModele, echelle: 1},
  tanche: {fabrique: tancheModele, echelle: 1}, carpe: {fabrique: carpeModele, echelle: 1},
  brochet: {fabrique: brochetModele, echelle: 1},
  anguille: {fabrique: anguilleModele, echelle: 1},
  carpeOr: {fabrique: carpeOrModele, echelle: 1},
  silure: {fabrique: silureModele, echelle: 1.15},   // le plus grand de l'étang : un peu plus grand en main
  rouget: {fabrique: rougetModele, echelle: 1},
  merlan: {fabrique: merlanModele, echelle: 1},
  bar: {fabrique: barModele, echelle: 1},
  sole: {fabrique: soleModele, echelle: 1},
  dorade: {fabrique: doradeModele, echelle: 1},
  sardine: {fabrique: sardineModele, echelle: 1},
  mulet: {fabrique: muletModele, echelle: 1},
  orphie: {fabrique: orphieModele, echelle: 1},
  congre: {fabrique: congreModele, echelle: 1},
  encornet: {fabrique: encornetModele, echelle: 1.4},   // petit (15 à 40 cm) : un peu plus grand en main
  maquereau: {fabrique: maquereauModele, echelle: 1},
  lieuJaune: {fabrique: lieuJauneModele, echelle: 1},
  thon: {fabrique: thonModele, echelle: 1},
  raie: {fabrique: raieModele, echelle: 1},
  koi: {fabrique: koiModele, echelle: 1, couleurs: KOI_COULEURS},   // fabrique(couleur) : une des dix variétés (Kohaku si rien)
  ecrevisse: {fabrique: ecrevisseModele, echelle: 1.35}};   // l'écrevisse, petite (8 à 15 cm) : un peu plus grande en main, pour bien la voir
