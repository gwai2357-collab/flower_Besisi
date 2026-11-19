// 캐릭터: 꽃망울 · 캐릭터 실험 v0(ref/characters-v0.html)의 코드를 tools/gen_characters.py로 옮긴 것. 직접 고치지 말고 변환기를 고칠 것.
// 바깥에서는 makeCharacter(spec, { bouquet }) / animateChar / mountCharacterOptions 만 쓴다.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { snappable } from './bouquet-v0.js';
import { SNAP } from './stage.js';
const V3 = THREE.Vector3;
const PS1 = SNAP.bouquet;
const $ = id => document.getElementById(id);
const matCache = new Map();
function M(color){
  const key = new THREE.Color(color).getHexString();
  if (!matCache.has(key)) matCache.set(key, snappable(new THREE.MeshStandardMaterial({ color:'#'+key, flatShading:true, roughness:0.85, side:THREE.DoubleSide })));
  return matCache.get(key);
}
// ---------- 무늬 재질: 두 색 + 위치의 사인 합성 (uv 대신 3D 위치라 이음새가 없음) ----------
function furMaterial(c1, c2, kind, amt, size, seed, white=0, c3=WHITE_FUR, shell=-1){
  const mat = snappable(new THREE.MeshStandardMaterial({ color:c1, flatShading:true, roughness:0.85, side:THREE.DoubleSide }));
  const U = { uC2:{ value:new THREE.Color(c2) }, uKind:{ value:kind }, uAmt:{ value:amt }, uFreq:{ value:size }, uSeed:{ value:seed }, uWhite:{ value:white }, uC3:{ value:new THREE.Color(c3) }, uShell:{ value:shell }, uHatY:{ value:2.0 }, uFlat:{ value:0 }, uPatTop:{ value:9 } };
  const snap = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    snap(sh); Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vPatPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPatPos = position;');
    sh.fragmentShader = `uniform vec3 uC2, uC3; uniform float uKind, uAmt, uFreq, uSeed, uWhite, uShell, uHatY, uFlat, uPatTop; varying vec3 vPatPos;
      float furHash(vec3 c){ return fract(sin(dot(c, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float furPat(vec3 p){
        p = normalize(p); vec3 s = vec3(1.7, 2.3, 3.1) * uSeed;
        float f = mix(2.0, 9.0, uFreq);
        if (uKind < 0.5) return 0.0;
        if (uKind < 1.5){            // 점박이: 세 방향 사인의 곱
          float v = sin(p.x*f*2.0 + s.x) * sin(p.y*f*2.0 + s.y) * sin(p.z*f*2.0 + s.z);
          return step(0.62 - uAmt*0.75, v);
        } else if (uKind < 2.5){     // 얼룩: 낮은 주파수 사인의 합
          float v = sin(dot(p, vec3(1.3,0.7,0.4))*f*0.6 + s.x) + sin(dot(p, vec3(-0.5,1.1,0.8))*f*0.6 + s.y)
                  + 0.6*sin(dot(p, vec3(0.2,-0.9,1.2))*f + s.z);
          return step(1.6 - uAmt*3.0, v);
        }
        // 줄무늬: 머리 둘레 각도의 사인, 위아래로 물결치게
        float a = atan(p.x, p.z);
        float v = sin(a*f*1.3 + sin(p.y*4.0 + s.x)*1.2 + p.y*2.0);
        return step(1.0 - uAmt*1.6, v) * smoothstep(-0.25, 0.05, p.y);
      }
      // 흰 부분: 입 주위와 턱에서 시작해 미간으로 올라가는 ㅅ자 경계 (앞쪽 아래만)
      float whiteMask(vec3 p){
        if (uWhite <= 0.0) return 0.0;
        p = normalize(p);
        if (uFlat > 0.5) return step(p.y, mix(-0.85, 0.2, uWhite) + 0.015*sin(atan(p.x, p.z)*5.0 + uSeed));   // 일자 경계: 아래(배)부터 수평으로 차오름
        float edge = mix(-0.35, 0.75, uWhite) - 1.3*abs(p.x) + 0.04*sin(p.x*23.0 + uSeed);
        return step(p.y, edge) * smoothstep(-0.35, -0.05, p.z);
      }
    ` + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uC2, furPat(vPatPos) * step(normalize(vPatPos).y, uPatTop + 0.04*sin(atan(vPatPos.x, vPatPos.z)*6.0)));\ndiffuseColor.rgb = mix(diffuseColor.rgb, uC3, whiteMask(vPatPos));\n' +
      // 보송한 털(겹 껍질): 겹마다 높이 h. 털 한 올(작은 칸)마다 정해진 길이보다 높은 겹은 그리지 않음(디더 투명처럼 뚫림). 얼굴은 아주 짧게.
      'if (uShell >= 0.0) { vec3 q = normalize(vPatPos); float face = step(0.4, q.z) * step(q.y, 0.5);\n' +
      '  float len = furHash(floor(q * 46.0) + uSeed) * mix(1.0, 0.12, face);\n' +
      '  if (len < uShell || q.y > uHatY) discard; diffuseColor.rgb *= mix(0.72, 1.06, uShell); }');
  };
  mat.userData.U = U; return mat;
}
const WHITE_FUR = '#f4efe6', FURRY = ['dog','cat','fox','rabbit','dino','hamster','giraffe','bear'];   // 털 옵션까지 쓰는 종
const PATTERNED = [...FURRY, 'fish', 'bird'];   // 무늬·밝은 부분 옵션을 쓰는 종 (물고기는 털 없이 무늬만)
const shade = (c, dl, ds=0) => '#' + new THREE.Color(c).offsetHSL(0, ds, dl).getHexString();
function mesh(geo, color, p=[0,0,0], r=[0,0,0], s=[1,1,1]){
  const m = new THREE.Mesh(geo, M(color)); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); return m;
}

// ---------- 머리 표면 위치 ----------
const HEAD_C = new V3(0, 0.98, 0), HEAD_R = new V3(0.33, 0.29, 0.305), NECK_Y = 0.72;
let FACE_DEFORM = null;   // 사람 얼굴형: 머리 단위 구 위의 점을 옮기는 함수 (얼굴 부품도 같은 함수를 거쳐 표면에 붙음)
function makeFaceDeform(shape, flen=0.5){
  const sg = shape*2 - 1;   // -1 갸름 · 0 동글 · +1 사각
  return v => {
    if (v.y < 0) v.y *= 1 + (flen - 0.5)*0.6;   // 얼굴 길이: 눈 아래를 위아래로 늘이거나 줄임
    const t = Math.min(1, Math.max(0, (0.25 - v.y)/1.25));   // 볼 아래로 갈수록 1
    if (sg < 0){ const k = -sg; v.x *= 1 - 0.38*k*t; v.z *= 1 - 0.12*k*t; v.y -= 0.12*k*t*t; }   // 갸름: 턱이 좁고 길게
    else if (sg > 0){                                                                          // 사각: 아래쪽 단면을 네모로
      const k = sg, r = Math.hypot(v.x, v.z), a = Math.atan2(v.x, v.z);
      const sq = r / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)), 1e-3) * 0.9, w = k*t*0.8;
      v.x += (Math.sin(a)*sq - v.x)*w; v.z += (Math.cos(a)*sq - v.z)*w;
      v.y += (Math.max(v.y, -0.78) - v.y)*k*t;                                                 // 턱 끝을 평평하게
    }
    return v;
  };
}
function surf(yaw, pitch, out=0){
  let d = new V3(Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), Math.cos(yaw)*Math.cos(pitch));
  if (FACE_DEFORM) d = FACE_DEFORM(d);
  const p = new V3(d.x*HEAD_R.x, d.y*HEAD_R.y, d.z*HEAD_R.z).add(HEAD_C);
  const n = new V3(d.x/HEAD_R.x, d.y/HEAD_R.y, d.z/HEAD_R.z).normalize();
  return { p: p.addScaledVector(n, out), n };
}
function onHead(obj, yaw, pitch, out=0){ const { p, n } = surf(yaw, pitch, out); obj.position.copy(p); obj.lookAt(p.clone().add(n)); return obj; }
function limb(a, b, r, color){
  const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, d.length(), 2, 6), M(color));
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new V3(0,1,0), d.normalize()); return m;
}

// ---------- 캐릭터 만들기 ----------
const PALETTE = {
  dog:    { fur:['#c98b52','#f1e6d4','#3b2c26','#e2b878'] },
  cat:    { fur:['#9a9a9f','#e39a4f','#2f2c31','#f3efe8','#8c7d6b'] },
  fox:    { fur:['#e0803a','#c9622a','#e8c9a0','#9a9aa2','#3a302c'] },
  rabbit: { fur:['#f5f1ea','#cbb59a','#8c8079','#6a4f3c'] },
  human:  { skin:['#f6d7bf','#e8b893','#c98d63','#8a5a3c'], hair:['#2a2220','#6b4430','#d7b46a','#b5503c'] },
  dino:   { fur:['#7cc06a','#6fa8dc','#b28ad6','#f0a35c'], spike:['#f2c14b','#f6e27a','#f497a8','#8fd8c8'] },
  robot:  { fur:['#b9c3cb','#8fb3d9','#e9c46a','#e58f80'] },
  elephant:{ fur:['#a7aeb5','#c9b8d9','#9fc2d6','#e8b4c0'] },
  giraffe: { fur:['#e9b75a','#f0cf8a','#d9a066','#f4efe6'] },
  hamster: { fur:['#e2a25f','#f4efe6','#a8a29a','#c9a27a','#5a4a42'] },
  bird:    { fur:['#7fb8e6','#f2d16b','#e86f7f','#9ad18b','#f4efe6','#2f2a28'] },   // 마지막 둘: 흰색, 검정
  fish:    { fur:['#f08c4b','#7fb8e6','#f2d16b','#e86f7f','#b9a6e0'] },
  tv:      { fur:['#8a6a4e','#d9cfc0','#e58f80','#7fa6d9'] },
  phone:   { fur:['#2f2a28','#f4efe6','#e86f7f','#8fb3d9','#c9c2b8'] },
  can:     { fur:['#8bbf8a','#7fa6d9','#e9c46a','#e58f80','#b9c3cb'] },
  rose:    { fur:['#c0283a','#e88aa0','#f2d16b','#f6efe4','#d97a3c'] },
  daisy:   { fur:['#f6f2ea','#f2d16b','#e88aa0','#b9a6e0','#7fa6d9'] },
  bear:    { fur:['#8a5a3a','#c08a55','#4a3428','#f2ede3','#2b2523'] },   // 갈색, 꿀색, 짙은 갈색, 흰곰, 검은곰
  potato:  { fur:['#dcb57c','#c4955f','#b8695a','#7d5b86'] },             // 황금, 갈색, 붉은 감자, 자주 감자
  sweet:   { fur:['#9b3e5c','#b8566a','#73304c','#c7774f'] },             // 자주, 붉은 자주, 짙은 자주, 주황
  dumpling:{ fur:['#f3efe4','#d3e5b6','#f2cbd3','#f5dfa0'] },             // 흰 만두피, 시금치, 비트, 단호박
  eye: ['#1f1a1c','#6b4430','#3e6fb0','#3f8a5a','#35b8d6'],
  acc: ['#2f2a28','#f4efe6','#e86f7f','#7fa6d9','#f2d16b','#8bbf8a','#c9a06e','#a7aeb5'],   // 악세서리 색
  pat: ['#f4efe6','#2f2a28','#6b4430','#b8692c','#8a8a90','#d9b48a'],   // 무늬 색
  cloth: ['#e86f7f','#7fa6d9','#f2d16b','#8bbf8a','#f4efe6'],
};
const ACC = [['hp','헤드폰'],['ep','이어폰'],['hat','니트 모자'],['cap','캡모자'],['g1','동그란 안경'],['g2','무테 사각 안경'],['sg','선글라스'],['rd','루돌프 코·뿔']];
const ACC_DEFAULT = { hp:3, ep:1, hat:2, cap:3, g1:0, g2:3, sg:0, rd:6 };
const ACC_EXCL = [['hp','ep'], ['g1','g2','sg'], ['hat','cap']];   // 같은 묶음 안에서는 하나만
const NAMES = { dog:'강아지', cat:'고양이', fox:'여우', rabbit:'토끼', human:'사람', dino:'공룡', robot:'로봇', elephant:'코끼리', giraffe:'기린', hamster:'햄스터', bird:'새', fish:'물고기', tv:'TV', phone:'핸드폰', can:'물뿌리개', rose:'장미', daisy:'데이지', bear:'곰', potato:'감자', sweet:'고구마', dumpling:'물만두' };
const specs = {
  dog:    { k:'dog', fur:1, cloth:1, eye:0, pat:2, fur2:2, amt:0.45, size:0.3, ps:3, wht:0, furStyle:0, fluff:0.5 },
  cat:    { k:'cat', fur:4, cloth:3, eye:3, pat:3, fur2:1, amt:0.5, size:0.45, ps:1, wht:0.55, furStyle:0, fluff:0.5 },
  fox:    { k:'fox', fur:0, cloth:3, eye:1, pat:0, fur2:1, amt:0.45, size:0.35, ps:4, wht:0.55, furStyle:0, fluff:0.5, snout:0.5 },
  rabbit: { k:'rabbit', fur:0, cloth:0, eye:0, pat:0, fur2:2, amt:0.45, size:0.3, ps:2, wht:0, furStyle:0, fluff:0.5 },
  human:  { k:'human', skin:0, hair:0, style:0, cloth:2, eye:0, shape:0.5, flen:0.5, nose:0.35, mst:0, mouthY:0.5, mouthW:0.5, mole:0, mx:0.72, my:0.38, eyeS:0.5 },
  dino:   { k:'dino', fur:0, cloth:4, eye:0, pat:1, fur2:2, amt:0.35, size:0.35, ps:5, wht:0.5, furStyle:0, fluff:0.5 },
  robot:  { k:'robot', fur:0, cloth:2, eye:4 },
  elephant:{ k:'elephant', fur:0, cloth:3, eye:0 },
  giraffe: { k:'giraffe', fur:0, cloth:1, eye:0, pat:1, fur2:2, amt:0.6, size:0.35, ps:4, wht:0, furStyle:0, fluff:0.5 },
  hamster: { k:'hamster', fur:0, cloth:0, eye:0, pat:0, fur2:2, amt:0.45, size:0.3, ps:2, wht:0.6, furStyle:0, fluff:0.5, bodyW:0.62, tiny:0.5 },
  bird:    { k:'bird', fur:0, cloth:2, eye:0, beak:0.5, pat:0, fur2:0, amt:0.5, size:0.45, ps:2, patH:0.5 },
  fish:    { k:'fish', fur:0, cloth:1, eye:0, pat:0, fur2:0, amt:0.45, size:0.35, ps:3, wht:0.35 },
  tv:      { k:'tv', fur:0, cloth:4, eye:0 },
  phone:   { k:'phone', fur:0, cloth:1, eye:0 },
  can:     { k:'can', fur:0, cloth:4, eye:0 },
  rose:    { k:'rose', fur:0, cloth:3, eye:0 },
  daisy:   { k:'daisy', fur:0, cloth:2, eye:0 },
  bear:    { k:'bear', fur:0, cloth:3, eye:0, pat:0, fur2:0, amt:0.45, size:0.35, ps:2, wht:0, furStyle:0, fluff:0.5 },
  potato:  { k:'potato', fur:0, cloth:1, eye:0, sprout:1 },
  sweet:   { k:'sweet', fur:0, cloth:2, eye:0 },
  dumpling:{ k:'dumpling', fur:0, cloth:4, eye:0, grill:0 },
};
const SCREEN = '#b4b8bb';   // TV·핸드폰 화면: 회색
const INK = '#1f1a1c', PINK = '#f19aa8', MUZZLE = '#fbf6ee';

// 둥근 머리 기준으로 만든 머리카락을 네모(둥근 모서리)·원통 머리 표면으로 옮김.
// 머리 중심에서의 방향은 그대로 두고, 둥근 머리 표면까지의 거리 대신 새 모양 표면까지의 거리를 씀(머리카락 두께는 비율로 유지)
function hairToShape(head, from, B, cyl, hatOn){
  const inv = new THREE.Matrix4(), mm = new THREE.Matrix4(), mi = new THREE.Matrix4(), v = new V3(), P = 6;
  head.updateMatrixWorld(true); inv.copy(head.matrixWorld).invert();
  const kids = head.children.slice(from), avg = (HEAD_R.x + HEAD_R.y + HEAD_R.z)/3;
  for (const k of kids) k.traverse(o => {
    if (!o.isMesh) return;
    o.geometry = o.geometry.clone();
    mm.multiplyMatrices(inv, o.matrixWorld); mi.copy(mm).invert();
    const pa = o.geometry.attributes.position;
    for (let i=0; i<pa.count; i++){
      v.fromBufferAttribute(pa, i).applyMatrix4(mm).sub(HEAD_C);
      const e = new V3(v.x/HEAD_R.x, v.y/HEAD_R.y, v.z/HEAD_R.z), rn = e.length(); if (rn < 1e-5) continue;
      const u = e.divideScalar(rn);
      const f = cyl ? Math.pow(Math.pow(Math.hypot(u.x, u.z), P) + Math.pow(Math.abs(u.y), P), 1/P)
                    : Math.pow(Math.pow(Math.abs(u.x), P) + Math.pow(Math.abs(u.y), P) + Math.pow(Math.abs(u.z), P), 1/P);
      const sp = new V3(u.x*B[0], u.y*B[1], u.z*B[2]).divideScalar(f), n = sp.clone().normalize();
      v.copy(sp).addScaledVector(n, (rn - 1)*avg*0.9 + 0.025);   // 화면 테두리 같은 앞면 장식 위로 조금 띄움
      if (hatOn) v.y = Math.min(v.y, B[1] + 0.005);   // 네모 모자 속으로
      v.add(HEAD_C).applyMatrix4(mi); pa.setXYZ(i, v.x, v.y, v.z);
    }
    o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere();
  });
}

