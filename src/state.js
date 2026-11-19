// 화면과 분리된 데이터. 화면은 state를 읽고 update()로만 고친다. (나중에 저장·앱 껍데기에서 그대로 재사용)
import { rollItem } from './scene3d/bouquet-v0.js';
import { byId, MAX_ITEMS } from './data/flowers.js';

const NICK_KEY = 'besisi.nickname';
const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export const PAPER_COLORS = ['#fbf7ee', '#fde8ee', '#e8f2fb', '#eef6e6', '#fff1d6'];

export const state = {
  mode: 'bouquet',                 // 'bouquet' | 'single'
  items: [],                       // [{ type, hue, lightness, seed, flower(id) }]
  wrap: 'paper',                   // 'paper' | 'kraft'
  letter: { to: '', text: '', paper: null /* null이면 다발 색으로 자동 */, relation: 'friend', drawing: null, voice: false },
  gift: { has: false, kind: '', mystery: '', code: '', ask: '' },
  character: { nickname: lsGet(NICK_KEY), look: null /* 캐릭터 스펙(characters.js) */, confirmed: false },
  collect: { to: '', days: 7 },
  receive: { opened: false },
};
const subs = new Set();
export const subscribe = f => (subs.add(f), () => subs.delete(f));
export function update(fn){ fn(state); subs.forEach(f => f(state)); }

export function setNickname(n){ lsSet(NICK_KEY, n); update(s => { s.character.nickname = n; }); }

// ---- 꽃 담기 ----
export const count = () => state.items.length;
export const full = () => state.items.length >= MAX_ITEMS;
export function addFlower(id){
  const f = byId[id]; if (!f || !f.type || full()) return false;
  update(s => { s.items.push({ ...rollItem(f.type), flower: id }); });
  return true;
}
export const clearFlowers = () => update(s => { s.items = []; });
export const shuffleFlowers = () => update(s => { s.items = s.items.map(it => ({ ...it, seed: (it.seed * 1664525 + 1013904223) >>> 1 })); });
export function setSuggested(){
  update(s => { s.items = ['roseRed', 'roseRed', 'lisianthus', 'daisy', 'asclepias', 'delphSpray', 'eucalyptus', 'eucalyptus', 'bori'].map(id => ({ ...rollItem(byId[id].type), flower: id })); });
}
export function setMode(mode){
  update(s => {
    s.mode = mode; s.items = [];
    if (mode === 'single'){ s.wrap = 'kraft'; }
  });
}

// ---- 편지지 색: 다발의 주된 색(가장 많은 꽃의 색 계열)으로 자동 ----
export function autoPaper(){
  const hues = state.items.filter(i => byId[i.flower]?.tab !== 'foliage');
  if (!hues.length) return PAPER_COLORS[0];
  const h = hues.reduce((a, i) => a + i.hue, 0) / hues.length;
  return `hsl(${Math.round(h)} 70% 93%)`;
}
export const paperColor = () => state.letter.paper || autoPaper();

// ---- 링크에 담기 (저장 없이 시험): 선물 데이터를 # 뒤에 JSON으로. 그림 편지는 너무 길어 제외(같은 기기에서만) ----
export function encodeGift(s = state){
  const data = { v: 1, mode: s.mode, wrap: s.wrap, items: s.items.map(i => [i.flower, i.hue, i.lightness, i.seed]),
    letter: { to: s.letter.to, text: s.letter.text, paper: s.letter.paper, relation: s.letter.relation },
    gift: s.gift.has ? { kind: s.gift.kind, mystery: s.gift.mystery, code: s.gift.code, ask: s.gift.ask } : null,
    from: { nick: s.character.nickname, look: s.character.look } };
  return btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeGift(str){
  try {
    const b = str.replace(/-/g, '+').replace(/_/g, '/'), d = JSON.parse(decodeURIComponent(escape(atob(b + '='.repeat((4 - b.length % 4) % 4)))));
    d.items = d.items.map(([flower, hue, lightness, seed]) => ({ flower, type: byId[flower]?.type, hue, lightness, seed })).filter(i => i.type);
    return d;
  } catch (e) { return null; }
}

// 스토리보드·시험용: 중간 화면을 바로 열어도 비어 보이지 않게 채워 둠 (?demo=1 또는 ?embed=1)
export function seedDemo(){
  setSuggested();
  update(s => {
    s.letter.to = '지우'; s.letter.text = '생일 축하해! 올해도 네가 웃는 날이 많았으면 좋겠어.';
    s.gift = { has: true, kind: 'cake', mystery: '', code: '', ask: '' };
    s.character.nickname = s.character.nickname || '하나';
  });
}
