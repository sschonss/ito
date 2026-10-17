# ito online

Versão web (PWA) do jogo cooperativo **ito**, para jogar com os amigos, cada um no próprio celular.

**Jogar:** https://sschonss.github.io/ito/

## Como funciona

- Não há servidor. O código da sala (ex.: `PATO-4`) é uma semente: todos os celulares calculam as mesmas cartas e os mesmos temas, mas cada pessoa vê só as suas.
- A conversa acontece ao vivo ou por chamada de voz.
- Ao fim de cada rodada, todos apertam o mesmo botão (**Acertamos** ou **Erramos**), e os celulares continuam sincronizados.
- Se algum celular ficar diferente, use **Menu → Ajustar sincronia**.

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
