'use strict';
const VERSION = '1.5.1';
const STORE = 'ito-game-v2', MIN_ROUNDS = 1, MAX_ROUNDS = 20;

/* ---------- Temas por categoria: [título, o que é 1, o que é 100] ---------- */
const CATS = [
  { name:'Comida e bebida', themes:[
    ['Comidas','odeio','amo'],['Doces','sem graça','delicioso'],['Bebidas','odeio','amo'],['Frutas','odeio','amo'],
    ['Café da manhã','sem chance','o melhor'],['Sabores de pizza','nunca peço','sempre peço'],['Lanches de cinema','dispensável','indispensável'],
    ['Comidas de festa','sobra','acaba primeiro'],['Pratos pela dificuldade','fácil','só chef'],['Comidas pela ardência','nada','fogo puro']]},
  { name:'Lugares e viagens', themes:[
    ['Lugares para viajar','nem pagando','sonho de vida'],['Lugares para um primeiro encontro','péssimo','ideal'],['Lugares pela temperatura','gelado','escaldante'],
    ['Lugares da cidade','vazio','lotado'],['Lugares para se esconder','óbvio','ninguém acha'],['Meios de transporte','desconfortável','confortável'],
    ['Itens para a mala','dispensável','essencial'],['Lugares para morar','nunca','sonho']]},
  { name:'Bichos e natureza', themes:[
    ['Animais','inofensivo','perigosíssimo'],['Bichos de estimação','sem graça','fofíssimo'],['Animais pelo tamanho','minúsculo','gigante'],
    ['Animais pela velocidade','lentíssimo','velocíssimo'],['Animais pela inteligência','nada esperto','genial'],['Plantas e flores','sem graça','linda'],
    ['Dias de clima','horrível','perfeito'],['Fenômenos da natureza','tranquilo','assustador']]},
  { name:'Cotidiano', themes:[
    ['Objetos de casa','inútil','indispensável'],['Tarefas domésticas','de boa','detesto'],['Coisas pelo preço','baratíssima','caríssima'],
    ['Coisas pelo peso','levíssima','pesadíssima'],['Coisas pelo tamanho','minúscula','gigante'],['Coisas pela idade','nova','antiquíssima'],
    ['Coisas pelo barulho','silenciosa','barulhenta'],['Aplicativos','esqueço que existe','viciante'],['Programas de domingo','tédio','perfeito'],
    ['Coisas que dá pra comprar com R$ 10','inútil','vale muito']]},
  { name:'Diversão e cultura', themes:[
    ['Filmes e séries','chato','emocionante'],['Músicas para festa','esvazia a pista','todo mundo dança'],['Esportes','fácil','dificílimo'],
    ['Hobbies','barato','caro'],['Talentos de show de calouros','vaia','aplausos de pé'],['Pessoas famosas','desconhecida','todo mundo conhece'],
    ['Jogos e brincadeiras','chato','viciante'],['Brinquedos de infância','esquecível','inesquecível'],['Presentes de aniversário','péssimo','perfeito']]},
  { name:'Trabalho e estudo', themes:[
    ['Profissões','tranquila','estressante'],['Profissões dos sonhos','nunca','nasci para isso'],['Matérias da escola','chata','legal'],
    ['Coisas para aprender','fácil','dificílimo'],['Desculpas para faltar ao trabalho','ridícula','convincente'],['Invenções','dispensável','mudou o mundo'],
    ['Habilidades do dia a dia','inútil','essencial'],['Profissões pelo salário','baixo','altíssimo']]},
  { name:'Fantasia e aventura', themes:[
    ['Superpoderes','inútil','incrível'],['Habilidades no apocalipse zumbi','inútil','salva vidas'],['Itens para uma ilha deserta','inútil','essencial'],
    ['Criaturas fantásticas','fofa','assustadora'],['Armas contra um monstro','inútil','vitória garantida'],['Vilões','bonzinho','maligno'],
    ['Desafios de aventura','moleza','impossível'],['Tesouros','bugiganga','fortuna']]},
  { name:'Sentimentos e situações', themes:[
    ['Coisas que dão medo','nada','pavor'],['Situações constrangedoras','tranquilo','quero sumir'],['Coisas que fazem chorar','nada','choro rios'],
    ['Gestos românticos','brega','derrete o coração'],['Mentiras','inocente','imperdoável'],['Lembranças de infância','nada nostálgica','muita saudade'],
    ['Coisas nojentas','de boa','nojento demais'],['Personalidades','calmíssima','explosiva'],['Dores','leve','insuportável'],['Coisas','dão sono','dão energia']]}
];
const ALL_MASK = (1<<CATS.length)-1;
const THEMES = CATS.flatMap((c,ci)=>c.themes.map(t=>[t[0],t[1],t[2],ci]));

/* ---------- Ícones ---------- */
const I = {
  share:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6"/></svg>',
  refresh:'<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  sliders:'<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  exit:'<svg viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></svg>',
  download:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  chevron:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.7 0 6 3.7 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  thread:'<svg viewBox="0 0 40 16"><path d="M2 10c6-6 10 4 17-2s11 2 15-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="7" r="3" fill="currentColor"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>',
  broken:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3l-2 4 3 2-1.5 4M12 7.5c1.4-1.9 3-3 5-3 3.7 0 6 3.7 4.5 7.2C19.5 16.4 12 21 12 21"/></svg>'
};

Object.assign(I, {
  wifiOff:'<svg viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5-2.7M14 10.2a10 10 0 0 1 5 2.7M2 9.3a15 15 0 0 1 5-3M12 5a15 15 0 0 1 10 4.3"/><circle cx="12" cy="20" r="1"/></svg>',
  qr:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
  pencil:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  remove:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 9h6"/></svg>',
  list:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  play:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M12 8v8M8.5 12.5 12 16l3.5-3.5"/></svg>'
});

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
const LOCAL_KEY='ito-game-v2', ONLINE_KEY='ito-online';
const CID=(()=>{ let c=ls.get('ito-cid',null); if(!c){ c=[...crypto.getRandomValues(new Uint32Array(2))].map(x=>x.toString(36)).join(''); ls.set('ito-cid',c); } return c; })();
let myName=ls.get('ito-name','');

