import { describe, expect, it } from 'vitest';
import { createScenario, insertFrameAfter } from '../domain/scenario';
import { planMove } from '../domain/movement';
import type { ArrowDrawing, Scenario } from '../domain/types';
import { parseScenario } from './validate';
import { createLocalStore, exportScenarios, findConflicts, parseImport, resolveImport } from './scenarioStore';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

function legacyFixture(): Scenario {
  return {
    id: 'legacy-v1', schemaVersion: 1, title: 'Old scenario', description: '',
    phase: 'build-up', principle: '', focusPositions: [], guides: [],
    entities: [
      { id: 'ball', kind: 'ball' },
      { id: 'player', kind: 'player', team: 'home', number: 6, label: 'DM' },
    ],
    frames: [{
      id: 'first', caption: '', positions: { ball: { x: 10, y: 10 }, player: { x: 30, y: 20 } },
      drawings: [{ id: 'old-arrow', type: 'pass', from: { x: 10, y: 10 }, to: { x: 30, y: 20 } }],
    }],
    createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
  };
}

describe('movement storage compatibility', () => {
  it('loads a fixed old-format v1 fixture without changing anything', () => {
    const fixture = legacyFixture();
    expect(parseScenario(JSON.parse(JSON.stringify(fixture)))).toEqual(fixture);
    expect(parseImport(exportScenarios([fixture])).scenarios).toEqual([fixture]);
  });

  it('round-trips optional mover and receiver ids through JSON and local storage', () => {
    const base = legacyFixture();
    const moved = planMove(base, 0, { entityId: 'player', to: { x: 40, y: 25 }, arrowId: 'run' });
    const passed = planMove(moved, 0, { entityId: 'ball', to: { x: 30, y: 20 }, targetId: 'player', arrowId: 'pass' });
    const dribbled = planMove(passed, 1, { entityId: 'player', to: { x: 50, y: 30 }, arrowId: 'dribble' });
    expect(parseScenario(JSON.parse(JSON.stringify(dribbled)))).toEqual(dribbled);
    expect(parseImport(exportScenarios([dribbled])).scenarios).toEqual([dribbled]);
    const store = createLocalStore(memoryStorage());
    const saved = store.save(dribbled);
    expect(store.get(dribbled.id)).toEqual(saved);
  });

  it.each([
    { entityId: 'missing', targetId: 'player' },
    { entityId: NaN, targetId: 'player' },
    { entityId: '', targetId: 'player' },
    { entityId: 'x'.repeat(201), targetId: 'player' },
    { entityId: { id: 'ball' }, targetId: 'player' },
  ])('drops malformed or dangling mover fields without rejecting the scenario: %j', (fields) => {
    const fixture = insertFrameAfter(legacyFixture(), 0);
    const raw = { ...fixture, frames: fixture.frames.map((frame, index) => index === 0
      ? { ...frame, drawings: [{ ...frame.drawings[0], ...fields }] } : frame) };
    const parsed = parseScenario(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.frames[0]!.drawings[0]).toEqual(fixture.frames[0]!.drawings[0]);
  });

  it.each(['missing', 'ball', '', NaN, Infinity, [], 'x'.repeat(201)])('drops invalid pass receiver %j but retains its valid mover', (targetId) => {
    const fixture = insertFrameAfter(legacyFixture(), 0);
    const raw = { ...fixture, frames: fixture.frames.map((frame, index) => index === 0
      ? { ...frame, drawings: [{ ...frame.drawings[0], entityId: 'ball', targetId }] } : frame) };
    const parsed = parseScenario(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.frames[0]!.drawings[0]).toMatchObject({ entityId: 'ball', type: 'pass' });
    expect(parsed!.frames[0]!.drawings[0]).not.toHaveProperty('targetId');
  });

  it('drops targetId on non-pass arrows', () => {
    const fixture = planMove(legacyFixture(), 0, { entityId: 'player', to: { x: 40, y: 20 }, arrowId: 'run' });
    const arrow = fixture.frames[0]!.drawings[1] as ArrowDrawing;
    arrow.targetId = 'player';
    const parsed = parseScenario(fixture);
    expect(parsed).not.toBeNull();
    expect(parsed!.frames[0]!.drawings[1]).not.toHaveProperty('targetId');
    expect(parsed!.frames[0]!.drawings[1]).toMatchObject({ entityId: 'player', type: 'run' });
  });

  it('sanitizes dangling links, last-frame links and duplicate links while retaining fallback geometry', () => {
    const fixture = legacyFixture();
    const original = fixture.frames[0]!.drawings[0] as ArrowDrawing;
    const lastFrame = parseScenario({ ...fixture, frames: [{ ...fixture.frames[0], drawings: [{ ...original, entityId: 'ball', targetId: 'player' }] }] });
    expect(lastFrame!.frames[0]!.drawings[0]).toEqual(original);
    const extended = insertFrameAfter(fixture, 0);
    extended.frames[0]!.drawings = [
      { ...original, entityId: 'ball' },
      { ...original, id: 'duplicate', entityId: 'ball', targetId: 'player' },
    ];
    const parsed = parseScenario(extended);
    expect(parsed!.frames[0]!.drawings[0]).toHaveProperty('entityId', 'ball');
    expect(parsed!.frames[0]!.drawings[1]).toEqual({ ...original, id: 'duplicate' });
  });
});

