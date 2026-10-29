import { BALL_OFFSET } from '../domain/movement';
import { BALL_ID, createScenario, insertFrameAfter, moveEntity, players } from '../domain/scenario';

/** 4-2-3-1 (home, blue, attacks right) against 4-4-2, ball at centre back no. 3, step 1 plus one empty step. */
export function createSetup() {
  let s = createScenario({ title: 'Prototyp', homeFormation: '4-2-3-1', awayFormation: '4-4-2' });
  const centreBack = players(s, 'home').find((p) => p.number === 3)!;
  const at = s.frames[0]!.positions[centreBack.id]!;
  s = moveEntity(s, 0, BALL_ID, { x: at.x + BALL_OFFSET, y: at.y });
  return insertFrameAfter(s, 0);
}
