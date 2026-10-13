/* ================= Le voyage en barque et le Marais brumeux (étape 1.13, morceaux 3 et 4) =================
   Bible : « Trajet : une courte scène animée, qu'on peut passer. Retour : on rentre au village quand on veut. » ; le
   Marais brumeux : « grenouilles, plantes à potions, créatures des brumes », sa couleur « vert-gris brumeux ».
   Grand Carnet : « des arbres qui ont les pieds dans l'eau, et les premiers qui ne sont plus tout à fait réels ».
   - makeTrajet : un long chenal d'eau sombre dans la brume, bordé de roseaux et de cyprès ; la barque le remonte
     vers le nord (voyage.js la fait avancer).
   - makeMarais (morceau 4) : W × D cases d'eau sombre, le même Marais pour tout le monde (tirage fixe) : des îlots de
     terre moussue (ILOTS), reliés par des passerelles de planches sur pilotis (LIENS : deux lignes droites d'un îlot à
     l'autre ; sur la terre, un sentier) ; au sud, l'îlot d'arrivée et son embarcadère, où la Libellule est amarrée ; au
     nord, l'îlot où s'ouvrira la grotte du Marais (morceau 6). Ses arbres (modèles dans essences.js) : cyprès des marais
     et aulnes, communs, sur les îlots et les pieds dans l'eau ; saules des brumes et arbres-lanternes, rares. On les
     coupe à la hache (recolte.js), ils repoussent sur place (state.marais.coupes) ; on recueille l'eau de brume des
     saules (au bocal) et on cueille les fruits-lanternes (state.marais.cueillis). Ses plantes (PLANTES_MARAIS dans
     donnees.js : cresson, riz sauvage, canneberge, mandragore, chou-lune, iris, nénuphar, lotus, feu-follet, rose des
     brumes), chacune à sa place (rive, eau, îlot), à sa saison, certaines la nuit seulement : cueillies, elles
     reviennent (state.marais.cueillis). Sa vie (insectes, oiseaux, poissons, gibier) viendra au morceau 5.
   Les deux lieux se construisent dans la scène des intérieurs (interieurs.js, buildRoom), comme la forêt ; le sol, les
   planches, les arbres et les roseaux sont dessinés en série, pour un téléphone modeste. */
import { G, part, mat } from "./formes.js";
import { barqueModele } from "./ponton.js";
import { state, save } from "../sauvegarde.js";
import { RECOLTE, PRODUITS, PLANTES_MARAIS, PLANTE_RETOUR, enSaisonPlante } from "../donnees.js";
import { essences, TAILLE, arbreModele, FRUITS, fruitsDeSaison, VOILE } from "./essences.js";
import { nuitIci } from "./ciel.js";

const EAU = -.2;
const EAU_MAT = new THREE.MeshLambertMaterial({color: 0x3E5E52});
const BRUME_MAT = new THREE.MeshLambertMaterial({color: 0xE4ECE6, transparent: true, opacity: .18, depthWrite: false});
function eau(g, w, d){
  const e = new THREE.Mesh(new THREE.PlaneGeometry(w, d), EAU_MAT);
  e.rotation.x = -Math.PI / 2; e.position.y = EAU; e.receiveShadow = true; g.add(e);
}
/* Un cyprès des marais : tronc roux évasé, ses racines qui sortent de l'eau, une haute couronne sombre */
function cypres(g, x, z, s){
  const c = new THREE.Group();
  c.add(part(G.cone, 0x8A5A3C, .9, 1.2, .9, 0, .4, 0));                         // le pied évasé
  c.add(part(G.cyl, 0x8A5A3C, .32, 2.6, .32, 0, 1.8, 0));                       // le tronc
  for(let k = 0; k < 4; k++){ const a = k * 1.7 + s; c.add(part(G.cone, 0x7A4E34, .16, .4, .16, Math.cos(a) * .8, 0, Math.sin(a) * .8)); }   // les racines
  c.add(part(G.cone, 0x3E5A44, 1.8, 2.4, 1.8, 0, 3.2, 0));                      // la couronne
  c.add(part(G.cone, 0x47664C, 1.3, 1.8, 1.3, 0, 4.1, 0));
  c.position.set(x, EAU, z); c.scale.setScalar(.8 + (s % 1) * .5); c.rotation.y = s;
  g.add(c);
}
/* Une touffe de roseaux, avec ses massettes brunes */
function roseaux(g, x, z, s){
  for(let k = 0; k < 5; k++){
    const a = k * 1.3 + s, r = .12 + (k % 2) * .08, h = .7 + (k % 3) * .2;
    const t = part(G.cyl, k % 2 ? 0x8AA05A : 0x7A9450, .04, h, .04, x + Math.cos(a) * r, EAU + h / 2, z + Math.sin(a) * r);
    t.rotation.set(Math.sin(a) * .15, 0, Math.cos(a) * .15); g.add(t);
    if(k % 2 === 0) g.add(part(G.cyl, 0x6A4630, .08, .2, .08, t.position.x, EAU + h - .05, t.position.z));
  }
}
/* Des nappes de brume qui flottent sur l'eau */
function brume(g, x, z, s){
  const b = new THREE.Mesh(G.head, BRUME_MAT); b.scale.set(7 * s, .8, 5 * s); b.position.set(x, .1, z); b.renderOrder = 3; g.add(b);
}

