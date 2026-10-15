/* ================= Vérification automatique =================
   Joue les gestes de base sur une partie neuve, comme un joueur pressé, et dit ce qui ne va pas :
   ramasser, marcher, ouvrir le sac, bâtir la Scierie, y entrer, construire l'établi, fabriquer,
   couper un arbre (une ressource par coup), l'usure (un outil s'use, puis se casse), la hache selon l'essence (le frêne
   demande une hache en cuivre, le chêne séculaire une hache en bronze), l'épée en bronze, les outils en cuivre et en bronze (le filet en cuivre attrape de plus loin, l'arrosoir en bronze
   arrose plusieurs buissons, un poisson légendaire casse le fil de la canne en bois), les flèches à pointe de métal (plus sûres), une case rapide (ce qu'on y met sort du sac), entrer dans la mine, pêcher (depuis la plage et depuis le ponton), cueillir le thym, le carnet,
   les ingrédients du poisson grillé, la barque (la construire au bout du ponton, ramer au large, y pêcher le thon
   en moulinant, accoster), le voyage (vers le Marais brumeux avec sa carte, la scène qu'on passe, le retour), le Marais brumeux
   (ses passerelles, couper un cyprès, l'eau de brume au bocal, une rose des brumes, le chou-lune la nuit, la torche qui
   s'allume quand il fait sombre), la vie du Marais (une araignée d'eau, un canard colvert, un poisson-chat, un ragondin),
   la grotte du Marais (le Puits aux Brumes, une poche de gaz, un crapaud-poison, l'Hydre des brumes et ses têtes qui
   repoussent, la carte du Récif), vendre au comptoir, le sac qui s'agrandit (la toile, le sac de cuir), les lumières (la pénombre, une torche sur la torchère, le feu de camp (déplacé d'un appui long), le suif et la chandelle, une lanterne murale sur une façade qui s'allume seule la nuit, la lanterne à main dans la grotte), les pierres (ouvrir une géode, la page du carnet, la vitrine,
   le Cœur de la mine), attraper un insecte et un oiseau au filet, aller dans la Forêt profonde et y couper un arbre,
   ranger au coffre (fiche puis bouton), déplacer un coffre plein et le ranger dans un autre coffre,
   poser un coffre dans la Scierie, l'ouvrir et l'emporter, la vie de la forêt (un insecte, un oiseau, un poisson du ruisseau),
   chasser à l'arc (un chevreuil, approché sous le vent) et ramasser le présent du Cerf blanc,
   la grotte (y entrer depuis la forêt, la torche allumée, descendre d'un palier, remonter par la corde),
   le combat (un loup qui mord, la roulade qui esquive, l'épée qui le vainc et ce qu'il laisse, une chauve-souris,
   le poisson grillé qui soigne, vaincu : la moitié du butin de la grotte perdue, jamais l'équipement, le réveil au
   village, toute sa vie revenue), le Gardien d'écorce (au fond du troisième palier ; ses racines s'illuminent, la roulade
   les évite ; vaincu, la carte du Marais et un cœur de bois), les mains (l'épée restée dans le sac ne frappe pas ; l'arc
   à deux mains pose la torche au sol, vainc un loup d'une flèche et la rend ; la torche se reprend), le sanglier de la forêt
   (touché à l'arc, il charge ; vaincu à l'épée),
   creuser et combler à la pelle, tracer un chemin en marchant et l'enlever à la pelle,
   les fleurs (cueillir une fleur de la saison, la déterrer à la pelle, replanter sa graine), le jour et la nuit (la
   lumière suit l'heure, les vitres s'allument la nuit), ne jamais rester coincé. Lancée à chaque envoi sur GitHub par
   .github/workflows/verification.yml (via tests/verif.mjs), dans un navigateur neuf.
   Elle refuse de tourner sur une partie déjà avancée, pour ne jamais abîmer la vraie partie de Yo. */
import { B, POISSONS, RECOLTE, OUTILS, COMBAT, FLEURS, FLEUR_RARETE, INSECTES, GRAINES, ATELIERS, CRISTAUX, PIERRES, enFleur, graineDeFleur, objet } from "../js/donnees.js";
import { state, agrandirIle } from "../js/sauvegarde.js";
import { sacAdd, sacCount, owned, sizeOf, payer, hasAll, addOwned, upCost, noterPierre, placesSac } from "../js/regles.js";
import { map, idx, N, H, centerOf, tileOf, setObj, setEtat, growth, baiesLeft, rafraichirSaison, objMesh, lieuEau, montrerChamp, couleurSol } from "../js/monde/ile.js";
import { feuillesQuiVolent } from "../js/monde/chene.js";
import { pinModele } from "../js/monde/pin.js";
import { occ, toitDe, lumieresFacades } from "../js/monde/batiments.js";
import { eauLibre, entreePonton, amarre } from "../js/monde/ponton.js";
import { enBarque, auLarge, updateBarque, accosterBarque, barquePrete } from "../js/barque.js";
import { voyageEnCours, passerTrajet } from "../js/voyage.js";
import { lacherOmbre, presents, ombresIci } from "../js/peche.js";
import { devantGalerie, galerieOuverte, salleEn, devantCoeur } from "../js/monde/mine.js";
import { footOf } from "../js/monde/meubles.js";
import { updateVitrine } from "../js/vitrine.js";
import { forcerMeteo, updateMeteo, couvertIci, neigeAuSol } from "../js/monde/meteo.js";
import { lacherInsecte, pauseInsectes, insectesPresents } from "../js/insectes.js";
import { lacherOiseau, pauseOiseaux } from "../js/oiseaux.js";
import { lacherGibier, lacherCerfBlanc, pauseChasse, vent, chanceDe } from "../js/chasse.js";
import { lacherMonstre, pauseMonstres, monstresVaincus, monstresIci, racinesIci, gardienIci, hydreIci, pochesIci, eclaterPoche } from "../js/monstres.js";
import { antre } from "../js/monde/grotte.js";
import { combat, vieCombat } from "../js/combat.js";
import { torcheAllumee, updateTorche } from "../js/torche.js";
import { forcerHeure, updateCiel, VITRE } from "../js/monde/ciel.js";
import { choisirHemisphere } from "../js/saisons.js";
import { forcerSaison, saisonDu, reglerHemisphere, saison } from "../js/donnees.js";
import { scene, camera, renderer } from "../js/monde/scene.js";
import { foret, foretObj, W as WF, fcx, fcz, ENTREE_GROTTE } from "../js/monde/foret.js";
import { player, placePlayer, updatePlayer, R, islandWalkable, regard, tenirTorche } from "../js/monde/personnage.js";
import { mainsIci, gesteOutil } from "../js/monde/mains.js";
import { choisirVue, premiereActive, vuePremiere, pencherVue } from "../js/vue.js";
import { frontTile } from "../js/monde/personnage.js";
import { decorating } from "../js/decorer.js";
import { keys } from "../js/commandes.js";
import { updateRecolte } from "../js/recolte.js";
import { updateChemins } from "../js/terraformer.js";
import { checkDoors, isInside, currentPlace, doorOf, retourIle, allerA } from "../js/lieux.js";
import { marais, maraisObj, marche as marcheMarais, plante, mcx, mcz, mtile, W as WM, D as DM, DEPART, PUITS } from "../js/monde/marais.js";
import { startPlacing, updateInteraction } from "../js/construire.js";
import { openAtelier } from "../js/ateliers.js";
import { openCoffre, poserCoffre, poseProblem, updateCoffrePiece } from "../js/coffres.js";
import { renderHUD } from "../js/interface.js";
import { hold, mettreEnCase, jauge, dansCase } from "../js/barre.js";
import { torcheSol, lanterneAllumee } from "../js/torche.js";
import { updateLumieres, lumieresActives } from "../js/lumieres.js";
import { penombreIci } from "../js/monde/interieurs.js";
import { pickUp, updateSol, solMesh } from "../js/monde/sol.js";

const wait = ms => new Promise(r => setTimeout(r, ms));
/* Demande de Yo (v1.13.2) : un outil ne sert que tenu en main, pris dans une case rapide : la vérification le met dans la
   première case (ce qui y était retourne au sac), puis le prend en main (la torche, elle, reste dans sa case) */
const enMain = k => {
  if(dansCase(k) < 0 && !mettreEnCase(0, k)){                      // sac plein pour ce qui était dans la case : on fait un peu de place
    const j = state.sac.findIndex(it => !OUTILS[it.k] && it.k !== k); if(j >= 0) state.sac.splice(j, 1);
    mettreEnCase(0, k);
  }
  hold(k);
};
const $ = s => document.querySelector(s);
const frames = (n, dt = .05) => { for(let k = 0; k < n; k++) updateRecolte(dt, true); };
/* Un doigt sur l'écran : la place à l'écran d'un point 3D, et un appui long qui glisse d'un point à un autre */
const ecran = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera), r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
const doigt = (type, [x, y]) => renderer.domElement.dispatchEvent(new PointerEvent(type, {pointerId: 7, clientX: x, clientY: y, bubbles: true}));
/* de, a : des fonctions qui donnent la place à l'écran au moment même (sur la machine lente de GitHub, la caméra peut
   encore bouger : croix rouge de la v1.13.10) */
async function glisser(de, a){
  doigt("pointerdown", de()); await wait(700);
  for(let k = 1; k <= 6; k++){ const p = de(), q = a(); doigt("pointermove", [p[0] + (q[0] - p[0]) * k / 6, p[1] + (q[1] - p[1]) * k / 6]); await wait(30); }
  doigt("pointerup", a()); await wait(150);
}
/* Attendre que la caméra ne bouge plus (elle suit le personnage en douceur) */
async function cameraImmobile(ms = 5000){
  const t0 = performance.now(), avant = new THREE.Vector3();
  do { avant.copy(camera.position); await wait(200); } while(camera.position.distanceTo(avant) > .005 && performance.now() - t0 < ms);
}
/* Se placer devant la porte d'un bâtiment, et entrer (ou sortir en repassant le paillasson) */
/* Attendre qu'un changement de lieu soit vraiment fini (le jeu peut être lent sur la machine de GitHub) */
async function attendre(test, ms = 6000){ const t0 = performance.now(); while(!test() && performance.now() - t0 < ms) await wait(100); await wait(300); return test(); }
async function entrer(b){
  const d = doorOf(b);                                 // juste devant la porte, en marchant vers elle
  placePlayer(d.x + d.n.x * R, d.z + d.n.z * R, -d.n.x, -d.n.z);
  checkDoors(true);
  if(!await attendre(() => isInside() && currentPlace().b === b)) throw new Error(`on n'est pas entré dans ${B[b.type].nom}`);
}
async function sortir(){
  const room = currentPlace().room;
  placePlayer(room.doorX, room.d/2 - R - .03, 0, 1);
  checkDoors(true);
  if(!await attendre(() => !isInside())) throw new Error("on n'est pas ressorti");
}

