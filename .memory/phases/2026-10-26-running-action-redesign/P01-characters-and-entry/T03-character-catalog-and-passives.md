# Task: T03 Character Catalog and Passives

## Status: done

## Goal

Create a data-driven runner character catalog and centralized tunable passive definitions for the four playable characters.

## Decision Summary

- Keep stable IDs and accent colors: `player-default` / `#2b66c0`, `goth-student` / `#513661`, `moonwing` / `#857fd8`, `akane-lize` / `#971b2f`.
- All passive values are centrally configured and adjustable without changing the runner systems. No player-facing stat controls; one shared ranking remains.

## Implementation

### I01. Define runner character types and catalog

- Related Files:
  - `src/game/characters/characterTypes.ts` :: `CharacterId`, `CharacterAnimationName`, `CharacterDefinition`; new.
  - `src/game/characters/characterCatalog.ts` :: `CHARACTERS`, `getCharacter`, `resolveCharacterId`; new.
  - `src/game/characters/characterAtlases.ts` :: static imports of the four runtime PNGs/JSON manifests; new.
  - `src/game/characters/characterRegistry.test.ts` :: catalog and manifest validation tests; new.

#### Details

- Define `CharacterId = 'player-default' | 'goth-student' | 'moonwing' | 'akane-lize'`.
- Define `CharacterAnimationName = 'idle' | 'run' | 'jump' | 'doubleJump' | 'slide' | 'hurt' | 'start' | 'victory' | 'gameOver'`.
- Define `RuntimeAtlasFrame = { frame: { x: number; y: number; w: number; h: number }; rotated: false; trimmed: false; spriteSourceSize: { x: number; y: number; w: number; h: number }; sourceSize: { w: number; h: number } }` and `RuntimeAtlasManifest = { frames: Record<string, RuntimeAtlasFrame>; meta: { image: string; size: { w: number; h: number }; scale: '1' } }`.
- `CharacterDefinition` fields: `id: CharacterId`, `displayName: string`, `accentColor: string`, `portraitUrl: string`, `textureKey: string`, `atlasUrl: string`, `atlasManifest: RuntimeAtlasManifest`, `frameWidth: 96`, `frameHeight: 96`, `animations: Record<CharacterAnimationName, readonly string[]>`, `passive: CharacterPassiveId`.
- Populate definitions in this order: Aokumo Rin, Shizuki Toa, Ayatsuno Yuni, Akane Lize. Use names and accent colors exactly as listed above. Keep movement stats out of the per-character record; base movement tuning belongs to the runner config.
- `getCharacter(id)` returns a definition or throws `Unknown character: ${id}`. `resolveCharacterId(value)` returns the ID if valid, otherwise `player-default`.
- Validate unique IDs, non-empty animation frame lists, manifest frame references, 96x96 frame declarations, and six-digit hex accent colors.

### I02. Centralize passive configuration

- Related Files:
  - `src/game/characters/characterAbilities.ts` :: `CharacterPassiveId`, `CharacterPassiveDefinition`, `CHARACTER_PASSIVES`, `getCharacterPassive`; new.
  - `src/game/characters/characterRegistry.test.ts` :: exact passive values and character/passive links; modify.

#### Details

- Define the discriminated union:
  - `{ id: 'time-pickup'; bonusMs: number }`
  - `{ id: 'slide-release-grace'; graceMs: number }`
  - `{ id: 'double-jump-impulse'; multiplier: number }`
  - `{ id: 'collision-penalty-reduction'; reductionMs: number }`
- Initial mapping: Rin `bonusMs: 1000`; Toa `graceMs: 150`; Yuni `multiplier: 1.12`; Lize `reductionMs: 1000`.
- Base rules remain in the runner config: time pickup 3000ms, collision penalty 5000ms, stagger/protection 800ms. The character modifier must only adjust its matching base rule; it must not alter other characters or global settings.
- `getCharacterPassive(characterId)` returns an immutable config. No component may edit passive values at runtime.

## Acceptance Criteria

- [x] All four existing characters load through one typed catalog with correct ID, name, color, atlas, and portrait.
- [x] Every required animation key resolves to atlas frames for all characters.
- [x] Passive values are located in one configuration module and are editable in one place.
- [x] No per-character base speed or player-facing ability slider is introduced.

## Validation

- `npm test -- src/game/characters/characterRegistry.test.ts` ??validates catalog completeness and passive mapping.
- `npm run typecheck` ??validates the typed catalog and Phaser manifest imports.

## Commit Message

```text
feat(characters): add runner catalog and tunable passives

Plan: 2026-10-26-running-action-redesign
Phase: P01-characters-and-entry
Task: T03-character-catalog-and-passives

- Preserve the four stable character identities and colors
- Centralize balanced passive values for runner systems
```

## Progress

- [x] Implementation complete
- [x] Validation passed (`npm test -- src/game/characters/characterRegistry.test.ts`; `npm run typecheck`)
- commit: ac69379
