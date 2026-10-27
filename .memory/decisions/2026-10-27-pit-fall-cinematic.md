# Decisions: Pit Fall Cinematic

- Date: 2026-10-27
- Status: Confirmed

## D01. Fatal pit sequence
- **Chosen**: When a pit fall is fatal, the runner visibly falls through the course and exits below the playfield. After the character leaves view, shake the game camera briefly, then show the existing run-finished/game-over result.
- **Rationale**: The player should see the fall and understand why the run ended before the result replaces gameplay.

## D02. Course and timer during the sequence
- **Chosen**: Freeze course distance, obstacle/background movement, and the run timer when the fatal fall begins. The player continues falling as a short scene-only animation.
- **Rationale**: Keep the recorded distance and remaining-time outcome anchored to the moment the pit caused the run to end.

## D03. Timing and shake scope
- **Chosen**: Use a roughly 700ms fall and a 250ms camera shake, then emit the existing finish event. Apply shake to the game camera/playfield, not the surrounding page UI.
- **Rationale**: Preserve enough time to read the fall without making the result feel delayed.

## D04. Passive-defense interaction
- **Chosen**: When Hiyori's per-run guard blocks a pit, consume one charge, show the pink-flame guard effect, dip the character briefly below ground level, and bounce her back to the safe running height. Remove the pit overlap and continue the same course without a time penalty, stagger, or full-screen fall. Only a pit that is not blocked gets the fatal fall cinematic.
- **Rationale**: The rescue reads clearly as a near-fall while keeping it visually distinct from the fatal off-screen fall and preserving the run.

## D05. Result data and persistence
- **Chosen**: Preserve `finishReason: 'pit'` and record the distance/coins from pit contact. Delay result submission and the result UI until after the fall and shake complete; do not count cinematic time against the run timer.
- **Rationale**: Keep ranking/result data deterministic while allowing the visual sequence to finish.
