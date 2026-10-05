/* ================= Les insectes (étape 1.7, morceau 1) =================
   Des petites bêtes vivent sur l'île, toute l'année, certaines seulement à leur saison (INSECTES, d'après le
   Grand Carnet revu avec Yo) : sur les fleurs (thym, buissons), dans les herbes hautes, sur les arbres, au sol,
   sous les pierres, au bord de l'étang, autour des lanternes la nuit. Au plus INSECTE.max autour du personnage ;
   chacune reste un moment puis s'en va.
   On les attrape au filet (du sac, pris en main tout seul) : « 🥅 Attraper » quand on est tout près.
   À pas de loup : en poussant le joystick doucement (allure sous ALLURE_DOUCE, ou Maj au clavier), on approche ;
   trop vite, elles s'enfuient. La luciole se prend au bocal (carnet), qui viendra plus tard.
   Une bête attrapée va dans le sac (vendue au comptoir, plus tard exposée à la Maison des ailes) ; le carnet la
   garde (state.carnet.insectes = {k: {n}}). */
import { scene } from "./monde/scene.js";
import { G, part } from "./monde/formes.js";
import { INSECTES, HEURES, PECHE, OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, thymLeft, lieuEau } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { lanternes } from "./monde/ponton.js";
import { player, pencheMain, allure, ALLURE_DOUCE } from "./monde/personnage.js";
import { saisonDe } from "./peche.js";
import { toast } from "./interface.js";
import { barreAuto, hold } from "./barre.js";

/* Combien, où, combien de temps (à régler en jouant) ; peur : à quelle distance une bête fuit qui nous voit arriver trop vite */
export const INSECTE = {max: 6, rayon: 9, vie: [50, 110], portee: 1.3};
const PEUR = {papillon: 2.6, libellule: 3, bourdon: 2.2, sauteur: 2.6, coleo: 1.8, fourmi: 1.6, cloporte: 1.6, araignee: 1.8, mante: 2, cigale: 2.4};
const VOLE = {papillon: true, libellule: true, bourdon: true};

/* ----- Qui vit ici et maintenant (vraie horloge du téléphone, hémisphère nord) ----- */
export function insectesPresents(d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60;
  return Object.keys(INSECTES).filter(k => { const p = INSECTES[k];
    return p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b); });
}
const leNom = (k, maj) => { const p = INSECTES[k], s = `${p.une ? "une" : "un"} ${p.rarete === "rare" ? p.nom : p.nom.toLowerCase()}`;
  return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Les modèles, en formes simples, à la taille d'un jouet ----- */
const mat = (c, o) => new THREE.MeshLambertMaterial(Object.assign({color: c}, o || {}));
function modele(k){
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
    const corps = part(G.cyl, c, .035, .36, .035, 0, 0, .06); corps.rotation.x = Math.PI/2; g.add(corps);
    g.add(part(G.head, c, .3, .3, .3, 0, 0, -.13));
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
  } else if(p.forme === "araignee"){
    g.add(part(G.head, c, .45, .4, .5, 0, .05, .04));
    g.add(part(G.head, c, .25, .22, .25, 0, .04, -.08));
    for(let n = 0; n < 8; n++){ const a = (n < 4 ? -1 : 1) * (.5 + (n % 4) * .35), pa = part(G.cyl, 0x3A2A1A, .012, .18, .012, Math.sign(a) * .08, .04, -.05 + (n % 4) * .045); pa.rotation.z = a; g.add(pa); }
  } else if(p.forme === "mante"){
    const corps = part(G.cyl, c, .04, .4, .04, 0, .12, 0); corps.rotation.x = .5; g.add(corps);
    g.add(part(G.head, c, .2, .2, .2, 0, .3, -.1));
    for(const x of [-.04, .04]){ const bras = part(G.cyl, c, .02, .14, .02, x, .22, -.13); bras.rotation.x = -.8; g.add(bras); }
  } else {                                            // cigale
    g.add(part(G.head, c, .4, .35, .6, 0, 0, 0));
    aile(.08, .2, .06, .04, 0xDDEFF7, .6); aile(.08, .2, -.06, .04, 0xDDEFF7, .6);
  }
  g.scale.setScalar((p.taille || 1) * 1.5);          // plus gros que nature, pour bien les voir (style jouet)
  g.userData.ailes = ailes;
  return g;
}

