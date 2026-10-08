/* ================= Terraformer son île (étape 1.9) =================
   Plan de production : « creuser, combler, tracer des chemins, planter ». Grand Carnet, la pelle : « creuser,
   combler, déterrer, tracer des chemins » (en bois à l'établi, puis en cuivre à l'enclume, qui creuse plus vite).
   Morceau 1 : la pelle en main, face à une case d'herbe libre : « 🪏 Creuser » (OUTILS[…].coups coups : la terre se
   retourne, puis la case devient de l'eau douce, comme l'étang : ses poissons y viennent) ; face à l'eau douce
   (l'étang, l'eau creusée) : « 🪏 Combler » (la case redevient de la terre). Décidé avec Yo : la mer ne se comble pas,
   l'île garde sa forme. On ne creuse jamais devant une porte, sous un bâtiment ou un coffre, devant le ponton ou le
   pont de la forêt, ni de quoi s'enfermer : il faut toujours pouvoir rejoindre le pont de la forêt. La case visée
   est en surbrillance (jaune si c'est possible, rouge sinon : recolte.js).
   Morceau 2, les chemins (CHEMINS dans donnees.js, modèles dans monde/chemins.js) : la pelle en main (chemin de
   terre, gratuit), ou des planches, des blocs (pavés) ou du gravier en main : « 👣 Tracer » ; tant qu'on ne l'arrête
   pas, chaque case de terre libre où l'on marche devient chemin (une pièce par case, prise dans le sac). La pelle
   en main, face à un chemin : « 🪏 Enlever le chemin » (la pièce revient dans le sac). Rien ne pousse sur un chemin
   (recolte.js) ; sous un bâtiment, il est caché. */
