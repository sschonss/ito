/* ito — Rede: conexão, anfitrião, conferência e reencaminhamento */
'use strict';
/* ======================================================================
   Duas redes de sinalização (Nostr e MQTT) e, por cima, uma malha:
   quem recebe um estado assinado mais novo repassa aos outros;
   o pedido de um jogador, assinado por ele, chega ao anfitrião
   mesmo sem ligação direta. A versão (st.ver) vai dentro do que é
   assinado e só a versão estritamente maior é aceite e repassada.
   ====================================================================== */
const SYNC_EVERY=2000, RECLAIM_WAIT=3500;
const relaySeen=new Set();
const relaySeenQ=[];
const lanes=new Map();
function noteRelay(id){
  if(!id || relaySeen.has(id)) return false;
  relaySeen.add(id); relaySeenQ.push(id);
  while(relaySeenQ.length>1200) relaySeen.delete(relaySeenQ.shift());
  return true;
}
function relayId(){
  return (Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/[^a-z0-9]/g,'').slice(0,24);
}
function netReset(){
  NET.links.forEach(l=>{ try{ l.room.leave(); }catch(e){} });
  clearTimeout(NET.timer); clearTimeout(NET.graceTimer); clearTimeout(NET.reclaimTimer); clearInterval(NET.syncTimer);
  relaySeen.clear(); relaySeenQ.length=0; lanes.clear();
  Object.assign(NET,{links:[],role:null,code:null,st:null,peers:{},failed:false,timedOut:false,timer:null,graceTimer:null,
    fresh:false,spectator:false,acks:{},reclaiming:false,reclaimTimer:null,syncTimer:null,sig:'',sigVer:-1,pinFp:null,pinOwnerPk:null,ownerFp:'',
    seek:0,pks:{},helloNames:{},viaCid:'',viaName:'',viaPeer:'',hostProof:0,fwdVer:0,fwdTick:0,lastStateMsg:null,actIds:[]});
  chatReset();
}
async function loadLib(kind){
  if(NET.libs[kind]) return NET.libs[kind];
  for(const url of P2P[kind]||[]){
    try{ const lib=await import(url); if(lib && lib.joinRoom){ NET.libs[kind]=lib; return lib; } }catch(e){ console.warn('ito: falhou', url, e); }
  }
  return null;
}
/* TURN: credenciais de 24 h pedidas em CFG.turnUrl, mais a lista fixa CFG.turn.
   Timeout, erro ou JSON ruim não seguram a entrada: segue com a lista fixa, ou sem TURN.
   A lista vai em turnConfig, e o Trystero mantém o STUN padrão. */
