/* ================= Plans de travail =================
   Dans la pièce d'un bâtiment, son plan de travail (l'établi de la Scierie…) :
   en s'en approchant, un bouton ouvre sa fiche ; « Fabriquer » ajoute une recette à la file d'attente.
   La fabrication avance en temps réel, même jeu fermé ; ce qui est fini va tout seul dans le sac (ou dans un
   coffre de réserve si le sac est plein) ; s'il n'y a de place nulle part, c'est prêt mais ça attend ici.
   File d'un bâtiment : b.atelier.queue = [{out, n, in, t, start, end}], une recette après l'autre.
   Le comptoir du Marché (vente) : ce qu'on vend part tout de suite et l'or arrive aussitôt dans la bourse,
   sans file d'attente (demande de Yo, v1.6.5) ; le bonus du Marché compte.
   Une recette verrouillée (lock) est affichée avec sa raison, sans bouton (fourneau, enclume, trône).
   Le comptoir vend aussi les poissons et les plats qu'on possède (étape 1.6) : un par un, ou tous d'un coup
   (sauf les légendaires) ; une recette peut demander un ingrédient « au choix » (un poisson : voir payer). */
import { $ } from "./outils.js";
import { B, ATELIERS, POISSONS, INSECTES, OISEAUX, objet, icone } from "./donnees.js";
import { state, save } from "./sauvegarde.js";
import { owned, addOwned, hasAll, queueSlots, placeFor, gain, payer } from "./regles.js";
import { footOf, hasPlan } from "./monde/meubles.js";
import { player } from "./monde/personnage.js";
import { openSheet, toast, wrap, renderHUD } from "./interface.js";
import { currentPlace } from "./lieux.js";
import { barreAuto, utilisable } from "./barre.js";

/* ----- Noms et images de ce qu'on fabrique ou utilise ----- */
const info = k => { const o = objet(k); return {nom: o.nom, pluriel: o.pluriel || o.nom, emoji: o.emoji}; };
const label = (k, n) => n > 1 ? `${n} ${info(k).pluriel}` : info(k).nom;
const many = (k, n) => `${n} ${n > 1 ? info(k).pluriel : POISSONS[k] && POISSONS[k].rarete === "legendaire" ? info(k).nom : info(k).nom.toLowerCase()}`;   // « 6 pierres », « 1 gardon », « 1 or »
/* Le nom d'une recette (ou d'une vente : « 6 bois → 1 or ») */
const nameOf = (a, r) => r.nom && r.out ? `${r.nom}${a.vente ? ` → ${many(r.out, r.n || 1)}` : ""}` : a.vente ? Object.entries(r.in).map(([k, v]) => many(k, v)).join(" + ") + ` → ${many(r.out, r.n || 1)}` : label(r.out, r.n || 1);
const emojiOf = (a, r) => r.icone || icone(a.vente ? Object.keys(r.in)[0] : r.out);
const duree = s => s < 60 ? `${Math.ceil(s)} s` : `${Math.floor(s / 60)} min${s % 60 ? " " + Math.round(s % 60) : ""}`;

/* ----- La file d'attente ----- */
const queueOf = b => (b.atelier || (b.atelier = {queue: []})).queue;
/* Une recette après l'autre : chaque recette commence quand la précédente finit */
function chain(q){
  const now = Date.now();
  let t = 0;
  q.forEach((j, i) => {
    const running = i === 0 && j.start > 0 && j.start <= now;      // une recette toute neuve a start = 0
    if(!running){ j.start = Math.max(now, t); j.end = j.start + j.t * 1000; }
    t = j.end;
  });
}
/* Les recettes d'un plan de travail (key : pour les retrouver au toucher) ; le comptoir y ajoute la vente des
   poissons et des plats qu'on possède, avec leur prix (POISSONS, PRODUITS) */
