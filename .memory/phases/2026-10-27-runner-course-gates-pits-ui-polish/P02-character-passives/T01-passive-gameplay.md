# Task: T01 Character Passive Gameplay

## Status: in_progress

## Goal

Implement the three agreed passive abilities as deterministic gameplay effects and remove coded placeholder passives from Toa and Rang until they become playable.

## Decision Summary

- Rin: 「질주의 메이드」, cloud emblem, +5 percentage points to her maximum-speed target. This adds to (not multiplies) the shared +5 points per passed gate.
- Hiyori: 「유령의 수호」, pink flame emblem, two total per-run blocks against ordinary collision or pit fall. A block removes no time, causes no stagger, emits a brief effect, and protects against that triggering hazard. No recharge. Once exhausted, ordinary collisions use standard behavior and pits end the run immediately.
- Mary: 「별빛 자석」, sparkling magnet emblem, item collection radius +30px.
- Keep every tuning value centrally configurable. Toa and Rang return `unassigned` until playable; no active abilities or settings UI.

## Implementation

### I01. Passive definitions and state

- Related Files:
  - `src/game/characters/characterAbilities.ts` :: `CharacterPassiveId`, `CharacterPassiveDefinition`, `CHARACTER_PASSIVES`, `CHARACTER_PASSIVE_BY_ID`, `getCharacterPassive`, `getCharacterPassiveId` — modify.
  - `src/game/characters/characterTypes.ts` :: `CharacterDefinition.passive` — modify only if needed for the `unassigned` variant.
  - `src/game/runner/runnerTypes.ts` :: `RunnerSnapshot` — add remaining finite passive resource state.
  - `src/game/runner/RunnerSimulation.ts` :: `createRunnerSnapshot`, `advanceSegment`, `applyCollision`, `collectPickup`, `finishRunner` — modify.
  - `src/game/characters/characterAbilities.test.ts` — new central-value mapping tests.

#### Details

- Replace obsolete effect IDs with exactly `'rin-speed' | 'hiyori-guard' | 'mary-pickup-magnet' | 'unassigned'`.
- Define the model as a discriminated union:
  ```typescript
  export type CharacterPassiveId = 'rin-speed' | 'hiyori-guard' | 'mary-pickup-magnet' | 'unassigned';
  export type CharacterPassiveDefinition =
    | Readonly<{ id: 'rin-speed'; speedBonusRatio: number; name: string; icon: 'cloud'; effectLabel: string }>
    | Readonly<{ id: 'hiyori-guard'; chargesPerRun: number; name: string; icon: 'pink-flame'; effectLabel: string }>
    | Readonly<{ id: 'mary-pickup-magnet'; radiusPx: number; name: string; icon: 'sparkling-magnet'; effectLabel: string }>
    | Readonly<{ id: 'unassigned'; name: string; icon: null; effectLabel: string }>;
  ```
- Use values `speedBonusRatio: 0.05`, `chargesPerRun: 2`, `radiusPx: 30`; exact labels must include `최고 속도 +5%`, `충돌/낭떠러지 방어 2회`, and `수집 반경 +30px`.
- Map `player-default` to `rin-speed`, `hanayo-hiyori` to `hiyori-guard`, `tokino-mary` to `mary-pickup-magnet`, and `goth-student`/`cogane-rang` to `unassigned`.
- Add `passiveChargesRemaining: number` to `RunnerSnapshot`; initialize to the selected passive's `chargesPerRun` or zero. Preserve it through immutable state transitions; do not add charge state to the persisted result or ranking record.
- For Rin, compute the target additive percentage as `gateCount * gateSpeedBonusRatio + speedBonusRatio`; at five gates her target is base maximum speed × 1.30. Other assigned characters use only `gateCount * 0.05`.
- For Mary, `getPickupBodySize` must expand by 30px on each side (`24 + 2 * 30 = 84` total overlap width). No other character receives this expansion.

### I02. Collision and pit defense outcomes

