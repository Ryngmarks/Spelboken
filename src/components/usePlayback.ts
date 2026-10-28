import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { interpolatePositions } from '../domain/scenario';
import type { Frame, Point } from '../domain/types';
import { initialPlayback, playbackReducer, type PlaybackAction, type PlaybackState } from './playbackReducer';

export const MOVE_MS = 1400;
export const HOLD_MS = 1800;

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
 * `next` animates; `prev` and `goTo` jump instantly. Pausing freezes a running transition.
 */
export function usePlayback(frames: Frame[]): Playback {
  const last = frames.length - 1;
  const reducer = useCallback((s: PlaybackState, a: PlaybackAction) => playbackReducer(last, s, a), [last]);
  const [state, dispatch] = useReducer(reducer, initialPlayback);
  const reducedMotion = useRef(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Transition animation. Restarts only when a transition starts or resumes, not on every progress update.
  const animating = state.progress !== null && !state.frozen;
  const progressRef = useRef(state.progress);
  progressRef.current = state.progress;
  useEffect(() => {
    if (!animating) return;
    if (reducedMotion.current) {
      dispatch({ type: 'arrive' });
      return;
    }
    let raf = 0;
    const start = performance.now() - (progressRef.current ?? 0) * MOVE_MS;
    const tick = (now: number) => {
      const p = (now - start) / MOVE_MS;
      if (p >= 1) {
        dispatch({ type: 'arrive' });
      } else {
        dispatch({ type: 'progress', value: p });
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animating, state.index]);

  // Autoplay: hold on the frame, then start the next transition.
  useEffect(() => {
    if (!state.playing || state.progress !== null) return;
    const t = setTimeout(() => dispatch({ type: 'advance' }), state.index >= last ? 0 : HOLD_MS);
    return () => clearTimeout(t);
  }, [state.playing, state.progress, state.index, last]);

  const controls = useMemo(
    () => ({
      play: () => dispatch({ type: 'play' }),
      pause: () => dispatch({ type: 'pause' }),
      next: () => dispatch({ type: 'next' }),
      prev: () => dispatch({ type: 'prev' }),
      goTo: (index: number) => dispatch({ type: 'goTo', index }),
    }),
    [],
  );

  const index = Math.min(state.index, last);
  const current = frames[index]!;
  const following = frames[index + 1];
  const moving = state.progress !== null && following !== undefined;
  return {
    ...controls,
    index,
    playing: state.playing,
    moving,
    positions: moving ? interpolatePositions(current, following, state.progress!) : current.positions,
    drawingOpacity: moving ? Math.max(0, 1 - state.progress! * 2.5) : 1,
  };
}
