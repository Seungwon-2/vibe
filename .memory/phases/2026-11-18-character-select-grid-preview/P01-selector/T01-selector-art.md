# T01 선택창용 얼굴·전신 이미지 준비

## 상태 `done`

## 목표

기존 캐릭터 5명의 얼굴이 비슷한 크기로 보이는 썸네일과 발끝까지 담긴 전신 이미지를 준비한다. 투명 여백을 정리해 화면 배치가 안정적이고 흰 옷·머리카락의 디테일이 살아 있어야 한다.

## 결정 요약

512×512 투명 PNG는 원본으로 보존하고 선택창 전용 파생 이미지를 만든다. 참조 폴더의 다른 10장과 게임 내 동작 이미지는 별도 자산으로 둔다.

## 구현

### I01. 이미지 생성

- 원본 `assets/character/reference/stellive_sd_masters_512x512/`의 아래 파일 5개를 읽는다.
- 새 생성 스크립트 `scripts/build-selector-portraits.mjs`의 `main(check: boolean): Promise<void>`에서 기존 `sharp`를 사용한다. `--check`는 출력과 메타데이터를 검증한다.
- 새 출력 경로 `public/assets/character/selector-art/roster/<characterId>-face.webp`, `<characterId>-full.webp`에만 쓴다.

| 캐릭터 ID | 원본 | 얼굴 크롭 시작값 `(left, top, width, height)` |
| --- | --- | --- |
| `player-default` | `01_aokumo_rin_master.png` | `(159, 97, 176, 176)` |
| `hanayo-hiyori` | `06_hanayo_hiyori_master.png` | `(168, 114, 176, 176)` |
| `tokino-mary` | `08_tokino_merry_master.png` | `(168, 102, 176, 176)` |
| `goth-student` | `02_shizuki_toa_master.png` | `(168, 103, 176, 176)` |
| `cogane-rang` | `07_kogane_rang_master.png` | `(166, 100, 176, 176)` |

- 자료 구조 `ReadonlyArray<{ id: string; source: string; face: { left: number; top: number; width: number; height: number } }>`을 사용한다. 각 영역이 원본 경계 안에 있는지 확인한다.
- 원본 512×512와 알파 채널이 확인되면 얼굴 영역을 잘라 176×176 무손실 WebP로 저장한다. 인물마다 머리 위 장식과 얼굴이 잘 보이도록 위 값을 시각적으로 검토해 확정한다.
- 전신은 알파가 0보다 큰 픽셀의 범위를 구해 사방 최대 8px의 투명 여백을 두고 자른다. 원본 경계 안에서 처리하며 비율을 보존한다. 얼굴·손·발 장식 전부가 범위에 포함되어야 한다. 무손실 WebP로 내보내 투명 정보를 보존한다.
- 원본 누락, 잘못된 크기, 빈 알파 영역은 파일명을 포함한 오류로 종료한다. 검사 모드에서는 기존 출력이 없거나 예상 생성 버퍼와 다르면 실패 처리하고 파일을 쓰지 않는다.

### I02. 선택창에서 사용할 이미지 주소

- `src/app/screens/characterSelectArt.ts`에 `type CharacterSelectArt = Readonly<{ faceUrl: string; fullUrl: string }>`과 `getCharacterSelectArt(character: CharacterDefinition): CharacterSelectArt`를 제공한다.
- 등록된 다섯 ID에는 위 파일 경로를 반환한다. 추후 추가된 캐릭터에게 별도 이미지가 없으면 `character.portraitUrl`을 두 영역의 기본 이미지로 사용한다.
- `src/game/characters/characterCatalog.ts`의 `portraitUrl`은 결과 화면에서도 사용 중이므로 선택창 주소를 이 파일에 덮어쓰지 않는다.

## 완료 조건

- [x] WebP 10개가 존재하며 투명 정보와 전신 경계가 유효하다.
- [x] 얼굴 5개에서 인물의 특징과 주요 머리 장식이 잘 보인다.
- [x] 원본과 기존 카탈로그 이미지 URL이 보존된다.

## 검증

- `node scripts/build-selector-portraits.mjs`로 선택창용 파일을 생성한다.
- `node scripts/build-selector-portraits.mjs --check`로 재생성 없이 파일을 확인한다.
- `npm run build`로 타입 검사와 정적 자산 경로를 확인한다.
- 생성 이미지 10개를 열어 프레이밍과 흰 의상 디테일을 확인한다. 배경 판정은 T02에서 실제 화면 크기로 검증한다.

## 커밋

```text
feat(selector): prepare face and full-body character art

Plan: 2026-11-18-character-select-grid-preview
Phase: P01-selector
Task: T01-selector-art
```

## 진행

- [x] 구현 완료
- [x] 검증 통과
- `--check`, 변경 파일 ESLint, 빌드, `dist`의 이미지 10개 대조를 통과했다.
- 얼굴과 전신 10장이 포함된 비교 이미지 `test-results/selector-grid/art-review.png`를 확인했다. 흰 틈이 실제 화면 크기에서 보이는지는 T02에서 판단한다.
- 재생성에 필요한 원본 5장은 생성 스크립트 및 결과 이미지와 함께 저장한다.
