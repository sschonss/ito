/* ito — Regras (aplicadas pelo anfitrião) e início da sala */
'use strict';
/* ---------- Regras (só quem é anfitrião aplica) ---------- */
function setEv(st,k,by,extra){ st.ev=Object.assign({k, cid:by?by.cid:'', by:by?(by.name||`Jogador ${by.seat}`):'', id:Math.random().toString(36).slice(2)}, extra||{}); }
const activeSeats=st=>st.players.filter(p=>p.on).map(p=>p.seat);
function checkRoundOver(st){
  if(st.phase!=='play' || st.roundOver || !st.table.length) return;
  const played=new Set(st.table.map(t=>t.seat));
  if(activeSeats(st).every(s=>played.has(s))) finishRound(st, st.players.map(p=>p.seat));
}
/* Fim de rodada — a mesma regra para a sala conectada e para o celular só.
   Marca quem ficou fora do lugar, soma o resultado e guarda o registro da rodada.
   O registro guarda só a partida atual, para o estado não crescer a noite toda. */
function finishRound(st, seats){
  const played=new Set(st.table.map(t=>t.seat)), d=deckFor(st.code,st.game,st.round), hints=st.hints||{};
  st.roundOver=true;
  markOutOfPlace(st.table);
  st.results.push(st.table.every(t=>t.ok)?1:0);
  const [title,low,high]=themeOf(st);
  st.log=(st.log||[]).filter(l=>l.game===st.game).concat({game:st.game, round:st.round, title, low, high,
    plays:st.table.map(t=>({seat:t.seat, card:t.card, ok:t.ok, hint:hints[t.seat]||''})),
    held:seats.filter(s=>!played.has(s)).map(s=>({seat:s, card:d[s-1], hint:hints[s]||''}))});
  st.vote=null;
}
/* Ações que só o anfitrião pode fazer */
const HOST_ONLY=new Set(['start','reveal','next','restart','voteStart','voteEnd','skip','custom','kick','move']);
function applyAct(st, a, by){
  const isHost=by.cid===st.hostCid, fresh=a.game===st.game && a.round===st.round;
  if(HOST_ONLY.has(a.t) && !isHost) return false;
  if(a.t==='start' && st.phase==='lobby'){ st.phase='play'; setEv(st,'start',by); return true; }
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
    const p0=nextThemePos(st);
    st.vote={opts:[p0, p0+1], votes:{}};
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
    } else { st.round++; st.themePos=nextThemePos(st); st.table=[]; st.roundOver=false; st.custom=null; }
    st.hints={}; st.vote=null; st.plan=[];
    setEv(st,'next',by); return true;
  }
  if(a.t==='skip' && st.phase==='play' && a.themePos===st.themePos && !st.table.length){ st.themePos=nextThemePos(st); st.custom=null; st.vote=null; setEv(st,'skip',by); return true; }
  if(a.t==='custom' && st.phase==='play' && fresh && !st.table.length && a.title){
    st.custom={title:String(a.title).slice(0,60), low:String(a.low||'pouco').slice(0,30), high:String(a.high||'muito').slice(0,30)}; st.vote=null;
    setEv(st,'custom',by); return true;
  }
  if(a.t==='restart' && st.phase==='done' && a.game===st.game){
    st.game++; st.round=1; st.results=[]; st.themePos=nextThemePos(st); st.table=[]; st.roundOver=false; st.custom=null; st.phase='play'; st.hints={}; st.vote=null; st.plan=[]; st.log=[];
    setEv(st,'restart',by); return true;
  }
  if(st.phase==='lobby' && (a.t==='kick' || a.t==='move')){
    const i=st.players.findIndex(p=>p.cid===a.cid); if(i<0) return false;
    if(a.t==='kick'){ if(a.cid===by.cid) return false; st.banned=(st.banned||[]).concat(a.cid); st.players.splice(i,1); }
    else { const j=i+(a.dir<0?-1:1); if(j<0||j>=st.players.length) return false; [st.players[i],st.players[j]]=[st.players[j],st.players[i]]; }
    st.players.forEach((p,k)=>p.seat=k+1);
    return true;
  }
  return false;
}
/* Marca como erradas só as cartas fora do lugar: mantém a maior sequência crescente.
   Se houver empate, mantém a que usa as cartas menores, ou seja, marca quem foi cedo demais
   (regra do ito: errou quem baixou enquanto alguém tinha carta menor). */
