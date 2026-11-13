# Task: T01 Audio Start and Levels

## Status: in_progress

## Goal
Make background music reliably begin after the player's explicit start action, respect browser autoplay policy, and reduce first-run and low-slider playback levels.

## Decision Summary
- Audio starts or resumes only from a legitimate user gesture when browser policy requires it.
- Preferences remain adjustable and persisted in the current browser.
- New defaults affect first-time users without overwriting saved preferences.
- The slider uses a quadratic gain curve so low displayed values produce quieter output.

## Implementation

### I01. Lower defaults and connect audio unlock to the start gesture
- Related files:
  - `src/audio/audioPreferences.ts` :: defaults and slider-to-gain conversion
  - `src/audio/RunnerMusicManager.ts` and `RunnerAudioManager.ts` :: apply media gain
  - `src/App.tsx` :: unlock audio from title start and run start user gestures
  - audio manager/preferences tests
- Details:
  - Unlock audio synchronously from the explicit title/run action before asynchronous navigation.
  - Handle rejected playback without unhandled promise rejections; a later user gesture retries it.
  - Use 20% initial music/effect slider values. Map a displayed slider value `v` to media gain `v * v`; for example, 10% becomes 1% output gain.
  - Preserve existing saved slider values; apply the quieter curve when playing them.
  - Prevent overlapping play requests and preserve pause/resume and mute behavior.

## Acceptance Criteria
- [ ] On a fresh browser profile, activating the normal game-start action begins or unlocks the expected track where browser policy permits.
- [ ] Browser playback rejection is handled gracefully and does not block gameplay.
- [ ] New default levels are comfortable and a 10% slider setting maps to 1% media gain.
- [ ] Previously saved slider settings remain saved, with the new quieter gain mapping.
- [ ] Pause, resume, mute, and volume slider behavior remain correct in both modes.

## Validation
- `npm run test -- --run src/audio`
- Manual playback test in Chromium and one additional supported browser, including fresh-profile and saved-preference cases.
- `npm run typecheck`

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
- [x] Audio unlock and retry behavior implemented.
- [x] First-run slider defaults set to music 20% / effects 20%; the quadratic mapping makes 10% slider output 1% media gain.
- [x] Automated validation passed: `npm run test -- --run src/audio` (18 tests), `npm run typecheck`.
- [ ] Manually confirm playback and comfortable loudness in Chromium and one additional browser. Local preview: `http://127.0.0.1:5176/`.
- commits: `6a7a012` (unlock/retry), `ea1b65c` (perceptual volume scaling)