import { $ } from "./outils.js";
import { OUTILS, CHEMINS, CHEMIN_DE, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { doorTile, sacCount, sacTake, sacAdd, sacPlace } from "./regles.js";
import { syncBarre } from "./barre.js";
import { dessinerChemins } from "./monde/chemins.js";
import { map, idx, inb, N, tileOf, comblable, setTerrain, terreDe, entamer } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { solAt } from "./monde/sol.js";
import { passageCases, entrees } from "./monde/ponton.js";
import { player, frontTile, pencheMain } from "./monde/personnage.js";
import { toast } from "./interface.js";

const pelleTenue = () => !!(state.main && OUTILS[state.main] && OUTILS[state.main].famille === "pelle");
/* Ce que vise la pelle : la case juste devant ; null si ce n'est ni de la terre libre ni de l'eau */
export function cibleTerrain(){
  if(!pelleTenue()) return null;
  const [x, z] = frontTile(.8);
  if(!inb(x, z)) return null;
  const i = idx(x, z);
  if(state.chemins[i] && !occ.has(i)) return {i, x, z, pelle: "enlever"};
  if(map.type[i] === "water") return passageCases.has(i) ? null : {i, x, z, pelle: "combler"};
  if(!map.obj[i] && !occ.has(i) && !solAt(i)) return {i, x, z, pelle: "creuser"};
  return null;
}
/* Peut-on encore rejoindre le pont de la forêt (ou le ponton) si la case eau devient de l'eau (-1 : rien ne change) ? */
const marche = (j, eau) => j !== eau && (map.type[j] !== "water" || passageCases.has(j)) && (!map.obj[j] || map.obj[j] === "herbe" || map.obj[j] === "thym") && !occ.has(j);
function relie(eau){
  if(!entrees.size) return true;
  const d = idx(tileOf(player.position.x), tileOf(player.position.z)), vu = new Uint8Array(N * N), file = [d];
  vu[d] = 1;
  while(file.length){
    const j = file.pop();
    if(entrees.has(j)) return true;
    const x = j % N, z = (j - x) / N;
    for(const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const k = idx(x + a, z + b);
      if(inb(x + a, z + b) && !vu[k] && marche(k, eau)){ vu[k] = 1; file.push(k); }
    }
  }
  return false;
}
/* Peut-on creuser ou combler ici ? (null si oui, sinon la raison) ; gardé une seconde pour la même case (la
   surbrillance le demande à chaque image) */
let memo = {cle: "", t: 0, r: null};
export function terrainProbleme(t){
  const cle = t.pelle + t.i + ":" + tileOf(player.position.x) + "," + tileOf(player.position.z);
  if(memo.cle === cle && performance.now() - memo.t < 1000) return memo.r;
  memo = {cle, t: performance.now(), r: probleme(t)};
  return memo.r;
}
function probleme(t){
  if(t.pelle === "enlever") return null;
  if(t.pelle === "combler") return comblable(t.i) ? null : "🌊 La mer ne se comble pas : l'île garde sa forme";
  const i = t.i;
  if(map.type[i] !== "grass") return "🏖️ Le sable s'écroule : on ne creuse que dans l'herbe";
  if(state.buildings.some(b => { const [x, z] = doorTile(b.type, b.x, b.z); return x === t.x && z === t.z; })) return "La case devant une porte reste libre";
  if(entrees.has(i)) return "Le passage vers le ponton ou le pont reste libre";
  if(tileOf(player.position.x) === t.x && tileOf(player.position.z) === t.z) return "Recule d'un pas pour creuser devant toi";
  if(!relie(i) && relie(-1)) return "Tu ne pourrais plus revenir : laisse-toi un passage";
  return null;
}

/* ----- Le bouton d'action (recolte.js) ----- */
const coups = new Map();        // la case qu'on est en train de creuser → coups de pelle déjà donnés
export function actionTerrain(t){
  if(t.pelle === "enlever") return {label: `🪏 Enlever le chemin de ${CHEMINS[state.chemins[t.i]].nom}`, run: () => enlever(t)};
  if(t.pelle === "combler") return {label: "🪏 Combler", run: () => combler(t)};
  const n = coups.get(t.i) || 0, reste = (OUTILS[state.main].coups || 1) - n;
  return {label: `🪏 Creuser${n ? ` (${reste})` : ""}`, run: () => creuser(t)};
}
function geste(){ pencheMain(1.3); setTimeout(() => pencheMain(), 220); }
function creuser(t){
  const pourquoi = terrainProbleme(t);
  if(pourquoi){ toast(pourquoi, 2600); return; }
  for(const [j] of coups) if(j !== t.i){ entamer(j, false); coups.delete(j); }   // une seule case entamée à la fois
  const n = (coups.get(t.i) || 0) + 1;
  geste();
  if(n < (OUTILS[state.main].coups || 1)){ coups.set(t.i, n); entamer(t.i, true); return; }   // la terre se retourne
  coups.delete(t.i);
  setTerrain(t.i, "water"); memo.cle = "";
  save();
}
function combler(t){
  const pourquoi = terrainProbleme(t);
  if(pourquoi){ toast(pourquoi, 2600); return; }
  geste();
  setTerrain(t.i, terreDe(t.i)); memo.cle = "";
  save();
}

/* ----- Les chemins (morceau 2) ----- */
/* Enlever un chemin à la pelle : la pièce revient dans le sac (s'il y a la place) */
function enlever(t){
  const s = state.chemins[t.i], k = CHEMINS[s] && CHEMINS[s].avec;
  geste();
  delete state.chemins[t.i];
  if(k && sacPlace(k) > 0){ sacAdd(k, 1); syncBarre(); }
  dessinerChemins(); memo.cle = ""; save();
}
/* Le chemin que trace ce qu'on tient en main : la pelle, la terre ; des planches, des blocs, du gravier */
function sorteTenue(){
  const k = state.main;
  if(!k) return null;
  if(OUTILS[k] && OUTILS[k].famille === "pelle") return "terre";
  return CHEMIN_DE[k] || null;
}
/* Une case peut-elle devenir chemin ? De la terre (herbe ou sable), rien dessus, pas sous un bâtiment */
const cheminPossible = i => i >= 0 && map.type[i] !== "water" && !map.obj[i] && !occ.has(i);
const bTracer = $("#btn-tracer");
let trace = null;          // {sorte, n : cases posées, derniere : la dernière case regardée}
function arreter(msg){
  if(!trace) return;
  if(msg || trace.n) toast(msg || `👣 Chemin de ${CHEMINS[trace.sorte].nom} : ${trace.n} case${trace.n > 1 ? "s" : ""}`, 2400);
  trace = null; save();
}
function tracer(){
  if(trace){ arreter(); return; }
  const sorte = sorteTenue();
  if(!sorte) return;
  trace = {sorte, n: 0, derniere: -1};
  toast(`👣 Marche : chaque case devient un chemin de ${CHEMINS[sorte].nom}. Touche « Arrêter » pour finir`, 3000);
}
bTracer.addEventListener("click", tracer);
/* La case où l'on marche devient chemin */
function poser(i){
  if(!cheminPossible(i) || state.chemins[i] === trace.sorte) return;
  const ancien = state.chemins[i], k = CHEMINS[trace.sorte].avec;
  if(k){
    if(!sacCount(k)){ arreter(`👣 Plus de ${objet(k).pluriel.toLowerCase()} : le chemin s'arrête ici`); return; }
    sacTake(k, 1);
  }
  const rend = ancien && CHEMINS[ancien].avec;           // on change la sorte d'une case : l'ancienne pièce revient
  if(rend && sacPlace(rend) > 0) sacAdd(rend, 1);
  state.chemins[i] = trace.sorte; trace.n++;
  syncBarre(); dessinerChemins();
}
/* À chaque image (main.js) ; actif : sur l'île, rien d'ouvert, pas de pose de bâtiment ni de décoration */
let signature = "", verifie = 0;
export function updateChemins(actif){
  const sorte = actif ? sorteTenue() : null;
  if(trace && sorte !== trace.sorte) arreter();
  bTracer.hidden = !sorte;
  if(sorte){
    const txt = trace ? `⏹️ Arrêter le chemin (${trace.n})` : `👣 Tracer : ${CHEMINS[sorte].nom}`;
    if(bTracer.textContent !== txt) bTracer.textContent = txt;
    bTracer.classList.toggle("on", !!trace);
  }
  /* un bâtiment posé, déplacé ou amélioré : les chemins dessous se cachent (une fois par seconde, on regarde) */
  if(performance.now() - verifie > 1000){
    verifie = performance.now();
    const sig = state.buildings.map(b => `${b.id}:${b.x},${b.z}`).join(";");
    if(sig !== signature){ signature = sig; dessinerChemins(); }
  }
  if(!trace) return;
  const i = idx(tileOf(player.position.x), tileOf(player.position.z));
  if(i === trace.derniere || !inb(tileOf(player.position.x), tileOf(player.position.z))) return;
  trace.derniere = i;
  poser(i);
}
/* Pour la vérification automatique */
export const traceEnCours = () => trace && {...trace};
