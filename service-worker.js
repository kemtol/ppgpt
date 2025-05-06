const CACHE_NAME = 'ppu-gpt-cache-20250506'; // Pastikan nama cache unik jika Anda memperbarui SW secara signifikan
const urlsToCache = [
  './', // Cache halaman root
  'index.html',
  'style.css?v=20250506', // Tambahkan versi untuk cache busting jika CSS berubah
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
  'manifest.json'
  // Tambahkan aset statis penting lainnya yang ingin Anda cache di sini
  // Contoh: '/js/main.js?v=20250506', '/img/logo.png'
];

// URL atau hostname yang ingin diabaikan oleh Service Worker (tidak di-cache, langsung ke network)
const IGNORED_HOSTNAMES = [
  '8.215.27.234', // Hostname DALL-E API Anda
  // Tambahkan hostname lain jika ada API eksternal lain yang tidak ingin diintersep
];

self.addEventListener('install', (event) => {
  console.log('Service worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service worker: Failed to cache app shell:', error);
      })
  );
  self.skipWaiting(); // Memaksa SW baru untuk aktif lebih cepat
});

self.addEventListener('activate', (event) => {
  console.log('Service worker: Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => { // Mengganti nama variabel 'cache' menjadi 'cacheName' agar lebih jelas
          if (cacheName !== CACHE_NAME) {
            console.log('Service worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Mengontrol klien yang tidak terkontrol oleh SW sebelumnya
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Abaikan request ke hostname yang ada di IGNORED_HOSTNAMES atau dari chrome-extension
  if (IGNORED_HOSTNAMES.includes(requestUrl.hostname) || requestUrl.protocol === 'chrome-extension:') {
    // Biarkan browser menangani request ini secara normal (langsung ke network)
    // Tidak memanggil event.respondWith() berarti SW tidak mengintersep.
    console.log('Service worker: Ignoring fetch for:', event.request.url);
    return;
  }

  // Untuk semua request lain (aset lokal Anda), gunakan strategi Cache-First, then Network
  // Hanya tangani request GET untuk caching, biarkan POST, dll. langsung ke network jika tidak secara eksplisit diabaikan di atas.
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Cache hit - return the cached response
          if (cachedResponse) {
            // console.log('Service worker: Serving from cache:', event.request.url);
            return cachedResponse;
          }

          // Cache miss - fetch from network
          // console.log('Service worker: Fetching from network:', event.request.url);
          return fetch(event.request).then(networkResponse => {
            // Opsional: Jika Anda ingin meng-cache aset yang baru diambil jika itu berasal dari origin Anda
            // atau jika itu adalah bagian dari urlsToCache (meskipun addAll sudah melakukannya saat install).
            // Pastikan hanya meng-cache respons yang valid (status 200).
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') { // 'basic' type untuk same-origin
              // Periksa apakah ini aset yang ingin Anda cache dinamis
              // Misalnya, jika itu adalah bagian dari origin Anda dan bukan API eksternal.
              // Kode di bawah ini adalah contoh jika Anda ingin meng-cache ulang aset dari origin Anda.
              // if (requestUrl.origin === self.location.origin) {
              //   const responseToCache = networkResponse.clone();
              //   caches.open(CACHE_NAME)
              //     .then(cache => {
              //       cache.put(event.request, responseToCache);
              //     });
              // }
            }
            return networkResponse;
          }).catch(error => {
            console.error('Service worker: Fetch failed for:', event.request.url, error);
            // Anda bisa mengembalikan halaman offline kustom di sini jika fetch gagal
            // return caches.match('/offline.html');
            throw error; // Lemparkan error agar promise ditolak jika fetch gagal
          });
        })
    );
  } else {
    // Untuk metode selain GET (misalnya POST ke API Anda sendiri yang tidak diabaikan),
    // biarkan langsung ke network.
    // Jika Anda memiliki API di origin yang sama dan ingin SW mengabaikannya juga, tambahkan ke IGNORED_HOSTNAMES
    // atau tambahkan logika spesifik di sini.
    // console.log('Service worker: Passing through non-GET request:', event.request.url, event.request.method);
    return; // Tidak memanggil event.respondWith()
  }
});