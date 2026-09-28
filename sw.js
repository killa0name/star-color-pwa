const CACHE = "star-color-v6";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png",
  "./pictures/winter-01.png", "./pictures/winter-02.png", "./pictures/winter-03.png",
  "./pictures/winter-04.png", "./pictures/winter-05.png", "./pictures/winter-06.png",
  "./pictures/winter-07.png", "./pictures/winter-08.png", "./pictures/winter-09.png",
  "./pictures/winter-10.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : undefined)));
});