- Related Files:
  - `src/game/runner/RunnerSimulation.ts` :: `applyCollision`, new `applyPitFall` — modify.
  - `src/game/runner/CollisionSystem.ts` :: `tryResolveHazardHit`, new `tryResolvePitFall` — modify.
  - `src/game/runner/RunnerScene.ts` :: `handleHazardOverlap`, `handlePitFall`, `emitFinished` — modify.
  - `src/game/runner/RunnerPlayer.ts` :: `setPassiveEffect` — add a brief character-side activation effect.
  - `src/game/runner/runnerEvents.ts` :: `RunnerEvent`, `RunnerEventEmitter` — add passive activation event.
  - `src/game/runner/RunnerSimulation.test.ts` :: charges, penalties, speed and pickup effects — modify.
  - `src/game/runner/CollisionSystem.test.ts` :: obstacle and pit results — modify.
  - `src/game/runner/RunnerScene.test.ts` :: event and finish paths — modify.

#### Details

- Keep existing signature `applyCollision(state: RunnerSnapshot): RunnerSnapshot`. Define `tryResolveHazardHit(state: RunnerSnapshot): { state: RunnerSnapshot; hit: boolean; blockedByPassive: boolean; result: RunnerResult | null }` and `tryResolvePitFall(state: RunnerSnapshot): { state: RunnerSnapshot; blockedByPassive: boolean; result: RunnerResult | null }` so scene callers can distinguish a spent defense from a terminal pit fall.
- Add `applyPitFall(state: RunnerSnapshot): { state: RunnerSnapshot; blockedByPassive: boolean }`. If Hiyori has charges, decrement one, keep `phase: 'running'`, preserve `remainingMs`, `distanceMeters`, `staggerRemainingMs`, and `finishReason`, and set a short passive-effect duration of 700ms. If no charge (or another character), call `finishRunner(state, undefined, 'pit')` and return the terminal state.
- On an ordinary collision, honor existing invulnerability first. If Hiyori has charges, decrement one and do not subtract the existing 5,000ms penalty, add 1,200ms stagger, or set ordinary-hit protection. Otherwise preserve standard collision behavior.
- Add `passiveEffectRemainingMs: number` to `RunnerSnapshot`, initialize to zero, and decrement during both normal movement and staggered-time advancement; it is visual state only and must not stop elapsed time or movement. Call `RunnerPlayer.setPassiveEffect(remainingMs)` to present the brief character-side effect without granting generic extra invulnerability.
- Add event `Readonly<{ type: 'passive-triggered'; passiveId: 'hiyori-guard'; remainingCharges: number; trigger: 'obstacle' | 'pit' }>` and an emitter method that forwards it once per blocked event.
- On blocked pit, remove/consume the pit overlap and continue at the same safe lane position; no checkpoint reset or timer penalty. On unblocked pit, preserve the pit finish reason and force the player game-over animation even if that distance is a personal best. Normal timeout/personal-best animation behavior remains unchanged.
- `emitFinished` must preserve result reason when recording; the local ranking continues sorting by distance/coins/date only.

## Acceptance Criteria

- [ ] Rin's speed bonus is additive with gates and absent for other characters.
- [ ] Hiyori starts with exactly two charges and completely blocks two mixed obstacle/pit events; the third ordinary hit follows normal collision behavior, while an unblocked pit immediately finishes.
- [ ] Blocked pits preserve the run and resume safely; passive activation events report the remaining count.
- [ ] Mary pickup overlap expands by 30px per side; old Hiyori +20px and Mary +250ms hit-protection behaviors are removed.
- [ ] Toa and Rang produce `unassigned` with no gameplay effect.

## Validation

- `npm run test -- src/game/characters/characterAbilities.test.ts src/game/runner/RunnerSimulation.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/CollectibleSpawner.test.ts` — ability mapping, speed, charges, pit rescue, collision, and radius cases pass.
- `npm run typecheck` — discriminated passive union and event types compile.

## Commit Message

```text
feat(characters): add distinct speed guard and magnet passives

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P02-character-passives
Task: T01-passive-gameplay

- Add centrally tuned Rin, Hiyori, and Mary passive effects
- Remove Toa and Rang placeholder abilities until playable
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
