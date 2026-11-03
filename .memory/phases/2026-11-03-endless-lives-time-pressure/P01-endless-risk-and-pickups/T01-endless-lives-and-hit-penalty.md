# Task: T01 Endless Lives and Hit Penalty

## Status: done

## Goal
무한 모드에 런당 생명 3개를 적용하고, 보호되지 않은 장애물 충돌 때 생명과 거리 구간별 시간을 차감한다. 생명이 0이면 `lives-exhausted` 결과를 만든다. HUD는 남은 생명을 보여야 하며 Story 동작은 유지한다.

## Decision Summary
- 시간 페널티 구간: `<2000m: 5000ms`, `2000–3999m: 7000ms`, `4000–5999m: 9000ms`, `6000–7999m: 11000ms`, `>=8000m: 13000ms`.
- Hiyori 보호 충전은 한 번에 1회 소모되어 생명·시간·경직 차감을 막고 기존 1,200ms 보호 구간을 적용한다.
- Endless 낭떠러지는 즉시 런 종료로 유지하고, Hiyori의 기존 낭떠러지 복귀 보호는 유지한다.

## Implementation

### I01. Endless snapshot and collision rules
- Related Files:
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG` — 생명 수와 페널티 구간 설정; modify
  - `src/game/runner/RunnerSimulation.ts` :: `createRunnerSnapshot`, `applyCollision` — 초기 생명, 거리별 차감 및 0 도달 종료; modify
  - `src/game/runner/runnerTypes.ts` :: `RunnerFinishReason`, `RunnerSnapshot`, `RunnerResult` — 기존 `lives-exhausted` 이유를 Endless에서도 사용하고 생명 필드를 유지; modify only if type constraints require
  - `src/game/runner/RunnerSimulation.test.ts` :: `applyCollision` cases — Endless 생명·거리 계층·Hiyori·Story 회귀 검증; modify
  - `src/game/runner/CollisionSystem.test.ts` :: `tryResolveHazardHit` cases — 충돌 결과 완료 상태 전파 검증; modify if required

#### Details
- **Types and constants**:
  - `RUNNER_CONFIG.endlessLivesPerRun: 3`.
  - `RUNNER_CONFIG.endlessCollisionPenaltyTiers` is a readonly ordered list of `{ maxDistanceMeters: number | null, penaltyMs: number }` with bounds 2,000/4,000/6,000/8,000 and values 5,000/7,000/9,000/11,000/13,000.
  - `getEndlessCollisionPenaltyMs(distanceMeters: number): number` returns the penalty for the half-open interval containing distance; the final `null` upper bound is unbounded.
  - `livesRemaining` remains optional in the public snapshot/result type for old stored results, but `createRunnerSnapshot(..., { mode: 'endless' })` sets it to 3 and Story still initializes from `storyLivesPerStage`.
- **Execution flow**:
  1. On a valid Endless collision, first honor existing global protection, giant immunity, Toa guard, then Hiyori guard, in that order.
  2. For an unprotected Endless collision, decrement lives by one (never below zero), add one to `hitsTaken`, subtract the distance-tier penalty from `remainingMs` (never below zero), and apply existing `staggerMs` and `protectionMs`.
  3. If lives reach zero, finish with `finishReason: 'lives-exhausted'`; otherwise if time reaches zero, finish with existing timeout reason. The time value is still clamped to zero by `finishRunner`.
  4. Story collision continues to decrement only Story lives and uses existing 800ms hit protection; it does not use Endless penalty tiers.
  5. Existing pit behavior remains untouched: pit ends a non-Hiyori run immediately; Hiyori consumes a passive charge and returns safely.
- **Tests**: verify initial Endless lives=3 / Story lives=3; hits at distances 0, 2,000, 4,000, 6,000, 8,000 yield penalties 5/7/9/11/13 seconds; first two ordinary Endless hits decrement life and time; third ends with `lives-exhausted`; Hiyori blocks both counters; Story collision behavior remains unchanged.

### I02. Endless HUD life display
- Related Files:
  - `src/app/components/RunnerHud.tsx` :: `RunnerHud` — show Endless lives alongside Story lives; modify
  - `src/app/components/RunnerHud.test.tsx` :: `RunnerHud` tests — assert 3/2/1 hearts and keep Story display; modify
  - `src/app/screens/RunResult.tsx` :: result animation selection — use game-over pose for `lives-exhausted`, including a personal-best run; modify
  - `src/app/screens/RunResult.test.tsx` :: `RunResult` — assert lives-exhausted uses game-over pose; modify

#### Details
- Render the current `.runner-hud__lives` widget when `snapshot.mode === 'story'` or `snapshot.mode === 'endless'`.
- For Endless use `RUNNER_CONFIG.endlessLivesPerRun` as the maximum heart count; for Story use `RUNNER_CONFIG.storyLivesPerStage`.
- Keep accessible label `남은 생명 N개` and use filled hearts for remaining lives plus empty hearts for the mode maximum.
- Result animation must treat `lives-exhausted` like `pit` and keep `gameOver` even when the run set a personal best. Timeout/personal-best and Story stage-complete animation behavior stays unchanged.

## Acceptance Criteria
- [ ] Endless starts with 3 visible lives; each valid non-protected hit consumes exactly one life and the distance-tier time penalty.
- [ ] Third valid hit finishes the run with `lives-exhausted`, independently of remaining timer.
- [ ] Hiyori's collision defense blocks life/time/stagger penalties; Story collision/pit behavior remains unchanged.
- [ ] Endless HUD shows life count accessibly, with Story HUD unchanged.

## Validation
- `npm test -- src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts src/app/components/RunnerHud.test.tsx` — all targeted tests pass.
- `npm test -- src/app/screens/RunResult.test.tsx` — life-depletion result uses the defeat pose.
- `npm run typecheck` — no TypeScript errors.

## Commit Message
```text
feat(runner): add lives and escalating hit penalties to endless mode

Plan: 2026-11-03-endless-lives-time-pressure
Phase: P01-endless-risk-and-pickups
Task: T01-endless-lives-and-hit-penalty

- Give Endless runs three lives and end the run when they are depleted
- Increase collision time penalties by distance tier and show remaining lives in the HUD
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `0b8a9bf`
