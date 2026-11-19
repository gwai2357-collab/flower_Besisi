// R0 도착: 디더링이 풀리며 선명해지고, 캐릭터가 다발을 내민다. 다발(캐릭터)을 눌러야 받는다.
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { charObj, CHAR_CAM } from '../scene3d/previews.js';
import { getData, senderName } from './receive-kit.js';

export default {
  id: 'receive-0-arrive', flow: 'receive', title: '도착',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage;
    const L = layout(ctx, t('receive.arrive', { 이름: senderName(d) }));
    const ch = charObj({ ...d.from.look, pose: 1 }, { items: d.items, wrap: d.wrap });
    st.show(ch, { ...CHAR_CAM, sway: false, minDistance: 1.2 });
    st.ditherIn();
    const off = st.onTap(e => { if (st.pick(e, [ch])) ctx.go('receive-1-look'); });
    return () => { off(); L.dispose(); };
  },
};
