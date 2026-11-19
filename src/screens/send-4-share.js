// S4 보내기: 카톡 공유 썸네일 템플릿(A 빼꼼 / B 얼굴 가까이, 꽃 전체는 안 보이게) + 링크 복사 / 공유하기 / QR / 의견 보내기
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { makeCharacter, CHARACTER_PRESETS } from '../scene3d/character.js';
import { state, encodeGift } from '../state.js';

export default {
  id: 'send-4-share', flow: 'send', title: '보내기',
  mount(ctx){
    const L = layout(ctx, t('send.share.bubble'));
    const variants = [
      { name: t('send.share.thumbA'), camera: [0, 0.18, 1.5], target: [0, 0.28, 0] },     // 캐릭터가 아래에서 빼꼼, 다발은 일부만
      { name: t('send.share.thumbB'), camera: [0, 0.55, 0.85], target: [0, 0.55, 0] },    // 얼굴 가까이
    ];
    let v = 0;
    const label = el('div', { class: 'hint' });
    const show = n => {
      v = (n + variants.length) % variants.length; const o = variants[v];
      ctx.stage.show(makeCharacter(state.character.look || CHARACTER_PRESETS[0], { holdBouquet: { items: state.items, wrap: state.wrap } }), { camera: o.camera, target: o.target, y: v === 0 ? -0.12 : 0 });
      label.textContent = `${t('send.share.thumb')} · ${o.name}`;
    };
    ctx.root.append(el('button', { class: 'arrow l', onclick: () => show(v - 1) }, '◁'), el('button', { class: 'arrow r', onclick: () => show(v + 1) }, '▷'));
    show(0);
    const link = () => `${location.origin}${location.pathname}#r=${encodeGift()}`;
    L.addSheet([label, el('p', { class: 'note', style: { textAlign: 'center' } }, t('send.share.thumbNote')),
      el('div', { class: 'row', style: { marginTop: '10px' } },
        el('button', { class: 'btn big', onclick: async () => { await copyText(link()); toast(t('common.copied')); } }, t('send.share.copyLink')),
        el('button', { class: 'btn big primary', onclick: async () => { if (navigator.share) { try { await navigator.share({ title: t('app.name'), url: link() }); } catch (e) {} } else { await copyText(link()); toast(t('common.copied')); } } }, t('send.share.share'))),
      el('button', { class: 'btn', style: { width: '100%', marginTop: '12px', textAlign: 'left' }, onclick: () => toast(t('send.share.qrSoon')) }, el('b', {}, t('send.share.qr')), el('div', { class: 'note', style: { margin: 0 } }, t('send.share.qrSub'))),
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } },
        el('button', { class: 'btn ghost', onclick: () => ctx.go('receive-0-arrive', { code: encodeGift() }) }, '▶ 받는 사람 화면 미리보기'),
        el('button', { class: 'btn ghost', onclick: () => toast(t('common.feedbackSoon')) }, t('common.feedback')))]);
    return () => L.dispose();
  },
};
