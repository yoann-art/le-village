/* ================= Le Château, niveau 1 =================
   D'après l'image de Yo (5 novembre 2026 : « Voici le château niveau 1. Par contre j'aimerais que l'on passe par la porte
   principale du château et que l'on accède à la cour et ensuite la porte de la tour qui mène à l'intérieur du château ») ;
   ses choix : « 7*7 », le mur de devant à moitié transparent dans la cour pour voir (puis : « il n'y a pas besoin d'avoir le
   mur transparent tu peux le mettre normal »), la cour seulement au niveau 1 pour l'instant, « Rien poser ni planter pour l'instant » dans la cour.
   L'enceinte de grosses pierres claires et ses créneaux ; la grande porte en arc, ses deux battants fermés qui s'ouvrent
   quand on approche, leurs pentures et leurs anneaux ; deux lanternes et deux bannières rouges à fleur de lys ; au fond à gauche, la
   tour ronde, ses fenêtres allumées, son toit d'ardoises bleues, sa boule dorée et son drapeau rouge qui flotte au vent
   (VENT), sa petite porte en arc qui mène à la salle du trône ; dans la cour, l'abri à toile rouge, le tonneau, le râtelier
   de lances, un chemin de dalles ; autour, des rochers et des touffes d'herbe (sans tas de terre).
   Les cases : le carré de 7 × 7, les murs sur le tour (une case d'épaisseur), la tour sur les cases (1, 1) à (2, 2), le
   fond de la cour (l'abri, le tonneau, les lances) sur la rangée 1 ; on marche sur le reste de la cour (COUR, regles.js).
   Coordonnées : le milieu du carré en (0, 0), une case = 1 ; la case (dx, dz) a son milieu en (dx - 3, dz - 3). */
import { G, part, toon, VENT, formeUnie } from "./formes.js";
import { lanterne } from "./ciel.js";
import { jouer } from "../sons.js";

export const FACADE = 3.35;
const PIERRE = [0xDCC2A4, 0xD2B798, 0xE4CEB4, 0xC8AC8E], PIERRE_S = 0xB09878, JOINT = 0xA08668, BOIS = [0xB8642E, 0xC6713A, 0xA9582A], FONCE = 0x8A4422,
  FER = 0x4E4E56, CLOU = 0x8A8A94, ROUGE = 0xC8402E, ROUGE_S = 0x9E2E22, OR = 0xE8B23C, ARDOISE = [0x4E5A78, 0x5A6684, 0x46506C], SABLE = 0xE2BE7E, SABLE_S = 0xD2AA6A,
  TERRE = 0xD8B47A, HERBE = [0x7DB54A, 0x8FC458];
/* ce qui luit, plus fort la nuit (ciel.js) : les lanternes, les fenêtres de la tour */
const LUEUR = toon({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .8});
const VITRE = toon({color: 0xFFC860, emissive: 0xFF9A30, emissiveIntensity: .7});
for(const m of [LUEUR, VITRE]) lanterne(null, 0, 0, m);
/* la grande porte fermée, qui s'ouvre quand on s'en approche et se referme derrière soi (Yo, 5 novembre 2026 : « que la porte
   principale qui mène à la cour soit fermée et ouvre en entrant ») : ouverture va de 0 (fermée) à 1 (ouverte) ; chaque
   battant est rassemblé en une forme, avec sa matière à lui (couleurs aux sommets, le même programme que le reste), pour
   tourner sur ses gonds */
const BATTANT = toon({vertexColors: true});
let ouverture = 0;
export const porteOuverte = () => ouverture;
let sensPorte = 0;                                                   // la grande porte : son son quand elle se met à s'ouvrir ou à se fermer (choix de Yo, 12 novembre 2026)
export function ouvrirPorte(dt, proche){
  const s = proche ? 1 : -1;
  if(s !== sensPorte){ if(s > 0 && ouverture < 1) jouer("grandePorte"); else if(s < 0 && ouverture > 0) jouer("grandePorteFerme"); sensPorte = s; }
  ouverture = Math.max(0, Math.min(1, ouverture + s * dt / .45));
}
const lisse = t => t * t * (3 - 2 * t);
const DRAPEAU = toon({color: ROUGE, side: THREE.DoubleSide});

const ajoute = (g, m) => { g.add(m); return m; };
const boite = (g, hex, w, h, d, x, y, z) => ajoute(g, part(G.box, hex, w, h, d, x, y, z));
function planche(g, hex, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0){ const m = boite(g, hex, w, h, d, x, y, z); m.rotation.set(rx, ry, rz); return m; }
function arrondi(lon, lat, ex){
  const g = new THREE.SphereGeometry(.5, lon, lat), p = g.attributes.position, f = v => .5 * Math.sign(v) * Math.abs(v / .5) ** ex;
  for(let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)), f(p.getY(i)), f(p.getZ(i)));
  g.computeVertexNormals(); return g;
}
const BLOC = arrondi(10, 8, .3), BLOC_L = arrondi(8, 6, .28), CAILLOU = new THREE.IcosahedronGeometry(.5, 0), ECAILLE = new THREE.SphereGeometry(.5, 8, 4);
const bloc = (g, hex, sx, sy, sz, x, y, z, ry = 0, geo = BLOC_L) => { const m = ajoute(g, part(geo, hex, sx, sy, sz, x, y, z)); m.rotation.y = ry; return m; };
let alea = 23;
const hasard = () => (alea = (alea * 16807) % 2147483647) / 2147483647;
const pierre = () => PIERRE[Math.floor(hasard() * 4)];

/* l'enceinte : ses murs au milieu des cases du tour (à ±3), épais de E, hauts de HM ; la grande porte au milieu du mur de
   devant, large de LP, son arc en HP */
const A = 3, E = .72, HM = 1.75, RANGS = 4, LP = .96, HP = 1.1;
/* un parement de pierres de a à b, le long de x (en z = fixe) ou de z (en x = fixe), du sol à HM, sauf les trous
   [u0, u1, y0, y1] ; devant : le côté où il regarde (±1) ; geo : des pierres arrondies ou de simples boîtes */
