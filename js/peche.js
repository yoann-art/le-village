/* ================= La pêche (étape 1.6) =================
   Des ombres de poissons nagent dans l'eau, près des bords (Grand Carnet : « le poisson se repère à son ombre
   dans l'eau : plus elle est grosse, plus la prise est belle »). Chacune est un poisson du lieu (étang, mer ;
   près du ponton, ceux du ponton), de l'heure, de la saison et de la météo (POISSONS, selon sa rareté), avec
   sa taille : l'ombre est d'autant plus grosse.
   La canne en main (ou dans le sac, mains libres), face à la mer ou à l'étang : « 🎣 Lancer » (voir recolte.js).
   Une ombre devant soi, à portée : le bouchon tombe juste devant elle ; sinon droit devant. Un poisson proche
   du bouchon vient voir, le grignote (le bouchon frémit pour rien), puis mord : le téléphone vibre et le
   bouton devient « ❗ Ferrer ! » pendant PECHE.fenetre seconde.
   - À temps : ce poisson-là va dans le sac ; le personnage le montre au-dessus de sa tête. Un légendaire ne se
     prend qu'une fois dans tout le jeu. Le carnet garde chaque espèce prise, combien, et le plus gros
     (state.carnet.poissons = {k: {n, max}}).
   - Trop tôt ou trop tard : il s'échappe (décidé par Yo) et son ombre s'enfuit ; on relance, rien n'est perdu.
   Bouger, lâcher la canne ou ouvrir un panneau remonte la ligne. Sac plein : on ne pêche pas. */
import { scene } from "./monde/scene.js";
import { interior } from "./monde/interieurs.js";
import { G, part } from "./monde/formes.js";
import { POISSONS, HEURES, PECHE, OUTILS, SAC, lieuxDe, saisonDu } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace } from "./regles.js";
import { idx, inb, N, tileOf, centerOf, lieuEau } from "./monde/ile.js";
import { eauLibre, pontonCases } from "./monde/ponton.js";
import { foret, ftile, fcx, fcz, sources } from "./monde/foret.js";
import { player, pencheMain, dir4, regard } from "./monde/personnage.js";
import { jv, keys } from "./commandes.js";
import { toast } from "./interface.js";

/* ----- Quels poissons nagent ici et maintenant (vraie horloge du téléphone, l'hémisphère du joueur) ----- */
export const saisonDe = saisonDu;
/* La météo : elle arrive à l'étape 1.10 ; en attendant, il fait toujours beau (décidé par Yo) : l'anguille
   (pluie) et le Vieux Silure (orage) attendent la météo */
export const meteo = () => "beau";
/* La lune (Grand Carnet : « les nuits de pleine lune ») : la vraie, comptée depuis une nouvelle lune connue
   (6 janvier 2000) ; pleine à un jour et demi près, soit environ trois nuits par mois */
