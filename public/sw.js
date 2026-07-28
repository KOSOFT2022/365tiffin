/**
 * TiffinGo Service Worker for Offline Resilience
 * Dedicated to supporting the delivery team in areas with intermittent internet.
 */

const CACHE_NAME = 'tiffingo-static-cache-v2';
const DYNAMIC_CACHE_NAME = 'tiffingo-dynamic-cache-v2';

// Install Event - Skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - Clean up stale cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Evicting deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First for HTML navigation to ensure fresh app builds
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
