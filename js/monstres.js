/* ================= Les monstres (étape 1.8) =================
   Bible : « chaque attaque de monstre s'annonce par un signe (il se ramasse, grogne, brille) : on gagne en
   observant » ; style : « rond et doux pour le refuge, pointu et anguleux pour le danger » ; « le danger se voit
   toujours venir » (leurs yeux luisent dans le noir). Grand Carnet, la grotte de la Forêt profonde (MONSTRES) :
   - le loup chasse en meute et encercle : la meute tourne autour du personnage, chacun à sa place, et un seul
     attaque à la fois ; son signe : il grogne (« Grrr… » au-dessus de lui) et baisse la tête, puis il bondit ;
     après son bond, il reprend son souffle : le moment de frapper. Touché, il recule ;
   - le sanglier se place face au personnage, gratte le sol (de la poussière vole), puis charge tout droit : on
     roule sur le côté. S'il fonce dans une paroi, il reste étourdi (des étoiles tournent) : le moment de frapper.
     Lourd, il ne recule pas sous les coups. Dans la Forêt profonde, la nuit, c'est un gibier (chasse.js) : touché
     à l'arc, il se retourne et charge (enrager) ; trop loin, il se calme et s'en va ;
   - les chauves-souris dorment, pendues dans leur salle ; réveillées, elles volent en essaim autour du personnage ;
     elles fuient la lumière de la torche (elles restent loin) ; sans torche, l'une après l'autre, elles couinent
     (« Couic ! ») puis piquent sur lui ; elles remontent lentement : le moment de frapper. Un coup suffit.
   Chaque palier a ses bandes (PALIER_MONSTRES), chacune dans sa salle ; elles changent à chaque visite, comme la
   grotte. Vaincu : ce qu'il laisse va dans le sac (MONSTRES.donne), il s'inscrit au carnet (state.carnet.monstres ;
   le sanglier de la forêt : son trophée de gibier, state.carnet.gibier). Le personnage, ses cœurs et ses coups :
   combat.js.
   Étape 1.13, morceau 1 : le Gardien d'écorce (Grand Carnet : « esprit de l'arbre au fond de la grotte ; ses racines
   s'illuminent sous le sol »), au fond du dernier palier, à chaque visite. Il dort jusqu'à ce qu'on approche, puis, tour
   à tour : de loin, un cercle s'illumine sous le personnage (ses racines) et elles en jaillissent ; de près, il lève ses
   branches et balaie. Après chaque attaque, il reprend son souffle : le moment de frapper. Vaincu, il laisse un cœur de
   bois, et la première fois la carte du Marais (state.cartes). */
import { interior } from "./monde/interieurs.js";
import { G, part } from "./monde/formes.js";
import { MONSTRES, PALIER_MONSTRES, GIBIER, CARTES, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace } from "./regles.js";
import { player } from "./monde/personnage.js";
import { tanieres, walk as walkGrotte, visiteEnCours, palierEnCours, antre } from "./monde/grotte.js";
import { walk as walkForet } from "./monde/foret.js";
import { toast, renderHUD } from "./interface.js";

const groupe = new THREE.Group(); interior.add(groupe); groupe.visible = false;
const monstres = [];      // {k, x, y, z, ang, vie, etat, t, mesh, bulle, home, cible, pause, flash, recul, mord, tour, sens, dir, alpha, grp, foret}
let milieu = null;        // "grotte" ou "foret"
const walk = (x, z) => milieu === "foret" ? walkForet(x, z) : walkGrotte(x, z);
const leNom = (k, maj) => { const L = MONSTRES[k], s = `${L.une ? "la" : "le"} ${L.nom.toLowerCase()}`; return maj ? s[0].toUpperCase() + s.slice(1) : s; };

