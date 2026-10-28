/* ================= Les oiseaux (étape 1.7, morceau 2) =================
   Les oiseaux de l'île (OISEAUX, d'après le Grand Carnet) se posent au sol, dans les arbres, les haies, sur les
   toits, au bord de la mer (et sur le ponton), au bord de l'étang, selon la saison et l'heure. Au plus OISEAU.max
   autour du personnage ; posés, ils sautillent, picorent, tournent la tête, et changent de place de temps en temps.
   Carnet : « s'approcher doucement d'un oiseau posé, puis lancer le filet. S'il s'envole, il revient souvent se
   poser un peu plus loin. » À pas de loup (allure sous ALLURE_DOUCE) ; trop vite à moins de OISEAU.peur, ou même
   doucement à moins de OISEAU.tropPres, il s'envole : le plus souvent, il se repose un peu plus loin.
   « 🥅 Lancer le filet » quand un oiseau posé est à moins de OISEAU.portee (avec un filet dans le sac).
   Un oiseau attrapé va dans le sac (vendu au comptoir, plus tard à la Maison des plumes) ; le carnet le garde
   (state.carnet.oiseaux = {k: {n}}).
   Morceau 4 : ceux de la Forêt profonde (zone « foret », carnet : « on les entend partout, on les voit rarement »)
   s'agrippent aux troncs, se posent dans les chênes, à la lisière, dans les vieux arbres, dans le feuillage. Le pic
   vert tambourine sur le tronc ; le coucou, farouche, s'envole de plus loin, et on l'entend chanter.
   Étape 1.13, morceau 5 : ceux du Marais brumeux (zone « marais ») : le canard colvert posé sur l'eau, près du bord (il
   barbote, la tête sous l'eau) ; dans les roseaux, le butor étoilé (figé, le bec vers le ciel) et la grue cendrée (elle
   danse) ; sur les arbres morts, par brouillard, le corbeau des brumes, qui répète des mots entendus ailleurs. */
import { scene } from "./monde/scene.js";
import { interior } from "./monde/interieurs.js";
import { foret, foretObj, arbreEn, W as WF } from "./monde/foret.js";
import { G, part } from "./monde/formes.js";
import { OISEAUX, OU_OISEAU, HEURES, PECHE, OUTILS, B } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace, sizeOf, porte } from "./regles.js";
import { map, idx, inb, H, tileOf, centerOf, growth, lieuEau } from "./monde/ile.js";
import { traversable } from "./donnees.js";
import { occ, toitDe } from "./monde/batiments.js";
import { ARBRES } from "./monde/essences.js";
import { pontonCases, eauLibre } from "./monde/ponton.js";
import { player, pencheMain, allure, ALLURE_DOUCE } from "./monde/personnage.js";
import { saisonDe } from "./peche.js";
import { brouillard } from "./monde/meteo.js";
import { marais, maraisObj, plante, mcx, mcz, W as WM, CHICOTS } from "./monde/marais.js";
import { toast } from "./interface.js";
import { tenu } from "./barre.js";
import { MODELES_OISEAUX } from "./monde/oiseaux3d.js";
import { user } from "./usure.js";

/* Combien, où, combien de temps, la peur (à régler en jouant) */
export const OISEAU = {max: 4, rayon: 10, vie: [60, 150], portee: 1.8, peur: 3.5, tropPres: .8, revient: .7};
/* Combien à la fois autour du personnage, selon la saison (Yo, 28 octobre 2026 : « Ça me va ») : 4 quand ils chantent et
   nichent, 3 en automne et en hiver ; DEBUT : tant que le carnet compte moins de 3 oiseaux attrapés, seuls les communs
   viennent (une nouvelle partie en montre tout de suite) */
export const OISEAUX_SAISON = {printemps: 4, ete: 4, automne: 3, hiver: 3}, DEBUT = 3;
const maxIci = () => OISEAUX_SAISON[saisonDe(new Date())] || OISEAU.max;
/* Ceux qui peuvent venir maintenant : au début d'une partie, les communs seulement (s'il y en a à cette heure) */
export function oiseauxAPondre(zone = "ile", d = new Date()){
  const ks = oiseauxPresents(zone, d), pris = Object.values(state.carnet.oiseaux).reduce((n, e) => n + (e.n || 0), 0);
  const communs = ks.filter(k => OISEAUX[k].rarete === "commun");
  return pris < DEBUT && communs.length ? communs : ks;
}

export function oiseauxPresents(zone = "ile", d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60;
  return Object.keys(OISEAUX).filter(k => { const p = OISEAUX[k];
    return (p.zone || "ile") === zone && p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b) && (!p.brouillard || brouillard()); });
}
const leNom = k => { const p = OISEAUX[k]; return `${p.une ? "une" : "un"} ${p.rarete === "rare" ? p.nom : p.nom.toLowerCase()}`; };

