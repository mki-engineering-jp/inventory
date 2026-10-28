// 幹開発 在庫管理 - Service Worker
// 目的: Android/Chrome で「アプリとしてインストール」できるようにするため。
// index.html や在庫データは常にネットワークから取得（キャッシュしない）。
// アイコンとマニフェストだけ軽くキャッシュする。
const CACHE = 'mki-inv-static-v1';
const STATIC = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isStatic = url.origin === self.location.origin && /\/(icons\/|manifest\.json$)/.test(url.pathname);
  if (isStatic) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
    return;
  }
  // それ以外はそのままネットワークへ（オフライン時は簡単な案内を返す）
  e.respondWith(
    fetch(req).catch(() => {
      if (req.mode === 'navigate') {
        return new Response(
          '<!DOCTYPE html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<body style="font-family:sans-serif;padding:40px 20px;text-align:center;color:#333">' +
          '<h2>オフラインです</h2><p>在庫管理はインターネット接続が必要です。<br>接続を確認してから再度開いてください。</p>' +
          '<p><a href="./" style="color:#1f5fa8">再読み込み</a></p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      return Response.error();
    })
  );
});
