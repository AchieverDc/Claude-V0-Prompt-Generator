// sw.js
const CACHE_NAME = "merge-builder-assets-v2";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/codemirror.js",
  "/javascript.js",
  "/python.js",
  "/codemirror.css",
  "/favicon.png",
  // Add more assets as needed
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Precaching failed:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    clients.claim() // Take control of open pages
  );
  console.log("Service Worker: Activated and claiming clients");
});

self.addEventListener("fetch", (event) => {
  // Cache-first strategy for all requests
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
