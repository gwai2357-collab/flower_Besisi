// 등록할 화면 목록 (순서 = 스토리보드 순서)
import intro from './send-0-intro.js';
import collect from './send-0-1-collect.js';
import flowers from './send-1-flowers.js';
import card from './send-2-card.js';
import gift from './send-2-1-gift.js';
import character from './send-3-character.js';
import share from './send-4-share.js';
import receive from './receive-stubs.js';
export const screens = [intro, collect, flowers, card, gift, character, share, ...receive];
