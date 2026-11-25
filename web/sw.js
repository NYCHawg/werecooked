// Caches the app shell so it opens fast and offline; data always comes live from Supabase.
const V = 'werecooked-v14';
const SHELL = ['./', 'index.html', 'app.js', 'vendor/supabase.js', 'vendor/leaflet.js', 'vendor/leaflet.css', 'manifest.json', 'icon-192.png', 'apple-touch-icon.png', 'logo.svg', 'library.json', 'ingredients.json', 'kitchen.js', 'staples.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
