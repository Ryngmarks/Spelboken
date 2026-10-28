export interface PlaybackState {
  index: number;
  /** Progress (0..1) of the transition from `index` to `index + 1`, or null when standing on a frame. */
  progress: number | null;
  /** Autoplay: hold on each frame, then move on. */
  playing: boolean;
  /** A transition paused halfway. */
  frozen: boolean;
}

export type PlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goTo'; index: number }
  /** Autoplay hold finished. */
  | { type: 'advance' }
  | { type: 'progress'; value: number }
  | { type: 'arrive' };

export const initialPlayback: PlaybackState = { index: 0, progress: null, playing: false, frozen: false };

export function playbackReducer(last: number, s: PlaybackState, a: PlaybackAction): PlaybackState {
  const still = (index: number): PlaybackState => ({
    index: Math.min(Math.max(0, index), last),
    progress: null,
    playing: false,
    frozen: false,
  });
  switch (a.type) {
    case 'play':
      // Restart from the beginning when at the end.
      if (s.index >= last && s.progress === null) return { ...still(0), playing: true };
      return { ...s, playing: true, frozen: false };
    case 'pause':
      return { ...s, playing: false, frozen: s.progress !== null };
    case 'next':
      if (s.progress !== null) return s.frozen ? { ...s, frozen: false } : s;
      return s.index < last ? { ...s, progress: 0 } : s;
    case 'prev':
      // During a transition, go back to where it started.
      return still(s.progress === null ? s.index - 1 : s.index);
    case 'goTo':
      return still(a.index);
    case 'advance':
      if (!s.playing || s.progress !== null) return s;
      return s.index < last ? { ...s, progress: 0 } : { ...s, playing: false };
    case 'progress':
      return s.progress === null || s.frozen ? s : { ...s, progress: a.value };
    case 'arrive':
      return s.progress === null || s.frozen ? s : { ...s, index: Math.min(s.index + 1, last), progress: null };
  }
}
