/* ito — Menu e ações dos botões */
'use strict';
/* ======================================================================
   Menu
   ====================================================================== */
let bigText=!!ls.get('ito-big',false);
document.documentElement.classList.toggle('big',bigText);
function openMenu(){
  const inPass=!!(S && S.mode==='pass'), inRoom=!inPass && !!(S||NET.role), items=[];
  if(inRoom){
    items.push(['share',I.share,'Convidar para a sala']);
    items.push(['qr',I.qr,'Mostrar QR code']);
    if(S && (S.history||[]).length) items.push(['showHistory',I.list,'Placar da noite']);
    items.push('hr');
  }
  if(inPass && (S.history||[]).length){ items.push(['showHistory',I.list,'Placar da noite']); items.push('hr'); }
  items.push(['toggleSound', soundOn?I.sound:I.mute, soundOn?'Sons: ligados':'Sons: desligados']);
  items.push(['toggleBig',I.text,bigText?'Letra maior: ligada':'Letra maior: desligada']);
  items.push(['rules',I.book,'Como jogar']);
  if(installEvt) items.push(['install',I.download,'Instalar app']);
  items.push(['hardUpdate',I.refresh,'Atualizar app']);
  if(inRoom){ items.push('hr'); items.push(['leave',I.exit,NET.role==='host'?'Encerrar sala':NET.spectator?'Fechar telão':'Sair da sala','danger']); }
  if(inPass){ items.push('hr'); items.push(['passQuit',I.exit,'Sair da partida','danger']); }
  $('#menuList').innerHTML=items.map(it=>it==='hr'?'<hr>':`<button data-act="${it[0]}" class="${it[3]||''}">${it[1]}<span>${it[2]}</span></button>`).join('');
  $('#versionLabel').textContent=`ito v${VERSION}`;
  $('#menu').showModal();
}

/* ======================================================================
   Ações
   ====================================================================== */
