/* ================= La chasse (étape 1.7, morceau 5) =================
   Grand Carnet, « Le gibier » : « suivre les traces (empreintes, branches cassées), s'approcher sans bruit et sous
   le vent, puis tirer à l'arc. » Le gibier vit dans la Forêt profonde (sur l'île, les animaux sont en paix, décidé
   par Yo) : chaque espèce à son endroit, à sa saison et à son heure (GIBIER). Au plus CHASSE.max autour du
   personnage, apparus hors de vue, avec leurs empreintes au sol qui mènent à eux.
   Le vent (décidé avec Yo) : il tourne lentement ; des feuilles volent dans son sens, et une flèche en haut de
   l'écran le montre. Une bête sent le personnage s'il est dans son vent (le vent va du personnage vers elle) à
   moins de CHASSE.flair ; elle l'entend s'il va trop vite à moins de CHASSE.ouie ; elle le voit tout près
   (CHASSE.vue) même à pas de loup. « 🏹 Tirer » (l'arc et les flèches du sac) quand elle est à portée : plus près,
   plus sûr (sûr jusqu'à CHASSE.sur, puis de moins en moins jusqu'à CHASSE.portee). Touchée : sa viande et sa peau
   dans le sac, la flèche reprise, son trophée au carnet (state.carnet.gibier = {k: {n}}). Ratée : elle s'enfuit
   et la flèche est perdue.
   Le sanglier (étape 1.8, morceau 3 ; carnet : « charge s'il est blessé ») : touché, il ne tombe pas, il se
   retourne et charge (il devient un monstre : enrager, dans monstres.js ; on le finit à l'épée).
   Le Cerf blanc (légendaire, les nuits de pleine lune, au cœur de la forêt) ne se chasse pas : on le suit sans
   courir ; au bout de son chemin, il laisse son bois d'argent, une seule fois dans tout le jeu (state.cerfBlanc). */
import { $ } from "./outils.js";
import { interior } from "./monde/interieurs.js";
import { G, part } from "./monde/formes.js";
import { GIBIER, HEURES, PECHE, OUTILS, MONSTRES, FLECHES, objet } from "./donnees.js";
import { modeleMonstre, enrager } from "./monstres.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacTake, sacCount, sacPlace, porte, tientSurSoi } from "./regles.js";
import { foret, foretObj, walk, W, CHEMIN_BLANC } from "./monde/foret.js";
import { ARBRES } from "./monde/essences.js";
import { player, placePlayer, allure, ALLURE_DOUCE, pencheMain } from "./monde/personnage.js";
import { saisonDe, pleineLune } from "./peche.js";
import { toast, renderHUD } from "./interface.js";
import { barreAuto, hold } from "./barre.js";
import { user } from "./usure.js";

/* Combien, où, à quelle distance ils sentent, entendent, voient ; la portée de l'arc (à régler en jouant) */
export const CHASSE = {max: 2, de: 8, a: 14, rayon: 20, flair: 9, ouie: 6, vue: 2.2, portee: 7, sur: 3, ponte: 12};
const FUITE = {lapin: 4.5, oiseau: 3.4, renard: 4.2, cervide: 5, sanglier: 4};          // vitesse de fuite
const PAS = {lapin: 1.3, oiseau: .6, renard: .9, cervide: .7, sanglier: .7};             // vitesse de promenade
const ECHELLE = {lapin: .8, oiseau: .8, renard: .85, cervide: .8, sanglier: 1};
const nomDe = (k, n) => (n > 1 ? objet(k).pluriel || objet(k).nom : objet(k).nom).toLowerCase();
const leNom = (k, maj) => { const p = GIBIER[k], s = `${p.une ? "la" : "le"} ${k === "cerfBlanc" ? p.nom : p.nom.toLowerCase()}`; return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Qui vit ici et maintenant (vraie horloge du téléphone) ----- */
export function gibierPresent(d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60;
  return Object.keys(GIBIER).filter(k => { const p = GIBIER[k];
    return k !== "cerfBlanc" && p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b); });
}

/* ----- Le vent : il tourne lentement (un tour en une demi-heure, avec des sautes) ; {x, z} : où il va ----- */
export function vent(t = Date.now()){
  const a = (t / 1.8e6 % 1) * 6.2832 + Math.sin(t / 2.4e5) * .8;
  return {x: Math.cos(a), z: Math.sin(a), a};
}

