const CACHE = "cable-calc-no1-v3";
const ASSETS = [
  "./index.html",
  "./css/app.css?v=3",
  "./js/app.js?v=3",
  "./js/engine.js",
  "./js/catalog.js",
  "./data/cable_calc_data.json",
  "./manifest.webmanifest",
  "./eleccalc/index.html",
];

function isAppDocument(text) {
  return text.includes("โปรแกรมคำนวณสายไฟ No.1") && text.includes('name="color-scheme" content="light"');
}

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
  const accept = request.headers.get("accept") || "";
  const isDocument = request.mode === "navigate" || accept.includes("text/html");
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      if (isDocument) {
        if (cached) {
          const text = await cached.clone().text();
          if (isAppDocument(text)) return cached;
        }
        const home = await cache.match("./index.html");
        if (home) {
          const text = await home.clone().text();
          if (isAppDocument(text)) return home;
        }
      } else if (cached) {
        return cached;
      }
      return new Response("ออฟไลน์", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
