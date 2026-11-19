// R1 바라보기: 캐릭터는 옆으로 쏙 빠지고, 다발(카드 꽂힘) 옆에 소포가 처음부터 놓여 있다.
// 카드를 먼저 눌러 보게 이끈다: 카드를 열기 전에 소포를 누르면 안내만 나오고 열리지 않는다.
import * as THREE from 'three';
import { el } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, charObj, parcelObj, BOUQUET_CAM } from '../scene3d/previews.js';
import { getData, senderName, rx } from './receive-kit.js';

export default {
  id: 'receive-1-look', flow: 'receive', title: '바라보기',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage, name = senderName(d), hasGift = !!d.gift;
    const L = layout(ctx, hasGift ? t('receive.look') : t('receive.lookNoGift'));
    const scene = new THREE.Group(), bq = bouquetObj(d.items, d.wrap); scene.add(bq);
    let parcel = null;
    if (hasGift){ parcel = parcelObj(0.24); parcel.position.set(0.42, 0.04, 0.5); parcel.rotation.set(0, -0.5, 0); scene.add(parcel); }
    // 캐릭터가 왼쪽으로 빠지는 연출 (처음 들어올 때만)
    let ch = null;
    if (!rx.cardRead){
      ch = charObj({ ...d.from.look, pose: 1 }, { items: d.items, wrap: d.wrap }); ch.position.set(-0.1, 0, 0.9); ch.scale.setScalar(1.0); scene.add(ch);
      const t0 = performance.now(); const off0 = st.onFrame(() => { const k = Math.min(1, (performance.now() - t0) / 1600); ch.position.x = -0.1 - 2.2 * k * k; if (k >= 1){ scene.remove(ch); off0(); } });
    }
    st.show(scene, { target: [0.12, 0.55, 0], camera: [0.25, 0.8, 2.2], sway: false, minDistance: 0.8 });
    scene.userData = { noteMesh: bq.userData.noteMesh, tagPivot: bq.userData.tagPivot };   // 카드가 살짝 움직여 눌러 보라고 알려 줌

    const off = st.onTap(e => {
      if (bq.userData.noteMesh && st.pick(e, [bq.userData.noteMesh])) return ctx.go('receive-1-1-card');
      if (parcel && st.pick(e, [parcel])){
        if (!rx.cardRead) return L.say(t('receive.cardFirst', { 이름: name }));
        ctx.go('receive-1-2-parcel');
      }
    });
    // 카드를 읽었고(선물이 없거나 이미 열었으면) 보관하기 버튼이 나옴
    if (rx.cardRead && (!hasGift || rx.giftOpened)){
      L.addSheet([el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: () => ctx.go('receive-2-dome') }, t('receive.keep'))], { grab: false });
    }
    return () => { off(); L.dispose(); };
  },
};
