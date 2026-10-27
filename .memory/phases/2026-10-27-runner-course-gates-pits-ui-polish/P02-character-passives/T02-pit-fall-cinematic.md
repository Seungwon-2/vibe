# Task: T02 Fatal Pit Fall Cinematic

## Status: in_progress

## Goal

When a pit ends a run, visibly animate the player falling below the playfield, shake the game camera briefly, and only then publish and record the finished run. Keep course distance and timer fixed at pit contact, and skip the fatal sequence when Hiyori's guard blocks the fall.

## Decision Summary

- Use a 700ms downward fall followed by a 250ms game-camera shake. The page UI outside the game canvas does not shake.
- Freeze simulation, background, hazards, pickups, and timer at pit contact. Preserve the contact-time distance and coins in the final result; cinematic time is not added to run duration.
- Keep the existing `finishReason: 'pit'` and game-over result behavior, including game-over animation on a personal-best distance.
- A pit blocked by Hiyori's guard consumes the charge, shows the short pink-flame near-fall bounce from P02-T01, and continues without this fatal animation or finish event.

## Implementation

### I01. Player fall pose and lockout

- Related Files:
  - `src/game/runner/RunnerPlayer.ts` :: `RunnerAction`, `RunnerAnimation`, `jump`, `setSliding`, `update`, `finish` — add and enforce fatal-pit fall state; modify.
  - `src/game/runner/RunnerScene.ts` :: animation frame setup — provide the descending animation used during the fall; modify only if the existing `jump-fall` animation is not available for the selected character.
  - `src/game/runner/RunnerPlayer.test.ts` :: fatal-fall state tests; modify.

#### Details

- Add `beginPitFall(): void` to `RunnerPlayer`. It must be idempotent, lock out jump and slide input, clear held slide/grace, play the existing repeating `jump-fall` animation, and disable the Arcade body and gravity so the transparent floor cannot catch the falling sprite.
- Add a private `pitFalling` state. `jump`, `setSliding`, `update`, and `finish` must respect it: no new input or normal run/ground pose may replace the fall pose. `finish('gameOver')` must still transition the falling player into the existing terminal action exactly once.
- The scene owns the visual translation tween; `RunnerPlayer.beginPitFall()` only prepares the pose/body and exposes the existing `gameObject` sprite.
- Tests must verify that a repeated `beginPitFall()` does not restart the animation, jump returns false, sliding cannot replace the fall action, the body is disabled, and `finish('gameOver')` remains usable.

### I02. Delay pit finish until after visual sequence

- Related Files:
  - `src/game/runner/RunnerScene.ts` :: fields, `update`, `handlePitFall`, `emitFinished`, `cleanup` — own and finalize the cinematic; modify.
  - `src/game/runner/RunnerScene.test.ts` :: pit finish lifecycle — verify delayed publication and one-shot completion; modify.
  - `src/game/runner/CollisionSystem.ts` :: `tryResolvePitFall` — use the resolver added in P02-T01; read-only.

#### Details

- Add scene state sufficient to guard duplicate pit callbacks and hold the terminal snapshot/result while the visual sequence plays: one boolean cinematic lock and nullable pending `{ state: RunnerSnapshot; result: RunnerResult }`.
- `handlePitFall` must use P02-T01's `tryResolvePitFall(this.snapshot)` result. If `blockedByPassive` is true, publish the returned running state and return without starting the cinematic. If there is no terminal result, return. Ignore callbacks after a cinematic starts or a finish was emitted.
- For a terminal pit result, keep the live scene snapshot at the pit-contact running state, save the returned finished state/result, clear input and held keys, and call `player.beginPitFall()`. Do not call `emitFinished`, `browserPersonalBestStore.record`, or emit a finished snapshot yet.
- Skip simulation advancement, input consumption, backdrop updates, and all spawner updates while the cinematic lock is active. Phaser's tween and scene timer must continue so the fall and shake can finish.
- Tween `player.gameObject.y` downward until the sprite is fully below the 540px playfield (`y >= 620`) over 700ms with a downward-accelerating ease. Then call `this.cameras.main.shake(250, 0.012)` and schedule finalization after 250ms.
- Finalization must be guarded and one-shot: publish the saved finished snapshot, clear the pending cinematic state, then call the existing `emitFinished(savedResult)`. `emitFinished` continues to record the unchanged pit-contact result and select `gameOver` for `finishReason === 'pit'` even when it is a personal best.
- `cleanup` must cancel/stop any owned fall tween or delayed finalization and clear pending state so a scene shutdown cannot submit the run later.
- Scene tests must verify the simulation snapshot does not advance during the cinematic, no finish/result callback is emitted before the 700ms tween and 250ms shake complete, exactly one result is recorded after both callbacks, the original distance/coins and `finishReason: 'pit'` survive, and a duplicate pit callback cannot start another sequence.

## Acceptance Criteria

- [ ] A fatal pit fall visibly descends beyond the bottom of the playfield before the finish event is published.
- [ ] The game camera shakes for 250ms after the 700ms fall; the surrounding page UI is unaffected.
- [ ] Timer, distance, biome/background, obstacles, and pickups remain frozen at pit contact; recorded duration, distance, and coins do not include the cinematic.
- [ ] Hiyori's blocked pit consumes the guard but does not start the fatal fall or finish the run.
- [ ] A fatal pit retains `finishReason: 'pit'`, records once, and ends with the existing game-over action even on a new distance record.

## Validation

- `npm run test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts src/game/runner/CollisionSystem.test.ts src/game/runner/RunnerSimulation.test.ts` — fall lockout, delayed finish, duplicate protection, pit resolver, and unchanged contact-time result cases pass.
- `npm run typecheck` — Phaser tween/timer callbacks and pending pit-result state compile.

## Commit Message

```text
feat(runner): add a fatal pit fall cinematic

Plan: 2026-10-27-runner-course-gates-pits-ui-polish
Phase: P02-character-passives
Task: T02-pit-fall-cinematic

- Show the player fall and shake before ending a pit run
- Preserve contact-time results and Hiyori guard behavior
```

## Progress

- [x] Implementation complete
- [x] Validation passed (29 targeted tests and typecheck)
- commit: pending
