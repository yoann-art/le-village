/* ================= Récolter et planter sur l'île =================
   Un bouton d'action à gauche, selon ce qu'il y a devant le personnage :
   - par terre (morceau de bois, petit caillou) : « ✋ Ramasser », à la main (voir monde/sol.js) ;
   - un arbre adulte : « 🪓 Couper » ; l'outil du sac est pris en main tout seul ; chaque
     coup donne du bois, au dernier l'arbre tombe et donne une graine ;
   - un rocher : « ⛏️ Miner » ; chaque coup de pioche donne de la pierre, au dernier il se brise
     et ne revient jamais (ensuite, la pierre se trouve à la mine) ;
   - des herbes hautes : « ✋ Cueillir » (des fibres ; rases, elles repoussent) ; cueillies une 2e fois de suite :
     « ✋ Arracher » (des fibres et une graine ; elles ne repoussent pas) ;
   - un buisson de baies : « ✋ Cueillir les baies » (le buisson est vide) ; vide : « 💧 Arroser » (l'arrosoir ;
     les baies reviennent une heure après) ; la hache en main : « 🪓 Couper le buisson » (une graine) ;
   - l'eau (mer, étang), l'arrosoir en main : « 💧 Remplir l'arrosoir » ; chaque arrosage use une mesure d'eau
     (state.eau ; une jauge la montre dans sa case rapide et dans le sac) ;
   - une graine en main : « 🌱 Planter » sur la case d'herbe libre devant soi ; elle pousse avec l'horloge
     du téléphone (pousse, jeune plant, adulte). Les arbres ne sont jamais collés ;
   - du thym : « ✋ Cueillir le thym » (des brins, parfois sa graine ; il repousse sur place) ;
   - une fleur en fleur (étape 1.9, FLEURS) : « ✋ Cueillir : … » (la fleur, parfois sa graine ; elle refleurit sur
     place) ; hors de sa saison, des feuilles ; on les traverse, comme les herbes hautes et le thym ;
   - un insecte tout près : « 🥅 Attraper » (le filet ; voir insectes.js), avant tout le reste ; un oiseau posé :
     « 🥅 Lancer le filet » (voir oiseaux.js) ;
   - l'eau, la canne en main (ou dans le sac, mains libres) : « 🎣 Lancer » (voir peche.js) ;
   - un coffre de réserve : « 🗃️ Ouvrir le coffre » ; un coffre en main : « 🗃️ Poser le coffre » (voir coffres.js) ;
   - la pelle en main (étape 1.9) : « 🪏 Creuser » l'herbe devant soi, « 🪏 Combler » l'eau douce (voir terraformer.js) ;
   - dans la mine, ses rochers (voir monde/mine.js), ses galeries, et le Cœur de la mine (étape 1.11 : chaque pierre de
     la mine trouvée s'inscrit au carnet, noterPierre) ; dans la Forêt profonde, ses arbres et ses rochers, qui
     repoussent (voir monde/foret.js) ; un rocher, mains libres : « ✋ Prendre le rocher » (dans le sac) ;
     un rocher en main : « 🪨 Poser le rocher » sur une case libre de l'île.
   Tout ce qu'on récolte va dans le sac (demande de Yo) ; s'il est plein, on le range dans un coffre. */
import { $ } from "./outils.js";
import { scene } from "./monde/scene.js";
import { OUTILS, GRAINES, POSABLES, RECOLTE, SOL, FLEURS, FLEUR_RARETE, GALERIES, COEUR_MINE, enFleur, quandFleur, graineDeFleur, objet, vitessePousse } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { addOwned, sacAdd, sacTake, sacPlace, porte, gain, doorTile, tientSurSoi, noterPierre, pierresTrouvees, coeurEveille } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, growthLeft, herbeLeft, baiesLeft, thymLeft, fruitsLeft, fleurLeft, setObj, setEtat, objMesh } from "./monde/ile.js";
import { ESSENCES, ARBRES, FRUITS, cueilletteDe } from "./monde/essences.js";
import { occ } from "./monde/batiments.js";
import { solAt, pickUp } from "./monde/sol.js";
import { player, frontTile, dir4 } from "./monde/personnage.js";
import { mineTile, mineRock, mineRockMesh, setMineRock, galerieEn, coupsRestants, creuser, coeurEn, majCoeur } from "./monde/mine.js";
import { eauLibre, entrees } from "./monde/ponton.js";
import { foret, foretObj, foretMesh, setForetObj, ftile, W as W_FORET, foretFruitsLeft, cueillirForet } from "./monde/foret.js";
import { grotteObj, grotteMesh, setGrotteObj, gtile, W as W_GROTTE, palierEnCours } from "./monde/grotte.js";
import { currentPlace } from "./lieux.js";
import { toast, renderHUD } from "./interface.js";
import { hold, barreAuto, syncBarre, renderBarre } from "./barre.js";
import { openCoffre, poserCoffre, poseProblem } from "./coffres.js";
import { enPeche, lancer, updatePeche, pecheAction } from "./peche.js";
import { updateInsectes, insecteAction, attrapeEnCours } from "./insectes.js";
import { updateOiseaux, oiseauAction, oiseauEnCours } from "./oiseaux.js";
import { updateChasse, chasseAction, tirEnCours } from "./chasse.js";
import { cibleTerrain, actionTerrain, terrainProbleme } from "./terraformer.js";
import { entreeAction } from "./entreeMine.js";
import { user } from "./usure.js";

