/** PokeAPI variety name → 한글 폼 레이블 변환 */
export function getFormLabel(variantName: string, baseEnglishName: string): string {
  const suffix = variantName.startsWith(baseEnglishName + '-')
    ? variantName.slice(baseEnglishName.length + 1)
    : variantName;

  const FORM_LABELS: Record<string, string> = {
    // 메가진화 / 원시회귀
    'mega':            '메가',
    'mega-x':          '메가 X',
    'mega-y':          '메가 Y',
    'primal':          '원시회귀',
    // 거다이맥스
    'gmax':            '거다이맥스',
    'eternamax':       '에테르나맥스',
    // 지역 폼
    'alola':           '알로라',
    'alolan':          '알로라',
    'galar':           '가라르',
    'galarian':        '가라르',
    'hisui':           '히수이',
    'hisuian':         '히수이',
    'paldea':          '팔데아',
    'paldean':         '팔데아',
    // 기라티나 / 셰이미 / 로토무 등
    'altered':         '어나더폼',
    'origin':          '오리진폼',
    'land':            '육지폼',
    'sky':             '하늘폼',
    'heat':            '히트폼',
    'wash':            '워시폼',
    'frost':           '프로스트폼',
    'fan':             '팬폼',
    'mow':             '모어폼',
    // 토네로스 / 볼토로스 / 랜드로스
    'incarnate':       '어벤지폼',
    'therian':         '신수폼',
    // 레시라무 / 제크로무
    'black':           '블랙폼',
    'white':           '화이트폼',
    // 키리미아
    'normal':          '노말폼',
    // 데오키시스
    'attack':          '어택폼',
    'defense':         '디펜스폼',
    'speed':           '스피드폼',
    // 미노마담
    'plant':           '식물클로크',
    'sandy':           '모래클로크',
    'trash':           '쓰레기클로크',
    // 체리꼬 / 체리꼬
    'overcast':        '흐린날폼',
    'sunshine':        '맑은날폼',
    // 다루마카 / 히히다루마
    'zen':             '달마모드',
    'standard':        '스탠다드폼',
    // 카이리키 / 나이트릭 등
    'blade':           '블레이드폼',
    // 지가르데
    '10':              '10%폼',
    '50':              '50%폼',
    'complete':        '퍼펙트폼',
    // 수레기 / 가면까면
    'solo':            '단독폼',
    'school':          '군단폼',
    // 루가루암
    'midday':          '낮폼',
    'midnight':        '한밤폼',
    'dusk':            '황혼폼',
    // 코스모움
    'dawn':            '여명폼',
    // 카프코케코 등
    'baile':           '플라멩코스타일',
    'pom-pom':         '퐁퐁스타일',
    'pau':             '파우스타일',
    'sensu':           '선수스타일',
    // 배리어드
    'red-striped':     '레드줄무늬',
    'blue-striped':    '블루줄무늬',
    'white-striped':   '화이트줄무늬',
    // 이브이 파트너
    'original':        '오리지널폼',
    'partner':         '파트너폼',
    'starter':         '스타터폼',
    // 달무리게
    'noice':           '노이스폼',
    // 마호이프
    'hangry':          '헝그리폼',
    // 잠만보
    'full-belly':      '포만폼',
    // 무한다이노 / 무한라이한
    'crowned':         '왕관폼',
    // 후지도쿠가에로 등
    'rapid-strike':    '연격스타일',
    'single-strike':   '일격스타일',
    // 컴퓨레우스
    'rider':           '기수폼',
  };

  return FORM_LABELS[suffix.toLowerCase()] ?? suffix.replace(/-/g, ' ');
}

/** 메가진화 / 원시회귀 여부 */
export function isMegaForm(variantName: string): boolean {
  return variantName.includes('-mega') || variantName.includes('-primal');
}

/** 거다이맥스 / 에테르나맥스 여부 */
export function isGmaxForm(variantName: string): boolean {
  return variantName.includes('-gmax') || variantName.includes('-eternamax');
}
