/* ito — Jogar num celular só */
'use strict';
/* ======================================================================
   Jogar num celular só (passa e joga): um aparelho, sem internet.
   O celular passa de mão em mão; cada um vê a própria carta com a tela
   escondida dos outros. Depois o celular fica na mesa para a ordem.
   ====================================================================== */
const PASS_KEY='ito-pass';
let passNames=ls.get('ito-pass-names',['','','']);
const savePass=()=>ls.set(PASS_KEY,S);
const passName=i=>(S.names[i-1]||'').trim()||`Jogador ${i}`;

function passSetup(keep){
  S=null; P=null; setMeta('Num celular só'); document.body.classList.remove('tv');
  const typed=keep?[...document.querySelectorAll('.pass-name')].map(i=>i.value):null;
  if(typed) passNames=typed;
  render(`
  <section class="hero small">
    <p class="eyebrow">Num celular só</p>
    <h1>Passa e joga.</h1>
    <p>Um celular passa de mão em mão. Cada um vê a própria carta sem os outros verem. Funciona sem internet.</p>
  </section>
  <section class="panel">
    <h2>Quem vai jogar?</h2>
    <p class="lead">Na ordem em que vão passar o celular.</p>
    <div class="name-list">${passNames.map((n,i)=>`<div class="name-line"><span class="num">${i+1}</span>
      <input class="name-input pass-name" data-i="${i}" maxlength="20" placeholder="Jogador ${i+1}" value="${esc(n)}" autocomplete="off" enterkeyhint="next">
      ${passNames.length>2?`<button class="row-btn" data-act="passDelName" data-i="${i}" aria-label="Tirar">${I.x}</button>`:''}</div>`).join('')}</div>
    ${passNames.length<10?`<button class="btn outline add-name" data-act="passAddName">+ Adicionar jogador</button>`:''}
  </section>
  <section class="panel">
    <div class="field-group"><span class="label">Rodadas</span>${stepper('rounds',draft.rounds,MIN_ROUNDS,MAX_ROUNDS,draft.rounds===1?'rodada':'rodadas')}</div>
    <div class="field-group">
      <div class="cat-head"><span class="label">Categorias de tema</span><button class="link-btn" data-act="allCats">${draft.mask===ALL_MASK?'Limpar':'Todas'}</button></div>
      ${catChips()}
    </div>
    <button class="btn brand" data-act="passStart" ${draft.mask?'':'disabled'}>Começar</button>
  </section>
  <button class="btn text" data-act="passQuit">Voltar</button>`, false, keep);
  view.querySelectorAll('.pass-name').forEach(el=>{
    el.addEventListener('input',()=>{ passNames[+el.dataset.i]=el.value; ls.set('ito-pass-names',passNames); });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const nx=view.querySelector(`.pass-name[data-i="${+el.dataset.i+1}"]`); nx?nx.focus():el.blur(); } });
  });
}

