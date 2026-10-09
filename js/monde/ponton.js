/* ================= Le ponton (étape 1.6, la pêche) =================
   Le Grand Carnet : sur l'île, on pêche « la mer depuis le ponton ». Un ponton de bois, posé une fois au bord
   de la mer, au sud de la place du village, qui avance de LONG cases dans l'eau. On y marche ; certains
   poissons ne se pêchent que de là (depuis:"ponton" dans POISSONS). La case de terre d'où il part reste
   toujours libre : on n'y bâtit pas, rien n'y pousse, on n'y pose rien.
   state.ponton = {x, z, n} : sa colonne, sa première case sur l'eau, sa longueur (gardé, pour qu'il ne bouge plus). */
import { G, part } from "./formes.js";
import { scene } from "./scene.js";
import { state, save } from "../sauvegarde.js";
import { map, idx, inb, N, centerOf, tileOf, setObj } from "./ile.js";
import { occ } from "./batiments.js";
import { lanterne } from "./ciel.js";

const LONG = 4;
const eau = (x, z) => inb(x, z) && map.type[idx(x, z)] === "water";
/* La première colonne, en partant du milieu, où la terre finit sur une mer bien dégagée */
function choisir(){
  const c = Math.floor(N / 2);
  for(let d = 0; d <= 14; d++) for(const x of d ? [c + d, c - d] : [c]){
    let z = c + 9;
    while(z < N - 1 && !eau(x, z)) z++;
    const entree = idx(x, z - 1);
    if(!eau(x, z) || map.type[entree] === "water" || occ.has(entree) || map.obj[entree] === "coffre") continue;   // jamais sur un bâtiment ni un coffre
    let ok = true;
    for(let k = 0; k < LONG && ok; k++){
      if(!eau(x, z + k)) ok = false;
      if(k && (!eau(x - 1, z + k) || !eau(x + 1, z + k))) ok = false;   // il avance dans la mer, pas le long d'une plage
    }
    if(ok) return {x, z, n: LONG};
  }
  return null;
}
if(!state.ponton){
  const p = choisir();
  if(p){
    state.ponton = p;
    const e = idx(p.x, p.z - 1);
    if(map.obj[e]) setObj(e, null);                   // la case d'où il part est libre
    save();
  }
}
const P = state.ponton;
/* Les cases du ponton (de l'eau où l'on marche), et la case de terre d'où il part */
export const pontonCases = new Set();
if(P) for(let k = 0; k < P.n; k++) pontonCases.add(idx(P.x, P.z + k));
export const entreePonton = P ? idx(P.x, P.z - 1) : -1;
export const surPonton = (wx, wz) => { const x = tileOf(wx), z = tileOf(wz); return inb(x, z) && pontonCases.has(idx(x, z)); };

/* ----- Le pont de la Forêt profonde (étape 1.7) -----
   Bible : « au début, on ne voit que l'île et la Forêt profonde, où l'on va à pied ». Un pont de bois part de la côte
   nord de l'île vers l'orée de la forêt (le « bâtiment » fixe B.foret, posé au bout par foret.js) : on y marche vers
   le nord et on entre dans la forêt par l'orée, comme dans la mine. state.pontForet = {x, z, n} : sa colonne, sa
   première case sur l'eau (côté île), sa longueur (vers le nord) ; la case de terre d'où il part reste libre. */
const LONG_PONT = 3;
function choisirPont(){
  const c = Math.floor(N / 2);
  for(let d = 3; d <= 22; d++) for(const x of [c + d, c - d]){
    let z = c - 9;
    while(z > 0 && !eau(x, z)) z--;
    const entree = idx(x, z + 1), fin = z - LONG_PONT + 1, b0 = fin - 3;   // b0 : le haut des 3 × 3 cases de l'orée
    if(!eau(x, z) || map.type[entree] === "water" || occ.has(entree) || map.obj[entree] === "coffre" || b0 < 0) continue;
    let ok = true;
    for(let k = 0; k < LONG_PONT && ok; k++){ if(!eau(x, z - k)) ok = false; if(k && (!eau(x - 1, z - k) || !eau(x + 1, z - k))) ok = false; }
    for(let dz = 0; dz < 3 && ok; dz++) for(let dx = -1; dx <= 1; dx++) if(!eau(x + dx, b0 + dz) || occ.has(idx(x + dx, b0 + dz))) ok = false;
    if(ok) return {x, z, n: LONG_PONT};
  }
  return null;
}
if(!state.pontForet){
  const p = choisirPont();
  if(p){ state.pontForet = p; const e = idx(p.x, p.z + 1); if(map.obj[e]) setObj(e, null); save(); }
}
export const pontForet = state.pontForet || null;
export const pontCases = new Set();
if(pontForet) for(let k = 0; k < pontForet.n; k++) pontCases.add(idx(pontForet.x, pontForet.z - k));
const entreePont = pontForet ? idx(pontForet.x, pontForet.z + 1) : -1;

