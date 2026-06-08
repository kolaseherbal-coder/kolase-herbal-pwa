// Kolase Herbal Service Worker v1.1
const CACHE = 'kolase-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        'https://kolaseherbal.blogspot.com/',
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
        'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
      ]).catch(() => {})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.includes('/feeds/') || url.search.includes('alt=json')) return;

  // Aset statis → Cache First
  if (
    url.hostname.includes('fonts.') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('googleusercontent.com') ||
    /\.(css|js|woff2?|png|jpg|jpeg|gif|svg|ico)(\?|$)/.test(url.pathname)
  ) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }))
    );
    return;
  }

  // Halaman blog → Network First
  if (url.hostname.includes('blogspot.com')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('https://kolaseherbal.blogspot.com/')))
    );
  }
});
