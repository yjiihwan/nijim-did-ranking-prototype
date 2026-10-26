// 오프라인(인터넷 끊김·재부팅 직후)에도 마지막 화면을 띄우기 위한 캐시
const SHELL = 'did-shell-v2';
const STATIC = 'did-static-v2';
const SHELL_FILES = ['index.html', 'app.js', 'style.css', 'assets/manifest.js'];
// 글꼴을 미리 받아 두지 않으면 오프라인 재시작 때 글자 폭을 기본 글꼴로 재서 배치가 틀어짐
const FONT_FILES = ['Medium', 'SemiBold', 'Bold', 'ExtraBold'].map((w) => `assets/fonts/Pretendard-${w}.woff2`);

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)), caches.open(STATIC).then((c) => c.addAll(FONT_FILES))]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![SHELL, STATIC].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  const rel = url.pathname.startsWith(scope) ? url.pathname.slice(scope.length) : url.pathname;

  // 글꼴·캐릭터: 바뀌지 않으므로 캐시 우선
  if (rel.startsWith('assets/fonts/') || rel.startsWith('assets/characters/')) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // 화면 틀·데이터: 네트워크 우선, 실패하면 캐시(데이터는 ?t= 무시하고 같은 파일로 저장)
  const key = req.mode === 'navigate' ? 'index.html' : new Request(url.origin + url.pathname);
  e.respondWith(caches.open(SHELL).then(async (c) => {
    try {
      const res = await withTimeout(fetch(req), 8000);
      if (res.ok) c.put(key, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(key);
      if (hit) return hit;
      throw err;
    }
  }));
});
