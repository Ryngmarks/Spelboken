import { useCallback, useEffect, useRef, useState } from 'react';
import { interpolatePositions } from '../domain/scenario';
import type { Frame, Point } from '../domain/types';

export const MOVE_MS = 1400;
export const HOLD_MS = 1800;

interface PlaybackState {
  index: number;
  /** Progress of the transition from `index` to `index + 1`, or null when standing still. */
  progress: number | null;
  playing: boolean;
}

export interface Playback {
  index: number;
  playing: boolean;
  moving: boolean;
  positions: Record<string, Point>;
  drawingOpacity: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

/**
 * Steps through frames: hold on a frame, then animate to the next one.
 * `next` animates; `prev` and `goTo` jump instantly.
 */
export function usePlayback(frames: Frame[]): Playback {
  const [state, setState] = useState<PlaybackState>({ index: 0, progress: null, playing: false });
  const last = frames.length - 1;
  const reducedMotion = useRef(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Transition animation.
  useEffect(() => {
    if (state.progress === null) return;
    if (reducedMotion.current) {
      setState((s) => ({ ...s, index: Math.min(s.index + 1, last), progress: null }));
      return;
    }
    let raf = 0;
    const start = performance.now() - state.progress * MOVE_MS;
    const tick = (now: number) => {
      const p = (now - start) / MOVE_MS;
      if (p >= 1) {
        setState((s) => ({ ...s, index: Math.min(s.index + 1, last), progress: null }));
      } else {
        setState((s) => ({ ...s, progress: p }));
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Restart only when a transition starts, not on every progress update.
  }, [state.progress === null, state.index, last]);

  // Autoplay: hold, then start the next transition.
  useEffect(() => {
    if (!state.playing || state.progress !== null) return;
    if (state.index >= last) {
      setState((s) => ({ ...s, playing: false }));
      return;
    }
    const t = setTimeout(() => setState((s) => ({ ...s, progress: 0 })), HOLD_MS);
    return () => clearTimeout(t);
  }, [state.playing, state.progress, state.index, last]);

  const play = useCallback(
    () =>
      setState((s) =>
        // Restart from the beginning when at the end.
        s.index >= last ? { index: 0, progress: null, playing: true } : { ...s, playing: true },
      ),
    [last],
  );
  const pause = useCallback(() => setState((s) => ({ ...s, playing: false })), []);
  const next = useCallback(
    () => setState((s) => (s.index < last && s.progress === null ? { ...s, progress: 0 } : s)),
    [last],
  );
  const prev = useCallback(
    () => setState((s) => ({ index: Math.max(0, s.index - (s.progress === null ? 1 : 0)), progress: null, playing: false })),
    [],
  );
  const goTo = useCallback(
    (index: number) => setState({ index: Math.min(Math.max(0, index), last), progress: null, playing: false }),
    [last],
  );

  const index = Math.min(state.index, last);
  const current = frames[index]!;
  const following = frames[index + 1];
  const moving = state.progress !== null && following !== undefined;
  return {
    index,
    playing: state.playing,
    moving,
    positions: moving ? interpolatePositions(current, following, state.progress!) : current.positions,
    drawingOpacity: moving ? Math.max(0, 1 - state.progress! * 2.5) : 1,
    play,
    pause,
    next,
    prev,
    goTo,
  };
}
