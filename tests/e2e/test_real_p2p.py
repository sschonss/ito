"""Conexão de verdade: dois celulares pela internet, com a biblioteca e as redes reais.

Não roda no dia a dia (depende de servidores públicos de fora). Para rodar:
    ITO_REAL_P2P=1 python -m unittest test_real_p2p -v
No GitHub roda uma vez por dia e pelo botão "Run workflow" (Conexão real).

Cada teste imprime quais relays conectaram e aceitaram uma publicação.
Se falhar, grava a mesma tabela em tests/e2e/artifacts/ e tenta uma vez mais.
A sonda em si não reprova o teste. A suíte do dia a dia não passa por aqui.
"""
import asyncio, functools, os, unittest
from harness import ARTIFACTS, E2E, Relay
from relay_diag import relay_report, write_report

REAL = os.environ.get('ITO_REAL_P2P') == '1'
WAIT = 60.0


def tenta_uma_vez(fn):
    """Uma falha de rede pública não encerra o teste: roda de novo, uma vez."""
    @functools.wraps(fn)
    async def wrapped(self, *args, **kwargs):
        await self._diagnosticar()
        try:
            return await fn(self, *args, **kwargs)
        except Exception as err:
            note = f'tentativa 1 falhou: {type(err).__name__}: {err}'
            print('\n  ' + note + '; tentando de novo uma vez', flush=True)
            write_report(self.id(), (self.relay_report or '') + '\n' + note)
            try:
                await self._fechar_celulares('tentativa-1')
            except Exception as close_err:
                print(f'\n  não consegui fechar os celulares da tentativa 1: {close_err}', flush=True)
                self.ignore_page_errors = False
                self.errors.clear()
            try:
                return await fn(self, *args, **kwargs)
            except Exception as again:
                note = f'tentativa 2 falhou: {type(again).__name__}: {again}'
                await self._diagnosticar(gravar=True, nota=note)
                raise
    return wrapped


@unittest.skipUnless(REAL, 'defina ITO_REAL_P2P=1 para testar a conexão de verdade')
class TestConexaoReal(E2E):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.relay_report = ''

    async def _diagnosticar(self, gravar=False, nota=''):
        try:
            text = await relay_report()
            if nota:
                text = text + '\n' + nota
            self.relay_report = text
            print('\n' + text, flush=True)
            if gravar:
                write_report(self.id(), text)
        except Exception as err:
            print(f'\n  diagnóstico de relays indisponível: {type(err).__name__}: {err}', flush=True)

    async def _fechar_celulares(self, pasta):
        """Fecha os celulares desta tentativa para a próxima começar limpa."""
        self.ignore_page_errors = True
        try:
            out = os.path.join(ARTIFACTS, self.id().split('.')[-1], pasta)
            os.makedirs(out, exist_ok=True)
            for phone in list(self.phones):
                try:
                    await phone.page.screenshot(path=os.path.join(out, f'{phone.name}.png'), full_page=True, timeout=5000)
                except Exception:
                    pass
                try:
                    await phone.page.context.close()
                except Exception:
                    pass
            self.phones.clear()
            await asyncio.sleep(0)
        finally:
            self.errors.clear()
            self.ignore_page_errors = False
        self.relay = Relay()

    async def jogar_uma_rodada(self, **kw):
        url, host, (ana,) = await self.room(names=('Luiz', 'Ana'), rounds=2, wait=WAIT, real=True, **kw)
        self.assertEqual(await ana.js("NET.st.hostCid"), await host.js("CID"))
        await host.js("sendAct('reveal',{order:planOrder()})")
        await ana.until("S.roundOver", timeout=WAIT, msg='Ana vê o fim da rodada')
        await host.act('next')
        await ana.until("S.round===2", timeout=WAIT, msg='Ana vai para a rodada 2')
        self.assertEqual(await ana.js("stateHash(NET.st)"), await host.js("stateHash(NET.st)"))
        return host, ana

    @tenta_uma_vez
    async def test_duas_redes_juntas(self):
        host, ana = await self.jogar_uma_rodada()
        kinds = await host.js("[...new Set(Object.keys(NET.peers).map(k=>k[0]))].sort()")
        print('\n  redes ligadas:', kinds)

    @tenta_uma_vez
    async def test_so_nostr(self):
        await self.jogar_uma_rodada(only='n')

    @tenta_uma_vez
    async def test_so_mqtt(self):
        await self.jogar_uma_rodada(only='m')
