/* ================= Les monstres de la grotte (étape 1.8) =================
   Bible : « chaque attaque de monstre s'annonce par un signe (il se ramasse, grogne, brille) : on gagne en
   observant » ; style : « rond et doux pour le refuge, pointu et anguleux pour le danger » ; « le danger se voit
   toujours venir » (leurs yeux luisent dans le noir).
   Morceau 2 (décidé avec Yo) : le loup, seul, pour essayer le combat. Il rôde dans sa salle ; il repère le
   personnage (MONSTRES.loup.flair), approche, tourne autour de lui, puis grogne et baisse la tête (le signe, avec un
   « Grrr… » au-dessus de lui) et bondit pour mordre : c'est le moment de rouler sur le côté. Après son bond, il
   reprend son souffle : c'est le moment de frapper. Un coup d'épée le fait reculer, sauf quand il est lancé (le
   signe et le bond). Un loup au premier palier, un de plus à chaque palier, chacun dans sa salle ; ils changent à
   chaque visite, comme la grotte. La meute, le sanglier, les chauves-souris, ce qu'ils laissent et la page du carnet
   viendront au morceau 3. Le personnage, ses cœurs et ses coups : combat.js. */
import { interior } from "./monde/interieurs.js";
import { G, part } from "./monde/formes.js";
import { MONSTRES } from "./donnees.js";
import { player } from "./monde/personnage.js";
import { tanieres, walk, visiteEnCours, palierEnCours } from "./monde/grotte.js";
import { toast } from "./interface.js";

const groupe = new THREE.Group(); interior.add(groupe); groupe.visible = false;
const monstres = [];      // {k, x, z, ang, vie, etat, t, mesh, bulle, home, cible, pause, flash, recul, mord, tour, sens, dir, alpha}

/* ----- Le loup : gris, pointu et anguleux, les yeux jaunes qui luisent (la tête vers -z) ----- */
const JAUNE = 0xFFD54A, ROUGE = 0xFF4A3A;
function loupMesh(){
  const g = new THREE.Group(), mats = {}, m = hex => mats[hex] || (mats[hex] = new THREE.MeshLambertMaterial({color: hex}));
  const GRIS = 0xA3A9B2, FONCE = 0x5C626B, CLAIR = 0xDCDFE3;           // clair, pour se détacher de la terre sombre
  const yeux = new THREE.MeshBasicMaterial({color: JAUNE});
  const corps = new THREE.Group(), tete = new THREE.Group(), pattes = [];
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
  for(const x of [-.085, .085]){ const e = part(G.box, yeux, .075, .04, .03, x, .05, -.17); e.castShadow = false; tete.add(e); }
  for(const [x, z] of [[-.13, -.3], [.13, -.3], [-.13, .32], [.13, .32]]){
    const piv = new THREE.Group(); piv.position.set(x, .38, z);
    piv.add(part(G.box, m(FONCE), .08, .38, .08, 0, -.19, 0));
    corps.add(piv); pattes.push(piv);
  }
  g.scale.setScalar(1.05);
  g.userData = {corps, tete, pattes, yeux, mats: [...Object.values(mats), yeux]};
  return g;
}
/* Le « Grrr… » du signe, au-dessus du loup */
const GRRR = (() => {
  const c = document.createElement("canvas"); c.width = 128; c.height = 64;
  const x = c.getContext("2d");
  x.font = "bold 38px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineWidth = 7; x.strokeStyle = "#1C2230"; x.strokeText("Grrr…", 64, 34);
  x.fillStyle = "#FF7A5A"; x.fillText("Grrr…", 64, 34);
  return new THREE.CanvasTexture(c);
})();

function ajouter(k, x, z){
  const mesh = loupMesh();
  const bulle = new THREE.Sprite(new THREE.SpriteMaterial({map: GRRR, transparent: true, depthTest: false}));
  bulle.scale.set(.9, .45, 1); bulle.visible = false; bulle.renderOrder = 5;
  groupe.add(mesh, bulle);
  const m = {k, x, z, ang: Math.random() * 6.28, vie: MONSTRES[k].vie, etat: "rode", t: 0, mesh, bulle, home: {x, z}, cible: null,
    pause: Math.random() * 2, flash: 0, recul: null, mord: false, tour: 0, sens: 1, dir: null, alpha: 1};
  monstres.push(m);
  poser(m, 0, 0);
  return m;
}
function retirer(m){
  groupe.remove(m.mesh, m.bulle);
  m.mesh.userData.mats.forEach(x => x.dispose()); m.bulle.material.dispose();
  monstres.splice(monstres.indexOf(m), 1);
}
function vider(){ for(const m of [...monstres]) retirer(m); }

