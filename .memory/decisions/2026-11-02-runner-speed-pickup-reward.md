# Decisions: Runner Speed and Pickup Rewards

- Date: 2026-11-02
- Status: Confirmed

## D01. Story defeat transition
- **Chosen**: When Story mode loses its final life, freeze the course and show the character's game-over pose for about 1 second before opening the result screen. This extra hold applies only to Story life depletion; existing pit-fall cinematics remain as they are.
- **Rationale**: The player should see a clear defeat beat without delaying unrelated run endings.

## D02. Global speed increase
- **Chosen**: Increase both the configured starting speed and configured maximum speed by 10%, keeping the existing ramp duration and gate bonuses. Increase Endless obstacle/recovery intervals by 10% to preserve action time; leave Story routes unchanged so their pace becomes more challenging. Character animation playback and collision boxes do not scale with course speed.
- **Rationale**: Increase perceived pace consistently from the start through the speed ramp while preserving the current progression curve.

## D03. Mary pickup passive
- **Chosen**: Increase Mary's item pickup radius bonus from +35% to +50%; keep collision detection for hazards unchanged.
- **Rationale**: Make her collection passive more noticeable without changing obstacle physics.

## D04. Coin route layout
- **Chosen**: Add more frequent, readable coin lines on the safe running route and action-guidance routes for jumping and sliding, in both Endless and Story. Preserve the existing rule that pickups do not conflict with hazards, pits, or gates except for an intentional low slide-guide line beneath an overhead obstacle; keep pickups reachable with their intended action.
- **Rationale**: Increase collection opportunities and visually communicate the recommended movement path.
