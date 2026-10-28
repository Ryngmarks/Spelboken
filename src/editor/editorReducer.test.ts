import { describe, expect, it } from 'vitest';
import { BALL_ID, createScenario } from '../domain/scenario';
import { editorReducer, initEditor, type EditorAction, type EditorState } from './editorReducer';

const run = (state: EditorState, ...actions: EditorAction[]) => actions.reduce(editorReducer, state);
const move = (x: number, dragId: string): EditorAction => ({
  type: 'moveEntity',
  id: BALL_ID,
  to: { x, y: x },
  dragId,
});

describe('editorReducer', () => {
  it('merges a drag into one undo step', () => {
    const start = initEditor(createScenario());
    const s = run(start, move(10, 'd1'), move(20, 'd1'), move(30, 'd1'));
    expect(s.past).toHaveLength(1);
    const undone = editorReducer(s, { type: 'undo' });
    expect(undone.scenario).toBe(start.scenario);
    const redone = editorReducer(undone, { type: 'redo' });
    expect(redone.scenario.frames[0]!.positions[BALL_ID]).toEqual({ x: 30, y: 30 });
  });

  it('separates two drags into two undo steps', () => {
    expect(run(initEditor(createScenario()), move(10, 'd1'), move(20, 'd2')).past).toHaveLength(2);
  });

  it('adds a frame and selects it, removes it again', () => {
    let s = run(initEditor(createScenario()), { type: 'insertFrame' });
    expect(s.frameIndex).toBe(1);
    expect(s.scenario.frames).toHaveLength(2);
    s = editorReducer(s, { type: 'removeFrame' });
    expect(s.frameIndex).toBe(0);
    expect(s.scenario.frames).toHaveLength(1);
  });

  it('adds a drawing to the current frame and can delete it', () => {
    let s = run(
      initEditor(createScenario()),
      { type: 'insertFrame' },
      { type: 'addDrawing', drawing: { id: 'a1', type: 'run', from: { x: 0, y: 0 }, to: { x: 5, y: 5 } } },
    );
    expect(s.scenario.frames[0]!.drawings).toHaveLength(0);
    expect(s.scenario.frames[1]!.drawings).toHaveLength(1);
    expect(s.selection).toEqual({ kind: 'drawing', id: 'a1' });
    s = editorReducer(s, { type: 'removeSelected' });
    expect(s.scenario.frames[1]!.drawings).toHaveLength(0);
  });

  it('drops a drawing selection when switching frame', () => {
    const s = run(
      initEditor(createScenario()),
      { type: 'insertFrame' },
      { type: 'addDrawing', drawing: { id: 'a1', type: 'pass', from: { x: 0, y: 0 }, to: { x: 5, y: 5 } } },
      { type: 'selectFrame', index: 0 },
    );
    expect(s.selection).toBeNull();
  });

  it('coalesces typing in the caption', () => {
    const s = run(
      initEditor(createScenario()),
      { type: 'setCaption', caption: 'H' },
      { type: 'setCaption', caption: 'Hej' },
    );
    expect(s.past).toHaveLength(1);
    expect(s.scenario.frames[0]!.caption).toBe('Hej');
  });

  it('toggles pitch guides as separate undo steps', () => {
    const s = run(
      initEditor(createScenario()),
      { type: 'toggleGuide', guide: 'corridors' },
      { type: 'toggleGuide', guide: 'thirds' },
      { type: 'toggleGuide', guide: 'corridors' },
    );
    expect(s.scenario.guides).toEqual(['thirds']);
    expect(run(s, { type: 'undo' }).scenario.guides).toEqual(['corridors', 'thirds']);
  });

  it('clears redo after a new change', () => {
    const s = run(
      initEditor(createScenario()),
      { type: 'setCaption', caption: 'a' },
      { type: 'undo' },
      { type: 'updateMeta', patch: { title: 'X' } },
    );
    expect(s.future).toHaveLength(0);
  });
});
