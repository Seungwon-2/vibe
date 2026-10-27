# Plan: Runner Object and Tutorial Polish

## Goal

Keep fatal-pit art visible through the fall result transition, prevent course hazards, pickups, and gates from visually or physically conflicting, teach jump and slide once during the first browser run, and replace block-like course props with distinct pastel silhouettes for all four biomes.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Fix pit-art lifecycle, validate safe course placement, add first-run tutorial cues, and theme the course objects. | [P01](../phases/2026-10-27-runner-object-tutorial-polish/P01-runner-presentation/phase.md) |

## Scope and constraints

- Preserve course simulation, character passives, player collision rules, pickup values, gate rewards, and the four existing biome ranges.
- Keep pit art for the entire 700ms fall and 250ms camera shake, through the result transition; remove its collision zone independently.
- Keep pickups outside ground and overhead hazard picture/collision bounds; leave a 200m clear zone before and after each gate for both hazards and pickups.
- Keep the first jump hazard at 360m and move the first slide hazard to about 600m, outside the 850m pit exclusion radius. Do not shift later authored pattern starts just to move this one tutorial hazard.
- Show jump and slide help at their first respective hazards only during the first run in that browser. Persist the seen state locally; hide repeated RunScreen/MainMenu controls and per-hazard action labels in later runs.
- Use the existing Phaser Graphics and pastel biome palettes. Theme low hazards, overhead hazards, coins, time pickups, gates, and pit art without changing their Arcade physics bounds.
- Azure ID, remote ranking, sprite art, biome backgrounds, and gameplay tuning beyond the first tutorial slide location are out of scope.

## Progress

- P01: `done` (5/5 tasks)
