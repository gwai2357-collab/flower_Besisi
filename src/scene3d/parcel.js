// 소포: 크라프트 봉투 + 개봉선 띠. (임시: 꽃망울 · 선물 오브젝트 v11의 소포 코드로 교체할 자리 — 받기 단계에서 가져옴)
import * as THREE from 'three';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';

export function makeParcel(){
  const g = new THREE.Group();
  const kraft = snappable(new THREE.MeshStandardMaterial({ color: '#b98d5e', flatShading: true, roughness: 0.95 }), SNAP.parcel);
  const band = snappable(new THREE.MeshStandardMaterial({ color: '#efe3cc', flatShading: true, roughness: 0.9 }), SNAP.parcel);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.045), kraft); body.position.y = 0.09; g.add(body);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.262, 0.006, 0.047), band); flap.position.y = 0.155; g.add(flap);   // 개봉선 띠
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.049), band); tab.position.set(0.11, 0.155, 0); g.add(tab);
  g.userData = { body, band: flap };
  return g;
}