function parement(g, a, b, fixe, le, devant, trous = [], geo = BLOC_L){
  const h = HM / RANGS;
  for(let r = 0; r < RANGS; r++){
    const y = (r + .5) * h, morceaux = [];
    let deb = a;
    for(const [u0, u1, y0, y1] of trous.filter(t => y > t[2] && y < t[3]).sort((p, q) => p[0] - q[0])){ if(u0 > deb) morceaux.push([deb, u0]); deb = Math.max(deb, u1); }
    if(deb < b) morceaux.push([deb, b]);
    for(const [u0, u1] of morceaux){
      let u = u0 + (r % 2 ? .25 : 0) * (u1 - u0 > 1 ? 1 : 0);
      if(u > u0){ const c = (u0 + u) / 2; le === "x" ? bloc(g, pierre(), u - u0 - .03, h - .03, .2, c, y, fixe + devant * .02, 0, geo) : bloc(g, pierre(), .2, h - .03, u - u0 - .03, fixe + devant * .02, y, c, 0, geo); }
      while(u < u1 - .03){
        const l = Math.min(u1 - u, .5 + hasard() * .22), ll = u1 - u - l < .2 ? u1 - u : l, c = u + ll / 2;
        if(le === "x") bloc(g, pierre(), ll - .03, h - .03, .2, c, y, fixe + devant * .02, (hasard() - .5) * .02, geo);
        else bloc(g, pierre(), .2, h - .03, ll - .03, fixe + devant * .02, y, c, (hasard() - .5) * .02, geo);
        u += ll;
      }
    }
  }
}
/* les créneaux sur le bord du dehors, et le chemin de ronde dessus */
function creneaux(g, a, b, fixe, le, dehors, sauf = null){
  const n = Math.round((b - a) / .82);
  for(let k = 0; k <= n; k++){
    const u = a + k * (b - a) / n;
    if(sauf && u > sauf[0] && u < sauf[1]) continue;
    const x = le === "x" ? u : fixe + dehors * (E / 2 - .14), z = le === "x" ? fixe + dehors * (E / 2 - .14) : u;
    bloc(g, pierre(), le === "x" ? .46 : .3, .42, le === "x" ? .3 : .46, x, HM + .2, z, 0, BLOC);
  }
}
function enceinte(g, devant){
  /* le coeur des murs, le chemin de ronde dessus */
  for(const [x, z, w, d, gg] of [[0, -A, 2 * A + E, E, g], [-A, 0, E, 2 * A, g], [A, 0, E, 2 * A, g]]){
    boite(gg, PIERRE_S, w - .1, HM - .04, d - .1, x, HM / 2, z); boite(gg, JOINT, w - .04, .06, d - .04, x, HM, z); }
  for(const s of [-1, 1]){ const w = A - LP / 2 + E / 2, x = s * (LP / 2 + w / 2);
    boite(devant, PIERRE_S, w - .1, HM - .04, E - .1, x, HM / 2, A); boite(devant, JOINT, w - .04, .06, E - .04, x, HM, A); }
  boite(devant, PIERRE_S, LP + .1, HM - HP - .45, E - .1, 0, HP + .45 + (HM - HP - .45) / 2, A);
  /* les parements : devant (dehors, la porte au milieu), les côtés (dehors), le fond (côté cour) ; les autres faces, unies */
  const L = A + E / 2, trouPorte = [[-LP / 2 - .05, LP / 2 + .05, 0, HP + LP / 2 + .12]];
  parement(devant, -L, L, A + E / 2, "x", 1, trouPorte, BLOC_L);
  parement(devant, -A + E / 2, A - E / 2, A - E / 2, "x", -1, trouPorte, G.box);
  parement(g, -L, L, -A + E / 2, "x", 1);
  parement(g, -L, L, -A - E / 2, "x", -1, [], G.box);
  for(const s of [-1, 1]){ parement(g, -A + E / 2, A + E / 2, s * (A + E / 2), "z", s, [], G.box); parement(g, -A + E / 2, A - E / 2, s * (A - E / 2), "z", -s, [], G.box); }
  /* les grosses pierres des coins */
  for(const [x, z, gg] of [[-A, A, devant], [A, A, devant], [-A, -A, g], [A, -A, g]])
    for(let r = 0; r < 3; r++) bloc(gg, pierre(), E + .16, HM / 3 - .03, E + .16, x, (r + .5) * HM / 3, z, (hasard() - .5) * .1, BLOC);
  /* les créneaux */
  creneaux(devant, -L + .2, L - .2, A, "x", 1, [-.3, .3]);
  creneaux(g, -L + .2, L - .2, -A, "x", -1);
  for(const s of [-1, 1]) creneaux(g, -A + .6, A - .6, s * A, "z", s);
  /* l'arc de la grande porte et ses claveaux, le passage dallé */
  for(let k = 0; k <= 8; k++){ const an = Math.PI * k / 8, r = LP / 2 + .12;
    const m = bloc(devant, PIERRE[k % 4], .26, .3, E + .06, Math.cos(an) * r, HP + Math.sin(an) * r, A, 0, BLOC); m.rotation.z = an - Math.PI / 2; }
  for(const s of [-1, 1]) bloc(devant, pierre(), .26, HP, E + .06, s * (LP / 2 + .12), HP / 2, A, 0, BLOC);
  for(let k = 0; k < 3; k++) bloc(g, PIERRE[k % 4], LP - .06, .05, E / 3 - .03, 0, .03, A - E / 3 + k * E / 3, 0);
}
/* la grande porte : deux battants de planches, leurs pentures et leurs anneaux ; fermés, ils s'ouvrent vers la cour
   (ouvrirPorte) */
