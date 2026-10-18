"""Sala conectada: lobby, partida completa, revelação, votação, reações, telão."""
import json
from harness import E2E, TV


class TestLobby(E2E):
    async def test_nomes_ordem_e_remover_jogador(self):
        url, host, (ana, pedro) = await self.room(start=False)
        intruso = await self.phone('Intruso'); await intruso.join(url)
        await host.until("NET.st.players.length===4")
        self.assertEqual(await host.js("NET.st.players.map(p=>p.name)"), ['Luiz', 'Ana', 'Pedro', ''])
        # lugares sempre diferentes
        self.assertEqual(sorted(await host.js("NET.st.players.map(p=>p.seat)")), [1, 2, 3, 4])
        # remover o 4º
        await host.page.locator('.roster li:nth-child(4) [data-act=playerMenu]').click()
        await host.page.locator('#dlgActions [value=kick]').click(); await host.confirm()
        await intruso.until("!NET.role && document.getElementById('dlgTitle').textContent.includes('saiu')", msg='intruso foi avisado')
        await host.until("NET.st.players.length===3")
        # reordenar: Ana sobe para 1º
        await host.page.locator('.roster li:nth-child(2) [data-act=playerMenu]').click()
        await host.page.locator('#dlgActions [value=up]').click()
        await pedro.until("NET.st.players[0].name==='Ana'", msg='ordem sincronizada')
        # quem não é anfitrião vê de quem está esperando
        self.assertIn('Esperando', await pedro.text('.waiting'))


class TestPartida(E2E):
    async def test_partida_completa(self):
        url, host, (ana, pedro) = await self.room(rounds=3)
        todos = [host, ana, pedro]
        tema = await host.text('.theme h2')
        self.assertTrue(all([await p.text('.theme h2') == tema for p in todos]), 'todos com o mesmo tema')
        cartas = [await p.my_card() for p in todos]
        self.assertEqual(len(set(cartas)), 3, 'cartas diferentes para cada um')

        # votação de tema
        await ana.act('themeMenu'); await ana.page.locator('#dlgActions [value=voteStart]').click()
        await self.all_until(todos, "S.vote", 'votação aberta para todos')
        escolhido = await pedro.js("themeAt(S, S.vote.opts[1])[0]")
        for p in todos: await p.page.locator('.vote-opt[data-i="1"]').click()
        await self.all_until(todos, f"!S.vote && theme()[0]==={escolhido!r}", 'tema escolhido')

        # dicas aparecem para todos
        await host.page.fill('#myHint', 'pizza'); await host.act('saveHint')
        await ana.page.fill('#myHint', 'jiló'); await ana.act('saveHint')
        await pedro.until("Object.values(S.hints).length===2", msg='dicas chegaram')
        self.assertIn('pizza', await pedro.text('.order-list'))

        # rodada 1: ordem certa montada e revelada -> rodada perfeita
        seats = sorted([(await p.my_card(), await p.seat()) for p in todos])
        await pedro.js("o=>sendAct('plan',{order:o})", [s for _, s in seats])
        await self.all_until(todos, f"JSON.stringify(planOrder())==='{json.dumps([s for _, s in seats], separators=(',', ':'))}'", 'ordem sincronizada')
        await ana.act('revealPlan'); await ana.confirm()
        await self.all_until(todos, "S.roundOver && S.table.every(t=>t.ok)", 'rodada certa')
        await host.page.wait_for_selector('.reveal-panel .ruler')
        self.assertEqual(await host.count('.reveal-panel .r-label'), 3)
        await host.act('next')
        await self.all_until(todos, "S.round===2 && !S.roundOver", 'rodada 2')

        # rodada 2: ordem errada -> só a carta fora do lugar marcada
        cards = {await p.seat(): await p.my_card() for p in todos}
        lo, mid, hi = sorted(cards, key=cards.get)
        await host.js("o=>sendAct('reveal',{order:o})", [mid, hi, lo])
        await self.all_until(todos, "S.roundOver", 'rodada 2 revelada')
        bad = await ana.js("S.table.filter(t=>!t.ok).map(t=>t.seat)")
        self.assertEqual(bad, [lo], 'só quem estava fora do lugar fica marcado')
        self.assertEqual(await ana.js("S.results"), [1, 0])
        await pedro.act('next')
        await self.all_until(todos, "S.round===3 && !S.roundOver", 'rodada 3')

        # rodada 3: um por um, na ordem certa
        pairs = sorted([(await p.my_card(), p) for p in todos], key=lambda x: x[0])
        for _, p in pairs:
            await p.page.locator('[data-act=playCard]').click(); await p.confirm()
            await p.until("S.table.some(t=>t.seat===S.seat)")
        await self.all_until(todos, "S.roundOver && S.table.every(t=>t.ok)", 'rodada 3 certa')
        await ana.act('next')
        await self.all_until(todos, "S.status==='done'", 'fim de jogo')
        self.assertEqual(await host.text('.end-state .score strong'), '2')
        self.assertIn('rodadas certas', await host.text('.end-state .score span'))
        self.assertGreaterEqual(await host.count('.highlights .hl'), 1)
        self.assertEqual(await host.count('details.last-round'), 1)
        tamanho = await host.js("async()=>(await summaryImage()).size")
        self.assertGreater(tamanho, 10000, 'imagem do resumo gerada')

        # jogar de novo
        await pedro.act('restart')
        await self.all_until(todos, "S.status==='play' && S.round===1 && S.game===2", 'nova partida')

    async def test_toques_ao_mesmo_tempo_contam_uma_vez(self):
        url, host, (ana, pedro) = await self.room(rounds=3)
        todos = [host, ana, pedro]
        await host.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until(todos, "S.roundOver")
        # todos pedem a próxima rodada ao mesmo tempo
        for p in todos: await p.js("sendAct('next')")
        await self.all_until(todos, "S.round===2", 'rodada 2')
        await host.page.wait_for_timeout(500)
        self.assertEqual(await host.js("NET.st.round"), 2)
        self.assertEqual(len(await host.js("NET.st.results")), 1)

    async def test_reacoes_chegam_uma_vez(self):
        url, host, (ana, pedro) = await self.room()
        await ana.act('reactOpen'); await ana.act('react', e='👏')
        await host.until("document.querySelectorAll('.float-emoji').length>=1")
        await host.page.wait_for_timeout(400)
        self.assertEqual(await host.count('.float-emoji'), 1, 'reação chega uma vez só, mesmo com duas redes')

    async def test_tema_escrito_pela_turma(self):
        url, host, (ana, pedro) = await self.room()
        await pedro.act('themeMenu'); await pedro.page.locator('#dlgActions [value=customTheme]').click()
        await pedro.page.fill('#ctTitle', 'Coisas que o tio fala'); await pedro.page.fill('#ctHigh', 'pérola')
        await pedro.confirm()
        await host.until("S.custom && S.custom.title==='Coisas que o tio fala'")
        self.assertIn('tema da turma', (await host.text('.theme .eyebrow')).lower())


