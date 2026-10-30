# Character ability icons

Place character passive icons in this folder.

- Use the passive ID as the filename, for example `rin-speed.svg` or `hiyori-guard.png`.
- SVG is preferred for crisp scaling. Transparent PNG is also supported.
- Keep the icon centered on a square transparent canvas; for SVG, use a `viewBox` such as `0 0 24 24`.
- Send the passive names, descriptions, values, and character mappings separately; these are configured in `src/game/characters/characterAbilities.ts`.

Current passive IDs:

- `rin-speed`
- `hiyori-guard`
- `mary-pickup-magnet`

Toa and Rang currently use default performance without a custom passive. Add their icon files after their passive IDs are decided.
