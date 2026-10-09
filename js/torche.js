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
   rangées dans un coffre), rien ne brûle, même une torche entamée : elle reprendra où elle en était. */
import { OUTILS } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { sacCount, sacTake } from "./regles.js";
import { currentPlace } from "./lieux.js";
import { player, tenirTorche } from "./monde/personnage.js";
import { eclaire } from "./monde/grotte.js";
import { toast } from "./interface.js";
import { renderBarre, syncBarre } from "./barre.js";

let t = 0, dedans = false, sans = false;
const minutes = s => `${Math.ceil(s / 60)} min`;
export function updateTorche(dt){
  const p = currentPlace(), ici = !!p && p.b.type === "grotte";
  if(!ici){ if(dedans){ dedans = false; enFeu = false; tenirTorche(false); save(); } return; }
  dedans = true; t += dt;
  /* une torche neuve s'allume (on la garde dans le sac tant qu'elle brûle) */
  const n = sacCount("torche");
  if(n > 0 && !(state.torche > 0)){
    state.torche = OUTILS.torche.duree; sans = false;
    renderBarre(); save();
    toast(`🔥 Tu allumes une torche : elle brûle ${minutes(state.torche)}${n > 1 ? ` (il t'en reste ${n - 1})` : ""}`, 2600);
  }
  const allumee = n > 0 && state.torche > 0;              // sans torche sur soi, rien ne brûle
  if(allumee){
    state.torche = Math.max(0, state.torche - dt);
    if(state.torche === 0){                               // toute brûlée : elle quitte le sac
      sacTake("torche", 1); syncBarre(); save();
      if(!sacCount("torche")) toast("🔥 Ta torche s'est éteinte, et tu n'en as plus : il fait sombre. Fabrique des torches à l'établi de la Scierie", 4200);
    }
    if(Math.floor(t) !== Math.floor(t - dt) && Math.floor(t) % 5 === 0) renderBarre();   // la jauge de sa case baisse doucement
  } else if(!sans){ sans = true; toast("🕯️ Pas de torche : tu ne vois qu'un peu autour de toi. Les torches se fabriquent à l'établi de la Scierie", 4200); }
  tenirTorche(allumee, t);
  eclaire(player.position.x, player.position.z, allumee, t);
  enFeu = allumee;
}
/* Pour la vérification automatique : une torche brûle-t-elle ? */
let enFeu = false;
export const torcheAllumee = () => enFeu;
