// S0 진입: 3D 미리보기(꽃다발 → 한 송이 → 선물 → 스냅사진)가 천천히 자동으로 넘어가고, 두 큰 버튼 중에서 고른다.
import { el, copyText, toast } from '../ui.js';
import { t } from '../strings.js';
import { layout } from './_kit.js';
import { preview } from '../scene3d/previews.js';
import { setMode } from '../state.js';

export default {
  id: 'send-0-intro', flow: 'send', title: '시작',
  mount(ctx){
    const L = layout(ctx, t('send.intro.bubble'));
    const kinds = ['bouquet', 'single', 'gift', 'snap'], names = t('send.intro.previews');
    let i = 0, timer = 0;
    const label = el('div', { class: 'hint' });
    const showAt = n => { i = (n + kinds.length) % kinds.length; const p = preview(kinds[i]); ctx.stage.show(p.obj, p.opts); label.textContent = names[i]; };
    const arrow = (cls, txt, d) => el('button', { class: 'arrow ' + cls, onclick: () => { showAt(i + d); restart(); } }, txt);
    const restart = () => { clearInterval(timer); timer = setInterval(() => showAt(i + 1), 5000); };
    ctx.root.append(arrow('l', '◁', -1), arrow('r', '▷', 1));
    showAt(0); restart();

    const start = mode => { setMode(mode); ctx.go('send-1-flowers'); };
    L.addSheet([
      label,
      el('h2', { style: { textAlign: 'center', marginTop: '10px' } }, t('send.intro.ask')),
      el('div', { class: 'row' },
        el('button', { class: 'btn big', onclick: () => start('single') }, t('send.intro.single'), el('small', {}, t('send.intro.singleSub'))),
        el('button', { class: 'btn big primary', onclick: () => start('bouquet') }, t('send.intro.bouquet'), el('small', {}, t('send.intro.bouquetSub')))),
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '10px' } },
        el('button', { class: 'btn ghost', onclick: () => ctx.go('send-0-1-collect') }, t('send.intro.together')),
        el('button', { class: 'iconbtn', 'aria-label': t('send.intro.share'), onclick: async () => { await copyText(location.href); toast(t('common.copied')); } }, '⇪')),
    ], { grab: false });
    return () => { clearInterval(timer); L.dispose(); };
  },
};
