# Plan: Character Selector and Visual Refresh

> **Queue:** Prepare this plan now, but do not activate it until the existing `2026-10-26-running-action-redesign` P04 local-ranking tasks are complete. Keep `.memory/current.md` on P04-T01 in the meantime.

## Goal

Bring the full game presentation into one bright pastel fairytale visual system. Redesign character selection so roster cards show consistently sized SD sprites and names only, while the selected character appears in a left showcase with an upper-body portrait backdrop and a one-shot victory pose. Retheme the four runner biomes and the menu, runner HUD/controls, pause, ranking, and result screens without changing game rules, ranking data, or screen actions.

## Confirmed Decisions

- Cover the character selector, all four runner biome backgrounds, and shared styling on the menu, runner HUD/buttons, pause, ranking, and result screens.
- Use cloud white and pale sky blue as the shared foundation, with lavender and character/biome accent colors. Overall art direction is a bright pastel fairytale.
- Keep the left selected-character showcase and right two-column five-character grid; center the fifth card in the last row. At narrow widths, stack/scroll without horizontal page overflow.
- Roster cards contain only a standardized SD sprite and character name. Remove portrait art from every roster card. Keep selected accent styling and playable-first ordering; Toa and Rang remain disabled as “준비 중”.
- The selected showcase uses the selected character's local portrait as a background, the SD sprite in front, and retains the character name and passive summary. Play victory once when the candidate changes and hold the final frame. Unselected roster sprites loop idle.
- Draw all four course backdrops as code-based pastel layered illustrations. Preserve biome identities/order, distance thresholds, gameplay, and recognizable hazard/pickup/gate contrast.
- Restyle menu, pause, rankings, and results while preserving their structure, content, and behavior.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `pending` | Define shared light UI tokens, redesign the selector, and harmonize the React screens. | [P01](../phases/2026-10-27-character-selector-visual-refresh/P01-ui-and-selector/phase.md) |
| P02 | `pending` | Retheme the four Phaser course biomes and verify gameplay readability and transitions. | [P02](../phases/2026-10-27-character-selector-visual-refresh/P02-runner-scenery/phase.md) |

## Execution Order

1. Finish the active P04 local ranking plan first, as requested.
2. After P04 completes, activate this plan by updating `.memory/current.md` to P01-T01.
3. Complete P01 before P02 so the shared palette and screen surfaces are stable before the Phaser art is tuned against them.
4. Keep character movement, collision geometry, item placement/rewards, distance thresholds, ranking records, and navigation behavior unchanged.

## Out of Scope

- New character sprites or portrait generation; use the existing locally bundled character portrait and runtime atlas assets.
- Gameplay mechanics, obstacle pattern, hit behavior, bonus timing, distance/score rules, or ranking schema changes.
- Adding new biomes, changing their order/thresholds, or replacing the code-based renderer with remote image assets.
- Entra ID, cloud ranking, account features, and backend changes.

