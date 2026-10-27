# Task: T02 Personal-Best Results

## Status: done

## Goal

At the one-time end of a local run, record the selected character's best distance, play that character's six-frame VICTORY sequence for a strictly new personal best or six-frame CRY sequence otherwise, and present the result while keeping the character visible.

## Decision Summary

- The runner has a time-out finish, not a stage-clear endpoint. The first valid recorded run counts as a personal best, including 0m; only a greater integer distance counts as a later new best. Equal distance is not victory.
- Store one best result per active character in local browser storage. This is distinct from the older plan's future unified top-ten leaderboard; do not implement or preempt that entire ranking UI here.

## Implementation

### I01. Define and test a synchronous personal-best store

- Related Files:
  - `src/services/PersonalBestStore.ts` :: `PersonalBest`, `PersonalBestSnapshot`, `PersonalBestStore`, `browserPersonalBestStore`; new.
  - `src/services/PersonalBestStore.test.ts` :: first run, strict improvement, reload, corrupt/blocked storage, removed ID tests; new.
  - `src/game/characters/characterCatalog.ts` :: `resolveCharacterId`/`getCharacter`; read-only.
  - `src/game/runner/runnerTypes.ts` :: `RunnerResult`; read-only for persistence payload; add `RunnerFinishOutcome` type only in I02.

#### Details

- **Signatures & Types**:
  ```typescript
  type PersonalBest = Readonly<{distanceMeters:number; coins:number; finishedAtIso:string}>;
  type PersonalBestSnapshot = Readonly<{version:1; bestByCharacter:Partial<Record<CharacterId,PersonalBest>>}>;
  type PersonalBestDecision = Readonly<{isNewBest:boolean; bestDistanceMeters:number; previousDistanceMeters:number|null}>;
  class PersonalBestStore {
    constructor(storage?: Pick<Storage,'getItem'|'setItem'> | null);
    getBest(characterId: CharacterId): PersonalBest | null;
    record(result: RunnerResult): PersonalBestDecision;
  }
  ```
- **Data & Schema Fields**:
  - Browser key `running-action:personal-best:v1` stores exactly `{version:1,bestByCharacter:{[activeCharacterId]:{distanceMeters,coins,finishedAtIso}}}`. Do not use `running-action:records:v1`, which the older P04 task reserves for a unified top-ten list.
  - `distanceMeters` is an integer `>=0` after rounding the already-final `RunnerResult` value; `coins` is an integer `>=0`; `finishedAtIso` must be a parseable ISO timestamp. A missing prior key gives `previousDistanceMeters:null` and `isNewBest:true`. Equal/lesser distance leaves the stored best unchanged. Coins never turn an equal-distance run into a victory.
- **Execution Flow / Logic**:
  1. Lazy-load storage inside `try/catch`; tolerate private mode, unavailable `window`, quota errors, malformed JSON, unknown/retired character IDs, invalid numeric fields, and wrong version by starting with an empty in-memory snapshot. Do not block gameplay.
  2. `record` validates a result and makes the comparison synchronously so the scene can select an animation before announcing finish. For strictly greater distance, update in-memory state then attempt `setItem`; keep the in-memory best if persistence fails. Never create multiple records on rerender.
  3. Export one browser singleton (lazily constructed to avoid `window` access at module import under tests/SSR) and allow an injected storage mock in tests. This store is only the per-character best trigger, not the future complete ranking gateway.
- **Error & Exception Handling**: Invalid current `RunnerResult` should throw a descriptive `TypeError` in the store test path; scene catches only expected browser-storage failures through the store's fallback. Unknown old roster IDs in persisted data are ignored, never rendered as a playable character.

### I02. Carry the result decision through Phaser and React once

- Related Files:
  - `src/game/runner/runnerTypes.ts` :: `RunnerFinishOutcome`; modify.
  - `src/game/runner/RunnerScene.ts` :: `emitFinished`; modify.
  - `src/game/runner/RunnerPlayer.ts` :: `finish`; modify to choose registered `victory` or `gameOver` (CRY-source) once.
  - `src/game/runner/runnerEvents.ts` :: `RunnerCallbacks`, `RunnerEvent`, `RunnerEventEmitter.finish`; modify.
  - `src/game/runner/createRunnerGameConfig.ts` :: `RunnerGameCallbacks`; modify.
  - `src/game/runner/RunnerGame.tsx` :: `RunnerGameProps`, callback bridge; modify.
  - `src/app/screens/RunnerPreview.tsx` :: result state, `onFinished`, result overlay; modify.
  - `src/styles/global.css` :: `.runner-overlay` result variant; modify.
  - `src/game/runner/RunnerPlayer.test.ts`, `RunnerEvents.test.ts`, `RunnerGame.test.tsx`, `src/app/screens/RunnerPreview.test.tsx` :: outcome propagation and repeat-finish regression; modify.

