// 선물 추가 영역 (S2-1). 카드 화면에서 "선물 있어요"를 누르면 스르르 나타나고, 따로 한 화면(send-2-1-gift)으로도 쓴다.
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { chip } from './_kit.js';
import { GIFTS } from '../data/gifts.js';
import { state, update } from '../state.js';

export function giftSection(onDone){
  const g = state.gift, list = el('div', { class: 'chips' });   // state.gift.kind는 선물 템플릿 id
  const mysteryIn = el('input', { class: 'field', maxlength: 14, placeholder: t('send.gift.mysteryPh'), value: g.mystery, oninput: e => update(s => { s.gift.mystery = e.target.value; }) });
  const mysteryRow = el('div', { class: 'kv', hidden: !GIFTS.find(x => x.id === g.kind)?.mystery }, el('span', {}, t('send.gift.mysteryName')), mysteryIn);
  const draw = () => {
    list.replaceChildren(...GIFTS.map(x => chip(x.name, { cls: state.gift.kind === x.id ? 'today' : '', onclick: () => { update(s => { s.gift.kind = x.id; }); mysteryRow.hidden = !x.mystery; draw(); } })));
  };
  draw();
  const code = el('input', { class: 'field', placeholder: t('send.gift.codePh'), value: g.code, oninput: e => update(s => { s.gift.code = e.target.value; }) });
  const paste = el('button', { class: 'btn', onclick: async () => { try { const v = await navigator.clipboard.readText(); code.value = v; update(s => { s.gift.code = v; }); } catch (e) { toast(t('common.fakeAction')); } } }, t('send.gift.paste'));
  const ask = el('input', { class: 'field', placeholder: t('send.gift.askPh'), value: g.ask, oninput: e => update(s => { s.gift.ask = e.target.value; }) });
  return el('div', { class: 'gift-section' },
    el('div', { class: 'row' }, el('b', { style: { whiteSpace: 'nowrap' } }, t('send.gift.code')), code, paste),
    el('h2', { style: { marginTop: '12px' } }, t('send.gift.kind')), list, mysteryRow,
    el('h2', { style: { marginTop: '12px' } }, t('send.gift.ask')), ask,
    el('p', { class: 'note' }, '• ' + t('send.gift.note1')), el('p', { class: 'note', style: { marginTop: '2px' } }, '• ' + t('send.gift.note2')),
    el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '12px' }, onclick: onDone }, t('send.gift.confirm')));
}
