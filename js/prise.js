/* ================= La prise montrée =================
   Demande de Yo (5 novembre 2026 : « quand on pêche un poisson, attrape un papillon ou un oiseau, le personnage le lève […]
   Un peu comme dans Animal Crossing » ; ses choix : les points 1 à 4 et 6). Le poisson, l'insecte ou l'oiseau pris :
   1. le personnage se tourne vers nous et le lève à deux mains au-dessus de sa tête ; le poisson gigote, la bête bouge ;
   2. la caméra se rapproche, une petite pause (on ne bouge pas ; un toucher la passe) ;
   3. une bulle au-dessus de sa tête, avec la phrase de la bête (phrases.js) et la taille du poisson ;
   4. « Nouveau ! » et des étincelles pour une bête qu'on n'avait pas encore, une couronne pour un record de taille ;
   6. à la première personne, les deux mains la lèvent devant soi (mains.js).
   Elle avance avec la récolte (updateRecolte, recolte.js), comme les prises d'avant : la vérification la fait défiler. */
import { camera, renderer } from "./monde/scene.js";
import { player, poserPrise } from "./monde/personnage.js";
import { view } from "./commandes.js";
import { premiereActive } from "./vue.js";

const DUREE = 1.9, MONTEE = .3, FIN = .25;
let prise = null;                    // {mesh, t, leve, sorte}
export const priseEnCours = () => !!prise;
/* De 0 (rien) à 1 (la prise levée au plus haut) : la caméra (main.js) et les mains (mains.js) la suivent */
export const leveePrise = () => prise ? prise.leve : 0;
const lisse = t => t * t * (3 - 2 * t);

const bulle = document.createElement("div");
bulle.id = "prise"; bulle.hidden = true;
document.body.appendChild(bulle);
/* un toucher passe la pause (et ne fait rien d'autre : ni marcher, ni relancer) */
for(const type of ["pointerdown", "click"]) window.addEventListener(type, e => {
  if(!prise) return;
  e.stopPropagation(); e.preventDefault();
  if(type === "pointerdown" && prise.t > .35) prise.t = Math.max(prise.t, DUREE - FIN);
}, true);

/* Montrer une prise : mesh (son modèle, ajouté à scene), sorte (« poisson », « insecte », « oiseau »), la phrase, des détails
   (la taille…), nouveau (au carnet), record (de taille) */
export function montrerPrise({mesh, scene, sorte, phrase, details = [], nouveau = false, record = false}){
  finirPrise();
  scene.add(mesh);
  prise = {mesh, t: 0, leve: 0, sorte};
  const marque = nouveau ? `<b class="nouveau">Nouveau !</b>` : record ? `<b class="record">👑 Record !</b>` : "";
  const etincelles = nouveau ? [0, 1, 2, 3, 4, 5].map(k => `<i class="etincelle" style="--k:${k}">✦</i>`).join("") : "";
  bulle.innerHTML = `${marque}<p>${phrase}</p>${details.map(d => `<small>${d}</small>`).join("")}${etincelles}`;
  bulle.classList.toggle("haut", premiereActive());
  bulle.hidden = false;
  placer();
}
export function finirPrise(){
  if(!prise) return;
  if(prise.mesh.parent) prise.mesh.parent.remove(prise.mesh);
  prise = null;
  bulle.hidden = true;
  poserPrise(0);
}
const v = new THREE.Vector3();
function placer(){
  const {mesh: m, t, leve, sorte} = prise;
  if(premiereActive()){                                // devant les yeux, entre les deux mains
    camera.getWorldDirection(v);
    const a = Math.atan2(v.x, v.z);
    m.position.set(camera.position.x + Math.sin(a) * 1.35, camera.position.y - .45 + .35 * leve, camera.position.z + Math.cos(a) * 1.35);
    m.rotation.set(0, a + Math.PI, 0);
  } else {                                             // au-dessus de la tête, un peu vers nous
    const L = view.lacetIci || 0;
    m.position.set(player.position.x + Math.sin(L) * .1, (sorte === "oiseau" ? .5 : .7) + .55 * leve, player.position.z + Math.cos(L) * .1);
    m.rotation.set(sorte === "insecte" ? .5 : 0, L + (sorte === "oiseau" ? Math.PI : 0), 0);
    const r = renderer.domElement.getBoundingClientRect();
    v.set(player.position.x, 1.75, player.position.z).project(camera);
    bulle.style.left = `${Math.max(120, Math.min(r.width - 120, r.left + (v.x + 1) / 2 * r.width))}px`;
    bulle.style.top = `${Math.max(70, r.top + (1 - v.y) / 2 * r.height)}px`;
  }
  /* le poisson gigote, la bête bouge doucement */
  if(sorte === "poisson") m.rotation.z = Math.sin(t * 9) * .2 * Math.max(.25, 1 - t / 1.2);
  else m.position.y += Math.sin(t * 6) * .02;
}
/* À chaque image (recolte.js) */
export function updatePrise(dt){
  if(!prise) return;
  prise.t += dt;
  const t = prise.t;
  prise.leve = lisse(Math.min(1, t / MONTEE)) * lisse(Math.min(1, Math.max(0, (DUREE - t) / FIN)));
  poserPrise(prise.leve);
  placer();
  bulle.style.opacity = Math.min(1, t / .15, (DUREE - t) / FIN);
  if(t >= DUREE) finirPrise();
}
