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
const boule = (M, c, x, y, z, sx, sy, sz, geo = ROND, q = q0) => M.push({geo, m: new THREE.Matrix4().compose(V(x, y, z), q, V(sx, sy, sz)), c});
const tourne = (rx, ry, rz) => new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
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

/* ---------- Le gardon ----------
   D'après l'image de Yo (5 novembre 2026 : « Je t'envoie le gardon »), comme un vrai gardon (Rutilus rutilus) : le corps
   argenté, assez haut et un peu aplati sur les côtés, le dos un peu doré (vert-olive chez le vrai, doré sur l'image), le
   ventre blanc nacré ; de grandes écailles bien rangées ; l'œil rouge, cerclé d'or (vrai : c'est sa marque) ; la petite
   bouche au bout du museau, l'opercule bien dessiné. Les nageoires comme la nature (choix de Yo) : celles du ventre et celle
   de dessous rouge orangé, les pectorales orange pâle, la nageoire du dos et la queue fourchue gris-brun teintées de rouge. */
const X0 = -.45, X1 = .33;                               // du bout du museau au pédoncule de la queue
const r0 = u => Math.sqrt(Math.min(1, u / .05 + .12));   // le museau arrondi
const HAUT = u => (.045 * u + .14 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .62)))) * r0(u) + .014;
const BAS = u => (.042 * u + .13 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .7)))) * r0(u) + .014;
const LARGE = u => (.018 * u + .068 * Math.sin(Math.PI * Math.min(1, Math.pow(u, .55)))) * r0(u) + .01;
const uDe = x => Math.max(0, Math.min(1, (x - X0) / (X1 - X0)));
/* un point de la peau (u : le long du corps ; a : l'angle autour, 0 sur le flanc, π/2 sur le dos ; s : le côté ±1) et sa
   normale */
function peau(u, a, s){
  const sn = Math.sin(a), y = sn > 0 ? HAUT(u) * sn : BAS(u) * sn;
  return V(X0 + (X1 - X0) * u, y, s * LARGE(u) * Math.cos(a));
}
function normale(u, a, s){
  const d = .01, p = peau(u, a, s), pu = peau(Math.min(1, u + d), a, s).sub(peau(Math.max(0, u - d), a, s)), pa = peau(u, a + d, s).sub(peau(u, a - d, s));
  const n = pu.cross(pa).normalize();
  if(n.dot(V(0, p.y, p.z)) < 0) n.negate();
  return n;
}
const GARDON = {dos: 0x86826A, dosOr: 0xADA27E, flanc: 0xB6BBBD, ventre: 0xDEDCD6, tete: 0xBCAE8A, joue: 0xDCD4C2,
  opercule: 0xA4946C, iris: 0xC8321C, orIris: 0xE0B040, prunelle: 0x141010, levre: 0xE6D2AE,
  rouge: 0xD8482A, rougeBout: 0xEC7448, pale: 0xE89A6A, gris: 0x7C5C50, grisRouge: 0x9A5E4C};
