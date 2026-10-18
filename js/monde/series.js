/* ================= Les petites choses au loin, dessinées en série (correction de Yo, 16 octobre 2026) =================
   Les petites choses de l'île (herbes, fleurs, thym, pierres, groseilliers, souches, le bois et les cailloux au sol) se
   dessinent jusqu'au bout du brouillard, comme les arbres (avant : seulement jusqu'à 28 P, et elles apparaissaient d'un
   coup en marchant). Il y en a des centaines à l'écran à la première personne : dessinées une par une, elles coûtaient
   cher au téléphone. Au loin, elles sont donc dessinées en série : toutes celles qui ont la même forme et la même matière
   (une touffe d'herbe lointaine, un thym fleuri, une pierre de la même nuance…) en un seul dessin, chacune à sa place
   (THREE.InstancedMesh). Ce sont exactement les mêmes formes, les mêmes matières, les mêmes ombres et le même vent
   (formes.js : le vent prend le pied de chaque objet de la série) : seule la façon de les envoyer à la carte graphique
   change. De près (là où leur modèle détaillé prend le relais, ou à moins de PRES_SEUL P), elles restent dessinées une par
   une, comme avant : on les cueille, on les coupe, elles tremblent.
   ile.js range chaque objet (preparerSerie), puis montrerChamp, à chaque image, met les lointains en série (ajouterEnSerie)
   au lieu de les montrer. Seulement à la première personne (main.js) : c'est là qu'il y en a des centaines (mesuré, le
   processeur ralenti 4 fois : le dessin d'une image de 46 à 30 ms et de 33 à 23 ms) ; vu de dessus, il y en a peu à l'écran,
   chaque série n'en aurait qu'un ou deux, et elles coûtaient un peu plus qu'elles ne rapportaient. */
import { scene } from "./scene.js";
import { MATS_OMBRE, petitALEcran } from "./chene.js";

const PRES_SEUL = 6;                                       // sans modèle léger : en série au-delà de 6 P (comme les autres)
const lots = new Map();                                    // forme + matière + ombre → {mesh, n, cap, besoin}
const descr = new WeakMap();                               // un objet → {morceaux: [{lot, m}], dist}
let nLots = 0;
/* Les séries ont leur propre copie de chaque matière (mêmes réglages, même vent, même ombrage) : three.js r128 garde un seul
   programme de dessin en cours par matière, et quand une même matière sert tour à tour à un objet seul et à une série, il
   recalcule ce programme à chaque fois (mesuré : 3 ms de plus par image vue de dessus, le processeur ralenti 4 fois) */
const copies = new Map();
function copie(m){
  let c = copies.get(m);
  if(!c){
    c = m.clone();
    c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey;   // le vent (formes.js)
    if(MATS_OMBRE.includes(m)){ c.visible = m.visible; MATS_OMBRE.push(c); }                      // ne se montre que dans l'ombre
    copies.set(m, c);
  }
  return c;
}
function lotDe(geo, mat, ombre, recoit){
  mat = copie(mat);
  const cle = `${geo.uuid}|${mat.uuid}|${ombre ? 1 : 0}${recoit ? 1 : 0}`;
  let L = lots.get(cle);
  if(!L){ L = {mesh: null, n: 0, compte: 0, cap: 0, besoin: 0, geo, mat, ombre, recoit}; lots.set(cle, L); nLots++; }
  return L;
}
/* la série d'une forme : assez de places pour tous les objets qui s'en servent (refaite plus grande s'il en faut plus) */
function assez(L){
  if(L.mesh && L.cap >= L.besoin) return;
  if(L.mesh) scene.remove(L.mesh);
  L.cap = Math.max(8, Math.ceil(L.besoin * 1.25));
  L.mesh = new THREE.InstancedMesh(L.geo, L.mat, L.cap);
  L.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  L.mesh.castShadow = L.ombre; L.mesh.receiveShadow = L.recoit;
  L.mesh.count = 0; L.mesh.visible = false;
  L.mesh.matrixAutoUpdate = false;                       // la série elle-même ne bouge pas : ses objets ont chacun leur place
  scene.add(L.mesh);
}
/* Ce qu'un objet dessine de loin (son modèle léger s'il en a un, sinon tout), avec la place de chaque morceau dans le monde
   et la boule qui l'entoure ; null s'il ne peut pas aller en série (une matière transparente : l'ordre de dessin compterait).
   Chaque forme a deux séries : celle qui fait de l'ombre (pour les objets dans la zone d'ombre du soleil) et celle qui n'en
   fait pas (les autres : three.js ne les dessinerait pas non plus dans l'ombre) */
