// 3D 말풍선: 뭉게구름 모양의 로우폴리 물체를 실제로 3D로 만들어, 말풍선 글씨 뒤에서 매 프레임 살짝 돌려 가며 그린다(빛이 달라져 입체로 보임).
// 앞면은 평평(글씨를 넣을 자리), 가장자리만 몽글몽글, 아래로 연결 공 두 개. 글씨는 3D가 아니라 위에 얹은 HTML이라 또렷하다.
// 말풍선은 상황에 따라 작아졌다가(···) 누르면 커지며 펼쳐진다: 화면을 덜 가리게.
import * as THREE from 'three';

export const TAIL = 0, MARGIN = 30;   // 연결 공은 이제 구름과 따로 움직이는 별도 요소라 구름 그림에는 꼬리 영역이 없음
const BALL = [{ dx: -0.30, gy: 16, size: 14 }, { dx: -0.36, gy: 30, size: 8 }];   // 구름 아래 왼쪽: 구름 폭/높이 대비 기본 위치(구름 가운데 기준)와 크기(px)   // MARGIN: 돌릴 때 구름이 그림 밖으로 잘리지 않게 두는 여백(px)
const camFor = (w, H2, m) => { const fov = 24, hh = H2 + 2 * m, dist = (hh / 2) / Math.tan(fov * Math.PI / 360) * 1.02, c = new THREE.PerspectiveCamera(fov, (w + 2 * m) / hh, 1, dist * 4); c.position.set(0, 0, dist); c.lookAt(0, 0, 0); return c; };   // 말풍선 아래에 달리는 연결 공들이 들어갈 높이(px)
let R = null;
const geoCache = new Map(), imgCache = new Map();
const mat = new THREE.MeshStandardMaterial({ color: '#fffaf6', flatShading: true, roughness: 0.95 });
function renderer(){
  if (R) return R;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  // 입체감: 주변광은 낮추고, 위·왼쪽에서 센 빛 + 반대편 약한 보조광 → 덩어리마다 밝고 어두운 면이 뚜렷하게 나뉨
  scene.add(new THREE.HemisphereLight('#ffffff', '#b99aa8', 0.75));
  const d = new THREE.DirectionalLight('#fffaf0', 2.4); d.position.set(-0.9, 1.2, 1.4); scene.add(d);
  const f = new THREE.DirectionalLight('#cfe4ff', 0.45); f.position.set(1.2, -0.4, 0.8); scene.add(f);
  R = { r, scene, canvas, cur: null };
  return R;
}
// 구름 한 덩이 만들기 (같은 크기의 말풍선은 같은 구름)
function buildCloud(w, h){
  const key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const H2 = h + TAIL, body = new THREE.Group(), g = new THREE.Group(), rad = Math.min(w, h) * 0.2, depth = rad * 1.1;   // 두툼하게
  body.position.y = TAIL / 2; g.add(body);   // 본체는 위쪽 h만큼, 꼬리 공은 아래 TAIL 구역
  body.add(new THREE.Mesh(new THREE.BoxGeometry(w - rad * 1.4, h - rad * 1.4, depth), mat));
  let seed = Math.round(w * 7 + h * 13);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bump = (x, y) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * (0.65 + rnd() * 0.75), 1), mat); m.position.set(x + (rnd() - 0.5) * rad * 0.7, y + (rnd() - 0.5) * rad * 0.7, 0); m.scale.z = 1.0; m.position.z = (rnd() - 0.3) * rad * 0.5; body.add(m); };   // 덩어리를 둥글게(납작하지 않게) + 앞뒤로 어긋나게
  const hw = w / 2 - rad * 0.75, hh = h / 2 - rad * 0.75, step = rad * 1.05;
  for (let x = -hw; x <= hw + 1; x += step){ bump(x, hh); bump(x, -hh); }
  for (let y = -hh + step; y < hh - 1; y += step){ bump(-hw, y); bump(hw, y); }
  // 원근 카메라(좁은 화각): 돌릴 때 앞쪽이 커지고 뒤쪽이 작아져 입체로 보임
  const o = { g, w, h, H2, cam: camFor(w, H2, MARGIN), camStatic: camFor(w, H2, 0) };
  geoCache.set(key, o); return o;
}
function draw(o, ry = 0, rx = 0, m = MARGIN){
  const { r, scene, canvas } = renderer(), pw = Math.max(24, Math.round((o.w + 2 * m) * 0.42)), ph = Math.max(20, Math.round((o.H2 + 2 * m) * 0.42));
  r.setSize(pw, ph, false);
  if (R.cur !== o.g){ if (R.cur) scene.remove(R.cur); scene.add(o.g); R.cur = o.g; }
  o.g.rotation.set(rx, ry, 0); r.render(scene, m ? o.cam : o.camStatic);
  return canvas;
}
let ballUrl = null;
function ballImage(){
  if (ballUrl) return ballUrl;
  const { r, scene, canvas } = renderer();
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 1), mat), cam = new THREE.OrthographicCamera(-11, 11, 11, -11, -50, 50);
  if (R.cur){ scene.remove(R.cur); R.cur = null; }
  scene.add(m); r.setSize(28, 28, false); m.rotation.set(0.4, 0.6, 0); r.render(scene, cam); ballUrl = canvas.toDataURL('image/png'); scene.remove(m);
  return ballUrl;
}
// 정지 그림(dataURL): 상단 설정 아이콘 구름처럼 움직일 필요 없는 곳용
export function cloudImage(w, h){
  const o = buildCloud(w, h), key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const url = draw(o, 0, 0, 0).toDataURL('image/png'); imgCache.set(key, url); return url;
}

