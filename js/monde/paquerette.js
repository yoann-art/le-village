/* ================= La pâquerette =================
   D'après l'image de Yo (21 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image : une touffe ronde de feuilles
   vert tendre, des lanières qui montent puis retombent vers l'extérieur, le bout arrondi, et quelques feuilles plus larges
   en spatule au bord festonné ; trois tiges, chacune sa fleur : une couronne de pétales blancs arrondis, creusés d'un
   sillon, le bout teinté de rose, autour d'un coeur jaune bombé fait de petits grains ; et deux boutons fermés, roses et
   blancs, serrés dans leurs sépales verts.
   Comme dans la vraie nature : la pâquerette garde sa rosette de feuilles toute l'année (plus sombre l'hiver, un peu de
   neige dessus quand il neige) ; en fleur à sa saison ; cueillie ou hors saison, les feuilles seulement ; une pousse :
   quelques petites feuilles.
   Pour le téléphone : une forme par (saison, état, couleur, nuance), partagée ; un modèle léger quand elle est petite à
   l'écran (presLoin) ; elle bouge un peu au vent. Ses feuilles et ses outils servent aussi au pissenlit (pissenlit.js). */
import { fusionner, feuillageMat } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
export const MAT_PAQUERETTE = feuillageMat({}, .1, 1.4);
export const TONS = {
  printemps: [0x6CB42A, 0x4E961E, 0x8CC836], ete: [0x66AC28, 0x4A8E1C, 0x84C034],
  automne: [0x86B23A, 0x729C30, 0x9CBE4A], hiver: [0x5E9A3A, 0x4E8632, 0x6EA846]
};
const ROSE = new THREE.Color(0xF2A6BC), JAUNE = new THREE.Color(0xF6BE1A), JAUNE_SOMBRE = new THREE.Color(0xE09A0E);
const cT = new THREE.Color();
const bruit = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

/* une feuille : longue de 1, la base en (0, 0, 0), qui monte puis se courbe vers +z ; épaisse et ronde comme sur l'image
   (une section ovale, large de 2 × large × forme(t), épaisse d'epais fois sa largeur : la feuille posée est étirée en
   longueur dans ce sens ; le bout arrondi) ; teinte : le pied
   à l'ombre, le bout plus clair, le dessous un peu plus sombre */
export function feuilleGeo(T, large, plie, forme, tour = 8, epais = .17){
  const pos = [], nor = [], te = [], ind = [];
  let y = 0, z = 0, sPrec = 0;
  T.forEach(t => {
    const phi = plie * Math.pow(t, 1.5), ds = t - sPrec; sPrec = t;
    y += Math.cos(phi) * ds; z += Math.sin(phi) * ds;
    const w = Math.max(.002, large * forme(t)), e = w * epais, ny = -Math.sin(phi), nz = Math.cos(phi), clair = .7 + .42 * t;
    for(let k = 0; k < tour; k++){
      const a = k / tour * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(c * w, y + ny * sn * e, z + nz * sn * e);
      const nx = c / w, nn = sn / e, l = Math.hypot(nx, nn);
      nor.push(nx / l, ny * nn / l, nz * nn / l);
      te.push(clair * (sn < 0 ? .86 : 1));
    }
  });
  for(let r = 0; r < T.length - 1; r++) for(let k = 0; k < tour; k++){
    const a = r * tour + k, b = r * tour + (k + 1) % tour, c = a + tour, d = b + tour;
    ind.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind);
  return g;
}
export const RANGS = [0, .15, .3, .45, .58, .7, .8, .88, .94, .98, 1], RANGS_LEGERS = [0, .45, .8, 1];
export const ronde = t => t < .82 ? .7 + .3 * Math.min(1, t * 3) : Math.sqrt(Math.max(0, 1 - ((t - .82) / .18) ** 2));          // une lanière au bout arrondi
const spatule = t => (.35 + .65 * Math.sin(Math.PI * Math.min(1, t * .95)) ** .6 * Math.min(1, t * 2.2)) * (1 + .12 * Math.sin(t * 22)) * (t > .9 ? Math.sqrt((1 - t) / .1) : 1);   // large, festonnée
export const LANIERE = [feuilleGeo(RANGS, .5, .7, ronde, 6, .26), feuilleGeo(RANGS, .5, 1.2, ronde, 6, .26), feuilleGeo(RANGS, .5, 1.8, ronde, 6, .26)];
export const LANIERE_LEGERE = [feuilleGeo(RANGS_LEGERS, .5, 1, ronde, 4), feuilleGeo(RANGS_LEGERS, .5, 1.6, ronde, 4), feuilleGeo(RANGS_LEGERS, .5, 2.2, ronde, 4)];
const SPATULE = feuilleGeo(RANGS, .5, 1.1, spatule, 8, .1);