function build(spec){
  const root = new THREE.Group(), headPivot = new THREE.Group(), head = new THREE.Group();
  headPivot.position.set(0, NECK_Y, 0); head.position.set(0, -NECK_Y, 0); headPivot.add(head); root.add(headPivot);
  const isH = spec.k === 'human';
  const skin = isH ? PALETTE.human.skin[spec.skin] : spec.k === 'dumpling' && spec.grill ? '#' + new THREE.Color(PALETTE.dumpling.fur[spec.fur]).lerp(new THREE.Color('#e9b867'), 0.4).getHexString() : PALETTE[spec.k].fur[spec.fur];
  const cloth = PALETTE.cloth[spec.cloth];
  const K = spec.k, FLOWER = K === 'rose' || K === 'daisy';
  const BOXY = { robot:[0.56,0.46,0.48], tv:[0.66,0.5,0.42], phone:[0.4,0.58,0.11] }[K];   // 네모 머리: 너비·높이·깊이
  const STEM = '#6a9a52', LEAF = '#7fb56a';
  const neckC = FLOWER ? STEM : K === 'tv' ? '#4a4240' : K === 'phone' ? '#5a5552' : K === 'can' ? shade(skin, -0.15) : skin;
  const handC = FLOWER ? LEAF : null;
  const LIFT = K === 'giraffe' ? 0.14 : 0;   // 기린은 목이 길어 머리를 그만큼 올림
  // 동물·사물에도 사람 머리 모양을 씌울 수 있음(꽃은 꽃잎이 머리 역할이라 제외). 없음(5)이 기본
  const animalHair = !isH && !FLOWER && spec.style != null && spec.style !== 5;
  const HAIR_CUT = 0.3;   // 머리카락을 쓰면 이 높이(정규화)보다 위의 털은 머리카락 속이라 만들지 않음

  // 몸 (상반신)
  const prof = [[0,0.22],[0.3,0.22],[0.3,0.4],[0.27,0.54],[0.2,0.64],[0.1,0.69],[0,0.7]].map(([x,y]) => new THREE.Vector2(x,y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(prof, 8), M(cloth)); root.add(torso);
  root.add(mesh(K === 'phone' ? new THREE.CylinderGeometry(0.04, 0.06, 0.1, 7) : new THREE.CylinderGeometry(0.085, 0.095, 0.1, 7), neckC, [0, 0.72, 0]));
  // 팔과 손, 손에 든 꽃 한 송이
  const sh = [new V3(-0.25,0.58,0.02), new V3(0.25,0.58,0.02)], hand = [new V3(-0.07,0.44,0.33), new V3(0.07,0.44,0.33)];
  const furry = FURRY.includes(spec.k);
  // 모자를 쓰면 모자 속(머리 위쪽)에 들어가는 털·머리카락은 아예 만들지 않음 → 뚫고 나오지 않음
  const accS = spec.acc || {}, hatOn = !!(accS.hat || accS.cap);
  // 모자 치수: 머리 부피에 맞춰 조금만 키우고(과하게 커지지 않게), 테두리에 두께 있는 띠를 둘러 머리와의 틈을 덮음
  const flv = furry ? (spec.fluff || 0) : 0, fsv = spec.furStyle ?? (flv > 0 ? 1 : 0);
  const hatFit = isH || animalHair ? (spec.style === 5 ? 1.04 : [3,6,7,9,12,13].includes(spec.style) ? 1.16 : 1.1)
                     : 1.1 + (fsv === 1 ? 0.12*flv : 0) + (fsv === 2 ? 0.1*flv : 0);
  const HAT = accS.cap ? { th:1.1, off:0.0 } : { th:1.02, off:0.0 };          // 정수리 구의 잘린 각도: 작을수록 모자를 위로 올려 씀(앞머리가 보임)
  const hatR = HEAD_R.clone().multiplyScalar(hatFit);
  const brimY = HAT.off + hatR.y*Math.cos(HAT.th), brimR = hatR.x*Math.sin(HAT.th); // 테두리 높이(머리 중심 기준)와 반지름
  const hatY = brimY/HEAD_R.y - 0.05;   // 이 높이(정규화)보다 위의 털·머리카락은 만들지 않음: 테두리 띠 안쪽에서 끝나게
  const underHat = d => hatOn && d.y > hatY;   // d: 머리 중심 기준 단위 방향
  const lightC = spec.k === 'dino' ? shade(skin, 0.2, -0.12) : spec.k === 'fish' ? '#fde6bd' : WHITE_FUR;   // 공룡은 흰색 대신 밝은 배 색
  const pawC = handC || (furry && (spec.wht || 0) > 0.3 ? lightC : skin);   // 흰 부분이 크면 흰 양말
  // 옷 모양: 0 기본, 1 셔츠, 2 가디건, 3 민소매, 4 반팔. 색은 옷 색 하나만 쓰고, 단추·안에 입은 티 같은 작은 부분만 정해진 색
  const outfit = spec.outfit || 0, bare = handC || skin, LIGHT = '#f4efe6';
  const neckOK = outfit !== 1 && outfit !== 2;   // 셔츠·가디건은 깃이 있으니 종별 목 장식(반다나·방울·나비넥타이·손수건)은 뺌
  // 팔은 어깨→손을 잇는 조각들(t0~t1 구간)로 만들고 기록해 둠: 포즈마다 손 위치만 바꾸면 매 프레임 다시 겨눔
  const armParts = [], handMs = [];
  const seg2 = (i, t0, t1, r, c) => { const a = sh[i].clone().lerp(hand[i], t0), b = sh[i].clone().lerp(hand[i], t1), m = limb(a, b, r, c);
    root.add(m); armParts.push({ m, i, t0, t1, len0: a.distanceTo(b) }); };
  for (let i=0;i<2;i++){
    if (outfit === 3) seg2(i, 0, 0.72, 0.062, bare);                                               // 민소매: 맨팔
    else if (outfit === 4){ seg2(i, 0, 0.34, 0.082, cloth); seg2(i, 0.28, 0.72, 0.058, bare); }  // 반팔: 위팔만 넉넉한 소매
    else seg2(i, 0, 0.72, 0.07, outfit === 2 ? shade(cloth, -0.04) : cloth);
    if (outfit === 1 || outfit === 2) seg2(i, 0.64, 0.7, 0.077, shade(cloth, -0.1));             // 소맷부리
    const hm = mesh(new THREE.IcosahedronGeometry(0.075,0), pawC, hand[i].toArray()); root.add(hm); handMs.push(hm);
  }
  // 가슴 앞면(머리·손에 가려지지 않는 아래쪽까지) 위의 점: 높이 y에서 앞쪽 거리
  const frontZ = y => y < 0.4 ? 0.302 : y < 0.54 ? 0.302 - (y - 0.4)*0.21 : 0.273 - (y - 0.54)*0.7;
  const BTN = [0.56, 0.46, 0.36, 0.27];
  if (outfit === 1){   // 셔츠: 뾰족한 깃 두 장 + 앞섶 선 + 단추 줄 + 왼쪽 가슴 주머니
    for (const s of [-1,1]) root.add(mesh(new THREE.ConeGeometry(0.06, 0.13, 3), shade(cloth, 0.14), [s*0.06, 0.645, 0.15], [-0.5, 0, Math.PI + s*0.55], [1, 1, 0.3]));
    for (let k=0; k<3; k++){ const y0 = [0.66, 0.54, 0.4][k], y1 = [0.54, 0.4, 0.23][k]; root.add(limb(new V3(0.0, y0, frontZ(y0) + 0.004), new V3(0.0, y1, frontZ(y1) + 0.004), 0.011, shade(cloth, -0.12))); }
    BTN.forEach(y => root.add(mesh(new THREE.SphereGeometry(0.014, 5, 3), LIGHT, [0.022, y, frontZ(y) + 0.01])));
    root.add(mesh(new THREE.BoxGeometry(0.09, 0.08, 0.012), shade(cloth, -0.06), [0.17, 0.47, 0.245], [0, 0.55, 0]));   // 주머니 (캐릭터 왼쪽)
  }
  if (outfit === 2){   // 가디건: 앞이 열려 안에 입은 흰 티가 세로로 보이고, 섶에 굵은 테 + 단추, 밑단에 골지 띠
    for (let k=0; k<3; k++){ const y0 = [0.67, 0.54, 0.4][k], y1 = [0.54, 0.4, 0.23][k], w = [0.07, 0.06, 0.055][k];
      for (const s of [-1,1]) root.add(limb(new V3(s*(w + 0.012), y0, frontZ(y0) + 0.008), new V3(s*(w + 0.008), y1, frontZ(y1) + 0.008), 0.017, shade(cloth, -0.12)));
    }
    { // 안에 입은 티: 가슴 앞면을 따라 매끈하게 이어지는 한 장의 띠 (위는 넓고 아래로 좁아짐)
      const pts = [], N = 10;
      for (let k=0; k<=N; k++){ const y = 0.23 + (0.67 - 0.23)*k/N, w = 0.055 + 0.02*k/N, z = frontZ(y) + 0.004;
        pts.push(-w, y, z, w, y, z); }
      const idx = []; for (let k=0; k<N; k++){ const q = k*2; idx.push(q, q+1, q+3, q, q+3, q+2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setIndex(idx); g.computeVertexNormals();
      root.add(new THREE.Mesh(g, M(LIGHT)));
    }
    BTN.forEach(y => root.add(mesh(new THREE.SphereGeometry(0.016, 5, 3), shade(cloth, -0.35), [-0.075, y, frontZ(y) + 0.02])));
    root.add(mesh(new THREE.TorusGeometry(0.3, 0.028, 4, 16), shade(cloth, -0.1), [0, 0.245, 0], [Math.PI/2, 0, 0]));
  }
  if (outfit === 3){   // 민소매: 어깨 끈 둘레를 살짝 두껍게
    for (const s of [-1,1]) root.add(mesh(new THREE.TorusGeometry(0.075, 0.015, 4, 10), shade(cloth, -0.08), [s*0.24, 0.57, 0.02], [0, Math.PI/2, 0.3*s]));
  }
  // 손에 든 꽃: 0 한 송이, 1 작은 다발, 2 큰 다발 (큰 다발은 무거워서 한쪽으로 기울고, 캐릭터는 반대쪽으로 고개를 기울여 빼꼼 내다봄)
  const hold = spec.hold || 0;
  let peek = { rz:0, dx:0, dy:0 };
  // 꽃은 두 손 사이(HP0)를 기준점으로 한 묶음 F에 담음: 포즈가 F를 옮기고 돌림
  const HP0 = new V3(0, 0.44, 0.33), F = new THREE.Group(), FG = new THREE.Group(); F.position.copy(HP0); FG.position.copy(HP0).negate(); F.add(FG); root.add(F);
  if (hold === 0){
    FG.add(limb(new V3(0,0.36,0.37), new V3(0.01,0.63,0.39), 0.008, '#4f7d3f'));
    FG.add(mesh(new THREE.IcosahedronGeometry(0.058,0), '#c0283a', [0.012,0.67,0.395], [0.3,0.5,0]));
    FG.add(mesh(new THREE.IcosahedronGeometry(0.045,0), '#9e1d2e', [0.012,0.70,0.39], [0,0,0]));
    FG.add(mesh(new THREE.ConeGeometry(0.028,0.09,3), '#5c8f45', [0.05,0.57,0.385], [0,0,-1.0], [1,1,0.3]));
  } else {
    const big = hold === 2, r = big ? 0.3 : 0.13, h = big ? 0.5 : 0.2, n = big ? 28 : 7;
    const B = new THREE.Group(); B.position.set(big ? -0.07 : 0, big ? 0.36 : 0.36, big ? 0.42 : 0.37);
    const wrap = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1, true), M('#f3efe7')); wrap.rotation.x = Math.PI; wrap.position.y = h/2; B.add(wrap);
    const COLS = ['#c0283a','#e88aa0','#f6efe4','#d9465c'], GA = Math.PI*(3 - Math.sqrt(5));
    for (let i=0; i<n; i++){
      const f = Math.sqrt((i+0.5)/n), a = i*GA;
      const x = Math.cos(a)*f*r*0.92, z = Math.sin(a)*f*r*0.55 + r*0.25, y = h + (1 - f*f)*r*0.45;   // 앞쪽으로 볼록한 한쪽 다발
      const sz = (big ? 0.055 : 0.045) * (0.85 + ((i*7)%5)/20), c = COLS[i % COLS.length];
      B.add(mesh(new THREE.IcosahedronGeometry(sz, 0), c, [x, y, z], [i, i*2, 0]));
      B.add(mesh(new THREE.IcosahedronGeometry(sz*0.7, 0), shade(c, -0.12), [x, y + sz*0.45, z + sz*0.2], [i*3, i, 0]));
      if (i % 3 === 0) B.add(mesh(new THREE.ConeGeometry(0.025, 0.11, 3), '#5c8f45', [x*1.15, y - 0.03, z - 0.04], [0.3, a, Math.cos(a)*0.9], [1,1,0.3]));
    }
    if (big && !(spec.pose > 0)){ B.rotation.z = 0.36; peek = { rz:-0.36, dx:0, dy:0, lean:-0.1 }; }   // 목 밑동(옷깃)을 축으로 고개만 돌리고, 상체도 같은 쪽으로 살짝 기울임   // 다발을 조금 낮게·왼쪽으로, 머리는 더 기울여 빼꼼   // 다발은 왼쪽으로 기울고, 머리는 오른쪽으로 빼꼼
    FG.add(B);
  }

  // 머리
  const robot = !!BOXY;   // 네모 머리(로봇·TV·핸드폰)는 같은 규칙
  FACE_DEFORM = isH ? makeFaceDeform(spec.shape ?? 0.5, spec.flen ?? 0.5) : K === 'fish' ? (d => { d.x *= 0.82; d.y *= 1.06; return d; })
    : K === 'fox' ? (d => { d.x *= 1 + 0.1*Math.max(0, d.y) - 0.3*Math.max(0, -d.y); return d; })
    : K === 'potato' ? (d => {   // 감자: 옆으로 조금 넓고 울퉁불퉁
        const n = 1 + 0.07*Math.sin(3.1*d.x + 1.3)*Math.sin(2.7*d.y + 0.4) + 0.05*Math.sin(4.3*d.z + 2.1*d.x + 0.7) + 0.03*Math.sin(5.5*d.y - 3*d.z);
        d.x *= 1.1*n; d.y *= 0.96*n; d.z *= 0.95*n; return d; })
    : K === 'sweet' ? (d => {   // 고구마: 위아래로 길고 양 끝이 가늘어지는 방추형, 살짝 휘고 울퉁불퉁
        const t = 1 - 0.3*Math.pow(Math.abs(d.y), 1.6), n = 1 + 0.04*Math.sin(3.7*d.y + 2.3*d.x) + 0.03*Math.sin(4.9*d.z - 1.7*d.y);
        d.x = d.x*0.9*t*n + 0.06*d.y*d.y; d.z *= 0.88*t*n; d.y *= 1.2; return d; })
    : K === 'dumpling' ? (d => {   // 물만두: 옆으로 넓고 밑은 납작, 위는 주름 쪽으로 봉긋
        d.x *= 1.16; d.z *= 0.92; d.y = d.y < 0 ? d.y*0.72 : d.y*(0.88 + 0.12*d.y); return d; })
    : null;   // 물고기: 좌우로 눌린 세로 타원 / 여우: 아래로 좁아지는 역삼각형
  const patterned = PATTERNED.includes(K);
  const patOn = patterned && spec.pat > 0;
  const furMat = patterned && (patOn || (spec.wht || 0) > 0) ? furMaterial(skin, PALETTE.pat[spec.fur2], spec.pat, spec.amt, spec.size, spec.ps, spec.wht || 0, lightC) : null;
  if (furMat && K === 'fish') furMat.userData.U.uFlat.value = 1;
  if (furMat && K === 'bird') furMat.userData.U.uPatTop.value = THREE.MathUtils.lerp(-0.7, 0.6, spec.patH ?? 0.5);   // 새: 정수리는 단색, 이 높이 아래에만 무늬
  // 머리에 붙어 같이 움직이는 목: 얼굴이 짧거나 고개를 크게 기울여도 몸과 떨어지지 않게 아래로 길게
  head.add(mesh(new THREE.CylinderGeometry(K === 'giraffe' ? 0.065 : K === 'phone' ? 0.035 : 0.075, K === 'phone' ? 0.04 : 0.08, 0.32 + LIFT, 7), neckC, [0, 0.8 - LIFT/2, 0]));
  if (K === 'giraffe' && furMat) head.children[head.children.length - 1].material = furMat;   // 목에도 무늬
  const headGeo = BOXY ? new THREE.BoxGeometry(...BOXY) : K === 'can' ? new THREE.CylinderGeometry(0.3, 0.32, 0.46, 12) : new THREE.IcosahedronGeometry(1, 1);
  const headC = FLOWER ? (K === 'daisy' ? '#f2c14b' : shade(skin, 0.3, -0.25)) : skin;   // 꽃 머리: 얼굴은 꽃 가운데
  const headMesh = new THREE.Mesh(headGeo, furMat || M(headC));
  headMesh.position.copy(HEAD_C); if (!BOXY && K !== 'can') headMesh.scale.copy(HEAD_R); head.add(headMesh);
  if (FACE_DEFORM){   // 얼굴형: 머리 기하의 점을 같은 함수로 옮김
    const pa = headMesh.geometry.attributes.position, v = new V3();
    for (let i=0;i<pa.count;i++){ v.fromBufferAttribute(pa, i); FACE_DEFORM(v); pa.setXYZ(i, v.x, v.y, v.z); }
    headMesh.geometry.computeVertexNormals();
  }
  // 복슬복슬한 털: 머리 표면에 작은 털뭉치(저해상도 구)를 황금각 나선으로 붙여 머리와 한 덩어리로 합침.
  // 머리 기하에 합치므로 무늬 재질이 털뭉치 위로도 끊기지 않고 이어짐. 얼굴(눈·볼·입)은 비워 둠.
  // 털 모양: 0 짧은 털, 1 곱슬(털뭉치), 2 보송(겹 껍질). 예전 데이터에 모양이 없고 길이만 있으면 곱슬로 읽음
  const fs = spec.furStyle ?? ((spec.fluff || 0) > 0 ? 1 : 0);
  const fluff = furry && fs === 1 ? (spec.fluff || 0) : 0;
  const fuzz = furry && fs === 2 ? (spec.fluff || 0) : 0;
  if (fuzz > 0 && !robot){
    const N = 10, len = 0.06 + 0.3*fuzz;    // 겹 수와 털 길이(머리 반지름 대비)
    for (let i=1; i<=N; i++){
      const h = i/N;
      const sm = furMaterial(skin, PALETTE.pat[spec.fur2 ?? 0], spec.pat || 0, spec.amt ?? 0.5, spec.size ?? 0.4, spec.ps ?? 1, spec.wht || 0, lightC, h);
      if (hatOn || animalHair) sm.userData.U.uHatY.value = Math.min(hatOn ? hatY : 9, animalHair ? HAIR_CUT : 9);
      const shellMesh = new THREE.Mesh(headMesh.geometry, sm);
      shellMesh.position.copy(HEAD_C); shellMesh.scale.copy(HEAD_R).multiplyScalar(1 + h*len); head.add(shellMesh);
    }
  }
  if (fluff > 0){
    let a = Math.floor((spec.ps || 1) * 1000) + 7;
    const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
    const geos = [headMesh.geometry], n = Math.round(36 + fluff*70), GA = Math.PI*(3 - Math.sqrt(5));
    for (let i=0; i<n; i++){
      const y = 1 - 2*(i+0.5)/n, r = Math.sqrt(1 - y*y), t = i*GA;
      const d = new V3(Math.cos(t)*r, y, Math.sin(t)*r);
      if (d.z > 0.4 && d.y < 0.5) continue;          // 얼굴은 비움 (이마 위는 남겨 앞머리처럼)
      if (d.y < -0.82 || underHat(d) || (animalHair && d.y > HAIR_CUT)) continue;      // 목, 모자 속, 머리카락 속
      const size = (0.16 + 0.3*fluff) * (0.8 + rnd()*0.4) * (1 + 0.45*Math.max(0, d.y));   // 정수리일수록 크게 (푸들 머리)
      const g = new THREE.IcosahedronGeometry(size, 1);   // 한 단계 둥글게: 각진 결정보다 곱슬 털뭉치처럼
      g.translate(d.x*(0.9 + 0.08*fluff), d.y*(0.9 + 0.08*fluff), d.z*(0.9 + 0.08*fluff));
      geos.push(g);
    }
    headMesh.geometry = mergeGeometries(geos); geos.forEach(g => g.dispose());
  }
  // 얼굴 부품 자리: 둥근 머리는 표면 위, 로봇은 네모난 앞면 위
  // 네모 머리는 앞면(TV는 화면) 위, 물뿌리개는 원통 앞면 위, 나머지는 둥근 머리 표면 위
  const scr = K === 'tv' ? { x:-0.06, w:0.5, z:0.012 } : K === 'phone' ? { x:0, w:0.4, z:0.008 } : { x:0, w:0.56, z:0 };
  const face = BOXY ? (o, yaw, pitch, out=0) => { o.position.set(scr.x + Math.sin(yaw)*scr.w*0.57, HEAD_C.y + Math.sin(pitch)*BOXY[1]*0.565, BOXY[2]/2 + 0.002 + scr.z + out); o.rotation.set(0,0,0); return o; }
    : K === 'can' ? (o, yaw, pitch, out=0) => { const r = 0.312 + out; o.position.set(Math.sin(yaw)*r, HEAD_C.y + Math.sin(pitch)*0.24, Math.cos(yaw)*r); o.rotation.set(-pitch*0.2, yaw, 0); return o; }
    : onHead;
  const eyeC = PALETTE.eye[spec.eye ?? 0];
  const eyeSc = Math.pow(2, ((spec.eyeS ?? 0.5) - 0.5)*1.4);   // 눈 크기: 0.5가 기본, 0 → 0.62배, 1 → 1.62배

  // 눈 (깜빡임)
  const faceDark = (() => { const c = new THREE.Color(headC); return 0.2126*c.r + 0.7152*c.g + 0.0722*c.b < 0.04; })();   // 얼굴 바탕이 거의 검정인지(선형 밝기)
  const eyes = [];
  for (const s of [-1,1]){
    const e = new THREE.Group(); face(e, s*0.36, 0, 0.004);   // 안경 자리와 같은 높이   // 공룡: 위턱 위, 머리 옆쪽에
    e.userData.sc = eyeSc; e.scale.setScalar(eyeSc);
    if (faceDark) e.add(mesh(new THREE.SphereGeometry(0.0405, 6, 4), '#d9d4cc', [0,0,-0.004], [0,0,0], [1,1.22,0.35]));   // 거의 검은 얼굴: 눈 둘레 밝은 테
    e.add(mesh(new THREE.SphereGeometry(0.036, 6, 4), eyeC, [0,0,0], [0,0,0], [1,1.25,0.5]));
    e.add(mesh(new THREE.SphereGeometry(0.011, 4, 3), '#ffffff', [0.012,0.017,0.016]));
    if (spec.lash){   // 속눈썹: 눈 위 바깥쪽에 짧은 줄 두 개 (눈과 같이 깜빡임). 얼굴이 어두우면 자동으로 은색
      const lashC = faceDark ? '#f4f2ee' : INK;
      e.add(mesh(new THREE.BoxGeometry(0.03, 0.007, 0.006), lashC, [s*0.026, 0.044, 0.006], [0, 0, s*0.55]));
      e.add(mesh(new THREE.BoxGeometry(0.026, 0.007, 0.006), lashC, [s*0.038, 0.028, 0.004], [0, 0, s*0.95]));
    }
    head.add(e); eyes.push(e);
    head.add(face(mesh(new THREE.CircleGeometry(0.045, 6), K === 'rose' ? '#c83a55' : PINK,   // 장미는 얼굴이 분홍이라 더 짙은 블러셔
 [0,0,0], [0,0,0], [1,0.6,1]), s*(robot ? 0.6 : K === 'hamster' ? 0.58 : K === 'dino' ? 0.72 : 0.62), K === 'hamster' ? -0.24 : K === 'dino' ? -0.05 : -0.2, K === 'hamster' ? 0.075 : 0.006));   // 햄스터는 볼주머니 위에 블러셔
  }

  const ears = [];
  let noseAt = null, iconTop = HEAD_C.y + LIFT;   // 루돌프 코 자리(없으면 얼굴 가운데), 아이콘 높이
  if (spec.k === 'dog'){
    const earC = patOn && spec.pat === 2 ? PALETTE.pat[spec.fur2] : (spec.fur === 1 ? '#d9b48a' : shade(skin, -0.12));   // 얼룩무늬면 귀도 무늬 색
    const mL = Math.pow(2, ((spec.snout ?? 0.5) - 0.5)*1.4), ext = 0.1275*(mL - 1);   // 입(주둥이) 길이: 0 → 0.62배, 1 → 1.62배
    head.add(onHead(mesh(new THREE.SphereGeometry(0.15, 6, 4), MUZZLE, [0,0,0], [0,0,0], [1.15,0.78,0.85*mL]), 0, -0.36, -0.05 + ext*0.5));
    head.add(onHead(mesh(new THREE.SphereGeometry(0.045, 5, 3), INK, [0,0,0], [0,0,0], [1.35,0.9,0.9]), 0, -0.18 - 0.08*Math.max(0, mL - 1), 0.075 + ext*0.85));
    noseAt = { o:head, p:onHead(new THREE.Object3D(), 0, -0.18 - 0.08*Math.max(0, mL - 1), 0.1 + ext*0.85).position.clone() };
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*0.25, 1.17, -0.02); p.rotation.z = s*0.42;
      if (fluff > 0){   // 복슬 귀: 털뭉치가 귀를 따라 늘어짐
        for (let k=0; k<5; k++) p.add(mesh(new THREE.IcosahedronGeometry(0.05 + 0.05*fluff, 0), earC, [s*0.01*k, -0.04 - k*0.06*(1 + 0.3*fluff), 0], [k, k*2, 0]));
      } else p.add(mesh(new THREE.SphereGeometry(1, 6, 4), earC, [0,-0.15,0], [0,0,0], [0.095,0.19,0.05]));
      head.add(p); ears.push(p);
    }
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.17, 0.17, 3), '#c8443c', [0,0.6,0.2], [Math.PI-0.25,0,0], [1,1,0.35]));
  }
  if (spec.k === 'cat'){
    const dark = shade(skin, spec.fur === 3 ? -0.18 : -0.16);
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*(0.2 + 0.05*fluff), 1.19 + 0.12*fluff, -0.01); p.scale.setScalar((1 + 0.35*fluff)*Math.pow(2, ((spec.earS ?? 0.5) - 0.5)*1.2)); p.rotation.z = -s*0.35;   // 곱슬 털이면 귀를 털 위로
      p.add(mesh(new THREE.ConeGeometry(0.11, 0.2, 4), skin, [0,0.07,0], [0,Math.PI/4,0]));
      p.add(mesh(new THREE.ConeGeometry(0.06, 0.13, 4), PINK, [0,0.05,0.035], [0,Math.PI/4,0], [1,1,0.5]));
      head.add(p); ears.push(p);
      head.add(onHead(mesh(new THREE.SphereGeometry(0.065, 5, 4), MUZZLE, [0,0,0], [0,0,0], [1,0.8,0.7]), s*0.1, -0.32, -0.015));
      for (let w=0; w<3; w++){
        const b = mesh(new THREE.BoxGeometry(0.16, 0.009, 0.009), INK); const { p:wp } = surf(s*0.5, -0.3, 0.02);
        b.position.copy(wp).add(new V3(s*0.06, (w-1)*0.028, 0)); b.rotation.z = s*(w-1)*0.18; b.rotation.y = -s*0.45; head.add(b);
      }
    }
    head.add(onHead(mesh(new THREE.ConeGeometry(0.032, 0.035, 3), PINK, [0,0,0], [Math.PI/2,0,Math.PI], [1,1,0.6]), 0, -0.2, 0.02));
    if (!patOn) for (let i=-1;i<=1;i++) head.add(onHead(mesh(new THREE.BoxGeometry(0.022, 0.07, 0.01), dark), i*0.13, 0.52 - Math.abs(i)*0.04, 0.004));
    if (neckOK) root.add(mesh(new THREE.TorusGeometry(0.115, 0.022, 4, 10), '#d8464f', [0,0.69,0], [Math.PI/2 - 0.15,0,0]));
    if (neckOK) root.add(mesh(new THREE.IcosahedronGeometry(0.035, 0), '#f1c84b', [0,0.645,0.125]));
  }
  if (spec.k === 'fox'){
    const dark = '#241a16', inner = (spec.wht || 0) > 0 ? lightC : '#f3e3cf';   // 귀는 최대한 짙은 색
    for (const s of [-1,1]){   // 크고 뾰족한 귀: 안쪽은 밝게, 끝은 짙게
      const p = new THREE.Group(); p.position.set(s*(0.2 + 0.05*fluff), 1.17 + 0.12*fluff, -0.02); p.scale.setScalar((1 + 0.3*fluff)*Math.pow(2, ((spec.earS ?? 0.5) - 0.5)*1.2)); p.rotation.z = -s*0.3;
      { const g = new THREE.SphereGeometry(1, 8, 8), pa = g.attributes.position;   // 위로 갈수록 살짝 좁아지는 둥근 귀 (고양이처럼 뾰족하지 않게)
        for (let i=0;i<pa.count;i++){ const y = pa.getY(i), k = 1 - 0.45*Math.max(0, y); pa.setX(i, pa.getX(i)*k); pa.setZ(i, pa.getZ(i)*k); }
        g.computeVertexNormals();
        p.add(mesh(g, dark, [0,0.13,0], [0,0,0], [0.12, 0.2, 0.05]));
        p.add(mesh(g.clone(), inner, [0,0.11,0.03], [0,0,0], [0.07, 0.13, 0.025])); }
      head.add(p); ears.push(p);
    }
    // 뾰족한 주둥이: 슬라이더로 길이. 끝에 까만 코
    const mL = Math.pow(2, ((spec.snout ?? 0.5) - 0.5)*1.4), R = 0.13, Z0 = 0.0, L = Z0 + R*0.95*mL;   // L: 주둥이 앞끝
    const sn = onHead(new THREE.Group(), 0, -0.36, -0.03); head.add(sn);
    // 강아지처럼 둥근 주둥이를 위아래 반으로: 위는 털 색, 아래는 흰색. 길이 슬라이더는 앞뒤로만 늘림
    const half = (c, t0) => sn.add(mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI*2, t0, Math.PI/2), c, [0, 0, Z0], [0,0,0], [R*1.05, R*0.72, R*0.95*mL]));
    half(skin, 0); half((spec.wht || 0) > 0 ? lightC : MUZZLE, Math.PI/2);
    sn.add(mesh(new THREE.SphereGeometry(0.035, 5, 3), INK, [0, 0.03, L - 0.012], [0,0,0], [1.3, 0.9, 1]));
    sn.add(mesh(new THREE.TorusGeometry(0.03, 0.007, 3, 6, Math.PI), INK, [0, -0.045, L*0.75], [-0.3, 0, Math.PI]));   // 미소
    noseAt = { o:sn, p:new V3(0, 0.035, L + 0.01) };
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.16, 0.16, 3), '#3e6b52', [0,0.6,0.2], [Math.PI-0.25,0,0], [1,1,0.35]));   // 목에 두른 초록 손수건
  }
  if (spec.k === 'rabbit'){
    const rM = Math.pow(2, ((spec.snout ?? 0.5) - 0.5)*1.2);   // 입(볼 주머니) 크기: 0 → 0.66배, 1 → 1.52배
    const inner = PINK;
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*0.12, 1.2 + 0.1*fluff, -0.02);
      p.rotation.z = s === -1 ? 0.95 : -0.12; p.rotation.x = -0.1;
      { const t = ((spec.earS ?? 0.5) - 0.5)*2;   // 귀 크기: 가운데가 지금. 키우면 전체가 커지며 넓은 타원 + 두껍게, 줄이면 길이만 짧아짐
        if (t >= 0){ const sz = Math.pow(2, t*0.35); p.scale.set(sz*(1 + 0.6*t), sz, sz*(1 + 0.7*t)); }
        else p.scale.set(1, Math.pow(2, t*0.9), 1); }
      p.add(mesh(new THREE.CapsuleGeometry(0.062, 0.3, 2, 6), skin, [0,0.21,0], [0,0,0], [1,1,0.55]));
      if (fuzz > 0){   // 보송한 털: 귀에도 머리와 같은 겹 껍질을 씌움 (귀 바깥 면만, 안쪽 분홍은 그대로)
        const earGeo = new THREE.CapsuleGeometry(0.062, 0.3, 3, 8), N = 8, len = (0.06 + 0.3*fuzz)*0.3*0.5;   // 털 길이는 머리의 절반 정도
        for (let i=1; i<=N; i++){
          const h = i/N, ex = h*len;
          const sm = furMaterial(skin, PALETTE.pat[spec.fur2 ?? 0], spec.pat || 0, spec.amt ?? 0.5, spec.size ?? 0.4, spec.ps ?? 1, 0, lightC, h);
          const sh = new THREE.Mesh(earGeo, sm); sh.position.set(0, 0.21, -0.004*i);
          sh.scale.set(1 + ex/0.062, 1 + ex/0.21, 0.55*(1 + ex/0.034)); p.add(sh);
        }
      }
      p.add(mesh(new THREE.CapsuleGeometry(0.035, 0.24, 2, 5), inner, [0,0.22,0.022 + (fuzz > 0 ? (0.06 + 0.3*fuzz)*0.15*0.55 : 0)], [0,0,0], [1,1,0.4]));   // 보송 털이면 털 위로 올라오게
      head.add(p); ears.push(p);
      head.add(onHead(mesh(new THREE.SphereGeometry(0.06*rM, 5, 4), MUZZLE, [0,0,0], [0,0,0], [1,0.85,0.7]), s*0.09*rM, -0.3 - 0.04*(rM - 1), -0.015 + 0.03*(rM - 1)));
    }
    head.add(onHead(mesh(new THREE.SphereGeometry(0.028, 5, 3), PINK, [0,0,0], [0,0,0], [1.3,0.9,0.8]), 0, -0.2, 0.02 + 0.035*(rM - 1)));
    head.add(onHead(mesh(new THREE.BoxGeometry(0.04, 0.04*rM, 0.01), '#ffffff'), 0, -0.47 - 0.08*(rM - 1), 0.005 + 0.02*(rM - 1)));
    for (const s of [-1,1]) if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.05, 0.09, 4), '#5c84c9', [s*0.055,0.665,0.13], [0,0,s*Math.PI/2], [1,1,0.5]));
    if (neckOK) root.add(mesh(new THREE.IcosahedronGeometry(0.025, 0), '#4a6fb0', [0,0.665,0.14]));
  }
  if (spec.k === 'dino'){   // 티라노 머리: 짧은 머리 덩어리 앞에 둥근 직육면체 위턱이 크게 붙고, 아래턱이 살짝 벌어져 이빨이 보임
    const spike = PALETTE.dino.spike[spec.fur], belly = (spec.wht || 0) > 0 ? lightC : shade(skin, 0.15, -0.1);
    const rbox = (w, h, d, r=0.35) => {   // 모서리가 둥근 직육면체 (로우폴리): 상자 꼭짓점을 공 쪽으로 조금 당김
      const g = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), pa = g.attributes.position, v = new V3();
      for (let i=0;i<pa.count;i++){ v.fromBufferAttribute(pa, i); const u = v.clone().normalize().multiplyScalar(0.5*Math.SQRT2*0.86); v.lerp(u, r); pa.setXYZ(i, v.x*w, v.y*h, v.z*d); }
      g.computeVertexNormals(); return g; };
    const mL = Math.pow(2, ((spec.snout ?? 0.5) - 0.5)*1.2), JL = 0.27*mL;   // 주둥이 길이
    const jaw = new THREE.Group(); jaw.position.set(0, HEAD_C.y - 0.17, 0.17); head.add(jaw);   // 눈·안경 아래로 내림
    jaw.add(mesh(rbox(0.38, 0.15, JL + 0.06), skin, [0, 0.03, JL/2 - 0.03]));                                   // 위턱
    const low = new THREE.Group(); low.position.set(0, -0.035, 0.02); jaw.add(low);   // 아래턱(입은 닫음)
    low.add(mesh(rbox(0.33, 0.08, JL*0.95, 0.4), skin, [0, -0.04, JL*0.46]));
    low.add(mesh(rbox(0.29, 0.03, JL*0.88, 0.4), belly, [0, -0.08, JL*0.45]));                   // 턱 밑은 밝은 색
    for (const sx of [-1,1]){
      jaw.add(mesh(new THREE.SphereGeometry(0.015, 4, 3), shade(skin, -0.3), [sx*0.06, 0.105, JL - 0.04]));   // 콧구멍
    }
    noseAt = { o:jaw, p:new V3(0, 0.11, JL - 0.02) };
    [[0.85,0.075],[1.2,0.095],[1.55,0.09],[1.9,0.075],[2.25,0.06]].forEach(([pt, h]) => {   // 머리 위 가시
      const { p, n } = surf(0, pt, -0.01);
      const c = mesh(new THREE.SphereGeometry(1, 6, 4), spike, [0,0,0], [0,0,0], [h*0.55, h*0.9, h*0.75]); c.position.copy(p).addScaledVector(n, h*0.3);   // 둥근 돌기
      c.quaternion.setFromUnitVectors(new V3(0,1,0), n); head.add(c);
    });
    [[0.62,-0.17,0.06],[0.5,-0.25,0.05],[0.37,-0.29,0.045]].forEach(([y,z,h]) => root.add(mesh(new THREE.SphereGeometry(1, 6, 4), spike, [0,y,z], [-1.0,0,0], [h*0.6, h*0.95, h*0.8])));   // 등의 둥근 돌기
  }
  if (spec.k === 'robot'){
    const dark = shade(skin, -0.18), light = shade(skin, 0.12);
    for (const s of [-1,1]){
      head.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6), dark, [s*0.3, 0.98, 0], [0,0,Math.PI/2]));
      head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6), light, [s*0.33, 0.98, 0], [0,0,Math.PI/2]));
    }
    for (let i=-1;i<=1;i++) head.add(mesh(new THREE.BoxGeometry(0.04, 0.018, 0.01), dark, [i*0.055, 0.86, 0.244]));
    head.add(mesh(new THREE.BoxGeometry(0.2, 0.03, 0.01), light, [0, 1.14, 0.244]));
    const ant = new THREE.Group(); ant.position.set(0, 1.21, 0);
    ant.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 4), dark, [0, 0.07, 0]));
    ant.add(mesh(new THREE.IcosahedronGeometry(0.04, 0), '#e8484f', [0, 0.16, 0]));
    head.add(ant); ears.push(ant);
    root.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), dark, [0, 0.69, 0]));
  }

  if (K === 'elephant'){
    const inner = '#e8b4c0', dark = shade(skin, -0.12);
    for (const s of [-1,1]){   // 크고 납작한 귀: 앞을 조금 보게
      const p = new THREE.Group(); p.position.set(s*0.3, 1.0, -0.06); p.rotation.y = s*0.5;
      p.add(mesh(new THREE.SphereGeometry(1, 8, 6), dark, [s*0.13, 0, 0], [0,0,0], [0.2, 0.25, 0.04]));
      p.add(mesh(new THREE.SphereGeometry(1, 8, 6), inner, [s*0.13, -0.01, 0.02], [0,0,0], [0.14, 0.18, 0.025]));
      head.add(p); ears.push(p);
    }
    // 코: 아래로 내려오다 끝이 살짝 위로 말리는 마디 공들
    const tr = new THREE.Group(); tr.position.set(0, 0.92, 0.27); head.add(tr); ears.push(tr);
    const curve = new THREE.CatmullRomCurve3([new V3(0,0,0), new V3(0.02,-0.09,0.07), new V3(0.08,-0.15,0.1), new V3(0.16,-0.15,0.11), new V3(0.2,-0.08,0.1)]);   // 꽃과 겹치지 않게 옆(오른쪽)으로 말아 올림
    for (let i=0; i<=9; i++){ const t = i/9, q = curve.getPoint(t); tr.add(mesh(new THREE.IcosahedronGeometry(0.075 - 0.035*t, 1), skin, q.toArray())); }
    const tip = curve.getPoint(1); tr.add(mesh(new THREE.CircleGeometry(0.026, 6), shade(skin, -0.35), [tip.x + 0.01, tip.y + 0.03, tip.z], [-Math.PI/2,0,0]));
    for (const s of [-1,1]) head.add(mesh(new THREE.ConeGeometry(0.022, 0.1, 5), '#f6f0e2', [s*0.09, 0.82, 0.26], [1.9, 0, -s*0.4]));   // 작은 상아
    noseAt = { o:tr, p:new V3(tip.x, tip.y + 0.04, tip.z) };
  }
  if (K === 'giraffe'){
    const horn = '#b07a3e', knob = '#6b4430';
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*0.1, 1.22, -0.03); p.rotation.z = -s*0.15;
      p.add(mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.14, 5), horn, [0, 0.07, 0]));
      p.add(mesh(new THREE.IcosahedronGeometry(0.045, 0), knob, [0, 0.15, 0]));
      head.add(p); ears.push(p);
      const e = new THREE.Group(); e.position.set(s*0.28, 1.1, -0.04); e.rotation.z = -s*1.25;   // 옆으로 누운 잎 모양 귀
      e.add(mesh(new THREE.SphereGeometry(1, 6, 4), skin, [0, 0.07, 0], [0,0,0], [0.045, 0.1, 0.03])); head.add(e); ears.push(e);
    }
    const sn = onHead(mesh(new THREE.SphereGeometry(0.15, 7, 5), '#f0d9a8', [0,0,0], [0,0,0], [1.15, 0.85, 0.9]), 0, -0.38, -0.03); head.add(sn);
    for (const s of [-1,1]) head.add(onHead(mesh(new THREE.SphereGeometry(0.016, 4, 3), '#6b4430'), s*0.08, -0.24, 0.08));
    for (let i=0;i<5;i++) head.add(mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), '#8a5a3c', [0, 0.72 - LIFT + i*0.08 + 0.1, -0.075]));   // 목덜미 갈기
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 4), '#d8464f', [-0.05,0.665,0.12], [0,0,Math.PI/2], [1,1,0.5]));   // 나비넥타이
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 4), '#d8464f', [0.05,0.665,0.12], [0,0,-Math.PI/2], [1,1,0.5]));
    noseAt = { o:head, p:onHead(new THREE.Object3D(), 0, -0.3, 0.13).position.clone() };
    iconTop += 0.08;
  }
  if (K === 'bear'){   // 곰: 둥근 귀 + 밝은 주둥이 + 까만 코 + 미소
    const muz = (spec.wht || 0) > 0 ? lightC : skin === PALETTE.bear.fur[3] ? '#f8f4ec' : '#' + new THREE.Color(skin).lerp(new THREE.Color('#f3e2c4'), 0.62).getHexString();
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*(0.25 + 0.05*fluff), 1.2 + 0.1*fluff, -0.03); p.rotation.z = -s*0.4;
      p.add(mesh(new THREE.SphereGeometry(0.1, 7, 5), skin, [0,0,0], [0,0,0], [1,1,0.55]));
      p.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), skin === PALETTE.bear.fur[3] ? '#e9dccb' : shade(skin, 0.22, -0.1), [0,0,0.035], [0,0,0], [1,1,0.3]));
      head.add(p); ears.push(p);
    }
    head.add(onHead(mesh(new THREE.SphereGeometry(0.15, 8, 5), muz, [0,0,0], [0,0,0], [1.2, 0.85, 0.7]), 0, -0.36, -0.06));
    head.add(onHead(mesh(new THREE.SphereGeometry(0.042, 6, 4), INK, [0,0,0], [0,0,0], [1.4, 0.95, 0.8]), 0, -0.22, 0.055));
    { const g = new THREE.Group(); g.add(mesh(new THREE.TorusGeometry(0.028, 0.007, 3, 6, Math.PI), INK, [0,0,0], [0,0,Math.PI])); head.add(onHead(g, 0, -0.4, 0.075)); }   // 미소 (onHead가 방향을 덮어쓰므로 묶음 안에서 뒤집음)
    noseAt = { o:head, p:onHead(new THREE.Object3D(), 0, -0.22, 0.09).position.clone() };
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 4), '#4f8a5b', [-0.05,0.665,0.12], [0,0,Math.PI/2], [1,1,0.5]));
    if (neckOK) root.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 4), '#4f8a5b', [0.05,0.665,0.12], [0,0,-Math.PI/2], [1,1,0.5]));
  }
  if (K === 'potato' || K === 'sweet' || K === 'dumpling'){   // 머리가 곧 물체인 종: 공통으로 작은 미소
    const g = new THREE.Group(); g.add(mesh(new THREE.TorusGeometry(0.03, 0.008, 3, 6, Math.PI), INK, [0,0,0], [0,0,Math.PI]));
    head.add(onHead(g, 0, -0.3 + ((spec.mouthY ?? 0.5) - 0.5)*0.24, 0.004));   // 입 위치·크기: 사람과 같은 슬라이더(가운데가 기본)
    g.scale.x = Math.pow(2, ((spec.mouthW ?? 0.5) - 0.5)*1.6);   // 사람처럼 좌우로만 넓어짐
  }
  if (K === 'potato'){
    const pit = shade(skin, -0.22, -0.05);
    [[1.5, 0.35], [-1.4, 0.15], [2.3, -0.25], [-2.2, -0.4], [3.0, 0.5], [0.95, 0.62], [-0.9, -0.62], [1.2, -0.55]].forEach(([y, pt]) =>   // 감자 눈(움푹한 점)
      head.add(onHead(mesh(new THREE.SphereGeometry(0.022, 5, 3), pit, [0,0,0], [0,0,0], [1.4, 1, 0.35]), y, pt, -0.002)));
    for (let i=0; i<4; i++) head.add(onHead(mesh(new THREE.SphereGeometry(0.016, 4, 3), shade(skin, -0.1), [0,0,0], [0,0,0], [1, 1, 0.3]), [0.55, -0.6, 0.4, -0.35][i], [0.3, 0.25, -0.62, -0.68][i], 0));   // 얼굴 둘레 잔점
    const n = spec.sprout ?? 1;
    [[0.45, 1.05, 0.5], [-0.75, 0.95, -0.6]].slice(0, n).forEach(([yaw, pitch, lean], i) => {   // 싹: 연두색 줄기 + 작은 잎
      const g = onHead(new THREE.Group(), yaw, pitch, -0.01); head.add(g); ears.push(g);
      const st = new THREE.Group(); st.rotation.x = Math.PI/2; st.rotation.z = lean*0.4; g.add(st);
      st.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.1, 5), '#9cc65a', [0, 0.05, 0]));
      st.add(mesh(new THREE.SphereGeometry(0.035, 5, 3), '#7fb84a', [0.025*Math.sign(lean || 1), 0.1, 0], [0, 0, -0.6*Math.sign(lean || 1)], [1, 0.45, 0.6]));
    });
  }
  if (K === 'sweet'){
    const dark = shade(skin, -0.18);
    const tip = new THREE.Group(); tip.position.set(0.04, HEAD_C.y + HEAD_R.y*1.15, 0); head.add(tip); ears.push(tip);   // 위쪽 끝: 가늘게 휘어진 뿌리 꼬리
    tip.add(limb(new V3(0, -0.02, 0), new V3(0.03, 0.09, 0), 0.016, dark));
    tip.add(limb(new V3(0.03, 0.09, 0), new V3(0.09, 0.13, 0.01), 0.008, dark));
    for (const [yaw, pitch, len] of [[1.4, 0.3, 0.07], [-1.5, -0.1, 0.06], [2.4, 0.55, 0.05], [-2.5, -0.5, 0.07], [1.25, -0.6, 0.05]]){   // 옆구리 잔뿌리
      const { p, n } = surf(yaw, pitch, -0.005); head.add(limb(p, p.clone().addScaledVector(n, len).add(new V3(0, -len*0.5, 0)), 0.006, dark));
    }
    for (const [yaw, pitch] of [[1.1, 0.1], [-1.2, 0.45], [2.8, -0.2], [-2.9, 0.2]])   // 껍질 결: 옅은 가로줄
      head.add(onHead(mesh(new THREE.BoxGeometry(0.1, 0.008, 0.006), shade(skin, 0.1)), yaw, pitch, 0.001));
  }
  if (K === 'dumpling'){
    const dough = shade(skin, -0.05), N = 9;
    for (let i=0; i<N; i++){   // 위쪽 능선을 따라 접힌 주름: 낮은 물결이 좌우로 번갈아 기울어짐
      const t = i/(N - 1)*2 - 1, yaw = (t < 0 ? -1 : 1)*Math.PI/2, pitch = Math.PI/2 - Math.abs(t)*1.0;
      const { p, n } = surf(Math.abs(t) < 1e-3 ? 0.001 : yaw, pitch, 0), k = 1 - 0.45*t*t;
      const m = mesh(new THREE.SphereGeometry(1, 6, 4), i % 2 ? dough : skin, [0,0,0], [0,0,0], [0.055*k, 0.055*k, 0.1*k]);
      m.position.copy(p).addScaledVector(n, 0.012); m.quaternion.setFromUnitVectors(new V3(0,1,0), n); m.rotateZ(i % 2 ? 0.5 : -0.5); head.add(m);
    }
    for (const [yaw, pitch, sc] of [[-0.55, 0.45, 1], [-0.42, 0.62, 0.6]])   // 반질반질한 하이라이트
      head.add(onHead(mesh(new THREE.SphereGeometry(0.03, 5, 3), '#ffffff', [0,0,0], [0,0,0], [1.5*sc, 0.7*sc, 0.3]), yaw, pitch, 0.002));
    if (spec.grill){   // 군만두: 아래쪽 옆·뒤가 노릇하게 구워짐 (얼굴 앞은 비움)
      const src = headMesh.geometry.attributes.position, out = [];
      for (let i=0; i<src.count; i+=3){ let ok = true; for (let j=0;j<3;j++){ const y = src.getY(i+j), z = src.getZ(i+j); if (y > -0.25 || z > 0.45) ok = false; }
        if (ok) for (let j=0;j<3;j++) out.push(src.getX(i+j), src.getY(i+j), src.getZ(i+j)); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals();
      const crust = new THREE.Mesh(g, M('#c98a3e')); crust.position.copy(HEAD_C); crust.scale.copy(HEAD_R).multiplyScalar(1.012); head.add(crust);
    }
  }
  if (K === 'hamster'){
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*(0.2 + 0.05*fluff), 1.2 + 0.1*fluff, -0.02); p.rotation.z = -s*0.3;
      p.add(mesh(new THREE.SphereGeometry(0.075, 6, 4), skin, [0,0,0], [0,0,0], [1,1,0.45]));
      p.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), PINK, [0,0,0.02], [0,0,0], [1,1,0.3]));
      head.add(p); ears.push(p);
      head.add(onHead(mesh(new THREE.SphereGeometry(0.13, 7, 5), (spec.wht || 0) > 0.3 ? lightC : skin, [0,0,0], [0,0,0], [1, 0.85, 0.7]), s*0.62, -0.38, -0.05));   // 볼주머니
    }
    head.add(onHead(mesh(new THREE.SphereGeometry(0.022, 5, 3), PINK, [0,0,0], [0,0,0], [1.3,0.9,0.8]), 0, -0.2, 0.012));
    head.add(onHead(mesh(new THREE.BoxGeometry(0.035, 0.03, 0.01), '#ffffff'), 0, -0.4, 0.005));
  }
  if (K === 'bird'){
    const bk = Math.pow(2, ((spec.beak ?? 0.5) - 0.5)*1.8);   // 부리 크기: 0 → 0.54배, 1 → 1.87배
    const bg = onHead(new THREE.Group(), 0, -0.2, 0.0); head.add(bg); bg.scale.setScalar(bk);
    const bkC = ['#f0a03c', '#e3cba6', '#f2d16b', '#f3b4c0', '#2f2a28'][spec.beakC || 0];   // 부리 색: 주황(기본), 베이지, 노랑, 연핑크, 검정
    bg.add(mesh(new THREE.ConeGeometry(0.06, 0.13, 4), bkC, [0, 0.012, 0.06], [Math.PI/2, Math.PI/4, 0], [1, 1, 0.6]));
    bg.add(mesh(new THREE.ConeGeometry(0.045, 0.08, 4), shade(bkC, -0.1), [0, -0.03, 0.035], [Math.PI/2 + 0.25, Math.PI/4, 0], [1, 1, 0.5]));
    const crest = new THREE.Group(); crest.position.set(0, 1.25, 0.02); head.add(crest); ears.push(crest);
    [-0.35, 0, 0.35].forEach((a, i) => crest.add(mesh(new THREE.CapsuleGeometry(0.025, 0.12 - Math.abs(a)*0.1, 2, 5), shade(skin, -0.12), [a*0.08, 0.06, -i*0.02], [-0.3, 0, a])));
    head.add(onHead(mesh(new THREE.SphereGeometry(0.2, 7, 5), shade(skin, 0.35, -0.3), [0,0,0], [0,0,0], [1.1, 0.8, 0.4]), 0, -0.55, -0.12));   // 밝은 목 앞털
    noseAt = { o:bg, p:new V3(0, 0.012, 0.13) };
  }
  if (K === 'fish'){
    const fin = shade(skin, -0.12), finL = shade(skin, 0.18);
    const top = new THREE.Group(); top.position.set(0, 1.23, -0.04); head.add(top); ears.push(top);
    top.add(mesh(new THREE.ConeGeometry(0.13, 0.28, 3), finL, [0, 0.1, -0.06], [-0.55, 0, 0], [0.22, 1, 1]));   // 높은 등지느러미
    for (const s of [-1,1]){
      const p = new THREE.Group(); p.position.set(s*0.27, 0.92, 0.02); p.rotation.z = s*0.6;
      p.add(mesh(new THREE.ConeGeometry(0.07, 0.15, 3), finL, [s*0.04, -0.03, 0], [0, 0, s*1.6], [1, 1, 0.25])); head.add(p); ears.push(p);
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.98, -0.3); head.add(tail); ears.push(tail);
    // 금붕어 꼬리: 좌우로 갈라진 두 장의 큰 부채, 각 부채는 늘어지는 꽃잎 세 갈래
    for (const s of [-1,1]){ const f = new THREE.Group(); f.rotation.y = s*0.45; tail.add(f);
      [-0.8, -0.3, 0.15, 0.6].forEach((a, j) => f.add(mesh(new THREE.SphereGeometry(1, 6, 4), j % 2 ? finL : shade(finL, -0.07), [0, Math.sin(a)*0.17, -Math.cos(a)*0.17], [a, 0, 0], [0.015, 0.075, 0.19 - Math.abs(a)*0.03]))); }   // 하늘하늘한 잎 모양 갈래
    for (const s of [-1,1]) for (let i=0;i<3;i++) head.add(onHead(mesh(new THREE.TorusGeometry(0.05, 0.008, 3, 6, Math.PI), finL), s*(0.95 + i*0.3), 0.1 - (i%2)*0.15, 0.002));   // 비늘 무늬
    const lip = onHead(mesh(new THREE.TorusGeometry(0.035, 0.016, 4, 8), '#f08aa0'), 0, -0.36, 0.01); lip.scale.set(1, 0.75, 1); head.add(lip);
    noseAt = { o:head, p:onHead(new THREE.Object3D(), 0, -0.17, 0.03).position.clone() };
  }
  if (K === 'tv'){
    const [W, H, D] = BOXY, dark = shade(skin, -0.2);
    head.add(mesh(new THREE.BoxGeometry(W*0.76, H*0.78, 0.02), SCREEN, [scr.x, HEAD_C.y, D/2 + 0.003]));   // 화면 (얼굴은 화면 위)
    head.add(mesh(new THREE.BoxGeometry(W*0.8, H*0.84, 0.012), '#3d3633', [scr.x, HEAD_C.y, D/2 + 0.001]));
    for (let i=0;i<2;i++) head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 8), dark, [W*0.4, HEAD_C.y + 0.1 - i*0.1, D/2 + 0.01], [Math.PI/2, 0, 0]));   // 손잡이
    for (let i=0;i<3;i++) head.add(mesh(new THREE.BoxGeometry(0.06, 0.008, 0.01), dark, [W*0.4, HEAD_C.y - 0.1 - i*0.025, D/2 + 0.002]));
    const ant = new THREE.Group(); ant.position.set(0, HEAD_C.y + H/2, -0.05); head.add(ant); ears.push(ant);
    ant.add(mesh(new THREE.SphereGeometry(0.05, 6, 3, 0, Math.PI*2, 0, Math.PI/2), '#3d3633'));
    for (const s of [-1,1]){ ant.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 4), '#9aa0a6', [s*0.07, 0.12, 0], [0, 0, -s*0.55])); ant.add(mesh(new THREE.IcosahedronGeometry(0.02, 0), '#9aa0a6', [s*0.14, 0.23, 0])); }
    root.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), '#3d3633', [0, 0.69, 0]));
  }
  if (K === 'phone'){
    const [W, H, D] = BOXY;
    head.add(mesh(new THREE.BoxGeometry(W*0.86, H*0.84, 0.01), SCREEN, [0, HEAD_C.y - 0.01, D/2 + 0.003]));
    head.add(mesh(new THREE.BoxGeometry(0.1, 0.022, 0.012), '#1f1a1c', [0, HEAD_C.y + H/2 - 0.04, D/2 + 0.006]));   // 위쪽 카메라 홈
    head.add(mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), '#8a9590', [0, HEAD_C.y - H/2 + 0.05, D/2 + 0.009]));   // 아래 막대
    for (let i=0;i<3;i++) head.add(mesh(new THREE.BoxGeometry(0.018, 0.02 + i*0.012, 0.01), '#5a7a72', [-W*0.32 + i*0.024, HEAD_C.y + H/2 - 0.08 + i*0.006, D/2 + 0.009]));   // 신호 막대
    head.add(mesh(new THREE.BoxGeometry(0.012, 0.08, 0.03), shade(skin, -0.15), [W/2 + 0.004, HEAD_C.y + 0.12, 0]));   // 옆 버튼
    head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 8), '#1f1a1c', [-W*0.25, HEAD_C.y + H*0.32, -D/2 - 0.004], [Math.PI/2, 0, 0]));   // 뒷면 카메라
  }
  if (K === 'can'){
    const dark = shade(skin, -0.18);
    head.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 12), dark, [0, HEAD_C.y + 0.235, 0]));      // 뚜껑 테
    head.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 12), dark, [0, HEAD_C.y - 0.215, 0]));    // 밑 테
    head.add(mesh(new THREE.TorusGeometry(0.16, 0.025, 4, 10, Math.PI), dark, [0, HEAD_C.y + 0.02, -0.31], [0, Math.PI/2, Math.PI/2], [1, 1, 1]));   // 뒤 손잡이
    const sp = new THREE.Group(); sp.position.set(0.25, HEAD_C.y - 0.12, 0.05); sp.rotation.z = -0.85; head.add(sp); ears.push(sp);   // 대롱 + 물뿌리개 꼭지
    sp.add(mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.4, 6), skin, [0, 0.2, 0]));
    sp.add(mesh(new THREE.CylinderGeometry(0.075, 0.03, 0.06, 8), dark, [0, 0.42, 0]));
    sp.add(mesh(new THREE.CircleGeometry(0.07, 8), '#e9e4d8', [0, 0.452, 0], [-Math.PI/2, 0, 0]));
    for (let i=0;i<3;i++) sp.add(mesh(new THREE.SphereGeometry(0.018, 4, 3), '#8fc6ea', [0.06 + i*0.05, 0.5 + i*0.02, 0], [0,0,0], [1, 1.5, 1]));   // 물방울
  }
  if (FLOWER){
    // 꽃 머리: 얼굴이 꽃 가운데, 꽃잎이 얼굴 둘레를 감쌈
    const ring = (n, rad, z, sc, c, tilt, rot0=0) => { for (let i=0; i<n; i++){
      const a = rot0 + i/n*Math.PI*2, g = new THREE.Group();
      g.position.set(Math.cos(a)*rad*1.05, HEAD_C.y + Math.sin(a)*rad, z); g.rotation.z = a - Math.PI/2; head.add(g);
      g.add(mesh(new THREE.SphereGeometry(1, 7, 5), c, [0, sc[1]*0.6, 0], [tilt, 0, 0], sc)); } };
    if (K === 'rose'){   // 장미: 둥글게 오므린 꽃잎 세 겹
      ring(6, 0.27, -0.02, [0.11, 0.11, 0.05], skin, 0.85);
      ring(7, 0.29, -0.08, [0.12, 0.12, 0.05], shade(skin, -0.06), 0.55, 0.45);
      ring(7, 0.3, -0.14, [0.125, 0.12, 0.05], shade(skin, -0.12), 0.35, 0.1);
      for (let i=0;i<3;i++) head.add(mesh(new THREE.TorusGeometry(0.16 - i*0.05, 0.03, 4, 10, Math.PI*1.4), shade(skin, -0.04), [0, HEAD_C.y + 0.26 - i*0.012, -0.04 - i*0.03], [Math.PI/2 - 0.3, 0, i*1.3]));   // 정수리 소용돌이
    } else {             // 데이지: 가늘고 긴 흰 꽃잎이 방사형으로
      ring(10, 0.27, -0.05, [0.135, 0.15, 0.025], skin, 0.12, Math.PI/2);   // 꽃잎 폭을 넓혀 서로 겹치게 (틈 없음)
      for (let i=0;i<10;i++){ const a = i*2.4, r = 0.4 + (i%3)*0.18; head.add(onHead(mesh(new THREE.SphereGeometry(0.012, 4, 3), '#d9a32e'), Math.cos(a)*r*0.6, 0.55 + Math.sin(a)*0.18, 0.004)); }   // 가운데 꽃술 점
    }
    for (const s of [-1,1]) root.add(mesh(new THREE.SphereGeometry(1, 6, 4), LEAF, [s*0.11, 0.69, 0.05], [0.3, s*0.3, s*0.9], [0.14, 0.05, 0.08]));   // 목 잎사귀
  }
  if (isH || animalHair){
    const hair = PALETTE.human.hair[spec.hair ?? 0], hair0 = head.children.length, FD = FACE_DEFORM || (d => d);
    const toHead = d => { const u = FD(d.clone().normalize()); return new V3(u.x*HEAD_R.x, u.y*HEAD_R.y, u.z*HEAD_R.z).add(HEAD_C); };
    const dirOf = (yaw, pitch) => new V3(Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), Math.cos(yaw)*Math.cos(pitch));
    const onHair = (yaw, pitch, k=1.06) => toHead(dirOf(yaw, pitch).multiplyScalar(k));
    // 면으로 만든 머리의 구멍(얼굴) 가장자리를 매끈하게: 구멍 안의 꼭짓점을 위쪽(정수리 방향)의 경계선까지 끌어올림
    const liftOut = (inHole, yaw, pt) => { let lo = pt, hi = Math.PI/2; if (inHole(yaw, hi)) return pt;
      for (let k=0; k<14; k++){ const m = (lo + hi)/2; if (inHole(yaw, m)) lo = m; else hi = m; } return hi; };
    if (isH && ![7,9,13].includes(spec.style)) for (const s of [-1,1]) head.add(mesh(new THREE.IcosahedronGeometry(0.05, 0), skin, toHead(new V3(s, -0.1, 0)).toArray(), [0,0,0], [0.6,1,1]));   // 귀 (웨이브 장발은 머리에 덮임)
    const bald = spec.style === 5;   // 머리 모양 '없음'
    if (!bald && ![7,13,14].includes(spec.style)){ const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6, 0, Math.PI*2, 0, 1.62), M(hair));
      cap.position.set(0, 1.0, -0.01); cap.scale.set(0.35, 0.32, 0.33); cap.rotation.x = -0.5;
      if (spec.acc && (spec.acc.hat || spec.acc.cap)) cap.scale.multiplyScalar(0.94);   // 모자 밖으로 삐져나오지 않게
      head.add(cap); }
    if (![1,3,5,6,7,8,9,11,12,13,14].includes(spec.style)) for (let i=-2;i<=2;i++){   // 앞머리 (파마류는 털뭉치가 대신함). 모자를 올려 써서 모자 아래로 보임
      const g = new THREE.Group(); const { p } = surf(i*0.2, 0.45, 0.0); g.position.copy(p); g.rotation.y = i*0.2;
      g.add(mesh(new THREE.ConeGeometry(0.075, 0.15, 4), hair, [0,-0.02,0], [Math.PI-0.45,0,i*0.12])); head.add(g);
    }
    if (spec.style === 1){   // 단발(보브): 정수리 볼륨 + 눈썹까지 오는 두꺼운 일자 앞머리 + 턱선에서 일자로 끊긴 옆·뒷머리
      const zs = HEAD_R.z/HEAD_R.x;
      head.add(mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI*2, 0, 1.35), hair, [0, HEAD_C.y + 0.01, -0.01], [0,0,0], [HEAD_R.x*1.12, HEAD_R.y*1.14, HEAD_R.z*1.1]));
      const shell = (rad, th0, thL, y0, y1) => { const m = mesh(new THREE.CylinderGeometry(rad, rad*1.03, y1 - y0, 14, 1, true, th0, thL), hair, [0, (y0 + y1)/2, -0.01], [0,0,0], [1, 1, zs]); head.add(m); return m; };
      // 옆·뒷머리: 열린 원통을 잘게 나눠 결(약한 물결)을 주고, 밑단에 ㅅ자 틈을 파서 머리카락 가닥처럼
      const bobShell = (rad, y0, y1, depth) => {
        const g = new THREE.CylinderGeometry(rad, rad*1.03, y1 - y0, 60, 6, true, 0.85, Math.PI*2 - 1.7), pa = g.attributes.position, v = new V3();
        const N = 5, h = y1 - y0;   // ㅅ자 틈 개수
        for (let i=0; i<pa.count; i++){
          v.fromBufferAttribute(pa, i); const t = (v.y + h/2)/h, th = (Math.atan2(v.x, v.z) + Math.PI*2) % (Math.PI*2);   // t: 밑단 0 → 위 1
          const k = 1 + 0.035*Math.sin(th*18)*(1 - t*0.7) + 0.05*(1 - t)*(1 - t);                 // 가닥 결 + 밑단이 살짝 바깥으로
          const f = ((th - 0.85)/(Math.PI*2 - 1.7)*N + 0.5) % 1, notch = Math.max(0, 1 - Math.abs(f - 0.5)/0.17);   // ㅅ자 틈
          v.x *= k; v.z *= k; v.y += notch*depth*Math.max(0, 1 - t*1.6);
          pa.setXYZ(i, v.x, v.y, v.z);
        }
        g.computeVertexNormals();
        const m = mesh(g, hair, [0, (y0 + y1)/2, -0.01], [0,0,0], [1, 1, zs]); head.add(m); return m;
      };
      bobShell(HEAD_R.x*1.12, 0.73, HEAD_C.y + 0.12, 0.12);   // 바깥 면 (얼굴 앞은 열어 둠)
      bobShell(HEAD_R.x*1.06, 0.735, HEAD_C.y + 0.1, 0.12);    // 안쪽 면: 끝단 두께
      for (let i=-4; i<=4; i++){   // 앞머리: 히메컷과 같은 일자 앞머리
        const yaw = i*0.17, top = onHair(yaw, 0.62, 1.05), bot = onHair(yaw, 0.2, 1.08);
        const b = limb(top, bot, 0.042, hair); b.scale.set(1.35, 1, 0.55); head.add(b);
      }
    }
    if (spec.style === 2) head.add(mesh(new THREE.IcosahedronGeometry(0.12, 1), hair, [0, 1.3, -0.1]));
    if (spec.style === 3){   // 파마: 곱슬 털뭉치를 머리카락 자리에만 (얼굴은 비움)
      const geos = [], n = 64, GA = Math.PI*(3 - Math.sqrt(5));
      for (let i=0; i<n; i++){
        const y = 1 - 2*(i+0.5)/n, r = Math.sqrt(1 - y*y), t = i*GA, d = new V3(Math.cos(t)*r, y, Math.sin(t)*r);
        const keep = d.y > -0.15 || (d.z < -0.1 && d.y > -0.75);
        if (!keep || (d.z > 0.35 && d.y < 0.5) || underHat(d)) continue;
        const g = new THREE.IcosahedronGeometry(0.07 + 0.025*((i*7)%5)/4, 1);
        const p = toHead(d.multiplyScalar(1.04)); g.translate(p.x, p.y, p.z); geos.push(g);
      }
      head.add(new THREE.Mesh(mergeGeometries(geos), M(hair))); geos.forEach(g => g.dispose());
    }
    // 곡선을 따라 곱슬 털뭉치를 이어 붙이는 도우미 (물결: 머리 바깥쪽으로 사인 오프셋)
    const chain = (pts, n, r0, r1, wave, geos) => {
      const cv = new THREE.CatmullRomCurve3(pts);
      for (let i=0; i<n; i++){
        const t = i/(n-1), p = cv.getPoint(t), out = new V3(p.x, 0, p.z).normalize();
        if (underHat(new V3((p.x - HEAD_C.x)/HEAD_R.x, (p.y - HEAD_C.y)/HEAD_R.y, (p.z - HEAD_C.z)/HEAD_R.z).normalize())) continue;
        p.addScaledVector(out, wave*Math.sin(t*Math.PI*4));
        const g = new THREE.IcosahedronGeometry(r0 + (r1 - r0)*t, 1); g.scale(1, 1.15, 0.8); g.translate(p.x, p.y, p.z); geos.push(g);
      }
    };
    const crown = (minY, size, geos) => {   // 정수리 볼륨 털뭉치
      const n = 48, GA = Math.PI*(3 - Math.sqrt(5));
      for (let i=0; i<n; i++){
        const y = 1 - 2*(i+0.5)/n, r = Math.sqrt(1 - y*y), t = i*GA, d = new V3(Math.cos(t)*r, y, Math.sin(t)*r);
        if (d.y < minY || underHat(d)) continue;
        const g = new THREE.IcosahedronGeometry(size*(0.85 + ((i*7)%5)/20), 1); g.scale(1, 0.6, 1);
        const p = toHead(d.multiplyScalar(1.03)); g.translate(p.x, p.y, p.z); geos.push(g);
      }
    };
    if (spec.style === 6){   // 가르마펌: 가운데 가르마 + 양옆 S자 컬 앞머리
      // 가운데 가르마 양옆으로 S자(쉼표 모양) 컬이 흘러내리고, 가운데 이마가 세로로 살짝 드러남
      const geos = []; crown(0.5, 0.075, geos);
      for (const s of [-1,1]){
        const o = s*0.07;   // 가르마 틈: 가운데에서 이만큼 비움
        [[0, 0.72, 0.95], [0.26, 0.7, 0.85], [0.55, 0.6, 0.75]].forEach(([y0, p0, k]) => {
          const Y = v => o + s*(y0 + v*k);   // 가르마 쪽에서 바깥으로
          chain([onHair(Y(0.02), p0 + 0.12), onHair(Y(0.12), p0 - 0.1), onHair(Y(0.34), p0 - 0.26),
                 onHair(Y(0.42), p0 - 0.42), onHair(Y(0.3), p0 - 0.52), onHair(Y(0.18), p0 - 0.47)],
                12, 0.05, 0.034, 0, geos);   // 아래로 내려가며 바깥으로 휘었다가 안쪽으로 말려 들어감
        });
      }
      head.add(new THREE.Mesh(mergeGeometries(geos), M(hair))); geos.forEach(g => g.dispose());
    }
    if (spec.style === 7){   // 장발 가르마: 머리를 감싼 한 장의 면. 가운데 가르마에서 양쪽 앞머리가 쉼표 모양으로 휘어 이마가 드러나고, 옆·뒤는 어깨까지 내려옴
      const NU = 48, NH = 16, ND = 8, P0 = -0.15, yB = 0.52;
      // 얼굴 구멍의 반폭(가로 각도)을 높이(pitch)별로: 가르마에서 좁게 시작 → 관자놀이 쪽으로 벌어짐 → 광대에서 안으로 말림(쉼표 꼬리) → 다시 벌어짐
      const W = [[1.2,0],[0.95,0.03],[0.75,0.07],[0.55,0.15],[0.38,0.24],[0.24,0.32],[0.12,0.44],[0.04,0.62],[-0.02,0.84],[-0.08,0.78],[P0,0.92]];   // 앞머리가 눈썹 위까지 내려와 ㅅ자로 이마를 열고, 눈 높이에서 바깥으로 말림
      const holeW = pt => { if (pt >= W[0][0]) return 0; for (let k=1;k<W.length;k++) if (pt >= W[k][0]){ const [a,wa] = W[k-1], [b,wb] = W[k]; return wb + (wa - wb)*(pt - b)/(a - b); } return W[W.length-1][1]; };
      const curlOf = (pt, yaw) => {   // 앞머리 끝(구멍 가장자리) 가까울수록 1
        const near = Math.abs(yaw) - holeW(pt);
        return (Math.abs(yaw) < 1.3 && pt > -0.12 && pt < 0.75 && near >= 0) ? Math.max(0, 1 - near/0.4)*Math.min(1, (0.75 - pt)/0.3) : 0; };
      const kOf = (pt, yaw=Math.PI) => 1.09 + 0.07*Math.max(0, pt) + 0.13*curlOf(pt, yaw);   // 정수리 볼륨 + 앞머리 끝을 얼굴에서 띄움
      const hairPt = (yaw, pt) => { const c = curlOf(pt, yaw), q = onHair(yaw, pt, kOf(pt, yaw));   // 끝으로 갈수록 앞·위로 말려 올라감
        return q.add(new V3(Math.sign(yaw)*0.015*c*c, 0.04*c*c*c, 0.035*c*c)); };
      const P = [], Q = [];   // 꼭짓점 위치와 (yaw, pitch 또는 아래로 내려온 정도)
      for (let a=0; a<=NU; a++){
        const yaw = -Math.PI + a*2*Math.PI/NU;
        for (let b=0; b<=NH + ND; b++){
          if (b <= NH){ const pt0 = Math.PI/2 - (Math.PI/2 - P0)*b/NH, inH = Math.abs(yaw) < holeW(pt0), pt = inH ? liftOut((y, p) => Math.abs(y) < holeW(p), yaw, pt0) : pt0; P.push(hairPt(yaw, pt)); Q.push([yaw, pt, 0, inH]); }
          else { const t = (b - NH)/ND, e = onHair(yaw, P0, kOf(P0, yaw)), fl = 1 + 0.16*t + 0.025*Math.sin(yaw*9)*t;   // 아래로: 어깨 쪽으로 살짝 퍼지고 결이 생김
                 const len = 0.6;   // 옆·뒤 모두 목덜미 근처까지만 (뒤통수는 덮음)
                 P.push(new V3(e.x*fl, e.y + (yB - e.y)*t*len, e.z*fl - 0.03*t)); Q.push([yaw, P0, t]); }
        }
      }
      const pos = [], R = NH + ND + 1;
      for (let a=0; a<NU; a++) for (let b=0; b<NH + ND; b++){
        const q = [a*R + b, a*R + b + 1, (a+1)*R + b + 1, (a+1)*R + b];
        const cy = (Q[q[0]][0] + Q[q[2]][0])/2, cp = (Q[q[0]][1] + Q[q[2]][1])/2, ct = (Q[q[0]][2] + Q[q[2]][2])/2;
        if (ct === 0 && q.filter(k => Q[k][3]).length >= 3) continue;              // 얼굴·이마 구멍(쉼표 앞머리): 네 꼭짓점이 모두 구멍 안일 때만 버림 (가장자리는 경계선으로 끌어올려 매끈하게)
        if (ct > 0 && Math.abs(cy) < 1.2) continue;                      // 앞쪽(얼굴·가슴 앞)으로는 내려오지 않음
        for (const k of [0,1,2, 0,2,3]) pos.push(P[q[k]].x, P[q[k]].y, P[q[k]].z);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, M(hair)));
      // (안쪽 면은 얼굴 가장자리에서 머리 표면과 겹쳐 깜빡여서 뺌. 면은 양면이라 두께 없이도 비지 않음)
      { // 머리 속 바탕: 가르마·얼굴 자리만 비우고 머리색으로 채워 틈으로 두피가 비치지 않게
        const ug = new THREE.SphereGeometry(1, 72, 28).toNonIndexed(), up = ug.attributes.position, keep = [];
        for (let t=0; t<up.count; t+=3){ let cx=0, cy=0, cz=0; for (let k=0;k<3;k++){ cx += up.getX(t+k); cy += up.getY(t+k); cz += up.getZ(t+k); }
          const yaw = Math.atan2(cx, cz), pt = Math.asin(Math.max(-1, Math.min(1, cy/3)));
          if (Math.abs(yaw) < holeW(pt) + 0.02 || pt < P0) continue;
          for (let k=0;k<3;k++) keep.push(up.getX(t+k), up.getY(t+k), up.getZ(t+k)); }
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); g2.computeVertexNormals();
        const under = new THREE.Mesh(g2, M(hair)); under.position.copy(HEAD_C); under.scale.copy(HEAD_R).multiplyScalar(1.015); head.add(under); }
    }
    if (spec.style === 8){   // 히메컷: 일자 앞머리 + 볼 옆에서 일자로 끊긴 옆머리 + 길고 곧은 뒷머리
      for (let i=-4; i<=4; i++){   // 일자 앞머리: 눈썹 높이에서 끝이 가지런한 판들
        const yaw = i*0.17, top = onHair(yaw, 0.62, 1.05), bot = onHair(yaw, 0.2, 1.08);
        const b = limb(top, bot, 0.042, hair); b.scale.set(1.35, 1, 0.55); head.add(b);
      }
      for (const s of [-1,1]){
        const a = onHair(s*0.9, 0.3, 1.06), b = onHair(s*0.95, -0.55, 1.1);   // 옆머리: 턱선에서 일자로
        const side = limb(a, b, 0.045, hair); side.scale.set(1.2, 1, 0.6); head.add(side);
        const back = limb(onHair(s*1.6, 0.4, 1.04), new V3(s*0.3, 0.5, -0.12), 0.07, hair); back.scale.z = 0.7; head.add(back);
      }
      head.add(mesh(new THREE.SphereGeometry(1, 8, 6), hair, [0, 0.76, -0.15], [0.1,0,0], [0.38, 0.5, 0.2]));
    }
    if (spec.style === 9){   // 장발 웨이브: 둥근 사각형 실루엣의 머리 덩어리 + 곡면에 물결 + 얼굴 자리는 열어 둠
      const geos = []; crown(0.4, 0.075, geos);
      chain([onHair(-0.75, 0.3), onHair(-0.3, 0.45), onHair(0.1, 0.38), onHair(0.5, 0.44), onHair(0.8, 0.28)], 12, 0.055, 0.055, 0.015, geos);
      head.add(new THREE.Mesh(mergeGeometries(geos), M(hair))); geos.forEach(g => g.dispose());
      const vol = new THREE.SphereGeometry(1, 22, 16).toNonIndexed(), pa = vol.attributes.position, v = new V3();
      const C = new V3(0, 0.8, -0.07), S = new V3(0.43, 0.5, 0.3), sq = n => Math.sign(n)*Math.pow(Math.abs(n), 0.55);   // 지수 < 1: 둥근 사각형
      for (let i=0;i<pa.count;i++){
        v.fromBufferAttribute(pa, i);
        const x = sq(v.x), y = sq(v.y), z = v.z;
        const wave = 1 + 0.09*Math.sin(y*14 + Math.atan2(v.x, v.z)*2) * (y < 0.4 ? 1 : 0.3);   // 아래로 갈수록 물결
        const wy = C.y + y*S.y, press = 1 - ((spec.acc || {}).hp ? 0.22 : 0.2)*THREE.MathUtils.smoothstep(wy, 0.62, 0.95);   // 눈 높이 옆머리를 늘 차분하게 눌러 둠(헤드폰을 쓰면 조금 더)
        pa.setXYZ(i, C.x + x*S.x*wave*press, wy, C.z + z*S.z*wave);
      }
      // 얼굴 앞 구멍: 얼굴 높이에서 앞쪽 삼각형은 버림
      const keep = [];
      for (let t=0; t<pa.count; t+=3){
        let cx=0, cy=0, cz=0; for (let k=0;k<3;k++){ cx += pa.getX(t+k)/3; cy += pa.getY(t+k)/3; cz += pa.getZ(t+k)/3; }
        const face = (cz > C.z && Math.abs(cx) < 0.29 && cy > 0.62 && cy < HEAD_C.y + 0.2) || (cy <= 0.62 && cz > 0.02 && Math.abs(cx) < 0.36) || (cy <= 0.62 && cz > 0.1);   // 얼굴 자리 + 턱 아래 앞쪽(손·꽃 앞) + 어깨 앞으로 튀어나온 판만 버림
        if (!face) for (let k=0;k<3;k++) keep.push(pa.getX(t+k), pa.getY(t+k), pa.getZ(t+k));
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, M(hair))); vol.dispose();
    }
    // 머리를 감싸는 면 한 장(격자) + 안쪽 면. bottom(yaw): 아랫단 높이, hole(yaw, pitch): 비울 곳, at(yaw, pitch): 꼭짓점 자리
    const capMesh = (bottom, hole, at, NU=56, NH=18, col=hair, inner=true) => {
      const P = [], Q = [], R = NH + 1;
      for (let a=0; a<=NU; a++){ const yaw = -Math.PI + a*2*Math.PI/NU;
        for (let b=0; b<=NH; b++){ const pt0 = Math.PI/2 - (Math.PI/2 - bottom(yaw))*b/NH, inH = hole(yaw, pt0), pt = inH ? liftOut(hole, yaw, pt0) : pt0; P.push(at(yaw, pt)); Q.push([yaw, pt, inH]); } }
      const pos = [];
      for (let a=0; a<NU; a++) for (let b=0; b<NH; b++){
        const q = [a*R + b, a*R + b + 1, (a+1)*R + b + 1, (a+1)*R + b];
        if (q.filter(k => Q[k][2]).length >= 3) continue;   // 구멍 쪽으로 납작해진 가는 조각은 버림 (깜빡이는 점 방지)
        for (const k of [0,1,2, 0,2,3]) pos.push(P[q[k]].x, P[q[k]].y, P[q[k]].z);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, M(col)));
      if (!inner) return;
      const gi = g.clone(), pi = gi.attributes.position;   // 안쪽 면: 끝단 두께
      for (let i=0;i<pi.count;i++) pi.setXYZ(i, pi.getX(i)*0.96, HEAD_C.y + (pi.getY(i) - HEAD_C.y)*0.97, pi.getZ(i)*0.96);
      gi.computeVertexNormals(); head.add(new THREE.Mesh(gi, M(col)));
    };
    const strand = (pts, r, flat=0.55) => {   // 가는 머리카락 가닥: 곡선을 따라 납작한 관
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, r, 4, false), pa = g.attributes.position;
      head.add(new THREE.Mesh(g, M(hair))); return g;
    };
    if (spec.style === 14){   // 반삭: 머리에 바짝 붙은 아주 짧은 머리. 색은 머리색에 피부가 비치는 느낌으로 섞음
      const buzz = '#' + new THREE.Color(hair).lerp(new THREE.Color(skin), 0.22).getHexString();
      const hairline = yaw => { const a = Math.abs(yaw); return a < 1.3 ? 0.5 - 0.14*Math.pow(a/1.3, 2) : a < 1.85 ? 0.1 : -9; };
      capMesh(yaw => THREE.MathUtils.lerp(-0.1, -0.9, THREE.MathUtils.smoothstep(Math.abs(yaw), 1.5, 2.1)),
        (yaw, pt) => pt < hairline(yaw), (yaw, pt) => onHair(yaw, pt, 1.03), 40, 14, buzz, false);   // 머리에 너무 붙으면 겹쳐 깜빡여서 조금 띄움, 안쪽 면 없음
    }
    if (spec.style === 11){   // 묶음 애교머리: 이마를 깨끗이 드러내고 뒤로 넘겨 낮게 묶은 머리 + 옆 가르마 + 관자놀이에서 흘러내린 애교머리
      const hairline = yaw => { const a = Math.abs(yaw); return a < 1.25 ? 0.6 - 0.24*Math.pow(a/1.25, 2) : a < 1.7 ? 0.22 : -9; };
      capMesh(yaw => THREE.MathUtils.lerp(-0.12, -1.0, THREE.MathUtils.smoothstep(Math.abs(yaw), 1.4, 2.6)),
        (yaw, pt) => pt < hairline(yaw),
        (yaw, pt) => onHair(yaw, pt, 1.045 + 0.05*Math.max(0, pt) - (pt > 0.55 ? 0.018*Math.exp(-Math.pow((yaw - 0.32)/0.07, 2)) : 0)));   // 매끈하게 붙고, 왼쪽 가르마 자리만 살짝 파임
      const bun = onHair(Math.PI, -0.45, 1.3);   // 뒤통수 아래 낮게 묶은 똥머리
      head.add(mesh(new THREE.IcosahedronGeometry(0.12, 1), hair, bun.toArray(), [0.3,0,0], [1.1, 0.9, 0.85]));
      head.add(mesh(new THREE.TorusGeometry(0.07, 0.018, 4, 10), shade(hair, -0.2), onHair(Math.PI, -0.42, 1.12).toArray(), [0,0,0], [1, 0.85, 1]));
      for (const s of [-1,1]){   // 애교머리: 관자놀이에서 볼 옆으로 S자로 흘러내려 턱선 근처에서 끝남. 가르마 쪽(왼쪽)이 조금 더 길고 풍성
        const L = s < 0 ? 1 : 0.85;
        strand([onHair(s*0.95, 0.42, 1.06), onHair(s*1.0, 0.18, 1.12), onHair(s*0.92, -0.08, 1.14), onHair(s*0.98, -0.32*L, 1.12), onHair(s*0.9, -0.5*L, 1.1)], 0.02);
        strand([onHair(s*0.8, 0.45, 1.06), onHair(s*0.78, 0.25, 1.1), onHair(s*0.84, 0.02, 1.12), onHair(s*0.8, -0.2*L, 1.1)], 0.014);
      }
    }
    if (spec.style === 12){   // 올린 컬: 옆·뒤는 짧게 붙이고, 앞머리를 위로 올려 이마를 드러낸 뒤 정수리에서 한쪽으로 넘어가는 컬
      const hairline = yaw => { const a = Math.abs(yaw); return a < 1.3 ? 0.46 - 0.14*Math.pow(a/1.3, 2) : a < 1.85 ? 0.14 : -9; };
      const lift = (yaw, pt) => THREE.MathUtils.smoothstep(pt, 0.1, 0.85) * (0.45 + 0.55*Math.max(0, Math.cos(yaw)));   // 앞·위일수록 크게 올림
      capMesh(yaw => THREE.MathUtils.lerp(-0.05, -0.95, THREE.MathUtils.smoothstep(Math.abs(yaw), 1.5, 2.1)),
        (yaw, pt) => pt < hairline(yaw),
        (yaw, pt) => { const v = lift(yaw, pt), wav = 0.03*v*Math.sin(yaw*9 + pt*7);   // 위쪽 결
          return onHair(yaw, pt, 1.035 + 0.34*v + wav).add(new V3(0.05*v, 0.05*v, 0.05*v*Math.max(0, Math.cos(yaw)))); });
      // 컬: 올린 머리 위에 오른쪽으로 넘어가며 말린 고리들
      [[-0.45,0.95],[-0.1,1.05],[0.25,1.0],[0.55,0.85],[-0.3,0.7],[0.1,0.72],[0.45,0.6],[0.8,0.55]].forEach(([yaw, pt], i) => {
        const v = lift(yaw, pt), c = onHair(yaw, pt, 1.035 + 0.34*v + 0.005).add(new V3(0.05*v, 0.05*v, 0.05*v*Math.max(0, Math.cos(yaw))));
        const t = mesh(new THREE.TorusGeometry(0.05 + 0.012*(i%3), 0.02, 4, 8, Math.PI*1.4), hair, c.toArray());
        t.lookAt(c.clone().add(dirOf(yaw, pt))); t.rotateZ(i*1.1 + 0.5);   // 표면에 눕힌 소용돌이 컬
        head.add(t);
      });
    }
    if (spec.style === 13){   // 긴 옆가르마: 왼쪽 옆 가르마에서 양쪽으로 넘긴 긴 생머리. 이마는 넓게 드러나고, 넘긴 쪽(오른쪽)이 관자놀이를 조금 덮으며, 옆머리는 어깨 앞으로 길게
      const NU = 56, NH = 18, ND = 10, P0 = -0.15, yB = 0.3, PART = 0.42;
      const ss = THREE.MathUtils.smoothstep;
      const top = yaw => Math.abs(yaw - PART) < 0.055 ? 0.92                                  // 가르마 선: 정수리까지 살짝 갈라짐
        : yaw < PART ? 0.66 - 0.34*ss(-yaw, 0.15, 0.8)   // 넘긴 쪽: 관자놀이로 갈수록 머리선이 내려옴
        : 0.66 - 0.16*ss(yaw, 0.45, 0.95);
      const hole = (yaw, pt, t) => t === 0 ? (pt < top(yaw) && Math.abs(yaw) < 0.88) : Math.abs(yaw) < 0.85;
      const vol = (yaw, pt) => {   // 넘긴 쪽: 가르마 바로 옆에서 크게 솟아 바깥으로 갈수록 내려감 → 가르마 선에 높이 차이. 반대쪽은 납작하게
        const d = PART - yaw, up = ss(pt, 0.25, 0.95);
        const swept = d > 0 ? 0.3*up*ss(d, 0.0, 0.18)*(1 - 0.6*ss(d, 0.5, 1.6)) : 0;
        const flat = d < 0 ? -0.02*up*(1 - ss(-d, 0.0, 0.5)) : 0;
        return 1.12 + 0.07*Math.max(0, pt) + swept + flat; };   // 전체 볼륨을 키워 두께감
      const P = [], Q = [], R = NH + ND + 1;
      for (let a=0; a<=NU; a++){ const yaw = -Math.PI + a*2*Math.PI/NU;
        for (let b=0; b<=NH + ND; b++){
          if (b <= NH){ const pt0 = Math.PI/2 - (Math.PI/2 - P0)*b/NH, inH = hole(yaw, pt0, 0), pt = inH ? liftOut((y, p) => hole(y, p, 0), yaw, pt0) : pt0; P.push(onHair(yaw, pt, vol(yaw, pt))); Q.push([yaw, pt, 0, inH]); }
          else { const t = (b - NH)/ND, e = onHair(yaw, P0, vol(yaw, P0)), fl = 1 + 0.12*t;   // 곧게 내려오며 어깨 위로 살짝 퍼짐
                 const front = Math.max(0, Math.cos(yaw));   // 앞쪽 옆머리는 어깨 앞으로 조금 더 앞으로
                 P.push(new V3(e.x*fl, e.y + (yB - e.y)*t, e.z*fl + 0.06*t*front - 0.02*t)); Q.push([yaw, P0, t]); }
        }
      }
      const pos = [];
      for (let a=0; a<NU; a++) for (let b=0; b<NH + ND; b++){
        const q = [a*R + b, a*R + b + 1, (a+1)*R + b + 1, (a+1)*R + b];
        const ct = (Q[q[0]][2] + Q[q[2]][2])/2;
        if (ct === 0 ? q.filter(k => Q[k][3]).length >= 3 : hole((Q[q[0]][0] + Q[q[2]][0])/2, 0, ct)) continue;
        for (const k of [0,1,2, 0,2,3]) pos.push(P[q[k]].x, P[q[k]].y, P[q[k]].z);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, M(hair)));
      const gi = g.clone(), pi = gi.attributes.position;
      for (let i=0;i<pi.count;i++) pi.setXYZ(i, pi.getX(i)*0.95, HEAD_C.y + (pi.getY(i) - HEAD_C.y)*0.97, pi.getZ(i)*0.95);
      gi.computeVertexNormals(); head.add(new THREE.Mesh(gi, M(hair)));
      // 머리 속 바탕: 가르마 선만 빼고 두피가 비치지 않게 안쪽을 머리색으로 채움
      const under = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 28), M(hair)); under.position.copy(HEAD_C); under.scale.copy(HEAD_R).multiplyScalar(1.015);
      { const pa = under.geometry.attributes.position, v = new V3(), keep = [];
        const ug = under.geometry.toNonIndexed(), up = ug.attributes.position;
        for (let t=0; t<up.count; t+=3){ let cx=0, cy=0, cz=0; for (let k=0;k<3;k++){ cx += up.getX(t+k); cy += up.getY(t+k); cz += up.getZ(t+k); }
          const yaw = Math.atan2(cx, cz), pt = Math.asin(Math.max(-1, Math.min(1, cy/3/1))) ;
          if (hole(yaw, pt, 0) || pt < P0) continue;   // 얼굴·가르마 자리는 비움
          for (let k=0;k<3;k++) keep.push(up.getX(t+k), up.getY(t+k), up.getZ(t+k)); }
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3)); g2.computeVertexNormals(); under.geometry = g2; }
      head.add(under);
    }
    if (spec.style === 10){   // 땋은머리: 귀 뒤에서 시작해 어깨 앞으로 내려오는 두 갈래, 끝은 머리끈과 술
      for (const s of [-1,1]){
        const cv = new THREE.CatmullRomCurve3([onHair(s*1.25, -0.05, 1.05), new V3(s*0.3, 0.74, 0.02), new V3(s*0.25, 0.58, 0.16), new V3(s*0.2, 0.46, 0.24)]);
        const geos = [], n = 11;
        for (let i=0; i<n; i++){   // 땋은 마디: 좌우로 번갈아 비켜 놓은 납작한 알
          const t = i/(n-1), p = cv.getPoint(t), tan = cv.getTangent(t), side = new V3().crossVectors(tan, new V3(0,0,1)).normalize();
          p.addScaledVector(side, (i % 2 ? 1 : -1)*0.014);
          const g = new THREE.IcosahedronGeometry(0.045 - 0.012*t, 1); g.scale(1, 1.25, 0.8); g.rotateZ((i % 2 ? 1 : -1)*0.5); g.translate(p.x, p.y, p.z); geos.push(g);
        }
        head.add(new THREE.Mesh(mergeGeometries(geos), M(hair))); geos.forEach(g => g.dispose());
        const endP = cv.getPoint(1);
        head.add(mesh(new THREE.TorusGeometry(0.022, 0.01, 4, 8), '#e86f7f', [endP.x, endP.y - 0.02, endP.z], [Math.PI/2, 0, 0]));
        head.add(mesh(new THREE.ConeGeometry(0.025, 0.06, 5), hair, [endP.x, endP.y - 0.06, endP.z], [Math.PI, 0, 0]));
      }
    }
    if (spec.style === 4){   // 장발: 뒤로 길게 내려오는 머리 + 어깨에 닿는 옆머리
      head.add(mesh(new THREE.SphereGeometry(1, 8, 6), hair, [0, 0.8, -0.15], [0.12,0,0], [0.36, 0.44, 0.19]));
      for (const s of [-1,1]){
        const a = toHead(new V3(s*0.96, 0.2, -0.05)), b = new V3(s*0.28, 0.6, -0.01);
        const lock = limb(a, b, 0.065, hair); lock.scale.z = 0.55; head.add(lock);
      }
    }
    // 네모 머리(로봇·TV·핸드폰)와 원통 머리(물뿌리개): 둥근 머리에 맞춰 만든 머리카락을 그 모양 표면으로 옮김
    if (BOXY || K === 'can') hairToShape(head, hair0, BOXY ? [BOXY[0]/2, BOXY[1]/2, BOXY[2]/2] : [0.31, 0.23, 0.31], K === 'can', hatOn);
    if (isH){
    if ((spec.nose ?? 0) > 0.02){   // 코: 끝이 둥근 원기둥, 슬라이더로 0(없음)부터 크게
      const n = spec.nose, r = 0.012 + 0.03*n, L = 0.004 + 0.035*n;
      const g = face(new THREE.Group(), 0, -0.1, 0.0);
      g.add(mesh(new THREE.CapsuleGeometry(r, L, 2, 6), shade(skin, -0.03), [0, 0, r*0.55 + L*0.3], [Math.PI/2, 0, 0]));
      head.add(g);
    }
    if (spec.beard){   // 턱수염: 귀(구레나룻)부터 턱 아래까지 얼굴 표면을 따라 덮는 면. 1 짧게(얇은 면), 2 길게(두툼한 면 + 턱 아래로 늘어짐)
      const long = spec.beard === 2, mp = -0.42 + (spec.mouthY ?? 0.5)*0.24;   // 입 높이: 수염 윗선은 입 아래
      const NU = 28, NV = 6, pos = [], idx = [];
      for (let a=0; a<=NU; a++){
        const yaw = -1.55 + a*3.1/NU, e = Math.abs(yaw)/1.55;
        const top = e < 0.8 ? THREE.MathUtils.lerp(mp - 0.12, -0.5, e/0.8) : THREE.MathUtils.lerp(-0.5, 0.1, (e - 0.8)/0.2), bot = THREE.MathUtils.lerp(-1.12, -0.55, e*e);   // 턱선 띠 → 귀 앞에서 구레나룻으로 올라감
        for (let b=0; b<=NV; b++){
          const v = b/NV, out = 0.004 + (long ? 0.03 : 0.004)*Math.sin(v*Math.PI)*(1 - 0.5*e);
          const { p } = surf(yaw, THREE.MathUtils.lerp(top, bot, v), out); pos.push(p.x, p.y, p.z);
        }
      }
      for (let a=0; a<NU; a++) for (let b=0; b<NV; b++){ const q = a*(NV+1) + b; idx.push(q, q+1, q+NV+1, q+1, q+NV+2, q+NV+1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, M(shade(hair, 0.04))));
      if (long){ const { p } = surf(0, -0.8, 0.0); head.add(mesh(new THREE.ConeGeometry(0.15, 0.2, 7), hair, [p.x, p.y - 0.06, p.z - 0.02], [Math.PI, 0, 0], [1, 1, 0.6])); }   // 턱 아래로 뾰족하게
    }
    }
    if ([5,7,11,12,13,14].includes(spec.style) && !(K === 'phone')){   // 이마를 드러낸 머리: 간단한 눈썹. 높이는 슬라이더로
      const pb = 0.16 + 0.07*eyeSc + ((spec.browY ?? 0.5) - 0.5)*0.24;
      for (const s of [-1,1]){ const g = face(new THREE.Group(), s*0.36, pb, 0.006); g.add(mesh(new THREE.CapsuleGeometry(0.011, 0.06, 2, 5), shade(hair, -0.05), [0,0,0], [0, 0, Math.PI/2 - s*0.12], [1, 1, 0.5])); head.add(g); }
    }
    if (isH){
    if (spec.mst){   // 콧수염: 입 위에 양쪽으로 갈라지는 두 가닥
      const g = face(new THREE.Group(), 0, -0.13, 0.014);
      for (const s of [-1,1]) g.add(mesh(new THREE.CapsuleGeometry(0.016, 0.05, 2, 5), hair, [s*0.033, -0.006, 0], [0, 0, s*(Math.PI/2 - 0.3)]));
      head.add(g);
    }
    if (spec.mole){   // 점: 좌우·위아래 슬라이더로 얼굴 위 자리를 정함
      head.add(face(mesh(new THREE.SphereGeometry(0.014, 5, 3), '#4a3228', [0,0,0], [0,0,0], [1,1,0.4]), ((spec.mx ?? 0.7)*2 - 1)*0.75, -0.45 + (spec.my ?? 0.4)*0.8, 0.003));
    }
    // 입: 위아래 위치(코 아래 ~ 턱 위)와 좌우 길이를 슬라이더로
    const mouth = onHead(new THREE.Group(), 0, -0.42 + (spec.mouthY ?? 0.5)*0.24, 0.005); mouth.scale.x = Math.pow(2, ((spec.mouthW ?? 0.5) - 0.5)*1.6); const lipC = [INK, '#' + new THREE.Color(skin).lerp(new THREE.Color('#8a4a46'), 0.65).getHexString(), '#c8323c', '#e8768f'][spec.lip || 0];   // 입술 색: 검정, 피부보다 짙은 색, 빨강, 분홍
    mouth.add(mesh(new THREE.TorusGeometry(0.035, (spec.lip || 0) ? 0.012 : 0.009, 3, 6, Math.PI), lipC, [0,0,0], [0,0,Math.PI])); head.add(mouth);
    root.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 4, 10), '#f7f3ea', [0,0.68,0], [Math.PI/2 - 0.15,0,0]));
    }
  }
  // 모자 속 정리: 테두리보다 위로 올라간 머리카락 꼭짓점을 테두리 높이로 눌러 내림(삼각형을 지우지 않아 틈이 안 생김).
  // 눌린 머리카락이 가장 넓게 퍼진 반지름을 재서, 모자 테두리 띠를 그만큼 넓혀 머리 윗단을 덮음
  let hairEdgeR = 0;
  if (hatOn && (isH || animalHair) && !BOXY && K !== 'can'){
    const hairMat = M(PALETTE.human.hair[spec.hair ?? 0]), inv = new THREE.Matrix4(), mm = new THREE.Matrix4(), mi = new THREE.Matrix4(), v = new V3();
    head.updateMatrixWorld(true); inv.copy(head.matrixWorld).invert();
    const cutY = HEAD_C.y + brimY + 0.012, zr = hatR.x/hatR.z;
    head.traverse(o => {
      if (!o.isMesh || o.material !== hairMat) return;
      mm.multiplyMatrices(inv, o.matrixWorld); mi.copy(mm).invert();
      const pa = o.geometry.attributes.position;
      for (let i=0; i<pa.count; i++){
        v.fromBufferAttribute(pa, i).applyMatrix4(mm);
        if (v.y < cutY - 0.03) continue;
        hairEdgeR = Math.max(hairEdgeR, Math.hypot(v.x, (v.z - HEAD_C.z)*zr));
        if (v.y > cutY){ v.y = cutY; v.applyMatrix4(mi); pa.setXYZ(i, v.x, v.y, v.z); }
      }
      pa.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere();
    });
  }
  if (hatOn && (robot || ['giraffe','bird','fish'].includes(K))) ears.slice(0, K === 'giraffe' ? 99 : 1).forEach((e, i) => { if (K !== 'giraffe' || i % 2 === 0) e.visible = false; });   // 안테나·뿔·볏·등지느러미는 모자 속으로
  // ---------- 악세서리 (여러 개 동시에. 이어폰/헤드폰, 안경 3종은 하나씩만) ----------
  if (spec.glasses && !spec.acc) spec.acc = { g1:1 };   // 예전 데이터의 안경
  const acc = spec.acc || {}, accC = k => PALETTE.acc[(spec.accC || {})[k] ?? ACC_DEFAULT[k]];
  const sideX = BOXY ? BOXY[0]/2 + 0.02 : K === 'can' ? 0.33 : 0.335, lensSc = Math.max(1, eyeSc*0.92);
  const glass = (c, op) => snappable(new THREE.MeshStandardMaterial({ color:c, transparent:true, opacity:op, depthWrite:false, roughness:0.2, side:THREE.DoubleSide }));
  if (acc.g1){   // 동그란 안경
    const c = accC('g1');
    for (const s of [-1,1]){ const ring = face(mesh(new THREE.TorusGeometry(0.068, 0.011, 4, 8), c), s*0.36, 0.0, 0.03); ring.scale.setScalar(lensSc); head.add(ring); }
    head.add(face(mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), c), 0, 0.02, 0.04));
  }
  if (acc.g2 || acc.sg){   // 무테 사각 안경(옅은 색 렌즈) / 선글라스(진한 렌즈 + 윗테)
    const sun = !!acc.sg, c = accC(sun ? 'sg' : 'g2'), lensM = glass(c, sun ? 0.88 : 0.3);
    for (const s of [-1,1]){
      const g = face(new THREE.Group(), s*0.36, 0.0, 0.035); g.scale.setScalar(lensSc);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(sun ? 0.15 : 0.13, sun ? 0.105 : 0.095, 0.004), lensM); lens.renderOrder = 5; g.add(lens);
      if (sun) g.add(mesh(new THREE.BoxGeometry(0.155, 0.014, 0.012), '#2a2422', [0, 0.055, 0]));
      head.add(g);
    }
    head.add(face(mesh(new THREE.BoxGeometry(0.09, 0.008, 0.008), sun ? '#2a2422' : '#b9b2a8'), 0, 0.02, 0.045));
  }
  if (!acc.hp && acc.ep){   // 이어폰: 귀 자리에 작은 알 + 아래로 내려오는 대
    const c = accC('ep');
    for (const s of [-1,1]){
      head.add(mesh(new THREE.IcosahedronGeometry(0.03, 1), c, [s*(sideX + 0.01), HEAD_C.y - 0.06, 0.05]));
      head.add(mesh(new THREE.CapsuleGeometry(0.009, 0.06, 2, 4), c, [s*(sideX + 0.012), HEAD_C.y - 0.12, 0.055]));
    }
  }
  let hatTop = null;   // 모자 꼭대기 높이(헤드폰이 그 위로 넘어가게)
  if (hatOn && robot){   // 로봇: 네모 머리에 맞춘 네모 모자
    const [W, H, D] = BOXY, c = accC(acc.cap ? 'cap' : 'hat'), top = HEAD_C.y + H/2, g = new THREE.Group(); g.position.set(0, top, 0);
    if (acc.cap){
      g.add(mesh(new THREE.BoxGeometry(W + 0.04, 0.13, D + 0.04), c, [0, 0.0, -0.005]));                     // 정수리
      g.add(mesh(new THREE.BoxGeometry(W + 0.05, 0.045, D + 0.05), shade(c, -0.08), [0, -0.055, -0.005]));   // 테두리 띠
      g.add(mesh(new THREE.BoxGeometry(Math.min(0.5, W*0.9), 0.02, 0.2), shade(c, -0.06), [0, -0.07, D/2 + 0.1], [0.1, 0, 0])); // 챙
      g.add(mesh(new THREE.BoxGeometry(0.05, 0.03, 0.05), shade(c, -0.12), [0, 0.08, 0]));            // 단추
      hatTop = top + 0.095;
    } else {
      g.add(mesh(new THREE.BoxGeometry(W + 0.04, 0.16, D + 0.04), c, [0, 0.03, 0]));
      g.add(mesh(new THREE.BoxGeometry(W + 0.07, 0.07, D + 0.07), shade(c, -0.08), [0, -0.06, 0]));            // 접힌 단
      if (!acc.hp) g.add(mesh(new THREE.IcosahedronGeometry(0.06, 1), shade(c, 0.12), [0, 0.15, 0]));
      hatTop = top + 0.11;
    }
    head.add(g);
  } else if (hatOn){
    // 두께 있는 정수리: 바깥 면 + 조금 작은 안쪽 면(어둡게). 면을 잘게 나눠 머리 표면이 면 사이로 비치지 않게
    const dome = c => {
      head.add(mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI*2, 0, HAT.th), c, [0, HEAD_C.y + HAT.off, 0], [0,0,0], hatR.toArray()));
      head.add(mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI*2, 0, HAT.th), shade(c, -0.15), [0, HEAD_C.y + HAT.off, 0], [0,0,0], hatR.clone().multiplyScalar(0.94).toArray()));
    };
    const bandR = Math.max(brimR, hairEdgeR + 0.008);   // 머리카락이 테두리보다 넓으면 띠도 넓게
    const band = (c, tube) => mesh(new THREE.TorusGeometry(bandR, tube, 5, 18), c, [0, HEAD_C.y + brimY, 0], [Math.PI/2, 0, 0], [1, hatR.z/hatR.x, 1]);
    if (acc.hat){   // 니트 비니: 정수리 + 두꺼운 접힌 단 + 방울
      const c = accC('hat');
      dome(c);
      head.add(band(shade(c, -0.08), 0.055));
      if (!acc.hp) head.add(mesh(new THREE.IcosahedronGeometry(0.065, 1), shade(c, 0.12), [0, HEAD_C.y + HAT.off + hatR.y + 0.04, 0]));
    } else {        // 캡모자: 정수리 + 테두리 띠 + 앞으로 뻗은 챙 + 단추
      const c = accC('cap');
      dome(c);
      head.add(band(shade(c, -0.05), 0.035));
      head.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.016, 10, 1, false, -Math.PI/2, Math.PI), shade(c, -0.06), [0, HEAD_C.y + brimY - 0.01, brimR*hatR.z/hatR.x - 0.05], [0.28, 0, 0], [1.05, 1, 1.35]));   // 챙을 살짝 아래로 꺾어 정면에서도 보이게
      head.add(mesh(new THREE.IcosahedronGeometry(0.025, 0), shade(c, -0.1), [0, HEAD_C.y + HAT.off + hatR.y + 0.005, 0]));
    }
    hatTop = HEAD_C.y + HAT.off + hatR.y;
  }
  if (acc.hp){   // 헤드폰: 모자를 쓰면 모자 위로 넘어가게 밴드를 키움
    const c = accC('hp'), cy = HEAD_C.y - 0.03, rad = sideX + 0.03 + (hatOn ? 0.03 : 0);
    const need = hatTop != null ? (hatTop + 0.035 - cy)/rad : 1;   // 밴드 꼭대기가 모자 위로
    const bandM = mesh(new THREE.TorusGeometry(rad, 0.022, 4, 14, Math.PI), c, [0, cy, -0.02], [0,0,0], [1, Math.max(1, need), 1]); head.add(bandM);
    for (const s of [-1,1]){
      head.add(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 8), c, [s*rad, HEAD_C.y - 0.04, -0.02], [0, 0, Math.PI/2]));
      head.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), shade(c, -0.25), [s*(rad - 0.035), HEAD_C.y - 0.04, -0.02], [0, 0, Math.PI/2]));
    }
  }
  if (acc.rd){   // 루돌프: 빛나는 빨간 코 + 갈래 뿔(모자를 써도 모자 옆으로 솟음)
    const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 1), snappable(new THREE.MeshStandardMaterial({ color:'#e3262f', emissive:'#d01020', emissiveIntensity:0.55, flatShading:true, roughness:0.4 })));
    if (noseAt){ nose.position.copy(noseAt.p); noseAt.o.add(nose); }
    else { face(nose, 0, K === 'dog' ? -0.18 : -0.16, K === 'dog' ? 0.1 : 0.045); head.add(nose); }
    const c = accC('rd');
    for (const s of [-1,1]){
      const g = new THREE.Group();
      if (BOXY) g.position.set(s*BOXY[0]*0.32, HEAD_C.y + BOXY[1]/2 + (hatTop != null ? 0.06 : 0), 0);
      else { const { p } = surf(s*1.15, hatOn ? 0.75 : 0.95, -0.02); g.position.copy(p); }
      g.rotation.z = -s*0.5; head.add(g);
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.24, 5), c, [0, 0.12, 0]));
      g.add(mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.12, 5), c, [s*0.035, 0.14, 0], [0, 0, -s*0.9]));
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.1, 5), c, [-s*0.03, 0.2, 0], [0, 0, s*0.7]));
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.09, 5), c, [s*0.03, 0.26, 0], [0, 0, -s*0.6]));
    }
    iconTop += 0.04;
  }
  // 몸통 너비와 키: 머리를 뺀 몸 전체를 한 묶음으로 늘이고, 머리는 늘어난 목 위에 올림
  const wx = Math.pow(2, ((spec.bodyW ?? 0.5) - 0.5)*0.8), hy = Math.pow(2, ((spec.bodyH ?? 0.5) - 0.5)*0.6);
  const body = new THREE.Group(); [...root.children].forEach(c => { if (c !== headPivot) body.add(c); });
  // 자세 묶음: 몸과 머리를 함께 넣어, 큰 다발을 들면 상체째 살짝 기울임(목 축이 옷깃 위에서 어긋나지 않게)
  const pose = new THREE.Group(); pose.add(body, headPivot); root.add(pose); pose.rotation.z = peek.lean || 0;
  if (FLOWER) headPivot.scale.setScalar(0.86);   // 꽃 머리는 조금 작게
  const SIZE = { dog:0.8, cat:0.8, fox:0.8, rabbit:0.8, bird:0.8, fish:0.8, rose:0.8, daisy:0.8, elephant:1.2, dino:1.2, bear:0.9, potato:0.85, sweet:0.85, dumpling:0.8 };   // 종별 기본 크기(사람·기린·사물은 1)
  const tiny = K === 'hamster' ? 0.4 + 0.4*(spec.tiny ?? 0.5) : (SIZE[K] ?? 1);   // 햄스터: 기본이 아주 작고(0.6배), 더 작게(0.4배)도 가능
  pose.scale.setScalar(tiny);
  body.scale.set(wx, hy, wx); const neckY = NECK_Y*hy + LIFT; headPivot.position.y = neckY;
  FACE_DEFORM = null;
  root.userData = { arm: { sh, hand, parts: armParts, hands: handMs }, F, HP0, big: hold === 2, poseG: pose, poseN: spec.pose || 0, iconTop: (iconTop + neckY - NECK_Y)*tiny, neckY, peek, furMat, headPivot, eyes, ears, torso, phase: Math.random()*10, spec };
  root.traverse(o => { if (o.isMesh) o.userData.ownGeo = true; });
  return root;
}

