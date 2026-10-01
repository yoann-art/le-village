/* ================= Récolter et planter sur l'île =================
   Devant un arbre adulte, le bouton « 🪓 Couper » : la hache est prise en main toute seule si elle est
   dans le sac ; chaque coup donne du bois (plus avec un outil plus fort, plus avec la Scierie), et au
   dernier coup l'arbre tombe et donne une graine. Devant un jeune arbre, le bouton dit quand il sera adulte.
   Une graine en main : « 🌱 Planter » sur la case d'herbe libre devant soi ; elle pousse avec l'horloge
   du téléphone (pousse, jeune plant, adulte). Les arbres ne sont jamais collés.
   Au sol, des morceaux de bois et des petits cailloux : « ✋ Ramasser », à la main (voir monde/sol.js). */
import { $ } from "./outils.js";
import { RES, OUTILS, GRAINES, RECOLTE, SOL, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { addOwned, sacAdd, sacTake, gain, doorTile } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, growthLeft, setObj, objMesh } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { solAt, pickUp } from "./monde/sol.js";
import { player, frontTile } from "./monde/personnage.js";
import { toast, renderHUD } from "./interface.js";
import { hold, barreAuto, syncBarre } from "./barre.js";

const btn = $("#btn-act");
const duree = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h} h${m ? " " + String(m).padStart(2, "0") : ""}` : `${Math.max(1, Math.ceil(s / 60))} min`; };

/* Ce qu'il y a devant le personnage : un objet de l'île, ou la case libre juste devant */
function target(){
  for(const dist of [0, .8]){                         // ce qui est par terre, à ses pieds ou juste devant
    const [x, z] = dist ? frontTile(dist) : [tileOf(player.position.x), tileOf(player.position.z)];
    if(inb(x, z) && solAt(idx(x, z))) return {i: idx(x, z), x, z, sol: solAt(idx(x, z))};
  }
  for(const dist of [.8, 1.3]){
    const [x, z] = frontTile(dist);
    if(!inb(x, z)) continue;
    const i = idx(x, z);
    if(occ.has(i)) return null;                       // un bâtiment : c'est son bouton à lui
    if(map.obj[i]) return {i, x, z, o: map.obj[i]};
  }
  const [x, z] = frontTile(.8);
  return inb(x, z) ? {i: idx(x, z), x, z, o: null} : null;
}

/* Peut-on planter ici ? (null si oui, sinon la raison) */
const NEAR = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
function plantProblem(t, plante){
  const i = t.i;
  if(map.type[i] !== "grass") return "Ça ne pousse que sur l'herbe";
  if(map.obj[i] || occ.has(i)) return "Cette case est occupée";
  if(solAt(i)) return "Ramasse d'abord ce qui est par terre";
  if(state.buildings.some(b => { const [x, z] = doorTile(b.type, b.x, b.z); return x === t.x && z === t.z; })) return "La case devant une porte reste libre";
  if(tileOf(player.position.x) === t.x && tileOf(player.position.z) === t.z) return "Recule d'un pas pour planter devant toi";
  if(plante === "tree" && NEAR.some(([dx, dz]) => inb(t.x + dx, t.z + dz) && map.obj[idx(t.x + dx, t.z + dz)] === "tree"))
    return "Trop près d'un autre arbre : laisse une case entre les deux";
  return null;
}

/* Le meilleur outil d'une famille dans le sac (le plus fort) ; s'il n'y en a pas, on le prend dans la réserve */
function bestTool(famille){
  const best = keys => keys.filter(k => OUTILS[k] && OUTILS[k].famille === famille).sort((a, b) => OUTILS[b].force - OUTILS[a].force)[0] || null;
  const k = best(state.sac.map(it => it.k));
  if(k) return k;
  const r = best(Object.keys(state.stock).filter(k => state.stock[k] > 0));
  if(r && sacAdd(r, 1)){ addOwned(r, -1); toast(`${objet(r).emoji} ${objet(r).nom} prise dans ta réserve`); return r; }
  return null;
}

/* ----- Le bouton d'action ----- */
let cur = null, anim = null;                          // ce qu'on vise ; l'animation en cours {i, t, kind}
const hits = new Map();                               // coups déjà donnés à chaque arbre
function show(label){
  if(btn.textContent !== label) btn.textContent = label;
  if(btn.hidden) btn.hidden = false;
}
export function updateRecolte(dt, active){
  if(anim) animate(dt);
  cur = active && !anim ? target() : null;
  if(!cur){ if(!btn.hidden) btn.hidden = true; return; }
  const seed = GRAINES[state.main];
  if(cur.sol) show(`✋ Ramasser : ${SOL[cur.sol].nom.toLowerCase()}`);
  else if(cur.o === "tree"){
    if(growth(cur.i) < 1) show(`🌱 Jeune arbre : adulte dans ${duree(growthLeft(cur.i))}`);
    else show(`🪓 Couper${hits.get(cur.i) ? ` (${RECOLTE.tree.coups - hits.get(cur.i)})` : ""}`);
  }
  else if(!cur.o && seed) show(`🌱 Planter`);
  else if(!btn.hidden) btn.hidden = true;
}
btn.addEventListener("click", () => {
  if(!cur || anim) return;
  if(cur.sol) ramasser(cur);
  else if(cur.o === "tree"){ if(growth(cur.i) >= 1) couper(cur); else toast(btn.textContent); }
  else if(!cur.o && GRAINES[state.main]) planter(cur);
});

/* ----- Ramasser ce qui est par terre ----- */
function ramasser(t){
  const k = pickUp(t.i);
  if(!k) return;
  const d = SOL[k], n = gain(d.n, d.res);
  addOwned(d.res, n); renderHUD(); save();
  toast(`${RES[d.res].emoji} +${n} ${RES[d.res].nom}`, 1200);
}

/* ----- Couper ----- */
function couper(t){
  const R = RECOLTE[t.o];
  const k = state.main && OUTILS[state.main] && OUTILS[state.main].famille === R.outil ? state.main : bestTool(R.outil);
  if(!k){ toast(`🪓 Il te faut une hache : fabrique-la à l'établi de la Scierie`, 3000); return; }
  if(state.main !== k){ barreAuto(k); hold(k); }
  const n = gain(R.parCoup + OUTILS[k].force - 1, R.res);
  addOwned(R.res, n); renderHUD();
  const h = (hits.get(t.i) || 0) + 1;
  if(h < R.coups){ hits.set(t.i, h); anim = {i: t.i, t: 0, kind: "shake"}; toast(`${RES[R.res].emoji} +${n} ${RES[R.res].nom}`, 1200); }
  else {
    hits.delete(t.i);
    anim = {i: t.i, t: 0, kind: "fall", R, n, side: Math.sign(player.position.x - centerOf(t.x)) || 1};
  }
  save();
}
function animate(dt){
  anim.t += dt;
  const g = objMesh(anim.i);
  if(!g){ anim = null; return; }
  if(anim.kind === "shake"){                          // l'arbre tremble sous le coup
    g.rotation.z = Math.sin(anim.t * 40) * .06 * Math.max(0, 1 - anim.t / .3);
    if(anim.t >= .3){ g.rotation.z = 0; anim = null; }
  } else {                                            // il tombe, du côté opposé au personnage
    g.rotation.order = "ZYX";                         // la chute se fait dans le monde, pas selon l'arbre tourné
    g.rotation.z = anim.side * Math.min(1, anim.t / .6) ** 2 * 1.45;
    if(anim.t >= .75) tombe();
  }
}
function tombe(){
  const {i, R, n} = anim;
  anim = null;
  setObj(i, null);
  const inSac = sacAdd(R.graine, 1);
  if(inSac) barreAuto(R.graine); else addOwned(R.graine, 1);
  syncBarre(); save();
  toast(`🌳 L'arbre est tombé : +${n} ${RES[R.res].nom}, +1 ${objet(R.graine).nom.toLowerCase()} ${inSac ? "dans ton sac" : "dans ta réserve (sac plein)"}`, 3200);
}

/* ----- Planter ----- */
function planter(t){
  const k = state.main, gr = GRAINES[k];
  const why = plantProblem(t, gr.plante);
  if(why){ toast(why); return; }
  if(!sacTake(k, 1)) return;
  setObj(t.i, gr.plante, Date.now());
  syncBarre(); save();
  toast(`🌱 ${gr.nom} plantée : ${gr.plante === "tree" ? "un arbre" : "elle sera"} adulte dans ${duree(gr.pousse)}`, 3000);
}