/* ----- Les modèles : pointus et anguleux, les yeux qui luisent (la tête vers -z) ----- */
const JAUNE = 0xFFD54A, ROUGE = 0xFF4A3A, ORANGE = 0xFF9A3A;
function matieres(){ const mats = {}; return {mats, m: hex => mats[hex] || (mats[hex] = new THREE.MeshLambertMaterial({color: hex}))}; }
function pattesDe(corps, m, couleur, h, pos){
  return pos.map(([x, z]) => {
    const piv = new THREE.Group(); piv.position.set(x, h, z);
    piv.add(part(G.box, m(couleur), .08, h, .08, 0, -h / 2, 0));
    corps.add(piv); return piv;
  });
}
function yeuxDe(tete, couleur, y, z, e, s = 1){
  const yeux = new THREE.MeshBasicMaterial({color: couleur});
  for(const x of [-e, e]){ const o = part(G.box, yeux, .075 * s, .04 * s, .03, x, y, z); o.castShadow = false; tete.add(o); }
  return yeux;
}
function loupMesh(){
  const g = new THREE.Group(), {mats, m} = matieres(), corps = new THREE.Group(), tete = new THREE.Group();
  const GRIS = 0xA3A9B2, FONCE = 0x5C626B, CLAIR = 0xDCDFE3;             // clair, pour se détacher de la terre sombre
  g.add(corps);
  corps.add(part(G.dode, m(GRIS), .5, .46, 1, 0, .5, .02));                                   // le corps
  corps.add(part(G.dode, m(CLAIR), .36, .36, .4, 0, .45, -.3));                                // le poitrail
  for(const [z, h] of [[-.25, .2], [-.05, .24], [.15, .18]]){                                  // le poil hérissé du dos
    const pic = part(G.cone4, m(FONCE), .14, h, .14, 0, .66 + h / 2, z); pic.rotation.x = .5; corps.add(pic);
  }
  const queue = part(G.cone4, m(GRIS), .15, .55, .15, 0, .56, .62); queue.rotation.x = 1.9; corps.add(queue);
  tete.position.set(0, .66, -.5); corps.add(tete);
  tete.add(part(G.dode, m(GRIS), .36, .32, .38, 0, 0, 0));
  const museau = part(G.cone4, m(FONCE), .17, .34, .17, 0, -.05, -.27); museau.rotation.x = -Math.PI / 2; tete.add(museau);
  tete.add(part(G.box, m(0x1C1C1C), .07, .06, .06, 0, -.05, -.44));                           // la truffe
  for(const x of [-.1, .1]) tete.add(part(G.cone4, m(GRIS), .1, .2, .07, x, .2, .04));        // les oreilles pointues
  const yeux = yeuxDe(tete, JAUNE, .05, -.17, .085);
  const pattes = pattesDe(corps, m, FONCE, .38, [[-.13, -.3], [.13, -.3], [-.13, .32], [.13, .32]]);
  g.scale.setScalar(1.05);
  g.userData = {corps, tete, pattes, yeux, oeil: JAUNE, mats: [...Object.values(mats), yeux]};
  return g;
}
function sanglierMesh(){
  const g = new THREE.Group(), {mats, m} = matieres(), corps = new THREE.Group(), tete = new THREE.Group();
  const BRUN = 0x8E6E56, FONCE = 0x4E3A2C, GROIN = 0xB8968A, IVOIRE = 0xF2EAD8;     // assez clair pour se voir dans le noir
  g.add(corps);
  corps.add(part(G.dode, m(BRUN), .62, .56, 1, 0, .46, .04));                                  // le corps, massif
  corps.add(part(G.dode, m(BRUN), .58, .5, .5, 0, .5, -.28));                                  // les épaules
  for(const [z, h] of [[-.34, .26], [-.14, .3], [.06, .24], [.24, .18]]){                     // la crinière hérissée
    const pic = part(G.cone4, m(FONCE), .16, h, .16, 0, .7 + h / 2, z); pic.rotation.x = .35; corps.add(pic);
  }
  const queue = part(G.cone4, m(FONCE), .06, .22, .06, 0, .5, .58); queue.rotation.x = 2.3; corps.add(queue);
  tete.position.set(0, .44, -.56); corps.add(tete);
  tete.add(part(G.dode, m(BRUN), .42, .38, .44, 0, 0, 0));
  const groin = part(G.cyl, m(GROIN), .17, .16, .17, 0, -.06, -.26); groin.rotation.x = Math.PI / 2; tete.add(groin);
  for(const s of [-1, 1]){
    const def = part(G.cone4, m(IVOIRE), .06, .2, .06, s * .1, -.04, -.26); def.rotation.set(-.4, 0, s * -.5); tete.add(def);   // les défenses
    const o = part(G.cone4, m(FONCE), .1, .16, .06, s * .12, .2, .06); o.rotation.z = s * -.4; tete.add(o);                      // les oreilles
  }
  const yeux = yeuxDe(tete, ORANGE, .07, -.17, .1, .9);
  const pattes = pattesDe(corps, m, FONCE, .3, [[-.16, -.32], [.16, -.32], [-.16, .34], [.16, .34]]);
  /* les étoiles quand il est étourdi */
  const etoiles = new THREE.Group(), or = new THREE.MeshBasicMaterial({color: 0xFFE070});
  for(let k = 0; k < 3; k++){ const e = part(G.dode, or, .1, .1, .1, Math.cos(k * 2.1) * .3, 0, Math.sin(k * 2.1) * .3); e.castShadow = false; etoiles.add(e); }
  etoiles.position.set(0, 1.05, -.45); etoiles.visible = false; g.add(etoiles);
  g.scale.setScalar(1.05);
  g.userData = {corps, tete, pattes, yeux, oeil: ORANGE, etoiles, mats: [...Object.values(mats), yeux, or]};
  return g;
}
/* L'aile d'une chauve-souris : une membrane festonnée, à plat */
const AILE = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, .04); s.lineTo(.3, .1); s.lineTo(.36, -.02); s.quadraticCurveTo(.3, -.04, .27, -.1);
  s.quadraticCurveTo(.21, -.05, .17, -.12); s.quadraticCurveTo(.11, -.05, .06, -.1); s.lineTo(0, -.05);
  const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2);
  return geo;
})();
function chauveMesh(){
  const g = new THREE.Group(), {mats, m} = matieres(), corps = new THREE.Group(), tete = new THREE.Group();
  const CORPS = 0x76668A, AILES = new THREE.MeshLambertMaterial({color: 0x9A88B0, side: THREE.DoubleSide});
  g.add(corps);
  corps.add(part(G.dode, m(CORPS), .2, .22, .3, 0, 0, .02));
  tete.position.set(0, .04, -.15); corps.add(tete);
  tete.add(part(G.dode, m(CORPS), .17, .16, .15, 0, 0, 0));
  for(const x of [-.05, .05]) tete.add(part(G.cone4, m(CORPS), .06, .12, .04, x, .1, 0));    // les oreilles pointues
  const yeux = yeuxDe(tete, ROUGE, .01, -.07, .035, .55);
  const ailes = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * .08, .02, 0); piv.scale.x = s;
    const a = new THREE.Mesh(AILE, AILES); a.castShadow = true; piv.add(a);
    corps.add(piv); return piv;
  });
  g.userData = {corps, tete, ailes, yeux, oeil: ROUGE, pattes: [], mats: [...Object.values(mats), AILES, yeux]};
  return g;
}
/* Le Gardien d'écorce : un tronc massif à l'écorce sombre, deux yeux verts qui luisent, une couronne de branches
   pointues et de mousse, deux bras-branches, des racines au pied (environ 2,5 P) */
