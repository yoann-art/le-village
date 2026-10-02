/* ================= Le lanceur de la vérification =================
   Utilisé par GitHub à chaque envoi (.github/workflows/verification.yml) : ouvre le jeu dans un navigateur
   sans écran, à la taille d'un téléphone, attend qu'il soit chargé, joue les gestes de tests/verif-page.js,
   note toute erreur du jeu, garde une capture d'écran (capture.png), et s'arrête en erreur si quelque chose
   ne va pas (croix rouge sur GitHub). Le jeu doit être servi sur http://localhost:8000. */
import { chromium } from "playwright";

const erreurs = [];
const browser = await chromium.launch({args: ["--enable-unsafe-swiftshader"]});
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
