# Plan: Running Action Redesign

> **Roster supersession (2026-10-27):** [Unified Runner Motions and Five-Character Roster](./2026-10-26-rin-unified-motion.md) completed its runtime and personal-best work. Rin, Hiyori, and Mary are playable; Toa and Rang remain visible as `준비 중` pending matching sprites. P03-T02 is active. Reconcile the older four-card selector in P03-T04 and the P04 ranking blueprint with this active roster and the separate per-character best store before implementing them.

> **Scenery refinement (2026-10-27):** The user provided a soft sky-garden visual reference after P03-T01. The four biome backgrounds and hazard skins now use original pastel graphics with linear filtering; the earlier pixel-art styling instruction is superseded. See [decision](../decisions/2026-10-27-runner-pastel-scenery.md). The active pointer remains P03-T02.

## Goal

Replace the Project 02 platformer starter with a locally playable, landscape 2D auto-runner. Preserve and port the four characters, their character-selection experience, and their motion artwork; add double-jump and held-slide play, fair authored hazards, four pixel-art biomes, a 90-second distance run with time bonuses, adjustable character passives, and browser-local rankings. Azure Entra ID and cloud ranking remain deferred.

## Confirmed decisions

- The complete game and selection UI are landscape on desktop and mobile. The runner stays near the left edge while the course scrolls.
- Space/Up jumps, Down slides; mobile has held touch controls. One extra jump is allowed in the air. Collision costs 5 seconds and staggers/protects for 800ms.
- Start at 90 seconds, cap at 120 seconds. A time pickup gives 3 seconds; three one-time gates at 2,500m, 5,000m, and 7,500m give 20 seconds each.
- Initial world speed is 250 units/second and ramps linearly to 325 over the first 90 active seconds. Use 1 meter per 3 world units so the first biome/gate arrives at about 2,500m/30 seconds. Stop the ramp at 325 if bonuses extend the run.
- Biomes change at 0m, 2,500m, 5,000m, and 7,500m: dawn city, moonlit forest path, crystal mine, cloud-top skyway.
- Use authored, readable, progressively denser hazard patterns. Collect coins and time pickups by contact; optional jump paths may offer additional pickups but are never required.
- Keep all four characters in one distance leaderboard. Centralize and tune their initial passives: Rin time pickup +1s; Toa 150ms slide-release grace; Yuni +12% second-jump impulse; Lize collision penalty 4s instead of 5s.
- Save local run records in the browser first; add Entra-backed all-player ranking in a future plan.

## Visual direction from the two reference images

- **Run composition:** use the first screenshot's layered side-scrolling composition, continuous floor, strong obstacle/pickup silhouettes, compact top information band, and bottom-corner Jump/Slide touch controls. Apply it to the original dawn city, moonlit forest, crystal mine, and cloud skyway biomes on the planned 960x540 canvas. Preserve the existing run rules and avoid platform/gap gameplay.
- **Character selection:** use the second screenshot's asymmetric showcase composition: a large selected-character area on the left and four compact selectable portrait cards in a 2x2 roster on the right. Keep the existing SD character preview, name, accent-color selection state, selected run loop, back button, and start confirmation. Do not add rarity, levels, prices, upgrades, unlocks, or a shop.
- These are layout and visual-hierarchy references, not assets to copy. P03-T01/T02/T03 specify stage presentation; P03-T04 is the selector-showcase redesign. P03-T01 is the current task after the runner engine phase.

## Project 02 starting point and migration boundary

- The `project02` remote branch begins at `6d1116e` and contains the React/Vite starter, not the latest game implementation.
- Reuse the character work from local branch `project02-running-action`: four portrait PNGs, current character sheets, locomotion sheets, runtime atlases/frames, manifests, and asset-preparation scripts. Port only those character assets and selector requirements; do not copy the old platformer stages, bosses, checkpoint/save model, or gameplay systems.
- Existing character IDs to preserve: `player-default` (Aokumo Rin, `#2b66c0`), `goth-student` (Shizuki Toa, `#513661`), `moonwing` (Ayatsuno Yuni, `#857fd8`), and `akane-lize` (Akane Lize, `#971b2f`).
- The selected run-cycle refinement remains active: four clearly alternating run poses per character. Add two slide poses and two double-jump poses per character so new actions read in the game.
- Keep React for screens and Phaser for the canvas. Reuse the current starter's Vite, Vitest, TypeScript, and React setup; add Phaser and the asset-build dependency/script when their tasks begin.
- Keep the existing simple landing/menu as the entry point. It starts character selection or opens rankings; remove the world/stage map and continue-save flow.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Port character artwork, finish runner poses, centralize character data/passives, and animate selection previews. | [P01](../phases/2026-10-26-running-action-redesign/P01-characters-and-entry/phase.md) |
| P02 | `done` | Build the deterministic run model, Phaser runner, controls, hazards, pickups, and collision rules. | [P02](../phases/2026-10-26-running-action-redesign/P02-runner-engine/phase.md) |
| P03 | `in_progress` | Add four pixel-art course biomes, reference-led run HUD/touch controls, complete screen flow, and a showcase-style four-character selector. | [P03](../phases/2026-10-26-running-action-redesign/P03-course-and-ui/phase.md) |
| P04 | `in_progress` | Persist local results, show the unified distance ranking, and verify local landscape play. | [P04](../phases/2026-10-26-running-action-redesign/P04-local-ranking/phase.md) |

## Execution order

Complete P01 through P04 sequentially on branch `project02`. Each task blueprint includes the target files, symbols, model fields, acceptance criteria, validation command, and commit message. Asset import and new frame creation happen in P01 before any runner code uses those animation keys.

## Not in this plan

- Azure Entra ID authentication, Azure Functions, SQL, cloud sync, or deployment.
- Platformer stages, platforms, stage maps, lives, checkpoints, stomping, enemies, or bosses.
- Player-facing ability sliders, character unlocks, coin shops, or time power-ups beyond the +3s pickup.
- Portrait-mode gameplay.
