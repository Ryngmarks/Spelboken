import type { Person } from '../domain/roster';
import { parsePerson } from './validate';

/** The squad. Like ScenarioStore, this is replaced by a Supabase implementation (see TASKS.md T7). */
export interface RosterStore {
  list(): Person[];
  save(person: Person): void;
  remove(id: string): void;
}

const STORAGE_KEY = 'football-playbook/roster/v1';

export function createLocalRosterStore(storage: Storage = globalThis.localStorage): RosterStore {
  const readAll = (): Person[] => {
    try {
      const data: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(data) ? data.map(parsePerson).filter((p): p is Person => p !== null) : [];
    } catch {
      return [];
    }
  };
  const writeAll = (people: Person[]) => storage.setItem(STORAGE_KEY, JSON.stringify(people));

  return {
    list: () =>
      readAll().sort(
        (a, b) => (a.number ?? 100) - (b.number ?? 100) || a.name.localeCompare(b.name, 'sv'),
      ),
    save(person) {
      const all = readAll();
      const i = all.findIndex((p) => p.id === person.id);
      if (i >= 0) all[i] = person;
      else all.push(person);
      writeAll(all);
    },
    remove(id) {
      writeAll(readAll().filter((p) => p.id !== id));
    },
  };
}
