/**
 * Service Worker для полной автономной работы без сервера
 * Автор: @slawastr 1-26 design
 */

const CACHE_NAME = 'trig-circle-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/trigEngine.js',
    './js/circleCanvas.js',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install: Cache all core assets immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW v3] Кэширование ресурсов для автономной работы...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate: Immediately claim clients and purge obsolete caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            console.log('[SW v3] Удаление старого кэша:', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch: Network-first strategy with cache fallback
// Always delivers latest changes when online, falls back to cache when offline
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });
            })
    );
});
