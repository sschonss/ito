/* ito — Tela inicial */
'use strict';
/* ======================================================================
   Tela inicial
   ====================================================================== */
function catChips(){
  const groups=[...new Set(CATS.map(c=>c.group))];
  return groups.map(g=>`<p class="cat-group">${g}</p><div class="cats">${CATS.map((c,i)=>c.group!==g?'':`<button class="cat ${draft.mask&(1<<i)?'on':''}" data-act="toggleCat" data-v="${i}" aria-pressed="${!!(draft.mask&(1<<i))}">${c.name}<small>${c.themes.length}</small></button>`).join('')}</div>`).join('');
}
function home(keep){
  const typed=keep && $('#code') ? $('#code').value : '';
  S=null; P=null; setMeta(''); document.body.classList.remove('tv'); chatOnScreen();
  ls.del('ito-game-v2');   // dados do antigo modo sem conexão
  const online=ls.get(ONLINE_KEY,null), pass=ls.get(PASS_KEY,null);
  const resume= pass && pass.mode==='pass' && !online ? `<button class="resume" data-act="passResume"><span class="dot"></span>
      <span><strong>Continuar no celular</strong><span>${esc(pass.names.filter(Boolean).slice(0,3).join(', ')||'Partida')} · rodada ${Math.min(pass.round,pass.rounds)} de ${pass.rounds}</span></span>${svgStroke(I.chevron)}</button>` : online?`<button class="resume" data-act="resume"><span class="dot"></span>
      <span><strong>${online.role==='tv'?'Voltar para o telão':'Voltar para a sala'}</strong><span>Sala ${online.code}${online.role==='host'?' · você é o anfitrião':''}</span></span>${svgStroke(I.chevron)}</button>`:'';
  render(`
  <section class="hero">
    <p class="eyebrow">Jogo cooperativo</p>
    <h1>Pense no número.<br><em>Fale o tema.</em></h1>
    <p>Junte a turma, cada um no seu celular, e descubram juntos a ordem das cartas.</p>
  </section>
  ${resume}
  ${installEvt?`<div class="install"><p>Coloque o ito na tela inicial e abra como um app.</p><button class="btn brand" data-act="install">Instalar</button></div>`:''}
  <section class="panel">
    <h2>Criar sala</h2>
    <p class="lead">Cada um joga no próprio celular, por link ou QR code.</p>
    <div class="field-group"><span class="label">Rodadas</span>${stepper('rounds',draft.rounds,MIN_ROUNDS,MAX_ROUNDS,draft.rounds===1?'rodada':'rodadas')}</div>
    <div class="field-group">
      <div class="cat-head"><span class="label">Categorias de tema</span><button class="link-btn" data-act="allCats">${draft.mask===ALL_MASK?'Limpar':'Todas'}</button></div>
      ${catChips()}
    </div>
    <button class="btn brand" data-act="create" ${draft.mask?'':'disabled'}>Criar sala</button>
  </section>
  <section class="panel pass-card">
    <h2>Jogar num celular só</h2>
    <p class="lead">Para jogar junto, passando o celular de mão em mão. Funciona sem internet.</p>
    <button class="btn soft" data-act="passSetup">Montar partida</button>
  </section>

  <section class="panel">
    <h2>Entrar numa sala</h2>
    <p class="lead">Abra o link do convite, leia o QR code ou digite o código.</p>
    <input id="code" class="field" placeholder="ABCD-EFGH" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" enterkeyhint="go">
    <p class="err" id="err"></p>
    <button class="btn" data-act="join">Entrar</button>
    <button class="btn text tv-join" data-act="joinTv">${svgStroke(I.tv)}Entrar como telão (TV ou notebook)</button>
  </section>
  <div class="foot"><button data-act="rules">Como jogar</button>·<button data-act="hardUpdate">Atualizar app</button></div>`, false, keep);
  const input=$('#code'); input.value=typed;
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') act.join(); });
  input.addEventListener('input',()=>{ $('#err').textContent=''; const raw=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,8); input.value=raw.length>4?raw.slice(0,4)+'-'+raw.slice(4):raw; });
}
