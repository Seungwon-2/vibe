import type { HazardBand, HazardDefinition, HazardKind, HazardPattern } from './hazardTypes';

// One pattern starts every 600m. The first starts at 360m so the player can learn controls.
export const PATTERN_START_METERS = 360;
export const PATTERN_SPACING_METERS = 600;
export const MAX_RUN_SPEED_UNITS_PER_SECOND = 325;
export const METERS_PER_WORLD_UNIT = 1 / 3;

function obstacle(id: string, kind: HazardKind, offsetMeters: number): HazardDefinition {
  return {
    id, kind, offsetMeters,
    // Arcade overlap uses these boxes, independent of the decorative pixels.
    width: kind === 'ground' ? 46 : 64,
    height: kind === 'ground' ? 48 : 36,
    warningColor: kind === 'ground' ? '#ffcf6b' : '#8fe5f8',
  };
}

export const HAZARD_BANDS: readonly HazardBand[] = Object.freeze([
  { id: 'tutorial', minDistanceMeters: 0, maxDistanceMeters: 2500,
    patternIds: ['tutorial-jump', 'tutorial-slide'] },
  { id: 'practice', minDistanceMeters: 2500, maxDistanceMeters: 5000,
    patternIds: ['practice-pair', 'practice-slide'] },
  { id: 'combination', minDistanceMeters: 5000, maxDistanceMeters: 7500,
    patternIds: ['combo-jump-slide', 'combo-slide-jump'] },
  { id: 'advanced', minDistanceMeters: 7500, maxDistanceMeters: null,
    patternIds: ['advanced-jump-slide', 'advanced-slide-jump'] },
]);

export const HAZARD_PATTERNS: readonly HazardPattern[] = Object.freeze([
  { id: 'tutorial-jump', minDistanceMeters: 0, maxDistanceMeters: 2500,
    obstacles: [obstacle('low-crate', 'ground', 0)] },
  { id: 'tutorial-slide', minDistanceMeters: 0, maxDistanceMeters: 2500,
    obstacles: [obstacle('high-bar', 'overhead', 0)] },
  { id: 'practice-pair', minDistanceMeters: 2500, maxDistanceMeters: 5000,
    obstacles: [obstacle('crate', 'ground', 0), obstacle('arch', 'overhead', 280)] },
  { id: 'practice-slide', minDistanceMeters: 2500, maxDistanceMeters: 5000,
    obstacles: [obstacle('low-arch', 'overhead', 0)] },
  { id: 'combo-jump-slide', minDistanceMeters: 5000, maxDistanceMeters: 7500,
    obstacles: [obstacle('crystal', 'ground', 0), obstacle('beam', 'overhead', 240)] },
  { id: 'combo-slide-jump', minDistanceMeters: 5000, maxDistanceMeters: 7500,
    obstacles: [obstacle('beam', 'overhead', 0), obstacle('crystal', 'ground', 240)] },
  { id: 'advanced-jump-slide', minDistanceMeters: 7500, maxDistanceMeters: null,
    obstacles: [obstacle('cloud-pillar', 'ground', 0), obstacle('sky-rail', 'overhead', 220)] },
  { id: 'advanced-slide-jump', minDistanceMeters: 7500, maxDistanceMeters: null,
    obstacles: [obstacle('sky-rail', 'overhead', 0), obstacle('cloud-pillar', 'ground', 220)] },
]);

export function getPatternForDistance(distanceMeters: number): HazardPattern {
  const band = HAZARD_BANDS.find(({ minDistanceMeters, maxDistanceMeters }) =>
    distanceMeters >= minDistanceMeters && (maxDistanceMeters === null || distanceMeters < maxDistanceMeters),
  ) ?? HAZARD_BANDS[0];
  const cycle = Math.max(0, Math.floor((distanceMeters - PATTERN_START_METERS) / PATTERN_SPACING_METERS));
  const id = band.patternIds[cycle % band.patternIds.length];
  const pattern = HAZARD_PATTERNS.find((item) => item.id === id);
  if (!pattern) throw new Error(`Unknown hazard pattern: ${id}`);
  return pattern;
}

export function getHazardDistance(patternIndex: number, hazard: HazardDefinition): number {
  return PATTERN_START_METERS + patternIndex * PATTERN_SPACING_METERS + hazard.offsetMeters;
}
