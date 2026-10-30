# Decisions: Runner Speed and Giant Power-Up Refinement

- Date: 2026-10-30
- Status: Confirmed

## D01. Base running speed
- **Chosen**: Increase both initial and maximum base speed by 10%: 250 → 275 and 325 → 357.5 world units/second. Keep the 90-second ramp, gate +5% bonuses, and character passives unchanged.
- **Rationale**: Raise the perceived pace from the start through late play without changing run animation FPS or character-specific balance.

## D02. Dense obstacle timing
- **Chosen**: Recalculate dense pattern and recovery gaps against the new maximum effective speed, preserving at least 2.5 seconds between obstacle patterns and 4.5 seconds after a three-pattern wave.
- **Rationale**: At five gates with Rin's passive, the new effective cap is 469.21875 units/second, or about 156.41m/s. Minimum whole-meter gaps are 400m and 704m; round the recovery gap to 720m for a 4.60-second recovery. A three-pattern wave period becomes 1,520m.

## D03. Giant item placement and duration
- **Chosen**: Place a six-second giant item immediately before dense obstacle waves, rather than at a generic repeating pickup cadence. Keep its obstacle-breaking effect; pits remain lethal.
- **Rationale**: The pickup becomes a deliberate preparation cue for the dense sequence. At the new maximum speed, six seconds covers the 100m lead-in plus all three hazards through the third pattern (800m after the wave start), while leaving the surrounding recovery interval unaffected.

## D04. Giant visual and animation
- **Chosen**: Increase giant visual scale from 1.25× to 1.35×, keep its physics hitbox unchanged, and keep the character's current action animation active. Grounded characters continue their normal run loop during giant; jumps, slides, falling, and pit-fall animations continue to use their corresponding action animations.
- **Rationale**: Make the power-up look more substantial while avoiding animation changes or hitbox changes as side effects of visual scaling.

## D05. Implementation workflow
- **Chosen**: Execute as a two-task memory plan on `project02`, one task for speed/pacing and one for giant placement/presentation.
- **Rationale**: Speed values determine safe obstacle gaps; the dependent giant schedule should use the final wave cadence.