const LUNAISON = 29.530588853;
export const ageLune = d => (((d - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % LUNAISON + LUNAISON) % LUNAISON;
export const pleineLune = (d = new Date()) => Math.abs(ageLune(d) - LUNAISON / 2) < 1.5;
const dejaPris = k => { const e = state.carnet.poissons[k]; return !!e && e.n > 0; };
/* lieu : « etang », « mer », « ruisseau » ou « source » (où nagent aussi ceux du ruisseau) ; ponton : près du
   ponton (la barque viendra plus tard) */
export function presents(lieu, ponton, d = new Date()){
  const s = saisonDe(d), h = d.getHours() + d.getMinutes() / 60, lune = pleineLune(d);
  return Object.keys(POISSONS).filter(k => { const p = POISSONS[k], l = lieuxDe(p);
    return (l.includes(lieu) || lieu === "source" && l.includes("ruisseau")) && p.saisons.includes(s) && HEURES[p.heures].h.some(([a, b]) => h >= a && h < b)
      && (!p.lune || lune)
      && (!p.meteo || p.meteo === meteo()) && (!p.depuis || p.depuis === "ponton" && ponton)
      && !(p.rarete === "legendaire" && (dejaPris(k) || ombres.some(o => o.k === k))); });
}
/* Un poisson : d'abord une rareté (PECHE.poids, parmi celles présentes), puis une espèce ; sa taille penche
   vers les petites (les gros sont plus rares). null s'il n'y a personne */
function tirer(lieu, ponton){
  const par = {};
  presents(lieu, ponton).forEach(k => { const r = POISSONS[k].rarete; (par[r] = par[r] || []).push(k); });
  const rangs = Object.keys(par);
  if(!rangs.length) return null;
  let x = Math.random() * rangs.reduce((n, r) => n + PECHE.poids[r], 0);
  const r = rangs.find(r => (x -= PECHE.poids[r]) < 0) || rangs[0];
  const k = par[r][Math.floor(Math.random() * par[r].length)], [a, b] = POISSONS[k].taille;
  return {k, cm: Math.round(a + (b - a) * Math.random() ** 1.6)};
}
const leNom = (k, maj) => { const p = POISSONS[k], s = p.rarete === "legendaire" ? `${p.une ? "la" : "le"} ${p.nom}` : `${p.une ? "une" : "un"} ${p.nom.toLowerCase()}`;
  return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Le bouchon, le fil, les ronds dans l'eau, le poisson montré ----- */
const EAU = -.2;                                          // le niveau de l'eau (voir monde/ile.js)
const bouchon = new THREE.Group();
bouchon.add(part(G.head, 0xF4EFE6, .5, .5, .5, 0, 0, 0));
bouchon.add(part(G.hair, 0xE4574C, .52, .52, .52, 0, 0, 0));
bouchon.add(part(G.cyl, 0x1C2230, .025, .12, .025, 0, .17, 0));
bouchon.visible = false; scene.add(bouchon);
const NF = 14;
const fil = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length: NF}, () => new THREE.Vector3())),
  new THREE.LineBasicMaterial({color: 0xF4EFE6}));
fil.frustumCulled = false; fil.visible = false; scene.add(fil);
const rondMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false});
const rond = new THREE.Mesh(new THREE.RingGeometry(.1, .15, 24), rondMat);
rond.rotation.x = -Math.PI/2; rond.visible = false; scene.add(rond);
let rondT = 9;
function remous(x, z){ rond.position.set(x, EAU + .03, z); rondT = 0; rond.visible = true; }
/* Le modèle d'un poisson, de côté (style jouet) ; plus gros selon sa taille. L'écrevisse et l'encornet ont le leur */
function crustace(g, c){
  g.add(part(G.head, c, 1.2, .5, .7, 0, 0, 0));                                       // le corps
  const queue = part(G.cone, c, .5, .3, .3, .36, -.02, 0); queue.rotation.z = Math.PI/2; g.add(queue);
  for(const z of [-.12, .12]){
    const bras = part(G.cyl, c, .05, .2, .05, -.32, .02, z * 1.2); bras.rotation.z = Math.PI/2.4; g.add(bras);
    g.add(part(G.head, c, .55, .35, .4, -.44, .06, z * 1.5));                         // la pince
    g.add(part(G.eye, 0x1C2230, 1.2, 1.2, 1.2, -.24, .1, z * .6));
  }
}
function calmar(g, c){
  const corps = part(G.cone, c, .38, .6, .38, .14, 0, 0); corps.rotation.z = -Math.PI/2; g.add(corps);   // le manteau, pointe en arrière
  g.add(part(G.head, c, .75, .7, .7, -.2, 0, 0));                                     // la tête
  for(let n = 0; n < 5; n++){ const t = part(G.cyl, c, .035, .3, .035, -.36, -.08 + n * .04, -.08 + n * .04); t.rotation.z = Math.PI/2; g.add(t); }
  for(const z of [-.12, .12]) g.add(part(G.eye, 0x1C2230, 1.4, 1.4, 1.4, -.24, .06, z));
}
export function poissonMesh(k, cm){
  const p = POISSONS[k], g = new THREE.Group();
  if(p.forme === "crustace" || p.forme === "calmar"){
    (p.forme === "crustace" ? crustace : calmar)(g, p.couleur);
    g.scale.setScalar(.8 + Math.min(1, cm / 40) * .5);
    return g;
  }
  const lx = p.forme === "long" ? 1.6 : 1.25, ly = lx * ({long: .25, fin: .4, rond: .72}[p.forme] || .52), demi = .24 * lx;
  const m = p.rarete === "legendaire" || p.brille ? new THREE.MeshLambertMaterial({color: p.couleur, emissive: p.brille ? 0x5A6A7A : 0x6B4A00}) : p.couleur;
  g.add(part(G.head, m, lx, ly, .55, 0, 0, 0));                                       // le corps
  const queue = part(G.cone, m, .9 * ly, .26, .14, demi + .1, 0, 0); queue.rotation.z = Math.PI/2; g.add(queue);
  const dos = part(G.cone, m, .3, .14, .06, -.02, .24 * ly * .9, 0); g.add(dos);      // la nageoire du dos
  for(const z of [-.12, .12]) g.add(part(G.eye, 0x1C2230, 1.3, 1.3, 1.3, -demi * .62, .24 * ly * .25, z));
  g.scale.setScalar(.65 + Math.min(1.4, cm / 100) * .55);
  return g;
}

