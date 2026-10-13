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
     repoussent (voir monde/foret.js) ; au Marais brumeux (étape 1.13, morceau 4), ses arbres (l'eau de brume du saule
     se recueille au bocal) et ses plantes à cueillir, à leur saison, certaines la nuit (voir monde/marais.js) ; un rocher, mains libres : « ✋ Prendre le rocher » (dans le sac) ;
     un rocher en main : « 🪨 Poser le rocher » sur une case libre de l'île.
   Tout ce qu'on récolte va dans le sac (demande de Yo) ; s'il est plein, on le range dans un coffre.
   Demande de Yo (11 octobre 2026) : un outil ne sert que s'il est tenu en main, pris dans une case rapide ; sinon le bouton
   dit de le prendre (`avecOutil`, `outilPour` et `prendreAction` dans barre.js). */
import { $ } from "./outils.js";
import { scene } from "./monde/scene.js";
import { OUTILS, GRAINES, POSABLES, MEUBLES, B, poseDehors, RECOLTE, SOL, FLEURS, FLEUR_RARETE, GALERIES, COEUR_MINE, enFleur, quandFleur, graineDeFleur, objet, vitessePousse,
  PRODUITS, enSaisonPlante, quandPlante } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { addOwned, owned, sizeOf, sacAdd, sacTake, sacPlace, porte, gain, doorTile, tientSurSoi, noterPierre, pierresTrouvees, coeurEveille } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, growthLeft, herbeLeft, baiesLeft, thymLeft, fruitsLeft, fleurLeft, setObj, setEtat, objMesh } from "./monde/ile.js";
