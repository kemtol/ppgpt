// service-worker.js

const CACHE_NAME = 'ppu-gpt-cache-20250604';
const urlsToCache = [
  './',
  'index.html',
  'app.js?v=20250604',
  'style.css?v=20250604',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'manifest.json'
];

const IGNORED_HOSTNAMES = [
  '8.215.27.234', // DALL-E API Anda
  // tambahkan hostname eksternal lain yang tidak ingin di-cache
];

self.addEventListener('install', event => {
  console.log('Service worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache install failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service worker: Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(oldKey => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1) Abaikan external hosts dan non-GET
  if (
    IGNORED_HOSTNAMES.includes(url.hostname) ||
    url.protocol === 'chrome-extension:' ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 2) Network-first untuk app.js (versi dengan query string)
  if (url.pathname.endsWith('/app.js')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResp => {
          // Update cache dengan respons terbaru
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return networkResp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3) Cache-first untuk aset lain
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(networkResp => {
        // (Opsional) cache dynamic assets:
        // if (networkResp.ok && networkResp.type === 'basic') {
        //   const copy = networkResp.clone();
        //   caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        // }
        return networkResp;
      });
    })
  );
});
