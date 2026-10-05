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
/* De l'eau où l'on pêche (pas le ponton lui-même) */
export const eauLibre = i => map.type[i] === "water" && !pontonCases.has(i);

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
  scene.add(g);
}
