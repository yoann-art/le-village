/* ================= La nature qui se ressème =================
   Décidé avec Yo le 18 octobre 2026 : le thym et les fleurs de l'île disparaissent quand on les cueille (recolte.js) ; pour
   que l'île reste vivante sans jamais être envahie, la nature se ressème doucement, comme la vraie (et comme les fleurs
   arrosées d'Animal Crossing). Une fois par jour, quand la date change (state.semisJour ; jeu fermé, jusqu'à SEMIS.jours
   jours rattrapés) :
   - une plante sauvage adulte (thym, fleur) a SEMIS.sauvage de chances de semer une voisine de sa sorte, tant que l'île
     n'en a pas plus qu'au départ (FLORE_ILE) : la nature se refait, sans envahir ; la nouvelle est sauvage elle aussi ;
   - une plante arrosée depuis le dernier passage (sauvage ou plantée ; c.arrose, recolte.js) a SEMIS.arrose de chances :
     la nouvelle fait partie du jardin du joueur (elle ne s'étend plus seule, seulement arrosée à son tour) ;
   - la voisine pousse sur une case libre juste à côté (comme une graine plantée : herbe libre, pas un chemin, une porte,
     ce qui est par terre, le passage du ponton ou du pont), jamais là où SEMIS.voisins petites plantes se serrent déjà
     dans un rayon de 2 cases ; elle pousse avec l'horloge, comme une graine qu'on plante. */
import { map, idx, inb, N, growth, setObj, setEtat } from "./ile.js";
import { occ } from "./batiments.js";
import { solAt } from "./sol.js";
import { entrees } from "./ponton.js";
import { state, save } from "../sauvegarde.js";
import { doorTile } from "../regles.js";
import { FLEURS, FLORE_ILE, SEMIS } from "../donnees.js";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const joursEntre = (a, b) => { const [x, y] = [a, b].map(s => { const [an, m, j] = s.split("-").map(Number); return Date.UTC(an, m - 1, j); }); return Math.round((y - x) / 864e5); };
const PETITES = o => o === "thym" || o === "herbe" || o === "buisson" || !!FLEURS[o];
const SEME = o => o === "thym" || !!FLEURS[o];
/* combien l'île en garde à l'état sauvage, au plus */
const limite = o => o === "thym" ? FLORE_ILE.thym : FLEURS[o].rarete === "commun" ? FLORE_ILE.fleurCommune : FLORE_ILE.fleurPeuCommune;
/* sauvage : posée par la nature au début (aucun état) ou ressemée seule ; sinon plantée par le joueur */
const sauvage = i => { const c = state.ile[i]; return !c || !c.plante || !!c.sauvage; };
const portes = () => new Set(state.buildings.map(b => { const [x, z] = doorTile(b.type, b.x, b.z, b.rot); return inb(x, z) ? idx(x, z) : -1; }));

function caseLibre(i, bloque){
  return map.type[i] === "grass" && !map.obj[i] && !occ.has(i) && !solAt(i) && !state.chemins[i] && !entrees.has(i) && !bloque.has(i);
}
function serre(x, z){
  let n = 0;
  for(let dz = -2; dz <= 2; dz++) for(let dx = -2; dx <= 2; dx++) if(inb(x + dx, z + dz) && PETITES(map.obj[idx(x + dx, z + dz)])) n++;
  return n >= SEMIS.voisins;
}
/* un jour : chaque plante tente sa chance ; arrosees : celles arrosées depuis le dernier passage (seulement le premier
   jour rattrapé) ; rend combien de plantes sont nées */
function unJour(depuis, arrosees){
  const bloque = portes(), compte = {};
  map.obj.forEach((o, i) => { if(SEME(o) && sauvage(i)) compte[o] = (compte[o] || 0) + 1; });
  const parents = [];
  map.obj.forEach((o, i) => { if(SEME(o) && growth(i) >= 1) parents.push(i); });
  let nees = 0;
  for(const i of parents){
    const o = map.obj[i], c = state.ile[i], arrose = arrosees && c && c.arrose > depuis, seule = sauvage(i);
    if(!arrose && !(seule && (compte[o] || 0) < limite(o))) continue;
    if(Math.random() >= (arrose ? SEMIS.arrose : SEMIS.sauvage)) continue;
    const x = i % N, z = (i - x) / N, places = [];
    for(let dz = -1; dz <= 1; dz++) for(let dx = -1; dx <= 1; dx++){
      const j = idx(x + dx, z + dz);
      if((dx || dz) && inb(x + dx, z + dz) && caseLibre(j, bloque) && !serre(x + dx, z + dz)) places.push(j);
    }
    if(!places.length) continue;
    const j = places[Math.floor(Math.random() * places.length)];
    setObj(j, o, Date.now());
    if(!arrose){ setEtat(j, {sauvage: 1}); compte[o] = (compte[o] || 0) + 1; }
    nees++;
  }
  return nees;
}
/* une fois par jour, quand la date change ; la toute première fois, le compte part d'aujourd'hui */
export function updateSemis(){
  const auj = today();
  if(!state.semisJour){ state.semisJour = auj; state.semisT = Date.now(); save(); return 0; }
  if(state.semisJour === auj) return 0;
  const n = Math.max(1, Math.min(SEMIS.jours, joursEntre(state.semisJour, auj)));
  let nees = 0;
  for(let k = 0; k < n; k++) nees += unJour(state.semisT || 0, k === 0);
  state.semisJour = auj; state.semisT = Date.now(); save();
  return nees;
}
/* pour la vérification : un passage tout de suite, comme si la date venait de changer */
export function ressemerMaintenant(){ const d = new Date(Date.now() - 864e5); state.semisJour = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; return updateSemis(); }
updateSemis();
setInterval(updateSemis, 30000);
