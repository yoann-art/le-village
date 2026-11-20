/* ================= La poule, le coq et le poussin =================
   D'après les images de Yo (20 novembre 2026 : « Voici la poule, le coq et le poussin »), comme des vrais (règle de Yo) :
   - la poule : ronde et dodue, rousse, le plastron plus clair en écailles de plumes, les ailes serrées, la petite queue en éventail
     relevée, la crête rouge à trois lobes, les barbillons rouges (plus petits que ceux du coq, comme une vraie poule), le bec jaune,
     les grands yeux bruns, les pattes jaunes à quatre doigts (trois devant, un derrière) et leurs ongles clairs ;
   - le coq : plus grand, plus droit, le corps rouge-roux, le camail doré (les plumes du cou), la grande crête dentelée, les grands
     barbillons, la longue queue vert sombre en faucilles recourbées, les pattes plus longues ;
   - le poussin : une boule de duvet jaune pâle, la tête ronde et sa petite houppe, les grands yeux, le petit bec orange, les
     moignons d'ailes, les pattes orange.
   Quatre morceaux par bête (le corps, la tête, deux pattes), chacun d'un seul dessin (fusionner, MAT_UNI), pour les gestes
   (elevage.js) : marcher, picorer, gratter le sol, tourner la tête. Le devant regarde +z ; le sol en y = 0.
   Les formes sont faites une fois par sorte, puis partagées entre toutes les bêtes. */
import { fusionner, MAT_UNI } from "./formes.js";

const BOULE = new THREE.SphereGeometry(1, 10, 7), PETITE = new THREE.SphereGeometry(1, 6, 4), CONE = new THREE.ConeGeometry(1, 1, 8),
  TIGE = new THREE.CylinderGeometry(1, 1, 1, 6), DOIGT = new THREE.CylinderGeometry(.7, 1, 1, 5), FAUX = new THREE.TorusGeometry(1, .1, 4, 10, 2.1);
const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
const doux = (y0, h) => (x, y) => .8 + .32 * Math.max(0, Math.min(1, (y - y0) / h));        // l'ombre douce peinte : plus clair en haut

/* Les sortes : leurs couleurs et leurs mesures (en P ; la poule fait environ 0,42 P de haut) */
const SORTES = {
  poule:   {corps: 0xB9561E, clair: 0xD47634, sombre: 0x96441A, queue: 0x9C4718, crete: 0xD8302A, bec: 0xF0B032, patte: 0xF2B03A, ongle: 0xF2E2C6,
            hanche: .1, r: [.15, .15, .18], tete: .085, cou: [0, .17, .1], crete3: true},
  coq:     {corps: 0xB4361C, clair: 0xDB6A2A, sombre: 0x8E2A16, queue: 0x1E5A42, queue2: 0x2E7452, camail: 0xF2AC34, crete: 0xD8302A, bec: 0xF0B032,
            patte: 0xF2B03A, ongle: 0xF2E2C6, hanche: .16, r: [.15, .17, .17], tete: .085, cou: [0, .25, .07], crete5: true},
  poussin: {corps: 0xF6D45A, clair: 0xFBE48A, sombre: 0xE8C048, bec: 0xF39A2E, patte: 0xF39A2E, ongle: 0xF6C070, hanche: .035, r: [.088, .085, .088],
            tete: .062, cou: [0, .11, .025], houppe: true}
};
export const sorteDe = (esp, sexe, petit) => petit ? "poussin" : sexe === "m" ? "coq" : "poule";
export const HANCHE = k => SORTES[k].hanche;
export const COU = k => SORTES[k].cou;

