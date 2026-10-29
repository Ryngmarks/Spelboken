import { describe, expect, it } from 'vitest';
import { BALL_FOLLOWS, arrowTypeFor, ballHolder, planMove, reconcileLinks, removeLinkedMove } from './movement';
import { addDrawing, applyFormation, createScenario, duplicateScenario, insertFrameAfter, moveEntity, moveFrame, removeDrawing, removeEntity, removeFrame, updatePlayer } from './scenario';
import type { ArrowDrawing, Scenario } from './types';

function setup(): Scenario {
  const base = createScenario();
  return {
    ...base,
    entities: [
      ...base.entities,
      { id: 'carrier', kind: 'player', team: 'home', number: 4, label: 'MB' },
      { id: 'receiver', kind: 'player', team: 'home', number: 6, label: 'DM' },
      { id: 'away', kind: 'player', team: 'away', number: 9, label: 'CF' },
    ],
    frames: [{ ...base.frames[0]!, positions: {
      ball: { x: 10.8, y: 10 }, carrier: { x: 10, y: 10 },
      receiver: { x: 30, y: 20 }, away: { x: 70, y: 20 },
    } }],
  };
}

function run(scenario = setup()): Scenario {
  return planMove(scenario, 0, { entityId: 'receiver', to: { x: 40, y: 25 }, arrowId: 'run', newFrameId: 'next' });
}

function pass(scenario = setup()): Scenario {
  return planMove(scenario, 0, { entityId: 'ball', to: { x: 30, y: 20 }, targetId: 'receiver', arrowId: 'pass' });
}

function checkLinks(scenario: Scenario): void {
  scenario.frames.forEach((frame, index) => {
    const ids = new Set<string>();
    for (const drawing of frame.drawings) {
      if (drawing.type === 'zone' || !drawing.entityId) continue;
      expect(ids.has(drawing.entityId)).toBe(false);
      ids.add(drawing.entityId);
      expect(scenario.entities.some((entity) => entity.id === drawing.entityId)).toBe(true);
      expect(drawing.from).toEqual(frame.positions[drawing.entityId]);
      expect(drawing.to).toEqual(scenario.frames[index + 1]!.positions[drawing.entityId]);
      if (drawing.targetId) {
        expect(drawing.type).toBe('pass');
        expect(scenario.entities.some((entity) => entity.id === drawing.targetId && entity.kind === 'player')).toBe(true);
      }
    }
  });
  expect(reconcileLinks(scenario)).toEqual(scenario);
}

