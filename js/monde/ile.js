/* ================= L'île =================
   Carte en cases, terrain, mer, arbres et rochers. */
import { scene } from "./scene.js";
import { mat, G, part } from "./formes.js";
import { state } from "../sauvegarde.js";
import { doorTile } from "../regles.js";

/* Carte de l'île : N × N cases, une case = 1 P */
export const N = 40, H = N / 2;
export const idx = (x,z) => z * N + x;
export const inb = (x,z) => x >= 0 && z >= 0 && x < N && z < N;
export const tileOf = w => Math.floor(w + H);
export const centerOf = t => t - H + .5;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function genMap(seed){
  const rnd = mulberry32(seed), G = 5, g1 = [], g2 = [];
  for(let i = 0; i < (G+1)*(G+1); i++){ g1.push(rnd()); g2.push(rnd()); }
  const sm = t => t*t*(3-2*t);
  function noise(g, x, z){
    const fx = x/(N-1)*G, fz = z/(N-1)*G;
    const ix = Math.min(G-1, Math.floor(fx)), iz = Math.min(G-1, Math.floor(fz));
    const tx = sm(fx-ix), tz = sm(fz-iz), w = G+1;
    const a = g[iz*w+ix], b = g[iz*w+ix+1], c = g[(iz+1)*w+ix], d = g[(iz+1)*w+ix+1];
    return (a*(1-tx) + b*tx)*(1-tz) + (c*(1-tx) + d*tx)*tz;
  }
  const type = new Array(N*N), obj = new Array(N*N).fill(null), c = (N-1)/2;
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const d = Math.hypot((x-c)/(N/2), (z-c)/(N/2));
    const h = 1 - d*1.2 + (noise(g1,x,z) - .5)*.6;
    let t = h < .1 ? "water" : h < .24 ? "sand" : "grass";
    if(Math.hypot(x-c, z-c) < 4) t = "grass";
    if(Math.hypot(x-(c+8), z-(c-7)) < 2.3 && t === "grass") t = "water";
    type[idx(x,z)] = t;
  }
  /* Un arbre ne pousse pas collé à un autre : son feuillage fait 2 P de large */
  const treeNear = (x,z) => [[-1,0],[-1,-1],[0,-1],[1,-1]].some(([dx,dz]) => inb(x+dx, z+dz) && obj[idx(x+dx, z+dz)] === "tree");
  /* (Ne pas changer le 5 ci-dessous : cela redistribuerait tous les arbres de l'île.
     Pour faire de la place, on retire des arbres après coup, voir la place du village.) */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++){
    const i = idx(x,z);
    if(Math.hypot(x-c, z-c) < 5) continue;
    const r = rnd();
    if(type[i] === "grass"){
      if((noise(g2,x,z) > .6 && r < .5) || r < .035){ if(!treeNear(x,z)) obj[i] = "tree"; }
      else if(r < .06) obj[i] = "rock";
    } else if(type[i] === "sand" && r < .03) obj[i] = "rock";
  }
  /* La place du village : ni arbre ni rocher à moins de 9 cases du centre */
  for(let z = 0; z < N; z++) for(let x = 0; x < N; x++) if(Math.hypot(x-c, z-c) < 9) obj[idx(x,z)] = null;
  return {type, obj};
}
export const map = genMap(state.seed);
/* Rien ne pousse devant la porte d'un bâtiment déjà posé */
state.buildings.forEach(b => {
  const [x, z] = doorTile(b.type, b.x, b.z);
  if(inb(x, z)) map.obj[idx(x, z)] = null;
});

/* Terrain : dalle d'herbe ou de sable sur un socle de terre */
{
  const land = [];
  map.type.forEach((t,i) => { if(t !== "water") land.push(i); });
  const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.24,1), new THREE.MeshLambertMaterial({color:0xffffff}), land.length);
  const dirt = new THREE.InstancedMesh(new THREE.BoxGeometry(1,.8,1), mat(0xA8774C), land.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  land.forEach((i,k) => {
    const x = i % N, z = Math.floor(i / N), wx = centerOf(x), wz = centerOf(z), alt = (x+z) % 2;
    m4.makeTranslation(wx, -.12, wz); slabs.setMatrixAt(k, m4);
    m4.makeTranslation(wx, -.64, wz); dirt.setMatrixAt(k, m4);
    col.setHex(map.type[i] === "sand" ? (alt ? 0xEBD793 : 0xF1E0A3) : (alt ? 0x74C063 : 0x7DC96B));
    slabs.setColorAt(k, col);
  });
  slabs.instanceColor.needsUpdate = true;
  slabs.receiveShadow = true; dirt.receiveShadow = true;
  scene.add(slabs, dirt);
}
export const water = new THREE.Mesh(new THREE.PlaneGeometry(N+90, N+90),
  new THREE.MeshPhongMaterial({color:0x58C3D8, transparent:true, opacity:.8, shininess:90, specular:0x99DDEE}));
water.rotation.x = -Math.PI/2; water.position.y = -.2; water.receiveShadow = true;
const seabed = new THREE.Mesh(new THREE.PlaneGeometry(N+90, N+90), mat(0x2F93AE));
seabed.rotation.x = -Math.PI/2; seabed.position.y = -1.05;
scene.add(water, seabed);

/* Arbres (3 à 4 P de haut) et rochers (½ à 1 P) */
map.obj.forEach((o,i) => {
  if(!o) return;
  const r = ((i*9301 + 49297) % 233280) / 233280;
  const g = new THREE.Group();
  if(o === "tree"){
    g.add(part(G.trunk, 0x8A5A3B, 2.2,2.4,2.2, 0,.66,0));
    g.add(part(G.leaf, r < .5 ? 0x3E9D50 : 0x479F46, 2,2,2, 0,1.95,0));
    g.add(part(G.leaf2, 0x57B25C, 2,2,2, .1,2.75,.05));
    g.scale.setScalar(.9 + r*.25);
  } else {
    g.add(part(G.dode, r < .5 ? 0x9EA3A8 : 0x8F959B, .9,.7,.9, 0,.25,0));
    g.scale.setScalar(.8 + r*.4);
  }
  g.rotation.y = r * 6.28;
  g.position.set(centerOf(i % N), 0, centerOf(Math.floor(i / N)));
  scene.add(g);
});