/* ----- Les modèles, en formes simples et rondes (style jouet), la tête vers -z ----- */
function modele(k){
  if(GIBIER[k].forme === "sanglier") return modeleMonstre("sanglier");   // le même que dans la grotte
  const p = GIBIER[k], g = new THREE.Group(), c = p.couleur, c2 = p.c2, pattes = [], tete = new THREE.Group();
  const patte = (x, z, h, r, col) => { const piv = new THREE.Group(); piv.position.set(x, h, z); piv.add(part(G.cyl, col, r, h, r, 0, -h / 2, 0)); g.add(piv); pattes.push(piv); };
  const yeux = (y, z, e) => { for(const x of [-e, e]) tete.add(part(G.eye, 0x1C1C1C, 1.1, 1.1, 1.1, x, y, z)); };
  g.add(tete);
  if(p.forme === "lapin"){
    g.add(part(G.head, c, 1, .85, 1.25, 0, .2, .04));                                   // le corps, tout rond
    g.add(part(G.head, c2, .4, .4, .4, 0, .25, .33));                                   // la queue, un pompon blanc
    tete.position.set(0, .3, -.18);
    tete.add(part(G.head, c, .75, .7, .8, 0, 0, -.04));
    yeux(.03, -.2, .07);
    const L = p.longues ? .34 : .26;
    for(const x of [-.05, .05]){
      const o = part(G.cyl, c, .07, L, .035, x, .1 + L / 2, .03); o.rotation.z = x * 2.4; o.rotation.x = .25; tete.add(o);
      if(p.longues) tete.add(part(G.head, 0x2A2A2A, .2, .2, .14, x * 1.6, .1 + L - .02, .05));   // le bout noir des oreilles du lièvre
    }
    patte(-.08, -.12, .1, .07, c); patte(.08, -.12, .1, .07, c); patte(-.09, .12, .1, .09, c); patte(.09, .12, .1, .09, c);
  } else if(p.forme === "oiseau"){
    g.add(part(G.head, c, 1.1, .9, 1.4, 0, .26, .02));                                 // le corps
    const q = part(G.box, c2, .08, .03, .45 * p.queue, 0, .34, .25 + .2 * p.queue); q.rotation.x = -.4; g.add(q);   // la queue
    tete.position.set(0, .42, -.2);
    tete.add(part(G.head, p.tete, .55, .6, .55, 0, .04, -.04));
    if(k === "faisan") tete.add(part(G.head, 0xD8302A, .3, .3, .2, 0, .05, -.1));      // le masque rouge
    const bec = part(G.cone, 0xD8C8A0, .04, .08, .04, 0, .03, -.18); bec.rotation.x = -Math.PI / 2; tete.add(bec);
    yeux(.07, -.12, .06);
    patte(-.05, .02, .14, .02, 0x8A6A4A); patte(.05, .02, .14, .02, 0x8A6A4A);
  } else if(p.forme === "renard"){
    g.add(part(G.head, c, 1.1, .85, 1.9, 0, .32, .04));                                // le corps
    g.add(part(G.head, c2, .7, .5, .6, 0, .28, -.28));                                 // le poitrail blanc
    const queue = part(G.head, c, .55, .55, 1.5, 0, .36, .52); queue.rotation.x = .5; g.add(queue);
    g.add(part(G.head, c2, .38, .38, .5, 0, .45, .78));                                // le bout blanc de la queue
    tete.position.set(0, .44, -.38);
    tete.add(part(G.head, c, .8, .72, .8, 0, 0, 0));
    const museau = part(G.cone, c, .1, .18, .1, 0, -.03, -.2); museau.rotation.x = -Math.PI / 2; tete.add(museau);
    tete.add(part(G.head, 0x1C1C1C, .12, .12, .12, 0, -.03, -.29));                   // la truffe
    for(const x of [-.07, .07]) tete.add(part(G.cone, c, .08, .14, .05, x, .17, .02));  // les oreilles pointues
    yeux(.04, -.15, .07);
    for(const [x, z] of [[-.08, -.2], [.08, -.2], [-.08, .24], [.08, .24]]) patte(x, z, .2, .045, 0x3A2A22);
  } else {                                                                             // les cervidés
    g.add(part(G.head, c, 1.35, 1.05, 2.1, 0, .62, .04));                              // le corps
    g.add(part(G.head, c2, .7, .6, .3, 0, .64, .5));                                   // le miroir blanc
    const cou = part(G.cyl, c, .16, .4, .16, 0, .82, -.32); cou.rotation.x = -.5; g.add(cou);
    tete.position.set(0, .96, -.42);
    tete.add(part(G.head, c, .62, .62, .75, 0, .06, -.06));
    const museau = part(G.head, p.argent ? c : 0x5A3A2A, .35, .3, .4, 0, 0, -.2); tete.add(museau);
    for(const x of [-.09, .09]){ const o = part(G.head, c, .25, .12, .5, x * 1.5, .16, .04); o.rotation.z = x * 4; tete.add(o); }   // les oreilles
    yeux(.1, -.14, .08);
    /* les bois : un petit pour le chevreuil, de grands bois ramifiés pour le cerf (en argent pour le Cerf blanc) */
    const bc = p.argent ? 0xDDE4EC : 0xD8C8A8, grand = !!p.bois;
    for(const s of [-1, 1]){
      const tige = part(G.cyl, bc, .035, grand ? .45 : .2, .035, s * .06, grand ? .38 : .25, .02); tige.rotation.z = s * -.35; tete.add(tige);
      if(grand) for(const [y, r] of [[.3, .9], [.45, .6], [.55, -.2]]){ const b = part(G.cyl, bc, .025, .18, .025, s * (.08 + y * .3), y + .02, -.04); b.rotation.z = s * -r; b.rotation.x = -.4; tete.add(b); }
    }
    const lc = p.argent ? c : 0x5A3A2A;
    for(const [x, z] of [[-.13, -.32], [.13, -.32], [-.13, .36], [.13, .36]]) patte(x, z, .5, .055, lc);
  }
  g.scale.setScalar(ECHELLE[p.forme] * (p.taille || 1));
  g.userData = {pattes, tete};
  return g;
}