function gardienMesh(){
  const g = new THREE.Group(), {mats, m} = matieres(), corps = new THREE.Group(), tete = new THREE.Group();
  const ECORCE = 0x6A4A32, FONCE = 0x3E2A1C, MOUSSE = 0x5E7A3A;
  g.add(corps);
  corps.add(part(G.cyl, m(ECORCE), .95, 1.5, .85, 0, .75, 0));                                // le tronc
  corps.add(part(G.cyl, m(ECORCE), 1.15, .35, 1.05, 0, .17, 0));                              // son pied, plus large
  for(const [x, z, r] of [[-.4, -.2, .1], [.38, -.25, -.1], [0, -.44, 0], [-.2, .38, .2], [.3, .35, -.2]]){   // l'écorce en lames
    const l = part(G.box, m(FONCE), .1, 1.2, .08, x, .8, z); l.rotation.y = Math.atan2(x, z); l.rotation.z = r; corps.add(l);
  }
  tete.position.set(0, 1.15, -.42); corps.add(tete);
  tete.add(part(G.box, m(FONCE), .5, .07, .04, 0, -.22, 0));                                  // la bouche, une fente sombre
  const yeux = yeuxDe(tete, 0x9AF060, 0, 0, .17, 1.6);
  for(const [x, y, z, s] of [[0, 1.75, 0, 1.1], [-.4, 1.6, .1, .8], [.42, 1.62, -.05, .85], [0, 1.95, .3, .7]])   // la couronne de mousse
    corps.add(part(G.dode, m(MOUSSE), .7 * s, .55 * s, .7 * s, x, y, z));
  for(const [x, z, rz, rx, h] of [[-.3, -.1, .6, 0, .9], [.32, 0, -.6, 0, .85], [0, .25, 0, -.6, .8], [-.1, -.3, .2, .5, .7], [.2, .2, -.3, -.3, .6]]){   // les branches pointues
    const b = part(G.cone4, m(FONCE), .14, h, .14, x, 2.05 + h / 3, z); b.rotation.set(rx, 0, rz); corps.add(b);
  }
  const bras = [-1, 1].map(s => {                                                                // les bras-branches
    const piv = new THREE.Group(); piv.position.set(s * .5, 1.3, 0);
    const b = part(G.cone4, m(FONCE), .16, .9, .16, s * .1, -.4, 0); b.rotation.z = s * .25; piv.add(b);
    for(const [dy, a] of [[-.55, .8], [-.75, -.5]]){ const d = part(G.cone4, m(FONCE), .07, .3, .07, s * .18, dy, 0); d.rotation.z = s * a; piv.add(d); }   // les doigts
    corps.add(piv); return piv;
  });
  for(let k = 0; k < 5; k++){ const a = k / 5 * 6.28 + .3, r = part(G.cone4, m(FONCE), .16, .9, .16, Math.cos(a) * .6, .08, Math.sin(a) * .6); r.rotation.set(0, -a, Math.PI / 2); corps.add(r); }   // les racines au pied
  g.userData = {corps, tete, bras, pattes: [], yeux, oeil: 0x9AF060, mats: [...Object.values(mats), yeux]};
  return g;
}
const MODELES = {loup: loupMesh, sanglier: sanglierMesh, chauveSouris: chauveMesh, gardien: gardienMesh};
/* Le modèle d'un monstre, aussi pour le sanglier de la chasse (chasse.js) */
export const modeleMonstre = k => MODELES[k]();

/* Les mots au-dessus d'eux pendant leur signe (le loup grogne, la chauve-souris couine) */
const MOTS = {};
function mot(texte, couleur){
  if(MOTS[texte]) return MOTS[texte];
  const c = document.createElement("canvas"); c.width = 128; c.height = 64;
  const x = c.getContext("2d");
  x.font = "bold 36px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineWidth = 7; x.strokeStyle = "#1C2230"; x.strokeText(texte, 64, 34);
  x.fillStyle = couleur; x.fillText(texte, 64, 34);
  return MOTS[texte] = new THREE.CanvasTexture(c);
}
const SIGNE_MOT = {loup: () => mot("Grrr…", "#FF7A5A"), chauveSouris: () => mot("Couic !", "#F4C8FF")};
/* La poussière que le sanglier soulève en grattant le sol */
const POUSSIERE = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d");
  for(const [px, py, r] of [[24, 36, 16], [40, 32, 14], [32, 24, 12]]){
    const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, "rgba(176,150,120,.9)"); gr.addColorStop(1, "rgba(176,150,120,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
})();
const nuages = [];        // {s (sprite), t}
function soulever(x, z){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: POUSSIERE, transparent: true, depthWrite: false}));
  s.position.set(x, .1, z); s.scale.set(.35, .35, 1); groupe.add(s); nuages.push({s, t: 0});
}
function nuagesVolent(dt){
  for(const n of [...nuages]){
    n.t += dt; n.s.position.y += dt * .5; n.s.scale.setScalar(.35 + n.t * .6); n.s.material.opacity = Math.max(0, 1 - n.t / .7);
    if(n.t >= .7){ groupe.remove(n.s); n.s.material.dispose(); nuages.splice(nuages.indexOf(n), 1); }
  }
}

