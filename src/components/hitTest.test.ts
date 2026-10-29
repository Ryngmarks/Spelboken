import { describe, expect, it } from 'vitest';
import {
  arrowHitWidthPx,
  distanceToSegment,
  entityHitRadiusPx,
  hitArrow,
  hitEntity,
  snapTarget,
} from './hitTest';

describe('hitTest', () => {
  it('hit radius is at least 22 px at two render scales', () => {
    // Player radius 1.9 m at 3.14 px/m (phone) and 10 px/m (desktop).
    expect(entityHitRadiusPx(1.9 * 3.14)).toBe(22);
    expect(entityHitRadiusPx(1.9 * 10)).toBe(22);
    // A token drawn larger than the minimum keeps its drawn size.
    expect(entityHitRadiusPx(30)).toBe(30);

    const player = [{ id: 'a', x: 100, y: 100 }];
    expect(hitEntity({ x: 100 + 21, y: 100 }, player, 1.9 * 3.14)?.id).toBe('a');
    expect(hitEntity({ x: 100 + 23, y: 100 }, player, 1.9 * 3.14)).toBeNull();
    expect(hitEntity({ x: 100 + 19, y: 100 }, player, 1.9 * 10)?.id).toBe('a');
    expect(hitEntity({ x: 100 + 23, y: 100 }, player, 1.9 * 10)).toBeNull();
  });

  it('nearest centre wins on overlap', () => {
    const entities = [
      { id: 'far', x: 100, y: 100 },
      { id: 'near', x: 120, y: 100 },
    ];
    expect(hitEntity({ x: 112, y: 100 }, entities, 6)?.id).toBe('near');
    expect(hitEntity({ x: 105, y: 100 }, entities, 6)?.id).toBe('far');
  });

  it('arrows have at least a 44 px wide hit stroke', () => {
    expect(arrowHitWidthPx(1.4)).toBe(44);
    const arrows = [{ id: 'r', from: { x: 0, y: 100 }, to: { x: 200, y: 100 } }];
    expect(hitArrow({ x: 100, y: 121 }, arrows)).toBe('r');
    expect(hitArrow({ x: 100, y: 79 }, arrows)).toBe('r');
    expect(hitArrow({ x: 100, y: 123 }, arrows)).toBeNull();
    // Beyond the end the distance is to the end point, not the infinite line.
    expect(hitArrow({ x: 230, y: 100 }, arrows)).toBeNull();
  });

  it('picks the nearest of several arrows', () => {
    const arrows = [
      { id: 'a', from: { x: 0, y: 100 }, to: { x: 200, y: 100 } },
      { id: 'b', from: { x: 0, y: 110 }, to: { x: 200, y: 110 } },
    ];
    expect(hitArrow({ x: 100, y: 108 }, arrows)).toBe('b');
  });

  it('snaps within 24 px and not beyond', () => {
    const targets = [{ id: 'p', x: 50, y: 50 }];
    expect(snapTarget({ x: 50 + 23.9, y: 50 }, targets)?.id).toBe('p');
    expect(snapTarget({ x: 50 + 24.1, y: 50 }, targets)).toBeNull();
  });

  it('snap skips the target at the gesture start', () => {
    const targets = [
      { id: 'start', x: 50, y: 50 },
      { id: 'other', x: 70, y: 50 },
    ];
    expect(snapTarget({ x: 55, y: 50 }, targets, { x: 50, y: 50 })?.id).toBe('other');
  });

  it('distanceToSegment handles zero length', () => {
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
});
