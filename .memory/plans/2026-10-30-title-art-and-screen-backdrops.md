# Plan: Title Art and Screen Backdrops

## Goal

Improve title artwork visibility and reuse the art as a subtle backdrop behind character selection and the gameplay screen without reducing interface readability.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Reposition title content and apply translucent title-art backdrops | [P01](../phases/2026-10-30-title-art-and-screen-backdrops/P01-title-and-backdrops/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-title-art-and-screen-backdrops.md).

## Completion Criteria

- [x] Title remains legible in the upper sky area, with character art clearly visible and the existing menu dock unchanged.
- [x] Character selection and gameplay outer screen show a low-opacity version of the title art behind their UI.
- [x] Selector cards, HUD, and gameplay canvas remain readable; no gameplay scene art is overlaid.
- [x] Relevant tests and production build pass; commit is created on `project02` without unrelated changes.
