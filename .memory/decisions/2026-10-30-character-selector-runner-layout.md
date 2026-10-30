# Decisions: Character Selector Runner Layout

- Date: 2026-10-30
- Status: Confirmed

## D01. Selector composition
- **Chosen**: Replace the large selected-character showcase with five horizontal character cards, followed by a wide running-preview lane and bottom navigation actions.
- **Rationale**: This follows the supplied reference and gives the character roster and their movement equal visual weight.

## D02. Character order and selection
- **Chosen**: Show Rin, Hiyori, Mary, Toa, and Rang in that order. Clicking a card selects it, applies its character accent to the selected border, and updates the start button label.
- **Rationale**: The order matches the reference image and preserves the existing select-then-confirm interaction.

## D03. Passive information
- **Chosen**: Every card shows the matching passive icon, passive name, and effect description.
- **Rationale**: The user explicitly asked to preserve the existing icon-with-description presentation while adopting the new card layout.

## D04. Character preview
- **Chosen**: Show each character's existing SD artwork in the card and loop the run animation for all five in the lower runway.
- **Rationale**: The repository already contains five runtime atlases with run animations, so the layout can use the game assets directly.

## D05. Visible character names
- **Chosen**: Change user-facing character names to Korean full names: 아오쿠모 린, 시즈키 토아, 코가네 랑, 하나요 히요리, 토키노 메리. Keep internal character IDs and persisted identifiers unchanged.
- **Rationale**: The user asked for the names shown in the new selector to be Korean, and confirmed the displayed names should change.

## D06. Responsive behavior
- **Chosen**: Keep one horizontal row of five cards at desktop sizes. At narrow widths, allow horizontal card scrolling with snap instead of shrinking the artwork into unreadable thumbnails; keep the running lane scrollable and the bottom actions reachable.
- **Rationale**: This retains the reference's side-by-side card presentation while avoiding clipped or undersized characters on mobile.