/* ----- Les ombres des poissons (morceau 3) -----
   Une ombre : {k, cm, lieu, x, z, ang (où elle regarde), L (sa longueur), etat, t (son âge), vie, alpha, cible, pause, mesh}.
   etat : « nage » (elle se promène), « approche » (elle vient au bouchon), « mord » (elle grignote, puis tire),
   « fuit » (elle file et disparaît), « part » (elle s'efface doucement : son temps est fini). */
const ombres = [];
const ombresGroupe = new THREE.Group(); scene.add(ombresGroupe);
const DISQUE = new THREE.CircleGeometry(.5, 20), QUEUE = new THREE.CircleGeometry(.5, 3);
const FORMES = {long: .22, fin: .32, rond: .55, crustace: .6, calmar: .4};
/* Le milieu où l'on pêche (morceau 4) : « ile » (dehors) ou « foret » (le ruisseau et la source de la Forêt
   profonde, dans la scène des intérieurs). En changeant de milieu, les ombres s'effacent et tout change de scène. */
let ici = "ile";
const sceneIci = () => ici === "foret" ? interior : scene;
const eauForet = (x, z) => { const i = ftile(x, z); return i >= 0 && foret.type[i] === "eau"; };
const enEau = (x, z) => { if(ici === "foret") return eauForet(x, z); const a = tileOf(x), b = tileOf(z); return !inb(a, b) || eauLibre(idx(a, b)); };
/* Près d'un bord (terre ou ponton à deux cases au plus) : on peut y lancer depuis la rive (le ruisseau et la
   source sont étroits : toujours) */
