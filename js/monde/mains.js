/* ================= Les mains à la première personne (morceau B2, demande de Yo, 13 octobre 2026) =================
   « … le mode première personne où l'on voit uniquement les mains du joueur et les armes et objets qu'il a en main. »
   À la première personne (vue.js), les mains sont dessinées par-dessus le monde, dans leur propre petite scène, avec
   leur propre caméra : elles ne rentrent jamais dans un mur et gardent la même taille en portrait et en paysage.
   - La main droite, toujours là, tient ce qu'on a en main (le même modèle que vu de dessus : outils3d.js) ; la main
     gauche n'apparaît qu'avec la torche ou la lanterne à main ; avec l'arc (à deux mains), la gauche tient l'arc et la
     droite tire la corde.
   - Elles se balancent en marchant, respirent au repos, traînent un peu quand on tourne la tête, et bougent à chaque
     geste : elles suivent la main du personnage (angleMain : l'épée qui s'abat, la canne qu'on lance, la pelle, la prise
     qu'on lève) ; chaque coup d'outil a son geste (gesteOutil, appelé par usure.js : la hache et la pioche frappent,
     l'arrosoir verse, le filet balaie, le bocal puise, l'arc se bande) ; le bouton d'action à mains nues tend la main
     (gesteAction, recolte.js : cueillir, ramasser, planter, ouvrir) ; changer d'outil : la main descend et remonte avec
     le nouveau.
   - Leur lumière suit celle du lieu (le ciel et le soleil dehors, la pénombre dedans) ; la torche et la lanterne les
     éclairent d'une lueur chaude.
   - À la pêche, le fil part du bout de la canne qu'on voit à l'écran (boutFPS, pour peche.js). */
import { G, part } from "./formes.js";
import { makeOutil } from "./outils3d.js";
import { OUTILS } from "../donnees.js";
import { renderer, camera, hemi as hemiIle, sun } from "./scene.js";
import { hemiDedans, lampeDedans } from "./interieurs.js";
import { outilTenu, angleMain, mainGauche, allure } from "./personnage.js";

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(50, 1, .01, 5);
const ciel = new THREE.HemisphereLight(0xffffff, 0x6B5A4A, .7);
const soleil = new THREE.DirectionalLight(0xFFF1DC, .5);
soleil.position.set(-.4, 1, .7);
const feu = new THREE.PointLight(0xFFB060, 0, 1.4, 1.4);    // la lueur de la torche sur les mains
scene.add(ciel, soleil, soleil.target, feu);

const PEAU = 0xF2C9A0, MANCHE = 0xE0654F, REVERS = 0xF4EFE6;
/* Un bras : g se place à l'écran ; p, le poignet, tourne comme la main du personnage (son devant regarde droit devant) */
function bras(cote){
  const g = new THREE.Group(), p = new THREE.Group();
  p.rotation.y = Math.PI;
  g.add(p);
  p.add(part(G.head, PEAU, .62, .56, .66, 0, 0, 0));                          // un poing rond
  p.add(part(G.head, PEAU, .3, .27, .32, .1 * cote, .05, .09));              // le pouce, du côté du milieu de l'écran
  const r = part(G.cyl, REVERS, .31, .07, .31, 0, -.15, -.08); r.rotation.x = 1.05; p.add(r);   // le revers de la manche
  const m = part(G.cyl, MANCHE, .26, .55, .26, 0, -.3, -.32); m.rotation.x = 1.05; p.add(m);    // la manche, vers le bas de l'écran
  p.traverse(o => { o.castShadow = o.receiveShadow = false; });
  scene.add(g);
  return {g, p, objet: null, k: undefined};
}
const D = bras(1), Gc = bras(-1);

/* La torche et la lanterne de la main gauche (comme vues de dessus : personnage.js) */
const FLAMME = new THREE.MeshLambertMaterial({color: 0xFFB347, emissive: 0xFF8A1E, emissiveIntensity: 1});
const COEUR = new THREE.MeshLambertMaterial({color: 0xFFF2B0, emissive: 0xFFE070, emissiveIntensity: 1});
const VERRE = new THREE.MeshLambertMaterial({color: 0xFFF2C0, emissive: 0xFFC860, emissiveIntensity: 1});
function torcheModele(){
  const g = new THREE.Group();
  g.add(part(G.cyl, 0x7A4E2A, .06, .5, .06, 0, .2, .04));
  const f = part(G.head, FLAMME, .3, .48, .3, 0, .5, .04); f.name = "flamme";
  g.add(f, part(G.head, COEUR, .16, .28, .16, 0, .47, .04));
  return g;
}
function lanterneModele(){
  const g = new THREE.Group();
  g.add(part(G.cyl, 0xC8743C, .025, .16, .025, 0, -.08, .04));               // l'anse
  g.add(part(G.cone4, 0xC8743C, .22, .09, .22, 0, -.17, .04));               // le chapeau
  g.add(part(G.box, VERRE, .15, .19, .15, 0, -.3, .04));                     // le verre qui luit
  g.add(part(G.box, 0xC8743C, .18, .03, .18, 0, -.41, .04));                 // le fond
  g.position.set(-.26, .04, .2);                                             // tenue devant le poing, vers le milieu, pour qu'on la voie
  return g;
}
const MODELES_G = {torche: torcheModele, lanterne: lanterneModele};

