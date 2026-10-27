/* ================= Les insectes (étape 1.7, morceau 1) =================
   Des petites bêtes vivent sur l'île, toute l'année, certaines seulement à leur saison (INSECTES, d'après le
   Grand Carnet revu avec Yo) : sur les fleurs (thym, buissons), dans les herbes hautes, sur les arbres, au sol,
   sous les pierres, au bord de l'étang, autour des lanternes la nuit. Au plus INSECTE.max autour du personnage ;
   chacune reste un moment puis s'en va.
   On les attrape au filet (du sac, pris en main tout seul) : « 🥅 Attraper » quand on est tout près ; depuis le 25 octobre
   2026, un vrai coup de filet qu'on peut rater (COUP : la bête qui bouge, la rare qui esquive ; ratée, elle se pose plus loin).
   À pas de loup : en poussant le joystick doucement (allure sous ALLURE_DOUCE, ou Maj au clavier), on approche ;
   trop vite, elles s'enfuient. La luciole se prend au bocal (carnet ; le bocal se fait à l'enclume depuis l'étape 1.11).
   Une bête attrapée va dans le sac (vendue au comptoir, plus tard exposée à la Maison des ailes) ; le carnet la
   garde (state.carnet.insectes = {k: {n}}).
   Morceau 4 : ceux de la Forêt profonde (zone « foret ») vivent dans la forêt (scène des intérieurs) : sur les
   arbres, les vieux chênes, au pied des arbres (le bois mort), dans les clairières.
   Étape 1.13, morceau 5 : ceux du Marais brumeux (zone « marais ») : sur l'eau près des bords (l'araignée d'eau qui
   patine, le dytique qui file), dans la brume (la luciole des brumes, au bocal, qui flotte), dans les roseaux (la
   libellule de verre, par brouillard : on l'entend tinter). */
import { scene } from "./monde/scene.js";
import { interior } from "./monde/interieurs.js";
import { foret, foretObj, arbreEn, fcx, fcz, W as WF } from "./monde/foret.js";
import { G, part, toon } from "./monde/formes.js";
import { INSECTES, HEURES, PECHE, OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace, porte } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, thymLeft, lieuEau, fleurie, PERCHOIRS } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { ARBRES } from "./monde/essences.js";
import { lanternes } from "./monde/ponton.js";
import { lumieresIle } from "./lumieres.js";
import { player, pencheMain, allure, ALLURE_DOUCE, placePlayer } from "./monde/personnage.js";
import { gesteOutil } from "./monde/mains.js";
import { MODELES_INSECTES } from "./monde/insectes3d.js";
import { oiseauxIci } from "./oiseaux.js";
import { saisonDe, pleineLune } from "./peche.js";
import { meteo, brouillard } from "./monde/meteo.js";
import { marais, maraisObj, plante, mcx, mcz, W as WM } from "./monde/marais.js";
import { toast } from "./interface.js";
import { tenu } from "./barre.js";
import { user } from "./usure.js";

/* Combien, où, combien de temps (à régler en jouant) ; peur : à quelle distance une bête fuit qui nous voit arriver trop vite */
export const INSECTE = {max: 6, rayon: 9, vie: [50, 110], portee: 1.3};
/* Combien à la fois autour du personnage, selon la saison (décidé avec Yo le 25 octobre 2026 : l'été ça grouille, l'hiver
   c'est calme ; Animal Crossing n'en montre que 4 ou 5 sur toute l'île) */
export const INSECTES_SAISON = {printemps: 5, ete: 6, automne: 5, hiver: 4};
const maxIci = () => INSECTES_SAISON[saisonDe(new Date())] || INSECTE.max;
/* Le coup de filet (décidé avec Yo le 25 octobre 2026, « Mélange ») : le filet s'abat là où était la bête quand on a touché
   le bouton ; s'il touche (après COUP.touche secondes), elle est prise ; si elle a bougé hors de la zone du filet, c'est
   raté. Une bête rare, ou méfiante (déjà ratée), peut esquiver dès qu'elle voit le filet arriver. Ratée, une bête
   commune ou peu commune va se poser un peu plus loin, plus méfiante (elle fuit de plus loin) ; une rare, ou une bête
   ratée trois fois, s'envole et disparaît. */
export const COUP = {duree: .4, touche: .2, zone: .32, esquive: {commun: 0, peuCommun: .12, rare: .3}, mefiance: .15, loin: [2.5, 6]};
const PEUR_OISEAU = 1.2;                              // à moins de 1,2 P d'un oiseau, l'insecte s'enfuit
const PEUR = {papillon: 2.6, libellule: 3, bourdon: 2.2, sauteur: 2.6, coleo: 1.8, fourmi: 1.6, cloporte: 1.6, araignee: 1.8, mante: 2, cigale: 2.4, phasme: 1.4, lucane: 1.8};
const VOLE = {papillon: true, libellule: true, bourdon: true};

/* ----- Qui vit ici (zone : « ile » ou « foret ») et maintenant (vraie horloge du téléphone, l'hémisphère du joueur) ;
   sous la pluie et la neige, les papillons se cachent (étape 1.10, morceau 3) ----- */
