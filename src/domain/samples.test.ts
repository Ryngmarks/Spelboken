import { describe, expect, it } from 'vitest';
import { parseScenario } from '../storage/validate';
import { sampleBuildUp } from './samples';

describe('sampleBuildUp', () => {
  it('is a valid scenario where every entity has a position in every frame', () => {
    const s = sampleBuildUp();
    expect(parseScenario(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(s.frames).toHaveLength(3);
    for (const f of s.frames) {
      expect(new Set(Object.keys(f.positions))).toEqual(new Set(s.entities.map((e) => e.id)));
      expect(f.caption).not.toBe('');
      expect(f.drawings.length).toBeGreaterThan(0);
    }
  });
});