const btn = $("#btn-act");
const duree = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);   // espaces insécables : « 2 h 59 » reste sur une ligne
  return h ? `${h} h${m ? " " + String(m).padStart(2, "0") : ""}` : `${Math.max(1, Math.ceil(s / 60))} min`; };
const nomDe = (k, n) => { const o = objet(k); return n > 1 ? o.pluriel || o.nom : o.nom.toLowerCase(); };
/* Le sac a-t-il la place ? Sinon un message : on range dans un coffre (demande de Yo) */
const PLEIN = "🎒 Ton sac est plein : range tes affaires dans un coffre de réserve (il se fabrique à l'établi de la Scierie)";
function sacOk(k, n){ if(sacPlace(k) >= n) return true; toast(PLEIN, 3600); return false; }

/* Où l'on récolte : l'île, ou la mine (ses rochers à elle) ; une cible porte son lieu (w) */
const ILE = {obj: i => map.obj[i], mesh: objMesh, set: (i, o) => setObj(i, o), cx: x => centerOf(x)};
const MINE = {obj: mineRock, mesh: mineRockMesh, set: setMineRock, cx: () => 0};
const inMine = () => { const p = currentPlace(); return !!p && p.b.type === "mine"; };
const FORET = {obj: foretObj, mesh: foretMesh, set: setForetObj, cx: x => x - W_FORET/2 + .5};
const inForet = () => { const p = currentPlace(); return !!p && p.b.type === "foret"; };
/* La grotte de la forêt (étape 1.8) : ses rochers, ses veines et ses coffres au trésor, pour la visite en cours */
const GROTTE = {obj: grotteObj, mesh: grotteMesh, set: setGrotteObj, cx: x => x - W_GROTTE/2 + .5};
const inGrotte = () => { const p = currentPlace(); return !!p && p.b.type === "grotte"; };
function targetGrotte(){
  const d = dir4(), p = player.position;
  for(const dist of [.8, 1.3]){
    const i = gtile(p.x + d.x * dist, p.z + d.z * dist), o = i >= 0 && grotteObj(i);
    if(o) return {w: GROTTE, i, x: i % W_GROTTE, z: Math.floor(i / W_GROTTE), o};
  }
  return null;
}
/* Dans la forêt : l'arbre ou le rocher juste devant */
function targetForet(){
  const d = dir4(), p = player.position;
  const arrosoir = state.main && OUTILS[state.main] && OUTILS[state.main].eau;
  const canne = state.main ? OUTILS[state.main] && OUTILS[state.main].famille === "canne" : !!bestTool("canne");
  for(const dist of [.8, 1.3]){
    const i = ftile(p.x + d.x * dist, p.z + d.z * dist);
    const o = i >= 0 && foretObj(i);
    if(o) return {w: FORET, i, x: i % W_FORET, z: Math.floor(i / W_FORET), o};
    if(i >= 0 && foret.type[i] === "eau" && (arrosoir || canne)) return {w: FORET, i, eau: true, peche: !arrosoir};   // le ruisseau, la source
  }
  return null;
}
/* Dans la mine : le rocher juste devant */
function targetMine(){
  const d = dir4(), p = player.position;
  for(const dist of [.8, 1.3]){
    const t = mineTile(p.x + d.x * dist, p.z + d.z * dist);
    if(t >= 0 && mineRock(t)) return {w: MINE, i: t, o: mineRock(t)};
    if(coeurEn(t)) return {w: MINE, i: t, coeur: true};      // le pilier de la géode, où dort le Cœur de la mine
    const g = galerieEn(t);                          // la paroi d'une galerie à creuser (étape 1.11)
    if(g) return {w: MINE, i: t, galerie: g};
  }
  return null;
}
/* Sur l'île : ce qu'il y a devant le personnage : par terre, un objet de l'île, la case libre devant
   (pour planter, poser), ou les herbes hautes où il se tient (on les traverse) */