/* ----- Se déplacer : en contournant les parois ; jamais sur le personnage ----- */
const PRES = .62;
function avancer(m, ang, v, dt, regarde){
  for(const da of [0, .5, -.5, 1, -1, 1.6, -1.6]){
    const a = ang + da, nx = m.x + Math.cos(a) * v * dt, nz = m.z + Math.sin(a) * v * dt;
    if(walk(nx, nz) && Math.hypot(nx - player.position.x, nz - player.position.z) > PRES){
      m.x = nx; m.z = nz; m.ang = regarde === undefined ? a : regarde;
      return true;
    }
  }
  return false;
}

/* ----- Ce que fait chaque monstre, à chaque image ; blesser(degats, monstre) : il touche le personnage ----- */
let presente = false;     // le premier loup de la visite : on explique son signe
function vivre(m, dt, actif, blesser){
  const L = MONSTRES[m.k], p = player.position, d = Math.hypot(m.x - p.x, m.z - p.z), versP = Math.atan2(p.z - m.z, p.x - m.x);
  m.flash = Math.max(0, m.flash - dt);
  if(m.etat === "tombe"){                             // vaincu : il tombe sur le flanc, puis s'efface
    m.t += dt;
    m.mesh.rotation.z = Math.min(1, m.t / .35) * Math.PI / 2;
    if(m.t > .9){ m.alpha -= dt / .6; for(const x of m.mesh.userData.mats){ x.transparent = true; x.opacity = Math.max(0, m.alpha); } }
    if(m.alpha <= 0) retirer(m);
    else { m.bulle.visible = false; m.mesh.position.set(m.x, 0, m.z); }
    return;
  }
  if(!actif){ poser(m, 0, dt); return; }               // un panneau ouvert, un changement de lieu : tout attend
  m.t += dt;
  let vit = 0;
  if(m.etat === "rode"){                               // il rôde autour de sa tanière
    if(d < L.flair){
      m.etat = "approche"; m.t = 0;
      if(!presente){ presente = true; toast(`${L.emoji} Un loup ! Quand il grogne et baisse la tête, il va bondir : roule sur le côté (🤸). Juste après, il reprend son souffle : frappe-le (⚔️)`, 6000); }
    } else if(m.pause > 0) m.pause -= dt;
    else {
      if(!m.cible) for(let essai = 0; essai < 6 && !m.cible; essai++){
        const a = Math.random() * 6.28, r = .6 + Math.random() * 2, x = m.home.x + Math.cos(a) * r, z = m.home.z + Math.sin(a) * r;
        if(walk(x, z)) m.cible = {x, z};
      }
      if(!m.cible) m.pause = 1.5;
      else {
        const dx = m.cible.x - m.x, dz = m.cible.z - m.z, dd = Math.hypot(dx, dz);
        if(dd < .1 || !avancer(m, Math.atan2(dz, dx), .9, dt)){ m.cible = null; m.pause = 1.5 + Math.random() * 3; }
        else vit = 8;
      }
    }
  } else if(m.etat === "approche"){                    // il vient vers le personnage
    if(d > L.flair * 2.2){ m.etat = "rode"; m.cible = null; }
    else if(d <= L.tourne + .15){ m.etat = "tourne"; m.t = 0; m.tour = .8 + Math.random() * 1.4; m.sens = Math.random() < .5 ? 1 : -1; }
    else { avancer(m, versP, L.vitesse, dt); vit = 16; }
  } else if(m.etat === "tourne"){                      // il tourne autour, les yeux sur lui
    if(d > L.tourne + 1.6){ m.etat = "approche"; m.t = 0; }
    else if(m.t > m.tour){ m.etat = "signe"; m.t = 0; }
    else {
      const a = Math.atan2(m.z - p.z, m.x - p.x) + m.sens * .6, tx = p.x + Math.cos(a) * L.tourne, tz = p.z + Math.sin(a) * L.tourne;
      if(avancer(m, Math.atan2(tz - m.z, tx - m.x), L.vitesse * .7, dt, versP)) vit = 11;
      else m.sens = -m.sens;
      m.ang = versP;
    }
  } else if(m.etat === "signe"){                       // le signe : il grogne et baisse la tête
    m.ang = versP;
    if(m.t > L.signe){ m.etat = "bond"; m.t = 0; m.mord = false; m.dir = versP; }
  } else if(m.etat === "bond"){                        // il bondit, droit devant lui : on ne le dévie plus
    const nx = m.x + Math.cos(m.dir) * L.bond.v * dt, nz = m.z + Math.sin(m.dir) * L.bond.v * dt;
    if(walk(nx, nz) && Math.hypot(nx - p.x, nz - p.z) > .45){ m.x = nx; m.z = nz; }
    vit = 22;
    if(!m.mord && Math.hypot(m.x - p.x, m.z - p.z) < .85){ m.mord = true; blesser(L.degats, m); }
    if(m.t > L.bond.t){ m.etat = "souffle"; m.t = 0; }
  } else if(m.etat === "souffle"){                     // il reprend son souffle : le moment de frapper
    if(m.t > L.souffle){ m.etat = "tourne"; m.t = 0; m.tour = .6 + Math.random() * 1.2; }
  } else if(m.etat === "recul"){                       // touché : il recule sous le coup
    const f = Math.max(0, 1 - m.t / .3), nx = m.x + m.recul.vx * f * dt, nz = m.z + m.recul.vz * f * dt;
    if(walk(nx, nz)){ m.x = nx; m.z = nz; }
    if(m.t > .4){ m.etat = "tourne"; m.t = 0; m.tour = .5 + Math.random(); }
  }
  poser(m, vit, dt);
}
/* Le modèle à sa place : les pattes, la tête basse et le corps ramassé pendant le signe, les yeux rouges, l'éclair
   blanc quand il est touché */
