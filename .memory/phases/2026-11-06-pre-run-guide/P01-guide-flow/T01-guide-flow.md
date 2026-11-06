# Task: T01 First-Run and Pause Guide

## Status: done

## Goal
Give players an accessible, readable guide to controls, pickups, mode-specific effects, and their selected character's passive before their first run, and provide the same guide from pause without accidentally resuming the run.

## Decision Summary
- Implement the confirmed behavior in `../../../decisions/2026-11-06-pre-run-guide.md`: first-run automatic display, pause-menu manual reopen, controls/items/selected passive, initial start continues into the existing 3-second countdown, pause review close returns to pause.
- Keep all simulation rules unchanged. The guide is explanatory UI and must not alter gameplay input, countdown duration, item placement, passive tuning, or persisted run/record data.

## Implementation

### I01. Guide view and mode-aware reference content
- Related Files:
  - `src/app/components/RunnerGuideDialog.tsx` :: `RunnerGuideDialog`, guide props, content rendering — guide modal and item/control reference; new
  - `src/app/components/RunnerGuideDialog.test.tsx` :: guide rendering tests — verify all explanations and mode differences; new
  - `src/game/runner/runnerConfig.ts` :: `RUNNER_CONFIG` — read-only source for current durations and multipliers
  - `src/game/characters/characterAbilities.ts` :: `getCharacterPassive`, `CharacterPassiveDefinition` — read-only source for selected passive label and effect
  - `src/app/components/CharacterAbilityIcon.tsx` :: `CharacterAbilityIcon` — read-only existing passive icon renderer and asset mapping
  - `src/game/characters/characterCatalog.ts` :: `getCharacter` — read-only source for selected character display name
  - `src/game/runner/RunnerSimulation.ts` :: `collectPickup`, `getSpeed`, `collectPickup` branches — read-only source for item semantics
  - `src/game/runner/CollectibleSpawner.ts` :: `drawPickupArt`, `PickupDefinition` — read-only source for item kinds and visual identity
- Component contract:
  ```ts
  export type RunnerGuideDialogProps = Readonly<{
    mode: RunnerMode;
    character: CharacterDefinition;
    variant: 'first-run' | 'pause-review';
    portrait: boolean;
    onStart(): void;
    onClose(): void;
  }>;
  ```
- Render as an accessible modal dialog (`role="dialog"`, `aria-modal="true"`, labelled heading). Give its action a distinct accessible name based on `variant`: first-run uses `안내를 확인하고 시작`; pause review uses `일시정지로 돌아가기`.
- Content must include:
  - `Space`/`↑` performs a jump; a second jump press while airborne performs the one available double jump; `↓` held performs a slide; `P` pauses/resumes; mobile jump and slide buttons map to the same actions.
  - Coins are collected on contact and are credited to the wallet once when the run ends, including a failed run.
  - The time-shaped pickup has mode-specific semantics: in Endless, standalone time pickups do not restore the timer and the timer bonus is awarded by gates; in Story, a time pickup gives a 3-second +15% speed boost.
  - The blue lightning pickup grants a 2.5x speed multiplier for 3 seconds. The giant star pickup grants the same 2.5x speed multiplier and giant appearance for 6 seconds and ignores ordinary hazards while active; pits remain dangerous.
  - Display only the selected character's passive, sourced from `getCharacterPassive(character.id)`: passive name and `effectLabel`; if `icon` is non-null, render the existing `CharacterAbilityIcon` with `character.accentColor`, otherwise omit the icon. Keep icon decorative (`aria-hidden`) because the adjacent passive name and effect provide its meaning.
- Do not duplicate tuning constants in explanatory text. Export a small pure content selector if needed (for example `getRunnerGuideItems(mode)`), referencing `RUNNER_CONFIG` so displayed times and multipliers stay aligned with the simulation.
- Make the dialog usable in narrow landscape and portrait viewports: bounded viewport height, internal scrolling when needed, visible close/start action, keyboard focus, and no horizontal overflow. Do not hide the guide controls at mobile breakpoints.

#### Details
- Data and types:
  - `RunnerGuideDialogProps.mode`: existing `RunnerMode` (`'endless' | 'story'`).
  - `RunnerGuideDialogProps.character`: existing `CharacterDefinition` returned by `getCharacter(characterId)`.
  - `RunnerGuideDialogProps.variant`: `'first-run' | 'pause-review'` selects CTA label and close affordance.
  - No new persistent schema. Continue using `RUNNER_TUTORIAL_STORAGE_KEY` in `src/game/runner/runnerTutorial.ts`.
- Exact current values to explain from `RUNNER_CONFIG`: `countdownMs = 3_000`, `storySpeedBoostMs = 3_000`, `storySpeedBoostRatio = 0.15`, `speedPickupDurationMs = 3_000`, `speedPickupMultiplier = 2.5`, `giantDurationMs = 6_000`, `giantSpeedMultiplier = 2.5`.
- Passive icon mapping is already implemented by `CharacterAbilityIcon` using imported assets from `assets/character/abilities/icons/`. Reuse that component; do not construct asset URLs or duplicate the icon-to-file map.