/* ----- Où elles vivent : une place près du personnage, selon l'endroit ----- */
function places(ou){
  const R = INSECTE.rayon, px = tileOf(player.position.x), pz = tileOf(player.position.z), out = [];
  if(ou === "lanternes"){
    for(const l of lanternes) if(Math.hypot(l.x - player.position.x, l.z - player.position.z) < R) out.push({x: l.x, y: l.y, z: l.z});
    return out;
  }
  for(let z = pz - R; z <= pz + R; z++) for(let x = px - R; x <= px + R; x++){
    if(!inb(x, z) || Math.hypot(x - px, z - pz) < 2) continue;
    const i = idx(x, z), o = map.obj[i], cx = centerOf(x), cz = centerOf(z), a = Math.random() * 6.28;
    if(ou === "fleurs" && (o === "thym" && !thymLeft(i) || o === "buisson") && growth(i) >= 1) out.push({x: cx, y: o === "thym" ? .35 : .65, z: cz});
    else if(ou === "herbes" && o === "herbe") out.push({x: cx, y: .15, z: cz});
    else if(ou === "arbres" && o === "tree" && growth(i) >= 1) out.push({x: cx + Math.cos(a) * .3, y: .45 + Math.random() * .5, z: cz + Math.sin(a) * .3, tronc: true});
    else if(ou === "sol" && map.type[i] === "grass" && !o && !occ.has(i)) out.push({x: cx, y: .03, z: cz});
    else if(ou === "pierres" && (o === "rock" || o === "rockCuivre")) out.push({x: cx + Math.cos(a) * .5, y: .03, z: cz + Math.sin(a) * .5});
    else if(ou === "etang" && map.type[i] === "water" && lieuEau(i) === "etang") out.push({x: cx, y: .45, z: cz});
  }
  return out;
}

