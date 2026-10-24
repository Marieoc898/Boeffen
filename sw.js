// Network first (so updates arrive automatically), cache fallback (so it works offline in the gym).
const CACHE = "bbs-cache";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const network = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    network.catch(() => {});
    try {
      return await Promise.race([network, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))]);
    } catch (err) {
      const hit = (await cache.match(req)) || (await cache.match("./index.html"));
      return hit || network;
    }
  })());
});
