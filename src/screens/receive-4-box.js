// R4 보관함 (화면만): 내 캐릭터 + 받은 다발 진열 / 도감 / 포토박스 벽. 다발을 열면 포즈 장면 없이 바로 바라보기 + "다시 받아 보기".
import * as THREE from 'three';
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout, chip } from './_kit.js';
import { bouquetObj, charObj, DEFAULT_LOOK, DEMO_SINGLE } from '../scene3d/previews.js';
import { CATALOG, byId } from '../data/flowers.js';
import { rollItem } from '../scene3d/bouquet-v0.js';
import { state } from '../state.js';
import { getData, rx } from './receive-kit.js';

export default {
  id: 'receive-4-box', flow: 'receive', title: '보관함',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage, L = layout(ctx, '');
    let tab = 'bouquet', cur = null;
    const owned = new Set(d.items.map(i => i.flower));   // 받은 다발에 들어 있던 꽃 = 모은 꽃
    const total = 45;                                   // 목표 도감 크기(문서의 예시). 지금은 만든 꽃만 칩으로 보임
    const tabs = el('div', { class: 'tabs' }), body = el('div');
    const shelf = () => {   // 내 캐릭터 + 받은 다발 두 개를 나란히
      const g = new THREE.Group(), me = charObj(state.character.look || DEFAULT_LOOK(), { items: DEMO_SINGLE, wrap: 'kraft' }); me.position.set(-0.55, 0, 0); me.scale.setScalar(0.7); g.add(me);
      [0, 1].forEach(k => { const b = bouquetObj(d.items.map((x, j) => ({ ...x, seed: x.seed + k * 13 + j })), d.wrap); b.scale.setScalar(0.55); b.position.set(0.15 + k * 0.55, 0, 0.1); g.add(b); });
      return g;
    };
    const flowerObj = id => { const f = byId[id]; const b = bouquetObj([{ ...rollItem(f.type), flower: id }], 'kraft'); b.scale.setScalar(1.3); return b; };
    function draw(){
      tabs.replaceChildren(...['bouquet', 'book', 'wall'].map(k => el('button', { class: k === tab ? 'on' : '', onclick: () => { tab = k; cur = null; draw(); } }, t('receive.box.tabs.' + k))));
      body.replaceChildren();
      if (tab === 'bouquet'){
        st.show(shelf(), { target: [0.1, 0.45, 0], camera: [0.2, 0.7, 2.6], sway: false, minDistance: 1 });
        body.append(el('div', { class: 'row', style: { justifyContent: 'space-between' } },
          el('div', {}, el('b', {}, t('receive.box.detail')), el('p', { class: 'note', style: { margin: '4px 0 0' } }, `${t('receive.box.date')}: ${new Date().toLocaleDateString('ko-KR')} · ${d.gift ? '선물 ' + '✓' : '선물 없음'} · 편지 ✓`)),
          el('button', { class: 'btn primary', onclick: () => { rx.cardRead = false; rx.giftOpened = false; ctx.go('receive-1-look'); } }, t('receive.box.again'))));
      } else if (tab === 'book'){
        const pick = id => { cur = id; draw(); };
        if (cur){
          const f = byId[cur], list = CATALOG.filter(x => x.type), i = list.findIndex(x => x.id === cur);
          st.show(flowerObj(cur), { target: [0, 0.35, 0], camera: [0.1, 0.55, 1.5], sway: true, minDistance: 0.6 });
          L.say(t('receive.box.meaning', { 뜻: `${f.meaning}` }));
          body.append(el('div', { class: 'row', style: { justifyContent: 'space-between' } },
            el('button', { class: 'btn', onclick: () => pick(list[(i - 1 + list.length) % list.length].id) }, '◀'), el('b', {}, f.name),
            el('button', { class: 'btn', onclick: () => pick(list[(i + 1) % list.length].id) }, '▶')),
            el('button', { class: 'btn', style: { width: '100%', marginTop: '8px' }, onclick: () => { cur = null; draw(); } }, t('common.close')));
        } else {
          st.show(shelf(), { target: [0.1, 0.45, 0], camera: [0.2, 0.7, 2.6], sway: false, minDistance: 1 });
          body.append(el('b', {}, t('receive.box.book', { total, n: owned.size })), el('div', { class: 'chips', style: { marginTop: '8px' } },
            ...CATALOG.map(f => chip(f.name, { dot: f.dot, cls: owned.has(f.id) ? '' : 'locked', onclick: () => owned.has(f.id) && f.type ? pick(f.id) : toast(t('send.flowers.lockedHint')) }))));
        }
      } else {
        st.show(shelf(), { target: [0.1, 0.45, 0], camera: [0.2, 0.7, 2.6], sway: false, minDistance: 1 });
        body.append(el('p', { class: 'note', style: { textAlign: 'center' } }, t('receive.box.wallEmpty')));
      }
    }
    L.addSheet([tabs, body, el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '10px' } }, el('button', { class: 'btn ghost', onclick: () => toast(t('common.feedbackSoon')) }, t('common.feedback')))], { grab: false });
    draw();
    return () => L.dispose();
  },
};
