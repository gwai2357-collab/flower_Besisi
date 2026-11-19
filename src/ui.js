// 아주 작은 DOM 도우미 (프레임워크 없음)
export function el(tag, attrs, ...kids){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})){
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

let toastTimer = 0;
export function toast(msg){
  document.querySelector('.toast')?.remove();
  const t = el('div', { class: 'toast' }, msg); document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2200);
}

export async function copyText(text){
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = el('textarea', { style: { position: 'fixed', opacity: 0 } }); ta.value = text; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
  }
}

// 짜잔! 효과: 화면 가운데에서 도트 별·네모 조각이 사방으로 튀어 오르며 사라짐 (색은 파스텔)
export function sparkles(cx = innerWidth / 2, cy = innerHeight * 0.35, n = 36){
  const cols = ['#ffe27a', '#ffffff', '#ff9fb8', '#9fd4ff', '#b9f0c4', '#d9b8ff'];
  for (let i = 0; i < n; i++){
    const e = el('i', { class: 'spark', style: { left: cx + 'px', top: cy + 'px', background: cols[i % cols.length], clipPath: i % 3 ? 'none' : 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)', width: (6 + (i % 4) * 3) + 'px', height: (6 + (i % 4) * 3) + 'px' } });
    document.body.append(e);
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 90 + Math.random() * 150;
    e.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 40}px) scale(.4) rotate(${(Math.random() - .5) * 240}deg)`, opacity: 0 }],
      { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.15,.8,.3,1)', delay: Math.random() * 150 }).onfinish = () => e.remove();
  }
}
