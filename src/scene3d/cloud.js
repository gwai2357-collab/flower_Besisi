// 3D 말풍선: 뭉게구름 모양의 로우폴리 물체를 실제로 3D로 만들어, 말풍선 글씨 뒤에서 매 프레임 살짝 돌려 가며 그린다(빛이 달라져 입체로 보임).
// 앞면은 평평(글씨를 넣을 자리), 가장자리만 몽글몽글, 아래로 연결 공 두 개. 글씨는 3D가 아니라 위에 얹은 HTML이라 또렷하다.
// 말풍선은 상황에 따라 작아졌다가(···) 누르면 커지며 펼쳐진다: 화면을 덜 가리게.
import * as THREE from 'three';

export const TAIL = 26;   // 말풍선 아래에 달리는 연결 공들이 들어갈 높이(px)
let R = null;
const geoCache = new Map(), imgCache = new Map();
const mat = new THREE.MeshStandardMaterial({ color: '#fffaf6', flatShading: true, roughness: 0.95 });
function renderer(){
  if (R) return R;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#e9c9d2', 1.6));
  const d = new THREE.DirectionalLight('#ffffff', 1.2); d.position.set(0.5, 0.8, 2); scene.add(d);
  R = { r, scene, canvas, cur: null };
  return R;
}
// 구름 한 덩이 만들기 (같은 크기의 말풍선은 같은 구름)
function buildCloud(w, h){
  const key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const H2 = h + TAIL, body = new THREE.Group(), g = new THREE.Group(), rad = Math.min(w, h) * 0.2, depth = rad * 0.5;
  body.position.y = TAIL / 2; g.add(body);   // 본체는 위쪽 h만큼, 꼬리 공은 아래 TAIL 구역
  body.add(new THREE.Mesh(new THREE.BoxGeometry(w - rad * 1.4, h - rad * 1.4, depth), mat));
  let seed = Math.round(w * 7 + h * 13);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bump = (x, y) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * (0.65 + rnd() * 0.75), 1), mat); m.position.set(x + (rnd() - 0.5) * rad * 0.7, y + (rnd() - 0.5) * rad * 0.7, 0); m.scale.z = 0.5; body.add(m); };
  const hw = w / 2 - rad * 0.75, hh = h / 2 - rad * 0.75, step = rad * 1.05;
  for (let x = -hw; x <= hw + 1; x += step){ bump(x, hh); bump(x, -hh); }
  for (let y = -hh + step; y < hh - 1; y += step){ bump(-hw, y); bump(hw, y); }
  const ball = (x, y, r2) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r2, 1), mat); m.position.set(x, y, 0); m.scale.z = 0.6; g.add(m); };
  ball(-w / 2 + rad * 2.2, -H2 / 2 + 11, 6.5); ball(-w / 2 + rad * 2.2 - 11, -H2 / 2 + 4.5, 3.8);
  const o = { g, w, h, H2, cam: new THREE.OrthographicCamera(-w / 2, w / 2, H2 / 2, -H2 / 2, -500, 500) };
  geoCache.set(key, o); return o;
}
function draw(o, ry = 0, rx = 0){
  const { r, scene, canvas } = renderer(), pw = Math.max(24, Math.round(o.w * 0.42)), ph = Math.max(20, Math.round(o.H2 * 0.42));
  r.setSize(pw, ph, false);
  if (R.cur !== o.g){ if (R.cur) scene.remove(R.cur); scene.add(o.g); R.cur = o.g; }
  o.g.rotation.set(rx, ry, 0); r.render(scene, o.cam);
  return canvas;
}
// 정지 그림(dataURL): 상단 설정 아이콘 구름처럼 움직일 필요 없는 곳용
export function cloudImage(w, h){
  const o = buildCloud(w, h), key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const url = draw(o).toDataURL('image/png'); imgCache.set(key, url); return url;
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
  // 모든 말풍선을 매 프레임(약 24fps) 살짝 돌려 가며 다시 그림
  let last = 0;
  const loop = t => {
    requestAnimationFrame(loop);
    if (t - last < 42 || document.hidden) return; last = t;
    for (const b of bubbles){
      if (!b.isConnected){ if (b.__seen) bubbles.delete(b); continue; }
      b.__seen = true;
      const w = b.offsetWidth, h = b.offsetHeight; if (!w || !h) continue;
      const cv = b.__cv, o = buildCloud(w + 22, h + 18);
      const src = draw(o, Math.sin(t * 0.0011 + b.__ph) * 0.2 + ptr.x * 0.18, Math.sin(t * 0.0008 + b.__ph * 2) * 0.1 - ptr.y * 0.1);
      if (cv.width !== src.width || cv.height !== src.height){ cv.width = src.width; cv.height = src.height; }
      const c2 = cv.getContext('2d'); c2.imageSmoothingEnabled = false; c2.clearRect(0, 0, cv.width, cv.height); c2.drawImage(src, 0, 0);
    }
  };
  requestAnimationFrame(loop);
}

// ---------- 말풍선 요소 ----------
// bubble(html): 펼쳐 있으면 글씨가 보이고, 작아지면(mini) "···"만 남는다. 누르면 다시 커지며 펼쳐진다. 처음엔 펼쳐 있다가 7초 뒤 또는 3D를 만지면 접힘.
export function bubble(html){
  const el = document.createElement('div'); el.className = 'bubble';
  const cv = document.createElement('canvas'); cv.className = 'bg3d';
  const text = document.createElement('div'); text.className = 'btext'; text.innerHTML = html;
  const dots = document.createElement('div'); dots.className = 'bdots'; dots.textContent = '···';
  el.append(cv, text, dots);
  el.__cv = cv; el.__ph = Math.random() * 6; el.__openedAt = performance.now();
  let timer = 0;
  el.setMini = m => {
    const was = el.classList.contains('mini');
    el.classList.toggle('mini', m);
    if (was !== m){ el.classList.remove('grow'); void el.offsetWidth; el.classList.add('grow'); }
    clearTimeout(timer);
    if (!m){ el.__openedAt = performance.now(); timer = setTimeout(() => el.setMini(true), 7000); }
  };
  el.say = h => { text.innerHTML = h; el.setMini(false); };
  el.addEventListener('click', () => el.setMini(!el.classList.contains('mini')));
  bubbles.add(el);
  timer = setTimeout(() => el.setMini(true), 7000);
  return el;
}
