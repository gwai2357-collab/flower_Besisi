// 편지지(3D): 꽃다발 실험 v0(ref/bouquet-v0.html)의 "펼쳐지는 편지 카드"를 옮긴 것. 접힌 카드(CW×CH)가 위쪽 모서리를 경첩으로 펼쳐져 CW×2CH 세로 편지가 된다.
// 종이 그림(글씨·그림·편지지 색)은 캔버스 텍스처 → 3D 안에서 그려져서 PS1 효과(꼭짓점 흔들림·디더링)가 그대로 적용된다.
import * as THREE from 'three';
import { snappable, CW, CH } from './bouquet-v0.js';
import { SNAP } from './stage.js';

export { CW, CH };

function wrapText(x, text, maxW){
  const out = [];
  for (const para of text.split('\n')){
    if (!para){ out.push(''); continue; }
    let line = '';
    for (const ch of para){ const t = line + ch; if (x.measureText(t).width > maxW && line && !/[.,!?~)」』”’]/.test(ch)){ out.push(line); line = ch; } else line = t; }
    out.push(line);
  }
  return out;
}
// 펼친 편지 한 장(512×708): 편지지 색 + 접힌 자국 + 그림 + 글씨
export function letterCanvas({ text = '', paper = '#fbf7ee', drawing = null, hint = '' } = {}, cv){
  const c = cv || document.createElement('canvas'); c.width = 512; c.height = 708; const x = c.getContext('2d');
  x.fillStyle = paper; x.fillRect(0, 0, 512, 708);
  x.strokeStyle = 'rgba(120,100,80,.22)'; x.lineWidth = 6; x.strokeRect(16, 16, 480, 676);
  x.strokeStyle = 'rgba(150,130,110,.28)'; x.lineWidth = 2; x.beginPath(); x.moveTo(24, 354); x.lineTo(488, 354); x.stroke();   // 접힌 자국
  if (drawing && drawing.complete) x.drawImage(drawing, 0, 0, 512, 708);   // 낙서는 편지지 전체 영역에
  const body = text || hint;
  let size = 34, lines = [];
  for (; size >= 14; size -= 2){ x.font = `${size}px "Nanum Myeongjo", "AppleMyungjo", Georgia, serif`; lines = wrapText(x, body, 410); if (lines.length * size * 1.75 <= 600) break; }
  x.fillStyle = text ? '#4a3a30' : 'rgba(74,58,48,.35)'; x.textBaseline = 'top';
  const lh = size * 1.75; let y = Math.max(40, (708 - lines.length * lh) / 2);
  for (const l of lines){ x.fillText(l, 50, y); y += lh; }
  return c;
}

// 펼친 편지 3D. 반환: { group, setPaper({text,paper,drawing}), open(0~1) }
export function makeLetter(initial = {}){
  const cv = document.createElement('canvas'), draw = o => { letterCanvas(o, cv); tex.needsUpdate = true; };
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  letterCanvas(initial, cv);
  const top = tex.clone(); top.repeat.set(1, 0.5); top.offset.set(0, 0.5); top.needsUpdate = true;
  const bot = tex.clone(); bot.repeat.set(1, 0.5); bot.offset.set(0, 0); bot.needsUpdate = true;
  const mat = map => snappable(new THREE.MeshBasicMaterial({ map, side: THREE.FrontSide }), SNAP.parcel);
  const cover = snappable(new THREE.MeshBasicMaterial({ color: '#fbf7ee' }), SNAP.parcel);
  const g = new THREE.Group();
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), mat(bot)); g.add(inside);                        // 아래 절반(안쪽 면)
  const pivot = new THREE.Group(); pivot.position.set(0, CH / 2, 0.0008); g.add(pivot);                            // 위쪽 모서리가 경첩
  const front = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), cover); front.position.y = -CH / 2; pivot.add(front);   // 표지(접혔을 때 겉)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), mat(top)); back.position.set(0, -CH / 2, -0.0004); back.rotation.x = Math.PI; pivot.add(back);   // 표지 뒷면 = 위 절반
  const api = {
    group: g,
    open(k){ pivot.rotation.x = -Math.PI * Math.max(0, Math.min(1, k)); },
    setPaper(o){ draw(o); top.needsUpdate = true; bot.needsUpdate = true; },
    dispose(){ g.traverse(o => o.geometry && o.geometry.dispose()); tex.dispose(); top.dispose(); bot.dispose(); },
  };
  api.open(1);
  return api;
}
