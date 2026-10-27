// Linger on the fallen pose before playing the existing recovery drawings.
// At 12 fps this lasts about 1.17s, just under the 1.2s hit pause.
export function getHurtAnimationFrames(frames: readonly string[]): string[] {
  if (frames.length !== 6) throw new Error('A hurt animation needs six source frames');
  return [...frames.slice(0, 4), ...Array.from({ length: 8 }, () => frames[3]),
    ...frames.slice(4)];
}
