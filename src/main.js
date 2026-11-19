import { createStage } from './scene3d/stage.js';
import { init, go, back, register, registry } from './router.js';
import { el, toast } from './ui.js';
import { t } from './strings.js';
import { mountDev } from './dev.js';
import { cloudImage } from './scene3d/cloud.js';
import { screens } from './screens/index.js';
import { decodeGift, seedDemo } from './state.js';

const q = new URLSearchParams(location.search);
const embed = q.has('embed');                      // 스토리보드 안에서 작게 띄운 모습
if (embed) document.body.classList.add('storyboard-embed');

const app = document.getElementById('app');
const topbar = el('div', { class: 'topbar' });
const backBtn = el('button', { class: 'iconbtn', 'aria-label': t('common.back'), onclick: () => back() }, '‹');
// 설정: 톱니 버튼 하나. 누르면 효과음·BGM·VR 아이콘이 구름 안에서 왼쪽으로 주르륵 펼쳐진다. 이번 시안엔 자리만, BGM 기본 꺼짐.
const iconCloud = el('div', { class: 'iconcloud' });
const iconBtn = (txt, label, on) => { const b = el('button', { 'aria-label': label, class: on ? '' : 'off', onclick: () => { b.classList.toggle('off'); toast(t('settings.soon')); } }, txt); return b; };
iconCloud.append(iconBtn('🔊', t('settings.sfx'), true), iconBtn('♪', t('settings.bgm'), false), iconBtn('◎', t('settings.vr'), false));
new ResizeObserver(() => { const w = iconCloud.offsetWidth, h = iconCloud.offsetHeight; if (w) iconCloud.style.backgroundImage = `url(${cloudImage(w + 16, h + 10)})`; }).observe(iconCloud);
const gearWrap = el('div', { class: 'gearwrap' }, iconCloud, el('button', { class: 'iconbtn gear', 'aria-label': t('common.settings'), onclick: () => gearWrap.classList.toggle('open') }, '⚙'));
topbar.append(el('div', { class: 'left' }, backBtn, el('span', { class: 'logo' }, t('app.logo'))), gearWrap);
const root = el('div', { id: 'screen' });
app.append(topbar, root);

const stage = createStage(document.getElementById('stage3d'));
init({ root, stage }, (def, canBack) => { backBtn.style.visibility = canBack ? 'visible' : 'hidden'; document.title = `${t('app.name')} · ${def.title}`; });
for (const s of screens) register(s);
window.__ready = true;
window.__besisi = { stage, go, registry };       // 시험·스크린샷용

if (q.has('dev')) mountDev(stage);

if (embed || q.has('demo')) seedDemo();

// 시작 화면: ?s=화면id 로 바로 열기, #r=코드가 있으면 받기, 아니면 보내기 첫 화면
const hashCode = (location.hash.match(/[#&]r=([^&]+)/) || [])[1];
let start = q.get('s') || (hashCode && decodeGift(hashCode) ? 'receive-0-arrive' : 'send-0-intro');
go(start, { code: hashCode });
if (!embed && start !== 'receive-0-arrive') stage.ditherIn(2200);   // 웹에 처음 들어올 때만 디더링에서 선명해지며 등장 (받기 R0는 자체 연출)
if (embed) setTimeout(() => stage.freeze(), 1800);