class TestTelao(E2E):
    async def test_telao_mostra_a_mesa_sem_ocupar_lugar(self):
        url, host, (ana, pedro) = await self.room(start=False)
        tv = await self.phone('TV', scheme='dark', viewport=TV)
        await tv.goto()
        await tv.page.fill('#code', url.split('#')[1]); await tv.act('joinTv')
        await tv.page.wait_for_selector('.tv-lobby .qr')
        self.assertEqual(await host.js("NET.st.players.length"), 3, 'telão não vira jogador')
        await host.act('start')
        await tv.page.wait_for_selector('.tv-theme h2')
        await host.js("sendAct('reveal',{order:planOrder()})")
        await tv.page.wait_for_selector('.tv-table .ruler')
        self.assertEqual(await tv.count('.tv-table .r-label'), 3)


class TestVotacao(E2E):
    async def test_empate_sorteia_e_avisa_e_tema_perdedor_nao_volta(self):
        url, host, (ipad,) = await self.room(names=('Luiz', 'iPad'), rounds=5)
        both = [host, ipad]
        await ipad.act('themeMenu'); await ipad.page.locator('#dlgActions [value=voteStart]').click()
        await self.all_until(both, "S.vote", 'votação aberta')
        opts = await host.js("S.vote.opts.map(p=>themeAt(S,p)[0])")
        await host.page.locator('.vote-opt[data-i="0"]').click()
        await ipad.until("Object.keys(S.vote.votes).length===1")
        self.assertIn('✓', await ipad.text('.vote-who'), 'mostra quem já votou')
        await ipad.page.locator('.vote-opt[data-i="1"]').click()
        await self.all_until(both, "!S.vote", 'empate resolvido')
        escolhido = await host.js("theme()[0]")
        self.assertIn(escolhido, opts)
        await host.until("[...document.querySelectorAll('#toast')].some(t=>t.textContent.includes('Empate'))", msg='avisa o empate')
        # a opção que perdeu não aparece na rodada seguinte
        await host.js("sendAct('reveal',{order:planOrder()})"); await self.all_until(both, "S.roundOver")
        await host.js("sendAct('next')"); await self.all_until(both, "S.round===2")
        self.assertNotIn(await host.js("theme()[0]"), opts)

    async def test_encerrar_sem_votos_mantem_o_tema(self):
        url, host, (ana,) = await self.room(names=('Luiz', 'Ana'))
        antes = await host.js("theme()[0]")
        await ana.act('themeMenu'); await ana.page.locator('#dlgActions [value=voteStart]').click()
        await host.until("S.vote")
        await host.act('voteEnd')
        await self.all_until([host, ana], "!S.vote")
        self.assertEqual(await ana.js("theme()[0]"), antes)
