import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowShape, PitchView, PLAYER_RADIUS } from '../components/PitchView';
import { hitArrow, hitEntity, nearestWithin, snapTarget, type PxPoint, type PxTarget } from '../components/hitTest';
import { ballHolder, MOVE_THRESHOLD } from '../domain/movement';
import { clampToPitch, DEFAULT_PITCH, distance } from '../domain/pitch';
import { addDrawing, addPlayer, newId } from '../domain/scenario';
import type { ArrowType, Entity, Point, Scenario } from '../domain/types';
import { applyDrag, planDrag, type DragPlan, type Tool, type Variant } from './gestures';
import type { TokenInfo } from './tasks';

/** A pass counts as "to a team-mate" while the dragged ball is this close to him [T, consult/ux-ui.md claim 4]. */
export const RECEIVER_RADIUS_PX = 44;
/** A touch has to travel this far before it is a drag rather than a tap. */
const DRAG_SLOP_PX = 8;
const MIN_DRAW_LENGTH = 1.5;
const BALL_RADIUS = 0.85;

export interface Sel {
  /** Frame that owns the drawing. */
  owner: number;
  id: string;
}

type Gesture = { pointerId: number; startPx: PxPoint; startedAt: number; moved: boolean } & (
  | { kind: 'token'; id: string; plan: DragPlan; offset: Point; to: Point; receiver: string | null }
  | { kind: 'free'; from: Point; to: Point }
  | { kind: 'zone'; from: Point; to: Point }
);

const KIND_LABEL: Record<ArrowType, string> = { run: 'Löpning', pass: 'Passning', dribble: 'Dribbling', press: 'Press' };

export function tokenInfo(e: Entity): TokenInfo {
  return e.kind === 'ball' ? { kind: 'ball' } : { kind: 'player', team: e.team, number: e.number };
}

function nameOf(e: Entity | undefined): string {
  return e && e.kind === 'player' ? `${e.number} ${e.label}`.trim() : 'bollen';
}

