"""Diagnóstico das redes públicas usadas pelo ito.

Lê a lista `RELAYS` de js/core.js e, para cada endereço, tenta conectar e
publicar. No Nostr o evento é do mesmo tipo que o Trystero 0.25.4 manda
(kind = soma dos códigos do tópico, módulo 10000, mais 20000). No MQTT é
um PUBLISH com QoS 1. Nada daqui faz o teste falhar: quem chama é que
decide se imprime ou grava.
"""
import asyncio, hashlib, json, os, re, secrets, struct, time
from urllib.parse import unquote, urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ARTIFACTS = os.path.join(os.path.dirname(__file__), 'artifacts')
SAMPLE_ROOM = 'ABCD-EFGH'
PROBE_TIMEOUT = 8


def _b36(n):
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    if n == 0:
        return '0'
    out = ''
    while n:
        n, r = divmod(n, 36)
        out = digits[r] + out
    return out


def trystero_topic(app_id, room_id):
    """O tópico Nostr do Trystero: SHA-1 de `Trystero@appId@sala`, cada byte em base 36."""
    plain = f'Trystero@{app_id}@{room_id}'
    digest = hashlib.sha1(plain.encode()).digest()
    return ''.join(_b36(b) for b in digest)


def trystero_kind(topic):
    return sum(ord(c) for c in topic) % 10000 + 20000


def load_app_signal():
    with open(os.path.join(ROOT, 'js', 'core.js'), encoding='utf-8') as fh:
        src = fh.read()
    app = re.search(r"const APP_ID='([^']+)'", src)
    block = re.search(r'const RELAYS = window\.ITO_RELAYS \|\| \{([^}]*)\}', src)
    if not app or not block:
        raise RuntimeError('não achei APP_ID ou RELAYS em js/core.js')
    relays = {}
    for kind, body in re.findall(r'\b([nm])\s*:\s*\[(.*?)\]', block.group(1), re.S):
        relays[kind] = re.findall(r"'([^']+)'", body)
    if not relays.get('n') or not relays.get('m'):
        raise RuntimeError('lista de relays incompleta')
    return app.group(1), relays


def _clip(text, n=160):
    return ' '.join(str(text).split())[:n]


def _event(topic, content):
    from coincurve import PrivateKey
    sk = PrivateKey()
    pk = sk.public_key_xonly.format().hex()
    created = int(time.time())
    kind = trystero_kind(topic)
    tags = [['x', topic]]
    body = json.dumps([0, pk, created, kind, tags, content], separators=(',', ':'))
    eid = hashlib.sha256(body.encode()).digest()
    sig = sk.sign_schnorr(eid)
    sk.public_key_xonly.verify(sig, eid)
    return {
        'id': eid.hex(), 'pubkey': pk, 'created_at': created, 'kind': kind,
        'tags': tags, 'content': content, 'sig': sig.hex(),
    }


async def _probe_nostr(url, topic):
    import websockets
    row = {'net': 'nostr', 'url': url, 'connected': False, 'published': False, 'detail': ''}
    try:
        ev = _event(topic, json.dumps({'peerId': 'ito-diag', 't': int(time.time())}))
    except Exception as e:
        row['detail'] = _clip(f'assinatura: {type(e).__name__}: {e}')
        return row
    sub = secrets.token_hex(8)
    req = json.dumps(['REQ', sub, {'kinds': [ev['kind']], '#x': [topic], 'since': ev['created_at'] - 30}])
    sent = json.dumps(['EVENT', ev])
    ok = None
    echoed = False
    note = ''
    try:
        async with websockets.connect(url, open_timeout=5, close_timeout=1, ping_interval=None, max_size=1_000_000) as ws:
            row['connected'] = True
            await ws.send(req)
            await asyncio.sleep(0.2)
            await ws.send(sent)
            end = asyncio.get_running_loop().time() + PROBE_TIMEOUT
            while asyncio.get_running_loop().time() < end and (ok is None or not echoed):
                remain = end - asyncio.get_running_loop().time()
                if remain <= 0:
                    break
                try:
                    raw = await asyncio.wait_for(ws.recv(), remain)
                except asyncio.TimeoutError:
                    break
                try:
                    msg = json.loads(raw)
                except Exception:
                    continue
                if not isinstance(msg, list) or not msg:
                    continue
                kind = msg[0]
                if kind == 'OK' and len(msg) >= 3 and msg[1] == ev['id']:
                    ok = bool(msg[2])
                    note = msg[3] if len(msg) > 3 else ''
                elif kind == 'EVENT' and len(msg) >= 3 and isinstance(msg[2], dict) and msg[2].get('id') == ev['id']:
                    echoed = True
                elif kind == 'NOTICE' and not note and len(msg) > 1:
                    note = str(msg[1])
                elif kind == 'CLOSED' and not note:
                    note = str(msg[2] if len(msg) > 2 else msg)
                elif kind == 'AUTH' and not note:
                    note = 'AUTH'
    except Exception as e:
        row['detail'] = _clip(f'{type(e).__name__}: {e}')
        return row
    row['published'] = False if ok is False else (ok is True or echoed)
    if ok is False:
        row['detail'] = _clip(note or 'recusado')
    elif echoed:
        row['detail'] = _clip(note or 'eco')
    elif ok is True:
        row['detail'] = _clip((note + ' ' if note else '') + 'sem eco')
    else:
        row['detail'] = _clip(note or 'sem resposta')
    return row


