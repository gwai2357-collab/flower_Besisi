// 화면마다 무대에 올릴 3D 물체를 만드는 곳. 꽃다발은 renderBouquet(data) 하나로만 그린다(나중에 꽃 생성기로 교체).
import * as THREE from 'three';
import { renderBouquet, rollItem } from './bouquet-v0.js';
import { makeParcel } from './parcel.js';
import { makeCharacter, CHARACTER_PRESETS } from './character.js';
import { byId } from '../data/flowers.js';

// 시연용 다발 (고정 시드라 늘 같은 모습)
const demo = ids => ids.map((id, k) => ({ ...rollItem(byId[id].type), seed: 1000 + k * 37, flower: id }));
export const DEMO_BOUQUET = demo(['roseRed', 'roseRed', 'lisianthus', 'daisy', 'marigold', 'asclepias', 'delphSpray', 'eucalyptus', 'eucalyptus', 'bori', 'eucalyptus']);
export const DEMO_SINGLE = demo(['roseRed', 'eucalyptus', 'bori']);

export const bouquetObj = (items, wrap = 'paper') => renderBouquet({ items, wrap });
export const BOUQUET_CAM = { target: [0, 0.62, 0], camera: [0.25, 0.8, 2.15] };

export function preview(kind){
  if (kind === 'single') return { obj: bouquetObj(DEMO_SINGLE, 'kraft'), opts: { ...BOUQUET_CAM, camera: [0.1, 0.6, 1.2], target: [0, 0.5, 0] } };
  if (kind === 'gift'){ const p = makeParcel(); p.rotation.y = -0.4; return { obj: p, opts: { target: [0, 0.1, 0], camera: [0.2, 0.3, 0.7], sway: true } }; }
  if (kind === 'snap'){ const c = makeCharacter(CHARACTER_PRESETS[0], { holdBouquet: { items: DEMO_SINGLE, wrap: 'kraft' } }); return { obj: c, opts: { target: [0, 0.4, 0], camera: [0, 0.5, 1.8] } }; }
  return { obj: bouquetObj(DEMO_BOUQUET), opts: BOUQUET_CAM };
}
export { THREE };
