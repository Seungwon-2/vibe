# T02 5×3 목록과 캐릭터 상세 패널 구현

## 상태 `done`

## 목표

선택 화면을 열면 왼쪽 목록에 얼굴 카드 5개와 빈 칸 10개가 보인다. 선택할 때 오른쪽에 해당 캐릭터의 전신·이름·패시브 아이콘과 효과가 갱신된다. 휴대폰에서도 이름과 버튼을 읽고 조작할 수 있어야 한다.

## 결정 요약

기존 화면의 배경과 색상, 해금 규칙, 시작 흐름을 재사용한다. 상세 패널은 정적 전신 이미지로 구성하고 이미지 속 흰 틈에 따라 그림 영역의 흰 바탕을 결정한다.

## 구현

### I01. 표시와 선택 흐름

- `src/app/screens/CharacterSelect.tsx`의 `CharacterSelect(props: CharacterSelectProps): React.JSX.Element`를 수정한다. `selectedCharacterId: CharacterId`, `profile?: PlayerProfile`, `onConfirm(characterId: CharacterId): void`, `onBack(): void`, `onShop?(): void`를 사용한다.
- `src/app/screens/characterSelectArt.ts`의 `getCharacterSelectArt`로 카드의 `faceUrl`과 상세 패널의 `fullUrl`을 가져온다. `getCharacterPassive`와 `CharacterAbilityIcon`을 상세 패널에 재사용한다.
- 데이터는 기존 카탈로그와 `profile.unlockedCharacterIds`를 읽으며 저장 스키마를 추가하지 않는다. 현재 목록은 린·히요리·메리·토아·랑 순서다. 그리드에는 실제 캐릭터 뒤에 `Math.max(0, 15 - SELECTOR_CHARACTERS.length)`개의 빈 칸을 채운다. 15명 초과 시 실제 등록 캐릭터를 잘라내지 않고 다음 행으로 배치한다.
- 카드는 얼굴, 한글 이름과 선택·잠김 상태를 표시한다. 선택된 상태는 강조 테두리와 `aria-pressed`로 전달한다. 잠김 버튼은 비활성화하고 수정 광산·구름 위 하늘길 해금 안내를 시각·접근성 이름 또는 설명에 포함한다. 빈 칸은 비대화형 요소로 배치하고 포커스와 접근성 트리에서 제외한다.
- 초기 후보는 현재 선택 ID가 `available`이고 해금된 경우 사용한다. 그 외에는 정렬된 선택 가능 목록의 첫 캐릭터를 사용한다. 프로필이 갱신되면 렌더링에서 같은 조건으로 선택 가능 여부를 다시 확인한다. 유효 후보가 없을 때는 시작 버튼을 비활성화하고 `onConfirm`을 호출하지 않는다.
- 하단 달리기 미리보기와 카드별 패시브 복제 표시를 정리한다. 정보 패널에 전신 이미지, 현행 이름·패시브 아이콘·효과, `달리기 시작` 버튼을 순서대로 배치한다. 제목으로 패널의 접근성 이름을 지정하고 선택 변경의 기존 `aria-live` 안내를 유지한다.
- `src/App.tsx`의 선택창 전달 방식은 현행을 따른다. 시작 버튼은 선택 ID를 넘기며 무한 모드에서 런을 시작하고 스토리 모드에서 스테이지 선택으로 연결된다. 타이틀로 및 선택적 코인 상점은 목록 아래에 표시한다.

### I02. 화면 크기와 흰 틈 처리

