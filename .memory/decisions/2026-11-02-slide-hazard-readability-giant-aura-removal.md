# Decision: Slide Hazard Readability and Giant Effect Cleanup

## Context
Overhead hazards currently look like small floating objects, while their collision volume spans the full lane so jumping cannot pass them. During a valid slide overlap, the hazard is removed immediately, which makes its disappearance abrupt. The giant pickup also draws a circular outline that is smaller than the enlarged runner.

## Confirmed Decisions
- Keep the rule that overhead hazards can only be avoided by a grounded slide.
- Replace the floating overhead silhouettes with theme-specific tall blockers that visibly occupy the jump path and connect to the course. Leave only a low crawl-through gap that matches the existing sliding pose clearance.
- Keep collision geometry independent from decorative artwork; preserve the current full-lane collision and 6px slide clearance.
- On a successful slide, disable that hazard's collider and fade its art briefly as the runner passes, instead of destroying it immediately.
- Remove only the giant-mode circular aura and spark marks. Keep the enlarged character, giant duration, movement, and action-specific animations unchanged.
- Keep code-based Phaser vector artwork and current theme palettes; no external images or new sprite sheets are required.

## Constraints
- Ground hazards, course spacing, damage, and hitboxes remain unchanged.
- Preserve Hiyori and Toa passive effect visuals.
- The user's existing uncommitted `RunnerScene.ts` / related changes must not be lost or included accidentally in the feature commit.
- Validate artwork bounds, collision behavior, safe slide cleanup, giant-mode visuals, typecheck, and build.