function poser(m, vit, dt){
  const u = m.mesh.userData, signe = m.etat === "signe", souffle = m.etat === "souffle";
  u.pattes.forEach((piv, n) => { piv.rotation.x = vit ? Math.sin(m.t * vit + (n % 2) * Math.PI) * .7 : 0; });
  const k = Math.min(1, dt * 12);
  u.tete.rotation.x += ((signe ? .5 : souffle ? .25 : 0) - u.tete.rotation.x) * k;
  u.corps.position.y += ((signe ? -.07 : 0) + (souffle ? Math.sin(m.t * 14) * .015 : 0) - u.corps.position.y) * k;
  u.yeux.color.setHex(signe || m.etat === "bond" ? ROUGE : JAUNE);
  for(const x of u.mats) if(x.emissive) x.emissive.setScalar(m.flash > 0 ? .9 : 0);
  const tremble = signe ? Math.sin(m.t * 55) * .02 : 0;
  m.mesh.position.set(m.x + tremble, 0, m.z);
  m.mesh.rotation.y = -m.ang - Math.PI / 2;
  m.bulle.visible = signe;
  if(signe) m.bulle.position.set(m.x, 1.25 + Math.sin(m.t * 20) * .03, m.z);
}

/* ----- Les coups du personnage (combat.js) ----- */
let vaincus = 0;
/* Le monstre le plus proche à moins de r : {m, d}, ou null */
export function plusProche(r){
  const p = player.position;
  let best = null, bd = r;
  for(const m of monstres){
    if(m.etat === "tombe") continue;
    const d = Math.hypot(m.x - p.x, m.z - p.z);
    if(d < bd){ bd = d; best = m; }
  }
  return best && {m: best, d: bd};
}
/* Un coup d'épée : n dégâts ; (dx, dz) le sens du coup. Lancé (le signe, le bond), il ne recule pas */
export function frapper(m, n, dx, dz){
  if(!monstres.includes(m) || m.etat === "tombe") return;
  m.vie -= n; m.flash = .16;
  const L = MONSTRES[m.k];
  if(m.vie <= 0){
    m.etat = "tombe"; m.t = 0; m.bulle.visible = false; vaincus++;
    toast(`${L.emoji} Le ${L.nom.toLowerCase()} est vaincu !`, 2200);
    return;
  }
  if(m.etat === "signe" || m.etat === "bond") return;
  m.etat = "recul"; m.t = 0; m.recul = {vx: dx * 3.2, vz: dz * 3.2};
}

/* ----- À chaque image (combat.js) : ici = on est dans la grotte ; actif = le jeu n'attend pas ----- */
let vu = 0, enPause = false;
export function updateMonstres(dt, ici, actif, blesser){
  if(!ici){
    if(monstres.length) vider();
    groupe.visible = false; vu = 0; presente = false;
    return;
  }
  groupe.visible = true;
  if(visiteEnCours() !== vu){                          // un nouveau palier : ses loups, chacun dans sa salle
    vu = visiteEnCours();
    vider();
    if(!enPause) for(const t of tanieres(palierEnCours())) ajouter("loup", t.x, t.z);
  }
  for(const m of [...monstres]) vivre(m, dt, actif, blesser);
}

/* ----- Pour la vérification automatique ----- */
export const monstresIci = () => monstres.filter(m => m.etat !== "tombe");
export const monstresVaincus = () => vaincus;
/* Plus de monstres : ceux qui sont là s'en vont, aucun n'arrive aux paliers suivants */
export function pauseMonstres(oui){ enPause = oui; if(oui) vider(); }
/* Un monstre à un endroit précis, dans un état donné (« rode » par défaut) */
export function lacherMonstre(k, x, z, etat){ const m = ajouter(k, x, z); if(etat){ m.etat = etat; m.t = 0; m.dir = Math.atan2(player.position.z - z, player.position.x - x); } return m; }
