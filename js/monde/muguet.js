/* ================= Le muguet =================
   D'après l'image de Yo (25 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image, planté dans le sol (règle
   de Yo : jamais de tas de terre sous une fleur) : une petite colonie de trois pieds ; chacun deux grandes feuilles
   larges et pointues, dressées, enroulées à la base, creusées en gouttière, leurs fines nervures parallèles, le bout qui
   se recourbe vers l'extérieur ; une hampe vert tendre qui monte puis se penche, et le long de sa partie haute, sur de
   petites queues recourbées, des clochettes blanches qui pendent, le bord découpé en six petits festons retroussés,
   leur coeur jaune ; au bout, des boutons ronds vert pâle ; à son pied, un peu de mousse et deux petits trèfles.
   Comme dans la vraie nature : il fleurit au printemps ; l'été, ses fleurs fanées laissent des baies rouges ; en automne,
   ses feuilles jaunissent et brunissent ; l'hiver, il dort sous terre : on ne voit plus que la mousse à son pied.
   Pour le téléphone : une forme par (saison, état, nuance), partagée ; un modèle léger quand il est petit à l'écran ;
   il bouge un peu au vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin } from "./chene.js";
import { MAT_PAQUERETTE, TIGE, BOULE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const FEUILLES = {printemps: [0x4E9A34, 0x5AA63C, 0x448C2E], ete: [0x44882C, 0x3E7E28, 0x4E922E],
  automne: [0xB0A23C, 0x9C8A34, 0x86822E]};
const HAMPE = {printemps: 0x7EB040, ete: 0x6E9E38, automne: 0x9A9440}, BLANC = 0xFBFAF2, BOUTON = 0xD8E6B0, JAUNE = 0xE8C030,
  BAIE = 0xD8381C, MOUSSE = [0x8CB032, 0x7AA02C, 0xA2C040];

/* une grande feuille : de 0 (la base) à 1 (la pointe) le long de y, large au milieu, pointue, creusée en gouttière, qui se
   penche vers +z en montant ; ses fines nervures parallèles (l'attribut « teinte ») */
function feuilleGeo(rangs, tour, plie){
  const pos = [], te = [], ind = [];
  let y = 0, z = 0, prec = 0;
  for(let r = 0; r <= rangs; r++){
    const t = r / rangs, phi = plie * t ** 1.8, ds = t - prec; prec = t;
    y += Math.cos(phi) * ds; z += Math.sin(phi) * ds;
    const w = .27 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** .75 * (t < .12 ? .35 + t * 5.4 : 1);   // étroite et enroulée à la base, pointue au bout
    for(let k = 0; k <= tour; k++){
      const s = k / tour * 2 - 1, c = .22 * s * s * w;                                    // la gouttière : les bords relevés
      pos.push(s * w, y - Math.sin(phi) * c, z + Math.cos(phi) * c);
      te.push((1 - .08 * (Math.abs(Math.sin(s * Math.PI * 4)) < .25 ? 1 : 0)) * (.82 + .2 * t) * (Math.abs(s) < .06 ? 1.08 : 1));
    }
  }
  for(let r = 0; r < rangs; r++) for(let k = 0; k < tour; k++){
    const a = r * (tour + 1) + k, b = a + 1, c = a + tour + 1, d = c + 1;
    ind.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
}
const FEUILLE = [feuilleGeo(16, 8, .5), feuilleGeo(16, 8, .9)], FEUILLE_LEGERE = feuilleGeo(6, 4, .7);
/* une clochette qui pend (le haut en 0, l'ouverture en bas, vers −y), le bord en six festons retroussés */
function clocheGeo(seg, leger){
  const prof = [[0, .02], [.3, -.02], [.5, -.12], [.6, -.3], [.64, -.5], [.66, -.64], [.74, -.74], [.82, -.77]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, seg), p = g.attributes.position;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), bord = Math.max(0, (-y - .6) / .17);
    const f = 1 + (leger ? 0 : .14 * bord * Math.cos(a * 6));
    p.setXYZ(i, x * f, y + (leger ? 0 : .06 * bord * Math.max(0, Math.cos(a * 6))), z * f);
  }
  g.computeVertexNormals();
  const te = []; for(let i = 0; i < p.count; i++) te.push(.9 + .1 * Math.min(1, -p.getY(i) * 1.6));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  return g;
}
const CLOCHE = clocheGeo(18, false), CLOCHE_LEGERE = clocheGeo(8, true);
const BRIN = new THREE.IcosahedronGeometry(1, 1);
const TREFLE = (() => { const g = new THREE.CircleGeometry(1, 10); g.rotateX(-Math.PI / 2); g.translate(0, 0, .8); return g; })();

