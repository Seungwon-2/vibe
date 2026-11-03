# Decision: Runner HUD Layout Unification

- Date: 2026-11-03
- Status: Confirmed from the user's request and current UI implementation.

## D01. Shared mode HUD structure
- **Chosen**: Story and Endless use one four-column HUD row: timer/course progress, distance, lives, and coin/pause actions. Mode-specific timer labels and progress content remain; the positions do not change by mode.
- **Rationale**: The current Story-only four-column override and default three-column grid wrap Endless actions onto the next row.

## D02. HUD placement relative to gameplay
- **Chosen**: Render the HUD in normal layout flow immediately above the game stage. Keep only jump/slide touch controls and modal overlays on top of the game canvas.
- **Rationale**: The current absolute HUD sits on top of gameplay; its details row also spills over the fixed-height HUD box. Moving it outside prevents pause and status UI from obscuring the course.

## D03. Shared details row and mode-specific contents
- **Chosen**: Keep the landmark, passive ability, and active power-up details in a second row of the same HUD for both modes. Preserve Story course progress and Endless countdown timer, plus the existing mode-specific game rules.
- **Rationale**: Both modes need the same information hierarchy, while their primary progress metric remains distinct.

## D04. Responsive play area
- **Chosen**: Keep the 16:9 game stage and derive its maximum width from the viewport height after reserving space for the screen header, shared HUD, and help row. On short landscape screens, hide the redundant keyboard help row while preserving touch controls.
- **Rationale**: Phaser uses a 960×540 logical canvas with FIT scaling; preserving 16:9 avoids stretching collision geometry and character art.