function target(){
  if(inMine()) return targetMine();
  if(inForet()) return targetForet();
  if(inGrotte()) return targetGrotte();
  const own = [tileOf(player.position.x), tileOf(player.position.z)];
  for(const dist of [0, .8]){
    const [x, z] = dist ? frontTile(dist) : own;
    if(inb(x, z) && solAt(idx(x, z))) return {i: idx(x, z), x, z, sol: solAt(idx(x, z))};
  }
  /* Une graine, un coffre ou un rocher en main : la case juste devant d'abord, si elle est libre */
  const [fx, fz] = frontTile(.8);
  if((GRAINES[state.main] || POSABLES[state.main]) && inb(fx, fz) && !map.obj[idx(fx, fz)] && !occ.has(idx(fx, fz)))
    return {i: idx(fx, fz), x: fx, z: fz, o: null};
  const pelle = cibleTerrain();                       // la pelle en main : creuser, combler (étape 1.9)
  if(pelle) return pelle;
  const arrosoir = state.main && OUTILS[state.main] && OUTILS[state.main].eau;
  const canne = state.main ? OUTILS[state.main] && OUTILS[state.main].famille === "canne" : !!bestTool("canne");
  for(const dist of [.8, 1.3]){
    const [x, z] = frontTile(dist);
    if(!inb(x, z)) continue;
    const i = idx(x, z);
    if(occ.has(i)) return null;                       // un bâtiment : c'est son bouton à lui
    if(map.obj[i]) return {w: ILE, i, x, z, o: map.obj[i]};
    if((arrosoir || canne) && eauLibre(i)) return {i, x, z, eau: true, peche: !arrosoir};   // le bord de l'eau : l'arrosoir, ou la canne
  }
  const [x, z] = frontTile(.8);
  if((GRAINES[state.main] || POSABLES[state.main]) && inb(x, z)) return {i: idx(x, z), x, z, o: null};
  const ici = inb(...own) && map.obj[idx(...own)];
  if(ici === "herbe" || ici === "thym" || FLEURS[ici]) return {w: ILE, i: idx(...own), x: own[0], z: own[1], o: ici};
  return inb(x, z) ? {i: idx(x, z), x, z, o: null} : null;
}

/* Peut-on planter ici ? (null si oui, sinon la raison) */
const NEAR = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
function plantProblem(t, plante){
  const i = t.i;
  if(map.type[i] !== "grass") return "Ça ne pousse que sur l'herbe";
  if(map.obj[i] || occ.has(i)) return "Cette case est occupée";
  if(solAt(i)) return "Ramasse d'abord ce qui est par terre";
  if(state.chemins[i]) return "Rien ne pousse sur un chemin (la pelle l'enlève)";
  if(state.buildings.some(b => { const [x, z] = doorTile(b.type, b.x, b.z, b.rot); return x === t.x && z === t.z; })) return "La case devant une porte reste libre";
  if(entrees.has(i)) return "Le passage vers le ponton ou le pont reste libre";
  if(tileOf(player.position.x) === t.x && tileOf(player.position.z) === t.z) return "Recule d'un pas pour planter devant toi";
  if(ARBRES.has(plante) && NEAR.some(([dx, dz]) => inb(t.x + dx, t.z + dz) && ARBRES.has(map.obj[idx(t.x + dx, t.z + dz)])))
    return "Trop près d'un autre arbre : laisse une case entre les deux";
  return null;
}

/* Le meilleur outil d'une famille sur soi, dans le sac ou une case rapide (le plus fort) */
function bestTool(famille){
  return porte().map(it => it.k).filter(k => OUTILS[k] && OUTILS[k].famille === famille).sort((a, b) => OUTILS[b].force - OUTILS[a].force)[0] || null;
}
/* Prend en main l'outil d'une famille (celui qu'on tient, ou le meilleur) ; null s'il n'y en a pas */
function takeTool(famille){
  const k = state.main && OUTILS[state.main] && OUTILS[state.main].famille === famille ? state.main : bestTool(famille);
  if(k && state.main !== k){ barreAuto(k); hold(k); }
  return k;
}
/* Une graine récoltée : dans le sac (et une case rapide) ; sac plein : dans un coffre s'il y a de la place */
function giveSeed(k){
  const r = addOwned(k, 1);
  if(r.sac) barreAuto(k);
  syncBarre();
  return r.sac ? "dans ton sac" : r.coffre ? "dans un coffre (sac plein)" : "perdue : ton sac et tes coffres sont pleins";
}

