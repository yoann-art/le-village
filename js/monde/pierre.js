/* ================= La pierre des champs =================
   Le rocher de l'île (étape 2.1, morceau 3 ; son nom et son image : Yo, 15 octobre 2026 ; « pousse plus loin, au maximum »),
   au plus près de l'image :
   - la roche : l'intersection de 17 plans (une pierre irrégulière, plus large que haute) ; chaque grande face est fendue en
     cellules (des graines au hasard, chacune garde la part de la face la plus proche d'elle : `cellules`), chaque cellule
     une plaque un peu bombée au bord biseauté clair, la teinte un peu marbrée ; dessous, la même roche un peu plus petite,
     claire, fait les joints ;
   - la mousse : des coussins qui épousent la pierre, faits de mottes rondes serrées, chacune couverte de feuilles rondes à
     cinq lobes, couchées comme des écailles ; le gros coussin sur le dessus, qui déborde d'un côté, et de petites touffes ;
   - l'herbe du pied : des touffes de brins qui s'ouvrent en éventail et se courbent vers l'extérieur ; elles suivent la
     saison et le vent ; sur le sable, pas d'herbe ;
   - l'hiver, quand il neige : un coussin de neige sur les plaques du dessus.
   Pour le téléphone : un modèle par (saison, nuance, neige, sable), partagé ; au-delà de LOIN P du personnage, un modèle
   léger (les grandes faces sans cellules, les mottes sans feuilles, moins d'herbe). Environ 8 200 triangles de près,
   1 700 de loin. */
import { toon, fusionner, feuillageMat } from "./formes.js";
import { aleaDe, mesh, presLoin, feuilleGeo, MAT_BOIS, MAT_PLAT } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 6;

/* ---------- les couleurs (d'après l'image) ---------- */
const ROCHE = [0x98938E, 0x8F8C92, 0x9D968E, 0x8A878E];     // gris chaud, gris un peu mauve, d'une plaque à l'autre
const JOINT = 0xE2DBD2;                                     // les joints, clairs
const MOUSSE = [0x90B02C, 0x7A9A24, 0xA4C23A, 0x627E20];
const HERBE = {
  printemps: [0x86CC50, 0x70BA44, 0x9CD860],
  ete:       [0x96C436, 0x80AE2C, 0xAED44A],
  automne:   [0xC2A84C, 0xAA9040, 0xD0B85A],
  hiver:     [0xA8B89E, 0x98AA90, 0xB4C2AA]
};
const NEIGE = 0xF4F8FA;

/* ---------- la forme de la roche ---------- */
/* les plans : des directions réparties sur le dessus et les côtés, chacun à la distance d'un ovale (large de 1 P environ,
   haut de 0,7 P), un peu au hasard ; le côté de la mousse (arrière gauche) un peu plus bombé */
