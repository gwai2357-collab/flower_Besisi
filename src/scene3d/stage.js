// 3D 무대: 렌더러 + PS1 효과(낮은 해상도 + 디더링) + 카메라. 화면이 바뀌어도 하나만 살아 있고, 화면은 show()로 무엇을 보여줄지만 정한다.
// 배경색은 CSS 변수 --bg 를 읽는다(theme.css). 바꾼 뒤에는 stage.refreshBackground().
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PS1 as BOUQUET_SNAP } from './bouquet-v0.js';

// 화면 해상도(300)와 물체별 꼭짓점 흔들림(높을수록 덜 흔들림). 개발 패널에서 바꿈.
export const PS1_DEFAULT = { on: true, height: 300, snap: { bouquet: 550, parcel: 350, gift: 820 } };
export const SNAP = { bouquet: BOUQUET_SNAP, parcel: mkSnap(), gift: mkSnap() };
function mkSnap(){ return { uSnap: { value: 1 }, uRes: { value: new THREE.Vector2(320, 240) } }; }

export function createStage(host, opts = {}){
  const ps1 = { ...PS1_DEFAULT, snap: { ...PS1_DEFAULT.snap } };
  const canvas = document.createElement('canvas'); host.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: opts.preserve !== false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.01, 50);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, minDistance: 0.5, maxDistance: 5, maxPolarAngle: Math.PI * 0.55 });
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };   // 한 손가락 드래그 = 돌리기, 두 손가락 = 핀치 확대
  scene.add(new THREE.HemisphereLight('#fff6f2', '#f0d0d8', 1.3));
  const fill = new THREE.DirectionalLight('#ffffff', 0.6); fill.position.set(0, 0.4, 2); scene.add(fill);
  const sun = new THREE.DirectionalLight('#fff4e6', 2.0); sun.position.set(1.2, 2.6, 1.4); scene.add(sun);

  // PS1 후처리: 낮은 해상도로 그린 뒤 최근접으로 늘리고 바이어 디더링
  const rt = new THREE.WebGLRenderTarget(320, 240, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uSize: { value: new THREE.Vector2(320, 240) }, uLevels: { value: 32 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uSize; uniform float uLevels; varying vec2 vUv;
      float bayer(vec2 p){ int x=int(mod(p.x,4.0)), y=int(mod(p.y,4.0)); int m[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(m[x+y*4])/16.0-0.5; }
      void main(){ gl_FragColor=vec4(texture2D(tDiffuse,vUv).rgb,1.0);
        #include <colorspace_fragment>
        float d=bayer(floor(vUv*uSize))/uLevels; gl_FragColor.rgb=floor((gl_FragColor.rgb+d)*uLevels+0.5)/uLevels; }`,
    depthTest: false, depthWrite: false });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  let W = 1, H = 1, inset = 0, heightNow = ps1.height;
  function sizePS1(){
    const h = heightNow, w = Math.max(16, Math.round(h * camera.aspect));
    rt.setSize(w, h); postMat.uniforms.uSize.value.set(w, h);
    for (const k of Object.keys(SNAP)) SNAP[k].uRes.value.set(Math.round(ps1.snap[k] * camera.aspect), ps1.snap[k]);
  }
  function resize(){
    W = host.clientWidth || 1; H = host.clientHeight || 1;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = W / H < 1 ? 46 : 35;
    applyInset(); sizePS1();
  }
  // 아래 패널이 가린 만큼 그림을 위로 올려서, 3D가 보이는 자리의 가운데에 오게 한다
  function applyInset(){
    if (inset > 0) camera.setViewOffset(W, H, 0, inset / 2, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  let fitNow = 1, fitTarget = 1;
  let content = null, contentOpts = {}, frozen = false, framesLeft = 0, listeners = [], t0 = performance.now();
  const clock = new THREE.Clock();
  function show(obj, o = {}){
    if (content){ scene.remove(content); content.traverse(x => x.geometry && x.geometry.dispose()); }
    content = obj; contentOpts = o;
    if (obj){ obj.position.y = o.y ?? 0; scene.add(obj); }
    controls.minDistance = o.minDistance ?? 0.5;
    if (!o.keepCamera){ const tg = o.target || [0, 0.6, 0], cam = o.camera || [0.25, 0.8, 2.15]; controls.target.set(...tg); camera.position.set(...cam); controls.update(); }
    controls.enabled = o.controls !== false;
    controls.autoRotate = !!o.autoRotate; controls.autoRotateSpeed = o.autoRotate || 0;   // 저절로 도는 장면(진입·함께 모으기). 드래그해도 멈추지 않고, 놓으면 부드럽게 이어서 돈다
    fitNow = fitTarget = 1;
    framesLeft = 3;
  }
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta(), t = clock.elapsedTime;
    if (frozen && framesLeft <= 0) return;
    framesLeft--;
    if (content && contentOpts.sway !== false){ content.rotation.z = Math.sin(t * 0.7) * 0.012; content.rotation.y = (contentOpts.spin ?? 0) + Math.sin(t * 0.25) * 0.05; }
    if (content && contentOpts.fitable){ fitNow += (fitTarget - fitNow) * Math.min(1, dt * 6); content.scale.setScalar(fitNow); }   // 아래 패널을 내린 만큼 3D가 커짐
    const ud = content && content.userData;
    if (ud && ud.tagPivot){ ud.tagPivot.rotation.z = Math.sin(t * 1.4) * 0.16; ud.tagPivot.rotation.x = -0.1 + Math.sin(t * 1.1 + 0.6) * 0.08; }
    else if (ud && ud.noteMesh) ud.noteMesh.scale.setScalar(1 + Math.sin(t * 2.6) * 0.035);
    if (ud && ud.charAnim) ud.charAnim(t);
    for (const f of listeners) f(dt, t);
    controls.update();
    if (ps1.on){ renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); }
    else renderer.render(scene, camera);
  });

  // 탭(드래그가 아닌 짧은 누름)으로 물체 고르기
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downAt = null;
  function pick(e, objs){
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); return ray.intersectObjects(objs, true)[0] || null;
  }
  const tapHandlers = new Set();
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt) return; const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null;
    if (moved < 8) for (const h of tapHandlers) h(e);
  });

  const api = {
    THREE, scene, camera, renderer, controls, canvas, ps1, show, pick, resize,
    get content(){ return content; },
    onFrame(f){ listeners.push(f); return () => { listeners = listeners.filter(x => x !== f); }; },
    onTap(h){ tapHandlers.add(h); return () => tapHandlers.delete(h); },
    setInset(px){ inset = px; applyInset(); },
    setFit(k){ fitTarget = k; framesLeft = 3; },
    // 지금 올려 둔 3D 물체가 화면에서 차지하는 영역(CSS px, 뷰포트 기준). 접힌 말풍선이 그 오른쪽 경계 옆에 떠 있게 하는 데 씀. 0.25초 동안 같은 값 재사용
    contentScreenBox(){
      const now = performance.now(); if (api.__cb && now - api.__cbAt < 250 && api.__cbFor === content) return api.__cb;
      let box = null; const r = canvas.getBoundingClientRect();
      if (content){
        const b3 = new THREE.Box3().setFromObject(content);
        if (!b3.isEmpty()){
          const v = new THREE.Vector3(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const x of [b3.min.x, b3.max.x]) for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]){
            v.set(x, y, z).project(camera); const sx = r.left + (v.x + 1) / 2 * r.width, sy = r.top + (1 - v.y) / 2 * r.height;
            x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
          }
          box = { x0, y0, x1, y1 };
        }
      }
      const out = { box, area: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } };
      api.__cb = out; api.__cbAt = now; api.__cbFor = content; return out;
    },
    refreshBackground(){
      const c = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#bce1da';
      scene.background = new THREE.Color(c); framesLeft = 3;
    },
    setPS1(o){ Object.assign(ps1, o, o.snap ? { snap: { ...ps1.snap, ...o.snap } } : {}); heightNow = ps1.height; for (const k in SNAP) SNAP[k].uSnap.value = ps1.on ? 1 : 0; sizePS1(); framesLeft = 3; },
    // 디더링이 풀리며 선명해지는 연출(받기 R0): 낮은 해상도 → 기본 해상도
    ditherIn(ms = 2400){
      const s = performance.now(); heightNow = 36;
      const off = api.onFrame(() => { const k = Math.min(1, (performance.now() - s) / ms); heightNow = Math.round(36 + (ps1.height - 36) * k * k); sizePS1(); if (k >= 1) off(); });
    },
    // 보이는 그림을 한두 프레임만 그리고 멈춤(스토리보드·스크린샷용)
    freeze(){ frozen = true; framesLeft = 4; },
    unfreeze(){ frozen = false; },
  };
  api.refreshBackground();
  return api;
}
