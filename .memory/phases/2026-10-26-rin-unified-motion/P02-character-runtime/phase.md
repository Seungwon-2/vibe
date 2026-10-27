# Phase: P02 Character Runtime

## Goal

Use the prepared atlases in the selector and runner, with art-independent movement, readable slide poses, and personal-best result motions.

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done` ✅ | Replace the active roster and wire the five atlases into selector and runner motions. | [T01](./T01-five-character-gameplay.md) |
| T02 | `done` ✅ | Persist personal bests and show victory or crying at run end. | [T02](./T02-personal-best-results.md) |

## Progress

- done: 2/2 (active: none)

## Gate to completion

- Rin, Hiyori, and Mary can be selected and run locally with their supplied sprite sets. Toa and Rang remain visible as `준비 중` until matching sets arrive, per the later roster decision.
- Jump/double jump, collision, slide, and terminal animations show complete frames with stable pivots; game physics still determine jump height and hit detection.
- A new personal best produces victory and any later equal/shorter run produces crying, including after reload and with blocked browser storage.