def _enc_str(s):
    raw = s.encode()
    return struct.pack('!H', len(raw)) + raw


def _enc_len(n):
    out = bytearray()
    while True:
        digit = n % 128
        n //= 128
        if n:
            digit |= 0x80
        out.append(digit)
        if not n:
            break
    return bytes(out)


def _mqtt_connect(client_id, username, password):
    flags = 0x02
    payload = _enc_str(client_id)
    if username is not None:
        flags |= 0x80
        payload += _enc_str(username)
    if password is not None:
        flags |= 0x40
        payload += _enc_str(password)
    var = _enc_str('MQTT') + bytes([4, flags, 0x00, 15]) + payload
    return bytes([0x10]) + _enc_len(len(var)) + var


def _mqtt_publish(topic, payload, packet_id=1):
    body = _enc_str(topic) + struct.pack('!H', packet_id) + payload
    return bytes([0x32]) + _enc_len(len(body)) + body


def _split_mqtt(url):
    parsed = urlparse(url)
    user = unquote(parsed.username) if parsed.username else None
    password = unquote(parsed.password) if parsed.password else None
    path = parsed.path or '/'
    port = parsed.port or 443
    return f'wss://{parsed.hostname}:{port}{path}', user, password


async def _probe_mqtt(url):
    import websockets
    row = {'net': 'mqtt', 'url': url, 'connected': False, 'published': False, 'detail': ''}
    try:
        ws_url, user, password = _split_mqtt(url)
        async with websockets.connect(ws_url, subprotocols=['mqtt'], open_timeout=5, close_timeout=1, ping_interval=None, max_size=1_000_000) as ws:
            row['connected'] = True
            await ws.send(_mqtt_connect('ito' + secrets.token_hex(4), user, password))
            raw = await asyncio.wait_for(ws.recv(), 5)
            data = raw if isinstance(raw, (bytes, bytearray)) else raw.encode()
            if not (len(data) >= 4 and data[0] == 0x20 and data[3] == 0):
                row['connected'] = False
                row['detail'] = _clip(f'CONNACK {data[:8].hex()}')
                return row
            await ws.send(_mqtt_publish('ito/diag/' + secrets.token_hex(3), b'ping'))
            raw = await asyncio.wait_for(ws.recv(), 5)
            data = raw if isinstance(raw, (bytes, bytearray)) else raw.encode()
            row['published'] = len(data) >= 4 and data[0] == 0x40
            if not row['published']:
                row['detail'] = _clip(f'sem PUBACK {data[:8].hex()}')
    except Exception as e:
        row['detail'] = _clip(f'{type(e).__name__}: {e}')
    return row


def _format(header, rows):
    lines = [header, f"{'rede':6} {'conectou':8} {'publicou':9} endereço"]
    for row in rows:
        flag = lambda ok: 'sim' if ok else 'não'
        extra = f"  {row['detail']}" if row.get('detail') else ''
        lines.append(f"{row['net']:6} {flag(row['connected']):8} {flag(row['published']):9} {row['url']}{extra}")
    return '\n'.join(lines)


async def _collect():
    app_id, relays = load_app_signal()
    topic = trystero_topic(app_id, SAMPLE_ROOM)
    kind = trystero_kind(topic)
    jobs = [_probe_nostr(url, topic) for url in relays['n']]
    jobs += [_probe_mqtt(url) for url in relays['m']]
    rows = []
    for result in await asyncio.gather(*jobs, return_exceptions=True):
        if isinstance(result, Exception):
            rows.append({'net': '?', 'url': '?', 'connected': False, 'published': False, 'detail': _clip(f'{type(result).__name__}: {result}')})
        else:
            rows.append(result)
    when = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
    header = (
        f'diagnóstico de relays ({when}; não derruba o teste)\n'
        f'app {app_id} · sala {SAMPLE_ROOM} · tópico Trystero · kind {kind}'
    )
    return _format(header, rows)


async def relay_report():
    """Tabela em texto. Se a sonda quebrar, devolve o motivo em vez de levantar erro."""
    try:
        return await asyncio.wait_for(_collect(), 25)
    except Exception as e:
        return f'diagnóstico de relays indisponível: {type(e).__name__}: {_clip(e)}'


def write_report(test_id, text):
    """Acrescenta a tabela em tests/e2e/artifacts/<teste>/relays.txt. Não levanta erro."""
    try:
        name = test_id.split('.')[-1] or 'relays'
        out = os.path.join(ARTIFACTS, name)
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, 'relays.txt'), 'a', encoding='utf-8') as fh:
            fh.write(text.rstrip() + '\n\n')
    except Exception as e:
        print(f'  (não gravei o diagnóstico: {type(e).__name__}: {e})', flush=True)


if __name__ == '__main__':
    print(asyncio.run(relay_report()), flush=True)
