const CACHE = "star-color-v17";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png",
  "./pictures/winter-01.png", "./pictures/winter-02.png", "./pictures/winter-03.png",
  "./pictures/winter-04.png", "./pictures/winter-05.png", "./pictures/winter-06.png",
  "./pictures/winter-07.png", "./pictures/winter-08.png", "./pictures/winter-09.png",
  "./pictures/winter-10.png",
  "./pictures/animal-cat.svg", "./pictures/animal-dog.svg",
  "./pictures/animal-bunny.svg", "./pictures/animal-bear.svg",
  "./pictures/animal-elephant.svg", "./pictures/animal-giraffe.svg",
  "./pictures/animal-lion.svg", "./pictures/animal-turtle.svg",
  "./pictures/animal-owl.svg", "./pictures/animal-dolphin.svg",
  "./pictures/plush-cat-ipad-v2.svg",
  "./pictures/plush-cat-balloon.png",
  "./pictures/plush-cat-star-wand.png",
  "./pictures/plush-cat-reading.png",
  "./pictures/plush-cat-heart.png",
  "./pictures/plush-cat-cupcake.png",
  "./pictures/plush-cat-gift.png",
  "./pictures/plush-cat-flowers.png",
  "./pictures/plush-cat-fish.png",
  "./pictures/plush-cat-tambourine.png",
  "./pictures/plush-cat-artist.png",
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
  const url = new URL(event.request.url);
  const isAppShell = event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/style.css") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/manifest.webmanifest");

  if (isAppShell) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.ok) {
          caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached || (event.request.mode === "navigate" ? caches.match("./index.html") : undefined)
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        if (response && response.ok) {
          caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      })
    )
  );
});