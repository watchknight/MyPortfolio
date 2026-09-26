const CACHE_NAME = 'moayed-portfolio-v1';

const CORE_ASSETS = [
  '/',
  '/works',
  '/foundation',
  '/resume',
  '/contact',
  '/404',
  '/favicon.svg',
  '/og-image.png',
  '/manifest.json',
  '/fonts/instrument-sans-700.woff2',
  '/fonts/geist-400.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('SW: Precache error:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Do not intercept non-http/https or foreign origins (except font CDNs if any)
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;

  // 1. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback
          const cached = await caches.match(request);
          if (cached) return cached;

          // Try matching pathname without query params
          const pathnameMatch = await caches.match(url.pathname);
          if (pathnameMatch) return pathnameMatch;

          // Fallback to home or 404
          const fallback404 = await caches.match('/404');
          if (fallback404) return fallback404;

          const fallbackHome = await caches.match('/');
          if (fallbackHome) return fallbackHome;

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline — Abdur Rahman Moayed</title><style>body{background:#101114;color:#E5E5E1;font-family:sans-serif;padding:2rem;text-align:center;}</style></head><body><h1>Connection Offline</h1><p>Cached portfolio ledger remains available once reconnecting.</p><a href="/" style="color:#3FBFA0">Return to Terminal</a></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Static assets: CSS, JS, fonts, images (Cache First with background update)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          // Graceful asset catch
          return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
        });
    })
  );
});
