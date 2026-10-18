"""Resiliência: anfitrião cai e volta, textos digitados não se perdem."""
from harness import E2E, Phone


class TestResiliencia(E2E):
    async def test_anfitriao_cai_outro_assume_e_ele_volta_como_jogador(self):
        url, host, (ana, pedro) = await self.room(rounds=3)
        await host.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until([ana, pedro], "S.roundOver")
        await ana.act('next')
        await self.all_until([ana, pedro], "S.round===2")
        ctx = host.page.context
        self.relay.drop(host.page); await host.page.close(); self.phones.remove(host)
        await ana.until("document.querySelector('.banner')", msg='aviso de anfitrião caído')
        await ana.until("NET.role==='host'", timeout=12, msg='Ana (próxima da fila) assume')
        await pedro.until("hostAlive() && NET.st.players.some(p=>p.cid===NET.st.hostCid && p.name==='Ana')", timeout=12, msg='Pedro segue a nova anfitriã')
        # o jogo continua só com quem está conectado
        await pedro.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until([ana, pedro], "S.roundOver", 'rodada 2 com 2 jogadores')
        self.assertEqual(await ana.js("S.table.length"), 2)
        # Luiz volta (mesmo celular) e entra como jogador
        page = await ctx.new_page()
        page.on('pageerror', lambda e: self.errors.append(f'Luiz2: {e}'))
        luiz = Phone(self, page, 'Luiz2'); self.phones.append(luiz)
        await luiz.goto(url)
        await luiz.until("NET.role==='guest' && NET.st && NET.st.round===2", timeout=12, msg='Luiz volta como convidado')

    async def test_dica_digitada_nao_some_quando_a_tela_atualiza(self):
        url, host, (ana, pedro) = await self.room()
        await pedro.page.fill('#myHint', 'jacaré')
        await pedro.page.locator('body').click(position={'x': 5, 'y': 400})   # tira o foco do campo
        await ana.page.fill('#myHint', 'pizza'); await ana.act('saveHint')      # força atualização da tela do Pedro
        await pedro.until("S.hints && Object.values(S.hints).includes('pizza')")
        self.assertEqual(await pedro.page.input_value('#myHint'), 'jacaré')

    async def test_nome_digitado_nao_some_no_lobby(self):
        url, host, (ana, pedro) = await self.room(start=False)
        novo = await self.phone('Novo'); await novo.join(url)
        await novo.page.fill('#myName', 'Carla')
        await novo.page.locator('body').click(position={'x': 5, 'y': 300})
        await ana.set_name('Ana Paula')
        await novo.until("NET.st.players.some(p=>p.name==='Ana Paula')")
        self.assertEqual(await novo.page.input_value('#myName'), 'Carla')
