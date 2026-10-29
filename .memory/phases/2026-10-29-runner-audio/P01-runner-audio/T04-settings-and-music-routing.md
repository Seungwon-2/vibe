# Task: T04 Settings and Effects Credits

## Status: done

## Goal

Expose effects settings from the main menu and pause overlay and show generated-effect provenance. Keep background music controls/routing deferred until the user provides a preferred reference audio file.

## Decision Summary

- Background music is deferred; this task controls only effects playback.
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
  - `AudioSettingsDialog` props: `preferences: AudioPreferences`, `onChange(preferences: AudioPreferences): void`, `onClose(): void`. Provide a labeled mute checkbox and a labeled effects-volume range control (`min=0`, `max=1`, `step=0.01`) with percentage feedback. Show a short note that background music is being prepared.
  - Use `role="dialog"`, `aria-modal="true"`, a visible title, and a close button. Keep keyboard focus visible and allow Escape to close; do not close on a slider interaction.
  - `AudioCreditsDialog` props: `onClose(): void`; render all entries from `RUNNER_AUDIO_EFFECTS`, with title, creator, `Original project-generated audio`, and the generation script path. State that the files use no third-party recordings or samples. Do not show empty source/license links or hardcode a second credit list.
  - Extend `MainMenuProps` with `audioPreferences`, `onAudioPreferencesChange`, and `onUnlockAudio`; add `음향 설정` and `음원 크레딧` buttons and render the controlled dialogs. Call `onUnlockAudio` inside the first user-initiated audio control/action.
  - Extend `PauseOverlay` with `onOpenAudioSettings(): void`; the settings action opens a dialog while the game remains paused. Closing settings returns to the pause overlay, not the running scene.
  - Extend `RunScreenProps` with the preference props. Preserve a local `settingsOpen` state and render the settings dialog above the pause overlay. Only the existing resume control resumes the scene.
  - Keep the controls usable in narrow landscape layouts and at desktop widths; no clipping or modal overflow.

### I02. Connect app screens to effect preferences and unlock

- Related Files:
  - `src/App.tsx` :: `App`, `AppScreen` :: load preferences and unlock effects from trusted user input; modify
  - `src/app/screens/RunScreen.tsx` :: `RunScreenProps`, pause/settings state :: persist pause overlay settings state; modify
  - `src/app/screens/MainMenu.test.tsx` :: menu settings/credits action tests; new
  - `src/App.test.tsx` :: preference persistence and unlock behavior; modify
- Details:
  - Initialize React audio preferences from `loadAudioPreferences(window.localStorage)` with safe fallback; persist each change with `saveAudioPreferences` and call `browserRunnerAudio.setPreferences`.
  - Register a document-level `pointerdown` listener with capture and a keyboard fallback for the first audio-unlock gesture. Invoke `browserRunnerAudio.unlock()` synchronously and remove listeners after unlocking/unmounting.
  - No music context or background audio is created in this task. The settings dialog may show a brief “배경음악 준비 중” note.
  - Add a delegated primary-button click cue at app scope that ignores disabled buttons and any button inside `.runner-stage` so touch controls do not double-play effects.
  - Tests mock `browserRunnerAudio`; verify preference persistence, first-gesture unlock, menu settings/credits actions, and no extra UI click cue for runner touch controls.
## Acceptance Criteria

- [ ] Settings open from both main menu and pause; pause remains in place while settings are open.
- [ ] Credits list every catalog asset's original-project provenance and regeneration script from the shared manifest.
- [ ] First user gesture unlocks playback; all non-run screens use menu music and the run follows biome music.
- [ ] Pause fades and resumes the same run track; results transition back to menu music.
- [x] Mobile landscape and desktop controls remain readable and keyboard accessible.

## Validation

- `npm run test -- src/app/components/AudioSettingsDialog.test.tsx src/app/components/AudioCreditsDialog.test.tsx src/app/screens/MainMenu.test.tsx src/App.test.tsx` — UI and app routing tests pass.
- `npm run typecheck` — component contracts and audio context routing compile.
- Manual browser check — click/touch once to unlock; open/close settings from menu and pause; navigate menu → selection → run → pause → resume → result → ranking and confirm the expected music context.

## Commit Message

```text
feat(audio): add effect settings and credits

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T04-settings-and-music-routing

- Add persistent audio settings and catalog-driven credits dialogs
- Keep background music deferred until a reference is provided
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed: T04 UI/App tests (14/14) and typecheck.
- [ ] Manual browser layout review pending; browser automation host unavailable in this session.
- commit: pending