/* ----- Le bouton d'action : son texte, et ce qu'il fait ----- */
let cur = null, act = null, anim = null;              // ce qu'on vise ; son action {label, run} ; l'animation {i, t, kind}
const hits = new Map();                               // coups déjà donnés à chaque arbre, buisson ou rocher
const hk = t => (t.w === MINE ? "m" : t.w === FORET ? "f" : t.w === GROTTE ? "g" : "") + t.i;
const info = label => ({label, run: () => toast(label)});
function actionOf(t){
  if(t.sol) return {label: `✋ Ramasser : ${SOL[t.sol].nom.toLowerCase()}`, run: () => ramasser(t)};
  if(t.pelle) return actionTerrain(t);
  if(t.o === "coffre") return {label: "🗃️ Ouvrir le coffre", run: () => openCoffre(state.ile[t.i].id)};
  if(t.peche) return {label: "🎣 Lancer", run: () => { if(takeTool("canne")) lancer(); }};
  if(t.eau){ const max = OUTILS[state.main].eau;
    return state.eau < max ? {label: `💧 Remplir l'arrosoir (${state.eau}/${max})`, run: remplir} : info(`💧 Arrosoir plein (${max}/${max})`); }
  const g = t.o && t.w === ILE ? growth(t.i) : 1, h = hits.get(hk(t));
  const tenu = state.main && OUTILS[state.main] && OUTILS[state.main].famille;
  if(t.galerie) return galerieAction(t.galerie);
  if(t.coeur) return coeurAction();
  if(t.o === "tresor") return {label: "🎁 Ouvrir le coffre au trésor", run: () => ouvrirTresor(t)};
  if(t.o === "rockOr"){ const h2 = hits.get(hk(t)); return {label: `⛏️ Miner la veine d'or${h2 ? ` (${RECOLTE.rockOr.coups - h2})` : ""}`, run: () => couper(t)}; }
  if(t.o === "racines") return info("🕳️ La grotte, sous les racines du vieux chêne : avance dans l'ouverture pour y descendre");
  if(t.o === "grandChene" || t.o === "bloc") return info("👑 Le Grand Chêne millénaire : on ne l'abat pas. Il veille sur la forêt depuis mille ans");
  /* Les arbres de la forêt (dans la forêt, ou plantés sur l'île) : chacun son bois et sa graine ; le houx et le
     sureau se cueillent (baies, fleurs), et se coupent hache en main */
  if(ESSENCES.includes(t.o)){
    const R = RECOLTE[t.o], nom = R.nom.replace(/^(le |l')/, "");
    if(g < 1) return info(`🌱 Jeune ${nom} : adulte dans ${duree(growthLeft(t.i))}`);
    if(FRUITS[t.o] && tenu !== "hache"){
      const reste = t.w === FORET ? foretFruitsLeft(t.i) : fruitsLeft(t.i), k = cueilletteDe(t.o);
      if(!k) return info(`🌿 ${nom[0].toUpperCase() + nom.slice(1)} : rien à cueillir en cette saison (la hache le coupe)`);
      if(reste > 0) return info(`🌿 ${objet(k).nom} : de retour dans ${duree(reste)}`);
      return {label: `✋ Cueillir : ${objet(k).nom.toLowerCase()}`, run: () => cueillirFruits(t, k)};
    }
    const k = bestTool("hache");                     // la hache selon l'essence : les bois durs et les géants demandent mieux
    if(R.force && (!k || OUTILS[k].force < R.force)) return info(TROP_DUR.hache(R.force, R.nom));
    return {label: `🪓 Couper ${R.nom}${h ? ` (${R.coups - h})` : ""}`, run: () => couper(t)};
  }
  if(t.o === "tree")
    return g < 1 ? info(`🌱 Jeune arbre : adulte dans ${duree(growthLeft(t.i))}`)
      : {label: `🪓 Couper${h ? ` (${RECOLTE.tree.coups - h})` : ""}`, run: () => couper(t)};
  if(t.o === "rock" || t.o === "rockCuivre")         // mains libres : on le prend ; sinon, on le mine
    return !state.main && !h ? {label: "✋ Prendre le rocher", run: () => prendre(t)}
      : {label: `⛏️ Miner${h ? ` (${RECOLTE[t.o].coups - h})` : ""}`, run: () => couper(t)};
  if(RECOLTE[t.o] && RECOLTE[t.o].outil === "pioche"){   // les roches des salles de la mine (étape 1.11)
    const R = RECOLTE[t.o], k = bestTool("pioche");
    if(R.force && (!k || OUTILS[k].force < R.force)) return info(TROP_DUR.pioche(R.force));
    return {label: `⛏️ Miner ${R.nom}${h ? ` (${R.coups - h})` : ""}`, run: () => couper(t)};
  }
  if(t.o === "herbe"){
    if(g < 1) return info(`🌱 Jeunes herbes : hautes dans ${duree(growthLeft(t.i))}`);
    return herbeLeft(t.i) > 0 ? {label: "✋ Arracher (+1 graine)", run: () => arracher(t)} : {label: "✋ Cueillir", run: () => cueillirHerbe(t)};
  }
  if(FLEURS[t.o]){                                  // une fleur (étape 1.9) : en fleur à sa saison, elle se cueille
    const f = FLEURS[t.o], nom = f.nom.toLowerCase(), il = f.une ? "elle" : "il";
    if(g < 1) return info(`🌱 Jeune ${nom} : encore ${duree(growthLeft(t.i))}`);
    if(!enFleur(f)) return info(`🌿 ${f.nom} : fleurit ${quandFleur(f)}`);
    const r = fleurLeft(t.i);
    return r > 0 ? info(`🌿 ${f.nom} : refleurit dans ${duree(r)}`) : {label: `✋ Cueillir : ${nom}`, run: () => cueillirFleur(t)};
  }
  if(t.o === "thym"){
    if(g < 1) return info(`🌱 Jeune thym : prêt dans ${duree(growthLeft(t.i))}`);
    const r = thymLeft(t.i);
    return r > 0 ? info(`🌿 Le thym repousse : encore ${duree(r)}`) : {label: "✋ Cueillir le thym", run: () => cueillirThym(t)};
  }
  if(t.o === "buisson"){
    if(g < 1) return info(`🌱 Jeune buisson : adulte dans ${duree(growthLeft(t.i))}`);
    if(tenu === "hache") return {label: `🪓 Couper le buisson${h ? ` (${RECOLTE.buisson.coups - h})` : ""}`, run: () => couper(t)};
    const b = baiesLeft(t.i);
    return b === 0 ? {label: "✋ Cueillir les baies", run: () => cueillirBaies(t)}
      : b < 0 ? {label: `💧 Arroser${tenu === "arrosoir" ? ` (eau ${state.eau}/${OUTILS[state.main].eau})` : ""}`, run: () => arroser(t)}
      : info(`🫐 Baies dans ${duree(b)}`);
  }
  if(!t.o && GRAINES[state.main]) return {label: "🌱 Planter", run: () => planter(t)};
  if(!t.o && POSABLES[state.main])
    return POSABLES[state.main].pose === "coffre" ? {label: "🗃️ Poser le coffre", run: () => poserCoffre(t.i)}
      : {label: "🪨 Poser le rocher", run: () => poser(t)};
  return null;
}
/* La case où l'on va planter ou poser (demande de Yo) : en surbrillance, jaune avec un contour blanc si c'est
   possible, rouge sinon (le jaune se voit sur l'herbe comme sur le sable) */
const fond = new THREE.MeshBasicMaterial({color: 0xFFE27A, transparent: true, opacity: .6, depthWrite: false});
const bord = new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, opacity: .95, depthWrite: false});
const surbrillance = new THREE.Group();
surbrillance.add(new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), fond));
const cadre = new THREE.Mesh(new THREE.RingGeometry(.6, .69, 4, 1), bord);
cadre.rotation.z = Math.PI/4; cadre.position.z = .002; surbrillance.add(cadre);
surbrillance.rotation.x = -Math.PI/2; surbrillance.visible = false; scene.add(surbrillance);
function showCase(t){
  const k = state.main, pose = t && (t.pelle || !t.o && !t.sol && !t.eau && t.x !== undefined && (GRAINES[k] || POSABLES[k]));
  if(!pose){ if(surbrillance.visible) surbrillance.visible = false; return; }
  const ok = !(t.pelle ? terrainProbleme(t) : GRAINES[k] ? plantProblem(t, GRAINES[k].plante) : poseProblem(t.i));
  fond.color.setHex(ok ? 0xFFE27A : 0xE4776C); bord.color.setHex(ok ? 0xFFFFFF : 0xFFD1CC);
  surbrillance.position.set(centerOf(t.x), .03, centerOf(t.z));
  surbrillance.visible = true;
}
export function updateRecolte(dt, active){
  if(anim) animate(dt);
  const milieu = !currentPlace() ? "ile" : inForet() ? "foret" : null;   // les poissons, les insectes et les oiseaux : dehors et dans la forêt
  updatePeche(dt, active, milieu);
  updateInsectes(dt, active, milieu);
  updateOiseaux(dt, active, milieu);
  updateChasse(dt, active, milieu);                   // le gibier : seulement dans la forêt
  cur = active && !anim && !enPeche() && !attrapeEnCours() && !oiseauEnCours() && !tirEnCours() ? target() : null;
  showCase(cur);
  const bete = active && !anim && milieu && (insecteAction() || oiseauAction() || chasseAction());
  const entree = active && !anim && milieu === "ile" && entreeAction();   // devant l'entrée de la mine pas encore construite
  act = enPeche() ? pecheAction() : bete || entree || (cur && actionOf(cur));
  btn.classList.toggle("ferrer", !!(act && act.alerte));
  if(!act){ if(!btn.hidden) btn.hidden = true; return; }
  if(btn.textContent !== act.label) btn.textContent = act.label;
  if(btn.hidden) btn.hidden = false;
}
btn.addEventListener("click", () => { if(act && !anim) act.run(); });

