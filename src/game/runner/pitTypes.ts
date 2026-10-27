export type PitDefinition = Readonly<{
  id: string;
  // Center of the gap on the absolute course-distance axis.
  distanceMeters: number;
  widthMeters: number;
  tutorialWarning: boolean;
}>;
