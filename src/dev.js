// ?dev=1 조절 패널: 배경색, PS1 해상도·흔들림, 아무 화면으로 건너뛰기
import { el } from './ui.js';
import { t } from './strings.js';
import { registry, go } from './router.js';

export function mountDev(stage){
  const panel = el('div', { id: 'devpanel' }, el('h3', {}, t('dev.title')));
  const bg = el('input', { type: 'color' }); bg.value = '#d9829c';
  bg.oninput = () => { document.documentElement.style.setProperty('--bg', bg.value); stage.refreshBackground(); };
  panel.append(el('label', {}, t('dev.bg')), bg);
  const slider = (label, min, max, step, val, on) => {
    const out = el('span', {}, val), inp = el('input', { type: 'range', min, max, step }); inp.value = val;
    inp.oninput = () => { out.textContent = inp.value; on(+inp.value); };
    panel.append(el('label', {}, el('span', {}, label), out), inp);
  };
  slider(t('dev.res'), 100, 600, 10, stage.ps1.height, v => stage.setPS1({ height: v }));
  slider(t('dev.snapBouquet'), 120, 1200, 10, stage.ps1.snap.bouquet, v => stage.setPS1({ snap: { bouquet: v } }));
  slider(t('dev.snapParcel'), 120, 1200, 10, stage.ps1.snap.parcel, v => stage.setPS1({ snap: { parcel: v } }));
  slider(t('dev.snapGift'), 120, 1200, 10, stage.ps1.snap.gift, v => stage.setPS1({ snap: { gift: v } }));
  const sel = el('select', {}, ...[...registry.values()].map(d => el('option', { value: d.id }, `${d.id} · ${d.title}`)));
  sel.onchange = () => go(sel.value);
  panel.append(el('label', {}, t('dev.jump')), sel);
  document.body.append(panel);
}
