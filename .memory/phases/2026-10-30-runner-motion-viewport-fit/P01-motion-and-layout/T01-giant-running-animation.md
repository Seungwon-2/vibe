# Task: T01 Giant Running Animation

## Status: done

## Goal

When giant is active, display the character's running frames rather than a persistent descending/falling animation, without changing movement or collision physics.

## Decision Summary

- Giant-active animation overrides ordinary run/jump/fall/slide presentation with the run loop.
- Explicit pit-fall, rescue, hurt, and completed states keep their existing precedence.
- Keep giant scale and body geometry unchanged.

## Implementation

### I01. Give giant visual state clear animation priority

- Related Files:
  - `src/game/runner/RunnerPlayer.ts` :: `RunnerPlayer.update`; modify
  - `src/game/runner/RunnerPlayer.test.ts` :: giant animation behavior; modify

#### Details

- Keep the current early return for `finished`, `passiveRescuing`, and `pitFalling` in `update()` so pit-fall and terminal animations remain controlled by their dedicated handlers.
- When selecting the ordinary animation for an active player, choose `hurt` if hurt; otherwise choose `run` whenever `giantActive` is true; otherwise keep the existing slide/jump/double-jump/fall/run state selection.
- Do not change `jump()`, `setSliding()`, vertical velocity, body size/offset, collision behavior, or giant duration.
- Regression case: activate giant, jump, set positive vertical velocity and clear floor contact, update, then assert `data` frame animation key is run while the player remains airborne and velocity is unchanged. Deactivate giant and update the same descending state; assert jump-fall resumes. Verify pit-fall still selects jump-fall and game-over remains terminal.

### I02. Validate animation behavior

- Run `npm run test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerSimulation.test.ts`.
- Run `npm run build`.

## Acceptance Criteria

- [x] Giant visually stays on the run loop through a normal jump descent.
- [x] Ending giant while descending restores the falling animation.
- [x] Pit-fall and terminal animation behavior remain intact; physics/hitboxes do not change.

## Commit Message

```text
fix(runner): keep giant character in running animation

Plan: 2026-10-30-runner-motion-viewport-fit
Phase: P01-motion-and-layout
Task: T01-giant-running-animation

- Show the run loop throughout the giant effect
- Preserve physics and dedicated pit/terminal animations
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerSimulation.test.ts`; `npm run build`)
- commit: `6a416e6` on `project02`
