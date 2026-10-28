import { useEffect, useReducer, useRef, useState } from 'react';
import { FORMATION_NAMES } from '../domain/formations';
import { PITCH_LENGTH, PITCH_WIDTH } from '../domain/pitch';
import { players } from '../domain/scenario';
import {
  ARROW_LABELS,
  PHASES,
  POSITIONS,
  type PlayerEntity,
  type Phase,
  type Scenario,
  type Team,
} from '../domain/types';
import { editorReducer, initEditor, type EditorAction, type EditorState, type Tool } from '../editor/editorReducer';
import { EditorPitch } from './EditorPitch';

const AUTOSAVE_MS = 400;

const TOOLS: { id: Tool; label: string; key: string; hint: string }[] = [
  { id: 'select', label: 'Flytta', key: 'v', hint: 'Markera och dra spelare och boll' },
  { id: 'run', label: ARROW_LABELS.run, key: 'r', hint: 'Dra för att rita en löpning' },
  { id: 'pass', label: ARROW_LABELS.pass, key: 'p', hint: 'Dra från spelare till spelare eller yta' },
  { id: 'dribble', label: ARROW_LABELS.dribble, key: 'd', hint: 'Dra för att rita en dribbling' },
  { id: 'press', label: ARROW_LABELS.press, key: 't', hint: 'Dra för att visa pressriktning' },
  { id: 'zone', label: 'Yta', key: 'y', hint: 'Dra en rektangel för att markera en yta' },
  { id: 'add-home', label: '+ Eget lag', key: 'h', hint: 'Klicka på planen för att placera en spelare' },
  { id: 'add-away', label: '+ Motståndare', key: 'm', hint: 'Klicka på planen för att placera en motståndare' },
];

interface EditorProps {
  initial: Scenario;
  principles: string[];
  onSave: (s: Scenario) => void;
  onClose: () => void;
  onPresent: (s: Scenario) => void;
}