function presDuBord(x, z){
  if(ici === "foret") return true;
  for(let dz = -2; dz <= 2; dz++) for(let dx = -2; dx <= 2; dx++){ const a = x + dx, b = z + dz; if(inb(a, b) && !eauLibre(idx(a, b))) return true; }
  return false;
}
const presDuPonton = (x, z) => ici === "ile" && [...pontonCases].some(j => Math.hypot(centerOf(j % N) - x, centerOf(Math.floor(j / N)) - z) < 2.2);
function ajouterOmbre(k, cm, x, z, lieu){
  const p = POISSONS[k], L = .45 + .9 * Math.min(1, cm / 160), W = L * (FORMES[p.forme] || .42);
  const mat = new THREE.MeshBasicMaterial({color: 0x10303C, transparent: true, opacity: 0, depthWrite: false});
  const mesh = new THREE.Group(), corps = new THREE.Mesh(DISQUE, mat);
  corps.rotation.x = -Math.PI/2; corps.scale.set(L, W, 1); mesh.add(corps);
  const pivot = new THREE.Group(); pivot.position.x = -L * .45; mesh.add(pivot);    // la queue, qui bat
  const queue = new THREE.Mesh(QUEUE, mat); queue.rotation.x = -Math.PI/2; queue.scale.set(L * .32, W * 1.1, 1); queue.position.x = -L * .14; pivot.add(queue);
  mesh.position.y = EAU + .035; mesh.renderOrder = 2;
  ombresGroupe.add(mesh);
  const o = {k, cm, lieu, x, z, ang: Math.random() * 6.28, L, etat: "nage", t: 0, vie: PECHE.ombres.vie[0] + Math.random() * (PECHE.ombres.vie[1] - PECHE.ombres.vie[0]),
    alpha: 0, cible: null, pause: Math.random() * 2, mesh, mat, pivot, bat: 0};
  ombres.push(o);
  return o;
}
function retirer(o){ ombresGroupe.remove(o.mesh); o.mat.dispose(); ombres.splice(ombres.indexOf(o), 1); }
/* Un poisson qui nage en banc (le goujon, « jamais seul ») : un ou deux autres tout près */
function banc(f, x, z, lieu){
  if(!POISSONS[f.k].banc) return;
  for(let n = 1 + Math.floor(Math.random() * 2), essai = 0; n > 0 && essai < 8; essai++){
    const a = Math.random() * 6.28, bx = x + Math.cos(a) * .7, bz = z + Math.sin(a) * .7;
    if(!enEau(bx, bz)) continue;
    const [t0, t1] = POISSONS[f.k].taille;
    ajouterOmbre(f.k, Math.round(t0 + (t1 - t0) * Math.random()), bx, bz, lieu); n--;
  }
}
function changer(ou){
  if(!ou || ou === ici) return;
  remonter();
  for(const o of [...ombres]) retirer(o);
  ici = ou;
  for(const o of [bouchon, fil, rond, ombresGroupe]) sceneIci().add(o);
}
function fuir(o){ if(!o || o.etat === "fuit") return; o.etat = "fuit"; const p = player.position; o.ang = Math.atan2(o.z - p.z, o.x - p.x) + (Math.random() - .5); }
/* Dans la forêt : une ombre dans le ruisseau ou à la source, autour du personnage (pas trop près) */
function pondreForet(){
  const R = PECHE.ombres.rayon, p = player.position, cand = [];
  foret.type.forEach((t, i) => { if(t !== "eau") return; const d = Math.hypot(fcx(i) - p.x, fcz(i) - p.z); if(d >= 2 && d <= R) cand.push(i); });
  for(let essai = 0; essai < 6 && cand.length; essai++){
    const i = cand[Math.floor(Math.random() * cand.length)], lieu = sources.has(i) ? "source" : "ruisseau";
    const x = fcx(i) + (Math.random() - .5) * .5, z = fcz(i) + (Math.random() - .5) * .5;
    if(ombres.some(o => Math.hypot(o.x - x, o.z - z) < 1.3)) continue;
    const f = tirer(lieu, false);
    if(f){ ajouterOmbre(f.k, f.cm, x, z, lieu); banc(f, x, z, lieu); }
    return;
  }
}
/* Une nouvelle ombre, sur une case d'eau près d'un bord, autour du personnage (pas trop près) */
function pondre(){
  if(ici === "foret"){ pondreForet(); return; }
  const R = PECHE.ombres.rayon, px = tileOf(player.position.x), pz = tileOf(player.position.z), cand = [];
  for(let z = pz - R; z <= pz + R; z++) for(let x = px - R; x <= px + R; x++){
    const d = Math.hypot(x - px, z - pz);
    if(d < 2 || d > R || !inb(x, z) || !eauLibre(idx(x, z)) || !presDuBord(x, z)) continue;
    cand.push(idx(x, z));
  }
  const nEtang = ombres.filter(o => o.lieu === "etang").length;
  for(let essai = 0; essai < 6 && cand.length; essai++){
    const i = cand[Math.floor(Math.random() * cand.length)], lieu = lieuEau(i);
    if(lieu === "etang" && nEtang >= PECHE.ombres.etang) continue;
    const x = centerOf(i % N) + (Math.random() - .5) * .6, z = centerOf(Math.floor(i / N)) + (Math.random() - .5) * .6;
    if(ombres.some(o => Math.hypot(o.x - x, o.z - z) < 1.3)) continue;
    const f = tirer(lieu, presDuPonton(x, z));
    if(f){ ajouterOmbre(f.k, f.cm, x, z, lieu); banc(f, x, z, lieu); }
    return;
  }
}
/* Pour la vérification automatique : une ombre à un endroit précis (sur l'île ou dans la forêt) */
export function lacherOmbre(x, z){
  const fi = ftile(x, z), lieu = ici === "foret" ? (sources.has(fi) ? "source" : "ruisseau") : lieuEau(idx(tileOf(x), tileOf(z)));
  const f = tirer(lieu, presDuPonton(x, z));
  if(!f) return null;
  const o = ajouterOmbre(f.k, f.cm, x, z, lieu); o.alpha = 1; o.pause = 99;
  return o;
}
/* Tourne vers un angle, doucement */
function tourne(o, but, dt, vite){ const d = Math.atan2(Math.sin(but - o.ang), Math.cos(but - o.ang)); o.ang += d * Math.min(1, dt * vite); return Math.abs(d); }
function nager(o, dt){
  o.t += dt;
  let v = 0;                                          // sa vitesse (la queue bat plus vite quand elle nage)
  if(o.etat === "fuit"){
    v = 2.4; o.x += Math.cos(o.ang) * v * dt; o.z += Math.sin(o.ang) * v * dt;
    o.alpha -= dt / .7; if(o.alpha <= 0){ retirer(o); return; }
  } else if(o.etat === "part"){
    v = .2; o.alpha -= dt; if(o.alpha <= 0){ retirer(o); return; }
  } else if(o.etat === "approche" || o.etat === "mord"){
    o.alpha = Math.min(1, o.alpha + dt);
    const b = bouchon.position, dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz) || 1;
    tourne(o, Math.atan2(dz, dx), dt, 5);
    if(o.etat === "approche"){
      v = .6;
      if(d > o.L / 2 + .06){ o.x += dx / d * v * dt; o.z += dz / d * v * dt; }
      else { o.etat = "mord"; o.arrive = true; }
    } else {                                          // il grignote : petits allers-retours, le nez au bouchon
      const recul = o.grignote > 0 ? Math.sin(o.grignote * Math.PI) * .12 : 0;
      o.x = b.x - dx / d * (o.L / 2 + .04 + recul); o.z = b.z - dz / d * (o.L / 2 + .04 + recul);
      if(o.grignote > 0) o.grignote = Math.max(0, o.grignote - dt / .35);
      v = .3;
    }
  } else {                                            // elle se promène, près de sa place
    o.alpha = Math.min(1, o.alpha + dt);
    if(o.t > o.vie){ o.etat = "part"; }
    else if(o.pause > 0) o.pause -= dt;
    else {
      if(!o.cible){
        for(let essai = 0; essai < 5 && !o.cible; essai++){
          const a = Math.random() * 6.28, r = .6 + Math.random() * 1.4, x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r;
          if(enEau(x, z) && presDuBord(tileOf(x), tileOf(z))) o.cible = {x, z};
        }
        if(!o.cible) o.pause = 1;
      }
      if(o.cible){
        const dx = o.cible.x - o.x, dz = o.cible.z - o.z, d = Math.hypot(dx, dz);
        const ecart = tourne(o, Math.atan2(dz, dx), dt, 3);
        if(d < .1){ o.cible = null; o.pause = .6 + Math.random() * 2.2; }
        else if(ecart < 1){
          v = .3; const nx = o.x + dx / d * v * dt, nz = o.z + dz / d * v * dt;
          if(enEau(nx, nz)){ o.x = nx; o.z = nz; } else { o.cible = null; o.pause = .5; }
        }
      }
    }
  }
  o.bat += dt * (4 + v * 14);
  o.mesh.position.x = o.x; o.mesh.position.z = o.z; o.mesh.rotation.y = -o.ang;
  o.pivot.rotation.y = Math.sin(o.bat) * .35;
  o.mat.opacity = .42 * Math.max(0, o.alpha);
}
let ponte = 0;
function updateOmbres(dt, ou){
  ombresGroupe.visible = !!ou;
  if(!ou) return;
  const p = player.position, R = PECHE.ombres.rayon;
  for(const o of [...ombres]){
    const loin = Math.hypot(o.x - p.x, o.z - p.z) > R + 4;
    if(loin && (!ligne || ligne.ombre !== o)){ retirer(o); continue; }
    nager(o, dt);
  }
  ponte -= dt;
  if(ponte <= 0){ ponte = 1.5; if(ombres.filter(o => o.etat !== "fuit" && o.etat !== "part").length < PECHE.ombres.max) pondre(); }
}

