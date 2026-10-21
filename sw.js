/* ═══════════════════════════════════════════════════════════════
   Academic Cover Page Generator — Service Worker
   Cache-first with network fallback. Precaches app shell + CDN libs.
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'acpg-v1.0.0';
const RUNTIME_CACHE = 'acpg-runtime-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js',
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IM+Fell+English:ital@0;1&display=swap'
];

/* ─── Install: precache app shell + CDN libraries ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache =>
        Promise.all(
          PRECACHE_URLS.map(url =>
            cache.add(new Request(url, { mode: 'no-cors' }))
              .catch(err => console.warn('[SW] Failed to precache:', url, err.message))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* ─── Activate: clear old cache versions ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_VERSION && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ─── Fetch: cache-first with background refresh ─── */
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Ignore non-http(s) schemes (chrome-extension://, data:, blob:, etc.)
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigation requests → try network, fall back to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put('./index.html', clone));
          return res;
        })
        .catch(() =>
          caches.match('./index.html')
            .then(r => r || caches.match('./'))
            .then(r => r || new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title>' +
              '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;' +
              'justify-content:center;height:100vh;margin:0;text-align:center;color:#1a1a2e;}' +
              'h1{font-size:1.5rem;margin-bottom:.5rem;}p{color:#8888aa;}</style></head>' +
              '<body><div><h1>Offline</h1>' +
              '<p>Open this app once while online to enable offline use.</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
            ))
        )
    );
    return;
  }

  // Everything else → cache-first, then network, then cache-update
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Stale-while-revalidate: refresh cache in the background
        fetch(req)
          .then(res => {
            if (res && res.ok) {
              caches.open(RUNTIME_CACHE).then(c => c.put(req, res.clone()));
            }
          })
          .catch(() => { /* silent — we already served from cache */ });
        return cached;
      }

      return fetch(req)
        .then(res => {
          if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Last-resort fallback for images that weren't cached yet
          if (req.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
              '<rect width="100" height="100" fill="#eee"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});

/* ─── Allow page to force-activate a waiting SW ─── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});