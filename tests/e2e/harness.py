"""Infraestrutura dos testes end-to-end do ito.

- Sobe um servidor estático com o próprio repositório.
- Abre "celulares" (contextos separados do Chromium, cada um com seu armazenamento).
- Troca a biblioteca de conexão real por uma falsa: as mensagens entre os
  celulares passam por um relé aqui no teste, imitando as duas redes (Nostr e MQTT).
"""
import asyncio, json, os, re, socket, threading, functools, unittest
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FAKE = open(os.path.join(os.path.dirname(__file__), 'fake_p2p.mjs')).read()
ARTIFACTS = os.path.join(os.path.dirname(__file__), 'artifacts')
CDN = re.compile(r'https://(cdn\.jsdelivr\.net|esm\.sh)/.*')
TURN = re.compile(r'https://ito-turn\.sschonss\.workers\.dev/?')
PHONE = {'width': 390, 'height': 844}
TV = {'width': 1280, 'height': 720}

_server = None
def base_url():
    """Servidor estático único para toda a execução."""
    global _server
    if _server is None:
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        handler = functools.partial(Quiet, directory=ROOT)
        s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
        _server = ThreadingHTTPServer(('127.0.0.1', port), handler)
        threading.Thread(target=_server.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{_server.server_address[1]}/'


class Relay:
    """Entrega mensagens entre os celulares, separando as duas redes."""
    def __init__(self):
        self.rooms = {}
        self.lose_states_to = set()   # celulares que "perdem" as atualizações de estado (simula rede ruim)

    async def _deliver(self, page, kind, t, f, n=None, d=None):
        try:
            await page.evaluate("([k,t,f,n,d])=>window.__deliverers&&window.__deliverers[k]&&window.__deliverers[k](t,f,n,d)", [kind, t, f, n, d])
        except Exception:
            pass

    def handle(self, source, msg):
        page = source['page']; key = msg['kind'] + '|' + msg['room']; r = self.rooms.setdefault(key, {})
        if msg.get('join'):
            for pid, pg in list(r.items()):
                asyncio.ensure_future(self._deliver(pg, msg['kind'], 'join', msg['from']))
                asyncio.ensure_future(self._deliver(page, msg['kind'], 'join', pid))
            r[msg['from']] = page
            return
        if msg.get('leave'):
            r.pop(msg['from'], None)
            for pg in r.values(): asyncio.ensure_future(self._deliver(pg, msg['kind'], 'leave', msg['from']))
            return
        to = msg['to']
        targets = to if isinstance(to, list) else ([to] if to else [p for p in r if p != msg['from']])
        data = json.loads(json.dumps(msg['data']))
        for pid in targets:
            if pid not in r: continue
            if r[pid] in self.lose_states_to and isinstance(data, dict) and data.get('t') == 'state': continue
            asyncio.ensure_future(self._deliver(r[pid], msg['kind'], 'msg', msg['from'], msg['name'], data))

    def drop(self, page):
        """Simula o celular perdendo a conexão (fechou o app, acabou a bateria)."""
        for key, r in self.rooms.items():
            kind = key.split('|')[0]
            for pid, pg in list(r.items()):
                if pg is page:
                    r.pop(pid)
                    for other in r.values(): asyncio.ensure_future(self._deliver(other, kind, 'leave', pid))


class Phone:
    """Um celular com o app aberto."""
    def __init__(self, test, page, name):
        self.t, self.page, self.name = test, page, name

    async def goto(self, url=None):
        await self.page.goto(url or base_url())
        await self.page.wait_for_selector('#view > *')

    async def js(self, expr, arg=None):
        return await self.page.evaluate(expr, arg) if arg is not None else await self.page.evaluate(expr)

    async def act(self, name, **data):
        sel = f'[data-act="{name}"]' + ''.join(f'[data-{k}="{v}"]' for k, v in data.items())
        await self.page.locator(sel).first.click()

    async def confirm(self):
        await self.page.locator('#dlgActions [value=ok]').click()

    async def text(self, sel):
        return (await self.page.locator(sel).first.inner_text()).strip()

    async def count(self, sel):
        return await self.page.locator(sel).count()

    async def until(self, expr, timeout=8.0, msg=''):
        """Espera uma condição JS ficar verdadeira (mais estável que esperas fixas)."""
        loop = asyncio.get_event_loop(); end = loop.time() + timeout
        while True:
            try:
                if await self.page.evaluate(expr): return
            except Exception:
                pass
            if loop.time() > end:
                raise AssertionError(f'[{self.name}] tempo esgotado esperando: {msg or expr}')
            await asyncio.sleep(0.1)

    # Atalhos do jogo
    async def create_room(self, rounds=3, players=None):
        await self.goto()
        cur = await self.js("draft.rounds")
        while cur != rounds:
            await self.act('step', k='rounds', d=('1' if cur < rounds else '-1')); cur = await self.js("draft.rounds")
        if players:
            cur = await self.js("draft.players")
            while cur != players:
                await self.act('step', k='players', d=('1' if cur < players else '-1')); cur = await self.js("draft.players")
        await self.act('create')
        await self.page.wait_for_selector('.roster')
        return self.page.url

    async def set_name(self, name):
        await self.page.fill('#myName', name); await self.act('saveName')

    async def join(self, url, timeout=10.0):
        await self.goto(url)
        await self.page.wait_for_selector('.roster, .statusbar', timeout=max(timeout, 10.0) * 1000)

    async def seat(self):
        return await self.js("S && S.seat")

    async def my_card(self):
        return await self.js("deck()[S.seat-1]")

    async def round(self):
        return await self.js("NET.st ? NET.st.round : S.round")

    async def open_chat(self):
        if not await self.js("!!(document.getElementById('chat') && document.getElementById('chat').open)"):
            await self.act('chatToggle')
            await self.page.wait_for_selector('#chat[open]')

    async def say(self, text):
        await self.open_chat()
        await self.page.fill('#chatInput', text)
        await self.page.locator('#chatForm button').click()

    async def chat_text(self):
        await self.open_chat()
        return await self.js("document.getElementById('chatLog').innerText")


class E2E(unittest.IsolatedAsyncioTestCase):
    """Base: um navegador por teste, celulares em contextos separados."""
    async def asyncSetUp(self):
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch()
        self.relay = Relay()
        self.errors = []
        self.phones = []
        self.turn_servers = None   # lista iceServers falsa; None com turn_status padrão aborta
        self.turn_status = None    # None aborta; 200 entrega; 500, 'bad' ou 'slow' simulam falha
        self.turn_hits = 0
        self.turn_release = asyncio.Event()

    async def asyncTearDown(self):
        self.turn_release.set()
        out = os.path.join(ARTIFACTS, self.id().split('.')[-1])
        os.makedirs(out, exist_ok=True)
        for p in self.phones:
            try: await p.page.screenshot(path=os.path.join(out, f'{p.name}.png'), full_page=True)
            except Exception: pass
        await self.browser.close(); await self.pw.stop()
        self.assertEqual(self.errors, [], 'erros de JavaScript na página')

    async def _turn_route(self, route):
        """O app não pode falar com o Worker de verdade durante os testes."""
        self.turn_hits += 1
        status = self.turn_status
        if status is None:
            await route.abort()
            return
        if status == 'slow':
            try:
                await asyncio.wait_for(self.turn_release.wait(), 20)
            except asyncio.TimeoutError:
                pass
            try:
                await route.fulfill(status=200, content_type='application/json', body='{"iceServers":[]}',
                                    headers={'cache-control': 'no-store'})
            except Exception:
                pass
            return
        if status == 'bad':
            await route.fulfill(status=200, content_type='application/json', body='{',
                                headers={'cache-control': 'no-store'})
            return
        body = json.dumps({'iceServers': self.turn_servers or []})
        await route.fulfill(status=status, content_type='application/json', body=body,
                            headers={'cache-control': 'no-store'})

    async def phone(self, name, scheme='light', viewport=None, block_cdn=False, real=False, only=None):
        """real=True usa a biblioteca e as redes de verdade (internet); only='n' ou 'm' deixa só uma das redes."""
        ctx = await self.browser.new_context(viewport=viewport or PHONE, color_scheme=scheme, service_workers='block')
        await ctx.expose_binding('__relay', self.relay.handle)
        await ctx.route(TURN, self._turn_route)
        if real:
            if only:
                other = 'mqtt' if only == 'n' else 'nostr'
                await ctx.route(re.compile(r'.*@trystero-p2p/' + other + r'.*'), lambda r: r.abort())
        elif block_cdn:
            await ctx.route(CDN, lambda r: r.abort())
        else:
            async def route(r):
                kind = 'n' if 'nostr' in r.request.url else 'm'
                await r.fulfill(status=200, body=FAKE.replace('__KIND__', kind),
                                headers={'content-type': 'text/javascript', 'access-control-allow-origin': '*'})
            await ctx.route(CDN, route)
        page = await ctx.new_page()
        page.on('pageerror', lambda e, n=name: self.errors.append(f'{n}: {e}'))
        p = Phone(self, page, name); self.phones.append(p)
        return p

    async def room(self, names=('Luiz', 'Ana', 'Pedro'), rounds=3, start=True, wait=8.0, **kw):
        """Cria a sala com o primeiro celular e faz os outros entrarem pelo convite."""
        host = await self.phone(names[0], **kw)
        url = await host.create_room(rounds=rounds)
        await host.set_name(names[0])
        others = []
        for n in names[1:]:
            p = await self.phone(n, **kw); await p.join(url, timeout=wait); await p.set_name(n); others.append(p)
        await host.until(f"NET.st.players.length==={len(names)} && NET.st.players.every(p=>p.name)", timeout=wait, msg='todos na sala com nome')
        if start:
            await host.act('start')
            for p in [host] + others:
                await p.until("S && S.status==='play' && S.seat>0", timeout=wait, msg='partida começou')
                if await p.count('[data-act=tipsOk]'): await p.act('tipsOk')
        return url, host, others

    async def all_until(self, phones, expr, msg=''):
        for p in phones: await p.until(expr, msg=msg)
