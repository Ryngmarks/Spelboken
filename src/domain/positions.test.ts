import { describe, expect, it } from 'vitest';
import { FORMATIONS } from './formations';
import { POSITION_INFO } from './positions';
import { POSITIONS } from './types';

describe('position glossary', () => {
  const codes = [...new Set([...POSITIONS, ...Object.values(FORMATIONS).flatMap((slots) => slots.map((slot) => slot.label))])];

  it.each(codes)('explains %s with a name and description', (code) => {
    expect(POSITION_INFO[code]).toBeDefined();
    expect(POSITION_INFO[code]!.name.trim()).not.toBe('');
    expect(POSITION_INFO[code]!.description.trim()).not.toBe('');
  });
});
