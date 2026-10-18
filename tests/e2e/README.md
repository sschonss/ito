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
| `test_basics.py` | Tela inicial, arquivos do PWA, versões iguais em `app.js`/`sw.js`, código da sala, regra de "fora do lugar", mesmas cartas em todos os celulares |
| `test_offline.py` | Sem internet → aviso e Tentar de novo (não existe modo sem conexão) |
| `test_online_game.py` | Lobby (nomes, ordem, remover jogador), partida completa (votação, dicas, ordem combinada, revelação certa e errada, um por um, fim de jogo, resumo, jogar de novo), toques simultâneos, reações sem duplicar, tema da turma, telão, votação (empate, cancelar), só o anfitrião comanda |
| `test_pass.py` | Num celular só, sem internet: distribuir com tela escondida, dicas, ordem, revelar certo/errado, fim, jogar de novo, continuar após fechar, ver a carta de novo, mudar tema |
| `test_resilience.py` | Anfitrião cai, alguém segura e ele volta a ser anfitrião sem perder rodada; atualização perdida é corrigida pela conferência; dica e nome digitados não se perdem |

Os testes rodam automaticamente no GitHub Actions a cada push e pull request (`.github/workflows/e2e.yml`).
