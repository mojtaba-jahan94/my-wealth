const CACHE_NAME = 'my-wealth-v2.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Do not cache API or external proxy requests
  if (
    url.hostname.includes('bitpin.ir') ||
    url.hostname.includes('tgju.org') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('tetherland.com') ||
    url.hostname.includes('allorigins') ||
    url.hostname.includes('codetabs') ||
    url.hostname.includes('t.me')
  ) {
    return event.respondWith(fetch(event.request));
  }

  // Network-first for HTML, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
