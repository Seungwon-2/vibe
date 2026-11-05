# Decisions: Runner Speed Power-Ups

- Date: 2026-11-05
- Status: Confirmed

## D01. Giant power-up speed
- **Chosen**: Giant grants 2.5x the character's current speed for its existing 6-second duration, alongside its existing 1.35x size and ordinary-obstacle protection. It does not protect against pits.
- **Rationale**: The existing giant item becomes a short, high-impact obstacle-wave breakthrough power-up.

## D02. Separate speed power-up
- **Chosen**: Add a speed-only pickup that grants 2.5x the character's current speed for 3 seconds in both Endless and Story modes. It does not change size or protect from collisions.
- **Rationale**: Players can choose a temporary burst without receiving the giant item's protection.

## D03. Speed calculation and overlap
- **Chosen**: Apply the 2.5x multiplier to current speed after character passive and gate acceleration. Cap combined giant and speed-pickup effects at 2.5x current speed; do not multiply them together. Each effect keeps its own timer, so giant protection lasts only while the giant timer remains active.
- **Rationale**: This preserves character and course progression effects while avoiding unexpectedly extreme combined speeds.

## D04. Recollecting a speed pickup
- **Chosen**: Collecting another speed pickup while its effect is active refreshes its duration to 3 seconds; it does not stack or accumulate time.
- **Rationale**: The rule is predictable and keeps speed bounded.

## D05. Pickup placement
- **Chosen**: Place a separate speed pickup approximately every 1,200 meters in both modes. Keep it clear of hazards, pits, gates, and other pickups using their visible and collision extents.
- **Rationale**: The effect appears regularly without creating object overlaps or unsafe routes.

## D06. Pickup appearance and feedback
- **Chosen**: Use a sky-blue lightning pickup, distinct from the gold coin and purple-pink giant comet. Show the remaining 3-second speed-effect duration in the HUD.
- **Rationale**: Color, silhouette, and timer feedback make the pickup and its temporary effect easy to recognize.

## D07. Existing time pickups
- **Chosen**: Keep the existing Story time pickup's +15% speed for 3 seconds and add the new 2.5x pickup separately. Preserve the established Endless rule: no time-recovery pickups; gates restore time.
- **Rationale**: The new high-impact pickup supplements existing mode behavior without removing the milder Story pickup or restoring Endless timer farming.

## D08. High-speed collision reliability
- **Chosen**: During implementation, review collision checks at the new top speed and prevent hazards from being skipped due to large per-frame movement, using swept checks or bounded substeps where needed. Do not alter sprite animation rate or collision-box dimensions to simulate speed.
- **Rationale**: A 2.5× world speed must remain fair and preserve collision behavior.

## Codebase notes
- `src/game/runner/RunnerSimulation.ts` currently models the Story +15% effect with `stageSpeedBoostRemainingMs`; giant duration and collision protection are tracked separately.
- `src/game/runner/CollectibleSpawner.ts` schedules safe pickups and giant pickups; add the new pickup without disturbing existing deterministic placement guarantees.
- `src/app/components/RunnerHud.tsx` already displays giant and Story speed-effect timers; extend it to distinguish the new 2.5x effect.
- Existing tests cover Story time pickups, Endless time recovery, giant duration, and pickup placement. Update coverage to match the established Endless no-time-pickup rule if that behavior is still pending in code.