// ---------- 포즈 (건네기) ----------
// 포즈 하나 = 두 손 위치 + 꽃 묶음(F) 위치·기울기 + 고개(rx 끄덕, ry 돌림, rz 갸웃) + 상체 기울기(lx 앞뒤, lz 좌우)
const P_REST = { h:[[-0.07,0.44,0.33],[0.07,0.44,0.33]], f:[0,0.44,0.33], fr:[0,0,0], hd:[0,0,0], lx:0, lz:0 };
// 포즈는 시간에 따라 돌아가는 열쇠 장면(keys: [초, 상태])들. 사이는 부드럽게 이어지고 마지막에서 처음으로 돌아감
const OFFER_A = { h:[[-0.07,0.47,0.37],[0.07,0.47,0.37]], f:[0,0.47,0.37], fr:[0.05,0,0], hd:[0,0,0.05], lx:0, lz:0 };      // 가슴 앞에 모아 쥠
const OFFER_B = { h:[[-0.08,0.53,0.52],[0.08,0.53,0.52]], f:[0,0.53,0.52], fr:[0.35,0,0], hd:[0.1,0,0.08], lx:0.07, lz:0 };   // 앞으로 쭉
const OFFER_C = { h:[[-0.08,0.5,0.54],[0.08,0.5,0.54]], f:[0,0.5,0.54], fr:[0.45,0,0], hd:[0.25,0,0.1], lx:0.13, lz:0 };     // 내민 채 꾸벅
const SHY_A = { h:[[-0.2,0.3,0.14],[0.12,0.48,0.44]], f:[0.12,0.48,0.44], fr:[0.25,0,-0.25], hd:[0.22,-0.45,0.25], lx:0.03, lz:0.05 };   // 고개 돌리고 살짝 내밂
const SHY_B = { h:[[-0.2,0.31,0.14],[0.14,0.52,0.5]], f:[0.14,0.52,0.5], fr:[0.35,0,-0.2], hd:[0.12,-0.08,0.12], lx:0.05, lz:-0.02 };   // 슬쩍 쳐다보며 조금 더 내밂
const HIDE = { h:[[-0.15,0.36,-0.27],[0.15,0.36,-0.27]], f:[0,0.42,-0.33], fr:[-0.3,0,0], hd:[0.05,0.15,-0.15], lx:-0.04, lz:0 };      // 등 뒤에 숨김
const TADA = { h:[[-0.1,0.64,0.47],[0.1,0.64,0.47]], f:[0,0.64,0.49], fr:[0.25,0,0], hd:[-0.12,0,0], lx:0.05, lz:0 };              // 앞으로 번쩍
const POSES = {
  1: { cycle:3.4, keys:[[0, OFFER_A], [0.55, OFFER_B], [1.5, OFFER_B], [1.9, OFFER_C], [2.5, OFFER_C], [2.85, OFFER_B], [3.4, OFFER_A]] },   // 내밀기
  2: { cycle:4.2, keys:[[0, SHY_A], [1.3, SHY_A], [1.7, SHY_B], [2.4, SHY_B], [2.9, SHY_A], [4.2, SHY_A]] },                                // 수줍게
  3: { cycle:3.6, keys:[[0, HIDE], [1.5, HIDE], [1.85, TADA], [3.25, TADA], [3.6, HIDE]] },                                                 // 짠
};
const lerpArr = (a, b, t) => Array.isArray(a) ? a.map((v, i) => lerpArr(v, b[i], t))
  : typeof a === 'object' ? Object.fromEntries(Object.keys(a).map(k => [k, lerpArr(a[k], b[k], t)])) : a + (b - a)*t;
