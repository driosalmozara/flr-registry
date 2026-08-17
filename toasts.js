/* ══ Modo mantenimiento ══ */
(function(){
  var gateEl = null;

  function buildGate(){
    var st = document.createElement('style');
    st.textContent = '#maint-gate{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,#1a1420 0%,#0b0810 70%);padding:20px;text-align:center}#maint-gate .mg-card{max-width:560px;background:rgba(13,10,14,.92);border:1px solid rgba(212,175,55,.55);border-radius:18px;padding:40px 30px;box-shadow:0 30px 90px rgba(0,0,0,.8),0 0 60px rgba(212,175,55,.12)}#maint-gate .mg-crown{font-size:56px;color:#d4af37;animation:mgPulse 2.4s ease-in-out infinite}#maint-gate h2{font-family:"Cormorant Garamond",serif;color:#d4af37;font-size:30px;margin:10px 0 6px}#maint-gate p{color:#cfc6bb;font-size:15px;line-height:1.7;margin:6px 0}@keyframes mgPulse{0%,100%{text-shadow:0 0 12px rgba(212,175,55,.4)}50%{text-shadow:0 0 34px rgba(212,175,55,.9)}}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'maint-gate';
    d.innerHTML = '<div class="mg-card"><div class="mg-crown">♛</div><h2>Supremacía Femenina</h2><p><b style="color:#d4af37;">Las Diosas están trabajando en el sitio.</b></p><p>Volverá a estar operativo en unos minutos.</p><p style="font-size:12px;color:#8a8578;margin-top:14px;">· Contenido simbólico y consensuado entre adultos ·</p></div>';
    document.body.appendChild(d);
    document.body.style.overflow = 'hidden';
    gateEl = d;
  }

  function removeGate(){
    if (gateEl) { gateEl.remove(); gateEl = null; document.body.style.overflow = ''; }
  }

  async function check(client){
    var s = await client.auth.getSession();
    var isAdmin = false;
    if (s.data && s.data.session) {
      var r = await client.rpc('am_i_superadmin');
      isAdmin = !!r;
    }
    var row = await client.from('app_settings').select('value').eq('key','maintenance').maybeSingle();
    var on = !!(row.data && row.data.value === '1');

    if (on && !isAdmin) { if (!gateEl) buildGate(); }
    else removeGate();

    var badge = document.getElementById('maint-badge');
    if (on && isAdmin && !badge) {
      var b = document.createElement('div');
      b.id = 'maint-badge';
      b.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:99998;background:#7f1d1d;color:#fff;border:1px solid #d4af37;border-radius:999px;padding:8px 18px;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.6);';
      b.textContent = '🚧 Modo mantenimiento activo — solo tú ves el sitio';
      document.body.appendChild(b);
    }
    if (!on && badge) badge.remove();
  }

  waitForSupabase(async function(){
    var client = getClient();
    await check(client);
    setInterval(function(){ check(client); }, 30000);
  });
})();
/* ══ Puerta de acceso +18 ══ */
(function(){
  if (localStorage.getItem('flr_adult_ok') === '1') return;

  var st = document.createElement('style');
  st.textContent = `
    #adult-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
      background:url('portada-adultos.jpg') center/cover no-repeat fixed, #1a0d12;
      padding:20px;overflow:auto}
    #adult-gate:before{content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse at center, rgba(15,10,14,.55), rgba(10,6,10,.92));}
    #adult-gate .ag-card{position:relative;max-width:520px;width:100%;background:rgba(13,10,14,.93);
      border:1px solid rgba(212,175,55,.6);border-radius:18px;padding:34px 30px;text-align:center;
      box-shadow:0 30px 90px rgba(0,0,0,.8),0 0 40px rgba(212,175,55,.15);
      font-family:Jost,'Segoe UI',sans-serif;color:#f5efe0}
    #adult-gate .ag-crown{font-size:44px;color:#d4af37;text-shadow:0 0 24px rgba(212,175,55,.7)}
    #adult-gate h2{font-family:'Cormorant Garamond',serif;color:#d4af37;font-size:30px;margin:8px 0 2px;letter-spacing:.04em}
    #adult-gate .ag-warn{color:#e0808f;letter-spacing:.28em;text-transform:uppercase;font-size:12px;font-weight:600;margin:6px 0 14px}
    #adult-gate .ag-text{font-size:14px;line-height:1.7;color:#cfc6bb;margin:0 0 22px}
    #adult-gate button{display:block;width:100%;margin:8px 0 0;border:none;border-radius:12px;padding:13px;
      cursor:pointer;font-weight:700;font-size:15px}
    #adult-gate #ag-yes{background:linear-gradient(180deg,#e6c664,#b48a2a);color:#14100a;
      box-shadow:0 6px 24px rgba(212,175,55,.35)}
    #adult-gate #ag-yes:hover{filter:brightness(1.08)}
    #adult-gate .ag-exit{background:transparent;color:#a1a1aa;border:1px solid #3a3a4a !important}
  `;
  document.head.appendChild(st);

  var lock = document.createElement('div');
  lock.id = 'adult-gate';
  lock.innerHTML = `
    <div class="ag-card">
      <div class="ag-crown">♛</div>
      <h2>Supremacía Femenina</h2>
      <p class="ag-warn">Contenido para adultos</p>
      <p class="ag-text">Esta plataforma reúne dinámicas consensuadas de Dominio y sumisión entre
      personas adultas. Al entrar declaras, bajo tu responsabilidad, que eres
      <b>mayor de 18 años</b> y que aceptas los Términos y Consentimiento de la casa.</p>
      <button id="ag-yes">Soy mayor de 18 — Entrar</button>
      <button id="ag-no" class="ag-exit">Soy menor — Salir</button>
    </div>
  `;
  document.body.appendChild(lock);
  document.body.style.overflow = 'hidden';

  document.getElementById('ag-yes').onclick = function(){
    localStorage.setItem('flr_adult_ok', '1');
    lock.remove();
    document.body.style.overflow = '';
  };
  document.getElementById('ag-no').onclick = function(){
    window.location.href = 'https://www.google.com';
  };
})();
/* ══════════════════════════════════════════════════
   TRONO DE ORO — toasts.js v4 (integral)
   Toasts · push · favicon · PWA · compartir · créditos
   Halos dorados: Chat y Mensajes
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

/* ── 2) PWA ── */
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

