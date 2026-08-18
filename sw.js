const CACHE = 'flr-trono-v1';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(clients.claim());
});

/* Cache con respaldo offline para la propia casa */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || e.request.url.indexOf(self.location.origin) !== 0) return;
  e.respondWith(
    caches.open(CACHE).then(async function (cache) {
      try {
        const fresh = await fetch(e.request);
        if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      } catch (err) {
        const hit = await cache.match(e.request);
        return hit || Response.error();
      }
    })
  );
});

/* Notificaciones push de la casa */
self.addEventListener('push', function (e) {
  let data = {};
  try { data = e.data.json(); } catch (err) { data = { title: '♛ Supremacía Femenina', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || '♛ Supremacía Femenina', {
    body: data.body || '',
    icon: 'corona.png',
    badge: 'corona.png'
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(clients.openWindow('notificaciones.html'));
});