/* un pétale : un ovale aplati, son sillon au milieu (plus sombre), de 0 à 1 le long de +x */
const PETALE = (() => {
  const g = new THREE.SphereGeometry(1, 8, 5); g.scale(.5, .2, .26); g.translate(.5, 0, 0);
  const p = g.attributes.position, te = [];
  for(let i = 0; i < p.count; i++) te.push(p.getY(i) > 0 ? 1 - .2 * Math.exp(-((p.getZ(i) / .05) ** 2)) : .9);
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  return g;
})();
const PETALE_LEGER = (() => { const g = new THREE.SphereGeometry(1, 5, 3); g.scale(.5, .16, .2); g.translate(.5, 0, 0); return g; })();
const COEUR = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), COEUR_LEGER = new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2);
export const TIGE = new THREE.CylinderGeometry(1, 1, 1, 6, 1); TIGE.translate(0, .5, 0);
export const BOULE = new THREE.SphereGeometry(1, 10, 7), COUPE = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);   // les sépales : une coupe sous le bouton

/* une feuille posée : pied, direction b autour de la touffe, pente, longueur, largeur, couleur, tour */
export function poser(M, geo, pied, b, pente, long, larg, c){
  const vers = V(Math.cos(b), 0, Math.sin(b));
  const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(vers, Math.sin(pente)).normalize();
  const X = V(0, 1, 0).cross(vers).normalize(), Z = X.clone().cross(Y).normalize();
  M.push({geo, m: new THREE.Matrix4().makeBasis(X.multiplyScalar(larg), Y.multiplyScalar(long), Z.multiplyScalar(long)).setPosition(pied), c});
}
/* une fleur ouverte : sa tête au bout de la tige (haut), tournée vers dir ; base : la couleur des pétales */
function tete(M, haut, dir, base, leger, alea){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), R = .085, n = leger ? 8 : 12;
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2 + alea() * .1, rk = R * (.92 + alea() * .16);
    const qp = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), .12 + alea() * .1));
    const m = new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .004), qp, V(rk, rk, rk));
    M.push({geo: leger ? PETALE_LEGER : PETALE, m, couleur: (x, y, z) => {
      /* le bout du pétale teinté de rose */
      const d = Math.hypot(x - haut.x, y - haut.y, z - haut.z) / R;
      return cT.set(base).lerp(ROSE, Math.max(0, Math.min(1, (d - .55) / .45)) ** 1.4 * .95);
    }});
  }
  /* le coeur jaune bombé, fait de petits grains */
  const rc = .042;
  M.push({geo: leger ? COEUR_LEGER : COEUR, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .006), q, V(rc, rc * .7, rc)),
    couleur: (x, y, z) => { const b = bruit(Math.floor(x * 200), Math.floor(y * 200), Math.floor(z * 200)); return cT.copy(JAUNE).lerp(JAUNE_SOMBRE, b > .55 ? .6 : 0); }});
}
/* un bouton fermé : rose et blanc, serré dans cinq sépales verts */
function bouton(M, haut, dir, vert){
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .03), q, V(.03, .038, .03)),
    couleur: (x, y, z) => cT.set(0xFFF4F0).lerp(ROSE, Math.min(1, Math.max(0, (y - haut.y) / .055)) * .8)});
  M.push({geo: COUPE, m: new THREE.Matrix4().compose(haut.clone().addScaledVector(dir, .012), q, V(.033, .03, .033)), c: vert});
}
/* une tige : de pied à haut, fine */
export const tige = (M, pied, haut, vert) => {
  const d = haut.clone().sub(pied), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  M.push({geo: TIGE, m: new THREE.Matrix4().compose(pied, q, V(.008, d.length(), .008)), c: vert});
};

