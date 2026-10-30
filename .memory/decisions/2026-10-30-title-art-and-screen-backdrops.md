# Decision: Title Art Visibility and Screen Backdrops

## Context

The title artwork is too dim and the heading overlaps the character faces. The user wants the bottom menu dock preserved, the title and image made clearer, and the same title illustration used at low opacity behind character selection and gameplay screens.

## Decisions

- Move the title heading to the open upper sky area, keeping the full-cast art unobstructed and the existing bottom menu dock in place.
- Reduce the title-scene dark overlay substantially; use only subtle scrims needed for text contrast.
- Add the same hero art as a low-opacity background layer behind the character selector and the outer gameplay screen.
- Use translucent screen surfaces where needed so the backdrop is perceptible while preserving card, HUD, and game-stage contrast.
- Do not overlay the Phaser canvas or alter the in-game biome art and gameplay geometry.
- Preserve all existing menu and game interactions.
