// Minimale service worker — bestaansrecht is dat Chrome/Edge desktop een fetch-handler
// nodig hebben om de "App installeren"-knop te tonen. Sonos-calls (proxy/discover) laten
// we ongemoeid zodat ze nooit gecached worden.

const CACHE = 'sonos-radio-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Sonos-endpoints altijd via netwerk, niet cachen
  if (url.pathname.startsWith('/sonos-proxy/') || url.pathname.startsWith('/sonos-discover')) {
    return;
  }
  // Alleen GET cachen
  if (event.request.method !== 'GET') return;

  // Network-first met fallback naar cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((m) => m || caches.match('/')))
  );
});
