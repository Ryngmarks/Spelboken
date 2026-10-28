import { describe, expect, it } from 'vitest';
import { createScenario, insertFrameAfter } from '../domain/scenario';
import { createLocalStore, exportScenarios, parseImport } from './scenarioStore';

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

  it('rejects files without scenarios', () => {
    expect(() => parseImport('[]')).toThrow();
    expect(() => parseImport('hej')).toThrow('JSON');
  });
});
