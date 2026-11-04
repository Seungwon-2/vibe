# Plan: Pre-deployment UI/UX Polish

## Goal
Polish the existing Stella Runner screens before deployment while preserving the established pastel and starry art direction, approved screen flow, title illustration, gameplay rules, and each screen's current content. Fix visible alignment, spacing, clipping, overlap, and responsive sizing issues across desktop and mobile layouts.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Polish the full player-facing screen flow without changing game behavior | [P01](../phases/2026-11-04-predeploy-ui-ux-polish/P01-screen-polish/phase.md) |

## Scope and constraints
- Screens: title, mode selection, character selection, stage selection, gameplay and pause, endless/story results, rankings, achievements, and shop.
- Preserve each screen's current layout and functions; refine only the reported presentation issues.
- Preserve the title illustration's visible area and existing footer height. Keep the start button vertically extended across two button rows and Sound Settings at the lower row's far right.
- Keep existing character art, ability icon and copy, title artwork, and themed stage backdrop assets.
- Keep layouts adaptive at existing desktop and mobile breakpoints. Avoid unintended page scrolling and clipped content; retain the landscape 16:9 gameplay viewport.
- Do not change gameplay rules, progression, screen flow, Azure configuration, or deployment behavior.

## Execution order
1. T01 establishes the title/menu layout and mode-card sizing.
2. T02 checks character and stage selection card fit, asset visibility, and selection controls.
3. T03 aligns gameplay HUD, touch controls, pause, and exit overlays.
4. T04 polishes results, rankings, achievements, and shop information hierarchy.

## Cross-screen visual review
- Check desktop browser viewport at 1440×900 and landscape mobile viewport at 915×412.
- Also check a narrow 390×844 viewport for selection, progression, records, and shop screens.
- Verify titles, controls, character art, status text, and primary actions are visible and operable without unintended page-level scrolling.
- For gameplay, retain the 16:9 stage and ensure the HUD and touch controls do not overlap it.