const reDraft=()=>view.querySelector('.pass-name')?passSetup(true):home(true);
const currentCode=()=>NET.code||(S&&S.code)||(P&&P.code);
const act={
  goHome(){ if(S||NET.role) return; history.replaceState(null,'',location.pathname); home(); },
  openMenu,
  toggleBig(){ bigText=!bigText; ls.set('ito-big',bigText); document.documentElement.classList.toggle('big',bigText); openMenu(); },
  step(b){ const k=b.dataset.k, d=+b.dataset.d;
    if(k==='rounds') draft.rounds=Math.min(MAX_ROUNDS,Math.max(MIN_ROUNDS,draft.rounds+d));
    reDraft(); },
  toggleCat(b){ draft.mask^=(1<<+b.dataset.v); reDraft(); },
  allCats(){ draft.mask=draft.mask===ALL_MASK?0:ALL_MASK; reDraft(); },
  create(){ if(!draft.mask) return; startHost(newRoom()); },
  join(){ const p=parseCode($('#code').value); if(!p){ $('#err').textContent='Código não encontrado. Confira as 8 letras.'; return; } startGuest(p); },
  resume(){
    const online=ls.get(ONLINE_KEY,null);
    if(online){ const r=parseCode(online.code); if(r){ online.role==='host'?startHost(r,online.st):startGuest(r,online.st,online.role==='tv'); return; } }
    home();
  },
  retry(){ startGuest(parseCode(NET.code), NET.st, NET.spectator); },
  joinTv(){ const p=parseCode($('#code').value); if(!p){ $('#err').textContent='Digite o código da sala para abrir o telão.'; return; } startGuest(p,null,true); },
  tipsOk(){ ls.set('ito-tips',true); showOnline(); },
  reactOpen(){ reactOpenState=!reactOpenState; const p=$('.react-pop'), f=$('.react-fab'); if(p) p.hidden=!reactOpenState; if(f){ f.textContent=reactOpenState?'✕':'😀'; f.classList.toggle('on',reactOpenState); } },
  async themeMenu(){
    const v=await dialog({title:'Mudar tema', body:'<p>Só dá para mudar antes de alguém baixar uma carta.</p>', actions:[
      {label:svgStroke(I.shuffle)+'Trocar por outro tema', value:'skip'},
      {label:svgStroke(I.vote)+'Votar entre dois temas', value:'voteStart'},
      {label:svgStroke(I.pencil)+'Escrever o nosso tema', value:'customTheme'},
      {label:'Cancelar', value:'no', cls:'text'}]});
    if(v==='skip') act.skip(); else if(v==='voteStart') act.voteStart(); else if(v==='customTheme') act.customTheme();
  },
  saveHint(){ const i=$('#myHint'); if(!i) return; const text=i.value.trim().slice(0,30); i.blur(); delete drafts.hint; sendAct('hint',{text}); toast(text?`Dica enviada: “${text}”`:'Dica apagada'); },
  async react(b){ const now=Date.now(); if(now-lastReact<700) return; lastReact=now; const e=b.dataset.e, by=myLabel();
    showReaction(e, by); SFX.pop();
    const msg=await seal({t:'react', e, by});
    seenReacts.add(msg.id); noteRelay(msg.id);
    broadcast(msg); },
  voteStart(){ sendAct('voteStart'); },
  vote(b){ sendAct('vote',{i:+b.dataset.i}); },
  voteEnd(){ sendAct('voteEnd'); },
  planMove(b){ const o=planOrder(), seat=+b.dataset.s, i=o.indexOf(seat), j=i+(+b.dataset.d); if(i<0||j<0||j>=o.length) return;
    [o[i],o[j]]=[o[j],o[i]]; S.plan=o; game(); sendAct('plan',{order:o}); },
  async revealPlan(){
    const o=planOrder();
    if(!o.length) return;
    if(!await confirmBox(o.length>1?'Todos concordam com a ordem?':'Revelar a última carta?', `${orderScale(o.map(s=>`<li>${esc(nameOf(s))}${S.hints[s]?` · “${esc(S.hints[s])}”`:''}</li>`).join(''),'confirm')}<p>As cartas vão virar de cima para baixo.</p>`, 'Revelar')) return;
    sendAct('reveal',{order:o});
  },
  toggleSound(){ soundOn=!soundOn; ls.set('ito-sound',soundOn); if(soundOn){ audio(); SFX.pop(); } toast(soundOn?'Sons ligados':'Sons desligados'); },
  async shareSummary(){
    const blob=await summaryImage(); if(!blob){ toast('Não foi possível criar a imagem'); return; }
    const file=new File([blob],'ito-resumo.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], title:'ito', text:'Nosso resumo no ito'}); }catch(e){} return; }
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ito-resumo.png'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000); toast('Imagem salva');
  },
  saveName(){
    const inp=$('#myName'); if(!inp) return;
    myName=inp.value.trim().slice(0,20); ls.set('ito-name',myName); inp.blur(); delete drafts.name;
    if(NET.role==='host'){ const me=NET.st.players.find(p=>p.cid===CID); if(me){ me.name=myName; hostCommit(); } }
    else if(NET.role==='guest') guestSend({t:'name', name:myName});
    toast(myName?`Pronto, ${myName}`:'Nome removido');
  },
  start(){ sendAct('start'); },
  async playerMenu(b){
    const cid=b.dataset.cid, st=NET.st, p=st.players.find(p=>p.cid===cid); if(!p) return;
    const acts=[];
    if(p.seat>1) acts.push({label:svgStroke(I.up)+'Subir na ordem',value:'up'});
    if(p.seat<st.players.length) acts.push({label:svgStroke(I.down)+'Descer na ordem',value:'down'});
    if(cid!==CID) acts.push({label:svgStroke(I.remove)+'Tirar da sala',value:'kick',cls:'danger-soft'});
    acts.push({label:'Fechar',value:'no',cls:'text'});
    const v=await dialog({title:p.name||`Jogador ${p.seat}`, body:'', actions:acts});
    if(v==='up'||v==='down') sendAct('move',{cid, dir:v==='up'?-1:1});
    if(v==='kick' && await confirmBox('Tirar da sala?',`${esc(p.name||'Jogador '+p.seat)} sai da sala e não consegue voltar por esse convite.`,'Tirar')) sendAct('kick',{cid});
  },
  async copy(){ const code=currentCode(); try{ await navigator.clipboard.writeText(roomLink(code)); toast('Link copiado'); }catch(e){ toast('Código da sala: '+code); } },
  async share(){ const code=currentCode();
    if(navigator.share){ try{ await navigator.share({title:'ito', text:`Bora jogar ito! Código da sala: ${code}`, url:roomLink(code)}); }catch(e){} return; }
    act.copy(); },
  qr(){
    const code=currentCode(); let svg='';
    try{ svg=qrSvg(roomLink(code)); }catch(e){ toast('Não foi possível gerar o QR code'); return; }
    dialog({title:'Entrar pela câmera', body:`<div class="qr-wrap">${svg}</div><p class="center">Aponte a câmera do celular para o código.<br><b>${code}</b></p>`, actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  peek(){
    if(S.mode==='online' && S.table.some(t=>t.seat===S.seat)) return;
    peek=!peek;
    document.querySelectorAll('.card').forEach(c=>{ c.classList.toggle('up',peek); if(c.dataset.act==='peek') c.setAttribute('aria-label',peek?'Sua carta: '+deck()[S.seat-1]:'Carta escondida'); });
    const h=$('.hint'); if(h) h.textContent=peek?'Toque para esconder':'Toque na carta para ver seu número';
  },
  async playCard(){
    const mine=deck()[S.seat-1];
    if(!await confirmBox('Baixar sua carta?',`Sua carta <b>${mine}</b> vai para a mesa e todos vão ver.`,'Baixar')) return;
    sendAct('play');
  },
  next(){ if(Date.now()<nextReadyAt) return; pending_next=true; showOnline(); sendAct('next'); setTimeout(()=>{ if(pending_next){ pending_next=false; showOnline(); } }, 4000); },
  async customTheme(){
    const v=await dialog({title:'Escrever tema', body:`<p>Crie um tema só para esta rodada.</p>
      <label class="fld">Tema<input id="ctTitle" maxlength="60" placeholder="Ex.: Coisas que o tio fala no churrasco"></label>
      <div class="grid2"><label>1 é…<input id="ctLow" maxlength="30" placeholder="pouco"></label><label>100 é…<input id="ctHigh" maxlength="30" placeholder="muito"></label></div>`,
      actions:[{label:'Cancelar',value:'no'},{label:'Usar tema',value:'ok',cls:'brand'}]});
    if(v!=='ok') return;
    const title=$('#ctTitle').value.trim(); if(!title){ toast('Escreva o tema'); return; }
    sendAct('custom',{title, low:$('#ctLow').value.trim()||'pouco', high:$('#ctHigh').value.trim()||'muito'});
  },
  showHistory(){
    const h=S.history||[];
    dialog({title:'Placar da noite', body:h.length?`<ul class="hist">${h.map(x=>`<li><span>Partida ${x.game}</span><strong>${x.score} de ${x.total}</strong></li>`).join('')}</ul>`:'<p>Nenhuma partida terminada ainda.</p>', actions:[{label:'Fechar',value:'ok',cls:'brand'}]});
  },
  skip(){ sendAct('skip'); },
  restart(){ sendAct('restart'); },
  rules(){
    const desc=!S || descending(S);
    dialog({title:'Como jogar', body:`
      <ol>
        <li>A cada rodada, cada pessoa recebe <b>uma carta</b> secreta de <b>1 a 100</b>.</li>
        <li>Leiam o <b>tema</b>. Cada um descreve sua carta com algo do tema, sem dizer o número. Ex.: no tema “Comidas”, quem tem 95 pode dizer “pizza”.</li>
        <li>Quando achar que é a sua vez, toque em <b>Baixar minha carta</b>. As cartas vão para a mesa ${desc?'do <b>maior para o menor</b>':'em <b>ordem crescente</b>'}.</li>
        <li>${desc?'Se alguém baixar uma carta menor que a de outra pessoa que ainda não baixou':'Se alguém baixar uma carta maior que a de outra pessoa que ainda não baixou'}, o app avisa: <b>fora da ordem</b>.</li>
      </ol>
      <p><b>Criar a sala:</b> escolha quantas rodadas e os assuntos dos temas, e mande o convite (link ou QR code). Cada um coloca o próprio nome, se quiser.</p>
      <p><b>Num celular só:</b> digite os nomes e passe o celular. Cada um toca para ver a própria carta e esconde antes de passar. No fim, a turma arruma a ordem e revela.</p>
      <p><b>Anfitrião:</b> quem cria a sala comanda a partida: começa, revela as cartas, passa a rodada, abre votação e muda o tema. Se cair, outra pessoa segura até ele voltar.</p>
      <p><b>Ordem da turma:</b> arrumem pela barra do tema, de cima para baixo. ${desc?'Em cima fica o extremo do 100 (no tema “Lugares da cidade”, <b>lotado</b>) e embaixo o do 1 (<b>vazio</b>). Se o tema da turma não tiver esses extremos, a barra diz <b>maior</b> e <b>menor</b>.':'Nesta sala a barra ainda vai do menor para o maior.'} Quando todos concordarem, o anfitrião toca em <b>Revelar nessa ordem</b>. O app vira as cartas e confere sozinho.</p>
      <p><b>Dica:</b> escreva a palavra que você falou. Ela aparece na mesa para todos.</p>
      <p><b>Tema:</b> antes de alguém baixar, dá para trocar, votar entre dois temas ou escrever um tema da turma.</p>
      <p><b>Conversa:</b> o botão no topo abre o chat da sala, no lobby e durante a partida. Dá para combinar quem fica em cima na barra, sem dizer o número. Na rodada, mensagem com número de 1 a 100 não sai.</p>
      <p><b>Telão:</b> uma TV ou notebook pode entrar como mesa, mostrando tudo em tamanho grande. A última mensagem da conversa aparece rapidinho.</p>
      <p><b>No final</b> aparece o placar da partida e, se jogarem várias, o placar da noite.</p>`,
      actions:[{label:'Entendi',value:'ok',cls:'brand'}]});
  },
  async leave(){
    if(NET.role==='host'){
      if(!await confirmBox('Encerrar a sala?','A sala acaba para todo mundo.','Encerrar')) return;
      await hostNotice('closed'); await new Promise(r=>setTimeout(r,250));
    } else if(NET.role==='guest'){
      if(!NET.spectator && NET.st && NET.st.phase!=='lobby' && !await confirmBox('Sair da sala?','Você pode voltar depois pelo mesmo link.','Sair')) return;
      if(NET.st) await guestSend({t:'bye'}); await new Promise(r=>setTimeout(r,150));
    } else if(S && S.status==='play' && !await confirmBox('Sair da sala?','O progresso desta partida será apagado deste celular.','Sair')) return;
    netReset(); ls.del(ONLINE_KEY); S=null; P=null;
    history.replaceState(null,'',location.pathname); home();
  },
  async install(){ if(!installEvt) return; installEvt.prompt(); try{ await installEvt.userChoice; }catch(e){} installEvt=null; if(!S && !P && !NET.role) home(true); },
  applyUpdate(){ if(swReg && swReg.waiting){ window.__itoUpdating=true; swReg.waiting.postMessage({type:'SKIP_WAITING'}); } else hardUpdate(); },
  hardUpdate(){ hardUpdate(); }
};
