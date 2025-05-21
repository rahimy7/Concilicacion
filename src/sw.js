// public/sw.js
const CACHE_NAME = 'conciliacion-bancaria-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalándose');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activándose');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Interceptando fetch', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Devolver del caché si está disponible
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en caché, buscar en la red
        return fetch(event.request)
          .then((response) => {
            // Si la respuesta no es válida, devolver la respuesta directamente
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para guardarla en caché
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});