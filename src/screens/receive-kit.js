// 받기 화면들이 같이 쓰는 것: 받은 선물 데이터, 받기 진행 상태, 유리돔.
import { decodeGift, state, paperColor } from '../state.js';
import { DEMO_BOUQUET, DEFAULT_LOOK } from '../scene3d/previews.js';
import { snappable } from '../scene3d/bouquet-v0.js';
import { SNAP } from '../scene3d/stage.js';
import * as THREE from 'three';

// 받기 진행 상태 (화면을 옮겨 다녀도 유지). cardRead: 카드를 열어 본 뒤에야 소포가 열림.
export const rx = { d: null, cardRead: false, giftOpened: false, daysLeft: 6 };

// 링크(#r=코드)로 받은 데이터. 없으면(스토리보드 등) 지금 만든 다발이나 시연용 데이터로 채움.
export function getData(ctx){
  if (ctx.params?.code){ const d = decodeGift(ctx.params.code); if (d){ rx.d = d; rx.cardRead = false; rx.giftOpened = false; } }
  if (!rx.d){
    const items = state.items.length ? state.items : DEMO_BOUQUET;
    rx.d = { items, wrap: state.wrap, letter: { ...state.letter, paper: state.letter.paper },
      gift: state.gift.has ? { ...state.gift } : { kind: 'cake', ask: '이 상자 안에 뭐가 들었을까요?', code: 'GF4K-82QT-7735-NX09' },
      from: { nick: state.character.nickname || '하나', look: state.character.look || DEFAULT_LOOK() } };
  }
  rx.d.from = rx.d.from || {}; rx.d.from.look = rx.d.from.look || DEFAULT_LOOK();
  return rx.d;
}
export const senderName = d => d.from?.nick || '누군가';

// 받침대 + 유리돔 (스케치: 꽃다발이 돔 안에). frost: 0~1 김 서림(남은 날이 줄수록 늘어남)
export function makeDome(frost = 0){
  const g = new THREE.Group(), R = 0.5, H = 0.62;
  const wood = snappable(new THREE.MeshStandardMaterial({ color: '#d9c3a3', flatShading: true, roughness: 0.9 }), SNAP.parcel);
  const glass = snappable(new THREE.MeshStandardMaterial({ color: '#dff0ff', flatShading: true, roughness: 0.2, transparent: true, opacity: 0.16 + frost * 0.45, depthWrite: false, side: THREE.DoubleSide }), SNAP.parcel);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.07, R + 0.1, 0.12, 12), wood); ped.position.y = 0.06; g.add(ped);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 12, 1, true), glass); wall.position.y = 0.12 + H / 2; g.add(wall);
  const top = new THREE.Mesh(new THREE.SphereGeometry(R, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), glass); top.position.y = 0.12 + H; top.scale.y = 1.25; g.add(top);
  g.userData = { base: 0.12, height: H + R * 1.25 };
  return g;
}
