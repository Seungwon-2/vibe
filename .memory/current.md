# Current Context

## Active Plan
[Runner Gameplay Review Updates](./plans/2026-11-02-runner-gameplay-review.md)

## Active Phase
[P01 Gameplay Systems](./phases/2026-11-02-runner-gameplay-review/P01-gameplay-systems/phase.md)

## Active Task
[T03 Mode-Specific Giant Pickups](./phases/2026-11-02-runner-gameplay-review/P01-gameplay-systems/T03-mode-specific-giant-pickups.md)

## Status: in progress
- Story pickup schedule now checks its own stage's fixed pits.
- Dawn City double-jump barrier moved to 1,300m with neighboring hazards retimed.
- Tie giant pickups to each mode's actual challenge schedule.
- Add varied Story hazard sequences and progressive Endless interval tuning.

## Next Step
Implement T03 in `CollectibleSpawner.ts`: keep Endless giants linked to dense waves and place Story giants only before authored obstacle groups covered by the six-second effect.
