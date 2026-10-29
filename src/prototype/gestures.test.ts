import { describe, expect, it } from 'vitest';
import { BALL_ID, players } from '../domain/scenario';
import { applyDrag, planDrag } from './gestures';
import { createSetup } from './setup';
import { endTask, createLog, isWrongPick, record, startTask, summarize } from './eventLog';

const home = (s: ReturnType<typeof createSetup>, n: number) => players(s, 'home').find((p) => p.number === n)!;

describe('prototype gestures', () => {
  it('sets up two steps, ball at centre back 3', () => {
    const s = createSetup();
    expect(s.frames).toHaveLength(2);
    expect(s.frames[0]!.positions[BALL_ID]!.x).toBeGreaterThan(s.frames[0]!.positions[home(s, 3).id]!.x);
  });

  it('A (forward-plan in step 1) and B (keyframe in step 2) write the same data for a run', () => {
    const s = createSetup();
    const eight = home(s, 8).id;
    const to = { x: 70, y: 20 };
    const a = applyDrag(s, planDrag(s, 'a', 'move', 0, eight), eight, to);
    const b = applyDrag(s, planDrag(s, 'b', 'select', 1, eight), eight, to);
    const strip = (x: typeof a) => ({
      positions: x.frames.map((f) => f.positions),
      arrows: x.frames.map((f) => f.drawings.map(({ id: _id, ...d }) => d)),
    });
    expect(strip(a)).toEqual(strip(b));
    expect(a.frames[0]!.drawings).toHaveLength(1);
    expect(a.frames[1]!.positions[eight]).toEqual(to);
  });

  it('a ball drag onto a team-mate is a pass and the ball follows him (both variants)', () => {
    const s = createSetup();
    const six = home(s, 6).id;
    const planA = planDrag(s, 'a', 'move', 0, BALL_ID);
    expect(planA).toMatchObject({ mode: 'linked', kind: 'pass' });
    const a = applyDrag(s, planA, BALL_ID, { x: 30, y: 27 }, six);
    const b = applyDrag(s, planDrag(s, 'b', 'select', 1, BALL_ID), BALL_ID, { x: 30, y: 27 }, six);
    expect(a.frames[0]!.drawings[0]).toMatchObject({ type: 'pass', entityId: BALL_ID, targetId: six });
    expect(a.frames[1]!.positions[BALL_ID]).toEqual(b.frames[1]!.positions[BALL_ID]);
    expect(Math.hypot(a.frames[1]!.positions[BALL_ID]!.x - 30, a.frames[1]!.positions[BALL_ID]!.y - 27)).toBeLessThan(1);
  });

  it('dragging the ball holder is a dribble', () => {
    const s = createSetup();
    expect(planDrag(s, 'a', 'move', 0, home(s, 3).id)).toMatchObject({ kind: 'dribble' });
  });

  it('Flytta in step 1 is a plain move', () => {
    const s = createSetup();
    expect(planDrag(s, 'a', 'select', 0, home(s, 2).id)).toEqual({ mode: 'plain', frame: 0 });
    expect(planDrag(s, 'b', 'select', 0, home(s, 2).id)).toEqual({ mode: 'plain', frame: 0 });
  });

  it('WO-04 m3: a manual ball drag in a step controlled by a pass re-targets that pass instead of snapping back', () => {
    const s = createSetup();
    const six = home(s, 6).id;
    const passed = applyDrag(s, planDrag(s, 'a', 'move', 0, BALL_ID), BALL_ID, { x: 30, y: 27 }, six);
    const plan = planDrag(passed, 'a', 'select', 1, BALL_ID);
    expect(plan).toMatchObject({ mode: 'linked', owner: 0 });
    const moved = applyDrag(passed, plan, BALL_ID, { x: 50, y: 10 });
    expect(moved.frames[1]!.positions[BALL_ID]).toEqual({ x: 50, y: 10 });
    expect(moved.frames[0]!.drawings[0]).not.toHaveProperty('targetId');
  });
});

describe('event log', () => {
  it('summarises a task run and flags wrong picks', () => {
    const log = createLog('a');
    startTask(log, 'T1');
    record(log, 'drag', { wrong: isWrongPick(log.task, { kind: 'player', team: 'home', number: 5 }) });
    record(log, 'undo', { quick: true });
    record(log, 'drag', { wrong: isWrongPick(log.task, { kind: 'player', team: 'home', number: 2 }) });
    endTask(log);
    const [row] = summarize(log.events);
    expect(row).toMatchObject({ task: 'T1', drags: 2, undos: 1, quickUndos: 1, wrongPicks: 1, actions: 3 });
  });
});