const boite = new THREE.Box3(), sph = new THREE.Sphere(), mTmp = new THREE.Matrix4();
export function preparerSerie(g){
  g.updateMatrixWorld(true);
  let haut = null, ok = true;
  const morceaux = [];
  (function voir(o){
    if(o.isLOD){                                           // de loin : son modèle léger (le niveau 1), la même règle (chene.js)
      haut = o.userData.hauteur * o.matrixWorld.getMaxScaleOnAxis();
      voir(o.levels[1].object);
      return;
    }
    if(!o.visible) return;
    if(o.isMesh){
      const mats = [].concat(o.material);
      if(o.isInstancedMesh || mats.length !== 1 || mats[0].transparent || o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender){ ok = false; return; }
      morceaux.push({geo: o.geometry, mat: mats[0], ombre: o.castShadow, recoit: o.receiveShadow, m: Float32Array.from(o.matrixWorld.elements)});
    }
    for(const c of o.children) voir(c);
  })(g);
  if(!ok || !morceaux.length) return null;
  boite.makeEmpty();
  for(const p of morceaux){
    if(!p.geo.boundingSphere) p.geo.computeBoundingSphere();
    sph.copy(p.geo.boundingSphere).applyMatrix4(mTmp.fromArray(p.m));
    boite.expandByPoint(sph.center.clone().addScalar(sph.radius)); boite.expandByPoint(sph.center.clone().addScalar(-sph.radius));
  }
  const boule = boite.getBoundingSphere(new THREE.Sphere());
  const d = {haut, boule, morceaux: morceaux.map(p => {
    const seule = p.mat.colorWrite === false;                // ne fait que de l'ombre (les boules d'ombre des buissons)
    const avec = p.ombre ? lotDe(p.geo, p.mat, true, p.recoit) : null, sans = seule ? null : lotDe(p.geo, p.mat, false, p.recoit);
    for(const L of [avec, sans]) if(L){ L.besoin++; assez(L); }
    return {avec, sans, m: p.m};
  })};
  descr.set(g, d);
  return d;
}
/* un objet qui part (coupé, cueilli, refait) : sa place dans les séries est rendue */
export function oublierSerie(g){
  const d = descr.get(g);
  if(!d) return;
  for(const p of d.morceaux) for(const L of [p.avec, p.sans]) if(L) L.besoin--;
  descr.delete(g);
}
/* À chaque image (montrerChamp) : d'abord les candidats, puis on décide (finSeries) */
let image = 0;
const candidats = [];                                      // [g, d, ombre] de cette image
let actives = false;
export function debutSeries(){ image++; candidats.length = 0; for(const L of lots.values()){ L.n = 0; L.compte = 0; } }
/* sans séries (vu de dessus, ou un essai) : celles de l'image d'avant ne se dessinent plus */
export function effacerSeries(){
  if(!actives) return;
  image++; actives = false;
  for(const L of lots.values()) if(L.mesh && L.n){ L.n = 0; L.mesh.count = 0; L.mesh.visible = false; }
}
/* dCam : sa distance à la caméra ; il va en série quand il prend son modèle léger (petit à l'écran : petitALEcran, la même
   règle que chene.js), ou au-delà de PRES_SEUL P s'il n'en a pas ; champ, soleil : le champ de la caméra et la zone
   d'ombre du soleil. Rend vrai si l'objet est candidat à la série (il ne se dessine pas lui-même, sauf si finSeries le
   rend). Seulement s'il est vraiment dans le champ (sinon three.js l'écarte lui-même, morceau par morceau, et le dessine
   seulement dans l'ombre s'il le faut) ; son ombre, seulement dans la zone d'ombre */
export function ajouterEnSerie(g, dCam, camera, champ, soleil){
  const d = descr.get(g);
  if(!d || !(d.haut ? petitALEcran(d.haut, dCam, camera) : dCam > PRES_SEUL) || !champ.intersectsSphere(d.boule)) return false;
  const ombre = soleil.intersectsSphere(d.boule);
  for(const p of d.morceaux){ const L = ombre && p.avec || p.sans; if(L) L.compte++; }
  candidats.push(g, d, ombre);
  return true;
}
/* Une série ne sert que si au moins deux objets la partagent dans cette image (sinon elle coûte plus qu'elle ne rapporte :
   mesuré vue de dessus) ; les autres candidats se redessinent eux-mêmes, comme avant */
export function finSeries(){
  actives = true;
  for(let k = 0; k < candidats.length; k += 3){
    const g = candidats[k], d = candidats[k + 1], ombre = candidats[k + 2];
    let utile = true;
    for(const p of d.morceaux){ const L = ombre && p.avec || p.sans; if(L && L.compte < 2) utile = false; }
    if(!utile){ g.visible = true; continue; }
    d.vu = image;
    for(const p of d.morceaux){
      const L = ombre && p.avec || p.sans;
      if(!L) continue;
      if(L.n >= L.cap){ L.besoin = Math.max(L.besoin, L.n + 1); const garde = L.mesh.instanceMatrix.array.slice(0, L.n * 16); assez(L); L.mesh.instanceMatrix.array.set(garde); }
      L.mesh.instanceMatrix.array.set(p.m, L.n * 16);
      L.n++;
    }
  }
  for(const L of lots.values()){
    if(!L.mesh) continue;
    L.mesh.count = L.n; L.mesh.visible = L.n > 0;
    if(L.n){ L.mesh.instanceMatrix.updateRange.count = L.n * 16; L.mesh.instanceMatrix.needsUpdate = true; }
  }
}
/* Pour la vérification : cet objet est-il dessiné (lui-même, ou dans une série) ? combien de séries, d'objets en série */
export const dessine = g => { if(g.visible) return true; const d = descr.get(g); return !!d && d.vu === image; };
export const bouleDe = g => { const d = descr.get(g); return d && d.boule; };
export function seriesIci(){ let s = 0, n = 0; for(const L of lots.values()) if(L.n){ s++; n += L.n; } return {series: s, instances: n, formes: nLots}; }
