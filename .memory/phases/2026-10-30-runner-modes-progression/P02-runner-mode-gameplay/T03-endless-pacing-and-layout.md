# Task: T03 Endless Pacing and Layout

## Status: done

## Goal

Increase Endless post-tutorial challenge and create safe coin routes around dense obstacle waves, gates, and giant-item windows.

## Decision Summary

- Keep 0–1000m tutorial intact; ramp challenge after 1000m.
- Dense pattern groups use three patterns at 250–350m spacing, then 500–600m recovery.
- Giant placement/visual treatment is explicitly revisited; duration and pit exclusion remain unchanged.

## Implementation

### I01. Retune endless waves, coin routes, and giant item placement

- Related Files:
  - src/game/runner/runnerConfig.ts :: Endless pacing, wave/recovery, pickup/giant tuning; modify
  - src/game/runner/ObstacleSpawner.ts :: generate obstacle schedule; modify
  - src/game/runner/CollectibleSpawner.ts :: generatePickupSchedule; modify
  - src/game/runner/PitSpawner.ts :: pit safe spacing; read-only unless schedule conflicts
  - src/game/runner/RunnerPlayer.ts :: giant run animation/scale state; modify if current giant treatment causes non-run pose
  - src/game/runner/RunnerScene.ts :: giant trail/size VFX only; modify
  - corresponding ObstacleSpawner.test.ts, CollectibleSpawner.test.ts, RunnerPlayer.test.ts; modify

#### Details

- Preserve tutorial marker and existing first-pit tutorial; move only placements when schedules overlap.
- For Endless after 1000m, progressively shorten hazard pattern spacing within jump/slide reaction limits; use 250–350m between three-pattern waves and 500–600m recovery.
- Maintain safe-route coins about every 100–150m; optional post-jump coin rows must begin after the hazard's collision/render bounds plus player landing clearance.
- Reserve ±200m around every gate from hazards/pickups and prevent any object bounds from overlapping each other.
- Place a single giant pickup immediately before eligible dense waves, only when six-second protection duration can cover the intended three patterns at current scroll speeds. Avoid duplicate giant pickups within the same dense wave.
- Preserve giant protection against ordinary hazards and exclusion from pits. Keep player animation on run frames while enlarged; effects are visual only and must not modify collision body or animation FPS.
- Expose initial tuning constants in runnerConfig rather than embedding values in spawner branches.

## Acceptance Criteria

- [x] Endless remains readable and traversable after tutorial, with explicit recovery windows.
- [x] Gates, pits, pickups, and hazard rendered/collision bounds do not overlap.
- [x] Dense-wave giant pickup is limited to planned breakthrough sections and retains run animation.

## Validation

- `npm run typecheck` — passed
- `npm run build` — passed (large bundle warning only)
- The Vitest command above was not run; no tests were added or run.

## Commit Message

    feat(runner): tune endless waves and reward routes

    Plan: 2026-10-30-runner-modes-progression
    Phase: P02-runner-mode-gameplay
    Task: T03-endless-pacing-and-layout

    - Increase post-tutorial Endless challenge with recovery windows
    - Protect coin, gate, pit, and giant item spacing

## Progress

- [x] Implementation complete
- [x] Validation passed: `npm run typecheck`, `npm run build`
- commit: see task commit