/* ----- Le modèle : formes simples, la tête vers -z ----- */
function modele(k, opt = {}){
  const fait = MODELES_OISEAUX[k];                    // refait d'après l'image de Yo (oiseaux3d.js) ; la saison (le bec du moineau mâle)
  if(fait){ const g = fait.fabrique(Object.assign({saison: saisonDe(new Date())}, opt)); g.scale.setScalar((OISEAUX[k].taille || 1) * fait.echelle); return g; }
  const p = OISEAUX[k], g = new THREE.Group(), ailes = [], c = p.couleur, ailesC = p.ailes !== undefined ? p.ailes : c;
  const aile = (x, y, z, w, h) => { const pivot = new THREE.Group(); pivot.position.set(x, y, z);
    pivot.add(part(G.head, ailesC, w, .12, h, Math.sign(x) * w * .2, 0, 0)); g.add(pivot); ailes.push({pivot, cote: Math.sign(x)}); };
  if(p.forme === "canard"){                                                                          // posé sur l'eau : un corps rond et bas
    g.add(part(G.head, c, 1.2, .7, 1.55, 0, .1, .04));
    g.add(part(G.head, p.poitrine, .8, .55, .6, 0, .12, -.2));
    g.add(part(G.head, p.tete, .62, .6, .62, 0, .33, -.26));                                        // la tête verte
    const collier = part(G.tore, 0xF4F4F0, .18, .18, .5, 0, .24, -.24); collier.rotation.x = Math.PI/2; g.add(collier);
    g.add(part(G.box, p.bec, .09, .035, .15, 0, .31, -.42));                                         // le bec plat
    for(const x of [-.07, .07]) g.add(part(G.eye, 0x1C1C1C, .9, .9, .9, x, .37, -.36));
    const queue = part(G.cone, 0x2A2A2A, .1, .12, .1, 0, .2, .4); queue.rotation.x = -1.2; g.add(queue);
    aile(-.15, .17, .05, .4, .95); aile(.15, .17, .05, .4, .95);
  } else if(p.forme === "echassier"){
    for(const x of [-.06, .06]) g.add(part(G.cyl, p.bec, .03, .5, .03, x, .25, .02));                  // les longues pattes
    g.add(part(G.head, c, .75, .6, 1.1, 0, .58, .04));                                                // le corps
    const cou = part(G.cyl, p.poitrine, .07, .4, .07, 0, .82, -.16); cou.rotation.x = .35; g.add(cou);
    g.add(part(G.head, p.tete, .42, .4, .45, 0, 1.02, -.24));
    if(p.calotte) g.add(part(G.head, p.calotte, .2, .1, .22, 0, 1.11, -.24));                          // la calotte rouge (la grue)
    const bec = part(G.cone, p.bec, .06, .32, .06, 0, p.becCiel ? 1.18 : 1.0, p.becCiel ? -.28 : -.42);
    bec.rotation.x = p.becCiel ? -.25 : -Math.PI/2; g.add(bec);                                       // le butor : le bec vers le ciel
    for(const x of [-.06, .06]) g.add(part(G.eye, 0x1C1C1C, 1, 1, 1, x, 1.05, -.3));
    aile(-.14, .62, .05, .5, 1); aile(.14, .62, .05, .5, 1);
  } else if(p.forme === "rapace"){
    g.add(part(G.head, c, 1.1, 1.15, 1, 0, .28, 0));                                                // un corps tout rond
    g.add(part(G.head, p.poitrine, .8, .9, .5, 0, .24, -.12));
    g.add(part(G.head, p.tete, 1, .85, .8, 0, .52, -.06));                                            // la tête, un grand visage clair
    for(const x of [-.07, .07]){
      if(p.yeux) g.add(part(G.eye, p.yeux, 2.6, 2.6, 2.6, x, .55, -.225));                            // de grands yeux orange (le hibou)
      g.add(part(G.eye, 0x1C1C1C, 1.6, 1.6, 1.6, x, .55, -.24));
    }
    const bec = part(G.cone, p.bec, .05, .08, .05, 0, .5, -.25); bec.rotation.x = -Math.PI/2; g.add(bec);
    aile(-.2, .3, .02, .45, .9); aile(.2, .3, .02, .45, .9);
  } else {                                                                                            // passereau
    for(const x of [-.04, .04]) g.add(part(G.cyl, 0x8A6A4A, .015, .1, .015, x, .05, .01));
    g.add(part(G.head, c, .6, .55, .9, 0, .18, .02));
    g.add(part(G.head, p.poitrine, .48, .42, .5, 0, .15, -.07));
    g.add(part(G.head, p.tete, .48, .46, .48, 0, .3, -.15));
    const bec = part(G.cone, p.bec, .04, .09, .04, 0, .29, -.27); bec.rotation.x = -Math.PI/2; g.add(bec);
    for(const x of [-.06, .06]) g.add(part(G.eye, 0x1C1C1C, .9, .9, .9, x, .32, -.24));
    const queue = part(G.box, c, .1, .02, .16 * (p.queue || 1), 0, .2, .2 + .04 * (p.queue || 1)); queue.rotation.x = -.35; g.add(queue);
    aile(-.12, .2, .02, .35, .7); aile(.12, .2, .02, .35, .7);
  }
  g.scale.setScalar((p.taille || 1) * 1.15);
  g.userData.ailes = ailes;
  return g;
}