const A = .57, B = .47, C = .52, Y0 = .17;
const PIERRE = {A, B, C, Y0, n: 17, bosse: true};
const CAILLOU = {A: .58, B: .44, C: .55, Y0: .12, n: 20, bosse: false};   // le petit caillou (son image : Yo), à l'échelle de la pierre, réduit ensuite
function plans(alea, f = PIERRE){
  const P = [], n = f.n;
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, y = 1 - t * 1.22, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = k * 2.39996 + (alea() - .5) * .5;
    const d = V(rr * Math.cos(a), y, rr * Math.sin(a)).normalize();
    let h = Math.sqrt((f.A * d.x) ** 2 + (f.B * d.y) ** 2 + (f.C * d.z) ** 2) * (.87 + alea() * .13);
    if(f.bosse && d.x < .2 && d.z < .2 && d.y > .25) h *= 1.03;
    P.push({n: d, h});
  }
  P.push({n: V(0, -1, 0), h: f.Y0 + .02});                   // le dessous, plat (dans la terre)
  return P;
}
/* le polygone d'un plan : un grand carré sur ce plan, coupé par tous les autres */
function couper(poly, {n, h}){
  const out = [];
  for(let i = 0; i < poly.length; i++){
    const P = poly[i], Q = poly[(i + 1) % poly.length], dp = P.dot(n) - h, dq = Q.dot(n) - h;
    if(dp <= 0) out.push(P);
    if((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) out.push(P.clone().lerp(Q, dp / (dp - dq)));
  }
  return out;
}
function polygones(P, retrait = 0){
  const faces = [];
  P.forEach(({n, h}, k) => {
    const u = (Math.abs(n.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)).cross(n).normalize(), v = n.clone().cross(u), c = n.clone().multiplyScalar(h - retrait);
    let poly = [[-2, -2], [2, -2], [2, 2], [-2, 2]].map(([a, b]) => c.clone().addScaledVector(u, a).addScaledVector(v, b));
    for(let j = 0; j < P.length && poly.length >= 3; j++) if(j !== k) poly = couper(poly, {n: P[j].n, h: P[j].h - retrait});
    if(poly.length >= 3 && n.y > -.99) faces.push({n, poly, k});
  });
  return faces;
}
/* le point de la roche dans une direction (depuis son centre), et la plaque qui y est */
function surface(P, d){
  let t = Infinity, nk = null;
  for(const {n, h} of P){ const c = d.dot(n); if(c > 1e-4 && h / c < t){ t = h / c; nk = n; } }
  return {p: d.clone().multiplyScalar(t), n: nk};
}

/* une plaque : un éventail bombé au milieu, puis un biseau qui descend vers son bord (les plaques voisines y font un
   joint) ; teinte : le biseau un peu plus clair (les bords usés de l'image) */
function plaque({n, poly}, couleur, ombre, biseau = .055, bombe = .016, alea = null){
  const c = poly.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / poly.length);
  const pos = [], te = [], ind = [];
  const haut = c.clone().addScaledVector(n, bombe), tache = () => alea ? .95 + alea() * .1 : 1;   // la pierre un peu marbrée
  pos.push(haut.x, haut.y, haut.z); te.push(1.03 * tache());
  for(const p of poly){
    const d = p.distanceTo(c), s = Math.max(.45, 1 - biseau / Math.max(d, 1e-3));
    const q = c.clone().lerp(p, s).addScaledVector(n, bombe * .3), o = p.clone().addScaledVector(n, -.03);
    pos.push(q.x, q.y, q.z, o.x, o.y, o.z); te.push(tache(), 1.2);
  }
  const m = poly.length;
  for(let i = 0; i < m; i++){
    const j = (i + 1) % m, qi = 1 + i * 2, oi = qi + 1, qj = 1 + j * 2, oj = qj + 1;
    ind.push(0, qi, qj, qi, oi, oj, qi, oj, qj);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind);
  g.computeVertexNormals();
  /* les normales doivent sortir de la roche : l'ordre des points dépend du plan ; on retourne si besoin */
  const N0 = g.attributes.normal;
  if(N0.getX(0) * n.x + N0.getY(0) * n.y + N0.getZ(0) * n.z < 0){
    for(let i = 0; i < ind.length; i += 3){ const t = ind[i + 1]; ind[i + 1] = ind[i + 2]; ind[i + 2] = t; }
    g.setIndex(ind); g.computeVertexNormals();
  }
  return {geo: g, m: new THREE.Matrix4(), c: couleur, ombre};
}
/* une grande face partagée en cellules (comme les pierres de l'image, fendues en plaques) : quelques graines au hasard
   dans la face, chacune garde la part de la face qui est plus près d'elle que des autres */