function touffe(saison, etat, base, variante, leger, neige){
  const tons = TONS[saison] || TONS.printemps, alea = aleaDe(9101 + variante * 31), M = [];
  /* les feuilles : un coeur de lanières dressées, puis des rangs de plus en plus couchés vers l'extérieur */
  const nf = etat === 0 ? 8 : leger ? 22 : 52, taille = etat === 0 ? .55 : 1;
  for(let k = 0; k < nf; k++){
    const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4;
    const pied = V(Math.cos(b) * .08 * Math.sqrt(t), 0, Math.sin(b) * .08 * Math.sqrt(t));
    poser(M, (leger ? LANIERE_LEGERE : LANIERE)[Math.min(2, Math.floor(t * 3 + alea() * .5))], pied, b, .02 + .5 * t + alea() * .1,
      (.21 - .08 * t + alea() * .03) * taille, .045 * taille, tons[t < .3 ? 2 : alea() < .6 ? 0 : 1]);
  }
  /* les feuilles en spatule, au bord festonné */
  if(etat > 0 && !leger) for(let k = 0; k < 4; k++){
    const b = k * 1.7 + 1 + alea() * .5;
    poser(M, SPATULE, V(Math.cos(b) * .02, 0, Math.sin(b) * .02), b, .55 + alea() * .3, .17 + alea() * .03, .1, tons[1]);
  }
  if(neige && etat > 0 && !leger)
    for(const [x, z, r] of [[0, 0, .09], [-.1, .05, .06], [.09, .07, .06], [.03, -.09, .05]]) M.push({geo: NEIGE_GEO, m: new THREE.Matrix4().compose(V(x, .17 - Math.hypot(x, z) * .5, z), new THREE.Quaternion(), V(r, r * .35, r)), c: 0xF4F8FA});   // des coussins de neige sur la rosette
  if(etat === 2){
    /* trois fleurs : la grande au milieu, deux plus basses ; tournées vers le haut et un peu vers l'avant */
    const vert = tons[1];
    [[.0, -.01, .3, 0], [-.1, .04, .22, -.5], [.11, .03, .24, .45]].forEach(([x, z, h, pen]) => {
      const haut = V(x * 1.4, h, z * 1.4 + .02), dir = V(x * 3 + pen * .4, 1, .55 + z * 2).normalize();
      tige(M, V(x * .3, 0, z * .3), haut, vert);
      tete(M, haut, dir, base, leger, alea);
    });
    /* deux boutons fermés, plus bas */
    if(!leger) [[-.1, -.06, .2], [.13, .08, .15]].forEach(([x, z, h]) => {
      const haut = V(x * 1.2, h, z * 1.2), dir = V(x * 4, 1, z * 3).normalize();
      tige(M, V(x * .3, 0, z * .3), haut, vert);
      bouton(M, haut, dir, vert);
    });
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, couleur, variante, neige){
  const base = couleur === undefined ? 0xFFFFFF : couleur, cle = [saison, etat, base, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, base, variante, false, neige), loin: touffe(saison, etat, base, variante, true, neige)});
  return CACHE.get(cle);
}
/* La pâquerette : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; couleur : celle de ses pétales (blanc ou
   rose) ; r : son tirage (nuance, taille, sens) ; neige : il neige (un peu de neige sur sa rosette, l'hiver) */
export function paqueretteModele(saison, etat, couleur, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, couleur, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;                // un peu tournée, mais les fleurs regardent toujours vers l'avant
  g.scale.setScalar(.95 + r * .2);
  g.userData.paquerette = {saison, etat};
  return g;
}