function markOutOfPlace(table){
  const a=table.map(t=>t.card), n=a.length;
  let best=null, bestLen=-1, bestSum=Infinity;
  for(let m=0;m<(1<<n);m++){
    let last=-1, len=0, sum=0, ok=true;
    for(let i=0;i<n;i++) if(m&(1<<i)){ if(a[i]<=last){ ok=false; break; } last=a[i]; len++; sum+=a[i]; }
    if(ok && (len>bestLen || (len===bestLen && sum<bestSum))){ best=m; bestLen=len; bestSum=sum; }
  }
  table.forEach((t,i)=>t.ok=!!(best&(1<<i)));
}
function playSeat(st, seat){
  const d=deckFor(st.code,st.game,st.round), card=d[seat-1], played=new Set(st.table.map(t=>t.seat));
  const ok=!activeSeats(st).some(s=>!played.has(s) && s!==seat && d[s-1]<card);
  const t={seat, card, ok}; st.table.push(t);
  return t;
}
function resolveVote(st, by){
  const v=st.vote, c=[0,0]; Object.values(v.votes).forEach(i=>c[i]++);
  st.vote=null;
  if(c[0]+c[1]===0){ setEv(st,'voteCancel',by); return; }
  const tie=c[0]===c[1];
  const w=tie ? (rng(st.code+'|vote|'+st.game+'|'+st.round+'|'+v.opts.join(','))()<.5?0:1) : (c[1]>c[0]?1:0);
  st.themePos=v.opts[w]; st.custom=null;
  st.themeFloor=Math.max(st.themeFloor||0, ...v.opts);   // as duas opções não voltam nas próximas rodadas
  setEv(st,'voted',by,{title:themeAt(st,st.themePos)[0], tie});
}
const nextThemePos=st=>Math.max(st.themePos, st.themeFloor||0)+1;
function hostCommit(){
  NET.st.ver=(NET.st.ver||0)+1;
  saveOnline(); showOnline();
  refreshSig().then(ok=>{ if(ok || !KEYS.ok) broadcast(stateMsg()); });
}
function sendAct(t, extra){
  const a=Object.assign({t, game:S.game, round:S.round, themePos:S.themePos}, extra||{});
  if(NET.reclaiming){ toast('Voltando como anfitrião… só um instante'); return; }
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
  if(saved){ NET.reclaiming=true; NET.reclaimTimer=setTimeout(finishReclaim, RECLAIM_WAIT); }   // dono voltando
  NET.st=saved || { code:room.code, rounds:room.rounds, mask:room.mask, hostCid:CID, ownerCid:CID, ver:1,
    players:[{seat:1, cid:CID, name:myName, on:true}], banned:[], phase:'lobby',
    game:1, round:1, results:[], themePos:0, table:[], roundOver:false, custom:null, history:[], ev:null, hints:{}, log:[], vote:null };
  NET.st.ownerCid=NET.st.ownerCid||CID;
  if(!NET.st.ownerPk && KEYS.ok) NET.st.ownerPk=KEYS.pk;
  { const me=NET.st.players.find(p=>p.cid===CID); if(me && KEYS.ok && !me.pk) me.pk=KEYS.pk; }
  NET.ownerFp=KEYS.fp; NET.pinOwnerPk=NET.st.ownerPk||null;
  refreshSig();
  if(!saved){ NET.st.players.forEach(p=>p.on=p.cid===CID); const me=NET.st.players.find(p=>p.cid===CID); if(me && myName) me.name=myName; }
  history.replaceState(null,'',roomHash(NET.st.code));
  saveOnline(); connect(NET.st.code);
}
function startGuest(room, saved, spectator){
  netReset(); NET.role='guest'; NET.spectator=!!spectator; lastEv=''; P=room;
  NET.pinFp=room.fp||null; NET.ownerFp=room.fp||'';
  if(saved){ NET.st=saved; if(saved.ownerPk) NET.pinOwnerPk=saved.ownerPk; }                  // última versão conhecida (ajuda se o anfitrião não voltar)
  history.replaceState(null,'',roomHash(room.code));
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
  chatOnScreen();
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
  if(ev.k==='newhost'){ toast(mine?'Você segura a partida até o anfitrião voltar':`${ev.by} segura a partida até o anfitrião voltar`); return; }
  if(ev.k==='hostBack'){ toast(mine?'Você voltou e é o anfitrião de novo':`${ev.by} voltou e é o anfitrião de novo`); return; }
  if(ev.k==='voted'){ SFX.pop(); toast(ev.tie?`Empate! Sorteado: ${ev.title}`:`Tema escolhido: ${ev.title}`); return; }
  if(ev.k==='voteCancel'){ toast('Votação cancelada, o tema continua o mesmo'); return; }
  if(ev.k==='next' && st.phase==='done'){
    const pct=st.results.filter(x=>x===1).length/st.rounds;
    vibrate([60,40,60]); if(pct>=.5){ SFX.win(); confetti(); }
  } else if(ev.k==='next' || ev.k==='restart' || ev.k==='start') vibrate(30);
  if(mine) return;
  const msg={start:'começou a partida', next:st.phase==='done'?'abriu o resultado':'passou para a próxima rodada', skip:'trocou o tema',
    custom:'escreveu um tema', restart:'começou outra partida', vote:'abriu uma votação de tema'}[ev.k];
  if(msg) toast(`${ev.by} ${msg}`);
}