- `src/styles/global.css`의 기존 `.selector-shell--runner` 배경 스타일을 재사용한다. `src/app/screens/CharacterSelect.css`에 새 화면 전용 클래스를 정의하고 `CharacterSelect.tsx`에서 가져온다. 예전 카드·런웨이·높이 고정 규칙이 새 그리드에 적용되지 않도록 해당 구조 선택자를 분리한다.
- 너비 761px 이상은 목록 왼쪽·상세 오른쪽을 기본으로 한다. 760px 이하는 목록 아래에 상세를 놓는다. 목록은 `repeat(5, minmax(0, 1fr))`를 사용하고 모바일에서 간격·여백을 조절한다. 긴 한글 이름은 줄바꿈을 허용한다. 좁은 세로 화면에는 정상적인 세로 스크롤을 허용하며 가로 스크롤은 피한다.
- 저높이 가로 화면에서 패널의 그림이 가용 높이에 맞춰 줄어들게 한다. 전신에는 `object-fit: contain`을 적용하고 이름·패시브·시작 버튼의 공간을 확보한다. 카드와 전신 이미지에 강한 필터를 걸지 않는다.
- 사용자 확인에 따라 얼굴 카드와 전신의 그림 영역에 공통 `#fff`를 적용한다. 이름, 패시브와 바깥 화면은 현행 색을 사용한다. 히요리 전신 279×337이 너비 때문에 먼저 축소되지 않도록 패널 안 그림 높이를 가용 너비 이하로 제한한다. 대상 다섯 전신을 같은 높이로 합성해 손, 발, 머리 장식과 흰 틈을 확인한다.

### I03. 키보드와 회귀 검증

- `src/app/keyboardNavigation.ts`의 `moveGridFocus(event: KeyboardEvent<HTMLElement>, columns: number)`를 활용한다. 캐릭터 목록에는 실제 칸 위치를 나타내는 연속 인덱스를 사용한다. 필요하면 기존 사용 방식과 호환되는 선택적 슬롯 인덱스 분기를 추가한다. 비활성 버튼을 먼저 제거해 인덱스를 압축하면 세로 이동이 다른 열로 갈 수 있다.
- 같은 행·열의 다음 활성 카드로만 이동시키고 잠김·빈 칸은 건너뛴다. 이동 대상이 없으면 종료한다. 네이티브 버튼이 Enter/Space를 처리한다. 포커스 이동은 후보 확정과 구분하고, Tab으로 목록·상점·시작 버튼에 접근할 수 있게 한다.
- `src/app/screens/CharacterSelect.test.tsx`에서 5카드/10빈 칸, 선택 시 전신·이름·패시브 전환, 기존 ID 전달, 잠금 안내·확정 제한, 타이틀·상점 콜백을 검증한다. 아래 달리기 애니메이션을 검사하던 케이스는 정적 미리보기 검증으로 바꾼다.
- `src/app/keyboardNavigation.test.tsx`에서 격자 열 경계와 잠김·빈 칸 건너뛰기, Enter 비가로채기를 확인한다. 기존 키보드 호출 방식도 검증한다.

## 완료 조건

- [x] 5×3 목록과 상세 패널의 클릭·키보드·잠금 규칙을 DOM 테스트로 확인함.
- [x] 얼굴·전신 이미지의 흰 바탕과 다섯 캐릭터의 공통 전신 높이를 정적 비교 이미지로 확인함.
- [ ] 넓은 창·모바일 가로·세로 실화면 확인 대기. 브라우저 도구가 현재 탭 주소를 판별하지 못해 중단됨.
- [x] 무한 시작, 스토리 선택, 코인 상점과 타이틀 복귀를 자동 테스트로 확인함.

## 검증

- `npm test -- src/app/screens/CharacterSelect.test.tsx src/app/keyboardNavigation.test.tsx src/app/screens/RunResult.test.tsx`
- `npm test`, `npm run lint`, `npm run build`
- 로컬 브라우저 1920×1080, 1366×768, 915×412, 390×844, 320×568에서 이미지 로딩, 카드 선택, 방향키·Enter, 흰 틈, 가로 넘침과 시작 버튼을 점검한다. 브라우저 접근이 제한되면 실제 화면 확인은 미검증으로 기록한다.

## 커밋

```text
feat(selector): add a five-column character grid and detail panel

Plan: 2026-11-18-character-select-grid-preview
Phase: P01-selector
Task: T02-selector-layout
```

## 진행

- [x] 구현 완료
- [x] 테스트 359개, 린트와 빌드 통과
- 흰 배경 및 전신 프레이밍 비교 `test-results/selector-grid/art-review-white.png`
- 로컬 앱과 히요리 전신 이미지 HTTP 200. 브라우저 실화면은 수동 확인 항목으로 인계함.
