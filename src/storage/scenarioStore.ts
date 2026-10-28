import { duplicateScenario } from '../domain/scenario';
import type { Scenario } from '../domain/types';
import { parseScenario } from './validate';

/** The single place where persistence happens. A server-backed implementation can replace this later. */
export interface ScenarioStore {
  list(): Scenario[];
  get(id: string): Scenario | undefined;
  save(scenario: Scenario): Scenario;
  remove(id: string): void;
}

const STORAGE_KEY = 'football-playbook/scenarios/v1';

export function createLocalStore(storage: Storage = globalThis.localStorage): ScenarioStore {
  const readAll = (): Scenario[] => {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: unknown = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map(parseScenario).filter((s): s is Scenario => s !== null);
    } catch {
      return [];
    }
  };
  const writeAll = (scenarios: Scenario[]) => {
    storage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  };

  return {
    list: () => readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    get: (id) => readAll().find((s) => s.id === id),
    save(scenario) {
      const saved = { ...scenario, updatedAt: new Date().toISOString() };
      const all = readAll().filter((s) => s.id !== scenario.id);
      writeAll([...all, saved]);
      return saved;
    },
    remove(id) {
      writeAll(readAll().filter((s) => s.id !== id));
    },
  };
}

const EXPORT_FORMAT = 'football-playbook';

export function exportScenarios(scenarios: Scenario[]): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 1, scenarios }, null, 2);
}

export interface ImportResult {
  scenarios: Scenario[];
  skipped: number;
}

/** Accepts an export file or a single scenario. Throws with a user-facing message when the file is unusable. */
export function parseImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Filen är inte giltig JSON.');
  }
  const file = data as { format?: unknown; scenarios?: unknown } | null;
  const items: unknown[] =
    typeof file === 'object' && file !== null && file.format === EXPORT_FORMAT
      ? Array.isArray(file.scenarios)
        ? file.scenarios
        : []
      : [data];
  const scenarios = items.map(parseScenario).filter((s): s is Scenario => s !== null);
  if (scenarios.length === 0) throw new Error('Hittade inga scenarier i filen.');
  return { scenarios, skipped: items.length - scenarios.length };
}

/** Imported scenarios whose id already exists locally. */
export function findConflicts(existing: Scenario[], imported: Scenario[]): Scenario[] {
  const ids = new Set(existing.map((s) => s.id));
  return imported.filter((s) => ids.has(s.id));
}

/**
 * What to write for an import. Conflicting scenarios either replace the local version
 * or are kept as copies with new ids, so local work is never overwritten without consent.
 */
export function resolveImport(existing: Scenario[], imported: Scenario[], replace: boolean): Scenario[] {
  if (replace) return imported;
  const ids = new Set(existing.map((s) => s.id));
  return imported.map((s) =>
    ids.has(s.id) ? { ...duplicateScenario(s), title: `${s.title} (importerad)` } : s,
  );
}
