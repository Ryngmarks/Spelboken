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
