"""Malha: quem não alcança o anfitrião direto ainda recebe o estado e faz o pedido chegar."""
from harness import E2E


class TestRetransmissao(E2E):
    async def test_sinalizacao_lista_varios_relays(self):
        ana = await self.phone('Ana')
        await ana.goto()
        await ana.act('create')
        await ana.page.wait_for_selector('.roster')
        urls = await ana.js("""() => (window.__joinCfg||[]).flatMap(c => (c.relayConfig && c.relayConfig.urls) || [])""")
        self.assertGreaterEqual(len(urls), 8, urls)
        self.assertTrue(any('nos.lol' in u for u in urls), urls)
        self.assertTrue(any('hivemq' in u for u in urls), urls)
        self.assertTrue(any('mqtt' in u for u in urls), urls)

    async def test_sem_fio_direto_o_estado_e_a_acao_passam_por_outro(self):
        host = await self.phone('Luiz')
        url = await host.create_room(rounds=3)
        await host.set_name('Luiz')
        ana = await self.phone('Ana')
        await ana.join(url)
        await ana.set_name('Ana')
        await host.until("NET.st.players.some(p=>p.name==='Ana')", msg='Ana entrou')

        pedro = await self.phone('Pedro')
        self.relay.cut(host, pedro)
        await pedro.join(url)
        await pedro.until("NET.st && NET.st.players.some(p=>p.name==='Ana') && !!document.querySelector('.via-note')", timeout=12, msg='Pedro recebe o estado pela Ana')
        self.assertFalse(await pedro.js("Object.values(NET.peers).includes(NET.st.hostCid)"), 'Pedro não liga direto no anfitrião')
        self.assertIn('conectado via Ana', await pedro.text('.via-note'))
        self.assertEqual(await ana.count('.via-note'), 0, 'Ana vê o anfitrião direto')

        await pedro.set_name('Pedro')
        await host.until("NET.st.players.some(p=>p.name==='Pedro')", timeout=12, msg='o nome do Pedro chega ao anfitrião')
        await pedro.say('oi pelo meio')
        pcid = await pedro.js('CID')
        await host.until(f"NET.chat.some(m => m.text==='oi pelo meio' && m.cid==={pcid!r})", timeout=12, msg='conversa do Pedro chega assinada')
        await host.open_chat()
        meta = await host.js("""() => {
          const row=[...document.querySelectorAll('.chat-msg')].find(r => r.textContent.includes('oi pelo meio'));
          return row.querySelector('.chat-meta').textContent;
        }""")
        self.assertTrue(meta.startswith('Pedro'), meta)
        for quem in (host, ana, pedro):
            await quem.page.evaluate("document.getElementById('chat').close()")

        await host.act('start')
        for p in (host, ana, pedro):
            await p.until("S && S.status==='play' && S.seat>0", timeout=12, msg='partida começou')
            if await p.count('[data-act=tipsOk]'): await p.act('tipsOk')
        self.assertIn('conectado via Ana', await pedro.text('.via-note'))

        await ana.js("""async () => {
          const quem = NET.st.players.find(p => p.name==='Pedro');
          const msg = {t:'act', id:'forgehint01', cid:quem.cid, ts:Date.now(),
            a:{t:'hint', text:'falsificada', game:NET.st.game, round:NET.st.round, themePos:NET.st.themePos}};
          msg.sig = await signText(msgBody(msg));
          noteRelay(msg.id);
          broadcast(msg);
        }""")
        await host.page.wait_for_timeout(600)
        self.assertFalse(await host.js("Object.values(NET.st.hints||{}).includes('falsificada')"), 'dica forjada não entra')

        ver = await host.js('NET.st.ver')
        await pedro.page.fill('#myHint', 'ponte')
        await pedro.act('saveHint')
        await host.until("Object.values(NET.st.hints||{}).includes('ponte')", timeout=12, msg='dica do Pedro chega ao anfitrião')
        await pedro.until("Object.values(S.hints||{}).includes('ponte')", timeout=12, msg='o estado novo volta até o Pedro')
        self.assertGreater(await pedro.js('NET.st.ver'), ver)

        seat = await pedro.js('S.seat')
        await pedro.js("sendAct('play')")
        await host.until(f"NET.st.table.some(t=>t.seat==={seat})", timeout=12, msg='carta do Pedro chega ao anfitrião')
        await pedro.until(f"S.table.some(t=>t.seat==={seat})", timeout=12, msg='Pedro vê a própria carta na mesa')

        antigo = await pedro.js('JSON.parse(JSON.stringify(NET.lastStateMsg))')
        await host.js("sendAct('reveal',{order:planOrder()})")
        await pedro.until('S.roundOver', timeout=12, msg='revelação chega sem fio direto')
        await ana.js("""(old) => { noteRelay('replaystate1'); broadcast({t:'fwd', id:'replaystate1', hop:1, to:'', msg:old}); }""", antigo)
        await pedro.page.wait_for_timeout(500)
        self.assertTrue(await pedro.js('S.roundOver'), 'estado velho reencaminhado não desfaz a rodada')
        self.assertEqual(await pedro.js('NET.st.ver'), await host.js('NET.st.ver'))
