import { useState, type FormEvent } from 'react';
import { createPerson, type Person } from '../domain/roster';
import { POSITIONS } from '../domain/types';

interface SquadProps {
  roster: Person[];
  onSave: (p: Person) => void;
  onRemove: (p: Person) => void;
  onClose: () => void;
}

/** The squad: real people who can be linked to players on the pitch. */
export function Squad({ roster, onSave, onRemove, onClose }: SquadProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [positions, setPositions] = useState<string[]>([]);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(createPerson(name, parseNumber(number), positions));
    setName('');
    setNumber('');
    setPositions([]);
  };

  return (
    <div className="squad">
      <header className="topbar">
        <button className="btn btn--ghost" onClick={onClose}>
          ← Spelboken
        </button>
        <h1 className="topbar__heading">Trupp</h1>
      </header>

      <main className="squad__body">
        <p className="muted squad__intro">
          Koppla spelarna på planen till riktiga personer. Spara bara det som behövs: namn, nummer och positioner.
          Exporterade scenariofiler innehåller aldrig namnen.
        </p>

        <form className="panel__section squad__add" onSubmit={add}>
          <h2>Lägg till spelare</h2>
          <div className="squad__row">
            <label className="field squad__name">
              <span className="field__label">Namn</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="t.ex. Anna S" maxLength={40} />
            </label>
            <label className="field squad__number">
              <span className="field__label">Nr</span>
              <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" maxLength={2} />
            </label>
          </div>
          <PositionChips value={positions} onChange={setPositions} />
          <button className="btn btn--primary" type="submit" disabled={!name.trim()}>
            Lägg till
          </button>
        </form>

        {roster.length === 0 ? (
          <p className="empty">Truppen är tom.</p>
        ) : (
          <ul className="squad__list">
            {roster.map((p) => (
              <PersonRow key={p.id} person={p} onSave={onSave} onRemove={onRemove} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function PersonRow({ person, onSave, onRemove }: { person: Person; onSave: (p: Person) => void; onRemove: (p: Person) => void }) {
  return (
    <li className="panel__section squad__person">
      <div className="squad__row">
        <label className="field squad__name">
          <span className="field__label">Namn</span>
          <input
            defaultValue={person.name}
            maxLength={40}
            onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== person.name && onSave({ ...person, name: e.target.value.trim() })}
          />
        </label>
        <label className="field squad__number">
          <span className="field__label">Nr</span>
          <input
            defaultValue={person.number ?? ''}
            inputMode="numeric"
            maxLength={2}
            onBlur={(e) => {
              const n = parseNumber(e.target.value);
              if (n !== person.number) onSave({ ...person, number: n });
            }}
          />
        </label>
      </div>
      <PositionChips value={person.positions} onChange={(positions) => onSave({ ...person, positions })} />
      <button
        className="btn btn--small btn--ghost btn--danger-text"
        onClick={() => confirm(`Ta bort ${person.name} ur truppen? Kopplingar i scenarier tas bort.`) && onRemove(person)}
      >
        Ta bort
      </button>
    </li>
  );
}

function PositionChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chips" role="group" aria-label="Positioner">
      {POSITIONS.map((pos) => {
        const on = value.includes(pos);
        return (
          <button
            key={pos}
            type="button"
            className={`chip ${on ? 'chip--on' : ''}`}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((p) => p !== pos) : [...value, pos])}
          >
            {pos}
          </button>
        );
      })}
    </div>
  );
}

function parseNumber(text: string): number | null {
  const n = Number(text.trim());
  return text.trim() && Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}
