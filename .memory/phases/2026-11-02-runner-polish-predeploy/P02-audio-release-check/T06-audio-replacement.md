# Task: T06 Audio Replacement

## Status: done — assets integrated; manual playback check remains

## Goal
Integrate the user's replacement BGM and SFX files without changing sound behavior or attribution policy beyond the provided assets' supplied credits.

## Decision Summary
- The user supplies the replacement audio. Do not generate substitute files.
- Keep existing WAV fallbacks where the supplied pack has no unambiguous event match; add local OGG mappings for the supplied files.

## Implementation

### I01. Replace and validate audio assets
- Related Files:
  - `public/audio/music/title.ogg`, `city.ogg`, `forest.ogg`, `mine.ogg`, `sky.ogg` — title and four course loops.
  - `public/audio/sfx/*.ogg` — supplied one-shot effects, organized by the event names in the supplied README.
  - `src/audio/musicCatalog.ts`, `src/audio/RunnerMusicManager.ts`, `src/audio/audioCatalog.ts`, `src/App.tsx`, and `src/app/screens/RunScreen.tsx` — local BGM selection, playback, and event mappings.
  - `src/app/components/AudioSettingsDialog.tsx` — expose the existing music volume preference.
  - `public/audio/CREDITS.md` — document supplied provenance and reuse limits from the supplied README.

#### Details
- If the user provides a packed archive or directory, map files by the stable basenames listed above. Keep the existing `.wav` extension unless the user provides another supported format and the catalog is intentionally updated.
- Do not overwrite an audio asset unless a supplied file is unambiguously intended as its replacement.
- Validate that every catalog URL resolves, each file decodes, duration is non-zero, and sample rate/channel count are supported by the browser playback path.
- Update `CREDITS.md` with supplied source, author, and license metadata. If the user created the files, record that accurate source; do not invent attribution.
- Preserve mute/volume settings and music/effect separation.

## Acceptance Criteria
- [x] Supplied title and four theme tracks are mapped; matching effects are mapped to gameplay events.
- [ ] Browser playback was not manually auditioned in this session; static OGG signatures and local URLs are validated.
- [x] Credits reflect the supplied README and mark redistribution terms as unverified.
- [x] Existing mute and separate music/effects volume controls are preserved and connected to BGM playback.

## Validation
- `npm test -- src/audio/audioCatalog.test.ts src/audio/RunnerAudioManager.test.ts src/audio/musicCatalog.test.ts src/audio/RunnerMusicManager.test.ts src/app/components/AudioCreditsDialog.test.tsx`
- `npm run typecheck`
- `npm run build`
- Manual local checks: title BGM, each Story biome BGM, jump/slide/pickup/gate/hit/fall/defense, mute and separate volume controls. Still required in a browser.

## Commit Message
```text
chore(audio): replace runner music and effects

Plan: 2026-11-02-runner-polish-predeploy
Phase: P02-audio-release-check
Task: T06-audio-replacement

- Install user-supplied soundtrack and effect files
- Keep audio mappings and attribution aligned with supplied assets
```

## Progress
- [x] User audio files and README found under `public/audio/music/`.
- [x] OGG BGM and effects wired; existing WAV fallback effects retained for gate, time pickup, and fall because the supplied pack has no clear replacements.
- [x] Focused audio tests (11), typecheck, and production build pass.
- Manual browser playback could not be verified in this session.
- commit: recorded in Git history
