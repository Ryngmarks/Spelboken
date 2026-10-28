import type { PointerEvent, ReactNode, Ref } from 'react';
import { PITCH_LENGTH, PITCH_WIDTH } from '../domain/pitch';
import type { ArrowDrawing, Drawing, Entity, Point } from '../domain/types';
import type { Selection } from '../editor/editorReducer';

export const PLAYER_RADIUS = 1.9;
const BALL_RADIUS = 0.85;
const PAD = 4;

const ARROW_COLORS: Record<ArrowDrawing['type'], string> = {
  run: '#f8fafc',
  pass: '#fde047',
  dribble: '#7dd3fc',
  press: '#f87171',
};

export interface PitchViewProps {
  entities: Entity[];
  positions: Record<string, Point>;
  drawings: Drawing[];
  /** Opacity of the drawings, used to fade them out during playback. */
  drawingOpacity?: number;
  selection?: Selection;
  /** Extra SVG rendered on top, e.g. a drawing preview. */
  overlay?: ReactNode;
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
  interactive?: boolean;
  onBackgroundPointerDown?: (e: PointerEvent<SVGSVGElement>) => void;
  onEntityPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
  onDrawingPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
  onPointerMove?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel?: (e: PointerEvent<SVGSVGElement>) => void;
  label?: string;
  /** Names of linked squad members by entity id; shown instead of the role label. */
  names?: Record<string, string>;
  /** Portrait rotates the pitch so the home team attacks upwards. Ignored for interactive use. */
  orientation?: 'landscape' | 'portrait';
}

export function PitchView(props: PitchViewProps) {
  const {
    entities,
    positions,
    drawings,
    drawingOpacity = 1,
    selection,
    overlay,
    interactive = false,
    orientation = 'landscape',
  } = props;
  const portrait = orientation === 'portrait' && !interactive;
  const [vw, vh] = portrait ? [PITCH_WIDTH, PITCH_LENGTH] : [PITCH_LENGTH, PITCH_WIDTH];

  return (
    <svg
      ref={props.svgRef}
      className={`pitch ${interactive ? 'pitch--interactive' : ''} ${props.className ?? ''}`}
      viewBox={`${-PAD} ${-PAD} ${vw + PAD * 2} ${vh + PAD * 2}`}
      role="img"
      aria-label={props.label ?? 'Fotbollsplan'}
      onPointerDown={props.onBackgroundPointerDown}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerCancel}
    >
      <ArrowMarkers />
      {/* Portrait maps (x, y) to (y, L - x): own goal at the bottom, attacking upwards. */}
      <g transform={portrait ? `translate(0 ${PITCH_LENGTH}) rotate(-90)` : undefined}>
      <PitchMarkings />
      <g opacity={drawingOpacity}>
        {drawings.map((d) => (
          <DrawingShape
            key={d.id}
            drawing={d}
            positions={positions}
            selected={selection?.kind === 'drawing' && selection.id === d.id}
            onPointerDown={props.onDrawingPointerDown}
          />
        ))}
      </g>
      {/* Ball last so it is drawn on top of players. */}
      {[...entities]
        .sort((a, b) => (a.kind === 'ball' ? 1 : 0) - (b.kind === 'ball' ? 1 : 0))
        .map((e) => {
          const p = positions[e.id];
          if (!p) return null;
          return (
            <EntityShape
              key={e.id}
              entity={e}
              at={p}
              selected={selection?.kind === 'entity' && selection.id === e.id}
              onPointerDown={props.onEntityPointerDown}
              upright={portrait}
              name={props.names?.[e.id]}
            />
          );
        })}
      {overlay}
      </g>
    </svg>
  );
}

function PitchMarkings() {
  const L = PITCH_LENGTH;
  const W = PITCH_WIDTH;
  const midY = W / 2;
  const boxDepth = 16.5;
  const boxHalf = 20.16;
  const sixDepth = 5.5;
  const sixHalf = 9.16;
  const goalHalf = 3.66;
  const r = 9.15;
  const arcDy = Math.sqrt(r * r - (boxDepth - 11) ** 2);
  const stripes = 10;

  const end = (flip: boolean) => {
    const x = (v: number) => (flip ? L - v : v);
    return (
      <>
        <rect x={Math.min(x(0), x(boxDepth))} y={midY - boxHalf} width={boxDepth} height={boxHalf * 2} />
        <rect x={Math.min(x(0), x(sixDepth))} y={midY - sixHalf} width={sixDepth} height={sixHalf * 2} />
        <circle cx={x(11)} cy={midY} r={0.25} className="pitch__spot" />
        <path
          d={`M ${x(boxDepth)} ${midY - arcDy} A ${r} ${r} 0 0 ${flip ? 0 : 1} ${x(boxDepth)} ${midY + arcDy}`}
        />
        <rect
          x={flip ? L : -2}
          y={midY - goalHalf}
          width={2}
          height={goalHalf * 2}
          className="pitch__goal"
        />
      </>
    );
  };

  return (
    <g className="pitch__markings" aria-hidden>
      <rect x={-PAD} y={-PAD} width={L + PAD * 2} height={W + PAD * 2} className="pitch__grass" />
      {Array.from({ length: stripes }, (_, i) =>
        i % 2 === 0 ? (
          <rect key={i} x={(L / stripes) * i} y={0} width={L / stripes} height={W} className="pitch__stripe" />
        ) : null,
      )}
      <rect x={0} y={0} width={L} height={W} />
      <line x1={L / 2} y1={0} x2={L / 2} y2={W} />
      <circle cx={L / 2} cy={midY} r={r} />
      <circle cx={L / 2} cy={midY} r={0.3} className="pitch__spot" />
      {end(false)}
      {end(true)}
      <path d={`M 1 0 A 1 1 0 0 1 0 1`} />
      <path d={`M ${L - 1} 0 A 1 1 0 0 0 ${L} 1`} />
      <path d={`M 0 ${W - 1} A 1 1 0 0 1 1 ${W}`} />
      <path d={`M ${L} ${W - 1} A 1 1 0 0 0 ${L - 1} ${W}`} />
    </g>
  );
}