/* ----- Où se poser, près du personnage ----- */
/* Dans la Forêt profonde : au bord du feuillage de chaque essence ([écart au centre, hauteur], avant sa taille) */
const CANOPEE = {charme: [.9, 2.3], frene: [.8, 2.6], if: [.85, 1.3], chene: [1.3, 2.3], sureau: [.8, 1.4], houx: [.65, 1]};
function placesForet(ou){
  const R = OISEAU.rayon, p = player.position, out = [], x0 = Math.floor(p.x + WF/2), z0 = Math.floor(p.z + WF/2);
  const ouvert = (x, z) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => { const a = x + dx, b = z + dz, j = b * WF + a;
    return a >= 0 && b >= 0 && a < WF && b < WF && (foret.type[j] === "herbe" || foret.type[j] === "sentier") && !foretObj(j); });
  for(let z = z0 - R; z <= z0 + R; z++) for(let x = x0 - R; x <= x0 + R; x++){
    if(x < 0 || z < 0 || x >= WF || z >= WF || Math.hypot(x - x0, z - z0) < 2.5) continue;
    const i = z * WF + x, o = foretObj(i);
    if(!o || !CANOPEE[o]) continue;
    const e = arbreEn(i), [r, y] = CANOPEE[o], a = Math.random() * 6.28;
    const cime = {x: e.x + Math.cos(a) * r * e.s, y: y * e.s, z: e.z + Math.sin(a) * r * e.s, perche: true};
    if(ou === "troncs" && ARBRES.has(o)){                 // agrippé au tronc, tourné vers lui
      const rt = (o === "chene" ? .375 : .16) * e.s + .1;
      out.push({x: e.x + Math.cos(a) * rt, y: .8 + Math.random() * .5, z: e.z + Math.sin(a) * rt, perche: true, face: a + Math.PI});
    }
    else if(ou === "chenes" && o === "chene" || ou === "vieuxArbres" && (o === "chene" || o === "if")
      || ou === "feuillage" && ARBRES.has(o) || ou === "lisiere" && ouvert(x, z)) out.push(cime);
  }
  return out;
}
/* Au Marais brumeux (étape 1.13, morceau 5) : sur l'eau près d'un bord, dans les roseaux au bord des îlots, sur les arbres morts */
function placesMarais(ou){
  const R = OISEAU.rayon, p = player.position, out = [], x0 = Math.floor(p.x + WM/2), z0 = Math.floor(p.z + WM/2), T = marais.type;
  if(ou === "arbresMorts"){
    for(const i of CHICOTS) if(Math.hypot(mcx(i) - p.x, mcz(i) - p.z) < R) out.push({x: mcx(i) + .12, y: 2.2, z: mcz(i), perche: true});
    return out;
  }
  const voisin = (x, z, f) => [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => x + a >= 0 && z + b >= 0 && x + a < WM && z + b < WM && f(T[(z + b) * WM + x + a]));
  for(let z = z0 - R; z <= z0 + R; z++) for(let x = x0 - R; x <= x0 + R; x++){
    if(x < 0 || z < 0 || x >= WM || z >= WM || Math.hypot(x - x0, z - z0) < 2.5) continue;
    const i = z * WM + x, o = maraisObj(i);
    if(ou === "eauxCalmes" && T[i] === "eau" && !o && voisin(x, z, t => t !== "eau")) out.push({x: mcx(i), y: -.18, z: mcz(i)});
    else if(ou === "roseaux" && T[i] === "terre" && (!o || plante(o)) && voisin(x, z, t => t === "eau")) out.push({x: mcx(i), y: 0, z: mcz(i)});
  }
  return out;
}
function places(ou){
  if(ici === "foret") return placesForet(ou);
  if(ici === "marais") return placesMarais(ou);
  const R = OISEAU.rayon, pp = player.position, px = tileOf(pp.x), pz = tileOf(pp.z), out = [];
  if(ou === "toits"){
    for(const b of state.buildings){
      if(B[b.type].fixe) continue;
      const s = sizeOf(b.type), x = b.x - H + s/2, z = b.z - H + s/2;
      if(Math.hypot(x - pp.x, z - pp.z) < R) out.push({x: x + (Math.random() - .5) * .8, y: toitDe(b), z: z + (Math.random() - .5) * .5, perche: true});
    }
    return out;
  }
  const bord = (x, z, test) => [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => inb(x + dx, z + dz) && test(idx(x + dx, z + dz)));
  for(let z = pz - R; z <= pz + R; z++) for(let x = px - R; x <= px + R; x++){
    if(!inb(x, z) || Math.hypot(x - px, z - pz) < 2.5) continue;
    const i = idx(x, z), o = map.obj[i], cx = centerOf(x), cz = centerOf(z), a = Math.random() * 6.28;
    const solLibre = map.type[i] !== "water" && traversable(o) && !occ.has(i);
    if(ou === "sol" && map.type[i] === "grass" && solLibre) out.push({x: cx, y: 0, z: cz});
    else if(ou === "arbres" && ARBRES.has(o) && growth(i) >= 1) out.push({x: cx + Math.cos(a) * .75, y: 2.25, z: cz + Math.sin(a) * .75, perche: true});
    else if(ou === "buissons" && o === "buisson" && growth(i) >= 1) out.push({x: cx, y: 1.08, z: cz, perche: true});   // sur le dessus du groseillier
    else if(ou === "plage" && (map.type[i] === "sand" && solLibre && bord(x, z, j => eauLibre(j) && lieuEau(j) === "mer") || pontonCases.has(i))) out.push({x: cx, y: 0, z: cz});
    else if(ou === "etang" && solLibre && bord(x, z, j => map.type[j] === "water" && lieuEau(j) === "etang")) out.push({x: cx, y: 0, z: cz});
  }
  return out;
}

