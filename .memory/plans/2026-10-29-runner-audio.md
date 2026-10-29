# Plan: Runner Audio

## Goal

Add an offline-capable audio system to the current React + Phaser runner. Generate ten sound effects first; defer background music until the user provides a preferred reference audio file. Later add persistent mute/music/effects controls and in-app audio credits. Audio must remain optional at runtime: a blocked or missing audio file must not prevent a run.

## Confirmed Decisions

- Music: one menu track plus four biome tracks; cheerful fairytale mood led by piano, with each biome's accompaniment and mood distinct. Pokémon Diamond/Pearl road music, including Route 209, is a high-level style reference for adventurous road-game energy and memorable melodies; compose original melodies and arrangements.
- Assets: original project-generated audio, stored locally in the repository as deterministic WAV outputs. Music loops are around 1–2 minutes. Do not use third-party recordings, melodies, soundfonts, or samples in the generated files.
- Context: menu music on menu, character selection, ranking, and result; biome music during the run. Unlock playback after a user gesture. Fade screen/biome changes over 700ms.
- Pause/result: fade music out on pause and resume the same track at the same playback position. On run completion, transition to menu music.
- Effects: jump, double jump, slide, coin, +3-second pickup, +20-second gate, hit, fall, Hiyori defense, and primary UI button. Consecutive coins rise in chime pitch; time pickup rises; gate uses a fuller fanfare; hit/fall remain gentle.
- Controls: audio enabled by default; music 60%, effects 80%; mute and separate volume sliders available from main menu and pause; persist in this browser.
- Credits: add an `음원 크레딧` entry to the main menu and retain asset source and license records in the repository.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Generate original offline music/effects, add audio playback/preferences, connect screen and gameplay cues | [P01 Runner Audio](../phases/2026-10-29-runner-audio/P01-runner-audio/phase.md) |

## Scope Notes

- This plan does not add Azure or Entra ID work.
- Generate original compositions and piano-like timbre locally with deterministic Node scripts. The Route 209 / Diamond-Pearl road music reference is mood guidance only; do not copy melodies, harmony, arrangements, or recordings.
- Repository and in-app credits identify these as original project-generated assets and name the regeneration scripts. Do not add an external soundfont or sample to make the piano more realistic without recording and reviewing its license in a separately approved change.
- Audio failure is non-fatal. The game remains playable in silence, and users can mute sound at any time.
- Background music generation/integration is deferred until the user provides a preferred reference audio file. The current generated music drafts are unapproved and excluded from the effects catalog.
