# Task: T01 React Title Screen

## Status: done

## Goal

Implement the supplied Stella Runner title-screen visual direction in the React app while keeping existing menu actions and removing prototype downloads/disclaimer copy.

## Decision Summary

- Use the full-cast illustration at `public/assets/title/title-hero.webp` as local, offline title art.
- Build the screen from React and `src/styles/global.css`; do not embed the standalone `index.html` or `app.js`.
- Retain start, rankings, sound settings, audio credits, saved-record status, and optional controls help.
- Show no download links, ZIP labels, or fan-made demo footer.

## Implementation

### I01. Port the title composition into the React menu

- Related Files:
  - `src/app/screens/MainMenu.tsx` :: `MainMenu`; modify
  - `src/styles/global.css` :: `.landing-shell`, `.main-menu-card`, title hero/dock classes; modify
  - `public/assets/title/title-hero.webp` :: supplied `hero.webp`; new

#### Details

- Copy the supplied image from `public/assets/title/stella-runner-start-screen (1)/assets/hero.webp` to `public/assets/title/title-hero.webp`; preserve the original prototype folder.
- Restructure `MainMenu` into a full-viewport title scene with a decorative hero image, gradient overlay, `STELLA RUNNER` brand, Korean title `스텔라 러너`, and a fixed-flow bottom dock.
- Put the existing title description and top local-record state where they remain readable over the background. Keep their existing asynchronous loading/error behavior and top-score character label.
- Put the primary start button in the dock. Keep the four existing menu actions: start, local rankings, sound settings, and effect credits. Use the current callbacks/dialog logic; do not alter navigation or audio state.
- Render `showControlsHelp` only when true, inside the dock/help area.
- Add appropriate alternative text to the hero image. Use responsive `object-fit: cover` and tune `object-position` for portrait so the cast remains visible behind the overlay.
- Use distinct classes (for example `.main-menu-scene`, `.main-menu-hero`, `.main-menu-shade`, `.main-menu-topbar`, `.main-menu-copy`, `.main-menu-dock`) to avoid inheriting the old centered-card geometry.
- Ensure existing record status, title, primary CTA, and utility actions fit desktop and mobile. Do not add download anchors or any “fan-made prototype/demo” label/footer.
- Preserve global UI palette and selector/game styling; the task ports the prototype's composition and artwork, not its independent game UI or game engine.

### I02. Verify menu behavior and build

- Related Files:
  - `src/app/screens/MainMenu.test.tsx` :: `MainMenu` actions and title content; modify

#### Details

- Preserve tests for audio settings, credits, rankings, and all four menu buttons.
- Add an assertion that the menu has no download links and does not show standalone fan-demo copy.
- Run `npm run test -- src/app/screens/MainMenu.test.tsx`.
- Run `npm run build`.
- Check browser visual rendering when browser automation is available; if unavailable, record it without claiming screenshot validation.

## Acceptance Criteria

- [x] React main menu uses the supplied hero art in a full-screen title composition.
- [x] All existing main-menu actions and state messages continue to work.
- [x] No download links or fan-made demo disclaimer appear in the React menu.
- [x] Layout adapts to narrow/short viewports without hiding the main start action.
- [x] Targeted menu tests and production build pass.

## Validation

- `npm run test -- src/app/screens/MainMenu.test.tsx`
- `npm run build`
- Browser visual review at desktop and mobile sizes when available.

## Commit Message

```text
feat(ui): rebuild the Stella Runner title screen

Plan: 2026-10-30-stella-title-screen
Phase: P01-title-screen
Task: T01-react-title-screen

- Use the supplied group illustration and bottom start dock
- Retain React menu actions without prototype download/disclaimer content
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm run test -- src/app/screens/MainMenu.test.tsx`; `npm run build`)
- Browser screenshot audit unavailable: the connected browser host could not be reached in this environment.
- commit: `feat(ui): rebuild the Stella Runner title screen` on `project02`
