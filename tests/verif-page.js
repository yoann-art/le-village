/* ================= Vérification automatique =================
   Joue les gestes de base sur une partie neuve, comme un joueur pressé, et dit ce qui ne va pas :
   ramasser, marcher, ouvrir le sac, bâtir la Scierie, y entrer, construire l'établi, fabriquer,
   couper un arbre (une ressource par coup), l'usure (un outil s'use, puis se casse), la hache selon l'essence (le frêne
   demande une hache en cuivre, le chêne séculaire une hache en bronze), l'épée en bronze, une case rapide (ce qu'on y met sort du sac), entrer dans la mine, pêcher (depuis la plage et depuis le ponton), cueillir le thym, le carnet,
   les ingrédients du poisson grillé, vendre au comptoir, les pierres (ouvrir une géode, la page du carnet, la vitrine,
   le Cœur de la mine), attraper un insecte et un oiseau au filet, aller dans la Forêt profonde et y couper un arbre,
   ranger au coffre (fiche puis bouton), déplacer un coffre plein et le ranger dans un autre coffre,
   poser un coffre dans la Scierie, l'ouvrir et l'emporter, la vie de la forêt (un insecte, un oiseau, un poisson du ruisseau),
   chasser à l'arc (un chevreuil, approché sous le vent) et ramasser le présent du Cerf blanc,
   la grotte (y entrer depuis la forêt, la torche allumée, descendre d'un palier, remonter par la corde),
   le combat (un loup qui mord, la roulade qui esquive, l'épée qui le vainc et ce qu'il laisse, une chauve-souris,
   le poisson grillé qui soigne, vaincu : la moitié du butin de la grotte perdue, jamais l'équipement, le réveil au
   village, toute sa vie revenue), le sanglier de la forêt
   (touché à l'arc, il charge ; vaincu à l'épée),
   creuser et combler à la pelle, tracer un chemin en marchant et l'enlever à la pelle,
   les fleurs (cueillir une fleur de la saison, la déterrer à la pelle, replanter sa graine), le jour et la nuit (la
   lumière suit l'heure, les vitres s'allument la nuit), ne jamais rester coincé. Lancée à chaque envoi sur GitHub par
   .github/workflows/verification.yml (via tests/verif.mjs), dans un navigateur neuf.
   Elle refuse de tourner sur une partie déjà avancée, pour ne jamais abîmer la vraie partie de Yo. */
import { B, POISSONS, RECOLTE, OUTILS, COMBAT, FLEURS, FLEUR_RARETE, INSECTES, GRAINES, ATELIERS, CRISTAUX, PIERRES, enFleur, graineDeFleur, objet } from "../js/donnees.js";
import { state } from "../js/sauvegarde.js";
import { sacAdd, sacCount, owned, sizeOf, payer, hasAll, addOwned, upCost, noterPierre } from "../js/regles.js";
import { map, idx, N, H, centerOf, tileOf, setObj, setEtat, growth, baiesLeft, rafraichirSaison } from "../js/monde/ile.js";
import { occ, toitDe } from "../js/monde/batiments.js";
import { eauLibre, entreePonton } from "../js/monde/ponton.js";
import { lacherOmbre, presents } from "../js/peche.js";
import { devantGalerie, galerieOuverte, salleEn, devantCoeur } from "../js/monde/mine.js";
import { footOf } from "../js/monde/meubles.js";
import { updateVitrine } from "../js/vitrine.js";
import { forcerMeteo, updateMeteo, couvertIci, neigeAuSol } from "../js/monde/meteo.js";
import { lacherInsecte, pauseInsectes, insectesPresents } from "../js/insectes.js";
import { lacherOiseau, pauseOiseaux } from "../js/oiseaux.js";
import { lacherGibier, lacherCerfBlanc, pauseChasse, vent } from "../js/chasse.js";
import { lacherMonstre, pauseMonstres, monstresVaincus, monstresIci } from "../js/monstres.js";
import { combat, vieCombat } from "../js/combat.js";
import { torcheAllumee } from "../js/torche.js";
import { forcerHeure, updateCiel, VITRE } from "../js/monde/ciel.js";
import { choisirHemisphere } from "../js/saisons.js";
import { forcerSaison, saisonDu, reglerHemisphere } from "../js/donnees.js";
import { scene } from "../js/monde/scene.js";
import { foret, foretObj, W as WF, fcx, fcz, ENTREE_GROTTE } from "../js/monde/foret.js";
import { player, placePlayer, updatePlayer, R, islandWalkable } from "../js/monde/personnage.js";
import { keys } from "../js/commandes.js";
import { updateRecolte } from "../js/recolte.js";
import { updateChemins } from "../js/terraformer.js";
import { checkDoors, isInside, currentPlace, doorOf } from "../js/lieux.js";
import { startPlacing, updateInteraction } from "../js/construire.js";
import { openAtelier } from "../js/ateliers.js";
import { openCoffre, poserCoffre, poseProblem, updateCoffrePiece } from "../js/coffres.js";
import { renderHUD } from "../js/interface.js";
import { hold, mettreEnCase, jauge } from "../js/barre.js";

