// S2 카드 + 선물: 편지지는 3D(PS1)로 크게 보이고, 뒤로 소포가 살짝 보인다. 휴대폰을 기울이면 편지지가 은은하게 흔들린다.
// 글자 쓰기·그림 그리기는 편지지 위에 맞춰 얹은 입력 칸(HTML)으로 하고, 끝나면 3D 편지지에 반영된다.
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { parcelObj } from '../scene3d/previews.js';
import { makeLetter, CW, CH } from '../scene3d/letter.js';
import { giftSection } from './gift-section.js';
import { state, update, PAPER_COLORS, paperColor } from '../state.js';

export default {
  id: 'send-2-card', flow: 'send', title: '카드와 선물',
  mount(ctx){
    const st = ctx.stage, THREE = st.THREE, lt = state.letter;
    const L = layout(ctx, t('send.card.bubble'));

    // ---- 3D: 편지지 + 뒤의 소포 ----
    const group = new THREE.Group(), letter = makeLetter({ hint: t('send.card.textPh') });
    const parcel = parcelObj(0.075); parcel.position.set(0.085, -0.1, -0.08); parcel.rotation.set(0.5, -0.5, 0.25);
    letter.group.position.y = -CH / 2;   // 펼친 편지는 [-CH/2, 3CH/2] 구간이라 가운데(0)에 오도록 내림
    const sheetG = new THREE.Group(); sheetG.add(letter.group); group.add(parcel, sheetG);
    st.setPS1({ height: 480 });   // 편지 글씨가 잘 보이게 이 화면만 PS1 효과(해상도 낮춤)를 줄임
    st.show(group, { fitable: true, camera: [0, 0.037, 0.43], target: [0, 0.037, 0], minDistance: 0.1, controls: false, sway: false, y: 0.0 });
    let img = null;
    let penMode = false;   // 펜 모드에서는 3D 편지지에 그림을 빼고(겹쳐 보이는 옛 그림 방지) 위에 얹은 그리기 칸만 보임
    const refresh = () => letter.setPaper({ text: lt.text, paper: paperColor(), drawing: penMode ? null : img, hint: t('send.card.textPh') });
    if (lt.drawing){ img = new Image(); img.onload = refresh; img.src = lt.drawing; }
    refresh();

    // ---- 편지지 위치(화면 좌표): 입력 칸을 3D 종이에 맞춰 얹기 ----
    const over = el('div', { style: { position: 'fixed', zIndex: 2, pointerEvents: 'none' } });
    ctx.root.append(over);
    const place = () => {
      const cam = st.camera, W = st.renderer.domElement.clientWidth, H = st.renderer.domElement.clientHeight, v = new THREE.Vector3();
      const pt = (x, y) => { v.set(x, y, 0.0008).applyMatrix4(sheetG.matrixWorld).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
      sheetG.updateMatrixWorld(true);
      const [x0, y0] = pt(-CW / 2, CH), [x1, y1] = pt(CW / 2, -CH);
      const box = st.renderer.domElement.getBoundingClientRect();
      Object.assign(over.style, { left: box.left + x0 + 'px', top: box.top + y0 + 'px', width: x1 - x0 + 'px', height: y1 - y0 + 'px' });
      over.dataset.k = (x1 - x0) / 512;   // 3D 종이 한 칸(512px 기준)이 화면에서 몇 px인지
    };
    const off = st.onFrame(place);
    new ResizeObserver(place).observe(st.renderer.domElement);

    // ---- 입력 칸(글자) / 펜(그림) ----
    const ta = el('textarea', { maxlength: 300, placeholder: t('send.card.textPh'), style: { position: 'absolute', inset: 0, width: '100%', height: '100%', resize: 'none', border: 0, outline: 'none', padding: '9% 10%', background: 'var(--paper)', color: '#4a3a30', fontFamily: 'var(--font-letter)', lineHeight: 1.8, pointerEvents: 'auto' }, hidden: true,
      oninput: e => { update(s => { s.letter.text = e.target.value; }); count.textContent = t('send.card.limit', { n: e.target.value.length }); refresh(); } });
    ta.value = lt.text;
    const pen = el('canvas', { width: 512, height: 708, hidden: true, style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto', touchAction: 'none' } });
    const cx = pen.getContext('2d'); cx.lineWidth = 7; cx.lineCap = 'round'; cx.strokeStyle = '#4a3a30';
    if (img) cx.drawImage(img, 0, 0, 512, 708);
    let down = false;
    const pos = e => { const r = pen.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * pen.width, (e.clientY - r.top) / r.height * pen.height]; };
    pen.addEventListener('pointerdown', e => { down = true; pen.setPointerCapture(e.pointerId); cx.beginPath(); cx.moveTo(...pos(e)); });
    pen.addEventListener('pointermove', e => { if (down){ cx.lineTo(...pos(e)); cx.stroke(); } });
    pen.addEventListener('pointerup', () => { down = false; const url = pen.toDataURL(); update(s => { s.letter.drawing = url; }); img = new Image(); img.onload = refresh; img.src = url; });
    const chipsBox = el('div', { class: 'paper-chips' });
    over.append(ta, pen, chipsBox);
    const clearBtn = el('button', { class: 'btn', hidden: true, style: { position: 'absolute', right: '4%', top: '3%', pointerEvents: 'auto', padding: '3px 8px' }, onclick: () => { cx.clearRect(0, 0, 512, 708); img = null; update(s => { s.letter.drawing = null; }); } }, '지우기');
    over.append(clearBtn);
    const mode = m => { penMode = m === 'pen'; ta.hidden = m !== 'text'; pen.hidden = m !== 'pen'; clearBtn.hidden = m !== 'pen'; over.style.pointerEvents = m ? 'auto' : 'none'; L.bubbleEl.style.visibility = m ? 'hidden' : ''; if (m === 'text') ta.focus(); refresh(); };
    const count = el('span', { class: 'count' }, t('send.card.limit', { n: lt.text.length }));
    const off3 = st.onTap(e => { if (st.pick(e, [letter.group])) mode(ta.hidden ? 'text' : null); });   // 종이를 누르면 쓰기

    // ---- 도구 줄: 마이크 / T / 펜 / 색 점들 / 확정 ----
    const paintPaper = () => { ctx.root.style.setProperty('--paper', paperColor()); refresh(); };
    const drawDots = () => chipsBox.replaceChildren(...PAPER_COLORS.slice(0, 5).map(c => el('button', { class: lt.paper === c ? 'on' : '', style: { background: c }, 'aria-label': c,
      onclick: () => { update(s => { s.letter.paper = c; }); drawDots(); paintPaper(); } })));
    const tool = (txt, label, fn) => el('button', { class: 'btn', 'aria-label': label, onclick: fn }, txt);
    const confirmBtn = el('button', { class: 'btn primary', disabled: true, onclick: () => { mode(null); ctx.go('send-3-character'); } }, t('common.confirm'));   // 아래 선물 유무(✓/✗)를 고르면 눌러지고, 누르면 다음으로
    const tools = el('div', { class: 'row wrap' },
      tool('🎙', t('send.card.tools.mic'), () => toast(t('send.card.micSoon'))),
      tool('T', t('send.card.tools.text'), () => mode('text')),
      tool('✎', t('send.card.tools.pen'), () => mode('pen')),
      el('span', { class: 'spacer' }), count,
      confirmBtn);
    const to = el('input', { class: 'field', placeholder: t('send.card.toPh'), value: lt.to, oninput: e => update(s => { s.letter.to = e.target.value; }) });
    const rel = el('div', { class: 'tabs' }, ...['friend', 'love'].map(k => el('button', { class: lt.relation === k ? 'on' : '', onclick: e => { update(s => { s.letter.relation = k; }); [...rel.children].forEach(b => b.classList.toggle('on', b === e.target)); } }, t('send.card.relation.' + k))));
    const giftBox = el('div', { hidden: true, style: { marginTop: '10px', animation: 'fade .35s' } }, giftSection(() => ctx.go('send-3-character')));
    const yes = el('button', { class: 'btn' + (state.gift.has ? ' primary' : ''), onclick: () => { update(s => { s.gift.has = true; }); confirmBtn.disabled = false; giftBox.hidden = false; yes.classList.add('primary'); no.classList.remove('primary'); sheet.classList.add('tall'); } }, '✓');
    const no = el('button', { class: 'btn' + (!state.gift.has ? ' primary' : ''), onclick: () => { update(s => { s.gift.has = false; }); confirmBtn.disabled = false; giftBox.hidden = true; no.classList.add('primary'); yes.classList.remove('primary'); } }, '✗');
    const sheet = L.addSheet([tools,
      el('div', { class: 'row', style: { marginTop: '8px' } }, el('b', {}, t('send.card.to')), to),
      el('div', { class: 'row', style: { justifyContent: 'space-between', margin: '10px 0 0' } }, el('span', {}, t('send.card.giftAsk')), el('div', { class: 'row' }, yes, no)),
      giftBox, rel], { tapCollapse: false });   // 종이를 누르면 글쓰기가 열리므로 3D 탭으로는 패널을 내리지 않음(손잡이 누르기·드래그로만)
    drawDots(); paintPaper();

    // ---- 기울기 센서(없으면 포인터 움직임으로 대신)로 편지지를 은은하게 흔들기 ----
    let tx = 0, ty = 0;
    const tilt = e => { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); };
    const move = e => { tx = (e.clientX / innerWidth - 0.5) * 1.2; ty = (e.clientY / innerHeight - 0.5) * 1.2; };
    window.addEventListener('deviceorientation', tilt); window.addEventListener('pointermove', move);
    const off2 = st.onFrame((dt, tm) => { sheetG.rotation.y += (tx * 0.22 - sheetG.rotation.y) * 0.1; sheetG.rotation.x += (ty * 0.14 - sheetG.rotation.x) * 0.1; parcel.rotation.z = 0.25 + Math.sin(tm * 0.8) * 0.03; });
    return () => { st.setPS1({ height: 300 }); off(); off2(); off3(); window.removeEventListener('deviceorientation', tilt); window.removeEventListener('pointermove', move); over.remove(); letter.dispose(); L.dispose(); };
  },
};
