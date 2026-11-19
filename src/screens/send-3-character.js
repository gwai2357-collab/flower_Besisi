// S3 캐릭터: 닉네임은 여기서. 기본 / 랜덤 / 확정. 건너뛰면 랜덤 캐릭터. 아래 옵션 패널은 꽃 고르기와 같은 탭·칩 방식.
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout, chip } from './_kit.js';
import { makeCharacter, CHARACTER_PRESETS, randomCharacter } from '../scene3d/character.js';
import { state, update, setNickname } from '../state.js';

const SWATCH = {
  skin: ['#fbe0cf', '#f2c9a5', '#e8b995', '#d9a77c', '#b98260'],
  hair: ['#2b2224', '#5a3a2a', '#8a6a4a', '#e9b44c', '#b86a5a', '#4a5c8a'],
  outfit: ['#8fb8de', '#e88fa5', '#9bc28a', '#f2d27a', '#d9d2f0', '#f0f0ea'],
};
const PART_LABEL = { skin: '피부', hair: '머리', outfit: '옷' };

export default {
  id: 'send-3-character', flow: 'send', title: '캐릭터',
  mount(ctx){
    const L = layout(ctx, t('send.character.bubble'));
    if (!state.character.look) update(s => { s.character.look = { ...CHARACTER_PRESETS[0] }; });
    let tab = 'skin';
    const hold = { items: state.items, wrap: state.wrap };
    const show = () => ctx.stage.show(makeCharacter(state.character.look, { holdBouquet: hold }), { target: [0, 0.42, 0], camera: [0, 0.55, 1.9], keepCamera: !!ctx.stage.content });
    const nick = el('input', { class: 'field', maxlength: 12, placeholder: t('send.character.nicknamePh'), value: state.character.nickname, oninput: e => setNickname(e.target.value) });
    const tabBar = el('div', { class: 'tabs' }), chips = el('div', { class: 'chips' });
    const draw = () => {
      tabBar.replaceChildren(...Object.keys(SWATCH).map(k => el('button', { class: k === tab ? 'on' : '', onclick: () => { tab = k; draw(); } }, PART_LABEL[k])));
      chips.replaceChildren(...SWATCH[tab].map(c => chip('', { dot: c, cls: state.character.look[tab] === c ? 'today' : '', onclick: () => { update(s => { s.character.look[tab] = c; s.character.confirmed = false; }); draw(); show(); } })));
    };
    let presetI = 0;
    const row = el('div', { class: 'row', style: { marginTop: '8px' } },
      el('button', { class: 'btn', onclick: () => { presetI = (presetI + 1) % CHARACTER_PRESETS.length; update(s => { s.character.look = { ...CHARACTER_PRESETS[presetI] }; s.character.confirmed = false; }); draw(); show(); } }, t('send.character.basic')),
      el('button', { class: 'btn', onclick: () => { update(s => { s.character.look = randomCharacter(); s.character.confirmed = false; }); draw(); show(); } }, '🎲 ' + t('send.character.random')),
      el('button', { class: 'btn primary', onclick: () => { update(s => { s.character.confirmed = true; }); toast(t('send.character.confirmed')); } }, t('send.character.confirm')),
      el('button', { class: 'btn', onclick: () => { const a = el('a', { href: ctx.stage.canvas.toDataURL('image/png'), download: 'character.png' }); a.click(); } }, '⬇'));
    L.addSheet([el('p', { class: 'note', style: { marginTop: 0 } }, t('send.character.tip')),
      el('div', { class: 'kv' }, el('span', {}, t('send.character.nickname')), nick), row, tabBar, chips,
      el('p', { class: 'note' }, t('send.character.skipHint')),
      el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '8px' }, onclick: () => { if (!state.character.confirmed) update(s => { s.character.look = randomCharacter(); }); ctx.go('send-4-share'); } }, t('send.character.next'))]);
    draw(); show();
    return () => L.dispose();
  },
};
