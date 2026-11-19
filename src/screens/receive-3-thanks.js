// R3 답례 (가입 없이도 가능): 한 송이 답례하기(꽃 고르기 재사용, 메인 꽃 1개) / 감사 스냅 찍기 / 보관함 가기
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { charObj, CHAR_CAM, DEFAULT_LOOK, DEMO_SINGLE } from '../scene3d/previews.js';
import { state, setMode } from '../state.js';
import { getData } from './receive-kit.js';

export default {
  id: 'receive-3-thanks', flow: 'receive', title: '답례',
  mount(ctx){
    getData(ctx);
    const L = layout(ctx, t('receive.thanks.bubble'));
    // 받은 사람 자신의 캐릭터가 방금 받은 꽃을 들고 있음 (캐릭터가 없으면 기본 캐릭터)
    ctx.stage.show(charObj(state.character.look || DEFAULT_LOOK(), { items: DEMO_SINGLE, wrap: 'kraft' }), { ...CHAR_CAM, minDistance: 1.2 });
    L.addSheet([
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: () => { setMode('single'); ctx.go('send-1-flowers'); } }, t('receive.thanks.single')),
      el('button', { class: 'btn big', style: { width: '100%', marginTop: '8px' }, onclick: () => { if (!state.character.confirmed) ctx.go('send-3-character'); else toast(t('receive.thanks.snapSoon')); } }, t('receive.thanks.snap')),
      el('button', { class: 'btn big', style: { width: '100%', marginTop: '8px' }, onclick: () => ctx.go('receive-4-box') }, t('receive.thanks.box'))], { grab: false });
    return () => L.dispose();
  },
};
