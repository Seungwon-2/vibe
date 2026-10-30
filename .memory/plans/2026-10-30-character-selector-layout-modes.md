# Plan: Character Selector Layout Modes

## Goal

Stabilize the selector across desktop, compact landscape, and portrait screens. Keep all roster sprites fully visible at a consistent size; use intentional vertical scrolling on portrait screens when the available height is insufficient.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Replace conflicting selector sizing rules with three clear layout modes | [P01](../phases/2026-10-30-character-selector-layout-modes/P01-selector-layout/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-character-selector-layout-modes.md).

## Completion Criteria

- [x] Wide desktop uses a left showcase and a three-column roster with the fifth card centered.
- [x] Tablet/compact landscape uses a compact side-by-side composition with bounded character art.
- [x] Portrait uses a compact showcase and two-column roster, scrolling only when necessary rather than clipping content.
- [x] Targeted selector tests and production build pass; commit is created on `project02` without unrelated changes.
- [x] Existing title and selector colors, selection behavior, and character ordering remain unchanged.

Browser visual review remains unverified because the browser host is unavailable.
