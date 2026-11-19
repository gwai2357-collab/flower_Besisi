// S0-1 함께 모으기 (화면만): 여러 다발과 캐릭터들이 둥글게 모여 저절로 돈다. 받는 사람·마감일(일 단위 ▼▲) → 미리보기 → 확정하면 링크 복사 (팝업 없음)
// 캐릭터는 모두 종류·자세·악세서리·머리·옷이 서로 다르게 정해지고, ◀ ▶(또는 캐릭터를 눌러서)로 한 명씩 가까이 보며 무엇을 했는지 글로 확인할 수 있다.
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { bouquetObj, charObj, DEMO_BOUQUET, DEMO_SINGLE, DEMO_B, DEMO_C } from '../scene3d/previews.js';
import { newSpec, SIX, NAMES, PALETTE, HAIR_STYLES, POSE_LABELS, accLabel } from '../scene3d/characters.js';
import { state, update } from '../state.js';

const pad = n => String(n).padStart(2, '0');
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const ri = n => Math.floor(Math.random() * n);

// 서로 다른 캐릭터 n명: 종류·자세·악세서리는 겹치지 않게, 머리 모양과 옷도 제각각
function makeCast(n){
  const kinds = shuffle(SIX).slice(0, n), poses = shuffle([0, 1, 2, 3]), accs = shuffle(['hp', 'hat', 'cap', 'g1', 'sg', 'ep']), hairs = shuffle([0, 1, 3, 4, 6, 8, 9, 11, 12, 14]);
  return kinds.map((k, i) => {
    const s = newSpec(k, { hold: 1, pose: poses[i % 4], outfit: ri(5), cloth: ri(PALETTE.cloth.length), eye: ri(PALETTE.eye.length) });
    if (k === 'human'){ s.skin = ri(PALETTE.human.skin.length); s.hair = ri(PALETTE.human.hair.length); s.style = hairs[i]; }
    else { s.fur = ri(PALETTE[k].fur.length); s.style = hairs[i]; s.hair = ri(PALETTE.human.hair.length); }   // 동물도 머리(모양·색)를 가질 수 있음
    s.acc = { [accs[i % accs.length]]: 1 };
    const accKey = accs[i % accs.length];
    return { spec: s, label: `${NAMES[k]} · ${accLabel(accKey)} · 머리 ${HAIR_STYLES[s.style] ?? '없음'} · 자세 ${POSE_LABELS[s.pose]}` };
  });
}