/* ----- Un coffre au trésor de la grotte (étape 1.8) : de l'or, et de quoi continuer (plus on descend, plus il y en a) ----- */
function ouvrirTresor(t){
  const p = palierEnCours() || 1, or = 3 * p + Math.floor(Math.random() * 4 * p);
  const choix = [["cuivre", 2 + Math.floor(Math.random() * 3)], ["fleche", 5], ["torche", 2], ["cuivre", 3 * p]];
  const gains = [choix[Math.floor(Math.random() * choix.length)]];
  if(p > 1) gains.push(choix[Math.floor(Math.random() * choix.length)]);
  if(!tientSurSoi(Object.fromEntries(gains.reduce((m, [k, n]) => m.set(k, (m.get(k) || 0) + n), new Map())))){ toast("🎒 Ton sac est plein : fais de la place pour ouvrir le coffre", 3000); return; }
  for(const [k, n] of gains){ sacAdd(k, n); barreAuto(k); }
  addOwned("or", or);
  t.w.set(t.i, null);
  syncBarre(); renderHUD(); save();
  toast(`🎁 Le coffre s'ouvre : +${or} or, ${gains.map(([k, n]) => `+${n} ${nomDe(k, n)}`).join(", ")}`, 3400);
}

/* ----- Ramasser ce qui est par terre ----- */
function ramasser(t){
  const d = SOL[solAt(t.i)], n = gain(d.n, d.res);
  if(!sacOk(d.res, n) || !pickUp(t.i)) return;
  sacAdd(d.res, n); renderHUD(); save();
  toast(`${objet(d.res).emoji} +${n} ${nomDe(d.res, n)}`, 1200);
}

