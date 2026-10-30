# Plan: Character Selector Runner Layout

## Goal

Reshape character selection to match the supplied five-card runner reference, retain icon-led passive descriptions, show a running animation preview for the roster, and use Korean visible character names without changing stable character IDs.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Rebuild the character selector layout, passives, and runner previews | [P01](../phases/2026-10-30-character-selector-runner-layout/P01-character-selector/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-character-selector-runner-layout.md).

## Completion Criteria

- [x] Five cards appear in the agreed order; each shows its SD art, Korean name, passive icon, name, and effect.
- [x] Selecting a card updates the accent border and start button; internal character IDs remain unchanged.
- [x] A lower preview lane loops each character's run animation.
- [x] Desktop and mobile layouts avoid clipping, keep cards usable, and expose the back/start actions.
- [x] Selector and relevant character registry tests plus production build pass; changes are committed on `project02` without unrelated files.
