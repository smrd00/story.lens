// StoryLens Service Worker
const CACHE_NAME = 'storylens-v2';
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './logo-192.png',
  './logo-512.png',
  './fonts/OpenDyslexic/OpenDyslexic-Regular.otf',
  './fonts/OpenDyslexic/OpenDyslexic-Bold.otf',
  './fonts/OpenDyslexic/OpenDyslexic-Italic.otf',
  './fonts/OpenDyslexic/OpenDyslexic-BoldItalic.otf',
  './fonts/OpenDyslexic/OpenDyslexicAlta-Regular.otf',
  './fonts/OpenDyslexic/OpenDyslexicAlta-Bold.otf',
  './fonts/OpenDyslexic/OpenDyslexicMono-Regular.otf'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests except for CDN resources
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdnjs.cloudflare.com') &&
      !event.request.url.includes('unpkg.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return a fallback
        return caches.match('/index.html');
      })
  );
});

// Handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});