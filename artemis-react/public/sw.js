const CACHE = 'artemis2-v1';

// On install: cache the app shell
self.addEventListener('install', e => {
  self.skipWaiting();
});

// On activate: claim all clients
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Network-first strategy: always try network, fall back to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
