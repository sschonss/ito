/* ito — Configuração, armazenamento, estado, sorteio, código da sala e componentes */
'use strict';
const VERSION = '2.0.1';
const MIN_ROUNDS = 1, MAX_ROUNDS = 20;


/* ---------- Configuração ---------- */
const CFG = window.ITO_CONFIG || {};
const P2P = window.ITO_P2P || {
  n: ['https://cdn.jsdelivr.net/npm/@trystero-p2p/nostr@0.25.4/+esm', 'https://esm.sh/@trystero-p2p/nostr@0.25.4'],
  m: ['https://cdn.jsdelivr.net/npm/@trystero-p2p/mqtt@0.25.4/+esm',  'https://esm.sh/@trystero-p2p/mqtt@0.25.4']
};
const APP_ID='ito-sschonss-github-io', CONNECT_TIMEOUT=15000, HOST_GRACE=5000;

/* ---------- Armazenamento ---------- */
const ls = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const ONLINE_KEY='ito-online';
const CID=(()=>{ let c=ls.get('ito-cid',null); if(!c){ c=[...crypto.getRandomValues(new Uint32Array(2))].map(x=>x.toString(36)).join(''); ls.set('ito-cid',c); } return c; })();
let myName=ls.get('ito-name','');

/* ---------- Estado ---------- */
let S=null;                 // partida na tela
let P=null;                 // sala aberta (antes de conectar)
const draft={ players:10, rounds:5, mask:ALL_MASK };   // até 10 pessoas por sala
let peek=false, peekKey='', lastEv='';
let installEvt=null, swReg=null;
const drafts={};      // textos digitados e ainda não enviados (sobrevivem às atualizações da tela)
let nextReadyAt=0, nextReadyKey='', pending_next=false, reactOpenState=false;
const NET={ libs:{}, links:[], role:null, code:null, st:null, peers:{}, failed:false, timedOut:false, timer:null, graceTimer:null };

