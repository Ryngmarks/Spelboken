import { useRef, useState, type Dispatch, type PointerEvent } from 'react';
import { newId } from '../domain/scenario';
import { clampToPitch, distance } from '../domain/pitch';
import type { ArrowType, Point } from '../domain/types';
import type { EditorAction, EditorState } from '../editor/editorReducer';
import { ArrowShape, PitchView } from './PitchView';

const SNAP_DISTANCE = 2.6;
const MIN_DRAW_LENGTH = 1.5;

/** A gesture belongs to the pointer (finger) that started it; other pointers are ignored meanwhile. */
type Gesture = { pointerId: number } & (
  | { kind: 'move'; id: string; dragId: string; offset: Point }
  | { kind: 'arrow'; type: ArrowType; from: Point; to: Point }
  | { kind: 'zone'; from: Point; to: Point }
);

const ARROW_TOOLS: readonly string[] = ['run', 'pass', 'dribble', 'press'];

export function EditorPitch({
  state,
  dispatch,
  names,
}: {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  names: Record<string, string>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const { scenario, frameIndex, tool, selection } = state;
  const frame = scenario.frames[frameIndex]!;

  const toPitch = (e: PointerEvent): Point => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  /** Snaps to the nearest player or ball, so passes and runs start/end exactly at an entity. */
  const snap = (p: Point, except?: Point): Point => {
    let best: Point | null = null;
    let bestDist = SNAP_DISTANCE;
    for (const q of Object.values(frame.positions)) {
      const d = distance(p, q);
      if (d < bestDist && (!except || distance(q, except) > 0.01)) {
        best = q;
        bestDist = d;
      }
    }
    return best ? { ...best } : p;
  };

  const capture = (e: PointerEvent) => {
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const startArrowOrZone = (from: Point, e: PointerEvent) => {
    const { pointerId } = e;
    if (ARROW_TOOLS.includes(tool)) {
      setGesture({ pointerId, kind: 'arrow', type: tool as ArrowType, from, to: from });
      capture(e);
    } else if (tool === 'zone') {
      setGesture({ pointerId, kind: 'zone', from, to: from });
      capture(e);
    }
  };

  const onBackgroundPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || gesture) return;
    const p = clampToPitch(toPitch(e));
    if (tool === 'add-home' || tool === 'add-away') {
      dispatch({ type: 'addPlayer', team: tool === 'add-home' ? 'home' : 'away', at: p });
      return;
    }
    if (tool === 'select') {
      dispatch({ type: 'select', selection: null });
      return;
    }
    startArrowOrZone(tool === 'zone' ? p : snap(p), e);
  };

  const onEntityPointerDown = (id: string, e: PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    if (gesture) {
      e.stopPropagation();
      return;
    }
    if (tool !== 'select') {
      // Arrows start from the entity; placement tools ignore clicks on existing entities.
      e.stopPropagation();
      const at = frame.positions[id];
      if (at && tool !== 'add-home' && tool !== 'add-away') startArrowOrZone({ ...at }, e);
      return;
    }
    e.stopPropagation();
    dispatch({ type: 'select', selection: { kind: 'entity', id } });
    const at = frame.positions[id];
    if (!at) return;
    const p = toPitch(e);
    setGesture({ pointerId: e.pointerId, kind: 'move', id, dragId: newId(), offset: { x: at.x - p.x, y: at.y - p.y } });
    capture(e);
  };

  const onDrawingPointerDown = (id: string, e: PointerEvent<SVGGElement>) => {
    if (tool !== 'select' || e.button !== 0 || gesture) return;
    e.stopPropagation();
    dispatch({ type: 'select', selection: { kind: 'drawing', id } });
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    const p = toPitch(e);
    if (gesture.kind === 'move') {
      dispatch({
        type: 'moveEntity',
        id: gesture.id,
        dragId: gesture.dragId,
        to: clampToPitch({ x: p.x + gesture.offset.x, y: p.y + gesture.offset.y }),
      });
    } else if (gesture.kind === 'arrow') {
      setGesture({ ...gesture, to: snap(clampToPitch(p), gesture.from) });
    } else {
      setGesture({ ...gesture, to: clampToPitch(p, 0) });
    }
  };

  /** Cancelled pointer (e.g. the browser took over the touch): keep moves made so far, discard drawings. */
  const onPointerCancel = (e: PointerEvent<SVGSVGElement>) => {
    if (gesture && e.pointerId === gesture.pointerId) setGesture(null);
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    if (gesture.kind === 'arrow' && distance(gesture.from, gesture.to) >= MIN_DRAW_LENGTH) {
      dispatch({
        type: 'addDrawing',
        drawing: { id: newId(), type: gesture.type, from: gesture.from, to: gesture.to },
      });
    } else if (gesture.kind === 'zone') {
      const { from, to } = gesture;
      const width = Math.abs(to.x - from.x);
      const height = Math.abs(to.y - from.y);
      if (width >= MIN_DRAW_LENGTH && height >= MIN_DRAW_LENGTH) {
        dispatch({
          type: 'addDrawing',
          drawing: {
            id: newId(),
            type: 'zone',
            origin: { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y) },
            width,
            height,
          },
        });
      }
    }
    setGesture(null);
  };

  const overlay =
    gesture?.kind === 'arrow' ? (
      <g className="drawing drawing--preview">
        <ArrowShape type={gesture.type} from={gesture.from} to={gesture.to} />
      </g>
    ) : gesture?.kind === 'zone' ? (
      <rect
        className="zone drawing--preview"
        x={Math.min(gesture.from.x, gesture.to.x)}
        y={Math.min(gesture.from.y, gesture.to.y)}
        width={Math.abs(gesture.to.x - gesture.from.x)}
        height={Math.abs(gesture.to.y - gesture.from.y)}
        rx={0.8}
      />
    ) : null;

  return (
    <PitchView
      svgRef={svgRef}
      interactive
      className={`pitch--tool-${tool}`}
      entities={scenario.entities}
      positions={frame.positions}
      drawings={frame.drawings}
      selection={selection}
      names={names}
      guides={scenario.guides}
      overlay={overlay}
      onBackgroundPointerDown={onBackgroundPointerDown}
      onEntityPointerDown={onEntityPointerDown}
      onDrawingPointerDown={onDrawingPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      label={`Spelplan, steg ${frameIndex + 1}`}
    />
  );
}
