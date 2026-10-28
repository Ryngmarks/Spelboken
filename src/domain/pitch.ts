import type { Point } from './types';

export const PITCH_LENGTH = 105;
export const PITCH_WIDTH = 68;

export function clampToPitch(p: Point, margin = 3): Point {
  return {
    x: Math.min(PITCH_LENGTH + margin, Math.max(-margin, p.x)),
    y: Math.min(PITCH_WIDTH + margin, Math.max(-margin, p.y)),
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** A named strip of the pitch between two lines, in metres. */
export interface PitchBand {
  label: string;
  from: number;
  to: number;
}

// Corridor lines follow the penalty area and goal area edges, the usual Swedish coaching convention.
const BOX_HALF = 20.16;
const SIX_HALF = 9.16;
const MID_Y = PITCH_WIDTH / 2;

/** Five lanes across the width (y). */
export const CORRIDORS: PitchBand[] = [
  { label: 'Ytterkorridor', from: 0, to: MID_Y - BOX_HALF },
  { label: 'Innerkorridor', from: MID_Y - BOX_HALF, to: MID_Y - SIX_HALF },
  { label: 'Central korridor', from: MID_Y - SIX_HALF, to: MID_Y + SIX_HALF },
  { label: 'Innerkorridor', from: MID_Y + SIX_HALF, to: MID_Y + BOX_HALF },
  { label: 'Ytterkorridor', from: MID_Y + BOX_HALF, to: PITCH_WIDTH },
];

/** Three equal parts along the length (x), seen from the home team. */
export const THIRDS: PitchBand[] = [
  { label: 'Försvarstredjedel', from: 0, to: PITCH_LENGTH / 3 },
  { label: 'Mittredjedel', from: PITCH_LENGTH / 3, to: (PITCH_LENGTH * 2) / 3 },
  { label: 'Anfallstredjedel', from: (PITCH_LENGTH * 2) / 3, to: PITCH_LENGTH },
];
