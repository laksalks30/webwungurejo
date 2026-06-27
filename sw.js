const CACHE_NAME = 'kkn-wungurejo-v1';

// Install event: skip waiting so the new service worker takes over immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event: clean up old caches if the CACHE_NAME changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: Network First, fallback to Cache strategy
self.addEventListener('fetch', (event) => {
    // Hanya proses method GET
    if (event.request.method !== 'GET') return;
    
    // Jangan cache endpoint API backend, biarkan selalu ambil dari jaringan
    if (event.request.url.includes('/api/')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Jika jaringan berhasil, simpan/perbarui file di cache (background)
                // Ini memastikan aplikasi SELALU up-to-date saat online!
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Jika jaringan GAGAL (Offline / Blank Spot), ambil dari Cache!
                // Warga desa tetap bisa buka aplikasi tanpa internet.
                console.log('[PWA] Offline mode aktif. Mengambil dari cache untuk:', event.request.url);
                return caches.match(event.request);
            })
    );
});
