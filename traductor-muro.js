/* ══ TRADUCTOR DE MURO — detecta idioma y ofrece traducir ══ */
(function(){
'use strict';

/* ═══ CONFIGURACIÓN ═══
   Ajusta CFG.selectors a las clases reales de muro.html
   (posteos, respuestas y comentarios). */
const CFG = {
  selectors: ['.post-body', '.post-text', '.reply-body', '.comment-body', '.muro-text'],
  minChars: 40,   // mínimo de caracteres para analizar
  minWords: 8,    // mínimo de palabras para una detección fiable
  fallback: 'es'
};

const NAMES = { es:'español', en:'inglés', pt:'portugués', fr:'francés', de:'alemán', it:'italiano' };

/* Palabras vacías por idioma (sin diacríticos) */
const STOP_RAW = {
es:['que','de','la','el','en','y','a','los','del','se','las','por','un','para','con','no','una','su','al','lo','como','mas','pero','sus','le','ya','o','este','si','porque','esta','son','entre','cuando','muy','tambien','me','hay','quien','desde','todo','nos','durante','todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mi','antes','algunos','unos','yo','otro','otras','otra','tanto','esa','estos','mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo','nosotros','nosotras','vosotros','vosotras','mio','mia','tuyo','tuya','suyo','suya','mios','mias','tuyos','tuyas','suyos','suyas','te','ti','tu','tus','ellas','os','fue','era','eres','somos','sois','estoy','estamos','estais','estan','he','has','ha','hemos','habeis','han','hizo','hicimos','hicieron'],
en:['the','of','and','a','to','in','is','you','that','it','he','was','for','on','are','as','with','his','they','i','at','be','this','have','from','or','one','had','by','but','not','what','all','were','we','when','your','can','said','there','use','an','each','which','she','do','how','their','if','will','up','other','about','out','many','then','them','these','so','some','her','would','make','like','him','into','time','has','look','two','more','write','go','see','number','way','could','people','my','than','first','been','call','who','its','now','find','long','down','day','did','get','come','made','may','part','am','us','just','really','very','want','need','know','think','good','great','love','thanks','please'],
pt:['que','de','a','o','e','em','um','para','com','nao','uma','os','no','se','na','por','mais','as','dos','das','ao','aos','ou','quando','muito','nos','ja','eu','tambem','so','pelo','pela','entre','depois','sem','mesmo','ter','seu','sua','ser','ha','lhe','dele','dela','eles','elas','voce','voces','meu','minha','esta','este','isso','isto','aquilo','mas','porque','porem','contudo','todavia','entretanto','assim','entao','agora','ainda','sempre','nunca','talvez','quem','qual','quais','onde','como','foi','era','sou','somos','sao','estou','estamos','estao','tenho','tem','temos','fiz','fez','fizemos'],
fr:['le','de','et','a','un','il','ne','je','pas','que','pour','dans','sur','plus','par','ce','se','son','sont','ou','avec','faire','comme','on','nous','mais','encore','aussi','leur','ses','mon','ma','mes','ton','ta','tes','des','du','au','aux','cette','ces','deux','elle','lui','eux','tres','tout','tous','toute','toutes','sans','sous','chez','donc','car','ainsi','puis','quand','lorsque','pourquoi','parce','vous','votre','vos','notre','nos','moi','toi','ils','elles','est','etait','sera','ont','avait','aura','suis','es','sommes','etes','ai','as','avons','avez'],
de:['der','die','und','in','den','von','zu','das','mit','sich','des','auf','fur','ist','im','dem','nicht','ein','eine','als','auch','es','an','werden','aus','er','hat','dass','sie','nach','wird','bei','einer','um','am','sind','noch','wie','einem','uber','einen','so','zum','war','haben','nur','oder','aber','vor','zur','bis','mehr','durch','man','sein','wurde','wer','diese','dieser','dieses','ich','du','wir','ihr','mich','dir','uns','euch','ihnen','mein','meine','dein','deine','kein','keine','kann','muss','will','soll','darf','mag','mochte','mochten','bin','bist','seid','gewesen'],
it:['che','di','e','il','un','a','per','in','sono','con','non','la','le','i','gli','lo','al','ai','alla','alle','allo','agli','del','della','delle','dei','degli','dello','da','dal','dalla','su','sul','sulla','tra','fra','ma','se','come','anche','piu','puo','essere','avere','ha','ho','hai','hanno','siamo','siete','io','tu','lui','lei','noi','voi','loro','mio','mia','miei','mie','tuo','tua','suoi','sue','nostro','nostra','vostro','vostra','questo','questa','questi','queste','quello','quella','quelli','quelle','chi','cosa','cui','dove','quando','perche','molto','poco','tutto','tutti','tutta','tutte','niente','nulla','ancora','gia','sempre','mai','forse','certo','quindi','allora','oppure','pero','tuttavia','invece','dunque','era','ero','eri','eravamo','eravate','erano']
};
const STOP = {};
for (const k in STOP_RAW) STOP[k] = new Set(STOP_RAW[k]);

function norm(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

/* Detección por frecuencia de palabras vacías */
function detectLang(text){
  const tokens = norm(text).split(/[^a-z0-9']+/).filter(Boolean);
  if (tokens.length < CFG.minWords) return null;
  const scores = [];
  for (const lang in STOP){
    const set = STOP[lang];
    let hits = 0;
    for (let i=0;i<tokens.length;i++) if (set.has(tokens[i])) hits++;
    scores.push([lang, hits / tokens.length]);
  }
  scores.sort((a,b)=>b[1]-a[1]);
  const best = scores[0], second = scores[1] ? scores[1][1] : 0;
  if (best[1] < 0.08) return null;            // muy pocas pistas
  if (best[1] < second * 1.4) return null;    // empate → no fiable
  return best[0];
}

function getClient(){
  try { if (typeof db !== 'undefined' && db) return db; } catch(e){}
  if (window.__toastClient) return window.__toastClient;
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let myLang = null;
const processed = new WeakSet();

async function initLang(){
  try {
    const client = getClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session){ myLang = CFG.fallback; return; }
    const { data } = await client.from('profiles').select('lang').eq('id', session.user.id).maybeSingle();
    myLang = (data && data.lang) || CFG.fallback;
  } catch(e){ myLang = CFG.fallback; }
}

/* Traducción: Google (no oficial) con respaldo MyMemory */
async function translate(text, tl, detected){
  try {
    const u1 = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + detected + '&tl=' + tl + '&dt=t&q=' + encodeURIComponent(text);
    const r1 = await fetch(u1);
    if (r1.ok){
      const j = await r1.json();
      const out = (j[0]||[]).map(s=>s[0]).join('');
      if (out) return out;
    }
  } catch(e){}
  const u2 = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.slice(0,480)) + '&langpair=' + detected + '|' + tl;
  const r2 = await fetch(u2);
  if (!r2.ok) throw new Error('translate fail');
  const j2 = await r2.json();
  const out2 = j2 && j2.responseData && j2.responseData.translatedText;
  if (!out2) throw new Error('translate fail');
  return out2;
}

function addTranslateBtn(el, lang, original){
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-top:6px;';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.style.cssText = 'background:transparent;color:#d4af37;border:1px solid rgba(212,175,55,.5);border-radius:999px;padding:3px 10px;font-size:11px;cursor:pointer;';
  const label = () => '🌐 Traducir de ' + (NAMES[lang] || lang);
  btn.innerHTML = label();
  let state = 'original', translated = null;
  btn.onclick = async function(){
    if (state === 'translated'){
      el.innerText = original; state = 'original'; btn.innerHTML = label(); return;
    }
    if (translated){
      el.innerText = translated; state = 'translated';
      btn.innerHTML = '🌐 Ver original (' + (NAMES[lang]||lang) + ')'; return;
    }
    btn.disabled = true; btn.innerHTML = '⏳ Traduciendo…';
    try {
      translated = await translate(original, myLang, lang);
      el.innerText = translated; state = 'translated';
      btn.innerHTML = '🌐 Ver original (' + (NAMES[lang]||lang) + ')';
      btn.disabled = false;
    } catch(e){
      btn.innerHTML = '⚠ No se pudo traducir';
      setTimeout(()=>{ btn.disabled = false; btn.innerHTML = label(); }, 2500);
    }
  };
  wrap.appendChild(btn);
  el.parentNode.insertBefore(wrap, el.nextSibling);
}

const SEL = () => CFG.selectors.join(',');

function scan(root){
  if (!myLang) return;
  const sel = SEL();
  const list = [];
  const base = (root && root.querySelectorAll) ? root : document;
  base.querySelectorAll(sel).forEach(el => list.push(el));
  if (root && root.nodeType === 1 && root.matches && root.matches(sel)) list.push(root);
  list.forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    const text = (el.innerText || '').trim();
    if (text.length < CFG.minChars) return;
    const lang = detectLang(text);
    if (!lang || lang === myLang) return;
    addTranslateBtn(el, lang, text);
  });
}

function start(){
  initLang().then(()=>{
    scan(document);
    new MutationObserver(muts=>{
      muts.forEach(m=>{
        (m.addedNodes||[]).forEach(n=>{ if (n.nodeType === 1) scan(n); });
      });
    }).observe(document.body, { childList:true, subtree:true });
    setInterval(()=>scan(document), 3000); // cubre re-renderizados por innerHTML
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
})();
