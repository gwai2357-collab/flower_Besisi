// S0-1 함께 모으기 (화면만): 여러 다발이 모인 장면 + 받는 사람·마감일 → 미리보기 → 확정하면 링크 복사 (팝업 없음)
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, DEMO_BOUQUET, DEMO_SINGLE } from '../scene3d/previews.js';
import { state, update } from '../state.js';

export default {
  id: 'send-0-1-collect', flow: 'send', title: '함께 모으기',
  mount(ctx){
    const L = layout(ctx, t('send.collect.bubble'));
    // 여러 사람이 만든 다발이 모인 모습: 작은 다발 다섯 개를 둥글게 세움
    const THREE = ctx.stage.THREE, g = new THREE.Group();
    const sets = [DEMO_BOUQUET, DEMO_SINGLE, DEMO_BOUQUET.slice(2, 8), DEMO_SINGLE, DEMO_BOUQUET.slice(0, 6)];
    sets.forEach((items, k) => {
      const b = bouquetObj(items.map((x, j) => ({ ...x, seed: x.seed + k * 91 + j })), k % 2 ? 'kraft' : 'paper');
      const a = (k / sets.length) * Math.PI * 2; b.position.set(Math.sin(a) * 0.55, 0, Math.cos(a) * 0.55 - 0.1); b.rotation.y = a; b.scale.setScalar(0.6);
      g.add(b);
    });
    ctx.stage.show(g, { camera: [0, 1.0, 2.4], target: [0, 0.45, 0] });

    const days = state.collect.days, end = new Date(Date.now() + days * 864e5);
    const deadline = el('div', { class: 'count', style: { textAlign: 'center' } });
    const title = el('div', { style: { textAlign: 'center', fontWeight: 600, margin: '10px 0' } });
    const paint = () => {
      deadline.textContent = `${t('send.collect.left', { n: state.collect.days })} · ${t('send.collect.deadline', { 월: end.getMonth() + 1 + 0, 일: end.getDate() })}`;
      title.textContent = state.collect.to ? t('send.collect.previewTitle', { 이름: state.collect.to }) : t('send.collect.previewTitleEmpty');
    };
    const setEnd = n => { end.setTime(Date.now() + n * 864e5); };
    const to = el('input', { class: 'field', placeholder: t('send.collect.toPh'), value: state.collect.to, oninput: e => { update(s => { s.collect.to = e.target.value; }); paint(); } });
    const range = el('input', { type: 'range', min: 1, max: 7, step: 1, value: days, style: { width: '100%' }, oninput: e => { update(s => { s.collect.days = +e.target.value; }); setEnd(+e.target.value); paint(); } });
    L.addSheet([
      el('div', { class: 'kv' }, el('span', {}, t('send.collect.to')), to, el('span', {}, t('send.collect.until')), range),
      deadline, title,
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: async () => { await copyText(`${location.origin}${location.pathname}#together=${Math.random().toString(36).slice(2, 8)}`); toast(t('common.copied')); } }, t('send.collect.confirm')),
    ], { grab: false });
    paint();
    return () => L.dispose();
  },
};
