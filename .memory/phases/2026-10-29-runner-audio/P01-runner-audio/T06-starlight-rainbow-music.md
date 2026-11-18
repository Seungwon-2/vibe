# Task: T06 별빛 무지개길 배경음

## Status: done

## Goal

무한 모드에서 별빛 무지개길에 들어가면 사용자가 만든 OGG 파일을 반복 재생한다. [결정 문서](../../../decisions/2026-11-18-starlight-rainbow-music.md)

## Implementation

- `src/audio/musicCatalog.ts`의 `RunnerMusicId`를 `'title' | RunnerBiomeId`로 정의하고 `RUNNER_MUSIC['starlight-rainbow']`에 `{ src: '/audio/music/starlight-rainbow-road.ogg', loop: true }`를 등록한다.
- `src/app/screens/RunScreen.tsx`는 무한 모드에서 `snapshot.biomeId`로 배경음을 선택한다. 스토리 모드는 선택한 코스의 배경음 ID를 사용한다.
- `src/audio/musicCatalog.test.ts`, `src/app/screens/RunScreen.test.tsx`로 자산과 실제 전환 호출을 검증한다.

## Acceptance Criteria

- [x] 별빛 무지개길에 들어갔을 때 전용 곡을 선택하고, 이후 같은 테마의 반복 게이트에서 곡을 처음부터 다시 재생하지 않는다.
- [x] 새 파일이 로컬 서빙과 빌드 결과에 들어간다.

## Validation

- `npm test -- src/audio/musicCatalog.test.ts src/audio/RunnerMusicManager.test.ts src/app/screens/RunScreen.test.tsx`
- `npm run typecheck`, `npm run lint`, `npm run build`

## Progress

- 대상 테스트 22개, 타입 검사, 린트, 빌드 통과.
- 로컬 Edge에서 32초 스테레오 OGG 해석에 성공했다. 빌드 출력의 파일이 원본과 일치한다.

## 후속 음량 조정

- 별빛 무지개길 배경음의 기본 재생 레벨을 곡별 배율 `1.26`으로 올린다. 변경 전 네 코스와 새 곡의 원본을 Edge로 디코딩해 1초 구간 RMS를 비교했다. 별빛 무지개길의 중앙값은 약 −18.4dBFS이며 다른 코스는 약 −18.1~−14.5dBFS였다.
- `src/audio/musicCatalog.ts`에서 `gain?: number`를 해당 곡에 지정한다. `RunnerMusicManager.ts`에서 재생 시작과 설정 변경 양쪽에 배율을 적용한다. 원본 파일, 음악 슬라이더, 음소거, 다른 곡과 효과음은 기존 설정을 따르도록 한다.
- 오디오와 RunScreen 대상 테스트 30개, 린트, 빌드 통과. 곡 전환, 음악 슬라이더와 음소거를 확인했다.

## 추가 음량 조정

- 별빛 무지개길 곡 재생 배율을 `1.26`에서 `1.55`로 올린다.
- `src/audio/audioPreferences.ts`의 새 설정용 효과음 기본값을 `0.5`에서 `0.45`로 낮춘다. 저장된 음악·효과음 슬라이더 위치 및 마이그레이션은 유지한다.
- 오디오·결과 화면 관련 테스트 26개, 린트, 빌드 통과.

## Commit Message

```text
feat(audio): play the Starlight Rainbow Road track

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T06-starlight-rainbow-music
```
