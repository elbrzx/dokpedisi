const CACHE_NAME = 'doc-expedition-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/client/main.tsx', // This might not be cacheable directly, but we try
  // Add other assets like CSS, JS bundles, and images here
  // For this project, we know there's a global.css
  '/client/global.css',
  '/favicon.ico'
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
