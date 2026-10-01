/* ================= Récolter et planter sur l'île =================
   Un bouton d'action à gauche, selon ce qu'il y a devant le personnage :
   - par terre (morceau de bois, petit caillou) : « ✋ Ramasser », à la main (voir monde/sol.js) ;
   - un arbre adulte : « 🪓 Couper » ; l'outil est pris en main tout seul (du sac ou de la réserve) ; chaque
     coup donne du bois, au dernier l'arbre tombe et donne une graine ;
   - des herbes hautes : « ✋ Cueillir » (des fibres ; rases, elles repoussent) ; cueillies une 2e fois de suite :
     « ✋ Arracher » (des fibres et une graine ; elles ne repoussent pas) ;
   - un buisson de baies : « ✋ Cueillir les baies » (le buisson est vide) ; vide : « 💧 Arroser » (l'arrosoir ;
     les baies reviennent une heure après) ; la hache en main : « 🪓 Couper le buisson » (une graine) ;
   - une graine en main : « 🌱 Planter » sur la case d'herbe libre devant soi ; elle pousse avec l'horloge
     du téléphone (pousse, jeune plant, adulte). Les arbres ne sont jamais collés. */
import { $ } from "./outils.js";
import { RES, OUTILS, GRAINES, RECOLTE, SOL, objet } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { addOwned, sacAdd, sacTake, gain, doorTile } from "./regles.js";
import { map, idx, inb, tileOf, centerOf, growth, growthLeft, herbeLeft, baiesLeft, setObj, setEtat, objMesh } from "./monde/ile.js";
import { occ } from "./monde/batiments.js";
import { solAt, pickUp } from "./monde/sol.js";
import { player, frontTile } from "./monde/personnage.js";
import { toast, renderHUD } from "./interface.js";
import { hold, barreAuto, syncBarre } from "./barre.js";

const btn = $("#btn-act");
const duree = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h} h${m ? " " + String(m).padStart(2, "0") : ""}` : `${Math.max(1, Math.ceil(s / 60))} min`; };
const nomDe = (k, n) => { const o = objet(k); return n > 1 ? o.pluriel || o.nom : o.nom.toLowerCase(); };

/* Ce qu'il y a devant le personnage : par terre, un objet de l'île, la case libre devant (pour planter),
   ou les herbes hautes où il se tient (on les traverse) */
function target(){
  const own = [tileOf(player.position.x), tileOf(player.position.z)];
  for(const dist of [0, .8]){
    const [x, z] = dist ? frontTile(dist) : own;
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
  if(GRAINES[state.main] && inb(x, z)) return {i: idx(x, z), x, z, o: null};
  if(inb(...own) && map.obj[idx(...own)] === "herbe") return {i: idx(...own), x: own[0], z: own[1], o: "herbe"};
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
/* Prend en main l'outil d'une famille (celui qu'on tient, ou le meilleur) ; null s'il n'y en a pas */
function takeTool(famille){
  const k = state.main && OUTILS[state.main] && OUTILS[state.main].famille === famille ? state.main : bestTool(famille);
  if(k && state.main !== k){ barreAuto(k); hold(k); }
  return k;
}
/* Une graine récoltée : dans le sac (et une case rapide), ou dans la réserve si le sac est plein */
function giveSeed(k){
  const inSac = sacAdd(k, 1);
  if(inSac) barreAuto(k); else addOwned(k, 1);
  syncBarre();
  return inSac ? "dans ton sac" : "dans ta réserve (sac plein)";
}

/* ----- Le bouton d'action : son texte, et ce qu'il fait ----- */
let cur = null, act = null, anim = null;              // ce qu'on vise ; son action {label, run} ; l'animation {i, t, kind}
const hits = new Map();                               // coups déjà donnés à chaque arbre ou buisson
const info = label => ({label, run: () => toast(label)});
function actionOf(t){
  if(t.sol) return {label: `✋ Ramasser : ${SOL[t.sol].nom.toLowerCase()}`, run: () => ramasser(t)};
  const g = t.o ? growth(t.i) : 1, h = hits.get(t.i);
  const tenu = state.main && OUTILS[state.main] && OUTILS[state.main].famille;
  if(t.o === "tree")
    return g < 1 ? info(`🌱 Jeune arbre : adulte dans ${duree(growthLeft(t.i))}`)
      : {label: `🪓 Couper${h ? ` (${RECOLTE.tree.coups - h})` : ""}`, run: () => couper(t)};
  if(t.o === "herbe"){
    if(g < 1) return info(`🌱 Jeunes herbes : hautes dans ${duree(growthLeft(t.i))}`);
    return herbeLeft(t.i) > 0 ? {label: "✋ Arracher (+1 graine)", run: () => arracher(t)} : {label: "✋ Cueillir", run: () => cueillirHerbe(t)};
  }
  if(t.o === "buisson"){
    if(g < 1) return info(`🌱 Jeune buisson : adulte dans ${duree(growthLeft(t.i))}`);
    if(tenu === "hache") return {label: `🪓 Couper le buisson${h ? ` (${RECOLTE.buisson.coups - h})` : ""}`, run: () => couper(t)};
    const b = baiesLeft(t.i);
    return b === 0 ? {label: "✋ Cueillir les baies", run: () => cueillirBaies(t)}
      : b < 0 ? {label: "💧 Arroser", run: () => arroser(t)}
      : info(`🫐 Baies dans ${duree(b)}`);
  }
  if(!t.o && GRAINES[state.main]) return {label: "🌱 Planter", run: () => planter(t)};
  return null;
}
export function updateRecolte(dt, active){
  if(anim) animate(dt);
  cur = active && !anim ? target() : null;
  act = cur && actionOf(cur);
  if(!act){ if(!btn.hidden) btn.hidden = true; return; }
  if(btn.textContent !== act.label) btn.textContent = act.label;
  if(btn.hidden) btn.hidden = false;
}
btn.addEventListener("click", () => { if(act && !anim) act.run(); });

/* ----- Ramasser ce qui est par terre ----- */
function ramasser(t){
  const k = pickUp(t.i);
  if(!k) return;
  const d = SOL[k], n = gain(d.n, d.res);
  addOwned(d.res, n); renderHUD(); save();
  toast(`${RES[d.res].emoji} +${n} ${RES[d.res].nom}`, 1200);
}

/* ----- Cueillir ----- */
function cueillirHerbe(t){
  const R = RECOLTE.herbe, n = gain(R.n, R.cueille);
  addOwned(R.cueille, n);
  setEtat(t.i, {coupe: Date.now()}); save();
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}. Elles repoussent dans ${duree(R.repousse)} ; cueille encore pour avoir la graine`, 3200);
}
function arracher(t){
  const R = RECOLTE.herbe, n = gain(R.n, R.cueille);
  addOwned(R.cueille, n);
  setObj(t.i, null);
  const ou = giveSeed(R.graine); save();
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}, +1 ${nomDe(R.graine, 1)} ${ou} : elles ne repousseront pas ici`, 3200);
}
function cueillirBaies(t){
  const R = RECOLTE.buisson, n = gain(R.n, R.cueille);
  addOwned(R.cueille, n);
  setEtat(t.i, {vide: true, arrose: undefined}); save();
  toast(`${objet(R.cueille).emoji} +${n} ${nomDe(R.cueille, n)}. Arrose le buisson pour qu'elles reviennent`, 3000);
}
function arroser(t){
  if(!takeTool("arrosoir")){ toast(`💧 Il te faut un arrosoir : fabrique-le à l'établi de la Scierie`, 3000); return; }
  setEtat(t.i, {arrose: Date.now()}); save();
  anim = {i: t.i, t: 0, kind: "shake"};
  toast(`💧 Arrosé : les baies reviennent dans ${duree(RECOLTE.buisson.retour)}`, 2600);
}

