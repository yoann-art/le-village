/* ================= La torche (étape 1.8, morceau 1) =================
   Bible : « obscurité : la torche s'use et se refabrique à volonté, puis s'améliore en lanterne. Ce n'est pas une
   jauge qui oblige à s'arrêter. » Grand Carnet : « Torche, puis lanterne : éclairer les grottes ; la torche s'use ;
   établi pour la torche, enclume pour la lanterne. »
   Dans la grotte, une torche du sac (ou d'une case rapide) s'allume toute seule et éclaire loin autour du
   personnage, qui la tient dans la main gauche ; elle brûle OUTILS.torche.duree secondes (state.torche : ce qui
   lui reste), puis la suivante prend le relais. Sans torche, on voit juste un peu autour de soi : on n'est jamais
   bloqué. Elle ne brûle que dans la grotte. */
import { OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount, sacTake } from "./regles.js";
import { currentPlace } from "./lieux.js";
import { player, tenirTorche } from "./monde/personnage.js";
import { eclaire } from "./monde/grotte.js";
import { toast } from "./interface.js";
import { renderBarre } from "./barre.js";

let t = 0, dedans = false, sans = false;
const minutes = s => `${Math.ceil(s / 60)} min`;
export function updateTorche(dt){
  const p = currentPlace(), ici = !!p && p.b.type === "grotte";
  if(!ici){ if(dedans){ dedans = false; tenirTorche(false); save(); } return; }
  dedans = true; t += dt;
  /* plus de flamme : la torche suivante s'allume */
  if(!(state.torche > 0) && sacCount("torche") > 0){
    sacTake("torche", 1); state.torche = OUTILS.torche.duree; sans = false;
    renderBarre(); save();
    toast(`🔥 Tu allumes une torche : elle brûle ${minutes(state.torche)}${sacCount("torche") ? ` (il t'en reste ${sacCount("torche")})` : ""}`, 2600);
  }
  const allumee = state.torche > 0;
  if(allumee){
    state.torche = Math.max(0, state.torche - dt);
    if(state.torche === 0){ save(); if(!sacCount("torche")) toast("🔥 Ta torche s'est éteinte, et tu n'en as plus : il fait sombre. Fabrique des torches à l'établi de la Scierie", 4200); }
    if(Math.floor(t) !== Math.floor(t - dt) && Math.floor(t) % 5 === 0) renderBarre();   // la jauge de sa case baisse doucement
  } else if(!sans){ sans = true; toast("🕯️ Pas de torche : tu ne vois qu'un peu autour de toi. Les torches se fabriquent à l'établi de la Scierie", 4200); }
  tenirTorche(allumee, t);
  eclaire(player.position.x, player.position.z, allumee, t);
}