/* ----- Ajouter, retirer ----- */
function ajouter(k, x, z, grp, foret){
  const mesh = MODELES[k]();
  const bulle = new THREE.Sprite(new THREE.SpriteMaterial({map: SIGNE_MOT[k] ? SIGNE_MOT[k]() : null, transparent: true, depthTest: false}));
  bulle.scale.set(.9, .45, 1); bulle.visible = false; bulle.renderOrder = 5;
  groupe.add(mesh, bulle);
  const g = grp || {k, membres: [], base: Math.random() * 6.28, attaquant: null};
  const m = {k, x, y: k === "chauveSouris" ? 2.1 : 0, z, ang: Math.random() * 6.28, vie: MONSTRES[k].vie, etat: k === "chauveSouris" ? "dort" : "rode", t: 0, mesh, bulle,
    home: {x, z}, cible: null, pause: Math.random() * 2, flash: 0, recul: null, mord: false, tour: 1 + Math.random() * 2, sens: 1, dir: 0,
    alpha: 1, grp: g, foret: !!foret, ph: Math.random() * 6.28};
  g.membres.push(m); monstres.push(m);
  poser(m, 0, 0);
  return m;
}
function retirer(m){
  groupe.remove(m.mesh, m.bulle);
  m.mesh.userData.mats.forEach(x => x.dispose()); m.bulle.material.dispose();
  monstres.splice(monstres.indexOf(m), 1);
  const g = m.grp; g.membres.splice(g.membres.indexOf(m), 1);
  if(g.attaquant === m) g.attaquant = null;
}
function vider(){
  for(const m of [...monstres]) retirer(m); for(const n of nuages) groupe.remove(n.s); nuages.length = 0;
  for(const e of effets){ groupe.remove(e.cercle); if(e.pics) groupe.remove(e.pics); } effets.length = 0;
}
/* Les bandes d'un palier, chacune dans sa salle, ses membres autour de la tanière */
function peupler(palier){
  const a = antre();                                   // le Gardien d'écorce, endormi au fond de son antre (étape 1.13)
  if(a){ const g = ajouter("gardien", a.x, a.z); g.etat = "dort"; g.ang = Math.PI / 2; }
  const bandes = PALIER_MONSTRES[palier] || [], lieux = tanieres(bandes.length);
  bandes.forEach(([k, n], j) => {
    const t = lieux[j];
    if(!t) return;
    const g = {k, membres: [], base: Math.random() * 6.28, attaquant: null};
    for(let i = 0; i < n; i++){
      const a = i / n * 6.28 + Math.random(), r = i ? .8 + Math.random() * .5 : 0, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
      ajouter(k, walk(x, z) ? x : t.x, walk(x, z) ? z : t.z, g);
    }
  });
}

/* ----- Se déplacer : en contournant les parois ; jamais sur le personnage ----- */
const PRES = .62;
function avancer(m, ang, v, dt, regarde, colle){
  for(const da of [0, .5, -.5, 1, -1, 1.6, -1.6]){
    const a = ang + da, nx = m.x + Math.cos(a) * v * dt, nz = m.z + Math.sin(a) * v * dt;
    if(walk(nx, nz) && (colle || Math.hypot(nx - player.position.x, nz - player.position.z) > PRES)){
      m.x = nx; m.z = nz; m.ang = regarde === undefined ? a : regarde;
      return true;
    }
  }
  return false;
}
/* Il rôde autour de sa tanière ; renvoie la vitesse des pattes */
function roder(m, dt){
  if(m.pause > 0){ m.pause -= dt; return 0; }
  if(!m.cible) for(let essai = 0; essai < 6 && !m.cible; essai++){
    const a = Math.random() * 6.28, r = .6 + Math.random() * 2, x = m.home.x + Math.cos(a) * r, z = m.home.z + Math.sin(a) * r;
    if(walk(x, z)) m.cible = {x, z};
  }
  if(!m.cible){ m.pause = 1.5; return 0; }
  const dx = m.cible.x - m.x, dz = m.cible.z - m.z, dd = Math.hypot(dx, dz);
  if(dd < .1 || !avancer(m, Math.atan2(dz, dx), .9, dt)){ m.cible = null; m.pause = 1.5 + Math.random() * 3; return 0; }
  return 8;
}
/* Toute la bande a repéré le personnage ; la première fois de la visite, on explique leur signe (en peu de mots :
   le message ne doit pas cacher les monstres, au-dessus du personnage) */
const presentes = new Set();
const CONSEIL = {
  loup: "🐺 Des loups ! L'un grogne : roule sur le côté (🤸). Il souffle : frappe (⚔️)",
  sanglier: "🐗 Un sanglier ! Il gratte le sol : roule sur le côté (🤸). Étourdi : frappe (⚔️)",
  chauveSouris: "🦇 Des chauves-souris ! Elles fuient la torche. L'une couine : roule (🤸)",
  gardien: "🌳 Le Gardien d'écorce s'éveille ! Un cercle s'illumine sous toi : écarte-toi (🤸). Il lève ses branches : recule. Puis frappe (⚔️)"
};
function alerter(m){
  for(const o of m.grp.membres) if(o.etat === "rode" || o.etat === "dort"){ o.etat = o.k === "chauveSouris" ? "vole" : "approche"; o.t = 0; }
  if(!presentes.has(m.k) && !m.foret){ presentes.add(m.k); toast(CONSEIL[m.k], 4200); }
}
/* Il perd le personnage de vue : il retourne à sa tanière ; le sanglier de la forêt s'en va */
function calmer(m){
  if(m.foret){ m.etat = "part"; m.t = 0; toast("🐗 Le sanglier s'est calmé : il s'éloigne dans les bois.", 3000); return; }
  m.etat = m.k === "chauveSouris" ? "rentre" : "rode"; m.cible = null; m.t = 0;
  if(m.grp.attaquant === m) m.grp.attaquant = null;
}

