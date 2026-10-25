/* ================= Le perce-neige =================
   D'après l'image de Yo (25 octobre 2026 ; les fleurs, morceau 3), au plus près de l'image : un petit tertre de terre
   brune couvert de touffes de mousse vert-jaune (et, quand il neige, de coussins de neige grenue) ; une touffe de
   feuilles en lanières, larges et épaisses, vert-bleu, le bout arrondi, dressées puis courbées vers l'extérieur ; de fines
   tiges vert tendre qui montent puis se recourbent en crosse ; au bout de chacune, un petit bulbe vert d'où pend la
   fleur : trois longs tépales blancs en cuillère, creusés de sillons, un peu écartés, et au coeur trois petits tépales
   blancs marqués au bout d'un chevron vert ; et des boutons fermés, en goutte, qui pendent pareil.
   Comme dans la vraie nature : il fleurit à la fin de l'hiver, souvent dans la neige ; au printemps, ses fleurs fanées
   laissent de petites capsules vertes qui font pencher les tiges, et ses feuilles jaunissent ; l'été et l'automne, il dort
   sous terre : on ne voit plus que son tertre et sa mousse.
   Pour le téléphone : une forme par (saison, état, nuance, neige), partagée ; un modèle léger quand il est petit à l'écran ;
   il bouge un peu au vent. */
import { fusionner } from "./formes.js";
import { aleaDe, mesh, presLoin, NEIGE_GEO } from "./chene.js";
import { MAT_PAQUERETTE, feuilleGeo, RANGS, RANGS_LEGERS, ronde, poser, TIGE, BOULE } from "./paquerette.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LOIN = 5;
const cT = new THREE.Color(), BLANC = new THREE.Color(0xFBFBF6), VERT_V = new THREE.Color(0x5E9A2C), vL = new THREE.Vector3();
const FEUILLES = {hiver: [0x5A9A50, 0x4A8A46, 0x6AA858], printemps: [0x6E9A3E, 0x8AA440, 0x5E8E3A]};
const TIGE_C = {hiver: 0x8EBA4E, printemps: 0x9AB24A}, BULBE = 0x6FA83A, TERRE = [0x6E4E2E, 0x7E5A34, 0x5E4228],
  MOUSSE = [0x8CB032, 0x7AA02C, 0xA2C040];

/* les feuilles : de larges lanières épaisses au bout rond, dressées puis courbées */
const LANIERE = [feuilleGeo(RANGS, .5, .5, ronde, 6, .08), feuilleGeo(RANGS, .5, .85, ronde, 6, .08)];
const LANIERE_LEGERE = feuilleGeo(RANGS_LEGERS, .5, .8, ronde, 4, .08);
/* un tépale : une cuillère qui pend (le haut en 0, le bout en −1), large en z, creusée ; ses sillons plus sombres */
const TEPALE = (() => {
  const g = new THREE.SphereGeometry(1, 10, 8); g.scale(.3, .5, .13); g.translate(0, -.5, 0);
  const p = g.attributes.position, te = [];
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i) / .3, y = -p.getY(i);
    te.push((1 - .09 * Math.abs(Math.sin(x * 7.5))) * (.9 + .1 * Math.min(1, y * 1.6)));   // les sillons, le haut un peu à l'ombre
  }
  g.setAttribute("teinte", new THREE.Float32BufferAttribute(te, 1));
  return g;
})();
const TEPALE_LEGER = (() => { const g = new THREE.SphereGeometry(1, 5, 4); g.scale(.3, .5, .13); g.translate(0, -.5, 0); return g; })();
const MOTTE = new THREE.IcosahedronGeometry(1, 1), BRIN = new THREE.IcosahedronGeometry(1, 0), NEIGE = new THREE.SphereGeometry(1, 10, 6);

/* une tige qui monte puis se recourbe en crosse vers vers (b) : rend son bout et la direction finale */
function crosse(M, pied, b, haut, courbe, vert, n = 14){
  const vers = V(Math.cos(b), 0, Math.sin(b)), L = haut / (1 - courbe * .25);
  let p = pied.clone(), dir = V(0, 1, 0);
  for(let k = 0; k < n; k++){
    const t = (k + .5) / n, phi = .06 * t + (t < .5 ? 0 : courbe * 2.2 * ((t - .5) / .5) ** 1.5);
    dir = V(0, Math.cos(phi), 0).addScaledVector(vers, Math.sin(phi)).normalize();
    const q = p.clone().addScaledVector(dir, L / n);
    M.push({geo: TIGE, m: new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), V(.0075, L / n * 1.04, .0075)), c: vert});
    p = q;
  }
  return p;
}
/* la fleur qui pend sous son bulbe vert : trois grands tépales écartés (ouverte) ou serrés (bouton), et au coeur trois petits
   tépales au chevron vert */
