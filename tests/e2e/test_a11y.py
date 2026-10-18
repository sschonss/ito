"""Acessibilidade: leitor de tela e letra maior."""
from harness import E2E


class TestAcessibilidade(E2E):
    async def test_regua_tem_descricao_para_leitor_de_tela(self):
        url, host, (ana, pedro) = await self.room()
        await host.js("sendAct('reveal',{order:planOrder()})")
        await ana.until("S.roundOver")
        await ana.until("document.querySelector('.ruler-wrap ol.sr-only li')", msg='lista para leitor de tela')
        itens = await ana.page.locator('.ruler-wrap ol.sr-only li').all_inner_texts()
        self.assertEqual(len(itens), 3)
        cartas = [int(t.split(':')[0]) for t in itens]
        self.assertEqual(cartas, sorted(cartas), 'da menor para a maior')
        self.assertEqual(await ana.page.get_attribute('.ruler', 'aria-hidden'), 'true')

    async def test_carta_tem_rotulo(self):
        url, host, (ana, pedro) = await self.room()
        self.assertEqual(await ana.page.get_attribute('.hand .card', 'aria-label'), 'Carta escondida')
        await ana.act('peek')
        card = await ana.my_card()
        self.assertEqual(await ana.page.get_attribute('.hand .card', 'aria-label'), f'Sua carta: {card}')

    async def test_letra_maior_fica_salva(self):
        p = await self.phone('Ana'); await p.goto()
        await p.js("openMenu()"); await p.act('toggleBig')
        self.assertTrue(await p.js("document.documentElement.classList.contains('big')"))
        await p.page.reload()
        await p.until("document.documentElement.classList.contains('big')", msg='continua depois de reabrir')
        self.assertIn('Letra maior: ligada', await p.js("(openMenu(), document.querySelector('#menuList').innerText)"))
