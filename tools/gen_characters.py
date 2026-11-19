"""ref/characters-v0.html 의 캐릭터 코드를 src/scene3d/characters.js 로 옮기는 변환기 (원본 코드는 그대로 두고 바깥 연결만 바꾼다).
사용: python tools/gen_characters.py   (다시 돌리면 같은 결과)
"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
L = (root / 'ref' / 'characters-v0.html').read_text(encoding='utf-8').split('\n')
def find(prefix, start=0):
    for i in range(start, len(L)):
        if L[i].startswith(prefix): return i
    raise SystemExit('못 찾음: ' + prefix)

i_mat = find('const matCache')
i_scene = find('// ---------- 장면 ----------')
build_part = '\n'.join(L[i_mat:i_scene])

i_pose = find('// ---------- 포즈 (건네기)')
i_move = find('// ---------- 움직임 ----------')
pose_part = '\n'.join(L[i_pose:i_move])

# tick 안의 캐릭터별 움직임 (for 안쪽 본문)
i_for = find('  for (const k of ORDER){', i_move)
i_tilt = find('  // 기울이기', i_for)
body = L[i_for + 1:i_tilt - 1]   # 마지막 '  }' 줄은 뺌
body = [l for l in body if not l.strip().startswith('const u = chars[k].userData')]
anim_part = 'export function animateChar(k, u, t){\n  const p = t + u.phase;\n' + '\n'.join(body) + '\n}'

i_opts = find('let optTab')
i_end = find('document.querySelectorAll', i_opts)
opts_part = '\n'.join(L[i_opts:i_end])
opts_part = opts_part.replace("const root = $('opts'); root.innerHTML = '';", "const root = OPTS.el; root.innerHTML = '';")
assert 'OPTS.el' in opts_part

head = '''// 캐릭터: 꽃망울 · 캐릭터 실험 v0(ref/characters-v0.html)의 코드를 tools/gen_characters.py로 옮긴 것. 직접 고치지 말고 변환기를 고칠 것.
// 바깥에서는 makeCharacter(spec, { bouquet }) / animateChar / mountCharacterOptions 만 쓴다.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';
const V3 = THREE.Vector3;
const PS1 = SNAP.bouquet;
const $ = id => document.getElementById(id);
'''
tail = '''
// ================= 바깥으로 내보내는 부분 =================
export { build, PALETTE, NAMES, ACC, specs as SPECS, POSES };
// 꽃망울에서 고를 수 있는 6종 (핸드오프의 "캐릭터 6종")
export const SIX = ['cat', 'dog', 'bear', 'rabbit', 'fox', 'human'];
export const newSpec = (k, over = {}) => ({ ...JSON.parse(JSON.stringify(specs[k])), acc: {}, accC: {}, hold: 2, pose: 0, ...over });
export function randomSpec(){
  const k = SIX[Math.floor(Math.random() * SIX.length)], pal = PALETTE[k], pick = a => Math.floor(Math.random() * a.length);
  const s = newSpec(k, { cloth: pick(PALETTE.cloth), eye: pick(PALETTE.eye) });
  if (k === 'human'){ s.skin = pick(PALETTE.human.skin); s.hair = pick(PALETTE.human.hair); s.style = pick([0, 1, 2, 3, 4]); } else s.fur = pick(pal.fur);
  return s;
}
// 캐릭터 만들기. bouquet({items, wrap})가 있으면 들고 있는 다발을 그 다발의 미니 버전으로 바꿔 끼운다(hold=2: 큰 다발).
export function makeCharacter(spec, { bouquet, renderBouquet } = {}){
  const s = { ...spec, hold: bouquet ? 2 : (spec.hold ?? 0) };
  const root = build(s);
  if (bouquet && renderBouquet){
    const FG = root.userData.F.children[0], B = FG.children[FG.children.length - 1];   // build가 마지막에 FG.add(B)
    B.traverse(o => o.geometry && o.geometry.dispose()); B.clear();
    const bq = renderBouquet(bouquet); bq.scale.setScalar(bouquet.scale || 0.5); bq.position.set(0, -0.18, 0); B.add(bq);
  }
  root.userData.charAnim = t => animateChar(spec.k, root.userData, t);   // stage가 매 프레임 부름
  return root;
}
// 옵션 패널: container 안에 캐릭터 실험 v0의 탭·칩·슬라이더를 그린다. 바뀔 때마다 onRebuild(새 캐릭터)를 부른다.
export function mountCharacterOptions(container, spec, onRebuild, opts = {}){
  OPTS.el = container; OPTS.rebuild = onRebuild; view = spec.k; specs[view] = spec; spec.acc = spec.acc || {}; spec.accC = spec.accC || {};
  OPTS.make = opts.make || (() => build(spec)); chars[view] = opts.current || null; renderOpts();
}
'''
glue = '''
const OPTS = { el: null, rebuild: () => {}, make: null };
let view = 'cat'; const chars = {};
function rebuild(k){ chars[k] = OPTS.make(); OPTS.rebuild(chars[k]); }
function makeIcons(){}
'''
out = head + build_part + '\n' + pose_part + '\n' + anim_part + '\n' + glue + opts_part + tail
(root / 'src' / 'scene3d' / 'characters.js').write_text(out, encoding='utf-8')
print('ok', len(out))
