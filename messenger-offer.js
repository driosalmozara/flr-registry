(function(){
  try{ if(localStorage.getItem('ql_msgr_offer')==='1') return; }catch(e){}
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true) return;
  var st=document.createElement('style');
  st.textContent='#msgr-offer{position:fixed;left:0;right:0;bottom:0;z-index:99980;background:linear-gradient(180deg,rgba(29,23,18,.98),rgba(13,12,10,.98));border-top:1px solid rgba(201,162,75,.5);padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;gap:10px;align-items:center}#msgr-offer .tx{flex:1;color:#f7f2ea;font-size:13px;line-height:1.4}#msgr-offer button{background:transparent;color:#e7cf9a;border:1px solid rgba(201,162,75,.55);border-radius:999px;padding:7px 12px;font-size:12px;cursor:pointer;flex:none}';
  document.head.appendChild(st);
  var bar=document.createElement('div'); bar.id='msgr-offer';
  bar.innerHTML='<span style="font-size:22px">💬</span><span class="tx"><b>Messenger Queendomland</b><br>Lleva el chat y tus privados como app en tu móvil.</span><button onclick="openMsgrInstall()">📱 Instalar</button><button onclick="dismissMsgrOffer()">✕</button>';
  document.body.appendChild(bar);
  window.dismissMsgrOffer=function(){ try{localStorage.setItem('ql_msgr_offer','1');}catch(e){} bar.remove(); };
  window.openMsgrInstall=function(){
    var ov=document.createElement('div'); ov.id='msgr-inst-ov';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99990;display:flex;align-items:center;justify-content:center;padding:18px;';
    ov.innerHTML='<div style="background:#161625;border:1px solid #c9a24b;border-radius:16px;padding:22px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;">'
      +'<h3 style="margin:0 0 6px;color:#e7cf9a;">💬 Instalar Messenger Queendomland</h3>'
      +'<p style="color:#a1a1aa;font-size:13px;margin:0 0 14px;">La app de mensajería de la casa, independiente de la app principal.</p>'
      +'<div style="display:grid;gap:12px;">'
      +'<div style="background:#0b0b12;border:1px solid #2a2a3d;border-radius:12px;padding:14px;"><b style="color:#e7cf9a;">🤖 Android</b><ol style="color:#d4d4d8;font-size:13px;margin:8px 0 0;padding-left:18px;line-height:1.6;"><li>Abre <b>messenger.queendomland.com</b> en Chrome.</li><li>Toca el menú <b>⋮</b> → <b>«Instalar aplicación»</b>.</li></ol><a href="https://messenger.queendomland.com" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;color:#0d0c0a;background:#c9a24b;border-radius:999px;padding:8px 16px;font-weight:700;font-size:13px;text-decoration:none;">Abrir en Chrome</a></div>'
      +'<div style="background:#0b0b12;border:1px solid #2a2a3d;border-radius:12px;padding:14px;"><b style="color:#e7cf9a;">🍎 iPhone / iPad</b><ol style="color:#d4d4d8;font-size:13px;margin:8px 0 0;padding-left:18px;line-height:1.6;"><li>Abre <b>messenger.queendomland.com</b> en Safari.</li><li>Toca <b>Compartir ⬆</b> → <b>«Añadir a pantalla de inicio»</b>.</li></ol><a href="https://messenger.queendomland.com" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;color:#0d0c0a;background:#c9a24b;border-radius:999px;padding:8px 16px;font-weight:700;font-size:13px;text-decoration:none;">Abrir en Safari</a></div>'
      +'</div><p style="text-align:center;margin:14px 0 0;"><button onclick="document.getElementById(\'msgr-inst-ov\').remove()" style="background:transparent;color:#a1a1aa;border:none;font-size:13px;cursor:pointer;">Cerrar</button></p></div>';
    ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
  };
})();