/* ----- Chacun sa façon de se battre ; renvoie la vitesse des pattes (ou des ailes) ----- */
function loup(m, L, d, versP, dt, blesser){
  const g = m.grp, p = player.position;
  if(m.etat === "rode"){ if(d < L.flair) alerter(m); else return roder(m, dt); }
  if(m.etat === "approche"){                           // il vient vers le personnage
    if(d > L.flair * 2.2){ calmer(m); return 0; }
    if(d > L.tourne + .3){ avancer(m, versP, L.vitesse, dt); return 16; }
    m.etat = "tourne"; m.t = 0;
  }
  if(m.etat === "tourne"){                             // la meute encercle : chacun sa place autour de lui
    if(d > L.tourne + 1.8){ m.etat = "approche"; m.t = 0; return 0; }
    const vivants = g.membres.filter(o => o.etat !== "tombe"), n = vivants.length, i = vivants.indexOf(m);
    const a = n > 1 ? g.base + i * 2 * Math.PI / n : Math.atan2(m.z - p.z, m.x - p.x) + m.sens * .6;
    const tx = p.x + Math.cos(a) * L.tourne, tz = p.z + Math.sin(a) * L.tourne, dd = Math.hypot(tx - m.x, tz - m.z);
    let vit = 0;
    if(dd > .12){ if(avancer(m, Math.atan2(tz - m.z, tx - m.x), Math.min(L.vitesse * .8, dd / dt), dt, versP)) vit = 11; else m.sens = -m.sens; }
    m.ang = versP;
    if(m.t > m.tour && (!g.attaquant || g.attaquant === m)){ g.attaquant = m; m.etat = "signe"; m.t = 0; }   // un seul attaque à la fois
    return vit;
  }
  if(m.etat === "signe"){                              // le signe : il grogne et baisse la tête
    m.ang = versP;
    if(m.t > L.signe){ m.etat = "bond"; m.t = 0; m.mord = false; m.dir = versP; }
    return 0;
  }
  if(m.etat === "bond"){                               // il bondit, droit devant lui : on ne le dévie plus
    const nx = m.x + Math.cos(m.dir) * L.bond.v * dt, nz = m.z + Math.sin(m.dir) * L.bond.v * dt;
    if(walk(nx, nz) && Math.hypot(nx - p.x, nz - p.z) > .45){ m.x = nx; m.z = nz; }
    if(!m.mord && Math.hypot(m.x - p.x, m.z - p.z) < .85){ m.mord = true; blesser(L.degats, m); }
    if(m.t > L.bond.t){ m.etat = "souffle"; m.t = 0; }
    return 22;
  }
  if(m.etat === "souffle" && m.t > L.souffle){         // il reprend son souffle : le moment de frapper
    m.etat = "tourne"; m.t = 0; m.tour = 1 + Math.random() * 1.5;
    if(g.attaquant === m) g.attaquant = null;
  }
  return 0;
}
function sanglier(m, L, d, versP, dt, blesser){
  const p = player.position;
  if(m.etat === "rode"){ if(d < L.flair) alerter(m); else return roder(m, dt); }
  if(m.etat === "approche"){                           // il se place face au personnage
    if(d > (m.foret ? 14 : L.flair * 2.4)){ calmer(m); return 0; }
    m.ang = versP;
    if(d > L.distance + .5){ avancer(m, versP, L.vitesse, dt, versP); return 10; }
    if(m.t > .5){ m.etat = "signe"; m.t = 0; }
    return 0;
  }
  if(m.etat === "signe"){                              // le signe : il gratte le sol
    m.ang = versP;
    if(Math.floor(m.t * 5) !== Math.floor((m.t - dt) * 5)) soulever(m.x + Math.cos(m.ang) * .45, m.z + Math.sin(m.ang) * .45);
    if(m.t > L.signe){ m.etat = "charge"; m.t = 0; m.mord = false; m.dir = versP; }
    return 0;
  }
  if(m.etat === "charge"){                             // il charge tout droit ; une paroi l'arrête net
    const nx = m.x + Math.cos(m.dir) * L.charge.v * dt, nz = m.z + Math.sin(m.dir) * L.charge.v * dt;
    if(!walk(nx, nz)){
      m.etat = "etourdi"; m.t = 0;
      if(!presentes.has("etourdi")){ presentes.add("etourdi"); toast("💫 Le sanglier est étourdi : frappe-le !", 2200); }
      return 0;
    }
    m.x = nx; m.z = nz;
    if(Math.floor(m.t * 8) !== Math.floor((m.t - dt) * 8)) soulever(m.x, m.z);
    if(!m.mord && Math.hypot(m.x - p.x, m.z - p.z) < .8){ m.mord = true; blesser(L.degats, m); }
    if(m.t > L.charge.t){ m.etat = "freine"; m.t = 0; }
    return 26;
  }
  if(m.etat === "freine"){                             // il freine, puis se retourne
    const f = Math.max(0, 1 - m.t / .35), nx = m.x + Math.cos(m.dir) * L.charge.v * .5 * f * dt, nz = m.z + Math.sin(m.dir) * L.charge.v * .5 * f * dt;
    if(walk(nx, nz)){ m.x = nx; m.z = nz; }
    if(m.t > L.souffle){ m.etat = "approche"; m.t = 0; }
    return 0;
  }
  if(m.etat === "etourdi" && m.t > L.etourdi){ m.etat = "approche"; m.t = 0; }
  if(m.etat === "part"){ m.alpha -= dt / 1.2; avancer(m, versP + Math.PI, 1.5, dt); if(m.alpha <= 0) retirer(m); return 8; }
  return 0;
}
function chauve(m, L, d, versP, dt, blesser){
  const g = m.grp, p = player.position, torche = state.torche > 0;
  if(m.etat === "dort"){ if(d < L.flair) alerter(m); return 0; }
  const voler = (tx, tz, v, ty) => {                   // elles volent par-dessus les rochers, pas à travers les parois
    const dx = tx - m.x, dz = tz - m.z, dd = Math.hypot(dx, dz);
    if(dd > .05) avancer(m, Math.atan2(dz, dx), Math.min(v, dd / dt), dt, undefined, true);
    m.y += (ty - m.y) * Math.min(1, dt * 3);
  };
  if(m.etat === "rentre"){                             // elle retourne dormir dans sa salle
    voler(m.home.x, m.home.z, L.vitesse, 2.1);
    if(Math.hypot(m.x - m.home.x, m.z - m.home.z) < .2){ m.etat = "dort"; m.t = 0; }
    if(d < L.flair){ m.etat = "vole"; m.t = 0; }
    return 1;
  }
  if(m.etat === "vole"){                               // l'essaim tourne autour : loin de la torche, tout près sans elle
    if(d > L.flair * 2.6){ calmer(m); return 1; }
    const vivants = g.membres.filter(o => o.etat !== "tombe"), n = vivants.length, i = vivants.indexOf(m);
    const a = g.base * 1.7 + i * 2 * Math.PI / n, r = torche ? L.loin : L.tourne;
    voler(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, L.vitesse, 1.5 + Math.sin(m.t * 3 + m.ph) * .15);
    if(!torche && m.t > m.tour && !g.attaquant){ g.attaquant = m; m.etat = "signe"; m.t = 0; }
    return 1;
  }
  if(m.etat === "signe"){                              // le signe : un couinement aigu, sur place
    m.ang = versP;
    if(torche){ m.etat = "vole"; m.t = 0; g.attaquant = null; return 1; }   // une torche s'allume : elle s'enfuit
    if(m.t > L.signe){ m.etat = "pique"; m.t = 0; m.mord = false; m.dir = versP; }
    return 1;
  }
  if(m.etat === "pique"){                              // elle pique sur lui
    const nx = m.x + Math.cos(m.dir) * L.pique.v * dt, nz = m.z + Math.sin(m.dir) * L.pique.v * dt;
    if(walk(nx, nz)){ m.x = nx; m.z = nz; }
    m.y += (.7 - m.y) * Math.min(1, dt * 9);
    if(!m.mord && Math.hypot(m.x - p.x, m.z - p.z) < .7){ m.mord = true; blesser(L.degats, m); }
    if(m.t > L.pique.t){ m.etat = "remonte"; m.t = 0; }
    return 1;
  }
  if(m.etat === "remonte"){                            // elle remonte lentement : le moment de frapper
    m.y += (1.5 - m.y) * dt * 1.2;
    if(m.t > L.souffle){ m.etat = "vole"; m.t = 0; m.tour = 1.2 + Math.random() * 2; if(g.attaquant === m) g.attaquant = null; }
  }
  return 1;
}
/* ----- Le Gardien d'écorce (étape 1.13) : ses racines, qu'on voit s'illuminer avant qu'elles jaillissent ----- */
const effets = [];        // {cercle, pics, t, x, z}
const LUEUR = new THREE.MeshBasicMaterial({color: 0x9AF060, transparent: true, opacity: .4, depthWrite: false});
function illuminer(x, z, r){
  const cercle = new THREE.Group();
  const disque = new THREE.Mesh(new THREE.CircleGeometry(r, 24), LUEUR.clone()); disque.rotation.x = -Math.PI / 2; disque.position.y = .015; cercle.add(disque);
  for(let k = 0; k < 5; k++){                                                                    // les racines qui luisent sous la terre
    const l = new THREE.Mesh(new THREE.PlaneGeometry(.07, r * 1.7), disque.material); l.rotation.set(-Math.PI / 2, 0, k / 5 * Math.PI); l.position.y = .02; cercle.add(l);
  }
  cercle.position.set(x, 0, z); groupe.add(cercle);
  const e = {cercle, disque, pics: null, t: 0, x, z, r}; effets.push(e);
  return e;
}
function jaillir(e){
  e.pics = new THREE.Group(); e.t = 0;
  for(let k = 0; k < 7; k++){
    const a = k / 7 * 6.28, d = k ? e.r * .6 : 0, p = part(G.cone4, 0x5A4030, .22, 1, .22, Math.cos(a) * d, .5, Math.sin(a) * d);
    p.rotation.set((Math.random() - .5) * .5, 0, (Math.random() - .5) * .5); e.pics.add(p);
  }
  e.pics.position.set(e.x, -1, e.z); groupe.add(e.pics);
}
function effetsVivent(dt){
  for(const e of [...effets]){
    e.t += dt;
    if(!e.pics){ e.disque.material.opacity = .3 + .3 * Math.abs(Math.sin(e.t * 9)); continue; }   // le cercle palpite : attention !
    e.cercle.visible = false;
    e.pics.position.y = e.t < .12 ? -1 + e.t / .12 : e.t < .5 ? 0 : -(e.t - .5) / .3;            // elles jaillissent, puis rentrent sous terre
    if(e.t > .8){ groupe.remove(e.cercle, e.pics); e.disque.material.dispose(); effets.splice(effets.indexOf(e), 1); }
  }
}
function gardien(m, L, d, versP, dt, blesser){
  const p = player.position, u = m.mesh.userData;
  const bras = a => u.bras.forEach((b, n) => { b.rotation.z += ((n ? -1 : 1) * a - b.rotation.z) * Math.min(1, dt * 10); });
  if(m.etat === "dort"){                               // endormi, les yeux éteints
    u.yeux.color.setHex(0x2E4A20);
    if(d < L.flair){ m.etat = "approche"; m.t = 0; if(!presentes.has("gardien")){ presentes.add("gardien"); toast(CONSEIL.gardien, 5600); } }
    return 0;
  }
  if(m.etat === "approche"){                           // il se tourne vers lui, avance lentement, puis choisit son attaque
    m.ang = versP; bras(0);
    if(d > L.flair * 2.5){ m.etat = "dort"; m.t = 0; return 0; }
    if(d > L.balaie.portee - .2) avancer(m, versP, L.vitesse, dt, versP);
    if(m.t > L.pause){
      m.attaque = d < L.balaie.portee ? "balaie" : "racines"; m.etat = "signe"; m.t = 0; m.mord = false;
      if(m.attaque === "racines") m.racine = illuminer(p.x, p.z, L.racines.r);   // le signe : le sol s'illumine sous lui
    }
    return 0;
  }
  if(m.etat === "signe"){
    m.ang = versP;
    if(m.attaque === "balaie"){ bras(-2.2); if(m.t > L.balaie.signe){ m.etat = "frappe"; m.t = 0; } }   // il lève ses branches
    else if(m.t > L.racines.signe){ jaillir(m.racine); m.etat = "frappe"; m.t = 0; }
    return 0;
  }
  if(m.etat === "frappe"){
    if(m.attaque === "balaie"){                        // il balaie devant lui
      bras(.9);
      if(!m.mord && d < L.balaie.portee){ m.mord = true; blesser(L.degats, m); }
      if(m.t > .35){ m.etat = "souffle"; m.t = 0; }
    } else {                                          // les racines jaillissent : il ne fallait pas rester dans le cercle
      const e = m.racine;
      if(!m.mord && e && Math.hypot(p.x - e.x, p.z - e.z) < e.r){ m.mord = true; blesser(L.racines.degats, e); }
      if(m.t > L.racines.t){ m.etat = "souffle"; m.t = 0; }
    }
    return 0;
  }
  if(m.etat === "souffle"){ bras(.3); if(m.t > L.souffle){ m.etat = "approche"; m.t = 0; } }   // il reprend son souffle : le moment de frapper
  return 0;
}
const COMPORTE = {loup, sanglier, chauveSouris: chauve, gardien};

