# ito online

Versão web (PWA) do jogo cooperativo **ito**, para jogar com os amigos, cada um no próprio celular.

**Jogar:** https://sschonss.github.io/ito/

## Como funciona

Há dois jeitos de jogar:

- **Cada um no seu celular** (sala conectada): explicado abaixo.
- **Num celular só** (passa e joga): para jogar junto, passando o celular de mão em mão. Digita os nomes, cada um toca para ver a própria carta com a tela escondida dos outros, e depois o celular fica na mesa para arrumar a ordem e revelar. Funciona sem internet e dá para continuar a partida depois de fechar o app.

### Cada um no seu celular

- Quem cria a sala é o **anfitrião**: escolhe jogadores, rodadas e categorias, e manda o convite (link, QR code ou código de 8 letras).
- Cada pessoa coloca o próprio nome, se quiser. O anfitrião pode mudar a ordem ou tirar alguém da sala.
- A cada rodada cada um recebe uma carta de 1 a 100. Quando achar que é a sua vez, toca em **Baixar minha carta**. As cartas vão para a mesa do **maior para o menor**. O app mostra a mesa para todos e avisa quando uma carta sai **fora da ordem**.
- **Ordem da turma:** a turma arruma a ordem numa barra do tema, de cima para baixo. Em cima fica o extremo do 100 (por exemplo, “lotado”) e embaixo o do 1 (“vazio”). O anfitrião toca em **Revelar nessa ordem**. O app vira as cartas nessa sequência e confere sozinho (ninguém digita número, então não tem como errar ou mentir).
- **Régua da revelação:** no fim da rodada as cartas aparecem numa linha de 1 a 100, com nome, dica e a vez de cada um. Quem estava no alto da barra jogou primeiro.
- **Dica escrita:** cada um escreve a palavra que falou; ela aparece na mesa ao lado da carta.
- Antes de alguém baixar, dá para **trocar o tema**, **votar entre dois temas** ou **escrever um tema da turma**.
- **Reações** com emoji aparecem na tela de todos.
- **Conversa** na sala e durante a partida (botão no topo, com aviso de mensagem nova). Mostra quem falou e a hora. Quem entra depois ou reconecta vê as últimas mensagens. Na rodada, o app não envia um número de 1 a 100: a ordem se combina pela barra (maior em cima), sem digitar a carta. No telão, a última mensagem aparece por alguns segundos.
- **Modo telão:** uma TV ou notebook entra como mesa (sem carta) e mostra QR code, tema, cartas e dicas em tamanho grande.
- **Confete e sons** (gerados no próprio app, com opção de desligar no menu).
- **Resumo para compartilhar:** imagem com placar e destaques da partida, pronta para o WhatsApp.
- No fim aparece o placar da partida e o **placar da noite**.
- **O anfitrião é a verdade:** só ele começa, revela, passa a rodada, abre votação e muda o tema. A cada 2 segundos ele confere se todos os celulares estão iguais a ele e corrige quem ficou para trás.
- Se o anfitrião cair, o próximo jogador conectado segura a partida provisoriamente. Quando ele volta, reassume sem perder nada.
- Sem internet não tem jogo: o app mostra o aviso e o botão Tentar de novo.

## Temas

137 temas em 14 categorias, em três grupos:

- **Clássicos:** comida e bebida, lugares e viagens, bichos e natureza, cotidiano, diversão e cultura, trabalho e estudo, fantasia e aventura, sentimentos e situações.
- **Brasil:** comida brasileira, TV/novela/música, coisas de família, vida no Brasil.
- **Temáticos:** futebol e tecnologia (dá para jogar só com um deles).

Quem cria a sala escolhe as categorias; a escolha vai no código da sala (cabem até 14 categorias).

## Conexão

> Detalhes técnicos de como a conexão entre celulares funciona: [`docs/p2p.md`](docs/p2p.md).

- Os celulares se conectam direto entre si (WebRTC) usando [Trystero](https://github.com/dmotz/trystero), por **duas redes ao mesmo tempo** (Nostr e MQTT). Se uma falhar, a outra segura.
- A biblioteca vem do jsDelivr (com esm.sh de reserva) e fica guardada no celular depois da primeira vez.
- Para quem está no 4G/5G ou numa VPN, o app pede credenciais **TURN** de curta duração a um Worker da Cloudflare. Se isso falhar, usa a lista fixa de `config.js` (vazia por padrão) ou segue sem TURN. Detalhes: [`docs/turn.md`](docs/turn.md).
- Cada celular cria uma chave própria. O anfitrião **assina** cada atualização da partida e os outros só aceitam o que vier assinado pela chave certa; o convite leva a impressão digital da chave do dono da sala. Ninguém consegue se passar pelo anfitrião ou entrar no lugar de outro jogador.

## PWA

- Instalável na tela inicial e funciona offline.
- **Menu → Atualizar app** apaga o cache, remove o service worker e recarrega a versão mais recente.
- Quando uma versão nova é publicada, aparece o aviso “Nova versão disponível”.

## Publicar uma nova versão

1. Altere os arquivos.
2. Aumente `VERSION` em `js/core.js` **e** em `sw.js`.
3. Rode os testes (`python -m unittest discover -s tests/e2e -t tests/e2e`).
4. Faça o commit na branch `main`. O GitHub Pages publica sozinho e os testes rodam no Actions.

## Testes

Testes end-to-end com Playwright rodam a cada push e pull request no GitHub Actions. Veja [`tests/e2e/README.md`](tests/e2e/README.md) para rodar no computador.

Uma vez por dia (e pelo botão **Run workflow**) roda também o teste de **conexão real**: dois celulares se conectam pela internet usando as redes de verdade, cada rede separada e as duas juntas.

![Testes](https://github.com/sschonss/ito/actions/workflows/e2e.yml/badge.svg) ![Conexão real](https://github.com/sschonss/ito/actions/workflows/p2p-real.yml/badge.svg)

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Visual (tema claro e escuro) |
| `js/` | Lógica do jogo, em partes carregadas nesta ordem: `themes` (temas e ícones), `core` (estado, sorteio, código da sala, componentes), `home`, `crypto` (chaves e assinaturas), `net` (conexão e sincronia), `rules` (regras do anfitrião), `screens`, `effects` (sons, votação, destaques), `ruler` (régua e telão), `actions` (menu e botões), `chat` (conversa da sala), `pass` (celular só), `boot` (início) |
| `sw.js` | Service worker (cache offline) |
| `config.js` | Endereço das credenciais TURN e lista fixa opcional |
| `lib/qrcodegen.js` | Gerador de QR code (Project Nayuki, MIT) |
| `manifest.webmanifest` | Dados do app instalável |
| `icons/`, `fonts/` | Ícones e fonte Inter |
