/* ito — Régua da revelação e modo telão */
'use strict';
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
  const said=items.map(it=>`<li>${it.card}: ${esc(it.name)}${it.order?`, ${it.order}ª jogada`:''}${it.hint?`, dica “${esc(it.hint)}”`:''}${it.ok===false?', fora do lugar':it.gone?', não jogou':''}</li>`).join('');
  return `<div class="ruler-wrap">
    ${o.low?`<p class="r-cap">1 = ${esc(o.low)}</p>`:''}
    <ol class="sr-only" aria-label="Cartas da menor para a maior">${said}</ol>
    <div class="ruler ${o.anim?'anim':''}" aria-hidden="true" style="height:${H}px;--ax:${AX}px;--lx:${LX}px">
      <div class="r-axis"></div><span class="r-end" style="top:${pad}px">1</span><span class="r-end" style="top:${H-pad}px">100</span>
      <svg class="r-lines" width="${LX}" height="${H}">${lines}</svg>
      ${items.map(it=>`<div class="r-dot ${it.ok===false?'bad':''} ${it.gone?'gone':''} ${it.me?'me':''}" style="top:${it.y}px;--i:${it.seq||0}"></div>
        <div class="r-label ${it.ok===false?'bad':''} ${it.gone?'gone':''} ${it.me?'me':''}" style="top:${it.ly}px;--i:${it.seq||0}">
          <b>${it.card}</b><span class="r-name">${esc(it.name)}${it.order?` <small>${it.order}º</small>`:''}</span>${it.hint?`<i>“${esc(it.hint)}”</i>`:''}${it.ok===false?'<em>fora do lugar</em>':it.gone?'<em>saiu</em>':''}
        </div>`).join('')}
    </div>
    ${o.high?`<p class="r-cap">100 = ${esc(o.high)}</p>`:''}
    ${items.some(it=>it.order)?`<p class="r-legend">${descending(S)?'A régua vai do 1 ao 100. Quem estava no alto da barra jogou primeiro.':'As cartas estão pelo número. O 1º, 2º, 3º é a ordem que a turma montou.'}</p>`:''}
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
      ${pending.length&&!S.roundOver?`<h3>Ordem da turma</h3>${orderScale(pending.map(s=>`<li><span class="who"><b>${esc(nameOf(s))}</b>${hintOf(s)?`<i>“${esc(hintOf(s))}”</i>`:'<i class="none">pensando…</i>'}</span></li>`).join(''),'tv')}`:''}
    </section>
  </div>`, false, true);
}