describe('movement planning', () => {
  it('creates the next frame without changing its input or later steps', () => {
    const base = setup();
    const snapshot = structuredClone(base);
    const planned = run(base);
    expect(base).toEqual(snapshot);
    expect(run(base)).toEqual(planned);
    expect(planned.frames[1]).toMatchObject({ id: 'next', caption: '', drawings: [] });
    expect(planned.frames[0]!.positions.receiver).toEqual({ x: 30, y: 20 });
    expect(planned.frames[0]!.drawings[0]).toMatchObject({ type: 'run', entityId: 'receiver', to: { x: 40, y: 25 } });
    const extended = insertFrameAfter(planned, 1);
    const updated = planMove(extended, 0, { entityId: 'receiver', to: { x: 50, y: 30 }, arrowId: 'updated' });
    expect(updated.frames).toHaveLength(3);
    expect(updated.frames[2]).toEqual(extended.frames[2]);
    expect(updated.frames[0]!.drawings).toHaveLength(1);
    expect(updated.frames[0]!.drawings[0]!.id).toBe('run');
    checkLinks(updated);
  });

  it.each([0, 1.999, 2])('uses the two-metre threshold at %s metres', (length) => {
    const planned = planMove(run(), 0, { entityId: 'receiver', to: { x: 30 + length, y: 20 }, arrowId: 'new' });
    expect(planned.frames[0]!.drawings).toHaveLength(length < 2 ? 0 : 1);
    expect(planned.frames[1]!.positions.receiver).toEqual({ x: 30 + length, y: 20 });
  });

  it('classifies passes, dribbles and runs by the source frame', () => {
    const base = setup();
    expect(ballHolder(base, 0)?.id).toBe('carrier');
    expect(arrowTypeFor(base, 0, 'ball')).toBe('pass');
    expect(arrowTypeFor(base, 0, 'carrier')).toBe('dribble');
    expect(arrowTypeFor(base, 0, 'receiver')).toBe('run');
    expect(ballHolder(moveEntity(base, 0, 'ball', { x: 11.5, y: 10 }), 0)?.id).toBe('carrier');
    expect(ballHolder(moveEntity(base, 0, 'ball', { x: 11.501, y: 10 }), 0)).toBeUndefined();
    expect(ballHolder(base, 10)).toBeUndefined();
  });

  it('attaches a pass to the receiver in the next frame and follows later edits', () => {
    const planned = pass(run());
    expect(planned.frames[1]!.positions.ball).toEqual({ x: 40.8, y: 25 });
    expect(planned.frames[0]!.drawings[1]).toMatchObject({ entityId: 'ball', targetId: 'receiver', type: 'pass' });
    const changed = moveEntity(planned, 1, 'receiver', { x: 60, y: 15 });
    expect(changed.frames[1]!.positions.ball).toEqual({ x: 60.8, y: 15 });
    checkLinks(changed);
  });

  it('passes into space without a receiver', () => {
    const planned = planMove(setup(), 0, { entityId: 'ball', to: { x: 40, y: 40 }, arrowId: 'space' });
    expect(planned.frames[1]!.positions.ball).toEqual({ x: 40, y: 40 });
    expect(planned.frames[0]!.drawings[0]).not.toHaveProperty('targetId');
  });

  it('does not bind a pass to an opponent of the current holder', () => {
    const planned = planMove(setup(), 0, { entityId: 'ball', to: { x: 70, y: 20 }, targetId: 'away', arrowId: 'space' });
    expect(planned.frames[1]!.positions.ball).toEqual({ x: 70, y: 20 });
    expect(planned.frames[0]!.drawings[0]).not.toHaveProperty('targetId');
  });

  it('follows an away-team receiver toward the away attacking direction', () => {
    const base = updatePlayer(updatePlayer(setup(), 'carrier', { team: 'away' }), 'receiver', { team: 'away' });
    expect(pass(base).frames[1]!.positions.ball).toEqual({ x: 29.2, y: 20 });
  });

  it.each(['home', 'away'] as const)('dribbles in the %s attacking direction', (team) => {
    const base = updatePlayer(setup(), 'carrier', { team });
    const planned = planMove(base, 0, { entityId: 'carrier', to: { x: 20, y: 30 }, arrowId: 'dribble' });
    expect(planned.frames[1]!.positions.ball).toEqual({ x: team === 'home' ? 20.8 : 19.2, y: 30 });
    expect(planned.frames[0]!.drawings[0]).toMatchObject({ type: 'dribble' });
    const edited = moveEntity(planned, 1, 'carrier', { x: 25, y: 20 });
    expect(edited.frames[1]!.positions.ball!.x).toBeCloseTo(team === 'home' ? 25.8 : 24.2);
    const removed = removeLinkedMove(edited, 0, 'dribble');
    expect(removed.frames[1]!.positions.carrier).toEqual(base.frames[0]!.positions.carrier);
    expect(removed.frames[1]!.positions.ball).toEqual(base.frames[0]!.positions.ball);
  });

  it('lets an explicit pass override dribbling in the same transition', () => {
    const dribble = planMove(setup(), 0, { entityId: 'carrier', to: { x: 20, y: 30 }, arrowId: 'dribble' });
    expect(pass(dribble).frames[1]!.positions.ball).toEqual({ x: 30.8, y: 20 });
  });

  it('supports disabling automatic ball movement without breaking linked geometry', () => {
    expect(BALL_FOLLOWS).toBe(true);
    const base = setup();
    const planned = planMove(base, 0, { entityId: 'ball', to: { x: 30, y: 20 }, targetId: 'receiver', arrowId: 'manual' }, false);
    expect(planned.frames[1]!.positions.ball).toEqual(base.frames[0]!.positions.ball);
    expect(planned.frames[0]!.drawings[0]).toEqual({ id: 'manual', type: 'pass', from: { x: 10.8, y: 10 }, to: { x: 30, y: 20 } });
    const dribble = planMove(base, 0, { entityId: 'carrier', to: { x: 20, y: 20 }, arrowId: 'dribble' }, false);
    expect(dribble.frames[1]!.positions.ball).toEqual(base.frames[0]!.positions.ball);
    const manual = pass();
    manual.frames[1]!.positions.ball = { x: 10.8, y: 10 };
    expect(reconcileLinks(manual, false).frames[1]!.positions.ball).toEqual({ x: 10.8, y: 10 });
    expect(reconcileLinks(manual, true).frames[1]!.positions.ball).toEqual({ x: 30.8, y: 20 });
    expect(planMove(base, 0, { entityId: 'ball', to: { x: 11, y: 10 }, arrowId: 'short' }, false).frames[1]!.positions.ball).toEqual(base.frames[0]!.positions.ball);
  });

  it('moves the ball with a short dribble even though no arrow is created', () => {
    const planned = planMove(setup(), 0, { entityId: 'carrier', to: { x: 11, y: 10 }, arrowId: 'short' });
    expect(planned.frames[0]!.drawings).toEqual([]);
    expect(planned.frames[1]!.positions.ball).toEqual({ x: 11.8, y: 10 });
  });

  it.each(['run', 'pass'])('removes a linked %s through the existing drawing API', (type) => {
    const base = type === 'run' ? run() : pass();
    const entityId = type === 'run' ? 'receiver' : 'ball';
    const removed = removeDrawing(base, 0, type);
    expect(removed.frames[0]!.drawings).toEqual([]);
    expect(removed.frames[1]!.positions[entityId]).toEqual(base.frames[0]!.positions[entityId]);
    expect(removeLinkedMove(base, 0, 'absent')).toBe(base);
  });

  it('keeps a press override when adjusting a linked run', () => {
    const base = run();
    (base.frames[0]!.drawings[0] as ArrowDrawing).type = 'press';
    expect(run(base).frames[0]!.drawings[0]!.type).toBe('press');
  });

  it('ignores invalid commands', () => {
    const base = setup();
    for (const command of [
      { entityId: 'missing', to: { x: 1, y: 1 }, arrowId: 'bad' },
      { entityId: 'ball', to: { x: NaN, y: 1 }, arrowId: 'bad' },
      { entityId: 'ball', to: { x: 1, y: Infinity }, arrowId: 'bad' },
    ]) expect(planMove(base, 0, command)).toBe(base);
    expect(planMove(base, -1, { entityId: 'ball', to: { x: 1, y: 1 }, arrowId: 'bad' })).toBe(base);
  });
});

