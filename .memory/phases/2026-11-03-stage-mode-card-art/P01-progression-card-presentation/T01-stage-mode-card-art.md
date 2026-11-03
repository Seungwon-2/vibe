# Task: T01 Stage and Mode Card Art

## Status: done

## Goal
Make the four story stages visually distinguishable through theme-specific preview art and make mode selection compact, centered, and information-rich while preserving the existing navigation and unlock behavior.

## Decision Summary
- Use the current `RunnerBiomeId` and `RUNNER_BIOMES` palettes as the source of truth for stage preview visuals.
- Stage cards use a 2×2 desktop layout with a distinct art region and readable information region. Mode cards use a centered, content-sized two-column layout with a maximum content width of 1,400px; both layouts stack on narrow screens.
- Keep all stage and mode actions, profile checks, and route transitions unchanged.

## Implementation

### I01. Create theme-specific stage preview art
- Related Files:
  - `src/app/components/StageBackdropPreview.tsx` :: `StageBackdropPreview` and its theme-specific SVG scenes; new
  - `src/game/visuals/runnerBiomes.ts` :: `RunnerBiomeDefinition`, `getBiomeById`; read-only
  - `src/game/runner/storyConfig.ts` :: `StoryStageDefinition`; read-only

#### Details
- Export a React component with this signature:
  ```ts
  type StageBackdropPreviewProps = Readonly<{ biomeId: RunnerBiomeId; stageName: string }>;
  export function StageBackdropPreview(props: StageBackdropPreviewProps): React.JSX.Element;
  ```
- Use `getBiomeById(biomeId)` to retrieve `palette.sky`, `palette.far`, `palette.middle`, `palette.ground`, and `palette.accent`; convert each numeric RGB value to a six-digit CSS hex string.
- Render a decorative inline SVG with `viewBox="0 0 640 220"`, `preserveAspectRatio="xMidYMid slice"`, `aria-hidden="true"`, and a theme-specific gradient/background. The SVG itself must have no text.
- Give each biome a clearly distinct silhouette using simple vector geometry: dawn-city uses a sunrise and varied skyline; moonlit-forest uses a moon and layered trees; crystal-mine uses angular crystal clusters and cave silhouettes; cloud-skyway uses layered clouds and floating-island/skyline forms. Keep contrast low enough for foreground text but recognizable at card scale.
- The preview component must not import Phaser or create a runtime canvas. Stage card text remains HTML for accessibility.

### I02. Integrate stage previews and compact stage card hierarchy
- Related Files:
  - `src/app/screens/StageSelect.tsx` :: `StageSelect`, `.stage-option` markup; modify
  - `src/styles/global.css` :: `.progression-screen--stages`, `.stage-options`, `.stage-option`, responsive rules; modify

#### Details
- Render `StageBackdropPreview` for every `STORY_STAGES` entry using `stage.biomeId` and `stage.name`.
- Preserve each card's current `disabled`, `aria-pressed`, click handler, selected stage state, unlocked/cleared calculation, and start button behavior.
- Structure each card into an art preview region and a lower information region containing the existing stage number, name, distance, coin target, and status. Maintain locked/cleared/selected styling and ensure foreground information is readable against the scene with a translucent light scrim where needed.
- On desktop, center the progression content at `width: min(100%, 1400px)` and let the panel height follow its content up to the viewport height. Stage cards use a 2×2 grid with a consistent visual aspect ratio and no `1fr` rows that stretch to consume unused screen height.
- On narrow layouts retain the 2×2 grid if the viewport permits; otherwise stack cards and allow scrolling inside the panel. Do not introduce page-level horizontal overflow.

### I03. Refine mode selection card hierarchy and spacing
- Related Files:
  - `src/app/screens/ModeSelect.tsx` :: `ModeSelect`, mode card markup; modify
  - `src/styles/global.css` :: `.progression-panel`, `.mode-options`, `.mode-option`, mobile rules; modify

#### Details
- Add a mode-specific panel class without changing `onSelect` or `onBack` behavior.
- Keep endless and story choices as equal-sized semantic buttons. Add a distinct decorative icon/scene treatment, a short mode description, and compact detail labels: endless shows the 90-second distance/coin challenge; story shows four themed courses and three lives per stage.
- Center the mode content in a `max-width: 1400px` region. Set panel/card height from content, with mode cards approximately 300px tall on desktop and smaller content-aware sizing on mobile. Avoid stretching buttons to fill all available panel height.
- At narrow widths stack the two cards; keep each card's full area clickable, preserve keyboard focus visibility, and avoid clipping text.

## Acceptance Criteria
- [x] Each of the four stage cards visibly uses its own biome-themed backdrop, with text and locked/cleared/selected state legible.
- [x] Stage card selection, unlock rules, achievements button, and start action behave as before.
- [x] Mode selection is centered and capped near 1,400px; its two cards have purposeful, content-sized proportions instead of viewport-height stretching.
- [x] Desktop uses a 2×2 stage grid and two mode cards side-by-side; narrow screens reflow without horizontal page overflow.
- [x] All four theme previews are code-based SVG and do not require extra image assets or Phaser instances.

## Validation
- `npm run typecheck` — no TypeScript errors.
- `npm run build` — production build succeeds.
- `git diff --check` — no whitespace errors.

## Commit Message
```text
feat(ui): add themed stage and mode cards

Plan: 2026-11-03-stage-mode-card-art
Phase: P01-progression-card-presentation
Task: T01-stage-mode-card-art

- Add illustrated previews for the four story biomes
- Give mode and stage selection cards content-sized layouts
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