export function insectesPresents(zone = "ile", d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60, lune = pleineLune(d), abri = meteo() !== "beau" && meteo() !== "nuages";
  return Object.keys(INSECTES).filter(k => { const p = INSECTES[k];
    return !p.reserve && (p.zone || "ile") === zone && p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b) && (!p.lune || lune)
      && !(abri && p.forme === "papillon") && (!p.brouillard || brouillard()); });
}
const leNom = (k, maj) => { const p = INSECTES[k], s = `${p.une ? "une" : "un"} ${p.rarete === "rare" ? p.nom : p.nom.toLowerCase()}`;
  return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Les modèles, en formes simples, à la taille d'un jouet ----- */
const mat = (c, o) => toon(Object.assign({color: c}, o || {}));
function modele(k){
  const fait = MODELES_INSECTES[k];                    // refait d'après l'image de Yo (insectes3d.js)
  if(fait){ const g = fait.fabrique({saison: saisonDe(new Date())}); g.scale.setScalar((INSECTES[k].taille || 1) * fait.echelle); return g; }   // la saison : la punaise brunit
  const p = INSECTES[k], g = new THREE.Group(), c = p.couleur, d = p.c2 !== undefined ? p.c2 : 0x2A2A2A, ailes = [];
  /* une aile, sur un pivot qui la fait battre ; tache : une tache de couleur au milieu (les papillons) */
  const aile = (w, h, x, z, col, op, tache) => { const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, .008, h), mat(col, op ? {transparent: true, opacity: op} : null));
    m.position.set(x, 0, z); pivot.add(m);
    if(tache !== undefined){ const t = new THREE.Mesh(new THREE.BoxGeometry(w * .4, .01, h * .4), mat(tache)); t.position.set(x * 1.1, .002, z); pivot.add(t); }
    g.add(pivot); ailes.push({pivot, cote: Math.sign(x)}); };
  if(p.forme === "papillon"){
    const corps = part(G.cyl, 0x2A2A2A, .035, .2, .035, 0, 0, 0); corps.rotation.x = Math.PI/2; g.add(corps);
    aile(.17, .15, .1, -.03, c, 0, d); aile(.17, .15, -.1, -.03, c, 0, d); aile(.12, .11, .08, .07, c); aile(.12, .11, -.08, .07, c);
  } else if(p.forme === "bourdon"){
    g.add(part(G.head, c, .55, .5, .7, 0, 0, 0));
    g.add(part(G.head, d, .56, .3, .3, 0, 0, .02));
    aile(.12, .08, .08, -.02, 0xDDEFF7, .7); aile(.12, .08, -.08, -.02, 0xDDEFF7, .7);
  } else if(p.forme === "libellule"){
    const verre = p.verre ? mat(c, {transparent: true, opacity: .55, emissive: 0x6A8A9A, emissiveIntensity: .5}) : c;   // la libellule de verre
    const corps = part(G.cyl, verre, .035, .36, .035, 0, 0, .06); corps.rotation.x = Math.PI/2; g.add(corps);
    g.add(part(G.head, verre, .3, .3, .3, 0, 0, -.13));
    aile(.2, .05, .11, -.06, 0xDDEFF7, .6); aile(.2, .05, -.11, -.06, 0xDDEFF7, .6); aile(.18, .05, .1, .0, 0xDDEFF7, .6); aile(.18, .05, -.1, .0, 0xDDEFF7, .6);
  } else if(p.forme === "coleo"){
    g.add(part(G.hair, c, .45, .45, .55, 0, 0, 0));
    g.add(part(G.head, 0x2A2A2A, .25, .22, .25, 0, .01, -.13));
    if(p.bocal) g.add(part(G.head, mat(d, {emissive: d, emissiveIntensity: .9}), .3, .25, .3, 0, .02, .1));
    else if(p.c2 !== undefined) for(const [x, z] of [[-.05, -.03], [.05, -.03], [-.045, .06], [.045, .06]]) g.add(part(G.head, d, .1, .06, .1, x, .07, z));
  } else if(p.forme === "fourmi"){
    for(const z of [-.08, 0, .09]) g.add(part(G.head, c, .2, .2, z > 0 ? .3 : .2, 0, .03, z));
  } else if(p.forme === "cloporte"){
    g.add(part(G.hair, c, .45, .3, .65, 0, 0, 0));
  } else if(p.forme === "sauteur"){
    g.add(part(G.head, c, .32, .32, .9, 0, .05, 0));
    for(const x of [-.06, .06]){ const patte = part(G.cyl, c, .02, .2, .02, x, .08, .1); patte.rotation.x = -.9; g.add(patte); }
  } else if(p.forme === "araignee" && p.gerris){       // l'araignée d'eau : un corps fin, six longues pattes posées sur l'eau
    const corps = part(G.cyl, c, .04, .24, .04, 0, .03, 0); corps.rotation.x = Math.PI/2; g.add(corps);
    g.add(part(G.head, c, .18, .16, .2, 0, .03, -.13));
    for(const [z, l, a] of [[-.08, .16, .5], [0, .3, 1.35], [.06, .3, 2.1]]) for(const s of [-1, 1]){
      const pa = part(G.cyl, d, .01, l, .01, s * Math.sin(a) * l / 2, .01, z - Math.cos(a) * l / 2);
      pa.rotation.order = "YXZ"; pa.rotation.set(Math.PI/2, Math.PI - s * a, 0); g.add(pa);   // couchée, tournée vers l'avant, le côté ou l'arrière
    }
  } else if(p.forme === "araignee"){
    g.add(part(G.head, c, .45, .4, .5, 0, .05, .04));
    g.add(part(G.head, c, .25, .22, .25, 0, .04, -.08));
    for(let n = 0; n < 8; n++){ const a = (n < 4 ? -1 : 1) * (.5 + (n % 4) * .35), pa = part(G.cyl, 0x3A2A1A, .012, .18, .012, Math.sign(a) * .08, .04, -.05 + (n % 4) * .045); pa.rotation.z = a; g.add(pa); }
  } else if(p.forme === "mante"){
    const corps = part(G.cyl, c, .04, .4, .04, 0, .12, 0); corps.rotation.x = .5; g.add(corps);
    g.add(part(G.head, c, .2, .2, .2, 0, .3, -.1));
    for(const x of [-.04, .04]){ const bras = part(G.cyl, c, .02, .14, .02, x, .22, -.13); bras.rotation.x = -.8; g.add(bras); }
  } else if(p.forme === "phasme"){                   // une brindille sur pattes
    const corps = part(G.cyl, c, .025, .5, .025, 0, .02, 0); corps.rotation.x = Math.PI/2; g.add(corps);
    for(const z of [-.12, 0, .12]) for(const x of [-1, 1]){ const pa = part(G.cyl, c, .012, .16, .012, x * .06, .02, z); pa.rotation.z = x * 1.1; g.add(pa); }
  } else if(p.forme === "lucane"){                    // un gros scarabée : des mandibles en bois de cerf, ou une corne
    g.add(part(G.hair, c, .45, .4, .55, 0, 0, .02));
    g.add(part(G.head, c, .3, .25, .28, 0, .01, -.13));
    if(p.corne){ const co = part(G.cone, c, .06, .16, .06, 0, .08, -.18); co.rotation.x = -.6; g.add(co); }
    else for(const x of [-.05, .05]){ const m = part(G.cyl, d, .02, .16, .02, x, .02, -.22); m.rotation.x = Math.PI/2; m.rotation.y = -x * 6; g.add(m); }
  } else {                                            // cigale
    g.add(part(G.head, c, .4, .35, .6, 0, 0, 0));
    aile(.08, .2, .06, .04, 0xDDEFF7, .6); aile(.08, .2, -.06, .04, 0xDDEFF7, .6);
  }
  g.scale.setScalar((p.taille || 1) * 1.5);          // plus gros que nature, pour bien les voir (style jouet)
  g.userData.ailes = ailes;
  return g;
}