/* ----- Ce que fait chaque monstre, à chaque image ; blesser(degats, monstre) : il touche le personnage ----- */
function vivre(m, dt, actif, blesser){
  m.flash = Math.max(0, m.flash - dt);
  if(m.etat === "tombe"){                             // vaincu : il tombe (sur le flanc, ou du plafond), puis s'efface
    m.t += dt;
    if(m.k === "chauveSouris") m.y = Math.max(.1, m.y - dt * 4);
    else m.mesh.rotation.z = Math.min(1, m.t / .35) * Math.PI / 2;
    if(m.t > .9){ m.alpha -= dt / .6; for(const x of m.mesh.userData.mats){ x.transparent = true; x.opacity = Math.max(0, m.alpha); } }
    if(m.alpha <= 0){ retirer(m); return; }
    m.bulle.visible = false; m.mesh.position.set(m.x, m.y, m.z);
    if(m.mesh.userData.etoiles) m.mesh.userData.etoiles.visible = false;
    return;
  }
  if(!actif){ poser(m, 0, 0); return; }               // un panneau ouvert, un changement de lieu : tout attend
  m.t += dt;
  const L = MONSTRES[m.k], p = player.position, d = Math.hypot(m.x - p.x, m.z - p.z), versP = Math.atan2(p.z - m.z, p.x - m.x);
  let vit = 0;
  if(m.etat === "recul"){                              // touché : il recule sous le coup
    const f = Math.max(0, 1 - m.t / .3), nx = m.x + m.recul.vx * f * dt, nz = m.z + m.recul.vz * f * dt;
    if(walk(nx, nz)){ m.x = nx; m.z = nz; }
    if(m.t > .4){ m.etat = "tourne"; m.t = 0; m.tour = .5 + Math.random(); }
  } else vit = COMPORTE[m.k](m, L, d, versP, dt, blesser);
  if(monstres.includes(m)) poser(m, vit, dt);
}
/* Le modèle à sa place : les pattes (ou les ailes), le signe (tête basse, corps ramassé, yeux rouges), l'éclair
   blanc quand il est touché */
