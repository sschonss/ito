"""Segurança: só vale o que o anfitrião assinou."""
from harness import E2E


class TestSeguranca(E2E):
    async def test_link_leva_a_impressao_da_chave_do_dono(self):
        url, host, (ana, pedro) = await self.room(start=False)
        fp = await host.js("KEYS.fp")
        self.assertRegex(fp, r'^[0-9a-f]{12}$')
        self.assertIn('~k' + fp, url)
        self.assertEqual(await ana.js("NET.ownerFp"), fp)

    async def test_estado_falso_de_outro_jogador_e_ignorado(self):
        url, host, (ana, pedro) = await self.room()
        ver = await ana.js("NET.st.ver")
        # Pedro tenta se passar por anfitrião: estado "mais novo", assinado com a chave dele e sem assinatura
        await pedro.js("""async () => {
          const st=JSON.parse(JSON.stringify(NET.st));
          st.hostCid=CID; st.ver+=50; st.round=3; st.results=[1,1];
          broadcast({t:'state', st, sig:await signText(JSON.stringify(st)), force:true});
          const st2={...st, hostCid:NET.st.hostCid, ver:st.ver+1};
          broadcast({t:'state', st:st2, sig:'', force:true});
          const st3={...st2, ownerPk:KEYS.pk, ver:st.ver+2};          // troca a chave do dono pela dele
          broadcast({t:'state', st:st3, sig:await signText(JSON.stringify(st3)), force:true});
        }""")
        await ana.page.wait_for_timeout(600)
        self.assertEqual(await ana.js("NET.st.round"), 1, 'Ana não aceitou o estado falso')
        self.assertLess(await ana.js("NET.st.ver"), ver + 50)
        self.assertEqual(await ana.js("NET.st.hostCid"), await host.js("CID"))
        # o jogo de verdade continua normal
        await host.js("sendAct('reveal',{order:planOrder()})")
        await ana.until("S.roundOver")

    async def test_ninguem_entra_no_lugar_de_outro_jogador(self):
        url, host, (ana, pedro) = await self.room(start=False)
        ana_cid = await ana.js("CID")
        # Pedro manda uma apresentação com o CID da Ana, assinada com a chave dele
        await pedro.js("""async (cid) => {
          const ts=Date.now();
          broadcast({t:'hello', cid, name:'Impostor', pk:KEYS.pk, ts, sig:await signText(cid+'|'+NET.code+'|'+ts)});
        }""", ana_cid)
        await host.page.wait_for_timeout(500)
        self.assertNotIn('Impostor', await host.js("NET.st.players.map(p=>p.name)"))
