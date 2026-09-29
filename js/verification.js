/* ================= Vérification au démarrage =================
   Chargé en premier : si le moteur 3D (three.js) n'est pas arrivé,
   on affiche un message et on arrête là, avant tout le reste. */
import { fatal } from "./outils.js";

if(typeof THREE === "undefined"){
  fatal("Le moteur 3D n'a pas pu se charger. Vérifie ta connexion, puis recharge la page.");
  throw new Error("three.js n'a pas pu se charger");
}
