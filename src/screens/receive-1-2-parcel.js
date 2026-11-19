// R1-2 소포: 크게 보이는 소포를 한 번 누르면 개봉선 띠가 말리며 뜯기고, 선물이 튀어나온다. (선물 오브젝트 v11 그대로)
import * as THREE from 'three';
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { parcelObj } from '../scene3d/previews.js';
import { makeGiftObject } from '../scene3d/gifts.js';
import { GIFTS } from '../data/gifts.js';
import { getData, senderName, rx } from './receive-kit.js';

const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const bounce = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3) * Math.cos(x * 9) ;   // 튀어나온 뒤 살짝 출렁

export default {
  id: 'receive-1-2-parcel', flow: 'receive', title: '소포',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage, g = d.gift, name = senderName(d);
    const L = layout(ctx, g ? t('receive.parcel.tap') : t('receive.parcel.none'));
    const world = new THREE.Group(), parcel = parcelObj(0.42); parcel.position.y = 0.0; world.add(parcel);
    let gift = null;
    if (g){ gift = makeGiftObject(g.kind || 'cake'); gift.scale.setScalar(0.0001); gift.position.set(0, 0.4, 0.1); world.add(gift); }
    st.show(world, { target: [0, 0.3, 0], camera: [0.25, 0.8, 2.1], sway: false, minDistance: 0.8 });
    let phase = rx.giftOpened ? 'done' : 'closed', t0 = 0;
    const show = () => {
      const gname = GIFTS.find(x => x.id === g.kind)?.name || '선물';
      const code = g.code || 'GF4K-82QT-7735-NX09';
      L.say(t('receive.parcel.sent', { 이름: name }));
      L.addSheet([
        g.ask ? el('p', { style: { margin: '0 0 8px' } }, `“${g.ask}”`) : null,
        el('div', { class: 'row' }, el('b', {}, gname), el('span', { class: 'spacer' }), el('span', { class: 'count' }, code),
          el('button', { class: 'btn', onclick: async () => { await copyText(code); toast(t('common.copied')); } }, t('receive.parcel.copy'))),
        el('button', { class: 'btn', style: { width: '100%', marginTop: '8px' }, onclick: () => toast(t('receive.parcel.boxSoon')) }, t('receive.parcel.box')),
        el('p', { class: 'note' }, '• ' + t('receive.parcel.note1')), el('p', { class: 'note', style: { marginTop: '2px' } }, '• ' + t('receive.parcel.note2')),
        el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '10px' }, onclick: () => { rx.giftOpened = true; ctx.go('receive-2-dome'); } }, t('receive.keep'))], { grab: false });
    };
    const off = st.onTap(e => { if (phase === 'closed' && g && st.pick(e, [parcel])){ phase = 'peel'; t0 = performance.now(); L.say(''); rx.giftOpened = true; } });
    const off2 = st.onFrame(() => {
      const e = (performance.now() - t0) / 1000;
      if (phase === 'peel'){ parcel.userData.setFlaps(Math.min(2.15, ease(e / 1.5) * 2.15)); if (e > 1.5){ phase = 'pop'; t0 = performance.now(); } }
      else if (phase === 'pop' && gift){ const k = e / 0.9; gift.scale.setScalar(0.0001 + 0.4 * bounce(k)); gift.position.y = 0.35 + 0.35 * Math.sin(Math.min(1, k) * Math.PI) * (1 - Math.min(1, k) * 0.3); gift.rotation.y += 0.04; if (k >= 1){ phase = 'done'; show(); } }
      else if (phase === 'done' && gift){ gift.rotation.y += 0.01; }
    });
    if (phase === 'done' && g){ parcel.userData.setFlaps(2.2); gift.scale.setScalar(0.4); gift.position.y = 0.55; show(); }
    else if (!g) L.addSheet([], { grab: false });
    return () => { off(); off2(); L.dispose(); };
  },
};
