# Task: T02 Remove Endless Time Pickups

## Status: done

## Goal
무한 코스에서는 개별 시간 회복 픽업을 생성하지 않고 게이트 보너스만 시간을 회복하게 한다. Story 코스의 시간 모양 픽업은 기존 3초 속도 부스트로 유지한다.

## Decision Summary
- Endless schedule에는 코인 및 거대화 픽업만 존재한다. 게이트의 `gateBonusMs`는 유지한다.
- Story schedule의 기존 time-kind 픽업은 화면의 ‘시간’ 회복이 아니라 `storySpeedBoostMs` 동안 `storySpeedBoostRatio`를 적용한다.

## Implementation

### I01. Generate mode-specific time pickup schedules
- Related Files:
  - `src/game/runner/CollectibleSpawner.ts` :: `getTimePickupSlotIndexes`, `generatePickupSchedule`, `PICKUP_SCHEDULE` — Endless safe slots를 코인 전용으로 만들고 Story만 기존 시간형 픽업 유지; modify
  - `src/game/runner/CollectibleSpawner.test.ts` :: schedule tests — Endless 시간 픽업 0개 및 Story 픽업 유지; modify
  - `src/game/runner/RunnerSimulation.test.ts` :: `collectPickup` cases — Story time-kind 수집은 속도 부스트, Endless의 유효 시간 픽업 API 동작 회귀 확인; modify only if needed

#### Details
- `generatePickupSchedule(maxDistanceMeters, storyStageId = null)` remains public and returns the same `PickupDefinition[]` shape.
- Keep safe pickup cadence, hazard/pit/gate clearance, optional jump/slide coin rows, and giant pickup scheduling unchanged.
- For `storyStageId === null`, do not derive `kind: 'time'` from time slots; every scheduled safe pickup uses `kind: 'coin'` and an ID of `safe-${index}`.
- For a non-null Story stage, retain the existing `getTimePickupSlotIndexes` cadence, `time-${index}` IDs, and `kind: 'time'` so `collectPickup` routes it to Story speed boost.
- Do not remove `timePickupMs` or gate bonus behavior in this task; legacy/API time pickup behavior may remain unreachable in Endless generated course, and Story must not award timer recovery.
- Tests inspect `generatePickupSchedule(15_000)` for no `time` kinds and inspect every Story stage schedule to ensure its existing time-kind speed boost pickups remain scheduled.

## Acceptance Criteria
- [ ] No `kind: 'time'` item appears in the Endless pickup schedule at any generated distance.
- [ ] Story stages retain their authored `kind: 'time'` boost pickups.
- [ ] Gate time bonuses, coins, giant pickups, and safe-spacing rules remain intact.

## Validation
- `npm test -- src/game/runner/CollectibleSpawner.test.ts src/game/runner/RunnerSimulation.test.ts` — all targeted tests pass.
- `npm run typecheck` — no TypeScript errors.

## Commit Message
```text
fix(runner): reserve time recovery for endless gates

Plan: 2026-11-03-endless-lives-time-pressure
Phase: P01-endless-risk-and-pickups
Task: T02-remove-endless-time-pickups

- Remove standalone timer pickups from Endless course schedules
- Preserve Story time pickups as temporary speed boosts
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `5008fbd`
