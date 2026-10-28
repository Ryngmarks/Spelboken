import { PITCH_WIDTH } from './pitch';
import { BALL_ID, newId } from './scenario';
import type { ArrowType, Drawing, Entity, Frame, Point, Scenario } from './types';

/**
 * Generated build-up suggestions: our 3+1 build-up (three centre backs in the three central corridors,
 * a 6 behind the opponent's first press line, wing backs high and wide on the halfway line) against a
 * 4-2-3-1 high press. Each pattern answers one way the opponent can press, on both sides of the pitch.
 */

type Home = 'gk' | 'lcb' | 'cb' | 'rcb' | 'six' | 'lwb' | 'rwb' | 'l8' | 'r8' | 'lf' | 'rf';
/** Opponents named from our point of view: "l" is on our left (small y). */
type Away = 'ogk' | 'olb' | 'olcb' | 'orcb' | 'orb' | 'ol6' | 'or6' | 'o10' | 'olw' | 'orw' | 'o9';
type Key = Home | Away;

interface Slot {
  team: 'home' | 'away';
  number: number;
  label: string;
}

const SLOTS: Record<Key, Slot> = {
  gk: { team: 'home', number: 1, label: 'MV' },
  lcb: { team: 'home', number: 5, label: 'MB' },
  cb: { team: 'home', number: 4, label: 'MB' },
  rcb: { team: 'home', number: 3, label: 'MB' },
  six: { team: 'home', number: 6, label: 'DM' },
  lwb: { team: 'home', number: 7, label: 'VB' },
  rwb: { team: 'home', number: 2, label: 'HB' },
  l8: { team: 'home', number: 8, label: 'CM' },
  r8: { team: 'home', number: 10, label: 'CM' },
  lf: { team: 'home', number: 9, label: 'CF' },
  rf: { team: 'home', number: 11, label: 'CF' },
  // Opponent 4-2-3-1. Their right side is on our left.
  ogk: { team: 'away', number: 1, label: 'MV' },
  olb: { team: 'away', number: 2, label: 'HB' },
  olcb: { team: 'away', number: 4, label: 'MB' },
  orcb: { team: 'away', number: 5, label: 'MB' },
  orb: { team: 'away', number: 3, label: 'VB' },
  ol6: { team: 'away', number: 6, label: 'DM' },
  or6: { team: 'away', number: 8, label: 'DM' },
  o10: { team: 'away', number: 10, label: 'OM' },
  olw: { team: 'away', number: 7, label: 'HY' },
  orw: { team: 'away', number: 11, label: 'VY' },
  o9: { team: 'away', number: 9, label: 'CF' },
};

/** Starting picture. Corridor centres: outer 7 / 61, inner 19.3 / 48.7, central 34. */
const BASE: Record<Key, Point> = {
  gk: { x: 5, y: 34 },
  lcb: { x: 17, y: 19.3 },
  cb: { x: 13, y: 34 },
  rcb: { x: 17, y: 48.7 },
  six: { x: 32, y: 34 },
  lwb: { x: 52, y: 4 },
  rwb: { x: 52, y: 64 },
  l8: { x: 45, y: 20 },
  r8: { x: 45, y: 48 },
  lf: { x: 70, y: 28 },
  rf: { x: 70, y: 40 },
  ogk: { x: 100, y: 34 },
  olb: { x: 60, y: 9 },
  olcb: { x: 66, y: 27 },
  orcb: { x: 66, y: 41 },
  orb: { x: 60, y: 59 },
  ol6: { x: 41, y: 26 },
  or6: { x: 41, y: 42 },
  o10: { x: 25, y: 39 },
  olw: { x: 27, y: 12 },
  orw: { x: 27, y: 56 },
  o9: { x: 25, y: 29 },
};

/** Arrow end: a player (from = where they stand now, to = where they stand in the next step) or a point. */
type End = Key | Point;

interface StepSpec {
  moves?: Partial<Record<Key, Point>>;
  ball: Key;
  arrows: [ArrowType, End, End][];
  caption: string;
}

interface PatternSpec {
  id: string;
  title: string;
  description: string;
  focusPositions: string[];
  steps: StepSpec[];
}

