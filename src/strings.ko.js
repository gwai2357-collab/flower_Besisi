// 화면에 나오는 문구는 모두 여기에. (나중에 strings.en.js를 만들어 바꿔 끼우면 영어판)
// 쓰는 법: import { t } from '../strings.js'; t('send.intro.bubble')   · {이름} 같은 자리는 t('key', { 이름:'지우' })
export default {
  app: { name: '꽃망울', logo: '(•ᴗ•)@' },
  common: {
    back: '뒤로', settings: '설정', next: '다음', confirm: '확정', undo: '되돌리기', close: '닫기', copy: '복사', copied: '복사했어요!',
    feedback: '개발자에게 의견 보내기', feedbackSoon: '의견 보내기는 곧 열려요 (이번 시안에선 화면만)', fakeAction: '이번 시안에선 화면만 있어요',
  },
  settings: { title: '설정', sfx: '효과음', bgm: 'BGM', vr: 'VR 기울기', soon: '준비 중' },
  send: {
    intro: {
      bubble: '꽃을 꾸미고 링크로 전해요',
      previews: ['꽃다발', '한 송이', '선물', '스냅사진'],
      ask: '어떻게 마음을 전할까요?',
      single: '한 송이', singleSub: '소요 5분', bouquet: '꽃다발', bouquetSub: '10~15분',
      together: '여럿이 함께 준비하나요?', share: '서비스 공유',
    },
    collect: {
      bubble: '여럿이 각자 꽃을 만들어 한 명에게 한꺼번에 전해요',
      left: '{n}일 남음', deadline: '{월}월 {일}일 마감', to: '받는 사람', toPh: '이름', until: '마감일 (최대 7일)',
      previewTitle: '{이름}의 생일 꽃망울', previewTitleEmpty: '받는 사람의 꽃망울', confirm: '확정하고 링크 복사',
    },
    flowers: {
      bubble: '꽃을 고르고 어울리는 소재를 골라 보세요',
      clear: '모두 삭제', shuffle: '위치 섞기', suggest: '추천 조합',
      tabs: { flower1: '꽃1', flower2: '꽃2', foliage: '소재', wrap: '포장' },
      today: '오늘의 꽃', lockedNote: '회원가입 후 꽃 도감을 채우면 사용할 수 있어요', soonHint: '곧 열려요', lockedHint: '받으면 열려요', pendingHint: '꽃 생성기에서 만드는 중이에요',
      meaning: '{꽃}의 꽃말은 {뜻}예요', count: '{n}/{max}', full: '꽃은 최대 {max}송이까지예요 (소재 포함)',
      wrap: { paper: '종이 포장', kraft: '크라프트 미니' }, wrapFixed: '한 송이는 크라프트 미니 포장으로 정해져 있어요',
      next: '카드 쓰러 가기', empty: '꽃을 하나 이상 골라 주세요', singleBubble: '메인 꽃 한 송이와 소재를 골라 보세요',
    },
    card: {
      bubble: '마음을 적어 보세요', to: 'To', toPh: '받는 사람 (이름은 원하면 적어요)', textPh: '여기에 편지를 적어 주세요', limit: '{n}/300',
      tools: { text: '글자', pen: '그림', color: '색', mic: '보이스' }, micSoon: '보이스메모(최대 15초)는 곧 열려요',
      paper: '편지지 색', relation: { friend: '친구·가족', love: '연인' },
      giftAsk: '함께 준비한 선물이 있나요?', yes: '있어요', no: '없어요', next: '다음',
    },
    gift: {
      bubble: '꽃다발과 함께 넣어 드릴게요', kind: '선물 종류', mysteryName: '미스터리 상자 이름 (14자)', mysteryPh: '예: 두근두근 상자',
      code: '선물코드', codePh: '코드를 붙여넣어 주세요', paste: '붙여넣기', ask: '받는 사람에게 확인 질문 (선택)', askPh: '예: 이 상자 안에 뭐가 들었을까요?',
      note1: '보낸 사람이 넣은 코드예요', note2: '꽃망울은 카카오 로그인·결제 정보를 묻지 않아요', confirm: '확정',
    },
    character: {
      bubble: '이제 거의 다 왔어요! 당신은 누구인가요?', tip: 'TIP 캐릭터가 방금 만든 꽃다발의 미니 버전을 들고 있어요',
      nickname: '닉네임', nicknamePh: '받는 사람에게 보여요', basic: '기본', random: '랜덤', confirm: '확정', confirmed: '이 캐릭터로 정했어요', save: '이미지로 저장', skipHint: '건너뛰면 랜덤 캐릭터가 건네요', next: '다음',
    },
    share: {
      bubble: '다 됐어요! 링크로 마음을 전해요', thumb: '카톡 공유 모습', thumbA: '빼꼼', thumbB: '얼굴 가까이', thumbNote: '꽃 전체는 가려서 열기 전의 두근거림을 지켜요',
      copyLink: '링크 복사', share: '공유하기', qr: '깜짝 선물로 QR 만들기', qrSub: '와이파이·상품권처럼 꾸밀 수 있어요!', qrSoon: 'QR 꾸미기는 다음 단계에서 만들어요 (가상의 디자인만 써요)',
    },
  },
  receive: {
    arrive: '<b>{이름}</b>이(가) 보낸 꽃다발이 도착했어요!<br>꽃을 눌러 받아 주세요.', someone: '누군가',
    look: '드래그하거나 확대할 수 있어요!<br>카드와 선물을 같이 보냈네요. 카드부터 열어 보세요!', lookNoGift: '드래그하거나 확대할 수 있어요!<br>꽃다발 앞의 카드를 눌러 보세요.',
    cardFirst: '<b>{이름}</b>의 카드가 함께 도착했어요!<br>카드부터 열어 보세요.',
    card: { voice: '보이스메모', voiceSoon: '보이스메모는 곧 열려요 (이번 시안에선 자리만)', close: '카드 닫기', from: '{이름}이(가)', to: 'To {이름}' },
    parcel: { tap: '소포를 눌러 보세요', tap2: '한 번 더 누르면 열려요', sent: '<b>{이름}</b>이(가) 함께 선물을 보냈어요!', none: '함께 온 선물은 없어요', code: '선물코드', copy: '코드 복사', box: '선물함 열기', boxSoon: '선물함은 곧 열려요', note1: '보낸 사람이 넣은 코드예요', note2: '꽃망울은 카카오 로그인·결제 정보를 묻지 않아요', ask: '{이름}의 질문' },
    keep: '주고받은 마음 보관하기',
    dome: { bubble: '{n}일 동안 이 돔 안에 머물러요.<br>그동안 함께 마음을 나눠 보세요.', last: '오늘이 마지막 날이에요', start: '카카오로 시작하고 꽃 보관하기', perks: '회원이 되면: 꽃 보관 · 도감 채우기 · 포토박스 벽', info: '회원 혜택' },
    thanks: { bubble: '받은 마음에 답해 볼까요?', single: '한 송이 답례하기', snap: '감사 스냅 찍기', box: '보관함 가기', snapSoon: '감사 스냅은 다음 단계에서 가져와요 (감사 스냅 v0)' },
    box: { tabs: { bouquet: '꽃다발', book: '도감', wall: '포토박스 벽' }, again: '다시 받아 보기', detail: '다발 자세히 보기', book: '{total}종 중 {n}종 모았어요!', meaning: '이 꽃의 꽃말은 {뜻}예요', wallEmpty: '아직 찍은 스냅이 없어요', date: '받은 날' },
    soon: '이 화면은 다음 단계에서 만들어요',
  },
  dev: { fs: '글자 크기 배율', remote: '화면 이동 리모콘', send: '보내기', receive: '받기', panel: '조절 패널', title: '개발 패널', bg: '배경색', res: 'PS1 화면 해상도', snapBouquet: '꽃다발 흔들림', snapParcel: '소포 흔들림', snapGift: '선물 흔들림', jump: '화면 건너뛰기' },
};
