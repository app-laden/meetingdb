// meetingdb – Service Worker
// Haus-Regeln (Allgemein/github-pages.md): Dateien beim Installieren mit
// {cache:'reload'} holen (nicht cache.addAll direkt), damit keine alte
// index.html aus dem Browser-Cache uebernommen wird; eigener Cache-Name
// mit App-Praefix; beim Aktivieren nur eigene alte Caches loeschen.

const VERSION = "1.13.0";
const CACHE_NAME = "mdb-cache-" + VERSION;

const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./jspdf.umd.min.js",
  "./pdf-lib.min.js",
  "./jszip.min.js",
  "./pdf.min.js",
  "./pdf.worker.min.js",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        FILES.map(async (url) => {
          try {
            const resp = await fetch(new Request(url, { cache: "reload" }));
            if (resp && resp.ok) await cache.put(url, resp);
          } catch (e) {
            // Offline beim allerersten Installieren: einzelne Datei ueberspringen,
            // sie wird beim naechsten Online-Start nachgeladen.
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => (n.startsWith("mdb-cache-") || n.startsWith("sv-cache-")) && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch (e) {
        if (cached) return cached;
        throw e;
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
