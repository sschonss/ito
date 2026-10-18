"""Plano B: sem internet, o jogo continua no modo sem conexão."""
from harness import E2E


class TestOffline(E2E):
    async def test_sem_internet_joga_no_modo_sem_conexao(self):
        p = await self.phone('Ana', block_cdn=True)
        await p.goto()
        code = await p.js("'KQXT'+enc(3,2,ALL_MASK)")
        await p.page.fill('#code', code); await p.act('join')
        await p.page.wait_for_selector('.connect h2')
        self.assertIn('Sem internet', await p.text('.connect h2'))
        await p.act('goLocal')
        await p.act('seat', v='2')
        await p.until("S && S.mode==='local' && S.seat===2")
        # conferir mostra a régua
        await p.act('reveal'); await p.confirm()
        await p.page.wait_for_selector('#dialog .ruler')
        self.assertEqual(await p.count('#dialog .r-label'), 3)
        await p.page.locator('#dlgActions [value=ok]').click()
        # duas rodadas: acerto e erro
        await p.act('win'); await p.until("S.round===2")
        await p.act('lose'); await p.until("S.status==='done'")
        self.assertIn('1', await p.text('.end-state .score strong'))
        self.assertIn('rodadas certas', await p.text('.end-state .score span'))
