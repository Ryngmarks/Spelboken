import { formationSlots } from './formations';
import { PITCH_LENGTH, PITCH_WIDTH } from './pitch';
import type { Drawing, Entity, Frame, PlayerEntity, Point, Scenario, Team } from './types';

export function newId(): string {
  return globalThis.crypto.randomUUID();
}

export const BALL_ID = 'ball';
const CENTRE: Point = { x: PITCH_LENGTH / 2, y: PITCH_WIDTH / 2 };

export interface CreateScenarioOptions {
  title?: string;
  homeFormation?: string | null;
  awayFormation?: string | null;
  now?: Date;
}

export function createScenario(opts: CreateScenarioOptions = {}): Scenario {
  const now = (opts.now ?? new Date()).toISOString();
  let scenario: Scenario = {
    id: newId(),
    schemaVersion: 1,
    title: opts.title ?? 'Nytt scenario',
    description: '',
    phase: 'build-up',
    principle: '',
    focusPositions: [],
    guides: [],
    entities: [{ id: BALL_ID, kind: 'ball' }],
    frames: [{ id: newId(), caption: '', positions: { [BALL_ID]: { ...CENTRE } }, drawings: [] }],
    createdAt: now,
    updatedAt: now,
  };
  if (opts.homeFormation) scenario = applyFormation(scenario, 'home', opts.homeFormation);
  if (opts.awayFormation) scenario = applyFormation(scenario, 'away', opts.awayFormation);
  return scenario;
}

export function players(s: Scenario, team?: Team): PlayerEntity[] {
  return s.entities.filter(
    (e): e is PlayerEntity => e.kind === 'player' && (team === undefined || e.team === team),
  );
}

function mapFrames(s: Scenario, fn: (f: Frame, index: number) => Frame): Scenario {
  return { ...s, frames: s.frames.map(fn) };
}

function updateFrame(s: Scenario, frameIndex: number, fn: (f: Frame) => Frame): Scenario {
  if (!s.frames[frameIndex]) return s;
  return mapFrames(s, (f, i) => (i === frameIndex ? fn(f) : f));
}

/** Replaces all players of a team with the given formation, in every frame. */
export function applyFormation(s: Scenario, team: Team, formation: string): Scenario {
  const slots = formationSlots(formation, team);
  const removed = new Set(players(s, team).map((p) => p.id));
  const added: PlayerEntity[] = slots.map((slot, i) => ({
    id: newId(),
    kind: 'player',
    team,
    number: i + 1,
    label: slot.label,
  }));
  return {
    ...s,
    entities: [...s.entities.filter((e) => !removed.has(e.id)), ...added],
    frames: s.frames.map((f) => {
      const positions = Object.fromEntries(
        Object.entries(f.positions).filter(([id]) => !removed.has(id)),
      );
      added.forEach((p, i) => {
        positions[p.id] = { ...slots[i]!.at };
      });
      return { ...f, positions };
    }),
  };
}

