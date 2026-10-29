# Task: T03 Audio Controller

## Status: in_progress

## Goal

Create an effects-first browser-audio controller that stores player preferences, unlocks playback after a user gesture, and plays local SFX safely. Defer background music routing and fades until the user provides a preferred reference audio file.

## Decision Summary

- Use local URLs from T02's catalog and browser `HTMLAudioElement` playback; no remote streaming or new audio dependency.
- Keep playback logic outside React and Phaser so screen routing, pause/resume, and tests share one controller.

## Implementation

### I01. Add validated, persistent preferences

- Related Files:
  - `src/audio/audioPreferences.ts` :: `AudioPreferences`, `DEFAULT_AUDIO_PREFERENCES`, `loadAudioPreferences`, `saveAudioPreferences` — browser preference schema; new
  - `src/audio/audioPreferences.test.ts` :: preference validation and storage tests; new
- Details:
  - Define `AudioPreferences` as `{ muted: boolean; musicVolume: number; effectsVolume: number }`, with both volume values clamped to `[0, 1]`.
  - Define `DEFAULT_AUDIO_PREFERENCES` as `{ muted: false, musicVolume: 0.6, effectsVolume: 0.8 }`.
  - Use storage key `'runner-audio:preferences:v1'`.
  - Export `loadAudioPreferences(storage: Pick<Storage, 'getItem'>): AudioPreferences` and `saveAudioPreferences(preferences: AudioPreferences, storage: Pick<Storage, 'setItem'>): void`.
  - Missing, malformed, inaccessible, or invalid stored data must fall back to defaults; invalid numeric values clamp to the valid range, and non-boolean `muted` is ignored in favor of the default.
  - Keep storage injectable so Vitest tests do not depend on global browser state.

### I02. Implement effect playback and browser gesture unlock

- Related Files:
  - `src/audio/RunnerAudioManager.ts` :: `RunnerAudioManager`, `browserRunnerAudio` :: singleton effect playback coordinator; new
  - `src/audio/RunnerAudioManager.test.ts` :: playback and failure tests; new
- Details:
  - Export `RunnerAudioManager` with constructor injection for an audio factory so tests can use fake audio elements; production uses `new Audio(src)`.
  - Implement `unlock(): void`, `setPreferences(preferences: AudioPreferences): void`, `playEffect(id: AudioEffectId, options?: { playbackRate?: number }): void`, and `dispose(): void`.
  - Before unlock, do not start playback. `unlock()` is called synchronously from a trusted click/touch handler; catch rejected `play()` promises.
  - Effects use the effective effects volume. For consecutive coin pickups, raise playback rate in a small bounded sequence and reset after a short pickup gap. Clamp any supplied playback rate to a safe range.
  - Mute immediately silences current and future effect playback while preserving the selected volume.
  - A failed asset load or rejected playback is a non-fatal silent fallback. Dispose audio elements on teardown.
  - Do not create music elements or perform track routing/fades in this task; music remains deferred pending the user's reference audio.
  - Unit tests cover unlock-before-play, local catalog lookup, volume/mute, coin pitch bounds/reset, invalid ids, and rejected playback that does not throw.
## Acceptance Criteria

- [ ] Audio preferences follow the confirmed defaults and persist under the versioned key.
- [ ] Effects play only after a user gesture and use local catalog assets.
- [ ] Mute and effects volume affect current and future effects.
- [ ] Coin pitch changes remain bounded and reset after a pickup gap.
- [ ] Playback failures never interrupt gameplay.
- [ ] No background music asset is loaded while music remains deferred.

## Validation

- `npm run test -- src/audio/audioPreferences.test.ts src/audio/RunnerAudioManager.test.ts` — preference and controller tests pass.
- `npm run typecheck` — browser and injected audio types compile.

## Commit Message

```text
feat(audio): add persistent audio controller

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T03-audio-controller

- Add validated browser audio preferences with safe defaults
- Add local sound-effect playback, mute, and safe coin pitch variation
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