describe('link invariants', () => {
  it('reconciles both sides when a middle frame is removed or reordered', () => {
    const base = planMove(pass(run()), 1, { entityId: 'receiver', to: { x: 50, y: 30 }, arrowId: 'dribble' });
    for (const updated of [removeFrame(base, 1), moveFrame(base, 1, 2), insertFrameAfter(base, 1)]) checkLinks(updated);
  });

  it('unlinks missing endpoint positions without losing geometry', () => {
    const base = run();
    const arrow = base.frames[0]!.drawings[0] as ArrowDrawing;
    for (const index of [0, 1]) {
      const missing = structuredClone(base);
      delete missing.frames[index]!.positions.receiver;
      expect(reconcileLinks(missing).frames[0]!.drawings[0]).toEqual({ id: 'run', type: 'run', from: arrow.from, to: arrow.to });
    }
  });

  it.each([
    ['insert frame', (scenario: Scenario) => insertFrameAfter(scenario, 0)],
    ['remove destination', (scenario: Scenario) => removeFrame(scenario, 1)],
    ['remove source', (scenario: Scenario) => removeFrame(scenario, 0)],
    ['move source to last', (scenario: Scenario) => moveFrame(scenario, 0, 1)],
    ['remove mover', (scenario: Scenario) => removeEntity(scenario, 'ball')],
    ['remove receiver', (scenario: Scenario) => removeEntity(scenario, 'receiver')],
    ['replace formation', (scenario: Scenario) => applyFormation(scenario, 'home', '4-3-3')],
    ['duplicate', (scenario: Scenario) => duplicateScenario(scenario)],
  ] as const)('preserves invariants after %s', (_name, operation) => {
    const base = pass(run());
    const snapshot = structuredClone(base);
    checkLinks(operation(base));
    expect(base).toEqual(snapshot);
  });

  it('remaps movers and pass receivers on duplicate', () => {
    const base = pass(run());
    const copy = duplicateScenario(base);
    const receiver = copy.entities.find((entity) => entity.kind === 'player' && entity.number === 6)!;
    expect(receiver.id).not.toBe('receiver');
    expect(copy.frames[0]!.drawings[0]).toMatchObject({ entityId: receiver.id });
    expect(copy.frames[0]!.drawings[1]).toMatchObject({ entityId: 'ball', targetId: receiver.id });
    expect(copy.frames[0]!.drawings[0]!.id).not.toBe(base.frames[0]!.drawings[0]!.id);
  });

  it('turns orphaned and duplicate links into free arrows with unchanged geometry', () => {
    const base = pass();
    const arrow = base.frames[0]!.drawings[0] as ArrowDrawing;
    const duplicate = addDrawing(base, 0, { ...arrow, id: 'duplicate' });
    expect(duplicate.frames[0]!.drawings[1]).toEqual({ id: 'duplicate', type: 'pass', from: arrow.from, to: arrow.to });
    const orphan = removeFrame(base, 1);
    expect(orphan.frames[0]!.drawings[0]).toEqual({ id: arrow.id, type: 'pass', from: arrow.from, to: arrow.to });
    expect(removeEntity(base, 'ball').frames[0]!.drawings[0]).toEqual(orphan.frames[0]!.drawings[0]);
  });

  it('leaves free arrows and zones unchanged', () => {
    const base = run();
    const drawings = [
      { id: 'free', type: 'run' as const, from: { x: 1, y: 2 }, to: { x: 3, y: 4 } },
      { id: 'zone', type: 'zone' as const, origin: { x: 5, y: 6 }, width: 7, height: 8 },
    ];
    base.frames[1]!.drawings.push(...drawings);
    expect(reconcileLinks(base).frames[1]!.drawings).toEqual(drawings);
  });
});
