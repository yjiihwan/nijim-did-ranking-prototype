// 니짐내짐 DID 랭킹판 (1920×1080) — 배치·글자 맞춤 규칙은 디자인 시안 _src/build.py 를 그대로 옮김
(() => {
  'use strict';
  const W = 1920, H = 1080, X0 = 112, X1 = 1808;
  const BG = '#F2F2F5', CARD = '#FFFFFF', TILE = '#F5F5F7';
  const INK = '#16161C', SLATE = '#6B6B73', LINE = '#ECECEF';
  const ROSE = '#FF0065', ROSE_SOFT = '#FFEDF3';
  const WT = { Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800 };
  const STAGES = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
  const SCREEN_MS = 15000;
  const REFRESH_MS = 60000;
  const FETCH_TIMEOUT_MS = 10000;
  const A = window.DID_ASSETS;

  const qs = new URLSearchParams(location.search);
  const centerId = ((location.pathname.match(/\/did\/([A-Za-z0-9_-]+)/) || [])[1] || qs.get('c') || '').toLowerCase();
  const CACHE_KEY = `did:last:${centerId}`;

  // ───────── 글자 폭 (PIL getlength 대신 canvas) ─────────
  const ctx = document.createElement('canvas').getContext('2d');
  const tw = (t, w, s) => { ctx.font = `${WT[w]} ${s}px Pretendard`; return ctx.measureText(t).width; };
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f1 = (v) => v.toFixed(1);

  const text = (x, y, t, s, w = 'Bold', fill = INK, anchor = 'start') =>
    `<text x="${f1(x)}" y="${f1(y)}" font-family="Pretendard" font-weight="${WT[w]}" font-size="${s}" fill="${fill}" text-anchor="${{ start: 'start', mid: 'middle', end: 'end' }[anchor]}">${esc(t)}</text>`;

  const fit1 = (t, w, sizes, maxw) => sizes.find((s) => tw(t, w, s) <= maxw) ?? null;

  // 한 줄에 안 들어가면 2줄 균형 분할(공백 우선, 없으면 양쪽 폭이 비슷한 글자 위치). 잘림 없음.
  const wrap2 = (t, w, s, maxw) => {
    if (tw(t, w, s) <= maxw) return [t];
    const sp = t.lastIndexOf(' ');
    if (sp > 0) {
      const a = t.slice(0, sp), b = t.slice(sp + 1);
      if (tw(a, w, s) <= maxw && tw(b, w, s) <= maxw) return [a, b];
    }
    const chars = Array.from(t);
    let best = null, bestD = Infinity;
    for (let i = 1; i < chars.length; i++) {
      const a = chars.slice(0, i).join(''), b = chars.slice(i).join('');
      const wa = tw(a, w, s), wb = tw(b, w, s);
      if (wa <= maxw && wb <= maxw && Math.abs(wa - wb) < bestD) { best = [a, b]; bestD = Math.abs(wa - wb); }
    }
    return best || [t];
  };

  const xpStr = (v) => Number(v || 0).toLocaleString('en-US');

  // ───────── 캐릭터 ─────────
  const safeId = (s) => /^[A-Za-z0-9_-]+$/.test(String(s)) ? String(s) : '';
  const charKey = (cid, lv) => {
    const st = Math.max(...STAGES.filter((s) => s <= Math.max(1, Number(lv) || 1)));
    return `${safeId(cid)}/lv${String(st).padStart(2, '0')}`;
  };
  const usedImages = new Set();
  const charInBox = (cid, lv, x, y, bw, bh, pad = 0.10) => {
    const key = charKey(cid, lv);
    const sz = A.charSizes[key];
    if (!sz) return '';
    const [iw, ih] = sz;
    const aw = bw * (1 - 2 * pad), ah = bh * (1 - 2 * pad);
    const k = Math.min(aw / iw, ah / ih);
    const dw = iw * k, dh = ih * k;
    const dx = x + (bw - dw) / 2, dy = y + bh * pad + (ah - dh); // 바닥 정렬
    const href = `assets/characters/${key}.png`;
    usedImages.add(href);
    return `<image x="${f1(dx)}" y="${f1(dy)}" width="${f1(dw)}" height="${f1(dh)}" preserveAspectRatio="xMidYMid meet" href="${href}"/>`;
  };
  const tile = (cid, lv, x, y, s, r) =>
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${TILE}"/>` + charInBox(cid, lv, x, y, s, s, 0.09);

  const logo = (x, y, h) => {
    const { vb, inner } = A.logo;
    const k = h / vb[3];
    return [`<g transform="translate(${(x - vb[0] * k).toFixed(2)},${(y - vb[1] * k).toFixed(2)}) scale(${k.toFixed(5)})">${inner}</g>`, vb[2] * k];
  };

  const qrSvg = (x, y, size, matrix) => {
    const n = matrix.length, quiet = 4, mod = size / (n + 2 * quiet);
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (matrix[r][c] === '1') d += `M${(x + (c + quiet) * mod).toFixed(2)} ${(y + (r + quiet) * mod).toFixed(2)}h${mod.toFixed(2)}v${mod.toFixed(2)}h${(-mod).toFixed(2)}z`;
    }
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#FFFFFF"/><path d="${d}" fill="${INK}" shape-rendering="crispEdges"/>`;
  };

  // ───────── 공통 머리·꼬리 ─────────
  const header = (title, pill) => {
    const g = [];
    const [lg, lw] = logo(X0, 86, 46);
    g.push(lg);
    const tx = X0 + lw + 28;
    g.push(`<rect x="${f1(tx)}" y="88" width="3" height="44" rx="1.5" fill="#D6D6DC"/>`);
    const s = 30, pw = tw(pill, 'SemiBold', s) + 56;
    g.push(`<rect x="${f1(X1 - pw)}" y="80" width="${f1(pw)}" height="60" rx="30" fill="${CARD}"/>`);
    g.push(text(X1 - pw / 2, 121, pill, s, 'SemiBold', SLATE, 'mid'));
    const room = X1 - pw - 32 - (tx + 28);
    const ts = fit1(title, 'ExtraBold', [52, 48, 44, 40], room) || 40;
    g.push(text(tx + 28, 128 - (52 - ts) * 0.36, title, ts, 'ExtraBold'));
    return g.join('');
  };

  const footer = (msg, page) => {
    const g = [text(X0, 1004, msg, 28, 'Medium', SLATE)];
    let x = X1;
    for (const i of [2, 1, 0]) {
      const on = i === page, wdt = on ? 44 : 14;
      x -= wdt;
      g.push(`<rect x="${x}" y="988" width="${wdt}" height="14" rx="7" fill="${on ? ROSE : '#D6D6DC'}"/>`);
      x -= 12;
    }
    return g.join('');
  };

  const svgWrap = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${BG}"/>${body}</svg>`;

  // ───────── ①② 랭킹 ─────────
  const POD_Y = 196, POD_SIDE_Y = 236, POD_BOT = 616, POD_W = [520, 620, 520], GAP = 18;
  const LIST_Y = 640, ROW_H = 80, LIST_COLW = (X1 - X0 - 24) / 2;

  const podiumCard = (r, x, y, w, h, row, national) => {
    const big = r === 1;
    const g = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="${CARD}"/>`];
    const bs = big ? 76 : 64, bx = x + 26, by = y + 26;
    const badge = () => {
      g.push(`<circle cx="${bx + bs / 2}" cy="${by + bs / 2}" r="${bs / 2}" fill="${big ? ROSE : INK}"/>`);
      g.push(text(bx + bs / 2, by + bs / 2 + (bs * 0.42) * 0.72 * 0.5 + 2, String(r), Math.trunc(bs * 0.56), 'ExtraBold', '#FFFFFF', 'mid'));
    };
    if (!row) { badge(); return g.join(''); }
    let ts = big ? 196 : 156;
    const xs = big ? 64 : 54;
    let cs = 28;
    const inner = w - 64;
    const sizes = big ? [50, 46, 42] : [42, 40, 38];
    let ns = fit1(row.nickname, 'ExtraBold', sizes, inner);
    let lines;
    if (ns) lines = [row.nickname];
    else { ns = sizes[sizes.length - 1]; lines = wrap2(row.nickname, 'ExtraBold', ns, inner); }
    const nlh = ns + 8;
    const sub = national ? (row.center_name || '') : '';
    if (sub) cs = fit1(sub, 'Medium', [28, 26, 24], inner) || 24;
    const textH = 16 + lines.length * nlh + (sub ? cs + 10 : 0) + 6 + xs;
    ts = Math.min(ts, h - 48 - textH); // 넘치면 캐릭터 타일을 줄여 카드 안에 맞춤
    const top = y + (h - (ts + textH)) / 2;
    const cx = x + w / 2;
    g.push(tile(row.character_type_id, row.level, cx - ts / 2, top, ts, big ? 36 : 30));
    badge();
    let yy = top + ts + 16;
    for (const ln of lines) { yy += nlh; g.push(text(cx, yy - 10, ln, ns, 'ExtraBold', INK, 'mid')); }
    if (sub) { yy += cs + 10; g.push(text(cx, yy - 6, sub, cs, 'Medium', SLATE, 'mid')); }
    yy += 6 + xs;
    const num = xpStr(row.weekly_xp), us = Math.trunc(xs * 0.5);
    const nw = tw(num, 'ExtraBold', xs), uw = tw(' XP', 'Bold', us);
    const sx = cx - (nw + uw) / 2;
    g.push(text(sx, yy - 6, num, xs, 'ExtraBold', big ? ROSE : INK));
    g.push(text(sx + nw, yy - 6, ' XP', us, 'Bold', SLATE));
    return g.join('');
  };

  const listRow = (r, x, y, w, row, national, last) => {
    const g = [];
    if (row) {
      g.push(text(x + 52, y + ROW_H / 2 + 15, String(r), 42, 'ExtraBold', INK, 'mid'));
      const ts = 64;
      g.push(tile(row.character_type_id, row.level, x + 96, y + (ROW_H - ts) / 2, ts, 18));
      const num = xpStr(row.weekly_xp), xs = 42;
      const nw = tw(num, 'ExtraBold', xs), uw = tw(' XP', 'Bold', 24);
      const xr = x + w - 28;
      g.push(text(xr - uw, y + ROW_H / 2 + 15, num, xs, 'ExtraBold', INK, 'end'));
      g.push(text(xr, y + ROW_H / 2 + 15, ' XP', 24, 'Bold', SLATE, 'end'));
      const nx = x + 96 + ts + 20;
      const maxw = (xr - uw - Math.max(nw, tw('888,888', 'ExtraBold', xs))) - 24 - nx; // 6자리 폭 미리 비움
      if (national) {
        const s = fit1(row.nickname, 'Bold', [36, 34, 32, 30], maxw) || 30;
        g.push(text(nx, y + 38, row.nickname, s, 'Bold'));
        const cs = fit1(row.center_name || '', 'Medium', [24, 22], maxw) || 22;
        g.push(text(nx, y + 68, row.center_name || '', cs, 'Medium', SLATE));
      } else {
        const s = fit1(row.nickname, 'Bold', [40, 38, 36, 34, 32], maxw);
        if (s) g.push(text(nx, y + ROW_H / 2 + 14, row.nickname, s, 'Bold'));
        else {
          const ls = wrap2(row.nickname, 'Bold', 30, maxw);
          g.push(text(nx, y + 36, ls[0], 30, 'Bold'));
          if (ls[1]) g.push(text(nx, y + 70, ls[1], 30, 'Bold'));
        }
      }
    }
    if (!last) g.push(`<rect x="${x + 28}" y="${y + ROW_H - 1}" width="${w - 56}" height="1" fill="${LINE}"/>`);
    return g.join('');
  };

  const ranking = (rows, national, title, pill, foot, page) => {
    const b = [header(title, pill)];
    const xs = [X0, X0 + POD_W[0] + GAP, X0 + POD_W[0] + GAP + POD_W[1] + GAP];
    for (const [r, i] of [[2, 0], [1, 1], [3, 2]]) {
      const y = r === 1 ? POD_Y : POD_SIDE_Y;
      b.push(podiumCard(r, xs[i], y, POD_W[i], POD_BOT - y, rows[r - 1], national));
    }
    for (let col = 0; col < 2; col++) {
      const x = X0 + col * (LIST_COLW + 24);
      b.push(`<rect x="${x}" y="${LIST_Y}" width="${LIST_COLW}" height="${ROW_H * 4}" rx="28" fill="${CARD}"/>`);
      const rng = col === 0 ? [4, 5, 6, 7] : [8, 9, 10];
      rng.forEach((r, k) => b.push(listRow(r, x, LIST_Y + k * ROW_H, LIST_COLW, rows[r - 1], national, col === 0 && k === 3)));
      if (col === 1) {
        const y = LIST_Y + 3 * ROW_H;
        b.push(`<rect x="${x + 16}" y="${y + 10}" width="${LIST_COLW - 32}" height="${ROW_H - 20}" rx="18" fill="${ROSE_SOFT}"/>`);
        b.push(text(x + LIST_COLW / 2, y + ROW_H / 2 + 11, '내 순위는 니짐내짐 앱 [운동기록]에서', 30, 'SemiBold', ROSE, 'mid'));
      }
    }
    b.push(footer(foot, page));
    return svgWrap(b.join(''));
  };

  // ───────── ③ 오늘 운동한 회원 ─────────
  const kstToday = () => {
    const d = new Date(Date.now() + 9 * 3600e3);
    return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${'일월화수목금토'[d.getUTCDay()]}요일`;
  };

  const today = (members, total, qrMatrix, page) => {
    const b = [header('오늘 운동한 회원', `${kstToday()} · 지금까지 기록 기준`)];
    const gx0 = X0, gx1 = 1252, gy0 = 196, gy1 = 964, cols = 4, rws = 3, g = 18;
    const cw = (gx1 - gx0 - (cols - 1) * g) / cols, ch = (gy1 - gy0 - (rws - 1) * g) / rws;
    const shown = Math.min(members.length, cols * rws - 1);
    const more = Math.max(0, total - shown);
    const cells = shown + (more > 0 ? 1 : 0); // 11명 이하면 «+N명» 칸 생략
    for (let i = 0; i < cells; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = gx0 + c * (cw + g), y = gy0 + r * (ch + g);
      b.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(ch)}" rx="28" fill="${CARD}"/>`);
      if (i < shown) {
        const m = members[i];
        b.push(charInBox(m.character_type_id, m.level, x + (cw - 200) / 2, y + 14, 200, 150, 0.04));
        // 시안 규칙: Bold 32 한 줄, 안 되면 28 두 줄
        if (tw(m.nickname, 'Bold', 32) <= cw - 32) b.push(text(x + cw / 2, y + 206, m.nickname, 32, 'Bold', INK, 'mid'));
        else {
          const ls = wrap2(m.nickname, 'Bold', 28, cw - 32);
          b.push(text(x + cw / 2, y + 196, ls[0], 28, 'Bold', INK, 'mid'));
          if (ls[1]) b.push(text(x + cw / 2, y + 230, ls[1], 28, 'Bold', INK, 'mid'));
        }
      } else {
        const mt = `+${more.toLocaleString('en-US')}명`;
        const ms = fit1(mt, 'ExtraBold', [64, 58, 52, 46], cw - 48) || 46;
        b.push(text(x + cw / 2, y + ch / 2 + 4, mt, ms, 'ExtraBold', ROSE, 'mid'));
        b.push(text(x + cw / 2, y + ch / 2 + 52, '함께 운동 중', 30, 'SemiBold', SLATE, 'mid'));
      }
    }
    const px = 1276, py = 196, pw = X1 - 1276, ph = gy1 - 196, cx = px + pw / 2;
    b.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="32" fill="${CARD}"/>`);
    b.push(text(cx, py + 92, `오늘 ${total.toLocaleString('en-US')}명이`, 46, 'ExtraBold', INK, 'mid'));
    b.push(text(cx, py + 150, '운동을 기록했어요', 46, 'ExtraBold', INK, 'mid'));
    b.push(text(cx, py + 204, '나도 기록하고 캐릭터 키우기', 30, 'SemiBold', SLATE, 'mid'));
    const qsz = 380, qx = cx - qsz / 2, qy = py + 248;
    b.push(`<rect x="${qx - 4}" y="${qy - 4}" width="${qsz + 8}" height="${qsz + 8}" rx="12" fill="none" stroke="${LINE}" stroke-width="2"/>`);
    if (qrMatrix && qrMatrix.length) b.push(qrSvg(qx, qy, qsz, qrMatrix));
    b.push(`<rect x="${px + 40}" y="${qy + qsz + 30}" width="${pw - 80}" height="72" rx="36" fill="${ROSE}"/>`);
    b.push(text(cx, qy + qsz + 78, '카메라로 찍고 앱 받기', 32, 'Bold', '#FFFFFF', 'mid'));
    b.push(footer('사진·실명 없이 닉네임과 캐릭터만 보여요', page));
    return svgWrap(b.join(''));
  };

  const standby = () => { const [lg, lw] = logo(W / 2 - 160, H / 2 - 23, 46); void lw; return svgWrap(lg); };

  // ───────── 데이터 ─────────
  // «센터 화면에 안 보이기»(hide_on_did) 회원은 화면에 그리기 전에 항상 뺀다. 2단계에선 서버에서도 빼서 내려준다.
  const visible = (list) => (Array.isArray(list) ? list : []).filter((m) => m && m.hide_on_did !== true && m.nickname);
  const rank10 = (list) => visible(list).slice().sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0)).slice(0, 10);

  let data = null;
  try { data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (_) { data = null; }

  const getJson = async (url) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store', signal: ac.signal });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } finally { clearTimeout(t); }
  };

  const refresh = async () => {
    if (!centerId) return;
    try {
      const center = await getJson(`data/centers/${centerId}.json`);
      const national = await getJson(center.national_url || 'data/national.json');
      if (!center || !Array.isArray(center.weekly) || !national || !Array.isArray(national.weekly)) return;
      data = { center, national, fetchedAt: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) { /* 저장 못 해도 화면엔 영향 없음 */ }
      preload();
    } catch (_) { /* 끊김·실패: 직전 데이터 그대로 유지, 에러 화면 없음 */ }
  };

  // 서비스워커가 붙은 뒤엔 fetch 로 한 번 더 받아 캐시에 넣는다(첫 방문 땐 워커가 아직 안 붙어 있음)
  const preload = () => {
    [0, 1, 2].forEach(build);
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    usedImages.forEach((h) => { if (sw) fetch(h).catch(() => {}); else { const im = new Image(); im.src = h; } });
  };

  const build = (page) => {
    if (!data) return standby();
    const c = data.center;
    if (page === 0) return ranking(rank10(c.weekly), false, `${c.center_name} · 이번 주 랭킹`, '매주 월요일 0시 초기화', '니짐내짐 앱에 운동을 기록하면 주간 XP가 쌓여요 · 닉네임만 표시', 0);
    if (page === 1) return ranking(rank10(data.national.weekly), true, '니짐내짐 전국 · 이번 주 랭킹', '매주 월요일 0시 초기화', '전국 니짐내짐 회원 기준 · 닉네임만 표시', 1);
    const t = c.today || {};
    const ms = visible(t.members);
    return today(ms, Math.max(Number(t.total) || 0, ms.length), c.qr && c.qr.matrix, 2);
  };

  // ───────── 화면 ─────────
  const stage = document.getElementById('stage');
  const fitStage = () => {
    const k = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * k) / 2}px,${(innerHeight - H * k) / 2}px) scale(${k})`;
  };
  addEventListener('resize', fitStage);
  fitStage();

  const waitImages = (el) => Promise.race([
    Promise.all(Array.from(el.querySelectorAll('image')).map((im) => new Promise((ok) => {
      const i = new Image(); i.onload = i.onerror = ok; i.src = im.getAttribute('href');
    }))),
    new Promise((ok) => setTimeout(ok, 2000)),
  ]);

  let page = 0, current = null;
  const show = async (p) => {
    let svg;
    try { svg = build(p); } catch (_) { return; } // 데이터가 이상해도 지금 화면 유지
    const el = document.createElement('div');
    el.className = 'screen';
    el.dataset.page = String(p);
    el.innerHTML = svg;
    await waitImages(el);
    stage.appendChild(el);
    void el.offsetWidth;
    el.classList.add('on');
    const old = current;
    current = el;
    if (old) setTimeout(() => old.remove(), 450);
  };

  const start = async () => {
    try { await Promise.race([document.fonts.load('800 52px Pretendard').then(() => Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 30px Pretendard`)))), new Promise((ok) => setTimeout(ok, 5000))]); } catch (_) { /* 글꼴 실패 시 기본 글꼴 */ }
    if (!data) await refresh(); else refresh();
    await show(page);
    setInterval(() => { page = (page + 1) % 3; show(page); }, SCREEN_MS);
    setInterval(refresh, REFRESH_MS);
    // 하루 한 번(새벽 4시) 새로고침해 새 코드 반영 — 오프라인이면 서비스워커 캐시로 뜸
    setInterval(() => { const d = new Date(); if (d.getHours() === 4 && d.getMinutes() === 0 && navigator.onLine) location.reload(); }, 60000);
  };

  // 글꼴이 늦게 들어오면 글자 폭을 다시 재서 지금 화면을 다시 그림
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { if (current) show(page); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__DID = { get data() { return data; }, get page() { return page; }, centerId };
  start();
})();
