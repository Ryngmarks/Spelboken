import { describe, expect, it } from 'vitest';
import { createPerson, isRelevantFor, linkPerson, linkedPersonIds, pitchName, pitchNames, unlinkPerson } from './roster';
import { createScenario, players, updatePlayer } from './scenario';
import { parseScenario } from '../storage/validate';
import { createLocalRosterStore } from '../storage/rosterStore';

const anna = createPerson('Anna Svensson', 7, ['VY', 'HY']);

describe('roster', () => {
  it('links a home player to a person and takes the shirt number', () => {
    const s = createScenario({ homeFormation: '4-3-3' });
    const target = players(s, 'home')[1]!;
    const linked = linkPerson(s, target.id, anna);
    expect(players(linked, 'home')[1]).toMatchObject({ personId: anna.id, number: 7 });
    expect(linkedPersonIds(linked)).toEqual(new Set([anna.id]));

    const unlinked = linkPerson(linked, target.id, null);
    expect(players(unlinked, 'home')[1]!.personId).toBeUndefined();
  });

  it('never links opponents', () => {
    const s = createScenario({ awayFormation: '4-4-2' });
    const opponent = players(s, 'away')[0]!;
    expect(linkPerson(s, opponent.id, anna)).toEqual(s);
  });

  it('shows first names on the pitch and ignores removed people', () => {
    let s = createScenario({ homeFormation: '4-3-3' });
    const [p1, p2] = players(s, 'home');
    s = linkPerson(linkPerson(s, p1!.id, anna), p2!.id, createPerson('Bo'));
    expect(pitchNames(s, [anna])).toEqual({ [p1!.id]: 'Anna' });
    expect(pitchName(createPerson('Maximilianus Ek'))).toBe('Maximili.');
  });

  it('finds scenarios relevant for a person by link or position', () => {
    const s = createScenario({ homeFormation: '4-3-3' });
    expect(isRelevantFor(s, anna)).toBe(false);
    expect(isRelevantFor({ ...s, focusPositions: ['HY'] }, anna)).toBe(true);
    expect(isRelevantFor(linkPerson(s, players(s, 'home')[0]!.id, anna), anna)).toBe(true);
  });

  it('keeps the link through validation (storage and import)', () => {
    const s = createScenario({ homeFormation: '4-3-3' });
    const linked = linkPerson(s, players(s, 'home')[0]!.id, anna);
    expect(parseScenario(JSON.parse(JSON.stringify(linked)))).toEqual(linked);
  });
});

describe('local roster store', () => {
  it('saves, updates, sorts by number and removes', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    } as Storage;
    const store = createLocalRosterStore(storage);
    const bo = createPerson('Bo', null);
    store.save(bo);
    store.save(anna);
    expect(store.list().map((p) => p.name)).toEqual(['Anna Svensson', 'Bo']);
    store.save({ ...bo, number: 3 });
    expect(store.list().map((p) => p.name)).toEqual(['Bo', 'Anna Svensson']);
    store.remove(bo.id);
    expect(store.list()).toEqual([anna]);
  });
});

describe('updatePlayer', () => {
  it('unlinks the person when a player is moved to the opponent team', () => {
    const s = createScenario({ homeFormation: '4-3-3' });
    const id = players(s, 'home')[0]!.id;
    const moved = updatePlayer(linkPerson(s, id, anna), id, { team: 'away' });
    expect(players(moved, 'away')[0]!.personId).toBeUndefined();
  });
});

describe('unlinkPerson', () => {
  it('removes links to the person and leaves other scenarios untouched', () => {
    const s = createScenario({ homeFormation: '4-3-3' });
    const linked = linkPerson(s, players(s, 'home')[2]!.id, anna);
    expect(linkedPersonIds(unlinkPerson(linked, anna.id)).size).toBe(0);
    expect(unlinkPerson(s, anna.id)).toBe(s);
  });
});
