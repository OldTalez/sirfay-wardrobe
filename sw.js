/* LEARNING NOTE: the offline helper ("service worker"). The browser runs it beside the page.
   On the first visit it saves the app and the list. Every request for this site's own files tries the internet first
   (so new versions and other phones' changes show up when online) and keeps a copy; with no signal it uses the copy.
   Copies are stored without the "?t=…" part of the address, so a refresh request still finds the saved copy offline.
   Photos are also kept by the app itself (in IndexedDB), so they show offline too. */
const CACHE = "sirfay-wardrobe-v2";
const FILES = ["./", "index.html", "data.json", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // GitHub, store links etc. go straight out
  const key = url.origin + url.pathname;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return r; })
    .catch(() => caches.match(key).then(r => r || (e.request.mode === "navigate" ? caches.match(new URL("index.html", location).href) : undefined))));
});
