import { describe, expect, it } from 'vitest';
import {
  BALL_ID,
  addPlayer,
  applyFormation,
  createScenario,
  duplicateScenario,
  insertFrameAfter,
  interpolatePositions,
  moveEntity,
  moveFrame,
  players,
  removeEntity,
  removeFrame,
} from './scenario';
import { PITCH_LENGTH } from './pitch';
import type { Frame, Scenario } from './types';

const frame = (positions: Frame['positions']): Frame => ({ id: 'f', caption: '', drawings: [], positions });

describe('createScenario', () => {
  it('starts with a ball in one frame', () => {
    const s = createScenario();
    expect(s.frames).toHaveLength(1);
    expect(s.entities).toEqual([{ id: BALL_ID, kind: 'ball' }]);
    expect(s.frames[0]!.positions[BALL_ID]).toBeDefined();
  });

  it('places formations for both teams, away mirrored', () => {
    const s = createScenario({ homeFormation: '4-3-3', awayFormation: '4-4-2' });
    const home = players(s, 'home');
    const away = players(s, 'away');
    expect(home).toHaveLength(11);
    expect(away).toHaveLength(11);
    expect(s.frames[0]!.positions[home[0]!.id]!.x).toBe(4);
    expect(s.frames[0]!.positions[away[0]!.id]!.x).toBe(PITCH_LENGTH - 4);
  });
});

describe('applyFormation', () => {
  it('replaces only the given team, in every frame', () => {
    let s = createScenario({ homeFormation: '4-3-3', awayFormation: '4-3-3' });
    s = insertFrameAfter(s, 0);
    const awayIds = players(s, 'away').map((p) => p.id);
    s = applyFormation(s, 'home', '4-4-2');
    expect(players(s, 'home')).toHaveLength(11);
    expect(players(s, 'away').map((p) => p.id)).toEqual(awayIds);
    for (const f of s.frames) expect(Object.keys(f.positions)).toHaveLength(23);
  });
});

describe('entities', () => {
  it('adds a player with the next free number to every frame', () => {
    const base = insertFrameAfter(createScenario({ homeFormation: '4-3-3' }), 0);
    const { scenario, id } = addPlayer(base, 'home', { x: 10, y: 10 });
    expect(players(scenario, 'home').find((p) => p.id === id)!.number).toBe(12);
    expect(scenario.frames.every((f) => f.positions[id])).toBe(true);
  });

  it('reuses gaps in numbering', () => {
    let s = createScenario({ homeFormation: '4-3-3' });
    s = removeEntity(s, players(s, 'home').find((p) => p.number === 7)!.id);
    expect(addPlayer(s, 'home', { x: 0, y: 0 }).scenario.entities.at(-1)).toMatchObject({ number: 7 });
  });

  it('removes an entity from all frames', () => {
    const s = removeEntity(insertFrameAfter(createScenario(), 0), BALL_ID);
    expect(s.entities).toHaveLength(0);
    expect(s.frames.every((f) => !(BALL_ID in f.positions))).toBe(true);
  });

  it('moves an entity only in the given frame', () => {
    const s = moveEntity(insertFrameAfter(createScenario(), 0), 1, BALL_ID, { x: 80, y: 20 });
    expect(s.frames[0]!.positions[BALL_ID]).toEqual({ x: 52.5, y: 34 });
    expect(s.frames[1]!.positions[BALL_ID]).toEqual({ x: 80, y: 20 });
  });
});

describe('frames', () => {
  it('copies positions but not drawings or caption', () => {
    const base = createScenario();
    let s: Scenario = {
      ...base,
      frames: [
        {
          ...base.frames[0]!,
          caption: 'a',
          drawings: [{ id: 'd', type: 'pass' as const, from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }],
        },
      ],
    };
    s = insertFrameAfter(s, 0);
    expect(s.frames[1]!.caption).toBe('');
    expect(s.frames[1]!.drawings).toEqual([]);
    expect(s.frames[1]!.positions).toEqual(s.frames[0]!.positions);
    expect(s.frames[1]!.positions).not.toBe(s.frames[0]!.positions);
  });

  it('never removes the last frame', () => {
    const s = createScenario();
    expect(removeFrame(s, 0)).toBe(s);
  });

  it('reorders frames', () => {
    const s = insertFrameAfter(insertFrameAfter(createScenario(), 0), 1);
    const ids = s.frames.map((f) => f.id);
    expect(moveFrame(s, 0, 2).frames.map((f) => f.id)).toEqual([ids[1], ids[2], ids[0]]);
  });
});

describe('interpolatePositions', () => {
  it('goes from a to b with easing', () => {
    const a = frame({ p: { x: 0, y: 0 } });
    const b = frame({ p: { x: 10, y: 20 } });
    expect(interpolatePositions(a, b, 0).p).toEqual({ x: 0, y: 0 });
    expect(interpolatePositions(a, b, 0.5).p).toEqual({ x: 5, y: 10 });
    expect(interpolatePositions(a, b, 1).p).toEqual({ x: 10, y: 20 });
    expect(interpolatePositions(a, b, 0.25).p!.x).toBeLessThan(2.5);
  });

  it('keeps entities that exist in only one frame still', () => {
    expect(interpolatePositions(frame({ p: { x: 3, y: 3 } }), frame({}), 0.7).p).toEqual({ x: 3, y: 3 });
  });
});

describe('duplicateScenario', () => {
  it('creates new ids but keeps the structure consistent', () => {
    const s = insertFrameAfter(createScenario({ homeFormation: '4-3-3' }), 0);
    const copy = duplicateScenario(s);
    expect(copy.id).not.toBe(s.id);
    const ids = new Set(copy.entities.map((e) => e.id));
    expect(s.entities.some((e) => e.kind === 'player' && ids.has(e.id))).toBe(false);
    for (const f of copy.frames) expect(new Set(Object.keys(f.positions))).toEqual(ids);
  });
});