/* ----- Où elles vivent : une place près du personnage, selon l'endroit ----- */
/* Dans la Forêt profonde : sur les troncs, les vieux chênes (et le Grand Chêne), au pied des arbres, dans les clairières */
function placesForet(ou){
  const R = INSECTE.rayon, p = player.position, out = [], x0 = Math.floor(p.x + WF/2), z0 = Math.floor(p.z + WF/2);
  for(let z = z0 - R; z <= z0 + R; z++) for(let x = x0 - R; x <= x0 + R; x++){
    if(x < 0 || z < 0 || x >= WF || z >= WF || Math.hypot(x - x0, z - z0) < 2) continue;
    const i = z * WF + x, o = foretObj(i), a = Math.random() * 6.28;
    if(o === "grandChene" && ou === "chenes") out.push({x: fcx(i) + .5 + Math.cos(a) * .8, y: .5 + Math.random() * .8, z: fcz(i) + .5 + Math.sin(a) * .8, tronc: true});
    else if((ou === "arbres" || ou === "chenes" && o === "chene") && ARBRES.has(o)){
      const e = arbreEn(i), r = (o === "chene" ? .4 : .2) * e.s + .03;
      out.push({x: e.x + Math.cos(a) * r, y: .45 + Math.random() * .6, z: e.z + Math.sin(a) * r, tronc: true});
    }
    else if(ou === "boisMort" && ARBRES.has(o)){ const e = arbreEn(i); out.push({x: e.x + Math.cos(a) * .55 * e.s, y: .03, z: e.z + Math.sin(a) * .55 * e.s}); }
    else if(ou === "clairieres" && foret.type[i] === "herbe" && !o) out.push({x: fcx(i), y: .45, z: fcz(i)});
  }
  return out;
}
/* Au Marais brumeux (étape 1.13, morceau 5) : sur l'eau près d'un bord (surface, mares), dans les roseaux au bord des
   îlots, dans la brume au-dessus des îlots et de l'eau */
const EAU = -.2;
function placesMarais(ou){
  const R = INSECTE.rayon, p = player.position, out = [], x0 = Math.floor(p.x + WM/2), z0 = Math.floor(p.z + WM/2), T = marais.type;
  const voisin = (x, z, f) => [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => x + a >= 0 && z + b >= 0 && x + a < WM && z + b < WM && f(T[(z + b) * WM + x + a]));
  for(let z = z0 - R; z <= z0 + R; z++) for(let x = x0 - R; x <= x0 + R; x++){
    if(x < 0 || z < 0 || x >= WM || z >= WM || Math.hypot(x - x0, z - z0) < 2) continue;
    const i = z * WM + x, o = maraisObj(i), vide = !o || plante(o), r = Math.random() - .5;
    if((ou === "surface" || ou === "mares") && T[i] === "eau" && !o && voisin(x, z, t => t !== "eau")) out.push({x: mcx(i) + r * .4, y: EAU + .03, z: mcz(i) - r * .4});
    else if(ou === "roseaux" && T[i] === "terre" && vide && voisin(x, z, t => t === "eau")) out.push({x: mcx(i) + r * .5, y: .45, z: mcz(i) + r * .3});
    else if(ou === "brume" && (T[i] === "terre" || T[i] === "eau") && vide) out.push({x: mcx(i), y: .8 + Math.random() * .6, z: mcz(i)});
  }
  return out;
}
function places(ou){
  if(ici === "foret") return placesForet(ou);
  if(ici === "marais") return placesMarais(ou);
  const R = INSECTE.rayon, px = tileOf(player.position.x), pz = tileOf(player.position.z), out = [];
  if(ou === "lanternes"){
    for(const l of [...lanternes, ...lumieresIle()])          // la lanterne du ponton, et les lumières posées (demande de Yo, 11 octobre 2026)
      if(Math.hypot(l.x - player.position.x, l.z - player.position.z) < R) out.push({x: l.x, y: l.y, z: l.z});
    return out;
  }
  for(let z = pz - R; z <= pz + R; z++) for(let x = px - R; x <= px + R; x++){
    if(!inb(x, z) || Math.hypot(x - px, z - pz) < 2) continue;
    const i = idx(x, z), o = map.obj[i], cx = centerOf(x), cz = centerOf(z), a = Math.random() * 6.28;
    if(ou === "fleurs" && ((o === "thym" && !thymLeft(i) || o === "buisson") && growth(i) >= 1 || fleurie(i))) out.push({x: cx, y: o === "thym" ? .42 : o === "buisson" ? 1.05 : .55, z: cz});   // un jardin fleuri attire les papillons (carnet)
    else if(ou === "herbes" && o === "herbe") out.push({x: cx, y: .15, z: cz});
    else if(ou === "arbres" && ARBRES.has(o) && growth(i) >= 1) out.push({x: cx + Math.cos(a) * .3, y: .45 + Math.random() * .5, z: cz + Math.sin(a) * .3, tronc: true});
    else if(ou === "sol" && map.type[i] === "grass" && !o && !occ.has(i)) out.push({x: cx, y: .03, z: cz});
    else if(ou === "pierres" && (o === "rock" || o === "rockCuivre")) out.push({x: cx + Math.cos(a) * .5, y: .03, z: cz + Math.sin(a) * .5});
    else if(ou === "etang" && map.type[i] === "water" && lieuEau(i) === "etang") out.push({x: cx, y: .45, z: cz});
  }
  return out;
}

