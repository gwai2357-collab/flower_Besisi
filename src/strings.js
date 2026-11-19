// 문구 꺼내기. 언어를 더하려면 strings.xx.js를 만들고 아래 LANGS에 넣는다.
import ko from './strings.ko.js';
const LANGS = { ko };
let cur = 'ko';
export const setLang = l => { if (LANGS[l]) cur = l; };
export function t(key, vars){
  let v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), LANGS[cur]);
  if (v == null) return `[${key}]`;
  if (typeof v === 'string' && vars) for (const k in vars) v = v.replaceAll(`{${k}}`, vars[k]);
  return v;
}
