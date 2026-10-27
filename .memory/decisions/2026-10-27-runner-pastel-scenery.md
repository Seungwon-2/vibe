# Decision: Runner Pastel Scenery Follow-up

## Reference and scope

The user supplied a soft blue sky-garden runner screenshot as a visual direction for course backgrounds and obstacles. Apply its airy palette, layered depth, gentle shapes, and readable hazards to the existing four original biomes. Do not copy its characters, buildings, interface, or screenshot pixels.

## Implementation decisions

- Keep the four biome names and the 0m, 2,500m, 5,000m, and 7,500m boundaries.
- Use local Phaser Graphics and linear-filtered textures for soft pastel art. Dawn city gets warm buildings, forest gets moonlit trees, mine gets luminous crystals, and skyway gets cloud gardens and pavilions.
- Give floor and overhead hazards a themed visible skin that stays inside the existing Arcade collision rectangles. Keep jump/slide controls, timer, gate awards, and collectible schedules unchanged.
- Keep the P03-T02 active task pointer unchanged. Its HUD and control-layout work is separate from this scenery refinement.

## Verification

All 61 tests, typecheck, build, and lint pass. Local Edge screenshots inspected four biomes at game size and the skyway at 844×390.
