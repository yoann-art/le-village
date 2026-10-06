/* ================= Vérification automatique =================
   Joue les gestes de base sur une partie neuve, comme un joueur pressé, et dit ce qui ne va pas :
   ramasser, marcher, ouvrir le sac, bâtir la Scierie, y entrer, construire l'établi, fabriquer,
   couper un arbre, entrer dans la mine, pêcher (depuis la plage et depuis le ponton), cueillir le thym, le carnet,
   les ingrédients du poisson grillé, vendre au comptoir, attraper un insecte et un oiseau au filet, aller dans la Forêt profonde et y couper un arbre,
   ne jamais rester coincé. Lancée à chaque envoi sur GitHub par
   .github/workflows/verification.yml (via tests/verif.mjs), dans un navigateur neuf.
   Elle refuse de tourner sur une partie déjà avancée, pour ne jamais abîmer la vraie partie de Yo. */
import { B, POISSONS, RECOLTE, objet } from "../js/donnees.js";
import { state } from "../js/sauvegarde.js";
import { sacAdd, owned, sizeOf, payer, hasAll, addOwned } from "../js/regles.js";
import { map, idx, N, H, centerOf, tileOf } from "../js/monde/ile.js";
import { occ } from "../js/monde/batiments.js";
import { eauLibre, entreePonton } from "../js/monde/ponton.js";
import { lacherOmbre } from "../js/peche.js";
import { lacherInsecte, pauseInsectes } from "../js/insectes.js";
import { lacherOiseau, pauseOiseaux } from "../js/oiseaux.js";
import { foretObj, W as WF, fcx, fcz } from "../js/monde/foret.js";
import { player, placePlayer, updatePlayer, R, islandWalkable } from "../js/monde/personnage.js";
import { keys } from "../js/commandes.js";
import { updateRecolte } from "../js/recolte.js";
import { checkDoors, isInside, currentPlace } from "../js/lieux.js";
import { startPlacing, updateInteraction } from "../js/construire.js";
import { openAtelier } from "../js/ateliers.js";
import { renderHUD } from "../js/interface.js";
import { hold } from "../js/barre.js";

const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const frames = (n, dt = .05) => { for(let k = 0; k < n; k++) updateRecolte(dt, true); };
/* Se placer devant la porte d'un bâtiment, et entrer (ou sortir en repassant le paillasson) */
/* Attendre qu'un changement de lieu soit vraiment fini (le jeu peut être lent sur la machine de GitHub) */
async function attendre(test, ms = 6000){ const t0 = performance.now(); while(!test() && performance.now() - t0 < ms) await wait(100); await wait(300); return test(); }
async function entrer(b){
  const s = sizeOf(b.type);
  placePlayer(b.x - H + s/2 + B[b.type].door, b.z - H + s + R, 0, -1);
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
  await etape("Couper un arbre", async () => {
    sacAdd("hachePierre", 1); hold("hachePierre");
    let t = null;
    for(let z = 1; z < N - 1 && !t; z++) for(let x = 1; x < N - 1; x++){
      const i = idx(x, z), s = idx(x, z + 1);
      if(map.obj[i] === "tree" && !map.obj[s] && map.type[s] === "grass" && !state.sol[s]){ t = [x, z]; break; }
    }
    if(!t) throw new Error("aucun arbre accessible");
    const bois = owned("bois");
    placePlayer(centerOf(t[0]), centerOf(t[1] + 1) + .1, 0, -1);
    for(let k = 0; k < 3; k++){ frames(1, .016); $("#btn-act").click(); frames(25); }
    if(map.obj[idx(...t)]) throw new Error("l'arbre est toujours là");
    if(owned("bois") <= bois) throw new Error("pas de bois gagné");
    return `+${owned("bois") - bois} bois`;
  });
  await etape("Entrer dans la mine et en sortir", async () => {
    await entrer(state.buildings.find(b => b.type === "mine"));
    if(currentPlace().room.w < 10) throw new Error("la grotte n'est pas construite");
    const n = Object.keys(state.mine.rocks).length;
    await sortir();
    return `${n} rochers aujourd'hui`;
  });
  await etape("La Forêt profonde : y aller, couper un arbre, revenir", async () => {
    const b = state.buildings.find(b => b.type === "foret");
    if(!b) throw new Error("pas d'orée de la forêt sur l'île");
    await entrer(b);
    if(currentPlace().room.w < 30) throw new Error("la forêt n'est pas construite");
    /* un arbre au bord du grand sentier (colonnes 17 et 18), qu'on coupe depuis le sentier */
    let t = null;
    for(let z = 33; z > 19 && !t; z--) for(const [x, dx] of [[16, -1], [19, 1]]){
      const i = z * WF + x, o = foretObj(i);
      if(o && RECOLTE[o] && RECOLTE[o].res){ t = {i, dx}; break; }   // un arbre qui donne du bois
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
  const place = n => { for(const k of ["graineArbre", "graineThym", "fibre", "pierre", "bois", "planche"]) if(state.sac.length > 12 - n) state.sac = state.sac.filter(it => it.k !== k); };
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
  await etape("Vendre au comptoir, tout de suite", async () => {
    /* un Marché d'essai, avec son comptoir, le temps de vendre un poisson (retiré ensuite) */
    const marche = {id: -1, type: "marche", lvl: 1, x: 0, z: 0, deco: {items: [{id: 1, type: "comptoir", x: 0, z: 0, rot: 0}], next: 2}};
    state.buildings.push(marche);
    try {
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
      return `+${state.res.or - or} or`;
    } finally {
      state.buildings.splice(state.buildings.indexOf(marche), 1); renderHUD();
    }
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
  pauseInsectes(false); pauseOiseaux(false);
  return {ok, erreurs};
}