function clochette(M, bout, b, ouverte, leger, alea, taille = 1){
  const s = taille;
  M.push({geo: BOULE, m: new THREE.Matrix4().compose(bout.clone().add(V(0, -.012 * s, 0)), new THREE.Quaternion(), V(.018 * s, .024 * s, .018 * s)), c: BULBE});
  const attache = bout.clone().add(V(0, -.03 * s, 0)), ecart = ouverte ? .6 : .07, L = (ouverte ? .095 : .085) * s;
  for(let k = 0; k < 3; k++){
    const a = b + k / 3 * Math.PI * 2 + alea() * .2;
    const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -a).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0))
      .multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0));
    /* écarté vers l'extérieur : on penche le tépale autour de l'axe horizontal perpendiculaire à sa direction */
    const dirOut = V(Math.cos(a), 0, Math.sin(a)), axe = V(0, 1, 0).cross(dirOut).normalize();
    const qp = new THREE.Quaternion().setFromAxisAngle(axe, -(ecart + alea() * .08)).multiply(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dirOut));
    M.push({geo: leger ? TEPALE_LEGER : TEPALE, m: new THREE.Matrix4().compose(attache.clone().addScaledVector(dirOut, .006 * s), qp, V(L * .95, L, L)), c: 0xFBFBF6});
    void q;
  }
  if(ouverte && !leger) for(let k = 0; k < 3; k++){
    /* les petits tépales du coeur, serrés en tube, le bout marqué d'un chevron vert */
    const a = b + (k + .5) / 3 * Math.PI * 2, dirOut = V(Math.cos(a), 0, Math.sin(a)), axe = V(0, 1, 0).cross(dirOut).normalize();
    const qp = new THREE.Quaternion().setFromAxisAngle(axe, -.12).multiply(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dirOut));
    const l = .066 * s, m = new THREE.Matrix4().compose(attache.clone().add(V(0, -.004 * s, 0)), qp, V(l * .9, l, l * 1.1)), inv = m.clone().invert();
    M.push({geo: TEPALE, m, couleur: (x, y, z) => {
      vL.set(x, y, z).applyMatrix4(inv);
      const t = -vL.y, xn = Math.abs(vL.x) / .3;                           // t de 0 (haut) à 1 (bout) ; xn de 0 (milieu) au bord
      const chevron = Math.abs(t - (.66 + .2 * xn)) < .09 && vL.z > 0 ? 1 : t > .9 ? .6 : 0;
      return cT.copy(BLANC).lerp(VERT_V, chevron);
    }});
  }
}
/* le tertre : des mottes de terre au bord, les touffes de mousse, et, quand il neige, des coussins de neige grenue */
const grain = (x, y, z) => { const v = Math.sin(Math.floor(x * 420) * 12.9898 + Math.floor(y * 420) * 78.233 + Math.floor(z * 420) * 37.719) * 43758.5453; return v - Math.floor(v); };
function tertre(M, alea, leger, neige){
  const n = leger ? 7 : 15;
  for(let k = 0; k < n; k++){
    const a = k / n * Math.PI * 2 + alea() * .4, r = .2 + alea() * .05;
    M.push({geo: MOTTE, m: new THREE.Matrix4().compose(V(Math.cos(a) * r, .008, Math.sin(a) * r), new THREE.Quaternion(), V(.03 + alea() * .015, .022, .03 + alea() * .015)), c: TERRE[k % 3]});
  }
  M.push({geo: MOTTE, m: new THREE.Matrix4().compose(V(0, .005, 0), new THREE.Quaternion(), V(.22, .06, .22)), c: TERRE[2]});
  const nt = leger ? 7 : 22;
  for(let k = 0; k < nt; k++){
    const a = k * 2.39996 + alea() * .3, r = .07 + .16 * Math.sqrt((k + .5) / nt), c = V(Math.cos(a) * r, .04 - r * .1, Math.sin(a) * r);
    /* une touffe de mousse : de petites pointes à facettes serrées, plus claires au bout */
    for(let j = 0; j < (leger ? 2 : 7); j++){
      const p = c.clone().add(V((alea() - .5) * .05, .01 + alea() * .02, (alea() - .5) * .05)), e = .007 + alea() * .006;
      M.push({geo: BRIN, m: new THREE.Matrix4().compose(p, new THREE.Quaternion(), V(e, e * 1.7, e)), c: MOUSSE[(k + j) % 3]});
    }
  }
  if(neige) for(let k = 0; k < (leger ? 8 : 44); k++){
    if(k % 4 === 3) continue;                                              // des trous entre les coussins, où la mousse se voit
    const a = k * 2.39996 + alea() * .5, r = .06 + .18 * Math.sqrt((k + .5) / 44), e = .028 + alea() * .016;
    M.push({geo: leger ? NEIGE_GEO : NEIGE, m: new THREE.Matrix4().compose(V(Math.cos(a) * r, .055 - r * .1 + alea() * .012, Math.sin(a) * r), new THREE.Quaternion(), V(e * 1.2, e * .85, e)),
      couleur: (x, y, z) => cT.set(0xF8FAFC).multiplyScalar(grain(x, y, z) > .7 ? .88 : 1)});
  }
}
function touffe(saison, etat, variante, leger, neige){
  const alea = aleaDe(9871 + variante * 47), M = [];
  tertre(M, alea, leger, neige);
  const dort = saison === "ete" || saison === "automne";                   // il dort sous terre : seulement son tertre
  if(!dort){
    const tons = FEUILLES[saison] || FEUILLES.hiver, vert = TIGE_C[saison] || TIGE_C.hiver, taille = etat === 0 ? .45 : 1;
    /* les feuilles */
    const nf = etat === 0 ? 5 : leger ? 10 : 28;
    for(let k = 0; k < nf; k++){
      const t = (k + .5) / nf, b = k * 2.39996 + alea() * .4, pied = V(Math.cos(b) * .07 * Math.sqrt(t), .03, Math.sin(b) * .07 * Math.sqrt(t));
      const jaunit = saison === "printemps" && alea() < .45;
      poser(M, leger ? LANIERE_LEGERE : LANIERE[t < .7 ? 0 : 1], pied, b, .02 + .24 * t + alea() * .06, (.4 - .1 * t + alea() * .05) * taille, .036 * taille,
        jaunit ? 0xA8A446 : tons[alea() < .5 ? 0 : alea() < .5 ? 1 : 2]);
    }
    if(etat > 0){
      /* les tiges en crosse : en fleur (l'hiver) les fleurs et les boutons ; au printemps, des capsules vertes qui les font pencher */
      const tiges = [[.5, 0, 1], [.46, 2.1, 1], [.44, 4.2, 1], [.4, 1.1, 1], [.38, 3.2, 1], [.37, 5.3, 0], [.35, .5, 0], [.33, 2.7, 0], [.36, 3.8, 0]];
      tiges.slice(0, leger ? 5 : 9).forEach(([h, b0, ouverte], k) => {
        const b = b0 + variante * .7 + alea() * .3, pied = V(Math.cos(b) * .045, .03, Math.sin(b) * .045);
        if(etat === 2){
          const bout = crosse(M, pied, b, h, .9 + alea() * .15, vert, leger ? 5 : 14);
          clochette(M, bout, b, !!ouverte, leger, alea, ouverte ? 1 : .85);
        } else if(saison === "printemps" && k < 6){
          const bout = crosse(M, pied, b, h * .85, 1.15, vert, leger ? 5 : 14);
          M.push({geo: BOULE, m: new THREE.Matrix4().compose(bout.clone().add(V(0, -.022, 0)), new THREE.Quaternion(), V(.022, .028, .022)), c: 0x7EA83E});
        }
      });
    }
  }
  return fusionner(M);
}
const CACHE = new Map();
function geos(saison, etat, variante, neige){
  const cle = [saison, etat, variante, neige ? 1 : 0].join(":");
  if(!CACHE.has(cle)) CACHE.set(cle, {pres: touffe(saison, etat, variante, false, neige), loin: touffe(saison, etat, variante, true, neige)});
  return CACHE.get(cle);
}
/* Le perce-neige : saison ; etat : 0 une pousse, 1 des feuilles, 2 en fleur ; r : son tirage (nuance, taille, sens) ;
   neige : il neige (de la neige sur son tertre, l'hiver) */
export function perceNeigeModele(saison, etat, r = 0, neige = false){
  const variante = Math.floor(r * 3) % 3, G = geos(saison, etat, variante, neige && saison === "hiver"), g = new THREE.Group();
  g.add(presLoin(mesh(G.pres, MAT_PAQUERETTE), mesh(G.loin, MAT_PAQUERETTE), LOIN));
  g.rotation.y = r * Math.PI * 2 * .25 - .4;
  g.scale.setScalar(.95 + r * .2);
  g.userData.perceNeige = {saison, etat};
  return g;
}
