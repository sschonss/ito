'use strict';
const VERSION = '1.0.1';
const MAX_LEVEL = 3, LIVES = 3, STORE = 'ito-state';

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
  speaker:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.7 0 6 3.7 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  thread:'<svg viewBox="0 0 40 16"><path d="M2 10c6-6 10 4 17-2s11 2 15-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="7" r="3" fill="currentColor"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>',
  broken:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3l-2 4 3 2-1.5 4M12 7.5c1.4-1.9 3-3 5-3 3.7 0 6 3.7 4.5 7.2C19.5 16.4 12 21 12 21"/></svg>'
};

/* ---------- Estado ---------- */
let S = null;          // jogo atual
let P = null;          // sala escolhida, antes de escolher o assento
let draftPlayers = 4;
let peek = false;
let installEvt = null;
let swReg = null;
let draftMask = ALL_MASK;
const PREFS_KEY = 'ito-prefs';
let prefs = (()=>{ try{ return Object.assign({autoSpeak:true}, JSON.parse(localStorage.getItem(PREFS_KEY))||{}); }catch(e){ return {autoSpeak:true}; } })();
function savePrefs(){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }catch(e){} }

/* ---------- Voz: lê o tema em voz alta ---------- */
const canSpeak = 'speechSynthesis' in window;
let ptVoice = null;
function pickVoice(){
  if(!canSpeak) return;
  const vs = speechSynthesis.getVoices();
  ptVoice = vs.find(v=>/^pt[-_]BR/i.test(v.lang) && /google|natural|luciana|francisca|neural/i.test(v.name))
         || vs.find(v=>/^pt[-_]BR/i.test(v.lang)) || vs.find(v=>/^pt/i.test(v.lang)) || null;
}
if(canSpeak){ pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
function speakTheme(){
  if(!canSpeak || !S) return;
  const [title, low, high] = theme();
  const u = new SpeechSynthesisUtterance(`Tema: ${title}. Um é ${low}. Cem é ${high}.`);
  u.lang = 'pt-BR'; if(ptVoice) u.voice = ptVoice; u.rate = 0.98;
  const btn = document.querySelector('[data-act="speak"]');
  u.onstart = ()=>btn && btn.classList.add('speaking');
  u.onend = u.onerror = ()=>btn && btn.classList.remove('speaking');
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

const $ = s => document.querySelector(s);
const view = $('#view');

function save(){ try{ localStorage.setItem(STORE, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const v = JSON.parse(localStorage.getItem(STORE)); return v && v.code ? v : null; }catch(e){ return null; } }
function clearSaved(){ try{ localStorage.removeItem(STORE); }catch(e){} }

/* ---------- Aleatoriedade determinística (todos os celulares calculam igual) ---------- */
function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng = s => mulberry(xmur3(s)());
function shuffle(arr, r){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

/* Código da sala: ABCD-4 (todas as categorias) ou ABCD-4-1F (categorias escolhidas, em hexadecimal) */
function parseCode(s){
  s = (s||'').trim().toUpperCase().replace(/\s/g,'');
  const m = /^([A-Z]{4})-?(\d{1,2})(?:-([0-9A-F]{2}))?$/.exec(s);
  if(!m) return null;
  const n = +m[2];
  if(n<2 || n>10) return null;
  const mask = m[3] ? parseInt(m[3],16) & ALL_MASK : ALL_MASK;
  if(!mask) return null;
  return { code: m[1]+'-'+n+(mask===ALL_MASK?'':'-'+mask.toString(16).toUpperCase().padStart(2,'0')), n, mask };
}
function newCode(n, mask){
  const L='ABCDEFGHJKLMNPQRSTUVWXYZ', v=new Uint32Array(4);
  crypto.getRandomValues(v);
  return parseCode([...v].map(x=>L[x%L.length]).join('')+'-'+n+'-'+mask.toString(16).padStart(2,'0'));
}
const catNames = mask => mask===ALL_MASK ? 'Todas as categorias' : CATS.filter((_,i)=>mask&(1<<i)).map(c=>c.name).join(' · ');
function hands(){
  const deck = shuffle([...Array(100)].map((_,i)=>i+1), rng(S.code+'|deal|'+S.round));
  const k = S.level, out = [];
  for(let p=0;p<S.n;p++) out.push(deck.slice(p*k,p*k+k).sort((a,b)=>a-b));
  return out;
}
function theme(){
  const mask = parseCode(S.code).mask;
  const order = shuffle(THEMES.map((t,i)=>[t,i]).filter(([t])=>mask&(1<<t[3])).map(([,i])=>i), rng(S.code+'|themes'));
  return THEMES[order[S.themePos % order.length]];
}
const roomLink = code => location.origin + location.pathname + '#' + code;

/* ---------- UI helpers ---------- */
let toastTimer;
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}
function dialog({title, body, actions}){
  return new Promise(resolve=>{
    const d=$('#dialog');
    $('#dlgTitle').textContent=title;
    $('#dlgBody').innerHTML=body||'';
    $('#dlgActions').innerHTML=actions.map(a=>`<button class="btn ${a.cls||'soft'}" value="${a.value}">${a.label}</button>`).join('');
    d.returnValue='';
    d.onclose=()=>resolve(d.returnValue);
    d.showModal();
  });
}
const confirmBox = (title, body, ok='Confirmar', cls='brand') =>
  dialog({title, body:`<p>${body}</p>`, actions:[{label:'Cancelar',value:'no'},{label:ok,value:'ok',cls}]}).then(v=>v==='ok');

function setMeta(html){ $('#appbarMeta').innerHTML = html||''; }
function render(html, dock, keep){
  view.className = 'view' + (keep ? '' : ' enter') + (dock ? ' has-dock' : '');
  view.innerHTML = html;
  if(!keep) window.scrollTo({top:0});
}

/* ---------- Telas ---------- */
function home(keep){
  const typed = keep && $('#code') ? $('#code').value : '';
  S=null; P=null; setMeta('');
  const saved=load();
  render(`
  <section class="hero">
    <p class="eyebrow">Jogo cooperativo</p>
    <h1>Pense no número.<br><em>Fale o tema.</em></h1>
    <p>Junte a turma, cada um no seu celular, e descubram juntos a ordem das cartas.</p>
  </section>

  ${saved?`<button class="resume" data-act="resume">
    <span class="dot"></span>
    <span><strong>Continuar partida</strong><span>Sala ${saved.code} · jogador ${saved.seat} · rodada ${saved.round}</span></span>
    ${I.chevron}</button>`:''}

  ${installEvt?`<div class="install"><p>Coloque o ito na tela inicial e abra como um app.</p><button class="btn brand" data-act="install">Instalar</button></div>`:''}

  <section class="panel">
    <h2>Criar sala</h2>
    <p class="lead">Escolha quantas pessoas vão jogar.</p>
    <div class="stepper">
      <button data-act="dec" aria-label="Menos" ${draftPlayers<=2?'disabled':''}>−</button>
      <div class="val"><strong id="np">${draftPlayers}</strong><span>jogadores</span></div>
      <button data-act="inc" aria-label="Mais" ${draftPlayers>=10?'disabled':''}>+</button>
    </div>
    <div class="cat-head"><span class="label">Categorias de tema</span>
      <button class="link-btn" data-act="allCats">${draftMask===ALL_MASK?'Limpar':'Todas'}</button></div>
    <div class="cats">${CATS.map((c,i)=>`<button class="cat ${draftMask&(1<<i)?'on':''}" data-act="toggleCat" data-v="${i}" aria-pressed="${!!(draftMask&(1<<i))}">${c.name}<small>${c.themes.length}</small></button>`).join('')}</div>
    <button class="btn brand" data-act="create" ${draftMask?'':'disabled'}>Criar sala</button>
  </section>

  <section class="panel">
    <h2>Entrar numa sala</h2>
    <p class="lead">Digite o código que recebeu.</p>
    <input id="code" class="field" placeholder="ABCD-4" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10" enterkeyhint="go">
    <p class="err" id="err"></p>
    <button class="btn" data-act="join">Entrar</button>
  </section>

  <div class="foot"><button data-act="rules">Como jogar</button>·<button data-act="hardUpdate">Atualizar app</button></div>`, false, keep);
  const input=$('#code'); input.value=typed;
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') act.join(); });
  input.addEventListener('input',()=>{ $('#err').textContent=''; });
}

function seatScreen(){
  setMeta(`Sala <b>${P.code}</b>`);
  let seats=''; for(let i=1;i<=P.n;i++) seats+=`<button data-act="seat" data-v="${i}">${i}</button>`;
  render(`
  <section class="panel room-code">
    <p class="eyebrow">Código da sala</p>
    <div class="code">${P.code}</div>
    <p class="room-cats">${catNames(P.mask)}</p>
    <div class="btn-row">
      <button class="btn soft" data-act="copy">${I.copy.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2"')}Copiar</button>
      <button class="btn brand" data-act="share">${I.share.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2"')}Convidar</button>
    </div>
  </section>
  <section class="panel">
    <h2>Quem é você?</h2>
    <p class="lead">Cada pessoa escolhe um número diferente. Combinem antes de começar.</p>
    <div class="seats">${seats}</div>
  </section>
  <button class="btn text" data-act="goHome">Voltar</button>`);
}

function hearts(){
  let h=''; for(let i=0;i<LIVES;i++) h+=I.heart.replace('<svg',`<svg class="${i<S.lives?'on':'off'}"`);
  return `<div class="lives" aria-label="${S.lives} vidas">${h}</div>`;
}
function levels(){
  let l=''; for(let i=1;i<=MAX_LEVEL;i++) l+=`<i class="${i<=S.level?'on':''}"></i>`;
  return `<span class="levels">${l}</span>`;
}

function game(){
  setMeta(`Sala <b>${S.code}</b> · jogador ${S.seat}`);
  const status=`<div class="statusbar">
    <span class="pill"><span class="k">Rodada</span>${S.round}</span>
    <span class="pill"><span class="k">Nível</span>${S.level}${levels()}</span>
    ${hearts()}</div>`;

  if(S.status==='won' || S.status==='lost'){
    const won=S.status==='won';
    render(`${status}<section class="panel end-state">
      <div class="badge">${won?I.trophy:I.broken}</div>
      <h2>${won?'Vocês venceram!':'Acabaram as vidas'}</h2>
      <p>${won?`Todos os ${MAX_LEVEL} níveis concluídos. Sintonia total.`:`Vocês chegaram ao nível ${S.level}. Bora tentar de novo?`}</p>
      <button class="btn brand" data-act="restart">Jogar de novo</button>
    </section>`);
    return;
  }

  const [title, low, high, ci]=theme(), mine=hands()[S.seat-1];
  const cards=mine.map(c=>`<button class="card ${peek?'up':''}" data-act="peek" aria-label="${peek?'Carta '+c:'Carta escondida'}">
      <span class="face back">${I.thread}</span>
      <span class="face front"><small class="tl">${c}</small><strong>${c}</strong><small class="br">${c}</small></span>
    </button>`).join('');

  render(`${status}
  <section class="panel theme">
    <div class="theme-top">
      <p class="eyebrow">Tema · ${CATS[ci].name}</p>
      ${canSpeak?`<button class="speak-btn" data-act="speak" aria-label="Ouvir o tema">${I.speaker}</button>`:''}
    </div>
    <h2>${title}</h2>
    <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
    <div class="scale-labels"><span>${low}</span><span>${high}</span></div>
    <div class="theme-actions"><button class="chip" data-act="skip">${I.shuffle}Trocar tema</button></div>
  </section>
  <div class="hand">${cards}</div>
  <p class="hint">${peek?'Toque para esconder':'Toque na carta para ver seu número'}</p>
  <button class="btn outline" data-act="reveal">${I.eye.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2"')}Conferir cartas de todos</button>
  <div class="dock"><div class="dock-inner">
    <p class="note">Todos apertam o mesmo botão ao fim da rodada</p>
    <div class="btn-row">
      <button class="btn soft" data-act="lose">${I.x}Erramos</button>
      <button class="btn ok" data-act="win">${I.check}Acertamos</button>
    </div>
  </div></div>`, true);
}

function next(){ S.round++; S.themePos++; peek=false; save(); game(); if(prefs.autoSpeak) speakTheme(); }

/* ---------- Menu ---------- */
function openMenu(){
  const inGame=!!S;
  const items=[];
  if(inGame){
    items.push(['share',I.share,'Convidar para a sala']);
    items.push(['reveal',I.eye,'Conferir cartas de todos']);
    items.push(['syncBox',I.sliders,'Corrigir rodada']);
    if(canSpeak) items.push(['toggleVoice', prefs.autoSpeak?I.speaker:I.mute, prefs.autoSpeak?'Leitura do tema: ligada':'Leitura do tema: desligada']);
    items.push('hr');
  }
  items.push(['rules',I.book,'Como jogar']);
  if(installEvt) items.push(['install',I.download,'Instalar app']);
  items.push(['hardUpdate',I.refresh,'Atualizar app']);
  if(inGame){ items.push('hr'); items.push(['leave',I.exit,'Sair da sala','danger']); }
  $('#menuList').innerHTML=items.map(it=>it==='hr'?'<hr>':`<button data-act="${it[0]}" class="${it[3]||''}">${it[1]}<span>${it[2]}</span></button>`).join('');
  $('#versionLabel').textContent=`ito v${VERSION}`;
  $('#menu').showModal();
}

/* ---------- Ações ---------- */
const act = {
  goHome(){ if(S){ return; } history.replaceState(null,'',location.pathname); home(); },
  openMenu,
  inc(){ draftPlayers=Math.min(10,draftPlayers+1); home(true); },
  dec(){ draftPlayers=Math.max(2,draftPlayers-1); home(true); },
  toggleCat(b){ draftMask^=(1<<+b.dataset.v); home(true); },
  allCats(){ draftMask = draftMask===ALL_MASK ? 0 : ALL_MASK; home(true); },
  create(){ if(!draftMask) return; P=newCode(draftPlayers, draftMask); history.replaceState(null,'','#'+P.code); seatScreen(); },
  speak(){ speakTheme(); },
  toggleVoice(){ prefs.autoSpeak=!prefs.autoSpeak; savePrefs(); toast(prefs.autoSpeak?'Leitura automática do tema ligada':'Leitura automática do tema desligada'); if(S && S.status==='play') game(); },
  join(){
    const p=parseCode($('#code').value);
    if(!p){ $('#err').textContent='Código inválido. Use o formato ABCD-4.'; return; }
    P=p; history.replaceState(null,'','#'+P.code); seatScreen();
  },
  resume(){ S=load(); if(!S) return home(); history.replaceState(null,'','#'+S.code); peek=false; game(); },
  seat(b){
    S={code:P.code,n:P.n,seat:+b.dataset.v,round:1,level:1,lives:LIVES,themePos:0,status:'play',v:1};
    peek=false; save(); game(); if(prefs.autoSpeak) speakTheme();
  },
  async copy(){
    const code=(S||P).code;
    try{ await navigator.clipboard.writeText(roomLink(code)); toast('Link da sala copiado'); }
    catch(e){ toast('Código: '+code); }
  },
  async share(){
    const code=(S||P).code, url=roomLink(code);
    if(navigator.share){
      try{ await navigator.share({title:'ito', text:`Bora jogar ito! Sala ${code}`, url}); }catch(e){}
      return;
    }
    act.copy();
  },
  peek(){
    peek=!peek;
    document.querySelectorAll('.card').forEach(c=>c.classList.toggle('up',peek));
    $('.hint').textContent=peek?'Toque para esconder':'Toque na carta para ver seu número';
  },
  async reveal(){
    const ok=await confirmBox('Mostrar todas as cartas?','Façam isso só depois de baixar as cartas, para conferir a ordem.','Mostrar');
    if(!ok) return;
    const list=hands().flatMap((c,p)=>c.map(v=>({v,p:p+1}))).sort((a,b)=>a.v-b.v);
    dialog({title:`Rodada ${S.round}`, body:`<ul class="thread-list">${list.map(x=>
      `<li class="${x.p===S.seat?'me':''}"><span>Jogador ${x.p}${x.p===S.seat?' (você)':''}</span><strong>${x.v}</strong></li>`).join('')}</ul>`,
      actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  win(){
    if(S.level>=MAX_LEVEL){ S.status='won'; save(); game(); return; }
    S.level++; toast(`Nível ${S.level}: ${S.level} cartas para cada`); next();
  },
  lose(){
    S.lives--;
    if(S.lives<=0){ S.lives=0; S.status='lost'; save(); game(); return; }
    toast(`${S.lives} ${S.lives===1?'vida restante':'vidas restantes'}`); next();
  },
  skip(){ S.themePos++; save(); game(); if(prefs.autoSpeak) speakTheme(); },
  restart(){ S.level=1; S.lives=LIVES; S.status='play'; next(); },
  async syncBox(){
    const v=await dialog({title:'Corrigir rodada', body:`<p>Alguém ficou com a rodada ou o tema diferente? Copie aqui os números do celular de outra pessoa.</p>
      <div class="grid2">
        <label>Rodada<input id="sr" type="number" inputmode="numeric" min="1" value="${S.round}"></label>
        <label>Nível<input id="sl" type="number" inputmode="numeric" min="1" max="${MAX_LEVEL}" value="${S.level}"></label>
        <label>Vidas<input id="sv" type="number" inputmode="numeric" min="1" max="${LIVES}" value="${S.lives||1}"></label>
        <label>Nº do tema<input id="st" type="number" inputmode="numeric" min="0" value="${S.themePos}"></label>
      </div>`, actions:[{label:'Cancelar',value:'no'},{label:'Aplicar',value:'ok',cls:'brand'}]});
    if(v!=='ok') return;
    const n=id=>parseInt($('#'+id).value,10)||0, clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
    S.round=clamp(n('sr'),1,99999); S.level=clamp(n('sl'),1,MAX_LEVEL); S.lives=clamp(n('sv'),1,LIVES); S.themePos=clamp(n('st'),0,99999);
    S.status='play'; peek=false; save(); game(); toast('Pronto, tudo certo');
  },
  rules(){
    dialog({title:'Como jogar', body:`
      <ol>
        <li>Cada pessoa recebe, em segredo, carta(s) de <b>1 a 100</b>.</li>
        <li>O app <b>lê o tema em voz alta</b> a cada rodada (dá para ouvir de novo no alto-falante do cartão ou desligar no menu).</li>
        <li>Pensem no <b>tema</b>. Cada um descreve sua carta com algo do tema, sem dizer o número. Ex.: no tema “Comidas”, quem tem 95 pode dizer “pizza”.</li>
        <li>Baixem as cartas em <b>ordem crescente</b>, uma por vez, falando o número em voz alta.</li>
        <li>Se alguém baixar uma carta maior que outra ainda na mão, vocês erraram.</li>
      </ol>
      <p>Nível 1 tem 1 carta para cada, o nível 2 tem 2 e o nível 3 tem 3. Vocês têm <b>${LIVES} vidas</b>. Passem do nível ${MAX_LEVEL} para vencer.</p>
      <p><b>Categorias:</b> quem cria a sala escolhe os assuntos dos temas.</p>
      <p><b>Fim da rodada:</b> todo mundo aperta o mesmo botão, Acertamos ou Erramos, para seguirem juntos.</p>`,
      actions:[{label:'Entendi',value:'ok',cls:'brand'}]});
  },
  async leave(){
    if(!await confirmBox('Sair da sala?','O progresso desta partida será apagado deste celular.','Sair')) return;
    S=null; clearSaved(); history.replaceState(null,'',location.pathname); home();
  },
  async install(){
    if(!installEvt) return;
    installEvt.prompt();
    try{ await installEvt.userChoice; }catch(e){}
    installEvt=null; if(!S && !P) home();
  },
  applyUpdate(){
    if(swReg && swReg.waiting) swReg.waiting.postMessage({type:'SKIP_WAITING'});
    else hardUpdate();
  },
  hardUpdate(){ hardUpdate(); }
};

/* ---------- Atualizar: limpa cache e recarrega ---------- */
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

window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; if(!S && !P) home(); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('ito instalado'); });

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
      navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(reloading) return; reloading=true; location.reload(); });
      setInterval(()=>swReg.update().catch(()=>{}), 30*60*1000);
    }catch(e){}
  });
}

/* ---------- Início ---------- */
(function start(){
  // remove o parâmetro usado para furar o cache
  if(location.search){ history.replaceState(null,'',location.pathname+location.hash); }
  const h=parseCode(decodeURIComponent(location.hash.slice(1))), saved=load();
  if(h && saved && saved.code===h.code){ S=saved; game(); }
  else if(h){ P=h; seatScreen(); }
  else home();
})();
