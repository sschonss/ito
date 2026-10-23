/* ito — service worker
 * Ao publicar uma nova versão, aumente VERSION aqui e em js/core.js. */
const VERSION = '2.1.0';
const LIB_CACHE = 'ito-lib-1';
const LIB_HOSTS = ['cdn.jsdelivr.net', 'esm.sh'];
const CACHE = 'ito-' + VERSION;
const ASSETS = [
  './', 'index.html', 'styles.css', 'config.js',
  'js/themes.js', 'js/core.js', 'js/home.js', 'js/crypto.js', 'js/net.js', 'js/rules.js', 'js/screens.js', 'js/effects.js', 'js/ruler.js', 'js/actions.js', 'js/pass.js', 'js/boot.js',
  'lib/qrcodegen.js', 'manifest.webmanifest',
  'fonts/inter-400.woff', 'fonts/inter-600.woff', 'fonts/inter-display-800.woff',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== LIB_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Credenciais TURN duram 24 h: sempre na rede, nunca no cache.
  if (url.hostname === 'ito-turn.sschonss.workers.dev') {
    e.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Biblioteca de conexão (CDN): guarda uma cópia para não depender do CDN toda vez.
  if (LIB_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(LIB_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })());
    return;
  }
  if (url.origin !== location.origin) return;

  // Páginas: rede primeiro (pega versão nova), cache se offline.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        const c = await caches.open(CACHE);
        c.put('index.html', res.clone());
        return res;
      } catch (err) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Arquivos: cache primeiro e atualiza em segundo plano.
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const network = fetch(req).then(async res => {
      if (res && res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    return (await network) || Response.error();
  })());
});
