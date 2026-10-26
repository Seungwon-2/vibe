# Phase: P01 Motion Assets

## Goal

Convert the five committed motion-study PNGs into consistent transparent runtime assets before the game registry refers to them.

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `pending` | Extract and validate five 60-frame atlases plus three selector portraits. | [T01](./T01-five-motion-atlases.md) |

## Progress

- done: 0/1 (active: T01)

## Gate to P02

- Runtime atlas PNG/JSON pairs exist for all five IDs, each with exactly 60 96×96 transparent frames in a 1152×480 atlas.
- Contact-sheet and alpha checks show no labels, grid, neighboring sprites, or clipped hair/shoes; the 12 run frames remain a contiguous first row.