/* Ce que tient un bras (k : une clé d'outil, « torche », « lanterne », ou rien) */
function tenir(b, k, faire){
  if(b.k === k) return false;
  if(b.objet){ b.p.remove(b.objet); b.objet = null; }
  b.k = k;
  if(k){ b.objet = faire(k); b.objet.traverse(o => { o.castShadow = o.receiveShadow = false; }); b.p.add(b.objet); }
  return true;
}
const famille = k => k && OUTILS[k] && OUTILS[k].famille;

/* ----- Les gestes ----- */
let geste = null, nGestes = 0;                     // {sorte, t, T}
const DUREE = {frappe: .42, verse: .9, balaie: .5, puise: .5, tend: .42, tir: .75};
function lancer(sorte){ geste = {sorte, t: 0, T: DUREE[sorte]}; nGestes++; }
/* Un coup d'outil (usure.js) : la hache et la pioche frappent, l'arrosoir verse, le filet balaie, le bocal puise, l'arc
   se bande ; la canne, la pelle et l'épée ont déjà leur mouvement (angleMain) */
const GESTE_OUTIL = {hache: "frappe", pioche: "frappe", arrosoir: "verse", filet: "balaie", bocal: "puise", arc: "tir"};
export function gesteOutil(k){ const s = GESTE_OUTIL[famille(k)]; if(s) lancer(s); }
/* Le bouton d'action (recolte.js) : si l'action n'a pas fait de geste d'outil, la main se tend (cueillir, ramasser…) */
const SANS_TENDRE = new Set(["canne", "pelle"]);
export const compteGestes = () => nGestes;
export function gesteAction(avant){ if(nGestes === avant && !SANS_TENDRE.has(famille(D.k))) lancer("tend"); }
/* Le mouvement du geste au temps u (de 0 à 1) : rx tourne le poignet vers l'avant, ry de côté, dx, dy, dz le déplacent */
const lisse = x => x * x * (3 - 2 * x);
function mouvement(){
  const o = {rx: 0, ry: 0, dx: 0, dy: 0, dz: 0, corde: 0};
  if(!geste) return o;
  const u = geste.t / geste.T;
  switch(geste.sorte){
    case "frappe":                                  // on lève, on abat, on revient
      o.rx = u < .28 ? -.9 * lisse(u / .28) : u < .5 ? -.9 + 2.2 * lisse((u - .28) / .22) : 1.3 * (1 - lisse((u - .5) / .5));
      o.dy = u < .28 ? .03 * lisse(u / .28) : u < .5 ? .03 - .07 * lisse((u - .28) / .22) : -.04 * (1 - lisse((u - .5) / .5));
      break;
    case "verse": { const k = u < .25 ? lisse(u / .25) : u < .7 ? 1 : 1 - lisse((u - .7) / .3); o.rx = 1.1 * k; o.dz = -.04 * k; break; }
    case "balaie": { const k = Math.sin(u * Math.PI); o.ry = .9 - 1.8 * lisse(u); o.dz = -.06 * k; o.rx = .4 * k; break; }
    case "puise": { const k = Math.sin(u * Math.PI); o.rx = .8 * k; o.dz = -.08 * k; o.dy = -.03 * k; break; }
    case "tend": { const k = Math.sin(u * Math.PI); o.dz = -.13 * k; o.dy = -.035 * k; o.dx = -.03 * k; o.rx = .5 * k; break; }
    case "tir":                                     // la corde tirée en arrière, lâchée, la main revient
      o.corde = u < .45 ? lisse(u / .45) : u < .55 ? 1 - (u - .45) / .1 : 0;
      o.dz = .09 * o.corde; break;
  }
  return o;
}

