// S2-1 선물 추가 (따로 한 화면으로 볼 때): 3D 소포(드래그로 돌려 보기) + 말풍선 + 선물 영역
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { preview } from '../scene3d/previews.js';
import { giftSection } from './gift-section.js';
import { update } from '../state.js';

export default {
  id: 'send-2-1-gift', flow: 'send', title: '선물 추가',
  mount(ctx){
    const L = layout(ctx, t('send.gift.bubble'));
    const p = preview('gift'); ctx.stage.show(p.obj, p.opts);
    L.addSheet(giftSection(() => { update(s => { s.gift.has = true; }); ctx.go('send-3-character'); }), { tall: true });
    return () => L.dispose();
  },
};