const PATTERNS: PatternSpec[] = [
  {
    id: 'free-six',
    title: 'Fri 6:a bakom första presslinjen',
    description: 'Deras 10:a kliver upp på mittbacken. Då står vår 6:a fri bakom första presslinjen.',
    focusPositions: ['MB', 'DM', 'CM'],
    steps: [
      {
        moves: { o10: { x: 19, y: 37 }, o9: { x: 22, y: 26 } },
        ball: 'cb',
        arrows: [
          ['press', 'o10', { x: 15, y: 35 }],
          ['pass', 'cb', 'six'],
        ],
        caption: 'Deras 10:a pressar mittbacken och 9:an stänger mittbacken på kanten. Vår 6:a står fri bakom dem – spela in.',
      },
      {
        moves: { six: { x: 31, y: 33 }, ol6: { x: 35, y: 31 }, o10: { x: 22, y: 36 } },
        ball: 'six',
        arrows: [
          ['press', 'ol6', { x: 33, y: 32 }],
          ['run', 'l8', 'l8'],
          ['pass', 'six', 'l8'],
          ['run', 'lwb', 'lwb'],
        ],
        caption: 'Ta emot halvvänd. Deras 6:a kliver ut – 8:an glider bort från hen och är fri i innerkorridoren.',
      },
      {
        moves: { l8: { x: 45, y: 15 }, lwb: { x: 62, y: 4 }, ol6: { x: 37, y: 29 }, olb: { x: 58, y: 10 } },
        ball: 'l8',
        arrows: [
          ['run', 'lf', { x: 80, y: 17 }],
          ['pass', 'l8', { x: 78, y: 18 }],
          ['run', 'rf', { x: 84, y: 34 }],
        ],
        caption: '8:an är rättvänd mellan lagdelarna. 9:an löper i ytan mellan deras ytterback och mittback.',
      },
    ],
  },
  {
    id: 'carry',
    title: 'Mittbacken bär in i innerkorridoren',
    description: 'Deras yttrar följer våra ytterbackar. Då blir det 3 mot 2 i första linjen och ytter-mittbacken är fri.',
    focusPositions: ['MB', 'CM'],
    steps: [
      {
        moves: { olw: { x: 44, y: 7 }, olb: { x: 62, y: 10 }, o9: { x: 19, y: 31 }, o10: { x: 28, y: 36 } },
        ball: 'cb',
        arrows: [
          ['press', 'o9', { x: 15, y: 33 }],
          ['pass', 'cb', 'lcb'],
        ],
        caption: 'Deras ytter följer vår ytterback. 9:an pressar mittbacken och 10:an tar 6:an – 3 mot 2, mittbacken på bollsidan är fri.',
      },
      {
        moves: { lcb: { x: 19, y: 20 } },
        ball: 'lcb',
        arrows: [
          ['dribble', 'lcb', 'lcb'],
          ['press', 'ol6', 'ol6'],
          ['run', 'l8', 'l8'],
        ],
        caption: 'Bär bollen framåt i innerkorridoren tills någon kliver ut på dig.',
      },
      {
        moves: { lcb: { x: 33, y: 20 }, ol6: { x: 37, y: 23 }, l8: { x: 48, y: 16 } },
        ball: 'lcb',
        arrows: [
          ['pass', 'lcb', { x: 47, y: 16 }],
          ['run', 'lf', { x: 66, y: 22 }],
          ['run', 'lwb', { x: 64, y: 4 }],
        ],
        caption: 'Deras 6:a kliver ut – då är 8:an fri bakom. Spela in, 9:an kommer ner som väggspelare.',
      },
    ],
  },
  {
    id: 'wing-back',
    title: 'Ytterbacken fri på mittlinjen',
    description: 'Deras ytter pressar mittbacken inifrån. Då lämnar hen vår ytterback, och deras ytterback har långt att gå.',
    focusPositions: ['MB', 'VB', 'HB', 'CM'],
    steps: [
      {
        moves: { olw: { x: 24, y: 24 }, o9: { x: 19, y: 30 }, o10: { x: 30, y: 37 } },
        ball: 'lcb',
        arrows: [
          ['press', 'olw', { x: 20, y: 21 }],
          ['pass', 'lcb', 'lwb'],
        ],
        caption: 'Deras ytter pressar mittbacken inifrån och stänger passningen inåt. Ytterbacken på mittlinjen är fri – spela långt längs linjen.',
      },
      {
        moves: { lwb: { x: 51, y: 5 }, olw: { x: 21, y: 21 }, olb: { x: 57, y: 10 } },
        ball: 'lwb',
        arrows: [
          ['press', 'olb', 'olb'],
          ['run', 'l8', 'l8'],
          ['pass', 'lwb', 'l8'],
        ],
        caption: 'Deras ytterback måste kliva långt för att pressa. 8:an löper bakom hen längs linjen – spela i djupet.',
      },
      {
        moves: { olb: { x: 54, y: 8 }, l8: { x: 68, y: 6 }, olcb: { x: 70, y: 22 } },
        ball: 'l8',
        arrows: [
          ['dribble', 'l8', { x: 82, y: 12 }],
          ['run', 'lf', { x: 88, y: 29 }],
          ['run', 'rf', { x: 90, y: 40 }],
        ],
        caption: '8:an är bakom deras ytterback. Driv mot straffområdet, forwards angriper första och bortre stolpen.',
      },
    ],
  },
  {
    id: 'third-man',
    title: 'Tredje man via 8:an',
    description: 'Deras 6:or följer våra 8:or tätt. 8:an kommer ner, lägger av till 6:an som är rättvänd och vänder spelet.',
    focusPositions: ['MB', 'DM', 'CM', 'HB'],
    steps: [
      {
        moves: { o10: { x: 30, y: 36 }, olw: { x: 26, y: 14 } },
        ball: 'lcb',
        arrows: [
          ['run', 'l8', 'l8'],
          ['press', 'ol6', 'ol6'],
          ['pass', 'lcb', 'l8'],
        ],
        caption: '8:an kommer ner i innerkorridoren, deras 6:a följer. Spela in i fötterna.',
      },
      {
        moves: { l8: { x: 34, y: 22 }, ol6: { x: 37, y: 23 }, six: { x: 32, y: 30 }, o10: { x: 28, y: 37 }, or6: { x: 41, y: 28 }, orw: { x: 28, y: 50 } },
        ball: 'l8',
        arrows: [
          ['run', 'six', 'six'],
          ['pass', 'l8', 'six'],
        ],
        caption: '8:an lägger av direkt till 6:an, som har tagit sig ur 10:ans skugga. Det är den tredje mannen.',
      },
      {
        moves: { six: { x: 33, y: 28 }, rwb: { x: 56, y: 63 } },
        ball: 'six',
        arrows: [
          ['pass', 'six', { x: 56, y: 61 }],
          ['run', 'r8', { x: 56, y: 50 }],
        ],
        caption: '6:an är rättvänd. De har förflyttat sig mot bollen – vänd spelet till ytterbacken på andra kanten.',
      },
    ],
  },
  {
    id: 'to-nine',
    title: 'Över pressen till 9:an',
    description: 'De pressar alla man mot man. 9:an kommer ner i centrala korridoren, lägger av, och den andra forwarden löper bakom.',
    focusPositions: ['MB', 'CF', 'CM'],
    steps: [
      {
        moves: { o9: { x: 18, y: 31 }, o10: { x: 29, y: 38 }, six: { x: 32, y: 38 }, ol6: { x: 43, y: 23 }, or6: { x: 42, y: 45 } },
        ball: 'cb',
        arrows: [
          ['press', 'o9', { x: 15, y: 33 }],
          ['run', 'lf', 'lf'],
          ['pass', 'cb', 'lf'],
        ],
        caption: 'Alla är markerade. 9:an kommer ner i centrala korridoren – spela förbi pressen direkt till hen.',
      },
      {
        moves: { lf: { x: 56, y: 30 }, olcb: { x: 59, y: 29 } },
        ball: 'lf',
        arrows: [
          ['run', 'l8', 'l8'],
          ['pass', 'lf', 'l8'],
          ['run', 'rf', 'rf'],
          ['run', 'lf', 'lf'],
        ],
        caption: '9:an har ryggen mot mål, lägger av till 8:an som kommer rättvänd och drar med sig mittbacken in mot mitten.',
      },
      {
        moves: { l8: { x: 51, y: 25 }, rf: { x: 76, y: 36 }, ol6: { x: 47, y: 22 }, lf: { x: 57, y: 35 }, olcb: { x: 60, y: 33 } },
        ball: 'l8',
        arrows: [['pass', 'l8', { x: 84, y: 34 }]],
        caption: 'Deras mittback följde 9:an upp. Spela in i ytan bakom till 11:an.',
      },
    ],
  },
];