/* ---------- Estado ---------- */
let S=null;                 // partida na tela
let P=null;                 // sala aberta (modo sem conexão)
const draft={ players:4, rounds:5, mask:ALL_MASK };
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
function enc(n,rounds,mask){ let v=((n-2)*MAX_ROUNDS+(rounds-1))*256+mask, s=''; for(let i=0;i<4;i++){ s=L24[v%24]+s; v=Math.floor(v/24); } return s; }
function parseCode(raw){
  const s=(raw||'').trim().toUpperCase().replace(/[^A-Z]/g,'');
  if(s.length!==8 || [...s].some(c=>!L24.includes(c))) return null;
  let v=0; for(const c of s.slice(4)) v=v*24+L24.indexOf(c);
  const mask=v%256; v=Math.floor(v/256);
  const rounds=v%MAX_ROUNDS+1, n=Math.floor(v/MAX_ROUNDS)+2;
  if(n<2 || n>10 || !(mask&ALL_MASK)) return null;
  return { code:s.slice(0,4)+'-'+s.slice(4), n, rounds, mask:mask&ALL_MASK };
}
const parseHash=h=>parseCode(decodeURIComponent((h||'').replace(/^#/,'').split('~')[0]));
function newRoom(){ const v=new Uint32Array(4); crypto.getRandomValues(v); return parseCode([...v].map(x=>L24[x%24]).join('')+enc(draft.players,draft.rounds,draft.mask)); }
const roomLink=code=>location.origin+location.pathname+'#'+code;
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

/* ======================================================================
   Tela inicial
   ====================================================================== */
function home(keep){
  const typed=keep && $('#code') ? $('#code').value : '';
  S=null; P=null; setMeta(''); document.body.classList.remove('tv');
  const local=ls.get(LOCAL_KEY,null), online=ls.get(ONLINE_KEY,null);
  const resume= online?`<button class="resume" data-act="resume"><span class="dot"></span>
      <span><strong>${online.role==='tv'?'Voltar para o telão':'Voltar para a sala'}</strong><span>Sala ${online.code}${online.role==='host'?' · você é o anfitrião':''}</span></span>${svgStroke(I.chevron)}</button>`
    : local?`<button class="resume" data-act="resume"><span class="dot"></span>
      <span><strong>Continuar partida</strong><span>Sala ${local.code} · rodada ${Math.min(local.round,local.rounds)} de ${local.rounds}</span></span>${svgStroke(I.chevron)}</button>`:'';
  render(`
  <section class="hero">
    <p class="eyebrow">Jogo cooperativo</p>
    <h1>Pense no número.<br><em>Fale o tema.</em></h1>
    <p>Junte a turma, cada um no seu celular, e descubram juntos a ordem das cartas.</p>
  </section>
  ${resume}
  ${installEvt?`<div class="install"><p>Coloque o ito na tela inicial e abra como um app.</p><button class="btn brand" data-act="install">Instalar</button></div>`:''}
  <section class="panel">
    <h2>Criar sala</h2>
    <p class="lead">Escolha como vai ser a partida.</p>
    <div class="field-group"><span class="label">Jogadores</span>${stepper('players',draft.players,2,10,'jogadores')}</div>
    <div class="field-group"><span class="label">Rodadas</span>${stepper('rounds',draft.rounds,MIN_ROUNDS,MAX_ROUNDS,draft.rounds===1?'rodada':'rodadas')}</div>
    <div class="field-group">
      <div class="cat-head"><span class="label">Categorias de tema</span><button class="link-btn" data-act="allCats">${draft.mask===ALL_MASK?'Limpar':'Todas'}</button></div>
      <div class="cats">${CATS.map((c,i)=>`<button class="cat ${draft.mask&(1<<i)?'on':''}" data-act="toggleCat" data-v="${i}" aria-pressed="${!!(draft.mask&(1<<i))}">${c.name}<small>${c.themes.length}</small></button>`).join('')}</div>
    </div>
    <button class="btn brand" data-act="create" ${draft.mask?'':'disabled'}>Criar sala</button>
  </section>
  <section class="panel">
    <h2>Entrar numa sala</h2>
    <p class="lead">Abra o link do convite, leia o QR code ou digite o código.</p>
    <input id="code" class="field" placeholder="ABCD-EFGH" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" enterkeyhint="go">
    <p class="err" id="err"></p>
    <button class="btn" data-act="join">Entrar</button>
    <button class="btn text tv-join" data-act="joinTv">${svgStroke(I.tv)}Entrar como telão (TV ou notebook)</button>
  </section>
  <div class="foot"><button data-act="rules">Como jogar</button>·<button data-act="hardUpdate">Atualizar app</button></div>`, false, keep);
  const input=$('#code'); input.value=typed;
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') act.join(); });
  input.addEventListener('input',()=>{ $('#err').textContent=''; const raw=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,8); input.value=raw.length>4?raw.slice(0,4)+'-'+raw.slice(4):raw; });
}

/* ======================================================================
   Rede: duas redes ao mesmo tempo (Nostr e MQTT). As mensagens são
   idempotentes, então receber a mesma coisa pelas duas não atrapalha.
   ====================================================================== */
function netReset(){
  NET.links.forEach(l=>{ try{ l.room.leave(); }catch(e){} });
  clearTimeout(NET.timer); clearTimeout(NET.graceTimer);
  Object.assign(NET,{links:[],role:null,code:null,st:null,peers:{},failed:false,timedOut:false,timer:null,graceTimer:null,fresh:false,spectator:false});
}
async function loadLib(kind){
  if(NET.libs[kind]) return NET.libs[kind];
  for(const url of P2P[kind]||[]){
    try{ const lib=await import(url); if(lib && lib.joinRoom){ NET.libs[kind]=lib; return lib; } }catch(e){ console.warn('ito: falhou', url, e); }
  }
  return null;
}
async function connect(code){
  NET.code=code; NET.failed=false;
  const kinds=Object.keys(P2P);
  const results=await Promise.all(kinds.map(async kind=>{
    const lib=await loadLib(kind);
    if(!lib || NET.code!==code) return false;
    try{
      const cfg={appId:APP_ID, password:code};
      if(Array.isArray(CFG.turn) && CFG.turn.length) cfg.turnConfig=CFG.turn;
      const room=lib.joinRoom(cfg, code);
      const a=room.makeAction('m');
      const key=id=>kind+':'+id;
      let send;
      if(Array.isArray(a)){ send=(d,t)=>a[0](d,t); a[1]((d,peer)=>onMsg(d,key(peer))); }
      else { send=(d,t)=>a.send(d, t?{target:t}:undefined); a.onMessage=(d,meta)=>onMsg(d, key(meta&&typeof meta==='object'?meta.peerId:meta)); }
      const join=id=>onPeerJoin(key(id)), leave=id=>onPeerLeave(key(id));
      if(typeof room.onPeerJoin==='function'){ room.onPeerJoin(join); room.onPeerLeave(leave); } else { room.onPeerJoin=join; room.onPeerLeave=leave; }
      NET.links.push({kind, room, send});
      return true;
    }catch(e){ console.warn('ito: sem conexão', kind, e); return false; }
  }));
  if(NET.code!==code) return;
  NET.failed=!results.some(Boolean);
  if(NET.role==='guest' && !NET.st){
    clearTimeout(NET.timer);
    NET.timer=setTimeout(()=>{ if(!NET.st){ NET.timedOut=true; showOnline(); } }, CONNECT_TIMEOUT);
  }
  showOnline();
}
function sendTo(peerKey, data){
  const i=peerKey.indexOf(':'), kind=peerKey.slice(0,i), id=peerKey.slice(i+1);
  const l=NET.links.find(l=>l.kind===kind); if(l) try{ l.send(data,id); }catch(e){}
}
function broadcast(data){ NET.links.forEach(l=>{ try{ l.send(data); }catch(e){} }); }
const aliveCids=()=>new Set([CID, ...Object.values(NET.peers)]);
function sendToCid(cid, data){ const k=Object.keys(NET.peers).find(k=>NET.peers[k]===cid); if(k){ sendTo(k,data); return true; } return false; }
const hostAlive=()=>NET.st && (NET.st.hostCid===CID || aliveCids().has(NET.st.hostCid));

function saveOnline(){
  if(NET.role==='host') ls.set(ONLINE_KEY,{code:NET.code, role:'host', st:NET.st});
  else if(NET.role==='guest') ls.set(ONLINE_KEY,{code:NET.code, role:NET.spectator?'tv':'guest', st:NET.st});
}
function onPeerJoin(peer){
  sendTo(peer, {t:'hello', cid:CID, name:myName, spectator:NET.spectator});
  if(NET.role==='host') sendTo(peer, {t:'state', st:NET.st});
}
function onPeerLeave(peer){
  const cid=NET.peers[peer]; delete NET.peers[peer];
  if(!cid || aliveCids().has(cid)) return;          // ainda conectado pela outra rede
  if(NET.role==='host'){
    const pl=NET.st.players.find(p=>p.cid===cid);
    if(pl){ pl.on=false; checkRoundOver(NET.st); hostCommit(); }
  } else if(NET.st && cid===NET.st.hostCid){ hostLost(); }
}
/* Anfitrião caiu: depois de alguns segundos, o próximo jogador conectado assume */
function hostLost(){
  showOnline();
  clearTimeout(NET.graceTimer);
  NET.graceTimer=setTimeout(()=>{
    if(NET.role!=='guest' || hostAlive()) return;
    if(!NET.fresh){ showOnline(); return; }        // só assume quem recebeu o estado atual nesta sessão
    const alive=aliveCids(), st=NET.st;
    const next=st.players.filter(p=>p.cid!==st.hostCid && alive.has(p.cid)).sort((a,b)=>a.seat-b.seat)[0];
    if(next && next.cid===CID){
      NET.role='host'; st.hostCid=CID;
      st.players.forEach(p=>p.on=alive.has(p.cid));
      const me=st.players.find(p=>p.cid===CID);
      setEv(st,'newhost',me);
      checkRoundOver(st); hostCommit();
    } else { showOnline(); hostLost(); }
  }, HOST_GRACE);
}
function newerState(a,b){ // a é mais nova que b?
  if(!b) return true;
  if(a.ver!==b.ver) return a.ver>b.ver;
  return a.hostCid<b.hostCid;
}
function onMsg(m, peer){
  if(!m || typeof m!=='object') return;
  if(m.t==='react'){ if(m.id && seenReacts.has(m.id)) return; seenReacts.add(m.id); if(seenReacts.size>200) seenReacts.clear(); showReaction(m.e, String(m.by||'').slice(0,20)); return; }
  if(m.t==='hello' && typeof m.cid==='string'){
    NET.peers[peer]=m.cid;
    if(NET.role==='host') hostHello(m, peer);
    return;
  }
  if(m.t==='state' && m.st && m.st.code===NET.code){
    NET.peers[peer]=m.st.hostCid;
    if(m.st.hostCid===CID) return;
    if(NET.role==='host'){
      if(!newerState(m.st, NET.st)) { sendTo(peer,{t:'state', st:NET.st}); return; }
      NET.role='guest';                               // outro anfitrião assumiu: vira convidado
    }
    if(NET.role!=='guest' || !newerState(m.st, NET.st)) return;
    NET.st=m.st; NET.fresh=true; NET.timedOut=false; clearTimeout(NET.timer); clearTimeout(NET.graceTimer);
    if(!NET.spectator && !m.st.players.some(p=>p.cid===CID)) sendTo(peer,{t:'hello', cid:CID, name:myName});
    saveOnline(); showOnline();
    return;
  }
  if(NET.role==='host'){
    const pl=NET.st.players.find(p=>p.cid===NET.peers[peer]);
    if(!pl) return;
    if(m.t==='name'){ pl.name=String(m.name||'').trim().slice(0,20); hostCommit(); }
    else if(m.t==='act' && m.a){ if(applyAct(NET.st, m.a, pl)) hostCommit(); }
    else if(m.t==='bye'){
      const st=NET.st;
      if(st.phase==='lobby'){ st.players=st.players.filter(p=>p.cid!==pl.cid); st.players.forEach((p,i)=>p.seat=i+1); }
      else { pl.on=false; checkRoundOver(st); }
      hostCommit();
    }
  } else if(NET.role==='guest'){
    if(m.t==='full' || m.t==='kicked' || m.t==='closed'){
      netReset(); ls.del(ONLINE_KEY); history.replaceState(null,'',location.pathname); home();
      const msg={full:['Sala cheia','Essa sala já tem 10 pessoas.'], kicked:['Você saiu da sala','O anfitrião tirou você da sala.'], closed:['Sala encerrada','O anfitrião encerrou a sala.']}[m.t];
      dialog({title:msg[0], body:`<p>${msg[1]}</p>`, actions:[{label:'Ok',value:'ok',cls:'brand'}]});
    }
  }
}
function hostHello(m, peer){
  const st=NET.st;
  if((st.banned||[]).includes(m.cid)){ sendTo(peer,{t:'kicked'}); return; }
  if(m.spectator){ sendTo(peer,{t:'state', st}); return; }       // telão: só assiste
  let pl=st.players.find(p=>p.cid===m.cid);
  if(!pl){
    if(st.players.length>=10){ sendTo(peer,{t:'full'}); return; }
    pl={seat:st.players.length+1, cid:m.cid, name:'', on:true}; st.players.push(pl);
  }
  pl.on=true;
  if(typeof m.name==='string' && m.name.trim()) pl.name=m.name.trim().slice(0,20);
  hostCommit();
}

/* ---------- Regras (só quem é anfitrião aplica) ---------- */
function setEv(st,k,by,extra){ st.ev=Object.assign({k, cid:by?by.cid:'', by:by?(by.name||`Jogador ${by.seat}`):'', id:Math.random().toString(36).slice(2)}, extra||{}); }
const activeSeats=st=>st.players.filter(p=>p.on).map(p=>p.seat);
function checkRoundOver(st){
  if(st.phase!=='play' || st.roundOver || !st.table.length) return;
  const played=new Set(st.table.map(t=>t.seat));
  if(activeSeats(st).every(s=>played.has(s))){
    st.roundOver=true;
    markOutOfPlace(st.table);
    st.results.push(st.table.every(t=>t.ok)?1:0);
    const [title,low,high]=themeOf(st), d=deckFor(st.code,st.game,st.round);
    st.log=(st.log||[]).concat({game:st.game, round:st.round, title, low, high,
      plays:st.table.map(t=>({seat:t.seat, card:t.card, ok:t.ok, hint:(st.hints||{})[t.seat]||''})),
      held:st.players.filter(p=>!played.has(p.seat)).map(p=>({seat:p.seat, card:d[p.seat-1], hint:(st.hints||{})[p.seat]||''}))}).slice(-60);
    st.vote=null;
  }
}
function applyAct(st, a, by){
  const isHost=by.cid===st.hostCid, fresh=a.game===st.game && a.round===st.round;
  if(a.t==='start' && st.phase==='lobby' && isHost){ st.phase='play'; setEv(st,'start',by); return true; }
  if(a.t==='play' && st.phase==='play' && fresh && !st.roundOver && !st.table.some(t=>t.seat===by.seat)){
    const t=playSeat(st, by.seat);
    setEv(st,'play',by,{card:t.card, ok:t.ok});
    checkRoundOver(st);
    return true;
  }
  if(a.t==='plan' && st.phase==='play' && fresh && !st.roundOver && Array.isArray(a.order)){
    st.plan=a.order.map(Number).filter(x=>x>=1 && x<=st.players.length).slice(0,10);
    return true;
  }
  if(a.t==='reveal' && st.phase==='play' && fresh && !st.roundOver && Array.isArray(a.order)){
    const act=new Set(activeSeats(st)); let n=0;
    a.order.map(Number).forEach(seat=>{
      if(act.has(seat) && !st.table.some(t=>t.seat===seat)){ playSeat(st, seat); n++; }
    });
    if(!n) return false;
    setEv(st,'reveal',by,{n});
    checkRoundOver(st);
    return true;
  }
  if(a.t==='hint' && st.phase==='play' && fresh && !st.roundOver){
    st.hints=st.hints||{};
    const h=String(a.text||'').trim().slice(0,30);
    if(h) st.hints[by.seat]=h; else delete st.hints[by.seat];
    return true;
  }
  if(a.t==='voteStart' && st.phase==='play' && fresh && !st.table.length && !st.vote){
    st.vote={opts:[st.themePos+1, st.themePos+2], votes:{}};
    setEv(st,'vote',by); return true;
  }
  if(a.t==='vote' && st.vote && fresh && (a.i===0||a.i===1)){
    st.vote.votes[by.cid]=a.i;
    const voters=st.players.filter(p=>p.on).map(p=>p.cid);
    if(voters.every(c=>c in st.vote.votes)) resolveVote(st, by);
    return true;
  }
  if(a.t==='voteEnd' && st.vote && fresh){ resolveVote(st, by); return true; }
  if(a.t==='next' && st.phase==='play' && fresh && st.roundOver){
    if(st.results.length>=st.rounds){
      st.phase='done';
      st.history=(st.history||[]).concat({game:st.game, score:st.results.filter(x=>x===1).length, total:st.rounds});
    } else { st.round++; st.themePos++; st.table=[]; st.roundOver=false; st.custom=null; }
    st.hints={}; st.vote=null; st.plan=[];
    setEv(st,'next',by); return true;
  }
  if(a.t==='skip' && st.phase==='play' && a.themePos===st.themePos && !st.table.length){ st.themePos++; st.custom=null; st.vote=null; setEv(st,'skip',by); return true; }
  if(a.t==='custom' && st.phase==='play' && fresh && !st.table.length && a.title){
    st.custom={title:String(a.title).slice(0,60), low:String(a.low||'pouco').slice(0,30), high:String(a.high||'muito').slice(0,30)}; st.vote=null;
    setEv(st,'custom',by); return true;
  }
  if(a.t==='restart' && st.phase==='done' && a.game===st.game){
    st.game++; st.round=1; st.results=[]; st.themePos++; st.table=[]; st.roundOver=false; st.custom=null; st.phase='play'; st.hints={}; st.vote=null; st.plan=[];
    setEv(st,'restart',by); return true;
  }
  if(isHost && st.phase==='lobby' && (a.t==='kick' || a.t==='move')){
    const i=st.players.findIndex(p=>p.cid===a.cid); if(i<0) return false;
    if(a.t==='kick'){ if(a.cid===CID) return false; st.banned=(st.banned||[]).concat(a.cid); st.players.splice(i,1); }
    else { const j=i+(a.dir<0?-1:1); if(j<0||j>=st.players.length) return false; [st.players[i],st.players[j]]=[st.players[j],st.players[i]]; }
    st.players.forEach((p,k)=>p.seat=k+1);
    return true;
  }
  return false;
}
/* Marca como erradas só as cartas fora do lugar: mantém a maior sequência crescente */
function markOutOfPlace(table){
  const a=table.map(t=>t.card), n=a.length, len=Array(n).fill(1), prev=Array(n).fill(-1);
  for(let i=0;i<n;i++) for(let j=0;j<i;j++) if(a[j]<a[i] && len[j]+1>len[i]){ len[i]=len[j]+1; prev[i]=j; }
  let best=0; for(let i=1;i<n;i++) if(len[i]>len[best]) best=i;
  const keep=new Set(); for(let i=n?best:-1;i>=0;i=prev[i]) keep.add(i);
  table.forEach((t,i)=>t.ok=keep.has(i));
}
function playSeat(st, seat){
  const d=deckFor(st.code,st.game,st.round), card=d[seat-1], played=new Set(st.table.map(t=>t.seat));
  const ok=!activeSeats(st).some(s=>!played.has(s) && s!==seat && d[s-1]<card);
  const t={seat, card, ok}; st.table.push(t);
  return t;
}
function resolveVote(st, by){
  const v=st.vote, c=[0,0]; Object.values(v.votes).forEach(i=>c[i]++);
  const w=c[1]>c[0]?1:0;
  st.themePos=v.opts[w]; st.custom=null; st.vote=null;
  setEv(st,'voted',by,{title:themeAt(st,st.themePos)[0]});
}
function hostCommit(){
  NET.st.ver=(NET.st.ver||0)+1;
  saveOnline(); broadcast({t:'state', st:NET.st}); showOnline();
}
function sendAct(t, extra){
  const a=Object.assign({t, game:S.game, round:S.round, themePos:S.themePos}, extra||{});
  if(NET.role==='host'){
    const me=NET.st.players.find(p=>p.cid===CID);
    if(applyAct(NET.st,a,me)){
      if(a.t==='kick') NET.links.length && Object.keys(NET.peers).forEach(k=>{ if(NET.peers[k]===a.cid) sendTo(k,{t:'kicked'}); });
      hostCommit();
    }
  } else if(!sendToCid(NET.st.hostCid, {t:'act', a})) toast('Sem conexão com o anfitrião');
}
function startHost(room, saved){
  netReset(); NET.role='host'; lastEv='';
  NET.st=saved || { code:room.code, rounds:room.rounds, mask:room.mask, hostCid:CID, ver:1,
    players:[{seat:1, cid:CID, name:myName, on:true}], banned:[], phase:'lobby',
    game:1, round:1, results:[], themePos:0, table:[], roundOver:false, custom:null, history:[], ev:null, hints:{}, log:[], vote:null };
  NET.st.players.forEach(p=>p.on=p.cid===CID);
  const me=NET.st.players.find(p=>p.cid===CID); if(me && myName) me.name=myName;
  history.replaceState(null,'','#'+NET.st.code);
  saveOnline(); connect(NET.st.code);
}
function startGuest(room, saved, spectator){
  netReset(); NET.role='guest'; NET.spectator=!!spectator; lastEv=''; P=room;
  if(saved) NET.st=saved;                  // última versão conhecida (ajuda se o anfitrião não voltar)
  history.replaceState(null,'','#'+room.code);
  saveOnline(); connect(room.code);
  if(saved) hostLost();
}

function viewFromNet(st){
  const me=st.players.find(p=>p.cid===CID), names=[];
  st.players.forEach(p=>names[p.seat-1]=p.name);
  S={ mode:'online', code:st.code, rounds:st.rounds, mask:st.mask, n:st.players.length, names,
      seat:me?me.seat:0, game:st.game, round:st.round, results:st.results, themePos:st.themePos,
      status:st.phase==='done'?'done':'play', table:st.table||[], roundOver:!!st.roundOver, custom:st.custom, history:st.history||[],
      hints:st.hints||{}, vote:st.vote||null, log:st.log||[], plan:st.plan||[], players:st.players };
}
function showOnline(){
  if(!NET.role) return;
  if(!NET.st) return connecting();
  const st=NET.st;
  viewFromNet(st);
  if(st.ev && st.ev.id!==lastEv){
    if(lastEv) announce(st);
    lastEv=st.ev.id;
  }
  if(NET.spectator) tv(); else if(st.phase==='lobby') lobby(); else game();
}
function announce(st){
  const ev=st.ev, mine=ev.cid===CID;
  const lastOk=()=>st.results[st.results.length-1]===1;
  const roundEnd=()=>{ if(!st.roundOver) return; if(lastOk()){ SFX.good(); confetti(); vibrate(40); } else vibrate([90,60,90]); };
  if(ev.k==='play'){
    revealFrom=st.table.length-1; revealAnimUntil=Date.now()+700;
    if(!ev.ok){ SFX.bad(); vibrate([90,60,90]); toast(`Fora da ordem! ${mine?'Você':ev.by} baixou ${ev.card}`); }
    else { SFX.card(); if(!mine) toast(`${ev.by} baixou ${ev.card}`); }
    setTimeout(roundEnd, 450);
    return;
  }
  if(ev.k==='reveal'){
    const n=ev.n||1, start=st.table.length-n; revealFrom=start; revealAnimUntil=Date.now()+n*450+900;
    st.table.slice(start).forEach((t,i)=>setTimeout(()=>{ t.ok?SFX.card():(SFX.bad(),vibrate(80)); }, i*450+150));
    setTimeout(roundEnd, n*450+400);
    setTimeout(()=>{ if(NET.st===st) showOnline(); }, n*450+950);
    if(!mine) toast(`${ev.by} revelou as cartas`);
    return;
  }
  if(ev.k==='newhost'){ toast(mine?'Você agora é o anfitrião':`${ev.by} agora é o anfitrião`); return; }
  if(ev.k==='voted'){ SFX.pop(); toast(`Tema escolhido: ${ev.title}`); return; }
  if(ev.k==='next' && st.phase==='done'){
    const pct=st.results.filter(x=>x===1).length/st.rounds;
    vibrate([60,40,60]); if(pct>=.5){ SFX.win(); confetti(); }
  } else if(ev.k==='next' || ev.k==='restart' || ev.k==='start') vibrate(30);
  if(mine) return;
  const msg={start:'começou a partida', next:st.phase==='done'?'abriu o resultado':'passou para a próxima rodada', skip:'trocou o tema',
    custom:'escreveu um tema', restart:'começou outra partida', vote:'abriu uma votação de tema'}[ev.k];
  if(msg) toast(`${ev.by} ${msg}`);
}
function connecting(){
  setMeta(`Sala <b>${NET.code}</b>`);
  const stuck=NET.failed || NET.timedOut;
  render(`<section class="panel connect">
    ${stuck?`<div class="badge">${svgStroke(I.wifiOff)}</div>
      <h2>${NET.failed?'Sem internet':'Não achamos a sala ainda'}</h2>
      <p>${NET.failed?'Confira a conexão e tente de novo.':'Confira se quem criou a sala está com o ito aberto.'}</p>
      <div class="stack"><button class="btn brand" data-act="retry">Tentar de novo</button>
      <button class="btn outline" data-act="goLocal">Jogar sem conexão</button></div>`
    :`<div class="spinner"></div><h2>Entrando na sala…</h2><p>Sala ${NET.code}</p>`}
  </section>
  <button class="btn text" data-act="leave">Cancelar</button>`, false, true);
}
const banner=()=>`<div class="banner">${svgStroke(I.wifiOff)}<span>O anfitrião caiu. Reconectando…</span><button data-act="goLocal">Jogar sem conexão</button></div>`;

function lobby(){
  const st=NET.st, isHost=NET.role==='host', me=st.players.find(p=>p.cid===CID), alive=aliveCids();
  const isOn=p=>isHost?p.on:alive.has(p.cid);
  const count=st.players.filter(isOn).length;
  setMeta(`Sala <b>${st.code}</b>`);
  render(`
  ${!hostAlive()?banner():''}
  ${roomCard(st.code, `${st.rounds} ${st.rounds===1?'rodada':'rodadas'} · ${catNames(st.mask)}`)}
  <p class="tv-tip">${svgStroke(I.tv)}<span>Tem TV ou notebook por perto? Abra o ito nele, digite o código e toque em <b>Entrar como telão</b>.</span></p>
  <section class="panel">
    <div class="row-between"><h2>Na sala</h2><span class="count">${count} ${count===1?'pessoa':'pessoas'}</span></div>
    <ul class="roster">${st.players.map(p=>`<li class="${isOn(p)?'':'off'}">
      <span class="num">${p.seat}</span>
      <span class="nm">${esc(p.name||`Jogador ${p.seat}`)}</span>
      ${p.cid===CID?'<span class="tag">você</span>':''}${p.cid===st.hostCid?'<span class="tag host">anfitrião</span>':''}
      <span class="status-dot"></span>
      ${isHost?`<button class="row-btn" data-act="playerMenu" data-cid="${esc(p.cid)}" aria-label="Opções">${svgStroke('<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>')}</button>`:''}
    </li>`).join('')}</ul>
    ${isHost&&st.players.length>1?'<p class="note">Toque em ⋯ para mudar a ordem ou tirar alguém.</p>':''}
  </section>
  <section class="panel">
    <h2>Seu nome</h2>
    <p class="lead">Opcional. É assim que os outros vão te ver.</p>
    <div class="name-row"><input id="myName" class="name-input" maxlength="20" placeholder="Jogador ${me?me.seat:''}" value="${esc(drafts.name!=null?drafts.name:myName)}" autocomplete="off" enterkeyhint="done">
    <button class="btn soft" data-act="saveName">Salvar</button></div>
  </section>
  ${isHost
    ? `<button class="btn brand big" data-act="start" ${st.players.length<2?'disabled':''}>Começar partida</button>
       <p class="note center">${st.players.length<2?'Esperando a turma entrar…':'Pode começar quando todos estiverem aqui.'}</p>`
    : `<div class="waiting"><span class="pulse"></span>Esperando ${esc((st.players.find(p=>p.cid===st.hostCid)||{}).name||'o anfitrião')} começar a partida</div>`}
  <button class="btn text" data-act="leave">${isHost?'Encerrar sala':'Sair da sala'}</button>`, false, true);
  const inp=$('#myName'); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); act.saveName(); } }); inp.addEventListener('input',()=>{ drafts.name=inp.value; });
}

