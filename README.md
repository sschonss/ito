# ito online

Versão web (PWA) do jogo cooperativo **ito**, para jogar com os amigos, cada um no próprio celular.

**Jogar:** https://sschonss.github.io/ito/

## Como funciona

- Quem cria a sala é o **anfitrião**: escolhe jogadores, rodadas e categorias, e manda o convite (link, QR code ou código de 8 letras).
- Cada pessoa coloca o próprio nome, se quiser. O anfitrião pode mudar a ordem ou tirar alguém da sala.
- A cada rodada cada um recebe uma carta de 1 a 100. Quando achar que é a sua vez, toca em **Baixar minha carta**. O app mostra a mesa para todos e avisa quando uma carta sai **fora da ordem**.
- **Ordem da turma:** a turma arruma no app quem baixa primeiro, segundo, terceiro… e o anfitrião toca em **Revelar nessa ordem**. O app vira as cartas em sequência e confere sozinho (ninguém digita número, então não tem como errar ou mentir).
- **Régua da revelação:** no fim da rodada as cartas aparecem numa linha de 1 a 100, com nome, dica e ordem de cada um.
- **Dica escrita:** cada um escreve a palavra que falou; ela aparece na mesa ao lado da carta.
- Antes de alguém baixar, dá para **trocar o tema**, **votar entre dois temas** ou **escrever um tema da turma**.
- **Reações** com emoji aparecem na tela de todos.
- **Modo telão:** uma TV ou notebook entra como mesa (sem carta) e mostra QR code, tema, cartas e dicas em tamanho grande.
- **Confete e sons** (gerados no próprio app, com opção de desligar no menu).
- **Resumo para compartilhar:** imagem com placar e destaques da partida, pronta para o WhatsApp.
- No fim aparece o placar da partida e o **placar da noite**.
- **O anfitrião é a verdade:** só ele começa, revela, passa a rodada, abre votação e muda o tema. A cada 2 segundos ele confere se todos os celulares estão iguais a ele e corrige quem ficou para trás.
- Se o anfitrião cair, o próximo jogador conectado segura a partida provisoriamente. Quando ele volta, reassume sem perder nada.
- Sem internet não tem jogo: o app mostra o aviso e o botão Tentar de novo.

## Conexão

> Detalhes técnicos de como a conexão entre celulares funciona: [`docs/p2p.md`](docs/p2p.md).

- Os celulares se conectam direto entre si (WebRTC) usando [Trystero](https://github.com/dmotz/trystero), por **duas redes ao mesmo tempo** (Nostr e MQTT). Se uma falhar, a outra segura.
- A biblioteca vem do jsDelivr (com esm.sh de reserva) e fica guardada no celular depois da primeira vez.
- Para quem está no 4G/5G, um servidor **TURN** ajuda muito. Veja as instruções em `config.js`.

## PWA

- Instalável na tela inicial e funciona offline.
- **Menu → Atualizar app** apaga o cache, remove o service worker e recarrega a versão mais recente.
- Quando uma versão nova é publicada, aparece o aviso “Nova versão disponível”.

## Publicar uma nova versão

1. Altere os arquivos.
2. Aumente `VERSION` em `app.js` **e** em `sw.js`.
3. Rode os testes (`python -m unittest discover -s tests/e2e -t tests/e2e`).
4. Faça o commit na branch `main`. O GitHub Pages publica sozinho e os testes rodam no Actions.

## Testes

Testes end-to-end com Playwright rodam a cada push e pull request no GitHub Actions. Veja [`tests/e2e/README.md`](tests/e2e/README.md) para rodar no computador.

![Testes](https://github.com/sschonss/ito/actions/workflows/e2e.yml/badge.svg)

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Visual (tema claro e escuro) |
| `app.js` | Lógica do jogo |
| `sw.js` | Service worker (cache offline) |
| `config.js` | Servidor TURN opcional |
| `lib/qrcodegen.js` | Gerador de QR code (Project Nayuki, MIT) |
| `manifest.webmanifest` | Dados do app instalável |
| `icons/`, `fonts/` | Ícones e fonte Inter |
