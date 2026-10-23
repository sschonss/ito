/* ito — Efeitos, ordem combinada, votação, destaques e imagem do resumo */
'use strict';
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
  pop:()=>tone([[880,0,.05,'sine',.06]]),
  chat:()=>tone([[740,0,.04,'sine',.035],[988,.045,.055,'sine',.02]])
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
/* Extremos da barra. Em cima é quem joga primeiro. Tema da turma sem extremos
   (campos vazios, ou o placeholder pouco/muito) cai em maior / menor. */
function orderEnds(){
  const [,low,high,ci]=theme();
  let lo=String(low==null?'':low).trim(), hi=String(high==null?'':high).trim();
  if(ci<0 && lo==='pouco' && hi==='muito'){ lo=''; hi=''; }
  if(!lo) lo='menor';
  if(!hi) hi='maior';
  return descending(S) ? {top:hi, bot:lo, topN:'100', botN:'1'} : {top:lo, bot:hi, topN:'1', botN:'100'};
}
function orderScale(rows, cls){
  const e=orderEnds(), extra=cls?` ${cls}`:'';
  return `<div class="order-scale${extra}">
    <div class="order-end top"><b>${esc(e.top)}</b><span>${e.topN}</span></div>
    <ul class="order-list${cls==='tv'?' tv':''}" aria-label="Ordem, de ${esc(e.top)} até ${esc(e.bot)}">${rows}</ul>
    <div class="order-end bot"><b>${esc(e.bot)}</b><span>${e.botN}</span></div>
  </div>`;
}
function votePanel(){
  const v=S.vote, mine=v.votes[CID], c=[0,0]; Object.values(v.votes).forEach(i=>c[i]++);
  const total=S.players.filter(p=>p.on).length;
  return `<section class="panel vote">
    <div class="row-between"><h2>Qual tema?</h2><span class="count">${c[0]+c[1]} de ${total} votaram</span></div>
    ${v.opts.map((pos,i)=>{ const t=themeAt(S,pos); return `<button class="vote-opt ${mine===i?'on':''}" data-act="vote" data-i="${i}" ${NET.spectator?'disabled':''}>
      <span><strong>${esc(t[0])}</strong><small>1 = ${esc(t[1])} · 100 = ${esc(t[2])}</small></span><em>${c[i]}</em></button>`; }).join('')}
    <p class="vote-who">${S.players.filter(p=>p.on).map(p=>`<span class="${p.cid in v.votes?'done':''}">${esc(p.name||'Jogador '+p.seat)}${p.cid in v.votes?' ✓':''}</span>`).join('')}</p>
    <p class="vote-note">Quando todos votarem, o tema muda sozinho. Empate é decidido no sorteio.</p>
    ${isHostNow()?'<button class="link-btn" data-act="voteEnd">Encerrar votação agora</button>':''}
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
  const bad=logs.flatMap(l=>{ const sorted=l.plays.map(p=>p.card).sort((a,b)=>descending(S)?b-a:a-b);
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
  if(S.mode!=='online' && S.mode!=='pass') return '';
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
  const hl=(S.mode==='online'||S.mode==='pass')?highlights(S.game).slice(0,3):[];
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
