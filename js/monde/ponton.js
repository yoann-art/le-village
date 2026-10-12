/* ================= Le ponton (étape 1.6, la pêche) =================
   Le Grand Carnet : sur l'île, on pêche « la mer depuis le ponton ». Un ponton de bois, posé une fois au bord
   de la mer, au sud de la place du village, qui avance de LONG cases dans l'eau. On y marche ; certains
   poissons ne se pêchent que de là (depuis:"ponton" dans POISSONS). La case de terre d'où il part reste
   toujours libre : on n'y bâtit pas, rien n'y pousse, on n'y pose rien.
   state.ponton = {x, z, n} : sa colonne, sa première case sur l'eau, sa longueur (gardé, pour qu'il ne bouge plus).
   La barque (étape 1.13, morceau 2) s'amarre à droite du bout du ponton, contre la borne (amarre) ; son modèle :
   barqueModele (barque.js la pose, ou la fait suivre le personnage quand il rame). */
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
/* ----- La barque (étape 1.13, morceau 2 ; Grand Carnet : « la Libellule ») -----
   Une coque ronde de bois (une demi-sphère retournée), son bord, un banc, deux rames, et une petite libellule en figure
   de proue. En chantier, seulement sa carcasse : la quille et ses couples, en bois clair. Elle regarde vers +z ; posée
   à y = 0,02, son fond (une planche ovale) reste juste au-dessus de la mer (y = −0,2) : l'eau ne la remplit pas. */
export const amarre = P ? {x: centerOf(P.x) + 1.02, z: centerOf(P.z + P.n - 1) - .15} : null;
const COQUE = new THREE.MeshLambertMaterial({color: 0xA06A3E, side: THREE.DoubleSide});
const COUPLE = new THREE.TorusGeometry(.5, .05, 6, 12, Math.PI);
const AILE = new THREE.MeshLambertMaterial({color: 0xDDF2F4, transparent: true, opacity: .8});
export function barqueModele(chantier){
  const g = new THREE.Group();
  if(chantier){
    g.add(part(G.box, 0xC89A68, .1, .08, 1.9, 0, -.34, 0));                           // la quille
    for(const z of [-.7, -.35, 0, .35, .7]){                                             // les couples
      const e = 1 - Math.abs(z) * .5, c = new THREE.Mesh(COUPLE, new THREE.MeshLambertMaterial({color: 0xC89A68}));
      c.rotation.z = Math.PI; c.scale.set(.82 * e, .8 * e, 1); c.position.set(0, .04, z); c.castShadow = true; g.add(c);
    }
    g.add(part(G.box, 0xC89A68, .06, .06, 1.9, .3, .02, 0));                            // une première planche du bord
    return g;
  }
  const coque = new THREE.Mesh(G.hair, COQUE);
  coque.rotation.x = Math.PI; coque.scale.set(1.6, 1.4, 3.75); coque.position.y = .04;   // 0,8 de large, 1,9 de long, 0,36 de creux
  coque.castShadow = coque.receiveShadow = true; g.add(coque);
  const bord = part(G.tore, 0x7A4E2E, .82, 1.9, 1.2, 0, .05, 0); bord.rotation.x = Math.PI / 2; g.add(bord);
  g.add(part(G.cyl, 0x6B4A2F, .7, .03, 1.62, 0, -.15, 0));                              // le fond, au-dessus de l'eau (qui ondule)
  g.add(part(G.box, 0x8A5A32, .76, .05, .2, 0, -.05, -.25));                             // le banc
  const rames = [];
  for(const c of [-1, 1]){                                                               // les rames, sur le bord
    const r = new THREE.Group(); r.position.set(c * .4, .08, -.1);
    const manche = part(G.cyl, 0x9A6E46, .04, 1.1, .04, 0, -.55, 0); r.add(manche);
    r.add(part(G.box, 0x9A6E46, .02, .32, .13, 0, -1.05, 0));                            // la pale
    r.rotation.z = c * (Math.PI / 2 - .45); g.add(r); rames.push(r);
  }
  g.userData.rames = rames;
  /* la libellule de la proue : un corps bleu-vert, deux paires d'ailes */
  const proue = new THREE.Group(); proue.position.set(0, .14, .95);
  const corps = part(G.cyl, 0x2E9C9A, .05, .32, .05, 0, 0, 0); corps.rotation.x = Math.PI / 2; proue.add(corps);
  proue.add(part(G.head, 0x2E9C9A, .3, .3, .3, 0, .02, .17));
  for(const z of [.03, -.06]) for(const c of [-1, 1]){ const a = part(G.box, AILE, .22, .01, .06, c * .12, .03, z); a.castShadow = false; proue.add(a); }
  g.add(proue);
  return g;
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
