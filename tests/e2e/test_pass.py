"""Num celular só (passa e joga): um aparelho, sem internet."""
from harness import E2E


class TestCelularSo(E2E):
    async def montar(self, p, nomes, rodadas=2):
        await p.goto()
        await p.act('passSetup')
        while await p.count('.pass-name') < len(nomes): await p.act('passAddName')
        for i, n in enumerate(nomes): await p.page.locator(f'.pass-name[data-i="{i}"]').fill(n)
        cur = await p.js("draft.rounds")
        while cur != rodadas:
            await p.act('step', k='rounds', d=('1' if cur < rodadas else '-1')); cur = await p.js("draft.rounds")
        await p.act('passStart')
        await p.until("S && S.mode==='pass' && S.phase==='deal'")

    async def distribuir(self, p, dicas):
        cartas = {}
        for i in range(1, await p.js("S.n") + 1):
            self.assertIn('Passe o celular para', await p.text('.pass-hand h2'))
            self.assertEqual(await p.count('.card'), 0, 'carta escondida antes de tocar')
            await p.act('passShow')
            cartas[i] = int(await p.text('.card .front strong'))
            self.assertEqual(cartas[i], await p.js(f"deck()[{i}-1]"))
            if dicas.get(i): await p.page.fill('#passHint', dicas[i])
            await p.act('passHide')
        await p.until("S.phase==='table'")
        return cartas

    async def test_partida_completa_sem_internet(self):
        p = await self.phone('Mesa', block_cdn=True)
        await self.montar(p, ['Ana', 'Bia', 'Caio'], rodadas=2)
        cartas = await self.distribuir(p, {1: 'pizza', 3: 'jiló'})
        self.assertIn('pizza', await p.text('.order-list'))
        # monta a ordem certa e revela
        certa = sorted(cartas, key=cartas.get)
        await p.js("o=>{ S.plan=o; passTable(); }", certa)
        await p.act('passReveal'); await p.confirm()
        await p.until("S.phase==='reveal' && S.table.every(t=>t.ok)")
        self.assertEqual(await p.count('.reveal-panel .r-label'), 3)
        await p.act('passNext')
        await p.until("S.phase==='deal' && S.round===2 && S.dealIdx===1")
        # rodada 2: ordem errada
        cartas = await self.distribuir(p, {})
        errada = sorted(cartas, key=cartas.get, reverse=True)
        await p.js("o=>{ S.plan=o; passTable(); }", errada)
        await p.act('passReveal'); await p.confirm()
        await p.until("S.phase==='reveal' && S.table.some(t=>!t.ok)")
        await p.act('passNext')
        await p.until("S.phase==='done'")
        self.assertEqual(await p.text('.end-state .score strong'), '1')
        self.assertEqual(await p.count('details.last-round'), 1)
        self.assertGreater(await p.js("async()=>(await summaryImage()).size"), 10000)
        await p.act('passRestart')
        await p.until("S.phase==='deal' && S.game===2 && S.round===1")

    async def test_continua_depois_de_fechar_o_app(self):
        p = await self.phone('Mesa', block_cdn=True)
        await self.montar(p, ['Ana', 'Bia'], rodadas=3)
        await p.act('passShow'); await p.act('passHide')
        await p.page.reload(); await p.page.wait_for_selector('#view > *')
        await p.act('passResume')
        await p.until("S.mode==='pass' && S.phase==='deal' && S.dealIdx===2")
        self.assertIn('Bia', await p.text('.pass-hand h2'))
        self.assertIn('2 de 2', (await p.text('.pass-hand .eyebrow')).lower(), 'linha em branco não vira jogador')

    async def test_ver_a_carta_de_novo_e_mudar_tema(self):
        p = await self.phone('Mesa', block_cdn=True)
        await self.montar(p, ['Ana', 'Bia'])
        await self.distribuir(p, {})
        antes = await p.js("theme()[0]")
        await p.act('passThemeMenu'); await p.page.locator('#dlgActions [value=skip]').click()
        await p.until(f"theme()[0]!=={antes!r}")
        await p.act('passPeekAgain'); await p.page.locator('#dlgActions [value="2"]').click()
        await p.page.wait_for_selector('#dialog .peek-big')
        self.assertEqual(int(await p.text('#dialog .peek-big')), await p.js("deck()[1]"))
