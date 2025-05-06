const CACHE_NAME = 'ppu-gpt-cache-20250506';
const urlsToCache = [
  './',
  'index.html',
  'style.css?v=20250506',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the cached response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});