/* ----- La ligne en cours ----- */
let ligne = null;          // {phase: "vol" | "attente" | "touche" | "montre", t, T, de, a, ombre, frem, fremi, reste, poisson}
export const enPeche = () => !!ligne;
const canneEnMain = () => state.main && OUTILS[state.main] && OUTILS[state.main].famille === "canne";
const bouge = () => jv.x || jv.z || keys.u || keys.d || keys.l || keys.r;
/* Le téléphone vibre (seulement après un vrai toucher de l'écran : sinon le navigateur proteste) */
const vibre = ms => { try{ const u = navigator.userActivation; if(navigator.vibrate && (!u || u.hasBeenActive)) navigator.vibrate(ms); }catch(_){} };
const bout = new THREE.Vector3();
function boutDeCanne(){
  const o = player.getObjectByName("bout");
  if(o) o.getWorldPosition(bout); else bout.set(player.position.x, .9, player.position.z);
  return bout;
}
/* Le sac a-t-il la place pour un poisson ? (un emplacement libre, ou une pile de poissons pas pleine) */
const sacOk = () => state.sac.length < SAC.places || state.sac.some(it => POISSONS[it.k] && it.n < SAC.pile);
/* Où tombe le bouchon en lançant dans une direction (dx, dz) : dans l'eau, entre le bord et 2,2 P ; null sinon */
function pointDevant(dx, dz){
  const p = player.position;
  let s0 = null, s1 = null;
  for(let s = .5; s <= 3.01; s += .1){
    if(enEau(p.x + dx * s, p.z + dz * s)){ if(s0 === null) s0 = s; s1 = s; }
    else if(s0 !== null) break;
  }
  if(s0 === null) return null;
  const s = Math.max(s0 + .15, Math.min(2.2, s1 - .15));
  return {x: p.x + dx * s, z: p.z + dz * s};
}

