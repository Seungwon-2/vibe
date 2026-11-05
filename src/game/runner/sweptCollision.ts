export type CollisionBounds = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

/** Test whether the segment between two relative centers intersects an AABB. */
export function sweptAabbIntersects(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  halfWidth: number,
  halfHeight: number,
): boolean {
  const dx = endX - startX;
  const dy = endY - startY;
  let enter = 0;
  let exit = 1;

  for (const [origin, delta, minimum, maximum] of [
    [startX, dx, -halfWidth, halfWidth],
    [startY, dy, -halfHeight, halfHeight],
  ]) {
    if (Math.abs(delta) < Number.EPSILON) {
      if (origin < minimum || origin > maximum) return false;
      continue;
    }
    const first = (minimum - origin) / delta;
    const second = (maximum - origin) / delta;
    enter = Math.max(enter, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (enter > exit) return false;
  }
  return exit >= 0 && enter <= 1;
}

export function getCollisionBounds(
  object: { x?: number; y?: number; body?: unknown },
  fallbackHalfWidth = 20,
  fallbackHalfHeight = 38,
): CollisionBounds {
  const body = object.body as Partial<CollisionBounds> | undefined;
  if (body && [body.left, body.right, body.top, body.bottom].every(Number.isFinite)) {
    return { left: body.left!, right: body.right!, top: body.top!, bottom: body.bottom! };
  }
  const x = Number.isFinite(object.x) ? object.x! : 0;
  const y = Number.isFinite(object.y) ? object.y! : 0;
  return { left: x - fallbackHalfWidth, right: x + fallbackHalfWidth,
    top: y - fallbackHalfHeight, bottom: y + fallbackHalfHeight };
}

export function boundsCenter(bounds: CollisionBounds): { x: number; y: number } {
  return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
}