export async function verifier(){
  const ok = [], erreurs = [];
  async function etape(nom, fn){
    try { const r = await fn(); ok.push(`✓ ${nom}${r ? " : " + r : ""}`); }
    catch(e){ erreurs.push(`✗ ${nom} : ${e.message}`); }
  }
  if(state.buildings.some(b => !B[b.type].fixe)) return {ok, erreurs: ["✗ Partie déjà commencée : la vérification ne tourne que sur une partie neuve"]};
  pauseInsectes(true); pauseOiseaux(true);             // les insectes et les oiseaux de passage ne prennent pas la place des boutons essayés
  pauseMonstres(true);                                 // pas de loups dans la grotte, sauf ceux de l'essai du combat
  if(!state.hemisphere) choisirHemisphere("nord");     // la question de l'hémisphère ne s'ouvre pas pendant l'essai

  await etape("La partie neuve", async () => {
    if(state.v !== 4) throw new Error(`format de sauvegarde ${state.v}`);
    if(state.sac.length) throw new Error("le sac n'est pas vide");
    if(!state.buildings.some(b => b.type === "mine")) throw new Error("pas de mine sur l'île");
    const bois = Object.values(state.sol).filter(v => v === "branche").length;
    if(bois !== 24) throw new Error(`${bois} morceaux de bois au sol au lieu de 24`);
    return `${Object.keys(state.sol).length} objets au sol (dont 24 morceaux de bois), la mine est posée`;
  });
  await etape("Le petit caillou (image de Yo) : une pierre à facettes, l'herbe et ses pousses autour ; sur le sable, sans herbe", async () => {
    const cailloux = Object.keys(state.sol).filter(i => state.sol[i] === "caillou").map(Number);
    if(!cailloux.length) throw new Error("aucun petit caillou au sol");
    const vus = cailloux.map(i => { let u = null; solMesh(i) && solMesh(i).traverse(o => { if(o.userData.caillou) u = o.userData.caillou; }); return [i, u]; });
    const sans = vus.filter(([, u]) => !u);
    if(sans.length) throw new Error(`${sans.length} petits cailloux sans leur modèle`);
    const faux = vus.filter(([i, u]) => u.herbe !== (map.type[i] !== "sand"));
    if(faux.length) throw new Error("un petit caillou a de l'herbe sur le sable, ou pas d'herbe sur l'herbe");
    return `${vus.length} petits cailloux, leur herbe de saison (${vus[0][1].saison})`;
  });
  await etape("Ramasser au sol", async () => {
    const i = +Object.keys(state.sol)[0];
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1); frames(3);
    if(!$("#btn-act").dataset.action.includes("Ramasser")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(!state.sac.length) throw new Error("rien dans le sac");
    return state.sac.map(it => `${it.n} ${it.k}`).join(", ");
  });
  await etape("Le bois et les cailloux au sol : après le premier jour, 3 à 6 de chaque, une fois par jour", async () => {
    const debut = state.solDebut, jour = state.solJour;
    for(const i of Object.keys(state.sol)) pickUp(+i);
    state.solDebut = "avant"; state.solJour = "hier";               // comme si le premier jour était passé
    try {
      updateSol();
      const n = t => Object.values(state.sol).filter(v => v === t).length, b = n("branche"), c = n("caillou");
      if(b < 3 || b > 6 || c < 3 || c > 6) throw new Error(`${b} morceaux de bois et ${c} cailloux, au lieu de 3 à 6`);
      updateSol();
      if(n("branche") !== b || n("caillou") !== c) throw new Error("il en revient encore le même jour");
      return `${b} morceaux de bois et ${c} petits cailloux aujourd'hui, rien de plus avant demain`;
    } finally { state.solDebut = debut; state.solJour = jour; }
  });
  await etape("Marcher", async () => {
    placePlayer(.5, .5, 0, 1);
    const z = player.position.z;
    keys.d = 1; for(let k = 0; k < 30; k++) updatePlayer(.016); keys.d = 0;
    if(player.position.z - z < .3) throw new Error("le personnage n'avance pas");
  });
  await etape("Le jour et la nuit : la lumière suit l'heure, les vitres s'allument la nuit", async () => {
    try {
      forcerHeure(12.5); updateCiel(0, 0);
      const midi = scene.background.getHexString(), vitreMidi = VITRE.emissiveIntensity;
      forcerHeure(23.5); updateCiel(0, 0);
      const nuit = scene.background.getHexString(), vitreNuit = VITRE.emissiveIntensity;
      if(midi === nuit) throw new Error("le ciel est le même à midi et la nuit");
      if(vitreMidi > .05 || vitreNuit < .5) throw new Error(`les vitres ne s'allument pas la nuit (${vitreMidi} à midi, ${vitreNuit} la nuit)`);
      return `ciel #${midi} à midi, #${nuit} la nuit ; vitres allumées la nuit`;
    } finally { forcerHeure(null); }
  });
  await etape("Les saisons : l'herbe change de couleur, l'hémisphère sud inverse les saisons", async () => {
    const herbe = () => couleurSol(idx(Math.floor(N / 2), Math.floor(N / 2))).join();
    try {
      forcerSaison("ete"); rafraichirSaison(); const ete = herbe();
      forcerSaison("hiver"); rafraichirSaison(); const hiver = herbe();
      if(ete === hiver) throw new Error("l'herbe a la même couleur en été et en hiver");
    } finally { forcerSaison(null); rafraichirSaison(); }
    const janvier = new Date(2027, 0, 15);
    try {
      reglerHemisphere("sud");
      if(saisonDu(janvier) !== "ete") throw new Error(`au sud, janvier est en ${saisonDu(janvier)}`);
    } finally { reglerHemisphere(state.hemisphere); }
    if(saisonDu(janvier) !== "hiver") throw new Error(`au nord, janvier est en ${saisonDu(janvier)}`);
    return "l'herbe de l'été n'est pas celle de l'hiver ; janvier : hiver au nord, été au sud";
  });
  await etape("La météo et la station météo : la pluie tombe, l'anguille sort, les papillons se cachent", async () => {
    const juillet = new Date(2027, 6, 15, 14), nuit = new Date(2027, 6, 15, 23);
    try {
      forcerMeteo("pluie");
      for(let k = 0; k < 60; k++) updateMeteo(.05, scene, 0, 0);
      if(couvertIci() < .3) throw new Error("le ciel ne se couvre pas sous la pluie");
      if(!scene.children.some(o => o.isGroup && o.children.some(c => c.isLineSegments && c.visible))) throw new Error("la pluie ne tombe pas");
      if(insectesPresents("ile", juillet).some(k => INSECTES[k].forme === "papillon")) throw new Error("des papillons sous la pluie");
      if(!presents("etang", false, nuit).includes("anguille")) throw new Error("pas d'anguille sous la pluie");
      forcerMeteo("beau");
      if(presents("etang", false, nuit).includes("anguille")) throw new Error("l'anguille sort aussi par beau temps");
      if(!insectesPresents("ile", juillet).some(k => INSECTES[k].forme === "papillon")) throw new Error("pas de papillons par beau temps, en été");
    } finally { forcerMeteo(null); }
    if(!/\d h \d\d/.test($("#meteo").textContent)) throw new Error(`le badge de la station dit « ${$("#meteo").textContent} »`);
    $("#meteo").click(); await wait(300);
    if(!$("#sheet").textContent.includes("Station météo") || !$("#sheet").textContent.includes("Prévisions")) throw new Error("la fiche de la station ne s'ouvre pas");
    $("#sheetWrap [data-close]").click(); await wait(300);
    return `badge « ${$("#meteo").textContent.trim()} » ; sous la pluie : le ciel se couvre, l'anguille sort, les papillons se cachent`;
  });
  await etape("Ce que le temps change : la pluie arrose, l'hiver ralentit les plantations, la neige blanchit l'herbe", async () => {
    const c = Math.floor(N / 2), herbe = j => couleurSol(j);
    let i = -1;
    for(let r = 3; r < 12 && i < 0; r++) for(let dx = -r; dx <= r && i < 0; dx++){
      const j = idx(c + dx, c + r);
      if(map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j]) i = j;
    }
    if(i < 0) throw new Error("pas de case d'herbe libre pour l'essai");
    const blancheur = () => { const v = herbe(i); return v[0] + v[1] + v[2]; };
    try {
      forcerMeteo("beau");
      setObj(i, "buisson"); setEtat(i, {vide: Date.now()});
      if(baiesLeft(i) !== -1) throw new Error("le buisson est arrosé sans pluie");
      forcerMeteo("pluie");
      if(baiesLeft(i) < 0) throw new Error("la pluie n'arrose pas le buisson vide");
      const pousse = Object.values(GRAINES).find(g => g.plante === "tree").pousse;
      setObj(i, "tree", Date.now() - pousse * 750);
      forcerSaison("ete"); const ete = growth(i);
      forcerSaison("hiver"); const hiver = growth(i);
      if(!(hiver < ete - .2)) throw new Error(`l'arbre pousse aussi vite l'hiver (${hiver.toFixed(2)}) que l'été (${ete.toFixed(2)})`);
      setObj(i, null); rafraichirSaison();
      const avant = blancheur();
      forcerMeteo("neige");
      for(let k = 0; k < 50; k++) updateMeteo(.5, null, 0, 0);
      await wait(600);
      if(neigeAuSol() < .8 || !(blancheur() > avant + .2)) throw new Error("la neige ne blanchit pas l'herbe");
      return `buisson arrosé par la pluie ; arbre à ${Math.round(ete * 100)} % l'été, ${Math.round(hiver * 100)} % l'hiver ; herbe blanchie par la neige`;
    } finally {
      forcerMeteo(null); forcerSaison(null); rafraichirSaison();
      for(let k = 0; k < 50; k++) updateMeteo(.5, null, 0, 0);
    }
  });
  await etape("Ouvrir le sac", async () => {
    $("#btn-sac").click(); await wait(300);
    if(!$("#sheet").textContent.includes("Sac")) throw new Error("l'écran du sac ne s'ouvre pas");
    $("#sheetWrap [data-close]").click(); await wait(300);
  });
  let scierie = null;
  await etape("Bâtir la Scierie", async () => {
    sacAdd("bois", 30); sacAdd("pierre", 15); sacAdd("fibre", 10);
    placePlayer(.5, .5, 0, 1);
    startPlacing("scierie");
    for(let k = 0; k < 5; k++) updateInteraction(.016);
    if($("#btn-place").disabled) throw new Error("« Poser ici » reste grisé");
    $("#btn-place").click();
    scierie = state.buildings.find(b => b.type === "scierie");
    if(!scierie) throw new Error("la Scierie n'est pas posée");
  });
  await etape("L'île agrandie (étape 2.1) : 96 × 96 cases, moins de chênes, le ponton et le pont sur la nouvelle côte, une partie d'avant gardée", async () => {
    if(N !== 96) throw new Error(`l'île fait ${N} × ${N} cases`);
    let terre = 0, arbres = 0;
    for(let i = 0; i < N * N; i++){ if(map.type[i] !== "water") terre++; if(map.obj[i] === "tree") arbres++; }
    if(terre < 3200) throw new Error(`seulement ${terre} cases de terre`);
    if(arbres < 60 || arbres > 170) throw new Error(`${arbres} chênes sur l'île`);
    const P = state.ponton, F = state.pontForet;
    if(!P || !F) throw new Error("pas de ponton ou pas de pont vers la forêt");
    if(lieuEau(idx(P.x, P.z + P.n - 1)) !== "mer" || lieuEau(idx(F.x, F.z)) !== "mer") throw new Error("le ponton ou le pont n'avance pas dans la mer");
    /* une partie de la petite île (56 × 56) : la Scierie, le chemin, le gland planté et le coffre restent au même endroit du
       monde (20 cases plus loin sur la carte) ; ce qu'on avait coupé dans la nature est oublié ; le ponton, le pont et l'orée se reposent */
    const v = agrandirIle({ile: {[29*56+27]: {o: "tree", plante: 1}, [10*56+10]: {o: null}, [30*56+30]: {o: "coffre", id: 3}}, terrain: {}, chemins: {[31*56+28]: "terre"},
      coffres: [{id: 3, i: 30*56+30, items: []}], buildings: [{type: "scierie", x: 27, z: 29}, {type: "foret", x: 30, z: 4}],
      ponton: {x: 28, z: 49, n: 4}, pontForet: {x: 31, z: 9, n: 3}, sol: {5: "branche"}});
    const garde = v.ileN === 96 && v.ile[idx(47, 49)] && v.ile[idx(47, 49)].plante && v.ile[idx(50, 50)] && !v.ile[idx(30, 30)] && Object.keys(v.ile).length === 2
      && v.chemins[idx(48, 51)] === "terre" && v.coffres[0].i === idx(50, 50) && v.buildings.length === 1 && v.buildings[0].x === 47 && v.buildings[0].z === 49
      && !v.ponton && !v.pontForet && !Object.keys(v.sol).length;
    if(!garde) throw new Error(`une partie d'avant passe mal sur la grande île : ${JSON.stringify(v).slice(0, 300)}`);
    /* pour le téléphone : ce que la caméra ne voit pas n'est pas dessiné */
    montrerChamp(camera, scene.fog.far + 6);
    let vus = 0, caches = 0;
    for(let i = 0; i < N * N; i++){ const m = objMesh(i); if(m) m.visible ? vus++ : caches++; }
    if(!vus || caches < vus) throw new Error(`${vus} modèles dessinés, ${caches} cachés`);
    return `${terre} cases de terre, ${arbres} chênes ; le ponton et le pont dans la mer ; une partie d'avant gardée ; ${vus} modèles dessinés sur ${vus + caches}`;
  });
  await etape("L'ombrage jouet (étape 2.1) : tous les modèles de l'île en aplats, comme la Scierie d'essai", async () => {
    const sans = [], m = o => [].concat(o.material).filter(Boolean);
    let aplats = 0;
    scene.traverse(o => { if(!o.isMesh) return; if(m(o).some(x => x.type === "MeshLambertMaterial")) sans.push(o.name || o.geometry.type); if(m(o).some(x => x.isMeshToonMaterial)) aplats++; });
    if(sans.length) throw new Error(`${sans.length} modèles sans l'ombrage jouet (${sans.slice(0, 5).join(", ")})`);
    if(aplats < 50) throw new Error(`seulement ${aplats} modèles en aplats`);
    return `${aplats} modèles en aplats, aucun avec l'ancien ombrage`;
  });
  if(scierie) await etape("Un seul bâtiment de chaque sorte : pas de deuxième Scierie", async () => {
    $("#btn-build").click(); await wait(300);
    const bouton = $("#sheet [data-pick='scierie']");
    if(!bouton || !bouton.disabled) throw new Error("le menu Construire propose encore une Scierie");
    $("#sheetWrap [data-close]").click(); await wait(300);
    return `« ${bouton.textContent} » dans le menu Construire`;
  });
  if(scierie) await etape("Entrer dans la Scierie, construire l'établi, fabriquer des planches", async () => {
    await entrer(scierie);
    $("#btn-deco").click(); $("#deco-cat").click(); await wait(200);
    $("#sheet .brow button").click(); await wait(200);
    $("#deco-done").click();
    if(!scierie.deco.items.some(it => it.type === "etabli")) throw new Error("l'établi n'est pas construit");
    openAtelier(scierie); await wait(200);
    $("#sheet [data-fab='r0']").click();
    if(!scierie.atelier.queue.length) throw new Error("rien en fabrication");
    $("#sheetWrap [data-close]").click(); await wait(300);
    await sortir();
  });
  if(scierie) await etape("Améliorer la Scierie : elle change d'allure au niveau 2", async () => {
    sacAdd("bois", 18); sacAdd("pierre", 9); sacAdd("fibre", 6);
    const avant = toitDe(scierie);
    $("#btn-ctx").dataset.id = String(scierie.id); $("#btn-ctx").click(); await wait(300);
    const bouton = $("#sheet [data-up]");
    if(!bouton || bouton.disabled) throw new Error("le bouton « Améliorer » manque ou reste grisé");
    bouton.click(); await wait(300);
    if(scierie.lvl !== 2) throw new Error(`la Scierie est au niveau ${scierie.lvl}`);
    if(!(toitDe(scierie) > avant)) throw new Error("le modèle de la Scierie n'a pas changé");
    if(upCost("scierie", 2).granit !== 8) throw new Error("le niveau 3 de la Scierie ne demande pas de granit");
    if($("#sheetWrap [data-close]")) $("#sheetWrap [data-close]").click();
    await wait(300);
    return `niveau 2 : toit à ${toitDe(scierie).toFixed(2)} P (au lieu de ${avant.toFixed(2)})`;
  });
  /* un arbre qu'on peut couper en se tenant juste en dessous */
  const arbreLibre = () => {
    for(let z = 1; z < N - 1; z++) for(let x = 1; x < N - 1; x++){
      const i = idx(x, z), s = idx(x, z + 1);
      if(map.obj[i] === "tree" && growth(i) >= 1 && !map.obj[s] && map.type[s] === "grass" && !state.sol[s] && !occ.has(s)) return [x, z];
    }
    return null;
  };
  await etape("Couper un arbre ; le bouton dit le nom de ce qu'on vise (« 🌳 Chêne »), et sans hache en main il ne fait rien", async () => {
    sacAdd("hachePierre", 1); hold(null);
    const t = arbreLibre();
    if(!t) throw new Error("aucun arbre accessible");
    const bois = owned("bois");
    placePlayer(centerOf(t[0]), centerOf(t[1] + 1) + .1, 0, -1); frames(1, .016);
    if($("#btn-act").textContent !== "🌳 Chêne") throw new Error(`devant le chêne, le bouton dit « ${$("#btn-act").textContent} » au lieu de « 🌳 Chêne »`);
    $("#btn-act").click(); frames(25);                 // sans hache en main : au joueur de la prendre (demande de Yo)
    if(owned("bois") !== bois || state.main) throw new Error("sans hache en main, toucher le chêne a fait quelque chose");
    enMain("hachePierre"); frames(1, .016);
    if($("#btn-act").textContent !== "🌳 Chêne") throw new Error(`la hache en main, le bouton dit « ${$("#btn-act").textContent} »`);
    let vol = 0;
    for(let k = 0; k < 3; k++){ frames(1, .016); $("#btn-act").click(); vol = Math.max(vol, feuillesQuiVolent()); frames(25); }
    if(saison() !== "hiver" && !vol) throw new Error("aucune feuille ne tombe du chêne qu'on coupe");
    if(map.obj[idx(...t)] !== "souche") throw new Error(`à la place du chêne : ${map.obj[idx(...t)]} au lieu d'une souche`);
    const n = owned("bois") - bois;
    if(n <= 0) throw new Error("pas de bois gagné");
    if(n > 6) throw new Error(`${n} bois pour 3 coups : un coup ne donne plus qu'un bois (avec le bonus de la Scierie, 2 au plus)`);
    /* la souche reste (étape 2.1) : la pelle la déterre, un bois en plus, la case est libre */
    sacAdd("pelleBois", 1); enMain("pelleBois"); frames(1, .016);
    if($("#btn-act").textContent !== "🪵 Souche de chêne" || !$("#btn-act").dataset.action.includes("Déterrer la souche")) throw new Error(`devant la souche, la pelle en main, le bouton dit « ${$("#btn-act").textContent} » (${$("#btn-act").dataset.action})`);
    const b2 = owned("bois");
    $("#btn-act").click();
    if(map.obj[idx(...t)] || owned("bois") !== b2 + 1) throw new Error("la pelle n'a pas déterré la souche");
    hold(null); state.barre = state.barre.map(it => it && it.k === "pelleBois" ? null : it); state.sac = state.sac.filter(it => it.k !== "pelleBois");   // la pelle de l'essai repart (sinon le sac est plein plus loin)
    return `« 🌳 Chêne » sur le bouton ; sans hache, rien ; +${n} bois en 3 coups${vol ? `, ${vol} feuilles qui tombent` : ""} ; la souche reste, la pelle la déterre (+1 bois)`;
  });
  await etape("La pierre des champs (le rocher de l'île, nom et image de Yo) : son nom sur le bouton ; sa mousse et l'herbe de son pied, qui suit la saison ; sur le sable, pas d'herbe", async () => {
    hold(null);
    let t = null;
    for(let z = 1; z < N - 1 && !t; z++) for(let x = 1; x < N - 1; x++){
      const i = idx(x, z), s = idx(x, z + 1);
      if(map.obj[i] === "rock" && !map.obj[s] && map.type[s] === "grass" && !state.sol[s] && !occ.has(s)){ t = [x, z]; break; }
    }
    if(!t) throw new Error("aucun rocher accessible sur l'île");
    placePlayer(centerOf(t[0]), centerOf(t[1] + 1) + .1, 0, -1); frames(1, .016);
    if($("#btn-act").textContent !== "🪨 Pierre des champs") throw new Error(`devant le rocher de l'île, le bouton dit « ${$("#btn-act").textContent} »`);
    const modele = i => { let u = null; objMesh(i) && objMesh(i).traverse(o => { if(o.userData.pierreChamps) u = o.userData.pierreChamps; }); return u; };
    const u = modele(idx(...t));
    if(!u) throw new Error("le rocher de l'île n'a pas le modèle de la pierre des champs");
    if(!u.herbe || u.saison !== saison()) throw new Error(`la pierre des champs : herbe ${u.herbe}, saison ${u.saison} au lieu de ${saison()}`);
    const plage = Array.from({length: N * N}, (_, i) => i).find(i => map.obj[i] === "rock" && map.type[i] === "sand");
    if(plage !== undefined && modele(plage).herbe) throw new Error("une pierre des champs sur le sable a de l'herbe au pied");
    return `« 🪨 Pierre des champs » sur le bouton ; sa mousse, l'herbe de son pied (${u.saison})${plage !== undefined ? ", pas d'herbe sur le sable" : ""}`;
  });
  await etape("Le chêne (étape 2.1) : feuillu au printemps et en été, feuilles et glands au pied en automne, branches nues en hiver ; le jeune chêne", async () => {
    const t = arbreLibre();
    if(!t) throw new Error("aucun chêne");
    const i = idx(...t), vu = {};
    try {
      for(const s of ["printemps", "ete", "automne", "hiver"]){
        forcerSaison(s); rafraichirSaison();
        const u = objMesh(i) && objMesh(i).children[0].userData.chene;
        if(!u || u.stade !== 2) throw new Error(`pas de chêne adulte en ${s}`);
        vu[s] = u;
      }
    } finally { forcerSaison(null); rafraichirSaison(); }
    if(!vu.printemps.feuillage || !vu.ete.feuillage || vu.ete.pied) throw new Error("le chêne n'a pas son feuillage au printemps ou en été");
    if(!vu.automne.feuillage || !vu.automne.pied) throw new Error("en automne, pas de feuilles ni de glands au pied");
    if(vu.hiver.feuillage) throw new Error("en hiver, le chêne garde son feuillage");
    /* le jeune chêne : une graine plantée depuis les trois quarts de sa pousse */
    const j = idx(t[0], t[1] + 1);
    setObj(j, "tree", Date.now() - GRAINES.graineArbre.pousse * 750);
    const jeune = objMesh(j) && objMesh(j).children[0].userData.chene;
    setObj(j, null);
    if(!jeune || jeune.stade !== 1) throw new Error("pas de jeune chêne");
    return "feuillu au printemps et en été, feuilles et glands au pied en automne, nu en hiver ; le jeune chêne";
  });
  await etape("Le pommier (étape 2.1) : des pommiers sauvages ; ses fleurs au printemps, ses pommes en automne (on les cueille), nu en hiver ; son bois et sa souche ; le jeune pommier à son tuteur", async () => {
    let sauvages = 0;
    for(let i = 0; i < N * N; i++) if(map.obj[i] === "pommier") sauvages++;
    if(sauvages < 3 || sauvages > 12) throw new Error(`${sauvages} pommiers sauvages sur l'île`);
    /* un pommier d'essai, sur une case d'herbe libre, rien autour */
    const libre = j => !map.obj[j] && map.type[j] === "grass" && !state.sol[j] && !occ.has(j) && !state.chemins[j];
    let p = null;
    for(let z = 20; z < N - 20 && !p; z++) for(let x = 20; x < N - 20; x++)
      if([[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]].every(([dx, dz]) => libre(idx(x + dx, z + dz)))){ p = [x, z]; break; }
    if(!p) throw new Error("pas de place pour un pommier");
    const i = idx(...p), vu = {}, u = () => objMesh(i).children[0].userData;
    setObj(i, "pommier");
    try {
      for(const s of ["printemps", "ete", "automne", "hiver"]){ forcerSaison(s); rafraichirSaison(); vu[s] = u().pommier; }
      if(!vu.printemps.fleurs || vu.ete.fleurs || vu.ete.pommes || !vu.automne.pommes || !vu.automne.pied || vu.hiver.feuillage)
        throw new Error(`le pommier au fil des saisons : ${JSON.stringify(vu)}`);
      /* en automne, mains libres : « 🍎 Pommier », on cueille 3 pommes, qui ne se voient plus */
      forcerSaison("automne"); rafraichirSaison(); hold(null);
      placePlayer(centerOf(p[0]), centerOf(p[1] + 1) + .1, 0, -1); frames(1, .016);
      if($("#btn-act").textContent !== "🍎 Pommier" || !$("#btn-act").dataset.action.includes("Cueillir"))
        throw new Error(`devant le pommier : « ${$("#btn-act").textContent} » (${$("#btn-act").dataset.action})`);
      const pommes = owned("pomme");
      $("#btn-act").click();
      if(owned("pomme") !== pommes + 3) throw new Error(`${owned("pomme") - pommes} pommes cueillies au lieu de 3`);
      if(u().pommier.pommes) throw new Error("les pommes cueillies se voient encore");
      /* la hache le coupe : son bois, sa souche */
      sacAdd("hachePierre", 1); enMain("hachePierre");
      const bp = owned("boisPommier");
      for(let k = 0; k < RECOLTE.pommier.coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
      if(owned("boisPommier") <= bp) throw new Error("pas de bois de pommier");
      if(map.obj[i] !== "souche" || u().souche !== "pommier") throw new Error(`à la place du pommier : ${map.obj[i]}`);
      frames(1, .016);
      if($("#btn-act").textContent !== "🪵 Souche de pommier") throw new Error(`devant la souche : « ${$("#btn-act").textContent} »`);
      /* le jeune pommier, tenu à son tuteur */
      setObj(i, "pommier", Date.now() - GRAINES.grainePommier.pousse * 750);
      const jeune = u().pommier;
      if(!jeune || jeune.stade !== 1 || !jeune.tuteur) throw new Error("pas de jeune pommier à son tuteur");
    } finally {
      setObj(i, null); forcerSaison(null); rafraichirSaison(); hold(null);
      state.sac = state.sac.filter(it => !["pomme", "boisPommier", "grainePommier"].includes(it.k));   // le sac reste léger pour la suite
    }
    return `${sauvages} pommiers sauvages ; fleurs au printemps, pommes en automne (3 cueillies), nu en hiver ; son bois, sa souche ; le jeune pommier à son tuteur`;
  });
  await etape("Le pin sylvestre (étape 2.1) : près des plages ; toujours vert, de la neige sur ses plateaux quand il neige, des aiguilles et des pommes de pin au pied en automne ; son bois, sa souche ; le jeune pin", async () => {
    let pins = 0, presDuSable = 0;
    for(let i = 0; i < N * N; i++) if(map.obj[i] === "pin"){
      pins++;
      const x = i % N, z = Math.floor(i / N);
      for(let dz = -3; dz <= 3 && presDuSable < pins; dz++) for(let dx = -3; dx <= 3; dx++) if(map.type[idx(x + dx, z + dz)] === "sand"){ presDuSable++; break; }
    }
    if(pins < 10 || presDuSable < pins) throw new Error(`${pins} pins sauvages, dont ${presDuSable} près d'une plage`);
    const libre = j => !map.obj[j] && map.type[j] === "grass" && !state.sol[j] && !occ.has(j) && !state.chemins[j];
    let p = null;
    for(let z = 20; z < N - 20 && !p; z++) for(let x = 20; x < N - 20; x++)
      if([[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]].every(([dx, dz]) => libre(idx(x + dx, z + dz)))){ p = [x, z]; break; }
    if(!p) throw new Error("pas de place pour un pin");
    const i = idx(...p), vu = {}, u = () => objMesh(i).children[0].userData;
    setObj(i, "pin");
    try {
      for(const s of ["printemps", "ete", "automne", "hiver"]){ forcerSaison(s); rafraichirSaison(); vu[s] = u().pin; }
      if(["printemps", "ete", "automne", "hiver"].some(s => !vu[s].feuillage) || !vu.automne.pied || vu.ete.pied) throw new Error(`le pin au fil des saisons : ${JSON.stringify(vu)}`);
      if(!pinModele(2, "hiver", 0, true).userData.pin.neige) throw new Error("pas de neige sur les plateaux du pin");
      forcerSaison(null); rafraichirSaison();
      /* la hache le coupe : son bois, sa souche */
      sacAdd("hachePierre", 1); enMain("hachePierre");
      placePlayer(centerOf(p[0]), centerOf(p[1] + 1) + .1, 0, -1); frames(1, .016);
      if($("#btn-act").textContent !== "🌲 Pin sylvestre") throw new Error(`devant le pin : « ${$("#btn-act").textContent} »`);
      const bp = owned("boisPin");
      for(let k = 0; k < RECOLTE.pin.coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
      if(owned("boisPin") <= bp) throw new Error("pas de bois de pin");
      if(map.obj[i] !== "souche" || u().souche !== "pin") throw new Error(`à la place du pin : ${map.obj[i]}`);
      frames(1, .016);
      if($("#btn-act").textContent !== "🪵 Souche de pin sylvestre") throw new Error(`devant la souche : « ${$("#btn-act").textContent} »`);
      /* le jeune pin */
      setObj(i, "pin", Date.now() - GRAINES.grainePin.pousse * 750);
      if(!u().pin || u().pin.stade !== 1) throw new Error("pas de jeune pin");
    } finally {
      setObj(i, null); forcerSaison(null); rafraichirSaison(); hold(null);
      state.sac = state.sac.filter(it => !["boisPin", "grainePin", "resine"].includes(it.k));   // le sac reste léger pour la suite
    }
    return `${pins} pins sauvages, tous près d'une plage ; toujours vert, de la neige sur ses plateaux, son pied d'automne ; son bois, sa souche ; le jeune pin`;
  });
  await etape("Le bouleau (étape 2.1) : au bord de l'eau douce ; feuilles d'or en automne (et au pied), nu en hiver ; son bois, son écorce, sa souche ; le jeune bouleau", async () => {
    let bouleaux = 0;
    for(let i = 0; i < N * N; i++) if(map.obj[i] === "bouleau") bouleaux++;
    if(bouleaux < 5) throw new Error(`${bouleaux} bouleaux sauvages`);
    const libre = j => !map.obj[j] && map.type[j] === "grass" && !state.sol[j] && !occ.has(j) && !state.chemins[j];
    let p = null;
    for(let z = 20; z < N - 20 && !p; z++) for(let x = 20; x < N - 20; x++)
      if([[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]].every(([dx, dz]) => libre(idx(x + dx, z + dz)))){ p = [x, z]; break; }
    if(!p) throw new Error("pas de place pour un bouleau");
    const i = idx(...p), vu = {}, u = () => objMesh(i).children[0].userData;
    setObj(i, "bouleau");
    try {
      for(const s of ["printemps", "ete", "automne", "hiver"]){ forcerSaison(s); rafraichirSaison(); vu[s] = u().bouleau; }
      if(!vu.printemps.feuillage || !vu.ete.feuillage || !vu.automne.feuillage || !vu.automne.pied || vu.ete.pied || vu.hiver.feuillage) throw new Error(`le bouleau au fil des saisons : ${JSON.stringify(vu)}`);
      forcerSaison(null); rafraichirSaison();
      sacAdd("hachePierre", 1); enMain("hachePierre");
      placePlayer(centerOf(p[0]), centerOf(p[1] + 1) + .1, 0, -1); frames(1, .016);
      if($("#btn-act").textContent !== "🌳 Bouleau") throw new Error(`devant le bouleau : « ${$("#btn-act").textContent} »`);
      const bb = owned("boisBouleau");
      for(let k = 0; k < RECOLTE.bouleau.coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
      if(owned("boisBouleau") <= bb) throw new Error("pas de bois de bouleau");
      if(map.obj[i] !== "souche" || u().souche !== "bouleau") throw new Error(`à la place du bouleau : ${map.obj[i]}`);
      frames(1, .016);
      if($("#btn-act").textContent !== "🪵 Souche de bouleau") throw new Error(`devant la souche : « ${$("#btn-act").textContent} »`);
      setObj(i, "bouleau", Date.now() - GRAINES.graineBouleau.pousse * 750);
      if(!u().bouleau || u().bouleau.stade !== 1) throw new Error("pas de jeune bouleau");
    } finally {
      setObj(i, null); forcerSaison(null); rafraichirSaison(); hold(null);
      state.sac = state.sac.filter(it => !["boisBouleau", "graineBouleau", "ecorceBouleau"].includes(it.k));   // le sac reste léger pour la suite
    }
    return `${bouleaux} bouleaux sauvages ; feuillu du printemps à l'automne (feuilles au pied), nu en hiver ; son bois, sa souche ; le jeune bouleau`;
  });
  await etape("L'usure : un outil s'use à chaque coup, sa jauge baisse, puis il se casse et disparaît", async () => {
    const k = "hachePierre";
    if(!(state.usure[k] > 0)) throw new Error("la hache ne s'est pas usée en coupant l'arbre");
    if(!jauge(k).includes("usure")) throw new Error("pas de jauge de solidité");
    const n = owned(k);
    state.usure[k] = OUTILS[k].solidite - 1;                 // le dernier coup
    const t = arbreLibre();
    if(!t) throw new Error("aucun arbre accessible");
    enMain(k);
    placePlayer(centerOf(t[0]), centerOf(t[1] + 1) + .1, 0, -1);
    frames(1, .016); $("#btn-act").click(); frames(25);
    if(owned(k) !== n - 1) throw new Error("la hache usée ne s'est pas cassée");
    if(state.usure[k]) throw new Error("l'usure n'est pas remise à zéro");
    if(state.main === k && !owned(k)) throw new Error("la hache cassée est encore en main");
    return `une hache en pierre se casse au bout de ${OUTILS[k].solidite} coups`;
  });
  await etape("Une case rapide : ce qu'on y met sort du sac", async () => {
    const k = "piochePierre";
    sacAdd(k, 1);
    if(!state.sac.some(it => it.k === k)) throw new Error("la pioche n'est pas arrivée dans le sac");
    if(!mettreEnCase(0, k)) throw new Error("la pioche ne va pas dans la case 1");
    if(state.sac.some(it => it.k === k)) throw new Error("la pioche est encore dans le sac");
    $("#barre [data-case='0']").click();
    if(state.main !== k) throw new Error("la pioche n'est pas en main");
    if(!owned(k)) throw new Error("la pioche ne compte plus");
    return `case 1 : ${objet(k).nom}, ${state.sac.length} emplacements pris dans le sac`;
  });
  await etape("L'entrée de la mine : déblayer l'éboulement à la pioche, puis poser les étais", async () => {
    const mine = state.buildings.find(b => b.type === "mine"), d = doorOf(mine);
    if(state.entreeMine !== "eboulee") throw new Error(`une partie neuve trouve l'entrée « ${state.entreeMine || "ouverte"} » au lieu d'éboulée`);
    if(!owned("piochePierre")) sacAdd("piochePierre", 1);
    enMain("piochePierre");
    placePlayer(d.x + d.n.x * R, d.z + d.n.z * R, -d.n.x, -d.n.z);
    checkDoors(true);
    if(isInside()) throw new Error("on entre dans la mine éboulée");
    let coups = 0;
    for(let k = 0; k < 8 && state.entreeMine === "eboulee"; k++){
      frames(3);
      if(!$("#btn-act").dataset.action.includes("Déblayer")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} » devant l'éboulement`);
      $("#btn-act").click(); coups++;
    }
    if(state.entreeMine !== "deblayee") throw new Error("l'éboulement n'est pas dégagé");
    addOwned("planche", 15); addOwned("pierre", 10); addOwned("torche", 4);
    frames(3);
    if(!$("#btn-act").dataset.action.includes("étais")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} » devant l'entrée dégagée`);
    $("#btn-act").click();
    if(state.entreeMine) throw new Error("les étais ne sont pas posés");
    return `${coups} coups de pioche, puis les étais : la mine est ouverte`;
  });
  await etape("Entrer dans la mine et en sortir", async () => {
    await entrer(state.buildings.find(b => b.type === "mine"));
    if(currentPlace().room.w < 10) throw new Error("la grotte n'est pas construite");
    const n = Object.keys(state.mine.rocks).length;
    await sortir();
    return `${n} rochers aujourd'hui`;
  });
  await etape("Creuser la galerie de la mine vers la salle de l'étain, avec une pioche en cuivre", async () => {
    await entrer(state.buildings.find(b => b.type === "mine"));
    try {
      const avant = devantGalerie(2);
      placePlayer(avant.x, avant.z, avant.fx, avant.fz); frames(3);
      if(!$("#btn-act").dataset.action.includes("pioche en cuivre")) throw new Error(`sans pioche en cuivre, le bouton dit « ${$("#btn-act").dataset.action} »`);
      sacAdd("piocheCuivre", 1); enMain("piocheCuivre");
      let coups = 0;
      for(let k = 0; k < 20 && !galerieOuverte(2); k++){
        const p = devantGalerie(2);
        placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
        if(!$("#btn-act").dataset.action.includes("Creuser la galerie")) throw new Error(`devant la galerie, le bouton dit « ${$("#btn-act").dataset.action} »`);
        $("#btn-act").click(); coups++;
      }
      if(!galerieOuverte(2)) throw new Error("la galerie n'est pas ouverte");
      const p3 = devantGalerie(3);
      placePlayer(p3.x, p3.z, p3.fx, p3.fz); frames(3);
      if(!$("#btn-act").dataset.action.includes("pioche en bronze")) throw new Error(`devant la galerie de la géode, le bouton dit « ${$("#btn-act").dataset.action} »`);
      const sortes = [...new Set(Object.entries(state.mine.rocks).filter(([t]) => salleEn(+t) === 2).map(([, o]) => o))];
      if(!sortes.includes("rockEtain")) throw new Error("pas d'étain dans la salle de l'étain");
      return `${coups} coups de pioche ; dans la salle de l'étain : ${sortes.join(", ")} ; la géode attend la pioche en bronze`;
    } finally { await sortir(); }
  });
  await etape("La Forêt profonde : y aller, couper un arbre, revenir", async () => {
    const b = state.buildings.find(b => b.type === "foret");
    if(!b) throw new Error("pas d'orée de la forêt sur l'île");
    await entrer(b);
    if(currentPlace().room.w < 30) throw new Error("la forêt n'est pas construite");
    /* un arbre au bord du grand sentier (les deux colonnes du milieu), qu'on coupe depuis le sentier */
    let t = null;
    for(let z = WF - 3; z > WF / 2 + 2 && !t; z--) for(const [x, dx] of [[WF / 2 - 2, -1], [WF / 2 + 1, 1]]){
      const i = z * WF + x, o = foretObj(i);
      if(o && RECOLTE[o] && RECOLTE[o].res && !(RECOLTE[o].force > 1)){ t = {i, dx}; break; }   // un arbre qui donne du bois (pas un bois dur)
    }
    if(!t) throw new Error("aucun arbre au bord du sentier");
    if(!owned("hachePierre")) sacAdd("hachePierre", 1);
    placePlayer(fcx(t.i) - t.dx, fcz(t.i), t.dx, 0);
    const sorte = foretObj(t.i), bois = RECOLTE[sorte].res, avant = owned(bois);
    const outil = RECOLTE[sorte].outil === "pioche" ? "piochePierre" : "hachePierre";
    if(!owned(outil)) sacAdd(outil, 1);
    enMain(outil);
    for(let k = 0; k < RECOLTE[sorte].coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
    if(foretObj(t.i)) throw new Error(`${RECOLTE[sorte].nom} est toujours là (le bouton dit « ${$("#btn-act").dataset.action} »)`);
    if(owned(bois) <= avant) throw new Error(`pas de ${objet(bois).nom.toLowerCase()} gagné`);
    await sortir();
    return `${RECOLTE[sorte].nom} coupé, +${owned(bois) - avant} ${objet(bois).nom.toLowerCase()}`;
  });
  await etape("Pêcher", async () => {
    sacAdd("canneBois", 1); enMain("canneBois");
    let t = null;
    for(let z = 1; z < N - 1 && !t; z++) for(let x = 1; x < N - 1; x++){
      const i = idx(x, z), s = idx(x, z + 1);
      if(map.type[i] !== "water" && i !== entreePonton && !map.obj[i] && !occ.has(i) && !state.sol[i] && eauLibre(s)){ t = [x, z]; break; }
    }
    if(!t) throw new Error("aucun bord de l'eau");
    placePlayer(centerOf(t[0]), centerOf(t[1]) + .2, 0, 1); frames(2);
    if(!$("#btn-act").dataset.action.includes("Lancer")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    if(!lacherOmbre(centerOf(t[0]), centerOf(t[1]) + 2.2)) throw new Error("pas d'ombre de poisson possible ici");   // une ombre devant soi
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").dataset.action.includes("Ferrer") && k < 400){ frames(1); k++; }
    if(k >= 400) throw new Error("le poisson ne mord jamais (il ne vient pas au bouchon)");
    $("#btn-act").click();
    const p = state.sac.find(it => POISSONS[it.k]);
    if(!p) throw new Error("pas de poisson dans le sac");
    frames(40);
    return `${objet(p.k).nom.toLowerCase()}, mordu au bout de ${(k * .05).toFixed(1)} s`;
  });
  await etape("Pêcher depuis le ponton", async () => {
    const P = state.ponton;
    if(!P) throw new Error("pas de ponton sur l'île");
    placePlayer(centerOf(P.x), centerOf(P.z - 1), 0, 1);                       // sur la terre, face au ponton
    keys.d = 1; for(let k = 0; k < 120; k++) updatePlayer(.016); keys.d = 0;   // marcher jusqu'au bout
    if(tileOf(player.position.z) < P.z + P.n - 2) throw new Error("on ne marche pas sur le ponton");
    frames(2);
    if(!$("#btn-act").dataset.action.includes("Lancer")) throw new Error(`au bout du ponton, le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = state.sac.reduce((n, it) => n + (POISSONS[it.k] ? it.n : 0), 0);
    if(!lacherOmbre(player.position.x, player.position.z + 2)) throw new Error("pas d'ombre de poisson possible au bout du ponton");
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").dataset.action.includes("Ferrer") && k < 400){ frames(1); k++; }
    if(k >= 400) throw new Error("rien ne mord au bout du ponton");
    $("#btn-act").click(); frames(40);
    if(state.sac.reduce((n, it) => n + (POISSONS[it.k] ? it.n : 0), 0) <= avant) throw new Error("pas de poisson dans le sac");
    return `${P.n} cases dans l'eau`;
  });
  await etape("Cueillir le thym", async () => {
    hold(null);
    const libre = j => map.type[j] !== "water" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    const i = map.obj.findIndex((o, j) => o === "thym" && libre(j + N));          // rien juste devant (vers le bas)
    if(i < 0) throw new Error("pas de thym sur l'île");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1); frames(2);   // debout dans la touffe
    if(!$("#btn-act").dataset.action.includes("thym")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = owned("thym");
    $("#btn-act").click();
    if(owned("thym") <= avant) throw new Error("pas de thym dans le sac");
    frames(2);
    if(!$("#btn-act").dataset.action.includes("repousse")) throw new Error(`après la cueillette, le bouton dit « ${$("#btn-act").dataset.action} »`);
    return `${map.obj.filter(o => o === "thym").length} touffes sur l'île`;
  });
  await etape("Le carnet de pêche", async () => {
    $("#btn-sac").click(); await wait(300);
    $("#sheet [data-sac-tab='carnet']").click(); await wait(200);
    const txt = $("#sheet").textContent, m = txt.match(/Poissons : (\d+) sur (\d+)/);
    if(!m) throw new Error("le carnet ne s'ouvre pas");
    if(+m[1] < 1) throw new Error("aucun poisson inscrit au carnet");
    $("#sheetWrap [data-close]").click(); await wait(300);
    return `${m[1]} sur ${m[2]}`;
  });
  await etape("Les ingrédients du poisson grillé", async () => {
    if(!hasAll({poisson: 1, thym: 1})) throw new Error("il manque un poisson ou du thym");
    const pris = payer({poisson: 1, thym: 1}), poisson = Object.keys(pris).find(k => POISSONS[k]);
    if(!poisson || pris.thym !== 1) throw new Error(`pris : ${JSON.stringify(pris)}`);
    for(const [k, v] of Object.entries(pris)) addOwned(k, v);                   // rendus
    return `${objet(poisson).une ? "une" : "un"} ${objet(poisson).nom.toLowerCase()} et un brin de thym`;
  });
  /* Faire de la place dans le sac de la partie d'essai (12 emplacements : il se remplit au fil des essais) */
  const place = n => {
    for(const k of ["graineArbre", "graineThym", "fibre", "pierre", "bois", "planche"]) if(state.sac.length > 12 - n) state.sac = state.sac.filter(it => it.k !== k);
    while(state.sac.length > 12 - n){ const j = state.sac.findIndex(it => !OUTILS[it.k]); if(j < 0) break; state.sac.splice(j, 1); }   // puis les prises des essais d'avant
    while(state.sac.length > 12 - n){ const j = state.sac.findIndex(it => OUTILS[it.k]); if(j < 0) break; state.sac.splice(j, 1); }    // puis les outils des essais d'avant (chaque essai reprend les siens)
  };
  await etape("La barque : la construire au bout du ponton, ramer au large, y pêcher le thon, accoster", async () => {
    const P = state.ponton;
    if(!P || !amarre) throw new Error("pas de ponton sur l'île");
    const sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre));   // rendus à la fin
    place(3); sacAdd("planche", 20); sacAdd("fibre", 8); hold(null);
    placePlayer(centerOf(P.x), centerOf(P.z + P.n - 1), 1, 0); frames(2);          // au bout du ponton, face à la borne
    if(!$("#btn-act").dataset.action.includes("Construire la barque")) throw new Error(`au bout du ponton, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click(); await wait(200);
    const b = $("#sheet [data-barque]");
    if(!b || b.disabled) throw new Error("la barque ne se construit pas");
    b.click(); await wait(300);
    if(!state.barque) throw new Error("les travaux de la barque ne commencent pas");
    state.barque.fin = Date.now() - 1000; updateBarque(.016); frames(2);          // sans attendre ses 10 minutes
    if(!$("#btn-act").dataset.action.includes("Libellule")) throw new Error(`la barque finie, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click(); await wait(200);
    if(!$("#sheet [data-barque-ramer]")) throw new Error("la fiche de la barque ne s'ouvre pas");
    $("#sheet [data-barque-ramer]").click(); await wait(300);
    if(!enBarque()) throw new Error("on ne monte pas dans la barque");
    try {
      keys.d = 1; for(let k = 0; k < 900 && !auLarge(player.position.x, player.position.z); k++) updatePlayer(.016);
      keys.d = 0; updatePlayer(.016);
      if(!auLarge(player.position.x, player.position.z)) throw new Error("la barque n'arrive pas au large");
      /* le thon, au large : il mord, on le ferre, puis il faut mouliner */
      sacAdd("canneBois", 1); enMain("canneBois");
      placePlayer(player.position.x, player.position.z, 0, 1); frames(2);
      if(!$("#btn-act").dataset.action.includes("Lancer")) throw new Error(`au large, la canne en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
      if(!lacherOmbre(player.position.x, player.position.z + 2, "thon")) throw new Error("pas d'ombre de thon possible au large");
      $("#btn-act").click();
      let k = 0;
      while(!$("#btn-act").dataset.action.includes("Ferrer") && k < 400){ frames(1); k++; }
      if(k >= 400) throw new Error("le thon ne mord pas");
      $("#btn-act").click(); frames(1);
      if(!$("#btn-act").dataset.action.includes("Mouline")) throw new Error(`le thon ferré, le bouton dit « ${$("#btn-act").dataset.action} »`);
      for(let n = 0; n < 10 && !owned("thon"); n++){ $("#btn-act").click(); frames(1); }
      if(!owned("thon")) throw new Error("le thon n'est pas dans le sac");
      frames(40);
      /* revenir au ponton, et accoster */
      placePlayer(amarre.x, amarre.z + .6, 0, -1); frames(2);
      if(!$("#btn-act").dataset.action.includes("Accoster")) throw new Error(`près du ponton, en barque, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click();
      if(enBarque() || !islandWalkable(player.position.x, player.position.z)) throw new Error("on n'accoste pas sur le ponton");
      return "construite, au large en ramant, un thon pris en moulinant, puis accostée";
    } finally { if(enBarque()) accosterBarque(); keys.d = 0; state.sac = sac0; state.barre = barre0; hold(null); }
  });
  await etape("Le voyage : partir en barque vers le Marais brumeux avec sa carte, passer la scène, rentrer au village", async () => {
    const P = state.ponton;
    if(!P || !barquePrete()) throw new Error("pas de barque prête au bout du ponton");
    const cartes = state.cartes;
    state.cartes = {...(cartes || {})}; delete state.cartes.marais;
    try {
      hold(null); placePlayer(centerOf(P.x), centerOf(P.z + P.n - 1), 1, 0); frames(2);
      if(!$("#btn-act").dataset.action.includes("Libellule")) throw new Error(`au bout du ponton, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click(); await wait(200);
      const sans = $("#sheet [data-barque-marais]");
      if(!sans || !sans.disabled) throw new Error("sans la carte du Marais, on peut partir");
      $("#sheetWrap [data-close]").click(); await wait(400);
      state.cartes.marais = Date.now();                                          // la carte, trouvée
      frames(2);                                       // le bouton d'action, remis à jour (la machine de GitHub est lente)
      $("#btn-act").click(); await wait(300);
      const avec = $("#sheet [data-barque-marais]");
      if($("#sheetWrap").hidden || !avec || avec.disabled) throw new Error(`avec la carte, pas de bouton « Partir » (le bouton d'action dit « ${$("#btn-act").dataset.action} »)`);
      avec.click();
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "trajet") || !voyageEnCours()) throw new Error("le trajet ne commence pas");
      passerTrajet();
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "marais", 8000)) throw new Error("on n'arrive pas au Marais");
      frames(2);
      if(!$("#btn-act").dataset.action.includes("Rentrer au village")) throw new Error(`sur l'embarcadère du Marais, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click();
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "trajet")) throw new Error("le trajet du retour ne commence pas");
      passerTrajet();
      if(!await attendre(() => !isInside(), 8000)) throw new Error("on ne revient pas au village");
      if(tileOf(player.position.x) !== P.x || tileOf(player.position.z) !== P.z + P.n - 1) throw new Error("on ne revient pas au bout du ponton");
      return "sans la carte, pas de départ ; avec elle : le trajet, le Marais, puis le retour au bout du ponton";
    } finally {
      state.cartes = cartes;
      if(currentPlace() && ["marais", "trajet"].includes(currentPlace().b.type)){ passerTrajet(); await wait(500); }
      if(currentPlace() && currentPlace().b.type === "marais"){ retourIle(centerOf(P.x), centerOf(P.z + P.n - 1), -1, 0); await attendre(() => !isInside()); }
    }
  });
  await etape("Le Marais brumeux : ses passerelles, couper un cyprès, l'eau de brume au bocal, une rose des brumes, le chou-lune la nuit, la torche quand il fait sombre", async () => {
    const P = state.ponton, sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre)), torche0 = state.torche;
    /* devant : une case où il y a ce qu'on cherche, et la case d'à côté où l'on se tient, tourné vers elle */
    const devant = (f, ou) => {
      for(let i = 0; i < WM * DM; i++){
        if(!f(maraisObj(i)) || ou && marais.type[i] !== ou) continue;
        for(const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]){
          const x = mcx(i) + dx, z = mcz(i) + dz;
          if(marcheMarais(x, z) && !plante(maraisObj(i + dz * WM + dx))) return {i, x, z, fx: -dx, fz: -dz};
        }
      }
      throw new Error("introuvable au Marais");
    };
    const bouton = () => $("#btn-act").dataset.action;
    const face = t => { placePlayer(t.x, t.z, t.fx, t.fz); frames(2, .016); };
    try {
      allerA({type: "marais"}, DEPART, {x: centerOf(P.x), z: centerOf(P.z + P.n - 1)});
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "marais")) throw new Error("on n'arrive pas au Marais");
      state.sac = []; state.barre = [null, null, null]; hold(null);
      /* des îlots reliés par des passerelles : on marche sur les planches, pas dans l'eau */
      const pas = marais.type.indexOf("passerelle"), eau = marais.type.indexOf("eau");
      if(pas < 0 || !marcheMarais(mcx(pas), mcz(pas)) || marcheMarais(mcx(eau), mcz(eau))) throw new Error("on ne marche pas sur les passerelles, ou bien dans l'eau");
      /* un cyprès des marais, à la hache : son bois */
      const c = devant(o => o === "cypres", "terre");
      sacAdd("hachePierre", 1); enMain("hachePierre"); face(c);
      if(!bouton().includes("Couper le cyprès")) throw new Error(`devant un cyprès, le bouton dit « ${bouton()} »`);
      for(let k = 0; k < RECOLTE.cypres.coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
      if(maraisObj(c.i)) throw new Error(`le cyprès est toujours là (le bouton dit « ${bouton()} »)`);
      if(owned("boisCypres") < RECOLTE.cypres.coups) throw new Error("pas de bois de cyprès");
      /* l'eau de brume du saule : seulement au bocal */
      hold(null);
      const s = devant(o => o === "sauleBrumes");
      face(s);
      if(!bouton().includes("bocal")) throw new Error(`sans bocal, devant un saule des brumes, le bouton dit « ${bouton()} »`);
      sacAdd("bocal", 1); enMain("bocal"); frames(2, .016);
      if(!bouton().includes("Recueillir")) throw new Error(`le bocal en main, le bouton dit « ${bouton()} »`);
      $("#btn-act").click(); frames(1, .016);
      if(!owned("eauBrume")) throw new Error("pas d'eau de brume dans le sac");
      /* une rose des brumes (toute l'année) */
      hold(null);
      const r = devant(o => o === "roseBrumes");
      face(r);
      if(!bouton().includes("Cueillir : rose des brumes")) throw new Error(`devant une rose des brumes, le bouton dit « ${bouton()} »`);
      $("#btn-act").click(); frames(1, .016);
      if(!owned("roseBrumes") || !bouton().includes("de retour")) throw new Error(`la rose des brumes n'est pas cueillie (le bouton dit « ${bouton()} »)`);
      /* le chou-lune ne pousse que la nuit */
      const ch = devant(o => o === "chouLune");
      forcerHeure(12.5); updateCiel(0, 0); face(ch);
      if(!bouton().includes("que la nuit")) throw new Error(`le jour, devant un chou-lune, le bouton dit « ${bouton()} »`);
      forcerHeure(23.5); updateCiel(0, 0); frames(2, .016);
      if(!bouton().includes("Cueillir : chou-lune")) throw new Error(`la nuit, devant un chou-lune, le bouton dit « ${bouton()} »`);
      $("#btn-act").click(); frames(1, .016);
      if(!owned("chouLune")) throw new Error("pas de chou-lune dans le sac");
      /* la torche (demande de Yo) : dans une case rapide, elle s'allume quand il fait sombre (la nuit), pas en plein jour */
      hold(null); state.barre = [null, null, null]; sacAdd("torche", 2); mettreEnCase(0, "torche");
      forcerMeteo("beau"); updateMeteo(10, null, 0, 0);                    // le ciel dégagé, tout de suite
      forcerHeure(12.5); updateCiel(0, 0); updateTorche(.016);
      if(torcheAllumee()) throw new Error("en plein jour, par beau temps, la torche brûle au Marais");
      forcerHeure(23.5); updateCiel(0, 0); updateTorche(.016);
      if(!torcheAllumee()) throw new Error("la nuit, la torche ne s'allume pas au Marais");
      return `${owned("boisCypres")} bois de cyprès, l'eau de brume au bocal, une rose des brumes, la nuit un chou-lune ; la torche allumée la nuit, éteinte le jour`;
    } finally {
      forcerHeure(null); forcerMeteo(null); updateCiel(0, 0);
      state.sac = sac0; state.barre = barre0; state.torche = torche0; hold(null);
      if(currentPlace() && currentPlace().b.type === "marais"){ retourIle(centerOf(P.x), centerOf(P.z + P.n - 1), -1, 0); await attendre(() => !isInside()); }
    }
  });
  await etape("La vie du Marais brumeux : un insecte, un oiseau, un poisson des chenaux, un gibier", async () => {
    const P = state.ponton, sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre));
    const bouton = () => $("#btn-act").dataset.action;
    pauseChasse(true);
    try {
      allerA({type: "marais"}, DEPART, {x: centerOf(P.x), z: centerOf(P.z + P.n - 1)});
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "marais")) throw new Error("on n'arrive pas au Marais");
      state.sac = []; state.barre = [null, null, null]; hold(null);
      keys.u = keys.d = keys.l = keys.r = 0;
      /* au bord d'un îlot, face à l'eau libre */
      let t = null;
      for(let i = 0; i < WM * DM && !t; i++){
        if(marais.type[i] !== "eau" || maraisObj(i)) continue;
        for(const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]){
          const j = i + dz * WM + dx;
          if(marais.type[j] === "terre" && marcheMarais(mcx(j), mcz(j)) && !plante(maraisObj(j))){ t = {i, j, dx: -dx, dz: -dz}; break; }
        }
      }
      if(!t) throw new Error("aucun bord d'îlot au Marais");
      placePlayer(mcx(t.j), mcz(t.j), t.dx, t.dz); frames(2);
      /* une araignée d'eau qui patine, puis un canard colvert posé sur l'eau */
      sacAdd("filet", 1); enMain("filet");
      lacherInsecte("araigneeEau", mcx(t.i), mcz(t.i), -.17); frames(2);
      if(!bouton().includes("Attraper")) throw new Error(`le bouton dit « ${bouton()} » (pas d'araignée d'eau à attraper)`);
      $("#btn-act").click(); frames(40);
      if(!state.carnet.insectes.araigneeEau) throw new Error("l'araignée d'eau n'est pas au carnet");
      lacherOiseau("colvert", mcx(t.i), mcz(t.i), -.18); frames(2);
      if(!bouton().includes("Lancer le filet")) throw new Error(`le bouton dit « ${bouton()} » (pas de canard colvert)`);
      $("#btn-act").click(); frames(40);
      if(!state.carnet.oiseaux.colvert) throw new Error("le canard colvert n'est pas au carnet");
      /* pêcher dans le chenal : un poisson-chat, juste devant */
      sacAdd("canneBois", 1); enMain("canneBois"); frames(2);
      if(!bouton().includes("Lancer")) throw new Error(`au bord du chenal, le bouton dit « ${bouton()} »`);
      if(!lacherOmbre(mcx(t.i) + t.dx * .3, mcz(t.i) + t.dz * .3, "poissonChat")) throw new Error("pas d'ombre de poisson possible dans le chenal");
      $("#btn-act").click();
      let k = 0;
      while(!bouton().includes("Ferrer") && k < 400){ frames(1); k++; }
      if(k >= 400) throw new Error("rien ne mord dans le chenal");
      $("#btn-act").click();
      if(!state.carnet.poissons.poissonChat) throw new Error("le poisson-chat n'est pas au carnet");
      frames(40);
      /* chasser : un ragondin sur un îlot, à 2,5 P, du côté d'où vient le vent */
      sacAdd("arcIf", 1); sacAdd("fleche", 5); enMain("arcIf");
      const w = vent();
      let s = null;
      for(let i = 0; i < WM * DM && !s; i++){
        if(marais.type[i] !== "terre" || !marcheMarais(mcx(i), mcz(i))) continue;
        const rx = mcx(i) - w.x * 2.5, rz = mcz(i) - w.z * 2.5, j = mtile(rx, rz);
        if(j >= 0 && marais.type[j] === "terre" && marcheMarais(rx, rz)) s = {x: mcx(i), z: mcz(i), rx, rz};
      }
      if(!s) throw new Error("aucune place pour chasser au Marais");
      placePlayer(s.x, s.z, -w.x, -w.z); frames(2);
      lacherGibier("ragondin", s.rx, s.rz); frames(2);
      if(!bouton().includes("Tirer")) throw new Error(`le bouton dit « ${bouton()} » (pas de ragondin à portée)`);
      $("#btn-act").click();
      k = 0;
      while(!state.carnet.gibier.ragondin && k < 60){ frames(1); k++; }
      if(!state.carnet.gibier.ragondin || !owned("fourrureImper")) throw new Error("le ragondin n'est pas touché, ou pas de fourrure imperméable");
      frames(40);
      return "une araignée d'eau et un canard colvert au filet, un poisson-chat, un ragondin à l'arc (sa fourrure imperméable)";
    } finally {
      state.sac = sac0; state.barre = barre0; hold(null); pauseChasse(true);
      if(currentPlace() && currentPlace().b.type === "marais"){ retourIle(centerOf(P.x), centerOf(P.z + P.n - 1), -1, 0); await attendre(() => !isInside()); }
    }
  });
  await etape("La hache selon l'essence : le frêne demande une hache en cuivre, le chêne séculaire une hache en bronze", async () => {
    let i = -1;
    for(let z = 2; z < N - 2 && i < 0; z++) for(let x = 2; x < N - 2; x++){
      const a = idx(x, z), s = idx(x, z + 1);
      if(map.type[a] === "grass" && !map.obj[a] && !occ.has(a) && !state.sol[a] && map.type[s] === "grass" && !map.obj[s] && !occ.has(s) && !state.sol[s] && !state.chemins[a]){ i = a; break; }
    }
    if(i < 0) throw new Error("pas de place pour un frêne");
    const x = i % N, z = Math.floor(i / N);
    const face = () => { placePlayer(centerOf(x), centerOf(z + 1) + .1, 0, -1); frames(1, .016); return $("#btn-act").dataset.action; };
    state.sac = state.sac.filter(it => !OUTILS[it.k] || OUTILS[it.k].famille !== "hache");
    state.barre = state.barre.map(it => it && OUTILS[it.k] && OUTILS[it.k].famille === "hache" ? null : it);
    place(4); sacAdd("hachePierre", 1); enMain("hachePierre");   // de la place pour le bois de frêne et sa graine (croix rouge de la v2.1.5 : sac plein)
    setObj(i, "frene");
    if(!face().includes("hache en cuivre")) throw new Error(`avec une hache en pierre, devant le frêne, le bouton dit « ${face()} »`);
    sacAdd("hacheCuivre", 1);
    /* la hache en cuivre dans le sac : c'est au joueur de la prendre en main (demande de Yo, 13 octobre 2026) ; le bouton dit
       le nom du frêne, et la hache en pierre en main explique pourquoi elle ne suffit pas */
    if(!face().includes("hache en cuivre") || $("#btn-act").textContent !== "🌳 Frêne") throw new Error(`la hache en cuivre dans le sac, le bouton dit « ${$("#btn-act").textContent} » (${face()})`);
    enMain("hacheCuivre");
    if(!face().includes("Couper le frêne")) throw new Error(`avec une hache en cuivre, le bouton dit « ${face()} »`);
    const avant = owned("boisFrene");
    for(let k = 0; k < RECOLTE.frene.coups; k++){ face(); $("#btn-act").click(); frames(25); }
    if(map.obj[i] !== "souche") throw new Error(`à la place du frêne : ${map.obj[i]} au lieu de sa souche (sac : ${state.sac.length} emplacements pris ; dernier message : « ${($("#toast") || {}).textContent || ""} »)`);   // sa souche reste (étape 2.1)
    if(owned("boisFrene") <= avant) throw new Error("pas de bois de frêne");
    setObj(i, "chene");
    if(!face().includes("hache en bronze")) throw new Error(`avec une hache en cuivre, devant le chêne séculaire, le bouton dit « ${face()} »`);
    setObj(i, null);
    if(!(OUTILS.epeeBronze && OUTILS.epeeBronze.force === 3) || !ATELIERS.forge.recettes.some(r => r.out === "epeeBronze")) throw new Error("pas d'épée en bronze à l'enclume");
    return `le frêne coupé à la hache en cuivre (+${owned("boisFrene") - avant} bois de frêne) ; le chêne séculaire attend la hache en bronze ; l'épée en bronze à l'enclume`;
  });
  await etape("Creuser et combler à la pelle", async () => {
    place(1);
    sacAdd("pelleBois", 1); enMain("pelleBois");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    /* une case d'herbe libre sur la place du village, avec une case libre en dessous pour s'y tenir */
    const c = Math.floor(N / 2), libre = j => map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    let t = null;
    for(let r = 2; r < 9 && !t; r++) for(const [dx, dz] of [[0, -r], [r, 0], [-r, 0], [0, r], [r, r], [-r, -r]]){
      const x = c + dx, z = c + dz, i = idx(x, z);
      if(libre(i) && libre(idx(x, z + 1))){ t = {x, z, i}; break; }
    }
    if(!t) throw new Error("pas de case d'herbe libre sur la place");
    placePlayer(centerOf(t.x), centerOf(t.z + 1), 0, -1); frames(1);
    if(!$("#btn-act").dataset.action.includes("Creuser")) throw new Error(`face à l'herbe, la pelle en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
    for(let k = 0; k < OUTILS.pelleBois.coups; k++){ $("#btn-act").click(); frames(1); }
    if(map.type[t.i] !== "water" || state.terrain[t.i] !== "water") throw new Error(`après ${OUTILS.pelleBois.coups} coups de pelle, la case n'est pas de l'eau`);
    if(!$("#btn-act").dataset.action.includes("Combler")) throw new Error(`face à l'eau creusée, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click(); frames(1);
    if(map.type[t.i] !== "grass" || state.terrain[t.i]) throw new Error("la case n'est pas comblée");
    hold(null);
    return `${OUTILS.pelleBois.coups} coups de pelle : de l'eau, puis comblée`;
  });
  await etape("Tracer un chemin en marchant, puis l'enlever à la pelle", async () => {
    place(2);
    sacAdd("planche", 6); sacAdd("pelleBois", 1);
    keys.u = keys.d = keys.l = keys.r = 0;
    /* une rangée de 5 cases libres sur la place du village, pour marcher vers la droite */
    const c = Math.floor(N / 2), libre = j => map.type[j] !== "water" && !map.obj[j] && !occ.has(j) && !state.chemins[j];
    let rang = null;
    for(let dz = 1; dz < 8 && rang === null; dz++) for(const z of [c + dz, c - dz]) if([0, 1, 2, 3, 4].every(k => libre(idx(c - 2 + k, z)))){ rang = z; break; }
    if(rang === null) throw new Error("pas de rangée libre sur la place");
    enMain("planche");
    placePlayer(centerOf(c - 2), centerOf(rang), 1, 0); updateChemins(true);
    const bt = $("#btn-tracer");
    if(bt.hidden || !bt.textContent.includes("planches")) throw new Error(`des planches en main, le bouton « Tracer » ${bt.hidden ? "n'apparaît pas" : `dit « ${bt.textContent} »`}`);
    bt.click();
    const avant = owned("planche");
    keys.r = 1; for(let f = 0; f < 50; f++){ updatePlayer(.016); updateChemins(true); } keys.r = 0; updatePlayer(.016);
    bt.click();
    const poses = [0, 1, 2, 3, 4].filter(k => state.chemins[idx(c - 2 + k, rang)] === "planches").length;
    if(poses < 2) throw new Error(`${poses} case de chemin en marchant`);
    if(owned("planche") !== avant - poses) throw new Error("les planches ne sont pas prises une par case");
    /* la pelle, tournée vers le chemin derrière soi, enlève une case et rend sa planche */
    enMain("pelleBois");
    const p = player.position; placePlayer(p.x, p.z, -1, 0);
    for(const dx of [0, -1]) pickUp(idx(tileOf(p.x) + dx, tileOf(p.z)));   // un petit caillou revenu là pendant l'essai cacherait le chemin
    frames(1);
    if(!$("#btn-act").dataset.action.includes("Enlever")) throw new Error(`face au chemin, la pelle en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
    const pl = owned("planche"); $("#btn-act").click(); frames(1);
    if(owned("planche") !== pl + 1) throw new Error("la planche du chemin enlevé n'est pas rendue");
    hold(null);
    return `${poses} cases de planches en marchant, une enlevée à la pelle`;
  });
  await etape("Les fleurs : cueillir, déterrer à la pelle, replanter la graine", async () => {
    place(3);
    const sauvages = map.obj.filter(o => FLEURS[o]).length;
    if(sauvages < 10) throw new Error(`seulement ${sauvages} fleurs sauvages sur l'île`);
    /* une fleur de la saison, plantée il y a longtemps (en fleur), sur une case libre de la place du village */
    const k = Object.keys(FLEURS).find(f => enFleur(FLEURS[f]));
    const c = Math.floor(N / 2), libre = j => map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j] && !state.chemins[j];
    let t = null;
    for(let r = 2; r < 9 && !t; r++) for(const [dx, dz] of [[0, -r], [r, 0], [-r, 0], [0, r], [r, r], [-r, -r], [r, -r], [-r, r]]){
      const x = c + dx, z = c + dz, i = idx(x, z);
      if(libre(i) && libre(idx(x, z + 1))){ t = {x, z, i}; break; }
    }
    if(!t) throw new Error("pas de case libre sur la place");
    setObj(t.i, k, Date.now() - FLEUR_RARETE[FLEURS[k].rarete].pousse * 1000 - 1000);
    hold(null); keys.u = keys.d = keys.l = keys.r = 0;
    placePlayer(centerOf(t.x), centerOf(t.z + 1), 0, -1); frames(1);
    if(!$("#btn-act").dataset.action.includes("Cueillir")) throw new Error(`face à ${FLEURS[k].nom.toLowerCase()} en fleur, le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = owned(k);
    $("#btn-act").click(); frames(1);
    if(owned(k) !== avant + 1) throw new Error("la fleur cueillie n'est pas dans le sac");
    if(!$("#btn-act").dataset.action.includes("refleurit")) throw new Error(`cueillie, le bouton dit « ${$("#btn-act").dataset.action} »`);
    /* la pelle la déterre : sa graine revient dans le sac */
    if(!owned("pelleBois")) sacAdd("pelleBois", 1);
    enMain("pelleBois"); frames(1);
    const g = graineDeFleur(k), gAvant = owned(g);
    if(!$("#btn-act").dataset.action.includes("Déterrer")) throw new Error(`pelle en main, face à la fleur, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click(); frames(1);
    if(map.obj[t.i] || owned(g) !== gAvant + 1) throw new Error("déterrée, la fleur ne rend pas sa graine");
    /* la graine replantée */
    enMain(g); frames(1);
    if(!$("#btn-act").dataset.action.includes("Planter")) throw new Error(`la graine en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click(); frames(1);
    if(map.obj[t.i] !== k) throw new Error("la graine n'est pas plantée");
    /* bug de Yo (v1.9.8) : le bouton d'un long message ne doit jamais aller sous le joystick (le texte de sa capture) */
    const bt = $("#btn-act"), avantTexte = bt.textContent;
    bt.hidden = false; bt.textContent = "🌱 Jeune tulipe : elle sera grande dans 2 h 37, et fleurira au printemps";
    const ba = bt.getBoundingClientRect(), jo = $("#joy").getBoundingClientRect();
    bt.textContent = avantTexte; frames(1);
    if(ba.right > jo.left && ba.bottom > jo.top && ba.top < jo.bottom) throw new Error("un bouton au long texte passe sous le joystick");
    hold(null);
    return `${sauvages} touffes sauvages ; ${FLEURS[k].nom.toLowerCase()} : cueilli${FLEURS[k].une ? "e" : ""}, déterré${FLEURS[k].une ? "e" : ""}, replanté${FLEURS[k].une ? "e" : ""}`;
  });
  await etape("Attraper un insecte au filet", async () => {
    place(2);
    sacAdd("filet", 1); enMain("filet");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);                   // immobile : on ne fait peur à personne
    const libre = j => j >= 0 && j < N * N && map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    const i = map.obj.findIndex((o, j) => libre(j) && libre(j + N) && libre(j - N) && libre(j + 1) && libre(j - 1));
    if(i < 0) throw new Error("pas de place libre");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1);
    lacherInsecte("fourmi", player.position.x, player.position.z + .7, .03);
    frames(2);
    if(!$("#btn-act").dataset.action.includes("Attraper")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = owned("fourmi");
    $("#btn-act").click();
    if(owned("fourmi") <= avant) throw new Error("pas de fourmi dans le sac");
    if(!state.carnet.insectes.fourmi) throw new Error("la fourmi n'est pas au carnet");
    frames(40);
    return "une fourmi, inscrite au carnet";
  });
  await etape("Attraper une luciole au bocal (le verre de la mine)", async () => {
    place(2);
    sacAdd("bocal", 1); enMain("bocal");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    const libre = j => j >= 0 && j < N * N && map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    const i = map.obj.findIndex((o, j) => libre(j) && libre(j + N) && libre(j - N) && libre(j + 1) && libre(j - 1));
    if(i < 0) throw new Error("pas de place libre");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1);
    lacherInsecte("luciole", player.position.x, player.position.z + .7, .03);
    frames(2);
    if(!$("#btn-act").dataset.action.includes("🫙")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = owned("luciole");
    $("#btn-act").click();
    if(owned("luciole") <= avant) throw new Error("pas de luciole dans le sac");
    frames(40);
    return "une luciole, prise au bocal";
  });
  await etape("Les outils en cuivre et en bronze : un filet qui attrape de plus loin, un arrosoir qui arrose plusieurs buissons, le fil de la canne en bois qui casse", async () => {
    place(3);
    const sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre));   // rendus à la fin : les essais suivants ont besoin de place
    try {
    const sans = f => { state.sac = state.sac.filter(it => !OUTILS[it.k] || OUTILS[it.k].famille !== f); state.barre = state.barre.map(it => it && OUTILS[it.k] && OUTILS[it.k].famille === f ? null : it); };
    const libre = j => j >= 0 && j < N * N && map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j] && !state.chemins[j];
    /* le filet en cuivre : un demi-pas plus loin */
    sans("filet"); sacAdd("filet", 1); enMain("filet");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    const i = map.obj.findIndex((o, j) => libre(j) && libre(j + N) && libre(j - N) && libre(j + 1) && libre(j - 1) && libre(j - 2 * N));
    if(i < 0) throw new Error("pas de place libre");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1);
    lacherInsecte("fourmi", player.position.x, player.position.z + 1.6, .03); frames(2);
    if(!$("#btn-act").hidden && $("#btn-act").dataset.action.includes("Attraper")) throw new Error("le filet en bois attrape déjà à 1,6 P");
    sacAdd("filetCuivre", 1); enMain("filetCuivre"); frames(2);
    if(!$("#btn-act").dataset.action.includes("Attraper")) throw new Error(`avec le filet en cuivre, à 1,6 P, le bouton dit « ${$("#btn-act").dataset.action} »`);
    const fourmis = owned("fourmi");
    $("#btn-act").click(); frames(40);
    if(owned("fourmi") <= fourmis) throw new Error("la fourmi n'est pas prise au filet en cuivre");
    /* l'arrosoir en bronze : trois buissons vides côte à côte, arrosés d'un coup */
    forcerMeteo("beau");
    const b = map.obj.findIndex((o, j) => libre(j) && libre(j - 1) && libre(j + 1) && libre(j + N) && libre(j + N - 1) && libre(j + N + 1));
    if(b < 0) throw new Error("pas de place pour trois buissons");
    const buissons = [b - 1, b, b + 1];
    try {
      for(const j of buissons){ setObj(j, "buisson"); setEtat(j, {vide: Date.now()}); }
      sans("arrosoir"); sacAdd("arrosoirBronze", 1); enMain("arrosoirBronze"); state.eau = OUTILS.arrosoirBronze.eau;
      placePlayer(centerOf(b % N), centerOf(Math.floor(b / N) + 1) + .1, 0, -1); frames(1, .016);
      if(!$("#btn-act").dataset.action.includes("Arroser")) throw new Error(`devant un buisson vide, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click(); frames(10);
      const arroses = buissons.filter(j => state.ile[j] && state.ile[j].arrose).length;
      if(arroses !== 3) throw new Error(`l'arrosoir en bronze a arrosé ${arroses} buisson(s) au lieu de 3`);
      if(state.eau !== OUTILS.arrosoirBronze.eau - 1) throw new Error("un seul arrosage aurait dû servir");
    } finally { for(const j of buissons) setObj(j, null); forcerMeteo(null); hold(null); }
    /* la canne en bois : le fil casse sur un poisson légendaire */
    sans("canne"); place(1); sacAdd("canneBois", 1); enMain("canneBois"); place(1);   // sac plein : pas de pêche
    let t = null;
    for(let z = 1; z < N - 1 && !t; z++) for(let x = 1; x < N - 1; x++){
      const a = idx(x, z), s2 = idx(x, z + 1);
      if(map.type[a] !== "water" && a !== entreePonton && !map.obj[a] && !occ.has(a) && !state.sol[a] && eauLibre(s2)){ t = [x, z]; break; }
    }
    if(!t) throw new Error("aucun bord de l'eau");
    placePlayer(centerOf(t[0]), centerOf(t[1]) + .2, 0, 1); frames(2);
    const o = lacherOmbre(centerOf(t[0]), centerOf(t[1]) + 2.2);
    if(!o) throw new Error("pas d'ombre de poisson possible ici");
    for(const s2 of ombresIci()){ s2.k = "carpeOr"; s2.cm = 100; }       // toutes les ombres d'ici : légendaires
    try {
      $("#btn-act").click();
      let k = 0;
      while(!$("#btn-act").dataset.action.includes("Ferrer") && k < 400){ frames(1); k++; }
      if(k >= 400) throw new Error("le poisson ne mord jamais");
      $("#btn-act").click();
      if(owned("carpeOr")) throw new Error("la canne en bois a retenu un poisson légendaire");
      if(!$("#toast").textContent.includes("fil casse")) throw new Error(`pas de message de fil cassé (« ${$("#toast").textContent} »)`);
    } finally { hold(null); frames(20); }
    if(!["pelleBronze", "arrosoirCuivre", "canneCuivre", "canneBronze", "filetBronze", "bocalCuivre", "bocalBronze"].every(r => ATELIERS.forge.recettes.some(x => x.out === r))) throw new Error("des outils manquent à l'enclume");
    return "une fourmi prise à 1,6 P au filet en cuivre ; 3 buissons arrosés d'un coup ; la Vieille Carpe d'or casse le fil de la canne en bois";
    } finally { state.sac = sac0; state.barre = barre0; hold(null); }
  });
  await etape("Attraper un oiseau au filet", async () => {
    place(1);
    if(!owned("filet")) sacAdd("filet", 1);
    enMain("filet");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    lacherOiseau("moineau", player.position.x, player.position.z + 1.4);
    frames(2);
    if(!$("#btn-act").dataset.action.includes("Lancer le filet")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} »`);
    const avant = owned("moineau");
    $("#btn-act").click();
    if(owned("moineau") <= avant) throw new Error("pas de moineau dans le sac");
    if(!state.carnet.oiseaux.moineau) throw new Error("le moineau n'est pas au carnet");
    frames(40);
    return "un moineau, inscrit au carnet";
  });
  await etape("La vie de la Forêt profonde : un insecte, un oiseau, un poisson du ruisseau", async () => {
    place(4);
    await entrer(state.buildings.find(b => b.type === "foret"));
    if(!owned("filet")) sacAdd("filet", 1);
    if(!owned("canneBois")) sacAdd("canneBois", 1);
    enMain("filet");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    /* une case libre au bord de l'eau, face à l'eau */
    let t = null;
    for(let i = 0; i < WF * WF && !t; i++){
      if(foret.type[i] !== "eau") continue;
      for(const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]){
        const x = i % WF + dx, z = Math.floor(i / WF) + dz, j = z * WF + x;
        if(x > 1 && z > 1 && x < WF - 2 && z < WF - 2 && foret.type[j] !== "eau" && !foret.obj[j]){ t = {i, j, dx: -dx, dz: -dz}; break; }
      }
    }
    if(!t) throw new Error("aucun bord du ruisseau");
    placePlayer(fcx(t.j), fcz(t.j), t.dx, t.dz); frames(2);
    const p = player.position, pris = [];
    /* un phasme sur la rive, puis un pic vert posé un peu plus loin */
    lacherInsecte("phasme", p.x - t.dz * .7, p.z + t.dx * .7, .1); frames(2);
    if(!$("#btn-act").dataset.action.includes("Attraper")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} » (pas d'insecte à attraper)`);
    $("#btn-act").click(); frames(40);
    if(!state.carnet.insectes.phasme) throw new Error("le phasme n'est pas au carnet");
    lacherOiseau("picVert", p.x + t.dz * 1.4, p.z - t.dx * 1.4); frames(2);
    if(!$("#btn-act").dataset.action.includes("Lancer le filet")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} » (pas d'oiseau)`);
    $("#btn-act").click(); frames(40);
    if(!state.carnet.oiseaux.picVert) throw new Error("le pic vert n'est pas au carnet");
    /* pêcher : la canne en main, une ombre dans l'eau, juste devant */
    enMain("canneBois"); frames(2);
    if(!$("#btn-act").dataset.action.includes("Lancer")) throw new Error(`au bord du ruisseau, le bouton dit « ${$("#btn-act").dataset.action} »`);
    if(!lacherOmbre(fcx(t.i) + t.dx * .3, fcz(t.i) + t.dz * .3)) throw new Error("pas d'ombre de poisson possible dans le ruisseau");
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").dataset.action.includes("Ferrer") && k < 400){ frames(1); k++; }
    if(k >= 400) throw new Error("rien ne mord dans le ruisseau");
    $("#btn-act").click();
    const poisson = Object.keys(state.carnet.poissons).find(f => [].concat(POISSONS[f].lieu).some(l => l === "ruisseau" || l === "source"));
    if(!poisson) throw new Error("pas de poisson du ruisseau au carnet");
    frames(40);
    await sortir();
    return `un phasme, un pic vert et ${objet(poisson).une ? "une" : "un"} ${objet(poisson).nom.toLowerCase()}`;
  });
  await etape("Chasser à l'arc : un chevreuil, et le présent du Cerf blanc", async () => {
    place(5);
    pauseChasse(true);
    await entrer(state.buildings.find(b => b.type === "foret"));
    sacAdd("arcIf", 1); sacAdd("fleche", 5); enMain("arcIf");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    frames(2);
    if($("#vent").hidden) throw new Error("pas de flèche du vent dans la forêt");
    /* un chevreuil à 2,5 P, du côté d'où vient le vent : il ne nous sent pas */
    const p = player.position, w = vent(), avant = owned("viandeGibier");
    lacherGibier("chevreuil", p.x - w.x * 2.5, p.z - w.z * 2.5); frames(2);
    if(!$("#btn-act").dataset.action.includes("Tirer")) throw new Error(`le bouton dit « ${$("#btn-act").dataset.action} » (pas de gibier à portée)`);
    $("#btn-act").click();
    let k = 0;
    while(!state.carnet.gibier.chevreuil && k < 60){ frames(1); k++; }
    if(!state.carnet.gibier.chevreuil) throw new Error("le chevreuil n'est pas touché");
    if(owned("viandeGibier") < avant + 2 || !owned("cuir")) throw new Error("pas de viande ni de cuir dans le sac");
    if(owned("fleche") < 5) throw new Error("la flèche n'est pas reprise");
    frames(40);
    /* le présent du Cerf blanc, posé devant soi */
    place(1); lacherCerfBlanc(true); frames(2);
    if(!$("#btn-act").dataset.action.includes("bois d'argent")) throw new Error(`devant le présent du Cerf blanc, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(!owned("boisArgent") || !state.cerfBlanc) throw new Error("le bois d'argent n'est pas dans le sac");
    await sortir();
    return "un chevreuil (2 viandes, 1 cuir, la flèche reprise), puis le bois d'argent";
  });
  await etape("Les flèches à pointe de métal : le tir est plus sûr, et la même flèche revient", async () => {
    if(!(chanceDe(6, "flecheBronze") > chanceDe(6, "flecheCuivre") && chanceDe(6, "flecheCuivre") > chanceDe(6, "fleche"))) throw new Error("une pointe de métal ne rend pas le tir plus sûr");
    if(!["flecheCuivre", "flecheBronze"].every(r => ATELIERS.forge.recettes.some(x => x.out === r))) throw new Error("pas de flèches à pointe de métal à l'enclume");
    place(3); pauseChasse(true);
    await entrer(state.buildings.find(b => b.type === "foret"));
    try {
      if(!owned("arcIf")) sacAdd("arcIf", 1);
      sacAdd("flecheBronze", 2); enMain("arcIf");
      keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016); frames(2);
      const p = player.position, w = vent(), pierre = owned("fleche"), bronze = owned("flecheBronze");
      lacherGibier("chevreuil", p.x - w.x * 5, p.z - w.z * 5); frames(2);
      /* la bête peut avoir bougé un peu (machine de GitHub lente) : une petite marge autour de 5 P */
      const m = $("#btn-act").dataset.action.match(/\((\d+) %\)/), pct = m ? +m[1] : 0;
      const bas = Math.round(chanceDe(5.3, "flecheBronze") * 100), haut = Math.round(chanceDe(4.7, "flecheBronze") * 100);
      if(pct < bas || pct > haut) throw new Error(`à 5 P avec une flèche en bronze, le bouton dit « ${$("#btn-act").dataset.action} » (attendu entre ${bas} et ${haut} %)`);
      if(pct <= Math.round(chanceDe(4.7, "fleche") * 100)) throw new Error("la flèche en bronze n'est pas plus sûre que celle en pierre");
      const attendu = `${pct} %`;
      lacherGibier("chevreuil", p.x - w.x * 2.5, p.z - w.z * 2.5); frames(2);
      const avant = state.carnet.gibier.chevreuil ? state.carnet.gibier.chevreuil.n : 0;
      $("#btn-act").click();
      let k = 0;
      while((state.carnet.gibier.chevreuil ? state.carnet.gibier.chevreuil.n : 0) === avant && k < 60){ frames(1); k++; }
      if((state.carnet.gibier.chevreuil ? state.carnet.gibier.chevreuil.n : 0) === avant) throw new Error("le chevreuil n'est pas touché");
      if(owned("flecheBronze") !== bronze || owned("fleche") !== pierre) throw new Error("ce n'est pas la flèche en bronze qui est partie et revenue");
      frames(40);
      return `à 5 P : ${Math.round(chanceDe(5) * 100)} % avec une pointe de pierre, ${attendu} avec une pointe de bronze ; la flèche en bronze reprise`;
    } finally { pauseChasse(true); await sortir(); }
  });
  await etape("La grotte : y entrer depuis la forêt, descendre d'un palier, remonter", async () => {
    place(2);
    await entrer(state.buildings.find(b => b.type === "foret"));
    sacAdd("torche", 2); hold(null); mettreEnCase(1, "torche");   // la torche dans une case : elle s'allume dans le noir
    const E = ENTREE_GROTTE;
    placePlayer(E.x, E.z + R + .05, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace() && currentPlace().b.type === "grotte")) throw new Error("on n'entre pas dans la grotte par les racines");
    await wait(400);
    if(!(state.torche > 0) || !torcheAllumee()) throw new Error("la torche ne s'allume pas dans la grotte");
    const bas = currentPlace().room.passages.find(p => p.vers === "bas");
    if(!bas) throw new Error("pas de trou pour descendre");
    placePlayer(bas.x, bas.z + .3, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace().b.palier === 2)) throw new Error("on ne descend pas au palier 2");
    const haut = currentPlace().room.passages.find(p => p.vers === "haut");
    placePlayer(haut.x, haut.z + .3, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace().b.type === "foret")) throw new Error("la corde ne ramène pas à la forêt");
    await sortir();
    return "palier 1, palier 2, puis la corde jusqu'à la forêt";
  });
  await etape("Le combat : un loup mord, la roulade esquive, l'épée le vainc, le poisson grillé soigne, vaincu", async () => {
    place(7);                                          // l'épée, le poisson grillé, et ce que laissent le loup et la chauve-souris
    await entrer(state.buildings.find(b => b.type === "foret"));
    sacAdd("epeeBois", 1); sacAdd("poissonGrille", 1); enMain("epeeBois");
    /* bug de Yo (v1.9.4) : toutes ses torches rangées au coffre, une torche entamée s'allumait quand même */
    state.sac = state.sac.filter(it => it.k !== "torche"); state.barre = state.barre.map(it => it && it.k === "torche" ? null : it);
    state.torche = 300;
    const E = ENTREE_GROTTE;
    placePlayer(E.x, E.z + R + .05, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace() && currentPlace().b.type === "grotte")) throw new Error("on n'entre pas dans la grotte");
    if(torcheAllumee()) throw new Error("une torche s'allume dans la grotte alors qu'on n'en porte aucune");
    if($("#coeurs").hidden || $("#combat").hidden) throw new Error("pas de cœurs ni de boutons de combat dans la grotte");
    if(vieCombat() !== COMBAT.vie) throw new Error(`${vieCombat()} cœurs en entrant, au lieu de ${COMBAT.vie}`);
    /* un loup qui bondit tout près : il mord */
    let p = player.position;
    lacherMonstre("loup", p.x + .9, p.z, "bond");
    if(!await attendre(() => vieCombat() < COMBAT.vie, 3000)) throw new Error("le loup qui bondit ne mord pas");
    if($("#coeurs").querySelectorAll(".vide").length !== COMBAT.vie - vieCombat()) throw new Error("le cœur perdu ne se voit pas");
    /* un autre bondit pendant une roulade : il ne touche pas */
    await wait(COMBAT.repit * 1000 + 200);
    const vie = vieCombat(); p = player.position;
    lacherMonstre("loup", p.x - .9, p.z, "bond"); combat.rouler();
    await wait(600);
    if(vieCombat() < vie) throw new Error("la roulade n'esquive pas le bond du loup");
    /* frapper à l'épée en bois (prise dans le sac), le loup le plus proche, jusqu'à le vaincre */
    const avant = monstresVaincus();
    let coups = 0;
    while(monstresVaincus() === avant && coups < 12){ combat.attaquer(); coups++; await wait(COMBAT.coup * 1000 + 100); }
    if(monstresVaincus() === avant) throw new Error("aucun loup vaincu à l'épée");
    if(state.main !== "epeeBois") throw new Error("l'épée n'est pas prise en main");
    if(!owned("croc") || !owned("fourrureGrise") || !state.carnet.monstres.loup) throw new Error("le loup vaincu ne laisse ni croc ni fourrure, ou n'est pas au carnet");
    pauseMonstres(true);                               // l'autre loup s'en va
    /* une chauve-souris qui remonte après son plongeon : un coup suffit */
    p = player.position;
    lacherMonstre("chauveSouris", p.x + 1, p.z, "remonte");
    combat.attaquer(); await wait(200);
    if(!owned("aileMembraneuse")) throw new Error("la chauve-souris n'est pas vaincue d'un coup d'épée");
    /* le poisson grillé rend des cœurs */
    const v = vieCombat(), poissons = sacCount("poissonGrille");
    combat.manger();
    if(vieCombat() !== Math.min(COMBAT.vie, v + COMBAT.soin) || sacCount("poissonGrille") !== poissons - 1) throw new Error(`le poisson grillé ne soigne pas (${v} → ${vieCombat()} cœurs)`);
    /* vaincu : la moitié du butin de la grotte est perdue (4 pierres, comme minées ici : 2 perdues), jamais l'épée ;
       on se réveille au village (pas de Chaumière dans cette partie : sur la place), toute sa vie revenue */
    sacAdd("pierre", 4);
    const pierres = owned("pierre"), epees = owned("epeeBois");
    await wait(COMBAT.repit * 1000 + 200);
    p = player.position;
    combat.blesser(vieCombat(), {x: p.x + 1, z: p.z});
    if(!await attendre(() => !isInside() || currentPlace().b.type === "chaumiere")) throw new Error("vaincu, on ne se réveille pas au village");
    if(owned("pierre") !== pierres - 2) throw new Error(`vaincu, ${pierres - owned("pierre")} pierres perdues sur les 4 ramassées dans la grotte, au lieu de 2`);
    if(owned("epeeBois") !== epees) throw new Error("vaincu, l'épée est perdue");
    if(!await attendre(() => !$("#sheetWrap").hidden && $("#sheet").textContent.includes("Vaincu"), 2500)) throw new Error("pas de panneau au réveil");
    $("#sheetWrap [data-close]").click(); await wait(300);
    if(vieCombat() !== COMBAT.vie || !$("#coeurs").hidden) throw new Error("la vie ne revient pas au réveil");
    return `mordu (${COMBAT.vie - vie} cœur), esquivé, un loup vaincu en ${coups} coups, une chauve-souris, soigné ; vaincu : 2 pierres perdues sur 4, l'épée gardée, réveil au village`;
  });
  await etape("Le Gardien d'écorce : au fond du troisième palier, ses racines s'illuminent, la roulade les évite, vaincu il laisse la carte du Marais", async () => {
    place(4);
    const sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre));   // rendus à la fin : les essais suivants ont besoin de place
    await entrer(state.buildings.find(b => b.type === "foret"));
    sacAdd("epeeBronze", 1); enMain("epeeBronze");
    const E = ENTREE_GROTTE;
    placePlayer(E.x, E.z + R + .05, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace() && currentPlace().b.type === "grotte")) throw new Error("on n'entre pas dans la grotte");
    try {
      for(const n of [2, 3]){                                    // descendre jusqu'au fond
        const bas = currentPlace().room.passages.find(p => p.vers === "bas");
        if(!bas) throw new Error(`pas de trou pour descendre au palier ${n}`);
        if(n === 3) pauseMonstres(false);                        // au dernier palier, ses habitants (dont le Gardien)
        placePlayer(bas.x, bas.z + .3, 0, -1); checkDoors(true);
        if(!await attendre(() => currentPlace().b.palier === n)) throw new Error(`on ne descend pas au palier ${n}`);
      }
      const a = antre();
      if(!a) throw new Error("pas d'antre du Gardien au troisième palier");
      if(!gardienIci()) throw new Error("le Gardien d'écorce n'est pas au fond de la grotte");
      pauseMonstres(true);                                       // les autres s'en vont : le Gardien seul, réveillé tout près
      placePlayer(a.x, a.z + 3.2, 0, -1);
      const g = lacherMonstre("gardien", a.x, a.z, "approche");
      if(!await attendre(() => racinesIci() > 0, 4000)) throw new Error("ses racines ne s'illuminent pas sous le personnage");
      const vie = vieCombat();
      combat.rouler();
      await wait(1600);
      if(vieCombat() < vie) throw new Error("la roulade n'évite pas ses racines");
      g.vie = 3;                                                 // pour aller vite : un coup d'épée en bronze
      const avant = monstresVaincus();
      let coups = 0;
      while(monstresVaincus() === avant && coups < 12){ combat.attaquer(); coups++; await wait(COMBAT.coup * 1000 + 100); }
      if(monstresVaincus() === avant) throw new Error("le Gardien n'est pas vaincu à l'épée");
      if(!state.cartes || !state.cartes.marais) throw new Error("vaincu, il ne laisse pas la carte du Marais");
      if(!owned("coeurDeBois") || !state.carnet.monstres.gardien) throw new Error("pas de cœur de bois, ou le Gardien n'est pas au carnet");
      return `le Gardien endormi au fond du palier 3 ; ses racines évitées d'une roulade ; vaincu en ${coups} coup${coups > 1 ? "s" : ""} : la carte du Marais et un cœur de bois`;
    } finally {
      const haut = currentPlace() && currentPlace().room.passages && currentPlace().room.passages.find(p => p.vers === "haut");
      if(haut){ placePlayer(haut.x, haut.z + .3, 0, -1); checkDoors(true); await attendre(() => currentPlace().b.type === "foret"); }
      if(currentPlace() && currentPlace().b.type === "foret") await sortir();
      state.sac = sac0; state.barre = barre0; hold(null);
    }
  });
  await etape("La grotte du Marais : le Puits aux Brumes, une poche de gaz, un crapaud-poison, l'Hydre des brumes et la carte du Récif", async () => {
    const P = state.ponton, sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre)), cartes0 = {...(state.cartes || {})};
    allerA({type: "marais"}, DEPART, {x: centerOf(P.x), z: centerOf(P.z + P.n - 1)});
    if(!await attendre(() => currentPlace() && currentPlace().b.type === "marais")) throw new Error("on n'arrive pas au Marais");
    try {
      state.sac = []; state.barre = [null, null, null]; hold(null);
      sacAdd("epeeBronze", 1); enMain("epeeBronze");
      pauseMonstres(false);                                      // ses habitants, ses poches de gaz
      placePlayer(PUITS.x, PUITS.z + R + .05, 0, -1); checkDoors(true);
      if(!await attendre(() => currentPlace() && currentPlace().b.type === "grotte" && currentPlace().b.zone === "marais")) throw new Error("on n'entre pas dans le Puits aux Brumes");
      /* une poche de gaz : sous les pieds du personnage, elle jaunit, puis son nuage l'atteint */
      if(!await attendre(() => pochesIci().length > 0, 3000)) throw new Error("pas de poche de gaz dans le Puits aux Brumes");
      const poche = pochesIci()[0];
      placePlayer(poche.x, poche.z + .3, 0, -1); eclaterPoche(poche);
      if(!await attendre(() => poche.touche, 5000)) throw new Error(`la poche de gaz n'atteint pas le personnage (elle est « ${poche.etat} »)`);
      /* un crapaud-poison, tout près : un coup d'épée en bronze */
      pauseMonstres(true);
      const ici = player.position, avant = monstresVaincus();
      lacherMonstre("crapaud", ici.x, ici.z - 1.4, "souffle");
      for(let k = 0; k < 6 && monstresVaincus() === avant; k++){ combat.attaquer(); await wait(COMBAT.coup * 1000 + 100); }
      if(monstresVaincus() === avant || !state.carnet.monstres.crapaud || !owned("glandePoison")) throw new Error("le crapaud-poison n'est pas vaincu, ou pas de glande à poison");
      /* au fond, l'Hydre des brumes : une tête coupée repousse ; coupées toutes les trois, elle laisse la carte du Récif */
      state.cartes = state.cartes || {}; delete state.cartes.recif;
      const { entrerGrotte } = await import("../js/lieux.js");
      entrerGrotte(3);
      if(!await attendre(() => currentPlace().b.palier === 3)) throw new Error("on ne descend pas au fond du Puits aux Brumes");
      const a = antre();
      if(!a) throw new Error("pas de repaire de l'Hydre au troisième palier");
      pauseMonstres(true);
      placePlayer(a.x, a.z + 1.8, 0, -1);
      const h = lacherMonstre("hydre", a.x, a.z, "souffle");
      combat.attaquer(); await wait(COMBAT.coup * 1000 + 150);
      if(!h.tetes[0].coupee) throw new Error("un coup d'épée en bronze ne coupe pas une tête de l'Hydre");
      h.tetes[0].repousse = .05; await wait(400);
      if(h.tetes[0].coupee) throw new Error("la tête coupée ne repousse pas");
      const fin = monstresVaincus();
      for(let k = 0; k < 8 && monstresVaincus() === fin; k++){ h.etat = "souffle"; h.t = 0; combat.attaquer(); await wait(COMBAT.coup * 1000 + 100); }
      if(monstresVaincus() === fin) throw new Error(`l'Hydre n'est pas vaincue (ses têtes : ${h.tetes.map(t => t.coupee ? "coupée" : t.vie).join(", ")})`);
      if(!state.cartes.recif || !owned("ecailleHydre") || !state.carnet.monstres.hydre) throw new Error("vaincue, l'Hydre ne laisse pas la carte du Récif, ou pas d'écaille d'hydre");
      return "le Puits aux Brumes ; une poche de gaz qui jaunit puis éclate ; un crapaud-poison vaincu (sa glande à poison) ; l'Hydre : une tête repousse, puis les trois coupées : la carte du Récif et une écaille d'hydre";
    } finally {
      pauseMonstres(true);
      state.cartes = {...cartes0, ...(state.cartes && state.cartes.recif ? {recif: state.cartes.recif} : {})};
      state.sac = sac0; state.barre = barre0; hold(null);
      if(currentPlace() && ["grotte", "marais"].includes(currentPlace().b.type)){ retourIle(centerOf(P.x), centerOf(P.z + P.n - 1), -1, 0); await attendre(() => !isInside()); }
    }
  });
  await etape("Les mains : l'épée du sac ne sert pas ; l'arc à deux mains pose la torche au sol, vainc un loup et rend sa flèche", async () => {
    place(4);
    const sac0 = JSON.parse(JSON.stringify(state.sac)), barre0 = JSON.parse(JSON.stringify(state.barre));
    await entrer(state.buildings.find(b => b.type === "foret"));
    const E = ENTREE_GROTTE;
    placePlayer(E.x, E.z + R + .05, 0, -1); checkDoors(true);
    if(!await attendre(() => currentPlace() && currentPlace().b.type === "grotte")) throw new Error("on n'entre pas dans la grotte");
    try {
      pauseMonstres(true);
      state.barre = [null, null, null]; hold(null);
      sacAdd("torche", 2); mettreEnCase(1, "torche");
      if(!await attendre(() => torcheAllumee() && !torcheSol(), 2000)) throw new Error("la torche de la case ne s'allume pas dans la main gauche");
      /* une épée seulement dans le sac : ⚔️ ne frappe pas, il propose de la mettre dans une case */
      sacAdd("epeeBois", 1);
      let p = player.position;
      const loup = lacherMonstre("loup", p.x + 1, p.z, "souffle"), vie = loup.vie;
      combat.attaquer(); await wait(300);
      if(loup.vie < vie) throw new Error("l'épée restée dans le sac a frappé");
      if($("#sheetWrap").hidden) throw new Error("⚔️ ne propose pas de mettre l'épée dans une case");
      $("#sheetWrap [data-close]").click(); await wait(300);
      pauseMonstres(true);
      /* l'arc à deux mains : la torche se pose au sol, et continue d'éclairer */
      sacAdd("arcIf", 1); sacAdd("flecheBronze", 3); enMain("arcIf");
      if(!await attendre(() => torcheSol(), 2000)) throw new Error("prendre l'arc ne pose pas la torche au sol");
      if(!torcheAllumee()) throw new Error("la torche posée n'éclaire plus");
      p = player.position;
      const cible = lacherMonstre("loup", p.x + 2.5, p.z, "souffle"); cible.vie = 3;   // une flèche en bronze (3) suffit
      const fleches = owned("flecheBronze"), avant = monstresVaincus();
      combat.attaquer();
      if(!await attendre(() => monstresVaincus() > avant, 2500)) throw new Error("la flèche ne vainc pas le loup");
      if(owned("flecheBronze") !== fleches) throw new Error(`la flèche n'est pas rendue (${owned("flecheBronze")} au lieu de ${fleches})`);
      /* une autre arme en main : on reprend la torche, tout près */
      enMain("epeeBois"); await wait(200);
      const q = player.position;
      placePlayer(q.x + .3, q.z, -1, 0); frames(2);
      if(!$("#btn-act").dataset.action.includes("Reprendre la torche")) throw new Error(`près de la torche posée, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click();
      if(torcheSol()) throw new Error("la torche n'est pas reprise");
      /* la lanterne à main (morceau 4 des lumières) : elle passe avant la torche, qui ne brûle plus ; l'arc la pose au sol */
      const reste = state.torche;
      place(1); sacAdd("lanterneMain", 1); mettreEnCase(2, "lanterneMain");   // (le sac a pu se remplir de ce que laisse le loup)
      if(!await attendre(() => lanterneAllumee(), 2000)) throw new Error("la lanterne à main ne s'allume pas");
      if(state.torche < reste - .2) throw new Error("la torche brûle encore, la lanterne à main allumée");
      enMain("arcIf");
      if(!await attendre(() => torcheSol(), 2000)) throw new Error("prendre l'arc ne pose pas la lanterne au sol");
      enMain("epeeBois"); await wait(200);
      const l = player.position;
      placePlayer(l.x + .3, l.z, -1, 0); frames(2);
      if(!$("#btn-act").dataset.action.includes("Reprendre la lanterne")) throw new Error(`près de la lanterne posée, le bouton dit « ${$("#btn-act").dataset.action} »`);
      $("#btn-act").click();
      if(torcheSol() || dansCase("lanterneMain") < 0) throw new Error("la lanterne n'est pas reprise dans une case");
      return "l'épée du sac ne frappe pas ; l'arc pose la torche au sol ; un loup vaincu d'une flèche en bronze, la flèche rendue ; la torche reprise ; la lanterne à main allumée à sa place, posée pour l'arc, reprise";
    } finally {
      const room = currentPlace() && currentPlace().room;
      if(room && room.doorX !== null && currentPlace().b.type === "grotte"){ placePlayer(room.doorX, room.d / 2 - R - .03, 0, 1); checkDoors(true); await attendre(() => currentPlace().b.type === "foret"); }
      if(currentPlace() && currentPlace().b.type === "foret") await sortir();
      state.sac = sac0; state.barre = barre0; hold(null);
    }
  });
  await etape("Le sanglier de la forêt : touché à l'arc, il charge ; vaincu à l'épée", async () => {
    place(6);                                          // l'arc, les flèches, l'épée, et ce que laisse le sanglier
    pauseChasse(true);
    await entrer(state.buildings.find(b => b.type === "foret"));
    if(!owned("arcIf")) sacAdd("arcIf", 1);
    if(owned("fleche") < 2) sacAdd("fleche", 3);
    if(!owned("epeeBois")) sacAdd("epeeBois", 1);
    enMain("arcIf");
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016); frames(2);
    let p = player.position;
    const w = vent();
    lacherGibier("sanglier", p.x - w.x * 2.5, p.z - w.z * 2.5); frames(2);
    if(!$("#btn-act").dataset.action.includes("Tirer")) throw new Error(`devant le sanglier, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(!await attendre(() => monstresIci().some(m => m.foret), 3000)) throw new Error("touché, le sanglier ne se retourne pas");
    if($("#coeurs").hidden || $("#combat").hidden) throw new Error("pas de cœurs ni de boutons de combat quand le sanglier charge");
    enMain("epeeBois");                                // à l'épée (avec l'arc en main, ⚔️ tirerait)
    let coups = 0;
    while(monstresIci().length && coups < 20){
      const m = monstresIci()[0]; p = player.position;
      if(Math.hypot(m.x - p.x, m.z - p.z) > 2) placePlayer(m.x + 1.2, m.z, -1, 0);
      combat.attaquer(); coups++; await wait(COMBAT.coup * 1000 + 100);
    }
    if(monstresIci().length) throw new Error("le sanglier n'est pas vaincu à l'épée");
    if(!state.carnet.gibier.sanglier || !owned("cuirEpais") || !owned("defense")) throw new Error("le sanglier vaincu ne laisse ni cuir épais ni défense");
    if(!await attendre(() => $("#coeurs").hidden, 2000)) throw new Error("les cœurs restent après le combat");
    await sortir();
    return `${coups} coups d'épée, puis du cuir épais et une défense`;
  });
  await etape("Vendre au comptoir, tout de suite", async () => {
    /* un Marché d'essai, avec son comptoir, le temps de vendre un poisson (retiré ensuite) */
    const marche = {id: -1, type: "marche", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "comptoir", x: 0, z: 0, rot: 0}], next: 2}};
    state.buildings.push(marche);
    try {
      if(!state.sac.some(it => POISSONS[it.k])){ place(1); sacAdd("gardon", 1); }   // les poissons des essais d'avant ont pu être retirés pour faire de la place
      const poisson = state.sac.find(it => POISSONS[it.k]);
      if(!poisson) throw new Error("pas de poisson à vendre");
      const or = state.res.or, n = owned(poisson.k);
      openAtelier(marche); await wait(200);
      const b = $(`#sheet [data-fab='v:${poisson.k}']`);
      if(!b) throw new Error("pas de ligne pour vendre ce poisson");
      b.click();
      if(owned(poisson.k) !== n - 1) throw new Error("le poisson n'est pas parti");
      if(state.res.or <= or) throw new Error("pas d'or tout de suite");
      $("#sheetWrap [data-close]").click(); await wait(300);
      place(1); sacAdd("granit", 1);                        // ce qu'on rapporte de la mine se vend aussi (étape 1.11)
      openAtelier(marche); await wait(200);
      if(!$("#sheet [data-fab='v:granit']")) throw new Error("pas de ligne pour vendre le granit");
      $("#sheetWrap [data-close]").click(); await wait(300);
      return `+${state.res.or - or} or`;
    } finally {
      state.buildings.splice(state.buildings.indexOf(marche), 1); renderHUD();
    }
  });
  await etape("Le sac qui s'agrandit : tisser la toile, fabriquer le sac de cuir à l'atelier de décoration", async () => {
    /* une Chaumière d'essai, avec son atelier de décoration (retirée ensuite) ; le sac revient ensuite à la besace */
    const chaumiere = {id: -3, type: "chaumiere", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "atelierDeco", x: 0, z: 0, rot: 0}], next: 2}};
    state.buildings.push(chaumiere);
    const fini = async () => { const j = chaumiere.atelier.queue[0]; j.start = Date.now() - j.t * 1000 - 1000; j.end = Date.now() - 1000; await attendre(() => !chaumiere.atelier.queue.length, 4000); };
    try {
      place(3); sacAdd("fibre", 16); sacAdd("cuir", 3);
      openAtelier(chaumiere); await wait(200);
      const cle = k => `#sheet [data-fab='r${ATELIERS.chaumiere.recettes.findIndex(r => r.out === k)}']`;
      if($(cle("sacRenforce"))) throw new Error("le sac renforcé est proposé avant le sac de cuir");
      for(let n = 0; n < 4; n++){ $(cle("toile")).click(); await fini(); }
      if(owned("toile") < 4) throw new Error(`${owned("toile")} toiles tissées au lieu de 4`);
      openAtelier(chaumiere); await wait(200);
      const b = $(cle("sacCuir"));
      if(!b || b.disabled) throw new Error("pas de bouton pour fabriquer le sac de cuir");
      b.click(); await wait(100);
      if($(cle("sacCuir"))) throw new Error("le sac de cuir se propose encore, déjà en fabrication");
      await fini();
      if(state.sacNiveau !== 1 || placesSac() !== 16) throw new Error(`sac au niveau ${state.sacNiveau}, ${placesSac()} places`);
      if(owned("sacCuir")) throw new Error("le sac de cuir est dans le sac au lieu de le remplacer");
      openAtelier(chaumiere); await wait(200);
      if($(cle("sacCuir")) || !$(cle("sacRenforce"))) throw new Error("l'atelier ne propose pas le sac suivant");
      $("#sheetWrap [data-close]").click(); await wait(300);
      $("#btn-sac").click(); await wait(200);
      $("[data-sac-tab='sac']").click(); await wait(100);
      const cases = $("#sheet .sac-grid").children.length;
      if(!$("#sheet").textContent.includes("Sac de cuir")) throw new Error("l'écran du sac ne dit pas « Sac de cuir »");
      $("#sheetWrap [data-close]").click(); await wait(300);
      if(cases !== 16) throw new Error(`l'écran du sac montre ${cases} emplacements`);
      return "4 toiles, puis le sac de cuir : 16 emplacements";
    } finally {
      state.buildings.splice(state.buildings.indexOf(chaumiere), 1); state.sacNiveau = 0;
      while(state.sac.length > 12) state.sac.pop();
      renderHUD();
    }
  });
  await etape("Les pierres : ouvrir une géode, la page du carnet, la vitrine, le Cœur de la mine", async () => {
    /* une Carrière d'essai, avec sa table de taille, le temps d'ouvrir une géode (retirée ensuite) */
    const carriere = {id: -2, type: "carriere", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "tableTaille", x: 0, z: 0, rot: 0}], next: 2}};
    state.buildings.push(carriere);
    let cristal;
    try {
      place(4); sacAdd("geode", 1);
      openAtelier(carriere); await wait(200);
      const b = $(`#sheet [data-fab='r${ATELIERS.carriere.recettes.findIndex(r => r.hasard)}']`);
      if(!b || b.disabled) throw new Error("pas de bouton pour ouvrir la géode");
      b.click();
      const j = carriere.atelier.queue[0];
      if(!j || owned("geode")) throw new Error("la géode n'est pas à la table de taille");
      j.start = Date.now() - 31000; j.end = Date.now() - 1000;          // sans attendre ses 30 secondes
      await attendre(() => !carriere.atelier.queue.length, 4000);
      cristal = CRISTAUX.map(([k]) => k).find(k => owned(k) > 0);
      if(!cristal) throw new Error("pas de cristal dans le sac");
      if(!state.carnet.pierres[cristal]) throw new Error("le cristal n'est pas inscrit au carnet");
      $("#sheetWrap [data-close]").click(); await wait(300);
    } finally { state.buildings.splice(state.buildings.indexOf(carriere), 1); renderHUD(); }
    $("#btn-sac").click(); await wait(200);
    $("[data-sac-tab='carnet']").click(); $("[data-carnet-page='pierres']").click();
    if(!$("#sheet").textContent.includes("Pierres :") || !$(`#sheet .tile[data-carnet='${cristal}']:not(.inconnu)`)) throw new Error("la page « Pierres » du carnet ne montre pas le cristal");
    $("#sheetWrap [data-close]").click(); await wait(300);
    let vitrine = "";
    if(scierie){
      sacAdd("vitrine", 1);
      await entrer(scierie);
      try {
        $("#btn-deco").click(); $("#deco-cat").click(); await wait(200);
        const pose = $("#sheet [data-meuble='vitrine']");
        if(!pose || pose.disabled) throw new Error("la vitrine ne se pose pas");
        pose.click(); await wait(200);
        $("#deco-done").click();
        const it = scierie.deco.items.find(v => v.type === "vitrine");
        if(!it) throw new Error("pas de vitrine dans la Scierie");
        placePlayer(it.x, it.z + footOf(it)[1] / 2 + .45, 0, -1);
        updateVitrine(true);
        if($("#btn-vitrine").hidden) throw new Error("pas de bouton tout près de la vitrine");
        $("#btn-vitrine").click(); await wait(200);
        const n = owned(cristal);
        $(`#sheet [data-vitrine='${cristal}']`).click();
        if(it.pierre !== cristal || owned(cristal) !== n - 1) throw new Error("le cristal n'est pas dans la vitrine");
        $("#sheet [data-vitrine-reprendre]").click();
        if(it.pierre || owned(cristal) !== n) throw new Error("le cristal n'est pas revenu dans le sac");
        $(`#sheet [data-vitrine='${cristal}']`).click();                   // il y reste, exposé
        $("#sheetWrap [data-close]").click(); await wait(300);
        vitrine = `, exposé dans une vitrine de la Scierie`;
      } finally { await sortir(); }
    }
    /* le Cœur de la mine : endormi, puis réveillé quand toutes les pierres des trois salles sont au carnet */
    state.galeries = {2: {seg: 4, coups: 0}, 3: {seg: 4, coups: 0}};
    place(2); sacAdd("piocheBronze", 1); enMain("piocheBronze");
    await entrer(state.buildings.find(b => b.type === "mine"));
    try {
      const p = devantCoeur();
      placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
      if(!$("#btn-act").dataset.action.includes("Trouve toutes les pierres")) throw new Error(`devant le Cœur endormi, le bouton dit « ${$("#btn-act").dataset.action} »`);
      for(const k of Object.keys(PIERRES)) if(PIERRES[k] <= 3 && !state.carnet.pierres[k]) noterPierre(k, 1);
      for(let k = 0; k < 10 && !owned("coeurMine"); k++){
        placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
        if(!$("#btn-act").dataset.action.includes("Dégager le Cœur")) throw new Error(`devant le Cœur réveillé, le bouton dit « ${$("#btn-act").dataset.action} »`);
        $("#btn-act").click();
      }
      if(owned("coeurMine") !== 1 || !state.coeurMine) throw new Error("le Cœur de la mine n'est pas dans le sac");
      placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
      if(!$("#btn-act").hidden && $("#btn-act").dataset.action.includes("Cœur")) throw new Error("le Cœur se dégage encore");
    } finally { await sortir(); }
    return `la géode s'ouvre sur : ${objet(cristal).nom.toLowerCase()}${vitrine} ; le Cœur de la mine dégagé`;
  });
  await etape("Les coffres : ranger, déplacer un coffre plein, un coffre dans un coffre", async () => {
    const clic = s => { const b = $(s); if(!b) throw new Error(`pas de bouton ${s}`); b.click(); };
    const libre = () => { const px = tileOf(player.position.x), pz = tileOf(player.position.z);
      for(let d = 1; d < 8; d++) for(let dx = -d; dx <= d; dx++) for(const dz of [-d, d]){ const i = idx(px + dx, pz + dz); if(!poseProblem(i)) return i; }
      throw new Error("pas de place pour poser un coffre"); };
    place(4);                                                                   // le sac de la partie d'essai se remplit
    sacAdd("coffreReserve", 2); sacAdd("bois", 5); enMain("coffreReserve");
    poserCoffre(libre()); poserCoffre(libre());
    if(state.coffres.length < 2) throw new Error("les coffres ne sont pas posés");
    const [a, b] = state.coffres.slice(-2), bois = owned("bois");
    openCoffre(a.id); await wait(200);
    clic(`[data-co="sac:${state.sac.findIndex(it => it.k === "bois")}"]`);
    if(!$(".co-fiche [data-co-bouge]")) throw new Error("toucher un objet n'ouvre pas sa fiche");
    if(a.items.length) throw new Error("toucher un objet l'a rangé tout de suite");
    clic(".co-fiche [data-co-bouge]");
    if(!a.items.some(it => it.k === "bois")) throw new Error("le bois n'est pas rangé");
    clic("[data-co-deplacer]"); await wait(300);
    if(state.coffres.includes(a) || state.main !== "coffrePlein") throw new Error("le coffre plein n'est pas en main");
    openCoffre(b.id); await wait(200);
    const c = state.barre.findIndex(it => it && it.k === "coffrePlein");          // en main : dans une case, ou dans le sac si elles sont prises
    clic(c >= 0 ? `[data-co="case:${c}"]` : `[data-co="sac:${state.sac.findIndex(it => it.k === "coffrePlein")}"]`);
    clic(".co-fiche [data-co-bouge]");
    const range = b.items.find(it => it.k === "coffrePlein");
    if(!range || !range.items.some(it => it.k === "bois")) throw new Error("le coffre plein n'est pas rangé dans l'autre, avec son bois");
    if(owned("bois") !== bois) throw new Error(`le bois ne compte plus (${owned("bois")} au lieu de ${bois})`);
    $("#sheetWrap [data-close]").click(); await wait(300);
    return `un coffre rempli (${range.items.length} emplacement) rangé dans un autre`;
  });
  if(scierie) await etape("Un coffre dans un bâtiment : le poser, l'ouvrir, l'emporter", async () => {
    sacAdd("coffreReserve", 1); enMain("coffreReserve");
    await entrer(scierie);
    const avant = state.coffres.length;
    updateCoffrePiece(true);
    if($("#btn-coffre").hidden || !$("#btn-coffre").dataset.action.includes("Poser")) throw new Error(`pas de bouton « Poser le coffre » (${$("#btn-coffre").dataset.action})`);
    $("#btn-coffre").click();
    const co = state.coffres.find(c => c.b === scierie.id), it = co && scierie.deco.items.find(v => v.reserve === co.id);
    if(state.coffres.length !== avant + 1 || !it) throw new Error("le coffre n'est pas posé dans la Scierie");
    updateCoffrePiece(true);
    if(!$("#btn-coffre").dataset.action.includes("Ouvrir")) throw new Error(`pas de bouton « Ouvrir le coffre » (${$("#btn-coffre").dataset.action})`);
    $("#btn-coffre").click(); await wait(200);
    if(!$("[data-co-deplacer]")) throw new Error("le coffre ne s'ouvre pas");
    $("[data-co-deplacer]").click(); await wait(300);
    if(state.coffres.includes(co) || scierie.deco.items.includes(it)) throw new Error("le coffre n'est pas emporté");
    await sortir();
    return `posé à (${it.x}, ${it.z}) dans la pièce, puis emporté`;
  });
  await etape("Les lumières : le suif et la chandelle, la pénombre, une torche sur la torchère, le feu de camp dehors", async () => {
    /* le suif au fourneau, la chandelle à l'atelier de décoration : une Taverne et une Chaumière d'essai (retirées ensuite) */
    const taverne = {id: -4, type: "taverne", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "fourneau", x: 0, z: 0, rot: 0}], next: 2}};
    const chaumiere = {id: -5, type: "chaumiere", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "atelierDeco", x: 0, z: 0, rot: 0}], next: 2}};
    state.buildings.push(taverne, chaumiere);
    const fini = async b => { const j = b.atelier.queue[0]; j.start = Date.now() - j.t * 1000 - 1000; j.end = Date.now() - 1000; await attendre(() => !b.atelier.queue.length, 4000); };
    const fab = (b, k) => { const r = $(`#sheet [data-fab='r${ATELIERS[b.type].recettes.findIndex(r => r.out === k)}']`); if(!r || r.disabled) throw new Error(`pas de bouton pour fabriquer : ${objet(k).nom}`); r.click(); };
    try {
      place(4); sacAdd("viandeGibier", 1); sacAdd("fibre", 1);
      openAtelier(taverne); await wait(200); fab(taverne, "suif"); await fini(taverne);
      if(owned("suif") < 2) throw new Error(`${owned("suif")} suif au lieu de 2`);
      openAtelier(chaumiere); await wait(200); fab(chaumiere, "chandelle"); await fini(chaumiere);
      if(owned("chandelle") < 2) throw new Error(`${owned("chandelle")} chandelles au lieu de 2`);
      $("#sheetWrap [data-close]").click(); await wait(300);
    } finally {
      for(const b of [taverne, chaumiere]) state.buildings.splice(state.buildings.indexOf(b), 1);
      renderHUD();
    }
    /* la pénombre de la Scierie ; une torchère sur pied posée, puis une torche dessus : elle éclaire */
    let dedans = "";
    if(scierie){
      place(3); sacAdd("torchere", 1); sacAdd("torche", 2);
      await entrer(scierie);
      try {
        if(!penombreIci()) throw new Error("pas de pénombre dans la Scierie");
        $("#btn-deco").click(); $("#deco-cat").click(); await wait(200);
        const pose = $("#sheet [data-meuble='torchere']");
        if(!pose || pose.disabled) throw new Error("la torchère ne se pose pas");
        pose.click(); await wait(200);
        $("#deco-done").click();
        const it = scierie.deco.items.find(v => v.type === "torchere");
        if(!it) throw new Error("pas de torchère dans la Scierie");
        placePlayer(it.x, it.z + footOf(it)[1] / 2 + .45, 0, -1);
        updateLumieres(.016, true);
        if($("#btn-torchere").hidden) throw new Error("pas de bouton tout près de la torchère");
        const n = owned("torche");
        $("#btn-torchere").click();
        if(!it.torche || owned("torche") !== n - 1) throw new Error("la torche n'est pas sur la torchère");
        updateLumieres(.016, true);
        if(lumieresActives() < 1) throw new Error("la torchère n'éclaire pas la pièce");
        dedans = "une torche sur la torchère de la Scierie, qui éclaire la pièce ; ";
      } finally { await sortir(); }
    }
    /* dehors : un feu de camp posé devant soi, qui éclaire la nuit, puis repris ; une torchère et sa torche */
    let i = -1, x = 0, z = 0;
    for(let tz = 2; tz < N - 3 && i < 0; tz++) for(let tx = 2; tx < N - 2; tx++){
      const a = idx(tx, tz), s = idx(tx, tz + 1);
      if([a, s].every(c => map.type[c] === "grass" && !map.obj[c] && !occ.has(c) && !state.sol[c] && !state.chemins[c]) && !poseProblem(a)){ i = a; x = tx; z = tz; break; }
    }
    if(i < 0) throw new Error("pas de case libre pour le feu de camp");
    const devant = () => { placePlayer(centerOf(x), centerOf(z + 1) + .1, 0, -1); frames(3); return $("#btn-act").dataset.action; };
    place(2); sacAdd("feuCamp", 1); enMain("feuCamp");
    if(!devant().includes("Poser le feu de camp")) throw new Error(`le feu de camp en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(map.obj[i] !== "feuCamp") throw new Error("le feu de camp n'est pas posé");
    forcerHeure(23); updateCiel(0, 0);
    try {
      updateLumieres(1.1, true);
      if(lumieresActives() < 1) throw new Error("le feu de camp n'éclaire pas la nuit");
    } finally { forcerHeure(null); updateCiel(0, 0); }
    /* le déplacer d'un appui long sur une case voisine, puis le ramener (demande de Yo, 12 octobre 2026) */
    devant(); await cameraImmobile();                    // la caméra a fini de suivre le personnage
    const j = [i + 1, i - 1].find(c => !poseProblem(c));
    if(j === undefined) throw new Error("pas de case libre à côté du feu de camp");
    const haut = c => ecran(centerOf(c % N), .3, centerOf(Math.floor(c / N))), sol = c => ecran(centerOf(c % N), 0, centerOf(Math.floor(c / N)));
    await glisser(() => haut(i), () => sol(j));
    if(map.obj[j] !== "feuCamp" || map.obj[i]) throw new Error(`le feu de camp ne se déplace pas d'un appui long (case ${i} : ${map.obj[i]}, case ${j} : ${map.obj[j]})`);
    await cameraImmobile();
    await glisser(() => haut(j), () => sol(i));
    if(map.obj[i] !== "feuCamp") throw new Error("le feu de camp ne revient pas à sa place");
    if(!devant().includes("Reprendre le feu de camp")) throw new Error(`devant le feu de camp, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(map.obj[i] || owned("feuCamp") !== 1) throw new Error("le feu de camp n'est pas revenu dans le sac");
    place(3); sacAdd("torchere", 1); enMain("torchere"); if(!owned("torche")) sacAdd("torche", 1);
    devant(); $("#btn-act").click();
    if(map.obj[i] !== "torchere") throw new Error(`la torchère n'est pas posée dehors (le bouton dit « ${$("#btn-act").dataset.action} », en main : ${state.main})`);
    if(!devant().includes("Poser une torche")) throw new Error(`devant la torchère, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(!state.ile[i].torche) throw new Error("la torche n'est pas sur la torchère dehors");
    const torches = owned("torche");
    if(!devant().includes("et sa torche")) throw new Error(`devant la torchère allumée, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(map.obj[i] || owned("torche") !== torches + 1) throw new Error("la torchère et sa torche ne sont pas revenues dans le sac");
    return `2 suif, 2 chandelles ; ${dedans}un feu de camp posé, qui éclaire la nuit, déplacé d'un appui long, puis repris ; une torchère dehors, allumée, puis reprise avec sa torche`;
  });
  if(scierie) await etape("Les autres lumières : une lanterne murale accrochée à la façade de la Scierie, qui s'allume seule la nuit", async () => {
    const s = 3, x = scierie.x, z = scierie.z;              // la colonne de gauche (la porte est au milieu)
    const devant = () => { pickUp(idx(x, z + s)); placePlayer(centerOf(x), centerOf(z + s) + .1, 0, -1); frames(3); return $("#btn-act").dataset.action; };
    place(2); sacAdd("lanterneMurale", 1); enMain("lanterneMurale");
    if(!devant().includes("Accrocher la lanterne murale")) throw new Error(`devant la façade, la lanterne en main, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if(!(scierie.facade || []).some(f => f.type === "lanterneMurale" && f.col === 0) || !lumieresFacades().length) throw new Error("la lanterne n'est pas accrochée à la façade");
    let jour, nuit;
    try {
      forcerHeure(13); updateCiel(0, 0); updateLumieres(1.1, true); jour = lumieresActives();
      forcerHeure(23); updateCiel(0, 0); updateLumieres(1.1, true); nuit = lumieresActives();
    } finally { forcerHeure(null); updateCiel(0, 0); }
    if(!(nuit > jour)) throw new Error(`la lanterne murale ne s'allume pas seule la nuit (${jour} lumière le jour, ${nuit} la nuit)`);
    if(!devant().includes("Décrocher la lanterne murale")) throw new Error(`devant la lanterne accrochée, le bouton dit « ${$("#btn-act").dataset.action} »`);
    $("#btn-act").click();
    if((scierie.facade || []).length || owned("lanterneMurale") !== 1) throw new Error("la lanterne n'est pas revenue dans le sac");
    return "accrochée, éteinte le jour, allumée la nuit, puis décrochée";
  });
  if(scierie) await etape("La vue à la première personne : le bouton 👁️, la caméra aux yeux, le doigt tourne la tête, le joystick avance où l'on regarde et tourne la vue, viser ce qu'on regarde, les mains, entrer dans la Scierie, décorer en vue de dessus", async () => {
    if(isInside()) await sortir();
    const avant = vuePremiere();
    try {
      $("#btn-vue").click();
      if(!vuePremiere()) throw new Error("le bouton 👁️ ne choisit pas la première personne");
      if(!await attendre(() => premiereActive() && Math.abs(camera.position.y - .8) < .05)) throw new Error(`la caméra n'est pas à hauteur des yeux (${camera.position.y.toFixed(2)})`);
      if(player.visible) throw new Error("le corps du personnage se voit encore");
      if(!(camera.fov > 50)) throw new Error(`l'angle de vue reste à ${camera.fov}°`);
      /* une place dégagée : 1 P libre tout autour */
      let libre = null;
      for(let r = 0; r < 12 && !libre; r++) for(let dx = -r; dx <= r && !libre; dx++) for(let dz = -r; dz <= r && !libre; dz++){
        const x = .5 + dx, z = 6.5 + dz;
        if([...Array(8)].every((_, k) => islandWalkable(x + Math.cos(k * Math.PI / 4), z + Math.sin(k * Math.PI / 4))) && islandWalkable(x, z)) libre = [x, z];
      }
      if(!libre) throw new Error("pas de place dégagée pour l'essai");
      placePlayer(libre[0], libre[1], 0, 1); await wait(200);
      /* le doigt glisse vers la gauche, sur un tiers de l'écran : la tête tourne vers la gauche */
      const r0 = regard(), w = renderer.domElement.getBoundingClientRect().width;
      doigt("pointerdown", [w * .6, 300]);
      for(let k = 1; k <= 6; k++){ doigt("pointermove", [w * .6 - w / 3 * k / 6, 300]); await wait(20); }
      doigt("pointerup", [w * .6 - w / 3, 300]);
      const r1 = regard(), tour = Math.acos(Math.max(-1, Math.min(1, r0.x * r1.x + r0.z * r1.z)));
      if(tour < .6) throw new Error(`le doigt ne tourne pas la tête (${tour.toFixed(2)} rad)`);
      /* le haut du joystick avance là où l'on regarde, sans changer le regard */
      const p0 = player.position.clone();
      keys.u = 1; for(let k = 0; k < 10; k++) updatePlayer(.016); keys.u = 0;
      const dx = player.position.x - p0.x, dz = player.position.z - p0.z, l = Math.hypot(dx, dz), r2 = regard();
      if(l < .3 || (dx * r1.x + dz * r1.z) / l < .95) throw new Error(`le personnage n'avance pas là où il regarde (${dx.toFixed(2)}, ${dz.toFixed(2)})`);
      if(Math.abs(r2.x - r1.x) + Math.abs(r2.z - r1.z) > .01) throw new Error("marcher change le regard");
      /* le joystick poussé à droite : la vue tourne à droite, sur place (v1.13.21) */
      const p1 = player.position.clone();
      keys.r = 1; for(let k = 0; k < 30; k++) updatePlayer(.016); keys.r = 0;
      const r3 = regard(), virage = Math.atan2(r2.x * r3.z - r2.z * r3.x, r2.x * r3.x + r2.z * r3.z);
      if(player.position.distanceTo(p1) > .05) throw new Error("en tournant avec le joystick, le personnage se déplace");
      if(!(virage > .5)) throw new Error(`le joystick poussé à droite ne tourne pas la vue à droite (${virage.toFixed(2)} rad)`);
      /* viser ce qu'on regarde (morceau B3) : le point au centre ; tout droit, la case devant dans la direction exacte du
         regard ; les yeux baissés, la case du sol qu'on regarde */
      if($("#viseur").hidden) throw new Error("pas de point au centre de l'écran");
      const caseA = d => { const r = regard(); return [tileOf(player.position.x + r.x * d), tileOf(player.position.z + r.z * d)]; };
      const meme = (a, b) => a[0] === b[0] && a[1] === b[1];
      if(!meme(frontTile(1.3), caseA(1.3))) throw new Error(`tout droit, la case visée n'est pas devant le regard (${frontTile(1.3)} au lieu de ${caseA(1.3)})`);
      pencherVue(-.7);                                     // les yeux baissés : le sol à 0,95 P
      const baisse = await attendre(() => meme(frontTile(1.3), caseA(.8 / Math.tan(.7))), 2000);
      pencherVue(0);
      if(!baisse) throw new Error(`les yeux baissés, la case visée n'est pas celle qu'on regarde (${frontTile(1.3)} au lieu de ${caseA(.8 / Math.tan(.7))})`);
      /* les mains (morceau B2) : la hache dans la main droite, son coup, la torche dans la main gauche */
      sacAdd("hachePierre", 1); enMain("hachePierre");
      if(!await attendre(() => mainsIci().actif && mainsIci().droite === "hachePierre")) throw new Error(`la main droite ne tient pas la hache (${JSON.stringify(mainsIci())})`);
      gesteOutil("hachePierre");
      if(mainsIci().geste !== "frappe") throw new Error("la main ne fait pas le geste de la hache");
      tenirTorche(true, 0);
      const torcheVue = await attendre(() => mainsIci().gauche === "torche");
      tenirTorche(false);
      if(!torcheVue) throw new Error("la main gauche ne tient pas la torche");
      hold(null);                                          // rien en main : on ne voit plus de main (v1.13.23)
      if(!await attendre(() => !mainsIci().droite && !mainsIci().gauche)) throw new Error(`rien en main, on voit encore une main (${JSON.stringify(mainsIci())})`);
      /* entrer dans la Scierie en marchant dans la porte */
      const d = doorOf(scierie);
      placePlayer(d.x + d.n.x * (R + .4), d.z + d.n.z * (R + .4), -d.n.x, -d.n.z);
      keys.u = 1;
      for(let k = 0; k < 40 && !isInside(); k++){ updatePlayer(.016); checkDoors(true); }
      keys.u = 0;
      if(!await attendre(() => isInside() && currentPlace().b === scierie)) throw new Error("on n'entre pas dans la Scierie en marchant dans la porte");
      if(!await attendre(() => premiereActive() && Math.abs(camera.position.y - .8) < .05)) throw new Error("dans la Scierie, la caméra n'est plus aux yeux");
      /* décorer : on repasse tout seul en vue de dessus, puis on revient aux yeux */
      $("#btn-deco").click();
      if(!decorating()) throw new Error("le mode décoration ne s'ouvre pas");
      if(!await attendre(() => !premiereActive() && camera.position.y > 3)) throw new Error("en décorant, la vue reste à la première personne");
      $("#deco-done").click();
      if(!await attendre(() => premiereActive() && Math.abs(camera.position.y - .8) < .05)) throw new Error("après la décoration, la vue ne revient pas aux yeux");
      await sortir();
      /* revenir à la vue de dessus */
      $("#btn-vue").click();
      if(!await attendre(() => !premiereActive() && player.visible && camera.fov === 40 && camera.position.y > 3 && $("#viseur").hidden)) throw new Error("le bouton 👁️ ne ramène pas la vue de dessus");
      return `la tête tourne de ${Math.round(tour * 180 / Math.PI)}° pour un tiers d'écran, on avance où l'on regarde, le joystick tourne la vue de ${Math.round(virage * 180 / Math.PI)}° en une demi-seconde, le point au centre, la case regardée (tout droit ou les yeux baissés), la main droite tient la hache et frappe, la gauche la torche, rien en main on ne voit plus de main, on entre dans la Scierie, la décoration se fait en vue de dessus`;
    } finally { choisirVue(avant); }
  });
  await etape("Jamais coincé", async () => {
    /* le personnage posé au milieu d'un bâtiment (comme une partie rouverte au mauvais endroit) se dégage tout seul */
    const b = state.buildings.find(b => b.type === "scierie");
    if(!b) throw new Error("pas de Scierie");
    const s = sizeOf(b.type);
    placePlayer(b.x - H + s/2, b.z - H + s/2, 0, 1);
    updatePlayer(.016);
    const p = player.position;
    if(!islandWalkable(p.x, p.z)) throw new Error("le personnage reste coincé dans le bâtiment");
    keys.d = 1; for(let k = 0; k < 10; k++) updatePlayer(.016); keys.d = 0; updatePlayer(.016);
    return "il glisse hors du bâtiment";
  });
  pauseInsectes(false); pauseOiseaux(false); pauseMonstres(false);
  return {ok, erreurs};
}