/* ----- Cueillir ----- */
/* Les baies du houx, les fleurs ou les baies du sureau (étape 1.7) : elles reviennent (RECOLTE.retour) */
function cueillirFruits(t, k){
  const R = RECOLTE[t.o];
  if(!sacOk(k, R.n)) return;
  sacAdd(k, R.n);
  if(t.w === FORET) cueillirForet(t.i); else setEtat(t.i, {cueilli: Date.now()});
  save();
  toast(`${objet(k).emoji} +${R.n} ${nomDe(k, R.n)}. Elles reviennent dans ${duree(R.retour)}`, 3000);
}
function cueillirHerbe(t){
  const R = RECOLTE.herbe, n = gain(R.n, R.cueille);
  if(!sacOk(R.cueille, n)) return;
  sacAdd(R.cueille, n);
  setEtat(t.i, {coupe: Date.now()}); save();
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}. Elles repoussent dans ${duree(R.repousse)} ; cueille encore pour avoir la graine`, 3200);
}
function arracher(t){
  const R = RECOLTE.herbe, n = gain(R.n, R.cueille);
  if(!sacOk(R.cueille, n)) return;
  sacAdd(R.cueille, n);
  setObj(t.i, null);
  const ou = giveSeed(R.graine); save();
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}, +1 ${nomDe(R.graine, 1)} ${ou} : elles ne repousseront pas ici`, 3200);
}
/* Le thym (Grand Carnet) : la cueillette donne toujours ses brins, et parfois sa graine ; il repousse sur place */
function cueillirThym(t){
  const R = RECOLTE.thym;
  if(!sacOk(R.cueille, R.n)) return;
  sacAdd(R.cueille, R.n);
  setEtat(t.i, {coupe: Date.now()});
  const graine = Math.random() < R.chance, ou = graine ? giveSeed(R.graine) : "";
  save();
  toast(`🌿 +${R.n} ${nomDe(R.cueille, R.n)}${graine ? `, +1 ${nomDe(R.graine, 1)} ${ou}` : ""}. Il repousse ici dans ${duree(R.repousse)}`, 3200);
}
/* Une fleur (étape 1.9, Grand Carnet : « cueillir une fleur sauvage donne toujours la fleur ; elle donne parfois sa
   graine, selon sa rareté ; sans graine, on attend qu'elle refleurisse sur place ») */
function cueillirFleur(t){
  const f = FLEURS[t.o], R = FLEUR_RARETE[f.rarete];
  if(!sacOk(t.o, 1)) return;
  sacAdd(t.o, 1);
  const graine = Math.random() < R.graine, ou = graine ? giveSeed(graineDeFleur(t.o)) : "";
  setEtat(t.i, {cueilli: Date.now()}); save();
  toast(`🌸 +1 ${f.nom.toLowerCase()}${graine ? `, +1 ${nomDe(graineDeFleur(t.o), 1)} ${ou}` : ""}. ${f.une ? "Elle" : "Il"} refleurit ici dans ${duree(R.refleurit)}`, 3200);
}
function cueillirBaies(t){
  const R = RECOLTE.buisson, n = gain(R.n, R.cueille);
  if(!sacOk(R.cueille, n)) return;
  sacAdd(R.cueille, n);
  setEtat(t.i, {vide: Date.now(), arrose: undefined}); save();      // l'heure de la cueillette : la pluie qui tombe ensuite l'arrose
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}. Arrose le buisson pour qu'elles reviennent (la pluie l'arrose aussi)`, 3000);
}
function arroser(t){
  const k = takeTool("arrosoir");
  if(!k){ toast(`💧 Il te faut un arrosoir dans ton sac : fabrique-le à l'établi de la Scierie, ou reprends-le dans un coffre`, 3200); return; }
  if(state.eau <= 0){ toast(`🪣 Ton arrosoir est vide : remplis-le au bord de l'eau (mer ou étang)`, 3000); return; }
  state.eau--;
  setEtat(t.i, {arrose: Date.now()}); renderBarre(); save();
  anim = {w: ILE, i: t.i, t: 0, kind: "shake"};
  toast(`💧 Arrosé : les baies reviennent dans ${duree(RECOLTE.buisson.retour)}. Eau : ${state.eau}/${OUTILS[k].eau}`, 2800);
  user(k);
}
function remplir(){
  const max = OUTILS[state.main].eau;
  state.eau = max; renderBarre(); save();
  toast(`💧 Arrosoir rempli : ${max} arrosages`, 2000);
}

/* ----- Couper (un arbre, un buisson) ou miner (un rocher) ----- */
const FIN = {tree: "🌳 L'arbre est tombé", buisson: "🌿 Le buisson est coupé", rock: "🪨 Le rocher s'est brisé", rockCuivre: "🪨 Le rocher s'est brisé", rockOr: "✨ La veine d'or est épuisée",
  rockAmethyste: "💜 Le rocher s'ouvre sur une améthyste", rockGrenat: "❤️ Le rocher s'ouvre sur un grenat", rockGeode: "🥚 Une géode se détache"};