let gardonGeo = null;
function gardonFait(){
  if(gardonGeo) return gardonGeo;
  const C = GARDON, M = [];
  /* le corps : le dos doré-olive, les flancs argentés, le ventre blanc nacré ; la tête un peu dorée */
  const couleurCorps = (x, y) => {
    const u = uDe(x), h = y >= 0 ? y / HAUT(u) : -y / BAS(u), haut = y >= 0;
    let c = haut ? (h > .55 ? melange(C.dosOr, C.dos, (h - .55) / .45) : melange(C.flanc, C.dosOr, h / .55)) : melange(C.flanc, C.ventre, h * 1.4);
    if(u < .3) c = melange(c, haut ? C.tete : C.joue, (.3 - u) / .12);   // la tête, lisse et dorée
    return c;
  };
  M.push({geo: corpsGeo(X0, X1, HAUT, BAS, LARGE), m: new THREE.Matrix4(), c: C.flanc, couleur: couleurCorps,
    ombre: (x, y) => .92 + .12 * Math.max(-1, Math.min(1, y / .15))});          // l'ombre douce peinte : le dessous plus sombre
  boule(M, C.flanc, X1, 0, 0, .03, .05, .025);                                     // le bout du pédoncule, sous la queue
  /* les écailles : des rangées en quinconce, du bord de l'opercule au pédoncule, du dos au ventre */
  const nu = 13, na = 11;
  for(const s of [-1, 1]) for(let i = 0; i < nu; i++) for(let j = 0; j < na; j++){
    const u = .33 + (i + (j % 2) * .5) / nu * .64, a = -1.2 + j / (na - 1) * 2.65;
    if(u > .97) continue;
    const p = peau(u, a, s), n = normale(u, a, s), t = Math.min(HAUT(u), BAS(u)) / .16;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
    const taille = .033 * Math.max(.45, Math.min(1.1, t));
    const y = p.y;
    M.push({geo: ECAILLE, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.0008), q, V(taille * 1.1, .0034, taille * .95)),
      c: couleurCorps(p.x, y)});
  }
  /* l'opercule : l'arc doré qui ferme les ouïes, derrière l'œil */
  for(const s of [-1, 1]) for(let k = 0; k < 18; k++){
    const a = -1.0 + k / 17 * 2.05, u = .26 + .045 * Math.cos(a * .9), p = peau(u, a, s), n = normale(u, a, s);
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(p.addScaledVector(n, -.002), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n), V(.009, .005, .016)), c: C.opercule});
  }
  /* l'œil : grand, l'iris rouge cerclé d'or, la prunelle noire, le reflet ; la narine ; la petite bouche */
  for(const s of [-1, 1]){
    const u = .13, a = .3, p = peau(u, a, s), n = normale(u, a, s), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), n);
    const o = p.clone();
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.011), q, V(.046, .018, .046)), c: C.orIris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.007), q, V(.04, .018, .04)), c: C.iris});
    M.push({geo: ROND, m: new THREE.Matrix4().compose(o.clone().addScaledVector(n, -.004), q, V(.023, .017, .023)), c: C.prunelle});
    const r = o.clone().addScaledVector(n, .012); r.x -= .006; r.y += .008;
    M.push({geo: BOULE_P, m: new THREE.Matrix4().compose(r, q, V(.008, .003, .008)), c: 0xFFFFFF});
    const nar = peau(.045, .55, s); boule(M, 0x6A5A40, nar.x, nar.y, nar.z, .006, .006, .006, BOULE_P);
  }
  boule(M, C.levre, X0 + .008, -.012, 0, .02, .016, .03);                         // les lèvres, au bout du museau
  boule(M, 0x8A6E50, X0 - .004, -.016, 0, .008, .004, .022, BOULE_P);             // la fente de la bouche
  /* les nageoires */
  const fin = (geo, m, couleur) => M.push({geo, m, c: 0xFFFFFF, couleur});
  /* la nageoire du dos : haute, triangulaire, gris-brun teinté de rouge, plus rouge au bord */
  const dosX = -.02, dosY = HAUT(uDe(dosX)) - .01;
  fin(nageoireGeo(V(dosX - .1, dosY, 0), V(dosX + .1, dosY - .035, 0), t => V(dosX - .03 + t * .2, dosY + .16 - t * .14, 0).lerp(V(dosX + .12, dosY - .02, 0), t * t * .4)),
    new THREE.Matrix4(), (x, y) => melange(C.gris, C.grisRouge, (y - dosY) / .18));
  /* la queue fourchue : deux lobes, gris-brun teinté de rouge, rouge au bord */
  const qx = X1 - .015;
  fin(nageoireGeo(V(qx, .045, 0), V(qx, -.045, 0), t => {
      const lobe = t < .5 ? (.5 - t) * 2 : (t - .5) * 2, y = (.5 - t) * .5, fourche = .1 + .19 * Math.pow(lobe, .8);
      return V(qx + fourche + .03, y * (.8 + .2 * lobe), 0); }, 22),
    new THREE.Matrix4(), x => melange(C.gris, C.grisRouge, (x - qx) / .3));
  /* la nageoire de dessous (anale) : rouge orangé, le bout plus clair */
  const anX = .16, anY = -BAS(uDe(anX)) + .01;
  fin(nageoireGeo(V(anX - .07, anY, 0), V(anX + .06, anY + .015, 0), t => V(anX - .03 + t * .14, anY - .13 + t * .1, 0)),
    new THREE.Matrix4(), (x, y) => melange(C.rouge, C.rougeBout, (anY - y) / .12));
  /* les nageoires du ventre (pelviennes) : rouge orangé, de part et d'autre, un peu écartées */
  const peX = -.06;
  for(const s of [-1, 1]){
    const pY = -BAS(uDe(peX)) + .02, base = s * LARGE(uDe(peX)) * .5;
    const g = nageoireGeo(V(-.05, 0, 0), V(.03, 0, 0), t => V(-.01 + t * .13, -.12 + t * .08, 0), 10);
    fin(g, new THREE.Matrix4().compose(V(peX, pY, base), tourne(s * -.35, 0, 0), V(1, 1, 1)), (x, y) => melange(C.rouge, C.rougeBout, (pY - y) / .1));
  }
  /* les pectorales : orange pâle, juste derrière l'opercule, couchées le long du flanc */
  for(const s of [-1, 1]){
    const u = .33, p = peau(u, -.6, s);
    const g = nageoireGeo(V(0, .02, 0), V(0, -.02, 0), t => V(.17 - Math.abs(t - .35) * .1, -.07 + t * .05, 0), 10);
    fin(g, new THREE.Matrix4().compose(V(p.x, p.y, p.z + s * .01), tourne(s * .15, s * -.35, 0), V(1, 1, 1)), x => melange(C.rouge, C.pale, (x - p.x) / .15));
  }
  return gardonGeo = fusionner(M);
}
export function gardonModele(){
  const g = new THREE.Group(), m = new THREE.Mesh(gardonFait(), toon({vertexColors: true}));
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/* Les poissons refaits d'après les images de Yo (peche.js, icones.js) : fabrique() rend le modèle ; echelle le met à la taille
   des anciens poissons */
export const MODELES_POISSONS = {gardon: {fabrique: gardonModele, echelle: 1}};