function poser(m, vit, dt){
  const u = m.mesh.userData, signe = m.etat === "signe", k = Math.min(1, dt * 12);
  const charge = m.etat === "bond" || m.etat === "charge" || m.etat === "pique";
  u.pattes.forEach((piv, n) => {
    const gratte = signe && m.k === "sanglier" && n === 0;            // le sanglier gratte le sol d'une patte avant
    piv.rotation.x = gratte ? -.4 + Math.sin(m.t * 22) * .7 : vit ? Math.sin(m.t * vit + (n % 2) * Math.PI) * .7 : 0;
  });
  if(m.k === "chauveSouris"){
    const dort = m.etat === "dort", bat = dort ? 0 : Math.sin(m.t * (signe ? 30 : 18) + m.ph);
    u.ailes.forEach(a => { a.rotation.z = dort ? -1.2 : bat * .8; a.scale.z = dort ? .6 : 1; });
    m.mesh.rotation.x = dort ? Math.PI : 0;                           // elle dort la tête en bas
    m.mesh.position.set(m.x, dort ? 2.1 : m.y, m.z);
  } else {
    const souffle = m.etat === "souffle" || m.etat === "freine";
    u.tete.rotation.x += ((signe ? .5 : souffle ? .25 : 0) - u.tete.rotation.x) * k;
    u.corps.position.y += ((signe ? -.07 : 0) + (souffle ? Math.sin(m.t * 14) * .015 : 0) - u.corps.position.y) * k;
    const tremble = signe ? Math.sin(m.t * 55) * .02 : 0;
    m.mesh.position.set(m.x + tremble, 0, m.z);
    if(u.etoiles){ u.etoiles.visible = m.etat === "etourdi"; u.etoiles.rotation.y = m.t * 5; }
  }
  if(m.etat !== "dort" || m.k !== "gardien") u.yeux.color.setHex(signe || charge ? ROUGE : u.oeil);
  for(const x of u.mats) if(x.emissive) x.emissive.setScalar(m.flash > 0 ? .9 : 0);
  m.mesh.rotation.y = -m.ang - Math.PI / 2;
  if(m.etat === "part") for(const x of u.mats){ x.transparent = true; x.opacity = Math.max(0, m.alpha); }
  m.bulle.visible = signe && !!SIGNE_MOT[m.k];
  if(m.bulle.visible) m.bulle.position.set(m.x, (m.k === "chauveSouris" ? m.y + .5 : 1.25) + Math.sin(m.t * 20) * .03, m.z);
}

