# Plan: Selector Viewport and Game Sprites

## Goal

Stop the character selector from creating document-level scroll or wrapping into rows on landscape screens, and replace the live in-game/result animation art with the supplied transparent high-resolution motion frames without changing logical character size or collision behavior.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Make selector viewport-fit and migrate live runner visuals to supplied quality frames | [P01](../phases/2026-10-30-selector-viewport-and-game-sprites/P01-viewport-and-motion/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-selector-viewport-and-game-sprites.md).

## Completion Criteria

- [ ] Landscape selector fits the viewport height without document-level vertical scrolling; five cards occupy a single row.
- [ ] The live runner and result preview use the supplied quality motion frames for all five characters.
- [ ] World size, feet baseline, jump behavior, slide pose, and collision boxes stay equivalent to the existing 96px logical design.
- [ ] Focused tests and production build pass; changes are committed on `project02` without unrelated files.