function grandePorte(g){
  for(const s of [-1, 1]){
    const gond = new THREE.Group(), b = new THREE.Group(); gond.position.set(s * (LP / 2 - .04), 0, A + E / 2 - .06); g.add(gond); gond.add(b);
    const w = LP / 2 - .02;
    for(let k = 0; k < 3; k++) boite(b, k % 2 ? BOIS[1] : BOIS[0], w / 3 - .01, HP + .2, .06, -s * (k + .5) * w / 3, (HP + .2) / 2, 0);
    for(const y of [.3, HP - .05]){ boite(b, FER, w, .08, .03, -s * w / 2, y, .04); for(const k of [.2, .5, .8]) ajoute(b, part(G.head, CLOU, .12, .12, .08, -s * w * k, y, .06)); }
    ajoute(b, part(G.tore, FER, .2, .2, .3, -s * w * .75, .7, .07));
    const {lots, pris} = formeUnie(b);
    for(const o of pris) o.parent.remove(o);
    for(const [, {geo}] of lots){
      const m = new THREE.Mesh(geo, BATTANT); m.castShadow = m.receiveShadow = true; b.add(m);
      m.onBeforeRender = () => { gond.rotation.y = s * -Math.PI / 2 * .92 * lisse(ouverture); gond.updateMatrixWorld(true); };
    }
  }
}
/* une lanterne murale sur sa potence de fer, qui brille la nuit */
function lanterneMur(g, x, y, z){
  boite(g, FER, .08, .2, .05, x, y + .44, z);
  boite(g, FER, .05, .05, .26, x, y + .4, z + .12);
  boite(g, FER, .025, .12, .025, x, y + .3, z + .24);
  const chapeau = ajoute(g, part(G.cone4, FER, .26, .12, .26, x, y + .18, z + .24)); chapeau.rotation.y = Math.PI / 4;
  ajoute(g, part(G.box, LUEUR, .14, .2, .14, x, y, z + .24));
  for(const [dx, dz] of [[-.075, -.075], [.075, -.075], [-.075, .075], [.075, .075]]) boite(g, FER, .025, .24, .025, x + dx, y, z + .24 + dz);
  boite(g, FER, .2, .04, .2, x, y - .13, z + .24);
}
/* une bannière rouge bordée d'or, sa tringle dorée, sa fleur de lys, sa pointe en bas */
function banniere(devant, x){
  const z = A + E / 2 + .14, y = 1.15, w = .5, h = .78;
  ajoute(devant, part(G.cyl, OR, .06, w + .16, .06, x, y + h / 2 + .04, z)).rotation.z = Math.PI / 2;
  boite(devant, OR, w + .04, h + .04, .02, x, y, z - .005);
  boite(devant, ROUGE, w - .04, h - .06, .03, x, y + .02, z + .005);
  for(const s of [-1, 1]) planche(devant, s < 0 ? ROUGE : ROUGE_S, w * .74, .1, .03, x + s * w * .2, y - h / 2 - .06, z + .005, 0, 0, s * .55);
  /* la fleur de lys : un pétale droit, deux recourbés, le lien */
  ajoute(devant, part(G.head, OR, .2, .55, .1, x, y + .1, z + .03));
  for(const s of [-1, 1]){ const p = ajoute(devant, part(G.head, OR, .16, .4, .08, x + s * .1, y + .03, z + .03)); p.rotation.z = s * .7; }
  boite(devant, OR, .24, .05, .04, x, y - .02, z + .035);
  ajoute(devant, part(G.cone, OR, .1, .14, .06, x, y - .12, z + .03)).rotation.x = Math.PI;
}
/* la tour ronde au fond à gauche : ses rangs de pierres, ses fenêtres allumées, ses jours sous le toit, sa petite porte en arc
   (face à la cour : la porte de la salle du trône), son toit d'ardoises, sa boule dorée, son drapeau qui flotte */
export const TOUR = {x: -2, z: -1.5, r: 1.0, h: 3.0};
function tour(g){
  const {x, z, r, h} = TOUR, rangs = 7, hr = h / rangs;
  ajoute(g, part(G.cyl, PIERRE_S, 2 * r - .12, h, 2 * r - .12, x, h / 2, z));
  for(let k = 0; k < rangs; k++){
    const y = (k + .5) * hr, n = 13, dec = k % 2 ? Math.PI / n : 0;
    for(let i = 0; i < n; i++){
      const an = dec + i / n * Math.PI * 2, px = x + Math.sin(an) * (r - .1), pz = z + Math.cos(an) * (r - .1);
      if(k < 3 && Math.abs(Math.sin(an)) < .25 && Math.cos(an) > 0) continue;                       // la porte, face à la cour
      if(k === 5 && Math.cos(an) > .3 && Math.abs(Math.sin(an)) > .2 && Math.abs(Math.sin(an)) < .75) continue;   // les deux fenêtres
      const m = bloc(g, pierre(), 2 * Math.PI * r / n - .04, hr - .03, .22, px, y, pz, an, k === rangs - 1 ? BLOC : BLOC_L);
      m.rotation.y = an;
    }
  }
  /* les deux fenêtres en arc, allumées */
  for(const s of [-1, 1]){ const an = s * .55, px = x + Math.sin(an) * (r - .06), pz = z + Math.cos(an) * (r - .06), y = 5.5 * hr;
    const f = ajoute(g, part(G.box, VITRE, .2, .3, .05, px, y - .02, pz)); f.rotation.y = an;
    const c = ajoute(g, part(G.cyl, VITRE, .2, .05, .2, px, y + .13, pz)); c.rotation.set(Math.PI / 2, an, 0, "YXZ"); }
  /* la petite porte en arc, ses claveaux, ses planches */
  const pz = z + r, py = .78, pr = .3;
  for(let k = 0; k < 3; k++) boite(g, k % 2 ? BOIS[1] : BOIS[0], .19, py + .1, .05, x - .2 + k * .2, (py + .1) / 2, pz - .08);
  ajoute(g, part(G.cyl, BOIS[1], 2 * pr - .04, .05, 2 * pr - .04, x, py, pz - .08)).rotation.x = Math.PI / 2;
  for(let k = 0; k <= 6; k++){ const an = Math.PI * k / 6, rr = pr + .1;
    const m = bloc(g, PIERRE[k % 4], .18, .22, .3, x + Math.cos(an) * rr, py + Math.sin(an) * rr, pz - .04, 0, BLOC); m.rotation.z = an - Math.PI / 2; }
  for(const s of [-1, 1]) bloc(g, pierre(), .18, py, .3, x + s * (pr + .1), py / 2, pz - .04, 0, BLOC);
  ajoute(g, part(G.tore, FER, .12, .12, .3, x + .12, .5, pz - .04));
  bloc(g, PIERRE[2], .8, .08, .34, x, .04, pz + .14, 0);
  /* le toit d'ardoises : un cône, et dessus des rangs d'écailles */
  const R0 = r + .3, HT = 1.55, y0 = h + .02;
  ajoute(g, part(G.cone, ARDOISE[2], 2 * R0 - .1, HT, 2 * R0 - .1, x, y0 + HT / 2, z));
  for(let k = 0; k < 5; k++){
    const f = k / 5, rr = R0 * (1 - f) - .02, yy = y0 + HT * f + .08, n = Math.max(6, Math.round(2 * Math.PI * rr / .32)), a = Math.atan2(HT, R0);
    for(let i = 0; i < n; i++){ const an = (i + (k % 2) * .5) / n * Math.PI * 2;
      const e = ajoute(g, part(ECAILLE, ARDOISE[(i + k) % 3], 2 * Math.PI * rr / n * 1.15, .07, .36, x + Math.sin(an) * rr, yy, z + Math.cos(an) * rr));
      e.rotation.set(0, an, 0); e.rotateX(a * .9 - Math.PI / 2 + Math.PI / 2); }
  }
  ajoute(g, part(G.cyl, OR, .12, .5, .12, x, y0 + HT + .2, z));
  ajoute(g, part(G.head, OR, .9, .9, .9, x, y0 + HT + .5, z));
  ajoute(g, part(G.cyl, OR, .05, .55, .05, x, y0 + HT + .85, z));
  /* le drapeau rouge, en trois morceaux qui ondulent au vent : un seul dessin */
  const n = 4, morceau = new THREE.BoxGeometry(1, 1, 1), drap = new THREE.InstancedMesh(morceau, DRAPEAU, n), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  drap.castShadow = true; drap.receiveShadow = false; drap.frustumCulled = false;
  const fy = y0 + HT + 1.0, lg = .2;
  const bouge = () => {
    const t = VENT.temps.value;
    let px = x + .03, pz2 = z, ang = 0;
    for(let k = 0; k < n; k++){
      const haut = .4 - k * .07;
      ang += Math.sin(t * 3.2 - k * 1.1) * .28 * (k ? 1 : .5);
      const cx = px + Math.cos(ang) * lg / 2, cz = pz2 - Math.sin(ang) * lg / 2;
      p.set(cx, fy - k * .02, cz); s.set(lg + .02, haut, .025); q.setFromEuler(e.set(0, ang, 0));
      drap.setMatrixAt(k, m.compose(p, q, s));
      px += Math.cos(ang) * lg; pz2 -= Math.sin(ang) * lg;
    }
    drap.instanceMatrix.needsUpdate = true;
  };
  bouge(); drap.onBeforeRender = bouge; g.add(drap);
}
/* la cour : son sol de terre battue, le chemin de dalles de la grande porte à la tour ; au fond, l'abri à toile rouge et sa
   table, le tonneau, le râtelier de lances */
