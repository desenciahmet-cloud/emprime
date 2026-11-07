// emprime.site Service Worker v3
const CACHE_NAME = 'emprime-v3';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico?v=20261016',
  '/static/img/favicon.ico',
  '/static/img/favicon.svg',
  '/static/img/favicon-32x32.png',
  '/static/img/favicon-16x16.png',
  '/static/img/apple-touch-icon.png',
  '/static/img/icon-192.png',
  '/static/img/icon-512.png',
  '/static/img/logo.svg',
  '/static/img/logo.png',
  '/static/js/app.js',
  '/static/css/custom.css',
  '/manifest.json',
  '/static/images/emprime/emp_model_floral_black.jpg',
  '/static/images/emprime/emp_model_floral_white.jpg',
  '/static/images/emprime/emp_pat_floral_wm.jpg',
  '/static/images/emprime/emp_model_ocean_black.jpg',
  '/static/images/emprime/emp_pat_ocean_wm.jpg',
  '/static/images/emprime/emp_model_ethnic_brown.jpg',
  '/static/images/emprime/emp_pat_ethnic_wm.jpg',
  '/static/images/emprime/emp_model_magnolia_black.jpg',
  '/static/images/emprime/emp_pat_magnolia_wm.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.log('SW cache err:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // If HTML document request, try network first, then fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/')))
    );
    return;
  }

  // Static assets & images: cache first, revalidate in background, cache on fetch
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});