/* ----- Les oiseaux autour du personnage ----- */
const oiseaux = [];                // {k, x, y, z, pl (sa place), t, age, vie, etat ("pose" | "vol" | "part"), alpha, mesh, mats, vol, prochain, ang}
const groupe = new THREE.Group(); scene.add(groupe);
/* Le milieu (morceau 4) : « ile » (dehors) ou « foret » (la scène des intérieurs) ; en changeant, les oiseaux s'en vont */
let ici = "ile";
const sceneIci = () => ici === "ile" ? scene : interior;
function changer(ou){
  if(!ou || ou === ici) return;
  for(const o of [...oiseaux]) retirer(o);
  ici = ou; sceneIci().add(groupe);
}
function ajouter(k, pl){
  const mesh = modele(k), mats = [];
  mesh.traverse(m => { if(m.material){ m.material = m.material.clone(); m.material.transparent = true; mats.push(m.material); m.material.opacity = 0; } });
  groupe.add(mesh);
  const o = {k, x: pl.x, y: pl.y, z: pl.z, pl, t: Math.random() * 10, age: 0, vie: OISEAU.vie[0] + Math.random() * (OISEAU.vie[1] - OISEAU.vie[0]),
    etat: "pose", alpha: 0, mesh, mats, vol: null, geste: 1 + Math.random() * 2, bouge: 15 + Math.random() * 20, ang: Math.random() * 6.28, saut: null, pique: 0};
  oiseaux.push(o);
  return o;
}
function retirer(o){ groupe.remove(o.mesh); oiseaux.splice(oiseaux.indexOf(o), 1); }
let chant = -1e9;
function pondre(){
  const ks = oiseauxAPondre(ici);
  if(!ks.length) return;
  for(let essai = 0; essai < 6; essai++){
    const par = {};
    ks.forEach(k => { const r = OISEAUX[k].rarete; (par[r] = par[r] || []).push(k); });
    const rangs = Object.keys(par);
    let x = Math.random() * rangs.reduce((n, r) => n + PECHE.poids[r], 0);
    const r = rangs.find(r => (x -= PECHE.poids[r]) < 0) || rangs[0];
    const k = par[r][Math.floor(Math.random() * par[r].length)], p = OISEAUX[k];
    const pl = places(p.ou[Math.floor(Math.random() * p.ou.length)]).filter(q => !oiseaux.some(o => Math.hypot(o.pl.x - q.x, o.pl.z - q.z) < 1.2));
    if(!pl.length) continue;
    const o = ajouter(k, pl[Math.floor(Math.random() * pl.length)]);
    /* il arrive en volant, de haut */
    o.vol = {x0: o.x + 3, y0: o.y + 3, z0: o.z - 2, t: 0, d: 1.4}; o.etat = "vol";
    /* le corbeau des brumes répète des mots entendus ailleurs (carnet) */
    if(p.mots && performance.now() - chant > 90000){ chant = performance.now();
      toast(`🐦 ${["« Bonjour ! »", "« Ferrer ! »", "« Coucou ! Coucou ! »", "« Couic ! »", "« Grrr… »", "« Planches ! »"][Math.floor(Math.random() * 6)]} … Un corbeau des brumes répète des mots entendus ailleurs, sur un arbre mort`, 3800); }
    /* le coucou : on l'entend avant de le voir (carnet) */
    if(p.farouche && performance.now() - chant > 90000){ chant = performance.now(); toast(`🎶 « Coucou ! Coucou ! » ${leNom(k)[0].toUpperCase() + leNom(k).slice(1)} chante, quelque part ${OU_OISEAU[p.ou[0]]}`, 3400); }
    return;
  }
}
/* Pour la vérification automatique : un oiseau posé à un endroit précis */
export function lacherOiseau(k, x, z, y = 0){ const o = ajouter(k, {x, y, z}); o.alpha = 1; return o; }
/* S'envoler vers une autre place (loin du personnage s'il fuit) ; pas de place : il s'en va */
function envoler(o, fuite, partir){
  const p = OISEAUX[o.k], pp = player.position;
  let cand = [];
  if(!fuite || Math.random() < OISEAU.revient)
    for(const ou of p.ou) cand.push(...places(ou).filter(q => { const d = Math.hypot(q.x - o.x, q.z - o.z), dp = Math.hypot(q.x - pp.x, q.z - pp.z);
      return d > 2 && d < 8 && (!fuite || dp > OISEAU.peur + .5) && !oiseaux.some(a => a !== o && Math.hypot(a.pl.x - q.x, a.pl.z - q.z) < 1.2); }));
  const pl = cand.length ? cand[Math.floor(Math.random() * cand.length)] : null;
  o.vol = {x0: o.x, y0: o.y, z0: o.z, t: 0, d: pl ? .6 + Math.hypot(pl.x - o.x, pl.z - o.z) / 4 : 1.2};
  o.etat = pl ? "vol" : "part";
  if(pl) o.pl = pl;
  else { const a = Math.atan2(o.z - pp.z, o.x - pp.x); o.pl = {x: o.x + Math.cos(a) * 6, y: o.y + 5, z: o.z + Math.sin(a) * 6}; }
  if(partir) o.etat = "part";
}
let conseil = -1e9;
function vivre(o, dt){
  o.t += dt; o.age += dt;
  let bat = false;
  if(o.etat === "plane"){                            // la mouette plane en larges cercles, les ailes immobiles, puis va se poser
    bat = true;
    const P = o.plane; P.t += dt; const a = P.a0 + P.t * P.w;
    o.x = P.cx + Math.cos(a) * P.r; o.z = P.cz + Math.sin(a) * P.r;
    o.y = P.y0 + (P.h - P.y0) * Math.min(1, P.t / 2) + Math.sin(P.t * .7) * .12;
    o.ang = a + Math.sign(P.w) * Math.PI / 2;
    o.alpha = Math.min(1, o.alpha + dt);
    if(P.t > P.d) envoler(o, false);
  } else if(o.etat === "vol" || o.etat === "part"){        // il vole vers sa place, en arc
    bat = true;
    const v = o.vol; v.t += dt; const u = Math.min(1, v.t / v.d);
    o.x = v.x0 + (o.pl.x - v.x0) * u; o.z = v.z0 + (o.pl.z - v.z0) * u;
    o.y = v.y0 + (o.pl.y - v.y0) * u + Math.sin(u * Math.PI) * (o.etat === "part" ? .5 : 1.2);
    o.ang = Math.atan2(o.pl.z - v.z0, o.pl.x - v.x0);
    if(o.etat === "part") o.alpha = Math.max(0, 1 - u);
    else o.alpha = Math.min(1, o.alpha + dt * 2);
    if(u >= 1){ if(o.etat === "part"){ retirer(o); return; } o.etat = "pose"; o.vol = null; o.y = o.pl.y; o.bouge = 15 + Math.random() * 20; o.pose = .5;   // posé : la queue relevée d'un coup
      if(o.pl.face !== undefined) o.ang = o.pl.face; }
  } else {                                            // posé : il sautille, picore, tourne la tête
    o.alpha = Math.min(1, o.alpha + dt);
    if(o.age > o.vie) envoler(o, true, true);
    if(o.saut){
      o.saut.t += dt; const u = Math.min(1, o.saut.t / (o.saut.d || .25));
      o.x = o.saut.x0 + (o.saut.x1 - o.saut.x0) * u; o.z = o.saut.z0 + (o.saut.z1 - o.saut.z0) * u; o.y = o.pl.y + Math.sin(u * Math.PI) * (o.saut.d ? .02 : .1);
      if(u >= 1){ o.saut = null;
        if(o.course > 0 && --o.course > 0){ const P = o.pas || {d: .11, l: .14};   // le merle court, la pie marche : un pas encore, tout droit
          o.saut = {t: 0, d: P.d, x0: o.x, z0: o.z, x1: o.x + Math.cos(o.ang) * P.l, z1: o.z + Math.sin(o.ang) * P.l}; } }
    } else if(o.pl.face !== undefined){               // agrippé au tronc : le pic vert tambourine
      if((o.geste -= dt) <= 0){ o.geste = OISEAUX[o.k].pic ? .18 + (Math.random() < .2 ? 1.5 : 0) : 1 + Math.random() * 2; o.pique = .16; }
    } else if((o.geste -= dt) <= 0){
      o.geste = 1 + Math.random() * 2.5;
      const r = Math.random();
      if(OISEAUX[o.k].marche && !o.pl.perche && r < .65){               // la pie : elle marche à grands pas en se dandinant, ou saute de côté
        if(r < .45){ const a = Math.atan2(o.pl.z - o.z, o.pl.x - o.x) + (Math.random() - .5) * 2.4; o.ang = a; o.course = 2 + Math.floor(Math.random() * 3);
          o.pas = {d: .28, l: .13}; o.saut = {t: 0, d: .28, x0: o.x, z0: o.z, x1: o.x + Math.cos(a) * .13, z1: o.z + Math.sin(a) * .13}; }
        else { const c = Math.random() < .5 ? 1 : -1, a = o.ang + c * Math.PI / 2;
          o.saut = {t: 0, x0: o.x, z0: o.z, x1: o.x + Math.cos(a) * .2, z1: o.z + Math.sin(a) * .2}; } }
      else if(OISEAUX[o.k].ecoute && !o.pl.perche && r < .8){                 // le merle : il court quelques pas, s'arrête net, penche la tête…
        if(r < .4){ const a = Math.atan2(o.pl.z - o.z, o.pl.x - o.x) + (Math.random() - .5) * 2.4; o.ang = a; o.course = 3 + Math.floor(Math.random() * 3); o.pas = null;
          o.saut = {t: 0, d: .11, x0: o.x, z0: o.z, x1: o.x + Math.cos(a) * .14, z1: o.z + Math.sin(a) * .14}; }
        else { o.penche = .9; o.geste = 2.2; } }
      else if(r < .35 && !o.pl.perche){ const a = Math.random() * 6.28; o.ang = a;
        o.saut = {t: 0, x0: o.x, z0: o.z, x1: o.pl.x + Math.cos(a) * .25, z1: o.pl.z + Math.sin(a) * .25}; }
      else if(r < .7){ o.pique = .4;
        if(o.pl.perche && OISEAUX[o.k].acrobate && Math.random() < .5) o.envers = 2 + Math.random() * 2; }   // la mésange se suspend la tête en bas pour picorer
      else if(o.mesh.userData.tete && Math.random() < .7) o.regard = Math.random() < .25 ? 0 : (Math.random() - .5) * 2;   // le moineau tourne la tête, d'un coup, puis ailleurs
      else o.ang += (Math.random() - .5) * 2;
    }
    if(o.pique > 0) o.pique = Math.max(0, o.pique - dt);
    if(o.penche > 0 && (o.penche -= dt) <= 0 && Math.random() < .6) o.tire = .8;   // … puis plonge le bec et tire un ver
    if(o.tire > 0) o.tire = Math.max(0, o.tire - dt);
    if(OISEAUX[o.k].danse){                           // la grue danse : de petits bonds, les ailes ouvertes
      if(!(o.danse > 0) && Math.random() < dt * .25) o.danse = 1.6;
      if(o.danse > 0){ o.danse -= dt; bat = true; o.y = o.pl.y + Math.abs(Math.sin(o.danse * 6)) * .3; o.ang += dt * 2; if(o.danse <= 0) o.y = o.pl.y; }
    }
    if((o.bouge -= dt) <= 0) envoler(o, false);       // de temps en temps, il change de place
    else if(OISEAUX[o.k].plane && Math.random() < dt * .05){            // la mouette s'élève et plane au-dessus de la mer et du ponton (Yo, 28 octobre 2026)
      const r = 1.4 + Math.random() * 1.2, a0 = Math.random() * 6.28;
      o.plane = {t: 0, r, a0, cx: o.x - Math.cos(a0) * r, cz: o.z - Math.sin(a0) * r, y0: o.y, h: o.pl.y + 2 + Math.random() * .8, w: (Math.random() < .5 ? -1 : 1) * .55, d: 6 + Math.random() * 6};
      o.etat = "plane"; o.saut = null; o.course = 0; }
  }
  /* le vol ondulé (la mésange) : quelques battements, puis les ailes fermées, en glissant un peu plus bas */
  const plie = bat && OISEAUX[o.k].ondule && (o.t * 2.2) % 1 > .55;
  for(const a of o.mesh.userData.ailes) a.pivot.rotation.z = a.cote * (bat && !plie ? Math.sin(o.t * 22) * .9 : .05);
  if(o.mesh.userData.grandesAiles){                   // la mouette : les grandes ailes ouvertes en vol, qui battent lentement, immobiles quand elle plane
    for(const m of o.mesh.userData.plies) m.visible = !bat;
    for(const a of o.mesh.userData.ailes) a.pivot.rotation.z = bat ? a.cote * (o.etat === "plane" ? .06 + Math.sin(o.t * 1.3) * .04 : Math.sin(o.t * 7) * .45) : a.cote * .05;
  }
  const tete = o.mesh.userData.tete;
  if(tete){ const r = bat ? 0 : o.regard || 0; tete.rotation.y += (r - tete.rotation.y) * Math.min(1, dt * 14);   // de petits coups de tête vifs
    tete.rotation.z += ((o.penche > 0 ? .55 : 0) - tete.rotation.z) * Math.min(1, dt * 10); }   // la tête penchée, à l'écoute de la terre
  const ver = o.mesh.userData.ver;
  if(ver) ver.visible = o.tire > 0 && o.tire < .55;
  o.mesh.position.set(o.x, o.y + (bat && OISEAUX[o.k].ondule ? Math.cos(o.t * 2.2 * Math.PI * 2) * .08 : 0), o.z);
  /* la tête en bas, accrochée à sa branche par les pieds, puis elle se remet droite */
  if(o.envers > 0 && (o.etat !== "pose" || (o.envers -= dt) <= 0)) o.envers = 0;
  o.inv = (o.inv || 0) + ((o.envers > 0 ? 1 : 0) - (o.inv || 0)) * Math.min(1, dt * 8);
  const pas = OISEAUX[o.k].marche && o.saut && o.saut.d ? Math.sin(o.saut.t / o.saut.d * Math.PI) : 0;   // la pie se dandine à chaque pas
  o.mesh.rotation.z = o.inv * Math.PI + pas * (o.course % 2 ? .12 : -.12) + (o.etat === "plane" ? -.3 * Math.sign(o.plane.w) : 0);   // penchée dans le virage
  const vol = o.mesh.userData.vol;
  if(vol) for(const m of vol) m.visible = bat;                          // le blanc des ailes, en vol seulement
  o.mesh.rotation.y = -o.ang - Math.PI/2;
  o.mesh.rotation.x = o.pique > 0 ? Math.sin(o.pique / (o.pl.face !== undefined ? .16 : .4) * Math.PI) * .5 : 0;
  if(o.tire > 0) o.mesh.rotation.x = o.tire > .55 ? Math.sin((.8 - o.tire) / .25 * Math.PI / 2) * .6 : .6 * o.tire / .55 - Math.sin((.55 - o.tire) / .55 * Math.PI) * .15;   // le bec dans la terre, puis il tire en arrière
  /* le rouge-gorge fait de petites courbettes en relevant la queue d'un coup, et l'agite par petits coups (Yo, 28 octobre
     2026 : « Les courbettes et les coups de queue, d'accord ») */
  const queue = o.mesh.userData.queue;
  if(queue){
    const cb = OISEAUX[o.k].courbette;                                    // les courbettes : le rouge-gorge
    if(cb && o.etat === "pose" && !(o.courbe > 0) && Math.random() < dt * .5) o.courbe = .45;
    if(cb && o.etat === "pose" && !(o.coup > 0) && Math.random() < dt * .9) o.coup = .18;
    if(o.pose > 0) o.pose = Math.max(0, o.pose - dt);
    const c = o.courbe > 0 ? Math.sin((1 - (o.courbe = Math.max(0, o.courbe - dt)) / .45) * Math.PI) : 0;
    const q = o.coup > 0 ? Math.sin((1 - (o.coup = Math.max(0, o.coup - dt)) / .18) * Math.PI) : 0;
    o.mesh.rotation.x += c * .3;                                         // il plonge un peu en avant…
    queue.rotation.x = -(c * .8 + q * .45 + (o.pose > 0 ? Math.sin(o.pose / .5 * Math.PI) * .9 : 0) + pas * .3);   // … et relève la queue (en se posant ; la pie à chaque pas)
  }
  const al = Math.max(0, o.alpha) * (OISEAUX[o.k].brume ? .78 : 1);   // le corbeau des brumes se fond dans la brume
  for(const m of o.mats) m.opacity = al;
}