/* ======================================================================
   Modo sem conexão (plano B)
   ====================================================================== */
function seatScreen(){
  setMeta(`Sala <b>${P.code}</b>`);
  let seats=''; for(let i=1;i<=P.n;i++) seats+=`<button data-act="seat" data-v="${i}">${i}</button>`;
  render(`
  <div class="mode-note">${svgStroke(I.wifiOff)}<span>Modo sem conexão: cada celular joga por conta própria. Todos apertam o mesmo botão ao fim da rodada.</span></div>
  ${roomCard(P.code, `${P.n} jogadores · ${P.rounds} ${P.rounds===1?'rodada':'rodadas'}<br>${catNames(P.mask)}`)}
  <section class="panel">
    <h2>Qual é o seu número?</h2>
    <p class="lead">Cada pessoa escolhe um número diferente. Combinem em voz alta antes.</p>
    <div class="seats">${seats}</div>
  </section>
  <button class="btn text" data-act="goHome">Voltar</button>`);
}
const saveLocal=()=>ls.set(LOCAL_KEY,S);
function localAct(t){
  if(t==='win'||t==='lose'){
    S.results.push(t==='win'?1:0);
    if(S.results.length>=S.rounds){ S.status='done'; S.history=(S.history||[]).concat({game:S.game, score:S.results.filter(x=>x===1).length, total:S.rounds}); vibrate([60,40,60]);
      if(S.results.filter(x=>x===1).length/S.rounds>=.5){ SFX.win(); confetti(); } }
    else { S.round++; S.themePos++; vibrate(30); toast(t==='win'?'Boa! Próxima rodada':'Faz parte. Próxima rodada'); if(t==='win'){ SFX.good(); confetti(); } else SFX.bad(); }
  } else if(t==='skip'){ S.themePos++; }
  else if(t==='restart'){ S.game++; S.round=1; S.results=[]; S.themePos++; S.status='play'; }
  saveLocal(); game();
}