const IL_FAUT = {hache: "🪓 Il te faut une hache dans ton sac : fabrique-la", pioche: "⛏️ Il te faut une pioche dans ton sac : fabrique-la"};
const PIOCHE = {2: "une pioche en cuivre", 3: "une pioche en bronze"};
/* Trop dur pour l'outil qu'on a : une roche de la mine (étape 1.11), un bois dur ou un géant (la hache selon l'essence) */
const TROP_DUR = {
  pioche: f => `🪨 Roche trop dure : il te faut ${PIOCHE[f]}`,
  hache: (f, nom) => { const n = nom[0].toUpperCase() + nom.slice(1);
    return f >= 3 ? `🌳 ${n}, un géant millénaire : il te faut une hache en bronze` : `🪵 ${n}, un bois dur : il te faut une hache en cuivre`; }};
/* L'outil tenu est trop faible, mais un plus solide de la même famille est sur soi : on le prend */
function assez(k, force, famille = "pioche"){
  if(!k || !force || OUTILS[k].force >= force) return k;
  const b = bestTool(famille);
  if(b && OUTILS[b].force >= force){ barreAuto(b); hold(b); return b; }
  return k;
}
function couper(t){
  const R = RECOLTE[t.o], k = assez(takeTool(R.outil), R.force, R.outil);
  if(!k){ toast(`${IL_FAUT[R.outil]} à l'établi de la Scierie, ou reprends-la dans un coffre`, 3200); return; }
  if(R.force && OUTILS[k].force < R.force){ toast(TROP_DUR[R.outil](R.force, R.nom) + " (enclume de la Forge)", 2800); return; }
  const h = (hits.get(hk(t)) || 0) + 1;
  if(R.auBout && h >= R.coups && !sacOk(R.res, R.auBout)) return;     // une pierre précieuse : seulement au dernier coup
  const n = R.res && !R.auBout ? gain(R.parCoup, R.res) : 0;         // une ressource par coup, quel que soit l'outil (demande de Yo)
  if(n){ if(R.res === "or") addOwned("or", n); else { if(!sacOk(R.res, n)) return; sacAdd(R.res, n); trouve(R.res, n); } renderHUD(); }   // l'or va dans la bourse
  if(h < R.coups){ hits.set(hk(t), h); anim = {w: t.w, i: t.i, t: 0, kind: "shake"}; if(n) toast(`${objet(R.res).emoji} +${n} ${nomDe(R.res, n)}`, 1200); }
  else {
    hits.delete(hk(t));
    if(R.auBout){ sacAdd(R.res, R.auBout); trouve(R.res, R.auBout); }
    anim = {w: t.w, i: t.i, t: 0, kind: t.o.startsWith("rock") ? "break" : "fall", o: t.o, R, n: R.auBout || n, side: Math.sign(player.position.x - t.w.cx(t.x)) || 1};
  }
  save();
  user(k);                                            // l'outil s'use (usure.js)
}
/* Une pierre trouvée s'inscrit au carnet (étape 1.11, morceau 4) ; la dernière des trois salles réveille le Cœur de la mine */
function trouve(k, n){
  const avant = coeurEveille();
  noterPierre(k, n);
  if(avant || !coeurEveille()) return;
  majCoeur();
  setTimeout(() => toast("✨ Toutes les pierres des trois salles sont à ton carnet… Au fond de la géode, dans le pilier, une lueur s'est mise à battre.", 6000), 3800);
}
/* ----- Le Cœur de la mine (morceau 4) : légendaire, une seule fois dans le jeu ----- */
function coeurAction(){
  if(!coeurEveille()){ const [n, tot] = pierresTrouvees(); return info(`✨ Une lueur dort dans la roche… Trouve toutes les pierres des trois salles pour la réveiller (${n} sur ${tot})`); }
  const k = bestTool("pioche");
  if(!k || OUTILS[k].force < COEUR_MINE.force) return info("💖 Le Cœur de la mine bat dans la roche : il te faut une pioche en bronze pour le dégager");
  return {label: `⛏️ Dégager le Cœur de la mine (${COEUR_MINE.coups - (state.coeurCoups || 0)})`, run: degagerCoeur};
}
function degagerCoeur(){
  const k = assez(takeTool("pioche"), COEUR_MINE.force);
  if(!k || OUTILS[k].force < COEUR_MINE.force || !coeurEveille()) return;
  const h = (state.coeurCoups || 0) + 1;
  if(h < COEUR_MINE.coups){ state.coeurCoups = h; save(); toast(`⛏️ La roche s'effrite autour du Cœur… (encore ${COEUR_MINE.coups - h})`, 1600); user(k); return; }
  if(!sacOk("coeurMine", 1)) return;
  user(k);
  delete state.coeurCoups; state.coeurMine = Date.now();
  sacAdd("coeurMine", 1); noterPierre("coeurMine", 1);
  majCoeur(); renderHUD(); save();
  toast("💖 Le Cœur de la mine ! Une pierre chaude qui bat comme un cœur, la seule de tout le jeu. Il est dans ton sac et à ton carnet : expose-le dans une vitrine.", 7000);
}
/* ----- Les galeries de la mine (étape 1.11, morceau 2) : la paroi marquée d'une croix, à creuser avec la bonne pioche ----- */
function galerieAction(g){
  const c = GALERIES[g], k = bestTool("pioche");
  if(!k || OUTILS[k].force < c.force) return info(`🪨 Une roche très dure cache ${c.salle} : il te faut ${c.pioche}`);
  return {label: `⛏️ Creuser la galerie (${coupsRestants(g)})`, run: () => creuserGalerie(g)};
}
function creuserGalerie(g){
  const c = GALERIES[g], k = assez(takeTool("pioche"), c.force);
  if(!k || OUTILS[k].force < c.force) return;
  const r = creuser(g), place = sacPlace("pierre") >= 1;
  if(place) sacAdd("pierre", 1);
  renderHUD(); save();
  user(k);
  toast(r === "ouverte" ? `✨ La galerie est ouverte : voici ${c.salle} ! ${g === 2 ? "Étain, granit, quartz… et peut-être une améthyste." : "Argent, marbre, grenats, géodes…"}`
    : r === "troncon" ? `⛏️ La galerie avance : encore ${coupsRestants(g)} coups${place ? " (+1 pierre)" : ""}` : "🪨 +1 pierre", r === "ouverte" ? 4600 : r === "troncon" ? 2400 : 900);
}
function animate(dt){
  anim.t += dt;
  const g = (anim.w || ILE).mesh(anim.i);
  if(!g){ anim = null; return; }
  if(anim.kind === "shake"){                          // il tremble sous le coup
    g.rotation.z = Math.sin(anim.t * 40) * .06 * Math.max(0, 1 - anim.t / .3);
    if(anim.t >= .3){ g.rotation.z = 0; anim = null; }
  } else if(anim.kind === "break"){                   // le rocher se brise : il s'aplatit et disparaît
    if(!anim.s) anim.s = g.scale.x;
    const f = Math.max(0, 1 - anim.t / .45);
    g.scale.set(anim.s * (1 + (1 - f) * .3), anim.s * f, anim.s * (1 + (1 - f) * .3));
    if(anim.t >= .45) tombe();
  } else {                                            // il tombe, du côté opposé au personnage
    g.rotation.order = "ZYX";                         // la chute se fait dans le monde, pas selon l'arbre tourné
    g.rotation.z = anim.side * Math.min(1, anim.t / .6) ** 2 * 1.45;
    if(anim.t >= .75) tombe();
  }
}
function tombe(){
  const {w, i, o, R, n} = anim;
  anim = null;
  w.set(i, null);
  /* sa graine : toujours pour l'arbre de l'île ; selon sa rareté pour ceux de la forêt (carnet : chance) */
  const graine = R.graine && (R.chance === undefined || Math.random() < R.chance);
  const ou = graine ? giveSeed(R.graine) : ""; save();
  toast(`${FIN[o] || (o.startsWith("rock") ? "🪨 La roche s'est brisée" : "🌳 L'arbre est tombé")} : ${[n ? `+${n} ${nomDe(R.res, n)}` : "", graine ? `+1 ${nomDe(R.graine, 1)} ${ou}` : "", R.graine && !graine ? "pas de graine cette fois" : ""].filter(Boolean).join(", ")}`, 3600);
}

