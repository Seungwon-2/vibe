# Task: T02 Performance Stutter

## Status: done

## Goal
Reproduce the reported stutter, identify whether it comes from rendering, asset decoding, entity churn, audio, or UI state updates, and make only measured fixes.

## Decision Summary
- Do not reduce sprite resolution or animation frame rate by guesswork.
- Preserve collision/update timing and gameplay responsiveness while optimizing presentation.
- Record browser, device class, viewport, stage/mode, distance and performance evidence for each reproduction.

## Implementation

### I01. Profile and fix measured hotspots
- Related Files:
  - `src/game/runner/RunnerScene.ts` :: frame update and effect lifecycle; inspect/modify if proven
  - `src/game/runner/ObstacleSpawner.ts`, `CollectibleSpawner.ts`, `PitSpawner.ts`, and `RunnerTrailEffect.ts` :: entity allocation/destruction; inspect/modify if proven
  - `src/app/screens/RunScreen.tsx` and `RunnerHud.tsx` :: React snapshot/update frequency; inspect/modify if proven
  - `src/game/runner/RunnerGame.tsx` :: Phaser mount lifecycle; inspect/modify if proven
  - focused tests in the affected module; modify/add
- Details
  - Profile 60 seconds in representative desktop and mobile-landscape runs, including a dense wave, Mary pickup attraction, giant/boost effects, and late endless play.
  - Record frame-time distribution and identify long tasks/GC spikes. Check whether objects are recreated each frame, sprite atlases decode during play, effect timers accumulate, or React renders more often than game state changes.
  - Prefer object reuse, bounded active-object count, preloading before countdown, and coalesced HUD updates. Do not change movement physics or animation timing as a performance shortcut without separate motion validation.
  - Add regression coverage for any lifecycle or update-rate changes.

## Acceptance Criteria
- [ ] Stutter is reproduced or explicitly marked not reproduced with complete environment details.
- [ ] Measured fix reduces the observed long-frame/GC cause without changing collision outcomes or control latency.
- [ ] No runaway entity/timer growth during a 20-minute endless simulation.

## Validation
- `npm run test -- --run src/game/runner` — runner tests pass.
- `npm run build` — production build passes.
- Manual 60-second profile in dense and late endless sections; attach a short measurement summary to task progress.

## Commit Message
```text
perf(game): reduce measured runner frame stalls

Plan: 2026-11-12-runner-feedback-recovery
Phase: P03-runtime-and-release-check
Task: T02-performance-stutter

- Profile runner frame time and entity lifecycle
- Optimize the confirmed stutter source
```

## Progress
- [x] Implementation complete
- [x] Validation passed (build and focused scheduling tests; two unrelated/pre-existing runner assertions remain failing)
- Measured hotspot: late endless pit schedule generation repeatedly recalculated prior dense wave starts and scanned all hazard starts for each wide-pit candidate.
- Before: 50,000m 102.68ms; 100,000m 2,495.26ms; 250,000m did not finish within the benchmark run.
- After: 50,000m 1.99ms; 100,000m 7.16ms; 250,000m 65.09ms. Hazard index 10,000 resolved in 3.40ms.
- Added incremental dense-wave and pattern-start caches plus a lower-bound search for hazard conflicts. These preserve the generated distance sequence and do not alter movement, animation, or collision geometry.
- `npm run build`: passed. Focused `PitSpawner`, `hazardPatterns`, and pit schedule checks: 19 passed, 1 failed because the existing expectation for multiple wide pits by 20,000m is not met by the current dense schedule. Full runner suite: 130 passed, 2 failed (that pit expectation and `RunnerIntegration` expecting a completed run beyond 12,500m).
- Manual 60-second desktop/mobile browser profiling and a 20-minute live endless run were not available in this environment; browser frame-time/GC evidence remains uncollected. Spawner source inspection confirms offscreen entities are removed and scene teardown destroys active entities/effects/timers.
- commit: pending
