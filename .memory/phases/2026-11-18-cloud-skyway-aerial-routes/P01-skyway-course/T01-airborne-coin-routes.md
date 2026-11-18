# Task: T01 공중 코인 길과 착지 여유

## Status: done

## Goal

스토리 4장의 기본 완주 경로와 35코인 도전 목표를 유지하면서 2단 점프로 노리는 공중 코인 길을 두 곳 만든다.

## Decision Summary

- 중반은 안전한 지상과 짧은 코인 줄, 후반은 진입부 지상 장애물과 더 긴 코인 줄을 제공한다. 코인의 높이 변화로 점프를 안내한다.
- 스토리 4장의 새 런에 적용한다. 기존 런은 저장된 코스 배치로 복구한다.

## Implementation

### I01. 코스 배치와 순서

- `src/game/runner/storyCourses.ts`의 `getStoryHazardSchedule(stageId: StoryStageId, revision?: StoryCourseRevision): readonly StoryHazardPlacement[]`에 2번째 배치를 추가한다. 기본값은 `2`다. 기존 배치에서 `skyway-slide-04`, `skyway-slide-06`을 빼고 `skyway-jump-04`, `skyway-jump-06`, `skyway-slide-07`을 각각 1,785m, 3,290m, 3,700m로 옮긴다. 기존 높은 장벽 2,920m 뒤에 조작 복귀 공간을 둔다.
- `src/game/runner/storyPitSchedule.ts`의 `getStoryPitDefinitions(stageId: StoryStageId, maxDistanceMeters: number, revision?: StoryCourseRevision)`는 revision 2의 하늘길 넓은 낭떠러지 폭을 120m로 조정한다. 중심 거리 2,600m, 안전 여백, 2단 점프 요구를 검증한다. revision 1과 다른 스테이지에는 기존 130m 폭을 적용한다.
- `src/game/runner/CollectibleSpawner.ts`의 `generatePickupSchedule(maxDistanceMeters: number, storyStageId?: StoryStageId | null, revision?: StoryCourseRevision)`에 스토리 4장 revision 2 전용 배치를 연결한다. 코인은 `PickupDefinition`으로 처리한다. `id`는 `skyway-air-<group>-<index>` 규칙을 쓰며 `kind`는 `coin`, `distanceMeters`는 월드 거리, `heightUnits`는 바닥 위 픽셀, `optionalJump`는 높이에 따라 지정한다. 중반 1,550–1,662m, 후반 3,232–3,412m에서 낮게 시작하고 올라갔다 내려오는 코인 줄을 만든다. 두 줄의 높은 중앙부는 2단 점프로 수집할 수 있다. 넓은 낭떠러지 착지부와 장벽 너머도 안전한 코인으로 안내한다. 기존 충돌·겹침 검사를 통과한 위치만 사용하고 코인 줄과 겹치는 기본 코인을 대체한다. 초반 거대화는 점프로 선택 획득하게 해 기본 속도에서 중반 공중 코인 길을 공략할 수 있게 한다.

### I02. 저장 호환 및 검증

- `src/game/runner/runnerTypes.ts`에 `StoryCourseRevision = 1 | 2`와 `RunnerSnapshot.storyCourseRevision?: StoryCourseRevision`을 정의한다. `src/game/runner/RunnerSimulation.ts`의 `createRunnerSnapshot`은 하늘길 새 런에만 `2`를 넣는다. 저장에 필드가 없으면 `1`로 해석한다. `src/services/RunnerSessionStore.ts`에서 값과 적용 스테이지를 검사한다.
- `src/game/runner/ObstacleSpawner.ts`, `PitSpawner.ts`, `CollectibleSpawner.ts`의 생성과 복구가 스냅샷의 배치 번호를 일관되게 사용하도록 연결한다. 복구 시 코인 ID·거리 및 기존 배열 순서가 유지되는지 확인한다. 현재 포인터의 이전 작업 내역은 보존한다.
- 실제 게임의 중력·점프 속도·판정 상자 치수로 중반과 후반의 진입 및 착지를 검증한다. 기본 점프와 랑의 높은 2단 점프, 린의 빠른 달리기를 비교하고 착지 뒤 다음 장애물까지의 여유를 확인한다. 코인 개수만 세는 검증과 실제 도달 가능성의 검증을 함께 둔다.

## Acceptance Criteria

- [x] 스토리 4장에 두 길이 모두 표시되며 기본 지상 경로로도 통과할 수 있다.
- [x] 코인과 위험물의 위치가 겹치지 않고, 보상 길에서 하강할 때 다음 장애물에 바로 닿지 않는다.
- [x] 넓은 낭떠러지와 높은 장벽을 기본 2단 점프로 통과할 수 있고 4,000m 완주와 35코인 조건이 유지된다.
- [x] 배치 번호가 없는 하늘길 저장과 새 하늘길 저장은 각자의 배치에서 복구된다.

## Validation

- `npm test -- src/game/runner/cloudSkywayCourse.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/pitChallengeSchedule.test.ts src/game/runner/RunnerScene.test.ts src/services/RunnerSessionStore.test.ts`
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`

## Commit Message

```text
feat(runner): add aerial coin routes to Cloud Skyway

Plan: 2026-11-18-cloud-skyway-aerial-routes
Phase: P01-skyway-course
Task: T01-airborne-coin-routes
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- 전체 테스트 363개, 타입 검사, 린트 및 빌드 통과. 빌드에 기존 500kB 청크 크기 경고가 있다.
- 격리된 로컬 Edge에서 린으로 공중 코인 길 두 곳을 지나 4,000m 무피격 완주와 코인 62개를 확인했다.
- 같은 브라우저 조건에서 중반은 지상으로 통과하고 후반 첫 장애물은 기본 점프로 넘어, 선택 공중 루트 없이 4,000m 무피격 완주와 코인 53개를 확인했다.
- 기존 하늘길과 다른 스토리, 무한 모드의 픽업 목록을 변경 전 코드와 비교해 동일함을 확인했다.