/* Lancer, face à l'eau (voir recolte.js) */
export function lancer(){
  if(ligne) return;
  if(!sacOk()){ toast("🎒 Ton sac est plein : range tes affaires dans un coffre de réserve avant de pêcher", 3400); return; }
  /* Une ombre devant soi, à portée (dans un cône de 40°, entre 0,9 et 3,4 P) : le bouchon tombe juste devant elle */
  const p = player.position, f = regard();
  let vise = null, mieux = Infinity;
  for(const o of ombres){
    if(o.etat !== "nage") continue;
    const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz), cos = (dx * f.x + dz * f.z) / d;
    if(d < .9 || d > 3.4 || cos < .766) continue;
    if(d * (2 - cos) < mieux){ mieux = d * (2 - cos); vise = o; }
  }
  let a = null;
  if(vise){
    const d = Math.hypot(vise.x - p.x, vise.z - p.z), s = Math.max(.8, d - vise.L / 2 - .35);
    a = {x: p.x + (vise.x - p.x) / d * s, z: p.z + (vise.z - p.z) / d * s};
    if(!enEau(a.x, a.z)) a = null;
  }
  if(!a){ const d = dir4(); a = pointDevant(f.x, f.z) || pointDevant(d.x, d.z); }
  if(!a) return;
  ligne = {phase: "vol", t: 0, T: 0, de: boutDeCanne().clone(), a: new THREE.Vector3(a.x, EAU, a.z), vise, ombre: null, frem: [], fremi: -9, reste: 0};
  bouchon.position.copy(ligne.de); bouchon.visible = true; fil.visible = true;
}
/* Le poisson le plus proche du bouchon vient voir (celui qu'on visait d'abord) */
function attirer(L){
  const libre = o => o.etat === "nage" && Math.hypot(o.x - L.a.x, o.z - L.a.z) < PECHE.ombres.attire;
  const o = L.vise && libre(L.vise) ? L.vise
    : ombres.filter(libre).sort((m, n) => Math.hypot(m.x - L.a.x, m.z - L.a.z) - Math.hypot(n.x - L.a.x, n.z - L.a.z))[0];
  if(o){ o.etat = "approche"; L.ombre = o; }
}
/* Remonter la ligne (un message si besoin) ; le poisson accroché, s'il y en a un, s'enfuit */
function remonter(msg){
  if(ligne && ligne.poisson && ligne.poisson.parent) ligne.poisson.parent.remove(ligne.poisson);
  if(ligne && ligne.ombre && ombres.includes(ligne.ombre)) fuir(ligne.ombre);
  ligne = null;
  bouchon.visible = false; fil.visible = false;
  pencheMain();
  if(msg) toast(msg, 2400);
}
function ferrer(){
  const o = ligne.ombre, {k, cm} = o;
  if(sacPlace(k) < 1){ remonter(`🎒 Ton sac est plein : tu relâches ${leNom(k)}`); return; }
  sacAdd(k, 1);
  retirer(o); ligne.ombre = null;
  const c = state.carnet.poissons, e = c[k] || (c[k] = {n: 0, max: 0});
  const nouveau = !e.n, record = e.n > 0 && cm > e.max;
  e.n++; e.max = Math.max(e.max, cm);
  save();
  vibre(60);
  /* Le personnage montre le poisson au-dessus de sa tête */
  ligne.phase = "montre"; ligne.t = 0;
  ligne.poisson = poissonMesh(k, cm); sceneIci().add(ligne.poisson);
  bouchon.visible = false; fil.visible = false;
  remous(ligne.a.x, ligne.a.z);
  const nom = `${leNom(k, true)} de ${cm} cm !`;
  toast(POISSONS[k].rarete === "legendaire" ? `✨ ${nom} Un poisson légendaire, le seul de tout le jeu : dans ton sac`
    : POISSONS[k].brille ? `✨ ${nom} Elle brille comme une pièce neuve ! ${nouveau ? "Nouveau poisson pour ton carnet, " : ""}dans ton sac`
    : nouveau ? `🐟 ${nom} Nouveau poisson pour ton carnet, dans ton sac`
    : record ? `🐟 ${nom} C'est ton record, dans ton sac`
    : `🐟 ${nom} Dans ton sac`, 3200);
}

