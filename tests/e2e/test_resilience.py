"""Resiliência: anfitrião cai e volta, textos digitados não se perdem."""
from harness import E2E, Phone


class TestResiliencia(E2E):
    async def test_anfitriao_cai_alguem_segura_e_ele_volta_a_ser_anfitriao(self):
        url, host, (ana, pedro) = await self.room(rounds=3)
        await host.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until([ana, pedro], "S.roundOver")
        await host.act('next')
        await self.all_until([ana, pedro], "S.round===2")
        ctx = host.page.context
        self.relay.drop(host.page); await host.page.close(); self.phones.remove(host)
        await ana.until("document.querySelector('.banner')", msg='aviso de anfitrião desconectado')
        await ana.until("NET.role==='host'", timeout=12, msg='Ana segura a partida')
        await pedro.until("hostAlive() && NET.st.players.some(p=>p.cid===NET.st.hostCid && p.name==='Ana')", timeout=12)
        # a partida anda enquanto ele está fora
        await ana.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until([ana, pedro], "S.roundOver")
        await ana.js("sendAct('next')")
        await self.all_until([ana, pedro], "S.round===3", 'rodada 3 com o anfitrião provisório')
        # Luiz volta (mesmo celular): pega o estado novo e reassume
        page = await ctx.new_page()
        page.on('pageerror', lambda e: self.errors.append(f'Luiz2: {e}'))
        luiz = Phone(self, page, 'Luiz2'); self.phones.append(luiz)
        await luiz.goto(url)
        await luiz.until("NET.role==='host' && !NET.reclaiming && NET.st.round===3", timeout=15, msg='Luiz volta a ser anfitrião sem perder a rodada 3')
        await self.all_until([ana, pedro], "NET.role==='guest' && NET.st.hostCid===NET.st.ownerCid && S.round===3", 'todos seguem o Luiz de novo')

    async def test_atualizacao_perdida_e_corrigida_sozinha(self):
        url, host, (ana, pedro) = await self.room()
        self.relay.lose_states_to.add(pedro.page)            # Pedro deixa de receber as atualizações
        await host.page.fill('#myHint', 'pizza'); await host.act('saveHint')
        await host.js("sendAct('reveal',{order:planOrder()})")
        await ana.until("S.roundOver")
        await pedro.page.wait_for_timeout(300)
        self.assertFalse(await pedro.js("S.roundOver"), 'Pedro ficou para trás')
        self.relay.lose_states_to.clear()                     # rede volta
        await pedro.until("S.roundOver && NET.st.ver===%d" % await host.js("NET.st.ver"), timeout=6, msg='conferência do anfitrião corrige o Pedro')
        self.assertEqual(await pedro.js("stateHash(NET.st)"), await host.js("stateHash(NET.st)"))

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
