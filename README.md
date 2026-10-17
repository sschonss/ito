# ito online

Versão web (PWA) do jogo cooperativo **ito**, para jogar com os amigos, cada um no próprio celular.

**Jogar:** https://sschonss.github.io/ito/

## Como funciona

- Quem cria a sala é o **anfitrião**: escolhe jogadores, rodadas e categorias, e manda o convite (link ou código de 8 letras).
- Os celulares se conectam direto entre si (WebRTC, via [Trystero](https://github.com/dmotz/trystero) com sinalização pela rede Nostr). Não há servidor próprio.
- O anfitrião distribui os lugares (ninguém pega o mesmo número) e mostra quem está na sala. Cada pessoa coloca o próprio nome, se quiser.
- Qualquer pessoa marca **Acertamos**, **Erramos** ou **Trocar tema**, e todos os celulares mudam juntos. No final aparece o placar.
- **Plano B:** se não conectar, ou se o anfitrião sair, dá para seguir em "modo sem conexão". O código da sala gera as mesmas cartas em todos os celulares e todos apertam o mesmo botão ao fim da rodada.

## PWA

- Instalável na tela inicial e funciona offline.
- **Menu → Atualizar app** apaga o cache, remove o service worker e recarrega a versão mais recente.
- Quando uma versão nova é publicada, aparece o aviso “Nova versão disponível”.

## Publicar uma nova versão

1. Altere os arquivos.
2. Aumente `VERSION` em `app.js` **e** em `sw.js`.
3. Faça o commit na branch `main`. O GitHub Pages publica sozinho.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Visual (tema claro e escuro) |
| `app.js` | Lógica do jogo |
| `sw.js` | Service worker (cache offline) |
| `manifest.webmanifest` | Dados do app instalável |
| `icons/`, `fonts/` | Ícones e fonte Inter |
