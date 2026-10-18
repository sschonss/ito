/* ito — Atualizar, eventos, service worker e início */
'use strict';
/* ---------- Atualizar: limpa os arquivos guardados e recarrega ---------- */
async function hardUpdate(){
  toast('Atualizando…');
  try{
    if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
    if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); }
    const files=['./','index.html','styles.css','app.js','config.js','lib/qrcodegen.js','manifest.webmanifest'];
    await Promise.all(files.map(f=>fetch(f,{cache:'reload'}).catch(()=>{})));
  }catch(e){}
  const url=new URL(location.href); url.searchParams.set('u',Date.now()); location.replace(url.toString());
}

/* ---------- Eventos ---------- */
document.addEventListener('click',e=>{
  if(soundOn && !actx) audio();
  const b=e.target.closest('[data-act]'); if(!b) return;
  const menu=$('#menu'); if(menu.open && menu.contains(b)) menu.close();
  const fn=act[b.dataset.act]; if(fn){ e.preventDefault(); fn(b); }
});
$('#menu').addEventListener('click',e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
$('#dialog').addEventListener('click',e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; if(!S && !P && !NET.role) home(true); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('ito instalado'); });

/* ---------- Service worker ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      swReg=await navigator.serviceWorker.register('sw.js');
      const showBar=()=>{ $('#updateBar').hidden=false; };
      if(swReg.waiting && navigator.serviceWorker.controller) showBar();
      swReg.addEventListener('updatefound',()=>{ const w=swReg.installing; w && w.addEventListener('statechange',()=>{ if(w.state==='installed' && navigator.serviceWorker.controller) showBar(); }); });
      let reloading=false;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!window.__itoUpdating || reloading) return; reloading=true; location.reload(); });
      setInterval(()=>swReg.update().catch(()=>{}), 30*60*1000);
    }catch(e){}
  });
}

/* ---------- Início ---------- */
(async function start(){
  await initKeys();
  if(location.search) history.replaceState(null,'',location.pathname+location.hash);
  const h=parseHash(location.hash), online=ls.get(ONLINE_KEY,null);
  if(h && online && online.code===h.code){ online.role==='host'?startHost(h,online.st):startGuest(h,online.st,online.role==='tv'); }
  else if(h){ startGuest(h); }
  else home();
})();
