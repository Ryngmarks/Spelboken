import type { ArrowDrawing, ArrowType, PlayerEntity, Point, Scenario } from './types';

export const BALL_FOLLOWS = true;
export const MOVE_THRESHOLD = 2;
export const BALL_HOLDER_DISTANCE = 1.5;
export const BALL_OFFSET = 0.8;

export interface MoveCommand {
  entityId: string;
  to: Point;
  arrowId: string;
  newFrameId?: string;
  targetId?: string;
}

function distance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function ballHolder(scenario: Scenario, frameIndex: number): PlayerEntity | undefined {
  const frame = scenario.frames[frameIndex];
  const ball = scenario.entities.find((entity) => entity.kind === 'ball');
  const at = ball && frame && positionOf(frame.positions, ball.id);
  if (!frame || !at) return undefined;
  return scenario.entities
    .filter((entity): entity is PlayerEntity => entity.kind === 'player')
    .filter((player) => positionOf(frame.positions, player.id) && distance(at, frame.positions[player.id]!) <= BALL_HOLDER_DISTANCE)
    .sort((first, second) => distance(at, frame.positions[first.id]!) - distance(at, frame.positions[second.id]!))[0];
}

export function arrowTypeFor(scenario: Scenario, frameIndex: number, entityId: string): ArrowType {
  if (scenario.entities.find((entity) => entity.id === entityId)?.kind === 'ball') return 'pass';
  return ballHolder(scenario, frameIndex)?.id === entityId ? 'dribble' : 'run';
}

/** Own-property lookup, so ids like "constructor" from a hostile import never hit Object.prototype. */
function positionOf(positions: Record<string, Point>, id: string): Point | undefined {
  return Object.hasOwn(positions, id) ? positions[id] : undefined;
}

function beside(player: PlayerEntity, at: Point): Point {
  return { x: at.x + (player.team === 'home' ? BALL_OFFSET : -BALL_OFFSET), y: at.y };
}

function unlink(arrow: ArrowDrawing): ArrowDrawing {
  const { entityId: _entityId, targetId: _targetId, ...free } = arrow;
  return free;
}

export function reconcileLinks(scenario: Scenario, ballFollows: boolean = BALL_FOLLOWS): Scenario {
  const entities = new Map(scenario.entities.map((entity) => [entity.id, entity]));
  const ball = scenario.entities.find((entity) => entity.kind === 'ball');
  const frames = scenario.frames.map((frame) => ({ ...frame, positions: { ...frame.positions }, drawings: [...frame.drawings] }));
  frames.forEach((frame, index) => {
    const next = frames[index + 1];
    const linked = new Set<string>();
    frame.drawings = frame.drawings.map((drawing) => {
      if (drawing.type === 'zone') return drawing;
      if (!drawing.entityId) return drawing.targetId ? unlink(drawing) : drawing;
      if (!next || !entities.has(drawing.entityId) || !positionOf(frame.positions, drawing.entityId) ||
          !positionOf(next.positions, drawing.entityId) || linked.has(drawing.entityId)) return unlink(drawing);
      linked.add(drawing.entityId);
      const target = drawing.targetId && entities.get(drawing.targetId);
      const holder = drawing.targetId ? ballHolder({ ...scenario, frames }, index) : undefined;
      if (drawing.targetId && (drawing.type !== 'pass' || entities.get(drawing.entityId)?.kind !== 'ball' ||
          !target || target.kind !== 'player' || !positionOf(next.positions, target.id) || (holder && holder.team !== target.team))) {
        const { targetId: _targetId, ...withoutTarget } = drawing;
        return withoutTarget;
      }
      return drawing;
    });
    if (!next) return;
    const arrows = frame.drawings.filter((drawing): drawing is ArrowDrawing => drawing.type !== 'zone' && !!drawing.entityId);
    if (ballFollows && ball && positionOf(next.positions, ball.id)) {
      const pass = arrows.find((arrow) => arrow.entityId === ball.id);
      const carrier = arrows.find((arrow) => arrow.type === 'dribble' && entities.get(arrow.entityId!)?.kind === 'player');
      const player = entities.get(pass?.targetId ?? (!pass ? carrier?.entityId ?? '' : ''));
      if (player?.kind === 'player' && positionOf(next.positions, player.id)) next.positions[ball.id] = beside(player, next.positions[player.id]!);
    }
    frame.drawings = frame.drawings.map((drawing) => drawing.type !== 'zone' && drawing.entityId
      ? { ...drawing, from: { ...frame.positions[drawing.entityId]! }, to: { ...next.positions[drawing.entityId]! } }
      : drawing);
  });
  return { ...scenario, frames };
}