// ---------- 스크롤하면 모든 말풍선이 스크롤 방향으로 은은하게 좌우로 흔들림 (--sway) ----------
let swayT = 0; const lastTop = new WeakMap();
const bubbles = new Set(); const ptr = { x: 0, y: 0 };
function nudge(dir){ document.documentElement.style.setProperty('--sway', dir * 9 + 'px'); clearTimeout(swayT); swayT = setTimeout(() => document.documentElement.style.setProperty('--sway', '0px'), 260); }
// 사용자가 3D를 만지거나 스크롤하면 열려 있던 말풍선은 작아져서 화면을 덜 가린다
const shrinkAll = () => bubbles.forEach(b => { if (performance.now() - b.__openedAt > 1500) b.setMini(true); });
if (typeof window !== 'undefined' && !window.__bubbleOn){
  window.__bubbleOn = true;
  addEventListener('scroll', e => { const t = e.target; if (!t || t.scrollTop == null) return; const d = t.scrollTop - (lastTop.get(t) || 0); lastTop.set(t, t.scrollTop); if (Math.abs(d) > 1) nudge(d > 0 ? 1 : -1); }, true);
  addEventListener('wheel', e => nudge(e.deltaY > 0 ? 1 : -1), { passive: true });
  addEventListener('pointermove', e => { ptr.x = (e.clientX / innerWidth - 0.5) * 2; ptr.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; ptr.x = Math.max(-1, Math.min(1, e.gamma / 25)); ptr.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); });
  // 3D 캔버스를 눌러 드래그하기 시작하면 말풍선을 접음
  addEventListener('pointerdown', e => { if (e.target && e.target.tagName === 'CANVAS' && !e.target.classList.contains('bg3d')) shrinkAll(); }, true);
  // 말풍선 움직임은 용수철(감쇠 이동)로 매 프레임 계산해서 은은하게 따라가고, 구름 그림은 약 24fps로 다시 그림.
  // 접힌(···) 말풍선은 3D 물체의 오른쪽 경계 옆으로, 펼치면 원래 자리로 부드럽게 이동. 연결 공 두 개는 각각 앞의 것을 천천히 뒤따라옴.
  let last = 0, tPrev = performance.now();
  const spring = (b, key, target, k, dt) => {   // 임계감쇠 용수철: 넘치거나 튕기지 않고 목표로 다가감
    const c = 2 * Math.sqrt(k), x = b[key], v = b[key + 'v'] || 0, a = k * (target - x) - c * v;
    b[key + 'v'] = v + a * dt; b[key] = x + b[key + 'v'] * dt;
  };
  const loop = t => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - tPrev) / 1000); tPrev = t;
    const draw24 = t - last >= 42; if (draw24) last = t;
    if (document.hidden) return;
    for (const b of bubbles){
      if (!b.isConnected){ if (b.__seen) bubbles.delete(b); continue; }
      const w = b.offsetWidth, h = b.offsetHeight; if (!w || !h) continue;
      if (!b.__seen){ b.__seen = true; b.type(); }   // 화면에 처음 나올 때 한 글자씩
      const mini = b.classList.contains('mini');
      // 구름의 원래(펼친) 자리 = 지금 보이는 위치에서 현재 이동량을 뺀 값
      const r = b.getBoundingClientRect(), hx = r.left + r.width / 2 - b.__tx, hy = r.top + r.height / 2 - b.__ty;
      let gx = 0, gy = 0;
      if (mini && anchorFn){ const tg = anchorFor(w, h); gx = tg.x - hx; gy = tg.y - hy; }
      spring(b, '__tx', gx, 14, dt); spring(b, '__ty', gy, 14, dt);
      b.style.transform = Math.abs(b.__tx) + Math.abs(b.__ty) < 0.05 ? '' : `translate(${b.__tx.toFixed(2)}px, ${b.__ty.toFixed(2)}px)`;
      // 연결 공: 구름 기본 위치(구름 가운데 + 오프셋)를 목표로, 첫 공은 구름을, 둘째 공은 첫 공을 천천히 뒤따름
      let tgx = b.__tx, tgy = b.__ty;   // 첫 공은 구름의 이동량을, 둘째 공은 첫 공의 이동량을 용수철로 뒤따름 (절대 이동량 기준)
      b.__balls.forEach((ball, i) => {
        const base = BALL[i], bx = base.dx * w, by = h / 2 + base.gy, kk = i ? 5 : 8;
        spring(ball, 'qx', tgx, kk, dt); spring(ball, 'qy', tgy, kk, dt);
        ball.el.style.transform = `translate(${(bx + ball.qx - b.__tx).toFixed(2)}px, ${(by + ball.qy - b.__ty).toFixed(2)}px)`;   // 부모(구름)가 이미 b.__tx 만큼 움직였으니 차이만 더함
        tgx = ball.qx; tgy = ball.qy;
      });
      if (draw24){
        const amp = mini ? 1 : 0.35;   // 펼친 상태는 차분하게, 접힌 상태(···)는 살짝 더 출렁
        const cv = b.__cv, o = buildCloud(w + 22, h + 18);
        const src = draw(o, (Math.sin(t * 0.0013 + b.__ph) * 0.34 + ptr.x * 0.22) * amp, (Math.sin(t * 0.0009 + b.__ph * 2) * 0.16 - ptr.y * 0.12) * amp);
        if (cv.width !== src.width || cv.height !== src.height){ cv.width = src.width; cv.height = src.height; }
        const c2 = cv.getContext('2d'); c2.imageSmoothingEnabled = false; c2.clearRect(0, 0, cv.width, cv.height); c2.drawImage(src, 0, 0);
      }
    }
  };
  requestAnimationFrame(loop);
}