function aire(poly){
  let a = 0;
  for(let i = 1; i < poly.length - 1; i++) a += poly[i].clone().sub(poly[0]).cross(poly[i + 1].clone().sub(poly[0])).length() / 2;
  return a;
}
function pointDans(poly, alea){
  const tris = [];
  let tot = 0;
  for(let i = 1; i < poly.length - 1; i++){ const a = poly[i].clone().sub(poly[0]).cross(poly[i + 1].clone().sub(poly[0])).length() / 2; tot += a; tris.push([i, tot]); }
  const r = alea() * tot, [i] = tris.find(([, t]) => t >= r) || tris[tris.length - 1];
  let u = alea(), v = alea();
  if(u + v > 1){ u = 1 - u; v = 1 - v; }
  return poly[0].clone().addScaledVector(poly[i].clone().sub(poly[0]), u).addScaledVector(poly[i + 1].clone().sub(poly[0]), v);
}
function cellules({n, poly}, alea, parCellule = .034){
  const A2 = aire(poly), nb = Math.max(1, Math.min(7, Math.round(A2 / parCellule)));
  if(nb === 1) return [poly];
  const graines = [];
  for(let k = 0; k < nb; k++){
    /* des graines pas trop serrées : on en essaie quelques-unes, on garde la plus loin des autres */
    let best = null, bd = -1;
    for(let e = 0; e < 6; e++){ const g = pointDans(poly, alea), d = Math.min(...graines.map(o => o.distanceTo(g)), 9); if(d > bd){ bd = d; best = g; } }
    graines.push(best);
  }
  return graines.map((g, i) => {
    let c = poly;
    graines.forEach((o, j) => { if(j !== i && c.length >= 3){ const nb2 = o.clone().sub(g).normalize(); c = couper(c, {n: nb2, h: nb2.dot(g.clone().add(o).multiplyScalar(.5))}); } });
    return c;
  }).filter(c => c.length >= 3);
}
function remplir(poly, n, couleur){                           // un polygone plein, à plat (les joints, la neige)
  const pos = [], ind = [];
  for(const p of poly) pos.push(p.x, p.y, p.z);
  for(let i = 1; i < poly.length - 1; i++) ind.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(ind); g.computeVertexNormals();
  const N0 = g.attributes.normal;
  if(N0.getX(0) * n.x + N0.getY(0) * n.y + N0.getZ(0) * n.z < 0){ for(let i = 0; i < ind.length; i += 3){ const t = ind[i + 1]; ind[i + 1] = ind[i + 2]; ind[i + 2] = t; } g.setIndex(ind); g.computeVertexNormals(); }
  return {geo: g, m: new THREE.Matrix4(), c: couleur};
}

/* ---------- la mousse ---------- */
/* une rosette : une petite feuille ronde à cinq lobes, bombée au milieu (le coeur à l'ombre, le bord clair) */
const ROSETTE = (() => {
  const seg = 15, pos = [0, .16, 0], te = [.96], ind = [];
  for(let i = 0; i < seg; i++){
    const a = i / seg * Math.PI * 2, r = .5 * (.62 + .38 * Math.pow(Math.abs(Math.cos(a * 2.5)), .6));   // cinq lobes ronds
    pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); te.push(1.1);
  }
  for(let i = 0; i < seg; i++) ind.push(0, 1 + (i + 1) % seg, 1 + i);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
})();
const MOTTE = new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2);   // une demi-boule
/* les coussins de mousse [direction depuis le centre, rayon en P, épaisseur] : le gros coussin sur le dessus (arrière
   gauche), qui déborde sur le devant ; une bande sur le dessus ; des touffes sur les côtés. Chaque coussin : une bosse
   sombre (le creux de la mousse), des mottes rondes serrées, chacune couverte de feuilles rondes comme des écailles */
const COUSSINS = [[[-.5, .8, .08], .37, .13], [[-.72, .42, .5], .16, .07], [[.22, .9, -.32], .13, .055], [[.62, .68, .02], .085, .04],
  [[.08, .42, .9], .075, .022], [[.42, .2, .86], .06, .018], [[-.8, .26, .5], .065, .02], [[.86, .22, .3], .07, .022], [[-.22, .55, .8], .055, .018]];
/* un point du coussin : à la distance rho de son milieu, dans la direction a (sur le plan qui touche la roche), ramené sur la
   roche puis soulevé de l'épaisseur du coussin (plus épais au milieu) : le coussin épouse la pierre */
