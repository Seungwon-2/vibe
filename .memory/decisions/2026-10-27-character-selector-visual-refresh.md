# Decisions: Character Selector and Visual Refresh

- Date: 2026-10-27
- Status: Confirmed

## D01. Scope
- **Chosen**: Refresh the character selector, all four runner biome backgrounds, and the shared visual treatment of the main menu, run HUD/buttons, pause, ranking, and result screens.
- **Rationale**: The current dark navy selector and game surfaces feel disconnected from the pastel runner direction. A consistent visual system should carry across the full game flow.
- **Constraints**: Preserve gameplay behavior, ranking and result data, character roster/availability, biome order and thresholds, and information architecture outside the selector's requested presentation changes.

## D02. Visual direction and common palette
- **Chosen**: Bright pastel fairytale illustration style. Use cloud white and pale sky blue as the common UI foundation, with lavender and character/biome accent colors.
- **Rationale**: This matches the supplied light runner reference while retaining a distinct identity for each character and biome.

## D03. Character selector composition
- **Chosen**: Keep a large selected-character showcase on the left and a two-column character grid on the right, with the fifth card centered in its final row. At narrow widths, retain a responsive, scrollable layout without horizontal page overflow.
- **Rationale**: This preserves the established asymmetric selection composition and keeps all five catalog entries discoverable.

## D04. Character selection card contents
- **Chosen**: Remove portrait/background art from every roster card. Show only a uniformly sized/aligned SD character sprite and the character name. Preserve the selected accent-color state and keep unavailable characters disabled and marked as preparing after playable entries.
- **Rationale**: Standardized SD-only cards reduce visual clutter and make character scale comparable at a glance.

## D05. Selected-character showcase
- **Chosen**: Use the selected character's upper-body portrait as the left showcase background, with the SD sprite in front, and retain the character name and passive summary. Play the victory animation once when the candidate changes, then hold its final pose. Unselected roster sprites use their idle animation.
- **Rationale**: The large portrait gives the selected character presence; the one-shot victory pose provides feedback without a distracting loop.

## D06. Runner biome artwork
- **Chosen**: Redraw all four biome backdrops as code-based pastel layered illustrations, retaining their existing identities, distance order, and distinct accent colors. Harmonize HUD and controls with the same pastel visual system while keeping gameplay-critical hazard, pickup, and text contrast clear.
- **Rationale**: Code-based layers stay easy to tune and performant; preserving theme identity avoids confusing the distance progression.

## D07. Other screen styling
- **Chosen**: Apply the new color, panel, and background treatment to the menu, pause, ranking, and result screens while keeping their current features, actions, and information layout.
- **Rationale**: A shared design system prevents visual breaks between screens without broadening the work into a functional redesign.
