'use strict';
const VERSION = '1.1.0';
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

/* ---------- Estado ---------- */
let S = null;                 // partida atual
let P = null;                 // sala aberta, antes de escolher quem é você
const draft = { players:4, rounds:5, mask:ALL_MASK, names:[] };
let peek = false;
let installEvt = null;
let swReg = null;

const $ = s => document.querySelector(s);
const view = $('#view');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function save(){ try{ localStorage.setItem(STORE, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const v = JSON.parse(localStorage.getItem(STORE)); return v && v.code ? v : null; }catch(e){ return null; } }
function clearSaved(){ try{ localStorage.removeItem(STORE); }catch(e){} }

/* ---------- Sorteio igual em todos os celulares ---------- */
function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rng = s => mulberry(xmur3(s)());
function shuffle(arr, r){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

/* ---------- Código da sala: ABCD-EFGH
   ABCD = sorteio da sala · EFGH = jogadores, rodadas e categorias ---------- */
const L24 = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function enc(n, rounds, mask){
  let v = ((n-2)*MAX_ROUNDS + (rounds-1))*256 + mask, s='';
  for(let i=0;i<4;i++){ s = L24[v%24] + s; v = Math.floor(v/24); }
  return s;
}
function parseCode(raw){
  const s = (raw||'').trim().toUpperCase().replace(/[^A-Z]/g,'');
  if(s.length!==8 || [...s].some(c=>!L24.includes(c))) return null;
  let v=0; for(const c of s.slice(4)) v = v*24 + L24.indexOf(c);
  const mask = v%256; v = Math.floor(v/256);
  const rounds = v%MAX_ROUNDS + 1; const n = Math.floor(v/MAX_ROUNDS) + 2;
  if(n<2 || n>10 || !(mask & ALL_MASK)) return null;
  return { code: s.slice(0,4)+'-'+s.slice(4), n, rounds, mask: mask & ALL_MASK, names: [] };
}
function parseHash(h){
  const parts = h.replace(/^#/,'').split('~');
  const room = parseCode(decodeURIComponent(parts[0]||''));
  if(!room) return null;
  room.names = parts.slice(1, room.n+1).map(x=>{ try{ return decodeURIComponent(x).trim().slice(0,20); }catch(e){ return ''; } });
  return room;
}
function newRoom(){
  const v = new Uint32Array(4); crypto.getRandomValues(v);
  const room = parseCode([...v].map(x=>L24[x%24]).join('') + enc(draft.players, draft.rounds, draft.mask));
  room.names = draft.names.slice(0, draft.players).map(s=>(s||'').trim().slice(0,20));
  return room;
}
const roomHash = r => '#' + r.code + (r.names.some(Boolean) ? '~' + r.names.map(encodeURIComponent).join('~') : '');
const roomLink = r => location.origin + location.pathname + roomHash(r);
const nameOf = (r, p) => (r.names && r.names[p-1]) || `Jogador ${p}`;
const catNames = mask => mask===ALL_MASK ? 'Todas as categorias' : CATS.filter((_,i)=>mask&(1<<i)).map(c=>c.name).join(' · ');

function cards(){
  const deck = shuffle([...Array(100)].map((_,i)=>i+1), rng(S.code+'|'+S.game+'|'+S.round));
  return deck.slice(0, S.n);           // carta de cada jogador, na ordem 1..n
}
function theme(){
  const order = shuffle(THEMES.map((t,i)=>[t,i]).filter(([t])=>S.mask&(1<<t[3])).map(([,i])=>i), rng(S.code+'|themes'));
  return THEMES[order[S.themePos % order.length]];
}

/* ---------- Componentes ---------- */
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
const confirmBox = (title, body, ok='Confirmar') =>
  dialog({title, body:`<p>${body}</p>`, actions:[{label:'Cancelar',value:'no'},{label:ok,value:'ok',cls:'brand'}]}).then(v=>v==='ok');

function setMeta(html){ $('#appbarMeta').innerHTML = html||''; }
function render(html, dock, keep){
  view.className = 'view' + (keep ? '' : ' enter') + (dock ? ' has-dock' : '');
  view.innerHTML = html;
  if(!keep) window.scrollTo({top:0});
}
const stepper = (key, val, min, max, unit) => `<div class="stepper">
  <button data-act="step" data-k="${key}" data-d="-1" aria-label="Menos" ${val<=min?'disabled':''}>−</button>
  <div class="val"><strong>${val}</strong><span>${unit}</span></div>
  <button data-act="step" data-k="${key}" data-d="1" aria-label="Mais" ${val>=max?'disabled':''}>+</button></div>`;
const svgStroke = svg => svg.replace('<svg','<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');

/* ---------- Tela inicial ---------- */
function home(keep){
  const typed = keep && $('#code') ? $('#code').value : '';
  S=null; P=null; setMeta('');
  const saved=load();
  let nameFields=''; for(let i=0;i<draft.players;i++)
    nameFields+=`<input class="name-input" data-i="${i}" value="${esc(draft.names[i]||'')}" placeholder="Jogador ${i+1}" maxlength="20" autocomplete="off" enterkeyhint="next">`;

  render(`
  <section class="hero">
    <p class="eyebrow">Jogo cooperativo</p>
    <h1>Pense no número.<br><em>Fale o tema.</em></h1>
    <p>Junte a turma, cada um no seu celular, e descubram juntos a ordem das cartas.</p>
  </section>

  ${saved?`<button class="resume" data-act="resume">
    <span class="dot"></span>
    <span><strong>Continuar partida</strong><span>${esc(nameOf(saved,saved.seat))} · rodada ${Math.min(saved.round,saved.rounds)} de ${saved.rounds}</span></span>
    ${svgStroke(I.chevron)}</button>`:''}

  ${installEvt?`<div class="install"><p>Coloque o ito na tela inicial e abra como um app.</p><button class="btn brand" data-act="install">Instalar</button></div>`:''}

  <section class="panel">
    <h2>Criar sala</h2>
    <p class="lead">Escolha como vai ser a partida.</p>

    <div class="field-group">
      <span class="label">Jogadores</span>
      ${stepper('players', draft.players, 2, 10, draft.players===1?'jogador':'jogadores')}
      <details class="names" ${draft.names.some(Boolean)?'open':''}>
        <summary>Colocar nomes <span>opcional</span></summary>
        <div class="name-list">${nameFields}</div>
      </details>
    </div>

    <div class="field-group">
      <span class="label">Rodadas</span>
      ${stepper('rounds', draft.rounds, MIN_ROUNDS, MAX_ROUNDS, draft.rounds===1?'rodada':'rodadas')}
    </div>

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
    input.value = raw.length>4 ? raw.slice(0,4)+'-'+raw.slice(4) : raw;
  });
  view.querySelectorAll('.name-input').forEach(el=>{
    el.addEventListener('input',()=>{ draft.names[+el.dataset.i]=el.value; });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const nx=el.nextElementSibling; nx?nx.focus():el.blur(); } });
  });
  const det=view.querySelector('details.names');
  det && det.addEventListener('toggle',()=>{ if(det.open && !keep){ const f=det.querySelector('input'); f && f.focus(); } });
}

/* ---------- Escolher quem é você ---------- */
function seatScreen(){
  setMeta(`Sala <b>${P.code}</b>`);
  const hasNames=P.names.some(Boolean);
  let seats=''; for(let i=1;i<=P.n;i++){
    seats += hasNames
      ? `<button class="player" data-act="seat" data-v="${i}"><span class="num">${i}</span><span class="nm">${esc(nameOf(P,i))}</span>${svgStroke(I.chevron)}</button>`
      : `<button data-act="seat" data-v="${i}">${i}</button>`;
  }
  render(`
  <section class="panel room-code">
    <p class="eyebrow">Código da sala</p>
    <div class="code">${P.code}</div>
    <p class="room-info">${P.n} jogadores · ${P.rounds} ${P.rounds===1?'rodada':'rodadas'}<br>${catNames(P.mask)}</p>
    <div class="btn-row">
      <button class="btn soft" data-act="copy">${svgStroke(I.copy)}Copiar link</button>
      <button class="btn brand" data-act="share">${svgStroke(I.share)}Convidar</button>
    </div>
  </section>
  <section class="panel">
    <h2>Quem é você?</h2>
    <p class="lead">${hasNames?'Toque no seu nome.':'Cada pessoa escolhe um número diferente. Combinem antes de começar.'}</p>
    <div class="${hasNames?'players':'seats'}">${seats}</div>
  </section>
  <button class="btn text" data-act="goHome">Voltar</button>`);
}

/* ---------- Jogo ---------- */
function progress(){
  let d=''; for(let i=0;i<S.rounds;i++){
    const r=S.results[i];
    d+=`<i class="${r===1?'ok':r===0?'no':i===S.results.length?'now':''}"></i>`;
  }
  return `<div class="progress" aria-hidden="true">${d}</div>`;
}

function game(){
  setMeta(`<b>${esc(nameOf(S,S.seat))}</b> · ${S.code}`);
  const score = S.results.filter(x=>x===1).length;

  if(S.status==='done'){
    const total=S.rounds, pct=score/total;
    const [title,msg] = pct===1 ? ['Sintonia perfeita!','Vocês acertaram todas as rodadas.']
      : pct>=.5 ? ['Mandaram bem!','Boa leitura de tema, turma.'] : ['Quase lá!','Bora mais uma partida?'];
    render(`<section class="panel end-state">
      <div class="badge">${pct>=.5?I.trophy:I.broken}</div>
      <p class="eyebrow">Fim de jogo</p>
      <h2>${title}</h2>
      <div class="score"><strong>${score}</strong><span>de ${total}</span></div>
      <p>${msg}</p>
      ${progress()}
      <div class="stack">
        <button class="btn brand" data-act="restart">Jogar de novo</button>
        <button class="btn outline" data-act="leave">Nova sala</button>
      </div>
    </section>`);
    return;
  }

  const [title, low, high, ci]=theme(), mine=cards()[S.seat-1];
  render(`
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
  <div class="hand">
    <button class="card ${peek?'up':''}" data-act="peek" aria-label="${peek?'Sua carta: '+mine:'Carta escondida'}">
      <span class="face back">${I.thread}</span>
      <span class="face front"><small class="tl">${mine}</small><strong>${mine}</strong><small class="br">${mine}</small></span>
    </button>
  </div>
  <p class="hint">${peek?'Toque para esconder':'Toque na carta para ver seu número'}</p>
  <button class="btn outline" data-act="reveal">${svgStroke(I.eye)}Conferir cartas de todos</button>
  <div class="dock"><div class="dock-inner">
    <p class="note">Todos apertam o mesmo botão ao fim da rodada</p>
    <div class="btn-row">
      <button class="btn soft" data-act="lose">${I.x}Erramos</button>
      <button class="btn ok" data-act="win">${I.check}Acertamos</button>
    </div>
  </div></div>`, true);
}

function finishRound(ok){
  S.results.push(ok?1:0);
  peek=false;
  if(S.results.length>=S.rounds){ S.status='done'; save(); game(); return; }
  S.round++; S.themePos++; save(); game();
  toast(ok?'Boa! Próxima rodada':'Faz parte. Próxima rodada');
}

/* ---------- Menu ---------- */
function openMenu(){
  const inGame=!!S && S.status==='play', items=[];
  if(S){
    items.push(['share',I.share,'Convidar para a sala']);
    if(inGame){ items.push(['reveal',I.eye,'Conferir cartas de todos']); items.push(['syncBox',I.sliders,'Corrigir rodada']); }
    items.push('hr');
  }
  items.push(['rules',I.book,'Como jogar']);
  if(installEvt) items.push(['install',I.download,'Instalar app']);
  items.push(['hardUpdate',I.refresh,'Atualizar app']);
  if(S){ items.push('hr'); items.push(['leave',I.exit,'Sair da sala','danger']); }
  $('#menuList').innerHTML=items.map(it=>it==='hr'?'<hr>':`<button data-act="${it[0]}" class="${it[3]||''}">${it[1]}<span>${it[2]}</span></button>`).join('');
  $('#versionLabel').textContent=`ito v${VERSION}`;
  $('#menu').showModal();
}

/* ---------- Ações ---------- */
const act = {
  goHome(){ if(S) return; history.replaceState(null,'',location.pathname); home(); },
  openMenu,
  step(b){
    const k=b.dataset.k, d=+b.dataset.d;
    if(k==='players') draft.players=Math.min(10,Math.max(2,draft.players+d));
    if(k==='rounds') draft.rounds=Math.min(MAX_ROUNDS,Math.max(MIN_ROUNDS,draft.rounds+d));
    home(true);
  },
  toggleCat(b){ draft.mask^=(1<<+b.dataset.v); home(true); },
  allCats(){ draft.mask = draft.mask===ALL_MASK ? 0 : ALL_MASK; home(true); },
  create(){ if(!draft.mask) return; P=newRoom(); history.replaceState(null,'',roomHash(P)); seatScreen(); },
  join(){
    const p=parseCode($('#code').value);
    if(!p){ $('#err').textContent='Código não encontrado. Confira as 8 letras.'; return; }
    P=p; history.replaceState(null,'',roomHash(P)); seatScreen();
  },
  resume(){ S=load(); if(!S) return home(); history.replaceState(null,'',roomHash(S)); peek=false; game(); },
  seat(b){
    S={code:P.code, n:P.n, rounds:P.rounds, mask:P.mask, names:P.names, seat:+b.dataset.v,
       game:1, round:1, results:[], themePos:0, status:'play'};
    peek=false; save(); game();
  },
  async copy(){
    const r=S||P;
    try{ await navigator.clipboard.writeText(roomLink(r)); toast('Link copiado'); }
    catch(e){ toast('Código da sala: '+r.code); }
  },
  async share(){
    const r=S||P;
    if(navigator.share){
      try{ await navigator.share({title:'ito', text:`Bora jogar ito! Código da sala: ${r.code}`, url:roomLink(r)}); }catch(e){}
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
    if(!await confirmBox('Mostrar todas as cartas?','Façam isso só depois de baixar as cartas, para conferir a ordem.','Mostrar')) return;
    const list=cards().map((v,i)=>({v,p:i+1})).sort((a,b)=>a.v-b.v);
    dialog({title:`Rodada ${S.round}`, body:`<ul class="thread-list">${list.map(x=>
      `<li class="${x.p===S.seat?'me':''}"><span>${esc(nameOf(S,x.p))}${x.p===S.seat?' (você)':''}</span><strong>${x.v}</strong></li>`).join('')}</ul>`,
      actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  win(){ finishRound(true); },
  lose(){ finishRound(false); },
  skip(){ S.themePos++; save(); game(); },
  restart(){ S.game++; S.round=1; S.results=[]; S.themePos++; S.status='play'; peek=false; save(); game(); },
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
    S.themePos=clamp(n('st'),0,99999); S.game=clamp(n('sg'),1,99999);
    S.status='play'; peek=false; save(); game(); toast('Pronto, tudo certo');
  },
  rules(){
    dialog({title:'Como jogar', body:`
      <ol>
        <li>A cada rodada, cada pessoa recebe <b>uma carta</b> secreta de <b>1 a 100</b>.</li>
        <li>Leiam o <b>tema</b>. Cada um descreve sua carta com algo do tema, sem dizer o número. Ex.: no tema “Comidas”, quem tem 95 pode dizer “pizza”.</li>
        <li>Baixem as cartas em <b>ordem crescente</b>, uma por vez, falando o número em voz alta.</li>
        <li>Se a ordem saiu certinha, vocês acertaram. Se alguém baixou fora da ordem, erraram.</li>
      </ol>
      <p><b>Ao criar a sala</b>, escolha quantas rodadas querem jogar, os assuntos dos temas e, se quiser, o nome de cada pessoa.</p>
      <p><b>Fim da rodada:</b> todo mundo aperta o mesmo botão, Acertamos ou Erramos, para seguirem juntos. No final aparece o placar da turma.</p>`,
      actions:[{label:'Entendi',value:'ok',cls:'brand'}]});
  },
  async leave(){
    if(S && S.status==='play' && !await confirmBox('Sair da sala?','O progresso desta partida será apagado deste celular.','Sair')) return;
    S=null; clearSaved(); history.replaceState(null,'',location.pathname); home();
  },
  async install(){
    if(!installEvt) return;
    installEvt.prompt();
    try{ await installEvt.userChoice; }catch(e){}
    installEvt=null; if(!S && !P) home();
  },
  applyUpdate(){
    if(swReg && swReg.waiting){ window.__itoUpdating=true; swReg.waiting.postMessage({type:'SKIP_WAITING'}); }
    else hardUpdate();
  },
  hardUpdate(){ hardUpdate(); }
};

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

window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; if(!S && !P) home(true); });
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
      navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!window.__itoUpdating || reloading) return; reloading=true; location.reload(); });
      setInterval(()=>swReg.update().catch(()=>{}), 30*60*1000);
    }catch(e){}
  });
}

/* ---------- Início ---------- */
(function start(){
  if(location.search) history.replaceState(null,'',location.pathname+location.hash);
  const h=parseHash(location.hash), saved=load();
  if(h && saved && saved.code===h.code){ S=saved; game(); }
  else if(h){ P=h; seatScreen(); }
  else home();
})();
