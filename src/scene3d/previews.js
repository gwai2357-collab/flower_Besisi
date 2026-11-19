// 화면마다 무대에 올릴 3D 물체를 만드는 곳. 꽃다발은 renderBouquet(data) 하나로만 그린다(나중에 꽃 생성기로 교체).
import * as THREE from 'three';
import { renderBouquet, rollItem } from './bouquet-v0.js';
import { makeParcel } from './parcel.js';
import { makeCharacter, newSpec } from './characters.js';
import { byId } from '../data/flowers.js';

// 시연용 다발 (고정 시드라 늘 같은 모습)
const demo = ids => ids.map((id, k) => ({ ...rollItem(byId[id].type), seed: 1000 + k * 37, flower: id }));
export const DEMO_BOUQUET = demo(['roseRed', 'roseRed', 'lisianthus', 'daisy', 'marigold', 'asclepias', 'delphSpray', 'eucalyptus', 'eucalyptus', 'bori', 'eucalyptus']);
export const DEMO_SINGLE = demo(['roseRed', 'eucalyptus', 'bori']);

export const bouquetObj = (items, wrap = 'paper') => renderBouquet({ items, wrap });
export const BOUQUET_CAM = { target: [0, 0.62, 0], camera: [0.25, 0.8, 2.15] };
export const DEFAULT_LOOK = () => newSpec('cat', { fur: 4, cloth: 3, eye: 3 });   // 스케치의 고양이

// 캐릭터가 (미니 버전의) 다발을 들고 있는 모습
export const charObj = (spec, bouquet) => makeCharacter(spec, { bouquet, renderBouquet });
export const CHAR_CAM = { target: [0, 0.5, 0], camera: [0, 0.75, 2.7] };

export function parcelObj(scale = 0.4){ const p = makeParcel(); p.scale.setScalar(scale); return p; }

export function preview(kind){
  if (kind === 'single') return { obj: bouquetObj(DEMO_SINGLE, 'kraft'), opts: { target: [0, 0.5, 0], camera: [0.1, 0.6, 1.2] } };
  if (kind === 'gift'){ const p = parcelObj(0.5); p.rotation.y = -0.4; return { obj: p, opts: { target: [0, 0.2, 0], camera: [0.4, 0.7, 1.6] } }; }
  if (kind === 'snap') return { obj: charObj(DEFAULT_LOOK(), { items: DEMO_SINGLE, wrap: 'kraft' }), opts: CHAR_CAM };
  return { obj: bouquetObj(DEMO_BOUQUET), opts: BOUQUET_CAM };
}
export { THREE };