function passRender(){
  if(!S || S.mode!=='pass') return home();
  setMeta(`Num celular só · rodada ${Math.min(S.round,S.rounds)} de ${S.rounds}`);
  if(S.phase==='deal') return passDeal();
  if(S.phase==='table') return passTable();
  if(S.phase==='reveal') return passReveal();
  if(S.phase==='done') return passDone();
}
function themeBox(actions){
  const [title,low,high,ci]=theme();
  return `<section class="panel theme">
    <p class="eyebrow">${ci<0?'Tema da turma':'Tema · '+CATS[ci].name}</p>
    <h2>${esc(title)}</h2>
    <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
    <div class="scale-labels"><span>${esc(low)}</span><span>${esc(high)}</span></div>
    ${actions?`<div class="theme-actions"><button class="chip" data-act="passThemeMenu">${svgStroke(I.shuffle)}Mudar tema</button></div>`:''}
  </section>`;
}
function passDeal(){
  const i=S.dealIdx, who=passName(i), mine=deck()[i-1];
  const score=S.results.filter(x=>x===1).length;
  if(!S.showing){
    render(`${statusTop(score)}
    <section class="panel pass-hand">
      <p class="eyebrow">${i} de ${S.n}</p>
      <div class="pass-avatar">${esc(who.slice(0,1).toUpperCase())}</div>
      <h2>Passe o celular para<br><b>${esc(who)}</b></h2>
      <p class="muted">Os outros não olham a tela.</p>
      <button class="btn brand big" data-act="passShow">Sou ${esc(who)}, ver minha carta</button>
    </section>
    ${i===1?themeBox(true):''}`);
    return;
  }
  const h=(S.hints||{})[i]||'';
  render(`${themeBox(false)}
  <p class="whose">Sua carta, ${esc(who)}</p>
  <div class="hand"><div class="card up" role="img" aria-label="Sua carta: ${mine}"><span class="face back" aria-hidden="true">${I.thread}</span>
    <span class="face front"><small class="tl">${mine}</small><strong>${mine}</strong><small class="br">${mine}</small></span></div></div>
  <div class="hint-row"><input id="passHint" maxlength="30" placeholder="Sua dica (opcional)" value="${esc(h)}" autocomplete="off" enterkeyhint="done"></div>
  <div class="dock"><div class="dock-inner">
    <button class="btn brand" data-act="passHide">${i<S.n?`Esconder e passar para ${esc(passName(i+1))}`:'Esconder e ir para a mesa'}</button>
  </div></div>`, true);
}
function passOrder(){
  const all=[...Array(S.n)].map((_,i)=>i+1);
  const plan=(S.plan||[]).filter(s=>all.includes(s));
  return plan.concat(all.filter(s=>!plan.includes(s)));
}
function passTable(){
  const order=passOrder(), hintOf=s=>(S.hints||{})[s]||'', score=S.results.filter(x=>x===1).length;
  render(`${statusTop(score)}${themeBox(true)}
  <section class="panel order">
    <div class="row-between"><h2>Ordem da turma</h2><span class="count">${S.n} jogadores</span></div>
    <p class="lead">Falem as dicas e arrumem de cima para baixo.</p>
    ${orderScale(order.map((s,i)=>`<li>
      <span class="who"><b>${esc(passName(s))}</b>${hintOf(s)?`<i>“${esc(hintOf(s))}”</i>`:''}</span>
      <button class="row-btn" data-act="passMove" data-s="${s}" data-d="-1" ${i===0?'disabled':''} aria-label="Subir">${svgStroke(I.up)}</button>
      <button class="row-btn" data-act="passMove" data-s="${s}" data-d="1" ${i===order.length-1?'disabled':''} aria-label="Descer">${svgStroke(I.down)}</button>
    </li>`).join(''))}
    <button class="link-btn solo" data-act="passPeekAgain">Esqueceu o número? Ver minha carta de novo</button>
  </section>
  <div class="dock"><div class="dock-inner"><button class="btn brand" data-act="passReveal">${svgStroke(I.eye)}Revelar nessa ordem</button></div></div>`, true, true);
}
function passReveal(){
  const [title]=theme(), ok=S.table.every(t=>t.ok), score=S.results.filter(x=>x===1).length, last=S.results.length>=S.rounds;
  const key=S.code+'|'+S.game+'|'+S.round;
  if(nextReadyKey!==key){ nextReadyKey=key; nextReadyAt=Math.max(Date.now(), revealAnimUntil)+1500; }
  const wait=Date.now()<nextReadyAt;
  render(`${statusTop(score)}
  <section class="panel reveal-panel">
    <p class="eyebrow">Tema</p><h2 class="rp-title">${esc(title)}</h2>
    <div class="result ${ok?'good':'bad'}">${ok?I.check:I.x}<span>${ok?'Ordem perfeita! Rodada certa.':'Teve carta fora da ordem.'}</span></div>
    ${roundRuler()}
  </section>
  <div class="dock"><div class="dock-inner"><button class="btn brand" data-act="passNext" ${wait?'disabled':''}>${wait?'Olhem o resultado…':last?'Ver placar final':'Próxima rodada'}</button></div></div>`, true, true);
  if(wait) setTimeout(()=>{ if(S && S.mode==='pass' && S.phase==='reveal') passReveal(); }, nextReadyAt-Date.now()+30);
}
function passDone(){
  const score=S.results.filter(x=>x===1).length, total=S.rounds, pct=score/total;
  const [title,msg]=pct===1?['Sintonia perfeita!','Vocês acertaram todas as rodadas.']:pct>=.5?['Mandaram bem!','Boa leitura de tema, turma.']:['Quase lá!','Bora mais uma partida?'];
  const l=(S.log||[]).filter(x=>x.game===S.game).slice(-1)[0];
  render(`<section class="panel end-state">
    <div class="badge">${pct>=.5?I.trophy:I.broken}</div>
    <p class="eyebrow">Fim de jogo</p>
    <h2>${title}</h2>
    <div class="score"><strong>${score}</strong><span>de ${total} ${total===1?'rodada certa':'rodadas certas'}</span></div>
    <p>${msg}</p>
    ${progress()}
    ${l?`<details class="last-round"><summary>Ver a última rodada · ${esc(l.title)}</summary>${logRuler(l)}</details>`:''}
    ${highlightsHtml()}
    ${historyList()}
    <div class="stack"><button class="btn brand" data-act="passRestart">Jogar de novo</button>
      <button class="btn soft" data-act="shareSummary">${svgStroke(I.share)}Compartilhar resumo</button>
      <button class="btn outline" data-act="passQuit">Sair</button></div>
  </section>`);
}
function passNewRound(){
  S.phase='deal'; S.dealIdx=1; S.showing=false; S.table=[]; S.roundOver=false; S.hints={}; S.plan=[]; S.custom=null;
}
Object.assign(act,{
  passSetup(){ passSetup(); },
  passResume(){ const p=ls.get(PASS_KEY,null); if(!p) return home(); S=p; passRender(); },
  passAddName(){ if(passNames.length<10){ passNames.push(''); ls.set('ito-pass-names',passNames); passSetup(true); const l=view.querySelectorAll('.pass-name'); l[l.length-1].focus(); } },
  passDelName(b){ passNames.splice(+b.dataset.i,1); ls.set('ito-pass-names',passNames); passSetup(true); },
  passStart(){
    if(!draft.mask) return;
    let names=[...document.querySelectorAll('.pass-name')].map(i=>i.value.trim().slice(0,20));
    if(names.filter(Boolean).length>=2) names=names.filter(Boolean);   // linhas em branco não contam
    if(names.length<2){ toast('Coloque pelo menos 2 jogadores'); return; }
    const v=new Uint32Array(4); crypto.getRandomValues(v);
    netReset(); ls.del(ONLINE_KEY);
    S={ mode:'pass', code:[...v].map(x=>L24[x%24]).join('')+'-'+enc(Math.max(2,names.length),draft.rounds,draft.mask), rounds:draft.rounds, mask:draft.mask,
        names, n:names.length, seat:0, game:1, round:1, results:[], themePos:0, themeFloor:0, history:[], log:[], status:'play', orderDir:'desc' };
    passNewRound(); savePass(); history.replaceState(null,'',location.pathname); passRender();
  },
  passShow(){ S.showing=true; savePass(); passDeal(); vibrate(20); },
  passHide(){
    const h=$('#passHint'); if(h){ const t=h.value.trim().slice(0,30); S.hints=S.hints||{}; if(t) S.hints[S.dealIdx]=t; else delete S.hints[S.dealIdx]; }
    S.showing=false;
    if(S.dealIdx<S.n){ S.dealIdx++; } else { S.phase='table'; }
    savePass(); passRender(); window.scrollTo({top:0});
  },
  passMove(b){ const o=passOrder(), seat=+b.dataset.s, i=o.indexOf(seat), j=i+(+b.dataset.d); if(i<0||j<0||j>=o.length) return; [o[i],o[j]]=[o[j],o[i]]; S.plan=o; savePass(); passTable(); },
  async passPeekAgain(){
    const who=await dialog({title:'De quem é a carta?', body:'<p>Escolha seu nome. Os outros não olham.</p>',
      actions:[...Array(S.n)].map((_,i)=>({label:esc(passName(i+1)), value:String(i+1)})).concat({label:'Cancelar',value:'no',cls:'text'})});
    const i=+who; if(!i) return;
    const c=deck()[i-1];
    dialog({title:passName(i), body:`<div class="peek-big">${c}</div><p class="center">Memorize e feche antes de devolver o celular.</p>`, actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  async passThemeMenu(){
    const v=await dialog({title:'Mudar tema', body:'', actions:[
      {label:svgStroke(I.shuffle)+'Trocar por outro tema', value:'skip'},
      {label:svgStroke(I.vote)+'Escolher entre dois temas', value:'two'},
      {label:svgStroke(I.pencil)+'Escrever o nosso tema', value:'custom'},
      {label:'Cancelar', value:'no', cls:'text'}]});
    if(v==='skip'){ S.themePos=nextThemePos(S); S.custom=null; }
    else if(v==='two'){
      const p0=nextThemePos(S), a=themeAt(S,p0), b=themeAt(S,p0+1);
      const c=await dialog({title:'Qual tema?', body:'<p>Decidam juntos.</p>', actions:[{label:esc(a[0]),value:'0'},{label:esc(b[0]),value:'1'},{label:'Cancelar',value:'no',cls:'text'}]});
      if(c==='0'||c==='1'){ S.themePos=p0+(+c); S.themeFloor=Math.max(S.themeFloor||0,p0+1); S.custom=null; }
    } else if(v==='custom'){
      const r=await dialog({title:'Escrever tema', body:`<label class="fld">Tema<input id="ctTitle" maxlength="60" placeholder="Ex.: Coisas que o tio fala no churrasco"></label>
        <div class="grid2"><label>1 é…<input id="ctLow" maxlength="30" placeholder="pouco"></label><label>100 é…<input id="ctHigh" maxlength="30" placeholder="muito"></label></div>`,
        actions:[{label:'Cancelar',value:'no'},{label:'Usar tema',value:'ok',cls:'brand'}]});
      const t=r==='ok' && $('#ctTitle').value.trim();
      if(t) S.custom={title:t.slice(0,60), low:$('#ctLow').value.trim()||'pouco', high:$('#ctHigh').value.trim()||'muito'};
    }
    savePass(); passRender();
  },
  async passReveal(){
    const o=passOrder();
    if(!await confirmBox('Todos concordam com a ordem?', `${orderScale(o.map(s=>`<li>${esc(passName(s))}${(S.hints||{})[s]?` · “${esc(S.hints[s])}”`:''}</li>`).join(''),'confirm')}<p>As cartas vão virar de cima para baixo.</p>`, 'Revelar')) return;
    const d=deck();
    S.table=o.map(seat=>({seat, card:d[seat-1], ok:true}));
    finishRound(S, o);
    S.phase='reveal'; savePass();
    revealFrom=0; revealAnimUntil=Date.now()+S.table.length*450+900; rulerAnimKey='';
    S.table.forEach((t,i)=>setTimeout(()=>{ t.ok?SFX.card():(SFX.bad(),vibrate(80)); }, i*450+150));
    const okAll=S.table.every(t=>t.ok);
    setTimeout(()=>{ if(okAll){ SFX.good(); confetti(); } }, S.table.length*450+400);
    passReveal();
  },
  passNext(){
    if(Date.now()<nextReadyAt) return;
    if(S.results.length>=S.rounds){
      S.phase='done'; S.status='done';
      S.history=(S.history||[]).concat({game:S.game, score:S.results.filter(x=>x===1).length, total:S.rounds});
      const pct=S.results.filter(x=>x===1).length/S.rounds; if(pct>=.5){ SFX.win(); confetti(); }
    } else { S.round++; S.themePos=nextThemePos(S); passNewRound(); }
    savePass(); passRender(); window.scrollTo({top:0});
  },
  passRestart(){ S.orderDir='desc'; S.game++; S.round=1; S.results=[]; S.status='play'; S.log=[]; S.themePos=nextThemePos(S); passNewRound(); savePass(); passRender(); },
  async passQuit(){
    if(S && S.mode==='pass' && S.phase!=='done' && !await confirmBox('Sair da partida?','O progresso desta partida será apagado.','Sair')) return;
    ls.del(PASS_KEY); S=null; history.replaceState(null,'',location.pathname); home();
  }
});