// 접힌 말풍선이 떠 있을 자리: 3D 물체(꽃다발+캐릭터) 화면 영역의 오른쪽 경계 바로 옆, 세로로는 영역의 가운데.
let anchorFn = null;
export const setBubbleAnchor = f => { anchorFn = f; };
function anchorFor(w, h){
  const a = anchorFn() || {}, area = a.area || { left: 0, top: 0, right: innerWidth, bottom: innerHeight }, box = a.box, W = area.right - area.left, H = area.bottom - area.top;
  let x = area.right - w / 2 - 10, y = area.top + H * 0.42;
  if (box){ x = Math.min(area.right - w / 2 - 10, Math.max(area.left + W * 0.55, box.x1 + w / 2 + 8)); y = Math.min(area.top + H * 0.62, Math.max(area.top + 100, (box.y0 + box.y1) / 2)); }
  return { x, y };
}

// 글자를 한 글자씩 보이게 하는 도우미 (<b>, <br> 같은 태그는 그대로 두고 글자만 차례로)
function typeInto(node, ms = 34){
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), parts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()){ parts.push([n, n.nodeValue]); n.nodeValue = ''; }
  const total = parts.reduce((s, p) => s + p[1].length, 0); let shown = 0, stop = false;
  const t0 = performance.now();
  const tick = () => {
    if (stop) return;
    const k = Math.min(total, Math.floor((performance.now() - t0) / ms));
    if (k !== shown){ shown = k; let left = k; for (const [n, str] of parts){ const c = Math.min(left, str.length); n.nodeValue = str.slice(0, c); left -= c; } }
    if (shown < total) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => { stop = true; for (const [n, str] of parts) n.nodeValue = str; };
}

