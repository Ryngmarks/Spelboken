/** Pitch coordinates in metres. x = 0 is the home team's own goal line; home attacks towards x = PITCH_LENGTH. */
export interface Point {
  x: number;
  y: number;
}

export type Team = 'home' | 'away';

export interface PlayerEntity {
  id: string;
  kind: 'player';
  team: Team;
  number: number;
  /** Optional short role label, e.g. "VY". */
  label: string;
  /** The real squad member this player represents (home team only). */
  personId?: string;
}

export interface BallEntity {
  id: string;
  kind: 'ball';
}

export type Entity = PlayerEntity | BallEntity;

export type ArrowType = 'run' | 'pass' | 'dribble' | 'press';

export interface ArrowDrawing {
  id: string;
  type: ArrowType;
  from: Point;
  to: Point;
  entityId?: string;
  targetId?: string;
}

export interface ZoneDrawing {
  id: string;
  type: 'zone';
  /** Top-left corner. */
  origin: Point;
  width: number;
  height: number;
}

export type Drawing = ArrowDrawing | ZoneDrawing;

export interface Frame {
  id: string;
  caption: string;
  positions: Record<string, Point>;
  drawings: Drawing[];
}

/** Optional reference lines drawn on the pitch. */
export type PitchGuide = 'corridors' | 'thirds';

export const PITCH_GUIDES: { id: PitchGuide; label: string }[] = [
  { id: 'corridors', label: 'Korridorer' },
  { id: 'thirds', label: 'Tredjedelar' },
];

export type Phase =
  | 'build-up'
  | 'attack'
  | 'transition-attack'
  | 'defence'
  | 'transition-defence'
  | 'set-piece';

export interface Scenario {
  id: string;
  schemaVersion: 1;
  title: string;
  description: string;
  phase: Phase;
  principle: string;
  focusPositions: string[];
  /** Reference lines shown on the pitch for this scenario. */
  guides: PitchGuide[];
  entities: Entity[];
  frames: Frame[];
  createdAt: string;
  updatedAt: string;
}

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'build-up', label: 'Uppspel' },
  { id: 'attack', label: 'Anfallsspel' },
  { id: 'transition-attack', label: 'Omställning offensiv' },
  { id: 'defence', label: 'Försvarsspel & press' },
  { id: 'transition-defence', label: 'Omställning defensiv' },
  { id: 'set-piece', label: 'Fasta situationer' },
];

export const POSITIONS = ['MV', 'HB', 'MB', 'VB', 'DM', 'CM', 'OM', 'HY', 'VY', 'CF'] as const;

export const ARROW_LABELS: Record<ArrowType, string> = {
  run: 'Löpning',
  pass: 'Passning',
  dribble: 'Dribbling',
  press: 'Press',
};

export function phaseLabel(phase: Phase): string {
  return PHASES.find((p) => p.id === phase)?.label ?? phase;
}
