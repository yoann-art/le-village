/* ================= La grotte de la Forêt profonde (étape 1.8, morceau 1) =================
   Bible (étape 0.3, décidé) : « le danger se voit toujours venir et la sortie reste proche » ; « construction
   mixte : les salles clés sont dessinées à la main, le reste s'assemble au hasard à chaque visite » ;
   « obscurité : la torche s'use et se refabrique à volonté » ; « on descend par paliers ; plus on descend, plus le
   danger et le butin grandissent ; chaque palier a une sortie vers la surface ». Grand Carnet : la grotte
   d'initiation, « sous les racines des vieux arbres ».
   On y entre par les racines du vieux chêne, dans la clairière du nord-ouest de la forêt (voir foret.js et
   lieux.js). Chaque palier : une salle d'arrivée dessinée à la main (en bas, au milieu), puis des salles tirées au
   hasard, reliées par des couloirs ; dans la plus lointaine, le trou qui descend au palier suivant (au dernier, le
   fond de la grotte, où viendra le Gardien d'écorce). Au premier palier, le tunnel d'entrée ramène à la forêt ;
   aux suivants, une corde remonte à la surface depuis la salle d'arrivée.
   Le butin : des rochers (pierre), des veines de cuivre, de rares veines d'or, et des coffres au trésor ; plus on
   descend, plus il y en a. La grotte change à chaque visite : rien n'est gardé dans la sauvegarde.
   Étape 1.13, morceau 1 : au dernier palier, le fond est l'antre du Gardien d'écorce, une salle dessinée à la main tout
   en haut (10 × 8), au sol moussu, aux grosses racines le long des parois ; ni butin ni autre monstre dedans (antre). */
import { G, part } from "./formes.js";
import { rockMesh } from "./rochers.js";

export const W = 30, D = 32;
const cx = x => x - W / 2 + .5, cz = z => z - D / 2 + .5;
export const gtile = (wx, wz) => { const x = Math.floor(wx + W / 2), z = Math.floor(wz + D / 2); return x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1; };
export const gcx = i => cx(i % W), gcz = i => cz(Math.floor(i / W));
export const PALIERS = 3;
/* Combien de choses à chaque palier (à régler en jouant) */
const BUTIN = p => ({rochers: 4 + p * 2, cuivre: 2 + p, or: p - 1, tresors: p === PALIERS ? 2 : 1});

