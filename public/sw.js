const CACHE_NAME = 'fysio-rehab-v3';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './exercises/wall-squat.jpg',
  './exercises/bear-crawl.jpg',
  './exercises/bear-to-crab.jpg',
  './exercises/forward-reverse-lunge.jpg',
  './audio/sofie/3.mp3',
  './audio/sofie/2.mp3',
  './audio/sofie/1.mp3',
  './audio/sofie/start.mp3',
  './audio/sofie/halfway.mp3',
  './audio/sofie/stop.mp3',
  './audio/sofie/swap.mp3',
  './audio/sofie/done.mp3',
  './audio/mattias/3.mp3',
  './audio/mattias/2.mp3',
  './audio/mattias/1.mp3',
  './audio/mattias/start.mp3',
  './audio/mattias/halfway.mp3',
  './audio/mattias/stop.mp3',
  './audio/mattias/swap.mp3',
  './audio/mattias/done.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