/* ----- Les places : les cases de la forêt où chaque espèce se promène ----- */
const at = (x, z) => x >= 0 && z >= 0 && x < W && z < W ? z * W + x : -1;
const libre = i => i >= 0 && foret.type[i] !== "eau" && !foretObj(i);
const ouvert = i => libre(i) && (foret.type[i] === "herbe" || foret.type[i] === "sentier");
const arbre = i => i >= 0 && ARBRES.has(foretObj(i));
const VOIS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function convient(ou, x, z){
  const i = at(x, z), t = libre(i) && foret.type[i];
  if(!t) return false;
  if(ou === "clairieres") return t === "herbe";
  if(ou === "grandesClairieres"){                       // de l'herbe, et rien de boisé à deux cases à la ronde
    if(t !== "herbe") return false;
    for(let b = -2; b <= 2; b++) for(let a = -2; a <= 2; a++) if(!ouvert(at(x + a, z + b))) return false;
    return true;
  }
  if(ou === "lisiere") return VOIS.some(([a, b]) => arbre(at(x + a, z + b))) && VOIS.some(([a, b]) => ouvert(at(x + a, z + b)));
  if(ou === "sousBois") return t === "mousse";
  return false;
}
const monde = (x, z) => ({x: x - W / 2 + .5, z: z - W / 2 + .5});

/* ----- Les bêtes, leurs empreintes, les feuilles du vent ----- */
const groupe = new THREE.Group(); interior.add(groupe); groupe.visible = false;
const betes = [];        // {k, x, y, z, ang, etat ("paisible" | "aguets" | "fuite" | "tombe"), t, alpha, mesh, mats, home, cible, pause, grp, pas, cote, v}
function ajouter(k, x, z, grp){
  const mesh = modele(k), mats = [];
  mesh.traverse(m => { if(m.material){ m.material = m.material.clone(); m.material.transparent = true; mats.push(m.material); m.material.opacity = 0;
    if(GIBIER[k].argent && m.material.emissive){ m.material.emissive.setHex(0x7A8AA0); m.material.emissiveIntensity = .7; } } });   // le Cerf blanc luit
  groupe.add(mesh);
  const a = {k, x, y: 0, z, ang: Math.random() * 6.28, etat: "paisible", t: 0, alpha: 0, mesh, mats, home: {x, z}, cible: null,
    pause: 1 + Math.random() * 3, grp, pas: 0, cote: 1, v: 0};
  betes.push(a);
  return a;
}
function retirer(a){ groupe.remove(a.mesh); a.mats.forEach(m => m.dispose()); betes.splice(betes.indexOf(a), 1); }

const empreintes = [];   // {mesh, mat, age}
const ROND = new THREE.CircleGeometry(.5, 8);
const TAILLE_PAS = {lapin: [.06, .09], oiseau: [.06, .07], renard: [.07, .08], cervide: [.07, .11], sanglier: [.08, .09]};
function empreinte(k, x, z, ang, age = 0){
  if(empreintes.length >= 160){ const e = empreintes.shift(); groupe.remove(e.mesh); e.mat.dispose(); }
  const p = GIBIER[k], [sx, sy] = TAILLE_PAS[p.forme], s = p.taille || 1;
  const mat = new THREE.MeshBasicMaterial({color: p.argent ? 0xC8D4E4 : 0x3A2A1A, transparent: true, opacity: 0, depthWrite: false});
  const m = new THREE.Mesh(ROND, mat);
  m.rotation.set(-Math.PI / 2, 0, -ang - Math.PI / 2); m.scale.set(sx * s, sy * s, 1); m.position.set(x, .012, z); m.renderOrder = 1;
  groupe.add(m); empreintes.push({mesh: m, mat, age});
}
/* Une bête qui avance : elle laisse des empreintes, à gauche puis à droite */
function avancer(a, x, z, ang){
  a.pas += Math.hypot(x - a.x, z - a.z); a.x = x; a.z = z; a.ang = ang;
  if(a.pas > .45){ a.pas = 0; a.cote = -a.cote; empreinte(a.k, x - Math.sin(ang) * .06 * a.cote, z + Math.cos(ang) * .06 * a.cote, ang); }
}
/* Les traces d'une bête qui vient d'arriver : d'où elle vient (à peu près du côté du personnage), les plus anciennes au bout */
function trace(k, x, z){
  const p = player.position, pts = [];
  let ang = Math.atan2(p.z - z, p.x - x) + (Math.random() - .5) * 1.6, cx = x, cz = z;
  for(let n = 0; n < 24 && pts.length < 16; n++){
    ang += (Math.random() - .5) * .7;
    const nx = cx + Math.cos(ang) * .5, nz = cz + Math.sin(ang) * .5;
    if(!walk(nx, nz)){ ang += Math.PI / 2 * (Math.random() < .5 ? 1 : -1); continue; }
    cx = nx; cz = nz; pts.push([cx, cz, ang]);
  }
  pts.forEach(([px, pz, a], n) => { const s = n % 2 ? .06 : -.06; empreinte(k, px - Math.sin(a) * s, pz + Math.cos(a) * s, a + Math.PI, n * 5); });
}