export function planMove(
  scenario: Scenario,
  frameIndex: number,
  command: MoveCommand,
  ballFollows: boolean = BALL_FOLLOWS,
): Scenario {
  const source = scenario.frames[frameIndex];
  const entity = scenario.entities.find((candidate) => candidate.id === command.entityId);
  const from = source && positionOf(source.positions, command.entityId);
  if (!source || !entity || !from || !Number.isFinite(command.to.x) || !Number.isFinite(command.to.y)) return scenario;
  const frames = scenario.frames.map((frame) => ({ ...frame, positions: { ...frame.positions }, drawings: [...frame.drawings] }));
  if (!frames[frameIndex + 1]) frames.push({
    id: command.newFrameId ?? 'frame-' + command.arrowId, caption: '',
    positions: structuredClone(source.positions), drawings: [],
  });
  const current = frames[frameIndex]!;
  const next = frames[frameIndex + 1]!;
  const type = arrowTypeFor(scenario, frameIndex, entity.id);
  const existing = current.drawings.find((drawing) => drawing.type !== 'zone' && drawing.entityId === entity.id);
  current.drawings = current.drawings.filter((drawing) => drawing.type === 'zone' || drawing.entityId !== entity.id);
  const short = distance(from, command.to) < MOVE_THRESHOLD;
  next.positions[entity.id] = { ...command.to };
  if (!short) {
    const arrow: ArrowDrawing = {
      id: existing?.id ?? command.arrowId,
      type: existing?.type === 'press' && type === 'run' ? 'press' : type,
      from: { ...from }, to: { ...command.to }, entityId: entity.id,
    };
    if (type === 'pass' && command.targetId) arrow.targetId = command.targetId;
    if (type === 'pass' && !ballFollows) {
      current.drawings.push(unlink(arrow));
    } else current.drawings.push(arrow);
  } else if (type === 'dribble' && ballFollows) {
    const ball = scenario.entities.find((candidate) => candidate.kind === 'ball');
    if (ball && entity.kind === 'player') next.positions[ball.id] = beside(entity, command.to);
  }
  return reconcileLinks({ ...scenario, frames }, ballFollows);
}

export function removeLinkedMove(scenario: Scenario, frameIndex: number, arrowId: string): Scenario {
  const frame = scenario.frames[frameIndex];
  const arrow = frame?.drawings.find((drawing): drawing is ArrowDrawing => drawing.type !== 'zone' && drawing.id === arrowId && !!drawing.entityId);
  const next = scenario.frames[frameIndex + 1];
  if (!frame || !arrow || !next) return scenario;
  const frames = scenario.frames.map((current, index) => {
    if (index === frameIndex) return { ...current, drawings: current.drawings.filter((drawing) => drawing.id !== arrowId) };
    if (index !== frameIndex + 1) return current;
    const positions = { ...current.positions, [arrow.entityId!]: { ...frame.positions[arrow.entityId!]! } };
    const ball = scenario.entities.find((entity) => entity.kind === 'ball');
    if (arrow.type === 'dribble' && ball && frame.positions[ball.id]) positions[ball.id] = { ...frame.positions[ball.id]! };
    return { ...current, positions };
  });
  return reconcileLinks({ ...scenario, frames });
}