describe('localStore', () => {
  it('saves, lists, updates and removes', () => {
    const store = createLocalStore(memoryStorage());
    const s = createScenario({ homeFormation: '4-3-3' });
    store.save(s);
    expect(store.list()).toHaveLength(1);
    store.save({ ...s, title: 'Ändrad' });
    expect(store.list()).toHaveLength(1);
    expect(store.get(s.id)!.title).toBe('Ändrad');
    store.remove(s.id);
    expect(store.list()).toHaveLength(0);
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('football-playbook/scenarios/v1', '{not json');
    expect(createLocalStore(storage).list()).toEqual([]);
  });
});

describe('import/export', () => {
  it('round-trips scenarios', () => {
    const a = insertFrameAfter(createScenario({ homeFormation: '4-4-2', awayFormation: '4-3-3' }), 0);
    const b = createScenario({ title: 'B' });
    const { scenarios, skipped } = parseImport(exportScenarios([a, b]));
    expect(skipped).toBe(0);
    expect(scenarios).toEqual([a, b]);
  });

  it('accepts a single scenario object', () => {
    const a = createScenario();
    expect(parseImport(JSON.stringify(a)).scenarios).toEqual([a]);
  });

  it('skips invalid scenarios and reports them', () => {
    const text = JSON.stringify({
      format: 'football-playbook',
      version: 1,
      scenarios: [createScenario(), { nope: true }],
    });
    expect(parseImport(text).skipped).toBe(1);
  });

  it('skips scenarios with coordinates far outside the pitch', () => {
    const s = createScenario();
    const bad = {
      ...s,
      frames: [{ ...s.frames[0]!, drawings: [{ id: 'd', type: 'dribble', from: { x: 0, y: 0 }, to: { x: 1e12, y: 0 } }] }],
    };
    expect(() => parseImport(JSON.stringify(bad))).toThrow('Hittade inga');
  });

  it('rejects files without scenarios', () => {
    expect(() => parseImport('[]')).toThrow();
    expect(() => parseImport('hej')).toThrow('JSON');
  });
});

describe('resolveImport', () => {
  it('keeps conflicting scenarios as copies unless replacing', () => {
    const local = createScenario({ title: 'Lokal' });
    const fresh = createScenario({ title: 'Ny' });
    const incoming = [{ ...local, title: 'Gammal export' }, fresh];
    expect(findConflicts([local], incoming).map((s) => s.id)).toEqual([local.id]);

    const kept = resolveImport([local], incoming, false);
    expect(kept[0]!.id).not.toBe(local.id);
    expect(kept[0]!.title).toBe('Gammal export (importerad)');
    expect(kept[1]).toBe(fresh);

    expect(resolveImport([local], incoming, true)).toBe(incoming);
  });
});

describe('parseScenario guides', () => {
  it('keeps known guides and defaults older data to none', () => {
    const s = createScenario();
    expect(parseScenario({ ...s, guides: ['thirds', 'bogus', 'corridors'] })?.guides).toEqual(['corridors', 'thirds']);
    const { guides: _, ...old } = s;
    expect(parseScenario(old)?.guides).toEqual([]);
  });
});
