const CACHE = "star-color-v5";
const CORE = ["./", "./index.html", "./style.css", "./app.js", "./manifest.webmanifest"];
const REMOTE = [
  "https://star-color-akmbmw0zl-henryle1.vercel.app/icon-192.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/icon-512.png",
  "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-01.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-02.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-03.png",
  "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-04.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-05.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-06.png",
  "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-07.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-08.png", "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-09.png",
  "https://star-color-akmbmw0zl-henryle1.vercel.app/pictures/winter-10.png"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(REMOTE.map(url => cache.add(url)));
  })());
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && (response.ok || response.type === "opaque")) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : undefined)));
});