/* les yeux : le blanc, l'iris brun, la pupille, le reflet, regardant de côté et un peu devant */
function yeux(out, s, x, y, z, r){
  for(const sx of [1, -1]){
    const a = sx * .72, nx = Math.sin(a), nz = Math.cos(a);
    out.push({geo: PETITE, m: M(sx * x, y, z, 0, a, 0, r, r, r * .55), c: 0xFBF6EC, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .42, y, z + nz * r * .42, 0, a, 0, r * .72, r * .72, r * .3), c: 0x6A3A1A, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .55, y, z + nz * r * .55, 0, a, 0, r * .42, r * .42, r * .25), c: 0x1A1210, ombre: () => 1});
    out.push({geo: PETITE, m: M(sx * x + nx * r * .66 - sx * r * .12, y + r * .25, z + nz * r * .66, 0, a, 0, r * .16, r * .16, r * .1), c: 0xFFFFFF, ombre: () => 1});
  }
}
/* le corps (son origine à la hanche) */
function corps(k){
  const s = SORTES[k], out = [], [rx, ry, rz] = s.r, cy = ry * .82, om = doux(-ry * .2, ry * 1.8);
  /* le plastron plus clair, peint sur le devant du corps */
  out.push({geo: BOULE, m: M(0, cy, -.01, 0, 0, 0, rx, ry, rz), c: s.corps, ombre: om,
    couleur: (x, y, z) => (z + .01) / rz > .42 && Math.abs(x) / rx < .82 && (y - cy) / ry < .55 ? s.clair : s.corps});
  for(const sx of [1, -1]){                                                                         // les ailes, serrées
    out.push({geo: BOULE, m: M(sx * rx * .88, cy + ry * .04, -rz * .24, -.15, sx * .12, 0, rx * .28, ry * .6, rz * .62), c: s.sombre, ombre: om});
    if(k !== "poussin") for(let f = 0; f < 3; f++) out.push({geo: PETITE, m: M(sx * rx * .96, cy - ry * .28 + f * ry * .07, -rz * .5 - f * rz * .12, -.6, 0, 0, rx * .14, ry * .12, rz * .3), c: s.queue, ombre: om});
  }
  if(k === "poule") for(let f = 0; f < 5; f++){                                                    // la petite queue en éventail, relevée
    const a = (f - 2) * .32;
    out.push({geo: BOULE, m: M(Math.sin(a) * .04, cy + ry * .55, -rz * .9, -.75, a * .6, a, .03, .11, .055), c: f % 2 ? s.queue : s.sombre, ombre: om});
  }
  if(k === "coq"){
    out.push({geo: BOULE, m: M(0, cy + ry * .62, rz * .38, -.3, 0, 0, rx * .82, ry * .55, rz * .55), c: s.camail, ombre: om});   // le camail doré
    for(let i = -2; i <= 2; i++) out.push({geo: PETITE, m: M(i * rx * .2, cy + ry * .3, rz * .62, -.3, 0, 0, rx * .16, ry * .26, rz * .08), c: s.camail, ombre: om});
    for(let f = 0; f < 6; f++){                                                                     // la longue queue en faucilles
      const a = (f - 2.5) * .12, R = .2 + f * .015;
      out.push({geo: FAUX, m: M(a * .5, cy + ry * .2, -rz * .7, 0, Math.PI / 2 + a, -.2 + f * .1, R, R * 1.15, .45), c: f % 2 ? s.queue : s.queue2, ombre: () => .95});
    }
  }
  if(k === "poussin") out.push({geo: BOULE, m: M(0, cy + ry * .1, -rz * .85, -.5, 0, 0, rx * .4, ry * .3, rz * .25), c: s.clair, ombre: om});   // le petit croupion
  return fusionner(out);
}
/* la tête (son origine au cou) */
function tete(k){
  const s = SORTES[k], out = [], r = s.tete, y = r * 1.05, z = r * .35, om = doux(0, r * 2.2);
  out.push({geo: BOULE, m: M(0, y, z, 0, 0, 0, r, r * 1.02, r), c: k === "coq" ? s.camail : s.corps, ombre: om});
  out.push({geo: BOULE, m: M(0, y - r * .55, z - r * .2, 0, 0, 0, r * .8, r * .7, r * .8), c: k === "coq" ? s.camail : s.corps, ombre: om});   // le cou
  out.push({geo: CONE, m: M(0, y - r * .05, z + r * 1.05, Math.PI / 2, 0, 0, r * .32, r * .62, r * .26), c: s.bec, ombre: () => 1});   // le bec
  out.push({geo: CONE, m: M(0, y - r * .18, z + r * .98, Math.PI / 2 + .5, 0, 0, r * .22, r * .4, r * .16), c: s.bec, ombre: () => .9});
  yeux(out, s, r * .58, y + r * .22, z + r * .6, r * .36);
  if(s.crete3) for(let i = 0; i < 3; i++)                                                          // la crête à trois lobes
    out.push({geo: BOULE, m: M(0, y + r * (.95 + (i === 1 ? .22 : .08)), z + r * (.45 - i * .42), -.2 + i * .25, 0, 0, r * .16, r * .32, r * .26), c: s.crete, ombre: om});
  if(s.crete5) for(let i = 0; i < 5; i++)                                                          // la grande crête dentelée
    out.push({geo: BOULE, m: M(0, y + r * (1.05 + .3 * Math.sin(i / 4 * Math.PI)), z + r * (.75 - i * .42), -.35 + i * .22, 0, 0, r * .17, r * .5, r * .26), c: s.crete, ombre: om});
  if(s.crete){                                                                                     // les barbillons
    const b = k === "coq" ? 1.35 : .85;
    for(const sx of [1, -1]) out.push({geo: BOULE, m: M(sx * r * .14, y - r * (.6 + .2 * b), z + r * .9, .15, 0, 0, r * .17 * b, r * .32 * b, r * .14 * b), c: s.crete, ombre: om});
  }
  if(s.houppe) for(let i = -1; i <= 1; i++)                                                        // la petite houppe du poussin
    out.push({geo: BOULE, m: M(i * r * .14, y + r * 1.05, z - r * .05, -.3, 0, i * .45, r * .14, r * .34, r * .14), c: s.clair, ombre: om});
  return fusionner(out);
}
/* une patte (son origine à la hanche) : le tarse, trois doigts devant, un derrière, leurs ongles */
function patte(k){
  const s = SORTES[k], out = [], h = s.hanche, e = k === "coq" ? .022 : k === "poussin" ? .012 : .019, l = k === "poussin" ? .035 : .06;
  out.push({geo: TIGE, m: M(0, -h / 2, 0, 0, 0, 0, e, h, e), c: s.patte, ombre: () => .95});
  if(k !== "poussin") out.push({geo: BOULE, m: M(0, .01, 0, 0, 0, 0, e * 1.6, e * 1.8, e * 1.6), c: s.sombre, ombre: () => .9});   // la cuisse
  for(const a of [-.45, 0, .45, Math.PI]){
    const L = a === Math.PI ? l * .5 : l, dx = Math.sin(a) * L / 2, dz = Math.cos(a) * L / 2;
    out.push({geo: DOIGT, m: M(dx, -h + e * .5, dz, Math.PI / 2, a, 0, e * .75, L, e * .6), c: s.patte, ombre: () => .95});
    out.push({geo: CONE, m: M(dx * 2.05, -h + e * .45, dz * 2.05, Math.PI / 2, a, 0, e * .5, e * 1.4, e * .4), c: s.ongle, ombre: () => 1});
  }
  return fusionner(out);
}
const FORMES = {};
const formes = k => FORMES[k] || (FORMES[k] = {corps: corps(k), tete: tete(k), patte: patte(k)});
/* Une bête : {g, corps, tete, pattes} ; g.userData.sorte */
export function modeleAnimal(k){
  const f = formes(k), s = SORTES[k], g = new THREE.Group();
  const c = new THREE.Mesh(f.corps, MAT_UNI); c.position.y = s.hanche; g.add(c);
  const t = new THREE.Mesh(f.tete, MAT_UNI); t.position.set(...s.cou); c.add(t);
  const pattes = [1, -1].map(sx => { const p = new THREE.Mesh(f.patte, MAT_UNI); p.position.set(sx * s.r[0] * .35, s.hanche, 0); g.add(p); return p; });
  for(const m of [c, t, ...pattes]){ m.castShadow = k !== "poussin"; m.receiveShadow = false; }
  g.userData.sorte = k;
  return {g, corps: c, tete: t, pattes};
}
/* Pour préparer au chargement (main.js) : une bête de chaque sorte */
export function echantillonsFerme(){
  const g = new THREE.Group();
  for(const k of Object.keys(SORTES)) g.add(modeleAnimal(k).g);
  return g;
}
/* Pour la vérification et les mesures : triangles et dessins d'une sorte */
export function poidsAnimal(k){
  const f = formes(k), t = geo => geo.index.count / 3;
  return {triangles: t(f.corps) + t(f.tete) + 2 * t(f.patte), dessins: 4};
}
