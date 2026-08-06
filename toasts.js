/* ══ Corona en la pestaña (favicon) ══ */
(function(){
  if (document.querySelector('link[rel="icon"]')) return;
  var link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">👑</text></svg>');
  document.head.appendChild(link);
})();
/* ══════ TOASTS DE NOTIFICACIONES EN TIEMPO REAL ══════ */
(function(){
  // Crear el contenedor si no existe
  if(!document.getElementById('toast-container')){
    const c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }

  function escapeHtml(v){
    return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function showToast(n){
    const container = document.getElementById('toast-container');
    if(!container) return;

    const a = document.createElement('a');
    a.className = 'toast';
    a.href = n.link || 'notificaciones.html';
    a.innerHTML = `
      <div class="toast-title">♛ ${escapeHtml(n.title || 'Nueva notificación')}</div>
      ${n.body ? `<div class="toast-body">${escapeHtml(n.body)}</div>` : ''}
      <div class="toast-meta">Ahora · clic para ver</div>
    `;
    container.appendChild(a);

    // Auto-cerrar a los 6 segundos
    const timer = setTimeout(()=>dismissToast(a), 6000);

    a.addEventListener('click', () => {
      clearTimeout(timer);
      dismissToast(a);
    });
  }

  function dismissToast(el){
    if(!el || el.classList.contains('out')) return;
    el.classList.add('out');
    setTimeout(()=>el.remove(), 350);
  }

  // Esperar a que Supabase esté disponible (cada página lo carga a su ritmo)
  function waitForSupabase(cb, tries){
    tries = tries || 0;
    if(window.supabase && typeof window.supabase.createClient === 'function'){
      cb();
    } else if(tries < 50){
      setTimeout(()=>waitForSupabase(cb, tries+1), 100);
    }
  }

  async function start(){
    waitForSupabase(async () => {
      // Crear nuestro propio cliente (las credenciales ya son públicas en el frontend)
      if(!window.__toastClient){
        window.__toastClient = window.supabase.createClient(
          'https://ofyedqoipexpsvjsipze.supabase.co',
          'sb_publishable_X4SJUT7cnbFuv7l_1Y3OjQ__poTLx0b'
        );
      }
      const client = window.__toastClient;

      const { data: { session } } = await client.auth.getSession();
      if(!session) return;

      const userId = session.user.id;

      // Suscribirse a nuevas notificaciones para este usuario
      client.channel('toast-notifs-' + userId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          showToast(payload.new);
        })
        .subscribe();
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
