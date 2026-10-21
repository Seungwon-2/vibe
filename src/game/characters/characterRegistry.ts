import { CHARACTER_ANIMATION_NAMES } from './characterTypes';
import type { CharacterDefinition } from './characterTypes';

const characters = new Map<string, CharacterDefinition>();

export function registerCharacter(definition: CharacterDefinition): void {
  if (!definition.id.trim()) {
    throw new Error('Character id must not be empty.');
  }
  if (!definition.displayName.trim()) {
    throw new Error(`Character "${definition.id}" must have a display name.`);
  }
  if (!definition.textureKey.trim()) {
    throw new Error(`Character "${definition.id}" must have a texture key.`);
  }
  if (characters.has(definition.id)) {
    throw new Error(`Character "${definition.id}" is already registered.`);
  }
  if (!Number.isInteger(definition.frameWidth) || definition.frameWidth <= 0 ||
      !Number.isInteger(definition.frameHeight) || definition.frameHeight <= 0) {
    throw new Error(`Character "${definition.id}" must use positive integer frame dimensions.`);
  }
  if (definition.stats.walkSpeed <= 0 || definition.stats.runSpeed < definition.stats.walkSpeed ||
      definition.stats.jumpVelocity >= 0) {
    throw new Error(`Character "${definition.id}" has invalid movement stats.`);
  }

  for (const animationName of CHARACTER_ANIMATION_NAMES) {
    if (!Array.isArray(definition.animations[animationName]) ||
        definition.animations[animationName].length === 0 ||
        definition.animations[animationName].some((frame) => !frame.trim())) {
      throw new Error(`Character "${definition.id}" is missing frames for "${animationName}".`);
    }
  }

  characters.set(definition.id, structuredClone(definition));
}

export function getCharacterDefinition(id: string): CharacterDefinition {
  const definition = characters.get(id);
  if (!definition) {
    throw new Error(`Unknown playable character "${id}".`);
  }
  return definition;
}
