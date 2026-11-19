// 캐릭터: (임시) 둥근 로우폴리 인형. 꽃망울 · 캐릭터 실험 v0의 6종·옵션으로 교체할 자리 — S3 다음 단계에서 가져옴.
// params: { skin, hair, outfit, kind } 색은 '#rrggbb'. holdBouquet이 있으면 손에 미니 다발을 듦.
import * as THREE from 'three';
import { snappable, renderBouquet } from './bouquet-v0.js';
import { SNAP } from './stage.js';

export const CHARACTER_PRESETS = [
  { name: '모카', skin: '#f2c9a5', hair: '#5a3a2a', outfit: '#8fb8de' },
  { name: '몽실', skin: '#f6d6bd', hair: '#e9b44c', outfit: '#e88fa5' },
  { name: '까망', skin: '#d9a77c', hair: '#2b2224', outfit: '#9bc28a' },
  { name: '솜솜', skin: '#fbe0cf', hair: '#b86a5a', outfit: '#f2d27a' },
  { name: '푸른', skin: '#e8b995', hair: '#4a5c8a', outfit: '#d9d2f0' },
  { name: '라떼', skin: '#f0c39a', hair: '#8a6a4a', outfit: '#f0f0ea' },
];
export function randomCharacter(){ return { ...CHARACTER_PRESETS[Math.floor(Math.random() * CHARACTER_PRESETS.length)] }; }

export function makeCharacter(p, { holdBouquet } = {}){
  const M = c => snappable(new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 }), SNAP.bouquet);
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 8), M(p.outfit)); body.position.y = 0.22; g.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 1), M(p.skin)); head.position.y = 0.55; g.add(head);
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), M(p.hair)); hair.position.set(0, 0.64, -0.03); hair.scale.set(1, 0.72, 1); g.add(hair);
  const eyeM = M('#2b1d22');
  for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.02, 0), eyeM); e.position.set(0.07 * s, 0.54, 0.17); g.add(e); }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), eyeM); mouth.position.set(0, 0.47, 0.18); g.add(mouth);
  for (const s of [-1, 1]){ const a = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.22, 6), M(p.outfit)); a.position.set(0.2 * s, 0.25, 0.04); a.rotation.z = 0.25 * s; g.add(a); }
  if (holdBouquet){
    const b = renderBouquet(holdBouquet); b.scale.setScalar(0.42); b.position.set(0, 0.0, 0.2); b.rotation.x = -0.05; g.add(b);
  }
  return g;
}