/* ======================================================================
   Jogo
   ====================================================================== */
function progress(){
  let d=''; for(let i=0;i<S.rounds;i++){ const r=S.results[i]; d+=`<i class="${r===1?'ok':r===0?'no':i===S.results.length?'now':''}"></i>`; }
  return `<div class="progress" aria-hidden="true">${d}</div>`;
}
function historyList(){
  const h=S.history||[]; if(h.length<2) return '';
  return `<div class="history"><p class="eyebrow">Placar da noite</p><ul>${h.map(x=>`<li><span>Partida ${x.game}</span><strong>${x.score} de ${x.total}</strong></li>`).join('')}</ul></div>`;
}
function game(){
  const online=S.mode==='online', hostGone=online && !hostAlive();
  setMeta(`<b>${esc(nameOf(S.seat))}</b> · ${S.code}`);
  const key=S.code+'|'+S.game+'|'+S.round; if(key!==peekKey){ peek=false; peekKey=key; }
  const score=S.results.filter(x=>x===1).length;

  if(S.status==='done'){
    const total=S.rounds, pct=score/total;
    const [title,msg]=pct===1?['Sintonia perfeita!','Vocês acertaram todas as rodadas.']:pct>=.5?['Mandaram bem!','Boa leitura de tema, turma.']:['Quase lá!','Bora mais uma partida?'];
    render(`${hostGone?banner():''}<section class="panel end-state">
      <div class="badge">${pct>=.5?I.trophy:I.broken}</div>
      <p class="eyebrow">Fim de jogo</p>
      <h2>${title}</h2>
      <div class="score"><strong>${score}</strong><span>de ${total} ${total===1?'rodada certa':'rodadas certas'}</span></div>
      <p>${msg}</p>
      ${progress()}
      ${online && (S.log||[]).length ? (()=>{ const l=S.log[S.log.length-1]; return l.game===S.game ? `<details class="last-round"><summary>Ver a última rodada · ${esc(l.title)}</summary>${logRuler(l)}</details>` : ''; })() : ''}
      ${highlightsHtml()}
      ${historyList()}
      <div class="stack"><button class="btn brand" data-act="restart">Jogar de novo</button>
        <button class="btn soft" data-act="shareSummary">${svgStroke(I.share)}Compartilhar resumo</button>
        <button class="btn outline" data-act="leave">Sair</button></div>
    </section>${online?reactFab():''}`, false, online);
    return;
  }
  if(!S.seat){ render(`<section class="panel connect"><div class="spinner"></div><h2>Entrando na partida…</h2></section>`,false,true); return; }

  const [title,low,high,ci]=theme(), mine=deck()[S.seat-1];
  const iPlayed=online && S.table.some(t=>t.seat===S.seat);
  const canEditTheme=!online || !S.table.length;
  const themeCard=`<section class="panel theme">
    <p class="eyebrow">${ci<0?'Tema da turma':'Tema · '+CATS[ci].name}</p>
    <h2>${esc(title)}</h2>
    <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
    <div class="scale-labels"><span>${esc(low)}</span><span>${esc(high)}</span></div>
    ${canEditTheme && !(online && S.vote)?`<div class="theme-actions">
      ${online?`<button class="chip" data-act="themeMenu">${svgStroke(I.shuffle)}Mudar tema</button>`:`<button class="chip" data-act="skip">${svgStroke(I.shuffle)}Trocar tema</button>`}</div>`:''}
  </section>${online && S.vote ? votePanel() : ''}`;
  const cardHtml=`<p class="whose">Sua carta, ${esc(nameOf(S.seat))}</p>
  <div class="hand"><button class="card ${peek||iPlayed?'up':''} ${iPlayed?'played':''}" data-act="peek" aria-label="${peek?'Sua carta: '+mine:'Carta escondida'}">
    <span class="face back">${I.thread}</span>
    <span class="face front"><small class="tl">${mine}</small><strong>${mine}</strong><small class="br">${mine}</small></span>
  </button></div>
  ${iPlayed?'<p class="hint">Sua carta está na mesa</p>':`<p class="hint">${peek?'Toque para esconder':'Toque na carta para ver seu número'}</p>`}`;

  if(!online){
    render(`${themeCardWrap()}
    <button class="btn outline" data-act="reveal">${svgStroke(I.eye)}Conferir cartas de todos</button>
    <div class="dock"><div class="dock-inner">
      <p class="note">Todos apertam o mesmo botão ao fim da rodada</p>
      <div class="btn-row"><button class="btn soft" data-act="lose">${I.x}Erramos</button><button class="btn ok" data-act="win">${I.check}Acertamos</button></div>
    </div></div>`, true);
    return;
  }

  // Mesa (modo conectado) — só o essencial à mostra
  const pending=planOrder(), hintOf=s=>S.hints[s]||'';
  const roundOk=S.roundOver && S.table.every(t=>t.ok);
  const anim=Date.now()<revealAnimUntil;
  const tips=!ls.get('ito-tips',false) ? `<section class="panel tips">
    <p class="eyebrow">Como funciona</p>
    <ol><li><b>Toque na carta</b> para ver seu número.</li><li>Fale uma <b>dica</b> sobre o tema, sem dizer o número.</li>
    <li>Arrumem a <b>ordem da turma</b>: quem tem o menor número vai primeiro.</li><li><b>Revelem</b> todas de uma vez ou baixem uma por uma.</li></ol>
    <button class="btn soft" data-act="tipsOk">Entendi</button></section>` : '';
  const hintRow=!iPlayed && !S.roundOver ? `<div class="hint-row"><input id="myHint" maxlength="30" placeholder="Sua dica (opcional)" value="${esc(drafts.hint&&drafts.hint.k===key?drafts.hint.v:hintOf(S.seat))}" autocomplete="off" enterkeyhint="send">
    <button data-act="saveHint">${hintOf(S.seat)?'Trocar':'Enviar'}</button></div>` : '';
  const table=S.table.length && !S.roundOver ? `<section class="panel table">
    <div class="row-between"><h2>Na mesa</h2><span class="count">${S.table.length} de ${S.table.length+pending.length}</span></div>
    <ol class="pile ${anim?'reveal-anim':''}">${S.table.map((t,i)=>`<li class="${t.ok?'':'bad'} ${t.seat===S.seat?'me':''} ${i>=revealFrom?'new':''}" style="--i:${Math.max(0,i-revealFrom)}"><strong>${t.card}</strong><span>${esc(nameOf(t.seat))}</span>${hintOf(t.seat)?`<i>“${esc(hintOf(t.seat))}”</i>`:''}${t.ok?'':'<em>fora do lugar</em>'}</li>`).join('')}</ol>
  </section>` : '';
  const order=!S.roundOver && pending.length ? `<section class="panel order">
    <div class="row-between"><h2>Ordem da turma</h2><span class="count">${pending.length} na mão</span></div>
    <p class="lead">Quem tem o menor número vai primeiro. Qualquer um pode mexer e, quando todos concordarem, qualquer um pode revelar.</p>
    <ol class="order-list">${pending.map((s,i)=>`<li class="${s===S.seat?'me':''}">
      <span class="pos">${S.table.length+i+1}º</span>
      <span class="who"><b>${esc(nameOf(s))}</b>${hintOf(s)?`<i>“${esc(hintOf(s))}”</i>`:''}</span>
      <button class="row-btn" data-act="planMove" data-s="${s}" data-d="-1" ${i===0?'disabled':''} aria-label="Subir">${svgStroke(I.up)}</button>
      <button class="row-btn" data-act="planMove" data-s="${s}" data-d="1" ${i===pending.length-1?'disabled':''} aria-label="Descer">${svgStroke(I.down)}</button>
    </li>`).join('')}</ol>
    ${!iPlayed?`<button class="link-btn solo" data-act="playCard">Prefere ir um por um? Baixar só a minha carta agora</button>`:''}
  </section>` : '';
  const result=S.roundOver ? `<section class="panel reveal-panel">
    <p class="eyebrow">${ci<0?'Tema da turma':'Tema'}</p><h2 class="rp-title">${esc(title)}</h2>
    <div class="result ${roundOk?'good':'bad'}">${roundOk?I.check:I.x}<span>${roundOk?'Ordem perfeita! Rodada certa.':'Teve carta fora da ordem.'}</span></div>
    ${roundRuler()}
  </section>` : '';
  const last=S.results.length>=S.rounds;
  if(!S.roundOver) pending_next=false;
  if(S.roundOver && nextReadyKey!==key){ nextReadyKey=key; nextReadyAt=Math.max(Date.now(), revealAnimUntil)+2500; pending_next=false; }
  const wait=S.roundOver && Date.now()<nextReadyAt;
  const dock=S.roundOver
    ? `<button class="btn brand" data-act="next" ${wait||pending_next?'disabled':''}>${pending_next?'Indo…':wait?'Olhem o resultado…':last?'Ver placar final':'Próxima rodada'}</button>`
    : `<button class="btn brand" data-act="revealPlan">${svgStroke(I.eye)}${pending.length>1?'Revelar nessa ordem':'Revelar a última carta'}</button>`;
  render(`${hostGone?banner():''}${tips}${statusTop(score)}${S.roundOver?'':themeCard}${S.roundOver?'':cardHtml+hintRow}${result}${order}${table}${reactFab()}
    <div class="dock"><div class="dock-inner">${dock}</div></div>`, true, true);
  const hi=$('#myHint'); if(hi){ hi.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); act.saveHint(); } }); hi.addEventListener('input',()=>{ drafts.hint={k:key, v:hi.value}; }); }
  if(S.roundOver && Date.now()<nextReadyAt) setTimeout(()=>{ if(NET.st) showOnline(); }, nextReadyAt-Date.now()+30);

  function themeCardWrap(){ return statusTop(score)+themeCard+cardHtml; }
}
function statusTop(score){
  return `<div class="statusbar">
    <span class="pill"><span class="k">Rodada</span>${S.round}<span class="k">de ${S.rounds}</span></span>
    <span class="pill score-pill">${I.check}${score}</span>
  </div>${progress()}`;
}
function isActiveSeat(seat){
  const st=NET.st; if(!st) return true;
  const p=st.players.find(p=>p.seat===seat); if(!p) return false;
  return NET.role==='host' ? p.on : (p.on || aliveCids().has(p.cid));
}

