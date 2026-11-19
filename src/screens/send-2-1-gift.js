// S2-1 선물 추가 (따로 한 화면으로 볼 때): 3D 소포(드래그로 돌려 보기 + 기울기) + 말풍선 + 선물코드 + 선물 종류
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { parcelObj } from '../scene3d/previews.js';
import { giftSection } from './gift-section.js';
import { update } from '../state.js';

export default {
  id: 'send-2-1-gift', flow: 'send', title: '선물 추가',
  mount(ctx){
    const L = layout(ctx, t('send.gift.bubble'));
    const p = parcelObj(0.5); p.rotation.set(0.15, -0.5, 0);
    ctx.stage.show(p, { target: [0, 0.12, 0], camera: [0.3, 0.55, 1.45], sway: false, y: 0 });
    let tx = 0;
    const tilt = e => { if (e.gamma != null) tx = Math.max(-1, Math.min(1, e.gamma / 30)); };   // 센서에 맞춰 + 드래그로 회전
    window.addEventListener('deviceorientation', tilt);
    const off = ctx.stage.onFrame((dt, tm) => { p.rotation.y += ((-0.5 + tx * 0.35) - p.rotation.y) * 0.05; p.position.y = Math.sin(tm) * 0.01; });
    L.addSheet(giftSection(() => { update(s => { s.gift.has = true; }); ctx.go('send-3-character'); }), { tall: true });
    return () => { off(); window.removeEventListener('deviceorientation', tilt); L.dispose(); };
  },
};
