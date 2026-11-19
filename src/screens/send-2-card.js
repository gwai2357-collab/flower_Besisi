// S2 카드 + 선물: 편지 카드가 크게, 뒤로 소포가 살짝. 기울기 센서가 있으면 카드가 은은하게 흔들림.
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { preview } from '../scene3d/previews.js';
import { giftSection } from './gift-section.js';
import { state, update, PAPER_COLORS, paperColor } from '../state.js';

export default {
  id: 'send-2-card', flow: 'send', title: '카드와 선물',
  mount(ctx){
    const L = layout(ctx, t('send.card.bubble'));
    const p = preview('gift'); ctx.stage.show(p.obj, { ...p.opts, camera: [0.2, 0.35, 1.1], target: [0, 0.12, 0] });
    const lt = state.letter;

    const paintPaper = () => ctx.root.style.setProperty('--paper', paperColor());
    const to = el('input', { class: 'field', placeholder: t('send.card.toPh'), value: lt.to, oninput: e => update(s => { s.letter.to = e.target.value; }) });
    const ta = el('textarea', { placeholder: t('send.card.textPh'), maxlength: 300, oninput: e => { update(s => { s.letter.text = e.target.value; }); count.textContent = t('send.card.limit', { n: e.target.value.length }); } }); ta.value = lt.text;
    const count = el('span', { class: 'count' }, t('send.card.limit', { n: lt.text.length }));

    // 펜: 카드 위에 그림 그리기 (그림은 같은 기기에서만 보임 — 링크에는 담지 않음)
    const cv = el('canvas', { class: 'draw', width: 600, height: 300, hidden: true });
    const cx = cv.getContext('2d'); cx.lineWidth = 6; cx.lineCap = 'round'; cx.strokeStyle = '#4a3a30';
    if (lt.drawing){ const im = new Image(); im.onload = () => cx.drawImage(im, 0, 0); im.src = lt.drawing; }
    let drawing = false;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
    cv.addEventListener('pointerdown', e => { drawing = true; cv.setPointerCapture(e.pointerId); cx.beginPath(); cx.moveTo(...pos(e)); });
    cv.addEventListener('pointermove', e => { if (drawing){ cx.lineTo(...pos(e)); cx.stroke(); } });
    cv.addEventListener('pointerup', () => { drawing = false; update(s => { s.letter.drawing = cv.toDataURL(); }); });

    const swatches = el('div', { class: 'swatches' });
    const drawSwatches = () => swatches.replaceChildren(
      el('button', { class: !lt.paper ? 'on' : '', title: 'auto', style: { background: 'linear-gradient(135deg,#fff,#f4c6d3)' }, onclick: () => { update(s => { s.letter.paper = null; }); paintPaper(); drawSwatches(); } }),
      ...PAPER_COLORS.map(c => el('button', { class: lt.paper === c ? 'on' : '', style: { background: c }, onclick: () => { update(s => { s.letter.paper = c; }); paintPaper(); drawSwatches(); } })));
    const tool = (txt, label, fn) => el('button', { class: 'btn', 'aria-label': label, onclick: fn }, txt);
    const tools = el('div', { class: 'row', style: { marginTop: '8px' } },
      tool('T', t('send.card.tools.text'), () => { cv.hidden = true; ta.hidden = false; ta.focus(); }),
      tool('✎', t('send.card.tools.pen'), () => { cv.hidden = !cv.hidden; ta.hidden = !cv.hidden; }),
      tool('●', t('send.card.tools.color'), () => { const c = PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)]; update(s => { s.letter.paper = c; }); paintPaper(); drawSwatches(); }),
      tool('🎙', t('send.card.tools.mic'), () => toast(t('send.card.micSoon'))),
      el('span', { class: 'spacer' }), count);
    const rel = el('div', { class: 'tabs', style: { marginTop: '10px' } },
      ...['friend', 'love'].map(k => el('button', { class: lt.relation === k ? 'on' : '', onclick: e => { update(s => { s.letter.relation = k; }); [...rel.children].forEach(b => b.classList.toggle('on', b === e.target)); } }, t('send.card.relation.' + k))));

    const giftBox = el('div', { hidden: true, style: { marginTop: '10px' } }, giftSection(() => ctx.go('send-3-character')));
    const askRow = el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '10px' } }, el('span', {}, t('send.card.giftAsk')),
      el('div', { class: 'row' },
        el('button', { class: 'btn' + (state.gift.has ? ' primary' : ''), onclick: e => { update(s => { s.gift.has = true; }); giftBox.hidden = false; giftBox.style.animation = 'fade .35s'; e.target.classList.add('primary'); e.target.nextSibling.classList.remove('primary'); } }, '✓ ' + t('send.card.yes')),
        el('button', { class: 'btn' + (!state.gift.has ? ' primary' : ''), onclick: e => { update(s => { s.gift.has = false; }); giftBox.hidden = true; e.target.classList.add('primary'); e.target.previousSibling.classList.remove('primary'); } }, '✗ ' + t('send.card.no'))));
    if (state.gift.has) giftBox.hidden = false;

    const card = el('div', { class: 'letter' }, el('div', { class: 'row' }, el('b', {}, t('send.card.to')), to), cv, ta, tools);
    const scroller = el('div', { style: { overflowY: 'auto', flex: '1 1 auto', paddingBottom: '90px', pointerEvents: 'auto' } },
      el('div', { style: { height: '8vh' } }), card, el('div', { style: { padding: '10px var(--gutter)' } }, el('div', { class: 'row', style: { justifyContent: 'center' } }, swatches), rel, askRow, giftBox));
    L.spacer.replaceWith(scroller);
    ctx.root.append(el('div', { style: { position: 'fixed', left: 0, right: 0, bottom: 0, padding: '10px var(--gutter) calc(10px + env(safe-area-inset-bottom))', maxWidth: '520px', margin: '0 auto', zIndex: 3 } },
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: () => ctx.go('send-3-character') }, t('send.card.next'))));
    paintPaper(); drawSwatches();

    // 기울기 센서가 있으면 카드가 은은하게 흔들림 (없으면 생략)
    const tilt = e => { if (e.gamma == null) return; card.style.transform = `perspective(600px) rotateY(${Math.max(-8, Math.min(8, e.gamma / 6))}deg) rotateX(${Math.max(-6, Math.min(6, (e.beta - 45) / 8))}deg)`; };
    window.addEventListener('deviceorientation', tilt);
    return () => { window.removeEventListener('deviceorientation', tilt); L.dispose(); };
  },
};
