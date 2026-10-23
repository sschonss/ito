/* ito — Rede: conexão, anfitrião e conferência de estado */
'use strict';
/* ======================================================================
   Rede: duas redes ao mesmo tempo (Nostr e MQTT).
   O ANFITRIÃO É A ÚNICA VERDADE: só ele altera o estado; os outros pedem
   ações, recebem o estado e confirmam (ack). A cada 2 s o anfitrião envia
   um "tick" com a versão e uma impressão digital (hash) do estado; quem
   estiver diferente pede o estado de novo.
   ====================================================================== */
const SYNC_EVERY=2000, RECLAIM_WAIT=3500;
function netReset(){
  NET.links.forEach(l=>{ try{ l.room.leave(); }catch(e){} });
  clearTimeout(NET.timer); clearTimeout(NET.graceTimer); clearTimeout(NET.reclaimTimer); clearInterval(NET.syncTimer);
  Object.assign(NET,{links:[],role:null,code:null,st:null,peers:{},failed:false,timedOut:false,timer:null,graceTimer:null,
    fresh:false,spectator:false,acks:{},reclaiming:false,reclaimTimer:null,syncTimer:null,sig:'',sigVer:-1,pinFp:null,pinOwnerPk:null,ownerFp:''});
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
async function connect(code){
  NET.code=code; NET.failed=false;
  const turnP=turnForRoom();
  const kinds=Object.keys(P2P);
  const results=await Promise.all(kinds.map(async kind=>{
    const [lib, turn]=await Promise.all([loadLib(kind), turnP]);
    if(!lib || NET.code!==code) return false;
    try{
      const cfg={appId:APP_ID, password:code};
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
  if(NET.role==='guest' && !NET.st){
    clearTimeout(NET.timer);
    NET.timer=setTimeout(()=>{ if(!NET.st){ NET.timedOut=true; showOnline(); } }, CONNECT_TIMEOUT);
  }
  clearInterval(NET.syncTimer); NET.syncTimer=setInterval(syncTick, SYNC_EVERY);
  showOnline();
}
function sendTo(peerKey, data){
  const i=peerKey.indexOf(':'), kind=peerKey.slice(0,i), id=peerKey.slice(i+1);
  const l=NET.links.find(l=>l.kind===kind); if(l) try{ l.send(data,id); }catch(e){}
}
function broadcast(data){ NET.links.forEach(l=>{ try{ l.send(data); }catch(e){} }); }
const aliveCids=()=>new Set([CID, ...Object.values(NET.peers)]);
function sendToCid(cid, data){ const ks=Object.keys(NET.peers).filter(k=>NET.peers[k]===cid); ks.forEach(k=>sendTo(k,data)); return ks.length>0; }
const hostAlive=()=>NET.st && (NET.st.hostCid===CID || aliveCids().has(NET.st.hostCid));
const stateHash=st=>xmur3(JSON.stringify(st))().toString(36);
const hostName=()=>{ const st=NET.st; const p=st&&st.players.find(p=>p.cid===st.hostCid); return (p&&p.name)||'o anfitrião'; };
const isHostNow=()=>NET.role==='host' && !NET.reclaiming;

function saveOnline(){
  if(NET.role==='host') ls.set(ONLINE_KEY,{code:NET.code, role:'host', st:NET.st});
  else if(NET.role==='guest') ls.set(ONLINE_KEY,{code:NET.code, role:NET.spectator?'tv':'guest', st:NET.st});
}
function onPeerJoin(peer){
  sendHello(peer);
  if(isHostNow()) sendState(peer);
}
function onPeerLeave(peer){
  const cid=NET.peers[peer]; delete NET.peers[peer];
  if(!cid || aliveCids().has(cid)) return;          // ainda conectado pela outra rede
  if(isHostNow()){
    const pl=NET.st.players.find(p=>p.cid===cid);
    if(pl){ pl.on=false; checkRoundOver(NET.st); hostCommit(); }
  } else if(NET.st && cid===NET.st.hostCid){ hostLost(); }
}
/* Anfitrião caiu: depois de alguns segundos, o próximo jogador conectado segura a partida
   provisoriamente. Quando o dono da sala voltar, ele reassume. */
function hostLost(){
  showOnline();
  clearTimeout(NET.graceTimer);
  NET.graceTimer=setTimeout(()=>{
    if(NET.role!=='guest' || NET.spectator || hostAlive()) return;
    if(!NET.fresh){ showOnline(); return; }        // só assume quem recebeu o estado atual nesta sessão
    const alive=aliveCids(), st=NET.st;
    const next=st.players.filter(p=>p.cid!==st.hostCid && alive.has(p.cid)).sort((a,b)=>a.seat-b.seat)[0];
    if(next && next.cid===CID){
      NET.role='host'; st.hostCid=CID; NET.acks={};
      st.players.forEach(p=>p.on=alive.has(p.cid));
      setEv(st,'newhost',st.players.find(p=>p.cid===CID));
      checkRoundOver(st); hostCommit();
    } else { showOnline(); hostLost(); }
  }, HOST_GRACE);
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
function acceptState(st, peer){
  NET.st=st; NET.fresh=true; NET.timedOut=false; clearTimeout(NET.timer); clearTimeout(NET.graceTimer);
  if(!NET.pinOwnerPk && st.ownerPk){ NET.pinOwnerPk=st.ownerPk; fingerprint(st.ownerPk).then(fp=>{ NET.ownerFp=fp; history.replaceState(null,'',roomHash(st.code)); }).catch(()=>{}); }
  if(!NET.spectator && !st.players.some(p=>p.cid===CID)) sendHello(peer);
  else sendTo(peer,{t:'ack', ver:st.ver, h:stateHash(st)});
  saveOnline(); showOnline();
  flushChatStash(); maybePullChat(peer);
}
async function onMsg(m, peer){
  if(!m || typeof m!=='object') return;
  if(m.t==='hello' && typeof m.cid==='string' && !(await helloValid(m))) return;          // apresentação falsa
  if(m.t==='state' && m.st && m.st.code===NET.code && !(await stateValid(m, peer))) return;    // estado sem assinatura válida
  if(m.t==='react'){ if(m.id && seenReacts.has(m.id)) return; seenReacts.add(m.id); if(seenReacts.size>200) seenReacts.clear(); showReaction(m.e, String(m.by||'').slice(0,20)); return; }
  if(m.t==='chat'){ receiveChat(m, peer); return; }
  if(m.t==='chatlog'){ receiveChatLog(m, peer); return; }
  if(m.t==='hello' && typeof m.cid==='string'){
    NET.peers[peer]=m.cid;
    if(isHostNow()) hostHello(m, peer);
    flushChatStash();
    return;
  }
  if(m.t==='state' && m.st && m.st.code===NET.code){
    NET.peers[peer]=m.st.hostCid;
    if(m.st.hostCid===CID) return;
    if(NET.reclaiming){                                    // dono voltando: guarda o estado mais novo
      if(newerState(m.st, NET.st)){ NET.st=m.st; clearTimeout(NET.reclaimTimer); NET.reclaimTimer=setTimeout(finishReclaim, 1500); flushChatStash(); maybePullChat(peer); }
      return;
    }
    if(NET.role==='host'){
      if(NET.st.ownerCid===CID){                           // sou o dono: continuo anfitrião, mas aproveito o progresso
        if((m.st.ver||0)>(NET.st.ver||0)){ NET.st=Object.assign(m.st,{hostCid:CID}); hostCommit(); }
        else sendState(peer, true);
        return;
      }
      if(!(m.st.hostCid===m.st.ownerCid || newerState(m.st, NET.st))){ sendState(peer); return; }
      NET.role='guest'; NET.acks={};                       // o dono reassumiu: vira jogador
    }
    if(NET.role!=='guest') return;
    if(m.force || newerState(m.st, NET.st)) acceptState(m.st, peer);
    else sendTo(peer,{t:'ack', ver:NET.st.ver, h:stateHash(NET.st)});
    return;
  }
  if(m.t==='tick'){                                       // conferência periódica do anfitrião
    NET.peers[peer]=m.hostCid;
    if(NET.role==='guest' && (!NET.st || m.ver!==NET.st.ver || m.h!==stateHash(NET.st))) sendTo(peer,{t:'pull'});
    return;
  }
  if(isHostNow()){
    const cid=NET.peers[peer];
    if(m.t==='pull'){ sendState(peer, true); return; }
    if(m.t==='chatpull'){ if(!(cid && (NET.st.banned||[]).includes(cid))) sendChatLog(peer); return; }
    if(m.t==='ack'){ if(cid) NET.acks[cid]={ver:m.ver, h:m.h, at:Date.now()}; if(m.h!==stateHash(NET.st) && m.ver===NET.st.ver) sendState(peer, true); return; }
    const pl=NET.st.players.find(p=>p.cid===cid);
    if(!pl) return;
    if(m.t==='name'){ pl.name=String(m.name||'').trim().slice(0,20); hostCommit(); }
    else if(m.t==='act' && m.a){ if(applyAct(NET.st, m.a, pl)) hostCommit(); }
    else if(m.t==='bye'){
      const st=NET.st;
      if(st.phase==='lobby'){ st.players=st.players.filter(p=>p.cid!==pl.cid); st.players.forEach((p,i)=>p.seat=i+1); }
      else { pl.on=false; checkRoundOver(st); }
      hostCommit();
    }
  } else if(NET.role==='guest'){
    if(m.t==='full' || m.t==='kicked' || m.t==='closed'){
      netReset(); ls.del(ONLINE_KEY); history.replaceState(null,'',location.pathname); home();
      const msg={full:['Sala cheia','Essa sala já tem 10 pessoas.'], kicked:['Você saiu da sala','O anfitrião tirou você da sala.'], closed:['Sala encerrada','O anfitrião encerrou a sala.']}[m.t];
      dialog({title:msg[0], body:`<p>${msg[1]}</p>`, actions:[{label:'Ok',value:'ok',cls:'brand'}]});
    }
  }
}
/* A cada 2 s: o anfitrião confere quem está atrasado e reenvia; todos recebem a impressão digital do estado */
function syncTick(){
  if(!isHostNow() || !NET.st) return;
  const st=NET.st, h=stateHash(st), alive=aliveCids();
  broadcast({t:'tick', ver:st.ver, h, hostCid:CID});
  st.players.forEach(p=>{
    if(p.cid===CID || !alive.has(p.cid)) return;
    const a=NET.acks[p.cid];
    if(!a || a.ver!==st.ver || a.h!==h){ if(NET.sigVer===st.ver || !KEYS.ok) sendToCid(p.cid, stateMsg(true)); }
  });
}
function hostHello(m, peer){
  const st=NET.st;
  if((st.banned||[]).includes(m.cid)){ sendTo(peer,{t:'kicked'}); return; }
  if(m.spectator){ sendState(peer); sendChatLog(peer); return; }       // telão: só assiste
  let pl=st.players.find(p=>p.cid===m.cid);
  if(pl && pl.pk && m.pk && !samePk(pl.pk, m.pk)) return;   // alguém tentando usar o lugar de outra pessoa
  if(!pl){
    if(st.players.length>=10){ sendTo(peer,{t:'full'}); return; }
    pl={seat:st.players.length+1, cid:m.cid, name:'', on:true}; st.players.push(pl);
  }
  if(!pl.pk && m.pk) pl.pk={x:m.pk.x, y:m.pk.y};
  pl.on=true;
  if(typeof m.name==='string' && m.name.trim()) pl.name=m.name.trim().slice(0,20);
  sendChatLog(peer);
  hostCommit();
}
