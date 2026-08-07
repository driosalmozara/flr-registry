/* ══════════════════════════════════════════════════
   TRONO DE ORO — toasts.js v3
   Toasts + favicon + compartir + PWA + push cerrado
   ══════════════════════════════════════════════════ */

/* ── 1) Favicon corona ── */
(function(){
  if (document.querySelector('link[rel="icon"]')) return;
  var link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = 'corona.png';
  document.head.appendChild(link);
})();

/* ── 2) PWA: manifest + service worker ── */
(function(){
  if (!document.querySelector('link[rel="manifest"]')) {
    var l = document.createElement('link');
    l.rel = 'manifest';
    l.href = 'manifest.json';
    document.head.appendChild(l);
  }
  var a = document.createElement('link');
  a.rel = 'apple-touch-icon';
  a.href = 'corona.png';
  document.head.appendChild(a);
  var m = document.createElement('meta');
  m.name = 'theme-color';
  m.content = '#0f0f1a';
  document.head.appendChild(m);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){});
    });
  }
})();

/* ── 3) Notificaciones: permiso + sistema + push ── */
function b64ToU8(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

async function ensurePushSubscription(client){
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const r = await fetch('/api/vapid-public');
    const j = await r.json();
    if (!j.publicKey) return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(j.publicKey)
      });
    }
    const js = sub.toJSON();
    const s = await client.auth.getSession();
    if (!s.data.session) return;
    await client.from('push_subscriptions').upsert({
      user_id: s.data.session.user.id,
      endpoint: js.endpoint,
      p256dh: js.keys.p256dh,
      auth: js.keys.auth
    }, { onConflict: 'endpoint' });
  } catch(e) {}
}

function pedirPermisoNotificaciones(){
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}
document.addEventListener('click', function once(){
  pedirPermisoNotificaciones();
  document.removeEventListener('click', once);
  setTimeout(function(){
    if (window.__toastClient) ensurePushSubscription(window.__toastClient);
  }, 2000);
});

function notificacionSistema(title, body){
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(reg){
      reg.showNotification(title || '♛ Supremacía Femenina', {
        body: body || '', icon: 'corona.png', badge: 'corona.png'
      });
    }).catch(function(){});
  }
}

/* ── 4) Toasts en pantalla ── */
(function(){
  if(!document.getElementById('toast-container')){
    var c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
})();

function escapeHtml(v){
  return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showToast(n){
  var container = document.getElementById('toast-container');
  if(!container) return;
  var a = document.createElement('a');
  a.className = 'toast';
  a.href = n.link || 'notificaciones.html';
  a.innerHTML =
    '<div class="toast-title">♛ ' + escapeHtml(n.title || 'Nueva notificación') + '</div>' +
    (n.body ? '<div class="toast-body">' + escapeHtml(n.body) + '</div>' : '') +
    '<div class="toast-meta">Ahora · toca para ver</div>';
  container.appendChild(a);
  var timer = setTimeout(function(){ dismissToast(a); }, 6000);
  a.addEventListener('click', function(){ clearTimeout(timer); dismissToast(a); });
}

function dismissToast(el){
  if(!el || el.classList.contains('out')) return;
  el.classList.add('out');
  setTimeout(function(){ el.remove(); }, 350);
}

/* ── 5) Realtime + suscripción push ── */
function waitForSupabase(cb, tries){
  tries = tries || 0;
  if (window.supabase && typeof window.supabase.createClient === 'function') cb();
  else if (tries < 50) setTimeout(function(){ waitForSupabase(cb, tries+1); }, 100);
}

(function(){
  function start(){
    waitForSupabase(async function(){
      if(!window.__toastClient){
        window.__toastClient = window.supabase.createClient(
          'https://ofyedqoipexpsvjsipze.supabase.co',
          'sb_publishable_X4SJUT7cnbFuv7l_1Y3OjQ__poTLx0b'
        );
      }
      var client = window.__toastClient;
      var s = await client.auth.getSession();
      var session = s.data && s.data.session;
      if(!session) return;
      var userId = session.user.id;

      client.channel('toast-notifs-' + userId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: 'user_id=eq.' + userId
        }, function(payload){
          showToast(payload.new);
          notificacionSistema(payload.new.title, payload.new.body);
        })
        .subscribe();

      ensurePushSubscription(client);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ── 6) Botón Compartir ── */
(function(){
  var style = document.createElement('style');
  style.textContent = `
    #share-fab{position:fixed;bottom:18px;left:18px;z-index:9998;width:52px;height:52px;border-radius:50%;
      background:linear-gradient(180deg,#e6c664,#b48a2a);color:#0d0c0a;border:none;cursor:pointer;
      font-size:22px;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 20px rgba(201,162,75,.25);transition:.3s}
    #share-fab:hover{transform:scale(1.06)}
    #share-menu{position:fixed;bottom:80px;left:18px;z-index:9998;display:none;flex-direction:column;gap:8px;
      background:rgba(13,12,10,.97);border:1px solid rgba(201,162,75,.5);border-radius:14px;padding:12px;
      box-shadow:0 20px 60px rgba(0,0,0,.6);min-width:200px}
    #share-menu.open{display:flex}
    #share-menu button{display:flex;align-items:center;gap:10px;background:transparent;
      border:1px solid rgba(201,162,75,.25);color:#e5e5e5;border-radius:10px;padding:8px 12px;
      cursor:pointer;font-size:13px;text-align:left}
    #share-menu button:hover{border-color:#c9a24b;color:#c9a24b}
  `;
  document.head.appendChild(style);

  var fab = document.createElement('button');
  fab.id = 'share-fab';
  fab.title = 'Compartir';
  fab.innerHTML = '📤';
  document.body.appendChild(fab);

  var menu = document.createElement('div');
  menu.id = 'share-menu';
  document.body.appendChild(menu);

  function buildMenu(){
    var url = window.location.href;
    var title = document.title || 'Supremacía Femenina';
    var enc = encodeURIComponent;
    var items = [
      ['📋 Copiar enlace', function(){
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function(){ alert('Enlace copiado al portapapeles.'); });
        } else { prompt('Copia el enlace:', url); }
      }],
      ['💬 WhatsApp', function(){ window.open('https://wa.me/?text=' + enc(title + ' ' + url), '_blank'); }],
      ['✈️ Telegram', function(){ window.open('https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title), '_blank'); }],
      ['🐦 X / Twitter', function(){ window.open('https://twitter.com/intent/tweet?text=' + enc(title) + '&url=' + enc(url), '_blank'); }],
      ['📘 Facebook', function(){ window.open('https://www.facebook.com/sharer/sharer.php?u=' + enc(url), '_blank'); }],
      ['✉️ Correo', function(){ window.location.href = 'mailto:?subject=' + enc(title) + '&body=' + enc('Descubre Supremacía Femenina: ' + url); }]
    ];
    if (navigator.share) {
      items.unshift(['📲 Compartir (nativo)', function(){ navigator.share({ title: title, url: url }).catch(function(){}); }]);
    }
    menu.innerHTML = '';
    items.forEach(function(it){
      var b = document.createElement('button');
      b.textContent = it[0];
      b.onclick = function(){ it[1](); };
      menu.appendChild(b);
    });
  }

  fab.onclick = function(e){
    e.stopPropagation();
    if(!menu.classList.contains('open')) buildMenu();
    menu.classList.toggle('open');
  };
  document.addEventListener('click', function(e){
    if(!menu.contains(e.target) && e.target !== fab) menu.classList.remove('open');
  });
})();
