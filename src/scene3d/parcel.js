// 소포: 꽃망울 · 선물 오브젝트 v11(ref/gift-objects-v11.html)의 크라프트 봉투(베개 모양) + 라벨·도장·붉은 띠 + 말려 뜯기는 개봉선 띠를 그대로 옮긴 것.
// 크기는 원본 단위(가로 1.5)라서 꽃다발 옆에 놓을 때는 scale로 줄여 쓴다. 선물 25종과 뜯기·튀어나오기 연출은 받기 단계(R1-2)에서 가져온다.
import * as THREE from 'three';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';

const Box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const cache = new Map();
function M(color){
  const hex = new THREE.Color(color).getHexString();
  if (!cache.has(hex)) cache.set(hex, snappable(new THREE.MeshStandardMaterial({ color: '#' + hex, flatShading: true, roughness: 0.85 }), SNAP.parcel));
  return cache.get(hex);
}
function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl){
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scl) m.scale.set(...scl);
  return m;
}

// 반환: THREE.Group. userData: { setFlaps(0~2.15: 뜯는 정도), setPeel(0~1), tearPivot, EW, ED }
export function makeParcel(){
  const KRAFT = '#C99A6B', KRAFT_D = '#A87A4F', KRAFT_L = '#D6AD80';
  const EW = 1.5, ED = 1.04, EH = 0.44;
  const envH = (x, z) => { const f = Math.max(0, (1 - Math.pow(Math.abs(x/(EW/2)), 4)) * (1 - Math.pow(Math.abs(z/(ED/2)), 4))); return 0.02 + EH * Math.pow(f, 0.55); };
  function pillow(){
    const g = new THREE.BoxGeometry(EW, 1, ED, 10, 1, 8);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const x = pos.getX(i) / (EW/2), z = pos.getZ(i) / (ED/2);
      const f = Math.max(0, (1 - Math.pow(Math.abs(x), 4)) * (1 - Math.pow(Math.abs(z), 4)));
      pos.setY(i, pos.getY(i) > 0 ? 0.02 + EH * Math.pow(f, 0.55) : 0.0);
    }
    g.computeVertexNormals();
    return g;
  }
  const giftBox = new THREE.Group();
  giftBox.add(mesh(pillow(), KRAFT, [0, 0, 0]));
  giftBox.add(mesh(Box(EW + 0.06, 0.025, ED + 0.06), KRAFT_D, [0, 0.0125, 0]));
  const label = new THREE.Group();
  label.add(mesh(Box(0.56, 0.01, 0.34), '#FFFDF7', [0, 0, 0]));
  for (let i = 0; i < 3; i++) label.add(mesh(Box(0.38 - i*0.07, 0.012, 0.03), '#5A4A63', [-0.05 - i*0.035, 0.002, -0.08 + i*0.075]));
  label.position.set(-0.2, envH(-0.2, 0.15) + 0.004, 0.15); label.rotation.set(0.12, 0.08, 0.05);
  giftBox.add(label);
  const stamp = mesh(Box(0.16, 0.012, 0.19), '#D9334A', [0.4, envH(0.4, 0.12) + 0.003, 0.12], [0.1, -0.1, -0.3]);
  giftBox.add(stamp);
  giftBox.add(mesh(Box(0.1, 0.014, 0.12), '#FBF6EC', [0.4, envH(0.4, 0.12) + 0.006, 0.12], [0.1, -0.1, -0.3]));
  giftBox.add(mesh(Box(EW - 0.3, 0.012, 0.05), '#D9334A', [0, envH(0, -0.17) + 0.004, -0.17], [0.15, 0, 0]));
  const TEAR_Y = envH(0, 0.44) - 0.02, TEAR_Z = 0.445;
  const TEAR0 = new THREE.Vector3(-0.66, TEAR_Y, TEAR_Z);
  giftBox.add(mesh(Box(1.32, 0.012, 0.11), '#4A3020', [0, TEAR_Y - 0.008, TEAR_Z], [1.0, 0, 0]));
  const tearPivot = new THREE.Group(); tearPivot.position.copy(TEAR0); tearPivot.rotation.x = 1.0;
  const tearInner = new THREE.Group(); tearPivot.add(tearInner);
  // 개봉선 띠: 마디 여러 개를 이어 붙여서, 손잡이 쪽부터 종이가 말리며 뜯기게
  const NSEG = 14, SL = 1.32 / NSEG, segs = [];
  let segParent = tearInner;
  for (let i = 0; i < NSEG; i++){
    const g = new THREE.Group(); g.position.x = i === 0 ? 0 : SL;
    g.add(mesh(Box(SL + 0.006, 0.02, 0.12), KRAFT_L, [SL / 2, 0.006, 0]));
    g.add(mesh(Box(SL + 0.006, 0.024, 0.018), '#D9334A', [SL / 2, 0.008, -0.05]));
    if (i === NSEG - 1) g.add(mesh(Box(0.12, 0.028, 0.15), '#D9334A', [SL + 0.04, 0.01, 0]));
    segParent.add(g); segs.push(g); segParent = g;
  }
  // p: 0 붙어 있음 → 1 다 뜯김. 뜯긴 마디마다 조금씩 꺾여서 끝이 둥글게 말림
  function setPeel(p){
    const b = NSEG * (1 - p);
    segs.forEach((g, i) => { const k = Math.max(0, Math.min(1, i + 1 - b)); g.rotation.z = k * (0.42 + 0.1 * k * (i / NSEG)); });
  }
  giftBox.add(tearPivot);
  function setFlaps(a){
    const p = a / 2.15;
    tearPivot.position.copy(TEAR0); tearPivot.rotation.set(1.0, 0, 0);
    tearInner.rotation.z = 0; setPeel(Math.min(p, 1) * (p < 1 ? 0.6 : 1));
    tearPivot.visible = p < 1;
  }
  const root = new THREE.Group(); root.add(giftBox);
  root.userData = { setFlaps, setPeel, tearPivot, giftBox, EW, ED };
  return root;
}
