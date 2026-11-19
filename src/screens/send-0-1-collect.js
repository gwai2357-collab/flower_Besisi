// S0-1 함께 모으기 (화면만): 여러 다발과 캐릭터들이 둥글게 모여 저절로 돈다. 받는 사람·마감일(일 단위 ▲▼) → 미리보기 → 확정하면 링크 복사 (팝업 없음)
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, charObj, DEMO_BOUQUET, DEMO_SINGLE, DEMO_B, DEMO_C } from '../scene3d/previews.js';
import { randomSpec } from '../scene3d/characters.js';
import { state, update } from '../state.js';

const pad = n => String(n).padStart(2, '0');

export default {
  id: 'send-0-1-collect', flow: 'send', title: '함께 모으기',
  mount(ctx){
    const st = ctx.stage, THREE = st.THREE, L = layout(ctx, t('send.collect.bubble'));
    // 다발과 캐릭터가 번갈아 서서 원을 이룸 (캐릭터의 종류·액세서리는 랜덤, 나중에 임의로 꾸밀 수 있게 할 예정)
    const g = new THREE.Group(), bq = [DEMO_BOUQUET, DEMO_SINGLE, DEMO_B, DEMO_SINGLE, DEMO_C, DEMO_B], N = bq.length * 2;
    bq.forEach((items, k) => {
      const b = bouquetObj(items.map((x, j) => ({ ...x, seed: x.seed + k * 91 + j })), k % 2 ? 'kraft' : 'paper');
      const a = (2 * k / N) * Math.PI * 2; b.position.set(Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8); b.rotation.y = a; b.scale.setScalar(0.6); g.add(b);
      const spec = randomSpec(); spec.hold = 1; spec.pose = 0;
      if (Math.random() < 0.6) spec.acc = { [['hp', 'hat', 'cap', 'g1', 'sg'][Math.floor(Math.random() * 5)]]: 1 };
      const c = charObj(spec), a2 = ((2 * k + 1) / N) * Math.PI * 2; c.position.set(Math.sin(a2) * 0.8, 0, Math.cos(a2) * 0.8); c.rotation.y = a2; c.scale.setScalar(0.5); g.add(c);
    });
    st.show(g, { camera: [0, 1.1, 2.7], target: [0, 0.4, 0], sway: false, minDistance: 1.2 });
    const off = st.onFrame(dt => { g.rotation.y += dt * 0.3; });

    // 마감: 일 단위 ▲▼. 시·분은 만든 시각 기준(지금 + n일)으로 분 단위까지 표시
    const born = new Date();
    const deadline = el('div', { class: 'count', style: { textAlign: 'center' } }), title = el('div', { style: { textAlign: 'center', fontWeight: 600, margin: '8px 0' } });
    const dayOut = el('b', { style: { minWidth: '40px', textAlign: 'center', fontSize: '16px' } });
    const paint = () => {
      const end = new Date(born.getTime() + state.collect.days * 864e5);
      dayOut.textContent = state.collect.days + '일';
      deadline.textContent = `${t('send.collect.left', { n: state.collect.days })} · ${end.getMonth() + 1}월 ${end.getDate()}일 ${pad(end.getHours())}시${pad(end.getMinutes())}분 마감`;
      title.textContent = state.collect.to ? t('send.collect.previewTitle', { 이름: state.collect.to }) : t('send.collect.previewTitleEmpty');
    };
    const step = d => { update(s => { s.collect.days = Math.max(1, Math.min(7, s.collect.days + d)); }); paint(); };
    const to = el('input', { class: 'field', placeholder: t('send.collect.toPh'), value: state.collect.to, oninput: e => { update(s => { s.collect.to = e.target.value; }); paint(); } });
    L.addSheet([
      el('div', { class: 'kv' }, el('span', {}, t('send.collect.to')), to, el('span', {}, t('send.collect.until')),
        el('div', { class: 'row' }, el('div', { class: 'stepper' }, el('button', { class: 'btn', 'aria-label': '+', onclick: () => step(1) }, '▲'), el('button', { class: 'btn', 'aria-label': '-', onclick: () => step(-1) }, '▼')), dayOut)),
      deadline, title,
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: async () => { await copyText(`${location.origin}${location.pathname}#together=${Math.random().toString(36).slice(2, 8)}`); toast(t('common.copied')); } }, t('send.collect.confirm')),
    ], { grab: false });
    paint();
    return () => { off(); L.dispose(); };
  },
};
