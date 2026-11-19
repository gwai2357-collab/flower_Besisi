# 꽃망울 (flower_Besisi)

꽃을 꾸며 링크로 보내고, 받은 사람이 PS1 느낌의 3D로 받아 보는 웹. Vite + 순수 JS + three.js.

- 작업 지시 `flower_besisi_docs/docs/handoff-web-v1.md` · 결정 기록 `flower_besisi_docs/docs/bouquet-backlog.md`

## 실행
```
npm install
npm run dev        # http://localhost:5173/          (?dev=1 조절 패널, ?s=화면id 로 바로 열기, ?demo=1 샘플 데이터)
                   # http://localhost:5173/storyboard.html   모든 화면 나란히
npm run build
```
Node 없이도 정적 서버(`python -m http.server`)로 열립니다(index.html의 importmap이 three를 CDN에서 가져옴).

## 구조
| 위치 | 하는 일 |
|---|---|
| `src/theme.css` | 색·글꼴·둥글기·간격(CSS 변수). `--bg` 하나가 화면과 3D 배경을 함께 바꿈 |
| `src/strings.ko.js` | 화면 문구 전부 (`t('키')`로 꺼냄, 영어판은 strings.en.js를 더하면 됨) |
| `src/screens/` | 화면 하나 = 파일 하나. `screens/index.js`에 등록 |
| `src/scene3d/` | 무대(렌더러·PS1)·말풍선(cloud)·소포·캐릭터·꽃다발. 꽃다발은 `renderBouquet(data)` 하나로만 그림 |
| `src/state.js` | 화면과 분리된 데이터 (+ 링크 `#r=`에 담는 encode/decodeGift) |
| `src/data/` | 꽃 목록·선물 목록 |
| `src/dev.js` | `?dev=1` 패널 |
