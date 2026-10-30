# Decision: Runner Gameplay Polish

## Goal

Increase the runner's sense of speed while keeping late-course obstacles readable, and add one short giant power-up that rewards collection without removing pit danger.

## Confirmed Decisions

- Preserve the 90-second starting timer, existing gate rewards, four biomes, coin/time pickup rules, character passives, and keyboard/mobile controls.
- Keep the existing permanent gate acceleration of +5% per gate. Add a brief visual speed burst at each gate without changing character animation FPS or physics.
- At the maximum supported course speed, allow at least 2.5 seconds between dense obstacle patterns and at least 4.5 seconds for recovery after the three-pattern sequence. The current maximum calculation includes five gate bonuses and Rin's 5% speed multiplier.
- Add a themed giant pickup to the safe route at a predictable cadence, searching nearby legal positions when a target overlaps a hazard, pit, gate, or another pickup. Skip a target if no safe position exists.
- Giant lasts 4 seconds, activates automatically, visibly enlarges the character, and suppresses ordinary obstacle penalties while active. It does not protect against pits. Collecting it again refreshes the duration to 4 seconds; effects do not stack.
- Preserve the player's existing collision box during the visual size change. Keep pickup, hazard, and pit collision logic in code, separate from decorative art.
- Show the active giant effect and remaining time in the running HUD. Give the giant pickup a distinct pastel, biome-aware visual. Reuse an existing pickup sound; do not introduce a new audio asset.
- Keep the existing test and build workflow. Implement and commit each task on `project02`, while leaving unrelated pre-existing work unstaged.

## Rationale

At the current maximum effective speed of 426.5625 world units per second (about 142.19 meters per second), the current 300-meter pattern gap lasts about 2.1 seconds and the 550-meter recovery lasts about 3.9 seconds. Changing the dense gap to 360 meters and recovery to 640 meters yields about 2.53 and 4.50 seconds, respectively.

## Deferred

- A temporary speed-boost feather and coin-streak bonuses are deferred until the giant item and obstacle pacing have been locally evaluated.
- Entra ID, server rankings, and Azure deployment remain outside this plan.