const TURN_FOR=24*60*60*1000, TURN_EARLY=5*60*1000, TURN_WAIT=3000, TURN_KEY='ito-turn';
let turnMem=null, turnFlight=null;
const iceList=x=>(Array.isArray(x)?x:[]).filter(s=>s && ((typeof s.urls==='string' && s.urls) || (Array.isArray(s.urls) && s.urls.length)));
const turnFresh=p=>!!(p && typeof p.exp==='number' && p.exp-TURN_EARLY>Date.now() && iceList(p.servers).length);
function rememberTurn(servers){
  turnMem={servers, exp:Date.now()+TURN_FOR};
  ls.set(TURN_KEY, turnMem);
  return servers;
}
async function pullTurn(url){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(), TURN_WAIT);
  try{
    const res=await fetch(url,{cache:'no-store', signal:ctrl.signal, headers:{accept:'application/json'}});
    if(!res.ok) return [];
    const data=await res.json();
    const servers=iceList(data && data.iceServers);
    return servers.length?rememberTurn(servers):[];
  }catch(e){ console.warn('ito: sem credenciais TURN'); return []; }
  finally{ clearTimeout(timer); }
}
function liveTurn(){
  const url=typeof CFG.turnUrl==='string'?CFG.turnUrl.trim():'';
  if(!url) return Promise.resolve([]);
  if(turnFresh(turnMem)) return Promise.resolve(iceList(turnMem.servers));
  const saved=ls.get(TURN_KEY,null);
  if(turnFresh(saved)){ turnMem=saved; return Promise.resolve(iceList(saved.servers)); }
  if(!turnFlight) turnFlight=pullTurn(url).finally(()=>{ turnFlight=null; });
  return turnFlight;
}
function turnForRoom(){ return liveTurn().then(live=>live.concat(iceList(CFG.turn))); }
function armSeek(code){
  clearTimeout(NET.timer);
  if(NET.role!=='guest' || NET.st || NET.code!==code) return;
  NET.timer=setTimeout(()=>{
    if(NET.code!==code || NET.st) return;
    const peers=Object.keys(NET.peers).length;
    if(peers===0 && (NET.seek||0)<SEEK_TRIES){
      NET.seek=(NET.seek||0)+1; NET.failed=false; NET.timedOut=false;
      rejoinLinks(code);
      return;
    }
    NET.timedOut=true; showOnline();
  }, CONNECT_TIMEOUT);
}
async function rejoinLinks(code){
  if(NET.code!==code) return;
  NET.links.forEach(l=>{ try{ l.room.leave(); }catch(e){} });
  NET.links=[]; NET.peers={};
  showOnline();
  await connect(code, true);
}
async function connect(code, keep){
  NET.code=code; if(!keep){ NET.failed=false; NET.timedOut=false; NET.seek=0; }
  const turnP=turnForRoom();
  const kinds=Object.keys(P2P);
  const results=await Promise.all(kinds.map(async kind=>{
    const [lib, turn]=await Promise.all([loadLib(kind), turnP]);
    if(!lib || NET.code!==code) return false;
    try{
      const cfg={appId:APP_ID, password:code};
      const urls=RELAYS[kind];
      if(urls && urls.length) cfg.relayConfig={urls};
      if(turn.length) cfg.turnConfig=turn;
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
  if(NET.role==='guest' && !NET.st) armSeek(code);
  clearInterval(NET.syncTimer); NET.syncTimer=setInterval(syncTick, SYNC_EVERY);
  showOnline();
}
function sendTo(peerKey, data){
  const i=peerKey.indexOf(':'), kind=peerKey.slice(0,i), id=peerKey.slice(i+1);
  const l=NET.links.find(l=>l.kind===kind); if(l) try{ l.send(data,id); }catch(e){}
}
function broadcast(data){ NET.links.forEach(l=>{ try{ l.send(data); }catch(e){} }); }
function floodFwd(to, msg){
  const wrap={t:'fwd', id:relayId(), hop:1, to:to||'', msg};
  noteRelay(wrap.id);
  broadcast(wrap);
}
const aliveCids=()=>new Set([CID, ...Object.values(NET.peers)]);
function sendToCid(cid, data){ const ks=Object.keys(NET.peers).filter(k=>NET.peers[k]===cid); ks.forEach(k=>sendTo(k,data)); return ks.length>0; }
function pkFor(cid){
  if(!cid) return null;
  const st=NET.st, pl=st&&st.players.find(p=>p.cid===cid);
  if(pl&&pl.pk) return pl.pk;
  if(st && st.ownerCid===cid && st.ownerPk) return st.ownerPk;
  return (NET.pks&&NET.pks[cid])||null;
}
function rememberPk(cid, pk){
  if(!cid || !pk || !pk.x || !pk.y) return;
  NET.pks[cid]={x:pk.x, y:pk.y};
}
/* Quem assinou, se a assinatura fecha. Sem assinatura e sem reencaminhar,
   vale o aparelho do outro lado do fio (mensagem antiga ou sem criptografia). */
async function originOf(m, peer, relayed){
  if(m && m.sig && m.cid){
    const pk=pkFor(m.cid);
    if(pk && await verifyText(pk, msgBody(m), m.sig)) return m.cid;
    return '';
  }
  if(relayed) return '';
  return NET.peers[peer]||'';
}
async function guestSend(partial){
  const msg=await seal(partial);
  noteRelay(msg.id);
  if(!Object.keys(NET.peers).length) return false;
  broadcast(msg);
  return true;
}
function gossip(m){
  if(!m || !m.id || !m.sig) return;
  broadcast(m);
}
const hostDirect=()=>!!(NET.st && (NET.st.hostCid===CID || aliveCids().has(NET.st.hostCid)));
const hostReachable=()=>{
  if(!NET.st) return false;
  if(NET.st.hostCid===CID || aliveCids().has(NET.st.hostCid)) return true;
  return !!(NET.hostProof && Date.now()-NET.hostProof<HOST_GRACE);
};
const hostAlive=hostReachable;
const stateHash=st=>xmur3(JSON.stringify(st))().toString(36);
const hostName=()=>{ const st=NET.st; const p=st&&st.players.find(p=>p.cid===st.hostCid); return (p&&p.name)||'o anfitrião'; };
const isHostNow=()=>NET.role==='host' && !NET.reclaiming;
function noteHostProof(){ NET.hostProof=Date.now(); if(NET.role==='guest' && !hostDirect()) armHostWatch(); }
function noteVia(peer){
  if(!NET.st) return;
  if(hostDirect()){ NET.viaCid=''; NET.viaPeer=''; return; }
  const cid=NET.peers[peer];
  if(!cid || cid===NET.st.hostCid) return;
  NET.viaPeer=peer; NET.viaCid=cid;
  const pl=NET.st.players.find(p=>p.cid===cid);
  NET.viaName=(pl&&pl.name)||NET.helloNames[cid]||NET.viaName||'';
}

function saveOnline(){
  if(NET.role==='host') ls.set(ONLINE_KEY,{code:NET.code, role:'host', st:NET.st});
  else if(NET.role==='guest') ls.set(ONLINE_KEY,{code:NET.code, role:NET.spectator?'tv':'guest', st:NET.st});
}
function onPeerJoin(peer){
  sendHello(peer);
  if(isHostNow()) sendState(peer);
  else if(NET.lastStateMsg) sendTo(peer, NET.lastStateMsg);
}
function onPeerLeave(peer){
  const cid=NET.peers[peer]; delete NET.peers[peer];
  if(NET.viaPeer===peer){
    NET.viaPeer=''; NET.viaCid='';
    if(!hostDirect() && NET.st){
      const k=Object.keys(NET.peers).find(x=>NET.peers[x] && NET.peers[x]!==NET.st.hostCid);
      if(k) noteVia(k);
    }
  }
  if(!cid || aliveCids().has(cid)) return;          // ainda conectado pela outra rede
  if(isHostNow()){
    const pl=NET.st.players.find(p=>p.cid===cid);
    if(pl){ pl.on=false; checkRoundOver(NET.st); hostCommit(); }
  } else if(NET.st && cid===NET.st.hostCid){ hostLost(); }
}
function armHostWatch(){
  clearTimeout(NET.graceTimer);
  NET.graceTimer=setTimeout(considerHostLost, HOST_GRACE);
}
/* Anfitrião sumiu do fio direto. Se o estado assinado dele ainda chega
   por outra pessoa, ninguém assume. Se parar de chegar, o próximo segura. */
function hostLost(){
  showOnline();
  armHostWatch();
}
function considerHostLost(){
  if(NET.role!=='guest' || NET.spectator) return;
  if(hostDirect() || hostReachable()){
    if(!hostDirect() && hostReachable()) armHostWatch();
    showOnline();
    return;
  }
  if(!NET.fresh){ showOnline(); return; }
  const alive=aliveCids(), st=NET.st;
  const next=st.players.filter(p=>p.cid!==st.hostCid && alive.has(p.cid)).sort((a,b)=>a.seat-b.seat)[0];
  if(next && next.cid===CID){
    NET.role='host'; st.hostCid=CID; NET.acks={}; NET.viaCid='';
    st.players.forEach(p=>p.on=alive.has(p.cid));
    setEv(st,'newhost',st.players.find(p=>p.cid===CID));
    checkRoundOver(st); hostCommit();
  } else { showOnline(); hostLost(); }
}
/* Dono da sala voltando: espera um pouco para pegar o estado mais novo e reassume */
function finishReclaim(){
  if(!NET.reclaiming) return;
  NET.reclaiming=false; clearTimeout(NET.reclaimTimer);
  const st=NET.st, alive=aliveCids(), wasOther=st.hostCid!==CID;
  st.hostCid=CID; NET.acks={};
  st.players.forEach(p=>p.on=alive.has(p.cid));
  if(wasOther) setEv(st,'hostBack',st.players.find(p=>p.cid===CID));
  checkRoundOver(st); hostCommit();
}
function newerState(a,b){ // a é mais nova que b?
  if(!b) return true;
  if((a.ver||0)!==(b.ver||0)) return (a.ver||0)>(b.ver||0);
  const ao=a.hostCid===a.ownerCid, bo=b.hostCid===b.ownerCid;
  if(ao!==bo) return ao;                                 // empate: vale o do dono da sala
  return a.hostCid<b.hostCid;
}
function strictlyNewer(st){ return !NET.st || (st.ver||0)>(NET.st.ver||0); }
function acceptState(st, peer){
  const prev=NET.st;
  NET.st=st; NET.fresh=true; NET.timedOut=false; clearTimeout(NET.timer);
  if(st.hostCid && (st.hostCid===(prev&&prev.hostCid) || !prev)) noteHostProof();
  if(!hostDirect()) noteVia(peer); else { NET.viaCid=''; NET.viaPeer=''; }
  if(!NET.pinOwnerPk && st.ownerPk){ NET.pinOwnerPk=st.ownerPk; fingerprint(st.ownerPk).then(fp=>{ NET.ownerFp=fp; history.replaceState(null,'',roomHash(st.code)); }).catch(()=>{}); }
  st.players.forEach(p=>{ if(p.pk) rememberPk(p.cid, p.pk); });
  if(!NET.spectator && !st.players.some(p=>p.cid===CID)) sendHello(peer);
  else guestSend({t:'ack', ver:st.ver, h:stateHash(st)});
  saveOnline(); showOnline();
  flushChatStash(); maybePullChat();
}
function statePacket(m){
  return {t:'state', st:m.st, sig:m.sig, id:m.id||('st'+(m.st&&m.st.ver||0))};
}
function spreadState(m){
  const ver=m.st&&m.st.ver||0;
  if(ver<=(NET.fwdVer||0)) return;
  NET.fwdVer=ver;
  const out=statePacket(m);
  NET.lastStateMsg=out;
  noteRelay(out.id);
  broadcast(out);
}
function publishState(){
  const msg=stateMsg(false);
  msg.id='st'+(NET.st.ver||0);
  noteRelay(msg.id);
  NET.fwdVer=NET.st.ver||0;
  NET.lastStateMsg=msg;
  NET.hostProof=Date.now();
  broadcast(msg);
}
function sendState(peer, force){
  if(!NET.st || !peer || (NET.sigVer!==NET.st.ver && KEYS.ok)) return;
  const msg=stateMsg(!!force);
  msg.id='st'+(NET.st.ver||0)+(force?('f'+relayId().slice(0,4)):'');
  sendTo(peer, msg);
}
function sendStateToward(cid, force){
  if(!NET.st || !cid || (NET.sigVer!==NET.st.ver && KEYS.ok)) return;
  const msg=stateMsg(!!force);
  msg.id='st'+(NET.st.ver||0)+(force?('f'+relayId().slice(0,6)):'');
  if(sendToCid(cid, msg)) return;
  floodFwd(cid, msg);
}
/* Banner: o anfitrião não está no fio direto e também não há por quem o estado chegue. */
function hostBanner(){
  if(!NET.st || NET.role!=='guest') return false;
  if(hostDirect()) return false;
  if(NET.viaCid && hostReachable()) return false;
  return true;
}
/* Mensagens do anfitrião que não são o estado (expulsar, sala cheia, encerrar). */
async function hostNotice(t, extra, toCid){
  const msg=await seal(Object.assign({t, hostCid:CID}, extra||{}));
  noteRelay(msg.id);
  if(toCid){ if(!sendToCid(toCid, msg)) floodFwd(toCid, msg); }
  else broadcast(msg);
}
async function hostSigned(m){
  if(!m) return false;
  if(!KEYS.ok) return true;
  if(!m.sig) return false;
  const hid=m.hostCid||(NET.st&&NET.st.hostCid);
  const pk=pkFor(hid);
  if(!pk) return false;
  return verifyText(pk, msgBody(m), m.sig);
}
function onMsg(m, peer){
  const k=peer||'x';
  const prev=lanes.get(k)||Promise.resolve();
  const next=prev.then(()=>dispatch(m, peer, null)).catch(e=>{ console.warn('ito: mensagem', e); });
  lanes.set(k, next);
}
async function onFwd(m, peer){
  if(!m || typeof m.msg!=='object' || !m.msg || typeof m.id!=='string') return;
  if(relaySeen.has(m.id)) return;
  const hop=m.hop|0;
  if(hop<1 || hop>RELAY_HOPS) return;
  noteRelay(m.id);
  if(hop<RELAY_HOPS) broadcast({t:'fwd', id:m.id, hop:hop+1, to:m.to||'', msg:m.msg});
  if(m.to && m.to!==CID) return;
  await dispatch(m.msg, peer, {relayed:true});
}
async function dispatch(m, peer, opt){
  if(!m || typeof m!=='object') return;
  const relayed=!!(opt&&opt.relayed);
  if(m.t==='fwd'){ await onFwd(m, peer); return; }
  if(m.id && relaySeen.has(m.id)) return;
  if(m.id) noteRelay(m.id);
  if(m.t==='hello' && typeof m.cid==='string' && !(await helloValid(m))) return;
  if(m.t==='state' && m.st && m.st.code===NET.code && !(await stateValid(m, peer, relayed))) return;
  if(m.t==='react'){
    let by=String(m.by||'').slice(0,20);
    if(m.sig){
      const cid=await originOf(m, peer, true);
      if(!cid) return;
      const pl=NET.st&&NET.st.players.find(p=>p.cid===cid);
      if(pl) by=(pl.name||by).slice(0,20);
      gossip(m);
    } else if(relayed) return;
    if(m.id && seenReacts.has(m.id)) return;
    seenReacts.add(m.id); if(seenReacts.size>200) seenReacts.clear();
    showReaction(m.e, by);
    return;
  }
  if(m.t==='chat'){ if(await receiveChat(m, peer, relayed)) gossip(m); return; }
  if(m.t==='chatlog'){ await receiveChatLog(m, peer, relayed); return; }
  if(m.t==='hello' && typeof m.cid==='string'){
    rememberPk(m.cid, m.pk);
    if(typeof m.name==='string' && m.name.trim()) NET.helloNames[m.cid]=m.name.trim().slice(0,20);
    if(!relayed){
      NET.peers[peer]=m.cid;
      if(NET.st && !hostDirect() && m.cid!==NET.st.hostCid && (NET.viaPeer===peer || !NET.viaCid)){
        NET.viaPeer=peer; NET.viaCid=m.cid; NET.viaName=NET.helloNames[m.cid]||'';
        showOnline();
      }
      floodFwd('', m);
    }
    if(isHostNow()) hostHello(m, peer);
    flushChatStash();
    return;
  }
  if(m.t==='state' && m.st && m.st.code===NET.code){
    if(m.st.hostCid===CID && NET.role==='host' && !NET.reclaiming) return;
    const prevVer=NET.st&&NET.st.ver||0;
    if(NET.reclaiming){
      if(newerState(m.st, NET.st)){
        NET.st=m.st; NET.lastStateMsg=statePacket(m); clearTimeout(NET.reclaimTimer); NET.reclaimTimer=setTimeout(finishReclaim, 1500);
        if((m.st.ver||0)>prevVer) spreadState(m);
        flushChatStash(); maybePullChat();
      }
      return;
    }
    if(NET.role==='host'){
      if(NET.st.ownerCid===CID){
        if((m.st.ver||0)>(NET.st.ver||0)){ NET.st=Object.assign(m.st,{hostCid:CID}); hostCommit(); }
        else sendState(peer, true);
        return;
      }
      if(!(m.st.hostCid===m.st.ownerCid || newerState(m.st, NET.st))){ sendState(peer); return; }
      NET.role='guest'; NET.acks={};
    }
    if(NET.role!=='guest') return;
    const repair=!!m.force && !!NET.st && (m.st.ver||0)===(NET.st.ver||0) && stateHash(m.st)!==stateHash(NET.st);
    if(newerState(m.st, NET.st) || repair){
      acceptState(m.st, peer);
      NET.lastStateMsg=statePacket(m);
      if((m.st.ver||0)>prevVer) spreadState(m);
    } else guestSend({t:'ack', ver:NET.st.ver, h:stateHash(NET.st)});
    return;
  }
  if(m.t==='tick'){
    const okSig=m.sig ? await hostSigned(m) : false;
    if(m.sig && !okSig) return;
    if(!m.sig && (relayed || !NET.st || NET.peers[peer]!==NET.st.hostCid)) return;
    if(NET.st && m.hostCid && m.hostCid!==NET.st.hostCid && m.hostCid!==CID) return;
    noteHostProof();
    if(!hostDirect()) noteVia(peer);
    if(okSig && (m.ts||0)>(NET.fwdTick||0)){ NET.fwdTick=m.ts||0; gossip(m); }
    if(NET.role==='guest' && (!NET.st || m.ver!==NET.st.ver || m.h!==stateHash(NET.st))) guestSend({t:'pull'});
    return;
  }
  if(isHostNow()){
    if(m.t==='pull' || m.t==='ack' || m.t==='chatpull' || m.t==='name' || m.t==='act' || m.t==='bye'){
      const cid=await originOf(m, peer, relayed);
      if(!cid) return;
      if(m.t!=='hello') gossip(m);
      if(m.t==='pull'){ sendStateToward(cid, true); return; }
      if(m.t==='chatpull'){ if(!(NET.st.banned||[]).includes(cid)) sendChatLogTo(cid); return; }
      if(m.t==='ack'){
        NET.acks[cid]={ver:m.ver, h:m.h, at:Date.now()};
        if(m.h!==stateHash(NET.st) && m.ver===NET.st.ver) sendStateToward(cid, true);
        return;
      }
      const pl=NET.st.players.find(p=>p.cid===cid);
      if(!pl) return;
      if(m.id && (m.t==='act' || m.t==='bye' || m.t==='name')){
        if(NET.actIds.includes(m.id)) return;
        NET.actIds.push(m.id); if(NET.actIds.length>400) NET.actIds.splice(0, NET.actIds.length-300);
      }
      if(m.t==='name'){ pl.name=String(m.name||'').trim().slice(0,20); hostCommit(); }
      else if(m.t==='act' && m.a){ if(applyAct(NET.st, m.a, pl)) hostCommit(); }
      else if(m.t==='bye'){
        const st=NET.st;
        if(st.phase==='lobby'){ st.players=st.players.filter(p=>p.cid!==pl.cid); st.players.forEach((p,i)=>p.seat=i+1); }
        else { pl.on=false; checkRoundOver(st); }
        hostCommit();
      }
      return;
    }
  } else if(NET.role==='guest' && (m.t==='act' || m.t==='ack' || m.t==='pull' || m.t==='name' || m.t==='bye' || m.t==='chatpull')){
    const cid=await originOf(m, peer, relayed);
    if(cid) gossip(m);
    return;
  } else if(NET.role==='guest' && (m.t==='full' || m.t==='kicked' || m.t==='closed')){
    const signed=await hostSigned(m);
    const direct=!relayed && NET.st && NET.peers[peer]===NET.st.hostCid;
    if(!signed && !direct) return;
    if(signed) gossip(m);
    if(m.to && m.to!==CID) return;
    netReset(); ls.del(ONLINE_KEY); history.replaceState(null,'',location.pathname); home();
    const msg={full:['Sala cheia','Essa sala já tem 10 pessoas.'], kicked:['Você saiu da sala','O anfitrião tirou você da sala.'], closed:['Sala encerrada','O anfitrião encerrou a sala.']}[m.t];
    dialog({title:msg[0], body:`<p>${msg[1]}</p>`, actions:[{label:'Ok',value:'ok',cls:'brand'}]});
  }
}
/* A cada 2 s: o anfitrião confere quem está atrasado e reenvia; o tick assinado
   também segue pela malha, para quem não vê o anfitrião saber que ele segue lá. */
function syncTick(){
  if(!isHostNow() || !NET.st) return;
  const st=NET.st, h=stateHash(st);
  seal({t:'tick', ver:st.ver, h, hostCid:CID}).then(msg=>{
    if(!isHostNow() || !NET.st || NET.st.ver!==st.ver) return;
    noteRelay(msg.id); NET.fwdTick=msg.ts||0;
    broadcast(msg);
  });
  st.players.forEach(p=>{
    if(p.cid===CID || !p.on) return;
    const a=NET.acks[p.cid];
    if(!a || a.ver!==st.ver || a.h!==h){ if(NET.sigVer===st.ver || !KEYS.ok) sendStateToward(p.cid, true); }
  });
}
function hostHello(m, peer){
  const st=NET.st;
  rememberPk(m.cid, m.pk);
  if((st.banned||[]).includes(m.cid)){ hostNotice('kicked', {to:m.cid}, m.cid); return; }
  if(m.spectator){ sendStateToward(m.cid, false); sendChatLogTo(m.cid); return; }
  let pl=st.players.find(p=>p.cid===m.cid);
  if(pl && pl.pk && m.pk && !samePk(pl.pk, m.pk)) return;
  if(!pl){
    if(st.players.length>=10){ hostNotice('full', {to:m.cid}, m.cid); return; }
    pl={seat:st.players.length+1, cid:m.cid, name:'', on:true}; st.players.push(pl);
  }
  if(!pl.pk && m.pk) pl.pk={x:m.pk.x, y:m.pk.y};
  pl.on=true;
  if(typeof m.name==='string' && m.name.trim()) pl.name=m.name.trim().slice(0,20);
  sendChatLogTo(m.cid);
  hostCommit();
}