/* ----- Les coups du personnage (combat.js) ----- */
let vaincus = 0;
const visable = m => m.etat !== "tombe" && m.etat !== "dort" && m.etat !== "part";
/* Le monstre le plus proche à moins de r : {m, d}, ou null (une chauve-souris qui dort au plafond est hors d'atteinte) */
export function plusProche(r){
  const p = player.position;
  let best = null, bd = r;
  for(const m of monstres){
    if(!visable(m)) continue;
    const d = Math.hypot(m.x - p.x, m.z - p.z);
    if(d < bd){ bd = d; best = m; }
  }
  return best && {m: best, d: bd};
}
/* Un coup d'épée : n dégâts ; (dx, dz) le sens du coup. Le loup recule, sauf lancé (le signe, le bond) ; le
   sanglier, lourd, ne recule jamais */
export function frapper(m, n, dx, dz){
  if(!monstres.includes(m) || !visable(m)) return;
  m.vie -= n; m.flash = .16;
  if(m.vie <= 0){ vaincre(m); return; }
  if(m.etat === "rode") alerter(m);
  if(m.k !== "loup" || m.etat === "signe" || m.etat === "bond") return;
  if(m.grp.attaquant === m) m.grp.attaquant = null;
  m.etat = "recul"; m.t = 0; m.recul = {vx: dx * 3.2, vz: dz * 3.2};
}
/* Vaincu : il tombe ; ce qu'il laisse va dans le sac ; il s'inscrit au carnet */
function vaincre(m){
  m.etat = "tombe"; m.t = 0; m.bulle.visible = false; vaincus++;
  if(m.grp.attaquant === m) m.grp.attaquant = null;
  const L = MONSTRES[m.k], donne = m.foret ? {...GIBIER.sanglier.donne, [m.fleche || "fleche"]: 1} : L.donne, gains = [];
  let perdu = false;
  for(const [k, n] of Object.entries(donne)){
    const q = Math.min(n, sacPlace(k));
    if(q > 0){ sacAdd(k, q); gains.push(`+${q} ${(q > 1 ? objet(k).pluriel : objet(k).nom).toLowerCase()}`); }
    if(q < n) perdu = true;
  }
  const c = m.foret ? state.carnet.gibier : state.carnet.monstres, e = c[m.k] || (c[m.k] = {n: 0}), nouveau = !e.n;
  e.n++;
  if(m.racine && effets.includes(m.racine)){ groupe.remove(m.racine.cercle); effets.splice(effets.indexOf(m.racine), 1); }
  const carte = L.carte && !(state.cartes && state.cartes[L.carte]);         // la carte de la destination suivante : une seule fois
  if(carte) (state.cartes || (state.cartes = {}))[L.carte] = Date.now();
  save(); renderHUD();
  if(carte){ toast(`🗺️ ${leNom(m.k, true)} s'effondre… et laisse la ${CARTES[L.carte].nom.toLowerCase()} ! Elle est rangée dans ton carnet (🗺️ Cartes).${gains.length ? " " + gains.join(", ") + "." : ""}`, 6500); return; }
  toast(`${L.emoji} ${leNom(m.k, true)} est vaincu${L.une ? "e" : ""}${gains.length ? " : " + gains.join(", ") : ""}.` +
    `${perdu ? " Ton sac est plein : le reste est perdu." : ""}${nouveau ? (m.foret ? " 🏆 Nouveau trophée au carnet !" : " 👹 Nouveau monstre au carnet !") : ""}`, 3600);
}

/* ----- Le sanglier de la forêt, touché à l'arc (chasse.js) : il se retourne et charge ----- */
export function enrager(x, z, vie, fleche = "fleche"){
  const m = ajouter("sanglier", x, z, null, true);
  m.vie = vie; m.etat = "approche"; m.t = 0; m.fleche = fleche;       // la flèche qui l'a touché, rendue à la fin
  return m;
}

/* ----- À chaque image (combat.js) : ou = "grotte", "foret" ou null ; actif = le jeu n'attend pas ----- */
let vu = 0, enPause = false;
export function updateMonstres(dt, ou, actif, blesser){
  if(ou !== milieu){                                   // on change de lieu : ceux d'avant disparaissent
    vider(); milieu = ou; vu = 0;
    if(ou !== "grotte") presentes.clear();
  }
  groupe.visible = !!ou;
  if(!ou) return;
  if(ou === "grotte" && visiteEnCours() !== vu){       // un nouveau palier : ses bandes, chacune dans sa salle
    vu = visiteEnCours();
    vider();
    if(!enPause) peupler(palierEnCours());
  }
  if(actif){ const bandes = new Set(monstres.map(m => m.grp)); for(const g of bandes) g.base += dt * .35; }   // la meute tourne lentement
  for(const m of [...monstres]) if(monstres.includes(m)) vivre(m, dt, actif, blesser);
  nuagesVolent(dt);
  if(actif) effetsVivent(dt);
}
/* Ceux qui se battent encore (le combat de la forêt s'arrête quand il n'y en a plus) */
export const monstresIci = () => monstres.filter(visable);
/* Vaincu dans la forêt : le sanglier ne poursuit pas jusqu'à l'orée */
export function oublierMonstres(){ vider(); }

/* ----- Pour la vérification automatique ----- */
export const monstresVaincus = () => vaincus;
export const racinesIci = () => effets.length;
export const gardienIci = () => monstres.some(m => m.k === "gardien");
/* Plus de monstres : ceux qui sont là s'en vont, aucun n'arrive aux paliers suivants */
export function pauseMonstres(oui){ enPause = oui; if(oui) vider(); }
/* Un monstre à un endroit précis, dans un état donné (sinon : il rôde, ou il dort) */
export function lacherMonstre(k, x, z, etat){
  const m = ajouter(k, x, z);
  if(etat){ m.etat = etat; m.t = 0; m.dir = Math.atan2(player.position.z - z, player.position.x - x); if(k === "chauveSouris") m.y = 1.5; }
  return m;
}