const CHASSE_VENTE = ["viandeGibier", "fourrureDouce", "fourrure", "fourrureRousse", "plumesColorees", "plumes", "cuir", "boisDeCerf"];
const MONSTRES_VENTE = ["croc", "fourrureGrise", "defense", "cuirEpais", "aileMembraneuse"];
const FORET_VENTE = ["boisCharme", "boisFrene", "boisIf", "boisChene", "baiesHoux", "fleursSureau", "baiesSureau"];
const VENDABLES = () => [...Object.keys(POISSONS), ...Object.keys(INSECTES), ...Object.keys(OISEAUX), "poissonGrille"];
function recettesDe(b){
  const a = ATELIERS[b.type], list = a.recettes.map((r, i) => ({...r, key: "r" + i}));
  if(!a.vente) return list;
  const cat = "Prises et plats", aVendre = VENDABLES().filter(k => owned(k) > 0), tous = {};
  for(const k of aVendre) if(!(POISSONS[k] && POISSONS[k].rarete === "legendaire")) tous[k] = owned(k);
  const nb = Object.values(tous).reduce((n, v) => n + v, 0);
  if(nb > 1) list.push({key: "tout", cat, tout: true, nom: `Toutes tes prises et tes plats (${nb}), sauf les légendaires`, icone: "🐟",
    out: "or", n: Object.entries(tous).reduce((s, [k, v]) => s + v * objet(k).prix, 0), in: tous, lvl: 1});
  for(const k of aVendre) list.push({key: "v:" + k, cat, out: "or", n: objet(k).prix, in: {[k]: 1}, lvl: 1});
  /* les bois et la cueillette de la Forêt profonde (pas dans « Tout vendre » : on les garde souvent) */
  for(const k of FORET_VENTE) if(owned(k) > 0) list.push({key: "v:" + k, cat: "La Forêt profonde", out: "or", n: objet(k).prix, in: {[k]: 1}, lvl: 1});
  /* la chasse (morceau 5) : la viande et les peaux, en attendant le potager et l'équipement (décidé par Yo) */
  for(const k of CHASSE_VENTE) if(owned(k) > 0) list.push({key: "v:" + k, cat: "La chasse", out: "or", n: objet(k).prix, in: {[k]: 1}, lvl: 1});
  /* ce que laissent les monstres de la grotte (étape 1.8), en attendant l'équipement et les potions */
  for(const k of MONSTRES_VENTE) if(owned(k) > 0) list.push({key: "v:" + k, cat: "Les monstres", out: "or", n: objet(k).prix, in: {[k]: 1}, lvl: 1});
  return list;
}
/* Vendre au comptoir : tout de suite (demande de Yo) ; l'or va dans la bourse, avec le bonus du Marché */
function vendre(a, b, r){
  if(r.lock || b.lvl < r.lvl || !hasAll(r.in)) return;
  const pris = payer(r.in), n = gain(r.n || 1, r.out);
  addOwned(r.out, n);
  save(); renderHUD();
  const nb = Object.values(pris).reduce((s, v) => s + v, 0);
  const quoi = r.tout ? `${nb} prises et plats` : Object.entries(pris).map(([k, v]) => many(k, v)).join(", ");
  toast(`${a.emoji} Vendu : ${quoi}. Tu gagnes ${info(r.out).emoji} ${many(r.out, n)}`, 2600);
}
function fabriquer(b, r){
  if(ATELIERS[b.type].vente){ vendre(ATELIERS[b.type], b, r); return; }
  const q = queueOf(b);
  if(r.lock || b.lvl < r.lvl || q.length >= queueSlots(b.lvl) || !hasAll(r.in)) return;
  const pris = payer(r.in);                           // un poisson « au choix » : on note lequel, pour pouvoir le rendre
  q.push({out: r.out, n: r.n || 1, in: pris, t: r.t, start: 0, end: 0, ...(r.nom ? {nom: r.nom} : {})});
  chain(q); save(); renderHUD();
}
function annuler(b, i){
  const q = queueOf(b), j = q[i];
  if(!j) return;
  if(Object.entries(j.in).some(([k, v]) => placeFor(k) < v)){ toast("Fais de la place dans ton sac ou un coffre pour reprendre les ingrédients", 3000); return; }
  for(const [k, v] of Object.entries(j.in)) addOwned(k, v);       // ingrédients rendus
  q.splice(i, 1);
  chain(q); save(); renderHUD();
}
/* Ce qui est fini (aussi jeu fermé) va dans le sac, ou dans un coffre si le sac est plein ; l'or d'une vente
   va dans la bourse. S'il n'y a de place nulle part, c'est prêt mais ça attend ici (et on le dit une fois). */