/* ── 3) Notificaciones del sistema + push ── */
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

/* ── 5) Utilidad Realtime ── */
function waitForSupabase(cb, tries){
  tries = tries || 0;
  if (window.supabase && typeof window.supabase.createClient === 'function') cb();
  else if (tries < 50) setTimeout(function(){ waitForSupabase(cb, tries+1); }, 100);
}

function getClient(){
  if(!window.__toastClient){
    window.__toastClient = window.supabase.createClient(
      'https://ofyedqoipexpsvjsipze.supabase.co',
      'sb_publishable_X4SJUT7cnbFuv7l_1Y3OjQ__poTLx0b'
    );
  }
  return window.__toastClient;
}

/* ── 6) Notificaciones en vivo ── */
(function(){
  function start(){
    waitForSupabase(async function(){
      var client = getClient();
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

/* ── 7) Halo dorado: CHAT ── */
(function(){
  var KEY = 'flr_chat_lastseen';
  var inChat = /chat\.html/.test(location.pathname);

  function setSeen(){ try { localStorage.setItem(KEY, new Date().toISOString()); } catch(e){} }
  if (inChat) {
    setSeen();
    window.addEventListener('beforeunload', setSeen);
    document.addEventListener('visibilitychange', function(){ setSeen(); glowChat(false); });
  }

  var st = document.createElement('style');
  st.textContent = 'a.chat-glow,a.msg-glow{box-shadow:0 0 12px rgba(212,175,55,.85),0 0 30px rgba(212,175,55,.4);border-radius:999px;animation:glowPulse 2.2s ease-in-out infinite}@keyframes glowPulse{0%,100%{box-shadow:0 0 8px rgba(212,175,55,.55)}50%{box-shadow:0 0 20px rgba(212,175,55,.95)}}';
  document.head.appendChild(st);

  function glowChat(on){
    var link = document.querySelector('a[href="chat.html"]');
    if(!link) return;
    if(on && !inChat) link.classList.add('chat-glow'); else link.classList.remove('chat-glow');
  }

  async function checkChat(client, me){
    if (inChat) return;
    var last = localStorage.getItem(KEY);
    if (!last) return;
    var r = await client.from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', last)
      .neq('sender_id', me);
    glowChat((r.count || 0) > 0);
  }

  waitForSupabase(async function(){
    var client = getClient();
    var s = await client.auth.getSession();
    var session = s.data && s.data.session;
    if(!session) return;
    var me = session.user.id;

    if (!localStorage.getItem(KEY)) setSeen();
    checkChat(client, me);

    client.channel('chat-glow-' + me)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, function(p){
        if (inChat) { setSeen(); return; }
        if (p.new && p.new.sender_id !== me) glowChat(true);
      })
      .subscribe();

    setInterval(function(){ checkChat(client, me); }, 30000);
  });
})();

/* ── 8) Halo dorado: MENSAJES ── */
(function(){
  function glowMsg(on){
    var link = document.querySelector('a[href="mensajes.html"]');
    if(!link) return;
    if(on) link.classList.add('msg-glow'); else link.classList.remove('msg-glow');
  }

  async function refreshMsg(client, me){
    try {
      var convs = await client.from('conversations')
        .select('id')
        .or('member_a.eq.' + me + ',member_b.eq.' + me);
      if (!convs.data || convs.data.length === 0) { glowMsg(false); return; }
      var ids = convs.data.map(function(c){ return c.id; });
      var r = await client.from('private_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', me)
        .eq('read', false);
      glowMsg((r.count || 0) > 0);
    } catch(e) {}
  }

  waitForSupabase(async function(){
    var client = getClient();
    var s = await client.auth.getSession();
    var session = s.data && s.data.session;
    if(!session) return;
    var me = session.user.id;

    refreshMsg(client, me);

    client.channel('msg-glow-' + me)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, function(p){
        if (p.new && p.new.sender_id !== me) refreshMsg(client, me);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'private_messages' }, function(){
        refreshMsg(client, me);
      })
      .subscribe();

    setInterval(function(){ refreshMsg(client, me); }, 30000);
  });
})();

/* ── 9) Créditos permanentes ── */
(function(){
  var f = document.createElement('div');
  f.style.cssText = 'text-align:center;color:#8a8578;font-size:12px;padding:20px 12px 28px;letter-spacing:.08em;';
  f.innerHTML = '♛ Créditos — plataforma dirigida a las <b style="color:#c9a24b;">Diosas Almozara</b> · Contenido simbólico y consensuado entre adultos.';
  document.body.appendChild(f);
})();

/* ── 10) Botón Compartir ── */
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
/* ══ Enlace Subastas en el menú ══ */
(function(){
  var nav = document.querySelector('header nav') || document.querySelector('header div');
  if (nav && !document.querySelector('a[href="subastas.html"]')) {
    var a = document.createElement('a');
    a.href = 'subastas.html';
    a.textContent = 'Subastas';
    a.style.color = '#d4af37';
    a.style.textDecoration = 'none';
    if (!nav.querySelector('a.navlink') === false) a.className = 'navlink';
    nav.appendChild(a);
  }
})();
/* ══ Enlace Moderación solo para Staff ══ */
(function(){
  waitForSupabase(async function(){
    var client = getClient();
    var s = await client.auth.getSession();
    if (!s.data.session) return;
    
    var [adm, mod] = await Promise.all([
      client.rpc('am_i_superadmin'),
      client.rpc('am_i_moderator')
    ]);
    
    if (adm.data || mod.data) {
      var nav = document.querySelector('header nav') || document.querySelector('header div');
      if (nav && !document.querySelector('a[href="moderacion.html"]')) {
        var l = document.createElement('a');
        l.href = 'moderacion.html';
        l.textContent = 'Moderación';
        l.style.color = '#d4af37';
        l.style.textDecoration = 'none';
        nav.appendChild(l);
      }
    }
  });
})();
/* ══ Idioma preferido del miembro ══ */
(function(){
  waitForSupabase(async function(){
    var client = getClient();
    var s = await client.auth.getSession();
    if (!s.data.session) return;
    var p = await client.from('profiles').select('lang').eq('id', s.data.session.user.id).maybeSingle();
    var lang = (p.data && p.data.lang) || 'es';
    var cur = 'es';
    var m = document.cookie.match(/googtrans=\/es\/([a-z-]+)/i);
    if (m) cur = m[1];
    if (lang === cur) return;
    if (lang === 'es') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    } else {
      document.cookie = 'googtrans=/es/' + lang + '; path=/';
    }
    if (sessionStorage.getItem('lang_applied') !== lang) {
      sessionStorage.setItem('lang_applied', lang);
      location.reload();
    }
  });
})();

/* ══ Enlace Mi Galería ══ */
(function(){
  waitForSupabase(async function(){
    var client = getClient();
    var s = await client.auth.getSession();
    if (!s.data.session) return;
    var nav = document.querySelector('header nav') || document.querySelector('header div');
    if (nav && !document.querySelector('a[href="mi-galeria.html"]')) {
      var l = document.createElement('a');
      l.href = 'mi-galeria.html';
l.textContent = 'Galería personal';      l.style.color = '#d4af37';
      l.style.textDecoration = 'none';
      nav.appendChild(l);
    }
  });
})();
/* ══ Menú móvil desplegable ══ */
(function(){
  function init(){
    var header = document.querySelector('header');
    if (!header || header.querySelector('.mob-btn')) return;
    var nav = header.querySelector('nav') || header.querySelector('div');
    if (!nav) return;

    var st = document.createElement('style');
    st.textContent =
      '@media (max-width:760px){' +
        'header{position:relative;flex-wrap:wrap}' +
        'header .mob-btn{display:inline-flex !important}' +
        'header nav, header div{display:none !important}' +
        'header nav.mob-open, header div.mob-open{display:flex !important;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(13,10,14,.98);border-bottom:1px solid #2a2a3d;padding:14px 22px;gap:14px;z-index:99997;max-height:70vh;overflow-y:auto}' +
        'header nav.mob-open a, header div.mob-open a{padding:6px 0;font-size:15px}' +
      '}' +
      '@media (min-width:761px){header .mob-btn{display:none !important}}';
    document.head.appendChild(st);

    var btn = document.createElement('button');
    btn.className = 'mob-btn';
    btn.textContent = '☰';
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.style.cssText = 'display:none;align-items:center;justify-content:center;background:transparent;color:#d4af37;border:1px solid #d4af37;border-radius:10px;font-size:20px;padding:6px 13px;cursor:pointer;margin-left:12px;';
    header.appendChild(btn);

    btn.onclick = function(e){ e.stopPropagation(); nav.classList.toggle('mob-open'); };
    document.addEventListener('click', function(e){
      if (nav.classList.contains('mob-open') && !nav.contains(e.target) && e.target !== btn) nav.classList.remove('mob-open');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
