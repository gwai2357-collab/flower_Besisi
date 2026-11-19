import { createStage } from './scene3d/stage.js';
import { init, go, back, register, registry } from './router.js';
import { el, toast } from './ui.js';
import { t } from './strings.js';
import { mountDev } from './dev.js';
import { screens } from './screens/index.js';
import { decodeGift, seedDemo } from './state.js';

const q = new URLSearchParams(location.search);
const embed = q.has('embed');                      // 스토리보드 안에서 작게 띄운 모습
if (embed) document.body.classList.add('storyboard-embed');

const app = document.getElementById('app');
const topbar = el('div', { class: 'topbar' });
const backBtn = el('button', { class: 'iconbtn', 'aria-label': t('common.back'), onclick: () => back() }, '‹');
const settingsBtn = el('button', { class: 'iconbtn', 'aria-label': t('common.settings'), onclick: openSettings }, '⚙');
topbar.append(el('div', { class: 'left' }, backBtn, el('span', { class: 'logo' }, t('app.logo'))), settingsBtn);
const root = el('div', { id: 'screen' });
app.append(topbar, root);

// 설정: 효과음·BGM·VR 기울기를 한 곳에 묶음 (이번 시안엔 자리만, BGM 기본 꺼짐)
function openSettings(){
  if (document.getElementById('settings')) return document.getElementById('settings').remove();
  const row = (label, on) => el('label', { class: 'row', style: { justifyContent: 'space-between', margin: '8px 0' } }, label, el('input', { type: 'checkbox', checked: on || null, onchange: () => toast(t('settings.soon')) }));
  const box = el('div', { id: 'settings', class: 'sheet', style: { position: 'fixed', right: '12px', top: '52px', height: 'auto', width: '220px', borderRadius: '16px', zIndex: 30 } },
    el('h2', {}, t('settings.title')), row(t('settings.sfx'), true), row(t('settings.bgm'), false), row(t('settings.vr'), false));
  document.body.append(box);
}

const stage = createStage(document.getElementById('stage3d'));
init({ root, stage }, (def, canBack) => { backBtn.style.visibility = canBack ? 'visible' : 'hidden'; document.title = `${t('app.name')} · ${def.title}`; });
for (const s of screens) register(s);
window.__besisi = { stage, go, registry };       // 시험·스크린샷용

if (q.has('dev')) mountDev(stage);

if (embed || q.has('demo')) seedDemo();

// 시작 화면: ?s=화면id 로 바로 열기, #r=코드가 있으면 받기, 아니면 보내기 첫 화면
const hashCode = (location.hash.match(/[#&]r=([^&]+)/) || [])[1];
let start = q.get('s') || (hashCode && decodeGift(hashCode) ? 'receive-0-arrive' : 'send-0-intro');
go(start, { code: hashCode });
if (embed) setTimeout(() => stage.freeze(), 1800);
