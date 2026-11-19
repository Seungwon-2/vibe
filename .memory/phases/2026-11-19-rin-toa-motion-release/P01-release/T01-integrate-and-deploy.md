# T01 린·토아 모션 반영 및 배포

## Status: in_progress

## 구현

- 검증된 로컬 린 48장 PNG와 토아 48장 WebP를 `public/assets/character/selector-art/runs/{id}/`와 `public/assets/character/game-motion/{id}/`의 기존 경로에 반영한다. 린 ID는 `player-default`, 토아 ID는 `goth-student`다. 로컬 테스트 자료와 작화 원본은 로컬에 보관한다.
- `runnerAnimationConfig.ts`에서 린과 토아의 전환 사용 여부를 정의한다. `RunnerScene.ts`는 기존 `slide` 순서를 유지하며 두 캐릭터에 `slide-enter`, `slide-exit` 슬롯을 추가한다. 진입은 01–04번, 복귀는 05–06번이며 둘 다 18fps 단발이다. 토아 2단 점프 하강은 06번을 유지한다.
- `RunnerPlayer.ts`는 입력으로 충돌 자세를 즉시 조절하면서 스프라이트의 04번 유지와 복귀를 재생한다. 기존 저장의 `slide` 키를 읽을 수 있게 유지하며, `animationFrame: number`의 Phaser 1기반 인덱스를 사용한다. 초기 0도 첫 프레임으로 허용한다.
- `runnerPose.ts`에서 토아 화면 배율은 1, 물리 너비는 64, 높이는 48로 유지한다. `ObstacleSpawner.ts`와 `runnerHazards.ts`에서 토아 런의 통로 그림 여유를 68로 표시한다. 실제 충돌 위치와 크기는 기존 함수에서 계산한다.
- 토아 해금은 정식 프로필을 따른다. 선택창 승리 모션과 배경, 누적된 공중 코스 및 음향 변경도 현재 브랜치로 배포한다.

## 검증

- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`
- 정식 엔트리에서 토아 선택, 장애물 통과와 슬라이드 전환 및 이어하기 확인
- `git push origin project02` 뒤 `Deploy Stella Runner` 결과와 Azure 공개 주소의 새 정적 에셋 확인

## 사전 검증 결과

- 테스트 366개, 린트, 타입 검사와 빌드 통과.
- 정식 앱 경로에서 토아의 초기 잠금, 해금된 프로필로 선택 및 04번 유지 상태의 이어하기를 확인했다. 슬라이드 6장을 재생하고 64×48 판정으로 장애물을 통과했다.

## 커밋

```text
feat(runner): release refreshed Rin and Toa motion

Plan: 2026-11-19-rin-toa-motion-release
Phase: P01-release
Task: T01-integrate-and-deploy
```