import { ESSENCES, ARBRES, FRUITS, cueilletteDe } from "./monde/essences.js";
import { occ, placeMesh, colPorte } from "./monde/batiments.js";
import { solAt, pickUp } from "./monde/sol.js";
import { player, frontTile, devant } from "./monde/personnage.js";
import { compteGestes, gesteAction } from "./monde/mains.js";
import { mineTile, mineRock, mineRockMesh, setMineRock, galerieEn, coupsRestants, creuser, coeurEn, majCoeur } from "./monde/mine.js";
import { eauLibre, entrees } from "./monde/ponton.js";
import { foret, foretObj, foretMesh, setForetObj, ftile, W as W_FORET, foretFruitsLeft, cueillirForet } from "./monde/foret.js";
import { grotteObj, grotteMesh, setGrotteObj, gtile, W as W_GROTTE, palierEnCours } from "./monde/grotte.js";
import { marais, maraisObj, maraisMesh, setMaraisObj, mtile, W as W_MARAIS, maraisCueilliLeft, cueillirMarais, plante, planteDispo } from "./monde/marais.js";
import { nuitIci } from "./monde/ciel.js";
import { currentPlace } from "./lieux.js";
import { toast, renderHUD } from "./interface.js";
import { hold, barreAuto, syncBarre, renderBarre, tenu, outilPour, prendreAction } from "./barre.js";
import { openCoffre, poserCoffre, poseProblem } from "./coffres.js";
import { enPeche, lancer, updatePeche, pecheAction } from "./peche.js";
import { updateInsectes, insecteAction, attrapeEnCours } from "./insectes.js";
import { updateOiseaux, oiseauAction, oiseauEnCours } from "./oiseaux.js";
import { updateChasse, chasseAction, tirEnCours } from "./chasse.js";
import { cibleTerrain, actionTerrain, terrainProbleme } from "./terraformer.js";
import { entreeAction } from "./entreeMine.js";
import { poserTorche } from "./lumieres.js";
import { torcheAction } from "./torche.js";
import { barqueAction, enBarque } from "./barque.js";
import { voyageAction } from "./voyage.js";
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
/* Le Marais brumeux (étape 1.13, morceau 4) : ses arbres et ses plantes ; on traverse les plantes des îlots */
const MARAIS = {obj: maraisObj, mesh: maraisMesh, set: setMaraisObj, cx: x => x - W_MARAIS/2 + .5};
const inMarais = () => { const p = currentPlace(); return !!p && p.b.type === "marais"; };
function targetMarais(){
  const p = player.position, cible = i => ({w: MARAIS, i, x: i % W_MARAIS, z: Math.floor(i / W_MARAIS), o: maraisObj(i)});
  const arrosoir = state.main && OUTILS[state.main] && OUTILS[state.main].eau;
  const canne = state.main ? !!tenu("canne") : outilPour("canne").ou === "case";   // la canne en main, ou dans une case (mains libres)
  for(const dist of [.8, 1.3]){
    const q = devant(dist), i = mtile(q.x, q.z);
    if(i >= 0 && maraisObj(i) && maraisObj(i) !== "panneau") return cible(i);
    if(i >= 0 && marais.type[i] === "eau" && !maraisObj(i) && (arrosoir || canne)) return {w: MARAIS, i, eau: true, peche: !arrosoir};   // les chenaux (morceau 5)
  }
  const ici = mtile(p.x, p.z);
  return ici >= 0 && plante(maraisObj(ici)) ? cible(ici) : null;
}
/* La grotte de la forêt (étape 1.8) : ses rochers, ses veines et ses coffres au trésor, pour la visite en cours */
const GROTTE = {obj: grotteObj, mesh: grotteMesh, set: setGrotteObj, cx: x => x - W_GROTTE/2 + .5};
const inGrotte = () => { const p = currentPlace(); return !!p && p.b.type === "grotte"; };
function targetGrotte(){
  for(const dist of [.8, 1.3]){
    const q = devant(dist), i = gtile(q.x, q.z), o = i >= 0 && grotteObj(i);
    if(o) return {w: GROTTE, i, x: i % W_GROTTE, z: Math.floor(i / W_GROTTE), o};
  }
  return null;
}
/* Dans la forêt : l'arbre ou le rocher juste devant */
function targetForet(){
  const arrosoir = state.main && OUTILS[state.main] && OUTILS[state.main].eau;
  const canne = state.main ? !!tenu("canne") : outilPour("canne").ou === "case";   // la canne en main, ou dans une case (mains libres)
  for(const dist of [.8, 1.3]){
    const q = devant(dist), i = ftile(q.x, q.z);
    const o = i >= 0 && foretObj(i);
    if(o) return {w: FORET, i, x: i % W_FORET, z: Math.floor(i / W_FORET), o};
    if(i >= 0 && foret.type[i] === "eau" && (arrosoir || canne)) return {w: FORET, i, eau: true, peche: !arrosoir};   // le ruisseau, la source
  }
  return null;
}
/* Dans la mine : le rocher juste devant */
function targetMine(){
  for(const dist of [.8, 1.3]){
    const q = devant(dist), t = mineTile(q.x, q.z);
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
  if(inMarais()) return targetMarais();
  if(currentPlace() && currentPlace().b.type === "trajet") return null;   // en route : rien à faire
  if(enBarque()){                                     // en barque (étape 1.13, morceau 2) : seulement pêcher, tout autour
    const canne = state.main ? !!tenu("canne") : outilPour("canne").ou === "case", [x, z] = frontTile(1.3);
    return canne ? {i: inb(x, z) ? idx(x, z) : -1, eau: true, peche: true} : null;
  }
  const own = [tileOf(player.position.x), tileOf(player.position.z)];
  for(const dist of [0, .8]){
    const [x, z] = dist ? frontTile(dist) : own;
    if(inb(x, z) && solAt(idx(x, z))) return {i: idx(x, z), x, z, sol: solAt(idx(x, z))};
  }
  /* Une graine, un coffre, un rocher ou une lumière en main : la case juste devant d'abord, si elle est libre */
  const [fx, fz] = frontTile(.8);
  if(aPoser(state.main) && inb(fx, fz) && !map.obj[idx(fx, fz)] && !occ.has(idx(fx, fz)))
    return {i: idx(fx, fz), x: fx, z: fz, o: null};
  const pelle = cibleTerrain();                       // la pelle en main : creuser, combler (étape 1.9)
  if(pelle) return pelle;
  const arrosoir = state.main && OUTILS[state.main] && OUTILS[state.main].eau;
  const canne = state.main ? !!tenu("canne") : outilPour("canne").ou === "case";   // la canne en main, ou dans une case (mains libres)
  for(const dist of [.8, 1.3]){
    const [x, z] = frontTile(dist);
    if(!inb(x, z)) continue;
    const i = idx(x, z);
    if(occ.has(i)) return facadeCible(i, x, z);        // un bâtiment : c'est son bouton à lui (ou une lumière de sa façade)
    if(map.obj[i]) return {w: ILE, i, x, z, o: map.obj[i]};
    if((arrosoir || canne) && eauLibre(i)) return {i, x, z, eau: true, peche: !arrosoir};   // le bord de l'eau : l'arrosoir, ou la canne
  }
  const [x, z] = frontTile(.8);
  if(aPoser(state.main) && inb(x, z)) return {i: idx(x, z), x, z, o: null};
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

/* Une action qui demande un outil (demande de Yo : seulement celui qu'on tient en main) : l'action si un outil assez solide
   de cette famille est en main ; sinon le prendre (dans une case) ou le mettre dans une case (dans le sac) ; sinon le
   message « il te faut … » */
function avecOutil(famille, force, action, manque){
  const o = outilPour(famille, force);
  if(o.ou === "main") return action;
  return prendreAction(o) || info(manque);
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
const hk = t => (t.w === MINE ? "m" : t.w === FORET ? "f" : t.w === GROTTE ? "g" : t.w === MARAIS ? "b" : "") + t.i;
const info = label => ({label, run: () => toast(label)});
function actionOf(t){
  if(t.sol) return {label: `✋ Ramasser : ${SOL[t.sol].nom.toLowerCase()}`, run: () => ramasser(t)};
  if(t.pelle) return actionTerrain(t);
  if(t.o === "coffre") return {label: "🗃️ Ouvrir le coffre", run: () => openCoffre(state.ile[t.i].id)};
  if(t.facade) return facadeAction(t);
  if(MEUBLES[t.o] && MEUBLES[t.o].dehors) return lumiereAction(t);
  if(t.peche) return avecOutil("canne", 0, {label: "🎣 Lancer", run: () => { if(tenu("canne")) lancer(); }}, "🎣 Il te faut une canne à pêche");
  if(t.eau){ const max = OUTILS[state.main].eau;
    return state.eau < max ? {label: `💧 Remplir l'arrosoir (${state.eau}/${max})`, run: remplir} : info(`💧 Arrosoir plein (${max}/${max})`); }
  const g = t.o && t.w === ILE ? growth(t.i) : 1, h = hits.get(hk(t));
  const tenue = state.main && OUTILS[state.main] && OUTILS[state.main].famille;   // la famille de l'outil en main
  if(t.galerie) return galerieAction(t.galerie);
  if(t.coeur) return coeurAction();
  if(t.o === "tresor") return {label: "🎁 Ouvrir le coffre au trésor", run: () => ouvrirTresor(t)};
  if(t.o === "rockOr") return avecOutil("pioche", 0, {label: `⛏️ Miner la veine d'or${h ? ` (${RECOLTE.rockOr.coups - h})` : ""}`, run: () => couper(t)}, IL_FAUT.pioche);
  if(t.o === "racines") return info("🕳️ La grotte, sous les racines du vieux chêne : avance dans l'ouverture pour y descendre");
  if(t.o === "grandChene" || t.o === "bloc") return info("👑 Le Grand Chêne millénaire : on ne l'abat pas. Il veille sur la forêt depuis mille ans");
  if(t.w === MARAIS && plante(t.o)) return planteAction(t);
  if(t.o === "chicot") return info("🪵 Un arbre mort, gris et noueux : le corbeau des brumes aime s'y poser, par brouillard");
  if(t.o === "puits") return info("🕳️ Le Puits aux Brumes, la grotte du Marais : avance dans l'ouverture pour y descendre. Emporte des torches");
  /* Les arbres de la forêt (dans la forêt, ou plantés sur l'île) : chacun son bois et sa graine ; le houx et le
     sureau se cueillent (baies, fleurs), et se coupent hache en main */
  if(ESSENCES.includes(t.o)){
    const R = RECOLTE[t.o], nom = R.nom.replace(/^(le |l')/, "");
    if(g < 1) return info(`🌱 Jeune ${nom} : adulte dans ${duree(growthLeft(t.i))}`);
    if(FRUITS[t.o] && tenue !== "hache"){
      const reste = t.w === FORET ? foretFruitsLeft(t.i) : t.w === MARAIS ? maraisCueilliLeft(t.i) : fruitsLeft(t.i), k = cueilletteDe(t.o);
      if(!k) return info(`🌿 ${nom[0].toUpperCase() + nom.slice(1)} : rien à cueillir en cette saison (la hache le coupe)`);
      if(reste > 0) return info(`🌿 ${objet(k).nom} : de retour dans ${duree(reste)}`);
      if(R.bocal) return avecOutil("bocal", 0, {label: `🫙 Recueillir : ${objet(k).nom.toLowerCase()}`, run: () => { if(tenu("bocal")) cueillirFruits(t, k); }},   // l'eau de brume du saule (étape 1.13)
        `🫙 ${objet(k).nom} : il te faut un bocal pour la recueillir (enclume de la Forge)`);
      return {label: `✋ Cueillir : ${objet(k).nom.toLowerCase()}`, run: () => cueillirFruits(t, k)};
    }
    return avecOutil("hache", R.force || 0, {label: `🪓 Couper ${R.nom}${h ? ` (${R.coups - h})` : ""}`, run: () => couper(t)},   // la hache selon l'essence
      R.force > 1 ? TROP_DUR.hache(R.force, R.nom) : IL_FAUT.hache);
  }
  if(t.o === "tree")
    return g < 1 ? info(`🌱 Jeune chêne : adulte dans ${duree(growthLeft(t.i))}`)
      : avecOutil("hache", 0, {label: `🪓 Couper le chêne${h ? ` (${RECOLTE.tree.coups - h})` : ""}`, run: () => couper(t)}, IL_FAUT.hache);
  if(t.o === "rock" || t.o === "rockCuivre")         // mains libres : on le prend ; sinon, on le mine
    return !state.main && !h ? {label: "✋ Prendre le rocher", run: () => prendre(t)}
      : avecOutil("pioche", 0, {label: `⛏️ Miner${h ? ` (${RECOLTE[t.o].coups - h})` : ""}`, run: () => couper(t)}, IL_FAUT.pioche);
  if(RECOLTE[t.o] && RECOLTE[t.o].outil === "pioche"){   // les roches des salles de la mine (étape 1.11)
    const R = RECOLTE[t.o];
    return avecOutil("pioche", R.force || 0, {label: `⛏️ Miner ${R.nom}${h ? ` (${R.coups - h})` : ""}`, run: () => couper(t)},
      R.force > 1 ? TROP_DUR.pioche(R.force) : IL_FAUT.pioche);
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
    if(tenue === "hache") return {label: `🪓 Couper le buisson${h ? ` (${RECOLTE.buisson.coups - h})` : ""}`, run: () => couper(t)};
    const b = baiesLeft(t.i);
    return b === 0 ? {label: "✋ Cueillir les baies", run: () => cueillirBaies(t)}
      : b < 0 ? avecOutil("arrosoir", 0, {label: `💧 Arroser${tenue === "arrosoir" ? ` (eau ${state.eau}/${OUTILS[state.main].eau})` : ""}`, run: () => arroser(t)}, "💧 Il te faut un arrosoir : fabrique-le à l'établi de la Scierie")
      : info(`🫐 Baies dans ${duree(b)}`);
  }
  if(!t.o && GRAINES[state.main]) return {label: "🌱 Planter", run: () => planter(t)};
  if(!t.o && POSABLES[state.main])
    return POSABLES[state.main].pose === "coffre" ? {label: "🗃️ Poser le coffre", run: () => poserCoffre(t.i)}
      : {label: "🪨 Poser le rocher", run: () => poser(t)};
  if(!t.o && poseDehors(state.main)){ const m = MEUBLES[state.main]; return {label: `${m.emoji} Poser ${m.une ? "la" : "le"} ${m.nom.toLowerCase()}`, run: () => poserDehors(t)}; }
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
  const k = state.main, pose = t && (t.pelle || !t.o && !t.sol && !t.eau && t.x !== undefined && aPoser(k));
  if(!pose){ if(surbrillance.visible) surbrillance.visible = false; return; }
  const ok = !(t.pelle ? terrainProbleme(t) : GRAINES[k] ? plantProblem(t, GRAINES[k].plante) : poseProblem(t.i));
  fond.color.setHex(ok ? 0xFFE27A : 0xE4776C); bord.color.setHex(ok ? 0xFFFFFF : 0xFFD1CC);
  surbrillance.position.set(centerOf(t.x), .03, centerOf(t.z));
  surbrillance.visible = true;
}
export function updateRecolte(dt, active){
  if(anim) animate(dt);
  const milieu = !currentPlace() ? "ile" : inForet() ? "foret" : inMarais() ? "marais" : null;   // les poissons, les insectes, les oiseaux, le gibier : dehors, dans la forêt, au Marais
  updatePeche(dt, active, milieu);
  updateInsectes(dt, active, milieu);
  updateOiseaux(dt, active, milieu);
  updateChasse(dt, active, milieu);                   // le gibier : seulement dans la forêt
  cur = active && !anim && !enPeche() && !attrapeEnCours() && !oiseauEnCours() && !tirEnCours() ? target() : null;
  showCase(cur);
  const bete = active && !anim && milieu && (insecteAction() || oiseauAction() || chasseAction());
  const entree = active && !anim && milieu === "ile" && entreeAction();   // devant l'entrée de la mine pas encore construite
  const torche = active && !anim && inGrotte() && torcheAction();   // la torche posée au sol, tout près (demande de Yo)
  const barque = active && !anim && milieu === "ile" && barqueAction();   // au bout du ponton, ou en barque (étape 1.13)
  const voyage = active && !anim && voyageAction();   // sur l'embarcadère du Marais : rentrer au village
  act = enPeche() ? pecheAction() : bete || entree || torche || barque || voyage || (cur && actionOf(cur));
  btn.classList.toggle("ferrer", !!(act && act.alerte));
  if(!act){ if(!btn.hidden) btn.hidden = true; return; }
  if(btn.textContent !== act.label) btn.textContent = act.label;
  if(btn.hidden) btn.hidden = false;
}
btn.addEventListener("click", () => {
  if(!act || anim) return;
  const avant = compteGestes();
  act.run();
  gesteAction(avant);                                   // à la première personne : à mains nues, la main se tend (mains.js)
});

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
  if(t.w === FORET) cueillirForet(t.i); else if(t.w === MARAIS) cueillirMarais(t.i); else setEtat(t.i, {cueilli: Date.now()});
  save();
  toast(`${objet(k).emoji} +${R.n} ${nomDe(k, R.n)}. De retour ici dans ${duree(R.retour)}`, 3000);
}
/* Les plantes du Marais brumeux (étape 1.13, morceau 4 ; Grand Carnet) : à leur saison, certaines la nuit ; cueillies,
   elles reviennent sur place (PLANTE_RETOUR) */
function planteAction(t){
  const p = PRODUITS[t.o], P = p.plante, nom = p.nom.toLowerCase(), elle = p.une ? "elle" : "il";
  if(!enSaisonPlante(p)) return info(`🌿 ${p.nom} : ${elle} se cueille ${quandPlante(p)}`);
  if(P.nuit && nuitIci() <= .5) return info(`🌙 ${p.nom} : ${t.o === "feuFollet" ? "il ne danse que la nuit" : `${elle} ne pousse que la nuit`}`);
  const r = maraisCueilliLeft(t.i);
  if(r > 0) return info(`🌿 ${p.nom} : de retour dans ${duree(r)}`);
  return planteDispo(t.i) ? {label: `✋ ${P.verbe || "Cueillir"} : ${nom}`, run: () => cueillirPlante(t)} : null;
}
function cueillirPlante(t){
  const k = t.o, p = PRODUITS[k];
  if(!planteDispo(t.i) || !sacOk(k, p.n)) return;
  sacAdd(k, p.n);
  cueillirMarais(t.i);
  if(k === "mandragore") try{ if(navigator.userActivation && navigator.userActivation.hasBeenActive && navigator.vibrate) navigator.vibrate([60, 40, 120]); }catch(_){}
  toast(k === "mandragore" ? "😱 « AAAAAAH ! » La mandragore crie quand on l'arrache… +1 mandragore, pour les potions puissantes"
    : `${p.emoji} +${p.n} ${nomDe(k, p.n)}. ${p.une ? "Elle" : "Il"} revient ici dans ${duree(maraisCueilliLeft(t.i))}`, 3200);
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
  const k = tenu("arrosoir");
  if(!k) return;
  if(state.eau <= 0){ toast(`🪣 Ton arrosoir est vide : remplis-le au bord de l'eau (mer ou étang)`, 3000); return; }
  state.eau--;
  const cases = [t.i];
  if(OUTILS[k].autour){                              // l'arrosoir en bronze : les buissons vides tout près, 3 au plus d'un coup
    for(let dz = -1; dz <= 1; dz++) for(let dx = -1; dx <= 1; dx++){
      if(!inb(t.x + dx, t.z + dz)) continue;
      const j = idx(t.x + dx, t.z + dz);
      if(cases.length < 3 && j !== t.i && map.obj[j] === "buisson" && growth(j) >= 1 && baiesLeft(j) < 0) cases.push(j);   // vide, pas encore arrosé
    }
  }
  for(const j of cases) setEtat(j, {arrose: Date.now()});
  renderBarre(); save();
  anim = {w: ILE, i: t.i, t: 0, kind: "shake"};
  toast(`💧 ${cases.length > 1 ? `${cases.length} buissons arrosés` : "Arrosé"} : les baies reviennent dans ${duree(RECOLTE.buisson.retour)}. Eau : ${state.eau}/${OUTILS[k].eau}`, 2800);
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
const IL_FAUT = {hache: "🪓 Il te faut une hache : fabrique-la à l'établi de la Scierie", pioche: "⛏️ Il te faut une pioche : fabrique-la à l'établi de la Scierie"};
const PIOCHE = {2: "une pioche en cuivre", 3: "une pioche en bronze"};
/* Trop dur pour l'outil qu'on a : une roche de la mine (étape 1.11), un bois dur ou un géant (la hache selon l'essence) */
const TROP_DUR = {
  pioche: f => `🪨 Roche trop dure : il te faut ${PIOCHE[f]}`,
  hache: (f, nom) => { const n = nom[0].toUpperCase() + nom.slice(1);
    return f >= 3 ? `🌳 ${n}, un géant millénaire : il te faut une hache en bronze` : `🪵 ${n}, un bois dur : il te faut une hache en cuivre`; }};

function couper(t){
  const R = RECOLTE[t.o], k = tenu(R.outil, R.force || 0);           // seulement l'outil en main (le bouton l'a demandé)
  if(!k) return;
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
  return avecOutil("pioche", COEUR_MINE.force, {label: `⛏️ Dégager le Cœur de la mine (${COEUR_MINE.coups - (state.coeurCoups || 0)})`, run: degagerCoeur},
    "💖 Le Cœur de la mine bat dans la roche : il te faut une pioche en bronze pour le dégager");
}
function degagerCoeur(){
  const k = tenu("pioche", COEUR_MINE.force);
  if(!k || !coeurEveille()) return;
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
  const c = GALERIES[g];
  return avecOutil("pioche", c.force, {label: `⛏️ Creuser la galerie (${coupsRestants(g)})`, run: () => creuserGalerie(g)},
    `🪨 Une roche très dure cache ${c.salle} : il te faut ${c.pioche}`);
}
function creuserGalerie(g){
  const c = GALERIES[g], k = tenu("pioche", c.force);
  if(!k) return;
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
  toast(`${FIN[o] || (o.startsWith("rock") ? "🪨 La roche s'est brisée" : o === "tree" ? "🌳 Le chêne est tombé" : "🌳 L'arbre est tombé")} : ${[n ? `+${n} ${nomDe(R.res, n)}` : "", graine ? `+1 ${nomDe(R.graine, 1)} ${ou}` : "", R.graine && !graine ? "pas de graine cette fois" : ""].filter(Boolean).join(", ")}`, 3600);
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

/* ----- Les lumières posées dehors (demande de Yo, 11 octobre 2026 ; lumieres.js) : torchère, chandelle, lanterne,
   feu de camp. En main, « Poser » devant une case libre ; posée, y mettre une torche (une torchère), ou la reprendre
   (avec sa torche) ----- */
const aPoser = k => !!(GRAINES[k] || POSABLES[k] || poseDehors(k));
const leNom = m => `${m.une ? "la" : "le"} ${m.nom.toLowerCase()}`;
function poserDehors(t){
  const k = state.main, m = MEUBLES[k], why = poseProblem(t.i);
  if(why){ toast(why); return; }
  if(!sacTake(k, 1)) return;
  setObj(t.i, k);
  syncBarre(); save();
  toast(`${m.emoji} ${m.nom} posé${m.une ? "e" : ""}${m.support ? " : approche-toi avec une torche pour l'allumer, elle ne s'éteindra plus jamais" : ""}`, 3200);
}
function lumiereAction(t){
  const m = MEUBLES[t.o], c = state.ile[t.i] || {};
  if(m.support && !c.torche && owned("torche") > 0)
    return {label: "🔥 Poser une torche sur la torchère", run: () => poserTorche(c, () => setEtat(t.i, {torche: true}))};
  return {label: `✋ Reprendre ${leNom(m)}${c.torche ? " et sa torche" : ""}`, run: () => reprendreLumiere(t)};
}
/* La façade de devant d'un bâtiment (batiments.js) : on s'y tient juste devant, face à elle, une colonne à la fois ;
   une torchère ou une lanterne murale en main s'y accroche ; accrochée, on y pose une torche, ou on la décroche */
function facadeCible(i, x, z){
  const b = state.buildings.find(v => v.id === occ.get(i)), s = b && sizeOf(b.type);
  if(!b || b.rot || B[b.type].fixe || z !== b.z + s - 1 || tileOf(player.position.z) !== b.z + s || tileOf(player.position.x) !== x) return null;
  const col = x - b.x, f = (b.facade || []).find(v => v.col === col);
  return f || (MEUBLES[state.main] && MEUBLES[state.main].facade) ? {facade: true, b, col, f} : null;
}
function facadeAction(t){
  const {b, col, f} = t;
  if(!f && col === colPorte(b.type)) return info("🚪 Pas sur la porte : accroche-la à côté");
  if(f){
    const m = MEUBLES[f.type];
    if(m.support && !f.torche && owned("torche") > 0)
      return {label: "🔥 Poser une torche sur la torchère", run: () => poserTorche(f, () => placeMesh(b))};
    return {label: `✋ Décrocher ${leNom(m)}${f.torche ? " et sa torche" : ""}`, run: () => decrocher(t)};
  }
  return {label: `🪝 Accrocher ${leNom(MEUBLES[state.main])} au mur`, run: () => accrocher(t)};
}
function accrocher(t){
  const k = state.main, m = MEUBLES[k];
  if(!m || !m.facade || (t.b.facade || []).some(v => v.col === t.col) || !sacTake(k, 1)) return;
  (t.b.facade || (t.b.facade = [])).push({type: k, col: t.col});
  placeMesh(t.b); syncBarre(); save();
  toast(`${m.emoji} ${m.nom} accrochée à la façade${m.support ? " : approche-toi avec une torche pour l'allumer" : " : elle s'allumera seule à la nuit tombée"}`, 3400);
}
function decrocher(t){
  const f = t.f, m = MEUBLES[f.type], gains = {[f.type]: 1, ...(f.torche ? {torche: 1} : {})};
  if(!tientSurSoi(gains)){ toast("🎒 Ton sac est plein : fais de la place pour la décrocher", 3000); return; }
  for(const [k, n] of Object.entries(gains)) sacAdd(k, n);
  t.b.facade.splice(t.b.facade.indexOf(f), 1);
  placeMesh(t.b); syncBarre(); save();
  toast(`${m.emoji} ${m.nom} dans ton sac${f.torche ? ", avec sa torche" : ""}`, 2400);
}
function reprendreLumiere(t){
  const m = MEUBLES[t.o], c = state.ile[t.i] || {}, gains = {[t.o]: 1, ...(c.torche ? {torche: 1} : {})};
  if(!tientSurSoi(gains)){ toast("🎒 Ton sac est plein : fais de la place pour la reprendre", 3000); return; }
  for(const [k, n] of Object.entries(gains)) sacAdd(k, n);
  setObj(t.i, null);
  syncBarre(); save();
  toast(`${m.emoji} ${m.nom} dans ton sac${c.torche ? ", avec sa torche" : ""}`, 2400);
}

/* ----- Planter ----- */
const DEVIENT = {tree: "un chêne adulte", herbe: "des herbes hautes", buisson: "un buisson de baies", thym: "du thym prêt à cueillir"};
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