/* ----- Le plan du palier en cours ----- */
let plan = null;          // {palier, sol, objets (case → sorte), passages, depart, porte, salles, visite}
let visites = 0;
export const palierEnCours = () => plan && plan.palier;
/* Le numéro du palier tiré en dernier : il change à chaque palier, à chaque visite (les monstres s'en servent) */
export const visiteEnCours = () => plan ? plan.visite : 0;
function genere(palier){
  const rnd = Math.random;                         // la grotte change à chaque visite (bible)
  const sol = new Uint8Array(W * D);
  const creuse = (x0, z0, x1, z1) => {
    for(let z = Math.max(1, Math.min(z0, z1)); z <= Math.min(D - 2, Math.max(z0, z1)); z++)
      for(let x = Math.max(1, Math.min(x0, x1)); x <= Math.min(W - 2, Math.max(x0, x1)); x++) sol[z * W + x] = 1;
  };
  /* la salle d'arrivée, dessinée à la main : 8 × 6, en bas, au milieu */
  const A = {x0: W / 2 - 4, z0: D - 9, x1: W / 2 + 3, z1: D - 4};
  creuse(A.x0, A.z0, A.x1, A.z1);
  if(palier === 1) for(let z = A.z1; z < D; z++){ sol[z * W + W / 2 - 1] = 1; sol[z * W + W / 2] = 1; }   // le tunnel d'entrée, jusqu'au bord
  /* au dernier palier, l'antre du Gardien d'écorce, dessinée à la main, tout en haut */
  const antre = palier === PALIERS ? {x0: W / 2 - 5, z0: 1, x1: W / 2 + 4, z1: 8} : null;
  if(antre) creuse(antre.x0, antre.z0, antre.x1, antre.z1);
  /* les autres salles, au hasard, sans se toucher */
  const salles = antre ? [A, antre] : [A];
  for(let essai = 0; essai < 80 && salles.length < 6; essai++){
    const w = 5 + Math.floor(rnd() * 4), d = 4 + Math.floor(rnd() * 4);
    const x0 = 1 + Math.floor(rnd() * (W - w - 2)), z0 = 1 + Math.floor(rnd() * (D - d - 12));
    const s = {x0, z0, x1: x0 + w - 1, z1: z0 + d - 1};
    if(salles.some(o => s.x0 <= o.x1 + 2 && s.x1 >= o.x0 - 2 && s.z0 <= o.z1 + 2 && s.z1 >= o.z0 - 2)) continue;
    salles.push(s); creuse(s.x0, s.z0, s.x1, s.z1);
  }
  /* les couloirs (2 cases de large) : chaque salle se relie à la plus proche de celles déjà reliées */
  const centre = s => [Math.floor((s.x0 + s.x1) / 2), Math.floor((s.z0 + s.z1) / 2)];
  const dist = (a, b) => { const [ax, az] = centre(a), [bx, bz] = centre(b); return Math.hypot(ax - bx, az - bz); };
  const reliees = [A];
  for(const s of salles.slice(1).sort((a, b) => dist(a, A) - dist(b, A))){
    const t = reliees.reduce((m, o) => dist(o, s) < dist(m, s) ? o : m, reliees[0]);
    const [ax, az] = centre(t), [bx, bz] = centre(s);
    if(rnd() < .5){ creuse(ax, az, bx, az + 1); creuse(bx, az, bx + 1, bz); }
    else { creuse(ax, az, ax + 1, bz); creuse(ax, bz, bx, bz + 1); }
    reliees.push(s);
  }
  /* le fond : la salle la plus loin de l'arrivée ; le trou pour descendre (sauf au dernier palier) */
  const fond = antre || salles.slice(1).reduce((m, s) => dist(s, A) > dist(m, A) ? s : m, salles[1] || A);
  const [fx, fz] = centre(fond), passages = [];
  if(palier < PALIERS) passages.push({x: cx(fx) + .5, z: cz(fz) + .5, vers: "bas"});
  /* l'arrivée : par le tunnel au premier palier ; aux suivants, au pied de l'échelle, avec la corde qui remonte */
  const depart = palier === 1 ? null : {x: cx(W / 2) - .5, z: cz(A.z0 + 3)};
  if(palier > 1) passages.push({x: cx(A.x0 + 1), z: cz(A.z0 + 1), vers: "haut"});
  /* le butin : dans les salles, loin des bords (on peut toujours en faire le tour), jamais dans la salle d'arrivée */
  const places = [];
  for(const s of salles.slice(1)) if(s !== antre) for(let z = s.z0 + 1; z < s.z1; z++) for(let x = s.x0 + 1; x < s.x1; x++){
    const i = z * W + x;
    if(passages.some(p => Math.hypot(gcx(i) - p.x, gcz(i) - p.z) < 1.6)) continue;
    places.push(i);
  }
  for(let i = places.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [places[i], places[j]] = [places[j], places[i]]; }
  const objets = new Map(), b = BUTIN(palier);
  const poser = (n, sorte) => { for(let k = 0; k < n && places.length; k++) objets.set(places.pop(), sorte); };
  poser(b.tresors, "tresor"); poser(b.or, "rockOr"); poser(b.cuivre, "rockCuivre"); poser(b.rochers, "rock");
  /* des champignons qui luisent (la Lanterne des bois du carnet), le long des parois : de quoi se repérer */
  const lueurs = [];
  for(let n = 0; n < 40 && lueurs.length < 10; n++){
    const i = Math.floor(rnd() * W * D), x = i % W, z = Math.floor(i / W);
    if(!sol[i] || objets.has(i) || ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => !sol[(z + c) * W + x + a])) continue;
    lueurs.push(i);
  }
  return {palier, sol, objets, passages, depart, porte: palier === 1, lueurs, salles, antre, visite: ++visites, rnd: [...Array(W * D)].map(() => rnd())};
}

