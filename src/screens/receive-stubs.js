// 받기 화면 (3단계 PR에서 본격 제작). 지금은 링크가 열리는지 확인할 R0와, 나머지는 자리만.
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, BOUQUET_CAM, DEMO_BOUQUET } from '../scene3d/previews.js';
import { decodeGift, state } from '../state.js';
import { makeCharacter, CHARACTER_PRESETS } from '../scene3d/character.js';

const stub = (id, title) => ({ id, flow: 'receive', title,
  mount(ctx){
    const L = layout(ctx, t('receive.soon') + `<br><small>${id}</small>`);
    ctx.stage.show(bouquetObj(DEMO_BOUQUET), BOUQUET_CAM);
    return () => L.dispose();
  } });

const arrive = { id: 'receive-0-arrive', flow: 'receive', title: '도착',
  mount(ctx){
    const d = (ctx.params.code && decodeGift(ctx.params.code)) || { items: state.items.length ? state.items : DEMO_BOUQUET, wrap: state.wrap, from: { nick: state.character.nickname, look: state.character.look } };
    const nick = d.from?.nick || '누군가';
    const L = layout(ctx, `<b>${nick}</b>이(가) 보낸 꽃다발이 도착했어요!<br>꽃을 눌러 받아 주세요.`);
    const look = d.from?.look || CHARACTER_PRESETS[0];
    ctx.stage.show(makeCharacter(look, { holdBouquet: { items: d.items, wrap: d.wrap } }), { target: [0, 0.45, 0], camera: [0, 0.6, 1.9] });
    ctx.stage.ditherIn();
    return () => L.dispose();
  } };

export default [arrive, stub('receive-1-look', '바라보기'), stub('receive-1-1-card', '카드'), stub('receive-1-2-parcel', '소포'),
  stub('receive-2-dome', '유리돔'), stub('receive-3-thanks', '답례'), stub('receive-4-box', '보관함')];