/* ----- Le trajet : un chenal de 12 cases sur 60, la barque part du sud (z = 24) vers le nord ----- */
export function makeTrajet(){
  const g = new THREE.Group(), W = 14, D = 64;
  eau(g, 80, 120);
  for(let z = -30; z <= 30; z += 2.5){
    for(const c of [-1, 1]){
      const r = Math.sin(z * 1.7) * .5 + .5;
      roseaux(g, c * (3 + r * 1.5), z + r, z * .3);
      if(Math.abs(z * 10) % 3 < 1.2) cypres(g, c * (6 + r * 2), z + 1, z + c);
    }
    if(Math.abs(z) % 10 < 2.5) brume(g, Math.sin(z) * 3, z, 1);
  }
  return {group: g, w: W, d: D, walk: () => true, depart: {x: 0, z: 24, fx: 0, fz: -1},
    light: 0xE8F0E4, power: .6, ground: 0x3A4A40, sky: 0xC8D8CC, hemi: .85, fond: 0xB4C6BA, brume: [17, 34]};
}

/* ================= Le Marais brumeux (morceau 4) ================= */
export const W = 48, D = 48;
const cx = x => x - W/2 + .5, cz = z => z - D/2 + .5;
export const mtile = (wx, wz) => { const x = Math.floor(wx + W/2), z = Math.floor(wz + D/2); return x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1; };
export const mcx = i => cx(i % W), mcz = i => cz(Math.floor(i / W));
function rand(seed){ let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* Les îlots [x, z, rayon], en cases : l'arrivée (au sud), le sud-ouest, le sud-est, le petit îlot du milieu, l'ouest,
   l'est, le grand îlot du centre, le nord-ouest, le nord-est, et le nord (la grotte du Marais, au morceau 6) */
const ILOTS = [[24, 38, 4], [11.5, 34.5, 4], [36.5, 35, 4.1], [24, 28.5, 3.4], [8.5, 23, 4.2], [39.5, 22.5, 4.3], [24, 17.5, 4.8], [12.5, 10, 4.1], [35.5, 10, 4], [24, 5, 4.2]];
/* Les passerelles : une grande boucle autour du Marais, et une ligne droite du sud au nord, par le milieu */
const LIENS = [[0, 3], [3, 6], [6, 9], [0, 1], [1, 4], [4, 7], [7, 9], [0, 2], [2, 5], [5, 8], [8, 9]];
/* La carte : type de chaque case (eau, terre, sentier, passerelle, embarcadere), ce qui y est (un arbre, une plante, le
   poteau), et un nombre au hasard (fixe) qui fait varier les modèles */
export const marais = {type: new Array(W * D).fill("eau"), obj: new Array(W * D).fill(null), r: new Array(W * D).fill(0)};
export const EMBARCADERE = [];                            // les planches de l'embarcadère, vers le sud (vers le village)
let BARQUE_EN = null, PANNEAU = -1;
{
  const rnd = rand(4207), T = marais.type, O = marais.obj, at = (x, z) => z * W + x, dans = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
  for(let i = 0; i < W * D; i++) marais.r[i] = rnd();
  /* les îlots, aux bords irréguliers */
  ILOTS.forEach(([x0, z0, r], k) => {
    for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
      const dx = x + .5 - x0, dz = z + .5 - z0, a = Math.atan2(dz, dx);
      if(Math.hypot(dx, dz) < r * (1 + .16 * Math.sin(a * 3 + k * 1.7) + .09 * Math.sin(a * 5 + k))) T[at(x, z)] = "terre";
    }
  });
  /* les passerelles : d'un îlot à l'autre, en deux lignes droites ; sur la terre, un sentier */
  const trace = (x, z) => { const i = at(x, z); T[i] = T[i] === "eau" || T[i] === "passerelle" ? "passerelle" : "sentier"; };
  for(const [a, b] of LIENS){
    let x = Math.floor(ILOTS[a][0]), z = Math.floor(ILOTS[a][1]);
    const x1 = Math.floor(ILOTS[b][0]), z1 = Math.floor(ILOTS[b][1]), nordSud = Math.abs(z1 - z) > Math.abs(x1 - x);
    trace(x, z);
    if(nordSud) while(z !== z1){ z += Math.sign(z1 - z); trace(x, z); }
    while(x !== x1){ x += Math.sign(x1 - x); trace(x, z); }
    while(z !== z1){ z += Math.sign(z1 - z); trace(x, z); }
  }
  /* l'embarcadère : trois cases de planches au sud de l'îlot d'arrivée, et un sentier jusqu'à lui ; la barque amarrée
     à sa droite ; le poteau « Marais brumeux » au bout du sentier */
  const ex = Math.floor(ILOTS[0][0]);
  let ez = Math.floor(ILOTS[0][1]);
  while(ez + 4 < D && T[at(ex, ez + 1)] !== "eau") ez++;
  for(let z = Math.floor(ILOTS[0][1]); z <= ez; z++) trace(ex, z);
  for(let k = 1; k <= 3; k++){ T[at(ex, ez + k)] = "embarcadere"; EMBARCADERE.push([ex, ez + k]); }
  BARQUE_EN = {x: cx(ex) + 1.02, z: cz(ez + 3)};
  PANNEAU = at(T[at(ex - 1, ez - 1)] === "terre" ? ex - 1 : ex + 1, ez - 1);
  if(T[PANNEAU] === "eau") T[PANNEAU] = "terre";
  O[PANNEAU] = "panneau";
  /* les places gardées libres : devant l'embarcadère, autour de la barque amarrée, et au milieu de l'îlot du nord */
  const nord = [Math.floor(ILOTS[9][0]), Math.floor(ILOTS[9][1])];
  const loin = (x, z, [a, b], d) => Math.abs(x - a) > d || Math.abs(z - b) > d;
  const libre = (x, z) => loin(x, z, [ex, ez], 2) && loin(x, z, [ex, ez + 3], 2) && loin(x, z, nord, 2);
  const autour = (x, z, d, f) => { for(let dz = -d; dz <= d; dz++) for(let dx = -d; dx <= d; dx++) if(dans(x + dx, z + dz) && f(T[at(x + dx, z + dz)])) return true; return false; };
  /* les arbres : sur les îlots (ni sur les sentiers ni juste à côté, pour qu'on voie où l'on marche), et quelques-uns les
     pieds dans l'eau, au bord des îlots */
  const essence = r => r < .45 ? "cypres" : r < .93 ? "aulne" : r < .965 ? "sauleBrumes" : "arbreLanterne";
  const surTerre = [];
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    const i = at(x, z), r = rnd(), e = rnd();
    if(O[i] || !libre(x, z)) continue;
    if(T[i] === "terre" && r < .22 && !autour(x, z, 1, t => t === "sentier" || t === "passerelle")){ O[i] = essence(e); surTerre.push(i); }
    else if(T[i] === "eau" && r < .05 && autour(x, z, 2, t => t === "terre") && !autour(x, z, 1, t => t !== "eau" && t !== "terre")) O[i] = e < .8 ? "cypres" : "aulne";
  }
  /* les rares : au moins RARES saules des brumes et arbres-lanternes, à la place de cyprès ou d'aulnes des îlots */
  const RARES = 5;
  for(const sp of ["sauleBrumes", "arbreLanterne"]){
    let n = O.filter(o => o === sp).length;
    while(n < RARES){
      const i = surTerre[Math.floor(rnd() * surTerre.length)];
      if(O[i] === "cypres" || O[i] === "aulne"){ O[i] = sp; n++; }
    }
  }
  /* les plantes : chacune à sa place (rive : au bord d'un îlot ; eau : dans l'eau, au bord ; ilot : au milieu), sur une
     case qu'on peut atteindre ; les communes plus nombreuses que les rares */
  const marchable = j => T[j] === "terre" && !O[j] || T[j] === "sentier" || T[j] === "passerelle" || T[j] === "embarcadere";
  const v4 = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => dans(x + dx, z + dz)).map(([dx, dz]) => at(x + dx, z + dz));
  const places = {rive: [], eau: [], ilot: []};
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    const i = at(x, z), v = v4(x, z);
    if(O[i] || !loin(x, z, [ex, ez + 3], 2) || !v.some(marchable)) continue;
    if(T[i] === "terre") places[v.some(j => T[j] === "eau") ? "rive" : "ilot"].push(i);
    else if(T[i] === "eau") places.eau.push(i);
  }
  for(const l of Object.values(places)) for(let k = l.length - 1; k > 0; k--){ const j = Math.floor(rnd() * (k + 1)); [l[k], l[j]] = [l[j], l[k]]; }
  const COMBIEN = {commun: 7, peuCommun: 5, rare: 3};
  for(const k of PLANTES_MARAIS){
    const p = PRODUITS[k].plante, l = places[p.ou];
    for(let n = 0; n < COMBIEN[p.rarete] && l.length; n++) O[l.pop()] = k;
  }
}
const passe = new Set(EMBARCADERE.map(([x, z]) => z * W + x));
export const surEmbarcadere = (x, z) => passe.has(mtile(x, z));
/* Où l'on arrive : au bout de l'embarcadère, tourné vers l'îlot */
export const DEPART = {x: cx(EMBARCADERE[2][0]), z: cz(EMBARCADERE[2][1]), fx: 0, fz: -1};
export const plante = o => !!(o && PRODUITS[o] && PRODUITS[o].plante);