/* ----- Les bêtes autour du personnage ----- */
const betes = [];                  // {k, x, y, z, base, t, vie, etat ("vit" | "fuit" | "part"), alpha, mesh, mats, cible, saut}
const groupe = new THREE.Group(); scene.add(groupe);
/* Le milieu (morceau 4) : « ile » (dehors) ou « foret » (la scène des intérieurs) ; en changeant, les bêtes s'en vont */
let ici = "ile";
const sceneIci = () => ici === "ile" ? scene : interior;
function changer(ou){
  if(!ou || ou === ici) return;
  for(const b of [...betes]) retirer(b);
  ici = ou; sceneIci().add(groupe);
}
function ajouter(k, pl){
  const mesh = modele(k), mats = [], lueur = INSECTES[k].lueur;
  mesh.traverse(m => { if(m.material){ m.material = m.material.clone(); m.material.transparent = true; mats.push({m: m.material, op: m.material.opacity}); m.material.opacity = 0;
    if(lueur && m.material.emissive){ m.material.emissive.setHex(lueur); m.material.emissiveIntensity = .7; } } });   // la phalène de lune luit
  mesh.position.set(pl.x, pl.y, pl.z);
  groupe.add(mesh);
  const b = {k, x: pl.x, y: pl.y, z: pl.z, base: pl, t: Math.random() * 10, vie: INSECTE.vie[0] + Math.random() * (INSECTE.vie[1] - INSECTE.vie[0]),
    age: 0, etat: "vit", alpha: 0, mesh, mats, cible: null, pause: Math.random() * 2, saut: null, ang: Math.random() * 6.28, mefiance: 0};
  betes.push(b);
  return b;
}
function retirer(b){ groupe.remove(b.mesh); betes.splice(betes.indexOf(b), 1); }
/* Une nouvelle bête : une rareté d'abord (comme les poissons), puis une espèce qui a une place ici */
function pondre(){
  const ks = insectesPresents(ici);
  if(!ks.length) return;
  for(let essai = 0; essai < 6; essai++){
    const par = {};
    ks.forEach(k => { const r = INSECTES[k].rarete; (par[r] = par[r] || []).push(k); });
    const rangs = Object.keys(par);
    let x = Math.random() * rangs.reduce((n, r) => n + PECHE.poids[r], 0);
    const r = rangs.find(r => (x -= PECHE.poids[r]) < 0) || rangs[0];
    const k = par[r][Math.floor(Math.random() * par[r].length)], p = INSECTES[k];
    const ou = p.ou[Math.floor(Math.random() * p.ou.length)], pl = places(ou);
    const libres = pl.filter(q => !betes.some(b => Math.hypot(b.base.x - q.x, b.base.z - q.z) < .8));
    if(!libres.length) continue;
    ajouter(k, libres[Math.floor(Math.random() * libres.length)]);
    if(p.verre && performance.now() - tinte > 90000){ tinte = performance.now(); toast("🎐 Un tintement de verre, dans les roseaux… Une libellule de verre est tout près", 3400); }   // carnet : « des ailes qui tintent »
    return;
  }
}
let tinte = -1e9;
/* Pour la vérification automatique : une bête à un endroit précis */
export function lacherInsecte(k, x, z, y = .3){ const b = ajouter(k, {x, y, z}); b.alpha = 1; b.pause = 99; b.essai = true; return b; }   // elle attend, sans esquiver
/* Pour la vérification automatique : un coup de filet raté sur cette bête */
export const essaiRate = b => rater(b);
/* … et une bête surprise parce qu'on arrive trop vite */
export const essaiFuite = b => fuir(b, true);
let conseil = -1e9;
function fuir(b, vite, oiseau){
  if(b.etat !== "vit") return;
  /* le paon-du-jour posé, surpris : il ouvre d'un coup ses ailes et montre ses yeux, puis s'envole (Yo, 27 octobre 2026) */
  if(vite && b.posee && b.mesh.userData.yeux && !b.flashFait){ if(!b.flash) b.flash = .7; return; }
  /* un oiseau approche (Yo, 26 octobre 2026 : « Dès qu'un oiseau s'approche d'un insecte, il faudrait que l'insecte s'enfuit ») :
     une commune ou peu commune va se poser plus loin, sans devenir plus méfiante envers le joueur ; la rare s'en va */
  if(oiseau){
    if(INSECTES[b.k].rarete !== "rare" && seReposer(b)) return;
    b.etat = "fuit"; b.ang = Math.atan2(b.z - oiseau.z, b.x - oiseau.x); return;
  }
  /* surprise parce qu'on arrive trop vite (Yo, 25 octobre 2026 : « la libellule disparaît et ne va pas se poser plus loin ») :
     une commune ou peu commune va se poser plus loin, plus méfiante, comme après un coup de filet raté ; la rare s'en va */
  if(vite && INSECTES[b.k].rarete !== "rare" && b.mefiance < 2){
    b.mefiance++;
    if(seReposer(b)){ if(performance.now() - conseil > 45000){ conseil = performance.now();
      toast(`💨 Trop vite : ${leNom(b.k)} s'est posé${INSECTES[b.k].une ? "e" : ""} plus loin. Approche à pas de loup, en poussant le joystick doucement`, 3600); }
      return; }
  }
  b.etat = "fuit"; b.ang = Math.atan2(b.z - player.position.z, b.x - player.position.x);
  if(vite && performance.now() - conseil > 45000){ conseil = performance.now();
    toast(`💨 Trop vite : ${leNom(b.k)} s'est enfui${INSECTES[b.k].une ? "e" : ""} ! Approche à pas de loup, en poussant le joystick doucement`, 3600); }
}
/* Ce que fait chacune, à chaque image */
/* L'abeille butine, comme une vraie (Yo, 26 octobre 2026 : « elle se pose ») : quelques boucles en l'air, puis elle vole
   vers une fleur proche et s'y pose, les ailes repliées, quelques secondes, avant de repartir. Le bourdon aussi (« il se pose
   sur les fleurs »), d'un vol plus lourd et balancé (donnée lourd) */
function butiner(b, dt){
  const u = b.butin || (b.butin = {etat: "tourne", t: 1 + Math.random() * 2}), base = b.base, doux = Math.min(1, dt * 5);
  u.t -= dt;
  if(u.etat === "tourne"){
    const lourd = INSECTES[b.k].lourd, papillon = INSECTES[b.k].forme === "papillon";
    const nx = papillon ? base.x + Math.sin(b.t * .8) * .6 + Math.sin(b.t * 2.1) * .15 : base.x + Math.cos(b.t * 2.6) * .35;   // le papillon volette plus large et plus haut
    const nz = papillon ? base.z + Math.cos(b.t * .6) * .6 : base.z + Math.sin(b.t * 3.3) * .3;
    const ny = papillon ? base.y + .35 + Math.sin(b.t * 2.4) * .15 : base.y + .15 + (lourd ? Math.sin(b.t * 3) * .1 + Math.sin(b.t * 7.3) * .025 : Math.sin(b.t * 5) * .06);
    b.ang = Math.atan2(nz - b.z, nx - b.x); b.x += (nx - b.x) * doux; b.z += (nz - b.z) * doux; b.y += (ny - b.y) * doux;
    if(u.t <= 0){
      const pl = places("fleurs").filter(q => Math.hypot(q.x - b.x, q.z - b.z) < 4), q = pl.length ? pl[Math.floor(Math.random() * pl.length)] : base;
      Object.assign(u, {etat: "va", de: {x: b.x, y: b.y, z: b.z}, vers: q, k: 0, T: Math.max(.6, Math.hypot(q.x - b.x, q.z - b.z) / 1.2)});
    }
  } else if(u.etat === "va"){
    u.k = Math.min(1, u.k + dt / u.T);
    const {de, vers} = u;
    b.x = de.x + (vers.x - de.x) * u.k; b.z = de.z + (vers.z - de.z) * u.k; b.y = de.y + (vers.y - de.y) * u.k + Math.sin(u.k * Math.PI) * .25;
    if(Math.hypot(vers.x - de.x, vers.z - de.z) > .01) b.ang = Math.atan2(vers.z - de.z, vers.x - de.x);
    if(u.k >= 1){ b.base = vers; u.etat = "pose"; u.t = 3 + Math.random() * 4; b.soleil = false; b.flashFait = false; }
  } else {                                                              // posée, elle butine
    b.x = base.x; b.z = base.z; b.y = base.y;
    if(Math.random() < dt * .12) b.soleil = !b.soleil;                       // le paon-du-jour ouvre parfois ses ailes au soleil
    if(u.t <= 0){ u.etat = "tourne"; u.t = 2 + Math.random() * 3; b.soleil = false; }
  }
  b.posee = u.etat === "pose";
  if(INSECTES[b.k].lourd) b.mesh.rotation.z = b.posee ? 0 : Math.sin(b.t * 4) * .14;   // le bourdon se balance en volant
}
/* La libellule se perche (Yo, 26 octobre 2026 : « elle se perche sur les massettes ») : parfois, au lieu de faire du
   sur-place, elle file au bout d'une massette proche et s'y pose, ailes ouvertes à plat, quelques secondes */