function poseAt(pose, t){
  const P = POSES[pose]; if (!P) return P_REST;
  const c = t % P.cycle, K = P.keys, e = x => x*x*(3 - 2*x);
  for (let i=0; i<K.length - 1; i++) if (c <= K[i+1][0]) return lerpArr(K[i][1], K[i+1][1], e((c - K[i][0])/Math.max(1e-6, K[i+1][0] - K[i][0])));
  return K[K.length - 1][1];
}
function applyPose(u, t){
  const S = poseAt(u.poseN, t), A = u.arm, a = new V3(), b = new V3(), d = new V3();
  const hands = S.h.map(h => new V3(...h)), bigDy = u.big && u.poseN ? -0.1 : 0;   // 큰 다발은 무거워서 조금 낮게
  hands.forEach(h => h.y += bigDy);
  for (const p of A.parts){
    a.copy(A.sh[p.i]).lerp(hands[p.i], p.t0); b.copy(A.sh[p.i]).lerp(hands[p.i], p.t1);
    p.m.position.copy(a).add(b).multiplyScalar(0.5); d.copy(b).sub(a); const len = d.length();
    p.m.quaternion.setFromUnitVectors(new V3(0,1,0), d.normalize()); p.m.scale.set(1, len/p.len0, 1);
  }
  A.hands.forEach((m, i) => m.position.copy(hands[i]));
  // 큰 다발로 '짠'을 하면, 다발이 앞에 나와 있는 동안만 기본 자세처럼 다발이 기울고 고개를 빼꼼
  const pk = u.big && u.poseN === 3 ? Math.max(0, Math.min(1, (S.f[2] + 0.33)/0.82)) : 0;
  u.F.position.set(S.f[0], S.f[1] + bigDy, S.f[2]); u.F.rotation.set(S.fr[0], S.fr[1], S.fr[2] + 0.36*pk);
  return pk ? { ...S, hd:[S.hd[0], S.hd[1], S.hd[2] - 0.36*pk - 0.15*S.hd[2]], lz:S.lz - 0.1*pk } : S;
}

