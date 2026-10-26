# Task: T03 Integration Validation

## Status: pending

## Goal

Verify the complete offline runner, landscape play at desktop and mobile sizes, and document the Project 02 local workflow.

## Decision Summary

- This task verifies the already implemented plan; it adds no cloud service, account, or platformer feature.
- Local launch remains Vite `npm run dev`; branch is `project02`.

## Implementation

### I01. Add integration coverage and local instructions

- Related Files:
  - `src/App.test.tsx` :: full flow tests with fake timer and mock runner events; modify.
  - `src/game/runner/RunnerIntegration.test.ts` :: state-to-event/result integration; new.
  - `README.md` :: local setup, controls, runner rules, ranking storage and reset instructions; replace starter copy.
  - `.memory/current.md` :: final active-task pointer update is handled automatically after this task by memory-execute; read-only here.

#### Details

- Integration scenario: menu → select each character → countdown → run → jump and double jump → hold/release slide → collide once and lose character-adjusted time → collect coin/time item → cross each time gate and biome boundary → timer expires → persist result → retry same character → return to selector → load ranking after reload.
- Mock `Date` and game event boundary where needed so timer, gates, and finished timestamp are deterministic. Do not rely on wall-clock sleeps.
- README lists Node engine `>=22.12.0 <25`, `npm ci`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, keyboard/touch controls, timer/pickup/gate rules, and localStorage key `running-action:records:v1`.
- Manually inspect landscape at 1366x768, 844x390, and 667x375. In portrait, confirm the rotate prompt pauses without losing the run. Check 320px-wide selector cards do not clip horizontally (scrollable rail is expected).
- Start a local run and verify no network/auth dependency; ensure Azure config is not required.

### I02. Final quality gate

- Related Files:
  - `package.json` scripts `test`, `typecheck`, `lint`, `build`; read-only.
  - All P01-P04 implementation targets; integration review only.

#### Details

- Run the full commands sequentially: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Resolve failures in the owning task before marking this task done. Verify no obsolete `WorldMap`, stage saves, boss systems, or platformer gameplay imports are reachable from `App.tsx`.
- Confirm `git status` is clean after commits; all commits are on `project02`. Do not push or deploy unless requested separately.

## Acceptance Criteria

- [ ] Complete offline run works from menu through ranking without Entra or network.
- [ ] 90-second timer, 120-second cap, 3-second pickups, three +20-second gates, four biome boundaries, all passive abilities, and collision protection work in one run.
- [ ] Keyboard and touch controls work in landscape; portrait prompt pauses safely.
- [ ] `README.md` accurately describes local setup and current mechanics.
- [ ] Full test/type/lint/build commands pass and obsolete platformer routes are unreachable.

## Validation

- `npm test` — all Vitest tests pass.
- `npm run typecheck` — no TypeScript errors.
- `npm run lint` — no ESLint errors.
- `npm run build` — production Vite build succeeds.
- Manual: `npm run dev`, complete one local run and inspect desktop/mobile landscape sizes.

## Commit Message

```text
docs(runner): document and verify local runner workflow

Plan: 2026-10-26-running-action-redesign
Phase: P04-local-ranking
Task: T03-integration-validation

- Document offline setup, controls, scoring, and local records
- Verify the complete runner flow on desktop and mobile landscape
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
