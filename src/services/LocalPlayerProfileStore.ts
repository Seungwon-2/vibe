import { CHARACTERS } from '../game/characters/characterCatalog';
import type { CharacterId } from '../game/characters/characterTypes';
import { STORY_STAGES } from '../game/runner/storyConfig';
import type { StoryStageId } from '../game/runner/runnerTypes';
import type { PlayerProfile, PlayerProfileStore } from './PlayerProfile';

export const PLAYER_PROFILE_STORAGE_KEY = 'running-action:profile:v1';
const MAX_PROCESSED_RUN_IDS = 1_000;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
type ProfileSnapshot = Readonly<{ version: 1; profile: PlayerProfile }>;

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = Object.freeze({
  version: 1,
  walletCoins: 0,
  unlockedCharacterIds: Object.freeze(['player-default'] as CharacterId[]),
  unlockedStageIds: Object.freeze(['dawn-city'] as StoryStageId[]),
  clearedStageIds: Object.freeze([] as StoryStageId[]),
  completedChallengeKeys: Object.freeze([] as string[]),
  achievementProgress: Object.freeze({}),
  unlockedAchievementIds: Object.freeze([] as string[]),
  unlockedCosmeticIds: Object.freeze([] as string[]),
  equippedCosmeticIdsByCharacter: Object.freeze({}),
  processedRunIds: Object.freeze([] as string[]),
  claimedRewardKeys: Object.freeze([] as string[]),
});

const CHARACTER_IDS = new Set<string>(CHARACTERS.map((character) => character.id));
const STAGE_IDS = new Set<string>(STORY_STAGES.map((stage) => stage.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUniqueStringArray(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === 'string' && item.length > 0) &&
    new Set(value).size === value.length;
}

function isValidProfile(value: unknown): value is PlayerProfile {
  if (!isRecord(value) || value.version !== 1 ||
      !Number.isSafeInteger(value.walletCoins) || (value.walletCoins as number) < 0 ||
      !isUniqueStringArray(value.unlockedCharacterIds) ||
      !isUniqueStringArray(value.unlockedStageIds) ||
      !isUniqueStringArray(value.clearedStageIds) ||
      !isUniqueStringArray(value.completedChallengeKeys) ||
      !isUniqueStringArray(value.unlockedAchievementIds) ||
      !isUniqueStringArray(value.unlockedCosmeticIds) ||
      !isUniqueStringArray(value.processedRunIds) ||
      !isUniqueStringArray(value.claimedRewardKeys) ||
      !isRecord(value.achievementProgress) ||
      !isRecord(value.equippedCosmeticIdsByCharacter)) return false;

  if (!value.unlockedCharacterIds.every((id) => CHARACTER_IDS.has(id)) ||
      !value.unlockedStageIds.every((id) => STAGE_IDS.has(id)) ||
      !value.clearedStageIds.every((id) => STAGE_IDS.has(id))) return false;

  if (!Object.values(value.achievementProgress).every((progress) =>
    Number.isSafeInteger(progress) && (progress as number) >= 0)) return false;

  return Object.entries(value.equippedCosmeticIdsByCharacter).every(([characterId, cosmetics]) =>
    CHARACTER_IDS.has(characterId) && isUniqueStringArray(cosmetics));
}

function parseProfile(raw: string): PlayerProfile {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== 1 || !isValidProfile(parsed.profile)) {
    throw new TypeError('Invalid local player profile snapshot');
  }
  return parsed.profile;
}

function cloneProfile(profile: PlayerProfile): PlayerProfile {
  return {
    ...profile,
    unlockedCharacterIds: [...profile.unlockedCharacterIds],
    unlockedStageIds: [...profile.unlockedStageIds],
    clearedStageIds: [...profile.clearedStageIds],
    completedChallengeKeys: [...profile.completedChallengeKeys],
    achievementProgress: { ...profile.achievementProgress },
    unlockedAchievementIds: [...profile.unlockedAchievementIds],
    unlockedCosmeticIds: [...profile.unlockedCosmeticIds],
    equippedCosmeticIdsByCharacter: Object.fromEntries(Object.entries(profile.equippedCosmeticIdsByCharacter)
      .map(([characterId, ids]) => [characterId, [...ids]])),
    processedRunIds: [...profile.processedRunIds],
    claimedRewardKeys: [...profile.claimedRewardKeys],
  };
}

export class LocalPlayerProfileStore implements PlayerProfileStore {
  private profile: PlayerProfile = cloneProfile(DEFAULT_PLAYER_PROFILE);
  private loaded = false;

  constructor(private readonly storage?: StorageLike | null) {}

  load(): PlayerProfile {
    if (this.loaded) return cloneProfile(this.profile);
    this.loaded = true;
    try {
      const raw = this.getStorage()?.getItem(PLAYER_PROFILE_STORAGE_KEY);
      if (raw) this.profile = cloneProfile(parseProfile(raw));
    } catch {
      this.profile = cloneProfile(DEFAULT_PLAYER_PROFILE);
    }
    return cloneProfile(this.profile);
  }

  save(profile: PlayerProfile): void {
    if (!isValidProfile(profile)) throw new TypeError('Invalid player profile');
    this.profile = cloneProfile(profile);
    this.loaded = true;
    this.persist();
  }

  update(mutator: (current: PlayerProfile) => PlayerProfile): PlayerProfile {
    const next = mutator(this.load());
    if (!isValidProfile(next)) throw new TypeError('Profile update returned invalid state');
    this.profile = cloneProfile(next);
    this.loaded = true;
    this.persist();
    return cloneProfile(this.profile);
  }

  settleRunCoins(runId: string, amount: number): boolean {
    if (!runId || !Number.isSafeInteger(amount) || amount < 0) {
      throw new TypeError('Invalid run coin settlement');
    }
    const current = this.load();
    if (current.processedRunIds.includes(runId)) return false;
    this.update((profile) => ({
      ...profile,
      walletCoins: profile.walletCoins + amount,
      processedRunIds: [...profile.processedRunIds, runId].slice(-MAX_PROCESSED_RUN_IDS),
    }));
    return true;
  }

  claimReward(rewardKey: string, mutator: (current: PlayerProfile) => PlayerProfile): boolean {
    if (!rewardKey) throw new TypeError('Reward key is required');
    const current = this.load();
    if (current.claimedRewardKeys.includes(rewardKey)) return false;
    this.update((profile) => {
      const updated = mutator(profile);
      return { ...updated, claimedRewardKeys: [...updated.claimedRewardKeys, rewardKey] };
    });
    return true;
  }

  private persist(): void {
    try {
      this.getStorage()?.setItem(PLAYER_PROFILE_STORAGE_KEY,
        JSON.stringify({ version: 1, profile: this.profile } satisfies ProfileSnapshot));
    } catch {
      // Keep this tab's in-memory profile usable when storage is restricted or full.
    }
  }

  private getStorage(): StorageLike | null {
    if (this.storage !== undefined) return this.storage;
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch {
      return null;
    }
  }
}

export const browserPlayerProfileStore: PlayerProfileStore = new LocalPlayerProfileStore();