/* Le bouton d'action pendant la pêche (recolte.js l'affiche) ; alerte : le bouton « Ferrer » se fait voir */
const rien = () => {};
export function pecheAction(){
  if(!ligne) return null;
  if(ligne.phase === "vol") return {label: "🎣 …", run: rien};
  if(ligne.phase === "attente") return {label: "🎣 Remonter la ligne", run: () => { if(ligne && ligne.phase === "attente")
    remonter(ligne.ombre ? "🐟 Trop tôt : le poisson s'est méfié. Attends que le bouchon plonge !" : "🎣 Ligne remontée"); }};
  if(ligne.phase === "touche") return {label: "❗ Ferrer !", run: () => { if(ligne && ligne.phase === "touche") ferrer(); }, alerte: true};
  return null;
}

/* À chaque image : les ombres, le vol du bouchon, l'attente, la touche, le poisson montré.
   actif : on peut pêcher (pas de panneau ouvert…) ; ou : le milieu, « ile » ou « foret » (null dans un bâtiment
   ou la mine : pas de poissons) */
const tmp = new THREE.Vector3(), creux = new THREE.Vector3();
export function updatePeche(dt, actif, ou){
  changer(ou);
  if(rondT < .7){ rondT += dt; const f = rondT / .7; rond.scale.setScalar(1 + f * 3); rondMat.opacity = .8 * (1 - f); if(f >= 1) rond.visible = false; }
  updateOmbres(dt, ou);
  if(!ligne) return;
  if(!actif || !ou || bouge() || !canneEnMain()){ remonter(); return; }
  ligne.t += dt; ligne.T += dt;
  const L = ligne;
  if(L.phase === "vol"){
    const u = Math.min(1, L.t / .45);
    pencheMain(u < .3 ? .35 - 1.1 * u / .3 : -.75 + 1.7 * (u - .3) / .7);           // la canne part en arrière, puis en avant
    bouchon.position.lerpVectors(L.de, L.a, u); bouchon.position.y += Math.sin(u * Math.PI) * .9;
    if(u >= 1){ L.phase = "attente"; L.t = 0; remous(L.a.x, L.a.z); attirer(L); }
  } else if(L.phase === "attente"){
    let y = EAU + .02 + Math.sin(L.T * 2.6) * .012;
    if(!L.ombre){                                     // personne : un poisson qui passe près du bouchon viendra peut-être
      if(Math.floor(L.t * 2) !== Math.floor((L.t - dt) * 2)) attirer(L);
      if(L.t > 8 && !L.prevenu){ L.prevenu = true; toast("🎣 Aucun poisson n'approche : lance près d'une ombre dans l'eau", 3000); }
    } else if(!ombres.includes(L.ombre)){ L.ombre = null; }
    else if(L.ombre.etat === "mord"){
      if(L.ombre.arrive){                             // il arrive au bouchon : de 0 à 3 grignotages, puis la touche
        L.ombre.arrive = false;
        const total = PECHE.morsure[0] + Math.random() * (PECHE.morsure[1] - PECHE.morsure[0]);
        L.frem = [];
        for(let n = Math.floor(Math.random() * 4); n > 0; n--){ const f = .5 + Math.random() * (total - 1); if(L.frem.every(g => Math.abs(g - f) > .6)) L.frem.push(L.t + f); }
        L.frem.sort((a, b) => a - b); L.reste = L.t + total;
      }
      if(L.frem.length && L.t >= L.frem[0]){ L.frem.shift(); L.fremi = L.T; L.ombre.grignote = 1; vibre(25); }
      if(L.t >= L.reste){ L.phase = "touche"; L.t = 0; vibre(300); remous(L.a.x, L.a.z); }
    }
    const df = L.T - L.fremi;
    if(df < .35) y -= Math.sin(df / .35 * Math.PI) * .05;                              // il grignote : un petit plongeon
    bouchon.position.set(L.a.x, y, L.a.z);
  } else if(L.phase === "touche"){
    bouchon.position.set(L.a.x + Math.sin(L.T * 40) * .03, EAU - .12, L.a.z);            // il plonge et tire
    if(L.t >= PECHE.fenetre){ remonter("🐟 Trop tard : le poisson s'est échappé. Relance !"); return; }
  } else if(L.phase === "montre"){
    const u = Math.min(1, L.t / .25);
    pencheMain(.35 - .9 * (1 - u));
    L.poisson.position.set(player.position.x, .7 + .75 * u, player.position.z + .05);
    L.poisson.rotation.z = Math.sin(L.t * 9) * .18 * Math.max(0, 1 - L.t / 1.4);
    if(L.t >= 1.9) remonter();
    return;
  }
  /* Le fil, du bout de la canne au bouchon, qui pend un peu (tendu pendant la touche) */
  const A = boutDeCanne(), B = bouchon.position, pend = L.phase === "touche" ? .02 : L.phase === "vol" ? .05 : .22;
  const pos = fil.geometry.attributes.position;
  for(let n = 0; n < NF; n++){
    const f = n / (NF - 1);
    tmp.lerpVectors(A, B, f); creux.set(0, -pend * 4 * f * (1 - f), 0); tmp.add(creux);
    pos.setXYZ(n, tmp.x, tmp.y, tmp.z);
  }
  pos.needsUpdate = true;
}