/* ----- Ce qui est sur une case : les arbres coupés repoussent, les cueillettes reviennent ----- */
const PLAN = 1;
const etat = () => state.marais && state.marais.plan === PLAN ? state.marais : (state.marais = {plan: PLAN, coupes: {}, cueillis: {}});
export function maraisObj(i){
  const o = marais.obj[i];
  if(!o || !RECOLTE[o]) return o;                         // une plante, le poteau : toujours là
  const c = etat().coupes[i];
  if(c === undefined) return o;
  if(Date.now() - c >= RECOLTE[o].repousse * 1000){ delete etat().coupes[i]; return o; }
  return null;
}
/* Cueilli : dans combien de secondes ça revient (0 : prêt) ; une plante selon sa rareté, un arbre selon RECOLTE.retour */
export function maraisCueilliLeft(i){
  const c = etat().cueillis[i], o = marais.obj[i];
  if(c === undefined || !o) return 0;
  const reste = (plante(o) ? PLANTE_RETOUR[PRODUITS[o].plante.rarete] : RECOLTE[o] && RECOLTE[o].retour || 0) - (Date.now() - c) / 1000;
  if(reste <= 0){ delete etat().cueillis[i]; return 0; }
  return reste;
}
/* Une plante qu'on peut cueillir maintenant : à sa saison, la nuit pour celles de la nuit, pas cueillie depuis peu */
export function planteDispo(i){
  const p = PRODUITS[marais.obj[i]];
  return !!p && enSaisonPlante(p) && (!p.plante.nuit || nuitIci() > .5) && !maraisCueilliLeft(i);
}
export function cueillirMarais(i){
  etat().cueillis[i] = Date.now();
  if(plantes.has(i)) majPlante(i);
  else { if(seuls.has(i)){ group.remove(seuls.get(i)); seuls.delete(i); } montrerArbre(i, true); }
  save();
}

