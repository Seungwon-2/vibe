# Task: T01 Life Exhaustion Pose

## Status: done

## Goal
Use the existing one-second game-over pose before showing the result screen whenever Endless mode loses all lives.

## Implementation
- `src/game/runner/RunnerScene.ts` :: `update`, `beginStoryDefeat`
  - Route every `lives-exhausted` result through the existing delayed defeat handler, independent of mode.
  - Keep the existing immediate transition for timeout and other Endless results, and keep Story victory behavior unchanged.
  - Preserve input clearing, trail cleanup, `gameOver` animation start, and exactly-once result emission.

## Acceptance Criteria
- [x] Endless mode's final life loss stops gameplay and starts the game-over animation immediately.
- [x] Result callback is delayed for the existing 1,000ms hold.
- [x] Story life exhaustion remains unchanged; timeout/pit handling remains unchanged.

## Validation
- `npm run typecheck`
- `npm run build`
- `git diff --check`

## Commit Message
```text
fix(runner): show defeat pose after endless lives run out

Plan: 2026-11-03-endless-defeat-pose
Phase: P01-defeat-cinematic
Task: T01-life-exhaustion-pose

- Reuse the one-second defeat animation hold for Endless life exhaustion
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm run typecheck`, `npm run build`, `git diff --check`)
- commit: `86d2b47`
