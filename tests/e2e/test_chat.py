"""Conversa da sala: entrega, histórico, número na rodada e texto sem HTML."""
from harness import E2E, Phone, TV


class TestChat(E2E):
    async def test_mensagem_chega_com_nome_de_quem_enviou_e_sem_duplicar(self):
        url, host, (ana, pedro) = await self.room(start=False)
        self.assertFalse(await ana.js("document.getElementById('chatFab').hidden"))
        await ana.say('  bora   alinhar  ')
        await host.until("NET.chat.some(m => m.text==='bora alinhar')", msg='anfitrião recebeu')
        await pedro.until("NET.chat.some(m => m.text==='bora alinhar')", msg='outro jogador recebeu')
        await host.page.wait_for_timeout(400)
        self.assertEqual(await host.js("NET.chat.filter(m => m.text==='bora alinhar').length"), 1, 'as duas redes não duplicam')
        self.assertEqual(await host.js("document.getElementById('chatBadge').textContent"), '1')
        await host.open_chat()
        self.assertTrue(await host.js("document.getElementById('chatBadge').hidden"))
        self.assertEqual(await host.count('.chat-msg'), 1)
        self.assertEqual(await host.count('.chat-msg.mine'), 0)
        meta = await host.js("document.querySelector('.chat-meta').textContent")
        self.assertTrue(meta.startswith('Ana'), meta)
        self.assertRegex(meta, r'\d{1,2}:\d{2}')
        self.assertIn('bora alinhar', await host.chat_text())
        await ana.open_chat()
        self.assertEqual(await ana.count('.chat-msg.mine'), 1)
        self.assertIn('Você', await ana.chat_text())

        await host.say('fechado')
        await ana.until("NET.chat.some(m => m.text==='fechado')")
        texto = await ana.chat_text()
        self.assertIn('Luiz', texto)
        self.assertIn('fechado', texto)

        # o nome exibido sai do lugar na sala, não de um campo da mensagem
        await ana.page.wait_for_timeout(500)
        await ana.js("""() => broadcast({t:'chat', id:'imperson1', text:'eu sou o Luiz', at:Date.now(), name:'Luiz', by:'Luiz', cid:'nao-eu'})""")
        await host.until("NET.chat.some(m => m.id==='imperson1')")
        got = await host.js("NET.chat.find(m => m.id==='imperson1')")
        self.assertEqual(got['cid'], await ana.js('CID'))
        rotulo = await host.js("""() => {
          const row=[...document.querySelectorAll('.chat-msg')].find(r => r.textContent.includes('eu sou o Luiz'));
          return row.querySelector('.chat-meta').textContent;
        }""")
        self.assertTrue(rotulo.startswith('Ana'), rotulo)
        self.assertNotIn('Luiz', rotulo.split('·')[0])

        await ana.js("""() => broadcast({t:'chatlog', log:[{id:'logfake01', cid:'abcd1234', text:'histórico falso', at:Date.now(), name:'Luiz'}]})""")
        await pedro.page.wait_for_timeout(400)
        self.assertFalse(await pedro.js("NET.chat.some(m => m.text==='histórico falso')"))
        self.assertFalse(await host.js("NET.chat.some(m => m.text==='histórico falso')"))

        longo = 'a' * 250
        await ana.page.wait_for_timeout(500)
        await ana.say(longo)
        await host.until("NET.chat.some(m => m.text.length===200 && m.text[0]==='a')", msg='corta em 200')

    async def test_historico_chega_para_quem_entra_depois_ou_reconecta(self):
        url, host, (ana, pedro) = await self.room(start=False)
        await ana.say('cheguei, somos 2')
        await host.until("NET.chat.some(m => m.text==='cheguei, somos 2')")
        ctx = ana.page.context
        self.relay.drop(ana.page)
        await ana.page.close()
        self.phones.remove(ana)
        await host.page.wait_for_timeout(300)
        await host.say('enquanto você saiu')
        await pedro.until("NET.chat.some(m => m.text==='enquanto você saiu')")

        page = await ctx.new_page()
        page.on('pageerror', lambda e: self.errors.append(f'Ana2: {e}'))
        ana2 = Phone(self, page, 'Ana2')
        self.phones.append(ana2)
        await ana2.goto(url)
        await ana2.until("NET.chat.some(m => m.text==='enquanto você saiu') && NET.chat.some(m => m.text==='cheguei, somos 2')", timeout=12, msg='reconexão recebe o histórico')
        texto = await ana2.chat_text()
        self.assertIn('Luiz', texto)
        self.assertRegex(texto, r'\d{1,2}:\d{2}')

        novo = await self.phone('Novo')
        await novo.join(url)
        await novo.until("NET.chat.some(m => m.text==='enquanto você saiu') && NET.chat.some(m => m.text==='cheguei, somos 2')", timeout=12, msg='quem entra depois recebe o histórico')
        chegada = await novo.chat_text()
        self.assertIn('Ana', chegada)
        self.assertIn('Luiz', chegada)
        estado = await novo.js("JSON.stringify(NET.st)")
        self.assertNotIn('enquanto você saiu', estado)
        self.assertNotIn('cheguei, somos 2', estado)

    async def test_numero_bloqueado_durante_a_rodada(self):
        url, host, (ana, pedro) = await self.room()
        self.assertFalse(await ana.js("document.getElementById('chatFab').hidden"))
        await ana.say('acho que é 42')
        self.assertIn('Sem números', await ana.js("document.getElementById('chatWarn').textContent"))
        self.assertIn('42', await ana.page.input_value('#chatInput'))
        await ana.page.wait_for_timeout(300)
        self.assertFalse(await host.js("NET.chat.some(m => String(m.text).includes('42'))"))
        self.assertFalse(await pedro.js("NET.chat.some(m => String(m.text).includes('42'))"))
        self.assertFalse(await ana.js("NET.chat.some(m => String(m.text).includes('42'))"))

        await ana.page.wait_for_timeout(400)
        await ana.say('vamos de 1º')
        await host.until("NET.chat.some(m => m.text==='vamos de 1º')", msg='1º é a vez de quem joga primeiro, não a carta')
        await ana.page.wait_for_timeout(400)
        await ana.say('lembrei de 2024')
        await pedro.until("NET.chat.some(m => m.text==='lembrei de 2024')", msg='número fora de 1 a 100 pode')

        await host.js("sendAct('reveal',{order:planOrder()})")
        await self.all_until([host, ana, pedro], "S.roundOver")
        await ana.page.wait_for_timeout(400)
        await ana.say('era 42')
        await host.until("NET.chat.some(m => m.text==='era 42')", msg='depois da revelação o número pode')

    async def test_mensagem_nao_vira_html(self):
        url, host, (ana,) = await self.room(names=('Luiz', 'Ana'), start=False)
        carga = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script><b>oi</b>'
        await ana.say(carga)
        await host.until("NET.chat.some(m => m.text.includes('<img'))")
        await host.open_chat()
        await host.page.wait_for_timeout(200)
        self.assertEqual(await host.count('#chatLog img, #chatLog script, #chatLog b'), 0)
        html = await host.js("document.querySelector('#chatLog .chat-msg p').innerHTML")
        self.assertNotIn('<img', html.lower())
        self.assertNotIn('<script', html.lower())
        self.assertNotIn('<b>', html.lower())
        self.assertIn('<img', await host.js("document.querySelector('#chatLog .chat-msg p').textContent"))
        self.assertIsNone(await host.js('window.__xss'))
        self.assertIsNone(await ana.js('window.__xss'))

    async def test_expulso_nao_fala_mais(self):
        url, host, (ana, pedro) = await self.room(start=False)
        await ana.say('ainda estou')
        await host.until("NET.chat.some(m => m.text==='ainda estou')")
        cid = await ana.js('CID')
        await host.page.locator('.roster li:nth-child(2) [data-act=playerMenu]').click()
        await host.page.locator('#dlgActions [value=kick]').click()
        await host.confirm()
        await pedro.until(f"(NET.st.banned||[]).includes({cid!r})", msg='sala sabe quem foi expulso')
        for quem in (host, pedro):
            await quem.js("""cid => { NET.peers['n:ghost']=cid; onMsg({t:'chat', id:'aindaqui1', text:'ainda falo', at:Date.now()}, 'n:ghost'); }""", cid)
        await host.page.wait_for_timeout(200)
        self.assertFalse(await host.js("NET.chat.some(m => m.text==='ainda falo')"))
        self.assertFalse(await pedro.js("NET.chat.some(m => m.text==='ainda falo')"))
        await pedro.say('seguimos')
        await host.until("NET.chat.some(m => m.text==='seguimos')")

    async def test_telao_mostra_a_ultima_e_passa_e_joga_nao_tem_chat(self):
        url, host, (ana,) = await self.room(names=('Luiz', 'Ana'), start=False)
        tv = await self.phone('TV', viewport=TV)
        await tv.goto()
        await tv.page.fill('#code', await host.js('NET.st.code'))
        await tv.act('joinTv')
        await tv.page.wait_for_selector('.tv-lobby')
        self.assertTrue(await tv.js("document.getElementById('chatFab').hidden"))
        await ana.say('oi do celular')
        await tv.until("!document.getElementById('tvChat').hidden && document.getElementById('tvChat').textContent.includes('oi do celular')")
        self.assertIn('Ana', await tv.js("document.getElementById('tvChat').textContent"))

        casa = await self.phone('Casa')
        await casa.goto()
        self.assertTrue(await casa.js("document.getElementById('chatFab').hidden"))
        await casa.act('passSetup')
        await casa.page.wait_for_selector('[data-act=passStart]')
        self.assertTrue(await casa.js("document.getElementById('chatFab').hidden"))
