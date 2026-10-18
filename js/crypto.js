/* ito — Chaves e assinaturas */
'use strict';
/* ======================================================================
   Assinaturas: cada aparelho tem uma chave (ECDSA P-256) criada no próprio
   celular. O anfitrião assina cada estado; a apresentação (hello) também é
   assinada. Assim ninguém consegue se passar pelo anfitrião ou por outro jogador.
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
/* Apresentação assinada: prova que quem diz ser o jogador X tem a chave dele */
async function sendHello(peer){
  const ts=Date.now(), base={t:'hello', cid:CID, name:myName, spectator:NET.spectator, pk:KEYS.pk, ts};
  base.sig=await signText(CID+'|'+NET.code+'|'+ts);
  sendTo(peer, base);
}
async function helloValid(m){
  if(!KEYS.ok) return true;
  return verifyText(m.pk, m.cid+'|'+NET.code+'|'+m.ts, m.sig);
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
async function stateValid(m, peer){
  if(!KEYS.ok) return true;
  const st=m.st;
  if(!st.ownerPk) return false;
  // dono da sala fixado: pela impressão no link, ou pelo primeiro estado aceito
  if(NET.pinOwnerPk){ if(!samePk(NET.pinOwnerPk, st.ownerPk)) return false; }
  else if(NET.pinFp){ if(await fingerprint(st.ownerPk)!==NET.pinFp) return false; }
  let signer;
  if(st.hostCid===st.ownerCid) signer=st.ownerPk;
  else{
    // anfitrião provisório: só vale enquanto o dono da sala está fora, e vindo do próprio aparelho dele
    if(st.ownerCid!==CID && aliveCids().has(st.ownerCid)) return false;
    if(st.ownerCid===CID && NET.role==='host' && !NET.reclaiming) return false;   // o dono, já no comando, não aceita outro chefe
    if(NET.peers[peer]!==st.hostCid) return false;
    // a chave dele tem que ser a que já conhecíamos
    // (quem acabou de chegar e ainda não conhece ninguém aceita a chave listada no estado)
    const known=(NET.st && NET.st.code===st.code ? NET.st : st).players.find(p=>p.cid===st.hostCid);
    if(!known || !known.pk) return false;
    signer=known.pk;
    const inNew=st.players.find(p=>p.cid===st.hostCid);
    if(!inNew || !samePk(inNew.pk, known.pk)) return false;
  }
  return verifyText(signer, JSON.stringify(st), m.sig);
}
