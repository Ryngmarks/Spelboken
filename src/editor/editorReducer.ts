import { linkPerson, type Person } from '../domain/roster';
import {
  addDrawing,
  addPlayer,
  applyFormation,
  ensureBall,
  insertFrameAfter,
  moveEntity,
  moveFrame,
  removeDrawing,
  removeEntity,
  removeFrame,
  setCaption,
  updateMeta,
  updatePlayer,
  type ScenarioMeta,
} from '../domain/scenario';
import type { ArrowType, Drawing, PitchGuide, PlayerEntity, Point, Scenario, Team } from '../domain/types';

export type Tool = 'select' | ArrowType | 'zone' | 'add-home' | 'add-away';

export type Selection = { kind: 'entity' | 'drawing'; id: string } | null;

export interface EditorState {
  scenario: Scenario;
  frameIndex: number;
  tool: Tool;
  selection: Selection;
  past: Scenario[];
  future: Scenario[];
  /** Consecutive changes with the same key (a drag, typing in one field) form one undo step. */
  coalesceKey: string | null;
}

export type EditorAction =
  | { type: 'setTool'; tool: Tool }
  | { type: 'selectFrame'; index: number }
  | { type: 'select'; selection: Selection }
  | { type: 'moveEntity'; id: string; to: Point; dragId: string }
  | { type: 'addPlayer'; team: Team; at: Point }
  | { type: 'addBall'; at: Point }
  | { type: 'applyFormation'; team: Team; formation: string }
  | { type: 'updatePlayer'; id: string; patch: Partial<Pick<PlayerEntity, 'number' | 'label' | 'team'>> }
  | { type: 'linkPerson'; id: string; person: Person | null }
  | { type: 'removeSelected' }
  | { type: 'addDrawing'; drawing: Drawing }
  | { type: 'insertFrame' }
  | { type: 'removeFrame' }
  | { type: 'moveFrame'; from: number; to: number }
  | { type: 'setCaption'; caption: string }
  | { type: 'updateMeta'; patch: Partial<ScenarioMeta> }
  | { type: 'toggleGuide'; guide: PitchGuide }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 100;

export function initEditor(scenario: Scenario): EditorState {
  return {
    scenario,
    frameIndex: 0,
    tool: 'select',
    selection: null,
    past: [],
    future: [],
    coalesceKey: null,
  };
}

function commit(
  state: EditorState,
  scenario: Scenario,
  extra: Partial<EditorState> = {},
  coalesceKey: string | null = null,
): EditorState {
  if (scenario === state.scenario) return { ...state, ...extra };
  const merge = coalesceKey !== null && coalesceKey === state.coalesceKey;
  return {
    ...state,
    ...extra,
    scenario,
    past: merge ? state.past : [...state.past, state.scenario].slice(-HISTORY_LIMIT),
    future: [],
    coalesceKey,
  };
}

function clampFrame(index: number, scenario: Scenario): number {
  return Math.min(Math.max(0, index), scenario.frames.length - 1);
}

/** Keeps the selection only if it still points at something in the current frame. */
function validSelection(selection: Selection, scenario: Scenario, frameIndex: number): Selection {
  if (!selection) return null;
  if (selection.kind === 'entity') {
    return scenario.entities.some((e) => e.id === selection.id) ? selection : null;
  }
  return scenario.frames[frameIndex]?.drawings.some((d) => d.id === selection.id) ? selection : null;
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { scenario, frameIndex } = state;
  switch (action.type) {
    case 'setTool':
      return { ...state, tool: action.tool, selection: null };
    case 'selectFrame': {
      const index = clampFrame(action.index, scenario);
      return {
        ...state,
        frameIndex: index,
        selection: validSelection(state.selection, scenario, index),
        coalesceKey: null,
      };
    }
    case 'select':
      return { ...state, selection: action.selection };
    case 'moveEntity':
      return commit(
        state,
        moveEntity(scenario, frameIndex, action.id, action.to),
        {},
        `move:${action.dragId}`,
      );
    case 'addPlayer': {
      const { scenario: next, id } = addPlayer(scenario, action.team, action.at);
      return commit(state, next, { selection: { kind: 'entity', id } });
    }
    case 'addBall':
      return commit(state, ensureBall(scenario, action.at));
    case 'applyFormation':
      return commit(state, applyFormation(scenario, action.team, action.formation), { selection: null });
    case 'updatePlayer':
      return commit(state, updatePlayer(scenario, action.id, action.patch), {}, `player:${action.id}`);
    case 'linkPerson':
      return commit(state, linkPerson(scenario, action.id, action.person));
    case 'removeSelected': {
      const sel = state.selection;
      if (!sel) return state;
      const next =
        sel.kind === 'entity'
          ? removeEntity(scenario, sel.id)
          : removeDrawing(scenario, frameIndex, sel.id);
      return commit(state, next, { selection: null });
    }
    case 'addDrawing':
      return commit(state, addDrawing(scenario, frameIndex, action.drawing), {
        selection: { kind: 'drawing', id: action.drawing.id },
      });
    case 'insertFrame':
      return commit(state, insertFrameAfter(scenario, frameIndex), {
        frameIndex: frameIndex + 1,
        selection: null,
      });
    case 'removeFrame': {
      const next = removeFrame(scenario, frameIndex);
      return commit(state, next, { frameIndex: clampFrame(frameIndex, next), selection: null });
    }
    case 'moveFrame': {
      const next = moveFrame(scenario, action.from, action.to);
      const index = next === scenario ? frameIndex : clampFrame(action.to, next);
      return commit(state, next, { frameIndex: index });
    }
    case 'setCaption':
      return commit(state, setCaption(scenario, frameIndex, action.caption), {}, `caption:${frameIndex}`);
    case 'updateMeta': {
      const fields = Object.keys(action.patch).sort().join(',');
      return commit(state, updateMeta(scenario, action.patch), {}, `meta:${fields}`);
    }
    case 'toggleGuide': {
      const on = scenario.guides.includes(action.guide);
      const guides = on ? scenario.guides.filter((g) => g !== action.guide) : [...scenario.guides, action.guide];
      // Each toggle is its own undo step.
      return commit(state, updateMeta(scenario, { guides }));
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        scenario: previous,
        past: state.past.slice(0, -1),
        future: [state.scenario, ...state.future],
        frameIndex: clampFrame(frameIndex, previous),
        selection: validSelection(state.selection, previous, clampFrame(frameIndex, previous)),
        coalesceKey: null,
      };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        scenario: next,
        past: [...state.past, state.scenario],
        future: state.future.slice(1),
        frameIndex: clampFrame(frameIndex, next),
        selection: validSelection(state.selection, next, clampFrame(frameIndex, next)),
        coalesceKey: null,
      };
    }
  }
}
