(function(){
  function injectOnce(){
    if (document.getElementById('apps-menu-item')) return;
    var els = Array.from(document.querySelectorAll('a, button'));
    // El ítem "Preguntas frecuentes" solo existe como enlace/botón dentro del menú MÁS
    var pf = els.find(function(el){ return /preguntas\s+frecuentes/i.test((el.textContent||'').trim()); });
    var term = els.find(function(el){ return /t[eé]rminos/i.test((el.textContent||'').trim()); });
    var anchor = pf || term;
    if (!anchor || !anchor.parentNode) return;
    var a = document.createElement('a');
    a.id = 'apps-menu-item';
    a.href = 'aplicaciones.html';
    a.textContent = '📱 Aplicaciones Queendomland';
    a.className = anchor.className || '';
    a.style.cssText = anchor.style.cssText || '';
    if (pf) anchor.parentNode.insertBefore(a, pf);          // entre Términos y Preguntas frecuentes
    else anchor.parentNode.insertBefore(a, anchor.nextSibling);
  }
  function start(){
    injectOnce();
    new MutationObserver(injectOnce).observe(document.body, { childList:true, subtree:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
