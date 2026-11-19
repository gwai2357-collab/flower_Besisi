// R1-1 카드: 다발 앞의 카드가 날아와 한 바퀴 돌며 펼쳐지는 3D 편지(그림 포함) + 보이스메모 ▶ 자리. 닫으면 바라보기로 돌아간다.
import * as THREE from 'three';
import { el, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { makeLetter } from '../scene3d/letter.js';
import { state } from '../state.js';
import { getData, senderName, rx } from './receive-kit.js';

const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

export default {
  id: 'receive-1-1-card', flow: 'receive', title: '카드',
  mount(ctx){
    const d = getData(ctx), st = ctx.stage, lt = d.letter || {};
    const L = layout(ctx, '');
    const paper = lt.paper || 'hsl(340 70% 93%)';
    const letter = makeLetter({ text: lt.text || '', paper, drawing: null });
    // 그림 편지는 같은 기기에서만 보임(링크에 담기지 않음)
    if (state.letter.drawing){ const im = new Image(); im.onload = () => letter.setPaper({ text: lt.text || '', paper, drawing: im }); im.src = state.letter.drawing; }
    const g = new THREE.Group(); g.add(letter.group); letter.open(0);
    st.show(g, { camera: [0, 0, 0.45], target: [0, 0, 0], minDistance: 0.1, controls: false, sway: false });
    const t0 = performance.now();
    const off = st.onFrame(() => {
      const e = (performance.now() - t0) / 1000, fly = ease(e / 0.9), open = ease((e - 0.6) / 0.9);
      g.scale.setScalar(0.35 + 0.65 * fly); g.rotation.y = Math.PI * 2 * (1 - fly); g.position.y = -0.05 * (1 - fly);
      letter.open(open);
    });
    // 보이스메모 ▶ (자리만)
    const play = el('button', { class: 'btn', onclick: () => toast(t('receive.card.voiceSoon')) }, '▶ ' + t('receive.card.voice') + '  0:14');
    L.addSheet([el('div', { class: 'row', style: { justifyContent: 'space-between' } }, el('span', { class: 'note', style: { margin: 0 } }, t('receive.card.from', { 이름: senderName(d) })), play),
      el('button', { class: 'btn big primary', style: { width: '100%', marginTop: '10px' }, onclick: () => { rx.cardRead = true; ctx.go('receive-1-look'); } }, t('receive.card.close'))], { grab: false });
    return () => { off(); letter.dispose(); L.dispose(); };
  },
};