function surCoussin(P, S0, u, v, R, H, rho, a){
  const cible = S0.p.clone().addScaledVector(u, Math.cos(a) * rho).addScaledVector(v, Math.sin(a) * rho);
  const S = surface(P, cible.clone().normalize());
  const dir = S.n.clone().add(S.p.clone().normalize()).normalize();
  const bosses = .78 + .22 * Math.sin(rho / R * 7 + a * 3) * Math.cos(a * 2 + rho / R * 4);   // des bosses : un coussin moelleux
  const e = H * Math.pow(Math.max(0, 1 - (rho / R) ** 2), .55) * bosses;
  return {p: S.p.clone().addScaledVector(dir, e + .004), n: dir, e};
}
function mousseDe(P, alea, leger){
  const M = [];
  COUSSINS.forEach(([dir, R, H], ci) => {
    if(leger && ci > 3) return;
    const S0 = surface(P, V(...dir).normalize()), n0 = S0.n;
    const u = (Math.abs(n0.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)).cross(n0).normalize(), v = n0.clone().cross(u);
    /* le dessous du coussin, sombre : une peau en anneaux qui épouse la roche */
    const anneaux = 3, secteurs = 10, pos = [], ind = [];
    const c = surCoussin(P, S0, u, v, R, H, 0, 0).p; pos.push(c.x, c.y, c.z);
    for(let r = 1; r <= anneaux; r++) for(let k = 0; k < secteurs; k++){
      const q = surCoussin(P, S0, u, v, R, H * .85, R * r / anneaux * .98, k / secteurs * Math.PI * 2).p; pos.push(q.x, q.y, q.z);
    }
    for(let k = 0; k < secteurs; k++) ind.push(0, 1 + (k + 1) % secteurs, 1 + k);
    for(let r = 1; r < anneaux; r++) for(let k = 0; k < secteurs; k++){
      const a = 1 + (r - 1) * secteurs + k, b = 1 + (r - 1) * secteurs + (k + 1) % secteurs, c2 = a + secteurs, d = b + secteurs;
      ind.push(a, b, d, a, d, c2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(ind); geo.computeVertexNormals();
    M.push({geo, m: new THREE.Matrix4(), c: 0x6A9420, ombre: () => .8});   // les creux de la mousse, sombres
    /* les mottes : le coussin est fait de petites bosses rondes serrées (comme sur l'image), claires dessus, sombres au pied */
    const rd = Math.max(.062, R * .3), nd = Math.max(1, Math.round((R / rd) ** 2 * 1.3 * (leger ? .6 : 1)));
    for(let k = 0; k < nd; k++){
      const rho = nd === 1 ? 0 : R * Math.sqrt((k + .5) / nd) * .82, a = k * 2.39996 + alea() * .7;
      const {p, n: nrm, e} = surCoussin(P, S0, u, v, R, H, rho, a);
      const r = rd * (.75 + alea() * .4), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), nrm);
      const C = p.clone().addScaledVector(nrm, -r * .35 - e * .4);
      M.push({geo: MOTTE, m: new THREE.Matrix4().compose(C, q, V(r, r * .8, r)), c: leger ? MOUSSE[k % 3 ? 0 : 1] : MOUSSE[3],
        normale: (x, y, z) => V(x, y, z).sub(C).normalize(),
        ombre: (x, y, z) => .7 + .34 * Math.max(0, Math.min(1, V(x, y, z).sub(C).dot(nrm) / (r * .8)))});
      /* la motte couverte de feuilles rondes, couchées comme des écailles (le dessus clair, le pied à l'ombre) */
      const nf = leger ? 0 : Math.max(4, Math.round(7.5 * (r / .1) ** 1.3));
      for(let f = 0; f < nf; f++){
        const t = (f + .5) / nf, yy = 1 - t * 1.05, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), b = f * 2.39996 + alea() * .5;
        const loc = V(Math.cos(b) * rr * r, yy * r * .8, Math.sin(b) * rr * r).applyQuaternion(q);
        const nl = V(Math.cos(b) * rr, yy / .8, Math.sin(b) * rr).normalize().applyQuaternion(q);
        const Y = nl.clone().add(V(alea() - .5, alea() - .5, alea() - .5).multiplyScalar(.22)).normalize();
        const X = (Math.abs(Y.x) < .9 ? V(1, 0, 0) : V(0, 0, 1)).cross(Y).normalize().applyAxisAngle(Y, alea() * 6.28), Z = X.clone().cross(Y);
        const sf = r * (.95 + alea() * .3);
        const mf = new THREE.Matrix4().makeBasis(X.multiplyScalar(sf), Y.multiplyScalar(sf), Z.multiplyScalar(sf)).setPosition(C.clone().add(loc).addScaledVector(nl, .004));
        const ton = alea();
        M.push({geo: ROSETTE, m: mf, c: MOUSSE[ton < .5 ? 0 : ton < .8 ? 2 : 1],
          normale: (x, y, z, nn) => nl.clone().multiplyScalar(.5).add(nn.clone().multiplyScalar(.5)).normalize(),
          ombre: () => .76 + .34 * yy});
      }
    }
  });
  return fusionner(M);
}

