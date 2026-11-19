// ?dev=1 조절 패널: 배경색, PS1 해상도·흔들림, 아무 화면으로 건너뛰기
import { el } from './ui.js';
import { t } from './strings.js';
import { registry, go, current } from './router.js';
import { state, seedDemo } from './state.js';

export function mountDev(stage){
  const panel = el('div', { id: 'devpanel' }, el('h3', {}, t('dev.title')));
  const bg = el('input', { type: 'color' }); bg.value = '#bce1da';
  bg.oninput = () => { document.documentElement.style.setProperty('--bg', bg.value); stage.refreshBackground(); };
  panel.append(el('label', {}, t('dev.bg')), bg);
  const slider = (label, min, max, step, val, on) => {
    const out = el('span', {}, val), inp = el('input', { type: 'range', min, max, step }); inp.value = val;
    inp.oninput = () => { out.textContent = inp.value; on(+inp.value); };
    panel.append(el('label', {}, el('span', {}, label), out), inp);
  };
  slider(t('dev.fs'), 0.8, 2, 0.05, 1.25, v => document.documentElement.style.setProperty('--fs', v));
  slider(t('dev.res'), 100, 600, 10, stage.ps1.height, v => stage.setPS1({ height: v }));
  slider(t('dev.snapBouquet'), 120, 1200, 10, stage.ps1.snap.bouquet, v => stage.setPS1({ snap: { bouquet: v } }));
  slider(t('dev.snapParcel'), 120, 1200, 10, stage.ps1.snap.parcel, v => stage.setPS1({ snap: { parcel: v } }));
  slider(t('dev.snapGift'), 120, 1200, 10, stage.ps1.snap.gift, v => stage.setPS1({ snap: { gift: v } }));
  const sel = el('select', {}, ...[...registry.values()].map(d => el('option', { value: d.id }, `${d.id} · ${d.title}`)));
  sel.onchange = () => go(sel.value);
  panel.append(el('label', {}, t('dev.jump')), sel);
  panel.hidden = true;   // 조절 패널은 리모콘의 ⚙로 열 때만 보임 (휴대폰에서 화면을 가리지 않게)
  document.body.append(panel);
  mountRemote(panel);
}

// 개발용 이동 리모콘: 오른쪽 가장자리의 작은 버튼 → 보내기 / 받기 화면 목록. 누르면 그 화면으로 바로 이동(?dev=1일 때만 나타남).
function mountRemote(panel){
  const btn = el('button', { id: 'devremote', 'aria-label': t('dev.remote') }, '⌗');
  const menu = el('div', { id: 'devmenu', hidden: true });
  const jump = id => { if (!state.items.length) seedDemo(); menu.hidden = true; go(id); };
  const draw = () => {
    const cur = current()?.id, group = (flow, title) => [el('b', {}, title), ...[...registry.values()].filter(d => d.flow === flow).map(d =>
      el('button', { class: d.id === cur ? 'on' : '', onclick: () => jump(d.id) }, d.title))];
    menu.replaceChildren(...group('send', t('dev.send')), ...group('receive', t('dev.receive')),
      el('button', { class: 'gear', onclick: () => { panel.hidden = !panel.hidden; menu.hidden = true; } }, '⚙ ' + t('dev.panel')));
  };
  btn.onclick = () => { menu.hidden = !menu.hidden; if (!menu.hidden) draw(); };
  document.body.append(btn, menu);
}
