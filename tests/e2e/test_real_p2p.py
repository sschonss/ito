"""Conexão de verdade: dois celulares pela internet, com a biblioteca e as redes reais.

Não roda no dia a dia (depende de servidores públicos de fora). Para rodar:
    ITO_REAL_P2P=1 python -m unittest test_real_p2p -v
No GitHub roda uma vez por dia e pelo botão "Run workflow" (Conexão real).
"""
import os, unittest
from harness import E2E

REAL = os.environ.get('ITO_REAL_P2P') == '1'
WAIT = 60.0


@unittest.skipUnless(REAL, 'defina ITO_REAL_P2P=1 para testar a conexão de verdade')
class TestConexaoReal(E2E):
    async def jogar_uma_rodada(self, **kw):
        url, host, (ana,) = await self.room(names=('Luiz', 'Ana'), rounds=2, wait=WAIT, real=True, **kw)
        self.assertEqual(await ana.js("NET.st.hostCid"), await host.js("CID"))
        await host.js("sendAct('reveal',{order:planOrder()})")
        await ana.until("S.roundOver", timeout=WAIT, msg='Ana vê o fim da rodada')
        await host.act('next')
        await ana.until("S.round===2", timeout=WAIT, msg='Ana vai para a rodada 2')
        self.assertEqual(await ana.js("stateHash(NET.st)"), await host.js("stateHash(NET.st)"))
        return host, ana

    async def test_duas_redes_juntas(self):
        host, ana = await self.jogar_uma_rodada()
        kinds = await host.js("[...new Set(Object.keys(NET.peers).map(k=>k[0]))].sort()")
        print('\n  redes ligadas:', kinds)

    async def test_so_nostr(self):
        await self.jogar_uma_rodada(only='n')

    async def test_so_mqtt(self):
        await self.jogar_uma_rodada(only='m')
