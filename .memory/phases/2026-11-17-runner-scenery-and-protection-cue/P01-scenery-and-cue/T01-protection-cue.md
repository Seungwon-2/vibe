# T01 Protection cue

Status: done

## Goal and decision
Show existing giantRecoveryRemainingMs on the character itself. No timer/physics/save changes.

## Implementation
- src/game/runner/RunnerPlayer.ts :: setProtected(remainingMs: number, giantRecoveryRemainingMs = 0): void. Cache optional matchMedia('(prefers-reduced-motion: reduce)') once per player; query current matches on use.
- During recovery: alpha=0.75+0.25*cos(2*PI*(giantRecoveryMs-remaining)/500), yielding two smooth cycles over 1000ms, never invisible. Reduced motion: alpha=0.65 fixed. After expiry/finish alpha=1. Keep existing ordinary protection blink when recovery=0.
- src/game/runner/RunnerScene.ts :: calls to setProtected must pass snapshot recovery in update and collision/rescue callbacks. Optional field defaults0. Do not restart animations or modify poses.
- RunnerPlayer.test.ts: pulse boundaries/midpoint, alpha bounds, no pose/velocity mutation, reduced-motion and terminal cleanup. RunnerScene.test.ts: update passes actual decremented recovery to player.

## Acceptance / validation
- No new snapshot fields, particle system or camera effect.
- `npm test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts`
- `npm run build`

## Commit
fix(game): show a gentle character pulse during giant recovery

Plan: 2026-11-17-runner-scenery-and-protection-cue

Validation: 33 tests and build passed.
