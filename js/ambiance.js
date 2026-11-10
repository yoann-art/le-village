/* ================= L'ambiance de l'île =================
   Les sons, étape 3 (choix de Yo, 3 novembre 2026, sur la page d'écoute) : des boucles qui se mêlent doucement en fond,
   selon l'endroit, l'heure, la saison et le temps qu'il fait, comme dans la vraie nature :
   - le vent (le vent d'hiver à sa place l'hiver), plus fort sous la pluie ; le vent dans les feuilles près des arbres (l'hiver,
     seulement les pins, qui gardent leurs aiguilles) ;
   - les vagues plus fortes près de la mer, le clapotis de l'étang près de l'eau douce, sous le ponton quand on y marche ;
   - la pluie dehors, sur le toit dans une maison ; le tonnerre un peu après chaque éclair d'orage ;
   - les oiseaux le matin (printemps et été, moins l'automne, pas l'hiver), les grillons le soir (l'été surtout), la nuit
     calme ; la pluie fait taire les bêtes ;
   - la roue à eau près de la Scierie (niveau 2 et plus), le feu près d'un feu de camp, d'un brasero ou d'une cheminée.
   Dans la forêt et le Marais, seulement le vent, les feuilles et la pluie (leurs sons à eux viendront à l'étape 5) ; dans la
   mine et la grotte, rien. Tout se règle quatre fois par seconde (main.js) ; les boucles tues s'arrêtent (sons.js). */
import { RECOLTE, saison, resteFeu } from "./donnees.js";
import { state } from "./sauvegarde.js";
import { player } from "./monde/personnage.js";
import { map, idx, inb, tileOf, N, H, lieuEau } from "./monde/ile.js";
import { passageCases } from "./monde/ponton.js";
import { meteo, mouille, eclairIci } from "./monde/meteo.js";
import { heure, nuitIci } from "./monde/ciel.js";
import { currentPlace } from "./lieux.js";
import { regler, jouer } from "./sons.js";

const BOUCLES = ["ambVent", "ambFeuilles", "ambHiver", "ambMer", "ambEtang", "ambPonton", "ambPluie", "ambPluieToit",
  "ambMatin", "ambGrillons", "ambNuit", "ambRoue", "ambFeu"];
const clamp = v => Math.max(0, Math.min(1, v));
const rampe = (h, a, b) => clamp((h - a) / (b - a));                 // 0 avant a, 1 après b

/* La distance (en cases) de chaque case à la mer et à l'eau douce : refaite de temps en temps (on creuse, on comble) */
let dMer = null, dEau = null, refaitA = -1e9;
function distances(){
  const loin = 99;
  dMer = new Uint8Array(N * N).fill(loin); dEau = new Uint8Array(N * N).fill(loin);
  for(const [d, est] of [[dMer, i => lieuEau(i) === "mer"], [dEau, i => lieuEau(i) !== "mer"]]){
    const file = [];
    for(let i = 0; i < N * N; i++) if(map.type[i] === "water" && est(i)){ d[i] = 0; file.push(i); }
    for(let q = 0; q < file.length; q++){
      const i = file[q], x = i % N, z = (i - x) / N;
      for(const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
        if(!inb(x + a, z + b)) continue;
        const j = idx(x + a, z + b);
        if(d[j] > d[i] + 1){ d[j] = d[i] + 1; file.push(j); }
      }
    }
  }
}
/* Les arbres et les feux autour d'un point (les feux posés dehors : le feu de camp et le brasero) */
function autour(x, z, r, test){
  let n = 0, best = 99;
  for(let b = -r; b <= r; b++) for(let a = -r; a <= r; a++){
    if(!inb(x + a, z + b)) continue;
    if(test(map.obj[idx(x + a, z + b)], idx(x + a, z + b))){ n++; best = Math.min(best, Math.hypot(a, b)); }
  }
  return {n, d: best};
}
const arbre = (o, hiver) => !!o && (hiver ? o === "pin" : RECOLTE[o] && RECOLTE[o].outil === "hache" && o !== "buisson");
const feuDehors = (o, i) => (o === "feuCamp" || o === "brasero") && !(state.ile[i] || {}).eteint;   // éteint : plus de crépitement

