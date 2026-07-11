// 在庫 & 原価マネージャー — Service Worker
// 方針: stale-while-revalidate
//  ・キャッシュがあれば即返す → オフラインでも即起動
//  ・裏で最新を取りに行きキャッシュ更新 → 次回起動で新版が反映
// これによりキャッシュ名を毎回変えなくても更新が回ります。

const CACHE = "inv-mgr-cache-v1";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
