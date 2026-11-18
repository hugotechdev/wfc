const CACHE = "wfc-portal-v6";
const ASSETS = ["/", "/app", "/css/style.css", "/js/app.js", "/wfc-logo.jpg", "/offline.html"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || e.request.url.includes("/api/")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match("/offline.html")))
  );
});