/* ----- Ce qu'il y a sur une case ; le miner, l'ouvrir ----- */
export const grotteObj = i => plan && plan.objets.get(i) || null;
const meshes = new Map();
let group = null;
export const grotteMesh = i => meshes.get(i) || null;
export function setGrotteObj(i, o){
  if(o) return;                                    // on ne pose rien dans la grotte
  plan.objets.delete(i);
  if(meshes.has(i)){ group.remove(meshes.get(i)); meshes.delete(i); }
}
/* Les modèles : rochers (rochers.js, la veine d'or en plus), coffre au trésor */
const OR = 0xF2C14E;
function objetMesh(i, o){
  let m;
  if(o === "tresor"){
    m = new THREE.Group();
    m.add(part(G.box, 0x7A4E2A, .7, .4, .5, 0, .2, 0));
    const couvercle = part(G.cyl, 0x8A5A32, .5, .7, .5, 0, .42, 0); couvercle.rotation.z = Math.PI / 2; couvercle.scale.set(.5, .7, .5); m.add(couvercle);
    for(const x of [-.25, .25]) m.add(part(G.box, OR, .06, .46, .52, x, .25, 0));
    m.add(part(G.box, OR, .1, .12, .04, 0, .32, -.26));
    m.rotation.y = plan.rnd[i] * .6 - .3;
  } else {
    m = rockMesh(o === "rockOr" ? "rock" : o, plan.rnd[i]);
    if(o === "rockOr") [[.28, .32, .16], [-.2, .42, .22], [.04, .5, -.22], [-.28, .2, -.12]].forEach(([x, y, z]) =>
      m.add(part(G.dode, new THREE.MeshLambertMaterial({color: OR, emissive: 0x6B4A00, emissiveIntensity: .6}), .22, .16, .22, x, y, z)));
    m.rotation.y = i * 2.4;
  }
  m.position.set(gcx(i), 0, gcz(i));
  group.add(m); meshes.set(i, m);
}

