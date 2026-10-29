import { describe, expect, it } from 'vitest';
import {
  clampToPitch,
  CORRIDORS,
  corridorsFor,
  DEFAULT_PITCH,
  PITCH_LENGTH,
  PITCH_WIDTH,
  THIRDS,
  thirdsFor,
  type PitchBand,
  type PitchSpec,
} from './pitch';

function expectContiguous(bands: PitchBand[], total: number) {
  expect(bands[0]!.from).toBe(0);
  expect(bands.at(-1)!.to).toBe(total);
  bands.slice(1).forEach((b, i) => expect(b.from).toBeCloseTo(bands[i]!.to));
}

describe('pitch guides', () => {
  it('corridors cover the width without gaps and are symmetric', () => {
    expectContiguous(CORRIDORS, PITCH_WIDTH);
    const widths = CORRIDORS.map((b) => b.to - b.from);
    expect(widths[0]).toBeCloseTo(widths[4]!);
    expect(widths[1]).toBeCloseTo(widths[3]!);
    // The central corridor is as wide as the goal area.
    expect(widths[2]).toBeCloseTo(18.32);
  });

  it('thirds cover the length in equal parts', () => {
    expectContiguous(THIRDS, PITCH_LENGTH);
    for (const b of THIRDS) expect(b.to - b.from).toBeCloseTo(35);
  });
});

describe('PitchSpec', () => {
  const small: PitchSpec = {
    length: 55,
    width: 35,
    boxDepth: 9,
    boxHalf: 10,
    sixDepth: 3,
    sixHalf: 5,
    goalHalf: 2,
    spotDistance: 7,
    circleRadius: 6,
  };

  it('defaults to 105 x 68 and the exported bands equal the derived ones', () => {
    expect([DEFAULT_PITCH.length, DEFAULT_PITCH.width]).toEqual([105, 68]);
    expect(CORRIDORS).toEqual(corridorsFor(DEFAULT_PITCH));
    expect(THIRDS).toEqual(thirdsFor(DEFAULT_PITCH));
  });

  it('derives corridors and thirds from an injected 55 x 35 spec', () => {
    const corridors = corridorsFor(small);
    expectContiguous(corridors, 35);
    expect(corridors[2]!.to - corridors[2]!.from).toBeCloseTo(10);
    const thirds = thirdsFor(small);
    expectContiguous(thirds, 55);
    for (const b of thirds) expect(b.to - b.from).toBeCloseTo(55 / 3);
  });

  it('clamps to the given spec', () => {
    expect(clampToPitch({ x: 100, y: 100 }, 3, small)).toEqual({ x: 58, y: 38 });
    expect(clampToPitch({ x: 200, y: 200 })).toEqual({ x: 108, y: 71 });
  });
});
