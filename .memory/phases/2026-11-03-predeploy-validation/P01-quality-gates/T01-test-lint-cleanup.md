# Task: T01 Test and Lint Cleanup

## Status: done

## Goal
Make the current app's tests and lint pass without changing game behavior. The app flow is Title → Mode Select → Character Select; only Endless results are submitted to the endless ranking, and `goth-student` (Shizuki Toa) is currently playable.

## Decision Summary
- Tests should assert the current user flow and catalog state instead of legacy screen order or retired character-lock assumptions.
- Lint fixes should preserve runtime behavior and avoid broad rule suppression.

## Implementation

### I01. Align app and service tests with the current product behavior
- Related Files:
  - `src/App.test.tsx` :: app flow and result submission tests; modify
  - `src/services/PersonalBestStore.test.ts` :: active character validation case; modify
  - `src/game/runner/RunnerGame.test.tsx` :: `createRunnerGameConfig` argument assertions; modify

#### Details
- In `src/App.test.tsx`, update each test that starts a run to follow Title → Mode Select → Character Select. Choose Endless for tests that need to mount the mocked `RunnerGame` or submit an endless result. Use the existing `.mode-option--endless` selector (or the accessible `끝없는 달리기` button) after clicking `.home-start` / the title start button.
- Keep the selected character behavior explicit: select the intended character card, then click `.selector-footer .selector-confirm`. Update text/name expectations only where current UI uses Korean labels or the current `린 · 달리기 시작 ▶` style.
- Tests that check the mode selection screen should assert it after title start; tests that check a run/result should proceed through Endless and character selection.
- In `src/services/PersonalBestStore.test.ts`, replace the assertion that recording `goth-student` throws with an assertion that an active character can be recorded. Preserve the invalid/removed character rejection case.
- In `src/game/runner/RunnerGame.test.tsx`, verify callback options at argument index 6 and tutorial enabled at index 7. `RunnerGame` calls `createRunnerGameConfig(host, characterId, mode, storyStageId, trailCosmeticId, inputBridge, callbacks, tutorialEnabled)`.

### I02. Fix the existing ESLint findings with behavior-preserving changes
- Related Files:
  - `src/app/components/CharacterPreview.tsx` :: frame selection and preload/animation effect; modify
  - `src/game/runner/CollectibleSpawner.test.ts` :: proxy declaration; modify
  - `src/game/runner/CollectibleSpawner.ts` :: `getPickupBodySize`; modify
  - `src/game/runner/RunnerScene.ts` :: `handlePitFall`; modify
  - `src/game/visuals/runnerCourseObjects.test.ts` :: Phaser graphics mocks; modify

#### Details
- In `CharacterPreview`, remove the synchronous `setFrameIndex(0)` from the effect. Derive the visible frame as index 0 when the stored playhead belongs to a different animation key, then advance it from the interval. Include `frames` in the effect dependencies (not only `frames.length`) so the currently selected frame set is tracked. Preserve loop, playback rate, preload, and frame progression behavior.
- In `CollectibleSpawner.test.ts`, change `proxy` from `let` to `const` if it is never reassigned.
- `getPickupBodySize` currently returns the same diameter for all characters and does not use its `CharacterId` parameter. Remove that unused parameter and update all source/test callers found by `rg -n "getPickupBodySize" src`.
- `RunnerScene.handlePitFall` does not use the `PitDefinition`; remove the unused parameter from the implementation and update the `PitSpawner` callback wiring if its type requires a zero-argument callback. Keep behavior and pit result semantics unchanged.
- In `runnerCourseObjects.test.ts`, replace unused rest parameters in graphics mock callbacks with zero-argument callbacks returning the same `graphics` mock; the production API call behavior is unaffected.
- Do not disable lint rules globally or add file-level suppressions.

### I03. Run and record the complete local validation gate
- Related Files:
  - `package.json` :: validation scripts; read-only
  - `.memory/phases/2026-11-03-predeploy-validation/P01-quality-gates/T01-test-lint-cleanup.md` :: validation outcome and status; modify

#### Details
- Run, in order: `npm test`, `npm run lint`, `npm run typecheck`, `npm run assets:validate`, `npm run build`.
- Fix any failures within the listed test/lint cleanup scope, then rerun every command until all pass.
- Record the final command outcomes below. Do not start Entra/Azure configuration in this task.

## Acceptance Criteria
- [ ] `npm test` passes all test files and cases.
- [ ] `npm run lint` exits successfully without errors or warnings.
- [ ] `npm run typecheck`, `npm run assets:validate`, and `npm run build` pass.
- [ ] Existing game behavior and unrelated untracked user assets remain unchanged.
- [ ] Changes are committed on `project02`; pre-existing untracked files are not staged.

## Validation
- `npm test` — passed: 40 test files, 190 tests.
- `npm run lint` — passed with no warnings or errors.
- `npm run typecheck` — passed.
- `npm run assets:validate` — passed for all five characters, 60 frames each, 1152×480 atlases.
- `npm run build` — passed; Vite reports the existing 1,577 kB JS chunk size warning.
- Local dev server — responding with HTTP 200 at `http://127.0.0.1:5174/`; integrated browser UI is unavailable in this session, so manual visual/gameplay review remains for the user.

## Commit Message
```text
fix(quality): restore passing test and lint checks

Plan: 2026-11-03-predeploy-validation
Phase: P01-quality-gates
Task: T01-test-lint-cleanup

- Align tests with current mode and character availability
- Fix existing lint findings without changing gameplay
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