function percher(b, dt){
  if(!b.perch){
    if(b.pause <= 0 || b.cible || Math.random() > dt * .15) return false;
    const pl = PERCHOIRS.filter(q => Math.hypot(q.x - b.x, q.z - b.z) < 3);
    if(!pl.length) return false;
    const q = pl[Math.floor(Math.random() * pl.length)];
    b.perch = {etat: "va", de: {x: b.x, y: b.y, z: b.z}, vers: q, k: 0, T: Math.max(.4, Math.hypot(q.x - b.x, q.z - b.z) / 2)};
  }
  const u = b.perch;
  if(u.etat === "va"){
    u.k = Math.min(1, u.k + dt / u.T);
    b.x = u.de.x + (u.vers.x - u.de.x) * u.k; b.z = u.de.z + (u.vers.z - u.de.z) * u.k; b.y = u.de.y + (u.vers.y - u.de.y) * u.k;
    if(Math.hypot(u.vers.x - u.de.x, u.vers.z - u.de.z) > .01) b.ang = Math.atan2(u.vers.z - u.de.z, u.vers.x - u.de.x);
    if(u.k >= 1){ u.etat = "pose"; u.t = 3 + Math.random() * 4; }
  } else {
    b.x = u.vers.x; b.y = u.vers.y; b.z = u.vers.z; b.posee = true;
    if((u.t -= dt) <= 0){ b.perch = null; b.pause = 0; }
  }
  return true;
}
/* La luciole vole au ras des herbes (Yo, 26 octobre 2026 : « Elle vole au ras des herbes ») : elle erre doucement autour
   de sa place, à un tiers de pas au-dessus de l'herbe, et se pose parfois quelques secondes sur un brin */
