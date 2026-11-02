# Decisions: Runner Gameplay Review Updates

- Date: 2026-11-02
- Status: Confirmed
- Scope note: The user requested the previous review recommendations in order. D01 was explicitly selected. For the remaining details, apply the stated recommended defaults unless the user steers otherwise.

## D01. Story Pickups Near Pits
- **Chosen**: Check Story pickups against the selected Story stage's pit schedule; relocate to the closest safe location using the existing slot search, and omit the pickup if no safe position exists.
- **Rationale**: A Story route must not place a collectible in a fatal pit opening. Retain established pickup cadence and safety margins where possible.

## D02. First Story Course Double-Jump Placement
- **Chosen**: Move the first course's double-jump barrier into the latter half, to at least 1,300m, and adjust nearby hazards together while preserving the 2,000m milestone, pit clearances, and the existing minimum hazard spacing.
- **Rationale**: The current 1,100m placement is before the halfway point of the 2,500m course and conflicts with the previously agreed introduction point.

## D03. Mode-Specific Giant Pickups
- **Chosen**: Keep Endless giant pickups tied to Endless dense waves. In Story, schedule them only before authored obstacle groups that their six-second duration can cover, and exclude placements that conflict with the fixed stage pit, hazard, milestone, or other pickup clearances.
- **Rationale**: Story's fixed route should not inherit unrelated Endless wave positions; giant pickups should help with an upcoming challenge rather than appear on an empty stretch.

## D04. Hazard Density Across Modes
- **Chosen**: Increase Story route density with authored short sequences and safe recovery gaps. In Endless, progressively tighten both within-wave obstacle spacing and post-wave recovery gaps as distance increases; keep these values centrally configurable. Continue the existing speed increase over distance.
- **Rationale**: The user wants both modes to feel more challenging and specifically prefers late-run speed growth with shorter recovery periods over a single fixed difficulty level.

## D05. Existing Rules
- **Chosen**: Keep established story lengths, three lives per stage, pit-fall rules, character passives, milestone behavior, pickup effects, and stage rewards. Recalculate schedule clearances whenever hazards or pickups move.
- **Rationale**: This update addresses route pacing and schedule correctness without changing the core mode rules.