/* ----- Les modèles ----- */
let group = null, series = null, temps = 0, tic = 0;
const indexDe = new Map(), seuls = new Map(), plantes = new Map();
const m4 = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
/* Des morceaux répétés (le sol, les planches, les roseaux…) : une seule forme dessinée plusieurs fois.
   places : [x, y, z, sx, sy, sz, tour, couleur] (la couleur : seulement avec une matière blanche) */
function serie(g, geo, matiere, places, ombre = true){
  if(!places.length) return;
  const m = new THREE.InstancedMesh(geo, matiere, places.length), c = new THREE.Color();
  places.forEach(([x, y, z, sx, sy, sz, ry = 0, coul], k) => {
    q.setFromAxisAngle(up, ry);
    m.setMatrixAt(k, m4.compose(v3.set(x, y, z), q, s3.set(sx, sy, sz)));
    if(coul !== undefined) m.setColorAt(k, c.setHex(coul));
  });
  if(m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = ombre; m.receiveShadow = true; g.add(m);
}
const blanc = () => new THREE.MeshLambertMaterial({color: 0xffffff});
/* Les arbres, en série : une instance par arbre et par morceau (tronc, feuillage, fruits…) */
const posArbre = i => { const r = marais.r[i]; return [mcx(i) + (r - .5) * .3, mcz(i) + (r - .5) * .3]; };
function matriceArbre(i, local){
  const sp = marais.obj[i], r = marais.r[i], s = TAILLE(sp) * (.88 + r * .24), [x, z] = posArbre(i);
  q.setFromAxisAngle(up, r * 6.28);
  m4.compose(v3.set(x, 0, z), q, s3.set(s, s, s));
  return m4.multiply(local);
}
function montrerArbre(i, oui){
  const sp = marais.obj[i], at = indexDe.get(i);
  if(at === undefined || !series || !series[sp]) return;
  const sansFruits = FRUITS[sp] && (!fruitsDeSaison(sp) || maraisCueilliLeft(i) > 0);
  series[sp].forEach((p, k) => {
    const voir = oui && !(sansFruits && FRUITS[sp].includes(k));
    p.mesh.setMatrixAt(at, voir ? matriceArbre(i, p.local.clone()) : ZERO); p.mesh.instanceMatrix.needsUpdate = true;
  });
}
/* Les plantes : leurs feuilles (toujours là) et ce qu'on cueille (fruit : caché hors saison, une fois cueilli, ou le jour
   pour celles de la nuit) */
const LUEUR_LUNE = new THREE.MeshLambertMaterial({color: 0xE8F4E0, emissive: 0xB8E8C8, emissiveIntensity: .7});
const FLAMME = new THREE.MeshLambertMaterial({color: 0x9AD8FF, emissive: 0x3A8AF0, emissiveIntensity: 1.1, transparent: true, opacity: .85, depthWrite: false});
const PETALES = new THREE.MeshLambertMaterial({color: 0xF4E8F4, emissive: 0x4A3A4A, emissiveIntensity: .3, transparent: true, opacity: .72});
function modelePlante(k, r){
  const g = new THREE.Group(), fruit = new THREE.Group(), y0 = PRODUITS[k].plante.ou === "eau" ? EAU : 0;
  const a = (grp, geo, c, sx, sy, sz, x, y, z) => { const m = part(geo, c, sx, sy, sz, x, y0 + y, z); grp.add(m); return m; };
  const rond = (n, rr, f) => { for(let j = 0; j < n; j++){ const t = j / n * 6.283 + r * 6; f(Math.cos(t) * rr, Math.sin(t) * rr, t, j); } };
  const petale = (grp, c, x, y, z, t, l, inclin) => { const m = a(grp, G.head, c, .32, .2, l, x, y, z); m.rotation.order = "YXZ"; m.rotation.set(-inclin, Math.PI / 2 - t, 0); };
  g.add(fruit);
  if(k === "cresson"){                                   // une touffe de petites feuilles rondes ; au printemps, de petites fleurs blanches
    rond(5, .16, (x, z) => a(g, G.head, 0x4E8A3A, .7, .35, .7, x, .08, z)); a(g, G.head, 0x5A9A44, .8, .4, .8, 0, .12, 0);
    rond(4, .12, (x, z) => a(fruit, G.head, 0xF8F8F0, .22, .22, .22, x, .24, z));
  } else if(k === "iris"){                               // des feuilles en épée ; au printemps, des fleurs jaunes
    rond(5, .08, (x, z, t) => { const m = a(g, G.box, 0x5A8A44, .05, .75, .14, x, .37, z); m.rotation.set(Math.sin(t) * .2, t, Math.cos(t) * .2); });
    rond(2, .14, (x, z, t) => { a(fruit, G.head, 0xF2C430, .45, .5, .45, x, .82, z); for(let j = 0; j < 3; j++) petale(fruit, 0xE8B020, x, .74, z, t + j * 2.1, .5, -.4); });
  } else if(k === "canneberge"){                         // un petit buisson rampant ; en automne, des baies rouges
    a(g, G.leaf, 0x4A6A3A, .8, .38, .8, 0, .15, 0);
    rond(6, .22, (x, z, t, j) => a(fruit, G.head, 0xC8203A, .3, .3, .3, x, .26 + (j % 2) * .06, z));
  } else if(k === "mandragore"){                         // une rosette de larges feuilles sombres ; en automne, ses baies orange
    rond(5, .2, (x, z, t) => { const m = a(g, G.head, 0x2E5A30, .5, .12, 1.1, x, .05, z); m.rotation.y = Math.PI / 2 - t; });
    rond(3, .06, (x, z) => a(fruit, G.head, 0xE8902A, .3, .3, .3, x, .14, z));
  } else if(k === "chouLune"){                           // un petit bourgeon le jour ; la nuit, un chou pâle qui luit
    a(g, G.head, 0x6A8A6A, .5, .3, .5, 0, .06, 0);
    a(fruit, G.head, 0xC8DCC8, 1.6, .45, 1.6, 0, .08, 0); a(fruit, G.head, LUEUR_LUNE, 1.1, .9, 1.1, 0, .22, 0);
  } else if(k === "rizSauvage"){                         // de hautes tiges dans l'eau ; en été, leurs épis dorés
    rond(6, .14, (x, z, t) => { const m = a(g, G.cyl, 0x8AA05A, .035, .95, .035, x, .47, z); m.rotation.set(Math.sin(t) * .12, 0, Math.cos(t) * .12); });
    rond(6, .19, (x, z) => a(fruit, G.head, 0xD8B860, .2, .55, .2, x, .98, z));
  } else if(k === "nenuphar" || k === "lotus"){          // une large feuille ronde qui flotte ; en été, sa fleur (le lotus la lève)
    a(g, G.cyl, 0x4A8A4A, .72, .02, .72, 0, .02, 0); a(g, G.cyl, 0x3E7A40, .5, .02, .5, .45, .015, .3);
    const lotus = k === "lotus", h = lotus ? .32 : .06, c = lotus ? 0xF4A8C0 : r < .5 ? 0xF8F4F0 : 0xF4C8D4;
    if(lotus) a(fruit, G.cyl, 0x5A8A4A, .03, .3, .03, 0, .16, 0);
    rond(7, .06, (x, z, t) => petale(fruit, c, x, h + .05, z, t, .6, .5));
    a(fruit, G.head, 0xF2C94C, .3, .22, .3, 0, h + .07, 0);
  } else if(k === "feuFollet"){                          // le jour, une tige sombre dans l'eau ; la nuit, une flamme bleue qui danse
    a(g, G.cyl, 0x4A5A4A, .03, .5, .03, 0, .25, 0); a(g, G.head, 0x3A5A6A, .25, .25, .25, 0, .5, 0);
    const f1 = a(fruit, G.head, FLAMME, 1.1, 1.1, 1.1, 0, .8, 0), f2 = a(fruit, G.cone, FLAMME, .3, .6, .3, 0, 1.18, 0);
    f1.castShadow = f2.castShadow = false;
    fruit.userData.danse = true;
  } else if(k === "roseBrumes"){                         // un rosier pâle ; ses roses aux pétales translucides
    a(g, G.leaf, 0x5A7A6A, .75, .6, .75, 0, .3, 0);
    rond(3, .2, (x, z, t, j) => a(fruit, G.head, PETALES, .55, .5, .55, x, .58 + (j % 2) * .08, z));
  }
  return {g, fruit};
}
function ajouterPlante(i){
  const k = marais.obj[i], {g, fruit} = modelePlante(k, marais.r[i]);
  g.position.set(mcx(i), 0, mcz(i)); g.rotation.y = marais.r[i] * 6.28;
  group.add(g); plantes.set(i, {k, g, fruit});
  majPlante(i);
}
function majPlante(i){ const p = plantes.get(i); if(p) p.fruit.visible = planteDispo(i); }
/* Un poteau, et son écriteau peint */
function ecriteau(g, x, z, texte){
  g.add(part(G.cyl, 0x6B4A2F, .12, 1.5, .12, x, .75, z));
  const c = document.createElement("canvas"); c.width = 320; c.height = 110;
  const k = c.getContext("2d");
  k.fillStyle = "#C8976A"; k.fillRect(0, 0, 320, 110); k.strokeStyle = "#6B4A2F"; k.lineWidth = 10; k.strokeRect(5, 5, 310, 100);
  let taille = 44;
  do { k.font = `bold ${taille}px Georgia, serif`; taille -= 2; } while(k.measureText(texte).width > 284 && taille > 16);   // le texte tient dans la planche
  k.fillStyle = "#2A1C10"; k.textAlign = "center"; k.textBaseline = "middle"; k.fillText(texte, 160, 58);
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(1.8, .62, .06), [mat(0x8A5A3C), mat(0x8A5A3C), mat(0x8A5A3C), mat(0x8A5A3C),
    new THREE.MeshLambertMaterial({map: new THREE.CanvasTexture(c)}), mat(0x8A5A3C)]);
  panneau.position.set(x, 1.3, z + .06); panneau.rotation.x = -.5; panneau.castShadow = true; g.add(panneau);   // penché vers la caméra
}

