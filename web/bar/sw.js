// Back Home Bar: caches the app shell and catalog so it opens fast and offline; data always comes live from Supabase.
const V = 'backhomebar-v3';
const SHELL = ['./', 'index.html', 'app.js', 'data/catalog.json', 'manifest.json', 'icon-192.png', 'apple-touch-icon.png', '../vendor/supabase.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('backhomebar-') && k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
