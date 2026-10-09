/* ================= Le ciel, le jour et la nuit (étape 1.10, morceau 1) =================
   Bible : « Lumière : elle suit le vrai jour (aube rosée, midi doré, soir orangé). La nuit est bleutée mais lisible,
   avec les fenêtres allumées ; l'obscurité qui fait peur reste dans les grottes. » La lumière de l'île suit l'heure du
   téléphone : des moments clés (MOMENTS : la couleur du ciel et de la brume, la lumière du ciel et du sol, le soleil
   ou la lune), et entre deux, un mélange doux. Le soleil tourne : il se lève à l'est (à droite), passe au sud et se
   couche à l'ouest ; la nuit, la lune éclaire en bleu. La nuit, les vitres des bâtiments s'allument (VITRE, dans
   batiments.js) et les lanternes brillent et éclairent autour d'elles. La Forêt profonde suit aussi l'heure
   (nuitForet, dans interieurs.js) ; rien ne change dans les maisons, la mine ni la grotte. */
import { scene, sun, hemi } from "./scene.js";

/* Les moments clés (heure : 0 à 24) ; ciel = fond et brume ; haut et bas = la lumière qui vient du ciel et du sol ;
   force : la lumière ambiante ; astre : la couleur et la force du soleil (ou de la lune) */
const MOMENTS = [
  {h: 0,    ciel: 0x26355E, haut: 0x6A80C0, bas: 0x2A3A58, force: .62, astre: 0xA8BEFF, fort: .28},   // la nuit, bleutée
  {h: 5,    ciel: 0x26355E, haut: 0x6A80C0, bas: 0x2A3A58, force: .62, astre: 0xA8BEFF, fort: .28},
  {h: 6.5,  ciel: 0xF4BEB4, haut: 0xFFC2BE, bas: 0x8A7480, force: .58, astre: 0xFF9C90, fort: .55},   // l'aube, rosée
  {h: 8.5,  ciel: 0xA9E3EC, haut: 0xFFFFFF, bas: 0x7A9A6A, force: .62, astre: 0xFFF3DC, fort: .82},   // le jour
  {h: 13,   ciel: 0xB4E4EA, haut: 0xFFF6E4, bas: 0x86A06A, force: .64, astre: 0xFFE6B0, fort: .92},   // midi, doré
  {h: 17,   ciel: 0xA9E3EC, haut: 0xFFFFFF, bas: 0x7A9A6A, force: .62, astre: 0xFFF3DC, fort: .82},
  {h: 19,   ciel: 0xF6B47E, haut: 0xFFB27A, bas: 0x8A6448, force: .56, astre: 0xFF7E3A, fort: .72},   // le soir, orangé
  {h: 20.5, ciel: 0x6A5E96, haut: 0x9A8EC8, bas: 0x3A3A5C, force: .58, astre: 0xC88AB0, fort: .32},   // le crépuscule
  {h: 22,   ciel: 0x26355E, haut: 0x6A80C0, bas: 0x2A3A58, force: .62, astre: 0xA8BEFF, fort: .28},
  {h: 24,   ciel: 0x26355E, haut: 0x6A80C0, bas: 0x2A3A58, force: .62, astre: 0xA8BEFF, fort: .28}
];
/* La nuit : 0 en plein jour, 1 en pleine nuit (les vitres, les lanternes, la forêt) */
const nuitDe = h => h < 5 || h >= 22 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 19.5 ? 0 : (h - 19.5) / 2.5;

/* L'heure (décimale) : celle du téléphone, sauf si on la force (pour la vérification et les essais) */
let forcee = null;
export function forcerHeure(h){ forcee = h; }
export const heure = () => { if(forcee !== null) return forcee; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

/* Les vitres et les lanternes : elles s'allument la nuit */
export const VITRE = new THREE.MeshLambertMaterial({color: 0x9DB4D8, emissive: 0xFFC46A, emissiveIntensity: 0});
const lampes = [];        // {halo (un rond de lumière chaude), mat (la matière qui brille), base (son éclat le jour)}
/* Le halo d'une lanterne, la nuit : un rond de lumière chaude et doux (une lumière qui éclaire vraiment faisait une tache
   blanche sur l'eau, et coûte cher à un téléphone) */
const HALO = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,214,140,.9)"); g.addColorStop(.35, "rgba(255,180,90,.35)"); g.addColorStop(1, "rgba(255,160,70,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
/* Une lanterne : sa matière brille plus fort la nuit ; avec une place (x, y, z), un halo chaud l'entoure */
export function lanterne(x, y, z, mat){
  let halo = null;
  if(x !== null){
    halo = new THREE.Sprite(new THREE.SpriteMaterial({map: HALO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0}));
    halo.position.set(x, y, z); halo.scale.set(1.5, 1.5, 1); halo.visible = false; scene.add(halo);
  }
  lampes.push({halo, mat, base: mat ? mat.emissiveIntensity : 0});
}

const ca = new THREE.Color(), cb = new THREE.Color();
const mix = (a, b, t, out) => out.setHex(a).lerp(cb.setHex(b), t);
let nuit = 0;
export const nuitIci = () => nuit;
/* À chaque image (main.js) ; cx, cz : le point que regarde la caméra (le soleil le suit, pour ses ombres) */
export function updateCiel(cx, cz){
  const h = heure();
  let k = 0;
  while(k < MOMENTS.length - 2 && MOMENTS[k + 1].h <= h) k++;
  const A = MOMENTS[k], B = MOMENTS[k + 1], t = Math.min(1, Math.max(0, (h - A.h) / (B.h - A.h)));
  mix(A.ciel, B.ciel, t, scene.background); scene.fog.color.copy(scene.background);
  mix(A.haut, B.haut, t, hemi.color); mix(A.bas, B.bas, t, hemi.groundColor);
  hemi.intensity = A.force + (B.force - A.force) * t;
  mix(A.astre, B.astre, t, sun.color);
  sun.intensity = A.fort + (B.fort - A.fort) * t;
  /* le soleil : de l'est (6 h) à l'ouest (20 h), haut à midi ; la nuit, la lune, haute vers le sud-est */
  nuit = nuitDe(h);
  const jour = Math.min(1, Math.max(0, (h - 6) / 14)), a = Math.PI * jour;
  const sx = nuit >= 1 ? 4 : Math.cos(a) * 10, sy = nuit >= 1 ? 14 : 5 + Math.sin(a) * 11;
  sun.position.set(cx + sx, sy, cz + 5);
  sun.target.position.set(cx, 0, cz);
  /* les vitres et les lanternes */
  VITRE.emissiveIntensity = nuit * .95;
  for(const l of lampes){
    if(l.halo){ l.halo.visible = nuit > .02; l.halo.material.opacity = nuit * .8; }
    if(l.mat) l.mat.emissiveIntensity = l.base + nuit * .6;
  }
}