const feuilles = [];
{
  const geo = new THREE.PlaneGeometry(.14, .09);
  for(let n = 0; n < 12; n++){
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({color: [0xD8A040, 0xC8642A, 0x8AB84A, 0xE8C060][n % 4], side: THREE.DoubleSide}));
    groupe.add(m); feuilles.push({m, x: 0, y: 0, z: 0, ph: Math.random() * 6.28, vu: false});
  }
}
/* Les feuilles volent dans le sens du vent, autour du personnage ; celles qui sortent reviennent du côté d'où il vient */
function feuillesAuVent(dt){
  const w = vent(), p = player.position;
  for(const f of feuilles){
    if(!f.vu){ f.x = p.x + (Math.random() - .5) * 12; f.z = p.z + (Math.random() - .5) * 12; f.y = .4 + Math.random() * 2.2; f.vu = true; }
    else if(Math.abs(f.x - p.x) > 7 || Math.abs(f.z - p.z) > 7){
      const r = Math.random() - .5;
      f.x = p.x - w.x * 6.5 - w.z * r * 12; f.z = p.z - w.z * 6.5 + w.x * r * 12; f.y = .4 + Math.random() * 2.2;
    }
    f.ph += dt * 3;
    f.x += w.x * 1.6 * dt; f.z += w.z * 1.6 * dt; f.y += Math.sin(f.ph) * .35 * dt - .06 * dt;
    if(f.y < .2) f.y = 2.6;
    f.m.position.set(f.x, f.y, f.z); f.m.rotation.set(f.ph, f.ph * .7, 0);
  }
}

/* ----- Une nouvelle bête, hors de vue, à sa place, avec ses traces ----- */
let brame = -1e9;
function pondre(){
  const ks = gibierPresent();
  if(!ks.length) return;
  const par = {};
  ks.forEach(k => { const r = GIBIER[k].rarete; (par[r] = par[r] || []).push(k); });
  const rangs = Object.keys(par);
  let x0 = Math.random() * rangs.reduce((n, r) => n + PECHE.poids[r], 0);
  const r = rangs.find(r => (x0 -= PECHE.poids[r]) < 0) || rangs[0];
  const k = par[r][Math.floor(Math.random() * par[r].length)], p = GIBIER[k];
  const px = Math.floor(player.position.x + W / 2), pz = Math.floor(player.position.z + W / 2), cand = [];
  for(let z = pz - CHASSE.a; z <= pz + CHASSE.a; z++) for(let x = px - CHASSE.a; x <= px + CHASSE.a; x++){
    const d = Math.hypot(x - px, z - pz);
    if(d >= CHASSE.de && d <= CHASSE.a && convient(p.ou, x, z)) cand.push([x, z]);
  }
  if(!cand.length) return;
  const c = cand[Math.floor(Math.random() * cand.length)], {x, z} = monde(...c);
  const n = p.groupe ? 2 + (Math.random() < .5 ? 1 : 0) : 1, grp = n > 1 ? {} : null;
  for(let m = 0; m < n; m++){
    const a = Math.random() * 6.28, rr = m ? .6 + Math.random() * .5 : 0, bx = x + Math.cos(a) * rr, bz = z + Math.sin(a) * rr;
    if(!m || walk(bx, bz)) ajouter(k, bx, bz, grp);
  }
  trace(k, x, z);
  if(k === "cerf" && performance.now() - brame > 120000){ brame = performance.now(); toast("🦌 Un cerf brame, quelque part dans les grandes clairières…", 3200); }
}
/* Pour la vérification automatique : une bête à un endroit précis, qui ne bouge pas */
export function lacherGibier(k, x, z){ const a = ajouter(k, x, z, null); a.alpha = 1; a.pause = 99; return a; }

/* ----- Sentir, entendre, voir ; fuir ----- */
let conseil = -1e9;
function dire(a, pourquoi){
  if(pourquoi === "rate" || performance.now() - conseil < 40000) return;
  conseil = performance.now();
  const n = leNom(a.k, true), e = GIBIER[a.k].une ? "e" : "";
  toast(pourquoi === "flair" ? `👃 ${n} t'a senti${e} : le vent soufflait de toi vers ${e ? "elle" : "lui"}. Approche sous le vent : il doit venir de la bête vers toi (regarde la flèche du vent, en haut)`
    : pourquoi === "bruit" ? `💨 ${n} t'a entendu${e} : approche à pas de loup, en poussant le joystick doucement`
    : `👀 ${n} t'a vu${e}, de trop près : tire d'un peu plus loin`, 4400);
}
function fuir(a, pourquoi){
  if(a.etat === "fuite" || a.etat === "tombe") return;
  a.etat = "fuite"; a.t = 0; a.ang = Math.atan2(a.z - player.position.z, a.x - player.position.x);
  if(a.k === "chevreuil") toast("🦌 Le chevreuil aboie, puis s'enfuit !", 2200);
  else if(a.k === "faisan") toast("🐦 Le faisan s'envole bruyamment !", 2000);
  dire(a, pourquoi);
}
function alerte(a, pourquoi){
  if(a.k === "lievre" && pourquoi === "bruit" && a.etat === "paisible"){ a.etat = "aguets"; a.aguets = 1.5; return; }   // il s'arrête pour écouter
  for(const b of a.grp ? betes.filter(b => b.grp === a.grp) : [a]) fuir(b, pourquoi);                                   // les perdrix filent ensemble
}

