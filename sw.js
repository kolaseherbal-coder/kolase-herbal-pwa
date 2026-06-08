// Kolase Herbal - Service Worker
// Versi: 1.0.0
const CACHE_NAME = 'kolase-herbal-v1';
const OFFLINE_URL = 'https://kolaseherbal.blogspot.com/';

// Aset yang di-cache saat install
const PRECACHE_URLS = [
  'https://kolaseherbal.blogspot.com/',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
];

// Install: pre-cache aset utama
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First untuk HTML, Cache First untuk aset statis
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Lewati request non-GET
  if (event.request.method !== 'GET') return;

  // Lewati request ke API/feeds Blogger
  if (url.pathname.includes('/feeds/') || url.search.includes('alt=json')) return;

  // Aset statis (font, CSS, gambar): Cache First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('blogger.googleusercontent.com') ||
    url.pathname.match(/\.(css|js|woff2?|png|jpg|jpeg|gif|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Halaman HTML Blogger: Network First, fallback ke cache
  if (url.hostname.includes('blogspot.com') || url.hostname.includes('kolaseherbal')) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match(OFFLINE_URL)
        )
      )
    );
  }
});