/* ======================================================================
   Efeitos: sons, confete, reações
   ====================================================================== */
Object.assign(I, {
  vote:'<svg viewBox="0 0 24 24"><path d="M4 12l3 3 5-6M14 7h6M14 12h6M14 17h6"/></svg>',
  sound:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/></svg>',
  tv:'<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
});
const EMOJIS=['👏','😂','🤔','😱','👀','❤️'];
const seenReacts=new Set();
let soundOn=ls.get('ito-sound',true), actx=null, revealAnimUntil=0, revealFrom=0, lastReact=0;
function audio(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(actx && actx.state==='suspended') actx.resume().catch(()=>{}); return actx; }
function tone(notes){
  if(!soundOn) return; const ac=audio(); if(!ac) return;
  const t0=ac.currentTime+.01;
  notes.forEach(([f,dt,dur,type,vol])=>{ const o=ac.createOscillator(), g=ac.createGain();
    o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(0,t0+dt); g.gain.linearRampToValueAtTime(vol||.16,t0+dt+.012);
    g.gain.exponentialRampToValueAtTime(.0001,t0+dt+dur); o.connect(g); g.connect(ac.destination); o.start(t0+dt); o.stop(t0+dt+dur+.05); });
}
const SFX={
  card:()=>tone([[620,0,.09,'triangle',.14],[930,.05,.08,'triangle',.08]]),
  bad:()=>tone([[196,0,.28,'sawtooth',.09],[155,.13,.32,'sawtooth',.09]]),
  good:()=>tone([[523,0,.14],[659,.1,.14],[784,.2,.3]]),
  win:()=>tone([[523,0,.14],[659,.12,.14],[784,.24,.14],[1047,.36,.5]]),
  pop:()=>tone([[880,0,.05,'sine',.06]])
};
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c=document.createElement('canvas'); c.className='confetti'; document.body.appendChild(c);
  const dpr=Math.min(2,devicePixelRatio||1), W=c.width=innerWidth*dpr, H=c.height=innerHeight*dpr, ctx=c.getContext('2d');
  const cols=['#E24A34','#1F7A5C','#F2B134','#3B82F6','#FFFFFF','#9B5DE5'];
  const ps=[...Array(150)].map(()=>({x:W/2+(Math.random()-.5)*W*.4, y:H*.32, vx:(Math.random()-.5)*15*dpr, vy:(-Math.random()*15-7)*dpr,
    s:(Math.random()*7+5)*dpr, r:Math.random()*6, vr:(Math.random()-.5)*.35, c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function f(t){ ctx.clearRect(0,0,W,H);
    ps.forEach(p=>{ p.vy+=.42*dpr; p.x+=p.vx; p.y+=p.vy; p.vx*=.985; p.r+=p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6); ctx.restore(); });
    if(t-t0<2800) requestAnimationFrame(f); else c.remove(); })(t0);
}
function showReaction(e, by){
  if(!EMOJIS.includes(e)) return;
  let fx=$('#fx'); if(!fx){ fx=document.createElement('div'); fx.id='fx'; document.body.appendChild(fx); }
  const el=document.createElement('div'); el.className='float-emoji';
  el.style.left=(12+Math.random()*76)+'%';
  el.innerHTML=`<span>${e}</span>${by?`<small>${esc(by)}</small>`:''}`;
  fx.appendChild(el); setTimeout(()=>el.remove(),2600);
}
const myLabel=()=>NET.spectator?'Telão':(S&&S.seat?nameOf(S.seat):(myName||''));
const reactFab=()=>`<div class="react-fab-wrap"><div class="react-pop" ${reactOpenState?'':'hidden'}>${EMOJIS.map(e=>`<button data-act="react" data-e="${e}" aria-label="Reagir ${e}">${e}</button>`).join('')}</div>
  <button class="react-fab ${reactOpenState?'on':''}" data-act="reactOpen" aria-label="Reagir">${reactOpenState?'✕':'😀'}</button></div>`;
const reactionsBar=()=>`<div class="reactions">${EMOJIS.map(e=>`<button data-act="react" data-e="${e}" aria-label="Reagir ${e}">${e}</button>`).join('')}</div>`;

/* ======================================================================
   Ordem combinada, votação e destaques
   ====================================================================== */
