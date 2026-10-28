import { describe, expect, it } from 'vitest';
import { parseScenario } from '../storage/validate';
import { CORRIDORS, PITCH_LENGTH, PITCH_WIDTH } from './pitch';
import { buildUpSuggestions } from './suggestions';
import type { PlayerEntity, Scenario } from './types';

const suggestions = buildUpSuggestions(new Date('2026-10-28T12:00:00Z'));

function at(s: Scenario, frame: number, team: 'home' | 'away', number: number) {
  const p = s.entities.find((e): e is PlayerEntity => e.kind === 'player' && e.team === team && e.number === number)!;
  return s.frames[frame]!.positions[p.id]!;
}

const corridorOf = (y: number) => CORRIDORS.findIndex((c) => y >= c.from && y < c.to);

describe('build-up suggestions vs 4-2-3-1', () => {
  it('builds five patterns on both sides with unique titles', () => {
    expect(suggestions).toHaveLength(10);
    expect(new Set(suggestions.map((s) => s.title)).size).toBe(10);
  });

  it('are valid scenarios that survive storage validation', () => {
    for (const s of suggestions) {
      expect(parseScenario(JSON.parse(JSON.stringify(s)))).toEqual(s);
      expect(s.entities.filter((e) => e.kind === 'player')).toHaveLength(22);
    }
  });

  it('start from the agreed structure', () => {
    for (const s of suggestions) {
      // Three centre backs (5, 4, 3) in the left inner, central and right inner corridors.
      expect([5, 4, 3].map((n) => corridorOf(at(s, 0, 'home', n).y))).toEqual([1, 2, 3]);
      // The 6 is behind the opponent's first press line (their 9 and 10).
      const six = at(s, 0, 'home', 6);
      expect(six.x).toBeGreaterThan(Math.max(at(s, 0, 'away', 9).x, at(s, 0, 'away', 10).x));
      // Wing backs high and wide: on the halfway line, in the outer corridors.
      for (const n of [7, 2]) {
        const wb = at(s, 0, 'home', n);
        expect(Math.abs(wb.x - PITCH_LENGTH / 2)).toBeLessThan(2);
        expect([0, 4]).toContain(corridorOf(wb.y));
      }
    }
  });

  it('keeps left players on the left in mirrored versions', () => {
    for (const s of suggestions) {
      s.frames.forEach((_, i) => {
        expect(at(s, i, 'home', 7).y).toBeLessThan(PITCH_WIDTH / 2); // VB
        expect(at(s, i, 'home', 2).y).toBeGreaterThan(PITCH_WIDTH / 2); // HB
      });
    }
  });

  it('keeps everything on the pitch', () => {
    for (const s of suggestions)
      for (const f of s.frames) {
        for (const p of Object.values(f.positions)) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(PITCH_LENGTH);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(PITCH_WIDTH);
        }
      }
  });
});

describe('pass lanes', () => {
  const distToSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  };

  it('no opponent stands in the way of a pass', () => {
    for (const s of suggestions)
      s.frames.forEach((f, i) => {
        const opponents = s.entities.filter((e) => e.kind === 'player' && e.team === 'away').map((e) => f.positions[e.id]!);
        for (const d of f.drawings) {
          if (d.type !== 'pass') continue;
          // The presser on the passer and the defender behind the receiver are expected; the lane between must be clear.
          const inLane = opponents.filter(
            (o) => Math.hypot(o.x - d.from.x, o.y - d.from.y) > 5 && Math.hypot(o.x - d.to.x, o.y - d.to.y) > 4 && distToSegment(o, d.from, d.to) < 2.5,
          );
          expect(inLane, `${s.title}, steg ${i + 1}`).toEqual([]);
        }
      });
  });
});
