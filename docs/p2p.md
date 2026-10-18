# Como funciona a conexão entre celulares (P2P)

O ito roda só com o **GitHub Pages**, que serve arquivos estáticos (HTML, CSS, JS) e não executa nada no servidor. Mesmo assim, vários celulares jogam juntos em tempo real. Este documento explica como isso foi feito.

**Resumo:** os celulares conversam **direto entre si** por WebRTC. Para se encontrarem pela primeira vez, usam **redes públicas e gratuitas de sinalização** (Nostr e MQTT) por meio da biblioteca [Trystero](https://github.com/dmotz/trystero). Quem cria a sala vira o **anfitrião** e é a **única fonte da verdade**: só ele altera o estado da partida, avisa os outros a cada mudança e confere a cada 2 segundos se todos estão iguais a ele. As cartas não trafegam pela rede, porque cada celular calcula as mesmas cartas a partir do código da sala.

---

## 1. As peças

| Peça | O que faz | Onde |
|---|---|---|
| GitHub Pages | Serve o app (arquivos estáticos) | `index.html`, `js/*.js`, `styles.css` |
| WebRTC (data channel) | Canal direto e criptografado entre dois celulares | navegador |
| Trystero | Monta as conexões WebRTC e cuida da sinalização | carregado do jsDelivr (`@trystero-p2p/nostr` e `@trystero-p2p/mqtt`, v0.25.4) |
| Relays Nostr e brokers MQTT públicos | "Quadro de avisos" onde os celulares trocam os dados para se conectar | serviços de terceiros, gratuitos |
| STUN (Google, padrão do Trystero) | Ajuda cada celular a descobrir seu endereço público | serviço de terceiros |
| TURN (opcional) | Retransmite o tráfego quando a conexão direta é bloqueada (comum no 4G/5G) | `config.js` |
| Service worker | Guarda o app e a biblioteca no celular | `sw.js` |

### Camadas dentro do app

```mermaid
flowchart TB
  UI["Telas<br/>home · lobby · game · tv"]
  ACT["Ações do usuário<br/>act.* (botões)"]
  RULES["Regras do jogo<br/>applyAct · markOutOfPlace · checkRoundOver"]
  STATE["Estado oficial<br/>NET.st (só o anfitrião altera)"]
  NETL["Rede<br/>connect · onMsg · broadcast · sendTo"]
  TRY["Trystero<br/>Nostr + MQTT"]
  DET["Sorteio determinístico<br/>deckFor · themeAt"]
  UI --> ACT
  ACT -- "anfitrião: aplica direto" --> RULES
  ACT -- "convidado: envia act" --> NETL
  NETL --> TRY
  TRY --> NETL
  NETL -- "act recebido (anfitrião)" --> RULES
  RULES --> STATE
  STATE -- "hostCommit: state para todos" --> NETL
  NETL -- "state recebido (convidado)" --> UI
  DET --> UI
  DET --> RULES
```

## 2. Visão geral

```mermaid
flowchart LR
  subgraph Internet pública
    GH[GitHub Pages<br/>arquivos do app]
    N[(Relays Nostr)]
    M[(Brokers MQTT)]
  end
  A[📱 Anfitrião] -- baixa o app --> GH
  B[📱 Convidado] -- baixa o app --> GH
  A -. sinalização .-> N & M
  B -. sinalização .-> N & M
  A <== WebRTC direto<br/>(estado da partida) ==> B
```

1. Todos baixam o app do GitHub Pages.
2. Cada celular entra numa "sala" de sinalização com o nome do código da sala (ex.: `KQXT-AVCR`).
3. Pelos relays, os celulares trocam as ofertas WebRTC (SDP e candidatos ICE).
4. A conexão direta abre e, a partir daí, **a partida trafega só entre os celulares**. Os relays deixam de ser usados.

### Passo a passo da conexão

```mermaid
sequenceDiagram
  autonumber
  participant A as 📱 Celular A
  participant R as Relays (Nostr / MQTT)
  participant S as STUN
  participant B as 📱 Celular B
  A->>R: entra no tópico da sala (hash do código + appId)
  B->>R: entra no mesmo tópico
  R-->>A: B está aqui
  A->>S: qual é meu endereço público?
  S-->>A: IP:porta
  A->>R: oferta WebRTC (SDP), cifrada com a senha da sala
  R-->>B: oferta
  B->>S: qual é meu endereço público?
  B->>R: resposta WebRTC (SDP)
  R-->>A: resposta
  A->>B: candidatos ICE (via relays)
  B->>A: candidatos ICE (via relays)
  alt caminho direto funciona
    A->>B: data channel direto (DTLS, criptografado)
    B->>A: dados nos dois sentidos
  else NAT bloqueia (comum no 4G/5G)
    A->>B: via servidor TURN (se configurado em config.js)
  end
  Note over A,B: daqui em diante os relays não são mais usados
```

## 3. Duas redes ao mesmo tempo

O app entra na mesma sala por **duas redes de sinalização em paralelo**: Nostr e MQTT. Se uma estiver fora do ar ou bloqueada, a outra segura.

```js
// js/net.js — connect()
const P2P = {
  n: ['https://cdn.jsdelivr.net/npm/@trystero-p2p/nostr@0.25.4/+esm', 'https://esm.sh/@trystero-p2p/nostr@0.25.4'],
  m: ['https://cdn.jsdelivr.net/npm/@trystero-p2p/mqtt@0.25.4/+esm',  'https://esm.sh/@trystero-p2p/mqtt@0.25.4']
};
const room = lib.joinRoom({ appId: APP_ID, password: code, turnConfig }, code);
```

- Cada rede tem um endereço reserva (esm.sh) caso o jsDelivr falhe.
- A senha da sala é o próprio código: a negociação só é entendida por quem tem o código.
- Como dois celulares podem ficar conectados **pelas duas redes**, cada conexão recebe um prefixo (`n:abc123`, `m:xyz789`), e o app mapeia as duas para a mesma pessoa (o `CID`, um identificador guardado no celular).
- Todas as mensagens são **idempotentes**: receber a mesma coisa duas vezes não muda nada. As reações têm um `id` para não aparecerem duplicadas.

```mermaid
flowchart LR
  subgraph Ana
    AN["conexão n:a1"]
    AM["conexão m:a2"]
  end
  subgraph Luiz [Luiz · anfitrião]
    MAP["NET.peers<br/>n:a1 → cid da Ana<br/>m:a2 → cid da Ana"]
    DEDUP{"já processado?<br/>ver antigo, round antigo<br/>ou id de reação repetido"}
  end
  AN -- "Nostr" --> MAP
  AM -- "MQTT" --> MAP
  MAP --> DEDUP
  DEDUP -- "novo" --> OK[aplica]
  DEDUP -- "repetido" --> IGN[ignora]
```

Ana só é considerada **desconectada** quando as duas conexões caem.

## 4. O código da sala carrega a configuração

O código tem 8 letras, como `KQXT-AVCR`:

- `KQXT`: sorteio da sala, que serve de semente das cartas e dos temas.
- `AVCR`: número de jogadores, número de rodadas e categorias de tema, codificados em base 24, sem as letras I e O para evitar confusão.

```js
// valor = ((jogadores-2) * 20 + (rodadas-1)) * 256 + máscara_de_categorias
function enc(n, rounds, mask) { ... }      // → 4 letras
function parseCode(raw) { ... }            // → { code, n, rounds, mask }
```

Assim, quem digita o código já sabe as regras da sala antes mesmo de conectar.

```mermaid
flowchart LR
  CODE["K Q X T - A V C R"] --> SEED["KQXT<br/>sorteio da sala<br/>semente das cartas e temas"]
  CODE --> CFG["AVCR<br/>4 letras em base 24"]
  CFG --> NUM["número = A·24³ + V·24² + C·24 + R"]
  NUM --> J["jogadores = número ÷ 256 ÷ 20 + 2"]
  NUM --> RD["rodadas = (número ÷ 256) mod 20 + 1"]
  NUM --> CAT["categorias = número mod 256<br/>(1 bit por categoria)"]
```

## 5. Ninguém envia as cartas: sorteio determinístico

Todos os celulares geram **o mesmo baralho embaralhado** a partir da mesma semente:

```js
const deckFor = (code, game, round) => shuffle([1..100], rng(code + '|' + game + '|' + round));
// carta do jogador no lugar N = deckFor(...)[N-1]
```

- `rng` é um gerador pseudoaleatório (xmur3 + mulberry32): mesma semente, mesma sequência, em qualquer aparelho.
- O tema da rodada usa a mesma ideia (`themeAt(code, posição)`).
- Consequência: a rede só transmite **decisões** (quem jogou, ordem, votos, dicas), nunca números. Ninguém digita a própria carta, então ninguém consegue mentir pelo app.

```mermaid
flowchart TB
  SEMENTE["semente = código | partida | rodada<br/>ex.: KQXT-AVCR|1|2"] --> RNG["rng (xmur3 + mulberry32)"]
  RNG --> EMB["embaralha 1…100<br/>(Fisher–Yates)"]
  EMB --> D["baralho: 57, 12, 88, 31, …"]
  D --> L1["lugar 1 (Luiz) → 57"]
  D --> L2["lugar 2 (Ana) → 12"]
  D --> L3["lugar 3 (Pedro) → 88"]
  subgraph "cada celular faz a mesma conta"
    RNG
    EMB
  end
```

Cada celular mostra só a própria carta. As outras só aparecem quando vão para a mesa.

## 6. Anfitrião: a fonte da verdade

Para evitar conflitos (dois celulares discordando do estado), **um celular manda**: o anfitrião.

```mermaid
sequenceDiagram
  participant C as 📱 Convidado (Ana)
  participant H as 📱 Anfitrião (Luiz)
  participant O as 📱 Outro (Pedro)
  C->>H: hello {cid, nome}
  H->>H: dá um lugar livre (sem repetir)
  H-->>C: state {estado completo, ver: 12}
  H-->>O: state {…, ver: 12}
  Note over C,O: durante o jogo
  C->>H: act {t:"reveal", game, round, order}
  H->>H: applyAct(): valida e aplica a regra
  H-->>C: state {…, ver: 13}
  H-->>O: state {…, ver: 13}
```

### Estado (`NET.st`)

```js
{
  code, rounds, mask,             // configuração da sala
  ownerCid, hostCid, ver,         // dono da sala, quem comanda agora e a versão do estado
  players: [{seat, cid, name, on}],
  phase: 'lobby' | 'play' | 'done',
  game, round, results, themePos, // andamento
  table: [{seat, card, ok}],      // cartas na mesa, na ordem em que foram reveladas
  plan, hints, vote, custom,      // ordem combinada, dicas, votação, tema da turma
  log, history, ev                // registro das rodadas, placar da noite, último evento
}
```

Cada mudança aumenta `ver`, e o anfitrião envia o estado inteiro para todos (`hostCommit()`). Os convidados aceitam só estados mais novos (`newerState()`).

### Mensagens

| Mensagem | De → para | Para quê |
|---|---|---|
| `hello {cid, name, spectator}` | todos → todos | Apresentação. O anfitrião dá um lugar, o telão (`spectator`) só assiste |
| `state {st}` | anfitrião → todos | Estado oficial completo |
| `act {a}` | convidado → anfitrião | Pedido de ação dos jogadores: `play` (baixar a própria carta), `plan` (arrumar a ordem), `vote`, `hint` |
| `ack {ver, h}` | convidado → anfitrião | "Recebi a versão `ver`, com impressão digital `h`" |
| `tick {ver, h}` | anfitrião → todos | Conferência a cada 2 s: versão e impressão digital do estado oficial |
| `pull` | convidado → anfitrião | "Estou diferente, me manda o estado de novo" |
| `name {name}` | convidado → anfitrião | Mudou o nome |
| `bye` | convidado → anfitrião | Saiu da sala |
| `react {e, by, id}` | qualquer → todos | Reação com emoji (não passa pelo estado) |
| `full` / `kicked` / `closed` | anfitrião → convidado | Sala cheia, removido ou sala encerrada |

### Telão (TV ou notebook)

```mermaid
flowchart LR
  TV["📺 Telão"] -- "hello {spectator: true}" --> H["📱 Anfitrião"]
  H -- "state (não ganha lugar nem carta)" --> TV
  H -- "state" --> J1["📱 Jogadores"]
  J1 -- "react" --> TV
```

### Ciclo da partida

```mermaid
stateDiagram-v2
  [*] --> lobby: dono cria a sala
  lobby --> lobby: hello · name · kick · move
  lobby --> jogando: start (anfitrião)
  state jogando {
    [*] --> rodada
    rodada --> rodada: hint · plan · vote · skip · custom · voteStart
    rodada --> rodada: play (uma carta)
    rodada --> revelada: reveal (anfitrião) ou última carta jogada
    revelada --> rodada: next (anfitrião)
  }
  jogando --> fim: next na última rodada
  fim --> jogando: restart (anfitrião)
  fim --> [*]: encerrar sala
```

### Só o anfitrião comanda

`start`, `reveal`, `next`, `restart`, `voteStart`, `voteEnd`, `skip`, `custom`, `kick` e `move` só são aceitos quando vêm do anfitrião (`HOST_ONLY` em `applyAct()`). Na tela, os convidados veem "Esperando Luiz revelar" ou "Esperando Luiz passar a rodada" no lugar desses botões. Os jogadores continuam podendo baixar a própria carta, arrumar a ordem da turma, votar, dar dica e reagir.

### Conferência de sincronia

```mermaid
sequenceDiagram
  participant H as 📱 Anfitrião
  participant G as 📱 Convidado
  H-->>G: state {ver 14}
  G->>H: ack {ver 14, h: a1b2}
  Note over H,G: a cada 2 segundos
  H-->>G: tick {ver 15, h: c3d4}
  alt convidado diferente (perdeu a ver 15)
    G->>H: pull
    H-->>G: state {ver 15} (forçado)
    G->>H: ack {ver 15, h: c3d4}
  else igual
    Note over G: nada a fazer
  end
  Note over H: quem não confirmou a versão atual recebe o estado de novo
```

A impressão digital (`stateHash`) é um hash do estado inteiro. Se um único detalhe estiver diferente, o convidado pede o estado de novo. Isso corrige mensagens perdidas pela rede sem ninguém perceber.

### Assinaturas: ninguém se passa pelo anfitrião

Cada celular cria uma chave **ECDSA P-256** na primeira vez que abre o app (`initKeys()`, guardada em `ito-key`). A parte privada nunca sai do aparelho.

| O quê | Quem assina | Quem confere |
|---|---|---|
| `hello` (apresentação) | o próprio jogador, sobre `cid|sala|horário` | o anfitrião. Na primeira vez guarda a chave do jogador (`players[].pk`); depois, um `hello` com o mesmo `cid` e outra chave é ignorado |
| `state` | o anfitrião da vez, sobre o estado inteiro (`refreshSig()`) | todos (`stateValid()`) |
| `tick`, `ack`, `pull`, ações | ninguém | não precisam: só pedem ao anfitrião, e quem decide é ele |

O estado carrega a chave pública do dono da sala (`ownerPk`). O convite leva a **impressão digital** dela (`#ABCD-EFGH~v2~k<12 hex>`), então quem entra pelo link já sabe qual chave esperar. Quem entra só digitando o código guarda a chave do primeiro estado que recebe.

```mermaid
flowchart TD
  M["Chegou um state"] --> O{"ownerPk confere com a<br/>impressão do link / a já guardada?"}
  O -- não --> X["Ignora"]
  O -- sim --> H{"hostCid é o dono?"}
  H -- sim --> V1{"Assinado pela chave do dono?"}
  H -- não --> P{"Dono fora do ar para mim,<br/>veio do próprio aparelho do provisório<br/>e a chave dele é a que eu conhecia?"}
  P -- não --> X
  P -- sim --> V2{"Assinado pela chave dele?"}
  V1 -- sim --> OK["Segue para as regras de versão"]
  V2 -- sim --> OK
  V1 -- não --> X
  V2 -- não --> X
```

O dono da sala, quando já está no comando, não aceita estado de mais ninguém (só enquanto está voltando, `NET.reclaiming`). Se o navegador não tiver criptografia (página aberta sem https), o app segue sem assinar.

### Toques ao mesmo tempo contam uma vez

Toda ação leva junto `game`, `round` (e `themePos`). O anfitrião só aplica se bater com o estado atual:

```js
const fresh = a.game === st.game && a.round === st.round;
if (a.t === 'next' && fresh && st.roundOver) { ... }   // o 2º "próxima rodada" chega com round antigo e é ignorado
```

### Quem está fora do lugar

Quando a rodada termina, o anfitrião marca como erradas **só as cartas fora do lugar**: mantém a maior sequência crescente e marca o resto (`markOutOfPlace()`).

## 7. Presença e troca de anfitrião

O app sabe quem está conectado pelo mapa `NET.peers` (conexão → `cid`). Uma pessoa só é considerada desconectada quando cai **nas duas redes**.

```mermaid
flowchart TD
  A[Conexão com o anfitrião caiu<br/>nas duas redes] --> B[Aviso: O anfitrião caiu. Reconectando…]
  B --> C{Voltou em 5 s?}
  C -- sim --> D[Segue normal]
  C -- não --> E[Quem tem o menor lugar<br/>entre os conectados?]
  E -- sou eu e recebi o estado atual --> F[Viro anfitrião provisório:<br/>hostCid = eu, ver + 1]
  E -- outra pessoa --> G[Espero o estado dela]
  F --> H[Envio o estado para todos]
```

- Só assume quem recebeu o estado **nesta sessão** (`NET.fresh`). Isso impede que um celular que acabou de recarregar, com estado velho, tome o controle.
- Quem assume é um **anfitrião provisório**. O dono da sala (`ownerCid`, quem criou) continua sendo o anfitrião de verdade.
- Quando o dono volta, ele espera alguns segundos (`RECLAIM_WAIT`), pega o estado mais novo do provisório (nada se perde) e **reassume**. O provisório vira jogador de novo.
- Em caso de empate de versão, vale o estado do dono da sala.
- Quem não está conectado sai da conta da rodada (as cartas dele não bloqueiam o fim da rodada).

### Quando o dono da sala volta

```mermaid
sequenceDiagram
  participant L as 📱 Luiz (dono)
  participant A as 📱 Ana (provisória)
  participant P as 📱 Pedro
  Note over L: celular caiu na rodada 2
  A->>A: segura a partida após 5 s<br/>hostCid = Ana
  A-->>P: state {ver 21, rodada 3}
  Note over L: Luiz reabre o app<br/>(estado salvo: ver 20, rodada 2)
  L->>A: hello (sem mandar o estado velho)
  A-->>L: state {ver 21, rodada 3}
  L->>L: adota a ver 21 e reassume<br/>hostCid = Luiz, ver 22
  L-->>A: state {ver 22, hostCid Luiz}
  L-->>P: state {ver 22, hostCid Luiz}
  A->>A: o dono voltou → vira jogadora
```

## 8. Guardado no celular

| Chave (`localStorage`) | Conteúdo |
|---|---|
| `ito-cid` | Identificador fixo do celular (para voltar ao mesmo lugar) |
| `ito-name` | Nome escolhido |
| `ito-online` | Sala atual, papel (`host`, `guest`, `tv`) e último estado, para reabrir o app e voltar à sala |
| `ito-key` | Chave do celular (assinaturas) |
| `ito-sound`, `ito-tips`, `ito-big` | Preferências (sons, dicas, letra maior) |

## 9. Sem internet

Não existe modo sem conexão: a partida sempre segue o anfitrião. Se a biblioteca não carregar ou a sala não for encontrada em 15 segundos, o app mostra o aviso e o botão **Tentar de novo**.

```mermaid
flowchart TD
  OPEN["Abre o convite"] --> LOAD{"Biblioteca carregou?"}
  LOAD -- não --> NOINT["Sem internet · Tentar de novo"]
  LOAD -- sim --> FIND{"Achou o anfitrião em 15 s?"}
  FIND -- sim --> ONLINE["Sala conectada"]
  FIND -- não --> NOTFOUND["Não achamos a sala ainda · Tentar de novo"]
  NOINT --> OPEN
  NOTFOUND --> FIND
```

## 10. Carregamento e cache

- A biblioteca vem do jsDelivr, com esm.sh de reserva (`loadLib()`).
- O `sw.js` guarda uma cópia (cache `ito-lib-1`) para não depender do CDN a cada abertura.
- O app em si fica no cache `ito-<VERSION>`. **Menu → Atualizar app** apaga os caches e recarrega.

## 11. TURN (opcional, recomendado para 4G/5G)

Algumas operadoras usam NAT que impede a conexão direta. Um servidor TURN retransmite os dados (que continuam criptografados de ponta a ponta). Para ativar, preencha `turn` em `config.js`. Passo a passo para quem não é técnico: [`turn.md`](turn.md). O app passa a lista para o Trystero via `turnConfig`.

## 12. Limitações conhecidas

- **Precisa de internet** para a primeira conexão (sinalização). Depois de conectados, o tráfego é direto.
- **Sem TURN**, alguns pares em redes móveis podem não conseguir se conectar.
- **Dependência de serviços públicos:** relays Nostr, brokers MQTT, STUN e CDN são de terceiros e podem ficar fora do ar. As duas redes e os endereços reserva reduzem o risco.
- **Anfitrião como fonte da verdade:** em caso de rede dividida, pode haver dois anfitriões por alguns segundos. Quando a rede volta, prevalece o estado mais novo e o dono da sala reassume.
- **Sem internet não tem jogo:** não existe modo sem conexão.
- **Não é à prova de trapaça:** como as cartas são calculadas no próprio celular, alguém que saiba inspecionar o código no navegador poderia descobrir os números. Para um jogo entre amigos isso é aceitável. Impedir exigiria um servidor que guardasse as cartas.
- **Assinaturas protegem contra anfitrião falso, não contra quem já está na sala ver os números:** quem tem o código entra como jogador normal.
- **Privacidade:** o código da sala é a senha da negociação. Quem tiver o código pode entrar (o anfitrião pode remover).

## 13. Como é testado

Os testes end-to-end (`tests/e2e`) trocam a biblioteca real por um **relé falso** (`fake_p2p.mjs`) que imita as duas redes dentro do próprio teste.

```mermaid
flowchart LR
  subgraph Chromium
    C1["📱 contexto 1"]
    C2["📱 contexto 2"]
    C3["📺 contexto 3"]
  end
  C1 -- "import do CDN (interceptado)" --> F["fake_p2p.mjs"]
  F -- "__relay()" --> R["Relay (Python)<br/>tópicos n| e m|"]
  R -- "__deliverers" --> C2
  R -- "__deliverers" --> C3
  R -. "drop(): simula queda" .-> C1
```
Assim dá para simular vários celulares, o telão, a queda do anfitrião, estados falsos e toques simultâneos sem depender da internet. Veja [`tests/e2e/README.md`](../tests/e2e/README.md).

Além disso, o workflow **Conexão real** (`.github/workflows/p2p-real.yml`) roda todo dia `test_real_p2p.py` **sem** o relé falso: dois navegadores se conectam pelas redes públicas, primeiro só pelo Nostr, depois só pelo MQTT e depois pelas duas. Se um relay ou broker público mudar ou sair do ar, esse teste avisa antes de alguém tentar jogar.

## 14. Mapa do código (`js/`)

Os arquivos são scripts comuns carregados em ordem pelo `index.html` e compartilham o mesmo escopo. A rede fica em `js/net.js`, as assinaturas em `js/crypto.js` e as regras em `js/rules.js`.

| Função | Papel |
|---|---|
| `connect()` / `loadLib()` | Carrega o Trystero e entra na sala pelas duas redes |
| `sendTo()` / `broadcast()` / `sendToCid()` | Envio de mensagens |
| `onPeerJoin()` / `onPeerLeave()` | Presença |
| `onMsg()` | Recebe e trata as mensagens |
| `hostHello()` | Anfitrião recebe quem chegou e dá um lugar |
| `applyAct()` / `HOST_ONLY` | Regras do jogo e ações que só o anfitrião pode pedir |
| `playSeat()` / `markOutOfPlace()` / `checkRoundOver()` | Cartas na mesa, fora do lugar, fim da rodada |
| `hostCommit()` | Aumenta a versão, salva e envia o estado |
| `hostLost()` / `finishReclaim()` / `newerState()` | Anfitrião provisório e volta do dono |
| `syncTick()` / `stateHash()` / `acceptState()` | Conferência de sincronia (tick, ack, pull) |
| `deckFor()` / `themeAt()` | Sorteio determinístico |
| `startHost()` / `startGuest()` / `netReset()` | Ciclo de vida da sala |
