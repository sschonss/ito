# ito online

Versão web (PWA) do jogo cooperativo **ito**, para jogar com os amigos, cada um no próprio celular.

**Jogar:** https://sschonss.github.io/ito/

## Como funciona

- Quem cria a sala escolhe o número de jogadores, quantas rodadas, as categorias de tema e, se quiser, os nomes da turma.
- A cada rodada cada pessoa recebe **uma carta** de 1 a 100 e um tema em comum.
- O convite (link ou código de 8 letras) leva tudo isso. Os nomes só vão pelo link.
- Ao fim de cada rodada, todos apertam o mesmo botão (**Acertamos** ou **Erramos**). No final aparece o placar.
- Se algum celular ficar diferente, use **Menu → Corrigir rodada**.

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
