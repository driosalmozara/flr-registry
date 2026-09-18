const VERSION = 'qdl-2026-09-18';
const CACHE = 'qdl-' + VERSION;
const CACHE_MEDIA = 'ql-media-v2';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    // 1) Limpiar cachés antiguas
    const keys = await caches.keys();
    await Promise.all(keys.filter(function(k){
      return k !== CACHE && k !== CACHE_MEDIA;
    }).map(function(k){
      return caches.delete(k);
    }));
    
    // 2) Tomar el control de todas las pestañas
    await self.clients.claim();
    
    // 3) Avisar que hay nueva versión
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function(client){
      client.postMessage({ type: 'NEW_VERSION_AVAILABLE', version: VERSION });
    });
  })());
});

self.addEventListener('fetch', function(e){
  const req = e.request;
  if (req.method !== 'GET' || req.url.indexOf(self.location.origin) !== 0) return;

  const url = new URL(req.url);
  const esMedia = /\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(url.pathname) ||
                  url.pathname.includes('/storage/v1/object/');
  const esHTML = req.mode === 'navigate' || url.pathname.endsWith('.html');
  const esJS_CSS = /\.(js|css)$/i.test(url.pathname);

  // MEDIOS (imágenes/videos): cache-first → descarga UNA VEZ y sirve del dispositivo
  if (esMedia) {
    e.respondWith((async function(){
      const cache = await caches.open(CACHE_MEDIA);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;  // ← Sirve del dispositivo: 0 egress
      try {
        const res = await fetch(req);
        if (res && res.ok) await cache.put(req, res.clone());
        return res;
      } catch (err) {
        return hit || new Response('Offline media', { status: 503 });
      }
    })());
    return;
  }

  // HTML/JS/CSS: network-first → siempre actualizado, fallback a cache si falla la red
  if (esHTML || esJS_CSS) {
    e.respondWith((async function(){
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const copy = fresh.clone();
          const cache = await caches.open(CACHE);
          await cache.put(req, copy);
        }
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const home = await cache.match('/index.html');
          if (home) return home;
        }
        throw err;
      }
    })());
    return;
  }

  // Otros recursos: network-first con fallback
  e.respondWith((async function(){
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const copy = fresh.clone();
        const cache = await caches.open(CACHE);
        await cache.put(req, copy);
      }
      return fresh;
    } catch (err) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});

self.addEventListener('push', function(e){
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: '♛ Queendomland', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(data.title || '♛ Queendomland', {
    body: data.body || '', icon: 'icono-q.png', badge: 'icono-q.png'
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs){
    for (let i = 0; i < cs.length; i++) { if ('focus' in cs[i]) return cs[i].focus(); }
    return self.clients.openWindow('/');
  }));
});

self.addEventListener('message', function(e){
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