const $=s=>document.querySelector(s);
const view=$('#view');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vibrate=p=>{ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

/* ---------- Sorteio igual em todos os celulares ---------- */
function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng=s=>mulberry(xmur3(s)());
function shuffle(arr,r){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
const deckFor=(code,game,round)=>shuffle([...Array(100)].map((_,i)=>i+1), rng(code+'|'+game+'|'+round));
const deck=()=>deckFor(S.code,S.game,S.round);
function themeAt(x, pos){
  const order=shuffle(THEMES.map((t,i)=>[t,i]).filter(([t])=>x.mask&(1<<t[3])).map(([,i])=>i), rng(x.code+'|themes'));
  return THEMES[order[pos%order.length]];
}
function themeOf(x){ return x.custom ? [x.custom.title, x.custom.low, x.custom.high, -1] : themeAt(x, x.themePos); }
const theme=()=>themeOf(S);

/* ---------- Código da sala: ABCD-EFGH ---------- */
const L24='ABCDEFGHJKLMNPQRSTUVWXYZ';
const MASK_BITS=14;   // até 14 categorias no código da sala
function enc(n,rounds,mask){ let v=(rounds-1)*(1<<MASK_BITS)+mask, s=''; for(let i=0;i<4;i++){ s=L24[v%24]+s; v=Math.floor(v/24); } return s; }
/* Formato do código: a versão vai no link (#ABCD-EFGH~v2), assim mudanças futuras
   não quebram convites antigos. Código digitado = formato atual. */
const CODE_VERSION=2;
function parseCode(raw, ver){
  const s=(raw||'').trim().toUpperCase().replace(/[^A-Z]/g,'');
  if(s.length!==8 || [...s].some(c=>!L24.includes(c))) return null;
  let v=0; for(const c of s.slice(4)) v=v*24+L24.indexOf(c);
  const code=s.slice(0,4)+'-'+s.slice(4);
  const v2=()=>{ const mask=v%(1<<MASK_BITS), rounds=Math.floor(v/(1<<MASK_BITS))+1;
    return rounds>=MIN_ROUNDS && rounds<=MAX_ROUNDS && (mask&ALL_MASK) ? {code, n:10, rounds, mask:mask&ALL_MASK, ver:2} : null; };
  const v1=()=>{ const mask=v%256, r=Math.floor(v/256), rounds=r%MAX_ROUNDS+1, n=Math.floor(r/MAX_ROUNDS)+2;   // formato até a versão 1.7
    return n>=2 && n<=10 && (mask&ALL_MASK) ? {code, n:10, rounds, mask:mask&255&ALL_MASK, ver:1} : null; };
  if(ver===1) return v1();
  if(ver===2) return v2();
  return v2() || v1();
}
/* #ABCD-EFGH~v2~kFINGERPRINT  (k = impressão da chave do dono da sala, ver "estados assinados") */
function parseHash(h){
  const parts=decodeURIComponent((h||'').replace(/^#/,'')).split('~');
  const vp=parts.find(x=>/^v\d+$/.test(x)), kp=parts.find(x=>/^k[0-9a-z]{6,}$/.test(x));
  const room=parseCode(parts[0], vp?+vp.slice(1):undefined);
  if(room && kp) room.fp=kp.slice(1);
  return room;
}
function newRoom(){ const v=new Uint32Array(4); crypto.getRandomValues(v); return parseCode([...v].map(x=>L24[x%24]).join('')+enc(draft.players,draft.rounds,draft.mask)); }
function roomHash(code){ const fp=NET.ownerFp||''; return '#'+code+'~v'+CODE_VERSION+(fp?'~k'+fp:''); }
const roomLink=code=>location.origin+location.pathname+roomHash(code);
const catNames=mask=>mask===ALL_MASK?'Todas as categorias':CATS.filter((_,i)=>mask&(1<<i)).map(c=>c.name).join(' · ');
const nameOf=p=>(S && S.names && S.names[p-1]) || `Jogador ${p}`;

/* ---------- Componentes ---------- */
let toastTimer;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2600); }
function dialog({title,body,actions}){
  return new Promise(resolve=>{
    const d=$('#dialog'); if(d.open) d.close();
    $('#dlgTitle').textContent=title; $('#dlgBody').innerHTML=body||'';
    $('#dlgActions').innerHTML=actions.map(a=>`<button class="btn ${a.cls||'soft'}" value="${a.value}">${a.label}</button>`).join('');
    d.returnValue=''; d.onclose=()=>resolve(d.returnValue); d.showModal();
  });
}
const confirmBox=(title,body,ok='Confirmar')=>dialog({title,body:`<div class="cbody">${body}</div>`,actions:[{label:'Cancelar',value:'no'},{label:ok,value:'ok',cls:'brand'}]}).then(v=>v==='ok');
function setMeta(html){ $('#appbarMeta').innerHTML=html||''; }
function render(html,dock,keep){
  const y=window.scrollY, ae=document.activeElement;
  const typing=keep && ae && ae.tagName==='INPUT' && ae.id && view.contains(ae) ? {id:ae.id, v:ae.value, s:ae.selectionStart} : null;
  view.className='view'+(keep?'':' enter')+(dock?' has-dock':'');
  view.innerHTML=html;
  window.scrollTo({top:keep?y:0});
  if(typing){ const el=document.getElementById(typing.id); if(el){ el.value=typing.v; el.focus(); try{ el.setSelectionRange(typing.s,typing.s); }catch(e){} } }
}
const svgStroke=svg=>svg.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
const stepper=(key,val,min,max,unit)=>`<div class="stepper">
  <button data-act="step" data-k="${key}" data-d="-1" aria-label="Menos" ${val<=min?'disabled':''}>−</button>
  <div class="val"><strong>${val}</strong><span>${unit}</span></div>
  <button data-act="step" data-k="${key}" data-d="1" aria-label="Mais" ${val>=max?'disabled':''}>+</button></div>`;
const roomCard=(code,info)=>`<section class="panel room-code">
    <p class="eyebrow">Código da sala</p>
    <div class="code">${code}</div>
    <p class="room-info">${info}</p>
    <div class="btn-row three">
      <button class="btn soft" data-act="copy">${svgStroke(I.copy)}Copiar</button>
      <button class="btn soft" data-act="qr">${svgStroke(I.qr)}QR code</button>
      <button class="btn brand" data-act="share">${svgStroke(I.share)}Convidar</button>
    </div>
  </section>`;
function qrSvg(text){
  const q=qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM), b=4, n=q.size+b*2;
  let d=''; for(let y=0;y<q.size;y++) for(let x=0;x<q.size;x++) if(q.getModule(x,y)) d+=`M${x+b},${y+b}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
