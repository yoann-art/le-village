/* ================= La torche (étape 1.8, morceau 1) =================
   Bible : « obscurité : la torche s'use et se refabrique à volonté, puis s'améliore en lanterne. Ce n'est pas une
   jauge qui oblige à s'arrêter. » Grand Carnet : « Torche, puis lanterne : éclairer les grottes ; la torche s'use ;
   établi pour la torche, enclume pour la lanterne. »
   Dans la grotte, une torche du sac (ou d'une case rapide) s'allume toute seule et éclaire loin autour du
   personnage, qui la tient dans la main gauche ; elle brûle OUTILS.torche.duree secondes (state.torche : ce qui
   lui reste), puis la suivante prend le relais. Sans torche, on voit juste un peu autour de soi : on n'est jamais
   bloqué. Elle ne brûle que dans la grotte.
   Bug de Yo corrigé (v1.9.4) : la torche allumée reste dans le sac (ou sa case rapide) jusqu'à ce qu'elle soit toute
   brûlée ; state.torche est ce qui reste à brûler à la première des torches qu'on porte. Sans torche sur soi (toutes
   rangées dans un coffre), rien ne brûle, même une torche entamée : elle reprendra où elle en était.
   Demande de Yo (11 octobre 2026) : la torche se tient dans la main gauche, en même temps que l'outil ou l'arme ; elle
   ne s'allume que si elle est dans une case rapide (dans le sac, elle attend). L'arc se tient à deux mains : le prendre
   pose la torche allumée au sol, à ses pieds ; posée, elle éclaire autour d'elle et continue de brûler (`sol`) ;
   « 🔥 Reprendre la torche » tout près (`torcheAction`, appelé par recolte.js). Quitter le palier la laisse derrière. */
import { OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacAdd, sacPlace, sacCount } from "./regles.js";
import { currentPlace } from "./lieux.js";
import { player, tenirTorche } from "./monde/personnage.js";
import { eclaire, torcheAuSol, visiteEnCours } from "./monde/grotte.js";
import { toast } from "./interface.js";
import { renderBarre, syncBarre, dansCase, deuxMains } from "./barre.js";

let t = 0, dedans = false, sans = false;
let sol = null;            // la torche posée au sol : {x, z, reste, visite}
const minutes = s => `${Math.ceil(s / 60)} min`;
/* Les torches de la case rapide (seules celles-là s'allument) */
const enCase = () => { const c = dansCase("torche"); return c >= 0 ? state.barre[c].n : 0; };
function oterUne(){                                      // une torche quitte sa case
  const c = dansCase("torche");
  if(c < 0) return;
  state.barre[c].n--; syncBarre();
}
export function updateTorche(dt){
  const p = currentPlace(), ici = !!p && p.b.type === "grotte";
  if(sol && (!ici || visiteEnCours() !== sol.visite)){    // on a quitté le palier : la torche posée reste derrière
    sol = null; torcheAuSol(null);
    toast("🔥 Ta torche posée est restée derrière toi", 2600);
  }
  if(!ici){ if(dedans){ dedans = false; enFeu = false; tenirTorche(false); save(); } return; }
  dedans = true; t += dt;
  /* l'arc se tient à deux mains : la torche allumée se pose au sol, à ses pieds */
  if(deuxMains() && state.torche > 0 && enCase() > 0 && !sol){
    const q = player.position;
    sol = {x: q.x, z: q.z, reste: state.torche, visite: visiteEnCours()};
    oterUne(); state.torche = 0; save();
    toast("🔥 L'arc se tient à deux mains : tu poses ta torche au sol. Elle éclaire autour d'elle et continue de brûler", 4200);
  }
  /* la torche posée brûle */
  if(sol){
    sol.reste -= dt;
    if(sol.reste <= 0){ sol = null; torcheAuSol(null); toast("🔥 La torche posée s'est éteinte", 2400); }
    else torcheAuSol(sol.x, sol.z, t);
  }
  /* une torche neuve s'allume dans la main gauche (on la garde dans sa case tant qu'elle brûle) */
  const n = deuxMains() ? 0 : enCase();
  if(n > 0 && !(state.torche > 0)){
    state.torche = OUTILS.torche.duree; sans = false;
    renderBarre(); save();
    toast(`🔥 Tu allumes une torche : elle brûle ${minutes(state.torche)}${n > 1 ? ` (il t'en reste ${n - 1})` : ""}`, 2600);
  }
  const allumee = n > 0 && state.torche > 0;              // sans torche dans une case, rien ne brûle dans la main
  if(allumee){
    state.torche = Math.max(0, state.torche - dt);
    if(state.torche === 0){                               // toute brûlée : elle quitte sa case
      oterUne(); save();
      if(!enCase()) toast("🔥 Ta torche s'est éteinte, et tu n'en as plus dans tes cases : il fait sombre. Fabrique des torches à l'établi de la Scierie", 4200);
    }
    if(Math.floor(t) !== Math.floor(t - dt) && Math.floor(t) % 5 === 0) renderBarre();   // la jauge de sa case baisse doucement
  } else if(!sans && !sol && !deuxMains()){
    sans = true;
    toast(sacCount("torche") ? "🔥 Tes torches sont dans le sac : mets-en une dans une case rapide pour l'allumer" : "🕯️ Pas de torche : tu ne vois qu'un peu autour de toi. Les torches se fabriquent à l'établi de la Scierie", 4200);
  }
  tenirTorche(allumee, t);
  eclaire(player.position.x, player.position.z, allumee, t);
  enFeu = allumee || !!sol;
}
/* Reprendre la torche posée (recolte.js : le bouton d'action, tout près, avant le reste) */
export function torcheAction(){
  if(!sol) return null;
  const q = player.position;
  if(Math.hypot(q.x - sol.x, q.z - sol.z) > 1.1) return null;
  if(deuxMains()) return {label: "🔥 Reprendre la torche (lâche d'abord ton arc)", run: () => toast("🔥 L'arc se tient à deux mains : prends une autre arme ou un outil, puis reprends ta torche", 3200)};
  return {label: "🔥 Reprendre la torche", run: reprendre};
}
function reprendre(){
  if(!sol) return;
  const c = dansCase("torche"), libre = state.barre.indexOf(null);
  if(c >= 0) state.barre[c].n++;                          // dans sa case
  else if(libre >= 0) state.barre[libre] = {k: "torche", n: 1};
  else if(sacPlace("torche") > 0) sacAdd("torche", 1);
  else { toast("🎒 Plus de place : libère une case rapide pour reprendre ta torche", 3000); return; }
  if(!(state.torche > 0)) state.torche = sol.reste;       // elle reprend où elle en était
  sol = null; torcheAuSol(null);
  renderBarre(); save();
  toast(c >= 0 || libre >= 0 ? "🔥 Tu reprends ta torche, dans la main gauche" : "🔥 Ta torche est dans le sac : mets-la dans une case rapide pour l'allumer", 2400);
}
/* Pour la vérification automatique : une torche brûle-t-elle (en main ou au sol) ? Est-elle au sol ? */
let enFeu = false;
export const torcheAllumee = () => enFeu;
export const torcheSol = () => !!sol;
