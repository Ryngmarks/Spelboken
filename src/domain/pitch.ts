import type { Point } from './types';

/** Size and line markings of a pitch, in metres. Everything that draws or clamps to a pitch reads this. */
export interface PitchSpec {
  length: number;
  width: number;
  /** Penalty area: depth from the goal line and half its width. */
  boxDepth: number;
  boxHalf: number;
  /** Goal area. */
  sixDepth: number;
  sixHalf: number;
  /** Half the goal width. */
  goalHalf: number;
  /** Penalty spot distance from the goal line. */
  spotDistance: number;
  /** Centre circle and penalty arc radius. */
  circleRadius: number;
}

/** 11 v 11. Corridor lines follow the penalty area and goal area edges, the usual Swedish coaching convention. */
export const DEFAULT_PITCH: PitchSpec = {
  length: 105,
  width: 68,
  boxDepth: 16.5,
  boxHalf: 20.16,
  sixDepth: 5.5,
  sixHalf: 9.16,
  goalHalf: 3.66,
  spotDistance: 11,
  circleRadius: 9.15,
};

export const PITCH_LENGTH = DEFAULT_PITCH.length;
export const PITCH_WIDTH = DEFAULT_PITCH.width;

export function clampToPitch(p: Point, margin = 3, pitch: PitchSpec = DEFAULT_PITCH): Point {
  return {
    x: Math.min(pitch.length + margin, Math.max(-margin, p.x)),
    y: Math.min(pitch.width + margin, Math.max(-margin, p.y)),
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

/** Five lanes across the width (y). */
export function corridorsFor(pitch: PitchSpec): PitchBand[] {
  const mid = pitch.width / 2;
  return [
    { label: 'Ytterkorridor', from: 0, to: mid - pitch.boxHalf },
    { label: 'Innerkorridor', from: mid - pitch.boxHalf, to: mid - pitch.sixHalf },
    { label: 'Central korridor', from: mid - pitch.sixHalf, to: mid + pitch.sixHalf },
    { label: 'Innerkorridor', from: mid + pitch.sixHalf, to: mid + pitch.boxHalf },
    { label: 'Ytterkorridor', from: mid + pitch.boxHalf, to: pitch.width },
  ];
}

/** Three equal parts along the length (x), seen from the home team. */
export function thirdsFor(pitch: PitchSpec): PitchBand[] {
  const third = pitch.length / 3;
  return [
    { label: 'Försvarstredjedel', from: 0, to: third },
    { label: 'Mittredjedel', from: third, to: third * 2 },
    { label: 'Anfallstredjedel', from: third * 2, to: pitch.length },
  ];
}

export const CORRIDORS: PitchBand[] = corridorsFor(DEFAULT_PITCH);
export const THIRDS: PitchBand[] = thirdsFor(DEFAULT_PITCH);
