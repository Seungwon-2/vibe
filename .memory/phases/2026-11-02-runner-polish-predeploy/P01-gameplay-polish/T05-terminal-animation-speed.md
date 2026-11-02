# Task: T05 Terminal Animation Speed

## Status: pending

## Goal
Remove accelerated playback from the victory and game-over sprites at the end of a run while preserving one-shot playback and the final pose.

## Decision Summary
- Use the registered native per-character FPS for terminal actions.
- Keep story's 800ms pre-result victory hold and the existing result-preview one-shot/loop semantics unchanged.

## Implementation

### I01. Native FPS for Phaser terminal actions
- Related Files:
  - `src/game/runner/RunnerScene.ts` :: animation registration in `create` — modify.
  - `src/game/characters/characterCatalog.ts` :: `QUALITY_SOURCES.fps` — read-only; source of authored FPS.
  - `src/app/components/CharacterPreview.tsx` :: `qualityAnimationFps` timer — read-only unless any explicit multiplier is discovered.
  - `src/app/screens/RunResult.tsx` and `StoryResult.tsx` :: result animation selection — read-only unless any speed multiplier is discovered.

#### Details
- For `victory` and `gameOver`, set Phaser animation `frameRate` to `character.qualityAnimationFps[name]`; do not apply a multiplier.
- Keep existing FPS for run, jump, slide, hurt, and fall unless a separate explicit ending-only speed multiplier is found.
- Preserve `repeat: 0` for terminal animations and leave the last frame visible while the result UI is open.
- If the result preview has no multiplier (current implementation uses the catalog FPS), do not change its timing or component lifecycle.

### I02. Playback tests
- Related Files:
  - `src/game/runner/RunnerScene.test.ts` :: animation configuration — extend.
  - `src/app/screens/RunResult.test.tsx` :: terminal preview frame sequence — read-only or extend only if needed.
- Verify five-character terminal actions use catalog FPS and remain non-looping.

## Acceptance Criteria
- [ ] Victory and game-over use catalog FPS without a speed multiplier.
- [ ] Terminal sprites play once and hold their final frame.
- [ ] Story result delay and result action selection remain unchanged.

## Validation
- `npm test -- src/game/runner/RunnerScene.test.ts src/app/screens/RunResult.test.tsx`
- `npm run typecheck`

## Commit Message
```text
fix(animation): honor terminal sprite frame rates

Plan: 2026-11-02-runner-polish-predeploy
Phase: P01-gameplay-polish
Task: T05-terminal-animation-speed

- Use authored FPS for victory and game-over actions
- Keep terminal playback one-shot with a held final pose
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
