/* ito — Temas e ícones */
'use strict';
/* ---------- Temas por categoria: [título, o que é 1, o que é 100] ---------- */
const CATS = [
  { name:'Comida e bebida', themes:[
    ['Comidas','odeio','amo'],['Doces','sem graça','delicioso'],['Bebidas','odeio','amo'],['Frutas','odeio','amo'],
    ['Café da manhã','sem chance','o melhor'],['Sabores de pizza','nunca peço','sempre peço'],['Lanches de cinema','dispensável','indispensável'],
    ['Comidas de festa','sobra','acaba primeiro'],['Pratos pela dificuldade','fácil','só chef'],['Comidas pela ardência','nada','fogo puro']]},
  { name:'Lugares e viagens', themes:[
    ['Lugares para viajar','nem pagando','sonho de vida'],['Lugares para um primeiro encontro','péssimo','ideal'],['Lugares pela temperatura','gelado','escaldante'],
    ['Lugares da cidade','vazio','lotado'],['Lugares para se esconder','óbvio','ninguém acha'],['Meios de transporte','desconfortável','confortável'],
    ['Itens para a mala','dispensável','essencial'],['Lugares para morar','nunca','sonho']]},
  { name:'Bichos e natureza', themes:[
    ['Animais','inofensivo','perigosíssimo'],['Bichos de estimação','sem graça','fofíssimo'],['Animais pelo tamanho','minúsculo','gigante'],
    ['Animais pela velocidade','lentíssimo','velocíssimo'],['Animais pela inteligência','nada esperto','genial'],['Plantas e flores','sem graça','linda'],
    ['Dias de clima','horrível','perfeito'],['Fenômenos da natureza','tranquilo','assustador']]},
  { name:'Cotidiano', themes:[
    ['Objetos de casa','inútil','indispensável'],['Tarefas domésticas','de boa','detesto'],['Coisas pelo preço','baratíssima','caríssima'],
    ['Coisas pelo peso','levíssima','pesadíssima'],['Coisas pelo tamanho','minúscula','gigante'],['Coisas pela idade','nova','antiquíssima'],
    ['Coisas pelo barulho','silenciosa','barulhenta'],['Aplicativos','esqueço que existe','viciante'],['Programas de domingo','tédio','perfeito'],
    ['Coisas que dá pra comprar com R$ 10','inútil','vale muito']]},
  { name:'Diversão e cultura', themes:[
    ['Filmes e séries','chato','emocionante'],['Músicas para festa','esvazia a pista','todo mundo dança'],['Esportes','fácil','dificílimo'],
    ['Hobbies','barato','caro'],['Talentos de show de calouros','vaia','aplausos de pé'],['Pessoas famosas','desconhecida','todo mundo conhece'],
    ['Jogos e brincadeiras','chato','viciante'],['Brinquedos de infância','esquecível','inesquecível'],['Presentes de aniversário','péssimo','perfeito']]},
  { name:'Trabalho e estudo', themes:[
    ['Profissões','tranquila','estressante'],['Profissões dos sonhos','nunca','nasci para isso'],['Matérias da escola','chata','legal'],
    ['Coisas para aprender','fácil','dificílimo'],['Desculpas para faltar ao trabalho','ridícula','convincente'],['Invenções','dispensável','mudou o mundo'],
    ['Habilidades do dia a dia','inútil','essencial'],['Profissões pelo salário','baixo','altíssimo']]},
  { name:'Fantasia e aventura', themes:[
    ['Superpoderes','inútil','incrível'],['Habilidades no apocalipse zumbi','inútil','salva vidas'],['Itens para uma ilha deserta','inútil','essencial'],
    ['Criaturas fantásticas','fofa','assustadora'],['Armas contra um monstro','inútil','vitória garantida'],['Vilões','bonzinho','maligno'],
    ['Desafios de aventura','moleza','impossível'],['Tesouros','bugiganga','fortuna']]},
  { name:'Sentimentos e situações', themes:[
    ['Coisas que dão medo','nada','pavor'],['Situações constrangedoras','tranquilo','quero sumir'],['Coisas que fazem chorar','nada','choro rios'],
    ['Gestos românticos','brega','derrete o coração'],['Mentiras','inocente','imperdoável'],['Lembranças de infância','nada nostálgica','muita saudade'],
    ['Coisas nojentas','de boa','nojento demais'],['Personalidades','calmíssima','explosiva'],['Dores','leve','insuportável'],['Coisas','dão sono','dão energia']]},
  { name:'Comida brasileira', group:'Brasil', themes:[
    ['Pratos típicos','odeio','amo'],['Salgados de festa','passo longe','pego três'],['Comidas de boteco','nunca peço','sempre peço'],
    ['Coisas para pôr no pão francês','sem graça','perfeito'],['Doces de festa junina','dispensável','indispensável'],['Coberturas de açaí','nunca','sempre'],
    ['Comidas de praia','evito','não vivo sem'],['Pratos para curar ressaca','não ajuda','ressuscita'],['Comidas pelo peso no estômago','leve','pesadíssima'],
    ['Bebidas de boteco','nunca peço','sempre peço']]},
  { name:'TV, novela e música', group:'Brasil', themes:[
    ['Gêneros musicais','desligo o rádio','aumento o volume'],['Programas de TV de domingo','sono','imperdível'],['Tipos de vilão de novela','bonzinho','malvadíssimo'],
    ['Músicas para karaokê','vergonha','show garantido'],['Bordões de TV','esquecido','todo mundo repete'],['Provas de reality show','moleza','desisto'],
    ['Ritmos para dançar','fico parado','danço a noite toda'],['Reviravoltas de novela','previsível','ninguém esperava'],['Desenhos da infância','esquecível','marcou a vida'],
    ['Memes brasileiros','já deu','ainda rio']]},
  { name:'Coisas de família', group:'Brasil', themes:[
    ['Coisas que mãe fala','raro','todo dia'],['Perguntas de tia no almoço','tranquila','constrangedora'],['Coisas da casa da vó','comum','só lá'],
    ['Tarefas no almoço de domingo','moleza','ninguém quer'],['Presentes de amigo secreto','péssimo','perfeito'],['Brigas de família','bobagem','histórica'],
    ['Coisas que pai faz','raro','sempre'],['Férias em família','tédio','inesquecível'],['Remédios caseiros','duvidoso','infalível'],
    ['Apelidos de família','carinhoso','vergonhoso']]},
  { name:'Vida no Brasil', group:'Brasil', themes:[
    ['Coisas do trânsito','tranquilo','caos'],['Fantasias de carnaval','discreta','chamativa'],['Coisas para levar à praia','dispensável','essencial'],
    ['Feriados','sem graça','o melhor do ano'],['Situações no ônibus','tranquila','pesadelo'],['Desculpas para chegar atrasado','esfarrapada','convincente'],
    ['Coisas de churrasco','dispensável','indispensável'],['Lugares no verão','fresquinho','derretendo'],['Gírias','antiga','atual'],
    ['Jeitinhos brasileiros','inocente','malandro demais']]},
  { name:'Futebol', group:'Temáticos', themes:[
    ['Posições no futebol','fácil','dificílimo'],['Motivos de briga no futebol','bobagem','guerra'],['Lances de futebol','sem graça','golaço'],
    ['Coisas de pelada de fim de semana','normal','só lá'],['Desculpas depois de perder','fraca','convincente'],['Comidas de estádio','dispensável','tradição'],
    ['Superstições de torcedor','bobagem','sagrada'],['Tipos de jogador na pelada','perna de pau','craque'],['Cantos de torcida','ninguém canta','estádio inteiro'],
    ['Campeonatos','sem graça','emocionante'],['Erros de juiz','perdoável','inaceitável'],['Momentos de uma partida','sem emoção','de parar o coração'],
    ['Comemorações de gol','sem graça','inesquecível']]},
  { name:'Tecnologia', group:'Temáticos', themes:[
    ['Gadgets','dispensável','indispensável'],['Problemas de computador','bobagem','desespero'],['Senhas','fraquíssima','impossível de quebrar'],
    ['Notificações do celular','ignoro','abro na hora'],['Redes sociais','nunca uso','vivo nela'],['Tecnologias antigas','ninguém lembra','saudade'],
    ['Invenções do futuro','bobagem','vai mudar tudo'],['Coisas que travam o celular','raro','sempre'],['Tarefas para pedir a uma IA','sem chance','perfeita'],
    ['Erros do corretor automático','inofensivo','desastre'],['Acessórios de celular','inútil','não saio sem'],['Videogames','chato','viciante'],
    ['Mensagens no grupo da família','normal','absurda']]}
];
CATS.forEach(c=>c.group=c.group||'Clássicos');
const ALL_MASK = (1<<CATS.length)-1;
const THEMES = CATS.flatMap((c,ci)=>c.themes.map(t=>[t[0],t[1],t[2],ci]));

/* ---------- Ícones ---------- */
const I = {
  share:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  text:'<svg viewBox="0 0 24 24"><path d="M3 19 8 5l5 14M5 14h6M14 19l3.5-8 3.5 8M15.2 16.5h4.6"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6"/></svg>',
  refresh:'<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  exit:'<svg viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></svg>',
  download:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  shuffle:'<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  chevron:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  thread:'<svg viewBox="0 0 40 16"><path d="M2 10c6-6 10 4 17-2s11 2 15-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="7" r="3" fill="currentColor"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>',
  broken:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3l-2 4 3 2-1.5 4M12 7.5c1.4-1.9 3-3 5-3 3.7 0 6 3.7 4.5 7.2C19.5 16.4 12 21 12 21"/></svg>'
};

Object.assign(I, {
  wifiOff:'<svg viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5-2.7M14 10.2a10 10 0 0 1 5 2.7M2 9.3a15 15 0 0 1 5-3M12 5a15 15 0 0 1 10 4.3"/><circle cx="12" cy="20" r="1"/></svg>',
  qr:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
  pencil:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  remove:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 9h6"/></svg>',
  list:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  play:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M12 8v8M8.5 12.5 12 16l3.5-3.5"/></svg>'
});
