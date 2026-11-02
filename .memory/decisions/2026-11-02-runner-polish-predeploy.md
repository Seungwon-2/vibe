# Decisions: Runner Polish and Pre-deployment Review

- Date: 2026-11-02
- Status: Confirmed

## D01. Achievement catalog cleanup
- **Chosen**: Keep meaningful distance and coin milestone tiers, remove repeated per-character 1,000m cards and the no-hit achievement that duplicates the Story stage challenge. Replace them with two aggregate milestones: complete 1,000m with each of the five runners, and clear all four Story courses.
- **Rationale**: The achievements screen should reward distinct goals while still encouraging roster variety and Story completion. Existing per-stage no-hit challenges remain the dedicated no-hit reward path.

## D02. Story stage selection viewport
- **Chosen**: Fit the four stage cards and actions inside the viewport with a compact 2×2 layout and no page-level scrolling at supported desktop and mobile sizes.
- **Rationale**: All stages and controls should remain visible together. Compact card spacing and responsive type scale before hiding or clipping content.

## D03. Overhead slide hazards
- **Chosen**: Overhead hazards must be cleared by sliding. Jumping does not avoid them; the collision lane spans the player's jump height while the grounded slide action safely passes through.
- **Rationale**: Match the intended control prompt and make the obstacle teach one unambiguous response.

## D04. Giant state and animation priority
- **Chosen**: Giant mode changes size and appearance only. It keeps normal run animation while grounded, but jump, double-jump, slide, and hurt animations retain the same priority and timing as normal size.
- **Rationale**: Giant mode must not override the player's action state. This corrects the current unconditional run selection while giant is active.

## D05. Giant visual treatment
- **Chosen**: Replace the prominent generic ring with a restrained glow and small accent-colored sparkles coordinated with the selected runner; do not change collision or passive rules.
- **Rationale**: The pickup should read clearly without clashing with character art.

## D06. End animation playback
- **Chosen**: Use each character's configured native animation FPS for victory and game-over playback, with no additional speed multiplier.
- **Rationale**: Preserve the authored timing differences across character sheets and remove the accelerated ending impression.

## D07. Audio replacement source
- **Chosen**: The user will provide replacement audio files. Keep the current audio mappings and filenames, replacing assets under `public/audio/music/` and `public/audio/sfx/` when supplied; do not recreate or substitute tracks in code.
- **Rationale**: The user wants to choose the new sound and music source directly. Stable filenames avoid unnecessary playback-code changes.

## D08. Pre-deployment scope
- **Chosen**: Run local asset validation, tests, typecheck, lint, build, and production-preview checks; report Azure/Entra configuration gaps without deploying.
- **Rationale**: This request is a release-readiness review. Deployment remains a separate explicit action.