export default {
  id: 'send-0-1-collect', flow: 'send', title: '함께 모으기',
  mount(ctx){
    const st = ctx.stage, THREE = st.THREE, L = layout(ctx, t('send.collect.bubble'));
    const bq = [DEMO_BOUQUET, DEMO_SINGLE, DEMO_B, DEMO_C], N = bq.length * 2, cast = makeCast(bq.length);
    const g = new THREE.Group(), slots = [];
    bq.forEach((items, k) => {
      const b = bouquetObj(items.map((x, j) => ({ ...x, seed: x.seed + k * 91 + j })), k % 2 ? 'kraft' : 'paper');
      const a = (2 * k / N) * Math.PI * 2; b.position.set(Math.sin(a) * 0.95, 0, Math.cos(a) * 0.95); b.rotation.y = a; b.scale.setScalar(0.7); g.add(b);
      const a2 = ((2 * k + 1) / N) * Math.PI * 2, c = charObj(cast[k].spec);
      c.position.set(Math.sin(a2) * 0.95, 0, Math.cos(a2) * 0.95); c.rotation.y = a2; c.scale.setScalar(0.6); g.add(c); slots.push({ obj: c, a: a2, label: cast[k].label });
    });
    const RING = { camera: [0, 1.1, 3.3], target: [0, 0.4, 0] };
    st.show(g, { ...RING, sway: false, minDistance: 1.2 });

    // 한 명씩 보기: 그 캐릭터가 정면에 오도록 전체를 돌리고 카메라를 가까이. focus -1 = 전체(저절로 돎)
    let focus = -1, want = 0;
    const cap = el('div', { class: 'count', style: { textAlign: 'center', flex: 1, minHeight: '1.4em' } });
    const setFocus = f => {
      focus = f;
      if (f >= 0){ const k = Math.round((-slots[f].a - g.rotation.y) / (Math.PI * 2)); want = -slots[f].a - k * Math.PI * 2; cap.textContent = `${f + 1}/${slots.length}  ${slots[f].label}`; }
      else cap.textContent = '캐릭터를 눌러 자세히 보기';
    };
    const lerp = (a, b, k) => a + (b - a) * k, cam = st.camera, tg = st.controls.target;
    const off = st.onFrame(dt => {
      if (focus < 0) g.rotation.y += dt * 0.3;
      else g.rotation.y = lerp(g.rotation.y, want, Math.min(1, dt * 4));
      const goal = focus < 0 ? RING : { camera: [0, 0.75, 2.15], target: [0, 0.45, 0.95] }, k = Math.min(1, dt * 3.5);
      st.controls.target.set(lerp(tg.x, goal.target[0], k), lerp(tg.y, goal.target[1], k), lerp(tg.z, goal.target[2], k));
      if (focus >= 0 || cam.position.z < 3.25) cam.position.set(lerp(cam.position.x, goal.camera[0], k), lerp(cam.position.y, goal.camera[1], k), lerp(cam.position.z, goal.camera[2], k));
    });
    const step = d => setFocus(focus < 0 ? (d > 0 ? 0 : slots.length - 1) : (focus + d + slots.length) % slots.length);
    const offTap = st.onTap(e => { const hit = st.pick(e, slots.map(s => s.obj)); if (hit){ const i = slots.findIndex(s => { let o = hit.object; while (o){ if (o === s.obj) return true; o = o.parent; } return false; }); if (i >= 0) setFocus(i === focus ? -1 : i); } });
    setFocus(-1);

    // 마감: 일 단위 ▼▲. 시·분은 만든 시각 기준(지금 + n일)으로 분 단위까지 표시
    const born = new Date();
    const deadline = el('div', { class: 'count', style: { textAlign: 'center' } }), title = el('div', { style: { textAlign: 'center', fontWeight: 600, margin: '8px 0' } });
    const dayOut = el('b', { style: { minWidth: '40px', textAlign: 'center', fontSize: 'calc(16px * var(--fs))' } });
    const paint = () => {
      const end = new Date(born.getTime() + state.collect.days * 864e5);
      dayOut.textContent = state.collect.days + '일';
      deadline.textContent = `${t('send.collect.left', { n: state.collect.days })} · ${end.getMonth() + 1}월 ${end.getDate()}일 ${pad(end.getHours())}시${pad(end.getMinutes())}분 마감`;
      title.textContent = state.collect.to ? t('send.collect.previewTitle', { 이름: state.collect.to }) : t('send.collect.previewTitleEmpty');
    };
    const stepDays = d => { update(s => { s.collect.days = Math.max(1, Math.min(7, s.collect.days + d)); }); paint(); };
    const to = el('input', { class: 'field', placeholder: t('send.collect.toPh'), value: state.collect.to, oninput: e => { update(s => { s.collect.to = e.target.value; }); paint(); } });
    L.addSheet([
      el('div', { class: 'row', style: { marginBottom: '8px' } }, el('button', { class: 'btn', 'aria-label': 'prev', onclick: () => step(-1) }, '◀'), cap, el('button', { class: 'btn', 'aria-label': 'next', onclick: () => step(1) }, '▶'),
        el('button', { class: 'btn', onclick: () => setFocus(-1) }, '전체')),
      el('div', { class: 'kv' }, el('span', {}, t('send.collect.to')), to, el('span', {}, t('send.collect.until')),
        el('div', { class: 'row' }, el('button', { class: 'btn', 'aria-label': '-', onclick: () => stepDays(-1) }, '▼'), dayOut, el('button', { class: 'btn', 'aria-label': '+', onclick: () => stepDays(1) }, '▲'))),   // ▼ 7일 ▲
      deadline, title,
      el('button', { class: 'btn big primary', style: { width: '100%' }, onclick: async () => { await copyText(`${location.origin}${location.pathname}#together=${Math.random().toString(36).slice(2, 8)}`); toast(t('common.copied')); } }, t('send.collect.confirm')),
    ], { grab: false });
    paint();
    return () => { off(); offTap(); L.dispose(); };
  },
};
