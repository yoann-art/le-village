/* ================= Toujours la dernière version =================
   Le téléphone garde parfois une ancienne copie du jeu. Deux protections :
   1. sw.js redemande chaque fichier du jeu au serveur à chaque ouverture ;
   2. quand on revient sur le jeu resté ouvert, on compare le numéro de version
      en ligne à celui affiché, et on recharge la page s'il a changé. */
import { VERSION } from "./version.js";

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

document.addEventListener("visibilitychange", () => {
  if(document.hidden) return;
  fetch("js/version.js", {cache:"no-store"})
    .then(r => r.text())
    .then(t => {
      const enLigne = (t.match(/VERSION = "([^"]+)"/) || [])[1];
      if(!enLigne || enLigne === VERSION) return;
      /* Une seule tentative par nouvelle version, pour ne jamais recharger en boucle */
      try{
        if(sessionStorage.getItem("recharge-pour") === enLigne) return;
        sessionStorage.setItem("recharge-pour", enLigne);
      }catch(_){}
      location.reload();
    })
    .catch(() => {});
});
