# Plan: Runner Course, Gates, Pits, and UI Polish

## Goal

Update the local running-action game so its course has five speed gates across four biomes, frequent safe-route coins, fair dense obstacle sections, and jumpable fatal pits. Give Rin, Hiyori, and Mary distinctive centrally tuned passive abilities, make those abilities clear in play, and polish the selector, runner HUD, result, and local-ranking screens in the existing pastel style.

Success means deterministic simulation and spawner tests cover gate/speed/timer behavior, all ordinary obstacle groups remain passable, safe pickups never overlap hazards or pits, pit and Hiyori shield outcomes are correct, and the four named screens remain responsive and accessible.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Update runner course scheduling, gates, pickups, obstacle waves, and pit behavior. | [P01](../phases/2026-10-27-runner-course-gates-pits-ui-polish/P01-runner-course/phase.md) |
| P02 | `pending` | Implement the new passive definitions and their gameplay effects. | [P02](../phases/2026-10-27-runner-course-gates-pits-ui-polish/P02-character-passives/phase.md) |
| P03 | `pending` | Show abilities clearly and refine the four agreed screens. | [P03](../phases/2026-10-27-runner-course-gates-pits-ui-polish/P03-screen-polish/phase.md) |

## Scope and constraints

- Keep the 90-second initial timer, 120-second cap, +20-second gate reward, 3-second countdown, keyboard/touch controls, four existing themes, local ranking, and character roster.
- Gates are at 2,000m, 4,000m, 6,000m, 8,000m, and 10,000m. Their shared maximum-speed bonus adds 5 percentage points per gate to the base maximum-speed target.
- Set tutorial/practice bounds to 0–1,000m and 1,000–2,000m. After 2,000m, use dense sections with three single-action pattern slots at a 300m baseline spacing, followed by a 550m baseline recovery interval. Both values are midpoints of the user-approved ranges and remain configuration tunings.
- Keep the themes dawn city 0–2,000m, moonlit forest 2,000–4,000m, crystal mine 4,000–6,000m, and cloud skyway from 6,000m onward.
- Place safe-route pickups at about 125m intervals, retain the existing optional jump-reward stream and time-pickup value/frequency, and prevent collisions with hazards, pits, and gates.
- First pit: 850m; later candidate pits: 1,750m apart. Use a 30m gap, at least 250m tutorial warning lead, and a 200m exclusion zone from other hazards. The first pit alone gets the explicit tutorial marker. An ordinary runner hitting a pit ends the run immediately. Hiyori's two per-run defenses can block pit falls.
- Keep existing code-based, biome-themed Phaser graphics and pastel UI direction. No Azure or server-ranking work is included.

## Progress

- P01: `in_progress` (3/4 tasks)
- P02: `pending` (0/1 task)
- P03: `pending` (0/2 tasks)