/* ----- La grotte dans la scène des intérieurs (construite à chaque palier) ----- */
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
/* La lumière du personnage : la torche (chaude, loin) ou, sans torche, juste un peu autour de soi */
const lueur = new THREE.PointLight(0xFFB060, 1.5, 7.5, 1.4);
export function eclaire(x, z, torche, t){
  const f = torche ? 1 + Math.sin(t * 13) * .05 + Math.sin(t * 7.3) * .04 : 1;   // la flamme vacille
  lueur.position.set(x, 1.3, z);
  lueur.color.setHex(torche ? 0xFFB060 : 0x8C9AB4);
  lueur.intensity = (torche ? 1.6 : .9) * f;
  lueur.distance = torche ? 7.5 : 3.2;
}
export function makeGrotte(palier){
  plan = genere(palier);
  group = new THREE.Group(); meshes.clear();
  const {sol} = plan, estSol = (x, z) => x >= 0 && z >= 0 && x < W && z < D && sol[z * W + x];
  /* le sol de terre sombre */
  const cases = [];
  for(let i = 0; i < W * D; i++) if(sol[i]) cases.push(i);
  const fond = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .2, 1), new THREE.MeshLambertMaterial({color: 0xffffff}), cases.length), col = new THREE.Color();
  const dansAntre = (x, z) => plan.antre && x >= plan.antre.x0 && x <= plan.antre.x1 && z >= plan.antre.z0 && z <= plan.antre.z1;
  cases.forEach((i, k) => { m4.makeTranslation(gcx(i), -.1, gcz(i)); fond.setMatrixAt(k, m4);
    fond.setColorAt(k, col.setHex(dansAntre(i % W, Math.floor(i / W)) ? ((i + Math.floor(i / W)) % 2 ? 0x3E4630 : 0x454E34) : (i + Math.floor(i / W)) % 2 ? 0x4A3A2E : 0x52412F)); });   // l'antre : un sol moussu
  fond.instanceColor.needsUpdate = true; fond.receiveShadow = true; group.add(fond);
  /* les parois : des blocs de roche arrondis tout autour ; ceux de devant restent bas pour voir dedans */
  const murs = [];
  for(let z = 0; z < D; z++) for(let x = 0; x < W; x++){
    if(estSol(x, z)) continue;
    let pres = false;
    for(let c = -1; c <= 1 && !pres; c++) for(let a = -1; a <= 1; a++) if(estSol(x + a, z + c)){ pres = true; break; }
    if(pres) murs.push([x, z]);
  }
  const paroi = new THREE.InstancedMesh(G.dode, new THREE.MeshLambertMaterial({color: 0xffffff}), murs.length);
  murs.forEach(([x, z], k) => {
    const tunnel = plan.porte && z > D - 4 && (x === W / 2 - 2 || x === W / 2 + 1);   // les parois du tunnel d'entrée restent basses : on voit la sortie
    const r = plan.rnd[z * W + x], devant = estSol(x, z - 1) || tunnel, h = devant ? .5 : 1.8 + r * 1.1;
    q.setFromAxisAngle(v.set(0, 1, 0), r * 6.28);
    m4.compose(v.set(cx(x) + (r - .5) * .2, h * .42, cz(z) + (r - .5) * .2), q, s3.set(1.5, h, 1.5));
    paroi.setMatrixAt(k, m4); paroi.setColorAt(k, col.setHex(r < .5 ? 0x4E453E : 0x5A5047));
  });
  paroi.instanceColor.needsUpdate = true; group.add(paroi);
  /* des racines qui pendent le long des parois hautes (on est sous la forêt) */
  murs.forEach(([x, z]) => {
    const r = plan.rnd[z * W + x];
    if(r > .12 || estSol(x, z - 1)) return;
    const rac = part(G.cyl, 0x5A4030, .08, 1.4, .08, cx(x) + (r - .06) * 4, 1.4, cz(z) + .5); rac.rotation.z = (r - .06) * 4; group.add(rac);
  });
  /* l'antre du Gardien : de grosses racines qui descendent des parois et rampent sur le sol */
  if(plan.antre){
    const a = plan.antre, RACINE = 0x5A4030;
    for(let x = a.x0; x <= a.x1; x += 2){
      const r = plan.rnd[x], h = 1.6 + r * .8, rac = part(G.cyl, RACINE, .2, h, .2, cx(x) + .3, h / 2, cz(a.z0) - .2); rac.rotation.z = (r - .5) * .5; group.add(rac);
      const sol = part(G.cyl, RACINE, .16, 1.4, .16, cx(x) + .3, .08, cz(a.z0) + .5); sol.rotation.x = Math.PI / 2 - .12; group.add(sol);
    }
    for(const x of [a.x0, a.x1]) for(let z = a.z0 + 1; z < a.z1; z += 3){
      const rac = part(G.cyl, RACINE, .16, 1.2, .16, cx(x) + (x === a.x0 ? .5 : -.5), .08, cz(z)); rac.rotation.z = Math.PI / 2; rac.rotation.y = (plan.rnd[z] - .5) * .6; group.add(rac);
    }
  }
  /* les champignons lumineux */
  const luit = new THREE.MeshLambertMaterial({color: 0x9AF0B0, emissive: 0x3AC870, emissiveIntensity: .9});
  for(const i of plan.lueurs){
    const r = plan.rnd[i], x = gcx(i) + (r - .5) * .5, z = gcz(i) + (r - .5) * .5;
    group.add(part(G.cyl, 0xE8E0D0, .05, .14, .05, x, .07, z));
    const chapeau = part(G.hair, luit, .55, .5, .55, x, .13, z); chapeau.castShadow = false; group.add(chapeau);
  }
  /* les passages : le trou qui descend (une échelle y plonge), la corde qui remonte à la surface */
  for(const p of plan.passages){
    if(p.vers === "bas"){
      const trou = new THREE.Mesh(new THREE.CircleGeometry(.55, 20), new THREE.MeshBasicMaterial({color: 0x050404}));
      trou.rotation.x = -Math.PI / 2; trou.position.set(p.x, .012, p.z); group.add(trou);
      for(let k = 0; k < 10; k++){ const a = k / 10 * 6.28; group.add(part(G.dode, 0x6A5E52, .3, .18, .3, p.x + Math.cos(a) * .65, .05, p.z + Math.sin(a) * .65)); }
      for(const dx of [-.18, .18]) group.add(part(G.box, 0x8A5A32, .05, .9, .05, p.x + dx, .25, p.z - .35));
      for(const y of [.1, .35, .6]) group.add(part(G.box, 0x8A5A32, .4, .04, .04, p.x, y, p.z - .35));
    } else {
      group.add(part(G.cyl, 0xC8A878, .04, 3, .04, p.x, 1.5, p.z));                       // la corde
      for(const y of [.4, .9, 1.4]) group.add(part(G.head, 0xB8986A, .25, .2, .25, p.x, y, p.z));   // ses nœuds
      const halo = new THREE.Mesh(new THREE.CircleGeometry(.6, 20), new THREE.MeshBasicMaterial({color: 0xFFF4D0, transparent: true, opacity: .25, depthWrite: false}));
      halo.rotation.x = -Math.PI / 2; halo.position.set(p.x, .013, p.z); group.add(halo);   // un rond de jour qui tombe d'en haut
    }
  }
  if(plan.depart) for(const dx of [-.2, .2]) group.add(part(G.box, 0x8A5A32, .05, 2.4, .05, plan.depart.x + dx, 1.2, plan.depart.z - .6));   // l'échelle d'arrivée, derrière soi
  /* le tunnel d'entrée : étayé de bois, avec des planches au bord (la sortie vers la forêt) */
  if(plan.porte){
    for(const z of [D / 2 - 2.5, D / 2 - .8]) for(const x of [-1.15, 1.15]) group.add(part(G.box, 0x6B4A2F, .18, 1.8, .18, x, .9, z));
    group.add(part(G.box, 0x8A5A3B, 2, .03, .6, 0, .015, D / 2 - .3));
  }
  /* le butin */
  for(const [i, o] of plan.objets) objetMesh(i, o);
  group.add(lueur);
  /* noir et silencieux : seule la torche met du chaud (bible) */
  return {group, w: W, d: D, doorX: plan.porte ? 0 : null, walk, passages: plan.passages, depart: plan.depart,
    fond: 0x050407, light: 0x8090A8, power: .06, sky: 0x2A2E3A, ground: 0x0E0B08, hemi: .14};   // pas de brume : la pénombre vient de la lumière
}
/* Les tanières des monstres (étape 1.8) : le milieu de n salles tirées au hasard, jamais la salle d'arrivée ni l'antre
   du Gardien ; une salle chacun ; {x, z} dans le monde */
export function tanieres(n){
  const out = [], salles = plan.salles.slice(1).filter(s => s !== plan.antre).sort(() => Math.random() - .5);
  for(const s of salles){
    if(out.length >= n) break;
    for(let essai = 0; essai < 12; essai++){
      const x = s.x0 + 1 + Math.floor(Math.random() * Math.max(1, s.x1 - s.x0 - 1)), z = s.z0 + 1 + Math.floor(Math.random() * Math.max(1, s.z1 - s.z0 - 1));
      if(walk(cx(x), cz(z))){ out.push({x: cx(x), z: cz(z)}); break; }
    }
  }
  return out;
}
/* Où se tient le Gardien d'écorce : au fond de son antre (au dernier palier), sinon null */
export const antre = () => plan && plan.antre ? {x: cx((plan.antre.x0 + plan.antre.x1) / 2), z: cz(plan.antre.z0 + 2)} : null;
/* Où l'on marche : le sol, sans les rochers ni les coffres */
export function walk(x, z){
  const i = gtile(x, z);
  return i >= 0 && !!plan.sol[i] && !plan.objets.has(i);
}