/* ----- Ce que fait chaque bête, à chaque image ----- */
function vivre(a, dt){
  a.t += dt;
  const p = GIBIER[a.k], u = a.mesh.userData;
  let bouge = false, broute = false;
  if(a.etat === "tombe"){
    a.mesh.rotation.z = Math.min(1, a.t / .4) * Math.PI / 2;
    if(a.t > 1.2) a.alpha -= dt / .8;
    if(a.alpha <= 0){ retirer(a); return; }
  } else if(a.etat === "fuite"){
    bouge = true;
    const v = FUITE[p.forme];
    if(a.k === "faisan"){ a.y += 2.2 * dt; a.x += Math.cos(a.ang) * v * dt; a.z += Math.sin(a.ang) * v * dt; }
    else {
      const ang = a.ang + (a.k === "lapin" ? Math.sin(a.t * 9) * .7 : 0);      // le lapin détale en zigzag
      for(const da of [0, .5, -.5, 1, -1, 1.6, -1.6]){
        const t2 = ang + da, nx = a.x + Math.cos(t2) * v * dt, nz = a.z + Math.sin(t2) * v * dt;
        if(walk(nx, nz)){ avancer(a, nx, nz, t2); break; }
      }
    }
    if(a.t > 2.2) a.alpha -= dt / .6;
    if(a.alpha <= 0){ retirer(a); return; }
  } else {
    a.alpha = Math.min(1, a.alpha + dt);
    if(a.etat === "aguets"){                          // il écoute, la tête haute, tourné vers le personnage
      a.ang = Math.atan2(player.position.z - a.z, player.position.x - a.x);
      if((a.aguets -= dt) <= 0) a.etat = "paisible";
    } else if(a.pause > 0){ a.pause -= dt; broute = true; }
    else {
      if(!a.cible) for(let essai = 0; essai < 6 && !a.cible; essai++){
        const an = Math.random() * 6.28, r = .8 + Math.random() * 1.8, x = a.home.x + Math.cos(an) * r, z = a.home.z + Math.sin(an) * r;
        if(walk(x, z)) a.cible = {x, z};
      }
      if(!a.cible) a.pause = 2;
      else {
        const dx = a.cible.x - a.x, dz = a.cible.z - a.z, d = Math.hypot(dx, dz), v = Math.min(d, PAS[p.forme] * dt);
        if(d < .05 || !walk(a.x + dx / d * v, a.z + dz / d * v)){ a.cible = null; a.pause = 2 + Math.random() * 4; }
        else { avancer(a, a.x + dx / d * v, a.z + dz / d * v, Math.atan2(dz, dx)); bouge = true; }
      }
    }
  }
  /* les pattes, les petits bonds du lapin, la tête qui broute */
  const vit = bouge ? (a.etat === "fuite" ? 18 : 9) : 0;
  u.pattes.forEach((piv, n) => { piv.rotation.x = vit ? Math.sin(a.t * vit + (n % 2) * Math.PI) * .6 : 0; });
  const bond = p.forme === "lapin" && bouge ? Math.abs(Math.sin(a.t * (a.etat === "fuite" ? 14 : 9))) * .14 : 0;
  u.tete.rotation.x += ((broute && p.forme !== "lapin" ? (p.forme === "oiseau" ? .9 : .8) : 0) - u.tete.rotation.x) * Math.min(1, dt * 4);
  a.mesh.position.set(a.x, a.y + bond, a.z);
  a.mesh.rotation.y = -a.ang - Math.PI / 2;
  for(const m of a.mats) m.opacity = Math.max(0, a.alpha);
}

