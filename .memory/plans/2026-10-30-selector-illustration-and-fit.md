# Plan: Selector Illustration and Fit

## Goal

Match the supplied selector reference more closely by using crisp still illustrations in the cards, high-quality run frames only in the lower preview rail, and a strict five-card single-row layout.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Replace pixel-art card previews, improve runway animation assets, and prevent roster wrapping | [P01](../phases/2026-10-30-selector-illustration-and-fit/P01-selector-visuals/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-selector-illustration-and-fit.md).

## Completion Criteria

- [x] Cards render five high-resolution static character illustrations with no pixelation or animation.
- [x] Only the lower runway animates, using the supplied quality run frames for all five characters.
- [x] Five cards stay on one row; narrower screens scroll horizontally rather than wrap or clip a second row.
- [x] Passive icon/details, selection state, start action, and stable character IDs remain intact.
- [x] Tests and build pass; commit is created on `project02` without unrelated changes.
