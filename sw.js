const CACHE_NAME = 'tools-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/style.css',
  '/static/common.css',
  '/static/common.js',
  '/static/favicon.svg',
  '/manifest.json',
];

const TOOL_PATHS = [
  '/avatarcropper/',
  '/codeshot/',
  '/cowsay/',
  '/img2jpg/',
  '/img2png/',
  '/jwtviewer/',
  '/sqlfmt/',
  '/tstime/',
  '/wsolver/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...STATIC_ASSETS, ...TOOL_PATHS]);
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

// the cache is only an offline fallback, so deploys and the apps' update
// feeds always reach visitors who are online
self.addEventListener('fetch', (event) => {
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
