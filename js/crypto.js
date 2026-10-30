/* ito — Chaves e assinaturas */
'use strict';
/* ======================================================================
   Assinaturas: cada aparelho tem uma chave (ECDSA P-256) criada no próprio
   celular. O anfitrião assina cada estado (o campo ver, dentro do estado,
   só cresce). A apresentação e as ações de cada jogador também são assinadas,
   para um convidado que só reencaminha não conseguir forjar nem alterar.
   ====================================================================== */
const KEYS={priv:null, pk:null, fp:'', ok:false};
const b64u=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=str=>{ const s=atob(str.replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(s,c=>c.charCodeAt(0)); };
const ECDSA={name:'ECDSA', namedCurve:'P-256'}, SIGN={name:'ECDSA', hash:'SHA-256'};
async function fingerprint(pk){
  const h=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pk.x+'.'+pk.y));
  return [...new Uint8Array(h)].slice(0,6).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function initKeys(){
  if(!(window.crypto && crypto.subtle)) return;           // sem criptografia (página sem https): segue sem assinar
  try{
    const saved=ls.get('ito-key',null);
    if(saved){ KEYS.priv=await crypto.subtle.importKey('jwk', saved.priv, ECDSA, false, ['sign']); KEYS.pk=saved.pk; }
    else{
      const kp=await crypto.subtle.generateKey(ECDSA, true, ['sign','verify']);
      const priv=await crypto.subtle.exportKey('jwk', kp.privateKey), pub=await crypto.subtle.exportKey('jwk', kp.publicKey);
      KEYS.priv=kp.privateKey; KEYS.pk={x:pub.x, y:pub.y}; ls.set('ito-key',{priv, pk:KEYS.pk});
    }
    KEYS.fp=await fingerprint(KEYS.pk); KEYS.ok=true;
  }catch(e){ console.warn('ito: sem chave', e); }
}
async function signText(text){
  if(!KEYS.ok) return '';
  return b64u(await crypto.subtle.sign(SIGN, KEYS.priv, new TextEncoder().encode(text)));
}
const keyCache=new Map();
async function verifyText(pk, text, sig){
  if(!(window.crypto && crypto.subtle)) return true;
  if(!pk || !pk.x || !pk.y || typeof sig!=='string' || !sig) return false;
  try{
    const id=pk.x+'.'+pk.y;
    let key=keyCache.get(id);
    if(!key){ key=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:pk.x,y:pk.y,ext:true},ECDSA,false,['verify']); keyCache.set(id,key); }
    return await crypto.subtle.verify(SIGN, key, unb64u(sig), new TextEncoder().encode(text));
  }catch(e){ return false; }
}
const samePk=(a,b)=>!!a && !!b && a.x===b.x && a.y===b.y;
/* Texto estável para assinar: a ordem das chaves não muda o resultado.
   O código da sala entra aqui e não vai solto na mensagem, para o mesmo
   pedido não valer noutra sala. */
function canon(v){
  if(v===null || typeof v!=='object') return JSON.stringify(v===undefined?null:v);
  if(Array.isArray(v)) return '['+v.map(canon).join(',')+']';
  const keys=Object.keys(v).filter(k=>v[k]!==undefined).sort();
  return '{'+keys.map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
}
function msgBody(m){
  const o={};
  if(m && typeof m==='object') for(const k in m) if(k!=='sig' && k!=='code' && m[k]!==undefined) o[k]=m[k];
  o.code=NET.code||'';
  return canon(o);
}
async function seal(msg){
  msg.id=msg.id||relayId();
  msg.cid=msg.cid||CID;
  msg.ts=msg.ts||Date.now();
  if(KEYS.ok) msg.sig=await signText(msgBody(msg));
  return msg;
}
/* Apresentação assinada: cobre cid, nome, telão e chave. Quem reencaminha
   não troca o nome nem se passa por outro jogador. */
async function sendHello(peer){
  const base={t:'hello', id:relayId(), cid:CID, name:myName||'', spectator:!!NET.spectator, pk:KEYS.pk, ts:Date.now()};
  base.sig=await signText(msgBody(base));
  noteRelay(base.id);
  sendTo(peer, base);
}
async function helloValid(m){
  if(!KEYS.ok) return true;
  if(!m || !m.pk) return false;
  return verifyText(m.pk, msgBody(m), m.sig);
}
/* Estado assinado pelo anfitrião da vez */
async function refreshSig(){
  const st=NET.st; if(!st) return;
  const ver=st.ver, sig=await signText(JSON.stringify(st));
  if(NET.st===st && st.ver===ver){ NET.sig=sig; NET.sigVer=ver; return true; }
  return false;
}
function stateMsg(force){ return {t:'state', st:NET.st, sig:NET.sigVer===NET.st.ver?NET.sig:'', force:!!force}; }
function sendState(peer, force){ if(NET.sigVer===NET.st.ver || !KEYS.ok) sendTo(peer, stateMsg(force)); }
async function stateValid(m, peer, relayed){
  if(!KEYS.ok) return true;
  const st=m.st;
  if(!st.ownerPk) return false;
  // dono da sala fixado: pela impressão no link, ou pelo primeiro estado aceito
  if(NET.pinOwnerPk){ if(!samePk(NET.pinOwnerPk, st.ownerPk)) return false; }
  else if(NET.pinFp){ if(await fingerprint(st.ownerPk)!==NET.pinFp) return false; }
  let signer;
  if(st.hostCid===st.ownerCid) signer=st.ownerPk;
  else{
    // anfitrião provisório: a assinatura tem de ser da chave dele.
    // Direto, aceitamos a chave que o próprio aparelho apresenta.
    // Reencaminhado, só se essa chave já estava num estado que aceitámos antes
    // (senão qualquer convidado inventava um chefe novo).
    if(st.ownerCid!==CID && aliveCids().has(st.ownerCid)) return false;
    if(st.ownerCid===CID && NET.role==='host' && !NET.reclaiming) return false;
    const prior=NET.st && NET.st.code===st.code ? NET.st.players.find(p=>p.cid===st.hostCid) : null;
    const direct=!relayed && NET.peers[peer]===st.hostCid;
    const known=direct ? ((prior && prior.pk) || (st.players.find(p=>p.cid===st.hostCid)||{}).pk) : (prior && prior.pk);
    if(!known) return false;
    const inNew=st.players.find(p=>p.cid===st.hostCid);
    if(!inNew || !samePk(inNew.pk, known)) return false;
    signer=known;
  }
  return verifyText(signer, JSON.stringify(st), m.sig);
}
