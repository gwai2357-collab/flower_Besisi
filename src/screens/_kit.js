// 화면에서 같이 쓰는 부품: 위쪽 말풍선 + 가운데 빈 자리(3D) + 아래 패널. 절대 위치 대신 세로로 쌓는다.
import { el } from '../ui.js';
import { bubble } from '../scene3d/cloud.js';

// 반환: { top, say(text), spacer, addSheet(children, {tall}) }
export function layout(ctx, bubbleText){
  const b = bubble(bubbleText || '');
  const top = el('div', { class: 'row', style: { justifyContent: 'center', padding: '4px var(--gutter) 0', minHeight: '0' } }, bubbleText ? b : null);
  const spacer = el('div', { class: 'spacer' });
  ctx.root.append(top, spacer);
  let sheetEl = null, ro = null;
  return {
    top, spacer, bubbleEl: b,
    say(text){ b.innerHTML = text; if (!b.isConnected) top.append(b); },
    // 아래 패널을 붙이고, 3D가 패널이 가린 만큼 위로 올라오게 한다
    addSheet(children, { tall = false, grab = true } = {}){
      // 손잡이를 누르면 패널이 완전히 내려가고(손잡이만 남음), 내려간 만큼 3D(fitable인 장면)가 커진다. tall로 시작한 패널은 크게/보통으로 바뀐다.
      sheetEl = el('div', { class: 'sheet' + (tall ? ' tall' : '') },
        grab ? el('button', { class: 'grab', 'aria-label': 'panel', onclick: () => {
          if (tall) sheetEl.classList.toggle('tall');
          else { sheetEl.classList.toggle('collapsed'); ctx.stage.setFit(sheetEl.classList.contains('collapsed') ? 1.3 : 1); }
        } }) : null, children);
      ctx.root.append(sheetEl);
      ro = new ResizeObserver(() => ctx.stage.setInset(Math.max(0, sheetEl.offsetHeight - 24))); ro.observe(sheetEl);
      return sheetEl;
    },
    dispose(){ ro?.disconnect(); ctx.stage.setInset(0); },
  };
}

export const chip = (label, { dot, on, cls = '', onclick, info } = {}) =>
  el('span', { class: 'chip ' + cls, onclick, style: { cursor: 'pointer' } }, dot ? el('i', { class: 'dot', style: { background: dot } }) : null, label,
    info ? el('button', { class: 'info', 'aria-label': 'info', onclick: e => { e.stopPropagation(); info(); } }, 'ⓘ') : null);
