const CACHE = 'love-sky-v1';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './data/stars.6.json',
  './data/starnames.json',
  './data/constellations.json',
  './data/constellations.lines.json',
  './data/constellations.bounds.json',
  './data/mw.json',
  './data/planets.json',
  './data/moon.json',
  './data/dsos.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        ASSETS.map((url) =>
          c.add(url).catch(() => console.warn('Не закешировано:', url))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
