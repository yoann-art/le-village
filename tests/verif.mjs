/* ================= Le lanceur de la vérification =================
   Utilisé par GitHub à chaque envoi (.github/workflows/verification.yml) : ouvre le jeu dans un navigateur
   sans écran, à la taille d'un téléphone, attend qu'il soit chargé, joue les gestes de tests/verif-page.js,
   note toute erreur du jeu, garde une capture d'écran (capture.png), et s'arrête en erreur si quelque chose
   ne va pas (croix rouge sur GitHub). Le jeu doit être servi sur http://localhost:8000.
   Sur le PC (pour refaire une vérification de GitHub, où le jeu tourne vraiment pendant l'essai) :
   npm install --no-save playwright@1.47.2, puis NAVIGATEUR=msedge node tests/verif.mjs (le serveur « jeu » lancé). */
import { chromium } from "playwright";

const erreurs = [];
/* Sur GitHub : le Chromium de Playwright. Sur le PC de Yo, son Chromium ne démarre pas : NAVIGATEUR=msedge prend Edge */
const browser = await chromium.launch({args: ["--enable-unsafe-swiftshader"], ...(process.env.NAVIGATEUR ? {channel: process.env.NAVIGATEUR} : {})});
const page = await browser.newPage({viewport: {width: 375, height: 812}});
page.on("pageerror", e => erreurs.push(`✗ Erreur du jeu : ${e.message}`));
page.on("console", m => {
  if(m.type() === "error" && !(m.location().url || "").endsWith("favicon.ico")) erreurs.push(`✗ Message d'erreur : ${m.text()}`);
});

let r = {ok: [], erreurs: []};
try {
  await page.goto("http://localhost:8000/", {waitUntil: "load"});
  await page.waitForFunction(() => /^v\d/.test(document.getElementById("version").textContent), null, {timeout: 30000});
  await page.waitForTimeout(1500);
  r = await page.evaluate(async () => (await import("/tests/verif-page.js")).verifier());
} catch(e){
  erreurs.push(`✗ Le jeu ne se charge pas : ${e.message}`);
}
await page.screenshot({path: "capture.png"});

/* Le format paysage (demande de Yo, 13 octobre 2026) : le téléphone tourné, la partie jouée ci-dessus ; le joystick, les cases
   rapides et les boutons ne se gênent pas, tout tient dans l'écran, le sac s'ouvre et tient dans la hauteur */
const paysage = await browser.newPage({viewport: {width: 812, height: 375}, isMobile: true, hasTouch: true});
paysage.on("pageerror", e => erreurs.push(`✗ Erreur du jeu (en paysage) : ${e.message}`));
try {
  await paysage.goto("http://localhost:8000/", {waitUntil: "load", timeout: 90000});   // la machine de GitHub est parfois lente (v2.1.50 : 30 s dépassées)
  await paysage.waitForFunction(() => /^v\d/.test(document.getElementById("version").textContent), null, {timeout: 60000});
  await paysage.waitForTimeout(1500);
  const p = await paysage.evaluate(async () => {
    const boite = s => { const e = document.querySelector(s); if(!e || e.hidden) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; };
    const croise = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const dedans = b => !b || b.left >= 0 && b.top >= 0 && b.right <= innerWidth && b.bottom <= innerHeight;
    const joy = boite("#joy"), barre = boite("#barre"), actions = boite("#actions");
    const soucis = [];
    if(croise(joy, barre)) soucis.push("le joystick touche les cases rapides");
    if(croise(joy, actions) || croise(barre, actions)) soucis.push("les boutons touchent le joystick ou les cases rapides");
    for(const [n, b] of [["le joystick", joy], ["les cases rapides", barre], ["les boutons", actions]]) if(!dedans(b)) soucis.push(`${n} dépasse de l'écran`);
    document.querySelector("#btn-sac").click();
    await new Promise(r => setTimeout(r, 500));
    const sac = boite("#sheet");
    if(!sac || sac.height > innerHeight) soucis.push("le sac ne tient pas dans la hauteur de l'écran");
    return soucis;
  });
  if(p.length) erreurs.push(`✗ Le format paysage : ${p.join(" ; ")}`);
  else r.ok.push("✓ Le format paysage : le joystick, les cases rapides et les boutons ne se gênent pas, le sac tient dans l'écran");
  await paysage.screenshot({path: "capture-paysage.png"});
} catch(e){
  erreurs.push(`✗ Le jeu ne se charge pas en paysage : ${e.message}`);
}
await browser.close();

console.log(r.ok.join("\n"));
const tout = [...erreurs, ...r.erreurs];
/* Sur GitHub, le résultat devient aussi une « annotation », lisible par tous sur un dépôt public :
   c'est là que Claude le lit (tâche programmée « Surveiller la vérification du jeu ») */
const note = (type, msg) => { if(process.env.GITHUB_ACTIONS) console.log(`::${type} title=Vérification du jeu::${msg.replace(/%/g, "%25").replace(/\r?\n/g, "%0A")}`); };
if(tout.length){
  console.log("\n" + tout.join("\n"));
  for(const e of tout) note("error", e);
  process.exit(1);
}
note("notice", `Tout va bien : ${r.ok.length} gestes réussis`);
console.log("\nTout va bien : le jeu se charge et les gestes de base marchent.");
