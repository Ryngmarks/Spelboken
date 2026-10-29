import type { PointerEvent, ReactNode, Ref } from 'react';
import { corridorsFor, DEFAULT_PITCH, thirdsFor, type PitchSpec } from '../domain/pitch';
import type { ArrowDrawing, Drawing, Entity, PitchGuide, Point } from '../domain/types';
import type { Selection } from '../editor/editorReducer';
import { arrowHitWidthPx, entityHitRadiusPx } from './hitTest';

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
  /** Reference lines such as corridors and thirds. */
  guides?: PitchGuide[];
  /** Pitch size and markings. Defaults to 11 v 11 (105 × 68). */
  pitch?: PitchSpec;
  /** Rendered scale (CSS px per metre). When given, touch hit areas are sized in screen pixels. */
  pxPerMetre?: number;
  /** Where players and ball stood in the previous step; drawn faint and not interactive. */
  ghostPositions?: Record<string, Point>;
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
    pitch = DEFAULT_PITCH,
    pxPerMetre,
    ghostPositions,
  } = props;
  const portrait = orientation === 'portrait' && !interactive;
  const [vw, vh] = portrait ? [pitch.width, pitch.length] : [pitch.length, pitch.width];

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
      <g transform={portrait ? `translate(0 ${pitch.length}) rotate(-90)` : undefined}>
      <PitchMarkings pitch={pitch} />
      {props.guides && props.guides.length > 0 && <PitchGuides guides={props.guides} portrait={portrait} pitch={pitch} />}
      <g opacity={drawingOpacity}>
        {drawings.map((d) => (
          <DrawingShape
            key={d.id}
            drawing={d}
            positions={positions}
            selected={selection?.kind === 'drawing' && selection.id === d.id}
            onPointerDown={props.onDrawingPointerDown}
            pxPerMetre={pxPerMetre}
          />
        ))}
      </g>
      {ghostPositions && (
        <g className="ghosts" aria-hidden pointerEvents="none">
          {entities.map((e) => {
            const g = ghostPositions[e.id];
            if (!g) return null;
            return (
              <circle
                key={e.id}
                cx={g.x}
                cy={g.y}
                r={e.kind === 'ball' ? BALL_RADIUS : PLAYER_RADIUS}
                className={`ghost ghost--${e.kind === 'ball' ? 'ball' : e.team}`}
              />
            );
          })}
        </g>
      )}
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
              pxPerMetre={pxPerMetre}
            />
          );
        })}
      {overlay}
      </g>
    </svg>
  );
}

function PitchMarkings({ pitch }: { pitch: PitchSpec }) {
  const { length: L, width: W, boxDepth, boxHalf, sixDepth, sixHalf, goalHalf, circleRadius: r } = pitch;
  const midY = W / 2;
  const arcDy = Math.sqrt(Math.max(0, r * r - (boxDepth - pitch.spotDistance) ** 2));
  const stripes = 10;

  const end = (flip: boolean) => {
    const x = (v: number) => (flip ? L - v : v);
    return (
      <>
        <rect x={Math.min(x(0), x(boxDepth))} y={midY - boxHalf} width={boxDepth} height={boxHalf * 2} />
        <rect x={Math.min(x(0), x(sixDepth))} y={midY - sixHalf} width={sixDepth} height={sixHalf * 2} />
        <circle cx={x(pitch.spotDistance)} cy={midY} r={0.25} className="pitch__spot" />
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

/** Corridors and thirds as dashed lines with labels. Labels stay upright in portrait mode. */
function PitchGuides({ guides, portrait, pitch }: { guides: PitchGuide[]; portrait: boolean; pitch: PitchSpec }) {
  const L = pitch.length;
  const W = pitch.width;
  const upright = portrait ? ' rotate(90)' : '';
  const corridors = guides.includes('corridors');
  const thirds = guides.includes('thirds');
  return (
    <g className="guides" aria-hidden>
      {corridors &&
        corridorsFor(pitch).map((b, i) => (
          <g key={`c${i}`}>
            {/* Inner corridors (half-spaces) are tinted so the five lanes are easy to tell apart. */}
            {(i === 1 || i === 3) && <rect x={0} y={b.from} width={L} height={b.to - b.from} className="guides__tint" />}
            {i > 0 && <line x1={0} y1={b.from} x2={L} y2={b.from} className="guides__line" />}
            <text className="guides__label" transform={`translate(${L * 0.75} ${(b.from + b.to) / 2})${upright}`}>
              {b.label}
            </text>
          </g>
        ))}
      {thirds &&
        thirdsFor(pitch).map((b, i) => (
          <g key={`t${i}`}>
            {i > 0 && <line x1={b.from} y1={0} x2={b.from} y2={W} className="guides__line guides__line--thirds" />}
            {/* Along the far touchline; in portrait that is the right edge, so anchor the text there. */}
            <text
              className="guides__label guides__label--thirds"
              textAnchor={portrait ? 'end' : 'middle'}
              transform={`translate(${(b.from + b.to) / 2} ${W - 1.4})${upright}`}
            >
              {b.label}
            </text>
          </g>
        ))}
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
  pxPerMetre,
}: {
  drawing: Drawing;
  positions: Record<string, Point>;
  selected: boolean;
  onPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
  pxPerMetre?: number;
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
      <path
        d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
        className="drawing__hit"
        style={pxPerMetre ? { strokeWidth: arrowHitWidthPx(0) / pxPerMetre } : undefined}
      />
      <ArrowShape type={d.type} from={from} to={to} />
    </g>
  );
}

/** Hit radius in metres: the drawn one, or the 22 px touch minimum at the current scale if that is larger. */
function hitRadius(drawn: number, pxPerMetre?: number): number {
  return pxPerMetre ? entityHitRadiusPx(drawn * pxPerMetre) / pxPerMetre : drawn;
}

function EntityShape({
  entity,
  at,
  selected,
  onPointerDown,
  upright,
  name,
  pxPerMetre,
}: {
  entity: Entity;
  at: Point;
  selected: boolean;
  onPointerDown?: (id: string, e: PointerEvent<SVGGElement>) => void;
  /** Counter-rotates the entity in portrait mode so numbers stay readable. */
  upright: boolean;
  name?: string;
  pxPerMetre?: number;
}) {
  const handle = onPointerDown ? (e: PointerEvent<SVGGElement>) => onPointerDown(entity.id, e) : undefined;
  const transform = `translate(${at.x} ${at.y})${upright ? ' rotate(90)' : ''}`;
  if (entity.kind === 'ball') {
    return (
      <g className={`entity ball ${selected ? 'entity--selected' : ''}`} transform={transform} onPointerDown={handle}>
        {selected && <circle r={BALL_RADIUS + 0.9} className="entity__ring" />}
        <circle r={hitRadius(BALL_RADIUS + 1.2, pxPerMetre)} className="entity__hit" />
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
      {pxPerMetre && <circle r={hitRadius(PLAYER_RADIUS, pxPerMetre)} className="entity__hit" />}
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
