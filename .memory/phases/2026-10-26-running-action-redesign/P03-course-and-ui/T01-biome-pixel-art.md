# Task: T01 Biome Pixel Art

## Status: done

## Goal

Build four distinct scrolling course themes from Phaser-native pixel-art shapes and transition them smoothly at the approved distance landmarks.

## Decision Summary

- Biome boundaries: 0m dawn city, 2,500m moonlit forest, 5,000m crystal mine, 7,500m cloud-top skyway.
- Use editable Phaser Graphics/TileSprite-based scenery; do not add remote images or change gameplay collision shapes.
- The first user reference supplies composition only: a runner near the lower-left, continuous ground, layered silhouettes, pickups and obstacles in a readable play lane, and a compact top HUD. Keep the four original biome identities rather than recreating the screenshot's building or characters.

## Implementation

### I01. Define biome catalog and palettes

- Related Files:
  - `src/game/visuals/runnerBiomes.ts` :: `RunnerBiomeDefinition`, `RUNNER_BIOMES`, `getBiomeForDistance`; new.
  - `src/game/visuals/runnerBiomes.test.ts` :: boundary and palette tests; new.

#### Details

- `RunnerBiomeDefinition = { id: RunnerBiomeId; startDistanceMeters: number; palette: { sky: number; far: number; middle: number; ground: number; accent: number; hazardContrast: number }; landmark: string }`.
- Define thresholds and names exactly: `dawn-city`/0/“새벽 도심”, `moonlit-forest`/2500/“달빛 숲길”, `crystal-mine`/5000/“수정 광산”, `cloud-skyway`/7500/“구름 위 하늘길”.
- Initial palettes: dawn city navy with warm sunrise edge; moonlit forest deep blue/teal with cool moon accents; crystal mine indigo with cyan crystal highlights; cloud skyway pale sky blue/lavender with bright cloud bands. Keep hazard contrast at least 4.5:1 against the local ground color by choosing contrasting light/dark values.
- `getBiomeForDistance(distanceMeters)` returns the definition at the greatest start threshold not exceeding distance; negative input maps to dawn city.

### I02. Draw and scroll code-based backdrops

- Related Files:
  - `src/game/visuals/RunnerBackdrop.ts` :: `RunnerBackdrop` scene helper; new.
  - `src/game/runner/RunnerScene.ts` :: backdrop creation/update and biome transition; modify.
  - `src/game/visuals/RunnerBackdrop.test.ts` :: draw/update contract tests; new.

#### Details

- Build three parallax layers (far skyline/silhouette, mid-scene props, near ground/decor) using Phaser Graphics and/or TileSprite. Move each layer left at 0.15x, 0.4x, and 1.0x world speed respectively. The physical ground is a continuous non-colliding visual band; it creates no platform/gap gameplay.
- Compose within the planned 960x540 scene: reserve y=0..84 for React HUD legibility, keep the player near x=170, set the continuous ground top at y=470 with an 8px pixel edge and patterned body through y=540, and confine noninteractive foreground detail to the ground band. Do not move the P02 player, hazard bodies, or safe jump/slide windows for decorative reasons.
- Retain open visual space from x=150..760 and y=180..470 for action cues. Draw far silhouettes with lower contrast than middle scenery; keep all decorative pixels behind hazards, coins, +3s pickups, and the three +20s gates. Avoid decorations that look like a ground obstacle, overhead barrier, coin, or time pickup.
- At 2,500m, 5,000m, and 7,500m, draw an original landmark/gate silhouette synchronized with the run event and biome transition. The visual gate announces the bonus without changing its trigger or granting a second reward. Palette crossfade stays 750ms.
- Add named `groundTop`, `groundFace`, `pickupCoin`, `pickupTime`, and `gate` numeric color fields to `RunnerBiomeDefinition.palette` alongside `sky`, `far`, `middle`, `ground`, `accent`, and `hazardContrast`. Use these fields in `RunnerBackdrop` and scene pickup/gate drawing; keep colors distinct at game size and under each theme.
- Include recognizable pixel silhouettes per theme: rooftops and dawn signs; moonlit tree trunks and lanterns; crystal clusters and mine supports; cloud banks and floating skyway arches. Keep decorative objects outside jump/slide cue silhouettes.
- On crossing a biome boundary, crossfade palettes/layers for 750ms without pausing or resetting distance, timer, hazard order, or pickups. Do not spawn an extra gate reward during a visual transition.
- Use nearest-neighbor rendering and integer pixel placement. Keep scenery helpers independent from `RunnerSimulation` so palettes can be retuned without changing rules.

## Acceptance Criteria

- [x] All four themes transition at exactly the configured thresholds and remain in sync with their gate landmarks.
- [x] Three scenery depths move at the specified parallax ratios.
- [x] Ground and decorations do not create accidental collisions or obscure hazards/pickups.
- [x] At 960x540 and scaled 844x390, hazards and pickups remain distinguishable against all four backdrops, the floor reads as one continuous running surface, and each +20s landmark is visible before it is crossed.
- [x] All scenery is local, code-based, pixel-aligned, and editable.

## Validation

- `npm test -- src/game/visuals/runnerBiomes.test.ts src/game/visuals/RunnerBackdrop.test.ts` — validates thresholds and layer setup.
- `npm run typecheck` — validates biome and Phaser graphics types.
- Manual: inspect a local run through 0m, 2,500m, 5,000m, and 7,500m; confirm four palettes and no gameplay reset.
- Manual: capture 960x540 and 844x390 at each biome; check the HUD reserve, player/obstacle contrast, and pickup/gate silhouettes without using the reference screenshot as an asset.

## Commit Message

```text
feat(visuals): add four scrolling runner biomes

Plan: 2026-10-26-running-action-redesign
Phase: P03-course-and-ui
Task: T01-biome-pixel-art

- Draw dawn city, moonlit forest, crystal mine, and cloud skyway
- Transition scenery by distance with gameplay-safe parallax layers
```

## Progress

- [x] Implementation complete
- [x] Validation passed (60 tests, typecheck, build, lint; local Edge desktop/compact screenshots for all four biomes and a pre-gate view)
- commit: `6bb4399`