### I02. First-run gating and pause-review state transitions
- Related Files:
  - `src/app/screens/RunScreen.tsx` :: `RunScreen`, tutorial state, pause and guide handlers — wire the modal and lifecycle; modify
  - `src/app/components/PauseOverlay.tsx` :: `PauseOverlayProps`, `PauseOverlay` — add the manual guide action; modify
  - `src/game/runner/runnerTutorial.ts` :: `shouldShowRunnerTutorial`, `markRunnerTutorialSeen` — preserve storage key and use existing persistence only after the first-run guide's start action; modify only if the current helper contract requires an additive helper
  - `src/styles/global.css` :: `.runner-overlay`, `.runner-pause-card`, guide-specific selectors — modal layout and responsive rules; modify
- `RunScreen` state transitions:
  1. Initialize `tutorialEnabled` from `shouldShowRunnerTutorial()` once per screen mount.
  2. Initialize `guideOpen` to `tutorialEnabled`; initialize `paused` to `isPortrait() || tutorialEnabled`. This guarantees the Phaser scene is paused from its first creation while the first-run guide is open. `RunnerScene.create()` starts in countdown phase, emits `3`, then pauses the scene if registry `paused` is true; Phaser pause freezes the countdown update.
  3. First-run CTA calls `markRunnerTutorialSeen()`, closes the guide, and sets `paused` to current `portrait` state. In landscape the already-existing countdown continues from its frozen 3-second state; do not reset it or create a second countdown. In portrait, keep the game paused and let the existing rotate-to-landscape pause UI remain in control.
  4. Pause review action hides `PauseOverlay` while leaving `paused === true`, then opens `RunnerGuideDialog` with `variant="pause-review"`. Closing it only closes the guide, so `PauseOverlay` reappears and the game stays paused. Do not call `setPaused(false)` from pause-review close.
  5. Preserve `tutorialEnabled` for the existing first-run obstacle and pit hints during the run. The persistent flag is written by the first-run CTA, not merely by mounting the screen; manually reviewing the guide later does not rewrite the flag.
  6. Audio settings, exit confirmation, pause hotkey, and orientation handling remain functional. The guide modal must not be rendered simultaneously with the pause dialog or settings dialog; guide close returns to pause and guide start is only available in first-run variant.
- Add `onOpenGuide(): void` to `PauseOverlayProps`; render an accessible `설명서 보기` button alongside resume/audio/exit. `RunScreen` controls switching between the pause and review dialogs.
- Remove or replace the existing first-run footer-only control help in `RunScreen`; retain first-run hazard/pit hints by continuing to pass `tutorialEnabled` into `RunnerGame`.

### I03. Flow and accessibility regression coverage
- Related Files:
  - `src/app/screens/RunScreen.test.tsx` :: first-run guide, countdown pause, guide persistence, pause-review close, and dialog mutual exclusion tests; modify
  - `src/app/components/PauseOverlay.test.tsx` :: manual guide button callback and accessible label; new
  - `src/app/components/RunnerGuideDialog.test.tsx` :: content, mode differences, passive mapping and CTA labels; created in I01
- Required scenarios:
  1. First visit opens the guide, passes `paused=true` to `RunnerGame`, shows the selected passive, and has not persisted `RUNNER_TUTORIAL_STORAGE_KEY` before the player starts.
  2. First-run CTA persists the seen flag once, closes the guide, and unpauses only in landscape; the running scene's existing countdown is not reset.
  3. A subsequent mount does not auto-open the guide but continues to show normal game controls and still receives first-run hint flag as false.
  4. Pause -> `설명서 보기` opens the guide while `RunnerGame` remains paused; closing returns to the pause dialog and still passes `paused=true`.
  5. Reopening the manual guide does not change persistence and does not render the pause/audio dialog at the same time.
  6. Endless and Story text differ correctly for time items; both explain coins, speed, giant/pit behavior, double jump, slide and mobile controls.
  7. Each playable character displays the exact current passive name/effect and corresponding icon; fallback/unassigned definitions do not produce a broken image.

## Acceptance Criteria
- [ ] First-time players see the complete guide before any countdown time elapses.
- [ ] The initial guide action begins the existing 3-second countdown without resetting its duration.
- [ ] Pause review closes back to pause, leaving gameplay frozen.
- [ ] The content reflects actual controls, pickup behavior, mode-specific time behavior, speed/giant values, pit danger, and selected passive.
- [ ] The former footer hint is not the only explanation surface; first-run obstacle warnings remain intact.
- [ ] Guide interactions work with keyboard, touch, screen readers, and narrow viewports without layout overflow.

## Validation
- `npm run test -- src/app/components/RunnerGuideDialog.test.tsx src/app/screens/RunScreen.test.tsx src/app/components/PauseOverlay.test.tsx` — verify guide content, mode differences, storage, countdown freeze/start, pause return and legacy run flows.
- `npm run typecheck` — ensure component props and state transitions are typed.
- `npm run lint -- --no-warn-ignored` — validate React hooks, accessibility markup, and formatting on the changed code.

## Commit Message
```text
feat(guide): add first-run controls and item manual

Plan: 2026-11-06-pre-run-guide
Phase: P01-guide-flow
Task: T01-guide-flow

- Show the guide before first run and expose it from pause
- Explain current mode items and the selected passive
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: feat(guide): add first-run controls and item manual
