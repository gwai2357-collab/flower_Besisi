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
export function cloudImage(w, h){
  const key = `${Math.round(w / 8)}x${Math.round(h / 8)}`;
  if (cache.has(key)) return cache.get(key);
  const { r, scene, canvas } = renderer();
  const scale = 0.42, pw = Math.max(24, Math.round(w * scale)), ph = Math.max(20, Math.round(h * scale));
  r.setSize(pw, ph, false);
  if (R.group) scene.remove(R.group);
  const g = new THREE.Group(), rad = Math.min(w, h) * 0.2, depth = rad * 0.5;
  // 가운데 평평한 판
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w - rad * 1.4, h - rad * 1.4, depth), mat); g.add(slab);
  // 가장자리를 따라 둥근 덩어리를 늘어놓음 (모양이 같은 말풍선은 같은 구름)
  let seed = Math.round(w * 7 + h * 13);
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bump = (x, y, k = 1) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * (0.85 + rnd() * 0.3) * k, 1), mat); m.position.set(x, y, 0); m.scale.z = 0.5; g.add(m); };
  const hw = w / 2 - rad * 0.75, hh = h / 2 - rad * 0.75, step = rad * 1.25;
  for (let x = -hw; x <= hw + 1; x += step){ bump(x, hh); bump(x, -hh); }
  for (let y = -hh + step; y < hh - 1; y += step){ bump(-hw, y); bump(hw, y); }
  scene.add(g); R.group = g;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -500, 500);
  r.render(scene, cam);
  const url = canvas.toDataURL('image/png'); cache.set(key, url); return url;
}

// 말풍선 요소 만들기: <div class="bubble">글씨</div>. 크기가 정해지면 구름 그림을 배경으로 깐다.
export function bubble(html){
  const el = document.createElement('div'); el.className = 'bubble'; el.innerHTML = html;
  let last = '';
  const apply = () => {
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    const k = `${Math.round(w / 8)}x${Math.round(h / 8)}`; if (k === last) return; last = k;
    el.style.backgroundImage = `url(${cloudImage(w + 22, h + 18)})`;   // 글씨 둘레로 구름이 살짝 삐져나오게
  };
  new ResizeObserver(apply).observe(el);
  return el;
}
