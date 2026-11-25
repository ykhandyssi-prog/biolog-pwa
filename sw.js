// バイオログ PWA — オフラインキャッシュ
const CACHE = "biolog-v7";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先（常に最新）→ オフライン時はキャッシュにフォールバック
// 自分のファイル（同一オリジン）はブラウザHTTPキャッシュを迂回し、push後すぐ反映させる
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  const net = sameOrigin
    ? fetch(req.url, { cache: "no-store", credentials: "same-origin" })
    : fetch(req);
  e.respondWith(
    net.then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});

// けさの便り（2026-11-25）：PC の letter.py が FCM 経由で送る data メッセージを通知にする。
// FCM の SDK はここに読み込まない（data だけ受けて自分で出す）。FCM は data を p.data に入れて届ける。
self.addEventListener("push", e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (_) { p = { body: e.data ? e.data.text() : "" }; }
  const d = p.data || p;
  e.waitUntil(self.registration.showNotification(d.title || "けさの便り", {
    body: d.body || "", tag: "letter-" + (d.date || ""), data: { url: "./?from=letter" }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
