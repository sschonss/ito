'use strict';
const VERSION = '1.2.0';
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

const P2P_URL = window.ITO_P2P_URL || 'https://esm.run/trystero@0.25.4';
const APP_ID = 'ito-sschonss-github-io';
const CONNECT_TIMEOUT = 15000;
I.users = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>';
I.wifiOff = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5-2.7M14 10.2a10 10 0 0 1 5 2.7M2 9.3a15 15 0 0 1 5-3M12 5a15 15 0 0 1 10 4.3"/><circle cx="12" cy="20" r="1"/></svg>';

/* ---------- Armazenamento ---------- */
const ls = {
  get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const LOCAL_KEY='ito-game-v2', ONLINE_KEY='ito-online';
const CID = (()=>{ let c=ls.get('ito-cid',null); if(!c){ c=[...crypto.getRandomValues(new Uint32Array(2))].map(x=>x.toString(36)).join(''); ls.set('ito-cid',c); } return c; })();
let myName = ls.get('ito-name','');

/* ---------- Estado ---------- */
let S = null;                 // partida na tela (local ou conectada)
let P = null;                 // sala aberta
const draft = { players:4, rounds:5, mask:ALL_MASK };
let peek=false, peekKey='', lastEv='';
let installEvt=null, swReg=null;
const NET = { lib:null, room:null, send:null, role:null, code:null, st:null, hostPeer:null, peers:{}, failed:false, timedOut:false, timer:null, gone:false };

const $ = s => document.querySelector(s);
const view = $('#view');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Sorteio igual em todos os celulares ---------- */
function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng = s => mulberry(xmur3(s)());
function shuffle(arr, r){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

/* ---------- Código da sala: ABCD-EFGH (sorteio + jogadores, rodadas e categorias) ---------- */
const L24='ABCDEFGHJKLMNPQRSTUVWXYZ';
function enc(n, rounds, mask){
  let v=((n-2)*MAX_ROUNDS+(rounds-1))*256+mask, s='';
  for(let i=0;i<4;i++){ s=L24[v%24]+s; v=Math.floor(v/24); }
  return s;
}
function parseCode(raw){
  const s=(raw||'').trim().toUpperCase().replace(/[^A-Z]/g,'');
  if(s.length!==8 || [...s].some(c=>!L24.includes(c))) return null;
  let v=0; for(const c of s.slice(4)) v=v*24+L24.indexOf(c);
  const mask=v%256; v=Math.floor(v/256);
  const rounds=v%MAX_ROUNDS+1, n=Math.floor(v/MAX_ROUNDS)+2;
  if(n<2 || n>10 || !(mask&ALL_MASK)) return null;
  return { code:s.slice(0,4)+'-'+s.slice(4), n, rounds, mask:mask&ALL_MASK };
}
const parseHash = h => parseCode(decodeURIComponent((h||'').replace(/^#/,'').split('~')[0]));
function newRoom(){
  const v=new Uint32Array(4); crypto.getRandomValues(v);
  return parseCode([...v].map(x=>L24[x%24]).join('')+enc(draft.players, draft.rounds, draft.mask));
}
const roomLink = code => location.origin + location.pathname + '#' + code;
const catNames = mask => mask===ALL_MASK ? 'Todas as categorias' : CATS.filter((_,i)=>mask&(1<<i)).map(c=>c.name).join(' · ');
const nameOf = p => (S && S.names && S.names[p-1]) || `Jogador ${p}`;

function deck(){ return shuffle([...Array(100)].map((_,i)=>i+1), rng(S.code+'|'+S.game+'|'+S.round)); }
function theme(){
  const order=shuffle(THEMES.map((t,i)=>[t,i]).filter(([t])=>S.mask&(1<<t[3])).map(([,i])=>i), rng(S.code+'|themes'));
  return THEMES[order[S.themePos%order.length]];
}

/* ---------- Componentes ---------- */
let toastTimer;
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2400);
}
function dialog({title, body, actions}){
  return new Promise(resolve=>{
    const d=$('#dialog');
    if(d.open) d.close();
    $('#dlgTitle').textContent=title;
    $('#dlgBody').innerHTML=body||'';
    $('#dlgActions').innerHTML=actions.map(a=>`<button class="btn ${a.cls||'soft'}" value="${a.value}">${a.label}</button>`).join('');
    d.returnValue='';
    d.onclose=()=>resolve(d.returnValue);
    d.showModal();
  });
}
const confirmBox=(title, body, ok='Confirmar')=>
  dialog({title, body:`<p>${body}</p>`, actions:[{label:'Cancelar',value:'no'},{label:ok,value:'ok',cls:'brand'}]}).then(v=>v==='ok');
function setMeta(html){ $('#appbarMeta').innerHTML=html||''; }
function render(html, dock, keep){
  const y=window.scrollY;
  view.className='view'+(keep?'':' enter')+(dock?' has-dock':'');
  view.innerHTML=html;
  window.scrollTo({top: keep ? y : 0});
}
const svgStroke = svg => svg.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
const stepper=(key,val,min,max,unit)=>`<div class="stepper">
  <button data-act="step" data-k="${key}" data-d="-1" aria-label="Menos" ${val<=min?'disabled':''}>−</button>
  <div class="val"><strong>${val}</strong><span>${unit}</span></div>
  <button data-act="step" data-k="${key}" data-d="1" aria-label="Mais" ${val>=max?'disabled':''}>+</button></div>`;
const roomCard = (code, info) => `<section class="panel room-code">
    <p class="eyebrow">Código da sala</p>
    <div class="code">${code}</div>
    <p class="room-info">${info}</p>
    <div class="btn-row">
      <button class="btn soft" data-act="copy">${svgStroke(I.copy)}Copiar link</button>
      <button class="btn brand" data-act="share">${svgStroke(I.share)}Convidar</button>
    </div>
  </section>`;

/* ======================================================================
   Tela inicial
   ====================================================================== */
function home(keep){
  const typed = keep && $('#code') ? $('#code').value : '';
  S=null; P=null; setMeta('');
  const local=ls.get(LOCAL_KEY,null), online=ls.get(ONLINE_KEY,null);
  const resume = online ? `<button class="resume" data-act="resume">
      <span class="dot"></span>
      <span><strong>Voltar para a sala</strong><span>Sala ${online.code}${online.role==='host'?' · você é o anfitrião':''}</span></span>
      ${svgStroke(I.chevron)}</button>`
    : local ? `<button class="resume" data-act="resume">
      <span class="dot"></span>
      <span><strong>Continuar partida</strong><span>Sala ${local.code} · rodada ${Math.min(local.round,local.rounds)} de ${local.rounds}</span></span>
      ${svgStroke(I.chevron)}</button>` : '';

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
      <div class="cat-head"><span class="label">Categorias de tema</span>
        <button class="link-btn" data-act="allCats">${draft.mask===ALL_MASK?'Limpar':'Todas'}</button></div>
      <div class="cats">${CATS.map((c,i)=>`<button class="cat ${draft.mask&(1<<i)?'on':''}" data-act="toggleCat" data-v="${i}" aria-pressed="${!!(draft.mask&(1<<i))}">${c.name}<small>${c.themes.length}</small></button>`).join('')}</div>
    </div>
    <button class="btn brand" data-act="create" ${draft.mask?'':'disabled'}>Criar sala</button>
  </section>

  <section class="panel">
    <h2>Entrar numa sala</h2>
    <p class="lead">Abra o link do convite ou digite o código.</p>
    <input id="code" class="field" placeholder="ABCD-EFGH" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" enterkeyhint="go">
    <p class="err" id="err"></p>
    <button class="btn" data-act="join">Entrar</button>
  </section>
  <div class="foot"><button data-act="rules">Como jogar</button>·<button data-act="hardUpdate">Atualizar app</button></div>`, false, keep);

  const input=$('#code'); input.value=typed;
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') act.join(); });
  input.addEventListener('input',()=>{
    $('#err').textContent='';
    const raw=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,8);
    input.value=raw.length>4?raw.slice(0,4)+'-'+raw.slice(4):raw;
  });
}

/* ======================================================================
   Sala conectada
   - quem cria é o anfitrião: guarda a partida e distribui os lugares
   - os outros mandam pedidos para o anfitrião, que avisa todo mundo
   ====================================================================== */
function netReset(){
  try{ NET.room && NET.room.leave(); }catch(e){}
  clearTimeout(NET.timer);
  Object.assign(NET,{room:null,send:null,role:null,code:null,st:null,hostPeer:null,peers:{},failed:false,timedOut:false,timer:null,gone:false});
}
async function connect(code){
  NET.code=code; NET.failed=false;
  try{
    NET.lib = NET.lib || await import(P2P_URL);
    const room = NET.lib.joinRoom({appId:APP_ID, password:code}, code);
    NET.room = room;
    const a = room.makeAction('m');
    if(Array.isArray(a)){ NET.send=(d,t)=>a[0](d,t); a[1]((d,peer)=>onMsg(d,peer)); }
    else { NET.send=(d,t)=>a.send(d, t?{target:t}:undefined); a.onMessage=(d,meta)=>onMsg(d, meta&&typeof meta==='object'?meta.peerId:meta); }
    const join=peer=>onPeerJoin(peer), leave=peer=>onPeerLeave(peer);
    if(typeof room.onPeerJoin==='function'){ room.onPeerJoin(join); room.onPeerLeave(leave); }
    else { room.onPeerJoin=join; room.onPeerLeave=leave; }
  }catch(e){
    console.warn('ito: sem conexão', e);
    NET.failed=true;
  }
  if(NET.role==='guest' && !NET.st){
    clearTimeout(NET.timer);
    NET.timer=setTimeout(()=>{ if(!NET.st){ NET.timedOut=true; showOnline(); } }, CONNECT_TIMEOUT);
  }
  showOnline();
}
function saveOnline(){
  if(NET.role==='host') ls.set(ONLINE_KEY,{code:NET.code, role:'host', st:NET.st});
  else if(NET.role==='guest') ls.set(ONLINE_KEY,{code:NET.code, role:'guest'});
}
function onPeerJoin(peer){
  if(NET.role==='guest') NET.send({t:'hello', cid:CID, name:myName}, peer);
  else if(NET.role==='host') NET.send({t:'state', st:NET.st}, peer);
}
function onPeerLeave(peer){
  if(NET.role==='host'){
    const cid=NET.peers[peer]; delete NET.peers[peer];
    const pl=NET.st.players.find(p=>p.cid===cid);
    if(pl){ pl.on=false; hostCommit(); }
  } else if(peer===NET.hostPeer){
    NET.hostPeer=null; showOnline();
  }
}
function onMsg(m, peer){
  if(!m || typeof m!=='object') return;
  if(NET.role==='host'){
    if(m.t==='hello' && typeof m.cid==='string'){
      const st=NET.st; let pl=st.players.find(p=>p.cid===m.cid);
      if(!pl){
        if(st.players.length>=10){ NET.send({t:'full'}, peer); return; }
        pl={seat:st.players.length+1, cid:m.cid, name:'', on:true}; st.players.push(pl);
      }
      pl.on=true; NET.peers[peer]=m.cid;
      if(typeof m.name==='string' && m.name.trim()) pl.name=m.name.trim().slice(0,20);
      hostCommit();
    } else if(m.t==='name'){
      const pl=NET.st.players.find(p=>p.cid===NET.peers[peer]);
      if(pl){ pl.name=String(m.name||'').trim().slice(0,20); hostCommit(); }
    } else if(m.t==='act' && m.a){
      const pl=NET.st.players.find(p=>p.cid===NET.peers[peer]);
      if(pl && applyAct(NET.st, m.a, pl)) hostCommit();
    } else if(m.t==='bye'){
      const cid=NET.peers[peer], st=NET.st;
      if(st.phase==='lobby'){ st.players=st.players.filter(p=>p.cid!==cid); st.players.forEach((p,i)=>p.seat=i+1); }
      else { const pl=st.players.find(p=>p.cid===cid); if(pl) pl.on=false; }
      hostCommit();
    }
  } else if(NET.role==='guest'){
    if(m.t==='state' && m.st && m.st.code===NET.code){
      NET.hostPeer=peer; NET.st=m.st; NET.timedOut=false; clearTimeout(NET.timer);
      if(!m.st.players.some(p=>p.cid===CID)) NET.send({t:'hello', cid:CID, name:myName}, peer);
      saveOnline(); showOnline();
    } else if(m.t==='full'){
      netReset(); ls.del(ONLINE_KEY); home();
      dialog({title:'Sala cheia', body:'<p>Essa sala já tem 10 pessoas.</p>', actions:[{label:'Ok',value:'ok',cls:'brand'}]});
    } else if(m.t==='closed'){
      netReset(); ls.del(ONLINE_KEY); history.replaceState(null,'',location.pathname); home();
      dialog({title:'Sala encerrada', body:'<p>O anfitrião encerrou a sala.</p>', actions:[{label:'Ok',value:'ok',cls:'brand'}]});
    }
  }
}
/* Regras da partida (só o anfitrião aplica) */
function applyAct(st, a, by){
  let ev=null;
  if(a.t==='start' && st.phase==='lobby'){ st.phase='play'; ev='start'; }
  else if((a.t==='win'||a.t==='lose') && st.phase==='play' && a.game===st.game && a.round===st.round){
    st.results.push(a.t==='win'?1:0);
    if(st.results.length>=st.rounds) st.phase='done'; else { st.round++; st.themePos++; }
    ev=a.t;
  }
  else if(a.t==='skip' && st.phase==='play' && a.themePos===st.themePos){ st.themePos++; ev='skip'; }
  else if(a.t==='restart' && st.phase==='done' && a.game===st.game){
    st.game++; st.round=1; st.results=[]; st.themePos++; st.phase='play'; ev='restart';
  }
  if(!ev) return false;
  st.ev={k:ev, cid:by.cid, by:by.name||`Jogador ${by.seat}`, id:Math.random().toString(36).slice(2)};
  return true;
}
function hostCommit(){
  saveOnline();
  if(NET.send) try{ NET.send({t:'state', st:NET.st}); }catch(e){}
  showOnline();
}
function sendAct(t){
  const a={t, game:S.game, round:S.round, themePos:S.themePos};
  if(NET.role==='host'){
    const me=NET.st.players.find(p=>p.cid===CID);
    if(applyAct(NET.st, a, me)) hostCommit();
  } else {
    if(!NET.hostPeer){ toast('Sem conexão com o anfitrião'); return; }
    NET.send({t:'act', a}, NET.hostPeer);
  }
}
function startHost(room, saved){
  netReset(); NET.role='host';
  NET.st = saved || { code:room.code, rounds:room.rounds, mask:room.mask, hostCid:CID,
    players:[{seat:1, cid:CID, name:myName, on:true}], phase:'lobby', game:1, round:1, results:[], themePos:0, ev:null };
  const me=NET.st.players.find(p=>p.cid===CID); if(me){ me.on=true; if(myName) me.name=myName; }
  NET.st.players.forEach(p=>{ if(p.cid!==CID) p.on=false; });
  history.replaceState(null,'','#'+NET.st.code);
  saveOnline(); connect(NET.st.code);
}
function startGuest(room){
  netReset(); NET.role='guest'; P=room;
  history.replaceState(null,'','#'+room.code);
  saveOnline(); connect(room.code);
}

/* Converte a partida conectada para a tela */
function viewFromNet(){
  const st=NET.st, me=st.players.find(p=>p.cid===CID);
  const names=[]; st.players.forEach(p=>names[p.seat-1]=p.name);
  S={ mode:'online', code:st.code, rounds:st.rounds, mask:st.mask, n:st.players.length, names,
      seat: me?me.seat:0, game:st.game, round:st.round, results:st.results, themePos:st.themePos,
      status: st.phase==='done'?'done':'play' };
}
function showOnline(){
  if(!NET.role) return;
  if(NET.role==='guest' && !NET.st) return connecting();
  viewFromNet();
  const st=NET.st;
  if(st.ev && st.ev.id!==lastEv){
    if(lastEv && st.ev.cid!==CID){
      const msg={start:'começou a partida', win:'marcou: Acertamos', lose:'marcou: Erramos', skip:'trocou o tema', restart:'começou outra partida'}[st.ev.k];
      if(msg) toast(`${st.ev.by} ${msg}`);
    }
    lastEv=st.ev.id;
  }
  if(st.phase==='lobby') lobby(); else game();
}

function connecting(){
  setMeta(`Sala <b>${NET.code}</b>`);
  const stuck = NET.failed || NET.timedOut;
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

function lobby(){
  const st=NET.st, isHost=NET.role==='host', me=st.players.find(p=>p.cid===CID);
  const online=st.players.filter(p=>p.on).length;
  const hostGone = !isHost && !NET.hostPeer;
  setMeta(`Sala <b>${st.code}</b>`);
  render(`
  ${hostGone?banner():''}
  ${roomCard(st.code, `${st.rounds} ${st.rounds===1?'rodada':'rodadas'} · ${catNames(st.mask)}`)}
  <section class="panel">
    <div class="row-between"><h2>Na sala</h2><span class="count">${online} ${online===1?'pessoa':'pessoas'}</span></div>
    <ul class="roster">${st.players.map(p=>`<li class="${p.on?'':'off'}">
      <span class="num">${p.seat}</span>
      <span class="nm">${esc(p.name||`Jogador ${p.seat}`)}</span>
      ${p.cid===CID?'<span class="tag">você</span>':''}${p.cid===st.hostCid?'<span class="tag host">anfitrião</span>':''}
      <span class="status-dot" title="${p.on?'conectado':'desconectado'}"></span></li>`).join('')}</ul>
  </section>
  <section class="panel">
    <h2>Seu nome</h2>
    <p class="lead">Opcional. É assim que os outros vão te ver.</p>
    <div class="name-row"><input id="myName" class="name-input" maxlength="20" placeholder="Jogador ${me?me.seat:''}" value="${esc(myName)}" autocomplete="off" enterkeyhint="done">
    <button class="btn soft" data-act="saveName">Salvar</button></div>
  </section>
  ${isHost
    ? `<button class="btn brand big" data-act="start" ${st.players.length<2?'disabled':''}>Começar partida</button>
       <p class="note center">${st.players.length<2?'Esperando a turma entrar…':'Pode começar quando todos estiverem aqui.'}</p>`
    : `<div class="waiting"><span class="pulse"></span>Esperando o anfitrião começar</div>`}
  <button class="btn text" data-act="leave">Sair da sala</button>`, false, true);
  const inp=$('#myName');
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); act.saveName(); } });
}
const banner = () => `<div class="banner">${svgStroke(I.wifiOff)}<span>Reconectando com o anfitrião…</span><button data-act="goLocal">Jogar sem conexão</button></div>`;

/* ======================================================================
   Modo sem conexão (plano B): cada um escolhe seu número
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
function saveLocal(){ ls.set(LOCAL_KEY, S); }

/* ======================================================================
   Jogo (igual nos dois modos)
   ====================================================================== */
function progress(){
  let d=''; for(let i=0;i<S.rounds;i++){ const r=S.results[i]; d+=`<i class="${r===1?'ok':r===0?'no':i===S.results.length?'now':''}"></i>`; }
  return `<div class="progress" aria-hidden="true">${d}</div>`;
}
function game(){
  const online=S.mode==='online', hostGone=online && NET.role==='guest' && !NET.hostPeer;
  setMeta(`<b>${esc(nameOf(S.seat))}</b> · ${S.code}`);
  const key=S.code+'|'+S.game+'|'+S.round; if(key!==peekKey){ peek=false; peekKey=key; }
  const score=S.results.filter(x=>x===1).length;

  if(S.status==='done'){
    const total=S.rounds, pct=score/total;
    const [title,msg]= pct===1?['Sintonia perfeita!','Vocês acertaram todas as rodadas.']
      : pct>=.5?['Mandaram bem!','Boa leitura de tema, turma.']:['Quase lá!','Bora mais uma partida?'];
    render(`${hostGone?banner():''}<section class="panel end-state">
      <div class="badge">${pct>=.5?I.trophy:I.broken}</div>
      <p class="eyebrow">Fim de jogo</p>
      <h2>${title}</h2>
      <div class="score"><strong>${score}</strong><span>de ${total}</span></div>
      <p>${msg}</p>
      ${progress()}
      <div class="stack">
        <button class="btn brand" data-act="restart">Jogar de novo</button>
        <button class="btn outline" data-act="leave">Sair</button>
      </div>
    </section>`, false, true);
    return;
  }

  if(!S.seat){ render(`<section class="panel connect"><div class="spinner"></div><h2>Entrando na partida…</h2></section>`,false,true); return; }
  const [title, low, high, ci]=theme(), mine=deck()[S.seat-1];
  render(`
  ${hostGone?banner():''}
  <div class="statusbar">
    <span class="pill"><span class="k">Rodada</span>${S.round}<span class="k">de ${S.rounds}</span></span>
    <span class="pill score-pill">${I.check}${score}</span>
  </div>
  ${progress()}
  <section class="panel theme">
    <p class="eyebrow">Tema · ${CATS[ci].name}</p>
    <h2>${title}</h2>
    <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
    <div class="scale-labels"><span>${low}</span><span>${high}</span></div>
    <div class="theme-actions"><button class="chip" data-act="skip">${svgStroke(I.shuffle)}Trocar tema</button></div>
  </section>
  <p class="whose">Sua carta, ${esc(nameOf(S.seat))}</p>
  <div class="hand">
    <button class="card ${peek?'up':''}" data-act="peek" aria-label="${peek?'Sua carta: '+mine:'Carta escondida'}">
      <span class="face back">${I.thread}</span>
      <span class="face front"><small class="tl">${mine}</small><strong>${mine}</strong><small class="br">${mine}</small></span>
    </button>
  </div>
  <p class="hint">${peek?'Toque para esconder':'Toque na carta para ver seu número'}</p>
  <button class="btn outline" data-act="reveal">${svgStroke(I.eye)}Conferir cartas de todos</button>
  <div class="dock"><div class="dock-inner">
    <p class="note">${online?'Qualquer pessoa pode marcar. Vale para todos.':'Todos apertam o mesmo botão ao fim da rodada'}</p>
    <div class="btn-row">
      <button class="btn soft" data-act="lose">${I.x}Erramos</button>
      <button class="btn ok" data-act="win">${I.check}Acertamos</button>
    </div>
  </div></div>`, true, online);
}

/* Ações no modo sem conexão */
function localAct(t){
  if(t==='win'||t==='lose'){
    S.results.push(t==='win'?1:0);
    if(S.results.length>=S.rounds) S.status='done'; else { S.round++; S.themePos++; }
    if(S.status!=='done') toast(t==='win'?'Boa! Próxima rodada':'Faz parte. Próxima rodada');
  } else if(t==='skip'){ S.themePos++; }
  else if(t==='restart'){ S.game++; S.round=1; S.results=[]; S.themePos++; S.status='play'; }
  saveLocal(); game();
}

/* ======================================================================
   Menu
   ====================================================================== */
function openMenu(){
  const inRoom=!!(S||NET.role), items=[];
  if(inRoom){
    items.push(['share',I.share,'Convidar para a sala']);
    if(S && S.status==='play' && S.seat) items.push(['reveal',I.eye,'Conferir cartas de todos']);
    if(S && S.mode==='local' && S.status==='play') items.push(['syncBox',I.sliders,'Corrigir rodada']);
    items.push('hr');
  }
  items.push(['rules',I.book,'Como jogar']);
  if(installEvt) items.push(['install',I.download,'Instalar app']);
  items.push(['hardUpdate',I.refresh,'Atualizar app']);
  if(inRoom){ items.push('hr'); items.push(['leave',I.exit,NET.role==='host'?'Encerrar sala':'Sair da sala','danger']); }
  $('#menuList').innerHTML=items.map(it=>it==='hr'?'<hr>':`<button data-act="${it[0]}" class="${it[3]||''}">${it[1]}<span>${it[2]}</span></button>`).join('');
  $('#versionLabel').textContent=`ito v${VERSION}`;
  $('#menu').showModal();
}

/* ======================================================================
   Ações
   ====================================================================== */
const currentCode = () => NET.code || (S&&S.code) || (P&&P.code);
const act = {
  goHome(){ if(S||NET.role) return; history.replaceState(null,'',location.pathname); home(); },
  openMenu,
  step(b){
    const k=b.dataset.k, d=+b.dataset.d;
    if(k==='players') draft.players=Math.min(10,Math.max(2,draft.players+d));
    if(k==='rounds') draft.rounds=Math.min(MAX_ROUNDS,Math.max(MIN_ROUNDS,draft.rounds+d));
    home(true);
  },
  toggleCat(b){ draft.mask^=(1<<+b.dataset.v); home(true); },
  allCats(){ draft.mask=draft.mask===ALL_MASK?0:ALL_MASK; home(true); },
  create(){ if(!draft.mask) return; ls.del(LOCAL_KEY); startHost(newRoom()); },
  join(){
    const p=parseCode($('#code').value);
    if(!p){ $('#err').textContent='Código não encontrado. Confira as 8 letras.'; return; }
    ls.del(LOCAL_KEY); startGuest(p);
  },
  resume(){
    const online=ls.get(ONLINE_KEY,null), local=ls.get(LOCAL_KEY,null);
    if(online){ const r=parseCode(online.code); if(r){ online.role==='host'?startHost(r, online.st):startGuest(r); return; } }
    if(local){ S=local; history.replaceState(null,'','#'+S.code); game(); return; }
    home();
  },
  retry(){ const code=NET.code; const r=parseCode(code); NET.timedOut=false; NET.failed=false; startGuest(r); },
  goLocal(){
    const st=NET.st, room=parseCode(NET.code||(P&&P.code));
    netReset(); ls.del(ONLINE_KEY);
    if(st && st.players.some(p=>p.cid===CID)){
      viewSnapshot(st);
      S.mode='local'; saveLocal(); history.replaceState(null,'','#'+S.code); game();
      toast('Modo sem conexão');
    } else { P=room; seatScreen(); }
  },
  seat(b){
    S={mode:'local', code:P.code, n:P.n, rounds:P.rounds, mask:P.mask, names:[], seat:+b.dataset.v,
       game:1, round:1, results:[], themePos:0, status:'play'};
    if(myName) S.names[S.seat-1]=myName;
    saveLocal(); game();
  },
  saveName(){
    const inp=$('#myName'); if(!inp) return;
    myName=inp.value.trim().slice(0,20); ls.set('ito-name', myName); inp.blur();
    if(NET.role==='host'){ const me=NET.st.players.find(p=>p.cid===CID); if(me){ me.name=myName; hostCommit(); } }
    else if(NET.role==='guest'){ if(NET.hostPeer) NET.send({t:'name', name:myName}, NET.hostPeer); }
    toast(myName?`Pronto, ${myName}`:'Nome removido');
  },
  start(){ sendAct('start'); },
  async copy(){
    const code=currentCode();
    try{ await navigator.clipboard.writeText(roomLink(code)); toast('Link copiado'); }
    catch(e){ toast('Código da sala: '+code); }
  },
  async share(){
    const code=currentCode();
    if(navigator.share){
      try{ await navigator.share({title:'ito', text:`Bora jogar ito! Código da sala: ${code}`, url:roomLink(code)}); }catch(e){}
      return;
    }
    act.copy();
  },
  peek(){
    peek=!peek;
    document.querySelectorAll('.card').forEach(c=>c.classList.toggle('up',peek));
    const h=$('.hint'); if(h) h.textContent=peek?'Toque para esconder':'Toque na carta para ver seu número';
  },
  async reveal(){
    if(!await confirmBox('Mostrar todas as cartas?','Façam isso só depois de baixar as cartas, para conferir a ordem.','Mostrar')) return;
    const d=deck(), list=[...Array(S.n)].map((_,i)=>({v:d[i],p:i+1})).sort((a,b)=>a.v-b.v);
    dialog({title:`Rodada ${S.round}`, body:`<ul class="thread-list">${list.map(x=>
      `<li class="${x.p===S.seat?'me':''}"><span>${esc(nameOf(x.p))}${x.p===S.seat?' (você)':''}</span><strong>${x.v}</strong></li>`).join('')}</ul>`,
      actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  win(){ S.mode==='online'?sendAct('win'):localAct('win'); },
  lose(){ S.mode==='online'?sendAct('lose'):localAct('lose'); },
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
        <li>Baixem as cartas em <b>ordem crescente</b>, uma por vez, falando o número em voz alta.</li>
        <li>Se a ordem saiu certinha, vocês acertaram. Se alguém baixou fora da ordem, erraram.</li>
      </ol>
      <p><b>Criar a sala:</b> escolha quantas rodadas, os assuntos dos temas e mande o convite para a turma. Cada um coloca o próprio nome, se quiser.</p>
      <p><b>Durante o jogo:</b> qualquer pessoa marca Acertamos ou Erramos, e todos os celulares passam para a próxima rodada juntos. No final aparece o placar.</p>`,
      actions:[{label:'Entendi',value:'ok',cls:'brand'}]});
  },
  async leave(){
    if(NET.role==='host'){
      if(!await confirmBox('Encerrar a sala?','A sala acaba para todo mundo.','Encerrar')) return;
      try{ NET.send && NET.send({t:'closed'}); }catch(e){}
      await new Promise(r=>setTimeout(r,250));
    } else if(NET.role==='guest'){
      if(NET.st && NET.st.phase!=='lobby' && !await confirmBox('Sair da sala?','Você pode voltar depois pelo mesmo link.','Sair')) return;
      try{ NET.hostPeer && NET.send({t:'bye'}, NET.hostPeer); }catch(e){}
      await new Promise(r=>setTimeout(r,150));
    } else if(S && S.status==='play' && !await confirmBox('Sair da sala?','O progresso desta partida será apagado deste celular.','Sair')) return;
    netReset(); ls.del(ONLINE_KEY); ls.del(LOCAL_KEY); S=null; P=null;
    history.replaceState(null,'',location.pathname); home();
  },
  async install(){
    if(!installEvt) return;
    installEvt.prompt();
    try{ await installEvt.userChoice; }catch(e){}
    installEvt=null; if(!S && !P && !NET.role) home(true);
  },
  applyUpdate(){
    if(swReg && swReg.waiting){ window.__itoUpdating=true; swReg.waiting.postMessage({type:'SKIP_WAITING'}); }
    else hardUpdate();
  },
  hardUpdate(){ hardUpdate(); }
};
function viewSnapshot(st){ NET.st=st; viewFromNet(); NET.st=null; }