// ---------- 말풍선 요소 ----------
// bubble(html): 펼쳐 있으면 글씨가 보이고, 작아지면(mini) "···"만 남아 3D 물체 옆을 떠다닌다.
// 누르면: 떠 있던 자리에서 원래 자리로 슉 움직이며 좌우로 넓어지고, 글씨가 한 글자씩 나온다. 처음엔 펼쳐 있다가 7초 뒤 또는 3D를 만지면 접힘.
export function bubble(html){
  const el = document.createElement('div'); el.className = 'bubble';
  const cv = document.createElement('canvas'); cv.className = 'bg3d';
  const text = document.createElement('div'); text.className = 'btext'; text.innerHTML = html;
  const dots = document.createElement('div'); dots.className = 'bdots'; dots.textContent = '···';
  el.append(cv, text, dots);
  // 연결 공 두 개(구름과 따로, 각각 앞의 것을 뒤따라옴). 위치는 loop가 정함
  el.__balls = BALL.map(bb => { const i = document.createElement('img'); i.className = 'tball'; i.src = ballImage(); i.style.width = i.style.height = bb.size + 'px'; i.style.margin = (-bb.size / 2) + 'px 0 0 ' + (-bb.size / 2) + 'px'; el.append(i); return { el: i, qx: 0, qy: 0 }; });
  el.__cv = cv; el.__ph = Math.random() * 6; el.__openedAt = performance.now(); el.__tx = el.__ty = 0;
  let timer = 0, cancelType = null, html0 = html;
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => el.setMini(true), 7000); };
  el.type = () => { cancelType && cancelType(); cancelType = typeInto(text); };
  // m=true: 접기. m=false: 펼치기(작은 크기 → 자연 크기로 넓어지며 글씨가 나옴)
  el.setMini = m => {
    const was = el.classList.contains('mini');
    if (m === was){ if (!m) arm(); return; }
    cancelType && cancelType(); cancelType = null; clearTimeout(timer);
    if (m){ el.style.width = el.style.height = ''; el.classList.add('mini'); el.classList.remove('grow'); void el.offsetWidth; el.classList.add('grow'); text.innerHTML = html0; return; }
    const wm = el.offsetWidth, hm = el.offsetHeight;   // 접힌 크기 기록 → 펼친 자연 크기 측정 → 접힌 크기에서 시작해 자연 크기로 transition
    el.classList.remove('mini'); el.style.width = el.style.height = ''; text.innerHTML = html0;
    const wn = el.offsetWidth, hn = el.offsetHeight;
    el.style.width = wm + 'px'; el.style.height = hm + 'px'; el.classList.add('expanding'); void el.offsetWidth;
    el.style.width = wn + 'px'; el.style.height = hn + 'px';
    el.type();
    setTimeout(() => { el.style.width = el.style.height = ''; el.classList.remove('expanding'); }, 520);
    el.__openedAt = performance.now(); arm();
  };
  el.say = h => { html0 = h; text.innerHTML = h; if (el.classList.contains('mini')) el.setMini(false); else { el.type(); arm(); } };
  el.addEventListener('click', () => el.setMini(!el.classList.contains('mini')));
  bubbles.add(el);
  arm();
  return el;
}
