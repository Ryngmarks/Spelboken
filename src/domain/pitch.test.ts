import { describe, expect, it } from 'vitest';
import { CORRIDORS, PITCH_LENGTH, PITCH_WIDTH, THIRDS, type PitchBand } from './pitch';

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
