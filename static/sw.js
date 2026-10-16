// emprime.site Service Worker
const CACHE_NAME = 'emprime-v1';
const STATIC_ASSETS = [
  '/',
  '/static/img/favicon.ico',
  '/static/img/favicon.svg',
  '/static/img/logo.svg',
  '/static/img/icon-192.png',
  '/static/img/icon-512.png',
  '/static/js/app.js',
  '/static/css/custom.css'
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
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => caches.match('/'));
    })
  );
});
