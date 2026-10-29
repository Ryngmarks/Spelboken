/** Pure gesture rules of the movement prototype (throwaway; deleted in WO-06). Both variants write through `planMove`. */
import { arrowTypeFor, planMove, reconcileLinks } from '../domain/movement';
import { moveEntity, newId } from '../domain/scenario';
import type { ArrowType, Scenario } from '../domain/types';

/** a = forward-plan, b = keyframe-with-ghost. */
export type Variant = 'a' | 'b';
/** `move` is variant A's "Rörelse", `arrow` is variant B's "Pil" (free arrows). */
export type Tool = 'select' | 'move' | 'arrow' | 'zone' | 'add-home' | 'add-away';

export type DragPlan =
  | { mode: 'plain'; frame: number }
  | { mode: 'linked'; owner: number; kind: ArrowType };

/** True when the ball's position in step k is derived from a linked pass/dribble in step k-1 (WO-04 review m3). */
function ballIsDerived(s: Scenario, k: number): boolean {
  const ball = s.entities.find((e) => e.kind === 'ball');
  if (!ball) return false;
  const linked = (s.frames[k - 1]?.drawings ?? []).filter((d) => d.type !== 'zone' && !!d.entityId);
  const pass = linked.find((d) => d.type !== 'zone' && d.entityId === ball.id);
  if (pass) return pass.type !== 'zone' && !!pass.targetId;
  return linked.some((d) => d.type === 'dribble');
}

/**
 * What dragging a token does.
 * A: "Rörelse" writes step k+1 (owner = k); "Flytta" is a plain move in step k.
 * B: in step >= 2 a drag writes step k and the arrow lives in step k-1 (owner = k-1); step 1 is a plain move.
 * A plain drag of a ball that a pass/dribble in the previous step controls would silently snap back, so it
 * re-targets that pass instead (m3).
 */
export function planDrag(s: Scenario, variant: Variant, tool: Tool, k: number, entityId: string): DragPlan {
  const linked = variant === 'a' ? tool === 'move' : tool === 'select' && k > 0;
  if (linked) {
    const owner = variant === 'a' ? k : k - 1;
    return { mode: 'linked', owner, kind: arrowTypeFor(s, owner, entityId) };
  }
  const isBall = s.entities.find((e) => e.id === entityId)?.kind === 'ball';
  if (isBall && k > 0 && ballIsDerived(s, k)) return { mode: 'linked', owner: k - 1, kind: 'pass' };
  return { mode: 'plain', frame: k };
}

export function applyDrag(
  s: Scenario,
  plan: DragPlan,
  entityId: string,
  to: { x: number; y: number },
  targetId?: string,
): Scenario {
  if (plan.mode === 'plain') return moveEntity(s, plan.frame, entityId, to);
  return planMove(s, plan.owner, { entityId, to, arrowId: newId(), newFrameId: newId(), targetId });
}

/** Changes the type of an arrow in frame `owner`; links are kept (reconcile drops what no longer fits). */
export function setArrowType(s: Scenario, owner: number, id: string, type: ArrowType): Scenario {
  const frames = s.frames.map((f, i) =>
    i === owner
      ? { ...f, drawings: f.drawings.map((d) => (d.id === id && d.type !== 'zone' ? { ...d, type } : d)) }
      : f,
  );
  return reconcileLinks({ ...s, frames });
}
