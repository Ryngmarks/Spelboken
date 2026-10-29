/**
 * Throwaway prototype of drag-to-run (WO-05, deleted in WO-06). `?proto=a` = forward-plan, `?proto=b` = keyframe-with-ghost.
 * Everything lives in memory: nothing is read from or written to localStorage.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { PitchView } from '../components/PitchView';
import { usePlayback } from '../components/usePlayback';
import { insertFrameAfter, removeDrawing } from '../domain/scenario';
import type { ArrowType, Scenario } from '../domain/types';
import { ARROW_LABELS } from '../domain/types';
import {
  createLog,
  endTask,
  formatLog,
  isWrongPick,
  ORDERS,
  PARTICIPANTS,
  QUICK_UNDO_MS,
  record,
  startTask,
  summarize,
  type EventLog,
} from './eventLog';
import { setArrowType, type Tool, type Variant } from './gestures';
import { ProtoPitch, type Sel } from './ProtoPitch';
import { createSetup } from './setup';
import { TASKS, type TokenInfo } from './tasks';
import './prototype.css';

const MAX_HISTORY = 200;

interface Doc {
  scenario: Scenario;
  past: Scenario[];
}

const TOOLS: Record<Variant, { id: Tool; label: string }[]> = {
  a: [
    { id: 'select', label: 'Flytta' },
    { id: 'move', label: 'Rörelse' },
    { id: 'zone', label: 'Yta' },
    { id: 'add-home', label: '+ Eget' },
    { id: 'add-away', label: '+ Motst.' },
  ],
  b: [
    { id: 'select', label: 'Flytta' },
    { id: 'arrow', label: 'Pil' },
    { id: 'zone', label: 'Yta' },
    { id: 'add-home', label: '+ Eget' },
    { id: 'add-away', label: '+ Motst.' },
  ],
};

function Icon({ tool }: { tool: Tool }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      {tool === 'select' && <path {...common} d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />}
      {(tool === 'move' || tool === 'arrow') && <path {...common} d="M5 19L19 5M10 5h9v9" />}
      {tool === 'zone' && <rect {...common} x="4" y="6" width="16" height="12" rx="2" strokeDasharray="3 3" />}
      {tool === 'add-home' && (
        <>
          <circle cx="12" cy="12" r="8" fill="#2f6fed" />
          <path {...common} stroke="#fff" d="M12 8v8M8 12h8" />
        </>
      )}
      {tool === 'add-away' && (
        <>
          <circle cx="12" cy="12" r="8" fill="#e5484d" />
          <path {...common} stroke="#fff" d="M12 8v8M8 12h8" />
        </>
      )}
    </svg>
  );
}

function defaultHint(variant: Variant, tool: Tool, step: number): string {
  if (tool === 'select') {
    if (variant === 'b') return step === 0 ? 'Ställ upp spelarna' : 'Dra spelarna dit de springer – förra steget syns svagt';
    return step === 0 ? 'Flytta: ställ upp spelarna. Rörelse ritar löpningar och passningar' : 'Flytta: dra en spelare till en ny plats i det här steget';
  }
  if (tool === 'move') return 'Rörelse: dra en spelare dit den ska springa i nästa steg. Dra bollen till en lagkamrat för passning';
  if (tool === 'arrow') return 'Pil: dra på planen för att rita en pil';
  if (tool === 'zone') return 'Yta: dra på planen för att rita en yta';
  return 'Tryck på planen för att lägga till en spelare';
}

export function Prototype({ variant }: { variant: Variant }) {
  const [doc, setDoc] = useState<Doc>(() => ({ scenario: createSetup(), past: [] }));
  const [frameIndex, setFrameIndex] = useState(0);
  const [tool, setTool] = useState<Tool>('select');
  const [selection, setSelection] = useState<Sel | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [view, setView] = useState<'edit' | 'play' | 'result'>('edit');
  const [observer, setObserver] = useState(false);
  const [taskId, setTaskId] = useState(TASKS[0]!.id);
  const [, setTick] = useState(0);
  const logRef = useRef<EventLog>(null as unknown as EventLog);
  if (!logRef.current) logRef.current = createLog(variant);
  const log = logRef.current;
  const { scenario } = doc;
  const last = scenario.frames.length - 1;
  const step = Math.min(frameIndex, last);

  // Keeps the running task timer ticking.
  useEffect(() => {
    if (!log.task) return;
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  });

  const logEvent = (type: string, data: Record<string, unknown> = {}) => {
    const extra = type === 'drag' ? { wrong: isWrongPick(log.task, data.token as TokenInfo) } : {};
    record(log, type, { step: step + 1, ...data, ...extra });
  };

  const commit = (next: Scenario, toFrame = step) => {
    setDoc((d) => ({ scenario: next, past: [...d.past, d.scenario].slice(-MAX_HISTORY) }));
    setFrameIndex(Math.min(toFrame, next.frames.length - 1));
  };

  const undo = () => {
    if (doc.past.length === 0) return;
    const lastDrag = [...log.events].reverse().find((e) => e.type === 'drag' || e.type === 'undo');
    const quick = lastDrag?.type === 'drag' && performance.now() - log.t0 - lastDrag.t <= QUICK_UNDO_MS;
    logEvent('undo', { quick });
    const previous = doc.past[doc.past.length - 1]!;
    setDoc({ scenario: previous, past: doc.past.slice(0, -1) });
    setFrameIndex(Math.min(step, previous.frames.length - 1));
    setSelection(null);
  };

  const reset = () => {
    logEvent('reset');
    commit(createSetup(), 0);
    setSelection(null);
    setTool('select');
  };

  const goTo = (index: number) => {
    if (index < 0 || index > last || index === step) return;
    logEvent('step-go', { to: index + 1 });
    setFrameIndex(index);
    setSelection(null);
  };

  const addStep = () => {
    logEvent('step-add');
    commit(insertFrameAfter(scenario, last), last + 1);
    setSelection(null);
    setTool('select');
  };

  const chooseTool = (next: Tool) => {
    if (next === tool) return;
    logEvent('tool', { tool: next });
    setTool(next);
    setSelection(null);
  };

  const selected = selection ? scenario.frames[selection.owner]?.drawings.find((d) => d.id === selection.id) : undefined;
  const linked = !!selected && selected.type !== 'zone' && !!selected.entityId;
  const removeLabel = !selected
    ? ''
    : selected.type === 'zone'
      ? 'Ta bort yta'
      : !linked
        ? 'Ta bort pil'
        : `Ta bort ${selected.type === 'pass' ? 'passning' : selected.type === 'dribble' ? 'dribbling' : 'löpning'}`;
  const chipTypes: ArrowType[] =
    !selected || selected.type === 'zone' ? [] : !linked ? ['run', 'pass', 'dribble', 'press'] : selected.type === 'run' || selected.type === 'press' ? ['run', 'press'] : [];

  const retype = (type: ArrowType) => {
    if (!selection) return;
    logEvent('arrow-type', { type });
    commit(setArrowType(scenario, selection.owner, selection.id, type));
  };
  const remove = () => {
    if (!selection) return;
    logEvent('arrow-remove', { linked });
    commit(removeDrawing(scenario, selection.owner, selection.id));
    setSelection(null);
  };

  const startPlay = () => {
    logEvent('play');
    setView('play');
    setSelection(null);
  };

  if (view === 'play') return <PlayView scenario={scenario} onClose={() => setView('edit')} />;
  if (view === 'result') {
    return (
      <ResultView
        log={log}
        onBack={() => setView('edit')}
        onClear={() => {
          logRef.current = createLog(variant);
          setView('edit');
        }}
      />
    );
  }

  const taskStart = [...log.events].reverse().find((e) => e.type === 'task-start')?.t ?? 0;
  const timer = log.task ? Math.round((performance.now() - log.t0 - taskStart) / 1000) : 0;

  return (
    <div className={`proto proto--${variant}`}>
      <div className="proto__side">
        <div className="proto__bar" style={{ order: 1 }}>
          <span className="proto__badge" title={variant === 'a' ? 'Framåtplanering' : 'Nyckelbild med spöke'}>
            {variant.toUpperCase()}
          </span>
          <button className="pbtn" onClick={undo} disabled={doc.past.length === 0}>
            Ångra
          </button>
          <button className="pbtn" onClick={reset}>
            Återställ
          </button>
          <span className="proto__spacer" />
          <button className={`pbtn ${log.task ? 'pbtn--live' : ''}`} onClick={() => setObserver((o) => !o)} aria-expanded={observer}>
            {log.task ? `${log.task} · ${timer} s` : 'Test'}
          </button>
          <button className="pbtn" onClick={() => setView('result')}>
            Resultat
          </button>
        </div>

        {observer && (
          <div className="proto__observer" style={{ order: 2 }}>
            <div className="proto__chips">
              {TASKS.map((t) => (
                <button key={t.id} className="pbtn pbtn--chip" aria-pressed={taskId === t.id} disabled={!!log.task} onClick={() => setTaskId(t.id)}>
                  {t.id}
                </button>
              ))}
              {log.task ? (
                <button
                  className="pbtn pbtn--primary"
                  onClick={() => {
                    endTask(log);
                    setTick((n) => n + 1);
                  }}
                >
                  Klar
                </button>
              ) : (
                <button
                  className="pbtn pbtn--primary"
                  onClick={() => {
                    startTask(log, taskId);
                    setTick((n) => n + 1);
                  }}
                >
                  Kör
                </button>
              )}
            </div>
            <p className="proto__task">{TASKS.find((t) => t.id === taskId)?.text}</p>
          </div>
        )}

        <p className="proto__hint" style={{ order: 3 }} aria-live="polite">
          {hint ?? defaultHint(variant, tool, step)}
        </p>

        {selected && (
          <div className="proto__selbar" style={{ order: 5 }}>
            {chipTypes.map((type) => (
              <button key={type} className="pbtn pbtn--chip" aria-pressed={selected.type === type} onClick={() => retype(type)}>
                {ARROW_LABELS[type]}
              </button>
            ))}
            <button className="pbtn pbtn--danger" onClick={remove}>
              {removeLabel}
            </button>
          </div>
        )}

        <div className="proto__tools" style={{ order: 6 }} role="toolbar" aria-label="Verktyg">
          {TOOLS[variant].map((t) => (
            <button key={t.id} className="tbtn" aria-pressed={tool === t.id} onClick={() => chooseTool(t.id)}>
              <Icon tool={t.id} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="proto__bar proto__timeline" style={{ order: 7 }}>
          <button className="pbtn pbtn--icon" aria-label="Föregående steg" onClick={() => goTo(step - 1)} disabled={step === 0}>
            ◀
          </button>
          <span className="proto__step" aria-live="polite">
            Steg {step + 1}/{scenario.frames.length}
          </span>
          <button className="pbtn pbtn--icon" aria-label="Nästa steg" onClick={() => goTo(step + 1)} disabled={step === last}>
            ▶
          </button>
          <button className="pbtn" onClick={addStep}>
            + Steg
          </button>
          <button className="pbtn pbtn--primary" onClick={startPlay}>
            Spela upp
          </button>
        </div>
      </div>

      <div className="proto__stage">
        <div className="proto__pitch">
          <ProtoPitch
            variant={variant}
            tool={tool}
            scenario={scenario}
            frameIndex={step}
            selection={selection}
            onCommit={commit}
            onSelect={setSelection}
            onHint={setHint}
            onLog={logEvent}
            onToolDone={() => setTool('select')}
          />
        </div>
      </div>
    </div>
  );
}

function PlayView({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const playback = usePlayback(scenario.frames);
  const { play } = playback;
  useEffect(() => {
    play();
  }, [play]);
  const done = playback.index >= scenario.frames.length - 1 && !playback.playing && !playback.moving;
  return (
    <div className="proto proto--play">
      <div className="proto__side">
        <div className="proto__bar" style={{ order: 1 }}>
          <button className="pbtn pbtn--primary" onClick={onClose}>
            Tillbaka
          </button>
          <button className="pbtn" onClick={() => (done ? playback.play() : playback.pause())}>
            {done ? 'Spela igen' : playback.playing ? 'Pausa' : 'Fortsätt'}
          </button>
          <span className="proto__step">
            Steg {playback.index + 1}/{scenario.frames.length}
          </span>
        </div>
        <p className="proto__hint" style={{ order: 3 }} aria-live="polite">
          Så här spelas det upp för spelarna
        </p>
      </div>
      <div className="proto__stage">
        <div className="proto__pitch">
          <PitchView
            entities={scenario.entities}
            positions={playback.positions}
            drawings={scenario.frames[playback.index]!.drawings}
            drawingOpacity={playback.drawingOpacity}
            label="Uppspelning"
          />
        </div>
      </div>
    </div>
  );
}

function ResultView({ log, onBack, onClear }: { log: EventLog; onBack: () => void; onClear: () => void }) {
  const [, setVersion] = useState(0);
  const [copied, setCopied] = useState<'yes' | 'manual' | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const rows = useMemo(() => summarize(log.events), [log.events.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = formatLog(log);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('yes');
    } catch {
      area.current?.select();
      setCopied(document.execCommand('copy') ? 'yes' : 'manual');
    }
  };

  return (
    <div className="proto proto--result">
      <div className="proto__result">
        <div className="proto__bar">
          <button className="pbtn pbtn--primary" onClick={onBack}>
            Tillbaka
          </button>
          <h1 className="proto__title">Resultat – variant {log.variant.toUpperCase()}</h1>
        </div>
        <div className="proto__form">
          <label>
            Deltagare
            <select
              value={log.participant}
              onChange={(e) => {
                log.participant = e.target.value;
                setVersion((n) => n + 1);
              }}
            >
              {PARTICIPANTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Ordning
            <select
              value={log.order}
              onChange={(e) => {
                log.order = e.target.value;
                setVersion((n) => n + 1);
              }}
            >
              {ORDERS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="proto__tablewrap">
          <table className="proto__table">
            <thead>
              <tr>
                <th>Uppgift</th>
                <th>Tid</th>
                <th>Drag</th>
                <th>Ångra</th>
                <th>Fel bricka</th>
                <th>Handl.</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6}>Inga avslutade uppgifter ännu. Starta med Test → Kör, avsluta med Klar.</td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.task}</td>
                  <td>{r.seconds} s</td>
                  <td>{r.drags}</td>
                  <td>
                    {r.undos} ({r.quickUndos} snabbt)
                  </td>
                  <td>{r.wrongPicks}</td>
                  <td>{r.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="proto__bar">
          <button className="pbtn pbtn--primary" onClick={copy}>
            Kopiera
          </button>
          <button
            className="pbtn pbtn--danger"
            onClick={() => {
              if (window.confirm('Rensa hela loggen? Kopiera den först om du vill spara den.')) onClear();
            }}
          >
            Rensa logg
          </button>
          <span className="proto__copied" role="status">
            {copied === 'yes' ? 'Kopierat ✓' : copied === 'manual' ? 'Markera texten nedan och kopiera själv' : ''}
          </span>
        </div>
        <textarea ref={area} className="proto__log" readOnly value={text} aria-label="Testlogg" />
      </div>
    </div>
  );
}
