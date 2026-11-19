// /storyboard.html: 모든 화면을 휴대폰 크기(390×660)로 나란히 본다. 각 칸은 실제 앱을 ?s=화면id&embed=1 로 띄운 것.
import { screens } from './screens/index.js';
const board = document.getElementById('board');
const flows = { send: '보내기', receive: '받기' };
for (const s of screens){
  const cell = document.createElement('figure');
  cell.innerHTML = `<figcaption><b>${s.id}</b> · ${s.title} <small>(${flows[s.flow] || s.flow})</small></figcaption>
    <iframe loading="lazy" width="390" height="660" src="./index.html?s=${s.id}&embed=1" title="${s.id}"></iframe>
    <a href="./index.html?s=${s.id}&demo=1&dev=1" target="_blank">열기 ↗</a>`;
  board.append(cell);
}