/* ---------- l'herbe du pied ---------- */
/* un brin : une bande large au bout rond, pliée en son milieu, courbée vers l'extérieur ; la base à l'ombre */
const BRIN = (() => {
  /* des rangs serrés vers le bout, qui se referme en demi-cercle : un bout rond (comme sur les images) */
  const T = [0, .42, .76, .92, 1], rangs = T.length - 1, pos = [], te = [], ind = [];
  for(let k = 0; k <= rangs; k++){
    const t = T[k], large = .155 * (.75 + .25 * Math.min(1, t * 3)), w = t > .76 ? large * Math.sqrt(Math.max(0, 1 - ((t - .76) / .24) ** 2)) : large;
    const z = .42 * t * t, clair = .7 + .45 * t;
    pos.push(-w, t, z + w * .6, 0, t, z, w, t, z + w * .6);
    te.push(clair, clair * .9, clair);
  }
  for(let k = 0; k < rangs; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
})();
/* l'herbe en touffes (comme sur l'image) : autour du pied, des touffes de brins larges qui s'ouvrent en éventail, les
   brins du milieu droits, ceux du bord penchés vers l'extérieur ; deux rangs de touffes, contre la pierre et devant */
function herbeDe(P, tons, alea, leger, o = {}){
  const M = [], touffes = o.touffes ? (leger ? Math.ceil(o.touffes * .6) : o.touffes) : leger ? 12 : 18, brins = o.brins || 9, taille = o.grand || 1;
  for(let t = 0; t < touffes; t++){
    const a = (o.angles ? o.angles[t % o.angles.length] : t / touffes * Math.PI * 2) + (alea() - .5) * .2;
    const bord = surface(P, V(Math.cos(a), -.02, Math.sin(a)).normalize()).p;
    const rb = Math.hypot(bord.x, bord.z) * (t % 2 ? .96 + alea() * .06 : 1.06 + alea() * .1);
    const racine = V(Math.cos(a) * rb, -.02, Math.sin(a) * rb), dehors = V(Math.cos(a), 0, Math.sin(a));
    const nb = leger ? 4 : brins + Math.floor(alea() * 3), grand = taille * (t % 2 ? 1.1 : .85) * (.9 + alea() * .25);
    for(let k = 0; k < nb; k++){
      /* chaque brin part du coeur de la touffe dans sa direction (b), plus ou moins penché */
      const b = k / nb * Math.PI * 2 + alea() * .6, vers = V(Math.cos(b), 0, Math.sin(b));
      const auMilieu = k < 3, pente = (auMilieu ? .05 + alea() * .12 : .18 + alea() * .28) * (o.droit || 1);
      const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(vers, Math.sin(pente)).normalize();
      const X = V(0, 1, 0).cross(vers).normalize(), Z = X.clone().cross(Y);
      const h = (auMilieu ? .27 : .2 + alea() * .06) * grand;
      /* contre la pierre, pas de brin qui rentre dedans : ceux qui partent vers elle restent droits et courts */
      const versPierre = vers.dot(dehors) < -.3, s = versPierre ? h * .75 : h;
      const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s * (.95 + alea() * .3)), (versPierre ? V(0, 1, 0) : Y).multiplyScalar(s), Z.multiplyScalar(s))
        .setPosition(racine.clone().addScaledVector(vers, .015));
      M.push({geo: BRIN, m, c: tons[auMilieu ? 2 : alea() < .6 ? 0 : 1]});
    }
  }
  return fusionner(M.concat(o.avec || []));                 // avec : d'autres morceaux (les pousses du petit caillou)
}

/* ---------- la neige ---------- */
function neigeDe(faces){
  const M = [];
  for(const {n, poly} of faces){
    if(n.y < .8) continue;
    const c = poly.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / poly.length);
    M.push(plaque({n, poly: poly.map(p => c.clone().lerp(p, .9).addScaledVector(n, .018))}, NEIGE, () => .9));   // un coussin de neige, bombé
  }
  return M.length ? fusionner(M) : null;
}

/* ---------- les matières, partagées ---------- */
const MAT_HERBE = feuillageMat({}, 0, 3);                 // les brins ondulent au vent, le bout plus que la base