function planOrder(){
  const played=new Set(S.table.map(t=>t.seat));
  const pend=[...Array(S.n)].map((_,i)=>i+1).filter(s=>!played.has(s) && isActiveSeat(s));
  const plan=(S.plan||[]).filter(s=>pend.includes(s));
  return plan.concat(pend.filter(s=>!plan.includes(s)));
}
function votePanel(){
  const v=S.vote, mine=v.votes[CID], c=[0,0]; Object.values(v.votes).forEach(i=>c[i]++);
  const total=S.players.filter(p=>p.on).length;
  return `<section class="panel vote">
    <div class="row-between"><h2>Qual tema?</h2><span class="count">${c[0]+c[1]} de ${total} votaram</span></div>
    ${v.opts.map((pos,i)=>{ const t=themeAt(S,pos); return `<button class="vote-opt ${mine===i?'on':''}" data-act="vote" data-i="${i}" ${NET.spectator?'disabled':''}>
      <span><strong>${esc(t[0])}</strong><small>1 = ${esc(t[1])} · 100 = ${esc(t[2])}</small></span><em>${c[i]}</em></button>`; }).join('')}
    ${NET.spectator?'':'<button class="link-btn" data-act="voteEnd">Encerrar votação agora</button>'}
  </section>`;
}
function highlights(game){
  const logs=(S.log||[]).filter(l=>l.game===game), out=[];
  const plays=logs.flatMap(l=>l.plays.map(p=>Object.assign({title:l.title},p)));
  const hinted=plays.filter(p=>p.hint);
  if(hinted.length){
    const x=hinted.reduce((a,b)=>Math.abs(b.card-50)>Math.abs(a.card-50)?b:a);
    out.push({k:'Dica mais ousada', v:`${nameOf(x.seat)} disse “${x.hint}” com ${x.card}`, sub:x.title});
  }
  const bad=logs.flatMap(l=>{ const sorted=l.plays.map(p=>p.card).sort((a,b)=>a-b);
    return l.plays.map((p,i)=>Object.assign({title:l.title, off:Math.abs(sorted.indexOf(p.card)-i)},p)).filter(p=>!p.ok); });
  if(bad.length){
    const x=bad.reduce((a,b)=>b.off>a.off?b:a);
    out.push({k:'Maior surpresa', v:`${nameOf(x.seat)} estava fora do lugar com ${x.card}${x.hint?` (“${x.hint}”)`:''}`, sub:x.title});
    const cnt={}; bad.forEach(p=>cnt[p.seat]=(cnt[p.seat]||0)+1);
    const [seat,n]=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
    if(n>1) out.push({k:'Mais vezes fora do lugar', v:`${nameOf(+seat)}, ${n} vezes`});
  } else if(plays.length){
    out.push({k:'Ninguém furou a fila', v:'Todas as cartas foram na ordem'});
  }
  return out;
}
function highlightsHtml(){
  if(S.mode!=='online') return '';
  const h=highlights(S.game); if(!h.length) return '';
  return `<div class="highlights">${h.map(x=>`<div class="hl"><p class="eyebrow">${x.k}</p><strong>${esc(x.v)}</strong>${x.sub?`<span>${esc(x.sub)}</span>`:''}</div>`).join('')}</div>`;
}

