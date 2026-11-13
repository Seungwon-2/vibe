# Task: T01 Audio Start and Levels

## Status: in_progress

## Goal
Make background music reliably begin after the player's explicit start action, respect browser autoplay policy, and reduce the out-of-box music/effect levels to comfortable values.

## Decision Summary
- Audio starts/resumes only in response to a legitimate user gesture if the browser requires it; no autoplay-policy workaround.
- Preferences remain adjustable and persisted in the current browser.
- Default level changes must affect first-time users without overwriting previously saved preferences.

## Implementation

### I01. Lower defaults and connect audio unlock to the start gesture
- Related Files:
  - `src/audio/audioPreferences.ts` :: `DEFAULT_AUDIO_PREFERENCES`; modify
  - `src/audio/RunnerMusicManager.ts` and `RunnerAudioManager.ts` :: start/resume and volume application; modify
  - `src/app/screens/MainMenu.tsx`, `ModeSelect.tsx`, and `CharacterSelect.tsx` :: start flow gesture; modify only where the gesture is lost
  - `src/app/components/AudioSettingsDialog.tsx` :: preference sliders and status; modify if needed
  - audio manager/preferences tests; modify/add
- Details
  - Identify the first explicit click/keyboard activation in the title-to-run flow. Call the audio unlock/resume path synchronously from that event before asynchronous navigation, then select the appropriate biome track when the run starts.
  - Handle rejected `play()`/resume promises without unhandled rejection. Expose a small ?œsound is off / tap to enable??state only if playback remains blocked; keep gameplay start available.
  - Lower only defaults for absent/corrupt stored preferences. Set initial music/effect defaults to conservative values selected in the audio settings review; document exact values in code and test. Existing saved settings remain unchanged.
  - Prevent duplicate overlapping music tracks on screen/mode transitions and verify pause/resume and mute behavior.

## Acceptance Criteria
- [ ] On a fresh browser profile, activating the normal game-start action begins or unlocks the expected background track where browser policy permits.
- [ ] Browser rejection is handled gracefully and does not block gameplay.
- [ ] First-run audio is materially quieter; saved user preferences are preserved.
- [ ] Pause, resume, mute, and volume slider behavior remain correct in both modes.

## Validation
- `npm run test -- --run src/audio` ??audio tests pass.
- Manual playback test in Chromium and one additional supported browser, including fresh profile and already-saved preference cases.
- `npm run typecheck` ??passes.

## Commit Message
```text
fix(audio): unlock music on start and lower default levels

Plan: 2026-11-12-runner-feedback-recovery
Phase: P03-runtime-and-release-check
Task: T01-audio-start-and-levels

- Resume music from the game-start user gesture
- Reduce first-run music and effect volume
```

## Progress
- [x] Implementation complete: first-run levels lowered to music 30% / effects 35%; explicit title/run actions unlock audio and rejected playback can retry without duplicate pending play calls.
- [x] Automated validation passed: `npm run test -- --run src/audio` (17 tests), `npm run typecheck`.
- [ ] Manual playback validation in Chromium and a second browser. Browser automation host is unavailable in this session; local preview is running at `http://127.0.0.1:5175/`.
- commit: a6008f6