export function ProtoPitch({
  variant,
  tool,
  scenario,
  frameIndex,
  selection,
  onCommit,
  onSelect,
  onHint,
  onLog,
  onToolDone,
}: {
  variant: Variant;
  tool: Tool;
  scenario: Scenario;
  frameIndex: number;
  selection: Sel | null;
  onCommit: (next: Scenario) => void;
  onSelect: (sel: Sel | null) => void;
  onHint: (hint: string | null) => void;
  onLog: (type: string, data?: Record<string, unknown>) => void;
  onToolDone: () => void;
}) {
  const pitch = DEFAULT_PITCH;
  const svgRef = useRef<SVGSVGElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [pxPerMetre, setPxPerMetre] = useState<number | undefined>(undefined);
  const frame = scenario.frames[frameIndex]!;
  const previous = frameIndex > 0 ? scenario.frames[frameIndex - 1] : undefined;
  const entityById = (id: string) => scenario.entities.find((e) => e.id === id);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const ctm = svg.getScreenCTM();
      if (ctm) setPxPerMetre(Math.hypot(ctm.a, ctm.b) || undefined);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const toPitch = (e: PointerEvent): Point => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const toPx = (p: Point): PxPoint => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return p;
    const q = new DOMPoint(p.x, p.y).matrixTransform(ctm);
    return { x: q.x, y: q.y };
  };
  const entityTargets = (): (PxTarget & { at: Point })[] =>
    Object.entries(frame.positions).map(([id, at]) => ({ id, at, ...toPx(at) }));
  const snap = (p: Point, except?: Point): Point => {
    const hit = snapTarget(toPx(p), entityTargets(), except && toPx(except));
    return hit ? { ...hit.at } : p;
  };

  /** Prototype rule: the ball sits 0.8 m from its holder (2-3 px at 375 px), so a touch on the ball itself picks the ball. */
  const pick = (clientX: number, clientY: number, fallback: string): string => {
    const targets = entityTargets();
    const ball = scenario.entities.find((e) => e.kind === 'ball');
    const ballTarget = ball && targets.find((t) => t.id === ball.id);
    if (ballTarget && Math.hypot(ballTarget.x - clientX, ballTarget.y - clientY) <= BALL_RADIUS * (pxPerMetre ?? 0) + 3) return ballTarget.id;
    return hitEntity({ x: clientX, y: clientY }, targets, PLAYER_RADIUS * (pxPerMetre ?? 0))?.id ?? fallback;
  };

  /** Team-mate whose token is within 44 screen px of the dragged ball, if any. */
  const receiverFor = (plan: DragPlan, id: string, to: Point): string | null => {
    if (plan.mode !== 'linked' || entityById(id)?.kind !== 'ball') return null;
    const holder = ballHolder(scenario, plan.owner);
    const candidates = scenario.entities
      .filter((e) => e.kind === 'player' && e.id !== holder?.id && (!holder || e.team === holder.team) && frame.positions[e.id])
      .map((e) => ({ id: e.id, ...toPx(frame.positions[e.id]!) }));
    return nearestWithin(toPx(to), candidates, RECEIVER_RADIUS_PX)?.id ?? null;
  };

  const hintFor = (g: Gesture & { kind: 'token' }): string => {
    const entity = entityById(g.id);
    if (g.plan.mode === 'plain') return `Flyttar ${nameOf(entity)}`;
    if (g.receiver) return `→ ${nameOf(entityById(g.receiver))}`;
    const from = scenario.frames[g.plan.owner]!.positions[g.id]!;
    if (distance(from, g.to) < MOVE_THRESHOLD) return `${nameOf(entity)}: dra längre för att rita en rörelse`;
    return g.plan.kind === 'pass' ? 'Passning till en yta – släpp på en spelare för att bollen ska följa honom' : KIND_LABEL[g.plan.kind];
  };

  const startFree = (from: Point, e: PointerEvent, kind: 'free' | 'zone') => {
    setGesture({ pointerId: e.pointerId, startPx: { x: e.clientX, y: e.clientY }, startedAt: performance.now(), moved: true, kind, from, to: from });
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onBackgroundPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || gesture) return;
    const p = clampToPitch(toPitch(e), 3, pitch);
    if (tool === 'add-home' || tool === 'add-away') {
      onCommit(addPlayer(scenario, tool === 'add-home' ? 'home' : 'away', p).scenario);
      onLog('add-player', { team: tool === 'add-home' ? 'home' : 'away' });
      onToolDone();
      return;
    }
    onSelect(null);
    if (tool === 'select') return;
    if (tool === 'move' || tool === 'arrow') startFree(snap(p), e, 'free');
    else if (tool === 'zone') startFree(p, e, 'zone');
  };

  const onEntityPointerDown = (domId: string, e: PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (gesture || tool === 'add-home' || tool === 'add-away') return;
    const id = pick(e.clientX, e.clientY, domId);
    const at = frame.positions[id];
    if (!at) return;
    if (tool === 'arrow' || tool === 'zone') {
      startFree({ ...at }, e, tool === 'zone' ? 'zone' : 'free');
      return;
    }
    const p = toPitch(e);
    const plan = planDrag(scenario, variant, tool, frameIndex, id);
    setGesture({
      pointerId: e.pointerId,
      startPx: { x: e.clientX, y: e.clientY },
      startedAt: performance.now(),
      moved: false,
      kind: 'token',
      id,
      plan,
      offset: { x: at.x - p.x, y: at.y - p.y },
      to: { ...at },
      receiver: null,
    });
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onDrawingPointerDown = (id: string, e: PointerEvent<SVGGElement>) => {
    if ((tool !== 'select' && tool !== 'move') || e.button !== 0 || gesture) return;
    e.stopPropagation();
    onSelect({ owner: ownerOf(id), id });
  };

  /** B keeps the arrows that lead into this step in the step before. */
  const ownerOf = (id: string) =>
    variant === 'b' && frameIndex > 0 && previous?.drawings.some((d) => d.id === id) ? frameIndex - 1 : frameIndex;

  /**
   * A token's 22 px hit circle can cover an arrow (about 7 m at 375 px). A tap in the outer ring of a token that is
   * closer to an arrow line than to the token's body selects that arrow instead, so runs stay reachable.
   */
  const arrowNear = (px: PxPoint, tokenId: string): Sel | null => {
    const centre = frame.positions[tokenId] && toPx(frame.positions[tokenId]!);
    if (centre && Math.hypot(centre.x - px.x, centre.y - px.y) <= PLAYER_RADIUS * (pxPerMetre ?? 0)) return null;
    const segments = shown.flatMap((d) => (d.type === 'zone' ? [] : [{ id: d.id, from: toPx(d.from), to: toPx(d.to) }]));
    const id = hitArrow(px, segments);
    return id ? { owner: ownerOf(id), id } : null;
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    const p = toPitch(e);
    if (gesture.kind === 'token') {
      const slop = Math.hypot(e.clientX - gesture.startPx.x, e.clientY - gesture.startPx.y) >= DRAG_SLOP_PX;
      if (!gesture.moved && !slop) return;
      const to = clampToPitch({ x: p.x + gesture.offset.x, y: p.y + gesture.offset.y }, 3, pitch);
      const next = { ...gesture, moved: true, to, receiver: receiverFor(gesture.plan, gesture.id, to) };
      setGesture(next);
      onHint(hintFor(next));
    } else if (gesture.kind === 'free') {
      setGesture({ ...gesture, to: snap(clampToPitch(p, 3, pitch), gesture.from) });
    } else {
      setGesture({ ...gesture, to: clampToPitch(p, 0, pitch) });
    }
  };

  const onPointerCancel = (e: PointerEvent<SVGSVGElement>) => {
    if (gesture && e.pointerId === gesture.pointerId) {
      setGesture(null);
      onHint(null);
    }
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return;
    setGesture(null);
    onHint(null);
    if (gesture.kind === 'token') {
      const entity = entityById(gesture.id);
      if (!gesture.moved || !entity) {
        const arrow = tool === 'select' || tool === 'move' ? arrowNear(gesture.startPx, gesture.id) : null;
        if (arrow) onSelect(arrow);
        onLog('tap', { token: entity && tokenInfo(entity), arrow: !!arrow });
        return;
      }
      const from = scenario.frames[gesture.plan.mode === 'plain' ? gesture.plan.frame : gesture.plan.owner]!.positions[gesture.id]!;
      onCommit(applyDrag(scenario, gesture.plan, gesture.id, gesture.to, gesture.receiver ?? undefined));
      onLog('drag', {
        token: tokenInfo(entity),
        tool,
        kind: gesture.plan.mode === 'plain' ? 'move' : gesture.plan.kind,
        receiver: gesture.receiver ? tokenInfo(entityById(gesture.receiver)!) : undefined,
        metres: Math.round(distance(from, gesture.to) * 10) / 10,
        ms: Math.round(performance.now() - gesture.startedAt),
      });
    } else if (gesture.kind === 'free' && distance(gesture.from, gesture.to) >= MIN_DRAW_LENGTH) {
      onCommit(addDrawing(scenario, frameIndex, { id: newId(), type: 'run', from: gesture.from, to: gesture.to }));
      onLog('free-arrow');
    } else if (gesture.kind === 'zone') {
      const width = Math.abs(gesture.to.x - gesture.from.x);
      const height = Math.abs(gesture.to.y - gesture.from.y);
      if (width >= MIN_DRAW_LENGTH && height >= MIN_DRAW_LENGTH) {
        onCommit(
          addDrawing(scenario, frameIndex, {
            id: newId(),
            type: 'zone',
            origin: { x: Math.min(gesture.from.x, gesture.to.x), y: Math.min(gesture.from.y, gesture.to.y) },
            width,
            height,
          }),
        );
        onLog('zone');
      }
    }
  };

  // What is shown: B shows the arrows that lead INTO this step (stored in the step before) plus its own free drawings.
  const shown =
    variant === 'b'
      ? [
          ...(previous?.drawings.filter((d) => d.type !== 'zone' && d.entityId) ?? []),
          ...frame.drawings.filter((d) => d.type === 'zone' || !d.entityId),
        ]
      : frame.drawings;

  const dragging = gesture?.kind === 'token' && gesture.moved ? gesture : null;
  const positions = dragging && (dragging.plan.mode === 'plain' || variant === 'b') ? { ...frame.positions, [dragging.id]: dragging.to } : frame.positions;

  let overlay = null;
  if (dragging) {
    const entity = entityById(dragging.id);
    const receiver = dragging.receiver ? frame.positions[dragging.receiver] : undefined;
    const origin = dragging.plan.mode === 'linked' ? scenario.frames[dragging.plan.owner]!.positions[dragging.id] : undefined;
    overlay = (
      <g className="drawing drawing--preview">
        {origin && dragging.plan.mode === 'linked' && distance(origin, dragging.to) >= MOVE_THRESHOLD && (
          <ArrowShape type={dragging.plan.kind} from={origin} to={dragging.to} />
        )}
        {variant === 'a' && dragging.plan.mode === 'linked' && (
          <circle cx={dragging.to.x} cy={dragging.to.y} r={entity?.kind === 'ball' ? BALL_RADIUS : PLAYER_RADIUS} className="ghost proto__copy" />
        )}
        {receiver && <circle cx={receiver.x} cy={receiver.y} r={PLAYER_RADIUS + 1} className="proto__ring" />}
      </g>
    );
  } else if (gesture?.kind === 'free') {
    overlay = (
      <g className="drawing drawing--preview">
        <ArrowShape type="run" from={gesture.from} to={gesture.to} />
      </g>
    );
  } else if (gesture?.kind === 'zone') {
    overlay = (
      <rect
        className="zone drawing--preview"
        x={Math.min(gesture.from.x, gesture.to.x)}
        y={Math.min(gesture.from.y, gesture.to.y)}
        width={Math.abs(gesture.to.x - gesture.from.x)}
        height={Math.abs(gesture.to.y - gesture.from.y)}
        rx={0.8}
      />
    );
  }

  return (
    <PitchView
      svgRef={svgRef}
      interactive
      className={`pitch--tool-${tool === 'move' ? 'select' : tool}`}
      entities={scenario.entities}
      positions={positions}
      drawings={shown}
      selection={selection ? { kind: 'drawing', id: selection.id } : null}
      pitch={pitch}
      pxPerMetre={pxPerMetre}
      ghostPositions={variant === 'b' ? previous?.positions : undefined}
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