/* Le tonnerre : un peu après l'éclair (le son va moins vite que la lumière), plus ou moins loin */
let eclairAvant = 0;
function tonnerre(dedans){
  const e = eclairIci();
  if(e > .9 && eclairAvant <= .9) setTimeout(() => jouer("ambTonnerre", {voie: "ambiance", vol: dedans ? .5 : .8 + Math.random() * .2, hauteur: .9}), 400 + Math.random() * 2200);
  eclairAvant = e;
}

let attente = 0;
const cible = {};
export const ciblesAmbiance = () => ({...cible});                        // pour la vérification
export function updateAmbiance(dt){
  tonnerre(!!currentPlace());
  if((attente -= dt) > 0) return;
  attente = .25;
  for(const k of BOUCLES) cible[k] = 0;
  const place = currentPlace(), m = meteo(), pluie = mouille(m), orage = m === "orage", s = saison(), hiver = s === "hiver";
  const h = heure(), nuit = nuitIci(), betes = pluie ? .3 : 1;
  const vent = (orage ? .9 : pluie ? .7 : .45);
  if(!place){                                                            // dehors, sur l'île
    if(performance.now() - refaitA > 10000){ distances(); refaitA = performance.now(); }
    const p = player.position, x = tileOf(p.x), z = tileOf(p.z), i = inb(x, z) ? idx(x, z) : -1;
    cible[hiver ? "ambHiver" : "ambVent"] = vent;
    cible.ambFeuilles = clamp(autour(x, z, 4, o => arbre(o, hiver)).n / 6) * (pluie ? .6 : 1);
    if(i >= 0){
      cible.ambMer = clamp(1 - dMer[i] / 14);
      cible.ambEtang = clamp(1 - dEau[i] / 6) * .9;
      cible.ambPonton = passageCases.has(i) ? 1 : 0;
    }
    if(pluie) cible.ambPluie = orage ? 1 : .8;
    cible.ambMatin = (s === "printemps" || s === "ete" ? 1 : s === "automne" ? .4 : 0) * rampe(h, 5, 6) * (1 - rampe(h, 9, 10.5)) * betes;
    const soir = h >= 12 ? rampe(h, 19.5, 21) : 1 - rampe(h, 0, 1.5);
    cible.ambGrillons = (s === "ete" ? 1 : s === "printemps" || s === "automne" ? .45 : 0) * soir * betes;
    cible.ambNuit = nuit * (1 - cible.ambGrillons * .6) * (hiver ? .5 : 1) * betes;
    const sc = state.buildings.find(b => b.type === "scierie" && b.lvl >= 2);
    if(sc){ const c = 5 / 2, d = Math.hypot(p.x - (sc.x - H + c), p.z - (sc.z - H + c)); cible.ambRoue = clamp(1 - (d - 2) / 9); }
    const f = autour(x, z, 6, feuDehors);
    if(f.n) cible.ambFeu = clamp(1 - f.d / 6);
  } else {
    const t = place.b.type;
    if(t === "foret" || t === "marais"){                                // la forêt et le Marais : leurs sons à l'étape 5
      cible[hiver ? "ambHiver" : "ambVent"] = vent * .7;
      cible.ambFeuilles = (hiver ? .3 : .7) * (pluie ? .6 : 1);
      if(pluie) cible.ambPluie = orage ? 1 : .8;
    } else if(t !== "mine" && t !== "grotte" && t !== "trajet"){       // une maison : le dehors étouffé, la pluie sur le toit, le feu
      cible[hiver ? "ambHiver" : "ambVent"] = vent * .25;
      if(pluie) cible.ambPluieToit = orage ? 1 : .8;
      const items = (place.b.deco && place.b.deco.items) || [];
      const feu = items.find(it => (it.type === "cheminee" ? resteFeu(it) > 0 : it.type === "feuCamp" || it.type === "brasero") && !it.eteint);   // la cheminée : tant que ses bûches brûlent
      if(feu){ const p = player.position; cible.ambFeu = clamp(1 - (Math.hypot(p.x - feu.x, p.z - feu.z) - 1) / 6); }
    }
  }
  for(const k of BOUCLES) regler(k, cible[k]);
}