const MIRROR: Partial<Record<Key, Key>> = {
  lcb: 'rcb',
  lwb: 'rwb',
  l8: 'r8',
  lf: 'rf',
  olb: 'orb',
  olcb: 'orcb',
  ol6: 'or6',
  olw: 'orw',
};
for (const [a, b] of Object.entries(MIRROR) as [Key, Key][]) MIRROR[b] = a;

const mirrorKey = (k: Key): Key => MIRROR[k] ?? k;
const mirrorPoint = (p: Point): Point => ({ x: p.x, y: PITCH_WIDTH - p.y });
const mirrorEnd = (e: End): End => (typeof e === 'string' ? mirrorKey(e) : mirrorPoint(e));

function mirrorStep(step: StepSpec): StepSpec {
  const moves: Partial<Record<Key, Point>> = {};
  for (const [k, p] of Object.entries(step.moves ?? {}) as [Key, Point][]) moves[mirrorKey(k)] = mirrorPoint(p);
  return {
    moves,
    ball: mirrorKey(step.ball),
    arrows: step.arrows.map(([t, a, b]) => [t, mirrorEnd(a), mirrorEnd(b)]),
    caption: step.caption,
  };
}

/** Where the ball sits relative to the player who has it. */
const BALL_OFFSET = { x: 1.6, y: 0.9 };