/* ----- Prendre un rocher (mains libres), et le poser sur l'île ----- */
function prendre(t){
  const k = RECOLTE[t.o].prendre;
  if(!sacOk(k, 1)) return;
  sacAdd(k, 1); barreAuto(k);
  t.w.set(t.i, null);
  syncBarre(); save();
  toast(`🪨 ${objet(k).nom} dans ton sac : prends-le en main pour le poser sur ton île. (Pour miner, prends ta pioche.)`, 3600);
}
function poser(t){
  const k = state.main, why = poseProblem(t.i);
  if(why){ toast(why); return; }
  if(!sacTake(k, 1)) return;
  setObj(t.i, POSABLES[k].pose);
  syncBarre(); save();
  toast(`🪨 ${objet(k).nom} posé`, 1600);
}

/* ----- Planter ----- */
const DEVIENT = {tree: "un arbre adulte", herbe: "des herbes hautes", buisson: "un buisson de baies", thym: "du thym prêt à cueillir"};
function planter(t){
  const k = state.main, gr = GRAINES[k];
  const why = plantProblem(t, gr.plante);
  if(why){ toast(why); return; }
  if(!sacTake(k, 1)) return;
  setObj(t.i, gr.plante, Date.now());
  syncBarre(); save();
  const f = FLEURS[gr.plante], v = vitessePousse(), hiver = v < 1 ? " (l'hiver, ça pousse deux fois moins vite)" : "";   // étape 1.10, morceau 4
  if(f){ toast(`🌱 ${gr.nom} plantée : ${f.une ? "elle" : "il"} sera grand${f.une ? "e" : ""} dans ${duree(gr.pousse / v)}${hiver}, et fleurira ${quandFleur(f)}`, 3800); return; }
  toast(`🌱 ${gr.nom} planté${gr.nom.startsWith("Gland") ? "" : "e"} : ${DEVIENT[gr.plante] || RECOLTE[gr.plante].nom.replace(/^le /, "un ").replace(/^l'/, "un ") + " adulte"} dans ${duree(gr.pousse / v)}${hiver}`, 3400);
}
