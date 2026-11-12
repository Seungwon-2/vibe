# Task: T02 Exact Phaser Engine Checkpoint

## Status: done

## Goal
현재 `RunnerSnapshot`뿐 아니라 Phaser 플레이어 물리 상태와 월드 생성 상태를 저장·복원하여 이어하기 직후 점프/하강·2단 점프·슬라이드·장애물·픽업의 화면 위치와 판정이 저장 순간과 이어지게 한다.

## Decision Summary
- 순간 복원은 거리만 복원하는 것으로 충족되지 않는다. 플레이어 y/velocity/ground/slide/jump와 현재 월드의 활성 오브젝트·생성 진행을 함께 복원한다.
- 저장 동안 게임 시간과 모든 효과 타이머는 정지한다.
- Phaser live object/Body를 JSON에 직접 저장하지 않는다. 순수 데이터 checkpoint로 바꾼다.

## Implementation

### I01. Player 및 world checkpoint 모델
- Related Files:
  - `src/game/runner/runnerSessionTypes.ts` :: `RunnerPlayerCheckpoint`, `RunnerWorldEntityCheckpoint`, `RunnerEngineCheckpoint`; modify.
  - `src/game/runner/RunnerPlayer.ts` :: `createCheckpoint`, `restoreCheckpoint`; modify.
  - `src/game/runner/RunnerScene.ts` :: `createCheckpoint`, `restoreCheckpoint`; modify.
  - `src/game/runner/ObstacleSpawner.ts` :: obstacle checkpoint/restore and generation cursor; modify.
  - `src/game/runner/CollectibleSpawner.ts` :: pickup/gate checkpoint/restore and schedule cursor; modify.
  - `src/game/runner/PitSpawner.ts` :: pit checkpoint/restore and generation cursor; modify.
  - `src/game/runner/RunnerPlayer.test.ts`, `RunnerScene.test.ts`, `ObstacleSpawner.test.ts`, `CollectibleSpawner.test.ts`, `PitSpawner.test.ts` :: round-trip cases; modify.

#### Details
- **Types**:
  ```typescript
  export type RunnerPlayerCheckpoint = Readonly<{
    x: number; y: number; velocityX: number; velocityY: number;
    grounded: boolean; jumpsUsed: 0 | 1 | 2; slidingHeld: boolean; hurt: boolean;
    passiveRescuing: boolean; pitFalling: boolean;
    airPhase: 'ascending' | 'descending'; animation: string;
    animationFrame: number; animationElapsedMs: number;
    bodyWidth: number; bodyHeight: number;
  }>;
  export type RunnerWorldEntityCheckpoint = Readonly<{
    id: string; kind: 'obstacle' | 'pickup' | 'pit' | 'gate' | 'goal';
    distanceMeters: number; state: Readonly<Record<string, string | number | boolean | null>>;
  }>;
  export type RunnerEngineCheckpoint = Readonly<{
    player: RunnerPlayerCheckpoint; worldDistance: number; randomSeed: number;
    obstacleCursor: number; pickupCursor: number; pitCursor: number;
    entities: readonly RunnerWorldEntityCheckpoint[];
    collectedPickupIds: readonly string[]; passedGateIds: readonly string[];
  }>;
  ```
  Replace generic entity state with discriminated unions where actual entity models require it. Preserve stable ID, definition, distance, animation/effect state, magnet progress and collision-resolution flags; never serialize Phaser references.
- `RunnerPlayer.createCheckpoint()` captures Arcade body position/velocity, body dimensions, grounded/jumps/sliding/hurt/air phase and sprite animation/frame/timing. `restoreCheckpoint(checkpoint)` validates finite values/enums, restores body enabled/gravity state, bounds, previous/current transforms, sprite frame and internal fields without applying a new jump/slide impulse.
- **Execution Flow / Logic**:
  1. Save boundary accepts an active session only when `RunnerSnapshot.phase === 'paused'`. Preserve all current `RunnerSnapshot` fields unchanged.
  2. `RunnerScene.createCheckpoint()` aggregates player, spawner active entity/cursors, random seed, collection IDs, current distance and visual offsets needed to prevent duplicate spawns.
  3. `RunnerScene.restoreCheckpoint(checkpoint)` runs after player/spawners are constructed and before first update. Restore state, visuals, collision bodies, previous-frame bounds/distances, background scroll offsets; suppress fresh tutorial/countdown/spawn emissions.
  4. Add checkpoint/restore methods to each spawner for active objects and schedule cursors. Preserve giant/speed pickups and magnet movement timers so pickups do not jump backward or recollect.
  5. Persist deterministic seed plus cursor and rebuild prior entities without firing callbacks, or persist every active entity and schedule cursor. No nondeterministic regeneration may alter the resumed course.
  6. Reject invalid numeric positions, out-of-range jump count, invalid dimensions or unknown entity kind; return restore failure instead of unsafe physics state.
- Preserve `remainingMs`, `elapsedMs`, `distanceMeters`, `worldDistance`, lives, coins, `giantRemainingMs`, `speedPickupRemainingMs`, protection/passive/cooldown timers, pickups, gates, biome and story stage exactly. While paused, neither simulation/world nor animation/effect time advances.
- **Tests**: restore ascending/descending double jump, grounded/mid-slide, body velocity/animation; serialize scene, restore and advance fixed frame, verify no duplicate pickup/gate/collision events or missing objects.

## Acceptance Criteria
- [ ] Saving/restoring while ascending, descending, in second jump, or sliding preserves pose, velocity, body dimensions and next-frame animation.
- [ ] Restored world does not duplicate/omit obstacles, pits, coins, boosts, gates or collected items.
- [ ] No coin/gate/collision callback fires twice due solely to restoration.
- [ ] All gameplay timer and buff values resume unchanged after wall-clock time away.
- [ ] Restore failure routes to invalid-save flow rather than leaving a broken Phaser scene.

## Validation
- `npm test -- --run src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/ObstacleSpawner.test.ts src/game/runner/CollectibleSpawner.test.ts src/game/runner/PitSpawner.test.ts src/game/runner/RunnerSimulation.test.ts`
- `npm run lint`

## Commit Message
```text
feat(game): checkpoint runner physics and world state

Plan: 2026-11-12-runner-session-resume
Phase: P01-session-recovery
Task: T02-engine-checkpoint

- Serialize player body, animation and action state
- Restore world entities and generator cursors without duplicate events
- Keep simulation and effect timers frozen while saved
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm test -- --run ...`: 6 files, 81 tests passed; `npm run lint` passed)
- commit: recorded in Git history