export function animateChar(k, u, t){
  const p = t + u.phase;
    const S = applyPose(u, p);
    u.headPivot.rotation.z = u.peek.rz + S.hd[2] + Math.sin(p*0.9)*0.06; u.headPivot.position.x = u.peek.dx; u.headPivot.position.y = u.neckY + u.peek.dy;
    u.headPivot.rotation.x = S.hd[0] + Math.sin(p*0.6)*0.04; u.headPivot.rotation.y = S.hd[1];
    u.poseG.rotation.x = S.lx; u.poseG.rotation.z = (u.peek.lean || 0) + S.lz;
    u.torso.scale.set(1 + Math.sin(p*1.6)*0.012, 1 + Math.sin(p*1.6)*0.02, 1);
    const blink = (p % 3.4) < 0.12 ? 0.12 : 1; u.eyes.forEach(e => e.scale.y = e.userData.sc * blink);
    if (k === 'dog') u.ears.forEach((e, i) => e.rotation.z = (i ? 1 : -1)*(0.42 + Math.sin(p*2.1)*0.06));
    if (k === 'robot') u.ears[0].rotation.z = Math.sin(p*2.4)*0.18;
    if (k === 'rabbit') u.ears[1].rotation.z = -0.12 + Math.sin(p*1.3)*0.08;
    if (k === 'elephant'){ u.ears[0].rotation.y = -0.5 - Math.sin(p*1.8)*0.15; u.ears[1].rotation.y = 0.5 + Math.sin(p*1.8)*0.15; u.ears[2].rotation.x = Math.sin(p*1.1)*0.12; }
    if (k === 'fish'){ u.ears[3].rotation.y = Math.sin(p*3)*0.35; u.ears[1].rotation.y = Math.sin(p*4)*0.4; u.ears[2].rotation.y = -Math.sin(p*4)*0.4; }
    if (k === 'bird') u.ears[0].rotation.z = Math.sin(p*2.2)*0.1;
    if (k === 'tv') u.ears[0].rotation.y = Math.sin(p*0.8)*0.3;
    if (k === 'bear') u.ears.forEach((e, i) => e.rotation.z = -(i ? 1 : -1)*0.4 + ((p % 4.6) < 0.16 ? (i ? 0.15 : -0.15) : 0));
    if (k === 'potato') u.ears.forEach((e, i) => e.rotation.z = Math.sin(p*1.7 + i)*0.12);
    if (k === 'hamster') u.ears.forEach((e, i) => e.rotation.z = -(i ? 1 : -1)*0.3 + ((p % 4) < 0.15 ? (i ? 0.2 : -0.2) : 0));
    if (k === 'fox') u.ears.forEach((e, i) => e.rotation.z = -(i ? 1 : -1)*0.3 + ((p % 4.3) < 0.18 ? (i ? 0.18 : -0.18) : 0));
    if (k === 'cat') u.ears.forEach((e, i) => e.rotation.z = -(i ? 1 : -1)*0.35 + ((p % 5) < 0.2 ? (i ? 0.15 : -0.15) : 0));
}

