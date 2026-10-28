import { describe, expect, it } from 'vitest';
import { initialPlayback, playbackReducer, type PlaybackAction, type PlaybackState } from './playbackReducer';

const LAST = 2; // three frames
const run = (s: PlaybackState, ...actions: PlaybackAction[]) =>
  actions.reduce((acc, a) => playbackReducer(LAST, acc, a), s);

describe('playbackReducer', () => {
  it('autoplays through all frames and stops at the end', () => {
    let s = run(initialPlayback, { type: 'play' }, { type: 'advance' });
    expect(s.progress).toBe(0);
    s = run(s, { type: 'progress', value: 0.5 }, { type: 'arrive' }, { type: 'advance' }, { type: 'arrive' });
    expect(s.index).toBe(2);
    s = run(s, { type: 'advance' });
    expect(s.playing).toBe(false);
  });

  it('pausing mid-transition freezes progress until resumed', () => {
    let s = run(initialPlayback, { type: 'play' }, { type: 'advance' }, { type: 'progress', value: 0.4 }, { type: 'pause' });
    expect(s).toMatchObject({ playing: false, frozen: true, progress: 0.4, index: 0 });
    // Late animation callbacks must not move a frozen transition.
    s = run(s, { type: 'progress', value: 0.9 }, { type: 'arrive' });
    expect(s).toMatchObject({ progress: 0.4, index: 0 });
    s = run(s, { type: 'play' });
    expect(s).toMatchObject({ playing: true, frozen: false, progress: 0.4 });
  });

  it('next resumes a frozen transition without autoplay', () => {
    const s = run(initialPlayback, { type: 'next' }, { type: 'progress', value: 0.3 }, { type: 'pause' }, { type: 'next' });
    expect(s).toMatchObject({ playing: false, frozen: false, progress: 0.3 });
  });

  it('prev during a transition returns to its start; otherwise steps back', () => {
    expect(run({ ...initialPlayback, index: 1, progress: 0.5 }, { type: 'prev' })).toMatchObject({ index: 1, progress: null });
    expect(run({ ...initialPlayback, index: 1 }, { type: 'prev' }).index).toBe(0);
    expect(run(initialPlayback, { type: 'prev' }).index).toBe(0);
  });

  it('play at the end restarts from the first frame', () => {
    expect(run({ ...initialPlayback, index: LAST }, { type: 'play' })).toMatchObject({ index: 0, playing: true });
  });

  it('next does nothing on the last frame', () => {
    const s = { ...initialPlayback, index: LAST };
    expect(run(s, { type: 'next' })).toBe(s);
  });
});
