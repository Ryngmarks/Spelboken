import { newId } from './scenario';
import type { PlayerEntity, Scenario } from './types';

/**
 * A real person in the squad. Deliberately minimal personal data (see DECISIONS.md D10):
 * no e-mail, birth date or photo until player accounts exist.
 */
export interface Person {
  id: string;
  name: string;
  /** Shirt number, if the player has one. */
  number: number | null;
  /** Positions the player plays, e.g. ['VB', 'MB']. Used to find relevant scenarios. */
  positions: string[];
}

export function createPerson(name: string, number: number | null = null, positions: string[] = []): Person {
  return { id: newId(), name: name.trim(), number, positions };
}

/** Short name for the pitch: first name, shortened if long. */
export function pitchName(person: Person): string {
  const first = person.name.trim().split(/\s+/)[0] ?? '';
  return first.length > 9 ? `${first.slice(0, 8)}.` : first;
}

/**
 * Links a home player on the pitch to a person (or unlinks with null).
 * The shirt number follows the person when they have one.
 */
export function linkPerson(s: Scenario, entityId: string, person: Person | null): Scenario {
  return {
    ...s,
    entities: s.entities.map((e) => {
      if (e.id !== entityId || e.kind !== 'player' || e.team !== 'home') return e;
      if (!person) {
        const { personId: _removed, ...rest } = e;
        return rest;
      }
      return { ...e, personId: person.id, number: person.number ?? e.number };
    }),
  };
}

/** Names to show on the pitch, by entity id. Links to people no longer in the squad are ignored. */
export function pitchNames(s: Scenario, roster: Person[]): Record<string, string> {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const names: Record<string, string> = {};
  for (const e of s.entities) {
    const person = e.kind === 'player' && e.personId ? byId.get(e.personId) : undefined;
    if (person) names[e.id] = pitchName(person);
  }
  return names;
}

/** True if the person is on the pitch in the scenario, or the scenario is marked as important for one of their positions. */
export function isRelevantFor(s: Scenario, person: Person): boolean {
  const onPitch = s.entities.some((e): e is PlayerEntity => e.kind === 'player' && e.personId === person.id);
  return onPitch || s.focusPositions.some((pos) => person.positions.includes(pos));
}

/** People already placed on the pitch in this scenario (a person should appear at most once). */
export function linkedPersonIds(s: Scenario): Set<string> {
  return new Set(
    s.entities.flatMap((e) => (e.kind === 'player' && e.personId ? [e.personId] : [])),
  );
}

/** Removes all links to a person, e.g. when they leave the squad. Returns the same object if nothing changed. */
export function unlinkPerson(s: Scenario, personId: string): Scenario {
  if (!linkedPersonIds(s).has(personId)) return s;
  return {
    ...s,
    entities: s.entities.map((e) => {
      if (e.kind !== 'player' || e.personId !== personId) return e;
      const { personId: _removed, ...rest } = e;
      return rest;
    }),
  };
}