/* ---------- Imagem do resumo para compartilhar ---------- */
async function summaryImage(){
  try{ await Promise.all(['800 40px "Inter Display"','600 20px Inter','400 20px Inter'].map(f=>document.fonts.load(f))); }catch(e){}
  const W=1080, H=1350, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  const score=S.results.filter(x=>x===1).length, total=S.rounds, pct=score/total;
  const title=pct===1?'Sintonia perfeita!':pct>=.5?'Mandaram bem!':'Quase lá!';
  const disp='"Inter Display", Inter, system-ui, sans-serif', body='Inter, system-ui, sans-serif';
  g.fillStyle='#F5F1EA'; g.fillRect(0,0,W,H);
  g.fillStyle='#E24A34'; g.fillRect(0,0,W,300);
  g.fillStyle='#FFF8F2'; g.font=`800 120px ${disp}`; g.textBaseline='alphabetic'; g.fillText('ito',80,190);
  g.strokeStyle='#FFF8F2'; g.lineWidth=8; g.lineCap='round'; g.beginPath(); g.moveTo(84,232);
  for(let x=0;x<=150;x+=3) g.lineTo(84+x, 232+Math.sin(x/150*Math.PI*2.2)*10); g.stroke();
  g.beginPath(); g.arc(240,226,12,0,7); g.fillStyle='#FFF8F2'; g.fill();
  g.font=`600 34px ${body}`; g.textAlign='right'; g.fillText('Resumo da partida',W-80,150);
  g.font=`400 28px ${body}`; g.fillText(new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long'}),W-80,196);
  g.textAlign='left'; g.fillStyle='#1A1814';
  g.font=`800 72px ${disp}`; g.fillText(title,80,420);
  g.font=`800 200px ${disp}`; g.fillText(String(score),80,630);
  const sw=g.measureText(String(score)).width; g.font=`400 56px ${body}`; g.fillStyle='#6A6258'; g.fillText(`de ${total} rodadas`,80+sw+24,630);
  const bw=(W-160-(total-1)*10)/total;
  S.results.forEach((r,i)=>{ g.fillStyle=r?'#1F7A5C':'#E24A34'; roundRect(g,80+i*(bw+10),670,bw,16,8); g.fill(); });
  let y=770;
  const hl=S.mode==='online'?highlights(S.game).slice(0,3):[];
  hl.forEach(h=>{
    g.fillStyle='#FFFFFF'; roundRect(g,80,y,W-160,150,28); g.fill();
    g.fillStyle='#6A6258'; g.font=`600 24px ${body}`; g.fillText(h.k.toUpperCase(),116,y+48);
    g.fillStyle='#1A1814'; g.font=`600 36px ${body}`; g.fillText(fit(g,h.v,W-232),116,y+100);
    if(h.sub){ g.fillStyle='#6A6258'; g.font=`400 24px ${body}`; g.fillText(fit(g,h.sub,W-232),116,y+134); }
    y+=172;
  });
  const hist=S.history||[];
  if(hist.length>1 && y<H-200){ g.fillStyle='#6A6258'; g.font=`600 26px ${body}`;
    g.fillText(fit(g,'Placar da noite: '+hist.map(x=>`P${x.game} ${x.score}/${x.total}`).join(' · '),W-160),80,y+40); }
  const names=(S.names||[]).filter(Boolean);
  g.fillStyle='#6A6258'; g.font=`400 26px ${body}`;
  if(names.length) g.fillText(fit(g,'Com '+names.join(', '),W-160),80,H-120);
  g.fillStyle='#E24A34'; g.font=`600 28px ${body}`; g.fillText((location.host+location.pathname).replace(/\/$/,''),80,H-70);
  return new Promise(r=>c.toBlob(r,'image/png'));
  function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function fit(g,t,max){ if(g.measureText(t).width<=max) return t; while(t.length>1 && g.measureText(t+'…').width>max) t=t.slice(0,-1); return t+'…'; }
}


/* ======================================================================
   Régua da revelação: cartas na linha de 1 a 100
   ====================================================================== */
let rulerAnimKey='';
function ruler(entries, o){
  o=o||{};
  const pad=16, gap=o.gap||44, n=entries.length;
  const H=Math.max(o.min||300, n*gap+pad*2);
  const items=entries.slice().sort((a,b)=>a.card-b.card).map(e=>Object.assign({},e,{y:pad+(e.card-1)/99*(H-pad*2)}));
  let last=-1e9; items.forEach(it=>{ it.ly=Math.max(it.y, last+gap); last=it.ly; });
  let next=H-pad; for(let i=items.length-1;i>=0;i--){ items[i].ly=Math.min(items[i].ly,next); next=items[i].ly-gap; }
  const AX=o.ax||46, LX=AX+28;
  const lines=items.map(it=>`<path d="M${AX} ${it.y} C ${AX+14} ${it.y}, ${LX-14} ${it.ly}, ${LX} ${it.ly}" class="${it.ok===false?'bad':''}" style="--i:${it.seq||0}"/>`).join('');
  return `<div class="ruler-wrap">
    ${o.low?`<p class="r-cap">1 = ${esc(o.low)}</p>`:''}
    <div class="ruler ${o.anim?'anim':''}" style="height:${H}px;--ax:${AX}px;--lx:${LX}px">
      <div class="r-axis"></div><span class="r-end" style="top:${pad}px">1</span><span class="r-end" style="top:${H-pad}px">100</span>
      <svg class="r-lines" width="${LX}" height="${H}">${lines}</svg>
      ${items.map(it=>`<div class="r-dot ${it.ok===false?'bad':''} ${it.gone?'gone':''} ${it.me?'me':''}" style="top:${it.y}px;--i:${it.seq||0}"></div>
        <div class="r-label ${it.ok===false?'bad':''} ${it.gone?'gone':''} ${it.me?'me':''}" style="top:${it.ly}px;--i:${it.seq||0}">
          <b>${it.card}</b><span class="r-name">${esc(it.name)}${it.order?` <small>${it.order}º</small>`:''}</span>${it.hint?`<i>“${esc(it.hint)}”</i>`:''}${it.ok===false?'<em>fora do lugar</em>':it.gone?'<em>saiu</em>':''}
        </div>`).join('')}
    </div>
    ${o.high?`<p class="r-cap">100 = ${esc(o.high)}</p>`:''}
    ${items.some(it=>it.order)?'<p class="r-legend">As cartas estão pelo número. O 1º, 2º, 3º é a ordem que a turma montou.</p>':''}
  </div>`;
}
function logRuler(entry, o){
  const entries=entry.plays.map((p,i)=>({card:p.card, name:nameOf(p.seat), hint:p.hint, ok:p.ok, order:i+1, me:p.seat===S.seat, seq:i}))
    .concat((entry.held||[]).map(h=>({card:h.card, name:nameOf(h.seat), hint:h.hint, gone:true, seq:entry.plays.length})));
  return ruler(entries, Object.assign({anim:false, low:entry.low, high:entry.high}, o||{}));
}
function roundRuler(o){
  const d=deck(), hints=S.hints||{}, played=new Set(S.table.map(t=>t.seat));
  const fromIdx=Math.max(0,revealFrom);
  const entries=S.table.map((t,i)=>({card:t.card, name:nameOf(t.seat), hint:hints[t.seat]||'', ok:t.ok, order:i+1, me:t.seat===S.seat, seq:Math.max(0,i-fromIdx)}))
    .concat([...Array(S.n)].map((_,i)=>i+1).filter(s=>!played.has(s)).map(s=>({card:d[s-1], name:nameOf(s), hint:hints[s]||'', gone:true, seq:S.table.length})));
  const key=S.code+'|'+S.game+'|'+S.round;
  const anim=rulerAnimKey!==key || Date.now()<revealAnimUntil; rulerAnimKey=key;
  const [,low,high]=theme();
  return ruler(entries, Object.assign({anim, low, high}, o||{}));
}

/* ======================================================================
   Modo telão (TV ou notebook)
   ====================================================================== */
function tv(){
  const st=NET.st; document.body.classList.add('tv');
  setMeta(`Telão · <b>${st.code}</b>`);
  const alive=aliveCids(), on=p=>p.on||alive.has(p.cid), hintOf=s=>(st.hints||{})[s]||'';
  if(st.phase==='lobby'){
    let qr=''; try{ qr=qrSvg(roomLink(st.code)); }catch(e){}
    render(`<div class="tv-lobby">
      <div class="tv-qr">${qr}</div>
      <div class="tv-info"><p class="eyebrow">Entre na sala</p><div class="tv-code">${st.code}</div>
        <p class="tv-sub">Aponte a câmera para o QR code ou abra o ito e digite o código.</p>
        <ul class="tv-players">${st.players.map(p=>`<li class="${on(p)?'':'off'}">${esc(p.name||'Jogador '+p.seat)}</li>`).join('')}</ul>
        <div class="waiting"><span class="pulse"></span>Esperando o anfitrião começar</div></div>
    </div>`, false, true);
    return;
  }
  const score=S.results.filter(x=>x===1).length;
  if(st.phase==='done'){
    render(`<div class="tv-end"><p class="eyebrow">Fim de jogo</p>
      <div class="tv-score"><strong>${score}</strong><span>de ${S.rounds}</span></div>${progress()}${highlightsHtml()}${historyList()}</div>${reactionsBar()}`, false, true);
    return;
  }
  const [title,low,high,ci]=theme(), pending=planOrder(), d=deck(), played=new Set(S.table.map(t=>t.seat));
  const held=S.roundOver?[...Array(S.n)].map((_,i)=>i+1).filter(s=>!played.has(s)).map(s=>({seat:s,card:d[s-1]})):[];
  const anim=Date.now()<revealAnimUntil, roundOk=S.roundOver && S.table.every(t=>t.ok);
  render(`<div class="tv-top">${statusTop(score)}</div>
  <div class="tv-grid">
    <section class="tv-theme"><p class="eyebrow">${ci<0?'Tema da turma':'Tema · '+CATS[ci].name}</p><h2>${esc(title)}</h2>
      <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
      <div class="scale-labels"><span>${esc(low)}</span><span>${esc(high)}</span></div>
      ${S.vote?votePanel():''}
      ${S.roundOver?`<div class="result big ${roundOk?'good':'bad'}">${roundOk?I.check:I.x}<span>${roundOk?'Ordem perfeita!':'Teve carta fora da ordem'}</span></div>`:''}
    </section>
    <section class="tv-table">
      ${S.roundOver?`<h3>Como ficou</h3>${roundRuler({gap:54, min:Math.max(320, Math.min(520, innerHeight-300)), ax:70})}`:`<h3>Na mesa</h3>`}
      ${S.roundOver?'':S.table.length?`<ol class="pile big ${anim?'reveal-anim':''}">${S.table.map((t,i)=>`<li class="${t.ok?'':'bad'} ${i>=revealFrom?'new':''}" style="--i:${Math.max(0,i-revealFrom)}"><strong>${t.card}</strong><span>${esc(nameOf(t.seat))}</span>${hintOf(t.seat)?`<i>“${esc(hintOf(t.seat))}”</i>`:''}${t.ok?'':'<em>fora do lugar</em>'}</li>`).join('')}
        </ol>`:'<p class="empty">Nenhuma carta na mesa ainda.</p>'}
      ${pending.length&&!S.roundOver?`<h3>Ordem da turma</h3><ol class="order-list tv">${pending.map((s,i)=>`<li><span class="pos">${S.table.length+i+1}º</span><span class="who"><b>${esc(nameOf(s))}</b>${hintOf(s)?`<i>“${esc(hintOf(s))}”</i>`:'<i class="none">pensando…</i>'}</span></li>`).join('')}</ol>`:''}
    </section>
  </div>`, false, true);
}

/* ======================================================================
   Menu
   ====================================================================== */
function openMenu(){
  const inRoom=!!(S||NET.role), items=[];
  if(inRoom){
    items.push(['share',I.share,'Convidar para a sala']);
    items.push(['qr',I.qr,'Mostrar QR code']);
    if(S && S.mode==='local' && S.status==='play'){ items.push(['reveal',I.eye,'Conferir cartas de todos']); items.push(['syncBox',I.sliders,'Corrigir rodada']); }
    if(S && (S.history||[]).length) items.push(['showHistory',I.list,'Placar da noite']);
    items.push('hr');
  }
  items.push(['toggleSound', soundOn?I.sound:I.mute, soundOn?'Sons: ligados':'Sons: desligados']);
  items.push(['rules',I.book,'Como jogar']);
  if(installEvt) items.push(['install',I.download,'Instalar app']);
  items.push(['hardUpdate',I.refresh,'Atualizar app']);
  if(inRoom){ items.push('hr'); items.push(['leave',I.exit,NET.role==='host'?'Encerrar sala':NET.spectator?'Fechar telão':'Sair da sala','danger']); }
  $('#menuList').innerHTML=items.map(it=>it==='hr'?'<hr>':`<button data-act="${it[0]}" class="${it[3]||''}">${it[1]}<span>${it[2]}</span></button>`).join('');
  $('#versionLabel').textContent=`ito v${VERSION}`;
  $('#menu').showModal();
}

/* ======================================================================
   Ações
   ====================================================================== */
const currentCode=()=>NET.code||(S&&S.code)||(P&&P.code);
const act={
  goHome(){ if(S||NET.role) return; history.replaceState(null,'',location.pathname); home(); },
  openMenu,
  step(b){ const k=b.dataset.k, d=+b.dataset.d;
    if(k==='players') draft.players=Math.min(10,Math.max(2,draft.players+d));
    if(k==='rounds') draft.rounds=Math.min(MAX_ROUNDS,Math.max(MIN_ROUNDS,draft.rounds+d));
    home(true); },
  toggleCat(b){ draft.mask^=(1<<+b.dataset.v); home(true); },
  allCats(){ draft.mask=draft.mask===ALL_MASK?0:ALL_MASK; home(true); },
  create(){ if(!draft.mask) return; ls.del(LOCAL_KEY); startHost(newRoom()); },
  join(){ const p=parseCode($('#code').value); if(!p){ $('#err').textContent='Código não encontrado. Confira as 8 letras.'; return; } ls.del(LOCAL_KEY); startGuest(p); },
  resume(){
    const online=ls.get(ONLINE_KEY,null), local=ls.get(LOCAL_KEY,null);
    if(online){ const r=parseCode(online.code); if(r){ online.role==='host'?startHost(r,online.st):startGuest(r,online.st,online.role==='tv'); return; } }
    if(local){ S=local; history.replaceState(null,'','#'+S.code); game(); return; }
    home();
  },
  retry(){ startGuest(parseCode(NET.code), NET.st, NET.spectator); },
  joinTv(){ const p=parseCode($('#code').value); if(!p){ $('#err').textContent='Digite o código da sala para abrir o telão.'; return; } ls.del(LOCAL_KEY); startGuest(p,null,true); },
  tipsOk(){ ls.set('ito-tips',true); showOnline(); },
  reactOpen(){ reactOpenState=!reactOpenState; const p=$('.react-pop'), f=$('.react-fab'); if(p) p.hidden=!reactOpenState; if(f){ f.textContent=reactOpenState?'✕':'😀'; f.classList.toggle('on',reactOpenState); } },
  async themeMenu(){
    const v=await dialog({title:'Mudar tema', body:'<p>Só dá para mudar antes de alguém baixar uma carta.</p>', actions:[
      {label:svgStroke(I.shuffle)+'Trocar por outro tema', value:'skip'},
      {label:svgStroke(I.vote)+'Votar entre dois temas', value:'voteStart'},
      {label:svgStroke(I.pencil)+'Escrever o nosso tema', value:'customTheme'},
      {label:'Cancelar', value:'no', cls:'text'}]});
    if(v==='skip') act.skip(); else if(v==='voteStart') act.voteStart(); else if(v==='customTheme') act.customTheme();
  },
  saveHint(){ const i=$('#myHint'); if(!i) return; const text=i.value.trim().slice(0,30); i.blur(); delete drafts.hint; sendAct('hint',{text}); toast(text?`Dica enviada: “${text}”`:'Dica apagada'); },
  react(b){ const now=Date.now(); if(now-lastReact<700) return; lastReact=now; const e=b.dataset.e, by=myLabel();
    showReaction(e, by); SFX.pop(); broadcast({t:'react', e, by, id:Math.random().toString(36).slice(2)}); },
  voteStart(){ sendAct('voteStart'); },
  vote(b){ sendAct('vote',{i:+b.dataset.i}); },
  voteEnd(){ sendAct('voteEnd'); },
  planMove(b){ const o=planOrder(), seat=+b.dataset.s, i=o.indexOf(seat), j=i+(+b.dataset.d); if(i<0||j<0||j>=o.length) return;
    [o[i],o[j]]=[o[j],o[i]]; S.plan=o; game(); sendAct('plan',{order:o}); },
  async revealPlan(){
    const o=planOrder();
    if(!o.length) return;
    if(!await confirmBox(o.length>1?'Todos concordam com a ordem?':'Revelar a última carta?', `<ol class="confirm-order">${o.map(s=>`<li>${esc(nameOf(s))}${S.hints[s]?` · “${esc(S.hints[s])}”`:''}</li>`).join('')}</ol>Todas as cartas vão para a mesa nessa sequência.`, 'Revelar')) return;
    sendAct('reveal',{order:o});
  },
  toggleSound(){ soundOn=!soundOn; ls.set('ito-sound',soundOn); if(soundOn){ audio(); SFX.pop(); } toast(soundOn?'Sons ligados':'Sons desligados'); },
  async shareSummary(){
    const blob=await summaryImage(); if(!blob){ toast('Não foi possível criar a imagem'); return; }
    const file=new File([blob],'ito-resumo.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], title:'ito', text:'Nosso resumo no ito'}); }catch(e){} return; }
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ito-resumo.png'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('Imagem salva');
  },
  goLocal(){
    const st=NET.st, room=parseCode(NET.code||(P&&P.code));
    netReset(); ls.del(ONLINE_KEY);
    if(st && st.players.some(p=>p.cid===CID) && st.phase!=='lobby'){
      viewFromNet(st);
      Object.assign(S,{mode:'local', custom:null}); delete S.table; delete S.roundOver;
      if(st.roundOver && st.results.length<st.rounds){ S.round++; S.themePos++; }
      saveLocal(); history.replaceState(null,'','#'+S.code); game(); toast('Modo sem conexão');
    } else { P=room; seatScreen(); }
  },
  seat(b){
    S={mode:'local', code:P.code, n:P.n, rounds:P.rounds, mask:P.mask, names:[], seat:+b.dataset.v, game:1, round:1, results:[], themePos:0, status:'play', history:[]};
    if(myName) S.names[S.seat-1]=myName;
    saveLocal(); game();
  },
  saveName(){
    const inp=$('#myName'); if(!inp) return;
    myName=inp.value.trim().slice(0,20); ls.set('ito-name',myName); inp.blur(); delete drafts.name;
    if(NET.role==='host'){ const me=NET.st.players.find(p=>p.cid===CID); if(me){ me.name=myName; hostCommit(); } }
    else if(NET.role==='guest') sendToCid(NET.st&&NET.st.hostCid, {t:'name', name:myName});
    toast(myName?`Pronto, ${myName}`:'Nome removido');
  },
  start(){ sendAct('start'); },
  async playerMenu(b){
    const cid=b.dataset.cid, st=NET.st, p=st.players.find(p=>p.cid===cid); if(!p) return;
    const acts=[];
    if(p.seat>1) acts.push({label:svgStroke(I.up)+'Subir na ordem',value:'up'});
    if(p.seat<st.players.length) acts.push({label:svgStroke(I.down)+'Descer na ordem',value:'down'});
    if(cid!==CID) acts.push({label:svgStroke(I.remove)+'Tirar da sala',value:'kick',cls:'danger-soft'});
    acts.push({label:'Fechar',value:'no',cls:'text'});
    const v=await dialog({title:p.name||`Jogador ${p.seat}`, body:'', actions:acts});
    if(v==='up'||v==='down') sendAct('move',{cid, dir:v==='up'?-1:1});
    if(v==='kick' && await confirmBox('Tirar da sala?',`${esc(p.name||'Jogador '+p.seat)} sai da sala e não consegue voltar por esse convite.`,'Tirar')) sendAct('kick',{cid});
  },
  async copy(){ const code=currentCode(); try{ await navigator.clipboard.writeText(roomLink(code)); toast('Link copiado'); }catch(e){ toast('Código da sala: '+code); } },
  async share(){ const code=currentCode();
    if(navigator.share){ try{ await navigator.share({title:'ito', text:`Bora jogar ito! Código da sala: ${code}`, url:roomLink(code)}); }catch(e){} return; }
    act.copy(); },
  qr(){
    const code=currentCode(); let svg='';
    try{ svg=qrSvg(roomLink(code)); }catch(e){ toast('Não foi possível gerar o QR code'); return; }
    dialog({title:'Entrar pela câmera', body:`<div class="qr-wrap">${svg}</div><p class="center">Aponte a câmera do celular para o código.<br><b>${code}</b></p>`, actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  peek(){
    if(S.mode==='online' && S.table.some(t=>t.seat===S.seat)) return;
    peek=!peek;
    document.querySelectorAll('.card').forEach(c=>c.classList.toggle('up',peek));
    const h=$('.hint'); if(h) h.textContent=peek?'Toque para esconder':'Toque na carta para ver seu número';
  },
  async playCard(){
    const mine=deck()[S.seat-1];
    if(!await confirmBox('Baixar sua carta?',`Sua carta <b>${mine}</b> vai para a mesa e todos vão ver.`,'Baixar')) return;
    sendAct('play');
  },
  next(){ if(Date.now()<nextReadyAt) return; pending_next=true; showOnline(); sendAct('next'); setTimeout(()=>{ if(pending_next){ pending_next=false; showOnline(); } }, 4000); },
  async customTheme(){
    const v=await dialog({title:'Escrever tema', body:`<p>Crie um tema só para esta rodada.</p>
      <label class="fld">Tema<input id="ctTitle" maxlength="60" placeholder="Ex.: Coisas que o tio fala no churrasco"></label>
      <div class="grid2"><label>1 é…<input id="ctLow" maxlength="30" placeholder="pouco"></label><label>100 é…<input id="ctHigh" maxlength="30" placeholder="muito"></label></div>`,
      actions:[{label:'Cancelar',value:'no'},{label:'Usar tema',value:'ok',cls:'brand'}]});
    if(v!=='ok') return;
    const title=$('#ctTitle').value.trim(); if(!title){ toast('Escreva o tema'); return; }
    sendAct('custom',{title, low:$('#ctLow').value.trim()||'pouco', high:$('#ctHigh').value.trim()||'muito'});
  },
  async reveal(){
    if(!await confirmBox('Mostrar todas as cartas?','Façam isso só depois de baixar as cartas, para conferir a ordem.','Mostrar')) return;
    const d=deck(), [,low,high]=theme();
    const entries=[...Array(S.n)].map((_,i)=>({card:d[i], name:nameOf(i+1)+(i+1===S.seat?' (você)':''), me:i+1===S.seat, seq:i}));
    dialog({title:`Rodada ${S.round}`, body:ruler(entries,{anim:true, low, high, min:260}), actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  showHistory(){
    const h=S.history||[];
    dialog({title:'Placar da noite', body:h.length?`<ul class="hist">${h.map(x=>`<li><span>Partida ${x.game}</span><strong>${x.score} de ${x.total}</strong></li>`).join('')}</ul>`:'<p>Nenhuma partida terminada ainda.</p>', actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  win(){ localAct('win'); },
  lose(){ localAct('lose'); },
  skip(){ S.mode==='online'?sendAct('skip'):localAct('skip'); },
  restart(){ S.mode==='online'?sendAct('restart'):localAct('restart'); },
  async syncBox(){
    const score=S.results.filter(x=>x===1).length;
    const v=await dialog({title:'Corrigir rodada', body:`<p>Alguém ficou com a rodada ou o tema diferente? Copie aqui os números do celular de outra pessoa.</p>
      <div class="grid2">
        <label>Rodada<input id="sr" type="number" inputmode="numeric" min="1" max="${S.rounds}" value="${S.round}"></label>
        <label>Acertos<input id="sa" type="number" inputmode="numeric" min="0" value="${score}"></label>
        <label>Nº do tema<input id="st" type="number" inputmode="numeric" min="0" value="${S.themePos}"></label>
        <label>Partida<input id="sg" type="number" inputmode="numeric" min="1" value="${S.game}"></label>
      </div>`, actions:[{label:'Cancelar',value:'no'},{label:'Aplicar',value:'ok',cls:'brand'}]});
    if(v!=='ok') return;
    const n=id=>parseInt($('#'+id).value,10)||0, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
    const round=clamp(n('sr'),1,S.rounds), hits=clamp(n('sa'),0,round-1);
    S.round=round; S.results=[...Array(round-1)].map((_,i)=>i<hits?1:0);
    S.themePos=clamp(n('st'),0,99999); S.game=clamp(n('sg'),1,99999); S.status='play';
    saveLocal(); game(); toast('Pronto, tudo certo');
  },
  rules(){
    dialog({title:'Como jogar', body:`
      <ol>
        <li>A cada rodada, cada pessoa recebe <b>uma carta</b> secreta de <b>1 a 100</b>.</li>
        <li>Leiam o <b>tema</b>. Cada um descreve sua carta com algo do tema, sem dizer o número. Ex.: no tema “Comidas”, quem tem 95 pode dizer “pizza”.</li>
        <li>Quando achar que é a sua vez, toque em <b>Baixar minha carta</b>. As cartas precisam ir para a mesa em <b>ordem crescente</b>.</li>
        <li>Se alguém baixar uma carta maior que a de outra pessoa que ainda não baixou, o app avisa: <b>fora da ordem</b>.</li>
      </ol>
      <p><b>Criar a sala:</b> escolha quantas rodadas e os assuntos dos temas, e mande o convite (link ou QR code). Cada um coloca o próprio nome, se quiser.</p>
      <p><b>Ordem da turma:</b> combinem quem baixa primeiro, arrumem a lista e toquem em <b>Revelar nessa ordem</b>. O app vira as cartas e confere sozinho.</p>
      <p><b>Dica:</b> escreva a palavra que você falou. Ela aparece na mesa para todos.</p>
      <p><b>Tema:</b> antes de alguém baixar, dá para trocar, votar entre dois temas ou escrever um tema da turma.</p>
      <p><b>Telão:</b> uma TV ou notebook pode entrar como mesa, mostrando tudo em tamanho grande.</p>
      <p><b>No final</b> aparece o placar da partida e, se jogarem várias, o placar da noite.</p>`,
      actions:[{label:'Entendi',value:'ok',cls:'brand'}]});
  },
  async leave(){
    if(NET.role==='host'){
      if(!await confirmBox('Encerrar a sala?','A sala acaba para todo mundo.','Encerrar')) return;
      broadcast({t:'closed'}); await new Promise(r=>setTimeout(r,250));
    } else if(NET.role==='guest'){
      if(!NET.spectator && NET.st && NET.st.phase!=='lobby' && !await confirmBox('Sair da sala?','Você pode voltar depois pelo mesmo link.','Sair')) return;
      if(NET.st) sendToCid(NET.st.hostCid,{t:'bye'}); await new Promise(r=>setTimeout(r,150));
    } else if(S && S.status==='play' && !await confirmBox('Sair da sala?','O progresso desta partida será apagado deste celular.','Sair')) return;
    netReset(); ls.del(ONLINE_KEY); ls.del(LOCAL_KEY); S=null; P=null;
    history.replaceState(null,'',location.pathname); home();
  },
  async install(){ if(!installEvt) return; installEvt.prompt(); try{ await installEvt.userChoice; }catch(e){} installEvt=null; if(!S && !P && !NET.role) home(true); },
  applyUpdate(){ if(swReg && swReg.waiting){ window.__itoUpdating=true; swReg.waiting.postMessage({type:'SKIP_WAITING'}); } else hardUpdate(); },
  hardUpdate(){ hardUpdate(); }
};

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
(function start(){
  if(location.search) history.replaceState(null,'',location.pathname+location.hash);
  const h=parseHash(location.hash), online=ls.get(ONLINE_KEY,null), local=ls.get(LOCAL_KEY,null);
  if(h && online && online.code===h.code){ online.role==='host'?startHost(h,online.st):startGuest(h,online.st,online.role==='tv'); }
  else if(h && local && local.code===h.code){ S=local; game(); }
  else if(h){ ls.del(LOCAL_KEY); startGuest(h); }
  else home();
})();