export function Editor({ initial, principles, onSave, onClose, onPresent }: EditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initial, initEditor);
  const { scenario, frameIndex, tool } = state;
  const [saved, setSaved] = useState(true);
  const latest = useRef(scenario);
  latest.current = scenario;

  // Autosave, debounced. Flushes on unmount so leaving the editor never loses changes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(() => {
      onSave(scenario);
      setSaved(true);
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [scenario, onSave]);
  const dirty = useRef(false);
  dirty.current = !saved;
  useEffect(() => () => void (dirty.current && onSave(latest.current)), [onSave]);

  useKeyboardShortcuts(state, dispatch);

  const frame = scenario.frames[frameIndex]!;
  const selectedPlayer =
    state.selection?.kind === 'entity'
      ? scenario.entities.find((e): e is PlayerEntity => e.id === state.selection!.id && e.kind === 'player')
      : undefined;
  const hasBall = scenario.entities.some((e) => e.kind === 'ball');
  const activeHint = TOOLS.find((t) => t.id === tool)?.hint;

  return (
    <div className="editor">
      <header className="topbar">
        <button className="btn btn--ghost" onClick={onClose} aria-label="Tillbaka till biblioteket">
          ← Spelboken
        </button>
        <input
          className="topbar__title"
          value={scenario.title}
          onChange={(e) => dispatch({ type: 'updateMeta', patch: { title: e.target.value } })}
          aria-label="Scenariots namn"
        />
        <span className="topbar__status" aria-live="polite">
          {saved ? 'Sparat' : 'Sparar…'}
        </span>
        <div className="topbar__actions">
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'undo' })} disabled={!state.past.length} title="Ångra (Ctrl+Z)">
            Ångra
          </button>
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'redo' })} disabled={!state.future.length} title="Gör om (Ctrl+Y)">
            Gör om
          </button>
          <button className="btn btn--primary" onClick={() => onPresent(scenario)}>
            ▶ Spela upp
          </button>
        </div>
      </header>

      <div className="editor__body">
        <div className="editor__main">
          <div className="toolbar" role="toolbar" aria-label="Verktyg">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`tool tool--${t.id} ${tool === t.id ? 'tool--active' : ''}`}
                aria-pressed={tool === t.id}
                aria-label={t.label}
                onClick={() => dispatch({ type: 'setTool', tool: t.id })}
                title={`${t.hint} (${t.key.toUpperCase()})`}
              >
                <ToolIcon tool={t.id} />
                <span>{t.label}</span>
              </button>
            ))}
            {!hasBall && (
              <button className="tool" onClick={() => dispatch({ type: 'addBall', at: { x: PITCH_LENGTH / 2, y: PITCH_WIDTH / 2 } })}>
                + Boll
              </button>
            )}
          </div>
          <p className="hint">{activeHint}</p>

          <div className="pitch-wrap">
            <EditorPitch state={state} dispatch={dispatch} />
          </div>

          <Timeline state={state} dispatch={dispatch} />

          <label className="field">
            <span className="field__label">Förklaring för steg {frameIndex + 1}</span>
            <textarea
              rows={2}
              value={frame.caption}
              placeholder="Vad händer i det här steget, och varför?"
              onChange={(e) => dispatch({ type: 'setCaption', caption: e.target.value })}
            />
          </label>
        </div>

        <aside className="panel">
          {state.selection && (
            <section className="panel__section">
              <h2>{selectedPlayer ? `Spelare ${selectedPlayer.number}` : state.selection.kind === 'drawing' ? 'Markering' : 'Boll'}</h2>
              {selectedPlayer && <PlayerFields player={selectedPlayer} dispatch={dispatch} />}
              <button className="btn btn--danger" onClick={() => dispatch({ type: 'removeSelected' })}>
                Ta bort {state.selection.kind === 'drawing' ? 'markering' : selectedPlayer ? 'spelare' : 'boll'}
              </button>
              {state.selection.kind === 'entity' && (
                <p className="muted">Tas bort från alla steg.</p>
              )}
            </section>
          )}

          <section className="panel__section">
            <h2>Scenario</h2>
            <label className="field">
              <span className="field__label">Spelfas</span>
              <select
                value={scenario.phase}
                onChange={(e) => dispatch({ type: 'updateMeta', patch: { phase: e.target.value as Phase } })}
              >
                {PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Spelprincip</span>
              <input
                list="principles"
                value={scenario.principle}
                placeholder="t.ex. Spela runt första pressen"
                onChange={(e) => dispatch({ type: 'updateMeta', patch: { principle: e.target.value } })}
              />
              <datalist id="principles">
                {principles.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span className="field__label">Beskrivning</span>
              <textarea
                rows={3}
                value={scenario.description}
                placeholder="Syftet med situationen"
                onChange={(e) => dispatch({ type: 'updateMeta', patch: { description: e.target.value } })}
              />
            </label>
            <fieldset className="field">
              <legend className="field__label">Viktigt för positioner</legend>
              <div className="chips">
                {POSITIONS.map((pos) => {
                  const on = scenario.focusPositions.includes(pos);
                  return (
                    <button
                      key={pos}
                      className={`chip ${on ? 'chip--on' : ''}`}
                      aria-pressed={on}
                      onClick={() =>
                        dispatch({
                          type: 'updateMeta',
                          patch: {
                            focusPositions: on
                              ? scenario.focusPositions.filter((p) => p !== pos)
                              : [...scenario.focusPositions, pos],
                          },
                        })
                      }
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </section>

          <section className="panel__section">
            <h2>Formation</h2>
            <FormationPicker team="home" label="Eget lag" scenario={scenario} dispatch={dispatch} />
            <FormationPicker team="away" label="Motståndare" scenario={scenario} dispatch={dispatch} />
            <p className="muted">Ersätter lagets spelare i alla steg.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Timeline({ state, dispatch }: { state: EditorState; dispatch: React.Dispatch<EditorAction> }) {
  const { scenario, frameIndex } = state;
  const count = scenario.frames.length;
  return (
    <div className="timeline">
      <div className="timeline__steps" role="tablist" aria-label="Steg">
        {scenario.frames.map((f, i) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={i === frameIndex}
            className={`step ${i === frameIndex ? 'step--active' : ''}`}
            onClick={() => dispatch({ type: 'selectFrame', index: i })}
            title={f.caption || `Steg ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
        <button className="step step--add" onClick={() => dispatch({ type: 'insertFrame' })} title="Nytt steg (kopierar positionerna)">
          + Steg
        </button>
      </div>
      <div className="timeline__actions">
        <button
          className="btn btn--ghost"
          disabled={frameIndex === 0}
          onClick={() => dispatch({ type: 'moveFrame', from: frameIndex, to: frameIndex - 1 })}
          aria-label="Flytta steget bakåt"
        >
          ←
        </button>
        <button
          className="btn btn--ghost"
          disabled={frameIndex === count - 1}
          onClick={() => dispatch({ type: 'moveFrame', from: frameIndex, to: frameIndex + 1 })}
          aria-label="Flytta steget framåt"
        >
          →
        </button>
        <button className="btn btn--ghost" disabled={count === 1} onClick={() => dispatch({ type: 'removeFrame' })}>
          Ta bort steg
        </button>
      </div>
    </div>
  );
}

function PlayerFields({ player, dispatch }: { player: PlayerEntity; dispatch: React.Dispatch<EditorAction> }) {
  return (
    <div className="field-row">
      <label className="field">
        <span className="field__label">Nummer</span>
        <input
          type="number"
          min={1}
          max={99}
          value={player.number}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= 1 && n <= 99) dispatch({ type: 'updatePlayer', id: player.id, patch: { number: n } });
          }}
        />
      </label>
      <label className="field">
        <span className="field__label">Roll</span>
        <input
          maxLength={4}
          value={player.label}
          placeholder="VY"
          onChange={(e) => dispatch({ type: 'updatePlayer', id: player.id, patch: { label: e.target.value.toUpperCase() } })}
        />
      </label>
      <label className="field">
        <span className="field__label">Lag</span>
        <select
          value={player.team}
          onChange={(e) => dispatch({ type: 'updatePlayer', id: player.id, patch: { team: e.target.value as Team } })}
        >
          <option value="home">Eget</option>
          <option value="away">Motst.</option>
        </select>
      </label>
    </div>
  );
}

function FormationPicker({
  team,
  label,
  scenario,
  dispatch,
}: {
  team: Team;
  label: string;
  scenario: Scenario;
  dispatch: React.Dispatch<EditorAction>;
}) {
  const count = players(scenario, team).length;
  return (
    <label className="field field--inline">
      <span className="field__label">
        {label} <span className="muted">({count})</span>
      </span>
      <select
        value=""
        onChange={(e) => {
          const formation = e.target.value;
          if (!formation) return;
          if (count > 0 && !confirm(`Ersätta ${count} spelare med ${formation}?`)) return;
          dispatch({ type: 'applyFormation', team, formation });
        }}
      >
        <option value="">Välj…</option>
        {FORMATION_NAMES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolIcon({ tool }: { tool: Tool }) {
  const common = { width: 18, height: 18, viewBox: '0 0 20 20', 'aria-hidden': true } as const;
  switch (tool) {
    case 'select':
      return (
        <svg {...common}>
          <path d="M4 3 L15 10 L10 11 L8 16 Z" fill="currentColor" />
        </svg>
      );
    case 'run':
      return (
        <svg {...common}>
          <path d="M3 16 L15 4" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
          <path d="M10 4 L16 3 L15 9" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'pass':
      return (
        <svg {...common}>
          <path d="M3 16 L15 4" stroke="currentColor" strokeWidth="2" />
          <path d="M10 4 L16 3 L15 9" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'dribble':
      return (
        <svg {...common}>
          <path d="M2 14 q2 -4 4 0 t4 0 t4 0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M14 11 L18 14 L14 17" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'press':
      return (
        <svg {...common}>
          <path d="M3 10 L15 10" stroke="currentColor" strokeWidth="3" />
          <path d="M16 4 L16 16" stroke="currentColor" strokeWidth="3" />
        </svg>
      );
    case 'zone':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="14" height="12" rx="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeDasharray="3 2" />
        </svg>
      );
    case 'add-home':
    case 'add-away':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" className={`tool-dot tool-dot--${tool === 'add-home' ? 'home' : 'away'}`} />
        </svg>
      );
  }
}

function useKeyboardShortcuts(state: EditorState, dispatch: React.Dispatch<EditorAction>) {
  const hasSelection = state.selection !== null;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault();
        dispatch({ type: 'removeSelected' });
      } else if (e.key === 'Escape') {
        dispatch({ type: 'setTool', tool: 'select' });
      } else if (!mod && !e.altKey) {
        const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
        if (t) dispatch({ type: 'setTool', tool: t.id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, hasSelection]);
}