let attente = false;
function livrer(){
  const now = Date.now(), faits = [];
  let bloque = false;
  for(const b of state.buildings){
    const q = b.atelier && b.atelier.queue;
    while(q && q.length && (q[0].end <= now || ATELIERS[b.type].vente)){   // une vente d'avant la v1.6.5 : livrée tout de suite
      const j = q[0];
      if(ATELIERS[b.type].vente && !j.bonus){ j.n = gain(j.n, j.out); j.bonus = true; }   // une vente : le bonus du Marché
      const r = addOwned(j.out, j.n);
      if(r.sac && utilisable(j.out)) barreAuto(j.out);     // un nouvel outil prend une case rapide libre
      if(r.sac || r.coffre || r.bourse) faits.push({b, j, sac: r.sac, coffre: r.coffre, bourse: r.bourse || 0});
      if(r.reste){ j.n = r.reste; bloque = true; break; }
      q.shift();
    }
  }
  if(bloque && !attente) toast("🗃️ Ton sac et tes coffres sont pleins : ce qui est prêt attend au plan de travail. Fabrique un coffre de réserve.", 4200);
  attente = bloque;
  if(!faits.length) return false;
  save(); renderHUD();
  const parAtelier = new Map();                       // un message par plan de travail, quantités additionnées
  const add = (m, k, n) => { if(n > 0) m.set(k, (m.get(k) || 0) + n); };
  for(const {b, j, sac, coffre, bourse} of faits){
    const a = ATELIERS[b.type];
    if(!parAtelier.has(a)) parAtelier.set(a, {sac: new Map(), coffre: new Map(), bourse: new Map()});
    const d = parAtelier.get(a);
    add(d.sac, j.out, sac); add(d.coffre, j.out, coffre); add(d.bourse, j.out, bourse);
  }
  for(const [a, d] of parAtelier){
    const list = m => [...m].map(([k, n]) => a.vente ? `${info(k).emoji} ${many(k, n)}` : label(k, n)).join(", ");
    const sac = list(d.sac), coffre = list(d.coffre);
    toast(a.vente ? `${a.emoji} Vendu : tu gagnes ${list(d.bourse)}`
      : sac && coffre ? `${a.emoji} C'est prêt : ${sac} dans ton sac, ${coffre} dans un coffre (sac plein)`
      : sac ? `${a.emoji} ${sac} : c'est prêt, dans ton sac`
      : `${a.emoji} ${coffre} : c'est prêt, dans un coffre (ton sac est plein)`, 3200);
  }
  return true;
}
setInterval(() => { if(livrer() && openFor) render(); }, 1000);

/* ----- Le bouton du plan de travail, quand on est tout près ----- */
const btn = $("#btn-plan");
export function updatePlan(active){
  const place = active && currentPlace(), a = place && ATELIERS[place.b.type];
  let near = false;
  if(a){
    const it = place.b.deco && place.b.deco.items.find(o => o.type === a.meuble);
    if(it){
      const [w, d] = footOf(it), p = player.position;
      near = Math.abs(p.x - it.x) < w/2 + .8 && Math.abs(p.z - it.z) < d/2 + .8;
    }
  }
  if(near){ const txt = `${a.emoji} ${a.nom}`; if(btn.textContent !== txt) btn.textContent = txt; }
  if(btn.hidden === near) btn.hidden = !near;
}

