"""ref/gift-objects-v11.html 의 선물 템플릿 25종을 src/scene3d/gifts.js 와 src/data/gifts.js 로 옮기는 변환기. 직접 고치지 말고 이 파일을 고칠 것."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
L = (root / 'ref' / 'gift-objects-v11.html').read_text(encoding='utf-8').split('\n')
i0 = next(i for i, l in enumerate(L) if l.startswith('function mesh(geo, mat'))
i1 = next(i for i in range(i0, len(L)) if L[i] == '];')
block = '\n'.join(L[i0:i1 + 1])
tpl_src = '\n'.join(L[next(i for i, l in enumerate(L) if l.startswith('const TEMPLATES')):i1 + 1])
tpls = re.findall(r"id:'([a-z0-9_]+)', name:'([^']+)', cat:'([^']+)'", tpl_src)

head = '''// 선물 오브젝트 25종: 꽃망울 · 선물 오브젝트 v11(ref/gift-objects-v11.html)의 템플릿 코드를 tools/gen_gifts.py로 옮긴 것.
// 바깥에서는 makeGiftObject(id) 만 쓴다. 흔들림 세기는 물체 종류 'gift'(820)를 따른다.
import * as THREE from 'three';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';

const cache = new Map();
function M(color){
  const hex = new THREE.Color(color).getHexString();
  if (!cache.has(hex)) cache.set(hex, snappable(new THREE.MeshStandardMaterial({ color: '#' + hex, flatShading: true, roughness: 0.85 }), SNAP.gift));
  return cache.get(hex);
}
function clearM(color, op){
  return snappable(new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.3, transparent: true, opacity: op, depthWrite: false }), SNAP.gift);
}
'''
tail = '''
export const GIFT_TEMPLATES = TEMPLATES.map(t => ({ id: t.id, name: t.name, cat: t.cat }));
// 선물 하나를 만든다. 크기는 원본 단위(키 약 1)라서 쓰는 쪽에서 scale로 줄인다. variant: 색 고르기 번호(0~3)
export function makeGiftObject(id, variant = 0){
  const t = TEMPLATES.find(x => x.id === id) || TEMPLATES[0];
  const g = t.build({ main: t.main[variant % t.main.length], acc: t.acc[variant % t.acc.length] });
  const w = new THREE.Group(); w.add(g); w.userData = { template: t.id };
  return w;
}
'''
(root / 'src' / 'scene3d' / 'gifts.js').write_text(head + block + tail, encoding='utf-8')
data = '// 선물 템플릿 25종 (scene3d/gifts.js와 같은 목록, tools/gen_gifts.py가 만듦). mystery는 이름을 직접 쓰는 미스터리 상자.\nexport const GIFTS = [\n' + \
    ''.join(f"  {{ id: '{i}', name: '{n}', cat: '{c}', mystery: {'true' if i == 'mystery' else 'false'} }},\n" for i, n, c in tpls) + '];\n'
(root / 'src' / 'data' / 'gifts.js').write_text(data, encoding='utf-8')
print('ok', len(tpls))