/* ---------- Atualizar: limpa os arquivos guardados e recarrega ---------- */
async function hardUpdate(){
  toast('Atualizando…');
  try{
    if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
    if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); }
    const files=['./','index.html','styles.css','app.js','manifest.webmanifest'];
    await Promise.all(files.map(f=>fetch(f,{cache:'reload'}).catch(()=>{})));
  }catch(e){}
  const url=new URL(location.href); url.searchParams.set('u',Date.now());
  location.replace(url.toString());
}

/* ---------- Eventos ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(!b) return;
  const menu=$('#menu');
  if(menu.open && menu.contains(b)) menu.close();
  const fn=act[b.dataset.act];
  if(fn){ e.preventDefault(); fn(b); }
});
$('#menu').addEventListener('click',e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
$('#dialog').addEventListener('click',e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; if(!S && !P && !NET.role) home(true); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('ito instalado'); });
window.addEventListener('pagehide',()=>{ try{ NET.role==='guest' && NET.hostPeer && NET.send({t:'bye'}, NET.hostPeer); }catch(e){} });

/* ---------- Service worker ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      swReg=await navigator.serviceWorker.register('sw.js');
      const showBar=()=>{ $('#updateBar').hidden=false; };
      if(swReg.waiting && navigator.serviceWorker.controller) showBar();
      swReg.addEventListener('updatefound',()=>{
        const w=swReg.installing;
        w && w.addEventListener('statechange',()=>{ if(w.state==='installed' && navigator.serviceWorker.controller) showBar(); });
      });
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
  if(h && online && online.code===h.code){ online.role==='host'?startHost(h, online.st):startGuest(h); }
  else if(h && local && local.code===h.code){ S=local; game(); }
  else if(h){ ls.del(LOCAL_KEY); startGuest(h); }
  else home();
})();
