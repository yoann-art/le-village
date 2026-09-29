/* ================= Toujours la dernière version =================
   Petit assistant installé par le navigateur du téléphone (« service worker »).
   Chaque fichier du jeu est redemandé au serveur au lieu de réutiliser une vieille copie ;
   si rien n'a changé, le serveur répond « pas changé » en un instant.
   Les fichiers venant d'ailleurs (three.js, polices) ne sont pas touchés. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req.url, {cache:"no-cache"})
      .then(r => r.redirected ? Response.redirect(r.url) : r)
      .catch(() => fetch(req))
  );
});
