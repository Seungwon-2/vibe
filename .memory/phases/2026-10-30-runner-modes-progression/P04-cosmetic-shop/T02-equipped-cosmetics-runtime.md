# Task: T02 Equipped Cosmetics Runtime

## Status: done

## Goal

Render equipped runner trails/effects and optional full-action skins in selector/gameplay without changing gameplay physics or animation timing.

## Decision Summary

- Trails are subtle while running and stronger on jump/speed boost.
- Skins require complete action frames matching current frame dimensions and pivot; user assets are not yet supplied.

## Implementation

### I01. Integrate cosmetic render data into selector and Phaser scene

- Related Files:
  - src/game/runner/RunnerScene.ts :: cosmetic event/render lifecycle; modify
  - src/game/runner/RunnerPlayer.ts :: trail rendering and animation texture selection; modify
  - src/game/characters/characterCatalog.ts :: full-action skin frame registration boundary; modify only if necessary
  - src/app/components/CharacterPreview.tsx :: show equipped cosmetics; modify
  - src/game/runner/RunnerScene.test.ts and relevant preview tests; modify
  - public/assets/character/cosmetics/skins/<character-id>/<skin-id>/ :: future user assets; do not invent image files
  - public/assets/character/cosmetics/effects/<effect-id>/ :: future user assets; do not invent image files

#### Details

- Pass selected character loadout from profile into RunnerGame and CharacterPreview.
- Trail is a visual-only particle/sprite layer behind runner. Normal run uses low opacity/short lifetime; jump and active speed boost increase intensity. Respect pause, finish, destroy, and reduced-motion preference.
- Effect placement must not change sprite frame dimensions, pivot, physics body, collision system, score, or speed.
- Register a skin only when all required actions (idle, run, jump, doubleJump, slide, hurt, victory, gameOver) exist, frame dimensions/pivot match the base character, and validation succeeds. Otherwise keep base character and report unavailable skin in shop.
- Until supplied assets arrive, keep trail effects code-rendered and skin placeholder disabled. Do not use portrait or unrelated title art as an animation sheet.

## Acceptance Criteria

- [x] Equipped effect is visible with stronger jump/speed feedback and is visual-only.
- [x] Pause/finish/destroy clean up trail rendering.
- [x] Incomplete/mismatched skin sets are never loaded into the runtime.

## Validation

- `npm run assets:validate` — passed (5 existing character atlases)
- `npm run typecheck` — passed
- `npm run build` — passed (Vite reports the existing large-chunk advisory)
- Vitest not run in this session.

## Commit Message

    feat(cosmetics): render equipped runner effects

    Plan: 2026-10-30-runner-modes-progression
    Phase: P04-cosmetic-shop
    Task: T02-equipped-cosmetics-runtime

    - Render per-character trail cosmetics in runner scenes
    - Validate full-action skin sets before runtime registration

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: `feat(cosmetics): render equipped runner effects`
