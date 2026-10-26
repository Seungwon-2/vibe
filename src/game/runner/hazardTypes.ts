export type HazardKind = 'ground' | 'overhead';

export type HazardDefinition = Readonly<{
  id: string;
  kind: HazardKind;
  offsetMeters: number;
  width: number;
  height: number;
  warningColor: string;
}>;

export type HazardPattern = Readonly<{
  id: string;
  minDistanceMeters: number;
  maxDistanceMeters: number | null;
  obstacles: readonly HazardDefinition[];
}>;

export type HazardBand = Readonly<{
  id: string;
  minDistanceMeters: number;
  maxDistanceMeters: number | null;
  patternIds: readonly string[];
}>;
