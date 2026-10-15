/* ================= La pierre des champs =================
   Le rocher de l'île (étape 2.1, morceau 3 ; son nom et son image : Yo, 15 octobre 2026), au plus près de l'image :
   une grosse pierre grise arrondie, faite de plaques aux bords adoucis (des joints clairs entre elles), un coussin de
   mousse sur le dessus, quelques touffes sur les côtés, et une jupe d'herbe tout autour du pied.
   - la roche : l'intersection de quelques dizaines de plans (un polyèdre arrondi, un peu bossu du côté de la mousse) ;
     chaque face est une plaque un peu bombée, au bord biseauté ; dessous, la même roche un peu plus petite, claire,
     fait les joints ;
   - la mousse : des rosettes de petites feuilles rondes, serrées en coussins, couchées sur la roche ;
   - l'herbe du pied : des brins larges aux bouts ronds, penchés vers l'extérieur ; ils suivent la saison et le vent ;
     sur le sable, pas d'herbe ;
   - l'hiver, quand il neige : de la neige sur les plaques du dessus.
   Pour le téléphone : un modèle par (saison, nuance, neige, sable), partagé ; au-delà de LOIN P du personnage, un
   modèle léger (moins de mousse et d'herbe). */
import { toon, fusionner, feuillageMat } from "./formes.js";
import { aleaDe, mesh, presLoin, MAT_BOIS, MAT_PLAT } from "./chene.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 14;

/* ---------- les couleurs (d'après l'image) ---------- */
const ROCHE = [0x8F8B89, 0x88858A, 0x948E88, 0x84807F];     // gris chaud, gris un peu mauve, d'une plaque à l'autre
const JOINT = 0xD4CCC2;                                     // les joints, clairs
const MOUSSE = [0x8CB82A, 0x74A020, 0xA4CC3A, 0x5E8A1C];
const HERBE = {
  printemps: [0x86CC50, 0x70BA44, 0x9CD860],
  ete:       [0x86B82C, 0x6E9E22, 0x9ECA3A],
  automne:   [0xC2A84C, 0xAA9040, 0xD0B85A],
  hiver:     [0xA8B89E, 0x98AA90, 0xB4C2AA]
};
const NEIGE = 0xF4F8FA;

/* ---------- la forme de la roche ---------- */
/* les plans : des directions réparties sur le dessus et les côtés, chacun à la distance d'un ovale (large de 1 P environ,
   haut de 0,7 P), un peu au hasard ; le côté de la mousse (arrière gauche) un peu plus bombé */
const A = .58, B = .4, C = .55, Y0 = .17;
function plans(alea){
  const P = [], n = 24;
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, y = 1 - t * 1.22, rr = Math.sqrt(Math.max(0, 1 - y * y)), a = k * 2.39996 + (alea() - .5) * .5;
    const d = V(rr * Math.cos(a), y, rr * Math.sin(a)).normalize();
    let h = Math.sqrt((A * d.x) ** 2 + (B * d.y) ** 2 + (C * d.z) ** 2) * (.93 + alea() * .08);
    if(d.x < .2 && d.z < .2 && d.y > .25) h *= 1.03;
    P.push({n: d, h});
  }
  P.push({n: V(0, -1, 0), h: Y0 + .02});                     // le dessous, plat (dans la terre)
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
function plaque({n, poly}, couleur, ombre){
  const c = poly.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / poly.length);
  const pos = [], te = [], ind = [];
  const haut = c.clone().addScaledVector(n, .016);
  pos.push(haut.x, haut.y, haut.z); te.push(1.03);
  for(const p of poly){
    const d = p.distanceTo(c), s = Math.max(.45, 1 - .055 / Math.max(d, 1e-3));
    const q = c.clone().lerp(p, s).addScaledVector(n, .005), o = p.clone().addScaledVector(n, -.03);
    pos.push(q.x, q.y, q.z, o.x, o.y, o.z); te.push(1, 1.08);
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
  const seg = 15, pos = [0, .14, 0], te = [.82], ind = [];
  for(let i = 0; i < seg; i++){
    const a = i / seg * Math.PI * 2, r = .5 * (.62 + .38 * Math.pow(Math.abs(Math.cos(a * 2.5)), .6));
    pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); te.push(1.12);
  }
  for(let i = 0; i < seg; i++) ind.push(0, 1 + (i + 1) % seg, 1 + i);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
})();
/* les coussins de mousse [direction depuis le centre, rayon en P, épaisseur] : le gros coussin sur le dessus (arrière
   gauche), qui déborde sur le devant ; une bande sur le dessus ; des touffes sur les côtés. Chaque coussin : une bosse
   sombre (le creux de la mousse), couverte de rosettes serrées qui se chevauchent */
