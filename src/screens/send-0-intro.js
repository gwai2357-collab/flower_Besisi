// S0 진입: 3D 미리보기(여러 조합의 꽃다발 · 꽃다발+선물 · 가끔 꽃을 든 캐릭터)가 3~5초 간격으로 저절로 넘어가고 계속 천천히 돈다.
// 드래그하면 눈앞의 꽃다발을 돌려 볼 수 있지만, 전체가 도는 움직임은 멈추지 않는다. 하단은 박스 없이 버튼이 3D 위에 바로 떠 있다(글씨는 밝은 색).
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, charObj, parcelObj, DEMO_BOUQUET, DEMO_B, DEMO_C, DEMO_SINGLE, DEFAULT_LOOK, BOUQUET_CAM, CHAR_CAM } from '../scene3d/previews.js';
import { newSpec, randomSpec } from '../scene3d/characters.js';
import { setMode } from '../state.js';

export default {
  id: 'send-0-intro', flow: 'send', title: '시작',
  mount(ctx){
    const st = ctx.stage, THREE = st.THREE, L = layout(ctx, t('send.intro.bubble'));
    // 미리보기 목록: 만들 때마다 새로 짓는 함수들
    const scenes = [
      () => ({ obj: bouquetObj(DEMO_BOUQUET), cam: BOUQUET_CAM }),
      () => ({ obj: bouquetObj(DEMO_B), cam: BOUQUET_CAM }),
      () => { const g = new THREE.Group(), b = bouquetObj(DEMO_C), p = parcelObj(0.2); b.position.x = -0.12; p.position.set(0.5, 0.03, 0.35); p.rotation.y = -0.5; g.add(b, p); return { obj: g, cam: { target: [0.12, 0.6, 0], camera: [0.3, 0.8, 2.2] } }; },
      () => ({ obj: bouquetObj(DEMO_SINGLE, 'kraft'), cam: { target: [0, 0.5, 0], camera: [0.1, 0.6, 1.3] } }),
      () => ({ obj: charObj(Math.random() < 0.5 ? DEFAULT_LOOK() : { ...randomSpec(), pose: 1 }, { items: DEMO_SINGLE, wrap: 'kraft' }), cam: CHAR_CAM }),
    ];
    let i = 0, timer = 0;
    const showAt = n => { i = n % scenes.length; const s = scenes[i](); st.show(s.obj, { ...s.cam, sway: false, minDistance: 0.9 }); };
    const next = () => { showAt(i + 1); timer = setTimeout(next, 3000 + Math.random() * 2000); };   // 3~5초 간격
    showAt(0); timer = setTimeout(next, 4000);
    const offSpin = st.onFrame(dt => { const c = st.content; if (c) c.rotation.y += dt * 0.35; });   // 드래그와 상관없이 계속 도는 전체 움직임

    // 하단: 박스 없이 버튼만 (밝은 글씨)
    const start = mode => { setMode(mode); ctx.go('send-1-flowers'); };
    const bottom = el('div', { class: 'onbg', style: { padding: '0 var(--gutter) calc(18px + env(safe-area-inset-bottom))', pointerEvents: 'auto' } },
      el('h2', { style: { textAlign: 'center', margin: '0 0 8px' } }, t('send.intro.ask')),
      el('div', { class: 'row' },
        el('button', { class: 'btn big', style: { flex: 1 }, onclick: () => start('single') }, t('send.intro.single'), el('small', { style: { display: 'block', fontWeight: 400, opacity: .7 } }, t('send.intro.singleSub'))),
        el('button', { class: 'btn big primary', style: { flex: 1 }, onclick: () => start('bouquet') }, t('send.intro.bouquet'), el('small', { style: { display: 'block', fontWeight: 400, opacity: .75 } }, t('send.intro.bouquetSub')))),
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } },
        el('button', { class: 'btn ghost', onclick: () => ctx.go('send-0-1-collect') }, t('send.intro.together')),
        el('button', { class: 'btn', style: { padding: '4px 10px' }, onclick: async () => { await copyText(location.href); toast(t('common.copied')); } }, '⇪ ' + t('send.intro.share'))));
    ctx.root.append(bottom);
    const ro = new ResizeObserver(() => st.setInset(bottom.offsetHeight)); ro.observe(bottom);
    return () => { clearTimeout(timer); offSpin(); ro.disconnect(); st.setInset(0); };
  },
};
