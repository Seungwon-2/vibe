# Runner Speed Power-Ups

- Date: 2026-11-05
- Status: Planned
- Decision record: [Runner Speed Power-Ups](../decisions/2026-11-05-runner-speed-powerups.md)

## Goal

Make the existing giant pickup a satisfying 2.5x speed burst, add a separate 3-second speed pickup to both modes, keep the effects readable and fair, and ensure collision checks remain reliable at the increased world speed.

## Confirmed behavior

- Giant: existing 6-second duration, 1.35x visual size, and ordinary-obstacle protection remain; world speed becomes 2.5x the current character-and-course speed. Pits remain dangerous.
- Speed pickup: sky-blue lightning, 2.5x current speed for 3 seconds, no size change or collision protection, available in Endless and Story. Recollecting refreshes the timer without stacking.
- Speed multipliers do not compound: while either high-speed effect is active, their shared speed multiplier is at most 2.5x. The effects retain independent timers and giant protection ends with the giant timer.
- Place speed pickups at approximately 1,200-meter intervals, outside the visible and collision extents of hazards, pits, gates, and other pickups.
- Story's existing time pickup continues to grant +15% speed for 3 seconds. Endless does not recover timer from a time pickup; gates remain its timer recovery source.
- Keep animation frame rate and collision-box geometry unchanged. Check collision traversal at high speed and add swept checks or bounded substeps where required.

## Phases

| Phase | Scope | Tasks | Status |
|---|---|---:|---|
| [P01 Speed Power-Ups](../phases/2026-11-05-runner-speed-powerups/P01-speed-powerups/phase.md) | Simulation, pickup placement and collision reliability, HUD feedback | 3 | planned |

## Execution order

1. [T01 Runner speed simulation](../phases/2026-11-05-runner-speed-powerups/P01-speed-powerups/T01-runner-speed-simulation.md)
2. [T02 Pickup placement and high-speed collision](../phases/2026-11-05-runner-speed-powerups/P01-speed-powerups/T02-speed-pickup-placement-collision.md)
3. [T03 HUD and pickup feedback](../phases/2026-11-05-runner-speed-powerups/P01-speed-powerups/T03-speed-powerup-feedback.md)

## Scope boundaries

- Do not change sprite animation cadence or character collision dimensions to create a sensation of speed.
- Do not combine the speed pickup with size growth or obstacle protection.
- Do not add timer recovery pickups to Endless mode.
- Azure deployment and authentication work remains separately planned and is not part of this gameplay change.

## Completion criteria

- Both speed effects follow the selected multiplier, cap, duration, refresh, and mode rules.
- Speed pickups are deterministic and appear in both modes without overlapping hazards, pits, gates, or other pickups.
- High-speed movement cannot skip relevant hazards, pits, or collectible overlaps.
- HUD clearly distinguishes the 2.5x burst from Story's +15% time pickup and giant duration.
- Focused tests and the production build pass.\n