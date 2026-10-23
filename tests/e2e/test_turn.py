"""Credenciais TURN: o app pede ao Worker e, se falhar, entra na sala mesmo assim."""
import asyncio, os, unittest
from harness import E2E, ROOT

ICE = [
    {'urls': ['stun:stun.example:3478', 'stun:stun.example:443']},
    {'urls': ['turn:turn.example:3478?transport=udp', 'turns:turn.example:443?transport=tcp'],
     'username': 'user', 'credential': 'pass'},
]
STATIC = [{'urls': 'turn:static.example:80', 'username': 'u', 'credential': 'p'}]


class TestTurn(E2E):
    async def _entrar(self):
        p = await self.phone('Luiz')
        await p.goto()
        await p.act('create')
        await p.page.wait_for_selector('.roster')
        return p

    async def _cfgs(self, p):
        return await p.js('window.__joinCfg')

    async def test_credenciais_do_worker_chegam_no_trystero(self):
        self.turn_status = 200
        self.turn_servers = ICE
        p = await self._entrar()
        self.assertEqual(self.turn_hits, 1, 'uma busca serve as duas redes')
        cfgs = await self._cfgs(p)
        self.assertGreaterEqual(len(cfgs), 1)
        for c in cfgs:
            self.assertEqual(c.get('turnConfig'), ICE)
            self.assertIsNone(c.get('rtcConfig'), 'não troca o STUN padrão do Trystero')

    async def test_worker_fora_ainda_entra_na_sala(self):
        host, (ana,) = (await self.room(names=('Luiz', 'Ana'), rounds=5, start=False))[1:]
        self.assertGreaterEqual(self.turn_hits, 1, 'tentou buscar as credenciais')
        for p in (host, ana):
            await p.until("NET.role && NET.st && NET.st.players.length===2", msg='os dois entraram')
            for c in await self._cfgs(p):
                self.assertIsNone(c.get('turnConfig'))

    async def test_resposta_ruim_nao_impede_a_sala(self):
        for status in (500, 'bad'):
            self.turn_status = status
            self.turn_hits = 0
            host = await self.phone('Luiz')
            url = await host.create_room(rounds=5)
            ana = await self.phone('Ana')
            await ana.join(url)
            await host.set_name('Luiz')
            await ana.set_name('Ana')
            await host.until("NET.st.players.length===2 && NET.st.players.every(p=>p.name)", msg='sala com resposta ruim')
            self.assertGreaterEqual(self.turn_hits, 1)
            for p in (host, ana):
                for c in await self._cfgs(p):
                    self.assertIsNone(c.get('turnConfig'))

    async def test_worker_lento_nao_segura_a_entrada(self):
        self.turn_status = 'slow'
        p = await self.phone('Luiz')
        await p.goto()
        loop = asyncio.get_event_loop()
        t0 = loop.time()
        await p.act('create')
        await p.page.wait_for_selector('.roster', timeout=8000)
        self.assertLess(loop.time() - t0, 7, 'o timeout curto não pode prender a entrada')
        self.assertGreaterEqual(self.turn_hits, 1)
        for c in await self._cfgs(p):
            self.assertIsNone(c.get('turnConfig'))

    async def test_lista_estatica_continua_valendo(self):
        p = await self.phone('Luiz')
        await p.goto()
        await p.js('(s)=>{ CFG.turn = s; }', STATIC)
        await p.act('create')
        await p.page.wait_for_selector('.roster')
        for c in await self._cfgs(p):
            self.assertEqual(c.get('turnConfig'), STATIC)

    async def test_lista_estatica_soma_com_o_worker(self):
        self.turn_status = 200
        self.turn_servers = ICE
        p = await self.phone('Luiz')
        await p.goto()
        await p.js('(s)=>{ CFG.turn = s; }', STATIC)
        await p.act('create')
        await p.page.wait_for_selector('.roster')
        for c in await self._cfgs(p):
            self.assertEqual(c.get('turnConfig'), ICE + STATIC)

    async def test_reusa_credencial_ainda_valida(self):
        self.turn_status = 200
        self.turn_servers = ICE
        p = await self._entrar()
        self.assertEqual(self.turn_hits, 1)
        await p.js('() => { turnMem = null; }')  # só a cópia guardada no celular permanece
        await p.js('connect(NET.code)')
        await p.until('window.__joinCfg.length>=4', msg='reconectou')
        self.assertEqual(self.turn_hits, 1, 'reconectar não pede de novo')
        for c in await self._cfgs(p):
            self.assertEqual(c.get('turnConfig'), ICE)


class TestSwTurn(unittest.TestCase):
    def test_sw_busca_credenciais_sempre_na_rede(self):
        with open(os.path.join(ROOT, 'sw.js'), encoding='utf-8') as f:
            sw = f.read()
        host = 'ito-turn.sschonss.workers.dev'
        self.assertIn(host, sw)
        snippet = sw[sw.index(host):sw.index('return;', sw.index(host))]
        self.assertIn("cache: 'no-store'", snippet)
        self.assertNotIn('cache.put', snippet)
        self.assertNotIn('caches.open', snippet)
