// S3 캐릭터 (스케치: 말풍선 + 다발을 든 캐릭터 + 기본/랜덤/확정 + 옵션 패널). 캐릭터와 옵션은 캐릭터 실험 v0 그대로.
// 닉네임은 여기서 받는다(브라우저에 기억해 다음엔 미리 채움). 건너뛰면 랜덤 캐릭터, 확정하면 그 캐릭터로 고정.
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { charObj, CHAR_CAM, DEFAULT_LOOK } from '../scene3d/previews.js';
import { newSpec, randomSpec, mountCharacterOptions, SIX, NAMES } from '../scene3d/characters.js';
import { state, update, setNickname } from '../state.js';

export default {
  id: 'send-3-character', flow: 'send', title: '캐릭터',
  mount(ctx){
    const L = layout(ctx, t('send.character.bubble'));
    if (!state.character.look) update(s => { s.character.look = DEFAULT_LOOK(); });
    const hold = () => ({ items: state.items, wrap: state.wrap });
    const show = (obj, keep) => ctx.stage.show(obj, { ...CHAR_CAM, keepCamera: keep, minDistance: 1.2 });
    const opts = el('div', { class: 'charopts' }), kinds = el('div', { class: 'seg wrap', style: { marginBottom: '8px' } });
    const mount = () => {
      const spec = state.character.look;
      mountCharacterOptions(opts, spec, obj => { update(s => { s.character.confirmed = false; }); show(obj, true); }, { make: () => charObj(state.character.look, hold()), current: ctx.stage.content });
      kinds.replaceChildren(...SIX.map(k => el('button', { class: spec.k === k ? 'on' : '', onclick: () => { update(s => { s.character.look = newSpec(k); s.character.confirmed = false; }); change(); } }, NAMES[k])));
    };
    const change = () => { show(charObj(state.character.look, hold()), true); mount(); };
    const nick = el('input', { class: 'field', maxlength: 12, placeholder: t('send.character.nicknamePh'), value: state.character.nickname, oninput: e => setNickname(e.target.value) });
    let i = 0;
    const row = el('div', { class: 'row', style: { margin: '8px 0' } },
      el('button', { class: 'btn', onclick: () => { i = (i + 1) % SIX.length; update(s => { s.character.look = newSpec(SIX[i]); s.character.confirmed = false; }); change(); } }, t('send.character.basic')),
      el('button', { class: 'btn', onclick: () => { update(s => { s.character.look = randomSpec(); s.character.confirmed = false; }); change(); } }, '🎲 ' + t('send.character.random')),
      el('button', { class: 'btn primary', onclick: () => { update(s => { s.character.confirmed = true; }); toast(t('send.character.confirmed')); } }, t('send.character.confirm')),
      el('span', { class: 'spacer' }),
      el('button', { class: 'btn', 'aria-label': t('send.character.save'), onclick: () => { const a = el('a', { href: ctx.stage.canvas.toDataURL('image/png'), download: 'character.png' }); a.click(); } }, '⬇'));
    L.addSheet([el('p', { class: 'note', style: { marginTop: 0 } }, t('send.character.tip')),
      el('div', { class: 'row' }, el('b', { style: { whiteSpace: 'nowrap' } }, t('send.character.nickname')), nick), row, kinds, opts,
      el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '10px' }, onclick: () => { if (!state.character.confirmed) update(s => { s.character.look = randomSpec(); }); ctx.go('send-4-share'); } }, t('send.character.next'))]);
    show(charObj(state.character.look, hold()), false); mount();
    return () => L.dispose();
  },
};
