// R2 유리돔: 받침대가 올라오고 돔이 덮인다. 남은 날이 줄수록 김이 서린다. 가입 유도는 이 화면에서만(이번엔 가짜 동작).
import * as THREE from 'three';
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj } from '../scene3d/previews.js';
import { getData, makeDome, rx } from './receive-kit.js';

const frostFor = left => left >= 7 ? 0 : [1, 0.85, 0.7, 0.5, 0.32, 0.18, 0.08][Math.max(0, Math.min(6, left))] ?? 0.08;

export default {
  id: 'receive-2-dome', flow: 'receive', title: '유리돔',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage, left = rx.daysLeft;
    const L = layout(ctx, left <= 1 ? t('receive.dome.last') : t('receive.dome.bubble', { n: left }));
    const g = new THREE.Group(), dome = makeDome(frostFor(left)), bq = bouquetObj(d.items, d.wrap);
    bq.scale.setScalar(0.62); bq.position.y = dome.userData.base; dome.add(bq);
    g.add(dome);
    // 받침대가 올라오고 돔이 덮이는 연출
    const t0 = performance.now(); dome.position.y = -0.4;
    const off = st.onFrame(() => { const k = Math.min(1, (performance.now() - t0) / 1400); dome.position.y = -0.4 * (1 - k * k * (3 - 2 * k)); });
    st.show(g, { target: [0, 0.55, 0], camera: [0.2, 0.8, 2.3], sway: false, minDistance: 1 });
    L.addSheet([
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: () => toast(t('common.fakeAction')) }, t('receive.dome.start')),
      el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '8px' } },
        el('button', { class: 'btn ghost', onclick: () => toast(t('receive.dome.perks')) }, 'ⓘ ' + t('receive.dome.info'))),
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '6px' } },
        el('button', { class: 'btn ghost', onclick: () => ctx.go('receive-3-thanks') }, t('receive.thanks.bubble')),
        el('button', { class: 'btn ghost', onclick: () => ctx.go('receive-4-box') }, t('receive.thanks.box')))], { grab: false });
    return () => { off(); L.dispose(); };
  },
};