/* ---------- les modèles ---------- */
const CACHE = new Map();
function geos(saison, variante, neige, sable){
  const cle = [saison, variante, neige ? 1 : 0, sable ? 1 : 0].join(":");
  if(CACHE.has(cle)) return CACHE.get(cle);
  const alea = aleaDe(907 + variante * 131), P = plans(alea), faces = polygones(P), joints = polygones(P, .034);
  const yb = -.02, yt = Y0 + B;
  const ombre = (x, y) => .8 + .2 * Math.min(1, Math.max(0, (y + Y0 - yb) / (yt - yb)));
  /* de près : chaque face fendue en cellules ; de loin : une plaque par face */
  const roche = [], simple = [], aleaC = aleaDe(311 + variante * 29);
  faces.forEach((f, k) => {
    const ton = ROCHE[(k * 7 + variante) % ROCHE.length];
    simple.push(plaque(f, ton, ombre));
    for(const c of cellules(f, aleaC)){
      const b = Math.min(.022, .22 * Math.sqrt(aire(c)));
      roche.push(plaque({n: f.n, poly: c}, new THREE.Color(ton).multiplyScalar(.95 + aleaC() * .1).getHex(), ombre, b, .012, aleaC));
    }
  });
  for(const f of joints){ const j = {...remplir(f.poly, f.n, JOINT), ombre}; roche.push(j); simple.push(j); }
  const neigeM = neige ? neigeDe(faces) : null;
  const alea2 = aleaDe(53 + variante * 17), alea3 = aleaDe(53 + variante * 17);
  const r = {
    roche: fusionner(roche),
    rocheLeger: fusionner(simple),
    neige: neigeM,
    mousse: mousseDe(P, alea2, false),
    mousseLeger: mousseDe(P, alea3, true),
    herbe: sable ? null : herbeDe(P, HERBE[saison], aleaDe(71 + variante), false),
    herbeLeger: sable ? null : herbeDe(P, HERBE[saison], aleaDe(71 + variante), true)
  };
  CACHE.set(cle, r);
  return r;
}
/* La pierre des champs : saison, r (son tirage : nuance), neige (il neige assez), sable (posée sur la plage) */
export function pierreChamps(saison, r = 0, neige = false, sable = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, variante, neige, sable), g = new THREE.Group();
  const pres = new THREE.Group(), loin = new THREE.Group();
  for(const [geo, grp] of [[G.roche, pres], [G.rocheLeger, loin]]){ const m = mesh(geo, MAT_BOIS); m.position.y = Y0; grp.add(m); }
  for(const [geo, grp] of [[G.mousse, pres], [G.mousseLeger, loin]]){ const m = mesh(geo, MAT_PLAT, false); m.position.y = Y0; grp.add(m); }
  if(G.herbe){ pres.add(mesh(G.herbe, MAT_HERBE, false)); loin.add(mesh(G.herbeLeger, MAT_HERBE, false)); }
  if(G.neige){ const m = mesh(G.neige, MAT_BOIS, false); m.position.y = Y0; g.add(m); }
  g.add(presLoin(pres, loin, LOIN));
  g.userData.pierreChamps = {saison, herbe: !!G.herbe, neige: !!G.neige};
  return g;
}

/* ---------- le petit caillou (au sol, il se ramasse à la main ; son image : Yo, 15 octobre 2026) ----------
   Une pierre ronde à facettes, fendue en cellules, gris chaud avec des taches plus sombres ; autour, quelques touffes
   d'herbe et deux pousses aux feuilles rondes ; sur le sable, la pierre seule. Construit à l'échelle de la pierre des
   champs, puis réduit (ECHELLE_CAILLOU) : environ 0,4 P de large. */