/* ----- Les bêtes autour du personnage ----- */
const betes = [];                  // {k, x, y, z, base, t, vie, etat ("vit" | "fuit" | "part"), alpha, mesh, mats, cible, saut}
const groupe = new THREE.Group(); scene.add(groupe);
function ajouter(k, pl){
  const mesh = modele(k), mats = [];
  mesh.traverse(m => { if(m.material){ m.material = m.material.clone(); m.material.transparent = true; mats.push({m: m.material, op: m.material.opacity}); m.material.opacity = 0; } });
  mesh.position.set(pl.x, pl.y, pl.z);
  groupe.add(mesh);
  const b = {k, x: pl.x, y: pl.y, z: pl.z, base: pl, t: Math.random() * 10, vie: INSECTE.vie[0] + Math.random() * (INSECTE.vie[1] - INSECTE.vie[0]),
    age: 0, etat: "vit", alpha: 0, mesh, mats, cible: null, pause: Math.random() * 2, saut: null, ang: Math.random() * 6.28};
  betes.push(b);
  return b;
}
function retirer(b){ groupe.remove(b.mesh); betes.splice(betes.indexOf(b), 1); }
/* Une nouvelle bête : une rareté d'abord (comme les poissons), puis une espèce qui a une place ici */
function pondre(){
  const ks = insectesPresents();
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
    return;
  }
}
/* Pour la vérification automatique : une bête à un endroit précis */
export function lacherInsecte(k, x, z, y = .3){ const b = ajouter(k, {x, y, z}); b.alpha = 1; return b; }
let conseil = -1e9;
function fuir(b, vite){
  if(b.etat !== "vit") return;
  b.etat = "fuit"; b.ang = Math.atan2(b.z - player.position.z, b.x - player.position.x);
  if(vite && performance.now() - conseil > 45000){ conseil = performance.now();
    toast(`💨 Trop vite : ${leNom(b.k)} s'est enfui${INSECTES[b.k].une ? "e" : ""} ! Approche à pas de loup, en poussant le joystick doucement`, 3600); }
}
/* Ce que fait chacune, à chaque image */
function vivre(b, dt){
  b.t += dt; b.age += dt;
  const p = INSECTES[b.k], f = p.forme, base = b.base;
  if(b.etat === "fuit"){
    b.alpha -= dt / .6;
    if(VOLE[f] || f === "sauteur"){ b.x += Math.cos(b.ang) * 3 * dt; b.z += Math.sin(b.ang) * 3 * dt; b.y += 1.4 * dt; }
    if(b.alpha <= 0){ retirer(b); return; }
  } else if(b.etat === "part"){
    b.alpha -= dt; if(VOLE[f]) b.y += .5 * dt;
    if(b.alpha <= 0){ retirer(b); return; }
  } else {
    b.alpha = Math.min(1, b.alpha + dt);
    if(b.age > b.vie) b.etat = "part";
    if(p.ou[0] === "lanternes" && base.y > .5){       // les papillons de nuit tournent autour de la lumière
      b.x = base.x + Math.cos(b.t * 2.2) * .35; b.z = base.z + Math.sin(b.t * 2.2) * .35; b.y = base.y + Math.sin(b.t * 3.1) * .12;
      b.ang = b.t * 2.2 + Math.PI/2;
    } else if(f === "papillon"){                      // il volette autour de sa fleur
      const nx = base.x + Math.sin(b.t * .8) * .6 + Math.sin(b.t * 2.1) * .15, nz = base.z + Math.cos(b.t * .6) * .6;
      b.ang = Math.atan2(nz - b.z, nx - b.x); b.x = nx; b.z = nz; b.y = base.y + .35 + Math.sin(b.t * 2.4) * .15;
    } else if(f === "bourdon"){                       // petites boucles autour des fleurs
      const nx = base.x + Math.cos(b.t * 2.6) * .35, nz = base.z + Math.sin(b.t * 3.3) * .3;
      b.ang = Math.atan2(nz - b.z, nx - b.x); b.x = nx; b.z = nz; b.y = base.y + .15 + Math.sin(b.t * 5) * .06;
    } else if(f === "libellule"){                     // elle file d'un point à l'autre, puis fait du sur-place
      if(b.pause > 0) b.pause -= dt;
      else {
        if(!b.cible){ const a = Math.random() * 6.28, r = Math.random() * 1.2; b.cible = {x: base.x + Math.cos(a) * r, z: base.z + Math.sin(a) * r}; }
        const dx = b.cible.x - b.x, dz = b.cible.z - b.z, d = Math.hypot(dx, dz);
        if(d < .05){ b.cible = null; b.pause = .6 + Math.random() * 1.5; }
        else { const v = Math.min(d, 2.4 * dt); b.x += dx / d * v; b.z += dz / d * v; b.ang = Math.atan2(dz, dx); }
      }
      b.y = base.y + Math.sin(b.t * 6) * .03;
    } else if(f === "sauteur"){                       // posé dans l'herbe, il fait un bond de temps en temps
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
  const vite = VOLE[f] ? (f === "papillon" ? 9 : 28) : 0;
  for(const a of b.mesh.userData.ailes) a.pivot.rotation.z = a.cote * (vite ? Math.sin(b.t * vite) * .7 : .1);
  b.mesh.position.set(b.x, b.y, b.z);
  if(f !== "mante" && f !== "cigale") b.mesh.rotation.y = -b.ang - Math.PI/2;
  const al = Math.max(0, b.alpha) * (p.bocal && Math.sin(b.t * 2.5) < -.3 ? .35 : 1);
  for(const m of b.mats) m.m.opacity = m.op * al;
}

/* ----- Attraper ----- */
let montre = null;                 // la bête attrapée, montrée au-dessus de la tête : {mesh, t}
export const attrapeEnCours = () => !!montre;
const filetDuSac = () => state.sac.some(it => OUTILS[it.k] && OUTILS[it.k].famille === "filet") ? state.sac.find(it => OUTILS[it.k] && OUTILS[it.k].famille === "filet").k : null;
/* La bête la plus proche, à portée de filet */
function aPortee(){
  const p = player.position;
  let mieux = null, md = INSECTE.portee;
  for(const b of betes){ if(b.etat !== "vit" || b.alpha < .5) continue; const d = Math.hypot(b.x - p.x, b.z - p.z); if(d < md){ md = d; mieux = b; } }
  return mieux;
}
function attraper(b){
  const p = INSECTES[b.k];
  if(p.bocal){ toast(`🫙 ${leNom(b.k, true)} se prend au bocal, pas au filet (le bocal viendra avec la Forge)`, 3200); return; }
  const k = filetDuSac();
  if(!k){ toast("🥅 Il te faut un filet : fabrique-le à l'établi de la Scierie (2 planches, 4 fibres)", 3200); return; }
  if(state.main !== k){ barreAuto(k); hold(k); }
  if(sacPlace(b.k) < 1){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve", 3200); return; }
  sacAdd(b.k, 1);
  const c = state.carnet.insectes, e = c[b.k] || (c[b.k] = {n: 0});
  const nouveau = !e.n; e.n++;
  save();
  retirer(b);
  montre = {mesh: modele(b.k), t: 0}; montre.mesh.scale.multiplyScalar(1.8); scene.add(montre.mesh);
  toast(`${p.emoji} ${p.rarete === "rare" ? "✨ " : ""}Tu as attrapé ${leNom(b.k)} !${nouveau ? " Nouveau pour ton carnet," : ""} dans ton sac`, 3000);
}
/* Le bouton d'action pour la bête à portée (recolte.js l'affiche, avant le reste) */
export function insecteAction(){
  if(montre) return {label: "🥅 …", run: () => {}};
  const b = aPortee();
  if(!b) return null;
  return {label: `🥅 Attraper : ${INSECTES[b.k].nom.toLowerCase()}`, run: () => { if(b.etat === "vit" && betes.includes(b)) attraper(b); }};
}

/* À chaque image (recolte.js) ; dehors : sur l'île */
let ponte = 0;
export function updateInsectes(dt, actif, dehors){
  groupe.visible = dehors;
  if(montre){
    montre.t += dt; const u = Math.min(1, montre.t / .25);
    pencheMain(montre.t < .2 ? .35 + 1.2 * montre.t / .2 : .35);
    montre.mesh.position.set(player.position.x, .9 + .55 * u, player.position.z + .05);
    montre.mesh.rotation.y = montre.t * 2;
    if(montre.t > 1.7){ scene.remove(montre.mesh); montre = null; pencheMain(); }
  }
  if(!dehors) return;
  const p = player.position, vite = allure() > ALLURE_DOUCE;
  for(const b of [...betes]){
    const d = Math.hypot(b.x - p.x, b.z - p.z);
    if(d > INSECTE.rayon + 4){ retirer(b); continue; }
    if(vite && d < PEUR[INSECTES[b.k].forme]) fuir(b, true);
    vivre(b, dt);
  }
  ponte -= dt;
  if(ponte <= 0){ ponte = 1.5; if(betes.filter(b => b.etat === "vit").length < INSECTE.max) pondre(); }
}