/* un bout de tige entre deux points */
function bout(M, a, b, r, c){
  const d = b.clone().sub(a);
  M.push({geo: TIGE, m: new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), V(r, d.length() * 1.04, r)), c});
}
/* une hampe : elle monte puis se penche vers vers ; rend ses points */
function hampe(M, pied, vers, h, courbe, c, n){
  const pts = [pied.clone()]; let p = pied.clone();
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, phi = .08 + courbe * Math.max(0, t - .45) ** 1.4 * 3.2;
    const q = p.clone().add(V(0, Math.cos(phi), 0).addScaledVector(vers, Math.sin(phi)).multiplyScalar(h / n));
    bout(M, p, q, .0055 - .002 * t, c); pts.push(q); p = q;
  }
  return pts;
}
/* un pied : deux feuilles qui l'enveloppent, et sa hampe chargée de clochettes (ou de baies l'été) */
function pied(M, ctr, b, saison, etat, leger, alea, taille){
  const tons = FEUILLES[saison], vers = V(Math.cos(b), 0, Math.sin(b));
  /* les deux feuilles, de part et d'autre, qui se penchent vers l'extérieur */
  [-1, 1].forEach((s, j) => {
    const dir = b + s * (1.3 + alea() * .3), d = V(Math.cos(dir), 0, Math.sin(dir));
    const X = V(0, 1, 0).cross(d).normalize(), pente = .18 + alea() * .12, Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(d, Math.sin(pente)).normalize();
    const Z = X.clone().cross(Y).normalize(), L = (.44 + alea() * .06) * taille;
    const brunie = saison === "automne" && alea() < .5;
    M.push({geo: leger ? FEUILLE_LEGERE : FEUILLE[j], m: new THREE.Matrix4().makeBasis(X.multiplyScalar(L * .9), Y.multiplyScalar(L), Z.multiplyScalar(L)).setPosition(ctr.clone().addScaledVector(d, .008)),
      c: brunie ? 0x8A6A30 : tons[(j + Math.floor(alea() * 3)) % 3]});
  });
  if(etat !== 2 && saison !== "ete") return;
  const pts = hampe(M, ctr.clone(), vers, .5 * taille, .85 + alea() * .15, HAMPE[saison], leger ? 5 : 14);
  /* le long de la partie haute : de petites queues recourbées, la clochette (ou la baie) qui pend au bout */
  const n = leger ? 4 : 9;
  for(let k = 0; k < n; k++){
    const t = .3 + .66 * k / (n - 1), i = Math.min(pts.length - 1, Math.round(t * (pts.length - 1))), a = pts[i], cote = k % 2 ? 1 : -1;
    const lat = V(0, 1, 0).cross(vers).normalize().multiplyScalar(cote * .032);
    const fin = a.clone().add(lat).add(V(0, -.032, 0)).addScaledVector(vers, .006);
    if(!leger){                                                              // la petite queue en crochet
      const p1 = a.clone().addScaledVector(lat, .55).add(V(0, .01, 0)), p2 = a.clone().addScaledVector(lat, .95).add(V(0, -.008, 0));
      bout(M, a, p1, .0026, HAMPE[saison]); bout(M, p1, p2, .0026, HAMPE[saison]); bout(M, p2, fin, .0026, HAMPE[saison]);
    }
    const s = (k > n - 3 ? .55 : .9 + alea() * .2) * taille;
    if(saison === "ete"){
      if(k < n - 2 && k % 2 === 0) M.push({geo: BOULE, m: new THREE.Matrix4().compose(fin.clone().add(V(0, -.012, 0)), new THREE.Quaternion(), V(.014, .014, .014)), c: BAIE});
    } else if(k > n - 3) M.push({geo: BOULE, m: new THREE.Matrix4().compose(fin.clone().add(V(0, -.01, 0)), new THREE.Quaternion(), V(.012 * s * 1.6, .014 * s * 1.6, .012 * s * 1.6)), c: BOUTON});
    else {
      const r = .048 * s;
      M.push({geo: leger ? CLOCHE_LEGERE : CLOCHE, m: new THREE.Matrix4().compose(fin, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), alea() * 3), V(r, r * 1.05, r)), c: BLANC});
      if(!leger) M.push({geo: BOULE, m: new THREE.Matrix4().compose(fin.clone().add(V(0, -.02 * s, 0)), new THREE.Quaternion(), V(.007 * s, .005 * s, .007 * s)), c: JAUNE});
    }
  }
}
function touffe(saison, etat, variante, leger){
  const alea = aleaDe(9961 + variante * 59), M = [];
  /* la mousse et deux petits trèfles, à son pied */
  for(let k = 0; k < (leger ? 4 : 8); k++){
    const a = k * 2.39996 + alea() * .3, r = .05 + .11 * Math.sqrt((k + .5) / 8), c = V(Math.cos(a) * r, 0, Math.sin(a) * r);
    for(let j = 0; j < (leger ? 2 : 4); j++){
      const e = .006 + alea() * .005;
      M.push({geo: BRIN, m: new THREE.Matrix4().compose(c.clone().add(V((alea() - .5) * .05, alea() * .008, (alea() - .5) * .05)), new THREE.Quaternion(), V(e, e * 1.6, e)), c: MOUSSE[(k + j) % 3]});
    }
  }
  if(!leger && saison !== "hiver") [[.1, .1], [-.11, .07]].forEach(([x, z]) => {
    const p = V(x, .03, z);
    bout(M, V(x, 0, z), p, .003, 0x6A9A34);
    for(let k = 0; k < 3; k++) M.push({geo: TREFLE, m: new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), k / 3 * Math.PI * 2), V(.011, .011, .011)), c: 0x5E9A34});
  });
  if(saison !== "hiver"){                                                  // l'hiver, il dort sous terre
    const taille = etat === 0 ? .5 : 1;
    [[0, .02, Math.PI / 2], [-.1, -.06, Math.PI / 2 + .7]].slice(0, etat === 0 ? 1 : 2).forEach(([x, z, b], k) =>
      pied(M, V(x, 0, z), b + (variante - 1) * .25 + (alea() - .5) * .2, saison, k === 0 ? etat : etat === 2 && k === 1 ? 2 : 1, leger, alea, taille * (k ? .9 : 1)));
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, variante){
  const cle = [saison, etat, variante].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, variante, false), loin: touffe(saison, etat, variante, true)});
  return CACHE.get(cle);
}
/* Le muguet : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; r : son tirage (nuance, taille, sens) */
export function muguetModele(saison, etat, r = 0){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, variante), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = (r - .5) * .6;                            // sa hampe penchée vers l'avant, vers la caméra
  g.scale.setScalar(.95 + r * .2);
  g.userData.muguet = {saison, etat};
  return g;
}
