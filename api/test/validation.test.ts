import { describe, expect, it } from 'vitest';
import { validateRunSubmission, validateProfileUpdate } from '../src/shared/validation.js';
import { createDefaultProfile } from '../src/domain/profileDefaults.js';

const validRun = {
  runId: '01234567-89ab-cdef-0123-456789abcdef', characterId: 'player-default', mode: 'endless', storyStageId: null,
  distanceMeters: 2500, coins: 24, durationMs: 30_000, finishedAtIso: '2026-11-09T12:00:00.000Z',
  finishReason: 'timeout', hitsTaken: 0, passedGateCount: 1, completedStage: false,
};

describe('API payload validation', () => {
  it('accepts a well-formed endless run', () => expect(validateRunSubmission(validRun)).toEqual(validRun));
  it.each([
    { ...validRun, playerId: 'spoofed-player' },
    { ...validRun, finishedAtIso: '2026-11-09T12:00:00Z' },
    { ...validRun, finishedAtIso: '2026-02-31T12:00:00.000Z' },
    { ...validRun, mode: 'endless', storyStageId: 'dawn-city' },
    { ...validRun, mode: 'story', storyStageId: null },
    { ...validRun, mode: 'endless', completedStage: true },
    { ...validRun, distanceMeters: 100_000, durationMs: 1000 },
  ])('rejects unexpected or implausible run data', (run) => expect(() => validateRunSubmission(run)).toThrow());
  it('only equips owned cosmetics and preserves other characters equipment', () => {
    const profile = { ...createDefaultProfile(), unlockedCosmeticIds: ['trail-a'],
      equippedCosmeticIdsByCharacter: { 'player-default': ['trail-a'] } };
    const updated = validateProfileUpdate({ equippedCosmeticIdsByCharacter: { 'tokino-mary': ['trail-a'] } }, profile);
    expect(updated.equippedCosmeticIdsByCharacter).toEqual({
      'player-default': ['trail-a'], 'tokino-mary': ['trail-a'],
    });
    expect(() => validateProfileUpdate({ walletCoins: 9999 }, profile)).toThrow();
    expect(() => validateProfileUpdate({ equippedCosmeticIdsByCharacter: { 'tokino-mary': ['not-owned'] } }, profile)).toThrow();
  });
});
