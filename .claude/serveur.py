# Petit serveur local pour tester le jeu sur l'ordinateur (http://localhost:8000).
# Il demande au navigateur de ne rien garder en mémoire : chaque rechargement montre la dernière version.
import functools, http.server, os

racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class SansCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("127.0.0.1", 8000), functools.partial(SansCache, directory=racine)).serve_forever()