const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const frames = (n, dt = .05) => { for(let k = 0; k < n; k++) updateRecolte(dt, true); };
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
    return `${Object.keys(state.sol).length} objets au sol, la mine est posée`;
  });
  await etape("Ramasser au sol", async () => {
    const i = +Object.keys(state.sol)[0];
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1); frames(3);
    if(!$("#btn-act").textContent.includes("Ramasser")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
    $("#btn-act").click();
    if(!state.sac.length) throw new Error("rien dans le sac");
    return state.sac.map(it => `${it.n} ${it.k}`).join(", ");
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
    const herbe = () => { const i = idx(Math.floor(N / 2), Math.floor(N / 2)); return scene.children.find(o => o.isInstancedMesh && o.count === N * N && o.instanceColor).instanceColor.array.slice(i * 3, i * 3 + 3).join(); };
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
    const c = Math.floor(N / 2), herbe = j => scene.children.find(o => o.isInstancedMesh && o.count === N * N && o.instanceColor).instanceColor.array.slice(j * 3, j * 3 + 3);
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
  await etape("Couper un arbre", async () => {
    sacAdd("hachePierre", 1); hold("hachePierre");
    const t = arbreLibre();
    if(!t) throw new Error("aucun arbre accessible");
    const bois = owned("bois");
    placePlayer(centerOf(t[0]), centerOf(t[1] + 1) + .1, 0, -1);
    for(let k = 0; k < 3; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
    if(map.obj[idx(...t)]) throw new Error("l'arbre est toujours là");
    const n = owned("bois") - bois;
    if(n <= 0) throw new Error("pas de bois gagné");
    if(n > 6) throw new Error(`${n} bois pour 3 coups : un coup ne donne plus qu'un bois (avec le bonus de la Scierie, 2 au plus)`);
    return `+${n} bois en 3 coups`;
  });
  await etape("L'usure : un outil s'use à chaque coup, sa jauge baisse, puis il se casse et disparaît", async () => {
    const k = "hachePierre";
    if(!(state.usure[k] > 0)) throw new Error("la hache ne s'est pas usée en coupant l'arbre");
    if(!jauge(k).includes("usure")) throw new Error("pas de jauge de solidité");
    const n = owned(k);
    state.usure[k] = OUTILS[k].solidite - 1;                 // le dernier coup
    const t = arbreLibre();
    if(!t) throw new Error("aucun arbre accessible");
    hold(k);
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
    placePlayer(d.x + d.n.x * R, d.z + d.n.z * R, -d.n.x, -d.n.z);
    checkDoors(true);
    if(isInside()) throw new Error("on entre dans la mine éboulée");
    let coups = 0;
    for(let k = 0; k < 8 && state.entreeMine === "eboulee"; k++){
      frames(3);
      if(!$("#btn-act").textContent.includes("Déblayer")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} » devant l'éboulement`);
      $("#btn-act").click(); coups++;
    }
    if(state.entreeMine !== "deblayee") throw new Error("l'éboulement n'est pas dégagé");
    addOwned("planche", 15); addOwned("pierre", 10); addOwned("torche", 4);
    frames(3);
    if(!$("#btn-act").textContent.includes("étais")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} » devant l'entrée dégagée`);
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
      if(!$("#btn-act").textContent.includes("pioche en cuivre")) throw new Error(`sans pioche en cuivre, le bouton dit « ${$("#btn-act").textContent} »`);
      sacAdd("piocheCuivre", 1);
      let coups = 0;
      for(let k = 0; k < 20 && !galerieOuverte(2); k++){
        const p = devantGalerie(2);
        placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
        if(!$("#btn-act").textContent.includes("Creuser la galerie")) throw new Error(`devant la galerie, le bouton dit « ${$("#btn-act").textContent} »`);
        $("#btn-act").click(); coups++;
      }
      if(!galerieOuverte(2)) throw new Error("la galerie n'est pas ouverte");
      const p3 = devantGalerie(3);
      placePlayer(p3.x, p3.z, p3.fx, p3.fz); frames(3);
      if(!$("#btn-act").textContent.includes("pioche en bronze")) throw new Error(`devant la galerie de la géode, le bouton dit « ${$("#btn-act").textContent} »`);
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
    for(let k = 0; k < RECOLTE[sorte].coups; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
    if(foretObj(t.i)) throw new Error(`${RECOLTE[sorte].nom} est toujours là (le bouton dit « ${$("#btn-act").textContent} »)`);
    if(owned(bois) <= avant) throw new Error(`pas de ${objet(bois).nom.toLowerCase()} gagné`);
    await sortir();
    return `${RECOLTE[sorte].nom} coupé, +${owned(bois) - avant} ${objet(bois).nom.toLowerCase()}`;
  });
  await etape("Pêcher", async () => {
    sacAdd("canneBois", 1); hold(null);
    let t = null;
    for(let z = 1; z < N - 1 && !t; z++) for(let x = 1; x < N - 1; x++){
      const i = idx(x, z), s = idx(x, z + 1);
      if(map.type[i] !== "water" && i !== entreePonton && !map.obj[i] && !occ.has(i) && !state.sol[i] && eauLibre(s)){ t = [x, z]; break; }
    }
    if(!t) throw new Error("aucun bord de l'eau");
    placePlayer(centerOf(t[0]), centerOf(t[1]) + .2, 0, 1); frames(2);
    if(!$("#btn-act").textContent.includes("Lancer")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
    if(!lacherOmbre(centerOf(t[0]), centerOf(t[1]) + 2.2)) throw new Error("pas d'ombre de poisson possible ici");   // une ombre devant soi
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").textContent.includes("Ferrer") && k < 400){ frames(1); k++; }
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
    if(!$("#btn-act").textContent.includes("Lancer")) throw new Error(`au bout du ponton, le bouton dit « ${$("#btn-act").textContent} »`);
    const avant = state.sac.reduce((n, it) => n + (POISSONS[it.k] ? it.n : 0), 0);
    if(!lacherOmbre(player.position.x, player.position.z + 2)) throw new Error("pas d'ombre de poisson possible au bout du ponton");
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").textContent.includes("Ferrer") && k < 400){ frames(1); k++; }
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
    if(!$("#btn-act").textContent.includes("thym")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
    const avant = owned("thym");
    $("#btn-act").click();
    if(owned("thym") <= avant) throw new Error("pas de thym dans le sac");
    frames(2);
    if(!$("#btn-act").textContent.includes("repousse")) throw new Error(`après la cueillette, le bouton dit « ${$("#btn-act").textContent} »`);
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
  };
  await etape("La hache selon l'essence : le frêne demande une hache en cuivre, le chêne séculaire une hache en bronze", async () => {
    let i = -1;
    for(let z = 2; z < N - 2 && i < 0; z++) for(let x = 2; x < N - 2; x++){
      const a = idx(x, z), s = idx(x, z + 1);
      if(map.type[a] === "grass" && !map.obj[a] && !occ.has(a) && !state.sol[a] && map.type[s] === "grass" && !map.obj[s] && !occ.has(s) && !state.sol[s] && !state.chemins[a]){ i = a; break; }
    }
    if(i < 0) throw new Error("pas de place pour un frêne");
    const x = i % N, z = Math.floor(i / N);
    const face = () => { placePlayer(centerOf(x), centerOf(z + 1) + .1, 0, -1); frames(1, .016); return $("#btn-act").textContent; };
    state.sac = state.sac.filter(it => !OUTILS[it.k] || OUTILS[it.k].famille !== "hache");
    state.barre = state.barre.map(it => it && OUTILS[it.k] && OUTILS[it.k].famille === "hache" ? null : it);
    place(2); sacAdd("hachePierre", 1); hold("hachePierre");
    setObj(i, "frene");
    if(!face().includes("hache en cuivre")) throw new Error(`avec une hache en pierre, devant le frêne, le bouton dit « ${face()} »`);
    sacAdd("hacheCuivre", 1);
    if(!face().includes("Couper le frêne")) throw new Error(`avec une hache en cuivre, le bouton dit « ${face()} »`);
    const avant = owned("boisFrene");
    for(let k = 0; k < RECOLTE.frene.coups; k++){ face(); $("#btn-act").click(); frames(25); }
    if(map.obj[i]) throw new Error("le frêne est toujours là");
    if(owned("boisFrene") <= avant) throw new Error("pas de bois de frêne");
    setObj(i, "chene");
    if(!face().includes("hache en bronze")) throw new Error(`avec une hache en cuivre, devant le chêne séculaire, le bouton dit « ${face()} »`);
    setObj(i, null);
    if(!(OUTILS.epeeBronze && OUTILS.epeeBronze.force === 3) || !ATELIERS.forge.recettes.some(r => r.out === "epeeBronze")) throw new Error("pas d'épée en bronze à l'enclume");
    return `le frêne coupé à la hache en cuivre (+${owned("boisFrene") - avant} bois de frêne) ; le chêne séculaire attend la hache en bronze ; l'épée en bronze à l'enclume`;
  });
  await etape("Creuser et combler à la pelle", async () => {
    place(1);
    sacAdd("pelleBois", 1); hold("pelleBois");
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
    if(!$("#btn-act").textContent.includes("Creuser")) throw new Error(`face à l'herbe, la pelle en main, le bouton dit « ${$("#btn-act").textContent} »`);
    for(let k = 0; k < OUTILS.pelleBois.coups; k++){ $("#btn-act").click(); frames(1); }
    if(map.type[t.i] !== "water" || state.terrain[t.i] !== "water") throw new Error(`après ${OUTILS.pelleBois.coups} coups de pelle, la case n'est pas de l'eau`);
    if(!$("#btn-act").textContent.includes("Combler")) throw new Error(`face à l'eau creusée, le bouton dit « ${$("#btn-act").textContent} »`);
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
    hold("planche");
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
    hold("pelleBois");
    const p = player.position; placePlayer(p.x, p.z, -1, 0); frames(1);
    if(!$("#btn-act").textContent.includes("Enlever")) throw new Error(`face au chemin, la pelle en main, le bouton dit « ${$("#btn-act").textContent} »`);
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
    if(!$("#btn-act").textContent.includes("Cueillir")) throw new Error(`face à ${FLEURS[k].nom.toLowerCase()} en fleur, le bouton dit « ${$("#btn-act").textContent} »`);
    const avant = owned(k);
    $("#btn-act").click(); frames(1);
    if(owned(k) !== avant + 1) throw new Error("la fleur cueillie n'est pas dans le sac");
    if(!$("#btn-act").textContent.includes("refleurit")) throw new Error(`cueillie, le bouton dit « ${$("#btn-act").textContent} »`);
    /* la pelle la déterre : sa graine revient dans le sac */
    if(!owned("pelleBois")) sacAdd("pelleBois", 1);
    hold("pelleBois"); frames(1);
    const g = graineDeFleur(k), gAvant = owned(g);
    if(!$("#btn-act").textContent.includes("Déterrer")) throw new Error(`pelle en main, face à la fleur, le bouton dit « ${$("#btn-act").textContent} »`);
    $("#btn-act").click(); frames(1);
    if(map.obj[t.i] || owned(g) !== gAvant + 1) throw new Error("déterrée, la fleur ne rend pas sa graine");
    /* la graine replantée */
    hold(g); frames(1);
    if(!$("#btn-act").textContent.includes("Planter")) throw new Error(`la graine en main, le bouton dit « ${$("#btn-act").textContent} »`);
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
    sacAdd("filet", 1); hold(null);
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);                   // immobile : on ne fait peur à personne
    const libre = j => j >= 0 && j < N * N && map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    const i = map.obj.findIndex((o, j) => libre(j) && libre(j + N) && libre(j - N) && libre(j + 1) && libre(j - 1));
    if(i < 0) throw new Error("pas de place libre");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1);
    lacherInsecte("fourmi", player.position.x, player.position.z + .7, .03);
    frames(2);
    if(!$("#btn-act").textContent.includes("Attraper")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
    const avant = owned("fourmi");
    $("#btn-act").click();
    if(owned("fourmi") <= avant) throw new Error("pas de fourmi dans le sac");
    if(!state.carnet.insectes.fourmi) throw new Error("la fourmi n'est pas au carnet");
    frames(40);
    return "une fourmi, inscrite au carnet";
  });
  await etape("Attraper une luciole au bocal (le verre de la mine)", async () => {
    place(2);
    sacAdd("bocal", 1); hold(null);
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    const libre = j => j >= 0 && j < N * N && map.type[j] === "grass" && !map.obj[j] && !occ.has(j) && !state.sol[j];
    const i = map.obj.findIndex((o, j) => libre(j) && libre(j + N) && libre(j - N) && libre(j + 1) && libre(j - 1));
    if(i < 0) throw new Error("pas de place libre");
    placePlayer(centerOf(i % N), centerOf(Math.floor(i / N)), 0, 1);
    lacherInsecte("luciole", player.position.x, player.position.z + .7, .03);
    frames(2);
    if(!$("#btn-act").textContent.includes("🫙")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
    const avant = owned("luciole");
    $("#btn-act").click();
    if(owned("luciole") <= avant) throw new Error("pas de luciole dans le sac");
    frames(40);
    return "une luciole, prise au bocal";
  });
  await etape("Attraper un oiseau au filet", async () => {
    place(1);
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    lacherOiseau("moineau", player.position.x, player.position.z + 1.4);
    frames(2);
    if(!$("#btn-act").textContent.includes("Lancer le filet")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} »`);
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
    hold(null);
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
    if(!$("#btn-act").textContent.includes("Attraper")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} » (pas d'insecte à attraper)`);
    $("#btn-act").click(); frames(40);
    if(!state.carnet.insectes.phasme) throw new Error("le phasme n'est pas au carnet");
    lacherOiseau("picVert", p.x + t.dz * 1.4, p.z - t.dx * 1.4); frames(2);
    if(!$("#btn-act").textContent.includes("Lancer le filet")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} » (pas d'oiseau)`);
    $("#btn-act").click(); frames(40);
    if(!state.carnet.oiseaux.picVert) throw new Error("le pic vert n'est pas au carnet");
    /* pêcher : mains libres (la canne du sac est prise toute seule), une ombre dans l'eau, juste devant */
    hold(null); frames(2);
    if(!$("#btn-act").textContent.includes("Lancer")) throw new Error(`au bord du ruisseau, le bouton dit « ${$("#btn-act").textContent} »`);
    if(!lacherOmbre(fcx(t.i) + t.dx * .3, fcz(t.i) + t.dz * .3)) throw new Error("pas d'ombre de poisson possible dans le ruisseau");
    $("#btn-act").click();
    let k = 0;
    while(!$("#btn-act").textContent.includes("Ferrer") && k < 400){ frames(1); k++; }
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
    sacAdd("arcIf", 1); sacAdd("fleche", 5); hold(null);
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016);
    frames(2);
    if($("#vent").hidden) throw new Error("pas de flèche du vent dans la forêt");
    /* un chevreuil à 2,5 P, du côté d'où vient le vent : il ne nous sent pas */
    const p = player.position, w = vent(), avant = owned("viandeGibier");
    lacherGibier("chevreuil", p.x - w.x * 2.5, p.z - w.z * 2.5); frames(2);
    if(!$("#btn-act").textContent.includes("Tirer")) throw new Error(`le bouton dit « ${$("#btn-act").textContent} » (pas de gibier à portée)`);
    $("#btn-act").click();
    let k = 0;
    while(!state.carnet.gibier.chevreuil && k < 60){ frames(1); k++; }
    if(!state.carnet.gibier.chevreuil) throw new Error("le chevreuil n'est pas touché");
    if(owned("viandeGibier") < avant + 2 || !owned("cuir")) throw new Error("pas de viande ni de cuir dans le sac");
    if(owned("fleche") < 5) throw new Error("la flèche n'est pas reprise");
    frames(40);
    /* le présent du Cerf blanc, posé devant soi */
    place(1); lacherCerfBlanc(true); frames(2);
    if(!$("#btn-act").textContent.includes("bois d'argent")) throw new Error(`devant le présent du Cerf blanc, le bouton dit « ${$("#btn-act").textContent} »`);
    $("#btn-act").click();
    if(!owned("boisArgent") || !state.cerfBlanc) throw new Error("le bois d'argent n'est pas dans le sac");
    await sortir();
    return "un chevreuil (2 viandes, 1 cuir, la flèche reprise), puis le bois d'argent";
  });
  await etape("La grotte : y entrer depuis la forêt, descendre d'un palier, remonter", async () => {
    place(2);
    await entrer(state.buildings.find(b => b.type === "foret"));
    sacAdd("torche", 2); hold(null);
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
    sacAdd("epeeBois", 1); sacAdd("poissonGrille", 1); hold(null);
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
  await etape("Le sanglier de la forêt : touché à l'arc, il charge ; vaincu à l'épée", async () => {
    place(6);                                          // l'arc, les flèches, l'épée, et ce que laisse le sanglier
    pauseChasse(true);
    await entrer(state.buildings.find(b => b.type === "foret"));
    if(!owned("arcIf")) sacAdd("arcIf", 1);
    if(owned("fleche") < 2) sacAdd("fleche", 3);
    if(!owned("epeeBois")) sacAdd("epeeBois", 1);
    hold(null);
    keys.u = keys.d = keys.l = keys.r = 0; updatePlayer(.016); frames(2);
    let p = player.position;
    const w = vent();
    lacherGibier("sanglier", p.x - w.x * 2.5, p.z - w.z * 2.5); frames(2);
    if(!$("#btn-act").textContent.includes("Tirer")) throw new Error(`devant le sanglier, le bouton dit « ${$("#btn-act").textContent} »`);
    $("#btn-act").click();
    if(!await attendre(() => monstresIci().some(m => m.foret), 3000)) throw new Error("touché, le sanglier ne se retourne pas");
    if($("#coeurs").hidden || $("#combat").hidden) throw new Error("pas de cœurs ni de boutons de combat quand le sanglier charge");
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
    place(2); sacAdd("piocheBronze", 1);
    await entrer(state.buildings.find(b => b.type === "mine"));
    try {
      const p = devantCoeur();
      placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
      if(!$("#btn-act").textContent.includes("Trouve toutes les pierres")) throw new Error(`devant le Cœur endormi, le bouton dit « ${$("#btn-act").textContent} »`);
      for(const k of Object.keys(PIERRES)) if(PIERRES[k] <= 3 && !state.carnet.pierres[k]) noterPierre(k, 1);
      for(let k = 0; k < 10 && !owned("coeurMine"); k++){
        placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
        if(!$("#btn-act").textContent.includes("Dégager le Cœur")) throw new Error(`devant le Cœur réveillé, le bouton dit « ${$("#btn-act").textContent} »`);
        $("#btn-act").click();
      }
      if(owned("coeurMine") !== 1 || !state.coeurMine) throw new Error("le Cœur de la mine n'est pas dans le sac");
      placePlayer(p.x, p.z, p.fx, p.fz); frames(3);
      if(!$("#btn-act").hidden && $("#btn-act").textContent.includes("Cœur")) throw new Error("le Cœur se dégage encore");
    } finally { await sortir(); }
    return `la géode s'ouvre sur : ${objet(cristal).nom.toLowerCase()}${vitrine} ; le Cœur de la mine dégagé`;
  });
  await etape("Les coffres : ranger, déplacer un coffre plein, un coffre dans un coffre", async () => {
    const clic = s => { const b = $(s); if(!b) throw new Error(`pas de bouton ${s}`); b.click(); };
    const libre = () => { const px = tileOf(player.position.x), pz = tileOf(player.position.z);
      for(let d = 1; d < 8; d++) for(let dx = -d; dx <= d; dx++) for(const dz of [-d, d]){ const i = idx(px + dx, pz + dz); if(!poseProblem(i)) return i; }
      throw new Error("pas de place pour poser un coffre"); };
    place(4);                                                                   // le sac de la partie d'essai se remplit
    sacAdd("coffreReserve", 2); sacAdd("bois", 5); hold("coffreReserve");
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
    sacAdd("coffreReserve", 1); hold("coffreReserve");
    await entrer(scierie);
    const avant = state.coffres.length;
    updateCoffrePiece(true);
    if($("#btn-coffre").hidden || !$("#btn-coffre").textContent.includes("Poser")) throw new Error(`pas de bouton « Poser le coffre » (${$("#btn-coffre").textContent})`);
    $("#btn-coffre").click();
    const co = state.coffres.find(c => c.b === scierie.id), it = co && scierie.deco.items.find(v => v.reserve === co.id);
    if(state.coffres.length !== avant + 1 || !it) throw new Error("le coffre n'est pas posé dans la Scierie");
    updateCoffrePiece(true);
    if(!$("#btn-coffre").textContent.includes("Ouvrir")) throw new Error(`pas de bouton « Ouvrir le coffre » (${$("#btn-coffre").textContent})`);
    $("#btn-coffre").click(); await wait(200);
    if(!$("[data-co-deplacer]")) throw new Error("le coffre ne s'ouvre pas");
    $("[data-co-deplacer]").click(); await wait(300);
    if(state.coffres.includes(co) || scierie.deco.items.includes(it)) throw new Error("le coffre n'est pas emporté");
    await sortir();
    return `posé à (${it.x}, ${it.z}) dans la pièce, puis emporté`;
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
