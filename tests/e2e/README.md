# Testes end-to-end

Abrem o app de verdade no Chromium, simulando vários celulares (e um telão) jogando juntos.
A biblioteca de conexão é trocada por um relé falso (`fake_p2p.mjs`), então os testes não dependem de internet.

## Rodar no computador

```bash
pip install -r tests/e2e/requirements.txt
python -m playwright install chromium
python -m unittest discover -s tests/e2e -t tests/e2e -v
```

Capturas de tela de cada teste ficam em `tests/e2e/artifacts/`.

## O que é testado

| Arquivo | Cobre |
|---|---|
| `test_basics.py` | Tela inicial, arquivos do PWA, versões iguais em `js/core.js`/`sw.js`, código da sala, fora do lugar do maior para o menor (e a regra antiga), mesmas cartas em todos os celulares |
| `test_offline.py` | Sem internet → aviso e Tentar de novo (não existe modo sem conexão) |
| `test_online_game.py` | Lobby (nomes, ordem, remover jogador), partida completa (votação, dicas, barra do tema, revelação do maior para o menor, um por um, fim de jogo, resumo, jogar de novo), toques simultâneos, reações sem duplicar, tema da turma, telão, votação (empate, cancelar), só o anfitrião comanda |
| `test_pass.py` | Num celular só, sem internet: distribuir com tela escondida, dicas, barra do tema, revelar certo/errado do maior para o menor, fim, jogar de novo, continuar após fechar, ver a carta de novo, mudar tema |
| `test_security.py` | Link leva a impressão da chave do dono; estado falso (assinado por outro jogador, sem assinatura ou trocando a chave do dono) é ignorado; ninguém entra no lugar de outro jogador |
| `test_a11y.py` | Régua descrita para leitor de tela, rótulo da carta, opção de letra maior salva |
| `test_real_p2p.py` | Conexão de verdade pela internet (Nostr, MQTT e as duas). Só roda com `ITO_REAL_P2P=1` |
| `test_resilience.py` | Anfitrião cai, alguém segura e ele volta a ser anfitrião sem perder rodada; atualização perdida é corrigida pela conferência; dica e nome digitados não se perdem |
| `test_turn.py` | Credenciais TURN falsas chegam no Trystero; Worker fora, lento ou com resposta ruim não impede entrar; lista fixa de `config.js` continua valendo; o service worker não guarda a resposta |

Os testes rodam automaticamente no GitHub Actions a cada push e pull request (`.github/workflows/e2e.yml`).

O teste de conexão real roda uma vez por dia e pelo botão **Run workflow** (`.github/workflows/p2p-real.yml`). Para rodar no computador (precisa de internet):

```bash
cd tests/e2e && ITO_REAL_P2P=1 python -m unittest test_real_p2p -v
```
