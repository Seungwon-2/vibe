# Task: T02 Generate Effects and Catalog

## Status: done

## Goal

Generate the ten original sound effects from local synthesis data and publish a typed effects catalog and credit record. Background music is deferred until the user provides a preferred audio reference.

## Decision Summary

- Generate effects offline with the same built-in-only renderer as T01; do not bundle external recordings, samples, or soundfonts.
- Keep the generator deterministic and the output local. Identify assets as original Project02-generated audio in repository and in-app credits.

## Implementation

### I01. Generate the confirmed effect set

- Related Files:
  - `scripts/audio/runnerEffectData.mjs` :: `RUNNER_EFFECTS`, `EffectDefinition` — deterministic tone/noise/envelope parameters; new
  - `scripts/audio/audioRenderer.mjs` :: `renderEffectToPcm` — shared waveform and WAV encoder; modify
  - `scripts/generate-runner-effects.mjs` :: `generateRunnerEffects`, `main` — outputs or checks all effects; new
  - `public/audio/sfx/jump.wav` — short upward piano-like jump cue; generated
  - `public/audio/sfx/double-jump.wav` — distinct rising double-jump cue; generated
  - `public/audio/sfx/slide.wav` — soft short slide cue; generated
  - `public/audio/sfx/coin.wav` — bell-like coin cue whose pitch can be varied by playback rate; generated
  - `public/audio/sfx/time-pickup.wav` — ascending time pickup cue; generated
  - `public/audio/sfx/gate.wav` — fuller multi-note gate fanfare; generated
  - `public/audio/sfx/hit.wav` — gentle, non-startling hit cue; generated
  - `public/audio/sfx/fall.wav` — gentle, non-startling fall cue; generated
  - `public/audio/sfx/hiyori-defense.wav` — warm protective cue with pink-flame identity; generated
  - `public/audio/sfx/ui-click.wav` — soft primary-button cue; generated
  - `scripts/audio/runnerEffectData.test.mjs` — effect definitions and generated WAV checks; new
  - `package.json` :: `scripts` — add `audio:effects:generate` and `audio:effects:check`; modify
- Details:
  - Define `EffectDefinition` as `{ id: string; durationMs: number; notes: readonly NoteEvent[]; noiseMix: number; seed: number }`; keep duration between 80ms and 1,400ms, except the gate fanfare may be up to 2,200ms.
  - Export `RUNNER_EFFECTS` keyed by exactly `jump`, `double-jump`, `slide`, `coin`, `time-pickup`, `gate`, `hit`, `fall`, `hiyori-defense`, and `ui-click`.
  - Export `renderEffectToPcm(effect: EffectDefinition, sampleRate?: number): Float32Array`; use the shared piano-like note renderer plus deterministically seeded noise for soft impacts/slide texture. Do not use unseeded randomness.
  - Keep hit and fall low in loudness and short in duration; avoid harsh transients. Use a rising interval for time pickup and a fuller cadence for gate. Coin source remains a single clear cue; T03 may vary its playback rate for consecutive pickups.
  - Write the same 32 kHz mono PCM16 WAV format as the music. Add `npm run audio:effects:generate` and `npm run audio:effects:check`; `--check` must not overwrite files.

### I02. Create effects playback metadata and credits

- Related Files:
  - `src/audio/audioCatalog.ts` :: `RUNNER_AUDIO_EFFECTS`, `AudioCredit`, `AudioEffectId` :: typed browser effects manifest; new
  - `src/audio/audioCatalog.test.ts` :: effect catalog and output file tests; new
  - `public/audio/CREDITS.md` :: sound effect provenance and regeneration instructions; new
- Details:
  - Define `AudioEffectId` as `'jump' | 'double-jump' | 'slide' | 'coin' | 'time-pickup' | 'gate' | 'hit' | 'fall' | 'hiyori-defense' | 'ui-click'`.
  - Define `AudioCredit` as `{ id: AudioEffectId; title: string; creator: 'Project02'; sourceUrl: null; licenseName: 'Original project-generated audio'; licenseUrl: null; generationScript: string }`.
  - Export `RUNNER_AUDIO_EFFECTS: Readonly<Record<AudioEffectId, Readonly<{ src: string; credit: AudioCredit }>>>`; `src` values are root-relative URLs such as `'/audio/sfx/jump.wav'`.
  - `CREDITS.md` identifies the ten effects as original repository-generated sounds and names `scripts/generate-runner-effects.mjs`; do not include or credit the deferred music drafts.
  - Catalog test asserts ten effect ids, all ten files exist in `public/`, each WAV has the declared PCM format, and each record has creator/title/license/generation script.
## Acceptance Criteria

- [x] All ten SFX WAV files exist and pass format/duration/clipping checks.
- [x] SFX definitions and file bytes are deterministic.
- [x] Effects catalog and `CREDITS.md` identify all ten SFX as generated Project02 audio and point to the effects generator script.
- [x] Browser playback catalog contains no remote URLs or missing asset paths.

## Validation

- `node --test scripts/audio/runnerEffectData.test.mjs` — sound effect generation checks pass.
- `npm run audio:effects:generate` and `npm run audio:effects:check` — deterministic output exists and checks do not modify files.
- `npm run test -- src/audio/audioCatalog.test.ts` — catalog and local asset checks pass.

## Commit Message

```text
feat(audio): generate effects and catalog local audio

Plan: 2026-10-29-runner-audio
Phase: P01-runner-audio
Task: T02-effects-and-catalog

- Generate ten short gameplay and interface effects offline
- Add shared typed catalog and provenance credits for all audio files
```

## Progress

- [x] Implementation complete
- [x] Validation passed: node tests (3/3), effects check, catalog tests (2/2), and typecheck.
- commit: pending
