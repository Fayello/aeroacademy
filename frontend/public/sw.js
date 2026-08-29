// XpertClass PWA Service Worker — placeholder minimal offline-capable SW
// Increment CACHE_VERSION when assets change
const CACHE_VERSION = "xpertclass-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/";

// Install: pre-cache offline fallback if needed
self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Minimal: optionally cache offline page
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Best-effort cache OFFLINE_URL; ignore failures
      return cache.add(OFFLINE_URL).catch(() => undefined);
    })
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k.startsWith("xpertclass-"))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // Bypass for API calls and Next.js HMR
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // For navigation requests: network first, fallback to cache/offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Optionally cache successful navigations
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For static assets: cache-first
  if (["style", "script", "image", "font"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