/* ----- Couper (un arbre, un buisson) ----- */
const FIN = {tree: "🌳 L'arbre est tombé", buisson: "🌿 Le buisson est coupé"};
function couper(t){
  const R = RECOLTE[t.o], k = takeTool(R.outil);
  if(!k){ toast(`🪓 Il te faut une hache : fabrique-la à l'établi de la Scierie`, 3000); return; }
  const n = R.res ? gain(R.parCoup + OUTILS[k].force - 1, R.res) : 0;
  if(n){ addOwned(R.res, n); renderHUD(); }
  const h = (hits.get(t.i) || 0) + 1;
  if(h < R.coups){ hits.set(t.i, h); anim = {i: t.i, t: 0, kind: "shake"}; if(n) toast(`${RES[R.res].emoji} +${n} ${RES[R.res].nom}`, 1200); }
  else {
    hits.delete(t.i);
    anim = {i: t.i, t: 0, kind: "fall", o: t.o, R, n, side: Math.sign(player.position.x - centerOf(t.x)) || 1};
  }
  save();
}
function animate(dt){
  anim.t += dt;
  const g = objMesh(anim.i);
  if(!g){ anim = null; return; }
  if(anim.kind === "shake"){                          // il tremble sous le coup
    g.rotation.z = Math.sin(anim.t * 40) * .06 * Math.max(0, 1 - anim.t / .3);
    if(anim.t >= .3){ g.rotation.z = 0; anim = null; }
  } else {                                            // il tombe, du côté opposé au personnage
    g.rotation.order = "ZYX";                         // la chute se fait dans le monde, pas selon l'arbre tourné
    g.rotation.z = anim.side * Math.min(1, anim.t / .6) ** 2 * 1.45;
    if(anim.t >= .75) tombe();
  }
}
function tombe(){
  const {i, o, R, n} = anim;
  anim = null;
  setObj(i, null);
  const ou = giveSeed(R.graine); save();
  toast(`${FIN[o]} : ${n ? `+${n} ${RES[R.res].nom}, ` : ""}+1 ${nomDe(R.graine, 1)} ${ou}`, 3200);
}

/* ----- Planter ----- */
const DEVIENT = {tree: "un arbre adulte", herbe: "des herbes hautes", buisson: "un buisson de baies"};
function planter(t){
  const k = state.main, gr = GRAINES[k];
  const why = plantProblem(t, gr.plante);
  if(why){ toast(why); return; }
  if(!sacTake(k, 1)) return;
  setObj(t.i, gr.plante, Date.now());
  syncBarre(); save();
  toast(`🌱 ${gr.nom} plantée : ${DEVIENT[gr.plante]} dans ${duree(gr.pousse)}`, 3000);
}
