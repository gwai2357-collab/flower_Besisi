// S4 보내기: 카톡 공유 썸네일 템플릿(A 빼꼼 / B 얼굴 가까이)을 액자 안에서 ◁ ▷ 로 넘겨 보고, 링크 복사 / 공유하기 / QR / 의견 보내기.
// 서프라이즈를 위해 꽃 전체는 보이지 않게 한다.
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { charObj, DEFAULT_LOOK } from '../scene3d/previews.js';
import { state, encodeGift } from '../state.js';

export default {
  id: 'send-4-share', flow: 'send', title: '보내기',
  mount(ctx){
    const L = layout(ctx, t('send.share.bubble'));
    const variants = [
      { name: t('send.share.thumbA'), camera: [0, 0.2, 2.4], target: [0, 0.16, 0], y: -0.32 },    // 캐릭터가 아래에서 빼꼼, 다발은 일부만
      { name: t('send.share.thumbB'), camera: [0, 0.98, 1.25], target: [0, 0.98, 0], y: 0 },      // 얼굴 가까이
    ];
    let v = 0;
    const label = el('div', { class: 'hint' });
    const frame = el('div', { class: 'frame', style: { width: 'calc(100% - 2 * var(--gutter) - 90px)' } });
    const show = n => {
      v = (n + variants.length) % variants.length; const o = variants[v];
      ctx.stage.show(charObj(state.character.look || DEFAULT_LOOK(), { items: state.items, wrap: state.wrap }), { camera: o.camera, target: o.target, y: o.y, minDistance: 0.6 });
      label.textContent = `${t('send.share.thumb')} · ${o.name}`;
    };
    // 3D가 보이는 빈 자리 한가운데에 3:2 액자, 양옆에 ◁ ▷
    L.spacer.replaceWith(el('div', { class: 'spacer', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--gutter)' } },
      el('button', { class: 'iconbtn', onclick: () => show(v - 1) }, '◁'), frame, el('button', { class: 'iconbtn', onclick: () => show(v + 1) }, '▷')));
    show(0);
    const link = () => `${location.origin}${location.pathname}#r=${encodeGift()}`;
    const copy = async () => { await copyText(link()); toast(t('common.copied')); };
    const share = async () => { if (navigator.share){ try { await navigator.share({ title: t('app.name'), url: link() }); } catch (e) {} } else await copy(); };
    L.addSheet([label, el('p', { class: 'note', style: { textAlign: 'center' } }, t('send.share.thumbNote')),
      el('div', { class: 'row', style: { marginTop: '8px' } },
        el('input', { class: 'field', readonly: true, value: '…' + link().slice(-26), style: { flex: 1 } }),
        el('button', { class: 'iconbtn', 'aria-label': t('send.share.copyLink'), onclick: copy }, '⧉'),
        el('button', { class: 'iconbtn', 'aria-label': t('send.share.share'), onclick: share }, '⇪')),
      el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '10px' } },
        el('button', { class: 'btn', onclick: () => toast(t('send.share.qrSoon')) }, '▦ ' + t('send.share.qr'))),
      el('p', { class: 'note', style: { textAlign: 'right' } }, t('send.share.qrSub')),
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } },
        el('button', { class: 'btn ghost', onclick: () => ctx.go('receive-0-arrive', { code: encodeGift() }) }, '▶ 받는 사람 화면 미리보기'),
        el('button', { class: 'btn ghost', onclick: () => toast(t('common.feedbackSoon')) }, t('common.feedback')))], { grab: false });
    return () => L.dispose();
  },
};