#### Details

- **Signatures & Types**:
  ```typescript
  type RunnerFinishOutcome = 'personal-best' | 'completed';
  type RunnerCallbacks = {
    onSnapshot(snapshot:RunnerSnapshot):void;
    onFinished(result:RunnerResult,outcome:RunnerFinishOutcome):void;
    onEvent?(event:RunnerEvent):void;
  };
  type RunnerEvent = /* existing union */ | Readonly<{type:'run-finished';result:RunnerResult;outcome:RunnerFinishOutcome}>;
  finish(outcome: 'victory'|'gameOver'): void; // RunnerPlayer
  finish(result: RunnerResult, outcome: RunnerFinishOutcome): void; // RunnerEventEmitter
  ```
- **Execution Flow / Logic**:
  1. `RunnerScene.emitFinished` has a one-time guard shared by time-out and fatal collision paths. It calls `browserPersonalBestStore.record(result)` exactly once, converts `isNewBest` to `personal-best|completed`, calls `player.finish('victory'|'gameOver')`, then emits one result/outcome pair. The scene no longer allows a late repeated finish to overwrite the first terminal pose.
  2. `RunnerPlayer.finish` snaps the sprite to `RUNNER_GROUND_Y`, clears flashing alpha and slide state, stops velocity/gravity, disables Arcade body, and plays the selected one-shot six-frame atlas action. The scene animation runs to its final pose after simulation stops; avoid pausing/stopping the Phaser animation manager when showing results.
  3. `RunnerEventEmitter` preserves its current deduplication. Forward the outcome through `createRunnerGameConfig` and `RunnerGame` to `RunnerPreview`, where state is `{result,outcome}` or null. A new best overlay says `새 최고 기록` and shows distance/previous best; ordinary completion says `런 종료`. Keep restart and character-selection navigation. `restart()` resets only current run state, never the stored personal best.
  4. The current `.runner-overlay` paints a 58%-opaque full-stage layer over the character. Add a result-specific layout/background in CSS that leaves the left-side sprite unobscured while preserving readable buttons and keyboard focus at 960×540 and responsive sizes. The countdown/pause overlay behavior stays unchanged.
- **State Transition & Return**: `RunnerSimulation.finishRunner` and `RunnerResult` stay deterministic and storage-free; the browser store and presentation outcome are evaluated only at the scene/UI boundary.
- **Error & Exception Handling**: Storage read/write failures use in-memory fallback and still choose a terminal action. A destroyed scene or restart must not perform a second evaluation for the prior run.

## Acceptance Criteria

- [x] First valid run plays VICTORY; a later strictly farther run plays VICTORY; equal/shorter runs play CRY for the selected character.
- [x] Personal best survives reload when storage works and remains session-usable when storage is denied/corrupt; no duplicate record or finish event occurs.
- [x] Time-out and collision-ending paths both settle the terminal character on the floor, stop running, and keep their six-frame action visible behind a readable, non-obscuring result panel.
- [x] Restart uses the same selected character and stored best; changing characters uses that character's own best. Unified top-ten ranking and Azure remain untouched.

## Validation

- `npm test -- src/services/PersonalBestStore.test.ts src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerEvents.test.ts src/app/screens/RunnerPreview.test.tsx` — storage, strict record comparison, finish deduplication, and result UI.
- `npm test`, `npm run typecheck`, `npm run build`, `npm run lint` — whole-app integration.
- Manual: complete one run, reload, then complete equal/shorter and longer runs for two characters; inspect the final animation on the Phaser canvas and verify the result panel never hides it.

## Commit Message

```text
feat(runner): show victory for personal-best distance

Plan: 2026-10-26-rin-unified-motion
Phase: P02-character-runtime
Task: T02-personal-best-results

- Persist a per-character local best without coupling storage to simulation
- Play victory or crying once and keep terminal art visible
```

## Progress

- [x] Implementation complete
- [x] Validation passed (56 tests, typecheck, build, lint; headless Edge desktop/mobile result inspection)
- commit: pending
