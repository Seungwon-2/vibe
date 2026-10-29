# Task: T05 Gameplay Sound Effects

## Status: done

## Goal

Play the selected local sound effect once for each relevant runner action, pickup, defense, collision, fall, and primary UI button while preserving existing gameplay behavior.

## Decision Summary

- Use the T03 audio controller and T02 catalog; do not play sound when muted or before browser audio unlock.
- Effects must not change input, collision, timing, scoring, or game results.

## Implementation

### I01. Emit stable events for actions and damage

- Related Files:
  - `src/game/runner/runnerEvents.ts` :: `RunnerEvent`, `RunnerEventEmitter` — define and forward effect-relevant action/hit/fall events; modify
  - `src/game/runner/RunnerPlayer.ts` :: `jump`, `setSliding`, `jumpCount` — expose successful jump type and slide entry without changing physics; modify
  - `src/game/runner/RunnerScene.ts` :: `update`, `handleHazardOverlap`, `handlePitFall` — emit action and impact events at the point of successful transition; modify
  - `src/game/runner/RunnerEvents.test.ts` :: event forwarding/deduplication tests; modify
  - `src/game/runner/RunnerPlayer.test.ts` :: action-result and slide-entry tests; modify
  - `src/game/runner/RunnerScene.test.ts` :: jump/slide/hit/fall event tests; modify
- Details:
  - Extend `RunnerEvent` with `{ type: 'player-action'; action: 'jump' | 'double-jump' | 'slide' }`, `{ type: 'hazard-hit' }`, and `{ type: 'pit-fall-started' }`.
  - Add `RunnerPlayer.jumpCount: number` getter returning the number of successful jumps used in the current airtime. Keep `jump(): boolean` so existing callers retain the same success/failure contract.
  - In `RunnerScene.update`, emit `jump`/`double-jump` only when `jump()` succeeds; determine the action from the post-jump `jumpCount`. Emit `slide` only on the transition from not sliding to sliding, not once per frame or while the slide button remains held.
  - Emit `hazard-hit` for a collision that is not absorbed by Hiyori's passive. A passive-blocked collision emits the existing `passive-triggered` event only, avoiding a simultaneous hit sound.
  - Emit `pit-fall-started` exactly when the fatal fall cinematic begins. A Hiyori-rescued pit emits only `passive-triggered`; a pit collision that is ignored emits nothing.
  - Do not alter event ordering for existing `pickup`, `gate`, `passive-triggered`, `run-finished`, or `fatal-error` callbacks except to insert the new event at its physical action point.
  - Add emitter tests for each new event and player tests proving failed jumps/slides emit no action signal through the scene-facing return/state contract.

### I02. Route events to effects and validate audio behavior

- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `handleEvent` — map runner event ids to catalog effect ids; modify
  - `src/app/screens/RunScreen.test.tsx` :: event-to-effect mapping and paused/muted behavior; modify
  - `src/App.test.tsx` :: global button cue exclusion and no duplicate gesture cues; modify
- Details:
  - Map `player-action/jump`→`jump`, `double-jump`→`double-jump`, `slide`→`slide`; `pickup/coin`→`coin`; `pickup/time`→`time-pickup`; `gate`→`gate`; `hazard-hit`→`hit`; `pit-fall-started`→`fall`; and `passive-triggered/hiyori-guard`→`hiyori-defense`.
  - A coin event occurs at most once per unique pickup id because `RunnerEventEmitter` already deduplicates pickups. Preserve that guard; the controller handles pitch variation for consecutive distinct coins.
  - No effect should be played for countdown snapshots, ordinary snapshots, zero-award time pickups, ignored pit overlaps, or passive-blocked hits except the dedicated defense sound.
  - Keep muted effects silent. Effects triggered before unlock are discarded rather than queued into a delayed burst after unlock.
  - Unit/integration tests spy on `browserRunnerAudio.playEffect` and assert each mapping, no duplicate per frame, no sound on failed action, and expected mute behavior.

## Acceptance Criteria

- [x] All ten confirmed effect categories have an event-to-effect mapping.
- [x] Jump/double-jump/slide cues occur only after successful actions and once per action transition.
- [x] Coin pitch variation, ascending time cue, gate fanfare, gentle hit/fall, and unique Hiyori defense cue work through the controller.
- [x] Sound playback does not alter game state or break silent/muted play.

## Validation

- `npm run test -- src/game/runner/RunnerEvents.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts src/app/screens/RunScreen.test.tsx src/App.test.tsx` — event and UI integration tests pass.
- `npm run test` — full suite passes.
- `npm run typecheck` — all audio event types compile.
- `npm run build` — production build includes local audio URLs.
- Manual listening for subjective tone/volume remains useful. Background music checks are deferred until a reference file is provided; browser audio preview was unavailable in this session.

## Commit Message

```text
feat(audio): connect runner actions to sound effects

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T05-gameplay-sound-effects

- Emit action, impact, and fall cues without changing gameplay rules
- Play pickup, gate, defense, collision, and UI effects through the audio controller
```

## Progress

- Implementation complete: successful player actions, pickups, gates, impacts, falls, Hiyori defense, and primary UI cues route through the audio controller.
- Validation passed: focused tests (35/35), full suite (142/142), typecheck, production build, and deterministic effect asset check.
- Manual listening for subjective tone/volume remains useful; browser audio preview was unavailable in this session. Music checks remain deferred until a reference file is supplied.
- commit: task blueprint and implementation are committed together using the planned message.
