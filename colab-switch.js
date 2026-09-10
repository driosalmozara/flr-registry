/* ══ COLAB SWITCH — muestra u oculta Colaboración Voluntaria según la Administración ══ */
(function(){
  function getClient(){
    try { if (typeof db !== 'undefined' && db) return db; } catch(e){}
    try { if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){}
    return null;
  }
  function hideLinks(){
    document.querySelectorAll('a, button').forEach(function(el){
      var href = (el.getAttribute('href') || '');
      var txt = (el.textContent || '').trim().toLowerCase();
      if (/colaboracion\.html|colab\.html/.test(href) ||
          txt.indexOf('colaboracion voluntaria') !== -1 ||
          txt.indexOf('colaboración voluntaria') !== -1) {
        el.style.display = 'none';
      }
    });
  }
  async function init(){
    var client = getClient();
    if (!client) return;
    try {
      var res = await client.from('app_settings').select('key, value').in('key', ['colab_enabled','colab_url']);
      var enabled = true, url = '';
      (res.data || []).forEach(function(r){
        if (r.key === 'colab_enabled') enabled = (r.value === '1');
        if (r.key === 'colab_url') url = r.value || '';
      });
      window.COLAB_ENABLED = enabled;
      window.COLAB_URL = url;
      if (!enabled) { hideLinks(); setTimeout(hideLinks, 800); setTimeout(hideLinks, 2500); }
    } catch(e){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
