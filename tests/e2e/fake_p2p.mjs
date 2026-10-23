// Substitui a biblioteca de conexão (Trystero) nos testes: as mensagens passam por um relé no próprio teste.
const KIND='__KIND__';
export const selfId = KIND+Math.random().toString(36).slice(2,8);
export function joinRoom(cfg, roomId){
  (window.__joinCfg=window.__joinCfg||[]).push(cfg);
  const room={onPeerJoin:null,onPeerLeave:null}, actions={};
  (window.__deliverers=window.__deliverers||{})[KIND]=(type,from,name,data)=>{
    if(type==='join') room.onPeerJoin&&room.onPeerJoin(from);
    else if(type==='leave') room.onPeerLeave&&room.onPeerLeave(from);
    else { const a=actions[name]; a&&a.onMessage&&a.onMessage(data,{peerId:from}); }
  };
  room.makeAction=name=>{ const a={send:async(d,o)=>window.__relay({kind:KIND,room:roomId,from:selfId,to:(o&&o.target)||null,name,data:d}),onMessage:null}; actions[name]=a; return a; };
  room.leave=()=>window.__relay({kind:KIND,room:roomId,from:selfId,leave:true});
  setTimeout(()=>window.__relay({kind:KIND,room:roomId,from:selfId,join:true}),50);
  return room;
}