const COUSSINS = [[[-.38, .86, -.3], .38, .09], [[-.6, .58, .3], .16, .05], [[.12, .95, -.2], .17, .045], [[.62, .68, .02], .11, .035],
  [[.08, .42, .9], .075, .022], [[.42, .2, .86], .06, .018], [[-.8, .26, .5], .065, .02], [[.86, .22, .3], .07, .022], [[-.22, .55, .8], .055, .018]];
/* un point du coussin : à la distance rho de son milieu, dans la direction a (sur le plan qui touche la roche), ramené sur la
   roche puis soulevé de l'épaisseur du coussin (plus épais au milieu) : le coussin épouse la pierre */
function surCoussin(P, S0, u, v, R, H, rho, a){
  const cible = S0.p.clone().addScaledVector(u, Math.cos(a) * rho).addScaledVector(v, Math.sin(a) * rho);
  const S = surface(P, cible.clone().normalize());
  const dir = S.n.clone().add(S.p.clone().normalize()).normalize();
  const e = H * Math.pow(Math.max(0, 1 - (rho / R) ** 2), .6);
  return {p: S.p.clone().addScaledVector(dir, e + .004), n: dir, e};
}
function mousseDe(P, alea, leger){
  const M = [];
  COUSSINS.forEach(([dir, R, H], ci) => {
    if(leger && ci > 3) return;
    const S0 = surface(P, V(...dir).normalize()), n0 = S0.n;
    const u = (Math.abs(n0.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)).cross(n0).normalize(), v = n0.clone().cross(u);
    /* le dessous du coussin, sombre : une peau en anneaux qui épouse la roche */
    const anneaux = 4, secteurs = 14, pos = [], ind = [];
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
    M.push({geo, m: new THREE.Matrix4(), c: 0x6A9422, ombre: () => .8});
    /* les rosettes : réparties sur le coussin (spirale), qui se chevauchent ; de près, beaucoup ; de loin, moins */
    const s0 = Math.min(.075, .04 + R * .09), n = Math.round(Math.max(6, (R / s0) ** 2 * 4.2) * (leger ? .25 : 1));
    for(let k = 0; k < n; k++){
      const rho = R * Math.sqrt((k + .5) / n) * .97, a = k * 2.39996 + alea() * .5;
      const {p, n: nrm, e} = surCoussin(P, S0, u, v, R, H, rho, a);
      /* la rosette couchée sur le coussin, un peu de travers (au bord, elle se penche vers l'extérieur) */
      const bord = V(Math.cos(a), 0, Math.sin(a)), dehors = u.clone().multiplyScalar(bord.x).addScaledVector(v, bord.z);
      const Y = nrm.clone().addScaledVector(dehors, .5 * rho / R).add(V(alea() - .5, alea() - .5, alea() - .5).multiplyScalar(.6)).normalize();
      const X = (Math.abs(Y.x) < .9 ? V(1, 0, 0) : V(0, 0, 1)).cross(Y).normalize().applyAxisAngle(Y, alea() * 6.28);
      const Z = X.clone().cross(Y), s = s0 * (.8 + alea() * .4);
      const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(p);
      const ton = alea(), dessus = H > 0 ? Math.min(1, e / H) : 1;
      M.push({geo: ROSETTE, m, c: MOUSSE[ton < .5 ? 0 : ton < .8 ? 2 : 1],
        normale: (x, y, z, nn) => nrm.clone().multiplyScalar(.55).add(nn.clone().multiplyScalar(.45)).normalize(),
        ombre: () => .8 + .32 * dessus});
    }
  });
  return fusionner(M);
}