/* ----- La fiche du plan de travail ----- */
let openFor = null;                    // le bâtiment dont la fiche est ouverte
const chip = (k, need) => `<span class="chip ${owned(k) >= need ? "" : "short"}">${icone(k)} ${owned(k)}/${need}</span>`;
function fileHTML(b){
  const q = queueOf(b), now = Date.now(), a = ATELIERS[b.type];
  if(!q.length) return `<p class="muted" style="margin:4px 0">Rien en cours.</p>`;
  return q.map((j, i) => {
    const running = j.start <= now, pct = running ? Math.min(100, (now - j.start) / (j.end - j.start) * 100) : 0;
    return `<div class="job"><span class="job-name">${emojiOf(a, j)} ${nameOf(a, j)}</span>
      <span class="job-bar"><i style="width:${pct.toFixed(1)}%"></i></span>
      <span class="job-time">${j.end <= now ? "prêt : fais de la place" : running ? duree(Math.max(0, (j.end - now) / 1000)) : "en attente"}</span>
      <button class="btn ghost job-x" data-annuler="${i}" aria-label="Annuler">✕</button></div>`;
  }).join("");
}
function render(){
  const b = openFor, a = ATELIERS[b.type], q = queueOf(b), full = q.length >= queueSlots(b.lvl), recs = recettesDe(b);
  const waiting = a.recettes.every(r => r.lock);      // plan de travail en attente : tout est verrouillé
  openSheet(`<div class="sh-head"><h2 class="display">${a.emoji} ${a.nom}</h2><button class="btn ghost" data-close>Fermer</button></div>
    <p class="muted" style="margin:0 0 6px">${B[b.type].nom} niveau ${b.lvl}. ${a.note ? a.note + " " : ""}${waiting
      ? `Ses ${a.titre ? a.titre.toLowerCase() : "recettes"} arrivent bientôt.`
      : a.vente ? "Ce que tu vends part tout de suite, et l'or arrive aussitôt dans ta bourse."
      : "Ce qui est fini va tout seul dans ton sac (ou dans un coffre de réserve s'il est plein), même jeu fermé."}</p>
    ${waiting || a.vente ? "" : `<h3 style="margin:10px 0 2px">En cours (${q.length} sur ${queueSlots(b.lvl)})</h3><div id="atelier-file">${fileHTML(b)}</div>`}
    <h3 style="margin:14px 0 2px">${a.titre || (a.vente ? "Ventes" : "Recettes")}</h3>` +
    recs.map((r, i) => {
      /* Recettes rangées par catégorie (Matériaux, Outils, Meubles) quand elles en ont une */
      const head = r.cat && r.cat !== (recs[i - 1] || {}).cat ? `<h4 class="rec-cat">${r.cat}</h4>` : "";
      return head + recetteHTML(b, a, r, full);
    }).join("") +
    (a.vente && !recs.some(r => r.cat === "Prises et plats") ? `<h4 class="rec-cat">Prises et plats</h4><p class="hint-box">Pêche à l'étang ou en mer, attrape des insectes et des oiseaux au filet : tes prises se vendront ici, chacune à son prix.</p>` : ""));
}
function recetteHTML(b, a, r, full){
  if(r.lock) return `<div class="brow"><div class="be" aria-hidden="true">${r.emoji}</div>
    <div class="bt"><span class="bn">${r.nom}</span><p>🔒 ${r.lock}</p></div>
    <button class="btn primary" disabled>Bientôt</button></div>`;
  const plein = full && !a.vente;                     // le comptoir n'a pas de file : on vend tout de suite
  const locked = b.lvl < r.lvl, ok = !locked && !plein && hasAll(r.in);
  const why = locked ? `Niveau ${r.lvl}` : plein ? "File pleine" : a.vente ? "Vendre" : "Fabriquer";
  return `<div class="brow"><div class="be" aria-hidden="true">${emojiOf(a, r)}</div>
    <div class="bt"><span class="bn">${nameOf(a, r)}</span>
      ${a.vente ? "" : `<p>⏱ ${duree(r.t)} · tu en as : ${owned(r.out)}</p>`}
      <div>${r.tout ? "" : Object.entries(r.in).map(([k, v]) => chip(k, v)).join("")}</div></div>
    <button class="btn primary" data-fab="${r.key}" ${ok ? "" : "disabled"}>${r.tout ? "Tout vendre" : why}</button></div>`;
}
/* Ouvre la fiche du plan de travail d'un bâtiment (son bouton, ou « Fabriquer » dans le catalogue) */
export function openAtelier(b){
  if(!b || !hasPlan(b)) return;
  openFor = b;
  render();
}
btn.addEventListener("click", () => { const place = currentPlace(); if(place) openAtelier(place.b); });
wrap.addEventListener("click", e => {
  if(!openFor) return;
  const fab = e.target.closest("[data-fab]"), ann = e.target.closest("[data-annuler]");
  if(fab){ const r = recettesDe(openFor).find(x => x.key === fab.dataset.fab); if(r) fabriquer(openFor, r); render(); }
  else if(ann){ annuler(openFor, +ann.dataset.annuler); render(); }
});
/* Pendant que la fiche est ouverte : les barres de progression avancent (sans recréer les boutons) */
setInterval(() => {
  if(!openFor) return;
  if(wrap.hidden){ openFor = null; return; }
  const f = document.getElementById("atelier-file"), q = queueOf(openFor), now = Date.now();
  if(!f) return;
  const rows = f.querySelectorAll(".job");
  if(rows.length !== q.length){ f.innerHTML = fileHTML(openFor); return; }
  q.forEach((j, i) => {
    const running = j.start <= now;
    rows[i].querySelector(".job-bar i").style.width = (running ? Math.min(100, (now - j.start) / (j.end - j.start) * 100) : 0).toFixed(1) + "%";
    rows[i].querySelector(".job-time").textContent = j.end <= now ? "prêt : fais de la place" : running ? duree(Math.max(0, (j.end - now) / 1000)) : "en attente";
  });
}, 500);

livrer();                              // ce qui s'est fini pendant que le jeu était fermé
