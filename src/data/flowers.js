// 꽃 목록. 나중에 꽃 생성기(flower-core.js)의 species/ 목록으로 바꿔 끼울 자리.
//   tab: 화면의 탭 (flower1 = 메인 꽃, flower2 = 서브 꽃, foliage = 소재). 화면에는 "메인/필링"이라고 쓰지 않는다.
//   type: bouquet-v0.js의 꽃 종류 이름. pending이면 아직 3D가 없어 버튼만.
//   basic: 누구나 항상 쓸 수 있는 기본 꽃.
import { mulberry32 } from '../scene3d/bouquet-v0.js';

export const MAX_ITEMS = 30;   // 소재 포함
export const SINGLE_FOLIAGE = 3;

export const CATALOG = [
  { id: 'roseRed',    name: '장미',         tab: 'flower1', type: 'roseRed',    basic: true, dot: '#c0283a', meaning: '열렬한 사랑' },
  { id: 'tulip',      name: '튤립',         tab: 'flower1', type: null,         basic: true, dot: '#e8556d', meaning: '사랑의 고백', pending: true },
  { id: 'rose',       name: '하늘색 장미',   tab: 'flower1', type: 'rose',       dot: '#9cc8ec', meaning: '기적, 불가능한 것의 실현' },
  { id: 'lisianthus', name: '리시안셔스',    tab: 'flower1', type: 'lisianthus', dot: '#f4f1ea', meaning: '변치 않는 사랑' },
  { id: 'daisy',      name: '데이지',        tab: 'flower1', type: 'daisy',      dot: '#ffffff', meaning: '순수, 희망' },
  { id: 'marigold',   name: '메리골드',      tab: 'flower1', type: 'marigold',   dot: '#f0a020', meaning: '반드시 오고야 말 행복' },
  { id: 'gypsophila', name: '안개꽃',        tab: 'flower2', type: null,         basic: true, dot: '#f7f3fa', meaning: '맑은 마음, 사랑의 성공', pending: true },
  { id: 'asclepias',  name: '아스클레피아스', tab: 'flower2', type: 'asclepias',  dot: '#c9d39a', meaning: '마음의 평안' },
  { id: 'delphSpray', name: '델피늄(가지형)', tab: 'flower2', type: 'delphSpray', dot: '#3f63d8', meaning: '당신은 행복을 가져다 줘요' },
  { id: 'delphSpike', name: '델피늄(꽃대형)', tab: 'flower2', type: 'delphSpike', dot: '#6f9be8', meaning: '당신은 행복을 가져다 줘요' },
  { id: 'eucalyptus', name: '유칼립투스',    tab: 'foliage', type: 'eucalyptus', basic: true, dot: '#8fa89b', meaning: '추억, 새로운 시작' },
  { id: 'bori',       name: '보리사초',      tab: 'foliage', type: 'bori',       dot: '#9bb06a', meaning: '소박한 기쁨' },
];
// 잠긴 꽃 자리(탭마다 10칸): 아직 3D가 없는 꽃 이름만 있는 자리. 회원가입 후 도감을 채우면 열리는 꽃을 미리 보여 줌.
const LOCKED = {
  flower1: ['작약', '프리지아', '수국', '라넌큘러스', '카네이션', '백합', '해바라기', '거베라', '아네모네', '스타티스'],
  flower2: ['스토크', '리모니움', '왁스플라워', '스카비오사', '니겔라', '설유화', '조팝', '미스티블루', '캄파눌라', '꽃양귀비'],
  foliage: ['루스커스', '레몬잎', '미리오', '자작나무잎', '아이비', '실버달러', '아스파라거스', '율마', '청지각', '네프롤레피스'],
};
for (const [tab, names] of Object.entries(LOCKED)) names.forEach((name, i) => CATALOG.push({ id: `soon-${tab}-${i}`, name, tab, type: null, dot: '#cfc8cb', meaning: '', soon: true }));
export const byId = Object.fromEntries(CATALOG.map(f => [f.id, f]));

// 오늘 꽃시장에 들어온 꽃: 날짜로 정해지는 3~4종(기본 꽃 제외), 그중 하나를 강조
export function openToday(date = new Date(), owned = []){
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const rng = mulberry32(key);
  const pool = CATALOG.filter(f => !f.basic && !f.pending && !f.soon);
  const pick = [...pool].sort(() => rng() - 0.5).slice(0, 3 + (key % 2));
  return { open: new Set([...pick.map(f => f.id), ...owned]), highlight: pick[0]?.id };
}
export const isOpen = (f, today) => !f.soon && (f.basic || today.open.has(f.id));
