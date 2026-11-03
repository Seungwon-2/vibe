# Decisions: Screen Content Scale Alignment

- Date: 2026-11-03
- Status: Confirmed

## D01. Gameplay HUD width
- **Chosen**: Match the gameplay HUD bar to the responsive rendered width of the 16:9 game stage, including standard, short-landscape, and compact-width layouts.
- **Rationale**: The HUD should visually belong to the playfield and share its left/right edges at every viewport size.

## D02. Result screen size
- **Chosen**: Cap result panels at the same 1,400px content width as the stage selection panel, use content-driven height bounded by the viewport, and keep overflow inside the panel.
- **Rationale**: Results remain comfortable to scan while story rewards and achievements can still fit or scroll internally.

## D03. Character selector size
- **Chosen**: Use the same 1,400px maximum content width as stage selection. In landscape, scale the selector panel proportionally within available viewport width/height; keep the existing swipeable roster behavior in portrait.
- **Rationale**: The selector aligns with the progression screen scale without breaking its five-character strip, runway, or mobile navigation.

## D04. Gameplay canvas
- **Chosen**: Keep the logical 960×540 Phaser canvas and its 16:9 aspect ratio unchanged.
- **Rationale**: Only the UI frame width should align; stretching or altering the game canvas could misalign movement and collision presentation.