function voleter(b, dt){
  const base = b.base, u = b.ras || (b.ras = {etat: "vol", t: 3 + Math.random() * 4, cap: Math.random() * 6.28}), doux = Math.min(1, dt * 3);
  u.t -= dt;
  if(u.etat === "vol"){
    u.cap += (Math.sin(b.t * .7) * .9 + Math.sin(b.t * 1.9) * .4) * dt;
    const dx = b.x - base.x, dz = b.z - base.z;
    if(Math.hypot(dx, dz) > 1.2) u.cap = Math.atan2(-dz, -dx);                     // elle revient vers sa place
    b.x += Math.cos(u.cap) * .35 * dt; b.z += Math.sin(u.cap) * .35 * dt; b.ang = u.cap;
    b.y += (base.y + .3 + Math.sin(b.t * 1.3) * .08 - b.y) * doux;
    if(u.t <= 0){ u.etat = "pose"; u.t = 2 + Math.random() * 3; }
  } else {
    b.y += (base.y - b.y) * doux; b.posee = b.y - base.y < .03;
    if(u.t <= 0){ u.etat = "vol"; u.t = 4 + Math.random() * 5; }
  }
}
function vivre(b, dt){
  b.t += dt; b.age += dt; b.posee = false;
  /* le hanneton « compte ses sous » une seconde avant de s'envoler (Yo, 26 octobre 2026 : « Oui pour l'envol ») */
  const cpt = b.mesh.userData.compte; b.compte = false;
  if(cpt){ if(b.etat === "vole" || b.etat === "fuit"){ b.cpt = (b.cpt || 0) + dt; b.compte = b.cpt < 1; } else b.cpt = 0; }
  const p = INSECTES[b.k], f = p.forme, base = b.base;
  if(b.etat === "fuit"){
    if(!b.compte) b.alpha -= dt / .6;
    if(b.compte){}
    else if(VOLE[f] || f === "sauteur" || b.mesh.userData.elytres){ b.x += Math.cos(b.ang) * 3 * dt; b.z += Math.sin(b.ang) * 3 * dt; b.y += 1.4 * dt; }   // la coccinelle s'envole aussi
    else if(b.mesh.userData.menace && b.age - (b.fuite0 ?? (b.fuite0 = b.age)) > .35){ b.x += Math.cos(b.ang) * .9 * dt; b.z += Math.sin(b.ang) * .9 * dt; }   // le perce-oreille menace, puis file au sol
    if(b.alpha <= 0){ retirer(b); return; }
  } else if(b.etat === "part"){
    b.alpha -= dt; if(VOLE[f]) b.y += .5 * dt;
    if(b.alpha <= 0){ retirer(b); return; }
  } else if(b.etat === "vole" && b.compte){            // le hanneton compte ses sous, sur place, avant de partir
  } else if(b.etat === "vole"){                       // ratée : elle va se poser un peu plus loin
    const v = b.vol, T = VOLE[f] || f === "sauteur" ? 1 : 1.6;
    v.t += dt; const u = Math.min(1, v.t / T);
    b.x = v.x0 + (v.q.x - v.x0) * u; b.z = v.z0 + (v.q.z - v.z0) * u;
    b.y = v.y0 + (v.q.y - v.y0) * u + (VOLE[f] || f === "sauteur" || b.mesh.userData.elytres ? Math.sin(u * Math.PI) * .7 : 0);   // en arc (la coccinelle, le hanneton volent)
    b.ang = Math.atan2(v.q.z - v.z0, v.q.x - v.x0);
    if(u >= 1){ b.base = v.q; b.etat = "vit"; b.cible = null; b.saut = null; b.butin = null; b.perch = null; b.pause = 1 + Math.random() * 2; b.vie = Math.max(b.vie, b.age + 30); }
  } else {
    b.alpha = Math.min(1, b.alpha + dt);
    if(b.age > b.vie) b.etat = "part";
    if(p.ou[0] === "lanternes" && base.y > .5){       // les papillons de nuit tournent autour de la lumière
      b.x = base.x + Math.cos(b.t * 2.2) * .35; b.z = base.z + Math.sin(b.t * 2.2) * .35; b.y = base.y + Math.sin(b.t * 3.1) * .12;
      b.ang = b.t * 2.2 + Math.PI/2;
    } else if(f === "papillon" && !p.butine){       // il volette autour de sa fleur (le paon-du-jour, lui, se pose : plus bas)
      const nx = base.x + Math.sin(b.t * .8) * .6 + Math.sin(b.t * 2.1) * .15, nz = base.z + Math.cos(b.t * .6) * .6;
      b.ang = Math.atan2(nz - b.z, nx - b.x); b.x = nx; b.z = nz; b.y = base.y + .35 + Math.sin(b.t * 2.4) * .15;
    } else if(p.ras){                                  // la luciole vole au ras des herbes
      voleter(b, dt);
    } else if(p.butine){                               // l'abeille : elle se pose pour butiner
      butiner(b, dt);
    } else if(f === "bourdon"){                       // petites boucles autour des fleurs
      const nx = base.x + Math.cos(b.t * 2.6) * .35, nz = base.z + Math.sin(b.t * 3.3) * .3;
      b.ang = Math.atan2(nz - b.z, nx - b.x); b.x = nx; b.z = nz; b.y = base.y + .15 + Math.sin(b.t * 5) * .06;
    } else if(p.flotte){                              // la luciole des brumes flotte doucement dans l'air
      const nx = base.x + Math.sin(b.t * .45) * .6, nz = base.z + Math.cos(b.t * .35) * .5;
      b.ang = Math.atan2(nz - b.z, nx - b.x); b.x = nx; b.z = nz; b.y = base.y + Math.sin(b.t * .9) * .2;
    } else if(p.perche && percher(b, dt)){             // la libellule perchée sur une massette
    } else if(f === "libellule" || p.nage || p.gerris){   // elle file d'un point à l'autre, puis fait du sur-place (sur l'eau : le dytique, l'araignée d'eau)
      if(b.pause > 0) b.pause -= dt;
      else {
        const loin = f === "libellule" ? 1.2 : .5;      // sur l'eau, elles restent près de leur place (près du bord)
        if(!b.cible){ const a = Math.random() * 6.28, r = Math.random() * loin; b.cible = {x: base.x + Math.cos(a) * r, z: base.z + Math.sin(a) * r}; }
        const dx = b.cible.x - b.x, dz = b.cible.z - b.z, d = Math.hypot(dx, dz);
        if(d < .05){ b.cible = null; b.pause = .6 + Math.random() * 1.5; }
        else { const v = Math.min(d, (f === "libellule" ? 2.4 : 1.6) * dt); b.x += dx / d * v; b.z += dz / d * v; b.ang = Math.atan2(dz, dx); }
      }
      b.y = f === "libellule" ? b.y + (base.y + Math.sin(b.t * 6) * .03 - b.y) * Math.min(1, dt * 3) : base.y;   // redescend en douceur d'une massette
    } else if(f === "sauteur" && !p.marche){          // posé dans l'herbe, il fait un bond de temps en temps (le grillon, lui, marche)
      if(b.saut){
        b.saut.t += dt; const u = Math.min(1, b.saut.t / .4);
        b.x = b.saut.x0 + (b.saut.x1 - b.saut.x0) * u; b.z = b.saut.z0 + (b.saut.z1 - b.saut.z0) * u; b.y = base.y + Math.sin(u * Math.PI) * .35;
        if(u >= 1){ b.saut = null; b.pause = 1.5 + Math.random() * 3; }
      } else if((b.pause -= dt) <= 0){
        const a = Math.random() * 6.28, r = .3 + Math.random() * .4;
        b.saut = {t: 0, x0: b.x, z0: b.z, x1: base.x + Math.cos(a) * r, z1: base.z + Math.sin(a) * r}; b.ang = Math.atan2(b.saut.z1 - b.z, b.saut.x1 - b.x);
      }
    } else if(f === "mante" || f === "cigale"){       // immobile, à peine un balancement
      b.mesh.rotation.z = Math.sin(b.t * 1.3) * .05;
    } else {                                          // elle marche doucement, près de sa place
      if(b.pause > 0) b.pause -= dt;
      else {
        if(!b.cible){ const a = Math.random() * 6.28, r = Math.random() * .4; b.cible = {x: base.x + Math.cos(a) * r, z: base.z + Math.sin(a) * r}; }
        const dx = b.cible.x - b.x, dz = b.cible.z - b.z, d = Math.hypot(dx, dz);
        if(d < .02){ b.cible = null; b.pause = .5 + Math.random() * 2.5; }
        else { const v = Math.min(d, (f === "fourmi" ? .3 : .12) * dt); b.x += dx / d * v; b.z += dz / d * v; b.ang = Math.atan2(dz, dx); }
      }
      if(base.tronc) b.y = base.y + Math.sin(b.t * .4) * .15;
    }
  }
  /* Les ailes battent ; la luciole clignote */
  const vite = VOLE[f] && !b.posee || p.ras && b.etat === "vit" && !b.posee || b.etat === "vole" && !b.posee && !b.compte && f !== "fourmi" && f !== "cloporte" || b.etat === "fuit" && b.mesh.userData.elytres && !b.compte ? (f === "papillon" ? 9 : 28) : 0;
  for(const a of b.mesh.userData.ailes) a.pivot.rotation.z = a.cote * (vite ? Math.sin(b.t * vite + (a.phase || 0)) * .7 : b.posee && b.mesh.userData.ailes.length > 2 ? 0 : .1);   // la libellule : en décalé ; posée, à plat
  /* Les pattes qui marchent (la fourmi) : les trépieds se relaient au rythme du chemin fait ; à l'arrêt, elles se reposent */
  const pattes = b.mesh.userData.pattes;
  if(pattes){
    const pas = b.mesh.userData.pas, d = vite ? 0 : Math.min(.05, Math.hypot(b.x - b.mesh.position.x, b.z - b.mesh.position.z));   // en vol, elles se reposent
    b.foule = (b.foule || 0) + d / pas.foulee * Math.PI * 2;
    b.marche = Math.max(0, Math.min(1, (b.marche || 0) + (d > .02 * dt ? 6 : -6) * dt));
    for(const pa of pattes){ const u = b.foule + pa.phase;
      pa.mesh.position.set(0, pas.leve * Math.max(0, Math.sin(u)) * b.marche, pas.avance * Math.cos(u) * b.marche); }
  }
  /* Les ailes fermées, dressées, quand il est posé (le paon-du-jour) ; ouvertes au soleil ou pour montrer ses yeux */
  const ferme = b.mesh.userData.ferme;
  if(ferme){
    if(b.flash > 0 && (b.flash -= dt) <= 0){ b.flash = 0; b.flashFait = true; if(b.etat === "vit") fuir(b, true); }
    b.fe = (b.fe || 0) + ((b.posee && !(b.flash > 0) && !b.soleil ? 1 : 0) - (b.fe || 0)) * Math.min(1, dt * (b.flash > 0 ? 25 : 6));
    if(!vite) for(const a of b.mesh.userData.ailes) a.pivot.rotation.z = a.cote * (ferme * b.fe + .05);
  }
  /* Les jambes arrière qui se détendent d'un coup pour sauter, puis se replient (la sauterelle) */
  const det = b.mesh.userData.detente;
  if(det){
    const u = b.saut ? Math.min(1, b.saut.t / .4) : -1;
    const vise = u >= 0 ? (u < .2 ? u / .2 : Math.max(0, 1 - (u - .2) / .5)) : b.etat === "vole" || b.etat === "fuit" ? 1 : 0;
    b.det = (b.det || 0) + (vise - (b.det || 0)) * Math.min(1, dt * 25);
    for(const d of det) d.pivot.rotation.x = -d.angle * b.det;
  }
  /* Le hanneton compte ses sous (le ventre qui se gonfle, les éventails ouverts), puis vole lourdement, en se balançant */
  if(cpt){
    cpt.ventre.scale.y = 1 + (b.compte ? .16 * Math.max(0, Math.sin(b.cpt * 16)) : 0);
    const ouvert = b.compte || b.etat === "vole" || b.etat === "fuit";
    for(const e of cpt.eventails) e.scale.setScalar(e.scale.x + ((ouvert ? 1.15 : .8) - e.scale.x) * Math.min(1, dt * 8));
    b.mesh.rotation.z = (b.etat === "vole" || b.etat === "fuit") && !b.compte ? Math.sin(b.t * 5) * .18 : 0;
  }
  /* La bouffée d'odeur de la punaise dérangée : elle grossit et s'efface en moins d'une seconde */
  const odeur = b.mesh.userData.odeur;
  if(odeur){
    const derangee = b.etat === "vole" || b.etat === "fuit";
    b.od = derangee ? (b.od || 0) + dt : 0;
    odeur.visible = derangee && b.od < .9;
    if(odeur.visible) odeur.scale.setScalar(.6 + b.od * 2.6);
  }
  /* La lanterne de la luciole : un éclair d'un tiers de seconde, à peu près chaque seconde, avec son halo */
  const lan = b.mesh.userData.lanterne;
  if(lan){
    const e = Math.pow(Math.max(0, Math.sin((b.t * 1.05 + lan.phase) * Math.PI * 2)), 3);
    lan.mesh.material.emissiveIntensity = .15 + 1.6 * e;
    lan.halo.scale.setScalar(.16 * e);
  }
  /* Le chant du grillon mâle : arrêté, il relève ses ailes et les fait vibrer ; il se tait quand on approche (le carnet) */
  const chant = b.mesh.userData.chant;
  if(chant){
    const vise = b.etat === "vit" && !b.cible && Math.hypot(b.x - player.position.x, b.z - player.position.z) > 3.2 ? 1 : 0;
    b.ch = (b.ch || 0) + (vise - (b.ch || 0)) * Math.min(1, dt * 6);
    for(const c of chant){ c.pivot.rotation.x = -.6 * b.ch; c.pivot.rotation.z = c.cote * (.12 + Math.sin(b.t * 45) * .05) * b.ch; }
  }
  /* La menace du perce-oreille : dérangé, il relève le bout du ventre et ouvre ses pinces, puis file */
  const men = b.mesh.userData.menace;
  if(men){
    const vise = b.etat === "fuit" || b.etat === "vole" && b.vol && b.vol.t < .8 ? 1 : 0;
    b.men = (b.men || 0) + (vise - (b.men || 0)) * Math.min(1, dt * 8);
    men.ventre.rotation.x = -.75 * b.men;
    for(const pi of men.pinces) pi.pivot.rotation.y = pi.cote * .45 * b.men;
  }
  /* Les ailes repliées à plat sur le dos quand elle est posée (l'abeille) */
  const rep = b.mesh.userData.replie;
  if(rep){
    b.pli = Math.max(0, Math.min(1, (b.pli || 0) + (b.posee ? 4 : -4) * dt));
    for(const a of b.mesh.userData.ailes) a.pivot.rotation.y = -a.cote * rep * b.pli;
  }
  /* Les élytres (la coccinelle) : levés pour s'envoler, les fines ailes dépliées dessous ; refermés au repos, ailes cachées */
  const ely = b.mesh.userData.elytres;
  if(ely){
    b.envol = Math.max(0, Math.min(1, (b.envol || 0) + (vite ? 5 : -5) * dt));
    for(const e of ely) e.pivot.rotation.set(-.45 * b.envol, 0, e.cote * .95 * b.envol);
    for(const a of b.mesh.userData.ailes) a.pivot.visible = b.envol > .5;
  }
  b.mesh.position.set(b.x, b.y, b.z);
  if(f !== "mante" && f !== "cigale") b.mesh.rotation.y = -b.ang - Math.PI/2;
  const al = Math.max(0, b.alpha) * (p.bocal && !b.mesh.userData.lanterne && Math.sin(b.t * 2.5) < -.3 ? .35 : 1);   // la luciole d'Italie : seule sa lanterne clignote
  for(const m of b.mats) m.m.opacity = m.op * al;
}

