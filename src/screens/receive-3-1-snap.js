// R3-1 감사 스냅: 감사 스냅 v0(ref/thanks-snap-v0.html)을 그대로 쓰고, 받은 꽃다발과 두 캐릭터(건네준 사람·나)만 넘겨 준다.
// 원본은 public/snap/index.html (바꾼 곳은 "[꽃망울에 끼워 넣을 때 바꾼 곳]" 주석 근처뿐). 가입 없이도 쓸 수 있다.
import * as THREE from 'three';
import { el } from '../ui.js';
import { byId } from '../data/flowers.js';
import { state } from '../state.js';
import { DEFAULT_LOOK } from '../scene3d/previews.js';
import { getData } from './receive-kit.js';

const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// 받은 다발 → 감사 스냅 v0가 그리는 꽃다발 요약 { n, pal, kinds, wrap, seed }
export function snapBouquet(d){
  const flowers = d.items.filter(i => byId[i.flower]?.tab !== 'foliage');
  const pal = [...new Set(flowers.map(i => '#' + new THREE.Color().setHSL(i.hue / 360, 0.7, i.lightness / 100).getHexString()))].slice(0, 3);
  const kinds = [...new Set(d.items.map(i => ({ flower1: 'rose', flower2: 'filler', foliage: 'filler' })[byId[i.flower]?.tab] || 'rose'))];
  if (flowers.some(i => i.flower === 'daisy')) kinds.push('daisy');
  return { n: Math.min(12, Math.max(3, d.items.length)), pal: pal.length ? pal : ['#c0283a', '#e88aa0'], kinds, wrap: d.wrap === 'kraft' ? '#caa27a' : '#f3efe7', seed: (d.items[0]?.seed || 1) % 1000 };
}

export default {
  id: 'receive-3-1-snap', flow: 'receive', title: '감사 스냅',
  mount(ctx){
    const d = getData(ctx);
    const init = { a: d.from.look, b: state.character.look || DEFAULT_LOOK(), bq: snapBouquet(d), rel: d.letter?.relation === 'love' ? 'love' : 'friend', msg: '' };
    ctx.stage.show(null);
    const f = el('iframe', { src: `/snap/index.html?d=${b64(init)}`, title: 'snap', style: { flex: '1 1 auto', width: '100%', border: 0, background: '#d9829c' } });
    ctx.root.append(f);
    return () => {};
  },
};