const OPTS = { el: null, rebuild: () => {}, make: null };
let view = 'cat'; const chars = {};
function rebuild(k){ chars[k] = OPTS.make(); OPTS.rebuild(chars[k]); }
function makeIcons(){}
let optTab = '얼굴';
const TABS = ['얼굴', '머리·털', '몸·옷', '소품'];
function renderOpts(){
  const root = OPTS.el; root.innerHTML = '';
  if (view === 'all'){ root.innerHTML = '<div class="note">모든 캐릭터를 나란히 보는 화면이에요. 꾸미려면 위에서 하나를 골라 주세요.</div>'; return; }
  const s = specs[view];
  // 옵션을 탭 네 개로 나눔: 아래 코드는 그대로 두고, tab(이름)으로 지금 쌓을 곳만 바꿈 (보이지 않는 탭의 내용은 버려지는 상자에 쌓임)
  { const bar = document.createElement('div'); bar.className = 'seg tabs';
    TABS.forEach(t => { const b = document.createElement('button'); b.textContent = t; if (t === optTab) b.className = 'on';
      b.onclick = () => { optTab = t; renderOpts(); }; bar.append(b); });
    root.append(bar); }
  const shown = document.createElement('div'), sink = document.createElement('div'); root.append(shown);
  let box = shown;
  const tab = name => { box = name === optTab ? shown : sink; };
  tab('얼굴');
  const sw = (title, colors, field) => {
    const l = document.createElement('div'); l.className = 'lbl'; l.textContent = title; box.append(l);
    const w = document.createElement('div'); w.className = 'swatches';
    colors.forEach((c, i) => { const b = document.createElement('button'); b.style.background = c; if ((s[field] ?? 0) === i) b.className = 'on';
      b.onclick = () => { s[field] = i; rebuild(view); renderOpts(); }; w.append(b); });
    box.append(w);
  };
  const seg = (title, labels, field, wrap=false) => {
    const l = document.createElement('div'); l.className = 'lbl'; l.textContent = title; box.append(l);
    const w = document.createElement('div'); w.className = wrap ? 'seg wrap' : 'seg';
    labels.forEach((t, i) => { const b = document.createElement('button'); b.textContent = t; if ((s[field] ?? (field === 'style' ? 5 : undefined)) === i) b.className = 'on';
      b.onclick = () => { s[field] = i; rebuild(view); renderOpts(); }; w.append(b); });
    box.append(w);
  };
  // 슬라이더: live = 'uniform 이름'(무늬 재질만 즉시 바꿈) | 'rebuild'(움직이는 동안 다시 만듦) | 'none'
  const range = (title, field, uni, rebuildOnEnd=false, noLive=false, live='uniform') => {
    const r = document.createElement('div'); r.className = 'row';
    r.innerHTML = `<label>${title} <span>${Math.round((s[field] ?? 0.5)*100)}%</span></label><input type="range" min="0" max="1" step="0.01" value="${s[field] ?? 0.5}">`;
    const inp = r.querySelector('input'), lab = r.querySelector('span');
    inp.oninput = () => { s[field] = +inp.value; lab.textContent = Math.round(s[field]*100)+'%';
      if (live === 'rebuild') { rebuild(view, false); return; }
      const fm = chars[view].userData.furMat; if (fm && !noLive && uni) fm.userData.U[uni].value = s[field]; };
    inp.onchange = () => { if (rebuildOnEnd || live === 'rebuild') rebuild(view); else makeIcons(); };
    box.append(r);
  };
  const btn = (text, fn) => { const b = document.createElement('button'); b.className = 'wideBtn'; b.textContent = text; b.onclick = fn; box.append(b); };
  if (view === 'human'){
    sw('피부', PALETTE.human.skin, 'skin');
    range('얼굴형 (갸름 ← 동글 → 사각)', 'shape', null, true, true, 'rebuild');
    range('얼굴 길이 (위아래)', 'flen', null, true, true, 'rebuild');
    range('코 크기 (0 = 없음)', 'nose', null, true, true, 'rebuild');
    range('입 위치 (아래 ↔ 위)', 'mouthY', null, true, true, 'rebuild');
    range('입 길이 (좌우)', 'mouthW', null, true, true, 'rebuild');
    seg('입술 색', ['검정','짙은 피부색','빨강','분홍'], 'lip', true);
    tab('머리·털');
    sw('머리 색', PALETTE.human.hair, 'hair');
    seg('머리 모양', ['짧은','단발','올림','파마','장발','없음','가르마펌','장발 가르마','히메컷','장발 웨이브','땋은머리','묶음 애교머리','올린 컬','긴 옆가르마','반삭'], 'style', true);
    if ([5,7,11,12,13,14].includes(s.style)) range('눈썹 높이', 'browY', null, true, true, 'rebuild');
    tab('얼굴');
    seg('콧수염', ['없음','있음'], 'mst');
    seg('턱수염', ['없음','짧게','길게'], 'beard');
    seg('점', ['없음','있음'], 'mole');
    if (s.mole){
      range('점 좌우', 'mx', null, true, true, 'rebuild'); range('점 위아래', 'my', null, true, true, 'rebuild');
      btn('점 다시 찍기', () => { s.mx = Math.random(); s.my = Math.random(); rebuild(view); renderOpts(); });
    }
  } else { tab('머리·털');
    if (view !== 'rose' && view !== 'daisy'){
      seg('머리카락', ['짧은','단발','올림','파마','장발','없음','가르마펌','장발 가르마','히메컷','장발 웨이브','땋은머리','묶음 애교머리','올린 컬','긴 옆가르마','반삭'], 'style', true);
      if ((s.style ?? 5) !== 5){ sw('머리 색', PALETTE.human.hair, 'hair'); if ([7,11,12,13,14].includes(s.style)) range('눈썹 높이', 'browY', null, true, true, 'rebuild'); }
    }
    sw({ robot:'몸체 색', tv:'몸체 색', phone:'몸체 색', can:'몸체 색', rose:'꽃잎 색', daisy:'꽃잎 색', bird:'깃털 색', fish:'비늘 색', elephant:'피부 색', potato:'껍질 색', sweet:'껍질 색', dumpling:'만두피 색' }[view] || '털 색', PALETTE[view].fur, 'fur');
    if (view === 'potato') seg('싹', ['없음','한 개','두 개'], 'sprout');
    if (view === 'dumpling') seg('굽기', ['물만두','군만두'], 'grill'); }
  tab('얼굴');
  if (view === 'bird'){ range('부리 크기', 'beak', null, true, true, 'rebuild'); seg('부리 색', ['주황','베이지','노랑','연핑크','검정'], 'beakC', true); }
  if (view === 'dog' || view === 'fox' || view === 'dino') range('입 길이', 'snout', null, true, true, 'rebuild');
  if (view === 'rabbit') range('입 크기', 'snout', null, true, true, 'rebuild');
  if (view === 'potato' || view === 'sweet'){ range('입 위치 (아래 ↔ 위)', 'mouthY', null, true, true, 'rebuild'); range('입 길이 (좌우)', 'mouthW', null, true, true, 'rebuild'); }
  if (view === 'cat' || view === 'rabbit' || view === 'fox') range('귀 크기', 'earS', null, true, true, 'rebuild');
  tab('몸·옷');
  if (view === 'hamster') range('크기', 'tiny', null, true, true, 'rebuild');
  tab('머리·털');
  if (PATTERNED.includes(view)){
    if (FURRY.includes(view)){
      seg('털 모양', ['짧은 털','곱슬','보송'], 'furStyle');
      if ((s.furStyle ?? 0) > 0) range('털 길이', 'fluff', 'uWhite', true, true);
    }
    if (view === 'bird') range('무늬 시작 높이 (위는 단색)', 'patH', 'uPatTop', true, true);
    else range(view === 'fish' ? '밝은 배 (아래부터 일자로)' : view === 'dino' ? '밝은 부분 (입 주위·턱·미간)' : '흰 부분 (입 주위·턱·미간)', 'wht', 'uWhite', true);
    seg('무늬', ['없음','점박이','얼룩','줄무늬'], 'pat');
    if (s.pat > 0){
      sw('무늬 색', PALETTE.pat, 'fur2');
      range('무늬 양', 'amt', 'uAmt'); range('무늬 크기', 'size', 'uFreq');
      const b = document.createElement('button'); b.id = 'reshuffle'; b.textContent = '무늬 다시 섞기';
      b.onclick = () => { s.ps = Math.round(Math.random()*97)/7; rebuild(view); }; box.append(b);
    }
  }
  tab('얼굴');
  sw('눈 색', PALETTE.eye, 'eye'); range('눈 크기', 'eyeS', null, true, true, 'rebuild');
  seg('속눈썹', ['없음','있음'], 'lash');

  tab('몸·옷');
  range('몸통 너비', 'bodyW', null, true, true, 'rebuild'); range('키', 'bodyH', null, true, true, 'rebuild');
  tab('소품');
  // 악세서리: 눌러서 켜고 끄기, 켠 것마다 색 고르기
  s.acc = s.acc || {}; s.accC = s.accC || {};
  { const l = document.createElement('div'); l.className = 'lbl'; l.textContent = '악세서리 (여러 개 선택 가능)'; box.append(l);
    const w = document.createElement('div'); w.className = 'chips';
    ACC.forEach(([k, name]) => { const b = document.createElement('button'); b.textContent = name; if (s.acc[k]) b.className = 'on';
      b.onclick = () => { const on = !s.acc[k]; if (on) ACC_EXCL.forEach(g => { if (g.includes(k)) g.forEach(x => delete s.acc[x]); });
        if (on) s.acc[k] = 1; else delete s.acc[k]; rebuild(view); renderOpts(); }; w.append(b); });
    box.append(w);
    ACC.forEach(([k, name]) => { if (!s.acc[k]) return;
      const l2 = document.createElement('div'); l2.className = 'lbl'; l2.textContent = name + ' 색'; box.append(l2);
      const w2 = document.createElement('div'); w2.className = 'swatches';
      PALETTE.acc.forEach((c, i) => { const b = document.createElement('button'); b.style.background = c; if ((s.accC[k] ?? ACC_DEFAULT[k]) === i) b.className = 'on';
        b.onclick = () => { s.accC[k] = i; rebuild(view); renderOpts(); }; w2.append(b); });
      box.append(w2); });
  }
  tab('몸·옷');
  sw('옷 색', PALETTE.cloth, 'cloth');
  seg('옷 모양', ['기본','셔츠','가디건','민소매','반팔'], 'outfit', true);
  seg('들고 있는 꽃', ['한 송이','작은 다발','큰 다발'], 'hold');
  seg('포즈 (건네기)', ['기본','내밀기','수줍게','짠'], 'pose');
}
// ================= 바깥으로 내보내는 부분 =================
export { build, PALETTE, NAMES, ACC, specs as SPECS, POSES };
// 꽃망울에서 고를 수 있는 6종 (핸드오프의 "캐릭터 6종")
export const SIX = ['cat', 'dog', 'bear', 'rabbit', 'fox', 'human', 'hamster', 'bird', 'dino', 'robot', 'elephant', 'giraffe'];   // 처음 6종 + 캐릭터 실험 v0에서 6종 더
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
