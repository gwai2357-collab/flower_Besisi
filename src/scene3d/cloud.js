// 3D 말풍선: 뭉게구름 모양의 로우폴리 덩어리를 작은 화면에 한 번 그려서 말풍선 배경 그림으로 쓴다.
// 앞면은 평평(글씨를 넣을 자리), 가장자리만 몽글몽글. 글씨는 3D가 아니라 위에 얹은 HTML.
import * as THREE from 'three';

let R = null, cache = new Map();
function renderer(){
  if (R) return R;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', '#e9c9d2', 1.6));
  const d = new THREE.DirectionalLight('#ffffff', 1.2); d.position.set(0.5, 0.8, 2); scene.add(d);
  R = { r, scene, canvas, group: null };
  return R;
}
const mat = new THREE.MeshStandardMaterial({ color: '#fffaf6', flatShading: true, roughness: 0.95 });

// w, h: 말풍선의 화면 크기(px). 반환: dataURL (낮은 해상도라 CSS에서 pixelated로 늘려 씀)
export const TAIL = 26;   // 말풍선 아래에 달리는 연결 공들이 들어갈 높이(px)
export function cloudImage(w, h){
  const key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (cache.has(key)) return cache.get(key);
  const { r, scene, canvas } = renderer();
  const H2 = h + TAIL, scale = 0.42, pw = Math.max(24, Math.round(w * scale)), ph = Math.max(20, Math.round(H2 * scale));
  r.setSize(pw, ph, false);
  if (R.group) scene.remove(R.group);
  const body = new THREE.Group(), g = new THREE.Group(), rad = Math.min(w, h) * 0.2, depth = rad * 0.5;
  body.position.y = TAIL / 2; g.add(body);   // 본체는 위쪽 h만큼, 꼬리 공은 아래 TAIL 구역
  // 가운데 평평한 판
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w - rad * 1.4, h - rad * 1.4, depth), mat); body.add(slab);
  // 가장자리를 따라 둥근 덩어리를 늘어놓음 (모양이 같은 말풍선은 같은 구름)
  let seed = Math.round(w * 7 + h * 13);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // 울퉁불퉁하게: 덩어리 크기를 크게 흔들고 가장자리에서 안팎으로 어긋나게 놓음
  const bump = (x, y, k = 1) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * (0.65 + rnd() * 0.75) * k, 1), mat); m.position.set(x + (rnd() - 0.5) * rad * 0.7, y + (rnd() - 0.5) * rad * 0.7, 0); m.scale.z = 0.5; body.add(m); };
  const hw = w / 2 - rad * 0.75, hh = h / 2 - rad * 0.75, step = rad * 1.05;
  for (let x = -hw; x <= hw + 1; x += step){ bump(x, hh); bump(x, -hh); }
  for (let y = -hh + step; y < hh - 1; y += step){ bump(-hw, y); bump(hw, y); }
  // 연결 공 두 개 (로우폴리, 왼쪽 아래로 점점 작아짐)
  const ball = (x, y, r2) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r2, 1), mat); m.position.set(x, y, 0); m.scale.z = 0.6; g.add(m); };
  ball(-w / 2 + rad * 2.2, -H2 / 2 + 11, 6.5); ball(-w / 2 + rad * 2.2 - 11, -H2 / 2 + 4.5, 3.8);
  scene.add(g); R.group = g;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, H2 / 2, -H2 / 2, -500, 500);
  r.render(scene, cam);
  const url = canvas.toDataURL('image/png'); cache.set(key, url); return url;
}

// 말풍선 요소 만들기: <div class="bubble">글씨</div>. 크기가 정해지면 구름 그림을 배경으로 깐다.
// 스크롤하면 모든 말풍선이 스크롤 방향으로 은은하게 좌우로 흔들림 (둥둥 뜬 느낌 = 입체감). 흔들림 값은 CSS 변수 --sway
let swayT = 0; const lastTop = new WeakMap();
function nudge(dir){ document.documentElement.style.setProperty('--sway', dir * 9 + 'px'); clearTimeout(swayT); swayT = setTimeout(() => document.documentElement.style.setProperty('--sway', '0px'), 260); }
if (typeof window !== 'undefined' && !window.__swayOn){
  window.__swayOn = true;
  addEventListener('scroll', e => { const t = e.target; if (!t || t.scrollTop == null) return; const d = t.scrollTop - (lastTop.get(t) || 0); lastTop.set(t, t.scrollTop); if (Math.abs(d) > 1) nudge(d > 0 ? 1 : -1); }, true);
  addEventListener('wheel', e => nudge(e.deltaY > 0 ? 1 : -1), { passive: true });
}
// 말풍선이 3D 물체처럼 보이게: 포인터(컴퓨터)·휴대폰 기울기에 따라 살짝 원근 기울임. 값은 CSS 변수 --tx/--ty
if (typeof window !== 'undefined' && !window.__tiltOn){
  window.__tiltOn = true;
  const set = (tx, ty) => { const r = document.documentElement.style; r.setProperty('--tx', tx.toFixed(1) + 'deg'); r.setProperty('--ty', ty.toFixed(1) + 'deg'); };
  addEventListener('pointermove', e => set(-(e.clientY / innerHeight - 0.5) * 10, (e.clientX / innerWidth - 0.5) * 14), { passive: true });
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; set(-Math.max(-8, Math.min(8, (e.beta - 45) / 6)), Math.max(-10, Math.min(10, e.gamma / 4))); });
}
export function bubble(html){
  const el = document.createElement('div'); el.className = 'bubble'; el.innerHTML = html;
  let last = '';
  const apply = () => {
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    const k = `${Math.round(w / 8)}x${Math.round(h / 8)}`; if (k === last) return; last = k;
    el.style.setProperty('--cloud', `url(${cloudImage(w + 22, h + 18)})`);   // 글씨 둘레로 구름이 살짝 삐져나오게 (::before가 이 그림을 깖)
  };
  new ResizeObserver(apply).observe(el);
  return el;
}
