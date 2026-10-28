import { PHASES, type Drawing, type Entity, type Frame, type Point, type Scenario } from '../domain/types';

/** Narrow runtime checks for data from localStorage or imported files. Returns null when invalid. */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function point(v: unknown): Point | null {
  return isObj(v) && isNum(v.x) && isNum(v.y) ? { x: v.x, y: v.y } : null;
}

function entity(v: unknown): Entity | null {
  if (!isObj(v) || !isStr(v.id)) return null;
  if (v.kind === 'ball') return { id: v.id, kind: 'ball' };
  if (v.kind === 'player' && (v.team === 'home' || v.team === 'away') && isNum(v.number)) {
    return { id: v.id, kind: 'player', team: v.team, number: v.number, label: isStr(v.label) ? v.label : '' };
  }
  return null;
}

function drawing(v: unknown): Drawing | null {
  if (!isObj(v) || !isStr(v.id)) return null;
  if (v.type === 'zone') {
    const origin = point(v.origin);
    if (!origin || !isNum(v.width) || !isNum(v.height)) return null;
    return { id: v.id, type: 'zone', origin, width: v.width, height: v.height };
  }
  if (v.type === 'run' || v.type === 'pass' || v.type === 'dribble' || v.type === 'press') {
    const from = point(v.from);
    const to = point(v.to);
    if (!from || !to) return null;
    return { id: v.id, type: v.type, from, to };
  }
  return null;
}

function frame(v: unknown): Frame | null {
  if (!isObj(v) || !isStr(v.id) || !isObj(v.positions) || !Array.isArray(v.drawings)) return null;
  const positions: Record<string, Point> = {};
  for (const [id, p] of Object.entries(v.positions)) {
    const parsed = point(p);
    if (!parsed) return null;
    positions[id] = parsed;
  }
  const drawings = v.drawings.map(drawing);
  if (drawings.some((d) => d === null)) return null;
  return { id: v.id, caption: isStr(v.caption) ? v.caption : '', positions, drawings: drawings as Drawing[] };
}

export function parseScenario(v: unknown): Scenario | null {
  if (!isObj(v) || v.schemaVersion !== 1 || !isStr(v.id) || !isStr(v.title)) return null;
  if (!Array.isArray(v.entities) || !Array.isArray(v.frames) || v.frames.length === 0) return null;
  const phase = PHASES.find((p) => p.id === v.phase)?.id;
  if (!phase) return null;
  const entities = v.entities.map(entity);
  const frames = v.frames.map(frame);
  if (entities.some((e) => e === null) || frames.some((f) => f === null)) return null;
  const now = new Date().toISOString();
  return {
    id: v.id,
    schemaVersion: 1,
    title: v.title,
    description: isStr(v.description) ? v.description : '',
    phase,
    principle: isStr(v.principle) ? v.principle : '',
    focusPositions: Array.isArray(v.focusPositions) ? v.focusPositions.filter(isStr) : [],
    entities: entities as Entity[],
    frames: frames as Frame[],
    createdAt: isStr(v.createdAt) ? v.createdAt : now,
    updatedAt: isStr(v.updatedAt) ? v.updatedAt : now,
  };
}
