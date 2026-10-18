"""Básicos: página, PWA, código da sala e regras de pontuação."""
import json, re, urllib.request
from harness import E2E, base_url, ROOT


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


class TestBasics(E2E):
    async def test_tela_inicial_abre_sem_erros(self):
        p = await self.phone('Ana')
        await p.goto()
        self.assertIn('ito', await p.page.title())
        self.assertEqual(await p.count('[data-act=create]'), 1)
        self.assertEqual(await p.count('#code'), 1)
        self.assertEqual(await p.count('[data-act=joinTv]'), 1)

    async def test_arquivos_do_pwa_existem_e_versoes_batem(self):
        sw = read(f'{ROOT}/sw.js'); app = read(f'{ROOT}/app.js')
        v_sw = re.search(r"const VERSION = '([^']+)'", sw).group(1)
        v_app = re.search(r"const VERSION = '([^']+)'", app).group(1)
        self.assertEqual(v_sw, v_app, 'aumente VERSION igual em app.js e sw.js')
        assets = re.findall(r"'([^']+)'", sw[sw.index('const ASSETS'):sw.index('];')])
        for a in assets:
            with urllib.request.urlopen(base_url() + ('' if a == './' else a)) as r:
                self.assertEqual(r.status, 200, a)
        manifest = json.loads(read(f'{ROOT}/manifest.webmanifest'))
        for icon in manifest['icons']:
            with urllib.request.urlopen(base_url() + icon['src']) as r:
                self.assertEqual(r.status, 200, icon['src'])

    async def test_codigo_da_sala_ida_e_volta(self):
        p = await self.phone('Ana'); await p.goto()
        bad = await p.js("""() => {
          const out=[];
          for(const n of [2,5,10]) for(const r of [1,5,20]) for(const m of [1,37,ALL_MASK]){
            const c=parseCode('KQXT'+enc(n,r,m));
            if(!c || c.n!==n || c.rounds!==r || c.mask!==m) out.push([n,r,m,c]);
          }
          return out; }""")
        self.assertEqual(bad, [])
        self.assertIsNone(await p.js("parseCode('ABC')"))
        self.assertIsNone(await p.js("parseCode('ABCD-1234')"))

    async def test_codigo_invalido_mostra_erro(self):
        p = await self.phone('Ana'); await p.goto()
        await p.page.fill('#code', 'XYZ'); await p.act('join')
        self.assertIn('Código não encontrado', await p.text('#err'))

    async def test_marca_so_a_carta_fora_do_lugar(self):
        p = await self.phone('Ana'); await p.goto()
        cases = {(30, 44, 20): [20], (10, 20, 30): [], (50, 10, 60, 70): [10], (98, 36, 25): [36, 25]}
        for cards, expected in cases.items():
            bad = await p.js("c=>{ const t=c.map(card=>({card})); markOutOfPlace(t); return t.filter(x=>!x.ok).map(x=>x.card); }", list(cards))
            self.assertEqual(bad, expected, cards)

    async def test_mesmo_codigo_gera_mesmas_cartas_e_temas(self):
        a = await self.phone('A'); b = await self.phone('B')
        await a.goto(); await b.goto()
        expr = "()=>{ S={code:'KQXT-AVCR',game:1,round:2,mask:ALL_MASK,themePos:3}; return [deck().slice(0,5), theme()[0]]; }"
        self.assertEqual(await a.js(expr), await b.js(expr))