/* ---------- l'herbe du pied ---------- */
/* un brin : une bande large au bout rond, pliée en son milieu, courbée vers l'extérieur ; la base à l'ombre */
const BRIN = (() => {
  const rangs = 4, pos = [], te = [], ind = [];
  for(let k = 0; k <= rangs; k++){
    const t = k / rangs, w = Math.max(.04, .3 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.5))) * (.85 + .15 * Math.min(1, t * 4)));
    const z = .22 * t * t, clair = .7 + .45 * t;
    pos.push(-w, t, z + w * .55, 0, t, z, w, t, z + w * .55);
    te.push(clair, clair * .9, clair);
  }
  for(let k = 0; k < rangs; k++){ const a = k * 3; ind.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  g.setIndex(ind); g.computeVertexNormals();
  return g;
})();
function herbeDe(P, tons, alea, leger){
  const M = [], n = leger ? 50 : 160;
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2 + (alea() - .5) * .12;
    const bord = surface(P, V(Math.cos(a), -.02, Math.sin(a)).normalize()).p;
    const rb = Math.hypot(bord.x, bord.z) * (k % 2 ? .92 + alea() * .1 : 1.02 + alea() * .14);   // deux rangs : contre la pierre, et devant
    const racine = V(Math.cos(a) * rb, -.02, Math.sin(a) * rb);
    const h = (k % 2 ? .15 : .1) + alea() * .07, dehors = V(Math.cos(a), 0, Math.sin(a));
    /* il monte en penchant vers l'extérieur ; Z : le côté vers lequel il se courbe */
    const pente = (k % 2 ? .05 : .2) + alea() * .22, tourne = (alea() - .5) * .9;
    const Y = V(0, 1, 0).multiplyScalar(Math.cos(pente)).addScaledVector(dehors.clone().applyAxisAngle(V(0, 1, 0), tourne), Math.sin(pente)).normalize();
    const X = V(0, 1, 0).cross(dehors).applyAxisAngle(V(0, 1, 0), tourne).normalize(), Z = X.clone().cross(Y);
    const s = h * (.9 + alea() * .2);
    const m = new THREE.Matrix4().makeBasis(X.multiplyScalar(s * (.85 + alea() * .4)), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(racine);
    M.push({geo: BRIN, m, c: tons[k % 3 === 0 ? 1 : alea() < .55 ? 0 : 2]});
  }
  return fusionner(M);
}

/* ---------- la neige ---------- */
function neigeDe(faces){
  const M = [];
  for(const {n, poly} of faces){
    if(n.y < .55) continue;
    const c = poly.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / poly.length);
    M.push(remplir(poly.map(p => c.clone().lerp(p, .9).addScaledVector(n, .03)), n, NEIGE));
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
  const roche = [];
  faces.forEach((f, k) => roche.push(plaque(f, ROCHE[(k * 7 + variante) % ROCHE.length], ombre)));
  joints.forEach(f => roche.push({...remplir(f.poly, f.n, JOINT), ombre}));
  const neigeM = neige ? neigeDe(faces) : null;
  const alea2 = aleaDe(53 + variante * 17), alea3 = aleaDe(53 + variante * 17);
  const r = {
    roche: fusionner(roche),
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
  const roche = mesh(G.roche, MAT_BOIS);
  roche.position.y = Y0;
  g.add(roche);
  const pres = new THREE.Group(), loin = new THREE.Group();
  for(const [geo, grp] of [[G.mousse, pres], [G.mousseLeger, loin]]){ const m = mesh(geo, MAT_PLAT, false); m.position.y = Y0; grp.add(m); }
  if(G.herbe){ pres.add(mesh(G.herbe, MAT_HERBE, false)); loin.add(mesh(G.herbeLeger, MAT_HERBE, false)); }
  if(G.neige){ const m = mesh(G.neige, MAT_BOIS, false); m.position.y = Y0; g.add(m); }
  g.add(presLoin(pres, loin, LOIN));
  g.userData.pierreChamps = {saison, herbe: !!G.herbe, neige: !!G.neige};
  return g;
}
