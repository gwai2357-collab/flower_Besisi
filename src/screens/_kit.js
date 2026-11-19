// 화면에서 같이 쓰는 부품: 위쪽 말풍선 + 가운데 빈 자리(3D) + 아래 패널. 절대 위치 대신 세로로 쌓는다.
import { el } from '../ui.js';
import { bubble } from '../scene3d/cloud.js';

// 반환: { top, say(text), spacer, addSheet(children, opts), float(el) }
export function layout(ctx, bubbleText){
  const b = bubble(bubbleText || '');
  const top = el('div', { class: 'row', style: { justifyContent: 'center', padding: '4px var(--gutter) 0', minHeight: '0' } }, bubbleText ? b : null);
  const spacer = el('div', { class: 'spacer' });
  ctx.root.append(top, spacer);
  let sheetEl = null, ro = null, offTap = null, floats = [];
  const placeFloats = () => floats.forEach(f => { f.style.bottom = (sheetEl ? sheetEl.offsetHeight : 0) + 6 + 'px'; });
  return {
    top, spacer, bubbleEl: b,
    say(text){ b.say(text); if (!b.isConnected) top.append(b); },
    // 패널 위 왼쪽에 붙어서 패널과 함께 위아래로 움직이는 요소(되돌리기 아이콘 등)
    float(node){ node.classList.add('sheet-float'); ctx.root.append(node); floats.push(node); placeFloats(); return node; },
    // 아래 패널을 붙인다. 3D는 패널이 가린 만큼 위로 올라온다.
    // 패널 내리기: 손잡이를 누르거나 아래로 드래그하거나, (tapCollapse) 3D를 탭하면 완전히 내려가고(손잡이만 남음) 3D(fitable)가 커진다. 손잡이를 위로 끌거나 누르면 다시 올라온다.
    addSheet(children, { tall = false, grab = true, tapCollapse = true } = {}){
      const setCollapsed = c => { sheetEl.classList.toggle('collapsed', c); ctx.stage.setFit(c ? 1.3 : 1); };
      const grabBtn = grab ? el('button', { class: 'grab', 'aria-label': 'panel' }) : null;
      sheetEl = el('div', { class: 'sheet' + (tall ? ' tall' : '') }, grabBtn, children);
      if (grabBtn){
        let y0 = null, moved = false;
        grabBtn.addEventListener('pointerdown', e => { y0 = e.clientY; moved = false; grabBtn.setPointerCapture(e.pointerId); });
        grabBtn.addEventListener('pointermove', e => { if (y0 == null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 14) moved = true;
          if (dy > 24) { if (tall) sheetEl.classList.remove('tall'); else setCollapsed(true); y0 = e.clientY; } else if (dy < -24) { if (tall) sheetEl.classList.add('tall'); else setCollapsed(false); y0 = e.clientY; } });
        grabBtn.addEventListener('pointerup', () => { if (!moved){ if (tall) sheetEl.classList.toggle('tall'); else setCollapsed(!sheetEl.classList.contains('collapsed')); } y0 = null; });
      }
      if (tapCollapse && grab && !tall) offTap = ctx.stage.onTap(() => { if (!sheetEl.classList.contains('collapsed')) setCollapsed(true); });
      ctx.root.append(sheetEl);
      ro = new ResizeObserver(() => { ctx.stage.setInset(Math.max(0, sheetEl.offsetHeight - 24)); placeFloats(); }); ro.observe(sheetEl);
      return sheetEl;
    },
    dispose(){ ro?.disconnect(); offTap?.(); ctx.stage.setInset(0); },
  };
}

export const chip = (label, { dot, on, cls = '', onclick, info } = {}) =>
  el('span', { class: 'chip ' + cls, onclick, style: { cursor: 'pointer' } }, dot ? el('i', { class: 'dot', style: { background: dot } }) : null, label,
    info ? el('button', { class: 'info', 'aria-label': 'info', onclick: e => { e.stopPropagation(); info(); } }, 'ⓘ') : null);
