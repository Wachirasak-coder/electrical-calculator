const CACHE = "cable-calc-no1-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/app.js",
  "./js/engine.js",
  "./js/catalog.js",
  "./data/cable_calc_data.json",
  "./manifest.webmanifest",
  "./eleccalc/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const home = await cache.match("./index.html");
        if (home) return home;
      }
      return new Response("ออฟไลน์", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