function cour(g){
  /* la terre battue un peu au-dessus de la plaque de sable (son dessus à .05) : à la même hauteur, les deux scintillaient
     (Yo, 5 novembre 2026 : « le visuel dans la cour du château fait des flash, scintillement ») */
  const sol = ajoute(g, part(G.box, TERRE, 2 * A - E, .04, 2 * A - E, 0, .045, 0)); sol.castShadow = false;
  for(const [x, z] of [[0, 2.1], [-.05, 1.35], [-.5, .65], [-1.2, .25], [-1.9, .15]]) bloc(g, PIERRE[Math.floor(hasard() * 4)], .62, .05, .5, x, .06, z, (hasard() - .5) * .3);
  /* l'abri : quatre poteaux, la toile rouge qui descend vers l'avant, la table et ses caisses */
  const ax = 0, az = -2.05;
  for(const dx of [-.42, .42]) for(const [dz, h] of [[-.32, 1.2], [.32, 1.0]]) boite(g, BOIS[0], .08, h, .08, ax + dx, h / 2, az + dz);
  planche(g, ROUGE, 1.06, .04, .82, ax, 1.12, az, .3, 0, 0);
  for(const dx of [-.4, -.13, .13, .4]) planche(g, ROUGE_S, .03, .045, .82, ax + dx, 1.14, az, .3, 0, 0);
  boite(g, BOIS[1], .8, .06, .4, ax, .5, az - .05);
  for(const dx of [-.34, .34]) boite(g, FONCE, .06, .48, .34, ax + dx, .25, az - .05);
  boite(g, BOIS[2], .26, .2, .2, ax - .18, .63, az - .08); boite(g, BOIS[0], .2, .16, .18, ax + .15, .61, az - .06);
  /* le tonneau cerclé de fer */
  const tx = 1.0, tz = -2.05, r = .22, h = .5;
  for(let k = 0; k < 10; k++){ const an = k / 10 * Math.PI * 2;
    planche(g, BOIS[k % 3], .14, h, .045, tx + Math.sin(an) * r, h / 2 + .02, tz + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .05, .04, r * 2 - .05, tx, h - .03, tz));
  for(const y of [.1, .4]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, tx, y, tz)); c.rotation.x = Math.PI / 2; }
  /* le râtelier : deux montants, deux traverses, trois lances debout */
  const rx = 2.0, rz = -2.2;
  for(const dx of [-.32, .32]) boite(g, FONCE, .07, .9, .07, rx + dx, .45, rz);
  for(const y of [.3, .75]) boite(g, BOIS[1], .72, .06, .06, rx, y, rz + .04);
  for(const dx of [-.18, 0, .18]){ boite(g, BOIS[0], .04, 1.2, .04, rx + dx, .62, rz + .08);
    ajoute(g, part(G.cone4, CLOU, .08, .2, .04, rx + dx, 1.3, rz + .08)); }
}
/* le dehors : la plaque de sable, les dalles devant la porte, des rochers, des touffes d'herbe */
function dehors(g){
  const m = ajoute(g, part(G.cyl, SABLE, 6.95, .05, 6.95, 0, .025, 0)); m.receiveShadow = true; m.castShadow = false;
  const s = ajoute(g, part(G.cyl, SABLE_S, 1.6, .052, .5, 0, .027, 3.3)); s.receiveShadow = true; s.castShadow = false;
  for(const [x, w] of [[-.32, .56], [.3, .5]]) bloc(g, PIERRE[Math.floor(hasard() * 4)], w, .05, .22, x, .05, 3.42, (hasard() - .5) * .1);
  for(const [x, z, sx, sy, sz] of [[-3.25, 3.3, .45, .32, .4], [3.3, 3.25, .4, .3, .38], [-3.35, -1.2, .3, .24, .3], [3.35, .8, .32, .22, .3]]){
    const r = ajoute(g, part(CAILLOU, pierre(), sx, sy, sz, x, sy * .36, z)); r.rotation.set(0, hasard() * 3, 0); }
  for(const [x, z] of [[-2.4, 3.42], [1.6, 3.42], [3.42, 2.2], [-3.42, 1.4], [-3.42, -2.6]]){
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function chateauNiveau1(g){
  alea = 23;
  dehors(g);
  cour(g);
  enceinte(g, g);
  grandePorte(g);
  for(const s of [-1, 1]){ banniere(g, s * 2.05); lanterneMur(g, s * 1.0, 1.25, A + E / 2); }
  tour(g);
  g.userData.toit = HM + .4;
}

/* ================= Le Château, niveau 2 =================
   D'après l'image de Yo (14 novembre 2026 : « Voici le château niveau 2. J'aimerais qu'il ait une cour également » ; « Oui,
   vas-y ») : la même place (7 × 7) ; devant, la façade de l'image : deux tours rondes aux coins, la grande porte en arc qui
   s'ouvre quand on approche (la même qu'au niveau 1), le mur au-dessus d'elle plus haut et crénelé, deux bannières rouges à fleur
   de lys, deux lanternes, les marches ; derrière la porte, la cour (COUR2, regles.js), son chemin de dalles, l'abri à toile
   rouge, le tonneau, le râtelier de lances ; au fond, le donjon crénelé, ses fenêtres allumées en arc, sa bannière, sa porte en
   arc qui mène à la salle du trône (lieux.js : doorOf) ; derrière lui, les deux autres tours. Les tours : leurs pierres, leurs
   fenêtres allumées, leur toit d'ardoises bleues, la boule dorée, le drapeau rouge qui flotte (VENT). Des touffes d'herbe (sans
   tas de terre). La nuit, les fenêtres et les lanternes brillent plus fort. Allégé pour le téléphone : les pierres des tours et
   les ardoises en formes simples. */
const C2 = {DZ: -1.5, DX: 1.45, DH: 3.3, TR: .78, TH: 3.0, TC: 2.55};   // TC : le milieu des tours de devant (elles restent dans le carré de 7 × 7)
const BOULE_T = new THREE.SphereGeometry(.5, 8, 5), BLOC_T = arrondi(6, 4, .3), ECAILLE_T = new THREE.SphereGeometry(.5, 6, 3);
/* les créneaux, en pierres simples (le téléphone) */
function creneaux2(g, a, b, fixe, le, dehors){
  const n = Math.round((b - a) / .82);
  for(let k = 0; k <= n; k++){ const u = a + k * (b - a) / n, x = le === "x" ? u : fixe + dehors * (E / 2 - .14), z = le === "x" ? fixe + dehors * (E / 2 - .14) : u;
    bloc(g, pierre(), le === "x" ? .46 : .3, .42, le === "x" ? .3 : .46, x, HM + .2, z, 0, BLOC_T); }
}
/* une tour ronde : ses rangs de pierres, ses fenêtres allumées (tournées vers fen), son toit d'ardoises, la boule, le drapeau */
function tourRonde(g, x, z, r, h, fen){
  const rangs = 6, hr = h / rangs;
  ajoute(g, part(G.cyl, PIERRE_S, 2 * r - .1, h, 2 * r - .1, x, h / 2, z));
  for(let k = 0; k < rangs; k++){
    const y = (k + .5) * hr, n = Math.max(9, Math.round(2 * Math.PI * r / .56)), dec = k % 2 ? Math.PI / n : 0;
    for(let i = 0; i < n; i++){
      const an = dec + i / n * Math.PI * 2, da = Math.atan2(Math.sin(an - fen), Math.cos(an - fen));
      if((k === 2 || k === 4) && Math.abs(da) < .28) continue;                                      // les fenêtres
      bloc(g, pierre(), 2 * Math.PI * r / n + .02, hr - .02, .22, x + Math.sin(an) * (r - .1), y, z + Math.cos(an) * (r - .1), an, BLOC_T);
    }
  }
  for(const k of [2, 4]){ const px = x + Math.sin(fen) * (r - .05), pz = z + Math.cos(fen) * (r - .05), y = (k + .45) * hr;
    const f = ajoute(g, part(G.box, VITRE, .22, .3, .05, px, y, pz)); f.rotation.y = fen;
    const c = ajoute(g, part(G.cyl, VITRE, .22, .05, .22, px, y + .15, pz)); c.rotation.set(Math.PI / 2, fen, 0, "YXZ");
    bloc(g, PIERRE[2], .38, .07, .14, px + Math.sin(fen) * .04, y - .19, pz + Math.cos(fen) * .04, fen, G.box); }
  /* le rebord crénelé sous le toit */
  for(let i = 0; i < 10; i++){ const an = i / 10 * Math.PI * 2; bloc(g, pierre(), .32, .3, .22, x + Math.sin(an) * (r + .02), h + .1, z + Math.cos(an) * (r + .02), an, BLOC_T); }
  /* le toit d'ardoises : un cône, des rangs d'écailles */
  const R0 = r + .15, HT = 1.45, y0 = h + .22;
  ajoute(g, part(G.cone, ARDOISE[2], 2 * R0 - .1, HT, 2 * R0 - .1, x, y0 + HT / 2, z));
  for(let k = 0; k < 4; k++){
    const f = k / 4, rr = R0 * (1 - f) - .02, yy = y0 + HT * f + .06, n = Math.max(6, Math.round(2 * Math.PI * rr / .38)), a = Math.atan2(HT, R0);
    for(let i = 0; i < n; i++){ const an = (i + (k % 2) * .5) / n * Math.PI * 2;
      const e = ajoute(g, part(ECAILLE_T, ARDOISE[(i + k) % 3], 2 * Math.PI * rr / n * 1.2, .08, .36, x + Math.sin(an) * rr, yy, z + Math.cos(an) * rr));
      e.rotation.set(0, an, 0); e.rotateX(a * .9); }
  }
  ajoute(g, part(G.cyl, OR, .1, .4, .1, x, y0 + HT + .15, z));
  ajoute(g, part(BOULE_T, OR, .7, .7, .7, x, y0 + HT + .4, z));
  ajoute(g, part(G.cyl, OR, .04, .5, .04, x, y0 + HT + .72, z));
  drapeau(g, x, z, y0 + HT + .85);
}
/* le drapeau rouge, en morceaux qui ondulent au vent : un seul dessin */
function drapeau(g, x, z, fy){
  const n = 4, drap = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), DRAPEAU, n), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  drap.castShadow = true; drap.receiveShadow = false; drap.frustumCulled = false;
  const lg = .17, t0 = x * 1.7 + z;
  const bouge = () => {
    const t = VENT.temps.value + t0;
    let px = x + .03, pz = z, ang = 0;
    for(let k = 0; k < n; k++){
      const haut = .34 - k * .06;
      ang += Math.sin(t * 3.2 - k * 1.1) * .28 * (k ? 1 : .5);
      p.set(px + Math.cos(ang) * lg / 2, fy - k * .02, pz - Math.sin(ang) * lg / 2); s.set(lg + .02, haut, .025); q.setFromEuler(e.set(0, ang, 0));
      drap.setMatrixAt(k, m.compose(p, q, s));
      px += Math.cos(ang) * lg; pz -= Math.sin(ang) * lg;
    }
    drap.instanceMatrix.needsUpdate = true;
  };
  bouge(); drap.onBeforeRender = bouge; g.add(drap);
}
/* l'enceinte : le mur de devant (la grande porte), les côtés ; le mur au-dessus de la porte plus haut, crénelé */
function enceinte2(g){
  const T = C2.TR, zf = A + E / 2, L0 = A - T + .1;                                                // de la porte jusqu'aux tours
  for(const s of [-1, 1]){ const w = L0 - LP / 2, x = s * (LP / 2 + w / 2);
    boite(g, PIERRE_S, w, HM - .04, E - .1, x, HM / 2, A); boite(g, JOINT, w + .06, .06, E - .04, x, HM, A); }
  /* le haut du mur de la porte, plus haut et crénelé, comme l'image */
  const HG = 2.35, LG = 2.3;
  boite(g, PIERRE_S, LG, HG - HP - .45, E - .1, 0, HP + .45 + (HG - HP - .45) / 2, A);
  const trouPorte = [[-LP / 2 - .05, LP / 2 + .05, 0, HP + LP / 2 + .12]];
  parement(g, -L0, L0, zf, "x", 1, trouPorte, BLOC_T);
  parement(g, -L0 + .1, L0 - .1, A - E / 2, "x", -1, trouPorte, G.box);
  for(let r = 0; r < 2; r++){ const y = HM + (r + .5) * (HG - HM) / 2;
    for(let k = 0; k < 4; k++) bloc(g, pierre(), LG / 4 - .03, (HG - HM) / 2 - .03, .22, -LG / 2 + (k + .5 + (r % 2) * .5) * LG / 4 - (r % 2 && k === 3 ? LG / 8 : 0), y, zf + .02, 0, BLOC_T); }
  for(let k = 0; k < 5; k++) bloc(g, pierre(), .36, .4, .3, -LG / 2 + .18 + k * (LG - .36) / 4, HG + .18, A + .2, 0, BLOC_T);
  creneaux2(g, -L0 + .15, -LG / 2 - .1, A, "x", 1); creneaux2(g, LG / 2 + .1, L0 - .15, A, "x", 1);
  /* le mur de derrière, d'un coin à l'autre, derrière le donjon et les tours (fermé : Yo, faire le tour) */
  { const zb = -A, L = A + E / 2;
    boite(g, PIERRE_S, 2 * A + E - .1, HM - .04, E - .1, 0, HM / 2, zb); boite(g, JOINT, 2 * A + E - .04, .06, E - .04, 0, HM, zb);
    parement(g, -L, L, zb - E / 2, "x", -1, [], BLOC_T); creneaux2(g, -L + .2, L - .2, zb, "x", -1);
    for(const sx of [-1, 1]) for(let r = 0; r < 3; r++) bloc(g, pierre(), E + .16, HM / 3 - .03, E + .16, sx * A, (r + .5) * HM / 3, zb, 0, BLOC_T); }
  /* les côtés : du mur de derrière à la tour de devant */
  for(const s of [-1, 1]){ const z0 = -A + E / 2, z1 = A - T + .1, x = s * A;
    boite(g, PIERRE_S, E - .1, HM - .04, z1 - z0, x, HM / 2, (z0 + z1) / 2); boite(g, JOINT, E - .04, .06, z1 - z0 + .06, x, HM, (z0 + z1) / 2);
    parement(g, z0, z1, s * (A + E / 2), "z", s, [], BLOC_T); parement(g, z0, z1, s * (A - E / 2), "z", -s, [], G.box);
    creneaux2(g, z0 + .2, z1 - .2, x, "z", s); }
  /* l'arc de la grande porte, ses claveaux, ses montants, le passage dallé ; les marches devant */
  for(let k = 0; k <= 8; k++){ const an = Math.PI * k / 8, r = LP / 2 + .12;
    const m = bloc(g, PIERRE[k % 4], .26, .3, E + .06, Math.cos(an) * r, HP + Math.sin(an) * r, A, 0, BLOC_T); m.rotation.z = an - Math.PI / 2; }
  for(const s of [-1, 1]) bloc(g, pierre(), .26, HP, E + .06, s * (LP / 2 + .12), HP / 2, A, 0, BLOC_T);
  for(let k = 0; k < 3; k++) bloc(g, PIERRE[k % 4], LP - .06, .05, E / 3 - .03, 0, .03, A - E / 3 + k * E / 3, 0);
  bloc(g, PIERRE[0], 1.5, .12, .36, 0, .06, A + E / 2 + .26, 0); bloc(g, PIERRE[2], 1.2, .1, .22, 0, .16, A + E / 2 + .14, 0);
  for(const s of [-1, 1]) bloc(g, pierre(), .3, .36, .4, s * .82, .18, A + E / 2 + .22, 0, BLOC_T);
}
/* le donjon, au fond de la cour : son cœur, ses pierres, ses créneaux, ses fenêtres, sa bannière, sa porte en arc */
function donjon(g){
  const {DZ, DX, DH} = C2, z0 = -A - E / 2 + .05, zf = DZ, rangs = 7, hr = DH / rangs;
  boite(g, PIERRE_S, 2 * DX - .1, DH, zf - z0 - .1, 0, DH / 2, (z0 + zf) / 2);
  const P = {x: 0, w: .74, y: 1.0};                                                                // la porte
  for(let r = 0; r < rangs; r++){ const y = (r + .5) * hr, trous = [];
    if(y < P.y + .02) trous.push([-P.w / 2 - .14, P.w / 2 + .14]);
    else if(y < P.y + P.w / 2 + .3){ const w = Math.sqrt(Math.max(0, (P.w / 2 + .16) ** 2 - (y - P.y) ** 2)); if(w) trous.push([-w, w]); }
    if(r === 4) for(const s of [-1, 1]) trous.push([s * .75 - .17, s * .75 + .17]);
    let u = -DX, deb = true;
    const morceaux = []; let d0 = -DX;
    for(const [a, b] of trous.sort((p, q) => p[0] - q[0])){ if(a > d0) morceaux.push([d0, a]); d0 = Math.max(d0, b); }
    if(d0 < DX) morceaux.push([d0, DX]);
    for(const [a, b] of morceaux){ let v = a + (r % 2 && b - a > .8 ? .22 : 0);
      if(v > a) bloc(g, pierre(), v - a - .02, hr - .02, .22, (a + v) / 2, y, zf + .02, 0, BLOC_T);
      while(v < b - .03){ const l = Math.min(b - v, .44 + hasard() * .2), ll = b - v - l < .18 ? b - v : l; bloc(g, pierre(), ll - .02, hr - .02, .22, v + ll / 2, y, zf + .02, 0, BLOC_T); v += ll; } }
  }
  /* les pierres des côtés et de l'arrière, jusqu'en haut (au-dessus du mur, on les voit de partout) */
  const mur = (a, b, fixe, le, dehors) => { for(let r = 0; r < rangs; r++){ const y = (r + .5) * hr; let v = a + (r % 2 ? .24 : 0);
    if(v > a) le === "x" ? bloc(g, pierre(), v - a - .02, hr - .02, .2, (a + v) / 2, y, fixe + dehors * .02, 0, BLOC_T) : bloc(g, pierre(), .2, hr - .02, v - a - .02, fixe + dehors * .02, y, (a + v) / 2, 0, BLOC_T);
    while(v < b - .03){ const l = Math.min(b - v, .46 + hasard() * .2), ll = b - v - l < .18 ? b - v : l;
      le === "x" ? bloc(g, pierre(), ll - .02, hr - .02, .2, v + ll / 2, y, fixe + dehors * .02, 0, BLOC_T) : bloc(g, pierre(), .2, hr - .02, ll - .02, fixe + dehors * .02, y, v + ll / 2, 0, BLOC_T); v += ll; } } };
  for(const s of [-1, 1]) mur(z0, zf, s * DX, "z", s);
  mur(-DX, DX, z0, "x", -1);
  /* les créneaux tout autour du haut, le chemin de ronde */
  boite(g, JOINT, 2 * DX, .06, zf - z0, 0, DH + .01, (z0 + zf) / 2);
  for(let k = 0; k <= 5; k++) bloc(g, pierre(), .42, .42, .3, -DX + .2 + k * (2 * DX - .4) / 5, DH + .2, zf - .1, 0, BLOC_T);
  for(const s of [-1, 1]) for(let k = 0; k <= 2; k++) bloc(g, pierre(), .3, .42, .38, s * (DX - .12), DH + .2, z0 + .25 + k * (zf - z0 - .5) / 2, 0, BLOC_T);
  for(let k = 0; k <= 5; k++) bloc(g, pierre(), .42, .42, .3, -DX + .2 + k * (2 * DX - .4) / 5, DH + .2, z0 + .1, 0, BLOC_T);   // et derrière
  /* les deux fenêtres allumées en arc et leurs appuis ; la bannière entre elles */
  for(const s of [-1, 1]){ const fx = s * .75, fy = 4.45 * hr;
    ajoute(g, part(G.box, VITRE, .26, .32, .04, fx, fy, zf + .03));
    ajoute(g, part(G.cyl, VITRE, .26, .04, .26, fx, fy + .16, zf + .03)).rotation.x = Math.PI / 2;
    for(const d of [-1, 1]) planche(g, BOIS[1], .02, .44, .02, fx, fy + .04, zf + .06, 0, 0, d * Math.PI / 4);
    bloc(g, PIERRE[2], .44, .08, .16, fx, fy - .21, zf + .08, 0, G.box); }
  { const x = 0, y = 4.1 * hr, z = zf + .14, w = .4, h = .66;
    ajoute(g, part(G.cyl, OR, .05, w + .14, .05, x, y + h / 2 + .04, z)).rotation.z = Math.PI / 2;
    boite(g, OR, w + .04, h + .04, .02, x, y, z - .005); boite(g, ROUGE, w - .04, h - .06, .03, x, y + .02, z + .005);
    for(const s of [-1, 1]) planche(g, s < 0 ? ROUGE : ROUGE_S, w * .74, .09, .03, x + s * w * .2, y - h / 2 - .05, z + .005, 0, 0, s * .55);
    ajoute(g, part(BOULE_T, OR, .17, .46, .08, x, y + .08, z + .03));
    for(const s of [-1, 1]){ const p = ajoute(g, part(BOULE_T, OR, .13, .34, .07, x + s * .08, y + .02, z + .03)); p.rotation.z = s * .7; } }
  /* la porte en arc : ses planches, son arc de claveaux, ses pentures, l'anneau, la marche */
  const r = P.w / 2;
  for(let k = 0; k < 4; k++){ const x = -P.w / 2 + (k + .5) * P.w / 4, haut = P.y + Math.sqrt(Math.max(0, (r - .02) ** 2 - x * x));
    boite(g, k % 2 ? BOIS[1] : BOIS[0], P.w / 4 - .012, haut, .06, x, haut / 2, zf + .01); }
  for(let k = 0; k <= 7; k++){ const an = Math.PI * k / 7, rr = r + .1;
    const m = bloc(g, PIERRE[k % 4], .2, .22, .3, Math.cos(an) * rr, P.y + Math.sin(an) * rr, zf + .04, 0, BLOC_T); m.rotation.z = an - Math.PI / 2; }
  for(const s of [-1, 1]) bloc(g, pierre(), .2, P.y, .3, s * (r + .1), P.y / 2, zf + .04, 0, BLOC_T);
  for(const y of [.3, .85]){ boite(g, FER, P.w - .1, .07, .03, 0, y, zf + .05); for(const x of [-.2, 0, .2]) ajoute(g, part(BOULE_T, CLOU, .1, .1, .07, x, y, zf + .07)); }
  ajoute(g, part(G.tore, FER, .16, .16, .3, .14, .55, zf + .07));
  bloc(g, PIERRE[2], P.w + .4, .08, .34, 0, .04, zf + .2, 0, G.box);
}
/* la cour : son sol de terre battue, le chemin de dalles de la grande porte au donjon ; l'abri contre le mur de gauche, le
   tonneau et le râtelier contre celui de droite */
