// service-worker.js
const VERSION = "v3";                     // ⬅️ súbelo cuando hagas cambios
const CACHE_NAME = `dedos-cache-${VERSION}`;
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// Instalar: precache + tomar control cuanto antes
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE)));
});

// Activar: limpiar cachés viejas y reclamar clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Estrategia:
// - HTML (navegación/index): NETWORK FIRST (así ves cambios al instante)
// - Otros assets: CACHE FIRST (rápido y offline)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  const isHTML =
    req.mode === "navigate" ||
    (req.destination === "document") ||
    req.url.endsWith("/index.html");

  if (isHTML) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match("./index.html");
          return cached || new Response("Offline", { status: 503 });
        }
      })()
    );
  } else {
    event.respondWith(
      caches.match(req).then((resp) => resp || fetch(req))
    );
  }
});