/* ----- Attraper ----- */
let montre = null;                 // la bête attrapée, montrée au-dessus de la tête : {mesh, t}
export const attrapeEnCours = () => !!montre;
/* Le filet ou le bocal qu'on tient en main (demande de Yo : seulement ce qu'on tient) */
const filetDuSac = () => tenu("filet");
/* La bête la plus proche, à portée de filet */
function aPortee(){
  const p = player.position;
  const f = filetDuSac(), loin = INSECTE.portee + (f && OUTILS[f].plusLoin || 0);   // un filet en cuivre ou en bronze attrape de plus loin
  let mieux = null, md = Infinity;
  for(const b of betes){ if(b.etat !== "vit" || b.alpha < .5) continue; const d = Math.hypot(b.x - p.x, b.z - p.z);
    if(d < (INSECTES[b.k].bocal ? INSECTE.portee : loin) && d < md){ md = d; mieux = b; } }
  return mieux;
}
let coup = null;                   // le coup de filet en cours : {b, t, vise, k, fait, esquive}
function lancerCoup(b){
  if(coup || montre) return;
  const p = INSECTES[b.k], k = p.bocal ? tenu("bocal") : filetDuSac();
  if(!k) return;
  if(sacPlace(b.k) < 1){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve", 3200); return; }
  const dx = b.x - player.position.x, dz = b.z - player.position.z, l = Math.hypot(dx, dz) || 1;
  placePlayer(player.position.x, player.position.z, dx / l, dz / l);           // on se tourne vers elle
  coup = {b, t: 0, vise: {x: b.x, y: b.y, z: b.z}, k, fait: false,
    esquive: !b.essai && Math.random() < COUP.esquive[p.rarete] + COUP.mefiance * b.mefiance};
  gesteOutil(k);                                      // à la première personne, la main balaie (mains.js)
  if(coup.esquive){ b.cible = null; b.pause = 0; }    // elle a vu le filet : elle bouge
}
function finirCoup(){
  const {b, vise, k, esquive} = coup;
  if(b.etat !== "vit" || !betes.includes(b)) return;
  const zone = COUP.zone + (OUTILS[k].plusLoin || 0) * .3;                   // un filet en cuivre ou en bronze couvre plus large
  if(!esquive && Math.hypot(b.x - vise.x, b.y - vise.y, b.z - vise.z) < zone) attraper(b, k);
  else rater(b);
}
/* Ratée : une commune ou peu commune se pose un peu plus loin, plus méfiante ; une rare, ou ratée trois fois, s'en va */
function rater(b){
  const p = INSECTES[b.k], e = p.une ? "e" : "";
  b.mefiance++;
  const pourDeBon = () => { fuir(b); toast(`💨 Raté ! ${leNom(b.k, true)} s'est envolé${e} pour de bon`, 3000); };
  if(p.rarete === "rare" || b.mefiance >= 3 || !seReposer(b)) return pourDeBon();
  toast(`💨 Raté ! ${leNom(b.k, true)} s'est posé${e} un peu plus loin, plus méfiant${e}`, 3000);
}
/* Elle va se poser un peu plus loin : une place de sa sorte, à COUP.loin du personnage (rend faux s'il n'y en a pas) */
function seReposer(b){
  const P = player.position, [a, z] = COUP.loin;
  const pl = INSECTES[b.k].ou.flatMap(o => places(o)).filter(q => { const d = Math.hypot(q.x - P.x, q.z - P.z);
    return d > a && d < z && !betes.some(o => o !== b && Math.hypot(o.base.x - q.x, o.base.z - q.z) < .8); });
  if(!pl.length) return false;
  b.etat = "vole"; b.vol = {t: 0, x0: b.x, y0: b.y, z0: b.z, q: pl[Math.floor(Math.random() * pl.length)]};
  return true;
}
function attraper(b, k){
  const p = INSECTES[b.k];                            // la luciole et le frelon : au bocal (étape 1.11, morceau 3)
  if(sacPlace(b.k) < 1){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve", 3200); return; }
  sacAdd(b.k, 1);
  const c = state.carnet.insectes, e = c[b.k] || (c[b.k] = {n: 0});
  const nouveau = !e.n; e.n++;
  save();
  retirer(b);
  montre = {mesh: modele(b.k), t: 0}; montre.mesh.scale.multiplyScalar(1.8); sceneIci().add(montre.mesh);
  toast(`${p.emoji} ${p.rarete === "rare" ? "✨ " : ""}Tu as attrapé ${leNom(b.k)} !${nouveau ? " Nouveau pour ton carnet," : ""} dans ton sac`, 3000);
  user(k);                                            // une prise use le filet ou le bocal (usure.js)
}
/* Le bouton d'action pour la bête à portée (recolte.js l'affiche, avant le reste) */
export function insecteAction(){
  if(montre || coup) return {label: "🥅 …", run: () => {}};
  if(!filetDuSac() && !tenu("bocal")) return null;          // sans filet ni bocal en main, on ne prend pas la place des autres actions
  const b = aPortee();
  if(!b) return null;
  const p = INSECTES[b.k], bocal = p.bocal && tenu("bocal");
  const nom = `${p.emoji || "🦋"} ${p.nom}`;              // le bouton dit son nom (demande de Yo, 13 octobre 2026)
  if(p.bocal && !bocal) return {label: `🫙 ${p.nom} : elle se prend au bocal`, nom, run: () => {}};   // au joueur de prendre le bocal
  if(!p.bocal && !filetDuSac()) return null;
  return {label: `${bocal ? "🫙" : "🥅"} Attraper : ${INSECTES[b.k].nom.toLowerCase()}`, nom, run: () => { if(b.etat === "vit" && betes.includes(b)) lancerCoup(b); }};
}

/* À chaque image (recolte.js) ; ou : le milieu, « ile » ou « foret » (null dans un bâtiment ou la mine) */
let ponte = 0, enPause = false;
/* Pour la vérification automatique : plus de nouvelles bêtes, et celles qui sont là s'en vont (pour qu'un papillon
   de passage ne prenne pas la place du bouton qu'on essaie) */
export function pauseInsectes(oui){ enPause = oui; if(oui) for(const b of [...betes]) retirer(b); }
export function updateInsectes(dt, actif, ou){
  changer(ou);
  groupe.visible = !!ou;
  if(coup){                                           // le coup de filet : la main s'abat, puis revient
    coup.t += dt;
    if(!montre) pencheMain(coup.t < COUP.touche ? .35 + 1.4 * coup.t / COUP.touche : 1.75 - 1.4 * Math.min(1, (coup.t - COUP.touche) / (COUP.duree - COUP.touche)));
    if(!coup.fait && coup.t >= COUP.touche){ coup.fait = true; finirCoup(); }
    if(coup.t >= COUP.duree){ coup = null; if(!montre) pencheMain(); }
  }
  if(montre){
    montre.t += dt; const u = Math.min(1, montre.t / .25);
    pencheMain(montre.t < .2 ? .35 + 1.2 * montre.t / .2 : .35);
    montre.mesh.position.set(player.position.x, .9 + .55 * u, player.position.z + .05);
    montre.mesh.rotation.y = montre.t * 2;
    if(montre.t > 1.7){ montre.mesh.parent.remove(montre.mesh); montre = null; pencheMain(); }
  }
  if(!ou) return;
  const p = player.position, vite = allure() > ALLURE_DOUCE;
  for(const b of [...betes]){
    const d = Math.hypot(b.x - p.x, b.z - p.z);
    if(d > INSECTE.rayon + 4){ retirer(b); continue; }
    if(vite && d < PEUR[INSECTES[b.k].forme] * (1 + .35 * b.mefiance)) fuir(b, true);   // méfiante, elle fuit de plus loin
    else if(b.etat === "vit" && !b.essai){                                              // un oiseau tout près : elle s'enfuit
      const o = oiseauxIci().find(o => o.alpha > .3 && o.etat !== "part" && Math.hypot(o.x - b.x, o.z - b.z) < PEUR_OISEAU && Math.abs(o.y - b.y) < 1.5);
      if(o) fuir(b, false, o);
    }
    vivre(b, dt);
  }
  ponte -= dt;
  if(enPause) return;
  if(ponte <= 0){ ponte = 1.5; if(betes.filter(b => b.etat === "vit" || b.etat === "vole").length < maxIci()) pondre(); }
}