/* ----- Lancer le filet ----- */
let montre = null;
export const oiseauEnCours = () => !!montre;
/* Le filet qu'on tient en main (demande de Yo : seulement ce qu'on tient) ; en cuivre ou en bronze, il attrape de plus loin */
const filetDuSac = () => tenu("filet");
function aPortee(){
  const p = player.position, f = filetDuSac();
  let mieux = null, md = OISEAU.portee + (f && OUTILS[f].plusLoin || 0);
  for(const o of oiseaux){ if(o.etat !== "pose" || o.alpha < .5) continue; const d = Math.hypot(o.x - p.x, o.z - p.z); if(d < md){ md = d; mieux = o; } }
  return mieux;
}
function lancerFilet(o){
  const k = filetDuSac();
  if(!k) return;
  if(sacPlace(o.k) < 1){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve", 3200); return; }
  sacAdd(o.k, 1);
  const c = state.carnet.oiseaux, e = c[o.k] || (c[o.k] = {n: 0});
  const nouveau = !e.n; e.n++;
  save();
  retirer(o);
  montre = {mesh: modele(o.k, {male: o.mesh.userData.male}), t: 0}; sceneIci().add(montre.mesh);   // le même (mâle ou femelle)
  const p = OISEAUX[o.k];
  toast(`${p.emoji} ${p.rarete === "rare" ? "✨ " : ""}Tu as attrapé ${leNom(o.k)} !${nouveau ? " Nouveau pour ton carnet," : ""} dans ton sac`, 3000);
  user(k);                                            // une prise use le filet (usure.js)
}
/* Le bouton d'action pour l'oiseau à portée (recolte.js), avec un filet dans le sac */
export function oiseauAction(){
  if(montre) return {label: "🥅 …", run: () => {}};
  if(!filetDuSac()) return null;
  const o = aPortee();
  if(!o) return null;
  return {label: `🥅 Lancer le filet : ${OISEAUX[o.k].nom.toLowerCase()}`, nom: `${OISEAUX[o.k].emoji || "🐦"} ${OISEAUX[o.k].nom}`,   // son nom (demande de Yo)
    run: () => { if(o.etat === "pose" && oiseaux.includes(o)) lancerFilet(o); }};
}

/* À chaque image (recolte.js) ; ou : le milieu, « ile » ou « foret » (null dans un bâtiment ou la mine) */
let ponte = 0, enPause = false;
/* Pour la vérification automatique : plus de nouveaux oiseaux, et ceux qui sont là s'en vont */
export const oiseauxIci = () => oiseaux;                    // les insectes s'en méfient (insectes.js)
export function pauseOiseaux(oui){ enPause = oui; if(oui) for(const o of [...oiseaux]) retirer(o); }
export function updateOiseaux(dt, actif, ou){
  changer(ou);
  groupe.visible = !!ou;
  if(montre){
    montre.t += dt; const u = Math.min(1, montre.t / .25);
    pencheMain(montre.t < .2 ? .35 + 1.2 * montre.t / .2 : .35);
    montre.mesh.position.set(player.position.x, .95 + .5 * u, player.position.z + .05);
    montre.mesh.rotation.y = montre.t * 2;
    if(montre.t > 1.7){ montre.mesh.parent.remove(montre.mesh); montre = null; pencheMain(); }
  }
  if(!ou) return;
  const p = player.position, vite = allure() > ALLURE_DOUCE, bouge = allure() > .05;
  for(const o of [...oiseaux]){
    const d = Math.hypot(o.x - p.x, o.z - p.z);
    if(d > OISEAU.rayon + 5){ retirer(o); continue; }
    const farouche = OISEAUX[o.k].farouche;           // le coucou s'envole de plus loin
    if(o.etat === "pose" && (vite && d < OISEAU.peur * (farouche ? 1.6 : 1) || bouge && d < (farouche ? 1.4 : OISEAU.tropPres))){
      envoler(o, true);
      if(vite && performance.now() - conseil > 45000){ conseil = performance.now();
        toast(`💨 ${leNom(o.k)[0].toUpperCase() + leNom(o.k).slice(1)} s'est envolé${OISEAUX[o.k].une ? "e" : ""} ! Approche à pas de loup, puis lance le filet d'un peu loin`, 3600); }
    }
    vivre(o, dt);
  }
  ponte -= dt;
  if(ponte <= 0){ ponte = 2.5; if(!enPause && oiseaux.filter(o => o.etat !== "part").length < maxIci()) pondre(); }
}
