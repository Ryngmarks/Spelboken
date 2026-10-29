/** Hit testing in screen pixels, so touch targets stay usable however small the pitch is rendered. */

export interface PxPoint {
  x: number;
  y: number;
}

export interface PxTarget extends PxPoint {
  id: string;
}

export interface PxSegment {
  id: string;
  from: PxPoint;
  to: PxPoint;
}

/** Minimum touch radius of players and the ball [T]. */
export const MIN_ENTITY_HIT_RADIUS_PX = 22;
/** Minimum width of the invisible stroke around an arrow [T]. */
export const MIN_ARROW_HIT_WIDTH_PX = 44;
/** How close a drag must end to a player or ball to snap to it [T]. */
export const SNAP_DISTANCE_PX = 24;

const dist = (a: PxPoint, b: PxPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** Hit radius in px for something drawn with the given radius in px: never smaller than the touch minimum. */
export function entityHitRadiusPx(renderedRadiusPx: number): number {
  return Math.max(renderedRadiusPx, MIN_ENTITY_HIT_RADIUS_PX);
}

/** Hit stroke width in px for an arrow drawn with the given width in px. */
export function arrowHitWidthPx(renderedWidthPx: number): number {
  return Math.max(renderedWidthPx, MIN_ARROW_HIT_WIDTH_PX);
}

/** The target whose centre is nearest to the point, if within `radiusPx` of it. Ties go to the first. */
export function nearestWithin<T extends PxTarget>(p: PxPoint, targets: readonly T[], radiusPx: number): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const t of targets) {
    const d = dist(p, t);
    if (d <= radiusPx && d < bestDist) {
      best = t;
      bestDist = d;
    }
  }
  return best;
}

/** Players and ball: nearest centre within the hit radius wins on overlap. `renderedRadiusPx` is the drawn radius. */
export function hitEntity<T extends PxTarget>(p: PxPoint, entities: readonly T[], renderedRadiusPx: number): T | null {
  return nearestWithin(p, entities, entityHitRadiusPx(renderedRadiusPx));
}

/** Distance from a point to a segment. */
export function distanceToSegment(p: PxPoint, a: PxPoint, b: PxPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** The arrow whose line passes nearest to the point, if within half the hit width. */
export function hitArrow(p: PxPoint, arrows: readonly PxSegment[], renderedWidthPx = 0): string | null {
  const half = arrowHitWidthPx(renderedWidthPx) / 2;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const a of arrows) {
    const d = distanceToSegment(p, a.from, a.to);
    if (d <= half && d < bestDist) {
      best = a.id;
      bestDist = d;
    }
  }
  return best;
}

/** The centre of the nearest target within the snap distance, skipping one that coincides with `except`. */
export function snapTarget<T extends PxTarget>(
  p: PxPoint,
  targets: readonly T[],
  except?: PxPoint,
  snapPx = SNAP_DISTANCE_PX,
): T | null {
  return nearestWithin(
    p,
    except ? targets.filter((t) => dist(t, except) > 0.5) : targets,
    snapPx,
  );
}