export function nextFreeNumber(s: Scenario, team: Team): number {
  const used = new Set(players(s, team).map((p) => p.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/** Adds an entity at the same position in every frame. Returns the new scenario and the entity id. */
export function addPlayer(s: Scenario, team: Team, at: Point): { scenario: Scenario; id: string } {
  const player: PlayerEntity = {
    id: newId(),
    kind: 'player',
    team,
    number: nextFreeNumber(s, team),
    label: '',
  };
  return { scenario: addEntity(s, player, at), id: player.id };
}

/** Adds a ball if the scenario has none. */
export function ensureBall(s: Scenario, at: Point = CENTRE): Scenario {
  if (s.entities.some((e) => e.kind === 'ball')) return s;
  return addEntity(s, { id: BALL_ID, kind: 'ball' }, at);
}

function addEntity(s: Scenario, entity: Entity, at: Point): Scenario {
  return {
    ...mapFrames(s, (f) => ({ ...f, positions: { ...f.positions, [entity.id]: { ...at } } })),
    entities: [...s.entities, entity],
  };
}

export function removeEntity(s: Scenario, id: string): Scenario {
  return {
    ...mapFrames(s, (f) => {
      const { [id]: _removed, ...positions } = f.positions;
      return { ...f, positions };
    }),
    entities: s.entities.filter((e) => e.id !== id),
  };
}

export function updatePlayer(
  s: Scenario,
  id: string,
  patch: Partial<Pick<PlayerEntity, 'number' | 'label' | 'team'>>,
): Scenario {
  return {
    ...s,
    entities: s.entities.map((e) => {
      if (e.id !== id || e.kind !== 'player') return e;
      const next = { ...e, ...patch };
      // Only the home team represents real squad members.
      if (next.team === 'away') delete next.personId;
      return next;
    }),
  };
}

export function moveEntity(s: Scenario, frameIndex: number, id: string, to: Point): Scenario {
  return updateFrame(s, frameIndex, (f) =>
    f.positions[id] ? { ...f, positions: { ...f.positions, [id]: { x: to.x, y: to.y } } } : f,
  );
}

/** Inserts a copy of the frame at `index` (positions only, no drawings) right after it. */
export function insertFrameAfter(s: Scenario, index: number): Scenario {
  const source = s.frames[index];
  if (!source) return s;
  const copy: Frame = {
    id: newId(),
    caption: '',
    positions: structuredClone(source.positions),
    drawings: [],
  };
  const frames = [...s.frames];
  frames.splice(index + 1, 0, copy);
  return { ...s, frames };
}

export function removeFrame(s: Scenario, index: number): Scenario {
  if (s.frames.length <= 1 || !s.frames[index]) return s;
  return { ...s, frames: s.frames.filter((_, i) => i !== index) };
}

export function moveFrame(s: Scenario, from: number, to: number): Scenario {
  if (!s.frames[from] || to < 0 || to >= s.frames.length || from === to) return s;
  const frames = [...s.frames];
  const [frame] = frames.splice(from, 1);
  frames.splice(to, 0, frame!);
  return { ...s, frames };
}

export function setCaption(s: Scenario, frameIndex: number, caption: string): Scenario {
  return updateFrame(s, frameIndex, (f) => ({ ...f, caption }));
}

export function addDrawing(s: Scenario, frameIndex: number, drawing: Drawing): Scenario {
  return updateFrame(s, frameIndex, (f) => ({ ...f, drawings: [...f.drawings, drawing] }));
}

export function removeDrawing(s: Scenario, frameIndex: number, id: string): Scenario {
  return updateFrame(s, frameIndex, (f) => ({
    ...f,
    drawings: f.drawings.filter((d) => d.id !== id),
  }));
}

export type ScenarioMeta = Pick<
  Scenario,
  'title' | 'description' | 'phase' | 'principle' | 'focusPositions' | 'guides'
>;

export function updateMeta(s: Scenario, patch: Partial<ScenarioMeta>): Scenario {
  return { ...s, ...patch };
}

/** Deep copy with fresh ids, for "duplicate scenario". */
export function duplicateScenario(s: Scenario, now = new Date()): Scenario {
  const ids = new Map<string, string>();
  const remap = (id: string) => {
    if (id === BALL_ID) return id;
    if (!ids.has(id)) ids.set(id, newId());
    return ids.get(id)!;
  };
  const stamp = now.toISOString();
  return {
    ...structuredClone(s),
    id: newId(),
    title: `${s.title} (kopia)`,
    entities: s.entities.map((e) => ({ ...e, id: remap(e.id) })),
    frames: s.frames.map((f) => ({
      ...structuredClone(f),
      id: newId(),
      positions: Object.fromEntries(
        Object.entries(f.positions).map(([id, p]) => [remap(id), { ...p }]),
      ),
    })),
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
}

/**
 * Positions between two frames at progress t (0..1, eased).
 * Entities missing in one of the frames keep the position they have in the other.
 */
export function interpolatePositions(a: Frame, b: Frame, t: number): Record<string, Point> {
  const k = easeInOut(t);
  const result: Record<string, Point> = {};
  for (const id of new Set([...Object.keys(a.positions), ...Object.keys(b.positions)])) {
    const from = a.positions[id] ?? b.positions[id]!;
    const to = b.positions[id] ?? from;
    result[id] = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
  }
  return result;
}
