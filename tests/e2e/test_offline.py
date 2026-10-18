"""Sem internet: o app avisa e oferece tentar de novo (não existe modo sem conexão)."""
from harness import E2E


class TestSemInternet(E2E):
    async def test_sem_internet_mostra_aviso_e_tentar_de_novo(self):
        p = await self.phone('Ana', block_cdn=True)
        await p.goto()
        code = await p.js("'KQXT'+enc(3,2,ALL_MASK)")
        await p.page.fill('#code', code); await p.act('join')
        await p.page.wait_for_selector('.connect h2')
        self.assertIn('Sem internet', await p.text('.connect h2'))
        self.assertEqual(await p.count('[data-act=retry]'), 1)
        self.assertEqual(await p.count('[data-act=goLocal]'), 0, 'não existe mais jogar sem conexão')
