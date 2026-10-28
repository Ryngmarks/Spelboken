import { PITCH_LENGTH, PITCH_WIDTH } from './pitch';
import type { Point, Team } from './types';

export interface FormationSlot {
  label: string;
  /** Position for a team attacking to the right, in metres. */
  at: Point;
}

const W = PITCH_WIDTH;

// Rows (x): goal 4, defence 22, defensive mid 34, mid 42, attacking mid 52, forwards 60.
// Laid out in the own half, as at kick-off. y = 0 is the top touchline, i.e. the home team's left.
export const FORMATIONS: Record<string, FormationSlot[]> = {
  '4-3-3': [
    { label: 'MV', at: { x: 4, y: W / 2 } },
    { label: 'VB', at: { x: 20, y: 8 } },
    { label: 'MB', at: { x: 17, y: 26 } },
    { label: 'MB', at: { x: 17, y: 42 } },
    { label: 'HB', at: { x: 20, y: 60 } },
    { label: 'DM', at: { x: 30, y: W / 2 } },
    { label: 'CM', at: { x: 38, y: 22 } },
    { label: 'CM', at: { x: 38, y: 46 } },
    { label: 'VY', at: { x: 47, y: 10 } },
    { label: 'CF', at: { x: 50, y: W / 2 } },
    { label: 'HY', at: { x: 47, y: 58 } },
  ],
  '4-4-2': [
    { label: 'MV', at: { x: 4, y: W / 2 } },
    { label: 'VB', at: { x: 20, y: 8 } },
    { label: 'MB', at: { x: 17, y: 26 } },
    { label: 'MB', at: { x: 17, y: 42 } },
    { label: 'HB', at: { x: 20, y: 60 } },
    { label: 'VY', at: { x: 36, y: 10 } },
    { label: 'CM', at: { x: 34, y: 27 } },
    { label: 'CM', at: { x: 34, y: 41 } },
    { label: 'HY', at: { x: 36, y: 58 } },
    { label: 'CF', at: { x: 49, y: 28 } },
    { label: 'CF', at: { x: 49, y: 40 } },
  ],
  '4-2-3-1': [
    { label: 'MV', at: { x: 4, y: W / 2 } },
    { label: 'VB', at: { x: 20, y: 8 } },
    { label: 'MB', at: { x: 17, y: 26 } },
    { label: 'MB', at: { x: 17, y: 42 } },
    { label: 'HB', at: { x: 20, y: 60 } },
    { label: 'DM', at: { x: 30, y: 27 } },
    { label: 'DM', at: { x: 30, y: 41 } },
    { label: 'VY', at: { x: 42, y: 10 } },
    { label: 'OM', at: { x: 42, y: W / 2 } },
    { label: 'HY', at: { x: 42, y: 58 } },
    { label: 'CF', at: { x: 50, y: W / 2 } },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

/** Slots for the given team. The away team is mirrored so that it attacks to the left. */
export function formationSlots(name: string, team: Team): FormationSlot[] {
  const slots = FORMATIONS[name];
  if (!slots) throw new Error(`Okänd formation: ${name}`);
  if (team === 'home') return slots;
  return slots.map((s) => ({
    label: s.label,
    at: { x: PITCH_LENGTH - s.at.x, y: PITCH_WIDTH - s.at.y },
  }));
}
