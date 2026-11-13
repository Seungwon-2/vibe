# Task: T01 Audio Start and Levels

## Status: in_progress

## Goal
Make background music reliably begin after the player's explicit start action, respect browser autoplay policy, and reduce first-run and low-slider playback levels.

## Decision Summary
- Audio starts or resumes only from a legitimate user gesture when browser policy requires it.
- Preferences remain adjustable and persisted in the current browser.
- New defaults place music and effects sliders at 50%, while media output is capped at 2% gain.
- The slider is linear within that quiet range, so 50% produces 1% media gain, matching the former 10% setting.

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
  - Use 50% initial music/effect slider values. Map a displayed slider value `v` to media gain `v * 0.02`; for example, 50% becomes 1% output gain and 100% is capped at 2%.
  - Migrate saved v1 settings from the former quadratic mapping into the new 0–2% range so old 10% settings become 50%; cap old settings that exceed the new maximum.
  - Prevent overlapping play requests and preserve pause/resume and mute behavior.

## Acceptance Criteria
- [ ] On a fresh browser profile, activating the normal game-start action begins or unlocks the expected track where browser policy permits.
- [ ] Browser playback rejection is handled gracefully and does not block gameplay.
- [ ] New slider defaults are 50%, and a 50% slider setting maps to 1% media gain.
- [ ] Previously saved v1 slider settings retain their effective output where it fits the new 2% maximum; louder legacy values are capped.
- [ ] Pause, resume, mute, and volume slider behavior remain correct in both modes.

## Validation
- `npm run test -- --run src/audio`
- Manual playback test in Chromium and one additional supported browser, including fresh-profile and saved-preference cases.
- `npm run typecheck`

## Commit Message
```text
fix(audio): recenter sliders on quieter output range

Plan: 2026-11-12-runner-feedback-recovery
Phase: P03-runtime-and-release-check
Task: T01-audio-start-and-levels

- Cap media output at 2% while setting first-run sliders to 50%
- Migrate saved v1 values so former 10% settings become 50%
```

## Progress
- [x] Audio unlock and retry behavior implemented.
- [x] First-run slider defaults set to music 50% / effects 50%; 50% now maps to 1% media gain, matching the former 10% setting.
- [x] Legacy v1 slider values migrate to preserve their old quadratic output where possible, within the new 2% maximum.
- [x] Automated validation passed: `npm run test -- --run src/audio` (19 tests), `npm run typecheck`.
- [ ] Manually confirm playback and comfortable loudness in Chromium and one additional browser. Local preview: `http://127.0.0.1:5176/`.
- commits: `6a7a012` (unlock/retry), `ea1b65c` (perceptual volume scaling), `eae5700` (recenter slider range)
