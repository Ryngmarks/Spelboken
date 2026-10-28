import { useMemo, useRef, useState } from 'react';
import { PHASES, POSITIONS, type Phase, type Scenario } from '../domain/types';
import { PitchView } from './PitchView';

interface LibraryProps {
  scenarios: Scenario[];
  onCreate: () => void;
  onCreateSample: () => void;
  onOpen: (s: Scenario) => void;
  onPresent: (s: Scenario) => void;
  onDuplicate: (s: Scenario) => void;
  onDelete: (s: Scenario) => void;
  onExport: (list: Scenario[]) => void;
  onImport: (file: File) => void;
  message: string | null;
}

export function Library(props: LibraryProps) {
  const { scenarios } = props;
  const [position, setPosition] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [query, setQuery] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter(
      (s) =>
        (!position || s.focusPositions.includes(position)) &&
        (!phase || s.phase === phase) &&
        (!q || `${s.title} ${s.principle} ${s.description}`.toLowerCase().includes(q)),
    );
  }, [scenarios, position, phase, query]);

  const groups = PHASES.map((p) => ({
    phase: p,
    principles: groupBy(
      filtered.filter((s) => s.phase === p.id),
      (s) => s.principle.trim() || 'Övrigt',
    ),
  })).filter((g) => g.principles.length > 0);

  return (
    <div className="library">
      <header className="library__header">
        <div className="brand">
          <img src="/icon.svg" alt="" width={36} height={36} />
          <div>
            <h1>Spelboken</h1>
            <p className="muted">Lagets spelidé – visuellt, steg för steg.</p>
          </div>
        </div>
        <div className="library__actions">
          <button className="btn btn--ghost" onClick={() => fileInput.current?.click()}>
            Importera
          </button>
          <button className="btn btn--ghost" onClick={() => props.onExport(filtered)} disabled={!filtered.length}>
            Exportera {filtered.length !== scenarios.length ? 'urval' : 'alla'}
          </button>
          <button className="btn btn--primary" onClick={props.onCreate}>
            + Nytt scenario
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) props.onImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      {props.message && (
        <p className="notice" role="status">
          {props.message}
        </p>
      )}

      {scenarios.length > 0 && (
        <div className="filters">
          <input
            type="search"
            className="filters__search"
            placeholder="Sök scenario eller princip"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Sök"
          />
          <div className="chips" role="group" aria-label="Min position">
            <span className="filters__label">Min position</span>
            <Chip on={position === null} onClick={() => setPosition(null)}>
              Alla
            </Chip>
            {POSITIONS.map((p) => (
              <Chip key={p} on={position === p} onClick={() => setPosition(position === p ? null : p)}>
                {p}
              </Chip>
            ))}
          </div>
          <div className="chips" role="group" aria-label="Spelfas">
            <span className="filters__label">Spelfas</span>
            <Chip on={phase === null} onClick={() => setPhase(null)}>
              Alla
            </Chip>
            {PHASES.map((p) => (
              <Chip key={p.id} on={phase === p.id} onClick={() => setPhase(phase === p.id ? null : p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="empty">
          <h2>Börja bygga er spelbok</h2>
          <p>
            Skapa ett scenario, placera spelarna, rita löpningar och passningar och dela upp situationen i steg. Spelarna kan sedan
            spela upp det på mobilen.
          </p>
          <div className="empty__actions">
            <button className="btn btn--primary" onClick={props.onCreate}>
              + Nytt scenario
            </button>
            <button className="btn btn--ghost" onClick={props.onCreateSample}>
              Visa ett exempel
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="empty">Inga scenarier matchar filtret.</p>
      ) : (
        groups.map(({ phase: p, principles }) => (
          <section key={p.id} className="phase">
            <h2 className="phase__title">{p.label}</h2>
            {principles.map(([principle, list]) => (
              <div key={principle} className="principle">
                <h3 className="principle__title">{principle}</h3>
                <div className="cards">
                  {list.map((s) => (
                    <ScenarioCard key={s.id} scenario={s} {...props} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function ScenarioCard({ scenario: s, onOpen, onPresent, onDuplicate, onDelete, onExport }: { scenario: Scenario } & LibraryProps) {
  const first = s.frames[0]!;
  return (
    <article className="card">
      <button className="card__preview" onClick={() => onPresent(s)} aria-label={`Spela upp ${s.title}`}>
        <PitchView entities={s.entities} positions={first.positions} drawings={first.drawings} label={`Förhandsvisning av ${s.title}`} />
        <span className="card__play" aria-hidden>
          ▶
        </span>
      </button>
      <div className="card__body">
        <h4>{s.title}</h4>
        <p className="muted">
          {s.frames.length} steg
          {s.focusPositions.length > 0 && ` · ${s.focusPositions.join(', ')}`}
        </p>
      </div>
      <div className="card__actions">
        <button className="btn btn--small" onClick={() => onOpen(s)}>
          Redigera
        </button>
        <button className="btn btn--small btn--ghost" onClick={() => onDuplicate(s)}>
          Duplicera
        </button>
        <button className="btn btn--small btn--ghost" onClick={() => onExport([s])}>
          Exportera
        </button>
        <button
          className="btn btn--small btn--ghost btn--danger-text"
          onClick={() => confirm(`Ta bort "${s.title}"?`) && onDelete(s)}
        >
          Ta bort
        </button>
      </div>
    </article>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`chip ${on ? 'chip--on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return [...map.entries()].sort(([a], [b]) => (a === 'Övrigt' ? 1 : b === 'Övrigt' ? -1 : a.localeCompare(b, 'sv')));
}