function buildScenario(pattern: PatternSpec, side: 'left' | 'right', now: Date): Scenario {
  const steps = side === 'left' ? pattern.steps : pattern.steps.map(mirrorStep);
  const keys = Object.keys(SLOTS) as Key[];
  const ids = Object.fromEntries(keys.map((k) => [k, newId()])) as Record<Key, string>;
  const entities: Entity[] = [
    ...keys.map((k): Entity => ({ id: ids[k], kind: 'player', ...SLOTS[k] })),
    { id: BALL_ID, kind: 'ball' },
  ];

  // Positions accumulate: each step starts where the previous one ended.
  const placements: Record<Key, Point>[] = [];
  let current = { ...BASE };
  for (const step of steps) {
    current = { ...current, ...step.moves };
    placements.push(current);
  }

  const frames: Frame[] = steps.map((step, i) => {
    const here = placements[i]!;
    const next = placements[i + 1] ?? here;
    const resolve = (e: End, at: Record<Key, Point>): Point => (typeof e === 'string' ? at[e] : e);
    const drawings: Drawing[] = step.arrows.map(([type, from, to]) => ({
      id: newId(),
      type,
      from: resolve(from, here),
      to: resolve(to, next),
    }));
    const holder = here[step.ball];
    const ballDy = side === 'left' ? BALL_OFFSET.y : -BALL_OFFSET.y;
    const positions: Record<string, Point> = { [BALL_ID]: { x: holder.x + BALL_OFFSET.x, y: holder.y + ballDy } };
    for (const k of keys) positions[ids[k]] = here[k];
    return { id: newId(), caption: step.caption, positions, drawings };
  });

  const stamp = now.toISOString();
  return {
    id: newId(),
    schemaVersion: 1,
    title: `${pattern.title} (${side === 'left' ? 'vänster' : 'höger'})`,
    description: pattern.description,
    phase: 'build-up',
    principle: SUGGESTION_PRINCIPLE,
    focusPositions: pattern.focusPositions,
    guides: ['corridors'],
    entities,
    frames,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export const SUGGESTION_PRINCIPLE = 'Uppspel 3+1 mot 4-2-3-1-press';

/** All patterns on both sides. */
export function buildUpSuggestions(now = new Date()): Scenario[] {
  return PATTERNS.flatMap((p) => [buildScenario(p, 'left', now), buildScenario(p, 'right', now)]);
}
