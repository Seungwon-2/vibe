# Plan: Runner Motion and Viewport Fit

## Goal

Keep the runner visibly running while giant is active and make the title and character-selection screens fit the available browser viewport without page scrolling or clipped primary controls.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Correct giant animation priority and fit title/selection layouts to viewport | [P01](../phases/2026-10-30-runner-motion-viewport-fit/P01-motion-and-layout/phase.md) |

## Decisions

See [decision record](../decisions/2026-10-30-runner-motion-viewport-fit.md).

## Completion Criteria

- [x] Giant-active player uses run frames during ground, jump, and descent states; pit-fall and terminal states remain unchanged.
- [x] Title and character selection use viewport-constrained layouts intended to avoid document scrolling and clipped primary controls.
- [x] Targeted tests and production build pass; changes are committed on `project02` without including unrelated local changes.
- [x] Screen colors remain unchanged for the planned follow-up visual pass.

Browser viewport screenshot validation could not be completed because the connected browser host was unavailable. Responsive layout rules, targeted tests, and build were validated locally.