/* ----- Chaque image, à la première personne (main.js) ----- */
let t = 0, pas = 0, change = 0, lacet = null, traine = 0, actif = false;
const dir = new THREE.Vector3();
export function updateMains(dt, dedans){
  actif = true;
  t += dt;
  cam.aspect = camera.aspect; cam.updateProjectionMatrix();
  /* ce qu'on tient : l'arc passe dans la main gauche ; sinon la gauche tient la torche ou la lanterne */
  const k = outilTenu() || null, arc = famille(k) === "arc";
  const kd = arc ? null : k, kg = arc ? k : mainGauche();
  if(tenir(D, kd, makeOutil)) change = .3;
  tenir(Gc, kg, x => MODELES_G[x] ? MODELES_G[x]() : makeOutil(x));
  Gc.g.visible = !!kg;
  if(geste){ geste.t += dt; if(geste.t >= geste.T) geste = null; }
  if(change > 0) change = Math.max(0, change - dt);
  /* la place à l'écran : la même en portrait et en paysage (le petit côté de l'écran compte) */
  const z = .55, hh = z * Math.tan(cam.fov * Math.PI / 360), hw = hh * cam.aspect, c = Math.min(hh, hw), s = c * 1.25;
  /* la marche, le souffle, la tête qui tourne */
  const al = allure();
  pas += dt * 9.5 * al;
  const bx = Math.sin(pas) * .012 * al, by = -Math.abs(Math.cos(pas)) * .014 * al + Math.sin(t * 1.7) * .003;
  camera.getWorldDirection(dir);
  const a = Math.atan2(dir.x, dir.z);
  if(lacet === null) lacet = a;
  let da = a - lacet; da = Math.atan2(Math.sin(da), Math.cos(da)); lacet = a;
  traine += (Math.max(-.05, Math.min(.05, da / Math.max(dt, .001) * .02)) - traine) * Math.min(1, dt * 8);
  const m = mouvement(), bas = -.55 * c * lisse(change / .3);   // un nouvel outil : la main remonte du bas de l'écran
  /* la main droite */
  D.g.position.set((arc ? .2 : .58) * c + bx + traine + m.dx, -.48 * c + by + m.dy + bas, -z + m.dz);
  D.g.scale.setScalar(s);
  D.g.rotation.set(0, 0, arc ? .15 : .28);
  D.p.rotation.set((arc ? .35 : angleMain()) + m.rx, Math.PI + m.ry, 0);
  if(arc) D.g.position.z += m.corde * .09 - .04;
  /* la main gauche */
  Gc.g.position.set((arc ? -.25 : -.58) * c + bx + traine, (arc ? -.3 : kg === "lanterne" ? -.4 : -.48) * c + by, -z + (arc ? -.06 : 0));
  Gc.g.scale.setScalar(s);
  Gc.g.rotation.set(0, 0, arc ? -.05 : -.28);
  Gc.p.rotation.set(arc ? .1 : .3, Math.PI + (arc ? -.25 : 0), 0);
  /* la torche vacille, et éclaire les mains */
  const fl = Gc.objet && Gc.objet.getObjectByName("flamme");
  if(fl){ const f = 1 + Math.sin(t * 17) * .12 + Math.sin(t * 9.3) * .08; fl.scale.set(.3 * f, .48 * (2 - f), .3 * f); }
  const lueur = kg === "torche" || kg === "lanterne";
  feu.intensity = lueur ? 1.9 + Math.sin(t * 13) * .2 : 0;
  feu.position.set(Gc.g.position.x, Gc.g.position.y + .08, Gc.g.position.z + .05);
  /* la lumière du lieu */
  const h = dedans ? hemiDedans : hemiIle, l = dedans ? lampeDedans : sun;
  ciel.color.copy(h.color); ciel.groundColor.copy(h.groundColor); ciel.intensity = h.intensity * 1.05;
  soleil.color.copy(l.color); soleil.intensity = l.intensity * .75;
}
/* Dessine les mains par-dessus le monde (main.js, après le monde) */
export function dessinerMains(){
  const auto = renderer.autoClear;
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(scene, cam);
  renderer.autoClear = auto;
}
export function mainsInactives(){ actif = false; lacet = null; geste = null; }
/* À la pêche : le bout de la canne vu à l'écran, ramené dans le monde à un pas devant les yeux (peche.js) */
const ndc = new THREE.Vector3(), ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
export function boutFPS(out){
  if(!actif || !D.objet) return false;
  const b = D.objet.getObjectByName("bout");
  if(!b) return false;
  scene.updateMatrixWorld();
  b.getWorldPosition(ndc); ndc.project(cam);
  camera.updateMatrixWorld();
  ray.setFromCamera(v2.set(ndc.x, ndc.y), camera);
  out.copy(ray.ray.origin).addScaledVector(ray.ray.direction, .9);
  return true;
}
/* Pour la vérification : ce que les mains tiennent */
export const mainsIci = () => ({actif, droite: D.k, gauche: Gc.g.visible ? Gc.k : null, geste: geste && geste.sorte});