export function makeMarais(){
  group = new THREE.Group(); indexDe.clear(); seuls.clear(); plantes.clear();
  const g = group, T = marais.type, E = essences();
  eau(g, 150, 150);
  /* le sol des îlots : de la mousse (deux tons) et les sentiers de terre battue ; dessous, un socle de tourbe */
  const sols = [], COUL = {terre: [0x5E7A4A, 0x56724A], sentier: [0x8A7A58, 0x7E7050]};
  for(let i = 0; i < W * D; i++) if(T[i] === "terre" || T[i] === "sentier") sols.push(i);
  serie(g, G.box, blanc(), sols.map(i => [mcx(i), -.12, mcz(i), 1, .24, 1, 0, COUL[T[i]][(i % W + Math.floor(i / W)) % 2]]), false);
  serie(g, G.box, mat(0x4A3A2A), sols.map(i => [mcx(i), -.54, mcz(i), 1, .6, 1]), false);
  /* les passerelles et l'embarcadère : des planches en travers, sur des pieux */
  const planches = [], pieux = [], passage = j => T[j] !== "eau";
  for(let i = 0; i < W * D; i++){
    if(T[i] !== "passerelle" && T[i] !== "embarcadere") continue;
    const x = i % W, z = Math.floor(i / W), X = mcx(i), Z = mcz(i);
    const ew = (x > 0 && passage(i - 1)) + (x < W - 1 && passage(i + 1)), ns = (z > 0 && passage(i - W)) + (z < D - 1 && passage(i + W));
    const estOuest = ew > ns;                          // la passerelle va d'est en ouest : ses planches dans l'autre sens
    for(let k = 0; k < 4; k++){
      const d = -.375 + k * .25, c = (k + x + z) % 2 ? 0xB8875A : 0xA97A4F;
      planches.push(estOuest ? [X + d, -.04, Z, .22, .08, .96, 0, c] : [X, -.04, Z + d, .96, .08, .22, 0, c]);
    }
    if((x + z) % 2 === 0 || T[i] === "embarcadere") for(const s of [-.46, .46]) pieux.push(estOuest ? [X, -.5, Z + s, .14, 1.1, .14] : [X + s, -.5, Z, .14, 1.1, .14]);
  }
  serie(g, G.box, blanc(), planches);
  serie(g, G.cyl, mat(0x6B4A2F), pieux);
  /* les arbres, en série */
  const parEssence = {};
  marais.obj.forEach((o, i) => { if(E[o]) (parEssence[o] = parEssence[o] || []).push(i); });
  series = {};
  for(const [sp, cases] of Object.entries(parEssence)){
    series[sp] = E[sp].map(([geo, coul, s, p]) => {
      const voile = coul === VOILE, mesh = new THREE.InstancedMesh(geo, typeof coul === "number" ? mat(coul) : coul, cases.length);
      mesh.castShadow = !voile; mesh.receiveShadow = !voile;
      const local = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(...s));
      g.add(mesh);
      return {mesh, local};
    });
    cases.forEach((i, k) => indexDe.set(i, k));
    cases.forEach(i => montrerArbre(i, !!maraisObj(i)));
  }
  /* les plantes, chacune à elle */
  marais.obj.forEach((o, i) => { if(plante(o)) ajouterPlante(i); });
  /* la Libellule amarrée à l'embarcadère, le poteau « Marais brumeux » */
  const barque = barqueModele(false); barque.position.set(BARQUE_EN.x, .02, BARQUE_EN.z); g.add(barque);
  ecriteau(g, mcx(PANNEAU), mcz(PANNEAU), "Marais brumeux");
  /* au bord des îlots, des roseaux (du côté de l'eau) ; sur l'eau, des feuilles de nénuphar sans fleur */
  const tiges = [], massettes = [], feuilles = [];
  for(let i = 0; i < W * D; i++){
    const x = i % W, z = Math.floor(i / W), r = marais.r[i];
    if(T[i] === "terre" && !marais.obj[i] && r < .45){
      for(const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
        const j = (z + dz) * W + x + dx;
        if(x + dx < 0 || x + dx >= W || z + dz < 0 || z + dz >= D || T[j] !== "eau" || marais.obj[j]) continue;
        const bx = mcx(i) + dx * .6, bz = mcz(i) + dz * .6;
        for(let k = 0; k < 5; k++){
          const t = k * 1.3 + r * 9, rr = .12 + (k % 2) * .1, h = .75 + (k % 3) * .22, px = bx + Math.cos(t) * rr, pz = bz + Math.sin(t) * rr;
          tiges.push([px, EAU + h / 2, pz, .04, h, .04, 0, k % 2 ? 0x8AA05A : 0x7A9450]);
          if(k % 2 === 0) massettes.push([px, EAU + h - .05, pz, .08, .22, .08]);
        }
        break;
      }
    } else if(T[i] === "eau" && !marais.obj[i] && r > .96) feuilles.push([mcx(i) + (r - .98) * 20, EAU + .02, mcz(i), .6 + r * .2, .02, .6 + r * .2, r * 40, r > .98 ? 0x4A8A4A : 0x3E7A40]);
  }
  serie(g, G.cyl, blanc(), tiges, false);
  serie(g, G.cyl, mat(0x6A4630), massettes, false);
  serie(g, G.cyl, blanc(), feuilles, false);
  /* au loin, tout autour, d'autres cyprès dans la brume */
  const loin = [];
  for(let k = 0; k < 28; k++){ const a = k / 28 * 6.283 + .1, d = 26 + (k * 7 % 5) * 1.6; loin.push([Math.cos(a) * d, Math.sin(a) * d, .9 + (k % 3) * .2]); }
  for(const [geo, coul, s, p] of E.cypres) serie(g, geo, mat(coul), loin.map(([x, z, k]) => [x + p[0] * k, p[1] * k, z + p[2] * k, s[0] * k, s[1] * k, s[2] * k]), false);
  /* et des nappes de brume qui flottent */
  for(let k = 0; k < 12; k++){ const a = k * 2.4, d = 5 + (k * 5 % 14); brume(g, Math.cos(a) * d, Math.sin(a) * d, .7 + (k % 3) * .2); }
  return {group: g, w: W, d: D, walk: marche, depart: DEPART,
    light: 0xE8F0E4, power: .7, ground: 0x3A4A40, sky: 0xC8D8CC, hemi: .9, fond: 0xB4C6BA, brume: [18, 40]};
}
/* Où l'on marche : la terre des îlots, les sentiers, les passerelles, l'embarcadère ; pas l'eau, ni les arbres ni le
   poteau (un arbre coupé, si) ; on traverse les plantes */
