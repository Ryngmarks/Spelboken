import { BALL_ID, createScenario, insertFrameAfter, moveEntity, newId, players, setCaption, updateMeta } from './scenario';
import type { ArrowType, Point, Scenario, Team } from './types';

type Placement = [team: Team, number: number, at: Point];

/** A demo scenario so new users immediately see what the app can do. */
export function sampleBuildUp(): Scenario {
  let s = createScenario({ title: 'Uppspel via ytterback', homeFormation: '4-3-3', awayFormation: '4-4-2' });
  s = updateMeta(s, {
    phase: 'build-up',
    principle: 'Spela runt första pressen',
    description: 'Vi lockar motståndarens anfallare till mittbacken och spelar runt dem via ytterbacken.',
    focusPositions: ['MV', 'MB', 'VB', 'DM', 'CM'],
  });

  const id = (team: Team, number: number) => players(s, team).find((p) => p.number === number)!.id;
  const place = (frame: number, list: Placement[], ball: Point) => {
    for (const [team, number, at] of list) s = moveEntity(s, frame, id(team, number), at);
    s = moveEntity(s, frame, BALL_ID, ball);
  };
  const arrow = (frame: number, type: ArrowType, from: Point, to: Point) => {
    const f = s.frames[frame]!;
    s.frames[frame] = { ...f, drawings: [...f.drawings, { id: newId(), type, from, to }] };
  };

  // Step 1: goalkeeper in possession, opponents press high.
  place(
    0,
    [
      ['home', 1, { x: 5, y: 34 }],
      ['home', 2, { x: 26, y: 6 }],
      ['home', 3, { x: 12, y: 20 }],
      ['home', 4, { x: 12, y: 48 }],
      ['home', 5, { x: 26, y: 62 }],
      ['home', 6, { x: 24, y: 34 }],
      ['home', 7, { x: 38, y: 24 }],
      ['home', 8, { x: 38, y: 44 }],
      ['home', 9, { x: 55, y: 6 }],
      ['home', 10, { x: 60, y: 34 }],
      ['home', 11, { x: 55, y: 62 }],
      ['away', 1, { x: 101, y: 34 }],
      ['away', 2, { x: 62, y: 60 }],
      ['away', 3, { x: 65, y: 42 }],
      ['away', 4, { x: 65, y: 26 }],
      ['away', 5, { x: 62, y: 8 }],
      ['away', 6, { x: 42, y: 56 }],
      ['away', 7, { x: 33, y: 47 }],
      ['away', 8, { x: 33, y: 21 }],
      ['away', 9, { x: 40, y: 12 }],
      ['away', 10, { x: 22, y: 40 }],
      ['away', 11, { x: 22, y: 28 }],
    ],
    { x: 6.5, y: 35 },
  );
  arrow(0, 'pass', { x: 5, y: 34 }, { x: 12, y: 20 });
  s = setCaption(s, 0, 'Målvakten har bollen. Mittbackarna går isär, ytterbackarna står högt och brett.');

  // Step 2: centre back on the ball, full back shows, opponent presses.
  s = insertFrameAfter(s, 0);
  place(
    1,
    [
      ['home', 2, { x: 28, y: 7 }],
      ['home', 6, { x: 22, y: 31 }],
      ['away', 11, { x: 17, y: 23 }],
      ['away', 10, { x: 20, y: 38 }],
      ['away', 9, { x: 38, y: 11 }],
    ],
    { x: 13.2, y: 21.5 },
  );
  arrow(1, 'pass', { x: 12, y: 20 }, { x: 28, y: 7 });
  arrow(1, 'press', { x: 38, y: 11 }, { x: 32, y: 8 });
  arrow(1, 'run', { x: 38, y: 24 }, { x: 44, y: 16 });
  s = setCaption(s, 1, 'Anfallaren pressar mittbacken. Spela direkt ut till ytterbacken innan pressen hinner fram.');

  // Step 3: full back on the ball, play forward.
  s = insertFrameAfter(s, 1);
  place(
    2,
    [
      ['home', 7, { x: 44, y: 16 }],
      ['home', 9, { x: 62, y: 10 }],
      ['away', 9, { x: 33, y: 9 }],
      ['away', 8, { x: 38, y: 21 }],
      ['away', 11, { x: 20, y: 18 }],
    ],
    { x: 29.4, y: 8.2 },
  );
  arrow(2, 'pass', { x: 28, y: 7 }, { x: 44, y: 16 });
  arrow(2, 'run', { x: 62, y: 10 }, { x: 74, y: 5 });
  s.frames[2] = {
    ...s.frames[2]!,
    drawings: [...s.frames[2]!.drawings, { id: newId(), type: 'zone', origin: { x: 40, y: 11 }, width: 13, height: 12 }],
  };
  s = setCaption(s, 2, 'Ytterbacken är fri. Spela in till mittfältaren som är rättvänd i ytan mellan lagdelarna. Yttern djupled.');

  return s;
}
