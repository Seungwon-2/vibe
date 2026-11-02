# Task: T04 Giant Actions and Effect

## Status: pending

## Goal
Keep the giant pickup visually harmonious and preserve the normal action animation state machine while enlarged.

## Decision Summary
- Giant state changes scale and effect only; it does not replace jump, double-jump, slide, or hurt animation.
- Use a restrained accent-colored glow and sparkles; leave movement, collision, and pickup rules unchanged.

## Implementation

### I01. Animation priority and effect
- Related Files:
  - `src/game/runner/RunnerPlayer.ts` :: `setSliding`, `update`, `applyPose`, `snapToGround` — modify.
  - `src/game/runner/RunnerScene.ts` :: `drawPassiveEffect` — modify.
  - `src/game/characters/characterCatalog.ts` :: character accent lookup — read-only.
  - `src/styles/global.css` :: `.runner-stage.is-giant-active` — read-only unless existing container effect must be softened.

#### Details
- Choose animation in this priority order: hurt; grounded slide; airborne first/double jump with ascent/descent phase; run.
- Remove `giantActive ? 'run'` as a state override in both `setSliding` and `update`. Giant scale must not modify `grounded`, `jumpsUsed`, `airPhase`, or body collision constants.
- Keep the current giant scale and collision decisions unless visual alignment requires a documented art-only adjustment.
- Replace the hard-coded bright gold ring with a low-opacity halo and small sparkle marks using the active character's `accentColor`; avoid covering the sprite or obscuring hazards.
- Clear the effect when giant mode expires, a fatal fall begins, the run ends, or the scene shuts down.

### I02. State-transition tests
- Related Files:
  - `src/game/runner/RunnerPlayer.test.ts` :: giant action transitions — extend.
  - `src/game/runner/RunnerScene.test.ts` :: effect teardown/draw state — extend if graphics are mocked there.
- Verify giant run, giant jump and double-jump ascent/descent, giant slide, giant hurt, and return to ordinary run after the effect expires. Verify slide is still rejected in air and dimensions remain undistorted.

## Acceptance Criteria
- [ ] Giant mode no longer forces run animation during jump, slide, or hurt.
- [ ] Grounded running remains animated and enlarged.
- [ ] The effect uses character accent color and does not obscure gameplay.
- [ ] Expiration restores standard scale and removes the effect.

## Validation
- `npm test -- src/game/runner/RunnerPlayer.test.ts src/game/runner/RunnerScene.test.ts`
- `npm run typecheck`
- Manual run with each action during a giant pickup.

## Commit Message
```text
fix(runner): preserve actions during giant mode

Plan: 2026-11-02-runner-polish-predeploy
Phase: P01-gameplay-polish
Task: T04-giant-actions-and-effect

- Keep jump, slide, and hurt animation priorities while enlarged
- Match the giant aura to the selected runner
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
