# Task: T04 Settings and Music Routing

## Status: pending

## Goal

Expose audio settings from the main menu and pause overlay, show generated-audio provenance from the main menu, and route the correct background track to each screen and run biome.

## Decision Summary

- Main menu, character selection, rankings, and result use menu music; active running uses biome music; pause resumes the same run track at the same position.
- Settings use the T03 preference schema and remain available from both menu and pause.

## Implementation

### I01. Add accessible settings and credits dialogs

- Related Files:
  - `src/app/components/AudioSettingsDialog.tsx` :: `AudioSettingsDialog` — mute/music/effects controls; new
  - `src/app/components/AudioSettingsDialog.test.tsx` :: labels, keyboard, slider, and mute tests; new
  - `src/app/components/AudioCreditsDialog.tsx` :: `AudioCreditsDialog` — catalog-driven generated-audio credits; new
  - `src/app/components/AudioCreditsDialog.test.tsx` :: full catalog provenance rendering tests; new
  - `src/app/screens/MainMenu.tsx` :: `MainMenuProps`, `MainMenu` — settings and credits buttons/dialog state; modify
  - `src/app/components/PauseOverlay.tsx` :: `PauseOverlay` — add settings action while paused; modify
  - `src/app/screens/RunScreen.tsx` :: `RunScreenProps`, pause/settings state — show settings without resuming the run; modify
  - `src/styles/global.css` :: audio dialog, slider, focus, and responsive styles; modify
- Details:
  - `AudioSettingsDialog` props: `preferences: AudioPreferences`, `onChange(preferences: AudioPreferences): void`, `onClose(): void`. Provide labeled mute checkbox plus labeled music/effects range controls (`min=0`, `max=1`, `step=0.01`) and show each level as a percentage.
  - Use `role="dialog"`, `aria-modal="true"`, a visible title, and a close button. Keep keyboard focus visible and allow Escape to close; do not close on a slider interaction.
  - `AudioCreditsDialog` props: `onClose(): void`; render all entries from `RUNNER_AUDIO_TRACKS` and `RUNNER_AUDIO_EFFECTS`, with title, creator, `Original project-generated audio`, and the generation script path. State that the files use no third-party recordings or samples. Do not show empty source/license links or hardcode a second credit list.
  - Extend `MainMenuProps` with `audioPreferences`, `onAudioPreferencesChange`, and `onUnlockAudio`; add `음향 설정` and `음원 크레딧` buttons and render the controlled dialogs. Call `onUnlockAudio` inside the first user-initiated audio control/action.
  - Extend `PauseOverlay` with `onOpenAudioSettings(): void`; the settings action opens a dialog while the game remains paused. Closing settings returns to the pause overlay, not the running scene.
  - Extend `RunScreenProps` with the preference props. Preserve a local `settingsOpen` state and render the settings dialog above the pause overlay. Only the existing resume control resumes the scene.
  - Keep the controls usable in narrow landscape layouts and at desktop widths; no clipping or modal overflow.

### I02. Connect app screens to the background-music context

- Related Files:
  - `src/App.tsx` :: `App`, `AppScreen` — load preference state, unlock on first trusted input, select menu/run context; modify
  - `src/app/screens/RunScreen.tsx` :: `handleEvent`, `pauseRun`, resume callback — pause/resume music and follow biome snapshots; modify
  - `src/app/screens/MainMenu.test.tsx` :: menu settings/credits action tests; new
  - `src/App.test.tsx` :: preferences and route/context behavior; modify
- Details:
  - Initialize React audio preferences from `loadAudioPreferences(window.localStorage)` with safe fallback; persist each change with `saveAudioPreferences` and call `browserRunnerAudio.setPreferences`.
  - On initial app mount, set the audio context to `{ kind: 'menu' }`. Register one document-level `pointerdown` listener with capture and a keyboard fallback for the first audio-unlock gesture; invoke `browserRunnerAudio.unlock()` synchronously from that event and remove listeners once unlocked/unmounted.
  - Whenever `AppScreen` is `menu`, `character-select`, `rankings`, or `result`, select `{ kind: 'menu' }`. `RunScreen` selects `{ kind: 'run', biomeId }` on its initial countdown snapshot and when running snapshots cross a biome boundary.
  - When the run pauses, call `setPaused(true)`; when resumed, call `setPaused(false)`. On run completion/exit, transition to menu context, which supplies menu music on result/menu. Do not create a second audio manager per render.
  - Add a delegated primary-button click cue at app scope that ignores disabled buttons and any button inside `.runner-stage` (touch controls must not play an extra UI-click on top of jump/slide effects). Do not attach a global keyboard sound.
  - Tests mock `browserRunnerAudio`; verify settings persistence, first-gesture unlock, menu music in all non-run screens, run biome routing, pause/resume calls, and no UI click cue for touch controls.

## Acceptance Criteria

- [ ] Settings open from both main menu and pause; pause remains in place while settings are open.
- [ ] Credits list every catalog asset's original-project provenance and regeneration script from the shared manifest.
- [ ] First user gesture unlocks playback; all non-run screens use menu music and the run follows biome music.
- [ ] Pause fades and resumes the same run track; results transition back to menu music.
- [ ] Mobile landscape and desktop controls remain readable and keyboard accessible.

## Validation

- `npm run test -- src/app/components/AudioSettingsDialog.test.tsx src/app/components/AudioCreditsDialog.test.tsx src/app/screens/MainMenu.test.tsx src/App.test.tsx` — UI and app routing tests pass.
- `npm run typecheck` — component contracts and audio context routing compile.
- Manual browser check — click/touch once to unlock; open/close settings from menu and pause; navigate menu → selection → run → pause → resume → result → ranking and confirm the expected music context.

## Commit Message

```text
feat(audio): add settings credits and screen music routing

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T04-settings-and-music-routing

- Add persistent audio settings and catalog-driven credits dialogs
- Route menu, run, biome, pause, and result music contexts
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
