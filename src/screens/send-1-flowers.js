// S1 꽃 꾸미기: 위는 3D 다발 + 말풍선 + 되돌리기, 아래는 패널(버튼 줄 / 탭 / 오늘의 꽃 / 칩 / 개수)
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout, chip } from './_kit.js';
import { bouquetObj, BOUQUET_CAM } from '../scene3d/previews.js';
import { CATALOG, byId, MAX_ITEMS, SINGLE_FOLIAGE, openToday, isOpen } from '../data/flowers.js';
import { state, update, subscribe, addFlower, clearFlowers, shuffleFlowers, setSuggested } from '../state.js';

export default {
  id: 'send-1-flowers', flow: 'send', title: '꽃 꾸미기',
  mount(ctx){
    const single = state.mode === 'single';
    const L = layout(ctx, single ? t('send.flowers.singleBubble') : t('send.flowers.bubble'));
    const today = openToday(), tabs = single ? ['flower1', 'foliage'] : ['flower1', 'flower2', 'foliage', 'wrap'];
    let tab = 'flower1', hist = [], first = true;
    const snap = () => JSON.stringify(state.items);
    const push = () => { hist.push(snap()); undo.disabled = false; };

    const render3d = () => {
      const obj = bouquetObj(state.items, state.wrap);
      ctx.stage.show(obj, { ...BOUQUET_CAM, camera: [0.2, 0.72, 1.95], keepCamera: !first, fitable: true, minDistance: 0.7 }); first = false;   // 드래그·핀치줌으로 확대 가능. 패널을 내리면 fit으로 커짐
    };
    // 되돌리기 (말풍선 옆)
    const undo = el('button', { class: 'btn undo-float', 'aria-label': t('common.undo'), disabled: true, onclick: () => { const h = hist.pop(); if (h == null) return; update(s => { s.items = JSON.parse(h); }); undo.disabled = !hist.length; } }, '↶');
    ctx.root.append(undo);   // 왼쪽 가운데 아이콘

    const actions = el('div', { class: 'row wrap' },
      el('button', { class: 'btn', onclick: () => { push(); clearFlowers(); } }, t('send.flowers.clear')),
      el('button', { class: 'btn', onclick: () => { push(); shuffleFlowers(); } }, t('send.flowers.shuffle')),
      el('button', { class: 'btn', onclick: () => { push(); setSuggested(); if (single) update(s => { s.items = s.items.filter(i => byId[i.flower].tab === 'foliage').slice(0, SINGLE_FOLIAGE); }); } }, t('send.flowers.suggest')));
    const tabBar = el('div', { class: 'tabs' });
    const list = el('div', { class: 'chips' });
    const counter = el('span', { class: 'count' });

    function pickFlower(f){
      push();
      if (single && f.tab !== 'foliage') update(s => { s.items = s.items.filter(i => byId[i.flower].tab === 'foliage'); });   // 한 송이: 메인 꽃은 1송이
      if (single && f.tab === 'foliage' && state.items.filter(i => byId[i.flower].tab === 'foliage').length >= SINGLE_FOLIAGE){ hist.pop(); return toast(t('send.flowers.full', { max: SINGLE_FOLIAGE })); }
      if (!addFlower(f.id)){ hist.pop(); toast(f.pending ? t('send.flowers.pendingHint') : t('send.flowers.full', { max: MAX_ITEMS })); }
    }
    function drawList(){
      tabBar.replaceChildren(...tabs.map(k => el('button', { class: k === tab ? 'on' : '', onclick: () => { tab = k; drawList(); } }, t('send.flowers.tabs.' + k))));
      list.replaceChildren();
      if (tab === 'wrap'){
        for (const w of ['paper', 'kraft']) list.append(chip(t('send.flowers.wrap.' + w), { cls: state.wrap === w ? 'today' : '', onclick: () => update(s => { s.wrap = w; }) }));
        return;
      }
      const flowers = CATALOG.filter(f => f.tab === tab), hl = flowers.find(f => f.id === today.highlight);
      for (const f of [...flowers].sort((a, b) => (b === hl) - (a === hl))){
        const open = isOpen(f, today), cls = (f === hl ? 'today ' : '') + (!open ? 'locked ' : '') + (f.pending ? 'pending' : '');   // soon: 아직 3D가 없는 잠긴 자리(회색+흰 그라디언트)
        const label = f === hl ? `${t('send.flowers.today')} · ${f.name}` : f.name;
        list.append(chip(label, { dot: f.dot, cls, info: f.soon ? null : () => L.say(t('send.flowers.meaning', { 꽃: f.name, 뜻: f.meaning })),
          onclick: () => f.soon ? toast(t('send.flowers.lockedNote')) : open ? pickFlower(f) : toast(`${f.name} · ${t('send.flowers.lockedHint')}`) }));
      }
      list.append(el('p', { class: 'note', style: { width: '100%', margin: '6px 0 0' } }, t('send.flowers.lockedNote')));
    }
    const next = el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '12px' }, onclick: () => state.items.length ? ctx.go('send-2-card') : toast(t('send.flowers.empty')) }, t('send.flowers.next'));
    L.addSheet([actions, tabBar, list, el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '10px' } }, counter,
      single ? el('span', { class: 'note' }, t('send.flowers.wrapFixed')) : null), next]);

    const off = subscribe(() => { counter.textContent = t('send.flowers.count', { n: state.items.length, max: single ? 1 + SINGLE_FOLIAGE : MAX_ITEMS }); if (tab === 'wrap') drawList(); render3d(); });
    drawList(); counter.textContent = t('send.flowers.count', { n: state.items.length, max: single ? 1 + SINGLE_FOLIAGE : MAX_ITEMS }); render3d();
    return () => { off(); L.dispose(); };
  },
};