function cour2(g){
  const sol = ajoute(g, part(G.box, TERRE, 2 * A - E, .04, A - C2.DZ - E / 2, 0, .045, (A - E / 2 + C2.DZ) / 2)); sol.castShadow = false;
  for(const z of [2.2, 1.5, .8, .1, -.6, -1.15]) bloc(g, PIERRE[Math.floor(hasard() * 4)], .62, .05, .48, (hasard() - .5) * .12, .06, z, (hasard() - .5) * .3);
  /* l'abri à toile rouge, contre le mur de gauche, sa table et ses caisses */
  const ax = -2.0, az = -.55;
  for(const dz of [-.42, .42]) for(const [dx, h] of [[-.3, 1.2], [.32, 1.0]]) boite(g, BOIS[0], .08, h, .08, ax + dx, h / 2, az + dz);
  planche(g, ROUGE, .8, .04, 1.06, ax, 1.12, az, 0, 0, -.3);
  for(const dz of [-.4, -.13, .13, .4]) planche(g, ROUGE_S, .8, .045, .03, ax, 1.14, az + dz, 0, 0, -.3);
  boite(g, BOIS[1], .4, .06, .8, ax - .05, .5, az);
  for(const dz of [-.34, .34]) boite(g, FONCE, .34, .48, .06, ax - .05, .25, az + dz);
  boite(g, BOIS[2], .2, .2, .26, ax - .08, .63, az - .18); boite(g, BOIS[0], .18, .16, .2, ax - .06, .61, az + .15);
  /* le tonneau, contre le mur de droite */
  const tx = 2.05, tz = -1.0, r = .22, h = .5;
  for(let k = 0; k < 10; k++){ const an = k / 10 * Math.PI * 2; planche(g, BOIS[k % 3], .14, h, .045, tx + Math.sin(an) * r, h / 2 + .02, tz + Math.cos(an) * r, 0, an, 0); }
  ajoute(g, part(G.cyl, BOIS[0], r * 2 - .05, .04, r * 2 - .05, tx, h - .03, tz));
  for(const y of [.1, .4]){ const c = ajoute(g, part(G.tore, FER, r * 2.15, r * 2.15, .6, tx, y, tz)); c.rotation.x = Math.PI / 2; }
  /* le râtelier de lances, contre le mur de droite */
  const rx = 2.3, rz = .1;
  for(const dz of [-.32, .32]) boite(g, FONCE, .07, .9, .07, rx, .45, rz + dz);
  for(const y of [.3, .75]) boite(g, BOIS[1], .06, .06, .72, rx - .04, y, rz);
  for(const dz of [-.18, 0, .18]){ boite(g, BOIS[0], .04, 1.2, .04, rx - .08, .62, rz + dz); ajoute(g, part(G.cone4, CLOU, .04, .2, .08, rx - .08, 1.3, rz + dz)); }
}
/* le dehors : la plaque de sable, des touffes d'herbe et des buissons ronds de part et d'autre des marches, comme l'image */
function dehors2(g){
  const m = ajoute(g, part(G.cyl, SABLE, 6.95, .05, 6.95, 0, .025, 0)); m.receiveShadow = true; m.castShadow = false;
  for(const [x, z, rr] of [[-1.25, 3.35, .24], [1.25, 3.35, .24], [-3.25, 1.6, .22], [3.25, 1.6, .22]])
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2; ajoute(g, part(BOULE_T, HERBE[k % 2], rr * 1.2, rr, rr * 1.2, x + Math.sin(an) * rr * .5, rr * .45, z + Math.cos(an) * rr * .4)); }
  for(const [x, z] of [[-2.4, 3.4], [2.5, 3.4], [3.35, -.8], [-3.35, -1.6]]){
    for(let k = 0; k < 5; k++){ const an = k / 5 * Math.PI * 2, b = ajoute(g, part(G.cone, HERBE[k % 2], .05, .2 + hasard() * .08, .05, x + Math.sin(an) * .04, .1, z + Math.cos(an) * .04));
      b.rotation.set(Math.cos(an) * .35, 0, -Math.sin(an) * .35); } }
}
export function chateauNiveau2(g){
  alea = 29;
  dehors2(g);
  cour2(g);
  enceinte2(g);
  grandePorte(g);
  for(const s of [-1, 1]){ banniere(g, s * 1.62); lanterneMur(g, s * .85, 1.3, A + E / 2); }
  donjon(g);
  for(const [x, z, fen] of [[-C2.TC, C2.TC, 0], [C2.TC, C2.TC, 0], [-2.25, -2.5, 0], [2.25, -2.5, 0]]) tourRonde(g, x, z, z > 0 ? C2.TR : .76, z > 0 ? C2.TH : 3.6, fen);
  g.userData.toit = 5.6;
}