/* Où l'on marche sur l'eau (le ponton, le pont) ; les cases de terre d'où ils partent, toujours libres */
export const passageCases = new Set([...pontonCases, ...pontCases]);
export const entrees = new Set([entreePonton, entreePont].filter(i => i >= 0));
/* De l'eau où l'on pêche (pas le ponton ni le pont eux-mêmes) */
export const eauLibre = i => map.type[i] === "water" && !passageCases.has(i);

/* Les lanternes allumées dehors (les papillons de nuit tournent autour : voir insectes.js) */
export const lanternes = [];
/* Le modèle : des planches sur des pieux, une borne au bout (style jouet, bois de la palette) */
if(P){
  const g = new THREE.Group(), x0 = centerOf(P.x), z0 = centerOf(P.z) - .5;
  for(let k = 0; k < P.n * 4; k++)                    // les planches, en travers
    g.add(part(G.box, k % 2 ? 0xB8875A : 0xA97A4F, .96, .08, .22, x0, -.04, z0 + .125 + k * .25));
  for(const dx of [-.46, .46]){
    g.add(part(G.box, 0x7A5235, .08, .1, P.n, x0 + dx, -.1, z0 + P.n / 2));   // les poutres dessous
    for(let k = 0; k <= P.n; k++) g.add(part(G.cyl, 0x6B4A2F, .14, 1.1, .14, x0 + dx, -.5, z0 + Math.min(k, P.n - .1)));   // les pieux
  }
  const bout = z0 + P.n - .2;                          // une borne d'amarrage au bout, et une lanterne
  g.add(part(G.cyl, 0x6B4A2F, .16, .5, .16, x0 + .38, .2, bout));
  g.add(part(G.cyl, 0x4A3826, .06, .9, .06, x0 - .38, .45, bout));
  const glow = new THREE.MeshLambertMaterial({color: 0xFFE3A3, emissive: 0xFFB347, emissiveIntensity: .7});
  const l = part(G.box, glow, .18, .22, .18, x0 - .38, .95, bout); l.castShadow = false; g.add(l);
  lanternes.push({x: x0 - .38, y: .95, z: bout});
  lanterne(x0 - .38, .95, bout, glow);                 // la nuit, elle éclaire le bout du ponton (ciel.js)
  scene.add(g);
}
/* Le pont de la forêt : des planches entre deux rambardes de bois, vers le nord */
if(pontForet){
  const g = new THREE.Group(), x0 = centerOf(pontForet.x), zBas = centerOf(pontForet.z) + .5, n = pontForet.n;
  for(let k = 0; k < n * 4; k++) g.add(part(G.box, k % 2 ? 0x9A6E46 : 0x8A6240, 1.1, .08, .22, x0, -.04, zBas - .125 - k * .25));
  for(const dx of [-.5, .5]){
    g.add(part(G.box, 0x6B4A2F, .08, .1, n, x0 + dx, -.1, zBas - n / 2));
    for(let k = 0; k <= n; k++){
      const z = zBas - Math.min(k, n - .05);
      g.add(part(G.cyl, 0x5A3E28, .14, 1.4, .14, x0 + dx, -.2, z));                       // les pieux, qui montent en rambarde
    }
    g.add(part(G.box, 0x6B4A2F, .07, .07, n, x0 + dx, .48, zBas - n / 2));                   // la rambarde
  }
  scene.add(g);
}