function ArrowMarkers() {
  return (
    <defs>
      {Object.entries(ARROW_COLORS).map(([type, color]) => (
        <marker
          key={type}
          id={`arrow-${type}`}
          viewBox="0 0 10 10"
          refX={7}
          refY={5}
          markerUnits="userSpaceOnUse"
          markerWidth={2.6}
          markerHeight={2.6}
          orient="auto-start-reverse"
        >
          {type === 'press' ? (
            <path d="M 2 0 L 2 10" stroke={color} strokeWidth={3} />
          ) : (
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          )}
        </marker>
      ))}
    </defs>
  );
}

function nearEntity(p: Point, positions: Record<string, Point>): boolean {
  return Object.values(positions).some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.6);
}

/** Shortens the arrow so it starts/ends at the edge of a player rather than its centre. */
function trimmedArrow(d: ArrowDrawing, positions: Record<string, Point>): { from: Point; to: Point } {
  const dx = d.to.x - d.from.x;
  const dy = d.to.y - d.from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const gap = PLAYER_RADIUS + 0.4;
  const startGap = nearEntity(d.from, positions) && len > gap * 2.5 ? gap : 0;
  const endGap = nearEntity(d.to, positions) && len > gap * 2.5 ? gap + 0.6 : 0;
  return {
    from: { x: d.from.x + ux * startGap, y: d.from.y + uy * startGap },
    to: { x: d.to.x - ux * endGap, y: d.to.y - uy * endGap },
  };
}

export function arrowPath(type: ArrowDrawing['type'], from: Point, to: Point): string {
  if (type !== 'dribble') return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return `M ${from.x} ${from.y}`;
  const nx = -dy / len;
  const ny = dx / len;
  // Capped so that bad data can never make rendering expensive.
  const waves = Math.min(80, Math.max(2, Math.round(len / 2.4)));
  const steps = waves * 8;
  const tail = 2; // straight end so the arrow head points the right way
  let d = `M ${from.x} ${from.y}`;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * Math.max(0, len - tail);
    const off = Math.sin((i / steps) * waves * Math.PI * 2) * 0.7;
    d += ` L ${from.x + (dx / len) * t + nx * off} ${from.y + (dy / len) * t + ny * off}`;
  }
  return `${d} L ${to.x} ${to.y}`;
}

export function ArrowShape({ type, from, to }: { type: ArrowDrawing['type']; from: Point; to: Point }) {
  return (
    <path
      d={arrowPath(type, from, to)}
      className={`arrow arrow--${type}`}
      stroke={ARROW_COLORS[type]}
      markerEnd={`url(#arrow-${type})`}
    />
  );
}

function DrawingShape({
  drawing: d,
  positions,
  selected,
  onPointerDown,
}: {
  drawing: Drawing;
  positions: Record<string, Point>;
  selected: boolean;
  onPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
}) {
  const handle = onPointerDown ? (e: PointerEvent<SVGGElement>) => onPointerDown(d.id, e) : undefined;
  if (d.type === 'zone') {
    return (
      <g className={`drawing ${selected ? 'drawing--selected' : ''}`} onPointerDown={handle}>
        <rect x={d.origin.x} y={d.origin.y} width={d.width} height={d.height} className="zone" rx={0.8} />
      </g>
    );
  }
  const { from, to } = trimmedArrow(d, positions);
  return (
    <g className={`drawing ${selected ? 'drawing--selected' : ''}`} onPointerDown={handle}>
      {/* Wide invisible stroke makes thin arrows easy to tap. */}
      <path d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} className="drawing__hit" />
      <ArrowShape type={d.type} from={from} to={to} />
    </g>
  );
}

function EntityShape({
  entity,
  at,
  selected,
  onPointerDown,
  upright,
  name,
}: {
  entity: Entity;
  at: Point;
  selected: boolean;
  onPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
  /** Counter-rotates the entity in portrait mode so numbers stay readable. */
  upright: boolean;
  name?: string;
}) {
  const handle = onPointerDown ? (e: PointerEvent<SVGGElement>) => onPointerDown(entity.id, e) : undefined;
  const transform = `translate(${at.x} ${at.y})${upright ? ' rotate(90)' : ''}`;
  if (entity.kind === 'ball') {
    return (
      <g className={`entity ball ${selected ? 'entity--selected' : ''}`} transform={transform} onPointerDown={handle}>
        {selected && <circle r={BALL_RADIUS + 0.9} className="entity__ring" />}
        <circle r={BALL_RADIUS + 1.2} className="entity__hit" />
        <circle r={BALL_RADIUS} className="ball__body" />
      </g>
    );
  }
  return (
    <g
      className={`entity player player--${entity.team} ${selected ? 'entity--selected' : ''}`}
      transform={transform}
      onPointerDown={handle}
    >
      {selected && <circle r={PLAYER_RADIUS + 0.8} className="entity__ring" />}
      <circle r={PLAYER_RADIUS} className="player__body" />
      <text className="player__number" dy="0.05em">
        {entity.number}
      </text>
      {(name || entity.label) && (
        <text className={`player__label ${name ? 'player__label--name' : ''}`} y={PLAYER_RADIUS + 1.7}>
          {name || entity.label}
        </text>
      )}
    </g>
  );
}
