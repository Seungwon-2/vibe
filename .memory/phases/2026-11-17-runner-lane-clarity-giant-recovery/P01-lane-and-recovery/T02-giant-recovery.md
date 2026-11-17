# T02 Giant expiry recovery

Status: done

## Target files and symbols
- src/game/runner/runnerConfig.ts: giantRecoveryMs=1000.
- src/game/runner/runnerTypes.ts: RunnerSnapshot.giantRecoveryRemainingMs?: number, legacy absence=0.
- src/game/runner/RunnerSimulation.ts: createRunnerSnapshot, advanceSegment and frozen branch, collectPickup, applyCollision, finishRunner. Grant only on natural giant expiration, subtract expiry overshoot; pause freezes; refreshed giant resets recovery; no passive/life/time/hit consumption during recovery. Pits unchanged.
- src/services/RunnerSessionStore.ts: isSnapshot optional finite nonnegative recovery validation; valid save round trip.
- src/app/components/RunnerHud.tsx: reuse giant slot for recovery timer without adding layout tracks.
- src/app/components/RunnerGuideDialog.tsx: accurate recovery rule and distinguish body enlargement from 2.5x speed.
- Associated Simulation, SessionStore, Hud tests.

## Models and edges
Recovery number in milliseconds, optional for old saves, initialized 0. No result/API field required. Short frame, overshoot, frozen expiry, pause, refresh, terminal, Hiyori/Toa priority and pits must be tested.

## Validation
`npm test -- src/game/runner/RunnerSimulation.test.ts src/services/RunnerSessionStore.test.ts src/app/components/RunnerHud.test.tsx src/app/components/RunnerGuideDialog.test.tsx src/game/runner/CollisionSystem.test.ts`
`npm run build`

## Commit
fix(game): protect runners for one second after giant expires

Plan: 2026-11-17-runner-lane-clarity-giant-recovery

Validation: 58 focused tests and production build passed. Natural expiry, overshoot/gate, pause, legacy save, passive priority and pits covered.