const ECHELLE_CAILLOU = .36;
const FEUILLE_RONDE = feuilleGeo(t => .5 * Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .8), 5, .3);
/* une pousse : quatre feuilles rondes qui s'ouvrent autour du coeur, une cinquième au milieu, dressée */
function pousse(M, racine, tons, alea){
  for(let k = 0; k < 5; k++){
    const milieu = k === 4, b = k * 1.57 + alea() * .4, vers = V(Math.cos(b), 0, Math.sin(b));
    const pente = milieu ? .3 : .75 + alea() * .3, l = milieu ? .26 : .32 + alea() * .06;
    const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(vers, Math.sin(pente)).normalize();
    const X = V(0, 1, 0).cross(vers).normalize(), Z = X.clone().cross(Y);
    const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(l * .95), Y.clone().multiplyScalar(l), Z.multiplyScalar(l))
      .setPosition(racine.clone().addScaledVector(Y, l * .5 + .02).setY(racine.y + Y.y * l * .5 + .03));
    M.push({geo: FEUILLE_RONDE, m, c: new THREE.Color(tons[k % 2 ? 0 : 1]).multiplyScalar(.92).getHex()});
  }
}
const CACHE_CAILLOU = new Map();
function geosCaillou(saison, variante, sable){
  const cle = [saison, variante, sable ? 1 : 0].join(":");
  if(CACHE_CAILLOU.has(cle)) return CACHE_CAILLOU.get(cle);
  const alea = aleaDe(4021 + variante * 97), P = plans(alea, CAILLOU), faces = polygones(P), joints = polygones(P, .034);
  const yb = -.02, yt = CAILLOU.Y0 + CAILLOU.B;
  const ombre = (x, y) => .8 + .2 * Math.min(1, Math.max(0, (y + CAILLOU.Y0 - yb) / (yt - yb)));
  const roche = [], simple = [], aleaC = aleaDe(613 + variante * 31);
  faces.forEach((f, k) => {
    const ton = [0xA69E96, 0x9C968F, 0xACA398][(k * 5 + variante) % 3];
    simple.push(plaque(f, ton, ombre));
    for(const c of cellules(f, aleaC, .11)){
      /* des taches plus sombres, comme sur l'image */
      const t = aleaC() < .45 ? .72 + aleaC() * .08 : .97 + aleaC() * .1;
      roche.push(plaque({n: f.n, poly: c}, new THREE.Color(ton).multiplyScalar(t).getHex(), ombre, Math.min(.022, .22 * Math.sqrt(aire(c))), .014, aleaC));
    }
  });
  for(const f of joints){ const j = {...remplir(f.poly, f.n, JOINT), ombre}; roche.push(j); simple.push(j); }
  /* l'herbe : des touffes autour (la plus grande derrière, à gauche), et deux pousses devant */
  const tons = HERBE[saison], o = {touffes: 7, brins: 8, grand: 2.05, droit: .7, angles: [-2.3, -1.7, -.9, .1, .8, 1.5, 2.6]};
  let herbe = null, herbeLeger = null;
  if(!sable){
    const M = [], aleaP = aleaDe(77 + variante);
    for(const a of [2.15, .95]){
      const bord = surface(P, V(Math.cos(a), -.02, Math.sin(a)).normalize()).p;
      pousse(M, V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(Math.hypot(bord.x, bord.z) * 1.12).setY(-.02), [tons[0], tons[1], tons[2]], aleaP);
    }
    herbe = herbeDe(P, tons, aleaDe(91 + variante), false, {...o, avec: M});
    herbeLeger = herbeDe(P, tons, aleaDe(91 + variante), true, o);
  }
  const r = {roche: fusionner(roche), rocheLeger: fusionner(simple), herbe, herbeLeger};
  CACHE_CAILLOU.set(cle, r);
  return r;
}
/* Le petit caillou : saison, r (son tirage : nuance), sable (sur la plage : sans herbe) */
export function caillouModele(saison, r = 0, sable = false){
  const variante = Math.floor(r * 3) % 3, G = geosCaillou(saison, variante, sable), g = new THREE.Group();
  const pres = new THREE.Group(), loin = new THREE.Group();
  for(const [geo, grp] of [[G.roche, pres], [G.rocheLeger, loin]]){ const m = mesh(geo, MAT_BOIS); m.position.y = CAILLOU.Y0; grp.add(m); }
  if(G.herbe){ pres.add(mesh(G.herbe, MAT_HERBE, false)); loin.add(mesh(G.herbeLeger, MAT_HERBE, false)); }
  g.add(presLoin(pres, loin, LOIN));
  g.scale.setScalar(ECHELLE_CAILLOU);
  g.userData.caillou = {saison, herbe: !!G.herbe};
  return g;
}