/* ----- Tirer à l'arc ----- */
const arcDuSac = () => { const it = porte().find(it => OUTILS[it.k] && OUTILS[it.k].famille === "arc"); return it ? it.k : null; };
/* La chance de toucher à une distance d, avec la flèche f : une pointe de métal enlève une part du risque de rater */
export const chanceDe = (d, f = "fleche") => { const c = d <= CHASSE.sur ? 1 : Math.max(.35, 1 - (d - CHASSE.sur) / (CHASSE.portee - CHASSE.sur) * .65); return c + (1 - c) * (FLECHES[f] || 0); };
/* La meilleure flèche qu'on porte (bronze, puis cuivre, puis pierre) */
const flecheDuSac = () => Object.keys(FLECHES).sort((a, b) => FLECHES[b] - FLECHES[a]).find(f => sacCount(f) > 0) || null;
const POINTE = {fleche: 0x8E949C, flecheCuivre: 0xC8743C, flecheBronze: 0xB98A4A};
let tir = null;          // la flèche en vol : {mesh, de, a, t, T, bete, touche}
export const tirEnCours = () => !!tir;
function flecheMesh(f){
  const g = new THREE.Group();
  const tige = part(G.cyl, 0x8A5A32, .02, .5, .02, 0, 0, 0); tige.rotation.x = Math.PI / 2; g.add(tige);
  const pointe = part(G.cone, POINTE[f] || 0x8E949C, .05, .1, .05, 0, 0, .28); pointe.rotation.x = Math.PI / 2; g.add(pointe);
  for(const r of [0, Math.PI / 2]){ const pl = part(G.box, 0xE4574C, .005, .06, .1, 0, 0, -.22); pl.rotation.z = r; g.add(pl); }
  return g;
}
/* La bête la plus proche à portée (le Cerf blanc ne se chasse pas) */
function cible(){
  const p = player.position;
  let mieux = null, md = CHASSE.portee;
  for(const a of betes){
    if(a.k === "cerfBlanc" || a.alpha < .5 || (a.etat !== "paisible" && a.etat !== "aguets")) continue;
    const d = Math.hypot(a.x - p.x, a.z - p.z);
    if(d < md){ md = d; mieux = a; }
  }
  return mieux;
}
function tirer(a){
  const p = GIBIER[a.k];
  const f = flecheDuSac();
  if(!f){ toast("🏹 Plus de flèches : fabrique-en à l'établi de la Scierie (2 planches et 1 pierre pour 10 flèches), ou à pointe de métal à l'enclume de la Forge", 3600); return; }
  if(!tientSurSoi(p.donne)){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre avant de chasser", 3200); return; }
  const k = arcDuSac();
  if(state.main !== k){ barreAuto(k); hold(k); }
  sacTake(f, 1);
  const pp = player.position, d = Math.hypot(a.x - pp.x, a.z - pp.z) || 1, dx = (a.x - pp.x) / d, dz = (a.z - pp.z) / d;
  placePlayer(pp.x, pp.z, dx, dz);                    // face à la bête
  pencheMain(.5);
  const touche = Math.random() < chanceDe(d, f), s = Math.random() < .5 ? 1 : -1;
  const fin = touche ? {x: a.x, y: .3 * (p.taille || 1), z: a.z}
    : {x: a.x + dx * 1.2 - dz * s * (.5 + Math.random() * .6), y: .04, z: a.z + dz * 1.2 + dx * s * (.5 + Math.random() * .6)};
  tir = {mesh: flecheMesh(f), de: {x: pp.x + dx * .3, y: .85, z: pp.z + dz * .3}, a: fin, t: 0, T: Math.max(.18, d / 16), bete: a, touche, fini: 0, fleche: f};
  groupe.add(tir.mesh);
  renderHUD();
  user(k);                                            // chaque tir use l'arc (usure.js)
}
function donner(a, f = "fleche"){
  const p = GIBIER[a.k], gains = Object.entries(p.donne);
  for(const [k, n] of gains) sacAdd(k, n);
  sacAdd(f, 1);                                       // la flèche reprise (la même)
  const c = state.carnet.gibier, e = c[a.k] || (c[a.k] = {n: 0}), nouveau = !e.n;
  e.n++;
  save(); renderHUD();
  toast(`🏹 Touché ! ${leNom(a.k, true)} : ${gains.map(([k, n]) => `+${n} ${nomDe(k, n)}`).join(", ")}. Tu reprends ta flèche.${nouveau ? " 🏆 Nouveau trophée au carnet !" : ""}`, 4000);
}
const tmp = new THREE.Vector3();
function voler(dt){
  const T = tir;
  if(T.fini){                                         // la flèche plantée dans le sol, un moment
    T.fini -= dt;
    if(T.fini <= 0){ groupe.remove(T.mesh); tir = null; pencheMain(); }
    return;
  }
  T.t += dt;
  const u = Math.min(1, T.t / T.T);
  const x = T.de.x + (T.a.x - T.de.x) * u, z = T.de.z + (T.a.z - T.de.z) * u, y = T.de.y + (T.a.y - T.de.y) * u + Math.sin(u * Math.PI) * .25;
  tmp.set(x, y, z);
  T.mesh.lookAt(tmp.x + (T.a.x - T.de.x), tmp.y + (T.a.y - T.de.y) * .3, tmp.z + (T.a.z - T.de.z));
  T.mesh.position.copy(tmp);
  if(u < 1) return;
  const a = T.bete;
  if(T.touche && betes.includes(a) && a.etat !== "fuite" && GIBIER[a.k].charge){   // le sanglier blessé se retourne et charge
    retirer(a);
    enrager(a.x, a.z, MONSTRES.sanglier.vie - 1, T.fleche);
    toast("🐗 Touché, le sanglier se retourne, furieux ! Il gratte le sol : roule (🤸). Puis l'épée (⚔️)", 4600);
    groupe.remove(T.mesh); tir = null; pencheMain();
    return;
  }
  if(T.touche && betes.includes(a) && a.etat !== "fuite"){
    a.etat = "tombe"; a.t = 0;
    donner(a, T.fleche);
    groupe.remove(T.mesh); tir = null; pencheMain();
  } else {
    if(betes.includes(a)) alerte(a, "rate");
    toast(`🏹 Raté ! La flèche se perd dans les bois, et ${leNom(a.k)} s'enfuit.`, 2600);
    T.fini = 1.5;
  }
}

/* ----- Le Cerf blanc : on le suit, sans courir, jusqu'au bout de son chemin ----- */
/* Son chemin (foret.js) : de la clairière du Grand Chêne, par le sentier de l'est, jusqu'à la clairière du nord-est */
const CHEMIN = CHEMIN_BLANC.map(([x, z]) => ({x: x - W / 2, z: z - W / 2}));
let blanc = null;        // {a (la bête), etape, etat ("attend" | "marche" | "part" | "fini"), cadeau: {x, z, mesh}}
let blancVu = false;     // déjà apparu pendant cette visite de la forêt
function cadeauMesh(){
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({color: 0xDDE4EC, emissive: 0x7A8AA0, emissiveIntensity: .8});
  for(const s of [-1, 1]){
    const t = part(G.cyl, m, .05, .5, .05, s * .12, .06, 0); t.rotation.z = Math.PI / 2 - s * .3; g.add(t);
    for(const x of [.12, .26]){ const b = part(G.cyl, m, .035, .18, .035, s * x, .12, .02); b.rotation.z = s * -.4; g.add(b); }
  }
  return g;
}
function poserCadeau(x, z){
  const mesh = cadeauMesh(); mesh.position.set(x, .03, z); groupe.add(mesh);
  blanc = blanc || {};
  blanc.cadeau = {x, z, mesh};
}
function effacer(msg){
  blanc.etat = "part"; blanc.t = 0;
  if(msg) toast(msg, 4200);
}
function guider(dt, vite){
  const b = blanc, a = b.a, p = player.position, d = Math.hypot(a.x - p.x, a.z - p.z);
  a.alpha = b.etat === "part" ? a.alpha - dt / 1.6 : Math.min(1, a.alpha + dt / 1.5);
  if(b.etat === "part"){ if(a.alpha <= 0){ retirer(a); b.a = null; } return; }
  if((b.etat === "attend" || b.etat === "marche") && (vite && d < 4 || d < 1.3)){
    effacer("🌫️ Le Cerf blanc s'efface dans la brume… Reviens une autre nuit de pleine lune, et suis-le sans courir, sans trop t'approcher.");
    return;
  }
  if(b.etat === "attend"){
    a.ang = Math.atan2(p.z - a.z, p.x - a.x);
    if(d < 5 && a.alpha > .9){ b.etape++; b.etat = "marche"; }
  } else if(b.etat === "marche"){
    const w = CHEMIN[b.etape], dx = w.x - a.x, dz = w.z - a.z, dd = Math.hypot(dx, dz), v = Math.min(dd, 1.1 * dt);
    if(dd < .05){
      if(b.etape === CHEMIN.length - 1){             // au bout du chemin : il baisse la tête, laisse son bois d'argent, et s'en va
        b.etat = "fini";
        poserCadeau(a.x + Math.cos(a.ang) * .9, a.z + Math.sin(a.ang) * .9);
        toast("✨ Le Cerf blanc baisse la tête, et laisse sur la mousse un bois d'argent. Approche-toi pour le ramasser.", 4600);
        setTimeout(() => { if(blanc && blanc.a === a) effacer(); }, 2500);
      } else if(d > 6) b.etat = "attend";             // il attend qu'on le rattrape
      else b.etape++;
    } else {
      avancer(a, a.x + dx / dd * v, a.z + dz / dd * v, Math.atan2(dz, dx));
      a.mesh.userData.pattes.forEach((piv, n) => { piv.rotation.x = Math.sin(a.t * 7 + (n % 2) * Math.PI) * .5; });
    }
  }
  a.t += dt;
  a.mesh.position.set(a.x, 0, a.z); a.mesh.rotation.y = -a.ang - Math.PI / 2;
  for(const m of a.mats) m.opacity = Math.max(0, a.alpha);
}
function apparaitreBlanc(){
  blancVu = true;
  const w = CHEMIN[0], a = ajouter("cerfBlanc", w.x, w.z, null);
  blanc = {a, etape: 0, etat: "attend", t: 0, cadeau: null};
  toast("✨ Un cerf tout blanc, au cœur de la forêt… Il ne se chasse pas : suis-le, sans courir et sans trop t'approcher.", 4600);
}
/* Pour la vérification automatique : le Cerf blanc devant soi, ou son présent déjà posé au bout du chemin */
export function lacherCerfBlanc(auBout){
  const p = player.position;
  if(auBout){ poserCadeau(p.x + .6, p.z); return; }
  apparaitreBlanc();
}
function ramasser(){
  const c = blanc && blanc.cadeau;
  if(!c) return;
  if(sacPlace("boisArgent") < 1){ toast("🎒 Ton sac est plein : fais de la place pour le bois d'argent", 3000); return; }
  sacAdd("boisArgent", 1);
  state.cerfBlanc = true;
  state.carnet.gibier.cerfBlanc = {n: 1};
  groupe.remove(c.mesh); blanc.cadeau = null;
  save(); renderHUD();
  toast("✨ Le bois d'argent du Cerf blanc, dans ton sac : un présent unique dans tout le jeu. 👑 Le Cerf blanc est au carnet.", 4600);
}

/* ----- Le bouton d'action (recolte.js), avant le reste ----- */
const rien = () => {};
export function chasseAction(){
  if(tir && !tir.fini) return {label: "🏹 …", run: rien};
  const c = blanc && blanc.cadeau, p = player.position;
  if(c && Math.hypot(c.x - p.x, c.z - p.z) < 1.4) return {label: "✨ Ramasser le bois d'argent", run: ramasser};
  if(!arcDuSac()) return null;
  const a = cible();
  if(!a) return null;
  const d = Math.hypot(a.x - p.x, a.z - p.z);
  return {label: `🏹 Tirer : ${GIBIER[a.k].nom.toLowerCase()} (${Math.round(chanceDe(d, flecheDuSac() || "fleche") * 100)} %)`, run: () => { if(betes.includes(a) && !tir) tirer(a); }};
}

/* ----- À chaque image (recolte.js) ; ou : le milieu, la chasse n'a lieu que dans la forêt ----- */
let ponte = 1, enPause = false, dans = false;
/* Pour la vérification automatique : plus de nouvelles bêtes, et celles qui sont là s'en vont */
export function pauseChasse(oui){ enPause = oui; if(oui) for(const a of [...betes]) if(a.k !== "cerfBlanc") retirer(a); }
const fleche = $("#vent"), aiguille = fleche && fleche.querySelector("i");
function quitter(){
  for(const a of [...betes]) retirer(a);
  for(const e of empreintes) { groupe.remove(e.mesh); e.mat.dispose(); }
  empreintes.length = 0;
  if(tir){ groupe.remove(tir.mesh); tir = null; }
  if(blanc && blanc.cadeau) groupe.remove(blanc.cadeau.mesh);
  blanc = null; blancVu = false; ponte = 1;
  feuilles.forEach(f => { f.vu = false; });
}
export function updateChasse(dt, actif, ou){
  const ici = ou === "foret";
  if(dans && !ici) quitter();
  dans = ici;
  groupe.visible = ici;
  if(fleche) fleche.hidden = !ici;
  if(!ici) return;
  const w = vent();
  if(aiguille) aiguille.style.transform = `rotate(${w.a}rad)`;
  feuillesAuVent(dt);
  for(const e of [...empreintes]){                   // les empreintes s'effacent en deux minutes
    e.age += dt; e.mat.opacity = .5 * Math.max(0, 1 - e.age / 120);
    if(e.age >= 120){ groupe.remove(e.mesh); e.mat.dispose(); empreintes.splice(empreintes.indexOf(e), 1); }
  }
  if(tir) voler(dt);
  const p = player.position, vite = allure() > ALLURE_DOUCE, bouge = allure() > .05, m = a => GIBIER[a.k].ruse ? 1.3 : 1;
  for(const a of [...betes]){
    if(a.k === "cerfBlanc"){ if(blanc && blanc.a === a) guider(dt, vite); continue; }
    const d = Math.hypot(a.x - p.x, a.z - p.z);
    if(d > CHASSE.rayon){ retirer(a); continue; }
    if(a.etat === "paisible" || a.etat === "aguets"){
      const dansLeVent = d > .1 && ((a.x - p.x) * w.x + (a.z - p.z) * w.z) / d > .5;   // le vent porte l'odeur du personnage vers elle
      if(dansLeVent && d < CHASSE.flair * m(a)) alerte(a, "flair");
      else if(vite && d < CHASSE.ouie * m(a)) alerte(a, a.etat === "aguets" ? "vue" : "bruit");
      else if(bouge && d < CHASSE.vue * m(a)) alerte(a, "vue");
    }
    vivre(a, dt);
  }
  /* le Cerf blanc : les nuits de pleine lune, au cœur de la forêt, une fois par visite, tant qu'il n'a pas offert son bois */
  const h = new Date().getHours();
  if(!blancVu && !state.cerfBlanc && pleineLune() && (h >= 21 || h < 5) && Math.hypot(CHEMIN[0].x - p.x, CHEMIN[0].z - p.z) < 10) apparaitreBlanc();
  if(!actif || enPause) return;
  ponte -= dt;
  if(ponte <= 0){
    ponte = CHASSE.ponte;
    const groupes = new Set(betes.filter(a => a.k !== "cerfBlanc").map(a => a.grp || a));
    if(groupes.size < CHASSE.max) pondre();
  }
}
