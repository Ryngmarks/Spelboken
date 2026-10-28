import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutosaver, type SaveStatus } from './autosave';

describe('createAutosaver', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces and saves only the latest value', () => {
    const saved: number[] = [];
    const statuses: SaveStatus[] = [];
    const a = createAutosaver<number>((v) => saved.push(v), 400, (s) => statuses.push(s));
    a.schedule(1);
    a.schedule(2);
    vi.advanceTimersByTime(399);
    expect(saved).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(saved).toEqual([2]);
    expect(statuses.at(-1)).toBe('saved');
  });

  it('flush saves a pending value immediately, e.g. when the page is hidden', () => {
    const saved: number[] = [];
    const a = createAutosaver<number>((v) => saved.push(v), 400, () => {});
    a.schedule(7);
    expect(a.flush()).toBe(true);
    expect(saved).toEqual([7]);
    vi.advanceTimersByTime(1000);
    expect(saved).toEqual([7]);
    expect(a.flush()).toBe(true);
  });

  it('reports errors and keeps the value for a retry', () => {
    let fail = true;
    const saved: number[] = [];
    const statuses: SaveStatus[] = [];
    const a = createAutosaver<number>(
      (v) => {
        if (fail) throw new Error('QuotaExceededError');
        saved.push(v);
      },
      400,
      (s) => statuses.push(s),
    );
    a.schedule(3);
    vi.advanceTimersByTime(400);
    expect(statuses.at(-1)).toBe('error');
    expect(a.flush()).toBe(false);
    fail = false;
    expect(a.flush()).toBe(true);
    expect(saved).toEqual([3]);
  });
});
