const VERSION = 'qdl-2026-09-04';
const CACHE = 'qdl-' + VERSION;

self.addEventListener('install', function(e){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    const keys = await caches.keys();
    await Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function(e){
  const req = e.request;
  if (req.method !== 'GET' || req.url.indexOf(self.location.origin) !== 0) return;
  e.respondWith((async function(){
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const copy = fresh.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = await caches.match('/index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});

self.addEventListener('push', function(e){
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: '♛ Queendomland', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || '♛ Queendomland', {
    body: data.body || '', icon: 'corona.png', badge: 'corona.png'
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs){
    for (let i = 0; i < cs.length; i++) { if ('focus' in cs[i]) return cs[i].focus(); }
    return self.clients.openWindow('/');
  }));
});
