/* ito — Telas da sala conectada: entrando, sala de espera, jogo */
'use strict';
function connecting(){
  setMeta(`Sala <b>${NET.code}</b>`);
  const stuck=NET.failed || NET.timedOut;
  render(`<section class="panel connect">
    ${stuck?`<div class="badge">${svgStroke(I.wifiOff)}</div>
      <h2>${NET.failed?'Sem internet':'Não achamos a sala ainda'}</h2>
      <p>${NET.failed?'Confira a conexão e tente de novo.':'Confira se quem criou a sala está com o ito aberto.'}</p>
      <div class="stack"><button class="btn brand" data-act="retry">Tentar de novo</button></div>`
    :`<div class="spinner"></div><h2>Entrando na sala…</h2><p>Sala ${NET.code}</p>`}
  </section>
  <button class="btn text" data-act="leave">Cancelar</button>`, false, true);
}
const banner=()=>`<div class="banner">${svgStroke(I.wifiOff)}<span>${esc(hostName())} (anfitrião) desconectou. Esperando voltar…</span></div>`;

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
      ${p.cid===CID?'<span class="tag">você</span>':''}${p.cid===st.hostCid?`<span class="tag host">${st.ownerCid&&st.hostCid!==st.ownerCid?'anfitrião provisório':'anfitrião'}</span>`:''}
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
  const online=true, hostGone=!hostAlive(), amHost=isHostNow(), hn=esc(hostName());
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
      <div class="stack">${amHost?'<button class="btn brand" data-act="restart">Jogar de novo</button>':`<button class="btn soft" disabled>Esperando ${hn} começar outra</button>`}
        <button class="btn soft" data-act="shareSummary">${svgStroke(I.share)}Compartilhar resumo</button>
        <button class="btn outline" data-act="leave">Sair</button></div>
    </section>${online?reactFab():''}`, false, online);
    return;
  }
  if(!S.seat){ render(`<section class="panel connect"><div class="spinner"></div><h2>Entrando na partida…</h2></section>`,false,true); return; }

  const [title,low,high,ci]=theme(), mine=deck()[S.seat-1];
  const iPlayed=S.table.some(t=>t.seat===S.seat);
  const canEditTheme=amHost && !S.table.length;
  const themeCard=`<section class="panel theme">
    <p class="eyebrow">${ci<0?'Tema da turma':'Tema · '+CATS[ci].name}</p>
    <h2>${esc(title)}</h2>
    <div class="scale"><span class="end">1</span><span class="bar"></span><span class="end">100</span></div>
    <div class="scale-labels"><span>${esc(low)}</span><span>${esc(high)}</span></div>
    ${canEditTheme && !S.vote?`<div class="theme-actions"><button class="chip" data-act="themeMenu">${svgStroke(I.shuffle)}Mudar tema</button></div>`:''}
  </section>${S.vote ? votePanel() : ''}`;
  const cardHtml=`<p class="whose">Sua carta, ${esc(nameOf(S.seat))}</p>
  <div class="hand"><button class="card ${peek||iPlayed?'up':''} ${iPlayed?'played':''}" data-act="peek" aria-label="${peek?'Sua carta: '+mine:'Carta escondida'}">
    <span class="face back">${I.thread}</span>
    <span class="face front"><small class="tl">${mine}</small><strong>${mine}</strong><small class="br">${mine}</small></span>
  </button></div>
  ${iPlayed?'<p class="hint">Sua carta está na mesa</p>':`<p class="hint">${peek?'Toque para esconder':'Toque na carta para ver seu número'}</p>`}`;

  // Mesa (modo conectado) — só o essencial à mostra
  const pending=planOrder(), hintOf=s=>S.hints[s]||'';
  const roundOk=S.roundOver && S.table.every(t=>t.ok);
  const anim=Date.now()<revealAnimUntil;
  const desc=descending(S);
  const tips=!ls.get('ito-tips',false) ? `<section class="panel tips">
    <p class="eyebrow">Como funciona</p>
    <ol><li><b>Toque na carta</b> para ver seu número.</li><li>Fale uma <b>dica</b> sobre o tema, sem dizer o número.</li>
    <li>Arrumem a <b>ordem da turma</b> na barra: em cima o extremo ${desc?'maior':'menor'} do tema, embaixo o ${desc?'menor':'maior'}.</li><li>Quando todos concordarem, ${amHost?'<b>você</b> (anfitrião) revela':`<b>${hn}</b> (anfitrião) revela`} as cartas.</li></ol>
    <button class="btn soft" data-act="tipsOk">Entendi</button></section>` : '';
  const hintRow=!iPlayed && !S.roundOver ? `<div class="hint-row"><input id="myHint" maxlength="30" placeholder="Sua dica (opcional)" value="${esc(drafts.hint&&drafts.hint.k===key?drafts.hint.v:hintOf(S.seat))}" autocomplete="off" enterkeyhint="send">
    <button data-act="saveHint">${hintOf(S.seat)?'Trocar':'Enviar'}</button></div>` : '';
  const table=S.table.length && !S.roundOver ? `<section class="panel table">
    <div class="row-between"><h2>Na mesa</h2><span class="count">${S.table.length} de ${S.table.length+pending.length}</span></div>
    <ol class="pile ${anim?'reveal-anim':''}">${S.table.map((t,i)=>`<li class="${t.ok?'':'bad'} ${t.seat===S.seat?'me':''} ${i>=revealFrom?'new':''}" style="--i:${Math.max(0,i-revealFrom)}"><strong>${t.card}</strong><span>${esc(nameOf(t.seat))}</span>${hintOf(t.seat)?`<i>“${esc(hintOf(t.seat))}”</i>`:''}${t.ok?'':'<em>fora do lugar</em>'}</li>`).join('')}</ol>
  </section>` : '';
  const order=!S.roundOver && pending.length ? `<section class="panel order">
    <div class="row-between"><h2>Ordem da turma</h2><span class="count">${pending.length} na mão</span></div>
    <p class="lead">Arrumem de cima para baixo. Qualquer um pode mexer; quando todos concordarem, ${amHost?'você revela':`${hn} revela`}.</p>
    ${orderScale(pending.map((s,i)=>`<li class="${s===S.seat?'me':''}">
      <span class="who"><b>${esc(nameOf(s))}</b>${hintOf(s)?`<i>“${esc(hintOf(s))}”</i>`:''}</span>
      <button class="row-btn" data-act="planMove" data-s="${s}" data-d="-1" ${i===0?'disabled':''} aria-label="Subir">${svgStroke(I.up)}</button>
      <button class="row-btn" data-act="planMove" data-s="${s}" data-d="1" ${i===pending.length-1?'disabled':''} aria-label="Descer">${svgStroke(I.down)}</button>
    </li>`).join(''))}
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
    ? (amHost ? `<button class="btn brand" data-act="next" ${wait||pending_next?'disabled':''}>${pending_next?'Indo…':wait?'Olhem o resultado…':last?'Ver placar final':'Próxima rodada'}</button>`
              : `<button class="btn soft" disabled>Esperando ${hn} ${last?'abrir o placar':'passar a rodada'}</button>`)
    : (amHost ? `<button class="btn brand" data-act="revealPlan">${svgStroke(I.eye)}${pending.length>1?'Revelar nessa ordem':'Revelar a última carta'}</button>`
              : `<button class="btn soft" disabled>Quando todos concordarem, ${hn} revela</button>`);
  render(`${hostGone?banner():''}${tips}${statusTop(score)}${S.roundOver?'':themeCard}${S.roundOver?'':cardHtml+hintRow}${result}${order}${table}${reactFab()}
    <div class="dock"><div class="dock-inner">${dock}</div></div>`, true, true);
  const hi=$('#myHint'); if(hi){ hi.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); act.saveHint(); } }); hi.addEventListener('input',()=>{ drafts.hint={k:key, v:hi.value}; }); }
  if(S.roundOver && Date.now()<nextReadyAt) setTimeout(()=>{ if(NET.st) showOnline(); }, nextReadyAt-Date.now()+30);

}
function statusTop(score){
  return `<div class="statusbar">
    <span class="pill"><span class="k">Rodada</span>${S.round}<span class="k">de ${S.rounds}</span></span>
    <span class="pill score-pill" aria-label="Rodadas certas: ${score}">${I.check}${score}</span>
  </div>${progress()}`;
}
function isActiveSeat(seat){
  const st=NET.st; if(!st) return true;
  const p=st.players.find(p=>p.seat===seat); if(!p) return false;
  return NET.role==='host' ? p.on : (p.on || aliveCids().has(p.cid));
}