export function marche(x, z){
  const i = mtile(x, z);
  if(i < 0 || marais.type[i] === "eau") return false;
  const o = maraisObj(i);
  return !o || plante(o);
}
/* Pour recolte.js : le modèle d'un arbre ou d'une plante (pour trembler et tomber), et le couper */
export function maraisMesh(i){
  if(seuls.has(i)) return seuls.get(i);
  if(plantes.has(i)) return plantes.get(i).g;
  const sp = maraisObj(i);
  if(!sp || !series || !series[sp]) return null;
  const r = marais.r[i], g = arbreModele(sp, r, FRUITS[sp] ? fruitsDeSaison(sp) && !maraisCueilliLeft(i) : true), [x, z] = posArbre(i);
  g.position.set(x, 0, z); g.rotation.y = r * 6.28;
  group.add(g); seuls.set(i, g);
  montrerArbre(i, false);
  return g;
}
export function setMaraisObj(i, o){
  if(o) return;                                          // on ne pose rien dans le Marais
  etat().coupes[i] = Date.now();
  if(seuls.has(i)){ group.remove(seuls.get(i)); seuls.delete(i); }
  montrerArbre(i, false);
  save();
}
/* À chaque image (main.js), quand on est au Marais : les feux-follets dansent ; chaque seconde, les plantes suivent la
   nuit, la saison et leurs cueillettes */
export function updateMarais(dt){
  if(!group || !group.parent) return;
  temps += dt;
  for(const [i, p] of plantes) if(p.fruit.userData.danse && p.fruit.visible){ p.fruit.position.y = Math.sin(temps * 2.2 + i) * .1; p.fruit.position.x = Math.sin(temps * 1.3 + i) * .08; }
  if((tic += dt) < 1) return;
  tic = 0;
  for(const i of plantes.keys()) majPlante(i);
}
/* Ce qui a repoussé pendant qu'on est au Marais réapparaît */
setInterval(() => {
  if(!group || !group.parent) return;
  for(const k of Object.keys(etat().coupes)){ const i = +k; if(maraisObj(i)) montrerArbre(i, true); }
  for(const k of Object.keys(etat().cueillis)){ const i = +k; if(!plantes.has(i) && !seuls.has(i) && !maraisCueilliLeft(i)) montrerArbre(i, !!maraisObj(i)); }
}, 15000);
