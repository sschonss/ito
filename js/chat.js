/* ito — Conversa da sala
   A mensagem vai direto para todo mundo (como a reação), para aparecer na hora.
   O anfitrião guarda só as últimas 50 e manda de novo para quem entra ou volta.
   Isso fica fora do estado assinado: o estado já viaja inteiro a cada mudança
   e é conferido a cada 2 s. O nome de quem fala sai do lugar na sala (o cid da
   conexão), nunca de um campo da mensagem. */
'use strict';
const CHAT_MAX=50, CHAT_LEN=200, CHAT_GAP=300, CHAT_BURST=8, CHAT_WINDOW=10000;
NET.chat=[];
let chatUnread=0, chatAsked=false, chatStash=null, chatPullPeer=null, chatPaintKey='', tvChatTimer=null;
const chatSeen=new Set(), chatRate=new Map();

function chatClean(raw){
  return String(raw==null?'':raw).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,CHAT_LEN);
}
function chatRoundOn(){
  const st=NET.st;
  return !!(st && st.phase==='play' && !st.roundOver);
}
/* Número solto de 1 a 100. "1º" (a ordem da turma) e 101, 2024 etc. passam. */
function chatLeaksNumber(text){
  const re=/(^|[^0-9A-Za-zÀ-ÿ])(\d+)(?![0-9A-Za-zÀ-ÿ])/g;
  let m;
  while((m=re.exec(text))){
    const raw=m[2], n=+raw;
    if(n<1 || n>100) continue;
    const after=text.charAt(m.index+m[1].length+raw.length);
    if(after==='º' || after==='°') continue;
    return true;
  }
  return false;
}
function chatNewId(){
  return (Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-6)).replace(/[^a-z0-9]/g,'').slice(0,32);
}
function chatRemember(id){
  chatSeen.add(id);
  if(chatSeen.size<=500) return;
  const keep=new Set(NET.chat.map(m=>m.id));
  for(const old of chatSeen){ if(chatSeen.size<=400) break; if(!keep.has(old)) chatSeen.delete(old); }
}
function chatRateOk(cid){
  const now=Date.now();
  const a=(chatRate.get(cid)||[]).filter(t=>now-t<CHAT_WINDOW);
  if((a.length && now-a[a.length-1]<CHAT_GAP) || a.length>=CHAT_BURST){ chatRate.set(cid,a); return false; }
  a.push(now); chatRate.set(cid,a); return true;
}
function chatPlayerOk(cid){
  const st=NET.st;
  if(!st || typeof cid!=='string') return false;
  if((st.banned||[]).includes(cid)) return false;
  return st.players.some(p=>p.cid===cid);
}
function rosterName(cid){
  const st=NET.st, p=st&&st.players.find(x=>x.cid===cid);
  if(!p) return '';
  return String(p.name||'').trim().slice(0,20) || `Jogador ${p.seat}`;
}
function chatLabel(m){
  if(m.cid===CID && !NET.spectator) return 'Você';
  return rosterName(m.cid) || m.name || 'Alguém';
}
function chatTime(at){
  try{ return new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; }
}
function chatTrim(){
  NET.chat.sort((a,b)=>a.at-b.at || (a.id<b.id?-1:a.id>b.id?1:0));
  if(NET.chat.length>CHAT_MAX) NET.chat.splice(0, NET.chat.length-CHAT_MAX);
}
function refreshChatBadge(){
  const b=$('#chatBadge'), fab=$('#chatFab'); if(!b||!fab) return;
  if(chatUnread>0){ b.hidden=false; b.textContent=chatUnread>9?'9+':String(chatUnread); fab.setAttribute('aria-label',`Conversa, ${chatUnread} sem ler`); }
  else { b.hidden=true; fab.setAttribute('aria-label','Conversa'); }
}
function chatSyncNote(){
  const note=$('#chatNote'); if(note) note.hidden=!chatRoundOn();
}
function paintChat(force){
  const d=$('#chat'), log=$('#chatLog');
  if(!d || !log || !d.open) return;
  const key=NET.chat.map(m=>m.id+'/'+chatLabel(m)).join('|');
  if(!force && key===chatPaintKey) return;
  chatPaintKey=key;
  const stick=log.scrollHeight-log.scrollTop-log.clientHeight<48, prev=log.scrollTop;
  log.replaceChildren();
  if(!NET.chat.length){
    const p=document.createElement('p'); p.className='chat-empty';
    p.textContent='Nenhuma mensagem ainda. Combina a ordem por aqui.';
    log.appendChild(p); return;
  }
  for(const m of NET.chat){
    const row=document.createElement('div');
    row.className='chat-msg'+(m.cid===CID && !NET.spectator?' mine':'');
    const meta=document.createElement('span'); meta.className='chat-meta';
    meta.textContent=chatLabel(m)+' · '+chatTime(m.at);
    const body=document.createElement('p'); body.textContent=m.text;
    row.append(meta, body); log.appendChild(row);
  }
  log.scrollTop=stick?log.scrollHeight:prev;
}
function showTvChat(m){
  if(!document.body.classList.contains('tv') || !m) return;
  const el=$('#tvChat'); if(!el) return;
  el.replaceChildren();
  const who=document.createElement('b'); who.textContent=chatLabel(m);
  const tx=document.createElement('span'); tx.textContent=m.text;
  el.append(who, document.createTextNode(' · '), tx);
  el.hidden=false;
  clearTimeout(tvChatTimer);
  tvChatTimer=setTimeout(()=>{ el.hidden=true; }, 6000);
}
function commitChat(entry, fromLog){
  if(chatSeen.has(entry.id)) return false;
  chatRemember(entry.id);
  NET.chat.push(entry);
  chatTrim();
  const open=$('#chat') && $('#chat').open;
  if(!fromLog && entry.cid!==CID && !open && !NET.spectator){
    chatUnread++; SFX.chat(); refreshChatBadge();
  }
  paintChat(false);
  if(!fromLog) showTvChat(entry);
  return true;
}
function receiveChat(m, peer){
  if(!m || typeof m.id!=='string' || !/^[a-z0-9]{6,32}$/.test(m.id) || typeof m.text!=='string') return;
  if(chatSeen.has(m.id)) return;
  const cid=NET.peers[peer];
  if(!chatPlayerOk(cid)) return;
  const text=chatClean(m.text);
  if(!text) return;
  if(chatRoundOn() && chatLeaksNumber(text)){ chatRemember(m.id); return; }
  if(!chatRateOk(cid)) return;
  const at=(typeof m.at==='number' && m.at>0 && m.at<Date.now()+60000) ? m.at : Date.now();
  commitChat({id:m.id, cid, text, at, name:rosterName(cid)}, false);
}
function ingestLog(item){
  if(!item || typeof item.id!=='string' || !/^[a-z0-9]{6,32}$/.test(item.id)) return false;
  if(chatSeen.has(item.id) || typeof item.text!=='string' || typeof item.cid!=='string' || !/^[a-z0-9]{1,80}$/.test(item.cid)) return false;
  const text=chatClean(item.text);
  if(!text) return false;
  const at=(typeof item.at==='number' && item.at>0 && item.at<Date.now()+60000) ? item.at : Date.now();
  return commitChat({id:item.id, cid:item.cid, text, at, name:String(item.name||'').trim().slice(0,20)}, true);
}
function applyChatLog(list){
  if(!Array.isArray(list)) return;
  let added=0;
  for(const item of list.slice(0,CHAT_MAX)) if(ingestLog(item)) added++;
  if(!added) return;
  const last=NET.chat[NET.chat.length-1];
  if(last && document.body.classList.contains('tv') && Date.now()-last.at<20000) showTvChat(last);
}
function receiveChatLog(m, peer){
  if(!m || !Array.isArray(m.log)) return;
  const from=NET.peers[peer], host=NET.st && NET.st.hostCid;
  /* chatPullPeer: a conexão de quem nos mandou um estado válido e de quem pedimos o histórico.
     Continua valendo se o dono reassumir antes da resposta chegar. */
  const trusted=(from && host && from===host) || (chatPullPeer && peer===chatPullPeer);
  if(trusted){ chatStash=null; chatPullPeer=null; applyChatLog(m.log); return; }
  if(from && host && from!==host){ if(chatStash && chatStash.peer===peer) chatStash=null; return; }
  chatStash={peer, log:m.log.slice(0,CHAT_MAX)};
}
function flushChatStash(){
  if(!chatStash || !NET.st) return;
  const from=NET.peers[chatStash.peer];
  if(!from) return;
  if(from!==NET.st.hostCid){ chatStash=null; return; }
  const log=chatStash.log; chatStash=null; applyChatLog(log);
}
function sendChatLog(peer){
  if(!isHostNow() || !NET.chat.length) return;
  sendTo(peer,{t:'chatlog', log:NET.chat.slice(-CHAT_MAX).map(m=>({id:m.id, cid:m.cid, text:m.text, at:m.at, name:m.name||rosterName(m.cid)}))});
}
function maybePullChat(peer){
  if(!peer || isHostNow() || chatAsked) return;
  chatAsked=true; chatPullPeer=peer;
  sendTo(peer,{t:'chatpull'});
}
function chatReset(){
  NET.chat=[]; chatUnread=0; chatAsked=false; chatStash=null; chatPullPeer=null; chatPaintKey='';
  chatSeen.clear(); chatRate.clear();
  clearTimeout(tvChatTimer); tvChatTimer=null;
  const d=$('#chat'); if(d && d.open) d.close();
  const tv=$('#tvChat'); if(tv){ tv.hidden=true; tv.replaceChildren(); }
  const w=$('#chatWarn'); if(w){ w.hidden=true; w.textContent=''; }
  const fab=$('#chatFab'); if(fab) fab.hidden=true;
  refreshChatBadge();
}
function chatOnScreen(){
  const on=!!(NET.role && !NET.spectator && NET.st);
  const fab=$('#chatFab'); if(fab) fab.hidden=!on;
  const d=$('#chat'); if(!on && d && d.open) d.close();
  refreshChatBadge(); chatSyncNote();
  if(on && d && d.open) paintChat(false);
  if(!document.body.classList.contains('tv')){ const el=$('#tvChat'); if(el) el.hidden=true; }
}
function chatWarn(msg){
  const w=$('#chatWarn');
  if(w){ w.hidden=!msg; w.textContent=msg||''; }
  if(msg) toast(msg);
}
function chatSend(){
  const inp=$('#chatInput'); if(!inp || NET.spectator || !NET.role || !NET.st) return;
  const text=chatClean(inp.value);
  if(!text){ inp.value=''; return; }
  if(!chatPlayerOk(CID)) return;
  if(chatRoundOn() && chatLeaksNumber(text)){ chatWarn('Sem números! 😉'); return; }
  if(!chatRateOk(CID)){ toast('Calma, um de cada vez'); return; }
  const id=chatNewId(), at=Date.now();
  commitChat({id, cid:CID, text, at, name:rosterName(CID)}, false);
  broadcast({t:'chat', id, text, at});
  inp.value=''; chatWarn('');
}
function chatToggle(){
  const d=$('#chat'); if(!d) return;
  if(d.open){ d.close(); return; }
  chatUnread=0; refreshChatBadge(); chatPaintKey='';
  d.showModal(); paintChat(true); chatSyncNote();
  const inp=$('#chatInput'); if(inp) inp.focus();
}
act.chatToggle=chatToggle;
const chatForm=$('#chatForm');
if(chatForm) chatForm.addEventListener('submit', e=>{ e.preventDefault(); chatSend(); });
const chatDialog=$('#chat');
if(chatDialog) chatDialog.addEventListener('click', e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
